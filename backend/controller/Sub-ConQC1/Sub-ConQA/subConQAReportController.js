import { SubconSewingQAReport } from "../../MongoDB/dbConnectionController.js";

export const getSubConQAInspectionData = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      reportType,
      factory,
      lineNo,
      moNo,
      color,
      qaId,
      qcId,
      result
    } = req.query;

    // Build match query
    const matchQuery = {};

    if (startDate && endDate) {
      matchQuery.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    if (reportType) matchQuery.reportType = reportType;
    if (factory) matchQuery.factory = factory;
    if (lineNo) matchQuery.lineNo = lineNo;
    if (moNo) matchQuery.moNo = moNo;
    if (color) matchQuery.color = color;
    if (qaId) matchQuery["preparedBy.empId"] = qaId;

    // Aggregate pipeline
    const pipeline = [
      { $match: matchQuery },
      { $sort: { inspectionDate: -1, _id: -1 } },

      // Unwind qcData to create one document per QC
      { $unwind: "$qcData" },

      // Optional: Filter by qcId if provided
      ...(qcId ? [{ $match: { "qcData.qcID": qcId } }] : []),

      // Calculate severity counts and pass rate for each QC
      {
        $addFields: {
          minorCount: {
            $reduce: {
              input: "$qcData.defectList",
              initialValue: 0,
              in: {
                $cond: [
                  { $eq: ["$$this.standardStatus", "Minor"] },
                  { $add: ["$$value", "$$this.qty"] },
                  "$$value"
                ]
              }
            }
          },
          majorCount: {
            $reduce: {
              input: "$qcData.defectList",
              initialValue: 0,
              in: {
                $cond: [
                  { $eq: ["$$this.standardStatus", "Major"] },
                  { $add: ["$$value", "$$this.qty"] },
                  "$$value"
                ]
              }
            }
          },
          criticalCount: {
            $reduce: {
              input: "$qcData.defectList",
              initialValue: 0,
              in: {
                $cond: [
                  { $eq: ["$$this.standardStatus", "Critical"] },
                  { $add: ["$$value", "$$this.qty"] },
                  "$$value"
                ]
              }
            }
          }
        }
      },

      // Calculate weighted defect sum
      {
        $addFields: {
          weightedDefectSum: {
            $reduce: {
              input: "$qcData.defectList",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $multiply: [
                      "$$this.qty",
                      {
                        $switch: {
                          branches: [
                            {
                              case: { $eq: ["$$this.standardStatus", "Minor"] },
                              then: 1
                            },
                            {
                              case: { $eq: ["$$this.standardStatus", "Major"] },
                              then: 1.5
                            },
                            {
                              case: {
                                $eq: ["$$this.standardStatus", "Critical"]
                              },
                              then: 2
                            }
                          ],
                          default: 0
                        }
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      },

      // Calculate pass rate and result
      {
        $addFields: {
          passRate: {
            $cond: [
              { $eq: ["$qcData.checkedQty", 0] },
              0,
              {
                $subtract: [
                  1,
                  { $divide: ["$weightedDefectSum", "$qcData.checkedQty"] }
                ]
              }
            ]
          }
        }
      },

      {
        $addFields: {
          passRatePercent: { $multiply: ["$passRate", 100] },
          result: {
            $switch: {
              branches: [
                {
                  case: { $eq: [{ $multiply: ["$passRate", 100] }, 100] },
                  then: "A"
                },
                {
                  case: {
                    $and: [
                      { $gte: [{ $multiply: ["$passRate", 100] }, 95] },
                      { $lt: [{ $multiply: ["$passRate", 100] }, 100] }
                    ]
                  },
                  then: "B"
                },
                {
                  case: {
                    $and: [
                      { $gte: [{ $multiply: ["$passRate", 100] }, 92.5] },
                      { $lt: [{ $multiply: ["$passRate", 100] }, 95] }
                    ]
                  },
                  then: "C"
                }
              ],
              default: "D"
            }
          },
          defectRate: {
            $cond: [
              { $eq: ["$qcData.checkedQty", 0] },
              0,
              {
                $multiply: [
                  {
                    $divide: ["$qcData.totalDefectQty", "$qcData.checkedQty"]
                  },
                  100
                ]
              }
            ]
          }
        }
      },

      // Optional: Filter by result if provided
      ...(result ? [{ $match: { result: result } }] : []),

      // Use $facet to get both data and filter options
      {
        $facet: {
          reports: [{ $sort: { inspectionDate: -1 } }],

          summary: [
            {
              $group: {
                _id: null,
                totalCheckedQty: { $sum: "$qcData.checkedQty" },
                totalRejectPcs: { $sum: "$qcData.rejectPcs" },
                totalDefectQty: { $sum: "$qcData.totalDefectQty" },
                totalMinorCount: { $sum: "$minorCount" },
                totalMajorCount: { $sum: "$majorCount" },
                totalCriticalCount: { $sum: "$criticalCount" }
              }
            },
            {
              $project: {
                _id: 0,
                totalCheckedQty: 1,
                totalRejectPcs: 1,
                totalDefectQty: 1,
                totalMinorCount: 1,
                totalMajorCount: 1,
                totalCriticalCount: 1,
                defectRate: {
                  $cond: [
                    { $eq: ["$totalCheckedQty", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                        100
                      ]
                    }
                  ]
                },
                defectRatio: {
                  $cond: [
                    { $eq: ["$totalCheckedQty", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$totalRejectPcs", "$totalCheckedQty"] },
                        100
                      ]
                    }
                  ]
                }
              }
            }
          ],

          filterOptions: [
            {
              $group: {
                _id: null,
                reportTypes: { $addToSet: "$reportType" },
                factories: { $addToSet: "$factory" },
                lineNos: { $addToSet: "$lineNo" },
                moNos: { $addToSet: "$moNo" },
                colors: { $addToSet: "$color" },
                qaIds: { $addToSet: "$preparedBy.empId" },
                qcIds: { $addToSet: "$qcData.qcID" },
                results: { $addToSet: "$result" }
              }
            },
            {
              $project: {
                _id: 0,
                reportTypes: {
                  $sortArray: { input: "$reportTypes", sortBy: 1 }
                },
                factories: { $sortArray: { input: "$factories", sortBy: 1 } },
                lineNos: { $sortArray: { input: "$lineNos", sortBy: 1 } },
                moNos: { $sortArray: { input: "$moNos", sortBy: 1 } },
                colors: { $sortArray: { input: "$colors", sortBy: 1 } },
                qaIds: { $sortArray: { input: "$qaIds", sortBy: 1 } },
                qcIds: { $sortArray: { input: "$qcIds", sortBy: 1 } },
                results: { $sortArray: { input: "$results", sortBy: 1 } }
              }
            }
          ]
        }
      },

      {
        $project: {
          reports: "$reports",
          summary: { $arrayElemAt: ["$summary", 0] },
          filterOptions: { $arrayElemAt: ["$filterOptions", 0] }
        }
      }
    ];

    const resultQA = await SubconSewingQAReport.aggregate(pipeline);

    const responseData = {
      reports: resultQA[0]?.reports || [],
      summary: resultQA[0]?.summary || {
        totalCheckedQty: 0,
        totalRejectPcs: 0,
        totalDefectQty: 0,
        totalMinorCount: 0,
        totalMajorCount: 0,
        totalCriticalCount: 0,
        defectRate: 0,
        defectRatio: 0
      },
      filterOptions: resultQA[0]?.filterOptions || {
        reportTypes: [],
        factories: [],
        lineNos: [],
        moNos: [],
        colors: [],
        qaIds: [],
        qcIds: [],
        results: []
      }
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching QA inspection data:", error);
    res.status(500).json({ error: "Failed to fetch inspection data" });
  }
};

export const getSubConQCInspectionDataByID = async (req, res) => {
  try {
      const { reportId } = req.params;
      const report = await SubconSewingQAReport.findById(reportId).lean();
  
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
  
      res.json({ report });
    } catch (error) {
      console.error("Error fetching QA inspection report:", error);
      res.status(500).json({ error: "Failed to fetch report" });
    }
};