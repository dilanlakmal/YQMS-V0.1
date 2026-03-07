import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FileText,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Layers,
  AlertTriangle,
  BarChart3,
  Package,
  Users,
  Loader2,
  ShieldCheck,
  Ruler,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString();

const passColor = (rate) => {
  const v = parseFloat(rate);
  if (v >= 90)
    return {
      text: "text-emerald-600 dark:text-emerald-400",
      bar: "bg-emerald-500",
    };
  if (v >= 75)
    return { text: "text-amber-500  dark:text-amber-400", bar: "bg-amber-500" };
  return { text: "text-rose-600   dark:text-rose-400", bar: "bg-rose-500" };
};

// ─── Sub-label pill ───────────────────────────────────────────────────────────
const Pill = ({ label, value, color }) => (
  <span
    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${color}`}
  >
    {label}: {value}
  </span>
);

// ─── Thin progress bar ────────────────────────────────────────────────────────
const MiniBar = ({ pct, color }) => (
  <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1.5">
    <div
      className={`h-full rounded-full transition-all duration-700 ${color}`}
      style={{ width: `${Math.min(parseFloat(pct) || 0, 100)}%` }}
    />
  </div>
);

// ─── Individual Card ──────────────────────────────────────────────────────────
const Card = ({
  icon: Icon,
  iconBg,
  iconColor,
  accent,
  label,
  value,
  valueColor,
  children,
  loading,
}) => (
  <div
    className={`
      relative flex flex-col gap-2 p-4 rounded-2xl border overflow-hidden
      bg-white dark:bg-gray-800
      border-gray-200 dark:border-gray-700
      shadow-sm hover:shadow-md
      transition-all duration-300 hover:-translate-y-0.5
      min-w-0
    `}
  >
    {/* Decorative corner glow */}
    <div
      className={`absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 ${accent}`}
    />

    {/* Header row */}
    <div className="flex items-center justify-between relative z-10">
      <div className={`p-2 rounded-xl ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate ml-2 text-right leading-tight">
        {label}
      </span>
    </div>

    {/* Main value */}
    <div className="relative z-10">
      {loading ? (
        <div className="h-8 flex items-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
        </div>
      ) : (
        <p
          className={`text-2xl font-black leading-none tracking-tight ${valueColor}`}
        >
          {value}
        </p>
      )}
    </div>

    {/* Sub-content slot */}
    {!loading && children && (
      <div className="relative z-10 flex flex-wrap gap-1 mt-auto">
        {children}
      </div>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const TopCardVisualSummary = ({
  startDate,
  endDate,
  reportType,
  buyer,
  qaFilter,
  orderFilter,
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!startDate || !endDate) return;
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-dashboard/top-card-summary`,
          {
            params: {
              startDate,
              endDate,
              reportType,
              buyer,
              qaFilter,
              orderFilter,
            },
            signal: controller.signal,
          },
        );
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("Error fetching top card summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [startDate, endDate, reportType, buyer, qaFilter, orderFilter]);

  const d = data || {};

  // Derived pass-rate colours
  const overallC = passColor(d.passRate || 0);
  const defectRateC = passColor(100 - parseFloat(d.defectRate || 0)); // invert: lower defect = better

  const cards = [
    // ── 1. Total Reports ──────────────────────────────────────────────────
    {
      icon: FileText,
      iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      accent: "bg-indigo-400",
      label: "Total Reports",
      value: fmt(d.totalReports),
      valueColor: "text-indigo-700 dark:text-indigo-300",
      sub: null,
    },

    // ── 2. Total Pass Reports ─────────────────────────────────────────────
    {
      icon: CheckCircle2,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      accent: "bg-emerald-400",
      label: "Total Pass",
      value: fmt(d.totalPassReports),
      valueColor: "text-emerald-700 dark:text-emerald-300",
      sub: (
        <>
          <Pill
            label="Defect ✓"
            value={fmt(d.defectPassCount)}
            color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
          />
          <Pill
            label="Meas. ✓"
            value={fmt(d.measurementPassCount)}
            color="bg-teal-50    dark:bg-teal-900/30    text-teal-700    dark:text-teal-300"
          />
        </>
      ),
    },

    // ── 3. Total Fail Reports ─────────────────────────────────────────────
    {
      icon: XCircle,
      iconBg: "bg-rose-100 dark:bg-rose-900/40",
      iconColor: "text-rose-600 dark:text-rose-400",
      accent: "bg-rose-400",
      label: "Total Fail",
      value: fmt(d.totalFailReports),
      valueColor: "text-rose-700 dark:text-rose-300",
      sub: (
        <>
          <Pill
            label="Defect ✗"
            value={fmt(d.defectFailCount)}
            color="bg-rose-50   dark:bg-rose-900/30   text-rose-700   dark:text-rose-300"
          />
          <Pill
            label="Meas. ✗"
            value={fmt(d.measurementFailCount)}
            color="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
          />
        </>
      ),
    },

    // ── 4. Pass Rate ──────────────────────────────────────────────────────
    {
      icon: TrendingUp,
      iconBg: "bg-sky-100 dark:bg-sky-900/40",
      iconColor: "text-sky-600 dark:text-sky-400",
      accent: "bg-sky-400",
      label: "Pass Rate",
      value: `${d.passRate ?? "0.00"}%`,
      valueColor: overallC.text,
      sub: (
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between text-[9px] font-bold text-gray-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5" /> Defect{" "}
              {d.defectPassRate ?? "0.00"}%
            </span>
            <span className="flex items-center gap-1">
              <Ruler className="w-2.5 h-2.5" /> Meas.{" "}
              {d.measurementPassRate ?? "0.00"}%
            </span>
          </div>
          <MiniBar pct={d.passRate} color={overallC.bar} />
        </div>
      ),
    },

    // ── 5. Total Sample Qty ───────────────────────────────────────────────
    {
      icon: Layers,
      iconBg: "bg-violet-100 dark:bg-violet-900/40",
      iconColor: "text-violet-600 dark:text-violet-400",
      accent: "bg-violet-400",
      label: "Total Sample",
      value: fmt(d.totalSample),
      valueColor: "text-violet-700 dark:text-violet-300",
      sub: null,
    },

    // ── 6. Total Defect Qty ───────────────────────────────────────────────
    {
      icon: AlertTriangle,
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      accent: "bg-amber-400",
      label: "Total Defects",
      value: fmt(d.totalDefects),
      valueColor: "text-amber-700 dark:text-amber-300",
      sub: (
        <>
          <Pill
            label="Min"
            value={fmt(d.totalMinor)}
            color="bg-green-50  dark:bg-green-900/30  text-green-700  dark:text-green-300"
          />
          <Pill
            label="Maj"
            value={fmt(d.totalMajor)}
            color="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
          />
          <Pill
            label="Crit"
            value={fmt(d.totalCritical)}
            color="bg-red-50    dark:bg-red-900/30    text-red-700    dark:text-red-300"
          />
        </>
      ),
    },

    // ── 7. Defect Rate ────────────────────────────────────────────────────
    {
      icon: BarChart3,
      iconBg: "bg-red-100 dark:bg-red-900/40",
      iconColor: "text-red-600 dark:text-red-400",
      accent: "bg-red-400",
      label: "Defect Rate",
      value: `${d.defectRate ?? "0.00"}%`,
      valueColor:
        parseFloat(d.defectRate || 0) === 0
          ? "text-emerald-600 dark:text-emerald-400"
          : parseFloat(d.defectRate || 0) < 2.5
            ? "text-indigo-600 dark:text-indigo-400"
            : parseFloat(d.defectRate || 0) < 5
              ? "text-amber-600 dark:text-amber-400"
              : "text-red-600 dark:text-red-400",
      sub: (
        <div className="w-full">
          <div className="flex justify-between text-[9px] font-medium text-gray-400 mb-0.5">
            <span>Defects / Sample</span>
            <span>
              {fmt(d.totalDefects)} / {fmt(d.totalSample)}
            </span>
          </div>
          <MiniBar
            pct={Math.min(parseFloat(d.defectRate || 0) * 5, 100)}
            color={
              parseFloat(d.defectRate || 0) < 2.5
                ? "bg-indigo-500"
                : parseFloat(d.defectRate || 0) < 5
                  ? "bg-amber-500"
                  : "bg-red-500"
            }
          />
        </div>
      ),
    },

    // ── 8. Total Orders ───────────────────────────────────────────────────
    {
      icon: Package,
      iconBg: "bg-purple-100 dark:bg-purple-900/40",
      iconColor: "text-purple-600 dark:text-purple-400",
      accent: "bg-purple-400",
      label: "Total Orders",
      value: fmt(d.totalOrders),
      valueColor: "text-purple-700 dark:text-purple-300",
      sub: null,
    },

    // ── 9. Total QAs ──────────────────────────────────────────────────────
    {
      icon: Users,
      iconBg: "bg-cyan-100 dark:bg-cyan-900/40",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      accent: "bg-cyan-400",
      label: "Total QAs",
      value: fmt(d.totalQAs),
      valueColor: "text-cyan-700 dark:text-cyan-300",
      sub: null,
    },
  ];

  return (
    <div
      className="
        grid gap-3
        grid-cols-2
        sm:grid-cols-3
        md:grid-cols-4
        lg:grid-cols-5
        xl:grid-cols-9
      "
    >
      {cards.map((c, idx) => (
        <Card
          key={idx}
          icon={c.icon}
          iconBg={c.iconBg}
          iconColor={c.iconColor}
          accent={c.accent}
          label={c.label}
          value={c.value}
          valueColor={c.valueColor}
          loading={loading}
        >
          {c.sub}
        </Card>
      ))}
    </div>
  );
};

export default TopCardVisualSummary;
