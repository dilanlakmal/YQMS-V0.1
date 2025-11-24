import {
  QASectionsMeasurementSpecs,
  DtOrder
} from "../../MongoDB/dbConnectionController.js";
import mongoose from "mongoose";

// Get Specs (Check existing -> Fallback to dt_orders)
export const getQASectionsMeasurementSpecs = async (req, res) => {
  const { moNo } = req.params;
  const cleanMoNo = moNo.trim(); // Remove leading/trailing spaces

  try {
    // 1. Check if data already exists in the new QASections collection
    // We use a case-insensitive regex to find the Order_No
    const existingRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") }
    });

    if (existingRecord) {
      return res.status(200).json({
        source: "qa_sections",
        data: existingRecord
      });
    }

    // 2. If not found, fetch raw data from dt_orders
    // Since 'BeforeWashSpecs' is not in your DtOrderSchema, Mongoose removes it by default.
    // .lean() returns a plain JavaScript object, bypassing the schema strictness.
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
          "No 'Before Wash Specs' found for this order. Please upload the Washing Spec Excel file first."
      });
    }

    // 3. Process Data for Frontend
    // Add unique IDs to the raw data for frontend UI keys/tracking
    const processedSpecs = dtOrderData.BeforeWashSpecs.map((spec) => ({
      ...spec,
      id: new mongoose.Types.ObjectId().toString()
    }));

    return res.status(200).json({
      source: "dt_orders",
      data: {
        Order_No: dtOrderData.Order_No, // Use the correct casing from DB
        AllBeforeWashSpecs: processedSpecs,
        selectedBeforeWashSpecs: [],
        isSaveAllBeforeWashSpecs: "No"
      }
    });
  } catch (error) {
    console.error("Error fetching measurement specs:", error);
    res.status(500).json({ error: error.message });
  }
};

// Save Specs Selection
export const saveQASectionsMeasurementSpecs = async (req, res) => {
  const { moNo, allSpecs, selectedSpecs, isSaveAll } = req.body;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  try {
    const updateData = {
      Order_No: moNo,
      AllBeforeWashSpecs: allSpecs, // Save the full source list
      selectedBeforeWashSpecs: selectedSpecs, // Save user selection
      isSaveAllBeforeWashSpecs: isSaveAll ? "Yes" : "No"
    };

    // Use upsert: true to create if it doesn't exist, or update if it does
    const result = await QASectionsMeasurementSpecs.findOneAndUpdate(
      { Order_No: moNo },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: "Measurement specs selection saved successfully.",
      data: result
    });
  } catch (error) {
    console.error("Error saving measurement specs:", error);
    res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------------------------------------
// AFTER WASH FUNCTIONS
// -------------------------------------------------------------------------

export const getQASectionsMeasurementSpecsAW = async (req, res) => {
  const { moNo } = req.params;
  const cleanMoNo = moNo.trim();

  try {
    // 1. Check if data already exists in the QASections collection
    const existingRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") }
    });

    // If record exists AND has AfterWash data populated
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

    // 2. If not found, fetch raw SizeSpec from dt_orders
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
          "No 'Size Spec' data found for this order in the master order table."
      });
    }

    // 3. Transform Data (SizeSpec -> Target Schema)
    const processedSpecs = dtOrderData.SizeSpec.map((item, index) => {
      // Transform the Specs array (Dynamic Keys -> Fixed Structure)
      const transformedSpecsValues = [];

      if (item.Specs && Array.isArray(item.Specs)) {
        item.Specs.forEach((sizeObj, sIdx) => {
          // sizeObj looks like { "S": "28" } OR { "S": { "raw": "28", "decimal": 28 } }
          const sizeKey = Object.keys(sizeObj)[0];

          if (sizeKey) {
            const rawValue = sizeObj[sizeKey];

            let fractionStr = "";
            let decimalVal = 0;

            // 🔍 FIX: Check if the value is an object or a primitive
            if (rawValue && typeof rawValue === "object") {
              // If it's an object, look for common property names used in your system
              fractionStr =
                rawValue.raw || rawValue.fraction || rawValue.value || "";
              decimalVal = rawValue.decimal || 0;
            } else {
              // If it's a string or number, use it directly
              fractionStr = String(rawValue || "");
              // Simple check: if the string is just a number, parse it, otherwise 0
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
        kValue: "NA", // Hardcoded as SizeSpec usually doesn't have K values
        MeasurementPointEngName: item.EnglishRemark || item.Area || "Unknown",
        MeasurementPointChiName: item.ChineseName || "",
        // Handle Tolerance Objects
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
      AllAfterWashSpecs: allSpecs,
      selectedAfterWashSpecs: selectedSpecs
    };

    const result = await QASectionsMeasurementSpecs.findOneAndUpdate(
      { Order_No: moNo },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: "After Wash specs selection saved successfully.",
      data: result
    });
  } catch (error) {
    console.error("Error saving AW measurement specs:", error);
    res.status(500).json({ error: error.message });
  }
};
