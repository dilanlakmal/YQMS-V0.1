import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Download, 
  File, 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  AlertCircle,
  TrendingUp,
  Clock,
  BarChart3,
  Filter,
  Activity,
  Package
} from "lucide-react";

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mt-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              QC2 Defect Rate Analysis - Error
            </h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            Something went wrong. Please try again or contact support.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

const TrendAnalysisLine = ({ data, lineNoFilter }) => {
  // Define hour headers from 6-7 AM to 8-9 PM
  const hourLabels = {
    "07:00": "6-7",
    "08:00": "7-8",
    "09:00": "8-9",
    "10:00": "9-10",
    "11:00": "10-11",
    "12:00": "11-12",
    "13:00": "12-1",
    "14:00": "1-2",
    "15:00": "2-3",
    "16:00": "3-4",
    "17:00": "4-5",
    "18:00": "5-6",
    "19:00": "6-7",
    "20:00": "7-8",
    "21:00": "8-9"
  };

  const periodLabels = {
    "07:00": "AM",
    "08:00": "AM",
    "09:00": "AM",
    "10:00": "AM",
    "11:00": "AM",
    "12:00": "AM",
    "13:00": "PM",
    "14:00": "PM",
    "15:00": "PM",
    "16:00": "PM",
    "17:00": "PM",
    "18:00": "PM",
    "19:00": "PM",
    "20:00": "PM",
    "21:00": "PM"
  };

  // Sort Line Nos consistently
  const lineNos = Object.keys(data || {})
    .filter((key) => key !== "total" && key !== "grand")
    .filter((lineNo) => !lineNoFilter || lineNo === lineNoFilter)
    .sort();

  // Filter hours with at least one non-zero value for any Line No/MO No
  const activeHours = Object.keys(hourLabels).filter((hour) =>
    lineNos.some((lineNo) => {
      const moNos = Object.keys((data || {})[lineNo] || {});
      return moNos.some(
        (moNo) => ((data || {})[lineNo]?.[moNo]?.[hour]?.rate || 0) > 0
      );
    })
  );

  // State for expanded rows (Line No and MO No)
  const [expandedLines, setExpandedLines] = useState({});
  const [expandedMos, setExpandedMos] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Toggle expansion for Line No
  const toggleLine = (lineNo) =>
    setExpandedLines((prev) => ({ ...prev, [lineNo]: !prev[lineNo] }));

  // Toggle expansion for MO No within a Line No
  const toggleMo = (lineNo, moNo) =>
    setExpandedMos((prev) => ({
      ...prev,
      [`${lineNo}-${moNo}`]: !prev[`${lineNo}-${moNo}`]
    }));

  // Function to determine background color based on defect rate
  const getBackgroundColor = (rate) => {
    if (rate > 3) return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    if (rate >= 2) return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
  };

  // Function to determine font color based on defect rate
  const getFontColor = (rate) => {
    if (rate > 3) return "text-red-700 dark:text-red-300";
    if (rate >= 2) return "text-yellow-700 dark:text-yellow-300";
    return "text-green-700 dark:text-green-300";
  };

  // Function to get status badge styling
  const getStatusBadge = (rate) => {
    if (rate > 3) return "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700";
    if (rate >= 2) return "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700";
    return "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700";
  };

  // Map background colors to RGB for PDF and Excel
  const getBackgroundColorRGB = (rate) => {
    if (rate > 3) return [255, 204, 204];
    if (rate >= 2) return [255, 255, 204];
    return [204, 255, 204];
  };

  // Map font colors to RGB for PDF
  const getFontColorRGB = (rate) => {
    if (rate > 3) return [153, 0, 0];
    if (rate >= 2) return [204, 102, 0];
    return [0, 102, 0];
  };

  // Map background colors to hex for Excel
  const getBackgroundColorHex = (rate) => {
    if (rate > 3) return "FFCCCC";
    if (rate >= 2) return "FFFFCC";
    return "CCFFCC";
  };

  // Function to check for 3 consecutive periods with defect rate > 3% (Critical)
  const isCritical = (lineNo, moNo) => {
    const rates = activeHours.map((hour) => {
      const { rate = 0, hasCheckedQty = false } =
        (data || {})[lineNo]?.[moNo]?.[hour] || {};
      return hasCheckedQty ? rate : 0;
    });

    for (let i = 0; i <= rates.length - 3; i++) {
      if (rates[i] > 3 && rates[i + 1] > 3 && rates[i + 2] > 3) return true;
    }
    return false;
  };

  // Function to check for 2 consecutive periods with defect rate > 3% (Warning)
  const isWarning = (lineNo, moNo) => {
    const rates = activeHours.map((hour) => {
      const { rate = 0, hasCheckedQty = false } =
        (data || {})[lineNo]?.[moNo]?.[hour] || {};
      return hasCheckedQty ? rate : 0;
    });

    for (let i = 0; i <= rates.length - 2; i++) {
      if (rates[i] > 3 && rates[i + 1] > 3) return true;
    }
    return false;
  };

  // Memoized defect trends by Line No and MO No
  const defectTrendsByLineMo = useMemo(() => {
    const trends = {};

    lineNos.forEach((lineNo) => {
      trends[lineNo] = {};

      const moNos = Object.keys((data || {})[lineNo] || {})
        .filter((key) => key !== "totalRate")
        .sort();

      moNos.forEach((moNo) => {
        const defectsByName = {};
        const totalCheckedQty = activeHours.reduce(
          (sum, hour) =>
            sum + (((data || {})[lineNo] || {})[moNo]?.[hour]?.checkedQty || 0),
          0
        );

        activeHours.forEach((hour) => {
          const hourData = ((data || {})[lineNo] || {})[moNo]?.[hour] || {
            checkedQty: 0,
            defects: []
          };

          hourData.defects
            .filter((defect) => defect.name && defect.name !== "No Defect")
            .forEach((defect) => {
              if (!defectsByName[defect.name]) {
                defectsByName[defect.name] = { totalCount: 0, trends: {} };
              }
              defectsByName[defect.name].trends[hour] = {
                count: defect.count || 0,
                rate: defect.rate || 0
              };
              defectsByName[defect.name].totalCount += defect.count || 0;
            });
        });

        trends[lineNo][moNo] = Object.entries(defectsByName)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([defectName, { totalCount, trends }]) => ({
            defectName,
            totalDefectRate:
              totalCheckedQty > 0 ? (totalCount / totalCheckedQty) * 100 : 0,
            trends
          }));
      });
    });

    return trends;
  }, [data, lineNos, activeHours]);

  // Prepare data for Excel and PDF export (always fully expanded)
  const prepareExportData = () => {
    const exportData = [];
    const ratesMap = new Map();

    const titleRow = [
      "QC2 Defect Rate by Line No and MO No - Hour Trend",
      ...Array(activeHours.length + 1).fill("")
    ];
    exportData.push(titleRow);
    ratesMap.set(`${0}-0`, 0);

    exportData.push(Array(activeHours.length + 2).fill(""));
    ratesMap.set(`${1}-0`, 0);

    const headerRow1 = ["Line No / MO No"];
    const headerRow2 = [""];

    activeHours.forEach((hour) => {
      headerRow1.push(hourLabels[hour]);
      headerRow2.push(periodLabels[hour]);
    });

    headerRow1.push("Total");
    headerRow2.push("");

    exportData.push(headerRow1);
    exportData.push(headerRow2);

    ratesMap.set(`${2}-0`, 0);
    ratesMap.set(`${3}-0`, 0);

    let rowIndex = 4;

    lineNos.forEach((lineNo) => {
      const lineRow = [lineNo];

      activeHours.forEach((hour, colIndex) => {
        const totalRate = Object.values((data || {})[lineNo] || {}).reduce(
          (sum, moData) =>
            sum + (moData[hour]?.rate || 0) * (moData[hour]?.checkedQty || 0),
          0
        );

        const totalCheckedQty = Object.values(
          (data || {})[lineNo] || {}
        ).reduce((sum, moData) => sum + (moData[hour]?.checkedQty || 0), 0);

        const rate = totalCheckedQty > 0 ? totalRate / totalCheckedQty : 0;
        const hasCheckedQty = totalCheckedQty > 0;

        lineRow.push(hasCheckedQty ? `${rate.toFixed(2)}%` : "");
        ratesMap.set(`${rowIndex}-${colIndex + 1}`, hasCheckedQty ? rate : 0);
      });

      const totalLineRate = (data || {})[lineNo]?.totalRate || 0;
      lineRow.push(`${totalLineRate.toFixed(2)}%`);
      ratesMap.set(`${rowIndex}-${activeHours.length + 1}`, totalLineRate);

      exportData.push(lineRow);
      rowIndex++;

      Object.keys((data || {})[lineNo] || {})
        .sort()
        .forEach((moNo) => {
          const moRow = [`  ${moNo}`];

          activeHours.forEach((hour, colIndex) => {
            const { rate = 0, hasCheckedQty = false } =
              ((data || {})[lineNo] || {})[moNo]?.[hour] || {};

            moRow.push(hasCheckedQty ? `${rate.toFixed(2)}%` : "");
            ratesMap.set(
              `${rowIndex}-${colIndex + 1}`,
              hasCheckedQty ? rate : 0
            );
          });

          const totalMoRate = (data || {})[lineNo]?.[moNo]?.totalRate || 0;
          moRow.push(`${totalMoRate.toFixed(2)}%`);
          ratesMap.set(`${rowIndex}-${activeHours.length + 1}`, totalMoRate);

          exportData.push(moRow);
          rowIndex++;

          ((defectTrendsByLineMo[lineNo] || {})[moNo] || []).forEach(
            (defect) => {
              const defectRow = [`    ${defect.defectName}`];

              activeHours.forEach((hour, colIndex) => {
                const { rate = 0 } = defect.trends[hour] || {};
                const hasData = rate > 0;

                defectRow.push(hasData ? `${rate.toFixed(2)}%` : "");
                ratesMap.set(`${rowIndex}-${colIndex + 1}`, hasData ? rate : 0);
              });

              const totalDefectRate = defect.totalDefectRate || 0;
              defectRow.push(`${totalDefectRate.toFixed(2)}%`);
              ratesMap.set(
                `${rowIndex}-${activeHours.length + 1}`,
                totalDefectRate
              );

              exportData.push(defectRow);
              rowIndex++;
            }
          );
        });
    });

    const totalRow = ["Total"];
    activeHours.forEach((hour, colIndex) => {
      const { rate = 0, hasCheckedQty = false } =
        (data || {}).total?.[hour] || {};
      totalRow.push(hasCheckedQty ? `${rate.toFixed(2)}%` : "");
      ratesMap.set(`${rowIndex}-${colIndex + 1}`, hasCheckedQty ? rate : 0);
    });

    const grandRate = (data || {}).grand?.rate || 0;
    totalRow.push(`${grandRate.toFixed(2)}%`);
    ratesMap.set(`${rowIndex}-${activeHours.length + 1}`, grandRate);

    exportData.push(totalRow);

    return { exportData, ratesMap };
  };

  // Download Excel function (keeping original logic)
  const downloadExcel = () => {
    try {
      const { exportData, ratesMap } = prepareExportData();
      const ws = XLSX.utils.aoa_to_sheet(exportData);

      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellAddress]) continue;

          const rate = ratesMap.get(`${row}-${col}`) || 0;
          const isHeaderRow = row === 2 || row === 3;
          const isTotalRow = row === range.e.r;

          ws[cellAddress].s = {
            border: {
              top: { style: "thin", color: { auto: 1 } },
              bottom: { style: "thin", color: { auto: 1 } },
              left: { style: "thin", color: { auto: 1 } },
              right: { style: "thin", color: { auto: 1 } }
            },
            fill: {
              fgColor: {
                rgb:
                  isHeaderRow || isTotalRow
                    ? "ADD8E6"
                    : rate > 0
                    ? getBackgroundColorHex(rate)
                    : row === 0 || row === 1
                    ? "FFFFFF"
                    : "E5E7EB"
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
      XLSX.utils.book_append_sheet(wb, ws, "Trend Analysis Line");
      XLSX.writeFile(wb, "TrendAnalysisLine.xlsx");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      alert("Failed to download Excel. Please check the console for details.");
    }
  };

  // Download PDF function (keeping original logic but simplified)
  const downloadPDF = () => {
    try {
      const { exportData, ratesMap } = prepareExportData();
      const doc = new jsPDF({ orientation: "landscape" });

      autoTable(doc, {
        head: [exportData[2], exportData[3]],
        body: exportData.slice(4),
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
        columnStyles: {
          0: { halign: "left" }
        },
        didParseCell: (data) => {
          const rowIndex = data.row.index + 4;
          const colIndex = data.column.index;
          const rate = ratesMap.get(`${rowIndex}-${colIndex}`) || 0;

          if (data.section === "body" && rate > 0) {
            data.cell.styles.fillColor = getBackgroundColorRGB(rate);
            data.cell.styles.textColor = getFontColorRGB(rate);
          }
        },
        didDrawPage: (data) => {
          doc.text("QC2 Defect Rate by Line No and MO No - Hour Trend", 14, 10);
        }
      });

      doc.save("TrendAnalysisLine.pdf");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please check the console for details.");
    }
  };

  // Add error boundary fallback if data is invalid
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="mt-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <BarChart3 className="text-gray-600 dark:text-gray-400" size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            QC2 Defect Rate Analysis
          </h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300">No data available</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="mt-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Activity className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  QC2 Defect Rate Trend Analysis
                </h2>
                <p className="text-blue-100 text-sm">Line & Manufacturing Order Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
              >
                <Filter size={16} />
                <span className="text-sm">Info</span>
              </button>
              
              {/* Export Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={downloadExcel}
                  title="Download as Excel"
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={downloadPDF}
                  title="Download as PDF"
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <File size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          {showFilters && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Filter className="text-blue-200" size={16} />
                <span className="text-blue-200 text-sm font-medium">Analysis Information:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-100">
                <div>
                  <span className="font-medium">Lines:</span> {lineNos.length}
                </div>
                <div>
                  <span className="font-medium">Active Hours:</span> {activeHours.length}
                </div>
                <div>
                  <span className="font-medium">Filter:</span> {lineNoFilter || 'All Lines'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Activity className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Lines</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{lineNos.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <Clock className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Hours</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{activeHours.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                  <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Critical Items</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {lineNos.reduce((count, lineNo) => {
                      const moNos = Object.keys((data || {})[lineNo] || {}).filter(key => key !== "totalRate");
                      return count + moNos.filter(moNo => isCritical(lineNo, moNo)).length;
                    }, 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                  <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Warning Items</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {lineNos.reduce((count, lineNo) => {
                      const moNos = Object.keys((data || {})[lineNo] || {}).filter(key => key !== "totalRate");
                      return count + moNos.filter(moNo => !isCritical(lineNo, moNo) && isWarning(lineNo, moNo)).length;
                    }, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            {/* Enhanced Table Header */}
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-b-2 border-gray-200 dark:border-gray-600 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">
                  <div className="flex items-center space-x-2">
                    <Package size={16} />
                    <span>Line / MO Number</span>
                  </div>
                </th>
                {activeHours.map((hour) => (
                  <th
                    key={hour}
                    className="py-2 px-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300 border-b-2 border-gray-200 dark:border-gray-600 min-w-[80px]"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{hourLabels[hour]}</span>
                      <span className="text-xs font-medium">{periodLabels[hour]}</span>
                    </div>
                  </th>
                ))}
                <th className="py-4 px-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300 border-b-2 border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-center space-x-1">
                    <TrendingUp size={16} />
                    <span>Total</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {lineNos.map((lineNo, lineIndex) => (
                <React.Fragment key={lineNo}>
                  {/* Line No Row */}
                  <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    expandedLines[lineNo] 
                      ? "bg-blue-600 dark:bg-blue-700 text-white" 
                      : lineIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-700/50'
                  }`}>
                    <td className={`py-4 px-6 border-r border-gray-200 dark:border-gray-600 sticky left-0 z-10 ${
                      expandedLines[lineNo] ? "bg-blue-600 dark:bg-blue-700" : "bg-inherit"
                    }`}>
                      <div className="flex items-center space-x-3">
                                                <button
                          onClick={() => toggleLine(lineNo)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        >
                          {expandedLines[lineNo] ? (
                            <ChevronDown className={`${expandedLines[lineNo] ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} size={16} />
                          ) : (
                            <ChevronRight className={`${expandedLines[lineNo] ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} size={16} />
                          )}
                        </button>
                        
                        <div className="flex flex-col">
                          <span className={`font-bold ${expandedLines[lineNo] ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                            Line {lineNo}
                          </span>
                        </div>
                      </div>
                    </td>

                    {activeHours.map((hour) => {
                      const totalRate = Object.values((data || {})[lineNo] || {}).reduce(
                        (sum, moData) =>
                          sum + (moData[hour]?.rate || 0) * (moData[hour]?.checkedQty || 0),
                        0
                      );

                      const totalCheckedQty = Object.values((data || {})[lineNo] || {}).reduce(
                        (sum, moData) => sum + (moData[hour]?.checkedQty || 0),
                        0
                      );

                      const rate = totalCheckedQty > 0 ? totalRate / totalCheckedQty : 0;
                      const hasCheckedQty = totalCheckedQty > 0;

                      return (
                        <td
                          key={hour}
                          className={`py-4 px-4 text-center text-sm font-medium border border-gray-200 dark:border-gray-600 ${
                            expandedLines[lineNo]
                              ? "bg-blue-600 dark:bg-blue-700 text-white"
                              : hasCheckedQty
                              ? getBackgroundColor(rate)
                              : "bg-gray-50 dark:bg-gray-700"
                          } ${
                            expandedLines[lineNo]
                              ? "text-white"
                              : hasCheckedQty
                              ? getFontColor(rate)
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {hasCheckedQty ? (
                            <div className="flex flex-col items-center">
                              <span className="font-bold">{rate.toFixed(2)}%</span>
                              {rate > 3 && !expandedLines[lineNo] && (
                                <div className="w-2 h-2 bg-red-500 rounded-full mt-1"></div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </td>
                      );
                    })}

                    <td
                      className={`py-4 px-4 text-center text-sm font-bold border border-gray-200 dark:border-gray-600 ${
                        expandedLines[lineNo]
                          ? "bg-blue-600 dark:bg-blue-700 text-white"
                          : getBackgroundColor((data || {})[lineNo]?.totalRate || 0)
                      } ${
                        expandedLines[lineNo]
                          ? "text-white"
                          : getFontColor((data || {})[lineNo]?.totalRate || 0)
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-lg">{((data || {})[lineNo]?.totalRate || 0).toFixed(2)}%</span>
                        {!expandedLines[lineNo] && (
                          <span className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusBadge((data || {})[lineNo]?.totalRate || 0)}`}>
                            {(data || {})[lineNo]?.totalRate > 3 ? 'High' : (data || {})[lineNo]?.totalRate >= 2 ? 'Medium' : 'Low'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* MO No Rows (Expanded) */}
                  {expandedLines[lineNo] &&
                    Object.keys((data || {})[lineNo] || {})
                      .filter((key) => key !== "totalRate")
                      .sort()
                      .map((moNo) => (
                        <React.Fragment key={`${lineNo}-${moNo}`}>
                          <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            expandedMos[`${lineNo}-${moNo}`]
                              ? "bg-gray-700 dark:bg-gray-600 text-white"
                              : "bg-blue-50/30 dark:bg-blue-900/20"
                          }`}>
                            <td className={`py-4 px-6 pl-16 border-r border-gray-200 dark:border-gray-600 sticky left-0 z-10 ${
                              expandedMos[`${lineNo}-${moNo}`] ? "bg-gray-700 dark:bg-gray-600" : "bg-blue-50/30 dark:bg-blue-900/20"
                            }`}>
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => toggleMo(lineNo, moNo)}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-500 rounded transition-colors"
                                >
                                  {expandedMos[`${lineNo}-${moNo}`] ? (
                                    <ChevronDown className={`${expandedMos[`${lineNo}-${moNo}`] ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} size={16} />
                                  ) : (
                                    <ChevronRight className={`${expandedMos[`${lineNo}-${moNo}`] ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} size={16} />
                                  )}
                                </button>
                                
                                <div className="flex flex-col">
                                  <span className={`font-bold ${expandedMos[`${lineNo}-${moNo}`] ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {moNo}
                                  </span>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {isCritical(lineNo, moNo) && (
                                      <span className="inline-flex items-center px-2 py-1 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 text-xs font-bold rounded-full">
                                        <AlertTriangle size={10} className="mr-1" />
                                        Critical
                                      </span>
                                    )}
                                    {!isCritical(lineNo, moNo) && isWarning(lineNo, moNo) && (
                                      <span className="inline-flex items-center px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 text-xs font-bold rounded-full">
                                        <AlertCircle size={10} className="mr-1" />
                                        Warning
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {activeHours.map((hour) => {
                              const { rate = 0, hasCheckedQty = false } =
                                ((data || {})[lineNo] || {})[moNo]?.[hour] || {};

                              return (
                                <td
                                  key={hour}
                                  className={`py-4 px-4 text-center text-sm font-medium border border-gray-200 dark:border-gray-600 ${
                                    expandedMos[`${lineNo}-${moNo}`]
                                      ? "bg-gray-700 dark:bg-gray-600 text-white"
                                      : hasCheckedQty
                                      ? getBackgroundColor(rate)
                                      : "bg-gray-50 dark:bg-gray-700"
                                  } ${
                                    expandedMos[`${lineNo}-${moNo}`]
                                      ? "text-white"
                                      : hasCheckedQty
                                      ? getFontColor(rate)
                                      : "text-gray-500 dark:text-gray-400"
                                  }`}
                                >
                                  {hasCheckedQty ? (
                                    <div className="flex flex-col items-center">
                                      <span className="font-bold">{rate.toFixed(2)}%</span>
                                      {rate > 3 && !expandedMos[`${lineNo}-${moNo}`] && (
                                        <div className="w-2 h-2 bg-red-500 rounded-full mt-1"></div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                              );
                            })}

                            <td
                              className={`py-4 px-4 text-center text-sm font-bold border border-gray-200 dark:border-gray-600 ${
                                expandedMos[`${lineNo}-${moNo}`]
                                  ? "bg-gray-700 dark:bg-gray-600 text-white"
                                  : getBackgroundColor((data || {})[lineNo]?.[moNo]?.totalRate || 0)
                              } ${
                                expandedMos[`${lineNo}-${moNo}`]
                                  ? "text-white"
                                  : getFontColor((data || {})[lineNo]?.[moNo]?.totalRate || 0)
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                <span className="text-lg">{((data || {})[lineNo]?.[moNo]?.totalRate || 0).toFixed(2)}%</span>
                                {!expandedMos[`${lineNo}-${moNo}`] && (
                                  <span className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusBadge((data || {})[lineNo]?.[moNo]?.totalRate || 0)}`}>
                                    {(data || {})[lineNo]?.[moNo]?.totalRate > 3 ? 'High' : (data || {})[lineNo]?.[moNo]?.totalRate >= 2 ? 'Medium' : 'Low'}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Defect Rows (Expanded) */}
                          {expandedMos[`${lineNo}-${moNo}`] &&
                            ((defectTrendsByLineMo[lineNo] || {})[moNo] || []).map((defect) => (
                              <tr
                                key={`${lineNo}-${moNo}-${defect.defectName}`}
                                className="bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <td className="py-3 px-6 pl-20 border-r border-gray-200 dark:border-gray-600 sticky left-0 bg-gray-50 dark:bg-gray-700/50 z-10">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full"></div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                      {defect.defectName}
                                    </span>
                                  </div>
                                </td>

                                {activeHours.map((hour) => {
                                  const { rate = 0 } = defect.trends[hour] || {};
                                  const hasData = rate > 0;

                                  return (
                                    <td
                                      key={hour}
                                      className={`py-3 px-4 text-center text-sm border border-gray-200 dark:border-gray-600 ${
                                        hasData ? getBackgroundColor(rate) : "bg-gray-50 dark:bg-gray-700"
                                      } ${hasData ? getFontColor(rate) : "text-gray-500 dark:text-gray-400"}`}
                                    >
                                      {hasData ? (
                                        <span className="font-medium">{rate.toFixed(2)}%</span>
                                      ) : (
                                        <span className="text-gray-400 dark:text-gray-500">—</span>
                                      )}
                                    </td>
                                  );
                                })}

                                <td
                                  className={`py-3 px-4 text-center text-sm font-bold border border-gray-200 dark:border-gray-600 ${getBackgroundColor(
                                    defect.totalDefectRate || 0
                                  )} ${getFontColor(defect.totalDefectRate || 0)}`}
                                >
                                  {(defect.totalDefectRate || 0).toFixed(2)}%
                                </td>
                              </tr>
                            ))}
                        </React.Fragment>
                      ))}
                </React.Fragment>
              ))}

              {/* Final Total Row */}
              <tr className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 font-bold border-t-2 border-blue-300 dark:border-blue-600">
                <td className="py-4 px-6 text-sm font-bold text-gray-800 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 sticky left-0 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 z-10">
                  <div className="flex items-center space-x-2">
                    <BarChart3 size={16} />
                    <span>TOTAL</span>
                  </div>
                </td>

                {activeHours.map((hour) => {
                  const { rate = 0, hasCheckedQty = false } =
                    (data || {}).total?.[hour] || {};

                  return (
                    <td
                      key={hour}
                      className={`py-4 px-4 text-center text-sm font-bold border border-gray-300 dark:border-gray-600 ${
                        hasCheckedQty ? getBackgroundColor(rate) : "bg-white dark:bg-gray-800"
                      } ${hasCheckedQty ? getFontColor(rate) : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {hasCheckedQty ? (
                        <span className="text-lg">{rate.toFixed(2)}%</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                  );
                })}

                <td
                  className={`py-4 px-4 text-center text-sm font-bold border border-gray-300 dark:border-gray-600 ${getBackgroundColor(
                    (data || {}).grand?.rate || 0
                  )} ${getFontColor((data || {}).grand?.rate || 0)}`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xl">{((data || {}).grand?.rate || 0).toFixed(2)}%</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">Overall</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Legend:</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Good (&lt; 2%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Moderate (2-3%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">High (&gt; 3%)</span>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Click on Line/MO numbers to expand details
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default TrendAnalysisLine;

