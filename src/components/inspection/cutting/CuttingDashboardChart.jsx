// src/components/inspection/cutting/CuttingDashboardChart.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

const CuttingDashboardChart = ({ data, dataKey, nameKey, title }) => {
  const { theme } = useTheme();
  const tickColor = theme === "dark" ? "#A0AEC0" : "#4A5568";
  const gridColor = theme === "dark" ? "#4A5568" : "#E2E8F0";

  return (
    <div
      className={`p-4 rounded-lg shadow-md ${
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
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey={nameKey} tick={{ fill: tickColor, fontSize: 12 }} />
          <YAxis tick={{ fill: tickColor, fontSize: 12 }} unit="%" />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === "dark" ? "#2D3748" : "#FFFFFF",
              borderColor: theme === "dark" ? "#4A5568" : "#CBD5E0",
              color: theme === "dark" ? "#FFFFFF" : "#1A202C"
            }}
            cursor={{ fill: "rgba(113, 128, 150, 0.2)" }}
          />
          <Legend wrapperStyle={{ color: tickColor, fontSize: 14 }} />
          <Bar dataKey={dataKey} fill="#4299E1" name="Pass Rate" unit="%" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CuttingDashboardChart;
