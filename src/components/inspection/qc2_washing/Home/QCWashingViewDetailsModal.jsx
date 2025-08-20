import React from "react";
import { X, Package, Droplets, Target, CheckCircle, XCircle, TrendingUp, BarChart3, FileText, Palette, Building, User, Hash, AlertTriangle, ClipboardCheck } from "lucide-react";

const QCWashingViewDetailsModal = ({ isOpen, onClose, itemData }) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            QC-Washing Detail View
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
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
                      <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">Wash Qty</p>
                      <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">{itemData.washQty}</p>
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
                  {/* Checked Points */}
                  {inspectionDetails.checkedPoints && inspectionDetails.checkedPoints.length > 0 && (
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
                              }`}>{point.decision}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                              {machine.silicon && machine.silicon.actualValue && (
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    machine.silicon.status?.ok ? 'bg-green-500' : 'bg-red-500'
                                  }`}></div>
                                  <span>Silicon: {machine.silicon.actualValue}</span>
                                </div>
                              )}
                              {machine.softener && machine.softener.actualValue && (
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    machine.softener.status?.ok ? 'bg-green-500' : 'bg-red-500'
                                  }`}></div>
                                  <span>Softener: {machine.softener.actualValue}</span>
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
                              {point.toleranceMinus}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                              {point.tolerancePlus}
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