import React from "react";

const SummaryCard = ({ measurementData, showMeasurementTable, reportType }) => {
  // Function to convert fraction to decimal

  // Calculate measurement points only
  let measurementPoints = 0;
  let measurementPass = 0;
  let currentMeasurements = [];

  if (measurementData && typeof measurementData === "object") {
    // Determine which wash type to show based on reportType
    const washType = reportType === 'Before Wash' ? 'beforeWash' : 'afterWash';
    currentMeasurements = measurementData[washType] || [];

    currentMeasurements.forEach((data) => {
      if (data.pcs && Array.isArray(data.pcs)) {
        data.pcs.forEach((pc) => {
          if (pc.measurementPoints && Array.isArray(pc.measurementPoints)) {
            pc.measurementPoints.forEach((point) => {
              // Use the pre-calculated 'result' field from the measurement point.
              // This ensures consistency with the details table and handles all cases (including 0).
              if (point.result === 'pass' || point.result === 'fail') {
                measurementPoints++;
                if (point.result === 'pass') {
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

  // Determine overall result (pass if pass rate >= 80% OR if no measurements have been entered yet)
  const overallResult =
    measurementPoints === 0
      ? "PENDING"
      : parseFloat(passRate) >= 80
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Measurement Summary -{" "}
        <span className="text-indigo-600">{reportType}</span>
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Measurement Points */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {totalCheckedPoints}
          </div>
          <div className="text-sm text-blue-700">Total Measurement Points</div>
        </div>

        {/* Total Pass */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalPass}</div>
          <div className="text-sm text-green-700">Total Pass</div>
        </div>

        {/* Total Fail */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{totalFail}</div>
          <div className="text-sm text-red-700">Total Fail</div>
        </div>

        {/* Pass Rate */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{passRate}%</div>
          <div className="text-sm text-yellow-700">Pass Rate</div>
        </div>

        {/* Overall Result */}
        <div className={`${resultBgColor} rounded-lg p-4 text-center`}>
          <div className={`text-2xl font-bold ${resultColor}`}>
            {overallResult}
          </div>
          <div className={`text-sm ${resultColor}`}>Result</div>
        </div>
      </div>

      {/* Measurement Details Breakdown */}
      <div className="mt-6 text-sm">
        <div className="bg-gray-100 rounded-lg p-3">
          <div className="font-medium text-gray-700">
            Breakdown for {reportType}
          </div>
          <div className="text-gray-600 mt-1">
            - {currentMeasurements.length} sizes measured
            <br />- {totalCheckedPoints} total measurement points checked
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
