import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
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
  Ruler // Different icon to distinguish from BW
} from "lucide-react";
import axios from "axios";
import { debounce } from "lodash";
import { API_BASE_URL } from "../../../../../config";

const QASectionsMeasurementAWSelection = () => {
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

  // --- Autocomplete Logic ---
  const fetchMoSuggestions = useCallback(
    debounce(async (term) => {
      if (!term || term.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/search-mono?term=${term}`
        );
        setSuggestions(response.data || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    }, 300),
    []
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
  };

  // --- Main Data Fetch Logic (AW Endpoint) ---
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

    try {
      // 🟢 CALLING THE NEW AW ENDPOINT
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections/measurement-specs-aw/${term.trim()}`
      );

      const data = response.data.data;
      setAllSpecs(data.AllAfterWashSpecs || []);

      // Pre-fill selection if exists
      if (
        response.data.source === "qa_sections" &&
        data.selectedAfterWashSpecs
      ) {
        const savedNames = [
          ...new Set(
            data.selectedAfterWashSpecs.map((s) => s.MeasurementPointEngName)
          )
        ];
        setSelectedPointNames(savedNames);
      }
    } catch (err) {
      console.error(err);
      const errMsg =
        err.response?.data?.message || "Failed to fetch After Wash specs.";
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
        : [...prev, pointName]
    );
  };

  const handleSelectAll = () => {
    if (selectedPointNames.length === distinctPoints.length) {
      setSelectedPointNames([]);
    } else {
      setSelectedPointNames(
        distinctPoints.map((p) => p.MeasurementPointEngName)
      );
    }
  };

  // --- Save Handler (AW Endpoint) ---
  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    setError("");

    try {
      const selectedSpecsObjects = allSpecs.filter((spec) =>
        selectedPointNames.includes(spec.MeasurementPointEngName)
      );

      const payload = {
        moNo: moNoSearch.trim(),
        allSpecs: allSpecs,
        selectedSpecs: selectedSpecsObjects
      };

      // 🟢 CALLING THE NEW AW SAVE ENDPOINT
      await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs-aw/save`,
        payload
      );
      setSuccessMsg("After Wash Specs saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Group Data for Preview (Single 'NA' table usually) ---
  const previewDataByKValue = useMemo(() => {
    if (!isPreviewMode) return {};

    const selectedItems = allSpecs.filter((spec) =>
      selectedPointNames.includes(spec.MeasurementPointEngName)
    );

    const grouped = {};
    selectedItems.forEach((item) => {
      const k = item.kValue || "NA";
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(item);
    });

    return grouped;
  }, [isPreviewMode, allSpecs, selectedPointNames]);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-colors duration-300 min-h-[600px]">
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Ruler className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              After Wash Spec Selection
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure pattern specs from Order Details.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80" ref={searchContainerRef}>
          <form onSubmit={(e) => handleSearch(e)} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search MO No..."
                value={moNoSearch}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
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
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Go"}
            </button>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto scrollbar-thin">
              {suggestions.map((mo, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(mo)}
                  className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-600/50 last:border-0"
                >
                  {mo}
                </li>
              ))}
            </ul>
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

      {/* --- Content Area --- */}
      {allSpecs.length > 0 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Selection View */}
          {!isPreviewMode && (
            <>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Available Points ({distinctPoints.length})
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    {selectedPointNames.length} Selected
                  </span>
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-1.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
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
                    point.MeasurementPointEngName
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
                            ? "bg-purple-50 dark:bg-purple-900/20 border-purple-500 dark:border-purple-400 shadow-sm"
                            : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500"
                        }
                      `}
                    >
                      <div className="flex-1 pr-2">
                        <p
                          className={`text-sm font-semibold ${
                            isSelected
                              ? "text-purple-700 dark:text-purple-300"
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
                        <CheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300 dark:text-gray-500 group-hover:text-purple-400 flex-shrink-0 transition-colors" />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Preview View */}
          {isPreviewMode && (
            <div className="space-y-8 animate-fadeIn">
              {Object.entries(previewDataByKValue).map(([kValue, rows]) => (
                <div
                  key={kValue}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
                >
                  <div className="px-4 py-3 bg-purple-50 dark:bg-gray-700 border-b border-purple-100 dark:border-gray-600 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      Sheet: {kValue} (Original Pattern)
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
                            className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-purple-50/30 dark:hover:bg-gray-700/50 transition-colors"
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
              className="w-full sm:w-auto px-5 py-2.5 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {isPreviewMode
                ? "Back to Selection"
                : `Preview Selected (${selectedPointNames.length})`}
            </button>

            <button
              onClick={handleSave}
              disabled={selectedPointNames.length === 0 || isSaving}
              className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              {isSaving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QASectionsMeasurementAWSelection;
