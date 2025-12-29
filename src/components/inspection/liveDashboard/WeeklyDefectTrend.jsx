import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Settings,
  TrendingUp,
  Calendar,
  Filter,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  Layers,
  Users,
  Palette,
  Ruler,
  Package
} from "lucide-react";

if (typeof autoTable === "undefined") {
  console.error("jspdf-autotable not loaded. Attempting default import.");
  import("jspdf-autotable").then((module) => {
    global.autoTable = module.default;
  });
}

const WeeklyDefectTrend = ({ filters }) => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [customFilters, setCustomFilters] = useState({
    addLines: false,
    addMO: false,
    addBuyer: false,
    addColors: false,
    addSizes: false
  });
  const [rows, setRows] = useState([]);
  const [uniqueWeeks, setUniqueWeeks] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const isMoNoFiltered = (filters.moNo ?? "").trim() !== "";
  const isLineNoFiltered = (filters.lineNo ?? "").trim() !== "";
  const isColorFiltered = (filters.color ?? "").trim() !== "";
  const isSizeFiltered = (filters.size ?? "").trim() !== "";

  const fetchData = async () => {
    try {
      setLoading(true);
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== "" && value !== undefined && value !== null
        )
      );

      activeFilters.groupByWeek = "true";
      activeFilters.groupByLine = customFilters.addLines || isLineNoFiltered ? "true" : "false";
      activeFilters.groupByMO = customFilters.addMO || isMoNoFiltered ? "true" : "false";
      activeFilters.groupByBuyer = customFilters.addBuyer ? "true" : "false";
      activeFilters.groupByColor = customFilters.addColors || isColorFiltered ? "true" : "false";
      activeFilters.groupBySize = customFilters.addSizes || isSizeFiltered ? "true" : "false";

      const queryString = new URLSearchParams(activeFilters).toString();
      const url = `${API_BASE_URL}/api/qc2-mo-summaries?${queryString}`;
      const response = await axios.get(url);

      setSummaryData(response.data);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch summary data");
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(filters), customFilters]);

  useEffect(() => {
    if (summaryData.length === 0) return;

    const weeksSet = new Set(
      summaryData.map(
        (d) => `${d.weekInfo.weekNumber}:${d.weekInfo.startDate}--${d.weekInfo.endDate}`
      )
    );

    const sortedWeeks = [...weeksSet].sort((a, b) => {
      const [aWeek, aRange] = a.split(":");
      const [bWeek, bRange] = b.split(":");
      return aRange.localeCompare(bRange);
    });

    setUniqueWeeks(sortedWeeks);

    const groupingFields = [];
    if (customFilters.addLines) groupingFields.push("lineNo");
    if (customFilters.addMO) groupingFields.push("moNo");
    if (customFilters.addBuyer) groupingFields.push("buyer");
    if (customFilters.addColors) groupingFields.push("color");
    if (customFilters.addSizes) groupingFields.push("size");

    const hierarchy = buildHierarchy(summaryData, groupingFields);
    const tableRows = buildRows(hierarchy, groupingFields, sortedWeeks);
    setRows(tableRows);
  }, [summaryData, customFilters]);

  // Calculate statistics
  const stats = {
    totalWeeks: uniqueWeeks.length,
    totalRows: rows.length,
    groupRows: rows.filter(row => row.type === "group").length,
    defectRows: rows.filter(row => row.type === "defect").length,
    avgDefectRate: uniqueWeeks.length > 0 ? 
      (uniqueWeeks.reduce((sum, week) => {
        const weekData = summaryData.filter(d => 
          `${d.weekInfo.weekNumber}:${d.weekInfo.startDate}--${d.weekInfo.endDate}` === week
        );
        const totalChecked = weekData.reduce((s, d) => s + (d.checkedQty || 0), 0);
        const totalDefects = weekData.reduce((s, d) => s + (d.defectsQty || 0), 0);
        return sum + (totalChecked > 0 ? (totalDefects / totalChecked) * 100 : 0);
      }, 0) / uniqueWeeks.length).toFixed(2) : 0
  };

  const buildHierarchy = (data, groupingFields) => {
    if (groupingFields.length === 0) {
      const weekMap = {};
      data.forEach((doc) => {
        const weekKey = `${doc.weekInfo.weekNumber}:${doc.weekInfo.startDate}--${doc.weekInfo.endDate}`;
        weekMap[weekKey] = doc;
      });
      return weekMap;
    } else {
      const field = groupingFields[0];
      const groups = {};
      data.forEach((doc) => {
        const value = doc[field] || "N/A";
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

  const buildRows = (hierarchy, groupingFields, weeks, level = 0, path = [], currentFieldIndex = 0) => {
    const rows = [];

    if (currentFieldIndex < groupingFields.length) {
      const field = groupingFields[currentFieldIndex];
      Object.keys(hierarchy)
        .sort()
        .forEach((value) => {
          const subHierarchy = hierarchy[value];
          const groupData = {};
          weeks.forEach((week) => {
            const sum = getSumForGroup(subHierarchy, week);
            groupData[week] = sum.checkedQty > 0 ? (sum.defectsQty / sum.checkedQty) * 100 : 0;
          });

          rows.push({
            level,
            type: "group",
            key: value,
            path: [...path, value],
            data: groupData,
            field
          });

          const subRows = buildRows(
            subHierarchy,
            groupingFields,
            weeks,
            level + 1,
            [...path, value],
            currentFieldIndex + 1
          );
          rows.push(...subRows);
        });
    } else {
      const weekMap = hierarchy;
      const defectNames = new Set();
      Object.values(weekMap).forEach((doc) => {
        if (doc && doc.defectArray) {
          doc.defectArray.forEach((defect) => {
            if (defect.defectName) defectNames.add(defect.defectName);
          });
        }
      });

      [...defectNames].sort().forEach((defectName) => {
        const defectData = {};
        weeks.forEach((week) => {
          const doc = weekMap[week];
          if (doc && doc.defectArray) {
            const defect = doc.defectArray.find((d) => d.defectName === defectName);
            defectData[week] = defect && doc.checkedQty > 0 ? (defect.totalCount / doc.checkedQty) * 100 : 0;
          } else {
            defectData[week] = 0;
          }
        });

        rows.push({
          level,
          type: "defect",
          key: defectName,
          path: [...path, defectName],
          data: defectData
        });
      });
    }

    return rows;
  };

  const getSumForGroup = (currentHierarchy, week) => {
    if (typeof currentHierarchy !== "object" || Array.isArray(currentHierarchy)) {
      const doc = currentHierarchy[week];
      return doc ? { checkedQty: doc.checkedQty, defectsQty: doc.defectsQty } : { checkedQty: 0, defectsQty: 0 };
    }

    let sum = { checkedQty: 0, defectsQty: 0 };
    for (const key in currentHierarchy) {
      const subSum = getSumForGroup(currentHierarchy[key], week);
      sum.checkedQty += subSum.checkedQty;
      sum.defectsQty += subSum.defectsQty;
    }
    return sum;
  };

  const getStatusColor = (rate) => {
    if (rate > 3) return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
    if (rate >= 2) return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300";
    return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300";
  };

  const getStatusIcon = (rate) => {
    if (rate > 3) return <AlertTriangle className="w-3 h-3" />;
    if (rate >= 2) return <TrendingUp className="w-3 h-3" />;
    return <CheckCircle className="w-3 h-3" />;
  };

  const getFieldIcon = (field) => {
    switch (field) {
      case 'lineNo': return <Layers className="w-4 h-4" />;
      case 'moNo': return <Package className="w-4 h-4" />;
      case 'buyer': return <Users className="w-4 h-4" />;
      case 'color': return <Palette className="w-4 h-4" />;
      case 'size': return <Ruler className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const prepareExportData = () => {
    const exportData = [];
    const ratesMap = new Map();

    exportData.push(["Weekly Defect Trend Analysis", ...Array(uniqueWeeks.length).fill("")]);
    ratesMap.set("0-0", 0);

    exportData.push(Array(uniqueWeeks.length + 1).fill(""));
    ratesMap.set("1-0", 0);

    const headerRow = ["Group / Defect", ...uniqueWeeks];
    exportData.push(headerRow);
    ratesMap.set("2-0", 0);

    let rowIndex = 3;
    rows.forEach((row) => {
      const indent = "  ".repeat(row.level);
      const rowData = [`${indent}${row.key}`];
      uniqueWeeks.forEach((week, colIndex) => {
        const rate = row.data[week] || 0;
        rowData.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
        ratesMap.set(`${rowIndex}-${colIndex + 1}`, rate);
      });
      exportData.push(rowData);
      rowIndex++;
    });

    const totalRow = ["Total"];
    uniqueWeeks.forEach((week, colIndex) => {
      const hierarchy = buildHierarchy(summaryData, [
        ...(customFilters.addLines ? ["lineNo"] : []),
        ...(customFilters.addMO ? ["moNo"] : []),
        ...(customFilters.addBuyer ? ["buyer"] : []),
        ...(customFilters.addColors ? ["color"] : []),
        ...(customFilters.addSizes ? ["size"] : [])
      ]);
      const sum = getSumForGroup(hierarchy, week);
      const rate = sum.checkedQty > 0 ? (sum.defectsQty / sum.checkedQty) * 100 : 0;
      totalRow.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
      ratesMap.set(`${rowIndex}-${colIndex + 1}`, rate);
    });
    exportData.push(totalRow);

    return { exportData, ratesMap };
  };

  const downloadExcel = () => {
    const { exportData, ratesMap } = prepareExportData();
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const range = XLSX.utils.decode_range(ws["!ref"]);

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;

        const rate = ratesMap.get(`${row}-${col}`) || 0;
        const isHeaderRow = row === 2;
        const isTotalRow = row === range.e.r;

        ws[cellAddress].s = {
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          },
          fill: {
            fgColor: {
              rgb: isHeaderRow || isTotalRow ? "ADD8E6" : 
                   rate > 3 ? "FFCCCC" : 
                   rate >= 2 ? "FFFFCC" : 
                   rate > 0 ? "CCFFCC" : 
                   row < 2 ? "FFFFFF" : "E5E7EB"
            }
          },
          alignment: {
            horizontal: col === 0 ? "left" : "center",
            vertical: "middle"
          }
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defect Trend");
    XLSX.writeFile(wb, "WeeklyDefectTrend.xlsx");
  };

  const downloadPDF = () => {
    const { exportData, ratesMap } = prepareExportData();
    const doc = new jsPDF({ orientation: "landscape" });
    const tablePlugin = typeof autoTable === "function" ? autoTable : global.autoTable;

    if (!tablePlugin) {
      console.error("autoTable plugin not available. Please check jspdf-autotable installation.");
      return;
    }

    tablePlugin(doc, {
      head: [exportData[2]],
      body: exportData.slice(3),
      startY: 20,
      theme: "grid",
      headStyles: {
        fillColor: [173, 216, 230],
        textColor: [55, 65, 81],
        fontStyle: "bold"
      },
      styles: {
        cellPadding: 2,
        fontSize: 8,
        halign: "center",
        valign: "middle"
      },
      columnStyles: { 0: { halign: "left" } },
      didParseCell: (data) => {
        const rowIndex = data.row.index + 3;
        const colIndex = data.column.index;
        const rate = ratesMap.get(`${rowIndex}-${colIndex}`) || 0;
        const isTotalRow = rowIndex === exportData.length - 1;

        if (data.section === "body") {
          if (colIndex === 0) {
            data.cell.styles.fillColor = isTotalRow ? [173, 216, 230] : [255, 255, 255];
            data.cell.styles.textColor = [55, 65, 81];
          } else {
            const hasData = data.row.raw[colIndex].includes("%");
            data.cell.styles.fillColor = hasData && rate > 0 ? 
              (rate > 3 ? [255, 204, 204] : rate >= 2 ? [255, 255, 204] : [204, 255, 204]) :
              isTotalRow ? [173, 216, 230] : [229, 231, 235];
            data.cell.styles.textColor = hasData && rate > 0 ? 
              (rate > 3 ? [153, 0, 0] : rate >= 2 ? [204, 102, 0] : [0, 102, 0]) : [55, 65, 81];
          }
        }
      },
      didDrawPage: () => {
        doc.text("Weekly Defect Trend Analysis", 14, 10);
      }
    });

    doc.save("WeeklyDefectTrend.pdf");
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Loading Trend Data</h3>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we process the data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-red-200 dark:border-red-700">
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error Loading Data</h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 px-6 py-6 border-b border-gray-200 dark:border-gray-600">
        {/* Title and Controls */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-indigo-500 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Weekly Defect Trend Analysis
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Comprehensive weekly defect analysis with hierarchical grouping and export capabilities
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                showFilters 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Grouping
            </button>

            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-600">
              <button
                onClick={downloadExcel}
                className="flex items-center px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-all duration-200"
                title="Download as Excel"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                Excel
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all duration-200"
                title="Download as PDF"
              >
                <FileText className="w-4 h-4 mr-1" />
                PDF
              </button>
            </div>

            <button
              onClick={fetchData}
              className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Weeks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalWeeks}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg Rate</p>
                <p className={`text-2xl font-bold ${
                  parseFloat(stats.avgDefectRate) > 3 ? 'text-red-600 dark:text-red-400' :
                  parseFloat(stats.avgDefectRate) >= 2 ? 'text-amber-600 dark:text-amber-400' :
                  'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {stats.avgDefectRate}%
                </p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Groups</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.groupRows}</p>
              </div>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Defects</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.defectRows}</p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Grouping Filters */}
        {showFilters && (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-inner">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Grouping Options</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <label className={`flex items-center p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                (customFilters.addLines || isLineNoFiltered) 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              } ${isLineNoFiltered ? 'opacity-75 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={customFilters.addLines || isLineNoFiltered}
                  onChange={(e) => setCustomFilters(prev => ({ ...prev, addLines: e.target.checked }))}
                  disabled={isLineNoFiltered}
                  className="sr-only"
                />
                <div className="flex items-center space-x-2">
                  {getFieldIcon('lineNo')}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lines</span>
                </div>
              </label>

              <label className={`flex items-center p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                (customFilters.addMO || isMoNoFiltered) 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              } ${isMoNoFiltered ? 'opacity-75 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={customFilters.addMO || isMoNoFiltered}
                  onChange={(e) => setCustomFilters(prev => ({ ...prev, addMO: e.target.checked }))}
                  disabled={isMoNoFiltered}
                  className="sr-only"
                />
                <div className="flex items-center space-x-2">
                  {getFieldIcon('moNo')}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">MO</span>
                </div>
              </label>

              <label className={`flex items-center p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                customFilters.addBuyer 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}>
                <input
                  type="checkbox"
                                    checked={customFilters.addBuyer}
                  onChange={(e) => setCustomFilters(prev => ({ ...prev, addBuyer: e.target.checked }))}
                  className="sr-only"
                />
                <div className="flex items-center space-x-2">
                  {getFieldIcon('buyer')}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Buyer</span>
                </div>
              </label>

              <label className={`flex items-center p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                (customFilters.addColors || isColorFiltered) 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              } ${isColorFiltered ? 'opacity-75 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={customFilters.addColors || isColorFiltered}
                  onChange={(e) => setCustomFilters(prev => ({ ...prev, addColors: e.target.checked }))}
                  disabled={isColorFiltered}
                  className="sr-only"
                />
                <div className="flex items-center space-x-2">
                  {getFieldIcon('color')}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Colors</span>
                </div>
              </label>

              <label className={`flex items-center p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                (customFilters.addSizes || isSizeFiltered) 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              } ${isSizeFiltered ? 'opacity-75 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={customFilters.addSizes || isSizeFiltered}
                  onChange={(e) => setCustomFilters(prev => ({ ...prev, addSizes: e.target.checked }))}
                  disabled={isSizeFiltered}
                  className="sr-only"
                />
                <div className="flex items-center space-x-2">
                  {getFieldIcon('size')}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sizes</span>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Table Area */}
      <div className="p-6">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-inner">
          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4" />
                          <span>Group / Defect</span>
                        </div>
                      </th>
                      {uniqueWeeks.map((week, index) => (
                        <th
                          key={week}
                          className={`px-4 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider min-w-[120px] ${
                            index < uniqueWeeks.length - 1 ? 'border-r border-gray-300 dark:border-gray-600' : ''
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <Calendar className="w-3 h-3" />
                            <div className="whitespace-pre-wrap text-center leading-tight">
                              {week.split(":").join("\n")}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {rows.map((row, index) => (
                      <tr
                        key={index}
                        className={`transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          row.type === "group" 
                            ? "bg-gray-50/50 dark:bg-gray-800/50" 
                            : index % 2 === 0 
                              ? "bg-white dark:bg-gray-900" 
                              : "bg-gray-50/30 dark:bg-gray-800/30"
                        }`}
                      >
                        <td
                          className={`px-6 py-3 text-sm border-r border-gray-200 dark:border-gray-700 ${
                            row.type === "group" ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                          }`}
                          style={{ paddingLeft: `${24 + row.level * 20}px` }}
                        >
                          <div className="flex items-center space-x-2">
                            {row.type === "group" && (
                              <div className="flex items-center space-x-1">
                                {getFieldIcon(row.field)}
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
                                  {row.field?.toUpperCase() || 'GROUP'}
                                </span>
                              </div>
                            )}
                            {row.type === "defect" && (
                              <AlertTriangle className="w-3 h-3 text-orange-500 dark:text-orange-400" />
                            )}
                            <span className={row.type === "group" ? "font-bold" : ""}>{row.key}</span>
                          </div>
                        </td>
                        {uniqueWeeks.map((week, weekIndex) => {
                          const rate = row.data[week] || 0;
                          return (
                            <td
                              key={week}
                              className={`px-4 py-3 text-center text-sm font-medium transition-all duration-200 ${
                                rate > 0 ? getStatusColor(rate) : "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                              } ${weekIndex < uniqueWeeks.length - 1 ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}
                            >
                              {rate > 0 ? (
                                <div className="flex items-center justify-center space-x-1">
                                  {getStatusIcon(rate)}
                                  <span className="font-bold">{rate.toFixed(2)}%</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-600">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    
                    {/* Enhanced Total Row */}
                    <tr className="bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 border-t-2 border-indigo-200 dark:border-indigo-700">
                      <td className="px-6 py-4 text-sm font-bold text-indigo-900 dark:text-indigo-200 border-r border-indigo-300 dark:border-indigo-600">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4" />
                          <span>TOTAL</span>
                        </div>
                      </td>
                      {uniqueWeeks.map((week, weekIndex) => {
                        const weekData = summaryData.filter(
                          (d) => `${d.weekInfo.weekNumber}:${d.weekInfo.startDate}--${d.weekInfo.endDate}` === week
                        );
                        const totalChecked = weekData.reduce((sum, d) => sum + (d.checkedQty || 0), 0);
                        const totalDefects = weekData.reduce((sum, d) => sum + (d.defectsQty || 0), 0);
                        const rate = totalChecked > 0 ? (totalDefects / totalChecked) * 100 : 0;

                        return (
                          <td
                            key={week}
                            className={`px-4 py-4 text-center text-sm font-bold transition-all duration-200 ${
                              rate > 0 ? getStatusColor(rate) : "bg-indigo-50 dark:bg-indigo-900/20 text-gray-400 dark:text-gray-500"
                            } ${weekIndex < uniqueWeeks.length - 1 ? 'border-r border-indigo-300 dark:border-indigo-600' : ''}`}
                          >
                            {rate > 0 ? (
                              <div className="flex items-center justify-center space-x-1">
                                {getStatusIcon(rate)}
                                <span className="font-bold text-lg">{rate.toFixed(2)}%</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600 text-lg">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-5 border-t border-gray-200 dark:border-gray-600">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Good (&lt;2%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-amber-500 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Warning (2-3%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Critical (&gt;3%)</span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Info className="w-3 h-3" />
              <span>Hierarchical grouping enabled</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>•</span>
              <span>Export available in Excel & PDF</span>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        {stats.totalWeeks > 0 && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Analysis Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Data Coverage: </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {stats.totalWeeks} weeks analyzed
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Grouping Levels: </span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {Object.values(customFilters).filter(Boolean).length} active
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Overall Performance: </span>
                    <span className={`font-bold ${
                      parseFloat(stats.avgDefectRate) <= 2 ? 'text-emerald-600 dark:text-emerald-400' :
                      parseFloat(stats.avgDefectRate) <= 3 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {parseFloat(stats.avgDefectRate) <= 2 ? 'Excellent' :
                       parseFloat(stats.avgDefectRate) <= 3 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyDefectTrend;

