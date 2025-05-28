import bcrypt from "bcrypt";
import {
  QCData,                
} from "../../Config/mongodb.js";

/* ------------------------------
   End Points - Live Dashboard - QC1
------------------------------ */

export const getDashboardStats = async (req, res) => {
    try {
        const { factory, lineNo, moNo, customer, timeInterval = "1" } = req.query;
        let matchQuery = {};
    
        // Apply filters if provided
        if (factory) matchQuery["headerData.factory"] = factory;
        if (lineNo) matchQuery["headerData.lineNo"] = lineNo;
        if (moNo) matchQuery["headerData.moNo"] = moNo;
        if (customer) matchQuery["headerData.customer"] = customer;
    
        // Get unique filter values
        const filterValues = await QCData.aggregate([
          {
            $group: {
              _id: null,
              factories: { $addToSet: "$headerData.factory" },
              lineNos: { $addToSet: "$headerData.lineNo" },
              moNos: { $addToSet: "$headerData.moNo" },
              customers: { $addToSet: "$headerData.customer" },
            },
          },
        ]);
    
        // Get overall stats
        const stats = await QCData.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: null,
              totalCheckedQty: { $sum: "$checkedQty" },
              totalDefectQty: { $sum: "$defectQty" },
              totalDefectPieces: { $sum: "$defectPieces" },
              totalReturnDefectQty: { $sum: "$returnDefectQty" },
              totalGoodOutput: { $sum: "$goodOutput" },
              latestDefectArray: { $last: "$defectArray" },
              latestHeaderData: { $last: "$headerData" }
            }
          }
        ]);
    
        // Get defect rate by line
        const defectRateByLine = await QCData.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: "$headerData.lineNo",
              checkedQty: { $sum: "$checkedQty" },
              defectQty: { $sum: "$defectQty" },
            },
          },
          {
            $project: {
              lineNo: "$_id",
              defectRate: {
                $multiply: [
                  { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
                  100,
                ],
              },
            },
          },
          { $sort: { defectRate: -1 } },
        ]);
    
        // Get defect rate by MO
        const defectRateByMO = await QCData.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: "$headerData.moNo",
              checkedQty: { $sum: "$checkedQty" },
              defectQty: { $sum: "$defectQty" },
            },
          },
          {
            $project: {
              moNo: "$_id",
              defectRate: {
                $multiply: [
                  { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
                  100,
                ],
              },
            },
          },
          { $sort: { defectRate: -1 } },
        ]);
    
        // Get defect rate by customer
        const defectRateByCustomer = await QCData.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: "$headerData.customer",
              checkedQty: { $sum: "$checkedQty" },
              defectQty: { $sum: "$defectQty" },
            },
          },
          {
            $project: {
              customer: "$_id",
              defectRate: {
                $multiply: [
                  { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
                  100,
                ],
              },
            },
          },
          { $sort: { defectRate: -1 } },
        ]);
    
        // Get top defects
        const topDefects = await QCData.aggregate([
          { $match: matchQuery },
          { $unwind: "$defectArray" },
          {
            $group: {
              _id: "$defectArray.name",
              count: { $sum: "$defectArray.count" }
            }
          },
          { $sort: { count: -1 } }
        ]);
    
        // In server.js, replace the timeSeriesData aggregation with:
        const timeSeriesData = await QCData.aggregate([
          { $match: matchQuery },
          {
            $addFields: {
              timeComponents: {
                $let: {
                  vars: {
                    timeParts: { $split: ["$formattedTimestamp", ":"] }
                  },
                  in: {
                    hours: { $toInt: { $arrayElemAt: ["$$timeParts", 0] } },
                    minutes: { $toInt: { $arrayElemAt: ["$$timeParts", 1] } },
                    seconds: { $toInt: { $arrayElemAt: ["$$timeParts", 2] } }
                  }
                }
              }
            }
          },
          {
            $addFields: {
              totalMinutes: {
                $add: [
                  { $multiply: ["$timeComponents.hours", 60] },
                  "$timeComponents.minutes"
                ]
              }
            }
          },
          {
            $sort: { timestamp: 1 }
          },
          {
            $group: {
              _id: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: [parseInt(timeInterval), 1] },
                      then: {
                        $multiply: [
                          { $floor: { $divide: ["$totalMinutes", 1] } },
                          1
                        ]
                      }
                    },
                    {
                      case: { $eq: [parseInt(timeInterval), 15] },
                      then: {
                        $multiply: [
                          { $floor: { $divide: ["$totalMinutes", 15] } },
                          15
                        ]
                      }
                    },
                    {
                      case: { $eq: [parseInt(timeInterval), 30] },
                      then: {
                        $multiply: [
                          { $floor: { $divide: ["$totalMinutes", 30] } },
                          30
                        ]
                      }
                    },
                    {
                      case: { $eq: [parseInt(timeInterval), 60] },
                      then: {
                        $multiply: [
                          { $floor: { $divide: ["$totalMinutes", 60] } },
                          60
                        ]
                      }
                    }
                  ],
                  default: "$totalMinutes"
                }
              },
              // Use last record for the time period to get cumulative values
              cumulativeChecked: { $last: "$cumulativeChecked" },
              cumulativeDefects: { $last: "$cumulativeDefects" }
            }
          },
          {
            $project: {
              timestamp: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: [parseInt(timeInterval), 60] },
                      then: { $toString: { $divide: ["$_id", 60] } }
                    }
                  ],
                  default: { $toString: "$_id" }
                }
              },
              checkedQty: "$cumulativeChecked",
              defectQty: "$cumulativeDefects",
              defectRate: {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$cumulativeDefects",
                          { $max: ["$cumulativeChecked", 1] }
                        ]
                      },
                      100
                    ]
                  },
                  2
                ]
              }
            }
          },
          { $sort: { _id: 1 } }
        ]);
    
        const dashboardData = stats[0] || {
          totalCheckedQty: 0,
          totalDefectQty: 0,
          totalDefectPieces: 0,
          totalReturnDefectQty: 0,
          totalGoodOutput: 0,
          latestHeaderData: {},
        };
    
        const totalInspected = dashboardData.totalCheckedQty || 0;
    
        res.json({
          filters: filterValues[0] || {
            factories: [],
            lineNos: [],
            moNos: [],
            customers: [],
          },
          headerInfo: dashboardData.latestHeaderData,
          stats: {
            checkedQty: dashboardData.totalCheckedQty || 0,
            defectQty: dashboardData.totalDefectQty || 0,
            defectPieces: dashboardData.totalDefectPieces || 0,
            returnDefectQty: dashboardData.totalReturnDefectQty || 0,
            goodOutput: dashboardData.totalGoodOutput || 0,
            defectRate: totalInspected
              ? ((dashboardData.totalDefectQty / totalInspected) * 100).toFixed(2)
              : 0,
            defectRatio: totalInspected
              ? ((dashboardData.totalDefectPieces / totalInspected) * 100).toFixed(
                  2
                )
              : 0
          },
          defectRateByLine,
          defectRateByMO,
          defectRateByCustomer,
          topDefects,
          timeSeriesData
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
      }
};