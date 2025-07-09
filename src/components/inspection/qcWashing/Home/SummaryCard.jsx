import React from "react";

const SummaryCard = ({ measurementData, showMeasurementTable, reportType }) => {
  // Function to convert fraction to decimal
  const fractionToDecimal = (frac) => {
    if (typeof frac !== 'string' || !frac || frac.trim() === '-') return NaN;

    // Standardize fraction characters
    frac = frac
      .replace('⁄', '/')
      .replace('½', '1/2').replace('¼', '1/4').replace('¾', '3/4')
      .replace('⅛', '1/8').replace('⅜', '3/8').replace('⅝', '5/8').replace('⅞', '7/8')
      .trim();

    const isNegative = frac.startsWith('-');
    if (isNegative) {
      frac = frac.substring(1);
    }

    let total = 0;
    if (frac.includes('/')) {
      const parts = frac.split(' ');
      if (parts.length > 1 && parts[0]) {
        total += parseFloat(parts[0]);
      }
      const fractionPart = parts.length > 1 ? parts[1] : parts[0];
      const [num, den] = fractionPart.split('/').map(Number);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        total += num / den;
      } else {
        return NaN;
      }
    } else {
      total = parseFloat(frac);
    }

    if (isNaN(total)) return NaN;
    return isNegative ? -total : total;
  };

  // Calculate measurement points only
  let measurementPoints = 0;
  let measurementPass = 0;

  if (measurementData && typeof measurementData === "object") {
    // Determine which wash type to show based on reportType
    const washType = reportType === 'Before Wash' ? 'beforeWash' : 'afterWash';
    const currentMeasurements = measurementData[washType] || [];

    currentMeasurements.forEach((data) => {
      if (data.pcs && Array.isArray(data.pcs)) {
        data.pcs.forEach((pc) => {
          if (pc.measurementPoints && Array.isArray(pc.measurementPoints)) {
            pc.measurementPoints.forEach((point) => {
              // Only count measurement points that have actual values
              if (point.value && point.value !== "" && point.value !== "-") {
                measurementPoints++;

                // Use the same logic as the measurement table
                if (point.value && typeof point.value === 'object' && typeof point.value.decimal === 'number') {
                  const measuredDeviation = point.value.decimal;
                  const tolMinusValue = fractionToDecimal(point.toleranceMinus);
                  const tolPlusValue = fractionToDecimal(point.tolerancePlus);

                  if (!isNaN(tolMinusValue) && !isNaN(tolPlusValue)) {
                    // The deviation should be within the tolerance range
                    if (measuredDeviation >= tolMinusValue && measuredDeviation <= tolPlusValue) {
                      measurementPass++;
                    }
                  }
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
        Measurement Summary
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Measurement Points */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
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
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 rounded p-3">
          <div className="font-medium text-gray-700">
            Before Wash Measurements
          </div>
          <div className="text-gray-600">
            {measurementData.beforeWash ? measurementData.beforeWash.length : 0}{" "}
            sizes measured
          </div>
        </div>

        <div className="bg-gray-50 rounded p-3">
          <div className="font-medium text-gray-700">
            After Wash Measurements
          </div>
          <div className="text-gray-600">
            {measurementData.afterWash ? measurementData.afterWash.length : 0}{" "}
            sizes measured
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
