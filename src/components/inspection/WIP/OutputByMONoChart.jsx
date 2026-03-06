import React, { useState, useRef, useEffect } from "react";
import {
  Package,
  ChevronLeft,
  ChevronRight,
  Palette,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────
// BUYER COLORS CONFIG
// ─────────────────────────────────────────────
const BUYER_COLORS = {
  Aritzia: {
    color: "#f43f5e",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-700",
    gradient: "from-rose-500 to-pink-600",
  },
  Costco: {
    color: "#3b82f6",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-700",
    gradient: "from-blue-500 to-cyan-600",
  },
  MWW: {
    color: "#f59e0b",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-700",
    gradient: "from-amber-500 to-orange-600",
  },
  Reitmans: {
    color: "#8b5cf6",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-700",
    gradient: "from-purple-500 to-violet-600",
  },
  ANF: {
    color: "#14b8a6",
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-700",
    gradient: "from-teal-500 to-emerald-600",
  },
  STORI: {
    color: "#6366f1",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-700",
    gradient: "from-indigo-500 to-blue-600",
  },
  Elite: {
    color: "#64748b",
    bg: "bg-slate-100 dark:bg-slate-900/30",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    gradient: "from-slate-500 to-gray-600",
  },
  Other: {
    color: "#9ca3af",
    bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700",
    gradient: "from-gray-500 to-gray-600",
  },
};

// ─────────────────────────────────────────────
// BUYER BADGE
// ─────────────────────────────────────────────
const BuyerBadge = ({ buyer }) => {
  const config = BUYER_COLORS[buyer] || BUYER_COLORS["Other"];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${config.bg} ${config.text} ${config.border}`}
    >
      {buyer}
    </span>
  );
};

// ─────────────────────────────────────────────
// COLOR SIZE TABLE
// ─────────────────────────────────────────────
const ColorSizeTable = ({ colors, allSizes }) => {
  if (!colors || colors.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-gray-400">
        No color/size data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700">
            <th className="text-left py-2 px-2 font-semibold text-gray-500 dark:text-gray-400 sticky left-0 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-1">
                <Palette className="w-3 h-3" />
                Color
              </div>
            </th>
            {allSizes.map((size) => (
              <th
                key={size}
                className="text-center py-2 px-2 font-semibold text-gray-500 dark:text-gray-400 min-w-[50px]"
              >
                {size}
              </th>
            ))}
            <th className="text-center py-2 px-2 font-semibold text-gray-500 dark:text-gray-400 min-w-[60px]">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {colors.map((color, colorIdx) => {
            // Create a size map for quick lookup
            const sizeMap = {};
            color.sizes.forEach((s) => {
              sizeMap[s.sizeName] = s;
            });

            return (
              <React.Fragment key={colorIdx}>
                {/* Inside Row (Task 38) */}
                <tr className="border-b border-gray-50 dark:border-gray-700/50 bg-indigo-50/30 dark:bg-indigo-900/10">
                  <td
                    className="py-1.5 px-2 sticky left-0 bg-indigo-50/30 dark:bg-indigo-900/10"
                    rowSpan={2}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700 dark:text-gray-200 break-words whitespace-normal max-w-[100px]">
                        {color.colorName}
                      </span>
                    </div>
                  </td>
                  {allSizes.map((size) => {
                    const sizeData = sizeMap[size];
                    const qty = sizeData?.Task38Qty || 0;
                    return (
                      <td
                        key={`${colorIdx}-${size}-t38`}
                        className="text-center py-1.5 px-1"
                      >
                        {qty > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[32px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold tabular-nums">
                            {qty}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">
                            -
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center py-1.5 px-2">
                    <span className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      <ArrowDownToLine className="w-3 h-3" />
                      {color.totalT38.toLocaleString()}
                    </span>
                  </td>
                </tr>
                {/* Outside Row (Task 39) */}
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-emerald-50/30 dark:bg-emerald-900/10">
                  {allSizes.map((size) => {
                    const sizeData = sizeMap[size];
                    const qty = sizeData?.Task39Qty || 0;
                    return (
                      <td
                        key={`${colorIdx}-${size}-t39`}
                        className="text-center py-1.5 px-1"
                      >
                        {qty > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[32px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold tabular-nums">
                            {qty}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">
                            -
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center py-1.5 px-2">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      <ArrowUpFromLine className="w-3 h-3" />
                      {color.totalT39.toLocaleString()}
                    </span>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─────────────────────────────────────────────
// MO CARD COMPONENT
// ─────────────────────────────────────────────
const MOCard = ({ mo, isFirst }) => {
  const buyerConfig = BUYER_COLORS[mo.Buyer] || BUYER_COLORS["Other"];

  return (
    <div
      className={`flex-shrink-0 w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${
        isFirst
          ? "border-violet-200 dark:border-violet-700 shadow-lg shadow-violet-500/10"
          : "border-gray-100 dark:border-gray-700 shadow-sm hover:border-gray-200 dark:hover:border-gray-600"
      }`}
    >
      {/* Card Header */}
      <div
        className={`relative px-4 py-3 bg-gradient-to-r ${buyerConfig.gradient} text-white`}
      >
        {isFirst && (
          <div className="absolute top-2 right-2">
            <Sparkles className="w-4 h-4 text-white/80" />
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold truncate">{mo.MONo}</h3>
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                {mo.Buyer}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-black tabular-nums">
              {mo.TotalQty?.toLocaleString()}
            </p>
            <p className="text-[10px] font-medium text-white/70">pcs</p>
          </div>
        </div>
      </div>

      {/* Task Summary */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          {/* Inside (Task 38) */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
              <ArrowDownToLine className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Inside
              </p>
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {mo.Task38Qty?.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-200 dark:bg-gray-600" />

          {/* Outside (Task 39) */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <ArrowUpFromLine className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Outside
              </p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {mo.Task39Qty?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Color Info */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Layers className="w-3.5 h-3.5" />
          <span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {mo.ColorCount}
            </span>{" "}
            Colors ·{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {mo.AllSizes?.length || 0}
            </span>{" "}
            Sizes
          </span>
        </div>
      </div>

      {/* Color/Size Table */}
      <div className="p-3 max-h-[300px] overflow-y-auto">
        <ColorSizeTable colors={mo.Colors} allSizes={mo.AllSizes || []} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex-shrink-0 w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
    <div className="h-20 bg-gray-200 dark:bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="flex justify-between">
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
const EmptyState = () => (
  <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
      <Package className="w-8 h-8 text-gray-300 dark:text-gray-600" />
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">
        No MO data available
      </p>
      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
        Data will appear once production begins today
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const OutputByMONoChart = ({ data, loading }) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const cardsPerPage = 3; // Show 3 cards at a time on large screens
  const totalPages = Math.ceil(data.length / cardsPerPage);

  // Check scroll position
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft <
          container.scrollWidth - container.clientWidth - 10,
      );
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, [data]);

  // Scroll handlers
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = container.querySelector("div")?.offsetWidth || 300;
      container.scrollBy({
        left: -(cardWidth + 16) * cardsPerPage,
        behavior: "smooth",
      });
      setCurrentPage((prev) => Math.max(0, prev - 1));
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = container.querySelector("div")?.offsetWidth || 300;
      container.scrollBy({
        left: (cardWidth + 16) * cardsPerPage,
        behavior: "smooth",
      });
      setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
    }
  };

  const handleScroll = () => {
    checkScrollPosition();
  };

  const totalOutput = data.reduce((sum, d) => sum + (d.TotalQty || 0), 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700/60">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">
                Total Output by MO Number
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {data.length > 0
                  ? `${data.length} MOs · ${totalOutput.toLocaleString()} total pcs`
                  : "Today's MO breakdown"}
              </p>
            </div>
          </div>

          {/* Navigation Arrows */}
          {data.length > cardsPerPage && !loading && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500 mr-2">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className={`p-2 rounded-xl border transition-all ${
                  canScrollLeft
                    ? "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-md"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className={`p-2 rounded-xl border transition-all ${
                  canScrollRight
                    ? "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-md"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards Carousel */}
      <div className="p-6">
        {loading && data.length === 0 ? (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {data.map((mo, idx) => (
              <MOCard key={mo.MONo} mo={mo} isFirst={idx === 0} />
            ))}
          </div>
        )}
      </div>

      {/* Footer Legend */}
      {!loading && data.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <ArrowDownToLine className="w-3 h-3 text-white" />
            </div>
            <span className="text-gray-500 dark:text-gray-400">
              Inside (Task 38)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <ArrowUpFromLine className="w-3 h-3 text-white" />
            </div>
            <span className="text-gray-500 dark:text-gray-400">
              Outside (Task 39)
            </span>
          </div>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-400 dark:text-gray-500">
            Swipe or use arrows to navigate
          </span>
        </div>
      )}

      {/* Pagination Dots */}
      {!loading && data.length > cardsPerPage && (
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                const container = scrollContainerRef.current;
                if (container) {
                  const cardWidth =
                    container.querySelector("div")?.offsetWidth || 300;
                  container.scrollTo({
                    left: (cardWidth + 16) * cardsPerPage * idx,
                    behavior: "smooth",
                  });
                  setCurrentPage(idx);
                }
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                currentPage === idx
                  ? "w-6 bg-violet-500"
                  : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OutputByMONoChart;