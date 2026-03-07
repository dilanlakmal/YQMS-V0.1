import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Loader2,
  AlertTriangle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CheckSquare,
  Square,
  Pause,
  Play,
  Search,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

const PAGE_SIZE = 10;
const AUTO_INTERVAL = 10000;
const DATE_COL_W = 76;
const NAME_COL_W = 210;
const TOTAL_COL_W = 52;

const cellStyle = (rate, qty) => {
  if (qty === 0 || rate === 0)
    return {
      bg: "bg-gray-50 dark:bg-gray-800/40",
      text: "text-gray-300 dark:text-gray-600",
    };
  if (rate > 3)
    return {
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-600 dark:text-red-400",
    };
  if (rate >= 1)
    return {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      text: "text-orange-500 dark:text-orange-400",
    };
  return {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
  };
};

// UTC-safe: avoid browser timezone shifting the displayed day
const fmtDateLabel = (dateStr) => {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  const day = dt.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
  const mon = dt.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  return { day, num: String(d).padStart(2, "0"), mon };
};

// ─── Defect multi-select dropdown ─────────────────────────────────────────────
const DefectFilterDropdown = ({ allKeys, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = allKeys.filter((k) =>
    k.toLowerCase().includes(search.toLowerCase()),
  );
  const toggle = (key) =>
    onChange(
      selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key],
    );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors
          ${
            selected.length > 0
              ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
              : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
          }`}
      >
        <Filter className="w-3.5 h-3.5" />
        Defects
        {selected.length > 0 && (
          <span className="bg-indigo-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
            {selected.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search defects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 pr-3 py-1.5 w-full text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400 text-gray-700 dark:text-gray-200"
              />
            </div>
          </div>
          <div className="flex gap-2 px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => onChange([...allKeys])}
              className="text-[10px] font-bold text-indigo-600 hover:underline"
            >
              All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => onChange([])}
              className="text-[10px] font-bold text-rose-500 hover:underline"
            >
              Clear
            </button>
            <span className="ml-auto text-[10px] text-gray-400">
              {selected.length}/{allKeys.length}
            </span>
          </div>
          <div className="max-h-56 overflow-y-auto custom-scrollbar">
            {filtered.map((key) => {
              const checked = selected.includes(key);
              return (
                <div
                  key={key}
                  onClick={() => toggle(key)}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors text-xs
                    ${checked ? "bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}
                >
                  {checked ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-gray-300    flex-shrink-0" />
                  )}
                  <span
                    className={`truncate font-medium ${checked ? "text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-300"}`}
                  >
                    {key}
                  </span>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-4">
                No matches
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const DefectTrendChart = ({
  startDate,
  endDate,
  reportType,
  buyer,
  qaFilter,
  orderFilter,
}) => {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDefects, setSelectedDefects] = useState([]);
  const [page, setPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!startDate || !endDate) return;
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      setPage(0);
      try {
        const params = {
          startDate,
          endDate,
          reportType,
          buyer,
          qaFilter,
          orderFilter,
        };
        if (selectedDefects.length > 0)
          params.defectNames = selectedDefects.join(",");
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-dashboard/defect-trend`,
          { params, signal: controller.signal },
        );
        if (res.data.success) setRawData(res.data.data);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("Error fetching defect trend:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [
    startDate,
    endDate,
    reportType,
    buyer,
    qaFilter,
    orderFilter,
    selectedDefects,
  ]);

  const dates = rawData?.dates || [];
  const dateSamples = rawData?.dateSamples || {};
  const allRows = rawData?.rows || [];
  const allKeys = rawData?.allDefectKeys || [];
  const totalPages = Math.ceil(allRows.length / PAGE_SIZE);
  const pageRows = allRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const grandTotalSample = dates.reduce((s, d) => s + (dateSamples[d] || 0), 0);

  useEffect(() => {
    if (loading || totalPages <= 1 || isPaused) return;
    const id = setInterval(
      () => setPage((p) => (p + 1) % totalPages),
      AUTO_INTERVAL,
    );
    return () => clearInterval(id);
  }, [loading, totalPages, isPaused]);

  const Legend = () => (
    <div className="flex items-center gap-3 flex-wrap">
      {[
        {
          bg: "bg-red-50    dark:bg-red-900/20",
          dot: "bg-red-400",
          label: "> 3%",
        },
        {
          bg: "bg-orange-50 dark:bg-orange-900/20",
          dot: "bg-orange-400",
          label: "1 – 3%",
        },
        {
          bg: "bg-green-50  dark:bg-green-900/20",
          dot: "bg-green-400",
          label: "< 1%",
        },
        { bg: "bg-gray-50   dark:bg-gray-800/40", dot: "", label: "No data" },
      ].map(({ bg, dot, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div
            className={`w-3 h-3 rounded-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center ${bg}`}
          >
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
          </div>
          <span className="text-[10px] font-medium text-gray-400">{label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white text-lg leading-tight">
              Defect Trend Chart
            </h3>
            <p className="text-xs text-gray-500">
              Daily defect rate by defect type · Sundays excluded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DefectFilterDropdown
            allKeys={allKeys}
            selected={selectedDefects}
            onChange={(v) => {
              setSelectedDefects(v);
              setPage(0);
            }}
          />
          {selectedDefects.length > 0 && (
            <button
              onClick={() => setSelectedDefects([])}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 hover:bg-rose-100 transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-0.5 border border-gray-200 dark:border-gray-600">
              <button
                onClick={() =>
                  setPage((p) => (p === 0 ? totalPages - 1 : p - 1))
                }
                className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-500 hover:text-indigo-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono font-bold text-gray-500 w-16 text-center">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => (p + 1) % totalPages)}
                className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-500 hover:text-indigo-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          {totalPages > 1 && (
            <span className="text-gray-300 dark:text-gray-600">
              {isPaused ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
            <p className="text-sm">Building Trend Data...</p>
          </div>
        ) : allRows.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl m-4">
            <AlertTriangle className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">No defect data for selected criteria</p>
          </div>
        ) : (
          <table
            className="w-full text-xs border-collapse"
            style={{
              minWidth: NAME_COL_W + dates.length * DATE_COL_W + TOTAL_COL_W,
            }}
          >
            <thead className="sticky top-0 z-20">
              {/* Date headers */}
              <tr>
                <th
                  className="sticky left-0 z-30 bg-gray-100 dark:bg-gray-900 border-r-2 border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 text-left font-bold text-gray-600 dark:text-gray-300 uppercase text-[10px] tracking-wider"
                  style={{ minWidth: NAME_COL_W, width: NAME_COL_W }}
                >
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-indigo-400" />
                    Defect Name
                    {allRows.length > 0 && (
                      <span className="ml-1 text-[9px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
                        {allRows.length}
                      </span>
                    )}
                  </div>
                </th>
                {dates.map((date) => {
                  const { day, num, mon } = fmtDateLabel(date);
                  return (
                    <th
                      key={date}
                      className="bg-gray-100 dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-700 px-1 py-1.5 text-center font-bold"
                      style={{ minWidth: DATE_COL_W, width: DATE_COL_W }}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-[9px] font-bold text-indigo-400 uppercase">
                          {day}
                        </span>
                        <span className="text-[13px] font-black text-gray-700 dark:text-gray-200">
                          {num}
                        </span>
                        <span className="text-[8px] text-gray-400 uppercase">
                          {mon}
                        </span>
                      </div>
                    </th>
                  );
                })}
                {/* Compact total header */}
                <th
                  className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-1 py-1.5 text-center font-bold text-gray-500 dark:text-gray-400 text-[9px] uppercase tracking-wider"
                  style={{ minWidth: TOTAL_COL_W, width: TOTAL_COL_W }}
                >
                  TOT.
                </th>
              </tr>

              {/* Sample size row */}
              <tr className="bg-gray-50 dark:bg-gray-800/80">
                <td className="sticky left-0 z-30 bg-gray-50 dark:bg-gray-800/80 border-r-2 border-b-2 border-gray-200 dark:border-gray-700 px-3 py-1 text-[9px] font-bold text-gray-400 uppercase">
                  Sample Size →
                </td>
                {dates.map((date) => (
                  <td
                    key={date}
                    className="border-r border-b-2 border-gray-200 dark:border-gray-700 px-1 py-1 text-center text-[9px] font-bold text-indigo-500 dark:text-indigo-400"
                  >
                    {(dateSamples[date] || 0).toLocaleString()}
                  </td>
                ))}
                <td className="border-b-2 border-gray-200 dark:border-gray-700 px-1 py-1 text-center text-[9px] font-bold text-indigo-500">
                  {grandTotalSample.toLocaleString()}
                </td>
              </tr>
            </thead>

            <tbody>
              {pageRows.map((row, rowIdx) => (
                <tr
                  key={row.defectKey}
                  className={`transition-colors hover:brightness-95 ${rowIdx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50/50 dark:bg-gray-800/60"}`}
                >
                  {/* Sticky name */}
                  <td
                    className={`sticky left-0 z-10 border-r-2 border-b border-gray-100 dark:border-gray-700 px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 ${rowIdx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-750"}`}
                    style={{ maxWidth: NAME_COL_W }}
                    title={row.defectKey}
                  >
                    <span className="block truncate text-[11px]">
                      {row.defectKey}
                    </span>
                  </td>

                  {/* Date cells */}
                  {dates.map((date) => {
                    const cell = row.cells[date] || { qty: 0, rate: 0 };
                    const cs = cellStyle(cell.rate, cell.qty);
                    return (
                      <td
                        key={date}
                        className={`border-r border-b border-gray-100 dark:border-gray-700 px-1 py-2 text-center ${cs.bg}`}
                        title={`${row.defectKey} · ${date} · ${cell.qty} defects · ${cell.rate.toFixed(2)}%`}
                      >
                        {cell.qty > 0 ? (
                          <div className="flex flex-col items-center gap-0.5">
                            {/* Larger font, always 2 decimal places */}
                            <span
                              className={`text-[12px] font-black leading-none ${cs.text}`}
                            >
                              {cell.rate.toFixed(2)}%
                            </span>
                            <span className="text-[9px] text-gray-400 font-medium leading-none">
                              ({cell.qty})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 dark:text-gray-600">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* Compact total */}
                  <td
                    className="border-b border-gray-100 dark:border-gray-700 px-1 py-2 text-center"
                    style={{ width: TOTAL_COL_W }}
                  >
                    <span className="text-[11px] font-black text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                      {row.totalQty}
                    </span>
                  </td>
                </tr>
              ))}

              {/* Padding rows */}
              {pageRows.length < PAGE_SIZE &&
                Array.from({ length: PAGE_SIZE - pageRows.length }).map(
                  (_, i) => (
                    <tr key={`pad-${i}`} className="bg-white dark:bg-gray-800">
                      <td
                        className="sticky left-0 z-10 bg-white dark:bg-gray-800 border-r-2 border-b border-gray-100 dark:border-gray-700 px-3"
                        style={{ height: 37 }}
                      />
                      {dates.map((date) => (
                        <td
                          key={date}
                          className="border-r border-b border-gray-100 dark:border-gray-700"
                        />
                      ))}
                      <td className="border-b border-gray-100 dark:border-gray-700" />
                    </tr>
                  ),
                )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0 flex-wrap">
        <Legend />
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`rounded-full transition-all duration-200 ${i === page ? "w-5 h-2 bg-indigo-500" : "w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-indigo-300"}`}
              />
            ))}
          </div>
        )}
        <div className="text-[9px] text-gray-300 dark:text-gray-600 font-medium ml-auto">
          {allRows.length} defects · {dates.length} days · auto 10s
        </div>
      </div>
    </div>
  );
};

export default DefectTrendChart;
