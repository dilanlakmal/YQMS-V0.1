import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import annotationPlugin from "chartjs-plugin-annotation";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import DailyTrendPop from "./DailyTrendPop";

// Register Chart.js components and plugins
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
  annotationPlugin
);

const DailySummaryTrend = ({ filters }) => {
  const [dailyData, setDailyData] = useState([]);
  const [popUpData, setPopUpData] = useState(null);
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  // Fetch daily data from the server with applied filters
  const fetchDailyData = async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-mo-summaries`, {
        params: { ...filters, groupByDate: "true" }
      });

      // Process data to calculate defect rate and top 5 defects
      const processedData = response.data.map((day) => {
        const defectRate =
          day.checkedQty > 0 ? (day.defectsQty / day.checkedQty) * 100 : 0;

        // Aggregate defects by name and calculate defect rate for each defect
        const defectCounts = {};
        day.defectArray.forEach((defect) => {
          if (defect.defectName) {
            defectCounts[defect.defectName] =
              (defectCounts[defect.defectName] || 0) + defect.totalCount;
          }
        });
        const topDefects = Object.entries(defectCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({
            name,
            count,
            defectRate: day.checkedQty > 0 ? (count / day.checkedQty) * 100 : 0
          }));

        return { ...day, defectRate, topDefects };
      });

      setDailyData(processedData);
    } catch (error) {
      console.error("Error fetching daily summary data:", error);
      setDailyData([]);
    }
  };

  useEffect(() => {
    fetchDailyData(filters);
  }, [filters]);

  // Determine fill color based on defect rate
  const getPointColor = (defectRate) => {
    if (defectRate > 3) return "#8B0000"; // Dark red
    if (defectRate >= 2 && defectRate <= 3) return "#FFA500"; // Orange
    return "#006400"; // Dark green
  };

  // Chart data configuration
  const chartData = {
    labels: dailyData.map((d) => d.inspection_date),
    datasets: [
      {
        label: "Defect Rate (%)",
        data: dailyData.map((d) => d.defectRate),
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        fill: false,
        tension: 0.3,
        pointStyle: "circle",
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: dailyData.map((d) => getPointColor(d.defectRate)),
        pointBorderColor: dailyData.map((d) => getPointColor(d.defectRate)),
        datalabels: {
          align: "top",
          anchor: "end",
          formatter: (value) => `${value.toFixed(2)}%`,
          color: "#333",
          font: { size: 12, weight: "bold" }
        }
      }
    ]
  };

  // Chart options with KPI line and enhanced styling
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          font: { size: 14, weight: "bold" },
          color: "#333"
        }
      },
      tooltip: { enabled: false }, // Disable default tooltip
      datalabels: { display: true },
      annotation: {
        annotations: [
          {
            type: "line",
            scaleID: "y",
            value: 3,
            borderColor: "red",
            borderWidth: 2,
            borderDash: [5, 5], // Dotted line
            label: {
              content: "KPI = 3%",
              enabled: true,
              position: "center",
              backgroundColor: "rgba(255, 99, 132, 0.8)",
              color: "#fff",
              font: { size: 12, weight: "bold" }
            }
          }
        ]
      }
    },
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "Inspection Date",
          font: { size: 14, weight: "bold" },
          color: "#333"
        },
        ticks: { color: "#333", font: { size: 12 } },
        grid: { display: false } // Remove gridlines
      },
      y: {
        title: {
          display: true,
          text: "Defect Rate (%)",
          font: { size: 14, weight: "bold" },
          color: "#333"
        },
        ticks: { color: "#333", font: { size: 12 } },
        grid: { display: false }, // Remove gridlines
        beginAtZero: true,
        suggestedMax: Math.max(...dailyData.map((d) => d.defectRate), 3) + 1
      }
    }
  };

  // Handle mouse move to show/hide pop-up with dynamic positioning
  const handleMouseMove = (event) => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (chart && container) {
      const elements = chart.getElementsAtEventForMode(
        event,
        "nearest",
        { intersect: true },
        false
      );
      if (elements.length > 0) {
        const element = elements[0];
        const index = element.index;
        const date = chartData.labels[index];
        const data = dailyData.find((d) => d.inspection_date === date);

        // Get chart canvas position and dimensions
        const chartRect = chart.canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Mouse position relative to the chart
        let x = event.clientX - chartRect.left;
        let y = event.clientY - chartRect.top;

        // Pop-up dimensions
        const popupWidth = 400; // Width of the pop-up
        const popupHeight = 250; // Approximate height of the pop-up

        // Determine if the mouse is on the left or right half of the chart
        const chartMidpoint = chartRect.width / 2;
        const mouseXRelative = x;

        // Adjust X position based on mouse location
        if (mouseXRelative > chartMidpoint) {
          // Mouse is on the right side, position pop-up to the left
          x -= popupWidth + 10; // Place pop-up to the left of the marker with padding
        } else {
          // Mouse is on the left side, position pop-up to the right
          x += 10; // Place pop-up to the right of the marker with padding
        }

        // Ensure X stays within container bounds
        if (x + popupWidth > containerRect.width) {
          x = containerRect.width - popupWidth - 10; // Align to the right with padding
        } else if (x < 0) {
          x = 10; // Align to the left with padding
        }

        // Adjust Y position to ensure the pop-up stays within the container
        if (y + popupHeight > containerRect.height) {
          y = containerRect.height - popupHeight - 10; // Align to the bottom with padding
        } else if (y < 0) {
          y = 10; // Align to the top with padding
        }

        // Convert back to absolute coordinates
        x += chartRect.left - containerRect.left;
        y += chartRect.top - containerRect.top;

        setPopUpData({ date, x, y, data });
      } else {
        setPopUpData(null);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPopUpData(null)}
      style={{ position: "relative", height: "500px" }}
    >
      <Line ref={chartRef} data={chartData} options={chartOptions} />
      {popUpData && (
        <div
          style={{
            position: "absolute",
            left: `${popUpData.x}px`,
            top: `${popUpData.y}px`,
            zIndex: 1000
          }}
        >
          <DailyTrendPop date={popUpData.date} data={popUpData.data} />
        </div>
      )}
    </div>
  );
};

export default DailySummaryTrend;
