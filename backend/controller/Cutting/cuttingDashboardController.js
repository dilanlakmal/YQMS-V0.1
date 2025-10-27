import {
  CuttingInspection,
} from "../MongoDB/dbConnectionController.js";
import {
  generateDateStringsCuttingDashboard,
  derivedBuyerLogic,
} from "../../Helpers/helperFunctions.js";

// GET DYNAMIC/CROSS-FILTERED filter options for Cutting Dashboard
export const getCuttingDashboardFilters = async (req, res) => {
  try {
      const { startDate, endDate, buyer, moNo, tableNo, garmentType } = req.query;
  
      // 1. Build the initial pipeline with date filtering and derived buyer
      const pipeline = [];
      if (startDate && endDate) {
        const dateStrings = generateDateStringsCuttingDashboard(
          startDate,
          endDate
        );
        if (dateStrings.length > 0) {
          pipeline.push({ $match: { inspectionDate: { $in: dateStrings } } });
        } else {
          return res.json({
            buyers: [],
            moNos: [],
            tableNos: [],
            garmentTypes: [],
            qcIds: []
          });
        }
      }
      pipeline.push({ $addFields: { derivedBuyer: derivedBuyerLogic } });
  
      // 2. Build the progressive match stage for cross-filtering
      const progressiveMatch = {};
      if (buyer) progressiveMatch.derivedBuyer = buyer;
      if (moNo) progressiveMatch.moNo = moNo;
      if (tableNo) progressiveMatch.tableNo = tableNo;
      if (garmentType) progressiveMatch.garmentType = garmentType;
  
      if (Object.keys(progressiveMatch).length > 0) {
        pipeline.push({ $match: progressiveMatch });
      }
  
      // 3. Use a single facet stage to get all unique lists from the filtered dataset
      pipeline.push({
        $facet: {
          buyers: [
            { $group: { _id: "$derivedBuyer" } },
            { $sort: { _id: 1 } },
            { $project: { value: "$_id", _id: 0 } }
          ],
          moNos: [
            { $group: { _id: "$moNo" } },
            { $sort: { _id: 1 } },
            { $project: { value: "$_id", _id: 0 } }
          ],
          tableNos: [
            { $group: { _id: "$tableNo" } },
            { $sort: { _id: 1 } },
            { $project: { value: "$_id", _id: 0 } }
          ],
          garmentTypes: [
            { $group: { _id: "$garmentType" } },
            { $sort: { _id: 1 } },
            { $project: { value: "$_id", _id: 0 } }
          ],
          qcIds: [
            { $group: { _id: "$cutting_emp_id" } },
            { $sort: { _id: 1 } },
            { $project: { value: "$_id", _id: 0 } }
          ]
        }
      });
  
      const result = await CuttingInspection.aggregate(pipeline);
  
      const formatResult = (data) =>
        (data || []).map((item) => item.value).filter(Boolean);
  
      res.json({
        buyers: formatResult(result[0].buyers),
        moNos: formatResult(result[0].moNos),
        tableNos: formatResult(result[0].tableNos),
        garmentTypes: formatResult(result[0].garmentTypes),
        qcIds: formatResult(result[0].qcIds)
      });
    } catch (error) {
      console.error("Error fetching cutting dashboard dynamic filters:", error);
      res.status(500).json({
        message: "Failed to fetch dynamic filter options",
        error: error.message
      });
    }
};

// GET Cutting Dashboard Data
export const getCuttingDashboardData = async (req, res) => {
  try {
      const {
        startDate,
        endDate,
        buyer,
        moNo,
        tableNo,
        garmentType,
        color,
        qcId,
        topN = 5,
        sortOrder = "top"
      } = req.query;
  
      // This pipeline will be prepended to all data-fetching aggregations
      const preMatchPipeline = [];
  
      // Stage 1: Add the derivedBuyer field first
      preMatchPipeline.push({ $addFields: { derivedBuyer: derivedBuyerLogic } });
  
      // Stage 2: Build the match object using the derived buyer
      const match = {};
      if (startDate && endDate) {
        const dateStrings = generateDateStringsCuttingDashboard(
          startDate,
          endDate
        );
        if (dateStrings.length > 0) {
          match.inspectionDate = { $in: dateStrings };
        } else {
          return res.json({ kpis: {}, charts: {} });
        }
      }
      if (buyer) match.derivedBuyer = buyer; // Filter on the derived buyer
      if (moNo) match.moNo = moNo;
      if (tableNo) match.tableNo = tableNo;
      if (garmentType) match.garmentType = garmentType;
      if (color) match.color = color;
      if (qcId) match.cutting_emp_id = qcId;
  
      //preMatchPipeline.push({ $match: match });
      if (Object.keys(match).length > 0) {
        preMatchPipeline.push({ $match: match });
      }
  
      // Pipeline to count the total number of reports (documents) found
      const reportCountPipeline = [
        ...preMatchPipeline,
        { $count: "totalReports" }
      ];
  
      // The rest of the pipelines now start with the correctly filtered data
      const kpiBasePipeline = [
        ...preMatchPipeline, // Prepend the filtering logic
        {
          $group: {
            _id: null,
            totalInspectionQty: { $sum: { $ifNull: ["$totalInspectionQty", 0] } },
            totalBundleQty: { $sum: { $ifNull: ["$totalBundleQty", 0] } },
            bundleQtyCheck: { $sum: { $ifNull: ["$bundleQtyCheck", 0] } }
          }
        }
      ];
  
      const unwindPipeline = [
        ...preMatchPipeline, // Prepend the filtering logic
        { $unwind: "$inspectionData" },
        {
          $facet: {
            kpis: [
              {
                $group: {
                  _id: null,
                  totalPcs: {
                    $sum: { $ifNull: ["$inspectionData.totalPcsSize", 0] }
                  },
                  totalPass: {
                    $sum: { $ifNull: ["$inspectionData.passSize.total", 0] }
                  },
                  totalReject: {
                    $sum: { $ifNull: ["$inspectionData.rejectSize.total", 0] }
                  },
                  rejectMeasurements: {
                    $sum: {
                      $ifNull: ["$inspectionData.rejectMeasurementSize.total", 0]
                    }
                  },
                  rejectDefects: {
                    $sum: {
                      $ifNull: ["$inspectionData.rejectGarmentSize.total", 0]
                    }
                  },
                  inspectedSizes: { $addToSet: "$inspectionData.inspectedSize" }
                }
              },
              {
                $project: {
                  _id: 0,
                  totalPcs: 1,
                  totalPass: 1,
                  totalReject: 1,
                  rejectMeasurements: 1,
                  rejectDefects: 1,
                  passRate: {
                    $cond: [
                      { $gt: ["$totalPcs", 0] },
                      {
                        $multiply: [{ $divide: ["$totalPass", "$totalPcs"] }, 100]
                      },
                      0
                    ]
                  },
                  totalInspectedSizes: { $size: "$inspectedSizes" }
                }
              }
            ],
            passRateByMo: [
              {
                $group: {
                  _id: "$moNo",
                  totalPcs: { $sum: "$inspectionData.totalPcsSize" },
                  totalPass: { $sum: "$inspectionData.passSize.total" },
                  totalReject: { $sum: "$inspectionData.rejectSize.total" }
                }
              },
              {
                $project: {
                  name: "$_id",
                  _id: 0,
                  totalPcs: 1, // Pass through the counts
                  totalPass: 1,
                  totalReject: 1,
                  passRate: {
                    $cond: [
                      { $gt: ["$totalPcs", 0] },
                      {
                        $multiply: [{ $divide: ["$totalPass", "$totalPcs"] }, 100]
                      },
                      0
                    ]
                  }
                }
              },
              { $sort: { passRate: sortOrder === "bottom" ? 1 : -1 } },
              { $limit: parseInt(topN, 10) }
            ],
            passRateByDate: [
              {
                $group: {
                  _id: "$inspectionDate",
                  totalPcs: { $sum: "$inspectionData.totalPcsSize" },
                  totalPass: { $sum: "$inspectionData.passSize.total" }
                }
              },
              { $addFields: { dateParts: { $split: ["$_id", "/"] } } },
              {
                $addFields: {
                  month: { $toInt: { $arrayElemAt: ["$dateParts", 0] } },
                  day: { $toInt: { $arrayElemAt: ["$dateParts", 1] } },
                  year: { $toInt: { $arrayElemAt: ["$dateParts", 2] } }
                }
              },
              { $sort: { year: 1, month: 1, day: 1 } },
              {
                $project: {
                  name: "$_id",
                  _id: 0,
                  passRate: {
                    $cond: [
                      { $gt: ["$totalPcs", 0] },
                      {
                        $multiply: [{ $divide: ["$totalPass", "$totalPcs"] }, 100]
                      },
                      0
                    ]
                  }
                }
              },
              { $limit: 30 }
            ],
            measurementIssues: [
              { $unwind: "$inspectionData.bundleInspectionData" },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements"
              },
              {
                $match: {
                  "inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status":
                    {
                      $ne: "Pass"
                    }
                }
              },
              {
                $group: {
                  _id: {
                    garmentType: "$garmentType",
                    measurementPoint:
                      "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementPointName"
                  },
                  count: { $sum: 1 }
                }
              },
              {
                // --- NEW: Sort by count BEFORE grouping into the array ---
                $sort: {
                  count: -1
                }
              },
              {
                $group: {
                  _id: "$_id.garmentType",
                  issues: {
                    $push: {
                      measurementPoint: "$_id.measurementPoint",
                      count: "$count"
                    }
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                  garmentType: "$_id",
                  issues: 1
                }
              },
              { $sort: { garmentType: 1 } }
            ],
            passRateByGarmentType: [
              {
                $group: {
                  _id: "$garmentType",
                  totalPcs: { $sum: "$inspectionData.totalPcsSize" },
                  totalPass: { $sum: "$inspectionData.passSize.total" }
                }
              },
              {
                $project: {
                  name: "$_id",
                  _id: 0,
                  passRate: {
                    $cond: [
                      { $gt: ["$totalPcs", 0] },
                      {
                        $multiply: [{ $divide: ["$totalPass", "$totalPcs"] }, 100]
                      },
                      0
                    ]
                  }
                }
              },
              { $sort: { passRate: -1 } }
            ],
            measurementIssuesByMo: [
              // Stage 1: Unwind all the way to the individual measurement document
              { $unwind: "$inspectionData.bundleInspectionData" },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements"
              },
              // Stage 2: Group by the most granular level (including measurement point) to calculate all stats at once
              {
                $group: {
                  _id: {
                    moNo: "$moNo",
                    tableNo: "$tableNo",
                    garmentType: "$garmentType",
                    measurementPoint:
                      "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementPointName"
                  },
                  // Pass Count for the entire document set
                  passCount: {
                    $sum: {
                      $cond: [
                        {
                          $eq: [
                            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                            "Pass"
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  // Total Rejects for this specific measurement point
                  total: {
                    $sum: {
                      $cond: [
                        {
                          $ne: [
                            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                            "Pass"
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  // TOL+ Rejects
                  tol_plus: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $ne: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                                "Pass"
                              ]
                            },
                            {
                              $gt: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
                                0
                              ]
                            }
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  // TOL- Rejects
                  tol_minus: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $ne: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                                "Pass"
                              ]
                            },
                            {
                              $lt: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
                                0
                              ]
                            }
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  // Collect all non-"0" fractions from rejected items into an array
                  fractions: {
                    $push: {
                      $cond: [
                        {
                          $and: [
                            {
                              $ne: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                                "Pass"
                              ]
                            },
                            {
                              $ne: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuefraction",
                                "0"
                              ]
                            }
                          ]
                        },
                        "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuefraction",
                        "$$REMOVE"
                      ]
                    }
                  }
                }
              },
              // Stage 3: Create the fractionCounts object and finalize the issue structure
              {
                $addFields: {
                  // This powerful stage converts the array of fractions (e.g., ["-1/4", "-1/8", "-1/4"])
                  // into a key-value object (e.g., { "-1/4": 2, "-1/8": 1 })
                  fractionCounts: {
                    $arrayToObject: {
                      $map: {
                        input: { $setUnion: ["$fractions"] }, // Get unique fractions
                        as: "fr",
                        in: {
                          k: "$$fr",
                          v: {
                            $size: {
                              $filter: {
                                input: "$fractions",
                                cond: { $eq: ["$$this", "$$fr"] }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              // Stage 4: Group by table and garment type
              {
                $group: {
                  _id: {
                    moNo: "$_id.moNo",
                    tableNo: "$_id.tableNo",
                    garmentType: "$_id.garmentType"
                  },
                  totalPassForGarment: { $sum: "$passCount" },
                  issues: {
                    $push: {
                      measurementPoint: "$_id.measurementPoint",
                      total: "$total",
                      tol_plus: "$tol_plus",
                      tol_minus: "$tol_minus",
                      fractionCounts: "$fractionCounts"
                    }
                  }
                }
              },
              // Stage 5: Group by table
              {
                $group: {
                  _id: { moNo: "$_id.moNo", tableNo: "$_id.tableNo" },
                  passCount: { $first: "$totalPassForGarment" },
                  issuesByGarmentType: {
                    $push: {
                      garmentType: "$_id.garmentType",
                      issues: {
                        $sortArray: {
                          input: {
                            // Filter out points that had no rejects
                            $filter: {
                              input: "$issues",
                              as: "i",
                              cond: { $gt: ["$$i.total", 0] }
                            }
                          },
                          sortBy: { total: -1 }
                        }
                      }
                    }
                  }
                }
              },
              // Stage 6: Final grouping by MO
              {
                $group: {
                  _id: "$_id.moNo",
                  tableNos: { $addToSet: "$_id.tableNo" },
                  totalPass: { $sum: "$passCount" },
                  issuesByTable: {
                    $push: {
                      tableNo: "$_id.tableNo",
                      issuesByGarmentType: "$issuesByGarmentType"
                    }
                  }
                }
              },
              // Stage 7: Final projection to calculate overall rejects and rates
              {
                $addFields: {
                  totalRejects: {
                    $sum: {
                      $map: {
                        input: "$issuesByTable",
                        as: "table",
                        in: {
                          $sum: {
                            $map: {
                              input: "$$table.issuesByGarmentType",
                              as: "gt",
                              in: { $sum: "$$gt.issues.total" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                  moNo: "$_id",
                  tableNos: 1,
                  totalPass: 1,
                  totalRejects: 1,
                  issuesByTable: 1,
                  totalPoints: { $add: ["$totalPass", "$totalRejects"] },
                  defectRate: {
                    $cond: [
                      { $gt: [{ $add: ["$totalPass", "$totalRejects"] }, 0] },
                      {
                        $multiply: [
                          {
                            $divide: [
                              "$totalRejects",
                              { $add: ["$totalPass", "$totalRejects"] }
                            ]
                          },
                          100
                        ]
                      },
                      0
                    ]
                  }
                }
              }
            ],
            // --- NEW FACET: PIPELINE FOR SPREAD TABLE CARDS ---
            measurementIssuesBySpreadTable: [
              // Stage 1: Unwind all the way to the individual measurement document
              { $unwind: "$inspectionData.bundleInspectionData" },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements"
              },
              // Stage 2: Group by the most granular level, using spreadTable as a key
              {
                $group: {
                  _id: {
                    moNo: "$moNo",
                    spreadTable: "$cuttingTableDetails.spreadTable", // <-- The key change is here
                    garmentType: "$garmentType",
                    measurementPoint:
                      "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementPointName"
                  },
                  passCount: {
                    $sum: {
                      $cond: [
                        {
                          $eq: [
                            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                            "Pass"
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  total: {
                    $sum: {
                      $cond: [
                        {
                          $ne: [
                            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                            "Pass"
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  tol_plus: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $ne: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                                "Pass"
                              ]
                            },
                            {
                              $gt: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
                                0
                              ]
                            }
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  tol_minus: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $ne: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                                "Pass"
                              ]
                            },
                            {
                              $lt: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
                                0
                              ]
                            }
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  fractions: {
                    $push: {
                      $cond: [
                        {
                          $and: [
                            {
                              $ne: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                                "Pass"
                              ]
                            },
                            {
                              $ne: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuefraction",
                                "0"
                              ]
                            }
                          ]
                        },
                        "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuefraction",
                        "$$REMOVE"
                      ]
                    }
                  }
                }
              },
              // Stage 3: Create the fractionCounts object
              {
                $addFields: {
                  fractionCounts: {
                    $arrayToObject: {
                      $map: {
                        input: { $setUnion: ["$fractions"] },
                        as: "fr",
                        in: {
                          k: "$$fr",
                          v: {
                            $size: {
                              $filter: {
                                input: "$fractions",
                                cond: { $eq: ["$$this", "$$fr"] }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              // Stage 4: Group by spread table and garment type
              {
                $group: {
                  _id: {
                    moNo: "$_id.moNo",
                    spreadTable: "$_id.spreadTable", // <-- The key change is here
                    garmentType: "$_id.garmentType"
                  },
                  totalPassForGarment: { $sum: "$passCount" },
                  issues: {
                    $push: {
                      measurementPoint: "$_id.measurementPoint",
                      total: "$total",
                      tol_plus: "$tol_plus",
                      tol_minus: "$tol_minus",
                      fractionCounts: "$fractionCounts"
                    }
                  }
                }
              },
              // Stage 5: Group by spread table
              {
                $group: {
                  _id: { moNo: "$_id.moNo", spreadTable: "$_id.spreadTable" }, // <-- The key change is here
                  passCount: { $first: "$totalPassForGarment" },
                  issuesByGarmentType: {
                    $push: {
                      garmentType: "$_id.garmentType",
                      issues: {
                        $sortArray: {
                          input: {
                            $filter: {
                              input: "$issues",
                              as: "i",
                              cond: { $gt: ["$$i.total", 0] }
                            }
                          },
                          sortBy: { total: -1 }
                        }
                      }
                    }
                  }
                }
              },
              // Stage 6: Final grouping by MO
              {
                $group: {
                  _id: "$_id.moNo",
                  spreadTables: { $addToSet: "$_id.spreadTable" }, // <-- The key change is here
                  totalPass: { $sum: "$passCount" },
                  issuesBySpreadTable: {
                    // <-- The key change is here
                    $push: {
                      spreadTable: "$_id.spreadTable", // <-- The key change is here
                      issuesByGarmentType: "$issuesByGarmentType"
                    }
                  }
                }
              },
              // Stage 7: Final projection to calculate overall rejects and rates
              {
                $addFields: {
                  totalRejects: {
                    $sum: {
                      $map: {
                        input: "$issuesBySpreadTable",
                        as: "table",
                        in: {
                          $sum: {
                            $map: {
                              input: "$$table.issuesByGarmentType",
                              as: "gt",
                              in: { $sum: "$$gt.issues.total" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                  moNo: "$_id",
                  spreadTables: 1, // <-- The key change is here
                  totalPass: 1,
                  totalRejects: 1,
                  issuesBySpreadTable: 1, // <-- The key change is here
                  totalPoints: { $add: ["$totalPass", "$totalRejects"] },
                  defectRate: {
                    $cond: [
                      { $gt: [{ $add: ["$totalPass", "$totalRejects"] }, 0] },
                      {
                        $multiply: [
                          {
                            $divide: [
                              "$totalRejects",
                              { $add: ["$totalPass", "$totalRejects"] }
                            ]
                          },
                          100
                        ]
                      },
                      0
                    ]
                  }
                }
              }
            ],
            // --- NEW FACET: PIPELINE FOR SPREAD TABLE OVERALL CARDS ---
            measurementIssuesBySpreadTableOverall: [
              // Stage 1: Filter out documents where spreadTable is null or empty
              {
                $match: {
                  "cuttingTableDetails.spreadTable": {
                    $exists: true,
                    $ne: null,
                    $ne: ""
                  }
                }
              },
              // Stage 2: Unwind all the way to the individual measurement document
              { $unwind: "$inspectionData.bundleInspectionData" },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements"
              },
              // Stage 3: Group by the spreadTable and measurement point to calculate all stats
              {
                $group: {
                  _id: {
                    spreadTable: "$cuttingTableDetails.spreadTable", // <-- Primary grouping key
                    garmentType: "$garmentType",
                    measurementPoint:
                      "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementPointName"
                  },
                  passCount: {
                    $sum: {
                      $cond: [
                        {
                          $eq: [
                            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                            "Pass"
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  total: {
                    $sum: {
                      $cond: [
                        {
                          $ne: [
                            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                            "Pass"
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  tol_plus: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $ne: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                                "Pass"
                              ]
                            },
                            {
                              $gt: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
                                0
                              ]
                            }
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  tol_minus: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $ne: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                                "Pass"
                              ]
                            },
                            {
                              $lt: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
                                0
                              ]
                            }
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  fractions: {
                    $push: {
                      $cond: [
                        {
                          $and: [
                            {
                              $ne: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                                "Pass"
                              ]
                            },
                            {
                              $ne: [
                                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuefraction",
                                "0"
                              ]
                            }
                          ]
                        },
                        "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuefraction",
                        "$$REMOVE"
                      ]
                    }
                  }
                }
              },
              // Stage 4: Create the fractionCounts object
              {
                $addFields: {
                  fractionCounts: {
                    $arrayToObject: {
                      $map: {
                        input: { $setUnion: ["$fractions"] },
                        as: "fr",
                        in: {
                          k: "$$fr",
                          v: {
                            $size: {
                              $filter: {
                                input: "$fractions",
                                cond: { $eq: ["$$this", "$$fr"] }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              // Stage 5: Group by spread table and garment type
              {
                $group: {
                  _id: {
                    spreadTable: "$_id.spreadTable",
                    garmentType: "$_id.garmentType"
                  },
                  totalPassForGarment: { $sum: "$passCount" },
                  issues: {
                    $push: {
                      measurementPoint: "$_id.measurementPoint",
                      total: "$total",
                      tol_plus: "$tol_plus",
                      tol_minus: "$tol_minus",
                      fractionCounts: "$fractionCounts"
                    }
                  }
                }
              },
              // Stage 6: Final grouping by Spread Table to assemble the card object
              {
                $group: {
                  _id: "$_id.spreadTable",
                  totalPass: { $sum: "$totalPassForGarment" },
                  issuesByGarmentType: {
                    $push: {
                      garmentType: "$_id.garmentType",
                      issues: {
                        $sortArray: {
                          input: {
                            $filter: {
                              input: "$issues",
                              as: "i",
                              cond: { $gt: ["$$i.total", 0] }
                            }
                          },
                          sortBy: { total: -1 }
                        }
                      }
                    }
                  }
                }
              },
              // Stage 7: Final projection to calculate rejects and defect rate
              {
                $addFields: {
                  totalRejects: {
                    $sum: {
                      $map: {
                        input: "$issuesByGarmentType",
                        as: "gt",
                        in: { $sum: "$$gt.issues.total" }
                      }
                    }
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                  spreadTable: "$_id",
                  totalPass: 1,
                  totalRejects: 1,
                  issuesByGarmentType: 1,
                  totalPoints: { $add: ["$totalPass", "$totalRejects"] },
                  defectRate: {
                    $cond: [
                      { $gt: [{ $add: ["$totalPass", "$totalRejects"] }, 0] },
                      {
                        $multiply: [
                          {
                            $divide: [
                              "$totalRejects",
                              { $add: ["$totalPass", "$totalRejects"] }
                            ]
                          },
                          100
                        ]
                      },
                      0
                    ]
                  }
                }
              }
            ],
            // --- NEW FACET: PIPELINE FOR FABRIC DEFECT ANALYSIS ---
            fabricDefectAnalysis: [
              // Stage 1: Unwind all arrays down to the individual defect level
              { $unwind: "$inspectionData.bundleInspectionData" },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects"
              },
  
              // Stage 2: Filter out any records with missing or empty defect names/quantities
              {
                $match: {
                  "inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectName":
                    { $ne: null, $ne: "" },
                  "inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectQty":
                    { $gt: 0 }
                }
              },
  
              // Stage 3: Group by the defect name to get the total quantity and collect all source details
              {
                $group: {
                  _id: "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectName",
                  totalQty: {
                    $sum: "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectQty"
                  },
                  details: {
                    $push: {
                      moNo: "$moNo",
                      spreadTable: "$cuttingTableDetails.spreadTable",
                      qty: "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectQty"
                    }
                  }
                }
              },
  
              // Stage 4: Final project and sort by highest quantity
              {
                $project: {
                  _id: 0,
                  defectName: "$_id",
                  totalQty: "$totalQty",
                  details: "$details"
                }
              },
              { $sort: { totalQty: -1 } }
            ],
            inspectionQtyByMo: [
              {
                $group: {
                  _id: "$moNo",
                  totalInspectionQty: { $sum: "$totalInspectionQty" }
                }
              },
              {
                $project: {
                  _id: 0,
                  moNo: "$_id",
                  totalInspectionQty: 1
                }
              }
            ],
            // --- NEW, CORRECTED PIPELINE FOR CUTTING DEFECT PIVOT TABLE ---
            cuttingDefectPivot: [
              { $unwind: "$inspectionData.cuttingDefects.issues" },
              {
                $match: {
                  "inspectionData.cuttingDefects.issues.cuttingdefectName": {
                    $ne: null,
                    $ne: ""
                  }
                }
              },
              {
                $group: {
                  _id: {
                    defectName:
                      "$inspectionData.cuttingDefects.issues.cuttingdefectName",
                    moNo: "$moNo"
                  },
                  qty: { $sum: 1 }
                }
              },
              {
                $group: {
                  _id: "$_id.defectName",
                  totalQty: { $sum: "$qty" },
                  moBreakdown: { $push: { k: "$_id.moNo", v: "$qty" } }
                }
              },
              {
                $project: {
                  _id: 0,
                  defectName: "$_id",
                  totalQty: 1,
                  moBreakdown: { $arrayToObject: "$moBreakdown" }
                }
              },
              { $sort: { totalQty: -1 } }
            ],
  
            // --- NEW, CORRECTED PIPELINE FOR CUTTING DEFECT EVIDENCE ---
            cuttingDefectEvidence: [
              {
                $match: {
                  "inspectionData.cuttingDefects.additionalImages": {
                    $exists: true,
                    $ne: []
                  }
                }
              },
              {
                $group: {
                  _id: {
                    moNo: "$moNo",
                    tableNo: "$tableNo"
                  },
                  images: {
                    $first: "$inspectionData.cuttingDefects.additionalImages.path"
                  }
                }
              },
              {
                $group: {
                  _id: "$_id.moNo",
                  imagesByTable: {
                    $push: {
                      tableNo: "$_id.tableNo",
                      images: "$images"
                    }
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                  moNo: "$_id",
                  imagesByTable: 1
                }
              },
              { $sort: { moNo: 1 } }
            ],
            // --- NEW FACET: PIPELINE FOR TREND ANALYSIS MATRIX CHART ---
            trendAnalysisData: [
              // Stage 1: Unwind all the way down to the individual measurement level
              { $unwind: "$inspectionData.bundleInspectionData" },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements"
              },
  
              // Stage 2: Filter for only measurement failures
              {
                $match: {
                  "inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status":
                    { $ne: "Pass" }
                }
              },
  
              // Stage 3: Group by measurement point and inspection date to get the daily failure count
              {
                $group: {
                  _id: {
                    measurementPoint:
                      "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementPointName",
                    inspectionDate: "$inspectionDate"
                  },
                  count: { $sum: 1 }
                }
              },
  
              // Stage 4: Group again by just the measurement point to create a breakdown object by date
              {
                $group: {
                  _id: "$_id.measurementPoint",
                  dateBreakdown: {
                    $push: {
                      k: "$_id.inspectionDate",
                      v: "$count"
                    }
                  }
                }
              },
  
              // Stage 5: Final projection to format the data for the frontend
              {
                $project: {
                  _id: 0,
                  measurementPoint: "$_id",
                  dateBreakdown: { $arrayToObject: "$dateBreakdown" }
                }
              },
              { $sort: { measurementPoint: 1 } } // Sort rows alphabetically
            ],
            // --- NEW FACET: TO GET TOTAL INSPECTION QTY PER DATE ---
            inspectionQtyByDate: [
              {
                $group: {
                  _id: "$inspectionDate",
                  totalInspectionQty: { $sum: "$totalInspectionQty" }
                }
              },
              {
                $project: {
                  _id: 0,
                  inspectionDate: "$_id",
                  totalInspectionQty: 1
                }
              }
            ],
  
            // --- NEW FACET: PIPELINE FOR FABRIC DEFECT TREND ANALYSIS ---
            fabricDefectTrendData: [
              // Stage 1: Unwind all arrays down to the individual defect level
              { $unwind: "$inspectionData.bundleInspectionData" },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData"
              },
              {
                $unwind:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects"
              },
  
              // Stage 2: Filter for valid defects
              {
                $match: {
                  "inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectName":
                    { $ne: null, $ne: "" },
                  "inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectQty":
                    { $gt: 0 }
                }
              },
  
              // Stage 3: Group by defect name and inspection date to get daily defect counts
              {
                $group: {
                  _id: {
                    defectName:
                      "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectName",
                    inspectionDate: "$inspectionDate"
                  },
                  qty: {
                    $sum: "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectQty"
                  }
                }
              },
  
              // Stage 4: Group again by just the defect name to create a breakdown object by date
              {
                $group: {
                  _id: "$_id.defectName",
                  dateBreakdown: {
                    $push: {
                      k: "$_id.inspectionDate",
                      v: "$qty"
                    }
                  }
                }
              },
  
              // Stage 5: Final projection to format the data
              {
                $project: {
                  _id: 0,
                  defectName: "$_id",
                  dateBreakdown: { $arrayToObject: "$dateBreakdown" }
                }
              },
              { $sort: { defectName: 1 } }
            ],
            // --- NEW FACET: PIPELINE FOR CUTTING DEFECT TREND ANALYSIS ---
            cuttingDefectTrendData: [
              { $unwind: "$inspectionData.cuttingDefects.issues" },
              {
                $match: {
                  "inspectionData.cuttingDefects.issues.cuttingdefectName": {
                    $ne: null,
                    $ne: ""
                  }
                }
              },
              // Group by defect name and date to get the daily count (each issue is 1)
              {
                $group: {
                  _id: {
                    defectName:
                      "$inspectionData.cuttingDefects.issues.cuttingdefectName",
                    inspectionDate: "$inspectionDate"
                  },
                  qty: { $sum: 1 }
                }
              },
              // Group again by just the defect name to create the date breakdown
              {
                $group: {
                  _id: "$_id.defectName",
                  dateBreakdown: {
                    $push: {
                      k: "$_id.inspectionDate",
                      v: "$qty"
                    }
                  }
                }
              },
              // Final projection
              {
                $project: {
                  _id: 0,
                  cuttingDefectName: "$_id",
                  dateBreakdown: { $arrayToObject: "$dateBreakdown" }
                }
              },
              { $sort: { cuttingDefectName: 1 } }
            ]
          }
        }
      ];
  
      const [kpiBaseResult, unwindResult, reportCountResult] = await Promise.all([
        CuttingInspection.aggregate(kpiBasePipeline),
        CuttingInspection.aggregate(unwindPipeline),
        CuttingInspection.aggregate(reportCountPipeline)
      ]);
  
      const defaultKpis = {
        totalInspectedReports: 0,
        totalInspectionQty: 0,
        totalPcs: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurements: 0,
        rejectDefects: 0,
        passRate: 0,
        totalBundleQty: 0,
        bundleQtyCheck: 0,
        totalInspectedSizes: 0
      };
  
      const kpis = {
        ...defaultKpis,
        ...(kpiBaseResult[0] || {}),
        ...(unwindResult[0]?.kpis[0] || {}),
        totalInspectedReports: reportCountResult[0]?.totalReports || 0 // <-- Add the count result
      };
      delete kpis._id;
  
      const cuttingDefectData = {
        pivotData: unwindResult[0]?.cuttingDefectPivot || [],
        evidenceData: unwindResult[0]?.cuttingDefectEvidence || []
      };
  
      const formattedResult = {
        kpis,
        charts: {
          passRateByMo: unwindResult[0]?.passRateByMo || [],
          passRateByDate: unwindResult[0]?.passRateByDate || [],
          passRateByGarmentType: unwindResult[0]?.passRateByGarmentType || [],
          measurementIssues: unwindResult[0]?.measurementIssues || [],
          measurementIssuesByMo: unwindResult[0]?.measurementIssuesByMo || [],
          measurementIssuesBySpreadTable:
            unwindResult[0]?.measurementIssuesBySpreadTable || [],
          measurementIssuesBySpreadTableOverall:
            unwindResult[0]?.measurementIssuesBySpreadTableOverall || [],
          fabricDefectAnalysis: unwindResult[0]?.fabricDefectAnalysis || [],
          inspectionQtyByMo: unwindResult[0]?.inspectionQtyByMo || [],
          cuttingDefectAnalysis: cuttingDefectData,
          trendAnalysisData: unwindResult[0]?.trendAnalysisData || [],
          fabricDefectTrendData: unwindResult[0]?.fabricDefectTrendData || [],
          inspectionQtyByDate: unwindResult[0]?.inspectionQtyByDate || [],
          cuttingDefectTrendData: unwindResult[0]?.cuttingDefectTrendData || []
        }
      };
  
      res.json(formattedResult);
    } catch (error) {
      console.error("Error fetching cutting dashboard data:", error);
      res.status(500).json({
        message: "Failed to fetch cutting dashboard data",
        error: error.message
      });
    }
};