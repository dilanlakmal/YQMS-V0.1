import React, { useState, useEffect } from "react";

const SunriseAnalyze = ({ rs18Data, outputData }) => {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    workLine: "",
    moNo: "",
    colorNo: "",
    sizeName: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Helper function to parse MM-DD-YYYY date into a Date object
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [month, day, year] = dateStr.split("-").map(Number); // Expects MM-DD-YYYY
    return new Date(year, month - 1, day); // Month is 0-based in JS Date
  };

  // Get unique filter options from outputData
  const getUniqueValues = (key) => {
    if (!outputData) return [];
    return [...new Set(outputData.map((row) => row[key]))].sort();
  };

  const uniqueWorkLines = getUniqueValues("WorkLine");
  const uniqueMoNos = getUniqueValues("MONo");
  const uniqueColorNos = getUniqueValues("ColorNo");
  const uniqueSizeNames = getUniqueValues("SizeName");

  // Merge data and apply filters
  const getMergedData = () => {
    if (!rs18Data || !outputData) return [];

    const commonKeys = [
      "InspectionDate",
      "WorkLine",
      "MONo",
      "SizeName",
      "ColorNo",
      "ColorName"
    ];
    const mergedData = [];

    const outputMap = new Map();
    outputData.forEach((row) => {
      const key = commonKeys.map((k) => row[k]).join("|");
      outputMap.set(key, {
        TotalQtyT38: row.TotalQtyT38,
        TotalQtyT39: row.TotalQtyT39
      });
    });

    const defectMap = new Map();
    rs18Data.forEach((row) => {
      const key = commonKeys.map((k) => row[k]).join("|");
      if (!defectMap.has(key)) defectMap.set(key, []);
      defectMap
        .get(key)
        .push({ ReworkName: row.ReworkName, DefectsQty: row.DefectsQty });
    });

    const allKeys = new Set([...outputMap.keys(), ...defectMap.keys()]);
    allKeys.forEach((key) => {
      const [InspectionDate, WorkLine, MONo, SizeName, ColorNo, ColorName] =
        key.split("|");
      const output = outputMap.get(key) || { TotalQtyT38: 0, TotalQtyT39: 0 };
      const defects = defectMap.get(key) || [];

      const checkedQty = Math.max(output.TotalQtyT38, output.TotalQtyT39);
      const defectsQty = defects.reduce(
        (sum, defect) => sum + defect.DefectsQty,
        0
      );
      const defectRate = checkedQty === 0 ? 0 : (defectsQty / checkedQty) * 100;

      const defectsWithRate = defects.map((defect) => ({
        ...defect,
        DefectRate:
          checkedQty === 0 ? 0 : (defect.DefectsQty / checkedQty) * 100
      }));

      mergedData.push({
        InspectionDate,
        WorkLine,
        MONo,
        SizeName,
        ColorNo,
        ColorName,
        TotalQtyT38: output.TotalQtyT38,
        TotalQtyT39: output.TotalQtyT39,
        CheckedQty: checkedQty,
        DefectsQty: defectsQty,
        DefectRate: defectRate,
        DefectDetails: defectsWithRate
      });
    });

    // Apply filters
    return mergedData.filter((row) => {
      const rowDate = parseDate(row.InspectionDate);
      const startDate = filters.startDate ? parseDate(filters.startDate) : null;
      const endDate = filters.endDate ? parseDate(filters.endDate) : null;

      return (
        (!startDate || rowDate >= startDate) &&
        (!endDate || rowDate <= endDate) &&
        (!filters.workLine || row.WorkLine === filters.workLine) &&
        (!filters.moNo || row.MONo === filters.moNo) &&
        (!filters.colorNo || row.ColorNo === filters.colorNo) &&
        (!filters.sizeName || row.SizeName === filters.sizeName)
      );
    });
  };

  const filteredData = getMergedData();
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Calculate totals for numeric columns
  const totals = {
    TotalQtyT38: filteredData.reduce((sum, row) => sum + row.TotalQtyT38, 0),
    TotalQtyT39: filteredData.reduce((sum, row) => sum + row.TotalQtyT39, 0),
    CheckedQty: filteredData.reduce((sum, row) => sum + row.CheckedQty, 0),
    DefectsQty: filteredData.reduce((sum, row) => sum + row.DefectsQty, 0),
    DefectRate:
      filteredData.reduce((sum, row) => sum + row.CheckedQty, 0) === 0
        ? 0
        : (
            (filteredData.reduce((sum, row) => sum + row.DefectsQty, 0) /
              filteredData.reduce((sum, row) => sum + row.CheckedQty, 0)) *
            100
          ).toFixed(2)
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      workLine: "",
      moNo: "",
      colorNo: "",
      sizeName: ""
    });
    setCurrentPage(1);
  };

  // Convert YYYY-MM-DD from input to MM-DD-YYYY
  const formatDateForFilter = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}-${year}`; // MM-DD-YYYY
  };

  return (
    <div className="mt-4">
      {/* Filter Pane */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-100 rounded-lg">
        <div>
          <label className="block text-sm font-medium">
            Start Date (MM-DD-YYYY):
          </label>
          <input
            type="date"
            name="startDate"
            value={
              filters.startDate
                ? filters.startDate.split("-").reverse().join("-") // MM-DD-YYYY to YYYY-MM-DD for input
                : ""
            }
            onChange={(e) => {
              const date = formatDateForFilter(e.target.value); // Convert YYYY-MM-DD to MM-DD-YYYY
              handleFilterChange({
                target: { name: "startDate", value: date }
              });
            }}
            className="mt-1 p-2 border rounded-md w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            End Date (MM-DD-YYYY):
          </label>
          <input
            type="date"
            name="endDate"
            value={
              filters.endDate
                ? filters.endDate.split("-").reverse().join("-") // MM-DD-YYYY to YYYY-MM-DD for input
                : ""
            }
            onChange={(e) => {
              const date = formatDateForFilter(e.target.value); // Convert YYYY-MM-DD to MM-DD-YYYY
              handleFilterChange({ target: { name: "endDate", value: date } });
            }}
            className="mt-1 p-2 border rounded-md w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Line No:</label>
          <select
            name="workLine"
            value={filters.workLine}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full"
          >
            <option value="">All</option>
            {uniqueWorkLines.map((line) => (
              <option key={line} value={line}>
                {line}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">MO No:</label>
          <select
            name="moNo"
            value={filters.moNo}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full"
          >
            <option value="">All</option>
            {uniqueMoNos.map((mo) => (
              <option key={mo} value={mo}>
                {mo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Color:</label>
          <select
            name="colorNo"
            value={filters.colorNo}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full"
          >
            <option value="">All</option>
            {uniqueColorNos.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Size:</label>
          <select
            name="sizeName"
            value={filters.sizeName}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full"
          >
            <option value="">All</option>
            {uniqueSizeNames.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-red-500 text-white rounded-md w-full"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Analyze Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-96">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-green-100 sticky top-0 z-10">
            <tr>
              {[
                "InspectionDate",
                "WorkLine",
                "MONo",
                "SizeName",
                "ColorNo",
                "ColorName",
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
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row.InspectionDate}
                </td>
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row.WorkLine}
                </td>
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row.MONo}
                </td>
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row.SizeName}
                </td>
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row.ColorNo}
                </td>
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row.ColorName}
                </td>
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
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row.DefectRate.toFixed(2)}%
                </td>
                <td className="p-2 border border-gray-300 text-sm text-left">
                  {row.DefectDetails.length > 0 ? (
                    <ul>
                      {row.DefectDetails.map((defect, i) => (
                        <li key={i}>
                          {`${defect.ReworkName}: ${
                            defect.DefectsQty
                          } (${defect.DefectRate.toFixed(2)}%)`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "No defects"
                  )}
                </td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-gray-200 font-bold">
              <td className="p-2 border border-gray-300 text-sm text-center">
                Total
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                -
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                -
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                -
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                -
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                -
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                {totals.TotalQtyT38}
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                {totals.TotalQtyT39}
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                {totals.CheckedQty}
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                {totals.DefectsQty}
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                {totals.DefectRate}%
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
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SunriseAnalyze;
