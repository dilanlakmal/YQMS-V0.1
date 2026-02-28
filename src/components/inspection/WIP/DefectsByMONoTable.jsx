// import React, { useState } from "react";
// import {
//   Package,
//   ChevronDown,
//   ChevronUp,
//   AlertTriangle,
//   Factory,
//   Tag,
// } from "lucide-react";

// // ─────────────────────────────────────────────
// // BUYER COLORS
// // ─────────────────────────────────────────────
// const BUYER_COLORS = {
//   Aritzia: {
//     bg: "rgba(244,63,94,0.2)",
//     text: "#FB7185",
//     border: "rgba(244,63,94,0.3)",
//   },
//   Costco: {
//     bg: "rgba(59,130,246,0.2)",
//     text: "#60A5FA",
//     border: "rgba(59,130,246,0.3)",
//   },
//   MWW: {
//     bg: "rgba(245,158,11,0.2)",
//     text: "#FBBF24",
//     border: "rgba(245,158,11,0.3)",
//   },
//   Reitmans: {
//     bg: "rgba(139,92,246,0.2)",
//     text: "#A78BFA",
//     border: "rgba(139,92,246,0.3)",
//   },
//   ANF: {
//     bg: "rgba(20,184,166,0.2)",
//     text: "#2DD4BF",
//     border: "rgba(20,184,166,0.3)",
//   },
//   STORI: {
//     bg: "rgba(99,102,241,0.2)",
//     text: "#818CF8",
//     border: "rgba(99,102,241,0.3)",
//   },
//   Elite: {
//     bg: "rgba(100,116,139,0.2)",
//     text: "#94A3B8",
//     border: "rgba(100,116,139,0.3)",
//   },
//   Other: {
//     bg: "rgba(156,163,175,0.2)",
//     text: "#9CA3AF",
//     border: "rgba(156,163,175,0.3)",
//   },
// };

// // ─────────────────────────────────────────────
// // BUYER BADGE
// // ─────────────────────────────────────────────
// const BuyerBadge = ({ buyer }) => {
//   const colors = BUYER_COLORS[buyer] || BUYER_COLORS["Other"];
//   return (
//     <span
//       style={{
//         padding: "3px 8px",
//         borderRadius: 6,
//         fontSize: 10,
//         fontWeight: 700,
//         background: colors.bg,
//         color: colors.text,
//         border: `1px solid ${colors.border}`,
//       }}
//     >
//       {buyer}
//     </span>
//   );
// };

// // ─────────────────────────────────────────────
// // SKELETON
// // ─────────────────────────────────────────────
// const TableSkeleton = () => (
//   <div style={{ padding: 20 }}>
//     {[1, 2, 3, 4, 5].map((i) => (
//       <div
//         key={i}
//         style={{
//           height: 56,
//           background: "rgba(255,255,255,0.05)",
//           borderRadius: 10,
//           marginBottom: 8,
//           animation: "pulse 1.4s ease-in-out infinite",
//         }}
//       />
//     ))}
//   </div>
// );

// // ─────────────────────────────────────────────
// // EMPTY STATE
// // ─────────────────────────────────────────────
// const EmptyTable = () => (
//   <div
//     style={{
//       padding: "48px 20px",
//       display: "flex",
//       flexDirection: "column",
//       alignItems: "center",
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
//       <Package
//         style={{ width: 28, height: 28, color: "rgba(255,255,255,0.2)" }}
//       />
//     </div>
//     <p
//       style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}
//     >
//       No MO defects data
//     </p>
//   </div>
// );

// // ─────────────────────────────────────────────
// // MO ROW
// // ─────────────────────────────────────────────
// const MORow = ({ item, index, maxDefects }) => {
//   const barWidth = maxDefects > 0 ? (item.TotalDefects / maxDefects) * 100 : 0;

//   return (
//     <div
//       style={{
//         display: "flex",
//         alignItems: "center",
//         gap: 16,
//         padding: "14px 16px",
//         background: index % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
//         borderRadius: 10,
//         marginBottom: 4,
//         transition: "background 0.2s",
//       }}
//       onMouseEnter={(e) =>
//         (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
//       }
//       onMouseLeave={(e) =>
//         (e.currentTarget.style.background =
//           index % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent")
//       }
//     >
//       {/* Rank */}
//       <div
//         style={{
//           width: 28,
//           height: 28,
//           borderRadius: 8,
//           background:
//             index < 3
//               ? index === 0
//                 ? "linear-gradient(135deg, #EF4444, #DC2626)"
//                 : index === 1
//                   ? "linear-gradient(135deg, #F59E0B, #D97706)"
//                   : "linear-gradient(135deg, #F97316, #EA580C)"
//               : "rgba(255,255,255,0.1)",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           fontSize: 12,
//           fontWeight: 700,
//           color: "#fff",
//           flexShrink: 0,
//         }}
//       >
//         {index + 1}
//       </div>

//       {/* MO Info */}
//       <div style={{ flex: 1, minWidth: 0 }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//           <span
//             style={{
//               fontSize: 13,
//               fontWeight: 700,
//               color: "#fff",
//               fontFamily: "'DM Mono', monospace",
//             }}
//           >
//             {item.MONo}
//           </span>
//           <BuyerBadge buyer={item.Buyer} />
//         </div>
//         <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
//           <span
//             style={{
//               fontSize: 10,
//               color: "rgba(255,255,255,0.4)",
//               display: "flex",
//               alignItems: "center",
//               gap: 4,
//             }}
//           >
//             <Factory size={10} /> {item.LineCount} lines
//           </span>
//           <span
//             style={{
//               fontSize: 10,
//               color: "rgba(255,255,255,0.4)",
//               display: "flex",
//               alignItems: "center",
//               gap: 4,
//             }}
//           >
//             <Tag size={10} /> {item.DefectTypeCount} types
//           </span>
//         </div>
//       </div>

//       {/* Progress Bar */}
//       <div style={{ width: 100, flexShrink: 0 }}>
//         <div
//           style={{
//             height: 6,
//             background: "rgba(255,255,255,0.08)",
//             borderRadius: 3,
//             overflow: "hidden",
//           }}
//         >
//           <div
//             style={{
//               height: "100%",
//               width: `${barWidth}%`,
//               background: "linear-gradient(90deg, #EF4444, #F97316)",
//               borderRadius: 3,
//             }}
//           />
//         </div>
//       </div>

//       {/* Defect Count */}
//       <div style={{ textAlign: "right", minWidth: 60, flexShrink: 0 }}>
//         <span
//           style={{
//             fontSize: 16,
//             fontWeight: 800,
//             color: "#F87171",
//             fontFamily: "'DM Mono', monospace",
//           }}
//         >
//           {item.TotalDefects.toLocaleString()}
//         </span>
//       </div>
//     </div>
//   );
// };

// // ─────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────
// const DefectsByMONoTable = ({ data, loading }) => {
//   const [expanded, setExpanded] = useState(false);

//   const displayData = expanded ? data : data.slice(0, 10);
//   const hasMore = data.length > 10;
//   const totalDefects = data.reduce((sum, d) => sum + (d.TotalDefects || 0), 0);
//   const maxDefects = Math.max(...data.map((d) => d.TotalDefects || 0), 1);

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
//           gap: 12,
//         }}
//       >
//         <div
//           style={{
//             padding: 10,
//             borderRadius: 12,
//             background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
//             boxShadow: "0 4px 16px rgba(139,92,246,0.3)",
//           }}
//         >
//           <Package style={{ width: 18, height: 18, color: "#fff" }} />
//         </div>
//         <div>
//           <h3
//             style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}
//           >
//             Defects by MO Number
//           </h3>
//           <p
//             style={{
//               fontSize: 11,
//               color: "rgba(255,255,255,0.4)",
//               margin: "2px 0 0",
//             }}
//           >
//             {data.length > 0
//               ? `${data.length} MOs · ${totalDefects.toLocaleString()} total defects`
//               : "MO defects breakdown"}
//           </p>
//         </div>
//       </div>

//       {/* Content */}
//       <div style={{ padding: "12px 16px" }}>
//         {loading && data.length === 0 ? (
//           <TableSkeleton />
//         ) : data.length === 0 ? (
//           <EmptyTable />
//         ) : (
//           displayData.map((item, index) => (
//             <MORow
//               key={item.MONo}
//               item={item}
//               index={index}
//               maxDefects={maxDefects}
//             />
//           ))
//         )}
//       </div>

//       {/* Show More */}
//       {hasMore && !loading && (
//         <div style={{ padding: "0 20px 16px" }}>
//           <button
//             onClick={() => setExpanded(!expanded)}
//             style={{
//               width: "100%",
//               padding: "10px",
//               borderRadius: 10,
//               border: "none",
//               background: "rgba(139,92,246,0.15)",
//               color: "#A78BFA",
//               fontSize: 12,
//               fontWeight: 600,
//               cursor: "pointer",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               gap: 6,
//             }}
//           >
//             {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//             {expanded ? "Show Less" : `Show All ${data.length} MOs`}
//           </button>
//         </div>
//       )}

//       {/* Footer */}
//       {!loading && data.length > 0 && (
//         <div
//           style={{
//             padding: "12px 22px",
//             background: "rgba(139,92,246,0.08)",
//             borderTop: "1px solid rgba(139,92,246,0.15)",
//             display: "flex",
//             alignItems: "center",
//             gap: 8,
//           }}
//         >
//           <AlertTriangle style={{ width: 14, height: 14, color: "#A78BFA" }} />
//           <span style={{ fontSize: 12, color: "#A78BFA", fontWeight: 600 }}>
//             Worst: {data[0]?.MONo}
//           </span>
//           <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
//             — {data[0]?.TotalDefects} defects (
//             {((data[0]?.TotalDefects / totalDefects) * 100).toFixed(1)}%)
//           </span>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DefectsByMONoTable;

import React, { useState } from "react";
import {
  Package,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Factory,
  Tag,
  Percent,
} from "lucide-react";

// ─────────────────────────────────────────────
// BUYER COLORS
// ─────────────────────────────────────────────
const BUYER_COLORS = {
  Aritzia: {
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
  Costco: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  MWW: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  Reitmans: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  ANF: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
  },
  STORI: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  Elite: {
    bg: "bg-slate-100 dark:bg-slate-900/30",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-800",
  },
  Other: {
    bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700",
  },
};

// ─────────────────────────────────────────────
// BUYER BADGE
// ─────────────────────────────────────────────
const BuyerBadge = ({ buyer }) => {
  const colors = BUYER_COLORS[buyer] || BUYER_COLORS["Other"];
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {buyer}
    </span>
  );
};

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────
const TableSkeleton = () => (
  <div className="p-5 space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse"
      />
    ))}
  </div>
);

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
const EmptyTable = () => (
  <div className="py-12 flex flex-col items-center justify-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
      <Package className="w-7 h-7 text-gray-300 dark:text-gray-500" />
    </div>
    <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">
      No MO defects data
    </p>
  </div>
);

// ─────────────────────────────────────────────
// MO ROW
// ─────────────────────────────────────────────
const MORow = ({ item, index, maxDefects }) => {
  const barWidth = maxDefects > 0 ? (item.TotalDefects / maxDefects) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40 ${
        index % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-700/20" : ""
      }`}
    >
      {/* Rank */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm ${
          index < 3
            ? index === 0
              ? "bg-gradient-to-br from-red-500 to-rose-600"
              : index === 1
                ? "bg-gradient-to-br from-orange-500 to-amber-600"
                : "bg-gradient-to-br from-amber-500 to-yellow-600"
            : "bg-gray-400 dark:bg-gray-600"
        }`}
      >
        {index + 1}
      </div>

      {/* MO Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-gray-800 dark:text-white font-mono">
            {item.MONo}
          </span>
          <BuyerBadge buyer={item.Buyer} />
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Factory className="w-3 h-3" /> {item.LineCount} lines
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Tag className="w-3 h-3" /> {item.DefectTypeCount} types
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-24 flex-shrink-0 hidden sm:block">
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Defect Count */}
      <div className="text-right min-w-[50px] flex-shrink-0">
        <span className="text-lg font-black text-red-600 dark:text-red-400 tabular-nums">
          {item.TotalDefects.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const DefectsByMONoTable = ({ data, loading }) => {
  const [expanded, setExpanded] = useState(false);

  const displayData = expanded ? data : data.slice(0, 10);
  const hasMore = data.length > 10;
  const totalDefects = data.reduce((sum, d) => sum + (d.TotalDefects || 0), 0);
  const maxDefects = Math.max(...data.map((d) => d.TotalDefects || 0), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
          <Package className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-white">
            Defects by MO Number
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {data.length > 0
              ? `${data.length} MOs · ${totalDefects.toLocaleString()} total defects`
              : "MO defects breakdown"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {loading && data.length === 0 ? (
          <TableSkeleton />
        ) : data.length === 0 ? (
          <EmptyTable />
        ) : (
          <div className="space-y-1">
            {displayData.map((item, index) => (
              <MORow
                key={item.MONo}
                item={item}
                index={index}
                maxDefects={maxDefects}
              />
            ))}
          </div>
        )}
      </div>

      {/* Show More */}
      {hasMore && !loading && (
        <div className="px-5 pb-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2.5 rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {expanded ? "Show Less" : `Show All ${data.length} MOs`}
          </button>
        </div>
      )}

      {/* Footer */}
      {!loading && data.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-violet-500" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              <span className="font-bold">Worst:</span> {data[0]?.MONo}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {data[0]?.TotalDefects} defects (
            {((data[0]?.TotalDefects / totalDefects) * 100).toFixed(1)}%)
          </span>
        </div>
      )}
    </div>
  );
};

export default DefectsByMONoTable;
