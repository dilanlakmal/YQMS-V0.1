import React, { useState, useEffect } from "react";
import { X, Package, Droplets, Target, CheckCircle, XCircle, TrendingUp, BarChart3, FileText, Palette, Building, User, Hash, AlertTriangle, ClipboardCheck, Calculator } from "lucide-react";
import { getToleranceAsFraction } from "./fractionConverter";
import { API_BASE_URL } from "../../../../../config";

const QCWashingViewDetailsModal = ({ isOpen, onClose, itemData, allRecords = [] }) => {
  const [washQuantityData, setWashQuantityData] = useState({
    alreadyWashedQty: 0,
    remainingQty: 0,
    totalRecords: 0,
    currentRecordPosition: 0
  });

  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showRecordsList, setShowRecordsList] = useState(false);
  const [inspectorDetails, setInspectorDetails] = useState(null);

  useEffect(() => {
    if (isOpen && itemData) {
      calculateWashQuantities();
      
      // Fetch inspector details
      if (itemData.userId) {
        fetch(`${API_BASE_URL}/api/users/${itemData.userId}`)
          .then(res => {
            if (!res.ok) {
              throw new Error('Inspector not found');
            }
            return res.json();
          })
          .then(data => {
            if (!data.error) {
              setInspectorDetails(data);
            } else {
              console.error("Inspector not found:", data.error);
              setInspectorDetails(null);
            }
          })
          .catch(err => {
            console.error("Error fetching inspector details:", err);
            setInspectorDetails(null);
          });
      }
    } else {
      setInspectorDetails(null);
    }
  }, [isOpen, itemData, allRecords]);

  const calculateWashQuantities = () => {
  if (!itemData) return;

  // If no allRecords, treat current record as the only record
  if (!allRecords || allRecords.length === 0) {
    const alreadyWashedQty = parseInt(itemData.displayWashQty ?? itemData.washQty) || 0;
    const remainingQty = Math.max(0, (parseInt(itemData.colorOrderQty) || 0) - alreadyWashedQty);
    
    setWashQuantityData({
      alreadyWashedQty,
      remainingQty,
      totalRecords: 1,
      currentRecordPosition: 1
    });
    return;
  }

  // Filter records with matching criteria
  const matchingRecords = allRecords.filter(record => {
    const matches = record.orderNo === itemData.orderNo &&
      record.before_after_wash === itemData.before_after_wash &&
      record.color === itemData.color &&
      record.washType === itemData.washType &&
      record.reportType === itemData.reportType;
      // record.factoryName === itemData.factoryName; 
    return matches;
  });


  // If no matching records found, treat current record as the only record
  if (matchingRecords.length === 0) {
    const alreadyWashedQty = parseInt(itemData.displayWashQty ?? itemData.washQty) || 0;
    const remainingQty = Math.max(0, (parseInt(itemData.colorOrderQty) || 0) - alreadyWashedQty);
    
    setWashQuantityData({
      alreadyWashedQty,
      remainingQty,
      totalRecords: 1,
      currentRecordPosition: 1
    });
    return;
  }

  // Sort by date or creation time to get chronological order
  const sortedRecords = matchingRecords.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date || a.submittedAt);
    const dateB = new Date(b.createdAt || b.date || b.submittedAt);
    return dateA - dateB;
  });

  // Find current record position - try multiple matching strategies
  let currentRecordIndex = -1;

  // Strategy 1: Direct ID match
  currentRecordIndex = sortedRecords.findIndex(record => {
    if (typeof record._id === 'string' && typeof itemData._id === 'string') {
      return record._id === itemData._id;
    }
    if (record._id?.$oid && itemData._id?.$oid) {
      return record._id.$oid === itemData._id.$oid;
    }
    if (record._id?.$oid && typeof itemData._id === 'string') {
      return record._id.$oid === itemData._id;
    }
    if (typeof record._id === 'string' && itemData._id?.$oid) {
      return record._id === itemData._id.$oid;
    }
    return false;
  });


  // Strategy 2: Match by washQty and approximate date if ID match fails
  if (currentRecordIndex === -1) {
    currentRecordIndex = sortedRecords.findIndex(record => {
      const washQtyMatch = (record.displayWashQty ?? record.washQty) === (itemData.displayWashQty ?? itemData.washQty);
      const dateA = new Date(record.createdAt || record.date || record.submittedAt);
      const dateB = new Date(itemData.createdAt || itemData.date || itemData.submittedAt);
      const timeDiff = Math.abs(dateA - dateB);
      const dateMatch = timeDiff < 5000; // within 5 seconds
      
      return washQtyMatch && dateMatch;
    });
  }

  // Strategy 3: If still not found, assume it's the latest record
  if (currentRecordIndex === -1) {
    currentRecordIndex = sortedRecords.length - 1;
  }

  // Calculate cumulative wash quantity up to current record (inclusive)
  const recordsUpToCurrent = sortedRecords.slice(0, currentRecordIndex + 1);
  const alreadyWashedQty = recordsUpToCurrent.reduce((sum, record) => {
    const washQty = parseInt(record.displayWashQty ?? record.washQty, 10) || 0;
    return sum + washQty;
  }, 0);

  const remainingQty = Math.max(0, (parseInt(itemData.colorOrderQty) || 0) - alreadyWashedQty);

  setWashQuantityData({
    alreadyWashedQty,
    remainingQty,
    totalRecords: sortedRecords.length,
    currentRecordPosition: currentRecordIndex + 1
  });
};


  if (!isOpen || !itemData) return null;

  const measurementSummary = itemData.measurementDetails?.measurementSizeSummary?.[0] || {};
  const measurements = itemData.measurementDetails?.measurement || [];

  // Group measurement points by name and count occurrences
  const measurementPointSummary = {};
  measurements.forEach(measurement => {
    measurement.pcs?.forEach(pc => {
      pc.measurementPoints?.forEach(point => {
        const key = point.pointName;
        if (!measurementPointSummary[key]) {
          measurementPointSummary[key] = {
            pointName: point.pointName,
            specs: point.specs,
            toleranceMinus: point.toleranceMinus,
            tolerancePlus: point.tolerancePlus,
            toleranceMinus_fraction: point.toleranceMinus_fraction,
            tolerancePlus_fraction: point.tolerancePlus_fraction,
            measurements: []
          };
        }
        measurementPointSummary[key].measurements.push({
          decimal: point.measured_value_decimal,
          fraction: point.measured_value_fraction,
          result: point.result
        });
      });
    });
  });

  // Group defects by name and count occurrences
  const defectSummary = {};
  const defectsByPc = itemData.defectDetails?.defectsByPc || [];
  defectsByPc.forEach(pc => {
    pc.pcDefects?.forEach(defect => {
      const key = defect.defectName;
      if (!defectSummary[key]) {
        defectSummary[key] = { name: defect.defectName, totalQty: 0 };
      }
      defectSummary[key].totalQty += parseInt(defect.defectQty) || 0;
    });
  });

  // Get inspection details
  const inspectionDetails = itemData.inspectionDetails || {};

  const handleRecordCardClick = () => {
  if (!itemData || !allRecords || allRecords.length === 0) {
    setSelectedRecords([]);
    setShowRecordsList(true);
    return;
  }

  // Filter records with matching criteria (same as in calculateWashQuantities)
  const matchingRecords = allRecords.filter(record => {
    return record.orderNo === itemData.orderNo &&
      record.before_after_wash === itemData.before_after_wash &&
      record.color === itemData.color &&
      record.washType === itemData.washType &&
      record.reportType === itemData.reportType;
      // record.factoryName === itemData.factoryName;
  });

  // Sort by date or creation time to get chronological order
  const sortedRecords = matchingRecords.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date || a.submittedAt);
    const dateB = new Date(b.createdAt || b.date || b.submittedAt);
    return dateA - dateB;
  });

  setSelectedRecords(sortedRecords);
  setShowRecordsList(true);
};

// Modal or list component
const RecordsListModal = () => (
  showRecordsList && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-white">
            Related Records ({selectedRecords.length})
          </h3>
          <button 
            onClick={() => setShowRecordsList(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {selectedRecords.length > 0 ? (
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left dark:text-white text-sm">
                    #
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left dark:text-white text-sm">
                    Factory Name
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left dark:text-white text-sm">
                    Date
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left dark:text-white text-sm">
                    Wash Qty <span className="text-xs text-gray-400">
                      ({itemData.isActualWashQty ? 'Actual' : 'Estimated'})
                    </span>
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left dark:text-white text-sm">
                    Inspector
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left dark:text-white text-sm">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedRecords.map((record, index) => {
                  // Check if this is the current record
                  const isCurrentRecord = 
                    (typeof record._id === 'string' && typeof itemData._id === 'string' && record._id === itemData._id) ||
                    (record._id?.$oid && itemData._id?.$oid && record._id.$oid === itemData._id.$oid) ||
                    (record._id?.$oid && typeof itemData._id === 'string' && record._id.$oid === itemData._id) ||
                    (typeof record._id === 'string' && itemData._id?.$oid && record._id === itemData._id.$oid);

                  return (
                    <tr 
                      key={index} 
                      className={`${isCurrentRecord ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 dark:text-white text-sm">
                        {index + 1}
                        {isCurrentRecord && (
                          <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 dark:text-white text-sm">
                        {record.factoryName || 'N/A'}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 dark:text-white text-sm">
                        {new Date(record.date || record.createdAt).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 dark:text-white text-sm font-semibold">
                        <span className={record.isActualWashQty ? 'text-green-500' : ''}>
                          {record.displayWashQty ?? record.washQty}
                        </span>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 dark:text-white text-sm">
                        {record.inspector?.empId || record.userId || 'N/A'}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          record.overallFinalResult === 'Pass' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            : record.overallFinalResult === 'Fail'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                        }`}>
                          {record.overallFinalResult || record.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No related records found
            </div>
          )}
        </div>

        {/* Summary at the bottom */}
        {selectedRecords.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">Total Records</p>
                <p className="font-semibold text-lg dark:text-white">{selectedRecords.length}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">Total Washed</p>
                <p className="font-semibold text-lg dark:text-white">
                  {selectedRecords.reduce((sum, record) => sum + (parseInt(record.displayWashQty ?? record.washQty) || 0), 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">Current Position</p>
                <p className="font-semibold text-lg dark:text-white">
                  {washQuantityData.currentRecordPosition} / {washQuantityData.totalRecords}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            QC-Washing Detail View
          </h2>
          <div className="flex items-center gap-4">
            {inspectorDetails && (
              <div className="flex items-center gap-3">
                <img
                  src={inspectorDetails.face_photo || '/assets/img/avatars/default-profile.png'}
                  alt={inspectorDetails.eng_name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/assets/img/avatars/default-profile.png'; }}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{inspectorDetails.eng_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{inspectorDetails.emp_id}</p>
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Wash Quantity Tracking Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Wash Quantity Tracking
            </h3>
            <div
              className={`grid grid-cols-1 ${
                itemData.reportType === "Inline" ? "md:grid-cols-4" : "md:grid-cols-3"
              } gap-4`}
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center">
                  <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Order Qty</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{itemData.colorOrderQty}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600 dark:text-green-300">Already Washed Qty</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{washQuantityData.alreadyWashedQty}</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center">
                  <Target className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-300">Remaining Qty</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{washQuantityData.remainingQty}</p>
                  </div>
                </div>
              </div>

              {itemData.reportType === "Inline" && (
                <div
                  className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  onClick={handleRecordCardClick}
                  title="Click to view all related records"
                >
                  <div className="flex items-center">
                    <Hash className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-300">Record Position</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {washQuantityData.currentRecordPosition} / {washQuantityData.totalRecords}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Progress: {washQuantityData.alreadyWashedQty} / {itemData.colorOrderQty}</span>
                <span>{((washQuantityData.alreadyWashedQty / itemData.colorOrderQty) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (washQuantityData.alreadyWashedQty / itemData.colorOrderQty) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
            <RecordsListModal />
          </div>

          {/* First Row: Order Details and Summary Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Column - Order Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Order Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Order No</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{itemData.orderNo}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                  <div className="flex items-center">
                    <Hash className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Order Qty</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{itemData.orderQty}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                  <div className="flex items-center">
                    <Palette className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Color</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{itemData.color}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                  <div className="flex items-center">
                    <Hash className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Color Qty</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{itemData.colorOrderQty}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                  <div className="flex items-center">
                    <Droplets className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Wash Type</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{itemData.washType || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                  <div className="flex items-center">
                    <ClipboardCheck className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Report Type</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{itemData.reportType || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex items-center">
                  <Target className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Wash Stage</p>
                    <p className={`text-lg font-semibold capitalize ${
                      itemData.before_after_wash === 'before wash' 
                        ? 'text-amber-900 dark:text-amber-100' 
                        : 'text-emerald-900 dark:text-emerald-100'
                    }`}>
                      {itemData.before_after_wash || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                  <div className="flex items-center">
                    <Building className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Factory</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{itemData.factoryName || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                  <div className="flex items-center">
                    <User className="w-8 h-8 text-green-600 dark:text-green-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Buyer</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{itemData.buyer || 'N/A'}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column - Summary Data */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Summary Data
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center">
                    <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Standard Checked Qty</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{itemData.checkedQty}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center">
                    <Hash className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-300">Total Checked Pcs</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{itemData.totalCheckedPcs}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
                  <div className="flex items-center">
                    <Droplets className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                        Wash Qty {itemData.isActualWashQty && <span className="text-green-500">(Actual)</span>}
                      </p>
                      <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">{itemData.displayWashQty ?? itemData.washQty}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center">
                    <Target className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">Checked Points</p>
                      <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{itemData.totalCheckedPoint}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600 dark:text-green-300">Total Pass</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{itemData.totalPass}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center">
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-600 dark:text-red-300">Total Fail</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">{itemData.totalFail}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pass Rate</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{itemData.passRate}%</p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-lg p-4 border ${
                  itemData.overallFinalResult === 'Pass'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center">
                    {itemData.overallFinalResult === 'Pass' ? (
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    )}
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        itemData.overallFinalResult === 'Pass'
                          ? 'text-green-600 dark:text-green-300'
                          : 'text-red-600 dark:text-red-300'
                      }`}>Overall Result</p>
                      <p className={`text-2xl font-bold ${
                        itemData.overallFinalResult === 'Pass'
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-red-900 dark:text-red-100'
                      }`}>{itemData.overallFinalResult}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rest of your existing sections... */}
          {/* Second Row: Defect Details and Inspection Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Column - Defect Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Defect Summary
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 mb-6">
                {Object.keys(defectSummary).length > 0 ? (
                  Object.values(defectSummary).map((defect, index) => (
                    <div key={index} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-600 dark:text-red-300">{defect.name}</p>
                          </div>
                        </div>
                        <div className="bg-red-100 dark:bg-red-800 px-3 py-1 rounded-full">
                          <span className="text-sm font-bold text-red-800 dark:text-red-200">{defect.totalQty}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-center">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-600 dark:text-green-300">No defects found</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Inspection Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                <ClipboardCheck className="w-5 h-5 mr-2" />
                Inspection Details
              </h3>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="space-y-4">
                  {/* NEW: Checkpoint Inspection Data */}
                  {inspectionDetails.checkpointInspectionData && inspectionDetails.checkpointInspectionData.length > 0 ? (
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Checkpoints</h4>
                      <div className="space-y-4">
                        {inspectionDetails.checkpointInspectionData.map((mainPoint, index) => (
                          <div key={mainPoint.id || index} className="bg-gray-50 dark:bg-gray-600/50 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{mainPoint.name}</p>
                              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                mainPoint.decision === 'Pass' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' : 
                                mainPoint.decision === 'Fail' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100'
                              }`}>
                                {mainPoint.decision}
                              </span>
                            </div>
                            {mainPoint.remark && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Remark: {mainPoint.remark}</p>}
                            {mainPoint.subPoints && mainPoint.subPoints.length > 0 && (
                              <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-500 space-y-2">
                                {mainPoint.subPoints.map((subPoint, subIndex) => (
                                  <div key={subPoint.id || subIndex}>
                                    <div className="flex justify-between items-center">
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{subPoint.name}:</p>
                                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{subPoint.decision}</span>
                                    </div>
                                    {subPoint.remark && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Remark: {subPoint.remark}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Fallback to legacy checkedPoints
                    inspectionDetails.checkedPoints && inspectionDetails.checkedPoints.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Checked Points</h4>
                        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3">
                          {inspectionDetails.checkedPoints.map((point, index) => (
                            <div key={index} className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-3 ${
                                point.decision === 'ok' ? 'bg-green-500' : 
                                point.decision === 'no' ? 'bg-red-500' : 'bg-yellow-500'
                              }`}></div>
                              <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{point.pointName}</p>
                                <p className={`text-sm ${
                                  point.decision === 'ok' ? 'text-green-600 dark:text-green-400' : 
                                  point.decision === 'no' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                                }`}>{point.decision?.toUpperCase()}</p>
                              </div>
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
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                        {inspectionDetails.parameters.map((param, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-600 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{param.parameterName}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Pass Rate: {param.passRate}%</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                param.result === 'Pass' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              }`}>
                                {param.result}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Machine Processes */}
                  {inspectionDetails.machineProcesses && inspectionDetails.machineProcesses.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Machine Processes</h4>
                      <div className="space-y-3">
                        {inspectionDetails.machineProcesses.map((machine, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-600 rounded-lg p-3">
                            <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">{machine.machineType}</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              {machine.temperature && (
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    machine.temperature.status?.ok ? 'bg-green-500' : 'bg-red-500'
                                  }`}></div>
                                  <span>Temp: {machine.temperature.actualValue}°C</span>
                                </div>
                              )}
                              {machine.time && (
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    machine.time.status?.ok ? 'bg-green-500' : 'bg-red-500'
                                  }`}></div>
                                  <span>Time: {machine.time.actualValue}min</span>
                                </div>
                              )}
                              {machine.timeCool && machine.timeCool.actualValue && (
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    machine.timeCool.status?.ok ? 'bg-green-500' : 'bg-red-500'
                                  }`}></div>
                                  <span>Time Cool: {machine.timeCool.actualValue}min</span>
                                </div>
                              )}
                              {machine.timeHot && machine.timeHot.actualValue && (
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    machine.timeHot.status?.ok ? 'bg-green-500' : 'bg-red-500'
                                  }`}></div>
                                  <span>Time Hot: {machine.timeHot.actualValue}min</span>
                                </div>
                              )}
                              {machine.silicon && machine.silicon.actualValue && (
                                <div className="flex items-center">
                                                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                    machine.silicon.status?.ok ? 'bg-green-500' : 'bg-red-500'
                                  }`}></div>
                                  <span>Silicon: {machine.silicon.actualValue}g</span>
                                </div>
                              )}
                              {machine.softener && machine.softener.actualValue && (
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    machine.softener.status?.ok ? 'bg-green-500' : 'bg-red-500'
                                  }`}></div>
                                  <span>Softener: {machine.softener.actualValue}g</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Measurement Summary Section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Summary of Measurements
              </h3>
            </div>
            <div className="overflow-x-auto">
              {(() => {
                // Get all unique measurement values across all points
                const allMeasurementValues = new Set();
                Object.values(measurementPointSummary).forEach(point => {
                  point.measurements.forEach(measurement => {
                    const value = measurement.fraction || measurement.decimal?.toString() || 'N/A';
                    allMeasurementValues.add(value);
                  });
                });

                const sortedValues = Array.from(allMeasurementValues).sort();

                return (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th rowSpan="2" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                          Measurement Point
                        </th>
                        <th rowSpan="2" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                          Spec
                        </th>
                        <th rowSpan="2" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                          Tolerance -
                        </th>
                        <th rowSpan="2" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                          Tolerance +
                        </th>
                        <th colSpan={sortedValues.length} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Measurement Values (Count)
                        </th>
                      </tr>
                      <tr>
                        {sortedValues.map((value, idx) => (
                          <th key={idx} className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-l border-gray-200 dark:border-gray-600">
                            {value}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {Object.values(measurementPointSummary).map((point, index) => {
                        // Group measurements by value and count occurrences
                        const valueCounts = {};
                        point.measurements.forEach(measurement => {
                          const key = measurement.fraction || measurement.decimal?.toString() || 'N/A';
                          if (!valueCounts[key]) {
                            valueCounts[key] = { count: 0, result: measurement.result };
                          }
                          valueCounts[key].count++;
                        });

                        return (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                              {point.pointName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                              {point.specs}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                              {getToleranceAsFraction(point, 'minus')}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                              +{getToleranceAsFraction(point, 'plus')}
                            </td>
                            {sortedValues.map((value, idx) => {
                              const valueData = valueCounts[value];
                              return (
                                <td key={idx} className="px-2 py-3 text-center text-sm border-l border-gray-200 dark:border-gray-600">
                                  {valueData ? (
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                                      valueData.result === 'pass'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                    }`}>
                                      {valueData.count}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      {Object.keys(measurementPointSummary).length === 0 && (
                        <tr>
                          <td colSpan={4 + sortedValues.length} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No measurement data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QCWashingViewDetailsModal;

                                  
