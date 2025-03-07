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
  Filter,
  List,
  PieChart,
  Table as TableIcon,
  TrendingDown,
  XCircle,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import { io } from "socket.io-client"; // Import Socket.io client
import { API_BASE_URL } from "../../config";
import DateSelector from "../components/forms/QC Inspection/DateSelector"; // make sure this version does NOT render its own label
import { useTranslation } from 'react-i18next';
import LiveStyleCard from "../components/inspection/LiveStyleCard";
import TrendAnalysisMO from "../components/inspection/TrendAnalysisMO"; // New component import

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
  const { t } = useTranslation();
  // --- Tabs state ---
  const [activeTab, setActiveTab] = useState("QC2");

  // Filter states (8 filters including buyer)
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [moNo, setMoNo] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [department, setDepartment] = useState("");
  const [empId, setEmpId] = useState("");
  const [buyer, setBuyer] = useState("");

  const [showFilters, setShowFilters] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState({});

  // Options for suggestions/dropdowns
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [empIdOptions, setEmpIdOptions] = useState([]);
  const [buyerOptions, setBuyerOptions] = useState([]);

  // Data states
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
  const [moSummaries, setMoSummaries] = useState([]);
  const [hourlyDefectRates, setHourlyDefectRates] = useState({}); // New state for hourly defect rates
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

  // Fetch filter options from qc2-inspection-pass-bundle collection
  // Replace the existing fetchFilterOptions function
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
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // Fetch summary data with filters
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

  // Fetch defect rates with filters
  const fetchDefectRates = async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-defect-rates`, {
        params: filters,
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
        params: filters,
      });
      setMoSummaries(response.data);
    } catch (error) {
      console.error("Error fetching MO summaries:", error);
    }
  };

  // Fetch Hourly Defect Rates
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

    const applied = {};
    if (startDate) applied["Start Date"] = formatDate(startDate);
    if (endDate) applied["End Date"] = formatDate(endDate);
    if (moNo) applied["MO No"] = moNo;
    if (color) applied["Color"] = color;
    if (size) applied["Size"] = size;
    if (department) applied["Department"] = department;
    if (empId) applied["Emp ID"] = empId;
    if (buyer) applied["Buyer"] = buyer;

    // Update applied filters and fetch all data with the filters
    setAppliedFilters(applied);
    filtersRef.current = filters; // Ensure filtersRef is updated immediately

    // Fetch all data with the applied filters
    await Promise.all([
      fetchSummaryData(filters),
      fetchDefectRates(filters),
      fetchMoSummaries(filters),
      fetchHourlyDefectRates(filters),
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
    setAppliedFilters({});
    filtersRef.current = {}; // Reset filtersRef

    // Fetch all data without filters
    await Promise.all([
      fetchSummaryData(),
      fetchDefectRates(),
      fetchMoSummaries(),
      fetchHourlyDefectRates(),
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
      ]);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Update filtersRef when filter states change
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
    };
  }, [moNo, color, size, department, empId, startDate, endDate, buyer]);

  // Socket.io connection
  // useEffect(() => {
  //   const socket = io(`${{ API_BASE_URL }}`, {
  //     path: "/socket.io",
  //     transports: ["websocket"],
  //   });

  //   socket.on("qc2_data_updated", () => {
  //     console.log("Data updated event received");
  //     const currentFilters = filtersRef.current;

  //     const filters = {
  //       moNo: currentFilters.moNo,
  //       color: currentFilters.color,
  //       size: currentFilters.size,
  //       department: currentFilters.department,
  //       emp_id_inspection: currentFilters.empId,
  //       startDate: currentFilters.startDate,
  //       endDate: currentFilters.endDate,
  //     };

  //     fetchSummaryData(filters);
  //     fetchDefectRates(filters);
  //   });
  useEffect(() => {
    const socket = io(`${API_BASE_URL}`, {
      path: "/socket.io",
      transports: ["websocket"],
    });

    socket.on("qc2_data_updated", async () => {
      console.log("Data updated event received");
      const currentFilters = filtersRef.current;
      await Promise.all([
        fetchSummaryData(currentFilters),
        fetchDefectRates(currentFilters),
        fetchMoSummaries(currentFilters),
        fetchHourlyDefectRates(currentFilters),
      ]);
    });

    return () => socket.disconnect();
  }, []);

  // Calculate dynamic max defect rate for Y axis
  const maxDefectRateValue =
    defectRates.length > 0
      ? Math.max(...defectRates.map((item) => item.defectRate * 100)) + 2
      : 10;

  // Chart data and options
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
            t("home.bundle_registration"),
            t("home.washing"),
            t("home.ironing"),
            t("home.opa"),
            t("dash.qc2"),
            t("home.packing"),
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
          <h2 className="text-xl font-medium">{t("dash.coming_soon")}</h2>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-medium mb-4 text-center">
            {t("home.live_dashboard")}
          </h1>

          {/* Filter Pane Header */}
          <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow mb-2">
            <div className="flex items-center space-x-2">
              <Filter className="text-blue-500" size={20} />
              <h2 className="text-lg font-medium text-gray-700">{t("dash.filters")}</h2>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-500 flex items-center"
            >
              {showFilters ? t("dash.hide") : t("dash.show")}
            </button>
          </div>

          {/* Filter Pane */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              {/* First row: 5 filters */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {t("downDa.start_date")}
                  </label>
                  <DateSelector
                    selectedDate={startDate}
                    hideLabel={true}
                    onChange={(date) => setStartDate(date)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {t('downDa.end_date')}
                  </label>
                  <DateSelector
                    selectedDate={endDate}
                    hideLabel={true}
                    onChange={(date) => setEndDate(date)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {t("bundle.mono")}
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
                    {t("bundle.color")}
                  </label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">{t("bundle.select_color")}</option>
                    {colorOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                  {t("bundle.size")}
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">{t("bundle.select_size")}</option>
                    {sizeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Second row: 3 filters (including buyer) */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                  {t("bundle.department")}
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">{t("bundle.select_department")}</option>
                    {departmentOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                  {t("bundle.emp_id")}
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
              </div>
              {/* Apply / Reset buttons */}
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {t("dash.apply")}
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  {t("dash.reset")}
                </button>
              </div>
            </div>
          )}

          {/* Display Applied Filters */}
          {Object.keys(appliedFilters).length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
              {t("downDa.summary")}: {t("dash.applied_filters")}:
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
                {t("ana.checked_qty")}
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
                {t("dash.total_pass")}
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
                {t("dash.total_rejects")}
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
                {t("dash.defects_qty")}
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
                {t("dash.total_bundle")}
                </h2>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryData.totalBundles}
                </p>
              </div>
              <Archive className="text-blue-500 text-3xl" />
            </div>

            {/* Defect Rate Card */}
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
                <h2 className="text-lg font-semibold text-gray-700">
                {t("ana.defect_rate")}
                </h2>
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

            {/* Defect Ratio Card */}
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
                <h2 className="text-lg font-semibold text-gray-700">
                {t("ana.defect_ratio")}
                </h2>
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

          {/* MO No Cards Section */}
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

          {/* Chart/Table Toggle Section */}
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-900 mb-2">
              QC2 {t("ana.defect_rate_by")}
            </h2>
          </div>

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
                        <span className="hidden md:inline">{t("defIm.defect_name")}</span>
                      </th>
                      <th className="py-2 px-4 border-b border-gray-200 font-bold text-left block md:table-cell">
                        <span className="hidden md:inline">{t("dash.rank")}</span>
                      </th>
                      <th className="py-2 px-4 border-b border-gray-200 font-bold text-left block md:table-cell">
                        <span className="hidden md:inline">{t("dash.defect_qty")}</span>
                      </th>
                      <th className="py-2 px-4 border-b border-gray-200 font-bold text-left block md:table-cell">
                        <span className="hidden md:inline">
                        {t("ana.defect_rate")} (%)
                        </span>
                      </th>
                      <th className="py-2 px-4 border-b border-gray-200 font-bold text-left block md:table-cell">
                        <span className="hidden md:inline">{t("dash.level")}</span>
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
          {/* New QC2 Defect Rate by Hour Chart */}
          <TrendAnalysisMO data={hourlyDefectRates} />
        </>
      )}
    </div>
  );
};

export default LiveDashboard;
