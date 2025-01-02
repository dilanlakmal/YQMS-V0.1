import React from "react";
import Header from "../components/inspection/Header";
import Summary from "../components/inspection/Summary";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { defectsList } from "../constants/defects";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Analytics({ savedState, defects, checkedQuantity }) {
  const { inspectionData } = savedState || {};

  // Calculate defect rates
  const defectEntries = Object.entries(defects)
    .filter(([_, count]) => count > 0)
    .map(([index, count]) => ({
      name: defectsList.english[index].name,
      rate:
        checkedQuantity > 0 ? ((count / checkedQuantity) * 100).toFixed(2) : 0,
    }));

  // Prepare data for the bar chart
  const chartData = {
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

  const chartOptions = {
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

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-8xl mx-auto px-4 pt-4">
        <Header inspectionData={inspectionData} />
        <div className="mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Defect Rate by Defect Name
            </h2>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
        <div className="mt-8">
          <Summary
            defects={defects}
            checkedQuantity={checkedQuantity}
            goodOutput={savedState?.goodOutput || 0}
            defectPieces={savedState?.defectPieces || 0}
            returnDefectQty={savedState?.returnDefectQty || 0}
          />
        </div>
      </div>
    </div>
  );
}

export default Analytics;
