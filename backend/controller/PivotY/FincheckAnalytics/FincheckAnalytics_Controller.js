import {
  FincheckInspectionReports,
  UserMain,
} from "../../MongoDB/dbConnectionController.js";

// ============================================================
// GET: QA Analytics Summary (Logic Fixed for Nested Defects)
// ============================================================
export const getQAAnalyticsSummary = async (req, res) => {
  try {
    const { empId, topN } = req.query;
    const limitDefects = parseInt(topN) || 5;

    if (!empId) {
      return res
        .status(400)
        .json({ success: false, message: "QA Employee ID is required" });
    }

    // 1. Fetch User Profile
    const userProfile = await UserMain.findOne({ emp_id: empId }).select(
      "emp_id eng_name face_photo job_title",
    );

    if (!userProfile) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 2. Fetch Reports (Raw Data)
    // We fetch only necessary fields to keep it fast
    const reports = await FincheckInspectionReports.find({
      empId: empId,
      status: { $ne: "cancelled" },
    })
      .select(
        "reportType orderNos inspectionMethod inspectionDetails inspectionConfig defectData",
      )
      .lean();

    // 3. Initialize Accumulators
    const overall = {
      totalReports: reports.length,
      allOrders: new Set(),
      totalSampleSize: 0,
      totalDefects: 0,
      minor: 0,
      major: 0,
      critical: 0,
    };

    // Map: ReportType -> Data Object
    const reportTypeMap = {};

    // 4. Iterate and Process (The "Flattening" Logic)
    reports.forEach((report) => {
      // A. Track Styles
      if (report.orderNos && Array.isArray(report.orderNos)) {
        report.orderNos.forEach((o) => overall.allOrders.add(o));
      }

      // B. Calculate Sample Size
      let sampleSize = 0;
      if (report.inspectionMethod === "AQL") {
        sampleSize = report.inspectionDetails?.aqlSampleSize || 0;
      } else {
        sampleSize = report.inspectionConfig?.sampleSize || 0;
      }
      overall.totalSampleSize += sampleSize;

      // C. Initialize Report Type Group
      const rType = report.reportType || "Unknown";
      if (!reportTypeMap[rType]) {
        reportTypeMap[rType] = {
          reportType: rType,
          reportCount: 0,
          uniqueStyles: new Set(),
          sampleSize: 0,
          totalDefects: 0,
          minor: 0,
          major: 0,
          critical: 0,
          defectsMap: {}, // To count specific defect names
        };
      }
      const group = reportTypeMap[rType];
      group.reportCount += 1;
      group.sampleSize += sampleSize;

      // Track Unique Styles per Group
      if (report.orderNos && Array.isArray(report.orderNos)) {
        report.orderNos.forEach((o) => group.uniqueStyles.add(o));
      }

      // D. Process Defects (Crucial Logic Adjustment)
      if (report.defectData && Array.isArray(report.defectData)) {
        report.defectData.forEach((defect) => {
          const name = defect.defectName;

          if (defect.isNoLocation) {
            // --- SCENARIO 1: No Location (Qty is at root) ---
            const qty = defect.qty || 0;
            const status = defect.status; // "Minor", "Major", "Critical"

            // Update Counts
            overall.totalDefects += qty;
            group.totalDefects += qty;

            if (status === "Minor") {
              overall.minor += qty;
              group.minor += qty;
            } else if (status === "Major") {
              overall.major += qty;
              group.major += qty;
            } else if (status === "Critical") {
              overall.critical += qty;
              group.critical += qty;
            }

            // Update Defect Name Map
            if (!group.defectsMap[name]) group.defectsMap[name] = 0;
            group.defectsMap[name] += qty;
          } else {
            // --- SCENARIO 2: Location Based (Count Positions) ---
            if (defect.locations && Array.isArray(defect.locations)) {
              defect.locations.forEach((loc) => {
                if (loc.positions && Array.isArray(loc.positions)) {
                  loc.positions.forEach((pos) => {
                    // 1 Position = 1 Defect Qty
                    const qty = 1;
                    const status = pos.status; // "Minor", "Major", "Critical"

                    // Update Counts
                    overall.totalDefects += qty;
                    group.totalDefects += qty;

                    if (status === "Minor") {
                      overall.minor += qty;
                      group.minor += qty;
                    } else if (status === "Major") {
                      overall.major += qty;
                      group.major += qty;
                    } else if (status === "Critical") {
                      overall.critical += qty;
                      group.critical += qty;
                    }

                    // Update Defect Name Map
                    if (!group.defectsMap[name]) group.defectsMap[name] = 0;
                    group.defectsMap[name] += qty;
                  });
                }
              });
            }
          }
        });
      }
    });

    // 5. Final Formatting for Frontend
    const tableRows = Object.values(reportTypeMap).map((group) => {
      // Sort defects by qty desc and slice top N
      const topDefects = Object.entries(group.defectsMap)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, limitDefects); // <--- Top N applied here

      // Remove the map to clean up response
      const { defectsMap, uniqueStyles, ...rest } = group;
      return { ...rest, totalStyles: uniqueStyles.size, topDefects };
    });

    // Sort report types alphabetically or by count if preferred
    tableRows.sort((a, b) => a.reportType.localeCompare(b.reportType));

    return res.status(200).json({
      success: true,
      data: {
        profile: userProfile,
        stats: {
          totalReports: overall.totalReports,
          totalStyles: overall.allOrders.size,
          totalSample: overall.totalSampleSize,
          totalDefects: overall.totalDefects,
          minor: overall.minor,
          major: overall.major,
          critical: overall.critical,
          defectRate:
            overall.totalSampleSize > 0
              ? (
                  (overall.totalDefects / overall.totalSampleSize) *
                  100
                ).toFixed(2)
              : "0.00",
        },
        reportBreakdown: tableRows,
        tableRows: tableRows,
      },
    });
  } catch (error) {
    console.error("Error fetching QA analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// GET: QA Style Breakdown (Pivot Table)
// ============================================================

export const getQAStyleAnalytics = async (req, res) => {
  try {
    const { empId, reportType } = req.query;

    if (!empId) {
      return res
        .status(400)
        .json({ success: false, message: "QA ID required" });
    }

    // 1. Fetch ALL reports for this QA (to calculate available types + filtered data)
    const allReports = await FincheckInspectionReports.find({
      empId: empId,
      status: { $ne: "cancelled" },
    })
      .select(
        "orderNos reportType inspectionMethod inspectionDetails inspectionConfig defectData",
      )
      .lean();

    // 2. Extract Available Report Types (For the Toggle Buttons)
    const availableTypes = [
      ...new Set(allReports.map((r) => r.reportType)),
    ].sort();

    // 3. Filter Reports based on selected Toggle (if not 'All')
    const filteredReports =
      !reportType || reportType === "All"
        ? allReports
        : allReports.filter((r) => r.reportType === reportType);

    // 4. Data Structures for Pivoting
    const styleMap = {}; // Key: Style Name (OrderNo)

    // 5. Process Filtered Reports
    filteredReports.forEach((report) => {
      // Calculate Sample Size
      let sampleSize = 0;
      if (report.inspectionMethod === "AQL") {
        sampleSize = report.inspectionDetails?.aqlSampleSize || 0;
      } else {
        sampleSize = report.inspectionConfig?.sampleSize || 0;
      }

      // Extract Defects for this report
      const reportDefects = [];
      if (report.defectData && Array.isArray(report.defectData)) {
        report.defectData.forEach((defect) => {
          const defName = defect.defectName;
          // Flatten Qty logic
          let qty = 0;
          if (defect.isNoLocation) {
            qty = defect.qty || 0;
          } else if (defect.locations) {
            defect.locations.forEach((loc) => {
              if (loc.positions) qty += loc.positions.length;
            });
          }

          if (qty > 0) {
            reportDefects.push({ name: defName, qty });
          }
        });
      }

      const totalReportDefects = reportDefects.reduce(
        (sum, d) => sum + d.qty,
        0,
      );

      // Distribute Stats to Styles
      if (report.orderNos && Array.isArray(report.orderNos)) {
        report.orderNos.forEach((style) => {
          if (!styleMap[style]) {
            styleMap[style] = {
              style: style,
              totalReports: 0,
              totalSample: 0,
              totalDefects: 0,
              defectsMap: {}, // Intermediate map to aggregate counts
            };
          }

          const entry = styleMap[style];
          entry.totalReports += 1;
          entry.totalSample += sampleSize;
          entry.totalDefects += totalReportDefects;

          // Aggregate specific defects
          reportDefects.forEach((d) => {
            if (!entry.defectsMap[d.name]) {
              entry.defectsMap[d.name] = 0;
            }
            entry.defectsMap[d.name] += d.qty;
          });
        });
      }
    });

    // 6. Format Rows
    const rows = Object.values(styleMap).map((item) => {
      // Calculate Rate
      const rate =
        item.totalSample > 0
          ? ((item.totalDefects / item.totalSample) * 100).toFixed(2)
          : "0.00";

      // Convert Defects Map to Sorted Array (Highest Qty First)
      const defectList = Object.entries(item.defectsMap)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty);

      // Clean up the map from output
      const { defectsMap, ...rest } = item;

      return {
        ...rest,
        defectRate: rate,
        defectDetails: defectList, // Array of {name, qty}
      };
    });

    // Sort rows by Style Name
    rows.sort((a, b) => a.style.localeCompare(b.style));

    return res.status(200).json({
      success: true,
      data: {
        reportTypes: availableTypes, // Send list for buttons
        rows: rows,
      },
    });
  } catch (error) {
    console.error("Error fetching style analytics:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: QA Trend Analytics (Chart Data)
// ============================================================
export const getQATrendAnalytics = async (req, res) => {
  try {
    const { empId, startDate, endDate } = req.query;

    if (!empId) {
      return res
        .status(400)
        .json({ success: false, message: "QA ID required" });
    }

    // Date Logic
    let matchStage = {
      empId: empId,
      status: { $ne: "cancelled" },
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchStage.inspectionDate = { $gte: start, $lte: end };
    }

    const pipeline = [
      { $match: matchStage },
      // 1. Normalize Defects (Same logic as Summary to ensure accuracy)
      {
        $addFields: {
          normalizedDefects: {
            $concatArrays: [
              // Location-Based
              {
                $reduce: {
                  input: {
                    $filter: {
                      input: { $ifNull: ["$defectData", []] },
                      as: "d",
                      cond: { $ne: ["$$d.isNoLocation", true] },
                    },
                  },
                  initialValue: [],
                  in: {
                    $concatArrays: [
                      "$$value",
                      {
                        $reduce: {
                          input: { $ifNull: ["$$this.locations", []] },
                          initialValue: [],
                          in: {
                            $concatArrays: [
                              "$$value",
                              {
                                $map: {
                                  input: { $ifNull: ["$$this.positions", []] },
                                  as: "pos",
                                  in: { qty: 1 }, // 1 Position = 1 Defect
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
              // No-Location
              {
                $map: {
                  input: {
                    $filter: {
                      input: { $ifNull: ["$defectData", []] },
                      as: "d",
                      cond: { $eq: ["$$d.isNoLocation", true] },
                    },
                  },
                  as: "noLoc",
                  in: { qty: { $ifNull: ["$$noLoc.qty", 1] } },
                },
              },
            ],
          },
          // Normalize Sample Size
          calculatedSampleSize: {
            $cond: [
              { $eq: ["$inspectionMethod", "AQL"] },
              { $ifNull: ["$inspectionDetails.aqlSampleSize", 0] },
              { $ifNull: ["$inspectionConfig.sampleSize", 0] },
            ],
          },
          // Format Date for Grouping
          dateKey: {
            $dateToString: { format: "%Y-%m-%d", date: "$inspectionDate" },
          },
        },
      },
      // 2. Unwind Defects to Sum
      {
        $unwind: {
          path: "$normalizedDefects",
          preserveNullAndEmptyArrays: true,
        },
      },
      // 3. Group By Date
      {
        $group: {
          _id: "$dateKey",
          // Use Set to count unique reports (because of unwind)
          uniqueReports: { $addToSet: "$_id" },
          // Re-calculate sample size sum (handle unwind duplication by pushing then reducing, or simple math)
          docs: {
            $addToSet: {
              id: "$_id",
              sample: "$calculatedSampleSize",
            },
          },
          totalDefects: { $sum: { $ifNull: ["$normalizedDefects.qty", 0] } },
        },
      },
      // 4. Final Projection
      {
        $project: {
          date: "$_id",
          reportCount: { $size: "$uniqueReports" },
          totalDefects: 1,
          totalSample: { $sum: "$docs.sample" },
        },
      },
      { $sort: { date: 1 } }, // Sort Ascending
    ];

    const data = await FincheckInspectionReports.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching trend analytics:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
