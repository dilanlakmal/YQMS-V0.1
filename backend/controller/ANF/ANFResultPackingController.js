import {
  ANFMeasurementReportPacking,
  SizeCompletionStatusPacking
} from "../MongoDB/dbConnectionController.js";

// Endpoint to get all unique filter options for the packing results page
export const getFilterOptionsPacking = async (req, res) => {
  try {
    const [moNos, colors, qcIDs, buyers] = await Promise.all([
      ANFMeasurementReportPacking.distinct("moNo"),
      ANFMeasurementReportPacking.distinct("color"),
      ANFMeasurementReportPacking.distinct("qcID"),
      ANFMeasurementReportPacking.distinct("buyer")
    ]);

    res.json({
      moOptions: moNos.sort(),
      colorOptions: [...new Set(colors)].sort(),
      qcOptions: qcIDs.sort(),
      buyerOptions: buyers.sort()
    });
  } catch (error) {
    console.error("Error fetching filter options for packing results:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
};

// Main endpoint to get aggregated summary data (Packing)
export const getSummaryDataPacking = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required." });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    const aggregatedReports = await ANFMeasurementReportPacking.aggregate([
      { $match: { inspectionDate: { $gte: start, $lte: end } } },
      { $unwind: "$measurementDetails" },
      {
        $group: {
          _id: {
            moNo: "$moNo",
            qcID: "$qcID",
            size: "$measurementDetails.size"
          },
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
          buyer: { $first: "$buyer" },
          colors: { $first: "$color" },
          orderDetails: { $first: "$orderDetails" }
        }
      },
      {
        $project: {
          _id: 0,
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
      { $sort: { moNo: 1, qcID: 1, size: 1 } }
    ]);

    const finalResults = await Promise.all(
      aggregatedReports.map(async (report) => {
        // Check PERSISTENT PACKING STATUS
        const isCompleted = await SizeCompletionStatusPacking.findOne({
          qcID: report.qcID,
          moNo: report.moNo,
          color: { $all: [...report.colors].sort() },
          size: report.size
        }).lean();

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
    console.error("Error fetching packing summary data:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch summary data.", details: error.message });
  }
};

// Endpoint for Full Report Drill-Down (Packing)
export const getFullReportPacking = async (req, res) => {
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

    const result = await ANFMeasurementReportPacking.aggregate([
      {
        $match: {
          inspectionDate: { $gte: start, $lte: end },
          moNo: moNo,
          qcID: qcID,
          color: { $all: colorArray, $size: colorArray.length }
        }
      },
      { $unwind: "$measurementDetails" },
      { $match: { "measurementDetails.size": size } },
      { $unwind: "$measurementDetails.sizeMeasurementData" },
      { $unwind: "$measurementDetails.sizeMeasurementData.measurements" },
      {
        $group: {
          _id: "$measurementDetails.sizeMeasurementData.measurements.orderNo",
          fractions: {
            $push:
              "$measurementDetails.sizeMeasurementData.measurements.fractionValue"
          },
          buyerSpecData: { $first: "$measurementDetails.buyerSpecData" },
          inspectedDates: { $addToSet: "$inspectionDate" }
        }
      },
      {
        $group: {
          _id: null,
          buyerSpecData: { $first: "$buyerSpecData" },
          inspectedDates: { $addToSet: "$inspectedDates" },
          measurements: {
            $push: {
              orderNo: "$_id",
              fractions: "$fractions"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          buyerSpecData: 1,
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
                        input: { $setUnion: ["$$m.fractions"] },
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
      return res.status(404).json({ error: "No detailed packing data found." });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error fetching full packing report details:", error);
    res
      .status(500)
      .json({
        error: "Failed to fetch full report details.",
        details: error.message
      });
  }
};
