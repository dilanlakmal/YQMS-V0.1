// import React, { useState } from "react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   LabelList,
//   Cell,
// } from "recharts";
// import { BarChart3, TrendingUp, Clock } from "lucide-react";

// // ─────────────────────────────────────────────
// // DESIGN TOKENS
// // ─────────────────────────────────────────────
// const TASK_CONFIG = {
//   38: {
//     label: "Task 38",
//     bar: "#6366f1",
//     barHover: "#818cf8",
//     badge:
//       "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700",
//     dot: "bg-indigo-500",
//     accent: "from-indigo-500 to-violet-600",
//   },
//   39: {
//     label: "Task 39",
//     bar: "#10b981",
//     barHover: "#34d399",
//     badge:
//       "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
//     dot: "bg-emerald-500",
//     accent: "from-emerald-500 to-teal-600",
//   },
// };

// // ─────────────────────────────────────────────
// // CUSTOM TOOLTIP WITH MO DETAILS
// // ─────────────────────────────────────────────
// const CustomTooltip = ({ active, payload, label, taskColor }) => {
//   if (active && payload && payload.length) {
//     const data = payload[0].payload;
//     const moDetails = data.MODetails || [];

//     return (
//       <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 min-w-[200px]">
//         <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
//           {label}
//         </p>
//         <div className="flex items-baseline gap-1.5 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
//           <span
//             className="text-2xl font-black tabular-nums"
//             style={{ color: taskColor }}
//           >
//             {payload[0].value?.toLocaleString()}
//           </span>
//           <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">
//             pcs total
//           </span>
//         </div>

//         {/* MO Details */}
//         {moDetails.length > 0 && (
//           <div className="space-y-1.5">
//             <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
//               MO Breakdown
//             </p>
//             <div className="max-h-32 overflow-y-auto space-y-1">
//               {moDetails.map((mo, idx) => (
//                 <div
//                   key={idx}
//                   className="flex items-center justify-between text-xs"
//                 >
//                   <span className="text-gray-600 dark:text-gray-300 font-medium truncate max-w-[120px]">
//                     {mo.MONo}
//                   </span>
//                   <span
//                     className="font-bold tabular-nums"
//                     style={{ color: taskColor }}
//                   >
//                     {mo.Qty.toLocaleString()}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   }
//   return null;
// };

// // ─────────────────────────────────────────────
// // CUSTOM BAR LABEL
// // ─────────────────────────────────────────────
// const BarLabel = (props) => {
//   const { x, y, width, value } = props;
//   if (!value) return null;
//   return (
//     <text
//       x={x + width / 2}
//       y={y - 6}
//       fill="#6b7280"
//       textAnchor="middle"
//       dominantBaseline="bottom"
//       className="text-[11px] font-bold fill-gray-500 dark:fill-gray-400"
//       fontSize={11}
//       fontWeight={700}
//     >
//       {value?.toLocaleString()}
//     </text>
//   );
// };

// // ─────────────────────────────────────────────
// // SKELETON LOADER FOR CHART
// // ─────────────────────────────────────────────
// const ChartSkeleton = () => (
//   <div className="h-full flex items-end gap-2 px-4 animate-pulse">
//     {[60, 80, 45, 90, 70, 55, 85, 40, 75, 65].map((h, i) => (
//       <div key={i} className="flex-1 flex items-end">
//         <div
//           className="rounded-t-lg bg-gray-100 dark:bg-gray-700 w-full"
//           style={{ height: `${h}%` }}
//         />
//       </div>
//     ))}
//   </div>
// );

// // ─────────────────────────────────────────────
// // EMPTY STATE
// // ─────────────────────────────────────────────
// const EmptyChart = () => (
//   <div className="h-full flex flex-col items-center justify-center gap-3">
//     <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
//       <BarChart3 className="w-8 h-8 text-gray-300 dark:text-gray-600" />
//     </div>
//     <div className="text-center">
//       <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">
//         No production data available
//       </p>
//       <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
//         Data will appear once lines begin producing today
//       </p>
//     </div>
//   </div>
// );

// // ─────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────
// const ProductionByLineChart = ({
//   chartData,
//   selectedTask,
//   onTaskChange,
//   loading,
// }) => {
//   const [hoveredBar, setHoveredBar] = useState(null);
//   const task = TASK_CONFIG[selectedTask];
//   const totalQty = chartData.reduce((s, d) => s + (d.TotalQty || 0), 0);
//   const maxQty = Math.max(...chartData.map((d) => d.TotalQty || 0), 1);

//   return (
//     <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
//       {/* Panel header */}
//       <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div className="flex items-center gap-3">
//           <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
//             <BarChart3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
//           </div>
//           <div>
//             <h2 className="text-sm font-bold text-gray-800 dark:text-white">
//               Production Output by Line
//             </h2>
//             <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
//               {chartData.length > 0
//                 ? `${chartData.length} lines · ${totalQty.toLocaleString()} total pcs`
//                 : "Today's production data"}
//             </p>
//           </div>
//         </div>

//         {/* Task Segmented Control */}
//         <div className="flex p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl gap-1">
//           {Object.entries(TASK_CONFIG).map(([key, cfg]) => (
//             <button
//               key={key}
//               onClick={() => onTaskChange(key)}
//               className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
//                 selectedTask === key
//                   ? `bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm`
//                   : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
//               }`}
//             >
//               {selectedTask === key && (
//                 <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
//               )}
//               {cfg.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Chart body */}
//       <div className="p-6">
//         <div className="h-[420px] w-full">
//           {loading && chartData.length === 0 ? (
//             <ChartSkeleton />
//           ) : chartData.length === 0 ? (
//             <EmptyChart />
//           ) : (
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart
//                 data={chartData}
//                 margin={{ top: 28, right: 8, left: -12, bottom: 4 }}
//                 barSize={Math.max(
//                   20,
//                   Math.min(52, 420 / chartData.length - 10),
//                 )}
//               >
//                 <CartesianGrid
//                   strokeDasharray="3 3"
//                   vertical={false}
//                   stroke="#f3f4f6"
//                   className="dark:opacity-20"
//                 />

//                 <XAxis
//                   dataKey="LineNo"
//                   axisLine={false}
//                   tickLine={false}
//                   tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 600 }}
//                   dy={8}
//                 />

//                 <YAxis
//                   axisLine={false}
//                   tickLine={false}
//                   tick={{ fill: "#9ca3af", fontSize: 11 }}
//                   tickFormatter={(v) => v.toLocaleString()}
//                 />

//                 <Tooltip
//                   content={<CustomTooltip taskColor={task.bar} />}
//                   cursor={{ fill: "rgba(99,102,241,0.04)", rx: 6 }}
//                 />

//                 <Bar
//                   dataKey="TotalQty"
//                   radius={[6, 6, 0, 0]}
//                   animationDuration={800}
//                   animationEasing="ease-out"
//                   onMouseEnter={(_, index) => setHoveredBar(index)}
//                   onMouseLeave={() => setHoveredBar(null)}
//                 >
//                   <LabelList content={<BarLabel />} />
//                   {chartData.map((entry, index) => (
//                     <Cell
//                       key={`cell-${index}`}
//                       fill={
//                         hoveredBar === null || hoveredBar === index
//                           ? task.bar
//                           : `${task.bar}55`
//                       }
//                     />
//                   ))}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           )}
//         </div>
//       </div>

//       {/* Summary footer strip */}
//       {!loading && chartData.length > 0 && (
//         <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-gray-500 dark:text-gray-400">
//           <div className="flex items-center gap-1.5">
//             <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
//             <span className="font-medium">
//               Peak:{" "}
//               <span className="text-gray-700 dark:text-gray-200 font-bold">
//                 {chartData.find((d) => d.TotalQty === maxQty)?.LineNo} —{" "}
//                 {maxQty.toLocaleString()} pcs
//               </span>
//             </span>
//           </div>
//           <span className="hidden sm:inline text-gray-300 dark:text-gray-600">
//             ·
//           </span>
//           <span>
//             Avg:{" "}
//             <span className="text-gray-700 dark:text-gray-200 font-bold">
//               {Math.round(totalQty / chartData.length).toLocaleString()} pcs /
//               line
//             </span>
//           </span>
//           <span className="hidden sm:inline text-gray-300 dark:text-gray-600">
//             ·
//           </span>
//           <span className="flex items-center gap-1">
//             <Clock className="w-3 h-3" />
//             Auto-refresh in 60s
//           </span>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProductionByLineChart;

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import { BarChart3, TrendingUp, Clock } from "lucide-react";

// ─────────────────────────────────────────────
// TASK CONFIG
// ─────────────────────────────────────────────
const TASK_CONFIG = {
  38: {
    label: "Inside",
    dot: "bg-indigo-500",
  },
  39: {
    label: "Outside",
    dot: "bg-emerald-500",
  },
};

// ─────────────────────────────────────────────
// BUYER COLORS CONFIG
// ─────────────────────────────────────────────
const BUYER_COLORS = {
  Aritzia: {
    color: "#f43f5e",
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-rose-500",
    label: "Aritzia",
  },
  Costco: {
    color: "#3b82f6",
    gradient: "from-blue-500 to-cyan-600",
    bg: "bg-blue-500",
    label: "Costco",
  },
  MWW: {
    color: "#f59e0b",
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-500",
    label: "MWW",
  },
  Reitmans: {
    color: "#8b5cf6",
    gradient: "from-purple-500 to-violet-600",
    bg: "bg-purple-500",
    label: "Reitmans",
  },
  ANF: {
    color: "#14b8a6",
    gradient: "from-teal-500 to-emerald-600",
    bg: "bg-teal-500",
    label: "ANF",
  },
  STORI: {
    color: "#6366f1",
    gradient: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-500",
    label: "STORI",
  },
  Elite: {
    color: "#64748b",
    gradient: "from-slate-500 to-gray-600",
    bg: "bg-slate-500",
    label: "Elite",
  },
  Mixed: {
    color: "#ec4899",
    gradient: "from-pink-500 to-fuchsia-600",
    bg: "bg-gradient-to-r from-pink-500 to-fuchsia-600",
    label: "Mixed",
    pattern: true,
  },
  Other: {
    color: "#9ca3af",
    gradient: "from-gray-400 to-gray-500",
    bg: "bg-gray-400",
    label: "Other",
  },
};

// ─────────────────────────────────────────────
// CUSTOM TOOLTIP WITH MO DETAILS
// ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const moDetails = data.MODetails || [];
    const buyerConfig = BUYER_COLORS[data.Buyer] || BUYER_COLORS["Other"];

    return (
      <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 min-w-[220px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${buyerConfig.bg}`}
          >
            {data.Buyer}
          </span>
        </div>

        {/* Total */}
        <div className="flex items-baseline gap-1.5 mb-3">
          <span
            className="text-2xl font-black tabular-nums"
            style={{ color: buyerConfig.color }}
          >
            {payload[0].value?.toLocaleString()}
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">
            pcs total
          </span>
        </div>

        {/* MO Details */}
        {moDetails.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              MO Breakdown
            </p>
            <div className="max-h-36 overflow-y-auto space-y-1.5">
              {moDetails.map((mo, idx) => {
                const moBuyerConfig =
                  BUYER_COLORS[mo.Buyer] || BUYER_COLORS["Other"];
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: moBuyerConfig.color }}
                      />
                      <span className="text-gray-600 dark:text-gray-300 font-medium truncate max-w-[120px]">
                        {mo.MONo}
                      </span>
                    </div>
                    <span
                      className="font-bold tabular-nums flex-shrink-0"
                      style={{ color: moBuyerConfig.color }}
                    >
                      {mo.Qty.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// ─────────────────────────────────────────────
// CUSTOM BAR LABEL
// ─────────────────────────────────────────────
const BarLabel = (props) => {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      fill="#6b7280"
      textAnchor="middle"
      dominantBaseline="bottom"
      className="text-[11px] font-bold fill-gray-500 dark:fill-gray-400"
      fontSize={11}
      fontWeight={700}
    >
      {value?.toLocaleString()}
    </text>
  );
};

// ─────────────────────────────────────────────
// SKELETON LOADER FOR CHART
// ─────────────────────────────────────────────
const ChartSkeleton = () => (
  <div className="h-full flex items-end gap-2 px-4 animate-pulse">
    {[60, 80, 45, 90, 70, 55, 85, 40, 75, 65].map((h, i) => (
      <div key={i} className="flex-1 flex items-end">
        <div
          className="rounded-t-lg bg-gray-100 dark:bg-gray-700 w-full"
          style={{ height: `${h}%` }}
        />
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
const EmptyChart = () => (
  <div className="h-full flex flex-col items-center justify-center gap-3">
    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
      <BarChart3 className="w-8 h-8 text-gray-300 dark:text-gray-600" />
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">
        No production data available
      </p>
      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
        Data will appear once lines begin producing today
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// BUYER LEGEND COMPONENT
// ─────────────────────────────────────────────
const BuyerLegend = ({ activeBuyers }) => {
  return (
    <div className="flex flex-col gap-1.5 pr-4 border-r border-gray-100 dark:border-gray-700 min-w-[120px]">
      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
        Buyers
      </p>
      {activeBuyers.map((buyer) => {
        const config = BUYER_COLORS[buyer] || BUYER_COLORS["Other"];
        return (
          <div
            key={buyer}
            className="flex items-center gap-2 group cursor-default"
          >
            {buyer === "Mixed" ? (
              <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 shadow-sm" />
            ) : (
              <div
                className="w-3 h-3 rounded-sm shadow-sm"
                style={{ backgroundColor: config.color }}
              />
            )}
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const ProductionByLineChart = ({
  chartData,
  selectedTask,
  onTaskChange,
  loading,
}) => {
  const [hoveredBar, setHoveredBar] = useState(null);
  const task = TASK_CONFIG[selectedTask];
  const totalQty = chartData.reduce((s, d) => s + (d.TotalQty || 0), 0);
  const maxQty = Math.max(...chartData.map((d) => d.TotalQty || 0), 1);

  // Get unique buyers from data (maintaining order of importance)
  const activeBuyers = useMemo(() => {
    const buyerOrder = [
      "Aritzia",
      "Costco",
      "MWW",
      "Reitmans",
      "ANF",
      "STORI",
      "Elite",
      "Mixed",
      "Other",
    ];
    const buyersInData = new Set(chartData.map((d) => d.Buyer));
    return buyerOrder.filter((buyer) => buyersInData.has(buyer));
  }, [chartData]);

  // Get bar color based on buyer
  const getBarColor = (buyer, isHovered, index) => {
    const config = BUYER_COLORS[buyer] || BUYER_COLORS["Other"];
    if (hoveredBar === null || hoveredBar === index) {
      return config.color;
    }
    return `${config.color}55`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Panel header */}
      <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
            <BarChart3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 dark:text-white">
              Production Output by Line
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {chartData.length > 0
                ? `${chartData.length} lines · ${totalQty.toLocaleString()} total pcs · Colored by Buyer`
                : "Today's production data"}
            </p>
          </div>
        </div>

        {/* Task Segmented Control */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl gap-1">
          {Object.entries(TASK_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => onTaskChange(key)}
              className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                selectedTask === key
                  ? `bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm`
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {selectedTask === key && (
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              )}
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart body with Legend */}
      <div className="p-6">
        <div className="flex gap-6">
          {/* Left Legend */}
          {!loading && chartData.length > 0 && activeBuyers.length > 0 && (
            <BuyerLegend activeBuyers={activeBuyers} />
          )}

          {/* Chart */}
          <div className="flex-1 h-[420px]">
            {loading && chartData.length === 0 ? (
              <ChartSkeleton />
            ) : chartData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 28, right: 8, left: -12, bottom: 4 }}
                  barSize={Math.max(
                    20,
                    Math.min(52, 420 / chartData.length - 10),
                  )}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                    className="dark:opacity-20"
                  />

                  <XAxis
                    dataKey="LineNo"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 600 }}
                    dy={8}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    tickFormatter={(v) => v.toLocaleString()}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(99,102,241,0.04)", rx: 6 }}
                  />

                  <Bar
                    dataKey="TotalQty"
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                    onMouseEnter={(_, index) => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <LabelList content={<BarLabel />} />
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getBarColor(
                          entry.Buyer,
                          hoveredBar === index,
                          index,
                        )}
                      />
                    ))}
                  </Bar>

                  {/* Gradient definitions for Mixed pattern effect */}
                  <defs>
                    <linearGradient
                      id="mixedGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="50%" stopColor="#d946ef" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <pattern
                      id="mixedPattern"
                      patternUnits="userSpaceOnUse"
                      width="8"
                      height="8"
                      patternTransform="rotate(45)"
                    >
                      <rect width="4" height="8" fill="#ec4899" />
                      <rect x="4" width="4" height="8" fill="#d946ef" />
                    </pattern>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Summary footer strip */}
      {!loading && chartData.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium">
              Peak:{" "}
              <span className="text-gray-700 dark:text-gray-200 font-bold">
                {chartData.find((d) => d.TotalQty === maxQty)?.LineNo} —{" "}
                {maxQty.toLocaleString()} pcs
              </span>
            </span>
          </div>
          <span className="hidden sm:inline text-gray-300 dark:text-gray-600">
            ·
          </span>
          <span>
            Avg:{" "}
            <span className="text-gray-700 dark:text-gray-200 font-bold">
              {Math.round(totalQty / chartData.length).toLocaleString()} pcs /
              line
            </span>
          </span>
          <span className="hidden sm:inline text-gray-300 dark:text-gray-600">
            ·
          </span>
          <div className="flex items-center gap-1.5">
            <span>Buyers:</span>
            <div className="flex items-center gap-1">
              {activeBuyers.slice(0, 4).map((buyer) => {
                const config = BUYER_COLORS[buyer] || BUYER_COLORS["Other"];
                return (
                  <span
                    key={buyer}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                    title={buyer}
                  />
                );
              })}
              {activeBuyers.length > 4 && (
                <span className="text-[10px] text-gray-400">
                  +{activeBuyers.length - 4}
                </span>
              )}
            </div>
          </div>
          <span className="hidden sm:inline text-gray-300 dark:text-gray-600">
            ·
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Auto-refresh in 60s
          </span>
        </div>
      )}
    </div>
  );
};

export default ProductionByLineChart;
