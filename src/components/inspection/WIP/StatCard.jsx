// import React from "react";

// const StatCard = ({
//   title,
//   value,
//   icon: Icon,
//   gradient,
//   loading,
//   subtitle,
//   trend,
//   trendUp,
// }) => (
//   <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
//     {/* gradient accent strip */}
//     <div
//       className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}
//     />

//     <div className="p-6">
//       <div className="flex items-start justify-between">
//         <div className="flex-1 min-w-0">
//           <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
//             {title}
//           </p>
//           {loading ? (
//             <div className="space-y-2">
//               <div className="h-8 w-28 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
//               <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
//             </div>
//           ) : (
//             <>
//               <h3 className="text-3xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
//                 {(value || 0).toLocaleString()}
//               </h3>
//               {subtitle && (
//                 <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
//                   {subtitle}
//                   {trend && (
//                     <span
//                       className={`flex items-center gap-0.5 text-[10px] font-bold ${
//                         trendUp ? "text-emerald-500" : "text-red-500"
//                       }`}
//                     >
//                       {trendUp ? "↑" : "↓"} {trend}
//                     </span>
//                   )}
//                 </p>
//               )}
//             </>
//           )}
//         </div>
//         <div
//           className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300 ml-4 flex-shrink-0`}
//         >
//           <Icon className="w-5 h-5 text-white" />
//         </div>
//       </div>
//     </div>
//   </div>
// );

// export default StatCard;

import React from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

// ─────────────────────────────────────────────
// STANDARD STAT CARD
// ─────────────────────────────────────────────
const StatCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  loading,
  subtitle,
  trend,
  trendUp,
}) => (
  <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
    {/* gradient accent strip */}
    <div
      className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}
    />

    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            {title}
          </p>
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 w-28 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                {typeof value === "number"
                  ? value.toLocaleString()
                  : value || 0}
              </h3>
              {subtitle && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
                  {subtitle}
                  {trend && (
                    <span
                      className={`flex items-center gap-0.5 text-[10px] font-bold ${
                        trendUp ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {trendUp ? "↑" : "↓"} {trend}
                    </span>
                  )}
                </p>
              )}
            </>
          )}
        </div>
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300 ml-4 flex-shrink-0`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// STAT CARD WITH INSIDE/OUTSIDE BREAKDOWN
// ─────────────────────────────────────────────
export const StatCardWithBreakdown = ({
  title,
  value,
  icon: Icon,
  gradient,
  loading,
  subtitle,
  insideValue,
  outsideValue,
  valueFormatter,
  unit,
}) => {
  // Format value based on type
  const formatValue = (val) => {
    if (valueFormatter) return valueFormatter(val);
    if (typeof val === "number") {
      // Check if it's a decimal number (SAM)
      if (val % 1 !== 0) {
        return val.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
      return val.toLocaleString();
    }
    return val || 0;
  };

  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
      {/* Full gradient background overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300`}
      />

      {/* gradient accent strip */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient}`}
      />

      <div className="relative p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
              {title}
            </p>
            {loading ? (
              <div className="space-y-2">
                <div className="h-9 w-32 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                  {formatValue(value)}
                </h3>
                {unit && (
                  <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                    {unit}
                  </span>
                )}
              </div>
            )}
            {subtitle && !loading && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300 ml-4 flex-shrink-0`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Inside/Outside Breakdown */}
        {loading ? (
          <div className="flex gap-3">
            <div className="flex-1 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="flex-1 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
          </div>
        ) : (
          <div className="flex gap-3">
            {/* Inside (Task 38) */}
            <div className="flex-1 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/30">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                  <ArrowDownToLine className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Inside
                </span>
              </div>
              <p className="text-lg font-black text-indigo-700 dark:text-indigo-300 tabular-nums">
                {formatValue(insideValue)}
              </p>
            </div>

            {/* Outside (Task 39) */}
            <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                  <ArrowUpFromLine className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Outside
                </span>
              </div>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                {formatValue(outsideValue)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
