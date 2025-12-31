import React from "react";
import { RotateCw, RefreshCw } from "lucide-react";
import ReportCard from "./ReportCard";

const ReportsList = ({
  reports,
  isLoadingReports,
  onRefresh,
  expandedReports,
  onToggleReport,
  onPrintPDF,
  onDownloadPDF,
  onExportExcel,
  onEdit,
  onDelete,
  onShowQRCode,
  printingReportId,
  savedImageRotations,
  openImageViewer,
  setActiveTab,
  onEditInitialImages,
  onEditReceivedImages,
  onEditCompletionImages,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          Reports
          {isLoadingReports && <RotateCw className="w-5 h-5 animate-spin text-blue-600" />}
        </h2>
        <button
          onClick={onRefresh}
          disabled={isLoadingReports}
          className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoadingReports ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isLoadingReports ? "Loading..." : "Refresh"}
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No reports submitted yet.</p>
          <p className="text-sm mt-2">
            Go to the <button onClick={() => setActiveTab("form")} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">New Report</button> tab to submit a report.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const reportId = report._id || report.id;
            return (
              <ReportCard
                key={reportId}
                report={report}
                isExpanded={expandedReports.has(reportId)}
                onToggle={onToggleReport}
                onPrintPDF={onPrintPDF}
                onDownloadPDF={onDownloadPDF}
                onExportExcel={onExportExcel}
                onEdit={onEdit}
                onDelete={onDelete}
                onShowQRCode={onShowQRCode}
                printingReportId={printingReportId}
                savedImageRotations={savedImageRotations}
                openImageViewer={openImageViewer}
                onEditInitialImages={onEditInitialImages}
                onEditReceivedImages={onEditReceivedImages}
                onEditCompletionImages={onEditCompletionImages}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReportsList;

