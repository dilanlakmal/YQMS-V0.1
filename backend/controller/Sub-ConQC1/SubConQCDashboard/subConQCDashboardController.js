import { SubconSewingQc1Report } from "../../MongoDB/dbConnectionController.js";

export const getDailyData = async (req, res) => {
  try {
    const { startDate, endDate, factory, buyer, lineNo, moNo, color } =
      req.query;

    const matchQuery = {};
    if (startDate && endDate) {
      matchQuery.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    if (factory) matchQuery.factory = factory;
    if (buyer) matchQuery.buyer = buyer;
    if (lineNo) matchQuery.lineNo = lineNo;
    if (moNo) matchQuery.moNo = moNo;
    if (color) matchQuery.color = color;

    const result = await SubconSewingQc1Report.aggregate([
      { $match: matchQuery },

      // --- NEW: Join with QA reports collection using $lookup ---
      {
        $lookup: {
          from: "subcon_sewing_qa_reports", // The exact name of the QA reports collection
          let: {
            insp_date: "$inspectionDate",
            insp_factory: "$factory",
            insp_line: "$lineNo",
            insp_mo: "$moNo",
            insp_color: "$color"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$factory", "$$insp_factory"] },
                    { $eq: ["$lineNo", "$$insp_line"] },
                    { $eq: ["$moNo", "$$insp_mo"] },
                    { $eq: ["$color", "$$insp_color"] },
                    {
                      $eq: [
                        {
                          $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$inspectionDate",
                            timezone: "UTC"
                          }
                        },
                        {
                          $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$$insp_date",
                            timezone: "UTC"
                          }
                        }
                      ]
                    }
                  ]
                }
              }
            },
            { $limit: 1 }
          ],
          as: "qaData"
        }
      },
      // --- NEW: Promote the matched QA report to a top-level object ---
      {
        $addFields: {
          qaReport: { $arrayElemAt: ["$qaData", 0] }
        }
      },

      {
        $facet: {
          // --- 1. Main Table Data: Now includes the qaReport object ---
          mainData: [
            {
              $addFields: {
                defectRate: {
                  $cond: [
                    { $gt: ["$checkedQty", 0] },
                    {
                      $multiply: [
                        { $divide: ["$totalDefectQty", "$checkedQty"] },
                        100
                      ]
                    },
                    0
                  ]
                }
              }
            },
            { $sort: { inspectionDate: 1, defectRate: -1 } }
          ],

          // --- 2. Top N Defects Calculation (No Change) ---
          topDefects: [
            { $unwind: "$defectList" },
            {
              $group: {
                _id: "$defectList.defectName",
                totalQty: { $sum: "$defectList.qty" }
              }
            },
            { $sort: { totalQty: -1 } }
          ],

          // --- 3. Defect Rate by Line Calculation (No Change) ---
          linePerformance: [
            {
              $group: {
                _id: { factory: "$factory", lineNo: "$lineNo" },
                totalChecked: { $sum: "$checkedQty" },
                totalDefects: { $sum: "$totalDefectQty" }
              }
            },
            {
              $project: {
                _id: 0,
                factory: "$_id.factory",
                lineNo: "$_id.lineNo",
                defectRate: {
                  $cond: [
                    { $eq: ["$totalChecked", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$totalDefects", "$totalChecked"] },
                        100
                      ]
                    }
                  ]
                }
              }
            },
            { $sort: { factory: 1, lineNo: 1 } }
          ],

          // --- NEW STAGE FOR THE BUYER CHART ---
          buyerPerformance: [
            {
              $group: {
                _id: "$buyer", // Group all records by the buyer's name
                totalChecked: { $sum: "$checkedQty" },
                totalDefects: { $sum: "$totalDefectQty" }
              }
            },
            {
              $project: {
                _id: 0, // Remove the default _id field
                buyer: "$_id", // Rename _id to 'buyer' for clarity
                defectRate: {
                  // Calculate the defect rate, safely handling division by zero
                  $cond: [
                    { $eq: ["$totalChecked", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$totalDefects", "$totalChecked"] },
                        100
                      ]
                    }
                  ]
                }
              }
            },
            { $sort: { defectRate: -1 } } // Sort by the highest defect rate first
          ],

          // --- NEW PIPELINE FOR THE TREND CHART ---
          dailyTrend: [
            {
              // Group all documents by the day of the inspection
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$inspectionDate"
                  }
                },
                totalChecked: { $sum: "$checkedQty" },
                totalDefects: { $sum: "$totalDefectQty" }
              }
            },
            {
              // Calculate the defect rate for each day
              $project: {
                _id: 0, // Remove the default _id
                date: "$_id", // Rename _id to 'date'
                defectRate: {
                  $cond: [
                    { $eq: ["$totalChecked", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$totalDefects", "$totalChecked"] },
                        100
                      ]
                    }
                  ]
                }
              }
            },
            // Sort the results by date in ascending order for the line chart
            { $sort: { date: 1 } }
          ],

          // --- NEW PIPELINE FOR THE PIVOT TABLE DATA ---
          individualDefectTrend: [
            // First, pre-calculate the total checked qty for each day
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$inspectionDate"
                  }
                },
                dailyCheckedQty: { $sum: "$checkedQty" },
                reports: { $push: "$$ROOT" } // Push the full documents for later processing
              }
            },
            // Unwind the reports and then their defect lists
            { $unwind: "$reports" },
            { $unwind: "$reports.defectList" },
            // Now group by date and defect name to get the total defect qty
            {
              $group: {
                _id: {
                  date: "$_id",
                  defectName: "$reports.defectList.defectName"
                },
                totalQty: { $sum: "$reports.defectList.qty" },
                dailyChecked: { $first: "$dailyCheckedQty" } // Carry over the daily total
              }
            },
            // Project the final shape with the calculated defect rate
            {
              $project: {
                _id: 0,
                date: "$_id.date",
                defectName: "$_id.defectName",
                qty: "$totalQty",
                defectRate: {
                  $cond: [
                    { $gt: ["$dailyChecked", 0] },
                    {
                      $multiply: [
                        { $divide: ["$totalQty", "$dailyChecked"] },
                        100
                      ]
                    },
                    0
                  ]
                }
              }
            }
          ],

          // --- NEW PIPELINE TO GET UNIQUE DEFECT NAMES FOR THE FILTER ---
          uniqueDefectNames: [
            { $unwind: "$defectList" },
            {
              $group: {
                _id: null,
                names: { $addToSet: "$defectList.defectName" }
              }
            },
            {
              $project: {
                _id: 0,
                names: { $sortArray: { input: "$names", sortBy: 1 } }
              }
            }
          ],

          // --- 4. Overall QC Totals---
          overallTotalChecked: [
            { $group: { _id: null, total: { $sum: "$checkedQty" } } }
          ],

          // --- 5. Overall QA Totals ---
          qaSummary: [
            {
              $group: {
                _id: null,
                totalQASampleSize: { $sum: "$qaReport.totalCheckedQty" }, //{ $sum: "$qaReport.sampleSize" },
                totalQADefectQty: { $sum: "$qaReport.totalOverallDefectQty" } //{ $sum: "$qaReport.totalDefectQty" }
              }
            }
          ],

          // --- 6. Filter Options ---
          filterOptions: [
            {
              $group: {
                _id: null,
                factories: { $addToSet: "$factory" },
                buyers: { $addToSet: "$buyer" },
                lineNos: { $addToSet: "$lineNo" },
                moNos: { $addToSet: "$moNo" },
                colors: { $addToSet: "$color" }
              }
            },
            {
              $project: {
                _id: 0,
                factories: { $sortArray: { input: "$factories", sortBy: 1 } },
                buyers: { $sortArray: { input: "$buyers", sortBy: 1 } },
                lineNos: { $sortArray: { input: "$lineNos", sortBy: 1 } },
                moNos: { $sortArray: { input: "$moNos", sortBy: 1 } },
                colors: { $sortArray: { input: "$colors", sortBy: 1 } }
              }
            }
          ]
        }
      }
    ]);

    // --- Reshape Data for Frontend ---
    const rawData = result[0];
    const totalChecked = rawData.overallTotalChecked[0]?.total || 0;

    const topDefectsWithRate = rawData.topDefects.map((d) => ({
      defectName: d._id,
      defectQty: d.totalQty,
      defectRate: totalChecked > 0 ? (d.totalQty / totalChecked) * 100 : 0
    }));

    // --- NEW: Safely get QA summary data ---
    const qaSummaryData = rawData.qaSummary[0] || {
      totalQASampleSize: 0,
      totalQADefectQty: 0
    };

    // Get unique defect names, providing an empty array as a default
    const uniqueDefectNames = rawData.uniqueDefectNames[0]?.names || [];

    res.json({
      mainData: rawData.mainData || [],
      topDefects: topDefectsWithRate || [],
      linePerformance: rawData.linePerformance || [],
      buyerPerformance: rawData.buyerPerformance || [],
      dailyTrend: rawData.dailyTrend || [],
      individualDefectTrend: rawData.individualDefectTrend || [],
      uniqueDefectNames: uniqueDefectNames,
      qaSummary: qaSummaryData,
      filterOptions: rawData.filterOptions[0] || {
        factories: [],
        buyers: [],
        lineNos: [],
        moNos: [],
        colors: []
      }
    });
  } catch (error) {
    console.error("Error fetching Sub-Con QC dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

// --- CONTROLLER: DAILY TREND VIEW ---
export const getDailyTrendData = async (req, res) => {
  try {
    const { startDate, endDate, factory, buyer } = req.query;

    const matchQuery = {};
    if (startDate && endDate) {
      matchQuery.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    if (factory) matchQuery.factory = factory;
    if (buyer) matchQuery.buyer = buyer;

    const result = await SubconSewingQc1Report.aggregate([
      { $match: matchQuery },

      {
        $facet: {
          // Facet 1: Get the detailed trend data grouped by factory
          trendDataByFactory: [
            { $unwind: "$defectList" },
            {
              $project: {
                _id: 0,
                factory: "$factory",
                lineNo: "$lineNo",
                moNo: "$moNo",
                defectName: "$defectList.defectName",
                qty: "$defectList.qty",
                date: {
                  $dateToString: { format: "%Y-%m-%d", date: "$inspectionDate" }
                },
                checkedQty: "$checkedQty"
              }
            },
            {
              $group: {
                _id: "$factory",
                trends: { $push: "$$ROOT" }
              }
            },
            {
              $project: {
                _id: 0,
                factory: "$_id",
                trends: "$trends"
              }
            },
            { $sort: { factory: 1 } }
          ],

          // Facet 2: Get all unique filter options for the matched documents
          filterOptions: [
            {
              $group: {
                _id: null,
                buyers: { $addToSet: "$buyer" },
                lineNos: { $addToSet: "$lineNo" },
                moNos: { $addToSet: "$moNo" }
              }
            },
            {
              $project: {
                _id: 0,
                buyers: { $sortArray: { input: "$buyers", sortBy: 1 } },
                lineNos: { $sortArray: { input: "$lineNos", sortBy: 1 } }, // We will sort properly on the frontend
                moNos: { $sortArray: { input: "$moNos", sortBy: 1 } }
              }
            }
          ]
        }
      },
      // Reshape the final output to be a single object
      {
        $project: {
          trendData: "$trendDataByFactory",
          filterOptions: { $arrayElemAt: ["$filterOptions", 0] }
        }
      }
    ]);

    // Ensure a safe response structure even if no data is found
    const responseData = {
      trendData: result[0]?.trendData || [],
      filterOptions: result[0]?.filterOptions || {
        buyers: [],
        lineNos: [],
        moNos: []
      }
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching Sub-Con QC daily trend data:", error);
    res.status(500).json({ error: "Failed to fetch daily trend data" });
  }
};

// --- NEW CONTROLLER: WEEKLY VIEW ---
export const getWeeklyData = async (req, res) => {
  try {
    const { startDate, endDate, factory, buyer, lineNo, moNo, color } =
      req.query;

    const matchQuery = {};
    if (startDate && endDate) {
      matchQuery.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    if (factory) matchQuery.factory = factory;
    if (buyer) matchQuery.buyer = buyer;
    if (lineNo) matchQuery.lineNo = lineNo;
    if (moNo) matchQuery.moNo = moNo;
    if (color) matchQuery.color = color;

    const result = await SubconSewingQc1Report.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          // --- 1. Main Table Data (Weekly Aggregation) ---
          mainData: [
            {
              $group: {
                _id: {
                  factory: "$factory",
                  lineNo: "$lineNo",
                  moNo: "$moNo",
                  buyer: "$buyer",
                  color: "$color"
                },
                totalCheckedQty: { $sum: "$checkedQty" },
                totalDefectQty: { $sum: "$totalDefectQty" }
              }
            },
            {
              $project: {
                _id: {
                  $concat: [
                    "$_id.factory",
                    "-",
                    "$_id.lineNo",
                    "-",
                    "$_id.moNo",
                    "-",
                    "$_id.color"
                  ]
                },
                factory: "$_id.factory",
                lineNo: "$_id.lineNo",
                moNo: "$_id.moNo",
                buyer: "$_id.buyer",
                color: "$_id.color",
                totalCheckedQty: "$totalCheckedQty",
                totalDefectQty: "$totalDefectQty",
                defectRate: {
                  $cond: [
                    { $gt: ["$totalCheckedQty", 0] },
                    {
                      $multiply: [
                        { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                        100
                      ]
                    },
                    0
                  ]
                }
              }
            },
            { $sort: { factory: 1, lineNo: 1, defectRate: -1 } }
          ],

          // --- 2. Top Defects (Calculated over the entire period) ---
          topDefects: [
            { $unwind: "$defectList" },
            {
              $group: {
                _id: "$defectList.defectName",
                totalQty: { $sum: "$defectList.qty" }
              }
            },
            { $sort: { totalQty: -1 } }
          ],

          // --- 3. Performance by Line ---
          linePerformance: [
            {
              $group: {
                _id: { factory: "$factory", lineNo: "$lineNo" },
                totalChecked: { $sum: "$checkedQty" },
                totalDefects: { $sum: "$totalDefectQty" }
              }
            },
            {
              $project: {
                _id: 0,
                factory: "$_id.factory",
                lineNo: "$_id.lineNo",
                defectRate: {
                  $cond: [
                    { $eq: ["$totalChecked", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$totalDefects", "$totalChecked"] },
                        100
                      ]
                    }
                  ]
                }
              }
            },
            { $sort: { factory: 1, lineNo: 1 } }
          ],

          // --- 4. Performance by Buyer ---
          buyerPerformance: [
            {
              $group: {
                _id: "$buyer",
                totalChecked: { $sum: "$checkedQty" },
                totalDefects: { $sum: "$totalDefectQty" }
              }
            },
            {
              $project: {
                _id: 0,
                buyer: "$_id",
                defectRate: {
                  $cond: [
                    { $eq: ["$totalChecked", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$totalDefects", "$totalChecked"] },
                        100
                      ]
                    }
                  ]
                }
              }
            },
            { $sort: { defectRate: -1 } }
          ],

          // --- 5. Weekly Trend Chart ---
          weeklyTrend: [
            {
              $group: {
                _id: {
                  // Group by the start of the week (Monday)
                  $dateTrunc: {
                    date: "$inspectionDate",
                    unit: "week",
                    startOfWeek: "monday"
                  }
                },
                totalChecked: { $sum: "$checkedQty" },
                totalDefects: { $sum: "$totalDefectQty" }
              }
            },
            {
              $project: {
                _id: 0,
                weekStart: "$_id",
                weekEnd: {
                  $dateAdd: { startDate: "$_id", unit: "day", amount: 6 }
                }, // Add 6 days to get Sunday
                defectRate: {
                  $cond: [
                    { $eq: ["$totalChecked", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$totalDefects", "$totalChecked"] },
                        100
                      ]
                    }
                  ]
                }
              }
            },
            {
              $project: {
                weekRange: {
                  $concat: [
                    {
                      $dateToString: { format: "%Y-%m-%d", date: "$weekStart" }
                    },
                    " to ",
                    { $dateToString: { format: "%Y-%m-%d", date: "$weekEnd" } }
                  ]
                },
                defectRate: 1
              }
            },
            { $sort: { weekStart: 1 } }
          ],

          // --- 6. Weekly Individual Defect Trend (Pivot Table Data) ---
          individualDefectTrend: [
            {
              $group: {
                _id: {
                  $dateTrunc: {
                    date: "$inspectionDate",
                    unit: "week",
                    startOfWeek: "monday"
                  }
                },
                weeklyCheckedQty: { $sum: "$checkedQty" },
                reports: { $push: "$$ROOT" }
              }
            },
            { $unwind: "$reports" },
            { $unwind: "$reports.defectList" },
            {
              $group: {
                _id: {
                  week: "$_id",
                  defectName: "$reports.defectList.defectName"
                },
                totalQty: { $sum: "$reports.defectList.qty" },
                weeklyChecked: { $first: "$weeklyCheckedQty" }
              }
            },
            {
              $project: {
                _id: 0,
                weekStart: "$_id.week",
                defectName: "$_id.defectName",
                qty: "$totalQty",
                defectRate: {
                  $cond: [
                    { $gt: ["$weeklyChecked", 0] },
                    {
                      $multiply: [
                        { $divide: ["$totalQty", "$weeklyChecked"] },
                        100
                      ]
                    },
                    0
                  ]
                }
              }
            },
            {
              $project: {
                weekRange: {
                  $concat: [
                    {
                      $dateToString: { format: "%Y-%m-%d", date: "$weekStart" }
                    },
                    " to ",
                    {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: {
                          $dateAdd: {
                            startDate: "$weekStart",
                            unit: "day",
                            amount: 6
                          }
                        }
                      }
                    }
                  ]
                },
                defectName: 1,
                qty: 1,
                defectRate: 1
              }
            }
          ],

          // Other facets (totals, unique names, filter options)
          uniqueDefectNames: [
            { $unwind: "$defectList" },
            {
              $group: {
                _id: null,
                names: { $addToSet: "$defectList.defectName" }
              }
            },
            {
              $project: {
                _id: 0,
                names: { $sortArray: { input: "$names", sortBy: 1 } }
              }
            }
          ],
          overallTotalChecked: [
            { $group: { _id: null, total: { $sum: "$checkedQty" } } }
          ],
          filterOptions: [
            {
              $group: {
                _id: null,
                factories: { $addToSet: "$factory" },
                buyers: { $addToSet: "$buyer" },
                lineNos: { $addToSet: "$lineNo" },
                moNos: { $addToSet: "$moNo" },
                colors: { $addToSet: "$color" }
              }
            },
            {
              $project: {
                _id: 0,
                factories: { $sortArray: { input: "$factories", sortBy: 1 } },
                buyers: { $sortArray: { input: "$buyers", sortBy: 1 } },
                lineNos: { $sortArray: { input: "$lineNos", sortBy: 1 } },
                moNos: { $sortArray: { input: "$moNos", sortBy: 1 } },
                colors: { $sortArray: { input: "$colors", sortBy: 1 } }
              }
            }
          ]
        }
      }
    ]);

    // --- Reshape Data for Frontend ---
    const rawData = result[0];
    const totalChecked = rawData.overallTotalChecked[0]?.total || 0;
    const topDefectsWithRate = rawData.topDefects.map((d) => ({
      defectName: d._id,
      defectQty: d.totalQty,
      defectRate: totalChecked > 0 ? (d.totalQty / totalChecked) * 100 : 0
    }));
    const uniqueDefectNames = rawData.uniqueDefectNames[0]?.names || [];

    res.json({
      mainData: rawData.mainData || [],
      topDefects: topDefectsWithRate || [],
      linePerformance: rawData.linePerformance || [],
      buyerPerformance: rawData.buyerPerformance || [],
      weeklyTrend: rawData.weeklyTrend || [], // Changed from dailyTrend
      individualDefectTrend: rawData.individualDefectTrend || [],
      uniqueDefectNames: uniqueDefectNames,
      filterOptions: rawData.filterOptions[0] || {
        factories: [],
        buyers: [],
        lineNos: [],
        moNos: [],
        colors: []
      }
    });
  } catch (error) {
    console.error("Error fetching Sub-Con QC weekly dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch weekly dashboard data" });
  }
};

// --- CONTROLLER: MONTHLY VIEW ---
export const getMonthlyData = async (req, res) => {
  try {
    const { year, startMonth, endMonth, factory, buyer, lineNo, moNo, color } =
      req.query;

    const numYear = parseInt(year);
    const numStartMonth = parseInt(startMonth);
    const numEndMonth = parseInt(endMonth);

    // --- Date Range Construction ---
    const startDate = new Date(Date.UTC(numYear, numStartMonth - 1, 1));
    const endDate = new Date(Date.UTC(numYear, numEndMonth, 1));

    const matchQuery = {
      inspectionDate: { $gte: startDate, $lt: endDate }
    };

    if (factory) matchQuery.factory = factory;
    if (buyer) matchQuery.buyer = buyer;
    if (lineNo) matchQuery.lineNo = lineNo;
    if (moNo) matchQuery.moNo = moNo;
    if (color) matchQuery.color = color;

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];

    const result = await SubconSewingQc1Report.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          // --- 1. Main Table Data (Monthly Aggregation) ---
          mainData: [
            {
              $group: {
                _id: {
                  month: {
                    $month: { date: "$inspectionDate", timezone: "UTC" }
                  },
                  factory: "$factory",
                  lineNo: "$lineNo",
                  moNo: "$moNo",
                  buyer: "$buyer",
                  color: "$color"
                },
                totalCheckedQty: { $sum: "$checkedQty" },
                totalDefectQty: { $sum: "$totalDefectQty" }
              }
            },
            {
              $project: {
                _id: {
                  $concat: [
                    { $toString: "$_id.month" },
                    "-",
                    "$_id.factory",
                    "-",
                    "$_id.lineNo",
                    "-",
                    "$_id.moNo",
                    "-",
                    "$_id.color"
                  ]
                },
                month: "$_id.month",
                monthName: {
                  $arrayElemAt: [monthNames, { $subtract: ["$_id.month", 1] }]
                },
                factory: "$_id.factory",
                lineNo: "$_id.lineNo",
                moNo: "$_id.moNo",
                buyer: "$_id.buyer",
                color: "$_id.color",
                totalCheckedQty: 1,
                totalDefectQty: 1,
                defectRate: {
                  $cond: [
                    { $gt: ["$totalCheckedQty", 0] },
                    {
                      $multiply: [
                        { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                        100
                      ]
                    },
                    0
                  ]
                }
              }
            },
            { $sort: { month: 1, factory: 1, lineNo: 1 } }
          ],

          // --- 2. Monthly Trend Chart ---
          monthlyTrend: [
            {
              $group: {
                _id: {
                  month: {
                    $month: { date: "$inspectionDate", timezone: "UTC" }
                  }
                },
                totalChecked: { $sum: "$checkedQty" },
                totalDefects: { $sum: "$totalDefectQty" }
              }
            },
            {
              $project: {
                _id: 0,
                month: "$_id.month",
                monthName: {
                  $arrayElemAt: [monthNames, { $subtract: ["$_id.month", 1] }]
                },
                defectRate: {
                  $cond: [
                    { $eq: ["$totalChecked", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$totalDefects", "$totalChecked"] },
                        100
                      ]
                    }
                  ]
                }
              }
            },
            { $sort: { month: 1 } }
          ],

          // --- 3. Monthly Individual Defect Trend (Pivot Table) ---
          individualDefectTrend: [
            {
              $group: {
                _id: {
                  month: {
                    $month: { date: "$inspectionDate", timezone: "UTC" }
                  }
                },
                monthlyCheckedQty: { $sum: "$checkedQty" },
                reports: { $push: "$$ROOT" }
              }
            },
            { $unwind: "$reports" },
            { $unwind: "$reports.defectList" },
            {
              $group: {
                _id: {
                  month: "$_id.month",
                  defectName: "$reports.defectList.defectName"
                },
                totalQty: { $sum: "$reports.defectList.qty" },
                monthlyChecked: { $first: "$monthlyCheckedQty" }
              }
            },
            {
              $project: {
                _id: 0,
                month: "$_id.month",
                monthName: {
                  $arrayElemAt: [monthNames, { $subtract: ["$_id.month", 1] }]
                },
                defectName: "$_id.defectName",
                qty: "$totalQty",
                defectRate: {
                  $cond: [
                    { $gt: ["$monthlyChecked", 0] },
                    {
                      $multiply: [
                        { $divide: ["$totalQty", "$monthlyChecked"] },
                        100
                      ]
                    },
                    0
                  ]
                }
              }
            },
            { $sort: { month: 1, defectName: 1 } }
          ],

          topDefects: [
            { $unwind: "$defectList" },
            {
              $group: {
                _id: "$defectList.defectName",
                totalQty: { $sum: "$defectList.qty" }
              }
            },
            { $sort: { totalQty: -1 } }
          ],
          linePerformance: [
            {
              $group: {
                _id: { factory: "$factory", lineNo: "$lineNo" },
                totalChecked: { $sum: "$checkedQty" },
                totalDefects: { $sum: "$totalDefectQty" }
              }
            },
            {
              $project: {
                _id: 0,
                factory: "$_id.factory",
                lineNo: "$_id.lineNo",
                defectRate: {
                  $cond: [
                    { $eq: ["$totalChecked", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$totalDefects", "$totalChecked"] },
                        100
                      ]
                    }
                  ]
                }
              }
            },
            { $sort: { factory: 1, lineNo: 1 } }
          ],
          buyerPerformance: [
            {
              $group: {
                _id: "$buyer",
                totalChecked: { $sum: "$checkedQty" },
                totalDefects: { $sum: "$totalDefectQty" }
              }
            },
            {
              $project: {
                _id: 0,
                buyer: "$_id",
                defectRate: {
                  $cond: [
                    { $eq: ["$totalChecked", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$totalDefects", "$totalChecked"] },
                        100
                      ]
                    }
                  ]
                }
              }
            },
            { $sort: { defectRate: -1 } }
          ],
          uniqueDefectNames: [
            { $unwind: "$defectList" },
            {
              $group: {
                _id: null,
                names: { $addToSet: "$defectList.defectName" }
              }
            },
            {
              $project: {
                _id: 0,
                names: { $sortArray: { input: "$names", sortBy: 1 } }
              }
            }
          ],
          overallTotalChecked: [
            { $group: { _id: null, total: { $sum: "$checkedQty" } } }
          ],
          filterOptions: [
            {
              $group: {
                _id: null,
                factories: { $addToSet: "$factory" },
                buyers: { $addToSet: "$buyer" },
                lineNos: { $addToSet: "$lineNo" },
                moNos: { $addToSet: "$moNo" },
                colors: { $addToSet: "$color" }
              }
            },
            {
              $project: {
                _id: 0,
                factories: { $sortArray: { input: "$factories", sortBy: 1 } },
                buyers: { $sortArray: { input: "$buyers", sortBy: 1 } },
                lineNos: { $sortArray: { input: "$lineNos", sortBy: 1 } },
                moNos: { $sortArray: { input: "$moNos", sortBy: 1 } },
                colors: { $sortArray: { input: "$colors", sortBy: 1 } }
              }
            }
          ]
        }
      }
    ]);

    // --- Reshape Data for Frontend ---
    const rawData = result[0];
    const totalChecked = rawData.overallTotalChecked[0]?.total || 0;
    const topDefectsWithRate = rawData.topDefects.map((d) => ({
      defectName: d._id,
      defectQty: d.totalQty,
      defectRate: totalChecked > 0 ? (d.totalQty / totalChecked) * 100 : 0
    }));
    const uniqueDefectNames = rawData.uniqueDefectNames[0]?.names || [];

    res.json({
      mainData: rawData.mainData || [],
      topDefects: topDefectsWithRate,
      linePerformance: rawData.linePerformance || [],
      buyerPerformance: rawData.buyerPerformance || [],
      monthlyTrend: rawData.monthlyTrend || [],
      individualDefectTrend: rawData.individualDefectTrend || [],
      uniqueDefectNames: uniqueDefectNames,
      filterOptions: rawData.filterOptions[0] || {
        factories: [],
        buyers: [],
        lineNos: [],
        moNos: [],
        colors: []
      }
    });
  } catch (error) {
    console.error("Error fetching Sub-Con QC monthly dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch monthly dashboard data" });
  }
};

// --- CONTROLLER: WEEKLY TREND VIEW ---
export const getWeeklyTrendData = async (req, res) => {
  try {
    const { startDate, endDate, factory, buyer } = req.query;

    const matchQuery = {};
    if (startDate && endDate) {
      matchQuery.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    if (factory) matchQuery.factory = factory;
    if (buyer) matchQuery.buyer = buyer;

    const result = await SubconSewingQc1Report.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          // Facet 1: Get the detailed trend data grouped by factory
          trendDataByFactory: [
            { $unwind: "$defectList" },
            {
              $project: {
                _id: 0,
                factory: "$factory",
                lineNo: "$lineNo",
                moNo: "$moNo",
                defectName: "$defectList.defectName",
                qty: "$defectList.qty",
                checkedQty: "$checkedQty",
                weekStart: {
                  $dateTrunc: {
                    date: "$inspectionDate",
                    unit: "week",
                    startOfWeek: "monday"
                  }
                }
              }
            },
            {
              $project: {
                factory: 1,
                lineNo: 1,
                moNo: 1,
                defectName: 1,
                qty: 1,
                checkedQty: 1,
                weekRange: {
                  $concat: [
                    {
                      $dateToString: { format: "%Y-%m-%d", date: "$weekStart" }
                    },
                    " to ",
                    {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: {
                          $dateAdd: {
                            startDate: "$weekStart",
                            unit: "day",
                            amount: 6
                          }
                        }
                      }
                    }
                  ]
                }
              }
            },
            {
              $group: {
                _id: "$factory",
                trends: { $push: "$$ROOT" }
              }
            },
            {
              $project: {
                _id: 0,
                factory: "$_id",
                trends: "$trends"
              }
            },
            { $sort: { factory: 1 } }
          ],

          // Facet 2: Get all unique filter options for the matched documents
          filterOptions: [
            {
              $group: {
                _id: null,
                buyers: { $addToSet: "$buyer" },
                lineNos: { $addToSet: "$lineNo" },
                moNos: { $addToSet: "$moNo" }
              }
            },
            {
              $project: {
                _id: 0,
                buyers: { $sortArray: { input: "$buyers", sortBy: 1 } },
                lineNos: { $sortArray: { input: "$lineNos", sortBy: 1 } },
                moNos: { $sortArray: { input: "$moNos", sortBy: 1 } }
              }
            }
          ]
        }
      },
      {
        $project: {
          trendData: "$trendDataByFactory",
          filterOptions: { $arrayElemAt: ["$filterOptions", 0] }
        }
      }
    ]);

    const responseData = {
      trendData: result[0]?.trendData || [],
      filterOptions: result[0]?.filterOptions || {
        buyers: [],
        lineNos: [],
        moNos: []
      }
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching Sub-Con QC weekly trend data:", error);
    res.status(500).json({ error: "Failed to fetch weekly trend data" });
  }
};

// --- CONTROLLER: MONTHLY TREND VIEW ---
export const getMonthlyTrendData = async (req, res) => {
  try {
    const { year, startMonth, endMonth, factory, buyer } = req.query;

    const numYear = parseInt(year);
    const numStartMonth = parseInt(startMonth);
    const numEndMonth = parseInt(endMonth);

    const startDate = new Date(Date.UTC(numYear, numStartMonth - 1, 1));
    const endDate = new Date(Date.UTC(numYear, numEndMonth, 1));

    const matchQuery = {
      inspectionDate: { $gte: startDate, $lt: endDate }
    };

    if (factory) matchQuery.factory = factory;
    if (buyer) matchQuery.buyer = buyer;

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];

    const result = await SubconSewingQc1Report.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          // Facet 1: Get the detailed trend data grouped by factory
          trendDataByFactory: [
            { $unwind: "$defectList" },
            {
              $project: {
                _id: 0,
                factory: "$factory",
                lineNo: "$lineNo",
                moNo: "$moNo",
                defectName: "$defectList.defectName",
                qty: "$defectList.qty",
                checkedQty: "$checkedQty",
                monthNumber: {
                  $month: { date: "$inspectionDate", timezone: "UTC" }
                }
              }
            },
            {
              $project: {
                factory: 1,
                lineNo: 1,
                moNo: 1,
                defectName: 1,
                qty: 1,
                checkedQty: 1,
                monthName: {
                  $arrayElemAt: [monthNames, { $subtract: ["$monthNumber", 1] }]
                }
              }
            },
            {
              $group: {
                _id: "$factory",
                trends: { $push: "$$ROOT" }
              }
            },
            {
              $project: {
                _id: 0,
                factory: "$_id",
                trends: "$trends"
              }
            },
            { $sort: { factory: 1 } }
          ],

          // Facet 2: Get all unique filter options for the matched documents
          filterOptions: [
            {
              $group: {
                _id: null,
                buyers: { $addToSet: "$buyer" },
                lineNos: { $addToSet: "$lineNo" },
                moNos: { $addToSet: "$moNo" }
              }
            },
            {
              $project: {
                _id: 0,
                buyers: { $sortArray: { input: "$buyers", sortBy: 1 } },
                lineNos: { $sortArray: { input: "$lineNos", sortBy: 1 } },
                moNos: { $sortArray: { input: "$moNos", sortBy: 1 } }
              }
            }
          ]
        }
      },
      {
        $project: {
          trendData: "$trendDataByFactory",
          filterOptions: { $arrayElemAt: ["$filterOptions", 0] }
        }
      }
    ]);

    const responseData = {
      trendData: result[0]?.trendData || [],
      filterOptions: result[0]?.filterOptions || {
        buyers: [],
        lineNos: [],
        moNos: []
      }
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching Sub-Con QC monthly trend data:", error);
    res.status(500).json({ error: "Failed to fetch monthly trend data" });
  }
};
