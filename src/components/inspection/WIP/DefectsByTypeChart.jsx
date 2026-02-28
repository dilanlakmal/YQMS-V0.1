import React, { useState, useMemo } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  Tag,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  Percent,
} from "lucide-react";

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
          <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
            {data.ReworkName || `Code: ${data.ReworkCode}`}
          </p>
        </div>

        <div className="space-y-2">
          {/* Defect Count */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Defects:
            </span>
            <span className="text-lg font-black text-red-600 dark:text-red-400 tabular-nums">
              {data.TotalDefects?.toLocaleString()}
            </span>
          </div>

          {/* Defect Rate */}
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

          {/* Additional Info */}
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
    {[80, 65, 50, 40, 30].map((w, i) => (
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
// DEFECT TYPE ROW (List View)
// ─────────────────────────────────────────────
const DefectTypeRow = ({
  item,
  index,
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
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors rounded-lg px-2 -mx-2">
      {/* Rank Badge */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
        style={{ backgroundColor: color }}
      >
        {index + 1}
      </div>

      {/* Name & Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
          {item.ReworkName || `Defect Code ${item.ReworkCode}`}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            Code: {item.ReworkCode}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {item.LineCount} lines
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {item.MOCount} MOs
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-24 flex-shrink-0 hidden sm:block">
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${barWidth}%`, backgroundColor: color }}
          />
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 text-right">
          {percentage}%
        </p>
      </div>

      {/* Defect Rate Badge */}
      <div
        className={`px-2.5 py-1.5 rounded-lg text-center flex-shrink-0 min-w-[70px] ${rateInfo.bg}`}
      >
        <div className="flex items-center justify-center gap-1">
          <Percent className={`w-3 h-3 ${rateInfo.text}`} />
          <span className={`text-sm font-black tabular-nums ${rateInfo.text}`}>
            {defectRate.toFixed(2)}
          </span>
        </div>
        <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">
          Rate
        </p>
      </div>

      {/* Count */}
      <div className="text-right min-w-[55px] flex-shrink-0">
        <p className="text-base font-black text-gray-800 dark:text-white tabular-nums">
          {item.TotalDefects.toLocaleString()}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">defects</p>
      </div>
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
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600/50"
            >
              {/* Color & Rank */}
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: item.color }}
              >
                {index + 1}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                  {item.ReworkName || `Code ${item.ReworkCode}`}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {/* Rate Badge */}
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
                  className="text-sm font-black tabular-nums"
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
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" or "pie"

  const displayData = expanded ? data : data.slice(0, 8);
  const hasMore = data.length > 8;
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
          <div className="flex flex-col lg:flex-row items-center gap-6 min-h-[320px]">
            {/* Pie Chart */}
            <div className="w-full lg:w-1/2 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={100}
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
              <div className="relative -mt-[180px] flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-black text-gray-800 dark:text-white tabular-nums">
                  {totalDefects.toLocaleString()}
                </p>
                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Total
                </p>
              </div>
              <div className="h-[70px]" /> {/* Spacer to push content down */}
            </div>

            {/* Top 5 Legend */}
            <Top5Legend data={coloredData} totalOutput={totalOutput} />
          </div>
        ) : (
          /* ═══════════════════════════════════════
             LIST VIEW
             ═══════════════════════════════════════ */
          <div>
            {displayData.map((item, index) => (
              <DefectTypeRow
                key={item.ReworkCode}
                item={item}
                index={index}
                maxDefects={maxDefects}
                totalDefects={totalDefects}
                totalOutput={totalOutput}
                color={DEFECT_COLORS[index % DEFECT_COLORS.length]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Show More Button (List View Only) */}
      {hasMore && viewMode === "list" && !loading && (
        <div className="px-5 pb-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2.5 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {expanded ? "Show Less" : `Show All ${data.length} Types`}
          </button>
        </div>
      )}

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
            <span>{data[0]?.TotalDefects} defects</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span>
              {((data[0]?.TotalDefects / totalDefects) * 100).toFixed(1)}% of
              total
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectsByTypeChart;
