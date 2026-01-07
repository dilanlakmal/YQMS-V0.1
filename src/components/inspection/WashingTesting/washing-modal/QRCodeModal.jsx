import React, { useRef, useEffect } from "react";
import { X, Upload } from "lucide-react";
import QRCode from "react-qr-code";

const QRCodeModal = ({
  isOpen,
  reportId,
  onClose,
  onDownloadQRCode,
  onUploadQRCode,
  getQRCodeBaseURL,
  fileInputRef,
}) => {
  const qrCodeContainerRef = useRef(null);

  const handleClick = () => {
    onDownloadQRCode(reportId);
  };

  if (!isOpen || !reportId) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button in top right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-0 right-0 m-0 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-tl-lg rounded-br-lg transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Scan this QR code to set Report Date
            </h3>
            <div
              ref={qrCodeContainerRef}
              id={`qr-code-${reportId}`}
              className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-4 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              onClick={handleClick}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClick();
                }
              }}
              title="Click to download"
            >
              <QRCode
                value={`${getQRCodeBaseURL()}/laundry-washing-machine-test?scan=${reportId}`}
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%", pointerEvents: "none" }}
              />
            </div>

            <div className="w-full space-y-3">

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => onUploadQRCode(e, reportId)}
                className="hidden"
                id={`qr-upload-${reportId}`}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById(`qr-upload-${reportId}`);
                  if (input) input.click();
                }}
                className="w-full px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                Upload QR Code to Scan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;

