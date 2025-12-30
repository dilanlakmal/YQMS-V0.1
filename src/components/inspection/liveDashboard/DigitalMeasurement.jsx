import React, { useState, useEffect } from "react";
import axios from "axios";
import "antd/dist/reset.css";
import { Modal } from "antd";
import { 
  FaClock, 
  FaEdit, 
  FaSave, 
  FaTrash, 
  FaTimes,
  FaCheck,
  FaExclamationTriangle
} from "react-icons/fa";
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
  Star
} from "lucide-react";
import DigitalMeasurementFilterPane from "../digital_measurement/DigitalMeasurementFilterPane";
import DigialMeasurementSummaryCards from "../digital_measurement/DigialMeasurementSummaryCards";
import DigitalMeasurementTotalSummary from "../digital_measurement/DigitalMeasurementTotalSummary";
import DigitalMeasurementTotalSummaryCPK from "../digital_measurement/DigitalMeasurementTotalSummary-CPK";
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
  const [refreshing, setRefreshing] = useState(false);

  const filteredMeasurementSummary = selectedMono
    ? measurementSummary.filter((item) => item.moNo === selectedMono)
    : measurementSummary;

  // Enhanced loading component
  const LoadingSpinner = ({ size = "default", text = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-4 border-blue-500 border-t-transparent ${
        size === "small" ? "h-8 w-8" : size === "large" ? "h-16 w-16" : "h-12 w-12"
      }`}></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">{text}</p>
    </div>
  );

  // Enhanced status badge component
  const StatusBadge = ({ status, size = "default" }) => {
    const baseClasses = `inline-flex items-center font-bold rounded-full border-2 ${
      size === "small" ? "px-2 py-1 text-xs" : "px-3 py-1 text-sm"
    }`;
    
    if (status === "Pass") {
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-600`}>
          <CheckCircle className="w-3 h-3 mr-1" />
          Pass
        </span>
      );
    } else {
      return (
        <span className={`${baseClasses} bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-600`}>
          <XCircle className="w-3 h-3 mr-1" />
          Fail
        </span>
      );
    }
  };

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
      success: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/25 focus:ring-green-500/50",
      danger: "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-red-500/25 focus:ring-red-500/50",
      warning: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/25 focus:ring-amber-500/50",
      secondary: "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 shadow-gray-200/50 focus:ring-gray-300/50"
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

  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchSummaryData(),
        fetchMeasurementSummary(),
        fetchMeasurementDetails()
      ]);
    } finally {
      setRefreshing(false);
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
    if (!decimal || isNaN(decimal)) return <span> </span>;

    const sign = decimal < 0 ? "-" : "";
    const absDecimal = Math.abs(decimal);
    const fractionValue =
      absDecimal >= 1 ? absDecimal - Math.floor(absDecimal) : absDecimal;
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

      await refreshAllData();
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
                    Digital Measurement Dashboard
                  </h1>
                  <p className="text-blue-100 dark:text-gray-300 text-sm mt-1">
                    Comprehensive measurement analysis and quality control
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <ActionButton
                  onClick={refreshAllData}
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

          {/* Filter Pane */}
          <div className="p-8">
            <DigitalMeasurementFilterPane
              filters={filters}
              setFilters={setFilters}
              filterOptions={filterOptions}
              selectedMono={selectedMono}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8">
          <DigialMeasurementSummaryCards summaryData={summaryData} />
        </div>

        {/* Measurement Summary Section */}
        <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedMono && (
                  <ActionButton
                    onClick={() => setSelectedMono(null)}
                    variant="danger"
                    size="small"
                    icon={FaTimes}
                  >
                    Clear Selection
                  </ActionButton>
                )}
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Measurement Summary
                  </h2>
                </div>
              </div>
              
              {selectedMono && (
                <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-xl">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-800 dark:text-blue-300 font-semibold">
                    Selected: {selectedMono}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
              {isLoadingSummary && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <LoadingSpinner text="Loading measurement data..." />
                </div>
              )}

              <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-gray-800 dark:to-gray-700 sticky top-0 z-10">
                    <tr>
                      {[
                        "MO No", "Cust. Style", "Buyer", "Country", "Origin", 
                        "Mode", "Order Qty", "Inspected Qty", "Total Pass", 
                        "Total Reject", "Pass Rate"
                      ].map((header) => (
                        <th key={header} className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredMeasurementSummary.length > 0 ? (
                      filteredMeasurementSummary.map((item, index) => (
                        <tr
                          key={index}
                          className={`transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-800 ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => setSelectedMono(item.moNo)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold hover:underline transition-colors duration-200"
                            >
                              {item.moNo}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                            {item.custStyle || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {item.buyer || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {item.country || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {item.origin || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {item.mode || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                            {item.orderQty.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400">
                            {item.inspectedQty.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400">
                            {item.totalPass.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400">
                            {item.totalReject.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              item.passRate >= 95 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : item.passRate >= 85
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {item.passRate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center space-y-3">
                            <Search className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                            <div className="text-gray-500 dark:text-gray-400">
                              <p className="font-medium">No measurement data available</p>
                              <p className="text-sm">Try adjusting your filters</p>
                            </div>
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
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <Info className="w-4 h-4" />
                  <span>
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
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
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          page === currentPage
                            ? "bg-blue-500 text-white shadow-lg"
                            : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
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
          </div>
        </div>

        {/* Detailed Measurement Section */}
        {selectedMono && measurementDetails ? (
          <div className="space-y-8">
            {/* Total Summary */}
            <DigitalMeasurementTotalSummary
              summaryData={measurementDetails.measurementPointSummary || []}
              records={measurementDetails.records || []}
              sizeSpec={measurementDetails.sizeSpec || []}
              decimalToFraction={decimalToFraction}
            />

                        {/* Detailed Records */}
            <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Detailed Inspection Records for MO: {selectedMono}
                  </h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Individual garment measurements with pass/fail status
                </p>
              </div>

              <div className="p-6">
                <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto max-h-[800px] custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-gray-800 dark:to-gray-700 sticky top-0 z-10">
                        <tr>
                          {[
                            "Inspection Date", "Garment NO", "Size", "Measurement Point",
                            "Buyer Specs", "TolMinus", "TolPlus", "Measure Value",
                            "Diff", "Status"
                          ].map((header) => (
                            <th key={header} className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
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
                              const diffBgColor = point.diff >= point.tolMinus && point.diff <= point.tolPlus
                                ? "bg-green-50 dark:bg-green-900/20"
                                : "bg-red-50 dark:bg-red-900/20";

                              return (
                                <tr
                                  key={`${garmentIndex}-${pointIndex}`}
                                  className={`transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                    pointIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                                  }`}
                                >
                                  {pointIndex === 0 ? (
                                    <td rowSpan={points.length} className="px-4 py-4 border-r border-gray-200 dark:border-gray-700 align-middle">
                                      <div className="flex flex-col items-center space-y-3 p-2">
                                        <div className="text-center">
                                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {inspectionDate}
                                          </div>
                                          <div className="flex items-center justify-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {new Date(record.created_at).toLocaleTimeString("en-US", {
                                              hour12: false,
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              second: "2-digit"
                                            })}
                                          </div>
                                        </div>
                                        
                                        <ActionButton
                                          onClick={() =>
                                            Modal.confirm({
                                              title: "Confirm Deletion",
                                              content: "Do you really need to delete this measurement record?",
                                              okText: "Yes",
                                              okType: "danger",
                                              cancelText: "No",
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
                                                  await refreshAllData();
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
                                          Delete
                                        </ActionButton>
                                      </div>
                                    </td>
                                  ) : null}

                                  {pointIndex === 0 ? (
                                    <td rowSpan={points.length} className="px-4 py-4 border-r border-gray-200 dark:border-gray-700 align-middle">
                                      <div className="flex flex-col items-center space-y-3 p-2">
                                        <div className="text-center">
                                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            #{garmentNo}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Ref: "{point.referenceNo}"
                                          </div>
                                        </div>
                                        
                                        <StatusBadge 
                                          status={points.every((p) => p.status === "Pass") ? "Pass" : "Fail"}
                                          size="small"
                                        />
                                      </div>
                                    </td>
                                  ) : null}

                                  {pointIndex === 0 ? (
                                    <td rowSpan={points.length} className="px-4 py-4 border-r border-gray-200 dark:border-gray-700 align-middle text-center">
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                        {size}
                                      </span>
                                    </td>
                                  ) : null}

                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                                    {point.measurementPoint}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center font-mono">
                                    {decimalToFraction(point.buyerSpec)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center font-mono text-red-600 dark:text-red-400">
                                    {decimalToFraction(point.tolMinus)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center font-mono text-green-600 dark:text-green-400">
                                    {decimalToFraction(point.tolPlus)}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex items-center justify-center space-x-2">
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          inputMode="numeric"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          autoFocus
                                        />
                                      ) : (
                                        <span className="font-mono font-bold text-gray-900 dark:text-white">
                                          {point.measureValue.toFixed(3)}
                                        </span>
                                      )}
                                      
                                      <ActionButton
                                        onClick={() =>
                                          isEditing
                                            ? handleSaveClick(
                                                selectedMono,
                                                point.referenceNo,
                                                point.actualIndex,
                                                garmentIndex,
                                                pointIndex
                                              )
                                            : handleEditClick(garmentIndex, pointIndex, point.measureValue)
                                        }
                                        variant={isEditing ? "success" : "primary"}
                                        size="small"
                                        icon={isEditing ? FaSave : FaEdit}
                                      >
                                        {isEditing ? "Save" : "Edit"}
                                      </ActionButton>
                                    </div>
                                  </td>
                                  <td className={`px-4 py-3 text-sm text-center font-mono font-bold ${diffBgColor} ${
                                    point.diff >= point.tolMinus && point.diff <= point.tolPlus
                                      ? "text-green-800 dark:text-green-400"
                                      : "text-red-800 dark:text-red-400"
                                  }`}>
                                    {point.diff.toFixed(3)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center">
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
                                <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                                <div className="text-gray-500 dark:text-gray-400">
                                  <p className="font-medium">No garments inspected</p>
                                  <p className="text-sm">No inspection records found for this MO</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : selectedMono ? (
          <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 p-12">
            <LoadingSpinner size="large" text="Loading measurement details..." />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-800/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Target size={32} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Select a Manufacturing Order
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Choose a MO number from the table above to view detailed inspection measurements and analysis.
              </p>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Info className="w-4 h-4" />
              <span>Data refreshes automatically every 30 seconds</span>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Measurements</span>
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
      <style jsx>{`
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

export default DigitalMeasurement;

