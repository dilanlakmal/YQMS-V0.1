import axios from "axios";
import { Check, RotateCcw, Filter, Calendar, User, Package, Hash, Shirt, UserCheck } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config";
import { useTheme } from "../../context/ThemeContext";

// Custom styling for react-select (unchanged)
const getCustomStyles = (theme) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: theme === "dark" ? "#374151" : "#F9FAFB",
    borderColor: theme === "dark" ? "#4B5563" : "#D1D5DB",
    minHeight: "44px",
    boxShadow: state.isFocused ? "0 0 0 2px #3B82F6" : "none",
    borderRadius: "8px",
    "&:hover": {
      borderColor: theme === "dark" ? "#6B7280" : "#A5B4FC"
    }
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 12px"
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
    border: `1px solid ${theme === "dark" ? "#4B5563" : "#D1D5DB"}`,
    borderRadius: "8px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
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

  // All existing functions remain unchanged
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

  const customStyles = getCustomStyles(theme);
  const toSelectOptions = (arr) =>
    arr.map((item) => ({ value: item, label: item }));

  return (
    <div className={`p-6 mb-8 rounded-xl shadow-lg border ${
      theme === "dark" 
        ? "bg-gray-800 border-gray-700" 
        : "bg-white border-gray-200"
    }`}>
      {/* Header */}
      <div className="flex items-center mb-6">
        <Filter className={`mr-3 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} size={24} />
        <h2 className={`text-xl font-semibold ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}>
          Dashboard Filters
        </h2>
      </div>

      {/* All Filter Options in One Section */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 2xl:grid-cols-10 gap-4">
          {/* Start Date */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium flex items-center ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              <Calendar className="mr-1" size={14} />
              Start Date
            </label>
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => handleFilterChange("startDate", date)}
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                theme === "dark"
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-50 text-black border-gray-300"
              }`}
              placeholderText="Select start date"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium flex items-center ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              <Calendar className="mr-1" size={14} />
              End Date
            </label>
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => handleFilterChange("endDate", date)}
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                theme === "dark"
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-50 text-black border-gray-300"
              }`}
              placeholderText="Select end date"
            />
          </div>

          {/* Buyer */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium flex items-center ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              <User className="mr-1" size={14} />
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

          {/* MO No */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium flex items-center ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              <Hash className="mr-1" size={14} />
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

          {/* Table No */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium flex items-center ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              <Hash className="mr-1" size={14} />
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

          {/* Garment Type */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium flex items-center ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              <Shirt className="mr-1" size={14} />
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

          {/* Emp ID */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium flex items-center ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              <UserCheck className="mr-1" size={14} />
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
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onApply(filters)}
          className="flex-1 sm:flex-none sm:px-8 flex justify-center items-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <Check size={18} className="mr-2" />
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="flex-1 sm:flex-none sm:px-8 flex justify-center items-center bg-gradient-to-r from-red-500 to-red-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <RotateCcw size={18} className="mr-2" />
          Reset All
        </button>
      </div>
    </div>
  );
};

export default CuttingDashboardFilter;
