import { QASectionsMeasurementSpecs } from "../../MongoDB/dbConnectionController.js";

// =========================================================================
// HELPER: DETECT CHINESE & ENGLISH CHARACTERS
// =========================================================================

/**
 * Check if string contains any Chinese characters
 * Covers CJK Unified Ideographs and common extensions
 */
const containsChinese = (str) => {
  if (!str || typeof str !== "string") return false;
  // CJK Unified Ideographs: \u4E00-\u9FFF
  // CJK Unified Ideographs Extension A: \u3400-\u4DBF
  // CJK Compatibility Ideographs: \uF900-\uFAFF
  // CJK Unified Ideographs Extension B-F (surrogate pairs handled separately)
  const chineseRegex = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3000-\u303F]/;
  return chineseRegex.test(str);
};

/**
 * Check if string is primarily English/ASCII (no Chinese characters)
 * Returns true if the string has content and NO Chinese characters
 */
const isEnglishOnly = (str) => {
  if (!str || typeof str !== "string" || str.trim().length === 0) return false;
  return !containsChinese(str);
};

/**
 * Check if a measurement point has swapped names
 * Swapped = English field has Chinese, Chinese field has English
 */
const hasSwappedNames = (item) => {
  const engName = item.MeasurementPointEngName || "";
  const chiName = item.MeasurementPointChiName || "";

  // Swapped if:
  // 1. English field contains Chinese characters AND
  // 2. Chinese field contains ONLY English (no Chinese)
  const engHasChinese = containsChinese(engName);
  const chiIsEnglishOnly = isEnglishOnly(chiName);

  return engHasChinese && chiIsEnglishOnly;
};

// =========================================================================
// PREVIEW NAME SWAP - Check which arrays and points are affected
// =========================================================================

export const previewNameSwap = async (req, res) => {
  const { moNo } = req.body;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  try {
    const cleanMoNo = moNo.trim();

    // Fetch the QA Sections record
    const qaRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") },
    });

    if (!qaRecord) {
      return res.status(404).json({
        message: `No saved configuration found for Order No: ${cleanMoNo}.`,
        hasConfig: false,
      });
    }

    // Check all 4 arrays
    const arrayFields = [
      "AllBeforeWashSpecs",
      "selectedBeforeWashSpecs",
      "AllAfterWashSpecs",
      "selectedAfterWashSpecs",
    ];

    const affectedArrays = {};
    let totalAffectedPoints = 0;
    const previewDetails = [];

    for (const fieldName of arrayFields) {
      const arr = qaRecord[fieldName];
      if (!Array.isArray(arr) || arr.length === 0) {
        affectedArrays[fieldName] = {
          hasIssues: false,
          affectedCount: 0,
          points: [],
        };
        continue;
      }

      const affectedPoints = [];

      for (const item of arr) {
        if (hasSwappedNames(item)) {
          affectedPoints.push({
            currentEngName: item.MeasurementPointEngName,
            currentChiName: item.MeasurementPointChiName,
            // After swap, these will be reversed
            newEngName: item.MeasurementPointChiName,
            newChiName: item.MeasurementPointEngName,
          });
        }
      }

      affectedArrays[fieldName] = {
        hasIssues: affectedPoints.length > 0,
        affectedCount: affectedPoints.length,
        points: affectedPoints,
      };

      if (affectedPoints.length > 0) {
        totalAffectedPoints += affectedPoints.length;
        previewDetails.push({
          arrayName: fieldName,
          displayName: getDisplayName(fieldName),
          affectedCount: affectedPoints.length,
          samples: affectedPoints.slice(0, 3), // Show first 3 samples
        });
      }
    }

    // Determine if any swap is needed
    const hasAnyIssues = totalAffectedPoints > 0;

    // Group by category (BW vs AW)
    const bwHasIssues =
      affectedArrays.AllBeforeWashSpecs.hasIssues ||
      affectedArrays.selectedBeforeWashSpecs.hasIssues;
    const awHasIssues =
      affectedArrays.AllAfterWashSpecs.hasIssues ||
      affectedArrays.selectedAfterWashSpecs.hasIssues;

    res.status(200).json({
      success: true,
      Order_No: qaRecord.Order_No,
      hasAnyIssues,
      summary: {
        totalAffectedPoints,
        bwHasIssues,
        awHasIssues,
        bwAffectedCount:
          affectedArrays.AllBeforeWashSpecs.affectedCount +
          affectedArrays.selectedBeforeWashSpecs.affectedCount,
        awAffectedCount:
          affectedArrays.AllAfterWashSpecs.affectedCount +
          affectedArrays.selectedAfterWashSpecs.affectedCount,
      },
      affectedArrays,
      previewDetails,
    });
  } catch (error) {
    console.error("Error previewing name swap:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Helper to get display-friendly array name
 */
const getDisplayName = (fieldName) => {
  const names = {
    AllBeforeWashSpecs: "All Before Wash Specs",
    selectedBeforeWashSpecs: "Selected Before Wash Specs",
    AllAfterWashSpecs: "All After Wash Specs",
    selectedAfterWashSpecs: "Selected After Wash Specs",
  };
  return names[fieldName] || fieldName;
};

// =========================================================================
// EXECUTE NAME SWAP - Swap names only in affected arrays
// =========================================================================

export const executeNameSwap = async (req, res) => {
  const { moNo, arraysToSwap } = req.body;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  // arraysToSwap is optional - if not provided, swap all affected arrays
  // If provided, it should be an array like ["AllBeforeWashSpecs", "AllAfterWashSpecs"]

  try {
    const cleanMoNo = moNo.trim();

    // Fetch the QA Sections record
    const qaRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") },
    });

    if (!qaRecord) {
      return res.status(404).json({
        message: `No saved configuration found for Order No: ${cleanMoNo}.`,
      });
    }

    // Determine which arrays to process
    const allArrayFields = [
      "AllBeforeWashSpecs",
      "selectedBeforeWashSpecs",
      "AllAfterWashSpecs",
      "selectedAfterWashSpecs",
    ];

    const fieldsToProcess =
      arraysToSwap && Array.isArray(arraysToSwap) && arraysToSwap.length > 0
        ? arraysToSwap.filter((f) => allArrayFields.includes(f))
        : allArrayFields;

    let totalSwapped = 0;
    const swapDetails = [];

    for (const fieldName of fieldsToProcess) {
      const arr = qaRecord[fieldName];
      if (!Array.isArray(arr) || arr.length === 0) continue;

      let fieldSwapCount = 0;

      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];

        if (hasSwappedNames(item)) {
          // Perform the swap
          const tempEng = item.MeasurementPointEngName;
          const tempChi = item.MeasurementPointChiName;

          arr[i].MeasurementPointEngName = tempChi;
          arr[i].MeasurementPointChiName = tempEng;

          fieldSwapCount++;
          totalSwapped++;
        }
      }

      if (fieldSwapCount > 0) {
        qaRecord.markModified(fieldName);
        swapDetails.push({
          arrayName: fieldName,
          displayName: getDisplayName(fieldName),
          swappedCount: fieldSwapCount,
        });
      }
    }

    // Save if any changes were made
    if (totalSwapped > 0) {
      qaRecord.updatedAt = new Date();
      await qaRecord.save();
    }

    res.status(200).json({
      success: true,
      message:
        totalSwapped > 0
          ? `Successfully swapped ${totalSwapped} measurement point name(s).`
          : "No names needed to be swapped.",
      summary: {
        totalSwapped,
        arraysProcessed: fieldsToProcess.length,
      },
      swapDetails,
      updatedAt: qaRecord.updatedAt,
    });
  } catch (error) {
    console.error("Error executing name swap:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================================================================
// VALIDATE SINGLE POINT - Helper endpoint for debugging
// =========================================================================

export const validatePointNames = async (req, res) => {
  const { engName, chiName } = req.body;

  const engHasChinese = containsChinese(engName);
  const chiIsEnglishOnly = isEnglishOnly(chiName);
  const chiHasChinese = containsChinese(chiName);
  const engIsEnglishOnly = isEnglishOnly(engName);

  const isSwapped = engHasChinese && chiIsEnglishOnly;
  const isCorrect = engIsEnglishOnly && chiHasChinese;

  res.status(200).json({
    engName,
    chiName,
    analysis: {
      engHasChinese,
      engIsEnglishOnly,
      chiHasChinese,
      chiIsEnglishOnly,
    },
    conclusion: {
      isSwapped,
      isCorrect,
      needsSwap: isSwapped,
    },
  });
};