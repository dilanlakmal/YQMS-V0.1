import React from "react";

const QCAccuracyViewReportPageTitle = ({ report }) => {
  if (!report) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src="/assets/Home/yorkmars.jpg"
            alt="Yorkmars Logo"
            className="h-14 w-auto"
          />
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200 tracking-tight">
              Yorkmars (Cambodia) Garment MFG Co., LTD
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              QC Accuracy - {report.reportType} Report
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">
            QA: <span className="font-mono">{report.qcInspector.empId}</span>
          </div>
          <div className="text-sm font-semibold">
            QC: <span className="font-mono">{report.scannedQc.empId}</span>
          </div>
          <div className="text-sm font-semibold">
            MO: <span className="font-mono">{report.moNo}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QCAccuracyViewReportPageTitle;
