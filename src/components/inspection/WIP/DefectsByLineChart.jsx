import React, { useState, useMemo, useEffect, useRef } from "react";
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
  AlertTriangle,
  Package,
  Percent,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Zap,
  Tag,
  Filter,
  X,
  ChevronDown,
  Check,
  MapPin,
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

const getRateInfo = (rate) => {
  if (rate < 3)
    return {
      color: "#22C55E",
      bg: "bg-emerald-100 dark:bg-emerald-900/40",
      text: "text-emerald-700 dark:text-emerald-300",
      label: "Good",
    };
  if (rate <= 5)
    return {
      color: "#F59E0B",
      bg: "bg-amber-100 dark:bg-amber-900/40",
      text: "text-amber-700 dark:text-amber-300",
      label: "Warning",
    };
  return {
    color: "#EF4444",
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-700 dark:text-red-300",
    label: "Critical",
  };
};

// ─────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const rateColor = getColorByRate(data.DefectRate);

    return (
      <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[220px]">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Line {label}
        </p>

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
// CUSTOM BAR LABEL (Vertical on top)
// ─────────────────────────────────────────────
const CustomBarLabel = ({ x, y, width, height, value, viewMode, index }) => {
  if (value === undefined || value === null) return null;

  const displayValue =
    viewMode === "rate" ? `${value.toFixed(2)}%` : value.toLocaleString();

  // Calculate position - rotate text if bars are narrow
  const isNarrow = width < 35;

  if (isNarrow) {
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill={
          viewMode === "output"
            ? "#047857"
            : viewMode === "defects"
              ? "#B91C1C"
              : "#92400E"
        }
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fontFamily="'DM Mono', monospace"
        transform={`rotate(-30, ${x + width / 2}, ${y - 5})`}
      >
        {displayValue}
      </text>
    );
  }

  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill={
        viewMode === "output"
          ? "#10B981"
          : viewMode === "defects"
            ? "#EF4444"
            : "#F59E0B"
      }
      textAnchor="middle"
      fontSize={12}
      fontWeight={700}
      fontFamily="'DM Mono', monospace"
    >
      {displayValue}
    </text>
  );
};

// ─────────────────────────────────────────────
// MULTI-SELECT DROPDOWN COMPONENT
// ─────────────────────────────────────────────
const MultiSelectDropdown = ({
  label,
  options,
  selected,
  onChange,
  icon: Icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => onChange([...options]);
  const clearAll = () => onChange([]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
          selected.length > 0
            ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
            : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px]">
            {selected.length}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
          {/* Select All / Clear All */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <button
              onClick={selectAll}
              className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:underline"
            >
              Clear All
            </button>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto p-1">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => toggleOption(option)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selected.includes(option)
                    ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    selected.includes(option)
                      ? "bg-red-500 border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {selected.includes(option) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="font-medium">Line {option}</span>
              </button>
            ))}
          </div>

          {/* Selected Count Footer */}
          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
              <span className="text-[10px] font-medium text-red-600 dark:text-red-400">
                {selected.length} line{selected.length > 1 ? "s" : ""} selected
              </span>
            </div>
          )}
        </div>
      )}
    </div>
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
// TOP DEFECT CARD
// ─────────────────────────────────────────────
const TopDefectCard = ({ defect, rank }) => {
  const rateInfo = getRateInfo(defect.DefectRate);

  return (
    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3 border border-gray-100 dark:border-gray-600/50">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white ${
              rank === 1
                ? "bg-red-500"
                : rank === 2
                  ? "bg-orange-500"
                  : "bg-amber-500"
            }`}
          >
            {rank}
          </span>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
            {defect.ReworkName}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-red-600 dark:text-red-400 tabular-nums">
            {defect.DefectQty}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            defects
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${rateInfo.bg} ${rateInfo.text}`}
        >
          {defect.DefectRate.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// LINE SUMMARY CARD
// ─────────────────────────────────────────────
const LineSummaryCard = ({ line }) => {
  const rateInfo = getRateInfo(line.DefectRate);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-w-[320px] w-[320px] flex-shrink-0">
      {/* Header */}
      <div
        className={`px-4 py-3 flex items-center justify-between ${
          line.DefectRate >= 5
            ? "bg-gradient-to-r from-red-500 to-rose-600"
            : line.DefectRate >= 3
              ? "bg-gradient-to-r from-amber-500 to-orange-600"
              : "bg-gradient-to-r from-emerald-500 to-teal-600"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Factory className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-black text-white">
              Line {line.LineNo}
            </h4>
            <p className="text-[10px] text-white/70 font-medium">
              {line.MOCount} MO{line.MOCount > 1 ? "s" : ""} Running
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white tabular-nums">
            {line.DefectRate.toFixed(2)}%
          </p>
          <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider">
            Defect Rate
          </p>
        </div>
      </div>

      {/* MO Numbers */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
          Running MOs
        </p>
        <div className="flex flex-wrap gap-1">
          {line.MONumbers?.slice(0, 4).map((mo, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-[10px] font-mono font-semibold text-gray-700 dark:text-gray-300"
            >
              {mo}
            </span>
          ))}
          {line.MONumbers?.length > 4 && (
            <span className="px-2 py-0.5 text-[10px] text-gray-400 dark:text-gray-500">
              +{line.MONumbers.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 py-3 grid grid-cols-3 gap-3 border-b border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
              Output
            </span>
          </div>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {line.OutputQty?.toLocaleString()}
          </p>
        </div>
        <div className="text-center border-x border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
              Defects
            </span>
          </div>
          <p className="text-lg font-black text-red-600 dark:text-red-400 tabular-nums">
            {line.TotalDefects?.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Percent className="w-3 h-3" style={{ color: rateInfo.color }} />
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
              Rate
            </span>
          </div>
          <p className={`text-lg font-black tabular-nums ${rateInfo.text}`}>
            {line.DefectRate.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Top 3 Defects */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Top 3 Defects
          </span>
        </div>
        {line.TopDefects && line.TopDefects.length > 0 ? (
          <div className="space-y-2">
            {line.TopDefects.slice(0, 3).map((defect, idx) => (
              <TopDefectCard
                key={defect.ReworkCode}
                defect={defect}
                rank={idx + 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              No defects found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// LINE SUMMARY CAROUSEL
// ─────────────────────────────────────────────
const LineSummaryCarousel = ({ data }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef(null);
  const intervalRef = useRef(null);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) =>
      a.LineNo.localeCompare(b.LineNo, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
  }, [data]);

  // Auto-advance every 10 seconds
  useEffect(() => {
    if (!isPaused && sortedData.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % sortedData.length);
      }, 10000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, sortedData.length]);

  // Scroll to current card
  useEffect(() => {
    if (scrollContainerRef.current && sortedData.length > 0) {
      const cardWidth = 336; // 320px card + 16px gap
      scrollContainerRef.current.scrollTo({
        left: currentIndex * cardWidth,
        behavior: "smooth",
      });
    }
  }, [currentIndex, sortedData.length]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? sortedData.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedData.length);
  };

  if (sortedData.length === 0) return null;

  return (
    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Factory className="w-4 h-4 text-gray-400" />
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200">
            Line Summary
          </h4>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            ({currentIndex + 1} of {sortedData.length})
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-lg transition-colors ${
              isPaused
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            }`}
            title={isPaused ? "Resume auto-play" : "Pause auto-play"}
          >
            {isPaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>

          {/* Navigation */}
          <button
            onClick={goToPrev}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {sortedData.map((line, idx) => (
          <div key={line.LineNo} className="snap-start">
            <LineSummaryCard line={line} />
          </div>
        ))}
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {sortedData.slice(0, 20).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentIndex === idx
                ? "w-6 bg-gradient-to-r from-red-500 to-orange-500"
                : "w-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          />
        ))}
        {sortedData.length > 20 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2">
            +{sortedData.length - 20} more
          </span>
        )}
      </div>

      {/* Auto-play indicator */}
      {!isPaused && (
        <div className="flex items-center justify-center mt-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700/50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              Auto-advancing every 10s
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const DefectsByLineChart = ({ data, loading }) => {
  const [viewMode, setViewMode] = useState("rate");
  const [hoveredBar, setHoveredBar] = useState(null);

  //  Filter State
  const [selectedLines, setSelectedLines] = useState([]);

  const config = VIEW_MODES[viewMode];

  //  Get Line Options from data (sorted naturally)
  const lineOptions = useMemo(() => {
    return [...new Set(data.map((d) => String(d.LineNo)))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  }, [data]);

  //  Filtered Data
  const filteredData = useMemo(() => {
    if (selectedLines.length === 0) return data;
    return data.filter((item) => selectedLines.includes(String(item.LineNo)));
  }, [data, selectedLines]);

  //  Check if filter is active
  const hasActiveFilter = selectedLines.length > 0;

  //  Filter summary text for title
  const filterSummaryText = useMemo(() => {
    if (selectedLines.length === 0) return "";
    if (selectedLines.length <= 20) {
      return selectedLines.join(", ");
    }
    return `${selectedLines.slice(0, 4).join(", ")}... +${selectedLines.length - 4}`;
  }, [selectedLines]);

  //  Clear filter function
  const clearFilter = () => {
    setSelectedLines([]);
  };

  // Use filteredData instead of data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      if (viewMode === "rate") return b.DefectRate - a.DefectRate;
      if (viewMode === "output") return b.OutputQty - a.OutputQty;
      return b.TotalDefects - a.TotalDefects;
    });
    return sorted;
  }, [filteredData, viewMode]);

  // Calculate stats from filteredData
  const totalOutput = filteredData.reduce(
    (sum, d) => sum + (d.OutputQty || 0),
    0,
  );
  const totalDefects = filteredData.reduce(
    (sum, d) => sum + (d.TotalDefects || 0),
    0,
  );
  const avgRate =
    totalOutput > 0 ? ((totalDefects / totalOutput) * 100).toFixed(2) : 0;

  // Use filteredData for worst line
  const worstLine = useMemo(() => {
    return [...filteredData].sort((a, b) => b.DefectRate - a.DefectRate)[0];
  }, [filteredData]);

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
            {/* ✅ MODIFIED: Title with filter summary */}
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">
              Production Line Analysis
              {hasActiveFilter && (
                <span className="ml-2 text-xs font-semibold text-red-500 dark:text-red-400">
                  (Line: {filterSummaryText})
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {filteredData.length > 0
                ? `${filteredData.length} lines · Avg Rate: ${avgRate}%`
                : "Line breakdown"}
              {hasActiveFilter && data.length !== filteredData.length && (
                <span className="ml-1 text-red-500">
                  (showing {filteredData.length} of {data.length})
                </span>
              )}
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

      {/* ✅ ADD: Filter Row */}
      <div className="px-5 py-3 flex items-center gap-2 flex-wrap border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-medium">Filter:</span>
        </div>

        {/* Line No Filter */}
        <MultiSelectDropdown
          label="Line No"
          options={lineOptions}
          selected={selectedLines}
          onChange={setSelectedLines}
          icon={MapPin}
        />

        {/* Clear Filter Button */}
        {hasActiveFilter && (
          <button
            onClick={clearFilter}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filter
          </button>
        )}
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
        <div className="h-[350px]">
          {loading && data.length === 0 ? (
            <ChartSkeleton />
          ) : filteredData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedData}
                margin={{ top: 35, right: 10, left: -10, bottom: 5 }}
                barSize={Math.max(
                  18,
                  Math.min(45, 320 / sortedData.length - 6),
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
                  tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 600 }}
                  dy={8}
                  interval={0}
                  angle={sortedData.length > 15 ? 0 : 0}
                  textAnchor={sortedData.length > 15 ? "end" : "middle"}
                  height={sortedData.length > 15 ? 55 : 45}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  tickFormatter={(v) =>
                    viewMode === "rate"
                      ? `${v}%`
                      : v >= 1000
                        ? `${(v / 1000).toFixed(1)}k`
                        : v
                  }
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                <Bar
                  dataKey={config.key}
                  radius={[4, 4, 0, 0]}
                  animationDuration={600}
                  onMouseEnter={(_, index) => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <LabelList
                    dataKey={config.key}
                    content={(props) => (
                      <CustomBarLabel {...props} viewMode={viewMode} />
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

      {/* Footer Stats */}
      {!loading && filteredData.length > 0 && (
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

      {/* Line Summary Carousel */}
      {!loading && filteredData.length > 0 && (
        <div className="px-5 pb-5">
          <LineSummaryCarousel data={filteredData} />
        </div>
      )}
    </div>
  );
};

export default DefectsByLineChart;
