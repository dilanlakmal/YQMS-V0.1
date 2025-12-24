import { 
  ymProdConnection,
  ANFMeasurementReport,
 } from "../MongoDB/dbConnectionController.js";

/* ------------------------------
   AND QC DAILY REPORT 
------------------------------ */
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

/* ------------------------------
  ANF STYLE VIEW REPORT 
------------------------------ */
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
