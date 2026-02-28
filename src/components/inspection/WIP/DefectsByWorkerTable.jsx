// import React, { useState } from "react";
// import {
//   User,
//   ChevronDown,
//   ChevronUp,
//   AlertTriangle,
//   MapPin,
//   Tag,
// } from "lucide-react";

// // ─────────────────────────────────────────────
// // SKELETON
// // ─────────────────────────────────────────────
// const TableSkeleton = () => (
//   <div style={{ padding: 20 }}>
//     {[1, 2, 3, 4, 5].map((i) => (
//       <div
//         key={i}
//         style={{
//           height: 52,
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
//       <User style={{ width: 28, height: 28, color: "rgba(255,255,255,0.2)" }} />
//     </div>
//     <p
//       style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}
//     >
//       No worker defects data
//     </p>
//   </div>
// );

// // ─────────────────────────────────────────────
// // WORKER ROW
// // ─────────────────────────────────────────────
// const WorkerRow = ({ item, index, maxDefects }) => {
//   const barWidth = maxDefects > 0 ? (item.TotalDefects / maxDefects) * 100 : 0;
//   const isHighRisk = item.TotalDefects > maxDefects * 0.7;

//   return (
//     <div
//       style={{
//         display: "flex",
//         alignItems: "center",
//         gap: 14,
//         padding: "12px 16px",
//         background: isHighRisk
//           ? "rgba(239,68,68,0.08)"
//           : index % 2 === 0
//             ? "rgba(255,255,255,0.02)"
//             : "transparent",
//         borderRadius: 10,
//         marginBottom: 4,
//         border: isHighRisk
//           ? "1px solid rgba(239,68,68,0.2)"
//           : "1px solid transparent",
//         transition: "all 0.2s",
//       }}
//       onMouseEnter={(e) =>
//         (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
//       }
//       onMouseLeave={(e) =>
//         (e.currentTarget.style.background = isHighRisk
//           ? "rgba(239,68,68,0.08)"
//           : index % 2 === 0
//             ? "rgba(255,255,255,0.02)"
//             : "transparent")
//       }
//     >
//       {/* Rank */}
//       <div
//         style={{
//           width: 26,
//           height: 26,
//           borderRadius: 7,
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
//           fontSize: 11,
//           fontWeight: 700,
//           color: "#fff",
//           flexShrink: 0,
//         }}
//       >
//         {index + 1}
//       </div>

//       {/* Worker Info */}
//       <div style={{ flex: 1, minWidth: 0 }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//           <div
//             style={{
//               width: 32,
//               height: 32,
//               borderRadius: 8,
//               background: "rgba(255,255,255,0.1)",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <User
//               style={{ width: 16, height: 16, color: "rgba(255,255,255,0.5)" }}
//             />
//           </div>
//           <div>
//             <span
//               style={{
//                 fontSize: 13,
//                 fontWeight: 700,
//                 color: "#fff",
//                 fontFamily: "'DM Mono', monospace",
//               }}
//             >
//               {item.EmpID}
//             </span>
//             <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
//               <span
//                 style={{
//                   fontSize: 10,
//                   color: "rgba(255,255,255,0.4)",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 3,
//                 }}
//               >
//                 <MapPin size={9} /> [{item.LineNo}]
//               </span>
//               <span
//                 style={{
//                   fontSize: 10,
//                   color: "rgba(255,255,255,0.4)",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 3,
//                 }}
//               >
//                 Station: {item.StationID}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Stats */}
//       <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
//         <div style={{ textAlign: "center" }}>
//           <p
//             style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}
//           >
//             Types
//           </p>
//           <p
//             style={{
//               fontSize: 12,
//               fontWeight: 700,
//               color: "#fff",
//               margin: "2px 0 0",
//             }}
//           >
//             {item.DefectTypeCount}
//           </p>
//         </div>
//         <div style={{ textAlign: "center" }}>
//           <p
//             style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}
//           >
//             MOs
//           </p>
//           <p
//             style={{
//               fontSize: 12,
//               fontWeight: 700,
//               color: "#fff",
//               margin: "2px 0 0",
//             }}
//           >
//             {item.MOCount}
//           </p>
//         </div>
//       </div>

//       {/* Progress Bar */}
//       <div style={{ width: 80, flexShrink: 0 }}>
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
//               background: isHighRisk
//                 ? "linear-gradient(90deg, #EF4444, #DC2626)"
//                 : "linear-gradient(90deg, #F59E0B, #F97316)",
//               borderRadius: 3,
//             }}
//           />
//         </div>
//       </div>

//       {/* Defect Count */}
//       <div style={{ textAlign: "right", minWidth: 50, flexShrink: 0 }}>
//         <span
//           style={{
//             fontSize: 16,
//             fontWeight: 800,
//             color: isHighRisk ? "#F87171" : "#FBBF24",
//             fontFamily: "'DM Mono', monospace",
//           }}
//         >
//           {item.TotalDefects}
//         </span>
//       </div>
//     </div>
//   );
// };

// // ─────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────
// const DefectsByWorkerTable = ({ data, loading }) => {
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
//             background: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
//             boxShadow: "0 4px 16px rgba(236,72,153,0.3)",
//           }}
//         >
//           <User style={{ width: 18, height: 18, color: "#fff" }} />
//         </div>
//         <div>
//           <h3
//             style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}
//           >
//             Defects by Responsible Worker
//           </h3>
//           <p
//             style={{
//               fontSize: 11,
//               color: "rgba(255,255,255,0.4)",
//               margin: "2px 0 0",
//             }}
//           >
//             {data.length > 0
//               ? `${data.length} workers · ${totalDefects.toLocaleString()} total defects`
//               : "Worker defects breakdown"}
//           </p>
//         </div>
//       </div>

//       {/* Content */}
//       <div
//         style={{
//           padding: "12px 16px",
//           maxHeight: expanded ? "none" : 520,
//           overflow: "auto",
//         }}
//       >
//         {loading && data.length === 0 ? (
//           <TableSkeleton />
//         ) : data.length === 0 ? (
//           <EmptyTable />
//         ) : (
//           displayData.map((item, index) => (
//             <WorkerRow
//               key={`${item.EmpID}-${item.StationID}-${item.LineNo}`}
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
//               background: "rgba(236,72,153,0.15)",
//               color: "#F472B6",
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
//             {expanded ? "Show Less" : `Show All ${data.length} Workers`}
//           </button>
//         </div>
//       )}

//       {/* Footer */}
//       {!loading && data.length > 0 && (
//         <div
//           style={{
//             padding: "12px 22px",
//             background: "rgba(236,72,153,0.08)",
//             borderTop: "1px solid rgba(236,72,153,0.15)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//           }}
//         >
//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <AlertTriangle
//               style={{ width: 14, height: 14, color: "#F472B6" }}
//             />
//             <span style={{ fontSize: 12, color: "#F472B6", fontWeight: 600 }}>
//               Highest: {data[0]?.EmpID} @ [{data[0]?.LineNo}]
//             </span>
//           </div>
//           <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
//             {data[0]?.TotalDefects} defects (
//             {((data[0]?.TotalDefects / totalDefects) * 100).toFixed(1)}%)
//           </span>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DefectsByWorkerTable;

import React, { useState } from "react";
import {
  User,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  MapPin,
  Tag,
} from "lucide-react";

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
      <User className="w-7 h-7 text-gray-300 dark:text-gray-500" />
    </div>
    <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">
      No worker defects data
    </p>
  </div>
);

// ─────────────────────────────────────────────
// WORKER ROW
// ─────────────────────────────────────────────
const WorkerRow = ({ item, index, maxDefects }) => {
  const barWidth = maxDefects > 0 ? (item.TotalDefects / maxDefects) * 100 : 0;
  const isHighRisk = item.TotalDefects >= maxDefects * 0.7;

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40 ${
        isHighRisk
          ? "bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30"
          : index % 2 === 0
            ? "bg-gray-50/50 dark:bg-gray-700/20"
            : ""
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

      {/* Worker Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-bold text-gray-800 dark:text-white font-mono block">
            {item.EmpID}
          </span>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> [{item.LineNo}]
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              St: {item.StationID}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="text-center">
          <p className="text-[10px] text-gray-400 dark:text-gray-500">Types</p>
          <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
            {item.DefectTypeCount}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-400 dark:text-gray-500">MOs</p>
          <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
            {item.MOCount}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-20 flex-shrink-0 hidden md:block">
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isHighRisk
                ? "bg-gradient-to-r from-red-500 to-rose-600"
                : "bg-gradient-to-r from-amber-500 to-orange-500"
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Defect Count */}
      <div className="text-right min-w-[50px] flex-shrink-0">
        <span
          className={`text-lg font-black tabular-nums ${
            isHighRisk
              ? "text-red-600 dark:text-red-400"
              : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {item.TotalDefects}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const DefectsByWorkerTable = ({ data, loading }) => {
  const [expanded, setExpanded] = useState(false);

  const displayData = expanded ? data : data.slice(0, 10);
  const hasMore = data.length > 10;
  const totalDefects = data.reduce((sum, d) => sum + (d.TotalDefects || 0), 0);
  const maxDefects = Math.max(...data.map((d) => d.TotalDefects || 0), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/25">
          <User className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-white">
            Defects by Responsible Worker
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {data.length > 0
              ? `${data.length} workers · ${totalDefects.toLocaleString()} total defects`
              : "Worker defects breakdown"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 max-h-[500px] overflow-y-auto">
        {loading && data.length === 0 ? (
          <TableSkeleton />
        ) : data.length === 0 ? (
          <EmptyTable />
        ) : (
          <div className="space-y-1">
            {displayData.map((item, index) => (
              <WorkerRow
                key={`${item.EmpID}-${item.StationID}-${item.LineNo}`}
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
            className="w-full py-2.5 rounded-xl border border-pink-200 dark:border-pink-800/50 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {expanded ? "Show Less" : `Show All ${data.length} Workers`}
          </button>
        </div>
      )}

      {/* Footer */}
      {!loading && data.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-pink-500" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              <span className="font-bold">Highest:</span> {data[0]?.EmpID} @ [
              {data[0]?.LineNo}]
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

export default DefectsByWorkerTable;
