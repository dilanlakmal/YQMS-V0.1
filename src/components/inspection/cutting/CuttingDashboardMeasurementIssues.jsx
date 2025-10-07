import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Legend,
  ReferenceLine, // Import ReferenceLine for the separators
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

// A set of distinct colors for the bars
const BAR_COLORS = [
  "#8884d8", // Purple
  "#82ca9d", // Green
  "#ffc658", // Yellow
  "#ff8042", // Orange
  "#0088FE", // Blue
  "#00C49F", // Teal
  "#FFBB28",
  "#FF8042"
];

const CustomTooltip = ({ active, payload }) => {
  const { theme } = useTheme();
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className={`p-3 rounded-md shadow-lg ${
          theme === "dark"
            ? "bg-gray-700 border border-gray-600"
            : "bg-white border"
        }`}
      >
        <p className="font-bold text-lg mb-2">{`Point: ${data.measurementPointLabel}`}</p>
        <p style={{ color: data.fill }} className="font-semibold">{`${
          data.garmentType
        }: ${data.failures.toLocaleString()} failures`}</p>
      </div>
    );
  }
  return null;
};

const CuttingDashboardMeasurementIssues = ({ data, title }) => {
  const { theme } = useTheme();
  const tickColor = theme === "dark" ? "#A0AEC0" : "#4A5568";
  const gridColor = theme === "dark" ? "#4A5568" : "#E2E8F0";

  // --- ANNOTATION COMPONENT (DEFINED INSIDE TO ACCESS THEME) ---
  const RenderCustomizedLabel = (props) => {
    const { x, y, width, value } = props;
    const labelColor = theme === "dark" ? "#E2E8F0" : "#2D3748";

    // Don't render a label for zero or undefined values
    if (!value) {
      return null;
    }

    return (
      <text
        x={x + width / 2}
        y={y - 6} // Position just above the bar
        fill={labelColor}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: "11px", fontWeight: "bold" }}
      >
        {value}
      </text>
    );
  };

  // --- MODIFIED DATA TRANSFORMATION (TO GET SEPARATOR INFO) ---
  const { chartData, legendPayload, groupSeparators } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], legendPayload: [], groupSeparators: [] };
    }

    const colorMap = data.reduce((acc, garment, index) => {
      acc[garment.garmentType] = BAR_COLORS[index % BAR_COLORS.length];
      return acc;
    }, {});

    const flatData = [];
    const separators = [];

    // Loop through the data to flatten it and find the separator points
    data.forEach((garment) => {
      // If data already exists, this is a new group. Mark its starting point.
      if (flatData.length > 0 && garment.issues.length > 0) {
        separators.push({
          x: garment.issues[0].measurementPoint, // The x-coordinate is the measurement point name
          label: garment.garmentType // The label for the new group
        });
      }

      // Add all issues from this garment type to the flat data array
      garment.issues.forEach((issue) => {
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

    return {
      chartData: flatData,
      legendPayload: legendData,
      groupSeparators: separators
    };
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div
        className={`p-4 rounded-lg shadow-md h-[500px] flex items-center justify-center ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
          No measurement issue data to display.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg shadow-md h-[500px] flex flex-col ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      }`}
    >
      <h3
        className={`text-lg font-semibold mb-4 ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        {title}
      </h3>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="measurementPointLabel"
              tick={{ fill: tickColor, fontSize: 11 }}
              angle={-60}
              textAnchor="end"
              interval={0}
              height={100}
            >
              <Label
                value="Measurement Points (Grouped by Garment Type)"
                offset={-105}
                position="insideBottom"
                fill={tickColor}
              />
            </XAxis>
            <YAxis tick={{ fill: tickColor, fontSize: 12 }}>
              <Label
                value="Total Failures"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: "middle", fill: tickColor }}
              />
            </YAxis>
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(113, 128, 150, 0.1)" }}
            />
            <Legend payload={legendPayload} verticalAlign="top" />

            {/* --- NEW: RENDER THE VERTICAL SEPARATOR LINES --- */}
            {groupSeparators.map((separator, index) => (
              <ReferenceLine
                key={`line-${index}`}
                x={separator.x}
                stroke={theme === "dark" ? "#718096" : "#A0AEC0"}
                strokeDasharray="4 4"
              >
                <Label
                  value={separator.label}
                  position="insideTopRight"
                  fill={theme === "dark" ? "#CBD5E0" : "#4A5568"}
                  fontSize={12}
                  fontWeight="bold"
                  angle={-90}
                  dy={20} // Pushes label down from the top
                  dx={-15} // Pushes label left from the line
                />
              </ReferenceLine>
            ))}

            <Bar dataKey="failures">
              {/* --- CORRECTED: ANNOTATIONS ARE NOW RENDERED CORRECTLY --- */}
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
    </div>
  );
};

export default CuttingDashboardMeasurementIssues;
