import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Loader2,
  FileText,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

const ReportResultTable = ({
  startDate,
  endDate,
  reportType,
  buyer,
  qaFilter,
  orderFilter,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!startDate || !endDate) return;
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-dashboard/report-results`,
          {
            params: {
              startDate,
              endDate,
              reportType,
              buyer,
              qaFilter,
              orderFilter,
            },
          },
        );
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching report results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [startDate, endDate, reportType, buyer, qaFilter, orderFilter]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white text-lg">
              Report Results Summary
            </h3>
            <p className="text-xs text-gray-500">
              Pass/Fail analysis by inspection method
            </p>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-0">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
            <p className="text-sm">Calculating Results...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-300">
            <AlertTriangle className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">No reports found for this selection</p>
          </div>
        ) : (
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 font-bold uppercase sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                  Report Name
                </th>
                <th className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-700 w-24">
                  Method
                </th>
                <th className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-700 w-20">
                  Reports
                </th>
                <th className="px-4 py-3 text-right border-r border-gray-200 dark:border-gray-700 w-24">
                  Sample
                </th>

                {/* Defect Section */}
                <th className="px-2 py-3 text-center bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-r border-white dark:border-gray-700 w-16">
                  Minor
                </th>
                <th className="px-2 py-3 text-center bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-r border-white dark:border-gray-700 w-16">
                  Major
                </th>
                <th className="px-2 py-3 text-center bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-r border-gray-200 dark:border-gray-700 w-16">
                  Crit
                </th>

                <th className="px-4 py-3 text-right border-r border-gray-200 dark:border-gray-700 w-20">
                  Total Def.
                </th>
                <th className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-700 w-24">
                  Defect %
                </th>

                <th className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/10 w-20">
                  Pass
                </th>
                <th className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-700 bg-rose-50 dark:bg-rose-900/10 w-20">
                  Fail
                </th>
                <th className="px-4 py-3 text-center w-24">Pass Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-200 border-r border-gray-100 dark:border-gray-700">
                    {row.reportType}
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-100 dark:border-gray-700">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        row.inspectionMethod === "AQL"
                          ? "bg-purple-100 text-purple-700 border-purple-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {row.inspectionMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700">
                    {row.totalReports}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-gray-700">
                    {row.totalSample.toLocaleString()}
                  </td>

                  {/* Defect Columns */}
                  <td className="px-2 py-3 text-center bg-green-50/50 dark:bg-green-900/10 text-green-700 dark:text-green-400 font-bold border-r border-white dark:border-gray-700">
                    {row.minor}
                  </td>
                  <td className="px-2 py-3 text-center bg-orange-50/50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400 font-bold border-r border-white dark:border-gray-700">
                    {row.major}
                  </td>
                  <td className="px-2 py-3 text-center bg-red-50/50 dark:bg-red-900/10 text-red-700 dark:text-red-400 font-bold border-r border-gray-100 dark:border-gray-700">
                    {row.critical}
                  </td>

                  <td className="px-4 py-3 text-right font-bold text-gray-800 dark:text-white border-r border-gray-100 dark:border-gray-700">
                    {row.totalDefects}
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-100 dark:border-gray-700">
                    <span className="font-mono font-medium">
                      {row.defectRate}%
                    </span>
                  </td>

                  {/* Results */}
                  <td className="px-4 py-3 text-center bg-emerald-50/30 dark:bg-emerald-900/10 border-r border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-center gap-1 font-bold text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" /> {row.passCount}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center bg-rose-50/30 dark:bg-rose-900/10 border-r border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-center gap-1 font-bold text-rose-600">
                      {row.failCount > 0 ? (
                        <XCircle className="w-3 h-3" />
                      ) : null}
                      {row.failCount}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-xs font-black ${parseFloat(row.passRate) >= 90 ? "text-green-600" : parseFloat(row.passRate) >= 80 ? "text-orange-500" : "text-red-500"}`}
                      >
                        {row.passRate}%
                      </span>
                      <div className="w-12 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full ${parseFloat(row.passRate) >= 90 ? "bg-green-500" : parseFloat(row.passRate) >= 80 ? "bg-orange-500" : "bg-red-500"}`}
                          style={{ width: `${row.passRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ReportResultTable;
