import {
  BuyerSpecTemplateM2, // Uses M2 Specs
  ymProdConnection,
  ANFMeasurementReportPacking, // Uses Packing Report Collection
  SizeCompletionStatusPacking // Uses Packing Status Collection
} from "../MongoDB/dbConnectionController.js";

// Endpoint to get all MO Nos from the M2 buyer spec templates
export const getBuyerSpecMoNosM2 = async (req, res) => {
  try {
    const monos = await BuyerSpecTemplateM2.find({}, { moNo: 1, _id: 0 }).sort({
      moNo: 1
    });
    res.json(monos.map((m) => m.moNo));
  } catch (error) {
    console.error("Error fetching MO options for ANF Measurement M2:", error);
    res.status(500).json({ error: "Failed to fetch MO options" });
  }
};

// Endpoint to get details from BuyerSpecTemplateM2
export const getBuyerSpecDataM2 = async (req, res) => {
  try {
    const { moNo } = req.params;
    const template = await BuyerSpecTemplateM2.findOne({ moNo: moNo });

    if (!template) {
      return res
        .status(404)
        .json({ error: "Spec Template M2 not found for this MO No." });
    }

    const buyer = template.buyer;
    const sizes = template.specData.map((data) => data.size);
    res.json({ buyer, sizes });
  } catch (error) {
    console.error(`Error fetching template details M2 for MO ${moNo}:`, error);
    res.status(500).json({ error: "Failed to fetch template details" });
  }
};

// Note: getAnfOrderDetails is usually the same as M1 because Order details (dt_orders) are shared.
// You can import the existing one or duplicate it here if you prefer isolation.
export const getAnfOrderDetailsM2 = async (req, res) => {
  try {
    const { moNo } = req.params;
    const order = await ymProdConnection.db
      .collection("dt_orders")
      .findOne({ Order_No: moNo });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    const colorOptions = [
      ...new Set(order.OrderColors.map((c) => c.Color.trim()))
    ];
    const colorQtyBySize = {};
    order.OrderColors.forEach((colorObj) => {
      const color = colorObj.Color.trim();
      colorQtyBySize[color] = {};
      colorObj.OrderQty.forEach((sizeEntry) => {
        const sizeName = Object.keys(sizeEntry)[0].split(";")[0].trim();
        const quantity = sizeEntry[sizeName];
        if (quantity > 0) colorQtyBySize[color][sizeName] = quantity;
      });
    });

    res.json({
      custStyle: order.CustStyle || "N/A",
      mode: order.Mode || "N/A",
      country: order.Country || "N/A",
      origin: order.Origin || "N/A",
      totalOrderQty: order.TotalQty,
      colorOptions: colorOptions.map((c) => ({ value: c, label: c })),
      colorQtyBySize
    });
  } catch (error) {
    console.error(`Error fetching order details M2:`, error);
    res.status(500).json({ error: "Failed to fetch order details." });
  }
};

// Endpoint to get spec table from M2 Template
export const getAnfSpecTableM2 = async (req, res) => {
  try {
    const { moNo, size } = req.query;
    const template = await BuyerSpecTemplateM2.findOne({ moNo: moNo });
    if (!template)
      return res.status(404).json({ error: "Template M2 not found." });

    const sizeData = template.specData.find((sd) => sd.size === size);
    if (!sizeData)
      return res.status(404).json({ error: `No spec data found.` });

    const sortedSpecDetails = sizeData.specDetails.sort(
      (a, b) => a.orderNo - b.orderNo
    );
    res.json(sortedSpecDetails);
  } catch (error) {
    console.error("Error fetching spec table M2:", error);
    res.status(500).json({ error: "Failed to fetch spec table." });
  }
};

// Save Report to Packing Collection
export const saveBuyerSpecReportM2 = async (req, res) => {
  try {
    const {
      inspectionDate,
      qcID,
      moNo,
      buyer,
      color,
      orderDetails,
      measurementDetails
    } = req.body;

    if (!inspectionDate || !qcID || !moNo || !color || !measurementDetails) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const reportDate = new Date(`${inspectionDate}T00:00:00.000Z`);
    const filter = {
      inspectionDate: reportDate,
      qcID,
      moNo,
      color: { $all: color.sort(), $size: color.length }
    };

    let report = await ANFMeasurementReportPacking.findOne(filter);
    const newSizeData = measurementDetails[0];

    if (report) {
      const existingSizeIndex = report.measurementDetails.findIndex(
        (detail) => detail.size === newSizeData.size
      );
      if (existingSizeIndex > -1) {
        report.measurementDetails[existingSizeIndex] = newSizeData;
      } else {
        report.measurementDetails.push(newSizeData);
      }
    } else {
      report = new ANFMeasurementReportPacking({
        inspectionDate: reportDate,
        qcID,
        moNo,
        buyer,
        color: color.sort(),
        orderDetails,
        measurementDetails
      });
    }

    // Recalculate summary
    const newOverallSummary = {
      garmentDetailsCheckedQty: 0,
      garmentDetailsOKGarment: 0,
      garmentDetailsRejected: 0,
      measurementDetailsPoints: 0,
      measurementDetailsPass: 0,
      measurementDetailsTotalIssues: 0,
      measurementDetailsTolPositive: 0,
      measurementDetailsTolNegative: 0
    };

    report.measurementDetails.forEach((detail) => {
      const summary = detail.sizeSummary;
      if (summary) {
        for (const key in newOverallSummary) {
          newOverallSummary[key] += summary[key] || 0;
        }
      }
    });
    report.overallMeasurementSummary = newOverallSummary;

    const savedReport = await report.save();
    res.status(201).json({ message: "M2 Report saved.", data: savedReport });
  } catch (error) {
    console.error("Error saving M2 Report:", error);
    res.status(500).json({ error: "Failed to save report." });
  }
};

// Update Status in Packing Status Collection
export const updateReportStatusM2 = async (req, res) => {
  try {
    const { qcID, moNo, color, size, status, inspectionDate } = req.body;
    const sortedColors = [...color].sort();

    if (status === "Completed") {
      await SizeCompletionStatusPacking.findOneAndUpdate(
        { qcID, moNo, color: sortedColors, size },
        { status: "Completed" },
        { upsert: true, new: true, runValidators: true }
      );
    } else if (status === "In Progress") {
      await SizeCompletionStatusPacking.deleteOne({
        qcID,
        moNo,
        color: sortedColors,
        size
      });
    }

    const reportDate = new Date(`${inspectionDate}T00:00:00.000Z`);
    const reportFilter = {
      inspectionDate: reportDate,
      qcID,
      moNo,
      color: { $all: sortedColors, $size: sortedColors.length }
    };

    await ANFMeasurementReportPacking.updateOne(
      { ...reportFilter, "measurementDetails.size": size },
      { $set: { "measurementDetails.$.status": status } }
    );

    res.status(200).json({ message: `M2 Size status updated to '${status}'.` });
  } catch (error) {
    console.error("Error updating M2 status:", error);
    res.status(500).json({ error: "Failed to update status." });
  }
};

// Get Data from Packing Collection
export const getReportDataM2 = async (req, res) => {
  try {
    const { date, qcId, moNo, color, size } = req.query;
    const colorArray = (Array.isArray(color) ? color : color.split(",")).sort();

    const persistentStatusDoc = await SizeCompletionStatusPacking.findOne({
      qcID: qcId,
      moNo: moNo,
      color: colorArray,
      size: size
    });

    let dailyMeasurements = [];
    const reportDate = new Date(`${date}T00:00:00.000Z`);
    const reportFilter = {
      inspectionDate: reportDate,
      qcID: qcId,
      moNo: moNo,
      color: { $all: colorArray, $size: colorArray.length }
    };
    const report = await ANFMeasurementReportPacking.findOne(reportFilter);

    if (report) {
      const sizeData = report.measurementDetails.find(
        (detail) => detail.size === size
      );
      if (sizeData && sizeData.sizeMeasurementData) {
        dailyMeasurements = sizeData.sizeMeasurementData;
      }
    }

    const finalStatus = persistentStatusDoc ? "Completed" : "In Progress";
    res.json({ measurements: dailyMeasurements, status: finalStatus });
  } catch (error) {
    console.error("Error fetching M2 data:", error);
    res.status(500).json({ error: "Failed to fetch data." });
  }
};
