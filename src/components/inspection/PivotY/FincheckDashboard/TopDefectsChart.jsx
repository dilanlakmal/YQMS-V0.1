import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Loader2,
  BarChart2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Layers,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// ─── Layout constants ────────────────────────────────────────────────────────
const YAXIS_WIDTH = 195; // enough for ~24 chars at 11px
const MAX_LINE_CHARS = 24; // wrap to 2nd line beyond this

// Badge geometry – single-line layout
const TAB_W = 22; // colored label tab
const VAL_W = 58; // "44  24%" value area
const SEV_W = TAB_W + VAL_W; // 80px per severity badge
const TOTAL_PILL_W = 36;
const GAP = 7;
// Right space: 10 + 36 + 7 + 3*(80+7) - 7 = 10+36+7+261-7 = 307  → use 310
const CHART_RIGHT_MARGIN = 310;
const BAR_H = 28;

// ─── Custom Y-Axis Tick: shows full name, wraps to 2 lines if needed ─────────
const CustomYAxisTick = ({ x, y, payload }) => {
  const name = payload?.value || "";

  let line1 = name;
  let line2 = "";

  if (name.length > MAX_LINE_CHARS) {
    // Break at last space before limit, else hard-break
    const spaceIdx = name.lastIndexOf(" ", MAX_LINE_CHARS);
    if (spaceIdx > 0) {
      line1 = name.substring(0, spaceIdx);
      line2 = name.substring(spaceIdx + 1);
    } else {
      line1 = name.substring(0, MAX_LINE_CHARS);
      line2 = name.substring(MAX_LINE_CHARS);
    }
    if (line2.length > MAX_LINE_CHARS) {
      line2 = line2.substring(0, MAX_LINE_CHARS - 1) + "…";
    }
  }

  const twoLines = line2.length > 0;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-6}
        y={twoLines ? -6 : 0}
        dy="0.35em"
        textAnchor="end"
        fontSize={11}
        fontWeight={600}
        fill="#4b5563"
      >
        {line1}
      </text>
      {twoLines && (
        <text
          x={-6}
          y={8}
          dy="0.35em"
          textAnchor="end"
          fontSize={10}
          fontWeight={500}
          fill="#6b7280"
        >
          {line2}
        </text>
      )}
    </g>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────
const TopDefectsChart = ({
  startDate,
  endDate,
  reportType,
  orderFilter,
  buyer,
  qaFilter,
}) => {
  const [fullData, setFullData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch
  useEffect(() => {
    if (!startDate || !endDate) return;
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-dashboard/top-defects`,
          {
            params: {
              startDate,
              endDate,
              reportType,
              orderFilter,
              buyer,
              qaFilter,
            },
          },
        );
        if (res.data.success) {
          setFullData(res.data.data);
          setCurrentPage(0);
        }
      } catch (err) {
        console.error("Error fetching Top Defects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [startDate, endDate, reportType, orderFilter, buyer, qaFilter]);

  // Summary totals
  const summary = useMemo(
    () =>
      fullData.reduce(
        (acc, item) => ({
          total: acc.total + item.total,
          minor: acc.minor + item.minor,
          major: acc.major + item.major,
          critical: acc.critical + item.critical,
        }),
        { total: 0, minor: 0, major: 0, critical: 0 },
      ),
    [fullData],
  );

  // Pagination
  const totalPages = Math.ceil(fullData.length / pageSize);
  const currentData = fullData.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  // Auto-rotate
  useEffect(() => {
    if (loading || fullData.length <= pageSize || isPaused) return;
    const id = setInterval(
      () => setCurrentPage((p) => (p + 1) % totalPages),
      10000,
    );
    return () => clearInterval(id);
  }, [fullData.length, pageSize, isPaused, loading, totalPages]);

  const handleNext = () => setCurrentPage((p) => (p + 1) % totalPages);
  const handlePrev = () =>
    setCurrentPage((p) => (p === 0 ? totalPages - 1 : p - 1));

  const getBarColor = (item) => {
    if (item.critical > 0) return "#ef4444";
    if (item.major > item.minor) return "#f97316";
    return "#22c55e";
  };

  // ── Tooltip ──────────────────────────────────────────────────────────────
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const total = d.total || 1;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-w-[220px]">
        <p className="font-bold text-gray-800 dark:text-white text-sm mb-2 border-b border-gray-100 dark:border-gray-700 pb-1 leading-snug">
          {d.name}
        </p>
        <div className="flex items-center justify-between gap-4 text-xs mb-2">
          <span className="text-gray-500 font-medium">Total Defects:</span>
          <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
            {d.total}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dashed border-gray-100 dark:border-gray-700">
          {[
            { label: "Minor", val: d.minor, color: "text-green-600" },
            { label: "Major", val: d.major, color: "text-orange-500" },
            { label: "Critical", val: d.critical, color: "text-red-500" },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center">
              <p className={`text-[9px] font-bold uppercase ${color}`}>
                {label}
              </p>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {val}{" "}
                <span className="text-gray-400 font-normal">
                  ({Math.round((val / total) * 100)}%)
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Bar Label: single-line badges ─────────────────────────────────────────
  //
  //   [181]  [MI | 44  24%]  [MA | 137  76%]  [CR | 0  0%]
  //
  const CustomBarLabel = (props) => {
    const { x, y, width, height, value, index } = props;
    const item = currentData[index];
    if (!item || !width || width < 0) return null;

    const total = item.total || 1;
    const miPct = Math.round((item.minor / total) * 100);
    const maPct = Math.round((item.major / total) * 100);
    const crPct = Math.round((item.critical / total) * 100);

    const bh = 18;
    const cy = y + height / 2;
    const by = cy - bh / 2;

    const sx = x + width + 10;
    const x0 = sx;
    const x1 = x0 + TOTAL_PILL_W + GAP;
    const x2 = x1 + SEV_W + GAP;
    const x3 = x2 + SEV_W + GAP;

    // Renders one [LABEL | count  pct%] badge
    const Badge = ({
      bx,
      label,
      count,
      pct,
      tabColor,
      bgColor,
      valueColor,
    }) => (
      <g>
        {/* Light bg */}
        <rect x={bx} y={by} width={SEV_W} height={bh} rx={4} fill={bgColor} />
        {/* Colored left tab */}
        <rect x={bx} y={by} width={TAB_W} height={bh} rx={4} fill={tabColor} />
        {/* Square the tab's right corners so it joins flush */}
        <rect x={bx + TAB_W - 5} y={by} width={5} height={bh} fill={tabColor} />
        {/* Subtle divider */}
        <line
          x1={bx + TAB_W + 0.5}
          y1={by + 3}
          x2={bx + TAB_W + 0.5}
          y2={by + bh - 3}
          stroke={tabColor}
          strokeWidth={1}
          opacity={0.3}
        />
        {/* Label in tab */}
        <text
          x={bx + TAB_W / 2}
          y={cy + 4}
          textAnchor="middle"
          fontSize={9}
          fontWeight="bold"
          fill="white"
          style={{ userSelect: "none" }}
        >
          {label}
        </text>
        {/* Count (left-aligned in value area) */}
        <text
          x={bx + TAB_W + 8}
          y={cy + 4}
          textAnchor="start"
          fontSize={10}
          fontWeight="800"
          fill={valueColor}
          style={{ userSelect: "none" }}
        >
          {count}
        </text>
        {/* Pct (right-aligned in value area) */}
        <text
          x={bx + SEV_W - 5}
          y={cy + 4}
          textAnchor="end"
          fontSize={9}
          fontWeight="500"
          fill={valueColor}
          opacity={0.75}
          style={{ userSelect: "none" }}
        >
          {pct}%
        </text>
      </g>
    );

    return (
      <g>
        {/* Total pill */}
        <rect
          x={x0}
          y={by}
          width={TOTAL_PILL_W}
          height={bh}
          rx={4}
          fill="#e0e7ff"
        />
        <text
          x={x0 + TOTAL_PILL_W / 2}
          y={cy + 4}
          textAnchor="middle"
          fontSize={11}
          fontWeight="900"
          fill="#4338ca"
          style={{ userSelect: "none" }}
        >
          {value}
        </text>

        <Badge
          bx={x1}
          label="MI"
          count={item.minor}
          pct={miPct}
          tabColor="#16a34a"
          bgColor="#dcfce7"
          valueColor="#166534"
        />
        <Badge
          bx={x2}
          label="MA"
          count={item.major}
          pct={maPct}
          tabColor="#ea580c"
          bgColor="#ffedd5"
          valueColor="#9a3412"
        />
        <Badge
          bx={x3}
          label="CR"
          count={item.critical}
          pct={crPct}
          tabColor="#dc2626"
          bgColor="#fee2e2"
          valueColor="#991b1b"
        />
      </g>
    );
  };

  // ── Summary card ──────────────────────────────────────────────────────────
  const SummaryCard = ({ title, count, colorClass, icon: Icon }) => (
    <div
      className={`flex-1 min-w-[120px] rounded-xl p-3 border ${colorClass.border} ${colorClass.bg} flex items-center gap-3 transition-transform hover:-translate-y-1`}
    >
      <div
        className={`p-2 rounded-lg ${colorClass.iconBg} ${colorClass.iconColor}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold text-gray-500">{title}</p>
        <p className={`text-lg font-black ${colorClass.textColor}`}>
          {count.toLocaleString()}
        </p>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 h-full flex flex-col animate-fadeIn relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white text-lg leading-tight">
              Top Defect Issues
            </h3>
            <p className="text-xs text-gray-500">
              Breakdown by severity &amp; frequency
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1 border border-gray-200 dark:border-gray-600">
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              Show:
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
              className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
            >
              <option value={3}>Top 3</option>
              <option value={5}>Top 5</option>
              <option value={7}>Top 7</option>
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
            </select>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-0.5 border border-gray-200 dark:border-gray-600">
              <button
                onClick={handlePrev}
                className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors text-gray-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono font-bold text-gray-500 w-12 text-center">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={handleNext}
                className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors text-gray-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {totalPages > 1 && (
            <div className="text-gray-300">
              {isPaused ? (
                <Pause className="w-3 h-3" />
              ) : (
                <Play className="w-3 h-3" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-3 mb-4 shrink-0">
        <SummaryCard
          title="Total Defects"
          count={summary.total}
          icon={Layers}
          colorClass={{
            bg: "bg-gray-50 dark:bg-gray-700/30",
            border: "border-gray-100 dark:border-gray-600",
            iconBg: "bg-gray-200 dark:bg-gray-600",
            iconColor: "text-gray-600 dark:text-gray-300",
            textColor: "text-gray-800 dark:text-white",
          }}
        />
        <SummaryCard
          title="Minor"
          count={summary.minor}
          icon={CheckCircle2}
          colorClass={{
            bg: "bg-green-50 dark:bg-green-900/10",
            border: "border-green-100 dark:border-green-800",
            iconBg: "bg-green-100 dark:bg-green-900/30",
            iconColor: "text-green-600 dark:text-green-400",
            textColor: "text-green-700 dark:text-green-400",
          }}
        />
        <SummaryCard
          title="Major"
          count={summary.major}
          icon={AlertCircle}
          colorClass={{
            bg: "bg-orange-50 dark:bg-orange-900/10",
            border: "border-orange-100 dark:border-orange-800",
            iconBg: "bg-orange-100 dark:bg-orange-900/30",
            iconColor: "text-orange-600 dark:text-orange-400",
            textColor: "text-orange-700 dark:text-orange-400",
          }}
        />
        <SummaryCard
          title="Critical"
          count={summary.critical}
          icon={XCircle}
          colorClass={{
            bg: "bg-red-50 dark:bg-red-900/10",
            border: "border-red-100 dark:border-red-800",
            iconBg: "bg-red-100 dark:bg-red-900/30",
            iconColor: "text-red-600 dark:text-red-400",
            textColor: "text-red-700 dark:text-red-400",
          }}
        />
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-[400px] overflow-hidden">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-rose-500" />
            <p className="text-sm">Aggregating Defect Data...</p>
          </div>
        ) : fullData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
            <AlertTriangle className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">
              No defects found for the selected criteria
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={currentData}
              layout="vertical"
              margin={{ top: 5, right: CHART_RIGHT_MARGIN, left: 8, bottom: 5 }}
              barCategoryGap="25%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e5e7eb"
                opacity={0.5}
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={YAXIS_WIDTH}
                tick={<CustomYAxisTick />}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(99,102,241,0.05)" }}
                content={<CustomTooltip />}
              />
              <Bar
                dataKey="total"
                radius={[0, 4, 4, 0]}
                barSize={BAR_H}
                animationDuration={800}
                label={<CustomBarLabel />}
                isAnimationActive
              >
                {currentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
          Legend:
        </span>
        {[
          { color: "#16a34a", label: "MI = Minor" },
          { color: "#ea580c", label: "MA = Major" },
          { color: "#dc2626", label: "CR = Critical" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] text-gray-500 font-medium">
              {label}
            </span>
          </div>
        ))}
        <div className="ml-auto text-[9px] text-gray-300 font-medium">
          Autoplay: 10s
        </div>
      </div>
    </div>
  );
};

export default TopDefectsChart;
