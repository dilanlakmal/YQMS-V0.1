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
  Package as PackageIcon,
  RotateCcw,
  Search as SearchIcon,
  TrendingDown,
  X,
  Activity,
  Users,
  BarChart3,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Target,
  TrendingUp
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

const normalizeDateStringForAPI_Packing = (date) => {
  if (!date) return null;
  try {
    return formatDateFn(new Date(date), "MM/dd/yyyy");
  } catch (e) {
    console.error("Error normalizing date for API (Packing):", date, e);
    return String(date);
  }
};

const formatDisplayDate_Packing = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return formatDateFn(new Date(dateString), "MM/dd/yyyy");
  } catch (error) {
    return String(dateString);
  }
};

const LoadingSpinner_Packing = () => (
  <div className="flex justify-center items-center h-32">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
      <RefreshCw className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
    </div>
  </div>
);

const SummaryStatCard_Packing = ({ title, value1, label1, value2, label2, icon }) => {
  const IconComponent = icon || PackageIcon;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <IconComponent size={24} />
        </div>
      </div>
      
      <div className="space-y-3">
        {label1 && <p className="text-gray-600 dark:text-gray-300 text-xs">{label1}</p>}
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {value1.toLocaleString()}
        </p>
        
        {label2 && value2 !== undefined && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <p className="text-gray-600 dark:text-gray-300 text-xs">{label2}</p>
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mt-1">
                {value2.toLocaleString()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SummaryStatCardSimple_Packing = ({ title, currentValue, previousDayValue, icon }) => {
  const IconComponent = icon || PackageIcon;
  const prevValue = previousDayValue || 0;
  const currValue = currentValue || 0;
  
  let percentageChange = 0;
  if (prevValue > 0) percentageChange = ((currValue - prevValue) / prevValue) * 100;
  else if (currValue > 0 && prevValue === 0) percentageChange = 100;
  else if (currValue === 0 && prevValue === 0) percentageChange = 0;

  const isPositive = percentageChange > 0;
  const isNegative = percentageChange < 0;
  const noChange = percentageChange === 0;

  const changeColor = isPositive
    ? "text-emerald-600 dark:text-emerald-400"
    : isNegative
    ? "text-red-600 dark:text-red-400"
    : "text-gray-500 dark:text-gray-400";

  const ChangeIcon = isPositive ? ArrowUp : isNegative ? ArrowDown : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <IconComponent size={24} />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {currValue.toLocaleString()}
        </p>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">Previous Day</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {prevValue.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {!noChange && ChangeIcon && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <ChangeIcon size={14} />
                <span className={`text-xs font-bold ${changeColor}`}>
                  {percentageChange.toFixed(1)}%
                </span>
              </div>
            )}
            {noChange && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-600 ${changeColor}`}>
                0.0%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InspectorColumnToggleButton_Packing = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-3 py-2 text-xs font-medium rounded-xl transition-all duration-200 shadow-sm ${
      isActive
        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
    }`}
  >
    {isActive ? <Check size={14} className="mr-1" /> : <X size={14} className="mr-1" />}
    {label}
  </button>
);

const PackingLive = () => {
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
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
    totalPackingQty: 0,
    totalOrderCardBundles: 0,
    totalDefectCards: 0,
    totalDefectCardQty: 0
  });
  const [previousDaySummary, setPreviousDaySummary] = useState({
    totalPackingQty: 0,
    totalOrderCardBundles: 0,
    totalDefectCards: 0,
    totalDefectCardQty: 0
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
  const [chartDataType, setChartDataType] = useState("packingQty");
  const [visibleCols, setVisibleCols] = useState({
    totalPackingQty: true,
    totalOrderCardBundles: true,
    totalDefectCards: true,
    totalDefectCardQty: true
  });

  const currentFiltersRef = useRef({});

  // Calculate statistics
  const stats = {
    totalInspectors: inspectorSummary.length,
    avgPackingQty: inspectorSummary.length > 0 
      ? Math.round(summaryData.totalPackingQty / inspectorSummary.length)
      : 0,
    defectRate: summaryData.totalPackingQty > 0 
      ? ((summaryData.totalDefectCardQty / summaryData.totalPackingQty) * 100).toFixed(2)
      : 0,
    activeFilters: Object.keys(appliedFiltersForDisplay).length
  };

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
  }, [startDate, endDate, moNo, packageNo, custStyle, buyer, color, size, qcId]);

  const buildFilterQueryParams = useCallback((filtersToBuild) => {
    const queryParams = {};
    if (filtersToBuild.startDate)
      queryParams.startDate = normalizeDateStringForAPI_Packing(filtersToBuild.startDate);
    if (filtersToBuild.endDate)
      queryParams.endDate = normalizeDateStringForAPI_Packing(filtersToBuild.endDate);
    if (filtersToBuild.moNo) queryParams.moNo = filtersToBuild.moNo.value;
    if (filtersToBuild.packageNo) queryParams.packageNo = filtersToBuild.packageNo.value;
    if (filtersToBuild.custStyle) queryParams.custStyle = filtersToBuild.custStyle.value;
    if (filtersToBuild.buyer) queryParams.buyer = filtersToBuild.buyer.value;
    if (filtersToBuild.color) queryParams.color = filtersToBuild.color.value;
    if (filtersToBuild.size) queryParams.size = filtersToBuild.size.value;
    if (filtersToBuild.qcId) queryParams.qcId = filtersToBuild.qcId.value;
    return queryParams;
  }, []);

  const fetchFilterOptions = useCallback(async (currentFilters = {}) => {
    setIsLoadingFilters(true);
    try {
      const queryParamsForFilters = buildFilterQueryParams(currentFilters);
      const response = await axios.get(`${API_BASE_URL}/api/packing/filters`, {
        params: queryParamsForFilters
      });
      setFilterOptions(response.data);
    } catch (error) {
      console.error("Error fetching Packing filter options:", error);
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
  }, [buildFilterQueryParams]);

  const fetchHourlyChartData = useCallback(async (filters = {}) => {
    setIsLoadingHourlyChart(true);
    try {
      const queryParams = buildFilterQueryParams(filters);
      const response = await axios.get(`${API_BASE_URL}/api/packing/hourly-summary`, {
        params: queryParams
      });
      setHourlyChartData(response.data || []);
    } catch (error) {
      console.error("Error fetching hourly Packing chart data:", error);
      setHourlyChartData([]);
    } finally {
      setIsLoadingHourlyChart(false);
    }
  }, [buildFilterQueryParams]);

  const fetchData = useCallback(async (filters = {}, page = 1, isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);

    const chartPromise = fetchHourlyChartData(filters);
    const filterOptionsPromise = isInitialLoad || Object.keys(filters).length === 0
      ? fetchFilterOptions(filters)
      : Promise.resolve();

    try {
      const queryParams = {
        ...buildFilterQueryParams(filters),
        page,
        limit: pagination.limit
      };

      const mainDataPromise = axios.get(`${API_BASE_URL}/api/packing/dashboard-data`, {
        params: queryParams
      });

      const [mainDataResponse] = await Promise.all([
        mainDataPromise,
        chartPromise,
        filterOptionsPromise
      ]);

      const data = mainDataResponse.data;

      setSummaryData(data.overallSummary || {
        totalPackingQty: 0,
        totalOrderCardBundles: 0,
        totalDefectCards: 0,
        totalDefectCardQty: 0
      });

      setPreviousDaySummary(data.previousDaySummary || {
        totalPackingQty: 0,
        totalOrderCardBundles: 0,
        totalDefectCards: 0,
        totalDefectCardQty: 0
      });

      setInspectorSummary(data.inspectorSummaryData || []);
      setDetailedRecords(data.detailedRecords || []);
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 20
      });

      const displayableFilters = {};
      if (filters.startDate)
        displayableFilters["Start Date"] = normalizeDateStringForAPI_Packing(filters.startDate);
      if (filters.endDate)
        displayableFilters["End Date"] = normalizeDateStringForAPI_Packing(filters.endDate);
      if (filters.moNo) displayableFilters["MO No"] = filters.moNo.label;
      if (filters.packageNo) displayableFilters["Package No"] = filters.packageNo.label;
      if (filters.custStyle) displayableFilters["Cust. Style"] = filters.custStyle.label;
      if (filters.buyer) displayableFilters["Buyer"] = filters.buyer.label;
      if (filters.color) displayableFilters["Color"] = filters.color.label;
      if (filters.size) displayableFilters["Size"] = filters.size.label;
      if (filters.qcId) displayableFilters["QC ID (Packing)"] = filters.qcId.label;

      setAppliedFiltersForDisplay(displayableFilters);
    } catch (error) {
      console.error("Error fetching Packing dashboard data:", error);
      setSummaryData({
        totalPackingQty: 0,
        totalOrderCardBundles: 0,
        totalDefectCards: 0,
        totalDefectCardQty: 0
      });
      setPreviousDaySummary({
        totalPackingQty: 0,
        totalOrderCardBundles: 0,
        totalDefectCards: 0,
        totalDefectCardQty: 0
      });
      setInspectorSummary([]);
      setDetailedRecords([]);
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  }, [pagination.limit, buildFilterQueryParams, fetchHourlyChartData, fetchFilterOptions]);

  useEffect(() => {
    fetchData(currentFiltersRef.current, 1, true);
    const intervalId = setInterval(() => {
      fetchData(currentFiltersRef.current, pagination.currentPage, false);
    }, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleApplyFilters = () => {
    fetchData(currentFiltersRef.current, 1, false);
    fetchFilterOptions(currentFiltersRef.current);
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
      totalPackingQty: true,
      totalOrderCardBundles: true,
      totalDefectCards: true,
      totalDefectCardQty: true
    });

  const handleClearSomeCols = () =>
    setVisibleCols((prev) => ({
      ...prev,
      totalDefectCards: false,
      totalDefectCardQty: false
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

      const displayDate = formatDisplayDate_Packing(item.date);
      allDatesSet.add(displayDate);

      dataByInspector[item.emp_id].dates[displayDate] = {
        totalPackingQty: item.dailyTotalPackingQty,
        totalOrderCardBundles: item.dailyOrderCardBundles,
        totalDefectCards: item.dailyDefectCards,
        totalDefectCardQty: item.dailyDefectCardQty
      };
    });

    const sortedDates = Array.from(allDatesSet).sort((a, b) => new Date(a) - new Date(b));
    return { data: Object.values(dataByInspector), sortedDates };
  }, [inspectorSummary]);

  const selectStyles = {
    control: (p) => ({
      ...p,
      minHeight: "42px",
      height: "42px",
      borderColor: "#D1D5DB",
      borderRadius: "0.75rem",
      boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
      "&:hover": { borderColor: "#10B981" }
    }),
    valueContainer: (p) => ({ ...p, height: "42px", padding: "0 12px" }),
    input: (p) => ({ ...p, margin: "0px" }),
    indicatorSeparator: () => ({ display: "none" }),
    indicatorsContainer: (p) => ({ ...p, height: "42px" }),
    menu: (p) => ({ ...p, zIndex: 9999, borderRadius: "0.75rem" }),
    option: (p, { isFocused }) => ({
      ...p,
      backgroundColor: isFocused ? "#D1FAE5" : "white",
      color: "#1F2937"
    })
  };

  const datePickerClass = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm h-[42px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white";

  const filterFields = [
    { label: "Start Date", state: startDate, setState: setStartDate, type: "date" },
    { label: "End Date", state: endDate, setState: setEndDate, type: "date", minDate: startDate },
    { label: "MO No", state: moNo, setState: setMoNo, options: filterOptions.moNos, type: "select", placeholder: "Select MO..." },
    { label: "Package No", state: packageNo, setState: setPackageNo, options: filterOptions.packageNos, type: "select", placeholder: "Select Package..." },
    { label: "Cust. Style", state: custStyle, setState: setCustStyle, options: filterOptions.custStyles, type: "select", placeholder: "Select Style..." },
    { label: "Buyer", state: buyer, setState: setBuyer, options: filterOptions.buyers, type: "select", placeholder: "Select Buyer..." },
    { label: "Color", state: color, setState: setColor, options: filterOptions.colors, type: "select", placeholder: "Select Color..." },
    { label: "Size", state: size, setState: setSize, options: filterOptions.sizes, type: "select", placeholder: "Select Size..." },
    { label: "QC ID", state: qcId, setState: setQcId, options: filterOptions.qcIds, type: "select", placeholder: "Select QC..." }
  ];

  const formatHourLabel_Packing = (hourStr) => {
    if (!hourStr) return "";
    try {
      const date = parse(hourStr, "HH", new Date());
      return formatDateFn(date, "h aa");
    } catch {
      return hourStr;
    }
  };

  const getChartTitleAndData = () => {
    switch (chartDataType) {
      case "packingQty":
        return { title: "Total Packing Qty", dataKey: "totalPackingQty", changeKey: "packingQtyChange" };
      case "orderBundles":
        return { title: "Total Order Bundles", dataKey: "totalOrderCardBundles", changeKey: "orderCardBundlesChange" };
      case "defectCards":
        return { title: "Total Defect Cards", dataKey: "totalDefectCards", changeKey: "defectCardsChange" };
      case "defectQty":
        return { title: "Total Defect Card Qty", dataKey: "totalDefectCardQty", changeKey: "defectCardQtyChange" };
      default:
        return { title: "Total Packing Qty", dataKey: "totalPackingQty", changeKey: "packingQtyChange" };
    }
  };

  const currentChartInfo = getChartTitleAndData();

  const hourlyBarChartOptions_Packing = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { 
        display: true, 
        text: `Hourly ${currentChartInfo.title}`,
        font: { size: 16, weight: 'bold' },
        color: document.documentElement.classList.contains('dark') ? '#F3F4F6' : '#1F2937'
      },
      datalabels: {
        anchor: "end",
        align: "end",
        formatter: (value, context) => {
          const item = hourlyChartData[context.dataIndex];
          if (!item) return value.toLocaleString();
          const change = parseFloat(item[currentChartInfo.changeKey]);
          let changeStr = "";
          if (change > 0) changeStr = ` ▲${change.toFixed(1)}%`;
          else if (change < 0) changeStr = ` ▼${Math.abs(change).toFixed(1)}%`;
          return `${value.toLocaleString()}${changeStr}`;
        },
        color: (context) => {
          const item = hourlyChartData[context.dataIndex];
          if (!item) return "#6B7280";
          const change = parseFloat(item[currentChartInfo.changeKey]);
          return change < 0 ? "#EF4444" : change > 0 ? "#10B981" : "#6B7280";
        },
        font: { size: 10, weight: 'bold' },
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 4,
        padding: 4
      }
    },
    scales: {
      x: {
        title: { 
          display: true, 
          text: "Hour of Day",
          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#6B7280'
        },
        grid: { display: false },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#6B7280'
        }
      },
      y: {
        title: { 
          display: true, 
          text: "Total Quantity",
          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#6B7280'
        },
        beginAtZero: true,
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#F3F4F6'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#6B7280'
        }
      }
    }
  };

  const preparedHourlyChartData_Packing = {
    labels: hourlyChartData.map((d) => formatHourLabel_Packing(d.hour)),
    datasets: [
      {
        label: currentChartInfo.title,
        data: hourlyChartData.map((d) => d[currentChartInfo.dataKey] || 0),
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }
    ]
  };

  if (isLoading && !detailedRecords.length) {
    return (
      <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-8 text-center">
          <LoadingSpinner_Packing />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">Loading Packing Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch the latest data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 lg:p-6">
      {/* Enhanced Header */}
      <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 px-6 py-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-500 rounded-xl">
                  <PackageIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Packing Live Dashboard
                </h1>
              </div>
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Yorkmars (Cambodia) Garment MFG Co., LTD - Real-time packing operations monitoring
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Inspectors</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalInspectors}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg/Inspector</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.avgPackingQty}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Defect Rate</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.defectRate}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <FilterIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Active Filters</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.activeFilters}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filter Section */}
        <div className="p-6">
          <button
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mb-4 ${
              isFilterVisible 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
            }`}
          >
            <FilterIcon className="w-4 h-4 mr-2" />
            {isFilterVisible ? "Hide Filters" : "Show Filters"}
            {isFilterVisible ? (
              <ChevronDown className="w-4 h-4 ml-2" />
            ) : (
              <ChevronRight className="w-4 h-4 ml-2" />
            )}
          </button>

          {isFilterVisible && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {filterFields.map((field) => (
                  <div key={field.label} className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleApplyFilters}
                  disabled={isLoadingFilters}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingFilters ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <SearchIcon className="w-4 h-4 mr-2" />
                  )}
                  Apply Filters
                </button>

                <button
                  onClick={handleResetFilters}
                  disabled={isLoadingFilters}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </button>
              </div>

              {/* Active Filters Display */}
              {Object.keys(appliedFiltersForDisplay).length > 0 && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <Info className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active Filters:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(appliedFiltersForDisplay).map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && detailedRecords.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
            <LoadingSpinner_Packing />
            <p className="text-center text-gray-700 dark:text-gray-300 mt-4">Updating data...</p>
          </div>
        </div>
      )}

      {(!isLoading || detailedRecords.length > 0) && (
        <>
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <SummaryStatCardSimple_Packing
              title="Total Packing Qty"
              currentValue={summaryData.totalPackingQty}
              previousDayValue={previousDaySummary.totalPackingQty}
              icon={PackageIcon}
            />

            <SummaryStatCardSimple_Packing
              title="Total Order Bundles"
              currentValue={summaryData.totalOrderCardBundles}
              previousDayValue={previousDaySummary.totalOrderCardBundles}
              icon={BarChart3}
            />

            <SummaryStatCard_Packing
              title="Defect Information"
              value1={summaryData.totalDefectCards}
              label1="Total Defect Cards"
              value2={summaryData.totalDefectCardQty}
              label2="Total Defect Quantity"
              icon={TrendingDown}
            />
          </div>

          {/* Enhanced Inspector Summary Table */}
          <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Inspector Performance Summary</span>
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Daily packing performance by inspector
                  </p>
                </div>

                {/* Column Toggle Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAddAllCols}
                    className="px-3 py-2 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-all duration-200 shadow-sm"
                  >
                    <Eye className="w-3 h-3 mr-1 inline" />
                    Show All
                  </button>
                  <button
                    onClick={handleClearSomeCols}
                    className="px-3 py-2 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all duration-200 shadow-sm"
                  >
                    <EyeOff className="w-3 h-3 mr-1 inline" />
                    Hide Defects
                  </button>
                  
                  <div className="flex gap-2">
                    <InspectorColumnToggleButton_Packing
                      label="Packing Qty"
                      isActive={visibleCols.totalPackingQty}
                      onClick={() => handleColToggle("totalPackingQty")}
                    />
                    <InspectorColumnToggleButton_Packing
                      label="Order Bundles"
                      isActive={visibleCols.totalOrderCardBundles}
                      onClick={() => handleColToggle("totalOrderCardBundles")}
                    />
                    <InspectorColumnToggleButton_Packing
                      label="Defect Cards"
                      isActive={visibleCols.totalDefectCards}
                      onClick={() => handleColToggle("totalDefectCards")}
                    />
                    <InspectorColumnToggleButton_Packing
                      label="Defect Qty"
                      isActive={visibleCols.totalDefectCardQty}
                      onClick={() => handleColToggle("totalDefectCardQty")}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 sticky left-0 bg-gray-50 dark:bg-gray-800 z-20 min-w-[100px]">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>Emp ID</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 sticky left-[100px] bg-gray-50 dark:bg-gray-800 z-20 min-w-[150px]">
                          Employee Name
                        </th>
                        {inspectorTableData.sortedDates.map((date) => (
                          <th
                            key={date}
                            colSpan={Object.values(visibleCols).filter((v) => v).length || 1}
                            className="px-4 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[200px]"
                          >
                            <div className="flex flex-col items-center space-y-2">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{date}</span>
                              </div>
                              {Object.values(visibleCols).filter((v) => v).length > 0 && (
                                <div className="grid grid-cols-4 gap-1 text-[10px] font-normal normal-case text-gray-500 dark:text-gray-400">
                                  {visibleCols.totalPackingQty && <span className="text-center">Qty</span>}
                                  {visibleCols.totalOrderCardBundles && <span className="text-center">Bundles</span>}
                                  {visibleCols.totalDefectCards && <span className="text-center">Def Cards</span>}
                                  {visibleCols.totalDefectCardQty && <span className="text-center">Def Qty</span>}
                                </div>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {inspectorTableData.data.length > 0 ? (
                        inspectorTableData.data.map((inspector, index) => (
                          <tr
                            key={inspector.emp_id}
                            className={`transition-all duration-200 hover:bg-emerald-50 dark:hover:bg-gray-800 ${
                              index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                            }`}
                          >
                            <td className="px-6 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-900 hover:bg-emerald-50 dark:hover:bg-gray-800 z-10 font-semibold text-gray-900 dark:text-white">
                              {inspector.emp_id}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 sticky left-[100px] bg-white dark:bg-gray-900 hover:bg-emerald-50 dark:hover:bg-gray-800 z-10 text-gray-700 dark:text-gray-300">
                              {inspector.eng_name}
                            </td>
                            {inspectorTableData.sortedDates.map((date) => {
                              const dayData = inspector.dates[date] || {};
                              const hasVisibleCols = Object.values(visibleCols).some((v) => v);
                              
                              return hasVisibleCols ? (
                                <React.Fragment key={`${inspector.emp_id}-${date}`}>
                                  {visibleCols.totalPackingQty && (
                                    <td className="px-3 py-3 text-center border-r border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white">
                                      {dayData.totalPackingQty ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                                          {dayData.totalPackingQty.toLocaleString()}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 dark:text-gray-600">—</span>
                                      )}
                                    </td>
                                  )}
                                  {visibleCols.totalOrderCardBundles && (
                                    <td className="px-3 py-3 text-center border-r border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white">
                                      {dayData.totalOrderCardBundles ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                          {dayData.totalOrderCardBundles.toLocaleString()}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 dark:text-gray-600">—</span>
                                      )}
                                    </td>
                                  )}
                                  {visibleCols.totalDefectCards && (
                                    <td className="px-3 py-3 text-center border-r border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white">
                                      {dayData.totalDefectCards ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                                          {dayData.totalDefectCards.toLocaleString()}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 dark:text-gray-600">—</span>
                                      )}
                                    </td>
                                  )}
                                  {visibleCols.totalDefectCardQty && (
                                    <td className="px-3 py-3 text-center border-r border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white">
                                      {dayData.totalDefectCardQty ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                          {dayData.totalDefectCardQty.toLocaleString()}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 dark:text-gray-600">—</span>
                                      )}
                                    </td>
                                  )}
                                </React.Fragment>
                              ) : (
                                <td
                                  key={`${inspector.emp_id}-${date}-empty`}
                                  className="px-3 py-3 text-center text-gray-400 dark:text-gray-600 border-r border-gray-200 dark:border-gray-700"
                                >
                                  —
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={2 + inspectorTableData.sortedDates.length * (Object.values(visibleCols).filter((v) => v).length || 1)}
                            className="text-center py-12"
                          >
                            <div className="flex flex-col items-center space-y-3">
                              <Users className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                              <div className="text-gray-500 dark:text-gray-400">
                                <p className="font-medium">No inspector data available</p>
                                <p className="text-sm">Try adjusting your filters</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Hourly Performance Chart */}
          <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Hourly Performance Trends</span>
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Real-time hourly packing performance with trend indicators
                  </p>
                </div>

                {/* Chart Type Selector */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "packingQty", label: "Packing Qty", icon: PackageIcon },
                    { key: "orderBundles", label: "Order Bundles", icon: BarChart3 },
                    { key: "defectCards", label: "Defect Cards", icon: AlertTriangle },
                    { key: "defectQty", label: "Defect Qty", icon: TrendingDown }
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setChartDataType(key)}
                      className={`inline-flex items-center px-3 py-2 text-xs font-medium rounded-xl transition-all duration-200 ${
                        chartDataType === key
                          ? "bg-emerald-500 text-white shadow-lg"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6">
              {isLoadingHourlyChart ? (
                <div className="flex justify-center items-center h-96">
                  <LoadingSpinner_Packing />
                </div>
              ) : hourlyChartData.length > 0 ? (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 shadow-inner">
                  <div className="h-96">
                    <Bar
                      options={hourlyBarChartOptions_Packing}
                      data={preparedHourlyChartData_Packing}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center space-y-3">
                    <Clock className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                    <div className="text-gray-500 dark:text-gray-400">
                      <p className="font-medium">No hourly data available</p>
                      <p className="text-sm">Data will appear as operations progress</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Detailed Records Table */}
          <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Detailed Packing Records
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Complete transaction history with full details
              </p>
            </div>

            <div className="p-6">
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 sticky top-0 z-10">
                      <tr>
                        {[
                          { label: "Inspection Date", icon: Calendar },
                          { label: "Emp ID", icon: Users },
                          { label: "Employee Name", icon: Users },
                          { label: "Department", icon: Settings },
                          { label: "MO No", icon: PackageIcon },
                          { label: "Package No", icon: PackageIcon },
                          { label: "Card Type", icon: BarChart3 },
                          { label: "Customer Style", icon: Settings },
                          { label: "Buyer", icon: Users },
                          { label: "Color", icon: Settings },
                          { label: "Size", icon: Settings },
                          { label: "Inspection Time", icon: Clock },
                          { label: "Packed Qty", icon: Target }
                        ].map((header, idx) => (
                          <th
                            key={header.label}
                            className={`px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 whitespace-nowrap ${
                              idx === 0 ? "sticky left-0 bg-gray-50 dark:bg-gray-800 z-20 min-w-[120px]" : ""
                            }`}
                          >
                            <div className="flex items-center space-x-1">
                              <header.icon className="w-3 h-3" />
                              <span>{header.label}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {detailedRecords.length > 0 ? (
                        detailedRecords.map((record, index) => (
                          <tr
                            key={index}
                            className={`transition-all duration-200 hover:bg-emerald-50 dark:hover:bg-gray-800 ${
                              index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-900 hover:bg-emerald-50 dark:hover:bg-gray-800 z-10 font-medium text-gray-900                             dark:text-white">
                              {formatDisplayDate_Packing(record.packing_updated_date)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                              {record.emp_id_packing}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                              {record.eng_name_packing || "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                              {record.dept_name_packing || "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                              {record.selectedMono || "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white">
                              {record.package_no}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                record.cardType === 'Order Card' 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                              }`}>
                                {record.cardType}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                              {record.custStyle || "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                              {record.buyer || "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                              {record.color ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                  {record.color}
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-600">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                              {record.size ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                                  {record.size}
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-600">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                              {record.packing_update_time || "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 text-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                                {(record.passQtyPack || 0).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={13} className="text-center py-12">
                            <div className="flex flex-col items-center space-y-3">
                              <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                              <div className="text-gray-500 dark:text-gray-400">
                                <p className="font-medium">No detailed records available</p>
                                <p className="text-sm">Records will appear as packing operations are completed</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Enhanced Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <Info className="w-4 h-4" />
                    <span>
                      Page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages}</strong>
                      {" "}• Total: <strong>{pagination.totalRecords.toLocaleString()}</strong> records
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.currentPage === 1}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      First
                    </button>
                    
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              pagination.currentPage === pageNum
                                ? "bg-emerald-500 text-white shadow-lg"
                                : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Footer with Auto-refresh Info */}
      <div className="mt-8 bg-white dark:bg-gray-900 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <RefreshCw className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Auto-refreshing every 30 seconds</span>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Live Data</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackingLive;


