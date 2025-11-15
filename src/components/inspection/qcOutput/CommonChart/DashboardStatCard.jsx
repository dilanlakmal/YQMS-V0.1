import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { TrendingUp, TrendingDown } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  ChartDataLabels
);

const getDefectRateColorClasses = (rate) => {
  if (rate === null || rate === undefined)
    return {
      gradient: "from-blue-500 to-blue-600",
      line: "#3B82F6",
      bg: "bg-blue-50 dark:bg-blue-900/20"
    };
  if (rate > 5)
    return {
      gradient: "from-red-500 to-red-600",
      line: "#EF4444",
      bg: "bg-red-50 dark:bg-red-900/20"
    };
  if (rate >= 3)
    return {
      gradient: "from-orange-500 to-orange-600",
      line: "#F97316",
      bg: "bg-orange-50 dark:bg-orange-900/20"
    };
  return {
    gradient: "from-green-500 to-green-600",
    line: "#22C55E",
    bg: "bg-green-50 dark:bg-green-900/20"
  };
};

const DashboardStatCard = ({
  title,
  value,
  rate,
  icon: Icon,
  trendData = [],
  isTrendChart = false,
  insideQty,
  outsideQty
}) => {
  const { gradient, line, bg } = getDefectRateColorClasses(rate);
  const isTrendAvailable = trendData && trendData.length > 0;
  const isDark = document.documentElement.classList.contains("dark");

  // Calculate trend direction
  const getTrendDirection = () => {
    if (!isTrendAvailable || trendData.length < 2) return null;
    const current =
      trendData[trendData.length - 1].value ||
      trendData[trendData.length - 1].rate;
    const previous =
      trendData[trendData.length - 2].value ||
      trendData[trendData.length - 2].rate;
    return current > previous ? "up" : "down";
  };

  const trendDirection = getTrendDirection();

  // Configuration for the main line chart (Defect Rate)
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 15,
        right: 15,
        top: 35,
        bottom: 5
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: isDark
          ? "rgba(30, 30, 30, 0.95)"
          : "rgba(255, 255, 255, 0.95)",
        titleColor: isDark ? "#fff" : "#1f2937",
        bodyColor: isDark ? "#e5e7eb" : "#4b5563",
        borderColor: line,
        borderWidth: 2,
        padding: 12,
        displayColors: false,
        titleFont: { size: 12, weight: "600" },
        bodyFont: { size: 13, weight: "500" },
        callbacks: {
          title: (context) => trendData[context[0].dataIndex]?.date || "",
          label: (context) => `Rate: ${context.raw.toFixed(2)}%`
        }
      },
      datalabels: {
        display: true,
        align: "top",
        anchor: "end",
        offset: 8,
        color: isDark ? "#e5e7eb" : "#1f2937",
        font: {
          size: 11,
          weight: "bold"
        },
        formatter: (value) => `${value.toFixed(2)}%`,
        backgroundColor: isDark
          ? "rgba(30, 30, 30, 0.85)"
          : "rgba(255, 255, 255, 0.85)",
        borderRadius: 4,
        padding: {
          top: 4,
          bottom: 4,
          left: 6,
          right: 6
        },
        borderColor: line,
        borderWidth: 1
      }
    },
    scales: {
      y: {
        display: false,
        beginAtZero: true,
        grace: "15%"
      },
      x: {
        display: true,
        grid: { display: false },
        ticks: {
          font: { size: 10, weight: "600" },
          color: isDark ? "#9CA3AF" : "#6B7280",
          padding: 5
        }
      }
    },
    elements: {
      line: { tension: 0.4 },
      point: {
        radius: 6,
        hoverRadius: 8,
        borderWidth: 3,
        hitRadius: 15
      }
    }
  };

  const lineChartData = {
    labels: isTrendAvailable ? trendData.map((d) => d.date.slice(5)) : [],
    datasets: [
      {
        label: "Rate",
        data: isTrendAvailable ? trendData.map((d) => d.rate) : [],
        borderColor: line,
        borderWidth: 3,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 120);
          gradient.addColorStop(0, `${line}50`);
          gradient.addColorStop(1, `${line}05`);
          return gradient;
        },
        fill: true,
        pointBackgroundColor: "#fff",
        pointBorderColor: line,
        pointBorderWidth: 3,
        pointHoverBackgroundColor: line,
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 3
      }
    ]
  };

  // Mini area chart configuration (Output/Defects)
  const areaChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 5,
        right: 5,
        top: 25,
        bottom: 5
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      datalabels: {
        display: true,
        align: "top",
        anchor: "end",
        offset: 6,
        color: isDark ? "#e5e7eb" : "#1f2937",
        font: {
          size: 10,
          weight: "bold"
        },
        formatter: (value) => {
          if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`;
          }
          return value.toLocaleString();
        },
        backgroundColor: isDark
          ? "rgba(30, 30, 30, 0.85)"
          : "rgba(255, 255, 255, 0.85)",
        borderRadius: 4,
        padding: {
          top: 3,
          bottom: 3,
          left: 5,
          right: 5
        },
        borderColor: line,
        borderWidth: 1
      }
    },
    scales: {
      y: { display: false, beginAtZero: true, grace: "20%" },
      x: { display: false }
    },
    elements: {
      line: { tension: 0.4, borderWidth: 2.5 },
      point: {
        radius: 5,
        hoverRadius: 7,
        borderWidth: 2.5
      }
    }
  };

  const areaChartData = {
    labels: isTrendAvailable ? trendData.map((d) => d.date) : [],
    datasets: [
      {
        data: isTrendAvailable ? trendData.map((d) => d.value) : [],
        borderColor: line,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 60);
          gradient.addColorStop(0, `${line}40`);
          gradient.addColorStop(1, `${line}05`);
          return gradient;
        },
        fill: true,
        pointBackgroundColor: "#fff",
        pointBorderColor: line,
        pointBorderWidth: 2.5,
        pointHoverBackgroundColor: line,
        pointHoverBorderColor: "#fff"
      }
    ]
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
      {/* Decorative gradient blob */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-500`}
      ></div>

      <div className="relative p-5">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg bg-gradient-to-br ${gradient} shadow-md`}
            >
              {Icon && <Icon className="w-5 h-5 text-white" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {title}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-0.5">
                {value}
              </p>
            </div>
          </div>

          {/* Trend indicator for non-chart cards */}
          {!isTrendChart && trendDirection && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                trendDirection === "up"
                  ? "bg-green-50 dark:bg-green-900/20"
                  : "bg-red-50 dark:bg-red-900/20"
              }`}
            >
              {trendDirection === "up" ? (
                <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              )}
            </div>
          )}
        </div>

        {/* Content Section - Inside/Outside Stats OR Mini Chart */}
        {insideQty !== undefined && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase">
                  Inside
                </p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  {insideQty.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase">
                  Outside
                </p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {outsideQty.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mini area chart for Output/Defects cards */}
        {!isTrendChart && !insideQty && isTrendAvailable && (
          <div className="mb-4 h-20">
            <Line options={areaChartOptions} data={areaChartData} />
          </div>
        )}
      </div>

      {/* Bottom Section - Trend Chart or Daily Values */}
      <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3 bg-gray-50/50 dark:bg-gray-800/50">
        {isTrendChart ? (
          // Line chart for Defect Rate - INCREASED HEIGHT
          isTrendAvailable ? (
            <div className="h-28">
              <Line options={lineChartOptions} data={lineChartData} />
            </div>
          ) : (
            <div className="h-28 flex items-center justify-center text-xs text-gray-400">
              No trend data available
            </div>
          )
        ) : isTrendAvailable ? (
          // Last 5 days values display
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-gray-400"></span>
              Last 5 Days
            </p>
            <div className="flex items-end justify-between gap-1.5">
              {trendData.map((day, idx) => {
                const isLatest = idx === trendData.length - 1;
                const val = day.value || 0;
                const maxVal = Math.max(...trendData.map((d) => d.value || 0));
                const heightPercent = maxVal > 0 ? (val / maxVal) * 100 : 0;

                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1.5"
                  >
                    <div className="relative w-full flex flex-col items-center">
                      <span
                        className={`text-xs font-bold mb-1 px-1.5 py-0.5 rounded ${
                          isLatest
                            ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {val >= 1000
                          ? `${(val / 1000).toFixed(1)}k`
                          : val.toLocaleString()}
                      </span>
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          isLatest
                            ? `bg-gradient-to-t ${gradient}`
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                        style={{
                          height: `${Math.max(heightPercent * 0.5, 6)}px`
                        }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                      {day.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-20"></div>
        )}
      </div>
    </div>
  );
};

export default DashboardStatCard;
