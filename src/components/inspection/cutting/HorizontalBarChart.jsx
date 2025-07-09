import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell
} from "recharts";
import { useTheme } from "../../context/ThemeContext";
import { TrendingUp, TrendingDown } from "lucide-react";

/**
 * CustomTooltip: Displays detailed information (Pcs, Pass, Reject) on hover.
 */
const CustomTooltip = ({ active, payload, label }) => {
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
        <p className="font-bold text-lg">{data.name}</p>
        <p
          style={{ color: getBarColor(data.passRate) }}
          className="font-semibold"
        >{`Pass Rate: ${data.passRate.toFixed(2)}%`}</p>
        <hr
          className={`my-1 ${
            theme === "dark" ? "border-gray-500" : "border-gray-200"
          }`}
        />
        <p>{`Total Pcs: ${data.totalPcs.toLocaleString()}`}</p>
        <p>{`Total Pass: ${data.totalPass.toLocaleString()}`}</p>
        <p>{`Total Reject: ${data.totalReject.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

/**
 * CustomYAxisTick: Renders the MO Number labels.
 */
const CustomYAxisTick = (props) => {
  const { x, y, payload } = props;
  const { theme } = useTheme();
  const tickColor = theme === "dark" ? "#CBD5E0" : "#4A5568";
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill={tickColor}
        fontSize={12}
        fontWeight={500}
      >
        {payload.value}
      </text>
    </g>
  );
};

/**
 * Helper function to determine the bar color based on pass rate.
 */
const getBarColor = (passRate) => {
  if (passRate >= 98) return "#48BB78"; // Tailwind's green-400
  if (passRate >= 95) return "#F6AD55"; // Tailwind's orange-300
  if (passRate >= 90) return "#ED8936"; // Tailwind's orange-400
  return "#F56565"; // Tailwind's red-400
};

/**
 * A dedicated component for the color legend.
 */
const ColorLegend = () => {
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "text-gray-300" : "text-gray-600";
  const legendItems = [
    { color: "#48BB78", label: ">= 98% (Excellent)" },
    { color: "#F6AD55", label: "95% - 97.99% (Good)" },
    { color: "#ED8936", label: "90% - 94.99% (Warning)" },
    { color: "#F56565", label: "< 90% (Alert)" }
  ];
  return (
    <div className="pt-4 pr-4">
      <h4
        className={`text-sm font-semibold mb-2 ${
          theme === "dark" ? "text-gray-200" : "text-gray-700"
        }`}
      >
        Legend
      </h4>
      <ul className="space-y-2">
        {legendItems.map((item) => (
          <li key={item.label} className="flex items-center">
            <span
              className="w-4 h-4 rounded-sm mr-2"
              style={{ backgroundColor: item.color }}
            ></span>
            <span className={`text-xs ${textColor}`}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * The main HorizontalBarChart component, with conditional coloring, legend, and data labels.
 */
const HorizontalBarChart = ({
  data,
  title,
  topN,
  onTopNChange,
  sortOrder,
  onSortOrderChange
}) => {
  const { theme } = useTheme();
  const labelColor = theme === "dark" ? "#E2E8F0" : "#1A202C";

  const getButtonClass = (buttonType) => {
    const baseClass =
      "px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 flex items-center space-x-1";
    if (sortOrder === buttonType)
      return `${baseClass} bg-blue-600 text-white shadow-md`;
    return `${baseClass} ${
      theme === "dark"
        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
    }`;
  };

  return (
    <div
      className={`p-4 rounded-lg shadow-md h-full flex flex-col ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      }`}
    >
      {/* Chart Header with Title and Controls */}
      <div className="flex justify-between items-center mb-4">
        <h3
          className={`text-lg font-semibold ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          {title}
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1 p-0.5 rounded-lg bg-gray-500/20">
            <button
              onClick={() => onSortOrderChange("top")}
              className={getButtonClass("top")}
            >
              <TrendingUp size={14} />
              <span>Top</span>
            </button>
            <button
              onClick={() => onSortOrderChange("bottom")}
              className={getButtonClass("bottom")}
            >
              <TrendingDown size={14} />
              <span>Bottom</span>
            </button>
          </div>
          <select
            value={topN}
            onChange={onTopNChange}
            className={`p-1 rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
              theme === "dark"
                ? "bg-gray-700 text-white border-gray-600"
                : "bg-gray-50 text-black border-gray-300"
            }`}
          >
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
            <option value={7}>7</option>
            <option value={8}>8</option>
            <option value={9}>9</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* Flex layout for Legend and Chart */}
      <div className="flex-grow flex">
        {/* Legend Area */}
        <div className="flex-shrink-0 w-48">
          <ColorLegend />
        </div>

        {/* Chart Area */}
        <div className="flex-grow">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 80, left: 20, bottom: 20 }}
              barCategoryGap="40%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke={theme === "dark" ? "#374151" : "#E2E8F0"}
              />
              <XAxis type="number" domain={[0, "dataMax + 10"]} hide={true} />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                width={100}
                tick={<CustomYAxisTick />}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(113, 128, 150, 0.2)" }}
              />
              <Bar dataKey="passRate" barSize={25} radius={[0, 4, 4, 0]}>
                {/* Render a <Cell> for each bar to apply conditional color */}
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.passRate)}
                  />
                ))}
                {/* Use the reliable built-in formatter for the data label */}
                <LabelList
                  dataKey="passRate"
                  position="right"
                  offset={8}
                  style={{ fill: labelColor, fontSize: 13, fontWeight: "bold" }}
                  formatter={(value) => `${Number(value).toFixed(2)}%`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default HorizontalBarChart;
