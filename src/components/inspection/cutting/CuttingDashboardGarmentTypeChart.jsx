// src/components/inspection/cutting/CuttingDashboardGarmentTypeChart.jsx
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

// --- Reusable Helper Components (copied from HorizontalBarChart for self-containment) ---

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
        <p className="font-bold text-lg">{data.name}</p>
        <p
          style={{ color: getBarColor(data.passRate) }}
          className="font-semibold"
        >{`Pass Rate: ${data.passRate.toFixed(2)}%`}</p>
      </div>
    );
  }
  return null;
};

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

const getBarColor = (passRate) => {
  if (passRate >= 98) return "#48BB78";
  if (passRate >= 95) return "#F6AD55";
  if (passRate >= 90) return "#ED8936";
  return "#F56565";
};

const ColorLegend = () => {
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "text-gray-300" : "text-gray-600";
  const legendItems = [
    { color: "#48BB78", label: ">= 98%" },
    { color: "#F6AD55", label: "95-98%" },
    { color: "#ED8936", label: "90-95%" },
    { color: "#F56565", label: "< 90%" }
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

// --- Main Chart Component for Garment Type ---

const CuttingDashboardGarmentTypeChart = ({ data, title }) => {
  const { theme } = useTheme();
  const labelColor = theme === "dark" ? "#E2E8F0" : "#1A202C";

  return (
    <div
      className={`p-4 rounded-lg shadow-md h-full flex flex-col ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      }`}
    >
      {/* Chart Header - Simplified, no controls */}
      <div className="flex justify-between items-center mb-4">
        <h3
          className={`text-lg font-semibold ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          {title}
        </h3>
      </div>

      {/* Flex layout for Legend and Chart */}
      <div className="flex-grow flex">
        <div className="flex-shrink-0 w-40">
          {" "}
          {/* Slightly less width for legend */}
          <ColorLegend />
        </div>
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
                width={80} // Can be smaller as garment names are shorter
                tick={<CustomYAxisTick />}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(113, 128, 150, 0.2)" }}
              />
              <Bar dataKey="passRate" barSize={25} radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.passRate)}
                  />
                ))}
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

export default CuttingDashboardGarmentTypeChart;
