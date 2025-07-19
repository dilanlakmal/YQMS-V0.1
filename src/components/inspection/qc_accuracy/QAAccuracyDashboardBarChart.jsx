import React, { useState, useMemo } from "react";
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
import { TrendingUp, TrendingDown } from "lucide-react";

// Helper to determine bar color based on accuracy
const getBarColor = (accuracy) => {
  if (accuracy >= 98) return "#22c55e"; // green-500
  if (accuracy >= 95) return "#3b82f6"; // blue-500
  if (accuracy >= 90) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
};

const CustomYAxisTick = ({ x, y, payload }) => (
  <g transform={`translate(${x},${y})`}>
    <text
      x={0}
      y={0}
      dy={4}
      textAnchor="end"
      fill="var(--color-text-secondary)"
      fontSize={12}
      fontWeight={500}
    >
      {payload.value}
    </text>
  </g>
);

const QAAccuracyDashboardBarChart = ({
  data,
  chartType,
  onChartTypeChange
}) => {
  const [sortOrder, setSortOrder] = useState("bottom"); // 'top' or 'bottom'
  const [topN, setTopN] = useState(5);

  const chartData = useMemo(() => {
    const sortedData = [...data].sort((a, b) =>
      sortOrder === "top" ? b.accuracy - a.accuracy : a.accuracy - b.accuracy
    );
    return sortedData.slice(0, topN);
  }, [data, sortOrder, topN]);

  const chartHeight = Math.max(chartData.length * 50, 300); // 50px per bar, min 300px
  const yAxisLabel = chartType.charAt(0).toUpperCase() + chartType.slice(1);

  // --- FIX #1: CREATE A DYNAMIC CHART TITLE ---
  const dynamicTitle = useMemo(() => {
    const yAxisLabel = chartType === "MO" ? "MO No" : chartType;
    const sortLabel = sortOrder.charAt(0).toUpperCase() + sortOrder.slice(1);
    return `Accuracy by ${yAxisLabel} - ${sortLabel} ${topN}`;
  }, [chartType, sortOrder, topN]);

  const getButtonClass = (btnType, state) =>
    `px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
      //include flex items-center if needed to display in same line
      btnType === state
        ? "bg-indigo-600 text-white"
        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
    }`;

  //flex justify-between items-center mb-4 flex-shrink-0
  //flex items-center gap-4

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow h-[500px] flex flex-col">
      <header className="flex-shrink-0 mb-4">
        {/* Row 1: Title */}
        <div className="text-center mb-3">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">
            {dynamicTitle}
          </h3>
        </div>
        {/* <h3 className="font-semibold text-lg">{`Accuracy by ${yAxisLabel}`}</h3> */}
        <div className="flex justify-between items-center">
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
            <button
              onClick={() => onChartTypeChange("Line")}
              className={getButtonClass("Line", chartType)}
            >
              Line
            </button>
            <button
              onClick={() => onChartTypeChange("Table")}
              className={getButtonClass("Table", chartType)}
            >
              Table
            </button>
            <button
              onClick={() => onChartTypeChange("MO")}
              className={getButtonClass("MO", chartType)}
            >
              MO
            </button>
            <button
              onClick={() => onChartTypeChange("QC")}
              className={getButtonClass("QC", chartType)}
            >
              QC
            </button>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
            <button
              onClick={() => setSortOrder("top")}
              className={getButtonClass("top", sortOrder)}
            >
              <TrendingUp size={14} className="mr-1.5" />
              Top
            </button>
            <button
              onClick={() => setSortOrder("bottom")}
              className={getButtonClass("bottom", sortOrder)}
            >
              <TrendingDown size={14} className="mr-1.5" />
              Bottom
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="topN-select"
              className="text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              N:
            </label>
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="p-1.5 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
            >
              {[3, 5, 10, 15, 20, 30, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      <div className="flex-grow overflow-y-auto pr-2">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 50, left: 30, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="var(--color-border)"
            />
            <XAxis type="number" domain={[0, 100]} hide={true} />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              width={80}
              tick={<CustomYAxisTick />}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: "rgba(128, 128, 128, 0.1)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-lg text-sm">
                      <p className="font-bold">{payload[0].payload.name}</p>
                      <p style={{ color: getBarColor(payload[0].value) }}>
                        Accuracy: {payload[0].value.toFixed(2)}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="accuracy" barSize={25} radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.accuracy)}
                />
              ))}
              <LabelList
                dataKey="accuracy"
                position="right"
                offset={8}
                style={{
                  fill: "var(--color-text-primary)",
                  fontSize: 12,
                  fontWeight: "bold"
                }}
                formatter={(value) => `${Number(value).toFixed(2)}%`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default QAAccuracyDashboardBarChart;
