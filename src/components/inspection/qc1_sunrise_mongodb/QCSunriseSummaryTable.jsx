import React, { useState, useEffect } from "react";
import QCSunriseSummaryExcel from "./QCSunriseSummaryExcel";
import QCSunriseSummaryPDF from "./QCSunriseSummaryPDF";

const QCSunriseSummaryTable = ({ data, loading, error, filters }) => {
  // State for option buttons (default to all ticked)
  const [options, setOptions] = useState({
    addDates: true,
    addLines: true,
    addMONos: true,
    addBuyers: true,
    addColors: true,
    addSizes: true
  });

  // State for download generating status
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Determine background color for defect rate
  const getDefectRateColor = (rate) => {
    if (rate > 5) return "bg-red-100";
    if (rate >= 3 && rate <= 5) return "bg-orange-100";
    return "bg-green-100";
  };

  // Handle option toggle
  const handleOptionToggle = (option) => {
    setOptions((prev) => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Handle Add All button
  const handleAddAll = () => {
    setOptions({
      addDates: true,
      addLines: true,
      addMONos: true,
      addBuyers: true,
      addColors: true,
      addSizes: true
    });
  };

  // Handle Clear All button
  const handleClearAll = () => {
    setOptions({
      addDates: false,
      addLines: false,
      addMONos: false,
      addBuyers: false,
      addColors: false,
      addSizes: false
    });
  };

  // Function to convert DD/MM/YYYY to YYYY-MM-DD for comparison
  const parseDDMMYYYYToYYYYMMDD = (dateStr) => {
    if (!dateStr || !dateStr.includes("/")) return null;
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`; // Convert to YYYY-MM-DD
  };

  // Function to convert DD/MM/YYYY to MM/DD/YYYY for display
  const convertDDMMYYYYToMMDDYYYY = (dateStr) => {
    if (!dateStr || !dateStr.includes("/")) return dateStr;
    const [day, month, year] = dateStr.split("/");
    return `${month.padStart(2, "0")}/${day.padStart(2, "0")}/${year}`; // Convert to MM/DD/YYYY
  };

  // Group data based on selected options and filters
  const groupData = () => {
    // Define normalizeString at the top level of groupData
    const normalizeString = (str) => (str ? str.trim().toLowerCase() : "");

    // First, filter the data based on the selected filters
    let filteredData = data.filter((item) => {
      // Convert inspectionDate from DD/MM/YYYY to YYYY-MM-DD for comparison
      const itemDate = parseDDMMYYYYToYYYYMMDD(item.inspectionDate);
      const startDate = filters.startDate || null;
      const endDate = filters.endDate || null;

      const matchesDate =
        (!startDate || itemDate >= startDate) &&
        (!endDate || itemDate <= endDate);

      const matchesLineNo =
        !filters.lineNo ||
        normalizeString(item.lineNo) === normalizeString(filters.lineNo);

      const matchesMONo =
        !filters.MONo ||
        normalizeString(item.MONo) === normalizeString(filters.MONo);

      const matchesColor =
        !filters.Color ||
        normalizeString(item.Color) === normalizeString(filters.Color);

      const matchesSize =
        !filters.Size ||
        normalizeString(item.Size) === normalizeString(filters.Size);

      const matchesBuyer =
        !filters.Buyer ||
        normalizeString(item.Buyer) === normalizeString(filters.Buyer);

      const matchesDefectName =
        !filters.defectName ||
        (Array.isArray(item.DefectArray) &&
          item.DefectArray.some(
            (defect) =>
              normalizeString(defect.defectName) ===
              normalizeString(filters.defectName)
          ));

      return (
        matchesDate &&
        matchesLineNo &&
        matchesMONo &&
        matchesColor &&
        matchesSize &&
        matchesBuyer &&
        matchesDefectName
      );
    });

    // If no options are selected, return a single total row
    if (!Object.values(options).some((opt) => opt)) {
      const totalCheckedQty = filteredData.reduce(
        (sum, item) => sum + (item.CheckedQty || 0),
        0
      );
      const totalDefectsQty = filteredData.reduce(
        (sum, item) => sum + (item.totalDefectsQty || 0),
        0
      );
      const defectRate =
        totalCheckedQty > 0
          ? ((totalDefectsQty / totalCheckedQty) * 100).toFixed(2)
          : 0;

      // Aggregate DefectArray
      const defectMap = new Map();
      filteredData.forEach((item) => {
        if (Array.isArray(item.DefectArray)) {
          item.DefectArray.forEach((defect) => {
            const normalizedDefectName = normalizeString(defect.defectName);
            if (
              filters.defectName &&
              normalizedDefectName !== normalizeString(filters.defectName)
            ) {
              return;
            }
            if (defectMap.has(defect.defectName)) {
              defectMap.set(defect.defectName, {
                defectName: defect.defectName,
                defectQty:
                  defectMap.get(defect.defectName).defectQty +
                  (defect.defectQty || 0)
              });
            } else {
              defectMap.set(defect.defectName, {
                defectName: defect.defectName,
                defectQty: defect.defectQty || 0
              });
            }
          });
        }
      });
      const aggregatedDefectArray = Array.from(defectMap.values()).sort(
        (a, b) => b.defectQty - a.defectQty
      );

      return [
        {
          inspectionDate: "Total",
          lineNo: "All",
          MONo: "All",
          Buyer: "All",
          Color: "All",
          Size: "All",
          CheckedQty: totalCheckedQty,
          totalDefectsQty: totalDefectsQty,
          defectRate: defectRate,
          DefectArray: aggregatedDefectArray
        }
      ];
    }

    // Determine the fields to group by based on selected options
    const groupByFields = [];
    if (options.addDates) groupByFields.push("inspectionDate");
    if (options.addLines) groupByFields.push("lineNo");
    if (options.addMONos) groupByFields.push("MONo");
    if (options.addBuyers) groupByFields.push("Buyer");
    if (options.addColors) groupByFields.push("Color");
    if (options.addSizes) groupByFields.push("Size");

    // Group the data
    const groupedData = {};
    filteredData.forEach((item) => {
      const key = groupByFields.map((field) => item[field] || "N/A").join("||");
      if (!groupedData[key]) {
        groupedData[key] = {
          inspectionDate: options.addDates ? item.inspectionDate : "All",
          lineNo: options.addLines ? item.lineNo : "All",
          MONo: options.addMONos ? item.MONo : "All",
          Buyer: options.addBuyers ? item.Buyer : "All",
          Color: options.addColors ? item.Color : "All",
          Size: options.addSizes ? item.Size : "All",
          CheckedQty: 0,
          totalDefectsQty: 0,
          DefectArray: []
        };
      }
      groupedData[key].CheckedQty += item.CheckedQty || 0;
      groupedData[key].totalDefectsQty += item.totalDefectsQty || 0;

      // Aggregate DefectArray
      if (Array.isArray(item.DefectArray)) {
        item.DefectArray.forEach((defect) => {
          const normalizedDefectName = normalizeString(defect.defectName);
          if (
            filters.defectName &&
            normalizedDefectName !== normalizeString(filters.defectName)
          ) {
            return;
          }
          const existingDefect = groupedData[key].DefectArray.find(
            (d) => d.defectName === defect.defectName
          );
          if (existingDefect) {
            existingDefect.defectQty += defect.defectQty || 0;
          } else {
            groupedData[key].DefectArray.push({ ...defect });
          }
        });
      }
    });

    // Convert grouped data to array and calculate defect rate
    let result = Object.values(groupedData).map((group) => {
      const defectRate =
        group.CheckedQty > 0
          ? ((group.totalDefectsQty / group.CheckedQty) * 100).toFixed(2)
          : 0;
      // Sort DefectArray by defectQty (descending)
      group.DefectArray.sort((a, b) => b.defectQty - a.defectQty);
      // Convert inspectionDate to MM/DD/YYYY for display
      if (group.inspectionDate !== "All") {
        group.inspectionDate = convertDDMMYYYYToMMDDYYYY(group.inspectionDate);
      }
      return {
        ...group,
        defectRate: defectRate
      };
    });

    // Sort by inspectionDate (ascending) if Add Dates is selected
    if (options.addDates) {
      result.sort((a, b) => {
        const dateA = parseDDMMYYYYToYYYYMMDD(a.inspectionDate);
        const dateB = parseDDMMYYYYToYYYYMMDD(b.inspectionDate);
        return dateA.localeCompare(dateB);
      });
    }

    return result;
  };

  // Get the grouped data
  const groupedData = groupData();

  // Determine which columns to display based on options
  const columnsToDisplay = [];
  if (options.addDates) columnsToDisplay.push("Date");
  if (options.addLines) columnsToDisplay.push("Line No");
  if (options.addMONos) columnsToDisplay.push("MO No");
  if (options.addColors) columnsToDisplay.push("Color");
  if (options.addSizes) columnsToDisplay.push("Size");
  if (options.addBuyers) columnsToDisplay.push("Buyer");

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Summary Table</h2>
        <div className="flex space-x-2 items-center">
          {/* Option Buttons with Checkboxes */}
          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={options.addDates}
              onChange={() => handleOptionToggle("addDates")}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Add Dates</span>
          </label>
          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={options.addLines}
              onChange={() => handleOptionToggle("addLines")}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Add Lines</span>
          </label>
          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={options.addMONos}
              onChange={() => handleOptionToggle("addMONos")}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Add MONos</span>
          </label>
          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={options.addBuyers}
              onChange={() => handleOptionToggle("addBuyers")}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Add Buyers</span>
          </label>
          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={options.addColors}
              onChange={() => handleOptionToggle("addColors")}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Add Colors</span>
          </label>
          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={options.addSizes}
              onChange={() => handleOptionToggle("addSizes")}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Add Sizes</span>
          </label>
          {/* Add All Button */}
          <button
            onClick={handleAddAll}
            className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out"
          >
            Add All
          </button>
          {/* Clear All Button */}
          <button
            onClick={handleClearAll}
            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150 ease-in-out"
          >
            Clear All
          </button>
          {/* Download Excel Button */}
          <QCSunriseSummaryExcel
            groupedData={groupedData}
            columnsToDisplay={columnsToDisplay}
            isGenerating={isGeneratingExcel}
            setIsGenerating={setIsGeneratingExcel}
          />
          {/* Download PDF Button */}
          <QCSunriseSummaryPDF
            groupedData={groupedData}
            columnsToDisplay={columnsToDisplay}
            isGenerating={isGeneratingPDF}
            setIsGenerating={setIsGeneratingPDF}
          />
        </div>
      </div>
      {groupedData.length === 0 && !loading && !error ? (
        <div className="text-center text-gray-600">
          No data available for the selected filters. Please adjust your filters
          or check the data source.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[500px] relative">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-200 sticky top-0 z-10">
              <tr>
                {columnsToDisplay.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2 text-left text-sm font-medium text-gray-700"
                  >
                    {col}
                  </th>
                ))}
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Checked Qty
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Defects Qty
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Defect Rate
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Defect Details
                </th>
              </tr>
            </thead>
            <tbody className="overflow-y-auto">
              {groupedData.map((item, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  {options.addDates && (
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.inspectionDate}
                    </td>
                  )}
                  {options.addLines && (
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.lineNo}
                    </td>
                  )}
                  {options.addMONos && (
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.MONo}
                    </td>
                  )}
                  {options.addColors && (
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.Color}
                    </td>
                  )}
                  {options.addSizes && (
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.Size}
                    </td>
                  )}
                  {options.addBuyers && (
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.Buyer}
                    </td>
                  )}
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {item.CheckedQty}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {item.totalDefectsQty}
                  </td>
                  <td
                    className={`px-4 py-2 text-sm text-gray-600 ${getDefectRateColor(
                      item.defectRate
                    )}`}
                  >
                    {item.defectRate}%
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {item.DefectArray.length === 0 ? (
                      <div className="text-center text-gray-500 text-xs">
                        No matching defects
                      </div>
                    ) : (
                      <table className="w-full table-auto">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-2 py-1 text-xs font-medium text-gray-600 w-1/3">
                              Defect Name
                            </th>
                            <th className="px-2 py-1 text-xs font-medium text-gray-600 w-1/3">
                              Defects Qty
                            </th>
                            <th className="px-2 py-1 text-xs font-medium text-gray-600 w-1/3">
                              Defect Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.DefectArray.map((defect, defectIndex) => (
                            <tr
                              key={defectIndex}
                              className={
                                defectIndex % 2 === 0
                                  ? "bg-gray-50"
                                  : "bg-white"
                              }
                            >
                              <td className="px-2 py-1 text-xs text-gray-600 w-1/3">
                                {defect.defectName}
                              </td>
                              <td className="px-2 py-1 text-xs text-gray-600 w-1/3 text-center">
                                {defect.defectQty}
                              </td>
                              <td className="px-2 py-1 text-xs text-gray-600 w-1/3 text-center">
                                {item.CheckedQty > 0
                                  ? (
                                      (defect.defectQty / item.CheckedQty) *
                                      100
                                    ).toFixed(2)
                                  : 0}
                                %
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QCSunriseSummaryTable;
