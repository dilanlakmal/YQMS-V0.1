import axios from "axios";
import { format } from "date-fns";
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { API_BASE_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";
import { useTheme } from "../../../context/ThemeContext";

// --- REDESIGNED COMPONENT 1: Simple Summary Card ---
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

// --- REDESIGNED COMPONENT 2: Factory Summary Card ---
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

const SubConQCDashboardDailyView = () => {
  const { user } = useAuth();
  const { theme } = useTheme(); // Use your ThemeContext instead of useThemeDetector

  const [filters, setFilters] = useState({
    startDate: new Date(),
    endDate: new Date(),
    factory: null,
    lineNo: null,
    moNo: null,
    color: null
  });
  const [data, setData] = useState({
    mainData: [],
    topDefects: [],
    linePerformance: [],
    filterOptions: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [topNValue, setTopNValue] = useState({ value: 3, label: "3" });
  const [allFactories, setAllFactories] = useState([]);

  const userFactory = useMemo(() => {
    // Check if we have a user, a name, and our NEW master list of factories
    if (user && user.name && allFactories.length > 0) {
      // Find a factory name in our master list that matches the user's name
      const matchedFactoryName = allFactories.find(
        (f) => f.toLowerCase() === user.name.toLowerCase()
      );

      if (matchedFactoryName) {
        return { value: matchedFactoryName, label: matchedFactoryName };
      }
    }
    return null;
  }, [user, allFactories]); // <-- DEPENDENCY CHANGED

  useEffect(() => {
    if (userFactory && !filters.factory) {
      handleFilterChange("factory", userFactory);
    }
  }, [userFactory, filters.factory]);

  // === NEW useEffect TO FETCH ALL FACTORIES ONCE ===
  useEffect(() => {
    const fetchAllFactories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-sewing-factories-manage`
        );
        if (Array.isArray(res.data)) {
          // We only need the factory names for our logic
          setAllFactories(res.data.map((f) => f.factory));
        }
      } catch (err) {
        console.error("Failed to fetch master factory list", err);
      }
    };
    fetchAllFactories();
  }, []); // Empty dependency array means it runs only once

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = {
          startDate: format(filters.startDate, "yyyy-MM-dd"),
          endDate: format(filters.endDate, "yyyy-MM-dd"),
          factory: filters.factory?.value,
          lineNo: filters.lineNo?.value,
          moNo: filters.moNo?.value,
          color: filters.color?.value
        };
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-qc-dashboard-daily`,
          { params }
        );
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    const defaultFilters = {
      startDate: new Date(),
      endDate: new Date(),
      factory: null,
      lineNo: null,
      moNo: null,
      color: null
    };
    if (userFactory) defaultFilters.factory = userFactory;
    setFilters(defaultFilters);
  };

  const factoryFilterOptions = useMemo(() => {
    if (userFactory) {
      return [userFactory];
    }
    // For all other users, map from the new master list
    return allFactories.map((f) => ({
      value: f,
      label: f
    }));
  }, [userFactory, allFactories]); // <-- DEPENDENCY CHANGED

  const topNDefects = useMemo(() => {
    return data.topDefects.slice(0, topNValue.value);
  }, [data.topDefects, topNValue]);

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

    for (const report of data.mainData) {
      totalChecked += report.checkedQty;
      totalDefects += report.totalDefectQty;

      if (!factoryStats[report.factory]) {
        factoryStats[report.factory] = { checkedQty: 0, defectQty: 0 };
      }
      factoryStats[report.factory].checkedQty += report.checkedQty;
      factoryStats[report.factory].defectQty += report.totalDefectQty;
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

  const { chartData, chartMaxX } = useMemo(() => {
    const sortedData = data.linePerformance
      .map((item) => ({
        ...item,
        name: `${item.factory} - ${item.lineNo}`
      }))
      .sort((a, b) => b.defectRate - a.defectRate);

    const maxVal = Math.ceil(
      Math.max(...sortedData.map((d) => d.defectRate), 0)
    );

    return {
      chartData: sortedData,
      chartMaxX: maxVal + 2
    };
  }, [data.linePerformance]);

  const getRateColorClass = (rate) => {
    if (rate > 5) {
      return "bg-red-100 dark:bg-red-900/50";
    }
    if (rate >= 3) {
      return "bg-orange-100 dark:bg-orange-900/50";
    }
    if (rate >= 0) {
      return "bg-green-100 dark:bg-green-900/50";
    }
    return "bg-white dark:bg-gray-800";
  };

  const getTopDefectRateColorClass = (rate) => {
    if (rate > 3) {
      return "bg-red-100 dark:bg-red-900/50";
    }
    if (rate >= 1) {
      return "bg-orange-100 dark:bg-orange-900/50";
    }
    if (rate >= 0) {
      return "bg-green-100 dark:bg-green-900/50";
    }
    return "bg-white dark:bg-gray-800";
  };

  const getRateBarColor = (rate) => {
    const isDark = theme === "dark";

    if (rate > 5) {
      return isDark ? "#dc2626" : "#fca5a5"; // Red-600 / Red-300
    }
    if (rate >= 3) {
      return isDark ? "#ea580c" : "#fdba74"; // Orange-600 / Orange-300
    }
    if (rate > 0) {
      return isDark ? "#16a34a" : "#86efac"; // Green-600 / Green-300
    }

    return isDark ? "#6b7280" : "#d1d5db"; // Gray-500 / Gray-300
  };

  // Updated chart text color using reliable theme detection
  const chartTextColor = useMemo(() => {
    if (theme === "dark") {
      return "#f9fafb"; // Light gray for dark theme
    } else {
      return "#111827"; // Very dark gray for light theme
    }
  }, [theme]);

  // Chart axis color
  const chartAxisColor = useMemo(() => {
    if (theme === "dark") {
      return "#6b7280"; // Gray-500 for dark theme
    } else {
      return "#374151"; // Gray-700 for light theme
    }
  }, [theme]);

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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
          <FilterControl label="Start Date">
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => handleFilterChange("startDate", date)}
              className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border rounded-md"
              popperClassName="datepicker-on-top"
            />
          </FilterControl>
          <FilterControl label="End Date">
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => handleFilterChange("endDate", date)}
              className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border rounded-md"
              popperClassName="datepicker-on-top"
            />
          </FilterControl>
          <FilterControl label="Factory">
            <Select
              options={factoryFilterOptions}
              value={filters.factory}
              onChange={(val) => handleFilterChange("factory", val)}
              isDisabled={!!userFactory}
              isClearable={!userFactory}
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

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-6 items-stretch">
          <div className="xl:col-span-1">
            <SummaryCard
              icon={<CheckSquare size={24} className="text-blue-500" />}
              title="Checked Qty"
              value={dashboardSummary.totalChecked.toLocaleString()}
              bgColorClass="bg-blue-100 dark:bg-blue-900/50"
              textColorClass="text-blue-900 dark:text-blue-100"
            />
          </div>
          <div className="xl:col-span-1">
            <SummaryCard
              icon={<AlertTriangle size={24} className="text-yellow-500" />}
              title="Total Defect Qty"
              value={dashboardSummary.totalDefects.toLocaleString()}
              bgColorClass="bg-yellow-100 dark:bg-yellow-900/50"
              textColorClass="text-yellow-900 dark:text-yellow-100"
            />
          </div>
          <div className="xl:col-span-1">
            <SummaryCard
              icon={<Percent size={24} className="text-red-500" />}
              title="Overall Defect Rate"
              value={`${dashboardSummary.overallRate.toFixed(2)}%`}
              bgColorClass={getRateColorClass(dashboardSummary.overallRate)}
              textColorClass="text-red-900 dark:text-red-100"
            />
          </div>
          <div className="md:col-span-2 xl:col-span-4">
            <FactorySummaryCard
              summaryData={dashboardSummary.factorySummary}
              getRateColorClass={getRateColorClass}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Table */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 overflow-x-auto">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Factory</th>
                    <th className="px-3 py-2 text-left">Line</th>
                    <th className="px-3 py-2 text-left">MO No</th>
                    <th className="px-3 py-2 text-left">Color</th>
                    <th className="px-3 py-2 text-center">Checked</th>
                    <th className="px-3 py-2 text-center">Defects</th>
                    <th className="px-3 py-2 text-center">Rate</th>
                    <th className="px-3 py-2 text-left">Defect Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mainData.map((report) => {
                    const defectRateOverall =
                      report.checkedQty > 0
                        ? (report.totalDefectQty / report.checkedQty) * 100
                        : 0;
                    const colorClass = getRateColorClass(defectRateOverall);

                    return (
                      <tr
                        key={report._id}
                        className="border-b dark:border-gray-700"
                      >
                        <td className="px-3 py-2">
                          {format(
                            new Date(report.inspectionDate),
                            "yyyy-MM-dd"
                          )}
                        </td>
                        <td className="px-3 py-2">{report.factory}</td>
                        <td className="px-3 py-2">{report.lineNo}</td>
                        <td className="px-3 py-2">{report.moNo}</td>
                        <td className="px-3 py-2">{report.color}</td>
                        <td className="px-3 py-2 text-center">
                          {report.checkedQty}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {report.totalDefectQty}
                        </td>
                        <td
                          className={`px-3 py-2 text-center font-semibold ${colorClass}`}
                        >
                          {defectRateOverall.toFixed(2)}%
                        </td>
                        <td className={`px-3 py-2 ${colorClass}`}>
                          {report.defectList
                            .sort((a, b) => b.qty - a.qty)
                            .map((d) => (
                              <div key={d.defectCode} className="text-xs">
                                {d.defectName} - <strong>{d.qty}</strong> (
                                {report.checkedQty > 0
                                  ? ((d.qty / report.checkedQty) * 100).toFixed(
                                      2
                                    )
                                  : 0}
                                %)
                              </div>
                            ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Panels */}
          <div className="space-y-6">
            {/* Top N Defects */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Top {topNValue.value} Defects</h3>
                <div className="w-20">
                  <Select
                    options={[
                      { value: 3, label: "3" },
                      { value: 5, label: "5" },
                      { value: 7, label: "7" },
                      { value: 10, label: "10" },
                      { value: 15, label: "15" },
                      { value: 20, label: "20" },
                      { value: 25, label: "25" },
                      { value: 30, label: "30" },
                      { value: 45, label: "All" }
                    ]}
                    defaultValue={topNValue}
                    onChange={setTopNValue}
                  />
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold">
                      Defect Name
                    </th>
                    <th className="px-2 py-2 text-center font-semibold">Qty</th>
                    <th className="px-2 py-2 text-center font-semibold">
                      Defect Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topNDefects.map((d) => (
                    <tr
                      key={d.defectName}
                      className="border-b dark:border-gray-700"
                    >
                      <td className="py-1">{d.defectName}</td>
                      <td className="py-1 text-center">{d.defectQty}</td>
                      <td
                        className={`py-2 px-2 text-center font-medium ${getTopDefectRateColorClass(
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

            {/* Bar Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-80">
              <h3 className="font-bold mb-4">Defect Rate by Lines</h3>
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
                    axisLine={{ stroke: chartAxisColor, strokeWidth: 1 }}
                    tickLine={{ stroke: chartAxisColor, strokeWidth: 1 }}
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
                    axisLine={{ stroke: chartAxisColor, strokeWidth: 1 }}
                    tickLine={{ stroke: chartAxisColor, strokeWidth: 1 }}
                  />
                  <Tooltip
                    formatter={(value) => `${value.toFixed(2)}%`}
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                      borderColor: chartAxisColor,
                      color: chartTextColor,
                      border: `1px solid ${chartAxisColor}`
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
          </div>
        </div>
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

export default SubConQCDashboardDailyView;
