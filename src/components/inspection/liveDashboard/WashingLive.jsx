// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../config";
// import DataTableWOI from "./DataTableWOI";
// import FilterPaneWOI from "./FilterPaneWOI";

// const WashingLive = () => {
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

//   // Fetch washing data
//   const fetchWashingData = async (filters = {}, currentPage = page) => {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/api/washing-summary`, {
//         params: { ...filters, page: currentPage, limit }
//       });
//       setTableData(response.data.tableData);
//       setTotalRecords(response.data.total);
//     } catch (error) {
//       console.error("Error fetching washing data:", error);
//     }
//   };

//   // Handle pagination
//   const handlePageChange = async (newPage) => {
//     setPage(newPage);
//     await fetchWashingData(filters, newPage);
//   };

//   // Initial fetch and auto-refresh
//   useEffect(() => {
//     fetchWashingData();

//     const intervalId = setInterval(() => fetchWashingData(filters), 5000);
//     return () => clearInterval(intervalId);
//   }, [filters]);

//   return (
//     <div className="p-6 bg-gray-100 min-h-screen">
//       <FilterPaneWOI
//         module="washing"
//         empIdField="emp_id_washing"
//         filters={filters}
//         setFilters={setFilters}
//         fetchData={fetchWashingData}
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

// export default WashingLive;

// // CSS for custom scrollbar (optional)
// // Add to your global CSS file or a <style> tag in index.html
// /*
// .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
// .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
// .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }
// .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
// */

// // For sticky columns in inspector table, define CSS variables for column widths
// /*
// :root {
//   --emp-id-width: 80px;
//   --emp-id-width-md: 100px;
//   --emp-name-width: 120px;
//   --emp-name-width-md: 150px;
// }
// */

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
import ChartDataLabels from "chartjs-plugin-datalabels"; // For displaying labels on bars
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
} from "lucide-react"; // Added Check, X
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config";

// Register ChartJS components
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
  ChartDataLabels // Register the datalabels plugin
);

const normalizeDateStringForAPI = (date) => {
  if (!date) return null;
  try {
    return formatDateFn(new Date(date), "MM/dd/yyyy");
  } catch (e) {
    console.error("Error normalizing date for API:", date, e);
    return String(date);
  }
};
const formatDisplayDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return formatDateFn(new Date(dateString), "MM/dd/yyyy");
  } catch (error) {
    return String(dateString);
  }
};
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-32">
    {" "}
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>{" "}
  </div>
);

const SummaryStatCard = ({ title, currentValue, previousDayValue, icon }) => {
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

const InspectorColumnToggleButton = ({ label, isActive, onClick }) => (
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

const WashingLive = () => {
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
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
  const [qcId, setQcId] = useState(null);
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
  const [summaryData, setSummaryData] = useState({
    totalWashingQty: 0,
    totalBundles: 0,
    totalRewashQty: 0
  });
  const [previousDaySummary, setPreviousDaySummary] = useState({
    totalWashingQty: 0,
    totalBundles: 0,
    totalRewashQty: 0
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
  const [chartDataType, setChartDataType] = useState("washing"); // 'washing' or 'bundle'

  // Inspector table column visibility state
  const [visibleCols, setVisibleCols] = useState({
    totalWashingQty: true,
    totalBundles: true,
    totalRewashQty: true
  });

  const buildFilterQueryParams = (filtersToBuild) => {
    const queryParams = {};
    if (filtersToBuild.startDate)
      queryParams.startDate = normalizeDateStringForAPI(
        filtersToBuild.startDate
      );
    if (filtersToBuild.endDate)
      queryParams.endDate = normalizeDateStringForAPI(filtersToBuild.endDate);
    if (filtersToBuild.moNo) queryParams.moNo = filtersToBuild.moNo.value;
    if (filtersToBuild.packageNo)
      queryParams.packageNo = filtersToBuild.packageNo.value;
    if (filtersToBuild.custStyle)
      queryParams.custStyle = filtersToBuild.custStyle.value;
    if (filtersToBuild.buyer) queryParams.buyer = filtersToBuild.buyer.value;
    if (filtersToBuild.color) queryParams.color = filtersToBuild.color.value;
    if (filtersToBuild.size) queryParams.size = filtersToBuild.size.value;
    if (filtersToBuild.qcId) queryParams.qcId = filtersToBuild.qcId.value;
    return queryParams;
  };

  const fetchFilterOptions = useCallback(async (currentFilters = {}) => {
    setIsLoadingFilters(true);
    try {
      const queryParamsForFilters = {}; // Build this from currentFilters.value
      if (currentFilters.startDate)
        queryParamsForFilters.startDate = normalizeDateStringForAPI(
          currentFilters.startDate
        );
      if (currentFilters.endDate)
        queryParamsForFilters.endDate = normalizeDateStringForAPI(
          currentFilters.endDate
        );
      if (currentFilters.moNo)
        queryParamsForFilters.moNo = currentFilters.moNo.value;
      if (currentFilters.packageNo)
        queryParamsForFilters.packageNo = currentFilters.packageNo.value;
      if (currentFilters.custStyle)
        queryParamsForFilters.custStyle = currentFilters.custStyle.value;
      if (currentFilters.buyer)
        queryParamsForFilters.buyer = currentFilters.buyer.value;
      if (currentFilters.color)
        queryParamsForFilters.color = currentFilters.color.value;
      if (currentFilters.size)
        queryParamsForFilters.size = currentFilters.size.value;
      if (currentFilters.qcId)
        queryParamsForFilters.qcId = currentFilters.qcId.value;

      const response = await axios.get(`${API_BASE_URL}/api/washing/filters`, {
        params: queryParamsForFilters
      });
      setFilterOptions(response.data);
    } catch (error) {
      console.error("Error fetching filter options:", error);
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
  }, []);

  const fetchHourlyChartData = useCallback(async (filters = {}) => {
    setIsLoadingHourlyChart(true);
    try {
      const queryParams = buildFilterQueryParams(filters);
      const response = await axios.get(
        `${API_BASE_URL}/api/washing/hourly-summary`,
        { params: queryParams }
      );
      setHourlyChartData(response.data || []);
    } catch (error) {
      console.error("Error fetching hourly chart data:", error);
      setHourlyChartData([]);
    } finally {
      setIsLoadingHourlyChart(false);
    }
  }, []);

  const fetchData = useCallback(
    async (filters = {}, page = 1) => {
      setIsLoading(true);
      fetchHourlyChartData(filters); // Fetch chart data along with main data
      try {
        const queryParams = {
          ...buildFilterQueryParams(filters),
          page,
          limit: pagination.limit
        };
        const response = await axios.get(
          `${API_BASE_URL}/api/washing/dashboard-data`,
          { params: queryParams }
        );
        setSummaryData(
          response.data.overallSummary || {
            totalWashingQty: 0,
            totalBundles: 0,
            totalRewashQty: 0
          }
        );
        setPreviousDaySummary(
          response.data.previousDaySummary || {
            totalWashingQty: 0,
            totalBundles: 0,
            totalRewashQty: 0
          }
        );
        setInspectorSummary(response.data.inspectorSummaryData || []);
        setDetailedRecords(response.data.detailedRecords || []);
        setPagination(
          response.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalRecords: 0,
            limit: 20
          }
        );
        // ... (setAppliedFiltersForDisplay logic)
        const displayableFilters = {};
        if (filters.startDate)
          displayableFilters["Start Date"] = normalizeDateStringForAPI(
            filters.startDate
          );
        if (filters.endDate)
          displayableFilters["End Date"] = normalizeDateStringForAPI(
            filters.endDate
          );
        if (filters.moNo)
          displayableFilters["MO No (selectedMono)"] = filters.moNo.label;
        if (filters.packageNo)
          displayableFilters["Package No"] = filters.packageNo.label;
        if (filters.custStyle)
          displayableFilters["Cust. Style"] = filters.custStyle.label;
        if (filters.buyer) displayableFilters["Buyer"] = filters.buyer.label;
        if (filters.color) displayableFilters["Color"] = filters.color.label;
        if (filters.size) displayableFilters["Size"] = filters.size.label;
        if (filters.qcId) displayableFilters["QC ID"] = filters.qcId.label;
        setAppliedFiltersForDisplay(displayableFilters);
      } catch (error) {
        console.error(
          "Error fetching washing dashboard data:",
          error
        ); /* Reset states */
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.limit, fetchHourlyChartData]
  ); // Added fetchHourlyChartData

  useEffect(() => {
    const initialFilters = {
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
    fetchFilterOptions(initialFilters);
    fetchData(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    const currentFilters = {
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
    fetchData(currentFilters, 1);
    fetchFilterOptions(currentFilters);
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
    setAppliedFiltersForDisplay({});
    fetchData({}, 1);
    fetchFilterOptions({});
  };

  const handlePageChange = (newPage) => {
    const currentFilters = {
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
    fetchData(currentFilters, newPage);
  };

  // Inspector table column toggle logic
  const handleColToggle = (colName) => {
    setVisibleCols((prev) => ({ ...prev, [colName]: !prev[colName] }));
  };
  const handleAddAllCols = () => {
    setVisibleCols({
      totalWashingQty: true,
      totalBundles: true,
      totalRewashQty: true
    });
  };
  const handleClearSomeCols = () => {
    // "Clear All" now clears only Bundle and Rewash
    setVisibleCols((prev) => ({
      ...prev,
      totalBundles: false,
      totalRewashQty: false
    }));
  };

  const inspectorTableData = useMemo(() => {
    /* ... same as before ... */
    const dataByInspector = {};
    const allDatesSet = new Set();
    inspectorSummary.forEach((item) => {
      if (!dataByInspector[item.emp_id]) {
        dataByInspector[item.emp_id] = {
          emp_id: item.emp_id,
          eng_name: item.eng_name || "N/A",
          dates: {}
        };
      }
      const displayDate = formatDisplayDate(item.date);
      allDatesSet.add(displayDate);
      dataByInspector[item.emp_id].dates[displayDate] = {
        totalWashingQty: item.dailyWashingQty,
        totalBundles: item.dailyBundles,
        totalRewashQty: item.dailyRewashQty
      };
    });
    const sortedDates = Array.from(allDatesSet).sort(
      (a, b) => new Date(a) - new Date(b)
    );
    return { data: Object.values(dataByInspector), sortedDates };
  }, [inspectorSummary]);

  const selectStyles = {
    /* ... same, ensure zIndex for menu ... */
    control: (p) => ({
      ...p,
      minHeight: "38px",
      height: "38px",
      borderColor: "#D1D5DB",
      borderRadius: "0.375rem",
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    }),
    valueContainer: (p) => ({ ...p, height: "38px", padding: "0 8px" }),
    input: (p) => ({ ...p, margin: "0px" }),
    indicatorSeparator: () => ({ display: "none" }),
    indicatorsContainer: (p) => ({ ...p, height: "38px" }),
    menu: (p) => ({ ...p, zIndex: 9999 })
  };
  const datePickerClass =
    "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm h-[38px]";

  const filterFields = [
    /* ... same ... */
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
      label: "MO No (selectedMono)",
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
      label: "QC ID",
      state: qcId,
      setState: setQcId,
      options: filterOptions.qcIds,
      type: "select",
      placeholder: "Select QC..."
    }
  ];

  // Hourly Bar Chart Data and Options
  const formatHourLabel = (hourStr) => {
    // HH to HH AM/PM
    if (!hourStr) return "";
    try {
      const date = parse(hourStr, "HH", new Date());
      return formatDateFn(date, "h aa");
    } catch {
      return hourStr;
    }
  };

  const hourlyBarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `Hourly ${
          chartDataType === "washing" ? "Washing Qty" : "Bundle Count"
        }`
      },
      datalabels: {
        anchor: "end",
        align: "end",
        formatter: (value, context) => {
          const item = hourlyChartData[context.dataIndex];
          const change =
            chartDataType === "washing"
              ? parseFloat(item.washingQtyChange)
              : parseFloat(item.bundleQtyChange);
          let changeStr = "";
          if (change > 0) changeStr = ` ▲${change}%`;
          else if (change < 0) changeStr = ` ▼${Math.abs(change)}%`;

          return `${value.toLocaleString()}${changeStr}`;
        },
        color: (context) => {
          const item = hourlyChartData[context.dataIndex];
          const change =
            chartDataType === "washing"
              ? parseFloat(item.washingQtyChange)
              : parseFloat(item.bundleQtyChange);
          return change < 0 ? "#EF4444" : change > 0 ? "#22C55E" : "#6B7280"; // Red, Green, Gray
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

  const preparedHourlyChartData = {
    labels: hourlyChartData.map((d) => formatHourLabel(d.hour)),
    datasets: [
      {
        label:
          chartDataType === "washing" ? "Total Washing Qty" : "Total Bundles",
        data: hourlyChartData.map((d) =>
          chartDataType === "washing" ? d.totalWashingQty : d.totalBundles
        ),
        backgroundColor:
          chartDataType === "washing"
            ? "rgba(54, 162, 235, 0.6)"
            : "rgba(75, 192, 192, 0.6)",
        borderColor:
          chartDataType === "washing"
            ? "rgba(54, 162, 235, 1)"
            : "rgba(75, 192, 192, 1)",
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="p-2 md:p-4 bg-gray-50 min-h-screen max-w-[2350px]">
      <header className="mb-4 md:mb-6">
        {" "}
        <h1 className="text-lg md:text-2xl font-semibold text-gray-800 text-center">
          {" "}
          Yorkmars (Cambodia) Garment MFG Co., LTD | Washing Live Dashboard{" "}
        </h1>{" "}
      </header>

      <button
        onClick={() => setIsFilterVisible(!isFilterVisible)}
        className="mb-4 px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-xs md:text-sm shadow-md"
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
              disabled={isLoading || isLoadingFilters}
              className="w-full sm:w-auto px-4 py-1.5 md:px-6 md:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center text-xs md:text-sm shadow-md disabled:opacity-60"
            >
              {" "}
              <SearchIcon size={16} className="mr-1 md:mr-2" /> Apply{" "}
            </button>{" "}
            <button
              onClick={handleResetFilters}
              disabled={isLoading || isLoadingFilters}
              className="w-full sm:w-auto p-2 md:p-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 shadow-md disabled:opacity-60"
              title="Clear Filters"
            >
              {" "}
              <RotateCcw size={16} />{" "}
            </button>{" "}
          </div>{" "}
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      {!isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 mb-4 md:mb-8">
            {" "}
            <SummaryStatCard
              title="Total Washing Qty"
              currentValue={summaryData.totalWashingQty}
              previousDayValue={previousDaySummary.totalWashingQty}
              icon={TrendingUp}
            />{" "}
            <SummaryStatCard
              title="Total Bundles"
              currentValue={summaryData.totalBundles}
              previousDayValue={previousDaySummary.totalBundles}
              icon={TrendingUp}
            />{" "}
            <SummaryStatCard
              title="Total Rewash Qty"
              currentValue={summaryData.totalRewashQty}
              previousDayValue={previousDaySummary.totalRewashQty}
              icon={TrendingDown}
            />{" "}
          </div>

          {/* Inspector Summary Table */}
          <div className="mb-4 md:mb-8 p-3 md:p-4 bg-white shadow-xl rounded-xl border border-gray-200">
            <h2 className="text-base md:text-xl font-semibold text-gray-700 mb-2">
              Washing Qty Summary by Inspector
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
                {" "}
                {/* Group toggle buttons */}
                <InspectorColumnToggleButton
                  label="Wash Qty"
                  isActive={visibleCols.totalWashingQty}
                  onClick={() => handleColToggle("totalWashingQty")}
                />
                <InspectorColumnToggleButton
                  label="Bundles"
                  isActive={visibleCols.totalBundles}
                  onClick={() => handleColToggle("totalBundles")}
                />
                <InspectorColumnToggleButton
                  label="Rewash Qty"
                  isActive={visibleCols.totalRewashQty}
                  onClick={() => handleColToggle("totalRewashQty")}
                />
              </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar text-[11px] md:text-sm">
              {/* Inspector Table (same structure as before, ensure styles are applied for beauty) */}
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
                            {visibleCols.totalWashingQty && (
                              <span className="w-1/3 text-center px-0.5">
                                Wash
                              </span>
                            )}
                            {visibleCols.totalBundles && (
                              <span className="w-1/3 text-center px-0.5">
                                Bundle
                              </span>
                            )}
                            {visibleCols.totalRewashQty && (
                              <span className="w-1/3 text-center px-0.5">
                                Rewash
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
                        className="hover:bg-blue-50 transition-colors duration-150"
                      >
                        <td
                          className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r sticky left-0 bg-white hover:bg-blue-50 z-10"
                          style={{
                            width: "var(--emp-id-width, 80px)",
                            minWidth: "var(--emp-id-width, 80px)"
                          }}
                        >
                          {inspector.emp_id}
                        </td>
                        <td
                          className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r sticky left-[calc(var(--emp-id-width,80px)+1px)] md:left-[calc(var(--emp-id-width-md,100px)+1px)] bg-white hover:bg-blue-50 z-10"
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
                              {visibleCols.totalWashingQty && (
                                <td className="px-1 py-1.5 md:px-1 md:py-2 text-center border-r">
                                  {dayData.totalWashingQty || 0}
                                </td>
                              )}
                              {visibleCols.totalBundles && (
                                <td className="px-1 py-1.5 md:px-1 md:py-2 text-center border-r">
                                  {dayData.totalBundles || 0}
                                </td>
                              )}
                              {visibleCols.totalRewashQty && (
                                <td className="px-1 py-1.5 md:px-1 md:py-2 text-center border-r">
                                  {dayData.totalRewashQty || 0}
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

          {/* Hourly Washing Chart */}
          <div className="mb-4 md:mb-8 p-3 md:p-4 bg-white shadow-xl rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base md:text-xl font-semibold text-gray-700">
                Hourly Performance
              </h2>
              <div className="flex space-x-1">
                <button
                  onClick={() => setChartDataType("washing")}
                  className={`px-2 py-1 text-xs rounded-md ${
                    chartDataType === "washing"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Washing Qty
                </button>
                <button
                  onClick={() => setChartDataType("bundle")}
                  className={`px-2 py-1 text-xs rounded-md ${
                    chartDataType === "bundle"
                      ? "bg-teal-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Bundle Count
                </button>
              </div>
            </div>
            {isLoadingHourlyChart ? (
              <LoadingSpinner />
            ) : hourlyChartData.length > 0 ? (
              <div className="h-[300px] md:h-[400px]">
                {" "}
                {/* Set a fixed height for the chart container */}
                <Bar
                  options={hourlyBarChartOptions}
                  data={preparedHourlyChartData}
                />
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No hourly data available for selected filters.
              </p>
            )}
          </div>

          {/* Detailed Records Table */}
          <div className="p-3 md:p-4 bg-white shadow-xl rounded-xl border border-gray-200">
            {/* ... Detailed Table structure same as before, ensure styles are applied ... */}
            <h2 className="text-base md:text-xl font-semibold text-gray-700 mb-3 md:mb-4">
              Detailed Washing Records
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
                      "Wash Qty",
                      "Bundles",
                      "Rewash Qty"
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
                        className="hover:bg-blue-50 transition-colors duration-150"
                      >
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r sticky left-0 bg-white hover:bg-blue-50 z-0">
                          {formatDisplayDate(record.washing_updated_date)}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.emp_id_washing}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.eng_name_washing || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.dept_name_washing || "N/A"}
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
                          {record.washing_update_time || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r text-center">
                          {record.washingQty || 0}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r text-center">
                          {1}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r text-center">
                          {record.rewashQty || 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={14}
                        className="text-center py-4 text-gray-500"
                      >
                        No detailed records for selected filters.
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

export default WashingLive;
