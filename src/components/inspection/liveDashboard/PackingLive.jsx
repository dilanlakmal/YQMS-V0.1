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
const LoadingSpinner_Packing = () => (
  <div className="flex justify-center items-center h-32">
    {" "}
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>{" "}
  </div>
); // Green for Packing

const SummaryStatCard_Packing = ({
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

  const hourlyBarChartOptions_Packing = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: `Hourly ${currentChartInfo.title}` },
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
          return change < 0 ? "#EF4444" : change > 0 ? "#22C55E" : "#6B7280";
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

  const preparedHourlyChartData_Packing = {
    labels: hourlyChartData.map((d) => formatHourLabel_Packing(d.hour)),
    datasets: [
      {
        label: currentChartInfo.title,
        data: hourlyChartData.map((d) => d[currentChartInfo.dataKey] || 0),
        backgroundColor: "rgba(34, 197, 94, 0.6)", // Green for Packing
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1
      }
    ]
  };

  if (isLoading && !detailedRecords.length) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner_Packing />
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4 bg-gray-50 min-h-screen max-w-[2350px]">
      <header className="mb-4 md:mb-6">
        {" "}
        <h1 className="text-lg md:text-2xl font-semibold text-gray-800 text-center">
          {" "}
          Yorkmars (Cambodia) Garment MFG Co., LTD | Packing Live Dashboard{" "}
        </h1>{" "}
      </header>

      <button
        onClick={() => setIsFilterVisible(!isFilterVisible)}
        className="mb-4 px-3 py-1.5 md:px-4 md:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-xs md:text-sm shadow-md"
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

      {isLoading && detailedRecords.length > 0 && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <LoadingSpinner_Packing />
        </div>
      )}

      {(!isLoading || detailedRecords.length > 0) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mb-4 md:mb-8">
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
              icon={PackageIcon}
            />
            <SummaryStatCard_Packing
              title="Defect Card Info"
              value1={summaryData.totalDefectCards}
              label1="Total Defect Cards (Count)"
              value2={summaryData.totalDefectCardQty}
              label2="Defect Card Qty (Sum)"
              icon={TrendingDown}
            />
          </div>

          <div className="mb-4 md:mb-8 p-3 md:p-4 bg-white shadow-xl rounded-xl border border-gray-200">
            <h2 className="text-base md:text-xl font-semibold text-gray-700 mb-2">
              Packing Qty Summary by Inspector
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
                Clear Defect Info
              </button>
              <div className="flex gap-1 md:gap-2 ml-auto">
                <InspectorColumnToggleButton_Packing
                  label="Total Pack Qty"
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
                        className="px-1 py-2 md:px-1 md:py-3 text-center font-semibold border-r min-w-[200px] md:min-w-[240px]"
                      >
                        {date}
                        {Object.values(visibleCols).filter((v) => v).length >
                          0 && (
                          <div className="grid grid-cols-4 mt-0.5 md:mt-1 text-[9px] md:text-[10px] font-normal normal-case text-gray-500">
                            {visibleCols.totalPackingQty && (
                              <span className="text-center px-0.5">
                                Total Qty
                              </span>
                            )}
                            {visibleCols.totalOrderCardBundles && (
                              <span className="text-center px-0.5">
                                Order Bdl
                              </span>
                            )}
                            {visibleCols.totalDefectCards && (
                              <span className="text-center px-0.5">
                                Def Cards
                              </span>
                            )}
                            {visibleCols.totalDefectCardQty && (
                              <span className="text-center px-0.5">
                                Def Qty
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
                        className="hover:bg-green-50 transition-colors duration-150"
                      >
                        <td
                          className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r sticky left-0 bg-white hover:bg-green-50 z-10"
                          style={{
                            width: "var(--emp-id-width, 80px)",
                            minWidth: "var(--emp-id-width, 80px)"
                          }}
                        >
                          {inspector.emp_id}
                        </td>
                        <td
                          className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r sticky left-[calc(var(--emp-id-width,80px)+1px)] md:left-[calc(var(--emp-id-width-md,100px)+1px)] bg-white hover:bg-green-50 z-10"
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
                              {visibleCols.totalPackingQty && (
                                <td className="px-1 py-1.5 md:px-1 md:py-2 text-center border-r">
                                  {dayData.totalPackingQty || 0}
                                </td>
                              )}
                              {visibleCols.totalOrderCardBundles && (
                                <td className="px-1 py-1.5 md:px-1 md:py-2 text-center border-r">
                                  {dayData.totalOrderCardBundles || 0}
                                </td>
                              )}
                              {visibleCols.totalDefectCards && (
                                <td className="px-1 py-1.5 md:px-1 md:py-2 text-center border-r">
                                  {dayData.totalDefectCards || 0}
                                </td>
                              )}
                              {visibleCols.totalDefectCardQty && (
                                <td className="px-1 py-1.5 md:px-1 md:py-2 text-center border-r">
                                  {dayData.totalDefectCardQty || 0}
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
                        No summary data available for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-4 md:mb-8 p-3 md:p-4 bg-white shadow-xl rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base md:text-xl font-semibold text-gray-700">
                Hourly Performance (Packing)
              </h2>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setChartDataType("packingQty")}
                  className={`px-2 py-1 text-xs rounded-md ${
                    chartDataType === "packingQty"
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Total Qty
                </button>
                <button
                  onClick={() => setChartDataType("orderBundles")}
                  className={`px-2 py-1 text-xs rounded-md ${
                    chartDataType === "orderBundles"
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Order Bundles
                </button>
                <button
                  onClick={() => setChartDataType("defectCards")}
                  className={`px-2 py-1 text-xs rounded-md ${
                    chartDataType === "defectCards"
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Defect Cards
                </button>
                <button
                  onClick={() => setChartDataType("defectQty")}
                  className={`px-2 py-1 text-xs rounded-md ${
                    chartDataType === "defectQty"
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Defect Qty
                </button>
              </div>
            </div>
            {isLoadingHourlyChart ? (
              <LoadingSpinner_Packing />
            ) : hourlyChartData.length > 0 ? (
              <div className="h-[300px] md:h-[400px]">
                <Bar
                  options={hourlyBarChartOptions_Packing}
                  data={preparedHourlyChartData_Packing}
                />
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No hourly Packing data available for selected filters.
              </p>
            )}
          </div>

          <div className="p-3 md:p-4 bg-white shadow-xl rounded-xl border border-gray-200">
            <h2 className="text-base md:text-xl font-semibold text-gray-700 mb-3 md:mb-4">
              Detailed Packing Records
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
                      "Card Type",
                      "Cust. Style",
                      "Buyer",
                      "Color",
                      "Size",
                      "Insp. Time",
                      "Packed Qty"
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
                        className="hover:bg-green-50 transition-colors duration-150"
                      >
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r sticky left-0 bg-white hover:bg-green-50 z-0">
                          {formatDisplayDate_Packing(
                            record.packing_updated_date
                          )}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.emp_id_packing}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.eng_name_packing || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.dept_name_packing || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.selectedMono || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.package_no}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r">
                          {record.cardType}
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
                          {record.packing_update_time || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2 whitespace-nowrap border-r text-center">
                          {record.passQtyPack || 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={13}
                        className="text-center py-4 text-gray-500"
                      >
                        No detailed Packing records available for selected
                        filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

export default PackingLive;
