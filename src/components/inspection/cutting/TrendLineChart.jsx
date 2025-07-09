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
  ReferenceArea,
  Label,
  LabelList
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

// Define colors for consistency
const COLOR_EXCELLENT = "#48BB78"; // Green
const COLOR_GOOD = "#F6AD55"; // Light Orange
const COLOR_WARNING = "#ED8936"; // Dark Orange
const COLOR_ALERT = "#F56565"; // Light Red
const COLOR_LINE = "#6B46C1"; // Purple for the line

/**
 * Custom Tooltip for detailed info on hover
 */
const CustomTooltip = ({ active, payload }) => {
  const { theme } = useTheme();
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className={`p-3 rounded-md shadow-lg ${
          theme === "dark"
            ? "bg-gray-800 border border-gray-600"
            : "bg-white border"
        }`}
      >
        <p className="font-semibold">{`Date: ${data.name}`}</p>
        <p
          className="font-semibold"
          style={{ color: "#8884d8" }}
        >{`Pass Rate: ${data.passRate.toFixed(2)}%`}</p>
      </div>
    );
  }
  return null;
};
/**
 * NEW: Custom Dot to render a visible marker at each data point.
 */
const CustomizedDot = (props) => {
  const { cx, cy } = props;
  // Renders a filled red circle with a white border to make it pop.
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={COLOR_ALERT}
      stroke="#fff"
      strokeWidth={1.5}
    />
  );
};

/**
 * Custom Label with refined positioning and smaller fonts.
 */
const CustomizedLabel = (props) => {
  const { x, y, value, index, data, minVal, maxVal } = props;
  const { theme } = useTheme();

  const isMax = value === maxVal;
  const isMin = value === minVal;

  // Logic to only show labels for first, last, min, max, and a few intermediate points
  if (
    !(isMax && index === data.findIndex((d) => d.passRate === maxVal)) &&
    !(isMin && index === data.findIndex((d) => d.passRate === minVal)) &&
    index % Math.ceil(data.length / 4) !== 0 &&
    index !== data.length - 1 &&
    index !== 0
  ) {
    return null;
  }

  const labelText = `${Number(value).toFixed(2)}%`;
  let labelContent;

  if (isMax) {
    labelContent = (
      <div className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">
        MAX:<span>{labelText}</span>
      </div>
    );
  } else if (isMin) {
    labelContent = (
      <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">
        MIN:<span>{labelText}</span>
      </div>
    );
  } else {
    labelContent = (
      <span
        style={{
          color: theme === "dark" ? "#CBD5E0" : "#4A5568",
          fontSize: "10px",
          fontWeight: 600
        }}
      >
        {labelText}
      </span>
    );
  }

  return (
    <g>
      {/* Shortened Leader Line */}
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={y - 12}
        stroke={theme === "dark" ? "#718096" : "#A0AEC0"}
        strokeWidth={1}
      />
      {/* Positioned closer to the point */}
      <foreignObject
        x={x - 35}
        y={y - 30}
        width={70}
        height={24}
        style={{ textAlign: "center" }}
      >
        {labelContent}
      </foreignObject>
    </g>
  );
};

const TrendLineChart = ({ data, title }) => {
  const { theme } = useTheme();
  const tickColor = theme === "dark" ? "#A0AEC0" : "#4A5568";

  // Calculate Min, Max, and Year once using useMemo for efficiency.
  const { minVal, maxVal, year } = useMemo(() => {
    if (!data || data.length === 0)
      return { minVal: null, maxVal: null, year: "" };
    const rates = data.map((d) => d.passRate);
    const firstDate = data[0].name;
    const year = firstDate ? firstDate.split("/")[2] : "";
    return {
      minVal: Math.min(...rates),
      maxVal: Math.max(...rates),
      year: year
    };
  }, [data]);

  return (
    <div
      className={`p-4 rounded-lg shadow-md h-[450px] flex flex-col ${
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
          <AreaChart
            data={data}
            margin={{ top: 30, right: 30, left: 0, bottom: 30 }}
          >
            <defs>
              <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOR_LINE} stopOpacity={0.4} />
                <stop offset="95%" stopColor={COLOR_LINE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={theme === "dark" ? "#4A5568" : "#E2E8F0"}
            />

            {/* X-AXIS with M/D format and Year label */}
            <XAxis
              dataKey="name"
              tick={{ fill: tickColor, fontSize: 11 }}
              tickFormatter={(tick) => tick.substring(0, tick.lastIndexOf("/"))}
              dy={10}
            >
              <Label
                value={year ? `Year: ${year}` : ""}
                offset={-20}
                position="insideBottom"
                fill={tickColor}
                fontSize={10}
              />
            </XAxis>
            <YAxis
              tick={{ fill: tickColor, fontSize: 11 }}
              unit="%"
              domain={[85, 101]}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* CORRECTED Reference Bands */}
            <ReferenceArea
              y1={98}
              y2={101}
              fill={COLOR_EXCELLENT}
              fillOpacity={0.08}
            />
            <ReferenceArea
              y1={95}
              y2={98}
              fill={COLOR_GOOD}
              fillOpacity={0.08}
            />
            <ReferenceArea
              y1={90}
              y2={95}
              fill={COLOR_WARNING}
              fillOpacity={0.08}
            />
            <ReferenceArea
              y1={85}
              y2={90}
              fill={COLOR_ALERT}
              fillOpacity={0.08}
            />

            {/* Reference Lines with labels */}
            <ReferenceLine
              y={98}
              stroke={COLOR_EXCELLENT}
              strokeDasharray="4 4"
            >
              <Label
                value="98%"
                position="insideLeft"
                fill={COLOR_EXCELLENT}
                fontSize={10}
              />
            </ReferenceLine>
            <ReferenceLine y={95} stroke={COLOR_GOOD} strokeDasharray="4 4">
              <Label
                value="95%"
                position="insideLeft"
                fill={COLOR_GOOD}
                fontSize={10}
              />
            </ReferenceLine>
            <ReferenceLine y={90} stroke={COLOR_WARNING} strokeDasharray="4 4">
              <Label
                value="90%"
                position="insideLeft"
                fill={COLOR_WARNING}
                fontSize={10}
              />
            </ReferenceLine>

            <Area
              type="monotone"
              dataKey="passRate"
              stroke={COLOR_LINE}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorTrend)"
              dot={<CustomizedDot />}
            >
              <LabelList
                dataKey="passRate"
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

export default TrendLineChart;
