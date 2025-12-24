import axios from "axios";
import { format, startOfWeek, endOfWeek } from "date-fns";
import {
  AlertTriangle,
  CheckSquare,
  Loader2,
  Percent,
  XCircle
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { API_BASE_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";
import { useTheme } from "../../../context/ThemeContext";

// --- Reusable Components (Slightly modified from Daily View) ---
const SummaryCard = ({ icon, title, value, bgColorClass, textColorClass }) => (
  <div className={`relative p-5 rounded-xl shadow-md ${bgColorClass}`}>
    <div className="flex items-center">
      <div className="absolute -left-2 -top-2 p-3 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
        {icon}
      </div>
      <div className="ml-12 text-right w-full">
        <p className={`text-sm font-medium ${textColorClass} opacity-90`}>
          {title}
        </p>
        <p className={`text-3xl font-bold ${textColorClass}`}>{value}</p>
      </div>
    </div>
  </div>
);

const FactorySummaryCard = ({ summaryData, getRateColorClass }) => (
  <div className="col-span-1 md:col-span-2 xl:col-span-4 bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 h-full">
    <h3 className="font-bold mb-4 text-gray-800 dark:text-gray-100">
      Factory Summary
    </h3>
    <div className="overflow-x-auto h-full">
      <div className="flex space-x-6 pb-2 h-full">
        {summaryData.length > 0 ? (
          summaryData.map((factory) => (
            <div
              key={factory.name}
              className="flex-shrink-0 w-40 flex flex-col items-center"
            >
              <p className="font-bold text-center text-md mb-3 truncate">
                {factory.name}
              </p>
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between">
                  <CheckSquare size={20} className="text-blue-500" />
                  <div className="w-2/3 bg-blue-100 dark:bg-blue-900/50 p-2 rounded-md text-center border border-gray-300 dark:border-gray-600">
                    <span className="font-semibold text-sm">
                      {factory.checkedQty.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <AlertTriangle size={20} className="text-yellow-500" />
                  <div className="w-2/3 bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-md text-center border border-gray-300 dark:border-gray-600">
                    <span className="font-semibold text-sm">
                      {factory.defectQty.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Percent size={20} className="dark:text-gray-200" />
                  <div
                    className={`w-2/3 p-2 rounded-md text-center border border-gray-300 dark:border-gray-600 ${getRateColorClass(
                      factory.defectRate
                    )}`}
                  >
                    <span className="font-bold text-sm">
                      {factory.defectRate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full text-center text-gray-400 self-center">
            No factory data for this period.
          </div>
        )}
      </div>
    </div>
  </div>
);

const SubConQCDashboardWeeklyView = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [filters, setFilters] = useState({
    // Default to the current week, Monday to Saturday
    startDate: startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday
    endDate: endOfWeek(new Date(), { weekStartsOn: 1 }), // Sunday, but we'll filter for Saturday
    factory: null,
    buyer: null,
    lineNo: null,
    moNo: null,
    color: null
  });

  const [data, setData] = useState({
    mainData: [],
    topDefects: [],
    linePerformance: [],
    buyerPerformance: [],
    weeklyTrend: [],
    individualDefectTrend: [],
    uniqueDefectNames: [],
    filterOptions: {}
  });

  const [isLoading, setIsLoading] = useState(true);
  const [topNValue, setTopNValue] = useState({ value: 3, label: "3" });
  const [allFactories, setAllFactories] = useState([]);
  const [selectedDefects, setSelectedDefects] = useState([]);

  // Memoized user factory logic (no changes)
  const userFactory = useMemo(() => {
    if (user && user.name && allFactories.length > 0) {
      const matchedFactoryName = allFactories.find(
        (f) => f.toLowerCase() === user.name.toLowerCase()
      );
      if (matchedFactoryName) {
        return { value: matchedFactoryName, label: matchedFactoryName };
      }
    }
    return null;
  }, [user, allFactories]);

  useEffect(() => {
    if (userFactory && !filters.factory) {
      handleFilterChange("factory", userFactory);
    }
  }, [userFactory, filters.factory]);

  // Fetch all factories once on mount (no changes)
  useEffect(() => {
    const fetchAllFactories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-sewing-factories-manage`
        );
        if (Array.isArray(res.data)) {
          setAllFactories(res.data.map((f) => f.factory));
        }
      } catch (err) {
        console.error("Failed to fetch master factory list", err);
      }
    };
    fetchAllFactories();
  }, []);

  // Main data fetching effect, now points to the new weekly endpoint
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = {
          startDate: format(filters.startDate, "yyyy-MM-dd"),
          endDate: format(filters.endDate, "yyyy-MM-dd"),
          factory: filters.factory?.value,
          buyer: filters.buyer?.value,
          lineNo: filters.lineNo?.value,
          moNo: filters.moNo?.value,
          color: filters.color?.value
        };
        // *** CHANGE: Calling the new weekly API endpoint ***
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-qc-dashboard-weekly`,
          { params }
        );
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch weekly dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  // Filter change and clear logic (no changes)
  const handleFilterChange = (name, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };
      if (name === "factory" || name === "buyer") {
        newFilters.lineNo = null;
        newFilters.moNo = null;
        newFilters.color = null;
      }
      if (name === "lineNo") {
        newFilters.moNo = null;
        newFilters.color = null;
      }
      if (name === "moNo") {
        newFilters.color = null;
      }
      return newFilters;
    });
  };

  const clearFilters = () => {
    const defaultFilters = {
      startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
      endDate: endOfWeek(new Date(), { weekStartsOn: 1 }),
      factory: null,
      buyer: null,
      lineNo: null,
      moNo: null,
      color: null
    };
    if (userFactory) defaultFilters.factory = userFactory;
    setFilters(defaultFilters);
  };

  const factoryFilterOptions = useMemo(() => {
    if (userFactory) return [userFactory];
    return allFactories.map((f) => ({ value: f, label: f }));
  }, [userFactory, allFactories]);

  const topNDefects = useMemo(() => {
    return data.topDefects.slice(0, topNValue.value);
  }, [data.topDefects, topNValue]);

  // Dashboard summary calculation, simplified to remove QA data
  const dashboardSummary = useMemo(() => {
    if (!data.mainData || data.mainData.length === 0) {
      return {
        totalChecked: 0,
        totalDefects: 0,
        overallRate: 0,
        factorySummary: []
      };
    }

    const factoryStats = {};
    let totalChecked = 0;
    let totalDefects = 0;

    // The backend now sends pre-aggregated weekly data, so we sum that up
    for (const item of data.mainData) {
      totalChecked += item.totalCheckedQty;
      totalDefects += item.totalDefectQty;

      if (!factoryStats[item.factory]) {
        factoryStats[item.factory] = { checkedQty: 0, defectQty: 0 };
      }
      factoryStats[item.factory].checkedQty += item.totalCheckedQty;
      factoryStats[item.factory].defectQty += item.totalDefectQty;
    }

    const factorySummary = Object.entries(factoryStats).map(
      ([name, stats]) => ({
        name,
        ...stats,
        defectRate:
          stats.checkedQty > 0 ? (stats.defectQty / stats.checkedQty) * 100 : 0
      })
    );

    const overallRate =
      totalChecked > 0 ? (totalDefects / totalChecked) * 100 : 0;

    return { totalChecked, totalDefects, overallRate, factorySummary };
  }, [data.mainData]);

  // Chart data memos (no changes in logic, just input data)
  const { chartData, chartMaxX } = useMemo(() => {
    const sortedData = data.linePerformance
      .map((item) => ({ ...item, name: `${item.factory} - ${item.lineNo}` }))
      .sort((a, b) => b.defectRate - a.defectRate);
    const maxVal = Math.ceil(
      Math.max(...sortedData.map((d) => d.defectRate), 0)
    );
    return { chartData: sortedData, chartMaxX: maxVal + 2 };
  }, [data.linePerformance]);

  const { buyerChartData, buyerChartMaxY } = useMemo(() => {
    const chartData = data.buyerPerformance.map((item) => ({
      ...item,
      name: item.buyer
    }));
    const maxVal = Math.ceil(
      Math.max(...chartData.map((d) => d.defectRate), 0)
    );
    return {
      buyerChartData: chartData,
      buyerChartMaxY: maxVal > 0 ? maxVal + 2 : 5
    };
  }, [data.buyerPerformance]);

  const appliedFiltersText = useMemo(() => {
    const parts = [
      `Date: ${format(filters.startDate, "yyyy-MM-dd")} to ${format(
        filters.endDate,
        "yyyy-MM-dd"
      )}`,
      `Factory: ${filters.factory?.label || "All"}`,
      `Buyer: ${filters.buyer?.label || "All"}`,
      `Line: ${filters.lineNo?.label || "All"}`,
      `MO: ${filters.moNo?.label || "All"}`,
      `Color: ${filters.color?.label || "All"}`
    ];
    return parts.join(" | ");
  }, [filters]);

  // Pivot table logic, updated to use 'weekRange' instead of 'date'
  const pivotTableData = useMemo(() => {
    const trendData = data.individualDefectTrend;
    if (!trendData || trendData.length === 0) {
      return { headers: [], rows: [] };
    }
    // Use 'weekRange' as the column key
    const dataMap = new Map(
      trendData.map((d) => [`${d.defectName}-${d.weekRange}`, d])
    );
    const weekHeaders = [...new Set(trendData.map((d) => d.weekRange))].sort();
    let defectNamesToShow =
      selectedDefects.length > 0
        ? selectedDefects.map((d) => d.value)
        : data.uniqueDefectNames;

    const tableRows = defectNamesToShow.map((defectName) => {
      const rowData = { defectName: defectName, weeks: {} };
      weekHeaders.forEach((week) => {
        const key = `${defectName}-${week}`;
        rowData.weeks[week] = dataMap.has(key) ? dataMap.get(key) : null;
      });
      return rowData;
    });

    return { headers: weekHeaders, rows: tableRows };
  }, [data.individualDefectTrend, data.uniqueDefectNames, selectedDefects]);

  // Color logic functions (no changes)
  const getRateColorClass = (rate) => {
    if (rate > 5) return "bg-red-100 dark:bg-red-900/50";
    if (rate >= 3) return "bg-orange-100 dark:bg-orange-900/50";
    if (rate >= 0) return "bg-green-100 dark:bg-green-900/50";
    return "bg-white dark:bg-gray-800";
  };
  const getTopDefectRateColorClass = (rate) => {
    if (rate > 3) return "bg-red-100 dark:bg-red-900/50";
    if (rate >= 1) return "bg-orange-100 dark:bg-orange-900/50";
    if (rate >= 0) return "bg-green-100 dark:bg-green-900/50";
    return "bg-white dark:bg-gray-800";
  };
  const getRateBarColor = (rate) => {
    const isDark = theme === "dark";
    if (rate > 5) return isDark ? "#dc2626" : "#fca5a5";
    if (rate >= 3) return isDark ? "#ea580c" : "#fdba74";
    if (rate > 0) return isDark ? "#16a34a" : "#86efac";
    return isDark ? "#6b7280" : "#d1d5db";
  };

  // Chart themeing (no changes)
  const chartTextColor = useMemo(
    () => (theme === "dark" ? "#f9fafb" : "#111827"),
    [theme]
  );
  const chartAxisColor = useMemo(
    () => (theme === "dark" ? "#6b7280" : "#374151"),
    [theme]
  );

  // Custom chart dot component (no changes)
  const CustomizedDot = (props) => {
    const { cx, cy, payload } = props;
    const fillColor = payload.defectRate > 5 ? "#ef4444" : "#22c55e";
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        stroke={fillColor}
        strokeWidth={3}
        fill="#ffffff"
      />
    );
  };

  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border)",
      minHeight: "42px"
    }),
    singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      zIndex: 50
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#4f46e5"
        : isFocused
        ? "var(--color-bg-tertiary)"
        : "var(--color-bg-secondary)",
      color: isSelected ? "white" : "var(--color-text-primary)"
    })
  };

  return (
    <div className="space-y-6">
      {/* Filter Pane */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
          <FilterControl label="Start Date (Mon)">
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => handleFilterChange("startDate", date)}
              className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border rounded-md"
              popperClassName="datepicker-on-top"
              filterDate={(date) => date.getDay() === 1} // Only allow Mondays
            />
          </FilterControl>
          <FilterControl label="End Date (Sat)">
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => handleFilterChange("endDate", date)}
              className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border rounded-md"
              popperClassName="datepicker-on-top"
              filterDate={(date) => date.getDay() === 6} // Only allow Saturdays
            />
          </FilterControl>
          {/* Other filters remain the same */}
          <FilterControl label="Factory">
            <Select
              styles={reactSelectStyles}
              options={factoryFilterOptions}
              value={filters.factory}
              onChange={(val) => handleFilterChange("factory", val)}
              isDisabled={!!userFactory}
              isClearable={!userFactory}
              placeholder="All"
            />
          </FilterControl>
          <FilterControl label="Buyer">
            <Select
              options={
                data.filterOptions?.buyers?.map((b) => ({
                  value: b,
                  label: b
                })) || []
              }
              value={filters.buyer}
              onChange={(val) => handleFilterChange("buyer", val)}
              styles={reactSelectStyles}
              isClearable
              placeholder="All"
            />
          </FilterControl>
          <FilterControl label="Line No">
            <Select
              options={
                data.filterOptions?.lineNos?.map((l) => ({
                  value: l,
                  label: l
                })) || []
              }
              value={filters.lineNo}
              onChange={(val) => handleFilterChange("lineNo", val)}
              styles={reactSelectStyles}
              isClearable
              isDisabled={!filters.factory}
              placeholder="All"
            />
          </FilterControl>
          <FilterControl label="MO No">
            <Select
              options={
                data.filterOptions?.moNos?.map((m) => ({
                  value: m,
                  label: m
                })) || []
              }
              value={filters.moNo}
              onChange={(val) => handleFilterChange("moNo", val)}
              styles={reactSelectStyles}
              isClearable
              placeholder="All"
            />
          </FilterControl>
          <FilterControl label="Color">
            <Select
              options={
                data.filterOptions?.colors?.map((c) => ({
                  value: c,
                  label: c
                })) || []
              }
              value={filters.color}
              onChange={(val) => handleFilterChange("color", val)}
              styles={reactSelectStyles}
              isClearable
              isDisabled={!filters.moNo}
              placeholder="All"
            />
          </FilterControl>
          <div className="flex items-center">
            <button
              onClick={clearFilters}
              className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Summary Cards (QA Cards Removed) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SummaryCard
              icon={<CheckSquare size={24} className="text-blue-500" />}
              title="Total Checked Qty"
              value={dashboardSummary.totalChecked.toLocaleString()}
              bgColorClass="bg-blue-100 dark:bg-blue-900/50"
              textColorClass="text-blue-900 dark:text-blue-100"
            />
            <SummaryCard
              icon={<AlertTriangle size={24} className="text-yellow-500" />}
              title="Total Defect Qty"
              value={dashboardSummary.totalDefects.toLocaleString()}
              bgColorClass="bg-yellow-100 dark:bg-yellow-900/50"
              textColorClass="text-yellow-900 dark:text-yellow-100"
            />
            <SummaryCard
              icon={<Percent size={24} className="text-red-500" />}
              title="Overall Defect Rate"
              value={`${dashboardSummary.overallRate.toFixed(2)}%`}
              bgColorClass={getRateColorClass(dashboardSummary.overallRate)}
              textColorClass="text-red-900 dark:text-red-100"
            />
          </div>

          {/* Factory Summary */}
          <div className="grid grid-cols-1">
            <FactorySummaryCard
              summaryData={dashboardSummary.factorySummary}
              getRateColorClass={getRateColorClass}
            />
          </div>

          {/* Main Table - Redesigned for Weekly Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 overflow-x-auto">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left">Factory</th>
                    <th className="px-3 py-2 text-left">Line</th>
                    <th className="px-3 py-2 text-left">MO No</th>
                    <th className="px-3 py-2 text-left">Buyer</th>
                    <th className="px-3 py-2 text-left">Color</th>
                    <th className="px-3 py-2 text-center">Total Checked</th>
                    <th className="px-3 py-2 text-center">Total Defects</th>
                    <th className="px-3 py-2 text-center">Defect Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.mainData.map((item) => (
                    <tr key={item._id}>
                      <td className="px-3 py-2">{item.factory}</td>
                      <td className="px-3 py-2">{item.lineNo}</td>
                      <td className="px-3 py-2">{item.moNo}</td>
                      <td className="px-3 py-2">{item.buyer}</td>
                      <td className="px-3 py-2">{item.color}</td>
                      <td className="px-3 py-2 text-center">
                        {item.totalCheckedQty.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {item.totalDefectQty.toLocaleString()}
                      </td>
                      <td
                        className={`px-3 py-2 text-center font-semibold ${getRateColorClass(
                          item.defectRate
                        )}`}
                      >
                        {item.defectRate.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Section (Top Defects, Line, Buyer - no change) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 dark:text-gray-100">
                  Top Defects
                </h3>
                <div className="w-24">
                  <Select
                    styles={reactSelectStyles}
                    options={[
                      { value: 3, label: "3" },
                      { value: 5, label: "5" },
                      { value: 7, label: "7" },
                      { value: 10, label: "10" },
                      { value: 15, label: "15" },
                      { value: 20, label: "20" },
                      { value: 25, label: "25" },
                      { value: 45, label: "All" }
                    ]}
                    defaultValue={topNValue}
                    onChange={setTopNValue}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold">
                        Defect Name
                      </th>
                      <th className="px-2 py-2 text-center font-semibold">
                        Qty
                      </th>
                      <th className="px-2 py-2 text-center font-semibold">
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {topNDefects.map((d) => (
                      <tr key={d.defectName}>
                        <td className="py-2 px-2 truncate" title={d.defectName}>
                          {d.defectName}
                        </td>
                        <td className="py-2 px-2 text-center">{d.defectQty}</td>
                        <td
                          className={`py-2 px-2 text-center font-medium rounded ${getTopDefectRateColorClass(
                            d.defectRate
                          )}`}
                        >
                          {d.defectRate.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-96">
              <h3 className="font-bold mb-4 text-gray-800 dark:text-gray-100">
                Defect Rate by Lines
              </h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 50, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === "dark" ? "#4b5563" : "#d1d5db"}
                  />
                  <XAxis
                    type="number"
                    domain={[0, chartMaxX]}
                    tick={{
                      fill: chartTextColor,
                      fontSize: 10,
                      fontWeight: 500
                    }}
                    axisLine={{ stroke: chartAxisColor }}
                    tickLine={{ stroke: chartAxisColor }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{
                      fill: chartTextColor,
                      fontSize: 10,
                      fontWeight: 500
                    }}
                    interval={0}
                    axisLine={{ stroke: chartAxisColor }}
                    tickLine={{ stroke: chartAxisColor }}
                  />
                  <Tooltip
                    formatter={(value) => `${value.toFixed(2)}%`}
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                      borderColor: chartAxisColor,
                      color: chartTextColor
                    }}
                  />
                  <Bar dataKey="defectRate">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getRateBarColor(entry.defectRate)}
                      />
                    ))}
                    <LabelList
                      dataKey="defectRate"
                      position="right"
                      formatter={(value) => `${value.toFixed(2)}%`}
                      style={{
                        fill: chartTextColor,
                        fontSize: "11px",
                        fontWeight: "600"
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-96">
              <h3 className="font-bold mb-4 text-gray-800 dark:text-gray-100">
                Defect Rate by Buyer
              </h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={buyerChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === "dark" ? "#4b5563" : "#d1d5db"}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: chartTextColor,
                      fontSize: 10,
                      fontWeight: 500
                    }}
                    axisLine={{ stroke: chartAxisColor }}
                    tickLine={{ stroke: chartAxisColor }}
                  />
                  <YAxis
                    type="number"
                    domain={[0, buyerChartMaxY]}
                    tick={{
                      fill: chartTextColor,
                      fontSize: 10,
                      fontWeight: 500
                    }}
                    axisLine={{ stroke: chartAxisColor }}
                    tickLine={{ stroke: chartAxisColor }}
                  />
                  <Tooltip
                    formatter={(value) => `${value.toFixed(2)}%`}
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                      borderColor: chartAxisColor,
                      color: chartTextColor
                    }}
                  />
                  <Bar dataKey="defectRate">
                    {buyerChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getRateBarColor(entry.defectRate)}
                      />
                    ))}
                    <LabelList
                      dataKey="defectRate"
                      position="top"
                      formatter={(value) => `${value.toFixed(2)}%`}
                      style={{
                        fill: chartTextColor,
                        fontSize: "11px",
                        fontWeight: "600"
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly QC Defect Rate Trend */}
          <div className="grid grid-cols-1 mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-96">
              <h3 className="font-bold mb-4 text-gray-800 dark:text-gray-100">
                Weekly QC Defect Rate Trend
              </h3>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart
                  data={data.weeklyTrend}
                  margin={{ top: 15, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === "dark" ? "#4b5563" : "#d1d5db"}
                  />
                  <XAxis
                    dataKey="weekRange"
                    tick={{ fill: chartTextColor, fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: chartTextColor, fontSize: 12 }}
                    unit="%"
                    domain={[0, "dataMax + 2"]}
                    tickFormatter={(tick) => tick.toFixed(0)}
                  />
                  <Tooltip
                    formatter={(value) => `${value.toFixed(2)}%`}
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                      borderColor: chartAxisColor,
                      color: chartTextColor
                    }}
                  />
                  <ReferenceLine
                    y={5}
                    label={{
                      value: "KPI = 5%",
                      position: "insideTopRight",
                      fill: "#ef4444",
                      fontSize: 14
                    }}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="defectRate"
                    stroke="#4A41F0FF"
                    strokeWidth={3}
                    dot={<CustomizedDot />}
                    activeDot={{ r: 6 }}
                  >
                    <LabelList
                      dataKey="defectRate"
                      position="top"
                      offset={10}
                      formatter={(value) => `${value.toFixed(2)}%`}
                      style={{ fill: chartTextColor, fontSize: "14px" }}
                    />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Individual Defect Trend Pivot Table */}
          <div className="grid grid-cols-1 mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">
                Weekly Individual Defect Trend
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
                {appliedFiltersText}
              </p>
              <div className="mb-4 max-w-lg">
                <label className="text-sm font-medium">
                  Filter by Defect Name:
                </label>
                <Select
                  options={data.uniqueDefectNames.map((name) => ({
                    value: name,
                    label: name
                  }))}
                  value={selectedDefects}
                  onChange={setSelectedDefects}
                  isMulti
                  isClearable
                  placeholder="Showing all defects..."
                  styles={reactSelectStyles}
                  closeMenuOnSelect={false}
                />
              </div>
              <div className="overflow-x-auto max-h-[70vh]">
                <table className="min-w-full text-sm border-collapse">
                  <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 z-10">
                    <tr>
                      <th className="p-2 border dark:border-gray-600 text-left sticky left-0 bg-gray-100 dark:bg-gray-700">
                        Defect Name
                      </th>
                      {pivotTableData.headers.map((week) => (
                        <th
                          key={week}
                          className="p-2 border dark:border-gray-600 min-w-[180px]"
                        >
                          {week}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {pivotTableData.rows.map((row) => (
                      <tr key={row.defectName}>
                        <td className="p-2 border dark:border-gray-600 font-semibold sticky left-0 bg-white dark:bg-gray-800">
                          {row.defectName}
                        </td>
                        {pivotTableData.headers.map((week) => {
                          const cellData = row.weeks[week];
                          const bgColor = cellData
                            ? getTopDefectRateColorClass(cellData.defectRate)
                            : "";
                          return (
                            <td
                              key={week}
                              className={`p-2 border dark:border-gray-600 text-center ${bgColor}`}
                            >
                              {cellData ? (
                                <div>
                                  <span className="font-bold text-base">
                                    {cellData.defectRate.toFixed(2)}%
                                  </span>
                                  <span className="block text-xs text-gray-600 dark:text-gray-400">
                                    ({cellData.qty})
                                  </span>
                                </div>
                              ) : (
                                ""
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const FilterControl = ({ label, children }) => (
  <div className="flex-1 min-w-[150px]">
    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
      {label}
    </label>
    {children}
  </div>
);

export default SubConQCDashboardWeeklyView;
