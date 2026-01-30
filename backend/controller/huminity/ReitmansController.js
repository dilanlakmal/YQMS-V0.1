import {
  ymProdConnection,
  ReitmansReport,
} from "../MongoDB/dbConnectionController.js";

// Helper to transform Reitmans-specific history
export const transformReitmansHistory = (payload) => {
  const records = Array.isArray(payload.inspectionRecords)
    ? payload.inspectionRecords
    : [];
  const historyObj = {};
  records.forEach((record, index) => {
    const itemName = `Item ${index + 1}`;
    const entry = {
      date: payload.date || new Date().toISOString(),
      generalRemark: payload.generalRemark || payload.remark || "",

      top: {
        body: record.top?.body || "",
        bodyStatus:
          record.top?.bodyStatus ||
          (record.top?.pass ? "pass" : record.top?.fail ? "fail" : ""),
        ribs: record.top?.ribs || "",
        ribsStatus:
          record.top?.ribsStatus ||
          (record.top?.pass ? "pass" : record.top?.fail ? "fail" : ""),
        status:
          record.top?.status ||
          (record.top?.pass ? "pass" : record.top?.fail ? "fail" : ""),
      },
      middle: {
        body: record.middle?.body || "",
        bodyStatus:
          record.middle?.bodyStatus ||
          (record.middle?.pass ? "pass" : record.middle?.fail ? "fail" : ""),
        ribs: record.middle?.ribs || "",
        ribsStatus:
          record.middle?.ribsStatus ||
          (record.middle?.pass ? "pass" : record.middle?.fail ? "fail" : ""),
        status:
          record.middle?.status ||
          (record.middle?.pass ? "pass" : record.middle?.fail ? "fail" : ""),
      },
      bottom: {
        body: record.bottom?.body || "",
        bodyStatus:
          record.bottom?.bodyStatus ||
          (record.bottom?.pass ? "pass" : record.bottom?.fail ? "fail" : ""),
        ribs: record.bottom?.ribs || "",
        ribsStatus:
          record.bottom?.ribsStatus ||
          (record.bottom?.pass ? "pass" : record.bottom?.fail ? "fail" : ""),
        status:
          record.bottom?.status ||
          (record.bottom?.pass ? "pass" : record.bottom?.fail ? "fail" : ""),
      },

      images: Array.isArray(record.images) ? record.images : [],

      saveTime: new Date().toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
    historyObj[itemName] = { "Check 1": entry };
  });

  return historyObj;
};

// Helper to get Reitmans reports based on query
export const getReitmansReports = async (query, limit = 1000) => {
  const q = ReitmansReport.find(query).sort({ createdAt: -1 });
  if (limit && Number(limit) > 0) q.limit(Number(limit));
  return q.exec();
};

export const createReitmansReport = async (payload, history, status) => {
  try {
    const doc = new ReitmansReport({
      ...payload,
      status: status,
      history: history,
    });
    await doc.save();
    return doc;
  } catch (error) {
    console.error("Error creating Reitmans report:", error);
    throw error;
  }
};

export const updateReitmansReport = async (id, payload) => {
  // Remove _id and timestamps from payload
  delete payload._id;
  delete payload.createdAt;
  delete payload.updatedAt;

  // Recalculate top-level status based on the latest check for every item
  if (payload.history && typeof payload.history === "object") {
    const items = Object.values(payload.history);
    if (items.length > 0) {
      const allPassed = items.every((checksObj) => {
        const checkKeys = Object.keys(checksObj || {}).sort((a, b) => {
          const numA = parseInt(a.replace("Check ", ""));
          const numB = parseInt(b.replace("Check ", ""));
          return numB - numA;
        });
        const latestCheck = checksObj[checkKeys[0]];
        // Only require the 'top' section to pass in the simplified flow
        return latestCheck?.top?.status === "pass";
      });
      payload.status = allPassed ? "Passed" : "Failed";
    }
  }

  return ReitmansReport.findByIdAndUpdate(id, { $set: payload }, { new: true });
};

// GET /api/reitmans-humidity/:moNo
export const getReitmansHumidityByMoNo = async (req, res) => {
  try {
    const moNo = req.params.moNo || req.query.moNo;
    const col = ymProdConnection.db.collection("reitmans_humidity");

    if (!moNo) {
      const docs = await col.find({}).sort({ _id: -1 }).limit(200).toArray();
      return res.json({ success: true, data: docs });
    }

    const exactQuery = {
      $or: [{ factoryStyleNo: moNo }, { moNo: moNo }, { style: moNo }],
    };
    let doc = await col.findOne(exactQuery);

    // ALWAYS try to find a global REITMANS rules doc (used for calculations)
    const rulesDoc = await col.findOne({
      $or: [
        { buyer: /REITMANS/i, ReitmansName: { $exists: true } },
        { style: /REITMANS RULES/i, ReitmansName: { $exists: true } },
        { factoryStyleNo: /REITMANS RULES/i, ReitmansName: { $exists: true } },
      ],
    });

    if (!doc && !rulesDoc) {
      return res.status(404).json({
        success: false,
        message: "No reitmans_humidity record or rules found",
      });
    }

    // Fetch order data for fabric composition
    const ordersCol = ymProdConnection.db.collection("yorksys_orders");
    const order = await ordersCol.findOne({
      $or: [{ moNo: moNo }, { style: moNo }, { factoryStyleNo: moNo }],
    });
    const skuColors =
      order && Array.isArray(order.SKUData)
        ? [...new Set(order.SKUData.map((s) => s.Color).filter(Boolean))]
        : [];
    const colorName = skuColors.join(", ");

    let finalPrimary = null;
    let finalSecondary = null;
    let finalValue = null;
    let matchNote = "";

    // 1. Get Actual Composition from Order Data (if available) or fallback
    let orderFabrics = [];
    if (order && Array.isArray(order.FabricContent)) {
      orderFabrics = order.FabricContent;
    } else {
      console.log(
        `[ReitmansMatch] No FabricContent found in order for ${moNo}`,
      );
    }

    if (orderFabrics.length > 0) {
      // Sort by percentage descending to find Primary/Secondary
      const sorted = [...orderFabrics].sort(
        (a, b) =>
          (parseFloat(b.percentageValue) || 0) -
          (parseFloat(a.percentageValue) || 0),
      );

      const pFab = sorted[0];
      const sFab = sorted.length > 1 ? sorted[1] : null;

      const pName = (pFab.fabricName || pFab.fabric || "").toUpperCase().trim();
      const pPct = parseFloat(pFab.percentageValue) || 0;

      const sName = sFab
        ? (sFab.fabricName || sFab.fabric || "").toUpperCase().trim()
        : "";

      finalPrimary = { fabricName: pName, percentage: pPct };
      if (sName)
        finalSecondary = {
          fabricName: sName,
          percentage: parseFloat(sFab.percentageValue) || 0,
        };

      // 2. Find matching rule in ReitmansName array from Either style-doc or global rulesDoc
      const targetRules =
        doc && doc.ReitmansName && doc.ReitmansName.length > 0
          ? doc.ReitmansName
          : rulesDoc
            ? rulesDoc.ReitmansName
            : [];

      if (targetRules.length > 0) {
        // Helper to check range "81-100" or single value
        const isPctMatch = (ruleRange, actualPct) => {
          if (!ruleRange) return false;
          const rangeStr = String(ruleRange).trim();
          if (rangeStr.includes("-")) {
            const [min, max] = rangeStr.split("-").map(Number);
            return actualPct >= min && actualPct <= max;
          }
          // direct match (allow small variance? strictly equal for now)
          return Number(rangeStr) === actualPct;
        };

        let bestMatch = targetRules.find((rule) => {
          const rPName = (rule.primary || "").toUpperCase().trim();
          const rSName = (rule.secondary || "").toUpperCase().trim();

          const pMatch = pName.includes(rPName) || rPName.includes(pName); // loose name match
          const rangeMatch = isPctMatch(
            rule["primary%"] || rule.primaryPercent,
            pPct,
          );
          let sMatch = false;
          if (sName && rSName) {
            sMatch = sName.includes(rSName) || rSName.includes(sName);
          } else if (!sName && !rSName) {
            sMatch = true;
          }

          return pMatch && rangeMatch && sMatch;
        });

        if (!bestMatch) {
          bestMatch = targetRules.find((rule) => {
            const rPName = (rule.primary || "").toUpperCase().trim();
            const pMatch = pName.includes(rPName) || rPName.includes(pName);
            const rangeMatch = isPctMatch(
              rule["primary%"] || rule.primaryPercent,
              pPct,
            );
            return pMatch && rangeMatch && !rule.secondary; // prefer rules without secondary
          });
        }

        if (!bestMatch) {
          bestMatch = targetRules.find((rule) => {
            const rPName = (rule.primary || "").toUpperCase().trim();
            return (
              (pName.includes(rPName) || rPName.includes(pName)) &&
              !rule.secondary
            );
          });
        }

        if (!bestMatch) {
          bestMatch = targetRules.find((rule) => {
            const rPName = (rule.primary || "").toUpperCase().trim();
            const pMatch = pName.includes(rPName) || rPName.includes(pName);
            const rangeMatch = isPctMatch(
              rule["primary%"] || rule.primaryPercent,
              pPct,
            );
            return pMatch && rangeMatch;
          });
        }

        if (bestMatch) {
          finalValue =
            bestMatch.upperCentisimal ||
            bestMatch.upperCentisimalIndex ||
            bestMatch.value;
          matchNote = "Matched rule: " + JSON.stringify(bestMatch);
          // Store the rule itself for response
          var matchedRule = bestMatch;
        } else {
          console.log(`[ReitmansMatch] NO MATCH FOUND after all attempts.`);
        }
      }
    } else {
      // No order fabrics found, fallback to doc defaults
      finalPrimary = {
        fabricName: doc?.primary || doc?.primaryFabric,
        percentage: doc?.primaryPercent || doc?.["primary%"],
      };
      finalValue = doc?.upperCentisimalIndex || doc?.value;
    }

    // fallback for value if still null
    if (!finalValue)
      finalValue = doc?.upperCentisimalIndex || doc?.value || doc?.aquaboySpec;

    return res.json({
      success: true,
      data: {
        primary: finalPrimary?.fabricName,
        secondary: finalSecondary?.fabricName,
        primaryPercent: finalPrimary?.percentage,
        secondaryPercent: finalSecondary?.percentage,
        colorName: colorName || doc?.colorName || "",

        doc: {
          ...doc,
          upperCentisimalIndex: finalValue,
          upperCentisimal: finalValue,
          value: finalValue,
          matchNote,
          matchedRule: matchedRule || null,
        },
      },
    });
  } catch (err) {
    console.error("Error fetching reitmans_humidity by moNo:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch reitmans_humidity" });
  }
};
