// import React, { useState } from "react";
// import Header from "../components/inspection/Header";
// import Summary from "../components/inspection/Summary";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   LineElement,
//   PointElement,
// } from "chart.js";
// import { Bar, Line } from "react-chartjs-2";
// import { defectsList } from "../constants/defects";

// // Register Chart.js components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   LineElement,
//   PointElement
// );

// function Analytics({ savedState, defects, checkedQuantity, logsState }) {
//   const { inspectionData } = savedState || {};
//   const [selectedDefect, setSelectedDefect] = useState(null); // State for selected defect filter

//   // Calculate defect rates for the bar chart
//   const defectEntries = Object.entries(defects)
//     .filter(([_, count]) => count > 0)
//     .map(([index, count]) => ({
//       name: defectsList.english[index].name,
//       rate:
//         checkedQuantity > 0 ? ((count / checkedQuantity) * 100).toFixed(2) : 0,
//     }));

//   // Prepare data for the bar chart
//   const barChartData = {
//     labels: defectEntries.map((entry) => entry.name),
//     datasets: [
//       {
//         label: "Defect Rate (%)",
//         data: defectEntries.map((entry) => entry.rate),
//         backgroundColor: "rgba(75, 192, 192, 0.2)",
//         borderColor: "rgba(75, 192, 192, 1)",
//         borderWidth: 1,
//       },
//     ],
//   };

//   // Add data labels to the bar chart
//   const barChartOptions = {
//     responsive: true,
//     maintainAspectRatio: false, // Allow custom height and width
//     plugins: {
//       datalabels: {
//         anchor: "end",
//         align: "top",
//         formatter: (value) => `${value}%`, // Display defect rate as a percentage
//       },
//       legend: {
//         display: false, // Hide legend for bar chart
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: "Defect Rate (%)",
//         },
//       },
//       x: {
//         title: {
//           display: true,
//           text: "Defect Name",
//         },
//       },
//     },
//   };

//   // Prepare data for the line chart (defect rate vs. time)
//   const lineChartData = {
//     labels: logsState.logs.map((log) => log.timestamp), // Use timestamps from logs
//     datasets: [
//       {
//         label: selectedDefect
//           ? `Defect Rate for ${selectedDefect}`
//           : "Total Defect Rate",
//         data: logsState.logs.map((log) => {
//           if (selectedDefect) {
//             // Filter defect rate for the selected defect
//             const defectEntry = log.defectDetails?.find(
//               (defect) => defect.name === selectedDefect
//             );
//             return defectEntry
//               ? ((defectEntry.count / checkedQuantity) * 100).toFixed(2)
//               : 0;
//           } else {
//             // Calculate total defect rate
//             const totalDefects =
//               log.defectDetails?.reduce(
//                 (sum, defect) => sum + defect.count,
//                 0
//               ) || 0;
//             return ((totalDefects / checkedQuantity) * 100).toFixed(2);
//           }
//         }),
//         borderColor: "rgba(255, 99, 132, 1)",
//         backgroundColor: "rgba(255, 99, 132, 0.2)",
//         borderWidth: 2,
//         fill: true,
//       },
//     ],
//   };

//   const lineChartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         display: true,
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: "Defect Rate (%)",
//         },
//       },
//       x: {
//         title: {
//           display: true,
//           text: "Time",
//         },
//       },
//     },
//   };

//   // Get unique defect names for the filter dropdown
//   const defectNames = [...new Set(defectEntries.map((entry) => entry.name))];

//   return (
//     <div className="min-h-screen bg-gray-50 pt-16">
//       <div className="max-w-8xl mx-auto px-4 pt-4">
//         <Header inspectionData={inspectionData} />
//         <div className="mt-8">
//           {/* Filter Dropdown */}
//           <div className="mb-4">
//             <label
//               htmlFor="defectFilter"
//               className="block text-sm font-medium text-gray-700"
//             >
//               Filter by Defect:
//             </label>
//             <select
//               id="defectFilter"
//               value={selectedDefect || ""}
//               onChange={(e) => setSelectedDefect(e.target.value || null)}
//               className="mt-1 block w-1/4 p-2 border border-gray-300 rounded-md shadow-sm"
//             >
//               <option value="">All Defects</option>
//               {defectNames.map((name) => (
//                 <option key={name} value={name}>
//                   {name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Bar Chart */}
//           <div className="bg-white p-6 rounded-lg shadow-md mb-8">
//             <h2 className="text-xl font-semibold mb-4">
//               Defect Rate by Defect Name
//             </h2>
//             <div style={{ height: "300px", width: "80%" }}>
//               {" "}
//               {/* Custom height and width */}
//               <Bar data={barChartData} options={barChartOptions} />
//             </div>
//           </div>

//           {/* Line Chart */}
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <h2 className="text-xl font-semibold mb-4">
//               Defect Rate Over Time
//             </h2>
//             <div style={{ height: "300px", width: "80%" }}>
//               {" "}
//               {/* Custom height and width */}
//               <Line data={lineChartData} options={lineChartOptions} />
//             </div>
//           </div>
//         </div>
//         <div className="mt-8">
//           <Summary
//             defects={defects}
//             checkedQuantity={checkedQuantity}
//             goodOutput={savedState?.goodOutput || 0}
//             defectPieces={savedState?.defectPieces || 0}
//             returnDefectQty={savedState?.returnDefectQty || 0}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Analytics;

// import React, { useState } from "react";
// import Header from "../components/inspection/Header";
// import Summary from "../components/inspection/Summary";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   LineElement,
//   PointElement,
//   TimeScale,
// } from "chart.js";
// import { Bar, Line } from "react-chartjs-2";
// import { defectsList } from "../constants/defects";
// import "chartjs-adapter-date-fns"; // For time formatting
// import zoomPlugin from "chartjs-plugin-zoom"; // For zoom in/out

// // Register Chart.js components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   LineElement,
//   PointElement,
//   TimeScale,
//   zoomPlugin
// );

// function Analytics({ savedState, defects, checkedQuantity, logsState, timer }) {
//   const { inspectionData } = savedState || {};
//   const [selectedDefect, setSelectedDefect] = useState(null); // State for selected defect filter
//   const [timeFilter, setTimeFilter] = useState("time"); // State for time filter (HR, Min, Time)

//   // Format time to HH:MM:SS
//   const formatTime = (seconds) => {
//     const hrs = Math.floor(seconds / 3600);
//     const mins = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;
//     return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
//       2,
//       "0"
//     )}:${String(secs).padStart(2, "0")}`;
//   };

//   // Calculate defect rates for the bar chart
//   const defectEntries = Object.entries(defects)
//     .filter(([_, count]) => count > 0)
//     .map(([index, count]) => ({
//       name: defectsList.english[index].name,
//       rate:
//         checkedQuantity > 0 ? ((count / checkedQuantity) * 100).toFixed(2) : 0,
//     }));

//   // Prepare data for the bar chart
//   const barChartData = {
//     labels: defectEntries.map((entry) => entry.name),
//     datasets: [
//       {
//         label: "Defect Rate (%)",
//         data: defectEntries.map((entry) => entry.rate),
//         backgroundColor: "rgba(75, 192, 192, 0.2)",
//         borderColor: "rgba(75, 192, 192, 1)",
//         borderWidth: 1,
//       },
//     ],
//   };

//   // Add data labels to the bar chart
//   const barChartOptions = {
//     responsive: true,
//     maintainAspectRatio: false, // Allow custom height and width
//     plugins: {
//       datalabels: {
//         anchor: "end",
//         align: "top",
//         formatter: (value) => `${value}%`, // Display defect rate as a percentage
//       },
//       legend: {
//         display: false, // Hide legend for bar chart
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: "Defect Rate (%)",
//         },
//       },
//       x: {
//         title: {
//           display: true,
//           text: "Defect Name",
//         },
//       },
//     },
//   };

//   // Prepare data for the line chart (defect rate vs. time)
//   const lineChartData = {
//     labels: logsState.logs.map((log) => formatTime(log.timestamp)), // Use formatted time
//     datasets: [
//       {
//         label: selectedDefect
//           ? `Defect Rate for ${selectedDefect}`
//           : "Total Defect Rate",
//         data: logsState.logs.map((log) => {
//           if (selectedDefect) {
//             // Filter defect rate for the selected defect
//             const defectEntry = log.defectDetails?.find(
//               (defect) => defect.name === selectedDefect
//             );
//             return defectEntry
//               ? ((defectEntry.count / checkedQuantity) * 100).toFixed(2)
//               : 0;
//           } else {
//             // Calculate total defect rate
//             const totalDefects =
//               log.defectDetails?.reduce(
//                 (sum, defect) => sum + defect.count,
//                 0
//               ) || 0;
//             return ((totalDefects / checkedQuantity) * 100).toFixed(2);
//           }
//         }),
//         borderColor: "rgba(255, 99, 132, 1)",
//         backgroundColor: "rgba(255, 99, 132, 0.2)",
//         borderWidth: 2,
//         fill: true,
//       },
//     ],
//   };

//   const lineChartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         display: true,
//       },
//       zoom: {
//         zoom: {
//           wheel: {
//             enabled: true, // Enable zoom with mouse wheel
//           },
//           pinch: {
//             enabled: true, // Enable zoom with pinch gesture
//           },
//           mode: "x", // Zoom only on the X-axis
//         },
//         pan: {
//           enabled: true, // Enable panning
//           mode: "x", // Pan only on the X-axis
//         },
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: "Defect Rate (%)",
//         },
//         ticks: {
//           callback: (value) => `${value}%`, // Display Y-axis values as percentages
//         },
//       },
//       x: {
//         type: "time",
//         time: {
//           unit:
//             timeFilter === "hr"
//               ? "hour"
//               : timeFilter === "min"
//               ? "minute"
//               : "second",
//           displayFormats: {
//             hour: "HH",
//             minute: "HH:mm",
//             second: "HH:mm:ss",
//           },
//         },
//         title: {
//           display: true,
//           text:
//             timeFilter === "hr"
//               ? "Hour"
//               : timeFilter === "min"
//               ? "Minutes"
//               : "Time (HH:MM:SS)",
//         },
//       },
//     },
//   };

//   // Get unique defect names for the filter dropdown
//   const defectNames = [...new Set(defectEntries.map((entry) => entry.name))];

//   return (
//     <div className="min-h-screen bg-gray-50 pt-16">
//       <div className="max-w-8xl mx-auto px-4 pt-4">
//         <Header inspectionData={inspectionData} />
//         <div className="mt-8">
//           {/* Bar Chart */}
//           <div className="bg-white p-6 rounded-lg shadow-md mb-8">
//             <h2 className="text-xl font-semibold mb-4">
//               Defect Rate by Defect Name
//             </h2>
//             <div style={{ height: "300px", width: "80%" }}>
//               {" "}
//               {/* Custom height and width */}
//               <Bar data={barChartData} options={barChartOptions} />
//             </div>
//           </div>

//           {/* Line Chart */}
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold">Defect Rate Over Time</h2>
//               <div className="flex space-x-4">
//                 {/* Defect Name Filter */}
//                 <select
//                   value={selectedDefect || ""}
//                   onChange={(e) => setSelectedDefect(e.target.value || null)}
//                   className="p-2 border border-gray-300 rounded-md shadow-sm"
//                 >
//                   <option value="">All Defects</option>
//                   {defectNames.map((name) => (
//                     <option key={name} value={name}>
//                       {name}
//                     </option>
//                   ))}
//                 </select>
//                 {/* Time Filter */}
//                 <select
//                   value={timeFilter}
//                   onChange={(e) => setTimeFilter(e.target.value)}
//                   className="p-2 border border-gray-300 rounded-md shadow-sm"
//                 >
//                   <option value="time">Time (HH:MM:SS)</option>
//                   <option value="min">Minutes</option>
//                   <option value="hr">Hour</option>
//                 </select>
//               </div>
//             </div>
//             <div style={{ height: "400px", width: "100%" }}>
//               {" "}
//               {/* Custom height and width */}
//               <Line data={lineChartData} options={lineChartOptions} />
//             </div>
//           </div>
//         </div>
//         <div className="mt-8">
//           <Summary
//             defects={defects}
//             checkedQuantity={checkedQuantity}
//             goodOutput={savedState?.goodOutput || 0}
//             defectPieces={savedState?.defectPieces || 0}
//             returnDefectQty={savedState?.returnDefectQty || 0}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Analytics;

// import React, { useState } from "react";
// import Header from "../components/inspection/Header";
// import Summary from "../components/inspection/Summary";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   LineElement,
//   PointElement,
//   TimeScale,
// } from "chart.js";
// import { Bar, Line } from "react-chartjs-2";
// import { defectsList } from "../constants/defects";
// import "chartjs-adapter-date-fns"; // For time formatting
// import zoomPlugin from "chartjs-plugin-zoom"; // For zoom in/out

// // Register Chart.js components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   LineElement,
//   PointElement,
//   TimeScale,
//   zoomPlugin
// );

// function Analytics({ savedState, defects, checkedQuantity, logsState, timer }) {
//   const { inspectionData } = savedState || {};
//   const [selectedDefect, setSelectedDefect] = useState(null); // State for selected defect filter
//   const [timeFilter, setTimeFilter] = useState("time"); // State for time filter (HR, Min, Time)

//   // Format time to HH:MM:SS
//   const formatTime = (seconds) => {
//     const hrs = Math.floor(seconds / 3600);
//     const mins = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;
//     return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
//       2,
//       "0"
//     )}:${String(secs).padStart(2, "0")}`;
//   };

//   // Calculate defect rates for the bar chart
//   const defectEntries = Object.entries(defects)
//     .filter(([_, count]) => count > 0)
//     .map(([index, count]) => ({
//       name: defectsList.english[index].name,
//       rate:
//         checkedQuantity > 0 ? ((count / checkedQuantity) * 100).toFixed(2) : 0,
//     }));

//   // Prepare data for the bar chart
//   const barChartData = {
//     labels: defectEntries.map((entry) => entry.name),
//     datasets: [
//       {
//         label: "Defect Rate (%)",
//         data: defectEntries.map((entry) => entry.rate),
//         backgroundColor: "rgba(75, 192, 192, 0.2)",
//         borderColor: "rgba(75, 192, 192, 1)",
//         borderWidth: 1,
//       },
//     ],
//   };

//   // Add data labels to the bar chart
//   const barChartOptions = {
//     responsive: true,
//     maintainAspectRatio: false, // Allow custom height and width
//     plugins: {
//       datalabels: {
//         anchor: "end",
//         align: "top",
//         formatter: (value) => `${value}%`, // Display defect rate as a percentage
//       },
//       legend: {
//         display: false, // Hide legend for bar chart
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: "Defect Rate (%)",
//         },
//       },
//       x: {
//         title: {
//           display: true,
//           text: "Defect Name",
//         },
//       },
//     },
//   };

//   // Prepare data for the line chart (defect rate vs. time)
//   const getLineChartData = () => {
//     const labels = logsState.logs.map((log) => {
//       const seconds = log.timestamp; // Use the timestamp from logs
//       switch (timeFilter) {
//         case "hr":
//           return Math.floor(seconds / 3600); // Hours
//         case "min":
//           return Math.floor(seconds / 60); // Minutes
//         default:
//           return formatTime(seconds); // HH:MM:SS
//       }
//     });

//     const data = logsState.logs.map((log) => {
//       if (selectedDefect) {
//         // Filter defect rate for the selected defect
//         const defectEntry = log.defectDetails?.find(
//           (defect) => defect.name === selectedDefect
//         );
//         return defectEntry
//           ? ((defectEntry.count / checkedQuantity) * 100).toFixed(2)
//           : 0;
//       } else {
//         // Calculate total defect rate
//         const totalDefects =
//           log.defectDetails?.reduce((sum, defect) => sum + defect.count, 0) ||
//           0;
//         return ((totalDefects / checkedQuantity) * 100).toFixed(2);
//       }
//     });

//     return {
//       labels,
//       datasets: [
//         {
//           label: selectedDefect
//             ? `Defect Rate for ${selectedDefect}`
//             : "Total Defect Rate",
//           data,
//           borderColor: "rgba(255, 99, 132, 1)",
//           backgroundColor: "rgba(255, 99, 132, 0.2)",
//           borderWidth: 2,
//           fill: true,
//         },
//       ],
//     };
//   };

//   const lineChartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         display: true,
//       },
//       zoom: {
//         zoom: {
//           wheel: {
//             enabled: true, // Enable zoom with mouse wheel
//           },
//           pinch: {
//             enabled: true, // Enable zoom with pinch gesture
//           },
//           mode: "x", // Zoom only on the X-axis
//         },
//         pan: {
//           enabled: true, // Enable panning
//           mode: "x", // Pan only on the X-axis
//         },
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: "Defect Rate (%)",
//         },
//         ticks: {
//           callback: (value) => `${value}%`, // Display Y-axis values as percentages
//         },
//       },
//       x: {
//         title: {
//           display: true,
//           text:
//             timeFilter === "hr"
//               ? "Hour"
//               : timeFilter === "min"
//               ? "Minutes"
//               : "Time (HH:MM:SS)",
//         },
//       },
//     },
//   };

//   // Get unique defect names for the filter dropdown
//   const defectNames = [...new Set(defectEntries.map((entry) => entry.name))];

//   return (
//     <div className="min-h-screen bg-gray-50 pt-16">
//       <div className="max-w-8xl mx-auto px-4 pt-4">
//         <Header inspectionData={inspectionData} />
//         <div className="mt-8">
//           {/* Bar Chart */}
//           <div className="bg-white p-6 rounded-lg shadow-md mb-8">
//             <h2 className="text-xl font-semibold mb-4">
//               Defect Rate by Defect Name
//             </h2>
//             <div style={{ height: "300px", width: "80%" }}>
//               {" "}
//               {/* Custom height and width */}
//               <Bar data={barChartData} options={barChartOptions} />
//             </div>
//           </div>

//           {/* Line Chart */}
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold">Defect Rate Over Time</h2>
//               <div className="flex space-x-4">
//                 {/* Defect Name Filter */}
//                 <select
//                   value={selectedDefect || ""}
//                   onChange={(e) => setSelectedDefect(e.target.value || null)}
//                   className="p-2 border border-gray-300 rounded-md shadow-sm"
//                 >
//                   <option value="">All Defects</option>
//                   {defectNames.map((name) => (
//                     <option key={name} value={name}>
//                       {name}
//                     </option>
//                   ))}
//                 </select>
//                 {/* Time Filter */}
//                 <select
//                   value={timeFilter}
//                   onChange={(e) => setTimeFilter(e.target.value)}
//                   className="p-2 border border-gray-300 rounded-md shadow-sm"
//                 >
//                   <option value="time">Time (HH:MM:SS)</option>
//                   <option value="min">Minutes</option>
//                   <option value="hr">Hour</option>
//                 </select>
//               </div>
//             </div>
//             <div style={{ height: "400px", width: "100%" }}>
//               {" "}
//               {/* Custom height and width */}
//               <Line data={getLineChartData()} options={lineChartOptions} />
//             </div>
//           </div>
//         </div>
//         <div className="mt-8">
//           <Summary
//             defects={defects}
//             checkedQuantity={checkedQuantity}
//             goodOutput={savedState?.goodOutput || 0}
//             defectPieces={savedState?.defectPieces || 0}
//             returnDefectQty={savedState?.returnDefectQty || 0}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// // export default Analytics;

// import React, { useState } from "react";
// import Header from "../components/inspection/Header";
// import Summary from "../components/inspection/Summary";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   LineElement,
//   PointElement,
//   TimeScale,
// } from "chart.js";
// import { Bar, Line } from "react-chartjs-2";
// import { defectsList } from "../constants/defects";
// import "chartjs-adapter-date-fns"; // For time formatting
// import zoomPlugin from "chartjs-plugin-zoom"; // For zoom in/out

// // Register Chart.js components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   LineElement,
//   PointElement,
//   TimeScale,
//   zoomPlugin
// );

// function Analytics({ savedState, defects, checkedQuantity, logsState, timer }) {
//   const { inspectionData } = savedState || {};
//   const [selectedDefect, setSelectedDefect] = useState(null); // State for selected defect filter
//   const [timeFilter, setTimeFilter] = useState("time"); // State for time filter (HR, Min, Time)

//   // Format time to HH:MM:SS
//   const formatTime = (seconds) => {
//     const hrs = Math.floor(seconds / 3600);
//     const mins = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;
//     return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
//       2,
//       "0"
//     )}:${String(secs).padStart(2, "0")}`;
//   };

//   // Calculate defect rates for the bar chart
//   const defectEntries = Object.entries(defects)
//     .filter(([_, count]) => count > 0)
//     .map(([index, count]) => ({
//       name: defectsList.english[index].name,
//       rate:
//         checkedQuantity > 0 ? ((count / checkedQuantity) * 100).toFixed(2) : 0,
//     }));

//   // Prepare data for the bar chart
//   const barChartData = {
//     labels: defectEntries.map((entry) => entry.name),
//     datasets: [
//       {
//         label: "Defect Rate (%)",
//         data: defectEntries.map((entry) => entry.rate),
//         backgroundColor: "rgba(75, 192, 192, 0.2)",
//         borderColor: "rgba(75, 192, 192, 1)",
//         borderWidth: 1,
//       },
//     ],
//   };

//   // Add data labels to the bar chart
//   const barChartOptions = {
//     responsive: true,
//     maintainAspectRatio: false, // Allow custom height and width
//     plugins: {
//       datalabels: {
//         anchor: "end",
//         align: "top",
//         formatter: (value) => `${value}%`, // Display defect rate as a percentage
//       },
//       legend: {
//         display: false, // Hide legend for bar chart
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: "Defect Rate (%)",
//         },
//       },
//       x: {
//         title: {
//           display: true,
//           text: "Defect Name",
//         },
//       },
//     },
//   };

//   // Calculate cumulative defect rates for the line chart
//   const getCumulativeDefectRates = () => {
//     const cumulativeData = [];
//     let cumulativeDefects = 0;
//     let cumulativeChecked = 0;

//     logsState.logs.forEach((log) => {
//       if (log.type === "reject") {
//         // Update cumulative defect and checked quantities
//         cumulativeDefects +=
//           log.defectDetails?.reduce((sum, defect) => sum + defect.count, 0) ||
//           0;
//         cumulativeChecked += 1; // Each reject log corresponds to one checked piece

//         // Calculate defect rate at this timestamp
//         const defectRate =
//           cumulativeChecked > 0
//             ? ((cumulativeDefects / cumulativeChecked) * 100).toFixed(2)
//             : 0;

//         // Add data point only if defect quantity increases
//         cumulativeData.push({
//           timestamp: log.timestamp,
//           defectRate: parseFloat(defectRate),
//         });
//       }
//     });

//     return cumulativeData;
//   };

//   // Prepare data for the line chart (defect rate vs. time)
//   const getLineChartData = () => {
//     const cumulativeData = getCumulativeDefectRates();

//     const labels = cumulativeData.map((data) => {
//       const seconds = data.timestamp; // Use the timestamp from logs
//       switch (timeFilter) {
//         case "hr":
//           return Math.floor(seconds / 3600); // Hours
//         case "min":
//           return Math.floor(seconds / 60); // Minutes
//         default:
//           return formatTime(seconds); // HH:MM:SS
//       }
//     });

//     const data = cumulativeData.map((data) => data.defectRate);

//     return {
//       labels,
//       datasets: [
//         {
//           label: selectedDefect
//             ? `Defect Rate for ${selectedDefect}`
//             : "Total Defect Rate",
//           data,
//           borderColor: "rgba(255, 99, 132, 1)",
//           backgroundColor: "rgba(255, 99, 132, 0.2)",
//           borderWidth: 2,
//           fill: true,
//         },
//       ],
//     };
//   };

//   const lineChartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         display: true,
//       },
//       zoom: {
//         zoom: {
//           wheel: {
//             enabled: true, // Enable zoom with mouse wheel
//           },
//           pinch: {
//             enabled: true, // Enable zoom with pinch gesture
//           },
//           mode: "x", // Zoom only on the X-axis
//         },
//         pan: {
//           enabled: true, // Enable panning
//           mode: "x", // Pan only on the X-axis
//         },
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: "Defect Rate (%)",
//         },
//         ticks: {
//           callback: (value) => `${value}%`, // Display Y-axis values as percentages
//         },
//       },
//       x: {
//         title: {
//           display: true,
//           text:
//             timeFilter === "hr"
//               ? "Hour"
//               : timeFilter === "min"
//               ? "Minutes"
//               : "Time (HH:MM:SS)",
//         },
//       },
//     },
//   };

//   // Get unique defect names for the filter dropdown
//   const defectNames = [
//     ...new Set(
//       Object.keys(defects).map((index) => defectsList.english[index].name)
//     ),
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50 pt-16">
//       <div className="max-w-8xl mx-auto px-4 pt-4">
//         <Header inspectionData={inspectionData} />
//         <div className="mt-8">
//           {/* Bar Chart */}
//           <div className="bg-white p-6 rounded-lg shadow-md mb-8">
//             <h2 className="text-xl font-semibold mb-4">
//               Defect Rate by Defect Name
//             </h2>
//             <div style={{ height: "300px", width: "80%" }}>
//               {" "}
//               {/* Custom height and width */}
//               <Bar data={barChartData} options={barChartOptions} />
//             </div>
//           </div>

//           {/* Line Chart */}
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold">Defect Rate Over Time</h2>
//               <div className="flex space-x-4">
//                 {/* Defect Name Filter */}
//                 <select
//                   value={selectedDefect || ""}
//                   onChange={(e) => setSelectedDefect(e.target.value || null)}
//                   className="p-2 border border-gray-300 rounded-md shadow-sm"
//                 >
//                   <option value="">All Defects</option>
//                   {defectNames.map((name) => (
//                     <option key={name} value={name}>
//                       {name}
//                     </option>
//                   ))}
//                 </select>
//                 {/* Time Filter */}
//                 <select
//                   value={timeFilter}
//                   onChange={(e) => setTimeFilter(e.target.value)}
//                   className="p-2 border border-gray-300 rounded-md shadow-sm"
//                 >
//                   <option value="time">Time (HH:MM:SS)</option>
//                   <option value="min">Minutes</option>
//                   <option value="hr">Hour</option>
//                 </select>
//               </div>
//             </div>
//             <div style={{ height: "400px", width: "100%" }}>
//               {" "}
//               {/* Custom height and width */}
//               <Line data={getLineChartData()} options={lineChartOptions} />
//             </div>
//           </div>
//         </div>
//         <div className="mt-8">
//           <Summary
//             defects={defects}
//             checkedQuantity={checkedQuantity}
//             goodOutput={savedState?.goodOutput || 0}
//             defectPieces={savedState?.defectPieces || 0}
//             returnDefectQty={savedState?.returnDefectQty || 0}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Analytics;

import React, { useState, useEffect } from "react";
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
  LineElement,
  PointElement,
  TimeScale,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { defectsList } from "../constants/defects";
import "chartjs-adapter-date-fns"; // For time formatting
import zoomPlugin from "chartjs-plugin-zoom"; // For zoom in/out

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

  //   const getLineChartData = () => {
  //     const cumulativeData = logsState.logs
  //       .filter((log) => log.type === "reject") // Only include "Reject" logs
  //       .map((log) => ({
  //         timestamp: log.timestamp, // Use the timestamp in seconds
  //         cumulativeChecked: log.cumulativeChecked, // Cumulative checked quantity
  //         cumulativeDefects: log.cumulativeDefects, // Cumulative defect quantity
  //         defectRate: (log.cumulativeDefects / log.cumulativeChecked) * 100, // Defect rate in percentage
  //       }));

  //     const labels = cumulativeData.map((data) => {
  //       const seconds = data.timestamp; // Use the timestamp in seconds
  //       switch (timeFilter) {
  //         case "hr":
  //           return Math.floor(seconds / 3600); // Hours
  //         case "min":
  //           return Math.floor(seconds / 60); // Minutes
  //         default:
  //           return formatTime(seconds); // HH:MM:SS
  //       }
  //     });

  //     const data = cumulativeData.map((data) => data.defectRate);

  //     return {
  //       labels,
  //       datasets: [
  //         {
  //           label: selectedDefect
  //             ? `Defect Rate for ${selectedDefect}`
  //             : "Total Defect Rate",
  //           data,
  //           borderColor: "rgba(255, 99, 132, 1)",
  //           backgroundColor: "rgba(255, 99, 132, 0.2)",
  //           borderWidth: 2,
  //           fill: true,
  //         },
  //       ],
  //     };
  //   };

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

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-8xl mx-auto px-4 pt-4">
        <Header inspectionData={inspectionData} />
        <div className="mt-8">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Defect Rate by Defect Name
            </h2>
            <div style={{ height: "300px", width: "80%" }}>
              {" "}
              {/* Custom height and width */}
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
              {" "}
              {/* Custom height and width */}
              <Line data={getLineChartData()} options={lineChartOptions} />
            </div>
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
