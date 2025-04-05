import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CuttingReport = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    moNo: "",
    lotNo: "",
    color: "",
    tableNo: ""
  });
  const [reportData, setReportData] = useState({
    totalPcs: 0,
    totalPass: 0,
    totalReject: 0,
    totalRejectMeasurement: 0,
    totalRejectDefects: 0,
    totalInspectionQty: 0
  });
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    lotNos: [],
    colors: [],
    tableNos: []
  });
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const moNoRef = useRef(null);

  // Fetch initial MO Nos
  useEffect(() => {
    fetchMoNos();
  }, []);

  // Fetch report data and filter options when filters change
  useEffect(() => {
    fetchReportData();
    if (filters.moNo) fetchFilterOptions();
  }, [filters]);

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
        colors: response.data.colors,
        tableNos: response.data.tableNos
      });
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchReportData = async () => {
    try {
      const params = {
        startDate: filters.startDate ? formatDate(filters.startDate) : "",
        endDate: filters.endDate ? formatDate(filters.endDate) : "",
        moNo: filters.moNo,
        lotNo: filters.lotNo,
        color: filters.color,
        tableNo: filters.tableNo
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/cutting-inspection-report`,
        { params }
      );
      setReportData(response.data);
    } catch (error) {
      console.error("Error fetching cutting report data:", error);
      setReportData({
        totalPcs: 0,
        totalPass: 0,
        totalReject: 0,
        totalRejectMeasurement: 0,
        totalRejectDefects: 0,
        totalInspectionQty: 0
      });
    }
  };

  // Format Date object to MM/DD/YYYY without leading zeros
  const formatDate = (date) => {
    if (!date) return "";
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`; // e.g., "4/5/2025"
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      // Reset dependent filters when MO No changes
      if (key === "moNo") {
        newFilters.lotNo = "";
        newFilters.color = "";
        newFilters.tableNo = "";
      }
      return newFilters;
    });
    if (key === "moNo") {
      setShowMoNoDropdown(false);
    }
  };

  // Handle MO No input for dropdown
  const handleMoNoInput = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, moNo: value }));
    setShowMoNoDropdown(true);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moNoRef.current && !moNoRef.current.contains(event.target)) {
        setShowMoNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate Pass Rate
  const passRate =
    reportData.totalPcs > 0
      ? ((reportData.totalPass / reportData.totalPcs) * 100).toFixed(2)
      : "0.00";

  // Determine Result based on AQL standards
  const getResult = () => {
    const { totalReject, totalInspectionQty } = reportData;
    if (totalInspectionQty === 0) return "N/A";

    if (totalInspectionQty <= 75) {
      return totalReject <= 1 ? "Pass" : "Fail";
    } else if (totalInspectionQty <= 135) {
      return totalReject <= 3 ? "Pass" : "Fail";
    } else if (totalInspectionQty <= 210) {
      return totalReject <= 5 ? "Pass" : "Fail";
    } else if (totalInspectionQty <= 300) {
      return totalReject <= 7 ? "Pass" : "Fail";
    }
    return totalReject <= 7 ? "Pass" : "Fail"; // Default, extend as needed
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          {t("cuttingReport.title")}
        </h1>

        {/* Filter Pane */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            {t("cuttingReport.filters")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("cuttingReport.startDate")}
              </label>
              <DatePicker
                selected={filters.startDate}
                onChange={(date) => handleFilterChange("startDate", date)}
                dateFormat="MM/dd/yyyy"
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                placeholderText="Select Start Date"
              />
            </div>
            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("cuttingReport.endDate")}
              </label>
              <DatePicker
                selected={filters.endDate}
                onChange={(date) => handleFilterChange("endDate", date)}
                dateFormat="MM/dd/yyyy"
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                placeholderText="Select End Date"
              />
            </div>
            {/* MO No with Dropdown */}
            <div ref={moNoRef} className="relative">
              <label className="block text-sm font-medium text-gray-700">
                {t("cuttingReport.moNo")}
              </label>
              <input
                type="text"
                value={filters.moNo}
                onChange={handleMoNoInput}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Enter MO No"
              />
              {showMoNoDropdown && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-y-auto">
                  {moNoOptions
                    .filter((mo) =>
                      mo.toLowerCase().includes(filters.moNo.toLowerCase())
                    )
                    .map((mo) => (
                      <li
                        key={mo}
                        onClick={() => handleFilterChange("moNo", mo)}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {mo}
                      </li>
                    ))}
                </ul>
              )}
            </div>
            {/* Lot No Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("cuttingReport.lotNo")}
              </label>
              <select
                value={filters.lotNo}
                onChange={(e) => handleFilterChange("lotNo", e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
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
            {/* Color Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("cuttingReport.color")}
              </label>
              <select
                value={filters.color}
                onChange={(e) => handleFilterChange("color", e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
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
            {/* Table No Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("cuttingReport.tableNo")}
              </label>
              <select
                value={filters.tableNo}
                onChange={(e) => handleFilterChange("tableNo", e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
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
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">
              {t("cuttingReport.totalPcs")}
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              {reportData.totalPcs}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">
              {t("cuttingReport.passPcs")}
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {reportData.totalPass}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">
              {t("cuttingReport.rejectPcs")}
            </h3>
            <p className="text-2xl font-bold text-red-600">
              {reportData.totalReject}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">
              {t("cuttingReport.measurementDefects")}
            </h3>
            <p className="text-2xl font-bold text-orange-600">
              {reportData.totalRejectMeasurement}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">
              {t("cuttingReport.physicalDefects")}
            </h3>
            <p className="text-2xl font-bold text-purple-600">
              {reportData.totalRejectDefects}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">
              {t("cuttingReport.passRate")}
            </h3>
            <p className="text-2xl font-bold text-teal-600">{passRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">
              {t("cuttingReport.result")}
            </h3>
            <p
              className={`text-2xl font-bold ${
                getResult() === "Pass"
                  ? "text-green-600"
                  : getResult() === "Fail"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {getResult()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuttingReport;
