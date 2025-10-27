import { 
  BuyerSpecTemplate,
  ymProdConnection,
  ANFMeasurementReport,
  SizeCompletionStatus,
 } from "../MongoDB/dbConnectionController.js";

// Endpoint to get all MO Nos from the buyer spec templates for the search dropdown
export const getBuyerSpecMoNos = async (req, res) => {
  try {
      // only need the moNo field, and we sort it for a better user experience.
      const monos = await BuyerSpecTemplate.find({}, { moNo: 1, _id: 0 }).sort({
        moNo: 1
      });
      // Return an array of strings
      res.json(monos.map((m) => m.moNo));
    } catch (error) {
      console.error("Error fetching MO options for ANF Measurement:", error);
      res.status(500).json({ error: "Failed to fetch MO options" });
    }
};

// Endpoint to get details from the BuyerSpecTemplate (buyer, available sizes)
export const getBuyerSpecData = async (req, res) => {
  try {
      const { moNo } = req.params;
      const template = await BuyerSpecTemplate.findOne({ moNo: moNo });
  
      if (!template) {
        return res
          .status(404)
          .json({ error: "Spec Template not found for this MO No." });
      }
  
      // Extract buyer and all available sizes from the specData array
      const buyer = template.buyer;
      const sizes = template.specData.map((data) => data.size);
  
      res.json({ buyer, sizes });
    } catch (error) {
      console.error(
        `Error fetching template details for MO No ${req.params.moNo}:`,
        error
      );
      res.status(500).json({ error: "Failed to fetch template details" });
    }
};

// Endpoint to get comprehensive order details (colors, quantities) from the dt_orders collection
export const getAnfOrderDetails = async (req, res) => {
  try {
      const { moNo } = req.params;
      // Querying the dt_orders collection using the ymEcoConnection
      
      const order = await ymProdConnection.db
        .collection("dt_orders")
        .findOne({ Order_No: moNo });
  
      if (!order) {
        return res
          .status(404)
          .json({ error: "Order not found in dt_orders collection." });
      }
  
      // Extract unique colors for the dropdown
      const colorOptions = [
        ...new Set(order.OrderColors.map((c) => c.Color.trim()))
      ];
  
      // Create a map of color to its size quantities
      const colorQtyBySize = {};
      order.OrderColors.forEach((colorObj) => {
        const color = colorObj.Color.trim();
        colorQtyBySize[color] = {};
        colorObj.OrderQty.forEach((sizeEntry) => {
          const sizeName = Object.keys(sizeEntry)[0].split(";")[0].trim();
          const quantity = sizeEntry[sizeName];
          if (quantity > 0) {
            colorQtyBySize[color][sizeName] = quantity;
          }
        });
      });
  
      res.json({
        custStyle: order.CustStyle || "N/A",
        mode: order.Mode || "N/A",
        country: order.Country || "N/A",
        origin: order.Origin || "N/A",
        totalOrderQty: order.TotalQty,
        colorOptions: colorOptions.map((c) => ({ value: c, label: c })),
        colorQtyBySize
      });
    } catch (error) {
      console.error(
        `Error fetching order details for MO No ${req.params.moNo}:`,
        error
      );
      res.status(500).json({ error: "Failed to fetch order details." });
    }
};

// Endpoint to get the detailed spec table data for a selected MO No and Size
export const getAnfSpecTable = async (req, res) => {
  try {
      const { moNo, size } = req.query;
      if (!moNo || !size) {
        return res.status(400).json({ error: "MO No and Size are required." });
      }
  
      const template = await BuyerSpecTemplate.findOne({ moNo: moNo });
      if (!template) {
        return res
          .status(404)
          .json({ error: "Template not found for this MO No." });
      }
  
      const sizeData = template.specData.find((sd) => sd.size === size);
      if (!sizeData) {
        return res
          .status(404)
          .json({ error: `No spec data found for size ${size} in this MO.` });
      }
  
      const sortedSpecDetails = sizeData.specDetails.sort(
        (a, b) => a.orderNo - b.orderNo
      );
      res.json(sortedSpecDetails);
    } catch (error) {
      console.error("Error fetching spec table data:", error);
      res.status(500).json({ error: "Failed to fetch spec table data." });
    }
};

// Endpoint to save or update an ANF Measurement Report
export const saveBuyerSpecReport = async (req, res) => {
  try {
      const {
        inspectionDate,
        qcID,
        moNo,
        buyer,
        color,
        orderDetails,
        measurementDetails
        // We will ignore overallMeasurementSummary from the client and always recalculate it
      } = req.body;
  
      // Validation
      if (!inspectionDate || !qcID || !moNo || !color || !measurementDetails) {
        return res
          .status(400)
          .json({ error: "Missing required fields for the report." });
      }
  
      // --- FIX: Create a timezone-agnostic UTC date ---
      // This creates a date object for midnight UTC on the given day, regardless of server timezone.
      const reportDate = new Date(`${inspectionDate}T00:00:00.000Z`);
  
      // The unique key for finding the document
      const filter = {
        //inspectionDate: new Date(new Date(inspectionDate).setHours(0, 0, 0, 0)),
        inspectionDate: reportDate, // Use the standardized UTC date
        qcID,
        moNo,
        color: { $all: color.sort(), $size: color.length } // Sort colors for consistent matching
      };
  
      // Find the existing report
      let report = await ANFMeasurementReport.findOne(filter);
  
      const newSizeData = measurementDetails[0]; // We assume one size is saved at a time
  
      if (report) {
        // --- If Report Exists, Update It ---
        const existingSizeIndex = report.measurementDetails.findIndex(
          (detail) => detail.size === newSizeData.size
        );
  
        if (existingSizeIndex > -1) {
          // This size's data already exists, so we replace it to prevent duplicates
          report.measurementDetails[existingSizeIndex] = newSizeData;
        } else {
          // This is a new size for this report, so we add it
          report.measurementDetails.push(newSizeData);
        }
      } else {
        // --- If Report Does Not Exist, Create It ---
        // We're creating it in memory first, then we'll calculate the summary before saving
        report = new ANFMeasurementReport({
          //inspectionDate: filter.inspectionDate,
          inspectionDate: reportDate, // Use the standardized UTC date
          qcID,
          moNo,
          buyer,
          color: color.sort(),
          orderDetails,
          measurementDetails // This will contain the first (and only) size's data
        });
      }
  
      // --- Recalculate the overall summary AFTER updating/creating the report in memory ---
      const newOverallSummary = {
        garmentDetailsCheckedQty: 0,
        garmentDetailsOKGarment: 0,
        garmentDetailsRejected: 0,
        measurementDetailsPoints: 0,
        measurementDetailsPass: 0,
        measurementDetailsTotalIssues: 0,
        measurementDetailsTolPositive: 0,
        measurementDetailsTolNegative: 0
      };
  
      report.measurementDetails.forEach((detail) => {
        const summary = detail.sizeSummary;
        if (summary) {
          for (const key in newOverallSummary) {
            newOverallSummary[key] += summary[key] || 0;
          }
        }
      });
      // Assign the newly calculated summary to the report
      report.overallMeasurementSummary = newOverallSummary;
  
      // Save the final document (either the updated one or the brand new one)
      const savedReport = await report.save();
  
      res.status(201).json({
        message: "Measurement report saved successfully.",
        data: savedReport
      });
    } catch (error) {
      console.error("Error saving ANF Measurement Report:", error);
      // Check for unique key violation (error code 11000)
      if (error.code === 11000) {
        return res.status(409).json({
          error: "A report with these exact details already exists.",
          details: error.message
        });
      }
      res
        .status(500)
        .json({ error: "Failed to save report.", details: error.message });
    }
};

// --- MODIFIED: Endpoint to update the status of a specific size ---
export const updateReportStatus = async (req, res) => {
  try {
      const { qcID, moNo, color, size, status, inspectionDate } = req.body;
  
      // --- Validation (no change) ---
      if (!inspectionDate || !qcID || !moNo || !color || !size || !status) {
        return res.status(400).json({ error: "Missing required fields." });
      }
      if (!["In Progress", "Completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value." });
      }
  
      const sortedColors = [...color].sort();
  
      // --- LOGIC FOR THE NEW PERSISTENT STATUS COLLECTION ---
      if (status === "Completed") {
        // If we are finishing the size, create/update the persistent status record.
        // `findOneAndUpdate` with `upsert` is perfect here.
        await SizeCompletionStatus.findOneAndUpdate(
          { qcID, moNo, color: sortedColors, size },
          { status: "Completed" },
          { upsert: true, new: true, runValidators: true }
        );
      } else if (status === "In Progress") {
        // If we are continuing (unlocking), delete the persistent status record.
        await SizeCompletionStatus.deleteOne({
          qcID,
          moNo,
          color: sortedColors,
          size
        });
      }
  
      // --- KEEP THE LOGIC TO UPDATE THE CURRENT DAY'S REPORT (if it exists) ---
      // This is still useful for the specific report of that day.
      const reportDate = new Date(`${inspectionDate}T00:00:00.000Z`);
      const reportFilter = {
        inspectionDate: reportDate,
        qcID,
        moNo,
        color: { $all: sortedColors, $size: sortedColors.length }
      };
  
      await ANFMeasurementReport.updateOne(
        { ...reportFilter, "measurementDetails.size": size },
        { $set: { "measurementDetails.$.status": status } }
      );
      // Note: We don't care if this update fails (e.g., no report for today yet).
      // The persistent status is the most important part.
  
      res
        .status(200)
        .json({ message: `Size status successfully updated to '${status}'.` });
    } catch (error) {
      console.error("Error updating size status:", error);
      if (error.code === 11000) {
        // Catch potential race condition on unique index
        return res
          .status(409)
          .json({ error: "This size status is already being updated." });
      }
      res
        .status(500)
        .json({ error: "Failed to update size status.", details: error.message });
    }
};

// --- MODIFIED: Endpoint to get existing measurement data and PERSISTENT status ---
export const getReportData = async (req, res) => {
  try {
      const { date, qcId, moNo, color, size } = req.query;
  
      if (!date || !qcId || !moNo || !color || !size) {
        return res
          .status(400)
          .json({ error: "Missing required query parameters." });
      }
  
      const colorArray = (Array.isArray(color) ? color : color.split(",")).sort();
  
      // --- QUERY 1: Check for a PERSISTENT "Completed" status ---
      const persistentStatusDoc = await SizeCompletionStatus.findOne({
        qcID: qcId,
        moNo: moNo,
        color: colorArray,
        size: size
      });
  
      // --- QUERY 2: Get the measurement data FOR THE SPECIFIC DATE provided ---
      let dailyMeasurements = [];
      const reportDate = new Date(`${date}T00:00:00.000Z`);
      const reportFilter = {
        inspectionDate: reportDate,
        qcID: qcId,
        moNo: moNo,
        color: { $all: colorArray, $size: colorArray.length }
      };
      const report = await ANFMeasurementReport.findOne(reportFilter);
  
      if (report) {
        const sizeData = report.measurementDetails.find(
          (detail) => detail.size === size
        );
        if (sizeData && sizeData.sizeMeasurementData) {
          dailyMeasurements = sizeData.sizeMeasurementData;
        }
      }
  
      // --- FINAL LOGIC: Determine the status to send to the frontend ---
      // If a persistent "Completed" record exists, the status is ALWAYS 'Completed'.
      // Otherwise, it's 'In Progress'.
      const finalStatus = persistentStatusDoc ? "Completed" : "In Progress";
  
      // Return the combined result
      res.json({
        measurements: dailyMeasurements,
        status: finalStatus
      });
    } catch (error) {
      console.error("Error fetching existing measurement data:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch existing measurement data." });
    }
};

// Endpoint to get all unique filter options for the results page
export const getFilterOptions = async (req, res) => {
  try {
      const [moNos, colors, qcIDs, buyers] = await Promise.all([
        ANFMeasurementReport.distinct("moNo"),
        ANFMeasurementReport.distinct("color"),
        ANFMeasurementReport.distinct("qcID"),
        ANFMeasurementReport.distinct("buyer")
      ]);
  
      res.json({
        moOptions: moNos.sort(),
        colorOptions: [...new Set(colors)].sort(), // Ensure unique colors and sort
        qcOptions: qcIDs.sort(),
        buyerOptions: buyers.sort()
      });
    } catch (error) {
      console.error("Error fetching filter options for results:", error);
      res.status(500).json({ error: "Failed to fetch filter options" });
    }
};

// Main endpoint to get aggregated summary data
export const getSummaryData = async (req, res) => {
  try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "Start date and end date are required." });
      }
  
      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);
  
      // --- Main Aggregation Pipeline ---
      const aggregatedReports = await ANFMeasurementReport.aggregate([
        // 1. Filter by date range first for performance
        {
          $match: {
            inspectionDate: { $gte: start, $lte: end }
          }
        },
        // 2. Deconstruct the measurementDetails array to process each size
        { $unwind: "$measurementDetails" },
  
        // 3. Group by the unique key: MO, QC, and Size
        {
          $group: {
            _id: {
              moNo: "$moNo",
              qcID: "$qcID",
              size: "$measurementDetails.size"
            },
            // Sum up the summary stats across all reports for this group
            garmentDetailsCheckedQty: {
              $sum: "$measurementDetails.sizeSummary.garmentDetailsCheckedQty"
            },
            garmentDetailsOKGarment: {
              $sum: "$measurementDetails.sizeSummary.garmentDetailsOKGarment"
            },
            garmentDetailsRejected: {
              $sum: "$measurementDetails.sizeSummary.garmentDetailsRejected"
            },
            measurementDetailsPoints: {
              $sum: "$measurementDetails.sizeSummary.measurementDetailsPoints"
            },
            measurementDetailsPass: {
              $sum: "$measurementDetails.sizeSummary.measurementDetailsPass"
            },
            measurementDetailsTotalIssues: {
              $sum: "$measurementDetails.sizeSummary.measurementDetailsTotalIssues"
            },
            measurementDetailsTolPositive: {
              $sum: "$measurementDetails.sizeSummary.measurementDetailsTolPositive"
            },
            measurementDetailsTolNegative: {
              $sum: "$measurementDetails.sizeSummary.measurementDetailsTolNegative"
            },
  
            // Get the first instance of data that doesn't change
            buyer: { $first: "$buyer" },
            colors: { $first: "$color" }, // We'll get all colors from the first report
            orderDetails: { $first: "$orderDetails" }
          }
        },
        // 4. Reshape the data for the frontend
        {
          $project: {
            _id: 0, // Exclude the default _id
            moNo: "$_id.moNo",
            qcID: "$_id.qcID",
            size: "$_id.size",
            buyer: 1,
            colors: 1,
            orderDetails: 1,
            summary: {
              checkedQty: "$garmentDetailsCheckedQty",
              okGarment: "$garmentDetailsOKGarment",
              rejectedGarment: "$garmentDetailsRejected",
              totalPoints: "$measurementDetailsPoints",
              passPoints: "$measurementDetailsPass",
              issuePoints: "$measurementDetailsTotalIssues",
              tolPlus: "$measurementDetailsTolPositive",
              tolNeg: "$measurementDetailsTolNegative"
            }
          }
        },
        // 5. Sort the final results
        {
          $sort: { moNo: 1, qcID: 1, size: 1 }
        }
      ]);
  
      // --- Post-Aggregation: Check Status and Calculate Order Quantities ---
      const finalResults = await Promise.all(
        aggregatedReports.map(async (report) => {
          // Check persistent status
          const isCompleted = await SizeCompletionStatus.findOne({
            qcID: report.qcID,
            moNo: report.moNo,
            color: { $all: [...report.colors].sort() }, // ensure colors are sorted for matching
            size: report.size
          }).lean();
  
          // Calculate order quantity for the specific colors in the report
          let orderQtyForColor = 0;
          if (report.orderDetails && report.orderDetails.orderQty_bySize) {
            report.colors.forEach((color) => {
              const sizeData = report.orderDetails.orderQty_bySize[color];
              if (sizeData && sizeData[report.size]) {
                orderQtyForColor += sizeData[report.size];
              }
            });
          }
  
          return {
            ...report,
            status: isCompleted ? "Completed" : "In Progress",
            orderQty_style: report.orderDetails?.orderQty_style || 0,
            orderQty_color: orderQtyForColor
          };
        })
      );
  
      res.json(finalResults);
    } catch (error) {
      console.error("Error fetching summary data:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch summary data.", details: error.message });
    }
};

// --- Endpoint for the Full Report Drill-Down ---
export const getFullReport = async (req, res) => {
  try {
      const { startDate, endDate, moNo, qcID, size, colors } = req.query;
  
      if (!startDate || !endDate || !moNo || !qcID || !size || !colors) {
        return res
          .status(400)
          .json({ error: "All query parameters are required." });
      }
  
      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);
      const colorArray = colors.split(",").sort();
  
      // The aggregation pipeline to get all details for the selected group
      const result = await ANFMeasurementReport.aggregate([
        // 1. Match documents
        {
          $match: {
            inspectionDate: { $gte: start, $lte: end },
            moNo: moNo,
            qcID: qcID,
            color: { $all: colorArray, $size: colorArray.length }
          }
        },
        // 2. Unwind measurementDetails
        { $unwind: "$measurementDetails" },
        // 3. Match the specific size
        { $match: { "measurementDetails.size": size } },
        // 4. Unwind garment data
        { $unwind: "$measurementDetails.sizeMeasurementData" },
        // 5. Unwind the measurements
        { $unwind: "$measurementDetails.sizeMeasurementData.measurements" },
  
        // 6. Group by measurement point (orderNo) to collect all its fractions
        {
          $group: {
            _id: "$measurementDetails.sizeMeasurementData.measurements.orderNo",
            fractions: {
              $push:
                "$measurementDetails.sizeMeasurementData.measurements.fractionValue"
            },
            // Pass along the other data we need
            buyerSpecData: { $first: "$measurementDetails.buyerSpecData" },
            inspectedDates: { $addToSet: "$inspectionDate" }
          }
        },
  
        // 7. Group again to consolidate results into a single document
        {
          $group: {
            _id: null,
            buyerSpecData: { $first: "$buyerSpecData" },
            inspectedDates: { $addToSet: "$inspectedDates" }, // this will be an array of arrays
            measurements: {
              $push: {
                orderNo: "$_id",
                fractions: "$fractions"
              }
            }
          }
        },
  
        // 8. Project to reshape the final output
        {
          $project: {
            _id: 0,
            buyerSpecData: 1,
            // Flatten and sort the dates array
            inspectedDates: {
              $sortArray: {
                input: {
                  $reduce: {
                    input: "$inspectedDates",
                    initialValue: [],
                    in: { $setUnion: ["$$value", "$$this"] }
                  }
                },
                sortBy: 1
              }
            },
            // Create the final tally object
            measurementsTally: {
              $arrayToObject: {
                $map: {
                  input: "$measurements",
                  as: "m",
                  in: {
                    k: { $toString: "$$m.orderNo" },
                    v: {
                      $arrayToObject: {
                        $map: {
                          input: { $setUnion: ["$$m.fractions"] }, // Get unique fractions
                          as: "frac",
                          in: {
                            k: "$$frac",
                            v: {
                              $size: {
                                $filter: {
                                  input: "$$m.fractions",
                                  as: "f",
                                  cond: { $eq: ["$$f", "$$frac"] }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]);
  
      if (!result || result.length === 0) {
        return res
          .status(404)
          .json({ error: "No detailed data found for this selection." });
      }
  
      res.json(result[0]);
    } catch (error) {
      console.error("Error fetching full report details:", error);
      res.status(500).json({
        error: "Failed to fetch full report details.",
        details: error.message
      });
    }
};

// Endpoint to get all daily reports (each document is a report)
export const getDailyReports = async (req, res) => {
  try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "Start date and end date are required." });
      }
  
      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);
  
      const reports = await ANFMeasurementReport.find({
        inspectionDate: { $gte: start, $lte: end }
      }).sort({ inspectionDate: -1, qcID: 1 }); // Sort by most recent first
  
      res.json(reports);
    } catch (error) {
      console.error("Error fetching QC daily reports:", error);
      res.status(500).json({ error: "Failed to fetch QC daily reports" });
    }
};

// Endpoint to get DYNAMIC filter options based on a date range
export const getDynamicFilterOptions = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end date are required." });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    // Find all reports within the date range
    const reports = await ANFMeasurementReport.find(
      { inspectionDate: { $gte: start, $lte: end } },
      { buyer: 1, moNo: 1, color: 1, qcID: 1, _id: 0 } // Project only necessary fields
    ).lean();

    // Process the data to get unique values and relationships
    const buyers = new Set();
    const moNos = new Set();
    const colors = new Set();
    const qcIDs = new Set();
    const moToColorsMap = {};

    reports.forEach((report) => {
      buyers.add(report.buyer);
      moNos.add(report.moNo);
      qcIDs.add(report.qcID);

      if (!moToColorsMap[report.moNo]) {
        moToColorsMap[report.moNo] = new Set();
      }
      report.color.forEach((c) => {
        colors.add(c);
        moToColorsMap[report.moNo].add(c);
      });
    });

    // Convert the map's sets to arrays
    for (const mo in moToColorsMap) {
      moToColorsMap[mo] = Array.from(moToColorsMap[mo]).sort();
    }

    res.json({
      buyerOptions: Array.from(buyers).sort(),
      moOptions: Array.from(moNos).sort(),
      colorOptions: Array.from(colors).sort(),
      qcOptions: Array.from(qcIDs).sort(),
      moToColorsMap: moToColorsMap
    });
  } catch (error) {
    console.error("Error fetching dynamic filter options:", error);
    res.status(500).json({ error: "Failed to fetch dynamic filter options" });
  }
};

// --- NEW Endpoint for the QC Daily Full Report Page ---
export const getDailyFullReport = async (req, res) => {
  try {
        const { pageId } = req.params;
        if (!pageId) {
          return res.status(400).json({ error: "Page ID is required." });
        }
  
        // Deconstruct the pageId: e.g., "2023-10-27-QC001-MO12345"
        const parts = pageId.split("-");
        if (parts.length < 3) {
          return res.status(400).json({ error: "Invalid Page ID format." });
        }
  
        const inspectionDateStr = parts.slice(0, 3).join("-"); // Reassembles the date string
        const qcID = parts[3];
        const moNo = parts.slice(4).join("-"); // Join the rest in case MO No has hyphens
  
        // Find the specific report document
        const report = await ANFMeasurementReport.findOne({
          // Use a regex to match the date part of the ISODate
          inspectionDate: {
            $gte: new Date(inspectionDateStr),
            $lt: new Date(
              new Date(inspectionDateStr).setDate(
                new Date(inspectionDateStr).getDate() + 1
              )
            )
          },
          qcID: qcID,
          moNo: moNo
        }).lean(); // .lean() for a plain JS object, faster for read-only ops
  
        if (!report) {
          return res
            .status(404)
            .json({ error: "Report not found for the specified criteria." });
        }
  
        res.json(report);
      } catch (error) {
        console.error("Error fetching full QC daily report:", error);
        res.status(500).json({
          error: "Failed to fetch full report.",
          details: error.message
        });
      }
};

export const getanfStyleViewSummary = async (req, res) => {
  try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "Start and end date are required." });
      }
  
      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);
  
      const styleSummary = await ANFMeasurementReport.aggregate([
        // 1. Filter documents by the date range
        {
          $match: {
            inspectionDate: { $gte: start, $lte: end }
          }
        },
        // 2. Group by moNo to aggregate all data for a style
        {
          $group: {
            _id: "$moNo", // Group by the Manufacturing Order number
            // Sum up all the overall summaries from each report for this MO
            garmentDetailsCheckedQty: {
              $sum: "$overallMeasurementSummary.garmentDetailsCheckedQty"
            },
            garmentDetailsOKGarment: {
              $sum: "$overallMeasurementSummary.garmentDetailsOKGarment"
            },
            garmentDetailsRejected: {
              $sum: "$overallMeasurementSummary.garmentDetailsRejected"
            },
            measurementDetailsPoints: {
              $sum: "$overallMeasurementSummary.measurementDetailsPoints"
            },
            measurementDetailsPass: {
              $sum: "$overallMeasurementSummary.measurementDetailsPass"
            },
            measurementDetailsTotalIssues: {
              $sum: "$overallMeasurementSummary.measurementDetailsTotalIssues"
            },
            measurementDetailsTolPositive: {
              $sum: "$overallMeasurementSummary.measurementDetailsTolPositive"
            },
            measurementDetailsTolNegative: {
              $sum: "$overallMeasurementSummary.measurementDetailsTolNegative"
            },
  
            // Collect all colors from all reports into a single array
            allColors: { $push: "$color" },
  
            // Get the first instance of data that is the same for the whole MO
            buyer: { $first: "$buyer" },
            orderQty_style: { $first: "$orderDetails.orderQty_style" }
          }
        },
        // 3. Reshape the data for the frontend
        {
          $project: {
            _id: 0,
            moNo: "$_id",
            buyer: 1,
            orderQty_style: 1,
            // Flatten the array of color arrays, get unique values, and then get the count
            totalColors: {
              $size: {
                $reduce: {
                  input: "$allColors",
                  initialValue: [],
                  in: { $setUnion: ["$$value", "$$this"] }
                }
              }
            },
            // Create the summary object
            summary: {
              checkedQty: "$garmentDetailsCheckedQty",
              okGarment: "$garmentDetailsOKGarment",
              rejectedGarment: "$garmentDetailsRejected",
              totalPoints: "$measurementDetailsPoints",
              passPoints: "$measurementDetailsPass",
              issuePoints: "$measurementDetailsTotalIssues",
              tolPlus: "$measurementDetailsTolPositive",
              tolNeg: "$measurementDetailsTolNegative"
            }
          }
        },
        // 4. Sort the final results
        {
          $sort: { moNo: 1 }
        }
      ]);
  
      res.json(styleSummary);
    } catch (error) {
      console.error("Error fetching style view summary:", error);
      res.status(500).json({
        error: "Failed to fetch style view summary",
        details: error.message
      });
    }
};

// --- NEW Endpoint for the Style View Full Report Page ---
export const getStyleViewFullReport = async (req, res) => {
  try {
        const { moNo } = req.params;
        if (!moNo) {
          return res.status(400).json({ error: "MO Number is required." });
        }
  
        // --- Part 1: Fetch Order Details from dt_orders (No Change) ---
        const orderDetails = await ymProdConnection.db
          .collection("dt_orders")
          .findOne({ Order_No: moNo });
  
        if (!orderDetails) {
          return res
            .status(404)
            .json({ error: "Order Details not found for this MO Number." });
        }
  
        // --- Part 2: Use MongoDB Aggregation for all processing ---
        const aggregatedData = await ANFMeasurementReport.aggregate([
          // Stage 1: Match all reports for the given MO
          { $match: { moNo: moNo } },
  
          // Stage 2: Deconstruct the arrays to work with individual documents
          { $unwind: "$color" },
          { $unwind: "$measurementDetails" },
  
          // Stage 3: Group data by QC, Color, and Size to get all summaries
          {
            $group: {
              _id: {
                qcID: "$qcID",
                color: "$color",
                size: "$measurementDetails.size"
              },
              // Sum up the size summaries
              garmentDetailsCheckedQty: {
                $sum: "$measurementDetails.sizeSummary.garmentDetailsCheckedQty"
              },
              garmentDetailsOKGarment: {
                $sum: "$measurementDetails.sizeSummary.garmentDetailsOKGarment"
              },
              garmentDetailsRejected: {
                $sum: "$measurementDetails.sizeSummary.garmentDetailsRejected"
              },
              measurementDetailsPoints: {
                $sum: "$measurementDetails.sizeSummary.measurementDetailsPoints"
              },
              measurementDetailsPass: {
                $sum: "$measurementDetails.sizeSummary.measurementDetailsPass"
              },
              measurementDetailsTotalIssues: {
                $sum: "$measurementDetails.sizeSummary.measurementDetailsTotalIssues"
              },
              measurementDetailsTolPositive: {
                $sum: "$measurementDetails.sizeSummary.measurementDetailsTolPositive"
              },
              measurementDetailsTolNegative: {
                $sum: "$measurementDetails.sizeSummary.measurementDetailsTolNegative"
              },
  
              // Keep the first buyerSpecData we find for tally later
              buyerSpecData: { $first: "$measurementDetails.buyerSpecData" },
              // Collect all garment measurements for tally
              sizeMeasurementData: {
                $push: "$measurementDetails.sizeMeasurementData"
              }
            }
          },
  
          // Stage 4: Further group to assemble the final structure
          {
            $group: {
              _id: null,
              // A. Inspector Data: Group by QC ID
              inspectorData: {
                $push: {
                  qcID: "$_id.qcID",
                  summary: {
                    garmentDetailsCheckedQty: "$garmentDetailsCheckedQty",
                    garmentDetailsOKGarment: "$garmentDetailsOKGarment",
                    garmentDetailsRejected: "$garmentDetailsRejected",
                    measurementDetailsPoints: "$measurementDetailsPoints",
                    measurementDetailsPass: "$measurementDetailsPass",
                    measurementDetailsTotalIssues:
                      "$measurementDetailsTotalIssues",
                    measurementDetailsTolPositive:
                      "$measurementDetailsTolPositive",
                    measurementDetailsTolNegative:
                      "$measurementDetailsTolNegative"
                  }
                }
              },
              // B. Color Data: Group by Color
              colorData: {
                $push: {
                  color: "$_id.color",
                  size: "$_id.size",
                  summary: {
                    garmentDetailsCheckedQty: "$garmentDetailsCheckedQty",
                    garmentDetailsOKGarment: "$garmentDetailsOKGarment",
                    garmentDetailsRejected: "$garmentDetailsRejected",
                    measurementDetailsPoints: "$measurementDetailsPoints",
                    measurementDetailsPass: "$measurementDetailsPass",
                    measurementDetailsTotalIssues:
                      "$measurementDetailsTotalIssues",
                    measurementDetailsTolPositive:
                      "$measurementDetailsTolPositive",
                    measurementDetailsTolNegative:
                      "$measurementDetailsTolNegative"
                  },
                  buyerSpecData: "$buyerSpecData",
                  sizeMeasurementData: {
                    $reduce: {
                      input: "$sizeMeasurementData",
                      initialValue: [],
                      in: { $concatArrays: ["$$value", "$$this"] }
                    }
                  }
                }
              }
            }
          }
        ]);
  
        if (!aggregatedData || aggregatedData.length === 0) {
          return res
            .status(404)
            .json({ error: "No inspection data found for this MO Number." });
        }
  
        // --- Part 3: Final JavaScript processing (much simpler now) ---
        const result = aggregatedData[0];
  
        // A. Process Inspector Data
        const qcSummaryMap = result.inspectorData.reduce((acc, item) => {
          if (!acc[item.qcID]) acc[item.qcID] = { qcID: item.qcID };
          Object.keys(item.summary).forEach((key) => {
            acc[item.qcID][key] = (acc[item.qcID][key] || 0) + item.summary[key];
          });
          return acc;
        }, {});
  
        // B. Process Color Data
        const colorMap = result.colorData.reduce((acc, item) => {
          if (!acc[item.color]) {
            acc[item.color] = {
              color: item.color,
              summaryCards: {},
              summaryBySize: [],
              tallyBySize: []
            };
          }
          // Sum for summary cards
          Object.keys(item.summary).forEach((key) => {
            acc[item.color].summaryCards[key] =
              (acc[item.color].summaryCards[key] || 0) + item.summary[key];
          });
          // Add per-size summary
          acc[item.color].summaryBySize.push({
            size: item.size,
            sizeSummary: item.summary
          });
          // Add per-size tally
          const tally = {};
          item.sizeMeasurementData.forEach((garment) => {
            garment.measurements.forEach((m) => {
              const orderNo = m.orderNo;
              const fraction = m.fractionValue;
              if (!tally[orderNo]) tally[orderNo] = {};
              tally[orderNo][fraction] = (tally[orderNo][fraction] || 0) + 1;
            });
          });
          acc[item.color].tallyBySize.push({
            size: item.size,
            buyerSpecData: item.buyerSpecData,
            measurementsTally: tally
          });
          return acc;
        }, {});
  
        // --- Part 4: Assemble Final Payload ---
        const finalPayload = {
          orderDetails: {
            moNo: orderDetails.Order_No,
            buyer: orderDetails.Buyer,
            orderQty_style: orderDetails.TotalQty,
            custStyle: orderDetails.CustStyle,
            mode: orderDetails.Mode,
            country: orderDetails.Country,
            origin: orderDetails.Origin,
            orderColors: orderDetails.OrderColors
          },
          inspectorData: Object.values(qcSummaryMap),
          summaryByColor: Object.values(colorMap).map((c) => ({
            color: c.color,
            ...c.summaryCards
          })),
          detailsByColor: Object.values(colorMap)
        };
  
        res.json(finalPayload);
      } catch (error) {
        console.error("Error fetching style view full report:", error);
        res.status(500).json({
          error: "Failed to fetch full report.",
          details: error.message
        });
      }
};