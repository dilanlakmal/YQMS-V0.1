import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import Chart from 'chart.js/auto';
import 'chartjs-plugin-datalabels';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

const SunriseLineBarChart = ({ filteredData, filters }) => {
  const [groupBy, setGroupBy] = useState("WorkLine");

  const defectRateByGroup = () => {
    const groupData = {};

    filteredData.forEach((row) => {
      // console.log("Row Data:", row);
      let key;

      if (groupBy === "WorkLine") {
        key = row.lineNo ? String(row.lineNo) : "No Line"; // Ensure lineNo is treated as a string and provide a default value
      } else if (groupBy === "MONo") {
        key = row.MONo || "Unknown MO";
      } else if (groupBy === "Buyer") {
        key = row.Buyer || "Unknown Buyer";
      } else if (groupBy === "ColorName") {
        key = row.ColorName || "Unknown Color";
      } else if (groupBy === "SizeName") {
        key = row.SizeName || "Unknown Size";
      }

      // console.log("Key:", key);
      if (!groupData[key]) {
        groupData[key] = {
          checked: 0,
          totalDefects: 0,
          reworkNameDefects: 0,
        };
      }

      const group = groupData[key];
      group.checked += row.CheckedQty;
      group.totalDefects += row.totalDefectsQty;

      if (filters.reworkName) {
        const matchingDefects = row.DefectArray.filter(
          (defect) => defect.ReworkName === filters.reworkName
        );
        const reworkNameDefectsQty = matchingDefects.reduce(
          (sum, defect) => sum + defect.defectQty,
          0
        );
        group.reworkNameDefects += reworkNameDefectsQty;
      }
    });

    return Object.entries(groupData)
      .map(([group, data]) => ({
        group,
        totalDefectRate:
          data.checked === 0 ? 0 : (data.totalDefects / data.checked) * 100,
        reworkNameDefectRate: filters.reworkName
          ? data.checked === 0
            ? 0
            : (data.reworkNameDefects / data.checked) * 100
          : null,
      }))
      .sort((a, b) => b.totalDefectRate - a.totalDefectRate);
  };

  const defectData = defectRateByGroup();
  // console.log("Defect Data:", defectData); // Log the processed data

  const numberOfGroups = defectData.length;
  const baseBarWidth = 80;
  const minBarWidth = 40;
  const maxBarWidth = 100;
  const calculatedBarWidth = Math.min(
    maxBarWidth,
    Math.max(minBarWidth, baseBarWidth - numberOfGroups * 0.3)
  );
  const categoryPercentage =
    numberOfGroups > 15 ? 0.5 : numberOfGroups > 5 ? 0.7 : 0.9;
  const barPercentage =
    numberOfGroups > 15 ? 0.7 : numberOfGroups > 5 ? 0.8 : 0.9;
  const spacePerBar = calculatedBarWidth + 15;
  const chartWidth = Math.max(600, numberOfGroups * spacePerBar);
  const maxTotalDefectRate =
    defectData.length > 0
      ? Math.max(...defectData.map((d) => d.totalDefectRate))
      : 0;
  const maxReworkNameDefectRate =
    defectData.length > 0 && filters.reworkName
      ? Math.max(...defectData.map((d) => d.reworkNameDefectRate || 0))
      : 0;
  const yAxisMax = Math.max(maxTotalDefectRate, maxReworkNameDefectRate) + 2;

  const barChartData = {
    labels: defectData.map((d) => d.group),
    datasets: [
      {
        label: "Total Defect Rate (%)",
        data: defectData.map((d) => d.totalDefectRate),
        backgroundColor: defectData.map((d) =>
          d.totalDefectRate > 5
            ? "#cc0000"
            : d.totalDefectRate >= 3
            ? "#e68a00"
            : "#006600"
        ),
        categoryPercentage: categoryPercentage,
        barPercentage: barPercentage,
      },
      ...(filters.reworkName
        ? [
            {
              label: `${filters.reworkName} Defect Rate (%)`,
              data: defectData.map((d) => d.reworkNameDefectRate),
              backgroundColor: defectData.map((d) =>
                d.reworkNameDefectRate > 5
                  ? "rgba(255, 99, 132, 0.6)"
                  : d.reworkNameDefectRate >= 3
                  ? "rgba(255, 159, 64, 0.6)"
                  : "rgba(75, 192, 192, 0.6)"
              ),
              categoryPercentage: categoryPercentage,
              barPercentage: barPercentage,
            },
          ]
        : []),
    ],
  };

  const barChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        max: yAxisMax,
        title: { display: true, text: "Defect Rate (%)" },
        grid: {
          display: false,
        },
      },
      x: {
        ticks: {
          autoSkip: false,
        },
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      datalabels: {
        anchor: "end",
        align: "top",
        formatter: (value) => value.toFixed(2) + "%",
        color: "#000",
        font: {
          weight: "bold",
          size: 12,
        },
      },
      annotation: {
        annotations: {
          line1: {
            type: "line",
            yMin: 5,
            yMax: 5,
            borderColor: "#cc0000",
            borderWidth: 2,
            borderDash: [5, 5],
          },
          line2: {
            type: "line",
            yMin: 3,
            yMax: 3,
            borderColor: "#e68a00",
            borderWidth: 2,
            borderDash: [5, 5],
          },
        },
      },
    },
    maintainAspectRatio: false,
    backgroundColor: "#f0f0f0",
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-700">
          Defect Rate by{" "}
          {groupBy === "WorkLine"
            ? "Line No"
            : groupBy === "MONo"
            ? "MO No"
            : groupBy === "ColorName"
            ? "Color"
            : groupBy === "SizeName"
            ? "Size"
            : groupBy}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setGroupBy("WorkLine")}
            className={`px-3 py-1 rounded text-sm font-medium transition duration-300 ${
              groupBy === "WorkLine"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setGroupBy("MONo")}
            className={`px-3 py-1 rounded text-sm font-medium transition duration-300 ${
              groupBy === "MONo"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            MO No
          </button>
          <button
            onClick={() => setGroupBy("Buyer")}
            className={`px-3 py-1 rounded text-sm font-medium transition duration-300 ${
              groupBy === "Buyer"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Buyer
          </button>
          <button
            onClick={() => setGroupBy("ColorName")}
            className={`px-3 py-1 rounded text-sm font-medium transition duration-300 ${
              groupBy === "ColorName"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Color
          </button>
          <button
            onClick={() => setGroupBy("SizeName")}
            className={`px-3 py-1 rounded text-sm font-medium transition duration-300 ${
              groupBy === "SizeName"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Size
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div style={{ width: `${chartWidth}px`, height: "400px" }}>
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>
    </div>
  );
};

export default SunriseLineBarChart;
