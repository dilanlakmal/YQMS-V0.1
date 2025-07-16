import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import {
  Loader2,
  AlertTriangle,
  Search,
  CheckSquare,
  XSquare,
  Percent,
  BarChartHorizontal,
  Star
} from "lucide-react";
import QAAccuracyDashboardBarChart from "./QAAccuracyDashboardBarChart";
import QAAccuracyDashboardLineTrend from "./QAAccuracyDashboardLineTrend";
import QCAccuracyDefectBarChart from "./QCAccuracyDefectBarChart";

const reactSelectStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: "var(--color-bg-secondary)",
    borderColor: "var(--color-border)",
    boxShadow: "none",
    "&:hover": { borderColor: "var(--color-border-hover)" }
  }),
  singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
  input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-bg-secondary)",
    zIndex: 30
  }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isSelected
      ? "var(--color-bg-accent-active)"
      : isFocused
      ? "var(--color-bg-accent)"
      : "var(--color-bg-secondary)",
    color: "var(--color-text-primary)"
  }),
  placeholder: (base) => ({ ...base, color: "var(--color-text-secondary)" })
};

const StatCard = ({ label, value, color, icon }) => (
  <div className={`p-4 rounded-lg shadow-md ${color}`}>
    <div className="flex justify-between items-start">
      <p className="text-sm font-medium opacity-90">{label}</p>
      {icon}
    </div>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);

const QAAccuracyDashboardDailySummary = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
    endDate: new Date(),
    qaId: null,
    qcId: null,
    reportType: null,
    moNo: null,
    lineNo: null,
    tableNo: null,
    grade: null
  });
  const [filterOptions, setFilterOptions] = useState({
    qaIds: [],
    qcIds: [],
    moNos: [],
    lineNos: [],
    tableNos: []
  });
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- STATE FOR BAR CHART DATA AND TYPE ---
  //const [chartData, setChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);

  // --- ADD STATE FOR LINE CHART DATA ---
  const [lineTrendData, setLineTrendData] = useState([]);
  // --- FIX #1: ADD STATE FOR THE NEW DEFECT RATE CHART ---
  const [defectRateData, setDefectRateData] = useState([]);

  const [chartType, setChartType] = useState("Line"); // 'Line', 'MO', or 'QC'
  const [isChartLoading, setIsChartLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        startDate: filters.startDate?.toISOString().split("T")[0],
        endDate: filters.endDate?.toISOString().split("T")[0],
        qaId: filters.qaId?.value,
        qcId: filters.qcId?.value,
        reportType: filters.reportType?.value,
        moNo: filters.moNo?.value,
        lineNo: filters.lineNo?.value,
        tableNo: filters.tableNo?.value,
        grade: filters.grade?.value
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-accuracy/dashboard-summary`,
        { params }
      );
      setStats(response.data);
    } catch (err) {
      setError("Failed to load summary data.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // --- NEW FUNCTION TO FETCH CHART DATA DYNAMICALLY ---
  const fetchChartData = useCallback(async () => {
    setIsChartLoading(true);
    const groupByMap = {
      Line: "lineNo",
      MO: "moNo",
      QC: "scannedQc.empId"
    };
    try {
      const params = {
        // Pass the same filters as the main data fetch
        startDate: filters.startDate?.toISOString().split("T")[0],
        endDate: filters.endDate?.toISOString().split("T")[0],
        qaId: filters.qaId?.value,
        qcId: filters.qcId?.value,
        reportType: filters.reportType?.value,
        moNo: filters.moNo?.value,
        lineNo: filters.lineNo?.value,
        tableNo: filters.tableNo?.value,
        grade: filters.grade?.value,
        groupBy: groupByMap[chartType] // The crucial dynamic parameter
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-accuracy/chart-data`,
        { params }
      );
      setBarChartData(response.data);
      //setChartData(response.data);
    } catch (err) {
      console.error("Failed to load chart data:", err);
    } finally {
      setIsChartLoading(false);
    }
  }, [filters, chartType]);

  // --- Line Trend Chart ---
  const fetchLineTrendData = useCallback(async () => {
    setIsChartLoading(true);
    try {
      // Create a params object specific to this endpoint's needs.
      const params = {
        startDate: filters.startDate?.toISOString().split("T")[0],
        endDate: filters.endDate?.toISOString().split("T")[0],
        qaId: filters.qaId?.value,
        qcId: filters.qcId?.value,
        reportType: filters.reportType?.value,
        moNo: filters.moNo?.value,
        lineNo: filters.lineNo?.value,
        tableNo: filters.tableNo?.value,
        grade: filters.grade?.value
        // The 'groupBy' parameter is NOT sent to the /daily-trend endpoint.
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-accuracy/daily-trend`,
        { params }
      );
      setLineTrendData(response.data);
    } catch (err) {
      console.error("Failed to load line trend data:", err);
    } finally {
      setIsChartLoading(false);
    }
  }, [filters]);

  // --- FIX #1: NEW FUNCTION TO FETCH DEFECT RATE CHART DATA ---
  const fetchDefectRateData = useCallback(async () => {
    setIsChartLoading(true);
    try {
      const params = {
        startDate: filters.startDate?.toISOString().split("T")[0],
        endDate: filters.endDate?.toISOString().split("T")[0],
        qaId: filters.qaId?.value,
        qcId: filters.qcId?.value,
        reportType: filters.reportType?.value,
        moNo: filters.moNo?.value,
        lineNo: filters.lineNo?.value,
        tableNo: filters.tableNo?.value,
        grade: filters.grade?.value
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-accuracy/defect-rates`,
        { params }
      );
      setDefectRateData(response.data);
    } catch (err) {
      console.error("Failed to load defect rate data:", err);
    } finally {
      setIsChartLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/qa-accuracy/filter-options`
        );
        const formatOptions = (arr) =>
          arr.map((item) => ({ value: item, label: item }));
        setFilterOptions({
          qaIds: formatOptions(response.data.qaIds),
          qcIds: formatOptions(response.data.qcIds),
          moNos: formatOptions(response.data.moNos),
          lineNos: formatOptions(response.data.lineNos),
          tableNos: formatOptions(response.data.tableNos)
        });
      } catch (err) {
        console.error("Failed to fetch filter options", err);
      }
    };
    fetchOptions();
  }, []);

  // --- FIX #1: UPDATE USEEFFECT TO FETCH ALL DATA ---
  useEffect(() => {
    fetchDashboardData();
    fetchChartData();
    fetchLineTrendData();
    fetchDefectRateData();
  }, [
    fetchDashboardData,
    fetchChartData,
    fetchLineTrendData,
    fetchDefectRateData
  ]);

  //   // --- UPDATE USEEFFECT TO FETCH ALL DATA ---
  //   useEffect(() => {
  //     fetchDashboardData();
  //     fetchChartData();
  //     fetchLineTrendData();
  //   }, [fetchDashboardData, fetchChartData, fetchLineTrendData]);

  const handleFilterChange = (name, value) => {
    setFilters((f) => ({ ...f, [name]: value }));
  };

  const handleSearch = () => {
    fetchDashboardData();
    fetchChartData();
    fetchLineTrendData();
    fetchDefectRateData();
  };

  const overallGrade = useMemo(() => {
    if (!stats) return "N/A";
    const accuracy = stats.accuracy;
    if (accuracy >= 100) return "A";
    if (accuracy >= 95) return "B";
    if (accuracy >= 92.5) return "C";
    return "D";
  }, [stats]);

  const getDefectRateColor = (rate) => {
    if (rate > 3) return "bg-red-600 text-white";
    if (rate >= 1) return "bg-orange-500 text-white";
    return "bg-green-600 text-white";
  };

  const gradeOptions = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" }
  ];

  const reportTypeOptions = [
    { value: "First Output", label: "First Output" },
    { value: "Inline Sewing", label: "Inline Sewing" },
    { value: "Inline Finishing", label: "Inline Finishing" }
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <DatePicker
            selected={filters.startDate}
            onChange={(date) => handleFilterChange("startDate", date)}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            popperClassName="react-datepicker-popper-z-50"
            portalId="root-portal"
          />
          <DatePicker
            selected={filters.endDate}
            onChange={(date) => handleFilterChange("endDate", date)}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            popperClassName="react-datepicker-popper-z-50"
            portalId="root-portal"
          />
          <Select
            placeholder="QA ID"
            options={filterOptions.qaIds}
            value={filters.qaId}
            onChange={(val) => handleFilterChange("qaId", val)}
            isClearable
            styles={reactSelectStyles}
          />
          <Select
            placeholder="QC ID"
            options={filterOptions.qcIds}
            value={filters.qcId}
            onChange={(val) => handleFilterChange("qcId", val)}
            isClearable
            styles={reactSelectStyles}
          />
          <Select
            placeholder="MO No"
            options={filterOptions.moNos}
            value={filters.moNo}
            onChange={(val) => handleFilterChange("moNo", val)}
            isClearable
            styles={reactSelectStyles}
          />
          <Select
            placeholder="Report Type"
            options={reportTypeOptions}
            value={filters.reportType}
            onChange={(val) => handleFilterChange("reportType", val)}
            isClearable
            styles={reactSelectStyles}
          />
          <Select
            placeholder="Line No"
            options={filterOptions.lineNos}
            value={filters.lineNo}
            onChange={(val) => handleFilterChange("lineNo", val)}
            isDisabled={filters.reportType?.value === "Inline Finishing"}
            isClearable
            styles={reactSelectStyles}
          />
          <Select
            placeholder="Table No"
            options={filterOptions.tableNos}
            value={filters.tableNo}
            onChange={(val) => handleFilterChange("tableNo", val)}
            isDisabled={
              filters.reportType?.value &&
              filters.reportType.value !== "Inline Finishing"
            }
            isClearable
            styles={reactSelectStyles}
          />
          <Select
            placeholder="Grade"
            options={gradeOptions}
            value={filters.grade}
            onChange={(val) => handleFilterChange("grade", val)}
            isClearable
            styles={reactSelectStyles}
          />
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="col-span-full lg:col-span-2 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Search />}{" "}
            Search
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      )}
      {error && (
        <div className="text-center p-8 text-red-500">
          <AlertTriangle className="mx-auto" />
          {error}
        </div>
      )}

      {stats && !isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Inspected Qty"
            value={stats.inspectedQty}
            icon={<CheckSquare size={24} />}
            color="bg-blue-500 text-white"
          />
          <StatCard
            label="Reject Pcs"
            value={stats.rejectPcs}
            icon={<XSquare size={24} />}
            color="bg-red-500 text-white"
          />
          <StatCard
            label="Defects Qty"
            value={stats.defectsQty}
            icon={<AlertTriangle size={24} />}
            color="bg-orange-500 text-white"
          />
          <StatCard
            label="Defect Rate"
            value={`${stats.defectRate.toFixed(2)}%`}
            icon={<Percent size={24} />}
            color={getDefectRateColor(stats.defectRate)}
          />
          <StatCard
            label="Accuracy"
            value={`${stats.accuracy.toFixed(2)}%`}
            icon={<BarChartHorizontal size={24} />}
            color="bg-teal-500 text-white"
          />
          <StatCard
            label="Overall Grade"
            value={overallGrade}
            icon={<Star size={24} />}
            color="bg-purple-500 text-white"
          />
        </div>
      )}

      {/* --- FIX #2: RENDER BOTH CHARTS IN A GRID --- */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          {isChartLoading ? (
            <div className="h-[500px] flex justify-center items-center bg-white dark:bg-gray-800 rounded-lg shadow">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <QAAccuracyDashboardBarChart
              data={barChartData}
              chartType={chartType}
              onChartTypeChange={setChartType}
            />
          )}
        </div>
        <div>
          {isChartLoading ? (
            <div className="h-[500px] flex justify-center items-center bg-white dark:bg-gray-800 rounded-lg shadow">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <QAAccuracyDashboardLineTrend data={lineTrendData} />
          )}
        </div>
      </div>

      {/* --- FIX #2: RENDER THE NEW DEFECT RATE CHART --- */}
      <div className="mt-6">
        {isChartLoading ? (
          <div className="h-[400px] flex justify-center items-center bg-white dark:bg-gray-800 rounded-lg shadow">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <QCAccuracyDefectBarChart data={defectRateData} />
        )}
      </div>
    </div>
  );
};

export default QAAccuracyDashboardDailySummary;
