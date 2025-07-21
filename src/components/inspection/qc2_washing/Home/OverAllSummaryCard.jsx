// OverAllSummaryCard.jsx
import React from "react";

const OverAllSummaryCard = ({
  measurementData,
  showMeasurementTable,
  reportType,
  defectDetails, // New prop for defect details
}) => {
  // Function to convert fraction to decimal (if needed, keep existing)

  // Calculate measurement points only (existing logic)
  let measurementPoints = 0;
  let measurementPass = 0;
  let currentMeasurements = [];

  if (measurementData && typeof measurementData === "object") {
    const washType = reportType === "Before Wash" ? "beforeWash" : "afterWash";
    currentMeasurements = measurementData[washType] || [];

    currentMeasurements.forEach((data) => {
      if (data.pcs && Array.isArray(data.pcs)) {
        data.pcs.forEach((pc) => {
          if (pc.measurementPoints && Array.isArray(pc.measurementPoints)) {
            pc.measurementPoints.forEach((point) => {
              if (point.result === "pass" || point.result === "fail") {
                measurementPoints++;
                if (point.result === "pass") {
                  measurementPass++;
                }
              }
            });
          }
        });
      }
    });
  }

  const totalCheckedPoints = measurementPoints;
  const totalPass = measurementPass;
  const totalFail = measurementPoints - measurementPass;
  const passRate =
    measurementPoints > 0
      ? ((measurementPass / measurementPoints) * 100).toFixed(2)
      : 0;

  // New Calculations based on defectDetails prop
  const totalCheckedPcs = defectDetails?.checkedQty || 0;
  const washQty = defectDetails?.washQty || 0;
  const rejectedDefectPcs = defectDetails?.result === "Fail" ? totalCheckedPcs : 0; // Assuming if defect result is 'Fail', all checked pcs are rejected
  
  const totalDefectCount = defectDetails?.defectsByPc.reduce((sum, pc) => {
    // Each defect entry in defectsByPc for a PC represents one defect instance.
    // So, we sum the length of defects array for each PC.
    return sum + (pc.defects ? pc.defects.length : 0);
  }, 0);

  const defectRate =
    totalCheckedPcs > 0
      ? ((totalDefectCount / totalCheckedPcs) * 100).toFixed(2)
      : 0;
  
  // Assuming defect ratio is total defects per total checked pieces (same as defect rate, but perhaps not percentage)
  const defectRatio = totalCheckedPcs > 0 ? (totalDefectCount / totalCheckedPcs).toFixed(2) : 0;


  // Overall Result Logic
  let overallResult = "Pass";
  let resultColor = "text-green-600";
  let resultBgColor = "bg-green-50";

  // Check if any measurement point failed
  const measurementOverallResult =
    totalFail > 0 ? "Fail" : "Pass";

  // Check defect overall result
  const defectOverallResult = defectDetails?.result || "N/A";

  if (measurementOverallResult === "Fail" || defectOverallResult === "Fail") {
    overallResult = "Fail";
    resultColor = "text-red-600";
    resultBgColor = "bg-red-50";
  } else if (measurementOverallResult === "Pass" && defectOverallResult === "Pass") {
    overallResult = "Pass";
    resultColor = "text-green-600";
    resultBgColor = "bg-green-50";
  } else {
    // If one is N/A and other is Pass, or both are N/A, consider it N/A or default to Pass if no fails
    overallResult = "N/A";
    resultColor = "text-gray-600";
    resultBgColor = "bg-gray-50";
  }


  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
        Overall Summary
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* Card 1: Total Checked PCs */}
        <div className="bg-blue-50 dark:bg-blue-700 border border-blue-200 dark:border-blue-600 rounded-lg p-1 text-center flex flex-col justify-between">
          <div>
            <div className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2">Total Checked PCs</div>
            <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">{totalCheckedPcs}</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-md text-blue-700 dark:text-blue-300">
              <span className="font-medium">Wash QTY:</span> {washQty}
            </div>
            <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-md text-blue-700 dark:text-blue-300">
              <span className="font-medium">Checked QTY:</span> {totalCheckedPcs}
            </div>
          </div>
        </div>

        {/* Card 2: Rejected (Defect) PCs */}
        <div className="bg-red-50 dark:bg-red-700 border border-red-200 dark:border-red-600 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Rejected (Defect) PCs</div>
          <div className="text-4xl font-extrabold text-red-600 dark:text-red-400">{rejectedDefectPcs}</div>
        </div>

        {/* Card 3: Total Defect Count */}
        <div className="bg-purple-50 dark:bg-purple-700 border border-purple-200 dark:border-purple-600 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-purple-800 dark:text-purple-200 mb-2">Total Defect Count</div>
          <div className="text-4xl font-extrabold text-purple-600 dark:text-purple-400">{totalDefectCount}</div>
        </div>

        {/* Card 4: Defect Rate */}
        <div className="bg-orange-50 dark:bg-orange-700 border border-orange-200 dark:border-orange-600 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-orange-800 dark:text-orange-200 mb-2">Defect Rate</div>
          <div className="text-4xl font-extrabold text-orange-600 dark:text-orange-400">{defectRate}%</div>
        </div>

        {/* Card 5: Defect Ratio */}
        <div className="bg-yellow-50 dark:bg-yellow-700 border border-yellow-200 dark:border-yellow-600 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">Defect Ratio</div>
          <div className="text-4xl font-extrabold text-yellow-600 dark:text-yellow-400">{defectRatio}</div>
        </div>

        {/* Card 6: Overall Result */}
        <div className={`${resultBgColor} dark:bg-gray-700 dark:border-gray-600 rounded-lg p-4 text-center`}>
          <div className="text-xl font-bold text-gray-800 dark:text-white mb-2">Overall Result</div>
          <div className={`text-4xl font-extrabold ${resultColor} dark:text-white`}>
            {overallResult}
          </div>
        </div>
      </div>

      {/* Existing Measurement Details Breakdown (optional, keep if needed) */}
      {/* {showMeasurementTable && ( */}
        {/* <div className="mt-6 text-sm dark:text-gray-300"> */}
          {/* <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3"> */}
            {/* <div className="font-medium text-gray-700 dark:text-gray-300"> */}
              {/* Breakdown for {reportType} */}
            {/* </div> */}
            {/* Render your measurement details table here */}
          {/* </div> */}
        {/* </div> */}
      {/* )} */}
    </div>
  );
};

export default OverAllSummaryCard;