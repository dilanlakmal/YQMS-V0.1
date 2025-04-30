import React, { useState, useEffect, useCallback, useMemo } from "react"; // Added useMemo
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import MonthlyFilterPane from "./MonthlyFilterPane";
import QCSunriseSummaryCard from "./QCSunriseSummaryCard";
import {
  format,
  parse,
  isValid,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";

// --- Helper functions (remain outside the component) ---
const formatYYYYMMToDisplay = (yyyyMM) => {
  if (!yyyyMM || !yyyyMM.includes("-")) return yyyyMM;
  const parsedDate = parse(yyyyMM, "yyyy-MM", new Date());
  return isValid(parsedDate) ? format(parsedDate, "MMM yyyy") : yyyyMM;
};

const parseYYYYMM = (yyyyMM) => {
  if (!yyyyMM || !yyyyMM.includes("-")) return null;
  const parsedDate = parse(yyyyMM, "yyyy-MM", new Date());
  return isValid(parsedDate) ? parsedDate : null;
};

const getYearMonthKey = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return null;
  let parsedDate;
  // Try different common formats
  parsedDate = parse(dateStr, "yyyy-MM-dd", new Date());
  if (isValid(parsedDate)) return format(parsedDate, "yyyy-MM");
  parsedDate = parse(dateStr, "dd/MM/yyyy", new Date());
  if (isValid(parsedDate)) return format(parsedDate, "yyyy-MM");
  parsedDate = parse(dateStr, "yyyy/MM/dd", new Date());
  if (isValid(parsedDate)) return format(parsedDate, "yyyy-MM");
  // Fallback for ISO strings or other Date-parsable formats
  try {
    parsedDate = new Date(dateStr);
    if (isValid(parsedDate)) return format(parsedDate, "yyyy-MM");
  } catch (e) {//
    }
  // console.warn(`Could not parse date string to get YYYY-MM: ${dateStr}`); // Keep console logs minimal
  return null;
};

const getDefaultEndDate = () => format(endOfMonth(new Date()), "yyyy-MM-dd");
const getDefaultStartDate = () =>
  format(startOfMonth(subMonths(new Date(), 11)), "yyyy-MM-dd"); // Default to start of previous month
// --- End Helper functions ---

const SunriseMonthlyTrend = () => {
  const [monthlyApiData, setMonthlyApiData] = useState([]);
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
    addLines: false,
    addMO: false,
    addBuyer: false,
    addColors: false,
    addSizes: false, // Corrected state key
  });
  const [rows, setRows] = useState([]);
  const [uniqueMonths, setUniqueMonths] = useState([]);
  const [totalChecked, setTotalChecked] = useState(0);
  const [totalDefects, setTotalDefects] = useState(0);
  const [overallDhu, setOverallDhu] = useState(0);

  // Memoize handleFilterChange
  const handleFilterChange = useCallback((newFilters) => {
    const validatedFilters = {
      ...newFilters,
      startDate: newFilters.startDate || getDefaultStartDate(),
      endDate: newFilters.endDate || getDefaultEndDate(),
    };
    setActiveFilters(validatedFilters);
  }, []); // Empty dependency array

  // Memoize isFilterActive
  const isFilterActive = useCallback(
    (filterName) => {
      return (activeFilters[filterName] ?? "").trim() !== "";
    },
    [activeFilters],
  ); // Depends on activeFilters

  // Memoize fetchData
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setMonthlyApiData([]);
      setRows([]);
      setUniqueMonths([]);
      setTotalChecked(0);
      setTotalDefects(0);
      setOverallDhu(0);

      let startMonthParam, endMonthParam;
      try {
        // Ensure dates are valid before formatting for API
        const parsedStart = parse(
          activeFilters.startDate,
          "yyyy-MM-dd",
          new Date(),
        );
        const parsedEnd = parse(
          activeFilters.endDate,
          "yyyy-MM-dd",
          new Date(),
        );

        if (!isValid(parsedStart) || !isValid(parsedEnd)) {
          throw new Error("Invalid date format in filters.");
        }
        startMonthParam = format(parsedStart, "yyyy-MM");
        endMonthParam = format(parsedEnd, "yyyy-MM");
      } catch (parseError) {
        console.error("Error parsing filter dates:", parseError);
        setError("Invalid date format in filters. Please use YYYY-MM-DD.");
        setLoading(false);
        return;
      }

      const queryParams = {
        startMonth: startMonthParam,
        endMonth: endMonthParam,
        lineNo: activeFilters.lineNo,
        MONo: activeFilters.MONo,
        Color: activeFilters.Color,
        Size: activeFilters.Size,
        Buyer: activeFilters.Buyer,
        defectName: activeFilters.defectName,
      };
      Object.keys(queryParams).forEach((key) => {
        if (!queryParams[key]) delete queryParams[key];
      });

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `${API_BASE_URL}/api/sunrise/qc1-monthly-data?${queryString}`;
      const response = await axios.get(url);

      setMonthlyApiData(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Fetch error (monthly data):", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch QC1 Sunrise monthly data";
      setError(errorMsg);
      setMonthlyApiData([]);
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
  }, [fetchData]); // Depends on memoized fetchData

  // Effect to calculate overall summary stats when monthlyApiData changes
  useEffect(() => {
    if (
      loading ||
      error ||
      !Array.isArray(monthlyApiData) ||
      monthlyApiData.length === 0
    ) {
      setTotalChecked(0);
      setTotalDefects(0);
      setOverallDhu(0);
      return;
    }
    let checked = monthlyApiData.reduce(
      (sum, item) => sum + (item.CheckedQty || 0),
      0,
    );
    let defects = monthlyApiData.reduce(
      (sum, item) => sum + (item.totalDefectsQty || 0),
      0,
    );
    const dhu =
      checked > 0 ? parseFloat(((defects / checked) * 100).toFixed(2)) : 0;
    setTotalChecked(checked);
    setTotalDefects(defects);
    setOverallDhu(dhu);
  }, [monthlyApiData, loading, error]); // Depends on monthlyApiData, loading, error

  // Memoize buildHierarchyFromMonthlyData
  const buildHierarchyFromMonthlyData = useCallback((data, groupingFields) => {
    const hierarchy = {};
    const normalizeString = (str) => (str ? String(str).trim() : "N/A");

    data.forEach((monthlyRecord) => {
      const groupKey = groupingFields
        .map((field) => normalizeString(monthlyRecord[field]))
        .join("|");

      if (!hierarchy[groupKey]) {
        hierarchy[groupKey] = {
          groupValues: groupingFields.map((field) =>
            normalizeString(monthlyRecord[field]),
          ),
          monthMap: {},
        };
      }

      // Get month key from record (assuming inspectionDate or similar exists)
      const monthKey = getYearMonthKey(monthlyRecord.inspectionDate);
      if (!monthKey) return; // Skip if month cannot be determined

      if (!hierarchy[groupKey].monthMap[monthKey]) {
        hierarchy[groupKey].monthMap[monthKey] = {
          CheckedQty: monthlyRecord.CheckedQty || 0,
          totalDefectsQty: monthlyRecord.totalDefectsQty || 0,
          DefectArray: Array.isArray(monthlyRecord.DefectArray)
            ? monthlyRecord.DefectArray.map((def) => ({
                ...def,
                defectQty: def.defectQty || 0, // Ensure number
              }))
            : [],
        };
      } else {
        const monthEntry = hierarchy[groupKey].monthMap[monthKey];
        monthEntry.CheckedQty += monthlyRecord.CheckedQty || 0;
        monthEntry.totalDefectsQty += monthlyRecord.totalDefectsQty || 0;

        // Aggregate defects
        const existingDefects = monthEntry.DefectArray || [];
        const newDefects = Array.isArray(monthlyRecord.DefectArray)
          ? monthlyRecord.DefectArray
          : [];

        newDefects.forEach((newDefect) => {
          if (!newDefect || !newDefect.defectName) return;
          const existing = existingDefects.find(
            (d) => d.defectName === newDefect.defectName,
          );
          if (existing) {
            existing.defectQty =
              (existing.defectQty || 0) + (newDefect.defectQty || 0);
          } else {
            existingDefects.push({
              ...newDefect,
              defectQty: newDefect.defectQty || 0,
            });
          }
        });
        monthEntry.DefectArray = existingDefects;
      }
    });

    return hierarchy;
  }, []); // No external dependencies

  // Memoize buildMonthlyRowsFromHierarchy
  const buildMonthlyRowsFromHierarchy = useCallback(
    (hierarchy, groupingFields, months) => {
      const rows = [];

      const sortedGroupKeys = Object.keys(hierarchy).sort((a, b) => {
        const aValues = hierarchy[a].groupValues;
        const bValues = hierarchy[b].groupValues;
        for (let i = 0; i < Math.min(aValues.length, bValues.length); i++) {
          const comparison = String(aValues[i]).localeCompare(
            String(bValues[i]),
          );
          if (comparison !== 0) return comparison;
        }
        return aValues.length - bValues.length;
      });

      sortedGroupKeys.forEach((groupKey) => {
        const group = hierarchy[groupKey];
        const groupData = {}; // { monthKey: rate } for group total

        // Calculate total % for the group for each month
        months.forEach((month) => {
          const monthEntry = group.monthMap[month];
          const checkedQty = monthEntry?.CheckedQty || 0;
          const defectsQty = monthEntry?.totalDefectsQty || 0;
          groupData[month] =
            checkedQty > 0
              ? parseFloat(((defectsQty / checkedQty) * 100).toFixed(2))
              : 0;
        });

        // Add group row (TOTAL %)
        rows.push({
          type: "group",
          key: groupKey + "-group",
          groupValues: group.groupValues,
          data: groupData,
        });

        // Collect unique defect names within this group
        const defectNames = new Set();
        Object.values(group.monthMap).forEach((monthEntry) => {
          if (monthEntry && Array.isArray(monthEntry.DefectArray)) {
            monthEntry.DefectArray.forEach((defect) => {
              if (defect && defect.defectName)
                defectNames.add(defect.defectName);
            });
          }
        });

        // Add rows for each defect
        [...defectNames].sort().forEach((defectName) => {
          const defectData = {}; // { monthKey: rate } for this defect
          months.forEach((month) => {
            const monthEntry = group.monthMap[month];
            if (monthEntry && Array.isArray(monthEntry.DefectArray)) {
              const defect = monthEntry.DefectArray.find(
                (d) => d.defectName === defectName,
              );
              const checkedQty = monthEntry.CheckedQty || 0;
              defectData[month] =
                defect && checkedQty > 0
                  ? parseFloat(
                      (((defect.defectQty || 0) / checkedQty) * 100).toFixed(2),
                    )
                  : 0;
            } else {
              defectData[month] = 0;
            }
          });

          // Add defect row
          rows.push({
            type: "defect",
            key: groupKey + "-" + defectName,
            groupValues: group.groupValues,
            defectName: defectName,
            data: defectData,
          });
        });
      });

      return rows;
    },
    [],
  ); // No external dependencies

  // Effect to process data and build rows for the table
  useEffect(() => {
    if (
      loading ||
      error ||
      !Array.isArray(monthlyApiData) ||
      monthlyApiData.length === 0
    ) {
      setRows([]);
      setUniqueMonths([]);
      return;
    }

    // *** MODIFICATION START ***
    const groupingFieldsConfig = [
      { key: "lineNo", option: "addLines" }, // Removed filterActive check dependency
      { key: "MONo", option: "addMO" },
      { key: "Buyer", option: "addBuyer" },
      { key: "Color", option: "addColors" },
      { key: "Size", option: "addSizes" }, // Corrected state key
    ];
    const activeGroupingFields = groupingFieldsConfig
      // Include field ONLY if its option is checked
      .filter((field) => groupingOptions[field.option])
      .map((field) => field.key);
    // *** MODIFICATION END ***

    // Extract unique months and sort them
    const monthsSet = new Set(
      monthlyApiData
        .map((d) => getYearMonthKey(d.inspectionDate))
        .filter(Boolean), // filter nulls
    );
    const sortedMonths = [...monthsSet].sort((a, b) => {
      const dateA = parseYYYYMM(a);
      const dateB = parseYYYYMM(b);
      return dateA && dateB ? dateA - dateB : 0; // Handle potential parse errors
    });
    setUniqueMonths(sortedMonths);

    // Build hierarchy and rows using memoized functions
    const hierarchy = buildHierarchyFromMonthlyData(
      monthlyApiData,
      activeGroupingFields,
    );
    const tableRows = buildMonthlyRowsFromHierarchy(
      hierarchy,
      activeGroupingFields,
      sortedMonths,
    );
    setRows(tableRows);

  }, [
    monthlyApiData,
    groupingOptions,
    loading,
    error,
    buildHierarchyFromMonthlyData,
    buildMonthlyRowsFromHierarchy,
  ]);

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
    if (rate > 3) return [254, 226, 226];
    if (rate >= 2) return [254, 243, 199];
    return [220, 252, 231];
  };
  const getFontColorRGB = (rate) => {
    if (rate > 3) return [153, 27, 27];
    if (rate >= 2) return [154, 52, 18];
    return [6, 95, 70];
  };
  const getBackgroundColorHex = (rate) => {
    if (rate > 3) return "FEE2E2";
    if (rate >= 2) return "FEF3C7";
    return "DCFCE7";
  };
  // --- End Color coding functions ---

 
  const getCurrentGroupingFieldNames = useCallback(() => {
    const names = [];
    // Check ONLY if option is enabled
    if (groupingOptions.addLines) names.push("Line");
    if (groupingOptions.addMO) names.push("MO");
    if (groupingOptions.addBuyer) names.push("Buyer");
    if (groupingOptions.addColors) names.push("Color");
    if (groupingOptions.addSizes) names.push("Size"); // Corrected state key
    return names;
  }, [groupingOptions]); // Depends only on groupingOptions

  // Memoize prepareExportData
  const prepareExportData = useCallback(() => {
    const exportData = [];
    const ratesMap = new Map();
    const groupingFieldNames = getCurrentGroupingFieldNames();
    const numGroupingCols = groupingFieldNames.length;
    const displayMonths = uniqueMonths.map(formatYYYYMMToDisplay);

    exportData.push([
      "Monthly Defect Trend Analysis",
      ...Array(uniqueMonths.length + numGroupingCols).fill(""),
    ]);
    ratesMap.set(`0-0`, -1);

    exportData.push(Array(uniqueMonths.length + numGroupingCols + 1).fill(""));
    ratesMap.set(`1-0`, -1);

    const headerRow = [...groupingFieldNames, "Defect / Group", ...displayMonths];
    exportData.push(headerRow);
    headerRow.forEach((_, colIndex) => ratesMap.set(`2-${colIndex}`, -1));

    let rowIndex = 3;
    let lastDisplayedGroupValues = Array(numGroupingCols).fill(null);

    rows.forEach((row) => {
      const rowData = [];
      const isGroupRow = row.type === "group";

      // Grouping columns with merge logic (same as daily/weekly)
      for (let colIndex = 0; colIndex < numGroupingCols; colIndex++) {
        const currentValue = row.groupValues[colIndex];
        let displayValue = "";
        if (isGroupRow) {
          if (currentValue !== lastDisplayedGroupValues[colIndex]) {
            displayValue = currentValue;
            lastDisplayedGroupValues[colIndex] = currentValue;
            for (let k = colIndex + 1; k < numGroupingCols; k++) {
              lastDisplayedGroupValues[k] = null;
            }
          }
        } else {
          if (currentValue !== lastDisplayedGroupValues[colIndex]) {
            lastDisplayedGroupValues[colIndex] = currentValue;
            for (let k = colIndex + 1; k < numGroupingCols; k++) {
              lastDisplayedGroupValues[k] = null;
            }
          }
        }
        rowData.push(displayValue);
      }

      rowData.push(isGroupRow ? "TOTAL %" : row.defectName);

      uniqueMonths.forEach((month, monthIndex) => {
        const rate = row.data[month] || 0;
        rowData.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
        ratesMap.set(`${rowIndex}-${numGroupingCols + 1 + monthIndex}`, rate);
      });

      // Mark grouping/label cols as non-data
      for (let c = 0; c <= numGroupingCols; c++) {
        ratesMap.set(`${rowIndex}-${c}`, -1);
      }

      exportData.push(rowData);
      rowIndex++;
    });

    // Overall Total Row
    const totalRow = [...Array(numGroupingCols).fill(""), "OVERALL TOTAL %"];
    uniqueMonths.forEach((month, monthIndex) => {
      const monthData = monthlyApiData.filter(
        (d) => getYearMonthKey(d.inspectionDate) === month,
      );
      const totalCheckedForMonth = monthData.reduce(
        (sum, d) => sum + (d.CheckedQty || 0),
        0,
      );
      const totalDefectsForMonth = monthData.reduce(
        (sum, d) => sum + (d.totalDefectsQty || 0),
        0,
      );
      const rate =
        totalCheckedForMonth > 0
          ? parseFloat(
              ((totalDefectsForMonth / totalCheckedForMonth) * 100).toFixed(2),
            )
          : 0;
      totalRow.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
      ratesMap.set(`${rowIndex}-${numGroupingCols + 1 + monthIndex}`, rate);
    });
    // Mark grouping cols in total row as non-data
    for (let c = 0; c <= numGroupingCols; c++) {
      ratesMap.set(`${rowIndex}-${c}`, -1);
    }
    exportData.push(totalRow);

    return { exportData, ratesMap, numGroupingCols };
  }, [rows, uniqueMonths, monthlyApiData, getCurrentGroupingFieldNames]); // Dependencies

  // Memoize downloadExcel
  const downloadExcel = useCallback(() => {
    const { exportData, ratesMap, numGroupingCols } = prepareExportData();
    if (exportData.length <= 3) {
      alert("No data available to export.");
      return;
    }

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const groupingFieldNames = getCurrentGroupingFieldNames();

    // --- Cell Styling Logic (copied from daily/weekly trend) ---
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (!cell) continue;

        const rate = ratesMap.get(`${R}-${C}`);
        const isHeaderRow = R === 2;
        const isTotalRow = R === range.e.r;
        const isGroupLabelCol = C === numGroupingCols;
        const isDataRow = R > 2 && R < range.e.r;
        const isActualGroupRow =
          isDataRow && exportData[R][numGroupingCols] === "TOTAL %";
        const cellHasValue = cell.v !== undefined && cell.v !== "";

        let fgColor = "FFFFFF";
        let fontStyle = {};
        let alignment = {
          horizontal: C <= numGroupingCols ? "left" : "center",
          vertical: "middle",
        };
        let fontColor = "000000";
        let borderColor = "D1D5DB";

        if (R === 0) {//con
        } else if (R === 1) {//con
        } else if (isHeaderRow) {
          fgColor = "E5E7EB";
          fontStyle = { bold: true };
          fontColor = "1F2937";
          borderColor = "9CA3AF";
        } else if (isTotalRow) {
          fgColor = "E5E7EB";
          fontStyle = { bold: true };
          fontColor = "1F2937";
          borderColor = "9CA3AF";
          if (rate !== undefined && rate > 0) {
            fgColor = getBackgroundColorHex(rate);
            const rgbFont = getFontColorRGB(rate);
            fontColor = rgbFont
              .map((x) => x.toString(16).padStart(2, "0"))
              .join("")
              .toUpperCase();
          } else if (rate === 0) {
            fgColor = "E5E7EB";
            fontColor = "1F2937";
          }
        } else if (C < numGroupingCols) {
          if (isActualGroupRow) {
            fgColor = "F1F5F9";
            fontStyle = { bold: cellHasValue };
            fontColor = "334155";
            borderColor = "94A3B8";
            if (cellHasValue) alignment.vertical = "top";
          } else {
            fgColor = "FFFFFF";
            borderColor = "D1D5DB";
            if (!cellHasValue) fontColor = "FFFFFF";
            else fontColor = "374151";
          }
        } else if (isGroupLabelCol) {
          if (isActualGroupRow) {
            fgColor = "64748B";
            fontStyle = { bold: true };
            fontColor = "FFFFFF";
            borderColor = "475569";
          } else {
            fgColor = "FFFFFF";
            fontColor = "374151";
            borderColor = "D1D5DB";
            alignment.indent = 1;
          }
        } else if (rate !== undefined && rate > 0) {
          fgColor = getBackgroundColorHex(rate);
          const rgbFont = getFontColorRGB(rate);
          fontColor = rgbFont
            .map((x) => x.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase();
          if (isActualGroupRow) {
            fontStyle = { bold: true };
            borderColor = "475569";
          } else {
            borderColor = "D1D5DB";
          }
        } else if (rate === 0) {
          if (isActualGroupRow) {
            fgColor = "64748B";
            fontColor = "FFFFFF";
            fontStyle = { bold: true };
            borderColor = "475569";
          } else {
            fgColor = "FFFFFF";
            fontColor = "6B7280";
            borderColor = "D1D5DB";
          }
        }

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
    groupingFieldNames.forEach(() => colWidths.push({ wch: 15 }));
    colWidths.push({ wch: 30 }); // Defect/Group label
    uniqueMonths.forEach(() => colWidths.push({ wch: 15 })); // Month columns
    ws["!cols"] = colWidths;
    // --- End Column Widths ---

    // --- Merging Cells (copied from daily/weekly trend) ---
    if (range.e.c > 0) {
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } }];
      if (ws["A1"]) {
        ws["A1"].s = ws["A1"].s || {};
        ws["A1"].s.alignment = { horizontal: "center", vertical: "middle" };
        ws["A1"].s.font = { sz: 14, bold: true };
      }
    }
    let mergeSpans = ws["!merges"] || [];
    let groupStartRow = {};
    for (let R = 3; R < exportData.length - 1; ++R) {
      const isGroupRow = exportData[R][numGroupingCols] === "TOTAL %";
      const isFirstDataRowOfGroup = isGroupRow;
      for (let C = 0; C < numGroupingCols; ++C) {
        const cellValue = exportData[R][C];
        if (isFirstDataRowOfGroup && cellValue !== "") {
          if (groupStartRow[C] !== undefined && R > groupStartRow[C]) {
            if (exportData[groupStartRow[C]][C] !== "") {
              mergeSpans.push({
                s: { r: groupStartRow[C], c: C },
                e: { r: R - 1, c: C },
              });
            }
          }
          groupStartRow[C] = R;
        }
        let endOfBlock = false;
        if (R + 1 < exportData.length - 1) {
          if (exportData[R + 1][numGroupingCols] === "TOTAL %") {
            if (C === 0 || exportData[R + 1][C] !== exportData[R][C]) {
              endOfBlock = true;
            }
          }
        } else if (R + 1 === exportData.length - 1) {
          endOfBlock = true;
        }
        if (groupStartRow[C] !== undefined && endOfBlock) {
          const startR = groupStartRow[C];
          const endR = R;
          if (endR >= startR) {
            if (exportData[startR][C] !== "") {
              mergeSpans.push({ s: { r: startR, c: C }, e: { r: endR, c: C } });
            }
          }
          delete groupStartRow[C];
        }
      }
      if (isFirstDataRowOfGroup && exportData[R][0] !== "") {
        groupStartRow = {};
        if (exportData[R][0] !== "") groupStartRow[0] = R;
      }
    }
    ws["!merges"] = mergeSpans;
    // --- End Merging Cells ---

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Defect Trend");
    XLSX.writeFile(wb, "MonthlyDefectTrend.xlsx");
  }, [prepareExportData, uniqueMonths, getCurrentGroupingFieldNames]); // Dependencies

  // Memoize downloadPDF
  const downloadPDF = useCallback(() => {
    const { exportData, ratesMap, numGroupingCols } = prepareExportData();
    if (exportData.length <= 3) {
      alert("No data available to export.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    const tablePlugin =
      typeof autoTable === "function" ? autoTable : window.autoTable;
    if (!tablePlugin) {
      console.error("jsPDF-AutoTable plugin not found.");
      alert("PDF export unavailable.");
      return;
    }

    const head = [exportData[2]];
    const body = exportData.slice(3);

    tablePlugin(doc, {
      head: head,
      body: body,
      startY: 20,
      theme: "grid",
      headStyles: {
        fillColor: [229, 231, 235],
        textColor: [31, 41, 55],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
        lineWidth: 0.1,
        lineColor: [156, 163, 175],
      },
      styles: {
        cellPadding: 1.5,
        fontSize: 7,
        valign: "middle",
        lineColor: [209, 213, 219],
        lineWidth: 0.1,
      },
      columnStyles: {
        ...Array.from({ length: numGroupingCols + 1 }, (_, i) => i).reduce(
          (acc, i) => {
            acc[i] = { halign: "left" };
            return acc;
          },
          {},
        ),
        ...uniqueMonths.reduce((acc, _, index) => {
          acc[numGroupingCols + 1 + index] = { halign: "center" };
          return acc;
        }, {}),
      },
      didParseCell: (data) => {
        // Styling logic (copied from daily/weekly trend)
        const rowIndexInExportData = data.row.index + 3;
        const colIndex = data.column.index;
        const rate = ratesMap.get(`${rowIndexInExportData}-${colIndex}`);
        const cellHasValue = data.cell.raw !== undefined && data.cell.raw !== "";
        const isTotalRow = data.row.index === body.length - 1;
        const isGroupLabelCol = colIndex === numGroupingCols;
        const isActualGroupRow =
          !isTotalRow && exportData[rowIndexInExportData][numGroupingCols] === "TOTAL %";

        if (data.section === "body") {
          let fillColor = [255, 255, 255];
          let textColor = [55, 65, 81];
          let fontStyle = "normal";
          let lineColor = [209, 213, 219];
          if (isTotalRow) {
            fillColor = [229, 231, 235];
            textColor = [31, 41, 55];
            fontStyle = "bold";
            lineColor = [156, 163, 175];
            if (rate !== undefined && rate > 0) {
              fillColor = getBackgroundColorRGB(rate);
              textColor = getFontColorRGB(rate);
            } else if (rate === 0) {
              fillColor = [229, 231, 235];
              textColor = [31, 41, 55];
            }
          } else if (colIndex < numGroupingCols) {
            fillColor = isActualGroupRow ? [241, 245, 249] : [255, 255, 255];
            lineColor = isActualGroupRow ? [148, 163, 184] : [209, 213, 219];
            if (!cellHasValue) {
              textColor = fillColor;
            } else {
              textColor = [51, 65, 85];
              fontStyle = "bold";
              data.cell.styles.valign = "top";
            }
          } else if (isGroupLabelCol) {
            if (isActualGroupRow) {
              fillColor = [100, 116, 139];
              fontStyle = "bold";
              textColor = [255, 255, 255];
              lineColor = [71, 85, 105];
            } else {
              fillColor = [255, 255, 255];
              fontStyle = "normal";
              textColor = [55, 65, 81];
              lineColor = [209, 213, 219];
              data.cell.styles.cellPadding = {
                ...data.cell.styles.cellPadding,
                left: 3,
              };
            }
          } else if (rate !== undefined && rate > 0) {
            fillColor = getBackgroundColorRGB(rate);
            textColor = getFontColorRGB(rate);
            if (isActualGroupRow) {
              fontStyle = "bold";
              lineColor = [71, 85, 105];
            } else {
              fontStyle = "normal";
              lineColor = [209, 213, 219];
            }
          } else if (rate === 0) {
            if (isActualGroupRow) {
              fillColor = [100, 116, 139];
              textColor = [255, 255, 255];
              fontStyle = "bold";
              lineColor = [71, 85, 105];
            } else {
              fillColor = [255, 255, 255];
              textColor = [156, 163, 175];
              fontStyle = "normal";
              lineColor = [209, 213, 219];
            }
          }
          data.cell.styles.fillColor = fillColor;
          data.cell.styles.textColor = textColor;
          data.cell.styles.fontStyle = fontStyle;
          data.cell.styles.lineColor = lineColor;
        } else if (data.section === "head") {
          data.cell.styles.halign = colIndex <= numGroupingCols ? "left" : "center";
        }
      },
      didDrawPage: (data) => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(
          "Monthly Defect Trend Analysis",
          doc.internal.pageSize.getWidth() / 2,
          15,
          { align: "center" },
        );
      },
      // Row Span Logic for PDF (copied from daily/weekly trend)
      willDrawCell: (data) => {
        if (data.section === "body" && data.column.index < numGroupingCols) {
          const rowIndexInBody = data.row.index;
          const colIndex = data.column.index;
          const cellValue = body[rowIndexInBody][colIndex];
          if (cellValue === "") {
            let spanMasterRowIndex = rowIndexInBody - 1;
            while (
              spanMasterRowIndex >= 0 &&
              body[spanMasterRowIndex][colIndex] === ""
            ) {
              spanMasterRowIndex--;
            }
            if (
              spanMasterRowIndex >= 0 &&
              spanMasterRowIndex >= data.table.startPage
            ) {
              const masterCell =
                data.table.body[spanMasterRowIndex]?.cells[colIndex];
              if (masterCell && masterCell.willDraw) {
                masterCell.rowSpan = (masterCell.rowSpan || 1) + 1;
                data.cell.willDraw = false;
              }
            }
          } else {
            data.cell.rowSpan = 1;
          }
        }
      },
    });
    doc.save("MonthlyDefectTrend.pdf");
  }, [prepareExportData, uniqueMonths]); // Dependencies

  // Memoize event handlers for options
  const handleOptionToggle = useCallback((option) => {
    setGroupingOptions((prev) => ({ ...prev, [option]: !prev[option] }));
  }, []);

  const handleAddAll = useCallback(() => {
    setGroupingOptions({
      addLines: true,
      addMO: true,
      addBuyer: true,
      addColors: true,
      addSizes: true, // Corrected key
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setGroupingOptions({
      addLines: false,
      addMO: false,
      addBuyer: false,
      addColors: false,
      addSizes: false, // Corrected key
    });
  }, []);

  // Memoize summaryStats
  const summaryStats = useMemo(
    () => ({
      totalCheckedQty: totalChecked,
      totalDefectsQty: totalDefects,
      defectRate: overallDhu,
    }),
    [totalChecked, totalDefects, overallDhu],
  );

  // Memoize tableGroupingHeaders
  const tableGroupingHeaders = useMemo(
    () => getCurrentGroupingFieldNames(),
    [getCurrentGroupingFieldNames],
  );

  // Memoize calculateRowSpan
  const calculateRowSpan = useCallback(
    (groupRowIndex, groupKey) => {
      let spanCount = 1;
      for (let i = groupRowIndex + 1; i < rows.length; i++) {
        if (rows[i].type === "defect" && rows[i].key.startsWith(groupKey + "-")) {
          spanCount++;
        } else {
          break;
        }
      }
      return spanCount;
    },
    [rows],
  );

  // --- JSX Rendering ---
  return (
    <div className="p-4 space-y-6">
      <MonthlyFilterPane
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
        {!loading &&
          !error &&
          monthlyApiData.length === 0 &&
          (activeFilters.startDate || activeFilters.endDate) && (
            <div className="text-center p-4 text-gray-500 bg-white shadow-md rounded-lg">
              No monthly data available for the selected filters.
            </div>
          )}
        {!loading && !error && monthlyApiData.length > 0 && (
          <QCSunriseSummaryCard summaryStats={summaryStats} />
        )}
      </div>

      {/* Trend Table Section */}
      <div className="bg-white shadow-md rounded-lg p-4">
        {/* Header with Title, Grouping Options, and Download Buttons */}
        {!loading && !error && (
          <>
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
              <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
                Monthly Defect Trend
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-sm font-medium text-gray-600 mr-2">
                  Group by:
                </span>
                {/* Checkbox options - Updated Logic */}
                {/* *** MODIFICATION START *** */}
                {[
                  { label: "Lines", option: "addLines", filterKey: "lineNo" },
                  { label: "MO", option: "addMO", filterKey: "MONo" },
                  { label: "Buyer", option: "addBuyer", filterKey: "Buyer" },
                  { label: "Colors", option: "addColors", filterKey: "Color" },
                  { label: "Sizes", option: "addSizes", filterKey: "Size" }, // Corrected key
                ].map(({ label, option, filterKey }) => {
                  const isCurrentlyFiltered = isFilterActive(filterKey); // Check if filter is active
                  return (
                    <label
                      key={option}
                      className={`flex items-center space-x-1 cursor-pointer ${
                        isCurrentlyFiltered ? "opacity-75" : ""
                      }`} // Style based on filter, keep pointer
                      title={
                        isCurrentlyFiltered
                          ? `${label} is currently filtered. Uncheck to hide column.`
                          : `Group results by ${label}`
                      }
                    >
                      <input
                        type="checkbox"
                        checked={groupingOptions[option] || isCurrentlyFiltered} // Checked if option selected OR filter active
                        onChange={() => handleOptionToggle(option)} // Always allow toggle
                        // REMOVED disabled attribute
                        className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer`}
                      />
                      <span
                        className={`text-sm ${
                          isCurrentlyFiltered ? "text-gray-500" : "text-gray-700"
                        }`} // Dim text if filtered
                      >
                        {label}
                      </span>
                    </label>
                  );
                })}
                {/* *** MODIFICATION END *** */}
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
                <div className="border-l border-gray-300 h-6 mx-2"></div>
                <button
                  onClick={downloadExcel}
                  className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={rows.length === 0}
                  title="Download as Excel"
                >
                  <FaFileExcel className="mr-1 h-4 w-4" /> Excel
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={rows.length === 0}
                  title="Download as PDF"
                >
                  <FaFilePdf className="mr-1 h-4 w-4" /> PDF
                </button>
              </div>
            </div>
          </>
        )}

        {/* Loading/Error/No Data States */}
        {loading && (
          <div className="text-center p-4 text-gray-500">
            Loading monthly trend data...
          </div>
        )}
        {error && (
          <div className="text-center p-4 text-red-500 bg-red-50 rounded border border-red-200">
            Error loading monthly data: {error}
          </div>
        )}
        {!loading && !error && rows.length === 0 && monthlyApiData.length > 0 && (
          <div className="text-center p-4 text-gray-500">
            No trend data to display based on current grouping. Try adjusting
            'Group by' options.
          </div>
        )}
        {!loading &&
          !error &&
          rows.length === 0 &&
          monthlyApiData.length === 0 &&
          (activeFilters.startDate || activeFilters.endDate) && (
            <div className="text-center p-4 text-gray-500">
              No monthly data found for the selected filters.
            </div>
          )}

        {/* Table Display */}
        {!loading && !error && rows.length > 0 && (
          <div
            className="overflow-x-auto border border-gray-300 rounded-md"
            style={{ maxHeight: "60vh" }}
          >
            <table className="min-w-full border-collapse align-middle text-xs">
              {/* Table Header */}
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  {tableGroupingHeaders.map((header, index) => (
                    <th
                      key={header}
                      className="py-2 px-3 border-b border-r border-gray-300 text-left font-semibold text-gray-700 sticky bg-gray-100 z-20 whitespace-nowrap align-middle"
                      style={{ left: `${index * 100}px`, minWidth: "100px" }}
                    >
                      {header}
                    </th>
                  ))}
                  <th
                    className="py-2 px-3 border-b border-r border-gray-300 text-left font-semibold text-gray-700 sticky bg-gray-100 z-20 whitespace-nowrap align-middle"
                    style={{
                      left: `${tableGroupingHeaders.length * 100}px`,
                      minWidth: "150px",
                    }}
                  >
                    Defect / Group
                  </th>
                  {uniqueMonths.map((month) => (
                    <th
                      key={month}
                      className="py-2 px-3 border-b border-r border-gray-300 text-center font-semibold text-gray-700 whitespace-nowrap align-middle"
                      style={{ minWidth: "90px" }}
                    >
                      {formatYYYYMMToDisplay(month)}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="bg-white">
                {rows.map((row, rowIndex) => {
                  // Group Row Rendering
                  if (row.type === "group") {
                    const rowSpanCount = calculateRowSpan(
                      rowIndex,
                      row.key.replace("-group", ""),
                    );
                    return (
                      <tr key={row.key} className="font-semibold">
                        {tableGroupingHeaders.map((header, colIndex) => (
                          <td
                            key={`group-${row.key}-${colIndex}`}
                            rowSpan={rowSpanCount}
                            className="py-1.5 px-3 border-b border-r border-slate-400 whitespace-nowrap align-top font-medium text-gray-800 bg-slate-100 sticky z-10" // Align top
                            style={{
                              left: `${colIndex * 100}px`,
                              minWidth: "100px",
                            }}
                          >
                            {row.groupValues[colIndex]}
                          </td>
                        ))}
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
                        {uniqueMonths.map((month) => {
                          const rate = row.data[month] || 0;
                          const displayValue =
                            rate > 0 ? `${rate.toFixed(2)}%` : "";
                          return (
                            <td
                              key={`${row.key}-month-${month}`}
                              className={`py-1.5 px-3 border-b border-r border-slate-600 text-center align-middle font-semibold ${
                                rate > 0
                                  ? getBackgroundColor(rate)
                                  : "bg-slate-500"
                              } ${
                                rate > 0 ? getFontColor(rate) : "text-white"
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
                    // Defect Row Rendering
                  } else if (row.type === "defect") {
                    return (
                      <tr key={row.key} className="hover:bg-gray-50">
                        <td
                          key={`label-${row.key}`}
                          className="py-1.5 px-3 border-b border-r border-gray-300 whitespace-nowrap align-middle text-gray-700 bg-white pl-6 sticky z-10" // Indent
                          style={{
                            left: `${tableGroupingHeaders.length * 100}px`,
                            minWidth: "150px",
                          }}
                        >
                          {row.defectName}
                        </td>
                        {uniqueMonths.map((month) => {
                          const rate = row.data[month] || 0;
                          const displayValue =
                            rate > 0 ? `${rate.toFixed(2)}%` : "";
                          return (
                            <td
                              key={`${row.key}-month-${month}`}
                              className={`py-1.5 px-3 border-b border-r border-gray-300 text-center align-middle ${
                                rate > 0 ? getBackgroundColor(rate) : "bg-white"
                              } ${
                                rate > 0 ? getFontColor(rate) : "text-gray-500"
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
                  return null;
                })}

                {/* Overall Total Row */}
                <tr className="bg-gray-200 font-semibold text-gray-800 sticky bottom-0 z-10">
                  {tableGroupingHeaders.map((_, index) => (
                    <td
                      key={`total-group-${index}`}
                      className="py-2 px-3 border-b border-r border-t border-gray-400 sticky bg-gray-200 z-20 align-middle"
                      style={{ left: `${index * 100}px`, minWidth: "100px" }}
                    ></td>
                  ))}
                  <td
                    className="py-2 px-3 border-b border-r border-t border-gray-400 sticky bg-gray-200 z-20 font-bold align-middle"
                    style={{
                      left: `${tableGroupingHeaders.length * 100}px`,
                      minWidth: "150px",
                    }}
                  >
                    OVERALL TOTAL
                  </td>
                  {uniqueMonths.map((month) => {
                    // Calculate overall total rate for the month
                    const monthData = monthlyApiData.filter(
                      (d) => getYearMonthKey(d.inspectionDate) === month,
                    );
                    const totalCheckedForMonth = monthData.reduce(
                      (sum, d) => sum + (d.CheckedQty || 0),
                      0,
                    );
                    const totalDefectsForMonth = monthData.reduce(
                      (sum, d) => sum + (d.totalDefectsQty || 0),
                      0,
                    );
                    const rate =
                      totalCheckedForMonth > 0
                        ? parseFloat(
                            (
                              (totalDefectsForMonth / totalCheckedForMonth) *
                              100
                            ).toFixed(2),
                          )
                        : 0;
                    const displayValue =
                      rate > 0 ? `${rate.toFixed(2)}%` : "";
                    return (
                      <td
                        key={`total-month-${month}`}
                        className={`py-2 px-3 border-b border-r border-t border-gray-400 text-center font-bold align-middle ${
                          rate > 0 ? getBackgroundColor(rate) : "bg-gray-200"
                        } ${
                          rate > 0 ? getFontColor(rate) : "text-gray-800"
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

export default SunriseMonthlyTrend;
