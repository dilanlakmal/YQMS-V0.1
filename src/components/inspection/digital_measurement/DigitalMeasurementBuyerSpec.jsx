import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config";
import {
  Ruler,
  Package,
  Users,
  BarChart3,
  TrendingUp,
  Activity,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Zap,
  Star,
  Factory,
  Palette,
  Shirt,
  Globe,
  MapPin,
  Settings
} from "lucide-react";

const DigitalMeasurementBuyerSpec = () => {
  const [filters, setFilters] = useState({
    factory: "",
    mono: "",
    custStyle: "",
    buyer: "",
    mode: "",
    country: "",
    origin: ""
  });

  const [filterOptions, setFilterOptions] = useState({
    factories: [],
    monos: [],
    custStyles: [],
    buyers: [],
    modes: [],
    countries: [],
    origins: []
  });

  const [orderData, setOrderData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentMono, setCurrentMono] = useState(null);
  const [isManualMonoSelection, setIsManualMonoSelection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced loading component
  const LoadingSpinner = ({ size = "default", text = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-4 border-blue-500 border-t-transparent ${
        size === "small" ? "h-8 w-8" : size === "large" ? "h-16 w-16" : "h-12 w-12"
      }`}></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">{text}</p>
    </div>
  );

  // Enhanced action button component
  const ActionButton = ({ 
    onClick, 
    variant = "primary", 
    size = "default", 
    icon: Icon, 
    children, 
    disabled = false,
    loading = false 
  }) => {
    const baseClasses = `inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`;
    
    const variants = {
      primary: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/25 focus:ring-blue-500/50",
      secondary: "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 shadow-gray-200/50 focus:ring-gray-300/50",
      success: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/25 focus:ring-green-500/50"
    };
    
    const sizes = {
      small: "px-3 py-1.5 text-sm",
      default: "px-4 py-2 text-sm",
      large: "px-6 py-3 text-base"
    };
    
    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
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

  // Enhanced Select component styling with proper dark mode support
  const getCustomSelectStyles = () => {
    // Check if dark mode is active
    const isDarkMode = document.documentElement.classList.contains('dark') || 
                       window.matchMedia('(prefers-color-scheme: dark)').matches;

    return {
      control: (provided, state) => ({
        ...provided,
        borderRadius: '0.75rem',
        borderWidth: '2px',
        borderColor: state.isFocused ? '#3B82F6' : (isDarkMode ? '#4B5563' : '#E5E7EB'),
        boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
        '&:hover': {
          borderColor: isDarkMode ? '#6B7280' : '#3B82F6'
        },
        minHeight: '42px',
        backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
        transition: 'all 0.2s ease-in-out'
      }),
      input: (provided) => ({
        ...provided,
        color: isDarkMode ? '#F3F4F6' : '#374151'
      }),
      singleValue: (provided) => ({
        ...provided,
        color: isDarkMode ? '#F3F4F6' : '#374151'
      }),
      placeholder: (provided) => ({
        ...provided,
        color: isDarkMode ? '#9CA3AF' : '#6B7280'
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected 
          ? '#3B82F6' 
          : state.isFocused 
          ? (isDarkMode ? '#4B5563' : '#EFF6FF')
          : (isDarkMode ? '#374151' : 'white'),
        color: state.isSelected 
          ? 'white' 
          : (isDarkMode ? '#F3F4F6' : '#374151'),
        '&:hover': {
          backgroundColor: state.isSelected 
            ? '#3B82F6' 
            : (isDarkMode ? '#4B5563' : '#EFF6FF')
        }
      }),
      menu: (provided) => ({
        ...provided,
        borderRadius: '0.75rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: `1px solid ${isDarkMode ? '#4B5563' : '#E5E7EB'}`,
        backgroundColor: isDarkMode ? '#374151' : '#FFFFFF'
      }),
      menuList: (provided) => ({
        ...provided,
        backgroundColor: isDarkMode ? '#374151' : '#FFFFFF'
      }),
      dropdownIndicator: (provided) => ({
        ...provided,
        color: isDarkMode ? '#9CA3AF' : '#6B7280',
        '&:hover': {
          color: isDarkMode ? '#F3F4F6' : '#374151'
        }
      }),
      clearIndicator: (provided) => ({
        ...provided,
        color: isDarkMode ? '#9CA3AF' : '#6B7280',
        '&:hover': {
          color: isDarkMode ? '#F87171' : '#EF4444'
        }
      }),
      indicatorSeparator: (provided) => ({
        ...provided,
        backgroundColor: isDarkMode ? '#4B5563' : '#E5E7EB'
      }),
      valueContainer: (provided) => ({
        ...provided,
        color: isDarkMode ? '#F3F4F6' : '#374151'
      })
    };
  };

  // Filter configuration with icons
  const filterConfig = [
    { key: 'factory', label: 'Factory', icon: Factory, options: 'factories' },
    { key: 'mono', label: 'MO No', icon: Package, options: 'monos' },
    { key: 'custStyle', label: 'Customer Style', icon: Shirt, options: 'custStyles' },
    { key: 'buyer', label: 'Buyer', icon: Users, options: 'buyers' },
    { key: 'mode', label: 'Mode', icon: Settings, options: 'modes' },
    { key: 'country', label: 'Country', icon: Globe, options: 'countries' },
    { key: 'origin', label: 'Origin', icon: MapPin, options: 'origins' }
  ];

  // Updated decimal to fraction conversion
  const decimalToFraction = (decimal) => {
    if (!decimal || isNaN(decimal)) return <span> </span>;

    const sign = decimal < 0 ? "-" : "";
    const absDecimal = Math.abs(decimal);
    const fractionValue = absDecimal >= 1 ? absDecimal - Math.floor(absDecimal) : absDecimal;
    const whole = absDecimal >= 1 ? Math.floor(absDecimal) : 0;

    if (fractionValue === 0)
      return (
        <span>
          {sign}
          {whole || 0}
        </span>
      );

    const fractions = [
      { value: 0.0625, fraction: { numerator: 1, denominator: 16 } },
      { value: 0.125, fraction: { numerator: 1, denominator: 8 } },
      { value: 0.1875, fraction: { numerator: 3, denominator: 16 } },
      { value: 0.25, fraction: { numerator: 1, denominator: 4 } },
      { value: 0.3125, fraction: { numerator: 5, denominator: 16 } },
      { value: 0.375, fraction: { numerator: 3, denominator: 8 } },
      { value: 0.4375, fraction: { numerator: 7, denominator: 16 } },
      { value: 0.5, fraction: { numerator: 1, denominator: 2 } },
      { value: 0.5625, fraction: { numerator: 9, denominator: 16 } },
      { value: 0.625, fraction: { numerator: 5, denominator: 8 } },
      { value: 0.6875, fraction: { numerator: 11, denominator: 16 } },
      { value: 0.75, fraction: { numerator: 3, denominator: 4 } },
      { value: 0.8125, fraction: { numerator: 13, denominator: 16 } },
      { value: 0.875, fraction: { numerator: 7, denominator: 8 } },
      { value: 0.9375, fraction: { numerator: 15, denominator: 16 } }
    ];

    const tolerance = 0.01;
    const closestFraction = fractions.find(
      (f) => Math.abs(fractionValue - f.value) < tolerance
    );

    if (closestFraction) {
      const { numerator, denominator } = closestFraction.fraction;
      const fractionElement = (
        <span className="inline-flex flex-col items-center">
          <span className="text-xs leading-none">{numerator}</span>
          <span className="border-t border-gray-800 dark:border-gray-200 w-3"></span>
          <span className="text-xs leading-none">{denominator}</span>
        </span>
      );

      return (
        <span className="inline-flex items-center justify-center">
          {sign}
          {whole !== 0 && <span className="mr-1">{whole}</span>}
          {fractionElement}
        </span>
      );
    }

    return (
      <span>
        {sign}
        {fractionValue.toFixed(3)}
      </span>
    );
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/filter-options`, {
          params: filters,
          withCredentials: true
        });
        setFilterOptions({
          factories: response.data.factories.map((f) => ({
            value: f,
            label: f
          })),
          monos: response.data.monos.map((m) => ({ value: m, label: m })),
          custStyles: response.data.custStyles.map((cs) => ({
            value: cs,
            label: cs
          })),
          buyers: response.data.buyers.map((b) => ({ value: b, label: b })),
          modes: response.data.modes.map((m) => ({ value: m, label: m })),
          countries: response.data.countries.map((c) => ({
            value: c,
            label: c
          })),
          origins: response.data.origins.map((o) => ({ value: o, label: o }))
        });
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchFilterOptions();
  }, [filters]);

  useEffect(() => {
    const fetchPaginatedMonos = async () => {
      setLoading(true);
      try {
        if (isManualMonoSelection) {
          setTotalPages(1);
          setCurrentPage(1);
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/paginated-monos`,
          {
            params: { page: currentPage, ...filters },
            withCredentials: true
          }
        );

        if (response.data.monos.length > 0) {
          setCurrentMono(response.data.monos[0]);
          setTotalPages(response.data.totalPages);
        } else {
          setCurrentMono(null);
          setOrderData(null);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching paginated MONos:", error);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchPaginatedMonos();
  }, [currentPage, filters, isManualMonoSelection]);

  useEffect(() => {
    if (currentMono) {
      const fetchOrderDetails = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/buyer-spec-order-details/${currentMono}`,
            {
              withCredentials: true
            }
          );
          if (response.data.buyerSpec) {
            response.data.buyerSpec.sort((a, b) => a.seq - b.seq);
          }
          setOrderData(response.data);
        } catch (error) {
          console.error("Error fetching order details:", error);
          setOrderData(null);
        } finally {
          setLoading(false);
        }
      };

      fetchOrderDetails();
    } else {
      setOrderData(null);
    }
  }, [currentMono]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      // Refresh filter options and current data
      await Promise.all([
        fetchFilterOptions(),
        currentMono && fetchOrderDetails()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1 && !isManualMonoSelection) {
      setCurrentPage(currentPage - 1);
      setIsManualMonoSelection(false);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !isManualMonoSelection) {
      setCurrentPage(currentPage + 1);
      setIsManualMonoSelection(false);
    }
  };

  const handlePageClick = (page) => {
    if (!isManualMonoSelection) {
      setCurrentPage(page);
      setIsManualMonoSelection(false);
    }
  };

  const getPaginationRange = () => {
    if (isManualMonoSelection) {
      return [1];
    }

    const maxPagesToShow = 10;
    const halfRange = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - halfRange);
    let end = Math.min(totalPages, start + maxPagesToShow - 1);

    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }

    const pages = [];
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Enhanced Header */}
        <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-gray-800 dark:via-slate-800 dark:to-gray-900 px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl">
                  <Ruler className="w-8 h-8 text-white dark:text-gray-200" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white dark:text-gray-100">
                    Buyer Measurement Specifications
                  </h1>
                  <p className="text-blue-100 dark:text-gray-300 text-sm mt-1">
                    Comprehensive buyer specification analysis and measurement standards
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <ActionButton
                  onClick={refreshData}
                  variant="secondary"
                  icon={RefreshCw}
                  loading={refreshing}
                  size="default"
                >
                  Refresh Data
                </ActionButton>
                
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">Live Data</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Filter Pane */}
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Filter Options
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filterConfig.map((config) => (
                <div key={config.key} className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <config.icon className="w-4 h-4" />
                    <span>{config.label}</span>
                  </label>
                  <Select
                    options={filterOptions[config.options]}
                    value={filterOptions[config.options].find(
                      (opt) => opt.value === filters[config.key]
                    )}
                    onChange={(option) => {
                      const value = option ? option.value : "";
                      setFilters({ ...filters, [config.key]: value });
                      
                      if (config.key === 'mono') {
                        setCurrentMono(value);
                        setCurrentPage(1);
                        setIsManualMonoSelection(!!value);
                      }
                    }}
                    isClearable
                    styles={getCustomSelectStyles()}
                    placeholder={`Select ${config.label}...`}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
            <LoadingSpinner size="large" text="Loading specification data..." />
          </div>
        )}

        {/* Order Details Section */}
        {orderData && !loading && (
          <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Order Details
                </h2>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                  MO: {orderData.moNo}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-gray-800 dark:to-gray-700">
                      <tr>
                        {["MO No", "Cust. Style", "Buyer", "Mode", "Country", "Origin", "Order Qty"].map((header) => (
                          <th key={header} className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900">
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm font-bold text-blue-600 dark:text-blue-400">
                          {orderData.moNo}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {orderData.custStyle}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {orderData.buyer}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {orderData.mode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {orderData.country}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {orderData.origin}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-green-600 dark:text-green-400">
                          {orderData.orderQty.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Color and Size Order Quantities */}
        {orderData && orderData.colors.length > 0 && !loading && (
          <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Color and Size Distribution
                </h2>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
                  {orderData.colors.length} Colors • {orderData.sizes.length} Sizes
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gradient-to-r from-purple-500 to-violet-600 dark:from-gray-800 dark:to-gray-700 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Color
                        </th>
                        {orderData.sizes.map((size) => (
                          <th key={size} className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                            {size}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {orderData.colors.map((color, index) => (
                        <tr
                          key={color}
                          className={`transition-all duration-200 hover:bg-purple-50 dark:hover:bg-gray-800 ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                          }`}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                              {color}
                            </span>
                          </td>
                          {orderData.sizes.map((size) => (
                            <td key={size} className="px-4 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">
                              {(orderData.colorSizeMap[color][size] || 0).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buyer Specification */}
        {orderData && orderData.buyerSpec.length > 0 && !loading && (
          <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Buyer Measurement Specifications
                </h2>
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-medium">
                  {orderData.buyerSpec.length} Measurement Points
                </span>
              </div>
            </div>
                        <div className="p-6">
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gradient-to-r from-indigo-500 to-blue-600 dark:from-gray-800 dark:to-gray-700 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                          Seq
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Measurement Points
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Chinese Remark
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                          Tol -
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                          Tol +
                        </th>
                        {orderData.sizes.map((size) => (
                          <th key={size} className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                            {size}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {orderData.buyerSpec.map((spec, index) => (
                        <tr
                          key={spec.seq}
                          className={`transition-all duration-200 hover:bg-indigo-50 dark:hover:bg-gray-800 ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                          }`}
                        >
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-bold">
                              {spec.seq}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            {spec.measurementPoint}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {spec.chineseRemark}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                              {decimalToFraction(spec.tolMinus)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                              {decimalToFraction(spec.tolPlus)}
                            </span>
                          </td>
                          {orderData.sizes.map((size) => (
                            <td key={size} className="px-4 py-4 text-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                                {decimalToFraction(spec.specs[size])}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Pagination */}
        <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Navigation
                </h2>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Info className="w-4 h-4" />
                <span>
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
                {isManualMonoSelection && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium">
                    Manual Selection
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Previous Button */}
              <ActionButton
                onClick={handlePrevious}
                disabled={currentPage === 1 || isManualMonoSelection}
                variant="secondary"
                icon={ChevronLeft}
                size="default"
              >
                Previous
              </ActionButton>

              {/* Page Numbers */}
              <div className="flex items-center space-x-2 flex-wrap justify-center">
                {getPaginationRange().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === "number" && handlePageClick(page)}
                    disabled={typeof page === "string" || isManualMonoSelection}
                    className={`inline-flex items-center justify-center min-w-[40px] h-10 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                      page === currentPage
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                        : typeof page === "string"
                        ? "text-gray-400 dark:text-gray-500 cursor-default"
                        : isManualMonoSelection
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md"
                    } ${
                      typeof page === "string" || isManualMonoSelection ? "" : "focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <ActionButton
                onClick={handleNext}
                disabled={currentPage === totalPages || isManualMonoSelection}
                variant="secondary"
                icon={ChevronRight}
                size="default"
              >
                Next
              </ActionButton>
            </div>

            {/* Pagination Info */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-4 px-6 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <Package className="w-4 h-4" />
                  <span>Total MO Records: <strong>{totalPages}</strong></span>
                </div>
                
                {currentMono && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Current MO: <strong>{currentMono}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {!orderData && !loading && (
          <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Search size={32} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                No Specification Data Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                No buyer specifications found for the current filters. Try adjusting your filter criteria or navigate through different pages.
              </p>
              <ActionButton
                onClick={refreshData}
                variant="primary"
                icon={RefreshCw}
                loading={refreshing}
              >
                Refresh Data
              </ActionButton>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Info className="w-4 h-4" />
              <span>Specifications are updated in real-time</span>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Specifications</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6b7280;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default DigitalMeasurementBuyerSpec;


            
