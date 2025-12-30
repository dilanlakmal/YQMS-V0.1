// src/components/inspection/cutting/report/CuttingGarmentTypeTrendAnalysis.jsx

import axios from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  FileText,
  Filter,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  TrendingDown,
  TrendingUp,
  XCircle,
  Calendar,
  Search,
  RefreshCw,
  Download,
  Settings,
  Eye,
  Users,
  Package,
  Activity,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import TrendTable from "./trends/TrendTable";

const initialFilters = {
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
  endDate: new Date(),
  moNo: "",
  tableNo: "",
  buyer: ""
};

function debounce(func, delay) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, delay);
  };
}

const CuttingGarmentTypeTrendAnalysis = ({ onBackToCuttingLive }) => {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFiltersString, setAppliedFiltersString] = useState("");
  const [loading, setLoading] = useState({
    main: false,
    measurementTrend: false,
    fabricTrend: false,
    filterOptions: false,
    partNameOptions: false,
    topIssues: false
  });

  const [garmentTypeData, setGarmentTypeData] = useState([]);
  const [measurementPointTrendData, setMeasurementPointTrendData] = useState({
    headers: [],
    data: []
  });
  const [fabricDefectTrendData, setFabricDefectTrendData] = useState({
    headers: [],
    data: []
  });
  const [topMeasurementIssues, setTopMeasurementIssues] = useState([]);
  const [topDefectIssues, setTopDefectIssues] = useState([]);
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [tableNoOptions, setTableNoOptions] = useState([]);
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [moNoSearch, setMoNoSearch] = useState("");
  const [tableNoSearch, setTableNoSearch] = useState("");
  const [buyerSearch, setBuyerSearch] = useState("");
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);
  const moNoDropdownRef = useRef(null);
  const tableNoDropdownRef = useRef(null);
  const buyerDropdownRef = useRef(null);
  const [trendGarmentTypeFilter, setTrendGarmentTypeFilter] = useState("");
  const [trendPartNameFilter, setTrendPartNameFilter] = useState("");
  const [garmentTypeOptionsForTrend, setGarmentTypeOptionsForTrend] = useState([]);
  const [partNameOptionsForTrend, setPartNameOptionsForTrend] = useState([]);
  const [showFilters, setShowFilters] = useState(true);

  // Statistics calculation
  const statistics = React.useMemo(() => {
    if (!garmentTypeData.length) return null;
    
    const totalInspections = garmentTypeData.reduce((sum, item) => sum + (item.noOfInspections || 0), 0);
    const totalBundleQty = garmentTypeData.reduce((sum, item) => sum + (item.totalBundleQty || 0), 0);
    const totalInspectedQty = garmentTypeData.reduce((sum, item) => sum + (item.totalInspectedQty || 0), 0);
    
    const avgPassRate = garmentTypeData.length > 0 
      ? garmentTypeData.reduce((sum, item) => sum + (item.passRate?.overall || 0), 0) / garmentTypeData.length
      : 0;

    const aqlSummary = garmentTypeData.reduce((acc, item) => {
      const aql = item.aqlSummary || { pass: 0, reject: 0, pending: 0 };
      return {
        pass: acc.pass + aql.pass,
        reject: acc.reject + aql.reject,
        pending: acc.pending + aql.pending
      };
    }, { pass: 0, reject: 0, pending: 0 });
    
    return {
      totalInspections,
      totalBundleQty,
      totalInspectedQty,
      avgPassRate: avgPassRate.toFixed(2),
      aqlSummary
    };
  }, [garmentTypeData]);

  const getLocalizedText = (eng, khmer, chinese) => {
    if (i18n.language === "km" && khmer) return khmer;
    if (i18n.language === "zh" && chinese) return chinese;
    return eng || "";
  };

  const fetchFilterOptions = useCallback(
    async (currentFilters) => {
      setLoading((prev) => ({ ...prev, filterOptions: true }));
      const params = {
        startDate: currentFilters.startDate?.toISOString().split("T")[0],
        endDate: currentFilters.endDate?.toISOString().split("T")[0],
        moNo: currentFilters.moNo || undefined,
        tableNo: currentFilters.tableNo || undefined,
        buyer: currentFilters.buyer || undefined
      };

      try {
        const [moRes, tableResConditional, buyerRes, garmentTypeRes] =
          await Promise.all([
            axios.get(`${API_BASE_URL}/api/cutting/filter-options/mo-numbers`, {
              params: { ...params, search: moNoSearch || undefined },
              withCredentials: true
            }),
            currentFilters.moNo
              ? axios.get(
                  `${API_BASE_URL}/api/cutting/filter-options/table-numbers`,
                  {
                    params: {
                      ...params,
                      moNo: currentFilters.moNo,
                      search: tableNoSearch || undefined
                    },
                    withCredentials: true
                  }
                )
              : Promise.resolve({ data: [] }),
            axios.get(`${API_BASE_URL}/api/cutting/filter-options/buyers`, {
              params: { ...params, search: buyerSearch || undefined },
              withCredentials: true
            }),
            axios.get(
              `${API_BASE_URL}/api/cutting/filter-options/garment-types`,
              { params, withCredentials: true }
            )
          ]);

        setMoNoOptions(moRes.data);
        setTableNoOptions(tableResConditional.data);
        setBuyerOptions(buyerRes.data);
        setGarmentTypeOptionsForTrend(garmentTypeRes.data);
      } catch (error) {
        console.error("Error fetching filter options:", error);
      } finally {
        setLoading((prev) => ({ ...prev, filterOptions: false }));
      }
    },
    [moNoSearch, tableNoSearch, buyerSearch]
  );

  useEffect(() => {
    fetchFilterOptions(filters);
  }, [
    filters.startDate,
    filters.endDate,
    filters.moNo,
    filters.tableNo,
    filters.buyer,
    fetchFilterOptions
  ]);

  useEffect(() => {
    if (trendGarmentTypeFilter) {
      const fetchPartNames = async () => {
        setLoading((prev) => ({ ...prev, partNameOptions: true }));
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/cutting/part-names`,
            {
              params: { garmentType: trendGarmentTypeFilter },
              withCredentials: true
            }
          );
          setPartNameOptionsForTrend(response.data);
        } catch (error) {
          console.error("Error fetching part names:", error);
          setPartNameOptionsForTrend([]);
        } finally {
          setLoading((prev) => ({ ...prev, partNameOptions: false }));
        }
      };

      fetchPartNames();
    } else {
      setPartNameOptionsForTrend([]);
      setTrendPartNameFilter("");
    }
  }, [trendGarmentTypeFilter]);

  const fetchMeasurementPointTrend = useCallback(
    async (mainFilters, garmentType, partName) => {
      setLoading((prev) => ({ ...prev, measurementTrend: true }));
      const params = {
        startDate: mainFilters.startDate?.toISOString().split("T")[0],
        endDate: mainFilters.endDate?.toISOString().split("T")[0],
        moNo: mainFilters.moNo || undefined,
        tableNo: mainFilters.tableNo || undefined,
        buyer: mainFilters.buyer || undefined,
        garmentType: garmentType || undefined,
        partName: partName || undefined
      };

      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/cutting/trend/measurement-points`,
          { params, withCredentials: true }
        );
        setMeasurementPointTrendData(res.data || { headers: [], data: [] });
      } catch (error) {
        console.error("Error fetching measurement point trend:", error);
        setMeasurementPointTrendData({ headers: [], data: [] });
      } finally {
        setLoading((prev) => ({ ...prev, measurementTrend: false }));
      }
    },
    []
  );

  const fetchFabricDefectTrend = useCallback(
    async (mainFilters, garmentType, partName) => {
      setLoading((prev) => ({ ...prev, fabricTrend: true }));
      const params = {
        startDate: mainFilters.startDate?.toISOString().split("T")[0],
        endDate: mainFilters.endDate?.toISOString().split("T")[0],
        moNo: mainFilters.moNo || undefined,
        tableNo: mainFilters.tableNo || undefined,
        buyer: mainFilters.buyer || undefined,
        garmentType: garmentType || undefined,
        partName: partName || undefined
      };

      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/cutting/trend/fabric-defects`,
          { params, withCredentials: true }
        );
        setFabricDefectTrendData(res.data || { headers: [], data: [] });
      } catch (error) {
        console.error("Error fetching fabric defect trend:", error);
        setFabricDefectTrendData({ headers: [], data: [] });
      } finally {
        setLoading((prev) => ({ ...prev, fabricTrend: false }));
      }
    },
    []
  );

  const fetchTopIssuesData = useCallback(
    async (currentFilters, currentTrendGarmentTypeFilter) => {
      setLoading((prev) => ({ ...prev, topIssues: true }));
      const paramsForTopIssues = {
        startDate: currentFilters.startDate?.toISOString().split("T")[0],
        endDate: currentFilters.endDate?.toISOString().split("T")[0],
        moNo: currentFilters.moNo || undefined,
        tableNo: currentFilters.tableNo || undefined,
        buyer: currentFilters.buyer || undefined,
        garmentType: currentTrendGarmentTypeFilter || undefined
      };

      try {
        const [topMeasIssuesRes, topDefectIssuesRes] = await Promise.all([
          axios.get(
            `${API_BASE_URL}/api/cutting/trend/top-measurement-issues`,
            { params: paramsForTopIssues, withCredentials: true }
          ),
          axios.get(`${API_BASE_URL}/api/cutting/trend/top-defect-issues`, {
            params: paramsForTopIssues,
            withCredentials: true
          })
        ]);

        setTopMeasurementIssues(topMeasIssuesRes.data);
        setTopDefectIssues(topDefectIssuesRes.data);
      } catch (error) {
        console.error("Error fetching top issues data:", error);
        Swal.fire(
          t("common.error"),
          t(
            "cutting.failedToFetchTopIssues",
            "Failed to fetch top issues data."
          ),
          "error"
        );
      } finally {
        setLoading((prev) => ({ ...prev, topIssues: false }));
      }
    },
    [t]
  );

  const fetchData = useCallback(
    async (currentFilters, triggeredByMainFilter = false) => {
      setLoading((prev) => ({ ...prev, main: true }));
      const params = {
        startDate: currentFilters.startDate?.toISOString().split("T")[0],
        endDate: currentFilters.endDate?.toISOString().split("T")[0],
        moNo: currentFilters.moNo || undefined,
        tableNo: currentFilters.tableNo || undefined,
        buyer: currentFilters.buyer || undefined
      };

      let applied = [];
      if (params.startDate)
        applied.push(`${t("common.startDate")}: ${params.startDate}`);
      if (params.endDate)
        applied.push(`${t("common.endDate")}: ${params.endDate}`);
      if (params.moNo) applied.push(`${t("cutting.moNo")}: ${params.moNo}`);
      if (params.tableNo)
        applied.push(`${t("cutting.tableNo")}: ${params.tableNo}`);
      if (params.buyer) applied.push(`${t("cutting.buyer")}: ${params.buyer}`);

      setAppliedFiltersString(
        applied.length > 0 ? `(${applied.join(", ")})` : ""
      );

      try {
        const garmentTypeRes = await axios.get(
          `${API_BASE_URL}/api/cutting/trend/garment-type`,
          {
            params,
            withCredentials: true
          }
        );

        setGarmentTypeData(garmentTypeRes.data);
        await fetchTopIssuesData(currentFilters, trendGarmentTypeFilter);

        if (triggeredByMainFilter) {
          fetchMeasurementPointTrend(
            currentFilters,
            trendGarmentTypeFilter,
            trendPartNameFilter
          );
          fetchFabricDefectTrend(
            currentFilters,
            trendGarmentTypeFilter,
            trendPartNameFilter
          );
        }
      } catch (error) {
        console.error("Error fetching trend data:", error);
        Swal.fire(
          t("common.error"),
          t("cutting.failedToFetchTrendData", "Failed to fetch trend data."),
          "error"
        );
      } finally {
        setLoading((prev) => ({ ...prev, main: false }));
      }
    },
    [
      t,
      trendGarmentTypeFilter,
      trendPartNameFilter,
      fetchMeasurementPointTrend,
      fetchFabricDefectTrend,
      fetchTopIssuesData
    ]
  );

  useEffect(() => {
    fetchData(filters, true);
  }, []);

  const handleMainFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    if (name === "moNo") {
      setMoNoSearch(value);
      if (!value) {
        setFilters((f) => ({ ...f, tableNo: "" }));
        setTableNoSearch("");
        setTableNoOptions([]);
      }
    }
    if (name === "tableNo") setTableNoSearch(value);
    if (name === "buyer") setBuyerSearch(value);
  };

  const handleDateChange = (name, date) => {
    if (name === "endDate" && filters.startDate && date < filters.startDate) {
      Swal.fire(
        t("common.invalidDateRange"),
        t("common.endDateCannotBeBeforeStartDate"),
        "warning"
      );
      return;
    }
    setFilters((prev) => ({ ...prev, [name]: date }));
  };

  const applyMainFilters = () => fetchData(filters, true);

  const clearMainFilters = () => {
    setFilters(initialFilters);
    setMoNoSearch("");
    setTableNoSearch("");
    setBuyerSearch("");
    setTrendGarmentTypeFilter("");
    setTrendPartNameFilter("");
    fetchData(initialFilters, true);
  };

  const debouncedFetchMeasurementTrend = useCallback(
    debounce(fetchMeasurementPointTrend, 300),
    [fetchMeasurementPointTrend]
  );

  const debouncedFetchFabricDefectTrend = useCallback(
    debounce(fetchFabricDefectTrend, 300),
    [fetchFabricDefectTrend]
  );

  const debouncedFetchTopIssuesData = useCallback(
    debounce(fetchTopIssuesData, 300),
    [fetchTopIssuesData]
  );

  useEffect(() => {
    if (!loading.main)
      debouncedFetchMeasurementTrend(
        filters,
        trendGarmentTypeFilter,
        trendPartNameFilter
      );
  }, [
    filters,
    trendGarmentTypeFilter,
    trendPartNameFilter,
    debouncedFetchMeasurementTrend,
    loading.main
  ]);

  useEffect(() => {
    if (!loading.main)
      debouncedFetchFabricDefectTrend(
        filters,
        trendGarmentTypeFilter,
        trendPartNameFilter
      );
  }, [
    filters,
    trendGarmentTypeFilter,
    trendPartNameFilter,
    debouncedFetchFabricDefectTrend,
    loading.main
  ]);

  useEffect(() => {
    if (!loading.main) {
      debouncedFetchTopIssuesData(filters, trendGarmentTypeFilter);
    }
  }, [
    filters,
    trendGarmentTypeFilter,
    debouncedFetchTopIssuesData,
    loading.main
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      )
        setShowMoNoDropdown(false);
      if (
        tableNoDropdownRef.current &&
        !tableNoDropdownRef.current.contains(event.target)
      )
        setShowTableNoDropdown(false);
      if (
        buyerDropdownRef.current &&
        !buyerDropdownRef.current.contains(event.target)
      )
        setShowBuyerDropdown(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const AQLIconLegend = () => (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Settings size={16} className="text-blue-600 dark:text-blue-400" />
        <span className="font-semibold text-blue-800 dark:text-blue-200">{t("common.legend")}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <FileText size={14} className="text-slate-500 dark:text-slate-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("common.totalSamplesShort", "Total")}</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <ShieldCheck size={14} className="text-green-500" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("common.pass")}</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <ShieldX size={14} className="text-red-500" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("common.fail")}</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <ShieldAlert size={14} className="text-gray-500" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("common.pending")}</span>
        </div>
      </div>
    </div>
  );

  const MeasurementTrendIconLegend = () => (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Target size={16} className="text-green-600 dark:text-green-400" />
        <span className="font-semibold text-green-800 dark:text-green-200">{t("common.legend")}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <Check size={14} className="text-green-600" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t("cutting.totalCountWithinTolerancePoints", "Within Tolerance")}
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <TrendingDown size={14} className="text-red-600" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t("cutting.totalNegTolerancePoints", "Negative Tolerance")}
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <TrendingUp size={14} className="text-orange-500" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t("cutting.totalPosTolerancePoints", "Positive Tolerance")}
          </span>
        </div>
      </div>
    </div>
  );

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
                    <BarChart3 size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{t("cutting.trendAnalysisTitle")}</h1>
                    <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">
                      {t("cutting.trendAnalysisSubtitle", "Analyze cutting inspection trends over time and across various dimensions.")}
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
                  onClick={() => fetchData(filters, true)}
                  disabled={loading.main}
                  className="group flex items-center gap-3 px-6 py-3 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-2xl transition-all duration-300 font-semibold disabled:opacity-50"
                >
                  <RefreshCw size={20} className={`group-hover:rotate-180 transition-transform duration-500 ${loading.main ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Filters Section */}
          {showFilters && (
            <div className="relative p-8 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {/* Date Filters */}
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

                {/* Enhanced Searchable Dropdowns */}
                <div ref={moNoDropdownRef} className="relative space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Package size={16} className="text-blue-500 dark:text-blue-400" />
                    {t("cutting.moNo")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="moNo"
                      value={moNoSearch}
                      onChange={(e) => {
                        setMoNoSearch(e.target.value);
                        setShowMoNoDropdown(true);
                      }}
                      onFocus={() => {
                        fetchFilterOptions(filters);
                        setShowMoNoDropdown(true);
                      }}
                      placeholder={t("cutting.search_mono")}
                      className="w-full p-4 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                    />
                    <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    {showMoNoDropdown && moNoOptions.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                        {moNoOptions.map((option) => (
                          <div
                            key={option}
                            onClick={() => {
                              handleMainFilterChange({
                                target: { name: "moNo", value: option }
                              });
                              setMoNoSearch(option);
                              setShowMoNoDropdown(false);
                            }}
                            className="p-4 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{option}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div ref={tableNoDropdownRef} className="relative space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Activity size={16} className="text-blue-500 dark:text-blue-400" />
                    {t("cutting.tableNo")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="tableNo"
                      value={tableNoSearch}
                      onChange={(e) => {
                        setTableNoSearch(e.target.value);
                        setShowTableNoDropdown(true);
                      }}
                      onFocus={() => {
                        fetchFilterOptions(filters);
                        setShowTableNoDropdown(true);
                      }}
                      placeholder={t("cutting.search_table_no")}
                      className={`w-full p-4 pl-12 border-2 rounded-xl shadow-sm focus:ring-4 transition-all duration-200 font-medium ${
                        !filters.moNo 
                          ? "bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-500 cursor-not-allowed text-gray-500 dark:text-gray-400" 
                          : "border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      }`}
                      disabled={!filters.moNo}
                    />
                    <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    {showTableNoDropdown && tableNoOptions.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                        {tableNoOptions.map((option) => (
                          <div
                            key={option}
                            onClick={() => {
                              handleMainFilterChange({
                                target: { name: "tableNo", value: option }
                              });
                              setTableNoSearch(option);
                              setShowTableNoDropdown(false);
                            }}
                            className="p-4 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{option}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div ref={buyerDropdownRef} className="relative space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Users size={16} className="text-blue-500 dark:text-blue-400" />
                    {t("cutting.buyer")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="buyer"
                      value={buyerSearch}
                      onChange={(e) => {
                        setBuyerSearch(e.target.value);
                        setShowBuyerDropdown(true);
                      }}
                      onFocus={() => {
                        fetchFilterOptions(filters);
                        setShowBuyerDropdown(true);
                      }}
                      placeholder={t("cutting.search_buyer", "Search Buyer")}
                      className="w-full p-4 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                    />
                    <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    {showBuyerDropdown && buyerOptions.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                        {buyerOptions.map((option) => (
                          <div
                            key={option}
                            onClick={() => {
                              handleMainFilterChange({
                                target: { name: "buyer", value: option }
                              });
                              setBuyerSearch(option);
                              setShowBuyerDropdown(false);
                            }}
                            className="p-4 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{option}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                <button
                  onClick={applyMainFilters}
                  className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold transform hover:scale-105"
                  disabled={loading.main}
                >
                  {loading.main ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Filter size={20} className="group-hover:scale-110 transition-transform duration-300" />
                  )}
                  <span>{t("common.applyFilters")}</span>
                </button>

                <button
                  onClick={clearMainFilters}
                  className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-900 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold transform hover:scale-105"
                  disabled={loading.main}
                >
                  <XCircle size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span>{t("common.clearFilters")}</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Inspections</p>
                  <p className="text-3xl font-bold">{statistics.totalInspections.toLocaleString()}</p>
                </div>
                <Eye size={32} className="text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Bundle Quantity</p>
                  <p className="text-3xl font-bold">{statistics.totalBundleQty.toLocaleString()}</p>
                </div>
                <Package size={32} className="text-indigo-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Inspected Qty</p>
                  <p className="text-3xl font-bold">{statistics.totalInspectedQty.toLocaleString()}</p>
                </div>
                <Activity size={32} className="text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Avg Pass Rate</p>
                  <p className="text-3xl font-bold">{statistics.avgPassRate}%</p>
                </div>
                <Target size={32} className="text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">AQL Summary</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={16} className="text-green-300" />
                      <span className="text-sm font-semibold">{statistics.aqlSummary.pass}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle size={16} className="text-red-300" />
                      <span className="text-sm font-semibold">{statistics.aqlSummary.reject}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} className="text-yellow-300" />
                      <span className="text-sm font-semibold">{statistics.aqlSummary.pending}</span>
                    </div>
                  </div>
                </div>
                <BarChart3 size={32} className="text-amber-200" />
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Garment Type Analysis Table */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl">
                <BarChart3 size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("cutting.garmentTypeTrendAnalysis")}</h2>
                {appliedFiltersString && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{appliedFiltersString}</p>
                )}
              </div>
            </div>
            <AQLIconLegend />
          </div>
          
          <div className="overflow-x-auto">
            <TrendTable
              title=""
              headers={[
                {
                  label: t("cutting.panel"),
                  sticky: true,
                  left: "0",
                  className: "w-28 min-w-[7rem]"
                },
                {
                  label: t("cutting.noOfInspections"),
                  className: "w-16 text-center min-w-[4rem]"
                },
                {
                  label: t("cutting.totalBundleQty"),
                  className: "w-20 text-center min-w-[5rem]"
                },
                {
                  label: t("cutting.bundleQtyCheck"),
                  className: "w-20 text-center min-w-[5rem]"
                },
                {
                  label: t("cutting.totalInspectionQty"),
                  className: "w-20 text-center min-w-[5rem]"
                },
                {
                  label: t("cutting.totalPcs"),
                  className: "w-24 text-center min-w-[6rem]"
                },
                {
                  label: t("cutting.totalPass"),
                  className: "w-24 text-center min-w-[6rem]"
                },
                {
                  label: t("cutting.reject"),
                  className: "w-24 text-center min-w-[6rem]"
                },
                {
                  label: t("cutting.rejectMeasurements"),
                  className: "w-28 text-center min-w-[7rem]"
                },
                {
                  label: t("cutting.rejectDefects"),
                  className: "w-28 text-center min-w-[7rem]"
                },
                {
                  label: t("cutting.passRate"),
                  className: "w-24 text-center min-w-[6rem]"
                },
                {
                  label: t("cutting.aqlResults"),
                  className: "w-48 text-center min-w-[12rem]"
                }
              ]}
              data={garmentTypeData}
              renderRow={(item, index) => {
                const totalPcsAll =
                  (item.totalPcs?.top || 0) +
                  (item.totalPcs?.middle || 0) +
                  (item.totalPcs?.bottom || 0);
                const totalPassAll =
                  (item.totalPass?.top || 0) +
                  (item.totalPass?.middle || 0) +
                  (item.totalPass?.bottom || 0);
                const totalRejectAll =
                  (item.totalReject?.top || 0) +
                  (item.totalReject?.middle || 0) +
                  (item.totalReject?.bottom || 0);
                const totalRejectMeasAll =
                  (item.totalRejectMeasurements?.top || 0) +
                  (item.totalRejectMeasurements?.middle || 0) +
                  (item.totalRejectMeasurements?.bottom || 0);
                const totalRejectDefAll =
                  (item.totalRejectDefects?.top || 0) +
                  (item.totalRejectDefects?.middle || 0) +
                  (item.totalRejectDefects?.bottom || 0);

                const overallPassRate =
                  item.passRate?.overall !== undefined
                    ? item.passRate.overall.toFixed(2)
                    : "0.00";

                const aqlSummary = item.aqlSummary || {
                  pass: 0,
                  reject: 0,
                  pending: 0
                };

                const totalAQLInspections = item.noOfInspections || 0;
                const aqlPassRate =
                  totalAQLInspections > 0
                    ? ((aqlSummary.pass / totalAQLInspections) * 100).toFixed(2)
                    : "0.00";

                return (
                  <React.Fragment key={index}>
                    <tr className={`${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200`}>
                      <td
                        className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-600 sticky left-0 bg-inherit z-10 align-top font-semibold text-gray-900 dark:text-gray-100"
                        rowSpan={2}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          {getLocalizedText(
                            item.garmentType,
                            item.garmentType,
                            item.garmentType
                          )}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600 align-top font-semibold text-gray-900 dark:text-gray-100"
                        rowSpan={2}
                      >
                        <div className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-lg text-blue-800 dark:text-blue-400">
                          {item.noOfInspections}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600 align-top font-semibold text-gray-900 dark:text-gray-100"
                        rowSpan={2}
                      >
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-lg text-indigo-800 dark:text-indigo-400">
                          {item.totalBundleQty}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600 align-top font-semibold text-gray-900 dark:text-gray-100"
                        rowSpan={2}
                      >
                        <div className="bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-lg text-purple-800 dark:text-purple-400">
                          {item.bundleQtyCheck}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600 align-top font-semibold text-gray-900 dark:text-gray-100"
                        rowSpan={2}
                      >
                        <div className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-lg text-green-800 dark:text-green-400">
                          {item.totalInspectedQty}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600 font-bold text-gray-900 dark:text-gray-100">
                        {totalPcsAll.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600 font-bold text-green-600 dark:text-green-400">
                        {totalPassAll.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600 font-bold text-red-600 dark:text-red-400">
                        {totalRejectAll.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600 font-bold text-orange-600 dark:text-orange-400">
                        {totalRejectMeasAll.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600 font-bold text-purple-600 dark:text-purple-400">
                        {totalRejectDefAll.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                              style={{ width: `${Math.min(overallPassRate || 0, 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {overallPassRate}%
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-left border-r border-gray-200 dark:border-gray-600 align-top"
                        rowSpan={2}
                      >
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <FileText size={12} className="text-slate-500 dark:text-slate-400" />
                              <span className="font-medium">Total:</span>
                            </div>
                            <span className="font-bold text-gray-900 dark:text-gray-100">
                              {totalAQLInspections}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              <ShieldCheck size={12} className="text-green-500" />
                              <span className="font-medium">Pass:</span>
                            </div>
                            <span className={`font-bold ${
                              aqlSummary.pass > 0 ? "text-green-600 dark:text-green-400" : "text-gray-400"
                            }`}>
                              {aqlSummary.pass}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              <ShieldX size={12} className="text-red-500" />
                              <span className="font-medium">Fail:</span>
                            </div>
                            <span className={`font-bold ${
                              aqlSummary.reject > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400"
                            }`}>
                              {aqlSummary.reject}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              <ShieldAlert size={12} className="text-gray-500" />
                              <span className="font-medium">Pending:</span>
                            </div>
                            <span className={`font-bold ${
                              aqlSummary.pending > 0 ? "text-gray-600 dark:text-gray-400" : "text-gray-400"
                            }`}>
                              {aqlSummary.pending}
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">AQL Pass Rate:</span>
                              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{aqlPassRate}%</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr
                      className={`${
                        index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"
                      } text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200`}
                    >
                      <td className="px-4 py-2 text-center border-r border-gray-200 dark:border-gray-600">
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="font-medium">T:</span>{item.totalPcs?.top || 0}
                          </div>
                          <div className="text-xs">
                            <span className="font-medium">M:</span>{item.totalPcs?.middle || 0}
                          </div>
                          <div className="text-xs">
                            <span className="font-medium">B:</span>{item.totalPcs?.bottom || 0}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center border-r border-gray-200 dark:border-gray-600">
                        <div className="space-y-1">
                          <div className="text-xs text-green-600 dark:text-green-400">
                            <span className="font-medium">T:</span>{item.totalPass?.top || 0}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            <span className="font-medium">M:</span>{item.totalPass?.middle || 0}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            <span className="font-medium">B:</span>{item.totalPass?.bottom || 0}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center border-r border-gray-200 dark:border-gray-600">
                        <div className="space-y-1">
                          <div className="text-xs text-red-600 dark:text-red-400">
                            <span className="font-medium">T:</span>{item.totalReject?.top || 0}
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-400">
                            <span className="font-medium">M:</span>{item.totalReject?.middle || 0}
                          </div>
                                                    <div className="text-xs text-red-600 dark:text-red-400">
                            <span className="font-medium">B:</span>{item.totalReject?.bottom || 0}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center border-r border-gray-200 dark:border-gray-600">
                        <div className="space-y-1">
                          <div className="text-xs text-orange-600 dark:text-orange-400">
                            <span className="font-medium">T:</span>{item.totalRejectMeasurements?.top || 0}
                          </div>
                          <div className="text-xs text-orange-600 dark:text-orange-400">
                            <span className="font-medium">M:</span>{item.totalRejectMeasurements?.middle || 0}
                          </div>
                          <div className="text-xs text-orange-600 dark:text-orange-400">
                            <span className="font-medium">B:</span>{item.totalRejectMeasurements?.bottom || 0}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center border-r border-gray-200 dark:border-gray-600">
                        <div className="space-y-1">
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            <span className="font-medium">T:</span>{item.totalRejectDefects?.top || 0}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            <span className="font-medium">M:</span>{item.totalRejectDefects?.middle || 0}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            <span className="font-medium">B:</span>{item.totalRejectDefects?.bottom || 0}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center border-r border-gray-200 dark:border-gray-600">
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="font-medium">T:</span>{(item.passRate?.top || 0).toFixed(2)}%
                          </div>
                          <div className="text-xs">
                            <span className="font-medium">M:</span>{(item.passRate?.middle || 0).toFixed(2)}%
                          </div>
                          <div className="text-xs">
                            <span className="font-medium">B:</span>{(item.passRate?.bottom || 0).toFixed(2)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              }}
              appliedFiltersText=""
              titleIcon={BarChart3}
              loading={loading.main}
            />
          </div>
        </div>

        {/* Enhanced Sub-Trend Filters */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 dark:border-blue-700/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl">
              <Settings size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">
                {t("cutting.filterForSubTrends", "Filter For Measurement & Defect Trends")}
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Refine your analysis by selecting specific garment types and part names
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Package size={16} className="text-blue-500 dark:text-blue-400" />
                {t("cutting.panel")}
              </label>
              <select
                value={trendGarmentTypeFilter}
                onChange={(e) => {
                  setTrendGarmentTypeFilter(e.target.value);
                  setTrendPartNameFilter("");
                }}
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
              >
                <option value="">{t("common.all")}</option>
                {garmentTypeOptionsForTrend.map((gt) => (
                  <option key={gt} value={gt}>
                    {getLocalizedText(gt, gt, gt)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Activity size={16} className="text-blue-500 dark:text-blue-400" />
                {t("cutting.partNameFilter")}
              </label>
              <select
                value={trendPartNameFilter}
                onChange={(e) => setTrendPartNameFilter(e.target.value)}
                className={`w-full p-4 border-2 rounded-xl shadow-sm focus:ring-4 transition-all duration-200 font-medium ${
                  !trendGarmentTypeFilter || loading.partNameOptions
                    ? "bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-500 cursor-not-allowed text-gray-500 dark:text-gray-400"
                    : "border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                }`}
                disabled={!trendGarmentTypeFilter || loading.partNameOptions}
              >
                <option value="">{t("common.all")}</option>
                {partNameOptionsForTrend.map((pn) => (
                  <option key={pn} value={pn}>
                    {getLocalizedText(pn, pn, pn)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  fetchMeasurementPointTrend(filters, trendGarmentTypeFilter, trendPartNameFilter);
                  fetchFabricDefectTrend(filters, trendGarmentTypeFilter, trendPartNameFilter);
                  fetchTopIssuesData(filters, trendGarmentTypeFilter);
                }}
                className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold transform hover:scale-105"
                disabled={loading.measurementTrend || loading.fabricTrend || loading.topIssues}
              >
                {(loading.measurementTrend || loading.fabricTrend || loading.topIssues) ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-300" />
                )}
                <span>Update Trends</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Measurement Points Trend Table */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("cutting.measurementPointsTrendAnalysis")}</h2>
                {(appliedFiltersString || trendGarmentTypeFilter || trendPartNameFilter) && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {appliedFiltersString}
                    {trendGarmentTypeFilter && `, ${t("cutting.panel")}: ${getLocalizedText(trendGarmentTypeFilter, trendGarmentTypeFilter, trendGarmentTypeFilter)}`}
                    {trendPartNameFilter && `, ${t("cutting.partNameFilter")}: ${getLocalizedText(trendPartNameFilter, trendPartNameFilter, trendPartNameFilter)}`}
                  </p>
                )}
              </div>
            </div>
            <MeasurementTrendIconLegend />
          </div>
          
          <div className="overflow-x-auto">
            <TrendTable
              title=""
              headers={[
                {
                  label: t("cutting.panel"),
                  sticky: true,
                  left: "0",
                  className: "w-20 min-w-[5rem]"
                },
                {
                  label: t("cutting.partNameFilter"),
                  sticky: true,
                  left: "5rem",
                  className: "w-24 min-w-[6rem]"
                },
                {
                  label: t("cutting.measurementPoint"),
                  sticky: true,
                  left: "11rem",
                  className: "w-36 min-w-[9rem] whitespace-normal break-words"
                },
                ...(measurementPointTrendData.headers || []).map((date) => ({
                  label: date,
                  className: "text-center min-w-[130px]"
                }))
              ]}
              data={measurementPointTrendData.data || []}
              renderRow={(item, index, arr) => {
                let showGarmentType =
                  index === 0 || item.garmentType !== arr[index - 1].garmentType;
                let garmentTypeRowSpan = 0;
                if (showGarmentType) {
                  garmentTypeRowSpan = arr.filter(
                    (d) => d.garmentType === item.garmentType
                  ).length;
                }

                let showPartName =
                  index === 0 ||
                  item.partName !== arr[index - 1].partName ||
                  item.garmentType !== arr[index - 1].garmentType;
                let partNameRowSpan = 0;
                if (showPartName) {
                  partNameRowSpan = arr.filter(
                    (d) =>
                      d.garmentType === item.garmentType &&
                      d.partName === item.partName
                  ).length;
                }

                return (
                  <tr
                    key={index}
                    className={`${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200`}
                  >
                    {showGarmentType && (
                      <td
                        className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-600 sticky left-0 bg-inherit z-10 align-middle font-semibold text-gray-900 dark:text-gray-100"
                        rowSpan={garmentTypeRowSpan}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {getLocalizedText(
                            item.garmentType,
                            item.garmentType,
                            item.garmentType
                          )}
                        </div>
                      </td>
                    )}
                    {showPartName && (
                      <td
                        className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-600 sticky left-[5rem] bg-inherit z-10 align-middle font-medium text-gray-900 dark:text-gray-100"
                        rowSpan={partNameRowSpan}
                      >
                        {getLocalizedText(
                          item.partName,
                          item.partName,
                          item.partName
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-normal break-words border-r border-gray-200 dark:border-gray-600 sticky left-[11rem] bg-inherit z-10 align-middle text-sm text-gray-900 dark:text-gray-100">
                      {getLocalizedText(
                        item.measurementPoint,
                        item.measurementPoint,
                        item.measurementPoint
                      )}
                    </td>
                    {(measurementPointTrendData.headers || []).map((date) => {
                      const passRate = item.values[date]?.passRate || 0;
                      let bgColorClass = "";
                      if (passRate < 90) bgColorClass = "bg-red-100 dark:bg-red-900/30";
                      else if (passRate >= 90 && passRate <= 98)
                        bgColorClass = "bg-yellow-100 dark:bg-yellow-900/30";
                      else if (passRate > 98) bgColorClass = "bg-green-100 dark:bg-green-900/30";

                      return (
                        <td
                          key={date}
                          className={`px-2 py-3 text-center border-r border-gray-200 dark:border-gray-600 text-xs align-middle ${bgColorClass}`}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-center items-center gap-3">
                              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg shadow-sm">
                                <Check size={10} className="text-green-600" />
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  {item.values[date]?.withinTol || 0}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg shadow-sm">
                                <TrendingDown size={10} className="text-red-600" />
                                <span className="font-semibold text-red-600 dark:text-red-400">
                                  {item.values[date]?.outOfTolNeg || 0}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg shadow-sm">
                                <TrendingUp size={10} className="text-orange-500" />
                                <span className="font-semibold text-orange-500 dark:text-orange-400">
                                  {item.values[date]?.outOfTolPos || 0}
                                </span>
                              </div>
                            </div>
                            <div className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                              <span className="font-bold text-blue-700 dark:text-blue-400">
                                {passRate.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              }}
              appliedFiltersText=""
              titleIcon={TrendingUp}
              loading={loading.measurementTrend}
            />
          </div>
        </div>

        {/* Enhanced Fabric Defect Trend Table */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 rounded-xl">
                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("cutting.fabricDefectTrendChart")}</h2>
                {(appliedFiltersString || trendGarmentTypeFilter || trendPartNameFilter) && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {appliedFiltersString}
                    {trendGarmentTypeFilter && `, ${t("cutting.panel")}: ${getLocalizedText(trendGarmentTypeFilter, trendGarmentTypeFilter, trendGarmentTypeFilter)}`}
                    {trendPartNameFilter && `, ${t("cutting.partNameFilter")}: ${getLocalizedText(trendPartNameFilter, trendPartNameFilter, trendPartNameFilter)}`}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <TrendTable
              title=""
              headers={[
                {
                  label: t("cutting.panel"),
                  sticky: true,
                  left: "0",
                  className: "w-20 min-w-[5rem]"
                },
                {
                  label: t("cutting.partNameFilter"),
                  sticky: true,
                  left: "5rem",
                  className: "w-36 min-w-[9rem] whitespace-normal break-words"
                },
                ...(fabricDefectTrendData.headers || []).map((date) => ({
                  label: date,
                  className: "text-center min-w-[100px]"
                }))
              ]}
              data={fabricDefectTrendData.data || []}
              renderRow={(item, index, arr) => {
                let showGarmentType =
                  index === 0 || item.garmentType !== arr[index - 1].garmentType;
                let garmentTypeRowSpan = 0;
                if (showGarmentType) {
                  garmentTypeRowSpan = arr.filter(
                    (d) => d.garmentType === item.garmentType
                  ).length;
                }

                return (
                  <tr
                    key={index}
                    className={`${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"} hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200`}
                  >
                    {showGarmentType && (
                      <td
                        className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-600 sticky left-0 bg-inherit z-10 align-middle font-semibold text-gray-900 dark:text-gray-100"
                        rowSpan={garmentTypeRowSpan}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          {getLocalizedText(
                            item.garmentType,
                            item.garmentType,
                            item.garmentType
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-normal break-words border-r border-gray-200 dark:border-gray-600 sticky left-[5rem] bg-inherit z-10 align-middle font-medium text-gray-900 dark:text-gray-100">
                      {getLocalizedText(
                        item.partName,
                        item.partName,
                        item.partName
                      )}
                    </td>
                    {(fabricDefectTrendData.headers || []).map((date) => {
                      const defectCount = item.values[date]?.rejectCount || 0;
                      const defectRate = item.values[date]?.defectRate || 0;
                      let defectBgColorClass = "";
                      if (defectRate > 1) defectBgColorClass = "bg-red-100 dark:bg-red-900/30";
                      else if (defectRate >= 0.5 && defectRate <= 1)
                        defectBgColorClass = "bg-yellow-100 dark:bg-yellow-900/30";
                      else if (defectRate < 0.5)
                        defectBgColorClass = "bg-green-100 dark:bg-green-900/30";

                      return (
                        <td
                          key={date}
                          className={`px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600 align-middle ${defectBgColorClass}`}
                        >
                          <div className="space-y-2">
                            <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm">
                              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {defectCount}
                              </div>
                            </div>
                            <div className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-lg">
                              <span className="text-sm font-bold text-red-700 dark:text-red-400">
                                {defectRate.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              }}
              appliedFiltersText=""
              titleIcon={AlertTriangle}
              loading={loading.fabricTrend}
            />
          </div>
        </div>

        {/* Enhanced Top Issues Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Measurement Issues */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl">
                  <TrendingDown size={24} className="text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("cutting.topMeasurementIssues")}</h2>
                  {(appliedFiltersString || trendGarmentTypeFilter) && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {appliedFiltersString}
                      {trendGarmentTypeFilter && `, ${t("cutting.panel")}: ${getLocalizedText(trendGarmentTypeFilter, trendGarmentTypeFilter, trendGarmentTypeFilter)}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <TrendTable
                title=""
                headers={[
                  {
                    label: t("cutting.measurementPoint"),
                    className: "whitespace-normal break-words min-w-[10rem]"
                  },
                  {
                    label: t("cutting.passPoints"),
                    className: "text-center min-w-[5rem]"
                  },
                  {
                    label: t("cutting.rejectTolNegPoints"),
                    className: "text-center min-w-[6rem]"
                  },
                  {
                    label: t("cutting.rejectTolPosPoints"),
                    className: "text-center min-w-[6rem]"
                  },
                  {
                    label: t("cutting.issuePercentage"),
                    className: "text-center min-w-[6rem]"
                  }
                ]}
                data={topMeasurementIssues}
                renderRow={(item, index) => (
                  <tr
                    key={index}
                    className={`${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"} hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200`}
                  >
                    <td className="px-4 py-3 whitespace-normal break-words border-r border-gray-200 dark:border-gray-600 font-medium text-gray-900 dark:text-gray-100">
                      {getLocalizedText(
                        item.measurementPoint,
                        item.measurementPoint,
                        item.measurementPoint
                      )}
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600">
                      <div className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-lg">
                        <span className="font-bold text-green-700 dark:text-green-400">
                          {item.passPoints}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600">
                      <div className="bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-lg">
                        <span className="font-bold text-red-700 dark:text-red-400">
                          {item.rejectTolNegPoints}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600">
                      <div className="bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-lg">
                        <span className="font-bold text-orange-700 dark:text-orange-400">
                          {item.rejectTolPosPoints}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600">
                      <div className="bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-lg">
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                          {item.issuePercentage.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
                appliedFiltersText=""
                titleIcon={TrendingDown}
                loading={loading.topIssues || loading.main}
              />
            </div>
          </div>

          {/* Top Defect Issues */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 rounded-xl">
                  <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("cutting.topDefectIssues")}</h2>
                  {(appliedFiltersString || trendGarmentTypeFilter) && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {appliedFiltersString}
                      {trendGarmentTypeFilter && `, ${t("cutting.panel")}: ${getLocalizedText(trendGarmentTypeFilter, trendGarmentTypeFilter, trendGarmentTypeFilter)}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <TrendTable
                title=""
                headers={[
                  { label: t("cutting.defectName"), className: "min-w-[10rem]" },
                  {
                    label: t("cutting.defectQty"),
                    className: "text-center min-w-[5rem]"
                                      },
                  {
                    label: t("cutting.defectRate"),
                    className: "text-center min-w-[5rem]"
                  }
                ]}
                data={topDefectIssues}
                renderRow={(item, index) => (
                  <tr
                    key={index}
                    className={`${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"} hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-600 font-medium text-gray-900 dark:text-gray-100">
                      {getLocalizedText(
                        item.defectName,
                        item.defectNameKhmer,
                        item.defectNameChinese
                      )}
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600">
                      <div className="bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-lg">
                        <span className="font-bold text-red-700 dark:text-red-400">
                          {item.defectQty}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600">
                      <div className="bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-lg">
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                          {item.defectRate.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
                appliedFiltersText=""
                titleIcon={AlertTriangle}
                loading={loading.topIssues || loading.main}
              />
            </div>
          </div>
        </div>

        {/* Loading States for Empty Data */}
        {loading.main && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-16">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
                <Loader2 className="absolute inset-0 w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <p className="text-xl font-semibold text-gray-600 dark:text-gray-400 mt-6">Loading Trend Analysis...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Please wait while we process your data</p>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading.main && garmentTypeData.length === 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-16">
            <div className="text-center">
              <div className="p-6 bg-gray-100 dark:bg-gray-700/50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <BarChart3 size={48} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No Trend Data Found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">
                No data available for the selected filters. Try adjusting your date range or clearing filters.
              </p>
              <button
                onClick={clearMainFilters}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
              >
                Clear Filters & Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CuttingGarmentTypeTrendAnalysis;



