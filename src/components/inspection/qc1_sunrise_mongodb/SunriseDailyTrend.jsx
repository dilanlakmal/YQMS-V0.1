import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import QCSunriseFilterPane from "./QCSunriseFilterPane";
import QCSunriseSummaryCard from "./QCSunriseSummaryCard";

// Helper function to format date string from YYYY-MM-DD to DD/MM/YYYY
const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

// Helper function to parse DD/MM/YYYY back to a Date object for sorting
const parseDDMMYYYY = (dateStr) => {
  if (!dateStr || !dateStr.includes('/')) return null;
  const [day, month, year] = dateStr.split("/").map(Number);
  // JavaScript months are 0-indexed
  return new Date(year, month - 1, day);
};


// Default date range (last 30 days)
const getDefaultEndDate = () => new Date().toISOString().split("T")[0];
const getDefaultStartDate = () => {
    const today = new Date();
    today.setDate(today.getDate() - 30);
    return today.toISOString().split("T")[0];
};

const QCSunriseDailyTrend = () => {
  const [rawData, setRawData] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters applied via the filter pane
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

  // State for controlling which fields to group by in the table
  const [groupingOptions, setGroupingOptions] = useState({
    addLines: true,
    addMO: true,
    addBuyer: true,
    addColors: true,
    addSizes: true,
  });

  // Processed data for the table
  const [rows, setRows] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);

  // Summary card stats
  const [totalChecked, setTotalChecked] = useState(0);
  const [totalDefects, setTotalDefects] = useState(0);
  const [overallDhu, setOverallDhu] = useState(0);

  // Handler for Filter Changes from QCSunriseFilterPane
  const handleFilterChange = useCallback((newFilters) => {
    setActiveFilters(newFilters);
  }, []);

  // Determine if a specific filter is actively being used (non-empty string)
  const isFilterActive = (filterName) => (activeFilters[filterName] ?? "").trim() !== "";

  // Fetch data from API based on activeFilters
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setRawData([]); 
      setRows([]);
      setUniqueDates([]);
      setTotalChecked(0);
      setTotalDefects(0);
      setOverallDhu(0);

     
      const queryParams = { ...activeFilters };

      
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });

      if (!queryParams.startDate) queryParams.startDate = getDefaultStartDate();
      if (!queryParams.endDate) queryParams.endDate = getDefaultEndDate();

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `${API_BASE_URL}/api/sunrise/qc1-data?${queryString}`;
      console.log("Fetching data from:", url); 

      const response = await axios.get(url);
      console.log("Fetched data:", response.data.length, "records"); 
      setRawData(response.data || []); 
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch QC1 Sunrise data");
      setRawData([]);
      setTotalChecked(0);
      setTotalDefects(0);
      setOverallDhu(0);
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

 
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (loading || error || !Array.isArray(rawData) || rawData.length === 0) {
      setTotalChecked(0);
      setTotalDefects(0);
      setOverallDhu(0);
      return;
    }

    let checked = 0;
    let defects = 0;

    rawData.forEach(item => {
      checked += item.CheckedQty || 0;
      defects += item.totalDefectsQty || 0;
    });

    const dhu = checked > 0 ? parseFloat(((defects / checked) * 100).toFixed(2)) : 0;
    setTotalChecked(checked);
    setTotalDefects(defects);
    setOverallDhu(dhu);

  }, [rawData, loading, error]); 

  useEffect(() => {
    if (loading || error || !Array.isArray(rawData) || rawData.length === 0) {
      setRows([]);
      setUniqueDates([]);
      return;
    }
    console.log("Processing data for table...");

    // 1. Determine Grouping Fields based on options and active filters
    const groupingFieldsConfig = [
      { key: 'lineNo', option: 'addLines', filterActive: isFilterActive('lineNo') },
      { key: 'MONo', option: 'addMO', filterActive: isFilterActive('MONo') },
      { key: 'Buyer', option: 'addBuyer', filterActive: isFilterActive('Buyer') },
      { key: 'Color', option: 'addColors', filterActive: isFilterActive('Color') },
      { key: 'Size', option: 'addSizes', filterActive: isFilterActive('Size') },
    ];

    const activeGroupingFields = groupingFieldsConfig
      .filter(field => groupingOptions[field.option] && !field.filterActive)
      .map(field => field.key);

    console.log("Active Grouping Fields:", activeGroupingFields);

    // 2. Extract unique dates and sort them
    const datesSet = new Set(
      rawData.map((d) => formatDateToDDMMYYYY(d.inspectionDate)).filter(Boolean)
    );
    const sortedDates = [...datesSet].sort((a, b) => {
      const dateA = parseDDMMYYYY(a);
      const dateB = parseDDMMYYYY(b);
      if (!dateA || !dateB) return 0;
      return dateA - dateB;
    });
    setUniqueDates(sortedDates);
    console.log("Unique Dates:", sortedDates);

    // 3. Build hierarchical data structure
    const hierarchy = buildHierarchy(rawData, activeGroupingFields);
    console.log("Built Hierarchy:", hierarchy);

    // 4. Build table rows from the hierarchy
    const tableRows = buildRows(hierarchy, activeGroupingFields, sortedDates);
    console.log("Built Rows:", tableRows);
    setRows(tableRows);

  }, [rawData, groupingOptions, loading, error, activeFilters]);


  // Build hierarchical data structure
  const buildHierarchy = (data, groupingFields) => {
    const hierarchy = {};
    const normalizeString = (str) => (str ? String(str).trim() : "N/A");

    data.forEach((doc) => {
      const groupKey = groupingFields.map(field => normalizeString(doc[field])).join('|');

      if (!hierarchy[groupKey]) {
        hierarchy[groupKey] = {
          groupValues: groupingFields.map(field => normalizeString(doc[field])),
          dateMap: {},
        };
      }

      const formattedDate = formatDateToDDMMYYYY(doc.inspectionDate);
      if (!formattedDate) return;

      if (!hierarchy[groupKey].dateMap[formattedDate]) {
        hierarchy[groupKey].dateMap[formattedDate] = {
          CheckedQty: doc.CheckedQty || 0,
          totalDefectsQty: doc.totalDefectsQty || 0,
          DefectArray: Array.isArray(doc.DefectArray) ? doc.DefectArray.map(def => ({ ...def })) : [],
        };
      } else {
        const dateEntry = hierarchy[groupKey].dateMap[formattedDate];
        dateEntry.CheckedQty += (doc.CheckedQty || 0);
        dateEntry.totalDefectsQty += (doc.totalDefectsQty || 0);

        const existingDefects = dateEntry.DefectArray || [];
        const newDefects = Array.isArray(doc.DefectArray) ? doc.DefectArray : [];

        newDefects.forEach(newDefect => {
          if (!newDefect || !newDefect.defectName) return;
          const existing = existingDefects.find(d => d.defectName === newDefect.defectName);
          if (existing) {
            existing.defectQty = (existing.defectQty || 0) + (newDefect.defectQty || 0);
          } else {
            existingDefects.push({ ...newDefect, defectQty: newDefect.defectQty || 0 });
          }
        });
        dateEntry.DefectArray = existingDefects;
      }
    });

    return hierarchy;
  };

  // Build table rows from the hierarchical structure
  const buildRows = (hierarchy, groupingFields, dates) => {
    const rows = [];

    const sortedGroupKeys = Object.keys(hierarchy).sort((a, b) => {
      const aValues = hierarchy[a].groupValues;
      const bValues = hierarchy[b].groupValues;
      for (let i = 0; i < Math.min(aValues.length, bValues.length); i++) {
        const comparison = String(aValues[i]).localeCompare(String(bValues[i]));
        if (comparison !== 0) return comparison;
      }
      return aValues.length - bValues.length;
    });

    sortedGroupKeys.forEach(groupKey => {
      const group = hierarchy[groupKey];
      const groupData = {};

      dates.forEach(date => {
        const dateEntry = group.dateMap[date];
        const checkedQty = dateEntry?.CheckedQty || 0;
        const defectsQty = dateEntry?.totalDefectsQty || 0;
        groupData[date] = checkedQty > 0 ? (defectsQty / checkedQty) * 100 : 0;
      });

      rows.push({
        type: "group",
        key: groupKey + "-group",
        groupValues: group.groupValues, 
        data: groupData,
      });

      const defectNames = new Set();
      Object.values(group.dateMap).forEach(dateEntry => {
        if (dateEntry && Array.isArray(dateEntry.DefectArray)) {
          dateEntry.DefectArray.forEach(defect => {
            if (defect && defect.defectName) defectNames.add(defect.defectName);
          });
        }
      });

      [...defectNames].sort().forEach(defectName => {
        const defectData = {};
        dates.forEach(date => {
          const dateEntry = group.dateMap[date];
          if (dateEntry && Array.isArray(dateEntry.DefectArray)) {
            const defect = dateEntry.DefectArray.find(d => d.defectName === defectName);
            const checkedQty = dateEntry.CheckedQty || 0;
            defectData[date] = defect && checkedQty > 0
              ? ((defect.defectQty || 0) / checkedQty) * 100
              : 0;
          } else {
            defectData[date] = 0;
          }
        });

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
  };

  // --- Color Coding Functions ---
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
    if (rate > 3) return [254, 226, 226]; // red-100
    if (rate >= 2) return [254, 243, 199]; // yellow-100 (amber-100)
    return [220, 252, 231]; // green-100
  };

  const getFontColorRGB = (rate) => {
    if (rate > 3) return [153, 27, 27]; // red-800
    if (rate >= 2) return [154, 52, 18]; // orange-800 (amber-800)
    return [6, 95, 70]; // green-800
  };

  const getBackgroundColorHex = (rate) => {
    if (rate > 3) return "FEE2E2"; // red-100
    if (rate >= 2) return "FEF3C7"; // yellow-100 (amber-100)
    return "DCFCE7"; // green-100
  };

  // Helper to get current grouping field names for headers
  const getCurrentGroupingFieldNames = () => {
    const names = [];
    if (groupingOptions.addLines && !isFilterActive('lineNo')) names.push("Line");
    if (groupingOptions.addMO && !isFilterActive('MONo')) names.push("MO");
    if (groupingOptions.addBuyer && !isFilterActive('Buyer')) names.push("Buyer");
    if (groupingOptions.addColors && !isFilterActive('Color')) names.push("Color");
    if (groupingOptions.addSizes && !isFilterActive('Size')) names.push("Size");
    return names;
  };

  // Prepare data for Excel/PDF export (MODIFIED FOR HIERARCHY)
  const prepareExportData = () => {
    const exportData = [];
    const ratesMap = new Map();
    const groupingFieldNames = getCurrentGroupingFieldNames();
    const numGroupingCols = groupingFieldNames.length;

    // Title Row
    exportData.push(["Daily Defect Trend Analysis", ...Array(uniqueDates.length + numGroupingCols).fill("")]);
    ratesMap.set(`0-0`, -1);

    // Spacer Row
    exportData.push(Array(uniqueDates.length + numGroupingCols + 1).fill(""));
    ratesMap.set(`1-0`, -1);

    // Header Row
    const headerRow = [...groupingFieldNames, "Defect / Group", ...uniqueDates];
    exportData.push(headerRow);
    headerRow.forEach((_, colIndex) => ratesMap.set(`2-${colIndex}`, -1));

    // Data Rows
    let rowIndex = 3;
    let lastDisplayedGroupValues = Array(numGroupingCols).fill(null); 

    rows.forEach((row) => {
      const rowData = [];
      const isGroupRow = row.type === "group";

      // Grouping Columns 
      for (let colIndex = 0; colIndex < numGroupingCols; colIndex++) {
        const currentValue = row.groupValues[colIndex];
        let displayValue = "";
      
        if (isGroupRow && currentValue !== lastDisplayedGroupValues[colIndex]) {
          displayValue = currentValue;
          lastDisplayedGroupValues[colIndex] = currentValue;
          for (let k = colIndex + 1; k < numGroupingCols; k++) {
            lastDisplayedGroupValues[k] = null;
          }
        } else if (!isGroupRow) {
            
             if (currentValue !== lastDisplayedGroupValues[colIndex]) {
                 
                 lastDisplayedGroupValues[colIndex] = currentValue;
                 for (let k = colIndex + 1; k < numGroupingCols; k++) {
                    lastDisplayedGroupValues[k] = null;
                 }
             }
        }
        rowData.push(displayValue);
      }

      // Defect / Group Label Column
      rowData.push(isGroupRow ? "GROUP TOTAL DHU%" : row.defectName);

      // Date Rate Columns
      uniqueDates.forEach((date, dateIndex) => {
        const rate = row.data[date] || 0;
        rowData.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
        ratesMap.set(`${rowIndex}-${numGroupingCols + 1 + dateIndex}`, rate);
      });

      // Mark non-rate cells
      for (let c = 0; c <= numGroupingCols; c++) {
        ratesMap.set(`${rowIndex}-${c}`, -1);
      }

      exportData.push(rowData);
      rowIndex++;
    });

    // Overall Total Row
    const totalRow = [...Array(numGroupingCols).fill(""), "OVERALL TOTAL DHU%"];
    uniqueDates.forEach((date, dateIndex) => {
        const dateData = rawData.filter(d => formatDateToDDMMYYYY(d.inspectionDate) === date);
        const totalCheckedForDate = dateData.reduce((sum, d) => sum + (d.CheckedQty || 0), 0);
        const totalDefectsForDate = dateData.reduce((sum, d) => sum + (d.totalDefectsQty || 0), 0);
        const rate = totalCheckedForDate > 0 ? (totalDefectsForDate / totalCheckedForDate) * 100 : 0;
        totalRow.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
        ratesMap.set(`${rowIndex}-${numGroupingCols + 1 + dateIndex}`, rate);
    });
    for (let c = 0; c <= numGroupingCols; c++) {
        ratesMap.set(`${rowIndex}-${c}`, -1);
    }
    exportData.push(totalRow);

    return { exportData, ratesMap, numGroupingCols };
  };


  // Download Excel (MODIFIED FOR HIERARCHY STYLING)
  const downloadExcel = () => {
    const { exportData, ratesMap, numGroupingCols } = prepareExportData();
    if (exportData.length <= 3) {
      alert("No data available to export.");
      return;
    }
    const ws = XLSX.utils.aoa_to_sheet(exportData);

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
        const isActualGroupRow = isDataRow && exportData[R][numGroupingCols] === "GROUP TOTAL DHU%";
        const cellHasValue = cell.v !== undefined && cell.v !== ""; 

        let fgColor = "FFFFFF";
        let fontStyle = {};
        let alignment = {
            horizontal: (C <= numGroupingCols) ? "left" : "center",
            vertical: "middle", 
        };

        if (R === 0) { /* Title */ }
        else if (R === 1) { /* Spacer */ }
        else if (isHeaderRow) {
            fgColor = "ADD8E6"; // Light Blue
            fontStyle = { bold: true };
        } else if (isTotalRow) {
            fgColor = "D3D3D3"; // Light Grey
            fontStyle = { bold: true };
            if (rate !== undefined && rate > 0) {
                fgColor = getBackgroundColorHex(rate);
            } else if (rate === 0) {
                 fgColor = "E5E7EB";
            }
        } else if (C < numGroupingCols) { 
            if (isActualGroupRow) {
                
                fgColor = "F3F4F6";
                fontStyle = { bold: cellHasValue }; 
            } else {
                
                fgColor = "FFFFFF";
            }
        } else if (isGroupLabelCol) { 
            fgColor = isActualGroupRow ? "F3F4F6" : "FFFFFF";
            fontStyle = { bold: isActualGroupRow };
            if (!isActualGroupRow) {
                // Indent defect names (Excel doesn't have direct padding, use alignment indent)
                // alignment.indent = 1; // Requires Pro version of SheetJS? Alternative: add spaces?
            }
        } else if (rate !== undefined && rate > 0) { 
            fgColor = getBackgroundColorHex(rate);
        } else if (rate === 0) { 
            fgColor = "E5E7EB";
        }

        cell.s = {
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
          fill: { fgColor: { rgb: fgColor } },
          alignment: alignment,
          font: { ...fontStyle },
        };
      }
    }

    // Set column widths
    const colWidths = [];
    groupingFieldNames.forEach(() => colWidths.push({ wch: 15 }));
    colWidths.push({ wch: 30 });
    uniqueDates.forEach(() => colWidths.push({ wch: 12 }));
    ws['!cols'] = colWidths;

    // Merge title cell
    if (range.e.c > 0) {
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } }];
      if(ws['A1']) {
          ws['A1'].s = ws['A1'].s || {};
          ws['A1'].s.alignment = { horizontal: "center", vertical: "middle" };
          ws['A1'].s.font = { sz: 14, bold: true };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defect Trend");
    XLSX.writeFile(wb, "DailyDefectTrend.xlsx");
  };

  // Download PDF (MODIFIED FOR HIERARCHY STYLING)
  const downloadPDF = () => {
    const { exportData, ratesMap, numGroupingCols } = prepareExportData();
     if (exportData.length <= 3) {
      alert("No data available to export.");
      return;
    }
    const doc = new jsPDF({ orientation: "landscape" });

    const tablePlugin = typeof autoTable === "function" ? autoTable : window.autoTable;
    if (!tablePlugin) {
      console.error("jsPDF-AutoTable plugin not found.");
      alert("PDF export functionality is unavailable. Please check console.");
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
        fillColor: [173, 216, 230],
        textColor: [55, 65, 81],
        fontStyle: "bold",
        halign: 'center',
        valign: 'middle', 
      },
      styles: {
        cellPadding: 1.5,
        fontSize: 7,
        valign: "middle", 
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      columnStyles: {
        ...Array.from({ length: numGroupingCols + 1 }, (_, i) => i).reduce((acc, i) => {
            acc[i] = { halign: 'left' }; 
            return acc;
        }, {}),
        ...uniqueDates.reduce((acc, _, index) => {
          acc[numGroupingCols + 1 + index] = { halign: 'center' }; 
          return acc;
        }, {})
      },
      didParseCell: (data) => {
        const rowIndexInExportData = data.row.index + 3;
        const colIndex = data.column.index;
        const rate = ratesMap.get(`${rowIndexInExportData}-${colIndex}`);
        const cellHasValue = data.cell.raw !== undefined && data.cell.raw !== ""; 

        const isTotalRow = data.row.index === body.length - 1;
        const isGroupLabelCol = colIndex === numGroupingCols;
        const isGroupRow = !isTotalRow && data.row.raw[numGroupingCols] === "GROUP TOTAL DHU%";

        if (data.section === "body") {
            let fillColor = [255, 255, 255];
            let textColor = [55, 65, 81];
            let fontStyle = 'normal';

            if (isTotalRow) {
                fillColor = [211, 211, 211];
                fontStyle = 'bold';
                if (rate !== undefined && rate > 0) {
                    fillColor = getBackgroundColorRGB(rate);
                    textColor = getFontColorRGB(rate);
                } else if (rate === 0) {
                    fillColor = [229, 231, 235];
                }
            } else if (colIndex < numGroupingCols) { 
                if (isGroupRow) {
                    fillColor = [243, 244, 246];
                    fontStyle = cellHasValue ? 'bold' : 'normal';  
                } else {
                    fillColor = [255, 255, 255]; 
                }
            } else if (isGroupLabelCol) { 
                 fillColor = isGroupRow ? [243, 244, 246] : [255, 255, 255];
                 fontStyle = isGroupRow ? 'bold' : 'normal';
                 if (!isGroupRow) {
                    
                    data.cell.styles.cellPadding = { ...data.cell.styles.cellPadding, left: 3 };
                 }
            } else if (rate !== undefined && rate > 0) {
                fillColor = getBackgroundColorRGB(rate);
                textColor = getFontColorRGB(rate);
            } else if (rate === 0) { 
                fillColor = [229, 231, 235];
            }

            data.cell.styles.fillColor = fillColor;
            data.cell.styles.textColor = textColor;
            data.cell.styles.fontStyle = fontStyle;

        } else if (data.section === 'head') {
          data.cell.styles.halign = (colIndex <= numGroupingCols) ? 'left' : 'center';
        }
      },
      didDrawPage: (data) => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Daily Defect Trend Analysis", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
      },
    });

    doc.save("DailyDefectTrend.pdf");
  };


  const handleOptionToggle = (option) => {
    setGroupingOptions((prev) => ({ ...prev, [option]: !prev[option] }));
  };
  const handleAddAll = () => {
    setGroupingOptions({ addLines: true, addMO: true, addBuyer: true, addColors: true, addSizes: true });
  };
  const handleClearAll = () => {
    setGroupingOptions({ addLines: false, addMO: false, addBuyer: false, addColors: false, addSizes: false });
  };

  const summaryStats = { totalCheckedQty: totalChecked, totalDefectsQty: totalDefects, defectRate: overallDhu };

  const tableGroupingHeaders = getCurrentGroupingFieldNames();

  let lastDisplayedGroupValues = Array(tableGroupingHeaders.length).fill(null);
 

  return (
    <div className="p-4 space-y-6">
     
      <QCSunriseFilterPane onFilterChange={handleFilterChange} initialFilters={activeFilters} />

      
      <div className="mb-6">
        
         {loading && <div className="text-center p-4 text-gray-500">Loading summary...</div>}
        {error && <div className="text-center p-4 text-red-500">Error loading summary: {error}</div>}
        {!loading && !error && rawData.length === 0 && !activeFilters.startDate && !activeFilters.endDate && (
           <div className="text-center p-4 text-gray-500 bg-white shadow-md rounded-lg">Please select filters and fetch data.</div>
        )}
        {!loading && !error && rawData.length === 0 && (activeFilters.startDate || activeFilters.endDate) && (
          <div className="text-center p-4 text-gray-500 bg-white shadow-md rounded-lg">No data available for the selected filters.</div>
        )}
        {!loading && !error && rawData.length > 0 && (
          <QCSunriseSummaryCard summaryStats={summaryStats} />
        )}
      </div>

      
      <div className="bg-white shadow-md rounded-lg p-4">
       
        {!loading && !error && (
          <>
            
             <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
              <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">Daily Defect Trend</h2>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-sm font-medium text-gray-600 mr-2">Group by:</span>
                
                {[
                  { label: 'Lines', option: 'addLines', filterKey: 'lineNo' },
                  { label: 'MO', option: 'addMO', filterKey: 'MONo' },
                  { label: 'Buyer', option: 'addBuyer', filterKey: 'Buyer' },
                  { label: 'Colors', option: 'addColors', filterKey: 'Color' },
                  { label: 'Sizes', option: 'addSizes', filterKey: 'Size' },
                ].map(({ label, option, filterKey }) => {
                  const isDisabled = isFilterActive(filterKey);
                  return (
                    <label key={option} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={groupingOptions[option] || isDisabled} 
                        onChange={() => handleOptionToggle(option)}
                        disabled={isDisabled} 
                        className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      />
                      <span className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
                    </label>
                  );
                })}
                
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
                  title="Download as Excel"
                  disabled={rows.length === 0}
                >
                  <FaFileExcel className="mr-1 h-4 w-4" /> Excel
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download as PDF"
                  disabled={rows.length === 0}
                >
                  <FaFilePdf className="mr-1 h-4 w-4" /> PDF
                </button>
              </div>
            </div>
          </>
        )}

         {loading && <div className="text-center p-4 text-gray-500">Loading trend data...</div>}
        {error && <div className="text-center p-4 text-red-500">Error loading trend data: {error}</div>}
        {!loading && !error && rows.length === 0 && rawData.length > 0 && (
             <div className="text-center p-4 text-gray-500">No trend data to display based on current grouping. Try adjusting 'Group by' options.</div>
        )}
         {!loading && !error && rows.length === 0 && rawData.length === 0 && (activeFilters.startDate || activeFilters.endDate) && (
             <div className="text-center p-4 text-gray-500">No data found for the selected filters.</div>
        )}

        
        {!loading && !error && rows.length > 0 && (
          <div className="overflow-x-auto border border-gray-300 rounded-md" style={{ maxHeight: "60vh" }}>
            <table className="min-w-full border-collapse align-middle text-xs"> 
              <thead className="bg-gray-100 sticky top-0 z-10">
                 
                 <tr>
                  
                  {tableGroupingHeaders.map((header, index) => (
                    <th
                      key={header}
                      className="py-2 px-3 border-b border-r border-gray-300 text-left font-semibold text-gray-700 sticky bg-gray-100 z-20 whitespace-nowrap align-middle" 
                      style={{ left: `${index * 100}px`, minWidth: '100px' }}
                    >
                      {header}
                    </th>
                  ))}
                  
                  <th
                    className="py-2 px-3 border-b border-r border-gray-300 text-left font-semibold text-gray-700 sticky bg-gray-100 z-20 whitespace-nowrap align-middle" 
                    style={{ left: `${tableGroupingHeaders.length * 100}px`, minWidth: '150px' }} 
                  >
                    Defect / Group
                  </th>
                  
                  {uniqueDates.map((date) => (
                    <th
                      key={date}
                      className="py-2 px-3 border-b border-r border-gray-300 text-center font-semibold text-gray-700 whitespace-nowrap align-middle" 
                      style={{ minWidth: '80px'}} 
                    >
                      {date}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {rows.map((row) => {
                  const isGroupRow = row.type === "group";
                  const rowCells = []; 

                  for (let colIndex = 0; colIndex < tableGroupingHeaders.length; colIndex++) {
                    const currentValue = row.groupValues[colIndex]; 
                    let displayValue = "";
                    let shouldDisplay = false;
                    let isSticky = false;

                    if (currentValue !== lastDisplayedGroupValues[colIndex]) {

                       if (isGroupRow) {
                           displayValue = currentValue;
                           shouldDisplay = true; 
                           isSticky = true; 
                       }
                       
                       lastDisplayedGroupValues[colIndex] = currentValue;
                       
                       for (let k = colIndex + 1; k < lastDisplayedGroupValues.length; k++) {
                           lastDisplayedGroupValues[k] = null; 
                       }
                    } else {
                        
                        displayValue = "";
                        shouldDisplay = false;
                        isSticky = false; 
                    }

                    const cellClasses = `py-1.5 px-3 border-b border-r border-gray-300 whitespace-nowrap align-middle ${ 
                      isGroupRow ? "bg-gray-50" : "bg-white" 
                    } ${
                      shouldDisplay ? "font-medium text-gray-800" : "text-gray-600" 
                    } ${
                      isSticky ? "sticky z-10" : "" 
                    }`;

                    rowCells.push(
                      <td
                        key={`group-${row.key}-${colIndex}`}
                        className={cellClasses}
                        style={{ left: `${colIndex * 100}px`, minWidth: "100px" }}
                      >
                        {displayValue}
                      </td>
                    );
                  } 

                   const defectGroupLabelSticky = isGroupRow; 
                   rowCells.push(
                     <td
                       key={`label-${row.key}`}
                       className={`py-1.5 px-3 border-b border-r border-gray-300 whitespace-nowrap align-middle ${ 
                         isGroupRow
                           ? "font-bold text-gray-900 bg-gray-50"
                           : "text-gray-700 bg-white pl-6" 
                       } ${
                           defectGroupLabelSticky ? "sticky z-10" : "" 
                       }`}
                       style={{ left: `${tableGroupingHeaders.length * 100}px`, minWidth: '150px' }}
                     >
                       {isGroupRow ? "GROUP TOTAL DHU%" : row.defectName}
                     </td>
                   );

                  uniqueDates.forEach((date) => {
                    const rate = row.data[date] || 0;
                    const displayValue = rate > 0 ? `${rate.toFixed(2)}%` : "";
                    rowCells.push(
                      <td
                        key={`${row.key}-date-${date}`}
                        className={`py-1.5 px-3 border-b border-r border-gray-300 text-center align-middle ${ 
                            rate > 0 ? getBackgroundColor(rate) : (isGroupRow ? "bg-gray-150" : "bg-white")
                        } ${
                            rate > 0 ? getFontColor(rate) : "text-gray-500"
                        }`}
                        title={displayValue || "0.00%"}
                        style={{ minWidth: '80px'}}
                      >
                        {displayValue}
                      </td>
                    );
                  });

                  return (
                    <tr
                      key={row.key}
                      className={isGroupRow ? "hover:bg-gray-100" : "hover:bg-gray-50"} 
                    >
                      {rowCells}
                    </tr>
                  );
                })}
                 <tr className="bg-gray-200 font-semibold text-gray-800 sticky bottom-0 z-10">
                 
                  {tableGroupingHeaders.map((_, index) => (
                    <td
                      key={`total-group-${index}`}
                      className="py-2 px-3 border-b border-r border-t border-gray-400 sticky bg-gray-200 z-20 align-middle" 
                      style={{ left: `${index * 100}px`, minWidth: '100px' }}
                    ></td>
                  ))}
                 
                  <td
                    className="py-2 px-3 border-b border-r border-t border-gray-400 sticky bg-gray-200 z-20 font-bold align-middle" 
                    style={{ left: `${tableGroupingHeaders.length * 100}px`, minWidth: '150px' }}
                  >
                    OVERALL TOTAL DHU%
                  </td>
                 
                  {uniqueDates.map((date) => {
                    
                    const dateData = rawData.filter(
                      (d) => formatDateToDDMMYYYY(d.inspectionDate) === date
                    );
                    const totalCheckedForDate = dateData.reduce(
                      (sum, d) => sum + (d.CheckedQty || 0), 0
                    );
                    const totalDefectsForDate = dateData.reduce(
                      (sum, d) => sum + (d.totalDefectsQty || 0), 0
                    );
                    const rate = totalCheckedForDate > 0 ? (totalDefectsForDate / totalCheckedForDate) * 100 : 0;
                    const displayValue = rate > 0 ? `${rate.toFixed(2)}%` : "";
                    return (
                      <td
                        key={`total-date-${date}`}
                        className={`py-2 px-3 border-b border-r border-t border-gray-400 text-center font-bold align-middle ${ 
                            rate > 0 ? getBackgroundColor(rate) : "bg-gray-200"
                        } ${
                            rate > 0 ? getFontColor(rate) : "text-gray-800"
                        }`}
                         style={{ minWidth: '80px'}}
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
