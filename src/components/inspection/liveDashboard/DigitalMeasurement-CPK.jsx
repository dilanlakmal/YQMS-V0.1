import React, { useState, useEffect } from "react";
import axios from "axios";
import "antd/dist/reset.css";
import { Modal } from "antd";
import { 
  FaClock, 
  FaChartLine, 
  FaTable, 
  FaEye, 
  FaTrash, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle
} from "react-icons/fa";
import { 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  Calendar,
  User,
  Factory,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import DigitalMeasurementFilterPane from "../digital_measurement/DigitalMeasurementFilterPane";
import DigialMeasurementSummaryCards from "../digital_measurement/DigialMeasurementSummaryCards";
import DigitalMeasurementTotalSummary from "../digital_measurement/DigitalMeasurementTotalSummary";
import { API_BASE_URL } from "../../../../config";

const DigitalMeasurement = () => {
  const [filters, setFilters] = useState({
    factory: "",
    startDate: null,
    endDate: null,
    mono: "",
    custStyle: "",
    buyer: "",
    empId: "",
    stage: ""
  });

  const [filterOptions, setFilterOptions] = useState({
    factories: [],
    monos: [],
    custStyles: [],
    buyers: [],
    empIds: [],
    stages: [],
    minDate: null,
    maxDate: null
  });

  const [summaryData, setSummaryData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [measurementSummary, setMeasurementSummary] = useState([]);
  const [selectedMono, setSelectedMono] = useState(null);
  const [measurementDetails, setMeasurementDetails] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");

  const filteredMeasurementSummary = selectedMono
    ? measurementSummary.filter((item) => item.moNo === selectedMono)
    : measurementSummary;

  // Enhanced Loading Component
  const LoadingSpinner = ({ size = "default", text = "Loading..." }) => {
    const sizeClasses = {
      small: "h-6 w-6",
      default: "h-12 w-12",
      large: "h-16 w-16"
    };

    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className={`animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 ${sizeClasses[size]}`}></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">{text}</p>
      </div>
    );
  };

  // Enhanced Status Badge Component
  const StatusBadge = ({ status, size = "default" }) => {
    const baseClasses = "inline-flex items-center font-semibold rounded-full border-2";
    const sizeClasses = {
      small: "px-2 py-1 text-xs",
      default: "px-3 py-1.5 text-sm",
      large: "px-4 py-2 text-base"
    };

    const statusConfig = {
      Pass: {
        classes: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700",
        icon: CheckCircle2
      },
      Fail: {
        classes: "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700",
        icon: XCircle
      }
    };

    const config = statusConfig[status] || statusConfig.Fail;
    const Icon = config.icon;

    return (
      <span className={`${baseClasses} ${sizeClasses[size]} ${config.classes}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status}
      </span>
    );
  };

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
    const baseClasses = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
    
    const variants = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 focus:ring-blue-500/50",
      secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 focus:ring-gray-300/50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600",
      danger: "bg-red-600 hover:bg-red-700 text-white shadow-red-500/25 focus:ring-red-500/50",
      success: "bg-green-600 hover:bg-green-700 text-white shadow-green-500/25 focus:ring-green-500/50",
      warning: "bg-yellow-600 hover:bg-yellow-700 text-white shadow-yellow-500/25 focus:ring-yellow-500/50"
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
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
        ) : Icon ? (
          <Icon className="w-4 h-4 mr-2" />
        ) : null}
        {children}
      </button>
    );
  };

  // Enhanced Card Component
  const Card = ({ children, className = "", title, subtitle, icon: Icon }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {(title || subtitle || Icon) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );

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
          empIds: response.data.empIds.map((e) => ({ value: e, label: e })),
          stages: response.data.stages.map((s) => ({ value: s, label: s })),
          minDate: response.data.minDate
            ? new Date(response.data.minDate)
            : null,
          maxDate: response.data.maxDate
            ? new Date(response.data.maxDate)
            : null
        });
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchFilterOptions();
  }, [filters]);

  const fetchSummaryData = async () => {
    try {
      const params = {
        factory: filters.factory,
        startDate: filters.startDate ? filters.startDate.toISOString() : null,
        endDate: filters.endDate ? filters.endDate.toISOString() : null,
        mono: filters.mono,
        custStyle: filters.custStyle,
        buyer: filters.buyer,
        empId: filters.empId,
        stage: filters.stage
      };

      const response = await axios.get(
        `${API_BASE_URL}/api/measurement-summary`,
        {
          params,
          withCredentials: true
        }
      );

      setSummaryData(response.data);
    } catch (error) {
      console.error("Error fetching summary data:", error);
      setSummaryData(null);
    }
  };

  const fetchMeasurementSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const params = {
        page: currentPage,
        factory: filters.factory,
        startDate: filters.startDate ? filters.startDate.toISOString() : null,
        endDate: filters.endDate ? filters.endDate.toISOString() : null,
        mono: filters.mono,
        custStyle: filters.custStyle,
        buyer: filters.buyer,
        empId: filters.empId,
        stage: filters.stage
      };

      const response = await axios.get(
        `${API_BASE_URL}/api/measurement-summary-per-mono`,
        {
          params,
          withCredentials: true
        }
      );

      setMeasurementSummary(response.data.summaryPerMono);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching measurement summary:", error);
      setMeasurementSummary([]);
      setTotalPages(1);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const fetchMeasurementDetails = async () => {
    if (selectedMono) {
      try {
        const params = {
          startDate: filters.startDate ? filters.startDate.toISOString() : null,
          endDate: filters.endDate ? filters.endDate.toISOString() : null,
          empId: filters.empId,
          stage: filters.stage
        };

        const response = await axios.get(
          `${API_BASE_URL}/api/measurement-details/${selectedMono}`,
          {
            params,
            withCredentials: true
          }
        );

        setMeasurementDetails(response.data);
      } catch (error) {
        console.error("Error fetching measurement details:", error);
        setMeasurementDetails(null);
      }
    } else {
      setMeasurementDetails(null);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [filters]);

  useEffect(() => {
    fetchMeasurementSummary();
  }, [currentPage, filters]);

  useEffect(() => {
    fetchMeasurementDetails();
  }, [selectedMono, filters]);

  const decimalToFraction = (decimal) => {
    if (!decimal || isNaN(decimal)) return <span className="text-gray-400">-</span>;

    const sign = decimal < 0 ? "-" : "";
    const absDecimal = Math.abs(decimal);
    const fractionValue =
      absDecimal >= 1 ? absDecimal - Math.floor(absDecimal) : absDecimal;
    const whole = absDecimal >= 1 ? Math.floor(absDecimal) : 0;

    if (fractionValue === 0)
      return (
        <span className="font-mono">
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
        <span className="inline-flex flex-col items-center font-mono text-xs">
          <span className="leading-none">{numerator}</span>
          <span className="border-t border-gray-400 dark:border-gray-500 w-3"></span>
          <span className="leading-none">{denominator}</span>
        </span>
      );

      return (
        <span className="inline-flex items-center justify-center space-x-1">
          <span>{sign}</span>
          {whole !== 0 && <span className="font-mono">{whole}</span>}
          {fractionElement}
        </span>
      );
    }

    return (
      <span className="font-mono">
        {sign}
        {fractionValue.toFixed(3)}
      </span>
    );
  };

  const handleEditClick = (garmentIndex, pointIndex, currentValue) => {
    setEditingCell(`${garmentIndex}-${pointIndex}`);
    setEditValue(currentValue.toString());
  };

  const handleSaveClick = async (
    moNo,
    referenceNo,
    actualIndex,
    garmentIndex,
    pointIndex
  ) => {
    try {
      const newValue = parseFloat(editValue);
      if (isNaN(newValue)) {
        alert("Please enter a valid number");
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/update-measurement-value`,
        {
          moNo,
          referenceNo,
          index: actualIndex,
          newValue
        },
        { withCredentials: true }
      );

      const updatedRecords = [...measurementDetails.records];
      updatedRecords[garmentIndex].actual[actualIndex].value = newValue;

      setMeasurementDetails({ ...measurementDetails, records: updatedRecords });
      setEditingCell(null);
      setEditValue("");

      await Promise.all([
        fetchSummaryData(),
        fetchMeasurementSummary(),
        fetchMeasurementDetails()
      ]);
    } catch (error) {
      console.error(
        "Error saving measurement value:",
        error.response?.data || error.message
      );
      alert(
        `Failed to save the measurement value: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPaginationRange = () => {
    const maxPagesToShow = 5;
    const halfRange = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - halfRange);
    let end = Math.min(totalPages, start + maxPagesToShow - 1);

    if (end - start + 1 < maxPagesToShow)
      start = Math.max(1, end - maxPagesToShow + 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="max-w-8xl mx-auto p-4 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-3 bg-white dark:bg-gray-800 px-6 py-3 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
              <FaChartLine className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Digital Measurement Dashboard
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Comprehensive measurement analysis and quality control system for manufacturing operations
          </p>
        </div>

        {/* Filter Section */}
        <DigitalMeasurementFilterPane
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
          selectedMono={selectedMono}
        />

        {/* Summary Cards */}
        <DigialMeasurementSummaryCards summaryData={summaryData} />

        {/* Measurement Summary Section */}
        <Card 
          title="Measurement Summary" 
          subtitle="Overview of all manufacturing orders and their inspection status"
          icon={FaTable}
          className="transition-all duration-300 hover:shadow-xl"
        >
          {/* Selected MO Indicator */}
          {selectedMono && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Selected Manufacturing Order
                    </h4>
                    <p className="text-blue-700 dark:text-blue-300 font-mono text-lg">
                      {selectedMono}
                    </p>
                  </div>
                </div>
                <ActionButton
                  onClick={() => setSelectedMono(null)}
                  variant="secondary"
                  size="small"
                  icon={FaTimes}
                >
                  Clear Selection
                </ActionButton>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="relative">
            {isLoadingSummary && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <LoadingSpinner text="Loading measurement data..." />
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full bg-white dark:bg-gray-800">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4" />
                        <span>MO Number</span>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">Customer Style</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">Buyer</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">Country</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">Origin</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">Mode</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">Order Qty</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">Inspected Qty</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">Total Pass</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">Total Reject</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-center space-x-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Pass Rate</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMeasurementSummary.length > 0 ? (
                    filteredMeasurementSummary.map((item, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        <td className="px-4 py-4 border-b border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => setSelectedMono(item.moNo)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold hover:underline transition-colors duration-200 flex items-center space-x-2"
                          >
                            <FaEye className="w-4 h-4" />
                            <span className="font-mono">{item.moNo}</span>
                          </button>
                        </td>
                        <td className="px-4 py-4 text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                          {item.custStyle || <span className="text-gray-400">N/A</span>}
                        </td>
                        <td className="px-4 py-4 text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                          {item.buyer || <span className="text-gray-400">N/A</span>}
                        </td>
                        <td className="px-4 py-4 text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                          {item.country || <span className="text-gray-400">N/A</span>}
                        </td>
                        <td className="px-4 py-4 text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                          {item.origin || <span className="text-gray-400">N/A</span>}
                        </td>
                        <td className="px-4 py-4 text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                          {item.mode || <span className="text-gray-400">N/A</span>}
                        </td>
                        <td className="px-4 py-4 text-center font-mono text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                          {item.orderQty?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-4 text-center font-mono text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                          {item.inspectedQty?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-4 text-center border-b border-gray-100 dark:border-gray-700">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            {item.totalPass?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center border-b border-gray-100 dark:border-gray-700">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            <XCircle className="w-4 h-4 mr-1" />
                            {item.totalReject?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center border-b border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              (item.passRate || 0) >= 90 ? 'bg-green-500' : 
                              (item.passRate || 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <span className="font-semibold font-mono">
                              {item.passRate || 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <AlertCircle className="w-12 h-12 text-gray-400" />
                          <p className="text-gray-500 dark:text-gray-400 text-lg">No measurement data available</p>
                          <p className="text-gray-400 dark:text-gray-500 text-sm">Try adjusting your filters to see results</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enhanced Pagination */}
          {!selectedMono && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <FaInfoCircle className="w-4 h-4" />
                <span>
                                    Page {currentPage} of {totalPages}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ActionButton
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoadingSummary}
                  variant="secondary"
                  size="small"
                  icon={ChevronLeft}
                >
                  Previous
                </ActionButton>
                
                <div className="flex items-center space-x-1">
                  {getPaginationRange().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      disabled={isLoadingSummary}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        page === currentPage
                          ? "bg-blue-600 text-white shadow-lg transform scale-105"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      } disabled:opacity-50`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <ActionButton
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoadingSummary}
                  variant="secondary"
                  size="small"
                  icon={ChevronRight}
                >
                  Next
                </ActionButton>
              </div>
            </div>
          )}
        </Card>

        {/* Detailed Inspection Section */}
        {selectedMono && measurementDetails ? (
          <div className="space-y-8">
            {/* Total Summary */}
            <DigitalMeasurementTotalSummary
              summaryData={measurementDetails.measurementPointSummary || []}
              records={measurementDetails.records || []}
              sizeSpec={measurementDetails.sizeSpec || []}
              decimalToFraction={decimalToFraction}
            />

            {/* Detailed Inspection Table */}
            <Card 
              title={`Detailed Inspection Report`}
              subtitle={`Manufacturing Order: ${selectedMono}`}
              icon={FaEye}
              className="transition-all duration-300 hover:shadow-xl"
            >
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full bg-white dark:bg-gray-800">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Inspection Date</span>
                        </div>
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                        Garment Details
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                        Size
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                        Measurement Point
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                        Buyer Specs
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                        Tol. Minus
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                        Tol. Plus
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                        Measured Value
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                        Difference
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {measurementDetails.records.length > 0 ? (
                      measurementDetails.records.map((record, garmentIndex) => {
                        const inspectionDate = new Date(record.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit"
                        });
                        const garmentNo = garmentIndex + 1;
                        const size = record.size || "N/A";
                        const points = record.actual
                          .map((actualItem, index) => {
                            if (actualItem.value === 0) return null;

                            const spec = measurementDetails.sizeSpec[index];
                            const measurementPoint = spec.EnglishRemark;
                            const tolMinus = spec.ToleranceMinus.decimal;
                            const tolPlus = spec.TolerancePlus.decimal;
                            const buyerSpec = spec.Specs.find(
                              (s) => Object.keys(s)[0] === record.size
                            )?.[record.size]?.decimal || 0;
                            const measureValue = actualItem.value;
                            const diff = buyerSpec - measureValue;
                            const lower = buyerSpec + tolMinus;
                            const upper = buyerSpec + tolPlus;
                            const status = measureValue >= lower && measureValue <= upper ? "Pass" : "Fail";

                            return {
                              measurementPoint,
                              buyerSpec,
                              tolMinus,
                              tolPlus,
                              measureValue,
                              diff,
                              status,
                              actualIndex: index,
                              referenceNo: record.reference_no
                            };
                          })
                          .filter((p) => p !== null);

                        return points.map((point, pointIndex) => {
                          const cellId = `${garmentIndex}-${pointIndex}`;
                          const isEditing = editingCell === cellId;
                          const overallStatus = points.every((p) => p.status === "Pass") ? "Pass" : "Fail";

                          return (
                            <tr
                              key={`${garmentIndex}-${pointIndex}`}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                            >
                              {pointIndex === 0 ? (
                                <td
                                  rowSpan={points.length}
                                  className="px-4 py-4 border-b border-gray-100 dark:border-gray-700 align-top"
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                      <Calendar className="w-4 h-4 text-blue-500" />
                                      <span>{inspectionDate}</span>
                                    </div>
                                    <ActionButton
                                      onClick={() =>
                                        Modal.confirm({
                                          title: "Confirm Deletion",
                                          content: "Are you sure you want to delete this measurement record? This action cannot be undone.",
                                          okText: "Delete",
                                          okType: "danger",
                                          cancelText: "Cancel",
                                          icon: <AlertCircle className="w-6 h-6 text-red-500" />,
                                          onOk: async () => {
                                            try {
                                              await axios.delete(
                                                `${API_BASE_URL}/api/delete-measurement-record`,
                                                {
                                                  data: {
                                                    moNo: selectedMono,
                                                    referenceNo: point.referenceNo
                                                  },
                                                  withCredentials: true,
                                                  headers: {
                                                    "Content-Type": "application/json"
                                                  }
                                                }
                                              );
                                              await Promise.all([
                                                fetchSummaryData(),
                                                fetchMeasurementSummary(),
                                                fetchMeasurementDetails()
                                              ]);
                                            } catch (error) {
                                              console.error("Error deleting measurement record:", error.response?.data || error.message);
                                              Modal.error({
                                                title: "Deletion Failed",
                                                content: error.response?.data?.error || error.message
                                              });
                                            }
                                          }
                                        })
                                      }
                                      variant="danger"
                                      size="small"
                                      icon={FaTrash}
                                    >
                                      Delete Record
                                    </ActionButton>
                                  </div>
                                </td>
                              ) : null}

                              {pointIndex === 0 ? (
                                <td
                                  rowSpan={points.length}
                                  className="px-4 py-4 border-b border-gray-100 dark:border-gray-700 align-top"
                                >
                                  <div className="space-y-3">
                                    <div className="text-center">
                                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        Garment #{garmentNo}
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                        Ref: {point.referenceNo}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                      <FaClock className="w-4 h-4" />
                                      <span>
                                        {new Date(record.created_at).toLocaleTimeString("en-US", {
                                          hour12: false,
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          second: "2-digit"
                                        })}
                                      </span>
                                    </div>

                                    <div className="flex justify-center">
                                      <StatusBadge status={overallStatus} />
                                    </div>
                                  </div>
                                </td>
                              ) : null}

                              {pointIndex === 0 ? (
                                <td
                                  rowSpan={points.length}
                                  className="px-4 py-4 text-center font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 align-middle"
                                >
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                    {size}
                                  </span>
                                </td>
                              ) : null}

                              <td className="px-4 py-4 text-left text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                                <div className="font-medium">{point.measurementPoint}</div>
                              </td>

                              <td className="px-4 py-4 text-center font-mono text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                                {decimalToFraction(point.buyerSpec)}
                              </td>

                              <td className="px-4 py-4 text-center font-mono text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                                {decimalToFraction(point.tolMinus)}
                              </td>

                              <td className="px-4 py-4 text-center font-mono text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                                {decimalToFraction(point.tolPlus)}
                              </td>

                              <td className="px-4 py-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-center space-x-3">
                                  {isEditing ? (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="number"
                                        inputMode="numeric"
                                        step="0.001"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        autoFocus
                                      />
                                      <ActionButton
                                        onClick={() =>
                                          handleSaveClick(
                                            selectedMono,
                                            point.referenceNo,
                                            point.actualIndex,
                                            garmentIndex,
                                            pointIndex
                                          )
                                        }
                                        variant="success"
                                        size="small"
                                        icon={FaSave}
                                      >
                                        Save
                                      </ActionButton>
                                      <ActionButton
                                        onClick={() => {
                                          setEditingCell(null);
                                          setEditValue("");
                                        }}
                                        variant="secondary"
                                        size="small"
                                        icon={FaTimes}
                                      >
                                        Cancel
                                      </ActionButton>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <span className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {point.measureValue.toFixed(3)}
                                      </span>
                                      <ActionButton
                                        onClick={() =>
                                          handleEditClick(garmentIndex, pointIndex, point.measureValue)
                                        }
                                        variant="secondary"
                                        size="small"
                                        icon={FaEdit}
                                      >
                                        Edit
                                      </ActionButton>
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className={`px-4 py-4 text-center font-mono font-semibold border-b border-gray-100 dark:border-gray-700 ${
                                point.diff >= point.tolMinus && point.diff <= point.tolPlus
                                  ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                  : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                              }`}>
                                {point.diff > 0 ? '+' : ''}{point.diff.toFixed(3)}
                              </td>

                              <td className="px-4 py-4 text-center border-b border-gray-100 dark:border-gray-700">
                                <StatusBadge status={point.status} size="small" />
                              </td>
                            </tr>
                          );
                        });
                      })
                    ) : (
                      <tr>
                        <td colSpan="10" className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center space-y-3">
                            <AlertCircle className="w-12 h-12 text-gray-400" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                              No inspection records found
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm">
                              No garments have been inspected for this manufacturing order
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : selectedMono ? (
          <Card className="text-center py-12">
            <LoadingSpinner size="large" text="Loading detailed inspection data..." />
          </Card>
        ) : (
          <Card className="text-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <FaEye className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Select a Manufacturing Order
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Click on any MO Number in the table above to view detailed inspection results and measurement data
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DigitalMeasurement;

