import axios from "axios";
import { Check, RotateCcw } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select"; // Import the new library
import { API_BASE_URL } from "../../../../config";
import { useTheme } from "../../context/ThemeContext";

// --- NEW: Custom styling for react-select to match the theme ---
const getCustomStyles = (theme) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: theme === "dark" ? "#374151" : "#F9FAFB",
    borderColor: theme === "dark" ? "#4B5563" : "#D1D5DB",
    minHeight: "42px",
    boxShadow: state.isFocused ? "0 0 0 2px #3B82F6" : "none",
    "&:hover": {
      borderColor: theme === "dark" ? "#6B7280" : "#A5B4FC"
    }
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 8px"
  }),
  singleValue: (provided) => ({
    ...provided,
    color: theme === "dark" ? "#F9FAFB" : "#111827"
  }),
  input: (provided) => ({
    ...provided,
    color: theme === "dark" ? "#F9FAFB" : "#111827"
  }),
  placeholder: (provided) => ({
    ...provided,
    color: theme === "dark" ? "#9CA3AF" : "#6B7280"
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: theme === "dark" ? "#374151" : "#FFFFFF",
    border: `1px solid ${theme === "dark" ? "#4B5563" : "#D1D5DB"}`
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#3B82F6"
      : state.isFocused
      ? theme === "dark"
        ? "#4B5563"
        : "#E5E7EB"
      : "transparent",
    color: theme === "dark" ? "#F9FAFB" : "#111827",
    "&:active": {
      backgroundColor: "#2563EB"
    }
  })
});

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

  // The core fetching logic remains the same
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

  // A new handler specifically for react-select components
  const handleSelectChange = (key, selectedOption) => {
    handleFilterChange(key, selectedOption ? selectedOption.value : "");
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
    onApply(initialFilters);
  };

  // Get the custom styles based on the current theme
  const customStyles = getCustomStyles(theme);

  // Helper function to transform string arrays into { value, label } objects
  const toSelectOptions = (arr) =>
    arr.map((item) => ({ value: item, label: item }));

  return (
    <div
      className={`p-4 mb-6 rounded-lg shadow-md ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-9 gap-4 items-end">
        {/* Date Filters remain the same */}
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

        {/* --- MODIFIED: Select Filters now use react-select --- */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Buyer
          </label>
          <Select
            options={toSelectOptions(filterOptions.buyers)}
            value={
              filters.buyer
                ? { value: filters.buyer, label: filters.buyer }
                : null
            }
            onChange={(option) => handleSelectChange("buyer", option)}
            placeholder="All Buyers"
            isClearable
            isSearchable
            styles={customStyles}
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
          <Select
            options={toSelectOptions(filterOptions.moNos)}
            value={
              filters.moNo ? { value: filters.moNo, label: filters.moNo } : null
            }
            onChange={(option) => handleSelectChange("moNo", option)}
            placeholder="All MOs"
            isClearable
            isSearchable
            styles={customStyles}
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
          <Select
            options={toSelectOptions(filterOptions.tableNos)}
            value={
              filters.tableNo
                ? { value: filters.tableNo, label: filters.tableNo }
                : null
            }
            onChange={(option) => handleSelectChange("tableNo", option)}
            placeholder="All Tables"
            isClearable
            isSearchable
            styles={customStyles}
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
          <Select
            options={toSelectOptions(filterOptions.garmentTypes)}
            value={
              filters.garmentType
                ? { value: filters.garmentType, label: filters.garmentType }
                : null
            }
            onChange={(option) => handleSelectChange("garmentType", option)}
            placeholder="All Types"
            isClearable
            isSearchable
            styles={customStyles}
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
          <Select
            options={toSelectOptions(filterOptions.qcIds)}
            value={
              filters.qcId ? { value: filters.qcId, label: filters.qcId } : null
            }
            onChange={(option) => handleSelectChange("qcId", option)}
            placeholder="All Inspectors"
            isClearable
            isSearchable
            styles={customStyles}
          />
        </div>

        {/* Action Buttons remain the same */}
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
