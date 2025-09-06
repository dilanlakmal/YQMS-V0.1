import React from "react";
import PropTypes from "prop-types";
import { WashingMachine, ClipboardCheck } from "lucide-react";

const OverAllSummaryCard = ({ summary }) => {
  if (!summary) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
          Overall Summary
        </h2>
        <div className="text-center text-gray-500 dark:text-gray-300">
          No summary data available.
        </div>
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
    defectDetails,
    measurementDetails
  } = summary;

  // Calculate overall result dynamically based on current data
  const calculateOverallResult = () => {
    const defectResult = defectDetails?.result || "Pass";

    // Calculate overall measurement result from measurementSizeSummary
    let measurementResult = "Pass";
    let calculatedPassRate = 100;
    let totalPassPoints = 0;
    let totalFailPoints = 0;

    // Check if measurementSizeSummary exists in the data structure
    if (measurementDetails?.measurementSizeSummary?.length > 0) {
      // Use the measurementSizeSummary data directly
      measurementDetails.measurementSizeSummary.forEach((sizeData) => {
        totalPassPoints += sizeData.totalPass || 0;
        totalFailPoints += sizeData.totalFail || 0;
      });
    } else if (measurementDetails?.measurement?.length > 0) {
      // Fallback: Calculate from measurement array if measurementSizeSummary doesn't exist
      measurementDetails.measurement.forEach((data) => {
        if (data.pcs && Array.isArray(data.pcs)) {
          data.pcs.forEach((pc) => {
            if (pc.measurementPoints && Array.isArray(pc.measurementPoints)) {
              pc.measurementPoints.forEach((point) => {
                if (point.result === "pass") {
                  totalPassPoints++;
                } else if (point.result === "fail") {
                  totalFailPoints++;
                }
              });
            }
          });
        }
      });
    }

    const totalPoints = totalPassPoints + totalFailPoints;

    if (totalPoints > 0) {
      calculatedPassRate = (totalPassPoints / totalPoints) * 100;
      // You can adjust this threshold as needed (currently set to 95%)
      measurementResult = calculatedPassRate >= 95 ? "Pass" : "Fail";
    } else {
      // If no measurement points, consider it as Pass (or adjust based on your business logic)
      measurementResult = "Pass";
      calculatedPassRate = 100;
    }

    // Overall result is Pass only if both defect and measurement results are Pass
    const overallResult =
      defectResult === "Pass" && measurementResult === "Pass" ? "Pass" : "Fail";

    return {
      overallResult,
      calculatedPassRate: Number(calculatedPassRate.toFixed(1)),
      measurementResult,
      defectResult,
      totalMeasurementPoints: totalPoints,
      totalMeasurementPass: totalPassPoints,
      totalMeasurementFail: totalFailPoints
    };
  };

  const {
    overallResult,
    calculatedPassRate,
    measurementResult,
    defectResult,
    totalMeasurementPoints,
    totalMeasurementPass,
    totalMeasurementFail
  } = calculateOverallResult();

  // Use calculated pass rate instead of saved one
  const displayPassRate = calculatedPassRate;

  let resultColor = "text-green-600 dark:text-green-400";
  let resultBgColor = "bg-green-50 dark:bg-green-900/50";
  if (overallResult === "Fail") {
    resultColor = "text-red-600 dark:text-red-400";
    resultBgColor = "bg-red-50 dark:bg-red-900/50";
  } else if (overallResult === "N/A" || overallResult === "Pending") {
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

        <div
          className={`${resultBgColor} dark:bg-gray-700 dark:border-gray-600 rounded-lg p-4 text-center`}
        >
          <div className="text-sm font-bold text-gray-800 dark:text-white mb-2">
            Overall Result
          </div>
          <div
            className={`text-2xl font-extrabold ${resultColor} dark:text-white`}
          >
            {overallResult}
          </div>
        </div>
      </div>
    </div>
  );
};

OverAllSummaryCard.propTypes = {
  summary: PropTypes.shape({
    orderNo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    color: PropTypes.string,
    totalCheckedPcs: PropTypes.number,
    checkedQty: PropTypes.number,
    washQty: PropTypes.number,
    rejectedDefectPcs: PropTypes.number,
    totalDefectCount: PropTypes.number,
    defectRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    defectRatio: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    overallFinalResult: PropTypes.string,
    defectDetails: PropTypes.object,
    measurementDetails: PropTypes.oneOfType([PropTypes.object, PropTypes.array])
  })
};

export default OverAllSummaryCard;
