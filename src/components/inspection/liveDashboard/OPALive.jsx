// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../config";
// import DataTableWOI from "./DataTableWOI";
// import FilterPaneWOI from "./FilterPaneWOI";

// const OPALive = () => {
//   const [tableData, setTableData] = useState([]);
//   const [totalRecords, setTotalRecords] = useState(0);
//   const [page, setPage] = useState(1);
//   const limit = 50;

//   const [filters, setFilters] = useState({
//     moNo: "",
//     custStyle: "",
//     buyer: "",
//     color: "",
//     size: "",
//     empId: ""
//   });

//   // Fetch OPA data
//   const fetchOPAData = async (filters = {}, currentPage = page) => {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/api/opa-summary`, {
//         params: { ...filters, page: currentPage, limit }
//       });
//       setTableData(response.data.tableData);
//       setTotalRecords(response.data.total);
//     } catch (error) {
//       console.error("Error fetching OPA data:", error);
//     }
//   };

//   // Handle pagination
//   const handlePageChange = async (newPage) => {
//     setPage(newPage);
//     await fetchOPAData(filters, newPage);
//   };

//   // Initial fetch and auto-refresh
//   useEffect(() => {
//     fetchOPAData();

//     const intervalId = setInterval(() => fetchOPAData(filters), 5000);
//     return () => clearInterval(intervalId);
//   }, [filters]);

//   return (
//     <div className="p-6 bg-gray-100 min-h-screen">
//       <FilterPaneWOI
//         module="opa"
//         empIdField="emp_id_opa"
//         filters={filters}
//         setFilters={setFilters}
//         fetchData={fetchOPAData}
//         setPage={setPage}
//       />
//       <DataTableWOI
//         tableData={tableData}
//         totalRecords={totalRecords}
//         page={page}
//         limit={limit}
//         handlePageChange={handlePageChange}
//       />
//     </div>
//   );
// };

// export default OPALive;

import axios from "axios";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { format as formatDateFn, parse } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter as FilterIcon,
  RotateCcw,
  Search as SearchIcon,
  TrendingDown,
  TrendingUp,
  X
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"; // Added useRef
import { Bar } from "react-chartjs-2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config"; // Adjust path if necessary

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
  ChartDataLabels
);

// Helper Functions (normalizeDateStringForAPI, formatDisplayDate, LoadingSpinner, SummaryStatCard, InspectorColumnToggleButton)

// Re-paste helper functions here for completeness or import them
const normalizeDateStringForAPI_OPA = (date) => {
  if (!date) return null;
  try {
    return formatDateFn(new Date(date), "MM/dd/yyyy");
  } catch (e) {
    console.error("Error normalizing date for API (OPA):", date, e);
    return String(date);
  }
};
const formatDisplayDate_OPA = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return formatDateFn(new Date(dateString), "MM/dd/yyyy");
  } catch (error) {
    return String(dateString);
  }
};
const LoadingSpinner_OPA = () => (
  <div className="flex justify-center items-center h-32">
    {" "}
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>{" "}
  </div>
);

const SummaryStatCard_OPA = ({
  title,
  currentValue,
  previousDayValue,
  icon
}) => {
  const IconComponent = icon || TrendingUp;
  const prevValue = previousDayValue || 0;
  const currValue = currentValue || 0;
  let percentageChange = 0;
  if (prevValue > 0)
    percentageChange = ((currValue - prevValue) / prevValue) * 100;
  else if (currValue > 0 && prevValue === 0) percentageChange = 100;
  else if (currValue === 0 && prevValue === 0) percentageChange = 0;

  const isPositive = percentageChange > 0;
  const isNegative = percentageChange < 0;
  const noChange = percentageChange === 0;
  const changeColor = isPositive
    ? "text-green-500"
    : isNegative
    ? "text-red-500"
    : "text-gray-500";
  const ChangeIcon = isPositive ? ArrowUp : isNegative ? ArrowDown : null;

  return (
    <div className="bg-white p-5 shadow-xl rounded-xl border border-gray-200 flex flex-col justify-between min-h-[160px] hover:shadow-2xl transition-shadow duration-300">
      <div>
        <div className="flex items-center justify-between mb-1">
          {" "}
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </h3>{" "}
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            {" "}
            <IconComponent size={20} />{" "}
          </div>{" "}
        </div>
        <p className="text-3xl font-bold text-gray-800">
          {currValue.toLocaleString()}
        </p>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Prev. Day: {prevValue.toLocaleString()}
          </span>
          {!noChange && ChangeIcon && (
            <span className={`flex items-center font-semibold ${changeColor}`}>
              {" "}
              <ChangeIcon size={14} className="mr-0.5" />{" "}
              {percentageChange.toFixed(1)}%{" "}
            </span>
          )}
          {noChange && (
            <span className={`font-semibold ${changeColor}`}>0.0%</span>
          )}
        </div>
      </div>
    </div>
  );
};

const InspectorColumnToggleButton_OPA = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs text-white rounded-md shadow-sm transition-colors duration-150
                    ${
                      isActive
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-gray-400 hover:bg-gray-500"
                    }`}
  >
    {isActive ? (
      <Check size={12} className="mr-1" />
    ) : (
      <X size={12} className="mr-1" />
    )}
    {label}
  </button>
);

const OPALive = () => {
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // Start true for initial load
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [isLoadingHourlyChart, setIsLoadingHourlyChart] = useState(false);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [moNo, setMoNo] = useState(null);
  const [packageNo, setPackageNo] = useState(null);
  const [custStyle, setCustStyle] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);
  const [qcId, setQcId] = useState(null); // This will be emp_id_opa
  const [appliedFiltersForDisplay, setAppliedFiltersForDisplay] = useState({});

  const [filterOptions, setFilterOptions] = useState({
    moNos: [],
    packageNos: [],
    custStyles: [],
    buyers: [],
    colors: [],
    sizes: [],
    qcIds: []
  });
  // Adjusted summary data state for OPA
  const [summaryData, setSummaryData] = useState({
    totalOPAQty: 0,
    totalBundles: 0,
    totalRecheckOPAQty: 0
  });
  const [previousDaySummary, setPreviousDaySummary] = useState({
    totalOPAQty: 0,
    totalBundles: 0,
    totalRecheckOPAQty: 0
  });
  const [inspectorSummary, setInspectorSummary] = useState([]);
  const [detailedRecords, setDetailedRecords] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20
  });

  const [hourlyChartData, setHourlyChartData] = useState([]);
  const [chartDataType, setChartDataType] = useState("opa"); // 'opa' or 'bundle' for OPA context

  const [visibleCols, setVisibleCols] = useState({
    totalOPAQty: true,
    totalBundles: true,
    totalRecheckOPAQty: true
  });

  const currentFiltersRef = useRef({}); // For intervalled refresh

  // Update currentFiltersRef whenever a filter state changes
  useEffect(() => {
    currentFiltersRef.current = {
      startDate,
      endDate,
      moNo,
      packageNo,
      custStyle,
      buyer,
      color,
      size,
      qcId
    };
  }, [
    startDate,
    endDate,
    moNo,
    packageNo,
    custStyle,
    buyer,
    color,
    size,
    qcId
  ]);

  const buildFilterQueryParams = useCallback((filtersToBuild) => {
    const queryParams = {};
    if (filtersToBuild.startDate)
      queryParams.startDate = normalizeDateStringForAPI_OPA(
        filtersToBuild.startDate
      );
    if (filtersToBuild.endDate)
      queryParams.endDate = normalizeDateStringForAPI_OPA(
        filtersToBuild.endDate
      );
    if (filtersToBuild.moNo) queryParams.moNo = filtersToBuild.moNo.value;
    if (filtersToBuild.packageNo)
      queryParams.packageNo = filtersToBuild.packageNo.value;
    if (filtersToBuild.custStyle)
      queryParams.custStyle = filtersToBuild.custStyle.value;
    if (filtersToBuild.buyer) queryParams.buyer = filtersToBuild.buyer.value;
    if (filtersToBuild.color) queryParams.color = filtersToBuild.color.value;
    if (filtersToBuild.size) queryParams.size = filtersToBuild.size.value;
    if (filtersToBuild.qcId) queryParams.qcId = filtersToBuild.qcId.value; // emp_id_opa
    return queryParams;
  }, []);

  const fetchFilterOptions = useCallback(
    async (currentFilters = {}) => {
      setIsLoadingFilters(true);
      try {
        const queryParamsForFilters = buildFilterQueryParams(currentFilters); // Use the state values directly for query
        const response = await axios.get(`${API_BASE_URL}/api/opa/filters`, {
          params: queryParamsForFilters
        });
        setFilterOptions(response.data);
      } catch (error) {
        console.error("Error fetching OPA filter options:", error);
        setFilterOptions({
          moNos: [],
          packageNos: [],
          custStyles: [],
          buyers: [],
          colors: [],
          sizes: [],
          qcIds: []
        });
      } finally {
        setIsLoadingFilters(false);
      }
    },
    [buildFilterQueryParams]
  );

  const fetchHourlyChartData = useCallback(
    async (filters = {}) => {
      setIsLoadingHourlyChart(true);
      try {
        const queryParams = buildFilterQueryParams(filters);
        const response = await axios.get(
          `${API_BASE_URL}/api/opa/hourly-summary`,
          { params: queryParams }
        );
        setHourlyChartData(response.data || []);
      } catch (error) {
        console.error("Error fetching hourly OPA chart data:", error);
        setHourlyChartData([]);
      } finally {
        setIsLoadingHourlyChart(false);
      }
    },
    [buildFilterQueryParams]
  );

  const fetchData = useCallback(
    async (filters = {}, page = 1, isInitialLoad = false) => {
      if (isInitialLoad) setIsLoading(true); // Full loading spinner only on initial load

      // Fetch dependent data concurrently
      const chartPromise = fetchHourlyChartData(filters);
      const filterOptionsPromise =
        isInitialLoad || Object.keys(filters).length === 0
          ? fetchFilterOptions(filters)
          : Promise.resolve(); // Fetch filters on initial or reset

      try {
        const queryParams = {
          ...buildFilterQueryParams(filters),
          page,
          limit: pagination.limit
        };
        const mainDataPromise = axios.get(
          `${API_BASE_URL}/api/opa/dashboard-data`,
          { params: queryParams }
        );

        const [mainDataResponse] = await Promise.all([
          mainDataPromise,
          chartPromise,
          filterOptionsPromise
        ]);

        const data = mainDataResponse.data;
        setSummaryData(
          data.overallSummary || {
            totalOPAQty: 0,
            totalBundles: 0,
            totalRecheckOPAQty: 0
          }
        );
        setPreviousDaySummary(
          data.previousDaySummary || {
            totalOPAQty: 0,
            totalBundles: 0,
            totalRecheckOPAQty: 0
          }
        );
        setInspectorSummary(data.inspectorSummaryData || []);
        setDetailedRecords(data.detailedRecords || []);
        setPagination(
          data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalRecords: 0,
            limit: 20
          }
        );

        const displayableFilters = {};
        if (filters.startDate)
          displayableFilters["Start Date"] = normalizeDateStringForAPI_OPA(
            filters.startDate
          );
        if (filters.endDate)
          displayableFilters["End Date"] = normalizeDateStringForAPI_OPA(
            filters.endDate
          );
        if (filters.moNo) displayableFilters["MO No"] = filters.moNo.label;
        if (filters.packageNo)
          displayableFilters["Package No"] = filters.packageNo.label;
        if (filters.custStyle)
          displayableFilters["Cust. Style"] = filters.custStyle.label;
        if (filters.buyer) displayableFilters["Buyer"] = filters.buyer.label;
        if (filters.color) displayableFilters["Color"] = filters.color.label;
        if (filters.size) displayableFilters["Size"] = filters.size.label;
        if (filters.qcId)
          displayableFilters["QC ID (OPA)"] = filters.qcId.label;
        setAppliedFiltersForDisplay(displayableFilters);
      } catch (error) {
        console.error("Error fetching OPA dashboard data:", error);
        // Reset states on error
        setSummaryData({
          totalOPAQty: 0,
          totalBundles: 0,
          totalRecheckOPAQty: 0
        });
        setPreviousDaySummary({
          totalOPAQty: 0,
          totalBundles: 0,
          totalRecheckOPAQty: 0
        });
        setInspectorSummary([]);
        setDetailedRecords([]);
      } finally {
        if (isInitialLoad) setIsLoading(false);
      }
    },
    [
      pagination.limit,
      buildFilterQueryParams,
      fetchHourlyChartData,
      fetchFilterOptions
    ]
  );

  // Initial data fetch and interval setup
  useEffect(() => {
    fetchData(currentFiltersRef.current, 1, true); // Initial load

    const intervalId = setInterval(() => {
      console.log(
        "Refreshing OPA data with filters:",
        currentFiltersRef.current
      );
      fetchData(currentFiltersRef.current, pagination.currentPage, false); // Subsequent refreshes, don't show full spinner
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

  const handleApplyFilters = () => {
    fetchData(currentFiltersRef.current, 1, false); // Apply filters, reset to page 1, not initial load
    fetchFilterOptions(currentFiltersRef.current); // Update filter options based on new selection
  };

  const handleResetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setMoNo(null);
    setPackageNo(null);
    setCustStyle(null);
    setBuyer(null);
    setColor(null);
    setSize(null);
    setQcId(null);
    // After states are set, currentFiltersRef will update due to its own useEffect.
    // Then fetchData and fetchFilterOptions will use the empty filters.
    // To ensure they use empty filters immediately:
    const emptyFilters = {};
    currentFiltersRef.current = emptyFilters; // Manually update ref for immediate use
    setAppliedFiltersForDisplay({});
    fetchData(emptyFilters, 1, false);
    fetchFilterOptions(emptyFilters);
  };

  const handlePageChange = (newPage) => {
    fetchData(currentFiltersRef.current, newPage, false);
  };

  const handleColToggle = (colName) =>
    setVisibleCols((prev) => ({ ...prev, [colName]: !prev[colName] }));
  const handleAddAllCols = () =>
    setVisibleCols({
      totalOPAQty: true,
      totalBundles: true,
      totalRecheckOPAQty: true
    });
  const handleClearSomeCols = () =>
    setVisibleCols((prev) => ({
      ...prev,
      totalBundles: false,
      totalRecheckOPAQty: false
    }));

  const inspectorTableData = useMemo(() => {
    const dataByInspector = {};
    const allDatesSet = new Set();
    inspectorSummary.forEach((item) => {
      if (!dataByInspector[item.emp_id]) {
        // emp_id from OPA schema is emp_id_opa
        dataByInspector[item.emp_id] = {
          emp_id: item.emp_id,
          eng_name: item.eng_name || "N/A",
          dates: {}
        };
      }
      const displayDate = formatDisplayDate_OPA(item.date);
      allDatesSet.add(displayDate);
      dataByInspector[item.emp_id].dates[displayDate] = {
        totalOPAQty: item.dailyOPAQty, // from OPA data
        totalBundles: item.dailyBundles,
        totalRecheckOPAQty: item.dailyRecheckOPAQty // from OPA data
      };
    });
    const sortedDates = Array.from(allDatesSet).sort(
      (a, b) => new Date(a) - new Date(b)
    );
    return { data: Object.values(dataByInspector), sortedDates };
  }, [inspectorSummary]);

  const selectStyles = {
    /* ... same as WashingLive ... */
  };
  const datePickerClass =
    "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm h-[38px]";

  const filterFields = [
    /* ... similar, update labels if needed ... */
    {
      label: "Start Date",
      state: startDate,
      setState: setStartDate,
      type: "date"
    },
    {
      label: "End Date",
      state: endDate,
      setState: setEndDate,
      type: "date",
      minDate: startDate
    },
    {
      label: "MO No",
      state: moNo,
      setState: setMoNo,
      options: filterOptions.moNos,
      type: "select",
      placeholder: "Select MO..."
    },
    {
      label: "Package No",
      state: packageNo,
      setState: setPackageNo,
      options: filterOptions.packageNos,
      type: "select",
      placeholder: "Select Pkg..."
    },
    {
      label: "Cust. Style",
      state: custStyle,
      setState: setCustStyle,
      options: filterOptions.custStyles,
      type: "select",
      placeholder: "Select Style..."
    },
    {
      label: "Buyer",
      state: buyer,
      setState: setBuyer,
      options: filterOptions.buyers,
      type: "select",
      placeholder: "Select Buyer..."
    },
    {
      label: "Color",
      state: color,
      setState: setColor,
      options: filterOptions.colors,
      type: "select",
      placeholder: "Select Color..."
    },
    {
      label: "Size",
      state: size,
      setState: setSize,
      options: filterOptions.sizes,
      type: "select",
      placeholder: "Select Size..."
    },
    {
      label: "QC ID (OPA)",
      state: qcId,
      setState: setQcId,
      options: filterOptions.qcIds,
      type: "select",
      placeholder: "Select QC..."
    }
  ];

  // Hourly Bar Chart for OPA
  const formatHourLabel_OPA = (hourStr) => {
    if (!hourStr) return "";
    try {
      const date = parse(hourStr, "HH", new Date());
      return formatDateFn(date, "h aa");
    } catch {
      return hourStr;
    }
  };

  const hourlyBarChartOptions_OPA = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `Hourly ${chartDataType === "opa" ? "OPA Qty" : "Bundle Count"}`
      },
      datalabels: {
        anchor: "end",
        align: "end",
        formatter: (value, context) => {
          const item = hourlyChartData[context.dataIndex];
          const change =
            chartDataType === "opa"
              ? parseFloat(item.opaQtyChange)
              : parseFloat(item.bundleQtyChange);
          let changeStr = "";
          if (change > 0) changeStr = ` ▲${change}%`;
          else if (change < 0) changeStr = ` ▼${Math.abs(change)}%`;
          return `${value.toLocaleString()}${changeStr}`;
        },
        color: (context) => {
          /* ... */ return "#6B7280";
        },
        font: { size: 10 }
      }
    },
    scales: {
      x: {
        title: { display: true, text: "Hour of Day" },
        grid: { display: false }
      },
      y: {
        title: { display: true, text: "Total Quantity" },
        beginAtZero: true
      }
    }
  };

  const preparedHourlyChartData_OPA = {
    labels: hourlyChartData.map((d) => formatHourLabel_OPA(d.hour)),
    datasets: [
      {
        label: chartDataType === "opa" ? "Total OPA Qty" : "Total Bundles",
        data: hourlyChartData.map((d) =>
          chartDataType === "opa" ? d.totalOPAQty : d.totalBundles
        ),
        backgroundColor:
          chartDataType === "opa"
            ? "rgba(255, 159, 64, 0.6)"
            : "rgba(153, 102, 255, 0.6)", // Different colors for OPA
        borderColor:
          chartDataType === "opa"
            ? "rgba(255, 159, 64, 1)"
            : "rgba(153, 102, 255, 1)",
        borderWidth: 1
      }
    ]
  };

  // MAIN JSX RETURN
  if (isLoading && !detailedRecords.length) {
    // Show full page spinner only on absolute initial load
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner_OPA />
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4 bg-gray-50 min-h-screen max-w-[2350px]">
      <header className="mb-4 md:mb-6">
        {" "}
        <h1 className="text-lg md:text-2xl font-semibold text-gray-800 text-center">
          {" "}
          Yorkmars (Cambodia) Garment MFG Co., LTD | OPA Live Dashboard{" "}
        </h1>{" "}
      </header>

      <button
        onClick={() => setIsFilterVisible(!isFilterVisible)}
        className="mb-4 px-3 py-1.5 md:px-4 md:py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center text-xs md:text-sm shadow-md"
      >
        {" "}
        <FilterIcon size={16} className="mr-1 md:mr-2" />{" "}
        {isFilterVisible ? "Hide Filters" : "Show Filters"}{" "}
        {isFilterVisible ? (
          <ChevronDown size={16} className="ml-1" />
        ) : (
          <ChevronRight size={16} className="ml-1" />
        )}{" "}
      </button>

      {isFilterVisible && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-white shadow-lg rounded-lg border border-gray-200">
          {" "}
          {/* Filter Pane JSX - same structure as WashingLive, ensure correct state/handlers */}
          <div className="flex flex-nowrap gap-x-3 md:gap-x-4 overflow-x-auto pb-2 custom-scrollbar">
            {" "}
            {filterFields.map((f) => (
              <div key={f.label} className="flex-shrink-0 w-36 md:w-48 lg:w-56">
                {" "}
                <label
                  className="block text-xs font-medium text-gray-700 mb-1 truncate"
                  title={f.label}
                >
                  {f.label}
                </label>{" "}
                {f.type === "date" ? (
                  <DatePicker
                    selected={f.state}
                    onChange={f.setState}
                    dateFormat="MM/dd/yyyy"
                    className={datePickerClass}
                    placeholderText="MM/DD/YYYY"
                    minDate={f.minDate}
                    isClearable
                    wrapperClassName="w-full"
                  />
                ) : (
                  <Select
                    options={f.options}
                    value={f.state}
                    onChange={f.setState}
                    placeholder={f.placeholder || `Select...`}
                    isClearable
                    isLoading={isLoadingFilters}
                    styles={selectStyles}
                    menuPosition="fixed"
                    classNamePrefix="react-select"
                  />
                )}{" "}
              </div>
            ))}{" "}
          </div>{" "}
          <div className="mt-3 md:mt-4 flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-3">
            {" "}
            <button
              onClick={handleApplyFilters}
              disabled={isLoadingFilters}
              className="w-full sm:w-auto px-4 py-1.5 md:px-6 md:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center text-xs md:text-sm shadow-md disabled:opacity-60"
            >
              {" "}
              <SearchIcon size={16} className="mr-1 md:mr-2" /> Apply{" "}
            </button>{" "}
            <button
              onClick={handleResetFilters}
              disabled={isLoadingFilters}
              className="w-full sm:w-auto p-2 md:p-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 shadow-md disabled:opacity-60"
              title="Clear Filters"
            >
              {" "}
              <RotateCcw size={16} />{" "}
            </button>{" "}
          </div>
        </div>
      )}

      {/* Conditional rendering for loading part of the page vs initial full load */}
      {isLoading && detailedRecords.length > 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <LoadingSpinner_OPA />
        </div>
      )}

      {(!isLoading || detailedRecords.length > 0) && ( // Render content if not initial full loading OR if records exist
        <>
          {/* Summary Cards - Adjust titles and values for OPA */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 mb-4 md:mb-8">
            <SummaryStatCard_OPA
              title="Total OPA Qty"
              currentValue={summaryData.totalOPAQty}
              previousDayValue={previousDaySummary.totalOPAQty}
              icon={TrendingUp}
            />
            <SummaryStatCard_OPA
              title="Total Bundles"
              currentValue={summaryData.totalBundles}
              previousDayValue={previousDaySummary.totalBundles}
              icon={TrendingUp}
            />
            <SummaryStatCard_OPA
              title="Total Re-Check OPA Qty"
              currentValue={summaryData.totalRecheckOPAQty}
              previousDayValue={previousDaySummary.totalRecheckOPAQty}
              icon={TrendingDown}
            />
          </div>

          {/* Inspector Summary Table - Adjust column names and data keys for OPA */}
          <div className="mb-4 md:mb-8 p-3 md:p-4 bg-white shadow-xl rounded-xl border border-gray-200">
            <h2 className="text-base md:text-xl font-semibold text-gray-700 mb-2">
              OPA Qty Summary by Inspector
            </h2>
            {Object.keys(appliedFiltersForDisplay).length > 0 && (
              <div className="mb-2 md:mb-3 text-[10px] md:text-xs text-gray-500 italic">
                {" "}
                Filters:{" "}
                {Object.entries(appliedFiltersForDisplay)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")}{" "}
              </div>
            )}
            <div className="mb-3 md:mb-4 flex flex-wrap gap-1 md:gap-2 items-center">
              <button
                onClick={handleAddAllCols}
                className="px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs text-white rounded-md shadow-sm bg-blue-500 hover:bg-blue-600"
              >
                Add All
              </button>
              <button
                onClick={handleClearSomeCols}
                className="px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs text-white rounded-md shadow-sm bg-orange-500 hover:bg-orange-600"
              >
                Clear Some
              </button>
              <div className="flex gap-1 md:gap-2 ml-auto">
                <InspectorColumnToggleButton_OPA
                  label="OPA Qty"
                  isActive={visibleCols.totalOPAQty}
                  onClick={() => handleColToggle("totalOPAQty")}
                />
                <InspectorColumnToggleButton_OPA
                  label="Bundles"
                  isActive={visibleCols.totalBundles}
                  onClick={() => handleColToggle("totalBundles")}
                />
                <InspectorColumnToggleButton_OPA
                  label="Re-Check"
                  isActive={visibleCols.totalRecheckOPAQty}
                  onClick={() => handleColToggle("totalRecheckOPAQty")}
                />
              </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar text-[11px] md:text-sm">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-md overflow-hidden">
                <thead className="bg-gray-100">
                  <tr className="text-gray-600 uppercase text-xs tracking-wider">
                    <th className="px-2 py-2 md:px-3 md:py-3 text-left font-semibold border-r sticky left-0 bg-gray-100 z-20 min-w-[80px] md:min-w-[100px]">
                      Emp ID
                    </th>
                    <th className="px-2 py-2 md:px-3 md:py-3 text-left font-semibold border-r sticky left-[calc(var(--emp-id-width,80px)+1px)] md:left-[calc(var(--emp-id-width-md,100px)+1px)] bg-gray-100 z-20 min-w-[120px] md:min-w-[150px]">
                      Emp Name
                    </th>
                    {inspectorTableData.sortedDates.map((date) => (
                      <th
                        key={date}
                        colSpan={
                          Object.values(visibleCols).filter((v) => v).length ||
                          1
                        }
                        className="px-1 py-2 md:px-1 md:py-3 text-center font-semibold border-r min-w-[120px] md:min-w-[150px]"
                      >
                        {date}
                        {Object.values(visibleCols).filter((v) => v).length >
                          0 && (
                          <div className="flex justify-around mt-0.5 md:mt-1 text-[9px] md:text-[10px] font-normal normal-case text-gray-500">
                            {visibleCols.totalOPAQty && (
                              <span className="w-1/3 text-center px-0.5">
                                OPA
                              </span>
                            )}
                            {visibleCols.totalBundles && (
                              <span className="w-1/3 text-center px-0.5">
                                Bundle
                              </span>
                            )}
                            {visibleCols.totalRecheckOPAQty && (
                              <span className="w-1/3 text-center px-0.5">
                                Re-Chk
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inspectorTableData.data.length > 0 ? (
                    inspectorTableData.data.map((inspector) => (
                      <tr
                        key={inspector.emp_id}
                        className="hover:bg-orange-50 transition-colors duration-150"
                      >
                        {" "}
                        {/* Orange hover for OPA */}
                        <td
                          className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r sticky left-0 bg-white hover:bg-orange-50 z-10"
                          style={{
                            width: "var(--emp-id-width, 80px)",
                            minWidth: "var(--emp-id-width, 80px)"
                          }}
                        >
                          {inspector.emp_id}
                        </td>
                        <td
                          className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r sticky left-[calc(var(--emp-id-width,80px)+1px)] md:left-[calc(var(--emp-id-width-md,100px)+1px)] bg-white hover:bg-orange-50 z-10"
                          style={{
                            width: "var(--emp-name-width, 120px)",
                            minWidth: "var(--emp-name-width, 120px)"
                          }}
                        >
                          {inspector.eng_name}
                        </td>
                        {inspectorTableData.sortedDates.map((date) => {
                          const dayData = inspector.dates[date] || {};
                          const hasVisibleCols = Object.values(
                            visibleCols
                          ).some((v) => v);
                          return hasVisibleCols ? (
                            <React.Fragment key={`${inspector.emp_id}-${date}`}>
                              {visibleCols.totalOPAQty && (
                                <td className="px-1 py-1.5 md:px-1 md:py-2 text-center border-r">
                                  {dayData.totalOPAQty || 0}
                                </td>
                              )}
                              {visibleCols.totalBundles && (
                                <td className="px-1 py-1.5 md:px-1 md:py-2 text-center border-r">
                                  {dayData.totalBundles || 0}
                                </td>
                              )}
                              {visibleCols.totalRecheckOPAQty && (
                                <td className="px-1 py-1.5 md:px-1 md:py-2 text-center border-r">
                                  {dayData.totalRecheckOPAQty || 0}
                                </td>
                              )}
                            </React.Fragment>
                          ) : (
                            <td
                              key={`${inspector.emp_id}-${date}-empty`}
                              className="px-1 py-1.5 md:px-1 md:py-2 text-center text-gray-400 border-r"
                            >
                              -
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          2 +
                          inspectorTableData.sortedDates.length *
                            (Object.values(visibleCols).filter((v) => v)
                              .length || 1)
                        }
                        className="text-center py-4 text-gray-500"
                      >
                        No summary data for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hourly OPA Chart */}
          <div className="mb-4 md:mb-8 p-3 md:p-4 bg-white shadow-xl rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base md:text-xl font-semibold text-gray-700">
                Hourly Performance (OPA)
              </h2>
              <div className="flex space-x-1">
                <button
                  onClick={() => setChartDataType("opa")}
                  className={`px-2 py-1 text-xs rounded-md ${
                    chartDataType === "opa"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  OPA Qty
                </button>
                <button
                  onClick={() => setChartDataType("bundle")}
                  className={`px-2 py-1 text-xs rounded-md ${
                    chartDataType === "bundle"
                      ? "bg-purple-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Bundle Count
                </button>
              </div>
            </div>
            {isLoadingHourlyChart ? (
              <LoadingSpinner_OPA />
            ) : hourlyChartData.length > 0 ? (
              <div className="h-[300px] md:h-[400px]">
                <Bar
                  options={hourlyBarChartOptions_OPA}
                  data={preparedHourlyChartData_OPA}
                />
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No hourly OPA data available for selected filters.
              </p>
            )}
          </div>

          {/* Detailed Records Table - Adjust column names (emp_id_opa, eng_name_opa, passQtyOPA etc.) and data keys */}
          <div className="p-3 md:p-4 bg-white shadow-xl rounded-xl border border-gray-200">
            <h2 className="text-base md:text-xl font-semibold text-gray-700 mb-3 md:mb-4">
              Detailed OPA Records
            </h2>
            <div className="overflow-x-auto max-h-[500px] md:max-h-[600px] custom-scrollbar text-[11px] md:text-sm">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-md overflow-hidden">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr className="text-gray-600 uppercase text-xs tracking-wider">
                    {[
                      "Insp. Date",
                      "Emp ID",
                      "Emp Name",
                      "Dept.",
                      "MO No",
                      "Pkg No",
                      "Cust. Style",
                      "Buyer",
                      "Color",
                      "Size",
                      "Insp. Time",
                      "OPA Qty",
                      "Bundles",
                      "Re-Chk Qty"
                    ].map((h, idx) => (
                      <th
                        key={h}
                        className={`px-2 py-2 md:px-3 md:py-3 text-left font-semibold border-r whitespace-nowrap ${
                          idx === 0
                            ? "sticky left-0 bg-gray-100 z-20 min-w-[90px] md:min-w-[100px]"
                            : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {detailedRecords.length > 0 ? (
                    detailedRecords.map((record, index) => (
                      <tr
                        key={index}
                        className="hover:bg-orange-50 transition-colors duration-150"
                      >
                        {" "}
                        {/* Orange hover for OPA */}
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r sticky left-0 bg-white hover:bg-orange-50 z-0">
                          {formatDisplayDate_OPA(record.opa_updated_date)}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.emp_id_opa}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.eng_name_opa || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.dept_name_opa || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.selectedMono || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.package_no}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.custStyle || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.buyer || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.color || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.size || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.opa_update_time || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r text-center">
                          {record.opaQty || 0}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r text-center">
                          {1}
                        </td>{" "}
                        {/* Ensure 'bundleCount' is correct from schema/projection */}
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r text-center">
                          {record.recheckOPAQty || 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={14}
                        className="text-center py-4 text-gray-500"
                      >
                        No detailed OPA records for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination (same structure) */}
            {pagination.totalPages > 1 && (
              <div className="mt-3 md:mt-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                {" "}
                <span className="text-[10px] sm:text-xs text-gray-700">
                  {" "}
                  Page {pagination.currentPage} of {pagination.totalPages}{" "}
                  (Total: {pagination.totalRecords} records){" "}
                </span>{" "}
                <div className="flex space-x-1">
                  {" "}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                    className="px-2 py-1 md:px-2.5 md:py-1.5 border border-gray-300 text-[10px] md:text-xs rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>{" "}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-2 py-1 md:px-2.5 md:py-1.5 border border-gray-300 text-[10px] md:text-xs rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} />
                  </button>{" "}
                  <span className="px-2 py-1 md:px-2.5 md:py-1.5 text-[10px] md:text-xs">
                    Page {pagination.currentPage}
                  </span>{" "}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-2 py-1 md:px-2.5 md:py-1.5 border border-gray-300 text-[10px] md:text-xs rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={14} />
                  </button>{" "}
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-2 py-1 md:px-2.5 md:py-1.5 border border-gray-300 text-[10px] md:text-xs rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>{" "}
                </div>{" "}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OPALive;
