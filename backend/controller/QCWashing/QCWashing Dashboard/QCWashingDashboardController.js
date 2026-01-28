import { QCWashing } from '../../../controller/MongoDB/dbConnectionController.js';

export const getWashingDashboardData = async (req, res) => {
  try {
    const { startDate, endDate, buyer, orderNo, color, reportType, washType, granularity } = req.query;

    let query = { status: "submitted" };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (buyer) query.buyer = buyer;
    if (orderNo) query.orderNo = orderNo;
    if (color) query.color = color;
    if (reportType) query.reportType = reportType;
    if (washType) query.washType = washType;

    // 1. ADVANCED SUMMARY: Unique Order Tracking
    const summaryAgg = await QCWashing.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalWashQty: { $sum: "$washQty" },
          numberOfWashings: { $sum: 1 },
          avgPassRate: { $avg: "$passRate" },
          totalDefects: { $sum: "$totalDefectCount" },
          // Group by OrderNo and Color to get the actual planned qty for that specific color-order combo
          uniqueSKUs: { $addToSet: { order: "$orderNo", color: "$color", qty: "$orderQty" } }
        }
      }
    ]);

    const summary = summaryAgg[0] || { totalWashQty: 0, numberOfWashings: 0, avgPassRate: 0, uniqueSKUs: [], totalDefects: 0 };
    const totalPlannedQty = summary.uniqueSKUs.reduce((sum, item) => sum + (item.qty || 0), 0);

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

    // 4. DYNAMIC TREND (Daily/Weekly/Monthly)
    let format = "%Y-%m-%d";
    if (granularity === 'weekly') format = "%Y-W%U";
    else if (granularity === 'monthly') format = "%Y-%m";

    const trendData = await QCWashing.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format, date: "$date" } },
          washQty: { $sum: "$washQty" },
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
          washTypes: { $addToSet: "$washType" }
        }
      }
    ]);

    // 1. Pass Rate by Order No (Showing bottom 5 to highlight trouble spots)
      const passRateByOrder = await QCWashing.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$orderNo",
            avgPassRate: { $avg: "$passRate" },
            totalBatches: { $sum: 1 }
          }
        },
        { $sort: { avgPassRate: 1 } }, // Ascending: show lowest quality first
        { $limit: 5 }
      ]);

      // 2. Pass Rate by Report Type
      const passRateByReportType = await QCWashing.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$reportType",
            avgPassRate: { $avg: "$passRate" }
          }
        },
        { $sort: { avgPassRate: -1 } }
      ]);

      // 3. Pass Rate by Date (Recent 5 days)
      const passRateByDate = await QCWashing.aggregate([
        { $match: query },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            avgPassRate: { $avg: "$passRate" }
          }
        },
        { $sort: { "_id": -1 } },
        { $limit: 5 }
      ]);

      // 4. Measurement Analysis by Style & Color
      const styleColorMeasurement = await QCWashing.aggregate([
        { $match: query },
        { $unwind: "$measurementDetails.measurementSizeSummary" },
        {
          $group: {
            _id: { orderNo: "$orderNo", color: "$color" },
            passPoints: { $sum: "$measurementDetails.measurementSizeSummary.totalPass" },
            totalPoints: { $sum: "$measurementDetails.measurementSizeSummary.checkedPoints" },
            reportCount: { $addToSet: "$_id" }
          }
        },
        {
          $project: {
            style: "$_id.orderNo",
            color: "$_id.color",
            totalPoints: 1,
            accuracy: {
              $cond: [{ $eq: ["$totalPoints", 0] }, 0, { $multiply: [{ $divide: ["$passPoints", "$totalPoints"] }, 100] }]
            },
            reports: { $size: "$reportCount" }
          }
        },
        { $sort: { accuracy: 1 } }, // Show worst performers first
        { $limit: 10 }
      ]);

      // 5. Defect Analysis by Style & Color
      const styleColorDefects = await QCWashing.aggregate([
        { $match: query },
        {
          $group: {
            _id: { orderNo: "$orderNo", color: "$color" },
            defectQty: { $sum: "$totalDefectCount" },
            washQty: { $sum: "$washQty" },
            reportCount: { $sum: 1 }
          }
        },
        {
          $project: {
            style: "$_id.orderNo",
            color: "$_id.color",
            defectQty: 1,
            washQty: 1,
            reports: "$reportCount",
            defectRate: {
              $cond: [{ $eq: ["$washQty", 0] }, 0, { $multiply: [{ $divide: ["$defectQty", "$washQty"] }, 100] }]
            }
          }
        },
        { $sort: { defectRate: -1 } }, 
        { $limit: 10 }
      ]);

    res.status(200).json({
      success: true,
      summary: {
        totalPlannedQty,
        totalWashQty: summary.totalWashQty,
        remainingQty: Math.max(0, totalPlannedQty - summary.totalWashQty),
        numberOfWashings: summary.numberOfWashings,
        avgPassRate: summary.avgPassRate,
        totalDefects: summary.totalDefects
      },
      defectSummary,
      measurementSummary,
      trendData,
      filterOptions: filterOptions[0] || {},
      passRateByOrder, 
      passRateByReportType, 
      passRateByDate,
      styleColorMeasurement, 
      styleColorDefects
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};