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
