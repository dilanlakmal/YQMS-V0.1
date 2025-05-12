import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";

const CuttingOrderModify = () => {
  const { t } = useTranslation();
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

  // Fetch MO No options from CutPanelOrders
  useEffect(() => {
    const fetchMoNumbers = async () => {
      if (moNoSearch.trim() === "") {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutpanel-orders-mo-numbers`,
          {
            params: { search: moNoSearch },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setMoNoOptions(response.data);
        setShowMoNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Error fetching MO numbers:", error);
      }
    };
    fetchMoNumbers();
  }, [moNoSearch]);

  // Fetch Table Nos when MO No changes
  useEffect(() => {
    const fetchTableNos = async () => {
      if (!moNo) {
        setTableNos([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutpanel-orders-table-nos`,
          {
            params: { styleNo: moNo },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setTableNos(response.data);
      } catch (error) {
        console.error("Error fetching Table Nos:", error);
        setTableNos([]);
      }
    };
    fetchTableNos();
  }, [moNo]);

  // Fetch Garment Types (panels)
  useEffect(() => {
    const fetchGarmentTypes = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-panels`,
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setGarmentTypes(response.data);
      } catch (error) {
        console.error("Error fetching garment types:", error);
      }
    };
    fetchGarmentTypes();
  }, []);

  // Fetch panelIndexNames when Garment Type changes
  useEffect(() => {
    const fetchPanelIndexNames = async () => {
      if (!selectedGarmentType) {
        setPanelIndexNames([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-panel-index-names`,
          {
            params: { panel: selectedGarmentType },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setPanelIndexNames(response.data);
      } catch (error) {
        console.error("Error fetching panel index names:", error);
      }
    };
    fetchPanelIndexNames();
  }, [selectedGarmentType]);

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
    setSelectedGarmentType(e.target.value);
    setAdditionalPoints([]);
  };

  // Handle adding a new measurement point
  const handleAddPoint = async () => {
    let newPanelIndex = 1;
    if (selectedGarmentType) {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-max-panel-index`,
          {
            params: { panel: selectedGarmentType },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        newPanelIndex = (response.data.maxPanelIndex || 0) + 1;
      } catch (error) {
        console.error("Error fetching max panel index:", error);
      }
    }
    const prevPoint = additionalPoints[additionalPoints.length - 1];
    setAdditionalPoints([
      ...additionalPoints,
      {
        panelIndexName: prevPoint?.panelIndexName || "",
        panelIndex: prevPoint?.panelIndexName
          ? prevPoint.panelIndex
          : newPanelIndex,
        panelIndexNameKhmer: prevPoint?.panelIndexNameKhmer || "",
        panelName: "NA",
        panelSide: "NA",
        panelDirection: "NA",
        measurementSide: "NA",
        measurementPointEng: "",
        measurementPointKhmer: ""
      }
    ]);
  };

  // Handle changes to additional points
  const handlePointChange = async (index, field, value) => {
    const updatedPoints = [...additionalPoints];
    if (field === "panelIndexName") {
      const selectedPanel = panelIndexNames.find(
        (p) => p.panelIndexName === value
      );
      if (selectedPanel) {
        updatedPoints[index].panelIndexName = value;
        updatedPoints[index].panelIndex = selectedPanel.panelIndex;
        updatedPoints[index].panelIndexNameKhmer =
          selectedPanel.panelIndexNameKhmer;
      } else {
        updatedPoints[index].panelIndexName = value;
        updatedPoints[index].panelIndexNameKhmer = "";
        // Do not auto-assign panelIndex here; let user type it
        updatedPoints[index].panelIndex = updatedPoints[index].panelIndex || 1;
      }
    } else {
      updatedPoints[index][field] = value;
    }
    setAdditionalPoints(updatedPoints);
  };

  // Save data to backend
  const handleSave = async () => {
    if (
      !moNo ||
      !selectedGarmentType ||
      additionalPoints.some(
        (p) =>
          !p.panelIndexName ||
          !p.panelIndex ||
          !p.panelIndexNameKhmer ||
          !p.panelName ||
          !p.panelSide ||
          !p.panelDirection ||
          !p.measurementSide ||
          !p.measurementPointEng ||
          !p.measurementPointKhmer
      )
    ) {
      alert(t("cutting.fillRequiredFields"));
      return;
    }
    try {
      for (const point of additionalPoints) {
        await axios.post(
          `${API_BASE_URL}/api/save-measurement-point`,
          {
            moNo,
            panel: selectedGarmentType,
            pointName: point.measurementPointEng,
            pointNameEng: point.measurementPointEng,
            pointNameKhmer: point.measurementPointKhmer,
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
      alert(t("cutting.dataSaved"));
      setAdditionalPoints([]);
    } catch (error) {
      console.error("Error saving data:", error);
      alert(t("cutting.failedToSaveData"));
    }
  };

  const panelNameOptions = ["Body", "Sleeve", "Hat", "Neck", "Pocket", "NA"];
  const panelSideOptions = ["Front", "Back", "NA"];
  const panelDirectionOptions = ["Left", "Right", "NA"];
  const measurementSideOptions = ["Length", "Width", "NA"];

  return (
    <div className="p-6">
      {/* MO No Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {t("cutting.moNo")}
        </label>
        <div className="relative" ref={moNoDropdownRef}>
          <input
            type="text"
            value={moNoSearch}
            onChange={(e) => setMoNoSearch(e.target.value)}
            placeholder={t("cutting.search_mono")}
            className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
          />
          {showMoNoDropdown && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
              {moNoOptions.map((option, index) => (
                <li
                  key={index}
                  onClick={() => {
                    setMoNo(option);
                    setMoNoSearch(option);
                    setShowMoNoDropdown(false);
                  }}
                  className="p-2 hover:bg-blue-100 cursor-pointer"
                >
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Table Nos and Total Cutting Tables */}
      {tableNos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-2">{t("cutting.tableNo")}</h2>
          <p className="mb-2">{tableNos.join(", ")}</p>
          <h2 className="text-sm font-semibold mb-2">
            {t("cutting.totalCuttingTables")}
          </h2>
          <p>{tableNos.length}</p>
        </div>
      )}

      {/* Garment Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {t("cutting.panel")}
        </label>
        <select
          value={selectedGarmentType}
          onChange={handleGarmentTypeChange}
          className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
        >
          <option value="">{t("cutting.selectGarmentType")}</option>
          {garmentTypes.map((type, index) => (
            <option key={index} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Additional Measurement Points Table */}
      {selectedGarmentType && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            {t("cutting.addAdditionalPoints")}
          </h2>
          <button
            onClick={handleAddPoint}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {t("cutting.addPoint")}
          </button>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2">
                    {t("cutting.panelName")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.panelIndex")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.panelNameKhmer")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.panelName")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.side")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.direction")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.lw")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.measurementPoint")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.measurementPointKhmer")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {additionalPoints.map((point, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">
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
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                      <datalist id={`panel-index-options-${index}`}>
                        {panelIndexNames.map((item, i) => (
                          <option key={i} value={item.panelIndexName} />
                        ))}
                      </datalist>
                    </td>
                    <td className="border border-gray-300 p-2">
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
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
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
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <select
                        value={point.panelName}
                        onChange={(e) =>
                          handlePointChange(index, "panelName", e.target.value)
                        }
                        className="w-full p-1 border border-gray-300 rounded"
                      >
                        {panelNameOptions.map((option, i) => (
                          <option key={i} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <select
                        value={point.panelSide}
                        onChange={(e) =>
                          handlePointChange(index, "panelSide", e.target.value)
                        }
                        className="w-full p-1 border border-gray-300 rounded"
                      >
                        {panelSideOptions.map((option, i) => (
                          <option key={i} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <select
                        value={point.panelDirection}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "panelDirection",
                            e.target.value
                          )
                        }
                        className="w-full p-1 border border-gray-300 rounded"
                      >
                        {panelDirectionOptions.map((option, i) => (
                          <option key={i} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <select
                        value={point.measurementSide}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "measurementSide",
                            e.target.value
                          )
                        }
                        className="w-full p-1 border border-gray-300 rounded"
                      >
                        {measurementSideOptions.map((option, i) => (
                          <option key={i} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-2">
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
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
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
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleSave}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            {t("cutting.save")}
          </button>
        </div>
      )}
    </div>
  );
};

export default CuttingOrderModify;
