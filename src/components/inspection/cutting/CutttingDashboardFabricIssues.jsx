import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

// --- NEW: Custom Tooltip Component with Tables ---
const CustomTooltip = ({ active, payload, totalInspectionQty, theme }) => {
  // Memoize the aggregation logic for the tooltip tables
  const processedDetails = useMemo(() => {
    if (!active || !payload || !payload.length) {
      return { moBreakdown: [], spreadTableBreakdown: [] };
    }
    const details = payload[0].payload.details;
    const moData = {};
    const spreadTableData = {};

    details.forEach((item) => {
      // Aggregate by MO Number
      if (item.moNo) {
        moData[item.moNo] = (moData[item.moNo] || 0) + item.qty;
      }
      // Aggregate by Spread Table
      if (item.spreadTable) {
        spreadTableData[item.spreadTable] =
          (spreadTableData[item.spreadTable] || 0) + item.qty;
      }
    });

    const moBreakdown = Object.entries(moData)
      .map(([moNo, qty]) => ({ moNo, qty }))
      .sort((a, b) => b.qty - a.qty);
    const spreadTableBreakdown = Object.entries(spreadTableData)
      .map(([spreadTable, qty]) => ({ spreadTable, qty }))
      .sort((a, b) => b.qty - a.qty);

    return { moBreakdown, spreadTableBreakdown };
  }, [active, payload]);

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const defectRate =
      totalInspectionQty > 0 ? (data.totalQty / totalInspectionQty) * 100 : 0;

    return (
      <div
        className={`p-4 rounded-md shadow-lg w-96 ${
          theme === "dark"
            ? "bg-gray-800 border border-gray-600"
            : "bg-white border"
        }`}
      >
        <p className="font-bold text-lg mb-1">{data.defectName}</p>
        <p className="font-semibold text-blue-500">{`Total Quantity: ${data.totalQty.toLocaleString()}`}</p>
        <p className="font-semibold text-purple-500 mb-4">{`Defect Rate: ${defectRate.toFixed(
          4
        )}%`}</p>

        {/* MO Breakdown Table */}
        <div className="mb-4">
          <h4 className="font-bold text-sm mb-1">Breakdown by MO No.</h4>
          <div className="max-h-40 overflow-y-auto">
            <table className="w-full text-xs">
              <thead
                className={`sticky top-0 ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <tr>
                  <th className="p-1 text-left">MO No</th>
                  <th className="p-1 text-right">Qty</th>
                  <th className="p-1 text-right">Rate %</th>
                </tr>
              </thead>
              <tbody>
                {processedDetails.moBreakdown.map((item) => (
                  <tr
                    key={item.moNo}
                    className="border-t border-gray-300 dark:border-gray-600"
                  >
                    <td className="p-1">{item.moNo}</td>
                    <td className="p-1 text-right">{item.qty}</td>
                    <td className="p-1 text-right">
                      {(totalInspectionQty > 0
                        ? (item.qty / totalInspectionQty) * 100
                        : 0
                      ).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Spread Table Breakdown Table */}
        <div>
          <h4 className="font-bold text-sm mb-1">Breakdown by Spread Table</h4>
          <div className="max-h-40 overflow-y-auto">
            <table className="w-full text-xs">
              <thead
                className={`sticky top-0 ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <tr>
                  <th className="p-1 text-left">Spread Table</th>
                  <th className="p-1 text-right">Qty</th>
                  <th className="p-1 text-right">Rate %</th>
                </tr>
              </thead>
              <tbody>
                {processedDetails.spreadTableBreakdown.map((item) => (
                  <tr
                    key={item.spreadTable}
                    className="border-t border-gray-300 dark:border-gray-600"
                  >
                    <td className="p-1">{item.spreadTable}</td>
                    <td className="p-1 text-right">{item.qty}</td>
                    <td className="p-1 text-right">
                      {(totalInspectionQty > 0
                        ? (item.qty / totalInspectionQty) * 100
                        : 0
                      ).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// --- NEW: Summary Pivot Table Component ---
const FabricDefectSummaryTable = ({ data, inspectionQtyByMo, theme }) => {
  // Memoize the complex data transformation for the pivot table
  const processedData = useMemo(() => {
    if (!data || data.length === 0 || !inspectionQtyByMo) {
      return { moHeaders: [], pivotData: {} };
    }

    const moHeaders = new Set();
    const pivotData = {}; // { DefectName: { moNo: qty } }

    // Create a lookup map for faster access to inspection quantities
    const inspectionQtyMap = inspectionQtyByMo.reduce((acc, item) => {
      acc[item.moNo] = item.totalInspectionQty;
      return acc;
    }, {});

    // Step 1: Flatten and pivot the raw defect data
    data.forEach((defect) => {
      const defectName = defect.defectName;
      if (!pivotData[defectName]) {
        pivotData[defectName] = {};
      }
      defect.details.forEach((detail) => {
        if (detail.moNo) {
          moHeaders.add(detail.moNo);
          pivotData[defectName][detail.moNo] =
            (pivotData[defectName][detail.moNo] || 0) + detail.qty;
        }
      });
    });

    // Sort MO headers alphabetically
    const sortedMoHeaders = Array.from(moHeaders).sort((a, b) =>
      a.localeCompare(b)
    );

    return {
      moHeaders: sortedMoHeaders,
      pivotData: pivotData,
      inspectionQtyMap
    };
  }, [data, inspectionQtyByMo]);

  const getHighlightClass = (value, rowData) => {
    if (!value || value === 0) return "";
    const rowValues = Object.values(rowData).filter(
      (v) => typeof v === "number" && v > 0
    );
    if (rowValues.length === 0) return "";

    const maxValue = Math.max(...rowValues);
    if (value === maxValue)
      return theme === "dark" ? "bg-red-800/70" : "bg-red-200";
    return "";
  };

  const defectNames = Object.keys(processedData.pivotData).sort();

  return (
    <div
      className={`p-4 mt-6 rounded-lg shadow-md ${
        theme === "dark" ? "bg-[#1f2937]" : "bg-white"
      }`}
    >
      <h3
        className={`text-lg font-bold mb-4 ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        Fabric Defect Summary by MO Number
      </h3>
      <div className="overflow-x-auto">
        <table
          className={`w-full text-left text-xs border-collapse ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          <thead
            className={`uppercase ${
              theme === "dark"
                ? "bg-gray-800 text-gray-400"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            <tr>
              <th className="sticky left-0 z-10 py-2 px-3 border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-800">
                Defect Name
              </th>
              {processedData.moHeaders.map((header) => (
                <th
                  key={header}
                  className="py-2 px-3 text-center border border-gray-300 dark:border-gray-600"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {defectNames.map((defect) => (
              <tr
                key={defect}
                className={`border-b ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <td className="sticky left-0 z-10 py-2 px-3 font-medium border-x border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1f2937]">
                  {defect}
                </td>
                {processedData.moHeaders.map((mo) => {
                  const value = processedData.pivotData[defect]?.[mo] || 0;
                  const totalInspectedForMo =
                    processedData.inspectionQtyMap[mo] || 0;
                  const rate =
                    totalInspectedForMo > 0
                      ? (value / totalInspectedForMo) * 100
                      : 0;
                  const highlightClass = getHighlightClass(
                    value,
                    processedData.pivotData[defect]
                  );

                  return (
                    <td
                      key={mo}
                      className={`py-2 px-3 text-center border border-gray-300 dark:border-gray-600 ${highlightClass}`}
                    >
                      {value > 0 ? (
                        <div>
                          <span className="font-bold">{value}</span>
                          <span className="text-gray-500 dark:text-gray-400 block text-[10px]">
                            ({rate.toFixed(2)}%)
                          </span>
                        </div>
                      ) : (
                        ""
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CuttingDashboardFabricIssues = ({
  data,
  totalInspectionQty,
  inspectionQtyByMo,
  title
}) => {
  const { theme } = useTheme();
  const tickColor = theme === "dark" ? "#A0AEC0" : "#4A5568";
  const gridColor = theme === "dark" ? "#4A5568" : "#E2E8F0";

  const renderCustomizedLabel = (props) => {
    const { x, y, width, value } = props;
    const labelColor = theme === "dark" ? "#E2E8F0" : "#2D3748";
    if (value === 0 || value === undefined) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 4}
        fill={labelColor}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: "11px", fontWeight: "bold" }}
      >
        {value.toLocaleString()}
      </text>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div
        className={`p-4 mt-6 rounded-lg shadow-md h-96 flex items-center justify-center ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
          No fabric defect data available for the selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2
        className={`text-xl font-bold mb-4 ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        {title}
      </h2>
      <div
        className={`p-4 rounded-lg shadow-md h-[500px] flex flex-col ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="defectName"
              tick={{ fill: tickColor, fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              interval={0}
            >
              <Label
                value="Fabric Defect Name"
                offset={-85}
                position="insideBottom"
                fill={tickColor}
              />
            </XAxis>
            <YAxis tick={{ fill: tickColor, fontSize: 12 }}>
              <Label
                value="Total Defect Quantity"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: "middle", fill: tickColor }}
              />
            </YAxis>
            <Tooltip
              content={
                <CustomTooltip
                  totalInspectionQty={totalInspectionQty}
                  theme={theme}
                />
              }
              cursor={{ fill: "rgba(113, 128, 150, 0.1)" }}
            />
            <Bar dataKey="totalQty" fill="#8884d8">
              <LabelList dataKey="totalQty" content={renderCustomizedLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <FabricDefectSummaryTable
        data={data}
        inspectionQtyByMo={inspectionQtyByMo}
        theme={theme}
      />
    </div>
  );
};

export default CuttingDashboardFabricIssues;
