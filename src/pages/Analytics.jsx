import React, { useState, useEffect } from "react";
import Header from "../components/inspection/Header";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  TimeScale,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { defectsList } from "../constants/defects";
import "chartjs-adapter-date-fns"; // For time formatting
import zoomPlugin from "chartjs-plugin-zoom"; // For zoom in/out
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationCircle,
  faEye,
  faCheck,
  faExchangeAlt,
  faChartLine,
  faChartBar,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  TimeScale,
  zoomPlugin
);

function Analytics({ savedState, defects, checkedQuantity, logsState }) {
  const { inspectionData } = savedState || {};
  const [selectedDefect, setSelectedDefect] = useState(null); // State for selected defect filter
  const [timeFilter, setTimeFilter] = useState("time"); // State for time filter (HR, Min, Time)

  // Format time to HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  // Calculate defect rates for the bar chart
  const defectEntries = Object.entries(defects)
    .filter(([_, count]) => count > 0)
    .map(([index, count]) => ({
      name: defectsList.english[index].name,
      rate:
        checkedQuantity > 0 ? ((count / checkedQuantity) * 100).toFixed(2) : 0,
    }));

  // Prepare data for the bar chart
  const barChartData = {
    labels: defectEntries.map((entry) => entry.name),
    datasets: [
      {
        label: "Defect Rate (%)",
        data: defectEntries.map((entry) => entry.rate),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Add data labels to the bar chart
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow custom height and width
    plugins: {
      datalabels: {
        anchor: "end",
        align: "top",
        formatter: (value) => `${value}%`, // Display defect rate as a percentage
      },
      legend: {
        display: false, // Hide legend for bar chart
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Defect Rate (%)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Defect Name",
        },
      },
    },
  };

  // Prepare data for the line chart (defect rate vs. time)
  const getLineChartData = () => {
    const cumulativeData = logsState.logs
      .filter((log) => log.type === "reject") // Only include "Reject" logs
      .map((log) => {
        const cumulativeChecked = log.cumulativeChecked; // Cumulative checked quantity
        const cumulativeDefects = log.cumulativeDefects; // Cumulative defect quantity
        const defectRate = (cumulativeDefects / cumulativeChecked) * 100; // Defect rate in percentage

        return {
          timestamp: log.timestamp, // Use the timestamp in seconds
          cumulativeChecked,
          cumulativeDefects,
          defectRate,
        };
      });

    // Debugging: Log cumulative values and defect rate only when data changes
    useEffect(() => {
      cumulativeData.forEach((data) => {
        console.log(
          `Timestamp: ${formatTime(data.timestamp)}, ` +
            `Cumulative Checked: ${data.cumulativeChecked}, ` +
            `Cumulative Defects: ${data.cumulativeDefects}, ` +
            `Defect Rate: ${data.defectRate.toFixed(2)}%`
        );
      });
    }, [cumulativeData]); // Only run when cumulativeData changes

    const labels = cumulativeData.map((data) => {
      const seconds = data.timestamp; // Use the timestamp in seconds
      switch (timeFilter) {
        case "hr":
          return Math.floor(seconds / 3600); // Hours
        case "min":
          return Math.floor(seconds / 60); // Minutes
        default:
          return formatTime(seconds); // HH:MM:SS
      }
    });

    const data = cumulativeData.map((data) => data.defectRate);

    return {
      labels,
      datasets: [
        {
          label: selectedDefect
            ? `Defect Rate for ${selectedDefect}`
            : "Total Defect Rate",
          data,
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderWidth: 2,
          fill: true,
        },
      ],
    };
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true, // Enable zoom with mouse wheel
          },
          pinch: {
            enabled: true, // Enable zoom with pinch gesture
          },
          mode: "x", // Zoom only on the X-axis
        },
        pan: {
          enabled: true, // Enable panning
          mode: "x", // Pan only on the X-axis
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Defect Rate (%)",
        },
        ticks: {
          callback: (value) => `${value}%`, // Display Y-axis values as percentages
        },
      },
      x: {
        title: {
          display: true,
          text:
            timeFilter === "hr"
              ? "Hour"
              : timeFilter === "min"
              ? "Minutes"
              : "Time (HH:MM:SS)",
        },
      },
    },
  };

  // Get unique defect names for the filter dropdown
  const defectNames = [
    ...new Set(
      Object.keys(defects).map((index) => defectsList.english[index].name)
    ),
  ];

  // Calculate summary values
  const totalDefects = Object.values(defects).reduce(
    (sum, count) => sum + count,
    0
  );
  const goodOutput = savedState?.goodOutput || 0;
  const defectPieces = savedState?.defectPieces || 0;
  const returnDefectQty = savedState?.returnDefectQty || 0;
  const defectRate =
    checkedQuantity > 0
      ? ((totalDefects / checkedQuantity) * 100).toFixed(2)
      : 0;
  const defectRatio =
    checkedQuantity > 0
      ? ((defectPieces / checkedQuantity) * 100).toFixed(2)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-8xl mx-auto px-4 pt-4">
        <Header inspectionData={inspectionData} />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mt-8">
          {/* Total Defects */}
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            <FontAwesomeIcon
              icon={faExclamationCircle}
              className="text-blue-500 text-2xl"
            />
            <div>
              <h3 className="text-lg font-medium">Total Defects</h3>
              <p className="text-xl font-semibold">{totalDefects}</p>
            </div>
          </div>

          {/* Checked Quantity */}
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            <FontAwesomeIcon icon={faEye} className="text-green-500 text-2xl" />
            <div>
              <h3 className="text-lg font-medium">Checked Qty</h3>
              <p className="text-xl font-semibold">{checkedQuantity}</p>
            </div>
          </div>

          {/* Good Output */}
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            <FontAwesomeIcon
              icon={faCheck}
              className="text-purple-500 text-2xl"
            />
            <div>
              <h3 className="text-lg font-medium">Good Output</h3>
              <p className="text-xl font-semibold">{goodOutput}</p>
            </div>
          </div>

          {/* Defect Pieces */}
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            <FontAwesomeIcon
              icon={faExclamationCircle}
              className="text-red-500 text-2xl"
            />
            <div>
              <h3 className="text-lg font-medium">Defect Pieces</h3>
              <p className="text-xl font-semibold">{defectPieces}</p>
            </div>
          </div>

          {/* Return Defect Qty */}
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            <FontAwesomeIcon
              icon={faExchangeAlt}
              className="text-yellow-500 text-2xl"
            />
            <div>
              <h3 className="text-lg font-medium">Return Defect #</h3>
              <p className="text-xl font-semibold">{returnDefectQty}</p>
            </div>
          </div>

          {/* Defect Rate */}
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            <FontAwesomeIcon
              icon={faChartLine}
              className="text-indigo-500 text-2xl"
            />
            <div>
              <h3 className="text-lg font-medium">Defect Rate</h3>
              <p className="text-xl font-semibold">{defectRate}%</p>
            </div>
          </div>

          {/* Defect Ratio */}
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            <FontAwesomeIcon
              icon={faChartBar}
              className="text-pink-500 text-2xl"
            />
            <div>
              <h3 className="text-lg font-medium">Defect Ratio</h3>
              <p className="text-xl font-semibold">{defectRatio}%</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mt-8">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Defect Rate by Defect Name
            </h2>
            <div style={{ height: "300px", width: "80%" }}>
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Defect Rate Over Time</h2>
              <div className="flex space-x-4">
                {/* Defect Name Filter */}
                <select
                  value={selectedDefect || ""}
                  onChange={(e) => setSelectedDefect(e.target.value || null)}
                  className="p-2 border border-gray-300 rounded-md shadow-sm"
                >
                  <option value="">All Defects</option>
                  {defectNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                {/* Time Filter */}
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md shadow-sm"
                >
                  <option value="time">Time (HH:MM:SS)</option>
                  <option value="min">Minutes</option>
                  <option value="hr">Hour</option>
                </select>
              </div>
            </div>
            <div style={{ height: "400px", width: "100%" }}>
              <Line data={getLineChartData()} options={lineChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
