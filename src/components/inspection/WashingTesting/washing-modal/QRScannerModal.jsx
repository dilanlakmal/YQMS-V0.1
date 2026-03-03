import React, { useEffect, useState, useRef } from "react";
import { X, Flashlight, QrCode, CheckCircle } from "lucide-react";
import "./QRCodeModal.css";

const QRScannerModal = ({
  isOpen,
  reportId,
  onClose,
  scannerElementId,
  onUploadQRClick,
  onFlashToggle,
  flashOn = false,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [framePosition, setFramePosition] = useState(null);
  const overlayRef = useRef(null);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsScanning(false);
      setScanSuccess(false);
      setIsProcessing(false);
      setFramePosition(null);
      const timer = setTimeout(() => setIsScanning(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Listen for QR scan success - bracket zooms to focus on QR (easier for user)
  useEffect(() => {
    const handleScanSuccess = (e) => {
      const qrBounds = e.detail?.qrBounds;
      const overlay = overlayRef.current;
      const scannerEl = scannerElementId ? document.getElementById(scannerElementId) : null;
      const video = scannerEl?.querySelector?.('video');
      const rect = overlay?.getBoundingClientRect();

      if (overlay && rect) {
        const maxFrameSize = Math.min(rect.width * 0.5, rect.height * 0.5, 280);
        const minFrameSize = 100;

        if (qrBounds && typeof qrBounds.x === 'number' && typeof qrBounds.y === 'number' && (video || scannerEl)) {
          // Scale bounds if library uses video intrinsic resolution
          const scaleX = video?.videoWidth ? rect.width / video.videoWidth : 1;
          const scaleY = video?.videoHeight ? rect.height / video.videoHeight : 1;
          const x = qrBounds.x * scaleX;
          const y = qrBounds.y * scaleY;
          const w = (qrBounds.width || 80) * scaleX;
          const h = (qrBounds.height || 80) * scaleY;
          const centerX = x + w / 2;
          const centerY = y + h / 2;

          // Zoom bracket to fit QR - frame shrinks tight around QR for lock-on feel
          const padding = 24;
          const zoomSize = Math.min(maxFrameSize, Math.max(minFrameSize, Math.max(w, h) + padding));
          const left = Math.max(0, Math.min(rect.width - zoomSize, centerX - zoomSize / 2));
          const top = Math.max(0, Math.min(rect.height - zoomSize, centerY - zoomSize / 2));
          setFramePosition({ left, top, width: zoomSize, height: zoomSize });
        } else {
          // Fallback: no bounds (file upload or decoder) - zoom bracket to center for user feedback
          const zoomSize = Math.min(maxFrameSize, Math.max(minFrameSize, 180));
          const left = (rect.width - zoomSize) / 2;
          const top = (rect.height - zoomSize) / 2;
          setFramePosition({ left, top, width: zoomSize, height: zoomSize });
        }
      }

      setIsScanning(false);
      setIsProcessing(true);
      setScanSuccess(false);

      setTimeout(() => {
        setIsProcessing(false);
        setScanSuccess(true);
      }, 2500);
    };

    window.addEventListener('qr-scan-success', handleScanSuccess);
    return () => window.removeEventListener('qr-scan-success', handleScanSuccess);
  }, [scannerElementId]);
  // Clean up scanner element completely when modal closes
  useEffect(() => {
    if (!isOpen && scannerElementId) {
      const scannerElement = document.getElementById(scannerElementId);
      if (scannerElement) {
        // Clear all child elements to ensure fresh start next time
        scannerElement.innerHTML = '';
      }
    }
  }, [isOpen, scannerElementId]);

  // AGGRESSIVELY hide ALL default scanner UI elements
  useEffect(() => {
    if (!isOpen || !scannerElementId) return;

    const hideDefaults = () => {
      const scannerElement = document.getElementById(scannerElementId);
      if (!scannerElement) return;

      // 1. Kill shaded region
      const shadedRegion = scannerElement.querySelector('#qr-shaded-region');
      if (shadedRegion) {
        shadedRegion.style.display = 'none !important';
        shadedRegion.style.visibility = 'hidden';
        shadedRegion.remove(); // Nuclear option: just delete it
      }

      // 2. Find and destroy ALL border elements from html5-qrcode
      const allDivs = scannerElement.querySelectorAll('div');
      allDivs.forEach(div => {
        const style = div.getAttribute('style') || '';
        // If it has borders, box-shadow, or is positioned absolute with borders
        if (
          style.includes('border') ||
          style.includes('box-shadow') ||
          div.id === 'qr-shaded-region'
        ) {
          div.style.display = 'none !important';
          div.style.visibility = 'hidden';
          div.style.opacity = '0';
          div.style.border = 'none !important';
          div.style.boxShadow = 'none !important';
        }
      });

      // 3. Make video fullscreen and clean
      const video = scannerElement.querySelector('video');
      if (video) {
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.background = 'transparent';
      }

      // 4. Ensure scanner container has proper styling
      scannerElement.style.background = 'transparent';
      scannerElement.style.position = 'relative';
      scannerElement.style.width = '100%';
      scannerElement.style.height = '100%';

      // 5. Add custom CSS to scanner element to override library styles
      const existingStyle = document.getElementById('custom-scanner-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      const styleEl = document.createElement('style');
      styleEl.id = 'custom-scanner-styles';
      styleEl.innerHTML = `
        #${scannerElementId} {
          background: transparent !important;
        }
        #${scannerElementId} > div[style*="position: absolute"][style*="border"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
        #${scannerElementId} #qr-shaded-region {
          display: none !important;
        }
        #${scannerElementId} video {
          background: transparent !important;
        }
      `;
      document.head.appendChild(styleEl);
    };

    // Run multiple times to catch async library rendering
    const timer1 = setTimeout(hideDefaults, 50);
    const timer2 = setTimeout(hideDefaults, 150);
    const timer3 = setTimeout(hideDefaults, 300);
    const timer4 = setTimeout(hideDefaults, 500);
    const timer5 = setTimeout(hideDefaults, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [isOpen, scannerElementId]);

  if (!isOpen || !reportId) return null;

  return (
    <div
      className="fixed inset-0 flex flex-col z-50"
      role="dialog"
      aria-modal="true"
      aria-label=""
      style={{ background: 'transparent' }}
    >
      {/* Header - dark semi-opaque so "Yorkmars Cambodia" is readable over any camera feed */}
      <header className="flex-shrink-0 h-16 px-6 flex items-center justify-between bg-black/75 backdrop-blur-md border-b border-white/10">
        <h2 className="text-2xl font-extrabold text-white tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          Yorkmars Cambodia
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
          aria-label="Close scanner"
        >
          <X size={26} strokeWidth={2.5} />
        </button>
      </header>

      {/* Camera viewfinder with professional corner brackets */}
      <div className="flex-1 flex items-center justify-center min-h-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden relative">
        {/* Scanner video feed */}
        <div
          id={scannerElementId}
          className="absolute inset-0 w-full h-full"
          style={{
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        />

        {/* Scanning overlay with focused zoom box */}
        <div ref={overlayRef} className="absolute inset-0 pointer-events-none z-10">
          {/* Scanning box - centers by default, zooms to focus on QR when detected (ABA Bank style) */}
          <div
            className={`absolute ${(isScanning || isProcessing || scanSuccess) ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
              } ${framePosition && isProcessing && !scanSuccess ? 'animate-zoom-to-focus' : ''} ${scanSuccess ? 'animate-scan-success' : ''}`}
            style={{
              width: framePosition ? framePosition.width : 'min(55vw, 55vh, 280px)',
              height: framePosition ? framePosition.height : 'min(55vw, 55vh, 280px)',
              ...(framePosition
                ? { left: framePosition.left, top: framePosition.top, right: 'auto', bottom: 'auto', margin: 0 }
                : {
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  margin: 'auto',
                }),
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Glow - blue when scanning, green when locked on QR */}
            <div className={`absolute inset-0 blur-3xl rounded-2xl transition-colors duration-300 ${framePosition ? 'bg-emerald-500/30' : 'bg-blue-500/20'}`} />

            {/* Lock-on ring - appears when bracket locks on QR */}
            {framePosition && (
              <div className="absolute inset-2 rounded-lg border-2 border-emerald-400/90 animate-bracket-lock-ring pointer-events-none" style={{ boxShadow: '0 0 20px rgba(52, 211, 153, 0.6)' }} />
            )}

            {/* Corner brackets - pulse when scanning, converge inward when locked on QR */}
            {/* Top-left - origin bottom-right so scales toward center */}
            <svg className={`absolute -top-1 -left-1 w-16 h-16 text-white transition-all ${framePosition ? 'animate-bracket-lock-on' : isScanning ? 'animate-corner-pulse' : ''}`} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" style={{ ...(framePosition ? { filter: 'drop-shadow(0 0 10px rgba(52, 211, 153, 0.9))', animationDelay: '0s', transformOrigin: 'bottom right' } : { filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.9))' }) }}>
              <path d="M 5 28 L 5 5 L 28 5" />
            </svg>
            {/* Top-right - origin bottom-left */}
            <svg className={`absolute -top-1 -right-1 w-16 h-16 text-white transition-all ${framePosition ? 'animate-bracket-lock-on' : isScanning ? 'animate-corner-pulse' : ''}`} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" style={{ ...(framePosition ? { filter: 'drop-shadow(0 0 10px rgba(52, 211, 153, 0.9))', animationDelay: '0.04s', transformOrigin: 'bottom left' } : { filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.9))' }) }}>
              <path d="M 52 5 L 75 5 L 75 28" />
            </svg>
            {/* Bottom-left - origin top-right */}
            <svg className={`absolute -bottom-1 -left-1 w-16 h-16 text-white transition-all ${framePosition ? 'animate-bracket-lock-on' : isScanning ? 'animate-corner-pulse' : ''}`} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" style={{ ...(framePosition ? { filter: 'drop-shadow(0 0 10px rgba(52, 211, 153, 0.9))', animationDelay: '0.08s', transformOrigin: 'top right' } : { filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.9))' }) }}>
              <path d="M 5 52 L 5 75 L 28 75" />
            </svg>
            {/* Bottom-right - origin top-left */}
            <svg className={`absolute -bottom-1 -right-1 w-16 h-16 text-white transition-all ${framePosition ? 'animate-bracket-lock-on' : isScanning ? 'animate-corner-pulse' : ''}`} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" style={{ ...(framePosition ? { filter: 'drop-shadow(0 0 10px rgba(52, 211, 153, 0.9))', animationDelay: '0.12s', transformOrigin: 'top left' } : { filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.9))' }) }}>
              <path d="M 75 52 L 75 75 L 52 75" />
            </svg>

            {/* Scanning line - green horizontal sweep (like /Processing style) */}
            {(isScanning || isProcessing) && !scanSuccess && (
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <div
                  className="absolute top-0 bottom-0 w-1 scan-beam-line-horizontal"
                  style={{
                    background: 'linear-gradient(to bottom, transparent, rgba(34, 197, 94, 0.9) 20%, rgba(34, 197, 94, 1) 50%, rgba(34, 197, 94, 0.9) 80%, transparent)',
                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.9), 0 0 40px rgba(34, 197, 94, 0.5)',
                    animation: 'scan-sweep-horizontal 2s ease-in-out infinite',
                  }}
                />
              </div>
            )}

            {/* Locked / Processing - shows lock feedback when bracket locks on QR */}
            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-end rounded-lg pb-6 pointer-events-none">
                <p className={`text-lg font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-colors ${framePosition ? 'text-emerald-300' : 'text-white'}`}>
                  {framePosition ? 'Locked' : 'Processing...'}
                </p>
              </div>
            )}

            {/* Success popup - tells user correct, then form opens */}
            {scanSuccess && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="flex flex-col items-center gap-3 px-10 py-6 rounded-2xl bg-white/95 dark:bg-gray-900/95 border-2 border-green-500 shadow-2xl animate-modal-pop">
                  <CheckCircle size={72} className="text-green-500 animate-success-check" strokeWidth={2.5} />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">Success</p>
                  
                </div>
              </div>
            )}

            {/* Instructions text */}
            {/* {isScanning && !scanSuccess && !isProcessing && (
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center">
                <p className="text-white text-sm font-medium drop-shadow-lg animate-pulse-slow">
                  Position QR code within the frame
                </p>
              </div>
            )} */}
          </div>
        </div>
      </div>

      {/* Footer with premium buttons */}
      {/* <footer className="flex-shrink-0 px-6 py-3 bg-black/75 backdrop-blur-md border-t border-white/10">
        <div className="flex items-center justify-center gap-6 max-w-lg mx-auto">
          <button
            type="button"
            onClick={onFlashToggle}
            className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl text-base font-bold transition-all duration-300 active:scale-95 flex-1 max-w-[180px] shadow-2xl ${flashOn
                ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/50"
                : "bg-gradient-to-br from-gray-700 to-gray-800 text-gray-100 hover:from-gray-600 hover:to-gray-700 shadow-gray-900/50"
              }`}
            style={{
              boxShadow: flashOn
                ? '0 10px 40px rgba(251, 191, 36, 0.4), 0 0 20px rgba(251, 191, 36, 0.3)'
                : '0 10px 30px rgba(0, 0, 0, 0.5)'
            }}
          >
            <Flashlight size={22} strokeWidth={2.5} />
            <span className="tracking-wider">Flash</span>
          </button>

          <button
            type="button"
            onClick={onUploadQRClick}
            className="flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl text-base font-bold bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 transition-all duration-300 active:scale-95 flex-1 max-w-[180px] shadow-2xl"
            style={{
              boxShadow: '0 10px 40px rgba(37, 99, 235, 0.4), 0 0 20px rgba(37, 99, 235, 0.3)'
            }}
          >
            <QrCode size={22} strokeWidth={2.5} />
            <span className="tracking-wider whitespace-nowrap">Upload QR</span>
          </button>
        </div>
      </footer> */}

      <style>{`
        @keyframes scan-sweep-horizontal {
          0% { 
            left: 0%; 
            opacity: 0; 
          }
          5% { 
            opacity: 1; 
          }
          95% { 
            opacity: 1; 
          }
          100% { 
            left: 100%; 
            opacity: 0; 
          }
        }

        .scan-beam-line-horizontal {
          position: absolute;
          left: 0;
        }

        @keyframes corner-pulse {
          0%, 100% { 
            opacity: 1;
            filter: drop-shadow(0 0 12px rgba(255,255,255,0.9));
          }
          50% { 
            opacity: 0.6;
            filter: drop-shadow(0 0 20px rgba(59, 130, 246, 1));
          }
        }

        /* Bracket lock-on: corners converge inward toward QR (like targeting lock) */
        @keyframes bracket-lock-on {
          0% { 
            transform: scale(1.35);
            opacity: 0.9;
          }
          40% { 
            transform: scale(0.92);
          }
          70% { 
            transform: scale(1.03);
          }
          100% { 
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-bracket-lock-on {
          animation: bracket-lock-on 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Lock ring - draws in when bracket locks on QR */
        @keyframes bracket-lock-ring {
          0% { 
            opacity: 0;
            transform: scale(1.3);
          }
          50% { 
            opacity: 1;
          }
          100% { 
            opacity: 0.85;
            transform: scale(1);
          }
        }

        .animate-bracket-lock-ring {
          animation: bracket-lock-ring 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes zoom-to-focus {
          0% { 
            transform: scale(1.2);
            opacity: 1;
          }
          50% { 
            transform: scale(0.96);
          }
          100% { 
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-zoom-to-focus {
          animation: zoom-to-focus 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes scan-success {
          0% { 
            transform: scale(1); 
          }
          50% { 
            transform: scale(1.1); 
          }
          100% { 
            transform: scale(1); 
          }
        }

        @keyframes success-flash {
          0%, 100% { 
            opacity: 0; 
          }
          50% { 
            opacity: 1; 
          }
        }

        @keyframes success-check {
          0% { 
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          50% { 
            transform: scale(1.2) rotate(0deg);
          }
          100% { 
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes pulse-slow {
          0%, 100% { 
            opacity: 1; 
          }
          50% { 
            opacity: 0.6; 
          }
        }

        .animate-corner-pulse {
          animation: corner-pulse 2s ease-in-out infinite;
        }

        .animate-scan-success {
          animation: scan-success 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-success-flash {
          animation: success-flash 0.8s ease-out;
        }

        .animate-success-check {
          animation: success-check 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

      `}</style>
    </div>
  );
};

export default QRScannerModal;
