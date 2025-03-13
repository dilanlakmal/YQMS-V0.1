import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { ChevronDownIcon } from "@heroicons/react/24/outline"; // Dropdown icon
import annotationPlugin from "chartjs-plugin-annotation";

// Register Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
  annotationPlugin // Register Annotation plugin for KPI line
);

const MOBarChart = ({ filters }) => {
  const [moDefectRates, setMoDefectRates] = useState([]);
  const [displayLimit, setDisplayLimit] = useState("All"); // Default to show all
  const [showLimitOptions, setShowLimitOptions] = useState(false); // Toggle dropdown

  // Fetch defect rates by MO No
  const fetchMoDefectRates = async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-mo-summaries`, {
        params: filters
      });
      // Map and sort by defectRate in descending order
      const sortedData = response.data
        .map((item) => ({
          moNo: item.moNo,
          defectRate: item.defectRate * 100 // Convert to percentage
        }))
        .sort((a, b) => b.defectRate - a.defectRate);
      setMoDefectRates(sortedData);
    } catch (error) {
      console.error("Error fetching MO defect rates:", error);
      setMoDefectRates([]);
    }
  };

  useEffect(() => {
    fetchMoDefectRates(filters);

    // Live update with socket.io (already handled in LiveDashboard, just refetch with current filters)
    const intervalId = setInterval(() => {
      fetchMoDefectRates(filters);
    }, 5000); // Update every 5 seconds, matching LiveDashboard interval

    return () => clearInterval(intervalId);
  }, [filters]);

  // Filter data to only include MO Nos with defectRate > 0 and apply Top N limit
  const filteredData = [...moDefectRates].filter((item) => item.defectRate > 0); // Only include entries with defectRate > 0%

  const limitedData =
    displayLimit === "All"
      ? filteredData
      : filteredData.slice(0, parseInt(displayLimit)); // Apply Top N limit

  // Determine the maximum defect rate for the Y-axis
  const maxDefectRateValue =
    limitedData.length > 0
      ? Math.max(...limitedData.map((item) => item.defectRate), 3) + 2 // Ensure KPI line at 3% is visible
      : 10;

  // Determine the angle of X-axis labels based on the number of MO Nos
  const moNoCount = limitedData.length;
  const xAxisLabelAngle = moNoCount > 10 ? 45 : moNoCount > 5 ? 30 : 0;

  // Chart data
  const chartData = {
    labels: limitedData.map((item) => item.moNo),
    datasets: [
      {
        label: "Defect Rate (%)",
        data: limitedData.map((item) => item.defectRate.toFixed(2)),
        backgroundColor: limitedData.map((item) => {
          const rate = item.defectRate;
          if (rate > 3) return "rgba(220, 20, 60, 0.8)"; // Dark Red
          if (rate >= 2 && rate <= 3) return "rgba(255, 165, 0, 0.8)"; // Orange
          return "rgba(0, 128, 0, 0.8)"; // Green
        }),
        borderColor: limitedData.map((item) => {
          const rate = item.defectRate;
          if (rate > 3) return "rgba(255, 99, 132, 1)";
          if (rate >= 2 && rate <= 3) return "rgba(255, 206, 86, 1)";
          return "rgba(75, 192, 192, 1)";
        }),
        borderWidth: 1,
        datalabels: {
          anchor: "end",
          align: "top",
          color: "black",
          font: { weight: "bold", size: 12 },
          formatter: (value) => `${value}%`
        }
      }
    ]
  };

  // Chart options with KPI line
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 40, // Increased padding to ensure the label is fully visible
        top: 20 // Add padding to the top for better spacing
      }
    },
    scales: {
      x: {
        ticks: {
          color: "black",
          autoSkip: false,
          maxRotation: xAxisLabelAngle,
          minRotation: xAxisLabelAngle
        },
        grid: { display: false } // No vertical gridlines
      },
      y: {
        max: maxDefectRateValue,
        grid: { display: false }, // Remove horizontal gridlines
        beginAtZero: true,
        title: {
          display: true,
          text: "Defect Rate (%)",
          color: "black",
          font: { size: 14, weight: "bold" }
        }
        // ticks: {
        //   stepSize: 1 // Ensure the Y-axis has a step size that includes the 3% mark
        // }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
        }
      },
      datalabels: { display: "auto" },
      annotation: {
        annotations: [
          {
            type: "line",
            scaleID: "y", // Reference the Y-axis
            value: 3, // Position the line at 3% on the Y-axis
            borderColor: "rgba(0, 0, 255, 0.8)", // Blue color for KPI line
            borderWidth: 2,
            borderDash: [5, 5], // Dotted line
            label: {
              display: true, // Ensure the label is displayed
              content: "KPI = 3%",
              position: "end", // Position the label at the end of the line
              backgroundColor: "rgba(0, 0, 255, 0.8)",
              color: "white",
              font: {
                size: 12,
                weight: "bold"
              },
              padding: 6, // Increased padding for better readability
              xAdjust: 0, // Adjusted to ensure the label is fully visible
              yAdjust: 0 // Keep the label aligned with the line
            }
          }
        ]
      }
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full relative">
      {/* Top N Button in Top-Right Corner */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowLimitOptions(!showLimitOptions)}
          className="flex items-center p-2 rounded bg-gray-200 hover:bg-gray-300 focus:outline-none"
          title="Select Display Limit"
        >
          <span className="text-gray-700 text-sm mr-1">
            {displayLimit === "All" ? "All" : `Top ${displayLimit}`}
          </span>
          <ChevronDownIcon className="h-4 w-4 text-gray-700" />
        </button>
        {showLimitOptions && (
          <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
            <button
              onClick={() => {
                setDisplayLimit("5");
                setShowLimitOptions(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm ${
                displayLimit === "5"
                  ? "bg-blue-100 text-blue-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Top 5
            </button>
            <button
              onClick={() => {
                setDisplayLimit("10");
                setShowLimitOptions(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm ${
                displayLimit === "10"
                  ? "bg-blue-100 text-blue-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Top 10
            </button>
            <button
              onClick={() => {
                setDisplayLimit("All");
                setShowLimitOptions(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm ${
                displayLimit === "All"
                  ? "bg-blue-100 text-blue-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              All
            </button>
          </div>
        )}
      </div>

      <div className="w-full h-[450px] relative">
        {limitedData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <h2>No data available</h2>
          </div>
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
};

export default MOBarChart;
