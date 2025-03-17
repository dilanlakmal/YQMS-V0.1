// import React, { useEffect, useState, useRef } from "react";
// import { Line } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   LineElement,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   Title,
//   Tooltip,
//   Legend
// } from "chart.js";
// import ChartDataLabels from "chartjs-plugin-datalabels";
// import annotationPlugin from "chartjs-plugin-annotation";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../config";
// import WeeklyTrendPop from "./WeeklyTrendPop";

// // Register Chart.js components and plugins
// ChartJS.register(
//   LineElement,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   Title,
//   Tooltip,
//   Legend,
//   ChartDataLabels,
//   annotationPlugin
// );

// const WeeklySummaryTrend = ({ filters }) => {
//   const [weeklyData, setWeeklyData] = useState([]);
//   const [popUpData, setPopUpData] = useState(null);
//   const chartRef = useRef(null);
//   const containerRef = useRef(null);

//   const fetchWeeklyData = async (filters = {}) => {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/api/qc2-mo-summaries`, {
//         params: { ...filters, groupByWeek: "true" }
//       });

//       const processedData = response.data.map((week) => {
//         const defectRate =
//           week.checkedQty > 0 ? (week.defectsQty / week.checkedQty) * 100 : 0;
//         const topDefects = week.defectArray
//           .reduce((acc, curr) => {
//             curr.forEach((defect) => {
//               if (defect.defectName) {
//                 acc[defect.defectName] =
//                   (acc[defect.defectName] || 0) + defect.totalCount;
//               }
//             });
//             return acc;
//           }, {})
//           .map(([name, count]) => ({
//             name,
//             count,
//             defectRate:
//               week.checkedQty > 0 ? (count / week.checkedQty) * 100 : 0
//           }))
//           .sort((a, b) => b.count - a.count)
//           .slice(0, 5);

//         return {
//           ...week,
//           defectRate,
//           topDefects,
//           weekLabel: `W${week.weekInfo.weekNumber}: ${week.weekInfo.startDate}--${week.weekInfo.endDate}`
//         };
//       });

//       setWeeklyData(processedData);
//     } catch (error) {
//       console.error("Error fetching weekly summary data:", error);
//       setWeeklyData([]);
//     }
//   };

//   useEffect(() => {
//     fetchWeeklyData(filters);
//   }, [filters]);

//   const getPointColor = (defectRate) => {
//     if (defectRate > 3) return "#8B0000"; // Dark red
//     if (defectRate >= 2 && defectRate <= 3) return "#FFA500"; // Orange
//     return "#006400"; // Dark green
//   };

//   const chartData = {
//     labels: weeklyData.map((d) => d.weekLabel),
//     datasets: [
//       {
//         label: "Defect Rate (%)",
//         data: weeklyData.map((d) => d.defectRate),
//         borderColor: "rgba(75, 192, 192, 1)",
//         borderWidth: 2,
//         backgroundColor: "rgba(75, 192, 192, 0.1)",
//         fill: false,
//         tension: 0.3,
//         pointStyle: "circle",
//         pointRadius: 6,
//         pointHoverRadius: 8,
//         pointBackgroundColor: weeklyData.map((d) =>
//           getPointColor(d.defectRate)
//         ),
//         pointBorderColor: weeklyData.map((d) => getPointColor(d.defectRate)),
//         datalabels: {
//           align: "top",
//           anchor: "end",
//           formatter: (value) => `${value.toFixed(2)}%`,
//           color: "#333",
//           font: { size: 12, weight: "bold" }
//         }
//       }
//     ]
//   };

//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         display: true,
//         position: "top",
//         labels: {
//           font: { size: 14, weight: "bold" },
//           color: "#333"
//         }
//       },
//       tooltip: { enabled: false },
//       datalabels: { display: true },
//       annotation: {
//         annotations: [
//           {
//             type: "line",
//             scaleID: "y",
//             value: 3,
//             borderColor: "red",
//             borderWidth: 2,
//             borderDash: [5, 5],
//             label: {
//               content: "KPI = 3%",
//               enabled: true,
//               position: "center",
//               backgroundColor: "rgba(255, 99, 132, 0.8)",
//               color: "#fff",
//               font: { size: 12, weight: "bold" }
//             }
//           }
//         ]
//       }
//     },
//     scales: {
//       x: {
//         type: "category",
//         title: {
//           display: true,
//           text: "Week",
//           font: { size: 14, weight: "bold" },
//           color: "#333"
//         },
//         ticks: {
//           color: "#333",
//           font: { size: 10 }, // Small font for X-axis labels
//           padding: 5,
//           align: "center", // Align labels
//           maxRotation: 0,
//           minRotation: 0
//         },
//         grid: { display: false }
//       },
//       y: {
//         title: {
//           display: true,
//           text: "Defect Rate (%)",
//           font: { size: 14, weight: "bold" },
//           color: "#333"
//         },
//         ticks: { color: "#333", font: { size: 12 } },
//         grid: { display: false },
//         beginAtZero: true,
//         suggestedMax: Math.max(...weeklyData.map((d) => d.defectRate), 3) + 1
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     const chart = chartRef.current;
//     const container = containerRef.current;
//     if (chart && container) {
//       const elements = chart.getElementsAtEventForMode(
//         event,
//         "nearest",
//         { intersect: true },
//         false
//       );
//       if (elements.length > 0) {
//         const element = elements[0];
//         const index = element.index;
//         const weekLabel = chartData.labels[index];
//         const data = weeklyData.find((d) => d.weekLabel === weekLabel);

//         const chartRect = chart.canvas.getBoundingClientRect();
//         const containerRect = container.getBoundingClientRect();

//         let x = event.clientX - chartRect.left;
//         let y = event.clientY - chartRect.top;

//         const popupWidth = 400;
//         const popupHeight = 250;

//         const chartMidpoint = chartRect.width / 2;
//         const mouseXRelative = x;

//         if (mouseXRelative > chartMidpoint) {
//           x -= popupWidth + 10;
//         } else {
//           x += 10;
//         }

//         if (x + popupWidth > containerRect.width) {
//           x = containerRect.width - popupWidth - 10;
//         } else if (x < 0) {
//           x = 10;
//         }

//         if (y + popupHeight > containerRect.height) {
//           y = containerRect.height - popupHeight - 10;
//         } else if (y < 0) {
//           y = 10;
//         }

//         x += chartRect.left - containerRect.left;
//         y += chartRect.top - containerRect.top;

//         setPopUpData({ weekLabel, x, y, data });
//       } else {
//         setPopUpData(null);
//       }
//     }
//   };

//   return (
//     <div
//       ref={containerRef}
//       onMouseMove={handleMouseMove}
//       onMouseLeave={() => setPopUpData(null)}
//       style={{ position: "relative", height: "500px" }}
//     >
//       <Line ref={chartRef} data={chartData} options={chartOptions} />
//       {popUpData && (
//         <div
//           style={{
//             position: "absolute",
//             left: `${popUpData.x}px`,
//             top: `${popUpData.y}px`,
//             zIndex: 1000
//           }}
//         >
//           <WeeklyTrendPop
//             weekLabel={popUpData.weekLabel}
//             data={popUpData.data}
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default WeeklySummaryTrend;

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
import WeeklyTrendPop from "./WeeklyTrendPop";

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

const WeeklySummaryTrend = ({ filters }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [popUpData, setPopUpData] = useState(null);
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  const fetchWeeklyData = async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-mo-summaries`, {
        params: { ...filters, groupByWeek: "true" }
      });

      const processedData = response.data.map((week) => {
        const defectRate =
          week.checkedQty > 0 ? (week.defectsQty / week.checkedQty) * 100 : 0;

        // Fix: Properly process defectArray
        const defectsCount = week.defectArray.reduce((acc, defect) => {
          if (defect?.defectName) {
            acc[defect.defectName] =
              (acc[defect.defectName] || 0) + (defect.totalCount || 0);
          }
          return acc;
        }, {});

        const topDefects = Object.entries(defectsCount)
          .map(([name, count]) => ({
            name,
            count,
            defectRate:
              week.checkedQty > 0 ? (count / week.checkedQty) * 100 : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        return {
          ...week,
          defectRate,
          topDefects,
          weekLabel: `W${week.weekInfo.weekNumber}: ${week.weekInfo.startDate}--${week.weekInfo.endDate}`
        };
      });
      console.log("Processed data for chart:", processedData); // Debug log
      setWeeklyData(processedData);
    } catch (error) {
      console.error("Error fetching weekly summary data:", error);
      setWeeklyData([]);
    }
  };

  useEffect(() => {
    fetchWeeklyData(filters);
  }, [filters]);

  const getPointColor = (defectRate) => {
    if (defectRate > 3) return "#8B0000"; // Dark red
    if (defectRate >= 2 && defectRate <= 3) return "#FFA500"; // Orange
    return "#006400"; // Dark green
  };

  const chartData = {
    labels: weeklyData.map((d) => d.weekLabel),
    datasets: [
      {
        label: "Defect Rate (%)",
        data: weeklyData.map((d) => d.defectRate),
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        fill: false,
        tension: 0.3,
        pointStyle: "circle",
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: weeklyData.map((d) =>
          getPointColor(d.defectRate)
        ),
        pointBorderColor: weeklyData.map((d) => getPointColor(d.defectRate)),
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
      tooltip: { enabled: false },
      datalabels: { display: true },
      annotation: {
        annotations: [
          {
            type: "line",
            scaleID: "y",
            value: 3,
            borderColor: "red",
            borderWidth: 2,
            borderDash: [5, 5],
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
          text: "Week",
          font: { size: 14, weight: "bold" },
          color: "#333"
        },
        ticks: {
          color: "#333",
          font: { size: 10 },
          padding: 5,
          align: "center",
          maxRotation: 0,
          minRotation: 0
        },
        grid: { display: false }
      },
      y: {
        title: {
          display: true,
          text: "Defect Rate (%)",
          font: { size: 14, weight: "bold" },
          color: "#333"
        },
        ticks: { color: "#333", font: { size: 12 } },
        grid: { display: false },
        beginAtZero: true,
        suggestedMax: Math.max(...weeklyData.map((d) => d.defectRate), 3) + 1
      }
    }
  };

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
        const weekLabel = chartData.labels[index];
        const data = weeklyData.find((d) => d.weekLabel === weekLabel);

        const chartRect = chart.canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        let x = event.clientX - chartRect.left;
        let y = event.clientY - chartRect.top;

        const popupWidth = 400;
        const popupHeight = 250;

        const chartMidpoint = chartRect.width / 2;
        const mouseXRelative = x;

        if (mouseXRelative > chartMidpoint) {
          x -= popupWidth + 10;
        } else {
          x += 10;
        }

        if (x + popupWidth > containerRect.width) {
          x = containerRect.width - popupWidth - 10;
        } else if (x < 0) {
          x = 10;
        }

        if (y + popupHeight > containerRect.height) {
          y = containerRect.height - popupHeight - 10;
        } else if (y < 0) {
          y = 10;
        }

        x += chartRect.left - containerRect.left;
        y += chartRect.top - containerRect.top;

        setPopUpData({ weekLabel, x, y, data });
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
          <WeeklyTrendPop
            weekLabel={popUpData.weekLabel}
            data={popUpData.data}
          />
        </div>
      )}
    </div>
  );
};

export default WeeklySummaryTrend;
