import React from "react";

const DigitalMeasurementTotalSummary = ({ summaryData, decimalToFraction }) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4">
        Overall Measurement Point Summary
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded border table-auto">
          <thead>
            <tr className="bg-gray-200 text-sm">
              <th className="p-2 border">Measurement Point</th>
              <th className="p-2 border">Buyer Spec</th>
              <th className="p-2 border">Tol-</th>
              <th className="p-2 border">Tol+</th>
              <th className="p-2 border">Total Count</th>
              <th className="p-2 border">Total Pass</th>
              <th className="p-2 border">Total Fail</th>
              <th className="p-2 border">Pass Rate</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.length > 0 ? (
              summaryData.map((point, index) => (
                <tr key={index} className="text-center text-sm">
                  <td className="p-2 border">{point.measurementPoint}</td>
                  <td className="p-2 border">
                    {decimalToFraction(point.buyerSpec)}
                  </td>
                  <td className="p-2 border">
                    {decimalToFraction(point.tolMinus)}
                  </td>
                  <td className="p-2 border">
                    {decimalToFraction(point.tolPlus)}
                  </td>
                  <td className="p-2 border">{point.totalCount}</td>
                  <td className="p-2 border">{point.totalPass}</td>
                  <td className="p-2 border">{point.totalFail}</td>
                  <td className="p-2 border">{point.passRate}%</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">
                  No measurement points available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DigitalMeasurementTotalSummary;
