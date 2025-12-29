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
import DailyTrendPop from "./DailyTrendPop";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target, 
  AlertTriangle,
  BarChart3,
  Activity,
  Loader,
  RefreshCw,
  Moon,
  Sun
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

const DailySummaryTrend = ({ filters }) => {
  const [dailyData, setDailyData] = useState([]);
  const [popUpData, setPopUpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDark, toggleDark] = useDarkMode();
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  // Fetch daily data from the server with applied filters
  const fetchDailyData = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/api/qc2-mo-summaries`, {
        params: { ...filters, groupByDate: "true" }
      });

      // Process data to calculate defect rate and top 5 defects
      const processedData = response.data.map((day) => {
        const defectRate =
          day.checkedQty > 0 ? (day.defectsQty / day.checkedQty) * 100 : 0;

        // Aggregate defects by name and calculate defect rate for each defect
        const defectCounts = {};
        day.defectArray.forEach((defect) => {
          if (defect.defectName) {
            defectCounts[defect.defectName] =
              (defectCounts[defect.defectName] || 0) + defect.totalCount;
          }
        });

        const topDefects = Object.entries(defectCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({
            name,
            count,
            defectRate: day.checkedQty > 0 ? (count / day.checkedQty) * 100 : 0
          }));

        return { ...day, defectRate, topDefects };
      });

      setDailyData(processedData);
    } catch (error) {
      console.error("Error fetching daily summary data:", error);
      setError("Failed to load trend data. Please try again.");
      setDailyData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyData(filters);
  }, [filters]);

  // Calculate statistics
  const statistics = React.useMemo(() => {
    if (dailyData.length === 0) return null;

    const rates = dailyData.map(d => d.defectRate);
    const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const maxRate = Math.max(...rates);
    const minRate = Math.min(...rates);
    const trend = rates.length > 1 ? rates[rates.length - 1] - rates[0] : 0;
    const daysAboveKPI = rates.filter(rate => rate > 3).length;

    return {
      avgRate: avgRate.toFixed(2),
      maxRate: maxRate.toFixed(2),
      minRate: minRate.toFixed(2),
      trend: trend.toFixed(2),
      daysAboveKPI,
      totalDays: rates.length
    };
  }, [dailyData]);

  // Determine fill color based on defect rate
  const getPointColor = (defectRate) => {
    if (defectRate > 3) return "#DC2626"; // Red-600
    if (defectRate >= 2 && defectRate <= 3) return "#F59E0B"; // Amber-500
    return "#059669"; // Emerald-600
  };

  // Chart data configuration with enhanced styling
  const chartData = {
    labels: dailyData.map((d) => d.inspection_date),
    datasets: [
      {
        label: "Defect Rate (%)",
        data: dailyData.map((d) => d.defectRate),
        borderColor: "#3B82F6", // Blue-500
        borderWidth: 3,
        backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointStyle: "circle",
        pointRadius: 8,
        pointHoverRadius: 12,
        pointBackgroundColor: dailyData.map((d) => getPointColor(d.defectRate)),
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 3,
        pointHoverBorderWidth: 4,
        datalabels: {
          align: "top",
          anchor: "end",
          formatter: (value) => `${value.toFixed(1)}%`,
          color: isDark ? "#F3F4F6" : "#374151",
          font: { size: 11, weight: "bold" },
          backgroundColor: isDark ? "rgba(31, 41, 55, 0.9)" : "rgba(255, 255, 255, 0.9)",
          borderColor: isDark ? "#4B5563" : "#E5E7EB",
          borderWidth: 1,
          borderRadius: 4,
          padding: 4
        }
      }
    ]
  };

  // Enhanced chart options with dark mode support
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          font: { size: 14, weight: "600" },
          color: isDark ? "#F3F4F6" : "#374151",
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: { enabled: false },
      datalabels: { display: true },
      annotation: {
        annotations: [
          {
            type: "line",
            scaleID: "y",
            value: 3,
            borderColor: "#DC2626",
            borderWidth: 3,
            borderDash: [8, 4],
            label: {
              content: "KPI Target: 3%",
              enabled: true,
              position: "end",
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              font: { size: 12, weight: "bold" },
              padding: 8,
              borderRadius: 6
            }
          }
        ]
      }
    },
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "Inspection Date",
          font: { size: 14, weight: "600" },
          color: isDark ? "#F3F4F6" : "#374151"
        },
        ticks: { 
          color: isDark ? "#9CA3AF" : "#6B7280",
          font: { size: 12 },
          maxRotation: 45
        },
        grid: { 
          display: true,
          color: isDark ? "#374151" : "#F3F4F6",
          drawBorder: false
        }
      },
      y: {
        title: {
          display: true,
          text: "Defect Rate (%)",
          font: { size: 14, weight: "600" },
          color: isDark ? "#F3F4F6" : "#374151"
        },
        ticks: { 
          color: isDark ? "#9CA3AF" : "#6B7280",
          font: { size: 12 },
          callback: function(value) {
            return value.toFixed(1) + '%';
          }
        },
        grid: { 
          display: true,
          color: isDark ? "#374151" : "#F3F4F6",
          drawBorder: false
        },
        beginAtZero: true,
        suggestedMax: Math.max(...dailyData.map((d) => d.defectRate), 3) + 1
      }
    }
  };

  // Handle mouse move to show/hide pop-up with dynamic positioning
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
        const date = chartData.labels[index];
        const data = dailyData.find((d) => d.inspection_date === date);

        // Get chart canvas position and dimensions
        const chartRect = chart.canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Mouse position relative to the chart
        let x = event.clientX - chartRect.left;
        let y = event.clientY - chartRect.top;

        // Pop-up dimensions
        const popupWidth = 400;
        const popupHeight = 250;

        // Determine if the mouse is on the left or right half of the chart
        const chartMidpoint = chartRect.width / 2;
        const mouseXRelative = x;

        // Adjust X position based on mouse location
        if (mouseXRelative > chartMidpoint) {
          x -= popupWidth + 10;
        } else {
          x += 10;
        }

        // Ensure X stays within container bounds
        if (x + popupWidth > containerRect.width) {
          x = containerRect.width - popupWidth - 10;
        } else if (x < 0) {
          x = 10;
        }

        // Adjust Y position to ensure the pop-up stays within the container
        if (y + popupHeight > containerRect.height) {
          y = containerRect.height - popupHeight - 10;
        } else if (y < 0) {
          y = 10;
        }

        // Convert back to absolute coordinates
        x += chartRect.left - containerRect.left;
        y += chartRect.top - containerRect.top;

        setPopUpData({ date, x, y, data });
      } else {
        setPopUpData(null);
      }
    }
  };

  const handleRefresh = () => {
    fetchDailyData(filters);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="text-center">
          <Loader className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading trend data...</p>
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Data
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (dailyData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
        <div className="text-center">
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BarChart3 className="text-gray-600 dark:text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No trend data found for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <BarChart3 className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Rate</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {statistics.avgRate}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                parseFloat(statistics.trend) > 0 
                  ? 'bg-red-100 dark:bg-red-900/50' 
                  : 'bg-green-100 dark:bg-green-900/50'
              }`}>
                {parseFloat(statistics.trend) > 0 ? (
                  <TrendingUp className="text-red-600 dark:text-red-400" size={20} />
                ) : (
                  <TrendingDown className="text-green-600 dark:text-green-400" size={20} />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Trend</p>
                <p className={`text-xl font-bold ${
                  parseFloat(statistics.trend) > 0 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {statistics.trend > 0 ? '+' : ''}{statistics.trend}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Above KPI</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {statistics.daysAboveKPI}/{statistics.totalDays}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Target className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Range</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {statistics.minRate}% - {statistics.maxRate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden transition-colors duration-300">
        {/* Chart Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg shadow-md">
                <Activity className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Daily Defect Rate Trend
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Hover over data points for detailed information
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleDark}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                title="Toggle Dark Mode"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                title="Refresh Data"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Chart Content */}
        <div className="p-6">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setPopUpData(null)}
            className="relative h-96 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-100 dark:border-gray-600 transition-colors duration-300"
          >
            <Line ref={chartRef} data={chartData} options={chartOptions} />
            
            {/* Custom Popup */}
            {popUpData && (
              <div
                className="absolute z-50 pointer-events-none"
                style={{
                  left: `${popUpData.x}px`,
                  top: `${popUpData.y}px`,
                }}
              >
                <DailyTrendPop date={popUpData.date} data={popUpData.data} />
              </div>
            )}
          </div>
        </div>

        {/* Chart Footer */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 transition-colors duration-300">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 dark:bg-green-500 rounded-full shadow-sm"></div>
                <span className="text-gray-600 dark:text-gray-400">Good (&lt; 2%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-500 dark:bg-amber-400 rounded-full shadow-sm"></div>
                <span className="text-gray-600 dark:text-gray-400">Moderate (2-3%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 dark:bg-red-500 rounded-full shadow-sm"></div>
                <span className="text-gray-600 dark:text-gray-400">High (&gt; 3%)</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <Calendar size={14} />
              <span>{dailyData.length} days of data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySummaryTrend;
