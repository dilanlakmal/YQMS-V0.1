import React from "react";

const SunriseTopN = ({ filteredData, topN, setTopN }) => {
  const topNDefects = () => {
    const defectCounts = {};
    let totalCheckedQty = 0;

    // Aggregate defect quantities and calculate total checked quantity
    filteredData.forEach((row) => {
      totalCheckedQty += row.CheckedQty;
      row.DefectDetails.forEach((defect) => {
        if (!defectCounts[defect.ReworkName]) {
          defectCounts[defect.ReworkName] = { defectsQty: 0 };
        }
        defectCounts[defect.ReworkName].defectsQty += defect.DefectsQty;
      });
    });

    // Calculate defect rate for each defect
    return Object.entries(defectCounts)
      .map(([reworkName, data]) => ({
        reworkName,
        defectsQty: data.defectsQty,
        defectRate:
          totalCheckedQty === 0 ? 0 : (data.defectsQty / totalCheckedQty) * 100
      }))
      .sort((a, b) => b.defectsQty - a.defectsQty) // Sort by DefectsQty
      .slice(0, topN);
  };

  const defectsData = topNDefects();

  // Function to get background color based on defect rate
  const getDefectRateBackground = (defectRate) => {
    if (defectRate > 3) return "bg-red-100"; // Light red
    if (defectRate >= 1 && defectRate <= 3) return "bg-orange-100"; // Light orange
    return "bg-green-100"; // Light green
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Top N Filter and Dynamic Title */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Top {topN} Defects
        </h3>
        <div>
          <label
            htmlFor="topN"
            className="mr-2 text-sm font-medium text-gray-700"
          >
            Select Top N:
          </label>
          <select
            id="topN"
            value={topN}
            onChange={(e) => setTopN(parseInt(e.target.value))}
            className="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {[...Array(40).keys()].map((i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-y-auto max-h-96">
        <table className="min-w-full border-collapse border border-gray-200 rounded-lg">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="p-3 border border-gray-300 text-sm font-semibold text-gray-700 text-left w-4/5">
                Defect Name
              </th>
              <th className="p-3 border border-gray-300 text-sm font-semibold text-gray-700 text-center w-1/10">
                Qty
              </th>
              <th className="p-3 border border-gray-300 text-sm font-semibold text-gray-700 text-center w-1/10">
                Rate (%)
              </th>
            </tr>
          </thead>
          <tbody>
            {defectsData.length > 0 ? (
              defectsData.map((defect, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition duration-200"
                >
                  <td className="p-3 border border-gray-200 text-sm text-gray-600">
                    {defect.reworkName}
                  </td>
                  <td className="p-3 border border-gray-200 text-sm text-gray-600 text-center">
                    {defect.defectsQty}
                  </td>
                  <td
                    className={`p-3 border border-gray-200 text-sm text-gray-600 text-center ${getDefectRateBackground(
                      defect.defectRate
                    )}`}
                  >
                    {defect.defectRate.toFixed(2)}%
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="3"
                  className="p-3 border border-gray-200 text-sm text-gray-600 text-center"
                >
                  No defects found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SunriseTopN;
