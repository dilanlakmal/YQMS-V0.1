import axios from "axios";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Archive,
  BarChart,
  CheckCircle,
  Filter, // using Filter icon from lucide-react
  List,
  PieChart,
  Table as TableIcon,
  TrendingDown,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { API_BASE_URL } from "../../config";
import DateSelector from "../components/forms/DateSelector"; // make sure this version does NOT render its own label

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const LiveDashboard = () => {
  // --- Tabs state ---
  const [activeTab, setActiveTab] = useState("QC2");

  // --- Filter state (7 filters) ---
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [moNo, setMoNo] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [department, setDepartment] = useState("");
  const [empId, setEmpId] = useState("");

  // --- For showing/hiding filter pane ---
  const [showFilters, setShowFilters] = useState(true);

  // --- Applied filters (to display as badges) ---
  const [appliedFilters, setAppliedFilters] = useState({});

  // --- Options for suggestions/dropdowns ---
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [empIdOptions, setEmpIdOptions] = useState([]);

  // --- Data states ---
  const [summaryData, setSummaryData] = useState({
    checkedQty: 0,
    totalPass: 0,
    totalRejects: 0,
    defectsQty: 0,
    totalBundles: 0,
    defectRate: 0,
    defectRatio: 0,
  });
  const [defectRates, setDefectRates] = useState([]);
  const [viewMode, setViewMode] = useState("chart");

  // --- Helper: Format Date to "MM/DD/YYYY" (ensure two-digit month/day) ---
  const formatDate = (date) => {
    if (!date) return "";
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // --- Fetch filter options from qc2-inspection-pass-bundle collection ---
  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle`
      );
      const data = response.data;
      setMoNoOptions(
        Array.from(
          new Set(data.map((item) => item.moNo).filter(Boolean))
        ).sort()
      );
      setColorOptions(
        Array.from(
          new Set(data.map((item) => item.color).filter(Boolean))
        ).sort()
      );
      setSizeOptions(
        Array.from(
          new Set(data.map((item) => item.size).filter(Boolean))
        ).sort()
      );
      setDepartmentOptions(
        Array.from(
          new Set(data.map((item) => item.department).filter(Boolean))
        ).sort()
      );
      setEmpIdOptions(
        Array.from(
          new Set(data.map((item) => item.emp_id_inspection).filter(Boolean))
        ).sort()
      );
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // --- Fetch summary data with filters ---
  const fetchSummaryData = async (filters = {}) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-inspection-summary`,
        { params: filters }
      );
      setSummaryData(response.data);
    } catch (error) {
      console.error("Error fetching summary data:", error);
    }
  };

  // --- Fetch defect rates with filters ---
  const fetchDefectRates = async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-defect-rates`, {
        params: filters,
      });
      // Sort by defect rate descending and calculate ranks
      const sorted = response.data.sort((a, b) => b.defectRate - a.defectRate);
      let rank = 1;
      let previousRate = null;
      const ranked = sorted.map((item, index) => {
        if (item.defectRate !== previousRate) {
          rank = index + 1;
          previousRate = item.defectRate;
        }
        return { ...item, rank };
      });
      setDefectRates(ranked);
    } catch (error) {
      console.error("Error fetching defect rates:", error);
    }
  };

  // --- Apply and Reset Filters ---
  const handleApplyFilters = () => {
    const filters = {};
    if (moNo) filters.moNo = moNo;
    if (color) filters.color = color;
    if (size) filters.size = size;
    if (department) filters.department = department;
    if (empId) filters.emp_id_inspection = empId;
    if (startDate) filters.startDate = formatDate(startDate);
    if (endDate) filters.endDate = formatDate(endDate);
    // Save applied filters for badge display
    const applied = {};
    if (startDate) applied["Start Date"] = formatDate(startDate);
    if (endDate) applied["End Date"] = formatDate(endDate);
    if (moNo) applied["MO No"] = moNo;
    if (color) applied["Color"] = color;
    if (size) applied["Size"] = size;
    if (department) applied["Department"] = department;
    if (empId) applied["Emp ID"] = empId;
    setAppliedFilters(applied);
    fetchSummaryData(filters);
    fetchDefectRates(filters);
  };

  const handleResetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setMoNo("");
    setColor("");
    setSize("");
    setDepartment("");
    setEmpId("");
    setAppliedFilters({});
    fetchSummaryData();
    fetchDefectRates();
  };

  useEffect(() => {
    // Initial fetch of options and data
    fetchFilterOptions();
    fetchSummaryData();
    fetchDefectRates();
  }, []);

  // --- Calculate dynamic max defect rate for Y axis ---
  const maxDefectRateValue =
    defectRates.length > 0
      ? Math.max(...defectRates.map((item) => item.defectRate * 100)) + 2
      : 10;

  // --- Chart data and options (with datalabels on top) ---
  const chartData = {
    labels: defectRates.map((item) => item.defectName),
    datasets: [
      {
        label: "Defect Rate (%)",
        data: defectRates.map((item) => (item.defectRate * 100).toFixed(2)),
        backgroundColor: defectRates.map((item) => {
          const rate = item.defectRate * 100;
          if (rate > 5) return "rgba(220,20,60,0.8)"; // Dark Red
          if (rate >= 1 && rate <= 5) return "rgba(255,165,0,0.8)"; // Orange
          return "rgba(0,128,0,0.8)"; // Green
        }),
        datalabels: {
          anchor: "end",
          align: "top",
          color: "black",
          font: { weight: "bold", size: 12 },
          formatter: (value) => `${value}%`,
        },
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: "black", autoSkip: false },
        grid: { display: false },
      },
      y: {
        max: maxDefectRateValue,
        grid: { display: false },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed !== null) label += context.parsed.y + "%";
            return label;
          },
        },
      },
      datalabels: { display: "auto" },
    },
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen text-base">
      {/* Tabs */}
      <div className="mb-4">
        <div className="flex space-x-4 border-b">
          {[
            "Bundle Registration",
            "Washing",
            "Ironing",
            "OPA",
            "QC2",
            "Packing",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 ${
                activeTab === tab
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-gray-600"
              } focus:outline-none`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab !== "QC2" ? (
        <div className="text-center mt-8 text-gray-700">
          <h2 className="text-xl font-medium">Coming soon</h2>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-medium mb-4 text-center">
            Live Dashboard
          </h1>

          {/* Filter Pane Header with Filter Icon and Toggle */}
          <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow mb-2">
            <div className="flex items-center space-x-2">
              <Filter className="text-blue-500" size={20} />
              <h2 className="text-lg font-medium text-gray-700">Filters</h2>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-500 flex items-center"
            >
              {showFilters ? "Hide" : "Show"}
            </button>
          </div>

          {/* Filter Pane (only shown when expanded) */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              {/* First row: 5 filters */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <DateSelector
                    selectedDate={startDate}
                    hideLabel={true}
                    onChange={(date) => setStartDate(date)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <DateSelector
                    selectedDate={endDate}
                    hideLabel={true}
                    onChange={(date) => setEndDate(date)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    MO No
                  </label>
                  <input
                    type="text"
                    value={moNo}
                    onChange={(e) => setMoNo(e.target.value)}
                    list="moNoOptions"
                    placeholder="Search MO No"
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <datalist id="moNoOptions">
                    {moNoOptions
                      .filter(
                        (opt) =>
                          opt && opt.toLowerCase().includes(moNo.toLowerCase())
                      )
                      .map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                  </datalist>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Color</option>
                    {colorOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Size</option>
                    {sizeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Second row: 2 filters */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Emp ID
                  </label>
                  <input
                    type="text"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    list="empIdOptions"
                    placeholder="Search Emp ID"
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <datalist id="empIdOptions">
                    {empIdOptions
                      .filter(
                        (opt) =>
                          opt && opt.toLowerCase().includes(empId.toLowerCase())
                      )
                      .map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                  </datalist>
                </div>
              </div>
              {/* Apply / Reset buttons (only shown when filter pane is expanded) */}
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Apply
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Display Applied Filters (if any) as badges */}
          {Object.keys(appliedFilters).length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Summary: Applied Filters:
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(appliedFilters).map(([key, value]) => (
                  <div
                    key={key}
                    className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs"
                  >
                    {key}: {value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
            <div className="p-6 bg-white shadow-md rounded-lg flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Checked Qty
                </h2>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryData.checkedQty}
                </p>
              </div>
              <CheckCircle className="text-green-500 text-3xl" />
            </div>
            <div className="p-6 bg-white shadow-md rounded-lg flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Total Pass
                </h2>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryData.totalPass}
                </p>
              </div>
              <CheckCircle className="text-green-500 text-3xl" />
            </div>
            <div className="p-6 bg-white shadow-md rounded-lg flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Total Rejects
                </h2>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryData.totalRejects}
                </p>
              </div>
              <XCircle className="text-red-500 text-3xl" />
            </div>
            <div className="p-6 bg-white shadow-md rounded-lg flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Defects Qty
                </h2>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryData.defectsQty}
                </p>
              </div>
              <List className="text-yellow-500 text-3xl" />
            </div>
            <div className="p-6 bg-white shadow-md rounded-lg flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Total Bundles
                </h2>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryData.totalBundles}
                </p>
              </div>
              <Archive className="text-blue-500 text-3xl" />
            </div>
            <div className="p-6 bg-white shadow-md rounded-lg flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Defect Rate
                </h2>
                <p className="text-2xl font-bold text-gray-900">
                  {(summaryData.defectRate * 100).toFixed(2)}%
                </p>
              </div>
              <PieChart className="text-purple-500 text-3xl" />
            </div>
            <div className="p-6 bg-white shadow-md rounded-lg flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Defect Ratio
                </h2>
                <p className="text-2xl font-bold text-gray-900">
                  {(summaryData.defectRatio * 100).toFixed(2)}%
                </p>
              </div>
              <TrendingDown className="text-orange-500 text-3xl" />
            </div>
          </div>

          {/* Chart/Table Toggle Section with Title */}
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-900 mb-2">
              QC2 Defect rate by Defect Name
            </h2>
          </div>

          {/* Toggle between Chart and Table for Defect Rates */}
          <div className="bg-white shadow-md rounded-lg p-6 overflow-auto">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setViewMode("chart")}
                className={`mr-2 p-2 rounded ${
                  viewMode === "chart"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                <BarChart className="text-gray-700" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded ${
                  viewMode === "table"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
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
                  <thead className="bg-light-blue-500">
                    <tr>
                      <th className="py-2 px-4 border-b border-gray-200 font-bold text-left block md:table-cell">
                        <span className="hidden md:inline">Defect Name</span>
                      </th>
                      <th className="py-2 px-4 border-b border-gray-200 font-bold text-left block md:table-cell">
                        <span className="hidden md:inline">Rank</span>
                      </th>
                      <th className="py-2 px-4 border-b border-gray-200 font-bold text-left block md:table-cell">
                        <span className="hidden md:inline">Defect Qty</span>
                      </th>
                      <th className="py-2 px-4 border-b border-gray-200 font-bold text-left block md:table-cell">
                        <span className="hidden md:inline">
                          Defect Rate (%)
                        </span>
                      </th>
                      <th className="py-2 px-4 border-b border-gray-200 font-bold text-left block md:table-cell">
                        <span className="hidden md:inline">Level</span>
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
                            <span className="text-red-500 animate-ping">
                              &#x25CF;
                            </span>
                          ) : item.defectRate * 100 >= 1 &&
                            item.defectRate * 100 <= 5 ? (
                            <span className="text-orange-500">&#x25CF;</span>
                          ) : (
                            <span className="text-green-500">&#x25CF;</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LiveDashboard;
