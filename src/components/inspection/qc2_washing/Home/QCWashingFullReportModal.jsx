import React, { useEffect, useState } from "react";
import { X, FileText, Palette, Building, User, Hash, Droplets, ClipboardCheck, Package, Target, CheckCircle, XCircle, TrendingUp, BarChart3, AlertTriangle, Ruler, Thermometer, Clock, Zap, Beaker, ShoppingCart, Factory, Eye, Camera, MessageSquare, Award, Activity, ArrowLeftRight,
  CalendarDays
 } from "lucide-react";
import axios from "axios";

import { API_BASE_URL } from "../../../../../config";
import { getToleranceAsFraction, decimalToFraction } from "../Home/fractionConverter";

const QCWashingFullReportModal = ({ isOpen, onClose, recordData, checkpointDefinitions }) => {
  const [reportData, setReportData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [selectedKValue, setSelectedKValue] = useState(null);
  const [inspectorDetails, setInspectorDetails] = useState(null);
  const [availableKValues, setAvailableKValues] = useState([]);
  const [showAllPcs, setShowAllPcs] = useState(false);
  const [processedReportData, setProcessedReportData] = useState(null);
  // Lazy load heavy table views
  const [activeView, setActiveView] = useState('full'); // 'none', 'full', 'size-by-size'

  // Helper function to convert file paths to accessible URLs
// Helper function to convert file paths to accessible URLs
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it starts with "./public", remove the prefix and create a proper URL
  if (imagePath.startsWith('./public')) {
    const cleanPath = imagePath.replace('./public', '');
    return `${API_BASE_URL}${cleanPath}`;
  }
  
  // For other cases, assume it's a relative path and prepend API_BASE_URL
  return `${API_BASE_URL}${imagePath}`;
};


// Fetch comparison data (opposite wash type measurements)
  const fetchComparisonData = async (orderNo, color, washType, reportType, factory, currentWashType) => {
  setIsLoadingComparison(true);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/qc-washing/results`, {
      params: {
        orderNo,
        color,
        reportType,
        factory
      }
    });
    
    const targetWashType = currentWashType === 'Before Wash' ? 'After Wash' : 'Before Wash';
    
    // Find all matching records with the target wash type
    let comparisonRecords = [];
    
    if (reportType === 'First Output') {
      // Get all records that match the criteria
      comparisonRecords = response.data.filter(record => 
        record.orderNo === orderNo &&
        record.color === color &&
        record.reportType === reportType &&
        record.before_after_wash === targetWashType &&
        record.measurementDetails?.measurement?.length > 0
      );
    } else {
      // For other report types, use exact match
      comparisonRecords = response.data.filter(record => 
        record.orderNo === orderNo &&
        record.color === color &&
        record.washType === washType &&
        record.reportType === reportType &&
        record.factoryName === factory &&
        record.before_after_wash === targetWashType &&
        record.measurementDetails?.measurement?.length > 0
      );
    }
    
    // Merge all measurement data from matching records
    let mergedComparisonData = null;
    if (comparisonRecords.length > 0) {
      mergedComparisonData = {
        ...comparisonRecords[0],
        measurementDetails: {
          ...comparisonRecords[0].measurementDetails,
          measurement: []
        }
      };
      
      // Collect all measurements from all matching records
      const allMeasurements = [];
      comparisonRecords.forEach(record => {
        if (record.measurementDetails?.measurement) {
          allMeasurements.push(...record.measurementDetails.measurement);
        }
      });
      
      mergedComparisonData.measurementDetails.measurement = allMeasurements;
    }
  
    
    
    setComparisonData(mergedComparisonData);
  } catch (error) {
    console.error('Error fetching comparison data:', error);
    setComparisonData(null);
  } finally {
    setIsLoadingComparison(false);
  }
};

  useEffect(() => {
  if (isOpen && recordData) {
    setReportData(null); // Force re-render by clearing old data first
    // Transform the existing record data to match expected format
    const transformedData = {
      ...recordData,
      colorName: recordData.color,
      formData: {
        result: recordData.overallFinalResult,
        remarks: recordData.defectDetails?.comment || "",
        measurements: recordData.measurementDetails?.measurement || []
      }
    };
    setReportData(transformedData);
    
    // Extract available K-values and set default selection
    if (recordData.measurementDetails?.measurement) {
      const kValues = recordData.measurementDetails.measurement.map(size => size.kvalue).filter(Boolean);
      const uniqueKValues = [...new Set(kValues)];
      setAvailableKValues(uniqueKValues);
      setSelectedKValue(uniqueKValues[0] || null);
    }
    
    // Fetch comparison data for First Output and Inline reports with measurements
    if (recordData.measurementDetails?.measurement?.length > 0 &&
        (recordData.reportType === 'Inline' || recordData.reportType === 'First Output') &&
        (recordData.before_after_wash === 'After Wash' || recordData.before_after_wash === 'Before Wash')) {
      fetchComparisonData(
        recordData.orderNo,
        recordData.color,
        recordData.washType,
        recordData.reportType,
        recordData.factoryName,
        recordData.before_after_wash
      );
    } else {
      setComparisonData(null);
    }

    // Fetch inspector details
    if (isOpen && recordData?.userId) {
      fetch(`${API_BASE_URL}/api/users/${recordData.userId}`)
        .then(res => {
          if (!res.ok) throw new Error('Inspector not found');
          return res.json();
        })
        .then(data => {
          if (!data.error) setInspectorDetails(data);
          else {
            console.error("Inspector not found:", data.error);
            setInspectorDetails(null);
          }
        })
        .catch(err => {
          console.error("Error fetching inspector details:", err);
          setInspectorDetails(null);
        });
    }

  }
}, [isOpen, recordData]);

  useEffect(() => {
    if (!reportData) {
      setProcessedReportData(null);
      return;
    }

    // Only apply duplication if the checkbox is checked and it's an "actual" report
    if (!showAllPcs || !reportData.isActualWashQty) {
      setProcessedReportData(reportData);
      return;
    }

    const duplicateData = JSON.parse(JSON.stringify(reportData));
    const checkedQty = duplicateData.checkedQty || 0;
    
    if (!duplicateData.measurementDetails || !duplicateData.measurementDetails.measurement) {
        setProcessedReportData(duplicateData);
        return;
    }

    const totalMeasuredPcs = duplicateData.measurementDetails.measurement.reduce((sum, sizeData) => {
      return sum + (sizeData.pcs?.length || 0);
    }, 0);

    if (checkedQty <= totalMeasuredPcs) {
      setProcessedReportData(duplicateData);
      return;
    }

    let pcsToAdd = checkedQty - totalMeasuredPcs;
    const templatePcs = duplicateData.measurementDetails.measurement.flatMap(sizeData => 
      (sizeData.pcs || []).map(pc => ({ size: sizeData.size, kvalue: sizeData.kvalue, pcData: pc }))
    );

    if (templatePcs.length === 0) {
      setProcessedReportData(duplicateData);
      return;
    }

    for (let i = 0; i < pcsToAdd; i++) {
      const template = templatePcs[i % templatePcs.length];
      const sizeData = duplicateData.measurementDetails.measurement.find(sd => sd.size === template.size && sd.kvalue === template.kvalue);
      
      if (sizeData) {
        const newPc = JSON.parse(JSON.stringify(template.pcData));
        newPc.pcNumber = (sizeData.pcs?.length || 0) + 1;
        newPc.isDuplicated = true; // Flag for duplicated pcs
        if (!sizeData.pcs) sizeData.pcs = [];
        sizeData.pcs.push(newPc);
      }
    }
    
    setProcessedReportData(duplicateData);
  }, [reportData, showAllPcs]);

  if (!isOpen) return null;

  // Reset comparison data when modal closes
  if (!isOpen && comparisonData) {
    setComparisonData(null);
  }

  // Handler for toggling the heavy table views
  const handleViewChange = (view) => {
    setActiveView(currentView => {
      if (currentView === view) {
        return 'none'; // Toggle off if already active
      }
      return view; // Set to the new view
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-8xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">QC Washing Full Report</h2>
                <p className="text-blue-100 text-sm">Comprehensive Quality Control Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {inspectorDetails && (
                <div className="flex items-center gap-3">
                  <img
                    src={inspectorDetails.face_photo || '/assets/img/avatars/default-profile.png'}
                    alt={inspectorDetails.eng_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/50"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/assets/img/avatars/default-profile.png'; }}
                  />
                  <div className="text-right">
                    <p className="text-sm font-semibold">{inspectorDetails.eng_name}</p>
                    <p className="text-xs text-blue-200">{inspectorDetails.emp_id}</p>
                  </div>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!processedReportData ? (
            <div className="text-center py-10 text-gray-600 dark:text-gray-300">
              No data available for this report.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Details */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
                      <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Order Information
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Order Details</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-300 uppercase tracking-wide">Order No</p>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{processedReportData.orderNo}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center">
                      <div className="bg-indigo-500 p-2 rounded-lg">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-300 uppercase tracking-wide">Order Qty</p>
                        <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{processedReportData.orderQty}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center">
                      <div className="bg-purple-500 p-2 rounded-lg">
                        <Palette className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-purple-600 dark:text-purple-300 uppercase tracking-wide">Color</p>
                        <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{processedReportData.color}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl p-4 border border-pink-200 dark:border-pink-800">
                    <div className="flex items-center">
                      <div className="bg-pink-500 p-2 rounded-lg">
                        <Hash className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-pink-600 dark:text-pink-300 uppercase tracking-wide">Color Qty</p>
                        <p className="text-lg font-bold text-pink-900 dark:text-pink-100">{processedReportData.colorOrderQty}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800">
                    <div className="flex items-center">
                      <div className="bg-cyan-500 p-2 rounded-lg">
                        <Droplets className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-cyan-600 dark:text-cyan-300 uppercase tracking-wide">Wash Type</p>
                        <p className="text-lg font-bold text-cyan-900 dark:text-cyan-100">{processedReportData.washType || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-xl p-4 border border-teal-200 dark:border-teal-800">
                    <div className="flex items-center">
                      <div className="bg-teal-500 p-2 rounded-lg">
                        <ClipboardCheck className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-teal-600 dark:text-teal-300 uppercase tracking-wide">Report Type</p>
                        <p className="text-lg font-bold text-teal-900 dark:text-teal-100">{processedReportData.reportType || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center">
                      <div className="bg-orange-500 p-2 rounded-lg">
                        <Factory className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-orange-600 dark:text-orange-300 uppercase tracking-wide">Factory</p>
                        <p className="text-lg font-bold text-orange-900 dark:text-orange-100">{processedReportData.factoryName || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-center">
                      <div className="bg-green-500 p-2 rounded-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-green-600 dark:text-green-300 uppercase tracking-wide">Buyer</p>
                        <p className="text-lg font-bold text-green-900 dark:text-green-100">{processedReportData.buyer || 'N/A'}</p>
                      </div>
                    </div>
                  </div> 
                  <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 rounded-xl p-4 border border-violet-200 dark:border-violet-800">
                  <div className="flex items-center">
                    <div className="bg-violet-500 p-2 rounded-lg">
                      <CalendarDays className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-violet-600 dark:text-violet-300 uppercase tracking-wide">Inspection Date</p>
                      <p className="text-lg font-bold text-violet-900 dark:text-violet-100">
                        {(() => {
                          // Try multiple possible date fields
                          const inspectionDate = 
                            processedReportData.inspectionDate || 
                            processedReportData.inspection_date ||
                            processedReportData.createdAt ||
                            processedReportData.created_at ||
                            processedReportData.updatedAt ||
                            processedReportData.updated_at;
                            
                          if (!inspectionDate) return 'N/A';
                          
                          try {
                            let dateObj;
                            let dateString = inspectionDate;
                            
                            // Handle MongoDB's extended JSON format for dates
                            if (typeof inspectionDate === 'object' && inspectionDate !== null && inspectionDate.$date) {
                              dateString = inspectionDate.$date;
                            }
                            
                            // Create a date object
                            dateObj = new Date(dateString);
                            
                            if (isNaN(dateObj.getTime())) {
                              console.warn('Invalid inspection date:', inspectionDate);
                              return 'Invalid Date';
                            }
                            
                            // Format the date
                            const formattedDate = dateObj.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              timeZone: 'UTC'
                            });
                            
                            return formattedDate;
                          } catch (error) {
                            console.error('Date parsing error:', error, 'for value:', inspectionDate);
                            return 'Error parsing date';
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
                </div>
              </div>

              {/* Summary Data */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg mr-3">
                      <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    Quality Summary
                  </h3>
                  <div className="bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">Performance Metrics</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="bg-blue-500 p-3 rounded-xl">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-300 uppercase tracking-wide mb-1">Checked Qty</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{processedReportData.checkedQty}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="bg-purple-500 p-3 rounded-xl">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-purple-600 dark:text-purple-300 uppercase tracking-wide mb-1">Total Pcs</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{processedReportData.totalCheckedPcs}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="bg-cyan-500 p-3 rounded-xl">
                        <Droplets className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-cyan-600 dark:text-cyan-300 uppercase tracking-wide mb-1">Wash Qty</p>
                        <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
                          {processedReportData.displayWashQty ?? processedReportData.washQty}
                          {processedReportData.isActualWashQty && (
                            <span className="text-sm text-green-500 ml-1">(Actual)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="bg-indigo-500 p-3 rounded-xl">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-300 uppercase tracking-wide mb-1">Check Points</p>
                        <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{processedReportData.totalCheckedPoint}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="bg-green-500 p-3 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-green-600 dark:text-green-300 uppercase tracking-wide mb-1">Total Pass</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">{processedReportData.totalPass}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-800 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="bg-red-500 p-3 rounded-xl">
                        <XCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-red-600 dark:text-red-300 uppercase tracking-wide mb-1">Total Fail</p>
                        <p className="text-2xl font-bold text-red-900 dark:text-red-100">{processedReportData.totalFail}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="bg-amber-500 p-3 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-300 uppercase tracking-wide mb-1">Pass Rate(Measurment)</p>
                        <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{processedReportData.passRate}%</p>
                      </div>
                    </div>
                  </div>
                  <div className={`rounded-xl p-4 border hover:shadow-md transition-shadow ${
                    processedReportData.overallFinalResult === 'Pass'
                      ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800'
                      : processedReportData.overallFinalResult === 'Fail'
                      ? 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 border-rose-200 dark:border-rose-800'
                      : 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-xl ${
                        processedReportData.overallFinalResult === 'Pass' ? 'bg-emerald-500' : processedReportData.overallFinalResult === 'Fail' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}>
                        {processedReportData.overallFinalResult === 'Pass' ? (
                          <Award className="w-6 h-6 text-white" />
                        ) : processedReportData.overallFinalResult === 'Fail' ? (
                          <XCircle className="w-6 h-6 text-white" />
                        ) : (
                          <Clock className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${
                          processedReportData.overallFinalResult === 'Pass'
                            ? 'text-emerald-600 dark:text-emerald-300'
                            : processedReportData.overallFinalResult === 'Fail'
                            ? 'text-rose-600 dark:text-rose-300'
                            : 'text-amber-600 dark:text-amber-300'
                        }`}>Final Result</p>
                        <p className={`text-2xl font-bold ${
                          processedReportData.overallFinalResult === 'Pass'
                            ? 'text-emerald-900 dark:text-emerald-100'
                            : processedReportData.overallFinalResult === 'Fail'
                            ? 'text-rose-900 dark:text-rose-100'
                            : 'text-amber-900 dark:text-amber-100'
                        }`}>{processedReportData.overallFinalResult || 'Pending'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Defect Details */}
              {(() => {
                const defectsByPc = processedReportData.defectDetails?.defectsByPc || [];
                const aqlValue = processedReportData.defectDetails?.aqlValue;
                
                return (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
                        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg mr-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        Defect Analysis
                      </h3>
                      <div className="flex items-center space-x-2">
                        {aqlValue && (
                          <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                            AQL: {aqlValue}
                          </div>
                        )}
                        <div className="bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                          <span className="text-xs font-medium text-red-700 dark:text-red-300">Quality Issues</span>
                        </div>
                      </div>
                    </div>
                    
                    {defectsByPc.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {defectsByPc.map((pcDefect, index) => (
                          <div key={index} className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="bg-red-500 p-2 rounded-lg">
                                  <Package className="w-4 h-4 text-white" />
                                </div>
                                <h4 className="text-md font-bold text-red-800 dark:text-red-300">
                                  G - {pcDefect.garmentNo || pcDefect.pcNumber}
                                </h4>
                              </div>
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <span className="text-sm bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300 px-3 py-1 rounded-full font-medium">
                                  {pcDefect.pcDefects?.length || 0} 
                                </span>
                              </div>
                            </div>
                            
                            {pcDefect.pcDefects && pcDefect.pcDefects.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                {pcDefect.pcDefects.map((defect, defectIndex) => (
                                  <div key={defectIndex} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-200 dark:border-red-700 hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-center mb-3">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span className="font-semibold text-red-700 dark:text-red-400">{defect.defectName}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Hash className="w-3 h-3 text-red-500" />
                                        <span className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium">
                                          {defect.defectCount || defect.defectQty}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Defect Images */}
                                   {defect.defectImages && defect.defectImages.length > 0 && (
                                      <div className="mb-3">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <Camera className="w-3 h-3 text-gray-500" />
                                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium"></p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {defect.defectImages.map((img, imgIndex) => {
                                            const imageUrl = getImageUrl(img);
                                            return (
                                              <div key={imgIndex} className="w-full h-24 bg-gray-100 dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-600 overflow-hidden">
                                                {imageUrl ? (
                                                  <img 
                                                    src={imageUrl}
                                                    alt={`Defect: ${defect.defectName}`}
                                                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => window.open(imageUrl, '_blank')}
                                                    onError={(e) => { 
                                                      e.currentTarget.style.display = 'none';
                                                      e.currentTarget.nextElementSibling.style.display = 'flex';
                                                    }}
                                                  />
                                                ) : null}
                                                <div className="w-full h-full flex items-center justify-center text-center" style={{display: 'none'}}>
                                                  <div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">📷</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">Image not available</div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    {/* Remark */}
                                    {defect.remark && (
                                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <MessageSquare className="w-3 h-3 text-gray-500" />
                                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Remark:</p>
                                        </div>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">{defect.remark}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* PC Level Remark */}
                            {pcDefect.remark && (
                              <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <MessageSquare className="w-4 h-4 text-gray-500" />
                                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Garment Remark:</p>
                                </div>
                                <p className="text-sm text-gray-800 dark:text-gray-200">{pcDefect.remark}</p>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Additional Images */}
                        {processedReportData.defectDetails?.additionalImages && processedReportData.defectDetails.additionalImages.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Images:</h5>
                              <div className="grid grid-cols-2 md:grid-cols- gap-3">
                                {processedReportData.defectDetails.additionalImages.map((img, imgIndex) => {
                                  const imageUrl = getImageUrl(img);
                                  return (
                                    <div key={imgIndex} className="w-full h-32 bg-gray-100 dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                                      {imageUrl ? (
                                        <img 
                                          src={imageUrl}
                                          alt={`Additional image ${imgIndex + 1}`}
                                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => window.open(imageUrl, '_blank')}
                                          onError={(e) => { 
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling.style.display = 'flex';
                                          }}
                                        />
                                      ) : null}
                                      <div className="w-full h-full flex items-center justify-center text-center" style={{display: 'none'}}>
                                        <div>
                                          <div className="text-lg text-gray-500 dark:text-gray-400 mb-1">📷</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">Image not available</div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="bg-green-500 p-3 rounded-full">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-800 dark:text-green-200">Perfect Quality!</p>
                            <p className="text-sm text-green-600 dark:text-green-300">No defects found in this inspection</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Inspection Details */}
              {(() => {
                  const inspectionDetails = processedReportData.inspectionDetails || {};
                  return (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
                          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg mr-3">
                            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          Inspection Details
                        </h3>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">
                          <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Quality Checks</span>
                        </div>
                      </div>
                      <div className="space-y-6">
                        {/* Checked Points */}
                        {inspectionDetails.checkpointInspectionData && inspectionDetails.checkpointInspectionData.length > 0 ? (
                          <div>
                            <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Checkpoints</h4>
                            <div className="space-y-6">
                              {inspectionDetails.checkpointInspectionData.map((mainPoint, index) => {
                                const mainPointDef = checkpointDefinitions?.find(def => def._id === mainPoint.checkpointId);
                                const mainPointOption = mainPointDef?.options.find(opt => opt.name === mainPoint.decision);
                                const isFail = mainPointOption?.isFail;

                                return (
                                  <div key={mainPoint.id || index} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-5 hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                      <div className={`p-2 rounded-lg ${
                                        isFail ? 'bg-red-500' : 'bg-green-500'
                                      }`}>
                                        <Target className="w-4 h-4 text-white" />
                                      </div>
                                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{mainPoint.name}</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      isFail
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                    }`}>
                                      {mainPoint.decision}
                                    </span>
                                  </div>
                                  {mainPoint.remark && (
                                    <div className="mt-3 bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Remark:</p>
                                      <p className="text-sm text-gray-800 dark:text-gray-200">{mainPoint.remark}</p>
                                    </div>
                                  )}
                                  {mainPoint.comparisonImages && mainPoint.comparisonImages.length > 0 && (
                                    <div className="mt-4">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Images:</p>
                                      <div className="grid grid-cols-3 gap-2">
                                        {mainPoint.comparisonImages.map((img, imgIdx) => {
                                          const imageUrl = getImageUrl(img);
                                          return (
                                            <div key={imgIdx} className="w-full h-24 bg-gray-100 dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-600 overflow-hidden">
                                              {imageUrl ? (
                                                <img 
                                                  src={imageUrl}
                                                  alt={`Main point image ${imgIdx + 1}`}
                                                  className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                  onClick={() => window.open(imageUrl, '_blank')}
                                                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }}
                                                />
                                              ) : null}
                                              <div className="w-full h-full flex items-center justify-center text-center" style={{display: 'none'}}>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">No Image</div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  {mainPoint.subPoints && mainPoint.subPoints.length > 0 && (
                                    <div className="mt-4 pl-4 border-l-2 border-gray-300 dark:border-gray-500 space-y-3" >
                                      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 -ml-4 mb-2">Sub-points:</h5>
                                      {mainPoint.subPoints.map((subPoint, subIndex) => {
                                        const mainPointDef = checkpointDefinitions?.find(def => def._id === mainPoint.checkpointId);
                                        const subPointDefinition = mainPointDef?.subPoints?.find(sp => sp.id === subPoint.subPointId);
                                        const subPointOption = subPointDefinition?.options?.find(opt => opt.name === subPoint.decision);
                                        const isFail = subPointOption?.isFail === true;

                                        return (
                                          <div key={subPoint.id || subIndex} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <div className="flex justify-between items-center">
                                              <p className="text-sm text-gray-700 dark:text-gray-300">{subPoint.name}:</p>
                                              <div className="flex items-center space-x-2">
                                                <span className={`font-medium ${isFail ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                  {subPoint.decision}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                  isFail 
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                                    : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                                }`}>
                                                  {isFail ? 'No' : 'OK'}
                                                </span>
                                              </div>
                                            </div>
                                            {subPoint.remark && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Remark: {subPoint.remark}</p>}
                                            {subPoint.comparisonImages && subPoint.comparisonImages.length > 0 && (
                                              <div className="mt-2">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Images:</p>
                                                <div className="grid grid-cols-4 gap-2">
                                                  {subPoint.comparisonImages.map((img, imgIdx) => {
                                                    const imageUrl = getImageUrl(img);
                                                    return (
                                                      <div key={imgIdx} className="w-1/2 h-20 bg-gray-100 dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-600 overflow-hidden">
                                                        {imageUrl ? (
                                                          <img 
                                                            src={imageUrl}
                                                            alt={`Sub-point image ${imgIdx + 1}`}
                                                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                            onClick={() => window.open(imageUrl, '_blank')}
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }}
                                                          />
                                                        ) : null}
                                                        <div className="w-full h-full flex items-center justify-center text-center" style={{display: 'none'}}>
                                                          <div className="text-xs text-gray-500 dark:text-gray-400">No Image</div>
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          // Fallback to legacy checkedPoints
                          inspectionDetails.checkedPoints && inspectionDetails.checkedPoints.length > 0 && (
                            <div>
                              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Checked Points</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {inspectionDetails.checkedPoints.map((point, index) => (
                                  <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${
                                          point.decision === 'ok' || point.status === 'Pass' 
                                            ? 'bg-green-500'
                                            : 'bg-red-500'
                                        }`}>
                                          <Target className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{point.pointName}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                          point.decision === 'ok' || point.status === 'Pass' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                        }`}>
                                          {point.status || (point.decision === 'ok' ? 'Pass' : 'Fail')}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Point Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        {point.expectedValue && (
                                          <div className="mb-2">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Expected: </span>
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{point.expectedValue}</span>
                                          </div>
                                        )}
                                        {point.actualValue && (
                                          <div className="mb-2">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Actual: </span>
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{point.actualValue}</span>
                                          </div>
                                        )}
                                        {point.tolerance && (
                                          <div className="mb-2">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Tolerance: </span>
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">±{point.tolerance}</span>
                                          </div>
                                        )}
                                        {point.decision && (
                                          <div className="mb-2">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Decision: </span>
                                            <span className={`text-sm font-bold ${
                                              point.decision.toLowerCase() === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                            }`}>{point.decision.toUpperCase()}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Images */}
                                      <div>
                                        {/* Point Image */}
                                        {point.image && (
                                          <div className="mb-3">
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Point Image:</p>
                                            <div className="w-full h-24 bg-gray-100 dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-600 overflow-hidden">
                                              {(() => {
                                                const imageUrl = getImageUrl(point.image);
                                                return imageUrl ? (
                                                  <img 
                                                    src={imageUrl}
                                                    alt={`Point: ${point.pointName}`}
                                                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => window.open(imageUrl, '_blank')}
                                                    onError={(e) => { 
                                                      e.currentTarget.style.display = 'none';
                                                      e.currentTarget.nextElementSibling.style.display = 'flex';
                                                    }}
                                                  />
                                                ) : null;
                                              })()}
                                              <div className="w-full h-full flex items-center justify-center text-center" style={{display: 'none'}}>
                                                <div>
                                                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">📷</div>
                                                  <div className="text-xs text-gray-500 dark:text-gray-400">Image not available</div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Comparison Images */}
                                        {point.comparison && point.comparison.length > 0 && (
                                          <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Comparison Images:</p>
                                            <div className="grid grid-cols-2 gap-2">
                                              {point.comparison.map((img, imgIndex) => {
                                                const imageUrl = getImageUrl(img);
                                                return (
                                                  <div key={imgIndex} className="w-full h-20 bg-gray-100 dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-600 overflow-hidden">
                                                    {imageUrl ? (
                                                      <img 
                                                        src={imageUrl}
                                                        alt={`Comparison ${imgIndex + 1}`}
                                                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => window.open(imageUrl, '_blank')}
                                                        onError={(e) => { 
                                                          e.currentTarget.style.display = 'none';
                                                          e.currentTarget.nextElementSibling.style.display = 'flex';
                                                        }}
                                                      />
                                                    ) : null}
                                                    <div className="w-full h-full flex items-center justify-center text-center" style={{display: 'none'}}>
                                                      <div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">📷</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">Image not available</div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Remark */}
                                    {point.remark && (
                                      <div className="mt-3 bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Remark:</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">{point.remark}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                                      
                      {/* Parameters */}
                      {inspectionDetails.parameters && inspectionDetails.parameters.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Parameters</h4>
                          <div className="space-y-4">
                            {inspectionDetails.parameters.map((param, index) => (
                              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${
                                      param.result === 'Pass' ? 'bg-green-500' : 'bg-red-500'
                                    }`}>
                                      <BarChart3 className="w-4 h-4 text-white" />
                                    </div>
                                    <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200">{param.parameterName}</h5>
                                  </div>
                                  {/* <div className="flex items-center space-x-2">
                                    {param.result === 'Pass' ? (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      param.result === 'Pass' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                    }`}>
                                      {param.result}
                                    </span>
                                  </div> */}
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-800 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-center mb-2">
                                      <Eye className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium uppercase tracking-wide">Checked</p>
                                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{param.checkedQty || 0}</p>
                                  </div>
                                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-red-100 dark:border-red-800 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-center mb-2">
                                      <AlertTriangle className="w-4 h-4 text-red-500" />
                                    </div>
                                    <p className="text-xs text-red-600 dark:text-red-400 mb-1 font-medium uppercase tracking-wide">Defects</p>
                                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{param.defectQty || 0}</p>
                                  </div>
                                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-green-100 dark:border-green-800 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-center mb-2">
                                      <TrendingUp className="w-4 h-4 text-green-500" />
                                    </div>
                                    <p className="text-xs text-green-600 dark:text-green-400 mb-1 font-medium uppercase tracking-wide">Pass Rate</p>
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{param.passRate || 0}%</p>
                                  </div>
                                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-600 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-center mb-2">
                                      {param.result === 'Pass' ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium uppercase tracking-wide">Result</p>
                                    <p className={`text-sm font-bold ${
                                      param.result === 'Pass' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                    }`}>{param.result}</p>
                                  </div>
                                </div>
                                
                                {/* Parameter Remark */}
                                {param.remark && (
                                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Remark:</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{param.remark}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Machine Processes */}
                      {inspectionDetails.machineProcesses && inspectionDetails.machineProcesses.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Machine Processes</h4>
                          <div className="space-y-4">
                            {inspectionDetails.machineProcesses.map((machine, index) => (
                              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center space-x-3 mb-4">
                                  <div className="bg-indigo-500 p-2 rounded-lg">
                                    <Zap className="w-4 h-4 text-white" />
                                  </div>
                                  <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200">{machine.machineType}</h5>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Temperature */}
                                  {machine.temperature && (machine.temperature.actualValue !== undefined && machine.temperature.actualValue !== null && machine.temperature.actualValue !== "") && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-orange-100 dark:border-orange-800 hover:shadow-sm transition-shadow">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                          <div className={`p-1 rounded ${
                                            machine.temperature.status?.ok ? 'bg-green-100' : 'bg-red-100'
                                          }`}>
                                            <Thermometer className={`w-4 h-4 ${
                                              machine.temperature.status?.ok ? 'text-green-500' : 'text-red-500'
                                            }`} />
                                          </div>
                                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Temperature</span>
                                        </div>
                                        {machine.temperature.status?.ok ? (
                                          <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <XCircle className="w-4 h-4 text-red-500" />
                                        )}
                                      </div>
                                      <div className="text-xs space-y-1">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Standard:</span>
                                          <span className="font-medium text-gray-800 dark:text-gray-200">{machine.temperature.standardValue !== undefined && machine.temperature.standardValue !== null ? machine.temperature.standardValue : 'N/A'}°C</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Actual:</span>
                                          <span className="font-medium text-gray-800 dark:text-gray-200">{machine.temperature.actualValue !== undefined && machine.temperature.actualValue !== null ? machine.temperature.actualValue : 'N/A'}°C</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Regular Time (for Washing Machine) */}
                                  {machine.time && (machine.time.actualValue !== undefined && machine.time.actualValue !== null && machine.time.actualValue !== "") && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-blue-100 dark:border-blue-800 hover:shadow-sm transition-shadow">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                          <div className={`p-1 rounded ${
                                            machine.time.status?.ok ? 'bg-green-100' : 'bg-red-100'
                                          }`}>
                                            <Clock className={`w-4 h-4 ${
                                              machine.time.status?.ok ? 'text-green-500' : 'text-red-500'
                                            }`} />
                                          </div>
                                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Time</span>
                                        </div>
                                        {machine.time.status?.ok ? (
                                          <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <XCircle className="w-4 h-4 text-red-500" />
                                        )}
                                      </div>
                                      <div className="text-xs space-y-1">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Standard:</span>
                                          <span className="font-medium text-gray-800 dark:text-gray-200">{machine.time.standardValue !== undefined && machine.time.standardValue !== null ? machine.time.standardValue : 'N/A'}min</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Actual:</span>
                                          <span className="font-medium text-gray-800 dark:text-gray-200">{machine.time.actualValue !== undefined && machine.time.actualValue !== null ? machine.time.actualValue : 'N/A'}min</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Time Hot (for Tumble Dry) */}
                                  {machine.timeHot && (machine.timeHot.actualValue !== undefined && machine.timeHot.actualValue !== null && machine.timeHot.actualValue !== "") && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-red-800 hover:shadow-sm transition-shadow">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                          <div className={`p-1 rounded ${
                                            machine.timeHot.status?.ok ? 'bg-green-100' : 'bg-red-100'
                                          }`}>
                                            <Clock className={`w-4 h-4 ${
                                              machine.timeHot.status?.ok ? 'text-green-500' : 'text-red-500'
                                            }`} />
                                          </div>
                                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Time Hot</span>
                                        </div>
                                        {machine.timeHot.status?.ok ? (
                                          <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <XCircle className="w-4 h-4 text-red-500" />
                                        )}
                                      </div>
                                      <div className="text-xs space-y-1">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Standard:</span>
                                          <span className="font-medium text-gray-800 dark:text-gray-200">{machine.timeHot.standardValue !== undefined && machine.timeHot.standardValue !== null ? machine.timeHot.standardValue : 'N/A'}min</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Actual:</span>
                                          <span className="font-medium text-gray-800 dark:text-gray-200">{machine.timeHot.actualValue !== undefined && machine.timeHot.actualValue !== null ? machine.timeHot.actualValue : 'N/A'}min</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Time Cool (for Tumble Dry) */}
                                  {machine.timeCool && (machine.timeCool.actualValue !== undefined && machine.timeCool.actualValue !== null && machine.timeCool.actualValue !== "") && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-cyan-100 dark:border-cyan-800 hover:shadow-sm transition-shadow">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                          <div className={`p-1 rounded ${
                                            machine.timeCool.status?.ok ? 'bg-green-100' : 'bg-red-100'
                                          }`}>
                                            <Clock className={`w-4 h-4 ${
                                              machine.timeCool.status?.ok ? 'text-green-500' : 'text-red-500'
                                            }`} />
                                          </div>
                                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Time Cool</span>
                                        </div>
                                        {machine.timeCool.status?.ok ? (
                                          <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <XCircle className="w-4 h-4 text-red-500" />
                                        )}
                                      </div>
                                      <div className="text-xs space-y-1">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Standard:</span>
                                          <span className="font-medium text-gray-800 dark:text-gray-200">{machine.timeCool.standardValue !== undefined && machine.timeCool.standardValue !== null ? machine.timeCool.standardValue : 'N/A'}min</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Actual:</span>
                                          <span className="font-medium text-gray-800 dark:text-gray-200">{machine.timeCool.actualValue !== undefined && machine.timeCool.actualValue !== null ? machine.timeCool.actualValue : 'N/A'}min</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Silicon */}
                                  {machine.silicon && (machine.silicon.actualValue !== undefined && machine.silicon.actualValue !== null && machine.silicon.actualValue !== "") && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-100 dark:border-purple-800 hover:shadow-sm transition-shadow">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                          <div className={`p-1 rounded ${
                                            machine.silicon.status?.ok ? 'bg-green-100' : 'bg-red-100'
                                          }`}>
                                            <Zap className={`w-4 h-4 ${
                                              machine.silicon.status?.ok ? 'text-green-500' : 'text-red-500'
                                            }`} />
                                          </div>
                                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Silicon</span>
                                        </div>
                                        {machine.silicon.status?.ok ? (
                                          <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <XCircle className="w-4 h-4 text-red-500" />
                                        )}
                                      </div>
                                      <div className="text-xs space-y-1">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Standard:</span>
                                          <span className="font-medium text-gray-800 dark:text-gray-200">{machine.silicon.standardValue !== undefined && machine.silicon.standardValue !== null ? machine.silicon.standardValue : 'N/A'}g</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Actual:</span>
                                          <span className="font-medium text-gray-800 dark:text-gray-200">{machine.silicon.actualValue !== undefined && machine.silicon.actualValue !== null ? machine.silicon.actualValue : 'N/A'}g</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Softener */}
                                  {machine.softener && (machine.softener.actualValue !== undefined && machine.softener.actualValue !== null && machine.softener.actualValue !== "") && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-cyan-100 dark:border-cyan-800 hover:shadow-sm transition-shadow">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                          <div className={`p-1 rounded ${
                                            machine.softener.status?.ok ? 'bg-green-100' : 'bg-red-100'
                                          }`}>
                                            <Beaker className={`w-4 h-4 ${
                                              machine.softener.status?.ok ? 'text-green-500' : 'text-red-500'
                                            }`} />
                                          </div>
                                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Softener</span>
                                        </div>
                                        {machine.softener.status?.ok ? (
                                          <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <XCircle className="w-4 h-4 text-red-500" />
                                        )}
                                      </div>
                                      <div className="text-xs space-y-1">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Standard:</span>
                                          <span className="font-medium text-gray-800 dark:text-gray-200">{machine.softener.standardValue !== undefined && machine.softener.standardValue !== null ? machine.softener.standardValue : 'N/A'}g</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Actual:</span>
                                          <span className="font-medium text-gray-800 dark:text-gray-200">{machine.softener.actualValue !== undefined && machine.softener.actualValue !== null ? machine.softener.actualValue : 'N/A'}g</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Machine Image */}
                                {machine.image && (
                                  <div className="mt-3">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Machine Image:</p>
                                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-600 overflow-hidden">
                                      {(() => {
                                        const imageUrl = getImageUrl(machine.image);
                                        return imageUrl ? (
                                          <img 
                                            src={imageUrl}
                                            alt={`Machine: ${machine.machineType}`}
                                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => window.open(imageUrl, '_blank')}
                                            onError={(e) => { 
                                              e.currentTarget.style.display = 'none';
                                              e.currentTarget.nextElementSibling.style.display = 'flex';
                                            }}
                                          />
                                        ) : null;
                                      })()}
                                      <div className="w-full h-full flex items-center justify-center text-center" style={{display: 'none'}}>
                                        <div>
                                          <div className="text-lg text-gray-500 dark:text-gray-400 mb-1">📷</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">Image not available</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
  <div className="flex items-center">
    <div className="bg-purple-500 p-2 rounded-lg">
      <ClipboardCheck className="w-5 h-5 text-white" />
    </div>
    <div className="ml-3">
      <p className="text-xs font-medium text-purple-600 dark:text-purple-300 uppercase tracking-wide">Reference Sample Approve Date</p>
      <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
        {(() => {
          const approveDate = processedReportData.inspectionDetails?.referenceSampleApproveDate;
          if (!approveDate) return 'N/A';
          try {
            let dateObj;
            let dateString = approveDate;
            
            // Handle MongoDB's extended JSON format for dates
            if (typeof approveDate === 'object' && approveDate !== null && approveDate.$date) {
              dateString = approveDate.$date;
            }
            
            // Create a date object. The string is assumed to be in UTC format.
            dateObj = new Date(dateString);
            
            if (isNaN(dateObj.getTime())) {
              console.warn('Invalid approve date:', approveDate);
              return 'Invalid Date';
            }
            
            // Format the date using UTC parts to avoid timezone shifts.
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              timeZone: 'UTC' // Important: interpret the date in UTC
            });
            
            return formattedDate;
          } catch (error) {
            console.error('Date parsing error:', error, 'for value:', approveDate);
            return 'Error parsing date';
          }
        })()}
      </p>
    </div>
  </div>
</div>


                    </div>
                  </div>
                );
              })()}

              {/* Size-wise Measurement Summary */}
              {reportData.measurementDetails?.measurementSizeSummary && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg mr-3">
                        <Ruler className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      Size-wise Measurement Summary
                    </h3>
                    <div className="bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full">
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Size Analysis</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportData.measurementDetails.measurementSizeSummary.map((sizeSummary, index) => (
                      <div key={index} className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="bg-purple-500 p-2 rounded-lg">
                            <Ruler className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="text-md font-bold text-purple-800 dark:text-purple-200">Size: {sizeSummary.size}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Eye className="w-3 h-3 text-blue-500" />
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Checked Pcs</span>
                              </div>
                              <span className="font-bold text-blue-800 dark:text-blue-200">{sizeSummary.checkedPcs}</span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-indigo-100 dark:border-indigo-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Target className="w-3 h-3 text-indigo-500" />
                                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Check Points</span>
                              </div>
                              <span className="font-bold text-indigo-800 dark:text-indigo-200">{sizeSummary.checkedPoints}</span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-100 dark:border-green-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Total Pass</span>
                              </div>
                              <span className="font-bold text-green-800 dark:text-green-200">{sizeSummary.totalPass}</span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-100 dark:border-red-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <XCircle className="w-3 h-3 text-red-500" />
                                <span className="text-xs text-red-600 dark:text-red-400 font-medium">Total Fail</span>
                              </div>
                              <span className="font-bold text-red-800 dark:text-red-200">{sizeSummary.totalFail}</span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-orange-100 dark:border-orange-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <TrendingUp className="w-3 h-3 text-orange-500" />
                                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Plus Tolerance</span>
                              </div>
                              <span className="font-bold text-orange-800 dark:text-orange-200">{sizeSummary.plusToleranceFailCount}</span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-100 dark:border-amber-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <TrendingUp className="w-3 h-3 text-amber-500 transform rotate-180" />
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Minus Tolerance</span>
                              </div>
                              <span className="font-bold text-amber-800 dark:text-amber-200">{sizeSummary.minusToleranceFailCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Measurement Charts by Sizes */}
              {reportData.measurementDetails?.measurementCharts && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
                        <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Measurement Charts by Sizes
                    </h3>
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Size Charts</span>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {Object.entries(reportData.measurementDetails.measurementCharts).map(([size, chartData]) => (
                      <div key={size} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="bg-blue-500 p-2 rounded-lg">
                            <Ruler className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="text-md font-bold text-blue-800 dark:text-blue-200">Size: {size}</h4>
                        </div>
                        
                        {/* Selected Measurement Points */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected Measurement Points:</h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {chartData.selectedPoints?.map((point, index) => (
                              <div key={index} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs">
                                {point}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Measurement Values */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {chartData.measurements?.map((measurement, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-shadow">
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{measurement.point}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {measurement.status === 'Pass' ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500" />
                                  )}
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    measurement.status === 'Pass' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                  }`}>
                                    {measurement.status}
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Spec:</span>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">{measurement.specValue}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Actual:</span>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">{measurement.actualValue}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Tolerance:</span>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">±{measurement.tolerance}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Chart Visualization */}
                        {chartData.chartImage && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Measurement Chart:</h5>
                            <img 
                              src={chartData.chartImage} 
                              alt={`Measurement chart for size ${size}`}
                              className="w-full max-w-2xl mx-auto rounded-lg border border-gray-200 dark:border-gray-600"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Measurement Specifications */}
                {reportData.measurementDetails?.measurement && reportData.measurementDetails.measurement.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
                        <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg mr-3">
                          <Ruler className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        </div>
                      Measurement Results
                      </h3>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={activeView === 'full'}
                          onChange={() => handleViewChange('full')}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Full Chart</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={activeView === 'size-by-size'}
                          onChange={() => handleViewChange('size-by-size')}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Size-by-Size</span>
                      </label>
                        {reportData.isActualWashQty && (
                          <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={showAllPcs}
                              onChange={() => setShowAllPcs(!showAllPcs)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Show All PCs</span>
                          </label>
                        )}
                        {availableKValues.length > 1 && (
                          <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">K-Value:</label>
                            <select
                              value={selectedKValue || ''}
                              onChange={(e) => setSelectedKValue(e.target.value)}
                              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            >
                              {availableKValues.map(kValue => (
                                <option key={kValue} value={kValue}>{kValue}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="bg-teal-50 dark:bg-teal-900/20 px-3 py-1 rounded-full">
                          <span className="text-xs font-medium text-teal-700 dark:text-teal-300">Measurement Results</span>
                        </div>
                      </div>
                    </div>

                    {/* NEW: Conditional rendering for Full Chart */}
                    {activeView === 'full' && (
                      <div className="mb-8">
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="bg-indigo-500 p-2 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="text-lg font-bold text-indigo-800 dark:text-indigo-200">
                            Complete Measurement Data Sheet - All Sizes
                          </h4>
                          <div className="bg-indigo-200 dark:bg-indigo-700 px-3 py-1 rounded-full">
                            <span className="text-xs font-medium text-indigo-800 dark:text-indigo-200">
                              Consolidated View
                            </span>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              {(() => {
                                // Get all unique sizes and sort them
                                const allSizes = [...new Set(
                                  processedReportData.measurementDetails.measurement
                                    .filter(sizeData => !selectedKValue || sizeData.kvalue === selectedKValue)
                                    .map(sizeData => sizeData.size)
                                )].sort();

                                // Get size data with pieces
                                const sizeDataMap = {};
                                processedReportData.measurementDetails.measurement
                                  .filter(sizeData => !selectedKValue || sizeData.kvalue === selectedKValue)
                                  .forEach(sizeData => {
                                    sizeDataMap[sizeData.size] = {
                                      ...sizeData,
                                      sortedPcs: sizeData.pcs.sort((a, b) => {
                                        const aNum = parseInt(String(a.pcNumber));
                                        const bNum = parseInt(String(b.pcNumber));
                                        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                                        return String(a.pcNumber).localeCompare(String(b.pcNumber));
                                      })
                                    };
                                  });

                                return (
                                  <>
                                    {/* First header row - Size names with K-values */}
                                    <tr>
                                      <th rowSpan="2" className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r-2 border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-600">
                                        Measurement Point
                                      </th>
                                      {allSizes.map((size, sizeIndex) => {
                                        const sizeData = sizeDataMap[size];
                                        const pieceCount = sizeData.sortedPcs.length;
                                        const colSpan = pieceCount + 3; // +1 for Spec, Tol(-), Tol(+)

                                        return (
                                          <th key={size} colSpan={colSpan} className={`px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider border-r-2 border-gray-400 dark:border-gray-500 ${
                                            sizeIndex % 2 === 0 
                                              ? 'bg-blue-600 dark:bg-blue-700' 
                                              : 'bg-green-600 dark:bg-green-700'
                                          }`}>
                                            <div className="flex flex-col items-center space-y-1">
                                              <span className="text-sm font-bold">SIZE: {size}</span>
                                              <span className="text-xs bg-white/20 px-2 py-1 rounded">K-Value: {sizeData.kvalue}</span>
                                            </div>
                                          </th>
                                        );
                                      })}
                                    </tr>
                                    
                                    {/* Second header row - Spec, Tolerance, and Piece numbers */}
                                    <tr>
                                      {allSizes.map((size, sizeIndex) => {
                                        const sizeData = sizeDataMap[size];
                                        const bgColorClass = sizeIndex % 2 === 0 
                                          ? 'bg-blue-100 dark:bg-blue-900/30' 
                                          : 'bg-green-100 dark:bg-green-900/30';
                                        const textColorClass = sizeIndex % 2 === 0 
                                          ? 'text-blue-800 dark:text-blue-200' 
                                          : 'text-green-800 dark:text-green-200';
                                        
                                        return (
                                          <React.Fragment key={size}>
                                            <th className={`px-3 py-2 text-center text-xs font-bold uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 ${bgColorClass} ${textColorClass}`}>
                                              Spec
                                            </th>
                                            <th className={`px-2 py-2 text-center text-xs font-bold uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 ${bgColorClass} text-red-700 dark:text-red-400`}>
                                              Tol (-)
                                            </th>
                                            <th className={`px-2 py-2 text-center text-xs font-bold uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 ${bgColorClass} text-green-700 dark:text-green-400`}>
                                              Tol (+)
                                            </th>
                                            {sizeData.sortedPcs.map(pc => (
                                              <th key={`${size}-${pc.pcNumber}`} className={`px-2 py-2 text-center text-xs font-bold uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 ${bgColorClass} ${textColorClass}`}>
                                                PC-{pc.pcNumber}
                                              </th>
                                            ))}
                                          </React.Fragment>
                                        );
                                      })}
                                    </tr>
                                  </>
                                );
                              })()}
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                              {(() => {
                                // Get all unique measurement points across all sizes
                                const allMeasurementPoints = new Set();
                                const measurementPointsData = {};
 
                                // Get all sizes and their data
                                const allSizes = [...new Set(
                                  processedReportData.measurementDetails.measurement
                                    .filter(sizeData => !selectedKValue || sizeData.kvalue === selectedKValue)
                                    .map(sizeData => sizeData.size)
                                )].sort();
 
                                const sizeDataMap = {};
                                 processedReportData.measurementDetails.measurement
                                  .filter(sizeData => !selectedKValue || sizeData.kvalue === selectedKValue)
                                  .forEach(sizeData => {
                                    sizeDataMap[sizeData.size] = {
                                      ...sizeData,
                                      sortedPcs: sizeData.pcs.sort((a, b) => {
                                        const aNum = parseInt(String(a.pcNumber));
                                        const bNum = parseInt(String(b.pcNumber));
                                        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                                        return String(a.pcNumber).localeCompare(String(b.pcNumber));
                                      })
                                    };
                                  });

                                // Collect all measurement points and their data per size
                                allSizes.forEach(size => {
                                  const sizeData = sizeDataMap[size];
                                  sizeData.sortedPcs.forEach(pc => {
                                    pc.measurementPoints.forEach(point => {
                                      allMeasurementPoints.add(point.pointName);
                                      
                                      if (!measurementPointsData[point.pointName]) {
                                        measurementPointsData[point.pointName] = {};
                                      }
                                      
                                      if (!measurementPointsData[point.pointName][size]) {
                                        measurementPointsData[point.pointName][size] = {
                                          specs: point.specs,
                                          toleranceMinus: getToleranceAsFraction(point, 'minus'),
                                          tolerancePlus: getToleranceAsFraction(point, 'plus'),
                                          measurements: {}
                                        };
                                      }
                                      
                                      measurementPointsData[point.pointName][size].measurements[pc.pcNumber] = {
                                        value: point.measured_value_fraction || 'N/A',
                                        result: point.result
                                      };
                                    });
                                  });
                                });

                                return Array.from(allMeasurementPoints).sort().map((pointName, index) => {
                                  return (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                      {/* Measurement Point Name */}
                                      <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200 border-r-2 border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-700">
                                        {pointName}
                                      </td>
                                      
                                      {/* Data for each size */}
                                      {allSizes.map((size, sizeIndex) => {
                                        const sizeData = sizeDataMap[size];
                                        const pointData = measurementPointsData[pointName]?.[size];
                                        const bgColorClass = sizeIndex % 2 === 0 ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-green-50 dark:bg-green-900/10';
                                        
                                        return (
                                          <React.Fragment key={size}>
                                            {/* Spec for this size */}
                                            <td className={`px-3 py-3 text-center text-sm font-medium text-blue-800 dark:text-blue-200 border-r border-gray-300 dark:border-gray-600 ${bgColorClass}`}>
                                              {pointData?.specs || '-'}
                                            </td>
                                            
                                            {/* Tolerance (-) for this size */}
                                            <td className={`px-2 py-3 text-center text-sm font-medium text-red-800 dark:text-red-200 border-r border-gray-300 dark:border-gray-600 ${bgColorClass}`}>
                                              {pointData?.toleranceMinus || '-'}
                                            </td>
                                            
                                            {/* Tolerance (+) for this size */}
                                            <td className={`px-2 py-3 text-center text-sm font-medium text-green-800 dark:text-green-200 border-r border-gray-300 dark:border-gray-600 ${bgColorClass}`}>
                                              {pointData?.tolerancePlus ? `+${pointData.tolerancePlus}` : '-'}
                                            </td>
                                            
                                            {/* Measurement values for each piece in this size */}
                                            {sizeData.sortedPcs.map(pc => {
                                              const measurement = pointData?.measurements?.[pc.pcNumber];
                                              const isPass = measurement?.result === 'pass';
                                              const hasData = !!measurement;
                                              
                                              return (
                                                <td key={`${size}-${pc.pcNumber}`} className={`px-2 py-3 text-center text-sm font-bold border-r border-gray-300 dark:border-gray-600 ${
                                                  hasData ? (
                                                    isPass 
                                                      ? `text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/20` 
                                                      : `text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/20`
                                                  ) : `text-gray-400 dark:text-gray-500 ${bgColorClass}`
                                                }`}>
                                                  <div className="flex flex-col items-center space-y-1">
                                                    <span className="text-xs font-bold">
                                                      {measurement?.value || '-'}
                                                    </span>
                                                    {hasData && (
                                                      <div className="flex items-center justify-center">
                                                        {isPass ? (
                                                          <CheckCircle className="w-3 h-3 text-green-500" />
                                                        ) : (
                                                          <XCircle className="w-3 h-3 text-red-500" />
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                </td>
                                              );
                                            })}
                                          </React.Fragment>
                                        );
                                      })}
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>

                        {/* Summary Statistics for All Sizes */}
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                          {(() => {
                            let totalMeasurements = 0;
                            let totalPass = 0;
                            let totalFail = 0;
                            const sizeCount = new Set();
                            processedReportData.measurementDetails.measurement
                              .filter(sizeData => !selectedKValue || sizeData.kvalue === selectedKValue)
                              .forEach((sizeData) => {
                                sizeCount.add(sizeData.size);
                                sizeData.pcs.forEach((pc) => {
                                  pc.measurementPoints.forEach((point) => {
                                    totalMeasurements++;
                                    if (point.result === 'pass') {
                                      totalPass++;
                                    } else {
                                      totalFail++;
                                    }
                                  });
                                });
                              });

                            const passRate = totalMeasurements > 0 ? ((totalPass / totalMeasurements) * 100).toFixed(1) : 0;

                            return (
                              <>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Ruler className="w-4 h-4 text-blue-500" />
                                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Sizes</span>
                                    </div>
                                    <span className="text-lg font-bold text-blue-800 dark:text-blue-200">{sizeCount.size}</span>
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Target className="w-4 h-4 text-indigo-500" />
                                      <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Total Measurements</span>
                                    </div>
                                    <span className="text-lg font-bold text-indigo-800 dark:text-indigo-200">{totalMeasurements}</span>
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-100 dark:border-green-800">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">Pass / Fail</span>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-bold text-green-600 dark:text-green-400">{totalPass}</div>
                                      <div className="text-sm font-bold text-red-600 dark:text-red-400">{totalFail}</div>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-100 dark:border-amber-800">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <TrendingUp className="w-4 h-4 text-amber-500" />
                                      <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">Pass Rate</span>
                                    </div>
                                    <span className="text-lg font-bold text-amber-800 dark:text-amber-200">{passRate}%</span>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    )}

                    {/* NEW: Conditional rendering for Size-by-Size */}
                    {activeView === 'size-by-size' && (

                    <div className="space-y-8">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-teal-500 p-2 rounded-lg">
                          <Ruler className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-teal-800 dark:text-teal-200">
                          Size-by-Size Detailed View
                        </h4>
                      </div>
                      
                      {processedReportData.measurementDetails.measurement
                        .filter(sizeData => !selectedKValue || sizeData.kvalue === selectedKValue)
                        .map((sizeData, sizeIndex) => (
                        <div key={sizeIndex} className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800">
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="bg-teal-500 p-2 rounded-lg">
                              <Ruler className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-teal-800 dark:text-teal-200">
                              Size: {sizeData.size}
                            </h4>
                            <div className="bg-blue-200 dark:bg-blue-700 px-3 py-1 rounded-full">
                              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                                K-Value: {sizeData.kvalue}
                              </span>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                                    Measurement Point
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                                    Spec
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                                    Tol (-)
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                                    Tol (+)
                                  </th>
                                  {sizeData.pcs.map((pc, pcIndex) => (
                                    <th key={pcIndex} className="px-3 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                                      {pc.pcNumber}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {/* Get all unique measurement points */}
                                {(() => {
                                  // Get all measurement points from the first piece (they should be the same across all pieces)
                                  const measurementPoints = sizeData.pcs[0]?.measurementPoints || [];
                                  
                                  return measurementPoints.map((point, pointIndex) => (
                                    <tr key={pointIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                      <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                                        {point.pointName}
                                      </td>
                                      <td className="px-4 py-3 text-center text-sm font-medium text-blue-800 dark:text-blue-200 border-r border-gray-200 dark:border-gray-600">
                                        {point.specs}
                                      </td>
                                    <td className="px-4 py-3 text-center text-sm font-medium text-red-800 dark:text-red-200 border-r border-gray-200 dark:border-gray-600">
                                      {getToleranceAsFraction(point, 'minus')}
                                      </td>
                                    <td className="px-4 py-3 text-center text-sm font-medium text-green-800 dark:text-green-200 border-r border-gray-200 dark:border-gray-600">
                                      +{getToleranceAsFraction(point, 'plus')}
                                      </td>
                                      {sizeData.pcs.map((pc, pcIndex) => {
                                        // Find the corresponding measurement point for this piece
                                        const pcMeasurement = pc.measurementPoints.find(mp => mp.rowNo === point.rowNo);
                                        
                                        const isPass = pcMeasurement?.result === 'pass';
                                        const measuredValue = pcMeasurement?.measured_value_fraction || 'N/A';
                                        
                                        return (
                                          <td key={pcIndex} className={`px-3 py-3 text-center text-sm font-medium border-r border-gray-200 dark:border-gray-600 ${
                                            pcMeasurement ? (
                                              isPass 
                                                ? 'text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-900/20' 
                                                : 'text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/20'
                                            ) : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700'
                                          }`}>
                                            <div className="flex flex-col items-center space-y-1">
                                              <span className="font-bold">
                                                {measuredValue}
                                              </span>
                                              {pcMeasurement && (
                                                isPass ? (
                                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                                ) : (
                                                  <XCircle className="w-3 h-3 text-red-500" />
                                                )
                                              )}
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                )}

             {/* Before vs After Wash Comparison */}
              {(() => {
                  const shouldShowComparison = (
                    (reportData.before_after_wash === 'After Wash' || reportData.before_after_wash === 'Before Wash') && 
                    (processedReportData.reportType === 'Inline' || processedReportData.reportType === 'First Output') &&
                    processedReportData.measurementDetails?.measurement && 
                    processedReportData.measurementDetails.measurement.length > 0
                  );
                
                  return shouldShowComparison;
                  })() && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
                          <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg mr-3">
                            <ArrowLeftRight className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          Before vs After Wash Comparison
                        </h3>
                        <div className="flex items-center space-x-2">
                          <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                            Before Wash
                          </div>
                          <div className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                            After Wash
                          </div>
                          <div className="bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full">
                            <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Size-wise Comparison</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-8">
                      {(() => {
                        let beforeData, afterData;
        
                          if (reportData.before_after_wash === 'Before Wash') {
                            beforeData = processedReportData;
                            afterData = comparisonData;
                          } else if (reportData.before_after_wash === 'After Wash') {
                            beforeData = comparisonData;
                            afterData = processedReportData;
                          } else {
                            // Fallback - shouldn't happen with current conditions
                            beforeData = reportData;
                            afterData = comparisonData;
                          }
                        // Get all unique sizes from all available datasets
                          const allSizes = new Set();
                          
                          // Always include sizes from current report data first
                          processedReportData.measurementDetails?.measurement?.forEach(sizeData => allSizes.add(sizeData.size));
                          
                          // Add sizes from comparison data if available
                          if (comparisonData?.measurementDetails?.measurement) {
                            comparisonData.measurementDetails.measurement.forEach(sizeData => allSizes.add(sizeData.size));
                          }
                          
                          // Add sizes from before data if available
                          beforeData?.measurementDetails?.measurement?.forEach(sizeData => allSizes.add(sizeData.size));
                          
                          // Add sizes from after data if available
                          afterData?.measurementDetails?.measurement?.forEach(sizeData => allSizes.add(sizeData.size));

                          return Array.from(allSizes).map(size => {
                            // Find size data for both before and after from all available sources
                            let beforeSizeData = null;
                            let afterSizeData = null;
                            
                            // Determine which data source has which wash type for this size
                            const currentSizeData = processedReportData.measurementDetails?.measurement?.find(s => s.size === size);
                            const comparisonSizeData = comparisonData?.measurementDetails?.measurement?.find(s => s.size === size);
                            
                            if (reportData.before_after_wash === 'Before Wash') {
                              beforeSizeData = currentSizeData;
                              afterSizeData = comparisonSizeData;
                            } else if (reportData.before_after_wash === 'After Wash') {
                              beforeSizeData = comparisonSizeData;
                              afterSizeData = currentSizeData;
                            }
                            
                            // Fallback to beforeData/afterData if not found above
                            if (!beforeSizeData) {
                              beforeSizeData = beforeData?.measurementDetails?.measurement?.find(s => s.size === size);
                            }
                            if (!afterSizeData) {
                              afterSizeData = afterData?.measurementDetails?.measurement?.find(s => s.size === size);
                            }
                                            
                          return (
                            <div key={size} className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                              <div className="flex items-center space-x-3 mb-6">
                                <div className="bg-orange-500 p-2 rounded-lg">
                                  <Ruler className="w-5 h-5 text-white" />
                                </div>
                                <h4 className="text-lg font-bold text-orange-800 dark:text-orange-200">
                                  Size: {size}
                                </h4>
                                <div className="bg-orange-200 dark:bg-orange-700 px-3 py-1 rounded-full">
                                  <span className="text-xs font-medium text-orange-800 dark:text-orange-200">
                                    Before vs After Comparison
                                  </span>
                                </div>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                  <thead className="bg-gray-50 dark:bg-gray-700">
                                    {(() => {
                                      // Get all unique measurement values for this size from all available data
                                      const allValues = new Set();
                                      
                                      // Add values from current report data
                                      const currentSizeData = processedReportData.measurementDetails?.measurement?.find(s => s.size === size);
                                      currentSizeData?.pcs?.forEach(pc => {
                                        pc.measurementPoints?.forEach(mp => {
                                          if (mp.measured_value_fraction) {
                                            allValues.add(mp.measured_value_fraction);
                                          }
                                        });
                                      });
                                      
                                      // Add values from comparison data
                                      const comparisonSizeData = comparisonData?.measurementDetails?.measurement?.find(s => s.size === size);
                                      comparisonSizeData?.pcs?.forEach(pc => {
                                        pc.measurementPoints?.forEach(mp => {
                                          if (mp.measured_value_fraction) {
                                            allValues.add(mp.measured_value_fraction);
                                          }
                                        });
                                      });
                                      
                                      // Also add from before/after data
                                      [beforeSizeData, afterSizeData].forEach(sizeData => {
                                        sizeData?.pcs?.forEach(pc => {
                                          pc.measurementPoints?.forEach(mp => {
                                            if (mp.measured_value_fraction) {
                                              allValues.add(mp.measured_value_fraction);
                                            }
                                          });
                                        });
                                      });
                                      
                                      const sortedValues = Array.from(allValues).sort();
                                      
                                      return (
                                        <>
                                          <tr>
                                            <th rowSpan="2" className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                                              Measurement Point
                                            </th>
                                            <th rowSpan="2" className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                                              Spec
                                            </th>
                                            <th rowSpan="2" className="px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                                              Tolerance (-)
                                            </th>
                                            <th rowSpan="2" className="px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                                              Tolerance (+)
                                            </th>
                                            <th colSpan={sortedValues.length} className="px-4 py-3 text-center text-xs font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                                              Before Wash - Measurement Values (Count)
                                            </th>
                                            <th colSpan={sortedValues.length} className="px-4 py-3 text-center text-xs font-bold text-green-600 dark:text-green-300 uppercase tracking-wider">
                                              After Wash - Measurement Values (Count)
                                            </th>
                                          </tr>
                                          <tr>
                                            {/* Before Wash Value Headers */}
                                            {sortedValues.map(value => (
                                              <th key={`before-${value}`} className="px-2 py-2 text-center text-xs font-bold text-blue-600 dark:text-blue-300 border-r border-gray-200 dark:border-gray-600">
                                                {value}
                                              </th>
                                            ))}
                                            {/* After Wash Value Headers */}
                                            {sortedValues.map(value => (
                                              <th key={`after-${value}`} className="px-2 py-2 text-center text-xs font-bold text-green-600 dark:text-green-300 border-r border-gray-200 dark:border-gray-600">
                                                {value}
                                              </th>
                                            ))}
                                          </tr>
                                        </>
                                      );
                                    })()}
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                    {(() => {
                                      // Get all unique measurement points for this size from all available data
                                      const measurementPoints = new Set();
                                      
                                      // Always include measurement points from current report data
                                      const currentSizeData = reportData.measurementDetails?.measurement?.find(s => s.size === size);
                                      currentSizeData?.pcs?.forEach(pc => {
                                        pc.measurementPoints?.forEach(mp => measurementPoints.add(mp.pointName));
                                      });
                                      
                                      // Add measurement points from comparison data
                                      const comparisonSizeData = comparisonData?.measurementDetails?.measurement?.find(s => s.size === size);
                                      comparisonSizeData?.pcs?.forEach(pc => {
                                        pc.measurementPoints?.forEach(mp => measurementPoints.add(mp.pointName));
                                      });
                                      
                                      // Add measurement points from before data
                                      beforeSizeData?.pcs?.forEach(pc => {
                                        pc.measurementPoints?.forEach(mp => measurementPoints.add(mp.pointName));
                                      });
                                      
                                      // Add measurement points from after data
                                      afterSizeData?.pcs?.forEach(pc => {
                                        pc.measurementPoints?.forEach(mp => measurementPoints.add(mp.pointName));
                                      });
                                      
                                      return Array.from(measurementPoints).map((pointName, pointIndex) => {
                                        // Get first measurement point for spec info from any available data
                                        let firstMeasurement = null;
                                        
                                        // Try current report data first
                                        if (currentSizeData?.pcs?.[0]?.measurementPoints) {
                                          firstMeasurement = currentSizeData.pcs[0].measurementPoints.find(mp => mp.pointName === pointName);
                                        }
                                        
                                        // Try comparison data
                                        if (!firstMeasurement && comparisonSizeData?.pcs?.[0]?.measurementPoints) {
                                          firstMeasurement = comparisonSizeData.pcs[0].measurementPoints.find(mp => mp.pointName === pointName);
                                        }
                                        
                                        // Try before data
                                        if (!firstMeasurement && beforeSizeData?.pcs?.[0]?.measurementPoints) {
                                          firstMeasurement = beforeSizeData.pcs[0].measurementPoints.find(mp => mp.pointName === pointName);
                                        }
                                        
                                        // Try after data
                                        if (!firstMeasurement && afterSizeData?.pcs?.[0]?.measurementPoints) {
                                          firstMeasurement = afterSizeData.pcs[0].measurementPoints.find(mp => mp.pointName === pointName);
                                        }
                                        
                                        if (!firstMeasurement) return null;
                                        
                                        return (
                                          <tr key={pointIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                                              {pointName}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm font-medium text-blue-800 dark:text-blue-200 border-r border-gray-200 dark:border-gray-600">
                                              {firstMeasurement.specs}
                                            </td>
                                            <td className="px-2 py-3 text-center text-sm font-medium text-red-800 dark:text-red-200 border-r border-gray-200 dark:border-gray-600">
                                              {getToleranceAsFraction(firstMeasurement, 'minus')}
                                            </td>
                                            <td className="px-2 py-3 text-center text-sm font-medium text-green-800 dark:text-green-200 border-r border-gray-200 dark:border-gray-600">
                                              +{getToleranceAsFraction(firstMeasurement, 'plus')}
                                            </td>
                                            {(() => {
                                              // Get all unique measurement values for this size from all available datasets
                                              const allValues = new Set();
                                              
                                              // Add values from current report data
                                              if (currentSizeData) {
                                                currentSizeData.pcs?.forEach(pc => {
                                                  pc.measurementPoints?.forEach(mp => {
                                                    if (mp.measured_value_fraction) {
                                                      allValues.add(mp.measured_value_fraction);
                                                    }
                                                  });
                                                });
                                              }                                              
                                              
                                              // Add values from comparison data
                                              if (comparisonSizeData) {
                                                comparisonSizeData.pcs?.forEach(pc => {
                                                  pc.measurementPoints?.forEach(mp => {
                                                    if (mp.measured_value_fraction) {
                                                      allValues.add(mp.measured_value_fraction);
                                                    }
                                                  });
                                                });
                                              }                                              
                                              
                                              // Add values from before wash data
                                              if (beforeSizeData) {
                                                beforeSizeData.pcs?.forEach(pc => {
                                                  pc.measurementPoints?.forEach(mp => {
                                                    if (mp.measured_value_fraction) {
                                                      allValues.add(mp.measured_value_fraction);
                                                    }
                                                  });
                                                });
                                              }                                              
                                              
                                              // Add values from after wash data
                                              if (afterSizeData) {
                                                afterSizeData.pcs?.forEach(pc => {
                                                  pc.measurementPoints?.forEach(mp => {
                                                    if (mp.measured_value_fraction) {
                                                      allValues.add(mp.measured_value_fraction);
                                                    }
                                                  });
                                                });
                                              }                                              
                                              
                                              // If no values found, add some common measurement values as fallback
                                              if (allValues.size === 0) {
                                                // Add common fractional values that might be used
                                                ['-1/16', '-1/4', '-7/16', '0', '+1/16', '+1/4', '+7/16'].forEach(val => allValues.add(val));
                                              }
                                              
                                              const sortedValues = Array.from(allValues).sort();                                              
                                              
                                              // Count values for before wash
                                              const beforeValueCount = {};
                                              if (beforeSizeData) {
                                                beforeSizeData.pcs?.forEach(pc => {
                                                  const measurement = pc.measurementPoints?.find(mp => mp.pointName === pointName);
                                                  if (measurement && measurement.measured_value_fraction) {
                                                    const value = measurement.measured_value_fraction;
                                                    beforeValueCount[value] = (beforeValueCount[value] || 0) + 1;
                                                  }
                                                });
                                              }
                                              
                                              // Count values for after wash
                                              const afterValueCount = {};
                                              if (afterSizeData) {
                                                afterSizeData.pcs?.forEach(pc => {
                                                  const measurement = pc.measurementPoints?.find(mp => mp.pointName === pointName);
                                                  if (measurement && measurement.measured_value_fraction) {
                                                    const value = measurement.measured_value_fraction;
                                                    afterValueCount[value] = (afterValueCount[value] || 0) + 1;
                                                  }
                                                });
                                              }
                                              
                                              return (
                                                <>
                                                  {/* Before Wash Value Counts */}
                                                  {sortedValues.map(value => {
                                                    const count = beforeValueCount[value] || 0;
                                                    const passCount = (() => {
                                                      let pass = 0;
                                                      beforeSizeData?.pcs?.forEach(pc => {
                                                        const measurement = pc.measurementPoints?.find(mp => mp.pointName === pointName);
                                                        if (measurement && measurement.measured_value_fraction === value && measurement.result === 'pass') {
                                                          pass++;
                                                        }
                                                      });
                                                      return pass;
                                                    })();
                                                    const failCount = count - passCount;
                                                    
                                                    return (
                                                      <td key={`before-${value}`} className="px-2 py-3 text-center text-sm font-medium border-r border-gray-200 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">
                                                        {count === 0 ? (
                                                          <span className="font-bold text-gray-400">-</span>
                                                        ) : (
                                                          <div className="flex flex-col items-center">
                                                            {passCount > 0 && (
                                                              <span className="font-bold text-green-600 dark:text-green-400">{passCount}</span>
                                                            )}
                                                            {failCount > 0 && (
                                                              <span className="font-bold text-red-600 dark:text-red-400">{failCount}</span>
                                                            )}
                                                          </div>
                                                        )}
                                                      </td>
                                                    );
                                                  })}
                                                  {/* After Wash Value Counts */}
                                                  {sortedValues.map(value => {
                                                    const count = afterValueCount[value] || 0;
                                                    const passCount = (() => {
                                                      let pass = 0;
                                                      afterSizeData?.pcs?.forEach(pc => {
                                                        const measurement = pc.measurementPoints?.find(mp => mp.pointName === pointName);
                                                        if (measurement && measurement.measured_value_fraction === value && measurement.result === 'pass') {
                                                          pass++;
                                                        }
                                                      });
                                                      return pass;
                                                    })();
                                                    const failCount = count - passCount;
                                                    
                                                    return (
                                                      <td key={`after-${value}`} className="px-2 py-3 text-center text-sm font-medium border-r border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900/20">
                                                        {count === 0 ? (
                                                          <span className="font-bold text-gray-400">-</span>
                                                        ) : (
                                                          <div className="flex flex-col items-center">
                                                            {passCount > 0 && (
                                                              <span className="font-bold text-green-600 dark:text-green-400">{passCount}</span>
                                                            )}
                                                            {failCount > 0 && (
                                                              <span className="font-bold text-red-600 dark:text-red-400">{failCount}</span>
                                                            )}
                                                          </div>
                                                        )}
                                                      </td>
                                                    );
                                                  })}
                                                </>
                                              );
                                            })()}
                                          </tr>
                                        );
                                      });
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                              
                              {/* Size Summary */}
                              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Before Wash (Size {size})</div>
                                  <div className="text-sm font-bold">
                                    {beforeSizeData ? (() => {
                                      let withinTolerance = 0, outOfTolerance = 0;
                                      beforeSizeData.pcs?.forEach(pc => {
                                        pc.measurementPoints?.forEach(mp => {
                                          if (mp.result === 'pass') {
                                            withinTolerance++;
                                          } else {
                                            outOfTolerance++;
                                          }
                                        });
                                      });
                                      return (
                                        <div className="flex justify-between">
                                          <span className="text-green-600 dark:text-green-400">Within: {withinTolerance}</span>
                                          <span className="text-red-600 dark:text-red-400">Out of: {outOfTolerance}</span>
                                        </div>
                                      );
                                    })() : (
                                      <span className="text-gray-500 dark:text-gray-400">No data</span>
                                    )}
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-100 dark:border-green-800">
                                  <div className="text-xs text-green-600 dark:text-green-400 mb-1">After Wash (Size {size})</div>
                                  <div className="text-sm font-bold">
                                    {afterSizeData ? (() => {
                                      let withinTolerance = 0, outOfTolerance = 0;
                                      afterSizeData.pcs?.forEach(pc => {
                                        pc.measurementPoints?.forEach(mp => {
                                          if (mp.result === 'pass') {
                                            withinTolerance++;
                                          } else {
                                            outOfTolerance++;
                                          }
                                        });
                                      });
                                      return (
                                        <div className="flex justify-between">
                                          <span className="text-green-600 dark:text-green-400">Within: {withinTolerance}</span>
                                          <span className="text-red-600 dark:text-red-400">Out of: {outOfTolerance}</span>
                                        </div>
                                      );
                                    })() : (
                                      <span className="text-gray-500 dark:text-gray-400">No data</span>
                                    )}
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-orange-100 dark:border-orange-800">
                                  <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">Pieces Count</div>
                                  <div className="text-sm font-bold text-orange-800 dark:text-orange-200">
                                    Before: {beforeSizeData?.pcs?.length || 0} | After: {afterSizeData?.pcs?.length || 0}
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
                                  <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Quality Change</div>
                                  <div className="text-sm font-bold">
                                    {beforeSizeData && afterSizeData ? (() => {
                                      // Your existing quality change calculation
                                      const beforeWithin = (() => {
                                        let within = 0;
                                        beforeSizeData.pcs?.forEach(pc => {
                                          pc.measurementPoints?.forEach(mp => {
                                            if (mp.result === 'pass') within++;
                                          });
                                        });
                                        return within;
                                      })();
                                      
                                      const beforeOutOf = (() => {
                                        let outOf = 0;
                                        beforeSizeData.pcs?.forEach(pc => {
                                          pc.measurementPoints?.forEach(mp => {
                                            if (mp.result === 'fail') outOf++;
                                          });
                                        });
                                        return outOf;
                                      })();
                                      
                                      const afterWithin = (() => {
                                        let within = 0;
                                        afterSizeData.pcs?.forEach(pc => {
                                          pc.measurementPoints?.forEach(mp => {
                                            if (mp.result === 'pass') within++;
                                          });
                                        });
                                        return within;
                                      })();
                                      
                                      const afterOutOf = (() => {
                                        let outOf = 0;
                                        afterSizeData.pcs?.forEach(pc => {
                                          pc.measurementPoints?.forEach(mp => {
                                            if (mp.result === 'fail') outOf++;
                                          });
                                        });
                                        return outOf;
                                      })();
                                      
                                      const withinChange = afterWithin - beforeWithin;
                                      const outOfChange = afterOutOf - beforeOutOf;
                                      
                                      return (
                                        <div className="flex justify-between">
                                          <span className={withinChange > 0 ? 'text-green-600 dark:text-green-400' : withinChange < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}>
                                            Within: {withinChange > 0 ? '+' : ''}{withinChange}
                                          </span>
                                          <span className={outOfChange < 0 ? 'text-green-600 dark:text-green-400' : outOfChange > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}>
                                            Out of: {outOfChange > 0 ? '+' : ''}{outOfChange}
                                          </span>
                                        </div>
                                      );
                                    })() : (
                                      <span className="text-gray-500 dark:text-gray-400">Insufficient data</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    {isLoadingComparison && (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                          <span className="text-sm">Loading comparison data...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QCWashingFullReportModal;
