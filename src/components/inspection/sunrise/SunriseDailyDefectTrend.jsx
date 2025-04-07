import React, { useState } from "react";

const SunriseDailyDefectTrend = ({ filteredData, filters }) => {
  const [groupOptions, setGroupOptions] = useState({
    line: false,
    mo: false,
    buyer: false,
    color: false,
    size: false
  });

  // State for controlling total rows and columns
  const [showTotalRows, setShowTotalRows] = useState(true); // Default to true (ticked)
  const [showTotalColumn, setShowTotalColumn] = useState(true); // Default to true (ticked)

  // Function to toggle group options
  const toggleGroupOption = (option) => {
    setGroupOptions((prev) => ({
      ...prev,
      [option]: !prev[option]
    }));
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
  };

  // Determine the columns to group by
  const groupByColumns = [];
  if (groupOptions.line) groupByColumns.push("WorkLine");
  if (groupOptions.mo) groupByColumns.push("MONo");
  if (groupOptions.buyer) groupByColumns.push("Buyer");
  if (groupOptions.color) groupByColumns.push("ColorName");
  if (groupOptions.size) groupByColumns.push("SizeName");

  // Get unique inspection dates within the selected date range
  const uniqueInspectionDates = [
    ...new Set(filteredData.map((row) => row.InspectionDate))
  ].sort();

  // Aggregate data for the matrix
  const aggregatedData = () => {
    const groupedData = {};

    filteredData.forEach((row) => {
      // Filter DefectDetails based on the selected reworkName
      const filteredDefectDetails = filters.reworkName
        ? row.DefectDetails.filter(
            (defect) => defect.ReworkName === filters.reworkName
          )
        : row.DefectDetails;

      // Skip this row entirely if no matching defects remain after filtering
      if (filters.reworkName && filteredDefectDetails.length === 0) {
        return;
      }

      // Create a key for grouping based on selected columns
      const groupKey = groupByColumns.map((col) => row[col] || "-").join("|");

      filteredDefectDetails.forEach((defect) => {
        const defectKey = `${defect.ReworkName}|${row.InspectionDate}|${groupKey}`;

        if (!groupedData[defectKey]) {
          groupedData[defectKey] = {
            ReworkName: defect.ReworkName,
            InspectionDate: row.InspectionDate,
            WorkLine: groupOptions.line ? row.WorkLine : "-",
            MONo: groupOptions.mo ? row.MONo : "-",
            Buyer: groupOptions.buyer ? row.Buyer : "-",
            ColorName: groupOptions.color ? row.ColorName : "-",
            SizeName: groupOptions.size ? row.SizeName : "-",
            DefectsQty: 0,
            TotalCheckedQty: 0
          };
        }

        const group = groupedData[defectKey];
        group.DefectsQty += defect.DefectsQty;
        group.TotalCheckedQty += row.CheckedQty;
      });
    });

    // Calculate defect rates and sort by group columns and ReworkName
    const data = Object.values(groupedData).map((group) => ({
      ...group,
      DefectRate:
        group.TotalCheckedQty === 0
          ? 0
          : (group.DefectsQty / group.TotalCheckedQty) * 100
    }));

    // Sort by group columns and then by ReworkName
    return data.sort((a, b) => {
      for (const col of groupByColumns) {
        if (a[col] < b[col]) return -1;
        if (a[col] > b[col]) return 1;
      }
      return a.ReworkName.localeCompare(b.ReworkName);
    });
  };

  const matrixData = aggregatedData();

  // Get unique defect names
  const uniqueDefectNames = [
    ...new Set(matrixData.map((row) => row.ReworkName))
  ].sort();

  // Function to get defect rate for a specific defect name, date, and group combination
  const getDefectRate = (defectName, date, groupKey) => {
    const row = matrixData.find(
      (r) =>
        r.ReworkName === defectName &&
        r.InspectionDate === date &&
        groupByColumns.map((col) => r[col] || "-").join("|") === groupKey
    );
    return row ? row.DefectRate : 0;
  };

  // Get unique group combinations
  const uniqueGroups = [
    ...new Set(
      matrixData.map((row) =>
        groupByColumns.map((col) => row[col] || "-").join("|")
      )
    )
  ];

  // Calculate total defect rate for each group combination across all defect names
  const getGroupTotalDefectRate = (groupKey, date) => {
    const groupRows = matrixData.filter(
      (row) =>
        groupByColumns.map((col) => row[col] || "-").join("|") === groupKey &&
        row.InspectionDate === date
    );
    const totalDefects = groupRows.reduce(
      (sum, row) => sum + row.DefectsQty,
      0
    );
    const totalChecked = groupRows.reduce(
      (sum, row) => sum + row.TotalCheckedQty,
      0
    );
    return totalChecked === 0 ? 0 : (totalDefects / totalChecked) * 100;
  };

  // Calculate overall total defect rate for each date (for the fixed total row)
  const getOverallTotalDefectRate = (date) => {
    const dateRows = matrixData.filter((row) => row.InspectionDate === date);
    const totalDefects = dateRows.reduce((sum, row) => sum + row.DefectsQty, 0);
    const totalChecked = dateRows.reduce(
      (sum, row) => sum + row.TotalCheckedQty,
      0
    );
    return totalChecked === 0 ? 0 : (totalDefects / totalChecked) * 100;
  };

  // Calculate the average defect rate for a group across all dates
  const getGroupAverageDefectRate = (groupKey) => {
    const rates = uniqueInspectionDates.map((date) => {
      const totalRate = getGroupTotalDefectRate(groupKey, date);
      return totalRate > 0 ? totalRate : 0;
    });
    const nonZeroCount = rates.reduce(
      (sum, rate) => sum + (rate > 0 ? 1 : 0),
      0
    );
    return nonZeroCount > 0
      ? (rates.reduce((sum, rate) => sum + rate, 0) / nonZeroCount).toFixed(2)
      : "0.00";
  };

  // Calculate the overall average defect rate across all dates
  const getOverallAverageDefectRate = () => {
    const rates = uniqueInspectionDates.map((date) => {
      const totalRate = getOverallTotalDefectRate(date);
      return totalRate > 0 ? totalRate : 0;
    });
    const nonZeroCount = rates.reduce(
      (sum, rate) => sum + (rate > 0 ? 1 : 0),
      0
    );
    return nonZeroCount > 0
      ? (rates.reduce((sum, rate) => sum + rate, 0) / nonZeroCount).toFixed(2)
      : "0.00";
  };

  // Color styling for defect rates
  const getDefectRateStyles = (rate) => {
    if (rate > 3) return { background: "#ffcccc", color: "#cc0000" }; // Light red background, dark red font
    if (rate >= 1 && rate <= 3)
      return { background: "#ffebcc", color: "#e68a00" }; // Light orange background, dark orange font
    if (rate > 0 && rate < 1)
      return { background: "#ccffcc", color: "#006600" }; // Light green background, dark green font
    return { background: "transparent", color: "black" }; // Default for 0% (not displayed)
  };

  // Track the previous group to avoid repeating group column values
  let previousGroupKey = null;

  return (
    <div className="mb-6">
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-700 mb-4">
        Daily Summary Trend
      </h3>

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
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showTotalRows}
            onChange={() => setShowTotalRows(!showTotalRows)}
            className="mr-2"
          />
          Add Total to Rows
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showTotalColumn}
            onChange={() => setShowTotalColumn(!showTotalColumn)}
            className="mr-2"
          />
          Add Total to Column
        </label>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-green-100 sticky top-0 z-10">
            <tr>
              {/* Fixed Columns */}
              {groupByColumns.map((col) => (
                <th
                  key={col}
                  className="p-2 border border-gray-300 text-sm font-medium text-gray-700"
                >
                  {col}
                </th>
              ))}
              <th className="p-2 border border-gray-300 text-sm font-medium text-gray-700 text-left">
                Defect Name
              </th>
              {/* Dynamic Date Columns */}
              {uniqueInspectionDates.map((date) => (
                <th
                  key={date}
                  className="p-2 border border-gray-300 text-sm font-medium text-gray-700"
                >
                  {date}
                </th>
              ))}
              {groupByColumns.length > 0 && showTotalColumn && (
                <th className="p-2 border border-gray-300 text-sm font-medium text-gray-700">
                  Total
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {uniqueGroups.map((groupKey) => {
              const groupRows = uniqueDefectNames.map((defectName, index) => {
                const hasNonZeroRate = uniqueInspectionDates.some((date) => {
                  const rate = getDefectRate(defectName, date, groupKey);
                  return rate > 0;
                });

                if (!hasNonZeroRate) return null; // Skip rows with all 0% defect rates

                const isFirstRowOfGroup = previousGroupKey !== groupKey;
                previousGroupKey = groupKey;

                return (
                  <tr
                    key={`${groupKey}|${defectName}`}
                    className="hover:bg-gray-50"
                  >
                    {/* Grouping Columns */}
                    {groupByColumns.map((col, idx) => (
                      <td
                        key={idx}
                        className="p-2 border border-gray-300 text-sm text-center"
                      >
                        {isFirstRowOfGroup
                          ? matrixData.find(
                              (r) =>
                                r.ReworkName === defectName &&
                                groupByColumns
                                  .map((c) => r[c] || "-")
                                  .join("|") === groupKey
                            )?.[col] || "-"
                          : ""}
                      </td>
                    ))}
                    {/* Defect Name */}
                    <td className="p-2 border border-gray-300 text-sm text-left">
                      {defectName}
                    </td>
                    {/* Defect Rates for Each Date */}
                    {uniqueInspectionDates.map((date) => {
                      const defectRate = getDefectRate(
                        defectName,
                        date,
                        groupKey
                      );
                      const styles = getDefectRateStyles(defectRate);

                      return (
                        <td
                          key={date}
                          className="p-2 border border-gray-300 text-sm text-center"
                          style={{
                            backgroundColor: styles.background,
                            color: styles.color
                          }}
                        >
                          {defectRate > 0 ? `${defectRate.toFixed(2)}%` : ""}
                        </td>
                      );
                    })}
                    {/* Total Column for the Group */}
                    {groupByColumns.length > 0 && showTotalColumn && (
                      <td
                        className="p-2 border border-gray-300 text-sm text-center"
                        style={{ backgroundColor: "black", color: "white" }}
                      >
                        {getGroupAverageDefectRate(groupKey)}%
                      </td>
                    )}
                  </tr>
                );
              });

              // Add a "Total" row for this group if there are grouping columns and showTotalRows is true
              if (groupByColumns.length > 0 && showTotalRows) {
                groupRows.push(
                  <tr key={`${groupKey}|Total`} className="bg-black text-white">
                    {/* Grouping Columns (same as first row of the group) */}
                    {groupByColumns.map((col, idx) => (
                      <td
                        key={idx}
                        className="p-2 border border-gray-300 text-sm text-center"
                      >
                        {matrixData.find(
                          (r) =>
                            groupByColumns.map((c) => r[c] || "-").join("|") ===
                            groupKey
                        )?.[col] || "-"}
                      </td>
                    ))}
                    {/* Defect Name as "Total" */}
                    <td className="p-2 border border-gray-300 text-sm text-left">
                      Total
                    </td>
                    {/* Total Defect Rates for Each Date */}
                    {uniqueInspectionDates.map((date) => {
                      const totalRate = getGroupTotalDefectRate(groupKey, date);
                      return (
                        <td
                          key={date}
                          className="p-2 border border-gray-300 text-sm text-center"
                        >
                          {totalRate > 0 ? `${totalRate.toFixed(2)}%` : ""}
                        </td>
                      );
                    })}
                    {/* Total Column */}
                    {showTotalColumn && (
                      <td className="p-2 border border-gray-300 text-sm text-center">
                        {getGroupAverageDefectRate(groupKey)}%
                      </td>
                    )}
                  </tr>
                );
              }

              return groupRows;
            })}

            {/* Fixed Total Row at the Bottom */}
            {showTotalRows && (
              <tr className="bg-black text-white sticky bottom-0 z-10">
                {/* Grouping Columns (empty for overall total) */}
                {groupByColumns.map((col, idx) => (
                  <td
                    key={idx}
                    className="p-2 border border-gray-300 text-sm text-center"
                  >
                    -
                  </td>
                ))}
                {/* Defect Name as "Total" */}
                <td className="p-2 border border-gray-300 text-sm text-left">
                  Total
                </td>
                {/* Overall Total Defect Rates for Each Date */}
                {uniqueInspectionDates.map((date) => {
                  const totalRate = getOverallTotalDefectRate(date);
                  return (
                    <td
                      key={date}
                      className="p-2 border border-gray-300 text-sm text-center"
                    >
                      {totalRate > 0 ? `${totalRate.toFixed(2)}%` : ""}
                    </td>
                  );
                })}
                {/* Overall Total Column */}
                {groupByColumns.length > 0 && showTotalColumn && (
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {getOverallAverageDefectRate()}%
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SunriseDailyDefectTrend;