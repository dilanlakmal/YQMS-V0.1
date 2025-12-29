import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  List,
  Archive,
  PieChart,
  TrendingDown,
  Wrench,
  AlertTriangle,
  Shirt,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Info,
  Eye,
  EyeOff
} from "lucide-react";

const SummaryCard = ({ 
  title, 
  value, 
  icon, 
  previousValue = null, 
  trend = null,
  description = null,
  isLoading = false,
  onClick = null 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getIconComponent = () => {
    const iconProps = { size: 24, className: "transition-all duration-200" };
    
    switch (icon) {
      case "shirt":
        return <Shirt {...iconProps} className="text-indigo-500 group-hover:text-indigo-600 transition-colors duration-200" />;
      case "checkCircle":
        return <CheckCircle {...iconProps} className="text-emerald-500 group-hover:text-emerald-600 transition-colors duration-200" />;
      case "xCircle":
        return <XCircle {...iconProps} className="text-red-500 group-hover:text-red-600 transition-colors duration-200" />;
      case "wrench":
        return <Wrench {...iconProps} className="text-blue-500 group-hover:text-blue-600 transition-colors duration-200" />;
      case "alertTriangle":
        return <AlertTriangle {...iconProps} className="text-amber-500 group-hover:text-amber-600 transition-colors duration-200" />;
      case "list":
        return <List {...iconProps} className="text-yellow-500 group-hover:text-yellow-600 transition-colors duration-200" />;
      case "archive":
        return <Archive {...iconProps} className="text-cyan-500 group-hover:text-cyan-600 transition-colors duration-200" />;
      case "pieChart":
        return <PieChart {...iconProps} className="text-purple-500 group-hover:text-purple-600 transition-colors duration-200" />;
      case "trendingDown":
        return <TrendingDown {...iconProps} className="text-orange-500 group-hover:text-orange-600 transition-colors duration-200" />;
      default:
        return <Info {...iconProps} className="text-gray-500 group-hover:text-gray-600 transition-colors duration-200" />;
    }
  };

  const getCardTheme = (title) => {
    if (title === "Defect Rate" || title === "Defect Ratio") {
      if (value > 3) {
        return {
          background: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
          border: "border-red-200 dark:border-red-700",
          textColor: "text-red-800 dark:text-red-300",
          titleColor: "text-red-700 dark:text-red-400",
          iconBg: "bg-red-100 dark:bg-red-800/30"
        };
      } else if (value >= 2) {
        return {
          background: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20",
          border: "border-amber-200 dark:border-amber-700",
          textColor: "text-amber-800 dark:text-amber-300",
          titleColor: "text-amber-700 dark:text-amber-400",
          iconBg: "bg-amber-100 dark:bg-amber-800/30"
        };
      } else {
        return {
          background: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20",
          border: "border-emerald-200 dark:border-emerald-700",
          textColor: "text-emerald-800 dark:text-emerald-300",
          titleColor: "text-emerald-700 dark:text-emerald-400",
          iconBg: "bg-emerald-100 dark:bg-emerald-800/30"
        };
      }
    }
    
    return {
      background: "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
      border: "border-gray-200 dark:border-gray-700",
      textColor: "text-gray-900 dark:text-gray-100",
      titleColor: "text-gray-600 dark:text-gray-400",
      iconBg: "bg-gray-100 dark:bg-gray-700"
    };
  };

  const calculatePercentageChange = () => {
    if (previousValue === null || previousValue === 0) return null;
    return ((value - previousValue) / previousValue) * 100;
  };

  const formatValue = (val) => {
    if (typeof val !== "number") return val;
    
    const integerFields = [
      "Total Garments",
      "Total Pass",
      "Initial Rejects",
      "Repair Left",
      "B Grade Qty",
      "Defects Qty",
      "Total Bundles"
    ];
    
    return integerFields.includes(title) 
      ? Math.round(val).toLocaleString()
      : Number(val).toFixed(2);
  };

  const theme = getCardTheme(title);
  const percentageChange = calculatePercentageChange();

  return (
    <div
      className={`group relative p-6 ${theme.background} ${theme.border} border-2 shadow-lg hover:shadow-2xl rounded-2xl transition-all duration-300 transform hover:scale-105 ${
        onClick ? 'cursor-pointer' : ''
      } ${isLoading ? 'animate-pulse' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {/* Header with Title and Details Toggle */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold ${theme.titleColor} uppercase tracking-wider`}>
              {title}
            </h2>
            {description && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors duration-200"
              >
                {showDetails ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
          </div>
          
          {/* Description */}
          {showDetails && description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Value */}
          <div className="flex items-baseline space-x-2">
            <p className={`text-3xl font-bold ${theme.textColor} transition-colors duration-200`}>
              {formatValue(value)}
              {(title === "Defect Rate" || title === "Defect Ratio") && "%"}
            </p>
            
            {/* Trend Indicator */}
            {percentageChange !== null && (
              <div className={`flex items-center text-sm font-semibold ${
                percentageChange > 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : percentageChange < 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {percentageChange > 0 ? (
                  <ArrowUp size={16} className="mr-1" />
                ) : percentageChange < 0 ? (
                  <ArrowDown size={16} className="mr-1" />
                ) : null}
                {Math.abs(percentageChange).toFixed(1)}%
              </div>
            )}
          </div>

          {/* Previous Value */}
          {previousValue !== null && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Previous: {formatValue(previousValue)}
              {(title === "Defect Rate" || title === "Defect Ratio") && "%"}
            </p>
          )}

          {/* Custom Trend */}
          {trend && (
            <div className="flex items-center mt-2">
              <div className={`flex items-center text-xs font-medium ${
                trend.direction === 'up' 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : trend.direction === 'down' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {trend.direction === 'up' ? (
                  <TrendingUp size={14} className="mr-1" />
                ) : trend.direction === 'down' ? (
                  <TrendingDown size={14} className="mr-1" />
                ) : null}
                {trend.label}
              </div>
            </div>
          )}
        </div>

        {/* Icon */}
        <div className={`p-4 ${theme.iconBg} rounded-2xl transition-all duration-300 ${
          isHovered ? 'scale-110 rotate-3' : ''
        }`}>
          {getIconComponent()}
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-400/5 dark:to-purple-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      {/* Status Indicator */}
      {(title === "Defect Rate" || title === "Defect Ratio") && (
        <div className="absolute top-2 right-2">
          <div className={`w-3 h-3 rounded-full ${
            value > 3 
              ? 'bg-red-500 animate-pulse' 
              : value >= 2 
              ? 'bg-amber-500' 
              : 'bg-emerald-500'
          }`}></div>
        </div>
      )}

      {/* Click Indicator */}
      {onClick && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Click for details
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
