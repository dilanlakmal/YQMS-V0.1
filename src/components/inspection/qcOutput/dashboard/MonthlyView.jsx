// ===== MonthlyView.jsx =====
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Loader2,
  AlertTriangle,
  Filter,
  BarChart3,
  Activity,
  Calendar,
  TrendingUp
} from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { API_BASE_URL } from "../../../../../config";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

const reactSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: "0.75rem",
    border: "2px solid",
    borderColor: state.isFocused ? "#6366f1" : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
    padding: "0.25rem",
    backgroundColor: "var(--color-bg-secondary)",
    "&:hover": { borderColor: "#6366f1" }
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.75rem",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    zIndex: 50
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#6366f1"
      : state.isFocused
      ? "#eef2ff"
      : "transparent",
    color: state.isSelected ? "#ffffff" : "#1f2937",
    "&:hover": { backgroundColor: state.isSelected ? "#6366f1" : "#eef2ff" }
  })
};

const formatDateForAPI = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefectRateColor = (rate) => {
  if (rate > 5)
    return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300";
  if (rate >= 3)
    return "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300";
  return "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300";
};

const getDefectRateColorClasses = (rate) => {
  if (rate > 5) return { gradient: "from-red-500 to-red-600", line: "#EF4444" };
  if (rate >= 3)
    return { gradient: "from-orange-500 to-orange-600", line: "#F97316" };
  return { gradient: "from-green-500 to-green-600", line: "#22C55E" };
};

// Monthly Stats Card with Table
const MonthlyStatCard = ({
  title,
  value,
  icon: Icon,
  trendData = [],
  rate
}) => {
  const { gradient } = getDefectRateColorClasses(rate);

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-5 rounded-full -mr-16 -mt-16`}
      ></div>

      <div className="relative p-5">
        <div className="flex items-center gap-3 mb-4">
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

        {trendData && trendData.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Last 5 Months
            </p>
            <div className="space-y-1.5">
              {trendData.slice(-5).map((month, idx) => (
                <div
                  key={`${month.year}-${month.month}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
                >
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {month.monthLabel}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {typeof month.value === "number"
                      ? month.value >= 1000
                        ? `${(month.value / 1000).toFixed(1)}k`
                        : month.value.toLocaleString()
                      : typeof month.rate === "number"
                      ? `${month.rate.toFixed(2)}%`
                      : "0"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Month Selector Component
const MonthSelector = ({ selectedMonths, onMonthToggle, selectedYear }) => {
  const months = [
    { num: 1, name: "Jan" },
    { num: 2, name: "Feb" },
    { num: 3, name: "Mar" },
    { num: 4, name: "Apr" },
    { num: 5, name: "May" },
    { num: 6, name: "Jun" },
    { num: 7, name: "Jul" },
    { num: 8, name: "Aug" },
    { num: 9, name: "Sep" },
    { num: 10, name: "Oct" },
    { num: 11, name: "Nov" },
    { num: 12, name: "Dec" }
  ];

  return (
    <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
      {months.map((month) => {
        const isSelected = selectedMonths.includes(month.num);
        return (
          <button
            key={month.num}
            onClick={() => onMonthToggle(month.num)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
              isSelected
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {month.name}
          </button>
        );
      })}
    </div>
  );
};

// Monthly Summary Table
const MonthlySummaryTable = ({
  data,
  activeView,
  setActiveView,
  filters,
  selectedYear
}) => {
  const [showDetails, setShowDetails] = useState(true);
  const [sortConfig, setSortConfig] = useState({ type: "month", order: "asc" });

  const handleSort = (sortType) => {
    setSortConfig((prev) => ({
      type: sortType,
      order: prev.type === sortType && prev.order === "asc" ? "desc" : "asc"
    }));
  };

  const tableData = useMemo(() => {
    let items = [];
    const sourceMap = {
      "Line-MO": "daily_line_MO_summary",
      Line: "daily_line_summary",
      MO: "daily_mo_summary",
      Buyer: "daily_buyer_summary"
    };
    const sourceKey = sourceMap[activeView];

    data.forEach((month) => {
      (month[sourceKey] || []).forEach((item) => {
        if (
          (!filters.lineNo || item.lineNo === filters.lineNo.value) &&
          (!filters.moNo || item.MONo === filters.moNo.value) &&
          (!filters.buyer || item.Buyer === filters.buyer.value)
        ) {
          const checkedQty = Math.max(item.CheckedQtyT38, item.CheckedQtyT39);
          const defectRate =
            checkedQty > 0 ? (item.totalDefectsQty / checkedQty) * 100 : 0;
          items.push({
            ...item,
            year: month.year,
            month: month.month,
            monthLabel: month.monthLabel,
            checkedQty,
            defectRate
          });
        }
      });
    });

    const sortedItems = [...items].sort((a, b) => {
      const order = sortConfig.order === "asc" ? 1 : -1;
      switch (sortConfig.type) {
        case "month":
          const yearCompare = a.year - b.year;
          if (yearCompare !== 0) return order * yearCompare;
          return order * (a.month - b.month);
        case "month-line":
          const yearCompare2 = a.year - b.year;
          if (yearCompare2 !== 0) return order * yearCompare2;
          const monthCompare = a.month - b.month;
          if (monthCompare !== 0) return order * monthCompare;
          return (
            order * ((parseInt(a.lineNo) || 0) - (parseInt(b.lineNo) || 0))
          );
        case "month-mo":
          const yearCompare3 = a.year - b.year;
          if (yearCompare3 !== 0) return order * yearCompare3;
          const monthCompare2 = a.month - b.month;
          if (monthCompare2 !== 0) return order * monthCompare2;
          return order * (a.MONo || "").localeCompare(b.MONo || "");
        case "defect":
          return order * (b.defectRate - a.defectRate);
        default:
          return 0;
      }
    });

    return sortedItems;
  }, [data, activeView, filters, sortConfig]);

  const headers = useMemo(() => {
    const baseHeaders = {
      "Line-MO": [
        "Year",
        "Month",
        "Line",
        "MO",
        "Checked",
        "Inside",
        "Outside",
        "Defects",
        "Rate"
      ],
      Line: [
        "Year",
        "Month",
        "Line",
        "Checked",
        "Inside",
        "Outside",
        "Defects",
        "Rate"
      ],
      MO: [
        "Year",
        "Month",
        "MO",
        "Checked",
        "Inside",
        "Outside",
        "Defects",
        "Rate"
      ],
      Buyer: [
        "Year",
        "Month",
        "Buyer",
        "Checked",
        "Inside",
        "Outside",
        "Defects",
        "Rate"
      ]
    };
    if (showDetails) {
      Object.keys(baseHeaders).forEach((key) =>
        baseHeaders[key].push("Details")
      );
    }
    return baseHeaders;
  }, [showDetails]);

  const getAvailableSorts = () => {
    const commonSorts = ["month", "defect"];
    if (activeView.includes("Line")) return ["month", "month-line", "defect"];
    if (activeView.includes("MO")) return ["month", "month-mo", "defect"];
    return commonSorts;
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">
              Monthly Summary View
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {getAvailableSorts().map((sortType) => (
              <button
                key={sortType}
                onClick={() => handleSort(sortType)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                  sortConfig.type === sortType
                    ? "bg-white text-indigo-600 shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {sortType === "month" && "Month"}
                {sortType === "month-line" && "Month-Line"}
                {sortType === "month-mo" && "Month-MO"}
                {sortType === "defect" && "Defect Rate"}
                {sortConfig.type === sortType && (
                  <span className="text-xs">
                    ({sortConfig.order.toUpperCase()})
                  </span>
                )}
              </button>
            ))}
            <div className="w-px h-8 bg-white/20 mx-1"></div>
            {["Line-MO", "Line", "MO", "Buyer"].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeView === view
                    ? "bg-white text-purple-600 shadow-lg"
                    : "text-white hover:bg-white/20"
                }`}
              >
                {view}
              </button>
            ))}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm bg-white/20 text-white hover:bg-white/30"
            >
              {showDetails ? "Hide Details" : "Show Details"}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
            <tr>
              {headers[activeView].map((h) => (
                <th
                  key={h}
                  className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {tableData.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors"
              >
                <td className="px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {row.year}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-purple-600 dark:text-purple-400">
                  {row.monthLabel}
                </td>
                {activeView.includes("Line") && (
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md font-medium">
                      {row.lineNo}
                    </span>
                  </td>
                )}
                {activeView.includes("MO") && (
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md font-medium">
                      {row.MONo}
                    </span>
                  </td>
                )}
                {activeView.includes("Buyer") && (
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md font-medium">
                      {row.Buyer}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900 dark:text-gray-100">
                  {row.checkedQty}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                  {row.CheckedQtyT39}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                  {row.CheckedQtyT38}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full font-bold">
                    {row.totalDefectsQty}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span
                    className={`px-3 py-1 rounded-full font-bold text-xs ${getDefectRateColor(
                      row.defectRate
                    )}`}
                  >
                    {row.defectRate.toFixed(2)}%
                  </span>
                </td>
                {showDetails && (
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {(row.DefectArray || []).map((d) => {
                        const individualRate =
                          row.checkedQty > 0
                            ? (d.defectQty / row.checkedQty) * 100
                            : 0;
                        return (
                          <div
                            key={d.defectCode}
                            className="flex items-center justify-between gap-2 text-xs bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded"
                          >
                            <span className="text-gray-700 dark:text-gray-300">
                              {d.defectName}{" "}
                              <span className="font-semibold">
                                (×{d.defectQty})
                              </span>
                            </span>
                            <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                              {individualRate.toFixed(2)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Top Defects Comparison Matrix
const TopDefectsComparison = ({
  topDefects,
  monthlyDefectData,
  selectedMonths
}) => {
  const [topN, setTopN] = useState(5);
  const topNOptions = [3, 5, 7, 10];

  const topDefectNames = topDefects.slice(0, topN).map((d) => d.name);

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">
              Top Defects Comparison
            </h2>
          </div>
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg p-1">
            {topNOptions.map((n) => (
              <button
                key={n}
                onClick={() => setTopN(n)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  topN === n
                    ? "bg-white text-red-600 shadow-lg"
                    : "text-white hover:bg-white/20"
                }`}
              >
                Top {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                Defect Name
              </th>
              {selectedMonths
                .sort((a, b) => a - b)
                .map((month) => (
                  <th
                    key={month}
                    className="px-4 py-3 text-center text-sm font-bold text-gray-900 dark:text-white"
                  >
                    {
                      [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec"
                      ][month - 1]
                    }
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {topDefectNames.map((defectName, idx) => (
              <tr
                key={defectName}
                className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white font-bold text-xs">
                      {idx + 1}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {defectName}
                    </span>
                  </div>
                </td>
                {selectedMonths
                  .sort((a, b) => a - b)
                  .map((month) => {
                    const monthData = monthlyDefectData.find(
                      (m) => m.month === month
                    );
                    const defect = monthData?.defects.find(
                      (d) => d.name === defectName
                    );
                    const rate = defect?.rate || 0;
                    return (
                      <td key={month} className="px-4 py-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full font-bold text-xs ${getDefectRateColor(
                            rate
                          )}`}
                        >
                          {rate.toFixed(2)}%
                        </span>
                      </td>
                    );
                  })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Performance Comparison Chart
const PerformanceComparisonChart = ({
  chartData,
  selectedMonths,
  activeMetric
}) => {
  const isDark = document.documentElement.classList.contains("dark");
  const [viewType, setViewType] = useState("Line");

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      title: {
        display: true,
        text: `${activeMetric} Performance Comparison Across Months`,
        font: { size: 16, weight: "bold" },
        color: isDark ? "#E5E7EB" : "#1F2937"
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Defect Rate (%)",
          font: { size: 12, weight: "bold" },
          color: isDark ? "#9CA3AF" : "#4B5563"
        },
        grid: { color: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" },
        ticks: { color: isDark ? "#9CA3AF" : "#4B5563" }
      },
      x: {
        grid: { display: false },
        ticks: { color: isDark ? "#9CA3AF" : "#4B5563" }
      }
    }
  };

  const colors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
    "#06B6D4",
    "#84CC16"
  ];

  const monthLabels = selectedMonths
    .sort((a, b) => a - b)
    .map(
      (m) =>
        [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec"
        ][m - 1]
    );

  const datasets = Object.keys(chartData)
    .slice(0, 10)
    .map((key, idx) => ({
      label: key,
      data: selectedMonths
        .sort((a, b) => a - b)
        .map((month) => {
          const monthData = chartData[key]?.find((m) => m.month === month);
          return monthData?.rate || 0;
        }),
      backgroundColor: colors[idx],
      borderColor: colors[idx],
      borderWidth: 2,
      tension: 0.4
    }));

  const chartJSData = {
    labels: monthLabels,
    datasets: datasets
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">
              Performance Analytics
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-1">
            {["Line", "MO", "Buyer"].map((view) => (
              <button
                key={view}
                onClick={() => setViewType(view)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewType === view
                    ? "bg-white text-purple-600 shadow-lg"
                    : "text-white hover:bg-white/20"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-6 h-96">
        <Line options={chartOptions} data={chartJSData} />
      </div>
    </div>
  );
};

// Main Monthly View Component
const MonthlyView = ({ selectedYear, onYearChange }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState([1, 2, 3]);
  const [activeView, setActiveView] = useState("Line-MO");
  const [filters, setFilters] = useState({
    lineNo: null,
    moNo: null,
    buyer: null
  });
  const [filterOptions, setFilterOptions] = useState({
    lines: [],
    mos: [],
    buyers: []
  });

  const handleMonthToggle = (month) => {
    setSelectedMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month].sort((a, b) => a - b)
    );
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31);

      const response = await axios.get(
        `${API_BASE_URL}/api/qc1-summary/dashboard-data`,
        {
          params: {
            startDate: formatDateForAPI(startDate),
            endDate: formatDateForAPI(endDate)
          }
        }
      );

      setData(response.data);
    } catch (err) {
      setError("Failed to fetch monthly data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const aggregateDataByMonth = useCallback((dailyData) => {
    const monthMap = new Map();

    dailyData.forEach((day) => {
      const date = new Date(day.inspectionDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthKey = `${year}-${month}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          year,
          month,
          monthLabel: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
          ][month - 1],
          inspectionDate: day.inspectionDate,
          daily_full_summary: [],
          daily_line_MO_summary: [],
          daily_line_summary: [],
          daily_mo_summary: [],
          daily_buyer_summary: []
        });
      }

      const monthData = monthMap.get(monthKey);
      [
        "daily_full_summary",
        "daily_line_MO_summary",
        "daily_line_summary",
        "daily_mo_summary",
        "daily_buyer_summary"
      ].forEach((key) => {
        (day[key] || []).forEach((item) => monthData[key].push(item));
      });
    });

    const consolidatedMonths = Array.from(monthMap.values()).map((month) => ({
      ...month,
      daily_full_summary: consolidateItems(month.daily_full_summary),
      daily_line_MO_summary: consolidateItems(month.daily_line_MO_summary, [
        "lineNo",
        "MONo"
      ]),
      daily_line_summary: consolidateItems(month.daily_line_summary, [
        "lineNo"
      ]),
      daily_mo_summary: consolidateItems(month.daily_mo_summary, ["MONo"]),
      daily_buyer_summary: consolidateItems(month.daily_buyer_summary, [
        "Buyer"
      ])
    }));

    return consolidatedMonths.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, []);

  const consolidateItems = (items, keyFields = ["lineNo", "MONo", "Buyer"]) => {
    const consolidatedMap = new Map();

    items.forEach((item) => {
      const key = keyFields.map((field) => item[field] || "N/A").join("|");

      if (!consolidatedMap.has(key)) {
        consolidatedMap.set(key, {
          lineNo: item.lineNo,
          MONo: item.MONo,
          Buyer: item.Buyer,
          CheckedQtyT38: 0,
          CheckedQtyT39: 0,
          totalDefectsQty: 0,
          DefectArray: []
        });
      }

      const consolidated = consolidatedMap.get(key);
      consolidated.CheckedQtyT38 += item.CheckedQtyT38 || 0;
      consolidated.CheckedQtyT39 += item.CheckedQtyT39 || 0;
      consolidated.totalDefectsQty += item.totalDefectsQty || 0;

      (item.DefectArray || []).forEach((defect) => {
        const existingDefect = consolidated.DefectArray.find(
          (d) => d.defectCode === defect.defectCode
        );
        if (existingDefect) {
          existingDefect.defectQty += defect.defectQty;
        } else {
          consolidated.DefectArray.push({ ...defect });
        }
      });
    });

    return Array.from(consolidatedMap.values());
  };

  const processedData = useMemo(() => {
    const monthlyData = aggregateDataByMonth(data);

    // Filter by selected months
    const filteredMonthlyData = monthlyData.filter((month) =>
      selectedMonths.includes(month.month)
    );

    let totalOutputT38 = 0,
      totalOutputT39 = 0,
      totalDefects = 0;
    const defectMap = new Map();
    const lineSummary = {},
      moSummary = {},
      buyerSummary = {};
    const monthlyDefectData = [];
    const linePerformanceData = {},
      moPerformanceData = {},
      buyerPerformanceData = {};

    filteredMonthlyData.forEach((month) => {
      const filteredFullSummary = (month.daily_full_summary || []).filter(
        (item) =>
          (!filters.lineNo || item.lineNo === filters.lineNo.value) &&
          (!filters.moNo || item.MONo === filters.moNo.value) &&
          (!filters.buyer || item.Buyer === filters.buyer.value)
      );

      let monthOutputT38 = 0,
        monthOutputT39 = 0,
        monthDefectsTotal = 0;
      const monthDefectMap = new Map();

      filteredFullSummary.forEach((item) => {
        totalOutputT38 += item.CheckedQtyT38;
        totalOutputT39 += item.CheckedQtyT39;
        totalDefects += item.totalDefectsQty;

        monthOutputT38 += item.CheckedQtyT38;
        monthOutputT39 += item.CheckedQtyT39;
        monthDefectsTotal += item.totalDefectsQty;

        (item.DefectArray || []).forEach((defect) => {
          defectMap.set(
            defect.defectName,
            (defectMap.get(defect.defectName) || 0) + defect.defectQty
          );
          monthDefectMap.set(
            defect.defectName,
            (monthDefectMap.get(defect.defectName) || 0) + defect.defectQty
          );
        });

        const updateSummary = (summaryObj, key, dataItem) => {
          if (!key) return;
          if (!summaryObj[key]) summaryObj[key] = { checked: 0, defects: 0 };
          summaryObj[key].checked += Math.max(
            dataItem.CheckedQtyT38,
            dataItem.CheckedQtyT39
          );
          summaryObj[key].defects += dataItem.totalDefectsQty;
        };

        updateSummary(lineSummary, item.lineNo, item);
        updateSummary(moSummary, item.MONo, item);
        updateSummary(buyerSummary, item.Buyer, item);

        // Track performance per line/mo/buyer per month
        if (item.lineNo) {
          if (!linePerformanceData[item.lineNo])
            linePerformanceData[item.lineNo] = [];
          const existingMonth = linePerformanceData[item.lineNo].find(
            (m) => m.month === month.month
          );
          if (existingMonth) {
            existingMonth.checked += Math.max(
              item.CheckedQtyT38,
              item.CheckedQtyT39
            );
            existingMonth.defects += item.totalDefectsQty;
          } else {
            linePerformanceData[item.lineNo].push({
              month: month.month,
              checked: Math.max(item.CheckedQtyT38, item.CheckedQtyT39),
              defects: item.totalDefectsQty
            });
          }
        }

        if (item.MONo) {
          if (!moPerformanceData[item.MONo]) moPerformanceData[item.MONo] = [];
          const existingMonth = moPerformanceData[item.MONo].find(
            (m) => m.month === month.month
          );
          if (existingMonth) {
            existingMonth.checked += Math.max(
              item.CheckedQtyT38,
              item.CheckedQtyT39
            );
            existingMonth.defects += item.totalDefectsQty;
          } else {
            moPerformanceData[item.MONo].push({
              month: month.month,
              checked: Math.max(item.CheckedQtyT38, item.CheckedQtyT39),
              defects: item.totalDefectsQty
            });
          }
        }

        if (item.Buyer) {
          if (!buyerPerformanceData[item.Buyer])
            buyerPerformanceData[item.Buyer] = [];
          const existingMonth = buyerPerformanceData[item.Buyer].find(
            (m) => m.month === month.month
          );
          if (existingMonth) {
            existingMonth.checked += Math.max(
              item.CheckedQtyT38,
              item.CheckedQtyT39
            );
            existingMonth.defects += item.totalDefectsQty;
          } else {
            buyerPerformanceData[item.Buyer].push({
              month: month.month,
              checked: Math.max(item.CheckedQtyT38, item.CheckedQtyT39),
              defects: item.totalDefectsQty
            });
          }
        }
      });

      const monthOutput = Math.max(monthOutputT38, monthOutputT39);
      const monthDefects = Array.from(monthDefectMap.entries()).map(
        ([name, qty]) => ({
          name,
          qty,
          rate: monthOutput > 0 ? (qty / monthOutput) * 100 : 0
        })
      );

      monthlyDefectData.push({
        month: month.month,
        monthLabel: month.monthLabel,
        defects: monthDefects
      });
    });

    // Calculate rates for performance data
    Object.keys(linePerformanceData).forEach((line) => {
      linePerformanceData[line] = linePerformanceData[line].map((m) => ({
        ...m,
        rate: m.checked > 0 ? (m.defects / m.checked) * 100 : 0
      }));
    });

    Object.keys(moPerformanceData).forEach((mo) => {
      moPerformanceData[mo] = moPerformanceData[mo].map((m) => ({
        ...m,
        rate: m.checked > 0 ? (m.defects / m.checked) * 100 : 0
      }));
    });

    Object.keys(buyerPerformanceData).forEach((buyer) => {
      buyerPerformanceData[buyer] = buyerPerformanceData[buyer].map((m) => ({
        ...m,
        rate: m.checked > 0 ? (m.defects / m.checked) * 100 : 0
      }));
    });

    const totalOutput = Math.max(totalOutputT38, totalOutputT39);
    const defectRate = totalOutput > 0 ? (totalDefects / totalOutput) * 100 : 0;

    const topDefects = Array.from(defectMap.entries())
      .map(([name, qty]) => ({
        name,
        qty,
        rate: totalOutput > 0 ? (qty / totalOutput) * 100 : 0
      }))
      .sort((a, b) => b.qty - a.qty);

    // Generate trend data for cards (last 5 months from all available data)
    const allMonthlyData = aggregateDataByMonth(data);
    const last5Months = allMonthlyData.slice(-5);

    const outputTrend = last5Months.map((month) => {
      const monthTotal = month.daily_full_summary.reduce(
        (sum, item) => sum + Math.max(item.CheckedQtyT38, item.CheckedQtyT39),
        0
      );
      return {
        year: month.year,
        month: month.month,
        monthLabel: month.monthLabel,
        value: monthTotal
      };
    });

    const defectsTrend = last5Months.map((month) => {
      const monthDefects = month.daily_full_summary.reduce(
        (sum, item) => sum + item.totalDefectsQty,
        0
      );
      return {
        year: month.year,
        month: month.month,
        monthLabel: month.monthLabel,
        value: monthDefects
      };
    });

    const rateTrend = last5Months.map((month) => {
      const monthTotal = month.daily_full_summary.reduce(
        (sum, item) => sum + Math.max(item.CheckedQtyT38, item.CheckedQtyT39),
        0
      );
      const monthDefects = month.daily_full_summary.reduce(
        (sum, item) => sum + item.totalDefectsQty,
        0
      );
      return {
        year: month.year,
        month: month.month,
        monthLabel: month.monthLabel,
        rate: monthTotal > 0 ? (monthDefects / monthTotal) * 100 : 0
      };
    });

    return {
      stats: {
        totalOutput,
        totalOutputT38,
        totalOutputT39,
        totalDefects,
        defectRate
      },
      topDefects,
      chartData: { lineSummary, moSummary, buyerSummary },
      tableData: filteredMonthlyData,
      monthlyDefectData,
      performanceData: {
        Line: linePerformanceData,
        MO: moPerformanceData,
        Buyer: buyerPerformanceData
      },
      trends: {
        output: outputTrend,
        defects: defectsTrend,
        defectRate: rateTrend
      }
    };
  }, [data, selectedMonths, filters, aggregateDataByMonth]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        <AlertTriangle className="mx-auto mb-2" />
        {error}
      </div>
    );
  }

  return (
    <>
      {/* Year and Month Selector */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 shadow-xl mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-white" />
          <h2 className="text-xl font-bold text-white">Select Year & Months</h2>
        </div>

        {/* Year Selector */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-white font-semibold">Year:</span>
          <div className="flex gap-2">
            {[2023, 2024, 2025, 2026].map((year) => (
              <button
                key={year}
                onClick={() => onYearChange(year)}
                className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 ${
                  selectedYear === year
                    ? "bg-white text-purple-600 shadow-lg"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Month Selector */}
        <div>
          <span className="text-white font-semibold mb-2 block">Months:</span>
          <MonthSelector
            selectedMonths={selectedMonths}
            onMonthToggle={handleMonthToggle}
            selectedYear={selectedYear}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MonthlyStatCard
          title="Total Output"
          value={processedData.stats.totalOutput.toLocaleString()}
          icon={BarChart3}
          trendData={processedData.trends.output}
        />
        <MonthlyStatCard
          title="Total Defects"
          value={processedData.stats.totalDefects.toLocaleString()}
          icon={AlertTriangle}
          trendData={processedData.trends.defects}
        />
        <MonthlyStatCard
          title="Overall Defect Rate"
          value={`${processedData.stats.defectRate.toFixed(2)}%`}
          rate={processedData.stats.defectRate}
          icon={Activity}
          trendData={processedData.trends.defectRate}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
            <Filter className="text-white" size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Filters
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            placeholder="Filter by Line..."
            options={filterOptions.lines}
            value={filters.lineNo}
            onChange={(val) => setFilters((prev) => ({ ...prev, lineNo: val }))}
            styles={reactSelectStyles}
            isClearable
          />
          <Select
            placeholder="Filter by MO..."
            options={filterOptions.mos}
            value={filters.moNo}
            onChange={(val) => setFilters((prev) => ({ ...prev, moNo: val }))}
            styles={reactSelectStyles}
            isClearable
          />
          <Select
            placeholder="Filter by Buyer..."
            options={filterOptions.buyers}
            value={filters.buyer}
            onChange={(val) => setFilters((prev) => ({ ...prev, buyer: val }))}
            styles={reactSelectStyles}
            isClearable
          />
        </div>
      </div>

      {/* Monthly Summary Table */}
      <div className="mb-6">
        <MonthlySummaryTable
          data={processedData.tableData}
          activeView={activeView}
          setActiveView={setActiveView}
          filters={filters}
          selectedYear={selectedYear}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TopDefectsComparison
          topDefects={processedData.topDefects}
          monthlyDefectData={processedData.monthlyDefectData}
          selectedMonths={selectedMonths}
        />
        <PerformanceComparisonChart
          chartData={processedData.performanceData.Line}
          selectedMonths={selectedMonths}
          activeMetric="Line"
        />
      </div>
    </>
  );
};

export default MonthlyView;
