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
  Activity
} from "lucide-react";

import DashboardStatCard from "./dashboard/DashboardStatCard";
import SummaryTable from "./dashboard/SummaryTable";
import DefectRateChart from "./dashboard/DefectRateChart";
import TopDefectsTable from "./dashboard/TopDefectsTable";

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

const QC1Dashboard = () => {
  const [dateRange, setDateRange] = useState([
    new Date(new Date().setDate(new Date().getDate() - 6)),
    new Date()
  ]);
  const [startDate, endDate] = dateRange;

  const [data, setData] = useState([]);
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
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc1-summary/dashboard-data`,
        {
          params: {
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0]
          }
        }
      );
      setData(response.data);
    } catch (err) {
      setError("Failed to fetch dashboard data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const lines = new Set(),
      mos = new Set(),
      buyers = new Set();
    data.forEach((day) => {
      (day.daily_line_summary || []).forEach((item) => lines.add(item.lineNo));
      (day.daily_mo_summary || []).forEach((item) => mos.add(item.MONo));
      (day.daily_buyer_summary || []).forEach((item) => buyers.add(item.Buyer));
    });
    const newFilterOptions = {
      lines: [...lines].sort().map((l) => ({ value: l, label: l })),
      mos: [...mos].sort().map((m) => ({ value: m, label: m })),
      buyers: [...buyers].sort().map((b) => ({ value: b, label: b }))
    };

    let totalOutputT38 = 0,
      totalOutputT39 = 0,
      totalDefects = 0;
    const lineSummary = {},
      moSummary = {},
      buyerSummary = {};
    const defectMap = new Map();

    data.forEach((day) => {
      const filteredLineMo = (day.daily_line_MO_summary || []).filter(
        (item) =>
          (!filters.lineNo || item.lineNo === filters.lineNo.value) &&
          (!filters.moNo || item.MONo === filters.moNo.value) &&
          (!filters.buyer || item.Buyer === filters.buyer.value)
      );

      filteredLineMo.forEach((item) => {
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
    const defectRate = totalOutput > 0 ? (totalDefects / totalOutput) * 100 : 0;

    const topDefects = Array.from(defectMap.entries())
      .map(([name, qty]) => ({
        name,
        qty,
        rate: totalOutput > 0 ? (qty / totalOutput) * 100 : 0
      }))
      .sort((a, b) => b.qty - a.qty);

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
      tableData: data,
      filterOptions: newFilterOptions
    };
  }, [data, filters]);

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
  if (!processedData)
    return (
      <div className="text-center text-gray-500 p-8">
        No data available for the selected date range. Please try syncing the
        data or selecting a different range.
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-24 -mb-24"></div>

          <div className="relative flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                QC1 Sunrise Dashboard
              </h1>
              <p className="text-indigo-100">
                Daily / Weekly / Monthly Quality Control Summary and Analysis
              </p>
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
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardStatCard
            title="Total Output"
            value={processedData.stats.totalOutput.toLocaleString()}
            rate={null}
            subValue={`Inside: ${processedData.stats.totalOutputT39.toLocaleString()} | Outside: ${processedData.stats.totalOutputT38.toLocaleString()}`}
            icon={BarChart3}
          />
          <DashboardStatCard
            title="Total Defects"
            value={processedData.stats.totalDefects.toLocaleString()}
            rate={null}
            icon={AlertTriangle}
          />
          <DashboardStatCard
            title="Overall Defect Rate"
            value={`${processedData.stats.defectRate.toFixed(2)}%`}
            rate={processedData.stats.defectRate}
            icon={Activity}
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
      </div>
    </div>
  );
};

export default QC1Dashboard;
