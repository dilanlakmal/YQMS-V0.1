import React, { useRef, useEffect } from "react";
import { X, Upload, Waves, Droplets, Printer, Camera } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import "./QRCodeModal.css";

const QRCodeModal = ({
  isOpen,
  reportId,
  onClose,
  onDownloadQRCode,
  onPrintQRCode, // Added for printing stamps
  onUploadQRCode,
  onOpenScanner,
  getQRCodeBaseURL,
  fileInputRef,
  isLocked = false,
}) => {
  const qrCodeContainerRef = useRef(null);
  // Animated Logo Component for the QR center
  const QRLogoAnimated = () => (
    <div className="w-10 h-10 flex items-center justify-center bg-white rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.05)] dark:bg-gray-800 overflow-hidden relative group">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-blue-500/5"></div>

      <img
        src="/assets/Home/YQMSLogoEdit.png"
        alt="Logo"
        className="w-7 h-7 object-contain z-10"
      />
    </div>
  );


  const handleClick = () => {
    onDownloadQRCode(reportId);
  };

  if (!isOpen || !reportId) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden animate-modal-pop border border-white/20 dark:border-gray-700/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Background Accent */}
        <div className="absolute -top-24 -left-24 w-48 height-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 height-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-full transition-all duration-200"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="py-4 px-6">
          <div className="flex flex-col items-center">
            <div className="mb-2 text-center relative">

              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-1">
                Launch Washing Test
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Set Report Date for ID: <span className="text-indigo-500 font-mono">#{reportId}</span>
              </p>
            </div>

            {/* QR Code Container with Animations */}
            <div className="relative group perspective-1000">
              <div className="qr-glow group-hover:bg-blue-500/20 transition-all duration-500"></div>

              {/* Animated Bubbles for Washing Theme */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div className="bubble bubble-1"></div>
                <div className="bubble bubble-2"></div>
                <div className="bubble bubble-3"></div>
                <div className="bubble bubble-4"></div>
              </div>

              <div
                ref={qrCodeContainerRef}
                id={`qr-code-${reportId}`}
                className="relative bg-white p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 cursor-pointer transform transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-indigo-500/10 active:scale-95"
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
                <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none z-10">
                  <QRLogoAnimated />
                </div>

                {/* Scanning Beam Animation - Now on the topmost layer z-30 */}
                <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-2xl transition-opacity duration-500 opacity-100 group-hover:opacity-0">
                  <div className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_20px_rgba(59,130,246,1),0_0_40px_rgba(59,130,246,0.5)] animate-scan-beam"></div>
                </div>

                <QRCodeCanvas
                  id={`qr-canvas-${reportId}`}
                  value={`${getQRCodeBaseURL()}/Launch-washing-machine-test?scan=${reportId}`}
                  size={1024}
                  level="H"
                  imageSettings={{
                    src: "/assets/Home/YQMSLogoEdit.png",
                    x: undefined,
                    y: undefined,
                    height: 90,  // Reduced from 120 for better scannability
                    width: 90,   // Reduced from 120 for better scannability
                    excavate: true,
                  }}
                  style={{ height: "auto", maxWidth: "200px", width: "100%", pointerEvents: "none" }}
                />
              </div>

            </div>

            {!isLocked && (
              <div className="mt-0 flex justify-center">
                <button
                  type="button"
                  onClick={() => onOpenScanner(reportId)}
                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transform transition-all duration-300 hover:scale-125 active:scale-95 group"
                  title="Open Live Camera Scanner"
                >
                  <Camera size={32} className="group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            )}

            <div className="w-full mt-1 space-y-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/95 dark:bg-gray-900/95 px-3 text-gray-500 dark:text-gray-400 font-medium">
                    Or Actions
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onPrintQRCode(reportId)}
                className="group relative w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden shadow-lg hover:shadow-blue-500/25 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                <Printer size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="font-bold text-sm tracking-wide">Print QR Stamp</span>
              </button>

              {!isLocked && (
                <>
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
                    className="group relative w-full px-6 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden shadow-sm hover:shadow-md"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Upload size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-sm">Upload QR Image</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default QRCodeModal;
