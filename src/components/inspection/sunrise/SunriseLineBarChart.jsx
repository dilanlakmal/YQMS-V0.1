import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import FindBuyer from "./FindBuyer"; // Import FindBuyer to determine Buyer from MONo

const SunriseLineBarChart = ({ filteredData }) => {
  const [groupBy, setGroupBy] = useState("WorkLine"); // Default to WorkLine

  const defectRateByGroup = () => {
    const groupData = {};
    filteredData.forEach((row) => {
      // Determine the key based on the selected grouping
      let key;
      if (groupBy === "WorkLine") {
        key = row.WorkLine || "Unknown Line";
      } else if (groupBy === "MONo") {
        key = row.MONo || "Unknown MO";
      } else if (groupBy === "Buyer") {
        key = FindBuyer({ moNo: row.MONo }) || "Unknown Buyer";
      }

      if (!groupData[key]) {
        groupData[key] = { checked: 0, defects: 0 };
      }
      groupData[key].checked += row.CheckedQty;
      groupData[key].defects += row.DefectsQty;
    });

    return Object.entries(groupData)
      .map(([group, data]) => ({
        group,
        defectRate: data.checked === 0 ? 0 : (data.defects / data.checked) * 100
      }))
      .sort((a, b) => b.defectRate - a.defectRate);
  };

  const defectData = defectRateByGroup();
  const numberOfGroups = defectData.length;

  // Dynamically calculate bar width and spacing based on the number of groups
  const baseBarWidth = 80; // Further increased base width for thicker bars
  const minBarWidth = 40; // Further increased minimum bar width
  const maxBarWidth = 100; // Further increased maximum bar width
  const calculatedBarWidth = Math.min(
    maxBarWidth,
    Math.max(minBarWidth, baseBarWidth - numberOfGroups * 0.3) // Further reduced the rate of width reduction
  );

  // Adjust categoryPercentage and barPercentage based on the number of groups
  const categoryPercentage =
    numberOfGroups > 15 ? 0.5 : numberOfGroups > 5 ? 0.7 : 0.9;
  const barPercentage =
    numberOfGroups > 15 ? 0.7 : numberOfGroups > 5 ? 0.8 : 0.9; // Further increased for thicker bars

  // Dynamically calculate chart width based on the number of groups
  const spacePerBar = calculatedBarWidth + 15; // Slightly reduced additional space to fit thicker bars
  const chartWidth = Math.max(600, numberOfGroups * spacePerBar); // Minimum width 600px

  const barChartData = {
    labels: defectData.map((d) => d.group),
    datasets: [
      {
        label: "Defect Rate (%)",
        data: defectData.map((d) => d.defectRate),
        backgroundColor: defectData.map((d) =>
          d.defectRate > 5
            ? "#cc0000"
            : d.defectRate >= 3
            ? "#e68a00"
            : "#006600"
        ),
        categoryPercentage: categoryPercentage,
        barPercentage: barPercentage
      }
    ]
  };

  const barChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Defect Rate (%)" },
        grid: {
          display: false // Remove horizontal grid lines
        }
      },
      x: {
        ticks: {
          autoSkip: false // Prevent skipping labels to ensure all are available for scrolling
        },
        grid: {
          display: false // Remove vertical grid lines
        }
      }
    },
    plugins: {
      legend: { display: false },
      datalabels: {
        anchor: "end",
        align: "top",
        formatter: (value) => value.toFixed(2) + "%",
        color: "#000",
        font: {
          weight: "bold",
          size: 12
        }
      },
      annotation: {
        annotations: {
          line1: {
            type: "line",
            yMin: 5,
            yMax: 5,
            borderColor: "#cc0000",
            borderWidth: 2,
            borderDash: [5, 5]
          },
          line2: {
            type: "line",
            yMin: 3,
            yMax: 3,
            borderColor: "#e68a00",
            borderWidth: 2,
            borderDash: [5, 5]
          }
        }
      }
    },
    maintainAspectRatio: false, // Allow the chart to stretch to fit the container
    backgroundColor: "#f0f0f0" // Light gray background for the chart
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-700">
          Defect Rate by {groupBy === "WorkLine" ? "Line No" : groupBy}
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
