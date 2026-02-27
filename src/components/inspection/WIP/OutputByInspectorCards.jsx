import React, { useState, useMemo } from "react";
import {
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Award,
  MapPin,
  Package,
  User,
  Sparkles,
  Crown,
  Medal,
  Trophy,
} from "lucide-react";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

const TASK_OPTIONS = [
  { value: "all", label: "All Tasks", color: "#8b5cf6" },
  { value: "38", label: "Inside", color: "#6366f1" },
  { value: "39", label: "Outside", color: "#10b981" },
];

const BUYER_COLORS = {
  Aritzia: {
    color: "#f43f5e",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-700",
  },
  Costco: {
    color: "#3b82f6",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-700",
  },
  MWW: {
    color: "#f59e0b",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-700",
  },
  Reitmans: {
    color: "#8b5cf6",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-700",
  },
  ANF: {
    color: "#14b8a6",
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-700",
  },
  STORI: {
    color: "#6366f1",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-700",
  },
  Elite: {
    color: "#64748b",
    bg: "bg-slate-100 dark:bg-slate-900/30",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
  },
  Other: {
    color: "#9ca3af",
    bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700",
  },
};

const RANK_CONFIG = {
  1: {
    icon: Crown,
    gradient: "from-amber-400 via-yellow-500 to-amber-600",
    shadow: "shadow-amber-500/30",
    ring: "ring-amber-400/50",
    badge: "bg-gradient-to-r from-amber-400 to-yellow-500",
  },
  2: {
    icon: Medal,
    gradient: "from-slate-300 via-gray-400 to-slate-500",
    shadow: "shadow-slate-400/30",
    ring: "ring-slate-300/50",
    badge: "bg-gradient-to-r from-slate-300 to-gray-400",
  },
  3: {
    icon: Trophy,
    gradient: "from-orange-400 via-amber-500 to-orange-600",
    shadow: "shadow-orange-500/30",
    ring: "ring-orange-400/50",
    badge: "bg-gradient-to-r from-orange-400 to-amber-500",
  },
};

// ─────────────────────────────────────────────
// TASK BADGE COMPONENT
// ─────────────────────────────────────────────

const TaskBadge = ({ taskNo }) => {
  const isTask38 = taskNo === 38;
  return (
    <div
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
        isTask38
          ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300"
          : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300"
      }`}
    >
      {isTask38 ? "Inside" : "Outside"}
    </div>
  );
};

// ─────────────────────────────────────────────
// BUYER TAG COMPONENT
// ─────────────────────────────────────────────
const BuyerTag = ({ buyer }) => {
  const config = BUYER_COLORS[buyer] || BUYER_COLORS["Other"];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      {buyer}
    </span>
  );
};

// ─────────────────────────────────────────────
// RANK BADGE COMPONENT
// ─────────────────────────────────────────────
const RankBadge = ({ rank }) => {
  const config = RANK_CONFIG[rank];

  if (config) {
    const IconComponent = config.icon;
    return (
      <div
        className={`w-8 h-8 rounded-full bg-gradient-to-br ${config.gradient} ${config.shadow} shadow-lg flex items-center justify-center ring-2 ${config.ring} z-10`}
      >
        <IconComponent className="w-4 h-4 text-white" />
      </div>
    );
  }

  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 shadow-md flex items-center justify-center text-[11px] font-bold text-white z-10">
      {rank}
    </div>
  );
};

// ─────────────────────────────────────────────
// INSPECTOR CARD COMPONENT
// ─────────────────────────────────────────────
const InspectorCard = ({ inspector, isTopPerformer }) => {
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const displayLines = expanded
    ? inspector.Lines
    : inspector.Lines?.slice(0, 2);
  const hasMoreLines = inspector.Lines?.length > 2;

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl group ${
        isTopPerformer
          ? "border-amber-200 dark:border-amber-700 shadow-lg shadow-amber-500/10"
          : "border-gray-100 dark:border-gray-700 shadow-sm hover:border-gray-200 dark:hover:border-gray-600"
      }`}
    >
      {/* Top Performer Glow */}
      {isTopPerformer && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
      )}

      <div className="p-4">
        {/* Header Row: Photo + Info + Stats */}
        <div className="flex items-start gap-4">
          {/* Profile Photo */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 ${
                isTopPerformer ? "ring-2 ring-amber-400/50 shadow-lg" : ""
              }`}
            >
              {inspector.FacePhoto && !imageError ? (
                <img
                  src={inspector.FacePhoto}
                  alt={inspector.EmpName}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700">
                  <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>

            {/* Top Performer Sparkle */}
            {isTopPerformer && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Employee Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white truncate">
                  {inspector.EmpName || inspector.EngName || "Unknown"}
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                  ID: {inspector.EmpID}
                </p>
                {inspector.KhName && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                    {inspector.KhName}
                  </p>
                )}
                {/* Buyer Tags */}
                {inspector.AllBuyers?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {inspector.AllBuyers.map((buyer) => (
                      <BuyerTag key={buyer} buyer={buyer} />
                    ))}
                  </div>
                )}
              </div>

              {/* Total Output Badge */}
              <div className="flex-shrink-0 text-right">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                    isTopPerformer
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
                  }`}
                >
                  <span
                    className={`text-lg font-black tabular-nums ${
                      isTopPerformer ? "" : ""
                    }`}
                  >
                    {inspector.TotalQty?.toLocaleString()}
                  </span>
                  <span
                    className={`text-[10px] font-medium ${
                      isTopPerformer
                        ? "text-white/80"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    pcs
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {inspector.Task38Qty > 0 && <TaskBadge taskNo={38} />}
                  {inspector.Task39Qty > 0 && <TaskBadge taskNo={39} />}
                  <RankBadge rank={inspector.Rank} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lines & MO Details Section */}
        {inspector.Lines?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Production Lines ({inspector.LineCount})
              </span>
            </div>

            <div className="space-y-2">
              {displayLines?.map((line, lineIdx) => (
                <div
                  key={lineIdx}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5"
                >
                  {/* Line Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-bold shadow-sm">
                        Line: [{line.LineNo}]
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {line.TotalQty?.toLocaleString()} pcs
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      {line.Buyers?.slice(0, 3).map((buyer) => (
                        <span
                          key={buyer}
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              BUYER_COLORS[buyer]?.color || "#9ca3af",
                          }}
                          title={buyer}
                        />
                      ))}
                    </div>
                  </div>

                  {/* MO Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {line.MODetails?.slice(0, 4).map((mo, moIdx) => {
                      const buyerConfig =
                        BUYER_COLORS[mo.Buyer] || BUYER_COLORS["Other"];
                      return (
                        <div
                          key={moIdx}
                          className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-2 py-1.5 border border-gray-100 dark:border-gray-600"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Package className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-[12px] font-medium text-gray-600 dark:text-gray-300 truncate max-w-[80px]">
                              {mo.MONo}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {mo.Task38Qty > 0 && (
                              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                (Inside:{mo.Task38Qty})
                              </span>
                            )}
                            {mo.Task39Qty > 0 && (
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                (Outside:{mo.Task39Qty})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {line.MODetails?.length > 4 && (
                      <div className="col-span-full text-center py-1">
                        <span className="text-[10px] text-gray-400">
                          +{line.MODetails.length - 4} more MOs
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Show More Lines Button */}
              {hasMoreLines && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="w-full py-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  {expanded
                    ? "Show Less"
                    : `Show ${inspector.Lines.length - 2} More Lines`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>
      <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
      <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded-xl" />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
const EmptyState = () => (
  <div className="col-span-full py-16 flex flex-col items-center justify-center gap-3">
    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
      <UserCheck className="w-8 h-8 text-gray-300 dark:text-gray-600" />
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">
        No inspection data available
      </p>
      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
        Data will appear once inspectors begin work today
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// PAGINATION COMPONENT
// ─────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = useMemo(() => {
    const result = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        result.push(i);
      }
    } else {
      if (currentPage <= 3) {
        result.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        result.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        result.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }

    return result;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page Numbers */}
      {pages.map((page, idx) =>
        page === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="px-2 text-gray-400 dark:text-gray-500"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
              currentPage === page
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {page}
          </button>
        ),
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const OutputByInspectorCards = ({
  data,
  loading,
  selectedTask,
  onTaskChange,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when task changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedTask]);

  // Calculate pagination
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Stats
  const totalInspectors = data.length;
  const totalInspected = data.reduce((sum, d) => sum + (d.TotalQty || 0), 0);
  const topPerformer = data[0];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">
                Daily QC1 Inspection by Inspector
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {data.length > 0
                  ? `${totalInspectors} inspectors · ${totalInspected.toLocaleString()} pcs inspected today`
                  : "Today's inspection data"}
              </p>
            </div>
          </div>

          {/* Task Filter */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl gap-1">
            {TASK_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onTaskChange(option.value)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  selectedTask === option.value
                    ? "bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="p-6">
        {loading && data.length === 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Page Info */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-600 dark:text-gray-300">
                  {startIndex + 1}-
                  {Math.min(startIndex + ITEMS_PER_PAGE, data.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-600 dark:text-gray-300">
                  {data.length}
                </span>{" "}
                inspectors
              </p>
              {currentPage === 1 && topPerformer && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <Award className="w-3.5 h-3.5" />
                  <span className="font-semibold">
                    Top: {topPerformer.EmpName} (
                    {topPerformer.TotalQty?.toLocaleString()} pcs)
                  </span>
                </div>
              )}
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {paginatedData.map((inspector, idx) => (
                <InspectorCard
                  key={inspector.EmpID}
                  inspector={inspector}
                  isTopPerformer={startIndex + idx === 0}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Summary Footer */}
      {!loading && data.length > 0 && (
        <div className="px-6 py-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-t border-orange-100 dark:border-orange-800/30">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-300">
                <Award className="w-4 h-4" />
                <span className="font-bold">Top Performer:</span>
                <span>{topPerformer?.EmpName}</span>
              </div>
              <span className="text-orange-300 dark:text-orange-700">|</span>
              <span className="text-orange-600 dark:text-orange-400">
                {topPerformer?.TotalQty?.toLocaleString()} pieces inspected
              </span>
            </div>
            <div className="flex items-center gap-3 text-orange-500 dark:text-orange-400/70">
              <span>
                Avg:{" "}
                {Math.round(totalInspected / totalInspectors).toLocaleString()}{" "}
                pcs/inspector
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputByInspectorCards;
