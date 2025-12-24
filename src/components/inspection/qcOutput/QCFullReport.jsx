import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import {
  Loader2,
  AlertTriangle,
  Package,
  AlertCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { API_BASE_URL } from "../../../../config";

// --- Helper Functions & Components ---

const formatDate = (dateString) =>
  new Date(dateString).toISOString().split("T")[0];

const getDefectRateColor = (rate) => {
  if (rate > 5)
    return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300";
  if (rate >= 3)
    return "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300";
  if (rate > 0)
    return "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300";
  return "bg-gray-100 dark:bg-gray-700/50";
};

const SubStatCard = ({ label, value }) => (
  <div className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg text-center">
    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
      {label}
    </p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

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
  const seqNo = isQC2 ? 54 : filters.reportType === "QC1-Inside" ? 39 : 38;

  // Custom sort for Line No: numbers first, then strings
  const customLineSort = (a, b) => {
    // Safely get the value to compare, from either 'Line_no' or 'key' property.
    // The '??' operator provides a fallback if the value is null or undefined.
    const lineA = a.Line_no ?? a.key ?? "";
    const lineB = b.Line_no ?? b.key ?? "";

    // Check if the values are numeric strings
    const isNumA = !isNaN(parseFloat(lineA)) && isFinite(lineA);
    const isNumB = !isNaN(parseFloat(lineB)) && isFinite(lineB);

    // Rule 1: Numbers should always come before strings
    if (isNumA && !isNumB) return -1;
    if (!isNumA && isNumB) return 1;

    // Rule 2: If both are numbers, sort them numerically
    if (isNumA && isNumB) {
      return Number(lineA) - Number(lineB);
    }

    // Rule 3: If both are strings, sort them alphabetically
    return String(lineA).localeCompare(String(lineB));
  };

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

  // --- Main Data Processing Hook ---
  const processedData = useMemo(() => {
    if (!reportData?.reports)
      return { summaryTable: [], dailyTrend: {}, lineSummary: {} };

    // Add a conditional block for QC2 processing ---
    let summaryTable;

    if (isQC2) {
      // --- QC2 LOGIC: Aggregate by Date and MONo from the summary arrays ---
      const qc2SummaryMap = new Map();
      reportData.reports.forEach((report) => {
        const date = formatDate(report.Inspection_date);

        (report.Output_data_summary || []).forEach((summary) => {
          // Use Date and MONo as the unique key
          const key = `${date}-${summary.MONo}`;
          if (!qc2SummaryMap.has(key)) {
            qc2SummaryMap.set(key, {
              date: date,
              MONo: summary.MONo,
              Qty: 0,
              Defect_qty: 0,
              DefectDetails: []
            });
          }
          qc2SummaryMap.get(key).Qty += summary.Qty;
        });

        (report.Defect_data_summary || []).forEach((summary) => {
          const key = `${date}-${summary.MONo}`;
          if (!qc2SummaryMap.has(key)) {
            // This case is unlikely if data is consistent, but good to have a fallback
            qc2SummaryMap.set(key, {
              date: date,
              MONo: summary.MONo,
              Qty: 0,
              Defect_qty: 0,
              DefectDetails: []
            });
          }
          const entry = qc2SummaryMap.get(key);
          entry.Defect_qty += summary.Defect_Qty;
          entry.DefectDetails = entry.DefectDetails.concat(
            summary.Defect_Details || []
          );
        });
      });

      summaryTable = Array.from(qc2SummaryMap.values());
      // Sort QC2 table by Date, then MONo
      summaryTable.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.MONo.localeCompare(b.MONo);
      });
    } else {
      // 1. Process for Inspection Data Summary Table
      const summaryMap = new Map();
      reportData.reports.forEach((report) => {
        const date = formatDate(report.Inspection_date);
        // Combine Output and Defect data into one structure
        const combinedData = new Map();

        (report.Output_data || []).forEach((output) => {
          const key = `${output.Line_no}-${output.MONo}-${output.Color}-${output.Size}`;
          combinedData.set(key, {
            ...output,
            date,
            Defect_qty: 0,
            DefectDetails: []
          });
        });

        (report.Defect_data || []).forEach((defect) => {
          const key = `${defect.Line_no}-${defect.MONo}-${defect.Color}-${defect.Size}`;
          if (combinedData.has(key)) {
            const entry = combinedData.get(key);
            entry.Defect_qty = defect.Defect_qty;
            entry.DefectDetails = defect.DefectDetails || [];
          }
        });

        combinedData.forEach((value) => {
          const key = `${value.date}-${value.Line_no}-${value.MONo}-${value.Color}-${value.Size}`;
          if (!summaryMap.has(key)) {
            summaryMap.set(key, value);
          } else {
            const entry = summaryMap.get(key);
            entry.Qty += value.Qty;
            entry.Defect_qty += value.Defect_qty;
            // This part can be improved if defect details need merging, but for now it's additive
            entry.DefectDetails = entry.DefectDetails.concat(
              value.DefectDetails || []
            );
          }
        });
      });

      summaryTable = Array.from(summaryMap.values());

      summaryTable.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return customLineSort(a, b);
      });
    }

    // 2. Process for Daily Trend Table
    const dailyTrend = {};
    reportData.reports.forEach((report) => {
      const date = formatDate(report.Inspection_date);
      if (!dailyTrend[date]) {
        dailyTrend[date] = { output: 0, defect: 0 };
      }
      dailyTrend[date].output += report.TotalOutput || 0;
      dailyTrend[date].defect += report.TotalDefect || 0;
    });

    // 3. Process for Line/MO Summary Cards (only if not QC2)
    const lineSummary = {};
    if (seqNo === 38 || seqNo === 39) {
      reportData.reports.forEach((report) => {
        (report.Output_data_summary || []).forEach((summary) => {
          const key = summary.Line; // Output_data_summary uses 'Line'
          if (!lineSummary[key])
            lineSummary[key] = { totalOutput: 0, totalDefect: 0, defects: {} };
          lineSummary[key].totalOutput += summary.Qty;
        });
        (report.Defect_data_summary || []).forEach((summary) => {
          const key = summary.Line_no;
          if (!lineSummary[key])
            lineSummary[key] = { totalOutput: 0, totalDefect: 0, defects: {} };
          lineSummary[key].totalDefect += summary.Defect_Qty;
          (summary.Defect_Details || []).forEach((d) => {
            lineSummary[key].defects[d.Defect_name] =
              (lineSummary[key].defects[d.Defect_name] || 0) + d.Qty;
          });
        });
      });
    }

    return { summaryTable, dailyTrend, lineSummary };
  }, [reportData, isQC2, seqNo, customLineSort]);

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

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

  const trendDates = Object.keys(processedData.dailyTrend).sort();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Header */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
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
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Inspection Data Summary
          </h2>
          <div className="overflow-x-auto max-h-[500px] border dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-300 uppercase sticky top-0">
                <tr>
                  <th className="p-3">Date</th>
                  {!isQC2 && <th className="p-3">Line No</th>}
                  <th className="p-3">MO No</th>
                  {!isQC2 && <th className="p-3">Color</th>}
                  {!isQC2 && <th className="p-3">Size</th>}
                  <th className="p-3 text-center">Output Qty</th>
                  <th className="p-3 text-center">Defect Qty</th>
                  <th className="p-3 text-center">Defect Rate</th>
                  <th className="p-3">Defect Details</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-600">
                {processedData.summaryTable.map((row, index) => {
                  const defectRate =
                    row.Qty > 0 ? (row.Defect_qty / row.Qty) * 100 : 0;
                  return (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="p-2 font-mono">{row.date}</td>
                      {!isQC2 && (
                        <td className="p-2 text-center font-semibold">
                          {row.Line_no}
                        </td>
                      )}
                      <td className="p-2 font-mono">{row.MONo}</td>
                      {!isQC2 && <td className="p-2">{row.Color}</td>}
                      {!isQC2 && <td className="p-2">{row.Size}</td>}
                      <td className="p-2 text-center">{row.Qty}</td>
                      <td className="p-2 text-center font-bold text-red-500">
                        {row.Defect_qty}
                      </td>
                      <td className={`p-2 text-center font-bold`}>
                        <span
                          className={`px-2 py-1 rounded-md text-xs ${getDefectRateColor(
                            defectRate
                          )}`}
                        >
                          {defectRate.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-2">
                        <ul className="text-xs space-y-1">
                          {row.DefectDetails.sort((a, b) => b.Qty - a.Qty).map(
                            (d) => {
                              const individualRate =
                                row.Qty > 0 ? (d.Qty / row.Qty) * 100 : 0;
                              return (
                                <li
                                  key={d.Defect_code}
                                  className="grid grid-cols-3 gap-1 items-center"
                                >
                                  <span className="col-span-2">
                                    {d.Defect_name} (x{d.Qty})
                                  </span>
                                  <span className="text-right text-red-500/80 font-mono">
                                    {individualRate.toFixed(2)}%
                                  </span>
                                </li>
                              );
                            }
                          )}
                        </ul>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Trend Table */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Daily Output & Defect Trend
          </h2>
          <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-300 uppercase">
                <tr>
                  <th className="p-3 text-left">Metric</th>
                  {trendDates.map((date) => (
                    <th key={date} className="p-3 text-center font-mono">
                      {date}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b dark:border-gray-600">
                  <td className="p-2 font-semibold">Output</td>
                  {trendDates.map((date) => (
                    <td
                      key={date}
                      className="p-2 text-center font-semibold text-blue-600 dark:text-blue-400"
                    >
                      {processedData.dailyTrend[date].output.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b dark:border-gray-600">
                  <td className="p-2 font-semibold">Defect</td>
                  {trendDates.map((date) => (
                    <td
                      key={date}
                      className="p-2 text-center font-semibold text-red-600 dark:text-red-400"
                    >
                      {processedData.dailyTrend[date].defect.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2 font-semibold">Defect Rate</td>
                  {trendDates.map((date) => {
                    const { output, defect } = processedData.dailyTrend[date];
                    const rate = output > 0 ? (defect / output) * 100 : 0;
                    return (
                      <td key={date} className={`p-2 text-center font-bold`}>
                        <span
                          className={`px-2 py-1 rounded-md text-xs ${getDefectRateColor(
                            rate
                          )}`}
                        >
                          {rate.toFixed(2)}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspection Summary By Line (Conditional) */}
        {(seqNo === 38 || seqNo === 39) && (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
              Inspection Summary by Line
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(processedData.lineSummary)
                .map(([key, value]) => ({ key, ...value })) // Convert to array of objects for sorting
                .sort((a, b) => customLineSort(a, b))
                .map(({ key, ...data }) => {
                  const topDefects = Object.entries(data.defects)
                    .map(([name, qty]) => ({ name, qty }))
                    .sort((a, b) => b.qty - a.qty);
                  const defectRate =
                    data.totalOutput > 0
                      ? (data.totalDefect / data.totalOutput) * 100
                      : 0;
                  return (
                    <div
                      key={key}
                      className="border dark:border-gray-700 rounded-lg"
                    >
                      <button
                        onClick={() => toggleSection(key)}
                        className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">
                          Line: {key}
                        </h3>
                        {openSections[key] ? <ChevronUp /> : <ChevronDown />}
                      </button>
                      {openSections[key] && (
                        <div className="p-4 bg-white dark:bg-gray-800">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <SubStatCard
                              label="Total Output"
                              value={data.totalOutput.toLocaleString()}
                            />
                            <SubStatCard
                              label="Total Defects"
                              value={data.totalDefect.toLocaleString()}
                            />
                            <div
                              className={`p-3 rounded-lg text-center ${getDefectRateColor(
                                defectRate
                              )}`}
                            >
                              <p className="text-xs uppercase font-semibold">
                                Defect Rate
                              </p>
                              <p className="text-xl font-bold">
                                {defectRate.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                          <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
                            Top Defects
                          </h4>
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400">
                              <tr>
                                <th className="p-2 text-left">Defect Name</th>
                                <th className="p-2 text-right">Qty</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-600">
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
        )}
      </div>
    </div>
  );
};

export default QCFullReport;
