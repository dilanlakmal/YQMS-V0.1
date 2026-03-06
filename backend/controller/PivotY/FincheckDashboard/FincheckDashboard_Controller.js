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
    const { startDate, endDate, reportType, orderFilter, buyer } = req.query;

    // 1. Build Match Stage
    const matchStage = buildMatchStage(startDate, endDate, reportType, buyer);

    // 2. Apply Order Filter (Partial Match)
    if (orderFilter) {
      matchStage.orderNos = {
        $elemMatch: { $regex: orderFilter, $options: "i" },
      };
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
