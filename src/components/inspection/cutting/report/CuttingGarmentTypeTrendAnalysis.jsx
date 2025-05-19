// src/components/inspection/cutting/report/CuttingGarmentTypeTrendAnalysis.jsx
import axios from "axios";
import {
  AlertTriangle,
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
  XCircle
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

const CuttingGarmentTypeTrendAnalysis = () => {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFiltersString, setAppliedFiltersString] = useState("");

  const [loading, setLoading] = useState({
    main: false,
    measurementTrend: false,
    fabricTrend: false,
    filterOptions: false,
    partNameOptions: false,
    topIssues: false // Added loading state for top issues
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
  const [garmentTypeOptionsForTrend, setGarmentTypeOptionsForTrend] = useState(
    []
  );
  const [partNameOptionsForTrend, setPartNameOptionsForTrend] = useState([]);

  const getLocalizedText = (eng, khmer, chinese) => {
    if (i18n.language === "km" && khmer) return khmer;
    if (i18n.language === "zh" && chinese) return chinese;
    return eng || "";
  };

  const getAQLResultStatusInternal = (
    totalInspectionQtyTarget,
    sumTotalReject,
    totalPcsInspectedForAQL
  ) => {
    if (
      !totalInspectionQtyTarget ||
      totalPcsInspectedForAQL < totalInspectionQtyTarget
    ) {
      return {
        key: "pending",
        text: t("common.pending"),
        Icon: ShieldAlert,
        color: "text-gray-500"
      };
    }
    if (totalInspectionQtyTarget >= 30 && totalInspectionQtyTarget < 45) {
      return sumTotalReject > 0
        ? {
            key: "reject",
            text: t("common.fail"),
            Icon: ShieldX,
            color: "text-red-600"
          }
        : {
            key: "pass",
            text: t("common.pass"),
            Icon: ShieldCheck,
            color: "text-green-600"
          };
    }
    if (totalInspectionQtyTarget >= 45 && totalInspectionQtyTarget < 60) {
      return sumTotalReject > 0
        ? {
            key: "reject",
            text: t("common.fail"),
            Icon: ShieldX,
            color: "text-red-600"
          }
        : {
            key: "pass",
            text: t("common.pass"),
            Icon: ShieldCheck,
            color: "text-green-600"
          };
    }
    if (totalInspectionQtyTarget >= 60 && totalInspectionQtyTarget < 90) {
      return sumTotalReject > 1
        ? {
            key: "reject",
            text: t("common.fail"),
            Icon: ShieldX,
            color: "text-red-600"
          }
        : {
            key: "pass",
            text: t("common.pass"),
            Icon: ShieldCheck,
            color: "text-green-600"
          };
    }
    if (totalInspectionQtyTarget >= 90 && totalInspectionQtyTarget < 135) {
      return sumTotalReject > 2
        ? {
            key: "reject",
            text: t("common.fail"),
            Icon: ShieldX,
            color: "text-red-600"
          }
        : {
            key: "pass",
            text: t("common.pass"),
            Icon: ShieldCheck,
            color: "text-green-600"
          };
    }
    if (totalInspectionQtyTarget >= 135 && totalInspectionQtyTarget < 210) {
      return sumTotalReject > 3
        ? {
            key: "reject",
            text: t("common.fail"),
            Icon: ShieldX,
            color: "text-red-600"
          }
        : {
            key: "pass",
            text: t("common.pass"),
            Icon: ShieldCheck,
            color: "text-green-600"
          };
    }
    if (totalInspectionQtyTarget >= 210 && totalInspectionQtyTarget < 315) {
      return sumTotalReject > 5
        ? {
            key: "reject",
            text: t("common.fail"),
            Icon: ShieldX,
            color: "text-red-600"
          }
        : {
            key: "pass",
            text: t("common.pass"),
            Icon: ShieldCheck,
            color: "text-green-600"
          };
    }
    if (totalInspectionQtyTarget >= 315) {
      return sumTotalReject > 7
        ? {
            key: "reject",
            text: t("common.fail"),
            Icon: ShieldX,
            color: "text-red-600"
          }
        : {
            key: "pass",
            text: t("common.pass"),
            Icon: ShieldCheck,
            color: "text-green-600"
          };
    }
    return {
      key: "pending",
      text: t("common.pending"),
      Icon: ShieldAlert,
      color: "text-gray-500"
    };
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

  // Function to fetch top issues data
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
        // Fetch Garment Type Data
        const garmentTypeRes = await axios.get(
          `${API_BASE_URL}/api/cutting/trend/garment-type`,
          {
            params,
            withCredentials: true
          }
        );
        setGarmentTypeData(garmentTypeRes.data);

        // Fetch Top Issues data (will use the current trendGarmentTypeFilter from state)
        // This ensures top issues are fetched with the correct garment type filter during main data load
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
      trendGarmentTypeFilter, // Added to ensure fetchData updates if this changes (for top issues)
      trendPartNameFilter,
      fetchMeasurementPointTrend,
      fetchFabricDefectTrend,
      fetchTopIssuesData // Added fetchTopIssuesData as a dependency
    ]
  );

  useEffect(() => {
    fetchData(filters, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial fetch only

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

  // useEffect to update Top Issues when trendGarmentTypeFilter or main filters change,
  // ensuring it runs after main data load/filter applications are complete.
  useEffect(() => {
    // The `loading.main` check ensures this primarily handles changes to `trendGarmentTypeFilter`
    // after `fetchData` has completed its run (e.g., on initial load or main filter apply).
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
    <div className="text-xxs text-gray-500 mt-1 mb-2 p-1.5 border rounded-md bg-gray-50 flex flex-wrap gap-x-3 gap-y-0.5 items-center">
      <span className="font-semibold">{t("common.legend")}:</span>
      <span className="flex items-center">
        <FileText size={11} className="mr-0.5 text-slate-500" />{" "}
        {t("common.totalSamplesShort", "Total")}
      </span>
      <span className="flex items-center">
        <ShieldCheck size={11} className="mr-0.5 text-green-500" />{" "}
        {t("common.pass")}
      </span>
      <span className="flex items-center">
        <ShieldX size={11} className="mr-0.5 text-red-500" /> {t("common.fail")}
      </span>
      <span className="flex items-center">
        <ShieldAlert size={11} className="mr-0.5 text-gray-500" />{" "}
        {t("common.pending")}
      </span>
    </div>
  );

  // UPDATED Legend for Measurement Trend Table
  const MeasurementTrendIconLegend = () => (
    <div className="text-xxs text-gray-500 mt-1 mb-2 p-1.5 border rounded-md bg-gray-50 flex flex-wrap gap-x-3 gap-y-0.5 items-center">
      <span className="font-semibold">{t("common.legend")}:</span>
      <span className="flex items-center">
        <Check size={11} className="mr-0.5 text-green-600" />{" "}
        {t(
          "cutting.totalCountWithinTolerancePoints",
          "Total Count of Within Tol. Points"
        )}
      </span>
      <span className="flex items-center">
        <TrendingDown size={11} className="mr-0.5 text-red-600" />{" "}
        {t("cutting.totalNegTolerancePoints", "Total Neg. Tol. Points")}
      </span>
      <span className="flex items-center">
        <TrendingUp size={11} className="mr-0.5 text-orange-500" />{" "}
        {t("cutting.totalPosTolerancePoints", "Total Pos. Tol. Points")}
      </span>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      <div className="max-w-full mx-auto">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 text-center">
            {t("cutting.trendAnalysisTitle")}
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            {t(
              "cutting.trendAnalysisSubtitle",
              "Analyze cutting inspection trends over time and across various dimensions."
            )}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 mb-4 p-3 border border-gray-200 rounded-lg items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                {t("common.startDate")}
              </label>
              <DatePicker
                selected={filters.startDate}
                onChange={(date) => handleDateChange("startDate", date)}
                dateFormat="MM/dd/yyyy"
                className="mt-1 w-full p-1.5 border border-gray-300 rounded-md shadow-sm text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                {t("common.endDate")}
              </label>
              <DatePicker
                selected={filters.endDate}
                onChange={(date) => handleDateChange("endDate", date)}
                dateFormat="MM/dd/yyyy"
                minDate={filters.startDate}
                className="mt-1 w-full p-1.5 border border-gray-300 rounded-md shadow-sm text-xs"
                isClearable
              />
            </div>
            <div ref={moNoDropdownRef} className="relative">
              <label className="block text-xs font-medium text-gray-700">
                {t("cutting.moNo")}
              </label>
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
                className="mt-1 w-full p-1.5 border border-gray-300 rounded-md shadow-sm text-xs"
              />
              {showMoNoDropdown && moNoOptions.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {moNoOptions.map((o) => (
                    <li
                      key={o}
                      onClick={() => {
                        handleMainFilterChange({
                          target: { name: "moNo", value: o }
                        });
                        setMoNoSearch(o);
                        setShowMoNoDropdown(false);
                      }}
                      className="p-1.5 hover:bg-blue-50 cursor-pointer text-xs"
                    >
                      {o}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div ref={tableNoDropdownRef} className="relative">
              <label className="block text-xs font-medium text-gray-700">
                {t("cutting.tableNo")}
              </label>
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
                className={`mt-1 w-full p-1.5 border border-gray-300 rounded-md shadow-sm text-xs ${
                  !filters.moNo ? "bg-gray-50 cursor-not-allowed" : ""
                }`}
                disabled={!filters.moNo}
              />
              {showTableNoDropdown && tableNoOptions.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {tableNoOptions.map((o) => (
                    <li
                      key={o}
                      onClick={() => {
                        handleMainFilterChange({
                          target: { name: "tableNo", value: o }
                        });
                        setTableNoSearch(o);
                        setShowTableNoDropdown(false);
                      }}
                      className="p-1.5 hover:bg-blue-50 cursor-pointer text-xs"
                    >
                      {o}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div ref={buyerDropdownRef} className="relative">
              <label className="block text-xs font-medium text-gray-700">
                {t("cutting.buyer")}
              </label>
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
                className="mt-1 w-full p-1.5 border border-gray-300 rounded-md shadow-sm text-xs"
              />
              {showBuyerDropdown && buyerOptions.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {buyerOptions.map((o) => (
                    <li
                      key={o}
                      onClick={() => {
                        handleMainFilterChange({
                          target: { name: "buyer", value: o }
                        });
                        setBuyerSearch(o);
                        setShowBuyerDropdown(false);
                      }}
                      className="p-1.5 hover:bg-blue-50 cursor-pointer text-xs"
                    >
                      {o}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={applyMainFilters}
              className="h-9 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center shadow-sm text-xs"
              disabled={loading.main}
            >
              {loading.main ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Filter size={14} />
              )}
              <span className="ml-1.5">{t("common.applyFilters")}</span>
            </button>
            <button
              onClick={clearMainFilters}
              className="h-9 px-3 py-1.5 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 flex items-center justify-center shadow-sm text-xs"
              disabled={loading.main}
            >
              <XCircle size={14} />
              <span className="ml-1.5">{t("common.clearFilters")}</span>
            </button>
          </div>
        </div>

        {/* Added overflow-x-auto wrapper for horizontal scrolling */}
        <div className="overflow-x-auto mb-6">
          <TrendTable
            title={t("cutting.garmentTypeTrendAnalysis")}
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
                  <tr className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td
                      className="px-2 py-1 whitespace-nowrap border-r sticky left-0 bg-inherit z-5 align-top"
                      rowSpan={2}
                    >
                      {getLocalizedText(
                        item.garmentType,
                        item.garmentType,
                        item.garmentType
                      )}
                    </td>
                    <td
                      className="px-2 py-1 text-center border-r align-top"
                      rowSpan={2}
                    >
                      {item.noOfInspections}
                    </td>
                    <td
                      className="px-2 py-1 text-center border-r align-top"
                      rowSpan={2}
                    >
                      {item.totalBundleQty}
                    </td>
                    <td
                      className="px-2 py-1 text-center border-r align-top"
                      rowSpan={2}
                    >
                      {item.bundleQtyCheck}
                    </td>
                    <td
                      className="px-2 py-1 text-center border-r align-top"
                      rowSpan={2}
                    >
                      {item.totalInspectedQty}
                    </td>
                    <td className="px-2 py-1 text-center border-r">
                      {totalPcsAll}
                    </td>
                    <td className="px-2 py-1 text-center border-r">
                      {totalPassAll}
                    </td>
                    <td className="px-2 py-1 text-center border-r">
                      {totalRejectAll}
                    </td>
                    <td className="px-2 py-1 text-center border-r">
                      {totalRejectMeasAll}
                    </td>
                    <td className="px-2 py-1 text-center border-r">
                      {totalRejectDefAll}
                    </td>
                    <td className="px-2 py-1 text-center border-r">
                      {overallPassRate}%
                    </td>
                    <td
                      className="px-2 py-1 text-left border-r align-top"
                      rowSpan={2}
                    >
                      <div className="grid grid-cols-2 gap-x-1 text-xxs items-center">
                        <div className="flex items-center">
                          <FileText
                            size={10}
                            className="text-slate-500 mr-0.5"
                          />
                          {t("common.totalSamplesShort", "Total")}:
                        </div>{" "}
                        <span className="font-semibold">
                          {totalAQLInspections}
                        </span>
                        <div className="flex items-center">
                          <ShieldCheck
                            size={10}
                            className="mr-0.5 text-green-500"
                          />
                          {t("common.pass")}:
                        </div>{" "}
                        <span
                          className={`font-semibold ${
                            aqlSummary.pass > 0
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {aqlSummary.pass}
                        </span>
                        <div className="flex items-center">
                          <ShieldX size={10} className="mr-0.5 text-red-500" />
                          {t("common.fail")}:
                        </div>{" "}
                        <span
                          className={`font-semibold ${
                            aqlSummary.reject > 0
                              ? "text-red-600"
                              : "text-gray-400"
                          }`}
                        >
                          {aqlSummary.reject}
                        </span>
                        <div className="flex items-center">
                          <ShieldAlert
                            size={10}
                            className="mr-0.5 text-gray-500"
                          />
                          {t("common.pending")}:
                        </div>{" "}
                        <span
                          className={`font-semibold ${
                            aqlSummary.pending > 0
                              ? "text-gray-600"
                              : "text-gray-400"
                          }`}
                        >
                          {aqlSummary.pending}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xxs font-semibold">
                        {t("cutting.aqlPassRate")}:{" "}
                        <span className="text-blue-600">{aqlPassRate}%</span>
                      </div>
                    </td>
                  </tr>
                  <tr
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } text-xxs text-gray-500 border-b`}
                  >
                    <td className="px-2 py-0.5 text-center border-r">
                      T:{item.totalPcs?.top || 0}, M:
                      {item.totalPcs?.middle || 0}, B:
                      {item.totalPcs?.bottom || 0}
                    </td>
                    <td className="px-2 py-0.5 text-center border-r">
                      T:{item.totalPass?.top || 0}, M:
                      {item.totalPass?.middle || 0}, B:
                      {item.totalPass?.bottom || 0}
                    </td>
                    <td className="px-2 py-0.5 text-center border-r">
                      T:{item.totalReject?.top || 0}, M:
                      {item.totalReject?.middle || 0}, B:
                      {item.totalReject?.bottom || 0}
                    </td>
                    <td className="px-2 py-0.5 text-center border-r">
                      T:{item.totalRejectMeasurements?.top || 0}, M:
                      {item.totalRejectMeasurements?.middle || 0}, B:
                      {item.totalRejectMeasurements?.bottom || 0}
                    </td>
                    <td className="px-2 py-0.5 text-center border-r">
                      T:{item.totalRejectDefects?.top || 0}, M:
                      {item.totalRejectDefects?.middle || 0}, B:
                      {item.totalRejectDefects?.bottom || 0}
                    </td>
                    <td className="px-2 py-0.5 text-center border-r">
                      T:{(item.passRate?.top || 0).toFixed(2)}%, M:
                      {(item.passRate?.middle || 0).toFixed(2)}%, B:
                      {(item.passRate?.bottom || 0).toFixed(2)}%
                    </td>
                  </tr>
                </React.Fragment>
              );
            }}
            appliedFiltersText={appliedFiltersString}
            titleIcon={BarChart3}
            loading={loading.main}
            customHeaderContent={<AQLIconLegend />}
          />
        </div>

        <div className="my-6 p-4 bg-blue-50 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-blue-700 mb-3">
            {t(
              "cutting.filterForSubTrends",
              "Filter For Measurement & Defect Trends"
            )}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                {t("cutting.panel")}
              </label>
              <select
                value={trendGarmentTypeFilter}
                onChange={(e) => {
                  setTrendGarmentTypeFilter(e.target.value);
                  setTrendPartNameFilter("");
                }}
                className="mt-1 w-full p-1.5 border border-gray-300 rounded-md shadow-sm text-xs"
              >
                <option value="">{t("common.all")}</option>
                {garmentTypeOptionsForTrend.map((gt) => (
                  <option key={gt} value={gt}>
                    {getLocalizedText(gt, gt, gt)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                {t("cutting.partNameFilter")}
              </label>
              <select
                value={trendPartNameFilter}
                onChange={(e) => setTrendPartNameFilter(e.target.value)}
                className="mt-1 w-full p-1.5 border border-gray-300 rounded-md shadow-sm text-xs"
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
          </div>
        </div>

        {/* Added overflow-x-auto wrapper for horizontal scrolling */}
        <div className="overflow-x-auto mb-6">
          <TrendTable
            title={t("cutting.measurementPointsTrendAnalysis")}
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
                left: "5rem", // Adjust if w-20 for panel changes
                className: "w-24 min-w-[6rem]"
              },
              {
                label: t("cutting.measurementPoint"),
                sticky: true,
                left: "11rem", // Adjust if previous column widths change (5rem + 6rem)
                className: "w-36 min-w-[9rem] whitespace-normal break-words" // Increased width
              },
              ...(measurementPointTrendData.headers || []).map((date) => ({
                label: date,
                className: "text-center min-w-[130px]" // Increased min-width for date cells
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
                ).length; // Adjusted: 1 row per item
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
                ).length; // Adjusted: 1 row per item
              }
              return (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  {showGarmentType && (
                    <td
                      className="px-2 py-1 whitespace-nowrap border-r sticky left-0 bg-inherit z-5 align-middle"
                      rowSpan={garmentTypeRowSpan}
                    >
                      {getLocalizedText(
                        item.garmentType,
                        item.garmentType,
                        item.garmentType
                      )}
                    </td>
                  )}
                  {showPartName && (
                    <td
                      className="px-2 py-1 whitespace-nowrap border-r sticky left-[5rem] bg-inherit z-5 align-middle"
                      rowSpan={partNameRowSpan}
                    >
                      {getLocalizedText(
                        item.partName,
                        item.partName,
                        item.partName
                      )}
                    </td>
                  )}
                  <td className="px-2 py-1 whitespace-normal break-words border-r sticky left-[11rem] bg-inherit z-5 align-middle">
                    {" "}
                    {/* Removed rowSpan */}
                    {getLocalizedText(
                      item.measurementPoint,
                      item.measurementPoint,
                      item.measurementPoint
                    )}
                  </td>
                  {(measurementPointTrendData.headers || []).map((date) => {
                    const passRate = item.values[date]?.passRate || 0;
                    let bgColorClass = "";
                    if (passRate < 90) bgColorClass = "bg-red-100";
                    else if (passRate >= 90 && passRate <= 98)
                      bgColorClass = "bg-yellow-100";
                    else if (passRate > 98) bgColorClass = "bg-green-100";

                    return (
                      <td
                        key={date}
                        className={`px-1 py-1 text-center border-r text-xxs align-middle ${bgColorClass}`}
                      >
                        <div className="flex justify-around items-center h-full space-x-1">
                          <span className="flex items-center text-green-600">
                            <Check size={9} className="mr-0.5" />
                            {item.values[date]?.withinTol || 0}
                          </span>
                          <span className="flex items-center text-red-600">
                            <TrendingDown size={9} className="mr-0.5" />
                            {item.values[date]?.outOfTolNeg || 0}
                          </span>
                          <span className="flex items-center text-orange-500">
                            <TrendingUp size={9} className="mr-0.5" />
                            {item.values[date]?.outOfTolPos || 0}
                          </span>
                        </div>
                        <div className="font-semibold text-blue-700 mt-0.5">
                          ({passRate.toFixed(2)}%)
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            }}
            appliedFiltersText={
              appliedFiltersString +
              (trendGarmentTypeFilter
                ? `, ${t("cutting.panel")}: ${getLocalizedText(
                    trendGarmentTypeFilter,
                    trendGarmentTypeFilter,
                    trendGarmentTypeFilter
                  )}`
                : "") +
              (trendPartNameFilter
                ? `, ${t("cutting.partNameFilter")}: ${getLocalizedText(
                    trendPartNameFilter,
                    trendPartNameFilter,
                    trendPartNameFilter
                  )}`
                : "")
            }
            titleIcon={TrendingUp}
            loading={loading.measurementTrend}
            customHeaderContent={<MeasurementTrendIconLegend />}
          />
        </div>

        {/* Added overflow-x-auto wrapper for horizontal scrolling */}
        <div className="overflow-x-auto mb-6">
          <TrendTable
            title={t("cutting.fabricDefectTrendChart")}
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
                left: "5rem", // Adjust if w-20 for panel changes
                className: "w-36 min-w-[9rem] whitespace-normal break-words" // Increased width
              },
              ...(fabricDefectTrendData.headers || []).map((date) => ({
                label: date,
                className: "text-center min-w-[100px]" // Increased min-width
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
                ).length; // Adjusted: 1 row per item
              }
              return (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  {showGarmentType && (
                    <td
                      className="px-2 py-1 whitespace-nowrap border-r sticky left-0 bg-inherit z-5 align-middle"
                      rowSpan={garmentTypeRowSpan}
                    >
                      {getLocalizedText(
                        item.garmentType,
                        item.garmentType,
                        item.garmentType
                      )}
                    </td>
                  )}
                  <td className="px-2 py-1 whitespace-normal break-words border-r sticky left-[5rem] bg-inherit z-5 align-middle">
                    {" "}
                    {/* Removed rowSpan */}
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
                    if (defectRate > 1) defectBgColorClass = "bg-red-100";
                    else if (defectRate >= 0.5 && defectRate <= 1)
                      defectBgColorClass = "bg-yellow-100";
                    else if (defectRate < 0.5)
                      defectBgColorClass = "bg-green-100";

                    return (
                      <td
                        key={date}
                        className={`px-2 py-1 text-center border-r align-middle ${defectBgColorClass}`}
                      >
                        {defectCount}
                        <div className="text-xxs font-semibold text-red-700 mt-0.5">
                          ({defectRate.toFixed(2)}%)
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            }}
            appliedFiltersText={
              appliedFiltersString +
              (trendGarmentTypeFilter
                ? `, ${t("cutting.panel")}: ${getLocalizedText(
                    trendGarmentTypeFilter,
                    trendGarmentTypeFilter,
                    trendGarmentTypeFilter
                  )}`
                : "") +
              (trendPartNameFilter
                ? `, ${t("cutting.partNameFilter")}: ${getLocalizedText(
                    trendPartNameFilter,
                    trendPartNameFilter,
                    trendPartNameFilter
                  )}`
                : "")
            }
            titleIcon={AlertTriangle}
            loading={loading.fabricTrend}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Added overflow-x-auto wrapper for horizontal scrolling */}
          <div className="overflow-x-auto">
            <TrendTable
              title={t("cutting.topMeasurementIssues")}
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
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-3 py-2 whitespace-normal break-words border-r">
                    {getLocalizedText(
                      item.measurementPoint,
                      item.measurementPoint,
                      item.measurementPoint
                    )}
                  </td>
                  <td className="px-3 py-2 text-center border-r">
                    {item.passPoints}
                  </td>
                  <td className="px-3 py-2 text-center border-r">
                    {item.rejectTolNegPoints}
                  </td>
                  <td className="px-3 py-2 text-center border-r">
                    {item.rejectTolPosPoints}
                  </td>
                  <td className="px-3 py-2 text-center border-r font-semibold text-red-500">
                    {item.issuePercentage.toFixed(2)}%
                  </td>
                </tr>
              )}
              appliedFiltersText={
                appliedFiltersString +
                (trendGarmentTypeFilter
                  ? `, ${t("cutting.panel")}: ${getLocalizedText(
                      trendGarmentTypeFilter,
                      trendGarmentTypeFilter,
                      trendGarmentTypeFilter
                    )}`
                  : "")
              }
              titleIcon={TrendingDown}
              loading={loading.topIssues || loading.main} // Use combined loading state
            />
          </div>
          {/* Added overflow-x-auto wrapper for horizontal scrolling */}
          <div className="overflow-x-auto">
            <TrendTable
              title={t("cutting.topDefectIssues")}
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
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-3 py-2 whitespace-nowrap border-r">
                    {getLocalizedText(
                      item.defectName,
                      item.defectNameKhmer,
                      item.defectNameChinese
                    )}
                  </td>
                  <td className="px-3 py-2 text-center border-r">
                    {item.defectQty}
                  </td>
                  <td className="px-3 py-2 text-center border-r font-semibold text-red-500">
                    {item.defectRate.toFixed(2)}%
                  </td>
                </tr>
              )}
              appliedFiltersText={
                appliedFiltersString +
                (trendGarmentTypeFilter
                  ? `, ${t("cutting.panel")}: ${getLocalizedText(
                      trendGarmentTypeFilter,
                      trendGarmentTypeFilter,
                      trendGarmentTypeFilter
                    )}`
                  : "")
              }
              titleIcon={AlertTriangle}
              loading={loading.topIssues || loading.main} // Use combined loading state
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuttingGarmentTypeTrendAnalysis;
