import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { 
  BarChart3, 
  TrendingUp, 
  Filter, 
  Download, 
  Maximize2, 
  Eye,
  AlertTriangle,
  Info
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// Enhanced color palette with better accessibility
const BAR_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16"  // Lime
];

// Enhanced Custom Tooltip with better styling
const CustomTooltip = ({ active, payload }) => {
  const { theme } = useTheme();

  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className={`p-4 rounded-xl shadow-2xl border backdrop-blur-sm ${
        theme === "dark"
          ? "bg-gray-800/95 border-gray-600 text-white"
          : "bg-white/95 border-gray-200 text-gray-800"
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.fill }}
          />
          <p className="font-bold text-sm">{data.measurementPointLabel}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs opacity-75">Garment Type</p>
          <p className="font-semibold">{data.garmentType}</p>
          <p className="text-xs opacity-75">Total Failures</p>
          <p className="font-bold text-lg" style={{ color: data.fill }}>
            {data.failures.toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  return null;
};

// Enhanced Stats Card Component
const StatsCard = ({ icon, title, value, subtitle, color = "blue" }) => {
  const { theme } = useTheme();
  
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    red: "from-red-500 to-red-600"
  };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-lg ${
      theme === "dark" 
        ? "bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600" 
        : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[color]} text-white`}>
          {icon}
        </div>
      </div>
      <h4 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
        theme === "dark" ? "text-gray-400" : "text-gray-500"
      }`}>
        {title}
      </h4>
      <p className={`text-2xl font-bold ${
        theme === "dark" ? "text-gray-100" : "text-gray-800"
      }`}>
        {value}
      </p>
      {subtitle && (
        <p className={`text-xs mt-1 ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

const CuttingDashboardMeasurementIssues = ({ data, title }) => {
  const { theme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedGarmentTypes, setSelectedGarmentTypes] = useState(new Set());

  const tickColor = theme === "dark" ? "#A0AEC0" : "#4A5568";
  const gridColor = theme === "dark" ? "#4A5568" : "#E2E8F0";

  // Enhanced annotation component
  const RenderCustomizedLabel = (props) => {
    const { x, y, width, value } = props;
    const labelColor = theme === "dark" ? "#E2E8F0" : "#2D3748";

    if (!value || !showLabels) {
      return null;
    }

    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill={labelColor}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-semibold"
      >
        {value}
      </text>
    );
  };

  // Enhanced data transformation with filtering
  const { chartData, legendPayload, groupSeparators, stats } = useMemo(() => {
    if (!data || data.length === 0) {
      return { 
        chartData: [], 
        legendPayload: [], 
        groupSeparators: [],
        stats: { totalFailures: 0, totalPoints: 0, garmentTypes: 0, avgFailures: 0 }
      };
    }

    const colorMap = data.reduce((acc, garment, index) => {
      acc[garment.garmentType] = BAR_COLORS[index % BAR_COLORS.length];
      return acc;
    }, {});

    const flatData = [];
    const separators = [];
    let totalFailures = 0;
    let totalPoints = 0;

    // Filter data based on selected garment types
    const filteredData = selectedGarmentTypes.size === 0 
      ? data 
      : data.filter(garment => selectedGarmentTypes.has(garment.garmentType));

    filteredData.forEach((garment, garmentIndex) => {
      if (flatData.length > 0 && garment.issues.length > 0) {
        separators.push({
          x: garment.issues[0].measurementPoint,
          label: garment.garmentType
        });
      }

      garment.issues.forEach((issue) => {
        totalFailures += issue.count;
        totalPoints += 1;
        
        flatData.push({
          measurementPointLabel: issue.measurementPoint,
          failures: issue.count,
          garmentType: garment.garmentType,
          fill: colorMap[garment.garmentType]
        });
      });
    });

    const legendData = data.map((garment) => ({
      value: garment.garmentType,
      type: "square",
      color: colorMap[garment.garmentType]
    }));

    const stats = {
      totalFailures,
      totalPoints,
      garmentTypes: data.length,
      avgFailures: totalPoints > 0 ? (totalFailures / totalPoints).toFixed(1) : 0
    };

    return {
      chartData: flatData,
      legendPayload: legendData,
      groupSeparators: separators,
      stats
    };
  }, [data, selectedGarmentTypes]);

  const handleGarmentTypeToggle = (garmentType) => {
    const newSelected = new Set(selectedGarmentTypes);
    if (newSelected.has(garmentType)) {
      newSelected.delete(garmentType);
    } else {
      newSelected.add(garmentType);
    }
    setSelectedGarmentTypes(newSelected);
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`p-8 rounded-2xl shadow-lg border-2 border-dashed ${
        theme === "dark" 
          ? "bg-gray-800 border-gray-600" 
          : "bg-white border-gray-300"
      }`}>
        <div className="text-center">
          <BarChart3 className={`mx-auto mb-4 ${
            theme === "dark" ? "text-gray-500" : "text-gray-400"
          }`} size={48} />
          <h3 className={`text-lg font-semibold mb-2 ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}>
            No Data Available
          </h3>
          <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            No measurement issue data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl shadow-xl border transition-all duration-300 ${
      theme === "dark" 
        ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700" 
        : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
    } ${isFullscreen ? "fixed inset-4 z-50" : ""}`}>
      
      {/* Enhanced Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"
            }`}>
              <BarChart3 className={`${
                theme === "dark" ? "text-blue-400" : "text-blue-600"
              }`} size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}>
                {title}
              </h3>
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Measurement failure analysis by garment type
              </p>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`p-2 rounded-lg transition-colors ${
                showLabels 
                  ? "bg-blue-600 text-white" 
                  : theme === "dark" 
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600" 
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
              title="Toggle Labels"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark" 
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600" 
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
              title="Toggle Fullscreen"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatsCard
            icon={<AlertTriangle size={16} />}
            title="Total Failures"
            value={stats.totalFailures.toLocaleString()}
            color="red"
          />
          <StatsCard
            icon={<BarChart3 size={16} />}
            title="Measurement Points"
            value={stats.totalPoints}
            color="blue"
          />
          <StatsCard
            icon={<Filter size={16} />}
            title="Garment Types"
            value={stats.garmentTypes}
            color="green"
          />
          <StatsCard
            icon={<TrendingUp size={16} />}
            title="Avg Failures/Point"
            value={stats.avgFailures}
            color="yellow"
          />
        </div>

        {/* Garment Type Filters */}
        {data && data.length > 1 && (
          <div className="mt-6">
            <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              <Filter size={14} />
              Filter by Garment Type
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.map((garment) => (
                <button
                  key={garment.garmentType}
                  onClick={() => handleGarmentTypeToggle(garment.garmentType)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedGarmentTypes.size === 0 || selectedGarmentTypes.has(garment.garmentType)
                      ? "bg-blue-600 text-white shadow-md"
                      : theme === "dark"
                        ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {garment.garmentType}
                </button>
              ))}
              {selectedGarmentTypes.size > 0 && (
                <button
                  onClick={() => setSelectedGarmentTypes(new Set())}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    theme === "dark"
                      ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                  }`}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Chart Container */}
      <div className="p-6">
        <div className={`rounded-xl border ${
          theme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50/50"
        }`} style={{ height: isFullscreen ? "calc(100vh - 300px)" : "500px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 30, right: 30, left: 20, bottom: 120 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={gridColor} 
                strokeOpacity={0.3}
              />
              <XAxis
                dataKey="measurementPointLabel"
                tick={{ fill: tickColor, fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                interval={0}
                height={100}
              >
                <Label
                  value="Measurement Points (Grouped by Garment Type)"
                  offset={-10}
                  position="insideBottom"
                  fill={tickColor}
                  className="text-sm font-medium"
                />
              </XAxis>
              <YAxis tick={{ fill: tickColor, fontSize: 12 }}>
                <Label
                  value="Total Failures"
                  angle={-90}
                  position="insideLeft"
                  style={{ textAnchor: "middle", fill: tickColor }}
                  className="text-sm font-medium"
                />
              </YAxis>
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
              />
              <Legend 
                payload={legendPayload} 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{ paddingBottom: "20px" }}
              />

              {/* Enhanced Reference Lines */}
              {groupSeparators.map((separator, index) => (
                <ReferenceLine
                  key={`line-${index}`}
                  x={separator.x}
                  stroke={theme === "dark" ? "#718096" : "#A0AEC0"}
                  strokeDasharray="2 2"
                  strokeOpacity={0.6}
                >
                  <Label
                    value={separator.label}
                    position="insideTopRight"
                    fill={theme === "dark" ? "#CBD5E0" : "#4A5568"}
                    fontSize={11}
                    fontWeight="600"
                    angle={-90}
                    dy={25}
                    dx={-10}
                  />
                </ReferenceLine>
              ))}

              <Bar 
                dataKey="failures" 
                radius={[4, 4, 0, 0]}
                stroke={theme === "dark" ? "#374151" : "#E5E7EB"}
                strokeWidth={1}
              >
                <LabelList
                  dataKey="failures"
                  content={<RenderCustomizedLabel />}
                />
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Info Panel */}
        <div className={`mt-4 p-4 rounded-lg border ${
          theme === "dark" 
            ? "bg-blue-900/20 border-blue-800/30" 
            : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-start gap-2">
            <Info className={`mt-0.5 ${
              theme === "dark" ? "text-blue-400" : "text-blue-600"
            }`} size={16} />
            <div>
              <p className={`text-sm font-medium ${
                theme === "dark" ? "text-blue-300" : "text-blue-800"
              }`}>
                Chart Information
              </p>
              <p className={`text-xs mt-1 ${
                theme === "dark" ? "text-blue-200" : "text-blue-700"
              }`}>
                Bars are grouped by garment type with vertical separators. 
                Hover over bars for detailed information. Use filters to focus on specific garment types.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuttingDashboardMeasurementIssues;
