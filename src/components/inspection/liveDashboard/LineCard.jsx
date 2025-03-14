import { Archive, CheckCircle, List, PackageX, XCircle } from "lucide-react";
import React, { useState } from "react";

const LineCard = ({ lineNo, lineDefectRates }) => {
  const [showMore, setShowMore] = useState(false);

  const toggleMore = () => {
    setShowMore(!showMore);
  };

  // Compute summary data from lineDefectRates for this lineNo
  const summaryData = (() => {
    const lineData = {
      checkedQty: 0,
      defectsQty: 0,
      defectArray: [],
      totalPass: 0,
      totalRejects: 0,
      totalBundles: 0,
      defectiveBundles: 0,
      defectRate: 0,
      defectRatio: 0
    };

    const moData = lineDefectRates[lineNo] || {};
    Object.keys(moData).forEach((moNo) => {
      if (moNo !== "totalRate") {
        Object.keys(moData[moNo]).forEach((hour) => {
          if (hour !== "totalRate") {
            const hourData = moData[moNo][hour];
            lineData.checkedQty += hourData.checkedQty || 0;
            const hourDefectsQty = hourData.defects.reduce(
              (sum, defect) => sum + defect.count,
              0
            );
            lineData.defectsQty += hourDefectsQty;
            lineData.defectArray = [
              ...lineData.defectArray,
              ...hourData.defects.map((defect) => ({
                defectName: defect.name,
                totalCount: defect.count
              }))
            ];
          }
        });
      }
    });

    lineData.totalPass = lineData.checkedQty - lineData.defectsQty;
    lineData.totalRejects = lineData.defectsQty;
    lineData.totalBundles = lineData.checkedQty > 0 ? 1 : 0; // Simplified
    lineData.defectiveBundles = lineData.defectsQty > 0 ? 1 : 0; // Simplified
    lineData.defectRate =
      lineData.checkedQty > 0 ? lineData.defectsQty / lineData.checkedQty : 0;
    lineData.defectRatio = lineData.defectRate;

    return lineData;
  })();

  // Calculate defect rate background color
  const defectRate = summaryData.defectRate * 100;
  const defectRateColor =
    defectRate > 3
      ? "bg-red-200 text-red-800"
      : defectRate >= 2
      ? "bg-yellow-200 text-yellow-800"
      : "bg-green-200 text-green-800";

  // Aggregate defect counts from defectArray for this Line No
  const defectTotals = summaryData.defectArray.reduce((acc, defect) => {
    acc[defect.defectName] = (acc[defect.defectName] || 0) + defect.totalCount;
    return acc;
  }, {});

  // Convert to array and calculate defect rates
  const totalCheckedQty = summaryData.checkedQty || 1; // Avoid division by zero
  const topDefectRates = Object.entries(defectTotals)
    .map(([defectName, totalCount]) => ({
      defectName,
      totalCount,
      defectRate: totalCount / totalCheckedQty
    }))
    .sort((a, b) => b.defectRate - a.defectRate)
    .slice(0, 5);

  // Format Line No as L:1, L:2, L:Sub, etc. (only for display)
  const formattedLineNo = `L:${lineNo}`;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 flex flex-col w-full max-w-sm relative">
      {/* Defect Rate Box (Top Right) */}
      <div
        className={`absolute top-2 right-2 ${defectRateColor} px-3 py-1 rounded text-lg font-bold`}
      >
        {(summaryData.defectRate * 100).toFixed(2)}%
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-800 mb-1">
        {formattedLineNo}
      </h3>

      {/* Defect Ratio (Left Below Title) */}
      <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm inline-block mb-4">
        Defect Ratio: {(summaryData.defectRatio * 100).toFixed(2)}%
      </div>

      {/* More Button */}
      <button
        onClick={toggleMore}
        className="text-blue-500 hover:underline text-sm text-center mb-2"
      >
        {showMore ? "- Less" : "+ More..."}
      </button>

      {/* Summary Data and Top 5 Defects (Inside More) */}
      {showMore && (
        <div className="mt-2">
          {/* Summary Data */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center">
              <CheckCircle className="text-green-500 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600">Checked Qty</p>
                <p className="text-lg font-bold text-gray-900">
                  {summaryData.checkedQty}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <CheckCircle className="text-green-500 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600">Total Pass</p>
                <p className="text-lg font-bold text-gray-900">
                  {summaryData.totalPass}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <List className="text-yellow-500 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600">Defect Qty</p>
                <p className="text-lg font-bold text-gray-900">
                  {summaryData.defectsQty}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <XCircle className="text-red-500 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600">Reject Garments</p>
                <p className="text-lg font-bold text-gray-900">
                  {summaryData.totalRejects}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Archive className="text-blue-500 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600">No of Bundles</p>
                <p className="text-lg font-bold text-gray-900">
                  {summaryData.totalBundles}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <PackageX className="text-orange-500 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600">Defective Bundles</p>
                <p className="text-lg font-bold text-gray-900">
                  {summaryData.defectiveBundles}
                </p>
              </div>
            </div>
          </div>

          {/* Top 5 Defect Rates */}
          {topDefectRates.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Top 5 Defect Rates
              </h4>
              <div className="space-y-2">
                {topDefectRates.map((defect, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-2 rounded flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-700">
                      {defect.defectName}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {(defect.defectRate * 100).toFixed(2)}% (
                      {defect.totalCount})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LineCard;
