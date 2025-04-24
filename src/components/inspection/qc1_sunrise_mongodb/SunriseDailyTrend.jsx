import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import QCSunriseFilterPane from "./QCSunriseFilterPane";
import QCSunriseSummaryCard from "./QCSunriseSummaryCard";

const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr; 
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};


const getDefaultEndDate = () => new Date().toISOString().split("T")[0];
const getDefaultStartDate = () => {
    const today = new Date();

    today.setDate(today.getDate() - 30);
    return today.toISOString().split("T")[0];
};


const QCSunriseDailyTrend = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeFilters, setActiveFilters] = useState({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
    lineNo: '',
    MONo: '',
    Color: '',
    Size: '',
    Buyer: '',
    defectName: '',
  });

  const [totalChecked, setTotalChecked] = useState(0);
  const [totalDefects, setTotalDefects] = useState(0);
  const [overallDhu, setOverallDhu] = useState(0);

  const [customFilters, setCustomFilters] = useState({
    addLines: true,
    addMO: true,
    addBuyer: true,
    addColors: true,
    addSizes: true,
  });
  const [rows, setRows] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);

  // --- Handler for Filter Changes from QCSunriseFilterPane ---
  const handleFilterChange = useCallback((newFilters) => {
    setActiveFilters(newFilters);
  }, []);
  // --- End Handler ---

  // Determine if filters are applied (using local activeFilters state)
  const isMoNoFiltered = (activeFilters.MONo ?? "").trim() !== "";
  const isLineNoFiltered = (activeFilters.lineNo ?? "").trim() !== "";
  const isColorFiltered = (activeFilters.Color ?? "").trim() !== "";
  const isSizeFiltered = (activeFilters.Size ?? "").trim() !== "";
  const isBuyerFiltered = (activeFilters.Buyer ?? "").trim() !== ""; // Added Buyer check

  // Fetch data using local activeFilters state
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Reset error before fetch
      setSummaryData([]); // Clear previous data
      setRows([]); // Clear trend rows
      setUniqueDates([]); // Clear trend dates
      // Reset card data
      setTotalChecked(0);
      setTotalDefects(0);
      setOverallDhu(0);

      const currentActiveFilters = Object.fromEntries(
        Object.entries(activeFilters).filter( // Use activeFilters state here
          ([_, value]) => value !== "" && value !== undefined && value !== null
        )
      );

      // Map filters to QC1 endpoint parameters with correct casing
      const queryParams = {};
      if (currentActiveFilters.startDate)
        queryParams.startDate = currentActiveFilters.startDate;
      if (currentActiveFilters.endDate)
        queryParams.endDate = currentActiveFilters.endDate;
      if (currentActiveFilters.lineNo) queryParams.lineNo = currentActiveFilters.lineNo;
      if (currentActiveFilters.MONo) queryParams.MONo = currentActiveFilters.MONo;
      if (currentActiveFilters.Color) queryParams.Color = currentActiveFilters.Color;
      if (currentActiveFilters.Size) queryParams.Size = currentActiveFilters.Size;
      if (currentActiveFilters.Buyer) queryParams.Buyer = currentActiveFilters.Buyer;
      if (currentActiveFilters.defectName)
        queryParams.defectName = currentActiveFilters.defectName;

      // Add custom filters if not overridden by activeFilters
      if (customFilters.addLines && !queryParams.lineNo) queryParams.lineNo = "";
      if (customFilters.addMO && !queryParams.MONo) queryParams.MONo = "";
      if (customFilters.addBuyer && !queryParams.Buyer) queryParams.Buyer = "";
      if (customFilters.addColors && !queryParams.Color) queryParams.Color = "";
      if (customFilters.addSizes && !queryParams.Size) queryParams.Size = "";

      // Ensure startDate and endDate are always provided (using defaults from state)
      if (!queryParams.startDate) queryParams.startDate = activeFilters.startDate;
      if (!queryParams.endDate) queryParams.endDate = activeFilters.endDate;


      const queryString = new URLSearchParams(queryParams).toString();
      const url = `${API_BASE_URL}/api/sunrise/qc1-data?${queryString}`;
      const response = await axios.get(url);
      setSummaryData(response.data); // Set summary data which triggers other useEffects
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch QC1 Sunrise data");
      setSummaryData([]);
       // Ensure card data is cleared on error
      setTotalChecked(0);
      setTotalDefects(0);
      setOverallDhu(0);
    } finally {
      setLoading(false);
    }
  }, [activeFilters, customFilters]); // Depend on local activeFilters and customFilters

  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData dependency is correct as it includes activeFilters

  // --- Process data for Defect Summary Card ---
  useEffect(() => {
    if (loading || error || summaryData.length === 0) {
      // Reset card data if loading, error, or no data
      setTotalChecked(0);
      setTotalDefects(0);
      setOverallDhu(0);
      return;
    }

    let checked = 0;
    let defects = 0;

    summaryData.forEach(item => {
      checked += item.CheckedQty || 0;
      defects += item.totalDefectsQty || 0;
    });

    const dhu = checked > 0 ? parseFloat(((defects / checked) * 100).toFixed(2)) : 0; // Ensure it's a number

    setTotalChecked(checked);
    setTotalDefects(defects);
    setOverallDhu(dhu);

  }, [summaryData, loading, error]); // Depend on summaryData, loading, and error states
  // --- End Defect Summary Card Processing ---


  // Process data for trend table - Dependencies updated
  useEffect(() => {
    if (loading || error || summaryData.length === 0) {
        setRows([]); // Clear rows if no data/loading/error
        setUniqueDates([]); // Clear dates if no data/loading/error
        return;
    };

    // Extract unique dates (in DD/MM/YYYY format)
    const datesSet = new Set(
      summaryData.map((d) => formatDateToDDMMYYYY(d.inspectionDate))
    );
    const sortedDates = [...datesSet].sort((a, b) => {
      try {
        const [dayA, monthA, yearA] = a.split("/").map(Number);
        const [dayB, monthB, yearB] = b.split("/").map(Number);
        return (
          new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB)
        );
      } catch (e) {
        console.error("Error sorting dates:", a, b, e);
        return 0; // Avoid crash on invalid date format during sort
      }
    });
    setUniqueDates(sortedDates);

    // Define grouping fields based on custom toggles AND whether a specific filter is already applied
    const groupingFields = [];
    if (customFilters.addLines && !isLineNoFiltered) groupingFields.push("lineNo");
    if (customFilters.addMO && !isMoNoFiltered) groupingFields.push("MONo");
    if (customFilters.addBuyer && !isBuyerFiltered) groupingFields.push("Buyer");
    if (customFilters.addColors && !isColorFiltered) groupingFields.push("Color");
    if (customFilters.addSizes && !isSizeFiltered) groupingFields.push("Size");

    // Build hierarchy and rows
    const hierarchy = buildHierarchy(summaryData, groupingFields);
    const tableRows = buildRows(hierarchy, groupingFields, sortedDates);
    setRows(tableRows);
  }, [summaryData, customFilters, isLineNoFiltered, isMoNoFiltered, isColorFiltered, isSizeFiltered, isBuyerFiltered, loading, error]); // Added loading/error dependency


  // Build hierarchical data structure (No changes needed)
  const buildHierarchy = (data, groupingFields) => {
    if (groupingFields.length === 0) {
      const dateMap = {};
      data.forEach((doc) => {
        const formattedDate = formatDateToDDMMYYYY(doc.inspectionDate);
        // Aggregate data if multiple entries exist for the same date without grouping
        if (!dateMap[formattedDate]) {
            dateMap[formattedDate] = { ...doc, DefectArray: [...(doc.DefectArray || [])] }; // Initialize with first doc
        } else {
            // Combine CheckedQty, totalDefectsQty, and DefectArray
            dateMap[formattedDate].CheckedQty = (dateMap[formattedDate].CheckedQty || 0) + (doc.CheckedQty || 0);
            dateMap[formattedDate].totalDefectsQty = (dateMap[formattedDate].totalDefectsQty || 0) + (doc.totalDefectsQty || 0);
            // Merge DefectArrays, summing quantities for the same defectName
            const existingDefects = dateMap[formattedDate].DefectArray || [];
            const newDefects = doc.DefectArray || [];
            newDefects.forEach(newDefect => {
                const existing = existingDefects.find(d => d.defectName === newDefect.defectName);
                if (existing) {
                    existing.defectQty = (existing.defectQty || 0) + (newDefect.defectQty || 0);
                } else {
                    existingDefects.push({ ...newDefect });
                }
            });
            dateMap[formattedDate].DefectArray = existingDefects;
        }
      });
      return dateMap;
    } else {
      const field = groupingFields[0];
      const groups = {};
      data.forEach((doc) => {
        const value = doc[field] || "N/A"; // Handle missing field value
        if (!groups[value]) groups[value] = [];
        groups[value].push(doc);
      });
      const result = {};
      for (const [value, docs] of Object.entries(groups)) {
        result[value] = buildHierarchy(docs, groupingFields.slice(1));
      }
      return result;
    }
  };

  // Build table rows recursively (No changes needed)
  const buildRows = (
    hierarchy,
    groupingFields,
    dates,
    level = 0,
    path = [],
    currentFieldIndex = 0
  ) => {
    const rows = [];
    if (currentFieldIndex < groupingFields.length) {
      // Group level
      const field = groupingFields[currentFieldIndex];
      Object.keys(hierarchy)
        .sort()
        .forEach((value) => {
          const subHierarchy = hierarchy[value];
          const groupData = {};
          dates.forEach((date) => {
            const sum = getSumForGroup(subHierarchy, date);
            groupData[date] =
              sum.checkedQty > 0
                ? (sum.defectsQty / sum.checkedQty) * 100
                : 0;
          });
          rows.push({
            level,
            type: "group",
            key: value,
            path: [...path, value],
            data: groupData,
          });
          const subRows = buildRows(
            subHierarchy,
            groupingFields,
            dates,
            level + 1,
            [...path, value],
            currentFieldIndex + 1
          );
          rows.push(...subRows);
        });
    } else {
      // Leaf level: defect rows
      const dateMap = hierarchy; // This is the aggregated map for the current leaf path
      const defectNames = new Set();

      // Collect all unique defect names across all dates for this leaf
      Object.values(dateMap).forEach((doc) => {
        if (doc && doc.DefectArray) {
          doc.DefectArray.forEach((defect) => {
            if (defect.defectName) defectNames.add(defect.defectName);
          });
        }
      });

      [...defectNames].sort().forEach((defectName) => {
        const defectData = {};
        dates.forEach((date) => {
          const doc = dateMap[date]; // Get the aggregated doc for the specific date
          if (doc && doc.DefectArray) {
            const defect = doc.DefectArray.find(
              (d) => d.defectName === defectName
            );
            // Use the aggregated CheckedQty for the percentage calculation
            defectData[date] =
              defect && doc.CheckedQty > 0
                ? ((defect.defectQty || 0) / doc.CheckedQty) * 100 // Ensure defectQty is treated as 0 if undefined
                : 0;
          } else {
            defectData[date] = 0; // No data for this date
          }
        });
        rows.push({
          level,
          type: "defect",
          key: defectName,
          path: [...path, defectName],
          data: defectData,
        });
      });
    }
    return rows;
  };


  // Sum CheckedQty and totalDefectsQty for a group on a specific date (No changes needed)
  const getSumForGroup = (currentHierarchy, date) => {
    // Base case: If it's a dateMap (leaf node in the grouping hierarchy)
    if (
      typeof currentHierarchy !== "object" ||
      currentHierarchy === null ||
      !Object.values(currentHierarchy).some(v => typeof v === 'object' && v !== null && !Array.isArray(v)) // Check if values are not nested objects (heuristic for dateMap)
      && Object.keys(currentHierarchy).includes(date) // Check if the date key exists directly
    ) {
      const doc = currentHierarchy[date];
      return doc
        ? { checkedQty: doc.CheckedQty || 0, defectsQty: doc.totalDefectsQty || 0 }
        : { checkedQty: 0, defectsQty: 0 };
    }

    // Recursive case: Iterate through the keys (group values)
    let sum = { checkedQty: 0, defectsQty: 0 };
    for (const key in currentHierarchy) {
        if (Object.hasOwnProperty.call(currentHierarchy, key)) {
            const subSum = getSumForGroup(currentHierarchy[key], date);
            sum.checkedQty += subSum.checkedQty;
            sum.defectsQty += subSum.defectsQty;
        }
    }
    return sum;
  };


  // Color coding functions (Only needed for Trend Table now)
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
    if (rate > 3) return [255, 204, 204]; // Light Red
    if (rate >= 2) return [255, 255, 204]; // Light Yellow
    return [204, 255, 204]; // Light Green
  };

  const getFontColorRGB = (rate) => {
    if (rate > 3) return [153, 0, 0]; // Dark Red
    if (rate >= 2) return [204, 102, 0]; // Dark Orange
    return [0, 102, 0]; // Dark Green
  };

  const getBackgroundColorHex = (rate) => {
    if (rate > 3) return "FFCCCC"; // Light Red
    if (rate >= 2) return "FFFFCC"; // Light Yellow
    return "CCFFCC"; // Light Green
  };

  // Export data preparation - Updated to use local filter checks
  const prepareExportData = () => {
    const exportData = [];
    const ratesMap = new Map(); // To store rates for coloring cells

    // Title Row
    exportData.push(["Daily Defect Trend Analysis", ...Array(uniqueDates.length).fill("")]);
    ratesMap.set("0-0", 0); // Mark title cell, no color needed

    // Spacer Row
    exportData.push(Array(uniqueDates.length + 1).fill(""));
    ratesMap.set("1-0", 0); // Mark spacer cell

    // Header Row
    const headerRow = ["Group / Defect", ...uniqueDates];
    exportData.push(headerRow);
    ratesMap.set("2-0", 0); // Mark header cell

    // Data Rows
    let rowIndex = 3; // Start after Title, Spacer, Header
    rows.forEach((row) => {
      const indent = "  ".repeat(row.level);
      const rowData = [`${indent}${row.key}`];
      uniqueDates.forEach((date, colIndex) => {
        const rate = row.data[date] || 0;
        rowData.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
        // Store rate for coloring, map key: "rowIndex-colIndex" (1-based for col)
        ratesMap.set(`${rowIndex}-${colIndex + 1}`, rate);
      });
      exportData.push(rowData);
      ratesMap.set(`${rowIndex}-0`, 0); // Mark group/defect cell
      rowIndex++;
    });

    // Total Row Calculation (using getSumForGroup on the initial hierarchy)
    const totalRow = ["Total DHU%"]; // Updated label
    const groupingFieldsForTotal = []; // Determine grouping fields based on toggles and active filters
    if (customFilters.addLines && !isLineNoFiltered) groupingFieldsForTotal.push("lineNo");
    if (customFilters.addMO && !isMoNoFiltered) groupingFieldsForTotal.push("MONo");
    if (customFilters.addBuyer && !isBuyerFiltered) groupingFieldsForTotal.push("Buyer");
    if (customFilters.addColors && !isColorFiltered) groupingFieldsForTotal.push("Color");
    if (customFilters.addSizes && !isSizeFiltered) groupingFieldsForTotal.push("Size");

    // Rebuild hierarchy *only if needed* for total calculation (can be optimized if performance is an issue)
    // Or better: Calculate totals directly from summaryData if no grouping is active for totals
    const totalHierarchy = buildHierarchy(summaryData, groupingFieldsForTotal);

    uniqueDates.forEach((date, colIndex) => {
        // Use getSumForGroup on the appropriate hierarchy level
        const sum = getSumForGroup(totalHierarchy, date);
        const rate = sum.checkedQty > 0 ? (sum.defectsQty / sum.checkedQty) * 100 : 0;
        totalRow.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
        ratesMap.set(`${rowIndex}-${colIndex + 1}`, rate); // Store rate for total row cells
    });
    exportData.push(totalRow);
    ratesMap.set(`${rowIndex}-0`, 0); // Mark total label cell

    return { exportData, ratesMap };
  };


  // Download Excel - Updated coloring logic slightly
  const downloadExcel = () => {
    const { exportData, ratesMap } = prepareExportData();
    if (exportData.length <= 3) { // Check if there's data beyond headers
        alert("No data available to export.");
        return;
    }
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue; // Skip empty cells

        const rate = ratesMap.get(`${R}-${C}`) ?? -1; // Use -1 to distinguish from 0% rate
        const isHeaderRow = R === 2;
        const isTotalRow = R === range.e.r;
        const isFirstCol = C === 0;
        const isTitleRow = R === 0;
        const isSpacerRow = R === 1;

        let fgColor = "FFFFFF"; // Default white

        if (isTitleRow || isSpacerRow) {
            fgColor = "FFFFFF"; // White for title/spacer
        } else if (isHeaderRow || isTotalRow) {
            fgColor = "ADD8E6"; // Light Blue for header/total row
        } else if (isFirstCol) {
            fgColor = "F3F4F6"; // Light gray for group/defect names
        } else if (rate > 0) {
            fgColor = getBackgroundColorHex(rate); // Color based on rate
        } else if (rate === 0) {
             fgColor = "E5E7EB"; // Slightly darker gray for 0% or empty data cells
        }
         // else: keep default white for error cases or unmapped cells

        ws[cellAddress].s = { // Style object
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
          fill: { fgColor: { rgb: fgColor } },
          alignment: {
            horizontal: isFirstCol ? "left" : "center",
            vertical: "middle",
          },
          font: {
              bold: isHeaderRow || isTotalRow || (isFirstCol && R > 2 && R < range.e.r && exportData[R][0].trim() === exportData[R][0]) // Bold headers, totals, and top-level groups
          }
        };
      }
    }

    // Set column widths (optional, adjust as needed)
    const colWidths = [{ wch: 30 }]; // First column wider
    uniqueDates.forEach(() => colWidths.push({ wch: 12 })); // Date columns
    ws['!cols'] = colWidths;

    // Merge title cell
    if (range.e.c > 0) {
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } }];
        // Center align title
        if(ws['A1']) ws['A1'].s.alignment = { horizontal: "center", vertical: "middle" };
    }


    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defect Trend");
    XLSX.writeFile(wb, "DailyDefectTrend.xlsx");
  };

  // Download PDF - Updated coloring logic slightly
  const downloadPDF = () => {
    const { exportData, ratesMap } = prepareExportData();
     if (exportData.length <= 3) { // Check if there's data beyond headers
        alert("No data available to export.");
        return;
    }
    const doc = new jsPDF({ orientation: "landscape" });

    const tablePlugin = typeof autoTable === "function" ? autoTable : window.autoTable; // Use window if global
    if (!tablePlugin) {
      console.error("jsPDF-AutoTable plugin not found.");
      alert("PDF export functionality is unavailable. Please check console.");
      return;
    }

    const head = [exportData[2]]; // Header row
    const body = exportData.slice(3); // Data rows (including total)

    tablePlugin(doc, {
      head: head,
      body: body,
      startY: 20, // Start table below title
      theme: "grid",
      headStyles: {
        fillColor: [173, 216, 230], // Light Blue
        textColor: [55, 65, 81], // Dark Gray
        fontStyle: "bold",
        halign: 'center',
      },
      styles: {
        cellPadding: 2,
        fontSize: 7, // Smaller font size for landscape
        valign: "middle",
        lineColor: [0, 0, 0], // Black lines
        lineWidth: 0.1,
      },
      columnStyles: {
          0: { halign: "left", cellWidth: 'auto' }, // First column left aligned, auto width
          // Apply center align to other columns dynamically if needed
           ...uniqueDates.reduce((acc, _, index) => {
               acc[index + 1] = { halign: 'center' };
               return acc;
           }, {})
      },
      didParseCell: (data) => {
        const rowIndex = data.row.index + 3; // Adjust for header offset in exportData
        const colIndex = data.column.index;
        const rate = ratesMap.get(`${rowIndex}-${colIndex}`) ?? -1; // Use -1 default
        const isTotalRow = data.row.index === body.length - 1; // Check if it's the last row in the body

        // Apply styles based on cell content and position
        if (data.section === "body") {
          if (colIndex === 0) { // Group/Defect column
            data.cell.styles.fillColor = isTotalRow ? [173, 216, 230] : [243, 244, 246]; // Light Blue for total, Light Gray otherwise
            data.cell.styles.textColor = [55, 65, 81]; // Dark Gray text
            data.cell.styles.fontStyle = isTotalRow ? 'bold' : 'normal'; // Bold total label
             // Indentation for hierarchy (basic implementation)
            const cellText = data.cell.raw?.toString() || '';
            const indentLevel = (cellText.match(/^ */) || [''])[0].length / 2; // Count leading spaces
            if (indentLevel > 0) {
                 data.cell.styles.cellPadding = { ...data.cell.styles.cellPadding, left: 2 + indentLevel * 4 }; // Add left padding
            }

          } else { // Data columns
            const hasData = rate !== -1; // Check if rate was found in map
            const isZero = rate === 0;

            if (isTotalRow) {
                 data.cell.styles.fillColor = [173, 216, 230]; // Light Blue for total row data cells
                 data.cell.styles.textColor = hasData && rate > 0 ? getFontColorRGB(rate) : [55, 65, 81];
                 data.cell.styles.fontStyle = 'bold';
            } else if (hasData && rate > 0) {
                data.cell.styles.fillColor = getBackgroundColorRGB(rate);
                data.cell.styles.textColor = getFontColorRGB(rate);
            } else if (hasData && isZero) {
                 data.cell.styles.fillColor = [229, 231, 235]; // Gray for 0%
                 data.cell.styles.textColor = [55, 65, 81];
            }
             else {
                // Default for empty cells or cells with no rate mapped
                data.cell.styles.fillColor = [255, 255, 255]; // White
                data.cell.styles.textColor = [107, 114, 128]; // Lighter gray text for empty
            }
          }
        } else if (data.section === 'head') {
             data.cell.styles.halign = colIndex === 0 ? 'left' : 'center'; // Ensure header alignment matches columnStyles
        }
      },
      didDrawPage: (data) => {
        // Add title
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Daily Defect Trend Analysis", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
      },
    });

    doc.save("DailyDefectTrend.pdf");
  };


  // Handle option toggle (No changes needed)
  const handleOptionToggle = (option) => {
    setCustomFilters((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  // Handle Add All button (No changes needed)
  const handleAddAll = () => {
    setCustomFilters({
      addLines: true,
      addMO: true,
      addBuyer: true,
      addColors: true,
      addSizes: true,
    });
  };

  // Handle Clear All button (No changes needed)
  const handleClearAll = () => {
    setCustomFilters({
      addLines: false,
      addMO: false,
      addBuyer: false,
      addColors: false,
      addSizes: false,
    });
  };

  // Prepare summaryStats prop for QCSunriseSummaryCard
  const summaryStats = {
    totalCheckedQty: totalChecked,
    totalDefectsQty: totalDefects,
    defectRate: overallDhu, // Pass the calculated DHU/rate
  };


  return (
    // Main container div
    <div className="p-4 space-y-6"> {/* Increased spacing */}
        {/* --- Filter Pane --- */}
        <QCSunriseFilterPane
            // filters={activeFilters} // Filter pane manages its own state now
            onFilterChange={handleFilterChange}
        />
        {/* --- End Filter Pane --- */}

        {/* --- Defect Summary Card (Using QCSunriseSummaryCard) --- */}
        <div className="mb-6"> {/* Added mb-6 for spacing below cards, matching original filter pane */}
            {/* Optional Title if needed */}
            {/* <h2 className="text-lg font-semibold text-gray-900 mb-3">Overall Defect Summary</h2> */}

            {loading && <div className="text-center p-4 text-gray-500">Loading summary...</div>}
            {error && <div className="text-center p-4 text-red-500">Error loading summary: {error}</div>}
            {!loading && !error && summaryData.length === 0 && (
                <div className="text-center p-4 text-gray-500 bg-white shadow-md rounded-lg">No data available for summary.</div>
            )}
            {!loading && !error && summaryData.length > 0 && (
                // Use the imported component
                <QCSunriseSummaryCard summaryStats={summaryStats} />
            )}
        </div>
        {/* --- End Defect Summary Card --- */}


        {/* --- Trend Table Section --- */}
        <div className="bg-white shadow-md rounded-lg p-4">
            {/* Render table section header only if not loading/error */}
            {!loading && !error && (
                <>
                    {/* Header and Controls */}
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                        <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">Daily Defect Trend</h2>
                        {/* Grouping Options & Export */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            {/* Custom Checkboxes */}
                            <span className="text-sm font-medium text-gray-600 mr-2">Group by:</span>
                            <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={customFilters.addLines || isLineNoFiltered}
                                onChange={() => handleOptionToggle("addLines")}
                                disabled={isLineNoFiltered}
                                className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${isLineNoFiltered ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                />
                                <span className={`text-sm ${isLineNoFiltered ? 'text-gray-400' : 'text-gray-700'}`}>Lines</span>
                            </label>
                            <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={customFilters.addMO || isMoNoFiltered}
                                onChange={() => handleOptionToggle("addMO")}
                                disabled={isMoNoFiltered}
                                className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${isMoNoFiltered ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                />
                                <span className={`text-sm ${isMoNoFiltered ? 'text-gray-400' : 'text-gray-700'}`}>MO</span>
                            </label>
                             <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={customFilters.addBuyer || isBuyerFiltered}
                                onChange={() => handleOptionToggle("addBuyer")}
                                disabled={isBuyerFiltered} // Disable if a specific buyer is selected in filters
                                className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${isBuyerFiltered ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                />
                                <span className={`text-sm ${isBuyerFiltered ? 'text-gray-400' : 'text-gray-700'}`}>Buyer</span>
                            </label>
                            <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={customFilters.addColors || isColorFiltered}
                                onChange={() => handleOptionToggle("addColors")}
                                disabled={isColorFiltered}
                                className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${isColorFiltered ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                />
                                <span className={`text-sm ${isColorFiltered ? 'text-gray-400' : 'text-gray-700'}`}>Colors</span>
                            </label>
                            <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={customFilters.addSizes || isSizeFiltered}
                                onChange={() => handleOptionToggle("addSizes")}
                                disabled={isSizeFiltered}
                                className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${isSizeFiltered ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                />
                                <span className={`text-sm ${isSizeFiltered ? 'text-gray-400' : 'text-gray-700'}`}>Sizes</span>
                            </label>

                            {/* Add/Clear Buttons */}
                            <button
                                onClick={handleAddAll}
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                            >
                                Add All
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                            >
                                Clear All
                            </button>

                            {/* Separator */}
                            <div className="border-l border-gray-300 h-6 mx-2"></div>

                            {/* Export Buttons */}
                            <button
                                onClick={downloadExcel}
                                className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                                title="Download as Excel"
                                disabled={rows.length === 0} // Disable if no data
                            >
                                <FaFileExcel className="mr-1 h-4 w-4" /> Excel
                            </button>
                            <button
                                onClick={downloadPDF}
                                className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                title="Download as PDF"
                                disabled={rows.length === 0} // Disable if no data
                            >
                                <FaFilePdf className="mr-1 h-4 w-4" /> PDF
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Loading and Error States for Table */}
            {loading && <div className="text-center p-4 text-gray-500">Loading trend data...</div>}
            {error && <div className="text-center p-4 text-red-500">Error loading trend data: {error}</div>}

            {/* Render table only when not loading and no error */}
            {!loading && !error && (
                <>
                    {/* Table Container */}
                    {rows.length > 0 ? (
                        <div className="overflow-x-auto border border-gray-300 rounded-md" style={{ maxHeight: "60vh" }}> {/* Increased max height */}
                            <table className="min-w-full border-collapse align-middle text-xs">
                                <thead className="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                    <th className="py-2 px-3 border-b border-r border-gray-300 text-left font-semibold text-gray-700 sticky left-0 bg-gray-100 z-20">
                                        Group / Defect
                                    </th>
                                    {uniqueDates.map((date) => (
                                        <th
                                        key={date}
                                        className="py-2 px-3 border-b border-r border-gray-300 text-center font-semibold text-gray-700 whitespace-nowrap"
                                        >
                                        {date}
                                        </th>
                                    ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {rows.map((row, index) => (
                                    <tr key={`${row.path.join('-')}-${index}`} className={row.type === "group" ? "bg-gray-50 hover:bg-gray-100" : "hover:bg-gray-50"}>
                                        <td
                                        className={`py-1.5 px-3 border-b border-r border-gray-300 ${row.type === "group" ? "font-medium text-gray-800" : "text-gray-600"} sticky left-0 z-10 ${row.type === "group" ? "bg-gray-50" : "bg-white"}`} // Ensure sticky column has background
                                        style={{ paddingLeft: `${8 + row.level * 16}px` }} // Indentation using padding
                                        >
                                        {row.key}
                                        </td>
                                        {uniqueDates.map((date) => {
                                        const rate = row.data[date] || 0;
                                        const displayValue = rate > 0 ? `${rate.toFixed(2)}%` : "";
                                        return (
                                            <td
                                            key={date}
                                            className={`py-1.5 px-3 border-b border-r border-gray-300 text-center ${rate > 0 ? getBackgroundColor(rate) : "bg-white"} ${rate > 0 ? getFontColor(rate) : "text-gray-500"}`}
                                            title={displayValue} // Add tooltip
                                            >
                                            {displayValue}
                                            </td>
                                        );
                                        })}
                                    </tr>
                                    ))}
                                    {/* Total Row */}
                                    <tr className="bg-gray-200 font-semibold text-gray-800">
                                        <td className="py-2 px-3 border-b border-r border-gray-300 sticky left-0 bg-gray-200 z-10">
                                            Total DHU%
                                        </td>
                                        {uniqueDates.map((date) => {
                                            // Calculate total rate for the date directly from summaryData for accuracy
                                            const dateData = summaryData.filter(
                                                (d) => formatDateToDDMMYYYY(d.inspectionDate) === date
                                            );
                                            const totalChecked = dateData.reduce(
                                                (sum, d) => sum + (d.CheckedQty || 0), 0
                                            );
                                            const totalDefects = dateData.reduce(
                                                (sum, d) => sum + (d.totalDefectsQty || 0), 0
                                            );
                                            const rate = totalChecked > 0 ? (totalDefects / totalChecked) * 100 : 0;
                                            const displayValue = rate > 0 ? `${rate.toFixed(2)}%` : "";
                                            return (
                                                <td
                                                    key={date}
                                                    className={`py-2 px-3 border-b border-r border-gray-300 text-center ${rate > 0 ? getBackgroundColor(rate) : "bg-gray-200"} ${rate > 0 ? getFontColor(rate) : "text-gray-800"}`}
                                                    title={displayValue}
                                                >
                                                    {displayValue}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                         <div className="text-center p-4 text-gray-500">No trend data available for the selected filters.</div>
                    )}
                </>
            )}
        </div>
        {/* --- End Trend Table Section --- */}
    </div>
  );
};

export default QCSunriseDailyTrend;
