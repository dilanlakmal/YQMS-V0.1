export const calculateOverallSummary = (data) => {
  const {
    defectDetails = {},
    measurementDetails = {},
    checkedQty = 0,
    ironingQty = 0,
    washQty = 0
  } = data;

  // 1. Calculate totalCheckedPcs from measurement data
  let totalCheckedPcs = 0;
  const measurementArray = measurementDetails.measurement || [];

  measurementArray.forEach((measurement) => {
    if (typeof measurement.qty === "number" && measurement.qty > 0) {
      totalCheckedPcs += measurement.qty;
    }
  });

  // Fallback to checkedQty if no measurement data
  if (totalCheckedPcs === 0) {
    totalCheckedPcs = parseInt(checkedQty, 10) || 0;
  }

  // 2. Calculate measurement points and passes
  let measurementPoints = 0;
  let measurementPass = 0;

  // Use measurementSizeSummary if available (most accurate)
  if (measurementDetails.measurementSizeSummary?.length > 0) {
    measurementDetails.measurementSizeSummary.forEach(sizeData => {
      measurementPoints += (sizeData.checkedPoints || 0);
      measurementPass += (sizeData.totalPass || 0);
    });
  } else {
    // Fallback: Calculate from measurement array
    measurementArray.forEach((data) => {
      if (Array.isArray(data.pcs)) {
        data.pcs.forEach((pc) => {
          if (Array.isArray(pc.measurementPoints)) {
            pc.measurementPoints.forEach((point) => {
              if (point.result === "pass" || point.result === "fail") {
                measurementPoints++;
                if (point.result === "pass") measurementPass++;
              }
            });
          }
        });
      }
    });
  }

  // 3. Calculate defect statistics
  const rejectedDefectPcs = Array.isArray(defectDetails.defectsByPc)
    ? defectDetails.defectsByPc.length
    : 0;

  const totalDefectCount = defectDetails.defectsByPc
    ? defectDetails.defectsByPc.reduce((sum, pc) => {
        return sum + (Array.isArray(pc.pcDefects)
          ? pc.pcDefects.reduce((defSum, defect) =>
              defSum + (parseInt(defect.defectQty, 10) || 0), 0)
          : 0);
      }, 0)
    : 0;

  // 4. Calculate rates
  const defectRate = totalCheckedPcs > 0
    ? Number(((totalDefectCount / totalCheckedPcs) * 100).toFixed(1))
    : 0;

  const defectRatio = totalCheckedPcs > 0
    ? Number(((rejectedDefectPcs / totalCheckedPcs) * 100).toFixed(1))
    : 0;

  const passRate = measurementPoints > 0
    ? Math.round((measurementPass / measurementPoints) * 100)
    : 100;

  // 5. SINGLE OVERALL RESULT CALCULATION
  const defectResult = defectDetails.result || "Pass";
  const overallFinalResult = (passRate >= 95 && defectResult === "Pass") ? "Pass" : "Fail";

  return {
    totalCheckedPcs,
    rejectedDefectPcs,
    totalDefectCount,
    defectRate,
    defectRatio,
    totalCheckedPoint: measurementPoints,
    totalPass: measurementPass,
    totalFail: measurementPoints - measurementPass,
    passRate,
    overallFinalResult,
    // For compatibility
    overallResult: overallFinalResult
  };
};
