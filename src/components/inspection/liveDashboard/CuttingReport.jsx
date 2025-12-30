import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MoreVertical,
  Search,
  XCircle,
  Archive,
  ClipboardCheck,
  FileSearch,
  Scaling,
  PackageCheck,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Bug,
  ClipboardList,
  Edit,
  MessageSquare,
  ArrowLeft,
  Filter,
  Calendar,
  Settings,
  BarChart3,
  FileText,
  Users,
  Package,
  Download,
  RefreshCw,
  Grid3X3,
  List,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle as XCircleIcon,
  AlertCircle
} from "lucide-react";
import React, { useCallback, useEffect, useState, useRef } from "react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import CuttingReportDetailView from "../cutting/report/CuttingReportDetailView";
import CuttingReportFollowUp from "../cutting/CuttingReportFollowUp";

const SearchableFilterDropdown = ({
  name,
  label,
  options,
  value,
  onChange,
  placeholder,
  isMulti = false,
  icon: Icon
}) => {
  const formattedOptions = options.map((opt) =>
    typeof opt === "object" &&
    opt.hasOwnProperty("value") &&
    opt.hasOwnProperty("label")
      ? opt
      : { value: opt, label: opt }
  );

  const selectedValue =
    formattedOptions.find((opt) => opt.value === value) || null;

  const handleChange = (selectedOption) => {
    onChange(name, selectedOption ? selectedOption.value : "");
  };

  // Tailwind-only styles for react-select
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: "48px",
      height: "48px",
      borderRadius: "12px",
      borderWidth: "2px",
      borderColor: state.isFocused ? "#3B82F6" : "#E5E7EB",
      backgroundColor: "#ffffff",
      boxShadow: state.isFocused 
        ? "0 0 0 4px rgba(59, 130, 246, 0.1)" 
        : "0 2px 4px 0 rgb(0 0 0 / 0.05)",
      "&:hover": {
        borderColor: "#9CA3AF"
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: "48px",
      padding: "0 16px"
    }),
    input: (provided) => ({
      ...provided,
      margin: "0px",
      fontSize: "14px",
      color: "#374151"
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#374151",
      fontSize: "14px",
      fontWeight: "500"
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9CA3AF",
      fontSize: "14px"
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: "48px"
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "#6B7280",
      "&:hover": {
        color: "#374151"
      }
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: "#6B7280",
      "&:hover": {
        color: "#EF4444"
      }
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 50,
      borderRadius: "12px",
      backgroundColor: "#ffffff",
      boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      border: "1px solid #E5E7EB",
      marginTop: "4px"
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? "#3B82F6" 
        : state.isFocused 
          ? "#F3F4F6"
          : "#ffffff",
      color: state.isSelected ? "white" : "#374151",
      padding: "12px 16px",
      fontSize: "14px",
      fontWeight: state.isSelected ? "600" : "500",
      "&:hover": {
        backgroundColor: state.isSelected ? "#3B82F6" : "#F3F4F6"
      }
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      color: "#6B7280",
      fontSize: "14px"
    })
  };

  // Dark mode styles
  const darkModeStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: "48px",
      height: "48px",
      borderRadius: "12px",
      borderWidth: "2px",
      borderColor: state.isFocused ? "#3B82F6" : "#4B5563",
      backgroundColor: "#374151",
      boxShadow: state.isFocused 
        ? "0 0 0 4px rgba(59, 130, 246, 0.1)" 
        : "0 2px 4px 0 rgb(0 0 0 / 0.05)",
      "&:hover": {
        borderColor: "#6B7280"
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: "48px",
      padding: "0 16px"
    }),
    input: (provided) => ({
      ...provided,
      margin: "0px",
      fontSize: "14px",
      color: "#E5E7EB"
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#E5E7EB",
      fontSize: "14px",
      fontWeight: "500"
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#6B7280",
      fontSize: "14px"
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: "48px"
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "#9CA3AF",
      "&:hover": {
        color: "#E5E7EB"
      }
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: "#9CA3AF",
      "&:hover": {
        color: "#F87171"
      }
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 50,
      borderRadius: "12px",
      backgroundColor: "#374151",
      boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      border: "1px solid #4B5563",
      marginTop: "4px"
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? "#3B82F6" 
        : state.isFocused 
          ? "#4B5563"
          : "#374151",
      color: state.isSelected ? "white" : "#E5E7EB",
      padding: "12px 16px",
      fontSize: "14px",
      fontWeight: state.isSelected ? "600" : "500",
      "&:hover": {
        backgroundColor: state.isSelected ? "#3B82F6" : "#4B5563"
      }
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      color: "#9CA3AF",
      fontSize: "14px"
    })
  };

  // Check if dark mode is active
  const isDarkMode = document.documentElement.classList.contains('dark') || 
                     window.matchMedia('(prefers-color-scheme: dark)').matches;

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {Icon && <Icon size={16} className="text-blue-500 dark:text-blue-400" />}
        {label}
      </label>
      
      <Select
        name={name}
        options={formattedOptions}
        value={selectedValue}
        onChange={handleChange}
        placeholder={placeholder || `Search ${label.toLowerCase()}...`}
        isClearable
        isMulti={isMulti}
        className="react-select-container"
        classNamePrefix="react-select"
        styles={isDarkMode ? darkModeStyles : customStyles}
        noOptionsMessage={() => "No options found"}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: '#3B82F6',
            primary75: '#60A5FA',
            primary50: '#93C5FD',
            primary25: '#DBEAFE',
            danger: '#EF4444',
            dangerLight: '#FEE2E2',
            neutral0: isDarkMode ? '#374151' : '#ffffff',
            neutral5: isDarkMode ? '#4B5563' : '#F9FAFB',
            neutral10: isDarkMode ? '#4B5563' : '#F3F4F6',
            neutral20: isDarkMode ? '#6B7280' : '#E5E7EB',
            neutral30: isDarkMode ? '#6B7280' : '#D1D5DB',
            neutral40: isDarkMode ? '#9CA3AF' : '#9CA3AF',
            neutral50: isDarkMode ? '#9CA3AF' : '#6B7280',
            neutral60: isDarkMode ? '#D1D5DB' : '#4B5563',
            neutral70: isDarkMode ? '#E5E7EB' : '#374151',
            neutral80: isDarkMode ? '#F3F4F6' : '#1F2937',
            neutral90: isDarkMode ? '#F9FAFB' : '#111827',
          }
        })}
      />
    </div>
  );
};

// Enhanced status function with better visual indicators
const getResultStatus = (
  totalInspectionQty,
  sumTotalReject,
  sumTotalPcs,
  t
) => {
  if (sumTotalPcs < totalInspectionQty) {
    return {
      status: t("common.pending"),
      color: "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-300 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-400 dark:border-yellow-600",
      icon: Clock
    };
  }

  const getThreshold = (qty) => {
    if (qty >= 315) return 7;
    if (qty >= 210) return 5;
    if (qty >= 135) return 3;
    if (qty >= 90) return 2;
    if (qty >= 60) return 1;
    if (qty >= 30) return 0;
    return -1;
  };

  const threshold = getThreshold(totalInspectionQty);
  
  if (sumTotalReject > threshold) {
    return { 
      status: t("common.fail"), 
      color: "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-300 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-400 dark:border-red-600",
      icon: XCircleIcon
    };
  }
  
  return { 
    status: t("common.pass"), 
    color: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-300 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400 dark:border-green-600",
    icon: CheckCircle2
  };
};

const CuttingReport = ({ onBackToCuttingLive }) => {
  const { t, i18n } = useTranslation();

  const initialFilters = {
    startDate: new Date(),
    endDate: new Date(),
    buyer: "",
    moNo: "",
    tableNo: "",
    color: "",
    garmentType: "",
    spreadTable: "",
    material: "",
    qcId: ""
  };

  const [filters, setFilters] = useState(initialFilters);
  const [reports, setReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    buyers: ["MWW", "Costco", "Aritzia", "Reitmans", "ANF", "STORI", "Other"],
    moNos: [],
    tableNos: [],
    colors: [],
    garmentTypes: [],
    spreadTables: [],
    materials: [],
    qcInspectors: []
  });
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedReportForFollowUp, setSelectedReportForFollowUp] = useState(null);
  const actionMenuRef = useRef(null);
  const [columnVisibility, setColumnVisibility] = useState({
    markerRatio: false,
    layerDetails: false,
    bundleDetails: false,
    inspectionDetails: false
  });
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Statistics calculation
  const statistics = React.useMemo(() => {
    if (!reports.length) return null;
    
    const totalPass = reports.reduce((sum, report) => sum + (report.sumTotalPass || 0), 0);
    const totalReject = reports.reduce((sum, report) => sum + (report.sumTotalReject || 0), 0);
    const totalInspected = reports.reduce((sum, report) => sum + (report.sumTotalPcs || 0), 0);
    const avgPassRate = reports.reduce((sum, report) => sum + (report.overallPassRate || 0), 0) / reports.length;
    
    return {
      totalPass,
      totalReject,
      totalInspected,
      avgPassRate: avgPassRate.toFixed(2),
      passCount: reports.filter(r => {
        const { status } = getResultStatus(r.totalInspectionQty, r.sumTotalReject, r.sumTotalPcs, t);
        return status === t("common.pass");
      }).length,
      failCount: reports.filter(r => {
        const { status } = getResultStatus(r.totalInspectionQty, r.sumTotalReject, r.sumTotalPcs, t);
        return status === t("common.fail");
      }).length,
      pendingCount: reports.filter(r => {
        const { status } = getResultStatus(r.totalInspectionQty, r.sumTotalReject, r.sumTotalPcs, t);
        return status === t("common.pending");
      }).length
    };
  }, [reports, t]);

  const handleColumnVisibilityChange = (column) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const fetchFilterOptions = useCallback(async (currentFilters) => {
    try {
      const params = {
        ...currentFilters,
        startDate: currentFilters.startDate
          ? currentFilters.startDate.toLocaleDateString("en-CA")
          : null,
        endDate: currentFilters.endDate
          ? currentFilters.endDate.toLocaleDateString("en-CA")
          : null
      };

      const response = await axios.get(
        `${API_BASE_URL}/api/cutting-report-filter-options`,
        { params }
      );
      setFilterOptions((prev) => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const qcResponse = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/qc-inspectors`
        );
        setFilterOptions((prev) => ({
          ...prev,
          qcInspectors: qcResponse.data
        }));
      } catch (error) {
        console.error("Error fetching initial QC data:", error);
      }
    };

    fetchInitialData();
  }, []);

  const fetchReports = useCallback(
    async (pageToFetch = 1, currentFilters = filters) => {
      setLoading(true);
      try {
        const params = {
          ...currentFilters,
          startDate: currentFilters.startDate
            ? currentFilters.startDate.toLocaleDateString("en-US")
            : null,
          endDate: currentFilters.endDate
            ? currentFilters.endDate.toLocaleDateString("en-US")
            : null,
          page: pageToFetch,
          limit: 15
        };

        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections-report`,
          { params }
        );

        setReports(response.data.reports);
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.currentPage);
        setTotalReports(response.data.totalReports);
      } catch (error) {
        console.error("Error fetching reports:", error);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text:
            error.response?.data?.message || t("cutting.failedToFetchReports")
        });
        setReports([]);
        setTotalPages(0);
        setTotalReports(0);
      } finally {
        setLoading(false);
      }
    },
    [filters, t]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchFilterOptions(filters);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters, fetchFilterOptions]);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    if (
      name === "endDate" &&
      date &&
      filters.startDate &&
      date < filters.startDate
    ) {
      Swal.fire({
        icon: "warning",
        title: t("common.invalidDateRange"),
        text: t("common.endDateCannotBeBeforeStartDate")
      });
      return;
    }

    setFilters((prev) => ({ ...prev, [name]: date }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    fetchReports(1, initialFilters);
  };

  const handleSearch = () => {
    fetchReports(1);
  };

  const handleActionClick = (reportId) => {
    setActiveActionMenu(activeActionMenu === reportId ? null : reportId);
  };

  const handleOpenFollowUp = (report) => {
    setSelectedReportForFollowUp(report);
    setIsFollowUpModalOpen(true);
    setActiveActionMenu(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        setActiveActionMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleViewReport = (reportId) => setSelectedReportId(reportId);
  const handleBackFromDetail = () => setSelectedReportId(null);

  if (selectedReportId) {
    return (
      <CuttingReportDetailView
        reportId={selectedReportId}
        onBack={handleBackFromDetail}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 p-4 lg:p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* Modern Header with Glassmorphism Effect */}
        <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-indigo-600/10 dark:from-blue-400/5 dark:via-purple-400/5 dark:to-indigo-400/5"></div>
          
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                {onBackToCuttingLive && (
                  <button
                    onClick={onBackToCuttingLive}
                    className="group flex items-center gap-3 px-5 py-3 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-2xl transition-all duration-300 backdrop-blur-sm hover:scale-105 hover:shadow-lg"
                  >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
                    <span className="font-semibold">Back to Home</span>
                  </button>
                )}
                
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 dark:bg-white/10 rounded-2xl backdrop-blur-sm">
                    <FileText size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Cutting Reports</h1>
                    <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">
                      Quality inspection reports and analytics dashboard
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`group flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                    showFilters 
                      ? "bg-white text-blue-600 shadow-lg hover:shadow-xl dark:bg-gray-700 dark:text-blue-400" 
                      : "bg-white/20 text-white hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20"
                  }`}
                >
                  <Filter size={20} className="group-hover:rotate-12 transition-transform duration-300" />
                  <span>Filters</span>
                </button>
                
                <button
                  onClick={() => fetchReports(currentPage)}
                  disabled={loading}
                  className="group flex items-center gap-3 px-6 py-3 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-2xl transition-all duration-300 font-semibold disabled:opacity-50"
                >
                  <RefreshCw size={20} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Filters Section with Better Layout */}
          {showFilters && (
            <div className="relative p-8 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {/* Date Filters with Enhanced Styling */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Calendar size={16} className="text-blue-500 dark:text-blue-400" />
                    {t("common.startDate")}
                  </label>
                  <DatePicker
                    selected={filters.startDate}
                    onChange={(date) => handleDateChange("startDate", date)}
                    dateFormat="MM/dd/yyyy"
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Calendar size={16} className="text-blue-500 dark:text-blue-400" />
                    {t("common.endDate")}
                  </label>
                  <DatePicker
                    selected={filters.endDate}
                    onChange={(date) => handleDateChange("endDate", date)}
                    dateFormat="MM/dd/yyyy"
                    minDate={filters.startDate}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                    isClearable
                  />
                </div>

                {/* Enhanced Filter Dropdowns */}
                <SearchableFilterDropdown
                  name="buyer"
                  label={t("cutting.buyer")}
                  options={filterOptions.buyers}
                  value={filters.buyer}
                  onChange={handleSelectChange}
                  placeholder={t("cutting.selectBuyer")}
                  icon={Users}
                />

                <SearchableFilterDropdown
                  name="moNo"
                  label={t("cutting.moNo")}
                  options={filterOptions.moNos}
                  value={filters.moNo}
                  onChange={handleSelectChange}
                  placeholder={t("cutting.selectMoNo")}
                  icon={FileText}
                />

                <SearchableFilterDropdown
                  name="tableNo"
                  label={t("cutting.tableNo")}
                  options={filterOptions.tableNos}
                  value={filters.tableNo}
                  onChange={handleSelectChange}
                  placeholder={t("cutting.selectTableNo")}
                  icon={Package}
                />

                <SearchableFilterDropdown
                  name="color"
                  label={t("cutting.color")}
                  options={filterOptions.colors}
                  value={filters.color}
                  onChange={handleSelectChange}
                  placeholder={t("cutting.selectColor")}
                />

                <SearchableFilterDropdown
                  name="garmentType"
                  label={t("cutting.garmentType")}
                  options={filterOptions.garmentTypes}
                  value={filters.garmentType}
                  onChange={handleSelectChange}
                  placeholder={t("cutting.selectGarmentType")}
                />

                <SearchableFilterDropdown
                  name="spreadTable"
                  label={t("cutting.spreadTable")}
                  options={filterOptions.spreadTables}
                  value={filters.spreadTable}
                  onChange={handleSelectChange}
                  placeholder={t("cutting.selectSpreadTable")}
                />

                <SearchableFilterDropdown
                  name="material"
                  label={t("cutting.material")}
                  options={filterOptions.materials}
                  value={filters.material}
                  onChange={handleSelectChange}
                  placeholder={t("cutting.selectMaterial")}
                />

                <SearchableFilterDropdown
                  name="qcId"
                  label={t("cutting.qcId")}
                  options={filterOptions.qcInspectors.map((qc) => ({
                    value: qc.emp_id,
                    label: `${qc.emp_id} - ${
                      i18n.language === "km" && qc.kh_name ? qc.kh_name : qc.eng_name
                    }`
                  }))}
                  value={filters.qcId}
                  onChange={handleSelectChange}
                  placeholder={t("cutting.selectQcId")}
                  icon={Users}
                />
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                <button
                  onClick={handleSearch}
                  className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold transform hover:scale-105"
                                    disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search size={20} className="group-hover:scale-110 transition-transform duration-300" />
                  )}
                  <span>{t("common.search")}</span>
                </button>

                <button
                  onClick={handleClearFilters}
                  className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-900 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold transform hover:scale-105"
                  disabled={loading}
                >
                  <XCircle size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span>{t("common.clear")}</span>
                </button>

                <button
                  onClick={() => {/* Add export functionality */}}
                  className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold transform hover:scale-105"
                >
                  <Download size={20} className="group-hover:-translate-y-1 transition-transform duration-300" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Statistics Dashboard */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Reports</p>
                  <p className="text-3xl font-bold">{totalReports.toLocaleString()}</p>
                </div>
                <BarChart3 size={32} className="text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Pass Count</p>
                  <p className="text-3xl font-bold">{statistics.passCount}</p>
                </div>
                <CheckCircle2 size={32} className="text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Fail Count</p>
                  <p className="text-3xl font-bold">{statistics.failCount}</p>
                </div>
                <XCircleIcon size={32} className="text-red-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 dark:from-yellow-600 dark:to-amber-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold">{statistics.pendingCount}</p>
                </div>
                <Clock size={32} className="text-yellow-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Avg Pass Rate</p>
                  <p className="text-3xl font-bold">{statistics.avgPassRate}%</p>
                </div>
                <TrendingUp size={32} className="text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Total Inspected</p>
                  <p className="text-3xl font-bold">{statistics.totalInspected.toLocaleString()}</p>
                </div>
                <PackageCheck size={32} className="text-indigo-200" />
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Results Summary with Better Controls */}
        {totalReports > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl">
                  <BarChart3 size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Showing {reports.length} of {totalReports.toLocaleString()} reports
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Page {currentPage} of {totalPages} • Updated just now
                  </p>
                </div>
              </div>

              {/* Enhanced View Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">View:</span>
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        viewMode === 'table'
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <List size={16} />
                      <span className="text-sm font-medium">Table</span>
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Grid3X3 size={16} />
                      <span className="text-sm font-medium">Grid</span>
                    </button>
                  </div>
                </div>

                {/* Column Visibility Controls */}
                <div className="flex items-center gap-3">
                  <SlidersHorizontal size={18} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Columns:</span>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { key: 'markerRatio', label: 'Marker', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
                      { key: 'layerDetails', label: 'Layers', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
                      { key: 'bundleDetails', label: 'Bundles', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                      { key: 'inspectionDetails', label: 'Inspection', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
                    ].map(({ key, label, color }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={columnVisibility[key]}
                          onChange={() => handleColumnVisibilityChange(key)}
                          className="w-4 h-4 text-blue-600 border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2 bg-white dark:bg-gray-700 transition-all duration-200"
                        />
                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg transition-all duration-200 ${
                          columnVisibility[key] ? color : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Legend with Better Visual Design */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
          <h4 className="flex items-center gap-3 font-bold text-gray-900 dark:text-gray-100 mb-6 text-lg">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl">
              <Archive size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            {t("common.headerIconLegend")}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-4">
            {[
              { icon: Archive, label: t("cutting.totalQty"), color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
              { icon: ClipboardCheck, label: t("cutting.qtyChecked"), color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
              { icon: FileSearch, label: t("cutting.inspectedQty"), color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
              { icon: Scaling, label: t("cutting.inspectedSizes"), color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/20" },
              { icon: PackageCheck, label: t("cutting.totalCompleted"), color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
              { icon: ThumbsUp, label: t("cutting.pass"), color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
              { icon: ThumbsDown, label: t("cutting.reject"), color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
              { icon: AlertTriangle, label: t("cutting.rejectMeasurements"), color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
              { icon: Bug, label: t("cutting.rejectDefects"), color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" }
            ].map(({ icon: Icon, label, color, bg }) => (
              <div key={label} className={`flex items-center gap-3 p-4 ${bg} rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200 group`}>
                <Icon size={18} className={`${color} group-hover:scale-110 transition-transform duration-200`} />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Table/Grid Container */}
        {loading && reports.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-16">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
                <Loader2 className="absolute inset-0 w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <p className="text-xl font-semibold text-gray-600 dark:text-gray-400 mt-6">{t("common.loadingData")}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Please wait while we fetch your reports...</p>
            </div>
          </div>
        ) : !loading && reports.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-16">
            <div className="text-center">
              <div className="p-6 bg-gray-100 dark:bg-gray-700/50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <FileText size={48} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No Reports Found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-lg">{t("cutting.noReportsFound")}</p>
              <button
                onClick={handleClearFilters}
                className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200"
              >
                Clear Filters & Try Again
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {reports.map((report, index) => {
              const { status, color, icon: StatusIcon } = getResultStatus(
                report.totalInspectionQty,
                report.sumTotalReject,
                report.sumTotalPcs,
                t
              );
              return (
                <div key={report._id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">{report.moNo}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{report.inspectionDate}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => handleActionClick(report._id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                      >
                        <MoreVertical size={16} className="text-gray-500 dark:text-gray-400" />
                      </button>
                      {activeActionMenu === report._id && (
                        <div
                          ref={actionMenuRef}
                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-30 overflow-hidden"
                        >
                          <div className="py-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleOpenFollowUp(report);
                              }}
                              className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors duration-150"
                            >
                              <ClipboardList size={16} className="mr-3" />
                              {t("common.followUp")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Buyer:</span>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg text-xs font-semibold">
                        {report.buyer}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Table:</span>
                      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{report.tableNo}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Pass Rate:</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {report.overallPassRate?.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${color}`}>
                      <StatusIcon size={16} />
                      {status}
                    </div>
                    <button
                      onClick={() => handleViewReport(report._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-semibold"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Enhanced Table View
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 backdrop-blur-sm">
                  <tr className="text-left font-bold text-gray-700 dark:text-gray-300">
                    <th rowSpan="2" className="px-6 py-5 border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.inspectionDate")}
                    </th>
                    <th rowSpan="2" className="px-6 py-5 border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.buyer")}
                    </th>
                    <th rowSpan="2" className="px-6 py-5 border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.moNo")}
                    </th>
                    <th rowSpan="2" className="px-6 py-5 border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.tableNo")}
                    </th>
                    <th rowSpan="2" className="px-6 py-5 border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.custStyle")}
                    </th>
                    <th rowSpan="2" className="px-6 py-5 border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.spreadTable")}
                    </th>
                    <th rowSpan="2" className="px-6 py-5 border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.material")}
                    </th>
                    <th rowSpan="2" className="px-6 py-5 border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.lotNos")}
                    </th>
                    <th rowSpan="2" className="px-6 py-5 border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.qcId")}
                    </th>
                    <th rowSpan="2" className="px-6 py-5 border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.color")}
                    </th>
                    <th rowSpan="2" className="px-6 py-5 border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.garmentType")}
                    </th>
                    <th rowSpan="2" className="px-6 py-5 border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.mackerNo")}
                    </th>
                    {columnVisibility.markerRatio && (
                      <th rowSpan="2" className="px-6 py-5 border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                        {t("cutting.mackerRatio")}
                      </th>
                    )}
                    {columnVisibility.layerDetails && (
                      <th colSpan="3" className="px-6 py-5 text-center border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-yellow-50/80 to-amber-50/80 dark:from-yellow-900/20 dark:to-amber-900/20 font-bold text-sm">
                        {t("cutting.layerDetails")}
                      </th>
                    )}
                    {columnVisibility.bundleDetails && (
                      <th colSpan="4" className="px-6 py-5 text-center border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 font-bold text-sm">
                        {t("cutting.bundleDetails")}
                      </th>
                    )}
                    {columnVisibility.inspectionDetails && (
                      <th colSpan="5" className="px-6 py-5 text-center border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 font-bold text-sm">
                        {t("cutting.inspectionDetails")}
                      </th>
                    )}
                    <th rowSpan="2" className="px-6 py-5 text-center border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.passRate")} (%)
                    </th>
                    <th rowSpan="2" className="px-6 py-5 text-center border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.results")}
                    </th>
                    <th rowSpan="2" className="px-6 py-5 text-center border-r border-gray-200/50 dark:border-gray-600/50 align-middle font-bold text-sm">
                      {t("cutting.report")}
                    </th>
                    <th rowSpan="2" className="px-6 py-5 text-center align-middle font-bold text-sm">
                      {t("common.action")}
                    </th>
                  </tr>
                  <tr className="text-center font-semibold text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/50">
                    {columnVisibility.layerDetails && (
                      <>
                        <th className="px-6 py-4 border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-yellow-50/80 to-amber-50/80 dark:from-yellow-900/20 dark:to-amber-900/20 text-yellow-700 dark:text-yellow-400 font-bold text-sm">
                          {t("cutting.plan")}
                        </th>
                        <th className="px-6 py-4 border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-yellow-50/80 to-amber-50/80 dark:from-yellow-900/20 dark:to-amber-900/20 text-yellow-700 dark:text-yellow-400 font-bold text-sm">
                          {t("cutting.actual")}
                        </th>
                        <th className="px-6 py-4 border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-yellow-50/80 to-amber-50/80 dark:from-yellow-900/20 dark:to-amber-900/20 text-yellow-700 dark:text-yellow-400 font-bold text-sm">
                          {t("cutting.totalPcs")}
                        </th>
                      </>
                    )}
                    {columnVisibility.bundleDetails && (
                      <>
                        <th className="px-6 py-4 border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20" title={t("cutting.totalQty")}>
                          <div className="flex items-center justify-center">
                          <Archive size={20} className="text-blue-600 dark:text-blue-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20" title={t("cutting.qtyChecked")}>
                          <div className="flex items-center justify-center">
                            <ClipboardCheck size={20} className="text-blue-600 dark:text-blue-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20" title={t("cutting.inspectedQty")}>
                          <div className="flex items-center justify-center">
                            <FileSearch size={20} className="text-blue-600 dark:text-blue-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20" title={t("cutting.inspectedSizes")}>
                          <div className="flex items-center justify-center">
                            <Scaling size={20} className="text-blue-600 dark:text-blue-400" />
                          </div>
                        </th>
                      </>
                    )}
                    {columnVisibility.inspectionDetails && (
                      <>
                        <th className="px-6 py-4 border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20" title={t("cutting.totalCompleted")}>
                          <div className="flex items-center justify-center">
                            <PackageCheck size={20} className="text-green-600 dark:text-green-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20" title={t("cutting.pass")}>
                          <div className="flex items-center justify-center">
                            <ThumbsUp size={20} className="text-green-600 dark:text-green-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20" title={t("cutting.reject")}>
                          <div className="flex items-center justify-center">
                            <ThumbsDown size={20} className="text-red-600 dark:text-red-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20" title={t("cutting.rejectMeasurements")}>
                          <div className="flex items-center justify-center">
                            <AlertTriangle size={20} className="text-orange-600 dark:text-orange-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 border-r border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20" title={t("cutting.rejectDefects")}>
                          <div className="flex items-center justify-center">
                            <Bug size={20} className="text-purple-600 dark:text-purple-400" />
                          </div>
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/30 dark:divide-gray-700/30">
                  {reports.map((report, index) => {
                    const { status, color, icon: StatusIcon } = getResultStatus(
                      report.totalInspectionQty,
                      report.sumTotalReject,
                      report.sumTotalPcs,
                      t
                    );
                    return (
                      <tr key={report._id} className={`hover:bg-white/80 dark:hover:bg-gray-700/50 transition-all duration-200 group ${
                        index % 2 === 0 ? 'bg-white/30 dark:bg-gray-800/30' : 'bg-gray-50/30 dark:bg-gray-800/50'
                      }`}>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200/30 dark:border-gray-600/30 font-semibold text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            {report.inspectionDate}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200/30 dark:border-gray-600/30">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700">
                            {report.buyer}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200/30 dark:border-gray-600/30 font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                          <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                            {report.moNo}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200/30 dark:border-gray-600/30 font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                          <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                            {report.tableNo}
                          </div>
                        </td>
                        <td className="px-6 py-4 border-r border-gray-200/30 dark:border-gray-600/30 break-words min-w-[150px] text-sm font-medium text-gray-900 dark:text-gray-100">
                          {report.buyerStyle}
                        </td>
                        <td className="px-6 py-4 border-r border-gray-200/30 dark:border-gray-600/30 break-words text-sm font-medium text-gray-900 dark:text-gray-100">
                          {report.cuttingTableDetails?.spreadTable}
                        </td>
                        <td className="px-6 py-4 border-r border-gray-200/30 dark:border-gray-600/30 break-words min-w-[150px] text-sm font-medium text-gray-900 dark:text-gray-100">
                          {report.fabricDetails?.material}
                        </td>
                        <td className="px-6 py-4 border-r border-gray-200/30 dark:border-gray-600/30 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {report.lotNo?.map((lot, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 dark:from-gray-700 dark:to-gray-600 dark:text-gray-200 dark:border-gray-500"
                              >
                                {lot}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200/30 dark:border-gray-600/30 font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                          <div className="bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-lg text-indigo-800 dark:text-indigo-400">
                            {report.cutting_emp_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 border-r border-gray-200/30 dark:border-gray-600/30 break-words">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-700">
                            {report.color}
                          </span>
                        </td>
                        <td className="px-6 py-4 border-r border-gray-200/30 dark:border-gray-600/30 break-words text-sm font-medium text-gray-900 dark:text-gray-100">
                          {report.garmentType}
                        </td>
                        <td className="px-6 py-4 text-center border-r border-gray-200/30 dark:border-gray-600/30 font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                          <div className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-lg text-amber-800 dark:text-amber-400">
                            {report.cuttingTableDetails?.mackerNo}
                          </div>
                        </td>
                        {columnVisibility.markerRatio && (
                          <td className="px-6 py-4 border-r border-gray-200/30 dark:border-gray-600/30 min-w-[150px]">
                            {report.mackerRatio && report.mackerRatio.length > 0 && (
                              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                                <table className="text-xs w-full">
                                  <tbody>
                                    <tr>
                                      {report.mackerRatio.map((mr) => (
                                        <td
                                          key={`${mr.index}-size`}
                                          className="px-2 py-1 text-center font-bold text-gray-700 dark:text-gray-300"
                                        >
                                          {mr.markerSize}
                                        </td>
                                      ))}
                                    </tr>
                                    <tr>
                                      {report.mackerRatio.map((mr) => (
                                        <td
                                          key={`${mr.index}-ratio`}
                                          className="px-2 pt-2 text-center"
                                        >
                                          <span className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white font-bold rounded-lg px-2 py-1 shadow-md">
                                            {mr.ratio}
                                          </span>
                                        </td>
                                      ))}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        )}
                        {columnVisibility.layerDetails && (
                          <>
                            <td className="px-6 py-4 text-right border-r border-gray-200/30 dark:border-gray-600/30 whitespace-nowrap bg-gradient-to-br from-yellow-50/50 to-amber-50/50 dark:from-yellow-900/20 dark:to-amber-900/20 font-bold text-yellow-800 dark:text-yellow-400">
                              <div className="bg-yellow-100 dark:bg-yellow-900/40 px-3 py-1 rounded-lg">
                                {report.cuttingTableDetails?.planLayers}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right border-r border-gray-200/30 dark:border-gray-600/30 whitespace-nowrap bg-gradient-to-br from-yellow-50/50 to-amber-50/50 dark:from-yellow-900/20 dark:to-amber-900/20 font-bold text-yellow-800 dark:text-yellow-400">
                              <div className="bg-yellow-100 dark:bg-yellow-900/40 px-3 py-1 rounded-lg">
                                {report.cuttingTableDetails?.actualLayers}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right border-r border-gray-200/30 dark:border-gray-600/30 whitespace-nowrap bg-gradient-to-br from-yellow-50/50 to-amber-50/50 dark:from-yellow-900/20 dark:to-amber-900/20 font-bold text-yellow-800 dark:text-yellow-400">
                              <div className="bg-yellow-100 dark:bg-yellow-900/40 px-3 py-1 rounded-lg">
                                {report.cuttingTableDetails?.totalPcs?.toLocaleString()}
                              </div>
                            </td>
                          </>
                        )}
                        {columnVisibility.bundleDetails && (
                          <>
                            <td className="px-6 py-4 text-right border-r border-gray-200/30 dark:border-gray-600/30 whitespace-nowrap bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 font-bold text-blue-800 dark:text-blue-400">
                              <div className="bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-lg">
                                {report.totalBundleQty?.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right border-r border-gray-200/30 dark:border-gray-600/30 whitespace-nowrap bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-900/20 dark:to-red-900/20 font-bold text-orange-800 dark:text-orange-400">
                              <div className="bg-orange-100 dark:bg-orange-900/40 px-3 py-1 rounded-lg">
                                {report.bundleQtyCheck?.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right border-r border-gray-200/30 dark:border-gray-600/30 whitespace-nowrap bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 font-bold text-blue-800 dark:text-blue-400">
                              <div className="bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-lg">
                                {report.totalInspectionQty?.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right border-r border-gray-200/30 dark:border-gray-600/30 whitespace-nowrap bg-gradient-to-br from-gray-50/50 to-slate-50/50 dark:from-gray-700/50 dark:to-slate-700/50 font-bold text-gray-800 dark:text-gray-300">
                              <div className="bg-gray-100 dark:bg-gray-700/70 px-3 py-1 rounded-lg">
                                {report.numberOfInspectedSizes}
                              </div>
                            </td>
                          </>
                        )}
                        {columnVisibility.inspectionDetails && (
                          <>
                            <td className="px-6 py-4 text-right border-r border-gray-200/30 dark:border-gray-600/30 whitespace-nowrap bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 font-bold text-green-800 dark:text-green-400">
                              <div className="bg-green-100 dark:bg-green-900/40 px-3 py-1 rounded-lg">
                                {report.sumTotalPcs?.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right border-r border-gray-200/30 dark:border-gray-600/30 whitespace-nowrap bg-gradient-to-br from-green-100/50 to-emerald-100/50 dark:from-green-900/30 dark:to-emerald-900/30 font-bold text-green-700 dark:text-green-400">
                              <div className="bg-green-200 dark:bg-green-900/50 px-3 py-1 rounded-lg">
                                {report.sumTotalPass?.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right border-r border-gray-200/30 dark:border-gray-600/30 whitespace-nowrap bg-gradient-to-br from-red-100/50 to-rose-100/50 dark:from-red-900/30 dark:to-rose-900/30 font-bold text-red-700 dark:text-red-400">
                              <div className="bg-red-200 dark:bg-red-900/50 px-3 py-1 rounded-lg">
                                {report.sumTotalReject?.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right border-r border-gray-200/30 dark:border-gray-600/30 whitespace-nowrap bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-900/20 dark:to-amber-900/20 font-bold text-orange-700 dark:text-orange-400">
                              <div className="bg-orange-100 dark:bg-orange-900/40 px-3 py-1 rounded-lg">
                                {report.sumTotalRejectMeasurement?.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right border-r border-gray-200/30 dark:border-gray-600/30 whitespace-nowrap bg-gradient-to-br from-purple-50/50 to-violet-50/50 dark:from-purple-900/20 dark:to-violet-900/20 font-bold text-purple-700 dark:text-purple-400">
                              <div className="bg-purple-100 dark:bg-purple-900/40 px-3 py-1 rounded-lg">
                                {report.sumTotalRejectDefects?.toLocaleString()}
                              </div>
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 text-right border-r border-gray-200/30 dark:border-gray-600/30 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                                style={{ width: `${Math.min(report.overallPassRate || 0, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100 min-w-[60px]">
                              {report.overallPassRate?.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-gray-200/30 dark:border-gray-600/30">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md ${color}`}>
                            <StatusIcon size={16} />
                            {status}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-gray-200/30 dark:border-gray-600/30">
                          <button
                            onClick={() => handleViewReport(report._id)}
                            className="group inline-flex items-center justify-center w-12 h-12 text-blue-600 hover:text-white hover:bg-blue-600 dark:text-blue-400 dark:hover:text-white dark:hover:bg-blue-500 rounded-xl transition-all duration-300 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-600 dark:hover:border-blue-500 hover:shadow-lg transform hover:scale-105"
                            title={t("cutting.viewReport")}
                          >
                            <Eye size={20} className="group-hover:scale-110 transition-transform duration-200" />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center relative">
                          <button
                            onClick={() => handleActionClick(report._id)}
                            className="group inline-flex items-center justify-center w-12 h-12 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 rounded-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transform hover:scale-105"
                          >
                            <MoreVertical size={20} className="group-hover:scale-110 transition-transform duration-200" />
                          </button>
                          {activeActionMenu === report._id && (
                            <div
                              ref={actionMenuRef}
                              className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
                            >
                              <div className="py-3">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleOpenFollowUp(report);
                                  }}
                                  className="flex items-center w-full px-6 py-4 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all duration-200 group"
                                >
                                  <ClipboardList size={20} className="mr-4 group-hover:scale-110 transition-transform duration-200" />
                                  <div>
                                    <div>{t("common.followUp")}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Create follow-up report</div>
                                  </div>
                                </button>
                                <button
                                  onClick={(e) => e.preventDefault()}
                                  className="flex items-center w-full px-6 py-4 text-sm font-semibold text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50"
                                  disabled
                                >
                                  <Edit size={20} className="mr-4" />
                                  <div>
                                    <div>{t("common.editFollowUp")}</div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">Coming soon</div>
                                  </div>
                                </button>
                                <button
                                  onClick={(e) => e.preventDefault()}
                                  className="flex items-center w-full px-6 py-4 text-sm font-semibold text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50"
                                  disabled
                                >
                                  <MessageSquare size={20} className="mr-4" />
                                  <div>
                                    <div>{t("common.comments")}</div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">Coming soon</div>
                                  </div>
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Enhanced Pagination with Better Design */}
        {totalPages > 1 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BarChart3 size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-semibold">
                  Showing <span className="text-blue-600 dark:text-blue-400 font-bold">{((currentPage - 1) * 15) + 1}</span> to{" "}
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{Math.min(currentPage * 15, totalReports)}</span> of{" "}
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{totalReports.toLocaleString()}</span> results
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchReports(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="group flex items-center gap-3 px-6 py-3 text-sm font-semibold text-gray-700 bg-white/80 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 dark:text-gray-300 dark:bg-gray-800/80 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-500 transform hover:scale-105 disabled:hover:scale-100"
                >
                  <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
                  {t("common.previous")}
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchReports(pageNum)}
                        className={`w-12 h-12 text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-110 ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg dark:from-blue-700 dark:to-indigo-700"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => fetchReports(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="group flex items-center gap-3 px-6 py-3 text-sm font-semibold text-gray-700 bg-white/80 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 dark:text-gray-300 dark:bg-gray-800/80 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-500 transform hover:scale-105 disabled:hover:scale-100"
                >
                  {t("common.next")}
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Follow-up Modal */}
      {isFollowUpModalOpen && (
        <CuttingReportFollowUp
          report={selectedReportForFollowUp}
          onClose={() => setIsFollowUpModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CuttingReport;



