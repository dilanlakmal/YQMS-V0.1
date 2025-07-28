import React from "react";
import { WashingMachine, ClipboardCheck } from "lucide-react";

const OverAllSummaryCard = ({ summary }) => {
  if (!summary) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Overall Summary</h2>
        <div className="text-center text-gray-500">No summary data available.</div>
      </div>
    );
  }

  const {
    orderNo,
    color,
    totalCheckedPcs,
    checkedQty,
    washQty,
    rejectedDefectPcs,
    totalDefectCount,
    defectRate,
    defectRatio,
    overallFinalResult,
    overallResult,
  } = summary;

  let resultColor = "text-green-600 dark:text-green-400";
  let resultBgColor = "bg-green-50 dark:bg-green-900/50";
  if (overallResult === "Fail") {
    resultColor = "text-red-600 dark:text-red-400";
    resultBgColor = "bg-red-50 dark:bg-red-900/50";
  } else if (overallResult === "N/A") {
    resultColor = "text-gray-600 dark:text-gray-400";
    resultBgColor = "bg-gray-100 dark:bg-gray-700";
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Overall Summary{" "}
        {orderNo && (
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({orderNo} - {color})
          </span>
        )}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Checked Pcs
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {totalCheckedPcs || 0}
          </div>
          <div className="mt-2 flex justify-center items-center gap-2">
            <div className="flex items-center space-x-1.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full px-2 py-0.5 text-xs font-medium">
              <WashingMachine size={14} className="flex-shrink-0" />
              <span>{washQty || 0}</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full px-2 py-0.5 text-xs font-medium">
              <ClipboardCheck size={14} className="flex-shrink-0" />
              <span>{checkedQty || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/50 rounded-lg p-3 text-center">
          <div className="text-sm font-medium text-red-500 dark:text-red-400/80">
            Rejected Pcs
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {rejectedDefectPcs || 0}
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/50 rounded-lg p-3 text-center">
          <div className="text-sm font-medium text-purple-500 dark:text-purple-400/80">
            Defect Count
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {totalDefectCount || 0}
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/50 rounded-lg p-3 text-center">
          <div className="text-sm font-medium text-orange-500 dark:text-orange-400/80">
            Defect Rate
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
            {defectRate || 0}%
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/50 rounded-lg p-3 text-center">
          <div className="text-sm font-medium text-yellow-500 dark:text-yellow-400/80">
            Defect Ratio
          </div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
            {defectRatio || 0}%
          </div>
        </div>

        <div className={`${resultBgColor} dark:bg-gray-700 dark:border-gray-600 rounded-lg p-4 text-center`}>
          <div className="text-sm font-bold text-gray-800 dark:text-white mb-2">Overall Result</div>
          <div className={`text-2xl font-extrabold ${resultColor} dark:text-white`}>
            {overallResult}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverAllSummaryCard;
