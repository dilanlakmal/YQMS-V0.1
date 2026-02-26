import {
  CuttingInspection,
  CuttingFabricDefect,
  CuttingIssue,
} from "../../MongoDB/dbConnectionController.js";

// =========================================================
// 1. GET DISTINCT DATES
// =========================================================
export const getInspectionDates = async (req, res) => {
  try {
    const dates = await CuttingInspection.distinct("inspectionDate");

    if (!dates || dates.length === 0) {
      return res.status(200).json([]);
    }

    // Sort dates descending (newest first)
    // Handle date format: "M/D/YYYY" without leading zeros
    const sortedDates = dates.sort((a, b) => {
      try {
        const parseDate = (dateStr) => {
          if (!dateStr) return new Date(0);
          const parts = dateStr.split("/");
          if (parts.length !== 3) return new Date(0);
          return new Date(
            parseInt(parts[2]),
            parseInt(parts[0]) - 1,
            parseInt(parts[1]),
          );
        };
        return parseDate(b) - parseDate(a);
      } catch (e) {
        return 0;
      }
    });

    res.status(200).json(sortedDates);
  } catch (error) {
    console.error("Error fetching inspection dates:", error);
    res.status(500).json({
      message: "Failed to fetch dates",
      error: error.message,
    });
  }
};

// =========================================================
// 2. GET DISTINCT MO NUMBERS (Filtered by Date)
// =========================================================
export const getMosByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date parameter is required" });
    }

    const mos = await CuttingInspection.find({
      inspectionDate: date,
    }).distinct("moNo");

    mos.sort((a, b) =>
      String(a).localeCompare(String(b), undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

    res.status(200).json(mos);
  } catch (error) {
    console.error("Error fetching MOs:", error);
    res.status(500).json({
      message: "Failed to fetch MO numbers",
      error: error.message,
    });
  }
};

// =========================================================
// 3. GET DISTINCT TABLES (Filtered by Date & MO)
// =========================================================
export const getTablesByDateAndMo = async (req, res) => {
  try {
    const { date, moNo } = req.query;

    if (!date || !moNo) {
      return res
        .status(400)
        .json({ message: "Date and MO parameters are required" });
    }

    const tables = await CuttingInspection.find({
      inspectionDate: date,
      moNo: moNo,
    }).distinct("tableNo");

    tables.sort((a, b) =>
      String(a).localeCompare(String(b), undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

    res.status(200).json(tables);
  } catch (error) {
    console.error("Error fetching tables:", error);
    res.status(500).json({
      message: "Failed to fetch tables",
      error: error.message,
    });
  }
};

// =========================================================
// 4. GET FULL REPORT (For Modification)
// =========================================================
export const getFullInspectionReport = async (req, res) => {
  try {
    const { date, moNo, tableNo } = req.query;

    if (!date || !moNo || !tableNo) {
      return res.status(400).json({
        message: "Missing required parameters: date, moNo, tableNo",
      });
    }

    const report = await CuttingInspection.findOne({
      inspectionDate: date,
      moNo: moNo,
      tableNo: tableNo,
    });

    if (!report) {
      return res.status(404).json({ message: "Inspection report not found" });
    }

    res.status(200).json(report);
  } catch (error) {
    console.error("Error fetching full report:", error);
    res.status(500).json({
      message: "Failed to fetch report",
      error: error.message,
    });
  }
};

// =========================================================
// 5. UPDATE FULL REPORT (Deep Save)
// =========================================================
export const updateFullInspectionReport = async (req, res) => {
  try {
    const reportData = req.body;

    if (!reportData._id) {
      return res.status(400).json({ message: "Document ID is missing" });
    }

    const { _id, __v, ...updateData } = reportData;

    updateData.updated_at = new Date();

    // Recalculate summary statistics for each size
    if (updateData.inspectionData) {
      updateData.inspectionData.forEach((sizeData) => {
        let sizeTotals = {
          pcs: { total: 0, top: 0, middle: 0, bottom: 0 },
          pass: { total: 0, top: 0, middle: 0, bottom: 0 },
          reject: { total: 0, top: 0, middle: 0, bottom: 0 },
          rejectGarment: { total: 0, top: 0, middle: 0, bottom: 0 },
          rejectMeasurement: { total: 0, top: 0, middle: 0, bottom: 0 },
        };

        sizeData.bundleInspectionData?.forEach((bundle) => {
          const bundleTotals = calculateBundleStatistics(
            bundle,
            sizeData.tolerance,
          );

          // Update bundle data
          bundle.pcs = bundleTotals.pcs;
          bundle.pass = bundleTotals.pass;
          bundle.reject = bundleTotals.reject;
          bundle.rejectGarment = bundleTotals.rejectGarment;
          bundle.rejectMeasurement = bundleTotals.rejectMeasurement;
          bundle.passrate = bundleTotals.passrate;

          // Accumulate size totals
          ["top", "middle", "bottom"].forEach((loc) => {
            sizeTotals.pcs[loc] += bundleTotals.pcs[loc];
            sizeTotals.pass[loc] += bundleTotals.pass[loc];
            sizeTotals.reject[loc] += bundleTotals.reject[loc];
            sizeTotals.rejectGarment[loc] += bundleTotals.rejectGarment[loc];
            sizeTotals.rejectMeasurement[loc] +=
              bundleTotals.rejectMeasurement[loc];
          });
        });

        // Calculate totals
        ["pcs", "pass", "reject", "rejectGarment", "rejectMeasurement"].forEach(
          (key) => {
            sizeTotals[key].total =
              sizeTotals[key].top +
              sizeTotals[key].middle +
              sizeTotals[key].bottom;
          },
        );

        // Update size data
        sizeData.pcsSize = sizeTotals.pcs;
        sizeData.passSize = sizeTotals.pass;
        sizeData.rejectSize = sizeTotals.reject;
        sizeData.rejectGarmentSize = sizeTotals.rejectGarment;
        sizeData.rejectMeasurementSize = sizeTotals.rejectMeasurement;

        // Calculate pass rate
        sizeData.passrateSize = {
          top:
            sizeTotals.pcs.top > 0
              ? parseFloat(
                  ((sizeTotals.pass.top / sizeTotals.pcs.top) * 100).toFixed(2),
                )
              : 0,
          middle:
            sizeTotals.pcs.middle > 0
              ? parseFloat(
                  (
                    (sizeTotals.pass.middle / sizeTotals.pcs.middle) *
                    100
                  ).toFixed(2),
                )
              : 0,
          bottom:
            sizeTotals.pcs.bottom > 0
              ? parseFloat(
                  (
                    (sizeTotals.pass.bottom / sizeTotals.pcs.bottom) *
                    100
                  ).toFixed(2),
                )
              : 0,
          total:
            sizeTotals.pcs.total > 0
              ? parseFloat(
                  (
                    (sizeTotals.pass.total / sizeTotals.pcs.total) *
                    100
                  ).toFixed(2),
                )
              : 0,
        };

        // Update updated_at for each size
        sizeData.updated_at = new Date();
      });
    }

    const updatedReport = await CuttingInspection.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true, runValidators: false },
    );

    if (!updatedReport) {
      return res
        .status(404)
        .json({ message: "Report not found or update failed" });
    }

    res.status(200).json({
      message: "Inspection report updated successfully",
      data: updatedReport,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({
      message: "Failed to update report",
      error: error.message,
    });
  }
};

// Helper function to calculate bundle statistics
function calculateBundleStatistics(bundle, tolerance) {
  const result = {
    pcs: { total: 0, top: 0, middle: 0, bottom: 0 },
    pass: { total: 0, top: 0, middle: 0, bottom: 0 },
    reject: { total: 0, top: 0, middle: 0, bottom: 0 },
    rejectGarment: { total: 0, top: 0, middle: 0, bottom: 0 },
    rejectMeasurement: { total: 0, top: 0, middle: 0, bottom: 0 },
    passrate: { total: 0, top: 0, middle: 0, bottom: 0 },
  };

  const locations = ["Top", "Middle", "Bottom"];
  const locKeys = ["top", "middle", "bottom"];

  // Get unique part indices to count PCS correctly
  const partCount = bundle.measurementInsepctionData?.length || 0;
  if (partCount === 0) return result;

  // Use the first part to determine PCS count per location
  const firstPart = bundle.measurementInsepctionData[0];

  locations.forEach((loc, locIdx) => {
    const locKey = locKeys[locIdx];

    // Get PCS count from first part's measurements for this location
    const measurementLocation =
      firstPart?.measurementPointsData?.[0]?.measurementValues?.find(
        (mv) => mv.location === loc,
      );

    const pcsCount = measurementLocation?.measurements?.length || 0;
    result.pcs[locKey] = pcsCount;

    // Check each PCS for failures
    for (let pcsIdx = 0; pcsIdx < pcsCount; pcsIdx++) {
      let hasMeasurementFail = false;
      let hasDefectFail = false;

      // Check all parts and their measurement points for this PCS
      bundle.measurementInsepctionData?.forEach((part) => {
        // Check measurement points
        part.measurementPointsData?.forEach((point) => {
          const pointLoc = point.measurementValues?.find(
            (mv) => mv.location === loc,
          );
          const measurement = pointLoc?.measurements?.[pcsIdx];

          if (measurement) {
            const val = measurement.valuedecimal;
            if (val !== 0 && (val < tolerance.min || val > tolerance.max)) {
              hasMeasurementFail = true;
            }
          }
        });

        // Check defects for this PCS
        const defectLoc = part.fabricDefects?.find((fd) => fd.location === loc);
        const defectData = defectLoc?.defectData?.[pcsIdx];
        if (defectData?.totalDefects > 0) {
          hasDefectFail = true;
        }
      });

      if (hasMeasurementFail || hasDefectFail) {
        result.reject[locKey]++;
        if (hasMeasurementFail) result.rejectMeasurement[locKey]++;
        if (hasDefectFail) result.rejectGarment[locKey]++;
      } else {
        result.pass[locKey]++;
      }
    }
  });

  // Calculate totals
  ["pcs", "pass", "reject", "rejectGarment", "rejectMeasurement"].forEach(
    (key) => {
      result[key].total =
        result[key].top + result[key].middle + result[key].bottom;
    },
  );

  // Calculate pass rates
  locKeys.forEach((locKey) => {
    result.passrate[locKey] =
      result.pcs[locKey] > 0
        ? parseFloat(
            ((result.pass[locKey] / result.pcs[locKey]) * 100).toFixed(2),
          )
        : 0;
  });
  result.passrate.total =
    result.pcs.total > 0
      ? parseFloat(((result.pass.total / result.pcs.total) * 100).toFixed(2))
      : 0;

  return result;
}

// =========================================================
// 6. GET FABRIC DEFECTS LIST
// =========================================================
export const getFabricDefectsList = async (req, res) => {
  try {
    const defects = await CuttingFabricDefect.find().sort({ defectName: 1 });
    res.status(200).json(defects);
  } catch (error) {
    console.error("Error fetching fabric defects:", error);
    res.status(500).json({
      message: "Failed to fetch fabric defects",
      error: error.message,
    });
  }
};

// =========================================================
// 7. GET CUTTING ISSUES LIST
// =========================================================
export const getCuttingIssuesList = async (req, res) => {
  try {
    const issues = await CuttingIssue.find().sort({ no: 1 });
    res.status(200).json(issues);
  } catch (error) {
    console.error("Error fetching cutting issues:", error);
    res.status(500).json({
      message: "Failed to fetch cutting issues",
      error: error.message,
    });
  }
};

// =========================================================
// GET INSPECTION AQL STATUS
// =========================================================
export const getInspectionAQLStatus = async (req, res) => {
  try {
    const { date, moNo, tableNo } = req.query;

    if (!date || !moNo || !tableNo) {
      return res.status(400).json({
        message: "Missing required parameters: date, moNo, tableNo",
      });
    }

    const report = await CuttingInspection.findOne({
      inspectionDate: date,
      moNo: moNo,
      tableNo: tableNo,
    });

    if (!report) {
      return res.status(404).json({ message: "Inspection report not found" });
    }

    // Calculate totals from all sizes
    let totalReject = 0;
    let totalInspectedQty = 0;

    report.inspectionData?.forEach((sizeData) => {
      // Use totalPcsSize (not pcsSize.total) as per schema
      totalReject += sizeData.rejectSize?.total || 0;
      totalInspectedQty += sizeData.totalPcsSize || 0;
    });

    // Get required inspection qty from top level
    const totalInspectionQty = report.totalInspectionQty || 0;

    // AQL Logic
    let status = "Pending";
    let passed = null;
    let acceptableDefects = 0;

    // Check if inspection is complete (sum of totalPcsSize >= totalInspectionQty)
    if (totalInspectedQty < totalInspectionQty) {
      // Inspection not yet complete
      status = "Pending";
      passed = null;
      acceptableDefects = null;
    } else {
      // Inspection complete - apply AQL logic based on totalInspectionQty
      if (totalInspectionQty < 30) {
        // Below minimum sample size
        acceptableDefects = 0;
        passed = totalReject <= acceptableDefects;
        status = passed ? "Pass" : "Fail";
      } else if (totalInspectionQty >= 30 && totalInspectionQty < 45) {
        acceptableDefects = 0;
        passed = totalReject <= acceptableDefects;
        status = passed ? "Pass" : "Fail";
      } else if (totalInspectionQty >= 45 && totalInspectionQty < 60) {
        acceptableDefects = 0;
        passed = totalReject <= acceptableDefects;
        status = passed ? "Pass" : "Fail";
      } else if (totalInspectionQty >= 60 && totalInspectionQty < 90) {
        acceptableDefects = 1;
        passed = totalReject <= acceptableDefects;
        status = passed ? "Pass" : "Fail";
      } else if (totalInspectionQty >= 90 && totalInspectionQty < 135) {
        acceptableDefects = 2;
        passed = totalReject <= acceptableDefects;
        status = passed ? "Pass" : "Fail";
      } else if (totalInspectionQty >= 135 && totalInspectionQty < 210) {
        acceptableDefects = 3;
        passed = totalReject <= acceptableDefects;
        status = passed ? "Pass" : "Fail";
      } else if (totalInspectionQty >= 210 && totalInspectionQty < 315) {
        acceptableDefects = 5;
        passed = totalReject <= acceptableDefects;
        status = passed ? "Pass" : "Fail";
      } else if (totalInspectionQty >= 315) {
        acceptableDefects = 7;
        passed = totalReject <= acceptableDefects;
        status = passed ? "Pass" : "Fail";
      }
    }

    res.status(200).json({
      status,
      passed,
      totalInspectionQty,
      totalInspectedQty,
      totalReject,
      aqlDetails: {
        sampleSize: totalInspectionQty,
        acceptableDefects,
        actualDefects: totalReject,
      },
    });
  } catch (error) {
    console.error("Error calculating AQL status:", error);
    res.status(500).json({
      message: "Failed to calculate AQL status",
      error: error.message,
    });
  }
};
