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

        import("react-dom/client").then(({ createRoot }) => {
          const root = createRoot(container);
          root.render(
            React.createElement(QRCodeCanvas, {
              value: value,
              size: highResSize,
              level: "H",
              includeMargin: true,
              imageSettings: {
                src: "/assets/Home/yqms.png",
                x: undefined,
                y: undefined,
                height: highResSize * 0.2, // Proportional logo size
                width: highResSize * 0.2,
                excavate: true,
              }
            })
          );

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
          }, 300);
        }).catch((error) => {
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
        const link = document.createElement('a');
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
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      const img = new Image();

      const size = 512;
      tempCanvas.width = size;
      tempCanvas.height = size;

      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        URL.revokeObjectURL(svgUrl);

        tempCanvas.toBlob((blob) => {
          if (!blob) {
            showToast.error("Failed to generate QR code image.");
            return;
          }
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `QR-Code-Report-${reportId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
          showToast.success("QR code downloaded successfully!");
        }, 'image/png');
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
  const initializeScanner = useCallback(async (reportId, onScanSuccess) => {
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
            qrbox: { width: 250, height: 250 }
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
      showToast.error("Failed to initialize scanner. Please check camera permissions.");
      setShowReportDateScanner(null);
      setScanningReportId(null);
    }
  }, [html5QrCodeInstance]);

  // Handle QR code file upload and scan
  const handleQRCodeFileUpload = useCallback(async (event, reportId, onScanSuccess) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast.error("Invalid file type. Please upload an image file (PNG, JPG, JPEG, etc.).");
      event.target.value = "";
      return;
    }

    try {
      const tempContainer = document.createElement('div');
      tempContainer.id = 'temp-qr-file-scanner';
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);

      const html5QrCode = new Html5Qrcode('temp-qr-file-scanner');
      let decodedText;

      try {
        decodedText = await html5QrCode.scanFile(file, false);
      } catch (scanError) {
        document.body.removeChild(tempContainer);

        if (scanError && scanError.message) {
          if (scanError.message.includes("No QR code found") || scanError.message.includes("QR code parse error")) {
            showToast.error("No QR code found in the image. Please make sure the image contains a valid QR code and try again.");
          } else {
            showToast.error("Failed to scan QR code. The image may be corrupted or the QR code is not readable. Please try with a clearer image.");
          }
        } else {
          showToast.error("Failed to scan QR code from the image. Please ensure the image contains a valid QR code.");
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
        showToast.error("No QR code found in the image. Please make sure the image contains a valid QR code and try again.");
      } else if (error.message && error.message.includes("parse")) {
        showToast.error("Failed to read the QR code. The image may be blurry or the QR code is damaged. Please try with a clearer image.");
      } else {
        showToast.error("Failed to scan QR code from file. Please make sure it's a valid QR code image file (PNG, JPG, JPEG) and try again.");
      }

      const tempContainer = document.getElementById('temp-qr-file-scanner');
      if (tempContainer) {
        document.body.removeChild(tempContainer);
      }
    } finally {
      event.target.value = "";
    }
  }, []);

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
      showToast.warning("Invalid QR code. Please scan the Report Date QR code.");
      return null;
    }

    // Check if the scanned QR code belongs to the current report
    if (isValidQRCode && targetReportId !== reportId) {
      showToast.error("This QR code is from a different report. Please upload the QR code that is displayed in the current modal window.");
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

  return {
    showReportDateQR,
    setShowReportDateQR,
    showReportDateScanner,
    setShowReportDateScanner,
    scanningReportId,
    setScanningReportId,
    generateQRCodeDataURL: generateQRCodeDataURL,
    downloadQRCode: downloadQRCode,
    initializeScannerHook: initializeScanner,
    stopScannerHook: stopScanner,
    handleQRCodeFileUploadHook: handleQRCodeFileUpload,
    processQRScanResult,
    statusCheckIntervalRef,
  };
};

