import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";

import { API_BASE_URL } from "../../../../config";
import QCSunriseFilterPane from "./QCSunriseFilterPane";
import QCSunriseSummaryCard from "./QCSunriseSummaryCard";

const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("-"))
    return dateStr;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day)))
    return dateStr;
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
};

const parseDDMMYYYY = (dateStr) => {
  if (!dateStr || !dateStr.includes("/")) return null;
  const [day, month, year] = dateStr.split("/").map(Number);
  if (
    isNaN(day) ||
    isNaN(month) ||
    isNaN(year) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  )
    return null;
  return new Date(year, month - 1, day);
};

const getDefaultEndDate = () => new Date().toISOString().split("T")[0];
const getDefaultStartDate = () => {
  const today = new Date();
  today.setDate(today.getDate() - 10);
  return today.toISOString().split("T")[0];
};

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
    addLines: false,
    addMO: false,
    addBuyer: false,
    addColors: false,
    addSizes: false,
  });
  const [rows, setRows] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [totalChecked, setTotalChecked] = useState(0);
  const [totalDefects, setTotalDefects] = useState(0);
  const [overallDhu, setOverallDhu] = useState(0);

  const handleFilterChange = useCallback((newFilters) => {
    const validatedFilters = {
      ...newFilters,
      startDate: newFilters.startDate || getDefaultStartDate(),
      endDate: newFilters.endDate || getDefaultEndDate(),
    };
    setActiveFilters(validatedFilters);
  }, []);

  const isFilterActive = useCallback(
    (filterName) => {
      return (activeFilters[filterName] ?? "").trim() !== "";
    },
    [activeFilters],
  );

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
      Object.keys(queryParams).forEach((key) => {
        if (
          queryParams[key] === "" ||
          queryParams[key] === null ||
          queryParams[key] === undefined
        ) {
          delete queryParams[key];
        }
      });

      if (!queryParams.startDate) queryParams.startDate = getDefaultStartDate();
      if (!queryParams.endDate) queryParams.endDate = getDefaultEndDate();

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `${API_BASE_URL}/api/sunrise/qc1-data?${queryString}`;

      const response = await axios.get(url);
      setRawData(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch QC1 Sunrise data";
      setError(errorMsg);
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
    rawData.forEach((item) => {
      checked += item.CheckedQty || 0;
      defects += item.totalDefectsQty || 0;
    });

    const dhu =
      checked > 0 ? parseFloat(((defects / checked) * 100).toFixed(2)) : 0;
    setTotalChecked(checked);
    setTotalDefects(defects);
    setOverallDhu(dhu);
  }, [rawData, loading, error]);

  const buildHierarchy = useCallback((data, groupingFields) => {
    const hierarchy = {};
    const normalizeString = (str) => (str ? String(str).trim() : "N/A");

    data.forEach((doc) => {
      const groupKey = groupingFields
        .map((field) => normalizeString(doc[field]))
        .join("|");

      if (!hierarchy[groupKey]) {
        hierarchy[groupKey] = {
          groupValues: groupingFields.map((field) =>
            normalizeString(doc[field]),
          ),
          dateMap: {},
        };
      }

      const formattedDate = formatDateToDDMMYYYY(doc.inspectionDate);
      if (!formattedDate) return;

      if (!hierarchy[groupKey].dateMap[formattedDate]) {
        hierarchy[groupKey].dateMap[formattedDate] = {
          CheckedQty: doc.CheckedQty || 0,
          totalDefectsQty: doc.totalDefectsQty || 0,
          DefectArray: Array.isArray(doc.DefectArray)
            ? doc.DefectArray.map((def) => ({
                ...def,
                defectQty: def.defectQty || 0,
              }))
            : [],
        };
      } else {
        const dateEntry = hierarchy[groupKey].dateMap[formattedDate];
        dateEntry.CheckedQty += doc.CheckedQty || 0;
        dateEntry.totalDefectsQty += doc.totalDefectsQty || 0;

        const existingDefects = dateEntry.DefectArray || [];
        const newDefects = Array.isArray(doc.DefectArray) ? doc.DefectArray : [];

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
        dateEntry.DefectArray = existingDefects;
      }
    });

    return hierarchy;
  }, []);

  const buildRows = useCallback((hierarchy, groupingFields, dates) => {
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

    sortedGroupKeys.forEach((groupKey) => {
      const group = hierarchy[groupKey];
      const groupData = {};

      dates.forEach((date) => {
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
      Object.values(group.dateMap).forEach((dateEntry) => {
        if (dateEntry && Array.isArray(dateEntry.DefectArray)) {
          dateEntry.DefectArray.forEach((defect) => {
            if (defect && defect.defectName) defectNames.add(defect.defectName);
          });
        }
      });

      [...defectNames].sort().forEach((defectName) => {
        const defectData = {};
        dates.forEach((date) => {
          const dateEntry = group.dateMap[date];
          if (dateEntry && Array.isArray(dateEntry.DefectArray)) {
            const defect = dateEntry.DefectArray.find(
              (d) => d.defectName === defectName,
            );
            const checkedQty = dateEntry.CheckedQty || 0;
            defectData[date] =
              defect && checkedQty > 0
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
  }, []);

  useEffect(() => {
    if (loading || error || !Array.isArray(rawData) || rawData.length === 0) {
      setRows([]);
      setUniqueDates([]);
      return;
    }

    const groupingFieldsConfig = [
      { key: "lineNo", option: "addLines" },
      { key: "MONo", option: "addMO" },
      { key: "Buyer", option: "addBuyer" },
      { key: "Color", option: "addColors" },
      { key: "Size", option: "addSizes" },
    ];

    const activeGroupingFields = groupingFieldsConfig
      .filter((field) => groupingOptions[field.option])
      .map((field) => field.key);

    const datesSet = new Set(
      rawData.map((d) => formatDateToDDMMYYYY(d.inspectionDate)).filter(Boolean),
    );
    const sortedDates = [...datesSet].sort((a, b) => {
      const dateA = parseDDMMYYYY(a);
      const dateB = parseDDMMYYYY(b);
      if (!dateA || !dateB) return 0;
      return dateA - dateB;
    });
    setUniqueDates(sortedDates);

    const hierarchy = buildHierarchy(rawData, activeGroupingFields);
    const tableRows = buildRows(hierarchy, activeGroupingFields, sortedDates);
    setRows(tableRows);
  }, [rawData, groupingOptions, loading, error, buildHierarchy, buildRows]);

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

  const getCurrentGroupingFieldNames = useCallback(() => {
    const names = [];
    if (groupingOptions.addLines) names.push("Line");
    if (groupingOptions.addMO) names.push("MO");
    if (groupingOptions.addBuyer) names.push("Buyer");
    if (groupingOptions.addColors) names.push("Color");
    if (groupingOptions.addSizes) names.push("Size");
    return names;
  }, [groupingOptions]);

  const prepareExportData = useCallback(() => {
    const exportData = [];
    const ratesMap = new Map();
    const groupingFieldNames = getCurrentGroupingFieldNames();
    const numGroupingCols = groupingFieldNames.length;

    exportData.push([
      "Daily Defect Trend Analysis",
      ...Array(uniqueDates.length + numGroupingCols).fill(""),
    ]);
    ratesMap.set(`0-0`, -1);

    exportData.push(Array(uniqueDates.length + numGroupingCols + 1).fill(""));
    ratesMap.set(`1-0`, -1);

    const headerRow = [...groupingFieldNames, "Defect / Group", ...uniqueDates];
    exportData.push(headerRow);
    headerRow.forEach((_, colIndex) => ratesMap.set(`2-${colIndex}`, -1));

    let rowIndex = 3;
    let lastDisplayedGroupValues = Array(numGroupingCols).fill(null);

    rows.forEach((row) => {
      const rowData = [];
      const isGroupRow = row.type === "group";

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

      uniqueDates.forEach((date, dateIndex) => {
        const rate = row.data[date] || 0;
        rowData.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
        ratesMap.set(`${rowIndex}-${numGroupingCols + 1 + dateIndex}`, rate);
      });

      for (let c = 0; c <= numGroupingCols; c++) {
        ratesMap.set(`${rowIndex}-${c}`, -1);
      }

      exportData.push(rowData);
      rowIndex++;
    });

    const totalRow = [...Array(numGroupingCols).fill(""), "OVERALL TOTAL %"];
    uniqueDates.forEach((date, dateIndex) => {
      const dateData = rawData.filter(
        (d) => formatDateToDDMMYYYY(d.inspectionDate) === date,
      );
      const totalCheckedForDate = dateData.reduce(
        (sum, d) => sum + (d.CheckedQty || 0),
        0,
      );
      const totalDefectsForDate = dateData.reduce(
        (sum, d) => sum + (d.totalDefectsQty || 0),
        0,
      );
      const rate =
        totalCheckedForDate > 0
          ? (totalDefectsForDate / totalCheckedForDate) * 100
          : 0;
      totalRow.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
      ratesMap.set(`${rowIndex}-${numGroupingCols + 1 + dateIndex}`, rate);
    });
    for (let c = 0; c <= numGroupingCols; c++) {
      ratesMap.set(`${rowIndex}-${c}`, -1);
    }
    exportData.push(totalRow);

    return { exportData, ratesMap, numGroupingCols };
  }, [rows, uniqueDates, rawData, getCurrentGroupingFieldNames]);

  const downloadExcel = useCallback(() => {
    const { exportData, ratesMap, numGroupingCols } = prepareExportData();
    if (exportData.length <= 3) {
      alert("No data available to export.");
      return;
    }
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const groupingFieldNames = getCurrentGroupingFieldNames();

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

        if (R === 0) {
        } else if (R === 1) {
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

    const colWidths = [];
    groupingFieldNames.forEach(() => colWidths.push({ wch: 15 }));
    colWidths.push({ wch: 30 });
    uniqueDates.forEach(() => colWidths.push({ wch: 12 }));
    ws["!cols"] = colWidths;

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

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defect Trend");
    XLSX.writeFile(wb, "DailyDefectTrend.xlsx");
  }, [prepareExportData, uniqueDates, getCurrentGroupingFieldNames]);

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
        ...uniqueDates.reduce((acc, _, index) => {
          acc[numGroupingCols + 1 + index] = { halign: "center" };
          return acc;
        }, {}),
      },
      didParseCell: (data) => {
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
          "Daily Defect Trend Analysis",
          doc.internal.pageSize.getWidth() / 2,
          15,
          { align: "center" },
        );
      },
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

    doc.save("DailyDefectTrend.pdf");
  }, [prepareExportData, uniqueDates]);

  const handleOptionToggle = useCallback((option) => {
    setGroupingOptions((prev) => ({ ...prev, [option]: !prev[option] }));
  }, []);

  const handleAddAll = useCallback(() => {
    setGroupingOptions({
      addLines: true,
      addMO: true,
      addBuyer: true,
      addColors: true,
      addSizes: true,
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setGroupingOptions({
      addLines: false,
      addMO: false,
      addBuyer: false,
      addColors: false,
      addSizes: false,
    });
  }, []);

  const summaryStats = useMemo(
    () => ({
      totalCheckedQty: totalChecked,
      totalDefectsQty: totalDefects,
      defectRate: overallDhu,
    }),
    [totalChecked, totalDefects, overallDhu],
  );

  const tableGroupingHeaders = useMemo(
    () => getCurrentGroupingFieldNames(),
    [getCurrentGroupingFieldNames],
  );

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

  return (
    <div className="p-4 space-y-6">
      <QCSunriseFilterPane
        onFilterChange={handleFilterChange}
        initialFilters={activeFilters}
      />

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
          rawData.length === 0 &&
          (activeFilters.startDate || activeFilters.endDate) && (
            <div className="text-center p-4 text-gray-500 bg-white shadow-md rounded-lg">
              No data available for the selected filters.
            </div>
          )}
        {!loading && !error && rawData.length > 0 && (
          <QCSunriseSummaryCard summaryStats={summaryStats} />
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg p-4">
        {!loading && !error && (
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
              Daily Defect Trend
            </h2>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-sm font-medium text-gray-600 mr-2">
                Group by:
              </span>

              {[
                { label: "Lines", option: "addLines", filterKey: "lineNo" },
                { label: "MO", option: "addMO", filterKey: "MONo" },
                { label: "Buyer", option: "addBuyer", filterKey: "Buyer" },
                { label: "Colors", option: "addColors", filterKey: "Color" },
                { label: "Sizes", option: "addSizes", filterKey: "Size" },
              ].map(({ label, option, filterKey }) => {
                const isCurrentlyFiltered = isFilterActive(filterKey);
                return (
                  <label
                    key={option}
                    className={`flex items-center space-x-1 cursor-pointer ${
                      isCurrentlyFiltered ? "opacity-75" : ""
                    }`}
                    title={
                      isCurrentlyFiltered
                        ? `${label} is currently filtered. Uncheck to hide column.`
                        : `Group results by ${label}`
                    }
                  >
                    <input
                      type="checkbox"
                      checked={groupingOptions[option] || isCurrentlyFiltered}
                      onChange={() => handleOptionToggle(option)}
                      className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer`}
                    />
                    <span
                      className={`text-sm ${
                        isCurrentlyFiltered ? "text-gray-500" : "text-gray-700"
                      }`}
                    >
                      {label}
                    </span>
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
        )}

        {loading && (
          <div className="text-center p-4 text-gray-500">
            Loading trend data...
          </div>
        )}
        {error && (
          <div className="text-center p-4 text-red-500 bg-red-50 rounded border border-red-200">
            Error loading trend data: {error}
          </div>
        )}
        {!loading && !error && rows.length === 0 && rawData.length > 0 && (
          <div className="text-center p-4 text-gray-500">
            No trend data to display based on current grouping. Try adjusting
            'Group by' options.
          </div>
        )}
        {!loading &&
          !error &&
          rows.length === 0 &&
          rawData.length === 0 &&
          (activeFilters.startDate || activeFilters.endDate) && (
            <div className="text-center p-4 text-gray-500">
              No data found for the selected filters.
            </div>
          )}

        {!loading && !error && rows.length > 0 && (
          <div
            className="overflow-x-auto border border-gray-300 rounded-md"
            style={{ maxHeight: "60vh" }}
          >
            <table className="min-w-full border-collapse align-middle text-xs">
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
                  {uniqueDates.map((date) => (
                    <th
                      key={date}
                      className="py-2 px-3 border-b border-r border-gray-300 text-center font-semibold text-gray-700 whitespace-nowrap align-middle"
                      style={{ minWidth: "80px" }}
                    >
                      {date}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white">
                {rows.map((row, rowIndex) => {
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
                            className="py-1.5 px-3 border-b border-r border-slate-400 whitespace-nowrap align-top font-medium text-gray-800 bg-slate-100 sticky z-10"
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
                        {uniqueDates.map((date) => {
                          const rate = row.data[date] || 0;
                          const displayValue =
                            rate > 0 ? `${rate.toFixed(2)}%` : "";
                          return (
                            <td
                              key={`${row.key}-date-${date}`}
                              className={`py-1.5 px-3 border-b border-r border-slate-600 text-center align-middle font-semibold ${
                                rate > 0
                                  ? getBackgroundColor(rate)
                                  : "bg-slate-500"
                              } ${rate > 0 ? getFontColor(rate) : "text-white"}`}
                              title={displayValue || "0.00%"}
                              style={{ minWidth: "80px" }}
                            >
                              {displayValue}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  } else if (row.type === "defect") {
                    return (
                      <tr key={row.key} className="hover:bg-gray-50">
                        <td
                          key={`label-${row.key}`}
                          className="py-1.5 px-3 border-b border-r border-gray-300 whitespace-nowrap align-middle text-gray-700 bg-white pl-6 sticky z-10"
                          style={{
                            left: `${tableGroupingHeaders.length * 100}px`,
                            minWidth: "150px",
                          }}
                        >
                          {row.defectName}
                        </td>
                        {uniqueDates.map((date) => {
                          const rate = row.data[date] || 0;
                          const displayValue =
                            rate > 0 ? `${rate.toFixed(2)}%` : "";
                          return (
                            <td
                              key={`${row.key}-date-${date}`}
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
                  {uniqueDates.map((date) => {
                    const dateData = rawData.filter(
                      (d) => formatDateToDDMMYYYY(d.inspectionDate) === date,
                    );
                    const totalCheckedForDate = dateData.reduce(
                      (sum, d) => sum + (d.CheckedQty || 0),
                      0,
                    );
                    const totalDefectsForDate = dateData.reduce(
                      (sum, d) => sum + (d.totalDefectsQty || 0),
                      0,
                    );
                    const rate =
                      totalCheckedForDate > 0
                        ? (totalDefectsForDate / totalCheckedForDate) * 100
                        : 0;
                    const displayValue =
                      rate > 0 ? `${rate.toFixed(2)}%` : "";
                    return (
                      <td
                        key={`total-date-${date}`}
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

export default QCSunriseDailyTrend;
