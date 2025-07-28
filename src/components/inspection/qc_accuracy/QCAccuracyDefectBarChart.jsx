import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-lg text-sm">
        <p className="font-bold">{data.name}</p>
        <p className="text-blue-500">
          Defect Rate: {data.defectRate.toFixed(2)}%
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          Total Qty: {data.defectQty}
        </p>
      </div>
    );
  }
  return null;
};

// --- FIX #1: MODIFIED CUSTOM LABEL TO ONLY SHOW DEFECT RATE ---
const CustomLabel = ({ x, y, width, value }) => {
  // Don't show label for very small bars
  if (value < 0.01) return null;

  return (
    <text
      x={x + width / 2}
      y={y}
      dy={-4}
      fill="var(--color-text-primary)"
      fontSize={10}
      fontWeight="bold"
      textAnchor="middle"
    >
      {`${value.toFixed(2)}%`}
    </text>
  );
};

// --- FIX #2: NEW COMPONENT FOR THE SUMMARY CARDS ---
const SummaryCard = ({ label, value, color }) => (
  <div className={`text-center px-3 py-1 rounded-md ${color}`}>
    <span className="text-xs font-medium">{label}: </span>
    <span className="font-bold">{value}</span>
  </div>
);

const QCAccuracyDefectBarChart = ({ data }) => {
  const [statusFilter, setStatusFilter] = useState("All");

  // --- FIX #3: CALCULATE SUMMARY TOTALS FOR THE NEW CARDS ---
  const summaryTotals = useMemo(() => {
    if (!data) return { All: 0, Minor: 0, Major: 0, Critical: 0 };

    return data.reduce(
      (acc, curr) => {
        acc.All += curr.defectQty;
        if (curr.status) {
          acc[curr.status] = (acc[curr.status] || 0) + curr.defectQty;
        }
        return acc;
      },
      { All: 0, Minor: 0, Major: 0, Critical: 0 }
    );
  }, [data]);

  const chartData = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "All") {
      const allAggregated = data.reduce((acc, curr) => {
        if (!acc[curr.name]) {
          acc[curr.name] = { name: curr.name, defectQty: 0, defectRate: 0 };
        }
        acc[curr.name].defectQty += curr.defectQty;
        acc[curr.name].defectRate += curr.defectRate;
        return acc;
      }, {});
      return Object.values(allAggregated).sort(
        (a, b) => b.defectRate - a.defectRate
      );
    }
    return data.filter((d) => d.status === statusFilter);
  }, [data, statusFilter]);

  const getButtonClass = (btnType) =>
    `px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
      statusFilter === btnType
        ? "bg-indigo-600 text-white"
        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
    }`;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow h-[450px] flex flex-col">
      <header className="flex justify-between items-start mb-2 flex-shrink-0">
        <h3 className="font-semibold text-lg">Top Defect Rates</h3>
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
          {["All", "Minor", "Major", "Critical"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={getButtonClass(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </header>

      {/* --- FIX #2: ADD THE SUMMARY CARDS SECTION --- */}
      <div className="flex items-center justify-center gap-3 mb-4 flex-shrink-0">
        <SummaryCard
          label="All"
          value={summaryTotals.All}
          color="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100"
        />
        <SummaryCard
          label="MI"
          value={summaryTotals.Minor}
          color="bg-yellow-200 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-200"
        />
        <SummaryCard
          label="MA"
          value={summaryTotals.Major}
          color="bg-orange-200 dark:bg-orange-800/50 text-orange-800 dark:text-orange-200"
        />
        <SummaryCard
          label="CR"
          value={summaryTotals.Critical}
          color="bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200"
        />
      </div>

      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: -20, bottom: 55 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border)"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
              angle={-45}
              textAnchor="end"
              height={70}
              interval={0}
            />
            <YAxis
              unit="%"
              tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(128, 128, 128, 0.1)" }}
            />
            <Bar dataKey="defectRate" fill="#ef4444" barSize={30}>
              <LabelList
                dataKey="defectRate"
                content={(props) => <CustomLabel {...props} />}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default QCAccuracyDefectBarChart;
