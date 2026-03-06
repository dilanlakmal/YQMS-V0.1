import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Search,
  Save,
  CheckSquare,
  Square,
  Loader,
  AlertTriangle,
  Eye,
  CheckCircle,
  Layers,
  X,
  Wrench,
  RefreshCw,
  Ruler,
  Download,
  Info,
  RotateCcw, // Icon for Repair button
  Languages,
} from "lucide-react";
import axios from "axios";
import { debounce } from "lodash";
import { API_BASE_URL } from "../../../../../config";
import RepairNamesModal from "./RepairNamesModal";

const MeasurementSpecsShared = ({
  title,
  subtitle,
  apiEndpointBase,
  dataKey,
  selectedDataKey,
  isAw = false,
}) => {
  const [moNoSearch, setMoNoSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // --- Autocomplete State ---
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Data State
  const [allSpecs, setAllSpecs] = useState([]);
  const [selectedPointNames, setSelectedPointNames] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fix Tolerance State
  const [isFixing, setIsFixing] = useState(false);
  const [showFixModal, setShowFixModal] = useState(false);
  const [previewIssues, setPreviewIssues] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Applying to AW
  const [isApplyingAW, setIsApplyingAW] = useState(false);

  // Update Specs State
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatePreview, setUpdatePreview] = useState(null);
  const [isLoadingUpdatePreview, setIsLoadingUpdatePreview] = useState(false);
  const [hasSavedConfig, setHasSavedConfig] = useState(false);

  // Repair TOL State (AW only)
  const [isRepairingTol, setIsRepairingTol] = useState(false);

  // Update New K Specs State
  const [isUpdatingKValue, setIsUpdatingKValue] = useState(false);

  // =========================================================================
  // Repair Specs State
  // =========================================================================
  const [isRepairing, setIsRepairing] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);

  // State for previewing name swap issues
  const [showRepairNamesModal, setShowRepairNamesModal] = useState(false);

  // --- Autocomplete Logic ---
  const fetchMoSuggestions = useCallback(
    debounce(async (term) => {
      if (!term || term.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/search-mono?term=${term}`,
        );
        setSuggestions(response.data || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    if (moNoSearch && showSuggestions) {
      fetchMoSuggestions(moNoSearch);
    }
  }, [moNoSearch, fetchMoSuggestions, showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (mo) => {
    setMoNoSearch(mo);
    setShowSuggestions(false);
    handleSearch(null, mo);
  };

  const handleInputChange = (e) => {
    setMoNoSearch(e.target.value);
    setShowSuggestions(true);
  };

  const clearSearch = () => {
    setMoNoSearch("");
    setSuggestions([]);
    setAllSpecs([]);
    setSelectedPointNames([]);
    setError("");
    setSuccessMsg("");
    setHasSavedConfig(false);
  };

  // --- Main Data Fetch Logic ---
  const handleSearch = async (e, overrideMo = null) => {
    if (e) e.preventDefault();

    const term = overrideMo || moNoSearch;
    if (!term.trim()) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");
    setAllSpecs([]);
    setSelectedPointNames([]);
    setIsPreviewMode(false);
    setShowSuggestions(false);
    setHasSavedConfig(false);

    try {
      const response = await axios.get(
        `${API_BASE_URL}${apiEndpointBase}/${term.trim()}`,
      );

      const data = response.data.data;
      setAllSpecs(data[dataKey] || []);

      if (response.data.source === "qa_sections" && data[selectedDataKey]) {
        const savedNames = [
          ...new Set(
            data[selectedDataKey].map((s) => s.MeasurementPointEngName),
          ),
        ];
        setSelectedPointNames(savedNames);
        setHasSavedConfig(true);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Failed to fetch specs.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- Distinct Points Logic ---
  const distinctPoints = useMemo(() => {
    const uniqueMap = new Map();
    allSpecs.forEach((spec) => {
      if (!uniqueMap.has(spec.MeasurementPointEngName)) {
        uniqueMap.set(spec.MeasurementPointEngName, spec);
      }
    });
    return Array.from(uniqueMap.values());
  }, [allSpecs]);

  // --- Selection Handlers ---
  const togglePointSelection = (pointName) => {
    setSelectedPointNames((prev) =>
      prev.includes(pointName)
        ? prev.filter((n) => n !== pointName)
        : [...prev, pointName],
    );
  };

  const handleSelectAll = () => {
    if (selectedPointNames.length === distinctPoints.length) {
      setSelectedPointNames([]);
    } else {
      setSelectedPointNames(
        distinctPoints.map((p) => p.MeasurementPointEngName),
      );
    }
  };

  // --- Save Handler ---
  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    setError("");

    try {
      const selectedSpecsObjects = allSpecs.filter((spec) =>
        selectedPointNames.includes(spec.MeasurementPointEngName),
      );

      const payload = {
        moNo: moNoSearch.trim(),
        allSpecs: allSpecs,
        selectedSpecs: selectedSpecsObjects,
        isSaveAll: selectedPointNames.length === distinctPoints.length,
      };

      const response = await axios.post(
        `${API_BASE_URL}${apiEndpointBase}/save`,
        payload,
      );

      setSuccessMsg(
        `Specs saved successfully! (Updated: ${new Date(
          response.data.updatedAt,
        ).toLocaleTimeString()})`,
      );
      setHasSavedConfig(true);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================================
  // UPDATE SPECS FUNCTIONS
  // =========================================================================

  const handlePreviewUpdate = async () => {
    if (!moNoSearch.trim()) {
      setError("Please search for an order first.");
      return;
    }

    setIsLoadingUpdatePreview(true);
    setShowUpdateModal(true);
    setUpdatePreview(null);
    setError("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/preview-update`,
        {
          moNo: moNoSearch.trim(),
          isAW: isAw,
        },
      );

      setUpdatePreview(response.data);
    } catch (err) {
      console.error("Error previewing update:", err);
      if (err.response?.status === 404) {
        setUpdatePreview({
          success: false,
          hasUpdates: false,
          message:
            err.response?.data?.message ||
            "No saved configuration found. Please save configuration first.",
          hasConfig: err.response?.data?.hasConfig ?? false,
        });
      } else {
        setUpdatePreview({
          success: false,
          error:
            err.response?.data?.message ||
            err.message ||
            "Failed to load preview",
        });
      }
    } finally {
      setIsLoadingUpdatePreview(false);
    }
  };

  const handleUpdateSpecs = async () => {
    if (!moNoSearch.trim()) {
      setError("Please search for an order first.");
      return;
    }

    setIsUpdating(true);
    setError("");
    setSuccessMsg("");

    try {
      const endpoint = isAw
        ? "/api/qa-sections/measurement-specs-aw/update-from-master"
        : "/api/qa-sections/measurement-specs/update-from-master";

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        moNo: moNoSearch.trim(),
      });

      if (response.data.success) {
        setSuccessMsg(response.data.message);
        setShowUpdateModal(false);
        setUpdatePreview(null);
        handleSearch(null, moNoSearch);
        setTimeout(() => setSuccessMsg(""), 5000);
      }
    } catch (err) {
      console.error("Error updating specs:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to update specs from master data.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // =========================================================================
  // NEW: REPAIR CORRUPTED SPECS FUNCTIONS
  // =========================================================================

  const handleRepairSpecs = async () => {
    if (!moNoSearch.trim()) {
      setError("Please search for an order first.");
      return;
    }

    setIsRepairing(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/repair-corrupted`,
        {
          moNo: moNoSearch.trim(),
        },
      );

      if (response.data.success) {
        const {
          pointsRepaired,
          corruptedSpecsRemoved,
          specsRestoredFromMaster,
        } = response.data.summary || {};

        if (pointsRepaired > 0) {
          setSuccessMsg(
            `✅ ${response.data.message} | Removed: ${corruptedSpecsRemoved || 0} corrupted spec(s) | Restored: ${specsRestoredFromMaster || 0} spec(s) from master data.`,
          );
        } else {
          setSuccessMsg(response.data.message);
        }

        setShowRepairModal(false);

        // Refresh the data to show repaired specs
        handleSearch(null, moNoSearch);

        setTimeout(() => setSuccessMsg(""), 6000);
      }
    } catch (err) {
      console.error("Error repairing specs:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to repair corrupted specs.",
      );
    } finally {
      setIsRepairing(false);
    }
  };

  // =========================================================================
  // REPAIR AW TOLERANCE VALUES FROM MASTER DATA
  // =========================================================================
  const handleRepairAWTolerances = async () => {
    if (!moNoSearch.trim()) {
      setError("Please search for an order first.");
      return;
    }

    setIsRepairingTol(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs-aw/repair-tolerances`,
        { moNo: moNoSearch.trim() },
      );

      if (response.data.success) {
        const { totalUpdated } = response.data.summary || {};
        setSuccessMsg(
          totalUpdated > 0
            ? `✅ ${response.data.message}`
            : `✅ ${response.data.message}`,
        );
        handleSearch(null, moNoSearch);
        setTimeout(() => setSuccessMsg(""), 5000);
      }
    } catch (err) {
      console.error("Error repairing AW tolerances:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to repair tolerance values.",
      );
    } finally {
      setIsRepairingTol(false);
    }
  };

  // =========================================================================
  // UPDATE NEW K-VALUE SPECS FROM MASTER DATA (BW only)
  // =========================================================================
  const handleUpdateNewKValueSpecs = async () => {
    if (!moNoSearch.trim()) {
      setError("Please search for an order first.");
      return;
    }

    setIsUpdatingKValue(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/update-new-kvalue`,
        { moNo: moNoSearch.trim() },
      );

      if (response.data.success) {
        const {
          newKValuesFound,
          objectsAddedToAll,
          objectsAddedToSelected,
          newKValues,
        } = response.data.summary || {};

        if (newKValuesFound > 0) {
          setSuccessMsg(
            `✅ ${response.data.message} | New kValues: ${newKValues?.join(", ")}`,
          );
          // Refresh data to show newly added specs
          handleSearch(null, moNoSearch);
        } else {
          setSuccessMsg(`✅ ${response.data.message}`);
        }

        setTimeout(() => setSuccessMsg(""), 6000);
      }
    } catch (err) {
      console.error("Error updating new kValue specs:", err);
      const status = err.response?.status;
      if (status === 404) {
        setError(
          err.response?.data?.message ||
            "No saved configuration found. Please save configuration first.",
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to update new kValue specs.",
        );
      }
    } finally {
      setIsUpdatingKValue(false);
    }
  };

  // =========================================================================
  // Handle Repair Names Success
  // =========================================================================
  const handleRepairNamesSuccess = (message) => {
    setSuccessMsg(message);
    // Refresh the data to show updated names
    handleSearch(null, moNoSearch);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  // --- Fix Tolerance Functions ---
  const handlePreviewIssues = async () => {
    setIsLoadingPreview(true);
    setShowFixModal(true);
    setPreviewIssues(null);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/preview-tolerance-issues`,
      );

      if (response.data) {
        setPreviewIssues(response.data);
      } else {
        setPreviewIssues({
          totalDocumentsWithIssues: 0,
          totalProblems: 0,
          issues: [],
        });
      }
    } catch (err) {
      console.error("Error previewing issues:", err);
      if (err.response?.status === 404) {
        setPreviewIssues({
          totalDocumentsWithIssues: 0,
          totalProblems: 0,
          issues: [],
        });
      } else {
        setPreviewIssues({
          error:
            err.response?.data?.message ||
            err.message ||
            "Failed to load preview",
          totalDocumentsWithIssues: 0,
          totalProblems: 0,
          issues: [],
        });
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleFixAllTolerances = async () => {
    setIsFixing(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/fix-tolerances`,
      );

      const fixedCount = response.data?.summary?.totalTolerancesFixed || 0;
      const docsUpdated = response.data?.summary?.totalDocumentsUpdated || 0;

      if (fixedCount > 0) {
        setSuccessMsg(
          `✅ Fixed ${fixedCount} tolerance values across ${docsUpdated} documents!`,
        );
      } else {
        setSuccessMsg(
          `✅ Checked all documents. No tolerance issues found or all issues already fixed.`,
        );
      }

      setShowFixModal(false);
      setPreviewIssues(null);

      if (moNoSearch) {
        handleSearch(null, moNoSearch);
      }

      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      console.error("Fix all error:", err);
      setError(err.response?.data?.error || "Failed to fix tolerances.");
    } finally {
      setIsFixing(false);
    }
  };

  const handleFixCurrentOrder = async () => {
    if (!moNoSearch.trim()) {
      setError("Please search for an order first.");
      return;
    }

    setIsFixing(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/fix-tolerances/${moNoSearch.trim()}`,
      );

      setSuccessMsg(
        response.data?.message || "Tolerance values checked and fixed!",
      );
      setShowFixModal(false);
      setPreviewIssues(null);
      handleSearch(null, moNoSearch);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Fix order error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to fix tolerances.",
      );
    } finally {
      setIsFixing(false);
    }
  };

  // --- Group Data for Preview ---
  const previewDataByKValue = useMemo(() => {
    if (!isPreviewMode) return {};

    const selectedItems = allSpecs.filter((spec) =>
      selectedPointNames.includes(spec.MeasurementPointEngName),
    );

    const grouped = {};
    selectedItems.forEach((item) => {
      const k = item.kValue || "NA";
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(item);
    });

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (a === "NA" || a === "Unknown") return 1;
      if (b === "NA" || b === "Unknown") return -1;
      return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    const result = {};
    sortedKeys.forEach((key) => (result[key] = grouped[key]));
    return result;
  }, [isPreviewMode, allSpecs, selectedPointNames]);

  // --- Apply to AW Handler ---
  const handleApplyToAW = async () => {
    if (!moNoSearch) return;
    if (selectedPointNames.length === 0) {
      setError("Please select at least one point to apply.");
      return;
    }

    setIsApplyingAW(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = {
        moNo: moNoSearch.trim(),
        selectedPointNames: selectedPointNames,
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/apply-to-aw`,
        payload,
      );

      setSuccessMsg(response.data.message);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to apply selection to After Wash.",
      );
    } finally {
      setIsApplyingAW(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-colors duration-300 min-h-[600px]">
      {/* --- Header & Search Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Ruler className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Search Input Container */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full md:w-80" ref={searchContainerRef}>
            <form onSubmit={(e) => handleSearch(e)} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search MO No..."
                  value={moNoSearch}
                  onChange={handleInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  autoComplete="off"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                {moNoSearch && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !moNoSearch}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Go"}
              </button>
            </form>

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto scrollbar-thin">
                {suggestions.map((mo, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(mo)}
                    className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-600/50 last:border-0"
                  >
                    {mo}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Fix Tolerance Button */}
          <button
            onClick={handlePreviewIssues}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center gap-2"
            title="Fix Tolerance Values"
          >
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Fix TOL</span>
          </button>

          {/* ========================================================= */}
          {/* Repair Specs Button */}
          {/* ========================================================= */}
          {moNoSearch && hasSavedConfig && (
            <button
              onClick={() => setShowRepairModal(true)}
              disabled={isRepairing}
              className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
              title="Repair Corrupted Specs (removes invalid size names like 'index')"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Repair</span>
            </button>
          )}

          {/* ========================================================= */}
          {/* Repair TOL Button (Only for AW - isAw = true) */}
          {/* ========================================================= */}
          {isAw && moNoSearch && hasSavedConfig && (
            <button
              onClick={handleRepairAWTolerances}
              disabled={isRepairingTol}
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
              title="Repair Tolerance Values from Master Data (dt_orders SizeSpec)"
            >
              {isRepairingTol ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Wrench className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Repair TOL</span>
            </button>
          )}

          {/* ========================================================= */}
          {/* Repair Names Button (Only for BW - isAw = false) */}
          {/* ========================================================= */}
          {!isAw && moNoSearch && hasSavedConfig && (
            <button
              onClick={() => setShowRepairNamesModal(true)}
              className="px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center gap-2"
              title="Repair Swapped Names (swap English/Chinese names if mistakenly reversed)"
            >
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">Repair Names</span>
            </button>
          )}
        </div>
      </div>

      {/* --- Messages --- */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-300 animate-fadeIn">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* Repair Specs Confirmation Modal */}
      {/* ================================================================= */}
      {showRepairModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-rose-50 dark:bg-rose-900/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                  <RotateCcw className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    Repair Corrupted Specs
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Order: {moNoSearch}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
                    ⚠️ This will:
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 ml-4 list-disc">
                    <li>
                      Remove specs with invalid size names (e.g., "index",
                      "fraction")
                    </li>
                    <li>
                      Restore missing valid specs from Master Data (dt_orders)
                    </li>
                    <li>Keep all existing valid specs unchanged</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Use this if:</strong> You see strange size names
                    like "index" or missing size specifications in your data.
                  </p>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This operation is safe and will not delete valid data. Do you
                  want to proceed?
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-3 justify-end">
              <button
                onClick={() => setShowRepairModal(false)}
                disabled={isRepairing}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRepairSpecs}
                disabled={isRepairing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isRepairing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Repair Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Fix Tolerance Modal --- */}
      {showFixModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    Fix Tolerance Values
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Preview and fix tolerance formatting issues
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFixModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {isLoadingPreview ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-amber-500 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Scanning for tolerance issues...
                  </p>
                </div>
              ) : !previewIssues ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    Loading preview data...
                  </p>
                </div>
              ) : previewIssues.error ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-amber-600 dark:text-amber-400 text-sm">
                      Note: Preview might be incomplete, but you can still run
                      the fix operation.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {previewIssues.totalDocumentsWithIssues || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Documents with issues
                      </p>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {previewIssues.totalProblems || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total problems found
                      </p>
                    </div>
                  </div>

                  {/* Issue Details */}
                  {previewIssues.issues && previewIssues.issues.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Issues by Order (showing first 10):
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2 scrollbar-thin">
                        {previewIssues.issues.slice(0, 10).map((issue, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                          >
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              {issue.Order_No}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {issue.problems?.length || 0} issue(s) found
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        No tolerance issues found!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 justify-end bg-gray-50 dark:bg-gray-800/50 shrink-0">
              {moNoSearch && (
                <button
                  onClick={handleFixCurrentOrder}
                  disabled={isFixing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isFixing ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Fix Current Order
                </button>
              )}
              <button
                onClick={handleFixAllTolerances}
                disabled={isFixing}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isFixing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Wrench className="w-4 h-4" />
                )}
                Fix All Documents
              </button>
              <button
                onClick={() => {
                  setShowFixModal(false);
                  setPreviewIssues(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Specs Modal - keeping your existing code */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-cyan-50 dark:bg-cyan-900/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <Download className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    Update Specs from Master Data
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sync missing specs and shrinkage values from dt_orders
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setUpdatePreview(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {isLoadingUpdatePreview ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-cyan-500 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Analyzing differences with Master Data...
                  </p>
                </div>
              ) : !updatePreview ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    Loading preview data...
                  </p>
                </div>
              ) : updatePreview.error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    {updatePreview.error}
                  </p>
                </div>
              ) : updatePreview.hasConfig === false ? (
                <div className="p-6 text-center">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    No Saved Configuration Found
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Please save your configuration first using the "Save
                    Configuration" button before updating specs.
                  </p>
                </div>
              ) : !updatePreview.hasUpdates ? (
                <div className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    All Specs Are Up to Date!
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    No missing specs or shrinkage values found. Your
                    configuration is synchronized with Master Data.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {updatePreview.summary?.totalPointsToUpdate || 0}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Points to Update
                      </p>
                    </div>
                    <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg text-center">
                      <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                        {updatePreview.summary?.totalMissingSpecs || 0}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Missing Size Specs
                      </p>
                    </div>
                    {!isAw && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {updatePreview.summary?.totalShrinkageUpdates || 0}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Shrinkage Updates
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium">What will be updated:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Missing size specifications will be added</li>
                        {!isAw && (
                          <li>
                            Shrinkage values will be synced from Master Data
                          </li>
                        )}
                        <li>
                          <strong>Existing data will NOT be overwritten</strong>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {updatePreview.pendingUpdates &&
                    updatePreview.pendingUpdates.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Pending Updates (showing first 10):
                        </p>
                        <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2 scrollbar-thin">
                          {updatePreview.pendingUpdates
                            .slice(0, 10)
                            .map((update, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                              >
                                <p className="font-medium text-gray-800 dark:text-gray-200">
                                  {update.pointName}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {update.missingSizes.length > 0 && (
                                    <span className="text-xs px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded">
                                      +{update.missingSizes.length} sizes:{" "}
                                      {update.missingSizes.join(", ")}
                                    </span>
                                  )}
                                  {update.shrinkageNeedsUpdate && (
                                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                      Shrinkage: {update.currentShrinkage} →{" "}
                                      {update.masterShrinkage}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          {updatePreview.pendingUpdates.length > 10 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                              ... and {updatePreview.pendingUpdates.length - 10}{" "}
                              more points
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 justify-end bg-gray-50 dark:bg-gray-800/50 shrink-0">
              {updatePreview?.hasUpdates && (
                <button
                  onClick={handleUpdateSpecs}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Update Specs Now
                  {updatePreview?.summary?.totalMissingSpecs > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      +{updatePreview.summary.totalMissingSpecs} specs
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setUpdatePreview(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - keeping your existing code for selection and preview */}
      {allSpecs.length > 0 && (
        <div className="space-y-6 animate-fadeIn">
          {!isPreviewMode && (
            <>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Available Measurement Points ({distinctPoints.length})
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    {selectedPointNames.length} Selected
                  </span>
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-1.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {selectedPointNames.length === distinctPoints.length ? (
                      <>
                        <CheckSquare className="w-4 h-4" /> Deselect All
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" /> Select All
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {distinctPoints.map((point, idx) => {
                  const isSelected = selectedPointNames.includes(
                    point.MeasurementPointEngName,
                  );
                  return (
                    <div
                      key={idx}
                      onClick={() =>
                        togglePointSelection(point.MeasurementPointEngName)
                      }
                      className={`
                        flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 group
                        ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 dark:border-indigo-400 shadow-sm"
                            : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500"
                        }
                      `}
                    >
                      <div className="flex-1 pr-2">
                        <p
                          className={`text-sm font-semibold ${
                            isSelected
                              ? "text-indigo-700 dark:text-indigo-300"
                              : "text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {point.MeasurementPointEngName}
                        </p>
                        {point.MeasurementPointChiName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-chinese">
                            {point.MeasurementPointChiName}
                          </p>
                        )}
                      </div>
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300 dark:text-gray-500 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {isPreviewMode && (
            <div className="space-y-8 animate-fadeIn">
              {Object.entries(previewDataByKValue).map(([kValue, rows]) => (
                <div
                  key={kValue}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
                >
                  <div className="px-4 py-3 bg-indigo-50 dark:bg-gray-700 border-b border-indigo-100 dark:border-gray-600 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      Sheet: {kValue}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-4 py-3 border-r border-gray-100 dark:border-gray-700">
                            Point (Eng)
                          </th>
                          <th className="px-4 py-3 text-center border-r border-gray-100 dark:border-gray-700">
                            Tol (-)
                          </th>
                          <th className="px-4 py-3 text-center border-r border-gray-100 dark:border-gray-700">
                            Tol (+)
                          </th>
                          <th className="px-4 py-3 text-center border-r border-gray-100 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
                            Shrinkage
                          </th>
                          {rows[0]?.Specs.map((spec) => (
                            <th
                              key={spec.size}
                              className="px-4 py-3 text-center min-w-[60px] bg-gray-100/50 dark:bg-gray-700/50 border-r border-gray-200 dark:border-gray-700"
                            >
                              {spec.size}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-indigo-50/30 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-gray-700">
                              {row.MeasurementPointEngName}
                            </td>
                            <td className="px-4 py-3 text-center text-red-600 dark:text-red-400 font-bold border-r border-gray-100 dark:border-gray-700">
                              {row.TolMinus?.fraction || "-"}
                            </td>
                            <td className="px-4 py-3 text-center text-green-600 dark:text-green-400 font-bold border-r border-gray-100 dark:border-gray-700">
                              {row.TolPlus?.fraction || "+"}
                            </td>
                            <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400 font-bold border-r border-gray-100 dark:border-gray-700 bg-yellow-50/30 dark:bg-yellow-900/10">
                              {row.Shrinkage?.fraction || "0"}
                            </td>
                            {row.Specs.map((spec, sIdx) => (
                              <td
                                key={sIdx}
                                className="px-4 py-3 text-center text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700"
                              >
                                {spec.fraction}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end items-center gap-3 sticky bottom-0 bg-white dark:bg-gray-800 py-4 z-10">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              disabled={selectedPointNames.length === 0}
              className="w-full sm:w-auto px-5 py-2.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {isPreviewMode
                ? "Back to Selection"
                : `Preview Selected (${selectedPointNames.length})`}
            </button>

            {!isAw && (
              <button
                onClick={handleApplyToAW}
                disabled={
                  selectedPointNames.length === 0 || isApplyingAW || isSaving
                }
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                {isApplyingAW ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Apply to AW
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={
                selectedPointNames.length === 0 || isSaving || isApplyingAW
              }
              className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              {isSaving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Configuration
            </button>

            <button
              onClick={handlePreviewUpdate}
              disabled={!moNoSearch || isUpdating || isSaving || isApplyingAW}
              className="w-full sm:w-auto px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-95"
              title="Update specs from Master Data (dt_orders) - Adds missing sizes and syncs shrinkage values"
            >
              {isUpdating ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Update Specs
            </button>

            {/* Update New K Specs Button - BW only */}
            {!isAw && (
              <button
                onClick={handleUpdateNewKValueSpecs}
                disabled={
                  !moNoSearch || isUpdatingKValue || isSaving || isApplyingAW
                }
                className="w-full sm:w-auto px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-95"
                title="Add new kValue spec groups from Master Data (dt_orders) that don't yet exist in saved configuration"
              >
                {isUpdatingKValue ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Layers className="w-4 h-4" />
                )}
                Update New K Specs
              </button>
            )}
          </div>
        </div>
      )}
      <RepairNamesModal
        isOpen={showRepairNamesModal}
        onClose={() => setShowRepairNamesModal(false)}
        moNo={moNoSearch}
        onSuccess={handleRepairNamesSuccess}
      />
    </div>
  );
};

export default MeasurementSpecsShared;
