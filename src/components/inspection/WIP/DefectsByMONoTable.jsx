import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Package,
  AlertTriangle,
  Factory,
  Percent,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Zap,
  Users,
  Tag,
  Filter,
  X,
  ChevronDown,
  Check,
  Search,
} from "lucide-react";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const AUTO_ADVANCE_INTERVAL = 10000; // 10 seconds

// ─────────────────────────────────────────────
// BUYER COLORS
// ─────────────────────────────────────────────
const BUYER_COLORS = {
  Aritzia: {
    bg: "bg-rose-100 dark:bg-rose-900/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-300 dark:border-rose-700",
    gradient: "from-rose-500 to-pink-600",
  },
  Costco: {
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-700",
    gradient: "from-blue-500 to-cyan-600",
  },
  MWW: {
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
    gradient: "from-amber-500 to-orange-600",
  },
  Reitmans: {
    bg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-700",
    gradient: "from-purple-500 to-violet-600",
  },
  ANF: {
    bg: "bg-teal-100 dark:bg-teal-900/40",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-300 dark:border-teal-700",
    gradient: "from-teal-500 to-emerald-600",
  },
  STORI: {
    bg: "bg-indigo-100 dark:bg-indigo-900/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-300 dark:border-indigo-700",
    gradient: "from-indigo-500 to-blue-600",
  },
  Elite: {
    bg: "bg-slate-100 dark:bg-slate-900/40",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700",
    gradient: "from-slate-500 to-gray-600",
  },
  Other: {
    bg: "bg-gray-100 dark:bg-gray-800/40",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-300 dark:border-gray-600",
    gradient: "from-gray-500 to-gray-600",
  },
};

// ─────────────────────────────────────────────
// BUYER OPTIONS FOR FILTER
// ─────────────────────────────────────────────
const BUYER_OPTIONS = [
  "Aritzia",
  "ANF",
  "Costco",
  "Reitmans",
  "Elite",
  "MWW",
  "STORI",
  "Other",
];

// ─────────────────────────────────────────────
// GET RATE COLOR
// ─────────────────────────────────────────────
const getRateColor = (rate) => {
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
// MULTI-SELECT DROPDOWN WITH OPTIONAL SEARCH
// ─────────────────────────────────────────────
const MultiSelectDropdown = ({
  label,
  options,
  selected,
  onChange,
  icon: Icon,
  searchable = false,
  colorMap = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    return options.filter((option) =>
      String(option).toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm]);

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => onChange([...filteredOptions]);
  const clearAll = () => onChange([]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
          selected.length > 0
            ? "bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300"
            : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-md bg-violet-500 text-white text-[10px]">
            {selected.length}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
          {/* Search Input (Only for searchable) */}
          {searchable && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search MO No..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Select All / Clear All */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <button
              onClick={selectAll}
              className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Select All {searchTerm && `(${filteredOptions.length})`}
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
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const colors = colorMap?.[option];
                return (
                  <button
                    key={option}
                    onClick={() => toggleOption(option)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      selected.includes(option)
                        ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        selected.includes(option)
                          ? "bg-violet-500 border-violet-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {selected.includes(option) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    {/* Show color indicator for buyers */}
                    {colors && (
                      <div
                        className={`w-3 h-3 rounded-sm bg-gradient-to-r ${colors.gradient}`}
                      />
                    )}
                    <span className="font-medium truncate">{option}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Selected Count Footer */}
          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-violet-50 dark:bg-violet-900/20">
              <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400">
                {selected.length} selected
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
const CardSkeleton = () => (
  <div className="min-w-[400px] w-[400px] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse flex-shrink-0">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
    <div className="space-y-2">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
const EmptyState = () => (
  <div className="py-16 flex flex-col items-center justify-center gap-3">
    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
      <Package className="w-8 h-8 text-gray-300 dark:text-gray-500" />
    </div>
    <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">
      No MO defects data available
    </p>
  </div>
);

// ─────────────────────────────────────────────
// LINE BADGE
// ─────────────────────────────────────────────
const LineBadge = ({ lineNo }) => (
  <div className="px-3 py-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
    <span className="text-xs font-black">{lineNo}</span>
  </div>
);

// ─────────────────────────────────────────────
// DEFECT TABLE ROW
// ─────────────────────────────────────────────
const DefectTableRow = ({ defect, rank }) => {
  const rateInfo = getRateColor(defect.DefectRate);

  return (
    <tr className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      {/* Rank */}
      <td className="py-2.5 px-2 w-8">
        <span
          className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white ${
            rank === 1
              ? "bg-red-500"
              : rank === 2
                ? "bg-orange-500"
                : rank === 3
                  ? "bg-amber-500"
                  : "bg-gray-400 dark:bg-gray-600"
          }`}
        >
          {rank}
        </span>
      </td>

      {/* Defect Name */}
      <td className="py-2.5 px-2 max-w-[180px]">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 break-words leading-tight">
          {defect.ReworkName}
        </p>
      </td>

      {/* Qty */}
      <td className="py-2.5 px-2 text-center w-16">
        <span className="text-sm font-black text-red-600 dark:text-red-400 tabular-nums">
          {defect.DefectQty}
        </span>
      </td>

      {/* Rate */}
      <td className="py-2.5 px-2 text-right w-20">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${rateInfo.bg} ${rateInfo.text}`}
        >
          {defect.DefectRate.toFixed(2)}%
        </span>
      </td>
    </tr>
  );
};

// ─────────────────────────────────────────────
// MO CARD
// ─────────────────────────────────────────────
const MOCard = ({ item, rank }) => {
  const buyerColors = BUYER_COLORS[item.Buyer] || BUYER_COLORS["Other"];
  const rateInfo = getRateColor(item.DefectRate);

  return (
    <div className="min-w-[420px] w-[420px] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex-shrink-0 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div
        className={`px-5 py-4 bg-gradient-to-r ${buyerColors.gradient} relative overflow-hidden`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
        </div>

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Rank Badge */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-lg ${
                rank <= 3
                  ? "bg-white/20 backdrop-blur text-white"
                  : "bg-white/10 backdrop-blur text-white/80"
              }`}
            >
              #{rank}
            </div>

            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                {item.MONo}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/20 backdrop-blur text-white mt-1">
                {item.Buyer}
              </span>
            </div>
          </div>

          {/* Defect Rate Badge */}
          <div
            className={`px-3 py-2 rounded-xl text-center ${rateInfo.bg} border ${
              item.DefectRate > 5
                ? "border-red-300 dark:border-red-700"
                : item.DefectRate > 3
                  ? "border-amber-300 dark:border-amber-700"
                  : "border-emerald-300 dark:border-emerald-700"
            }`}
          >
            <p className={`text-xl font-black tabular-nums ${rateInfo.text}`}>
              {item.DefectRate.toFixed(2)}%
            </p>
            <p className="text-[9px] font-medium text-gray-500 dark:text-gray-400 uppercase">
              Defect Rate
            </p>
          </div>
        </div>
      </div>

      {/* Lines Section */}
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Factory className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Production Lines ({item.LineCount})
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.Lines && item.Lines.length > 0 ? (
            item.Lines.map((lineNo) => (
              <LineBadge key={lineNo} lineNo={lineNo} />
            ))
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              No lines found
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 py-4 grid grid-cols-3 gap-3 border-b border-gray-100 dark:border-gray-700">
        {/* Output */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              Output
            </span>
          </div>
          <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
            {item.OutputQty?.toLocaleString() || 0}
          </p>
        </div>

        {/* Defects */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-100 dark:border-red-800/30">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">
              Defects
            </span>
          </div>
          <p className="text-xl font-black text-red-700 dark:text-red-300 tabular-nums">
            {item.TotalDefects?.toLocaleString() || 0}
          </p>
        </div>

        {/* Workers */}
        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 border border-violet-100 dark:border-violet-800/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase">
              Workers
            </span>
          </div>
          <p className="text-xl font-black text-violet-700 dark:text-violet-300 tabular-nums">
            {item.WorkerCount || 0}
          </p>
        </div>
      </div>

      {/* Top 5 Defects Table */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Top 5 Defects
          </span>
        </div>

        {item.TopDefects && item.TopDefects.length > 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700/50">
                  <th className="py-2 px-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 text-left w-8">
                    #
                  </th>
                  <th className="py-2 px-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 text-left">
                    Defect Name
                  </th>
                  <th className="py-2 px-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 text-center w-16">
                    Qty
                  </th>
                  <th className="py-2 px-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 text-right w-20">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {item.TopDefects.map((defect, idx) => (
                  <DefectTableRow
                    key={defect.ReworkCode}
                    defect={defect}
                    rank={idx + 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              No defects found for this MO
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const DefectsByMONoTable = ({ data, loading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef(null);
  const intervalRef = useRef(null);

  // Filter States
  const [selectedMOs, setSelectedMOs] = useState([]);
  const [selectedBuyers, setSelectedBuyers] = useState([]);

  // Get MO Options from data
  const moOptions = useMemo(() => {
    return [...new Set(data.map((d) => d.MONo))].sort();
  }, [data]);

  // Filtered Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const moMatch =
        selectedMOs.length === 0 || selectedMOs.includes(item.MONo);
      const buyerMatch =
        selectedBuyers.length === 0 || selectedBuyers.includes(item.Buyer);
      return moMatch && buyerMatch;
    });
  }, [data, selectedMOs, selectedBuyers]);

  // Check if any filter is active
  const hasActiveFilters = selectedMOs.length > 0 || selectedBuyers.length > 0;

  // Filter summary text for title (NO truncation)
  const filterSummaryText = useMemo(() => {
    const parts = [];

    if (selectedMOs.length > 0) {
      parts.push(`MO: ${selectedMOs.join(", ")}`);
    }

    if (selectedBuyers.length > 0) {
      parts.push(`Buyer: ${selectedBuyers.join(", ")}`);
    }

    return parts.length > 0 ? parts.join(" | ") : "";
  }, [selectedMOs, selectedBuyers]);

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedMOs([]);
    setSelectedBuyers([]);
    setCurrentIndex(0);
  };

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedMOs, selectedBuyers]);

  //  Use filteredData for totalDefects
  const totalDefects = useMemo(
    () => filteredData.reduce((sum, d) => sum + (d.TotalDefects || 0), 0),
    [filteredData],
  );

  //  Auto-advance - use filteredData.length
  useEffect(() => {
    if (!isPaused && filteredData.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredData.length);
      }, AUTO_ADVANCE_INTERVAL);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, filteredData.length]);

  //  Scroll - use filteredData.length
  useEffect(() => {
    if (scrollContainerRef.current && filteredData.length > 0) {
      const cardWidth = 436;
      scrollContainerRef.current.scrollTo({
        left: currentIndex * cardWidth,
        behavior: "smooth",
      });
    }
  }, [currentIndex, filteredData.length]);

  //  Navigation - use filteredData.length
  const goToPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? filteredData.length - 1 : prev - 1,
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredData.length);
  };

  const goToIndex = (idx) => {
    setCurrentIndex(idx);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            {/* ✅ MODIFIED: Title with full filter summary */}
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">
              Defects by MO Number
              {hasActiveFilters && (
                <span className="ml-2 text-xs font-semibold text-violet-500 dark:text-violet-400">
                  ({filterSummaryText})
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {filteredData.length > 0
                ? `${filteredData.length} MOs · ${totalDefects.toLocaleString()} total defects`
                : "MO defects breakdown"}
              {hasActiveFilters && data.length !== filteredData.length && (
                <span className="ml-1 text-violet-500">
                  (showing {filteredData.length} of {data.length})
                </span>
              )}
            </p>
          </div>
          {/* <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">
              Defects by MO Number
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {data.length > 0
                ? `${data.length} MOs · ${totalDefects.toLocaleString()} total defects`
                : "MO defects breakdown"}
            </p>
          </div> */}
        </div>

        {/* Navigation Controls */}
        {filteredData.length > 1 && !loading && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {currentIndex + 1} of {filteredData.length}
            </span>

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

              {/* Navigation Arrows */}
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
        )}
      </div>

      {/* Filter Row */}
      <div className="px-5 py-3 flex items-center gap-2 flex-wrap border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-medium">Filters:</span>
        </div>

        {/* MO No Filter - Searchable */}
        <MultiSelectDropdown
          label="MO No"
          options={moOptions}
          selected={selectedMOs}
          onChange={setSelectedMOs}
          icon={Package}
          searchable={true}
        />

        {/* Buyer Filter */}
        <MultiSelectDropdown
          label="Buyer"
          options={BUYER_OPTIONS}
          selected={selectedBuyers}
          onChange={setSelectedBuyers}
          icon={Tag}
          searchable={false}
          colorMap={BUYER_COLORS}
        />

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {loading && data.length === 0 ? (
          <div className="flex gap-4 overflow-hidden">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : filteredData.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Cards Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {filteredData.map((item, idx) => (
                <div key={item.MONo} className="snap-start">
                  <MOCard item={item} rank={idx + 1} />
                </div>
              ))}
            </div>

            {/* Pagination Dots */}
            {filteredData.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                {filteredData.slice(0, 15).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentIndex === idx
                        ? "w-8 bg-gradient-to-r from-violet-500 to-purple-500"
                        : "w-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  />
                ))}
                {filteredData.length > 15 && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2">
                    +{filteredData.length - 15} more
                  </span>
                )}
              </div>
            )}

            {/* Auto-play indicator */}
            {filteredData.length > 1 && !isPaused && (
              <div className="flex items-center justify-center mt-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    Auto-advancing every 10s
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {!loading && filteredData.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-violet-500" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              <span className="font-bold">Worst MO:</span>{" "}
              {filteredData[0]?.MONo}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                BUYER_COLORS[filteredData[0]?.Buyer]?.bg ||
                BUYER_COLORS["Other"].bg
              } ${
                BUYER_COLORS[filteredData[0]?.Buyer]?.text ||
                BUYER_COLORS["Other"].text
              }`}
            >
              {filteredData[0]?.Buyer}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {filteredData[0]?.TotalDefects}
              </span>{" "}
              defects
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span>
              Rate:{" "}
              <span
                className={`font-bold ${
                  getRateColor(filteredData[0]?.DefectRate || 0).text
                }`}
              >
                {filteredData[0]?.DefectRate?.toFixed(2)}%
              </span>
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span>
              <span className="font-semibold">
                {filteredData[0]?.LineCount}
              </span>{" "}
              lines
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectsByMONoTable;
