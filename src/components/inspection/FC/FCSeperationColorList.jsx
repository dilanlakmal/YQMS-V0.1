import React, { useState } from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  Palette,
  Calendar,
  Printer,
  X,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FileSearch,
  Hash,
} from "lucide-react";
import { API_BASE_URL } from "../../../../config";

// --- Helpers ---
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

const getToday = () => new Date().toISOString().split("T")[0];
const getLastWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
};

// --- Sub Components ---

// 1. Report Detail View
const SeperationReportView = ({ report }) => {
  if (!report)
    return (
      <div className="p-8 text-center text-gray-500">Loading Report...</div>
    );

  return (
    <div className="animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl shadow-sm">
                <Palette
                  size={28}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                  Seperation Color List
                </h2>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium mt-1">
                  <div className="flex items-center gap-1">
                    <Hash size={13} />
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                      {report.header.txnNo}
                    </span>
                  </div>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <div className="flex items-center gap-1">
                    <Calendar size={13} />
                    <span>{formatDate(report.header.createDate)}</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 hover:shadow-sm transition-all">
              <Printer size={16} /> Export / Print
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50 overflow-x-auto">
          <table className="w-full text-[11px] border-collapse border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm rounded-lg">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-750 text-gray-600 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 text-[10px] uppercase tracking-wider">
                <th className="border-r border-gray-200 px-2 py-2 min-w-[30px] text-center">
                  No
                </th>
                <th className="border-r border-gray-200 px-2 py-2 min-w-[60px]">
                  Tone
                </th>
                <th className="border-r border-gray-200 px-2 py-2 min-w-[80px]">
                  MPOCode
                </th>
                <th className="border-r border-gray-200 px-2 py-2 min-w-[80px]">
                  MPONo
                </th>
                <th className="border-r border-gray-200 px-2 py-2 min-w-[60px]">
                  Style
                </th>
                <th className="border-r border-gray-200 px-2 py-2 min-w-[100px]">
                  Material
                </th>
                <th className="border-r border-gray-200 px-2 py-2 min-w-[80px]">
                  EngColor
                </th>
                <th className="border-r border-gray-200 px-2 py-2 min-w-[100px]">
                  Body_Lot
                </th>
                <th className="border-r border-gray-200 px-2 py-2 min-w-[60px]">
                  Body_Total
                </th>
                <th className="border-r border-gray-200 px-2 py-2 min-w-[60px]">
                  Body_CST
                </th>
                <th className="border-r border-gray-200 px-2 py-2 min-w-[40px]">
                  Unit
                </th>
                <th className="border-r border-gray-200 px-2 py-2 min-w-[60px]">
                  Rib_Lot
                </th>
                <th className="border-r border-gray-200 px-2 py-2 min-w-[60px]">
                  Rib_TotalQ
                </th>
                <th className="border-r border-gray-200 px-2 py-2 min-w-[60px]">
                  Rib_CST
                </th>
                <th className="border-r border-gray-200 px-2 py-2 min-w-[60px]">
                  Rib_DiffQty
                </th>
                <th className="px-2 py-2 min-w-[120px]">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {report.rows.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <td className="border-r border-gray-200 px-2 py-1.5 text-center text-gray-500 font-medium">
                    {idx + 1}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1.5 font-bold">
                    {fmt(row.tone)}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1.5 text-xs">
                    {fmt(row.mpoCode)}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1.5 text-xs">
                    {fmt(row.mpoNo)}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1.5 text-xs">
                    {fmt(row.style)}
                  </td>
                  <td
                    className="border-r border-gray-200 px-2 py-1.5 truncate max-w-[150px] text-xs"
                    title={row.material}
                  >
                    {fmt(row.material)}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1.5 text-xs">
                    {fmt(row.engColor)}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1.5 text-xs font-medium">
                    {fmt(row.bodyLot)}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1.5 text-right font-medium">
                    {fmt(row.bodyQty)}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1.5 text-right text-xs text-gray-500">
                    {fmt(row.bodyCst)}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1.5 text-center text-[10px] text-gray-500">
                    {fmt(row.unit)}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1.5 text-xs font-medium">
                    {fmt(row.ribLot)}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1.5 text-right font-medium">
                    {fmt(row.ribQty)}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1.5 text-right text-xs text-gray-500">
                    {fmt(row.ribCst)}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1.5 text-right text-blue-600 dark:text-blue-400 font-bold">
                    {fmt(row.ribDiffQty)}
                  </td>
                  <td className="px-2 py-1.5 text-xs italic text-gray-500">
                    {fmt(row.remarks)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

const FCSeperationColorList = () => {
  const [tabs, setTabs] = useState([
    { id: "search", label: "Search Report", type: "search" },
  ]);
  const [activeTab, setActiveTab] = useState("search");

  // -- Global Search --
  const [globalSearchTxn, setGlobalSearchTxn] = useState("");

  // -- Filters --
  const [filters, setFilters] = useState({
    startDate: getLastWeek(),
    endDate: getToday(),
    txnNo: "",
    mpoNo: "",
    style: "",
    engColor: "",
  });

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [dropdownOptions, setDropdownOptions] = useState({
    MPONo: [],
    Style: [],
    EngColor: [],
  });

  // -- Pagination --
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // -- Logic --

  const fetchSearchResults = async () => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(
        `${API_BASE_URL}/api/fc-system/seperation-color-list/search?${params}`,
      );
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
        setCurrentPage(1);
      } else {
        setSearchError(data.message);
      }
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchDropdown = async (field, value) => {
    try {
      const params = new URLSearchParams({
        field,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: value,
      });
      const res = await fetch(
        `${API_BASE_URL}/api/fc-system/seperation-color-list/dropdown?${params}`,
      );
      const data = await res.json();
      if (data.success) {
        setDropdownOptions((prev) => ({ ...prev, [field]: data.data }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openReportTab = async (txnNo) => {
    if (!txnNo || txnNo.trim() === "") return;

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
        `${API_BASE_URL}/api/fc-system/seperation-color-list?search=${encodeURIComponent(txnNo)}`,
      );
      const data = await res.json();

      if (data.success && data.reports.length > 0) {
        const newTab = {
          id: txnNo,
          label: `${txnNo}`,
          type: "report",
          data: data.reports[0],
        };
        setTabs([...tabs, newTab]);
        setActiveTab(txnNo);
        setGlobalSearchTxn("");
      } else {
        alert(`No report found for TxnNo: ${txnNo}`);
      }
    } catch (err) {
      alert("Error loading report: " + err.message);
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
    setFilters((prev) => ({
      ...prev, // Keep dates
      txnNo: "",
      mpoNo: "",
      style: "",
      engColor: "",
    }));
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = searchResults.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(searchResults.length / itemsPerPage);

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

  const renderSearchTab = () => (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* 1. Quick Global Search */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-6 shadow-lg text-white">
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
              className="px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap"
            >
              Open Report
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter Pane */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-bold">
            <Filter size={18} className="text-blue-500" />
            <span>Advanced Search</span>
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
          >
            <RotateCcw size={14} /> Clear Filters
          </button>
        </div>

        {/* 7 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-xs focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-xs focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          {["TxnNo", "MPONo", "Style", "EngColor"].map((field) => (
            <div key={field} className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                {field}
              </label>
              <input
                type="text"
                list={`${field}-list`}
                value={
                  filters[
                    field === "TxnNo"
                      ? "txnNo"
                      : field === "MPONo"
                        ? "mpoNo"
                        : field === "Style"
                          ? "style"
                          : "engColor"
                  ]
                }
                onChange={(e) => {
                  const val = e.target.value;
                  const key =
                    field === "TxnNo"
                      ? "txnNo"
                      : field === "MPONo"
                        ? "mpoNo"
                        : field === "Style"
                          ? "style"
                          : "engColor";
                  setFilters((prev) => ({ ...prev, [key]: val }));
                  if (field !== "TxnNo") fetchDropdown(field, val);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder={`${field}...`}
              />
              {field !== "TxnNo" && (
                <datalist id={`${field}-list`}>
                  {dropdownOptions[field]?.map((opt, i) => (
                    <option key={i} value={opt} />
                  ))}
                </datalist>
              )}
            </div>
          ))}
          <div className="flex">
            <button
              onClick={fetchSearchResults}
              disabled={searchLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors shadow-sm disabled:opacity-50 h-[34px]"
            >
              {searchLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              <span className="text-xs font-bold uppercase">Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Results Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
            Report List
          </h3>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {searchResults.length} Records Found
          </span>
        </div>

        {searchError ? (
          <div className="p-8 text-center text-red-500 flex flex-col items-center gap-2">
            <AlertCircle size={32} /> <span>{searchError}</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-center w-[80px]">Action</th>
                    <th className="px-4 py-3 border-l">Inspection</th>
                    <th className="px-4 py-3 border-l">TxnNo</th>
                    <th className="px-4 py-3 border-l">Code</th>
                    <th className="px-4 py-3 border-l">Tone Code</th>
                    <th className="px-4 py-3 border-l">MPO Code</th>
                    <th className="px-4 py-3 border-l">MPO No</th>
                    <th className="px-4 py-3 border-l">Style</th>
                    <th className="px-4 py-3 border-l">Material</th>
                    <th className="px-4 py-3 border-l">Eng Color</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentItems.length > 0 ? (
                    currentItems.map((row, i) => (
                      <tr
                        key={i}
                        className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => openReportTab(row.TxnNo)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-all shadow-sm border border-blue-200 bg-white"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs">
                          {formatShortDate(row.Create_Date)}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {row.TxnNo}
                        </td>
                        <td className="px-4 py-2 text-xs">{row.Code}</td>
                        <td className="px-4 py-2 text-xs">{row.Tone_Code}</td>
                        <td className="px-4 py-2 text-xs">{row.MPOCode}</td>
                        <td className="px-4 py-2 text-xs">{row.MPONo}</td>
                        <td className="px-4 py-2 text-xs">{row.Style}</td>
                        <td
                          className="px-4 py-2 text-xs truncate max-w-[120px]"
                          title={row.Material}
                        >
                          {row.Material}
                        </td>
                        <td className="px-4 py-2 text-xs">{row.EngColor}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="10"
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
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold transition-all border ${currentPage === pageNum ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"}`}
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
      {/* Tab Header */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`group relative flex items-center gap-2 px-5 py-3 rounded-t-lg cursor-pointer transition-all border-t border-l border-r min-w-[140px] justify-between ${activeTab === tab.id ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 font-bold shadow-[0_-2px_5px_rgba(0,0,0,0.02)]" : "bg-gray-100 dark:bg-gray-900 border-transparent text-gray-500 hover:bg-gray-200"}`}
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
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full"></div>
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {tabs.find((t) => t.id === activeTab)?.type === "search" ? (
          renderSearchTab()
        ) : (
          <SeperationReportView
            report={tabs.find((t) => t.id === activeTab)?.data}
          />
        )}
      </div>
    </div>
  );
};

export default FCSeperationColorList;
