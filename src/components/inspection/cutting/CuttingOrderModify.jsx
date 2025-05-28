import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import {
  PlusCircle,
  Save,
  Search,
  XCircle,
  ChevronDown,
  Trash2,
  Loader2,
  Info,
  AlertTriangle
} from "lucide-react";

const CuttingOrderModify = () => {
  const { t, i18n } = useTranslation();
  const [moNo, setMoNo] = useState("");
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const moNoDropdownRef = useRef(null);
  const [tableNos, setTableNos] = useState([]);
  const [selectedGarmentType, setSelectedGarmentType] = useState("");
  const [garmentTypes, setGarmentTypes] = useState([]);
  const [panelIndexNames, setPanelIndexNames] = useState([]);
  const [additionalPoints, setAdditionalPoints] = useState([]);

  const [isLoading, setIsLoading] = useState(false); // Simplified to a single boolean for general data fetching
  const [isFetchingMo, setIsFetchingMo] = useState(false); // Specific for MO search
  const [isFetchingMaxIndex, setIsFetchingMaxIndex] = useState(false); // Specific for max panel index
  const [isSaving, setIsSaving] = useState(false);

  const inputBaseStyle = "block w-full text-sm rounded-md shadow-sm";
  const inputNormalStyle = `${inputBaseStyle} border-gray-300 focus:border-indigo-500 focus:ring-indigo-500`;
  const inputDisabledStyle = `${inputBaseStyle} bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500`;

  useEffect(() => {
    const fetchMoNumbers = async () => {
      if (moNoSearch.trim() === "") {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        return;
      }
      setIsFetchingMo(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutpanel-orders-mo-numbers`,
          { params: { search: moNoSearch } }
        );
        setMoNoOptions(response.data);
        setShowMoNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Error fetching MO numbers:", error);
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
      } finally {
        setIsFetchingMo(false);
      }
    };
    const debounceFetch = setTimeout(fetchMoNumbers, 300);
    return () => clearTimeout(debounceFetch);
  }, [moNoSearch]);

  useEffect(() => {
    const fetchTableNos = async () => {
      if (!moNo) {
        setTableNos([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutpanel-orders-table-nos`,
          { params: { styleNo: moNo } }
        );
        setTableNos(response.data || []);
      } catch (error) {
        console.error("Error fetching Table Nos:", error);
        setTableNos([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTableNos();
  }, [moNo]);

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

  useEffect(() => {
    const fetchPanelIndexNames = async () => {
      if (!selectedGarmentType) {
        setPanelIndexNames([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-panel-index-names`,
          { params: { panel: selectedGarmentType } }
        );
        setPanelIndexNames(response.data);
      } catch (error) {
        console.error("Error fetching panel index names:", error);
        setPanelIndexNames([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPanelIndexNames();
  }, [selectedGarmentType]);

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
    setAdditionalPoints([]);
  };

  const handleAddPoint = async () => {
    setIsFetchingMaxIndex(true);
    let newPanelIndex = 1;
    if (selectedGarmentType) {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-max-panel-index`,
          { params: { panel: selectedGarmentType } }
        );
        newPanelIndex = (response.data.maxPanelIndex || 0) + 1;
      } catch (error) {
        console.error("Error fetching max panel index:", error);
      }
    }
    setIsFetchingMaxIndex(false);

    const prevPoint = additionalPoints[additionalPoints.length - 1];
    setAdditionalPoints((prev) => [
      ...prev,
      {
        panelIndexName: "",
        panelIndex: newPanelIndex,
        panelIndexNameKhmer: "",
        panelIndexNameChinese: "",
        panelName: prevPoint?.panelName || "Body",
        panelSide: prevPoint?.panelSide || "Front",
        panelDirection: prevPoint?.panelDirection || "Center",
        measurementSide: prevPoint?.measurementSide || "Length",
        measurementPointEng: "",
        measurementPointKhmer: "",
        pointNameChinese: "",
        isNew: true
      }
    ]);
  };

  const handlePointChange = (index, field, value) => {
    setAdditionalPoints((prevPoints) =>
      prevPoints.map((point, i) => {
        if (i === index) {
          const updatedPoint = { ...point, [field]: value };
          if (field === "panelIndexName") {
            const selectedPanelInfo = panelIndexNames.find(
              (p) => p.panelIndexName === value
            );
            if (selectedPanelInfo) {
              updatedPoint.panelIndex = selectedPanelInfo.panelIndex;
              updatedPoint.panelIndexNameKhmer =
                selectedPanelInfo.panelIndexNameKhmer || "";
              updatedPoint.panelIndexNameChinese =
                selectedPanelInfo.panelIndexNameChinese || "";
            } else {
              updatedPoint.panelIndexNameKhmer = "";
              updatedPoint.panelIndexNameChinese = "";
              // Keep existing panelIndex or let user set it if it's a truly new name
            }
          } else if (field === "panelIndex") {
            updatedPoint.panelIndex = value === "" ? null : Number(value);
            const matchingName = panelIndexNames.find(
              (p) => p.panelIndex === Number(value)
            );
            if (matchingName) {
              updatedPoint.panelIndexName = matchingName.panelIndexName;
              updatedPoint.panelIndexNameKhmer =
                matchingName.panelIndexNameKhmer || "";
              updatedPoint.panelIndexNameChinese =
                matchingName.panelIndexNameChinese || "";
            }
            // If no matching name, don't clear a potentially custom typed panelIndexName
          }
          return updatedPoint;
        }
        return point;
      })
    );
  };

  const handleRemovePoint = (index) => {
    setAdditionalPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!moNo || !selectedGarmentType || additionalPoints.length === 0) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.missingInformation"),
        text: t("cutting.fillMoPanelPoints")
      });
      return;
    }
    if (
      additionalPoints.some(
        (p) =>
          !p.panelIndexName ||
          p.panelIndex === null ||
          p.panelIndex === undefined ||
          !p.panelIndexNameKhmer ||
          !p.panelName ||
          !p.panelSide ||
          !p.panelDirection ||
          !p.measurementSide ||
          !p.measurementPointEng ||
          !p.measurementPointKhmer
      )
    ) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.missingInformation"),
        text: t("cutting.fillRequiredFieldsInTable")
      });
      return;
    }

    setIsSaving(true);
    try {
      const selectedGarment = garmentTypes.find(
        (type) => type.panel === selectedGarmentType
      );
      const panelKhmer = selectedGarment?.panelKhmer || selectedGarmentType;
      const panelChinese = selectedGarment?.panelChinese || selectedGarmentType;

      const savePromises = additionalPoints.map((point) =>
        axios.post(`${API_BASE_URL}/api/save-measurement-point`, {
          moNo,
          panel: selectedGarmentType,
          panelKhmer,
          panelChinese,
          pointName: point.measurementPointEng,
          pointNameEng: point.measurementPointEng,
          pointNameKhmer: point.measurementPointKhmer,
          pointNameChinese: point.pointNameChinese || "",
          panelName: point.panelName,
          panelSide: point.panelSide,
          panelDirection: point.panelDirection,
          measurementSide: point.measurementSide,
          panelIndex: Number(point.panelIndex),
          panelIndexName: point.panelIndexName,
          panelIndexNameKhmer: point.panelIndexNameKhmer,
          panelIndexNameChinese: point.panelIndexNameChinese || ""
        })
      );
      await Promise.all(savePromises);

      Swal.fire({
        icon: "success",
        title: t("cutting.success"),
        text: t("cutting.dataSaved")
      });
      setMoNo("");
      setMoNoSearch("");
      setSelectedGarmentType("");
      setAdditionalPoints([]);
      setTableNos([]);
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
    "Collar",
    "Waistband",
    "Other",
    "NA"
  ];
  const panelSideOptions = ["Front", "Back", "NA"];
  const panelDirectionOptions = ["Left", "Right", "NA"];
  const measurementSideOptions = ["Length", "Width", "NA"];

  return (
    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">
        {t(
          "cutting.addMeasurementPointsTitle",
          "Add Cutting Measurement Points"
        )}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-8 items-end">
        <div className="space-y-1">
          <label
            htmlFor="moNoSearchInputCOM"
            className="block text-sm font-medium text-gray-700"
          >
            {t("cutting.moNo")}
          </label>
          <div className="relative" ref={moNoDropdownRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isFetchingMo ? (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                id="moNoSearchInputCOM"
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
                    setAdditionalPoints([]);
                    setTableNos([]);
                    setShowMoNoDropdown(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={t("cutting.clearSearch", "Clear search")}
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
                      setAdditionalPoints([]);
                    }}
                    className="px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
            {showMoNoDropdown &&
              !isFetchingMo &&
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

        <div className="space-y-1">
          <label
            htmlFor="garmentTypeSelectCOM"
            className="block text-sm font-medium text-gray-700"
          >
            {t("cutting.panel")}
          </label>
          <div className="relative">
            <select
              id="garmentTypeSelectCOM"
              value={selectedGarmentType}
              onChange={handleGarmentTypeChange}
              disabled={!moNo || garmentTypes.length === 0 || isLoading}
              className={`${
                !moNo || garmentTypes.length === 0 || isLoading
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
              {isLoading && !isFetchingMo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </div>
      </div>

      {moNo && tableNos.length > 0 && !isLoading && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <h3 className="text-sm font-semibold text-indigo-700 mb-1">
            {t("cutting.tableNo")}
          </h3>
          <p className="text-sm text-indigo-600 break-all">
            {tableNos.join(", ")}
          </p>
          <h3 className="text-sm font-semibold text-indigo-700 mt-2 mb-1">
            {t("cutting.totalCuttingTables")}
          </h3>
          <p className="text-sm text-indigo-600 font-bold">{tableNos.length}</p>
        </div>
      )}
      {moNo && tableNos.length === 0 && !isLoading && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-center">
          <Info size={24} className="mx-auto text-yellow-600 mb-2" />
          <p className="text-sm text-yellow-700">
            {t(
              "cutting.noTableNosForMo",
              "No cutting tables found for the selected MO."
            )}
          </p>
        </div>
      )}

      {selectedGarmentType && moNo && (
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 pb-3 border-b border-gray-200 gap-3">
            <h2 className="text-lg font-semibold text-gray-800">
              {t("cutting.addAdditionalPoints")}
            </h2>
            <button
              onClick={handleAddPoint}
              disabled={isFetchingMaxIndex || isLoading}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:bg-indigo-300"
            >
              {isFetchingMaxIndex ? (
                <Loader2 size={18} className="animate-spin mr-2" />
              ) : (
                <PlusCircle size={18} className="mr-2" />
              )}
              {t("cutting.addPoint")}
            </button>
          </div>

          {additionalPoints.length === 0 && (
            <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Info size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">
                {t("cutting.noPointsAddedYet")}
              </p>
              <p className="text-xs text-gray-500">
                {t("cutting.clickAddPoint")}
              </p>
            </div>
          )}

          {additionalPoints.length > 0 && (
            <div className="overflow-x-auto shadow-md rounded-lg max-h-[60vh]">
              <table className="min-w-full w-max border-collapse">
                <thead className="sticky top-0 z-10 bg-gray-100 text-xs uppercase text-gray-700">
                  <tr>
                    {[
                      "panelIndexName",
                      "panelIndex",
                      "panelIndexNameKhmer",
                      "panelIndexNameChinese",
                      "panelName",
                      "side",
                      "direction",
                      "lw",
                      "measurementPoint",
                      "measurementPointKhmer",
                      "pointNameChinese",
                      "action"
                    ].map((headerKey) => (
                      <th
                        key={headerKey}
                        scope="col"
                        className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap"
                      >
                        {t(`cutting.${headerKey}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {additionalPoints.map((point, index) => (
                    <tr key={index} className="hover:bg-gray-50">
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
                          list={`panel-index-options-${index}`}
                          placeholder={t(
                            "cutting.typeOrSelect",
                            "Type or Select"
                          )}
                          className={`${inputNormalStyle} text-xs py-1.5`}
                        />
                        <datalist id={`panel-index-options-${index}`}>
                          {panelIndexNames.map((item, i) => (
                            <option key={i} value={item.panelIndexName} />
                          ))}
                        </datalist>
                      </td>
                      <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                        <input
                          type="number"
                          value={point.panelIndex || ""}
                          onChange={(e) =>
                            handlePointChange(
                              index,
                              "panelIndex",
                              e.target.value
                            )
                          }
                          className={`${inputNormalStyle} text-xs py-1.5 w-20 text-center`}
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
                          className={`${inputNormalStyle} text-xs py-1.5`}
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
                          className={`${inputNormalStyle} text-xs py-1.5`}
                        />
                      </td>
                      <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                        <select
                          value={point.panelName}
                          onChange={(e) =>
                            handlePointChange(
                              index,
                              "panelName",
                              e.target.value
                            )
                          }
                          className={`${inputNormalStyle} text-xs py-1.5`}
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
                            handlePointChange(
                              index,
                              "panelSide",
                              e.target.value
                            )
                          }
                          className={`${inputNormalStyle} text-xs py-1.5`}
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
                          className={`${inputNormalStyle} text-xs py-1.5`}
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
                          className={`${inputNormalStyle} text-xs py-1.5`}
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
                          type="text"
                          value={point.measurementPointEng}
                          onChange={(e) =>
                            handlePointChange(
                              index,
                              "measurementPointEng",
                              e.target.value
                            )
                          }
                          className={`${inputNormalStyle} text-xs py-1.5`}
                        />
                      </td>
                      <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                        <input
                          type="text"
                          value={point.measurementPointKhmer}
                          onChange={(e) =>
                            handlePointChange(
                              index,
                              "measurementPointKhmer",
                              e.target.value
                            )
                          }
                          className={`${inputNormalStyle} text-xs py-1.5`}
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
                          className={`${inputNormalStyle} text-xs py-1.5`}
                        />
                      </td>
                      <td className="px-3 py-2 border-gray-300 text-center">
                        <button
                          onClick={() => handleRemovePoint(index)}
                          title={t("cutting.removePoint", "Remove Point")}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {additionalPoints.length > 0 && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="flex items-center px-6 py-2.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin mr-2" />
                ) : (
                  <Save size={18} className="mr-2" />
                )}
                {isSaving
                  ? t("cutting.saving", "Saving...")
                  : t("cutting.saveAllPoints", "Save All Points")}
              </button>
            </div>
          )}
        </div>
      )}
      {!selectedGarmentType && moNo && !isLoading && (
        <div className="mt-8 text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <AlertTriangle size={40} className="mx-auto text-yellow-500 mb-3" />
          <p className="font-medium">
            {t(
              "cutting.selectPanelPrompt",
              "Please select a Panel/Garment Type."
            )}
          </p>
          <p className="text-xs">
            {t(
              "cutting.selectPanelToAddPoints",
              "Once a panel is selected, you can add new measurement points for it."
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default CuttingOrderModify;
