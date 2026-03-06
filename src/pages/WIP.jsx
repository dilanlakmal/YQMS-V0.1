import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Activity,
  Layers,
  ClipboardCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Zap,
  Timer,
  Users,
} from "lucide-react";
import { API_BASE_URL } from "../../config";

// Import Components
import {
  StatCard,
  StatCardWithBreakdown,
  ProductionByLineChart,
  OutputByMONoChart,
  OutputByBuyerTable,
  //OutputByInspectorChart,
  OutputByInspectorCards,
} from "../components/inspection/WIP";

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const TASK_CONFIG = {
  38: {
    accent: "from-indigo-500 to-violet-600",
  },
  39: {
    accent: "from-emerald-500 to-teal-600",
  },
};

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
const WIP = () => {
  // Stats State
  const [stats, setStats] = useState({
    Task38Qty: 0,
    Task39Qty: 0,
    TotalStyles: 0,
    TotalOutput: 0,
    Task38SAM: 0,
    Task39SAM: 0,
    TotalSAM: 0,
    Task38Inspectors: 0,
    Task39Inspectors: 0,
    TotalInspectors: 0,
  });

  // Chart Data States
  const [lineChartData, setLineChartData] = useState([]);
  const [moData, setMoData] = useState([]);
  const [buyerData, setBuyerData] = useState([]);
  const [inspectorData, setInspectorData] = useState([]);

  // Filter States
  const [selectedLineTask, setSelectedLineTask] = useState("38");
  const [selectedInspectorTask, setSelectedInspectorTask] = useState("all");

  // UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState(null);

  const task = TASK_CONFIG[selectedLineTask];

  // ─────────────────────────────────────────────
  // API FETCH FUNCTIONS
  // ─────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/realtime-sunrise/wip-stats`,
      );
      if (data && typeof data === "object") {
        setStats(data);
      }
    } catch (err) {
      console.error("Stats fetch error:", err);
      throw err;
    }
  };

  const fetchLineChartData = async (taskNo) => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/realtime-sunrise/wip-chart?taskNo=${taskNo}`,
      );
      if (Array.isArray(data)) {
        const sorted = data.sort((a, b) =>
          a.LineNo.localeCompare(b.LineNo, undefined, {
            numeric: true,
            sensitivity: "base",
          }),
        );
        setLineChartData(sorted);
      } else {
        setLineChartData([]);
      }
    } catch (err) {
      console.error("Line chart fetch error:", err);
      setLineChartData([]);
    }
  };

  const fetchMOData = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/realtime-sunrise/output-by-mono`,
      );
      if (Array.isArray(data)) {
        setMoData(data);
      } else {
        setMoData([]);
      }
    } catch (err) {
      console.error("MO data fetch error:", err);
      setMoData([]);
    }
  };

  const fetchBuyerData = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/realtime-sunrise/output-by-buyer`,
      );
      if (Array.isArray(data)) {
        setBuyerData(data);
      } else {
        setBuyerData([]);
      }
    } catch (err) {
      console.error("Buyer data fetch error:", err);
      setBuyerData([]);
    }
  };

  const fetchInspectorData = async (taskNo) => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/realtime-sunrise/output-by-inspector?taskNo=${taskNo}`,
      );
      if (Array.isArray(data)) {
        setInspectorData(data);
      } else {
        setInspectorData([]);
      }
    } catch (err) {
      console.error("Inspector data fetch error:", err);
      setInspectorData([]);
    }
  };

  // ─────────────────────────────────────────────
  // LOAD ALL DATA
  // ─────────────────────────────────────────────
  const loadAllData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        await Promise.allSettled([
          fetchStats(),
          fetchLineChartData(selectedLineTask),
          fetchMOData(),
          fetchBuyerData(),
          fetchInspectorData(selectedInspectorTask),
        ]);

        setLastUpdated(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
      } catch (err) {
        setError("Failed to load some data. Please try refreshing.");
      }

      setLoading(false);
      setRefreshing(false);
    },
    [selectedLineTask, selectedInspectorTask],
  );

  // ─────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────
  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => loadAllData(true), 60_000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  // Refetch line chart when task changes
  useEffect(() => {
    if (!loading) {
      fetchLineChartData(selectedLineTask);
    }
  }, [selectedLineTask]);

  // Refetch inspector data when task changes
  useEffect(() => {
    if (!loading) {
      fetchInspectorData(selectedInspectorTask);
    }
  }, [selectedInspectorTask]);

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300">
      <div className="max-w-screen-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`p-2 rounded-xl bg-gradient-to-br ${task.accent} shadow-lg`}
              >
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                WIP #1 | Daily Production Dashboard
                <span className="ml-2 text-sm font-semibold text-gray-400 dark:text-gray-500 tracking-normal">
                  / Real-Time
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2 ml-12">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                Live · Sewing Output ·{" "}
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

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Output"
            value={stats?.TotalOutput}
            icon={Zap}
            gradient="from-fuchsia-500 to-pink-600"
            loading={loading}
            subtitle="Max of Inside/Outside output"
          />
          <StatCard
            title="QC1 · Inside Output"
            value={stats?.Task38Qty}
            icon={ClipboardCheck}
            gradient="from-indigo-500 to-violet-600"
            loading={loading}
            subtitle="Inside Checking QC1"
          />
          <StatCard
            title="QC1 · Outside Output"
            value={stats?.Task39Qty}
            icon={CheckCircle2}
            gradient="from-emerald-500 to-teal-600"
            loading={loading}
            subtitle="Outside Checking QC1"
          />
          <StatCard
            title="Total Active Styles"
            value={stats?.TotalStyles}
            icon={Layers}
            gradient="from-amber-500 to-orange-600"
            loading={loading}
            subtitle="Running on floor today"
          />
          <StatCardWithBreakdown
            title="Total SAM"
            value={stats?.TotalSAM}
            icon={Timer}
            gradient="from-cyan-500 to-blue-600"
            loading={loading}
            subtitle="Standard Allowed Minutes"
            insideValue={stats?.Task38SAM}
            outsideValue={stats?.Task39SAM}
            unit="mins"
          />
          <StatCardWithBreakdown
            title="Total QC Inspectors"
            value={stats?.TotalInspectors}
            icon={Users}
            gradient="from-orange-500 to-red-600"
            loading={loading}
            subtitle="Active inspectors today"
            insideValue={stats?.Task38Inspectors}
            outsideValue={stats?.Task39Inspectors}
            unit="persons"
          />
        </div>

        {/* ── PRODUCTION BY LINE CHART ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ProductionByLineChart
            chartData={lineChartData}
            selectedTask={selectedLineTask}
            onTaskChange={setSelectedLineTask}
            loading={loading}
          />
          <OutputByBuyerTable data={buyerData} loading={loading} />
        </div>

        {/* ── TWO COLUMN LAYOUT: MO Chart + Buyer Table ── */}
        <div className="grid grid-cols-1 gap-6">
          <OutputByMONoChart data={moData} loading={loading} />
        </div>

        {/* ── INSPECTOR CHART ── */}
        <OutputByInspectorCards
          data={inspectorData}
          loading={loading}
          selectedTask={selectedInspectorTask}
          onTaskChange={setSelectedInspectorTask}
        />
      </div>
    </div>
  );
};

export default WIP;