import path from "path";
import { promises as fsPromises } from "fs";
import sharp from "sharp";
import {API_BASE_URL,  __backendDir } from "../../Config/appConfig.js";
import { sanitize } from "../../Helpers/helperFunctions.js";
import mongoose from "mongoose";
import { 
  QCAccuracyReportModel,
  ymProdConnection,
  UserMain,
 } from "../MongoDB/dbConnectionController.js";

export const saveQAAccuracyImage = async (req, res) => {
  try {
        const { imageType, moNo, qcId, date } = req.body;
        const imageFile = req.file;
  
        if (!imageFile) {
          return res
            .status(400)
            .json({ success: false, message: "No image file provided." });
        }
        if (!imageType || !moNo || !qcId || !date) {
          return res.status(400).json({
            success: false,
            message: "Missing required metadata for image."
          });
        }
  
        // Define the target path for QA Accuracy images
        const qaAccuracyUploadPath = path.join(
          __backendDir,
          "public",
          "storage",
          "qa_accuracy"
        );
        // Ensure the directory exists
        await fsPromises.mkdir(qaAccuracyUploadPath, { recursive: true });
  
        // Sanitize metadata for a unique and safe filename
        const sanitizedImageType = sanitize(imageType); // 'defect' or 'additional'
        const sanitizedMoNo = sanitize(moNo);
        const sanitizedQcId = sanitize(qcId);
        const sanitizedDate = sanitize(date.split("T")[0]); // Use YYYY-MM-DD part of date
  
        const imagePrefix = `${sanitizedImageType}_${sanitizedMoNo}_${sanitizedDate}_${sanitizedQcId}_`;
  
        const newFilename = `${imagePrefix}${Date.now()}.webp`;
        const finalDiskPath = path.join(qaAccuracyUploadPath, newFilename);
  
        // Process and save the image using sharp
        await sharp(imageFile.buffer)
          .resize({
            width: 1024,
            height: 1024,
            fit: "inside",
            withoutEnlargement: true
          })
          .webp({ quality: 80 })
          .toFile(finalDiskPath);
  
        const publicUrl = `${API_BASE_URL}/storage/qa_accuracy/${newFilename}`;
  
        res.json({ success: true, filePath: publicUrl });
      } catch (error) {
        console.error("Error in /api/qa-accuracy/upload-image:", error);
        res.status(500).json({
          success: false,
          message: "Server error during image processing."
        });
      }
};

// POST - Save a new QC Accuracy Inspection Report
export const saveQCAccuracyReport = async (req, res) => {
  try {
      // Basic validation
      const requiredFields = [
        "reportDate",
        "qcInspector",
        "scannedQc",
        "reportType",
        "moNo",
        "totalCheckedQty",
        "result"
      ];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res
            .status(400)
            .json({ message: `Missing required field: ${field}` });
        }
      }
  
      const newReport = new QCAccuracyReportModel(req.body);
      await newReport.save();
  
      res.status(201).json({
        message: "QC Accuracy report saved successfully!",
        report: newReport
      });
    } catch (error) {
      console.error("Error saving QC Accuracy report:", error);
      res
        .status(500)
        .json({ message: "Failed to save report", error: error.message });
    }
};

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

// --- DASHBOARD SUMMARY ENDPOINT ---
export const getDashboardSummary = async (req, res) => {
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
        grade
      } = req.query;
  
      const filters = [];
      if (startDate && endDate) {
        filters.push({
          reportDate: {
            $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
          }
        });
      }
      if (qaId) filters.push({ "qcInspector.empId": qaId });
      if (qcId) filters.push({ "scannedQc.empId": qcId });
      if (reportType) filters.push({ reportType: reportType });
      if (moNo) filters.push({ moNo: moNo });
      if (grade) filters.push({ grade: grade });
      if (reportType === "Inline Finishing" && tableNo) {
        filters.push({ tableNo: tableNo });
      } else if (lineNo) {
        filters.push({ lineNo: lineNo });
      }
  
      const matchStage = filters.length > 0 ? { $and: filters } : {};
  
      const aggregation = await QCAccuracyReportModel.aggregate([
        { $match: matchStage },
        { $unwind: { path: "$defects", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$_id",
            totalCheckedQty: { $first: "$totalCheckedQty" },
            totalDefectPoints: { $first: "$totalDefectPoints" },
            defects: { $push: "$defects" },
            rejectedPcsSet: { $addToSet: "$defects.pcsNo" }
          }
        },
        {
          $group: {
            _id: null,
            totalInspected: { $sum: "$totalCheckedQty" },
            totalDefectPoints: { $sum: "$totalDefectPoints" },
            totalRejectedPcs: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$rejectedPcsSet",
                    as: "item",
                    cond: { $ne: ["$$item", null] }
                  }
                }
              }
            },
            totalDefectsQty: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$defects",
                    as: "d",
                    cond: { $ifNull: ["$$d.defectCode", false] }
                  }
                }
              }
            }
          }
        }
      ]);
  
      if (aggregation.length === 0) {
        return res.json({
          inspectedQty: 0,
          rejectPcs: 0,
          defectsQty: 0,
          defectRate: 0,
          defectRatio: 0,
          accuracy: 100
        });
      }
  
      const stats = aggregation[0];
      const defectRate =
        stats.totalInspected > 0
          ? (stats.totalDefectsQty / stats.totalInspected) * 100
          : 0;
      const defectRatio =
        stats.totalInspected > 0
          ? (stats.totalRejectedPcs / stats.totalInspected) * 100
          : 0;
      const accuracy =
        stats.totalInspected > 0
          ? (1 - stats.totalDefectPoints / stats.totalInspected) * 100
          : 100;
  
      res.json({
        inspectedQty: stats.totalInspected,
        rejectPcs: stats.totalRejectedPcs,
        defectsQty: stats.totalDefectsQty,
        defectRate,
        defectRatio,
        accuracy
      });
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      res
        .status(500)
        .json({ message: "Server error fetching dashboard summary" });
    }
};

// --- NEW ENDPOINT FOR DYNAMIC BAR CHART DATA ---
export const getBarChartData = async (req, res) => {
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
        grade,
        groupBy
      } = req.query;
      const validGroupByFields = ["lineNo", "moNo", "scannedQc.empId", "tableNo"];
      if (!groupBy || !validGroupByFields.includes(groupBy)) {
        return res
          .status(400)
          .json({ message: "A valid 'groupBy' parameter is required." });
      }
  
      const filters = [];
      if (startDate && endDate) {
        filters.push({
          reportDate: {
            $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
          }
        });
      }
      if (qaId) filters.push({ "qcInspector.empId": qaId });
      if (qcId) filters.push({ "scannedQc.empId": qcId });
      if (reportType) filters.push({ reportType: reportType });
      if (moNo) filters.push({ moNo: moNo });
      if (grade) filters.push({ grade: grade });
      if (lineNo) filters.push({ lineNo: lineNo });
      if (tableNo) filters.push({ tableNo: tableNo });
  
      // This handles the case where the user might have both selected but then changes report type
      if (reportType === "Inline Finishing") {
        // if the report type is finishing, we must ignore any line filter
        // because line is not applicable.
        const lineFilterIndex = filters.findIndex((f) =>
          f.hasOwnProperty("lineNo")
        );
        if (lineFilterIndex > -1) filters.splice(lineFilterIndex, 1);
      } else if (reportType) {
        // if the report type is anything else, ignore table filter
        const tableFilterIndex = filters.findIndex((f) =>
          f.hasOwnProperty("tableNo")
        );
        if (tableFilterIndex > -1) filters.splice(tableFilterIndex, 1);
      }
  
      // if (groupBy !== "lineNo" && lineNo) filters.push({ lineNo: lineNo });
      // if (groupBy !== "tableNo" && tableNo) filters.push({ tableNo: tableNo });
  
      const matchStage = filters.length > 0 ? { $and: filters } : {};
  
      const results = await QCAccuracyReportModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: `$${groupBy}`,
            totalCheckedQty: { $sum: "$totalCheckedQty" },
            totalDefectPoints: { $sum: "$totalDefectPoints" }
          }
        },
        {
          $project: {
            _id: 0,
            name: "$_id",
            accuracy: {
              $cond: [
                { $eq: ["$totalCheckedQty", 0] },
                100,
                {
                  $multiply: [
                    {
                      $subtract: [
                        1,
                        { $divide: ["$totalDefectPoints", "$totalCheckedQty"] }
                      ]
                    },
                    100
                  ]
                }
              ]
            }
          }
        },
        { $sort: { accuracy: 1 } }
      ]);
  
      const filteredResults = results.filter((r) => r.name && r.name !== "NA");
      res.json(filteredResults);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      res.status(500).json({ message: "Server error fetching chart data" });
    }
};

// --- DAILY TREND ENDPOINT ---
export const getDailyTrend = async (req, res) => {
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
        grade
      } = req.query;
  
      const filters = [];
      if (startDate && endDate) {
        filters.push({
          reportDate: {
            $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
          }
        });
      }
      if (qaId) filters.push({ "qcInspector.empId": qaId });
      if (qcId) filters.push({ "scannedQc.empId": qcId });
      if (reportType) filters.push({ reportType: reportType });
      if (moNo) filters.push({ moNo: moNo });
      if (grade) filters.push({ grade: grade });
      if (reportType === "Inline Finishing" && tableNo) {
        filters.push({ tableNo: tableNo });
      } else if (lineNo) {
        filters.push({ lineNo: lineNo });
      }
  
      const matchStage = filters.length > 0 ? { $and: filters } : {};
  
      const results = await QCAccuracyReportModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$reportDate" } },
            totalCheckedQty: { $sum: "$totalCheckedQty" },
            totalDefectPoints: { $sum: "$totalDefectPoints" }
          }
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            accuracy: {
              $cond: [
                { $eq: ["$totalCheckedQty", 0] },
                100,
                {
                  $multiply: [
                    {
                      $subtract: [
                        1,
                        { $divide: ["$totalDefectPoints", "$totalCheckedQty"] }
                      ]
                    },
                    100
                  ]
                }
              ]
            }
          }
        },
        { $sort: { date: 1 } }
      ]);
  
      res.json(results);
    } catch (error) {
      console.error("Error fetching daily trend data:", error);
      res.status(500).json({ message: "Server error fetching daily trend data" });
    }
};

// --- FIX #1: ENHANCED DEFECT RATE ENDPOINT ---
export const getDefectRate = async (req, res) => {
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
      grade
    } = req.query;

    const filters = [];
    if (startDate && endDate) {
      filters.push({
        reportDate: {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      });
    }
    if (qaId) filters.push({ "qcInspector.empId": qaId });
    if (qcId) filters.push({ "scannedQc.empId": qcId });
    if (reportType) filters.push({ reportType: reportType });
    if (moNo) filters.push({ moNo: moNo });
    if (grade) filters.push({ grade: grade });
    if (reportType === "Inline Finishing" && tableNo) {
      filters.push({ tableNo: tableNo });
    } else if (lineNo) {
      filters.push({ lineNo: lineNo });
    }

    const matchStage = filters.length > 0 ? { $and: filters } : {};

    // This pipeline will now get the total checked qty for the entire filtered set
    const totalCheckedAggregation = await QCAccuracyReportModel.aggregate([
      { $match: matchStage },
      { $group: { _id: null, totalChecked: { $sum: "$totalCheckedQty" } } }
    ]);
    const totalCheckedQty =
      totalCheckedAggregation.length > 0
        ? totalCheckedAggregation[0].totalChecked
        : 0;

    // This pipeline gets the defects
    const defectAggregation = await QCAccuracyReportModel.aggregate([
      { $match: matchStage },
      { $unwind: "$defects" },
      { $replaceRoot: { newRoot: "$defects" } },
      {
        $group: {
          _id: { name: "$defectNameEng", status: "$standardStatus" },
          defectQty: { $sum: "$qty" }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id.name",
          status: "$_id.status",
          defectQty: "$defectQty",
          defectRate: {
            $cond: [
              { $eq: [totalCheckedQty, 0] },
              0,
              { $multiply: [{ $divide: ["$defectQty", totalCheckedQty] }, 100] }
            ]
          }
        }
      },
      { $sort: { defectRate: -1 } }
    ]);

    res.json(defectAggregation);
  } catch (error) {
    console.error("Error fetching defect rates:", error);
    res.status(500).json({ message: "Server error fetching defect rate data" });
  }
};

// --- FINAL CORRECTED ENDPOINT FOR WEEKLY SUMMARY ---
export const getWeeklySummary = async (req, res) => {
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
        grade,
        groupBy // This is the key for the trend table
      } = req.query;
  
      // Validate that groupBy is a valid field to prevent injection
      const allowedGroupByFields = [
        "reportType",
        "lineNo",
        "tableNo",
        "moNo",
        "scannedQc.empId"
      ];
      if (!groupBy || !allowedGroupByFields.includes(groupBy)) {
        return res.status(400).json({ message: "Invalid groupBy parameter." });
      }
  
      // Build the match stage for filtering
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
      if (grade) matchStage.grade = grade;
      if (reportType === "Inline Finishing" && tableNo) {
        matchStage.tableNo = tableNo;
      } else if (lineNo) {
        matchStage.lineNo = lineNo;
      }
  
      // --- Corrected Aggregation Pipeline ---
      const results = await QCAccuracyReportModel.aggregate([
        // Stage 1: Filter documents based on query parameters
        { $match: matchStage },
  
        // Stage 2: Group by BOTH week and the dynamic field. This is the main fix.
        {
          $group: {
            _id: {
              year: { $isoWeekYear: "$reportDate" },
              week: { $isoWeek: "$reportDate" },
              // Group by the dynamic field's value. Use $ifNull for robustness.
              groupName: { $ifNull: [`$${groupBy}`, "N/A"] }
            },
            totalCheckedQty: { $sum: "$totalCheckedQty" },
            totalDefectPoints: { $sum: "$totalDefectPoints" },
            // Collect all defects arrays to be processed in the next stages
            defects: { $push: "$defects" }
          }
        },
  
        // Stage 3 & 4: Unwind the collected defects arrays to count them
        // This is an effective way to handle nested arrays
        { $unwind: { path: "$defects", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$defects", preserveNullAndEmptyArrays: true } },
  
        // Stage 5: Re-group to calculate defect quantities and unique rejected pieces
        {
          $group: {
            // Group back using the compound _id from the first group stage
            _id: "$_id",
            totalCheckedQty: { $first: "$totalCheckedQty" },
            totalDefectPoints: { $first: "$totalDefectPoints" },
            totalDefectsQty: { $sum: { $ifNull: ["$defects.qty", 0] } },
            // Collect unique piece numbers that had defects
            rejectedPcsSet: { $addToSet: "$defects.pcsNo" }
          }
        },
  
        // Stage 6: Project the final shape for the frontend
        {
          $project: {
            _id: 0,
            // Deconstruct the _id object into the format the frontend expects
            weekId: {
              year: "$_id.year",
              week: "$_id.week"
            },
            groupName: "$_id.groupName",
            totalChecked: "$totalCheckedQty",
            totalDefectPoints: "$totalDefectPoints",
            totalDefects: "$totalDefectsQty",
            // Count the number of unique rejected pieces
            rejectedPcs: {
              $size: {
                $filter: {
                  // $filter to remove potential nulls from the set
                  input: "$rejectedPcsSet",
                  as: "item",
                  cond: { $ne: ["$$item", null] }
                }
              }
            }
          }
        }
      ]);
  
      res.json(results);
    } catch (error) {
      console.error("Error fetching weekly summary:", error);
      res.status(500).json({ message: "Server error fetching weekly summary" });
    }
};