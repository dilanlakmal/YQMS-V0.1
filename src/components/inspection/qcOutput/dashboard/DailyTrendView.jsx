import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import { API_BASE_URL } from "../../../../../config";
import { Filter, Loader2, AlertTriangle, BarChart3 } from "lucide-react";
import DailyTrendTable from "./DailyTrendTable"; // The main table component

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

const ModernButton = ({ label, active, onClick }) => {
  const baseClasses =
    "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105";
  const variantClasses = active
    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600";
  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses}`}>
      {label}
    </button>
  );
};

const DailyTrendView = ({ data, loading, error }) => {
  const [filters, setFilters] = useState({
    lineNo: null,
    moNo: null,
    buyer: null,
    defectName: null
  });
  const [filterOptions, setFilterOptions] = useState({
    lines: [],
    mos: [],
    buyers: [],
    defects: []
  });
  const [topN, setTopN] = useState(3);
  const [tableView, setTableView] = useState("Line-MO");

  useEffect(() => {
    if (!data || data.length === 0) return;

    const lines = new Set(),
      mos = new Set(),
      buyers = new Set(),
      defects = new Set();

    // Use the most granular data for populating all possible filter options
    data.forEach((day) => {
      (day.daily_full_summary || []).forEach((item) => {
        if (item.lineNo) lines.add(item.lineNo);
        if (item.MONo) mos.add(item.MONo);
        if (item.Buyer) buyers.add(item.Buyer);
        (item.DefectArray || []).forEach((d) => defects.add(d.defectName));
      });
    });

    setFilterOptions({
      lines: [...lines].sort().map((l) => ({ value: l, label: l })),
      mos: [...mos].sort().map((m) => ({ value: m, label: m })),
      buyers: [...buyers].sort().map((b) => ({ value: b, label: b })),
      defects: [...defects].sort().map((d) => ({ value: d, label: d }))
    });
  }, [data]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({ lineNo: null, moNo: null, buyer: null, defectName: null });
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
    <div className="space-y-6">
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
              <Filter className="text-white" size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Trend Filters
            </h2>
          </div>
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Select
            placeholder="Filter by Defect..."
            options={filterOptions.defects}
            value={filters.defectName}
            onChange={(val) => handleFilterChange("defectName", val)}
            styles={reactSelectStyles}
            isClearable
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">
                Daily Defect Trend Analysis
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {["Line-MO", "Line", "MO", "Buyer", "All"].map((view) => (
                <ModernButton
                  key={view}
                  label={view}
                  active={tableView === view}
                  onClick={() => setTableView(view)}
                />
              ))}
            </div>
          </div>
        </div>
        <DailyTrendTable
          data={data}
          view={tableView}
          filters={filters}
          topN={topN}
          setTopN={setTopN}
        />
      </div>
    </div>
  );
};

export default DailyTrendView;
