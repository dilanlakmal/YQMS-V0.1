import {
  QASectionsMeasurementSpecs,
  DtOrder,
} from "../../MongoDB/dbConnectionController.js";
import mongoose from "mongoose";

// =========================================================================
// HELPER: SANITIZER & DECIMAL CALCULATOR
// =========================================================================

/**
 * Cleans a measurement string and calculates its decimal value.
 * Handles: "-1 / 4", "1/ 2", "- 0.5", etc.
 */

const sanitizeSpecValue = (inputValue) => {
  // 1. Extract the string
  let str = "";
  if (inputValue && typeof inputValue === "object") {
    str = inputValue.fraction || inputValue.raw || inputValue.value || "";
  } else {
    str = String(inputValue || "");
  }

  // 2. NORMALIZE SLASHES (Crucial Fix)
  // Replace Unicode fraction slash (U+2044) and others with standard '/'
  // This ensures "-1⁄4" becomes "-1/4"
  str = str.replace(/\u2044/g, "/").replace(/\\/g, "/");

  // 3. Remove all spaces (fixes "- 1 / 4" -> "-1/4")
  const cleanStr = str.replace(/\s+/g, "");

  // 4. Calculate Decimal
  let decimal = 0;

  if (!cleanStr) {
    return { fraction: "", decimal: 0 };
  }

  try {
    // Check if it's a fraction using the standard slash
    if (cleanStr.includes("/")) {
      const parts = cleanStr.split("/");
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);

        // Ensure both parts are valid numbers and denominator is not 0
        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          decimal = numerator / denominator;
        }
      }
    } else {
      // It's a standard number or decimal string
      decimal = parseFloat(cleanStr);
    }
  } catch (err) {
    console.warn(`Failed to parse decimal for value: ${str}`);
    decimal = 0;
  }

  // 5. Handle NaN (Not a Number)
  if (isNaN(decimal)) decimal = 0;

  // 6. Return clean object
  return {
    fraction: cleanStr, // Saved as "-1/4"
    decimal: decimal, // Saved as -0.25
  };
};

export const getQASectionsMeasurementSpecs = async (req, res) => {
  const { moNo } = req.params;
  const cleanMoNo = moNo.trim();

  try {
    const existingRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") },
    });

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
            existingRecord.isSaveAllBeforeWashSpecs || "No",
        },
      });
    }

    const dtOrderData = await DtOrder.findOne(
      { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
      { BeforeWashSpecs: 1, Order_No: 1, _id: 0 },
    ).lean();

    if (!dtOrderData) {
      return res.status(404).json({
        message: `Order No '${cleanMoNo}' not found in the database.`,
      });
    }

    if (
      !dtOrderData.BeforeWashSpecs ||
      dtOrderData.BeforeWashSpecs.length === 0
    ) {
      return res.status(404).json({
        message: "No 'Before Wash Specs' found in Master Data.",
      });
    }

    // Process Data (Add IDs)
    const processedSpecs = dtOrderData.BeforeWashSpecs.map((spec) => ({
      ...spec,
      id: new mongoose.Types.ObjectId().toString(),
      // Optional: Sanitize on Read if DT_Order data is messy
      TolMinus: sanitizeSpecValue(spec.TolMinus),
      TolPlus: sanitizeSpecValue(spec.TolPlus),
    }));

    return res.status(200).json({
      source: "dt_orders",
      data: {
        Order_No: dtOrderData.Order_No,
        AllBeforeWashSpecs: processedSpecs,
        selectedBeforeWashSpecs: [],
        isSaveAllBeforeWashSpecs: "No",
      },
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
    // 🟢 SANITIZATION FIX HERE
    // We map over the incoming specs and clean the Tolerance values
    const cleanedAllSpecs = allSpecs.map((spec) => ({
      ...spec,
      TolMinus: sanitizeSpecValue(spec.TolMinus),
      TolPlus: sanitizeSpecValue(spec.TolPlus),
    }));

    // We also need to clean the selectedSpecs to match
    const cleanedSelectedSpecs = selectedSpecs.map((spec) => ({
      ...spec,
      TolMinus: sanitizeSpecValue(spec.TolMinus),
      TolPlus: sanitizeSpecValue(spec.TolPlus),
    }));

    const updateData = {
      Order_No: moNo,
      AllBeforeWashSpecs: cleanedAllSpecs,
      selectedBeforeWashSpecs: cleanedSelectedSpecs,
      isSaveAllBeforeWashSpecs: isSaveAll ? "Yes" : "No",
    };

    const result = await QASectionsMeasurementSpecs.findOneAndUpdate(
      { Order_No: moNo },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true },
    );

    res.status(200).json({
      message: "Before Wash specs saved successfully.",
      data: result,
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
    const existingRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") },
    });

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
          selectedAfterWashSpecs: existingRecord.selectedAfterWashSpecs || [],
        },
      });
    }

    const dtOrderData = await DtOrder.findOne(
      { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
      { SizeSpec: 1, Order_No: 1, _id: 0 },
    ).lean();

    if (!dtOrderData) {
      return res.status(404).json({
        message: `Order No '${cleanMoNo}' not found.`,
      });
    }

    if (!dtOrderData.SizeSpec || dtOrderData.SizeSpec.length === 0) {
      return res.status(404).json({
        message: "No 'Size Spec' data found in Master Data.",
      });
    }

    // Transform Data & 🟢 APPLY SANITIZER
    const processedSpecs = dtOrderData.SizeSpec.map((item, index) => {
      const transformedSpecsValues = [];

      if (item.Specs && Array.isArray(item.Specs)) {
        item.Specs.forEach((sizeObj, sIdx) => {
          const sizeKey = Object.keys(sizeObj)[0];
          if (sizeKey) {
            // Sanitize the size measurement values too
            const rawVal = sizeObj[sizeKey];
            const cleanVal = sanitizeSpecValue(rawVal);

            transformedSpecsValues.push({
              index: sIdx + 1,
              size: sizeKey,
              fraction: cleanVal.fraction,
              decimal: cleanVal.decimal,
            });
          }
        });
      }

      // Sanitize Tolerances
      const cleanTolMinus = sanitizeSpecValue(item.ToleranceMinus);
      const cleanTolPlus = sanitizeSpecValue(item.TolerancePlus);

      return {
        id: new mongoose.Types.ObjectId().toString(),
        no: index + 1,
        kValue: "NA",
        MeasurementPointEngName: item.EnglishRemark || item.Area || "Unknown",
        MeasurementPointChiName: item.ChineseName || "",
        TolMinus: cleanTolMinus,
        TolPlus: cleanTolPlus,
        Specs: transformedSpecsValues,
      };
    });

    return res.status(200).json({
      source: "dt_orders",
      data: {
        Order_No: dtOrderData.Order_No,
        AllAfterWashSpecs: processedSpecs,
        selectedAfterWashSpecs: [],
      },
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
    // 🟢 SANITIZE BEFORE SAVING (Just like Before Wash)
    const cleanedAllSpecs = allSpecs.map((spec) => {
      // Clean Specs Array (S, M, L values)
      const cleanSpecsValues = spec.Specs.map((s) => ({
        ...s,
        ...sanitizeSpecValue({ fraction: s.fraction }), // Recalculate based on fraction string
      }));

      return {
        ...spec,
        TolMinus: sanitizeSpecValue(spec.TolMinus),
        TolPlus: sanitizeSpecValue(spec.TolPlus),
        Specs: cleanSpecsValues,
      };
    });

    const cleanedSelectedSpecs = selectedSpecs.map((spec) => {
      const cleanSpecsValues = spec.Specs.map((s) => ({
        ...s,
        ...sanitizeSpecValue({ fraction: s.fraction }),
      }));
      return {
        ...spec,
        TolMinus: sanitizeSpecValue(spec.TolMinus),
        TolPlus: sanitizeSpecValue(spec.TolPlus),
        Specs: cleanSpecsValues,
      };
    });

    const updateData = {
      Order_No: moNo,
      AllAfterWashSpecs: cleanedAllSpecs,
      selectedAfterWashSpecs: cleanedSelectedSpecs,
    };

    const result = await QASectionsMeasurementSpecs.findOneAndUpdate(
      { Order_No: moNo },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true },
    );

    res.status(200).json({
      message: "After Wash specs saved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error saving AW measurement specs:", error);
    res.status(500).json({ error: error.message });
  }
};
