import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Calendar,
  Package,
  Palette,
  Ruler,
  Building,
  User,
  ShoppingCart,
  Hash,
  Search,
  X,
  Filter,
  RotateCcw,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Moon,
  Sun
} from "lucide-react";

const FilterPane = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  moNo,
  setMoNo,
  color,
  setColor,
  size,
  setSize,
  department,
  setDepartment,
  empId,
  setEmpId,
  buyer,
  setBuyer,
  lineNo,
  setLineNo,
  appliedFilters,
  setAppliedFilters,
  onApplyFilters,
  onResetFilters,
  dataSource = "qc2-inspection-pass-bundle"
}) => {
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [empIdOptions, setEmpIdOptions] = useState([]);
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [lineNoOptions, setLineNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [showEmpIdDropdown, setShowEmpIdDropdown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerms, setSearchTerms] = useState({
    moNo: "",
    empId: ""
  });

  const moNoRef = useRef(null);
  const empIdRef = useRef(null);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Filter field configurations
  const filterFields = [
    {
      key: "startDate",
      label: "Start Date",
      type: "date",
      icon: <Calendar size={16} />,
      value: startDate,
      placeholder: "Select start date",
      colSpan: "col-span-1"
    },
    {
      key: "endDate",
      label: "End Date",
      type: "date",
      icon: <Calendar size={16} />,
      value: endDate,
      placeholder: "Select end date",
      colSpan: "col-span-1"
    },
    {
      key: "moNo",
      label: "MO Number",
      type: "autocomplete",
      icon: <Package size={16} />,
      value: moNo,
      placeholder: "Search MO number...",
      options: moNoOptions,
      colSpan: "col-span-1"
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      icon: <Palette size={16} />,
      value: color,
      placeholder: "Select color",
      options: colorOptions,
      colSpan: "col-span-1"
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      icon: <Ruler size={16} />,
      value: size,
      placeholder: "Select size",
      options: sizeOptions,
      colSpan: "col-span-1"
    },
    {
      key: "department",
      label: "Department",
      type: "select",
      icon: <Building size={16} />,
      value: department,
      placeholder: "Select department",
      options: departmentOptions,
      colSpan: "col-span-1"
    },
    {
      key: "empId",
      label: "Employee ID",
      type: "autocomplete",
      icon: <User size={16} />,
      value: empId,
      placeholder: "Search employee ID...",
      options: empIdOptions,
      colSpan: "col-span-1"
    },
    {
      key: "buyer",
      label: "Buyer",
      type: "select",
      icon: <ShoppingCart size={16} />,
      value: buyer,
      placeholder: "Select buyer",
      options: buyerOptions,
      colSpan: "col-span-1"
    },
    {
      key: "lineNo",
      label: "Line Number",
      type: "select",
      icon: <Hash size={16} />,
      value: lineNo,
      placeholder: "Select line",
      options: lineNoOptions,
      colSpan: "col-span-1"
    }
  ];

  // Fetch filter options based on dataSource
  const fetchFilterOptions = async () => {
    setIsLoading(true);
    try {
      const endpoint =
        dataSource === "qc2-orderdata"
          ? `${API_BASE_URL}/api/qc2-orderdata/filter-options`
          : `${API_BASE_URL}/api/qc2-inspection-pass-bundle/filter-options`;
      
      const response = await axios.get(endpoint);
      const data = response.data;

      setMoNoOptions(data.moNo || []);
      setColorOptions(data.color || []);
      setSizeOptions(data.size || []);
      setDepartmentOptions(data.department || []);
      setEmpIdOptions(
        dataSource === "qc2-orderdata"
          ? data.empId || []
          : data.emp_id_inspection || []
      );
      setBuyerOptions(data.buyer || []);
      setLineNoOptions(data.lineNo || []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, [dataSource]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moNoRef.current && !moNoRef.current.contains(event.target)) {
        setShowMoNoDropdown(false);
      }
      if (empIdRef.current && !empIdRef.current.contains(event.target)) {
        setShowEmpIdDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterChange = (key, value) => {
    switch (key) {
      case "moNo":
        setMoNo(value);
        setShowMoNoDropdown(false);
        setSearchTerms(prev => ({ ...prev, moNo: value }));
        break;
      case "empId":
        setEmpId(value);
        setShowEmpIdDropdown(false);
        setSearchTerms(prev => ({ ...prev, empId: value }));
        break;
      case "startDate":
        setStartDate(value);
        break;
      case "endDate":
        setEndDate(value);
        break;
      case "color":
        setColor(value);
        break;
      case "size":
        setSize(value);
        break;
      case "department":
        setDepartment(value);
        break;
      case "buyer":
        setBuyer(value);
        break;
      case "lineNo":
        setLineNo(value);
        break;
      default:
        break;
    }
  };

  const handleMoNoInput = (e) => {
    const value = e.target.value;
    setMoNo(value);
    setSearchTerms(prev => ({ ...prev, moNo: value }));
    setShowMoNoDropdown(true);
  };

  const handleEmpIdInput = (e) => {
    const value = e.target.value;
    setEmpId(value);
    setSearchTerms(prev => ({ ...prev, empId: value }));
    setShowEmpIdDropdown(true);
  };

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setMoNo("");
    setColor("");
    setSize("");
    setDepartment("");
    setEmpId("");
    setBuyer("");
    setLineNo("");
    setAppliedFilters({});
    setShowMoNoDropdown(false);
    setShowEmpIdDropdown(false);
    setSearchTerms({ moNo: "", empId: "" });
    onResetFilters();
  };

  const getActiveFiltersCount = () => {
    return Object.values({
      startDate,
      endDate,
      moNo,
      color,
      size,
      department,
      empId,
      buyer,
      lineNo
    }).filter(value => value && value !== "").length;
  };

  const renderField = (field) => {
    const baseInputClasses = "w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400";
    const labelClasses = "flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

    switch (field.type) {
      case "date":
        return (
          <div key={field.key} className={field.colSpan}>
            <label className={labelClasses}>
              <span className="text-blue-600 dark:text-blue-400">{field.icon}</span>
              <span className="ml-2">{field.label}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <span className="text-gray-400 dark:text-gray-500">{field.icon}</span>
              </div>
              <DatePicker
                selected={field.value}
                onChange={(date) => handleFilterChange(field.key, date)}
                dateFormat="MM/dd/yyyy"
                className={baseInputClasses}
                placeholderText={field.placeholder}
                popperPlacement="bottom-start"
                wrapperClassName="w-full"
              />
            </div>
          </div>
        );

      case "select":
        return (
          <div key={field.key} className={field.colSpan}>
            <label className={labelClasses}>
              <span className="text-blue-600 dark:text-blue-400">{field.icon}</span>
              <span className="ml-2">{field.label}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <span className="text-gray-400 dark:text-gray-500">{field.icon}</span>
              </div>
              <select
                value={field.value}
                onChange={(e) => handleFilterChange(field.key, e.target.value)}
                className={`${baseInputClasses} appearance-none cursor-pointer`}
              >
                <option value="">{field.placeholder}</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>
        );

      case "autocomplete":
        const isEmpId = field.key === "empId";
        const ref = isEmpId ? empIdRef : moNoRef;
        const showDropdown = isEmpId ? showEmpIdDropdown : showMoNoDropdown;
        const handleInput = isEmpId ? handleEmpIdInput : handleMoNoInput;
        const searchTerm = isEmpId ? searchTerms.empId : searchTerms.moNo;

        return (
          <div key={field.key} className={field.colSpan} ref={ref}>
            <label className={labelClasses}>
              <span className="text-blue-600 dark:text-blue-400">{field.icon}</span>
              <span className="ml-2">{field.label}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <span className="text-gray-400 dark:text-gray-500">{field.icon}</span>
              </div>
              <input
                type="text"
                value={field.value}
                onChange={handleInput}
                className={baseInputClasses}
                placeholder={field.placeholder}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400 dark:text-gray-500" />
              </div>
              {showDropdown && (
                <div className="absolute z-20 w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-xl dark:shadow-gray-900/50">
                  {field.options
                    .filter((option) =>
                      option.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((option) => (
                      <div
                        key={option}
                        onClick={() => handleFilterChange(field.key, option)}
                        className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer text-sm transition-colors duration-150 flex items-center justify-between group text-gray-900 dark:text-gray-100"
                      >
                        <span>{option}</span>
                        <Check size={14} className="text-blue-500 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                      </div>
                    ))}
                  {field.options.filter((option) =>
                    option.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No options found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 mb-8 overflow-hidden transition-colors duration-300">
      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 z-50 p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-100 dark:border-gray-600 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg shadow-md">
              <Filter size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Advanced Filters</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} applied
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 dark:border-blue-400 border-t-transparent"></div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-white hover:bg-opacity-50 dark:hover:bg-gray-700 dark:hover:bg-opacity-50 rounded-lg transition-colors duration-200 text-gray-700 dark:text-gray-300"
              title={isCollapsed ? "Expand filters" : "Collapse filters"}
            >
              {isCollapsed ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      {!isCollapsed && (
        <div className="p-6 bg-white dark:bg-gray-800 transition-colors duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-10 gap-6">
            {filterFields.map(renderField)}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleClearFilters}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-red-100 dark:bg-red-700 hover:bg-red-200 dark:hover:bg-red-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-md dark:shadow-gray-900/50"
            >
              <RotateCcw size={18} className="mr-2" />
              Clear 
            </button>
            
            <button
              onClick={onApplyFilters}
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl dark:shadow-blue-900/50 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search size={18} className="mr-2" />
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Applied Filters Display */}
      {Object.keys(appliedFilters).length > 0 && (
        <div className="px-6 pb-6 bg-white dark:bg-gray-800 transition-colors duration-300">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-100 dark:border-blue-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center">
                <Check size={16} className="mr-2" />
                Active Filters
              </h3>
              <button
                onClick={handleClearFilters}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(appliedFilters).map(([key, value]) => (
                <div
                  key={key}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-600 transition-colors duration-200"
                >
                  <span className="capitalize">{key}:</span>
                  <span className="ml-1 font-semibold">{value}</span>
                  <button
                    onClick={() => {
                      const newFilters = { ...appliedFilters };
                      delete newFilters[key];
                      setAppliedFilters(newFilters);
                      handleFilterChange(key, "");
                    }}
                    className="ml-2 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full p-0.5 transition-colors duration-150"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPane;
