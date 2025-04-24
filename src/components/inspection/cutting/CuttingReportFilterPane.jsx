import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaFilePdf, FaSpinner } from "react-icons/fa";

const CuttingReportFilterPane = ({
  filters,
  setFilters,
  setCurrentPage,
  lastUpdated,
  onDownloadPDF,
  isGeneratingPDF
}) => {
  const { t } = useTranslation();
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    lotNos: [],
    buyers: [],
    colors: [],
    tableNos: []
  });
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const moNoRef = useRef(null);

  useEffect(() => {
    fetchMoNos();
  }, []);

  useEffect(() => {
    if (filters.moNo) fetchFilterOptions();
  }, [filters.moNo]);

  const fetchMoNos = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/cutting-inspection-mo-nos`
      );
      setMoNoOptions(response.data);
    } catch (error) {
      console.error("Error fetching MO Nos:", error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/cutting-inspection-filter-options`,
        {
          params: { moNo: filters.moNo }
        }
      );
      setFilterOptions({
        lotNos: response.data.lotNos,
        buyers: response.data.buyers,
        colors: response.data.colors,
        tableNos: response.data.tableNos
      });
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const formatTimestamp = (date) => {
    if (!date) return "Never";
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear();
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    const seconds = ("0" + date.getSeconds()).slice(-2);
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      if (key === "moNo") {
        newFilters.lotNo = "";
        newFilters.buyer = "";
        newFilters.color = "";
        newFilters.tableNo = "";
      }
      return newFilters;
    });
    setCurrentPage(0);
    if (key === "moNo") setShowMoNoDropdown(false);
  };

  const handleMoNoInput = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, moNo: value }));
    setShowMoNoDropdown(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moNoRef.current && !moNoRef.current.contains(event.target)) {
        setShowMoNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearFilters = () => {
    setFilters({
      startDate: new Date(),
      endDate: null,
      moNo: "",
      lotNo: "",
      buyer: "",
      color: "",
      tableNo: ""
    });
    setShowMoNoDropdown(false);
    setCurrentPage(0);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-sm font-semibold mb-4">
        {t("cuttingReport.filters")} -- Last Updated at{" "}
        {lastUpdated && `(${formatTimestamp(lastUpdated)})`}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("cuttingReport.startDate")}
          </label>
          <DatePicker
            selected={filters.startDate}
            onChange={(date) => handleFilterChange("startDate", date)}
            dateFormat="MM/dd/yyyy"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholderText={t("cuttingReport.startDate")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("cuttingReport.endDate")}
          </label>
          <DatePicker
            selected={filters.endDate}
            onChange={(date) => handleFilterChange("endDate", date)}
            dateFormat="MM/dd/yyyy"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholderText={t("cuttingReport.endDate")}
          />
        </div>
        <div ref={moNoRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("cuttingReport.moNo")}
          </label>
          <input
            type="text"
            value={filters.moNo}
            onChange={handleMoNoInput}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder={t("cuttingReport.moNo")}
          />
          {showMoNoDropdown && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
              {moNoOptions
                .filter((mo) =>
                  mo.toLowerCase().includes(filters.moNo.toLowerCase())
                )
                .map((mo) => (
                  <li
                    key={mo}
                    onClick={() => handleFilterChange("moNo", mo)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {mo}
                  </li>
                ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("cuttingReport.lotNo")}
          </label>
          <select
            value={filters.lotNo}
            onChange={(e) => handleFilterChange("lotNo", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={!filters.moNo}
          >
            <option value="">{t("cuttingReport.selectLotNo")}</option>
            {filterOptions.lotNos.map((lot) => (
              <option key={lot} value={lot}>
                {lot}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("cuttingReport.buyer")}
          </label>
          <select
            value={filters.buyer}
            onChange={(e) => handleFilterChange("buyer", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={!filters.moNo}
          >
            <option value="">{t("cuttingReport.selectBuyer")}</option>
            {filterOptions.buyers.map((buyer) => (
              <option key={buyer} value={buyer}>
                {buyer}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("cuttingReport.color")}
          </label>
          <select
            value={filters.color}
            onChange={(e) => handleFilterChange("color", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={!filters.moNo}
          >
            <option value="">{t("cuttingReport.selectColor")}</option>
            {filterOptions.colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("cuttingReport.tableNo")}
          </label>
          <select
            value={filters.tableNo}
            onChange={(e) => handleFilterChange("tableNo", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={!filters.moNo}
          >
            <option value="">{t("cuttingReport.selectTableNo")}</option>
            {filterOptions.tableNos.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 whitespace-nowrap"
          >
            Clear Filters
          </button>
          <button
            onClick={onDownloadPDF}
            disabled={isGeneratingPDF}
            className={`px-3 py-2 text-white rounded-md flex items-center ${
              isGeneratingPDF ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"
            } whitespace-nowrap`}
          >
            {isGeneratingPDF ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaFilePdf className="mr-2" />
            )}
            {isGeneratingPDF ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CuttingReportFilterPane;
