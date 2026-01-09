import React, { useRef, useEffect } from "react";
import { X, Upload, Waves, Droplets } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import "./QRCodeModal.css";

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

        <div className="p-8">
          <div className="flex flex-col items-center">
            <div className="mb-6 text-center relative">
              {/* Washing Icons Decoration */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-4 opacity-20 dark:opacity-10 pointer-events-none">
                <Waves className="animate-bounce" size={24} />
                <Droplets className="animate-pulse" size={20} />
                <Waves className="animate-bounce [animation-delay:0.5s]" size={24} />
              </div>

              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
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
                    height: 200,
                    width: 200,
                    excavate: true,
                  }}
                  style={{ height: "auto", maxWidth: "200px", width: "100%", pointerEvents: "none" }}
                />
              </div>

              {/* Download Hint */}
              <div className="mt-4 flex flex-col items-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                  Click QR code to download
                </span>
                <div className="w-8 h-1 bg-indigo-500/20 rounded-full mt-1"></div>
              </div>
            </div>

            <div className="w-full mt-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/95 dark:bg-gray-900/95 px-3 text-gray-500 dark:text-gray-400 font-medium">
                    Or alternative
                  </span>
                </div>
              </div>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
