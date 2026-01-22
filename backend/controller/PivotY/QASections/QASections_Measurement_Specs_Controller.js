import {
  QASectionsMeasurementSpecs,
  DtOrder
} from "../../MongoDB/dbConnectionController.js";
import mongoose from "mongoose";

// =========================================================================
// BEFORE WASH FUNCTIONS
// =========================================================================

export const getQASectionsMeasurementSpecs = async (req, res) => {
  const { moNo } = req.params;
  const cleanMoNo = moNo.trim();

  try {
    // 1. Check if data already exists in the QASections collection
    const existingRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") }
    });

    // CRITICAL CHANGE:
    // Even if existingRecord is found, we ONLY return it if AllBeforeWashSpecs has data.
    // If AllBeforeWashSpecs is empty (but AllAfterWashSpecs might have data),
    // we simply skip this block and fall back to DtOrder.
    if (
      existingRecord &&
      existingRecord.AllBeforeWashSpecs &&
      existingRecord.AllBeforeWashSpecs.length > 0
    ) {
      return res.status(200).json({
        source: "qa_sections",
        data: {
          Order_No: existingRecord.Order_No,
          AllBeforeWashSpecs: existingRecord.AllBeforeWashSpecs,
          selectedBeforeWashSpecs: existingRecord.selectedBeforeWashSpecs || [],
          isSaveAllBeforeWashSpecs:
            existingRecord.isSaveAllBeforeWashSpecs || "No"
        }
      });
    }

    // 2. FALLBACK: Fetch raw data from dt_orders
    const dtOrderData = await DtOrder.findOne(
      { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
      { BeforeWashSpecs: 1, Order_No: 1, _id: 0 }
    ).lean();

    if (!dtOrderData) {
      return res.status(404).json({
        message: `Order No '${cleanMoNo}' not found in the database.`
      });
    }

    if (
      !dtOrderData.BeforeWashSpecs ||
      dtOrderData.BeforeWashSpecs.length === 0
    ) {
      return res.status(404).json({
        message:
          "No 'Before Wash Specs' found in Master Data (dt_orders). Please upload the Washing Spec Excel file."
      });
    }

    // 3. Process Data for Frontend (Add IDs)
    const processedSpecs = dtOrderData.BeforeWashSpecs.map((spec) => ({
      ...spec,
      id: new mongoose.Types.ObjectId().toString()
    }));

    return res.status(200).json({
      source: "dt_orders",
      data: {
        Order_No: dtOrderData.Order_No,
        AllBeforeWashSpecs: processedSpecs,
        selectedBeforeWashSpecs: [],
        isSaveAllBeforeWashSpecs: "No"
      }
    });
  } catch (error) {
    console.error("Error fetching Before Wash specs:", error);
    res.status(500).json({ error: error.message });
  }
};

export const saveQASectionsMeasurementSpecs = async (req, res) => {
  const { moNo, allSpecs, selectedSpecs, isSaveAll } = req.body;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  try {
    const updateData = {
      Order_No: moNo,
      AllBeforeWashSpecs: allSpecs,
      selectedBeforeWashSpecs: selectedSpecs,
      isSaveAllBeforeWashSpecs: isSaveAll ? "Yes" : "No"
    };

    const result = await QASectionsMeasurementSpecs.findOneAndUpdate(
      { Order_No: moNo },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: "Before Wash specs saved successfully.",
      data: result
    });
  } catch (error) {
    console.error("Error saving Before Wash specs:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================================================================
// AFTER WASH FUNCTIONS
// =========================================================================

export const getQASectionsMeasurementSpecsAW = async (req, res) => {
  const { moNo } = req.params;
  const cleanMoNo = moNo.trim();

  try {
    // 1. Check if data already exists in the QASections collection
    const existingRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") }
    });

    // CRITICAL CHANGE:
    // Only return local data if AllAfterWashSpecs is populated.
    // If only BeforeWash existed in DB, this logic skips and fetches Fresh SizeSpec for AW.
    if (
      existingRecord &&
      existingRecord.AllAfterWashSpecs &&
      existingRecord.AllAfterWashSpecs.length > 0
    ) {
      return res.status(200).json({
        source: "qa_sections",
        data: {
          Order_No: existingRecord.Order_No,
          AllAfterWashSpecs: existingRecord.AllAfterWashSpecs,
          selectedAfterWashSpecs: existingRecord.selectedAfterWashSpecs || []
        }
      });
    }

    // 2. FALLBACK: Fetch raw SizeSpec from dt_orders
    const dtOrderData = await DtOrder.findOne(
      { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
      { SizeSpec: 1, Order_No: 1, _id: 0 }
    ).lean();

    if (!dtOrderData) {
      return res.status(404).json({
        message: `Order No '${cleanMoNo}' not found in the database.`
      });
    }

    if (!dtOrderData.SizeSpec || dtOrderData.SizeSpec.length === 0) {
      return res.status(404).json({
        message:
          "No 'Size Spec' data found for this order in Master Data (dt_orders)."
      });
    }

    // 3. Transform Data (SizeSpec -> QA Section Schema)
    const processedSpecs = dtOrderData.SizeSpec.map((item, index) => {
      const transformedSpecsValues = [];

      if (item.Specs && Array.isArray(item.Specs)) {
        item.Specs.forEach((sizeObj, sIdx) => {
          const sizeKey = Object.keys(sizeObj)[0];
          if (sizeKey) {
            const rawValue = sizeObj[sizeKey];
            let fractionStr = "";
            let decimalVal = 0;

            if (rawValue && typeof rawValue === "object") {
              fractionStr =
                rawValue.raw || rawValue.fraction || rawValue.value || "";
              decimalVal = rawValue.decimal || 0;
            } else {
              fractionStr = String(rawValue || "");
              decimalVal = !isNaN(parseFloat(fractionStr))
                ? parseFloat(fractionStr)
                : 0;
            }

            transformedSpecsValues.push({
              index: sIdx + 1,
              size: sizeKey,
              fraction: fractionStr,
              decimal: decimalVal
            });
          }
        });
      }

      return {
        id: new mongoose.Types.ObjectId().toString(),
        no: index + 1,
        kValue: "NA",
        MeasurementPointEngName: item.EnglishRemark || item.Area || "Unknown",
        MeasurementPointChiName: item.ChineseName || "",
        TolMinus: {
          fraction:
            item.ToleranceMinus?.fraction || String(item.ToleranceMinus || ""),
          decimal: item.ToleranceMinus?.decimal || 0
        },
        TolPlus: {
          fraction:
            item.TolerancePlus?.fraction || String(item.TolerancePlus || ""),
          decimal: item.TolerancePlus?.decimal || 0
        },
        Specs: transformedSpecsValues
      };
    });

    return res.status(200).json({
      source: "dt_orders",
      data: {
        Order_No: dtOrderData.Order_No,
        AllAfterWashSpecs: processedSpecs,
        selectedAfterWashSpecs: []
      }
    });
  } catch (error) {
    console.error("Error fetching AW measurement specs:", error);
    res.status(500).json({ error: error.message });
  }
};

export const saveQASectionsMeasurementSpecsAW = async (req, res) => {
  const { moNo, allSpecs, selectedSpecs } = req.body;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  try {
    const updateData = {
      Order_No: moNo, // Ensure MO is set for upsert
      AllAfterWashSpecs: allSpecs,
      selectedAfterWashSpecs: selectedSpecs
    };

    const result = await QASectionsMeasurementSpecs.findOneAndUpdate(
      { Order_No: moNo },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: "After Wash specs saved successfully.",
      data: result
    });
  } catch (error) {
    console.error("Error saving AW measurement specs:", error);
    res.status(500).json({ error: error.message });
  }
};
