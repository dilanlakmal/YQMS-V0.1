import { QCWashing } from '../../../controller/MongoDB/dbConnectionController.js';

export const getWashingDashboardData = async (req, res) => {
  try {
    const { startDate, endDate, buyer, orderNo, color, reportType, washType, factoryName, granularity } = req.query;

    let query = { 
  status: { 
    $in: ["submitted", "processing"] 
  } 
};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (buyer) query.buyer = buyer;
    if (orderNo) query.orderNo = orderNo;
    if (color) query.color = color;
    if (reportType) query.reportType = reportType;
    if (washType) query.washType = washType;
    if (factoryName) query.factoryName = factoryName; 

    // HELPER: Reusable stage to resolve the correct Wash Qty based on priority
    const resolveWashQtyStage = {
      $addFields: {
        resolvedWashQty: {
          $ifNull: [
            "$actualWashQty", 
            { $ifNull: ["$editedActualWashQty", "$washQty"] }
          ]
        }
      }
    };

    // 1. ADVANCED SUMMARY: Unique Order Tracking
    const summaryAgg = await QCWashing.aggregate([
      { $match: query },
      resolveWashQtyStage, // Use resolved qty
      {
        $group: {
          _id: { order: "$orderNo", color: "$color" },
          skuTotalWashed: { $sum: "$resolvedWashQty" },
          skuPlanned: { $first: "$orderQty" }, 
          skuBatches: { $sum: 1 },
          skuPassReports: { $sum: { $cond: [{ $eq: ["$overallFinalResult", "Pass"] }, 1, 0] } },
          skuFailReports: { $sum: { $cond: [{ $eq: ["$overallFinalResult", "Fail"] }, 1, 0] } },
          skuPassRateSum: { $sum: "$passRate" },
          skuDefectSum: { $sum: "$totalDefectCount" }
        }
      },
      {
        $group: {
          _id: null,
          totalPlannedQty: { $sum: "$skuPlanned" },
          totalWashQty: { $sum: "$skuTotalWashed" },
          numberOfWashings: { $sum: "$skuBatches" },
          totalPassReports: { $sum: "$skuPassReports" },
          totalFailReports: { $sum: "$skuFailReports" },
          totalDefects: { $sum: "$skuDefectSum" },
          avgPassRate: { $avg: { $divide: ["$skuPassRateSum", "$skuBatches"] } }
        }
      }
    ]);

    const summary = summaryAgg[0] || { 
      totalPlannedQty: 0, totalWashQty: 0, numberOfWashings: 0, 
      totalPassReports: 0, totalFailReports: 0, avgPassRate: 0, totalDefects: 0 
    };

    const remainingQty = Math.max(0, summary.totalPlannedQty - summary.totalWashQty);

    // 2. DETAILED DEFECT ANALYTICS
    const defectLimit = parseInt(req.query.defectLimit) || 5;
    const defectSummary = await QCWashing.aggregate([
      { $match: query },
      { $unwind: "$defectDetails.defectsByPc" },
      { $unwind: "$defectDetails.defectsByPc.pcDefects" },
      {
        $group: {
          _id: "$defectDetails.defectsByPc.pcDefects.defectName",
          totalDefectQty: { $sum: "$defectDetails.defectsByPc.pcDefects.defectQty" },
          affectedPieces: { $sum: 1 } 
        }
      },
      { $sort: { totalDefectQty: -1 } },
      { $limit: defectLimit }
    ]);

    // 3. MEASUREMENT PRECISION BY SIZE
    const measurementSummary = await QCWashing.aggregate([
      { $match: query },
      { $unwind: "$measurementDetails.measurementSizeSummary" },
      {
        $group: {
          _id: "$measurementDetails.measurementSizeSummary.size",
          totalPoints: { $sum: "$measurementDetails.measurementSizeSummary.checkedPoints" },
          passPoints: { $sum: "$measurementDetails.measurementSizeSummary.totalPass" },
          failPoints: { $sum: "$measurementDetails.measurementSizeSummary.totalFail" },
          pcsChecked: { $sum: "$measurementDetails.measurementSizeSummary.checkedPcs" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. DYNAMIC TREND (Fixed to use resolvedWashQty)
    let groupFormat = "%Y-%m-%d";
    if (granularity === 'weekly') groupFormat = "%Y-W%U";
    else if (granularity === 'monthly') groupFormat = "%Y-%m";

    const trendData = await QCWashing.aggregate([
      { $match: query },
      resolveWashQtyStage, // Use resolved qty here
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$date" } },
          washQty: { $sum: "$resolvedWashQty" }, // Updated
          inspections: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 5. CROSS-FILTER OPTIONS
    const filterOptions = await QCWashing.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          buyers: { $addToSet: "$buyer" },
          orders: { $addToSet: "$orderNo" },
          colors: { $addToSet: "$color" },
          reportTypes: { $addToSet: "$reportType" },
          washTypes: { $addToSet: "$washType" },
          factoryName: { $addToSet: "$factoryName" } 
        }
      }
    ]);

    // Pass Rates aggregations
    const passRateByOrder = await QCWashing.aggregate([
        { $match: query },
        { $group: { _id: "$orderNo", avgPassRate: { $avg: "$passRate" }, totalBatches: { $sum: 1 } } },
        { $sort: { avgPassRate: 1 } }, { $limit: 5 }
    ]);

    const passRateByReportType = await QCWashing.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$reportType",
          avgPassRate: { $avg: "$passRate" },
          totalReports: { $sum: 1 }, // Total count of reports for this type
          passReports: { 
            $sum: { $cond: [{ $eq: ["$overallFinalResult", "Pass"] }, 1, 0] } 
          } // Count of reports where result is "Pass"
        }
      },
      { $sort: { avgPassRate: -1 } }
    ]);

    const passRateByDate = await QCWashing.aggregate([
        { $match: query },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, avgPassRate: { $avg: "$passRate" } } },
        { $sort: { "_id": -1 } }, { $limit: 5 }
    ]);

    // 8. Style & Color Measurement (Accuracy)
    const styleColorMeasurement = await QCWashing.aggregate([
        { $match: query },
        { $unwind: "$measurementDetails.measurementSizeSummary" },
        { $group: { _id: { orderNo: "$orderNo", color: "$color" }, passPoints: { $sum: "$measurementDetails.measurementSizeSummary.totalPass" }, totalPoints: { $sum: "$measurementDetails.measurementSizeSummary.checkedPoints" }, reportCount: { $addToSet: "$_id" }, orderQty: { $first: "$orderQty" }  } },
        { $project: { style: "$_id.orderNo", color: "$_id.color", totalPoints: 1, accuracy: { $cond: [{ $eq: ["$totalPoints", 0] }, 0, { $multiply: [{ $divide: ["$passPoints", "$totalPoints"] }, 100] }] }, reports: { $size: "$reportCount" }, orderQty: 1, } },
        { $sort: { accuracy: 1 } }, { $limit: 10 }
    ]);

    // 9. Style & Color Defects (Fixed to use resolvedWashQty)
      const styleColorDefects = await QCWashing.aggregate([
        { $match: query },
        resolveWashQtyStage, 
        {
          $group: {
            _id: { orderNo: "$orderNo", color: "$color" },
            totalDefects: { $sum: "$totalDefectCount" },
            totalPiecesChecked: { $sum: "$checkedQty" },
            reportCount: { $sum: 1 }
          }
        },
        {
          $project: {
            style: "$_id.orderNo",
            color: "$_id.color",
            defectQty: "$totalDefects",
            inspectedQty: "$totalPiecesChecked",
            reports: "$reportCount",
            // NEW CALCULATION: (totalDefects / totalPiecesChecked) * 100
            defectRate: {
              $cond: [
                { $eq: ["$totalPiecesChecked", 0] }, 
                0, 
                { $multiply: [{ $divide: ["$totalDefects", "$totalPiecesChecked"] }, 100] }
              ]
            }
          }
        },
        { $sort: { defectRate: -1 } }, 
        { $limit: 10 }
      ]);

    const skuSizeMeasurementSummary = await QCWashing.aggregate([
    { $match: query },
    { $unwind: "$measurementDetails.measurementSizeSummary" },
    {
      $group: {
        _id: {
          orderNo: "$orderNo",
          color: "$color",
          size: "$measurementDetails.measurementSizeSummary.size"
        },
        totalCheckedPcs: { $sum: "$measurementDetails.measurementSizeSummary.checkedPcs" },
        totalCheckedPoints: { $sum: "$measurementDetails.measurementSizeSummary.checkedPoints" },
        totalPass: { $sum: "$measurementDetails.measurementSizeSummary.totalPass" },
        totalFail: { $sum: "$measurementDetails.measurementSizeSummary.totalFail" },
        totalPlusFail: { $sum: { $ifNull: ["$measurementDetails.measurementSizeSummary.plusToleranceFailCount", 0] } },
        totalMinusFail: { $sum: { $ifNull: ["$measurementDetails.measurementSizeSummary.minusToleranceFailCount", 0] } }
      }
    },
    {
      $project: {
        orderNo: "$_id.orderNo",
        color: "$_id.color",
        size: "$_id.size",
        totalCheckedPcs: 1,
        totalCheckedPoints: 1,
        totalPass: 1,
        totalFail: 1,
        totalPlusFail: 1,
        totalMinusFail: 1,
        accuracy: {
          $cond: [
            { $eq: ["$totalCheckedPoints", 0] },
            0,
            { $multiply: [{ $divide: ["$totalPass", "$totalCheckedPoints"] }, 100] }
          ]
        }
      }
    },
    { $sort: { orderNo: 1, color: 1, size: 1 } }
]);

const factoryDefectSummary = await QCWashing.aggregate([
  { $match: query },
  // 1. Only look at reports that actually have defect records
  { 
    $match: { 
      "defectDetails.defectsByPc": { $exists: true, $not: { $size: 0 } } 
    } 
  },
  { $unwind: "$defectDetails.defectsByPc" },
  { $unwind: "$defectDetails.defectsByPc.pcDefects" },
  {
    $group: {
      _id: {
        factory: { $ifNull: ["$factoryName", "Unknown"] },
        defect: "$defectDetails.defectsByPc.pcDefects.defectName",
        // Group by report ID and pcNumber to identify a UNIQUE piece
        reportId: "$_id",
        pcNum: "$defectDetails.defectsByPc.pcNumber"
      },
      // Sum the quantities of this defect found on this specific piece
      qtyOnThisPiece: { $sum: "$defectDetails.defectsByPc.pcDefects.defectQty" }
    }
  },
  {
    $group: {
      _id: {
        factory: "$_id.factory",
        defect: "$_id.defect"
      },
      totalQty: { $sum: "$qtyOnThisPiece" },
      // Count how many unique piece entries were in the previous group
      totalPcs: { $sum: 1 } 
    }
  },
  { $sort: { totalQty: -1 } }
]);

const pointFailureSummary = await QCWashing.aggregate([
  { $match: query },
  { $unwind: "$measurementDetails.measurement" },
  { $unwind: "$measurementDetails.measurement.pcs" },
  { $unwind: "$measurementDetails.measurement.pcs.measurementPoints" },
  { 
    $match: { 
      "measurementDetails.measurement.pcs.measurementPoints.result": "fail" 
    } 
  },
  {
    $group: {
      _id: "$measurementDetails.measurement.pcs.measurementPoints.pointName",
      // Total Fails
      totalFail: { $sum: 1 },
      // Count Plus Fails: value > tolerancePlus
      plusFail: {
        $sum: {
          $cond: [
            { $gt: [
              "$measurementDetails.measurement.pcs.measurementPoints.measured_value_decimal",
              "$measurementDetails.measurement.pcs.measurementPoints.tolerancePlus"
            ]},
            1, 0
          ]
        }
      },
      // Count Minus Fails: value < toleranceMinus
      minusFail: {
        $sum: {
          $cond: [
            { $lt: [
              "$measurementDetails.measurement.pcs.measurementPoints.measured_value_decimal",
              "$measurementDetails.measurement.pcs.measurementPoints.toleranceMinus"
            ]},
            1, 0
          ]
        }
      },
      affectedSizes: { $addToSet: "$measurementDetails.measurement.size" }
    }
  },
  { $sort: { totalFail: -1 } }
]);


    const reports = await QCWashing.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      reports,
      summary: {
        totalPlannedQty: summary.totalPlannedQty,
        totalWashQty: summary.totalWashQty,
        remainingQty: remainingQty,
        numberOfWashings: summary.numberOfWashings,
        totalPassReports: summary.totalPassReports, 
        totalFailReports: summary.totalFailReports, 
        avgPassRate: summary.avgPassRate,
        totalDefects: summary.totalDefects
      },
      defectSummary,
      measurementSummary,
      skuSizeMeasurementSummary,
      factoryDefectSummary,
      pointFailureSummary,
      trendData,
      filterOptions: filterOptions[0] || {},
      passRateByOrder, 
      passRateByReportType, 
      passRateByDate,
      styleColorMeasurement, 
      styleColorDefects
    });
  } catch (error) {
    console.error("Dashboard Controller Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};