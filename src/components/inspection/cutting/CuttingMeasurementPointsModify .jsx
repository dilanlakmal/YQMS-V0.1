import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";

const CuttingMeasurementPointsModify = () => {
  const { t } = useTranslation();
  const [moNo, setMoNo] = useState("");
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const moNoDropdownRef = useRef(null);
  const [selectedGarmentType, setSelectedGarmentType] = useState("");
  const [garmentTypes, setGarmentTypes] = useState([]);
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch MO No options from CuttingMeasurementPoint
  useEffect(() => {
    const fetchMoNumbers = async () => {
      if (moNoSearch.trim() === "") {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        return;
      }
      try {
        console.log("Fetching MO Numbers for search term:", moNoSearch);
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-mo-numbers`,
          {
            params: { search: moNoSearch },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        console.log("MO Numbers response:", response.data);
        setMoNoOptions(response.data);
        setShowMoNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Error fetching MO numbers:", error);
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
      }
    };
    fetchMoNumbers();
  }, [moNoSearch]);

  // Fetch Garment Types (panels)
  useEffect(() => {
    const fetchGarmentTypes = async () => {
      try {
        console.log("Fetching Garment Types");
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-panels`,
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        console.log("Garment Types response:", response.data);
        setGarmentTypes(response.data);
      } catch (error) {
        console.error("Error fetching garment types:", error);
        setGarmentTypes([]);
      }
    };
    fetchGarmentTypes();
  }, []);

  // Fetch measurement points when MO No and Garment Type change
  useEffect(() => {
    const fetchMeasurementPoints = async () => {
      if (!moNo || !selectedGarmentType) {
        setMeasurementPoints([]);
        return;
      }
      try {
        console.log(
          "Fetching Measurement Points for moNo:",
          moNo,
          "panel:",
          selectedGarmentType
        );
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-points`,
          {
            params: { moNo, panel: selectedGarmentType },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        console.log("Measurement Points response:", response.data);
        setMeasurementPoints(
          response.data.map((point) => ({
            _id: point._id,
            no: point.no,
            moNo: point.moNo,
            panel: point.panel,
            pointName: point.pointName,
            pointNameEng: point.pointNameEng,
            pointNameKhmer: point.pointNameKhmer,
            panelName: point.panelName,
            panelSide: point.panelSide,
            panelDirection: point.panelDirection,
            measurementSide: point.measurementSide,
            panelIndex: point.panelIndex,
            panelIndexName: point.panelIndexName,
            panelIndexNameKhmer: point.panelIndexNameKhmer
          }))
        );
      } catch (error) {
        console.error("Error fetching measurement points:", error);
        setMeasurementPoints([]);
      }
    };
    fetchMeasurementPoints();
  }, [moNo, selectedGarmentType]);

  // Sync pointName with pointNameEng
  useEffect(() => {
    setMeasurementPoints((prevPoints) =>
      prevPoints.map((point) => ({
        ...point,
        pointName: point.pointNameEng // Sync pointName with pointNameEng
      }))
    );
  }, [measurementPoints.map((point) => point.pointNameEng).join(",")]);

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

  // Handle Garment Type change
  const handleGarmentTypeChange = (e) => {
    const newValue = e.target.value;
    console.log("Selected Garment Type:", newValue);
    setSelectedGarmentType(newValue);
    setMeasurementPoints([]);
  };

  // Handle changes to measurement points
  const handlePointChange = (index, field, value) => {
    const updatedPoints = [...measurementPoints];
    updatedPoints[index][field] =
      field === "panelIndex" ? Number(value) : value;
    setMeasurementPoints(updatedPoints);
  };

  // Toggle Edit Mode
  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev);
  };

  // Save data to backend
  const handleSave = async () => {
    if (
      measurementPoints.some(
        (p) =>
          !p.pointName ||
          !p.pointNameEng ||
          !p.pointNameKhmer ||
          !p.panelName ||
          !p.panelSide ||
          !p.panelDirection ||
          !p.measurementSide ||
          !p.panelIndex ||
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
    try {
      for (const point of measurementPoints) {
        await axios.put(
          `${API_BASE_URL}/api/update-measurement-point/${point._id}`,
          {
            pointName: point.pointName,
            pointNameEng: point.pointNameEng,
            pointNameKhmer: point.pointNameKhmer,
            panelName: point.panelName,
            panelSide: point.panelSide,
            panelDirection: point.panelDirection,
            measurementSide: point.measurementSide,
            panelIndex: point.panelIndex,
            panelIndexName: point.panelIndexName,
            panelIndexNameKhmer: point.panelIndexNameKhmer
          },
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
      }
      Swal.fire({
        icon: "success",
        title: t("cutting.success"),
        text: t("cutting.dataSaved")
      });
      // Reset data
      setMoNo("");
      setMoNoSearch("");
      setSelectedGarmentType("");
      setMeasurementPoints([]);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving data:", error);
      Swal.fire({
        icon: "error",
        title: t("cutting.error"),
        text: t("cutting.failedToSaveData")
      });
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
  const panelDirectionOptions = ["Left", "Right", "NA"];
  const measurementSideOptions = ["Length", "Width", "NA"];

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      {/* MO No Search and Garment Type Selection */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">
            {t("cutting.moNo")}
          </label>
          <div className="relative" ref={moNoDropdownRef}>
            <input
              type="text"
              value={moNoSearch}
              onChange={(e) => setMoNoSearch(e.target.value)}
              placeholder={t("cutting.search_mono")}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            {showMoNoDropdown && moNoOptions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto">
                {moNoOptions.map((option, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      console.log("Selected MO No:", option);
                      setMoNo(option);
                      setMoNoSearch(option);
                      setShowMoNoDropdown(false);
                      setSelectedGarmentType("");
                      setMeasurementPoints([]);
                    }}
                    className="p-2 hover:bg-blue-100 cursor-pointer text-sm"
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {moNo && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700">
              {t("cutting.panel")}
            </label>
            <select
              value={selectedGarmentType}
              onChange={handleGarmentTypeChange}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("cutting.selectGarmentType")}</option>
              {garmentTypes.map((type, index) => (
                <option key={index} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Measurement Points Table */}
      {selectedGarmentType && measurementPoints.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">
              {t("cutting.modifymeasurementPoint")} (MO No: {moNo}, Panel:{" "}
              {selectedGarmentType})
            </h2>
            <button
              onClick={toggleEditMode}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isEditMode
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {isEditMode ? t("cutting.activate") : t("cutting.edit")}
            </button>
          </div>
          <div className="max-h-120 overflow-y-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="sticky top-0 bg-gray-200">
                <tr>
                  <th className="border border-gray-300 p-2 w-48 text-xs font-medium">
                    {t("cutting.measurementDetails")}
                  </th>
                  <th className="border border-gray-300 p-2 w-48 text-xs font-medium">
                    {t("cutting.measurementPoint")}
                  </th>
                  <th className="border border-gray-300 p-2 w-48 text-xs font-medium">
                    {t("cutting.measurementPointKhmer")}
                  </th>
                  <th className="border border-gray-300 p-2 w-32 text-xs font-medium">
                    {t("cutting.panelName")}
                  </th>
                  <th className="border border-gray-300 p-2 w-32 text-xs font-medium">
                    {t("cutting.side")}
                  </th>
                  <th className="border border-gray-300 p-2 w-32 text-xs font-medium">
                    {t("cutting.direction")}
                  </th>
                  <th className="border border-gray-300 p-2 w-32 text-xs font-medium">
                    {t("cutting.lw")}
                  </th>
                  <th className="border border-gray-300 p-2 w-16 text-xs font-medium">
                    {t("cutting.panelIndex")}
                  </th>
                  <th className="border border-gray-300 p-2 w-32 text-xs font-medium">
                    {t("cutting.panelName")}
                  </th>
                  <th className="border border-gray-300 p-2 w-32 text-xs font-medium">
                    {t("cutting.panelNameKhmer")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {measurementPoints.map((point, index) => (
                  <tr key={point._id}>
                    <td className="border border-gray-300 p-2 w-32 text-xs">
                      <input
                        type="text"
                        value={point.pointName}
                        readOnly
                        className="w-full p-1 border border-gray-300 rounded bg-gray-100 text-xs"
                      />
                    </td>
                    <td className="border border-gray-300 p-2 w-20 text-xs">
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
                        className={`w-full p-1 border border-gray-300 rounded text-xs ${
                          !isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      />
                    </td>
                    <td className="border border-gray-300 p-2 w-20 text-xs">
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
                        className={`w-full p-1 border border-gray-300 rounded text-xs ${
                          !isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      />
                    </td>
                    <td className="border border-gray-300 p-2 w-32 text-xs">
                      <select
                        value={point.panelName}
                        onChange={(e) =>
                          handlePointChange(index, "panelName", e.target.value)
                        }
                        disabled={!isEditMode}
                        className={`w-full p-1 border border-gray-300 rounded text-xs ${
                          !isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      >
                        {panelNameOptions.map((option, i) => (
                          <option key={i} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-2 w-20 text-xs">
                      <select
                        value={point.panelSide}
                        onChange={(e) =>
                          handlePointChange(index, "panelSide", e.target.value)
                        }
                        disabled={!isEditMode}
                        className={`w-full p-1 border border-gray-300 rounded text-xs ${
                          !isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      >
                        {panelSideOptions.map((option, i) => (
                          <option key={i} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-2 w-20 text-xs">
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
                        className={`w-full p-1 border border-gray-300 rounded text-xs ${
                          !isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      >
                        {panelDirectionOptions.map((option, i) => (
                          <option key={i} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-2 w-20 text-xs">
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
                        className={`w-full p-1 border border-gray-300 rounded text-xs ${
                          !isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      >
                        {measurementSideOptions.map((option, i) => (
                          <option key={i} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-2 w-20 text-xs">
                      <input
                        type="number"
                        value={point.panelIndex}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "panelIndex",
                            Number(e.target.value)
                          )
                        }
                        disabled={!isEditMode}
                        className={`w-full p-1 border border-gray-300 rounded text-xs ${
                          !isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      />
                    </td>
                    <td className="border border-gray-300 p-2 w-20 text-xs">
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
                        className={`w-full p-1 border border-gray-300 rounded text-xs ${
                          !isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      />
                    </td>
                    <td className="border border-gray-300 p-2 w-20 text-xs">
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
                        className={`w-full p-1 border border-gray-300 rounded text-xs ${
                          !isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {isEditMode ? t("cutting.editModeOn") : t("cutting.editModeOff")}
          </div>
          <button
            onClick={handleSave}
            disabled={!isEditMode}
            className={`mt-4 px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              isEditMode
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {t("cutting.save")}
          </button>
        </div>
      )}
    </div>
  );
};

export default CuttingMeasurementPointsModify;
