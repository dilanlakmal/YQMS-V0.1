import React, { useState } from "react";

const SunriseSummaryTable = ({
  filteredData,
  totals,
  currentPage,
  totalPages,
  setCurrentPage,
  getDefectRateStyles,
  filters
}) => {
  const [groupOptions, setGroupOptions] = useState({
    line: false,
    mo: false,
    buyer: false,
    color: false,
    size: false
  });

  // Function to toggle group options
  const toggleGroupOption = (option) => {
    setGroupOptions((prev) => ({
      ...prev,
      [option]: !prev[option]
    }));
    setCurrentPage(1);
  };

  // Function to add all options
  const addAllOptions = () => {
    setGroupOptions({
      line: true,
      mo: true,
      buyer: true,
      color: true,
      size: true
    });
    setCurrentPage(1);
  };

  // Function to clear all options
  const clearAllOptions = () => {
    setGroupOptions({
      line: false,
      mo: false,
      buyer: false,
      color: false,
      size: false
    });
    setCurrentPage(1);
  };

  // Determine the columns to group by
  const groupByColumns = ["InspectionDate"];
  if (groupOptions.line) groupByColumns.push("WorkLine");
  if (groupOptions.mo) groupByColumns.push("MONo");
  if (groupOptions.buyer) groupByColumns.push("Buyer");
  if (groupOptions.color) groupByColumns.push("ColorName");
  if (groupOptions.size) groupByColumns.push("SizeName");

  // Aggregate data based on selected group columns
  const aggregatedData = () => {
    const groupedData = {};

    filteredData.forEach((row) => {
      const key = groupByColumns.map((col) => row[col] || "-").join("|");
      if (!groupedData[key]) {
        groupedData[key] = {
          InspectionDate: row.InspectionDate,
          WorkLine: groupOptions.line ? row.WorkLine : "-",
          MONo: groupOptions.mo ? row.MONo : "-",
          Buyer: groupOptions.buyer ? row.Buyer : "-",
          ColorName: groupOptions.color ? row.ColorName : "-",
          SizeName: groupOptions.size ? row.SizeName : "-",
          TotalQtyT38: 0,
          TotalQtyT39: 0,
          CheckedQty: 0,
          DefectsQty: 0,
          DefectDetailsMap: new Map() // Temporary Map for aggregation
        };
      }

      const group = groupedData[key];
      group.TotalQtyT38 += row.TotalQtyT38;
      group.TotalQtyT39 += row.TotalQtyT39;
      group.CheckedQty += row.CheckedQty;
      group.DefectsQty += row.DefectsQty;

      // Aggregate DefectDetails by ReworkName
      row.DefectDetails.forEach((defect) => {
        if (group.DefectDetailsMap.has(defect.ReworkName)) {
          const existing = group.DefectDetailsMap.get(defect.ReworkName);
          existing.DefectsQty += defect.DefectsQty;
        } else {
          group.DefectDetailsMap.set(defect.ReworkName, {
            ReworkName: defect.ReworkName,
            DefectsQty: defect.DefectsQty
          });
        }
      });
    });

    // Finalize DefectDetails with DefectRate and sorting
    Object.values(groupedData).forEach((group) => {
      group.DefectDetails = Array.from(group.DefectDetailsMap.values()).map(
        (defect) => ({
          ...defect,
          DefectRate:
            group.CheckedQty === 0
              ? 0
              : (defect.DefectsQty / group.CheckedQty) * 100
        })
      );
      // Sort by DefectRate (highest to lowest)
      group.DefectDetails.sort((a, b) => b.DefectRate - a.DefectRate);
      delete group.DefectDetailsMap; // Clean up
      group.DefectRate =
        group.CheckedQty === 0
          ? 0
          : (group.DefectsQty / group.CheckedQty) * 100;
    });

    return Object.values(groupedData);
  };

  //const aggregatedRows = aggregatedData();
  const aggregatedRows = aggregatedData().sort((a, b) => {
    // Sort by WorkLine numerically if groupOptions.line is true
    if (groupOptions.line) {
      const workLineA = parseInt(a.WorkLine, 10);
      const workLineB = parseInt(b.WorkLine, 10);
      return workLineA - workLineB;
    }
    return 0; // No sorting if WorkLine is not grouped
  });
  const rowsPerPage = 10;
  const paginatedRows = aggregatedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const newTotalPages = Math.ceil(aggregatedRows.length / rowsPerPage);

  // Calculate totals for the aggregated data
  const aggregatedTotals = {
    TotalQtyT38: aggregatedRows.reduce((sum, row) => sum + row.TotalQtyT38, 0),
    TotalQtyT39: aggregatedRows.reduce((sum, row) => sum + row.TotalQtyT39, 0),
    CheckedQty: aggregatedRows.reduce((sum, row) => sum + row.CheckedQty, 0),
    DefectsQty: aggregatedRows.reduce((sum, row) => sum + row.DefectsQty, 0),
    DefectRate:
      aggregatedRows.reduce((sum, row) => sum + row.CheckedQty, 0) === 0
        ? 0
        : (
            (aggregatedRows.reduce((sum, row) => sum + row.DefectsQty, 0) /
              aggregatedRows.reduce((sum, row) => sum + row.CheckedQty, 0)) *
            100
          ).toFixed(2)
  };

  return (
    <div className="mb-6">
      {/* Grouping Options */}
      <div className="flex flex-wrap gap-4 mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={groupOptions.line}
            onChange={() => toggleGroupOption("line")}
            className="mr-2"
          />
          Add Line
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={groupOptions.mo}
            onChange={() => toggleGroupOption("mo")}
            className="mr-2"
          />
          Add MO
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={groupOptions.buyer}
            onChange={() => toggleGroupOption("buyer")}
            className="mr-2"
          />
          Add Buyer
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={groupOptions.color}
            onChange={() => toggleGroupOption("color")}
            className="mr-2"
          />
          Add Color
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={groupOptions.size}
            onChange={() => toggleGroupOption("size")}
            className="mr-2"
          />
          Add Size
        </label>
        <button
          onClick={addAllOptions}
          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
        >
          Add All
        </button>
        <button
          onClick={clearAllOptions}
          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300"
        >
          Clear All
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-green-100 sticky top-0 z-10">
            <tr>
              {groupByColumns.map((col) => (
                <th
                  key={col}
                  className="p-2 border border-gray-300 text-sm font-medium text-gray-700"
                >
                  {col}
                </th>
              ))}
              {[
                "TotalQtyT38",
                "TotalQtyT39",
                "CheckedQty",
                "DefectsQty",
                "DefectRate",
                "Defect Details"
              ].map((header) => (
                <th
                  key={header}
                  className="p-2 border border-gray-300 text-sm font-medium text-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, index) => {
              const defectRateStyles = getDefectRateStyles(row.DefectRate);
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.InspectionDate}
                  </td>
                  {groupOptions.line && (
                    <td className="p-2 border border-gray-300 text-sm text-center">
                      {row.WorkLine}
                    </td>
                  )}
                  {groupOptions.mo && (
                    <td className="p-2 border border-gray-300 text-sm text-center">
                      {row.MONo}
                    </td>
                  )}
                  {groupOptions.buyer && (
                    <td className="p-2 border border-gray-300 text-sm text-center">
                      {row.Buyer}
                    </td>
                  )}
                  {groupOptions.color && (
                    <td className="p-2 border border-gray-300 text-sm text-center">
                      {row.ColorName}
                    </td>
                  )}
                  {groupOptions.size && (
                    <td className="p-2 border border-gray-300 text-sm text-center">
                      {row.SizeName}
                    </td>
                  )}
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.TotalQtyT38}
                  </td>
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.TotalQtyT39}
                  </td>
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.CheckedQty}
                  </td>
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.DefectsQty}
                  </td>
                  <td
                    className="p-2 border border-gray-300 text-sm text-center"
                    style={{
                      backgroundColor: defectRateStyles.background,
                      color: defectRateStyles.color
                    }}
                  >
                    {row.DefectRate.toFixed(2)}%
                  </td>

                  <td className="p-2 border border-gray-300 text-xs text-left">
                    {row.DefectDetails.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {row.DefectDetails.map((defect, i) => (
                          <div
                            key={i}
                            className={`flex items-start divide-x divide-gray-200 ${
                              defect.DefectRate > 5
                                ? "bg-red-100"
                                : defect.DefectRate >= 2 &&
                                  defect.DefectRate <= 5
                                ? "bg-orange-100"
                                : ""
                            }`}
                          >
                            <span className="w-3/4 px-2 py-1 text-xs font-medium text-gray-600">
                              {defect.ReworkName}
                            </span>
                            <span className="w-1/8 px-1 py-1 text-xs">
                              Q: {defect.DefectsQty}
                            </span>
                            <span className="w-1/8 px-1 py-1 text-xs flex items-start">
                              R: {defect.DefectRate.toFixed(2)}%
                              {defect.DefectRate > 5 ? (
                                <span className="ml-1 px-1 py-0.5 text-xs font-bold text-red-800 bg-red-100 border-2 border-red-800 rounded-md">
                                  Critical
                                </span>
                              ) : defect.DefectRate >= 2 &&
                                defect.DefectRate <= 5 ? (
                                <span className="ml-1 px-1 py-0.5 text-xs font-bold text-orange-800 bg-orange-100 border-2 border-orange-800 rounded-md">
                                  Warning
                                </span>
                              ) : null}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs">No defects</span>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-200 font-bold sticky bottom-0 z-10">
              {groupByColumns.map((col, idx) => (
                <td
                  key={idx}
                  className="p-2 border border-gray-300 text-sm text-center"
                >
                  {col === "InspectionDate" ? "Total" : "-"}
                </td>
              ))}
              <td className="p-2 border border-gray-300 text-sm text-center">
                {aggregatedTotals.TotalQtyT38}
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                {aggregatedTotals.TotalQtyT39}
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                {aggregatedTotals.CheckedQty}
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                {aggregatedTotals.DefectsQty}
              </td>
              <td
                className="p-2 border border-gray-300 text-sm text-center"
                style={getDefectRateStyles(
                  parseFloat(aggregatedTotals.DefectRate)
                )}
              >
                {aggregatedTotals.DefectRate}%
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                -
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition duration-300"
        >
          Previous
        </button>
        <span className="text-sm">
          Page {currentPage} of {newTotalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, newTotalPages))
          }
          disabled={currentPage === newTotalPages}
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition duration-300"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SunriseSummaryTable;
