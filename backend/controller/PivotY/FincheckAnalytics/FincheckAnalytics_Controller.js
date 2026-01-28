import {
  FincheckInspectionReports,
  UserMain,
  QASectionsProductLocation,
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

// ============================================================
// GET: Style Summary Analytics (Detailed)
// ============================================================

export const getStyleSummaryAnalytics = async (req, res) => {
  try {
    const { styleNo } = req.query;

    const query = { status: { $ne: "cancelled" } };
    if (styleNo) {
      query.orderNos = styleNo;
    }

    const reports = await FincheckInspectionReports.find(query)
      .select(
        "orderNos reportType inspectionMethod inspectionDetails inspectionConfig defectData productType productTypeId",
      )
      .populate("productTypeId", "imageURL")
      .lean();

    const styleMap = {};

    reports.forEach((report) => {
      // Calculate Sample Size
      let sampleSize = 0;
      if (report.inspectionMethod === "AQL") {
        sampleSize = report.inspectionDetails?.aqlSampleSize || 0;
      } else {
        sampleSize = report.inspectionConfig?.sampleSize || 0;
      }

      // Process Defects
      let reportTotalDefects = 0;
      let reportMinor = 0;
      let reportMajor = 0;
      let reportCritical = 0;
      const defectBreakdown = {};

      if (report.defectData && Array.isArray(report.defectData)) {
        report.defectData.forEach((defect) => {
          const name = defect.defectName;
          const code = defect.defectCode || "";
          const fullName = code ? `[${code}] ${name}` : name;

          const processQty = (qty, status) => {
            reportTotalDefects += qty;
            if (status === "Minor") reportMinor += qty;
            if (status === "Major") reportMajor += qty;
            if (status === "Critical") reportCritical += qty;

            if (!defectBreakdown[fullName]) {
              defectBreakdown[fullName] = {
                qty: 0,
                minor: 0,
                major: 0,
                critical: 0,
              };
            }
            defectBreakdown[fullName].qty += qty;
            if (status === "Minor") defectBreakdown[fullName].minor += qty;
            if (status === "Major") defectBreakdown[fullName].major += qty;
            if (status === "Critical")
              defectBreakdown[fullName].critical += qty;
          };

          if (defect.isNoLocation) {
            processQty(defect.qty || 0, defect.status);
          } else if (defect.locations) {
            defect.locations.forEach((loc) => {
              if (loc.positions) {
                loc.positions.forEach((pos) => {
                  processQty(1, pos.status);
                });
              }
            });
          }
        });
      }

      // Distribute to Styles
      if (report.orderNos && Array.isArray(report.orderNos)) {
        report.orderNos.forEach((orderNo) => {
          if (styleNo && orderNo !== styleNo) return;

          if (!styleMap[orderNo]) {
            styleMap[orderNo] = {
              style: orderNo,
              custStyle: report.inspectionDetails?.custStyle || "N/A",
              buyer: report.buyer || "N/A",
              orderQty: report.inspectionDetails?.totalOrderQty || 0,
              productType: report.productType || "N/A",
              productImage: report.productTypeId?.imageURL || null,

              totalReports: 0,
              totalSample: 0,
              totalDefects: 0,
              minor: 0,
              major: 0,
              critical: 0,

              reportsByType: {},
              defectsList: {},
            };
          }

          const entry = styleMap[orderNo];

          if (report.inspectionDetails?.custStyle)
            entry.custStyle = report.inspectionDetails.custStyle;
          if (report.buyer) entry.buyer = report.buyer;
          if (report.inspectionDetails?.totalOrderQty)
            entry.orderQty = report.inspectionDetails.totalOrderQty;
          if (report.productType) entry.productType = report.productType;
          if (report.productTypeId?.imageURL)
            entry.productImage = report.productTypeId.imageURL;

          entry.totalReports += 1;
          entry.totalSample += sampleSize;
          entry.totalDefects += reportTotalDefects;
          entry.minor += reportMinor;
          entry.major += reportMajor;
          entry.critical += reportCritical;

          const rType = report.reportType || "Unknown";
          if (!entry.reportsByType[rType]) {
            entry.reportsByType[rType] = {
              type: rType,
              count: 0,
              sample: 0,
              defects: 0,
              minor: 0,
              major: 0,
              critical: 0,
              defectsMap: {},
            };
          }
          const typeEntry = entry.reportsByType[rType];
          typeEntry.count += 1;
          typeEntry.sample += sampleSize;
          typeEntry.defects += reportTotalDefects;
          typeEntry.minor += reportMinor;
          typeEntry.major += reportMajor;
          typeEntry.critical += reportCritical;

          Object.entries(defectBreakdown).forEach(([key, val]) => {
            // Global List
            if (!entry.defectsList[key]) {
              entry.defectsList[key] = {
                name: key,
                qty: 0,
                minor: 0,
                major: 0,
                critical: 0,
              };
            }
            entry.defectsList[key].qty += val.qty;
            entry.defectsList[key].minor += val.minor;
            entry.defectsList[key].major += val.major;
            entry.defectsList[key].critical += val.critical;

            // Report Type List (Updated to track breakdown)
            if (!typeEntry.defectsMap[key]) {
              typeEntry.defectsMap[key] = {
                name: key,
                qty: 0,
                minor: 0,
                major: 0,
                critical: 0,
              };
            }
            typeEntry.defectsMap[key].qty += val.qty;
            typeEntry.defectsMap[key].minor += val.minor;
            typeEntry.defectsMap[key].major += val.major;
            typeEntry.defectsMap[key].critical += val.critical;
          });
        });
      }
    });

    if (styleNo) {
      const data = styleMap[styleNo];
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: "Style not found" });

      // Transform reportsByType map to array AND sort defects
      data.reportsByType = Object.values(data.reportsByType).map((typeData) => {
        const topDefects = Object.values(typeData.defectsMap) // Use values now, as it's an object
          .sort((a, b) => b.qty - a.qty);

        const { defectsMap, ...rest } = typeData;
        return { ...rest, topDefects };
      });

      data.defectsList = Object.values(data.defectsList).sort(
        (a, b) => b.qty - a.qty,
      );

      data.defectRate =
        data.totalSample > 0
          ? ((data.totalDefects / data.totalSample) * 100).toFixed(2)
          : "0.00";

      return res.status(200).json({ success: true, data });
    } else {
      const list = Object.values(styleMap)
        .map((s) => ({
          style: s.style,
          custStyle: s.custStyle,
          buyer: s.buyer,
        }))
        .sort((a, b) => a.style.localeCompare(b.style));

      return res.status(200).json({ success: true, data: list });
    }
  } catch (error) {
    console.error("Error fetching style summary:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Style Trend Analytics (Last 7 Days Logic)
// ============================================================
export const getStyleTrendAnalytics = async (req, res) => {
  try {
    const { styleNo, startDate, endDate } = req.query;

    if (!styleNo) {
      return res
        .status(400)
        .json({ success: false, message: "Style No required" });
    }

    // 1. Determine Date Range
    let start, end;

    if (startDate && endDate) {
      // User Provided Range
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default: Find Last Inspection Date for this Style
      const lastReport = await FincheckInspectionReports.findOne({
        orderNos: styleNo,
        status: { $ne: "cancelled" },
      })
        .sort({ inspectionDate: -1 })
        .select("inspectionDate");

      if (!lastReport) {
        return res.status(200).json({ success: true, data: [] }); // No data
      }

      end = new Date(lastReport.inspectionDate);
      end.setHours(23, 59, 59, 999);

      // Calculate Start (End - 7 days)
      start = new Date(end);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    }

    // 2. Aggregation Pipeline
    const pipeline = [
      {
        $match: {
          orderNos: styleNo,
          status: { $ne: "cancelled" },
          inspectionDate: { $gte: start, $lte: end },
        },
      },
      // Normalize Defects (Same robust logic as before)
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
                                  in: { qty: 1 },
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
          // Format Date
          dateKey: {
            $dateToString: { format: "%Y-%m-%d", date: "$inspectionDate" },
          },
        },
      },
      {
        $unwind: {
          path: "$normalizedDefects",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$dateKey",
          uniqueReports: { $addToSet: "$_id" },
          docs: {
            $addToSet: {
              id: "$_id",
              sample: "$calculatedSampleSize",
            },
          },
          totalDefects: { $sum: { $ifNull: ["$normalizedDefects.qty", 0] } },
        },
      },
      {
        $project: {
          date: "$_id",
          reportCount: { $size: "$uniqueReports" },
          totalDefects: 1,
          totalSample: { $sum: "$docs.sample" },
        },
      },
      { $sort: { date: 1 } },
    ];

    const data = await FincheckInspectionReports.aggregate(pipeline);

    // Filter out Sundays (JavaScript side)
    const filteredData = data.filter((d) => {
      const day = new Date(d.date).getDay();
      return day !== 0; // 0 is Sunday
    });

    return res.status(200).json({
      success: true,
      data: filteredData,
      // Return the calculated range so frontend can update its state
      range: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Error fetching style trend:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Style Summary Defect Location Map
// ============================================================
export const getStyleSummaryDefectMap = async (req, res) => {
  try {
    const { styleNo } = req.query;

    if (!styleNo) {
      return res
        .status(400)
        .json({ success: false, message: "Style No required" });
    }

    // 1. Fetch Reports for this Style
    // We need defectData and productTypeId to get the correct map image
    const reports = await FincheckInspectionReports.find({
      orderNos: styleNo,
      status: { $ne: "cancelled" },
    })
      .select("defectData productTypeId")
      .lean();

    if (reports.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }

    // 2. Determine Product Type (Use the most frequent one if mixed, or just the first valid one)
    const productTypeId = reports.find((r) => r.productTypeId)?.productTypeId;

    if (!productTypeId) {
      return res
        .status(200)
        .json({ success: true, data: null, message: "No product type found" });
    }

    // 3. Fetch Location Map Configuration
    const locationMap = await QASectionsProductLocation.findOne({
      productTypeId: productTypeId,
      isActive: true,
    }).lean();

    if (!locationMap) {
      return res
        .status(200)
        .json({ success: true, data: null, message: "No map config found" });
    }

    // 4. Aggregate Counts
    const counts = {
      Front: {},
      Back: {},
    };

    reports.forEach((report) => {
      if (report.defectData && Array.isArray(report.defectData)) {
        report.defectData.forEach((defect) => {
          if (!defect.isNoLocation && defect.locations) {
            defect.locations.forEach((loc) => {
              const locNo = loc.locationNo;
              const viewKey =
                loc.view && loc.view.toLowerCase() === "back"
                  ? "Back"
                  : "Front";

              // Calculate qty for this location instance
              // If positions array exists, sum them. Else use loc.qty
              let qty = 0;
              if (loc.positions && loc.positions.length > 0) {
                qty = loc.positions.length;
              } else {
                qty = loc.qty || 0;
              }

              const defectName = defect.defectName;

              // Initialize if not exists
              if (!counts[viewKey][locNo]) {
                counts[viewKey][locNo] = {
                  total: 0,
                  defects: {},
                };
              }

              // Add to totals
              counts[viewKey][locNo].total += qty;

              // Add to breakdown
              if (counts[viewKey][locNo].defects[defectName]) {
                counts[viewKey][locNo].defects[defectName] += qty;
              } else {
                counts[viewKey][locNo].defects[defectName] = qty;
              }
            });
          }
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        map: locationMap,
        counts: counts,
      },
    });
  } catch (error) {
    console.error("Error fetching style location map:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
