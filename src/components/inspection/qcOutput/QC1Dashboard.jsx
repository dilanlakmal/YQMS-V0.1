import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE_URL } from "../../../../config";
import {
  Loader2,
  AlertTriangle,
  Calendar,
  Filter,
  BarChart3,
  Activity,
  View,
  TrendingUp,
  CalendarDays,
  CalendarClock,
  CalendarHeart
} from "lucide-react";

import DashboardStatCard from "./dashboard/DashboardStatCard";
import SummaryTable from "./dashboard/SummaryTable";
import DefectRateChart from "./dashboard/DefectRateChart";
import TopDefectsTable from "./dashboard/TopDefectsTable";
import DailyTrendView from "./dashboard/DailyTrendView";

const reactSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: "0.75rem",
    border: "2px solid",
    borderColor: state.isFocused ? "#6366f1" : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
    padding: "0.25rem",
    backgroundColor: "var(--color-bg-secondary)",
    "&:hover": {
      borderColor: "#6366f1"
    }
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
    "&:hover": {
      backgroundColor: state.isSelected ? "#6366f1" : "#eef2ff"
    }
  })
};

const HeaderButton = ({ label, icon: Icon, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 w-28 h-20 rounded-xl transition-all duration-300 transform hover:-translate-y-1 ${
        active
          ? "bg-white/30 backdrop-blur-lg shadow-xl"
          : "bg-white/10 hover:bg-white/20"
      }`}
    >
      <Icon className="w-6 h-6 text-white" />
      <span className="text-xs font-bold text-white tracking-wide">
        {label}
      </span>
    </button>
  );
};

const formatDateForAPI = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const QC1Dashboard = () => {
  const [dateRange, setDateRange] = useState([
    new Date(new Date().setDate(new Date().getDate() - 6)),
    new Date()
  ]);
  const [startDate, endDate] = dateRange;
  // --- new state for the active dashboard view ---
  const [activeDashboardView, setActiveDashboardView] = useState("Daily View");

  const [data, setData] = useState([]);
  const [trendData, setTrendData] = useState([]); // State for previous 5 days
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);

    // Calculate the date range for the preceding trend data
    const trendEndDate = new Date(startDate);
    trendEndDate.setDate(trendEndDate.getDate() - 1);

    const trendStartDate = new Date(trendEndDate);
    trendStartDate.setDate(trendEndDate.getDate() - 6); // Fetch 7 days to find 5 working days

    try {
      // Fetch both main data and trend data in parallel for efficiency
      const [mainResponse, trendResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/qc1-summary/dashboard-data`, {
          params: {
            startDate: formatDateForAPI(startDate),
            endDate: formatDateForAPI(endDate)
          }
        }),
        axios.get(`${API_BASE_URL}/api/qc1-summary/dashboard-data`, {
          params: {
            startDate: formatDateForAPI(trendStartDate),
            endDate: formatDateForAPI(trendEndDate)
          }
        })
      ]);

      setData(mainResponse.data);
      setTrendData(trendResponse.data);
    } catch (err) {
      setError("Failed to fetch dashboard data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Create a new useCallback for fetching dynamic filter options ---
  const fetchFilterOptions = useCallback(async () => {
    if (!startDate || !endDate) return;
    try {
      const params = {
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        lineNo: filters.lineNo?.value,
        moNo: filters.moNo?.value,
        buyer: filters.buyer?.value
      };

      const response = await axios.get(
        `${API_BASE_URL}/api/qc1-summary/filter-options`,
        { params }
      );

      const { lines, mos, buyers } = response.data;

      setFilterOptions({
        lines: lines.map((l) => ({ value: l, label: l })),
        mos: mos.map((m) => ({ value: m, label: m })),
        buyers: buyers.map((b) => ({ value: b, label: b }))
      });

      // --- Logic to reset filters if their selected value is no longer in the options ---
      if (filters.lineNo && !lines.includes(filters.lineNo.value)) {
        setFilters((prev) => ({ ...prev, lineNo: null }));
      }
      if (filters.moNo && !mos.includes(filters.moNo.value)) {
        setFilters((prev) => ({ ...prev, moNo: null }));
      }
      if (filters.buyer && !buyers.includes(filters.buyer.value)) {
        setFilters((prev) => ({ ...prev, buyer: null }));
      }
    } catch (err) {
      console.error("Failed to fetch dynamic filter options:", err);
    }
  }, [startDate, endDate, filters.lineNo, filters.moNo, filters.buyer]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // This one fetches the dynamic filter options whenever the date or filters change.
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const processedData = useMemo(() => {
    const defaultData = {
      stats: {
        totalOutput: 0,
        totalOutputT38: 0,
        totalOutputT39: 0,
        totalDefects: 0,
        defectRate: 0
      },
      topDefects: [],
      chartData: { lineSummary: {}, moSummary: {}, buyerSummary: {} },
      tableData: [],
      // filterOptions are now managed by state, so we don't need them in the default object
      trends: { output: [], defects: [], defectRate: [] }
    };

    // The main processing logic starts here
    let mainDataProcessed = defaultData;
    if (data && data.length > 0) {
      let totalOutputT38 = 0,
        totalOutputT39 = 0,
        totalDefects = 0;
      const lineSummary = {},
        moSummary = {},
        buyerSummary = {};
      const defectMap = new Map();

      data.forEach((day) => {
        const filteredFullSummary = (day.daily_full_summary || []).filter(
          (item) =>
            (!filters.lineNo || item.lineNo === filters.lineNo.value) &&
            (!filters.moNo || item.MONo === filters.moNo.value) &&
            (!filters.buyer || item.Buyer === filters.buyer.value)
        );

        filteredFullSummary.forEach((item) => {
          totalOutputT38 += item.CheckedQtyT38;
          totalOutputT39 += item.CheckedQtyT39;
          totalDefects += item.totalDefectsQty;

          (item.DefectArray || []).forEach((defect) => {
            defectMap.set(
              defect.defectName,
              (defectMap.get(defect.defectName) || 0) + defect.defectQty
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
        });
      });

      const totalOutput = Math.max(totalOutputT38, totalOutputT39);
      const defectRate =
        totalOutput > 0 ? (totalDefects / totalOutput) * 100 : 0;
      const topDefects = Array.from(defectMap.entries())
        .map(([name, qty]) => ({
          name,
          qty,
          rate: totalOutput > 0 ? (qty / totalOutput) * 100 : 0
        }))
        .sort((a, b) => b.qty - a.qty);

      const filterValidKeys = (summaryObj) =>
        Object.entries(summaryObj)
          .filter(([key]) => key && key !== "undefined" && key !== "null")
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      mainDataProcessed = {
        stats: {
          totalOutput,
          totalOutputT38,
          totalOutputT39,
          totalDefects,
          defectRate
        },
        topDefects,
        chartData: {
          lineSummary: filterValidKeys(lineSummary),
          moSummary: filterValidKeys(moSummary),
          buyerSummary: filterValidKeys(buyerSummary)
        },
        tableData: data
      };
    }

    // Trend data processing (this part is unchanged from before)
    const dailyTrends = new Map();
    (trendData || []).forEach((day) => {
      const dateStr = day.inspectionDate.split("T")[0];
      const filteredFullSummary = (day.daily_full_summary || []).filter(
        (item) =>
          (!filters.lineNo || item.lineNo === filters.lineNo.value) &&
          (!filters.moNo || item.MONo === filters.moNo.value) &&
          (!filters.buyer || item.Buyer === filters.buyer.value)
      );

      let dailyOutputT38 = 0;
      let dailyOutputT39 = 0;
      let dailyDefects = 0;

      filteredFullSummary.forEach((item) => {
        dailyOutputT38 += item.CheckedQtyT38 || 0;
        dailyOutputT39 += item.CheckedQtyT39 || 0;
        dailyDefects += item.totalDefectsQty || 0;
      });

      const dailyOutput = Math.max(dailyOutputT38, dailyOutputT39);

      if (dailyOutput > 0 || dailyDefects > 0) {
        dailyTrends.set(dateStr, {
          output: dailyOutput,
          outputT38: dailyOutputT38,
          outputT39: dailyOutputT39,
          defects: dailyDefects,
          rate: dailyOutput > 0 ? (dailyDefects / dailyOutput) * 100 : 0
        });
      }
    });

    const lastFiveDaysData = Array.from(dailyTrends.entries())
      .map(([date, values]) => ({ date, ...values }))
      .filter((day) => new Date(day.date).getDay() !== 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-5);

    const outputTrend = lastFiveDaysData.map((d) => ({
      date: d.date,
      value: d.output
    }));
    const defectTrend = lastFiveDaysData.map((d) => ({
      date: d.date,
      value: d.defects
    }));

    return {
      ...mainDataProcessed,
      trends: {
        output: outputTrend,
        defects: defectTrend,
        defectRate: lastFiveDaysData
      }
    };
  }, [data, trendData, filters]);

  useEffect(() => {
    if (processedData?.filterOptions) {
      setFilterOptions(processedData.filterOptions);
    }
  }, [processedData]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
      </div>
    );
  if (error)
    return (
      <div className="text-center text-red-500 p-8">
        <AlertTriangle className="mx-auto mb-2" />
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-24 -mb-24"></div>

          <div className="relative space-y-6">
            {/* Top Row: Title and Date Picker */}
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">
                  QC1 Sunrise Dashboard
                </h1>
                <p className="text-indigo-100">
                  QC1 Inspection Quality Control Summary and Analysis
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/20">
                <HeaderButton
                  label="Daily View"
                  icon={View}
                  active={activeDashboardView === "Daily View"}
                  onClick={() => setActiveDashboardView("Daily View")}
                />
                <HeaderButton
                  label="Weekly View"
                  icon={CalendarDays}
                  active={activeDashboardView === "Weekly View"}
                  onClick={() => setActiveDashboardView("Weekly View")}
                />
                <HeaderButton
                  label="Monthly View"
                  icon={CalendarHeart}
                  active={activeDashboardView === "Monthly View"}
                  onClick={() => setActiveDashboardView("Monthly View")}
                />
                <HeaderButton
                  label="Daily Trend"
                  icon={TrendingUp}
                  active={activeDashboardView === "Daily Trend"}
                  onClick={() => setActiveDashboardView("Daily Trend")}
                />
                <HeaderButton
                  label="Weekly Trend"
                  icon={TrendingUp}
                  active={activeDashboardView === "Weekly Trend"}
                  onClick={() => setActiveDashboardView("Weekly Trend")}
                />
                <HeaderButton
                  label="Monthly Trend"
                  icon={CalendarClock}
                  active={activeDashboardView === "Monthly Trend"}
                  onClick={() => setActiveDashboardView("Monthly Trend")}
                />
              </div>

              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-xl px-4 py-3">
                <Calendar className="text-white" size={20} />
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  className="bg-transparent text-white font-medium outline-none w-64 placeholder-white/70"
                  popperClassName="react-datepicker-popper-z-50"
                  portalId="root-portal"
                />
              </div>
            </div>

            {/* Bottom Row: Navigation Buttons */}
          </div>
        </header>

        {activeDashboardView === "Daily View" ? (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DashboardStatCard
                title="Total Output"
                value={processedData.stats.totalOutput.toLocaleString()}
                rate={null}
                subValue={`Inside: ${processedData.stats.totalOutputT39.toLocaleString()} | Outside: ${processedData.stats.totalOutputT38.toLocaleString()}`}
                icon={BarChart3}
                trendData={processedData.trends.output}
                insideQty={processedData.stats.totalOutputT39}
                outsideQty={processedData.stats.totalOutputT38}
              />
              <DashboardStatCard
                title="Total Defects"
                value={processedData.stats.totalDefects.toLocaleString()}
                rate={null}
                icon={AlertTriangle}
                trendData={processedData.trends.defects}
              />
              <DashboardStatCard
                title="Overall Defect Rate"
                value={`${processedData.stats.defectRate.toFixed(2)}%`}
                rate={processedData.stats.defectRate}
                icon={Activity}
                trendData={processedData.trends.defectRate}
                isTrendChart={true}
              />
            </div>

            {/* Filters */}
            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-6">
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
                  onChange={(val) => handleFilterChange("lineNo", val)}
                  styles={reactSelectStyles}
                  isClearable
                />
                <Select
                  placeholder="Filter by MO..."
                  options={filterOptions.mos}
                  value={filters.moNo}
                  onChange={(val) => handleFilterChange("moNo", val)}
                  styles={reactSelectStyles}
                  isClearable
                />
                <Select
                  placeholder="Filter by Buyer..."
                  options={filterOptions.buyers}
                  value={filters.buyer}
                  onChange={(val) => handleFilterChange("buyer", val)}
                  styles={reactSelectStyles}
                  isClearable
                />
              </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <SummaryTable
                  data={processedData.tableData}
                  activeView={activeView}
                  setActiveView={setActiveView}
                  filters={filters}
                />
                <DefectRateChart chartData={processedData.chartData} />
              </div>
              <div className="xl:col-span-1">
                <TopDefectsTable topDefects={processedData.topDefects} />
              </div>
            </div>
          </>
        ) : activeDashboardView === "Daily Trend" ? (
          // --- This is the new block for the Daily Trend view ---
          <DailyTrendView data={data} loading={loading} error={error} />
        ) : (
          // This is the placeholder for the other views
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-12 text-center">
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">
              {activeDashboardView} is Under Development
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              This section will be available in a future update.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QC1Dashboard;
