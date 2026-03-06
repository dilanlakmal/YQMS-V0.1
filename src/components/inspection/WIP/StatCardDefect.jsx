import React, { useState, useEffect } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

// ─────────────────────────────────────────────
// CIRCULAR PROGRESS RING
// ─────────────────────────────────────────────
const CircularProgress = ({
  value,
  maxValue = 100,
  glowColor,
  size = 58,
  isPercentage = false,
}) => {
  const [animated, setAnimated] = useState(0);
  const pct = maxValue > 0 ? Math.min(value / maxValue, 1) : 0;
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
      {animated > 0.02 && (
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
      )}
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
            fontSize: isPercentage ? 10 : 11,
            fontWeight: 800,
            color: "#fff",
            fontFamily: "'DM Mono', monospace",
            lineHeight: 1,
          }}
        >
          {isPercentage
            ? `${(animated * maxValue).toFixed(1)}%`
            : Math.round(animated * 100)}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// GRADIENT MAP
// ─────────────────────────────────────────────
const GRADIENTS = {
  // Defect-specific gradients
  "from-red-500 to-rose-600": {
    bg: ["#EF4444", "#E11D48"],
    ring: "#FB7185",
    glow: "rgba(251,113,133,0.5)",
  },
  "from-orange-500 to-amber-600": {
    bg: ["#F97316", "#D97706"],
    ring: "#FBBF24",
    glow: "rgba(251,191,36,0.5)",
  },
  "from-yellow-500 to-orange-600": {
    bg: ["#EAB308", "#EA580C"],
    ring: "#FB923C",
    glow: "rgba(251,146,60,0.5)",
  },
  // Standard gradients
  "from-violet-500 to-purple-600": {
    bg: ["#7C3AED", "#9333EA"],
    ring: "#A855F7",
    glow: "rgba(168,85,247,0.5)",
  },
  "from-indigo-500 to-blue-600": {
    bg: ["#6366F1", "#2563EB"],
    ring: "#60A5FA",
    glow: "rgba(96,165,250,0.5)",
  },
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
  "from-amber-500 to-orange-600": {
    bg: ["#F59E0B", "#EA580C"],
    ring: "#FB923C",
    glow: "rgba(251,146,60,0.5)",
  },
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
  "from-fuchsia-500 to-pink-600": {
    bg: ["#D946EF", "#DB2777"],
    ring: "#F0ABFC",
    glow: "rgba(240,171,252,0.5)",
  },
};

const resolveGradient = (gradient) => {
  if (GRADIENTS[gradient]) return GRADIENTS[gradient];
  return {
    bg: ["#6366F1", "#4F46E5"],
    ring: "#818CF8",
    glow: "rgba(129,140,248,0.5)",
  };
};

// ─────────────────────────────────────────────
// CARD SHELL
// ─────────────────────────────────────────────
const CardShell = ({ gradient, children, danger = false }) => {
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
        border: danger
          ? "1px solid rgba(239,68,68,0.3)"
          : "1px solid rgba(255,255,255,0.12)",
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
          background: danger
            ? "rgba(239,68,68,0.15)"
            : "rgba(255,255,255,0.06)",
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
const IconBox = ({ Icon, danger = false }) => (
  <div
    style={{
      width: 36,
      height: 36,
      borderRadius: 10,
      flexShrink: 0,
      background: danger ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.15)",
      backdropFilter: "blur(6px)",
      border: danger
        ? "1px solid rgba(239,68,68,0.4)"
        : "1px solid rgba(255,255,255,0.2)",
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
// DEFECT STAT CARD
// ─────────────────────────────────────────────
export const DefectStatCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  loading,
  subtitle,
  trend,
  trendUp,
  danger = false,
}) => {
  const { glow } = resolveGradient(gradient);

  return (
    <CardShell gradient={gradient} danger={danger}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <IconBox Icon={Icon} danger={danger} />
        <Label>{title}</Label>
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
                {typeof value === "number" ? value.toLocaleString() : value}
              </div>
              {(subtitle || trend !== undefined) && (
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
                  {trend !== undefined && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        fontSize: 10,
                        fontWeight: 800,
                        color: trendUp ? "#34D399" : "#F87171",
                      }}
                    >
                      {trendUp ? (
                        <TrendingUp style={{ width: 12, height: 12 }} />
                      ) : (
                        <TrendingDown style={{ width: 12, height: 12 }} />
                      )}
                      {trend}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </CardShell>
  );
};

// ─────────────────────────────────────────────
// DEFECT RATE CARD (with circular progress)
// ─────────────────────────────────────────────
export const DefectRateCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  loading,
  subtitle,
  maxRate = 10, // max rate for the ring (e.g., 10%)
  danger = false,
}) => {
  const { ring, glow } = resolveGradient(gradient);

  // Determine color based on rate
  const getRateColor = (rate) => {
    if (rate <= 2) return "#34D399"; // Green - Good
    if (rate <= 5) return "#FBBF24"; // Yellow - Warning
    return "#F87171"; // Red - Critical
  };

  const rateColor = getRateColor(value);

  return (
    <CardShell gradient={gradient} danger={danger}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <IconBox Icon={Icon} danger={danger} />
        <Label>{title}</Label>
      </div>

      {/* Body */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton w={80} h={40} />
              <Skeleton w={100} h={12} />
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  color: "#fff",
                  lineHeight: 1,
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "-1.5px",
                  textShadow: `0 0 24px ${glow}`,
                }}
              >
                {value.toFixed(2)}
                <span style={{ fontSize: 18, marginLeft: 2, opacity: 0.7 }}>
                  %
                </span>
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
              {/* Rate status badge */}
              <div
                style={{
                  marginTop: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: `${rateColor}20`,
                  border: `1px solid ${rateColor}40`,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: rateColor,
                    boxShadow: `0 0 6px ${rateColor}`,
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: rateColor,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {value <= 2 ? "Good" : value <= 5 ? "Warning" : "Critical"}
                </span>
              </div>
            </>
          )}
        </div>

        {!loading && (
          <CircularProgress
            value={value}
            maxValue={maxRate}
            glowColor={rateColor}
            size={70}
            isPercentage={true}
          />
        )}
      </div>
    </CardShell>
  );
};

// ─────────────────────────────────────────────
// OUTPUT CARD WITH INSIDE/OUTSIDE BREAKDOWN
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
      {typeof val === "number" ? val.toLocaleString() : val}
    </p>
  </div>
);

export const OutputWithBreakdownCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  loading,
  subtitle,
  insideValue,
  outsideValue,
  unit,
}) => {
  const { glow } = resolveGradient(gradient);

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
              {typeof value === "number" ? value.toLocaleString() : value}
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
            val={insideValue}
            PillIcon={ArrowDownToLine}
            pillGradient="rgba(99,102,241,0.25)"
            pillText="#818CF8"
            pillBorder="rgba(99,102,241,0.3)"
          />
          <BreakdownPill
            label="Outside"
            val={outsideValue}
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

export default DefectStatCard;