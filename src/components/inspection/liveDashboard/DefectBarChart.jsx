import React, { useState } from "react";
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
import { BarChart, Table as TableIcon } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const DefectBarChart = ({ defectRates }) => {
  const [viewMode, setViewMode] = useState("chart");

  const maxDefectRateValue =
    defectRates.length > 0
      ? Math.max(...defectRates.map((item) => item.defectRate * 100)) + 2
      : 10;

  const chartData = {
    labels: defectRates.map((item) => item.defectName),
    datasets: [
      {
        label: "Defect Rate (%)",
        data: defectRates.map((item) => (item.defectRate * 100).toFixed(2)),
        backgroundColor: defectRates.map((item) => {
          const rate = item.defectRate * 100;
          if (rate > 3) return "rgba(220,20,60,0.8)"; // Dark Red
          if (rate >= 2 && rate <= 3) return "rgba(255,165,0,0.8)"; // Orange
          return "rgba(0,128,0,0.8)"; // Green
        }),
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: "black", autoSkip: false },
        grid: { display: false }
      },
      y: {
        max: maxDefectRateValue,
        grid: { display: false },
        beginAtZero: true
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
    <div className="bg-white shadow-md rounded-lg p-6 overflow-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setViewMode("chart")}
          className={`mr-2 p-2 rounded ${
            viewMode === "chart" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          <BarChart className="text-gray-700" />
        </button>
        <button
          onClick={() => setViewMode("table")}
          className={`p-2 rounded ${
            viewMode === "table" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          <TableIcon className="text-gray-700" />
        </button>
      </div>
      {viewMode === "chart" ? (
        <div style={{ height: "450px", width: "100%" }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="overflow-y-auto" style={{ maxHeight: "450px" }}>
          <table className="min-w-full bg-white border-collapse block md:table">
            <thead className="bg-blue-100">
              <tr>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-left block md:table-cell">
                  Defect Name
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-left block md:table-cell">
                  Rank
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-left block md:table-cell">
                  Defect Qty
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-left block md:table-cell">
                  Defect Rate (%)
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-left block md:table-cell">
                  Level
                </th>
              </tr>
            </thead>
            <tbody>
              {defectRates.map((item) => (
                <tr key={item.defectName} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b border-gray-200 block md:table-cell">
                    {item.defectName}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 block md:table-cell">
                    {item.rank}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 block md:table-cell">
                    {item.totalCount}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 block md:table-cell">
                    {(item.defectRate * 100).toFixed(2)}%
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 block md:table-cell">
                    {item.defectRate * 100 > 5 ? (
                      <span className="text-red-500 animate-ping">●</span>
                    ) : item.defectRate * 100 >= 1 &&
                      item.defectRate * 100 <= 5 ? (
                      <span className="text-orange-500">●</span>
                    ) : (
                      <span className="text-green-500">●</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DefectBarChart;
