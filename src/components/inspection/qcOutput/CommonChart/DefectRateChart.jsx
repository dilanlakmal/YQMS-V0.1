// ===== DefectRateChart.jsx =====
import React, { useState, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Activity } from "lucide-react";
import { getDefectRateColor } from "../CommonUI/defectRateutils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const DefectRateChart = ({ chartData }) => {
  const [activeView, setActiveView] = useState("Line");

  const dataForChart = useMemo(() => {
    const sourceMap = {
      Line: chartData.lineSummary,
      MO: chartData.moSummary,
      Buyer: chartData.buyerSummary
    };
    const source = sourceMap[activeView] || {};

    return (
      Object.entries(source)
        // --- FIX: Filter out invalid labels and provide a fallback ---
        .filter(([label]) => label && label !== "undefined" && label !== "null")
        .map(([label, values]) => ({
          label: label || "N/A", // Use 'N/A' if the label is still empty
          rate: values.checked > 0 ? (values.defects / values.checked) * 100 : 0
        }))
        .sort((a, b) => b.rate - a.rate)
    );
  }, [chartData, activeView]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `Defect Rate Analysis by ${activeView}`,
        font: { size: 16, weight: "bold" },
        color: document.documentElement.classList.contains("dark")
          ? "#E5E7EB"
          : "#1F2937",
        padding: 20
      },
      datalabels: {
        anchor: "end",
        align: "top",
        formatter: (value) => `${value.toFixed(2)}%`,
        font: { weight: "bold", size: 11 },
        color: document.documentElement.classList.contains("dark")
          ? "#D1D5DB"
          : "#4B5563"
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Defect Rate (%)",
          font: { size: 12, weight: "bold" },
          color: document.documentElement.classList.contains("dark")
            ? "#9CA3AF"
            : "#4B5563"
        },
        grid: {
          color: document.documentElement.classList.contains("dark")
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.05)"
        },
        ticks: {
          color: document.documentElement.classList.contains("dark")
            ? "#9CA3AF"
            : "#4B5563"
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: document.documentElement.classList.contains("dark")
            ? "#9CA3AF"
            : "#4B5563"
        }
      }
    }
  };

  const chartJSData = {
    labels: dataForChart.map((item) => item.label),
    datasets: [
      {
        label: "Defect Rate",
        data: dataForChart.map((item) => item.rate),
        backgroundColor: dataForChart.map((item) =>
          getDefectRateColor(item.rate, "bg")
        ),
        borderRadius: 8,
        borderSkipped: false
      }
    ]
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">
              Performance Analytics
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-1">
            {["Line", "MO", "Buyer"].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeView === view
                    ? "bg-white text-purple-600 shadow-lg"
                    : "text-white hover:bg-white/20"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-6 h-96">
        <Bar options={chartOptions} data={chartJSData} />
      </div>
    </div>
  );
};

export default DefectRateChart;
