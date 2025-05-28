import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import {
  Edit3,
  Save,
  Search,
  XCircle,
  RotateCcw,
  ChevronDown,
  Loader2,
  ChevronUp
} from "lucide-react"; // Added some icons

const CuttingMeasurementPointsModify = () => {
  const { t, i18n } = useTranslation();
  const [moNo, setMoNo] = useState("");
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const moNoDropdownRef = useRef(null);
  const [selectedGarmentType, setSelectedGarmentType] = useState("");
  const [garmentTypes, setGarmentTypes] = useState([]);
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For general loading states
  const [isSaving, setIsSaving] = useState(false);

  // --- Input and Select Base Styles ---
  const inputBaseStyle = "block w-full text-sm rounded-md shadow-sm";
  const inputNormalStyle = `${inputBaseStyle} border-gray-300 focus:border-indigo-500 focus:ring-indigo-500`;
  const inputDisabledStyle = `${inputBaseStyle} bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500`;

  // Fetch MO No options
  useEffect(() => {
    const fetchMoNumbers = async () => {
      if (moNoSearch.trim() === "") {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-mo-numbers`,
          { params: { search: moNoSearch } } // Removed headers/withCredentials if not strictly needed for GET
        );
        setMoNoOptions(response.data);
        setShowMoNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Error fetching MO numbers:", error);
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
      } finally {
        setIsLoading(false);
      }
    };
    const debounceFetch = setTimeout(fetchMoNumbers, 300); // Debounce API call
    return () => clearTimeout(debounceFetch);
  }, [moNoSearch]);

  // Fetch Garment Types (panels)
  useEffect(() => {
    const fetchGarmentTypes = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-panels`
        );
        setGarmentTypes(response.data);
      } catch (error) {
        console.error("Error fetching garment types:", error);
        setGarmentTypes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGarmentTypes();
  }, []);

  // Fetch measurement points
  useEffect(() => {
    const fetchMeasurementPoints = async () => {
      if (!moNo || !selectedGarmentType) {
        setMeasurementPoints([]);
        setIsEditMode(false); // Reset edit mode if selection changes
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-points`,
          { params: { moNo, panel: selectedGarmentType } }
        );
        setMeasurementPoints(
          response.data.map((point) => ({
            _id: point._id,
            no: point.no,
            moNo: point.moNo,
            panel: point.panel,
            pointName: point.pointNameEng, // Initialize pointName with pointNameEng
            pointNameEng: point.pointNameEng,
            pointNameKhmer: point.pointNameKhmer,
            pointNameChinese: point.pointNameChinese || "",
            panelName: point.panelName,
            panelSide: point.panelSide,
            panelDirection: point.panelDirection,
            measurementSide: point.measurementSide,
            panelIndex: point.panelIndex,
            panelIndexName: point.panelIndexName,
            panelIndexNameKhmer: point.panelIndexNameKhmer,
            panelIndexNameChinese: point.panelIndexNameChinese || "",
            isChanged: false // Track if row has been changed
          }))
        );
        setIsEditMode(false); // Start in view mode when new data is loaded
      } catch (error) {
        console.error("Error fetching measurement points:", error);
        setMeasurementPoints([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeasurementPoints();
  }, [moNo, selectedGarmentType]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGarmentTypeChange = (e) => {
    setSelectedGarmentType(e.target.value);
    // Measurement points will be refetched by the useEffect above
  };

  const handlePointChange = (index, field, value) => {
    setMeasurementPoints((prevPoints) =>
      prevPoints.map((point, i) =>
        i === index ? { ...point, [field]: value, isChanged: true } : point
      )
    );
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      // If currently in edit mode and toggling off
      // Optionally, ask for confirmation or revert changes
      // For now, just toggle
      const hasChanges = measurementPoints.some((p) => p.isChanged);
      if (hasChanges) {
        Swal.fire({
          title: t("cutting.confirmCancelEditTitle", "Confirm Cancel"),
          text: t(
            "cutting.confirmCancelEditMsg",
            "You have unsaved changes. Are you sure you want to cancel editing? Changes will be lost."
          ),
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: t("cutting.yesCancel", "Yes, cancel"),
          cancelButtonText: t("cutting.noKeepEditing", "No, keep editing")
        }).then((result) => {
          if (result.isConfirmed) {
            setIsEditMode(false);
            // Refetch original data to discard changes
            if (moNo && selectedGarmentType) {
              // Trigger refetch
              // Simple way to trigger: temporarily clear and then set again
              const currentMo = moNo;
              const currentPanel = selectedGarmentType;
              setMoNo("");
              setSelectedGarmentType("");
              setTimeout(() => {
                setMoNo(currentMo);
                setSelectedGarmentType(currentPanel);
              }, 0);
            }
          }
        });
      } else {
        setIsEditMode(false);
      }
    } else {
      setIsEditMode(true);
    }
  };

  const handleSaveChanges = async () => {
    const changedPoints = measurementPoints.filter((p) => p.isChanged);
    if (changedPoints.length === 0) {
      Swal.fire({
        icon: "info",
        title: t("cutting.noChanges"),
        text: t("cutting.noChangesToSave")
      });
      setIsEditMode(false); // Exit edit mode if no changes
      return;
    }

    // Validation for changed points
    if (
      changedPoints.some(
        (p) =>
          !p.pointNameEng ||
          !p.pointNameKhmer || // Removed !p.pointName as it's derived
          !p.panelName ||
          !p.panelSide ||
          !p.panelDirection ||
          !p.measurementSide ||
          p.panelIndex === null ||
          p.panelIndex === undefined ||
          !p.panelIndexName ||
          !p.panelIndexNameKhmer
      )
    ) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.missingInformation"),
        text: t("cutting.fillRequiredFields")
      });
      return;
    }

    setIsSaving(true);
    try {
      // Only send changed points to the backend
      for (const point of changedPoints) {
        await axios.put(
          `${API_BASE_URL}/api/update-measurement-point/${point._id}`,
          {
            // Send only relevant fields for update
            pointNameEng: point.pointNameEng,
            pointNameKhmer: point.pointNameKhmer,
            pointNameChinese: point.pointNameChinese,
            panelName: point.panelName,
            panelSide: point.panelSide,
            panelDirection: point.panelDirection,
            measurementSide: point.measurementSide,
            panelIndex: Number(point.panelIndex),
            panelIndexName: point.panelIndexName,
            panelIndexNameKhmer: point.panelIndexNameKhmer,
            panelIndexNameChinese: point.pointNameChinese,
            pointName: point.pointNameEng // Ensure pointName is also updated based on pointNameEng
          }
        );
      }
      Swal.fire({
        icon: "success",
        title: t("cutting.success"),
        text: t("cutting.dataSaved")
      });
      setIsEditMode(false);
      // Refetch to get fresh data and reset isChanged flags
      const currentMo = moNo;
      const currentPanel = selectedGarmentType;
      setMoNo("");
      setSelectedGarmentType(""); // Clear to ensure useEffect triggers
      setTimeout(() => {
        setMoNo(currentMo);
        setSelectedGarmentType(currentPanel);
      }, 0);
    } catch (error) {
      console.error("Error saving data:", error);
      Swal.fire({
        icon: "error",
        title: t("cutting.error"),
        text: t("cutting.failedToSaveData")
      });
    } finally {
      setIsSaving(false);
    }
  };

  const panelNameOptions = [
    "Body",
    "Sleeve",
    "Hat",
    "Neck",
    "Pocket",
    "Other",
    "NA"
  ];
  const panelSideOptions = ["Front", "Back", "NA"];
  const panelDirectionOptions = ["Left", "Right", "Center", "NA"]; // Added Center
  const measurementSideOptions = [
    "Length",
    "Width",
    "Diagonal",
    "Circular",
    "NA"
  ]; // Added Diagonal, Circular

  return (
    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      {" "}
      {/* Main container padding */}
      <h1 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">
        {t(
          "cutting.modifyMeasurementPointsTitle",
          "Modify Cutting Measurement Points"
        )}
      </h1>
      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-end">
        {/* MO No Search */}
        <div className="space-y-1">
          <label
            htmlFor="moNoSearchInput"
            className="block text-sm font-medium text-gray-700"
          >
            {t("cutting.moNo")}
          </label>
          <div className="relative" ref={moNoDropdownRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="moNoSearchInput"
                type="text"
                value={moNoSearch}
                onChange={(e) => setMoNoSearch(e.target.value)}
                onFocus={() =>
                  moNoOptions.length > 0 && setShowMoNoDropdown(true)
                }
                placeholder={t(
                  "cutting.search_mono_placeholder",
                  "Search MO..."
                )}
                className={`${inputNormalStyle} pl-10 py-2.5`}
              />
              {moNoSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setMoNoSearch("");
                    setMoNo("");
                    setSelectedGarmentType("");
                    setMeasurementPoints([]);
                    setShowMoNoDropdown(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            {showMoNoDropdown && moNoOptions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                {moNoOptions.map((option, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setMoNo(option);
                      setMoNoSearch(option); // Update search bar to reflect selection
                      setShowMoNoDropdown(false);
                      setSelectedGarmentType(""); // Reset panel selection
                    }}
                    className="px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
            {showMoNoDropdown &&
              !isLoading &&
              moNoSearch &&
              moNoOptions.length === 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 p-3 text-sm text-gray-500 shadow-lg">
                  {t("cutting.noMoFound", 'No MO found for "')}
                  {moNoSearch}
                  {t("cutting.noMoFoundEnd", '".')}
                </div>
              )}
          </div>
        </div>

        {/* Garment Type (Panel) Selection */}
        <div className="space-y-1">
          <label
            htmlFor="garmentTypeSelect"
            className="block text-sm font-medium text-gray-700"
          >
            {t("cutting.panel")}
          </label>
          <div className="relative">
            <select
              id="garmentTypeSelect"
              value={selectedGarmentType}
              onChange={handleGarmentTypeChange}
              disabled={!moNo || garmentTypes.length === 0}
              className={`${
                !moNo || garmentTypes.length === 0
                  ? inputDisabledStyle
                  : inputNormalStyle
              } appearance-none py-2.5 pl-3 pr-10`}
            >
              <option value="">
                {t("cutting.selectGarmentType", "-- Select Panel --")}
              </option>
              {garmentTypes.map((typeObj, index) => (
                <option key={index} value={typeObj.panel}>
                  {i18n.language === "km"
                    ? typeObj.panelKhmer || typeObj.panel
                    : i18n.language === "zh"
                    ? typeObj.panelChinese || typeObj.panel
                    : typeObj.panel}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
      {/* Loading State for Table */}
      {isLoading && selectedGarmentType && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="ml-3 text-gray-600">
            {t("cutting.loadingPoints", "Loading measurement points...")}
          </p>
        </div>
      )}
      {/* Measurement Points Table Section */}
      {!isLoading && selectedGarmentType && measurementPoints.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 pb-3 border-b border-gray-200 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {t("cutting.modifymeasurementPoint", "Measurement Points")}
              </h2>
              <p className="text-xs text-gray-500">
                MO: {moNo} | {t("cutting.panel")}: {selectedGarmentType} (
                {measurementPoints.length} {t("cutting.pointsFound", "points")})
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleEditMode}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150
                  ${
                    isEditMode
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                {isEditMode ? (
                  <XCircle size={16} className="mr-2" />
                ) : (
                  <Edit3 size={16} className="mr-2" />
                )}
                {isEditMode
                  ? t("cutting.cancelEdit", "Cancel Edit")
                  : t("cutting.edit")}
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={
                  !isEditMode ||
                  isSaving ||
                  !measurementPoints.some((p) => p.isChanged)
                }
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium text-white transition-colors duration-150
                  ${
                    isEditMode && measurementPoints.some((p) => p.isChanged)
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                {isSaving
                  ? t("cutting.saving", "Saving...")
                  : t("cutting.saveChanges", "Save Changes")}
              </button>
            </div>
          </div>

          <p
            className={`mb-3 text-xs italic ${
              isEditMode ? "text-indigo-600" : "text-gray-500"
            }`}
          >
            {isEditMode
              ? t(
                  "cutting.editModeOnMsg",
                  "Edit mode is active. You can now modify the fields below."
                )
              : t(
                  "cutting.editModeOffMsg",
                  "Click 'Edit' to modify measurement points."
                )}
          </p>

          <div className="overflow-x-auto shadow-md rounded-lg max-h-[60vh]">
            {" "}
            {/* Added max-h for scroll */}
            <table className="min-w-full w-max border-collapse">
              {" "}
              {/* w-max ensures table takes minimum width needed */}
              <thead className="sticky top-0 z-10 bg-gray-100 text-xs uppercase text-gray-700">
                <tr>
                  {/* Simplified headers, you can adjust width classes as needed for 8xl */}
                  {[
                    "measurementDetails",
                    "measurementPoint",
                    "measurementPointKhmer",
                    "measurementPointChinese",
                    "panelName",
                    "side",
                    "direction",
                    "lw",
                    "panelIndex",
                    "panelName",
                    "panelNameKhmer",
                    "panelNameChinese"
                  ].map((headerKey) => (
                    <th
                      key={headerKey}
                      scope="col"
                      className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap sticky-header-cell"
                    >
                      {" "}
                      {/* Sticky header cells might need more specific CSS */}
                      {t(`cutting.${headerKey}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {measurementPoints.map((point, index) => (
                  <tr
                    key={point._id}
                    className={`${
                      point.isChanged && isEditMode
                        ? "bg-yellow-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Measurement Details (Point Name - derived from Eng) */}
                    <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                      <input
                        type="text"
                        value={point.pointNameEng}
                        readOnly
                        className={`${inputDisabledStyle} text-xs py-1.5`}
                      />
                    </td>
                    {/* Point Name English */}
                    <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                      <input
                        type="text"
                        value={point.pointNameEng}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "pointNameEng",
                            e.target.value
                          )
                        }
                        disabled={!isEditMode}
                        className={`${
                          isEditMode ? inputNormalStyle : inputDisabledStyle
                        } text-xs py-1.5`}
                      />
                    </td>
                    {/* Point Name Khmer */}
                    <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                      <input
                        type="text"
                        value={point.pointNameKhmer}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "pointNameKhmer",
                            e.target.value
                          )
                        }
                        disabled={!isEditMode}
                        className={`${
                          isEditMode ? inputNormalStyle : inputDisabledStyle
                        } text-xs py-1.5`}
                      />
                    </td>
                    {/* Point Name Chinese */}
                    <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                      <input
                        type="text"
                        value={point.pointNameChinese}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "pointNameChinese",
                            e.target.value
                          )
                        }
                        disabled={!isEditMode}
                        className={`${
                          isEditMode ? inputNormalStyle : inputDisabledStyle
                        } text-xs py-1.5`}
                      />
                    </td>
                    {/* Panel Name Dropdown */}
                    <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                      <select
                        value={point.panelName}
                        onChange={(e) =>
                          handlePointChange(index, "panelName", e.target.value)
                        }
                        disabled={!isEditMode}
                        className={`${
                          isEditMode ? inputNormalStyle : inputDisabledStyle
                        } text-xs py-1.5`}
                      >
                        {panelNameOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    {/* Panel Side Dropdown */}
                    <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                      <select
                        value={point.panelSide}
                        onChange={(e) =>
                          handlePointChange(index, "panelSide", e.target.value)
                        }
                        disabled={!isEditMode}
                        className={`${
                          isEditMode ? inputNormalStyle : inputDisabledStyle
                        } text-xs py-1.5`}
                      >
                        {panelSideOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    {/* Panel Direction Dropdown */}
                    <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                      <select
                        value={point.panelDirection}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "panelDirection",
                            e.target.value
                          )
                        }
                        disabled={!isEditMode}
                        className={`${
                          isEditMode ? inputNormalStyle : inputDisabledStyle
                        } text-xs py-1.5`}
                      >
                        {panelDirectionOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    {/* Measurement Side (LW) Dropdown */}
                    <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                      <select
                        value={point.measurementSide}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "measurementSide",
                            e.target.value
                          )
                        }
                        disabled={!isEditMode}
                        className={`${
                          isEditMode ? inputNormalStyle : inputDisabledStyle
                        } text-xs py-1.5`}
                      >
                        {measurementSideOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    {/* Panel Index */}
                    <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                      <input
                        type="number"
                        value={point.panelIndex || ""}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "panelIndex",
                            e.target.value === ""
                              ? null
                              : Number(e.target.value)
                          )
                        }
                        disabled={!isEditMode}
                        className={`${
                          isEditMode ? inputNormalStyle : inputDisabledStyle
                        } text-xs py-1.5 w-20 text-center`}
                      />
                    </td>
                    {/* Panel Index Name (English) */}
                    <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                      <input
                        type="text"
                        value={point.panelIndexName}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "panelIndexName",
                            e.target.value
                          )
                        }
                        disabled={!isEditMode}
                        className={`${
                          isEditMode ? inputNormalStyle : inputDisabledStyle
                        } text-xs py-1.5`}
                      />
                    </td>
                    {/* Panel Index Name Khmer */}
                    <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                      <input
                        type="text"
                        value={point.panelIndexNameKhmer}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "panelIndexNameKhmer",
                            e.target.value
                          )
                        }
                        disabled={!isEditMode}
                        className={`${
                          isEditMode ? inputNormalStyle : inputDisabledStyle
                        } text-xs py-1.5`}
                      />
                    </td>
                    {/* Panel Index Name Chinese */}
                    <td className="px-3 py-2 border-gray-300 whitespace-nowrap">
                      {" "}
                      {/* Last column no border-r */}
                      <input
                        type="text"
                        value={point.panelIndexNameChinese}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "panelIndexNameChinese",
                            e.target.value
                          )
                        }
                        disabled={!isEditMode}
                        className={`${
                          isEditMode ? inputNormalStyle : inputDisabledStyle
                        } text-xs py-1.5`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!isLoading && selectedGarmentType && measurementPoints.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <RotateCcw className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium">
            {t("cutting.noPointsFoundTitle", "No Measurement Points Found")}
          </p>
          <p className="text-sm">
            {t(
              "cutting.noPointsFoundMsg",
              "No measurement points are available for the selected MO and Panel, or they haven't been added yet."
            )}
          </p>
        </div>
      )}
      {!selectedGarmentType && moNo && !isLoading && (
        <div className="text-center py-10 text-gray-500">
          <p className="text-md">
            {t(
              "cutting.pleaseSelectPanel",
              "Please select a panel to view measurement points."
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default CuttingMeasurementPointsModify;
