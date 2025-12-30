// src/components/inspection/cutting/CuttingDashboardCard.jsx
import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

// Enhanced helper function with better styling
const getCardStyles = (rule, value, theme) => {
  const palettes = {
    green: theme === "dark" 
      ? {
          card: "bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50",
          icon: "bg-green-500/20 border border-green-400/30",
          text: "text-green-300",
          accent: "text-green-400",
          glow: "shadow-green-500/10"
        }
      : {
          card: "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50",
          icon: "bg-green-100 border border-green-200",
          text: "text-green-700",
          accent: "text-green-600",
          glow: "shadow-green-500/10"
        },
    red: theme === "dark"
      ? {
          card: "bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-700/50",
          icon: "bg-red-500/20 border border-red-400/30",
          text: "text-red-300",
          accent: "text-red-400",
          glow: "shadow-red-500/10"
        }
      : {
          card: "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50",
          icon: "bg-red-100 border border-red-200",
          text: "text-red-700",
          accent: "text-red-600",
          glow: "shadow-red-500/10"
        },
    orange: theme === "dark"
      ? {
          card: "bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700/50",
          icon: "bg-orange-500/20 border border-orange-400/30",
          text: "text-orange-300",
          accent: "text-orange-400",
          glow: "shadow-orange-500/10"
        }
      : {
          card: "bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50",
          icon: "bg-orange-100 border border-orange-200",
          text: "text-orange-700",
          accent: "text-orange-600",
          glow: "shadow-orange-500/10"
        },
    default: theme === "dark"
      ? {
          card: "bg-gradient-to-br from-gray-800/50 to-gray-700/30 border-gray-600/50",
          icon: "bg-blue-500/20 border border-blue-400/30",
          text: "text-blue-300",
          accent: "text-blue-400",
          glow: "shadow-blue-500/10"
        }
      : {
          card: "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50",
          icon: "bg-blue-100 border border-blue-200",
          text: "text-blue-700",
          accent: "text-blue-600",
          glow: "shadow-blue-500/10"
        }
  };

  switch (rule) {
    case "pass":
      return palettes.green;
    case "reject":
      return palettes.red;
    case "passRate":
      if (value >= 98) return palettes.green;
      if (value >= 90) return palettes.orange;
      if (value < 90 && value !== null) return palettes.red;
      return palettes.default;
    default:
      return palettes.default;
  }
};

// Helper function to get trend indicator
const getTrendIndicator = (value, colorRule) => {
  if (colorRule === "passRate") {
    if (value >= 98) return <TrendingUp className="w-3 h-3" />;
    if (value >= 90) return <Minus className="w-3 h-3" />;
    if (value < 90) return <TrendingDown className="w-3 h-3" />;
  }
  return null;
};

const StatMiniCard = ({
  icon,
  title,
  value,
  unit = "",
  colorRule = "default",
  subtitle,
  trend
}) => {
  const { theme } = useTheme();
  
  const formattedValue = typeof value === "number"
    ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : value || (typeof value === "number" ? "0" : "N/A");

  const styles = getCardStyles(colorRule, value, theme);
  const trendIcon = getTrendIndicator(value, colorRule);

  return (
    <div className={`group relative p-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg ${styles.card} ${styles.glow}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 rounded-xl opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl"></div>
      </div>
      
      {/* Content */}
      <div className="relative flex items-start justify-between h-full">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-2">
            <h4 className={`text-xs font-semibold uppercase tracking-wider leading-tight ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}>
              {title}
            </h4>
            {subtitle && (
              <Info className={`w-3 h-3 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
            )}
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-2 mb-1">
            <p className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`} title={formattedValue}>
              {formattedValue}
              {unit && <span className="text-lg ml-1 font-medium opacity-75">{unit}</span>}
            </p>
            {trendIcon && (
              <span className={styles.accent}>
                {trendIcon}
              </span>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl ${styles.icon} group-hover:scale-110 transition-transform duration-200`}>
          <span className={styles.text}>
            {React.cloneElement(icon, { size: 20 })}
          </span>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-white/20 transition-all duration-200 pointer-events-none"></div>
    </div>
  );
};

const CuttingDashboardCard = ({ title, stats = [], description, icon }) => {
  const { theme } = useTheme();

  return (
    <div className={`rounded-2xl shadow-xl border transition-all duration-300 hover:shadow-2xl ${
      theme === "dark" 
        ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700" 
        : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${
        theme === "dark" ? "border-gray-700" : "border-gray-200"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`p-2 rounded-lg ${
                theme === "dark" ? "bg-blue-500/20" : "bg-blue-100"
              }`}>
                <span className={theme === "dark" ? "text-blue-400" : "text-blue-600"}>
                  {React.cloneElement(icon, { size: 20 })}
                </span>
              </div>
            )}
            <div>
              <h3 className={`text-lg font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                {title}
              </h3>
              {description && (
                <p className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {/* Stats Count Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            theme === "dark" 
              ? "bg-gray-700 text-gray-300" 
              : "bg-gray-100 text-gray-600"
          }`}>
            {stats.length} metrics
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {stats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map((stat, index) =>
              stat ? (
                <StatMiniCard 
                  key={stat.title || index} 
                  {...stat}
                  subtitle={stat.subtitle}
                  trend={stat.trend}
                />
              ) : null
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-100"
            }`}>
              <Info className={`w-8 h-8 ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`} />
            </div>
            <p className={`text-center font-medium ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              No data available
            </p>
            <p className={`text-sm text-center mt-1 ${
              theme === "dark" ? "text-gray-500" : "text-gray-500"
            }`}>
              Data will appear here once available
            </p>
          </div>
        )}
      </div>

      {/* Footer with summary if needed */}
      {stats.length > 0 && (
        <div className={`px-6 py-3 border-t ${
          theme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50/50"
        } rounded-b-2xl`}>
          <div className="flex items-center justify-between text-xs">
            <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Live data
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuttingDashboardCard;
