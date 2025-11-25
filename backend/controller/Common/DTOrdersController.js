import { ymProdConnection } from "../MongoDB/dbConnectionController.js";

// Update the MONo search endpoint to handle partial matching
export const getMoNoSearch = async (req, res) => {
  try {
    const term = req.query.term; // Changed from 'digits' to 'term'
    if (!term) {
      return res.status(400).json({ error: "Search term is required" });
    }

    const collection = ymProdConnection.db.collection("dt_orders");

    // Use a case-insensitive regex to match the term anywhere in Order_No
    const regexPattern = new RegExp(term, "i");

    const results = await collection
      .find({
        Order_No: { $regex: regexPattern }
      })
      .project({ Order_No: 1, _id: 0 }) // Only return Order_No field
      .limit(100) // Limit results to prevent overwhelming the UI
      .toArray();

    // Extract unique Order_No values
    const uniqueMONos = [...new Set(results.map((r) => r.Order_No))];

    res.json(uniqueMONos);
  } catch (error) {
    console.error("Error searching MONo:", error);
    res.status(500).json({ error: "Failed to search MONo" });
  }
};

// Update /api/order-details endpoint
export const getOrderDetails = async (req, res) => {
  try {
    const collection = ymProdConnection.db.collection("dt_orders");
    const order = await collection.findOne({
      Order_No: req.params.mono
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const colorMap = new Map();
    order.OrderColors.forEach((colorObj) => {
      const colorKey = colorObj.Color.toLowerCase().trim();
      const originalColor = colorObj.Color.trim();

      if (!colorMap.has(colorKey)) {
        colorMap.set(colorKey, {
          originalColor,
          colorCode: colorObj.ColorCode,
          chnColor: colorObj.ChnColor,
          colorKey: colorObj.ColorKey,
          sizes: new Map()
        });
      }

      colorObj.OrderQty.forEach((sizeEntry) => {
        const sizeName = Object.keys(sizeEntry)[0];
        const quantity = sizeEntry[sizeName];
        const cleanSize = sizeName.split(";")[0].trim();

        if (quantity > 0) {
          colorMap.get(colorKey).sizes.set(cleanSize, {
            orderQty: quantity,
            planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0
          });
        }
      });
    });

    const response = {
      engName: order.EngName,
      totalQty: order.TotalQty,
      factoryname: order.Factory || "N/A",
      custStyle: order.CustStyle || "N/A",
      country: order.Country || "N/A",
      colors: Array.from(colorMap.values()).map((c) => ({
        original: c.originalColor,
        code: c.colorCode,
        chn: c.chnColor,
        key: c.colorKey
      })),
      colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
        acc[curr.originalColor.toLowerCase()] = {
          sizes: Array.from(curr.sizes.keys()),
          details: Array.from(curr.sizes.entries()).map(([size, data]) => ({
            size,
            orderQty: data.orderQty,
            planCutQty: data.planCutQty
          }))
        };
        return acc;
      }, {})
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order details" });
  }
};

// Update /api/order-sizes endpoint
export const getOrderSizes = async (req, res) => {
  try {
    const collection = ymProdConnection.db.collection("dt_orders");
    const order = await collection.findOne({ Order_No: req.params.mono });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const colorObj = order.OrderColors.find(
      (c) => c.Color.toLowerCase() === req.params.color.toLowerCase().trim()
    );

    if (!colorObj) return res.json([]);

    const sizesWithDetails = colorObj.OrderQty.filter(
      (entry) => entry[Object.keys(entry)[0]] > 0
    )
      .map((entry) => {
        const sizeName = Object.keys(entry)[0];
        const cleanSize = sizeName.split(";")[0].trim();
        return {
          size: cleanSize,
          orderQty: entry[sizeName],
          planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0
        };
      })
      .filter((v, i, a) => a.findIndex((t) => t.size === v.size) === i);

    res.json(sizesWithDetails);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sizes" });
  }
};

export const saveWashingSpecs = async (req, res) => {
  const { moNo, washingSpecsData } = req.body;

  if (!moNo || !washingSpecsData || washingSpecsData.length === 0) {
    return res
      .status(400)
      .json({ message: "Missing MO Number or specs data." });
  }

  try {
    const collection = ymProdConnection.db.collection("dt_orders");
    const orderDocument = await collection.findOne({ Order_No: moNo });
    // const orderDocument = await DtOrder.findOne({ Order_No: moNo });

    if (!orderDocument) {
      return res.status(404).json({
        message: `Order with MO No '${moNo}' not found in dt_orders.`
      });
    }

    // --- DATA TRANSFORMATION LOGIC ---

    const afterWashSpecs = [];
    const beforeWashSpecs = [];

    // Process AfterWashSpecs from the first sheet
    const firstSheetData = washingSpecsData[0];
    if (firstSheetData && firstSheetData.rows) {
      firstSheetData.rows.forEach((row, rowIndex) => {
        const specsArray = [];
        firstSheetData.headers.forEach((header, headerIndex) => {
          const specData = row.specs[header.size]["After Washing"];
          if (specData) {
            specsArray.push({
              index: headerIndex + 1,
              size: header.size,
              // Save BOTH fraction and decimal for the spec value
              fraction: specData.raw,
              decimal: specData.decimal
            });
          }
        });

        afterWashSpecs.push({
          no: rowIndex + 1,
          kValue: "NA",
          MeasurementPointEngName: row["Measurement Point - Eng"],
          MeasurementPointChiName: row["Measurement Point - Chi"],
          // Save the full object for TolMinus and TolPlus
          TolMinus: {
            fraction: row["Tol Minus"].raw,
            decimal: row["Tol Minus"].decimal
          },
          TolPlus: {
            fraction: row["Tol Plus"].raw,
            decimal: row["Tol Plus"].decimal
          },
          Specs: specsArray
        });
      });
    }

    // Process BeforeWashSpecs from ALL sheets
    washingSpecsData.forEach((sheetData) => {
      if (sheetData && sheetData.rows) {
        sheetData.rows.forEach((row, rowIndex) => {
          const specsArray = [];
          sheetData.headers.forEach((header, headerIndex) => {
            const specData = row.specs[header.size]["Before Washing"];
            if (specData) {
              specsArray.push({
                index: headerIndex + 1,
                size: header.size,
                // Save BOTH fraction and decimal for the spec value
                fraction: specData.raw,
                decimal: specData.decimal
              });
            }
          });

          beforeWashSpecs.push({
            no: rowIndex + 1,
            kValue: sheetData.sheetName,
            MeasurementPointEngName: row["Measurement Point - Eng"],
            MeasurementPointChiName: row["Measurement Point - Chi"],
            // Save the full object for TolMinus and TolPlus
            TolMinus: {
              fraction: row["Tol Minus"].raw,
              decimal: row["Tol Minus"].decimal
            },
            TolPlus: {
              fraction: row["Tol Plus"].raw,
              decimal: row["Tol Plus"].decimal
            },
            Specs: specsArray
          });
        });
      }
    });

    // --- UPDATE DATABASE ---
    const updateResult = await collection.updateOne(
      { _id: orderDocument._id },
      {
        $set: {
          AfterWashSpecs: afterWashSpecs,
          BeforeWashSpecs: beforeWashSpecs
        }
      }
    );

    if (updateResult.modifiedCount === 0 && updateResult.matchedCount > 0) {
      return res
        .status(200)
        .json({ message: "Washing specs data is already up to date." });
    }

    res.status(200).json({
      message: `Successfully updated washing specs for MO No '${moNo}'.`
    });
  } catch (error) {
    console.error("Error saving washing specs:", error);
    res.status(500).json({
      message: "An internal server error occurred while saving the data."
    });
  }
};

// NEW: Get Orders with Uploaded Specs (Table View)
export const getUploadedSpecsOrders = async (req, res) => {
  const { page = 1, limit = 10, moNo } = req.query;
  const skip = (page - 1) * limit;

  try {
    const collection = ymProdConnection.db.collection("dt_orders");

    // Filter: Only orders that have EITHER BeforeWashSpecs OR AfterWashSpecs populated
    const query = {
      $or: [
        { BeforeWashSpecs: { $exists: true, $not: { $size: 0 } } },
        { AfterWashSpecs: { $exists: true, $not: { $size: 0 } } }
      ]
    };

    // Optional: Filter by specific MO No if provided
    if (moNo) {
      query.Order_No = { $regex: new RegExp(moNo, "i") };
    }

    const totalRecords = await collection.countDocuments(query);

    const orders = await collection
      .find(query)
      .sort({ updatedAt: -1 }) // Show recently updated first
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .project({
        Order_No: 1,
        CustStyle: 1,
        TotalQty: 1,
        OrderColors: 1,
        BeforeWashSpecs: 1,
        AfterWashSpecs: 1
      })
      .toArray();

    // --- DATA TRANSFORMATION LOGIC ---
    const tableData = orders.map((order) => {
      // 1. Colors Logic
      const colorList = order.OrderColors
        ? [...new Set(order.OrderColors.map((c) => c.Color))].filter(Boolean)
        : [];
      const totalColors = colorList.length;
      const colorsDisplay =
        colorList.slice(0, 2).join(", ") +
        (colorList.length > 2 ? ", ..." : "");

      // 2. All Sizes Logic
      const sizeSet = new Set();
      if (order.OrderColors) {
        order.OrderColors.forEach((color) => {
          if (color.OrderQty) {
            color.OrderQty.forEach((qtyObj) => {
              Object.keys(qtyObj).forEach((size) => sizeSet.add(size));
            });
          }
        });
      }
      const totalSizes = sizeSet.size;

      // 3. B/W Spec Issues Logic
      let bwIssues = 0;
      let bwNoField = 0;

      if (order.BeforeWashSpecs && Array.isArray(order.BeforeWashSpecs)) {
        order.BeforeWashSpecs.forEach((row) => {
          if (row.Specs && Array.isArray(row.Specs)) {
            row.Specs.forEach((spec) => {
              const fractionVal = spec.fraction
                ? String(spec.fraction).trim()
                : "";
              const isDecimalNull =
                spec.decimal === null || spec.decimal === undefined;

              // Logic: Count as issue ONLY if fraction exists BUT decimal is missing
              if (fractionVal !== "" && isDecimalNull) {
                bwIssues++;
              }

              // Check for completely missing field (structure issue)
              if (!Object.prototype.hasOwnProperty.call(spec, "decimal")) {
                bwNoField++;
              }
            });
          }
        });
      }

      // 4. A/W Spec Issues Logic
      let awIssues = 0;
      let awNoField = 0;

      if (order.AfterWashSpecs && Array.isArray(order.AfterWashSpecs)) {
        order.AfterWashSpecs.forEach((row) => {
          if (row.Specs && Array.isArray(row.Specs)) {
            row.Specs.forEach((spec) => {
              const fractionVal = spec.fraction
                ? String(spec.fraction).trim()
                : "";
              const isDecimalNull =
                spec.decimal === null || spec.decimal === undefined;

              // Logic: Count as issue ONLY if fraction exists BUT decimal is missing
              if (fractionVal !== "" && isDecimalNull) {
                awIssues++;
              }

              // Check for completely missing field
              if (!Object.prototype.hasOwnProperty.call(spec, "decimal")) {
                awNoField++;
              }
            });
          }
        });
      }

      return {
        _id: order._id,
        moNo: order.Order_No,
        custStyle: order.CustStyle || "N/A",
        totalQty: order.TotalQty || 0,
        totalColors: totalColors,
        colors: colorsDisplay,
        totalSizes: totalSizes,
        bwIssues: bwIssues,
        bwNoField: bwNoField,
        awIssues: awIssues,
        awNoField: awNoField
      };
    });

    res.json({
      data: tableData,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching uploaded specs orders:", error);
    res.status(500).json({ error: "Failed to fetch data." });
  }
};

/**
 * Helper to convert fraction string to decimal (mirrors frontend logic)
 */
const fractionToDecimalBackend = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  // Normalize: replace special fraction slash and collapse multiple spaces
  const strValue = String(value).trim().replace(/⁄/g, "/").replace(/\s+/g, " ");

  let total = 0;

  try {
    // Mixed fraction (e.g., "23 3/8")
    if (strValue.includes(" ") && strValue.includes("/")) {
      const parts = strValue.split(" ");
      const whole = parseFloat(parts[0]);
      const fractionParts = parts[1].split("/");
      const numerator = parseFloat(fractionParts[0]);
      const denominator = parseFloat(fractionParts[1]);

      if (
        isNaN(whole) ||
        isNaN(numerator) ||
        isNaN(denominator) ||
        denominator === 0
      )
        return null;
      total = whole + (Math.sign(whole) || 1) * (numerator / denominator);
    }
    // Simple fraction (e.g., "1/2")
    else if (strValue.includes("/")) {
      const fractionParts = strValue.split("/");
      const numerator = parseFloat(fractionParts[0]);
      const denominator = parseFloat(fractionParts[1]);

      if (isNaN(numerator) || isNaN(denominator) || denominator === 0)
        return null;
      total = numerator / denominator;
    }
    // Regular number
    else {
      total = parseFloat(strValue);
    }

    return isNaN(total) ? null : parseFloat(total.toFixed(4));
  } catch (e) {
    return null;
  }
};

// NEW: Fix Issues (Recalculate decimals for malformed strings)
export const fixWashingSpecsIssues = async (req, res) => {
  try {
    const collection = ymProdConnection.db.collection("dt_orders");

    // Find documents that MIGHT have issues (where Specs exists)
    // We will do the granular check in code to ensure safety
    const cursor = collection.find({
      $or: [
        { BeforeWashSpecs: { $exists: true, $not: { $size: 0 } } },
        { AfterWashSpecs: { $exists: true, $not: { $size: 0 } } }
      ]
    });

    let totalBwFixed = 0;
    let totalAwFixed = 0;
    let totalDecimalsInserted = 0;
    let modifiedDocCount = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      let isModified = false;

      // --- Fix Before Wash Specs ---
      if (doc.BeforeWashSpecs && Array.isArray(doc.BeforeWashSpecs)) {
        doc.BeforeWashSpecs.forEach((row) => {
          if (row.Specs && Array.isArray(row.Specs)) {
            row.Specs.forEach((spec) => {
              // CONDITION: Fraction exists (not empty) BUT Decimal is NULL/Undefined
              const fractionVal = spec.fraction
                ? String(spec.fraction).trim()
                : "";
              const isDecimalNull =
                spec.decimal === null || spec.decimal === undefined;

              if (fractionVal !== "" && isDecimalNull) {
                // Attempt to fix
                const newDecimal = fractionToDecimalBackend(fractionVal);

                if (newDecimal !== null) {
                  // Update the object
                  spec.decimal = newDecimal;
                  // Normalize the fraction string (remove double spaces) in DB too
                  spec.fraction = fractionVal
                    .replace(/⁄/g, "/")
                    .replace(/\s+/g, " ");

                  totalBwFixed++;
                  totalDecimalsInserted++;
                  isModified = true;
                }
              }
            });
          }
        });
      }

      // --- Fix After Wash Specs ---
      if (doc.AfterWashSpecs && Array.isArray(doc.AfterWashSpecs)) {
        doc.AfterWashSpecs.forEach((row) => {
          if (row.Specs && Array.isArray(row.Specs)) {
            row.Specs.forEach((spec) => {
              // CONDITION: Fraction exists (not empty) BUT Decimal is NULL/Undefined
              const fractionVal = spec.fraction
                ? String(spec.fraction).trim()
                : "";
              const isDecimalNull =
                spec.decimal === null || spec.decimal === undefined;

              if (fractionVal !== "" && isDecimalNull) {
                // Attempt to fix
                const newDecimal = fractionToDecimalBackend(fractionVal);

                if (newDecimal !== null) {
                  // Update the object
                  spec.decimal = newDecimal;
                  // Normalize the fraction string
                  spec.fraction = fractionVal
                    .replace(/⁄/g, "/")
                    .replace(/\s+/g, " ");

                  totalAwFixed++;
                  totalDecimalsInserted++;
                  isModified = true;
                }
              }
            });
          }
        });
      }

      // Only update DB if changes were made to this document
      if (isModified) {
        await collection.updateOne(
          { _id: doc._id },
          {
            $set: {
              BeforeWashSpecs: doc.BeforeWashSpecs,
              AfterWashSpecs: doc.AfterWashSpecs
            }
          }
        );
        modifiedDocCount++;
      }
    }

    res.json({
      success: true,
      message: "Fix process completed.",
      stats: {
        totalBwIssuesFixed: totalBwFixed,
        totalAwIssuesFixed: totalAwFixed,
        totalDecimalsInserted: totalDecimalsInserted,
        documentsUpdated: modifiedDocCount
      }
    });
  } catch (error) {
    console.error("Error fixing washing specs:", error);
    res.status(500).json({ error: "Failed to fix data." });
  }
};

/**
 * NEW: Fix TOL Issues (Recalculate decimals for TolMinus/TolPlus)
 */
export const fixTolIssues = async (req, res) => {
  try {
    const collection = ymProdConnection.db.collection("dt_orders");

    // Find documents that have BeforeWashSpecs OR AfterWashSpecs
    const cursor = collection.find({
      $or: [
        { BeforeWashSpecs: { $exists: true, $not: { $size: 0 } } },
        { AfterWashSpecs: { $exists: true, $not: { $size: 0 } } }
      ]
    });

    let totalBwTolFixed = 0;
    let totalAwTolFixed = 0;
    let totalDecimalsInserted = 0;
    let modifiedDocCount = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      let isModified = false;

      // Helper to fix a single Tolerance Object
      const fixToleranceObject = (tolObj) => {
        let fixed = false;
        // Check if fraction exists but decimal is null/undefined
        const fractionVal = tolObj.fraction
          ? String(tolObj.fraction).trim()
          : "";
        const isDecimalNull =
          tolObj.decimal === null || tolObj.decimal === undefined;

        if (fractionVal !== "" && isDecimalNull) {
          // Normalize Fraction String (Remove double spaces, fix slash)
          // e.g. "-  1/2" -> "-1/2", "1  1/2" -> "1 1/2"
          let cleanedFraction = fractionVal
            .replace(/⁄/g, "/")
            .replace(/\s+/g, " ");

          // Specific fix for negative sign spacing: "- 1/2" -> "-1/2"
          cleanedFraction = cleanedFraction.replace(/-\s+/, "-");

          // Calculate Decimal
          const newDecimal = fractionToDecimalBackend(cleanedFraction);

          if (newDecimal !== null) {
            tolObj.decimal = newDecimal;
            tolObj.fraction = cleanedFraction; // Save clean string
            fixed = true;
          }
        }
        return fixed;
      };

      // --- Fix Before Wash Specs ---
      if (doc.BeforeWashSpecs && Array.isArray(doc.BeforeWashSpecs)) {
        doc.BeforeWashSpecs.forEach((row) => {
          if (row.TolMinus && fixToleranceObject(row.TolMinus)) {
            totalBwTolFixed++;
            totalDecimalsInserted++;
            isModified = true;
          }
          if (row.TolPlus && fixToleranceObject(row.TolPlus)) {
            totalBwTolFixed++;
            totalDecimalsInserted++;
            isModified = true;
          }
        });
      }

      // --- Fix After Wash Specs ---
      if (doc.AfterWashSpecs && Array.isArray(doc.AfterWashSpecs)) {
        doc.AfterWashSpecs.forEach((row) => {
          if (row.TolMinus && fixToleranceObject(row.TolMinus)) {
            totalAwTolFixed++;
            totalDecimalsInserted++;
            isModified = true;
          }
          if (row.TolPlus && fixToleranceObject(row.TolPlus)) {
            totalAwTolFixed++;
            totalDecimalsInserted++;
            isModified = true;
          }
        });
      }

      // Only update DB if changes were made
      if (isModified) {
        await collection.updateOne(
          { _id: doc._id },
          {
            $set: {
              BeforeWashSpecs: doc.BeforeWashSpecs,
              AfterWashSpecs: doc.AfterWashSpecs
            }
          }
        );
        modifiedDocCount++;
      }
    }

    res.json({
      success: true,
      message: "TOL Fix process completed.",
      stats: {
        totalBwTolFixed,
        totalAwTolFixed,
        totalDecimalsInserted,
        documentsUpdated: modifiedDocCount
      }
    });
  } catch (error) {
    console.error("Error fixing TOL specs:", error);
    res.status(500).json({ error: "Failed to fix TOL data." });
  }
};
