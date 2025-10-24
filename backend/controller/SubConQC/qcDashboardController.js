import { 
SubconSewingQc1Report,           
} from "../MongoDB/dbConnectionController.js";

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
  
            // --- 4. Overall QC Totals (No Change) ---
            overallTotalChecked: [
              { $group: { _id: null, total: { $sum: "$checkedQty" } } }
            ],
  
            // --- NEW 5. Overall QA Totals ---
            qaSummary: [
              {
                $group: {
                  _id: null,
                  totalQASampleSize: { $sum: "$qaReport.sampleSize" },
                  totalQADefectQty: { $sum: "$qaReport.totalDefectQty" }
                }
              }
            ],
  
            // --- 6. Filter Options (No Change) ---
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