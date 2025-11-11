import axios from "axios";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckSquare,
  Image as ImageIcon,
  Info,
  Loader2,
  Percent,
  X,
  XCircle
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";
import { useTheme } from "../../../context/ThemeContext";

// --- REDESIGNED COMPONENT 1: Simple Summary Card ---
const SummaryCard = ({ icon, title, value, bgColorClass, textColorClass }) => (
  <div className={`relative p-5 rounded-xl shadow-md ${bgColorClass}`}>
    <div className="flex items-center">
      <div className="absolute -left-2 -top-2 p-3 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
        {icon}
      </div>
      <div className="ml-12 text-right w-full">
        <p className={`text-sm font-medium ${textColorClass} opacity-90`}>
          {title}
        </p>
        <p className={`text-3xl font-bold ${textColorClass}`}>{value}</p>
      </div>
    </div>
  </div>
);

// --- REDESIGNED COMPONENT 2: Factory Summary Card ---
const FactorySummaryCard = ({ summaryData, getRateColorClass }) => (
  <div className="col-span-1 md:col-span-2 xl:col-span-4 bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 h-full">
    <h3 className="font-bold mb-4 text-gray-800 dark:text-gray-100">
      Factory Summary
    </h3>
    <div className="overflow-x-auto h-full">
      <div className="flex space-x-6 pb-2 h-full">
        {summaryData.length > 0 ? (
          summaryData.map((factory) => (
            <div
              key={factory.name}
              className="flex-shrink-0 w-40 flex flex-col items-center"
            >
              <p className="font-bold text-center text-md mb-3 truncate">
                {factory.name}
              </p>
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between">
                  <CheckSquare size={20} className="text-blue-500" />
                  <div className="w-2/3 bg-blue-100 dark:bg-blue-900/50 p-2 rounded-md text-center border border-gray-300 dark:border-gray-600">
                    <span className="font-semibold text-sm">
                      {factory.checkedQty.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <AlertTriangle size={20} className="text-yellow-500" />
                  <div className="w-2/3 bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-md text-center border border-gray-300 dark:border-gray-600">
                    <span className="font-semibold text-sm">
                      {factory.defectQty.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Percent size={20} className="dark:text-gray-200" />
                  <div
                    className={`w-2/3 p-2 rounded-md text-center border border-gray-300 dark:border-gray-600 ${getRateColorClass(
                      factory.defectRate
                    )}`}
                  >
                    <span className="font-bold text-sm">
                      {factory.defectRate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full text-center text-gray-400 self-center">
            No factory data for this period.
          </div>
        )}
      </div>
    </div>
  </div>
);

// --- NEW: Copied QAUserModal from Report Component ---
const QAUserModal = ({ user, isLoading, onClose }) => {
  if (!user && !isLoading) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-72 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
        ) : (
          <>
            <img
              src={
                user.face_photo ||
                `https://ui-avatars.com/api/?name=${user.eng_name}&background=random`
              }
              alt={user.eng_name}
              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-indigo-400 object-cover"
            />
            <h3 className="text-lg font-bold">{user.emp_id}</h3>
            <p className="text-md text-gray-600 dark:text-gray-300">
              {user.eng_name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {user.job_title}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// --- NEW: Copied QAImageModal from Report Component ---
const QAImageModal = ({ data, onClose }) => {
  // data is the qaReport object
  if (!data) return null;

  // MODIFICATION: Flatten the defects from the nested qcData structure
  const defectsWithImages = data.qcData
    ? data.qcData
        .flatMap((qc) => qc.defectList) // Get all defects into one array
        .filter((d) => d.images && d.images.length > 0)
    : [];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold">Defect Images</h2>
          <button onClick={onClose}>
            {" "}
            <X size={24} />{" "}
          </button>
        </div>
        <div className="space-y-4">
          {defectsWithImages.length > 0 ? (
            defectsWithImages.map((defect) => (
              <div key={defect.defectCode}>
                <h4 className="font-bold text-lg text-indigo-600">
                  {defect.defectName}
                </h4>
                {/* 👇 MODIFIED: Change grid-cols-2 sm:grid-cols-3 md:grid-cols-4 to just grid-cols-2 */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {defect.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={`${PUBLIC_ASSET_URL}${img}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-md shadow-lg group"
                    >
                      <img
                        src={`${PUBLIC_ASSET_URL}${img}`}
                        alt={`Defect ${idx + 1}`}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              No images found for this report.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const SubConQCDashboardDailyView = () => {
  const { user } = useAuth();
  const { theme } = useTheme(); // Use your ThemeContext instead of useThemeDetector

  const [filters, setFilters] = useState({
    startDate: new Date(),
    endDate: new Date(),
    factory: null,
    buyer: null,
    lineNo: null,
    moNo: null,
    color: null
  });
  // MODIFIED State to include qaSummary
  const [data, setData] = useState({
    mainData: [],
    topDefects: [],
    linePerformance: [],
    buyerPerformance: [],
    dailyTrend: [],
    individualDefectTrend: [],
    uniqueDefectNames: [],
    filterOptions: {},
    qaSummary: { totalQASampleSize: 0, totalQADefectQty: 0 }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [topNValue, setTopNValue] = useState({ value: 3, label: "3" });
  const [allFactories, setAllFactories] = useState([]);

  // --- NEW: States for managing modals ---
  const [qaUserInfo, setQaUserInfo] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [imageModalData, setImageModalData] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // --- STATE FOR THE NEW LOCAL DEFECT FILTER ---
  const [selectedDefects, setSelectedDefects] = useState([]);

  const userFactory = useMemo(() => {
    // Check if we have a user, a name, and our NEW master list of factories
    if (user && user.name && allFactories.length > 0) {
      // Find a factory name in our master list that matches the user's name
      const matchedFactoryName = allFactories.find(
        (f) => f.toLowerCase() === user.name.toLowerCase()
      );

      if (matchedFactoryName) {
        return { value: matchedFactoryName, label: matchedFactoryName };
      }
    }
    return null;
  }, [user, allFactories]); // <-- DEPENDENCY CHANGED

  useEffect(() => {
    if (userFactory && !filters.factory) {
      handleFilterChange("factory", userFactory);
    }
  }, [userFactory, filters.factory]);

  // === NEW useEffect TO FETCH ALL FACTORIES ONCE ===
  useEffect(() => {
    const fetchAllFactories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-sewing-factories-manage`
        );
        if (Array.isArray(res.data)) {
          // We only need the factory names for our logic
          setAllFactories(res.data.map((f) => f.factory));
        }
      } catch (err) {
        console.error("Failed to fetch master factory list", err);
      }
    };
    fetchAllFactories();
  }, []); // Empty dependency array means it runs only once

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = {
          startDate: format(filters.startDate, "yyyy-MM-dd"),
          endDate: format(filters.endDate, "yyyy-MM-dd"),
          factory: filters.factory?.value,
          buyer: filters.buyer?.value,
          lineNo: filters.lineNo?.value,
          moNo: filters.moNo?.value,
          color: filters.color?.value
        };
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-qc-dashboard-daily`,
          { params }
        );
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };

      // If factory OR buyer changes, reset the lower-level filters.
      // They no longer reset each other.
      if (name === "factory" || name === "buyer") {
        newFilters.lineNo = null;
        newFilters.moNo = null;
        newFilters.color = null;
      }
      // If line changes, reset MO and color
      if (name === "lineNo") {
        newFilters.moNo = null;
        newFilters.color = null;
      }
      // If MO changes, reset color
      if (name === "moNo") {
        newFilters.color = null;
      }
      return newFilters;
    });
  };

  const clearFilters = () => {
    const defaultFilters = {
      startDate: new Date(),
      endDate: new Date(),
      factory: null,
      buyer: null,
      lineNo: null,
      moNo: null,
      color: null
    };
    if (userFactory) defaultFilters.factory = userFactory;
    setFilters(defaultFilters);
  };

  const factoryFilterOptions = useMemo(() => {
    if (userFactory) {
      return [userFactory];
    }
    // For all other users, map from the new master list
    return allFactories.map((f) => ({
      value: f,
      label: f
    }));
  }, [userFactory, allFactories]); // <-- DEPENDENCY CHANGED

  const topNDefects = useMemo(() => {
    return data.topDefects.slice(0, topNValue.value);
  }, [data.topDefects, topNValue]);

  const dashboardSummary = useMemo(() => {
    if (!data.mainData || data.mainData.length === 0) {
      return {
        totalChecked: 0,
        totalDefects: 0,
        overallRate: 0,
        factorySummary: [],
        totalQASampleSize: 0,
        totalQADefectQty: 0,
        overallQARate: 0
      };
    }

    const factoryStats = {};
    let totalChecked = 0;
    let totalDefects = 0;

    for (const report of data.mainData) {
      totalChecked += report.checkedQty;
      totalDefects += report.totalDefectQty;

      if (!factoryStats[report.factory]) {
        factoryStats[report.factory] = { checkedQty: 0, defectQty: 0 };
      }
      factoryStats[report.factory].checkedQty += report.checkedQty;
      factoryStats[report.factory].defectQty += report.totalDefectQty;
    }

    const factorySummary = Object.entries(factoryStats).map(
      ([name, stats]) => ({
        name,
        ...stats,
        defectRate:
          stats.checkedQty > 0 ? (stats.defectQty / stats.checkedQty) * 100 : 0
      })
    );

    const overallRate =
      totalChecked > 0 ? (totalDefects / totalChecked) * 100 : 0;

    // 1. Provide a default empty object for qaSummary in case it's undefined.
    const qaSummary = data.qaSummary || {};

    // 2. Use the nullish coalescing operator (??) to default to 0 if the properties are missing.
    const totalQASampleSize = qaSummary.totalQASampleSize ?? 0;
    const totalQADefectQty = qaSummary.totalQADefectQty ?? 0;

    const overallQARate =
      totalQASampleSize > 0 ? (totalQADefectQty / totalQASampleSize) * 100 : 0;

    return {
      totalChecked,
      totalDefects,
      overallRate,
      factorySummary,
      totalQASampleSize,
      totalQADefectQty,
      overallQARate
    };
  }, [data.mainData, , data.qaSummary]);

  const { chartData, chartMaxX } = useMemo(() => {
    const sortedData = data.linePerformance
      .map((item) => ({
        ...item,
        name: `${item.factory} - ${item.lineNo}`
      }))
      .sort((a, b) => b.defectRate - a.defectRate);

    const maxVal = Math.ceil(
      Math.max(...sortedData.map((d) => d.defectRate), 0)
    );

    return {
      chartData: sortedData,
      chartMaxX: maxVal + 2
    };
  }, [data.linePerformance]);

  // --- NEW useMemo HOOK FOR THE BUYER CHART ---
  const { buyerChartData, buyerChartMaxY } = useMemo(() => {
    // We don't need to sort here as the backend already did it.
    const chartData = data.buyerPerformance.map((item) => ({
      ...item,
      name: item.buyer // Use 'name' for consistency with the other chart's dataKey
    }));

    // Calculate the maximum Y-axis value for better scaling
    const maxVal = Math.ceil(
      Math.max(...chartData.map((d) => d.defectRate), 0)
    );

    return {
      buyerChartData: chartData,
      // Add a small buffer (e.g., 2%) to the top of the chart
      buyerChartMaxY: maxVal > 0 ? maxVal + 2 : 5
    };
  }, [data.buyerPerformance]);

  // --- HOOK TO CREATE THE "APPLIED FILTERS" SUBTITLE ---
  const appliedFiltersText = useMemo(() => {
    const parts = [
      `Date: ${format(filters.startDate, "yyyy-MM-dd")} to ${format(
        filters.endDate,
        "yyyy-MM-dd"
      )}`,
      `Factory: ${filters.factory?.label || "All"}`,
      `Buyer: ${filters.buyer?.label || "All"}`,
      `Line: ${filters.lineNo?.label || "All"}`,
      `MO: ${filters.moNo?.label || "All"}`,
      `Color: ${filters.color?.label || "All"}`
    ];
    return parts.join(" | ");
  }, [filters]);

  // --- HOOK TO PROCESS RAW DATA INTO A PIVOT TABLE STRUCTURE ---
  const pivotTableData = useMemo(() => {
    const trendData = data.individualDefectTrend;
    if (!trendData || trendData.length === 0) {
      return { headers: [], rows: [] };
    }

    // Create a lookup map for fast access: Map<"defectName-date", {qty, defectRate}>
    const dataMap = new Map(
      trendData.map((d) => [`${d.defectName}-${d.date}`, d])
    );

    // Get a unique, sorted list of all dates present in the data
    const dateHeaders = [...new Set(trendData.map((d) => d.date))].sort();

    // Determine which defect names to show: all unique names, or only the selected ones
    let defectNamesToShow =
      selectedDefects.length > 0
        ? selectedDefects.map((d) => d.value)
        : data.uniqueDefectNames;

    // Build the rows for the table
    const tableRows = defectNamesToShow.map((defectName) => {
      const rowData = { defectName: defectName, dates: {} };
      dateHeaders.forEach((date) => {
        const key = `${defectName}-${date}`;
        if (dataMap.has(key)) {
          rowData.dates[date] = dataMap.get(key);
        } else {
          rowData.dates[date] = null; // No data for this defect on this date
        }
      });
      return rowData;
    });

    return { headers: dateHeaders, rows: tableRows };
  }, [data.individualDefectTrend, data.uniqueDefectNames, selectedDefects]);

  const getRateColorClass = (rate) => {
    if (rate > 5) {
      return "bg-red-100 dark:bg-red-900/50";
    }
    if (rate >= 3) {
      return "bg-orange-100 dark:bg-orange-900/50";
    }
    if (rate >= 0) {
      return "bg-green-100 dark:bg-green-900/50";
    }
    return "bg-white dark:bg-gray-800";
  };

  const getTopDefectRateColorClass = (rate) => {
    if (rate > 3) {
      return "bg-red-100 dark:bg-red-900/50";
    }
    if (rate >= 1) {
      return "bg-orange-100 dark:bg-orange-900/50";
    }
    if (rate >= 0) {
      return "bg-green-100 dark:bg-green-900/50";
    }
    return "bg-white dark:bg-gray-800";
  };

  // NEW: QA Rate Color Logic
  const getQARateColorClass = (rate) => {
    if (rate >= 10) return "bg-red-100 dark:bg-red-900/50";
    return "bg-green-100 dark:bg-green-900/50";
  };

  const getRateBarColor = (rate) => {
    const isDark = theme === "dark";

    if (rate > 5) {
      return isDark ? "#dc2626" : "#fca5a5"; // Red-600 / Red-300
    }
    if (rate >= 3) {
      return isDark ? "#ea580c" : "#fdba74"; // Orange-600 / Orange-300
    }
    if (rate > 0) {
      return isDark ? "#16a34a" : "#86efac"; // Green-600 / Green-300
    }

    return isDark ? "#6b7280" : "#d1d5db"; // Gray-500 / Gray-300
  };

  // Updated chart text color using reliable theme detection
  const chartTextColor = useMemo(() => {
    if (theme === "dark") {
      return "#f9fafb"; // Light gray for dark theme
    } else {
      return "#111827"; // Very dark gray for light theme
    }
  }, [theme]);

  // Chart axis color
  const chartAxisColor = useMemo(() => {
    if (theme === "dark") {
      return "#6b7280"; // Gray-500 for dark theme
    } else {
      return "#374151"; // Gray-700 for light theme
    }
  }, [theme]);

  // --- NEW: Modal Handler Functions ---
  const handleShowQaUser = async (empId) => {
    if (!empId) return;
    setIsUserLoading(true);
    setQaUserInfo(null);
    setIsUserModalOpen(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/user-info-subcon-qa/${empId}`
      );
      setQaUserInfo(res.data);
    } catch (err) {
      console.error("Failed to fetch user info", err);
      setIsUserModalOpen(false);
    } finally {
      setIsUserLoading(false);
    }
  };

  const handleShowImages = (qaReport) => {
    if (qaReport) {
      setImageModalData(qaReport);
      setIsImageModalOpen(true);
    }
  };

  const closeUserModal = () => setIsUserModalOpen(false);
  const closeImageModal = () => setIsImageModalOpen(false);

  // --- 👇 ADD THIS CUSTOM COMPONENT FOR THE LINE CHART DOTS ---
  const CustomizedDot = (props) => {
    const { cx, cy, payload } = props;
    // If the defect rate for this point is > 5, color it red, otherwise green
    const fillColor = payload.defectRate > 5 ? "#ef4444" : "#22c55e"; // red-500, green-500
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        stroke={fillColor}
        strokeWidth={3}
        fill="#ffffff"
      />
    );
  };

  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border)",
      minHeight: "42px"
    }),
    singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      zIndex: 50
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#4f46e5"
        : isFocused
        ? "var(--color-bg-tertiary)"
        : "var(--color-bg-secondary)",
      color: isSelected ? "white" : "var(--color-text-primary)"
    })
  };

  return (
    <div className="space-y-6">
      {/* Filter Pane */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
          <FilterControl label="Start Date">
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => handleFilterChange("startDate", date)}
              className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border rounded-md"
              popperClassName="datepicker-on-top"
            />
          </FilterControl>
          <FilterControl label="End Date">
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => handleFilterChange("endDate", date)}
              className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border rounded-md"
              popperClassName="datepicker-on-top"
            />
          </FilterControl>
          <FilterControl label="Factory">
            <Select
              styles={reactSelectStyles}
              options={factoryFilterOptions}
              value={filters.factory}
              onChange={(val) => handleFilterChange("factory", val)}
              isDisabled={!!userFactory}
              isClearable={!userFactory}
              placeholder="All"
            />
          </FilterControl>
          <FilterControl label="Buyer">
            <Select
              options={
                data.filterOptions?.buyers?.map((b) => ({
                  value: b,
                  label: b
                })) || []
              }
              value={filters.buyer}
              onChange={(val) => handleFilterChange("buyer", val)}
              styles={reactSelectStyles}
              isClearable
              //isDisabled={!filters.factory} // Disabled until a factory is selected
              placeholder="All"
            />
          </FilterControl>
          <FilterControl label="Line No">
            <Select
              options={
                data.filterOptions?.lineNos?.map((l) => ({
                  value: l,
                  label: l
                })) || []
              }
              value={filters.lineNo}
              onChange={(val) => handleFilterChange("lineNo", val)}
              styles={reactSelectStyles}
              isClearable
              isDisabled={!filters.factory}
              placeholder="All"
            />
          </FilterControl>
          <FilterControl label="MO No">
            <Select
              options={
                data.filterOptions?.moNos?.map((m) => ({
                  value: m,
                  label: m
                })) || []
              }
              value={filters.moNo}
              onChange={(val) => handleFilterChange("moNo", val)}
              styles={reactSelectStyles}
              isClearable
              placeholder="All"
            />
          </FilterControl>
          <FilterControl label="Color">
            <Select
              options={
                data.filterOptions?.colors?.map((c) => ({
                  value: c,
                  label: c
                })) || []
              }
              value={filters.color}
              onChange={(val) => handleFilterChange("color", val)}
              styles={reactSelectStyles}
              isClearable
              isDisabled={!filters.moNo}
              placeholder="All"
            />
          </FilterControl>
          <div className="flex items-center">
            <button
              onClick={clearFilters}
              className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <SummaryCard
              icon={<CheckSquare size={24} className="text-blue-500" />}
              title="Checked Qty"
              value={dashboardSummary.totalChecked.toLocaleString()}
              bgColorClass="bg-blue-100 dark:bg-blue-900/50"
              textColorClass="text-blue-900 dark:text-blue-100"
            />
            <SummaryCard
              icon={<AlertTriangle size={24} className="text-yellow-500" />}
              title="Total Defect Qty"
              value={dashboardSummary.totalDefects.toLocaleString()}
              bgColorClass="bg-yellow-100 dark:bg-yellow-900/50"
              textColorClass="text-yellow-900 dark:text-yellow-100"
            />
            <SummaryCard
              icon={<Percent size={24} className="text-red-500" />}
              title="Overall Defect Rate"
              value={`${dashboardSummary.overallRate.toFixed(2)}%`}
              bgColorClass={getRateColorClass(dashboardSummary.overallRate)}
              textColorClass="text-red-900 dark:text-red-100"
            />
            <SummaryCard
              icon={<CheckSquare size={24} className="text-teal-500" />}
              title="QA Sample Qty"
              value={dashboardSummary.totalQASampleSize.toLocaleString()}
              bgColorClass="bg-teal-100 dark:bg-teal-900/50"
              textColorClass="text-teal-900 dark:text-teal-100"
            />
            <SummaryCard
              icon={<AlertTriangle size={24} className="text-orange-500" />}
              title="QA Defect Qty"
              value={dashboardSummary.totalQADefectQty.toLocaleString()}
              bgColorClass="bg-orange-100 dark:bg-orange-900/50"
              textColorClass="text-orange-900 dark:text-orange-100"
            />
            <SummaryCard
              icon={<Percent size={24} className="text-purple-500" />}
              title="QA Defect Rate"
              value={`${dashboardSummary.overallQARate.toFixed(2)}%`}
              bgColorClass={getQARateColorClass(dashboardSummary.overallQARate)}
              textColorClass="text-purple-900 dark:text-purple-100"
            />
          </div>

          {/* Factory Summary */}
          <div className="grid grid-cols-1">
            <FactorySummaryCard
              summaryData={dashboardSummary.factorySummary}
              getRateColorClass={getRateColorClass}
            />
          </div>

          {/* Main Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 overflow-x-auto">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Factory</th>
                    <th className="px-3 py-2 text-left">Line</th>
                    <th className="px-3 py-2 text-left">MO No</th>
                    <th className="px-3 py-2 text-left">Buyer</th>
                    <th className="px-3 py-2 text-left">Color</th>
                    <th className="px-3 py-2 text-center">Checked</th>
                    <th className="px-3 py-2 text-center">Defects</th>
                    <th className="px-3 py-2 text-center border-r-2 dark:border-gray-600">
                      QC Rate
                    </th>
                    <th className="px-3 py-2 text-left">QC Defect Details</th>
                    <th className="px-3 py-2 text-center">QA ID</th>
                    <th className="px-3 py-2 text-center">QA Sample</th>
                    <th className="px-3 py-2 text-center">QA Defects</th>
                    <th className="px-3 py-2 text-center">QA Rate</th>
                    <th className="px-3 py-2 text-center">Images</th>
                    <th className="px-3 py-2 text-left border-r-2 dark:border-gray-600">
                      QA Defect Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.mainData.map((report) => {
                    const defectRateOverall =
                      report.checkedQty > 0
                        ? (report.totalDefectQty / report.checkedQty) * 100
                        : 0;
                    const colorClass = getRateColorClass(defectRateOverall);
                    const qaReport = report.qaReport;
                    // Use the correct fields from the QA schema
                    const qaDefectRate =
                      qaReport && qaReport.totalCheckedQty > 0
                        ? (qaReport.totalOverallDefectQty /
                            qaReport.totalCheckedQty) *
                          100
                        : 0;

                    // Check for images inside the nested qcData array
                    const hasImages = qaReport?.qcData?.some((qc) =>
                      qc.defectList.some((d) => d.images && d.images.length > 0)
                    );

                    // Aggregate QA defects for a clean display
                    const aggregatedQADefects = qaReport?.qcData
                      ? qaReport.qcData
                          .flatMap((qc) => qc.defectList)
                          .reduce((acc, defect) => {
                            const existing = acc.find(
                              (d) => d.defectName === defect.defectName
                            );
                            if (existing) {
                              existing.qty += defect.qty;
                            } else {
                              acc.push({ ...defect });
                            }
                            return acc;
                          }, [])
                      : [];

                    return (
                      <tr key={report._id}>
                        <td className="px-3 py-2">
                          {format(
                            new Date(report.inspectionDate),
                            "yyyy-MM-dd"
                          )}
                        </td>
                        <td className="px-3 py-2">{report.factory}</td>
                        <td className="px-3 py-2">{report.lineNo}</td>
                        <td className="px-3 py-2">{report.moNo}</td>
                        <td className="px-3 py-2">{report.buyer}</td>
                        <td className="px-3 py-2">{report.color}</td>
                        <td className="px-3 py-2 text-center">
                          {report.checkedQty}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {report.totalDefectQty}
                        </td>
                        <td
                          className={`px-3 py-2 text-center font-semibold border-r-2 dark:border-gray-600 ${colorClass}`}
                        >
                          {defectRateOverall.toFixed(2)}%
                        </td>
                        <td className={`px-3 py-2 ${colorClass}`}>
                          {report.defectList
                            .sort((a, b) => b.qty - a.qty)
                            .map((d) => (
                              <div key={d.defectCode} className="text-xs">
                                {d.defectName} - <strong>{d.qty}</strong> (
                                {report.checkedQty > 0
                                  ? ((d.qty / report.checkedQty) * 100).toFixed(
                                      2
                                    )
                                  : 0}
                                %)
                              </div>
                            ))}
                        </td>

                        {/* QA ID */}
                        <td className="px-3 py-2 text-center">
                          {qaReport?.preparedBy?.empId && (
                            <button
                              onClick={() =>
                                handleShowQaUser(qaReport.preparedBy.empId)
                              }
                              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              <Info size={16} className="text-blue-500" />
                            </button>
                          )}
                        </td>

                        {/* QA Sample */}
                        <td className="px-3 py-2 text-center">
                          {/* Use totalCheckedQty from qaReport */}
                          {qaReport?.totalCheckedQty || ""}
                        </td>

                        {/* QA Defects */}
                        <td className="px-3 py-2 text-center">
                          {/* Use totalOverallDefectQty from qaReport */}
                          {qaReport?.totalOverallDefectQty || ""}
                        </td>

                        {/* QA Rate */}
                        <td
                          className={`px-3 py-2 text-center font-semibold ${getQARateColorClass(
                            qaDefectRate
                          )}`}
                        >
                          {qaReport ? `${qaDefectRate.toFixed(2)}%` : ""}
                        </td>

                        {/* Images */}
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleShowImages(qaReport)}
                            disabled={!hasImages}
                            className="p-1 rounded-full disabled:cursor-not-allowed"
                          >
                            <ImageIcon
                              size={16}
                              className={
                                hasImages
                                  ? "text-blue-500 hover:text-blue-600"
                                  : "text-gray-400"
                              }
                            />
                          </button>
                        </td>

                        {/* QA Defect Details */}
                        <td
                          className={`px-3 py-2 text-xs border-r-2 dark:border-gray-600 whitespace-normal ${getQARateColorClass(
                            qaDefectRate
                          )}`}
                        >
                          {aggregatedQADefects.length > 0
                            ? aggregatedQADefects
                                .sort((a, b) => b.qty - a.qty)
                                .map((defect) => {
                                  const defectSpecificRate =
                                    qaReport.totalCheckedQty > 0
                                      ? (defect.qty /
                                          qaReport.totalCheckedQty) *
                                        100
                                      : 0;
                                  return (
                                    <div key={defect.defectCode}>
                                      {defect.defectName} -{" "}
                                      <strong>{defect.qty}</strong> (
                                      {defectSpecificRate.toFixed(2)}%)
                                    </div>
                                  );
                                })
                            : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 dark:text-gray-100">
                  Top Defects
                </h3>
                <div className="w-24">
                  <Select
                    styles={reactSelectStyles}
                    options={[
                      { value: 3, label: "3" },
                      { value: 5, label: "5" },
                      { value: 7, label: "7" },
                      { value: 10, label: "10" },
                      { value: 15, label: "15" },
                      { value: 20, label: "20" },
                      { value: 25, label: "25" },
                      { value: 45, label: "All" }
                    ]}
                    defaultValue={topNValue}
                    onChange={setTopNValue}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold">
                        Defect Name
                      </th>
                      <th className="px-2 py-2 text-center font-semibold">
                        Qty
                      </th>
                      <th className="px-2 py-2 text-center font-semibold">
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {topNDefects.map((d) => (
                      <tr key={d.defectName}>
                        <td className="py-2 px-2 truncate" title={d.defectName}>
                          {d.defectName}
                        </td>
                        <td className="py-2 px-2 text-center">{d.defectQty}</td>
                        <td
                          className={`py-2 px-2 text-center font-medium rounded ${getTopDefectRateColorClass(
                            d.defectRate
                          )}`}
                        >
                          {d.defectRate.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-96">
              <h3 className="font-bold mb-4 text-gray-800 dark:text-gray-100">
                Defect Rate by Lines
              </h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 50, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === "dark" ? "#4b5563" : "#d1d5db"}
                  />
                  <XAxis
                    type="number"
                    domain={[0, chartMaxX]}
                    tick={{
                      fill: chartTextColor,
                      fontSize: 10,
                      fontWeight: 500
                    }}
                    axisLine={{ stroke: chartAxisColor }}
                    tickLine={{ stroke: chartAxisColor }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{
                      fill: chartTextColor,
                      fontSize: 10,
                      fontWeight: 500
                    }}
                    interval={0}
                    axisLine={{ stroke: chartAxisColor }}
                    tickLine={{ stroke: chartAxisColor }}
                  />
                  <Tooltip
                    formatter={(value) => `${value.toFixed(2)}%`}
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                      borderColor: chartAxisColor,
                      color: chartTextColor
                    }}
                  />
                  <Bar dataKey="defectRate">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getRateBarColor(entry.defectRate)}
                      />
                    ))}
                    <LabelList
                      dataKey="defectRate"
                      position="right"
                      formatter={(value) => `${value.toFixed(2)}%`}
                      style={{
                        fill: chartTextColor,
                        fontSize: "11px",
                        fontWeight: "600"
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-96">
              <h3 className="font-bold mb-4 text-gray-800 dark:text-gray-100">
                Defect Rate by Buyer
              </h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={buyerChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === "dark" ? "#4b5563" : "#d1d5db"}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: chartTextColor,
                      fontSize: 10,
                      fontWeight: 500
                    }}
                    axisLine={{ stroke: chartAxisColor }}
                    tickLine={{ stroke: chartAxisColor }}
                  />
                  <YAxis
                    type="number"
                    domain={[0, buyerChartMaxY]}
                    tick={{
                      fill: chartTextColor,
                      fontSize: 10,
                      fontWeight: 500
                    }}
                    axisLine={{ stroke: chartAxisColor }}
                    tickLine={{ stroke: chartAxisColor }}
                  />
                  <Tooltip
                    formatter={(value) => `${value.toFixed(2)}%`}
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                      borderColor: chartAxisColor,
                      color: chartTextColor
                    }}
                  />
                  <Bar dataKey="defectRate">
                    {buyerChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getRateBarColor(entry.defectRate)}
                      />
                    ))}
                    <LabelList
                      dataKey="defectRate"
                      position="top"
                      formatter={(value) => `${value.toFixed(2)}%`}
                      style={{
                        fill: chartTextColor,
                        fontSize: "11px",
                        fontWeight: "600"
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-96">
              <h3 className="font-bold mb-4 text-gray-800 dark:text-gray-100">
                Daily QC Defect Rate Trend
              </h3>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart
                  data={data.dailyTrend}
                  margin={{ top: 15, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === "dark" ? "#4b5563" : "#d1d5db"}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: chartTextColor, fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: chartTextColor, fontSize: 12 }}
                    unit="%"
                    domain={[0, "dataMax + 2"]} // Auto-scale Y-axis with a 2% buffer
                    tickFormatter={(tick) => tick.toFixed(0)}
                  />
                  <Tooltip
                    formatter={(value) => `${value.toFixed(2)}%`}
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                      borderColor: chartAxisColor,
                      color: chartTextColor
                    }}
                  />
                  {/* The KPI Reference Line */}
                  <ReferenceLine
                    y={5}
                    label={{
                      value: "KPI = 5%",
                      position: "insideTopRight",
                      fill: "#ef4444",
                      fontSize: 14
                    }}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="defectRate"
                    stroke="#4A41F0FF"
                    strokeWidth={3}
                    dot={<CustomizedDot />} // Use our custom dot component
                    activeDot={{ r: 6 }}
                  >
                    {/* Add annotations on top of each point */}
                    <LabelList
                      dataKey="defectRate"
                      position="top"
                      offset={10}
                      formatter={(value) => `${value.toFixed(2)}%`}
                      style={{
                        fill: chartTextColor,
                        fontSize: "14px"
                      }}
                    />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* --- 👇 ADD THE ENTIRE NEW PIVOT TABLE SECTION HERE --- */}
          <div className="grid grid-cols-1 mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">
                Daily Individual Defect Trend
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
                {appliedFiltersText}
              </p>

              {/* Defect Name Multi-Select Filter */}
              <div className="mb-4 max-w-lg">
                <label className="text-sm font-medium">
                  Filter by Defect Name:
                </label>
                <Select
                  options={data.uniqueDefectNames.map((name) => ({
                    value: name,
                    label: name
                  }))}
                  value={selectedDefects}
                  onChange={setSelectedDefects}
                  isMulti
                  isClearable
                  placeholder="Showing all defects..."
                  styles={reactSelectStyles}
                  closeMenuOnSelect={false}
                />
              </div>

              {/* Pivot Table */}
              <div className="overflow-x-auto max-h-[70vh]">
                <table className="min-w-full text-sm border-collapse">
                  <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 z-10">
                    <tr>
                      <th className="p-2 border dark:border-gray-600 text-left sticky left-0 bg-gray-100 dark:bg-gray-700">
                        Defect Name
                      </th>
                      {pivotTableData.headers.map((date) => (
                        <th
                          key={date}
                          className="p-2 border dark:border-gray-600 min-w-[100px]"
                        >
                          {date}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {pivotTableData.rows.map((row) => (
                      <tr key={row.defectName}>
                        <td className="p-2 border dark:border-gray-600 font-semibold sticky left-0 bg-white dark:bg-gray-800">
                          {row.defectName}
                        </td>
                        {pivotTableData.headers.map((date) => {
                          const cellData = row.dates[date];
                          const bgColor = cellData
                            ? getTopDefectRateColorClass(cellData.defectRate)
                            : "";
                          return (
                            <td
                              key={date}
                              className={`p-2 border dark:border-gray-600 text-center ${bgColor}`}
                            >
                              {cellData ? (
                                <div>
                                  <span className="font-bold text-base">
                                    {cellData.defectRate.toFixed(2)}%
                                  </span>
                                  <span className="block text-xs text-gray-600 dark:text-gray-400">
                                    ({cellData.qty})
                                  </span>
                                </div>
                              ) : (
                                "" // Render nothing if no data
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- MODALS RENDERED AT THE END --- */}
      {isUserModalOpen && (
        <QAUserModal
          user={qaUserInfo}
          isLoading={isUserLoading}
          onClose={closeUserModal}
        />
      )}
      {isImageModalOpen && (
        <QAImageModal data={imageModalData} onClose={closeImageModal} />
      )}
    </div>
  );
};

const FilterControl = ({ label, children }) => (
  <div className="flex-1 min-w-[150px]">
    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
      {label}
    </label>
    {children}
  </div>
);

export default SubConQCDashboardDailyView;
