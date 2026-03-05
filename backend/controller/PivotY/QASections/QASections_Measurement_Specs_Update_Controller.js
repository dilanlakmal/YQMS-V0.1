import {
  QASectionsMeasurementSpecs,
  DtOrder,
} from "../../MongoDB/dbConnectionController.js";

// =========================================================================
// HELPER: SANITIZERS (Reused from main controller)
// =========================================================================

const sanitizeSpecValue = (inputValue) => {
  let str = "";
  if (inputValue && typeof inputValue === "object") {
    str = inputValue.fraction || inputValue.raw || inputValue.value || "";
  } else {
    str = String(inputValue || "");
  }

  str = str.replace(/\u2044/g, "/").replace(/\\/g, "/");
  const cleanStr = str.trim();
  let decimal = 0;

  if (!cleanStr) {
    return { fraction: "", decimal: 0 };
  }

  try {
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
    } else if (cleanStr.includes("/")) {
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
    console.warn(`Failed to parse decimal for spec value: ${str}`);
    decimal = 0;
  }

  if (isNaN(decimal)) decimal = 0;

  return {
    fraction: cleanStr,
    decimal: decimal,
  };
};

const sanitizeToleranceValue = (inputValue) => {
  let str = "";
  if (inputValue && typeof inputValue === "object") {
    str = inputValue.fraction || inputValue.raw || inputValue.value || "";
  } else {
    str = String(inputValue || "");
  }

  str = str.replace(/\u2044/g, "/").replace(/\\/g, "/");
  const cleanStr = str.replace(/\s+/g, "");
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
    decimal = 0;
  }

  if (isNaN(decimal)) decimal = 0;

  return {
    fraction: cleanStr,
    decimal: decimal,
  };
};

// =========================================================================
// TRANSFORM HELPERS - FIXED VERSION
// =========================================================================

/**
 * Detect if a specs object is in raw format or already transformed
 * Raw format: {XS: "14 1/2"} - first key is a size name
 * Transformed format: {index: 1, size: "XS", fraction: "14 1/2", decimal: 14.5}
 */
const isTransformedFormat = (specObj) => {
  if (!specObj || typeof specObj !== "object") return false;

  // Check if it has 'size' property with a valid string value
  // AND the size value is NOT one of the standard property names
  const standardProps = ["index", "size", "fraction", "decimal", "_id", "__v"];

  if (
    specObj.hasOwnProperty("size") &&
    typeof specObj.size === "string" &&
    specObj.size.trim() !== "" &&
    !standardProps.includes(specObj.size.toLowerCase())
  ) {
    return true;
  }

  return false;
};

/**
 * Transform dt_orders Specs array to qa_sections format
 * HANDLES BOTH FORMATS:
 * 1. Raw format: [{XS: "14 1/2"}, {S: "15"}, ...]
 * 2. Already transformed: [{index: 1, size: "XS", fraction: "14 1/2", decimal: 14.5}, ...]
 */
const transformMasterSpecs = (specsArray) => {
  const transformed = [];

  if (!specsArray || !Array.isArray(specsArray)) {
    return transformed;
  }

  specsArray.forEach((sizeObj, idx) => {
    if (!sizeObj || typeof sizeObj !== "object") return;

    // Check if already in transformed format
    if (isTransformedFormat(sizeObj)) {
      // ALREADY TRANSFORMED: {index: 1, size: "XS", fraction: "14 1/2", decimal: 14.5}
      transformed.push({
        index: typeof sizeObj.index === "number" ? sizeObj.index : idx + 1,
        size: sizeObj.size.trim(),
        fraction:
          typeof sizeObj.fraction === "string"
            ? sizeObj.fraction
            : String(sizeObj.fraction || ""),
        decimal:
          typeof sizeObj.decimal === "number" && !isNaN(sizeObj.decimal)
            ? sizeObj.decimal
            : 0,
      });
    } else {
      // RAW FORMAT: {XS: "14 1/2"} or {"S": "15"}
      // Find the size key - should be first key that's NOT a standard property
      const standardProps = [
        "_id",
        "index",
        "size",
        "fraction",
        "decimal",
        "__v",
      ];
      const keys = Object.keys(sizeObj);
      const sizeKey = keys.find((k) => !standardProps.includes(k));

      if (sizeKey) {
        const rawVal = sizeObj[sizeKey];
        const cleanVal = sanitizeSpecValue(rawVal);

        transformed.push({
          index: idx + 1,
          size: sizeKey,
          fraction: cleanVal.fraction,
          decimal: cleanVal.decimal,
        });
      }
    }
  });

  return transformed;
};

/**
 * Normalize size name for comparison (handles case differences)
 */
const normalizeSize = (size) => {
  if (!size || typeof size !== "string") return "";
  return size.trim().toUpperCase();
};

/**
 * Merge missing specs from master data into existing specs
 * Does NOT overwrite existing - only adds missing sizes
 * FIXED: Proper size comparison and validation
 */
const mergeSpecs = (existingSpecs, masterSpecs) => {
  const existing = existingSpecs || [];
  const master = masterSpecs || [];

  // Validate existing specs - only include those with valid size names
  const validExisting = existing.filter(
    (s) => s && typeof s.size === "string" && s.size.trim() !== "",
  );

  // Create a Set of existing sizes (normalized for comparison)
  const existingSizes = new Set();
  validExisting.forEach((s) => {
    existingSizes.add(normalizeSize(s.size));
  });

  // Find missing specs from master
  const missingSpecs = master.filter((masterSpec) => {
    if (
      !masterSpec ||
      typeof masterSpec.size !== "string" ||
      masterSpec.size.trim() === ""
    ) {
      return false;
    }
    const normalizedMasterSize = normalizeSize(masterSpec.size);
    const isMissing = !existingSizes.has(normalizedMasterSize);

    if (isMissing) {
      console.log(`[mergeSpecs] Missing size found: ${masterSpec.size}`);
    }

    return isMissing;
  });

  if (missingSpecs.length === 0) {
    return {
      mergedSpecs: validExisting,
      hasChanges: false,
      addedCount: 0,
    };
  }

  // Build master order map for sorting
  const masterOrder = new Map();
  master.forEach((m, idx) => {
    if (m && m.size) {
      masterOrder.set(normalizeSize(m.size), idx);
    }
  });

  // Combine existing and missing specs
  const mergedSpecs = [...validExisting];

  // Add missing specs
  missingSpecs.forEach((spec) => {
    mergedSpecs.push({
      index: 0, // Will be re-assigned after sorting
      size: spec.size.trim(),
      fraction: spec.fraction || "",
      decimal: typeof spec.decimal === "number" ? spec.decimal : 0,
    });
  });

  // Sort by master data order
  mergedSpecs.sort((a, b) => {
    const aOrder = masterOrder.get(normalizeSize(a.size)) ?? 999;
    const bOrder = masterOrder.get(normalizeSize(b.size)) ?? 999;
    return aOrder - bOrder;
  });

  // Re-assign indices based on sorted order
  mergedSpecs.forEach((spec, idx) => {
    spec.index = idx + 1;
  });

  return {
    mergedSpecs,
    hasChanges: true,
    addedCount: missingSpecs.length,
  };
};

// =========================================================================
// UPDATE SPECS FROM MASTER DATA - BEFORE WASH
// =========================================================================

export const updateBWSpecsFromMasterData = async (req, res) => {
  const { moNo } = req.body;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  try {
    const cleanMoNo = moNo.trim();

    // 1. Fetch the QA Sections record
    const qaRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") },
    });

    if (!qaRecord) {
      return res.status(404).json({
        message: `No saved configuration found for Order No: ${cleanMoNo}. Please save configuration first.`,
      });
    }

    // 2. Fetch the Master Data (dt_orders)
    const dtOrderData = await DtOrder.findOne(
      { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
      { BeforeWashSpecs: 1, Order_No: 1, _id: 0 },
    ).lean();

    if (!dtOrderData) {
      return res.status(404).json({
        message: `Order No '${cleanMoNo}' not found in Master Data.`,
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

    // 3. Build Master Data Map (keyed by MeasurementPointEngName)
    const masterDataMap = new Map();

    dtOrderData.BeforeWashSpecs.forEach((item) => {
      const pointName = item.MeasurementPointEngName || "";
      if (!pointName) return;

      // Transform Specs array (handles both formats)
      const transformedSpecs = transformMasterSpecs(item.Specs);

      // Process Shrinkage
      const shrinkage = item.Shrinkage
        ? sanitizeSpecValue(item.Shrinkage)
        : { fraction: "0", decimal: 0 };

      // Process Tolerances
      const tolMinus = sanitizeToleranceValue(item.TolMinus);
      const tolPlus = sanitizeToleranceValue(item.TolPlus);

      masterDataMap.set(pointName, {
        Specs: transformedSpecs,
        Shrinkage: shrinkage,
        TolMinus: tolMinus,
        TolPlus: tolPlus,
        kValue: item.kValue || "NA",
        MeasurementPointChiName: item.MeasurementPointChiName || "",
      });
    });

    // 4. Update QA Record Arrays
    const arrayFieldsToUpdate = [
      "AllBeforeWashSpecs",
      "selectedBeforeWashSpecs",
    ];

    let totalPointsUpdated = 0;
    let totalSpecsAdded = 0;
    let shrinkageUpdates = 0;
    const updateDetails = [];

    for (const fieldName of arrayFieldsToUpdate) {
      const arr = qaRecord[fieldName];
      if (!Array.isArray(arr) || arr.length === 0) {
        continue;
      }

      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const pointName = item.MeasurementPointEngName;

        if (!pointName) {
          continue;
        }

        if (!masterDataMap.has(pointName)) {
          continue;
        }

        const masterData = masterDataMap.get(pointName);
        let itemUpdated = false;
        let specsAddedForItem = 0;
        let shrinkageUpdated = false;

        // --- Merge Specs Array ---
        const currentSpecs = item.Specs || [];
        const masterSpecs = masterData.Specs || [];

        if (masterSpecs.length > 0) {
          const { mergedSpecs, hasChanges, addedCount } = mergeSpecs(
            currentSpecs,
            masterSpecs,
          );

          if (hasChanges) {
            arr[i].Specs = mergedSpecs;
            itemUpdated = true;
            specsAddedForItem = addedCount;
            totalSpecsAdded += addedCount;
          }
        }

        // --- Update Shrinkage (only if master has non-zero value) ---
        const masterShrinkage = masterData.Shrinkage;
        const currentShrinkage = item.Shrinkage || {
          fraction: "0",
          decimal: 0,
        };

        if (
          masterShrinkage &&
          masterShrinkage.fraction &&
          masterShrinkage.fraction !== "0"
        ) {
          if (
            !currentShrinkage.fraction ||
            currentShrinkage.fraction === "0" ||
            currentShrinkage.decimal !== masterShrinkage.decimal
          ) {
            arr[i].Shrinkage = {
              fraction: masterShrinkage.fraction,
              decimal: masterShrinkage.decimal,
            };
            itemUpdated = true;
            shrinkageUpdated = true;
            shrinkageUpdates++;
          }
        }

        if (itemUpdated) {
          totalPointsUpdated++;
          updateDetails.push({
            field: fieldName,
            pointName: pointName,
            specsAdded: specsAddedForItem,
            shrinkageUpdated: shrinkageUpdated,
          });
        }
      }

      // Mark the array as modified for Mongoose
      qaRecord.markModified(fieldName);
    }

    // 5. Save if changes were made
    if (totalPointsUpdated > 0 || totalSpecsAdded > 0 || shrinkageUpdates > 0) {
      qaRecord.updatedAt = new Date();
      await qaRecord.save();
    }

    res.status(200).json({
      success: true,
      message:
        totalPointsUpdated > 0
          ? `Successfully updated ${totalPointsUpdated} measurement point(s). Added ${totalSpecsAdded} spec(s), updated ${shrinkageUpdates} shrinkage value(s).`
          : "All specs are already up to date. No changes needed.",
      summary: {
        totalPointsUpdated,
        totalSpecsAdded,
        shrinkageUpdates,
      },
      details: updateDetails,
      updatedAt: qaRecord.updatedAt,
    });
  } catch (error) {
    console.error("Error updating BW specs from master data:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================================================================
// UPDATE SPECS FROM MASTER DATA - AFTER WASH
// =========================================================================

export const updateAWSpecsFromMasterData = async (req, res) => {
  const { moNo } = req.body;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  try {
    const cleanMoNo = moNo.trim();

    // 1. Fetch the QA Sections record
    const qaRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") },
    });

    if (!qaRecord) {
      return res.status(404).json({
        message: `No saved configuration found for Order No: ${cleanMoNo}. Please save configuration first.`,
      });
    }

    // 2. Fetch the Master Data (dt_orders)
    const dtOrderData = await DtOrder.findOne(
      { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
      { SizeSpec: 1, Order_No: 1, _id: 0 },
    ).lean();

    if (!dtOrderData) {
      return res.status(404).json({
        message: `Order No '${cleanMoNo}' not found in Master Data.`,
      });
    }

    if (!dtOrderData.SizeSpec || dtOrderData.SizeSpec.length === 0) {
      return res.status(404).json({
        message: "No 'Size Spec' (After Wash) data found in Master Data.",
      });
    }

    // 3. Build Master Data Map (keyed by MeasurementPointEngName)
    const masterDataMap = new Map();

    dtOrderData.SizeSpec.forEach((item) => {
      // For AW, the point name comes from EnglishRemark or Area
      const pointName = item.EnglishRemark || item.Area || "";
      if (!pointName) return;

      // Transform Specs array (handles both formats)
      const transformedSpecs = transformMasterSpecs(item.Specs);

      // Process Tolerances
      const tolMinus = sanitizeToleranceValue(item.ToleranceMinus);
      const tolPlus = sanitizeToleranceValue(item.TolerancePlus);

      masterDataMap.set(pointName, {
        Specs: transformedSpecs,
        Shrinkage: { fraction: "0", decimal: 0 }, // AW typically doesn't have shrinkage
        TolMinus: tolMinus,
        TolPlus: tolPlus,
        MeasurementPointChiName: item.ChineseName || "",
      });
    });

    // 4. Update QA Record Arrays
    const arrayFieldsToUpdate = ["AllAfterWashSpecs", "selectedAfterWashSpecs"];

    let totalPointsUpdated = 0;
    let totalSpecsAdded = 0;
    const updateDetails = [];

    for (const fieldName of arrayFieldsToUpdate) {
      const arr = qaRecord[fieldName];
      if (!Array.isArray(arr) || arr.length === 0) {
        continue;
      }

      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const pointName = item.MeasurementPointEngName;

        if (!pointName) {
          continue;
        }

        if (!masterDataMap.has(pointName)) {
          continue;
        }

        const masterData = masterDataMap.get(pointName);
        let itemUpdated = false;
        let specsAddedForItem = 0;

        // --- Merge Specs Array ---
        const currentSpecs = item.Specs || [];
        const masterSpecs = masterData.Specs || [];

        if (masterSpecs.length > 0) {
          const { mergedSpecs, hasChanges, addedCount } = mergeSpecs(
            currentSpecs,
            masterSpecs,
          );

          if (hasChanges) {
            arr[i].Specs = mergedSpecs;
            itemUpdated = true;
            specsAddedForItem = addedCount;
            totalSpecsAdded += addedCount;
          }
        }

        if (itemUpdated) {
          totalPointsUpdated++;
          updateDetails.push({
            field: fieldName,
            pointName: pointName,
            specsAdded: specsAddedForItem,
          });
        }
      }

      // Mark the array as modified for Mongoose
      qaRecord.markModified(fieldName);
    }

    // 5. Save if changes were made
    if (totalPointsUpdated > 0 || totalSpecsAdded > 0) {
      qaRecord.updatedAt = new Date();
      await qaRecord.save();
    }

    res.status(200).json({
      success: true,
      message:
        totalPointsUpdated > 0
          ? `Successfully updated ${totalPointsUpdated} measurement point(s). Added ${totalSpecsAdded} spec(s).`
          : "All specs are already up to date. No changes needed.",
      summary: {
        totalPointsUpdated,
        totalSpecsAdded,
      },
      details: updateDetails,
      updatedAt: qaRecord.updatedAt,
    });
  } catch (error) {
    console.error("Error updating AW specs from master data:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================================================================
// PREVIEW UPDATE - Shows what would be updated without making changes
// =========================================================================

export const previewSpecsUpdate = async (req, res) => {
  const { moNo, isAW } = req.body;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  try {
    const cleanMoNo = moNo.trim();

    // 1. Fetch the QA Sections record
    const qaRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") },
    });

    if (!qaRecord) {
      return res.status(404).json({
        message: `No saved configuration found for Order No: ${cleanMoNo}.`,
        hasConfig: false,
      });
    }

    // 2. Fetch the Master Data
    const projection = isAW
      ? { SizeSpec: 1, Order_No: 1, _id: 0 }
      : { BeforeWashSpecs: 1, Order_No: 1, _id: 0 };

    const dtOrderData = await DtOrder.findOne(
      { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
      projection,
    ).lean();

    if (!dtOrderData) {
      return res.status(404).json({
        message: `Order No '${cleanMoNo}' not found in Master Data.`,
      });
    }

    // 3. Build Master Data Map
    const masterDataMap = new Map();
    const sourceArray = isAW
      ? dtOrderData.SizeSpec
      : dtOrderData.BeforeWashSpecs;

    if (!sourceArray || sourceArray.length === 0) {
      return res.status(404).json({
        message: `No ${isAW ? "Size Spec" : "Before Wash Specs"} found in Master Data.`,
      });
    }

    sourceArray.forEach((item) => {
      const pointName = isAW
        ? item.EnglishRemark || item.Area || ""
        : item.MeasurementPointEngName || "";

      if (!pointName) return;

      // Transform Specs array (handles both formats)
      const transformedSpecs = transformMasterSpecs(item.Specs);

      const shrinkage =
        !isAW && item.Shrinkage
          ? sanitizeSpecValue(item.Shrinkage)
          : { fraction: "0", decimal: 0 };

      masterDataMap.set(pointName, {
        Specs: transformedSpecs,
        Shrinkage: shrinkage,
      });
    });

    // 4. Analyze differences
    const arrayFieldsToCheck = isAW
      ? ["AllAfterWashSpecs", "selectedAfterWashSpecs"]
      : ["AllBeforeWashSpecs", "selectedBeforeWashSpecs"];

    const pendingUpdates = [];
    let totalMissingSpecs = 0;
    let totalShrinkageUpdates = 0;

    // Track unique points to avoid counting duplicates across arrays
    const processedPoints = new Set();

    for (const fieldName of arrayFieldsToCheck) {
      const arr = qaRecord[fieldName];
      if (!Array.isArray(arr) || arr.length === 0) continue;

      for (const item of arr) {
        const pointName = item.MeasurementPointEngName;
        if (!pointName || !masterDataMap.has(pointName)) continue;

        // Create unique key for this point in this field
        const uniqueKey = `${fieldName}:${pointName}`;
        if (processedPoints.has(uniqueKey)) continue;
        processedPoints.add(uniqueKey);

        const masterData = masterDataMap.get(pointName);
        const currentSpecs = item.Specs || [];
        const masterSpecs = masterData.Specs || [];

        // Find missing sizes - use normalized comparison
        const existingSizes = new Set(
          currentSpecs
            .filter((s) => s && s.size)
            .map((s) => normalizeSize(s.size)),
        );

        const missingSizes = masterSpecs
          .filter(
            (ms) => ms && ms.size && !existingSizes.has(normalizeSize(ms.size)),
          )
          .map((ms) => ms.size);

        // Check shrinkage
        let shrinkageNeedsUpdate = false;
        if (!isAW && masterData.Shrinkage.fraction !== "0") {
          const currentShrinkage = item.Shrinkage || {
            fraction: "0",
            decimal: 0,
          };
          if (
            !currentShrinkage.fraction ||
            currentShrinkage.fraction === "0" ||
            currentShrinkage.decimal !== masterData.Shrinkage.decimal
          ) {
            shrinkageNeedsUpdate = true;
          }
        }

        if (missingSizes.length > 0 || shrinkageNeedsUpdate) {
          pendingUpdates.push({
            field: fieldName,
            pointName: pointName,
            currentSpecsCount: currentSpecs.length,
            masterSpecsCount: masterSpecs.length,
            missingSizes: missingSizes,
            currentShrinkage: item.Shrinkage?.fraction || "0",
            masterShrinkage: masterData.Shrinkage.fraction,
            shrinkageNeedsUpdate: shrinkageNeedsUpdate,
          });

          totalMissingSpecs += missingSizes.length;
          if (shrinkageNeedsUpdate) totalShrinkageUpdates++;
        }
      }
    }

    res.status(200).json({
      success: true,
      hasUpdates: pendingUpdates.length > 0,
      summary: {
        totalPointsToUpdate: pendingUpdates.length,
        totalMissingSpecs: totalMissingSpecs,
        totalShrinkageUpdates: totalShrinkageUpdates,
      },
      pendingUpdates: pendingUpdates,
    });
  } catch (error) {
    console.error("Error previewing specs update:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================================================================
// REPAIR CORRUPTED SPECS - Fix data that was corrupted by previous bug
// =========================================================================

/**
 * Repairs specs that were corrupted with size: "index"
 * Removes invalid specs and re-syncs from master data
 */
export const repairCorruptedSpecs = async (req, res) => {
  const { moNo } = req.body;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  try {
    const cleanMoNo = moNo.trim();

    // 1. Fetch the QA Sections record
    const qaRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") },
    });

    if (!qaRecord) {
      return res.status(404).json({
        message: `No record found for Order No: ${cleanMoNo}.`,
      });
    }

    // 2. Fetch Master Data for both BW and AW
    const dtOrderData = await DtOrder.findOne(
      { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
      { BeforeWashSpecs: 1, SizeSpec: 1, Order_No: 1, _id: 0 },
    ).lean();

    if (!dtOrderData) {
      return res.status(404).json({
        message: `Order No '${cleanMoNo}' not found in Master Data.`,
      });
    }

    // Build master data maps
    const bwMasterMap = new Map();
    const awMasterMap = new Map();

    // BW Master Data
    if (dtOrderData.BeforeWashSpecs) {
      dtOrderData.BeforeWashSpecs.forEach((item) => {
        const pointName = item.MeasurementPointEngName || "";
        if (pointName) {
          bwMasterMap.set(pointName, transformMasterSpecs(item.Specs));
        }
      });
    }

    // AW Master Data
    if (dtOrderData.SizeSpec) {
      dtOrderData.SizeSpec.forEach((item) => {
        const pointName = item.EnglishRemark || item.Area || "";
        if (pointName) {
          awMasterMap.set(pointName, transformMasterSpecs(item.Specs));
        }
      });
    }

    let totalRepaired = 0;
    let totalSpecsRemoved = 0;
    let totalSpecsRestored = 0;

    // 3. Repair each array
    const repairArray = (arr, masterMap, fieldName) => {
      if (!Array.isArray(arr) || arr.length === 0) return;

      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const pointName = item.MeasurementPointEngName;

        if (!item.Specs || !Array.isArray(item.Specs)) continue;

        // Check for corrupted specs (size: "index" or invalid size names)
        const invalidProps = [
          "index",
          "size",
          "fraction",
          "decimal",
          "_id",
          "__v",
        ];
        const originalCount = item.Specs.length;

        // Filter out corrupted specs
        const validSpecs = item.Specs.filter((spec) => {
          if (!spec || typeof spec.size !== "string") return false;
          const normalizedSize = spec.size.trim().toLowerCase();
          // Invalid if size matches a property name
          if (invalidProps.includes(normalizedSize)) {
            return false;
          }
          return true;
        });

        const removedCount = originalCount - validSpecs.length;

        if (removedCount > 0) {
          totalSpecsRemoved += removedCount;

          // Get master specs for this point
          const masterSpecs = masterMap.get(pointName) || [];

          if (masterSpecs.length > 0) {
            // Merge valid existing with master
            const { mergedSpecs, addedCount } = mergeSpecs(
              validSpecs,
              masterSpecs,
            );
            arr[i].Specs = mergedSpecs;
            totalSpecsRestored += addedCount;
          } else {
            arr[i].Specs = validSpecs;
          }

          totalRepaired++;
        }
      }

      qaRecord.markModified(fieldName);
    };

    // Repair BW arrays
    repairArray(qaRecord.AllBeforeWashSpecs, bwMasterMap, "AllBeforeWashSpecs");
    repairArray(
      qaRecord.selectedBeforeWashSpecs,
      bwMasterMap,
      "selectedBeforeWashSpecs",
    );

    // Repair AW arrays
    repairArray(qaRecord.AllAfterWashSpecs, awMasterMap, "AllAfterWashSpecs");
    repairArray(
      qaRecord.selectedAfterWashSpecs,
      awMasterMap,
      "selectedAfterWashSpecs",
    );

    // 4. Save if changes were made
    if (totalRepaired > 0) {
      qaRecord.updatedAt = new Date();
      await qaRecord.save();
    }

    res.status(200).json({
      success: true,
      message:
        totalRepaired > 0
          ? `Repaired ${totalRepaired} measurement points. Removed ${totalSpecsRemoved} corrupted specs, restored ${totalSpecsRestored} specs from master data.`
          : "No corrupted data found. All specs are valid.",
      summary: {
        pointsRepaired: totalRepaired,
        corruptedSpecsRemoved: totalSpecsRemoved,
        specsRestoredFromMaster: totalSpecsRestored,
      },
      updatedAt: qaRecord.updatedAt,
    });
  } catch (error) {
    console.error("Error repairing corrupted specs:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================================================================
// REPAIR AW TOLERANCE VALUES FROM MASTER DATA
// =========================================================================

export const repairAWTolerancesFromMaster = async (req, res) => {
  const { moNo } = req.body;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  try {
    const cleanMoNo = moNo.trim();

    // 1. Fetch QA Sections record
    const qaRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") },
    });

    if (!qaRecord) {
      return res.status(404).json({
        message: `No saved configuration found for Order No: ${cleanMoNo}.`,
      });
    }

    // 2. Fetch Master Data - SizeSpec
    const dtOrderData = await DtOrder.findOne(
      { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
      { SizeSpec: 1, Order_No: 1, _id: 0 },
    ).lean();

    if (
      !dtOrderData ||
      !dtOrderData.SizeSpec ||
      dtOrderData.SizeSpec.length === 0
    ) {
      return res.status(404).json({
        message: "No 'Size Spec' data found in Master Data.",
      });
    }

    // 3. Build master tolerance map keyed by EnglishRemark
    const masterTolMap = new Map();

    dtOrderData.SizeSpec.forEach((item) => {
      const pointName = item.EnglishRemark || item.Area || "";
      if (!pointName) return;

      masterTolMap.set(pointName, {
        TolMinus: sanitizeToleranceValue(item.ToleranceMinus),
        TolPlus: sanitizeToleranceValue(item.TolerancePlus),
      });
    });

    // 4. Update AllAfterWashSpecs and selectedAfterWashSpecs
    const arrayFields = ["AllAfterWashSpecs", "selectedAfterWashSpecs"];
    let totalUpdated = 0;
    const updateDetails = [];

    for (const fieldName of arrayFields) {
      const arr = qaRecord[fieldName];
      if (!Array.isArray(arr) || arr.length === 0) continue;

      let fieldModified = false;

      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const pointName = item.MeasurementPointEngName;

        if (!pointName || !masterTolMap.has(pointName)) continue;

        const masterTol = masterTolMap.get(pointName);
        let itemChanged = false;

        // Check & update TolMinus
        const currentMinus = item.TolMinus?.fraction ?? "";
        const masterMinus = masterTol.TolMinus.fraction;
        if (currentMinus !== masterMinus) {
          arr[i].TolMinus = masterTol.TolMinus;
          itemChanged = true;
        }

        // Check & update TolPlus
        const currentPlus = item.TolPlus?.fraction ?? "";
        const masterPlus = masterTol.TolPlus.fraction;
        if (currentPlus !== masterPlus) {
          arr[i].TolPlus = masterTol.TolPlus;
          itemChanged = true;
        }

        if (itemChanged) {
          totalUpdated++;
          fieldModified = true;
          updateDetails.push({
            field: fieldName,
            pointName,
            newTolMinus: masterTol.TolMinus.fraction,
            newTolPlus: masterTol.TolPlus.fraction,
          });
        }
      }

      if (fieldModified) {
        qaRecord.markModified(fieldName);
      }
    }

    if (totalUpdated > 0) {
      qaRecord.updatedAt = new Date();
      await qaRecord.save();
    }

    res.status(200).json({
      success: true,
      message:
        totalUpdated > 0
          ? `Successfully repaired ${totalUpdated} tolerance value(s) from Master Data.`
          : "All tolerance values are already in sync. No changes needed.",
      summary: { totalUpdated },
      details: updateDetails,
      updatedAt: qaRecord.updatedAt,
    });
  } catch (error) {
    console.error("Error repairing AW tolerances from master:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
