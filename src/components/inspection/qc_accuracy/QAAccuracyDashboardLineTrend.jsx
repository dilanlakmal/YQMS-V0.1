import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  LabelList
} from "recharts";

const COLOR_LINE = "#4f46e5"; // Indigo-600

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-lg text-sm">
        <p className="font-semibold">{`Date: ${new Date(
          label + "T00:00:00"
        ).toLocaleDateString()}`}</p>
        <p style={{ color: COLOR_LINE }}>{`Accuracy: ${payload[0].value.toFixed(
          2
        )}%`}</p>
      </div>
    );
  }
  return null;
};

const CustomizedLabel = ({ x, y, value, data, minVal, maxVal }) => {
  const isMax = value === maxVal;
  const isMin = value === minVal;

  if (!isMin && !isMax) return null;

  return (
    <text
      x={x}
      y={y}
      dy={isMin ? 15 : -8}
      fill="var(--color-text-primary)"
      fontSize={11}
      fontWeight="bold"
      textAnchor="middle"
    >
      {`${isMin ? "Min: " : "Max: "}${value.toFixed(2)}%`}
    </text>
  );
};

const QAAccuracyDashboardLineTrend = ({ data }) => {
  const { minVal, maxVal } = useMemo(() => {
    if (!data || data.length === 0) return { minVal: null, maxVal: null };
    const rates = data.map((d) => d.accuracy);
    return {
      minVal: Math.min(...rates),
      maxVal: Math.max(...rates)
    };
  }, [data]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow h-[500px] flex flex-col">
      <h3 className="font-semibold text-lg mb-4 text-center">
        Daily QC Accuracy Trend
      </h3>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOR_LINE} stopOpacity={0.4} />
                <stop offset="95%" stopColor={COLOR_LINE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border)"
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
              tickFormatter={(tick) =>
                new Date(tick + "T00:00:00").toLocaleDateString([], {
                  month: "short",
                  day: "numeric"
                })
              }
              dy={5}
            />
            <YAxis
              tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
              unit="%"
              domain={[85, 100]}
            />
            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine
              y={95}
              label={{
                value: "95%",
                position: "insideLeft",
                fill: "#3b82f6",
                fontSize: 10
              }}
              stroke="#3b82f6"
              strokeDasharray="4 4"
            />
            <ReferenceLine
              y={92.5}
              label={{
                value: "92.5%",
                position: "insideLeft",
                fill: "#f97316",
                fontSize: 10
              }}
              stroke="#f97316"
              strokeDasharray="4 4"
            />

            <Area
              type="monotone"
              dataKey="accuracy"
              stroke={COLOR_LINE}
              strokeWidth={2}
              fill="url(#colorAccuracy)"
              dot={{ r: 3, fill: COLOR_LINE }}
            >
              <LabelList
                dataKey="accuracy"
                content={
                  <CustomizedLabel
                    data={data}
                    minVal={minVal}
                    maxVal={maxVal}
                  />
                }
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default QAAccuracyDashboardLineTrend;
