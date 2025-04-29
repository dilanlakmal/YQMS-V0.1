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

  // Function to convert DD/MM/YYYY to YYYY-MM-DD (kept for potential future use or sorting)
  const parseDDMMYYYYToYYYYMMDD = (dateStr) => {
    if (!dateStr || !dateStr.includes("/")) return null;
    const [day, month, year] = dateStr.split("/");
    // Ensure parts are valid before creating the string
    if (!day || !month || !year || isNaN(parseInt(day)) || isNaN(parseInt(month)) || isNaN(parseInt(year))) {
        return null; // Return null if date parts are invalid
    }
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`; // Convert to YYYY-MM-DD
  };


  // Function to convert DD/MM/YYYY to MM/DD/YYYY for display
  const convertDDMMYYYYToMMDDYYYY = (dateStr) => {
    // Check if the date is already in MM/DD/YYYY format or 'All'/'Total'
    if (!dateStr || dateStr === 'All' || dateStr === 'Total' || (dateStr.includes('/') && dateStr.split('/')[0].length === 2 && dateStr.split('/')[1].length === 2)) {
        return dateStr;
    }
    // Assuming input is DD/MM/YYYY if it needs conversion
    if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts.length === 3) {
            const [day, month, year] = parts;
             // Basic validation
            if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
                return `${month}/${day}/${year}`; // Convert to MM/DD/YYYY
            }
        }
    }
    // Return original string if format is unexpected or already correct
    return dateStr;
  };


  // Group data based on selected options and filters
  const groupData = () => {
    // Define normalizeString at the top level of groupData
    const normalizeString = (str) => (str ? String(str).trim().toLowerCase() : ""); // Ensure string conversion

    // First, filter the data based on the selected filters (EXCEPT DATE)
    // The 'data' prop received from the parent is assumed to be already filtered by date.
    let filteredData = data.filter((item) => {

      // --- DATE FILTERING REMOVED ---
      // The parent component (QCSunriseDashboard) already handles date filtering before passing 'data' here.
      // const itemDate = parseDDMMYYYYToYYYYMMDD(item.inspectionDate);
      // const startDate = filters.startDate || null;
      // const endDate = filters.endDate || null;
      // const matchesDate =
      //   (!startDate || (itemDate && itemDate >= startDate)) &&
      //   (!endDate || (itemDate && itemDate <= endDate));
      // --- END OF REMOVED DATE FILTERING ---

      // Ensure item properties exist before trying to normalize them
      const matchesLineNo =
        !filters.lineNo ||
        normalizeString(item.lineNo) === normalizeString(filters.lineNo);

      const matchesMONo =
        !filters.MONo ||
        normalizeString(item.MONo) === normalizeString(filters.MONo);

      const matchesColor =
        !filters.Color ||
        normalizeString(item.Color) === normalizeString(filters.Color); // Use item.Color

      const matchesSize =
        !filters.Size ||
        normalizeString(item.Size) === normalizeString(filters.Size); // Use item.Size

      const matchesBuyer =
        !filters.Buyer ||
        normalizeString(item.Buyer) === normalizeString(filters.Buyer); // Use item.Buyer

      const matchesDefectName =
        !filters.defectName ||
        (Array.isArray(item.DefectArray) &&
          item.DefectArray.some(
            (defect) =>
              defect && // Check if defect object exists
              normalizeString(defect.defectName) ===
              normalizeString(filters.defectName)
          ));

      // Return based on non-date filters
      return (
        // matchesDate && // Removed
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
          : "0.00"; // Use string "0.00" for consistency

      // Aggregate DefectArray
      const defectMap = new Map();
      filteredData.forEach((item) => {
        if (Array.isArray(item.DefectArray)) {
          item.DefectArray.forEach((defect) => {
            if (!defect || !defect.defectName) return; // Skip invalid defects
            const normalizedDefectName = normalizeString(defect.defectName);
            if (
              filters.defectName &&
              normalizedDefectName !== normalizeString(filters.defectName)
            ) {
              return;
            }
            const currentDefect = defectMap.get(defect.defectName);
            if (currentDefect) {
              currentDefect.defectQty += (defect.defectQty || 0);
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
    if (options.addColors) groupByFields.push("Color"); // Use "Color"
    if (options.addSizes) groupByFields.push("Size");   // Use "Size"

    // Group the data
    const groupedData = {};
    filteredData.forEach((item) => {
      // Use actual field names from the item for grouping key
      const key = groupByFields.map((field) => {
          // Handle potential variations in field names (e.g., lineNo vs LineNo) - choose one consistently
          let value;
          if (field === 'lineNo') value = item.lineNo || item.LineNo;
          else if (field === 'Color') value = item.Color || item.ColorName;
          else if (field === 'Size') value = item.Size || item.SizeName;
          else value = item[field];
          return value || "N/A";
      }).join("||");

      if (!groupedData[key]) {
        groupedData[key] = {
          // Initialize with values from the first item in the group
          inspectionDate: options.addDates ? item.inspectionDate : "All",
          lineNo: options.addLines ? (item.lineNo || item.LineNo || "N/A") : "All",
          MONo: options.addMONos ? (item.MONo || "N/A") : "All",
          Buyer: options.addBuyers ? (item.Buyer || "N/A") : "All",
          Color: options.addColors ? (item.Color || item.ColorName || "N/A") : "All",
          Size: options.addSizes ? (item.Size || item.SizeName || "N/A") : "All",
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
          if (!defect || !defect.defectName) return; // Skip invalid defects
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
            // Ensure defectQty is initialized correctly
            groupedData[key].DefectArray.push({
                defectName: defect.defectName,
                defectQty: defect.defectQty || 0
             });
          }
        });
      }
    });

    // Convert grouped data to array and calculate defect rate
    let result = Object.values(groupedData).map((group) => {
      const defectRate =
        group.CheckedQty > 0
          ? ((group.totalDefectsQty / group.CheckedQty) * 100).toFixed(2)
          : "0.00"; // Use string "0.00"
      // Sort DefectArray by defectQty (descending)
      group.DefectArray.sort((a, b) => b.defectQty - a.defectQty);
      // Convert inspectionDate to MM/DD/YYYY for display *only if it's a date*
      if (group.inspectionDate !== "All" && group.inspectionDate !== "Total") {
        group.inspectionDate = convertDDMMYYYYToMMDDYYYY(group.inspectionDate);
      }
      return {
        ...group,
        defectRate: defectRate
      };
    });

    // Sort by inspectionDate (ascending) if Add Dates is selected and dates are present
    if (options.addDates && result.length > 0 && result[0].inspectionDate !== 'Total' && result[0].inspectionDate !== 'All') {
        result.sort((a, b) => {
            // Convert MM/DD/YYYY back to YYYY-MM-DD for reliable sorting
            const dateAStr = a.inspectionDate.includes('/') ? a.inspectionDate.split('/').reverse().join('-') : null;
            const dateBStr = b.inspectionDate.includes('/') ? b.inspectionDate.split('/').reverse().join('-') : null;

            // Handle cases where dates might be missing or invalid
            if (dateAStr && dateBStr) {
                return dateAStr.localeCompare(dateBStr);
            } else if (dateAStr) {
                return -1; // Place valid dates before invalid/missing ones
            } else if (dateBStr) {
                return 1; // Place valid dates before invalid/missing ones
            } else {
                return 0; // Keep order if both are invalid/missing
            }
        });
    }


    return result;
  };

  // Get the grouped data
  const groupedData = groupData();

  // Determine which columns to display based on options
  const columnsToDisplay = [];
  if (options.addDates) columnsToDisplay.push({ key: "inspectionDate", label: "Date" });
  if (options.addLines) columnsToDisplay.push({ key: "lineNo", label: "Line No" });
  if (options.addMONos) columnsToDisplay.push({ key: "MONo", label: "MO No" });
  if (options.addColors) columnsToDisplay.push({ key: "Color", label: "Color" });
  if (options.addSizes) columnsToDisplay.push({ key: "Size", label: "Size" });
  if (options.addBuyers) columnsToDisplay.push({ key: "Buyer", label: "Buyer" });


  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4"> {/* Added flex-wrap and gap */}
        <h2 className="text-xl font-semibold">Summary Table</h2>
        <div className="flex flex-wrap space-x-2 items-center"> {/* Added flex-wrap */}
          {/* Option Buttons with Checkboxes */}
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={options.addDates}
              onChange={() => handleOptionToggle("addDates")}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Dates</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={options.addLines}
              onChange={() => handleOptionToggle("addLines")}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Lines</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={options.addMONos}
              onChange={() => handleOptionToggle("addMONos")}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">MONos</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={options.addBuyers}
              onChange={() => handleOptionToggle("addBuyers")}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Buyers</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={options.addColors}
              onChange={() => handleOptionToggle("addColors")}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Colors</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={options.addSizes}
              onChange={() => handleOptionToggle("addSizes")}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Sizes</span>
          </label>
          {/* Separator */}
          <div className="border-l border-gray-300 h-6 mx-2"></div>
          {/* Add All Button */}
          <button
            onClick={handleAddAll}
            className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition duration-150 ease-in-out"
          >
            Add All
          </button>
          {/* Clear All Button */}
          <button
            onClick={handleClearAll}
            className="bg-gray-500 text-white px-3 py-1 rounded-md text-xs hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition duration-150 ease-in-out"
          >
            Clear All
          </button>
           {/* Separator */}
           <div className="border-l border-gray-300 h-6 mx-2"></div>
          {/* Download Excel Button */}
          <QCSunriseSummaryExcel
            groupedData={groupedData}
            columnsToDisplay={columnsToDisplay.map(col => col.label)} // Pass labels for Excel
            columnKeys={columnsToDisplay.map(col => col.key)} // Pass keys for data access
            isGenerating={isGeneratingExcel}
            setIsGenerating={setIsGeneratingExcel}
          />
          
          {/* Download PDF Button */}
          <QCSunriseSummaryPDF
            groupedData={groupedData}
            columnsToDisplay={columnsToDisplay.map(col => col.label)} // Pass labels for PDF
            columnKeys={columnsToDisplay.map(col => col.key)} // Pass keys for data access
            isGenerating={isGeneratingPDF}
            setIsGenerating={setIsGeneratingPDF}
          />
        </div>
      </div>
      {loading && ( // Show loading indicator if parent is loading
          <div className="text-center text-gray-500 py-4">Loading table data...</div>
      )}
      {error && !loading && ( // Show error if parent has error and not loading
          <div className="text-center text-red-600 py-4 bg-red-50 border border-red-200 rounded">
              Error loading data: {typeof error === 'string' ? error : 'An unexpected error occurred.'}
          </div>
      )}
      {!loading && !error && groupedData.length === 0 && ( // Show no data message only if not loading and no error
        <div className="text-center text-gray-600 py-4">
          No summary data available for the selected filters.
        </div>
      )}
      {!loading && !error && groupedData.length > 0 && ( // Render table only if data is available, not loading, and no error
        <div className="overflow-x-auto max-h-[500px] relative border border-gray-200 rounded">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {columnsToDisplay.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-semibold text-gray-700 whitespace-nowrap">
                  Checked
                </th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700 whitespace-nowrap">
                  Defects
                </th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700 whitespace-nowrap">
                  Rate (%)
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap min-w-[250px]"> {/* Min width for details */}
                  Defect Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {groupedData.map((item, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  {/* Render dynamic columns */}
                   {columnsToDisplay.map((col) => (
                     <td key={col.key} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                       {item[col.key]}
                     </td>
                   ))}
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap text-right">
                    {item.CheckedQty}
                  </td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap text-right">
                    {item.totalDefectsQty}
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-right font-medium ${getDefectRateColor(
                      parseFloat(item.defectRate) // Ensure comparison is numeric
                    )} ${parseFloat(item.defectRate) > 5 ? 'text-red-800' : parseFloat(item.defectRate) >= 3 ? 'text-orange-800' : 'text-green-800'}`}
                  >
                    {item.defectRate}%
                  </td>
                  <td className="px-1 py-1 text-gray-700 align-top"> {/* Reduced padding, align top */}
                    {item.DefectArray.length === 0 ? (
                      <div className="text-center text-gray-500 text-xs px-2 py-1">
                        {filters.defectName ? 'No matching defects' : 'No defects'}
                      </div>
                    ) : (
                      <table className="w-full table-auto text-xs">
                        {/* Optional: Add header only if needed and space allows */}
                        {/* <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-1 font-medium text-gray-600 text-left">Defect</th>
                            <th className="px-2 py-1 font-medium text-gray-600 text-right">Qty</th>
                            <th className="px-2 py-1 font-medium text-gray-600 text-right">Rate</th>
                          </tr>
                        </thead> */}
                        <tbody className="divide-y divide-gray-100">
                          {item.DefectArray.map((defect, defectIndex) => (
                            <tr key={defectIndex}>
                              <td className="px-2 py-0.5 text-gray-600 whitespace-nowrap truncate" title={defect.defectName}> {/* Truncate long names */}
                                {defect.defectName}
                              </td>
                              <td className="px-2 py-0.5 text-gray-600 text-right">
                                {defect.defectQty}
                              </td>
                              <td className="px-2 py-0.5 text-gray-600 text-right">
                                {item.CheckedQty > 0
                                  ? (
                                      (defect.defectQty / item.CheckedQty) *
                                      100
                                    ).toFixed(2)
                                  : "0.00"}
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
