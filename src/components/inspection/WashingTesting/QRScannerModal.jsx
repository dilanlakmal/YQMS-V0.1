import React from "react";

const QRScannerModal = ({
  isOpen,
  reportId,
  onClose,
  scannerElementId,
}) => {
  if (!isOpen || !reportId) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Scan QR code to capture Report Date
            </h3>
            <div
              id={scannerElementId}
              className="w-full max-w-md mb-4"
              style={{ minHeight: "300px" }}
            ></div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close Scanner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;

