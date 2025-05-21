import React from 'react';
import { XCircle } from 'lucide-react';

// Placeholder for defect categorization logic - Customize this with your actual rules
const categorizeDefect = (defectName) => {
  if (!defectName) return { category: 'Unknown', color: 'bg-gray-100 text-gray-800', symbol: '' };
  const lowerDefectName = defectName.toLowerCase();

  // Prioritize Critical
  if (lowerDefectName.includes('critical') || lowerDefectName.includes('safety') || lowerDefectName.includes('hole')) {
    return { category: 'Critical', color: 'bg-red-200 text-red-800', symbol: '' };
  }
  // Then Major
  if (lowerDefectName.includes('major') || lowerDefectName.includes('broken') || lowerDefectName.includes('open') || lowerDefectName.includes('mismatched') || lowerDefectName.includes('skip') || lowerDefectName.includes('unravel')) {
    return { category: 'Major', color: 'bg-red-200 text-red-800', symbol: '' };
  }
  // Then Minor
  if (lowerDefectName.includes('minor') || lowerDefectName.includes('dirty') || lowerDefectName.includes('uneven') || lowerDefectName.includes('puckering') || lowerDefectName.includes('stain') || lowerDefectName.includes('crease')) {
    return { category: 'Minor', color: 'bg-yellow-200 text-yellow-800', symbol: '' };
  }
  // Default if no keywords match
  return { category: 'Minor', color: 'bg-yellow-200 text-yellow-800', symbol: '' };
};

const getOverallRovingStatusColor = (status) => {
  if (!status) return 'bg-gray-100 text-gray-800';
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === 'pass') {
    return 'bg-green-100 text-green-700';
  }
   if (lowerStatus === 'reject-critical' || 
      lowerStatus === 'reject-major-m' || 
      lowerStatus === 'reject-minor-m') {
    return 'bg-red-100 text-red-700';
  }
   if (lowerStatus === 'reject' || 
      lowerStatus === 'reject-minor-s' || 
      lowerStatus === 'reject-major-s') {
    return 'bg-yellow-100 text-yellow-700';
  }
   return 'bg-gray-100 text-gray-800'; 
};

const RovingReportDetailView = ({ reportDetail, onClose, calculateGroupMetrics, filters }) => {
  if (!reportDetail) return null;

 // Apply filters to inspection_rep entries
  const filteredRepetitions = reportDetail.inspection_rep && reportDetail.inspection_rep.filter(repEntry => {
    if (!repEntry) return false;
    if (filters.qcId && repEntry.emp_id !== filters.qcId) {
      return false;
    }
    return true;
  });

  // Helper to filter inlineData within a repetition
  const getFilteredInlineData = (inlineDataArray) => {
    if (!Array.isArray(inlineDataArray)) return [];
    return inlineDataArray.filter(item => {
      if (!item) return false;
      if (filters.operation && item.tg_no !== filters.operation) { 
        return false; 
      }
      return true;
    });
  };

  return (

    <td colSpan="14" className="p-0">
      <div className="p-4 border-t-2 border-blue-600 bg-blue-50 shadow-inner">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-700">
            Detailed Report (MO: {reportDetail.mo_no}, Line: {reportDetail.line_no}, Date: {reportDetail.inspection_date})

          </h3>
          <button onClick={onClose} className="text-red-600 hover:text-red-800">
            <XCircle size={28} />
          </button>
        </div>

        {filteredRepetitions && filteredRepetitions.length > 0 ? (
          filteredRepetitions.map((repEntry, repIdx) => {
          // Get filtered inlineData for this specific repetition
          const currentRepFilteredInlineData = getFilteredInlineData(repEntry.inlineData);

          // Create a temporary repEntry object with only the filtered inlineData for metric calculation
          const repEntryForMetrics = { ...repEntry, inlineData: currentRepFilteredInlineData };
          // Calculate metrics for this specific repetition
          const repMetrics = calculateGroupMetrics(repEntryForMetrics);  // calculateGroupMetrics now expects an object with inlineData
          
          // Aggregate defects by category for this specific repetition
          let criticalDefectsCount = 0;
          let majorDefectsCount = 0;
          let minorDefectsCount = 0;

if (currentRepFilteredInlineData && Array.isArray(currentRepFilteredInlineData)) {
            currentRepFilteredInlineData.forEach(entry => {
              if (entry.rejectGarments && Array.isArray(entry.rejectGarments)) {
                entry.rejectGarments.forEach(rg => {
                  if (rg.garments && Array.isArray(rg.garments)) {
                    rg.garments.forEach(garment => {
                      if (garment.defects && Array.isArray(garment.defects)) {
                        garment.defects.forEach(defect => {
                          if (defect && defect.name && typeof defect.count === 'number') {
                            const { category } = categorizeDefect(defect.name);
                            if (category === 'Critical') criticalDefectsCount += defect.count;
                            else if (category === 'Major') majorDefectsCount += defect.count;
                            else if (category === 'Minor') minorDefectsCount += defect.count;
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }

          return (
            <div key={repEntry.inspection_rep_name || repIdx} className="mb-8 border-b-2 border-gray-300 pb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3 bg-gray-100 p-2 rounded">
                Inspection No: {repEntry.inspection_rep_name} (Inspector: {repEntry.eng_name} - {repEntry.emp_id})
              </h4>
              {/* Part 1: Inspection result by inspection no. Table */}
              <div className="mb-6 bg-white p-4 rounded shadow">
                <h5 className="text-md font-semibold text-gray-700 mb-2">Summary for this Inspection</h5>
                <table className="w-full text-sm border border-collapse border-gray-300">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-2 border border-gray-300">Check Qty</th>
                      <th className="p-2 border border-gray-300">Defect Garments</th>
                      <th className="p-2 border border-gray-300">Defect Rate (%)</th>
                      <th className="p-2 border border-gray-300">Pass Rate (%)</th>
                      <th className="p-2 border border-gray-300" colSpan="2">SPI Count</th>
                      <th className="p-2 border border-gray-300" colSpan="2">Measurement</th>
                      <th className="p-2 border border-gray-300 text-center" colSpan="3">Defects Summary</th>
                    </tr>
                    <tr>
                      <th className="p-2 border border-gray-300" colSpan="4"></th>
                      <th className="p-2 border border-gray-300 text-xs">Pass</th>
                      <th className="p-2 border border-gray-300 text-xs">Reject</th>
                      <th className="p-2 border border-gray-300 text-xs">Pass</th>
                      <th className="p-2 border border-gray-300 text-xs">Reject</th>
                      <th className="p-2 border border-gray-300 text-xs text-red-700">Critical</th>
                      <th className="p-2 border border-gray-300 text-xs text-red-600">Major</th>
                      <th className="p-2 border border-gray-300 text-xs text-yellow-700">Minor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-gray-300 text-center">{repMetrics.totalCheckedQty}</td>
                      <td className="p-2 border border-gray-300 text-center">{repMetrics.totalRejectGarmentCount}</td>
                      <td className="p-2 border border-gray-300 text-center">{repMetrics.defectRate}</td>
                      <td className="p-2 border border-gray-300 text-center">{repMetrics.passRate}</td>
                      <td className={`p-2 border border-gray-300 text-center ${repMetrics.totalSpiPass > 0 ? 'bg-green-100 text-green-700' : ''}`}>{repMetrics.totalSpiPass}</td>
                      <td className={`p-2 border border-gray-300 text-center ${repMetrics.totalSpiReject > 0 ? 'bg-red-100 text-red-700' : ''}`}>{repMetrics.totalSpiReject}</td>
                      <td className={`p-2 border border-gray-300 text-center ${repMetrics.totalMeasurementPass > 0 ? 'bg-green-100 text-green-700' : ''}`}>{repMetrics.totalMeasurementPass}</td>
                      <td className={`p-2 border border-gray-300 text-center ${repMetrics.totalMeasurementReject > 0 ? 'bg-red-100 text-red-700' : ''}`}>{repMetrics.totalMeasurementReject}</td>
                      <td className={`p-2 border border-gray-300 text-center font-semibold ${criticalDefectsCount > 0 ? 'bg-red-200 text-red-800' : (majorDefectsCount === 0 && minorDefectsCount === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-50')}`}>
                        {criticalDefectsCount > 0 ? `${criticalDefectsCount}` : (majorDefectsCount === 0 && minorDefectsCount === 0 ? '0' : '0')}
                      </td>
                      <td className={`p-2 border border-gray-300 text-center font-semibold ${majorDefectsCount > 0 ? 'bg-red-200 text-red-800' : (criticalDefectsCount === 0 && minorDefectsCount === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-50')}`}>
                        {majorDefectsCount > 0 ? `${majorDefectsCount}` : (criticalDefectsCount === 0 && minorDefectsCount === 0 ? '0' : '0')}
                      </td>
                      <td className={`p-2 border border-gray-300 text-center font-semibold ${minorDefectsCount > 0 ? 'bg-yellow-200 text-yellow-800' : (criticalDefectsCount === 0 && majorDefectsCount === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-50')}`}>
                        {minorDefectsCount > 0 ? `${minorDefectsCount}` : (criticalDefectsCount === 0 && majorDefectsCount === 0 ? '0' : '0')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Part 2: Roving data Table for this repetition */}
              <div className="bg-white p-4 rounded shadow">
                <h5 className="text-md font-semibold text-gray-700 mb-2">Roving Data Details (Individual Checks for this Repetition)</h5>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-xs border border-collapse border-gray-300">
                    <thead className="bg-gray-200 sticky top-0">
                      <tr>
                        <th className="p-2 border border-gray-300">Operator ID</th>
                        <th className="p-2 border border-gray-300">Operator Name</th>
                        <th className="p-2 border border-gray-300">TG No.</th>
                        <th className="p-2 border border-gray-300">Operation (CH)</th>
                        <th className="p-2 border border-gray-300">Type</th>
                        <th className="p-2 border border-gray-300">Checked Qty</th>
                        <th className="p-2 border border-gray-300">SPI</th>
                        <th className="p-2 border border-gray-300">Measurement</th>
                        <th className="p-2 border border-gray-300">Quality Status</th>
                        <th className="p-2 border border-gray-300">Overall Roving Status</th>
                        <th className="p-2 border border-gray-300">Defects Found</th>
                        <th className="p-2 border border-gray-300">Insp. Time</th>
                        <th className="p-2 border border-gray-300">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRepFilteredInlineData && currentRepFilteredInlineData.length > 0 ? (
                        currentRepFilteredInlineData.map((item, itemIdx) => (
                          <tr key={item._id?.$oid || itemIdx}>
                            <td className="p-2 border border-gray-300">{item.operator_emp_id}</td>
                            <td className="p-2 border border-gray-300">{item.operator_eng_name}</td>
                            <td className="p-2 border border-gray-300">{item.tg_no}</td>
                            <td className="p-2 border border-gray-300">{item.operation_ch_name}</td>
                            <td className="p-2 border border-gray-300">{item.type}</td>
                            <td className="p-2 border border-gray-300 text-center">{item.checked_quantity}</td>
                            <td className={`p-2 border border-gray-300 text-center ${item.spi === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.spi}</td>
                            <td className={`p-2 border border-gray-300 text-center ${item.measurement === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.measurement}</td>
                            <td className={`p-2 border border-gray-300 text-center ${item.qualityStatus === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.qualityStatus}</td>
                            <td className={`p-2 border border-gray-300 text-center ${getOverallRovingStatusColor(item.overall_roving_status)}`}>{item.overall_roving_status}</td>
                            <td className="p-2 border border-gray-300">
                              {item.rejectGarments && item.rejectGarments.map(rg =>
                                rg.garments && rg.garments.map(g =>
                                  g.defects && g.defects.map((defect, defectIdx) => {
                                    const cat = categorizeDefect(defect.name);
                                    return (
                                      <span key={defect._id?.$oid || `${defect.name}-${defectIdx}`} className={`mr-1 p-1 rounded text-xs ${cat.color}`}>
                                        {cat.symbol} {defect.name} ({defect.count})
                                      </span>
                                    );
                                  })
                                )
                              )}
                            </td>
                            <td className="p-2 border border-gray-300">{item.inspection_time}</td>
                            <td className="p-2 border border-gray-300">{item.remark}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="13" className="p-2 text-center border border-gray-300">No individual roving data available for this repetition.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
         })
        ) : (
          <div className="text-center py-4 text-gray-600">
            No inspection repetitions match the current filters for this report.
          </div>
        )}
      </div>
    </td>
  );
};

export default RovingReportDetailView;  
