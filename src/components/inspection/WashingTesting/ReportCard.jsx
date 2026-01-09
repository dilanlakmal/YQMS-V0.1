import React from "react";
import { ChevronDown, ChevronUp, Printer, FileText, FileSpreadsheet, Pencil, Trash2, QrCode, CheckCircle } from "lucide-react";
import ReportTimeline from "./ReportTimeline";

const ReportCard = ({
  report,
  isExpanded,
  onToggle,
  onPrintPDF,
  onDownloadPDF,
  onExportExcel,
  onEdit,
  onDelete,
  onShowQRCode,
  printingReportId,
  savedImageRotations,
  openImageViewer,
  onEditInitialImages,
  onEditReceivedImages,
  onEditCompletionImages,
}) => {
  const reportId = report._id || report.id;

  return (
    <div
      data-report-id={reportId}
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow"
    >
      {/* Header - Clickable to expand/collapse */}
      <div
        className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-3 cursor-pointer"
        onClick={() => onToggle(reportId)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white truncate">
                {report.ymStyle || "N/A"}
              </h3>
              {/* Status Badge */}
              {report.status && (
                <span className={`px-2 py-1 text-xs font-medium rounded flex-shrink-0 ${report.status === "completed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : report.status === "received"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  }`}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Submitted: {report.createdAt
                ? new Date(report.createdAt).toLocaleString('en-GB', { hour12: true })
                : report.submittedAt
                  ? new Date(report.submittedAt).toLocaleString('en-GB', { hour12: true })
                  : "N/A"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1.5 md:gap-2 flex-wrap">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPrintPDF(report);
              }}
              disabled={printingReportId === reportId}
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Print PDF"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">{printingReportId === reportId ? "Printing..." : "Print"}</span>
            </button>
            <button
              onClick={() => onDownloadPDF(report)}
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
              title="Download PDF"
            >
              <FileText size={14} />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={() => onExportExcel(report)}
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-1"
              title="Export Excel"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(report);
              }}
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors flex items-center gap-1"
              title="Edit Report"
            >
              <Pencil size={14} />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => onDelete(reportId)}
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
              title="Delete Report"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Delete</span>
              <span className="sm:hidden">Del</span>
            </button>
          </div>
          {/* QR Code Button */}
          {report.status === "completed" ? (
            <div
              className="px-2 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md flex items-center justify-center cursor-default flex-shrink-0"
              title="Report Completed - QR Code no longer available"
            >
              <CheckCircle size={16} />
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShowQRCode(reportId);
              }}
              className="px-2 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center flex-shrink-0"
              title="Show QR Code"
            >
              <QrCode size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Summary View (Collapsed) */}
      {!isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-2 text-xs md:text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Buyer Style: </span>
            <span className="text-gray-900 dark:text-white break-words">{report.buyerStyle || "N/A"}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Colors: </span>
            <span className="text-gray-900 dark:text-white">
              {report.color && report.color.length > 0
                ? `${report.color.length} color(s)`
                : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Factory: </span>
            <span className="text-gray-900 dark:text-white">{report.factory || "N/A"}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Images: </span>
            <span className="text-gray-900 dark:text-white">
              {report.images && report.images.length > 0
                ? `${report.images.length} image(s)`
                : "None"}
            </span>
          </div>
        </div>
      )}

      {/* Full Details View (Expanded) */}
      {isExpanded && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Buyer Style
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {report.buyerStyle || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Colors
              </p>
              <div className="flex flex-wrap gap-1">
                {report.color && report.color.length > 0 ? (
                  report.color.map((color, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded"
                    >
                      {color}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                PO
              </p>
              <div className="flex flex-wrap gap-1">
                {report.po && report.po.length > 0 ? (
                  report.po.map((po, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded"
                    >
                      {po}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Ex Fty Date
              </p>
              <div className="flex flex-wrap gap-1">
                {report.exFtyDate && report.exFtyDate.length > 0 ? (
                  report.exFtyDate.map((date, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded"
                    >
                      {date}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Factory
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {report.factory || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Submitted By
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {report.userName || report.userId || "N/A"}
              </p>
            </div>
          </div>

          {/* Timeline View */}
          <ReportTimeline
            report={report}
            savedImageRotations={savedImageRotations}
            openImageViewer={openImageViewer}
            onEditInitialImages={onEditInitialImages}
            onEditReceivedImages={onEditReceivedImages}
            onEditCompletionImages={onEditCompletionImages}
          />
        </>
      )}
    </div>
  );
};

export default ReportCard;

