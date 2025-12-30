import React, { useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DigitalMeasurementPDFDownload from "./DigitalMeasurementPDFDownload";
import {
  Filter,
  X,
  Calendar,
  Factory,
  Package,
  Shirt,
  Users,
  User,
  Settings,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Download,
  Eye,
  EyeOff,
  Zap,
  Star
} from "lucide-react";

const DigitalMeasurementFilterPane = ({
  filters,
  setFilters,
  filterOptions,
  selectedMono
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Enhanced Select component styling with better dark mode support
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '0.75rem',
      borderWidth: '2px',
      borderColor: state.isFocused ? '#3B82F6' : '#E5E7EB',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#3B82F6'
      },
      minHeight: '42px',
      backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#FFFFFF',
      transition: 'all 0.2s ease-in-out'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#3B82F6' 
        : state.isFocused 
        ? (document.documentElement.classList.contains('dark') ? '#4B5563' : '#EFF6FF')
        : (document.documentElement.classList.contains('dark') ? '#374151' : 'white'),
      color: state.isSelected 
        ? 'white' 
        : (document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#374151'),
      '&:hover': {
        backgroundColor: state.isSelected 
          ? '#3B82F6' 
          : (document.documentElement.classList.contains('dark') ? '#4B5563' : '#EFF6FF')
      },
      padding: '8px 12px',
      cursor: 'pointer'
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '0.75rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      border: `1px solid ${document.documentElement.classList.contains('dark') ? '#4B5563' : '#E5E7EB'}`,
      backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#FFFFFF',
      overflow: 'hidden'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#9CA3AF',
      fontSize: '14px'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#374151',
      fontSize: '14px'
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#9CA3AF',
      '&:hover': {
        color: '#EF4444'
      }
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#9CA3AF',
      '&:hover': {
        color: '#3B82F6'
      }
    })
  };

  // Enhanced DatePicker styling with dark mode support
  const datePickerClassName = "w-full px-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 text-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 shadow-sm";

  // Filter configuration with icons and descriptions
  const filterConfig = [
    { 
      key: 'factory', 
      label: 'Factory', 
      icon: Factory, 
      options: 'factories',
      // description: 'Manufacturing facility',
      color: 'text-blue-600 dark:text-blue-400'
    },
    { 
      key: 'mono', 
      label: 'MO Number', 
      icon: Package, 
      options: 'monos',
      // description: 'Manufacturing order',
      color: 'text-green-600 dark:text-green-400'
    },
    { 
      key: 'custStyle', 
      label: 'Customer Style', 
      icon: Shirt, 
      options: 'custStyles',
      // description: 'Style reference',
      color: 'text-purple-600 dark:text-purple-400'
    },
    { 
      key: 'buyer', 
      label: 'Buyer', 
      icon: Users, 
      options: 'buyers',
      // description: 'Customer name',
      color: 'text-orange-600 dark:text-orange-400'
    },
    { 
      key: 'empId', 
      label: 'Employee ID', 
      icon: User, 
      options: 'empIds',
      // description: 'Inspector ID',
      color: 'text-indigo-600 dark:text-indigo-400'
    },
    { 
      key: 'stage', 
      label: 'Stage', 
      icon: Settings, 
      options: 'stages',
      // description: 'Process stage',
      color: 'text-pink-600 dark:text-pink-400'
    }
  ];

  // Handler to clear all filters
  const handleClearFilters = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setFilters({
        factory: "",
        startDate: null,
        endDate: null,
        mono: "",
        custStyle: "",
        buyer: "",
        empId: "",
        stage: ""
      });
      setIsAnimating(false);
    }, 150);
  };

  // Check if any filter is selected
  const isFilterSelected = Object.values(filters).some(
    (value) => value !== "" && value !== null
  );

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== "" && value !== null
  ).length;

  // Enhanced Action Button Component
  const ActionButton = ({ 
    onClick, 
    variant = "primary", 
    size = "default", 
    icon: Icon, 
    children, 
    disabled = false,
    loading = false,
    className = ""
  }) => {
    const baseClasses = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
    
    const variants = {
      primary: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/25 focus:ring-blue-500/50",
      secondary: "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 shadow-gray-200/50 dark:shadow-gray-800/50 focus:ring-gray-300/50 dark:focus:ring-gray-600/50",
      danger: "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-red-500/25 focus:ring-red-500/50",
      success: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/25 focus:ring-green-500/50"
    };
    
    const sizes = {
      small: "px-3 py-1.5 text-sm",
      default: "px-4 py-2.5 text-sm",
      large: "px-6 py-3 text-base"
    };
    
    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        ) : Icon ? (
          <Icon className="w-4 h-4 mr-2" />
        ) : null}
        {children}
      </button>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-xl shadow-lg">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Advanced Filters
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Refine your measurement data search
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Active Filter Count */}
            {activeFilterCount > 0 && (
              <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/50 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-700">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-800 dark:text-blue-200 font-semibold text-sm">
                  {activeFilterCount} Active
                </span>
              </div>
            )}
            {/* Expand/Collapse Button */}
            <ActionButton
              onClick={() => setIsExpanded(!isExpanded)}
              variant="secondary"
              size="small"
              icon={isExpanded ? ChevronUp : ChevronDown}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </ActionButton>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      <div className={`transition-all duration-500 ease-in-out ${
        isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
      } overflow-hidden`}>
        <div className="p-6">
          {/* Date Filters */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Date Range
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span>Start Date</span>
                </label>
                <DatePicker
                  selected={filters.startDate}
                  onChange={(date) => setFilters({ ...filters, startDate: date })}
                  minDate={filterOptions.minDate}
                  maxDate={new Date()}
                  className={datePickerClassName}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select start date..."
                  showPopperArrow={false}
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <Calendar className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span>End Date</span>
                </label>
                <DatePicker
                  selected={filters.endDate}
                  onChange={(date) => setFilters({ ...filters, endDate: date })}
                  minDate={filters.startDate || filterOptions.minDate}
                  maxDate={new Date()}
                  className={datePickerClassName}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select end date..."
                  showPopperArrow={false}
                />
              </div>
            </div>
          </div>

          {/* Other Filters */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Search Criteria
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {filterConfig.map((config) => (
                <div key={config.key} className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <config.icon className={`w-4 h-4 ${config.color}`} />
                    <span>{config.label}</span>
                  </label>
                  <div className="relative">
                    <Select
                      options={filterOptions[config.options]}
                      value={filterOptions[config.options].find(
                        (opt) => opt.value === filters[config.key]
                      ) || null}
                      onChange={(option) =>
                        setFilters({ 
                          ...filters, 
                          [config.key]: option ? option.value : "" 
                        })
                      }
                      isClearable
                      styles={customSelectStyles}
                      placeholder={`Select ${config.label.toLowerCase()}...`}
                      className={`${isAnimating ? 'animate-pulse' : ''}`}
                      isSearchable
                      noOptionsMessage={() => `No ${config.label.toLowerCase()} found`}
                    />
                    {filters[config.key] && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {config.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-4">
              <ActionButton
                onClick={handleClearFilters}
                variant={isFilterSelected ? "danger" : "primary"}
                icon={X}
                disabled={!isFilterSelected}
                loading={isAnimating}
              >
                Clear All Filters
              </ActionButton>
              {isFilterSelected && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                  <span>
                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* PDF Download */}
              <div className="flex items-center">
                <DigitalMeasurementPDFDownload
                  selectedMono={selectedMono}
                  filters={filters}
                />
              </div>

              {/* Selected MO Indicator */}
              {selectedMono && (
                <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-xl border border-green-200 dark:border-green-700">
                  <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-800 dark:text-green-200 font-semibold text-sm">
                    Selected: {selectedMono}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Filter Summary */}
          {isFilterSelected && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-blue-500 dark:bg-blue-600 rounded-lg">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Active Filters Summary
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(filters).map(([key, value]) => {
                      if (value && value !== "") {
                        const config = filterConfig.find(c => c.key === key);
                        const label = config ? config.label : key;
                        const displayValue = value instanceof Date ? value.toLocaleDateString() : value;
                        
                        return (
                          <span
                            key={key}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-600"
                          >
                            {label}: {displayValue}
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles with Dark Mode Support */}
      <style>{`
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__input-container input {
          width: 100%;
        }
        .react-datepicker {
          border-radius: 12px;
          border: 1px solid ${document.documentElement.classList.contains('dark') ? '#4B5563' : '#E5E7EB'};
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          background-color: ${document.documentElement.classList.contains('dark') ? '#374151' : '#FFFFFF'};
        }
        .react-datepicker__header {
          background-color: #3B82F6;
          border-radius: 12px 12px 0 0;
          border-bottom: none;
        }
        .react-datepicker__current-month,
        .react-datepicker__day-name {
          color: white;
        }
        .react-datepicker__day {
          color: ${document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#374151'};
        }
        .react-datepicker__day--selected {
          background-color: #3B82F6;
          border-radius: 6px;
          color: white;
        }
        .react-datepicker__day:hover {
          background-color: ${document.documentElement.classList.contains('dark') ? '#4B5563' : '#EFF6FF'};
          border-radius: 6px;
        }
        .react-datepicker__day--outside-month {
          color: ${document.documentElement.classList.contains('dark') ? '#6B7280' : '#9CA3AF'};
        }
      `}</style>
    </div>
  );
};

export default DigitalMeasurementFilterPane;
