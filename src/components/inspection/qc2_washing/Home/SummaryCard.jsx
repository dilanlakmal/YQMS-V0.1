import React from "react";

const SummaryCard = ({ measurementData, showMeasurementTable, reportType }) => {
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

  // Calculate totals (only measurement data)
  const totalCheckedPoints = measurementPoints;
  const totalPass = measurementPass;
  const totalFail = measurementPoints - measurementPass;
  const passRate =
    measurementPoints > 0
      ? ((measurementPass / measurementPoints) * 100).toFixed(1)
      : 0;

  const overallResult =
    measurementPoints === 0
      ? "PENDING"
      : parseFloat(passRate) >= 90
      ? "PASS"
      : "FAIL";
  const resultColor =
    overallResult === "PASS"
      ? "text-green-600"
      : overallResult === "PENDING"
      ? "text-blue-600"
      : "text-red-600";
  const resultBgColor =
    overallResult === "PASS"
      ? "bg-green-50 border-green-200"
      : overallResult === "PENDING"
      ? "bg-blue-50 border-blue-200"
      : "bg-red-50 border-red-200";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
        Measurement Summary -{" "}
        <span className="text-indigo-600">{reportType}</span>
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {totalCheckedPoints}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Measurement Points
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-700 border border-green-200 dark:border-green-600 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold text-green-600 dark:text-green-400">
            {totalPass}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Pass</div>
        </div>

        <div className="bg-red-50 dark:bg-red-700 border border-red-200 dark:border-red-600 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold text-red-600 dark:text-red-400">
            {totalFail}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">Fail</div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-700 border border-yellow-200 dark:border-yellow-600 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
            {passRate}%
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">
            Pass Rate
          </div>
        </div>

        <div
          className={`${resultBgColor} dark:bg-gray-700 dark:border-gray-600 rounded-lg p-4 text-center`}
        >
          <div className={`text-4xl font-bold ${resultColor} dark:text-white`}>
            {overallResult}
          </div>
          <div className={`text-sm ${resultColor} dark:text-gray-300`}>
            Result
          </div>
        </div>
      </div>

      {/* Measurement Details Breakdown */}
      {/* <div className="mt-6 text-sm dark:text-gray-300">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-700 dark:text-gray-300">
            Breakdown for {reportType}
          </div>
          <div className="text-gray-600 dark:text-gray-400 mt-1">
            - {currentMeasurements.length} sizes measured
            <br />- {totalCheckedPoints} total measurement points checked
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default SummaryCard;
