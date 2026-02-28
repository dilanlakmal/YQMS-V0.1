// import React, { useState } from "react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   Cell,
//   LabelList,
// } from "recharts";
// import { Factory, TrendingUp, AlertTriangle } from "lucide-react";

// // ─────────────────────────────────────────────
// // CUSTOM TOOLTIP
// // ─────────────────────────────────────────────
// const CustomTooltip = ({ active, payload, label }) => {
//   if (active && payload && payload.length) {
//     const data = payload[0].payload;
//     return (
//       <div
//         style={{
//           background: "rgba(15, 23, 42, 0.95)",
//           padding: "14px 18px",
//           borderRadius: 14,
//           border: "1px solid rgba(239, 68, 68, 0.3)",
//           boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
//           backdropFilter: "blur(10px)",
//         }}
//       >
//         <p
//           style={{
//             fontSize: 11,
//             fontWeight: 700,
//             color: "rgba(255,255,255,0.5)",
//             textTransform: "uppercase",
//             letterSpacing: "0.1em",
//             marginBottom: 8,
//           }}
//         >
//           Line {label}
//         </p>
//         <div
//           style={{
//             display: "flex",
//             alignItems: "baseline",
//             gap: 6,
//             marginBottom: 10,
//           }}
//         >
//           <span
//             style={{
//               fontSize: 28,
//               fontWeight: 900,
//               color: "#F87171",
//               fontFamily: "'DM Mono', monospace",
//             }}
//           >
//             {data.TotalDefects?.toLocaleString()}
//           </span>
//           <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
//             defects
//           </span>
//         </div>
//         <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
//           <div>
//             <span style={{ color: "rgba(255,255,255,0.4)" }}>MOs: </span>
//             <span style={{ color: "#fff", fontWeight: 600 }}>
//               {data.MOCount}
//             </span>
//           </div>
//           <div>
//             <span style={{ color: "rgba(255,255,255,0.4)" }}>QCs: </span>
//             <span style={{ color: "#fff", fontWeight: 600 }}>
//               {data.InspectorCount}
//             </span>
//           </div>
//         </div>
//       </div>
//     );
//   }
//   return null;
// };

// // ─────────────────────────────────────────────
// // BAR LABEL
// // ─────────────────────────────────────────────
// const BarLabel = (props) => {
//   const { x, y, width, value } = props;
//   if (!value || width < 30) return null;
//   return (
//     <text
//       x={x + width / 2}
//       y={y - 8}
//       fill="rgba(255,255,255,0.7)"
//       textAnchor="middle"
//       fontSize={11}
//       fontWeight={700}
//       fontFamily="'DM Mono', monospace"
//     >
//       {value}
//     </text>
//   );
// };

// // ─────────────────────────────────────────────
// // SKELETON
// // ─────────────────────────────────────────────
// const ChartSkeleton = () => (
//   <div
//     style={{
//       height: "100%",
//       display: "flex",
//       alignItems: "flex-end",
//       gap: 8,
//       padding: "0 20px",
//     }}
//   >
//     {[60, 80, 45, 90, 70, 55, 85, 40, 75, 65].map((h, i) => (
//       <div
//         key={i}
//         style={{
//           flex: 1,
//           height: `${h}%`,
//           background: "rgba(255,255,255,0.08)",
//           borderRadius: "6px 6px 0 0",
//           animation: "pulse 1.4s ease-in-out infinite",
//         }}
//       />
//     ))}
//   </div>
// );

// // ─────────────────────────────────────────────
// // EMPTY STATE
// // ─────────────────────────────────────────────
// const EmptyChart = () => (
//   <div
//     style={{
//       height: "100%",
//       display: "flex",
//       flexDirection: "column",
//       alignItems: "center",
//       justifyContent: "center",
//       gap: 12,
//     }}
//   >
//     <div
//       style={{
//         width: 56,
//         height: 56,
//         borderRadius: 16,
//         background: "rgba(255,255,255,0.05)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
//       <Factory
//         style={{ width: 28, height: 28, color: "rgba(255,255,255,0.2)" }}
//       />
//     </div>
//     <p
//       style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}
//     >
//       No defects by line data
//     </p>
//   </div>
// );

// // ─────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────
// const DefectsByLineChart = ({ data, loading }) => {
//   const [hoveredBar, setHoveredBar] = useState(null);

//   const totalDefects = data.reduce((sum, d) => sum + (d.TotalDefects || 0), 0);
//   const maxDefects = Math.max(...data.map((d) => d.TotalDefects || 0), 1);
//   const topLine = data[0];

//   // Color based on defect severity
//   const getBarColor = (defects, index) => {
//     const ratio = defects / maxDefects;
//     if (ratio > 0.7) return "#EF4444"; // Red - High
//     if (ratio > 0.4) return "#F59E0B"; // Orange - Medium
//     return "#10B981"; // Green - Low
//   };

//   return (
//     <div
//       style={{
//         background: "rgba(255,255,255,0.03)",
//         borderRadius: 18,
//         border: "1px solid rgba(255,255,255,0.08)",
//         overflow: "hidden",
//       }}
//     >
//       {/* Header */}
//       <div
//         style={{
//           padding: "18px 22px",
//           borderBottom: "1px solid rgba(255,255,255,0.06)",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//         }}
//       >
//         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//           <div
//             style={{
//               padding: 10,
//               borderRadius: 12,
//               background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
//               boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
//             }}
//           >
//             <Factory style={{ width: 18, height: 18, color: "#fff" }} />
//           </div>
//           <div>
//             <h3
//               style={{
//                 fontSize: 14,
//                 fontWeight: 700,
//                 color: "#fff",
//                 margin: 0,
//               }}
//             >
//               Defects by Production Line
//             </h3>
//             <p
//               style={{
//                 fontSize: 11,
//                 color: "rgba(255,255,255,0.4)",
//                 margin: "2px 0 0",
//               }}
//             >
//               {data.length > 0
//                 ? `${data.length} lines · ${totalDefects.toLocaleString()} total defects`
//                 : "Today's line breakdown"}
//             </p>
//           </div>
//         </div>

//         {/* Severity Legend */}
//         <div style={{ display: "flex", gap: 12 }}>
//           {[
//             { color: "#EF4444", label: "High" },
//             { color: "#F59E0B", label: "Medium" },
//             { color: "#10B981", label: "Low" },
//           ].map((item) => (
//             <div
//               key={item.label}
//               style={{ display: "flex", alignItems: "center", gap: 5 }}
//             >
//               <div
//                 style={{
//                   width: 8,
//                   height: 8,
//                   borderRadius: 4,
//                   background: item.color,
//                 }}
//               />
//               <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
//                 {item.label}
//               </span>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Chart */}
//       <div style={{ padding: 20 }}>
//         <div style={{ height: 350 }}>
//           {loading && data.length === 0 ? (
//             <ChartSkeleton />
//           ) : data.length === 0 ? (
//             <EmptyChart />
//           ) : (
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart
//                 data={data}
//                 margin={{ top: 30, right: 10, left: -10, bottom: 5 }}
//                 barSize={Math.max(20, Math.min(48, 350 / data.length - 8))}
//               >
//                 <CartesianGrid
//                   strokeDasharray="3 3"
//                   stroke="rgba(255,255,255,0.06)"
//                   vertical={false}
//                 />
//                 <XAxis
//                   dataKey="LineNo"
//                   axisLine={false}
//                   tickLine={false}
//                   tick={{
//                     fill: "rgba(255,255,255,0.5)",
//                     fontSize: 11,
//                     fontWeight: 600,
//                   }}
//                   dy={8}
//                 />
//                 <YAxis
//                   axisLine={false}
//                   tickLine={false}
//                   tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
//                 />
//                 <Tooltip
//                   content={<CustomTooltip />}
//                   cursor={{ fill: "rgba(255,255,255,0.03)" }}
//                 />
//                 <Bar
//                   dataKey="TotalDefects"
//                   radius={[6, 6, 0, 0]}
//                   animationDuration={800}
//                   onMouseEnter={(_, index) => setHoveredBar(index)}
//                   onMouseLeave={() => setHoveredBar(null)}
//                 >
//                   <LabelList content={<BarLabel />} />
//                   {data.map((entry, index) => (
//                     <Cell
//                       key={`cell-${index}`}
//                       fill={getBarColor(entry.TotalDefects, index)}
//                       opacity={
//                         hoveredBar === null || hoveredBar === index ? 1 : 0.4
//                       }
//                       style={{ transition: "opacity 0.2s" }}
//                     />
//                   ))}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           )}
//         </div>
//       </div>

//       {/* Footer */}
//       {!loading && data.length > 0 && (
//         <div
//           style={{
//             padding: "12px 22px",
//             background: "rgba(239,68,68,0.08)",
//             borderTop: "1px solid rgba(239,68,68,0.15)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//           }}
//         >
//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <AlertTriangle
//               style={{ width: 14, height: 14, color: "#F87171" }}
//             />
//             <span style={{ fontSize: 12, color: "#F87171", fontWeight: 600 }}>
//               Highest: Line {topLine?.LineNo}
//             </span>
//             <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
//               — {topLine?.TotalDefects} defects
//             </span>
//           </div>
//           <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
//             Avg: {Math.round(totalDefects / data.length)} per line
//           </span>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DefectsByLineChart;

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  Factory,
  TrendingUp,
  AlertTriangle,
  Package,
  Percent,
} from "lucide-react";

// ─────────────────────────────────────────────
// VIEW MODE CONFIG
// ─────────────────────────────────────────────
const VIEW_MODES = {
  rate: {
    key: "DefectRate",
    label: "Rate",
    icon: Percent,
    unit: "%",
    color: "#F59E0B",
  },
  output: {
    key: "OutputQty",
    label: "Output",
    icon: Package,
    unit: " pcs",
    color: "#10B981",
  },
  defects: {
    key: "TotalDefects",
    label: "Defects",
    icon: AlertTriangle,
    unit: "",
    color: "#EF4444",
  },
};

// ─────────────────────────────────────────────
// GET COLOR BY RATE
// ─────────────────────────────────────────────
const getColorByRate = (rate) => {
  if (rate < 3) return "#22C55E"; // Green - Good
  if (rate <= 5) return "#F59E0B"; // Orange - Warning
  return "#EF4444"; // Red - Critical
};

// ─────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, viewMode }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const rateColor = getColorByRate(data.DefectRate);

    return (
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[200px]">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Line {label}
        </p>

        {/* Rate with status */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Defect Rate:
          </span>
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-black tabular-nums"
              style={{ color: rateColor }}
            >
              {data.DefectRate?.toFixed(2)}%
            </span>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${rateColor}20`,
                color: rateColor,
              }}
            >
              {data.DefectRate < 3
                ? "GOOD"
                : data.DefectRate <= 5
                  ? "WARN"
                  : "HIGH"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-400 dark:text-gray-500">Output:</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {data.OutputQty?.toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-gray-400 dark:text-gray-500">Defects:</span>
            <p className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">
              {data.TotalDefects?.toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-gray-400 dark:text-gray-500">MOs:</span>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {data.MOCount}
            </p>
          </div>
          <div>
            <span className="text-gray-400 dark:text-gray-500">QCs:</span>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {data.InspectorCount}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// ─────────────────────────────────────────────
// CUSTOM BAR LABEL
// ─────────────────────────────────────────────
const CustomBarLabel = ({ x, y, width, value, viewMode, data }) => {
  if (!value || width < 25) return null;

  const config = VIEW_MODES[viewMode];
  const displayValue =
    viewMode === "rate" ? `${value.toFixed(2)}%` : value.toLocaleString();

  // Get color based on rate for all views
  const rate = data?.DefectRate || 0;
  const color = getColorByRate(rate);

  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill={viewMode === "output" ? "#10B981" : color}
      textAnchor="middle"
      fontSize={10}
      fontWeight={700}
      fontFamily="'DM Mono', monospace"
    >
      {displayValue}
    </text>
  );
};

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────
const ChartSkeleton = () => (
  <div className="h-full flex items-end gap-2 px-4 animate-pulse">
    {[60, 80, 45, 90, 70, 55, 85, 40, 75, 65].map((h, i) => (
      <div
        key={i}
        className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t-lg"
        style={{ height: `${h}%` }}
      />
    ))}
  </div>
);

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
const EmptyChart = () => (
  <div className="h-full flex flex-col items-center justify-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
      <Factory className="w-7 h-7 text-gray-300 dark:text-gray-600" />
    </div>
    <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">
      No line data available
    </p>
  </div>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const DefectsByLineChart = ({ data, loading }) => {
  const [viewMode, setViewMode] = useState("rate");
  const [hoveredBar, setHoveredBar] = useState(null);

  const config = VIEW_MODES[viewMode];

  // Sort data based on view mode
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      if (viewMode === "rate") return b.DefectRate - a.DefectRate;
      if (viewMode === "output") return b.OutputQty - a.OutputQty;
      return b.TotalDefects - a.TotalDefects;
    });
    return sorted;
  }, [data, viewMode]);

  // Calculate stats
  const totalOutput = data.reduce((sum, d) => sum + (d.OutputQty || 0), 0);
  const totalDefects = data.reduce((sum, d) => sum + (d.TotalDefects || 0), 0);
  const avgRate =
    totalOutput > 0 ? ((totalDefects / totalOutput) * 100).toFixed(2) : 0;
  const maxValue = Math.max(...data.map((d) => d[config.key] || 0), 1);
  const worstLine = sortedData[0];

  // Get bar color
  const getBarColor = (item, index) => {
    const rate = item.DefectRate || 0;
    const color = viewMode === "output" ? "#10B981" : getColorByRate(rate);

    if (hoveredBar !== null && hoveredBar !== index) {
      return `${color}55`;
    }
    return color;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/20">
            <Factory className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">
              Production Line Analysis
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {data.length > 0
                ? `${data.length} lines · Avg Rate: ${avgRate}%`
                : "Line breakdown"}
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl gap-1">
          {Object.entries(VIEW_MODES).map(([key, mode]) => {
            const IconComponent = mode.icon;
            return (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  viewMode === key
                    ? "bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      {viewMode !== "output" && (
        <div className="px-5 py-2 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 flex items-center justify-center gap-6">
          {[
            { color: "#22C55E", label: "< 3% Good" },
            { color: "#F59E0B", label: "3-5% Warning" },
            { color: "#EF4444", label: "> 5% Critical" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="p-5">
        <div className="h-[380px]">
          {loading && data.length === 0 ? (
            <ChartSkeleton />
          ) : data.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedData}
                margin={{ top: 30, right: 10, left: -10, bottom: 5 }}
                barSize={Math.max(
                  20,
                  Math.min(50, 380 / sortedData.length - 8),
                )}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  className="dark:opacity-20"
                  vertical={false}
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
                  tickFormatter={(v) =>
                    viewMode === "rate" ? `${v}%` : v.toLocaleString()
                  }
                />
                <Tooltip
                  content={<CustomTooltip viewMode={viewMode} />}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                <Bar
                  dataKey={config.key}
                  radius={[6, 6, 0, 0]}
                  animationDuration={600}
                  onMouseEnter={(_, index) => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <LabelList
                    content={(props) => (
                      <CustomBarLabel
                        {...props}
                        viewMode={viewMode}
                        data={sortedData[props.index]}
                      />
                    )}
                  />
                  {sortedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getBarColor(entry, index)}
                      style={{ transition: "fill 0.2s" }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Footer */}
      {!loading && data.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="w-4 h-4"
              style={{ color: getColorByRate(worstLine?.DefectRate || 0) }}
            />
            <span className="text-gray-600 dark:text-gray-300">
              <span className="font-bold">Worst:</span> Line {worstLine?.LineNo}
            </span>
            <span
              className="font-black tabular-nums"
              style={{ color: getColorByRate(worstLine?.DefectRate || 0) }}
            >
              {worstLine?.DefectRate?.toFixed(2)}%
            </span>
            <span className="text-gray-400 dark:text-gray-500">
              ({worstLine?.TotalDefects} /{" "}
              {worstLine?.OutputQty?.toLocaleString()})
            </span>
          </div>
          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
            <span>
              Total Output:{" "}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {totalOutput.toLocaleString()}
              </span>
            </span>
            <span>
              Total Defects:{" "}
              <span className="font-bold text-red-600 dark:text-red-400">
                {totalDefects.toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectsByLineChart;
