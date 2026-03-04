import React, { useState, useMemo, useEffect, useRef } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  Tag,
  AlertCircle,
  TrendingUp,
  Percent,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Factory,
  Package,
} from "lucide-react";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const ITEMS_PER_PAGE = 7;
const AUTO_ADVANCE_INTERVAL = 10000; // 10 seconds

// ─────────────────────────────────────────────
// COLORS FOR DEFECT TYPES
// ─────────────────────────────────────────────
const DEFECT_COLORS = [
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#F97316", // Orange
  "#EC4899", // Pink
  "#8B5CF6", // Violet
  "#6366F1", // Indigo
  "#3B82F6", // Blue
  "#14B8A6", // Teal
  "#10B981", // Emerald
  "#84CC16", // Lime
];

// ─────────────────────────────────────────────
// GET RATE COLOR
// ─────────────────────────────────────────────
const getRateColor = (rate) => {
  if (rate < 1)
    return {
      color: "#22C55E",
      bg: "bg-emerald-100 dark:bg-emerald-900/40",
      text: "text-emerald-700 dark:text-emerald-300",
    };
  if (rate < 3)
    return {
      color: "#84CC16",
      bg: "bg-lime-100 dark:bg-lime-900/40",
      text: "text-lime-700 dark:text-lime-300",
    };
  if (rate <= 5)
    return {
      color: "#F59E0B",
      bg: "bg-amber-100 dark:bg-amber-900/40",
      text: "text-amber-700 dark:text-amber-300",
    };
  return {
    color: "#EF4444",
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-700 dark:text-red-300",
  };
};

// ─────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, totalOutput }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const defectRate =
      totalOutput > 0 ? (data.TotalDefects / totalOutput) * 100 : 0;
    const rateInfo = getRateColor(defectRate);

    return (
      <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 max-w-[280px]">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: data.color || "#EF4444" }}
          />
          <p className="text-sm font-bold text-gray-800 dark:text-white break-words">
            {data.ReworkName || `Code: ${data.ReworkCode}`}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Defects:
            </span>
            <span className="text-lg font-black text-red-600 dark:text-red-400 tabular-nums">
              {data.TotalDefects?.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Rate:
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-bold ${rateInfo.bg} ${rateInfo.text}`}
            >
              {defectRate.toFixed(2)}%
            </span>
          </div>

          <div className="flex gap-4 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
            <div>
              <span className="text-gray-400 dark:text-gray-500">Lines: </span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {data.LineCount}
              </span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-gray-500">MOs: </span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {data.MOCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// ─────────────────────────────────────────────
// PIE CHART LABEL
// ─────────────────────────────────────────────
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────
const ChartSkeleton = () => (
  <div className="flex flex-col gap-3 p-5 animate-pulse">
    {[80, 65, 50, 40, 30, 25, 20].map((w, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div
          className="h-7 bg-gray-200 dark:bg-gray-700 rounded-lg"
          style={{ width: `${w}%` }}
        />
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
const EmptyChart = () => (
  <div className="h-[300px] flex flex-col items-center justify-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
      <Tag className="w-7 h-7 text-gray-300 dark:text-gray-500" />
    </div>
    <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">
      No defect types found
    </p>
  </div>
);

// ─────────────────────────────────────────────
// DEFECT TYPE ROW (Enhanced with highlighted cards)
// ─────────────────────────────────────────────
const DefectTypeRow = ({
  item,
  index,
  globalIndex,
  maxDefects,
  totalDefects,
  totalOutput,
  color,
}) => {
  const percentage =
    totalDefects > 0
      ? ((item.TotalDefects / totalDefects) * 100).toFixed(1)
      : 0;
  const defectRate =
    totalOutput > 0 ? (item.TotalDefects / totalOutput) * 100 : 0;
  const barWidth = maxDefects > 0 ? (item.TotalDefects / maxDefects) * 100 : 0;
  const rateInfo = getRateColor(defectRate);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors rounded-lg px-3 -mx-1">
      {/* Rank Badge */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md"
        style={{ backgroundColor: color }}
      >
        {globalIndex + 1}
      </div>

      {/* Name & Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-gray-800 dark:text-white break-words leading-tight">
            {item.ReworkName || `Defect Code ${item.ReworkCode}`}
          </p>

          {/* Highlighted Lines/MOs Card */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50">
              <Factory className="w-3 h-3 text-blue-500 dark:text-blue-400" />
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                {item.LineCount} Lines
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800/50">
              <Package className="w-3 h-3 text-violet-500 dark:text-violet-400" />
              <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300">
                {item.MOCount} MOs
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar & Code */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
            Code: {item.ReworkCode}
          </span>
          <div className="flex-1 max-w-[150px]">
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%`, backgroundColor: color }}
              />
            </div>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {percentage}% of total
          </span>
        </div>
      </div>

      {/* Defect Rate Badge */}
      <div
        className={`px-3 py-2 rounded-xl text-center flex-shrink-0 min-w-[80px] ${rateInfo.bg} border ${
          rateInfo.color === "#EF4444"
            ? "border-red-200 dark:border-red-800/50"
            : rateInfo.color === "#F59E0B"
              ? "border-amber-200 dark:border-amber-800/50"
              : "border-emerald-200 dark:border-emerald-800/50"
        }`}
      >
        <div className="flex items-center justify-center gap-1">
          <Percent className={`w-3.5 h-3.5 ${rateInfo.text}`} />
          <span
            className={`text-base font-black tabular-nums ${rateInfo.text}`}
          >
            {defectRate.toFixed(2)}
          </span>
        </div>
        <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
          Defect Rate
        </p>
      </div>

      {/* Count */}
      <div className="text-right min-w-[65px] flex-shrink-0">
        <p className="text-xl font-black text-gray-800 dark:text-white tabular-nums">
          {item.TotalDefects.toLocaleString()}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">defects</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// PAGINATED LIST VIEW
// ─────────────────────────────────────────────
const PaginatedListView = ({ data, totalOutput, totalDefects, maxDefects }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  // Calculate total pages
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  // Get current page data
  const currentPageData = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [data, currentPage]);

  // Auto-advance
  useEffect(() => {
    if (!isPaused && totalPages > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentPage((prev) => (prev + 1) % totalPages);
      }, AUTO_ADVANCE_INTERVAL);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, totalPages]);

  const goToPrev = () => {
    setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const goToPage = (pageIndex) => {
    setCurrentPage(pageIndex);
  };

  return (
    <div className="relative">
      {/* Navigation Header */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Page {currentPage + 1} of {totalPages}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              ({data.length} types)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-1.5 rounded-lg transition-colors ${
                isPaused
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
              title={isPaused ? "Resume auto-play" : "Pause auto-play"}
            >
              {isPaused ? (
                <Play className="w-3.5 h-3.5" />
              ) : (
                <Pause className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Navigation Arrows */}
            <button
              onClick={goToPrev}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content Container with Horizontal Scroll Animation */}
      <div ref={containerRef} className="overflow-hidden">
        <div
          className="transition-transform duration-500 ease-out"
          style={{ transform: `translateX(0)` }}
        >
          {currentPageData.map((item, index) => {
            const globalIndex = currentPage * ITEMS_PER_PAGE + index;
            return (
              <DefectTypeRow
                key={item.ReworkCode}
                item={item}
                index={index}
                globalIndex={globalIndex}
                maxDefects={maxDefects}
                totalDefects={totalDefects}
                totalOutput={totalOutput}
                color={DEFECT_COLORS[globalIndex % DEFECT_COLORS.length]}
              />
            );
          })}
        </div>
      </div>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToPage(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentPage === idx
                  ? "w-8 bg-gradient-to-r from-amber-500 to-orange-500"
                  : "w-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            />
          ))}
        </div>
      )}

      {/* Auto-play indicator */}
      {totalPages > 1 && !isPaused && (
        <div className="flex items-center justify-center mt-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700/50">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              Auto-advancing every 10s
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// TOP 5 LEGEND (For Pie Chart)
// ─────────────────────────────────────────────
const Top5Legend = ({ data, totalOutput }) => {
  const top5 = data.slice(0, 5);

  return (
    <div className="flex-1 flex flex-col justify-center pl-4">
      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Top 5 Defects
      </h4>
      <div className="space-y-2.5">
        {top5.map((item, index) => {
          const defectRate =
            totalOutput > 0 ? (item.TotalDefects / totalOutput) * 100 : 0;
          const rateInfo = getRateColor(defectRate);

          return (
            <div
              key={item.ReworkCode}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600/50 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
            >
              {/* Color & Rank */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shadow-md"
                style={{ backgroundColor: item.color }}
              >
                {index + 1}
              </div>

              {/* Name & Info Cards */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-200 break-words leading-tight mb-1">
                  {item.ReworkName || `Code ${item.ReworkCode}`}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30">
                    <Factory className="w-2.5 h-2.5 text-blue-500" />
                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">
                      {item.LineCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-900/30">
                    <Package className="w-2.5 h-2.5 text-violet-500" />
                    <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400">
                      {item.MOCount}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${rateInfo.bg} ${rateInfo.text}`}
                  >
                    {defectRate.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Count */}
              <div className="text-right flex-shrink-0">
                <p
                  className="text-base font-black tabular-nums"
                  style={{ color: item.color }}
                >
                  {item.TotalDefects.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const DefectsByTypeChart = ({ data, loading, totalOutput = 0 }) => {
  const [viewMode, setViewMode] = useState("list"); // "list" or "pie"

  const totalDefects = data.reduce((sum, d) => sum + (d.TotalDefects || 0), 0);
  const maxDefects = Math.max(...data.map((d) => d.TotalDefects || 0), 1);

  // Prepare data with colors
  const coloredData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      color: DEFECT_COLORS[index % DEFECT_COLORS.length],
      name: item.ReworkName || `Code ${item.ReworkCode}`,
      value: item.TotalDefects,
    }));
  }, [data]);

  const pieData = coloredData.slice(0, 8);

  // Overall defect rate
  const overallRate = totalOutput > 0 ? (totalDefects / totalOutput) * 100 : 0;
  const overallRateInfo = getRateColor(overallRate);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
            <Tag className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">
              Defects by Type
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {data.length > 0
                ? `${data.length} types · ${totalDefects.toLocaleString()} total`
                : "Defect type breakdown"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Overall Rate Badge */}
          {!loading && data.length > 0 && (
            <div
              className={`px-3 py-1.5 rounded-xl flex items-center gap-2 ${overallRateInfo.bg} border border-gray-200 dark:border-gray-600`}
            >
              <TrendingUp className={`w-3.5 h-3.5 ${overallRateInfo.text}`} />
              <span className={`text-xs font-bold ${overallRateInfo.text}`}>
                Overall: {overallRate.toFixed(2)}%
              </span>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl gap-1">
            {["list", "pie"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
                  viewMode === mode
                    ? "bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading && data.length === 0 ? (
          <ChartSkeleton />
        ) : data.length === 0 ? (
          <EmptyChart />
        ) : viewMode === "pie" ? (
          /* ═══════════════════════════════════════
             PIE CHART VIEW WITH TOP 5 LEGEND
             ═══════════════════════════════════════ */
          <div className="flex flex-col lg:flex-row items-center gap-6 min-h-[380px]">
            {/* Pie Chart */}
            <div className="w-full lg:w-1/2 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    dataKey="value"
                    labelLine={false}
                    label={PieLabel}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip totalOutput={totalOutput} />}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label */}
              <div className="relative -mt-[195px] flex flex-col items-center justify-center pointer-events-none">
                <p className="text-3xl font-black text-gray-800 dark:text-white tabular-nums">
                  {totalDefects.toLocaleString()}
                </p>
                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Total Defects
                </p>
              </div>
              <div className="h-[85px]" />
            </div>

            {/* Top 5 Legend */}
            <Top5Legend data={coloredData} totalOutput={totalOutput} />
          </div>
        ) : (
          /* ═══════════════════════════════════════
             PAGINATED LIST VIEW
             ═══════════════════════════════════════ */
          <PaginatedListView
            data={coloredData}
            totalOutput={totalOutput}
            totalDefects={totalDefects}
            maxDefects={maxDefects}
          />
        )}
      </div>

      {/* Footer */}
      {!loading && data.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              <span className="font-bold">Top Issue:</span>{" "}
              {data[0]?.ReworkName || `Code ${data[0]?.ReworkCode}`}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-bold text-red-600 dark:text-red-400">
              {data[0]?.TotalDefects} defects
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span>
              {((data[0]?.TotalDefects / totalDefects) * 100).toFixed(1)}% of
              total
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="flex items-center gap-1">
              <Factory className="w-3 h-3" />
              {data[0]?.LineCount} Lines
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectsByTypeChart;
