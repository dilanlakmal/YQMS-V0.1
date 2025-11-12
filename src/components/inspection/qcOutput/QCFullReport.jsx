import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import {
  Loader2,
  AlertTriangle,
  Package,
  AlertCircle,
  BarChart,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { API_BASE_URL } from "../../../../config";

const QCFullReport = () => {
  const [searchParams] = useSearchParams();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topN, setTopN] = useState(3);
  const [openSections, setOpenSections] = useState({});

  const filters = useMemo(
    () => ({
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      reportType: searchParams.get("reportType"),
      qcId: searchParams.get("qcId")
    }),
    [searchParams]
  );

  const isQC2 = filters.reportType === "QC2";

  useEffect(() => {
    const fetchReport = async () => {
      if (!filters.qcId) {
        setError("QC ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/qc-output/full-report`,
          { params: filters }
        );
        setReportData(response.data);
      } catch (err) {
        setError("Failed to fetch full report.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [filters]);

  // --- Data Processing for Tables and Cards ---
  const processedData = useMemo(() => {
    if (!reportData?.reports) return { summaryTable: [], lineSummary: {} };

    // 1. Process for Summary Table
    const summaryMap = new Map();
    reportData.reports.forEach((report) => {
      report.Output_data.forEach((output) => {
        const key = `${output.Line_no}-${output.MONo}-${output.Color}-${output.Size}`;
        if (!summaryMap.has(key)) {
          summaryMap.set(key, { ...output, Defect_qty: 0, DefectDetails: [] });
        }
        const entry = summaryMap.get(key);
        entry.Qty += output.Qty;
      });
      report.Defect_data.forEach((defect) => {
        const key = `${defect.Line_no}-${defect.MONo}-${defect.Color}-${defect.Size}`;
        if (!summaryMap.has(key)) {
          // Should exist from output, but as a fallback
          summaryMap.set(key, { ...defect, Qty: 0 });
        }
        const entry = summaryMap.get(key);
        entry.Defect_qty = (entry.Defect_qty || 0) + defect.Defect_qty;
        entry.DefectDetails = (entry.DefectDetails || []).concat(
          defect.DefectDetails
        );
      });
    });
    const summaryTable = Array.from(summaryMap.values()).sort(
      (a, b) => b.Defect_qty - a.Defect_qty
    );

    // 2. Process for Line/MO Summary Cards
    const lineSummary = {};
    const groupKey = isQC2 ? "MONo" : "Line_no";

    reportData.reports.forEach((report) => {
      report.Output_data_summary.forEach((summary) => {
        const key = summary[groupKey];
        if (!lineSummary[key])
          lineSummary[key] = { totalOutput: 0, totalDefect: 0, defects: {} };
        lineSummary[key].totalOutput += summary.Qty;
      });
      report.Defect_data_summary.forEach((summary) => {
        const key = summary[groupKey];
        if (!lineSummary[key])
          lineSummary[key] = { totalOutput: 0, totalDefect: 0, defects: {} };
        lineSummary[key].totalDefect += summary.Defect_Qty;
        summary.Defect_Details.forEach((d) => {
          lineSummary[key].defects[d.Defect_name] =
            (lineSummary[key].defects[d.Defect_name] || 0) + d.Qty;
        });
      });
    });

    return { summaryTable, lineSummary };
  }, [reportData, isQC2]);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
      </div>
    );
  if (error)
    return (
      <div className="text-center text-red-500 p-8">
        <AlertTriangle className="mx-auto mb-2" />
        {error}
      </div>
    );
  if (!reportData)
    return (
      <div className="text-center text-gray-500 p-8">No data available.</div>
    );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h1 className="text-2xl font-bold">
            Full Report for {reportData.qcDetails.eng_name} ({filters.qcId})
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mt-2">
            <span>
              <strong>Date Range:</strong> {filters.startDate} to{" "}
              {filters.endDate}
            </span>
            <span>
              <strong>Report Type:</strong> {filters.reportType}
            </span>
          </div>
        </div>

        {/* Inspection Data Summary Table */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Inspection Data Summary
          </h2>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                <tr>
                  {!isQC2 && <th className="p-2 text-left">Line No</th>}
                  <th className="p-2 text-left">MO No</th>
                  <th className="p-2 text-left">Color</th>
                  <th className="p-2 text-left">Size</th>
                  <th className="p-2 text-center">Output Qty</th>
                  <th className="p-2 text-center">Defect Qty</th>
                  <th className="p-2 text-left">Defect Details</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-600">
                {processedData.summaryTable.map((row, index) => (
                  <tr key={index}>
                    {!isQC2 && <td className="p-2">{row.Line_no}</td>}
                    <td className="p-2 font-mono">{row.MONo}</td>
                    <td className="p-2">{row.Color}</td>
                    <td className="p-2">{row.Size}</td>
                    <td className="p-2 text-center">{row.Qty}</td>
                    <td className="p-2 text-center font-bold text-red-500">
                      {row.Defect_qty}
                    </td>
                    <td className="p-2">
                      <ul className="text-xs">
                        {row.DefectDetails.sort((a, b) => b.Qty - a.Qty).map(
                          (d) => (
                            <li
                              key={d.Defect_code}
                              className="flex justify-between"
                            >
                              <span>{d.Defect_name}</span>
                              <span className="font-semibold">x{d.Qty}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspection Summary By Line/MO */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Inspection Summary by {isQC2 ? "MO" : "Line"}
          </h2>
          <div className="space-y-4">
            {Object.entries(processedData.lineSummary).map(([key, data]) => {
              const topDefects = Object.entries(data.defects)
                .map(([name, qty]) => ({ name, qty }))
                .sort((a, b) => b.qty - a.qty);
              return (
                <div
                  key={key}
                  className="border dark:border-gray-700 rounded-lg"
                >
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50"
                  >
                    <h3 className="font-bold">
                      {isQC2 ? "MO: " : "Line: "}
                      {key}
                    </h3>
                    {openSections[key] ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  {openSections[key] && (
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <Package size={32} className="text-blue-500" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Total Output
                            </p>
                            <p className="text-2xl font-bold">
                              {data.totalOutput}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <AlertCircle size={32} className="text-red-500" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Total Defects
                            </p>
                            <p className="text-2xl font-bold">
                              {data.totalDefect}
                            </p>
                          </div>
                        </div>
                      </div>
                      <h4 className="font-semibold mb-2">Top {topN} Defects</h4>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700/50 text-xs">
                          <tr>
                            <th className="p-2 text-left">Defect Name</th>
                            <th className="p-2 text-right">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topDefects.slice(0, topN).map((d) => (
                            <tr key={d.name}>
                              <td className="p-1">{d.name}</td>
                              <td className="p-1 text-right font-semibold">
                                {d.qty}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QCFullReport;
