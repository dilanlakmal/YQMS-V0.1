import React from "react";
import { XCircle } from "lucide-react";
import { useModalStore } from "../stores";

const RejectReportModal = ({ onConfirm }) => {
  const {
    rejectModal: { isOpen, report, rejectedNotes },
    setRejectNotes,
    closeRejectModal,
  } = useModalStore();

  if (!isOpen) return null;

  const reportId = report?._id || report?.id;
  const handleReject = () => {
    if (onConfirm) onConfirm(reportId, rejectedNotes || "");
    closeRejectModal();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/20">
            <XCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
            Reject Report
          </h3>

          {report?.ymStyle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center mb-3">
              Style: <span className="font-medium text-gray-700 dark:text-gray-300">{report.ymStyle}</span>
            </p>
          )}
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reason for rejection (optional)
          </label>
          <textarea
            value={rejectedNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="e.g. Only one color received, submitter sent two"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={closeRejectModal}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 rounded-md transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectReportModal;
