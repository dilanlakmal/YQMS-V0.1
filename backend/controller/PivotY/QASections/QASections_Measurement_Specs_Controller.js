import {
  QASectionsMeasurementSpecs,
  DtOrder,
} from "../../MongoDB/dbConnectionController.js";
import mongoose from "mongoose";

// =========================================================================
// HELPER: SANITIZERS & DECIMAL CALCULATORS
// =========================================================================

// /**
//  * Cleans a TOLERANCE measurement string and calculates its decimal value.
//  * Handles: "- 1/4" → "-1/4", "-0.5", etc.
//  * ⚠️ USE ONLY FOR TOLERANCE VALUES (TolMinus, TolPlus)
//  */
const sanitizeToleranceValue = (inputValue) => {
  // 1. Extract the string
  let str = "";
  if (inputValue && typeof inputValue === "object") {
    str = inputValue.fraction || inputValue.raw || inputValue.value || "";
  } else {
    str = String(inputValue || "");
  }

  // 2. NORMALIZE SLASHES - including Unicode fraction slash (⁄ U+2044)
  str = str.replace(/\u2044/g, "/").replace(/\\/g, "/");

  // 3. Remove ALL spaces (tolerances need this for negative parsing)
  const cleanStr = str.replace(/\s+/g, "");

  // 4. Calculate Decimal
  let decimal = 0;

  if (!cleanStr) {
    return { fraction: "", decimal: 0 };
  }

  try {
    if (cleanStr.includes("/")) {
      const parts = cleanStr.split("/");
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);

        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          decimal = numerator / denominator;
        }
      }
    } else {
      decimal = parseFloat(cleanStr);
    }
  } catch (err) {
    console.warn(`Failed to parse decimal for tolerance value: ${str}`);
    decimal = 0;
  }

  if (isNaN(decimal)) decimal = 0;

  return {
    fraction: cleanStr,
    decimal: decimal,
  };
};

// /**
//  * Cleans a SPEC measurement string and calculates its decimal value.
//  * Handles mixed fractions: "14 1/2", "1 3/4", simple fractions: "1/2", decimals: "14.5"
//  * ⚠️ PRESERVES SPACES in mixed fractions (e.g., "14 1/2")
//  * ⚠️ USE ONLY FOR SPEC VALUES (Specs array items)
//  */
const sanitizeSpecValue = (inputValue) => {
  // 1. Extract the string
  let str = "";
  if (inputValue && typeof inputValue === "object") {
    str = inputValue.fraction || inputValue.raw || inputValue.value || "";
  } else {
    str = String(inputValue || "");
  }

  // 2. NORMALIZE SLASHES
  str = str.replace(/\u2044/g, "/").replace(/\\/g, "/");

  // 3. Trim but PRESERVE internal spaces (for mixed fractions like "14 1/2")
  const cleanStr = str.trim();

  // 4. Calculate Decimal
  let decimal = 0;

  if (!cleanStr) {
    return { fraction: "", decimal: 0 };
  }

  try {
    // Check for mixed fraction (e.g., "14 1/2" or "-1 1/4")
    const mixedMatch = cleanStr.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
      const whole = parseFloat(mixedMatch[1]);
      const numerator = parseFloat(mixedMatch[2]);
      const denominator = parseFloat(mixedMatch[3]);

      if (
        !isNaN(whole) &&
        !isNaN(numerator) &&
        !isNaN(denominator) &&
        denominator !== 0
      ) {
        const fractionPart = numerator / denominator;
        decimal = whole >= 0 ? whole + fractionPart : whole - fractionPart;
      }
    }
    // Check for simple fraction (e.g., "1/2")
    else if (cleanStr.includes("/")) {
      const parts = cleanStr.split("/");
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);

        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          decimal = numerator / denominator;
        }
      }
    }
    // Standard number or decimal
    else {
      decimal = parseFloat(cleanStr);
    }
  } catch (err) {
    console.warn(`Failed to parse decimal for spec value: ${str}`);
    decimal = 0;
  }

  if (isNaN(decimal)) decimal = 0;

  return {
    fraction: cleanStr, // Preserves "14 1/2" with space
    decimal: decimal, // 14.5
  };
};

// /**
//  * FIX TOLERANCE HELPER - Fixes bad tolerance formats
//  * Handles:
//  * - "- 1/4" → "-1/4" (remove space after minus for simple fractions)
//  * - "-1⁄8" → "-1/8" (fix Unicode fraction slash)
//  * - Calculates decimal if null/undefined
//  *
//  * Does NOT touch mixed fractions like "-1 1/4" (correct format)
//  */
const fixToleranceFraction = (tolObj) => {
  if (!tolObj) {
    return { wasFixed: false, result: { fraction: "", decimal: 0 } };
  }

  let wasFixed = false;
  let fraction = "";

  // Extract fraction string
  if (typeof tolObj === "object") {
    fraction = tolObj.fraction || "";
  } else {
    fraction = String(tolObj || "");
  }

  let decimal = tolObj?.decimal;
  const originalFraction = fraction;
  const originalDecimal = decimal;

  // Step 1: Normalize Unicode fraction slash (⁄ U+2044 → /)
  fraction = fraction.replace(/\u2044/g, "/").replace(/\\/g, "/");

  // Step 2: Fix "- 1/4" → "-1/4" and "+ 1/4" → "+1/4"
  // Pattern: sign followed by space(s), then a SIMPLE fraction (NOT mixed)
  // BAD: "- 1/4", "+ 1/4", "- 3/8"
  // GOOD: "-1 1/4" (mixed fraction), "-1/4", "1/4"

  // Fix negative with bad spacing (simple fraction only)
  const negBadPattern = /^-\s+(\d+\/\d+)$/;
  const negBadMatch = fraction.match(negBadPattern);
  if (negBadMatch) {
    fraction = "-" + negBadMatch[1];
  }

  // Fix positive with bad spacing
  const posBadPattern = /^\+\s+(\d+\/\d+)$/;
  const posBadMatch = fraction.match(posBadPattern);
  if (posBadMatch) {
    fraction = "+" + posBadMatch[1];
  }

  // Also handle decimal values with bad spacing like "- 0.5" or "+ 0.25"
  const negDecPattern = /^-\s+([\d.]+)$/;
  const negDecMatch = fraction.match(negDecPattern);
  if (negDecMatch) {
    fraction = "-" + negDecMatch[1];
  }

  const posDecPattern = /^\+\s+([\d.]+)$/;
  const posDecMatch = fraction.match(posDecPattern);
  if (posDecMatch) {
    fraction = "+" + posDecMatch[1];
  }

  // Check if fraction was modified
  if (fraction !== originalFraction) {
    wasFixed = true;
  }

  // Step 3: Calculate decimal if null/undefined/NaN
  const needsDecimalCalc =
    decimal === null ||
    decimal === undefined ||
    (typeof decimal === "number" && isNaN(decimal));

  if (needsDecimalCalc && fraction) {
    // Remove all spaces for calculation
    const cleanStr = fraction.replace(/\s+/g, "");

    if (cleanStr.includes("/")) {
      const parts = cleanStr.split("/");
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          decimal = numerator / denominator;
          wasFixed = true;
        }
      }
    } else {
      const parsed = parseFloat(cleanStr);
      if (!isNaN(parsed)) {
        decimal = parsed;
        wasFixed = true;
      }
    }
  }

  // Ensure decimal is a number
  if (decimal === null || decimal === undefined || isNaN(decimal)) {
    if (originalDecimal !== 0) {
      wasFixed = true;
    }
    decimal = 0;
  }

  return {
    wasFixed,
    result: {
      fraction: fraction,
      decimal: decimal,
    },
  };
};

// =========================================================================
// BEFORE WASH FUNCTIONS
// =========================================================================

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

    // Process Data - Use sanitizeToleranceValue for tolerances only
    const processedSpecs = dtOrderData.BeforeWashSpecs.map((spec) => ({
      ...spec,
      id: new mongoose.Types.ObjectId().toString(),
      TolMinus: sanitizeToleranceValue(spec.TolMinus),
      TolPlus: sanitizeToleranceValue(spec.TolPlus),
      Shrinkage: spec.Shrinkage
        ? sanitizeSpecValue(spec.Shrinkage) // ✅ CHANGED FROM sanitizeToleranceValue
        : { fraction: "0", decimal: 0 },
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
    // Clean ONLY tolerance values, leave Specs array untouched
    const cleanedAllSpecs = allSpecs.map((spec) => ({
      ...spec,
      TolMinus: sanitizeToleranceValue(spec.TolMinus),
      TolPlus: sanitizeToleranceValue(spec.TolPlus),
      Shrinkage: sanitizeSpecValue(spec.Shrinkage), // ✅ CHANGED
    }));

    const cleanedSelectedSpecs = selectedSpecs.map((spec) => ({
      ...spec,
      TolMinus: sanitizeToleranceValue(spec.TolMinus),
      TolPlus: sanitizeToleranceValue(spec.TolPlus),
      Shrinkage: sanitizeSpecValue(spec.Shrinkage), // ✅ CHANGED
    }));

    // Use direct update with explicit $set for arrays
    const result = await QASectionsMeasurementSpecs.findOneAndUpdate(
      { Order_No: { $regex: new RegExp(`^${moNo.trim()}$`, "i") } },
      {
        $set: {
          Order_No: moNo.trim(),
          AllBeforeWashSpecs: cleanedAllSpecs,
          selectedBeforeWashSpecs: cleanedSelectedSpecs,
          isSaveAllBeforeWashSpecs: isSaveAll ? "Yes" : "No",
        },
        $currentDate: { updatedAt: true },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      message: "Before Wash specs saved successfully.",
      data: result,
      updatedAt: result.updatedAt,
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

    // Transform Data & Apply sanitizers appropriately
    const processedSpecs = dtOrderData.SizeSpec.map((item, index) => {
      const transformedSpecsValues = [];

      if (item.Specs && Array.isArray(item.Specs)) {
        item.Specs.forEach((sizeObj, sIdx) => {
          const sizeKey = Object.keys(sizeObj)[0];
          if (sizeKey) {
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

      const cleanTolMinus = sanitizeToleranceValue(item.ToleranceMinus);
      const cleanTolPlus = sanitizeToleranceValue(item.TolerancePlus);

      return {
        id: new mongoose.Types.ObjectId().toString(),
        no: index + 1,
        kValue: "NA",
        MeasurementPointEngName: item.EnglishRemark || item.Area || "Unknown",
        MeasurementPointChiName: item.ChineseName || "",
        TolMinus: cleanTolMinus,
        TolPlus: cleanTolPlus,
        Shrinkage: { fraction: "0", decimal: 0 },
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
    // Clean tolerance values with sanitizeToleranceValue
    // Clean Specs array values with sanitizeSpecValue
    const cleanedAllSpecs = allSpecs.map((spec) => {
      const cleanSpecsValues = spec.Specs.map((s) => ({
        ...s,
        ...sanitizeSpecValue({ fraction: s.fraction }),
      }));

      return {
        ...spec,
        TolMinus: sanitizeToleranceValue(spec.TolMinus),
        TolPlus: sanitizeToleranceValue(spec.TolPlus),
        Shrinkage: { fraction: "0", decimal: 0 },
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
        TolMinus: sanitizeToleranceValue(spec.TolMinus),
        TolPlus: sanitizeToleranceValue(spec.TolPlus),
        Shrinkage: { fraction: "0", decimal: 0 },
        Specs: cleanSpecsValues,
      };
    });

    // Use direct update with explicit $set for arrays
    const result = await QASectionsMeasurementSpecs.findOneAndUpdate(
      { Order_No: { $regex: new RegExp(`^${moNo.trim()}$`, "i") } },
      {
        $set: {
          Order_No: moNo.trim(),
          AllAfterWashSpecs: cleanedAllSpecs,
          selectedAfterWashSpecs: cleanedSelectedSpecs,
        },
        $currentDate: { updatedAt: true },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      message: "After Wash specs saved successfully.",
      data: result,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    console.error("Error saving AW measurement specs:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================================================================
// FIX TOLERANCE VALUES - BULK UPDATE
// =========================================================================

/**
 * Fixes all tolerance values across all documents in the collection
 * - Fixes "- 1/4" → "-1/4" (bad spacing)
 * - Fixes Unicode fraction slash "⁄" → "/"
 * - Calculates decimal if null/undefined
 * - Does NOT touch Specs arrays
 */
export const fixAllToleranceValues = async (req, res) => {
  try {
    // Fetch all documents
    const allDocs = await QASectionsMeasurementSpecs.find({});

    let totalDocumentsChecked = allDocs.length;
    let totalDocumentsUpdated = 0;
    let totalTolerancesFixed = 0;
    const fixDetails = [];

    for (const doc of allDocs) {
      let docModified = false;
      let docFixCount = 0;

      // Process all 4 arrays
      const arrayFields = [
        "AllBeforeWashSpecs",
        "selectedBeforeWashSpecs",
        "AllAfterWashSpecs",
        "selectedAfterWashSpecs",
      ];

      for (const fieldName of arrayFields) {
        const arr = doc[fieldName];
        if (!Array.isArray(arr) || arr.length === 0) continue;

        for (let i = 0; i < arr.length; i++) {
          const item = arr[i];

          // Fix TolMinus
          if (item.TolMinus) {
            const fixedMinus = fixToleranceFraction(item.TolMinus);
            if (fixedMinus.wasFixed) {
              arr[i].TolMinus = fixedMinus.result;
              docModified = true;
              docFixCount++;
              totalTolerancesFixed++;
            }
          }

          // Fix TolPlus
          if (item.TolPlus) {
            const fixedPlus = fixToleranceFraction(item.TolPlus);
            if (fixedPlus.wasFixed) {
              arr[i].TolPlus = fixedPlus.result;
              docModified = true;
              docFixCount++;
              totalTolerancesFixed++;
            }
          }
        }

        // Mark the array as modified for Mongoose
        if (docModified) {
          doc.markModified(fieldName);
        }
      }

      if (docModified) {
        await doc.save();
        totalDocumentsUpdated++;
        fixDetails.push({
          Order_No: doc.Order_No,
          fixesApplied: docFixCount,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Tolerance fix completed successfully.`,
      summary: {
        totalDocumentsChecked,
        totalDocumentsUpdated,
        totalTolerancesFixed,
      },
      details: fixDetails,
    });
  } catch (error) {
    console.error("Error fixing tolerance values:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Fix tolerances for a single order
 */
export const fixTolerancesByOrder = async (req, res) => {
  const { moNo } = req.params;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  try {
    const doc = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${moNo.trim()}$`, "i") },
    });

    if (!doc) {
      return res.status(404).json({
        message: `No record found for Order No: ${moNo}`,
      });
    }

    let docModified = false;
    let totalFixed = 0;

    const arrayFields = [
      "AllBeforeWashSpecs",
      "selectedBeforeWashSpecs",
      "AllAfterWashSpecs",
      "selectedAfterWashSpecs",
    ];

    for (const fieldName of arrayFields) {
      const arr = doc[fieldName];
      if (!Array.isArray(arr) || arr.length === 0) continue;

      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];

        if (item.TolMinus) {
          const fixedMinus = fixToleranceFraction(item.TolMinus);
          if (fixedMinus.wasFixed) {
            arr[i].TolMinus = fixedMinus.result;
            docModified = true;
            totalFixed++;
          }
        }

        if (item.TolPlus) {
          const fixedPlus = fixToleranceFraction(item.TolPlus);
          if (fixedPlus.wasFixed) {
            arr[i].TolPlus = fixedPlus.result;
            docModified = true;
            totalFixed++;
          }
        }
      }

      if (docModified) {
        doc.markModified(fieldName);
      }
    }

    if (docModified) {
      await doc.save();
    }

    res.status(200).json({
      success: true,
      message: docModified
        ? `Fixed ${totalFixed} tolerance values for ${moNo}`
        : `No fixes needed for ${moNo}`,
      Order_No: doc.Order_No,
      tolerancesFixed: totalFixed,
    });
  } catch (error) {
    console.error("Error fixing tolerances for order:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Preview tolerance issues without fixing
 */
export const previewToleranceIssues = async (req, res) => {
  try {
    const allDocs = await QASectionsMeasurementSpecs.find({});

    const issues = [];

    for (const doc of allDocs) {
      const orderIssues = {
        Order_No: doc.Order_No,
        problems: [],
      };

      const arrayFields = [
        "AllBeforeWashSpecs",
        "selectedBeforeWashSpecs",
        "AllAfterWashSpecs",
        "selectedAfterWashSpecs",
      ];

      for (const fieldName of arrayFields) {
        const arr = doc[fieldName];
        if (!Array.isArray(arr) || arr.length === 0) continue;

        for (const item of arr) {
          // Check TolMinus
          if (item.TolMinus) {
            const fixed = fixToleranceFraction(item.TolMinus);
            if (fixed.wasFixed) {
              orderIssues.problems.push({
                field: fieldName,
                point: item.MeasurementPointEngName,
                type: "TolMinus",
                original: item.TolMinus,
                corrected: fixed.result,
              });
            }
          }

          // Check TolPlus
          if (item.TolPlus) {
            const fixed = fixToleranceFraction(item.TolPlus);
            if (fixed.wasFixed) {
              orderIssues.problems.push({
                field: fieldName,
                point: item.MeasurementPointEngName,
                type: "TolPlus",
                original: item.TolPlus,
                corrected: fixed.result,
              });
            }
          }
        }
      }

      if (orderIssues.problems.length > 0) {
        issues.push(orderIssues);
      }
    }

    res.status(200).json({
      success: true,
      totalDocumentsWithIssues: issues.length,
      totalProblems: issues.reduce((acc, i) => acc + i.problems.length, 0),
      issues,
    });
  } catch (error) {
    console.error("Error previewing tolerance issues:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * APPLIES BEFORE WASH SELECTION TO AFTER WASH
 * 1. Generates fresh AllAfterWashSpecs from Master Data (dt_orders.SizeSpec).
 * 2. Selects items in AW that match the MeasurementPointEngName from the BW selection.
 * 3. Saves both arrays to the database.
 */
export const applyBWSelectionToAW = async (req, res) => {
  const { moNo, selectedPointNames } = req.body;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  if (!selectedPointNames || !Array.isArray(selectedPointNames)) {
    return res
      .status(400)
      .json({ message: "Selected Point Names array is required." });
  }

  try {
    const cleanMoNo = moNo.trim();

    // 1. Fetch Master Data for AW (SizeSpec)
    const dtOrderData = await DtOrder.findOne(
      { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
      { SizeSpec: 1, Order_No: 1, _id: 0 },
    ).lean();

    if (!dtOrderData || !dtOrderData.SizeSpec) {
      return res.status(404).json({
        message:
          "No 'Size Spec' (After Wash) data found in Master Data to apply.",
      });
    }

    // 2. Transform Master Data into Clean AW Specs
    // (Logic mirrors getQASectionsMeasurementSpecsAW)
    const allAfterWashSpecs = dtOrderData.SizeSpec.map((item, index) => {
      const transformedSpecsValues = [];

      if (item.Specs && Array.isArray(item.Specs)) {
        item.Specs.forEach((sizeObj, sIdx) => {
          const sizeKey = Object.keys(sizeObj)[0];
          if (sizeKey) {
            const rawVal = sizeObj[sizeKey];
            const cleanVal = sanitizeSpecValue(rawVal); // Uses existing helper

            transformedSpecsValues.push({
              index: sIdx + 1,
              size: sizeKey,
              fraction: cleanVal.fraction,
              decimal: cleanVal.decimal,
            });
          }
        });
      }

      const cleanTolMinus = sanitizeToleranceValue(item.ToleranceMinus); // Uses existing helper
      const cleanTolPlus = sanitizeToleranceValue(item.TolerancePlus); // Uses existing helper

      return {
        id: new mongoose.Types.ObjectId().toString(),
        no: index + 1,
        kValue: "NA", // Hardcoded for AW
        MeasurementPointEngName: item.EnglishRemark || item.Area || "Unknown",
        MeasurementPointChiName: item.ChineseName || "",
        TolMinus: cleanTolMinus,
        TolPlus: cleanTolPlus,
        Shrinkage: { fraction: "0", decimal: 0 }, // Hardcoded for AW
        Specs: transformedSpecsValues,
      };
    });

    // 3. Filter: Select items that match the names from Before Wash
    const selectedAfterWashSpecs = allAfterWashSpecs.filter((awSpec) =>
      selectedPointNames.includes(awSpec.MeasurementPointEngName),
    );

    // 4. Save to DB
    const result = await QASectionsMeasurementSpecs.findOneAndUpdate(
      { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
      {
        $set: {
          Order_No: cleanMoNo,
          AllAfterWashSpecs: allAfterWashSpecs,
          selectedAfterWashSpecs: selectedAfterWashSpecs,
        },
        $currentDate: { updatedAt: true },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      message: `Successfully applied selection to After Wash. (${selectedAfterWashSpecs.length} points matched)`,
      data: result,
    });
  } catch (error) {
    console.error("Error applying BW selection to AW:", error);
    res.status(500).json({ error: error.message });
  }
};
