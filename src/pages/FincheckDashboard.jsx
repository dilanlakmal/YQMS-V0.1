import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Calendar,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";
import QASummaryDashboard from "../components/inspection/PivotY/FincheckDashboard/QASummaryDashboard";
import OrderNoSummaryDashboard from "../components/inspection/PivotY/FincheckDashboard/OrderNoSummaryDashboard";
import TopDefectsChart from "../components/inspection/PivotY/FincheckDashboard/TopDefectsChart";
import ReportResultTable from "../components/inspection/PivotY/FincheckDashboard/ReportResultTable";
import ReportMeasurementResultDashboard from "../components/inspection/PivotY/FincheckDashboard/Reportmeasurementresultdashboard";
import TopCardVisualSummary from "../components/inspection/PivotY/FincheckDashboard/TopCardVisualSummary";
import DefectTrendChart from "../components/inspection/PivotY/FincheckDashboard/DefectTrendChart";
import { API_BASE_URL } from "../../config";

// --- Internal Component: Buyer Autocomplete ---
const BuyerSearchInput = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounce search to fetch suggestions
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Only fetch if user is typing or if field is empty (to show all)
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-dashboard/buyers`,
          { params: { search: value } },
        );
        if (res.data.success) {
          setSuggestions(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching buyers", error);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [value]);

  return (
    <div className="relative w-full sm:w-48 group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-3.5 w-3.5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Filter Buyer..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay to allow click
        className="pl-9 pr-3 py-2.5 w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-400"
      />

      {/* Dropdown Menu */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar animate-fadeIn">
          {suggestions.map((buyer, idx) => (
            <div
              key={idx}
              onClick={() => {
                onChange(buyer);
                setShowDropdown(false);
              }}
              className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer transition-colors"
            >
              {buyer}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Internal Component: Order Autocomplete ---
const OrderSearchInput = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Only fetch if user typed something (min 1 char) to avoid fetching huge list
      if (value.length >= 1) {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/fincheck-dashboard/orders`,
            { params: { search: value } },
          );
          if (res.data.success) {
            setSuggestions(res.data.data);
          }
        } catch (error) {
          console.error("Error fetching orders", error);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [value]);

  return (
    <div className="relative w-full sm:w-40 group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-3.5 w-3.5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Filter Order..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => value.length >= 1 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        className="pl-9 pr-3 py-2.5 w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-400"
      />

      {/* Dropdown Menu */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar animate-fadeIn">
          {suggestions.map((order, idx) => (
            <div
              key={idx}
              onClick={() => {
                onChange(order);
                setShowDropdown(false);
              }}
              className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer transition-colors"
            >
              {order}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const QASearchInput = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const delay = setTimeout(async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-dashboard/qas`,
          { params: { search: value } },
        );
        if (res.data.success) setSuggestions(res.data.data);
      } catch (err) {
        console.error("Error fetching QAs", err);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [value]);

  return (
    <div className="relative w-full sm:w-44 group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-3.5 w-3.5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Filter QA..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        className="pl-9 pr-3 py-2.5 w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-400"
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar animate-fadeIn">
          {suggestions.map((qa, idx) => (
            <div
              key={idx}
              onClick={() => {
                onChange(qa.empId);
                setShowDropdown(false);
              }}
              className="px-4 py-2 text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {qa.empName}
              </span>
              <span className="ml-2 font-mono text-gray-400">{qa.empId}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FincheckDashboard = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);

  const [dateRange, setDateRange] = useState({
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  });

  const [qaFilter, setQaFilter] = useState("");
  const [orderFilter, setOrderFilter] = useState("");
  const [buyerFilter, setBuyerFilter] = useState("");
  const [reportType, setReportType] = useState("All");

  const [availableReportTypes, setAvailableReportTypes] = useState([]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-dashboard/report-types`,
        );
        if (res.data.success) {
          setAvailableReportTypes(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching report types", error);
      }
    };
    fetchTypes();
  }, []);

  const handleDateChange = (key, value) => {
    setDateRange((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    const e = new Date();
    const s = new Date();
    s.setDate(e.getDate() - 7);
    setDateRange({
      startDate: s.toISOString().split("T")[0],
      endDate: e.toISOString().split("T")[0],
    });
    setQaFilter("");
    setOrderFilter("");
    setBuyerFilter("");
    setReportType("All");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-gray-900 overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-6 animate-fadeIn pb-12">
      {/* 1. Header & Global Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight leading-none">
              Fincheck Dashboard
            </h1>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">
              Real Time QA Inspection
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
          <div className="relative group w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="pl-9 pr-8 py-2.5 w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <option value="All">All Report Types</option>
              {availableReportTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* QA Filter Input */}
          <QASearchInput value={qaFilter} onChange={setQaFilter} />

          {/* Buyer Filter Input */}
          <BuyerSearchInput value={buyerFilter} onChange={setBuyerFilter} />

          {/* Order Filter with Autocomplete */}
          <OrderSearchInput value={orderFilter} onChange={setOrderFilter} />

          <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
            <div className="flex items-center px-3 border-r border-gray-200 dark:border-gray-700 text-gray-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 px-2">
              <div className="flex flex-col">
                <label className="text-[8px] font-bold text-gray-400 uppercase">
                  Start
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    handleDateChange("startDate", e.target.value)
                  }
                  className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none p-0 cursor-pointer"
                />
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex flex-col">
                <label className="text-[8px] font-bold text-gray-400 uppercase">
                  End
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none p-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button
            onClick={resetFilters}
            className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Top Card Summary Row ── */}
      <TopCardVisualSummary
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        reportType={reportType}
        buyer={buyerFilter}
        qaFilter={qaFilter}
        orderFilter={orderFilter}
      />

      {/* 1,2 Top Section: QA & Order Feeds */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="h-[500px]">
          <QASummaryDashboard
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            qaFilter={qaFilter}
            reportType={reportType}
            buyer={buyerFilter}
          />
        </div>

        <div className="h-[500px]">
          <OrderNoSummaryDashboard
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            orderFilter={orderFilter}
            reportType={reportType}
            buyer={buyerFilter}
            qaFilter={qaFilter}
          />
        </div>
      </div>

      {/* Middle Section: Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 3. Top Defects Chart */}
        <div className="h-[700px]">
          <TopDefectsChart
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            reportType={reportType}
            orderFilter={orderFilter}
            buyer={buyerFilter}
            qaFilter={qaFilter}
          />
        </div>

        {/* 4. Report Result Table */}
        <div className="h-[700px]">
          <ReportResultTable
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            reportType={reportType}
            buyer={buyerFilter}
            qaFilter={qaFilter}
            orderFilter={orderFilter}
          />
        </div>
      </div>
      {/*Bottom Section Dashboard */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/*Measurement Result Dashboard */}
        <div className="h-[800px]">
          <ReportMeasurementResultDashboard
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            reportType={reportType}
            buyer={buyerFilter}
            qaFilter={qaFilter}
            orderFilter={orderFilter}
          />
        </div>
        {/*Defect Trend Chart */}
        <div className="h-[700px]">
          <DefectTrendChart
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            reportType={reportType}
            buyer={buyerFilter}
            qaFilter={qaFilter}
            orderFilter={orderFilter}
          />
        </div>
      </div>
    </div>
  );
};

export default FincheckDashboard;
