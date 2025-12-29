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
  Filter
} from "lucide-react";

const TrendAnalysisMO = ({ data, appliedFilters = {} }) => {
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

  // Sort MO Nos consistently
  const moNos = Object.keys(data)
    .filter((key) => key !== "total" && key !== "grand")
    .sort();

  // Filter hours with at least one non-zero value for any MO No
  const activeHours = Object.keys(hourLabels).filter((hour) => {
    return (
      moNos.some((moNo) => data[moNo][hour]?.rate > 0) ||
      (data.total && data.total[hour]?.rate > 0)
    );
  });

  // State for expanded rows
  const [expandedRows, setExpandedRows] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Toggle expansion for a specific MO No
  const toggleRow = (moNo) => {
    setExpandedRows((prev) => ({
      ...prev,
      [moNo]: !prev[moNo]
    }));
  };

  // Function to determine background color based on defect rate
  const getBackgroundColor = (rate) => {
    if (rate > 3) return "bg-red-50 border-red-200";
    if (rate >= 2) return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  };

  // Function to determine font color based on defect rate
  const getFontColor = (rate) => {
    if (rate > 3) return "text-red-700";
    if (rate >= 2) return "text-yellow-700";
    return "text-green-700";
  };

  // Function to get status badge styling
  const getStatusBadge = (rate) => {
    if (rate > 3) return "bg-red-100 text-red-800 border-red-300";
    if (rate >= 2) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  // Function to check for 3 consecutive periods with defect rate > 3% (Critical)
  const isCritical = (moNo) => {
    const rates = activeHours.map((hour) => {
      const { rate, hasCheckedQty } = data[moNo][hour] || {
        rate: 0,
        hasCheckedQty: false
      };
      return hasCheckedQty ? rate : 0;
    });

    for (let i = 0; i <= rates.length - 3; i++) {
      if (rates[i] > 3 && rates[i + 1] > 3 && rates[i + 2] > 3) return true;
    }
    return false;
  };

  // Function to check for 2 consecutive periods with defect rate > 3% (Warning)
  const isWarning = (moNo) => {
    const rates = activeHours.map((hour) => {
      const { rate, hasCheckedQty } = data[moNo][hour] || {
        rate: 0,
        hasCheckedQty: false
      };
      return hasCheckedQty ? rate : 0;
    });

    for (let i = 0; i <= rates.length - 2; i++) {
      if (rates[i] > 3 && rates[i + 1] > 3) return true;
    }
    return false;
  };

  // Memoized defect trends to prevent recalculation unless data changes
  const defectTrendsByMoNo = useMemo(() => {
    const trends = {};

    moNos.forEach((moNo) => {
      const defectsByName = {};
      const totalCheckedQty = activeHours.reduce(
        (sum, hour) => sum + (data[moNo][hour]?.checkedQty || 0),
        0
      );

      activeHours.forEach((hour) => {
        const hourData = data[moNo][hour] || { checkedQty: 0, defects: [] };
        hourData.defects
          .filter((defect) => defect.name && defect.name !== "No Defect")
          .forEach((defect) => {
            if (!defectsByName[defect.name]) {
              defectsByName[defect.name] = { totalCount: 0, trends: {} };
            }
            defectsByName[defect.name].trends[hour] = {
              count: defect.count,
              rate: defect.rate
            };
            defectsByName[defect.name].totalCount += defect.count;
          });
      });

      trends[moNo] = Object.entries(defectsByName)
        .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
        .map(([name, { totalCount, trends }]) => ({
          name,
          totalRate:
            totalCheckedQty > 0 ? (totalCount / totalCheckedQty) * 100 : 0,
          trends
        }));
    });

    return trends;
  }, [data, moNos, activeHours]);

  // Prepare data for Excel and PDF export with all levels expanded
  const prepareExportData = () => {
    const exportData = [];

    moNos.forEach((moNo) => {
      const moRow = {
        "MO No": `${moNo}${
          isCritical(moNo) ? " (Critical)" : isWarning(moNo) ? " (Warning)" : ""
        }`
      };

      activeHours.forEach((hour) => {
        const { rate, hasCheckedQty } = data[moNo][hour] || {
          rate: 0,
          hasCheckedQty: false
        };
        moRow[`${hourLabels[hour]} ${periodLabels[hour]}`] = hasCheckedQty
          ? `${rate.toFixed(2)}%`
          : "";
      });

      moRow["Total"] = `${data[moNo].totalRate.toFixed(2)}%`;
      exportData.push(moRow);

      defectTrendsByMoNo[moNo].forEach((defect) => {
        const defectRow = { "MO No": `  ${defect.name}` };

        activeHours.forEach((hour) => {
          const { rate = 0 } = defect.trends[hour] || {};
          defectRow[`${hourLabels[hour]} ${periodLabels[hour]}`] =
            rate > 0 ? `${rate.toFixed(2)}%` : "";
        });

        defectRow["Total"] = `${defect.totalRate.toFixed(2)}%`;
        exportData.push(defectRow);
      });
    });

    const totalRow = { "MO No": "Total" };
    activeHours.forEach((hour) => {
      const { rate, hasCheckedQty } = data.total[hour] || {
        rate: 0,
        hasCheckedQty: false
      };
      totalRow[`${hourLabels[hour]} ${periodLabels[hour]}`] = hasCheckedQty
        ? `${rate.toFixed(2)}%`
        : "";
    });
    totalRow["Total"] = `${(data.grand?.rate || 0).toFixed(2)}%`;
    exportData.push(totalRow);

    return exportData;
  };

  // Format applied filters for display
  const formatFilters = () => {
    return Object.entries(appliedFilters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  // Download functions remain the same
  const downloadExcel = () => {
    const exportData = prepareExportData();
    const ws = XLSX.utils.json_to_sheet([
      {
        "QC2 Defect Rate by MO No - Hour Trend":
          "Applied Filters: " + formatFilters()
      },
      {},
      ...XLSX.utils.sheet_add_json([], exportData, {
        skipHeader: true,
        origin: -1
      })
    ]);

    ws["!cols"] = [
      { wch: 20 },
      ...activeHours.map(() => ({ wch: 10 })),
      { wch: 10 }
    ];

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        if (!ws[cellRef]) continue;
        ws[cellRef].s = { font: { name: "Calibri", sz: 11 } };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TrendAnalysis");
    XLSX.writeFile(wb, "TrendAnalysisMO.xlsx");
  };

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFont("helvetica");
    doc.setFontSize(12);
    doc.text("QC2 Defect Rate by MO No - Hour Trend", 14, 10);
    doc.setFontSize(10);
    doc.text(`Applied Filters: ${formatFilters()}`, 14, 20);

    const headers = [
      "MO No",
      ...activeHours.map((hour) => `${hourLabels[hour]} ${periodLabels[hour]}`),
      "Total"
    ];

    const body = prepareExportData().map((row) => Object.values(row));

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2, font: "helvetica" },
      columnStyles: {
        0: { cellWidth: 40 },
        [activeHours.length + 1]: { cellWidth: 15 }
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index > 0) {
          const text = data.cell.text[0];
          const rate = text ? parseFloat(text.replace("%", "")) : 0;
          if (rate > 0) {
            data.cell.styles.fillColor =
              rate > 3
                ? [255, 204, 204]
                : rate >= 2
                ? [255, 255, 204]
                : [204, 255, 204];
          }
        }
      }
    });

    doc.save("TrendAnalysisMO.pdf");
  };

  return (
    <div className="mt-6 bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BarChart3 className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                QC2 Defect Rate Trend Analysis
              </h2>
              <p className="text-blue-100 text-sm">Manufacturing Order Hour-wise Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
            >
              <Filter size={16} />
              <span className="text-sm">Filters</span>
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

        {/* Applied Filters */}
        {showFilters && Object.keys(appliedFilters).length > 0 && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Filter className="text-blue-200" size={16} />
              <span className="text-blue-200 text-sm font-medium">Applied Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(appliedFilters).map(([key, value]) => (
                <span
                  key={key}
                  className="px-2 py-1 bg-white/20 text-white text-xs rounded-full border border-white/30"
                >
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total MO Numbers</p>
                <p className="text-xl font-bold text-gray-900">{moNos.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Hours</p>
                <p className="text-xl font-bold text-gray-900">{activeHours.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Critical MOs</p>
                <p className="text-xl font-bold text-gray-900">
                  {moNos.filter(moNo => isCritical(moNo)).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Warning MOs</p>
                <p className="text-xl font-bold text-gray-900">
                  {moNos.filter(moNo => !isCritical(moNo) && isWarning(moNo)).length}
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
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="py-4 px-6 text-left text-sm font-bold text-gray-700 border-b-2 border-gray-200 sticky left-0 bg-gray-50 z-10">
                <div className="flex items-center space-x-2">
                  <BarChart3 size={16} />
                  <span>MO Number</span>
                </div>
              </th>
              {activeHours.map((hour) => (
                <th
                  key={hour}
                  className="py-2 px-4 text-center text-sm font-bold text-gray-700 border-b-2 border-gray-200 min-w-[80px]"
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">{hourLabels[hour]}</span>
                    <span className="text-xs font-medium">{periodLabels[hour]}</span>
                  </div>
                </th>
              ))}
              <th className="py-4 px-4 text-center text-sm font-bold text-gray-700 border-b-2 border-gray-200">
                <div className="flex items-center justify-center space-x-1">
                  <TrendingUp size={16} />
                  <span>Total</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {moNos.map((moNo, index) => (
              <React.Fragment key={moNo}>
                {/* Main MO Row */}
                <tr className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="py-4 px-6 border-r border-gray-200 sticky left-0 bg-inherit z-10">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleRow(moNo)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {expandedRows[moNo] ? (
                          <ChevronDown className="text-gray-600" size={16} />
                        ) : (
                          <ChevronRight className="text-gray-600" size={16} />
                        )}
                      </button>
                      
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{moNo}</span>
                        <div className="flex items-center space-x-2 mt-1">
                          {isCritical(moNo) && (
                            <span className="inline-flex items-center px-2 py-1 bg-red-100 border border-red-300 text-red-800 text-xs font-bold rounded-full">
                              <AlertTriangle size={12} className="mr-1" />
                              Critical
                            </span>
                          )}
                          {!isCritical(moNo) && isWarning(moNo) && (
                            <span className="inline-flex items-center px-2 py-1 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-bold rounded-full">
                              <AlertCircle size={12} className="mr-1" />
                              Warning
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {activeHours.map((hour) => {
                    const { rate, hasCheckedQty } = data[moNo][hour] || {
                      rate: 0,
                      hasCheckedQty: false
                    };

                    return (
                      <td
                        key={hour}
                        className={`py-4 px-4 text-center text-sm font-medium border border-gray-200 ${
                          hasCheckedQty ? getBackgroundColor(rate) : "bg-gray-50"
                        } ${hasCheckedQty ? getFontColor(rate) : "text-gray-500"}`}
                      >
                        {hasCheckedQty ? (
                          <div className="flex flex-col items-center">
                            <span className="font-bold">{rate.toFixed(2)}%</span>
                            {rate > 3 && (
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-1"></div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    );
                  })}

                  <td
                    className={`py-4 px-4 text-center text-sm font-bold border border-gray-200 ${getBackgroundColor(
                      data[moNo].totalRate
                    )} ${getFontColor(data[moNo].totalRate)}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-lg">{data[moNo].totalRate.toFixed(2)}%</span>
                      <span className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusBadge(data[moNo].totalRate)}`}>
                        {data[moNo].totalRate > 3 ? 'High' : data[moNo].totalRate >= 2 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Expanded Defect Rows */}
                {expandedRows[moNo] && (
                  <>
                    {defectTrendsByMoNo[moNo].map((defect) => (
                      <tr key={`${moNo}-${defect.name}`} className="bg-blue-50/30">
                        <td className="py-3 px-6 pl-16 border-r border-gray-200 sticky left-0 bg-blue-50/30 z-10">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-sm text-gray-700 font-medium">{defect.name}</span>
                          </div>
                        </td>

                        {activeHours.map((hour) => {
                          const { rate = 0 } = defect.trends[hour] || {};
                          const hasData = rate > 0;

                          return (
                            <td
                              key={hour}
                              className={`py-3 px-4 text-center text-sm border border-gray-200 ${
                                hasData ? getBackgroundColor(rate) : "bg-gray-50"
                              } ${hasData ? getFontColor(rate) : "text-gray-500"}`}
                            >
                              {hasData ? (
                                <span className="font-medium">{rate.toFixed(2)}%</span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          );
                        })}

                        <td
                          className={`py-3 px-4 text-center text-sm font-bold border border-gray-200 ${getBackgroundColor(
                            defect.totalRate
                          )} ${getFontColor(defect.totalRate)}`}
                        >
                          {defect.totalRate.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </React.Fragment>
            ))}

            {/* Total Row */}
            <tr className="bg-gradient-to-r from-blue-100 to-blue-200 font-bold border-t-2 border-blue-300">
              <td className="py-4 px-6 text-sm font-bold text-gray-800 border-r border-gray-300 sticky left-0 bg-gradient-to-r from-blue-100 to-blue-200 z-10">
                <div className="flex items-center space-x-2">
                  <BarChart3 size={16} />
                  <span>TOTAL</span>
                </div>
              </td>

              {activeHours.map((hour) => {
                const { rate, hasCheckedQty } = data.total[hour] || {
                  rate: 0,
                  hasCheckedQty: false
                };

                return (
                  <td
                    key={hour}
                    className={`py-4 px-4 text-center text-sm font-bold border border-gray-300 ${
                      hasCheckedQty ? getBackgroundColor(rate) : "bg-white"
                    } ${hasCheckedQty ? getFontColor(rate) : "text-gray-700"}`}
                  >
                    {hasCheckedQty ? (
                      <span className="text-lg">{rate.toFixed(2)}%</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                );
              })}

              <td
                className={`py-4 px-4 text-center text-sm font-bold border border-gray-300 ${getBackgroundColor(
                  data.grand?.rate || 0
                )} ${getFontColor(data.grand?.rate || 0)}`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-xl">{(data.grand?.rate || 0).toFixed(2)}%</span>
                  <span className="text-xs text-gray-600 mt-1">Overall</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h3 className="text-sm font-medium text-gray-700">Legend:</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-xs text-gray-600">Good (&lt; 2%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span className="text-xs text-gray-600">Moderate (2-3%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                <span className="text-xs text-gray-600">High (&gt; 3%)</span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Click on MO numbers to expand defect details
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysisMO;
