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
  X,
  Calendar,
  Users,
  Package,
  BarChart3,
  Eye,
  EyeOff,
  RefreshCw,
  Moon,
  Sun,
  ClipboardCheck
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Bar } from "react-chartjs-2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config";

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
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 dark:border-orange-800"></div>
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-600 dark:border-orange-400 border-t-transparent absolute top-0 left-0"></div>
    </div>
  </div>
);

const DarkModeToggle_OPA = ({ darkMode, setDarkMode }) => (
  <button
    onClick={() => setDarkMode(!darkMode)}
    className="fixed top-4 right-4 z-50 p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
    title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
  >
    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
  </button>
);

const SummaryStatCard_OPA = ({
  title,
  currentValue,
  previousDayValue,
  icon
}) => {
  const IconComponent = icon || ClipboardCheck;
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
    ? "text-emerald-600 dark:text-emerald-400"
    : isNegative
    ? "text-red-500 dark:text-red-400"
    : "text-gray-500 dark:text-gray-400";

  const ChangeIcon = isPositive ? ArrowUp : isNegative ? ArrowDown : null;

  return (
    <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 shadow-lg dark:shadow-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl dark:hover:shadow-gray-900/70 hover:scale-105 transition-all duration-300 min-h-[180px]">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            {title}
          </h3>
          <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 text-white rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            <IconComponent size={24} />
          </div>
        </div>
        
        <p className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          {currValue.toLocaleString()}
        </p>

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Previous Day: {prevValue.toLocaleString()}
            </span>
            {!noChange && ChangeIcon && (
              <span className={`flex items-center font-bold text-sm ${changeColor}`}>
                <ChangeIcon size={16} className="mr-1" />
                {percentageChange.toFixed(1)}%
              </span>
            )}
            {noChange && (
              <span className={`font-bold text-sm ${changeColor}`}>0.0%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InspectorColumnToggleButton_OPA = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-3 py-2 text-xs font-medium rounded-lg shadow-sm transition-all duration-200 transform hover:scale-105
                ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white shadow-emerald-200 dark:shadow-emerald-900/50"
                    : "bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 text-white shadow-gray-200 dark:shadow-gray-900/50"
                } hover:shadow-lg`}
  >
    {isActive ? (
      <Check size={14} className="mr-1.5" />
    ) : (
      <X size={14} className="mr-1.5" />
    )}
    {label}
  </button>
);

const OPALive = () => {
  const [darkMode, setDarkMode] = useState(false);
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
  const [chartDataType, setChartDataType] = useState("opa");
  const [visibleCols, setVisibleCols] = useState({
    totalOPAQty: true,
    totalBundles: true,
    totalRecheckOPAQty: true
  });

  const currentFiltersRef = useRef({});

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
    if (filtersToBuild.qcId) queryParams.qcId = filtersToBuild.qcId.value;
    return queryParams;
  }, []);

  const fetchFilterOptions = useCallback(
    async (currentFilters = {}) => {
      setIsLoadingFilters(true);
      try {
        const queryParamsForFilters = buildFilterQueryParams(currentFilters);
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
    async (filters = {}, page = 1) => {
      setIsLoading(true);
      fetchHourlyChartData(filters);

      try {
        const queryParams = {
          ...buildFilterQueryParams(filters),
          page,
          limit: pagination.limit
        };

        const response = await axios.get(
          `${API_BASE_URL}/api/opa/dashboard-data`,
          { params: queryParams }
        );

        const data = response.data;

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
        setIsLoading(false);
      }
    },
    [
      pagination.limit,
      buildFilterQueryParams,
      fetchHourlyChartData
    ]
  );

  useEffect(() => {
    const initialFilters = currentFiltersRef.current;
    fetchFilterOptions(initialFilters);
    fetchData(initialFilters, 1);

    const intervalId = setInterval(() => {
      fetchData(currentFiltersRef.current, pagination.currentPage);
    }, 30000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    const currentFilters = currentFiltersRef.current;
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

    const emptyFilters = {};
    currentFiltersRef.current = emptyFilters;
    setAppliedFiltersForDisplay({});

    fetchData(emptyFilters, 1);
    fetchFilterOptions(emptyFilters);
  };

  const handlePageChange = (newPage) => {
    fetchData(currentFiltersRef.current, newPage);
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
        dataByInspector[item.emp_id] = {
          emp_id: item.emp_id,
          eng_name: item.eng_name || "N/A",
          dates: {}
        };
      }

      const displayDate = formatDisplayDate_OPA(item.date);
      allDatesSet.add(displayDate);

      dataByInspector[item.emp_id].dates[displayDate] = {
        totalOPAQty: item.dailyOPAQty,
        totalBundles: item.dailyBundles,
        totalRecheckOPAQty: item.dailyRecheckOPAQty
      };
    });

    const sortedDates = Array.from(allDatesSet).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    return { data: Object.values(dataByInspector), sortedDates };
  }, [inspectorSummary]);

  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: "42px",
      height: "42px",
      borderColor: state.isFocused ? "#F97316" : (darkMode ? "#4B5563" : "#D1D5DB"),
      borderRadius: "0.75rem",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(249, 115, 22, 0.1)" : "0 1px 3px 0 rgb(0 0 0 / 0.1)",
      borderWidth: "2px",
      backgroundColor: darkMode ? "#374151" : "white",
      "&:hover": {
        borderColor: "#F97316"
      }
    }),
    valueContainer: (provided) => ({ 
      ...provided, 
      height: "42px", 
      padding: "0 12px" 
    }),
    input: (provided) => ({ 
      ...provided, 
      margin: "0px",
      color: darkMode ? "#F9FAFB" : "#111827"
    }),
    singleValue: (provided) => ({
      ...provided,
      color: darkMode ? "#F9FAFB" : "#111827"
    }),
    indicatorSeparator: () => ({ display: "none" }),
    indicatorsContainer: (provided) => ({ ...provided, height: "42px" }),
    menu: (provided) => ({ 
      ...provided, 
      zIndex: 9999,
      borderRadius: "0.75rem",
      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
      backgroundColor: darkMode ? "#374151" : "white",
      border: darkMode ? "1px solid #4B5563" : "1px solid #E5E7EB"
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? "#F97316" 
        : state.isFocused 
        ? (darkMode ? "#4B5563" : "#FFF7ED")
        : (darkMode ? "#374151" : "white"),
      color: state.isSelected ? "white" : (darkMode ? "#F9FAFB" : "#374151"),
      "&:hover": {
        backgroundColor: state.isSelected ? "#F97316" : (darkMode ? "#4B5563" : "#FFF7ED")
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: darkMode ? "#9CA3AF" : "#6B7280"
    })
  };

  const datePickerClass =
    "w-full p-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm h-[42px] transition-all duration-200 hover:border-orange-400 dark:hover:border-orange-500";

  const filterFields = [
    {
      label: "Start Date",
      state: startDate,
      setState: setStartDate,
      type: "date",
      icon: Calendar
    },
    {
      label: "End Date",
      state: endDate,
      setState: setEndDate,
      type: "date",
      minDate: startDate,
      icon: Calendar
    },
    {
      label: "MO No",
      state: moNo,
      setState: setMoNo,
      options: filterOptions.moNos,
      type: "select",
      placeholder: "Select MO...",
      icon: Package
    },
    {
      label: "Package No",
      state: packageNo,
      setState: setPackageNo,
      options: filterOptions.packageNos,
      type: "select",
      placeholder: "Select Package...",
      icon: Package
    },
    {
      label: "Customer Style",
      state: custStyle,
      setState: setCustStyle,
      options: filterOptions.custStyles,
      type: "select",
      placeholder: "Select Style...",
      icon: Package
    },
    {
      label: "Buyer",
      state: buyer,
      setState: setBuyer,
      options: filterOptions.buyers,
      type: "select",
      placeholder: "Select Buyer...",
      icon: Users
    },
    {
      label: "Color",
      state: color,
      setState: setColor,
      options: filterOptions.colors,
      type: "select",
      placeholder: "Select Color...",
      icon: Package
    },
    {
      label: "Size",
      state: size,
      setState: setSize,
      options: filterOptions.sizes,
      type: "select",
      placeholder: "Select Size...",
      icon: Package
    },
    {
      label: "QC ID (OPA)",
      state: qcId,
      setState: setQcId,
      options: filterOptions.qcIds,
      type: "select",
      placeholder: "Select QC...",
      icon: Users
    }
  ];

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
        text: `Hourly ${chartDataType === "opa" ? "OPA Qty" : "Bundle Count"}`,
        font: { size: 16, weight: 'bold' },
        color: darkMode ? '#F9FAFB' : '#374151'
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
          const item = hourlyChartData[context.dataIndex];
          const change =
            chartDataType === "opa"
              ? parseFloat(item.opaQtyChange)
              : parseFloat(item.bundleQtyChange);

          return change < 0 ? "#EF4444" : change > 0 ? "#22C55E" : (darkMode ? "#9CA3AF" : "#6B7280");
        },
        font: { size: 11, weight: 'bold' }
      }
    },
    scales: {
      x: {
        title: { 
          display: true, 
          text: "Hour of Day",
          font: { size: 14, weight: 'bold' },
          color: darkMode ? '#F9FAFB' : '#374151'
        },
        grid: { display: false },
        ticks: { color: darkMode ? '#9CA3AF' : '#6B7280' }
      },
      y: {
        title: { 
          display: true, 
          text: "Total Quantity",
          font: { size: 14, weight: 'bold' },
          color: darkMode ? '#F9FAFB' : '#374151'
        },
        beginAtZero: true,
        grid: { color: darkMode ? '#374151' : '#F3F4F6' },
        ticks: { color: darkMode ? '#9CA3AF' : '#6B7280' }
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
        backgroundColor: chartDataType === "opa"
          ? (darkMode ? "rgba(249, 115, 22, 0.8)" : "rgba(249, 115, 22, 0.8)")
          : (darkMode ? "rgba(153, 102, 255, 0.8)" : "rgba(153, 102, 255, 0.8)"),
        borderColor: chartDataType === "opa"
          ? (darkMode ? "rgba(249, 115, 22, 1)" : "rgba(249, 115, 22, 1)")
          : (darkMode ? "rgba(153, 102, 255, 1)" : "rgba(153, 102, 255, 1)"),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Dark Mode Toggle */}
      <DarkModeToggle_OPA darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Yorkmars (Cambodia) Garment MFG Co., LTD
            </h1>
            <p className="text-lg text-orange-600 dark:text-orange-400 font-semibold">
              OPA Live Dashboard
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Toggle Button */}
        <div className="mb-8">
          <button
            onClick={() => setIsFilterVisible(!isFilterVisible)}
                       className="group flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-700 dark:to-orange-800 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 dark:hover:from-orange-800 dark:hover:to-orange-900 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <FilterIcon size={20} className="mr-3" />
            <span className="font-semibold">
              {isFilterVisible ? "Hide Filters" : "Show Filters"}
            </span>
            {isFilterVisible ? (
              <ChevronDown size={20} className="ml-2 group-hover:rotate-180 transition-transform duration-300" />
            ) : (
              <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {isFilterVisible && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
            <div className="bg-gradient-to-r from-gray-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <FilterIcon size={20} className="mr-2 text-orange-600 dark:text-orange-400" />
                Filter Options
              </h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-10 gap-6">
                {filterFields.map((field) => {
                  const IconComponent = field.icon;
                  return (
                    <div key={field.label} className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <IconComponent size={16} className="mr-2 text-orange-600 dark:text-orange-400" />
                        {field.label}
                      </label>
                      {field.type === "date" ? (
                        <DatePicker
                          selected={field.state}
                          onChange={field.setState}
                          dateFormat="MM/dd/yyyy"
                          className={datePickerClass}
                          placeholderText="Select date..."
                          minDate={field.minDate}
                          isClearable
                          wrapperClassName="w-full"
                        />
                      ) : (
                        <Select
                          options={field.options}
                          value={field.state}
                          onChange={field.setState}
                          placeholder={field.placeholder}
                          isClearable
                          isLoading={isLoadingFilters}
                          styles={selectStyles}
                          menuPosition="fixed"
                          classNamePrefix="react-select"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Applied Filters Display */}
              {Object.keys(appliedFiltersForDisplay).length > 0 && (
                <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl border border-orange-200 dark:border-orange-700">
                  <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">Applied Filters:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(appliedFiltersForDisplay).map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-600"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleResetFilters}
                  disabled={isLoading || isLoadingFilters}
                  className="flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw size={18} className="mr-2" />
                  <span className="font-semibold">Reset Filters</span>
                </button>
                
                <button
                  onClick={handleApplyFilters}
                  disabled={isLoading || isLoadingFilters}
                  className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-800 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 dark:hover:from-emerald-800 dark:hover:to-emerald-900 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading || isLoadingFilters ? (
                    <RefreshCw size={18} className="mr-2 animate-spin" />
                  ) : (
                    <SearchIcon size={18} className="mr-2" />
                  )}
                  <span className="font-semibold">Apply Filters</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 transition-colors duration-300">
            <LoadingSpinner_OPA />
            <p className="text-center text-gray-600 dark:text-gray-400 mt-4 font-medium">Loading dashboard data...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
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
                icon={Package}
              />
              <SummaryStatCard_OPA
                title="Total Re-Check OPA Qty"
                currentValue={summaryData.totalRecheckOPAQty}
                previousDayValue={previousDaySummary.totalRecheckOPAQty}
                icon={TrendingDown}
              />
            </div>

            {/* Inspector Summary Table */}
            <div className="mb-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
              <div className="bg-gradient-to-r from-gray-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <Users size={24} className="mr-3 text-orange-600 dark:text-orange-400" />
                    OPA Qty Summary by Inspector
                  </h2>
                </div>
              </div>

              <div className="p-6">
                {/* Column Toggle Controls */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleAddAllCols}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      <Eye size={16} className="mr-2" />
                      <span className="font-medium">Show All</span>
                    </button>
                    
                    <button
                      onClick={handleClearSomeCols}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      <EyeOff size={16} className="mr-2" />
                      <span className="font-medium">Hide Some</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 ml-auto">
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

                {/* Inspector Table */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 z-20 border-r border-gray-300 dark:border-gray-500">
                          Employee ID
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky left-[120px] bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 z-20 border-r border-gray-300 dark:border-gray-500">
                          Employee Name
                        </th>
                        {inspectorTableData.sortedDates.map((date) => (
                          <th
                            key={date}
                            colSpan={Object.values(visibleCols).filter((v) => v).length || 1}
                            className="px-4 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-300 dark:border-gray-500"
                          >
                            <div className="font-semibold text-gray-800 dark:text-gray-200">{date}</div>
                            {Object.values(visibleCols).filter((v) => v).length > 0 && (
                              <div className="flex justify-around mt-2 text-[10px] font-medium text-gray-600 dark:text-gray-400 space-x-1">
                                {visibleCols.totalOPAQty && (
                                  <span className="bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-md">OPA</span>
                                )}
                                {visibleCols.totalBundles && (
                                  <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-md">Bundle</span>
                                )}
                                {visibleCols.totalRecheckOPAQty && (
                                  <span className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded-md">Re-Chk</span>
                                )}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                      {inspectorTableData.data.length > 0 ? (
                        inspectorTableData.data.map((inspector, index) => (
                          <tr
                            key={inspector.emp_id}
                            className={`hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors duration-200 ${
                              index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100 sticky left-0 bg-inherit border-r border-gray-200 dark:border-gray-600 z-10">
                              {inspector.emp_id}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 sticky left-[120px] bg-inherit border-r border-gray-200 dark:border-gray-600 z-10">
                              {inspector.eng_name}
                            </td>
                            {inspectorTableData.sortedDates.map((date) => {
                              const dayData = inspector.dates[date] || {};
                              const hasVisibleCols = Object.values(visibleCols).some((v) => v);
                              return hasVisibleCols ? (
                                <React.Fragment key={`${inspector.emp_id}-${date}`}>
                                  {visibleCols.totalOPAQty && (
                                    <td className="px-3 py-3 text-center text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200">
                                        {dayData.totalOPAQty || 0}
                                      </span>
                                    </td>
                                  )}
                                  {visibleCols.totalBundles && (
                                    <td className="px-3 py-3 text-center text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                                        {dayData.totalBundles || 0}
                                      </span>
                                    </td>
                                  )}
                                  {visibleCols.totalRecheckOPAQty && (
                                    <td className="px-3 py-3 text-center text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200">
                                        {dayData.totalRecheckOPAQty || 0}
                                      </span>
                                    </td>
                                  )}
                                </React.Fragment>
                              ) : (
                                <td
                                  key={`${inspector.emp_id}-${date}-empty`}
                                  className="px-3 py-3 text-center text-sm text-gray-400 dark:text-gray-500 border-r border-gray-200 dark:border-gray-600"
                                >
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                    -
                                  </span>
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
                                (Object.values(visibleCols).filter((v) => v).length || 1)
                            }
                            className="text-center py-12 text-gray-500 dark:text-gray-400"
                          >
                            <div className="flex flex-col items-center">
                              <Users size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                              <p className="text-lg font-medium">No inspector data available</p>
                              <p className="text-sm">Try adjusting your filters</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Hourly Performance Chart */}
            <div className="mb-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
              <div className="bg-gradient-to-r from-gray-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <BarChart3 size={24} className="mr-3 text-orange-600 dark:text-orange-400" />
                    Hourly Performance (OPA)
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setChartDataType("opa")}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        chartDataType === "opa"
                          ? "bg-orange-600 dark:bg-orange-700 text-white shadow-lg"
                          : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                      }`}
                    >
                      OPA Qty
                    </button>
                    <button
                      onClick={() => setChartDataType("bundle")}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        chartDataType === "bundle"
                          ? "bg-purple-600 dark:bg-purple-700 text-white shadow-lg"
                          : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                      }`}
                    >
                      Bundle Count
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {isLoadingHourlyChart ? (
                  <div className="h-96 flex items-center justify-center">
                    <LoadingSpinner_OPA />
                  </div>
                ) : hourlyChartData.length > 0 ? (
                  <div className="h-96">
                    <Bar options={hourlyBarChartOptions_OPA} data={preparedHourlyChartData_OPA} />
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <BarChart3 size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-lg font-medium">No hourly OPA data available</p>
                    <p className="text-sm">Try adjusting your date filters</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Records Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
              <div className="bg-gradient-to-r from-gray-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                  <ClipboardCheck size={24} className="mr-3 text-orange-600 dark:text-orange-400" />
                  Detailed OPA Records
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Showing {detailedRecords.length} of {pagination.totalRecords} records
                </p>
              </div>

              <div className="overflow-x-auto max-h-[600px]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 sticky top-0 z-10">
                    <tr>
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
                      ].map((header, index) => (
                        <th
                          key={header}
                          className={`px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-300 dark:border-gray-500 ${
                            index === 0 ? "sticky left-0 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 z-20" : ""
                          }`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {detailedRecords.length > 0 ? (
                      detailedRecords.map((record, index) => (
                        <tr
                          key={index}
                          className={`hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors duration-200 ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'
                          }`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-inherit border-r border-gray-200 dark:border-gray-600 z-10">
                            {formatDisplayDate_OPA(record.opa_updated_date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200">
                              {record.emp_id_opa}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                            {record.eng_name_opa || "N/A"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                            {record.dept_name_opa || "N/A"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                            {record.selectedMono || "N/A"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                            {record.package_no}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                            {record.custStyle || "N/A"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                            {record.buyer || "N/A"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                            {record.color || "N/A"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                            {record.size || "N/A"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                            {record.opa_update_time || "N/A"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center border-r border-gray-200 dark:border-gray-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                              {record.opaQty || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center border-r border-gray-200 dark:border-gray-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                              1
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center border-r border-gray-200 dark:border-gray-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200">
                              {record.recheckOPAQty || 0}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={14} className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center">
                            <ClipboardCheck size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-lg font-medium">No detailed OPA records found</p>
                                                        <p className="text-lg font-medium">No detailed OPA records found</p>
                            <p className="text-sm">Try adjusting your filters</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        Total: <span className="font-medium">{pagination.totalRecords}</span> records
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        First
                      </button>
                      
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-orange-50 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-700 rounded-lg">
                        {pagination.currentPage}
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <ChevronRight size={16} />
                      </button>
                      
                      <button
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OPALive;


