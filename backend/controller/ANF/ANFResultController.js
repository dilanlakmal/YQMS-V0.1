import {
  ANFMeasurementReport,
  SizeCompletionStatus,
 } from "../MongoDB/dbConnectionController.js";


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

