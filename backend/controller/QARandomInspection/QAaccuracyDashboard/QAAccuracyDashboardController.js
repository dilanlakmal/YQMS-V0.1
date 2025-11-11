import { 
  QCAccuracyReportModel,
 } from "../../MongoDB/dbConnectionController.js";


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