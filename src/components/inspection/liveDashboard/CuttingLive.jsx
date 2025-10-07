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
  X
} from "lucide-react"; // PackageIcon for Packing
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
const LoadingSpinner_Cutting = () => (
  <div className="flex justify-center items-center h-32">
    {" "}
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>{" "}
  </div>
); // Green for Cutting

const SummaryStatCard_Cutting = ({
  title,
  value1,
  label1,
  value2,
  label2,
  icon
}) => {
  const IconComponent = icon || PackageIcon;
  return (
    <div className="bg-white p-5 shadow-xl rounded-xl border border-gray-200 flex flex-col justify-between min-h-[160px] hover:shadow-2xl transition-shadow duration-300">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
          <div className="p-2 bg-green-100 text-green-600 rounded-lg">
            {" "}
            <IconComponent size={20} />{" "}
          </div>
        </div>
        {label1 && <p className="text-gray-600 text-xs mt-1">{label1}</p>}
        <p className="text-3xl font-bold text-gray-800">
          {value1.toLocaleString()}
        </p>
        {label2 && (
          <p className="text-gray-600 text-xs mt-2 pt-2 border-t border-gray-100">
            {label2}
          </p>
        )}
        {value2 !== undefined && (
          <p className="text-2xl font-semibold text-gray-700 mt-1">
            {value2.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};
const SummaryStatCardSimple_Packing = ({
  title,
  currentValue,
  previousDayValue,
  icon
}) => {
  const IconComponent = icon || PackageIcon;
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
          <div className="p-2 bg-green-100 text-green-600 rounded-lg">
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

const InspectorColumnToggleButton_Packing = ({ label, isActive, onClick }) => (
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

const CuttingLive = () => {
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
  const [chartDataType, setChartDataType] = useState("packingQty"); // 'packingQty', 'orderBundles', 'defectCards', 'defectQty'

  const [visibleCols, setVisibleCols] = useState({
    totalPackingQty: true,
    totalOrderCardBundles: true,
    totalDefectCards: true,
    totalDefectCardQty: true
  });

  const currentFiltersRef = useRef({});

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
      queryParams.startDate = normalizeDateStringForAPI_Packing(
        filtersToBuild.startDate
      );
    if (filtersToBuild.endDate)
      queryParams.endDate = normalizeDateStringForAPI_Packing(
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
        const response = await axios.get(
          `${API_BASE_URL}/api/packing/filters`,
          { params: queryParamsForFilters }
        );
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
    },
    [buildFilterQueryParams]
  );

  const fetchHourlyChartData = useCallback(
    async (filters = {}) => {
      setIsLoadingHourlyChart(true);
      try {
        const queryParams = buildFilterQueryParams(filters);
        const response = await axios.get(
          `${API_BASE_URL}/api/packing/hourly-summary`,
          { params: queryParams }
        );
        setHourlyChartData(response.data || []);
      } catch (error) {
        console.error("Error fetching hourly Packing chart data:", error);
        setHourlyChartData([]);
      } finally {
        setIsLoadingHourlyChart(false);
      }
    },
    [buildFilterQueryParams]
  );

  const fetchData = useCallback(
    async (filters = {}, page = 1, isInitialLoad = false) => {
      if (isInitialLoad) setIsLoading(true);

      const chartPromise = fetchHourlyChartData(filters);
      const filterOptionsPromise =
        isInitialLoad || Object.keys(filters).length === 0
          ? fetchFilterOptions(filters)
          : Promise.resolve();

      try {
        const queryParams = {
          ...buildFilterQueryParams(filters),
          page,
          limit: pagination.limit
        };
        const mainDataPromise = axios.get(
          `${API_BASE_URL}/api/packing/dashboard-data`,
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
            totalPackingQty: 0,
            totalOrderCardBundles: 0,
            totalDefectCards: 0,
            totalDefectCardQty: 0
          }
        );
        setPreviousDaySummary(
          data.previousDaySummary || {
            totalPackingQty: 0,
            totalOrderCardBundles: 0,
            totalDefectCards: 0,
            totalDefectCardQty: 0
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
          displayableFilters["Start Date"] = normalizeDateStringForAPI_Packing(
            filters.startDate
          );
        if (filters.endDate)
          displayableFilters["End Date"] = normalizeDateStringForAPI_Packing(
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
          displayableFilters["QC ID (Packing)"] = filters.qcId.label;
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
    },
    [
      pagination.limit,
      buildFilterQueryParams,
      fetchHourlyChartData,
      fetchFilterOptions
    ]
  );

  useEffect(() => {
    fetchData(currentFiltersRef.current, 1, true);
    const intervalId = setInterval(() => {
      fetchData(currentFiltersRef.current, pagination.currentPage, false);
    }, 30000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const sortedDates = Array.from(allDatesSet).sort(
      (a, b) => new Date(a) - new Date(b)
    );
    return { data: Object.values(dataByInspector), sortedDates };
  }, [inspectorSummary]);

  const selectStyles = {
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
      label: "QC ID (Packing)",
      state: qcId,
      setState: setQcId,
      options: filterOptions.qcIds,
      type: "select",
      placeholder: "Select QC..."
    }
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
        return {
          title: "Total Packing Qty",
          dataKey: "totalPackingQty",
          changeKey: "packingQtyChange"
        };
      case "orderBundles":
        return {
          title: "Total Order Bundles",
          dataKey: "totalOrderCardBundles",
          changeKey: "orderCardBundlesChange"
        };
      case "defectCards":
        return {
          title: "Total Defect Cards",
          dataKey: "totalDefectCards",
          changeKey: "defectCardsChange"
        };
      case "defectQty":
        return {
          title: "Total Defect Card Qty",
          dataKey: "totalDefectCardQty",
          changeKey: "defectCardQtyChange"
        };
      default:
        return {
          title: "Total Packing Qty",
          dataKey: "totalPackingQty",
          changeKey: "packingQtyChange"
        };
    }
  };
  const currentChartInfo = getChartTitleAndData();

  if (isLoading && !detailedRecords.length) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner_Cutting />
      </div>
    );
  }
};

export default CuttingLive;
