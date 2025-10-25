import { X } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

const SubConQCResultsPopup = ({ qcData, onClose }) => {
  const { t } = useTranslation();

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

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

  const getResultClass = (result) => {
    switch (result) {
      case "A":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
      case "B":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      case "C":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30";
      case "D":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getCheckStatusClass = (status) => {
    if (status === "Pass" || status === "Correct") {
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
    }
    return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-8xl h-[90vh] flex flex-col">
        {/* Header */}
        <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">
              Detailed Report for {qcData.qcName} ({qcData.qcId})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <X size={24} />
          </button>
        </header>

        {/* Table */}
        <div className="p-4 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300 sticky top-0">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Report Type</th>
                <th className="px-4 py-2">Factory</th>
                <th className="px-4 py-2">Line No</th>
                <th className="px-4 py-2">MO No</th>
                <th className="px-4 py-2">Color</th>
                <th className="px-4 py-2 text-center">SPI</th>
                <th className="px-4 py-2 text-center">Measurement</th>
                <th className="px-4 py-2 text-center">Labelling</th>
                <th className="px-4 py-2 text-center">Checked</th>
                <th className="px-4 py-2 text-center">Reject Pcs</th>
                <th className="px-4 py-2 text-center">Total Defects</th>
                <th className="px-4 py-2">Defect Details</th>
                <th className="px-4 py-2 text-center">Result</th>
                <th className="px-4 py-2 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {qcData.reports.map((report) => (
                <tr
                  key={report._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-4 py-2">
                    {formatDate(report.inspectionDate)}
                  </td>
                  <td className="px-4 py-2">{formatTime(report.createdAt)}</td>
                  <td className="px-4 py-2">{report.reportType}</td>
                  <td className="px-4 py-2">{report.factory}</td>
                  <td className="px-4 py-2">{report.lineNo}</td>
                  <td className="px-4 py-2 font-mono">{report.moNo}</td>
                  <td className="px-4 py-2">{report.color}</td>

                  {/* SPI Status */}
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${getCheckStatusClass(
                        report.qcData.spi.status
                      )}`}
                    >
                      {report.qcData.spi.status}
                    </span>
                  </td>

                  {/* Measurement Status */}
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${getCheckStatusClass(
                        report.qcData.measurement.status
                      )}`}
                    >
                      {report.qcData.measurement.status}
                    </span>
                  </td>

                  {/* Labelling Status */}
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${getCheckStatusClass(
                        report.qcData.labelling.status
                      )}`}
                    >
                      {report.qcData.labelling.status}
                    </span>
                  </td>

                  <td className="px-4 py-2 text-center">
                    {report.qcData.checkedQty}
                  </td>
                  <td className="px-4 py-2 text-center font-semibold text-red-600">
                    {report.qcData.rejectPcs}
                  </td>
                  <td className="px-4 py-2 text-center font-semibold text-orange-600">
                    {report.qcData.totalDefectQty}
                  </td>

                  {/* Defect Details */}
                  <td className="px-4 py-2">
                    {report.qcData.defectList?.length > 0 ? (
                      <ul className="space-y-2">
                        {report.qcData.defectList.map((d, i) => (
                          <li key={i}>
                            <div className="font-medium">
                              {d.defectName} (x{d.qty})
                            </div>
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

                  {/* Result */}
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${getResultClass(
                        report.result
                      )}`}
                    >
                      {report.result}
                    </span>
                  </td>

                  {/* Grade */}
                  <td className="px-4 py-2 text-center font-bold">
                    {report.result}
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

export default SubConQCResultsPopup;
