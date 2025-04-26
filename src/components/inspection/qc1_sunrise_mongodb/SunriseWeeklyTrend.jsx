import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import WeeklyFilterPane from "./WeeklyFilterPane";
import QCSunriseSummaryCard from "./QCSunriseSummaryCard";
import {
  format,
  parse,
  isValid,
  startOfWeek,
  endOfWeek,
  subWeeks,
  addDays,
  getISOWeek,
  getISOWeekYear,
  parseISO,
} from "date-fns";

const DATE_FORMAT_API = "yyyy-MM-dd";

const getWeekKey = (dateInput) => {
  let date;
  if (dateInput instanceof Date && isValid(dateInput)) {
    date = dateInput;
  } else if (typeof dateInput === "string") {
    date = parse(dateInput, DATE_FORMAT_API, new Date());
    if (!isValid(date)) date = parseISO(dateInput);
    if (!isValid(date)) date = parse(dateInput, "dd/MM/yyyy", new Date());
  }

  if (!date || !isValid(date)) {
    console.warn(`Could not parse date to get week key: ${dateInput}`);
    return null;
  }

  const year = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
};

const parseWeekKey = (weekKey) => {
  if (!weekKey || !weekKey.includes("-W")) return null;
  try {
    const [yearStr, weekStr] = weekKey.split("-W");
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStr, 10);

    if (isNaN(year) || isNaN(week) || week < 1 || week > 53) return null;

    const jan4 = new Date(year, 0, 4);
    const dayOfWeekJan4 = (jan4.getDay() + 6) % 7;

    const mondayWeek1 = addDays(jan4, -dayOfWeekJan4);

    const mondayTargetWeek = addDays(mondayWeek1, (week - 1) * 7);

    if (getISOWeekYear(mondayTargetWeek) !== year) {
      // console.warn(`Potential year mismatch for week key ${weekKey}. Calculated date: ${mondayTargetWeek}`);
    }

    return mondayTargetWeek;
  } catch (e) {
    console.error(`Error parsing week key ${weekKey}:`, e);
    return null;
  }
};

const formatWeekKeyToDisplay = (weekKey) => {
  const monday = parseWeekKey(weekKey);
  if (!monday || !isValid(monday)) return weekKey;

  const sunday = endOfWeek(monday, { weekStartsOn: 1 });
  const yearShort = format(monday, "yy");
  const weekNum = weekKey.split("-W")[1];

  return `W${weekNum} '${yearShort} (${format(monday, "MMM dd")} - ${format(
    sunday,
    "MMM dd"
  )})`;
};

const getDefaultDates = () => {
  const today = new Date();
  const lastSunday = endOfWeek(today, { weekStartsOn: 1 });
  const fourWeeksAgoMonday = startOfWeek(subWeeks(lastSunday, 3), {
    weekStartsOn: 1,
  });
  return {
    startDate: format(fourWeeksAgoMonday, DATE_FORMAT_API),
    endDate: format(lastSunday, DATE_FORMAT_API),
  };
};

const SunriseWeeklyTrend = () => {
  const [weeklyApiData, setWeeklyApiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    ...getDefaultDates(),
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
  const [uniqueWeeks, setUniqueWeeks] = useState([]);
  const [totalChecked, setTotalChecked] = useState(0);
  const [totalDefects, setTotalDefects] = useState(0);
  const [overallDhu, setOverallDhu] = useState(0);

  const handleFilterChange = useCallback((newFilters) => {
    const validatedFilters = {
      ...newFilters,
      startDate: newFilters.startDate || getDefaultDates().startDate,
      endDate: newFilters.endDate || getDefaultDates().endDate,
    };
    setActiveFilters(validatedFilters);
  }, []);

  const isFilterActive = (filterName) =>
    (activeFilters[filterName] ?? "").trim() !== "";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setWeeklyApiData([]);
      setRows([]);
      setUniqueWeeks([]);
      setTotalChecked(0);
      setTotalDefects(0);
      setOverallDhu(0);

      const queryParams = {
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate,
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

      const url = `${API_BASE_URL}/api/sunrise/qc1-weekly-data?${queryString}`;
      const response = await axios.get(url);

      if (response.data && response.data.length > 0) {
        if (response.data[0].DefectArray === undefined) {
          //   console.warn("Weekly API data might be missing 'DefectArray'. Defect-level breakdown may not work as expected.");
        }

        if (
          !response.data[0].weekKey &&
          !response.data[0].weekStartDate &&
          !response.data[0].inspectionDate
        ) {
          //    console.error("CRITICAL: Weekly API response missing 'weekKey', 'weekStartDate', or 'inspectionDate'. Cannot determine week.");
        }
      }

      setWeeklyApiData(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Fetch error (weekly data):", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch QC1 Sunrise weekly data";
      setError(errorMsg);
      setWeeklyApiData([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (
      loading ||
      error ||
      !Array.isArray(weeklyApiData) ||
      weeklyApiData.length === 0
    ) {
      setTotalChecked(0);
      setTotalDefects(0);
      setOverallDhu(0);
      return;
    }
    let checked = weeklyApiData.reduce(
      (sum, item) => sum + (item.CheckedQty || 0),
      0
    );
    let defects = weeklyApiData.reduce(
      (sum, item) => sum + (item.totalDefectsQty || 0),
      0
    );
    const dhu =
      checked > 0 ? parseFloat(((defects / checked) * 100).toFixed(2)) : 0;
    setTotalChecked(checked);
    setTotalDefects(defects);
    setOverallDhu(dhu);
  }, [weeklyApiData, loading, error]);

  useEffect(() => {
    if (
      loading ||
      error ||
      !Array.isArray(weeklyApiData) ||
      weeklyApiData.length === 0
    ) {
      setRows([]);
      setUniqueWeeks([]);
      return;
    }

    const groupingFieldsConfig = [
      { key: "lineNo", option: "addLines", filterActive: isFilterActive("lineNo") },
      { key: "MONo", option: "addMO", filterActive: isFilterActive("MONo") },
      { key: "Buyer", option: "addBuyer", filterActive: isFilterActive("Buyer") },
      { key: "Color", option: "addColors", filterActive: isFilterActive("Color") },
      { key: "Size", option: "addSizes", filterActive: isFilterActive("Size") },
    ];
    const activeGroupingFields = groupingFieldsConfig
      .filter((field) => groupingOptions[field.option] && !field.filterActive)
      .map((field) => field.key);

    const weeksSet = new Set(
      weeklyApiData
        .map((d) =>
          d.weekKey || getWeekKey(d.inspectionDate || d.weekStartDate)
        )
        .filter(Boolean)
    );
    const sortedWeeks = [...weeksSet].sort((a, b) => {
      const dateA = parseWeekKey(a);
      const dateB = parseWeekKey(b);
      return dateA && dateB ? dateA - dateB : 0;
    });
    setUniqueWeeks(sortedWeeks);

    const hierarchy = buildHierarchyFromWeeklyData(
      weeklyApiData,
      activeGroupingFields
    );

    const tableRows = buildWeeklyRowsFromHierarchy(
      hierarchy,
      activeGroupingFields,
      sortedWeeks
    );
    setRows(tableRows);
  }, [weeklyApiData, groupingOptions, loading, error, activeFilters]);

  const buildHierarchyFromWeeklyData = (data, groupingFields) => {
    const hierarchy = {};
    const normalizeString = (str) => (str ? String(str).trim() : "N/A");

    data.forEach((weeklyRecord) => {
      const groupKey = groupingFields
        .map((field) => normalizeString(weeklyRecord[field]))
        .join("|");

      if (!hierarchy[groupKey]) {
        hierarchy[groupKey] = {
          groupValues: groupingFields.map((field) =>
            normalizeString(weeklyRecord[field])
          ),
          weekMap: {},
        };
      }

      const weekKey =
        weeklyRecord.weekKey ||
        getWeekKey(weeklyRecord.inspectionDate || weeklyRecord.weekStartDate);
      if (!weekKey) return;

      if (!hierarchy[groupKey].weekMap[weekKey]) {
        hierarchy[groupKey].weekMap[weekKey] = {
          CheckedQty: weeklyRecord.CheckedQty || 0,
          totalDefectsQty: weeklyRecord.totalDefectsQty || 0,
          DefectArray: Array.isArray(weeklyRecord.DefectArray)
            ? weeklyRecord.DefectArray.map((def) => ({
                ...def,
                defectQty: def.defectQty || 0,
              }))
            : [],
        };
      } else {
        const weekEntry = hierarchy[groupKey].weekMap[weekKey];
        weekEntry.CheckedQty += weeklyRecord.CheckedQty || 0;
        weekEntry.totalDefectsQty += weeklyRecord.totalDefectsQty || 0;

        const existingDefects = weekEntry.DefectArray || [];
        const newDefects = Array.isArray(weeklyRecord.DefectArray)
          ? weeklyRecord.DefectArray
          : [];
        newDefects.forEach((newDefect) => {
          if (!newDefect || !newDefect.defectName) return;
          const existing = existingDefects.find(
            (d) => d.defectName === newDefect.defectName
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
        weekEntry.DefectArray = existingDefects;
      }
    });

    return hierarchy;
  };

  const buildWeeklyRowsFromHierarchy = (hierarchy, groupingFields, weeks) => {
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

      weeks.forEach((week) => {
        const weekEntry = group.weekMap[week];
        const checkedQty = weekEntry?.CheckedQty || 0;
        const defectsQty = weekEntry?.totalDefectsQty || 0;
        groupData[week] =
          checkedQty > 0
            ? parseFloat(((defectsQty / checkedQty) * 100).toFixed(2))
            : 0;
      });

      rows.push({
        type: "group",
        key: groupKey + "-group",
        groupValues: group.groupValues,
        data: groupData,
      });

      const defectNames = new Set();
      Object.values(group.weekMap).forEach((weekEntry) => {
        if (weekEntry && Array.isArray(weekEntry.DefectArray)) {
          weekEntry.DefectArray.forEach((defect) => {
            if (defect && defect.defectName) defectNames.add(defect.defectName);
          });
        }
      });

      [...defectNames].sort().forEach((defectName) => {
        const defectData = {};
        weeks.forEach((week) => {
          const weekEntry = group.weekMap[week];
          if (weekEntry && Array.isArray(weekEntry.DefectArray)) {
            const defect = weekEntry.DefectArray.find(
              (d) => d.defectName === defectName
            );
            const checkedQty = weekEntry.CheckedQty || 0;
            defectData[week] =
              defect && checkedQty > 0
                ? parseFloat(
                    (((defect.defectQty || 0) / checkedQty) * 100).toFixed(2)
                  )
                : 0;
          } else {
            defectData[week] = 0;
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

  const getCurrentGroupingFieldNames = () => {
    const names = [];
    if (groupingOptions.addLines && !isFilterActive("lineNo")) names.push("Line");
    if (groupingOptions.addMO && !isFilterActive("MONo")) names.push("MO");
    if (groupingOptions.addBuyer && !isFilterActive("Buyer")) names.push("Buyer");
    if (groupingOptions.addColors && !isFilterActive("Color")) names.push("Color");
    if (groupingOptions.addSizes && !isFilterActive("Size")) names.push("Size");
    return names;
  };

  const prepareExportData = () => {
    const exportData = [];
    const ratesMap = new Map();
    const groupingFieldNames = getCurrentGroupingFieldNames();
    const numGroupingCols = groupingFieldNames.length;
    const displayWeeks = uniqueWeeks.map(formatWeekKeyToDisplay);

    exportData.push([
      "Weekly Defect Trend Analysis",
      ...Array(uniqueWeeks.length + numGroupingCols).fill(""),
    ]);
    ratesMap.set(`0-0`, -1);

    exportData.push(Array(uniqueWeeks.length + numGroupingCols + 1).fill(""));
    ratesMap.set(`1-0`, -1);

    const headerRow = [...groupingFieldNames, "Defect / Group", ...displayWeeks];
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
        if (isGroupRow && currentValue !== lastDisplayedGroupValues[colIndex]) {
          displayValue = currentValue;
          lastDisplayedGroupValues[colIndex] = currentValue;
          for (let k = colIndex + 1; k < numGroupingCols; k++)
            lastDisplayedGroupValues[k] = null;
        } else if (!isGroupRow) {
          if (currentValue !== lastDisplayedGroupValues[colIndex]) {
            lastDisplayedGroupValues[colIndex] = currentValue;
            for (let k = colIndex + 1; k < numGroupingCols; k++)
              lastDisplayedGroupValues[k] = null;
          }
        }
        rowData.push(displayValue);
        ratesMap.set(`${rowIndex}-${colIndex}`, -1);
      }

      rowData.push(isGroupRow ? "TOTAL %" : row.defectName);
      ratesMap.set(`${rowIndex}-${numGroupingCols}`, -1);

      uniqueWeeks.forEach((week, weekIndex) => {
        const rate = row.data[week] || 0;
        rowData.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
        ratesMap.set(`${rowIndex}-${numGroupingCols + 1 + weekIndex}`, rate);
      });
      exportData.push(rowData);
      rowIndex++;
    });

    const totalRow = [...Array(numGroupingCols).fill(""), "OVERALL TOTAL %"];
    ratesMap.set(`${rowIndex}-${numGroupingCols}`, -1);
    for (let c = 0; c < numGroupingCols; c++) ratesMap.set(`${rowIndex}-${c}`, -1);
    uniqueWeeks.forEach((week, weekIndex) => {
      const weekData = weeklyApiData.filter(
        (d) =>
          (d.weekKey || getWeekKey(d.inspectionDate || d.weekStartDate)) === week
      );
      const totalCheckedForWeek = weekData.reduce(
        (sum, d) => sum + (d.CheckedQty || 0),
        0
      );
      const totalDefectsForWeek = weekData.reduce(
        (sum, d) => sum + (d.totalDefectsQty || 0),
        0
      );
      const rate =
        totalCheckedForWeek > 0
          ? parseFloat(
              ((totalDefectsForWeek / totalCheckedForWeek) * 100).toFixed(2)
            )
          : 0;
      totalRow.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
      ratesMap.set(`${rowIndex}-${numGroupingCols + 1 + weekIndex}`, rate);
    });
    exportData.push(totalRow);

    return { exportData, ratesMap, numGroupingCols };
  };

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
        const isActualGroupRow =
          isDataRow && exportData[R][numGroupingCols] === "TOTAL %";
        const cellHasValue = cell.v !== undefined && cell.v !== "";
        let fgColor = "FFFFFF";
        let fontStyle = {};
        let alignment = {
          horizontal: C <= numGroupingCols ? "left" : "center",
          vertical: "middle",
        };
        let border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };

        if (R < 2) {
        } else if (isHeaderRow) {
          fgColor = "ADD8E6";
          fontStyle = { bold: true };
        } else if (isTotalRow) {
          fgColor = "D3D3D3";
          fontStyle = { bold: true };
          border = {
            top: { style: "medium" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
          if (rate !== undefined && rate !== -1) {
            if (rate > 0) fgColor = getBackgroundColorHex(rate);
            else fgColor = "E5E7EB";
          }
        } else if (isDataRow) {
          if (isActualGroupRow) {
            fgColor = "F3F4F6";
            fontStyle = { bold: true };
            if (C < numGroupingCols && !cellHasValue)
              fontStyle = { bold: true, color: { rgb: "F3F4F6" } };
          } else {
            fgColor = "FFFFFF";
            fontStyle = {};
            if (C < numGroupingCols) fontStyle = { color: { rgb: "FFFFFF" } };
          }
          if (C > numGroupingCols && rate !== undefined && rate !== -1) {
            if (rate > 0) fgColor = getBackgroundColorHex(rate);
            else fgColor = "E5E7EB";
            fontStyle = {
              ...fontStyle,
              ...(isActualGroupRow ? { bold: true } : {}),
            };
          }
        }
        cell.s = {
          border,
          fill: { fgColor: { rgb: fgColor } },
          alignment,
          font: { ...fontStyle },
        };
      }
    }
    const colWidths = [];
    groupingFieldNames.forEach(() => colWidths.push({ wch: 15 }));
    colWidths.push({ wch: 30 });
    uniqueWeeks.forEach(() => colWidths.push({ wch: 25 }));
    ws["!cols"] = colWidths;
    if (range.e.c >= 0) {
      ws["!merges"] = ws["!merges"] || [];
      ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } });
      if (ws["A1"]) {
        ws["A1"].s = ws["A1"].s || {};
        ws["A1"].s.alignment = { horizontal: "center", vertical: "middle" };
        ws["A1"].s.font = { sz: 14, bold: true };
      }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Weekly Defect Trend");
    XLSX.writeFile(wb, "WeeklyDefectTrend.xlsx");
  };

  const downloadPDF = () => {
    const { exportData, ratesMap, numGroupingCols } = prepareExportData();
    if (exportData.length <= 3) {
      alert("No data available to export.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    const tablePlugin =
      typeof autoTable === "function" ? autoTable : window.autoTable;
    if (!tablePlugin) {
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
        fillColor: [173, 216, 230],
        textColor: [55, 65, 81],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      styles: {
        cellPadding: 1.5,
        fontSize: 6,
        valign: "middle",
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        ...Array.from({ length: numGroupingCols + 1 }, (_, i) => i).reduce(
          (acc, i) => {
            acc[i] = { halign: "left" };
            return acc;
          },
          {}
        ),
        ...uniqueWeeks.reduce((acc, _, index) => {
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
          !isTotalRow && data.row.raw[numGroupingCols] === "TOTAL %";
        data.cell.styles.fillColor = [255, 255, 255];
        data.cell.styles.textColor = [55, 65, 81];
        data.cell.styles.fontStyle = "normal";

        if (data.section === "body") {
          if (isTotalRow) {
            data.cell.styles.fillColor = [211, 211, 211];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.lineWidth = {
              top: 0.3,
              bottom: 0.1,
              left: 0.1,
              right: 0.1,
            };
            if (rate !== undefined && rate !== -1) {
              if (rate > 0) {
                data.cell.styles.fillColor = getBackgroundColorRGB(rate);
                data.cell.styles.textColor = getFontColorRGB(rate);
              } else {
                data.cell.styles.fillColor = [229, 231, 235];
              }
            }
          } else {
            if (isActualGroupRow) {
              data.cell.styles.fillColor = [243, 244, 246];
              data.cell.styles.fontStyle = "bold";
              if (colIndex < numGroupingCols && !cellHasValue)
                data.cell.styles.textColor = [243, 244, 246];
            } else {
              data.cell.styles.fillColor = [255, 255, 255];
              data.cell.styles.fontStyle = "normal";
              if (colIndex < numGroupingCols)
                data.cell.styles.textColor = [255, 255, 255];
              else if (isGroupLabelCol)
                data.cell.styles.cellPadding = {
                  ...data.cell.styles.cellPadding,
                  left: 3,
                };
            }
            if (colIndex > numGroupingCols && rate !== undefined && rate !== -1) {
              if (rate > 0) {
                data.cell.styles.fillColor = getBackgroundColorRGB(rate);
                data.cell.styles.textColor = getFontColorRGB(rate);
              } else {
                data.cell.styles.fillColor = [229, 231, 235];
                data.cell.styles.textColor = isActualGroupRow
                  ? [55, 65, 81]
                  : [55, 65, 81];
              }
              data.cell.styles.fontStyle = isActualGroupRow ? "bold" : "normal";
            }
          }
        } else if (data.section === "head") {
          data.cell.styles.halign =
            colIndex <= numGroupingCols ? "left" : "center";
        }
      },
      didDrawPage: (data) => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(
          "Weekly Defect Trend Analysis",
          doc.internal.pageSize.getWidth() / 2,
          15,
          { align: "center" }
        );
      },
    });
    doc.save("WeeklyDefectTrend.pdf");
  };

  const handleOptionToggle = (option) => {
    setGroupingOptions((prev) => ({ ...prev, [option]: !prev[option] }));
  };
  const handleAddAll = () => {
    setGroupingOptions({
      addLines: true,
      addMO: true,
      addBuyer: true,
      addColors: true,
      addSizes: true,
    });
  };
  const handleClearAll = () => {
    setGroupingOptions({
      addLines: false,
      addMO: false,
      addBuyer: false,
      addColors: false,
      addSizes: false,
    });
  };

  const summaryStats = {
    totalCheckedQty: totalChecked,
    totalDefectsQty: totalDefects,
    defectRate: overallDhu,
  };
  const tableGroupingHeaders = getCurrentGroupingFieldNames();

  const calculateRowSpan = (groupRowIndex, groupKey) => {
    let spanCount = 1;
    for (let i = groupRowIndex + 1; i < rows.length; i++) {
      if (rows[i].type === "defect" && rows[i].key.startsWith(groupKey + "-")) {
        spanCount++;
      } else {
        break;
      }
    }
    return spanCount;
  };

  let lastDisplayedGroupValues = Array(tableGroupingHeaders.length).fill(null);

  return (
    <div className="p-4 space-y-6">
      <WeeklyFilterPane
        onFilterChange={handleFilterChange}
        initialFilters={activeFilters}
      />

      <div className="mb-6">
        {loading && (
          <div className="text-center p-4 text-gray-500">Loading summary...</div>
        )}
        {error && (
          <div className="text-center p-4 text-red-500">
            Error loading summary: {error}
          </div>
        )}
        {!loading &&
          !error &&
          weeklyApiData.length === 0 &&
          (activeFilters.startDate || activeFilters.endDate) && (
            <div className="text-center p-4 text-gray-500 bg-white shadow-md rounded-lg">
              No weekly data available for the selected filters. (Check API
              endpoint: /api/sunrise/qc1-weekly-data)
            </div>
          )}
        {!loading && !error && weeklyApiData.length > 0 && (
          <QCSunriseSummaryCard summaryStats={summaryStats} />
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg p-4">
        {!loading && !error && (
          <>
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
              <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
                Weekly Defect Trend
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
                  const isDisabled = isFilterActive(filterKey);
                  return (
                    <label
                      key={option}
                      className={`flex items-center space-x-1 ${
                        isDisabled
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={groupingOptions[option] || isDisabled}
                        onChange={() => !isDisabled && handleOptionToggle(option)}
                        disabled={isDisabled}
                        className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${
                          isDisabled ? "" : "cursor-pointer"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          isDisabled ? "text-gray-400" : "text-gray-700"
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
                >
                  Add All
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                >
                  Clear All
                </button>
                <div className="border-l border-gray-300 h-6 mx-2"></div>
                <button
                  onClick={downloadExcel}
                  className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={rows.length === 0}
                >
                  <FaFileExcel className="mr-1 h-4 w-4" /> Excel
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={rows.length === 0}
                >
                  <FaFilePdf className="mr-1 h-4 w-4" /> PDF
                </button>
              </div>
            </div>
          </>
        )}

        {loading && (
          <div className="text-center p-4 text-gray-500">
            Loading weekly trend data...
          </div>
        )}
        {error && (
          <div className="text-center p-4 text-red-500">
            Error loading weekly data: {error}
          </div>
        )}
        {!loading && !error && rows.length === 0 && weeklyApiData.length > 0 && (
          <div className="text-center p-4 text-gray-500">
            No trend data to display based on current grouping. Try adjusting
            'Group by' options.
          </div>
        )}
        {!loading &&
          !error &&
          rows.length === 0 &&
          weeklyApiData.length === 0 &&
          (activeFilters.startDate || activeFilters.endDate) && (
            <div className="text-center p-4 text-gray-500">
              No weekly data found for the selected filters. (Check API endpoint
              and filters)
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

                  {uniqueWeeks.map((week) => (
                    <th
                      key={week}
                      className="py-2 px-3 border-b border-r border-gray-300 text-center font-semibold text-gray-700 whitespace-nowrap align-middle"
                      style={{ minWidth: "180px" }}
                    >
                      {formatWeekKeyToDisplay(week)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white">
                {rows.map((row, rowIndex) => {
                  if (row.type === "group") {
                    const rowSpanCount = calculateRowSpan(
                      rowIndex,
                      row.key.replace("-group", "")
                    );
                    return (
                      <tr key={row.key} className="font-semibold">
                        {tableGroupingHeaders.map((header, colIndex) => (
                          <td
                            key={`group-${row.key}-${colIndex}`}
                            rowSpan={rowSpanCount}
                            className="py-1.5 px-3 border-b border-r border-slate-400 whitespace-nowrap align-middle font-medium text-gray-800 bg-slate-100 sticky z-10"
                            style={{
                              left: `${colIndex * 100}px`,
                              minWidth: "100px",
                              verticalAlign: "top",
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
                            verticalAlign: "middle",
                          }}
                        >
                          TOTAL %
                        </td>
                        {uniqueWeeks.map((week) => {
                          const rate = row.data[week] || 0;
                          const displayValue =
                            rate > 0 ? `${rate.toFixed(2)}%` : "";
                          return (
                            <td
                              key={`${row.key}-week-${week}`}
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
                  } else if (row.type === "defect") {
                    return (
                      <tr key={row.key} className="hover:bg-gray-50">
                        <td
                          key={`label-${row.key}`}
                          className="py-1.5 px-3 border-b border-r border-gray-300 whitespace-nowrap align-middle text-gray-700 bg-white pl-6 sticky z-10"
                          style={{
                            left: `${tableGroupingHeaders.length * 100}px`,
                            minWidth: "150px",
                            verticalAlign: "middle",
                          }}
                        >
                          {row.defectName}
                        </td>
                        {uniqueWeeks.map((week) => {
                          const rate = row.data[week] || 0;
                          const displayValue =
                            rate > 0 ? `${rate.toFixed(2)}%` : "";
                          return (
                            <td
                              key={`${row.key}-week-${week}`}
                              className={`py-1.5 px-3 border-b border-r border-gray-300 text-center align-middle ${
                                rate > 0 ? getBackgroundColor(rate) : "bg-white"
                              } ${
                                rate > 0
                                  ? getFontColor(rate)
                                  : "text-gray-500"
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
                  {uniqueWeeks.map((week) => {
                    const weekData = weeklyApiData.filter(
                      (d) =>
                        (d.weekKey ||
                          getWeekKey(d.inspectionDate || d.weekStartDate)) ===
                        week
                    );
                    const totalCheckedForWeek = weekData.reduce(
                      (sum, d) => sum + (d.CheckedQty || 0),
                      0
                    );
                    const totalDefectsForWeek = weekData.reduce(
                      (sum, d) => sum + (d.totalDefectsQty || 0),
                      0
                    );
                    const rate =
                      totalCheckedForWeek > 0
                        ? parseFloat(
                            (
                              (totalDefectsForWeek / totalCheckedForWeek) *
                              100
                            ).toFixed(2)
                          )
                        : 0;
                    const displayValue =
                      rate > 0 ? `${rate.toFixed(2)}%` : "";
                    return (
                      <td
                        key={`total-week-${week}`}
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

export default SunriseWeeklyTrend;
