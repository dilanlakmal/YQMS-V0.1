import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  FaFileExcel, 
  FaFilePdf, 
  FaFilter, 
  FaTable,
  FaChartLine,
  FaDownload,
  FaEye,
  FaEyeSlash
} from "react-icons/fa";
import { 
  Moon, 
  Sun, 
  RefreshCw, 
  Settings, 
  TrendingUp,
  Calendar,
  Loader,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

// Dark mode hook
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDark = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return [isDark, toggleDark];
};

const DailyDefectTrend = ({ filters }) => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDark, toggleDark] = useDarkMode();
  const [showFilters, setShowFilters] = useState(true);
  const [customFilters, setCustomFilters] = useState({
    addLines: false,
    addMO: false,
    addBuyer: false,
    addColors: false,
    addSizes: false
  });
  const [rows, setRows] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);

  // Determine if filters are applied
  const isMoNoFiltered = (filters.moNo ?? "").trim() !== "";
  const isLineNoFiltered = (filters.lineNo ?? "").trim() !== "";
  const isColorFiltered = (filters.color ?? "").trim() !== "";
  const isSizeFiltered = (filters.size ?? "").trim() !== "";

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== "" && value !== undefined && value !== null
        )
      );

      activeFilters.groupByDate = "true";
      activeFilters.groupByLine = customFilters.addLines || isLineNoFiltered ? "true" : "false";
      activeFilters.groupByMO = customFilters.addMO || isMoNoFiltered ? "true" : "false";
      activeFilters.groupByBuyer = customFilters.addBuyer ? "true" : "false";
      activeFilters.groupByColor = customFilters.addColors || isColorFiltered ? "true" : "false";
      activeFilters.groupBySize = customFilters.addSizes || isSizeFiltered ? "true" : "false";

      const queryString = new URLSearchParams(activeFilters).toString();
      const url = `${API_BASE_URL}/api/qc2-mo-summaries?${queryString}`;
      const response = await axios.get(url);

      setSummaryData(response.data);
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

  // Process data when summaryData changes
  useEffect(() => {
    if (summaryData.length === 0) return;

    const datesSet = new Set(summaryData.map((d) => d.inspection_date));
    const sortedDates = [...datesSet].sort((a, b) => new Date(a) - new Date(b));
    setUniqueDates(sortedDates);

    const groupingFields = [];
    if (customFilters.addLines) groupingFields.push("lineNo");
    if (customFilters.addMO) groupingFields.push("moNo");
    if (customFilters.addBuyer) groupingFields.push("buyer");
    if (customFilters.addColors) groupingFields.push("color");
    if (customFilters.addSizes) groupingFields.push("size");

    const hierarchy = buildHierarchy(summaryData, groupingFields);
    const tableRows = buildRows(hierarchy, groupingFields, sortedDates);
    setRows(tableRows);
  }, [summaryData, customFilters]);

  // Build hierarchical data structure
  const buildHierarchy = (data, groupingFields) => {
    if (groupingFields.length === 0) {
      const dateMap = {};
      data.forEach((doc) => {
        dateMap[doc.inspection_date] = doc;
      });
      return dateMap;
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

  // Build table rows recursively
  const buildRows = (hierarchy, groupingFields, dates, level = 0, path = [], currentFieldIndex = 0) => {
    const rows = [];

    if (currentFieldIndex < groupingFields.length) {
      const field = groupingFields[currentFieldIndex];
      Object.keys(hierarchy)
        .sort()
        .forEach((value) => {
          const subHierarchy = hierarchy[value];
          const groupData = {};
          dates.forEach((date) => {
            const sum = getSumForGroup(subHierarchy, date);
            groupData[date] = sum.checkedQty > 0 ? (sum.defectsQty / sum.checkedQty) * 100 : 0;
          });

          rows.push({
            level,
            type: "group",
            key: value,
            path: [...path, value],
            data: groupData
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
      const dateMap = hierarchy;
      const defectNames = new Set();
      Object.values(dateMap).forEach((doc) => {
        if (doc && doc.defectArray) {
          doc.defectArray.forEach((defect) => {
            if (defect.defectName) defectNames.add(defect.defectName);
          });
        }
      });

      [...defectNames].sort().forEach((defectName) => {
        const defectData = {};
        dates.forEach((date) => {
          const doc = dateMap[date];
          if (doc && doc.defectArray) {
            const defect = doc.defectArray.find((d) => d.defectName === defectName);
            defectData[date] = defect && doc.checkedQty > 0 ? (defect.totalCount / doc.checkedQty) * 100 : 0;
          } else {
            defectData[date] = 0;
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

  // Sum checkedQty and defectsQty for a group on a specific date
  const getSumForGroup = (currentHierarchy, date) => {
    if (typeof currentHierarchy !== "object" || Array.isArray(currentHierarchy)) {
      const doc = currentHierarchy[date];
      return doc ? { checkedQty: doc.checkedQty, defectsQty: doc.defectsQty } : { checkedQty: 0, defectsQty: 0 };
    }

    let sum = { checkedQty: 0, defectsQty: 0 };
    for (const key in currentHierarchy) {
      const subSum = getSumForGroup(currentHierarchy[key], date);
      sum.checkedQty += subSum.checkedQty;
      sum.defectsQty += subSum.defectsQty;
    }
    return sum;
  };

  // Enhanced color coding functions
  const getBackgroundColor = (rate) => {
    if (rate > 3) return "bg-red-100 dark:bg-red-900/30";
    if (rate >= 2) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-green-100 dark:bg-green-900/30";
  };

  const getFontColor = (rate) => {
    if (rate > 3) return "text-red-800 dark:text-red-300";
    if (rate >= 2) return "text-orange-800 dark:text-orange-300";
    return "text-green-800 dark:text-green-300";
  };

  const getBackgroundColorRGB = (rate) => {
    if (rate > 3) return [255, 204, 204];
    if (rate >= 2) return [255, 255, 204];
    return [204, 255, 204];
  };

  const getFontColorRGB = (rate) => {
    if (rate > 3) return [153, 0, 0];
    if (rate >= 2) return [204, 102, 0];
    return [0, 102, 0];
  };

  const getBackgroundColorHex = (rate) => {
    if (rate > 3) return "FFCCCC";
    if (rate >= 2) return "FFFFCC";
    return "CCFFCC";
  };

  // Export functions remain the same
  const prepareExportData = () => {
    const exportData = [];
    const ratesMap = new Map();

    exportData.push(["Daily Defect Trend Analysis", ...Array(uniqueDates.length).fill("")]);
    ratesMap.set("0-0", 0);
    exportData.push(Array(uniqueDates.length + 1).fill(""));
    ratesMap.set("1-0", 0);

    const headerRow = ["Group / Defect", ...uniqueDates];
    exportData.push(headerRow);
    ratesMap.set("2-0", 0);

    let rowIndex = 3;
    rows.forEach((row) => {
      const indent = "  ".repeat(row.level);
      const rowData = [`${indent}${row.key}`];
      uniqueDates.forEach((date, colIndex) => {
        const rate = row.data[date] || 0;
        rowData.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
        ratesMap.set(`${rowIndex}-${colIndex + 1}`, rate);
      });
      exportData.push(rowData);
      rowIndex++;
    });

    const totalRow = ["Total"];
    uniqueDates.forEach((date, colIndex) => {
      const hierarchy = buildHierarchy(summaryData, [
        ...(customFilters.addLines ? ["lineNo"] : []),
        ...(customFilters.addMO ? ["moNo"] : []),
        ...(customFilters.addBuyer ? ["buyer"] : []),
        ...(customFilters.addColors ? ["color"] : []),
        ...(customFilters.addSizes ? ["size"] : [])
      ]);
      const sum = getSumForGroup(hierarchy, date);
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
              rgb: isHeaderRow || isTotalRow ? "ADD8E6" : rate > 0 ? getBackgroundColorHex(rate) : row < 2 ? "FFFFFF" : "E5E7EB"
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
    XLSX.writeFile(wb, "DailyDefectTrend.xlsx");
  };

  const downloadPDF = () => {
    const { exportData, ratesMap } = prepareExportData();
    const doc = new jsPDF({ orientation: "landscape" });

    autoTable(doc, {
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
            data.cell.styles.fillColor = hasData && rate > 0 ? getBackgroundColorRGB(rate) : isTotalRow ? [173, 216, 230] : [229, 231, 235];
            data.cell.styles.textColor = hasData && rate > 0 ? getFontColorRGB(rate) : [55, 65, 81];
          }
        }
      },
      didDrawPage: () => {
        doc.text("Daily Defect Trend Analysis", 14, 10);
      }
    });

    doc.save("DailyDefectTrend.pdf");
  };

  // Statistics calculation
  const statistics = React.useMemo(() => {
    if (summaryData.length === 0) return null;

    const totalChecked = summaryData.reduce((sum, d) => sum + (d.checkedQty || 0), 0);
    const totalDefects = summaryData.reduce((sum, d) => sum + (d.defectsQty || 0), 0);
    const avgRate = totalChecked > 0 ? (totalDefects / totalChecked) * 100 : 0;
    const datesCount = uniqueDates.length;
    const groupsCount = rows.filter(r => r.type === 'group').length;
    const defectsCount = rows.filter(r => r.type === 'defect').length;

    return {
      avgRate: avgRate.toFixed(2),
      totalChecked,
      totalDefects,
      datesCount,
      groupsCount,
      defectsCount
    };
  }, [summaryData, uniqueDates, rows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="text-center">
          <Loader className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading defect trend data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-800 p-6 shadow-lg">
        <div className="text-center">
          <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Data</h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <TrendingUp className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Rate</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{statistics.avgRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Checked</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{statistics.totalChecked.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Defects</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{statistics.totalDefects.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Calendar className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date Range</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{statistics.datesCount} days</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg shadow-md">
                <FaChartLine className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Daily Defect Trend Analysis</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive defect tracking across time periods</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"
                title="Toggle Filters"
              >
                {showFilters ? <FaEyeSlash className="mr-2" /> : <FaEye className="mr-2" />}
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              
              <button
                onClick={toggleDark}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                title="Toggle Dark Mode"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <button
                onClick={fetchData}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                title="Refresh Data"
              >
                <RefreshCw size={18} />
              </button>
              
              <div className="flex items-center space-x-2 border-l border-gray-300 dark:border-gray-600 pl-2">
                <button
                  onClick={downloadExcel}
                  className="inline-flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                  title="Download Excel"
                >
                  <FaFileExcel className="mr-2" size={16} />
                  Excel
                </button>
                
                <button
                  onClick={downloadPDF}
                  className="inline-flex items-center px-3 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                  title="Download PDF"
                >
                  <FaFilePdf className="mr-2" size={16} />
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        {showFilters && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-2 mb-3">
              <Settings className="text-gray-600 dark:text-gray-400" size={16} />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Grouping Options</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { key: 'addLines', label: 'Lines', disabled: isLineNoFiltered },
                { key: 'addMO', label: 'Manufacturing Orders', disabled: isMoNoFiltered },
                { key: 'addBuyer', label: 'Buyers', disabled: false },
                { key: 'addColors', label: 'Colors', disabled: isColorFiltered },
                { key: 'addSizes', label: 'Sizes', disabled: isSizeFiltered }
              ].map(({ key, label, disabled }) => (
                <label key={key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customFilters[key] || (key === 'addLines' && isLineNoFiltered) || (key === 'addMO' && isMoNoFiltered) || (key === 'addColors' && isColorFiltered) || (key === 'addSizes' && isSizeFiltered)}
                    onChange={(e) => setCustomFilters(prev => ({ ...prev, [key]: e.target.checked }))}
                    disabled={disabled}
                    className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  />
                  <span className={`text-sm ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2">
                        <FaTable size={14} />
                        <span>Group / Defect</span>
                      </div>
                    </th>
                    {uniqueDates.map((date) => (
                      <th key={date} className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                                               <div className="flex flex-col items-center space-y-1">
                          <Calendar size={14} />
                          <span>{date}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {rows.map((row, index) => (
                    <tr
                      key={index}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 ${
                        row.type === "group" 
                          ? "bg-gray-50 dark:bg-gray-700/30 font-medium" 
                          : "bg-white dark:bg-gray-800"
                      }`}
                    >
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600"
                        style={{ paddingLeft: `${24 + row.level * 20}px` }}
                      >
                        <div className="flex items-center space-x-2">
                          {row.type === "group" ? (
                            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                          ) : (
                            <div className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full"></div>
                          )}
                          <span className={`${
                            row.type === "group" 
                              ? "font-semibold text-gray-900 dark:text-gray-100" 
                              : "text-gray-700 dark:text-gray-300"
                          }`}>
                            {row.key}
                          </span>
                        </div>
                      </td>
                      {uniqueDates.map((date) => {
                        const rate = row.data[date] || 0;
                        return (
                          <td
                            key={date}
                            className={`px-6 py-4 whitespace-nowrap text-center text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0 ${
                              rate > 0 ? getBackgroundColor(rate) : "bg-gray-50 dark:bg-gray-700/20"
                            } ${rate > 0 ? getFontColor(rate) : "text-gray-500 dark:text-gray-400"}`}
                          >
                            <div className="flex flex-col items-center">
                              {rate > 0 ? (
                                <>
                                  <span className="font-semibold">{rate.toFixed(2)}%</span>
                                  {rate > 3 && (
                                    <div className="w-1 h-1 bg-red-500 rounded-full mt-1"></div>
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">-</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  
                  {/* Total Row */}
                  <tr className="bg-blue-50 dark:bg-blue-900/30 font-bold border-t-2 border-blue-200 dark:border-blue-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                        <span>Total</span>
                      </div>
                    </td>
                    {uniqueDates.map((date) => {
                      const dateData = summaryData.filter((d) => d.inspection_date === date);
                      const totalChecked = dateData.reduce((sum, d) => sum + (d.checkedQty || 0), 0);
                      const totalDefects = dateData.reduce((sum, d) => sum + (d.defectsQty || 0), 0);
                      const rate = totalChecked > 0 ? (totalDefects / totalChecked) * 100 : 0;

                      return (
                        <td
                          key={date}
                          className={`px-6 py-4 whitespace-nowrap text-center text-sm font-bold border-r border-gray-200 dark:border-gray-600 last:border-r-0 ${
                            rate > 0 ? getBackgroundColor(rate) : "bg-blue-50 dark:bg-blue-900/30"
                          } ${rate > 0 ? getFontColor(rate) : "text-gray-700 dark:text-gray-300"}`}
                        >
                          <div className="flex flex-col items-center">
                            {rate > 0 ? (
                              <>
                                <span className="font-bold text-lg">{rate.toFixed(2)}%</span>
                                <span className="text-xs opacity-75">
                                  {totalDefects}/{totalChecked}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer with Legend */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Good (&lt; 2%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Moderate (2-3%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">High (&gt; 3%)</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                <span>Groups: {statistics?.groupsCount || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full"></div>
                <span>Defects: {statistics?.defectsCount || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar size={14} />
                <span>{uniqueDates.length} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {summaryData.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-lg">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <FaChartLine className="text-gray-400 dark:text-gray-500" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Trend Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            No defect trend data found for the selected filters. Try adjusting your filter criteria or date range.
          </p>
          <button
            onClick={fetchData}
            className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <RefreshCw size={18} className="mr-2" />
            Refresh Data
          </button>
        </div>
      )}
    </div>
  );
};

export default DailyDefectTrend;

