import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config"; // Adjust the path as needed
import Swal from "sweetalert2";
import RovingFilterPlane from "../qc_roving/RovingDataFilterPane";

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${month}/${day}/${year}`; // MM/DD/YYYY
};

const REPETITION_KEYS = [
  "1st Inspection",
  "2nd Inspection",
  "3rd Inspection",
  "4th Inspection",
  "5th Inspection",
];

const RovingData = ({ refreshTrigger }) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [filters, setFilters] = useState({
    date: getTodayDateString(),
    qcId: "",
    operatorId: "",
    lineNo: "",
    moNo: "",
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

      sourceReports.forEach((report) => {
        // if (report.emp_id) qcIds.add(report.emp_id);
        if (report.line_no) lineNos.add(report.line_no);
        if (report.mo_no) moNos.add(report.mo_no);
        // report.inlineData?.forEach((data) => {
        //   if (data.operator_emp_id) operatorIds.add(data.operator_emp_id);
        // });
        // Handle new schema with inspection_rep
        if (report.inspection_rep && Array.isArray(report.inspection_rep)) {
          report.inspection_rep.forEach(repItem => {
            if (repItem.emp_id) qcIds.add(repItem.emp_id); // QC ID from inspection_rep
            repItem.inlineData?.forEach((data) => {
              if (data.operator_emp_id) operatorIds.add(data.operator_emp_id);
            });
          });
        } else if (report.inlineData && Array.isArray(report.inlineData)) {
          // Handle old schema (legacy)
          if (report.emp_id) qcIds.add(report.emp_id); // QC ID from top-level report
          report.inlineData.forEach((data) => {
            if (data.operator_emp_id) operatorIds.add(data.operator_emp_id);
          });
        }
      });

      setUniqueQcIds(Array.from(qcIds).sort());
      setUniqueOperatorIds(Array.from(operatorIds).sort());
      setUniqueLineNos(
        Array.from(lineNos).sort((a, b) =>
          String(a).localeCompare(String(b), undefined, { numeric: true })
        )
      );
      setUniqueMoNos(Array.from(moNos).sort());
    } else {
      setUniqueQcIds([]);
      setUniqueOperatorIds([]);
      setUniqueLineNos([]);
      setUniqueMoNos([]);
    }
  }, []);

  const fetchReports = useCallback(
    async (currentFilters) => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (currentFilters.date)
          queryParams.append("inspection_date", currentFilters.date);
        if (currentFilters.qcId) queryParams.append("qcId", currentFilters.qcId);
        if (currentFilters.operatorId)
          queryParams.append("operatorId", currentFilters.operatorId);
        if (currentFilters.lineNo)
          queryParams.append("lineNo", currentFilters.lineNo);
        if (currentFilters.moNo) queryParams.append("moNo", currentFilters.moNo);

        let endpoint = `${API_BASE_URL}/api/qc-inline-roving-reports`;
        if (queryParams.toString()) {
          endpoint = `${API_BASE_URL}/api/qc-inline-roving-reports/filtered?${queryParams.toString()}`;
        }

        const response = await axios.get(endpoint);
        const rawReportsFromApi = response.data || [];

        populateUniqueFilterOptions(rawReportsFromApi);

        // let reportsForDisplay = rawReportsFromApi;

        // if (currentFilters.operatorId) {
          // reportsForDisplay = rawReportsFromApi
            // .map((report) => {
              // const filteredInlineData =
              //   report.inlineData?.filter(
              //     (inlineEntry) =>
              //       String(inlineEntry.operator_emp_id) ===
              //       String(currentFilters.operatorId)
              //   ) || [];

              // return { ...report, inlineData: filteredInlineData };
              // Transform data: Group by operator, then by repetition
        const processedData = rawReportsFromApi.flatMap((report) => {
          const operatorInspectionsMap = new Map();

          const processInlineData = (inlineDataArray, repNameForLegacy = null, topLevelEmpIdForLegacy = null) => {
            inlineDataArray?.forEach((operatorData) => {
              const operatorKey = `${operatorData.operator_emp_id}_${operatorData.tg_no}`;
              const currentRepName = repNameForLegacy || (operatorData.inspection_rep_name || "Unknown Rep"); // Fallback if rep name is directly on operatorData

              if (!operatorInspectionsMap.has(operatorKey)) {
                operatorInspectionsMap.set(operatorKey, {
                  reportTopLevel: report,
                  operator_emp_id: operatorData.operator_emp_id,
                  operator_eng_name: operatorData.operator_eng_name,
                  operator_kh_name: operatorData.operator_kh_name,
                  operation_ch_name: operatorData.operation_ch_name,
                  operation_kh_name: operatorData.operation_kh_name,
                  ma_code: operatorData.ma_code,
                  tg_no: operatorData.tg_no,
                  inspectionsByRep: {}
                });
              }
              const existingEntry = operatorInspectionsMap.get(operatorKey);
              
              // For new schema, repLevelData comes from repItem. For legacy, mock it or use report level.
              const repLevelDataForThisRep = repNameForLegacy 
                ? { emp_id: topLevelEmpIdForLegacy || report.emp_id, inspection_rep_name: repNameForLegacy } 
                : (operatorData.repLevelData || { emp_id: report.emp_id, inspection_rep_name: currentRepName }); // Assuming repLevelData might be nested if not legacy

              existingEntry.inspectionsByRep[currentRepName] = {
                operatorLevelData: operatorData,
                repLevelData: repLevelDataForThisRep
              };
            });
          };

          if (report.inspection_rep && Array.isArray(report.inspection_rep)) {
            report.inspection_rep.forEach(repItem => {
              // Pass repItem itself as repLevelData to be associated with each operatorData under it
              const augmentedInlineData = repItem.inlineData?.map(opData => ({...opData, repLevelData: repItem, inspection_rep_name: repItem.inspection_rep_name }));
              processInlineData(augmentedInlineData);
            });
          } else if (report.inlineData && Array.isArray(report.inlineData)) { // Legacy
            processInlineData(report.inlineData, "1st Inspection", report.emp_id); // Assume legacy is "1st Inspection"
          }
          return Array.from(operatorInspectionsMap.values());
        });

        let reportsForDisplay = processedData;

        if (currentFilters.operatorId) { // Filter based on the primary operator_emp_id
          reportsForDisplay = processedData.filter(
            (opSummary) => String(opSummary.operator_emp_id) === String(currentFilters.operatorId)
          );
        }

        // If QC ID filter is applied, ensure the operator has an inspection by that QC
        if (currentFilters.qcId) {
          reportsForDisplay = reportsForDisplay.filter(opSummary => {
            return Object.values(opSummary.inspectionsByRep).some(
              inspection => inspection.repLevelData?.emp_id === currentFilters.qcId
            );
          });
        }

        setReports(reportsForDisplay);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch reports.",
        });

        setReports([]);
        populateUniqueFilterOptions([]); // Pass empty array to clear options on error
      } finally {
        setIsLoading(false);
      }
    },
    [populateUniqueFilterOptions] // populateUniqueFilterOptions is stable due to useCallback
  );

  useEffect(() => {
    fetchReports(filters);
  }, [filters, refreshTrigger, fetchReports]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const showDetailsOnTap = (tooltipText) => {
    Swal.fire({
      title: "Inspection Details",
      html: `<pre style="text-align: left; white-space: pre-wrap; font-size: 0.8rem;">${tooltipText}</pre>`,
      confirmButtonText: "Close",
      customClass: {
        popup: "roving-data-swal-popup",
      },
    });
  };

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
            <li>
              <span className="text-green-600 font-bold text-lg">✓</span> : Pass
            </li>
            <li>
              <span className="text-red-600 font-bold text-lg">✗</span> : Fail /
              Reject
            </li>
            <li>
              <span className="font-semibold">SPI</span> : Stitches Per Inch
            </li>
            <li>
              <span className="font-semibold">Meas.</span> : Measurement
            </li>
             <li>
              <span className="font-semibold">Chk'd/Def</span> : Quantity Checked
              / Total Defects for Operator for that specific inspection event.
            </li>
          </ul>
          <ul className="list-disc list-inside space-y-1 flex-1 min-w-[250px] mt-2 md:mt-0">
           <li className="mt-2 font-semibold">Cell Background Colors (SPI, Meas., Chk'd/Def):</li>
            <ul className="list-disc list-inside ml-4">
              <li>
                <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 mr-1 align-middle"></span>
                <span className="font-semibold align-middle">
                  Green
                </span>{" "}
                : Overall Roving Status is 'Pass'.
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-300 mr-1 align-middle"></span>
                <span className="font-semibold align-middle">
                  Yellow
                </span>{" "}
                : Overall Roving Status is 'Reject' (due to SPI/Meas), 'Reject-Major' (single), or 'Reject-Minor' (single).
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 mr-1 align-middle"></span>
                <span className="font-semibold align-middle">
                  Red
                </span>{" "}
                : Overall Roving Status is 'Reject-Critical', 'Reject-Major-' (multiple), or 'Reject-Minor' (multiple - *see note below*).
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-gray-200 border border-gray-400 mr-1 align-middle"></span>
                <span className="font-semibold align-middle">
                  Gray
                </span>{" "}
                : Overall Roving Status is 'Pending', 'Unknown', or not determined.
              </li>
            </ul>
            <li className="mt-1 text-xs text-gray-500">(*Note: 'Reject-Minor' for multiple defects should ideally be red, but current data might show yellow. See console warning for details.)</li>
          </ul>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-10 text-gray-500">Loading reports...</div>
      ) : (
        <div className="overflow-x-auto relative max-h-[70vh]">
          {reports.length === 0 ? (
            <div className="text-center p-10 text-gray-500">
              No reports found matching your criteria.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-200 sticky top-0 z-10 shadow-md">
                <tr>
                  <th
                    rowSpan="3"
                    className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500 align-middle"
                  >
                    Operator ID
                  </th>
                  <th
                    rowSpan="3"
                    className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500 align-middle"
                  >
                    Operation
                  </th>
                  <th
                    rowSpan="3"
                    className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500 align-middle"
                  >
                    Machine Code
                  </th>
                  <th
                    colSpan={REPETITION_KEYS.length * 3}
                    className="px-2 py-1 text-center text-sm font-medium text-gray-700 border border-gray-500"
                  >
                    Inspection Data
                  </th>
                </tr>
                <tr>
                  {REPETITION_KEYS.map((repKey) => (
                    <th
                      key={repKey}
                      colSpan="3"
                      className="px-2 py-1 text-center text-xs font-medium text-gray-700 border border-gray-500"
                    >
                      {repKey}
                    </th>
                  ))}
                </tr>
                <tr>
                  {REPETITION_KEYS.flatMap((repKey) => ( 
                    <React.Fragment key={`subgroup-header-${repKey}`}>
                      <th className="px-1 py-1 text-left text-xs font-medium text-gray-700 border border-gray-500 whitespace-nowrap">
                        SPI
                      </th>
                      <th className="px-1 py-1 text-left text-xs font-medium text-gray-700 border border-gray-500 whitespace-nowrap">
                        Meas.
                      </th>
                      <th className="px-1 py-1 text-left text-xs font-medium text-gray-700 border border-gray-500 whitespace-nowrap">
                        Chk'd/Def
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((operatorSummary, index) => {
                  const allRepInspectionCells = [];

                  REPETITION_KEYS.forEach((repKey) => {
                    const inspectionEvent = operatorSummary.inspectionsByRep[repKey];

                    if (inspectionEvent) {
                      const { operatorLevelData, repLevelData } = inspectionEvent;
                      const totalDefectsForThisRep = operatorLevelData.rejectGarments?.[0]?.totalCount || 0;
                      
                      const spiDisplay = operatorLevelData.spi || "N/A";
                      const measDisplay = operatorLevelData.measurement || "N/A";
                      const chkdDefDisplay = `${operatorLevelData.checked_quantity}/${totalDefectsForThisRep}`;
                      
                      // New function to determine cell background based on overall_roving_status
                      const getCellBackgroundColorForOverallStatus = (overallStatusKey) => {
                        if (!overallStatusKey) return "bg-gray-200 hover:bg-gray-300";

                        switch (overallStatusKey) {
                          case 'Pending':
                          case 'Unknown':
                            return "bg-gray-200 hover:bg-gray-300";
                          case 'Reject-Critical':
                          case 'Reject-Major-': // This is for >=2 Major, RovingPage colors it red
                            return "bg-red-100 hover:bg-red-200";
                          case 'Reject': // This is for SPI/Meas reject, RovingPage colors it yellow
                          case 'Reject-Major': // This is for 1 Major, RovingPage colors it yellow
                            return "bg-yellow-100 hover:bg-yellow-200";
                          case 'Reject-Minor':
                            // AMBIGUOUS: In RovingPage.jsx, 'Reject-Minor' is generated for:
                            // 1. >=2 Minor defects (colored RED in RovingPage)
                            // 2. 1 Minor defect (colored YELLOW in RovingPage)
                            // Without a change in RovingPage.jsx to send distinct keys,
                            // we default to yellow here. For correct coloring, RovingPage.jsx
                            // should send distinct status keys (e.g., 'Reject-Minor-Multiple' and 'Reject-Minor-Single').
                            console.warn("Ambiguous 'Reject-Minor' status received. Defaulting to yellow. RovingPage.jsx should be updated to send distinct status keys for accurate coloring.");
                            return "bg-yellow-100 hover:bg-yellow-200"; 
                          case 'Pass':
                            return "bg-green-100 hover:bg-green-200";
                          default:
                            console.warn(`Unknown overall_roving_status for color coding: ${overallStatusKey}. Defaulting to gray.`);
                            return "bg-gray-200 hover:bg-gray-300";
                        }
                      };

                      const renderResultSymbol = (status) => {
                        if (status === "Pass") return <span className="text-green-600 font-bold text-lg">✓</span>;
                        if (status === "Fail" || status === "Reject") return <span className="text-red-600 font-bold text-lg">✗</span>;
                        return <span className="text-gray-500">N/A</span>;
                      };

                      const constructTooltipText = (
                        currentReportDetails,
                        currentRepItemDetails,
                        currentOperatorInspectionData,
                        currentTotalDefectsForOp
                      ) => {
                        let defectsString = "Defects Found: None";
                        const defectsList = [];
                        if (
                          currentOperatorInspectionData.rejectGarments &&
                          currentOperatorInspectionData.rejectGarments.length > 0 &&
                          currentOperatorInspectionData.rejectGarments[0].garments
                        ) {
                          currentOperatorInspectionData.rejectGarments[0].garments.forEach(
                            (garment) => {
                              garment.defects.forEach((defect) => {
                                defectsList.push(
                                  `  - ${defect.name} (Qty: ${defect.count}, Op.ID: ${defect.operationId || "N/A"})`
                                );
                              });
                            }
                          );
                        }
                        if (defectsList.length > 0) {
                          defectsString = "Defects Found:\n" + defectsList.join("\n");
                        }
                        const qcId = currentRepItemDetails?.emp_id || currentReportDetails?.emp_id || "N/A";
                        const qcRepName = currentRepItemDetails?.inspection_rep_name || "N/A";

                        return `Inspection Details:
                        Date: ${currentReportDetails.inspection_date || "N/A"}
                        QC ID: ${qcId}
                        Inspection Rep: ${qcRepName}
                        Line No: ${currentReportDetails.line_no || "N/A"}
                        MO No: ${currentReportDetails.mo_no || "N/A"}
                        ------------------------------
                        Operator ID: ${currentOperatorInspectionData.operator_emp_id || "N/A"}
                        Operator Name: ${currentOperatorInspectionData.operator_kh_name || currentOperatorInspectionData.operator_eng_name || "N/A"}
                        Operation: ${currentOperatorInspectionData.operation_kh_name || currentOperatorInspectionData.operation_ch_name || "N/A"}
                        Machine Code: ${currentOperatorInspectionData.ma_code || "N/A"}
                        ------------------------------
                        Type: ${currentOperatorInspectionData.type || "N/A"} 
                        Checked Qty: ${currentOperatorInspectionData.checked_quantity || "N/A"}
                        SPI: ${currentOperatorInspectionData.spi || "N/A"} 
                        Meas: ${currentOperatorInspectionData.measurement || "N/A"} 
                        Total Defects (Op): ${currentTotalDefectsForOp}
                        Overall Result (Op): ${currentOperatorInspectionData.qualityStatus || "N/A"}
                        Overall Roving Status: ${currentOperatorInspectionData.overall_roving_status || "N/A"}
                        ------------------------------
                        ${defectsString}`;
                      };

                      const tooltipTitle = constructTooltipText(
                        operatorSummary.reportTopLevel,
                        repLevelData,
                        operatorLevelData,
                        totalDefectsForThisRep
                      );

                       const overallStatusForEvent = operatorLevelData.overall_roving_status;
                      const repetitionCellBgClass = getCellBackgroundColorForOverallStatus(overallStatusForEvent);

                      allRepInspectionCells.push(
                        <td key={`spi-${repKey}`} title={tooltipTitle} onClick={() => showDetailsOnTap(tooltipTitle)}
                           className={`px-1 py-1 text-xs text-gray-700 border border-gray-300 ${repetitionCellBgClass} transition-colors duration-150 text-center cursor-pointer`}>
                          {renderResultSymbol(spiDisplay)}
                        </td>,
                        <td key={`meas-${repKey}`} title={tooltipTitle} onClick={() => showDetailsOnTap(tooltipTitle)}
                           className={`px-1 py-1 text-xs text-gray-700 border border-gray-300 ${repetitionCellBgClass} transition-colors duration-150 text-center cursor-pointer`}>
                          {renderResultSymbol(measDisplay)}
                        </td>,
                        <td key={`chkdef-${repKey}`} title={tooltipTitle} onClick={() => showDetailsOnTap(tooltipTitle)}
                            className={`px-1 py-1 text-xs text-gray-700 border border-gray-300 ${repetitionCellBgClass} transition-colors duration-150 cursor-pointer text-center`}>
                          {chkdDefDisplay}
                        </td>
                      );
                    } else {
                      // Render 3 empty cells if no data for this repetition
                      allRepInspectionCells.push(
                        <td key={`empty-spi-${repKey}`} className="px-1 py-1 text-xs text-gray-400 border border-gray-300 text-center">-</td>,
                        <td key={`empty-meas-${repKey}`} className="px-1 py-1 text-xs text-gray-400 border border-gray-300 text-center">-</td>,
                        <td key={`empty-chkdef-${repKey}`} className="px-1 py-1 text-xs text-gray-400 border border-gray-300 text-center">-</td>
                      );
                    }
                  });

                  return (
                    <tr key={`${operatorSummary.operator_emp_id}-${operatorSummary.tg_no}-${index}`} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-2 py-1 text-xs text-gray-700 border border-gray-300">
                        {operatorSummary.operator_emp_id || "N/A"}
                      </td>
                      <td className="px-2 py-1 text-xs text-gray-700 border border-gray-300">
                        {operatorSummary.operation_kh_name || operatorSummary.operation_ch_name || "N/A"}
                      </td>
                      <td className="px-2 py-1 text-xs text-gray-700 border border-gray-300">
                        {operatorSummary.ma_code || "N/A"}
                      </td>
                      {allRepInspectionCells}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default RovingData;