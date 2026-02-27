// import React from "react";
// import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

// // ─────────────────────────────────────────────
// // STANDARD STAT CARD
// // ─────────────────────────────────────────────
// const StatCard = ({
//   title,
//   value,
//   icon: Icon,
//   gradient,
//   loading,
//   subtitle,
//   trend,
//   trendUp,
// }) => (
//   <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
//     {/* gradient accent strip */}
//     <div
//       className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}
//     />

//     <div className="p-6">
//       <div className="flex items-start justify-between">
//         <div className="flex-1 min-w-0">
//           <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
//             {title}
//           </p>
//           {loading ? (
//             <div className="space-y-2">
//               <div className="h-8 w-28 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
//               <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
//             </div>
//           ) : (
//             <>
//               <h3 className="text-3xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
//                 {typeof value === "number"
//                   ? value.toLocaleString()
//                   : value || 0}
//               </h3>
//               {subtitle && (
//                 <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
//                   {subtitle}
//                   {trend && (
//                     <span
//                       className={`flex items-center gap-0.5 text-[10px] font-bold ${
//                         trendUp ? "text-emerald-500" : "text-red-500"
//                       }`}
//                     >
//                       {trendUp ? "↑" : "↓"} {trend}
//                     </span>
//                   )}
//                 </p>
//               )}
//             </>
//           )}
//         </div>
//         <div
//           className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300 ml-4 flex-shrink-0`}
//         >
//           <Icon className="w-5 h-5 text-white" />
//         </div>
//       </div>
//     </div>
//   </div>
// );

// // ─────────────────────────────────────────────
// // STAT CARD WITH INSIDE/OUTSIDE BREAKDOWN
// // ─────────────────────────────────────────────
// export const StatCardWithBreakdown = ({
//   title,
//   value,
//   icon: Icon,
//   gradient,
//   loading,
//   subtitle,
//   insideValue,
//   outsideValue,
//   valueFormatter,
//   unit,
// }) => {
//   // Format value based on type
//   const formatValue = (val) => {
//     if (valueFormatter) return valueFormatter(val);
//     if (typeof val === "number") {
//       // Check if it's a decimal number (SAM)
//       if (val % 1 !== 0) {
//         return val.toLocaleString(undefined, {
//           minimumFractionDigits: 2,
//           maximumFractionDigits: 2,
//         });
//       }
//       return val.toLocaleString();
//     }
//     return val || 0;
//   };

//   return (
//     <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
//       {/* Full gradient background overlay */}
//       <div
//         className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300`}
//       />

//       {/* gradient accent strip */}
//       <div
//         className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient}`}
//       />

//       <div className="relative p-5">
//         {/* Header Row */}
//         <div className="flex items-start justify-between mb-4">
//           <div className="flex-1 min-w-0">
//             <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
//               {title}
//             </p>
//             {loading ? (
//               <div className="space-y-2">
//                 <div className="h-9 w-32 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
//               </div>
//             ) : (
//               <div className="flex items-baseline gap-2">
//                 <h3 className="text-3xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
//                   {formatValue(value)}
//                 </h3>
//                 {unit && (
//                   <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
//                     {unit}
//                   </span>
//                 )}
//               </div>
//             )}
//             {subtitle && !loading && (
//               <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
//                 {subtitle}
//               </p>
//             )}
//           </div>
//           <div
//             className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300 ml-4 flex-shrink-0`}
//           >
//             <Icon className="w-5 h-5 text-white" />
//           </div>
//         </div>

//         {/* Inside/Outside Breakdown */}
//         {loading ? (
//           <div className="flex gap-3">
//             <div className="flex-1 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
//             <div className="flex-1 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
//           </div>
//         ) : (
//           <div className="flex gap-3">
//             {/* Inside (Task 38) */}
//             <div className="flex-1 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/30">
//               <div className="flex items-center gap-2 mb-1.5">
//                 <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
//                   <ArrowDownToLine className="w-3 h-3 text-white" />
//                 </div>
//                 <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
//                   Inside
//                 </span>
//               </div>
//               <p className="text-lg font-black text-indigo-700 dark:text-indigo-300 tabular-nums">
//                 {formatValue(insideValue)}
//               </p>
//             </div>

//             {/* Outside (Task 39) */}
//             <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
//               <div className="flex items-center gap-2 mb-1.5">
//                 <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
//                   <ArrowUpFromLine className="w-3 h-3 text-white" />
//                 </div>
//                 <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
//                   Outside
//                 </span>
//               </div>
//               <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
//                 {formatValue(outsideValue)}
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default StatCard;

import React, { useState, useEffect } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

// ─────────────────────────────────────────────
// CIRCULAR PROGRESS RING
// ─────────────────────────────────────────────
const CircularProgress = ({ value, total, glowColor, size = 58 }) => {
  const [animated, setAnimated] = useState(0);
  const pct = total > 0 ? value / total : 0;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * animated;

  useEffect(() => {
    let start = null;
    const duration = 1200;
    const raf = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimated(pct * ease);
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [pct]);

  const angle = animated * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const cx = size / 2;
  const cy = size / 2;
  const dotX = cx + r * Math.cos(rad);
  const dotY = cy + r * Math.sin(rad);

  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={5}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={glowColor}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 5px ${glowColor})` }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: glowColor,
          boxShadow: `0 0 8px 3px ${glowColor}`,
          top: dotY - 4,
          left: dotX - 4,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#fff",
            fontFamily: "'DM Mono', monospace",
            lineHeight: 1,
          }}
        >
          {Math.round(animated * 100)}%
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// GRADIENT MAP — pass a Tailwind-like string and get CSS
// ─────────────────────────────────────────────
const GRADIENTS = {
  // violet / purple
  "from-violet-500 to-purple-600": {
    bg: ["#7C3AED", "#9333EA"],
    ring: "#A855F7",
    glow: "rgba(168,85,247,0.5)",
  },
  "from-purple-500 to-indigo-600": {
    bg: ["#A855F7", "#4F46E5"],
    ring: "#818CF8",
    glow: "rgba(129,140,248,0.5)",
  },
  "from-indigo-500 to-blue-600": {
    bg: ["#6366F1", "#2563EB"],
    ring: "#60A5FA",
    glow: "rgba(96,165,250,0.5)",
  },
  // blue / cyan
  "from-blue-500 to-cyan-600": {
    bg: ["#3B82F6", "#0891B2"],
    ring: "#22D3EE",
    glow: "rgba(34,211,238,0.5)",
  },
  "from-cyan-500 to-teal-600": {
    bg: ["#06B6D4", "#0D9488"],
    ring: "#2DD4BF",
    glow: "rgba(45,212,191,0.5)",
  },
  // emerald / green
  "from-emerald-500 to-teal-600": {
    bg: ["#10B981", "#0D9488"],
    ring: "#34D399",
    glow: "rgba(52,211,153,0.5)",
  },
  "from-green-500 to-emerald-600": {
    bg: ["#22C55E", "#059669"],
    ring: "#4ADE80",
    glow: "rgba(74,222,128,0.5)",
  },
  // amber / orange
  "from-amber-500 to-orange-600": {
    bg: ["#F59E0B", "#EA580C"],
    ring: "#FB923C",
    glow: "rgba(251,146,60,0.5)",
  },
  "from-orange-500 to-red-600": {
    bg: ["#F97316", "#DC2626"],
    ring: "#FCA5A5",
    glow: "rgba(252,165,165,0.5)",
  },
  // rose / pink
  "from-rose-500 to-pink-600": {
    bg: ["#F43F5E", "#DB2777"],
    ring: "#F9A8D4",
    glow: "rgba(249,168,212,0.5)",
  },
  "from-pink-500 to-rose-600": {
    bg: ["#EC4899", "#E11D48"],
    ring: "#FB7185",
    glow: "rgba(251,113,133,0.5)",
  },
  // sky
  "from-sky-500 to-blue-600": {
    bg: ["#0EA5E9", "#2563EB"],
    ring: "#7DD3FC",
    glow: "rgba(125,211,252,0.5)",
  },
};

const resolveGradient = (gradient) => {
  if (GRADIENTS[gradient]) return GRADIENTS[gradient];
  // fallback
  return {
    bg: ["#6366F1", "#4F46E5"],
    ring: "#818CF8",
    glow: "rgba(129,140,248,0.5)",
  };
};

// ─────────────────────────────────────────────
// CARD SHELL — shared dark glassmorphic container
// ─────────────────────────────────────────────
const CardShell = ({ gradient, children }) => {
  const { bg, glow } = resolveGradient(gradient);
  const bgCss = `linear-gradient(135deg, ${bg[0]} 0%, ${bg[1]} 100%)`;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        background: bgCss,
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: hovered
          ? `0 20px 50px ${glow}, inset 0 1px 0 rgba(255,255,255,0.18)`
          : `0 8px 28px ${glow}, inset 0 1px 0 rgba(255,255,255,0.10)`,
        transform: hovered
          ? "translateY(-5px) scale(1.015)"
          : "translateY(0) scale(1)",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        cursor: "default",
      }}
    >
      {/* noise texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.4,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      />
      {/* top-right glow blob */}
      <div
        style={{
          position: "absolute",
          top: -24,
          right: -24,
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          filter: "blur(24px)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", padding: "18px 18px 16px" }}>
        {children}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ICON BOX
// ─────────────────────────────────────────────
const IconBox = ({ Icon }) => (
  <div
    style={{
      width: 36,
      height: 36,
      borderRadius: 10,
      flexShrink: 0,
      background: "rgba(255,255,255,0.15)",
      backdropFilter: "blur(6px)",
      border: "1px solid rgba(255,255,255,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    }}
  >
    <Icon style={{ width: 18, height: 18, color: "#fff" }} />
  </div>
);

// ─────────────────────────────────────────────
// LABEL + SKELETON
// ─────────────────────────────────────────────
const Label = ({ children }) => (
  <p
    style={{
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.65)",
      fontFamily: "'DM Sans', sans-serif",
      margin: 0,
    }}
  >
    {children}
  </p>
);

const Skeleton = ({ w = 120, h = 36 }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 8,
      background: "rgba(255,255,255,0.12)",
      animation: "pulse 1.4s ease-in-out infinite",
    }}
  />
);

// ─────────────────────────────────────────────
// STANDARD STAT CARD
// ─────────────────────────────────────────────
const StatCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  loading,
  subtitle,
  trend,
  trendUp,
  total, // optional — enables circular ring
}) => {
  const { ring, glow } = resolveGradient(gradient);

  const displayValue =
    typeof value === "number" ? value.toLocaleString() : value || 0;

  return (
    <CardShell gradient={gradient}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <IconBox Icon={Icon} />
        <Label>{title}</Label>
        <div
          style={{
            marginLeft: "auto",
            opacity: 0.4,
            fontSize: 16,
            color: "#fff",
            lineHeight: 1,
          }}
        >
          ⋮
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton w={100} h={40} />
              <Skeleton w={60} h={12} />
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  color: "#fff",
                  lineHeight: 1,
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "-1.5px",
                  textShadow: `0 0 24px ${glow}`,
                }}
              >
                {String(typeof value === "number" ? value : 0).padStart(2, "0")}
              </div>
              {(subtitle || trend) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 6,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.55)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {subtitle}
                  {trend && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: trendUp ? "#34D399" : "#F87171",
                      }}
                    >
                      {trendUp ? "↑" : "↓"} {trend}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {!loading && total != null && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <CircularProgress
              value={typeof value === "number" ? value : 0}
              total={total}
              glowColor={ring}
              size={58}
            />
            <span
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              of {total} total
            </span>
          </div>
        )}
      </div>
    </CardShell>
  );
};

// ─────────────────────────────────────────────
// BREAKDOWN PILL (Inside / Outside)
// ─────────────────────────────────────────────
const BreakdownPill = ({
  label,
  val,
  PillIcon,
  pillGradient,
  pillText,
  pillBorder,
}) => (
  <div
    style={{
      flex: 1,
      borderRadius: 12,
      padding: "10px 12px",
      background: pillGradient,
      border: `1px solid ${pillBorder}`,
      backdropFilter: "blur(6px)",
    }}
  >
    <div
      style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: pillText,
          opacity: 0.9,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PillIcon style={{ width: 11, height: 11, color: "#fff" }} />
      </div>
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.65)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {label}
      </span>
    </div>
    <p
      style={{
        margin: 0,
        fontSize: 20,
        fontWeight: 900,
        color: "#fff",
        fontFamily: "'DM Mono', monospace",
        textShadow: `0 0 12px ${pillText}`,
      }}
    >
      {val}
    </p>
  </div>
);

// ─────────────────────────────────────────────
// STAT CARD WITH INSIDE/OUTSIDE BREAKDOWN
// ─────────────────────────────────────────────
export const StatCardWithBreakdown = ({
  title,
  value,
  icon: Icon,
  gradient,
  loading,
  subtitle,
  insideValue,
  outsideValue,
  valueFormatter,
  unit,
}) => {
  const { glow } = resolveGradient(gradient);

  const formatValue = (val) => {
    if (valueFormatter) return valueFormatter(val);
    if (typeof val === "number") {
      if (val % 1 !== 0)
        return val.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      return val.toLocaleString();
    }
    return val || 0;
  };

  return (
    <CardShell gradient={gradient}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <IconBox Icon={Icon} />
        <Label>{title}</Label>
        <div
          style={{
            marginLeft: "auto",
            opacity: 0.4,
            fontSize: 16,
            color: "#fff",
            lineHeight: 1,
          }}
        >
          ⋮
        </div>
      </div>

      {/* Main Value */}
      {loading ? (
        <div style={{ marginBottom: 14 }}>
          <Skeleton w={130} h={42} />
          {subtitle && (
            <div style={{ marginTop: 6 }}>
              <Skeleton w={80} h={12} />
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{
                fontSize: 40,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "-1.5px",
                textShadow: `0 0 24px ${glow}`,
              }}
            >
              {formatValue(value)}
            </span>
            {unit && (
              <span
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {unit}
              </span>
            )}
          </div>
          {subtitle && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Inside / Outside Pills */}
      {loading ? (
        <div style={{ display: "flex", gap: 10 }}>
          <Skeleton w="48%" h={62} />
          <Skeleton w="48%" h={62} />
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10 }}>
          <BreakdownPill
            label="Inside"
            val={formatValue(insideValue)}
            PillIcon={ArrowDownToLine}
            pillGradient="rgba(99,102,241,0.25)"
            pillText="#818CF8"
            pillBorder="rgba(99,102,241,0.3)"
          />
          <BreakdownPill
            label="Outside"
            val={formatValue(outsideValue)}
            PillIcon={ArrowUpFromLine}
            pillGradient="rgba(16,185,129,0.2)"
            pillText="#34D399"
            pillBorder="rgba(16,185,129,0.3)"
          />
        </div>
      )}
    </CardShell>
  );
};

export default StatCard;
