// src/components/inspection/cutting/CuttingInspectionManage.jsx
import axios from "axios";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import {
  Search,
  XCircle,
  Loader2,
  ChevronDown,
  FileEdit,
  Trash2,
  Info
} from "lucide-react";
import CuttingInspectionDeleteData from "./CuttingInspectionDeleteData"; // New Child
import CuttingInspectionEditData from "./CuttingInspectionEditData"; // New Child

const CuttingInspectionManage = () => {
  const { t } = useTranslation();
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [selectedMoNo, setSelectedMoNo] = useState("");
  const moNoDropdownRef = useRef(null);

  const [tableNoSearch, setTableNoSearch] = useState("");
  const [tableNoOptions, setTableNoOptions] = useState([]);
  const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
  const [selectedTableNo, setSelectedTableNo] = useState("");
  const tableNoDropdownRef = useRef(null);

  const [inspectionRecord, setInspectionRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ** NEW STATE to control which view is active (delete or modify) **
  const [activeView, setActiveView] = useState(null); // null, 'delete', or 'modify'

  const inputNormalStyle =
    "block w-full text-sm rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3";
  const inputDisabledStyle =
    "block w-full text-sm rounded-md shadow-sm bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500 py-2.5 px-3";

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
          `${API_BASE_URL}/api/cutting-inspections/mo-numbers`,
          { params: { search: moNoSearch } }
        );
        setMoNoOptions(response.data || []);
        setShowMoNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Error fetching MOs:", error);
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
      } finally {
        setIsLoading(false);
      }
    };
    const debounceFetch = setTimeout(fetchMoNumbers, 300);
    return () => clearTimeout(debounceFetch);
  }, [moNoSearch]);

  useEffect(() => {
    const fetchTableNumbers = async () => {
      if (!selectedMoNo || tableNoSearch.trim() === "") {
        setTableNoOptions([]);
        setShowTableNoDropdown(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/table-numbers`,
          { params: { moNo: selectedMoNo, search: tableNoSearch } }
        );
        setTableNoOptions(response.data || []);
        setShowTableNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Error fetching Tables:", error);
        setTableNoOptions([]);
        setShowTableNoDropdown(false);
      } finally {
        setIsLoading(false);
      }
    };
    const debounceFetch = setTimeout(fetchTableNumbers, 300);
    return () => clearTimeout(debounceFetch);
  }, [selectedMoNo, tableNoSearch]);

  const fetchFullRecordForManagement = useCallback(async () => {
    if (!selectedMoNo || !selectedTableNo) {
      setInspectionRecord(null);
      setActiveView(null); // Reset view if selection changes
      return;
    }
    setIsLoading(true);
    setActiveView(null); // Reset view while loading new record
    try {
      // Using a generic endpoint name, ensure it fetches ALL necessary data for both delete & modify
      const response = await axios.get(
        `${API_BASE_URL}/api/cutting-inspection-full-details`,
        {
          params: { moNo: selectedMoNo, tableNo: selectedTableNo }
        }
      );
      setInspectionRecord(response.data);
      // Don't automatically set activeView here, let user choose
    } catch (error) {
      console.error("Error fetching full inspection record:", error);
      setInspectionRecord(null);
      if (error.response && error.response.status === 404) {
        Swal.fire({
          icon: "info",
          title: t("cuttingReport.notFoundTitle"),
          text: t("cuttingReport.noRecordFoundForMoTable")
        });
      } else {
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cuttingReport.failedToFetchRecord")
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedMoNo, selectedTableNo, t]);

  // This effect will run when user makes final selection of MO and Table No
  // However, we don't fetch immediately. User clicks Modify or Delete button.
  // We might fetch a summary here, or wait for user action. For simplicity, let's fetch when both are selected.
  useEffect(() => {
    if (selectedMoNo && selectedTableNo) {
      // At this point, we could fetch a summary or the full record.
      // Let's fetch the full record once and pass it to children.
      fetchFullRecordForManagement();
    } else {
      setInspectionRecord(null);
      setActiveView(null);
    }
  }, [selectedMoNo, selectedTableNo, fetchFullRecordForManagement]);

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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetSelections = () => {
    setMoNoSearch("");
    setSelectedMoNo("");
    setTableNoSearch("");
    setSelectedTableNo("");
    setInspectionRecord(null);
    setActiveView(null);
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-4">
        {t("cuttingReport.manageTitle")}
      </h1>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-8 items-end">
        {/* MO No Search */}
        <div className="space-y-1">
          <label
            htmlFor="moNoSearchManage"
            className="block text-sm font-medium text-gray-700"
          >
            {t("cutting.moNo")}
          </label>
          <div className="relative" ref={moNoDropdownRef}>
            {/* MO Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isLoading && !selectedMoNo ? (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                id="moNoSearchManage"
                type="text"
                value={moNoSearch}
                onChange={(e) => {
                  setMoNoSearch(e.target.value);
                  setSelectedMoNo("");
                  setSelectedTableNo("");
                  setTableNoSearch("");
                  setInspectionRecord(null);
                  setActiveView(null);
                }}
                onFocus={() =>
                  moNoOptions.length > 0 && setShowMoNoDropdown(true)
                }
                placeholder={t("cutting.search_mono_placeholder")}
                className={`${inputNormalStyle} pl-10 py-2.5`}
              />
              {moNoSearch && (
                <button
                  type="button"
                  onClick={resetSelections}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={t("cutting.clearSearch")}
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* MO Dropdown */}
            {showMoNoDropdown && moNoOptions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                {moNoOptions.map((option, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setSelectedMoNo(option);
                      setMoNoSearch(option);
                      setShowMoNoDropdown(false);
                      setSelectedTableNo("");
                      setTableNoSearch("");
                      setActiveView(null);
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

        {/* Table No Search */}
        <div
          className={`space-y-1 ${
            !selectedMoNo ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <label
            htmlFor="tableNoSearchManage"
            className="block text-sm font-medium text-gray-700"
          >
            {t("cutting.tableNo")}
          </label>
          <div className="relative" ref={tableNoDropdownRef}>
            {/* Table Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isLoading && selectedMoNo && !selectedTableNo ? (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                id="tableNoSearchManage"
                type="text"
                value={tableNoSearch}
                onChange={(e) => {
                  setTableNoSearch(e.target.value);
                  setSelectedTableNo("");
                  setActiveView(null);
                }}
                onFocus={() =>
                  tableNoOptions.length > 0 && setShowTableNoDropdown(true)
                }
                placeholder={t("cutting.search_table_placeholder")}
                className={`${
                  selectedMoNo ? inputNormalStyle : inputDisabledStyle
                } pl-10 py-2.5`}
                disabled={!selectedMoNo}
              />
              {tableNoSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setTableNoSearch("");
                    setSelectedTableNo("");
                    setActiveView(null);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={t("cutting.clearSearch")}
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Table Dropdown */}
            {showTableNoDropdown && tableNoOptions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                {tableNoOptions.map((option, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setSelectedTableNo(option.tableNo || option);
                      setTableNoSearch(option.tableNo || option);
                      setShowTableNoDropdown(false);
                      setActiveView(null);
                    }}
                    className="px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                  >
                    {option.tableNo || option}
                  </li>
                ))}
              </ul>
            )}
            {showTableNoDropdown &&
              !isLoading &&
              selectedMoNo &&
              tableNoSearch &&
              tableNoOptions.length === 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 p-3 text-sm text-gray-500 shadow-lg">
                  {t("cutting.noTableFoundForMo")}
                </div>
              )}
          </div>
        </div>

        {/* Action Buttons (Modify/Delete) - Visible only when MO and Table are selected */}
        {selectedMoNo && selectedTableNo && inspectionRecord && !isLoading && (
          <div className="flex items-end space-x-3">
            <button
              onClick={() => setActiveView("modify")}
              className={`flex items-center justify-center px-4 py-2.5 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
                                ${
                                  activeView === "modify"
                                    ? "bg-indigo-600 text-white border-indigo-600 focus:ring-indigo-500"
                                    : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50 focus:ring-indigo-500"
                                }`}
            >
              <FileEdit size={18} className="mr-2" />
              {t("cuttingReport.modifyButton", "Modify Record")}
            </button>
            <button
              onClick={() => setActiveView("delete")}
              className={`flex items-center justify-center px-4 py-2.5 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
                                ${
                                  activeView === "delete"
                                    ? "bg-red-600 text-white border-red-600 focus:ring-red-500"
                                    : "bg-white text-red-700 border-red-300 hover:bg-red-50 focus:ring-red-500"
                                }`}
            >
              <Trash2 size={18} className="mr-2" />
              {t("cuttingReport.deleteButton", "Delete Options")}
            </button>
          </div>
        )}
      </div>

      {isLoading && selectedMoNo && selectedTableNo && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="ml-3 text-gray-600">
            {t("cuttingReport.loadingRecord")}
          </p>
        </div>
      )}

      {/* Conditionally render Delete or Modify component */}
      {inspectionRecord && !isLoading && (
        <>
          {activeView === "delete" && (
            <CuttingInspectionDeleteData
              inspectionRecord={inspectionRecord}
              onRecordDeleted={resetSelections} // To clear form after full delete
              onSizeDeleted={fetchFullRecordForManagement} // To refresh after size delete
            />
          )}
          {activeView === "modify" && (
            <CuttingInspectionEditData
              inspectionRecord={inspectionRecord}
              onRecordModified={fetchFullRecordForManagement} // To refresh after modification
              key={inspectionRecord._id} // Re-mount if record changes
            />
          )}
        </>
      )}

      {!inspectionRecord && selectedMoNo && selectedTableNo && !isLoading && (
        <div className="mt-8 text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Info size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="font-medium">{t("cuttingReport.noRecordFoundTitle")}</p>
          <p className="text-xs">
            {t("cuttingReport.noRecordFoundForSelection")}
          </p>
        </div>
      )}
      {!selectedMoNo && !selectedTableNo && !isLoading && (
        <div className="mt-8 text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Info size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="font-medium">
            {t(
              "cuttingReport.pleaseSelectMoAndTable",
              "Please select an MO and Table No to manage."
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default CuttingInspectionManage;
