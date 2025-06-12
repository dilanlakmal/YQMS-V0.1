import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import Swal from "sweetalert2";
import RovingFilterPlane from "./RovingDataFilterPane";
import { useAuth } from "../../authentication/AuthContext";

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

const WorkerAttendance = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const authUserEmpId = user?.emp_id;
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});
  const [editingCell, setEditingCell] = useState(null);

  const [filters, setFilters] = useState({
    date: getTodayDateString(),
    qcId: authUserEmpId ? String(authUserEmpId) : "",
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

      // Add authUserEmpId to the set if it exists, ensuring it's always an option
      if (authUserEmpId) {
        qcIds.add(String(authUserEmpId));
      }

      sourceReports.forEach((report) => {
        if (report.line_no) lineNos.add(report.line_no);
        if (report.mo_no) moNos.add(report.mo_no);
        
        if (report.inspection_rep && Array.isArray(report.inspection_rep)) {
          report.inspection_rep.forEach(repItem => {
            if (repItem.emp_id) qcIds.add(String(repItem.emp_id));
            repItem.inlineData?.forEach((data) => {
              if (data.operator_emp_id) operatorIds.add(String(data.operator_emp_id));
            });
          });
        } else if (report.inlineData && Array.isArray(report.inlineData)) {
          if (report.emp_id) qcIds.add(String(report.emp_id));
          report.inlineData.forEach((data) => {
            if (data.operator_emp_id) operatorIds.add(String(data.operator_emp_id));
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
      setUniqueQcIds(authUserEmpId ? [String(authUserEmpId)] : []);
      setUniqueOperatorIds([]);
      setUniqueLineNos([]);
      setUniqueMoNos([]);
    }
  }, [authUserEmpId]);

  const fetchReports = useCallback(
    async (currentFilters) => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (currentFilters.date)
          queryParams.append("inspection_date", currentFilters.date);
        
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

        // Fetch worker attendance data if it exists
        try {
          const attendanceResponse = await axios.get(`${API_BASE_URL}/api/roving-worker-attendance`, {
            params: {
              date: currentFilters.date,
              lineNo: currentFilters.lineNo,
              moNo: currentFilters.moNo
            }
          });
          
          // Convert attendance data to a map for easy lookup
          const attendanceMap = {};
          if (attendanceResponse.data && attendanceResponse.data.length > 0) {
            attendanceResponse.data.forEach(item => {
              const key = `${item.operator_emp_id}_${item.inspection_rep_name}`;
              attendanceMap[key] = item.status || "✓";
            });
          }
          setAttendanceData(attendanceMap);
        } catch (error) {
          console.error("Error fetching attendance data:", error);
          // Continue with empty attendance data
          setAttendanceData({});
        }

        const processedData = rawReportsFromApi.flatMap((report) => {
          const operatorInspectionsMap = new Map();

          const processInlineData = (inlineDataArray, repNameForLegacy = null, topLevelEmpIdForLegacy = null) => {
            inlineDataArray?.forEach((operatorData) => {
              const operatorKey = `${operatorData.operator_emp_id}`;
              const currentRepName = repNameForLegacy || (operatorData.inspection_rep_name || "Unknown Rep");

              if (!operatorInspectionsMap.has(operatorKey)) {
                operatorInspectionsMap.set(operatorKey, {
                  reportTopLevel: report,
                  operator_emp_id: operatorData.operator_emp_id,
                  operator_eng_name: operatorData.operator_eng_name,
                  operator_kh_name: operatorData.operator_kh_name,
                  inspectionsByRep: {}
                });
              }
              const existingEntry = operatorInspectionsMap.get(operatorKey);
              
              const repLevelDataForThisRep = repNameForLegacy 
                ? { emp_id: topLevelEmpIdForLegacy || report.emp_id, inspection_rep_name: repNameForLegacy } 
                : (operatorData.repLevelData || { emp_id: report.emp_id, inspection_rep_name: currentRepName });

              existingEntry.inspectionsByRep[currentRepName] = {
                operatorLevelData: operatorData,
                repLevelData: repLevelDataForThisRep,
                inspection_time: operatorData.inspection_time || "N/A"
              };
            });
          };

          if (report.inspection_rep && Array.isArray(report.inspection_rep)) {
            report.inspection_rep.forEach(repItem => {
              const augmentedInlineData = repItem.inlineData?.map(opData => ({
                ...opData, 
                repLevelData: repItem, 
                inspection_rep_name: repItem.inspection_rep_name
              }));
              processInlineData(augmentedInlineData);
            });
          } else if (report.inlineData && Array.isArray(report.inlineData)) {
            processInlineData(report.inlineData, "1st Inspection", report.emp_id);
          }
          return Array.from(operatorInspectionsMap.values());
        });

        let reportsForDisplay = processedData;

        if (currentFilters.operatorId) {
          reportsForDisplay = processedData.filter(
            (opSummary) => String(opSummary.operator_emp_id) === String(currentFilters.operatorId)
          );
        }

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
        populateUniqueFilterOptions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [populateUniqueFilterOptions]
  );

  useEffect(() => {
    fetchReports(filters);
  }, [filters, refreshTrigger, fetchReports]);

  useEffect(() => {
    setFilters(currentFilters => {
      const newQcIdFromAuth = authUserEmpId ? String(authUserEmpId) : "";
      if (currentFilters.qcId !== newQcIdFromAuth) {
        return { ...currentFilters, qcId: newQcIdFromAuth };
      }
      return currentFilters;
    });
  }, [authUserEmpId]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleCellClick = (operatorId, repName) => {
   // Find the operator summary and then the inspection event
    const operatorSummary = reports.find(op => op.operator_emp_id === operatorId);
    const inspectionEvent = operatorSummary?.inspectionsByRep[repName];

    if (!inspectionEvent) { // Only allow editing if no inspection event
      setEditingCell({ operatorId, repName });
    }
  };

  const handleCellBlur = async () => {
    if (editingCell) {
      const operatorSummary = reports.find(op => op.operator_emp_id === editingCell.operatorId);
      let lineNoForSave = filters.lineNo;
      let moNoForSave = filters.moNo;

      if (operatorSummary && operatorSummary.reportTopLevel) {
        lineNoForSave = operatorSummary.reportTopLevel.line_no || filters.lineNo;
        moNoForSave = operatorSummary.reportTopLevel.mo_no || filters.moNo;
      } else {
        console.warn("Could not find operator summary or reportTopLevel for editing cell, using global filters for line/MO", editingCell);
      }

      const attendanceValueToSave = attendanceData[`${editingCell.operatorId}_${editingCell.repName}`];
      try {
        // Save the attendance data to the server
        await axios.post(`${API_BASE_URL}/api/roving-worker-attendance`, {
          date: filters.date,
          lineNo: lineNoForSave,
          moNo: moNoForSave,
          operator_emp_id: editingCell.operatorId,
          inspection_rep_name: editingCell.repName,
          status: attendanceData[`${editingCell.operatorId}_${editingCell.repName}`] || "AB"
        });
      } catch (error) {
        console.error("Error saving attendance data:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to save attendance data.",
        });
      }
      setEditingCell(null);
    }
  };

  const handleCellChange = (operatorId, repName, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [`${operatorId}_${repName}`]: value
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCellBlur();
    }
  };

  const getAttendanceStatus = (operatorId, repName) => {
    return attendanceData[`${operatorId}_${repName}`] || "";
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
              <span className="text-green-600 font-bold text-lg">✓</span> : Present
            </li>
            <li>
              <span className="text-red-600 font-bold text-lg">AB</span> : Absent
            </li>
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
                    rowSpan="2"
                    className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500 align-middle"
                  >
                    Worker ID
                  </th>
                  <th
                    rowSpan="2"
                    className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500 align-middle"
                  >
                    Worker Name
                  </th>
                  {REPETITION_KEYS.map((repKey) => (
                    <th
                      key={repKey}
                      className="px-2 py-1 text-center text-xs font-medium text-gray-700 border border-gray-500"
                    >
                      {repKey}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((operatorSummary, index) => {
                  const operatorId = operatorSummary.operator_emp_id || `unknown-op-${index}`;
                  const attendanceCells = REPETITION_KEYS.map((repKey) => {
                    const inspectionEvent = operatorSummary.inspectionsByRep[repKey];
                    const attendanceStatusFromDb = getAttendanceStatus(operatorId, repKey); 

                    const isEditing = editingCell && 
                                    editingCell.operatorId === operatorId && 
                                     editingCell.repName === repKey;
                    
                    if (inspectionEvent) {
                      // If there's inspection data, show the inspection time and mark as present
                      return (
                        <td 
                           key={`attendance-${operatorId}-${repKey}-inspected`}
                          className="px-2 py-1 text-xs text-gray-700 border border-gray-300 text-center bg-green-100"
                        >
                          ✓
                        </td>
                      );
                    } else {
                      // If no inspection data, show editable cell
                      return (
                        <td 
                          key={`attendance-${operatorId}-${repKey}-manual`}
                          className={`px-2 py-1 text-xs text-gray-700 border border-gray-300 text-center ${
                            attendanceStatusFromDb === "AB" ? "bg-red-100" : (attendanceStatusFromDb === "✓" ? "bg-green-100" : "")
                          } cursor-pointer hover:bg-gray-100`}
                          onClick={() => handleCellClick(operatorId, repKey)}
                        >
                          {isEditing ? (
                            <select
                              value={attendanceStatusFromDb || ""}
                              onChange={(e) => handleCellChange(operatorId, repKey, e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={handleKeyDown}
                              autoFocus
                              className="w-full text-center bg-transparent border-none focus:outline-none"
                            >
                              <option value="">-</option>
                              <option value="✓">✓</option>
                              <option value="AB">AB</option>
                            </select>
                          ) : (
                            attendanceStatusFromDb || "-"
                          )}
                        </td>
                      );}
                  });

                  return (
                     <tr key={operatorId} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-2 py-1 text-xs text-gray-700 border border-gray-300">
                        {operatorId === `unknown-op-${index}` ? "N/A" : operatorId}
                      </td>
                      <td className="px-2 py-1 text-xs text-gray-700 border border-gray-300">
                        {operatorSummary.operator_kh_name || operatorSummary.operator_eng_name || "N/A"}
                      </td>
                      {attendanceCells}
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

export default WorkerAttendance;