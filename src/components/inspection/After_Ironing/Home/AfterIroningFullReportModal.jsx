import React, { useEffect, useState } from "react";
import { X, FileText, Palette, Building, User, Hash, Droplets, ClipboardCheck, Package, Target, CheckCircle, XCircle, TrendingUp, BarChart3, AlertTriangle, Ruler, Thermometer, Clock, Zap, Beaker, ShoppingCart, Factory, Eye, Camera, MessageSquare, Award, Activity, ArrowLeftRight } from "lucide-react";
import axios from "axios";

import { API_BASE_URL } from "../../../../../config";
import { getToleranceAsFraction, decimalToFraction } from "../Home/fractionConverter";

// Measurement Comparison Table Component
const MeasurementComparisonTable = ({ beforeWashData, afterWashData, afterIroningData, selectedKValue, viewMode, selectedSize }) => {
  // Get all unique measurement points and organize by size and pieces
  const getAllMeasurementData = () => {
    const pointsMap = new Map(); // pointName -> { tolerances, sizeSpecs, sizeData }
    const allSizes = new Set();
    const allPieces = new Set();
    
    // Helper function to extract points from measurement data
    const extractPoints = (data, stage) => {
      if (!data || !Array.isArray(data)) return;
      
      data.forEach(measurement => {
        if (!selectedKValue || measurement.kvalue === selectedKValue) {
          if (!selectedSize || measurement.size === selectedSize) {
            const size = measurement.size;
            allSizes.add(size);
            
            measurement.pcs?.forEach((pc, pcIndex) => {
              const pcNumber = pc.pcNumber || (pcIndex + 1);
              allPieces.add(pcNumber);
              
              pc.measurementPoints?.forEach(point => {
                const pointName = point.pointName;
                
                if (!pointsMap.has(pointName)) {
                  pointsMap.set(pointName, {
                    pointName,
                    toleranceMinus: point.toleranceMinus,
                    tolerancePlus: point.tolerancePlus,
                    sizeSpecs: new Map(), // size -> spec value
                    sizeData: new Map() // size -> { pieces: Map(pcNumber -> { afterWash, afterIroning }) }
                  });
                }
                
                const pointData = pointsMap.get(pointName);
                
                // Store size-specific spec
                pointData.sizeSpecs.set(size, point.specs);
                
                if (!pointData.sizeData.has(size)) {
                  pointData.sizeData.set(size, { pieces: new Map() });
                }
                
                const sizePointData = pointData.sizeData.get(size);
                if (!sizePointData.pieces.has(pcNumber)) {
                  sizePointData.pieces.set(pcNumber, {
                    afterWash: null,
                    afterIroning: null
                  });
                }
                
                const measuredValue = point.measured_value_decimal || 0;
                const specs = parseFloat(point.specs) || 0;
                const tolMinus = point.toleranceMinus || 0;
                const tolPlus = point.tolerancePlus || 0;
                
                const minAllowed = specs + tolMinus;
                const maxAllowed = specs + tolPlus;
                const isWithinTolerance = measuredValue >= minAllowed && measuredValue <= maxAllowed;
                
                sizePointData.pieces.get(pcNumber)[stage] = {
                  value: measuredValue,
                  fraction: point.measured_value_fraction || '0',
                  result: point.result,
                  isWithinTolerance
                };
              });
            });
          }
        }
      });
    };
    
    if (afterWashData?.length > 0) extractPoints(afterWashData, 'afterWash');
    if (afterIroningData?.length > 0) extractPoints(afterIroningData, 'afterIroning');
    
    return { 
      pointsMap, 
      allSizes: Array.from(allSizes), 
      allPieces: Array.from(allPieces).sort((a, b) => a - b) 
    };
  };
  
  const { pointsMap, allSizes, allPieces } = getAllMeasurementData();
  
  if (pointsMap.size === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No measurement data available for comparison
      </div>
    );
  }
  
  // Render measurement value for a specific piece
  const renderPieceMeasurement = (measurement) => {
    if (!measurement) {
      return <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>;
    }
    
    const displayValue = measurement.fraction !== '0' ? measurement.fraction : measurement.value;
    const isPass = measurement.result === 'pass';
    
    return (
      <div className="bg-gray-50 dark:bg-gray-700 px-1 py-1 rounded text-center">
        {isPass ? (
          <div className="bg-green-100 dark:bg-green-900/30 px-1 py-1 rounded">
            <span className="font-bold text-green-700 dark:text-green-300 text-xs font-mono">{displayValue}</span>
          </div>
        ) : (
          <div className="bg-red-100 dark:bg-red-900/30 px-1 py-1 rounded">
            <span className="font-bold text-red-700 dark:text-red-300 text-xs font-mono">{displayValue}</span>
          </div>
        )}
      </div>
    );
  };
  
  // Calculate active stages and columns dynamically
  const hasAfterWash = afterWashData?.length > 0;
  const hasAfterIroning = afterIroningData?.length > 0;
  const activeStages = [];
  if (hasAfterWash) activeStages.push('afterWash');
  if (hasAfterIroning) activeStages.push('afterIroning');
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <thead>
          {/* First header row - Tolerances and Size groups */}
          <tr className="bg-gray-50 dark:bg-gray-700">
            <th rowSpan="3" className="px-3 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase border-r align-middle">
              Measurement Point
            </th>
            <th rowSpan="3" className="px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase border-r align-middle">
              Tol (+)
            </th>
            <th rowSpan="3" className="px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase border-r align-middle">
              Tol (-)
            </th>
            {allSizes.map(size => {
              const columnsPerSize = 1 + (allPieces.length * activeStages.length); // Spec + (pieces * active stages)
              return (
                <th key={size} colSpan={columnsPerSize} className="px-2 py-2 text-center text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase border-r">
                  Size: {size}
                </th>
              );
            })}
          </tr>
          
          {/* Second header row - Spec and Stage groups */}
          <tr className="bg-gray-100 dark:bg-gray-600">
            {allSizes.map(size => (
              <React.Fragment key={size}>
                <th rowSpan="2" className="px-1 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r align-middle">
                  Spec
                </th>
                {hasAfterWash && (
                  <th colSpan={allPieces.length} className="px-1 py-1 text-center text-xs font-bold text-green-600 dark:text-green-300 border-r">
                    After Wash
                  </th>
                )}
                {hasAfterIroning && (
                  <th colSpan={allPieces.length} className="px-1 py-1 text-center text-xs font-bold text-purple-600 dark:text-purple-300 border-r">
                    After Ironing
                  </th>
                )}
              </React.Fragment>
            ))}
          </tr>
          
          {/* Third header row - Piece numbers */}
          <tr className="bg-gray-200 dark:bg-gray-500">
            {allSizes.map(size => (
              <React.Fragment key={size}>
                {hasAfterWash && allPieces.map(pc => (
                  <th key={`aw-${pc}`} className="px-1 py-1 text-center text-xs font-medium text-green-700 dark:text-green-200 border-r">
                    PC{pc}
                  </th>
                ))}
                {hasAfterIroning && allPieces.map(pc => (
                  <th key={`ai-${pc}`} className="px-1 py-1 text-center text-xs font-medium text-purple-700 dark:text-purple-200 border-r">
                    PC{pc}
                  </th>
                ))}
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
          {Array.from(pointsMap.values()).map((point, index) => (
            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-3 py-3 text-sm font-medium text-gray-900 dark:text-gray-200 border-r">
                {point.pointName}
              </td>
              {/* Tolerance + (shown once) */}
              <td className="px-2 py-2 text-xs text-center text-gray-700 dark:text-gray-300 border-r">
                {decimalToFraction(point.tolerancePlus)}
              </td>
              {/* Tolerance - (shown once) */}
              <td className="px-2 py-2 text-xs text-center text-gray-700 dark:text-gray-300 border-r">
                {decimalToFraction(point.toleranceMinus)}
              </td>
              {allSizes.map(size => {
                const sizeData = point.sizeData.get(size);
                const sizeSpec = point.sizeSpecs.get(size);
                return (
                  <React.Fragment key={size}>
                    {/* Size-specific Spec */}
                    <td className="px-1 py-2 text-xs text-center text-gray-700 dark:text-gray-300 border-r">
                      {sizeSpec || '-'}
                    </td>
                    {/* After Wash pieces */}
                    {hasAfterWash && allPieces.map(pc => (
                      <td key={`aw-${pc}`} className="px-1 py-2 text-center border-r">
                        {renderPieceMeasurement(sizeData?.pieces.get(pc)?.afterWash)}
                      </td>
                    ))}
                    {/* After Ironing pieces */}
                    {hasAfterIroning && allPieces.map(pc => (
                      <td key={`ai-${pc}`} className="px-1 py-2 text-center border-r">
                        {renderPieceMeasurement(sizeData?.pieces.get(pc)?.afterIroning)}
                      </td>
                    ))}
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AfterIroningFullReportModal = ({ isOpen, onClose, recordData, checkpointDefinitions }) => {
  const [reportData, setReportData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [selectedKValue, setSelectedKValue] = useState(null);
  const [inspectorDetails, setInspectorDetails] = useState(null);
  const [availableKValues, setAvailableKValues] = useState([]);
  const [showAllPcs, setShowAllPcs] = useState(false);
  const [processedReportData, setProcessedReportData] = useState(null);
  const [activeView, setActiveView] = useState('full');
  const [showComparison, setShowComparison] = useState({
    beforeWash: true,
    afterWash: true,
    afterIroning: true
  });

  const [selectedComparisonSize, setSelectedComparisonSize] = useState('all');
  const [availableSizes, setAvailableSizes] = useState([]);

  // Helper function to convert file paths to accessible URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('./public')) {
      const cleanPath = imagePath.replace('./public', '');
      return `${API_BASE_URL}${cleanPath}`;
    }
    
    return `${API_BASE_URL}${imagePath}`;
  };

  // Fetch comparison data for measurement comparison
  const fetchComparisonData = async (orderNo, date, reportType, factoryName) => {
    setIsLoadingComparison(true);
    
    try {
      // Use the new endpoint to fetch QC Washing measurement data
      const response = await axios.get(`${API_BASE_URL}/api/after-ironing/qc-washing-measurement`, {
        params: {
          orderNo,
          date,
          reportType,
          factoryName
        }
      });
      
      if (response.data.success) {
        setComparisonData(response.data.data);
      } else {
        setComparisonData(null);
      }
      
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      setComparisonData(null);
    } finally {
      setIsLoadingComparison(false);
    }
  };

  useEffect(() => {
    if (isOpen && recordData) {
      setReportData(null);
      
      const transformedData = {
        ...recordData,
        formData: {
          result: recordData.overallFinalResult,
          remarks: recordData.defectDetails?.comment || "",
          measurements: recordData.measurementDetails?.measurement || []
        }
      };
      setReportData(transformedData);
      
      // Extract available K-values and sizes
      if (recordData.measurementDetails?.measurement) {
        const kValues = recordData.measurementDetails.measurement.map(size => size.kvalue).filter(Boolean);
        const uniqueKValues = [...new Set(kValues)];
        setAvailableKValues(uniqueKValues);
        setSelectedKValue(uniqueKValues[0] || null);
        
        const sizes = recordData.measurementDetails.measurement.map(size => size.size).filter(Boolean);
        const uniqueSizes = [...new Set(sizes)];
        setAvailableSizes(uniqueSizes);
      }
      
      // Fetch comparison data for measurement comparison
      if (recordData.measurementDetails?.measurement?.length > 0) {
        fetchComparisonData(
          recordData.orderNo,
          recordData.date,
          recordData.reportType,
          recordData.factoryName
        );
      } else {
        setComparisonData(null);
      }

      // Fetch inspector details
      if (recordData?.userId) {
        fetch(`${API_BASE_URL}/api/users/${recordData.userId}`)
          .then(res => {
            if (!res.ok) throw new Error('Inspector not found');
            return res.json();
          })
          .then(data => {
            if (!data.error) setInspectorDetails(data);
            else setInspectorDetails(null);
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
        newPc.isDuplicated = true;
        if (!sizeData.pcs) sizeData.pcs = [];
        sizeData.pcs.push(newPc);
      }
    }
    
    setProcessedReportData(duplicateData);
  }, [reportData, showAllPcs]);

  if (!isOpen) return null;

  const handleViewChange = (view) => {
    setActiveView(currentView => {
      if (currentView === view) {
        return 'none';
      }
      return view;
    });
  };

  const handleComparisonToggle = (type) => {
    setShowComparison(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-8xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">After Ironing Full Report</h2>
                <p className="text-purple-100 text-sm">Comprehensive Quality Control Analysis</p>
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
                    <p className="text-xs text-purple-200">{inspectorDetails.emp_id}</p>
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
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg mr-3">
                      <ShoppingCart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Order Information
                  </h3>
                  <div className="bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full">
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Order Details</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center">
                      <div className="bg-purple-500 p-2 rounded-lg">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-purple-600 dark:text-purple-300 uppercase tracking-wide">Order No</p>
                        <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{processedReportData.orderNo}</p>
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
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl p-4 border border-pink-200 dark:border-pink-800">
                    <div className="flex items-center">
                      <div className="bg-pink-500 p-2 rounded-lg">
                        <Palette className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-pink-600 dark:text-pink-300 uppercase tracking-wide">Color</p>
                        <p className="text-lg font-bold text-pink-900 dark:text-pink-100">{processedReportData.color}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center">
                      <div className="bg-orange-500 p-2 rounded-lg">
                        <Thermometer className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-orange-600 dark:text-orange-300 uppercase tracking-wide">Ironing Type</p>
                        <p className="text-lg font-bold text-orange-900 dark:text-orange-100">{processedReportData.ironingType || processedReportData.washType || 'N/A'}</p>
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
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800">
                    <div className="flex items-center">
                      <div className="bg-cyan-500 p-2 rounded-lg">
                        <Factory className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-cyan-600 dark:text-cyan-300 uppercase tracking-wide">Factory</p>
                        <p className="text-lg font-bold text-cyan-900 dark:text-cyan-100">{processedReportData.factoryName || 'N/A'}</p>
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
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <Hash className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-300 uppercase tracking-wide">Color Qty</p>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{processedReportData.colorOrderQty}</p>
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
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-300 uppercase tracking-wide mb-1">Pass Rate</p>
                        <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{processedReportData.passRate}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="bg-orange-500 p-3 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-orange-600 dark:text-orange-300 uppercase tracking-wide mb-1">Defect Count</p>
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{processedReportData.totalDefectCount || 0}</p>
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

              {/* Measurement Comparison Section */}
              {(comparisonData || processedReportData.measurementDetails?.measurement?.length > 0) && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
                      <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg mr-3">
                        <ArrowLeftRight className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      Measurement Comparison
                    </h3>
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Stage toggles */}
                      <div className="flex items-center space-x-2">
                        {comparisonData?.beforeWash?.length > 0 && (
                          <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={showComparison.beforeWash}
                              onChange={() => handleComparisonToggle('beforeWash')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Before Wash</span>
                          </label>
                        )}
                        {comparisonData?.afterWash?.length > 0 && (
                          <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={showComparison.afterWash}
                              onChange={() => handleComparisonToggle('afterWash')}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span>After Wash</span>
                          </label>
                        )}
                        <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={showComparison.afterIroning}
                            onChange={() => handleComparisonToggle('afterIroning')}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span>After Ironing</span>
                        </label>
                      </div>
                      

                      
                      {/* Size selector */}
                      {availableSizes.length > 1 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Size:</span>
                          <select
                            value={selectedComparisonSize}
                            onChange={(e) => setSelectedComparisonSize(e.target.value)}
                            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            <option value="all">All Sizes</option>
                            {availableSizes.map(size => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comparison Table */}
                  {(showComparison.beforeWash || showComparison.afterWash || showComparison.afterIroning) && (
                    <MeasurementComparisonTable
                      beforeWashData={showComparison.beforeWash ? comparisonData?.beforeWash : []}
                      afterWashData={showComparison.afterWash ? comparisonData?.afterWash : []}
                      afterIroningData={showComparison.afterIroning ? processedReportData.measurementDetails?.measurement : []}
                      selectedKValue={selectedKValue}
                      selectedSize={selectedComparisonSize === 'all' ? null : selectedComparisonSize}
                    />
                  )}
                </div>
              )}

              {/* Rest of the modal content would be similar to QCWashingFullReportModal */}
              {/* Including defect details, inspection details, etc. */}
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AfterIroningFullReportModal;