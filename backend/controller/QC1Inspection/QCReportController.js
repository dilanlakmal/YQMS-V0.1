import {
  QC1Sunrise,
  QC1SunriseSummary
} from "../MongoDB/dbConnectionController.js";

// Helper function to merge defect arrays
const mergeDefects = (defects) => {
  const defectMap = new Map();
  defects.forEach((defect) => {
    if (defectMap.has(defect.defectCode)) {
      defectMap.get(defect.defectCode).defectQty += defect.defectQty;
    } else {
      defectMap.set(defect.defectCode, { ...defect });
    }
  });
  return Array.from(defectMap.values()).sort(
    (a, b) => b.defectQty - a.defectQty
  );
};

const runSunriseAggregation = async (dateFilter = {}) => {
  try {
    const aggregationPipeline = [
      // Stage 1: Convert string date to ISODate and apply date filter
      {
        $addFields: {
          convertedDate: {
            $dateFromString: {
              dateString: "$inspectionDate",
              format: "%m-%d-%Y",
              onError: null,
              onNull: null
            }
          }
        }
      },
      {
        $match: {
          convertedDate: { $ne: null, ...dateFilter }
        }
      },

      // --- FIX START: Use $facet to run multiple aggregations in parallel for one day's data ---
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$convertedDate" }
          },
          docs: { $push: "$$ROOT" }
        }
      },
      { $unwind: "$docs" },
      { $replaceRoot: { newRoot: "$docs" } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$convertedDate" }
          },
          // Full details
          daily_full_summary: { $push: "$$ROOT" },

          // Daily totals
          DailyCheckedQty: { $sum: "$CheckedQty" },
          DailyCheckedQtyT38: { $sum: "$CheckedQtyT38" },
          DailyCheckedQtyT39: { $sum: "$CheckedQtyT39" },
          DailytotalDefectsQty: { $sum: "$totalDefectsQty" },
          DailyDefectArray: { $push: "$DefectArray" },

          // Group by Line
          daily_line_summary: {
            $push: {
              lineNo: "$lineNo",
              CheckedQty: "$CheckedQty",
              CheckedQtyT38: "$CheckedQtyT38",
              CheckedQtyT39: "$CheckedQtyT39",
              totalDefectsQty: "$totalDefectsQty",
              DefectArray: "$DefectArray"
            }
          },
          // Group by Line + MO
          daily_line_MO_summary: {
            $push: {
              lineNo: "$lineNo",
              MONo: "$MONo",
              CheckedQty: "$CheckedQty",
              CheckedQtyT38: "$CheckedQtyT38",
              CheckedQtyT39: "$CheckedQtyT39",
              totalDefectsQty: "$totalDefectsQty",
              DefectArray: "$DefectArray"
            }
          },
          // Group by MO
          daily_mo_summary: {
            $push: {
              MONo: "$MONo",
              CheckedQty: "$CheckedQty",
              CheckedQtyT38: "$CheckedQtyT38",
              CheckedQtyT39: "$CheckedQtyT39",
              totalDefectsQty: "$totalDefectsQty",
              DefectArray: "$DefectArray"
            }
          },
          // Group by Buyer
          daily_buyer_summary: {
            $push: {
              Buyer: "$Buyer",
              CheckedQty: "$CheckedQty",
              CheckedQtyT38: "$CheckedQtyT38",
              CheckedQtyT39: "$CheckedQtyT39",
              totalDefectsQty: "$totalDefectsQty",
              DefectArray: "$DefectArray"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          inspectionDate: { $toDate: "$_id" },
          DailyCheckedQty: 1,
          DailyCheckedQtyT38: 1,
          DailyCheckedQtyT39: 1,
          DailytotalDefectsQty: 1,
          DailyDefectArray: {
            $reduce: {
              input: "$DailyDefectArray",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] }
            }
          },
          daily_full_summary: 1,
          daily_line_summary: 1,
          daily_line_MO_summary: 1,
          daily_mo_summary: 1,
          daily_buyer_summary: 1
        }
      }
      // --- FIX END ---
    ];

    const results = await QC1Sunrise.aggregate(aggregationPipeline);

    // --- Post-process in JS to merge and sum the grouped arrays ---
    results.forEach((day) => {
      day.DailyDefectArray = mergeDefects(day.DailyDefectArray);

      const processGroup = (group, keyFields) => {
        const summaryMap = new Map();
        group.forEach((item) => {
          // Create a unique key from the specified fields (e.g., just lineNo, or lineNo+MONo)
          const key = keyFields.map((k) => item[k]).join("-");

          if (!summaryMap.has(key)) {
            const newEntry = {};
            keyFields.forEach((k) => (newEntry[k] = item[k]));
            summaryMap.set(key, {
              ...newEntry,
              CheckedQty: 0,
              CheckedQtyT38: 0,
              CheckedQtyT39: 0,
              totalDefectsQty: 0,
              DefectArray: []
            });
          }

          const entry = summaryMap.get(key);
          entry.CheckedQty += item.CheckedQty || 0;
          entry.CheckedQtyT38 += item.CheckedQtyT38 || 0;
          entry.CheckedQtyT39 += item.CheckedQtyT39 || 0;
          entry.totalDefectsQty += item.totalDefectsQty || 0;
          entry.DefectArray = entry.DefectArray.concat(item.DefectArray || []);
        });

        const finalArray = Array.from(summaryMap.values());
        finalArray.forEach((item) => {
          item.DefectArray = mergeDefects(item.DefectArray);
        });
        return finalArray;
      };

      day.daily_line_summary = processGroup(day.daily_line_summary, ["lineNo"]);
      day.daily_line_MO_summary = processGroup(day.daily_line_MO_summary, [
        "lineNo",
        "MONo"
      ]);
      day.daily_mo_summary = processGroup(day.daily_mo_summary, ["MONo"]);
      day.daily_buyer_summary = processGroup(day.daily_buyer_summary, [
        "Buyer"
      ]);
    });

    // Upsert into the summary collection (unchanged)
    const bulkOps = results.map((doc) => ({
      updateOne: {
        filter: { inspectionDate: doc.inspectionDate },
        update: { $set: doc },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await QC1SunriseSummary.bulkWrite(bulkOps);
    }

    return { success: true, count: results.length };
  } catch (error) {
    console.error("Aggregation failed:", error);
    return { success: false, error: error.message };
  }
};

export const syncAllSunriseData = async (req, res) => {
  const result = await runSunriseAggregation();
  if (result.success) {
    res.status(200).json({
      message: `Successfully synced and updated ${result.count} days.`
    });
  } else {
    res
      .status(500)
      .json({ message: "Failed to sync data.", error: result.error });
  }
};

export const syncLast3DaysSunriseData = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 2);

  const dateFilter = {
    $gte: threeDaysAgo
  };

  const result = await runSunriseAggregation(dateFilter);
  if (result.success) {
    res.status(200).json({
      message: `Successfully synced and updated last 3 days (${result.count} records).`
    });
  } else {
    res
      .status(500)
      .json({ message: "Failed to sync recent data.", error: result.error });
  }
};
