import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Activity,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Package,
  Zap,
  Percent,
  Users,
  Layers,
  Clock,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";
import { API_BASE_URL } from "../../config";
import {
  DefectsByLineChart,
  DefectsByTypeChart,
  DefectsByMONoTable,
  DefectsByWorkerTable,
} from "../components/inspection/WIP";

// ─────────────────────────────────────────────
// STAT CARD COMPONENT (Light/Dark Theme)
// ─────────────────────────────────────────────
const StatCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  loading,
  subtitle,
  danger = false,
}) => (
  <div
    className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group ${
      danger
        ? "border-red-200 dark:border-red-800"
        : "border-gray-100 dark:border-gray-700"
    }`}
  >
    {/* Gradient accent strip */}
    <div
      className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}
    />

    <div className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            {title}
          </p>
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 w-24 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <h3
                className={`text-2xl font-black tabular-nums tracking-tight ${
                  danger
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {typeof value === "number" ? value.toLocaleString() : value}
              </h3>
              {subtitle && (
                <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>
        <div
          className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300 ml-3 flex-shrink-0`}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// DEFECT RATE CARD
// ─────────────────────────────────────────────
const DefectRateCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  loading,
  subtitle,
}) => {
  const getRateColor = (rate) => {
    if (rate < 3)
      return {
        color: "#22C55E",
        label: "Good",
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
      };
    if (rate <= 5)
      return {
        color: "#F59E0B",
        label: "Warning",
        bg: "bg-amber-100 dark:bg-amber-900/30",
      };
    return {
      color: "#EF4444",
      label: "Critical",
      bg: "bg-red-100 dark:bg-red-900/30",
    };
  };

  const rateInfo = getRateColor(value);

  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}
      />

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              {title}
            </p>
            {loading ? (
              <div className="h-8 w-24 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h3
                  className="text-2xl font-black tabular-nums"
                  style={{ color: rateInfo.color }}
                >
                  {value.toFixed(2)}%
                </h3>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${rateInfo.bg}`}
                  style={{ color: rateInfo.color }}
                >
                  {rateInfo.label}
                </span>
              </div>
            )}
            {subtitle && !loading && (
              <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300 ml-3 flex-shrink-0`}
          >
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// OUTPUT CARD WITH BREAKDOWN
// ─────────────────────────────────────────────
const OutputBreakdownCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  loading,
  insideValue,
  outsideValue,
}) => (
  <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
    <div
      className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}
    />

    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-28 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          ) : (
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
              {value?.toLocaleString()}
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500 ml-1">
                pcs
              </span>
            </h3>
          )}
        </div>
        <div
          className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300 ml-3 flex-shrink-0`}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Inside/Outside */}
      {loading ? (
        <div className="flex gap-2">
          <div className="flex-1 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="flex-1 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 py-2 border border-indigo-100 dark:border-indigo-800/30">
            <p className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase">
              Inside
            </p>
            <p className="text-sm font-black text-indigo-700 dark:text-indigo-300 tabular-nums">
              {insideValue?.toLocaleString()}
            </p>
          </div>
          <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2 border border-emerald-100 dark:border-emerald-800/30">
            <p className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 uppercase">
              Outside
            </p>
            <p className="text-sm font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
              {outsideValue?.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
const WIPSewingDefects = () => {
  // Stats State
  const [stats, setStats] = useState({
    Task38Qty: 0,
    Task39Qty: 0,
    TotalOutput: 0,
    TotalDefects: 0,
    DefectRate: 0,
    TotalQCInspectors: 0,
    TotalLines: 0,
    TotalStyles: 0,
    TotalDefectTypes: 0,
  });

  // Chart Data States
  const [defectsByLine, setDefectsByLine] = useState([]);
  const [defectsByType, setDefectsByType] = useState([]);
  const [defectsByMONo, setDefectsByMONo] = useState([]);
  const [defectsByWorker, setDefectsByWorker] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState(null);

  // ─────────────────────────────────────────────
  // FETCH FUNCTIONS
  // ─────────────────────────────────────────────
  const fetchStats = async () => {
    const { data } = await axios.get(
      `${API_BASE_URL}/api/realtime-sunrise/defects-stats`,
    );
    if (data && typeof data === "object") setStats(data);
  };

  const fetchDefectsByLine = async () => {
    const { data } = await axios.get(
      `${API_BASE_URL}/api/realtime-sunrise/defects-by-line`,
    );
    if (Array.isArray(data)) setDefectsByLine(data);
  };

  const fetchDefectsByType = async () => {
    const { data } = await axios.get(
      `${API_BASE_URL}/api/realtime-sunrise/defects-by-type`,
    );
    if (Array.isArray(data)) setDefectsByType(data);
  };

  const fetchDefectsByMONo = async () => {
    const { data } = await axios.get(
      `${API_BASE_URL}/api/realtime-sunrise/defects-by-mono`,
    );
    if (Array.isArray(data)) setDefectsByMONo(data);
  };

  const fetchDefectsByWorker = async () => {
    const { data } = await axios.get(
      `${API_BASE_URL}/api/realtime-sunrise/defects-by-worker`,
    );
    if (Array.isArray(data)) setDefectsByWorker(data);
  };

  // ─────────────────────────────────────────────
  // LOAD ALL DATA
  // ─────────────────────────────────────────────
  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      await Promise.allSettled([
        fetchStats(),
        fetchDefectsByLine(),
        fetchDefectsByType(),
        fetchDefectsByMONo(),
        fetchDefectsByWorker(),
      ]);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    } catch (err) {
      setError("Failed to load defects data. Please try refreshing.");
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  // ─────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────
  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => loadAllData(true), 60_000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/25">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                WIP #2 | Sewing Defects Dashboard
                <span className="ml-2 text-sm font-semibold text-gray-400 dark:text-gray-500 tracking-normal">
                  / Real-Time QC1
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2 ml-12">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                Live · Sewing Defects ·{" "}
                {lastUpdated ? `Updated ${lastUpdated}` : "Initializing…"}
              </span>
            </div>
          </div>

          <button
            onClick={() => loadAllData(true)}
            disabled={refreshing || loading}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── KPI CARDS - SINGLE ROW ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          <OutputBreakdownCard
            title="Total Output"
            value={stats.TotalOutput}
            icon={Zap}
            gradient="from-emerald-500 to-teal-600"
            loading={loading}
            insideValue={stats.Task38Qty}
            outsideValue={stats.Task39Qty}
          />
          <StatCard
            title="Total Defects"
            value={stats.TotalDefects}
            icon={AlertTriangle}
            gradient="from-red-500 to-rose-600"
            loading={loading}
            subtitle="Rework items"
            danger={stats.TotalDefects > 100}
          />
          <DefectRateCard
            title="Defect Rate"
            value={stats.DefectRate}
            icon={Percent}
            gradient="from-orange-500 to-amber-600"
            loading={loading}
            subtitle="Defects / Output"
          />
          <StatCard
            title="QC Inspectors"
            value={stats.TotalQCInspectors}
            icon={Users}
            gradient="from-blue-500 to-cyan-600"
            loading={loading}
            subtitle="Finding defects"
          />
          <StatCard
            title="Lines Affected"
            value={stats.TotalLines}
            icon={Activity}
            gradient="from-violet-500 to-purple-600"
            loading={loading}
            subtitle="With defects"
          />
          <StatCard
            title="Styles Affected"
            value={stats.TotalStyles}
            icon={Package}
            gradient="from-fuchsia-500 to-pink-600"
            loading={loading}
            subtitle="MO numbers"
          />
          <StatCard
            title="Defect Types"
            value={stats.TotalDefectTypes}
            icon={Layers}
            gradient="from-amber-500 to-orange-600"
            loading={loading}
            subtitle="Unique codes"
          />
          <StatCard
            title="Inside Output"
            value={stats.Task38Qty}
            icon={ClipboardCheck}
            gradient="from-indigo-500 to-violet-600"
            loading={loading}
            subtitle="Task 38"
          />
        </div>

        {/* ── CHARTS ROW 1: Line Chart + Type Chart ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <DefectsByLineChart data={defectsByLine} loading={loading} />
          <DefectsByTypeChart
            data={defectsByType}
            loading={loading}
            totalOutput={stats.TotalOutput}
          />
        </div>

        {/* ── CHARTS ROW 2: MO Table + Worker Table ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <DefectsByMONoTable data={defectsByMONo} loading={loading} />
          <DefectsByWorkerTable data={defectsByWorker} loading={loading} />
        </div>

        {/* ── FOOTER ── */}
        <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100 dark:border-gray-800">
          <Clock className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Auto-refresh every 60 seconds
          </span>
        </div>
      </div>
    </div>
  );
};

export default WIPSewingDefects;
