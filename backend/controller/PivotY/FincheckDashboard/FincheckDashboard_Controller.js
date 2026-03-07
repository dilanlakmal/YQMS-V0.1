import {
  FincheckInspectionReports,
  UserMain,
} from "../../MongoDB/dbConnectionController.js";

// ============================================================
// HELPER: Common Filter Logic
// ============================================================
const buildMatchStage = (startDate, endDate, reportType, buyer) => {
  const match = { status: { $ne: "cancelled" } };

  // Date Range
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    match.inspectionDate = { $gte: start, $lte: end };
  }

  // Report Type Filter
  if (reportType && reportType !== "All") {
    match.reportType = reportType;
  }

  // 2. NEW: Buyer Filter Logic (Regex for flexibility)
  if (buyer) {
    match.buyer = { $regex: buyer, $options: "i" };
  }

  return match;
};

// ============================================================
// GET: QA Dashboard Performance (Cards)
// ============================================================
export const getQADashboardPerformance = async (req, res) => {
  try {
    const { startDate, endDate, reportType, buyer } = req.query;
    const matchStage = buildMatchStage(startDate, endDate, reportType, buyer);

    const reports = await FincheckInspectionReports.find(matchStage)
      .select(
        "empId empName inspectionDetails inspectionConfig defectData reportType inspectionMethod",
      )
      .lean();

    const qaMap = {};

    for (const report of reports) {
      const empId = report.empId;
      if (!empId) continue;

      if (!qaMap[empId]) {
        qaMap[empId] = {
          empId: empId,
          empName: report.empName || "Unknown",
          totalReports: 0,
          totalSample: 0,
          totalDefects: 0,
          minor: 0,
          major: 0,
          critical: 0,
          defectTypes: {},
        };
      }

      const qa = qaMap[empId];
      qa.totalReports += 1;

      // Sample Size
      let sampleSize = 0;
      if (report.inspectionMethod === "AQL") {
        sampleSize = report.inspectionDetails?.aqlSampleSize || 0;
      } else {
        sampleSize = report.inspectionConfig?.sampleSize || 0;
      }
      qa.totalSample += sampleSize;

      // Defect Processing
      if (report.defectData && Array.isArray(report.defectData)) {
        report.defectData.forEach((defect) => {
          const name = defect.defectName;
          const processDefectQty = (qty, status) => {
            qa.totalDefects += qty;
            if (status === "Minor") qa.minor += qty;
            if (status === "Major") qa.major += qty;
            if (status === "Critical") qa.critical += qty;
            if (!qa.defectTypes[name]) qa.defectTypes[name] = 0;
            qa.defectTypes[name] += qty;
          };

          if (defect.isNoLocation) {
            processDefectQty(defect.qty || 0, defect.status);
          } else if (defect.locations) {
            defect.locations.forEach((loc) => {
              if (loc.positions) {
                loc.positions.forEach((pos) => {
                  processDefectQty(1, pos.status);
                });
              }
            });
          }
        });
      }
    }

    // Fetch User Profile Photos
    const qaIds = Object.keys(qaMap);
    const users = await UserMain.find({ emp_id: { $in: qaIds } })
      .select("emp_id eng_name face_photo job_title")
      .lean();

    const userMap = users.reduce((acc, user) => {
      acc[user.emp_id] = user;
      return acc;
    }, {});

    const result = Object.values(qaMap).map((qa) => {
      const userProfile = userMap[qa.empId];
      const topDefects = Object.entries(qa.defectTypes)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 3); // Top 3 for QA Card

      const defectRate =
        qa.totalSample > 0
          ? ((qa.totalDefects / qa.totalSample) * 100).toFixed(2)
          : "0.00";

      return {
        empId: qa.empId,
        name: userProfile?.eng_name || qa.empName,
        photo: userProfile?.face_photo || null,
        jobTitle: userProfile?.job_title || "QA Inspector",
        stats: {
          reports: qa.totalReports,
          sample: qa.totalSample,
          defects: qa.totalDefects,
          minor: qa.minor,
          major: qa.major,
          critical: qa.critical,
          defectRate: defectRate,
        },
        topDefects,
      };
    });

    result.sort((a, b) => b.stats.reports - a.stats.reports);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching QA Dashboard:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Order No Summary Performance (Cards)
// ============================================================
export const getOrderSummaryPerformance = async (req, res) => {
  try {
    const { startDate, endDate, reportType, buyer } = req.query;
    const matchStage = buildMatchStage(startDate, endDate, reportType, buyer);

    const reports = await FincheckInspectionReports.find(matchStage)
      .select(
        "orderNos inspectionDetails inspectionConfig defectData reportType inspectionMethod",
      )
      .lean();

    const orderMap = {};

    for (const report of reports) {
      // Skip if no order numbers
      if (!report.orderNos || !Array.isArray(report.orderNos)) continue;

      // Sample Size Calculation (Per Report)
      let sampleSize = 0;
      if (report.inspectionMethod === "AQL") {
        sampleSize = report.inspectionDetails?.aqlSampleSize || 0;
      } else {
        sampleSize = report.inspectionConfig?.sampleSize || 0;
      }

      // Defect Calculation (Per Report)
      let rDefects = 0;
      let rMinor = 0;
      let rMajor = 0;
      let rCritical = 0;
      const rDefectTypes = {};

      if (report.defectData && Array.isArray(report.defectData)) {
        report.defectData.forEach((defect) => {
          const name = defect.defectName;
          const process = (qty, status) => {
            rDefects += qty;
            if (status === "Minor") rMinor += qty;
            if (status === "Major") rMajor += qty;
            if (status === "Critical") rCritical += qty;
            if (!rDefectTypes[name]) rDefectTypes[name] = 0;
            rDefectTypes[name] += qty;
          };

          if (defect.isNoLocation) {
            process(defect.qty || 0, defect.status);
          } else if (defect.locations) {
            defect.locations.forEach((loc) => {
              if (loc.positions) {
                loc.positions.forEach((pos) => process(1, pos.status));
              }
            });
          }
        });
      }

      // Distribute to Order Nos
      report.orderNos.forEach((orderNo) => {
        if (!orderMap[orderNo]) {
          orderMap[orderNo] = {
            orderNo: orderNo,
            totalReports: 0,
            totalSample: 0,
            totalDefects: 0,
            minor: 0,
            major: 0,
            critical: 0,
            defectTypes: {},
          };
        }
        const o = orderMap[orderNo];
        o.totalReports += 1;
        o.totalSample += sampleSize;
        o.totalDefects += rDefects;
        o.minor += rMinor;
        o.major += rMajor;
        o.critical += rCritical;

        // Merge defect types
        Object.entries(rDefectTypes).forEach(([name, qty]) => {
          if (!o.defectTypes[name]) o.defectTypes[name] = 0;
          o.defectTypes[name] += qty;
        });
      });
    }

    const result = Object.values(orderMap).map((o) => {
      const topDefects = Object.entries(o.defectTypes)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5); // Top 5 for Order Card

      const defectRate =
        o.totalSample > 0
          ? ((o.totalDefects / o.totalSample) * 100).toFixed(2)
          : "0.00";

      return {
        orderNo: o.orderNo,
        stats: {
          reports: o.totalReports,
          sample: o.totalSample,
          defects: o.totalDefects,
          minor: o.minor,
          major: o.major,
          critical: o.critical,
          defectRate: defectRate,
        },
        topDefects,
      };
    });

    // Sort by most defects desc (or reports)
    result.sort((a, b) => b.stats.defects - a.stats.defects);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching Order Summary:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Top Defect Analytics (Aggregated Chart)
// ============================================================

export const getTopDefectAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, reportType, orderFilter, buyer, qaFilter } =
      req.query;

    // 1. Build Match Stage
    const matchStage = buildMatchStage(startDate, endDate, reportType, buyer);

    // 2. Apply Order Filter (Partial Match)
    if (orderFilter) {
      matchStage.orderNos = {
        $elemMatch: { $regex: orderFilter, $options: "i" },
      };
    }

    if (qaFilter) {
      matchStage.$or = [
        { empId: { $regex: qaFilter, $options: "i" } },
        { empName: { $regex: qaFilter, $options: "i" } },
      ];
    }

    // 3. Fetch Reports (Only need defectData)
    const reports = await FincheckInspectionReports.find(matchStage)
      .select("defectData")
      .lean();

    // 4. Aggregate Defects
    const defectMap = {};

    reports.forEach((report) => {
      if (report.defectData && Array.isArray(report.defectData)) {
        report.defectData.forEach((defect) => {
          // Identify Defect Key
          const name = defect.defectName;
          const code = defect.defectCode;
          // Use Code if available for uniqueness, else Name
          const key = code ? `${name} [${code}]` : name;

          // Helper to aggregate counts
          if (!defectMap[key]) {
            defectMap[key] = {
              name: key,
              total: 0,
              minor: 0,
              major: 0,
              critical: 0,
            };
          }
          const entry = defectMap[key];

          // Logic to update counts based on location/no-location
          const processQty = (qty, status) => {
            entry.total += qty;
            if (status === "Minor") entry.minor += qty;
            else if (status === "Major") entry.major += qty;
            else if (status === "Critical") entry.critical += qty;
          };

          if (defect.isNoLocation) {
            processQty(defect.qty || 0, defect.status);
          } else if (defect.locations && Array.isArray(defect.locations)) {
            defect.locations.forEach((loc) => {
              if (loc.positions && Array.isArray(loc.positions)) {
                loc.positions.forEach((pos) => {
                  processQty(1, pos.status);
                });
              }
            });
          }
        });
      }
    });

    // 5. Format for Chart
    // Sort by Total Descending. Do NOT slice here, Frontend handles pagination.
    const chartData = Object.values(defectMap).sort(
      (a, b) => b.total - a.total,
    );

    return res.status(200).json({ success: true, data: chartData });
  } catch (error) {
    console.error("Error fetching Top Defects:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Report Result Summary (Table Data)
// ============================================================
export const getReportResultSummary = async (req, res) => {
  try {
    const { startDate, endDate, reportType, buyer, qaFilter, orderFilter } =
      req.query;
    const matchStage = buildMatchStage(startDate, endDate, reportType, buyer);

    if (qaFilter) {
      matchStage.$or = [
        { empId: { $regex: qaFilter, $options: "i" } },
        { empName: { $regex: qaFilter, $options: "i" } },
      ];
    }
    if (orderFilter) {
      matchStage.orderNos = {
        $elemMatch: { $regex: orderFilter, $options: "i" },
      };
    }

    const reports = await FincheckInspectionReports.find(matchStage)
      .select(
        "reportType inspectionMethod inspectionDetails inspectionConfig defectData",
      )
      .lean();

    // Grouping Map: Key = "ReportType_Method"
    const groupMap = {};

    reports.forEach((report) => {
      const rType = report.reportType || "Unknown";
      const method = report.inspectionMethod || "Fixed";
      const key = `${rType}_${method}`;

      if (!groupMap[key]) {
        groupMap[key] = {
          reportType: rType,
          inspectionMethod: method,
          totalReports: 0,
          totalSample: 0, // Inspected Qty / Sample Size
          totalDefects: 0,
          minor: 0,
          major: 0,
          critical: 0,
          passCount: 0,
          failCount: 0,
        };
      }

      const group = groupMap[key];
      group.totalReports += 1;

      // 1. Calculate Sample Size based on User Rules
      let currentReportSample = 0;
      if (method === "AQL") {
        // For AQL: use inspectionDetails.aqlSampleSize
        currentReportSample = report.inspectionDetails?.aqlSampleSize || 0;
      } else {
        // For Fixed: use inspectionConfig.sampleSize
        currentReportSample = report.inspectionConfig?.sampleSize || 0;
      }
      group.totalSample += currentReportSample;

      // 2. Calculate Defects for this Report
      let rMinor = 0;
      let rMajor = 0;
      let rCritical = 0;

      if (report.defectData && Array.isArray(report.defectData)) {
        report.defectData.forEach((defect) => {
          const processQty = (qty, status) => {
            const q = parseInt(qty) || 0;
            if (status === "Minor") rMinor += q;
            else if (status === "Major") rMajor += q;
            else if (status === "Critical") rCritical += q;
          };

          if (defect.isNoLocation) {
            processQty(defect.qty, defect.status);
          } else if (defect.locations) {
            defect.locations.forEach((loc) => {
              if (loc.positions) {
                loc.positions.forEach((pos) => processQty(1, pos.status));
              }
            });
          }
        });
      }

      // Add to Group Totals
      group.minor += rMinor;
      group.major += rMajor;
      group.critical += rCritical;
      group.totalDefects += rMinor + rMajor + rCritical;

      // 3. Determine Pass/Fail Logic
      let isPass = true;

      if (method === "AQL") {
        // Logic: Compare counts against AQL Config Ac/Re limits
        const aqlItems = report.inspectionDetails?.aqlConfig?.items || [];

        // Find limits
        const minorLimit = aqlItems.find((i) => i.status === "Minor");
        const majorLimit = aqlItems.find((i) => i.status === "Major");
        const critLimit = aqlItems.find((i) => i.status === "Critical");

        // Check Minor
        if (minorLimit && rMinor > minorLimit.ac) isPass = false;
        // Check Major
        if (majorLimit && rMajor > majorLimit.ac) isPass = false;
        // Check Critical
        if (critLimit && rCritical > critLimit.ac) isPass = false;
      } else {
        // Logic for Fixed / Other: Strict Rule
        // Fail if Critical > 0 OR Major > 0
        if (rCritical > 0 || rMajor > 0) {
          isPass = false;
        }
      }

      if (isPass) {
        group.passCount += 1;
      } else {
        group.failCount += 1;
      }
    });

    // 4. Final Formatting & Rate Calculation
    const results = Object.values(groupMap).map((g) => {
      const defectRate =
        g.totalSample > 0
          ? ((g.totalDefects / g.totalSample) * 100).toFixed(2)
          : "0.00";

      const passRate =
        g.totalReports > 0
          ? ((g.passCount / g.totalReports) * 100).toFixed(2)
          : "0.00";

      return {
        ...g,
        defectRate,
        passRate,
      };
    });

    // Sort by Report Type
    results.sort((a, b) => a.reportType.localeCompare(b.reportType));

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error fetching report results:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Measurement Result Summary Dashboard
// ============================================================
export const getMeasurementResultSummary = async (req, res) => {
  try {
    const { startDate, endDate, reportType, buyer, qaFilter, orderFilter } =
      req.query;

    // Start with the shared match stage (date, reportType, buyer, status)
    const matchStage = buildMatchStage(startDate, endDate, reportType, buyer);

    // ── QA Filter: match empId OR empName (case-insensitive) ──────────────
    if (qaFilter) {
      matchStage.$or = [
        { empId: { $regex: qaFilter, $options: "i" } },
        { empName: { $regex: qaFilter, $options: "i" } },
      ];
    }

    // ── Order Filter: at least one orderNo matches ────────────────────────
    if (orderFilter) {
      matchStage.orderNos = {
        $elemMatch: { $regex: orderFilter, $options: "i" },
      };
    }

    // Only fetch reports that have at least one measurementData entry
    const reports = await FincheckInspectionReports.find({
      ...matchStage,
      "measurementData.0": { $exists: true },
    })
      .select("measurementData reportType inspectionMethod empId empName")
      .lean();

    // ── Aggregate across ALL reports ──────────────────────────────────────
    let totalReports = reports.length;
    let totalGroups = 0; // total measurement objects across all reports
    let totalConfigGroups = 0; // distinct groupIds across all reports
    let totalSizes = 0; // distinct size values across all reports
    let totalAllQty = 0; // sum of allQty
    let totalCriticalQty = 0; // sum of criticalQty
    let totalGroupPass = 0; // count of objects where inspectorDecision === "pass"
    let totalGroupFail = 0; // count of objects where inspectorDecision !== "pass"
    let totalPassReports = 0;
    let totalFailReports = 0;

    // Per-report breakdown for detail table
    const reportBreakdown = [];

    for (const report of reports) {
      const md = report.measurementData || [];
      if (md.length === 0) continue;

      // --- Per-report metrics ---
      const distinctGroupIds = new Set(md.map((m) => m.groupId));
      const distinctSizes = new Set(md.map((m) => m.size).filter(Boolean));

      let rAllQty = 0;
      let rCriticalQty = 0;
      let rGroupPass = 0;
      let rGroupFail = 0;
      let reportFailed = false;

      for (const item of md) {
        rAllQty += item.allQty || 0;
        rCriticalQty += item.criticalQty || 0;

        const decision = (item.inspectorDecision || "pass").toLowerCase();
        if (decision === "pass") {
          rGroupPass += 1;
        } else {
          rGroupFail += 1;
          reportFailed = true;
        }
      }

      // --- Accumulate globals ---
      totalGroups += md.length;
      totalConfigGroups += distinctGroupIds.size;
      totalSizes += distinctSizes.size;
      totalAllQty += rAllQty;
      totalCriticalQty += rCriticalQty;
      totalGroupPass += rGroupPass;
      totalGroupFail += rGroupFail;

      if (reportFailed) {
        totalFailReports += 1;
      } else {
        totalPassReports += 1;
      }

      reportBreakdown.push({
        reportType: report.reportType || "Unknown",
        empId: report.empId || "",
        empName: report.empName || "Unknown",
        groups: md.length,
        configGroups: distinctGroupIds.size,
        sizes: distinctSizes.size,
        allQty: rAllQty,
        criticalQty: rCriticalQty,
        totalQty: rAllQty + rCriticalQty,
        groupPass: rGroupPass,
        groupFail: rGroupFail,
        status: reportFailed ? "Fail" : "Pass",
      });
    }

    const totalCheckingPieces = totalAllQty + totalCriticalQty;
    const passRate =
      totalReports > 0
        ? ((totalPassReports / totalReports) * 100).toFixed(2)
        : "0.00";

    // --- Summary by Report Type ---
    const byReportType = {};
    for (const r of reportBreakdown) {
      const key = r.reportType;
      if (!byReportType[key]) {
        byReportType[key] = {
          reportType: key,
          totalReports: 0,
          passReports: 0,
          failReports: 0,
          totalGroups: 0,
          groupPass: 0,
          groupFail: 0,
          totalAllQty: 0,
          totalCritQty: 0,
        };
      }
      const g = byReportType[key];
      g.totalReports += 1;
      if (r.status === "Pass") g.passReports += 1;
      else g.failReports += 1;
      g.totalGroups += r.groups;
      g.groupPass += r.groupPass;
      g.groupFail += r.groupFail;
      g.totalAllQty += r.allQty;
      g.totalCritQty += r.criticalQty;
    }

    const byReportTypeArr = Object.values(byReportType).map((g) => ({
      ...g,
      passRate:
        g.totalReports > 0
          ? ((g.passReports / g.totalReports) * 100).toFixed(2)
          : "0.00",
      groupPassRate:
        g.totalGroups > 0
          ? ((g.groupPass / g.totalGroups) * 100).toFixed(2)
          : "0.00",
    }));

    byReportTypeArr.sort((a, b) => a.reportType.localeCompare(b.reportType));

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalReports,
          totalGroups,
          totalConfigGroups,
          totalSizes,
          totalAllQty,
          totalCriticalQty,
          totalCheckingPieces,
          totalGroupPass,
          totalGroupFail,
          totalPassReports,
          totalFailReports,
          passRate,
        },
        byReportType: byReportTypeArr,
      },
    });
  } catch (error) {
    console.error("Error fetching Measurement Result Summary:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Report List
// ============================================================

export const getDistinctReportTypes = async (req, res) => {
  try {
    const types = await FincheckInspectionReports.distinct("reportType", {
      status: { $ne: "cancelled" },
    });
    return res.status(200).json({ success: true, data: types.sort() });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Distinct Buyer List (For Autocomplete)
// ============================================================
export const getDistinctBuyers = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { status: { $ne: "cancelled" } };

    if (search) {
      query.buyer = { $regex: search, $options: "i" };
    }

    const buyers = await FincheckInspectionReports.distinct("buyer", query);

    // Sort alphabetically and limit if necessary (though distinct usually returns manageable lists)
    const sortedBuyers = buyers.filter((b) => b).sort(); // filter(b => b) removes null/empty

    return res.status(200).json({ success: true, data: sortedBuyers });
  } catch (error) {
    console.error("Error fetching buyers:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Distinct Order Nos (For Autocomplete)
// ============================================================
export const getDistinctOrders = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { status: { $ne: "cancelled" } };

    if (search) {
      // Find docs where ANY orderNo matches the search string
      query.orderNos = { $regex: search, $options: "i" };
    }

    // distinct will pull unique values from the orderNos array
    const orders = await FincheckInspectionReports.distinct("orderNos", query);

    // Filter out nulls, Sort, and Limit to top 50 to keep dropdown fast
    const sortedOrders = orders
      .filter((o) => o)
      .sort()
      .slice(0, 50);

    return res.status(200).json({ success: true, data: sortedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Distinct QA List (For Autocomplete)
// ============================================================

export const getDistinctQAs = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { status: { $ne: "cancelled" } };

    if (search) {
      query.$or = [
        { empId: { $regex: search, $options: "i" } },
        { empName: { $regex: search, $options: "i" } },
      ];
    }

    const reports = await FincheckInspectionReports.find(query)
      .select("empId empName")
      .lean();

    // Deduplicate by empId
    const seen = new Map();
    for (const r of reports) {
      if (r.empId && !seen.has(r.empId)) {
        seen.set(r.empId, r.empName || r.empId);
      }
    }

    const result = Array.from(seen.entries())
      .map(([empId, empName]) => ({ empId, empName }))
      .sort((a, b) => a.empName.localeCompare(b.empName));

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching QAs:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
