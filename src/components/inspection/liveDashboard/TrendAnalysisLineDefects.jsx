import React, { useMemo, useState } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  BarChart3,
  Filter,
  Activity,
  Bug,
  Target
} from "lucide-react";

const TrendAnalysisLineDefects = ({ data, lineNo }) => {
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

  // Sort and filter Line Nos consistently based on lineNo prop
  const lineNos = Object.keys(data)
    .filter((key) => key !== "total" && key !== "grand")
    .filter((key) => (lineNo ? key === lineNo : true))
    .sort();

  // Filter hours with at least one non-zero defect rate for any Line No
  const activeHours = Object.keys(hourLabels).filter((hour) =>
    lineNos.some((lineNo) => {
      const moNos = Object.keys(data[lineNo] || {});
      return moNos.some((moNo) =>
        (data[lineNo][moNo][hour]?.defects || []).some(
          (defect) => (defect.rate || 0) > 0
        )
      );
    })
  );

  // State for expanded rows (Line No)
  const [expandedLines, setExpandedLines] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Toggle expansion for Line No
  const toggleLine = (lineNo) =>
    setExpandedLines((prev) => ({ ...prev, [lineNo]: !prev[lineNo] }));

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

  // Memoized defect trends by Line No (aggregated across MOs)
  const defectTrendsByLine = useMemo(() => {
    const trends = {};

    lineNos.forEach((lineNo) => {
      const defectsByName = {};
      let totalCheckedQty = 0;

      const moNos = Object.keys(data[lineNo] || {});

      moNos.forEach((moNo) => {
        if (moNo !== "totalRate") {
          activeHours.forEach((hour) => {
            const hourData = data[lineNo][moNo][hour] || {
              checkedQty: 0,
              defects: []
            };

            totalCheckedQty += hourData.checkedQty || 0;

            hourData.defects.forEach((defect) => {
              if (!defectsByName[defect.name]) {
                defectsByName[defect.name] = {
                  totalCount: 0,
                  trends: Object.fromEntries(
                    activeHours.map((h) => [h, { count: 0, rate: 0 }])
                  )
                };
              }

              defectsByName[defect.name].trends[hour].count +=
                defect.count || 0;
              defectsByName[defect.name].totalCount += defect.count || 0;
            });
          });
        }
      });

      Object.keys(defectsByName).forEach((defectName) => {
        activeHours.forEach((hour) => {
          const hourCheckedQty = moNos.reduce(
            (sum, moNo) => sum + (data[lineNo][moNo][hour]?.checkedQty || 0),
            0
          );

          const defectCount = defectsByName[defectName].trends[hour].count;

          defectsByName[defectName].trends[hour].rate =
            hourCheckedQty > 0 ? (defectCount / hourCheckedQty) * 100 : 0;
        });

        defectsByName[defectName].totalDefectRate =
          totalCheckedQty > 0
            ? (defectsByName[defectName].totalCount / totalCheckedQty) * 100
            : 0;
      });

      trends[lineNo] = Object.entries(defectsByName)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([defectName, { totalCount, trends, totalDefectRate }]) => ({
          defectName,
          totalCount,
          totalDefectRate,
          trends
        }));
    });

    return trends;
  }, [data, lineNos, activeHours]);

  // Error boundary fallback if data is invalid or no lines match filter
  if (!data || Object.keys(data).length === 0 || lineNos.length === 0) {
    return (
      <div className="mt-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Bug className="text-gray-600 dark:text-gray-400" size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            QC2 Defect Analysis by Line
          </h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300">
          {lineNos.length === 0
            ? "No matching lines found"
            : "No data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Bug className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                QC2 Defect Analysis by Line
              </h2>
              <p className="text-purple-100 text-sm">Line-wise Defect Trend Analysis</p>
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
          </div>
        </div>

        {/* Info Panel */}
        {showFilters && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Filter className="text-purple-200" size={16} />
              <span className="text-purple-200 text-sm font-medium">Analysis Information:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-100">
              <div>
                <span className="font-medium">Lines:</span> {lineNos.length}
              </div>
              <div>
                <span className="font-medium">Active Hours:</span> {activeHours.length}
              </div>
              <div>
                <span className="font-medium">Filter:</span> {lineNo ? `Line ${lineNo}` : 'All Lines'}
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
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Activity className="text-purple-600 dark:text-purple-400" size={20} />
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
                <Bug className="text-red-600 dark:text-red-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Defects</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {lineNos.reduce((total, lineNo) => 
                    total + (defectTrendsByLine[lineNo] || []).length, 0
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Target className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Defect Rate</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {lineNos.length > 0 ? (
                    lineNos.reduce((sum, lineNo) => sum + (data[lineNo]?.totalRate || 0), 0) / lineNos.length
                  ).toFixed(2) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <div className="max-h-[800px] overflow-y-auto">
          <table className="min-w-full table-fixed">
            {/* Enhanced Table Header */}
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 sticky top-0 z-20">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-b-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 min-w-[200px]">
                  <div className="flex items-center space-x-2">
                    <Bug size={16} />
                    <span>Line / Defect</span>
                  </div>
                </th>
                {activeHours.map((hour) => (
                  <th
                    key={`header-${hour}`}
                    className="py-2 px-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300 border-b-2 border-gray-200 dark:border-gray-600 min-w-[80px]"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{hourLabels[hour]}</span>
                      <span className="text-xs font-medium">{periodLabels[hour]}</span>
                    </div>
                  </th>
                ))}
                <th className="py-4 px-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300 border-b-2 border-gray-200 dark:border-gray-600 min-w-[80px]">
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
                      ? "bg-purple-600 dark:bg-purple-700 text-white" 
                      : lineIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-700/50'
                  }`}>
                    <td className={`py-4 px-6 border-r border-gray-200 dark:border-gray-600 min-w-[200px] ${
                      expandedLines[lineNo] ? "bg-purple-600 dark:bg-purple-700" : "bg-inherit"
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
                        
                        <div className="flex items-center space-x-2">
                          <div className={`p-2 rounded-lg ${expandedLines[lineNo] ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900/50'}`}>
                            <Activity className={`${expandedLines[lineNo] ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className={`font-bold ${expandedLines[lineNo] ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                              Line {lineNo}
                            </span>
                            <span className={`text-xs ${expandedLines[lineNo] ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'}`}>
                              {(defectTrendsByLine[lineNo] || []).length} defects
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {activeHours.map((hour) => {
                      const totalRate = Object.values(data[lineNo] || {}).reduce(
                        (sum, moData) =>
                          sum + (moData[hour]?.rate || 0) * (moData[hour]?.checkedQty || 0),
                        0
                      );

                      const totalCheckedQty = Object.values(data[lineNo] || {}).reduce(
                        (sum, moData) => sum + (moData[hour]?.checkedQty || 0),
                        0
                      );

                      const rate = totalCheckedQty > 0 ? totalRate / totalCheckedQty : 0;
                      const hasCheckedQty = totalCheckedQty > 0;

                      return (
                        <td
                          key={`line-${lineNo}-${hour}`}
                          className={`py-4 px-4 text-center text-sm font-medium border border-gray-200 dark:border-gray-600 min-w-[80px] ${
                            expandedLines[lineNo]
                              ? "bg-purple-600 dark:bg-purple-700 text-white"
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
                      className={`py-4 px-4 text-center text-sm font-bold border border-gray-200 dark:border-gray-600 min-w-[80px] ${
                        expandedLines[lineNo]
                          ? "bg-purple-600 dark:bg-purple-700 text-white"
                          : getBackgroundColor(data[lineNo]?.totalRate || 0)
                      } ${
                        expandedLines[lineNo]
                          ? "text-white"
                          : getFontColor(data[lineNo]?.totalRate || 0)
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-lg">{(data[lineNo]?.totalRate || 0).toFixed(2)}%</span>
                        {!expandedLines[lineNo] && (
                          <span className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusBadge(data[lineNo]?.totalRate || 0)}`}>
                            {data[lineNo]?.totalRate > 3 ? 'High' : data[lineNo]?.totalRate >= 2 ? 'Medium' : 'Low'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Defect Rows (Expanded) */}
                  {expandedLines[lineNo] &&
                    (defectTrendsByLine[lineNo] || []).map((defect, defectIndex) => (
                      <tr
                        key={`${lineNo}-${defect.defectName}`}
                        className="bg-purple-50/30 dark:bg-purple-900/20 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors"
                      >
                        <td className="py-3 px-6 pl-16 border-r border-gray-200 dark:border-gray-600 bg-purple-50/30 dark:bg-purple-900/20 min-w-[200px]">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              defectIndex === 0 ? 'bg-red-500 dark:bg-red-600' : 
                              defectIndex === 1 ? 'bg-orange-500 dark:bg-orange-600' : 
                              defectIndex === 2 ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-gray-500 dark:bg-gray-600'
                            }`}>
                              {defectIndex + 1}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {defect.defectName}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Count: {defect.totalCount}
                              </span>
                            </div>
                          </div>
                        </td>

                        {activeHours.map((hour) => {
                          const { rate = 0 } = defect.trends[hour] || {};
                          const hasData = rate > 0;

                          return (
                            <td
                              key={`defect-${lineNo}-${defect.defectName}-${hour}`}
                              className={`py-3 px-4 text-center text-sm border border-gray-200 dark:border-gray-600 min-w-[80px] ${
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
                          className={`py-3 px-4 text-center text-sm font-bold border border-gray-200 dark:border-gray-600 min-w-[80px] ${getBackgroundColor(
                            defect.totalDefectRate || 0
                          )} ${getFontColor(defect.totalDefectRate || 0)}`}
                        >
                          <div className="flex flex-col items-center">
                            <span>{(defect.totalDefectRate || 0).toFixed(2)}%</span>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-1">
                              <div 
                                className={`h-1 rounded-full ${
                                  defect.totalDefectRate > 3 ? 'bg-red-500' :
                                  defect.totalDefectRate >= 2 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(defect.totalDefectRate * 10, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))}

              {/* Final Total Row */}
              <tr className="bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-700 font-bold border-t-2 border-purple-300 dark:border-purple-600">
                <td className="py-4 px-6 text-sm font-bold text-gray-800 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-700 min-w-[200px]">
                  <div className="flex items-center space-x-2">
                    <BarChart3 size={16} />
                    <span>TOTAL</span>
                  </div>
                </td>

                {activeHours.map((hour) => {
                  const { rate = 0, hasCheckedQty = false } = data.total?.[hour] || {};

                  return (
                    <td
                      key={`total-${hour}`}
                      className={`py-4 px-4 text-center text-sm font-bold border border-gray-300 dark:border-gray-600 min-w-[80px] ${
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
                  className={`py-4 px-4 text-center text-sm font-bold border border-gray-300 dark:border-gray-600 min-w-[80px] ${getBackgroundColor(
                    data.grand?.rate || 0
                  )} ${getFontColor(data.grand?.rate || 0)}`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xl">{(data.grand?.rate || 0).toFixed(2)}%</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">Overall</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
            Click on Line numbers to expand defect details
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysisLineDefects;

