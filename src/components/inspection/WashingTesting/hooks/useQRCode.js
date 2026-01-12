import React, { useState, useRef, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeCanvas } from "qrcode.react";
import { API_BASE_URL } from "../../../../../config.js";
import showToast from "../../../../utils/toast.js";

/**
 * Custom hook for QR code operations (scanning, generation)
 */
export const useQRCode = (getQRCodeBaseURL) => {
  const [showReportDateQR, setShowReportDateQR] = useState(null);
  const [showReportDateScanner, setShowReportDateScanner] = useState(null);
  const [html5QrCodeInstance, setHtml5QrCodeInstance] = useState(null);
  const [scanningReportId, setScanningReportId] = useState(null);
  const statusCheckIntervalRef = useRef(null);

  // Generate QR code as data URL for PDF using QRCodeCanvas
  const generateQRCodeDataURL = useCallback(async (value, size = 100) => {
    // Increase resolution for the data URL to ensure it's sharp in PDF/Print
    const highResSize = 1024;

    return new Promise((resolve) => {
      try {
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.width = `${highResSize}px`;
        container.style.height = `${highResSize}px`;
        container.style.background = "white";
        document.body.appendChild(container);

        // Pre-load the image to ensure it's in cache before rendering
        const preloadImg = new Image();
        preloadImg.src = "/assets/Home/YQMSLogoEdit.png";

        import("react-dom/client")
          .then(({ createRoot }) => {
            const root = createRoot(container);
            root.render(
              React.createElement(QRCodeCanvas, {
                value: value,
                size: highResSize,
                level: "H",
                includeMargin: true,
                imageSettings: {
                  src: "/assets/Home/YQMSLogoEdit.png",
                  x: undefined,
                  y: undefined,
                  height: highResSize * 0.09,  // Reduced from 0.12 (123px) to 0.09 (92px) for better scannability
                  width: highResSize * 0.09,   // Reduced from 0.12 (123px) to 0.09 (92px) for better scannability
                  excavate: true,
                },
              })
            );

            // Increased timeout to 1000ms to ensure logo finishes loading on slower connections
            setTimeout(() => {
              const canvas = container.querySelector("canvas");
              if (canvas) {
                const dataURL = canvas.toDataURL("image/png");
                root.unmount();
                document.body.removeChild(container);
                resolve(dataURL);
              } else {
                root.unmount();
                document.body.removeChild(container);
                resolve(null);
              }
            }, 1000);
          })
          .catch((error) => {
            console.error("Error importing react-dom/client:", error);
            if (document.body.contains(container)) {
              document.body.removeChild(container);
            }
            resolve(null);
          });
      } catch (error) {
        console.error("Error generating QR code:", error);
        resolve(null);
      }
    });
  }, []);

  // Download QR code as image
  const downloadQRCode = useCallback((reportId) => {
    // Try to find the canvas directly first (more reliable for logo inclusion)
    let canvas = document.querySelector(`#qr-canvas-${reportId}`);

    // Fallback to searching inside the container if it's not found by ID
    if (!canvas) {
      canvas = document.querySelector(`#qr-code-${reportId} canvas`);
    }

    if (canvas) {
      // Direct download from canvas (easiest and most reliable way to get the logo)
      try {
        const downloadUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `QR-Code-Report-${reportId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast.success("QR code downloaded successfully!");
        return;
      } catch (e) {
        console.error("Canvas download failed, falling back to SVG method", e);
      }
    }

    // Fallback: If no canvas is found (e.g., if we were still using SVG), try SVG conversion
    const svg = document.querySelector(`#qr-code-${reportId} svg`);
    if (!svg) {
      showToast.error("QR code not found. Please try again.");
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d");
      const img = new Image();

      const size = 512;
      tempCanvas.width = size;
      tempCanvas.height = size;

      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        URL.revokeObjectURL(svgUrl);

        tempCanvas.toBlob((blob) => {
          if (!blob) {
            showToast.error("Failed to generate QR code image.");
            return;
          }
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = `QR-Code-Report-${reportId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
          showToast.success("QR code downloaded successfully!");
        }, "image/png");
      };

      img.onerror = () => {
        showToast.error("Failed to load QR code image.");
        URL.revokeObjectURL(svgUrl);
      };

      img.src = svgUrl;
    } catch (error) {
      console.error("Error downloading QR code:", error);
      showToast.error("Failed to download QR code. Please try again.");
    }
  }, []);

  // Stop QR Code Scanner
  const stopScanner = useCallback(async () => {
    if (html5QrCodeInstance) {
      try {
        if (html5QrCodeInstance.isScanning) {
          await html5QrCodeInstance.stop();
        }
        await html5QrCodeInstance.clear();
      } catch (error) {
        console.error("Error stopping scanner:", error);
      } finally {
        setHtml5QrCodeInstance(null);
        setScanningReportId(null);
      }
    }
  }, [html5QrCodeInstance]);

  // Initialize QR Code Scanner for a specific report
  const initializeScanner = useCallback(
    async (reportId, onScanSuccess) => {
      try {
        if (html5QrCodeInstance) {
          await html5QrCodeInstance.stop();
          setHtml5QrCodeInstance(null);
        }

        const scannerId = `report-date-scanner-${reportId}`;
        const instance = new Html5Qrcode(scannerId);
        setHtml5QrCodeInstance(instance);
        setScanningReportId(reportId);

        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const backCamera = cameras.find(
            (device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("environment")
          );
          const cameraId = backCamera ? backCamera.id : cameras[0].id;

          await instance.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            async (decodedText) => {
              // Process QR code and call onScanSuccess
              if (onScanSuccess) {
                await onScanSuccess(decodedText, reportId);
              }
            },
            (errorMessage) => {
              // Ignore scan errors (continuous scanning)
            }
          );
        }
      } catch (error) {
        console.error("Error initializing scanner:", error);
        showToast.error(
          "Failed to initialize scanner. Please check camera permissions."
        );
        setShowReportDateScanner(null);
        setScanningReportId(null);
      }
    },
    [html5QrCodeInstance]
  );

  // Handle QR code file upload and scan
  const handleQRCodeFileUpload = useCallback(
    async (event, reportId, onScanSuccess) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showToast.error(
          "Invalid file type. Please upload an image file (PNG, JPG, JPEG, etc.)."
        );
        event.target.value = "";
        return;
      }

      try {
        const tempContainer = document.createElement("div");
        tempContainer.id = "temp-qr-file-scanner";
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        document.body.appendChild(tempContainer);

        const html5QrCode = new Html5Qrcode("temp-qr-file-scanner");
        let decodedText;

        try {
          decodedText = await html5QrCode.scanFile(file, false);
        } catch (scanError) {
          document.body.removeChild(tempContainer);

          if (scanError && scanError.message) {
            if (
              scanError.message.includes("No QR code found") ||
              scanError.message.includes("QR code parse error")
            ) {
              showToast.error(
                "No QR code found in the image. Please make sure the image contains a valid QR code and try again."
              );
            } else {
              showToast.error(
                "Failed to scan QR code. The image may be corrupted or the QR code is not readable. Please try with a clearer image."
              );
            }
          } else {
            showToast.error(
              "Failed to scan QR code from the image. Please ensure the image contains a valid QR code."
            );
          }
          event.target.value = "";
          return;
        }

        document.body.removeChild(tempContainer);

        // Process the scanned QR code
        if (onScanSuccess) {
          await onScanSuccess(decodedText, reportId);
        }
      } catch (error) {
        console.error("Error scanning QR code from file:", error);

        if (error.message && error.message.includes("No QR code")) {
          showToast.error(
            "No QR code found in the image. Please make sure the image contains a valid QR code and try again."
          );
        } else if (error.message && error.message.includes("parse")) {
          showToast.error(
            "Failed to read the QR code. The image may be blurry or the QR code is damaged. Please try with a clearer image."
          );
        } else {
          showToast.error(
            "Failed to scan QR code from file. Please make sure it's a valid QR code image file (PNG, JPG, JPEG) and try again."
          );
        }

        const tempContainer = document.getElementById("temp-qr-file-scanner");
        if (tempContainer) {
          document.body.removeChild(tempContainer);
        }
      } finally {
        event.target.value = "";
      }
    },
    []
  );

  // Process QR scan result
  const processQRScanResult = useCallback(async (decodedText, reportId) => {
    let targetReportId = reportId;
    let isValidQRCode = false;

    // Check if it's a URL format
    if (decodedText.includes("?scan=")) {
      try {
        const url = new URL(decodedText);
        const scanParam = url.searchParams.get("scan");
        if (scanParam) {
          targetReportId = scanParam;
          isValidQRCode = true;
        } else {
          showToast.warning("Invalid QR code. Missing report ID in URL.");
          return null;
        }
      } catch (error) {
        showToast.warning("Invalid QR code URL format.");
        return null;
      }
    } else if (decodedText === "REPORT_DATE_SCAN") {
      targetReportId = reportId;
      isValidQRCode = true;
    } else if (decodedText.startsWith("REPORT_DATE_SCAN:")) {
      const qrReportId = decodedText.split(":")[1];
      if (qrReportId) {
        targetReportId = qrReportId;
        isValidQRCode = true;
      }
    } else {
      showToast.warning(
        "Invalid QR code. Please scan the Report Date QR code."
      );
      return null;
    }

    // Check if the scanned QR code belongs to the current report
    if (isValidQRCode && targetReportId !== reportId) {
      showToast.error(
        "This QR code is from a different report. Please upload the QR code that is displayed in the current modal window."
      );
      return null;
    }

    return targetReportId;
  }, []);

  // Cleanup scanner on unmount or when scanner is closed
  useEffect(() => {
    if (!showReportDateScanner && html5QrCodeInstance) {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [showReportDateScanner, html5QrCodeInstance, stopScanner]);

  // Print QR code as a Stamp/Label - Refined Horizontal Layout (5cm x 4cm)
  const printQRCode = useCallback((reportId) => {
    let canvas = document.querySelector(`#qr-canvas-${reportId}`);
    if (!canvas) {
      canvas = document.querySelector(`#qr-code-${reportId} canvas`);
    }

    if (!canvas) {
      showToast.error("QR code not found for printing.");
      return;
    }

    const qrDataURL = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank", "width=600,height=600");

    if (!printWindow) {
      showToast.error(
        "Pop-up blocked! Please allow pop-ups to print the stamp."
      );
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Stamp - ${reportId}</title>
          <style>
            @page { 
              size: 5cm 4cm; 
              margin: 0; 
            }
            body { 
              margin: 0; 
              padding: 0;
              // width: 5cm;
              // height: 4cm;
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
           
              overflow: hidden; /* Critical for single-page printing */
            }
            .stamp-container {
              border: 1.2px solid #000;
              padding: 1mm 2mm 2mm 2mm;
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
              gap: 2.2mm;
              border-radius: 4px;
            }
            .qr-side {
              flex: 0 0 20mm;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .info-side {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: flex-start;
              height: 100%;
              overflow: hidden;
            }
            .label {
              font-size: 7pt; /* Reduced title size for compact stamp */
              font-weight: 800;
              color: #000;
              text-transform: uppercase;
              line-height: 1.05;
              margin-bottom: 1.4mm;
              border-bottom: 1.4px solid #000;
              padding-bottom: 0.6mm;
              width: 100%;
            }
            .report-id-container {
              width: 100%;
            }
            .id-label {
              font-size: 6.5pt; /* smaller label */
              font-weight: 700;
              color: #4b5563;
              display: block;
              margin-bottom: 0.8mm;
            }
            .report-id {
              font-size: 6pt; /* smaller id text to fit neatly */
              color: #000;
              font-family: 'Courier New', monospace;
              word-break: break-all;
              line-height: 1.2;
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          <div class="stamp-container">
            <div class="qr-side">
              <img src="${qrDataURL}" id="qr-canvas-${reportId}" alt="QR Code" style="width:22mm;height:22mm;background:#fff;padding:2px;object-fit:contain;border-radius:3px;" />
            </div>
            <div class="info-side">
              <div class="label">Washing<br>Test Stamp</div>
              <div class="report-id-container">
                <span class="id-label">REPORT ID:</span>
                <div class="report-id">#${reportId}</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, []);

  return {
    showReportDateQR,
    setShowReportDateQR,
    showReportDateScanner,
    setShowReportDateScanner,
    scanningReportId,
    setScanningReportId,
    generateQRCodeDataURL: generateQRCodeDataURL,
    downloadQRCode: downloadQRCode,
    printQRCode: printQRCode,
    initializeScannerHook: initializeScanner,
    stopScannerHook: stopScanner,
    handleQRCodeFileUploadHook: handleQRCodeFileUpload,
    processQRScanResult,
    statusCheckIntervalRef,
  };
};
