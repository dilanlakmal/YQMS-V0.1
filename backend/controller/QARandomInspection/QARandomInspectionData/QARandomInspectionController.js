import mongoose from "mongoose";
import { 
  QCAccuracyReportModel,
  ymProdConnection,
  UserMain,
 } from "../../MongoDB/dbConnectionController.js";

// --- FIX #1: NEW ENDPOINT TO POPULATE FILTER DROPDOWNS ---
export const populateFilters = async (req, res) => {
  try {
      const [qaIds, qcIds, moNos, lineNos, tableNos] = await Promise.all([
        QCAccuracyReportModel.distinct("qcInspector.empId"),
        QCAccuracyReportModel.distinct("scannedQc.empId"),
        QCAccuracyReportModel.distinct("moNo"),
        QCAccuracyReportModel.distinct("lineNo", { lineNo: { $ne: "NA" } }),
        QCAccuracyReportModel.distinct("tableNo", { tableNo: { $ne: "NA" } })
      ]);
  
      res.json({
        qaIds: qaIds.sort(),
        qcIds: qcIds.sort(),
        moNos: moNos.sort(),
        lineNos: lineNos.sort((a, b) => a - b), // Sort numbers correctly
        tableNos: tableNos.sort()
      });
    } catch (error) {
      console.error("Error fetching filter options:", error);
      res.status(500).json({ message: "Server error fetching filter options" });
    }
};

// --- FIX #2: CORRECTED RESULTS AGGREGATION ENDPOINT ---
export const getQAAccuracyResults = async (req, res) => {
  try {
      const {
        startDate,
        endDate,
        qaId,
        qcId,
        reportType,
        moNo,
        lineNo,
        tableNo
      } = req.query;
  
      // --- 1. Build the initial match stage for filtering ---
      const matchStage = {};
  
      // Important: Only add filters if they have a value.
      if (startDate && endDate) {
        matchStage.reportDate = {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        };
      }
      if (qaId) matchStage["qcInspector.empId"] = qaId;
      if (qcId) matchStage["scannedQc.empId"] = qcId;
      if (reportType) matchStage.reportType = reportType;
      if (moNo) matchStage.moNo = moNo;
  
      // Correctly handle conditional filtering for Line No / Table No
      if (reportType === "Inline Finishing") {
        if (tableNo) matchStage.tableNo = tableNo;
      } else {
        // For 'First Output', 'Inline Sewing', or if no reportType is selected
        if (lineNo) matchStage.lineNo = lineNo;
      }
  
      // --- 2. Main Aggregation Pipeline  ---
      const results = await QCAccuracyReportModel.aggregate([
        { $match: matchStage },
  
        { $unwind: { path: "$defects", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$_id",
            reportDate: { $first: "$reportDate" },
            createdAt: { $first: "$createdAt" },
            scannedQc: { $first: "$scannedQc" },
            qcInspector: { $first: "$qcInspector" },
            reportType: { $first: "$reportType" },
            moNo: { $first: "$moNo" },
            colors: { $first: "$colors" },
            sizes: { $first: "$sizes" },
            lineNo: { $first: "$lineNo" },
            tableNo: { $first: "$tableNo" },
            totalCheckedQty: { $first: "$totalCheckedQty" },
            result: { $first: "$result" },
            grade: { $first: "$grade" },
            totalDefectPoints: { $first: "$totalDefectPoints" },
            totalDefectsInReport: { $sum: "$defects.qty" },
            uniquePcsInReport: { $addToSet: "$defects.pcsNo" },
            defects: { $push: "$defects" }
          }
        },
        {
          $group: {
            _id: "$scannedQc.empId",
            qcName: { $first: "$scannedQc.engName" },
            totalChecked: { $sum: "$totalCheckedQty" },
            totalDefectPoints: { $sum: "$totalDefectPoints" },
            totalReports: { $sum: 1 },
            passCount: { $sum: { $cond: [{ $eq: ["$result", "Pass"] }, 1, 0] } },
            failCount: { $sum: { $cond: [{ $eq: ["$result", "Fail"] }, 1, 0] } },
            totalRejectedPcs: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$uniquePcsInReport",
                    as: "item",
                    cond: { $ne: ["$$item", null] }
                  }
                }
              }
            },
            //totalRejectedPcs: { $sum: { $size: "$uniquePcsInReport" } },
            totalDefects: { $sum: "$totalDefectsInReport" },
            // --- NEW: Calculate counts for each defect status ---
            minorCount: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$defects",
                    as: "d",
                    cond: { $eq: ["$$d.standardStatus", "Minor"] }
                  }
                }
              }
            },
            majorCount: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$defects",
                    as: "d",
                    cond: { $eq: ["$$d.standardStatus", "Major"] }
                  }
                }
              }
            },
            criticalCount: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$defects",
                    as: "d",
                    cond: { $eq: ["$$d.standardStatus", "Critical"] }
                  }
                }
              }
            },
            reports: { $push: "$$ROOT" }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "emp_id",
            as: "qcUserDetails"
          }
        },
        {
          $project: {
            _id: 0,
            qcId: "$_id",
            qcName: "$qcName",
            facePhoto: { $arrayElemAt: ["$qcUserDetails.face_photo", 0] },
            stats: {
              totalChecked: "$totalChecked",
              totalRejectedPcs: "$totalRejectedPcs",
              totalDefects: "$totalDefects",
              passCount: "$passCount",
              failCount: "$failCount",
              minorCount: "$minorCount", // Pass new counts
              majorCount: "$majorCount",
              criticalCount: "$criticalCount",
              accuracy: {
                $cond: [
                  { $eq: ["$totalChecked", 0] },
                  0,
                  {
                    $multiply: [
                      {
                        $subtract: [
                          1,
                          { $divide: ["$totalDefectPoints", "$totalChecked"] }
                        ]
                      },
                      100
                    ]
                  }
                ]
              }
            },
            reports: "$reports"
          }
        }
      ]);
  
      res.json(results);
    } catch (error) {
      console.error("Error fetching QA Accuracy results:", error);
      res
        .status(500)
        .json({ message: "Server error fetching results", error: error.message });
    }
};

// --- FIX #1: NEW ENDPOINT FOR PAGINATED FULL REPORT ---
export const getFullReport = async (req, res) => {
  try {
      const {
        startDate,
        endDate,
        qaId,
        qcId,
        reportType,
        moNo,
        lineNo,
        tableNo,
        grade, // This is the new filter parameter from the frontend
        page = 1,
        limit = 50
      } = req.query;
  
      // 1. Build the match stage for filtering
      const matchStage = {};
      if (startDate && endDate) {
        matchStage.reportDate = {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        };
      }
      if (qaId) matchStage["qcInspector.empId"] = qaId;
      if (qcId) matchStage["scannedQc.empId"] = qcId;
      if (reportType) matchStage.reportType = reportType;
      if (moNo) matchStage.moNo = moNo;
      if (reportType === "Inline Finishing" && tableNo) {
        matchStage.tableNo = tableNo;
      } else if (lineNo) {
        matchStage.lineNo = lineNo;
      }
      // Add the new grade filter to the match stage
      if (grade) matchStage.grade = grade;
  
      // 2. Define custom sorting orders
      const reportTypeSortOrder = {
        "Inline Sewing": 1,
        "Inline Finishing": 2,
        "First Output": 3
      };
      const gradeSortOrder = { A: 1, B: 2, C: 3, D: 4 };
  
      // 3. Create the main aggregation pipeline
      const aggregationPipeline = [
        { $match: matchStage },
        // Add custom sort fields
        {
          $addFields: {
            reportTypeSort: { $ifNull: [reportTypeSortOrder[`$reportType`], 99] },
            gradeSort: { $ifNull: [gradeSortOrder[`$grade`], 99] },
            // --- FIX: USE $CONVERT FOR SAFE TYPE CONVERSION ---
            lineNoNumeric: {
              $convert: {
                input: "$lineNo",
                to: "int",
                onError: 9999, // If conversion fails (e.g., "NA"), use a high number
                onNull: 9999 // If the field is null, also use a high number
              }
            }
            //lineNoNumeric: { $toInt: "$lineNo" } // Convert lineNo to number for proper sorting
          }
        },
        // Apply the complex multi-level sort
        {
          $sort: {
            reportDate: 1,
            reportTypeSort: 1,
            lineNoNumeric: 1,
            gradeSort: 1,
            createdAt: 1
          }
        }
      ];
  
      // 4. Execute a second pipeline to get the total count for pagination
      const countPipeline = [...aggregationPipeline, { $count: "total" }];
      const totalDocuments = await QCAccuracyReportModel.aggregate(countPipeline);
      const total = totalDocuments.length > 0 ? totalDocuments[0].total : 0;
  
      // 5. Add pagination to the main pipeline and execute
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;
  
      aggregationPipeline.push({ $skip: skip });
      aggregationPipeline.push({ $limit: limitNum });
  
      const reports = await QCAccuracyReportModel.aggregate(aggregationPipeline);
  
      res.json({
        reports,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error("Error fetching full report:", error);
      res.status(500).json({
        message: "Server error fetching full report",
        error: error.message
      });
    }
};

// --- FIX #1: NEW ENDPOINT TO GET A SINGLE, FULLY-DETAILED INSPECTION REPORT ---
export const getDetailedReport = async (req, res) => {
  try {
      const { reportId } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(reportId)) {
        return res.status(400).json({ message: "Invalid Report ID format." });
      }
  
      // 1. Fetch the main inspection report
      const report = await QCAccuracyReportModel.findById(reportId).lean();
      if (!report) {
        return res.status(404).json({ message: "Inspection report not found." });
      }
  
      // 2. Fetch related data using Promise.all for efficiency
      const [qaUser, qcUser, orderDetails] = await Promise.all([
        UserMain.findOne({ emp_id: report.qcInspector.empId }) //UserProd
          .select("face_photo eng_name")
          .lean(),
        UserMain.findOne({ emp_id: report.scannedQc.empId })
          .select("face_photo eng_name")
          .lean(),
        ymProdConnection.db
          .collection("dt_orders")
          .findOne({ Order_No: report.moNo })
      ]);
  
      // 3. Structure the final response object
      const responseData = {
        report, // The main report data
        qaInspectorDetails: qaUser || {
          face_photo: null,
          eng_name: report.qcInspector.engName
        },
        scannedQcDetails: qcUser || {
          face_photo: null,
          eng_name: report.scannedQc.engName
        },
        orderDetails: orderDetails
          ? {
              totalQty: orderDetails.TotalQty,
              custStyle: orderDetails.CustStyle,
              country: orderDetails.Country,
              mode: orderDetails.Mode,
              salesTeamName: orderDetails.SalesTeamName,
              orderColors: orderDetails.OrderColors
            }
          : null // Handle case where order is not found
      };
  
      res.json(responseData);
    } catch (error) {
      console.error("Error fetching detailed inspection report:", error);
      res.status(500).json({
        message: "Server error fetching report details.",
        error: error.message
      });
    }
};

