// OverAllSummaryCard.jsx
import React from "react";

const OverAllSummaryCard = ({ summary }) => {
  if (!summary) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Overall Summary</h2>
        <div className="text-center text-gray-500">No summary data available.</div>
      </div>
    );
  }

  const {
    orderNo, color, totalCheckedPcs, checkedQty, washQty, rejectedDefectPcs, totalDefectCount,
    defectRate, defectRatio, overallResult, passRate, measurementPoints, measurementPass,
    totalFail, measurementOverallResult, defectOverallResult
  } = summary;

  let resultColor = "text-green-600";
  let resultBgColor = "bg-green-50";
  if (overallResult === "Fail") {
    resultColor = "text-red-600";
    resultBgColor = "bg-red-50";
  } else if (overallResult === "N/A") {
    resultColor = "text-gray-600";
    resultBgColor = "bg-gray-50";
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
        Overall Summary {orderNo && <span className="text-base text-gray-500 ml-2">({orderNo} - {color})</span>}
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
              <span className="font-medium">Checked QTY:</span> {checkedQty}
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
    </div>
  );
};

export default OverAllSummaryCard;