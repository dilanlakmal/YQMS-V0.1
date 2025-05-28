import axios from "axios";
import React, { useEffect, useRef, useState, useCallback } from "react";
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
  Trash2 // Added Trash2 icon for delete
} from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // To track which point is being deleted

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
          { params: { search: moNoSearch } }
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
    const debounceFetch = setTimeout(fetchMoNumbers, 300);
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
  const fetchMeasurementPoints = useCallback(async () => {
    // Wrapped in useCallback
    if (!moNo || !selectedGarmentType) {
      setMeasurementPoints([]);
      setIsEditMode(false);
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
          pointName: point.pointNameEng,
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
          isChanged: false
        }))
      );
      setIsEditMode(false);
    } catch (error) {
      console.error("Error fetching measurement points:", error);
      setMeasurementPoints([]);
    } finally {
      setIsLoading(false);
    }
  }, [moNo, selectedGarmentType]); // Dependencies for useCallback

  useEffect(() => {
    fetchMeasurementPoints();
  }, [fetchMeasurementPoints]); // useEffect calls the memoized fetch function

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
      const hasChanges = measurementPoints.some((p) => p.isChanged);
      if (hasChanges) {
        Swal.fire({
          title: t("cutting.confirmCancelEditTitle"),
          text: t("cutting.confirmCancelEditMsg"),
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: t("cutting.yesCancel"),
          cancelButtonText: t("cutting.noKeepEditing")
        }).then((result) => {
          if (result.isConfirmed) {
            setIsEditMode(false);
            fetchMeasurementPoints(); // Refetch to discard changes
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
      setIsEditMode(false);
      return;
    }
    if (
      changedPoints.some(
        (p) =>
          !p.pointNameEng ||
          !p.pointNameKhmer ||
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
      for (const point of changedPoints) {
        await axios.put(
          `${API_BASE_URL}/api/update-measurement-point/${point._id}`,
          {
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
            panelIndexNameChinese: point.panelIndexNameChinese,
            pointName: point.pointNameEng
          }
        );
      }
      Swal.fire({
        icon: "success",
        title: t("cutting.success"),
        text: t("cutting.dataSaved")
      });
      setIsEditMode(false);
      fetchMeasurementPoints(); // Refetch to get fresh data and reset isChanged flags
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

  // ** NEW: Handle Delete Point **
  const handleDeletePoint = async (pointIdToDelete) => {
    Swal.fire({
      title: t("cutting.confirmDeleteTitle", "Are you sure?"),
      text: t(
        "cutting.confirmDeleteMeasurementPointMsg",
        "Do you really want to delete this measurement point? This action cannot be undone."
      ),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("cutting.yesDeleteIt", "Yes, delete it!"),
      cancelButtonText: t("cutting.cancel", "Cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsDeleting(pointIdToDelete);
        try {
          await axios.delete(
            `${API_BASE_URL}/api/delete-measurement-point/${pointIdToDelete}`
          );
          Swal.fire({
            icon: "success",
            title: t("cutting.deleted", "Deleted!"),
            text: t(
              "cutting.measurementPointDeletedSuccess",
              "The measurement point has been deleted."
            )
          });
          fetchMeasurementPoints(); // Refresh the list
        } catch (error) {
          console.error("Error deleting measurement point:", error);
          Swal.fire({
            icon: "error",
            title: t("cutting.error", "Error!"),
            text: t(
              "cutting.failedToDeleteMeasurementPoint",
              "Failed to delete the measurement point."
            )
          });
        } finally {
          setIsDeleting(null);
        }
      }
    });
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
  const panelDirectionOptions = ["Left", "Right", "Center", "NA"];
  const measurementSideOptions = [
    "Length",
    "Width",
    "Diagonal",
    "Circular",
    "NA"
  ];

  return (
    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">
        {t("cutting.modifyMeasurementPointsTitle")}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-end">
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
                {isLoading && !isSaving ? (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                id="moNoSearchInput"
                type="text"
                value={moNoSearch}
                onChange={(e) => setMoNoSearch(e.target.value)}
                onFocus={() =>
                  moNoOptions.length > 0 && setShowMoNoDropdown(true)
                }
                placeholder={t("cutting.search_mono_placeholder")}
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
                      setMoNoSearch(option);
                      setShowMoNoDropdown(false);
                      setSelectedGarmentType("");
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
                  {t("cutting.noMoFound")}
                  {moNoSearch}
                  {t("cutting.noMoFoundEnd")}
                </div>
              )}
          </div>
        </div>
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
              <option value="">{t("cutting.selectGarmentType")}</option>
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

      {isLoading && selectedGarmentType && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="ml-3 text-gray-600">{t("cutting.loadingPoints")}</p>
        </div>
      )}

      {!isLoading && selectedGarmentType && measurementPoints.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 pb-3 border-b border-gray-200 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {t("cutting.modifymeasurementPoint")}
              </h2>
              <p className="text-xs text-gray-500">
                MO: {moNo} | {t("cutting.panel")}: {selectedGarmentType} (
                {measurementPoints.length} {t("cutting.pointsFound")})
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleEditMode}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
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
                {isEditMode ? t("cutting.cancelEdit") : t("cutting.edit")}
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={
                  !isEditMode ||
                  isSaving ||
                  !measurementPoints.some((p) => p.isChanged)
                }
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium text-white transition-colors duration-150 ${
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
                {isSaving ? t("cutting.saving") : t("cutting.saveChanges")}
              </button>
            </div>
          </div>
          <p
            className={`mb-3 text-xs italic ${
              isEditMode ? "text-indigo-600" : "text-gray-500"
            }`}
          >
            {isEditMode
              ? t("cutting.editModeOnMsg")
              : t("cutting.editModeOffMsg")}
          </p>
          <div className="overflow-x-auto shadow-md rounded-lg max-h-[60vh]">
            <table className="min-w-full w-max border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-100 text-xs uppercase text-gray-700">
                <tr>
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
                    "panelIndexName",
                    "panelIndexNameKhmer",
                    "panelIndexNameChinese",
                    "action"
                  ].map(
                    (
                      headerKey // Added 'action' header
                    ) => (
                      <th
                        key={headerKey}
                        scope="col"
                        className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap"
                      >
                        {t(`cutting.${headerKey}`)}
                      </th>
                    )
                  )}
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
                    <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                      <input
                        type="text"
                        value={point.pointNameEng}
                        readOnly
                        className={`${inputDisabledStyle} text-xs py-1.5`}
                      />
                    </td>
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
                    <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
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
                    {/* ** NEW: Action Cell with Delete Button ** */}
                    <td className="px-3 py-2 border-gray-300 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleDeletePoint(point._id)}
                        disabled={isDeleting === point._id || isSaving} // Disable if this point is being deleted or if any save is in progress
                        title={t(
                          "cutting.deleteThisPoint",
                          "Delete this measurement point"
                        )}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting === point._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
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
            {t("cutting.noPointsFoundTitle")}
          </p>
          <p className="text-sm">{t("cutting.noPointsFoundMsg")}</p>
        </div>
      )}
      {!selectedGarmentType && moNo && !isLoading && (
        <div className="text-center py-10 text-gray-500">
          <p className="text-md">{t("cutting.pleaseSelectPanel")}</p>
        </div>
      )}
    </div>
  );
};

export default CuttingMeasurementPointsModify;
