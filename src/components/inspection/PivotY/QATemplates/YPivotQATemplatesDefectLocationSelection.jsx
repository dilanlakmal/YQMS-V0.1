import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MapPin,
  Loader,
  Search,
  Check,
  AlertCircle,
  Trash2,
  RefreshCw,
  Image as ImageIcon
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

const YPivotQATemplatesDefectLocationSelection = () => {
  // --- State ---
  const [configurations, setConfigurations] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [currentConfig, setCurrentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // View State: 'Front' or 'Back'
  const [activeView, setActiveView] = useState("Front");

  // Selected Locations State
  const [selectedLocations, setSelectedLocations] = useState([]);

  // --- Initialization ---
  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-product-location`
      );
      if (response.data.success) {
        setConfigurations(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching configurations:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handleConfigChange = async (e) => {
    const configId = e.target.value;
    setSelectedConfigId(configId);
    setSelectedLocations([]); // Reset selections
    setActiveView("Front"); // Reset view to Front default

    if (!configId) {
      setCurrentConfig(null);
      return;
    }

    setLoadingConfig(true);
    try {
      const config = configurations.find((c) => c._id === configId);
      setCurrentConfig(config);
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const toggleLocationSelection = (location, viewType) => {
    const uniqueId = `${viewType}_${location._id || location.tempId}`;
    const exists = selectedLocations.find((item) => item.uniqueId === uniqueId);

    if (exists) {
      setSelectedLocations((prev) =>
        prev.filter((item) => item.uniqueId !== uniqueId)
      );
    } else {
      setSelectedLocations((prev) => [
        ...prev,
        {
          uniqueId,
          locationId: location._id || location.tempId,
          locationNo: location.LocationNo,
          locationName: location.LocationName,
          view: viewType,
          position: "Outside" // Default
        }
      ]);
    }
  };

  const updateLocationPosition = (uniqueId, newPosition) => {
    setSelectedLocations((prev) =>
      prev.map((item) =>
        item.uniqueId === uniqueId ? { ...item, position: newPosition } : item
      )
    );
  };

  const removeSelection = (uniqueId) => {
    setSelectedLocations((prev) =>
      prev.filter((item) => item.uniqueId !== uniqueId)
    );
  };

  const handleClearAll = () => {
    if (window.confirm("Clear all selected locations?")) {
      setSelectedLocations([]);
    }
  };

  // --- Render Helpers ---

  const renderMarkers = (locations, viewType) => {
    return locations.map((loc) => {
      const uniqueId = `${viewType}_${loc._id || loc.tempId}`;
      const isSelected = selectedLocations.some(
        (item) => item.uniqueId === uniqueId
      );

      // Dynamic styles
      const baseColorClass =
        viewType === "Front" ? "bg-red-500" : "bg-blue-500";
      const selectedClass = isSelected
        ? "ring-4 ring-green-400 scale-125 z-10 shadow-xl"
        : "opacity-80 hover:opacity-100 hover:scale-110";

      return (
        <button
          key={uniqueId}
          onClick={() => toggleLocationSelection(loc, viewType)}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-200 border-2 border-white ${baseColorClass} ${selectedClass}`}
          style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
          title={loc.LocationName}
        >
          {isSelected && (
            <Check className="w-3 h-3 absolute -top-1 -right-1 bg-green-500 rounded-full text-white p-0.5" />
          )}
          {loc.LocationNo}
        </button>
      );
    });
  };

  const renderImageView = (viewData, viewType) => {
    if (!viewData || !viewData.imagePath) return null;

    // Use PUBLIC_ASSET_URL or fallback to API
    const imageUrl = `${PUBLIC_ASSET_URL}/api/qa-sections-product-location/image/${viewData.imagePath
      .split("/")
      .pop()}`;

    return (
      <div className="flex flex-col h-full animate-fadeIn">
        {/* Image Container */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center p-4 min-h-[400px] overflow-hidden shadow-inner">
          <div className="relative inline-block">
            <img
              src={imageUrl}
              alt={`${viewType} View`}
              className="max-h-[500px] w-auto max-w-full object-contain block"
            />
            {renderMarkers(viewData.locations, viewType)}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* 1. Header & Selection Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-row items-end gap-3 w-full">
          {/* Dropdown (Flex Grow) */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Select Product
            </label>
            <select
              value={selectedConfigId}
              onChange={handleConfigChange}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="">-- Choose --</option>
              {configurations.map((config) => (
                <option key={config._id} value={config._id}>
                  {config.productTypeName}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Counter Box (Inline) */}
          {selectedLocations.length > 0 && (
            <div className="flex-shrink-0">
              {/* Spacer for label alignment */}
              <div className="h-[26px] mb-2 hidden sm:block"></div>

              <div className="flex items-center gap-3 bg-indigo-600 text-white px-4 py-2.5 rounded-lg shadow-md h-[42px]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span className="font-bold text-lg leading-none">
                    {selectedLocations.length}
                  </span>
                </div>

                <div className="w-px h-4 bg-white/30"></div>

                <button
                  onClick={handleClearAll}
                  className="hover:text-red-200 transition-colors"
                  title="Clear All"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {currentConfig ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 2. Left Side: Image Viewer */}
          <div className="lg:col-span-2 space-y-4">
            {/* Toggle Switch */}
            <div className="bg-gray-200 dark:bg-gray-700/50 p-1 rounded-lg flex items-center relative">
              <button
                onClick={() => setActiveView("Front")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-md transition-all duration-300 ${
                  activeView === "Front"
                    ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-[1.02]"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    activeView === "Front" ? "bg-red-500" : "bg-gray-400"
                  }`}
                ></div>
                Front View
              </button>
              <button
                onClick={() => setActiveView("Back")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-md transition-all duration-300 ${
                  activeView === "Back"
                    ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-[1.02]"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    activeView === "Back" ? "bg-blue-500" : "bg-gray-400"
                  }`}
                ></div>
                Back View
              </button>
            </div>

            {/* Dynamic Image View */}
            <div className="min-h-[450px]">
              {activeView === "Front"
                ? renderImageView(currentConfig.frontView, "Front")
                : renderImageView(currentConfig.backView, "Back")}
            </div>
          </div>

          {/* 3. Right Side: Selection List (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-4">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Defect Locations
                </h3>
                <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full font-mono">
                  {selectedLocations.length}
                </span>
              </div>

              <div className="p-0 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {selectedLocations.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No locations selected.</p>
                    <p className="text-xs mt-1">
                      Toggle views and click markers to add.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {selectedLocations.map((item) => (
                      <div
                        key={item.uniqueId}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors animate-fadeIn"
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Info */}
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0 ${
                                item.view === "Front"
                                  ? "bg-red-500"
                                  : "bg-blue-500"
                              }`}
                            >
                              {item.locationNo}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                {item.locationName}
                              </p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                                {item.view} View
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col items-end gap-2">
                            {/* Toggle Switch */}
                            <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                              <button
                                onClick={() =>
                                  updateLocationPosition(
                                    item.uniqueId,
                                    "Outside"
                                  )
                                }
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                                  item.position === "Outside"
                                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                }`}
                              >
                                Outside
                              </button>
                              <button
                                onClick={() =>
                                  updateLocationPosition(
                                    item.uniqueId,
                                    "Inside"
                                  )
                                }
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                                  item.position === "Inside"
                                    ? "bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                }`}
                              >
                                Inside
                              </button>
                            </div>

                            {/* Remove */}
                            <button
                              onClick={() => removeSelection(item.uniqueId)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Empty State
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
            Select a Product Type
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Choose a product type from the dropdown above to view location
            diagrams and select defects.
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #475569;
        }
      `}</style>
    </div>
  );
};

export default YPivotQATemplatesDefectLocationSelection;
