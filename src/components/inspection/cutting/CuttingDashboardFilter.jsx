// src/components/inspection/cutting/CuttingDashboardFilter.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import { API_BASE_URL } from "../../../../config";
import { useTheme } from "../../context/ThemeContext";
import { Check, RotateCcw } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

const FilterSelect = ({ options, value, onChange, placeholder, theme }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full p-2 rounded-md focus:ring-2 focus:ring-blue-500
        ${
          theme === "dark"
            ? "bg-gray-700 text-white border-gray-600"
            : "bg-gray-50 text-black border-gray-300"
        }`}
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
);

const CuttingDashboardFilter = ({ filters, setFilters, onApply }) => {
  const [filterOptions, setFilterOptions] = useState({
    buyers: [],
    moNos: [],
    tableNos: [],
    garmentTypes: [],
    qcIds: [],
    colors: []
  });
  const { theme } = useTheme();

  const fetchOptions = useCallback(async (currentFilters) => {
    try {
      const params = {
        ...currentFilters,
        startDate: currentFilters.startDate
          ? currentFilters.startDate.toISOString().split("T")[0]
          : "",
        endDate: currentFilters.endDate
          ? currentFilters.endDate.toISOString().split("T")[0]
          : ""
      };
      // remove empty strings from params
      Object.keys(params).forEach(
        (key) =>
          (params[key] === "" || params[key] === null) && delete params[key]
      );

      const response = await axios.get(
        `${API_BASE_URL}/api/cutting-dashboard/filters`,
        { params }
      );
      setFilterOptions(response.data);
    } catch (error) {
      console.error("Failed to fetch dynamic filter options:", error);
    }
  }, []);

  useEffect(() => {
    fetchOptions(filters);
  }, [filters, fetchOptions]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const initialFilters = {
      startDate: null,
      endDate: null,
      buyer: "",
      moNo: "",
      tableNo: "",
      garmentType: "",
      qcId: "",
      color: ""
    };
    setFilters(initialFilters);
    onApply(initialFilters); // Also apply the reset to the dashboard
  };

  return (
    <div
      className={`p-4 mb-6 rounded-lg shadow-md ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-9 gap-4 items-end">
        {/* Date Filters */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Start Date
          </label>
          <DatePicker
            selected={filters.startDate}
            onChange={(date) => handleFilterChange("startDate", date)}
            className={`w-full p-2 rounded-md focus:ring-2 focus:ring-blue-500 ${
              theme === "dark"
                ? "bg-gray-700 text-white"
                : "bg-gray-50 text-black"
            }`}
          />
        </div>
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            End Date
          </label>
          <DatePicker
            selected={filters.endDate}
            onChange={(date) => handleFilterChange("endDate", date)}
            className={`w-full p-2 rounded-md focus:ring-2 focus:ring-blue-500 ${
              theme === "dark"
                ? "bg-gray-700 text-white"
                : "bg-gray-50 text-black"
            }`}
          />
        </div>

        {/* Select Filters */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Buyer
          </label>
          <FilterSelect
            options={filterOptions.buyers}
            value={filters.buyer}
            onChange={(val) => handleFilterChange("buyer", val)}
            placeholder="All Buyers"
            theme={theme}
          />
        </div>
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            MO No
          </label>
          <FilterSelect
            options={filterOptions.moNos}
            value={filters.moNo}
            onChange={(val) => handleFilterChange("moNo", val)}
            placeholder="All MOs"
            theme={theme}
          />
        </div>
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Table No
          </label>
          <FilterSelect
            options={filterOptions.tableNos}
            value={filters.tableNo}
            onChange={(val) => handleFilterChange("tableNo", val)}
            placeholder="All Tables"
            theme={theme}
          />
        </div>
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Garment Type
          </label>
          <FilterSelect
            options={filterOptions.garmentTypes}
            value={filters.garmentType}
            onChange={(val) => handleFilterChange("garmentType", val)}
            placeholder="All Types"
            theme={theme}
          />
        </div>
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Emp ID
          </label>
          <FilterSelect
            options={filterOptions.qcIds}
            value={filters.qcId}
            onChange={(val) => handleFilterChange("qcId", val)}
            placeholder="All Inspectors"
            theme={theme}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => onApply(filters)}
            className="flex-1 flex justify-center items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
            title="Apply Filters"
          >
            <Check size={20} />
          </button>
          <button
            onClick={handleReset}
            className="flex-1 flex justify-center items-center bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-200"
            title="Reset Filters"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CuttingDashboardFilter;
