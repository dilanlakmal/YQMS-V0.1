// AQL Single Sampling Plan for General Inspection Level II
// This table is structured to find a plan based on a given sample size.
const aqlSampleSizeTable = [
  { sampleSize: 2, codeLetter: "A", aql_1_0: { ac: 0, re: 1 } },
  { sampleSize: 3, codeLetter: "B", aql_1_0: { ac: 0, re: 1 } },
  { sampleSize: 5, codeLetter: "C", aql_1_0: { ac: 0, re: 1 } },
  { sampleSize: 8, codeLetter: "D", aql_1_0: { ac: 0, re: 1 } },
  { sampleSize: 13, codeLetter: "E", aql_1_0: { ac: 0, re: 1 } },
  { sampleSize: 20, codeLetter: "F", aql_1_0: { ac: 0, re: 1 } },
  { sampleSize: 32, codeLetter: "G", aql_1_0: { ac: 1, re: 2 } },
  { sampleSize: 50, codeLetter: "H", aql_1_0: { ac: 1, re: 2 } },
  { sampleSize: 80, codeLetter: "J", aql_1_0: { ac: 2, re: 3 } },
  { sampleSize: 125, codeLetter: "K", aql_1_0: { ac: 3, re: 4 } },
  { sampleSize: 200, codeLetter: "L", aql_1_0: { ac: 5, re: 6 } },
  { sampleSize: 315, codeLetter: "M", aql_1_0: { ac: 7, re: 8 } },
  { sampleSize: 500, codeLetter: "N", aql_1_0: { ac: 10, re: 11 } },
  { sampleSize: 800, codeLetter: "P", aql_1_0: { ac: 14, re: 15 } },
  { sampleSize: 1250, codeLetter: "Q", aql_1_0: { ac: 21, re: 22 } }
];

export const getAqlDetails = (sampleSize) => {
  if (typeof sampleSize !== "number" || isNaN(sampleSize) || sampleSize <= 0) {
    return { codeLetter: "N/A", sampleSize, ac: "N/A", re: "N/A" };
  }

  // Find the plan for the largest sample size that is LESS THAN OR EQUAL to the given sample size.
  let plan = null;
  for (let i = aqlSampleSizeTable.length - 1; i >= 0; i--) {
    if (aqlSampleSizeTable[i].sampleSize <= sampleSize) {
      plan = aqlSampleSizeTable[i];
      break;
    }
  }

  if (plan) {
    return {
      codeLetter: plan.codeLetter,
      sampleSize: plan.sampleSize, // Note: this is the standard sample size, not the user's input
      ac: plan.aql_1_0.ac,
      re: plan.aql_1_0.re
    };
  }

  // Fallback if smaller than the smallest sample size in table
  return { codeLetter: "N/A", sampleSize, ac: "N/A", re: "N/A" };
};

export const defectTypeWeights = {
  Minor: 1,
  Major: 1.5,
  Critical: 2
};

export const calculateAccuracy = (defects, totalCheckedQty, reportType) => {
  if (totalCheckedQty <= 0) {
    return {
      accuracy: 0,
      grade: "D",
      totalDefectPoints: 0,
      result: "Fail"
    };
  }

  if (!defects || defects.length === 0) {
    return {
      accuracy: 100,
      grade: "A",
      totalDefectPoints: 0,
      result: "Pass"
    };
  }

  const totalDefectPoints = defects.reduce((sum, defect) => {
    const weight = defectTypeWeights[defect.type] || 0;
    return sum + defect.qty * weight;
  }, 0);

  const accuracy = (1 - totalDefectPoints / totalCheckedQty) * 100;
  const finalAccuracy = Math.max(0, accuracy);

  // --- START OF MODIFICATION ---

  // Determine Grade (This logic remains for detailed reporting if needed)
  let grade = "D";
  if (reportType === "First Output") {
    if (finalAccuracy === 100) grade = "A";
    else if (finalAccuracy >= 80) grade = "B";
    else if (finalAccuracy >= 70) grade = "C";
    else grade = "D";
  } else {
    // Standard grading for other types
    if (finalAccuracy >= 95) grade = "A";
    else if (finalAccuracy >= 92.5) grade = "B";
    else if (finalAccuracy >= 90) grade = "C";
    else grade = "D";
  }

  // Determine Pass/Fail Result based ONLY on the accuracy score
  const result = finalAccuracy >= 95 ? "Pass" : "Fail";

  return {
    accuracy: parseFloat(finalAccuracy.toFixed(2)),
    grade, // Kept for potential detailed reports
    totalDefectPoints: parseFloat(totalDefectPoints.toFixed(2)),
    result // The new, simple Pass/Fail result
  };
  // --- END OF MODIFICATION ---
};
