import React, { useState, useEffect, useCallback, useMemo } from "react"; // Import useMemo
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";

import { API_BASE_URL } from "../../../../config";
import QCSunriseFilterPane from "./QCSunriseFilterPane";
import QCSunriseSummaryCard from "./QCSunriseSummaryCard";

// --- Helper functions (remain outside the component) ---
const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("-"))
    return dateStr;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  // Basic validation for date parts
  if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day))) return dateStr;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

const parseDDMMYYYY = (dateStr) => {
  if (!dateStr || !dateStr.includes("/")) return null;
  const [day, month, year] = dateStr.split("/").map(Number);
  // Ensure month is 0-indexed for Date constructor and basic validation
  if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return new Date(year, month - 1, day);
};

const getDefaultEndDate = () => new Date().toISOString().split("T")[0];
const getDefaultStartDate = () => {
  const today = new Date();
  today.setDate(today.getDate() - 3); // Default to last 4 days (including today)
  return today.toISOString().split("T")[0];
};
// --- End Helper functions ---


const QCSunriseDailyTrend = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
    lineNo: "",
    MONo: "",
    Color: "",
    Size: "",
    Buyer: "",
    defectName: "",
  });
  const [groupingOptions, setGroupingOptions] = useState({
    addLines: true,
    addMO: true,
    addBuyer: true,
    addColors: true,
    addSizes: true,
  });
  const [rows, setRows] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [totalChecked, setTotalChecked] = useState(0);
  const [totalDefects, setTotalDefects] = useState(0);
  const [overallDhu, setOverallDhu] = useState(0);

  // Memoize handleFilterChange
  const handleFilterChange = useCallback((newFilters) => {
    // Ensure dates are always present, falling back to defaults if needed
    const validatedFilters = {
        ...newFilters,
        startDate: newFilters.startDate || getDefaultStartDate(),
        endDate: newFilters.endDate || getDefaultEndDate(),
    };
    setActiveFilters(validatedFilters);
  }, []); // Empty dependency array as it only uses setActiveFilters

  // Memoize isFilterActive
  const isFilterActive = useCallback((filterName) => {
    // Ensure the filter value exists and is not just whitespace
    return (activeFilters[filterName] ?? "").trim() !== "";
  }, [activeFilters]); // Depends on activeFilters

  // Memoize fetchData
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setRawData([]); // Reset data states on new fetch
      setRows([]);
      setUniqueDates([]);
      setTotalChecked(0);
      setTotalDefects(0);
      setOverallDhu(0);

      // Create query params based on activeFilters, ensuring defaults are applied if needed
      const queryParams = { ...activeFilters };
      Object.keys(queryParams).forEach((key) => {
        if (
          queryParams[key] === "" ||
          queryParams[key] === null ||
          queryParams[key] === undefined
        ) {
          delete queryParams[key];
        }
      });

      // Ensure dates are always included in the query, using defaults if necessary
      if (!queryParams.startDate) queryParams.startDate = getDefaultStartDate();
      if (!queryParams.endDate) queryParams.endDate = getDefaultEndDate();

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `${API_BASE_URL}/api/sunrise/qc1-data?${queryString}`;

      const response = await axios.get(url);
      setRawData(response.data || []);
      setError(null); // Clear error on success
    } catch (err) {
      console.error("Fetch error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to fetch QC1 Sunrise data";
      setError(errorMsg);
      setRawData([]); // Clear data on error
      // Also reset summary stats on error
      setTotalChecked(0);
      setTotalDefects(0);
      setOverallDhu(0);
    } finally {
      setLoading(false);
    }
  }, [activeFilters]); // Depends only on activeFilters

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Depends on the memoized fetchData

  // Effect to calculate overall summary stats when rawData changes
  useEffect(() => {
    if (loading || error || !Array.isArray(rawData) || rawData.length === 0) {
      // Reset if loading, error, or no data
      setTotalChecked(0);
      setTotalDefects(0);
      setOverallDhu(0);
      return;
    }

    let checked = 0;
    let defects = 0;
    rawData.forEach((item) => {
      checked += item.CheckedQty || 0;
      defects += item.totalDefectsQty || 0;
    });

    const dhu =
      checked > 0 ? parseFloat(((defects / checked) * 100).toFixed(2)) : 0;
    setTotalChecked(checked);
    setTotalDefects(defects);
    setOverallDhu(dhu);
  }, [rawData, loading, error]); // Depends on rawData, loading, error

  // Memoize buildHierarchy
  const buildHierarchy = useCallback((data, groupingFields) => {
    const hierarchy = {};
    const normalizeString = (str) => (str ? String(str).trim() : "N/A");

    data.forEach((doc) => {
      const groupKey = groupingFields
        .map((field) => normalizeString(doc[field]))
        .join("|"); // Use '|' as a separator

      if (!hierarchy[groupKey]) {
        hierarchy[groupKey] = {
          groupValues: groupingFields.map((field) => normalizeString(doc[field])),
          dateMap: {},
        };
      }

      const formattedDate = formatDateToDDMMYYYY(doc.inspectionDate);
      if (!formattedDate) return; // Skip if date is invalid

      if (!hierarchy[groupKey].dateMap[formattedDate]) {
        // Initialize entry for this date
        hierarchy[groupKey].dateMap[formattedDate] = {
          CheckedQty: doc.CheckedQty || 0,
          totalDefectsQty: doc.totalDefectsQty || 0,
          DefectArray: Array.isArray(doc.DefectArray)
            ? doc.DefectArray.map((def) => ({ ...def, defectQty: def.defectQty || 0 })) // Ensure defectQty is a number
            : [],
        };
      } else {
        // Aggregate data for existing date entry
        const dateEntry = hierarchy[groupKey].dateMap[formattedDate];
        dateEntry.CheckedQty += doc.CheckedQty || 0;
        dateEntry.totalDefectsQty += doc.totalDefectsQty || 0;

        // Aggregate defects within the date entry
        const existingDefects = dateEntry.DefectArray || [];
        const newDefects = Array.isArray(doc.DefectArray) ? doc.DefectArray : [];

        newDefects.forEach((newDefect) => {
          if (!newDefect || !newDefect.defectName) return; // Skip invalid defects
          const existing = existingDefects.find(
            (d) => d.defectName === newDefect.defectName
          );
          if (existing) {
            existing.defectQty =
              (existing.defectQty || 0) + (newDefect.defectQty || 0);
          } else {
            // Add new defect, ensuring defectQty is initialized
            existingDefects.push({
              ...newDefect,
              defectQty: newDefect.defectQty || 0,
            });
          }
        });
        dateEntry.DefectArray = existingDefects;
      }
    });

    return hierarchy;
  }, []); // No external dependencies from component scope

  // Memoize buildRows
  const buildRows = useCallback((hierarchy, groupingFields, dates) => {
    const rows = [];

    // Sort group keys for consistent order
    const sortedGroupKeys = Object.keys(hierarchy).sort((a, b) => {
      const aValues = hierarchy[a].groupValues;
      const bValues = hierarchy[b].groupValues;
      for (let i = 0; i < Math.min(aValues.length, bValues.length); i++) {
        // Use localeCompare for robust string comparison
        const comparison = String(aValues[i]).localeCompare(String(bValues[i]));
        if (comparison !== 0) return comparison;
      }
      // If prefixes match, shorter key comes first (or equal length)
      return aValues.length - bValues.length;
    });

    sortedGroupKeys.forEach((groupKey) => {
      const group = hierarchy[groupKey];
      const groupData = {}; // Stores { date: rate } for the group total

      // Calculate total % for the group for each date
      dates.forEach((date) => {
        const dateEntry = group.dateMap[date];
        const checkedQty = dateEntry?.CheckedQty || 0;
        const defectsQty = dateEntry?.totalDefectsQty || 0;
        // Calculate rate, handle division by zero
        groupData[date] = checkedQty > 0 ? (defectsQty / checkedQty) * 100 : 0;
      });

      // Add the group row (TOTAL %)
      rows.push({
        type: "group",
        key: groupKey + "-group", // Unique key for React list
        groupValues: group.groupValues,
        data: groupData,
      });

      // Collect all unique defect names within this group across all dates
      const defectNames = new Set();
      Object.values(group.dateMap).forEach((dateEntry) => {
        if (dateEntry && Array.isArray(dateEntry.DefectArray)) {
          dateEntry.DefectArray.forEach((defect) => {
            if (defect && defect.defectName) defectNames.add(defect.defectName);
          });
        }
      });

      // Add rows for each defect within the group
      [...defectNames].sort().forEach((defectName) => {
        const defectData = {}; // Stores { date: rate } for this specific defect
        // Calculate % for this specific defect for each date
        dates.forEach((date) => {
          const dateEntry = group.dateMap[date];
          if (dateEntry && Array.isArray(dateEntry.DefectArray)) {
            const defect = dateEntry.DefectArray.find(
              (d) => d.defectName === defectName
            );
            const checkedQty = dateEntry.CheckedQty || 0;
            // Calculate rate, handle division by zero and missing defect
            defectData[date] =
              defect && checkedQty > 0
                ? ((defect.defectQty || 0) / checkedQty) * 100
                : 0;
          } else {
            defectData[date] = 0; // No data for this defect on this date
          }
        });

        // Add the defect row
        rows.push({
          type: "defect",
          key: groupKey + "-" + defectName, // Unique key
          groupValues: group.groupValues, // Keep group values for potential merging/display
          defectName: defectName,
          data: defectData,
        });
      });
    });

    return rows;
  }, []); // No external dependencies from component scope

  // Effect to process data and build rows for the table
  useEffect(() => {
    if (loading || error || !Array.isArray(rawData) || rawData.length === 0) {
      setRows([]);
      setUniqueDates([]);
      return; // Exit if no data or loading/error state
    }

    // Determine active grouping fields based on options and active filters
    const groupingFieldsConfig = [
      { key: "lineNo", option: "addLines", filterActive: isFilterActive("lineNo") },
      { key: "MONo", option: "addMO", filterActive: isFilterActive("MONo") },
      { key: "Buyer", option: "addBuyer", filterActive: isFilterActive("Buyer") },
      { key: "Color", option: "addColors", filterActive: isFilterActive("Color") },
      { key: "Size", option: "addSizes", filterActive: isFilterActive("Size") },
    ];

    const activeGroupingFields = groupingFieldsConfig
      // Include field if its option is checked AND it's not already filtered
      .filter((field) => groupingOptions[field.option] && !field.filterActive)
      .map((field) => field.key);

    // Extract unique dates from rawData and sort them
    const datesSet = new Set(
      rawData.map((d) => formatDateToDDMMYYYY(d.inspectionDate)).filter(Boolean) // Filter out invalid dates
    );
    const sortedDates = [...datesSet].sort((a, b) => {
      const dateA = parseDDMMYYYY(a);
      const dateB = parseDDMMYYYY(b);
      if (!dateA || !dateB) return 0; // Handle potential parsing errors
      return dateA - dateB; // Sort chronologically
    });
    setUniqueDates(sortedDates);

    // Build the hierarchical data structure using the memoized function
    const hierarchy = buildHierarchy(rawData, activeGroupingFields);

    // Build the flat array of rows for the table using the memoized function
    const tableRows = buildRows(hierarchy, activeGroupingFields, sortedDates);
    setRows(tableRows);

  // Dependencies: rawData, groupingOptions, loading, error, activeFilters (implicitly via isFilterActive),
  // and the memoized functions buildHierarchy, buildRows, isFilterActive
  }, [rawData, groupingOptions, loading, error, activeFilters, buildHierarchy, buildRows, isFilterActive]);


  // --- Color coding functions (remain the same) ---
  const getBackgroundColor = (rate) => {
    if (rate > 3) return "bg-red-100";
    if (rate >= 2) return "bg-yellow-100";
    return "bg-green-100";
  };

  const getFontColor = (rate) => {
    if (rate > 3) return "text-red-800";
    if (rate >= 2) return "text-orange-800";
    return "text-green-800";
  };

  const getBackgroundColorRGB = (rate) => {
    if (rate > 3) return [254, 226, 226]; // Light Red
    if (rate >= 2) return [254, 243, 199]; // Light Yellow/Orange
    return [220, 252, 231]; // Light Green
  };

  const getFontColorRGB = (rate) => {
    if (rate > 3) return [153, 27, 27]; // Dark Red
    if (rate >= 2) return [154, 52, 18]; // Dark Orange
    return [6, 95, 70]; // Dark Green
  };

  const getBackgroundColorHex = (rate) => {
    if (rate > 3) return "FEE2E2"; // Tailwind red-100
    if (rate >= 2) return "FEF3C7"; // Tailwind yellow-100 (or amber-100)
    return "DCFCE7"; // Tailwind green-100
  };
  // --- End Color coding functions ---

  // Memoize getCurrentGroupingFieldNames
  const getCurrentGroupingFieldNames = useCallback(() => {
    const names = [];
    // Check if option is enabled AND the corresponding filter is NOT active
    if (groupingOptions.addLines && !isFilterActive("lineNo")) names.push("Line");
    if (groupingOptions.addMO && !isFilterActive("MONo")) names.push("MO");
    if (groupingOptions.addBuyer && !isFilterActive("Buyer")) names.push("Buyer");
    if (groupingOptions.addColors && !isFilterActive("Color")) names.push("Color");
    if (groupingOptions.addSizes && !isFilterActive("Size")) names.push("Size");
    return names;
  }, [groupingOptions, isFilterActive]); // Depends on groupingOptions and the memoized isFilterActive

  // Memoize prepareExportData
  const prepareExportData = useCallback(() => {
    const exportData = [];
    const ratesMap = new Map(); // To store rates for coloring cells { 'rowIndex-colIndex': rate }
    const groupingFieldNames = getCurrentGroupingFieldNames();
    const numGroupingCols = groupingFieldNames.length;

    // --- Title Row ---
    exportData.push([
      "Daily Defect Trend Analysis",
      ...Array(uniqueDates.length + numGroupingCols).fill(""), // Span title across columns
    ]);
    ratesMap.set(`0-0`, -1); // Mark title cell as non-data for styling

    // --- Spacer Row ---
    exportData.push(Array(uniqueDates.length + numGroupingCols + 1).fill(""));
    ratesMap.set(`1-0`, -1); // Mark spacer cell

    // --- Header Row ---
    const headerRow = [...groupingFieldNames, "Defect / Group", ...uniqueDates];
    exportData.push(headerRow);
    // Mark header cells as non-data for styling
    headerRow.forEach((_, colIndex) => ratesMap.set(`2-${colIndex}`, -1));

    // --- Data Rows ---
    let rowIndex = 3; // Start data rows from index 3
    let lastDisplayedGroupValues = Array(numGroupingCols).fill(null); // For merging cells logic

    rows.forEach((row) => {
      const rowData = [];
      const isGroupRow = row.type === "group";

      // Add grouping columns, handling merging logic
      for (let colIndex = 0; colIndex < numGroupingCols; colIndex++) {
        const currentValue = row.groupValues[colIndex];
        let displayValue = "";

        // Logic to display group value only once for merged cells
        if (isGroupRow) {
            // If it's a group row and the value is different from the last displayed one in this column
            if (currentValue !== lastDisplayedGroupValues[colIndex]) {
                displayValue = currentValue;
                lastDisplayedGroupValues[colIndex] = currentValue;
                // Reset subsequent group values in the tracker for this row (important for correct merging)
                for (let k = colIndex + 1; k < numGroupingCols; k++) {
                    lastDisplayedGroupValues[k] = null;
                }
            }
        } else {
            // For defect rows, ensure the tracker is updated if the group value changes
            // This prevents incorrect merging if a defect row starts a new sub-group visually
             if (currentValue !== lastDisplayedGroupValues[colIndex]) {
                lastDisplayedGroupValues[colIndex] = currentValue;
                 for (let k = colIndex + 1; k < numGroupingCols; k++) {
                    lastDisplayedGroupValues[k] = null;
                }
            }
            // Defect rows don't display the group value themselves (it's handled by the group row span)
            // displayValue remains ""
        }
        rowData.push(displayValue);
      }


      // Add "Defect / Group" column
      rowData.push(isGroupRow ? "TOTAL %" : row.defectName);

      // Add data columns (rates for each date)
      uniqueDates.forEach((date, dateIndex) => {
        const rate = row.data[date] || 0;
        rowData.push(rate > 0 ? `${rate.toFixed(2)}%` : ""); // Format as percentage or empty string
        // Store the raw rate for coloring
        ratesMap.set(`${rowIndex}-${numGroupingCols + 1 + dateIndex}`, rate);
      });

      // Mark grouping and label columns as non-data for coloring
      for (let c = 0; c <= numGroupingCols; c++) {
        ratesMap.set(`${rowIndex}-${c}`, -1);
      }

      exportData.push(rowData);
      rowIndex++;
    });

    // --- Overall Total Row ---
    const totalRow = [...Array(numGroupingCols).fill(""), "OVERALL TOTAL %"];
    uniqueDates.forEach((date, dateIndex) => {
      // Calculate overall total rate for the date from rawData
      const dateData = rawData.filter(
        (d) => formatDateToDDMMYYYY(d.inspectionDate) === date
      );
      const totalCheckedForDate = dateData.reduce(
        (sum, d) => sum + (d.CheckedQty || 0),
        0
      );
      const totalDefectsForDate = dateData.reduce(
        (sum, d) => sum + (d.totalDefectsQty || 0),
        0
      );
      const rate =
        totalCheckedForDate > 0
          ? (totalDefectsForDate / totalCheckedForDate) * 100
          : 0;
      totalRow.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
      // Store rate for coloring
      ratesMap.set(`${rowIndex}-${numGroupingCols + 1 + dateIndex}`, rate);
    });
    // Mark grouping columns in total row as non-data for styling
    for (let c = 0; c <= numGroupingCols; c++) {
        ratesMap.set(`${rowIndex}-${c}`, -1);
    }
    exportData.push(totalRow);

    return { exportData, ratesMap, numGroupingCols };
  }, [rows, uniqueDates, rawData, getCurrentGroupingFieldNames]); // Dependencies

  // Memoize downloadExcel
  const downloadExcel = useCallback(() => {
    const { exportData, ratesMap, numGroupingCols } = prepareExportData();
    if (exportData.length <= 3) { // Check if there's actual data besides headers/spacer
      alert("No data available to export.");
      return;
    }
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const groupingFieldNames = getCurrentGroupingFieldNames(); // Get names for column widths

    // --- Cell Styling Logic ---
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (!cell) continue; // Skip empty cells

        const rate = ratesMap.get(`${R}-${C}`); // Get rate for coloring (-1 for non-data cells)
        const isHeaderRow = R === 2;
        const isTotalRow = R === range.e.r;
        const isGroupLabelCol = C === numGroupingCols;
        const isDataRow = R > 2 && R < range.e.r;
        // Check if the row in the original data corresponds to a "TOTAL %" row
        const isActualGroupRow = isDataRow && exportData[R][numGroupingCols] === "TOTAL %";
        const cellHasValue = cell.v !== undefined && cell.v !== "";

        // Default styles
        let fgColor = "FFFFFF"; // White background
        let fontStyle = {};
        let alignment = { horizontal: C <= numGroupingCols ? "left" : "center", vertical: "middle" };
        let fontColor = "000000"; // Black text
        let borderColor = "D1D5DB"; // Gray-300

        // Apply styles based on cell type
        if (R === 0) { // Title Row
            // Merged cell styling is handled later
        } else if (R === 1) { // Spacer Row
            // No specific style needed, default is fine
        } else if (isHeaderRow) {
            fgColor = "E5E7EB"; // Gray-200
            fontStyle = { bold: true };
            fontColor = "1F2937"; // Gray-800
            borderColor = "9CA3AF"; // Gray-400
        } else if (isTotalRow) {
            fgColor = "E5E7EB"; // Gray-200
            fontStyle = { bold: true };
            fontColor = "1F2937"; // Gray-800
            borderColor = "9CA3AF"; // Gray-400
            // Apply rate-based color if it's a data cell in the total row
            if (rate !== undefined && rate > 0) {
                fgColor = getBackgroundColorHex(rate);
                const rgbFont = getFontColorRGB(rate);
                fontColor = rgbFont.map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
            } else if (rate === 0) { // Handle 0% in total row
                fgColor = "E5E7EB"; // Keep row background
                fontColor = "1F2937"; // Keep row text color
            }
        } else if (C < numGroupingCols) { // Grouping Columns (before Label)
            if (isActualGroupRow) { // Group Header Row (within data)
                fgColor = "F1F5F9"; // Slate-100
                fontStyle = { bold: cellHasValue }; // Bold only if it has the group name
                fontColor = "334155"; // Slate-700
                borderColor = "94A3B8"; // Slate-400
                if (cellHasValue) alignment.vertical = "top"; // Align merged group names top
            } else { // Defect Row (within grouping columns)
                fgColor = "FFFFFF"; // White
                borderColor = "D1D5DB"; // Gray-300
                // Make text invisible if it's an empty cell part of a merge group
                if (!cellHasValue) fontColor = "FFFFFF";
                else fontColor = "374151"; // Gray-700
            }
        } else if (isGroupLabelCol) { // "Defect / Group" Column
            if (isActualGroupRow) { // "TOTAL %" Label
                fgColor = "64748B"; // Slate-500
                fontStyle = { bold: true };
                fontColor = "FFFFFF"; // White
                borderColor = "475569"; // Slate-600
            } else { // Defect Name Label
                fgColor = "FFFFFF"; // White
                fontColor = "374151"; // Gray-700
                borderColor = "D1D5DB"; // Gray-300
                alignment.indent = 1; // Indent defect names slightly
            }
        } else if (rate !== undefined && rate > 0) { // Data Cells with rate > 0
            fgColor = getBackgroundColorHex(rate);
            const rgbFont = getFontColorRGB(rate);
            fontColor = rgbFont.map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
            if (isActualGroupRow) { // Group Total % Cell
                fontStyle = { bold: true };
                borderColor = "475569"; // Slate-600 (match label)
            } else { // Defect % Cell
                 borderColor = "D1D5DB"; // Gray-300
            }
        } else if (rate === 0) { // Data Cells with rate = 0
             if (isActualGroupRow) { // Group Total % Cell (0%)
                fgColor = "64748B"; // Slate-500 (match label)
                fontColor = "FFFFFF"; // White
                fontStyle = { bold: true };
                borderColor = "475569"; // Slate-600
            } else { // Defect % Cell (0%)
                fgColor = "FFFFFF"; // White
                fontColor = "6B7280"; // Gray-500 (less prominent)
                borderColor = "D1D5DB"; // Gray-300
            }
        }
        // else: rate is undefined or -1 (non-data cells like title, spacer, headers) - use default styles

        // Apply the calculated styles
        cell.s = {
          border: {
            top: { style: "thin", color: { rgb: borderColor } },
            bottom: { style: "thin", color: { rgb: borderColor } },
            left: { style: "thin", color: { rgb: borderColor } },
            right: { style: "thin", color: { rgb: borderColor } },
          },
          fill: { fgColor: { rgb: fgColor } },
          alignment: alignment,
          font: { ...fontStyle, color: { rgb: fontColor } },
        };
      }
    }
    // --- End Cell Styling ---

    // --- Column Widths ---
    const colWidths = [];
    groupingFieldNames.forEach(() => colWidths.push({ wch: 15 })); // Grouping columns
    colWidths.push({ wch: 30 }); // Defect/Group label column
    uniqueDates.forEach(() => colWidths.push({ wch: 12 })); // Date columns
    ws["!cols"] = colWidths;
    // --- End Column Widths ---

    // --- Merging Cells ---
    // Merge Title Row
    if (range.e.c > 0) { // Ensure there's more than one column
        ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } }]; // Merge A1 to last column
        // Style the merged title cell
        if (ws["A1"]) {
            ws["A1"].s = ws["A1"].s || {}; // Ensure style object exists
            ws["A1"].s.alignment = { horizontal: "center", vertical: "middle" };
            ws["A1"].s.font = { sz: 14, bold: true };
        }
    }

    // Merge Grouping Columns Vertically
    let mergeSpans = ws["!merges"] || []; // Start with existing merges (title)
    let groupStartRow = {}; // Track start row for each grouping column level { colIndex: startRowIndex }

    // Iterate through data rows (skip title, spacer, header)
    for (let R = 3; R < exportData.length - 1; ++R) { // Stop before the total row
        const isGroupRow = exportData[R][numGroupingCols] === "TOTAL %";
        const isFirstDataRowOfGroup = isGroupRow; // A group visually starts with its "TOTAL %" row

        for (let C = 0; C < numGroupingCols; ++C) {
            const cellValue = exportData[R][C];

            // If this row starts a new visual group block for this column level
            if (isFirstDataRowOfGroup && cellValue !== "") {
                // If there was a previous span ending just before this row for this column, merge it now
                if (groupStartRow[C] !== undefined && R > groupStartRow[C]) {
                    if (exportData[groupStartRow[C]][C] !== "") { // Check if the top cell had content
                        mergeSpans.push({ s: { r: groupStartRow[C], c: C }, e: { r: R - 1, c: C } });
                    }
                }
                groupStartRow[C] = R; // Mark the start row for the new block
            }

            // Determine if this is the last row of the current visual group block
            let endOfBlock = false;
            if (R + 1 < exportData.length - 1) { // Check next row exists and is not total row
                // If the next row is a "TOTAL %" row AND its value in this column is different (or empty), the current block ends here
                if (exportData[R+1][numGroupingCols] === "TOTAL %") {
                    if (C === 0 || exportData[R+1][C] !== exportData[R][C]) { // Check if the group value changes in the next row for this column or it's the first column
                        endOfBlock = true;
                    }
                }
            } else if (R + 1 === exportData.length - 1) { // If next row is the total row, the block ends
                endOfBlock = true;
            }


            // If we have a start row recorded for this column and we've reached the end of the block
            if (groupStartRow[C] !== undefined && endOfBlock) {
                const startR = groupStartRow[C];
                const endR = R; // The current row is the end of the span

                // Only merge if the span is more than one row and the starting cell wasn't empty
                if (endR >= startR) { // Allow single-row "spans" if needed, but Excel usually handles this
                    if (exportData[startR][C] !== "") { // Check if the top cell has content
                         mergeSpans.push({ s: { r: startR, c: C }, e: { r: endR, c: C } });
                    }
                }
                // Reset the start row tracker for this column
                delete groupStartRow[C];
            }
        }
         // Reset all column trackers when a new top-level group starts (indicated by non-empty first column on a group row)
        if (isFirstDataRowOfGroup && exportData[R][0] !== "") {
             groupStartRow = {}; // Reset tracker for all columns
             if (exportData[R][0] !== "") groupStartRow[0] = R; // Start tracking for the first column
        }
    }
    ws["!merges"] = mergeSpans; // Assign updated merges back
    // --- End Merging Cells ---


    // --- Create Workbook and Download ---
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defect Trend");
    XLSX.writeFile(wb, "DailyDefectTrend.xlsx");
    // --- End Create Workbook ---

  }, [prepareExportData, uniqueDates, getCurrentGroupingFieldNames]); // Dependencies

  // Memoize downloadPDF
  const downloadPDF = useCallback(() => {
    const { exportData, ratesMap, numGroupingCols } = prepareExportData();
     if (exportData.length <= 3) { // Check if there's actual data besides headers/spacer
      alert("No data available to export.");
      return;
    }
    const doc = new jsPDF({ orientation: "landscape" });
    const tablePlugin = typeof autoTable === 'function' ? autoTable : window.autoTable; // Compatibility

    if (!tablePlugin) {
        console.error("jsPDF-AutoTable plugin not found.");
        alert("PDF export functionality is unavailable. Please check console.");
        return;
    }

    const head = [exportData[2]]; // Header row is at index 2
    const body = exportData.slice(3); // Data rows start from index 3

    tablePlugin(doc, {
      head: head,
      body: body,
      startY: 20, // Start table below title
      theme: "grid", // Use grid lines
      headStyles: {
        fillColor: [229, 231, 235], // Gray-200
        textColor: [31, 41, 55], // Gray-800
        fontStyle: "bold",
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [156, 163, 175], // Gray-400
      },
      styles: { // Default styles for all cells
        cellPadding: 1.5,
        fontSize: 7, // Smaller font size for landscape
        valign: 'middle',
        lineColor: [209, 213, 219], // Gray-300
        lineWidth: 0.1,
      },
      columnStyles: {
        // Align grouping columns and label column left
        ...Array.from({ length: numGroupingCols + 1 }, (_, i) => i).reduce((acc, i) => {
            acc[i] = { halign: 'left' };
            return acc;
        }, {}),
        // Align date columns center
        ...uniqueDates.reduce((acc, _, index) => {
            acc[numGroupingCols + 1 + index] = { halign: 'center' };
            return acc;
        }, {}),
      },
      didParseCell: (data) => {
        // Apply specific styles based on cell content and position
        const rowIndexInExportData = data.row.index + 3; // Get original row index from exportData
        const colIndex = data.column.index;
        const rate = ratesMap.get(`${rowIndexInExportData}-${colIndex}`); // Get rate for coloring
        const cellHasValue = data.cell.raw !== undefined && data.cell.raw !== "";
        const isTotalRow = data.row.index === body.length - 1; // Is it the last row (Overall Total)?
        const isGroupLabelCol = colIndex === numGroupingCols;
        // Check if the row in the original data corresponds to a "TOTAL %" row
        const isActualGroupRow = !isTotalRow && exportData[rowIndexInExportData][numGroupingCols] === "TOTAL %";

        if (data.section === 'body') {
            let fillColor = [255, 255, 255]; // Default white
            let textColor = [55, 65, 81]; // Default gray-700
            let fontStyle = 'normal';
            let lineColor = [209, 213, 219]; // Default gray-300

            if (isTotalRow) {
                fillColor = [229, 231, 235]; // Gray-200
                textColor = [31, 41, 55]; // Gray-800
                fontStyle = 'bold';
                lineColor = [156, 163, 175]; // Gray-400
                // Apply rate color if applicable
                if (rate !== undefined && rate > 0) {
                    fillColor = getBackgroundColorRGB(rate);
                    textColor = getFontColorRGB(rate);
                } else if (rate === 0) { // Handle 0% in total row
                    fillColor = [229, 231, 235]; // Keep row background
                    textColor = [31, 41, 55]; // Keep row text color
                }
            } else if (colIndex < numGroupingCols) { // Grouping columns
                 fillColor = isActualGroupRow ? [241, 245, 249] : [255, 255, 255]; // Slate-100 for group row, white otherwise
                 lineColor = isActualGroupRow ? [148, 163, 184] : [209, 213, 219]; // Slate-400 / Gray-300
                 if (!cellHasValue) {
                     // Make text color same as background for merged cells effect
                     textColor = fillColor;
                 } else {
                     textColor = [51, 65, 85]; // Slate-700
                     fontStyle = 'bold'; // Bold the group name
                     data.cell.styles.valign = 'top'; // Align top for merged cells
                 }
            } else if (isGroupLabelCol) { // "Defect / Group" column
                if (isActualGroupRow) { // "TOTAL %" label
                    fillColor = [100, 116, 139]; // Slate-500
                    fontStyle = 'bold';
                    textColor = [255, 255, 255]; // White
                    lineColor = [71, 85, 105]; // Slate-600
                } else { // Defect name label
                    fillColor = [255, 255, 255]; // White
                    fontStyle = 'normal';
                    textColor = [55, 65, 81]; // Gray-700
                    lineColor = [209, 213, 219]; // Gray-300
                    // Add padding for indentation
                    data.cell.styles.cellPadding = { ...data.cell.styles.cellPadding, left: 3 };
                }
            } else if (rate !== undefined && rate > 0) { // Data cells with rate > 0
                fillColor = getBackgroundColorRGB(rate);
                textColor = getFontColorRGB(rate);
                if (isActualGroupRow) {
                    fontStyle = 'bold';
                    lineColor = [71, 85, 105]; // Match group label border
                } else {
                    fontStyle = 'normal';
                    lineColor = [209, 213, 219]; // Gray-300
                }
            } else if (rate === 0) { // Data cells with rate = 0
                 if (isActualGroupRow) { // Group Total % (0%)
                    fillColor = [100, 116, 139]; // Slate-500 (match label)
                    textColor = [255, 255, 255]; // White
                    fontStyle = 'bold';
                    lineColor = [71, 85, 105]; // Slate-600
                } else { // Defect % (0%)
                    fillColor = [255, 255, 255]; // White
                    textColor = [156, 163, 175]; // Gray-400 (less prominent)
                    fontStyle = 'normal';
                    lineColor = [209, 213, 219]; // Gray-300
                }
            }
            // else: rate is undefined or -1 (shouldn't happen in body data cells)

            // Apply styles
            data.cell.styles.fillColor = fillColor;
            data.cell.styles.textColor = textColor;
            data.cell.styles.fontStyle = fontStyle;
            data.cell.styles.lineColor = lineColor;
        } else if (data.section === 'head') {
             // Ensure header alignment matches columnStyles
             data.cell.styles.halign = colIndex <= numGroupingCols ? 'left' : 'center';
        }
      },
      didDrawPage: (data) => {
        // Add title to each page
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(
          "Daily Defect Trend Analysis",
          doc.internal.pageSize.getWidth() / 2, // Center horizontally
          15, // Position from top
          { align: "center" }
        );
      },
       // --- Row Span Logic for PDF ---
       // This attempts to mimic Excel's vertical merge for grouping columns
       willDrawCell: (data) => {
            if (data.section === 'body' && data.column.index < numGroupingCols) {
                const rowIndexInBody = data.row.index;
                const colIndex = data.column.index;
                const cellValue = body[rowIndexInBody][colIndex]; // Get value from original body data

                // If the cell is empty, it might be part of a span
                if (cellValue === "") {
                    // Look upwards to find the start of the span
                    let spanMasterRowIndex = rowIndexInBody - 1;
                    while (spanMasterRowIndex >= 0 && body[spanMasterRowIndex][colIndex] === "") {
                        spanMasterRowIndex--;
                    }

                    // If we found a non-empty cell above within the current page's drawn rows
                    if (spanMasterRowIndex >= 0 && spanMasterRowIndex >= data.table.startPage) { // Check if master row is on current page
                        const masterCell = data.table.body[spanMasterRowIndex]?.cells[colIndex];
                        // If the master cell exists and is going to be drawn
                        if (masterCell && masterCell.willDraw) {
                            // Increment the master cell's rowSpan and prevent drawing the current cell
                            masterCell.rowSpan = (masterCell.rowSpan || 1) + 1;
                            data.cell.willDraw = false; // Don't draw this cell, let the master span over it
                        }
                        // If master cell is not on this page or not drawn, draw this cell normally (might happen at page breaks)
                    }
                    // If no master cell found above, draw this cell normally (shouldn't happen with correct export data)

                } else {
                    // If the cell has value, it's the start of a potential span
                    data.cell.rowSpan = 1; // Initialize rowSpan
                }
            }
        },
       // --- End Row Span Logic ---
    });

    doc.save("DailyDefectTrend.pdf");
  }, [prepareExportData, uniqueDates]); // Dependencies

  // Memoize event handlers for options
  const handleOptionToggle = useCallback((option) => {
    setGroupingOptions((prev) => ({ ...prev, [option]: !prev[option] }));
  }, []); // Depends only on setGroupingOptions

  const handleAddAll = useCallback(() => {
    setGroupingOptions({
      addLines: true,
      addMO: true,
      addBuyer: true,
      addColors: true,
      addSizes: true,
    });
  }, []); // Depends only on setGroupingOptions

  const handleClearAll = useCallback(() => {
    setGroupingOptions({
      addLines: false,
      addMO: false,
      addBuyer: false,
      addColors: false,
      addSizes: false,
    });
  }, []); // Depends only on setGroupingOptions

  // Memoize summaryStats object
  const summaryStats = useMemo(() => ({
    totalCheckedQty: totalChecked,
    totalDefectsQty: totalDefects,
    defectRate: overallDhu,
  }), [totalChecked, totalDefects, overallDhu]); // Depends on calculated totals

  // Memoize tableGroupingHeaders
  const tableGroupingHeaders = useMemo(() => getCurrentGroupingFieldNames(), [getCurrentGroupingFieldNames]);

  // Memoize calculateRowSpan
  const calculateRowSpan = useCallback((groupRowIndex, groupKey) => {
    let spanCount = 1; // The group row itself counts as 1
    // Look ahead for subsequent defect rows belonging to this group
    for (let i = groupRowIndex + 1; i < rows.length; i++) {
      // Check if the next row is a defect row AND its key starts with the group's key prefix
      if (rows[i].type === "defect" && rows[i].key.startsWith(groupKey + "-")) {
        spanCount++;
      } else {
        // If it's not a defect row or belongs to a different group, stop counting
        break;
      }
    }
    return spanCount;
  }, [rows]); // Depends on the rows state


  // --- JSX Rendering ---
  return (
    <div className="p-4 space-y-6">
      {/* Filter Pane */}
      <QCSunriseFilterPane
        onFilterChange={handleFilterChange}
        initialFilters={activeFilters}
      />

      {/* Summary Card Section */}
      <div className="mb-6">
        {loading && (
          <div className="text-center p-4 text-gray-500">Loading summary...</div>
        )}
        {error && (
          <div className="text-center p-4 text-red-500 bg-red-50 rounded border border-red-200">
            Error loading summary: {error}
          </div>
        )}
        {/* Message when no data found for filters */}
        {!loading &&
          !error &&
          rawData.length === 0 &&
          (activeFilters.startDate || activeFilters.endDate) && ( // Only show if filters were applied
            <div className="text-center p-4 text-gray-500 bg-white shadow-md rounded-lg">
              No data available for the selected filters.
            </div>
          )}
        {/* Display Summary Card only if data is loaded successfully */}
        {!loading && !error && rawData.length > 0 && (
          <QCSunriseSummaryCard summaryStats={summaryStats} />
        )}
      </div>

      {/* Trend Table Section */}
      <div className="bg-white shadow-md rounded-lg p-4">
        {/* Header with Title, Grouping Options, and Download Buttons */}
        {/* Only show controls if not loading and no error */}
        {!loading && !error && (
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
              Daily Defect Trend
            </h2>

            {/* Grouping Options and Download Buttons Container */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-sm font-medium text-gray-600 mr-2">
                Group by:
              </span>

              {/* Checkbox options for grouping */}
              {[
                { label: "Lines", option: "addLines", filterKey: "lineNo" },
                { label: "MO", option: "addMO", filterKey: "MONo" },
                { label: "Buyer", option: "addBuyer", filterKey: "Buyer" },
                { label: "Colors", option: "addColors", filterKey: "Color" },
                { label: "Sizes", option: "addSizes", filterKey: "Size" },
              ].map(({ label, option, filterKey }) => {
                const isDisabled = isFilterActive(filterKey); // Check if this field is already filtered
                return (
                  <label
                    key={option}
                    className={`flex items-center space-x-1 ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    title={isDisabled ? `Grouping by ${label} disabled because it's already filtered.` : `Group results by ${label}`}
                  >
                    <input
                      type="checkbox"
                      // Checked if option selected OR if filter active (visual cue)
                      checked={groupingOptions[option] || isDisabled}
                      // Only allow change if not disabled by an active filter
                      onChange={() => !isDisabled && handleOptionToggle(option)}
                      disabled={isDisabled}
                      className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${isDisabled ? '' : 'cursor-pointer'}`}
                    />
                    <span
                      className={`text-sm ${isDisabled ? "text-gray-400" : "text-gray-700"}`}
                    >
                      {label}
                    </span>
                  </label>
                );
              })}

              {/* Add All / Clear All Buttons */}
              <button
                onClick={handleAddAll}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                title="Select all available grouping options"
              >
                Add All
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                title="Clear all grouping options"
              >
                Clear All
              </button>

              {/* Separator */}
              <div className="border-l border-gray-300 h-6 mx-2"></div>

              {/* Download Buttons */}
              <button
                onClick={downloadExcel}
                className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download as Excel"
                disabled={rows.length === 0} // Disable if no rows to download
              >
                <FaFileExcel className="mr-1 h-4 w-4" /> Excel
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download as PDF"
                disabled={rows.length === 0} // Disable if no rows to download
              >
                <FaFilePdf className="mr-1 h-4 w-4" /> PDF
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center p-4 text-gray-500">
            Loading trend data...
          </div>
        )}
        {/* Error State */}
        {error && (
          <div className="text-center p-4 text-red-500 bg-red-50 rounded border border-red-200">
            Error loading trend data: {error}
          </div>
        )}
        {/* No Data State (after successful load but empty result due to grouping) */}
        {!loading && !error && rows.length === 0 && rawData.length > 0 && (
          <div className="text-center p-4 text-gray-500">
            No trend data to display based on current grouping. Try adjusting 'Group by' options.
          </div>
        )}
        {/* No Data State (when initial fetch yields no data for filters) */}
        {!loading &&
          !error &&
          rows.length === 0 &&
          rawData.length === 0 &&
          (activeFilters.startDate || activeFilters.endDate) && ( // Only show if filters were applied
            <div className="text-center p-4 text-gray-500">
              No data found for the selected filters.
            </div>
          )}

        {/* Table Display (only if data is loaded and processed) */}
        {!loading && !error && rows.length > 0 && (
          <div
            className="overflow-x-auto border border-gray-300 rounded-md"
            style={{ maxHeight: "60vh" }} // Limit height and enable vertical scroll
          >
            <table className="min-w-full border-collapse align-middle text-xs">
              {/* Table Header */}
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  {/* Dynamic Grouping Headers */}
                  {tableGroupingHeaders.map((header, index) => (
                    <th
                      key={header}
                      className="py-2 px-3 border-b border-r border-gray-300 text-left font-semibold text-gray-700 sticky bg-gray-100 z-20 whitespace-nowrap align-middle"
                      // Sticky positioning for horizontal scroll
                      style={{ left: `${index * 100}px`, minWidth: "100px" }}
                    >
                      {header}
                    </th>
                  ))}
                  {/* Fixed "Defect / Group" Header */}
                  <th
                    className="py-2 px-3 border-b border-r border-gray-300 text-left font-semibold text-gray-700 sticky bg-gray-100 z-20 whitespace-nowrap align-middle"
                    style={{
                      left: `${tableGroupingHeaders.length * 100}px`, // Position after dynamic headers
                      minWidth: "150px",
                    }}
                  >
                    Defect / Group
                  </th>
                  {/* Dynamic Date Headers */}
                  {uniqueDates.map((date) => (
                    <th
                      key={date}
                      className="py-2 px-3 border-b border-r border-gray-300 text-center font-semibold text-gray-700 whitespace-nowrap align-middle"
                      style={{ minWidth: "80px" }}
                    >
                      {date} {/* Display date in DD/MM/YYYY */}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="bg-white">
                {rows.map((row, rowIndex) => {
                  // --- Group Row Rendering ---
                  if (row.type === "group") {
                    // Calculate span for merging vertical cells in grouping columns
                    const rowSpanCount = calculateRowSpan(rowIndex, row.key.replace('-group',''));
                    return (
                      <tr key={row.key} className="font-semibold">
                        {/* Render Grouping Columns with Row Span */}
                        {tableGroupingHeaders.map((header, colIndex) => (
                          <td
                            key={`group-${row.key}-${colIndex}`}
                            rowSpan={rowSpanCount} // Apply calculated row span
                            className="py-1.5 px-3 border-b border-r border-slate-400 whitespace-nowrap align-top font-medium text-gray-800 bg-slate-100 sticky z-10" // Align top for merged cells
                            style={{
                              left: `${colIndex * 100}px`,
                              minWidth: "100px",
                            }}
                          >
                            {/* Display group value (will be hidden by CSS/PDF logic for merged cells below top) */}
                            {row.groupValues[colIndex]}
                          </td>
                        ))}
                        {/* "TOTAL %" Label */}
                        <td
                          key={`label-${row.key}`}
                          className="py-1.5 px-3 border-b border-r border-slate-600 whitespace-nowrap align-middle font-bold text-white bg-slate-500 sticky z-10"
                          style={{
                            left: `${tableGroupingHeaders.length * 100}px`,
                            minWidth: "150px",
                          }}
                        >
                          TOTAL %
                        </td>
                        {/* Render Data Cells for the Group */}
                        {uniqueDates.map((date) => {
                          const rate = row.data[date] || 0;
                          const displayValue = rate > 0 ? `${rate.toFixed(2)}%` : "";
                          return (
                            <td
                              key={`${row.key}-date-${date}`}
                              className={`py-1.5 px-3 border-b border-r border-slate-600 text-center align-middle font-semibold ${
                                rate > 0 ? getBackgroundColor(rate) : "bg-slate-500" // Use background color for 0%
                              } ${
                                rate > 0 ? getFontColor(rate) : "text-white" // White text for 0% on dark bg
                              }`}
                              title={displayValue || "0.00%"} // Tooltip shows value
                              style={{ minWidth: "80px" }}
                            >
                              {displayValue}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  // --- Defect Row Rendering ---
                  } else if (row.type === "defect") {
                    return (
                      <tr key={row.key} className="hover:bg-gray-50">
                        {/* Grouping columns are spanned by the group row above, so no <td> needed here */}

                        {/* Defect Name Label */}
                        <td
                          key={`label-${row.key}`}
                          className="py-1.5 px-3 border-b border-r border-gray-300 whitespace-nowrap align-middle text-gray-700 bg-white pl-6 sticky z-10" // Indent defect name
                          style={{
                            left: `${tableGroupingHeaders.length * 100}px`,
                            minWidth: "150px",
                          }}
                        >
                          {row.defectName}
                        </td>
                        {/* Render Data Cells for the Defect */}
                        {uniqueDates.map((date) => {
                          const rate = row.data[date] || 0;
                          const displayValue = rate > 0 ? `${rate.toFixed(2)}%` : "";
                          return (
                            <td
                              key={`${row.key}-date-${date}`}
                              className={`py-1.5 px-3 border-b border-r border-gray-300 text-center align-middle ${
                                rate > 0 ? getBackgroundColor(rate) : "bg-white" // White background for 0%
                              } ${
                                rate > 0 ? getFontColor(rate) : "text-gray-500" // Gray text for 0%
                              }`}
                              title={displayValue || "0.00%"}
                              style={{ minWidth: "80px" }}
                            >
                              {displayValue}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }
                  return null; // Should not happen with current logic
                })}

                {/* Overall Total Row */}
                <tr className="bg-gray-200 font-semibold text-gray-800 sticky bottom-0 z-10">
                  {/* Empty cells for grouping columns */}
                  {tableGroupingHeaders.map((_, index) => (
                    <td
                      key={`total-group-${index}`}
                      className="py-2 px-3 border-b border-r border-t border-gray-400 sticky bg-gray-200 z-20 align-middle" // Ensure z-index is high
                      style={{ left: `${index * 100}px`, minWidth: "100px" }}
                    ></td>
                  ))}
                  {/* "OVERALL TOTAL" Label */}
                  <td
                    className="py-2 px-3 border-b border-r border-t border-gray-400 sticky bg-gray-200 z-20 font-bold align-middle"
                    style={{
                      left: `${tableGroupingHeaders.length * 100}px`,
                      minWidth: "150px",
                    }}
                  >
                    OVERALL TOTAL
                  </td>
                  {/* Calculate and Render Overall Total Rate for each date */}
                  {uniqueDates.map((date) => {
                    // Filter rawData for the specific date
                    const dateData = rawData.filter(
                      (d) => formatDateToDDMMYYYY(d.inspectionDate) === date
                    );
                    // Sum checked and defects for that date
                    const totalCheckedForDate = dateData.reduce(
                      (sum, d) => sum + (d.CheckedQty || 0),
                      0
                    );
                    const totalDefectsForDate = dateData.reduce(
                      (sum, d) => sum + (d.totalDefectsQty || 0),
                      0
                    );
                    // Calculate rate
                    const rate =
                      totalCheckedForDate > 0
                        ? (totalDefectsForDate / totalCheckedForDate) * 100
                        : 0;
                    const displayValue = rate > 0 ? `${rate.toFixed(2)}%` : "";
                    return (
                      <td
                        key={`total-date-${date}`}
                        className={`py-2 px-3 border-b border-r border-t border-gray-400 text-center font-bold align-middle ${
                          rate > 0 ? getBackgroundColor(rate) : "bg-gray-200" // Use row background for 0%
                        } ${
                          rate > 0 ? getFontColor(rate) : "text-gray-800" // Use row text color for 0%
                        }`}
                        style={{ minWidth: "80px" }}
                        title={displayValue || "0.00%"}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QCSunriseDailyTrend;
