import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import annotationPlugin from "chartjs-plugin-annotation";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import WeeklyTrendPop from "./WeeklyTrendPop";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Download,
  RefreshCw,
  Info,
  Zap,
  Eye,
  EyeOff
} from "lucide-react";

// Register Chart.js components and plugins
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
  annotationPlugin
);

const WeeklySummaryTrend = ({ filters }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [popUpData, setPopUpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showKPILine, setShowKPILine] = useState(true);
  const [showDataLabels, setShowDataLabels] = useState(true);
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  const fetchWeeklyData = async (filters = {}) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-mo-summaries`, {
        params: { ...filters, groupByWeek: "true" }
      });

      const processedData = response.data.map((week) => {
        const defectRate =
          week.checkedQty > 0 ? (week.defectsQty / week.checkedQty) * 100 : 0;

        const defectsCount = week.defectArray.reduce((acc, defect) => {
          if (defect?.defectName) {
            acc[defect.defectName] =
              (acc[defect.defectName] || 0) + (defect.totalCount || 0);
          }
          return acc;
        }, {});

        const topDefects = Object.entries(defectsCount)
          .map(([name, count]) => ({
            name,
            count,
            defectRate:
              week.checkedQty > 0 ? (count / week.checkedQty) * 100 : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        return {
          ...week,
          defectRate,
          topDefects,
          weekLabel: `W${week.weekInfo.weekNumber}: ${week.weekInfo.startDate}--${week.weekInfo.endDate}`,
          shortLabel: `W${week.weekInfo.weekNumber}`
        };
      });

      console.log("Processed data for chart:", processedData);
      setWeeklyData(processedData);
    } catch (error) {
      console.error("Error fetching weekly summary data:", error);
      setWeeklyData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData(filters);
  }, [filters]);

  // Calculate statistics
  const stats = {
    totalWeeks: weeklyData.length,
    avgDefectRate: weeklyData.length > 0 
      ? (weeklyData.reduce((sum, week) => sum + week.defectRate, 0) / weeklyData.length).toFixed(2)
      : 0,
    aboveKPI: weeklyData.filter(week => week.defectRate > 3).length,
    belowKPI: weeklyData.filter(week => week.defectRate <= 3).length,
    trend: weeklyData.length >= 2 
      ? weeklyData[weeklyData.length - 1].defectRate - weeklyData[weeklyData.length - 2].defectRate
      : 0,
    bestWeek: weeklyData.length > 0 
      ? weeklyData.reduce((min, week) => week.defectRate < min.defectRate ? week : min)
      : null,
    worstWeek: weeklyData.length > 0 
      ? weeklyData.reduce((max, week) => week.defectRate > max.defectRate ? week : max)
      : null
  };

  const getPointColor = (defectRate) => {
    if (defectRate > 3) return "#DC2626"; // Red-600
    if (defectRate >= 2 && defectRate <= 3) return "#F59E0B"; // Amber-500
    return "#059669"; // Emerald-600
  };

  const getStatusColor = (defectRate) => {
    if (defectRate > 3) return "text-red-600 dark:text-red-400";
    if (defectRate >= 2 && defectRate <= 3) return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  const chartData = {
    labels: weeklyData.map((d) => d.shortLabel),
    datasets: [
      {
        label: "Defect Rate (%)",
        data: weeklyData.map((d) => d.defectRate),
        borderColor: "rgba(59, 130, 246, 1)", // Blue-500
        borderWidth: 3,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointStyle: "circle",
        pointRadius: 8,
        pointHoverRadius: 12,
        pointBackgroundColor: weeklyData.map((d) => getPointColor(d.defectRate)),
        pointBorderColor: weeklyData.map((d) => getPointColor(d.defectRate)),
        pointBorderWidth: 3,
        pointHoverBorderWidth: 4,
        datalabels: {
          display: showDataLabels,
          align: "top",
          anchor: "end",
          formatter: (value) => `${value.toFixed(1)}%`,
          color: document.documentElement.classList.contains('dark') ? "#F3F4F6" : "#1F2937",
          font: { size: 11, weight: "bold" },
          backgroundColor: document.documentElement.classList.contains('dark') ? "rgba(17, 24, 39, 0.8)" : "rgba(255, 255, 255, 0.8)",
          borderColor: document.documentElement.classList.contains('dark') ? "#374151" : "#E5E7EB",
          borderWidth: 1,
          borderRadius: 4,
          padding: 4
        }
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          font: { size: 14, weight: "600" },
          color: document.documentElement.classList.contains('dark') ? "#F3F4F6" : "#1F2937",
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20
        }
      },
      tooltip: { enabled: false },
      datalabels: { display: showDataLabels },
      annotation: {
        annotations: showKPILine ? [
          {
            type: "line",
            scaleID: "y",
            value: 3,
            borderColor: "#DC2626",
            borderWidth: 2,
            borderDash: [8, 4],
            label: {
              content: "KPI Target: 3%",
              enabled: true,
              position: "end",
              backgroundColor: "rgba(220, 38, 38, 0.9)",
              color: "#FFFFFF",
              font: { size: 11, weight: "bold" },
              padding: 6,
              borderRadius: 4
            }
          }
        ] : []
      }
    },
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "Week",
          font: { size: 14, weight: "600" },
          color: document.documentElement.classList.contains('dark') ? "#F3F4F6" : "#1F2937"
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? "#D1D5DB" : "#6B7280",
          font: { size: 12, weight: "500" },
          padding: 8,
          maxRotation: 0,
          minRotation: 0
        },
        grid: { 
          display: true,
          color: document.documentElement.classList.contains('dark') ? "#374151" : "#F3F4F6",
          drawBorder: false
        },
        border: {
          color: document.documentElement.classList.contains('dark') ? "#4B5563" : "#E5E7EB"
        }
      },
      y: {
        title: {
          display: true,
          text: "Defect Rate (%)",
          font: { size: 14, weight: "600" },
          color: document.documentElement.classList.contains('dark') ? "#F3F4F6" : "#1F2937"
        },
        ticks: { 
          color: document.documentElement.classList.contains('dark') ? "#D1D5DB" : "#6B7280",
          font: { size: 12 },
          callback: function(value) {
            return value.toFixed(1) + '%';
          }
        },
        grid: { 
          display: true,
          color: document.documentElement.classList.contains('dark') ? "#374151" : "#F3F4F6",
          drawBorder: false
        },
        border: {
          color: document.documentElement.classList.contains('dark') ? "#4B5563" : "#E5E7EB"
        },
        beginAtZero: true,
        suggestedMax: Math.max(...weeklyData.map((d) => d.defectRate), 3) + 1
      }
    }
  };

  const handleMouseMove = (event) => {
    const chart = chartRef.current;
    const container = containerRef.current;
    
    if (chart && container) {
      const elements = chart.getElementsAtEventForMode(
        event,
        "nearest",
        { intersect: true },
        false
      );
      
      if (elements.length > 0) {
        const element = elements[0];
        const index = element.index;
        const weekLabel = chartData.labels[index];
        const data = weeklyData.find((d) => d.shortLabel === weekLabel);
        
        const chartRect = chart.canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        let x = event.clientX - chartRect.left;
        let y = event.clientY - chartRect.top;
        
        const popupWidth = 400;
        const popupHeight = 250;
        const chartMidpoint = chartRect.width / 2;
        const mouseXRelative = x;
        
        if (mouseXRelative > chartMidpoint) {
          x -= popupWidth + 10;
        } else {
          x += 10;
        }
        
        if (x + popupWidth > containerRect.width) {
          x = containerRect.width - popupWidth - 10;
        } else if (x < 0) {
          x = 10;
        }
        
        if (y + popupHeight > containerRect.height) {
          y = containerRect.height - popupHeight - 10;
        } else if (y < 0) {
          y = 10;
        }
        
        x += chartRect.left - containerRect.left;
        y += chartRect.top - containerRect.top;
        
        setPopUpData({ weekLabel: data.weekLabel, x, y, data });
      } else {
        setPopUpData(null);
      }
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Week', 'Defect Rate (%)', 'Checked Qty', 'Defects Qty', 'Status'],
      ...weeklyData.map(week => [
        week.weekLabel,
        week.defectRate.toFixed(2),
        week.checkedQty,
        week.defectsQty,
        week.defectRate > 3 ? 'Above KPI' : week.defectRate >= 2 ? 'Warning' : 'Good'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weekly-defect-trend.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Loading Weekly Trend Data</h3>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch the latest data...</p>
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
              <div className="p-2 bg-blue-500 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Weekly Defect Rate Trend
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Track weekly defect rate performance against KPI targets with detailed insights
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setShowDataLabels(!showDataLabels)}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  showDataLabels
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {showDataLabels ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                Labels
              </button>
              <button
                onClick={() => setShowKPILine(!showKPILine)}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  showKPILine
                    ? 'bg-red-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Target className="w-3 h-3 mr-1" />
                KPI
              </button>
            </div>

            <button
              onClick={exportData}
              className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>

            <button
              onClick={() => fetchWeeklyData(filters)}
              className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
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
                <p className={`text-2xl font-bold ${getStatusColor(parseFloat(stats.avgDefectRate))}`}>
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
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Above KPI</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.aboveKPI}</p>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Below KPI</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.belowKPI}</p>
              </div>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trend</p>
                <p className={`text-2xl font-bold ${stats.trend > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {stats.trend > 0 ? '+' : ''}{stats.trend.toFixed(1)}%
                </p>
              </div>
              <div className={`p-2 rounded-xl ${stats.trend > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                {stats.trend > 0 ? 
                  <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" /> :
                  <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                }
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Performance</p>
                <p className={`text-lg font-bold ${getStatusColor(parseFloat(stats.avgDefectRate))}`}>
                  {parseFloat(stats.avgDefectRate) <= 3 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Best/Worst Week Info */}
        {stats.bestWeek && stats.worstWeek && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Best Performance</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-300">
                    {stats.bestWeek.shortLabel}: {stats.bestWeek.defectRate.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">Needs Attention</p>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    {stats.worstWeek.shortLabel}: {stats.worstWeek.defectRate.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Chart Area */}
      <div className="p-6">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 shadow-inner">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setPopUpData(null)}
            style={{ position: "relative", height: "500px" }}
            className="relative"
          >
            <Line ref={chartRef} data={chartData} options={chartOptions} />
            
            {popUpData && (
              <div
                style={{
                  position: "absolute",
                  left: `${popUpData.x}px`,
                  top: `${popUpData.y}px`,
                  zIndex: 1000
                }}
                className="pointer-events-none"
              >
                <WeeklyTrendPop
                  weekLabel={popUpData.weekLabel}
                  data={popUpData.data}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-5 border-t border-gray-200 dark:border-gray-600">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-emerald-600 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Good (&lt;2%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-amber-500 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Warning (2-3%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-red-600 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Above KPI (&gt;3%)</span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Info className="w-3 h-3" />
              <span>Hover over points for details</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>•</span>
              <span>KPI Target: 3%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklySummaryTrend;
