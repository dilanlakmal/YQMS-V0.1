import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Loader2,
  Ruler,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Layers,
  Hash,
  ClipboardCheck,
  BarChart3,
  Users,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, accent }) => {
  const accents = {
    indigo: {
      bg: "bg-indigo-50  dark:bg-indigo-900/20",
      ring: "ring-indigo-200 dark:ring-indigo-700",
      text: "text-indigo-700 dark:text-indigo-300",
      icon: "bg-indigo-100  dark:bg-indigo-900/40  text-indigo-600  dark:text-indigo-400",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      ring: "ring-emerald-200 dark:ring-emerald-700",
      text: "text-emerald-700 dark:text-emerald-300",
      icon: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    },
    rose: {
      bg: "bg-rose-50    dark:bg-rose-900/20",
      ring: "ring-rose-200    dark:ring-rose-700",
      text: "text-rose-700    dark:text-rose-300",
      icon: "bg-rose-100    dark:bg-rose-900/40    text-rose-600    dark:text-rose-400",
    },
    amber: {
      bg: "bg-amber-50   dark:bg-amber-900/20",
      ring: "ring-amber-200   dark:ring-amber-700",
      text: "text-amber-700   dark:text-amber-300",
      icon: "bg-amber-100   dark:bg-amber-900/40   text-amber-600   dark:text-amber-400",
    },
    sky: {
      bg: "bg-sky-50     dark:bg-sky-900/20",
      ring: "ring-sky-200     dark:ring-sky-700",
      text: "text-sky-700     dark:text-sky-300",
      icon: "bg-sky-100     dark:bg-sky-900/40     text-sky-600     dark:text-sky-400",
    },
    violet: {
      bg: "bg-violet-50  dark:bg-violet-900/20",
      ring: "ring-violet-200  dark:ring-violet-700",
      text: "text-violet-700  dark:text-violet-300",
      icon: "bg-violet-100  dark:bg-violet-900/40  text-violet-600  dark:text-violet-400",
    },
    gray: {
      bg: "bg-gray-50    dark:bg-gray-700/30",
      ring: "ring-gray-200    dark:ring-gray-600",
      text: "text-gray-700    dark:text-gray-200",
      icon: "bg-gray-100    dark:bg-gray-700        text-gray-500    dark:text-gray-400",
    },
  };
  const c = accents[accent] || accents.gray;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl ring-1 ${c.bg} ${c.ring} transition-transform hover:-translate-y-0.5 duration-200`}
    >
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${c.icon}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">
          {label}
        </p>
        <p className={`text-xl font-black leading-tight ${c.text}`}>{value}</p>
        {sub && (
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
};

// ─── Pass Rate Ring ───────────────────────────────────────────────────────────
const PassRateRing = ({ rate, passCount, failCount, total }) => {
  const pct = parseFloat(rate) || 0;
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  const color = pct >= 90 ? "#10b981" : pct >= 75 ? "#f59e0b" : "#ef4444";
  const label =
    pct >= 90
      ? "Excellent"
      : pct >= 75
        ? "Good"
        : pct < 60
          ? "Critical"
          : "Fair";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-gray-800 dark:text-white leading-none">
            {rate}%
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
            Pass Rate
          </span>
        </div>
      </div>
      <span
        className="text-[11px] font-bold px-3 py-0.5 rounded-full"
        style={{ background: `${color}20`, color }}
      >
        {label}
      </span>
      <div className="flex gap-3 text-[10px] font-bold text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Pass: {passCount}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
          Fail: {failCount}
        </span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ReportMeasurementResultDashboard = ({
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
          `${API_BASE_URL}/api/fincheck-dashboard/measurement-results`,
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
        if (axios.isCancel(err)) return; // ignore — superseded by a newer fetch
        console.error("Error fetching measurement results:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Abort any in-flight request when filters change before it completes
    return () => controller.abort();
  }, [startDate, endDate, reportType, buyer, qaFilter, orderFilter]);

  const s = data?.summary;
  const byType = data?.byReportType || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col animate-fadeIn">
      {/* ── Header ── */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-3">
        <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-teal-600 dark:text-teal-400">
          <Ruler className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white text-lg leading-tight">
            Measurement Result Summary
          </h3>
          <p className="text-xs text-gray-500">
            Group-level pass/fail analysis across all measurement sessions
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-teal-500" />
            <p className="text-sm">Calculating Measurement Results...</p>
          </div>
        ) : !s ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-300">
            <AlertTriangle className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">No measurement data found</p>
          </div>
        ) : (
          <div className="p-5 space-y-6">
            {/* ── Top Row: Ring + Key Stats ── */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Pass Rate Ring */}
              <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center min-w-[160px]">
                <PassRateRing
                  rate={s.passRate}
                  passCount={s.totalPassReports}
                  failCount={s.totalFailReports}
                  total={s.totalReports}
                />
              </div>

              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3">
                <StatCard
                  icon={ClipboardCheck}
                  label="Total Reports"
                  value={s.totalReports}
                  accent="indigo"
                />
                <StatCard
                  icon={Layers}
                  label="Total Meas. Groups"
                  value={s.totalGroups.toLocaleString()}
                  accent="sky"
                />
                <StatCard
                  icon={Hash}
                  label="Total Config Groups"
                  value={s.totalConfigGroups.toLocaleString()}
                  accent="violet"
                />
                <StatCard
                  icon={BarChart3}
                  label="Total Sizes"
                  value={s.totalSizes.toLocaleString()}
                  accent="amber"
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Group Pass"
                  value={s.totalGroupPass.toLocaleString()}
                  sub={`of ${s.totalGroups} groups`}
                  accent="emerald"
                />
                <StatCard
                  icon={XCircle}
                  label="Group Fail"
                  value={s.totalGroupFail.toLocaleString()}
                  sub={`of ${s.totalGroups} groups`}
                  accent="rose"
                />
              </div>
            </div>

            {/* ── Checking Pieces Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">
                    All-Point Checking Pcs
                  </p>
                  <p className="text-lg font-black text-blue-700 dark:text-blue-300">
                    {s.totalAllQty.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">
                    Critical-Point Checking Pcs
                  </p>
                  <p className="text-lg font-black text-purple-700 dark:text-purple-300">
                    {s.totalCriticalQty.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">
                    Total Checking Pieces
                  </p>
                  <p className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                    {s.totalCheckingPieces.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* ── By Report Type Table ── */}
            {byType.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Breakdown by Report Type
                </p>
                <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5 border-r border-gray-200 dark:border-gray-700">
                          Report Type
                        </th>
                        <th className="px-3 py-2.5 text-center border-r border-gray-200 dark:border-gray-700 w-20">
                          Reports
                        </th>
                        <th className="px-3 py-2.5 text-center border-r border-gray-200 dark:border-gray-700 w-20">
                          Groups
                        </th>
                        <th className="px-3 py-2.5 text-center border-r border-gray-200 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/10 w-20">
                          Grp Pass
                        </th>
                        <th className="px-3 py-2.5 text-center border-r border-gray-200 dark:border-gray-700 bg-rose-50 dark:bg-rose-900/10 w-20">
                          Grp Fail
                        </th>
                        <th className="px-3 py-2.5 text-center border-r border-gray-200 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/10 w-20">
                          Pass
                        </th>
                        <th className="px-3 py-2.5 text-center border-r border-gray-200 dark:border-gray-700 bg-rose-50 dark:bg-rose-900/10 w-20">
                          Fail
                        </th>
                        <th className="px-3 py-2.5 text-center w-24">
                          Pass Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {byType.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors"
                        >
                          <td className="px-3 py-2.5 font-bold text-gray-700 dark:text-gray-200 border-r border-gray-100 dark:border-gray-700">
                            {row.reportType}
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-gray-600 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700">
                            {row.totalReports}
                          </td>
                          <td className="px-3 py-2.5 text-center text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-gray-700">
                            {row.totalGroups}
                          </td>
                          <td className="px-3 py-2.5 text-center bg-emerald-50/50 dark:bg-emerald-900/10 font-bold text-emerald-600 border-r border-gray-100 dark:border-gray-700">
                            {row.groupPass}
                          </td>
                          <td className="px-3 py-2.5 text-center bg-rose-50/50 dark:bg-rose-900/10 font-bold text-rose-600 border-r border-gray-100 dark:border-gray-700">
                            {row.groupFail}
                          </td>
                          <td className="px-3 py-2.5 text-center bg-emerald-50/30 dark:bg-emerald-900/10 border-r border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-center gap-1 font-bold text-emerald-600">
                              <CheckCircle2 className="w-3 h-3" />
                              {row.passReports}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center bg-rose-50/30 dark:bg-rose-900/10 border-r border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-center gap-1 font-bold text-rose-600">
                              {row.failReports > 0 && (
                                <XCircle className="w-3 h-3" />
                              )}
                              {row.failReports}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex flex-col items-center">
                              <span
                                className={`text-xs font-black ${
                                  parseFloat(row.passRate) >= 90
                                    ? "text-emerald-600"
                                    : parseFloat(row.passRate) >= 75
                                      ? "text-amber-500"
                                      : "text-rose-500"
                                }`}
                              >
                                {row.passRate}%
                              </span>
                              <div className="w-12 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    parseFloat(row.passRate) >= 90
                                      ? "bg-emerald-500"
                                      : parseFloat(row.passRate) >= 75
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                  }`}
                                  style={{ width: `${row.passRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportMeasurementResultDashboard;
