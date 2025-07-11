import React from "react";
import { useTranslation } from "react-i18next";
import { X, FileDown } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import QCAccuracyIndividualReportPDF from "./QCAccuracyIndividualReportPDF"; // Import the new PDF component

const QCAccuracyResultsPopup = ({ qcData, onClose }) => {
  const { t } = useTranslation();

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
  // --- FIX: MODIFY THE formatTime FUNCTION ---
  const formatTime = (dateString) => {
    // By specifying the timeZone as 'UTC', we tell the function to format the time
    // based on the UTC values in the Date object, effectively ignoring the browser's
    // local timezone offset. Since your server already saved it as UTC+7, this
    // will now display that time correctly.
    return new Date(dateString).toLocaleTimeString([], {
      timeZone: "UTC", // This is the key part of the fix
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  // --- FIX #3: Helper to get status color ---
  const getStatusPillClass = (status) => {
    switch (status) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      case "Major":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
      case "Minor":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">
              Detailed Report for {qcData.qcName} ({qcData.qcId})
            </h2>
            {/* --- FIX: ADD PDF DOWNLOAD BUTTON --- */}
            <PDFDownloadLink
              document={<QCAccuracyIndividualReportPDF qcData={qcData} />}
              fileName={`QC_Accuracy_Report_${qcData.qcId}_${
                new Date().toISOString().split("T")[0]
              }.pdf`}
            >
              {({ blob, url, loading, error }) =>
                loading ? (
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-400 text-white rounded-md text-sm cursor-not-allowed">
                    Loading PDF...
                  </button>
                ) : (
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
                    <FileDown size={16} />
                    Download PDF
                  </button>
                )
              }
            </PDFDownloadLink>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <X size={24} />
          </button>
        </header>
        <div className="p-4 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300 sticky top-0">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Report Type</th>
                <th className="px-4 py-2">MO No</th>
                <th className="px-4 py-2">Line/Table</th>
                <th className="px-4 py-2">Checked</th>
                {/* --- FIX: ADD NEW TABLE HEADERS --- */}
                <th className="px-4 py-2 text-center">Reject Pcs</th>
                <th className="px-4 py-2 text-center">Total Defects</th>
                <th className="px-4 py-2">Defect Details</th>
                <th className="px-4 py-2">Result</th>
                <th className="px-4 py-2">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {qcData.reports.map((report) => (
                <tr
                  key={report._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-4 py-2">{formatDate(report.reportDate)}</td>
                  <td className="px-4 py-2">{formatTime(report.createdAt)}</td>
                  <td className="px-4 py-2">{report.reportType}</td>
                  <td className="px-4 py-2 font-mono">{report.moNo}</td>
                  <td className="px-4 py-2">
                    {report.lineNo !== "NA" ? report.lineNo : report.tableNo}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {report.totalCheckedQty}
                  </td>
                  <td className="px-4 py-2 text-center font-semibold text-red-600">
                    {report.uniquePcsInReport?.length || 0}
                  </td>
                  <td className="px-4 py-2 text-center font-semibold text-orange-600">
                    {report.totalDefectsInReport || 0}
                  </td>
                  {/* --- FIX: ADD NEW TABLE DATA CELLS --- */}
                  <td className="px-4 py-2">
                    {report.defects?.length > 0 &&
                    report.defects[0]?.defectCode ? (
                      <ul className="space-y-2">
                        {report.defects.map((d, i) => (
                          <li key={i}>
                            <div className="font-medium">
                              {d.defectNameEng} (x{d.qty})
                            </div>
                            {/* --- FIX #3: Add status pill and decision text --- */}
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusPillClass(
                                  d.standardStatus
                                )}`}
                              >
                                {d.standardStatus}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({d.decision})
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 italic">No Defects</span>
                    )}
                  </td>

                  <td
                    className={`px-4 py-2 font-bold ${
                      report.result === "Pass"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {report.result}
                  </td>
                  <td className="px-4 py-2 text-center font-bold">
                    {report.grade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QCAccuracyResultsPopup;
