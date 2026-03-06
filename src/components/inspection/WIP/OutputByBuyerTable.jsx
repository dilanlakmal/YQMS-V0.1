import React from "react";
import { Users, TrendingUp, Package, ArrowUpRight } from "lucide-react";

// ─────────────────────────────────────────────
// BUYER CONFIG - Colors and styling
// ─────────────────────────────────────────────
const BUYER_CONFIG = {
  Aritzia: {
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
  Costco: {
    color: "from-blue-500 to-cyan-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  MWW: {
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  Reitmans: {
    color: "from-purple-500 to-violet-600",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  ANF: {
    color: "from-teal-500 to-emerald-600",
    bg: "bg-teal-50 dark:bg-teal-900/20",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
  },
  STORI: {
    color: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  Elite: {
    color: "from-slate-500 to-gray-600",
    bg: "bg-slate-50 dark:bg-slate-900/20",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-800",
  },
  Other: {
    color: "from-gray-400 to-gray-500",
    bg: "bg-gray-50 dark:bg-gray-900/20",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700",
  },
};

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────
const TableSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl" />
    ))}
  </div>
);

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
const EmptyTable = () => (
  <div className="py-12 flex flex-col items-center justify-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
      <Users className="w-7 h-7 text-gray-300 dark:text-gray-600" />
    </div>
    <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
      No buyer data available
    </p>
  </div>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const OutputByBuyerTable = ({ data, loading }) => {
  const totalOutput = data.reduce((sum, d) => sum + (d.TotalQty || 0), 0);
  const totalMOs = data.reduce((sum, d) => sum + (d.MOCount || 0), 0);
  const maxQty = Math.max(...data.map((d) => d.TotalQty || 0), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white">
              Daily Output by Buyer
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {data.length > 0
                ? `${data.length} buyers · ${totalMOs} MOs · ${totalOutput.toLocaleString()} pcs`
                : "Today's buyer breakdown"}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-4">
        {loading && data.length === 0 ? (
          <TableSkeleton />
        ) : data.length === 0 ? (
          <EmptyTable />
        ) : (
          <div className="space-y-2">
            {data.map((row, idx) => {
              const config = BUYER_CONFIG[row.Buyer] || BUYER_CONFIG["Other"];
              const percentage = Math.round((row.TotalQty / maxQty) * 100);

              return (
                <div
                  key={idx}
                  className={`relative overflow-hidden rounded-xl border ${config.border} ${config.bg} hover:shadow-md transition-all duration-200 group`}
                >
                  {/* Progress bar background */}
                  <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${config.color} opacity-10 transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />

                  <div className="relative px-4 py-3 flex items-center gap-4">
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-white font-bold text-sm shadow-sm`}
                    >
                      {idx + 1}
                    </div>

                    {/* Buyer Info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-sm font-bold ${config.text} truncate`}
                      >
                        {row.Buyer}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {row.MOCount} MOs
                        </span>
                      </div>
                    </div>

                    {/* Quantities */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="text-center">
                        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">
                          Inside
                        </p>
                        <p className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {row.Task38Qty?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">
                          Outside
                        </p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {row.Task39Qty?.toLocaleString()}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-600 mx-1" />
                      <div className="text-center min-w-[60px]">
                        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">
                          Total
                        </p>
                        <p className="font-black text-gray-800 dark:text-white tabular-nums flex items-center gap-1">
                          {row.TotalQty?.toLocaleString()}
                          <ArrowUpRight className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {!loading && data.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                Top Buyer:{" "}
                <span className="font-bold text-gray-700 dark:text-gray-200">
                  {data[0]?.Buyer}
                </span>
              </span>
            </div>
            <span className="text-gray-400 dark:text-gray-500">
              {((data[0]?.TotalQty / totalOutput) * 100).toFixed(1)}% of total
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputByBuyerTable;