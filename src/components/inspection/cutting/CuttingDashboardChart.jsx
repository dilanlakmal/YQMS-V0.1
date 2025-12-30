// src/components/inspection/cutting/CuttingDashboardChart.jsx
import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import { useTheme } from "../../context/ThemeContext";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Download, 
  Maximize2,
  Filter,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, theme }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className={`p-4 rounded-xl shadow-xl border ${
        theme === "dark" 
          ? "bg-gray-800 border-gray-600 text-white" 
          : "bg-white border-gray-200 text-gray-900"
      }`}>
        <p className="font-semibold mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.color }}
          ></div>
          <span className="text-sm">
            {data.name}: <span className="font-bold">{data.value}%</span>
          </span>
        </div>
        {data.payload.count && (
          <p className={`text-xs mt-1 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Total: {data.payload.count} items
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Color generator for bars based on value
const getBarColor = (value, theme) => {
  if (value >= 95) return theme === "dark" ? "#10B981" : "#059669"; // Green
  if (value >= 85) return theme === "dark" ? "#F59E0B" : "#D97706"; // Orange
  if (value >= 70) return theme === "dark" ? "#EF4444" : "#DC2626"; // Red
  return theme === "dark" ? "#6B7280" : "#9CA3AF"; // Gray
};

const CuttingDashboardChart = ({ 
  data = [], 
  dataKey, 
  nameKey, 
  title,
  subtitle,
  showLegend = true,
  showGrid = true,
  height = 400,
  unit = "%",
  onExport,
  refreshData
}) => {
  const { theme } = useTheme();
  const [showValues, setShowValues] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Enhanced data with colors
  const enhancedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      color: getBarColor(item[dataKey], theme)
    }));
  }, [data, dataKey, theme]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data.length) return { avg: 0, max: 0, min: 0, total: data.length };
    
    const values = data.map(item => item[dataKey]).filter(val => typeof val === 'number');
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
      total: data.length
    };
  }, [data, dataKey]);

  const tickColor = theme === "dark" ? "#9CA3AF" : "#6B7280";
  const gridColor = theme === "dark" ? "#374151" : "#E5E7EB";

  return (
    <div className={`rounded-2xl shadow-xl border transition-all duration-300 ${
      theme === "dark" 
        ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700" 
        : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
    } ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      
      {/* Header */}
      <div className={`px-6 py-4 border-b ${
        theme === "dark" ? "border-gray-700" : "border-gray-200"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              theme === "dark" ? "bg-blue-500/20" : "bg-blue-100"
            }`}>
              <BarChart3 className={`w-5 h-5 ${
                theme === "dark" ? "text-blue-400" : "text-blue-600"
              }`} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                {title}
              </h3>
              {subtitle && (
                <p className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowValues(!showValues)}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark" 
                  ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300" 
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
              }`}
              title={showValues ? "Hide values" : "Show values"}
            >
              {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            
            {refreshData && (
              <button
                onClick={refreshData}
                className={`p-2 rounded-lg transition-colors ${
                  theme === "dark" 
                    ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300" 
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
                }`}
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            
            {onExport && (
              <button
                onClick={onExport}
                className={`p-2 rounded-lg transition-colors ${
                  theme === "dark" 
                    ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300" 
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
                }`}
                title="Export chart"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark" 
                  ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300" 
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
              }`}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Statistics Bar */}
        {data.length > 0 && (
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 ${
                theme === "dark" ? "text-green-400" : "text-green-600"
              }`} />
              <span className={`text-sm ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}>
                Avg: <span className="font-semibold">{stats.avg.toFixed(1)}{unit}</span>
              </span>
            </div>
            <div className={`text-sm ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              Max: <span className="font-semibold text-green-600">{stats.max}{unit}</span>
            </div>
            <div className={`text-sm ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              Min: <span className="font-semibold text-red-600">{stats.min}{unit}</span>
            </div>
            <div className={`text-sm ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              Items: <span className="font-semibold">{stats.total}</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={enhancedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={gridColor}
                  strokeOpacity={0.3}
                />
              )}
              <XAxis 
                dataKey={nameKey} 
                tick={{ 
                  fill: tickColor, 
                  fontSize: 12 
                }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                tick={{ 
                  fill: tickColor, 
                  fontSize: 12 
                }} 
                unit={unit}
                domain={[0, 'dataMax + 10']}
              />
              <Tooltip 
                content={<CustomTooltip theme={theme} />}
                cursor={{ 
                  fill: theme === "dark" ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)" 
                }}
              />
              {showLegend && (
                <Legend 
                  wrapperStyle={{ 
                    color: tickColor, 
                    fontSize: 14,
                    paddingTop: "20px"
                  }} 
                />
              )}
              <Bar 
                dataKey={dataKey} 
                name={`Pass Rate (${unit})`}
                radius={[4, 4, 0, 0]}
              >
                {enhancedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-100"
            }`}>
              <BarChart3 className={`w-8 h-8 ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`} />
            </div>
            <h4 className={`text-lg font-semibold mb-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              No Data Available
            </h4>
            <p className={`text-sm text-center ${
              theme === "dark" ? "text-gray-500" : "text-gray-500"
            }`}>
              Chart data will appear here once available
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {data.length > 0 && (
        <div className={`px-6 py-3 border-t ${
          theme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50/50"
        } rounded-b-2xl`}>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                  Excellent (≥95%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                  Good (85-94%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                  Needs Improvement (&lt;85%)
                </span>
              </div>
            </div>
            <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </div>
  );
};

export default CuttingDashboardChart;
