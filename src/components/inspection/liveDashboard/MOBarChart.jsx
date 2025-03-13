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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const MOBarChart = ({ filters }) => {
  const [moDefectRates, setMoDefectRates] = useState([]);

  // Fetch defect rates by MO No
  const fetchMoDefectRates = async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-mo-summaries`, {
        params: filters
      });
      // Sort by defectRate in descending order
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

  // Determine the maximum defect rate for the Y-axis
  const maxDefectRateValue =
    moDefectRates.length > 0
      ? Math.max(...moDefectRates.map((item) => item.defectRate)) + 2
      : 10;

  // Determine the angle of X-axis labels based on the number of MO Nos
  const moNoCount = moDefectRates.length;
  const xAxisLabelAngle = moNoCount > 10 ? 45 : moNoCount > 5 ? 30 : 0;

  // Chart data
  const chartData = {
    labels: moDefectRates.map((item) => item.moNo),
    datasets: [
      {
        label: "Defect Rate (%)",
        data: moDefectRates.map((item) => item.defectRate.toFixed(2)),
        backgroundColor: moDefectRates.map((item) => {
          const rate = item.defectRate;
          if (rate > 3) return "rgba(220,20,60,0.8)"; //Dark Red
          if (rate >= 2 && rate <= 3) return "rgba(255,165,0,0.8)"; // Orange
          return "rgba(0,128,0,0.8)"; // Green
        }),
        borderColor: moDefectRates.map((item) => {
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

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
        }
      },
      datalabels: { display: "auto" }
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full">
      <div className="w-full h-[450px] relative">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default MOBarChart;
