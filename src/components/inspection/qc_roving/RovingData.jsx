import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config"; // Adjust the path as needed
import Swal from "sweetalert2";
import RovingFilterPlane from "../qc_roving/RovingDataFilterPane";

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${month}/${day}/${year}`; // YYYY-MM-DD
};

const RovingData = ({ refreshTrigger }) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    date: getTodayDateString(), // Expects 'MM/DD/YYYY' string or empty
    qcId: '',
    operatorId: '',
    lineNo: '',
    moNo: '',
  });

  const [uniqueQcIds, setUniqueQcIds] = useState([]);
  const [uniqueOperatorIds, setUniqueOperatorIds] = useState([]);
  const [uniqueLineNos, setUniqueLineNos] = useState([]);
  const [uniqueMoNos, setUniqueMoNos] = useState([]);

  const populateUniqueFilterOptions = useCallback((sourceReports) => {
    if (sourceReports && sourceReports.length > 0) {
      const qcIds = new Set();
      const operatorIds = new Set();
      const lineNos = new Set();
      const moNos = new Set();

      sourceReports.forEach(report => {
        if (report.emp_id) qcIds.add(report.emp_id);
        if (report.line_no) lineNos.add(report.line_no);
        if (report.mo_no) moNos.add(report.mo_no);
        report.inlineData?.forEach(data => {
          if (data.operator_emp_id) operatorIds.add(data.operator_emp_id);
        });
      });

      setUniqueQcIds(Array.from(qcIds).sort());
      setUniqueOperatorIds(Array.from(operatorIds).sort());
      setUniqueLineNos(Array.from(lineNos).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true })));
      setUniqueMoNos(Array.from(moNos).sort());
    } else {
      setUniqueQcIds([]);
      setUniqueOperatorIds([]);
      setUniqueLineNos([]);
      setUniqueMoNos([]);
    }
  }, []);

  const fetchReports = useCallback(async (currentFilters) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (currentFilters.date) queryParams.append("inspection_date", currentFilters.date);
      if (currentFilters.qcId) queryParams.append("qcId", currentFilters.qcId);
      if (currentFilters.operatorId) queryParams.append("operatorId", currentFilters.operatorId);
      if (currentFilters.lineNo) queryParams.append("lineNo", currentFilters.lineNo);
      if (currentFilters.moNo) queryParams.append("moNo", currentFilters.moNo);

      let endpoint = `${API_BASE_URL}/api/qc-inline-roving-reports`;
      if (queryParams.toString()) {
        endpoint = `${API_BASE_URL}/api/qc-inline-roving-reports/filtered?${queryParams.toString()}`;
      }

      const response = await axios.get(endpoint);
      const rawReportsFromApi = response.data || [];
      populateUniqueFilterOptions(rawReportsFromApi);

      let reportsForDisplay = rawReportsFromApi;
      if (currentFilters.operatorId) {
        reportsForDisplay = rawReportsFromApi.map(report => {
          const filteredInlineData = report.inlineData?.filter(
            inlineEntry => String(inlineEntry.operator_emp_id) === String(currentFilters.operatorId)
          ) || [];
          return { ...report, inlineData: filteredInlineData };
        }).filter(report => report.inlineData && report.inlineData.length > 0);
      }

      setReports(reportsForDisplay);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch reports."
      });
      setReports([]);
      populateUniqueFilterOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [populateUniqueFilterOptions]);

  useEffect(() => {
    fetchReports(filters);
  }, [filters, refreshTrigger, fetchReports]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="mt-4">
      <RovingFilterPlane
        onFilterChange={handleFilterChange}
        initialFilters={filters}
        uniqueQcIds={uniqueQcIds}
        uniqueOperatorIds={uniqueOperatorIds}
        uniqueLineNos={uniqueLineNos}
        uniqueMoNos={uniqueMoNos}
      />
      <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded-md text-xs text-gray-700">
        <h4 className="font-semibold text-sm mb-2">Legend:</h4>
        <div className="flex flex-wrap md:flex-nowrap md:space-x-8">
          <ul className="list-disc list-inside space-y-1 flex-1 min-w-[250px]">
            <li><span className="text-green-600 font-bold text-lg">✓</span> : Pass</li>
            <li><span className="text-red-600 font-bold text-lg">✗</span> : Fail / Reject</li>
            {/* <li><span className="text-green-600 font-bold text-lg">✓</span> : Individual Check Pass</li> */}
            {/* <li><span className="text-red-600 font-bold text-lg">✗</span> : Individual Check Fail / Reject</li> */}
            <li><span className="font-semibold">SPI</span> : Stitches Per Inch</li>
            <li><span className="font-semibold">Meas.</span> : Measurement</li>
            {/* <li><span className="font-semibold">Chk'd/Def</span> : Qty Checked / Total Defects for Operator</li> */}
          </ul>
          <ul className="list-disc list-inside space-y-1 flex-1 min-w-[250px] mt-2 md:mt-0">
            <li><span className="font-semibold">Chk'd/Def</span> : Quantity Checked / Total Defects for Operator</li>
            <li>
              <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 mr-1 align-middle"></span>
              <span className="font-semibold align-middle">Green Background</span> : Indicates the specific garment/check passed.
              {/* <span className="font-semibold align-middle">Green BG</span> : Operator Overall PASS (SPI/Meas. Pass, 0 Defects). */}
            </li>
            {/* <li>
              <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-300 mr-1 align-middle"></span>
              <span className="font-semibold align-middle">Yellow BG</span> : Operator REJECT (SPI/Meas. Fail OR 1 Minor Defect).
            </li> */}
            <li>
              <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 mr-1 align-middle"></span>
              <span className="font-semibold align-middle">Red Background</span> : Indicates the specific garment/check failed or was rejected.
               {/* <span className="font-semibold align-middle">Red BG</span> : Operator REJECT (Critical Defect OR &gt;1 Minor Defects). */}
            </li>
            {/* <li><span className="font-semibold">BG</span> : Background Color (applies to SPI, Meas., Chk'd/Def cells for an operator)</li> */}
          </ul>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-10 text-gray-500">Loading reports...</div>
      ) : (
        <div className="overflow-x-auto relative max-h-[600px]">
          {reports.length === 0 ? (
            <div className="text-center p-10 text-gray-500">No reports found matching your criteria.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-200 sticky top-0 z-10 shadow-md">
                <tr>
                  <th rowSpan="3" className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500 align-middle">Operator ID</th>
                  <th rowSpan="3" className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500 align-middle">Operation</th>
                  <th rowSpan="3" className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500 align-middle">Machine Code</th>
                  <th colSpan="15" className="px-2 py-1 text-center text-sm font-medium text-gray-700 border border-gray-500">Inspection Data</th>
                </tr>
                <tr>
                  {["1st", "2nd", "3rd", "4th", "5th"].map((garmentOrdinal) => (
                    <th key={garmentOrdinal} colSpan="3" className="px-2 py-1 text-center text-xs font-medium text-gray-700 border border-gray-500">
                      {garmentOrdinal} Inspection
                    </th>
                  ))}
                </tr>
                <tr>
                  {Array(5).fill(null).map((_, groupIndex) => (
                    <React.Fragment key={`subgroup-${groupIndex}`}>
                      <th className="px-1 py-1 text-left text-xs font-medium text-gray-700 border border-gray-500 whitespace-nowrap">SPI</th>
                      <th className="px-1 py-1 text-left text-xs font-medium text-gray-700 border border-gray-500 whitespace-nowrap">Meas.</th>
                      <th className="px-1 py-1 text-left text-xs font-medium text-gray-700 border border-gray-500 whitespace-nowrap">Chk'd/Def</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) =>
                    report.inlineData?.map((data, index) => {
                      const allGarmentsDetails = data.rejectGarments?.[0]?.garments;
                    const totalDefectsForOperatorRecord = data.rejectGarments?.[0]?.totalCount || 0;
                    const inspectionCells = [];
                    const numGarmentDisplayGroups = 5; // For "1st" to "5th" garment headers

                    // Helper function to determine cell background color
                    const getCellBackgroundColor = (status) => {
                      if (status === 'Pass') return 'bg-green-100 hover:bg-green-200';
                      if (status === 'Fail' || status === 'Reject') return 'bg-red-100 hover:bg-red-200';
                      return 'hover:bg-gray-50'; // Default for N/A or other statuses
                    // const overallOperatorStatus = data.overall_roving_status || 'NOT_CALCULATED';

                    // Helper function to determine cell background color based on OVERALL operator status
                    // const getOverallCellBackgroundColor = (statusKey) => {
                    //   switch (statusKey) {
                    //     case 'Pass':
                    //       return 'bg-green-100 hover:bg-green-200';
                    //     case 'Reject-Critical':
                    //     case 'Reject-Multiple-Minors':
                    //       return 'bg-red-100 hover:bg-red-200';
                    //     case 'Reject-Single-Minor':
                    //     case 'Reject-General': // Covers SPI/Measurement fail with 0 defects
                    //       return 'bg-yellow-100 hover:bg-yellow-200';
                    //     default: // 'Pending', 'NOT_CALCULATED', or unknown
                    //       return 'bg-gray-100 hover:bg-gray-200';
                    //   }

                    };

                     const renderResultSymbol = (status) => {
                      if (status === 'Pass') {
                        return <span className="text-green-600 font-bold text-lg">✓</span>;
                      }
                      if (status === 'Fail' || status === 'Reject') {
                        return <span className="text-red-600 font-bold text-lg">✗</span>;
                      }
                      return <span className="text-gray-500">N/A</span>;
                    };
                    const constructTooltipText = (reportDetails, operatorInspectionData, totalDefectsForOp) => {
                      let defectsString = "Defects Found: None";
                      const defectsList = [];
                      if (operatorInspectionData.rejectGarments && 
                          operatorInspectionData.rejectGarments.length > 0 && 
                          operatorInspectionData.rejectGarments[0].garments) {
                        operatorInspectionData.rejectGarments[0].garments.forEach(garment => {
                          garment.defects.forEach(defect => {
                            defectsList.push(`  - ${defect.name} (Qty: ${defect.count}, Op.ID: ${defect.operationId || 'N/A'})`);
                          });
                        });
                      }
                      if (defectsList.length > 0) {
                        defectsString = "Defects Found:\n" + defectsList.join('\n');
                      }

                      return `Inspection Details:
                      Date: ${reportDetails.inspection_date || 'N/A'}
                      QC ID: ${reportDetails.emp_id || 'N/A'}
                      Line No: ${reportDetails.line_no || 'N/A'}
                      MO No: ${reportDetails.mo_no || 'N/A'}
                      ------------------------------
                      Operator ID: ${operatorInspectionData.operator_emp_id || 'N/A'}
                      Operator Name: ${operatorInspectionData.operator_kh_name || operatorInspectionData.operator_eng_name || 'N/A'}
                      Operation: ${operatorInspectionData.operation_kh_name || operatorInspectionData.operation_ch_name || 'N/A'}
                      Machine Code: ${operatorInspectionData.ma_code || 'N/A'}
                      ------------------------------
                      Type: ${operatorInspectionData.type || 'N/A'} 
                      Checked Qty: ${operatorInspectionData.checked_quantity || 'N/A'}
                      SPI: ${operatorInspectionData.spi || 'N/A'} 
                      Meas: ${operatorInspectionData.measurement || 'N/A'} 
                      Total Defects (Op): ${totalDefectsForOp}
                      Overall Result (Op): ${operatorInspectionData.qualityStatus || 'N/A'}
                      Overall Roving Status: ${operatorInspectionData.overall_roving_status || 'N/A'}
                      ------------------------------
                      ${defectsString}`;
                                          };

                    for (let i = 0; i < numGarmentDisplayGroups; i++) {
                      if (i < data.checked_quantity) { // If this display slot corresponds to an actual checked garment
                        const garmentDetail = allGarmentsDetails?.[i]; // Get the specific garment's details

                        const spiDisplay = data.spi || "N/A";
                        const measDisplay = data.measurement || "N/A";
                        let defectCountForSlotDisplay = "N/A";
                        const chkdDefDisplay = `${data.checked_quantity}/${totalDefectsForOperatorRecord}`;
                        let resultForSlotDisplay = "N/A";

                        if (data.qualityStatus === 'Pass') {
                          // Overall inspection for the operator passed
                          defectCountForSlotDisplay = 0; // No defects for any garment if overall is Pass
                          
                          resultForSlotDisplay = "Pass"; // This slot is Pass
                        } else {
                          // Overall inspection for the operator is 'Reject'
                          if (garmentDetail) {
                            defectCountForSlotDisplay = garmentDetail.garment_defect_count;
                           
                            resultForSlotDisplay = garmentDetail.status; // 'Pass' or 'Fail' for this specific garment
                          } else {
                            // Fallback if garmentDetail is missing (e.g., for older data or if backend data is incomplete)
                            defectCountForSlotDisplay = "N/A"; // Or data.rejectGarments?.[0]?.totalCount if you want total here
                            
                            resultForSlotDisplay = "N/A"; // Or data.qualityStatus
                          }
                        }
                       const cellBgClass = getCellBackgroundColor(resultForSlotDisplay);

                       const tooltipTitle = constructTooltipText(report, data, totalDefectsForOperatorRecord);

                        // SPI, Measurement cells display their status (Pass/Reject/N/A) using renderResultSymbol (✓/✗/N/A)
                        // Chk'd/Def cell displays the ratio.
                        inspectionCells.push(<td key={`spi-${i}`} title={tooltipTitle} className={`px-1 py-1 text-xs text-gray-700 border border-gray-300 ${cellBgClass} transition-colors duration-150 text-center`}>{renderResultSymbol(spiDisplay)}</td>);
                        inspectionCells.push(<td key={`meas-${i}`} title={tooltipTitle} className={`px-1 py-1 text-xs text-gray-700 border border-gray-300 ${cellBgClass} transition-colors duration-150 text-center`}>{renderResultSymbol(measDisplay)}</td>);
                        inspectionCells.push(<td key={`chkdef-${i}`} title={tooltipTitle} className={`px-1 py-1 text-xs text-gray-700 border border-gray-300 ${cellBgClass} transition-colors duration-150`}>{chkdDefDisplay}</td>);
                      } else {
                        // This garment group is beyond the actual checked_quantity for this record, fill with N/A
                        for (let k = 0; k < 5; k++) {
                          inspectionCells.push(<td key={`empty-${i}-${k}`} className="px-1 py-1 text-xs text-gray-700 border border-gray-300">N/A</td>);
                        }
                      }
                    }
                    return (
                      <tr key={`${report.inline_roving_id}-${index}`} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-2 py-1 text-xs text-gray-700 border border-gray-300">{data.operator_emp_id || "N/A"}</td>
                        <td className="px-2 py-1 text-xs text-gray-700 border border-gray-300">{data.operation_kh_name || data.operation_ch_name || "N/A"}</td>
                        <td className="px-2 py-1 text-xs text-gray-700 border border-gray-300">{data.ma_code || "N/A"}</td>
                        {inspectionCells}
                      </tr>
                    );
                  })

                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default RovingData;

