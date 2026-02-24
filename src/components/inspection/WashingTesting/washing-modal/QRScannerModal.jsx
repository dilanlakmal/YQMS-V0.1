import React, { useEffect } from "react";
import { X, Flashlight, QrCode } from "lucide-react";
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
      aria-label="ABA"
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
        
        {/* Professional corner brackets overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div 
            className="relative" 
            style={{ 
              width: 'min(85vw, 85vh, 450px)', 
              height: 'min(85vw, 85vh, 450px)'
            }}
          >
            {/* Top-left corner - enhanced */}
            <svg className="absolute -top-1 -left-1 w-20 h-20 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
              <path d="M 5 25 L 5 5 L 25 5" />
            </svg>
            
            {/* Top-right corner - enhanced */}
            <svg className="absolute -top-1 -right-1 w-20 h-20 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
              <path d="M 55 5 L 75 5 L 75 25" />
            </svg>
            
            {/* Bottom-left corner - enhanced */}
            <svg className="absolute -bottom-1 -left-1 w-20 h-20 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
              <path d="M 5 55 L 5 75 L 25 75" />
            </svg>
            
            {/* Bottom-right corner - enhanced */}
            <svg className="absolute -bottom-1 -right-1 w-20 h-20 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
              <path d="M 75 55 L 75 75 L 55 75" />
            </svg>

            {/* Subtle scanning line animation */}
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              <div 
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-60"
                style={{
                  animation: 'scan-vertical 3s ease-in-out infinite',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer with premium buttons */}
      <footer className="flex-shrink-0 px-6 py-3 bg-black/75 backdrop-blur-md border-t border-white/10">
        <div className="flex items-center justify-center gap-6 max-w-lg mx-auto">
          <button
            type="button"
            onClick={onFlashToggle}
            className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl text-base font-bold transition-all duration-300 active:scale-95 flex-1 max-w-[180px] shadow-2xl ${
              flashOn
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
      </footer>

      <style>{`
        @keyframes scan-vertical {
          0%, 100% { top: 0%; opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default QRScannerModal;
