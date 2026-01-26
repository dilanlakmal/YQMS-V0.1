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
      const { defectsMap, ...rest } = group;
      return { ...rest, topDefects };
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
