import React from 'react';

const SummaryCard = ({ 
  inspectionData, 
  defectData, 
  measurementData, 
  showMeasurementTable 
}) => {
  // Calculate inspection points
  const inspectionPoints = inspectionData.filter(item => !item.na).length;
  const inspectionPass = inspectionData.filter(item => !item.na && item.approvedDate).length;
  
  // Calculate defect parameters
  const defectPoints = defectData.length;
  const defectPass = defectData.filter(item => item.ok).length;
  
  // Calculate measurement points (only if saved)
  let measurementPoints = 0;
  let measurementPass = 0;
  
  if (!showMeasurementTable && measurementData.length > 0) {
    measurementData.forEach(data => {
      const totalMeasurements = Object.keys(data.measurements || {}).length;
      const passMeasurements = Object.values(data.results || {}).filter(result => result.result === 'pass').length;
      measurementPoints += totalMeasurements;
      measurementPass += passMeasurements;
    });
  }
  
  // Calculate totals
  const totalCheckedPoints = inspectionPoints + defectPoints + measurementPoints;
  const totalPass = inspectionPass + defectPass + measurementPass;
  const totalFail = totalCheckedPoints - totalPass;
  const passRate = totalCheckedPoints > 0 ? ((totalPass / totalCheckedPoints) * 100).toFixed(1) : 0;
  
  // Determine overall result (pass if pass rate >= 80%)
  const overallResult = parseFloat(passRate) >= 80 ? 'PASS' : 'FAIL';
  const resultColor = overallResult === 'PASS' ? 'text-green-600' : 'text-red-600';
  const resultBgColor = overallResult === 'PASS' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Washing Summary</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Checked Points */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalCheckedPoints}</div>
          <div className="text-sm text-blue-700">Total Checked Points</div>
        </div>
        
        {/* Total Pass */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalPass}</div>
          <div className="text-sm text-green-700">Total Pass</div>
        </div>
        
        {/* Total Fail */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{totalFail}</div>
          <div className="text-sm text-red-700">Total Fail</div>
        </div>
        
        {/* Pass Rate */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{passRate}%</div>
          <div className="text-sm text-yellow-700">Pass Rate</div>
        </div>
        
        {/* Overall Result */}
        <div className={`${resultBgColor} rounded-lg p-4 text-center`}>
          <div className={`text-2xl font-bold ${resultColor}`}>{overallResult}</div>
          <div className={`text-sm ${resultColor}`}>Result</div>
        </div>
      </div>
      
      {/* Breakdown */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 rounded p-3">
          <div className="font-medium text-gray-700">Inspection Points</div>
          <div className="text-gray-600">{inspectionPass}/{inspectionPoints} passed</div>
        </div>
        
        <div className="bg-gray-50 rounded p-3">
          <div className="font-medium text-gray-700">Defect Parameters</div>
          <div className="text-gray-600">{defectPass}/{defectPoints} passed</div>
        </div>
        
        <div className="bg-gray-50 rounded p-3">
          <div className="font-medium text-gray-700">Measurement Points</div>
          <div className="text-gray-600">{measurementPass}/{measurementPoints} passed</div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;