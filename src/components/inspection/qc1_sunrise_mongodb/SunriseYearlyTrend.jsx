import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import QCSunriseFilterPane from "./QCSunriseFilterPane"; 
import QCSunriseSummaryCard from "./QCSunriseSummaryCard"; 


const formatDateToYYYY = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  return parts[0]; 
};


const parseYYYY = (yyyy) => {
  if (!yyyy || yyyy.length !== 4) return null;
  return new Date(parseInt(yyyy), 0, 1); 
};

// Default date range 
const getDefaultEndDate = () => new Date().toISOString().split("T")[0];
const getDefaultStartDate = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 5); 
    today.setMonth(0);
    today.setDate(1); 
    return today.toISOString().split("T")[0];
};



const SunriseYearlyTrend = () => {
  
  const [rawData, setRawData] = useState([]);
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
  const [groupingOptions, setGroupingOptions] = useState({
    addLines: true,
    addMO: true,
    addBuyer: true,
    addColors: true,
    addSizes: true,
  });
  const [rows, setRows] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]); 
  const [totalChecked, setTotalChecked] = useState(0);
  const [totalDefects, setTotalDefects] = useState(0);
  const [overallDhu, setOverallDhu] = useState(0);

  const handleFilterChange = useCallback((newFilters) => {
    setActiveFilters(newFilters);
  }, []);

  const isFilterActive = (filterName) => (activeFilters[filterName] ?? "").trim() !== "";

  const fetchData = useCallback(async () => {
    
    try {
      setLoading(true);
      setError(null);
      setRawData([]);
      setRows([]);
      setUniqueYears([]);
      setTotalChecked(0);
      setTotalDefects(0);
      setOverallDhu(0);

      const queryParams = { ...activeFilters };
      Object.keys(queryParams).forEach(key => { if (!queryParams[key]) delete queryParams[key]; });
      if (!queryParams.startDate) queryParams.startDate = getDefaultStartDate();
      if (!queryParams.endDate) queryParams.endDate = getDefaultEndDate();

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `${API_BASE_URL}/api/sunrise/qc1-data?${queryString}`;

      const response = await axios.get(url);
      setRawData(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Fetch error (yearly):", err);
      setError(err.message || "Failed to fetch QC1 Sunrise data");
      setRawData([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  useEffect(() => {
    if (loading || error || !Array.isArray(rawData) || rawData.length === 0) {
      setTotalChecked(0); setTotalDefects(0); setOverallDhu(0); return;
    }
    let checked = 0; let defects = 0;
    rawData.forEach(item => { checked += item.CheckedQty || 0; defects += item.totalDefectsQty || 0; });
    const dhu = checked > 0 ? parseFloat(((defects / checked) * 100).toFixed(2)) : 0;
    setTotalChecked(checked); setTotalDefects(defects); setOverallDhu(dhu);
  }, [rawData, loading, error]);


  useEffect(() => {
    if (loading || error || !Array.isArray(rawData) || rawData.length === 0) {
      setRows([]); setUniqueYears([]); return;
    }

    // 1. Determine Grouping Fields (Identical logic)
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

    // 2. Extract unique YEARS and sort them
    const yearsSet = new Set(
      rawData.map((d) => formatDateToYYYY(d.inspectionDate)).filter(Boolean) 
    );
    const sortedYears = [...yearsSet].sort((a, b) => {
      const dateA = parseYYYY(a);
      const dateB = parseYYYY(b);
      if (!dateA || !dateB) return 0;
      return dateA - dateB; 
    });
    setUniqueYears(sortedYears);

    // 3. Build hierarchical data structure (Adapted for Years)
    const hierarchy = buildHierarchyYearly(rawData, activeGroupingFields); 

    // 4. Build table rows from the hierarchy (Adapted for Years)
    const tableRows = buildRowsYearly(hierarchy, activeGroupingFields, sortedYears); 
    setRows(tableRows);

  }, [rawData, groupingOptions, loading, error, activeFilters]);

  const buildHierarchyYearly = (data, groupingFields) => {
    const hierarchy = {};
    const normalizeString = (str) => (str ? String(str).trim() : "N/A");

    data.forEach((doc) => {
      const groupKey = groupingFields.map(field => normalizeString(doc[field])).join('|');

      if (!hierarchy[groupKey]) {
        hierarchy[groupKey] = {
          groupValues: groupingFields.map(field => normalizeString(doc[field])),
          yearMap: {}, 
        };
      }

      const formattedYear = formatDateToYYYY(doc.inspectionDate); 
      if (!formattedYear) return; 


      if (!hierarchy[groupKey].yearMap[formattedYear]) {
        hierarchy[groupKey].yearMap[formattedYear] = {
          CheckedQty: doc.CheckedQty || 0,
          totalDefectsQty: doc.totalDefectsQty || 0,
          DefectArray: Array.isArray(doc.DefectArray) ? doc.DefectArray.map(def => ({ ...def })) : [],
        };
      } else {
       
        const yearEntry = hierarchy[groupKey].yearMap[formattedYear];
        yearEntry.CheckedQty += (doc.CheckedQty || 0);
        yearEntry.totalDefectsQty += (doc.totalDefectsQty || 0);

        const existingDefects = yearEntry.DefectArray || [];
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
        yearEntry.DefectArray = existingDefects;
      }
    });
    return hierarchy;
  };

 
  const buildRowsYearly = (hierarchy, groupingFields, years) => {
    const rows = [];
    const sortedGroupKeys = Object.keys(hierarchy).sort((a, b) => {
       
        const aValues = hierarchy[a].groupValues; const bValues = hierarchy[b].groupValues;
        for (let i = 0; i < Math.min(aValues.length, bValues.length); i++) {
            const comparison = String(aValues[i]).localeCompare(String(bValues[i]));
            if (comparison !== 0) return comparison;
        }
        return aValues.length - bValues.length;
    });

    sortedGroupKeys.forEach(groupKey => {
      const group = hierarchy[groupKey];
      const groupData = {}; 

      years.forEach(year => {
        const yearEntry = group.yearMap[year]; 
        const checkedQty = yearEntry?.CheckedQty || 0;
        const defectsQty = yearEntry?.totalDefectsQty || 0;
        groupData[year] = checkedQty > 0 ? (defectsQty / checkedQty) * 100 : 0;
      });

 
      rows.push({ type: "group", key: groupKey + "-group", groupValues: group.groupValues, data: groupData });

    
      const defectNames = new Set();
      Object.values(group.yearMap).forEach(yearEntry => { 
        if (yearEntry && Array.isArray(yearEntry.DefectArray)) {
          yearEntry.DefectArray.forEach(defect => { if (defect && defect.defectName) defectNames.add(defect.defectName); });
        }
      });

      [...defectNames].sort().forEach(defectName => {
        const defectData = {}; 
        years.forEach(year => {
          const yearEntry = group.yearMap[year]; 
          if (yearEntry && Array.isArray(yearEntry.DefectArray)) {
            const defect = yearEntry.DefectArray.find(d => d.defectName === defectName);
            const checkedQty = yearEntry.CheckedQty || 0;
            defectData[year] = defect && checkedQty > 0 ? ((defect.defectQty || 0) / checkedQty) * 100 : 0;
          } else { defectData[year] = 0; }
        });
        rows.push({ type: "defect", key: groupKey + "-" + defectName, groupValues: group.groupValues, defectName: defectName, data: defectData });
      });
    });
    return rows;
  };

  // --- Color Coding Functions (Identical) ---
  const getBackgroundColor = (rate) => { if (rate > 3) return "bg-red-100"; if (rate >= 2) return "bg-yellow-100"; return "bg-green-100"; };
  const getFontColor = (rate) => { if (rate > 3) return "text-red-800"; if (rate >= 2) return "text-orange-800"; return "text-green-800"; };
  const getBackgroundColorRGB = (rate) => { if (rate > 3) return [254, 226, 226]; if (rate >= 2) return [254, 243, 199]; return [220, 252, 231]; };
  const getFontColorRGB = (rate) => { if (rate > 3) return [153, 27, 27]; if (rate >= 2) return [154, 52, 18]; return [6, 95, 70]; };
  const getBackgroundColorHex = (rate) => { if (rate > 3) return "FEE2E2"; if (rate >= 2) return "FEF3C7"; return "DCFCE7"; };


  const getCurrentGroupingFieldNames = () => {
    // Identical logic
    const names = [];
    if (groupingOptions.addLines && !isFilterActive('lineNo')) names.push("Line");
    if (groupingOptions.addMO && !isFilterActive('MONo')) names.push("MO");
    if (groupingOptions.addBuyer && !isFilterActive('Buyer')) names.push("Buyer");
    if (groupingOptions.addColors && !isFilterActive('Color')) names.push("Color");
    if (groupingOptions.addSizes && !isFilterActive('Size')) names.push("Size");
    return names;
  };

  const prepareExportData = () => {

    const exportData = []; const ratesMap = new Map();
    const groupingFieldNames = getCurrentGroupingFieldNames();
    const numGroupingCols = groupingFieldNames.length;
  

    exportData.push(["Yearly Defect Trend Analysis", ...Array(uniqueYears.length + numGroupingCols).fill("")]);
    ratesMap.set(`0-0`, -1);
    exportData.push(Array(uniqueYears.length + numGroupingCols + 1).fill(""));
    ratesMap.set(`1-0`, -1);

    const headerRow = [...groupingFieldNames, "Defect / Group", ...uniqueYears]; 
    exportData.push(headerRow);
    headerRow.forEach((_, colIndex) => ratesMap.set(`2-${colIndex}`, -1));

    let rowIndex = 3; let lastDisplayedGroupValues = Array(numGroupingCols).fill(null);

    rows.forEach((row) => {
      const rowData = []; const isGroupRow = row.type === "group";
      // Grouping Columns 
      for (let colIndex = 0; colIndex < numGroupingCols; colIndex++) {
        const currentValue = row.groupValues[colIndex]; let displayValue = "";
        if (isGroupRow && currentValue !== lastDisplayedGroupValues[colIndex]) {
          displayValue = currentValue; lastDisplayedGroupValues[colIndex] = currentValue;
          for (let k = colIndex + 1; k < numGroupingCols; k++) lastDisplayedGroupValues[k] = null;
        } else if (!isGroupRow && currentValue !== lastDisplayedGroupValues[colIndex]) {
             lastDisplayedGroupValues[colIndex] = currentValue;
             for (let k = colIndex + 1; k < numGroupingCols; k++) lastDisplayedGroupValues[k] = null;
        }
        rowData.push(displayValue);
      }
      rowData.push(isGroupRow ? "GROUP TOTAL DHU%" : row.defectName);
      // Year Rate Columns
      uniqueYears.forEach((year, yearIndex) => {
        const rate = row.data[year] || 0;
        rowData.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
        ratesMap.set(`${rowIndex}-${numGroupingCols + 1 + yearIndex}`, rate);
      });
      for (let c = 0; c <= numGroupingCols; c++) ratesMap.set(`${rowIndex}-${c}`, -1);
      exportData.push(rowData); rowIndex++;
    });

  
    const totalRow = [...Array(numGroupingCols).fill(""), "OVERALL TOTAL DHU%"];
    uniqueYears.forEach((year, yearIndex) =>{
        const yearData = rawData.filter(d => formatDateToYYYY(d.inspectionDate) === year);
        const totalCheckedForYear = yearData.reduce((sum, d) => sum + (d.CheckedQty || 0), 0);
        const totalDefectsForYear = yearData.reduce((sum, d) => sum + (d.totalDefectsQty || 0), 0);
        const rate = totalCheckedForYear > 0 ? (totalDefectsForYear / totalCheckedForYear) * 100 : 0;
        totalRow.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
        ratesMap.set(`${rowIndex}-${numGroupingCols + 1 + yearIndex}`, rate);
    });
    for (let c = 0; c <= numGroupingCols; c++) ratesMap.set(`${rowIndex}-${c}`, -1);
    exportData.push(totalRow);

    return { exportData, ratesMap, numGroupingCols };
  };

  const downloadExcel = () => {
  
    const { exportData, ratesMap, numGroupingCols } = prepareExportData();
    if (exportData.length <= 3) { alert("No data available to export."); return; }
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const range = XLSX.utils.decode_range(ws["!ref"]);
 
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C }); const cell = ws[cellAddress]; if (!cell) continue;
        const rate = ratesMap.get(`${R}-${C}`); const isHeaderRow = R === 2; const isTotalRow = R === range.e.r; const isGroupLabelCol = C === numGroupingCols; const isDataRow = R > 2 && R < range.e.r; const isActualGroupRow = isDataRow && exportData[R][numGroupingCols] === "GROUP TOTAL DHU%"; const cellHasValue = cell.v !== undefined && cell.v !== "";
        let fgColor = "FFFFFF"; let fontStyle = {}; let alignment = { horizontal: (C <= numGroupingCols) ? "left" : "center", vertical: "middle" };
        if (R === 0) {} else if (R === 1) {} else if (isHeaderRow) { fgColor = "ADD8E6"; fontStyle = { bold: true }; }
        else if (isTotalRow) { fgColor = "D3D3D3"; fontStyle = { bold: true }; if (rate !== undefined && rate > 0) fgColor = getBackgroundColorHex(rate); else if (rate === 0) fgColor = "E5E7EB"; }
        else if (C < numGroupingCols) { fgColor = isActualGroupRow ? "F3F4F6" : "FFFFFF"; fontStyle = { bold: isActualGroupRow && cellHasValue }; }
        else if (isGroupLabelCol) { fgColor = isActualGroupRow ? "F3F4F6" : "FFFFFF"; fontStyle = { bold: isActualGroupRow }; }
        else if (rate !== undefined && rate > 0) { fgColor = getBackgroundColorHex(rate); } else if (rate === 0) { fgColor = "E5E7EB"; }
        cell.s = { border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }, fill: { fgColor: { rgb: fgColor } }, alignment: alignment, font: { ...fontStyle }, };
      }
    }
  
    const colWidths = []; groupingFieldNames.forEach(() => colWidths.push({ wch: 15 })); colWidths.push({ wch: 30 }); uniqueYears.forEach(() => colWidths.push({ wch: 12 })); 
    ws['!cols'] = colWidths;
    if (range.e.c > 0) { ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } }]; if(ws['A1']) { ws['A1'].s = ws['A1'].s || {}; ws['A1'].s.alignment = { horizontal: "center", vertical: "middle" }; ws['A1'].s.font = { sz: 14, bold: true }; } }
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Yearly Defect Trend"); XLSX.writeFile(wb, "YearlyDefectTrend.xlsx");
  };

  const downloadPDF = () => {

    const { exportData, ratesMap, numGroupingCols } = prepareExportData();
    if (exportData.length <= 3) { alert("No data available to export."); return; }
    const doc = new jsPDF({ orientation: "landscape" }); const tablePlugin = typeof autoTable === "function" ? autoTable : window.autoTable; if (!tablePlugin) {  alert("PDF export unavailable."); return; }
    const head = [exportData[2]]; const body = exportData.slice(3);
    tablePlugin(doc, {
      head: head, body: body, startY: 20, theme: "grid",
      headStyles: { fillColor: [173, 216, 230], textColor: [55, 65, 81], fontStyle: "bold", halign: 'center' },
      styles: { cellPadding: 1.5, fontSize: 7, valign: "middle", lineColor: [0, 0, 0], lineWidth: 0.1 },
      columnStyles: { ...Array.from({ length: numGroupingCols + 1 }, (_, i) => i).reduce((acc, i) => { acc[i] = { halign: 'left' }; return acc; }, {}), ...uniqueYears.reduce((acc, _, index) => { acc[numGroupingCols + 1 + index] = { halign: 'center' }; return acc; }, {}) },
      didParseCell: (data) => {
       
        const rowIndexInExportData = data.row.index + 3; const colIndex = data.column.index; const rate = ratesMap.get(`${rowIndexInExportData}-${colIndex}`); const cellHasValue = data.cell.raw !== undefined && data.cell.raw !== ""; const isTotalRow = data.row.index === body.length - 1; const isGroupLabelCol = colIndex === numGroupingCols; const isGroupRow = !isTotalRow && data.row.raw[numGroupingCols] === "GROUP TOTAL DHU%";
        if (data.section === "body") {
            let fillColor = [255, 255, 255]; let textColor = [55, 65, 81]; let fontStyle = 'normal';
            if (isTotalRow) { fillColor = [211, 211, 211]; fontStyle = 'bold'; if (rate !== undefined && rate > 0) { fillColor = getBackgroundColorRGB(rate); textColor = getFontColorRGB(rate); } else if (rate === 0) { fillColor = [229, 231, 235]; } }
            else if (colIndex < numGroupingCols) { fillColor = isGroupRow ? [243, 244, 246] : [255, 255, 255]; fontStyle = (isGroupRow && cellHasValue) ? 'bold' : 'normal'; }
            else if (isGroupLabelCol) { fillColor = isGroupRow ? [243, 244, 246] : [255, 255, 255]; fontStyle = isGroupRow ? 'bold' : 'normal'; if (!isGroupRow) data.cell.styles.cellPadding = { ...data.cell.styles.cellPadding, left: 3 }; }
            else if (rate !== undefined && rate > 0) { fillColor = getBackgroundColorRGB(rate); textColor = getFontColorRGB(rate); } else if (rate === 0) { fillColor = [229, 231, 235]; }
            data.cell.styles.fillColor = fillColor; data.cell.styles.textColor = textColor; data.cell.styles.fontStyle = fontStyle;
        } else if (data.section === 'head') { data.cell.styles.halign = (colIndex <= numGroupingCols) ? 'left' : 'center'; }
      },
      didDrawPage: (data) => { doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text("Yearly Defect Trend Analysis", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' }); },
    });
    doc.save("YearlyDefectTrend.pdf");
  };


  const handleOptionToggle = (option) => { setGroupingOptions((prev) => ({ ...prev, [option]: !prev[option] })); };
  const handleAddAll = () => { setGroupingOptions({ addLines: true, addMO: true, addBuyer: true, addColors: true, addSizes: true }); };
  const handleClearAll = () => { setGroupingOptions({ addLines: false, addMO: false, addBuyer: false, addColors: false, addSizes: false }); };
  
  const summaryStats = { totalCheckedQty: totalChecked, totalDefectsQty: totalDefects, defectRate: overallDhu };
  const tableGroupingHeaders = getCurrentGroupingFieldNames();
  let lastDisplayedGroupValues = Array(tableGroupingHeaders.length).fill(null); 



  return (
    <div className="p-4 space-y-6">
   
      <QCSunriseFilterPane onFilterChange={handleFilterChange} initialFilters={activeFilters} />

   
      <div className="mb-6">
        {loading && <div className="text-center p-4 text-gray-500">Loading summary...</div>}
        {error && <div className="text-center p-4 text-red-500">Error loading summary: {error}</div>}
        {!loading && !error && rawData.length === 0 && !activeFilters.startDate && !activeFilters.endDate && ( <div className="text-center p-4 text-gray-500 bg-white shadow-md rounded-lg">Please select filters and fetch data.</div> )}
        {!loading && !error && rawData.length === 0 && (activeFilters.startDate || activeFilters.endDate) && ( <div className="text-center p-4 text-gray-500 bg-white shadow-md rounded-lg">No data available for the selected filters.</div> )}
        {!loading && !error && rawData.length > 0 && ( <QCSunriseSummaryCard summaryStats={summaryStats} /> )}
      </div>

    
      <div className="bg-white shadow-md rounded-lg p-4">
 
        {!loading && !error && (
          <>
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
              <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">Yearly Defect Trend</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                 <span className="text-sm font-medium text-gray-600 mr-2">Group by:</span>
                 {[ { label: 'Lines', option: 'addLines', filterKey: 'lineNo' }, { label: 'MO', option: 'addMO', filterKey: 'MONo' }, { label: 'Buyer', option: 'addBuyer', filterKey: 'Buyer' }, { label: 'Colors', option: 'addColors', filterKey: 'Color' }, { label: 'Sizes', option: 'addSizes', filterKey: 'Size' }, ].map(({ label, option, filterKey }) => { const isDisabled = isFilterActive(filterKey); return ( <label key={option} className="flex items-center space-x-1 cursor-pointer"> <input type="checkbox" checked={groupingOptions[option] || isDisabled} onChange={() => handleOptionToggle(option)} disabled={isDisabled} className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`} /> <span className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span> </label> ); })}
                 <button onClick={handleAddAll} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1" title="Select all available grouping options">Add All</button>
                 <button onClick={handleClearAll} className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1" title="Clear all grouping options">Clear All</button>
                 <div className="border-l border-gray-300 h-6 mx-2"></div>
                 <button onClick={downloadExcel} className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed" title="Download as Excel" disabled={rows.length === 0}><FaFileExcel className="mr-1 h-4 w-4" /> Excel</button>
                 <button onClick={downloadPDF} className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed" title="Download as PDF" disabled={rows.length === 0}><FaFilePdf className="mr-1 h-4 w-4" /> PDF</button>
              </div>
            </div>
          </>
        )}

   
        {loading && <div className="text-center p-4 text-gray-500">Loading yearly trend data...</div>}
        {error && <div className="text-center p-4 text-red-500">Error loading yearly trend data: {error}</div>}
        {!loading && !error && rows.length === 0 && rawData.length > 0 && ( <div className="text-center p-4 text-gray-500">No yearly trend data to display based on current grouping.</div> )}
        {!loading && !error && rows.length === 0 && rawData.length === 0 && (activeFilters.startDate || activeFilters.endDate) && ( <div className="text-center p-4 text-gray-500">No data found for the selected filters.</div> )}

       
        {!loading && !error && rows.length > 0 && (
          <div className="overflow-x-auto border border-gray-300 rounded-md" style={{ maxHeight: "60vh" }}>
            <table className="min-w-full border-collapse align-middle text-xs">
             
              <thead className="bg-gray-100 sticky top-0 z-10">
                 <tr>
                   {tableGroupingHeaders.map((header, index) => ( <th key={header} className="py-2 px-3 border-b border-r border-gray-300 text-left font-semibold text-gray-700 sticky bg-gray-100 z-20 whitespace-nowrap" style={{ left: `${index * 100}px`, minWidth: '100px' }}>{header}</th> ))}
                   <th className="py-2 px-3 border-b border-r border-gray-300 text-left font-semibold text-gray-700 sticky bg-gray-100 z-20 whitespace-nowrap" style={{ left: `${tableGroupingHeaders.length * 100}px`, minWidth: '150px' }}>Defect / Group</th>
                 
                   {uniqueYears.map((year) => ( <th key={year} className="py-2 px-3 border-b border-r border-gray-300 text-center font-semibold text-gray-700 whitespace-nowrap" style={{ minWidth: '80px'}}> {year} </th> ))}
                 </tr>
              </thead>
       
              <tbody className="bg-white">
                {rows.map((row) => {
                  const isGroupRow = row.type === "group"; const rowCells = [];
                 
                  for (let colIndex = 0; colIndex < tableGroupingHeaders.length; colIndex++) {
                    const currentValue = row.groupValues[colIndex]; let displayValue = ""; let shouldDisplay = false; let isSticky = false;
                    if (currentValue !== lastDisplayedGroupValues[colIndex]) { if (isGroupRow) { displayValue = currentValue; shouldDisplay = true; isSticky = true; } lastDisplayedGroupValues[colIndex] = currentValue; for (let k = colIndex + 1; k < lastDisplayedGroupValues.length; k++) lastDisplayedGroupValues[k] = null; }
                    else { displayValue = ""; shouldDisplay = false; isSticky = false; }
                    const cellClasses = `py-1.5 px-3 border-b border-r border-gray-300 whitespace-nowrap ${isGroupRow ? "bg-gray-50" : "bg-white"} ${shouldDisplay ? "font-medium text-gray-800" : "text-gray-600"} ${isSticky ? "sticky z-10" : ""}`;
                    rowCells.push( <td key={`group-${row.key}-${colIndex}`} className={cellClasses} style={{ left: `${colIndex * 100}px`, minWidth: "100px" }}>{displayValue}</td> );
                  }
                
                  const defectGroupLabelSticky = isGroupRow;
                  rowCells.push( <td key={`label-${row.key}`} className={`py-1.5 px-3 border-b border-r border-gray-300 whitespace-nowrap ${isGroupRow ? "font-bold text-gray-900 bg-gray-50" : "text-gray-700 bg-white pl-6"} ${defectGroupLabelSticky ? "sticky z-10" : ""}`} style={{ left: `${tableGroupingHeaders.length * 100}px`, minWidth: '150px' }}>{isGroupRow ? "GROUP TOTAL DHU%" : row.defectName}</td> );
                 
                  uniqueYears.forEach((year) => { 
                    const rate = row.data[year] || 0; const displayValue = rate > 0 ? `${rate.toFixed(2)}%` : "";
                    rowCells.push( <td key={`${row.key}-year-${year}`} className={`py-1.5 px-3 border-b border-r border-gray-300 text-center ${rate > 0 ? getBackgroundColor(rate) : (isGroupRow ? "bg-gray-50" : "bg-white")} ${rate > 0 ? getFontColor(rate) : "text-gray-500"}`} title={displayValue || "0.00%"} style={{ minWidth: '80px'}}> {displayValue} </td> );
                  });
              
                  return ( <tr key={row.key} className={isGroupRow ? "hover:bg-gray-100" : "hover:bg-gray-50"}>{rowCells}</tr> );
                })}
                
                <tr className="bg-gray-200 font-semibold text-gray-800 sticky bottom-0 z-10">
                  {tableGroupingHeaders.map((_, index) => ( <td key={`total-group-${index}`} className="py-2 px-3 border-b border-r border-t border-gray-400 sticky bg-gray-200 z-20" style={{ left: `${index * 100}px`, minWidth: '100px' }}></td> ))}
                  <td className="py-2 px-3 border-b border-r border-t border-gray-400 sticky bg-gray-200 z-20 font-bold" style={{ left: `${tableGroupingHeaders.length * 100}px`, minWidth: '150px' }}>OVERALL TOTAL DHU%</td>
                  {uniqueYears.map((year) => { 
                    const yearData = rawData.filter(d => formatDateToYYYY(d.inspectionDate) === year);
                    const totalCheckedForYear = yearData.reduce((sum, d) => sum + (d.CheckedQty || 0), 0);
                    const totalDefectsForYear = yearData.reduce((sum, d) => sum + (d.totalDefectsQty || 0), 0);
                    const rate = totalCheckedForYear > 0 ? (totalDefectsForYear / totalCheckedForYear) * 100 : 0;
                    const displayValue = rate > 0 ? `${rate.toFixed(2)}%` : "";
                    return ( <td key={`total-year-${year}`} className={`py-2 px-3 border-b border-r border-t border-gray-400 text-center font-bold ${rate > 0 ? getBackgroundColor(rate) : "bg-gray-200"} ${rate > 0 ? getFontColor(rate) : "text-gray-800"}`} style={{ minWidth: '80px'}} title={displayValue || "0.00%"}> {displayValue} </td> );
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

export default SunriseYearlyTrend;
