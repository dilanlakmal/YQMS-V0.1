import axios from "axios";
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
import {
  Archive,
  BarChart,
  CheckCircle,
  Filter,
  List,
  PieChart,
  Table as TableIcon,
  TrendingDown,
  XCircle
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../../config";
import DateSelector from "../components/forms/DateSelector";
import LiveStyleCard from "../components/inspection/LiveStyleCard";
import LiveSummary from "../components/inspection/LiveSummary"; // New component
import LineCard from "../components/inspection/LineCard";
import TrendAnalysisMO from "../components/inspection/TrendAnalysisMO";
import TrendAnalysisLine from "../components/inspection/TrendAnalysisLine";
import TrendAnalysisLineDefects from "../components/inspection/TrendAnalysisLineDefects";
import NavigationPanel from "../components/inspection/NavigationPanel";

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
  const [activeSection, setActiveSection] = useState("Live Dashboard");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeMoTab, setActiveMoTab] = useState("MO Summary"); // For MO Hr Trend tabs
  const [activeLineTab, setActiveLineTab] = useState("Line Summary");

  // Filter states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [moNo, setMoNo] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [department, setDepartment] = useState("");
  const [empId, setEmpId] = useState("");
  const [buyer, setBuyer] = useState("");
  const [lineNo, setLineNo] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState({});

  // Options for suggestions/dropdowns
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [empIdOptions, setEmpIdOptions] = useState([]);
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [lineNoOptions, setLineNoOptions] = useState([]);

  // Data states
  const [summaryData, setSummaryData] = useState({
    checkedQty: 0,
    totalPass: 0,
    totalRejects: 0,
    defectsQty: 0,
    totalBundles: 0,
    defectRate: 0,
    defectRatio: 0
  });
  const [defectRates, setDefectRates] = useState([]);
  const [moSummaries, setMoSummaries] = useState([]);
  const [hourlyDefectRates, setHourlyDefectRates] = useState({});
  const [lineDefectRates, setLineDefectRates] = useState({});
  const [viewMode, setViewMode] = useState("chart");

  const filtersRef = useRef({});

  // Format Date to "MM/DD/YYYY"
  const formatDate = (date) => {
    if (!date) return "";
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle/filter-options`
      );
      const data = response.data;
      setMoNoOptions(data.moNo || []);
      setColorOptions(data.color || []);
      setSizeOptions(data.size || []);
      setDepartmentOptions(data.department || []);
      setEmpIdOptions(data.emp_id_inspection || []);
      setBuyerOptions(data.buyer || []);
      setLineNoOptions(data.lineNo || []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // Fetch summary data
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

  // Fetch defect rates
  const fetchDefectRates = async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-defect-rates`, {
        params: filters
      });
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

  // Fetch MO No Summaries
  const fetchMoSummaries = async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-mo-summaries`, {
        params: filters
      });
      setMoSummaries(response.data);
    } catch (error) {
      console.error("Error fetching MO summaries:", error);
    }
  };

  // Fetch Hourly Defect Rates by MO No
  const fetchHourlyDefectRates = async (filters = {}) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-defect-rates-by-hour`,
        { params: filters }
      );
      setHourlyDefectRates(response.data);
    } catch (error) {
      console.error("Error fetching hourly defect rates:", error);
    }
  };

  // Fetch Defect Rates by Line No and MO No
  const fetchLineDefectRates = async (filters = {}) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-defect-rates-by-line`,
        { params: filters }
      );
      setLineDefectRates(response.data);
    } catch (error) {
      console.error("Error fetching line defect rates:", error);
    }
  };

  // Apply Filters
  const handleApplyFilters = async () => {
    const filters = {};
    if (moNo) filters.moNo = moNo;
    if (color) filters.color = color;
    if (size) filters.size = size;
    if (department) filters.department = department;
    if (empId) filters.emp_id_inspection = empId;
    if (startDate) filters.startDate = formatDate(startDate);
    if (endDate) filters.endDate = formatDate(endDate);
    if (buyer) filters.buyer = buyer;
    if (lineNo) filters.lineNo = lineNo;

    const applied = {};
    if (startDate) applied["Start Date"] = formatDate(startDate);
    if (endDate) applied["End Date"] = formatDate(endDate);
    if (moNo) applied["MO No"] = moNo;
    if (color) applied["Color"] = color;
    if (size) applied["Size"] = size;
    if (department) applied["Department"] = department;
    if (empId) applied["Emp ID"] = empId;
    if (buyer) applied["Buyer"] = buyer;
    if (lineNo) applied["Line No"] = lineNo;

    setAppliedFilters(applied);
    filtersRef.current = filters;

    await Promise.all([
      fetchSummaryData(filters),
      fetchDefectRates(filters),
      fetchMoSummaries(filters),
      fetchHourlyDefectRates(filters),
      fetchLineDefectRates(filters)
    ]);
  };

  // Reset Filters
  const handleResetFilters = async () => {
    setStartDate(null);
    setEndDate(null);
    setMoNo("");
    setColor("");
    setSize("");
    setDepartment("");
    setEmpId("");
    setBuyer("");
    setLineNo("");
    setAppliedFilters({});
    filtersRef.current = {};

    await Promise.all([
      fetchSummaryData(),
      fetchDefectRates(),
      fetchMoSummaries(),
      fetchHourlyDefectRates(),
      fetchLineDefectRates()
    ]);
  };

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchFilterOptions();
      await Promise.all([
        fetchSummaryData(),
        fetchDefectRates(),
        fetchMoSummaries(),
        fetchHourlyDefectRates(),
        fetchLineDefectRates()
      ]);
    };
    fetchInitialData();

    const intervalId = setInterval(async () => {
      const currentFilters = filtersRef.current;
      await Promise.all([
        fetchSummaryData(currentFilters),
        fetchDefectRates(currentFilters),
        fetchMoSummaries(currentFilters),
        fetchHourlyDefectRates(currentFilters),
        fetchLineDefectRates(currentFilters)
      ]);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Update filtersRef
  useEffect(() => {
    filtersRef.current = {
      moNo,
      color,
      size,
      department,
      emp_id_inspection: empId,
      startDate: startDate ? formatDate(startDate) : null,
      endDate: endDate ? formatDate(endDate) : null,
      buyer,
      lineNo
    };
  }, [moNo, color, size, department, empId, startDate, endDate, buyer, lineNo]);

  // Socket.io connection
  useEffect(() => {
    const socket = io(`${API_BASE_URL}`, {
      path: "/socket.io",
      transports: ["websocket"]
    });

    socket.on("qc2_data_updated", async () => {
      console.log("Data updated event received");
      const currentFilters = filtersRef.current;
      await Promise.all([
        fetchSummaryData(currentFilters),
        fetchDefectRates(currentFilters),
        fetchMoSummaries(currentFilters),
        fetchHourlyDefectRates(currentFilters),
        fetchLineDefectRates(currentFilters)
      ]);
    });

    return () => socket.disconnect();
  }, []);

  // Chart data and options
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
          if (rate > 5) return "rgba(220,20,60,0.8)"; // Dark Red
          if (rate >= 1 && rate <= 5) return "rgba(255,165,0,0.8)"; // Orange
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

  // Common Filter Pane Component
  const FilterPane = () => (
    <>
      <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow mb-2">
        <div className="flex items-center space-x-2">
          <Filter className="text-blue-500" size={20} />
          <h2 className="text-lg font-medium text-gray-700">Filters</h2>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-blue-500 flex items-center hover:text-blue-600"
        >
          {showFilters ? "Hide" : "Show"}
        </button>
      </div>
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
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
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Buyer
              </label>
              <select
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Buyer</option>
                {buyerOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Line No
              </label>
              <select
                value={lineNo}
                onChange={(e) => setLineNo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Line No</option>
                {lineNoOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
      {Object.keys(appliedFilters).length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Applied Filters:
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
    </>
  );

  // Summary Cards Component
  const SummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
      <div className="p-6 bg-white shadow-md rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Checked Qty</h2>
          <p className="text-2xl font-bold text-gray-900">
            {summaryData.checkedQty}
          </p>
        </div>
        <CheckCircle className="text-green-500 text-3xl" />
      </div>
      <div className="p-6 bg-white shadow-md rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Total Pass</h2>
          <p className="text-2xl font-bold text-gray-900">
            {summaryData.totalPass}
          </p>
        </div>
        <CheckCircle className="text-green-500 text-3xl" />
      </div>
      <div className="p-6 bg-white shadow-md rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Total Rejects</h2>
          <p className="text-2xl font-bold text-gray-900">
            {summaryData.totalRejects}
          </p>
        </div>
        <XCircle className="text-red-500 text-3xl" />
      </div>
      <div className="p-6 bg-white shadow-md rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Defects Qty</h2>
          <p className="text-2xl font-bold text-gray-900">
            {summaryData.defectsQty}
          </p>
        </div>
        <List className="text-yellow-500 text-3xl" />
      </div>
      <div className="p-6 bg-white shadow-md rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Total Bundles</h2>
          <p className="text-2xl font-bold text-gray-900">
            {summaryData.totalBundles}
          </p>
        </div>
        <Archive className="text-blue-500 text-3xl" />
      </div>
      <div
        className={`p-6 shadow-md rounded-lg flex items-center justify-between ${
          summaryData.defectRate * 100 > 3
            ? "bg-red-200"
            : summaryData.defectRate * 100 >= 2
            ? "bg-yellow-200"
            : "bg-green-200"
        }`}
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Defect Rate</h2>
          <p
            className={`text-2xl font-bold ${
              summaryData.defectRate * 100 > 3
                ? "text-red-800"
                : summaryData.defectRate * 100 >= 2
                ? "text-orange-800"
                : "text-green-800"
            }`}
          >
            {(summaryData.defectRate * 100).toFixed(2)}%
          </p>
        </div>
        <PieChart className="text-purple-500 text-3xl" />
      </div>
      <div
        className={`p-6 shadow-md rounded-lg flex items-center justify-between ${
          summaryData.defectRatio * 100 > 3
            ? "bg-red-300"
            : summaryData.defectRatio * 100 >= 2
            ? "bg-yellow-300"
            : "bg-green-300"
        }`}
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Defect Ratio</h2>
          <p
            className={`text-2xl font-bold ${
              summaryData.defectRatio * 100 > 3
                ? "text-red-800"
                : summaryData.defectRatio * 100 >= 2
                ? "text-orange-800"
                : "text-green-800"
            }`}
          >
            {(summaryData.defectRatio * 100).toFixed(2)}%
          </p>
        </div>
        <TrendingDown className="text-orange-500 text-3xl" />
      </div>
    </div>
  );

  // Defect Rate Chart Component
  const DefectRateChart = () => (
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

  // MO Card Summaries Component
  const MoCardSummaries = () => (
    <div className="mt-6">
      <h2 className="text-sm font-medium text-gray-900 mb-2">
        MO No Summaries
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-4">
        {moSummaries
          .sort((a, b) => b.defectRate - a.defectRate)
          .map((summary) => (
            <LiveStyleCard
              key={summary.moNo}
              moNo={summary.moNo}
              summaryData={summary}
            />
          ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Navigation Panel */}
      <NavigationPanel
        isOpen={isNavOpen}
        toggleNav={() => setIsNavOpen(!isNavOpen)}
        setActiveSection={setActiveSection}
        activeSection={activeSection}
      />

      {/* Main Content */}
      <div
        className={`flex-1 p-4 transition-all duration-300 ${
          isNavOpen ? "ml-72" : "ml-0"
        }`}
      >
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
          {activeSection}
        </h1>

        {/* Common Filter Pane for QC2 Sections */}
        {[
          "Live Dashboard",
          "MO Hr Trend",
          "Line Hr Trend",
          "Daily Summary",
          "Weekly Analysis",
          "Monthly Analysis"
        ].includes(activeSection) && <FilterPane />}

        {/* Section Content */}
        {activeSection === "Live Dashboard" && (
          <>
            <SummaryCards />
            <div className="mt-6">
              <h2 className="text-sm font-medium text-gray-900 mb-2">
                QC2 Defect Rate by Defect Name
              </h2>
              <DefectRateChart />
              <LiveSummary filters={filtersRef.current} /> {/* Add this line */}
            </div>
          </>
        )}

        {activeSection === "MO Hr Trend" && (
          <>
            <div className="mb-4">
              <button
                onClick={() => setActiveMoTab("MO Summary")}
                className={`px-4 py-2 mr-2 rounded ${
                  activeMoTab === "MO Summary"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                MO Summary
              </button>
              <button
                onClick={() => setActiveMoTab("MO Trend")}
                className={`px-4 py-2 rounded ${
                  activeMoTab === "MO Trend"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                MO Trend
              </button>
            </div>
            {activeMoTab === "MO Summary" && (
              <>
                <SummaryCards />
                <MoCardSummaries />
              </>
            )}
            {activeMoTab === "MO Trend" && (
              <TrendAnalysisMO data={hourlyDefectRates} />
            )}
          </>
        )}

        {activeSection === "Line Hr Trend" && (
          <>
            <div className="mb-4">
              <button
                onClick={() => setActiveLineTab("Line Summary")}
                className={`px-4 py-2 mr-2 rounded ${
                  activeLineTab === "Line Summary"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Line Summary
              </button>
              <button
                onClick={() => setActiveLineTab("Line Trend")}
                className={`px-4 py-2 mr-2 rounded ${
                  activeLineTab === "Line Trend"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Line-MO Trend
              </button>
              <button
                onClick={() => setActiveLineTab("Line Rate")}
                className={`px-4 py-2 mr-2 rounded ${
                  activeLineTab === "Line Rate"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Line Trend
              </button>
            </div>
            {activeLineTab === "Line Summary" && (
              <>
                <SummaryCards />
                <div className="mt-6">
                  <h2 className="text-sm font-medium text-gray-900 mb-2">
                    Line Summaries
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-4">
                    {Object.keys(lineDefectRates)
                      .filter((key) => key !== "total" && key !== "grand")
                      .filter((lineNum) => (lineNo ? lineNum === lineNo : true)) // Exact match filter using lineNo
                      .map((lineNum) => ({
                        lineNo: lineNum,
                        defectRate: (() => {
                          const moData = lineDefectRates[lineNum] || {};
                          let totalCheckedQty = 0;
                          let totalDefectsQty = 0;
                          Object.keys(moData).forEach((moNum) => {
                            if (moNum !== "totalRate") {
                              Object.keys(moData[moNum]).forEach((hour) => {
                                if (hour !== "totalRate") {
                                  const hourData = moData[moNum][hour];
                                  totalCheckedQty += hourData.checkedQty || 0;
                                  totalDefectsQty += hourData.defects.reduce(
                                    (sum, defect) => sum + defect.count,
                                    0
                                  );
                                }
                              });
                            }
                          });
                          return totalCheckedQty > 0
                            ? totalDefectsQty / totalCheckedQty
                            : 0;
                        })()
                      }))
                      .sort((a, b) => b.defectRate - a.defectRate) // Sort by defectRate descending
                      .map(({ lineNo }) => (
                        <LineCard
                          key={lineNo}
                          lineNo={lineNo}
                          lineDefectRates={lineDefectRates}
                        />
                      ))}
                  </div>
                </div>
              </>
            )}
            {activeLineTab === "Line Trend" && (
              <TrendAnalysisLine data={lineDefectRates} />
            )}
            {activeLineTab === "Line Rate" && (
              <TrendAnalysisLineDefects
                data={lineDefectRates}
                lineNo={lineNo}
              />
            )}
          </>
        )}

        {["Order Data", "Washing", "Ironing", "OPA", "Packing"].includes(
          activeSection
        ) && (
          <div className="text-center mt-8 text-gray-700">
            <h2 className="text-xl font-medium">Coming soon</h2>
          </div>
        )}

        {["Daily Summary", "Weekly Analysis", "Monthly Analysis"].includes(
          activeSection
        ) && (
          <div className="text-center mt-8 text-gray-700">
            <h2 className="text-xl font-medium">Coming soon</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveDashboard;
