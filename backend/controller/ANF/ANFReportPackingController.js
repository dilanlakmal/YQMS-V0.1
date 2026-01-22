import {
  ymProdConnection,
  ANFMeasurementReportPacking
} from "../MongoDB/dbConnectionController.js";

/* ------------------------------
   ANF QC DAILY REPORT PACKING
------------------------------ */
export const getDailyReportsPacking = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required." });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    const reports = await ANFMeasurementReportPacking.find({
      inspectionDate: { $gte: start, $lte: end }
    }).sort({ inspectionDate: -1, qcID: 1 });

    res.json(reports);
  } catch (error) {
    console.error("Error fetching QC daily reports (Packing):", error);
    res
      .status(500)
      .json({ error: "Failed to fetch QC daily reports (Packing)" });
  }
};

export const getDynamicFilterOptionsPacking = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate)
      return res
        .status(400)
        .json({ error: "Start and end date are required." });

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    const reports = await ANFMeasurementReportPacking.find(
      { inspectionDate: { $gte: start, $lte: end } },
      { buyer: 1, moNo: 1, color: 1, qcID: 1, _id: 0 }
    ).lean();

    const buyers = new Set();
    const moNos = new Set();
    const colors = new Set();
    const qcIDs = new Set();
    const moToColorsMap = {};

    reports.forEach((report) => {
      buyers.add(report.buyer);
      moNos.add(report.moNo);
      qcIDs.add(report.qcID);

      if (!moToColorsMap[report.moNo]) moToColorsMap[report.moNo] = new Set();
      report.color.forEach((c) => {
        colors.add(c);
        moToColorsMap[report.moNo].add(c);
      });
    });

    for (const mo in moToColorsMap) {
      moToColorsMap[mo] = Array.from(moToColorsMap[mo]).sort();
    }

    res.json({
      buyerOptions: Array.from(buyers).sort(),
      moOptions: Array.from(moNos).sort(),
      colorOptions: Array.from(colors).sort(),
      qcOptions: Array.from(qcIDs).sort(),
      moToColorsMap: moToColorsMap
    });
  } catch (error) {
    console.error("Error fetching dynamic filter options (Packing):", error);
    res.status(500).json({ error: "Failed to fetch dynamic filter options" });
  }
};

export const getDailyFullReportPacking = async (req, res) => {
  try {
    const { pageId } = req.params;
    if (!pageId) return res.status(400).json({ error: "Page ID is required." });

    const parts = pageId.split("-");
    if (parts.length < 3)
      return res.status(400).json({ error: "Invalid Page ID format." });

    const inspectionDateStr = parts.slice(0, 3).join("-");
    const qcID = parts[3];
    const moNo = parts.slice(4).join("-");

    const report = await ANFMeasurementReportPacking.findOne({
      inspectionDate: {
        $gte: new Date(inspectionDateStr),
        $lt: new Date(
          new Date(inspectionDateStr).setDate(
            new Date(inspectionDateStr).getDate() + 1
          )
        )
      },
      qcID: qcID,
      moNo: moNo
    }).lean();

    if (!report) return res.status(404).json({ error: "Report not found." });

    res.json(report);
  } catch (error) {
    console.error("Error fetching full QC daily report (Packing):", error);
    res.status(500).json({ error: "Failed to fetch full report." });
  }
};

/* ------------------------------
  ANF STYLE VIEW REPORT PACKING
------------------------------ */
export const getanfStyleViewSummaryPacking = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate)
      return res
        .status(400)
        .json({ error: "Start and end date are required." });

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    const styleSummary = await ANFMeasurementReportPacking.aggregate([
      { $match: { inspectionDate: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: "$moNo",
          garmentDetailsCheckedQty: {
            $sum: "$overallMeasurementSummary.garmentDetailsCheckedQty"
          },
          garmentDetailsOKGarment: {
            $sum: "$overallMeasurementSummary.garmentDetailsOKGarment"
          },
          garmentDetailsRejected: {
            $sum: "$overallMeasurementSummary.garmentDetailsRejected"
          },
          measurementDetailsPoints: {
            $sum: "$overallMeasurementSummary.measurementDetailsPoints"
          },
          measurementDetailsPass: {
            $sum: "$overallMeasurementSummary.measurementDetailsPass"
          },
          measurementDetailsTotalIssues: {
            $sum: "$overallMeasurementSummary.measurementDetailsTotalIssues"
          },
          measurementDetailsTolPositive: {
            $sum: "$overallMeasurementSummary.measurementDetailsTolPositive"
          },
          measurementDetailsTolNegative: {
            $sum: "$overallMeasurementSummary.measurementDetailsTolNegative"
          },
          allColors: { $push: "$color" },
          buyer: { $first: "$buyer" },
          orderQty_style: { $first: "$orderDetails.orderQty_style" }
        }
      },
      {
        $project: {
          _id: 0,
          moNo: "$_id",
          buyer: 1,
          orderQty_style: 1,
          totalColors: {
            $size: {
              $reduce: {
                input: "$allColors",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] }
              }
            }
          },
          summary: {
            checkedQty: "$garmentDetailsCheckedQty",
            okGarment: "$garmentDetailsOKGarment",
            rejectedGarment: "$garmentDetailsRejected",
            totalPoints: "$measurementDetailsPoints",
            passPoints: "$measurementDetailsPass",
            issuePoints: "$measurementDetailsTotalIssues",
            tolPlus: "$measurementDetailsTolPositive",
            tolNeg: "$measurementDetailsTolNegative"
          }
        }
      },
      { $sort: { moNo: 1 } }
    ]);

    res.json(styleSummary);
  } catch (error) {
    console.error("Error fetching style view summary (Packing):", error);
    res.status(500).json({ error: "Failed to fetch style view summary" });
  }
};

export const getStyleViewFullReportPacking = async (req, res) => {
  try {
    const { moNo } = req.params;
    if (!moNo) return res.status(400).json({ error: "MO Number is required." });

    // Part 1: Fetch Order Details (Shared Source)
    const orderDetails = await ymProdConnection.db
      .collection("dt_orders")
      .findOne({ Order_No: moNo });

    if (!orderDetails)
      return res.status(404).json({ error: "Order Details not found." });

    // Part 2: Aggregate from Packing Collection
    const aggregatedData = await ANFMeasurementReportPacking.aggregate([
      { $match: { moNo: moNo } },
      { $unwind: "$color" },
      { $unwind: "$measurementDetails" },
      {
        $group: {
          _id: {
            qcID: "$qcID",
            color: "$color",
            size: "$measurementDetails.size"
          },
          garmentDetailsCheckedQty: {
            $sum: "$measurementDetails.sizeSummary.garmentDetailsCheckedQty"
          },
          garmentDetailsOKGarment: {
            $sum: "$measurementDetails.sizeSummary.garmentDetailsOKGarment"
          },
          garmentDetailsRejected: {
            $sum: "$measurementDetails.sizeSummary.garmentDetailsRejected"
          },
          measurementDetailsPoints: {
            $sum: "$measurementDetails.sizeSummary.measurementDetailsPoints"
          },
          measurementDetailsPass: {
            $sum: "$measurementDetails.sizeSummary.measurementDetailsPass"
          },
          measurementDetailsTotalIssues: {
            $sum: "$measurementDetails.sizeSummary.measurementDetailsTotalIssues"
          },
          measurementDetailsTolPositive: {
            $sum: "$measurementDetails.sizeSummary.measurementDetailsTolPositive"
          },
          measurementDetailsTolNegative: {
            $sum: "$measurementDetails.sizeSummary.measurementDetailsTolNegative"
          },
          buyerSpecData: { $first: "$measurementDetails.buyerSpecData" },
          sizeMeasurementData: {
            $push: "$measurementDetails.sizeMeasurementData"
          }
        }
      },
      {
        $group: {
          _id: null,
          inspectorData: {
            $push: {
              qcID: "$_id.qcID",
              summary: {
                garmentDetailsCheckedQty: "$garmentDetailsCheckedQty",
                garmentDetailsOKGarment: "$garmentDetailsOKGarment",
                garmentDetailsRejected: "$garmentDetailsRejected",
                measurementDetailsPoints: "$measurementDetailsPoints",
                measurementDetailsPass: "$measurementDetailsPass",
                measurementDetailsTotalIssues: "$measurementDetailsTotalIssues",
                measurementDetailsTolPositive: "$measurementDetailsTolPositive",
                measurementDetailsTolNegative: "$measurementDetailsTolNegative"
              }
            }
          },
          colorData: {
            $push: {
              color: "$_id.color",
              size: "$_id.size",
              summary: {
                garmentDetailsCheckedQty: "$garmentDetailsCheckedQty",
                garmentDetailsOKGarment: "$garmentDetailsOKGarment",
                garmentDetailsRejected: "$garmentDetailsRejected",
                measurementDetailsPoints: "$measurementDetailsPoints",
                measurementDetailsPass: "$measurementDetailsPass",
                measurementDetailsTotalIssues: "$measurementDetailsTotalIssues",
                measurementDetailsTolPositive: "$measurementDetailsTolPositive",
                measurementDetailsTolNegative: "$measurementDetailsTolNegative"
              },
              buyerSpecData: "$buyerSpecData",
              sizeMeasurementData: {
                $reduce: {
                  input: "$sizeMeasurementData",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] }
                }
              }
            }
          }
        }
      }
    ]);

    if (!aggregatedData || aggregatedData.length === 0)
      return res.status(404).json({ error: "No data found." });

    const result = aggregatedData[0];

    const qcSummaryMap = result.inspectorData.reduce((acc, item) => {
      if (!acc[item.qcID]) acc[item.qcID] = { qcID: item.qcID };
      Object.keys(item.summary).forEach((key) => {
        acc[item.qcID][key] = (acc[item.qcID][key] || 0) + item.summary[key];
      });
      return acc;
    }, {});

    const colorMap = result.colorData.reduce((acc, item) => {
      if (!acc[item.color]) {
        acc[item.color] = {
          color: item.color,
          summaryCards: {},
          summaryBySize: [],
          tallyBySize: []
        };
      }
      Object.keys(item.summary).forEach((key) => {
        acc[item.color].summaryCards[key] =
          (acc[item.color].summaryCards[key] || 0) + item.summary[key];
      });
      acc[item.color].summaryBySize.push({
        size: item.size,
        sizeSummary: item.summary
      });

      const tally = {};
      item.sizeMeasurementData.forEach((garment) => {
        garment.measurements.forEach((m) => {
          const orderNo = m.orderNo;
          const fraction = m.fractionValue;
          if (!tally[orderNo]) tally[orderNo] = {};
          tally[orderNo][fraction] = (tally[orderNo][fraction] || 0) + 1;
        });
      });
      acc[item.color].tallyBySize.push({
        size: item.size,
        buyerSpecData: item.buyerSpecData,
        measurementsTally: tally
      });
      return acc;
    }, {});

    const finalPayload = {
      orderDetails: {
        moNo: orderDetails.Order_No,
        buyer: orderDetails.Buyer,
        orderQty_style: orderDetails.TotalQty,
        custStyle: orderDetails.CustStyle,
        mode: orderDetails.Mode,
        country: orderDetails.Country,
        origin: orderDetails.Origin,
        orderColors: orderDetails.OrderColors
      },
      inspectorData: Object.values(qcSummaryMap),
      summaryByColor: Object.values(colorMap).map((c) => ({
        color: c.color,
        ...c.summaryCards
      })),
      detailsByColor: Object.values(colorMap)
    };

    res.json(finalPayload);
  } catch (error) {
    console.error("Error fetching style view full report (Packing):", error);
    res.status(500).json({ error: "Failed to fetch full report." });
  }
};
