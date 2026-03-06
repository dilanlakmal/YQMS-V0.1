import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  User,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MapPin,
  Pause,
  Play,
  Package,
  Wrench,
  Crown,
  Medal,
  Trophy,
  Filter,
  X,
  ChevronDown,
  Check,
  Search,
} from "lucide-react";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const ITEMS_PER_PAGE = 6; // 3x2 grid
const AUTO_ROTATE_INTERVAL = 10000; // 10 seconds

const RANK_CONFIG = {
  1: {
    icon: Crown,
    gradient: "from-red-500 via-rose-500 to-red-600",
    shadow: "shadow-red-500/40",
    ring: "ring-red-400/60",
  },
  2: {
    icon: Medal,
    gradient: "from-orange-400 via-amber-500 to-orange-600",
    shadow: "shadow-orange-500/30",
    ring: "ring-orange-400/50",
  },
  3: {
    icon: Trophy,
    gradient: "from-amber-400 via-yellow-500 to-amber-600",
    shadow: "shadow-amber-500/30",
    ring: "ring-amber-400/50",
  },
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
        className={`w-8 h-8 rounded-full bg-gradient-to-br ${config.gradient} ${config.shadow} shadow-lg flex items-center justify-center ring-2 ${config.ring} z-20`}
      >
        <IconComponent className="w-4 h-4 text-white" />
      </div>
    );
  }

  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 shadow-md flex items-center justify-center text-[10px] font-bold text-white z-20">
      {rank}
    </div>
  );
};

// ─────────────────────────────────────────────
// DEFECT ITEM ROW
// ─────────────────────────────────────────────
const DefectItem = ({ defect, maxQty, index }) => {
  const barWidth = maxQty > 0 ? (defect.DefectQty / maxQty) * 100 : 0;
  const isTop = index === 0;

  return (
    <div className="flex items-center gap-2 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={`text-[10px] font-medium break-words leading-tight ${
              isTop
                ? "text-red-700 dark:text-red-300"
                : "text-gray-600 dark:text-gray-400"
            }`}
            title={defect.ReworkName}
          >
            {defect.ReworkName}
          </span>
          <span
            className={`text-[10px] font-bold tabular-nums ml-2 ${
              isTop
                ? "text-red-600 dark:text-red-400"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {defect.DefectQty}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isTop
                ? "bg-gradient-to-r from-red-500 to-rose-500"
                : "bg-gradient-to-r from-gray-400 to-gray-500"
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MULTI-SELECT DROPDOWN COMPONENT
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// MULTI-SELECT DROPDOWN WITH SEARCH
// ─────────────────────────────────────────────
const MultiSelectDropdown = ({
  label,
  options,
  selected,
  onChange,
  icon: Icon,
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = React.useRef(null);
  const searchInputRef = React.useRef(null);

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
            ? "bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700 text-pink-700 dark:text-pink-300"
            : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-md bg-pink-500 text-white text-[10px]">
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
                  placeholder="Search ID..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
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
                No results found for "{searchTerm}"
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleOption(option)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    selected.includes(option)
                      ? "bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      selected.includes(option)
                        ? "bg-pink-500 border-pink-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {selected.includes(option) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="font-medium font-mono">{option}</span>
                </button>
              ))
            )}
          </div>

          {/* Selected Count Footer */}
          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-pink-50 dark:bg-pink-900/20">
              <span className="text-[10px] font-medium text-pink-600 dark:text-pink-400">
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
// WORKER CARD COMPONENT
// ─────────────────────────────────────────────
const WorkerCard = ({ worker, isHighRisk }) => {
  const [imageError, setImageError] = useState(false);

  const maxDefectQty = Math.max(
    ...(worker.Defects?.map((d) => d.DefectQty) || [1]),
    1,
  );

  const displayDefects = worker.Defects?.slice(0, 5) || [];
  const hasMoreDefects = (worker.Defects?.length || 0) > 5;

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group ${
        isHighRisk
          ? "border-red-200 dark:border-red-700/50 shadow-lg shadow-red-500/10"
          : "border-gray-100 dark:border-gray-700 shadow-sm hover:border-gray-200 dark:hover:border-gray-600"
      }`}
    >
      {/* High Risk Glow */}
      {isHighRisk && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-rose-500/5 pointer-events-none" />
      )}

      {/* Card Content */}
      <div className="p-4 pt-5">
        {/* Header: Photo + Employee Info */}
        <div className="flex items-start gap-3 mb-3">
          {/* Profile Photo */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 ${
                isHighRisk ? "ring-2 ring-red-400/50" : ""
              }`}
            >
              {worker.FacePhoto && !imageError ? (
                <img
                  src={worker.FacePhoto}
                  alt={worker.EmpName || worker.EmpID}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700">
                  <User className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>
          </div>

          {/* Employee Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white truncate">
              {worker.EmpName || "Unknown Worker"}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
              ID: {worker.EmpID}
            </p>
            {worker.KhName && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                {worker.KhName}
              </p>
            )}
          </div>

          {/* Total Defects Badge */}
          <div className="flex-shrink-0">
            <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Defects#
            </p>
            <div
              className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl ${
                isHighRisk
                  ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
              }`}
            >
              <span className="text-lg font-black tabular-nums">
                {worker.TotalDefects}
              </span>
            </div>
          </div>
        </div>

        {/* Highlighted Line & Station Box */}
        <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-900/30 dark:via-blue-900/30 dark:to-purple-900/30 border border-indigo-100 dark:border-indigo-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Line No */}
              <div className="text-center">
                <p className="text-[9px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                  Line
                </p>
                <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 shadow-md shadow-indigo-500/25">
                  <span className="text-lg font-black text-white">
                    [{worker.LineNo}]
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-10 w-px bg-indigo-200 dark:bg-indigo-700" />

              {/* Station ID */}
              <div className="text-center">
                <p className="text-[9px] font-semibold text-purple-500 dark:text-purple-400 uppercase tracking-wider mb-0.5">
                  Station
                </p>
                <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 shadow-md shadow-purple-500/25">
                  <span className="text-lg font-black text-white">
                    {worker.StationID}
                  </span>
                </div>
              </div>
              <RankBadge rank={worker.Rank} />
            </div>

            {/* Defect Types Count */}
            <div className="text-right">
              <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Types
              </p>
              <p className="text-xl font-black text-gray-700 dark:text-gray-200">
                {worker.DefectTypeCount}
              </p>
            </div>
          </div>
        </div>

        {/* MO Numbers */}
        {worker.MONumbers?.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Package className="w-3 h-3 text-gray-400" />
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                MO Numbers
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {worker.MONumbers.slice(0, 3).map((mo, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                >
                  {mo}
                </span>
              ))}
              {worker.MONumbers.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                  +{worker.MONumbers.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Defects Breakdown */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3 h-3 text-gray-400" />
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Defect Breakdown
              </span>
            </div>
            {hasMoreDefects && (
              <span className="text-[9px] text-gray-400">
                +{worker.Defects.length - 5} more
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {displayDefects.map((defect, idx) => (
              <DefectItem
                key={defect.ReworkCode}
                defect={defect}
                maxQty={maxDefectQty}
                index={idx}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="h-10 w-14 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
    <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl mb-3" />
    <div className="space-y-2">
      <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded" />
      <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded" />
      <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded" />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
const EmptyState = () => (
  <div className="col-span-full py-16 flex flex-col items-center justify-center gap-3">
    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
      <User className="w-8 h-8 text-gray-300 dark:text-gray-600" />
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">
        No worker defects data available
      </p>
      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
        Defect data will appear once QC identifies issues
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// PAGINATION DOTS
// ─────────────────────────────────────────────
const PaginationDots = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`transition-all duration-300 ${
            currentPage === page
              ? "w-8 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
              : "w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
          }`}
          aria-label={`Go to page ${page}`}
        />
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// PROGRESS BAR FOR AUTO-ROTATION
// ─────────────────────────────────────────────
const AutoRotateProgress = ({ progress, isPaused }) => {
  if (isPaused) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-700 overflow-hidden rounded-b-2xl">
      <div
        className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const DefectsByWorkerTable = ({ data, loading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Filter States
  const [selectedLines, setSelectedLines] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  // Generate Line Options (1-30)
  const lineOptions = useMemo(
    () => Array.from({ length: 30 }, (_, i) => String(i + 1)),
    [],
  );

  // Get Distinct Worker IDs from data
  const workerOptions = useMemo(
    () => [...new Set(data.map((d) => d.EmpID))].sort(),
    [data],
  );

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter((worker) => {
      const lineMatch =
        selectedLines.length === 0 ||
        selectedLines.includes(String(worker.LineNo));
      const workerMatch =
        selectedWorkers.length === 0 || selectedWorkers.includes(worker.EmpID);
      return lineMatch && workerMatch;
    });
  }, [data, selectedLines, selectedWorkers]);

  // Generate filter summary text for title
  const filterSummaryText = useMemo(() => {
    const parts = [];

    if (selectedLines.length > 0) {
      const lineText =
        selectedLines.length <= 3
          ? selectedLines.join(", ")
          : `${selectedLines.slice(0, 3).join(", ")}... +${selectedLines.length - 3}`;
      parts.push(`Line: ${lineText}`);
    }

    if (selectedWorkers.length > 0) {
      const workerText =
        selectedWorkers.length <= 2
          ? selectedWorkers.join(", ")
          : `${selectedWorkers.slice(0, 2).join(", ")}... +${selectedWorkers.length - 2}`;
      parts.push(`Worker: ${workerText}`);
    }

    return parts.length > 0 ? parts.join(" | ") : "";
  }, [selectedLines, selectedWorkers]);

  // Check if any filter is active
  const hasActiveFilters =
    selectedLines.length > 0 || selectedWorkers.length > 0;

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedLines([]);
    setSelectedWorkers([]);
    setCurrentPage(1);
  };

  // Calculate pagination
  // Use filteredData instead of data for pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // Auto-rotation effect
  useEffect(() => {
    if (isPaused || totalPages <= 1 || loading) {
      setProgress(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 100 / (AUTO_ROTATE_INTERVAL / 100);
      });
    }, 100);

    const rotateInterval = setInterval(() => {
      setCurrentPage((prev) => (prev >= totalPages ? 1 : prev + 1));
      setProgress(0);
    }, AUTO_ROTATE_INTERVAL);

    return () => {
      clearInterval(progressInterval);
      clearInterval(rotateInterval);
    };
  }, [isPaused, totalPages, loading]);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
    setProgress(0);
  }, [data.length]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setProgress(0);
  }, [selectedLines, selectedWorkers]);

  // Navigation handlers
  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => (prev <= 1 ? totalPages : prev - 1));
    setProgress(0);
  }, [totalPages]);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => (prev >= totalPages ? 1 : prev + 1));
    setProgress(0);
  }, [totalPages]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    setProgress(0);
  }, []);

  // Use filteredData for stats
  const totalDefects = useMemo(
    () => filteredData.reduce((sum, d) => sum + (d.TotalDefects || 0), 0),
    [filteredData],
  );
  const maxDefects = useMemo(
    () => Math.max(...filteredData.map((d) => d.TotalDefects || 0), 1),
    [filteredData],
  );

  const highRiskThreshold = maxDefects * 0.7;

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col gap-3">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/25">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                {/* Title with filter summary */}
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                  Defects by Responsible Worker
                  {hasActiveFilters && (
                    <span className="ml-2 text-xs font-semibold text-pink-500 dark:text-pink-400">
                      ({filterSummaryText})
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {filteredData.length > 0
                    ? `${filteredData.length} workers · ${totalDefects.toLocaleString()} total defects`
                    : "Worker defects breakdown"}
                  {hasActiveFilters && data.length !== filteredData.length && (
                    <span className="ml-1 text-pink-500">
                      (showing {filteredData.length} of {data.length})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Page Info */}
              {totalPages > 1 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {currentPage} / {totalPages}
                </span>
              )}

              {/* Pause/Play Button */}
              {totalPages > 1 && (
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`p-2 rounded-lg transition-all ${
                    isPaused
                      ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  title={
                    isPaused ? "Resume auto-rotation" : "Pause auto-rotation"
                  }
                >
                  {isPaused ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Navigation Buttons */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevPage}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextPage}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Filter className="w-3.5 h-3.5" />
              <span className="font-medium">Filters:</span>
            </div>

            {/* Line No Filter */}
            <MultiSelectDropdown
              label="Line No"
              options={lineOptions}
              selected={selectedLines}
              onChange={setSelectedLines}
              placeholder="All Lines"
              icon={MapPin}
            />

            {/* Worker ID Filter */}
            <MultiSelectDropdown
              label="Worker ID"
              options={workerOptions}
              selected={selectedWorkers}
              onChange={setSelectedWorkers}
              placeholder="All Workers"
              icon={User}
              searchable={true}
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
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading && data.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Cards Grid - 3x3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedData.map((worker) => (
                <WorkerCard
                  key={`${worker.EmpID}-${worker.StationID}-${worker.LineNo}`}
                  worker={worker}
                  isHighRisk={worker.TotalDefects >= highRiskThreshold}
                />
              ))}
            </div>

            {/* Pagination Dots */}
            <PaginationDots
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* Footer Summary */}
      {!loading && filteredData.length > 0 && (
        <div className="px-5 py-3 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-t border-pink-100 dark:border-pink-800/30">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-pink-500" />
              <span className="text-pink-700 dark:text-pink-300">
                <span className="font-bold">Top Offender:</span>{" "}
                {filteredData[0]?.EmpName || filteredData[0]?.EmpID} @{" "}
                <span className="font-mono">[{filteredData[0]?.LineNo}]</span>{" "}
                St:
                {filteredData[0]?.StationID}
              </span>
            </div>
            <div className="flex items-center gap-3 text-pink-500 dark:text-pink-400/70">
              <span className="font-semibold">
                {filteredData[0]?.TotalDefects} defects (
                {((filteredData[0]?.TotalDefects / totalDefects) * 100).toFixed(
                  1,
                )}
                %)
              </span>
              {totalPages > 1 && (
                <>
                  <span className="text-pink-300 dark:text-pink-700">|</span>
                  <span>Auto-rotate: {isPaused ? "Paused" : "Every 10s"}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auto-rotate Progress Bar */}
      <AutoRotateProgress progress={progress} isPaused={isPaused} />
    </div>
  );
};

export default DefectsByWorkerTable;
