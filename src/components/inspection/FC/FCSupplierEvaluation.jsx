import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  ClipboardList,
  Filter,
  Printer,
  RotateCcw,
  FileSearch,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Calendar,
} from "lucide-react";
import { API_BASE_URL } from "../../../../config";

// --- Helpers ---

const formatMonth = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${month}/${year}`;
  } catch {
    return dateStr;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const fmt = (val) => (val !== null && val !== undefined ? val : "");

const fmtDecimal = (val, decimals = 2) => {
  if (val === null || val === undefined) return "";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num.toFixed(decimals);
};

const fmtPercent = (val) => {
  if (val === null || val === undefined) return "";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return (num * 100).toFixed(2) + "%";
};

const getColorClass = (colorName) => {
  if (!colorName) return "bg-gray-100 text-gray-800";
  const c = colorName.toLowerCase().trim();
  if (c === "green") return "bg-green-500 text-white";
  if (c === "yellow") return "bg-yellow-400 text-black";
  if (c === "red") return "bg-red-500 text-white";
  return "bg-gray-100 text-gray-800";
};

const getGradeColorClass = (grade) => {
  if (!grade) return "";
  const g = grade.toUpperCase().trim();
  if (g === "A") return "bg-green-500 text-white";
  if (g === "B") return "bg-yellow-400 text-black";
  if (g === "C") return "bg-red-500 text-white";
  return "";
};

// --- Sub-components ---

// 1. Detail Report View
const SupplierEvaluationReport = ({ report }) => {
  if (!report)
    return (
      <div className="p-8 text-center text-gray-500">Loading Report...</div>
    );

  return (
    <div className="animate-fadeIn pb-8">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Content Area */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header Info */}
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl shadow-sm">
                  <ClipboardList
                    className="text-emerald-600 dark:text-emerald-400"
                    size={24}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Supplier Evaluation
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <Calendar size={13} />{" "}
                    {formatDate(report.header.createDate)}
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors">
                <Printer size={16} /> Export
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col p-2 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-100 dark:border-gray-700">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  TxnNo
                </span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {report.header.txnNo}
                </span>
              </div>
              <div className="flex flex-col p-2 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-100 dark:border-gray-700">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Store Date
                </span>
                <span className="font-medium">
                  {formatDate(report.header.storeDate)}
                </span>
              </div>
              <div className="flex flex-col p-2 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-100 dark:border-gray-700">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Prepared By
                </span>
                <div className="flex items-center gap-1">
                  <User size={14} className="text-gray-400" />
                  <span className="font-medium">
                    {report.header.preparedBy}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:col-span-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-100 dark:border-gray-700">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Remarks
                </span>
                <span className="text-xs italic text-gray-600 dark:text-gray-300">
                  {report.header.remarks || "No remarks"}
                </span>
              </div>
            </div>
          </div>

          {/* Detail Table */}
          <div className="p-4 overflow-x-auto bg-gray-50/50 dark:bg-gray-900/50">
            <table className="w-full text-[11px] text-left border-collapse border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm rounded-lg">
              <thead>
                <tr className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 font-semibold uppercase tracking-wider">
                  <th className="px-3 py-2 border-r border-emerald-100 dark:border-emerald-800">
                    Month
                  </th>
                  <th className="px-3 py-2 border-r border-emerald-100 dark:border-emerald-800">
                    Buyer
                  </th>
                  <th className="px-3 py-2 border-r border-emerald-100 dark:border-emerald-800">
                    Supplier
                  </th>
                  <th className="px-3 py-2 border-r border-emerald-100 dark:border-emerald-800">
                    Supplier Name
                  </th>
                  <th className="px-3 py-2 border-r border-emerald-100 dark:border-emerald-800 text-right">
                    Ins. Yds
                  </th>
                  <th className="px-3 py-2 border-r border-emerald-100 dark:border-emerald-800 text-right">
                    Points
                  </th>
                  <th className="px-3 py-2 border-r border-emerald-100 dark:border-emerald-800 text-center">
                    Pt/100Yd
                  </th>
                  <th className="px-3 py-2 border-r border-emerald-100 dark:border-emerald-800 text-center">
                    DP
                  </th>
                  <th className="px-3 py-2 border-r border-emerald-100 dark:border-emerald-800 text-center">
                    NT
                  </th>
                  <th className="px-3 py-2 border-r border-emerald-100 dark:border-emerald-800 text-center">
                    LW
                  </th>
                  <th className="px-3 py-2 border-r border-emerald-100 dark:border-emerald-800 text-center">
                    Grd
                  </th>
                  <th className="px-3 py-2 border-r border-emerald-100 dark:border-emerald-800 text-center">
                    %
                  </th>
                  <th className="px-3 py-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {report.rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors"
                  >
                    <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700 whitespace-nowrap">
                      {formatMonth(row.month)}
                    </td>
                    <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700 font-medium">
                      {fmt(row.buyer)}
                    </td>
                    <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700 text-center">
                      {fmt(row.supplierCode)}
                    </td>
                    <td
                      className="px-3 py-2 border-r border-gray-100 dark:border-gray-700 truncate max-w-[120px]"
                      title={row.supplierName}
                    >
                      {fmt(row.supplierName)}
                    </td>

                    <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700 text-right">
                      {row.totalInsYds ? fmtDecimal(row.totalInsYds) : "-"}
                    </td>
                    <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700 text-right">
                      {row.totalTP100sq ? Math.round(row.totalTP100sq) : "-"}
                    </td>
                    <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700 text-center">
                      {row.tp100sqPer ? Math.round(row.tp100sqPer) : "-"}
                    </td>

                    <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700 text-center">
                      {fmt(row.dp)}
                    </td>
                    <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700 text-center">
                      {fmt(row.nt)}
                    </td>
                    <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700 text-center">
                      {fmt(row.lw)}
                    </td>

                    <td
                      className={`px-3 py-2 border-r border-gray-100 dark:border-gray-700 text-center font-bold ${getGradeColorClass(row.overGrade)}`}
                    >
                      {fmt(row.overGrade)}
                    </td>

                    <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700 text-center font-medium">
                      {fmtPercent(row.insPer)}
                    </td>
                    <td className="px-3 py-2 text-gray-500 italic">
                      {fmt(row.remarks)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel: Grading Criteria */}
        {report.grades && report.grades.length > 0 && (
          <div className="xl:w-[280px] shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-6">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <h4 className="font-bold text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wide text-center">
                  Grading Standard
                </h4>
              </div>
              <table className="w-full text-[10px]">
                <thead className="bg-gray-100 dark:bg-gray-700 font-bold text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="py-2 px-2 border-b dark:border-gray-600 text-left">
                      Defect %
                    </th>
                    <th className="py-2 px-2 border-b dark:border-gray-600 text-center">
                      Grd
                    </th>
                    <th className="py-2 px-2 border-b dark:border-gray-600 text-left">
                      Comment
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {report.grades.map((g, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 font-medium">{g.range}</td>
                      <td className="py-2 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${getColorClass(g.color)}`}
                        >
                          {g.grade}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-gray-500 italic">
                        {g.comment}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

const FCSupplierEvaluation = () => {
  // Tabs State
  const [tabs, setTabs] = useState([
    { id: "search", label: "Search Report", type: "search" },
  ]);
  const [activeTab, setActiveTab] = useState("search");

  // Search State
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState({
    txnNo: "",
    year: currentYear,
    month: "",
  });
  const [globalSearchTxn, setGlobalSearchTxn] = useState("");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Matches table height better

  // -- Handlers --

  const fetchSearchList = async (overrideFilters = null) => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters = overrideFilters || filters;
      const params = new URLSearchParams();
      if (activeFilters.txnNo) params.append("txnNo", activeFilters.txnNo);
      if (activeFilters.year) params.append("year", activeFilters.year);
      if (activeFilters.month) params.append("month", activeFilters.month);

      const response = await fetch(
        `${API_BASE_URL}/api/fc-system/supplier-evaluation/list?${params}`,
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setCurrentPage(1);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchSearchList();
  }, []);

  // Open Report in New Tab
  const openReportTab = async (txnNo) => {
    if (!txnNo) return;

    if (tabs.find((t) => t.id === txnNo)) {
      setActiveTab(txnNo);
      setGlobalSearchTxn("");
      return;
    }

    if (tabs.length >= 11) {
      alert("Maximum 10 tabs allowed.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/fc-system/supplier-evaluation?search=${encodeURIComponent(txnNo)}`,
      );
      const result = await res.json();

      if (result.success && result.report) {
        const newTab = {
          id: txnNo,
          label: `${txnNo}`,
          type: "report",
          data: result.report,
        };
        setTabs([...tabs, newTab]);
        setActiveTab(txnNo);
        setGlobalSearchTxn("");
      } else {
        alert(`No report found for ${txnNo}`);
      }
    } catch (err) {
      alert("Failed to load report");
    }
  };

  const closeTab = (e, tabId) => {
    e.stopPropagation();
    const newTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(newTabs);
    if (activeTab === tabId) {
      setActiveTab(newTabs[newTabs.length - 1].id);
    }
  };

  const resetFilters = () => {
    const defaults = { txnNo: "", year: currentYear, month: "" };
    setFilters(defaults);
    fetchSearchList(defaults);
  };

  // -- Pagination Logic --
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }
    return pages;
  };

  // -- Render Content --

  const renderSearchTab = () => (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Quick Search */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 shadow-lg text-white">
        <div className="max-w-3xl">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <FileSearch size={20} /> Quick Search Report
          </h3>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={globalSearchTxn}
                onChange={(e) => setGlobalSearchTxn(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && openReportTab(globalSearchTxn)
                }
                placeholder="Enter TxnNo to open report directly..."
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-white/50 border-none shadow-inner"
              />
            </div>
            <button
              onClick={() => openReportTab(globalSearchTxn)}
              className="px-6 py-3 bg-white text-teal-600 font-bold rounded-lg hover:bg-teal-50 transition-colors shadow-md whitespace-nowrap"
            >
              Open Report
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-bold">
            <Filter size={18} className="text-emerald-500" />
            <span>Filter Records</span>
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
          >
            <RotateCcw size={14} /> Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Month
            </label>
            <select
              value={filters.month}
              onChange={(e) =>
                setFilters({ ...filters, month: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("en-US", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">
              TxnNo
            </label>
            <input
              type="text"
              value={filters.txnNo}
              onChange={(e) =>
                setFilters({ ...filters, txnNo: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Filter TxnNo..."
            />
          </div>
          <button
            onClick={() => fetchSearchList()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md transition-colors shadow-sm disabled:opacity-50 h-[34px]"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            <span className="text-xs font-bold uppercase">Search</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ClipboardList
              className="text-emerald-600 dark:text-emerald-400"
              size={20}
            />
            <h3 className="font-bold text-gray-700 dark:text-gray-200">
              Evaluation Records
            </h3>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {data.length} Records
          </span>
        </div>

        {error ? (
          <div className="p-8 text-center text-red-500 flex flex-col items-center gap-2">
            <AlertCircle size={32} /> <span>{error}</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-center w-[80px]">Action</th>
                    <th className="px-4 py-3 border-l border-gray-200 dark:border-gray-600">
                      Year/Month
                    </th>
                    <th className="px-4 py-3 border-l border-gray-200 dark:border-gray-600">
                      TxnNo
                    </th>
                    <th className="px-4 py-3 border-l border-gray-200 dark:border-gray-600">
                      Prepared By
                    </th>
                    <th className="px-4 py-3 border-l border-gray-200 dark:border-gray-600">
                      Inspection Date
                    </th>
                    <th className="px-4 py-3 border-l border-gray-200 dark:border-gray-600">
                      Submitted Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentItems.length > 0 ? (
                    currentItems.map((row, i) => (
                      <tr
                        key={i}
                        className="group hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => openReportTab(row.TxnNo)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-md transition-all shadow-sm border border-emerald-200 bg-white"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap font-medium">
                          {formatMonth(row.TMonth)}
                        </td>
                        <td className="px-4 py-2 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {row.TxnNo}
                        </td>
                        <td className="px-4 py-2">{row.PreparedBy}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs">
                          {formatShortDate(row.InspectionDate)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs">
                          {formatShortDate(row.SubmittedDate)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-12 text-center text-gray-400 italic"
                      >
                        No records found matching filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center items-center bg-gray-50 dark:bg-gray-850 gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-600"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1">
                  {getPageNumbers().map((pageNum, idx) =>
                    typeof pageNum === "number" ? (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold transition-all border ${currentPage === pageNum ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"}`}
                      >
                        {pageNum}
                      </button>
                    ) : (
                      <span
                        key={idx}
                        className="w-8 h-8 flex items-center justify-center text-gray-400"
                      >
                        ...
                      </span>
                    ),
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-600"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Tab Headers */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`group relative flex items-center gap-2 px-5 py-3 rounded-t-lg cursor-pointer transition-all border-t border-l border-r min-w-[140px] justify-between ${activeTab === tab.id ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-[0_-2px_5px_rgba(0,0,0,0.02)]" : "bg-gray-100 dark:bg-gray-900 border-transparent text-gray-500 hover:bg-gray-200"}`}
          >
            <span className="text-sm whitespace-nowrap">{tab.label}</span>
            {tab.id !== "search" && (
              <button
                onClick={(e) => closeTab(e, tab.id)}
                className="text-gray-400 hover:bg-red-100 hover:text-red-500 rounded-full p-1 transition-all"
              >
                <X size={14} />
              </button>
            )}
            {activeTab === tab.id && (
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-600 rounded-t-full"></div>
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {tabs.find((t) => t.id === activeTab)?.type === "search" ? (
          renderSearchTab()
        ) : (
          <SupplierEvaluationReport
            report={tabs.find((t) => t.id === activeTab)?.data}
          />
        )}
      </div>
    </div>
  );
};

export default FCSupplierEvaluation;
