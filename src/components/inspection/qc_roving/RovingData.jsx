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
      {isLoading ? (
        <div className="text-center p-10 text-gray-500">Loading reports...</div>
      ) : (
        <div className="overflow-x-auto">
          {reports.length === 0 ? (
            <div className="text-center p-10 text-gray-500">No reports found matching your criteria.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Date</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">QC ID</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">QC Name</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Line No</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">MO No</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Operator ID</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Type</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Checked Qty</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Operation</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Machine Code</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">SPI Status</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Measurement Status</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Quality Status</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Inspection Time</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Total Defects</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Defect Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) =>
                  report.inlineData?.map((data, index) => (
                    <tr key={`${report.inline_roving_id}-${index}`}>
                      <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{report.inspection_date}</td>
                      <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{report.emp_id}</td>
                      <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{report.eng_name}</td>
                      <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{report.line_no}</td>
                      <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{report.mo_no}</td>
                      <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{data.operator_emp_id || "N/A"}</td>
                      <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{data.type || "N/A"}</td>
                      <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{data.checked_quantity || "N/A"}</td>
                      <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{data.operation_kh_name || data.operation_ch_name || "N/A"}</td>
                      <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{data.ma_code || "N/A"}</td>
                      <td className={`px-2 py-1 text-sm border border-gray-200 ${data.spi === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-600"}`}>{data.spi || "N/A"}</td>
                      <td className={`px-2 py-1 text-sm border border-gray-200 ${data.measurement === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-600"}`}>{data.measurement || "N/A"}</td>
                      <td className={`px-2 py-1 text-sm border border-gray-200 ${data.qualityStatus === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-600"}`}>{data.qualityStatus || "N/A"}</td>
                      <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{data.inspection_time || "N/A"}</td>
                      <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{data.rejectGarments && data.rejectGarments.length > 0 ? data.rejectGarments[0]?.totalCount || 0 : 0}</td>
                      <td className="px-2 py-1 text-xs text-gray-700 border border-gray-200">
                        {data.rejectGarments && data.rejectGarments.length > 0
                          ? data.rejectGarments[0]?.garments.map((garment, gIndex) => (
                              <div key={gIndex}>
                                <ul>
                                    {garment.defects.map((defect, dIndex) => (
                                    <li key={dIndex}>
                                      {defect.name} : {defect.count}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))
                          : "No Defects"}
                      </td>
                    </tr>
                  ))
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

