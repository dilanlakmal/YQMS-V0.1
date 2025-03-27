import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config"; // Adjust the path as needed
import Swal from "sweetalert2";

const RovingData = ({ refreshTrigger }) => {
  const [reports, setReports] = useState([]);

  // Fetch reports when the component mounts or when refreshTrigger changes
  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]);

  const fetchReports = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc-inline-roving-reports`
      );
      setReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch reports."
      });
    }
  };

  return (
    <div className="mt-4">
      {/* Wrap the table in a div with overflow-x-auto to enable horizontal scrolling */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Date
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                QC ID
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                QC Name
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Line No
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                MO No
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Operator ID
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Type
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Checked Qty
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Operation
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Machine Code
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                SPI Status
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Measurement Status
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Quality Status
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Inspection Time
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Total Defects
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Defect Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report) =>
              report.inlineData.map((data, index) => (
                <tr key={`${report.inline_roving_id}-${index}`}>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {report.inspection_date}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {report.emp_id}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {report.eng_name}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {report.line_no}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {report.mo_no}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {data.operator_emp_id || "N/A"}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {data.type || "N/A"}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {data.checked_quantity || "N/A"}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {data.operation_kh_name || data.operation_ch_name || "N/A"}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {data.ma_code || "N/A"}
                  </td>
                  <td
                    className={`px-2 py-1 text-sm border border-gray-200 ${
                      data.spi === "Pass"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {data.spi || "N/A"}
                  </td>
                  <td
                    className={`px-2 py-1 text-sm border border-gray-200 ${
                      data.measurement === "Pass"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {data.measurement || "N/A"}
                  </td>
                  <td
                    className={`px-2 py-1 text-sm border border-gray-200 ${
                      data.qualityStatus === "Pass"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {data.qualityStatus || "N/A"}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {data.inspection_time || "N/A"}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {data.rejectGarments && data.rejectGarments.length > 0
                      ? data.rejectGarments[0].totalCount || 0
                      : 0}
                  </td>
                  <td className="px-2 py-1 text-xs text-gray-700 border border-gray-200">
                    {data.rejectGarments && data.rejectGarments.length > 0
                      ? data.rejectGarments[0].garments.map(
                          (garment, gIndex) => (
                            <div key={gIndex}>
                              <ul>
                                {garment.defects.map((defect, dIndex) => (
                                  <li key={dIndex}>
                                    {defect.name} : {defect.count}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        )
                      : "No Defects"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RovingData;
