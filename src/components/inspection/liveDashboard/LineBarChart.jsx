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
import { ArrowsUpDownIcon } from "@heroicons/react/24/outline"; // Sort icon
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

const LineBarChart = ({ filters }) => {
  const [moDefectRates, setMoDefectRates] = useState([]);
  const [sortOption, setSortOption] = useState("Defect Rate"); // Default sort by Defect Rate
  const [showSortOptions, setShowSortOptions] = useState(false); // Toggle sort options dropdown

  // Fetch defect rates by Line No and aggregate duplicates
  const fetchMoDefectRates = async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-mo-summaries`, {
        params: filters
      });

      // Aggregate data by Line No to ensure uniqueness and sum defectQty and checkedQty
      const aggregatedData = response.data.reduce((acc, item) => {
        const lineNo = item.lineNo || "N/A";
        const defectQty = item.defectsQty || 0;
        const checkedQty = item.checkedQty || 0;

        if (!acc[lineNo]) {
          acc[lineNo] = {
            lineNo,
            totalDefectQty: 0,
            totalCheckedQty: 0,
            count: 0
          };
        }
        acc[lineNo].totalDefectQty += defectQty;
        acc[lineNo].totalCheckedQty += checkedQty;
        acc[lineNo].count += 1;
        return acc;
      }, {});

      // Calculate defect rate for each Line No using totalDefectQty and totalCheckedQty
      const processedData = Object.values(aggregatedData).map((group) => ({
        lineNo: group.lineNo,
        defectQty: group.totalDefectQty,
        checkedQty: group.totalCheckedQty,
        defectRate:
          group.totalCheckedQty > 0
            ? (group.totalDefectQty / group.totalCheckedQty) * 100
            : 0 // Calculate defect rate as percentage
      }));

      setMoDefectRates(processedData);
    } catch (error) {
      console.error("Error fetching MO defect rates:", error);
      setMoDefectRates([]);
    }
  };

  useEffect(() => {
    fetchMoDefectRates(filters);

    // Live update with socket.io
    const intervalId = setInterval(() => {
      fetchMoDefectRates(filters);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(intervalId);
  }, [filters]);

  // Sort the data based on the selected sort option and filter out entries with defectQty = 0
  const sortedData = [...moDefectRates]
    .filter((item) => item.defectQty > 0) // Only include entries with defectQty > 0
    .sort((a, b) => {
      if (sortOption === "Line No") {
        const aLineNo = a.lineNo;
        const bLineNo = b.lineNo;

        // Check if Line No is numeric
        const aIsNumeric = !isNaN(aLineNo) && aLineNo !== "N/A";
        const bIsNumeric = !isNaN(bLineNo) && bLineNo !== "N/A";

        if (aIsNumeric && bIsNumeric) {
          // Both are numeric, sort numerically
          return Number(aLineNo) - Number(bLineNo);
        } else if (aIsNumeric && !bIsNumeric) {
          // Numeric comes before non-numeric
          return -1;
        } else if (!aIsNumeric && bIsNumeric) {
          // Non-numeric comes after numeric
          return 1;
        } else {
          // Both non-numeric, sort alphabetically
          return aLineNo.localeCompare(bLineNo);
        }
      } else {
        // Sort by Defect Rate (highest to lowest)
        return b.defectRate - a.defectRate;
      }
    });

  // Determine the maximum defect rate for the Y-axis
  const maxDefectRateValue =
    sortedData.length > 0
      ? Math.max(...sortedData.map((item) => item.defectRate), 3) + 2 // Ensure KPI line at 3% is visible
      : 10;

  // Chart data
  const chartData = {
    labels: sortedData.map((item) => item.lineNo),
    datasets: [
      {
        label: "Defect Rate (%)",
        data: sortedData.map((item) => item.defectRate.toFixed(2)),
        backgroundColor: sortedData.map((item) => {
          const rate = item.defectRate;
          if (rate > 3) return "rgba(220, 20, 60, 0.8)"; // Dark Red
          if (rate >= 2 && rate <= 3) return "rgba(255, 165, 0, 0.8)"; // Orange
          return "rgba(0, 128, 0, 0.8)"; // Green
        }),
        borderColor: sortedData.map((item) => {
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
        right: 10, // Increased padding to ensure the label is fully visible
        top: 20 // Add padding to the top for better spacing
      }
    },
    scales: {
      x: {
        ticks: {
          color: "black",
          autoSkip: false,
          maxRotation: 0, // No angle for Line No labels
          minRotation: 0
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
              xAdjust: 10, // Adjusted to ensure the label is fully visible
              yAdjust: 0 // Keep the label aligned with the line
            }
          }
        ]
      }
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full relative">
      {/* Sort Button in Top-Right Corner */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowSortOptions(!showSortOptions)}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 focus:outline-none"
          title="Sort Options"
        >
          <ArrowsUpDownIcon className="h-5 w-5 text-gray-700" />
        </button>
        {showSortOptions && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-10">
            <button
              onClick={() => {
                setSortOption("Line No");
                setShowSortOptions(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm ${
                sortOption === "Line No"
                  ? "bg-blue-100 text-blue-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Sort by Line No
            </button>
            <button
              onClick={() => {
                setSortOption("Defect Rate");
                setShowSortOptions(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm ${
                sortOption === "Defect Rate"
                  ? "bg-blue-100 text-blue-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Sort by Defect Rate
            </button>
          </div>
        )}
      </div>

      <div className="w-full h-[450px] relative">
        {sortedData.length === 0 ? (
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

export default LineBarChart;
