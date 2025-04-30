import React from "react";

const QCSunriseSummaryCard = ({ summaryStats }) => {
  // Determine background color for defect rate card
  const getDefectRateColor = (rate) => {
    if (rate > 5) return "bg-red-100";
    if (rate >= 3 && rate <= 5) return "bg-orange-100";
    return "bg-green-100";
  };

  // Helper function to format numbers with thousands separators
  const formatNumber = (num) => {
    // Ensure it's a number, default to 0 if not
    const number = Number(num) || 0;
    return number.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
      {/* Checked Qty Card */}
      <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Checked Qty</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {formatNumber(summaryStats.totalCheckedQty)}
          </p>
        </div>
      </div>

      {/* Defects Qty Card */}
      <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Defects Qty</h3>
          <p className="text-3xl font-bold text-red-600">
            {formatNumber(summaryStats.totalDefectsQty)}
          </p>
        </div>
      </div>

      {/* Defect Rate Card */}
      <div
        className={`p-6 rounded-lg shadow-md flex items-center ${getDefectRateColor(
          summaryStats.defectRate
        )}`}
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Defect Rate</h3>
          <p className="text-3xl font-bold text-gray-800">
            {/* Defect rate is usually a percentage, formatting might not be needed unless it gets very large */}
            {summaryStats.defectRate}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default QCSunriseSummaryCard;
