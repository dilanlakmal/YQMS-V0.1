import {
  QASectionsMeasurementSpecs,
  FincheckInspectionReports,
} from "../../MongoDB/dbConnectionController.js";

// =========================================================================
// SEARCH FINCHECK ORDERS
// =========================================================================

/**
 * Search fincheck orders by order number string
 * Returns distinct orderNosString values with their report counts
 */
export const searchFincheckOrders = async (req, res) => {
  const { searchTerm } = req.query;

  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(200).json({
        success: true,
        orders: [],
        message: "Please enter at least 2 characters to search",
      });
    }

    const cleanTerm = searchTerm.trim();

    // Use aggregation to get distinct orders
    const orders = await FincheckInspectionReports.aggregate([
      {
        $match: {
          $or: [
            { orderNosString: { $regex: cleanTerm, $options: "i" } },
            { orderNos: { $elemMatch: { $regex: cleanTerm, $options: "i" } } },
          ],
        },
      },
      {
        $group: {
          _id: "$orderNosString",
          reportIds: { $push: "$reportId" },
          count: { $sum: 1 },
          latestDate: { $max: "$createdAt" },
          statuses: { $addToSet: "$status" },
        },
      },
      { $sort: { latestDate: -1 } },
      { $limit: 50 },
    ]);

    const formattedOrders = orders.map((o) => ({
      orderNo: o._id,
      reportCount: o.count,
      reportIds: o.reportIds.filter((id) => id != null).sort((a, b) => b - a),
      statuses: o.statuses,
    }));

    res.status(200).json({
      success: true,
      orders: formattedOrders,
      totalFound: formattedOrders.length,
    });
  } catch (error) {
    console.error("[searchFincheckOrders] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =========================================================================
// ANALYZE ORDER MEASUREMENTS - Extract IDs by Stage and K-Value
// =========================================================================

/**
 * Analyzes all reports for an order and extracts measurement IDs
 * grouped by stage (After/Before) and kValue (for Before)
 */
const analyzeOrderMeasurements = async (orderNo) => {
  // Find all reports for this order
  const reports = await FincheckInspectionReports.find({
    $or: [
      { orderNosString: { $regex: new RegExp(`^${orderNo}$`, "i") } },
      { orderNosString: orderNo },
    ],
  })
    .select("reportId measurementData status createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const analysis = {
    orderNo,
    totalReports: reports.length,
    afterWash: {
      found: false,
      reportId: null,
      ids: [],
      idCount: 0,
    },
    beforeWash: {
      found: false,
      kValues: {}, // { K1: { reportId, ids: [] }, K2: { reportId, ids: [] } }
      kValueList: [],
    },
  };

  // Process each report
  for (const report of reports) {
    if (!report.measurementData || report.measurementData.length === 0) {
      continue;
    }

    for (const md of report.measurementData) {
      if (!md.allMeasurements || Object.keys(md.allMeasurements).length === 0) {
        continue;
      }

      const ids = Object.keys(md.allMeasurements);

      if (md.stage === "After") {
        // After Wash - take the first one found with most IDs
        if (
          !analysis.afterWash.found ||
          ids.length > analysis.afterWash.idCount
        ) {
          analysis.afterWash = {
            found: true,
            reportId: report.reportId,
            ids: ids,
            idCount: ids.length,
          };
        }
      } else if (md.stage === "Before") {
        // Before Wash - group by kValue
        const kValue = md.kValue || "NA";

        // Take the one with most IDs for each kValue
        if (
          !analysis.beforeWash.kValues[kValue] ||
          ids.length > analysis.beforeWash.kValues[kValue].ids.length
        ) {
          analysis.beforeWash.kValues[kValue] = {
            reportId: report.reportId,
            ids: ids,
            idCount: ids.length,
            size: md.size || "",
          };
        }
      }
    }
  }

  // Set found flag and kValue list for Before Wash
  const kValueKeys = Object.keys(analysis.beforeWash.kValues).sort();
  analysis.beforeWash.found = kValueKeys.length > 0;
  analysis.beforeWash.kValueList = kValueKeys;

  return analysis;
};

// =========================================================================
// PREVIEW MEASUREMENT ID MAPPING (Auto-analyze version)
// =========================================================================

/**
 * Preview how IDs will be mapped from fincheck reports to QA specs
 * Automatically finds IDs for After Wash and Before Wash (per kValue)
 */
export const previewMeasurementIdMapping = async (req, res) => {
  const { sourceOrderNo, targetOrderNo } = req.body;

  if (!sourceOrderNo || !targetOrderNo) {
    return res.status(400).json({
      message: "Source Order No and Target Order No are required.",
    });
  }

  try {
    // 1. Analyze the source order for measurement IDs
    const analysis = await analyzeOrderMeasurements(sourceOrderNo.trim());

    if (!analysis.afterWash.found && !analysis.beforeWash.found) {
      return res.status(404).json({
        message: `No measurement data found in any reports for order "${sourceOrderNo}". Please ensure reports have measurement data.`,
        analysis: {
          totalReports: analysis.totalReports,
          afterWashFound: false,
          beforeWashFound: false,
        },
      });
    }

    // 2. Get the QA sections record for target order
    const qaRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${targetOrderNo.trim()}$`, "i") },
    }).lean();

    if (!qaRecord) {
      return res.status(404).json({
        message: `No QA specs found for order: ${targetOrderNo}. Please save specs first.`,
      });
    }

    // 3. Build preview
    const preview = {
      sourceInfo: {
        orderNo: sourceOrderNo,
        totalReports: analysis.totalReports,
        afterWash: {
          found: analysis.afterWash.found,
          reportId: analysis.afterWash.reportId,
          idCount: analysis.afterWash.idCount,
        },
        beforeWash: {
          found: analysis.beforeWash.found,
          kValues: analysis.beforeWash.kValueList,
          kValueDetails: Object.entries(analysis.beforeWash.kValues).map(
            ([k, v]) => ({
              kValue: k,
              reportId: v.reportId,
              idCount: v.idCount,
            }),
          ),
        },
      },
      targetInfo: {
        orderNo: targetOrderNo,
      },
      mappings: {
        afterWash: [],
        beforeWash: [], // Will contain objects with kValue and mappings
      },
    };

    // === Process After Wash ===
    const allAWSpecs = qaRecord.AllAfterWashSpecs || [];
    const selectedAWSpecs = qaRecord.selectedAfterWashSpecs || [];

    if (analysis.afterWash.found && allAWSpecs.length > 0) {
      const awIds = analysis.afterWash.ids;

      // Sort by 'no' field to ensure correct order
      const sortedAWSpecs = [...allAWSpecs].sort(
        (a, b) => (a.no || 0) - (b.no || 0),
      );

      sortedAWSpecs.forEach((spec, idx) => {
        const newId = awIds[idx] || null;
        const isChanged = spec.id !== newId;

        preview.mappings.afterWash.push({
          no: spec.no,
          pointName: spec.MeasurementPointEngName || "",
          pointNameChi: spec.MeasurementPointChiName || "",
          oldId: spec.id || "N/A",
          newId: newId || "N/A",
          isChanged: isChanged,
          isSelected: selectedAWSpecs.some(
            (s) => s.MeasurementPointEngName === spec.MeasurementPointEngName,
          ),
        });
      });
    }

    // === Process Before Wash ===
    const allBWSpecs = qaRecord.AllBeforeWashSpecs || [];
    const selectedBWSpecs = qaRecord.selectedBeforeWashSpecs || [];

    if (analysis.beforeWash.found && allBWSpecs.length > 0) {
      // Group QA specs by kValue
      const qaKValueGroups = {};
      allBWSpecs.forEach((spec) => {
        const kVal = spec.kValue || "NA";
        if (!qaKValueGroups[kVal]) {
          qaKValueGroups[kVal] = [];
        }
        qaKValueGroups[kVal].push(spec);
      });

      // For each kValue in the analysis, create mappings
      for (const kValue of analysis.beforeWash.kValueList) {
        const sourceIds = analysis.beforeWash.kValues[kValue]?.ids || [];
        const qaSpecs = qaKValueGroups[kValue] || [];

        if (qaSpecs.length === 0) {
          console.log(
            `[previewMeasurementIdMapping] No QA specs found for kValue: ${kValue}`,
          );
          continue;
        }

        // Sort by 'no' field
        const sortedSpecs = [...qaSpecs].sort(
          (a, b) => (a.no || 0) - (b.no || 0),
        );

        const kValueMappings = {
          kValue: kValue,
          reportId: analysis.beforeWash.kValues[kValue]?.reportId,
          sourceIdCount: sourceIds.length,
          targetSpecCount: sortedSpecs.length,
          mappings: [],
        };

        sortedSpecs.forEach((spec, idx) => {
          const newId = sourceIds[idx] || null;
          const isChanged = spec.id !== newId;

          kValueMappings.mappings.push({
            no: spec.no,
            pointName: spec.MeasurementPointEngName || "",
            pointNameChi: spec.MeasurementPointChiName || "",
            oldId: spec.id || "N/A",
            newId: newId || "N/A",
            isChanged: isChanged,
            isSelected: selectedBWSpecs.some(
              (s) =>
                s.MeasurementPointEngName === spec.MeasurementPointEngName &&
                s.kValue === spec.kValue,
            ),
          });
        });

        preview.mappings.beforeWash.push(kValueMappings);
      }

      // Also check for kValues in QA specs that are NOT in the source
      const missingKValues = Object.keys(qaKValueGroups).filter(
        (k) => !analysis.beforeWash.kValueList.includes(k),
      );

      if (missingKValues.length > 0) {
        preview.warnings = preview.warnings || [];
        preview.warnings.push({
          type: "missing_source_kvalue",
          message: `No source measurement data found for kValue(s): ${missingKValues.join(", ")}`,
          kValues: missingKValues,
        });
      }
    }

    // Summary
    preview.summary = {
      afterWash: {
        sourceFound: analysis.afterWash.found,
        sourceIdCount: analysis.afterWash.idCount,
        total: preview.mappings.afterWash.length,
        toBeUpdated: preview.mappings.afterWash.filter((m) => m.isChanged)
          .length,
        selectedCount: preview.mappings.afterWash.filter((m) => m.isSelected)
          .length,
      },
      beforeWash: {
        sourceFound: analysis.beforeWash.found,
        kValueCount: preview.mappings.beforeWash.length,
        kValues: preview.mappings.beforeWash.map((k) => ({
          kValue: k.kValue,
          total: k.mappings.length,
          toBeUpdated: k.mappings.filter((m) => m.isChanged).length,
          selectedCount: k.mappings.filter((m) => m.isSelected).length,
        })),
        totalSpecs: preview.mappings.beforeWash.reduce(
          (sum, k) => sum + k.mappings.length,
          0,
        ),
        totalToBeUpdated: preview.mappings.beforeWash.reduce(
          (sum, k) => sum + k.mappings.filter((m) => m.isChanged).length,
          0,
        ),
      },
    };

    res.status(200).json({
      success: true,
      preview,
    });
  } catch (error) {
    console.error("[previewMeasurementIdMapping] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// =========================================================================
// EXECUTE MEASUREMENT ID UPDATE
// =========================================================================

/**
 * Execute the ID update based on analyzed measurement data
 * Handles kValue-specific IDs for Before Wash
 */
export const executeMeasurementIdUpdate = async (req, res) => {
  const { sourceOrderNo, targetOrderNo, updateAfterWash, updateBeforeWash } =
    req.body;

  if (!sourceOrderNo || !targetOrderNo) {
    return res.status(400).json({
      message: "Source Order No and Target Order No are required.",
    });
  }

  if (!updateAfterWash && !updateBeforeWash) {
    return res.status(400).json({
      message:
        "At least one of updateAfterWash or updateBeforeWash must be true.",
    });
  }

  try {
    // 1. Analyze the source order
    const analysis = await analyzeOrderMeasurements(sourceOrderNo.trim());

    // 2. Get the QA record (mutable)
    const qaRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${targetOrderNo.trim()}$`, "i") },
    });

    if (!qaRecord) {
      return res.status(404).json({
        message: `No QA specs found for order: ${targetOrderNo}`,
      });
    }

    const result = {
      afterWash: { updated: 0, selected: 0, skipped: false },
      beforeWash: {
        updated: 0,
        selected: 0,
        kValuesUpdated: [],
        kValuesSkipped: [],
      },
    };

    // === Update After Wash ===
    if (updateAfterWash) {
      if (!analysis.afterWash.found) {
        result.afterWash.skipped = true;
        result.afterWash.skipReason = "No After Wash measurement data found";
      } else {
        const awIds = analysis.afterWash.ids;
        const allSpecs = qaRecord.AllAfterWashSpecs || [];
        const idMapping = new Map(); // pointName -> newId

        // Sort by 'no' to get correct order, then map
        const indexedSpecs = allSpecs.map((spec, idx) => ({
          idx,
          no: spec.no || 0,
        }));
        indexedSpecs.sort((a, b) => a.no - b.no);

        indexedSpecs.forEach((item, sortedIdx) => {
          const newId = awIds[sortedIdx];
          if (newId) {
            const spec = allSpecs[item.idx];
            idMapping.set(spec.MeasurementPointEngName, newId);
            allSpecs[item.idx].id = newId;
            result.afterWash.updated++;
          }
        });

        qaRecord.AllAfterWashSpecs = allSpecs;
        qaRecord.markModified("AllAfterWashSpecs");

        // Update selected specs
        const selectedSpecs = qaRecord.selectedAfterWashSpecs || [];
        selectedSpecs.forEach((spec, idx) => {
          const newId = idMapping.get(spec.MeasurementPointEngName);
          if (newId) {
            selectedSpecs[idx].id = newId;
            result.afterWash.selected++;
          }
        });
        qaRecord.selectedAfterWashSpecs = selectedSpecs;
        qaRecord.markModified("selectedAfterWashSpecs");
      }
    }

    // === Update Before Wash ===
    if (updateBeforeWash) {
      if (!analysis.beforeWash.found) {
        result.beforeWash.skipped = true;
        result.beforeWash.skipReason = "No Before Wash measurement data found";
      } else {
        const allSpecs = qaRecord.AllBeforeWashSpecs || [];

        // Group QA specs by kValue with their original indices
        const qaKValueGroups = {};
        allSpecs.forEach((spec, idx) => {
          const kVal = spec.kValue || "NA";
          if (!qaKValueGroups[kVal]) {
            qaKValueGroups[kVal] = [];
          }
          qaKValueGroups[kVal].push({ idx, spec });
        });

        // For each kValue in the source, update corresponding QA specs
        for (const kValue of analysis.beforeWash.kValueList) {
          const sourceIds = analysis.beforeWash.kValues[kValue]?.ids || [];
          const qaSpecGroup = qaKValueGroups[kValue] || [];

          if (qaSpecGroup.length === 0) {
            result.beforeWash.kValuesSkipped.push({
              kValue,
              reason: "No QA specs found for this kValue",
            });
            continue;
          }

          if (sourceIds.length === 0) {
            result.beforeWash.kValuesSkipped.push({
              kValue,
              reason: "No source IDs found for this kValue",
            });
            continue;
          }

          // Sort by 'no' field
          qaSpecGroup.sort((a, b) => (a.spec.no || 0) - (b.spec.no || 0));

          let updatedCount = 0;
          qaSpecGroup.forEach((item, sortedIdx) => {
            const newId = sourceIds[sortedIdx];
            if (newId) {
              allSpecs[item.idx].id = newId;
              updatedCount++;
            }
          });

          result.beforeWash.updated += updatedCount;
          result.beforeWash.kValuesUpdated.push({
            kValue,
            updated: updatedCount,
          });
        }

        qaRecord.AllBeforeWashSpecs = allSpecs;
        qaRecord.markModified("AllBeforeWashSpecs");

        // Update selected specs - match by pointName AND kValue
        const selectedSpecs = qaRecord.selectedBeforeWashSpecs || [];

        // Build mapping from (pointName + kValue) -> newId from updated allSpecs
        const bwIdMapping = new Map();
        allSpecs.forEach((spec) => {
          if (spec.id) {
            const key = `${spec.MeasurementPointEngName}|${spec.kValue || "NA"}`;
            bwIdMapping.set(key, spec.id);
          }
        });

        selectedSpecs.forEach((spec, idx) => {
          const key = `${spec.MeasurementPointEngName}|${spec.kValue || "NA"}`;
          const newId = bwIdMapping.get(key);
          if (newId) {
            selectedSpecs[idx].id = newId;
            result.beforeWash.selected++;
          }
        });

        qaRecord.selectedBeforeWashSpecs = selectedSpecs;
        qaRecord.markModified("selectedBeforeWashSpecs");
      }
    }

    // Save
    qaRecord.updatedAt = new Date();
    await qaRecord.save();

    res.status(200).json({
      success: true,
      message: "Measurement IDs updated successfully",
      result,
      updatedAt: qaRecord.updatedAt,
    });
  } catch (error) {
    console.error("[executeMeasurementIdUpdate] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// =========================================================================
// CHECK QA SPECS EXISTS
// =========================================================================

/**
 * Check if QA specs exist for a given order number
 */
export const checkQASpecsExists = async (req, res) => {
  const { orderNo } = req.params;

  if (!orderNo) {
    return res.status(400).json({ message: "Order No is required." });
  }

  try {
    const cleanOrderNo = decodeURIComponent(orderNo).trim();

    const qaRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanOrderNo}$`, "i") },
    })
      .select("Order_No AllAfterWashSpecs AllBeforeWashSpecs")
      .lean();

    if (!qaRecord) {
      return res.status(200).json({
        success: true,
        exists: false,
        message: `No QA specs found for order: ${cleanOrderNo}`,
      });
    }

    // Extract kValue info from Before Wash specs
    const bwSpecs = qaRecord.AllBeforeWashSpecs || [];
    const kValueCounts = {};
    bwSpecs.forEach((spec) => {
      const kVal = spec.kValue || "NA";
      kValueCounts[kVal] = (kValueCounts[kVal] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      exists: true,
      orderNo: qaRecord.Order_No,
      counts: {
        afterWash: (qaRecord.AllAfterWashSpecs || []).length,
        beforeWash: bwSpecs.length,
        beforeWashKValues: kValueCounts,
      },
    });
  } catch (error) {
    console.error("[checkQASpecsExists] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// =========================================================================
// ANALYZE SOURCE ORDER (For Frontend to check available data)
// =========================================================================

/**
 * Analyze a source order to see what measurement data is available
 */
export const analyzeSourceOrder = async (req, res) => {
  const { orderNo } = req.params;

  if (!orderNo) {
    return res.status(400).json({ message: "Order No is required." });
  }

  try {
    const cleanOrderNo = decodeURIComponent(orderNo).trim();
    const analysis = await analyzeOrderMeasurements(cleanOrderNo);

    res.status(200).json({
      success: true,
      analysis: {
        orderNo: analysis.orderNo,
        totalReports: analysis.totalReports,
        afterWash: {
          found: analysis.afterWash.found,
          reportId: analysis.afterWash.reportId,
          idCount: analysis.afterWash.idCount,
        },
        beforeWash: {
          found: analysis.beforeWash.found,
          kValues: analysis.beforeWash.kValueList,
          details: Object.entries(analysis.beforeWash.kValues).map(
            ([k, v]) => ({
              kValue: k,
              reportId: v.reportId,
              idCount: v.idCount,
              size: v.size,
            }),
          ),
        },
      },
    });
  } catch (error) {
    console.error("[analyzeSourceOrder] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
