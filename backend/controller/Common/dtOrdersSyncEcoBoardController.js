import {
  ymProdConnection,
  ymEcoConnection,
} from "../MongoDB/dbConnectionController.js";

/**
 * Normalize fraction string - replace special Unicode characters
 * e.g., '-3⁄8' -> '-3/8'
 */
const normalizeFraction = (fractionStr) => {
  if (fractionStr === null || fractionStr === undefined) return null;
  if (typeof fractionStr === "number") return String(fractionStr);

  return String(fractionStr)
    .replace(/⁄/g, "/") // Replace special fraction slash (Unicode U+2044)
    .replace(/\u2044/g, "/") // Another fraction slash character
    .trim();
};

/**
 * Process Tolerance/Shrinkage object - normalize fraction
 */
const processToleranceObject = (tolObj) => {
  if (!tolObj) {
    return { fraction: "0", decimal: 0 };
  }

  return {
    fraction: normalizeFraction(tolObj.fraction) || "0",
    decimal: typeof tolObj.decimal === "number" ? tolObj.decimal : 0,
  };
};

/**
 * Process Specs array - normalize fractions in each spec
 */
const processSpecsArray = (specsArray) => {
  if (!specsArray || !Array.isArray(specsArray)) return [];

  return specsArray.map((spec) => ({
    index: spec.index,
    size: spec.size,
    fraction: normalizeFraction(spec.fraction),
    decimal: spec.decimal,
  }));
};

/**
 * Transform SizeSpec item to AfterWashSpecs format
 * Only used when AfterWashSpecs is empty
 *
 * Mapping:
 * - EnglishRemark -> MeasurementPointEngName
 * - ChineseName -> MeasurementPointChiName
 * - ToleranceMinus -> TolMinus
 * - TolerancePlus -> TolPlus
 * - Shrinkage -> { fraction: "0", decimal: 0 } (new field, doesn't exist in SizeSpec)
 * - Specs -> transformed to [{index, size, fraction, decimal}] format
 */
const transformSizeSpecToAfterWashSpec = (sizeSpec, index, sizeList) => {
  const no = index + 1;
  const kValue = "NA";

  // Transform Specs array from SizeSpec format to AfterWashSpecs format
  // SizeSpec.Specs: [{"2XS": {fraction, decimal}}, {"XS": {fraction, decimal}}, ...]
  // AfterWashSpecs.Specs: [{index, size, fraction, decimal}, ...]
  const transformedSpecs = [];

  if (sizeSpec.Specs && Array.isArray(sizeSpec.Specs)) {
    sizeSpec.Specs.forEach((specObj, specIndex) => {
      // Each specObj is like {"2XS": {fraction: "6 1⁄8", decimal: 6.125}}
      const sizeName = Object.keys(specObj).find(
        (key) => !key.startsWith("$") && key !== "_id",
      );
      if (sizeName) {
        const specValue = specObj[sizeName];
        transformedSpecs.push({
          index: specIndex + 1,
          size: sizeName,
          fraction: specValue ? normalizeFraction(specValue.fraction) : null,
          decimal: specValue ? specValue.decimal : null,
        });
      }
    });
  }

  // If Specs is empty but we have SizeList, create empty specs for each size
  if (transformedSpecs.length === 0 && sizeList && Array.isArray(sizeList)) {
    sizeList.forEach((size, idx) => {
      transformedSpecs.push({
        index: idx + 1,
        size: size,
        fraction: null,
        decimal: null,
      });
    });
  }

  return {
    no: no,
    kValue: kValue,
    MeasurementPointEngName: sizeSpec.EnglishRemark || "",
    MeasurementPointChiName: sizeSpec.ChineseName || "",
    TolMinus: processToleranceObject(sizeSpec.ToleranceMinus),
    TolPlus: processToleranceObject(sizeSpec.TolerancePlus),
    Shrinkage: {
      fraction: "0",
      decimal: 0,
    },
    Specs: transformedSpecs,
    unique_no: `${no}-${kValue}`,
  };
};

/**
 * Process existing AfterWashSpecs array
 * - Add unique_no field
 * - Normalize fractions
 * - Keep structure exactly the same
 */
const processAfterWashSpecs = (specsArray) => {
  if (!specsArray || !Array.isArray(specsArray)) return [];

  return specsArray.map((spec) => {
    const no = spec.no || 0;
    const kValue = spec.kValue || "NA";

    return {
      no: no,
      kValue: kValue,
      MeasurementPointEngName: spec.MeasurementPointEngName || "",
      MeasurementPointChiName: spec.MeasurementPointChiName || "",
      TolMinus: processToleranceObject(spec.TolMinus),
      TolPlus: processToleranceObject(spec.TolPlus),
      Shrinkage: processToleranceObject(spec.Shrinkage),
      Specs: processSpecsArray(spec.Specs),
      unique_no: `${no}-${kValue}`,
    };
  });
};

/**
 * Process existing BeforeWashSpecs array
 * - Add unique_no field
 * - Normalize fractions
 * - Keep structure exactly the same
 */
const processBeforeWashSpecs = (specsArray) => {
  if (!specsArray || !Array.isArray(specsArray)) return [];

  return specsArray.map((spec) => {
    const no = spec.no || 0;
    const kValue = spec.kValue || "NA";

    return {
      no: no,
      kValue: kValue,
      MeasurementPointEngName: spec.MeasurementPointEngName || "",
      MeasurementPointChiName: spec.MeasurementPointChiName || "",
      TolMinus: processToleranceObject(spec.TolMinus),
      TolPlus: processToleranceObject(spec.TolPlus),
      Shrinkage: processToleranceObject(spec.Shrinkage),
      Specs: processSpecsArray(spec.Specs),
      unique_no: `${no}-${kValue}`,
    };
  });
};

/**
 * Transform a single document for sync
 * PRESERVES the original _id from source collection
 */
const transformDocument = (doc) => {
  // Create a copy of the document - spread operator for shallow copy
  const transformedDoc = { ...doc };

  // Convert _id if it's an object (from BSON)
  if (doc._id) {
    transformedDoc._id = doc._id;
  }

  // Track if we created AfterWashSpecs from SizeSpec
  let createdFromSizeSpec = false;

  // Check if AfterWashSpecs has data
  const hasAfterWashSpecs =
    doc.AfterWashSpecs &&
    Array.isArray(doc.AfterWashSpecs) &&
    doc.AfterWashSpecs.length > 0;

  if (hasAfterWashSpecs) {
    // AfterWashSpecs already has data - just add unique_no and normalize fractions
    transformedDoc.AfterWashSpecs = processAfterWashSpecs(doc.AfterWashSpecs);
  } else {
    // AfterWashSpecs is empty or doesn't exist - create from SizeSpec if available
    if (
      doc.SizeSpec &&
      Array.isArray(doc.SizeSpec) &&
      doc.SizeSpec.length > 0
    ) {
      transformedDoc.AfterWashSpecs = doc.SizeSpec.map((sizeSpec, index) =>
        transformSizeSpecToAfterWashSpec(sizeSpec, index, doc.SizeList),
      );
      createdFromSizeSpec = true;
    } else {
      transformedDoc.AfterWashSpecs = [];
    }
  }

  // Check if BeforeWashSpecs has data
  const hasBeforeWashSpecs =
    doc.BeforeWashSpecs &&
    Array.isArray(doc.BeforeWashSpecs) &&
    doc.BeforeWashSpecs.length > 0;

  if (hasBeforeWashSpecs) {
    // BeforeWashSpecs has data - add unique_no and normalize fractions
    transformedDoc.BeforeWashSpecs = processBeforeWashSpecs(
      doc.BeforeWashSpecs,
    );
  } else {
    transformedDoc.BeforeWashSpecs = [];
  }

  // Add sync metadata
  transformedDoc.syncedAt = new Date();
  transformedDoc.syncSource = "dt_orders";

  return { transformedDoc, createdFromSizeSpec };
};

/**
 * Full Load - Copy all dt_orders to dt_orders_sync
 * PRESERVES original _id from source collection
 * This runs on server startup
 */
export const runFullLoad = async () => {
  console.log("\n" + "=".repeat(70));
  console.log(
    "🔄 FULL LOAD SYNC: dt_orders (ym_prod) -> dt_orders_sync (ym_eco_board)",
  );
  console.log("   📝 Note: Preserving original _id from source collection");
  console.log(
    "   📝 Note: Adding unique_no field to AfterWashSpecs and BeforeWashSpecs",
  );
  console.log("=".repeat(70) + "\n");

  const startTime = Date.now();

  try {
    // Wait for connections to be ready
    if (ymProdConnection.readyState !== 1) {
      console.log("⏳ Waiting for ym_prod connection...");
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Connection timeout")),
          30000,
        );
        ymProdConnection.once("connected", () => {
          clearTimeout(timeout);
          resolve();
        });
        ymProdConnection.once("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }

    if (ymEcoConnection.readyState !== 1) {
      console.log("⏳ Waiting for ym_eco_board connection...");
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Connection timeout")),
          30000,
        );
        ymEcoConnection.once("connected", () => {
          clearTimeout(timeout);
          resolve();
        });
        ymEcoConnection.once("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }

    const sourceCollection = ymProdConnection.db.collection("dt_orders");
    const targetCollection = ymEcoConnection.db.collection("dt_orders_sync");

    // Get total count
    const totalCount = await sourceCollection.countDocuments();
    console.log(`📊 Total documents to sync: ${totalCount}`);

    if (totalCount === 0) {
      console.log("⚠️ No documents found in dt_orders. Nothing to sync.");
      return {
        success: true,
        message: "No documents to sync",
        totalCount: 0,
        successCount: 0,
        errorCount: 0,
        createdFromSizeSpec: 0,
        duration: `${Date.now() - startTime}ms`,
      };
    }

    // Clear existing data in target collection (for full load)
    const deleteResult = await targetCollection.deleteMany({});
    console.log(
      `🗑️  Cleared ${deleteResult.deletedCount} existing documents in dt_orders_sync`,
    );

    // Process in batches for better performance
    const batchSize = 100;
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let createdFromSizeSpecCount = 0;
    let duplicateIdCount = 0;
    const errorLogs = [];

    const cursor = sourceCollection.find({});
    let batch = [];

    console.log("\n📦 Processing documents...\n");

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      try {
        // Transform the document (preserves _id, adds unique_no)
        const { transformedDoc, createdFromSizeSpec } = transformDocument(doc);

        if (createdFromSizeSpec) {
          createdFromSizeSpecCount++;
        }

        batch.push(transformedDoc);

        if (batch.length >= batchSize) {
          try {
            // Use ordered: false to continue on duplicate key errors
            await targetCollection.insertMany(batch, { ordered: false });
            successCount += batch.length;
          } catch (bulkError) {
            // Handle bulk write errors (e.g., duplicate _id)
            if (bulkError.code === 11000 || bulkError.writeErrors) {
              const insertedCount =
                bulkError.result?.nInserted ||
                bulkError.insertedCount ||
                batch.length - (bulkError.writeErrors?.length || 0);
              successCount += insertedCount;
              duplicateIdCount += batch.length - insertedCount;
              console.log(
                `\n   ⚠️ Batch had ${batch.length - insertedCount} duplicate _id(s)`,
              );
            } else {
              throw bulkError;
            }
          }

          processedCount += batch.length;

          // Progress indicator
          const progress = ((processedCount / totalCount) * 100).toFixed(1);
          process.stdout.write(
            `\r   ✅ Progress: ${processedCount}/${totalCount} (${progress}%)`,
          );

          batch = [];
        }
      } catch (error) {
        console.error(
          `\n   ❌ Error processing ${doc.Order_No}: ${error.message}`,
        );
        errorLogs.push({
          orderNo: doc.Order_No,
          _id: doc._id?.toString(),
          error: error.message,
        });
        errorCount++;
        processedCount++;
      }
    }

    // Insert remaining documents
    if (batch.length > 0) {
      try {
        await targetCollection.insertMany(batch, { ordered: false });
        successCount += batch.length;
        processedCount += batch.length;
      } catch (bulkError) {
        if (bulkError.code === 11000 || bulkError.writeErrors) {
          const insertedCount =
            bulkError.result?.nInserted ||
            bulkError.insertedCount ||
            batch.length - (bulkError.writeErrors?.length || 0);
          successCount += insertedCount;
          duplicateIdCount += batch.length - insertedCount;
        } else {
          console.error(`\n   ❌ Error in final batch: ${bulkError.message}`);
          errorCount += batch.length;
        }
        processedCount += batch.length;
      }
    }

    const duration = Date.now() - startTime;

    // Verify sync by checking a sample document
    const sampleSource = await sourceCollection.findOne({});
    const sampleTarget = sampleSource
      ? await targetCollection.findOne({ _id: sampleSource._id })
      : null;
    const idPreserved = sampleTarget
      ? sampleSource._id.equals(sampleTarget._id)
      : false;

    // Check if unique_no was added
    const uniqueNoAdded =
      sampleTarget?.AfterWashSpecs?.[0]?.unique_no !== undefined ||
      sampleTarget?.BeforeWashSpecs?.[0]?.unique_no !== undefined;

    console.log("\n\n" + "=".repeat(70));
    console.log("🎉 FULL LOAD COMPLETE!");
    console.log("=".repeat(70));
    console.log(`   📊 Total Documents:     ${totalCount}`);
    console.log(`   ✅ Successfully Synced: ${successCount}`);
    console.log(`   ❌ Errors:              ${errorCount}`);
    console.log(`   ⚠️  Duplicate _ids:      ${duplicateIdCount}`);
    console.log(
      `   📝 AfterWashSpecs created from SizeSpec: ${createdFromSizeSpecCount}`,
    );
    console.log(
      `   🔑 Original _id preserved: ${idPreserved ? "YES ✓" : "NO ✗"}`,
    );
    console.log(
      `   🏷️  unique_no field added: ${uniqueNoAdded ? "YES ✓" : "NO ✗"}`,
    );
    console.log(`   ⏱️  Duration:            ${(duration / 1000).toFixed(2)}s`);
    console.log("=".repeat(70) + "\n");

    // Log sample unique_no values
    if (sampleTarget) {
      console.log("📋 Sample unique_no values:");
      if (sampleTarget.AfterWashSpecs?.length > 0) {
        console.log(
          `   AfterWashSpecs[0].unique_no: "${sampleTarget.AfterWashSpecs[0].unique_no}"`,
        );
      }
      if (sampleTarget.BeforeWashSpecs?.length > 0) {
        console.log(
          `   BeforeWashSpecs[0].unique_no: "${sampleTarget.BeforeWashSpecs[0].unique_no}"`,
        );
        if (sampleTarget.BeforeWashSpecs.length > 23) {
          console.log(
            `   BeforeWashSpecs[23].unique_no: "${sampleTarget.BeforeWashSpecs[23].unique_no}" (K2 example)`,
          );
        }
      }
    }

    // Log errors if any
    if (errorLogs.length > 0) {
      console.log("\n📋 Error Details:");
      errorLogs.slice(0, 10).forEach((log) => {
        console.log(`   - ${log.orderNo} (_id: ${log._id}): ${log.error}`);
      });
      if (errorLogs.length > 10) {
        console.log(`   ... and ${errorLogs.length - 10} more errors`);
      }
    }

    return {
      success: true,
      message: "Full load completed",
      totalCount,
      successCount,
      errorCount,
      duplicateIdCount,
      createdFromSizeSpec: createdFromSizeSpecCount,
      idPreserved,
      uniqueNoAdded,
      duration: `${(duration / 1000).toFixed(2)}s`,
    };
  } catch (error) {
    console.error("\n❌ FULL LOAD FAILED:", error);
    throw error;
  }
};

/**
 * API endpoint to trigger full load manually
 */
export const triggerFullLoad = async (req, res) => {
  try {
    console.log("\n🔧 Manual Full Load triggered via API");
    const result = await runFullLoad();
    res.json(result);
  } catch (error) {
    console.error("Error in manual full load:", error);
    res.status(500).json({
      success: false,
      error: "Failed to run full load",
      details: error.message,
    });
  }
};

/**
 * Get sync status - compare counts between source and target
 */
export const getSyncStatus = async (req, res) => {
  try {
    const sourceCollection = ymProdConnection.db.collection("dt_orders");
    const targetCollection = ymEcoConnection.db.collection("dt_orders_sync");

    const sourceCount = await sourceCollection.countDocuments();
    const targetCount = await targetCollection.countDocuments();

    // Count documents with AfterWashSpecs
    const withAfterWashSpecs = await targetCollection.countDocuments({
      AfterWashSpecs: { $exists: true, $not: { $size: 0 } },
    });

    // Count documents with BeforeWashSpecs
    const withBeforeWashSpecs = await targetCollection.countDocuments({
      BeforeWashSpecs: { $exists: true, $not: { $size: 0 } },
    });

    // Count documents with unique_no in AfterWashSpecs
    const withUniqueNo = await targetCollection.countDocuments({
      "AfterWashSpecs.unique_no": { $exists: true },
    });

    // Verify _id preservation by checking a random sample
    const sampleSource = await sourceCollection.findOne({});
    let idVerification = null;

    if (sampleSource) {
      const sampleTarget = await targetCollection.findOne({
        _id: sampleSource._id,
      });
      idVerification = {
        sourceId: sampleSource._id.toString(),
        targetId: sampleTarget?._id?.toString() || null,
        orderNo: sampleSource.Order_No,
        isPreserved: sampleTarget
          ? sampleSource._id.equals(sampleTarget._id)
          : false,
        hasUniqueNo: sampleTarget?.AfterWashSpecs?.[0]?.unique_no !== undefined,
      };
    }

    res.json({
      source: {
        database: "ym_prod",
        collection: "dt_orders",
        count: sourceCount,
      },
      target: {
        database: "ym_eco_board",
        collection: "dt_orders_sync",
        count: targetCount,
      },
      status: {
        isSynced: sourceCount === targetCount,
        difference: sourceCount - targetCount,
        withAfterWashSpecs,
        withBeforeWashSpecs,
        withUniqueNo,
      },
      idVerification,
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get sync status",
      details: error.message,
    });
  }
};

/**
 * Get a sample synced document for verification
 */
export const getSampleSyncedDocument = async (req, res) => {
  try {
    const { orderNo } = req.params;
    const targetCollection = ymEcoConnection.db.collection("dt_orders_sync");
    const sourceCollection = ymProdConnection.db.collection("dt_orders");

    let query = {};
    if (orderNo) {
      query.Order_No = orderNo;
    }

    const targetDoc = await targetCollection.findOne(query);

    if (!targetDoc) {
      return res.status(404).json({
        success: false,
        error: "No document found in sync collection",
      });
    }

    // Also fetch from source to verify _id match
    const sourceDoc = await sourceCollection.findOne({ _id: targetDoc._id });

    // Return detailed information
    res.json({
      success: true,
      idVerification: {
        targetId: targetDoc._id.toString(),
        sourceId: sourceDoc?._id?.toString() || null,
        isMatch: sourceDoc ? targetDoc._id.equals(sourceDoc._id) : false,
      },
      Order_No: targetDoc.Order_No,
      CustStyle: targetDoc.CustStyle,
      Factory: targetDoc.Factory,
      syncedAt: targetDoc.syncedAt,
      syncSource: targetDoc.syncSource,
      AfterWashSpecs: {
        count: targetDoc.AfterWashSpecs?.length || 0,
        sample: targetDoc.AfterWashSpecs?.slice(0, 2) || [],
        uniqueNoExamples:
          targetDoc.AfterWashSpecs?.slice(0, 3).map((s) => s.unique_no) || [],
      },
      BeforeWashSpecs: {
        count: targetDoc.BeforeWashSpecs?.length || 0,
        sample: targetDoc.BeforeWashSpecs?.slice(0, 2) || [],
        uniqueNoExamples:
          targetDoc.BeforeWashSpecs?.slice(0, 5).map((s) => s.unique_no) || [],
        // Show K2 examples if they exist
        k2Examples:
          targetDoc.BeforeWashSpecs?.filter((s) => s.kValue === "K2")
            ?.slice(0, 2)
            .map((s) => s.unique_no) || [],
      },
      SizeSpec: {
        count: targetDoc.SizeSpec?.length || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get sample document",
      details: error.message,
    });
  }
};

/**
 * Verify _id preservation for multiple documents
 */
export const verifyIdPreservation = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const sourceCollection = ymProdConnection.db.collection("dt_orders");
    const targetCollection = ymEcoConnection.db.collection("dt_orders_sync");

    // Get sample documents from source
    const sourceDocs = await sourceCollection
      .find({})
      .limit(parseInt(limit))
      .toArray();

    const verificationResults = [];
    let matchCount = 0;
    let mismatchCount = 0;
    let uniqueNoCount = 0;

    for (const sourceDoc of sourceDocs) {
      const targetDoc = await targetCollection.findOne({ _id: sourceDoc._id });

      const isMatch = targetDoc && sourceDoc._id.equals(targetDoc._id);
      const hasUniqueNo =
        targetDoc?.AfterWashSpecs?.[0]?.unique_no !== undefined ||
        targetDoc?.BeforeWashSpecs?.[0]?.unique_no !== undefined;

      if (isMatch) matchCount++;
      else mismatchCount++;

      if (hasUniqueNo) uniqueNoCount++;

      verificationResults.push({
        orderNo: sourceDoc.Order_No,
        sourceId: sourceDoc._id.toString(),
        targetId: targetDoc?._id?.toString() || "NOT FOUND",
        isMatch,
        hasUniqueNo,
        sampleUniqueNo:
          targetDoc?.AfterWashSpecs?.[0]?.unique_no ||
          targetDoc?.BeforeWashSpecs?.[0]?.unique_no ||
          null,
      });
    }

    res.json({
      success: true,
      summary: {
        totalChecked: sourceDocs.length,
        matched: matchCount,
        mismatched: mismatchCount,
        withUniqueNo: uniqueNoCount,
        preservationRate: `${((matchCount / sourceDocs.length) * 100).toFixed(2)}%`,
      },
      details: verificationResults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to verify _id preservation",
      details: error.message,
    });
  }
};

/**
 * Initialize sync on server startup
 * This function should be called after DB connections are established
 */
export const initializeSyncOnStartup = async () => {
  try {
    console.log("\n🚀 Initializing dt_orders sync on startup...");
    console.log("   📝 Original _id from dt_orders will be preserved");
    console.log(
      "   📝 unique_no field will be added to AfterWashSpecs and BeforeWashSpecs",
    );

    // Small delay to ensure connections are fully established
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await runFullLoad();
  } catch (error) {
    console.error("❌ Failed to initialize sync on startup:", error);
    // Don't throw - let the server continue running
  }
};
