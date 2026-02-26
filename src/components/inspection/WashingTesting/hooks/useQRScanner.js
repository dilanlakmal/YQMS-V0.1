import { useState, useCallback, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { API_BASE_URL } from "../../../../../config.js";
import showToast from "../../../../utils/toast.js";
import { useModalStore } from "../stores/useModalStore.js";
import { useFormStore } from "../stores/useFormStore.js";
import { useWashingReportsStore } from "../stores/useWashingReportsStore.js";
import { parseQRCodeScanResult } from "../helpers/qrHelpers.js";

/**
 * Custom hook encapsulating all QR scanner logic:
 * - Live camera scanning (init, stop, flash toggle)
 * - QR code file upload scanning
 * - URL-based QR scan processing (?scan= param)
 * - Status polling while QR modal is open
 * - Auto-close QR modal when report status changes
 */
export const useQRScanner = ({
  isAdminUser,
  isWarehouseUser,
  fetchOrderColors,
  fetchYorksysOrderETD,
  refreshAllReports,
  statusCheckIntervalRef,
  searchParams,
  setSearchParams,
}) => {
  const [html5QrCodeInstance, setHtml5QrCodeInstance] = useState(null);
  const [scannerFlashOn, setScannerFlashOn] = useState(false);

  const {
    openReceivedModal,
    setShouldUpdateReceivedStatus,
    showReportDateQR,
    setShowReportDateQR,
    showReportDateScanner,
    setShowReportDateScanner,
    setScanningReportId,
    setCompletingReport,
  } = useModalStore();

  const { setFormData, setActiveTab } = useFormStore();
  const {
    standard: { reports },
    fetchReports: _fetchReports,
  } = useWashingReportsStore();

  const fetchReports = useCallback(
    (f) => _fetchReports("standard", f),
    [_fetchReports],
  );

  // ─── Stop QR Code Scanner ──────────────────────────────────────────
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
        setScannerFlashOn(false);
      }
    }
  }, [html5QrCodeInstance, setScanningReportId]);

  // ─── Toggle scanner torch/flash ────────────────────────────────────
  const toggleScannerFlash = useCallback(() => {
    if (!html5QrCodeInstance || !html5QrCodeInstance.isScanning) return;
    try {
      const caps = html5QrCodeInstance.getRunningTrackCameraCapabilities?.();
      const torch = caps?.torchFeature?.();
      if (torch) {
        torch.apply?.(!torch.value?.());
        setScannerFlashOn((prev) => !prev);
      }
    } catch (_) {
      // Torch not supported on this device/browser
    }
  }, [html5QrCodeInstance]);

  // ─── Initialize QR Code Scanner for a specific report ──────────────
  const initializeScanner = async (reportId) => {
    try {
      if (html5QrCodeInstance) {
        await html5QrCodeInstance.stop();
        setHtml5QrCodeInstance(null);
      }

      const scannerId = `report-date-scanner-${reportId}`;
      const instance = new Html5Qrcode(scannerId, { verbose: false });
      setHtml5QrCodeInstance(instance);
      setScanningReportId(reportId);

      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        const backCamera = cameras.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("environment"),
        );
        const cameraId = backCamera ? backCamera.id : cameras[0].id;

        await instance.start(
          cameraId,
          {
            fps: 20,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdgeSize * 0.7);
              return { width: qrboxSize, height: qrboxSize };
            },
            aspectRatio: 1.0,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true,
            },
          },
          async (decodedText) => {
            let targetReportId = reportId;

            if (!isAdminUser && !isWarehouseUser) {
              showToast.warning(
                "You are not assigned to scan reports. Only assigned users can complete this action.",
              );
              return;
            }

            if (decodedText.includes("?scan=")) {
              try {
                const url = new URL(decodedText);
                const scanParam = url.searchParams.get("scan");
                if (scanParam) {
                  targetReportId = scanParam;
                } else {
                  showToast.warning(
                    "Invalid QR code. Missing report ID in URL.",
                  );
                  return;
                }
              } catch (error) {
                showToast.warning("Invalid QR code URL format.");
                return;
              }
            } else if (decodedText === "REPORT_DATE_SCAN") {
              targetReportId = reportId;
            } else if (decodedText.startsWith("REPORT_DATE_SCAN:")) {
              const qrReportId = decodedText.split(":")[1];
              if (qrReportId) {
                targetReportId = qrReportId;
              }
            } else {
              showToast.warning(
                "Invalid QR code. Please scan the Report Date QR code.",
              );
              return;
            }

            try {
              const reportResponse = await fetch(
                `${API_BASE_URL}/api/report-washing/${targetReportId}`,
              );
              if (!reportResponse.ok) {
                showToast.error("Failed to fetch report details.");
                return;
              }

              const reportResult = await reportResponse.json();
              const currentReport = reportResult.data || reportResult;
              const currentStatus = currentReport.status || "pending";

              if (currentStatus === "pending" || !currentStatus) {
                stopScanner();
                setShowReportDateScanner(null);
                setShowReportDateQR(null);
                openReceivedModal(targetReportId);
                setShouldUpdateReceivedStatus(true);
                setActiveTab("reports");
                showToast.success(
                  "QR Scan success! Add images and notes, then save to set status to Received.",
                );
              } else if (currentStatus === "received") {
                stopScanner();
                setShowReportDateScanner(null);
                setShowReportDateQR(null);
                setCompletingReport(currentReport);
                setFormData({
                  ...currentReport,
                  reportType:
                    currentReport.reportType || "Garment Wash Report",
                  color: currentReport.color || [],
                  po: currentReport.po || [],
                  exFtyDate: currentReport.exFtyDate || [],
                  images: [],
                  moNo:
                    currentReport.moNo || currentReport.ymStyle || "",
                });
                if (currentReport.ymStyle) {
                  fetchOrderColors(currentReport.ymStyle, setFormData);
                  fetchYorksysOrderETD(currentReport.ymStyle, setFormData);
                }
                setActiveTab("form");
              } else if (currentStatus === "completed") {
                showToast.info("This report is already completed.");
                stopScanner();
                setShowReportDateScanner(null);
                setActiveTab("reports");
              } else {
                showToast.warning(
                  `Report status is "${currentStatus}". Cannot process.`,
                );
                setActiveTab("reports");
              }
            } catch (error) {
              console.error("Error processing QR scan:", error);
              showToast.error(
                "Failed to process QR code scan. Please try again.",
              );
            }
          },
          (errorMessage) => {
            // Ignore scan errors (continuous scanning)
          },
        );
      }
    } catch (error) {
      console.error("Error initializing scanner:", error);
      showToast.error(
        "Failed to initialize scanner. Please check camera permissions.",
      );
      setShowReportDateScanner(null);
      setScanningReportId(null);
    }
  };

  // ─── Handle QR code file upload and scan ───────────────────────────
  const handleQRCodeFileUpload = async (event, reportId) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isAdminUser && !isWarehouseUser) {
      showToast.error(
        "You are not assigned to scan reports. Only assigned users can complete this action.",
      );
      event.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast.error(
        "Invalid file type. Please upload an image file (PNG, JPG, JPEG, etc.).",
      );
      event.target.value = "";
      return;
    }

    const processResult = async (decodedText) => {
      const result = parseQRCodeScanResult(decodedText, reportId);

      if (!result.isValid) {
        if (result.format === "invalid_url" || result.format === "unknown") {
          showToast.warning(
            "This QR code is not valid. Please upload the QR code that is displayed in the current modal window.",
          );
        } else {
          showToast.warning("Invalid QR code format.");
        }
        return;
      }

      const targetReportId = result.reportId;

      if (targetReportId !== reportId) {
        showToast.error(
          "This QR code is from a different report. Please upload the QR code that is displayed in the current modal window.",
        );
        return;
      }

      let reportResponse;
      try {
        reportResponse = await fetch(
          `${API_BASE_URL}/api/report-washing/${targetReportId}`,
        );
        if (!reportResponse.ok) {
          if (reportResponse.status === 404) {
            showToast.error(
              "This QR code is from an old or deleted report. Please upload the QR code that is displayed in the current modal window.",
            );
          } else {
            showToast.error("Unable to verify the report. Please try again.");
          }
          return;
        }
      } catch (fetchError) {
        console.error("Error fetching report:", fetchError);
        showToast.error(
          "Network error. Failed to verify the report. Please check your connection and try again.",
        );
        return;
      }

      const reportResult = await reportResponse.json();
      const currentReport = reportResult.data || reportResult;
      const currentStatus = currentReport.status || "pending";

      if (currentStatus === "pending" || !currentStatus) {
        setShowReportDateQR(null);
        openReceivedModal(targetReportId);
        setShouldUpdateReceivedStatus(true);
        setActiveTab("reports");
        showToast.success(
          "QR Scan success! Add images and notes, then save to set status to Received.",
        );
      } else if (currentStatus === "received") {
        setShowReportDateQR(null);
        setCompletingReport(currentReport);
        setFormData({
          ...currentReport,
          reportType: currentReport.reportType || "Garment Wash Report",
          color: currentReport.color || [],
          po: currentReport.po || [],
          exFtyDate: currentReport.exFtyDate || [],
          images: [],
          moNo: currentReport.moNo || currentReport.ymStyle || "",
        });
        if (currentReport.ymStyle) {
          fetchOrderColors(currentReport.ymStyle, setFormData);
          fetchYorksysOrderETD(currentReport.ymStyle, setFormData);
        }
        setActiveTab("form");
      } else if (currentStatus === "completed") {
        showToast.info("This report is already completed.");
        setShowReportDateQR(null);
        setActiveTab("reports");
      } else {
        showToast.warning(
          `Report status is "${currentStatus}". Cannot process.`,
        );
        setShowReportDateQR(null);
        setActiveTab("reports");
      }
    };

    try {
      const tempContainer = document.createElement("div");
      tempContainer.id = "temp-qr-file-scanner";
      tempContainer.style.display = "none";
      document.body.appendChild(tempContainer);

      const html5QrCode = new Html5Qrcode("temp-qr-file-scanner");
      try {
        const decodedText = await html5QrCode.scanFile(file, false);
        document.body.removeChild(tempContainer);
        await processResult(decodedText);
        event.target.value = "";
        return;
      } catch (scanError) {
        document.body.removeChild(tempContainer);
        console.warn("Html5Qrcode failed, trying fallback...", scanError);
      }

      try {
        const jsQR = (await import("jsqr")).default;

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = objectUrl;
        });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        URL.revokeObjectURL(objectUrl);

        if (code) {
          await processResult(code.data);
          event.target.value = "";
          return;
        }
      } catch (fallbackError) {
        console.error("Fallback scan failed:", fallbackError);
      }

      showToast.error(
        "Failed to scan QR code. The image may be corrupted or the QR code is not readable.",
      );
    } catch (error) {
      console.error("Error in QR scan process:", error);
      showToast.error("An error occurred while scanning. Please try again.");
    } finally {
      event.target.value = "";
    }
  };

  // ─── Process QR scan from URL (?scan= parameter) ──────────────────
  const processQRScanFromURL = async (targetReportId) => {
    if (!targetReportId) return;
    if (!isAdminUser && !isWarehouseUser) {
      showToast.error(
        "You are not assigned to scan reports. Only assigned users can complete this action.",
      );
      return;
    }

    try {
      showToast.info("Processing QR code...");

      const reportResponse = await fetch(
        `${API_BASE_URL}/api/report-washing/${targetReportId}`,
      );
      if (!reportResponse.ok) {
        showToast.error("Failed to fetch report details.");
        return;
      }

      const reportResult = await reportResponse.json();
      const currentReport = reportResult.data || reportResult;
      const currentStatus = currentReport.status || "pending";

      if (currentStatus === "pending" || !currentStatus) {
        setShowReportDateQR(null);
        setShowReportDateScanner(null);
        if (html5QrCodeInstance) {
          try {
            await html5QrCodeInstance.stop();
            setHtml5QrCodeInstance(null);
          } catch (err) {
            console.log("Scanner already stopped");
          }
        }
        setScanningReportId(null);
        openReceivedModal(targetReportId);
        setShouldUpdateReceivedStatus(true);
        setActiveTab("reports");
        showToast.success(
          "QR Scan success! Add images and notes, then save to set status to Received.",
        );
      } else if (currentStatus === "received") {
        setShowReportDateQR(null);
        setShowReportDateScanner(null);
        if (html5QrCodeInstance) {
          try {
            await html5QrCodeInstance.stop();
            setHtml5QrCodeInstance(null);
          } catch (err) {
            console.log("Scanner already stopped");
          }
        }
        setScanningReportId(null);
        setCompletingReport(currentReport);
        setFormData({
          ...currentReport,
          reportType: currentReport.reportType || "Garment Wash Report",
          color: currentReport.color || [],
          po: currentReport.po || [],
          exFtyDate: currentReport.exFtyDate || [],
          images: [],
          moNo: currentReport.moNo || currentReport.ymStyle || "",
        });
        if (currentReport.ymStyle) {
          fetchOrderColors(currentReport.ymStyle, setFormData);
          fetchYorksysOrderETD(currentReport.ymStyle, setFormData);
        }
        setActiveTab("form");
      } else if (currentStatus === "completed") {
        setShowReportDateQR(null);
        setShowReportDateScanner(null);

        showToast.info("This report is already completed.");
        setActiveTab("reports");

        setTimeout(() => {
          const reportElement = document.querySelector(
            `[data-report-id="${targetReportId}"]`,
          );
          if (reportElement) {
            reportElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 200);
      } else {
        setShowReportDateQR(null);
        setShowReportDateScanner(null);

        showToast.warning(
          `Report status is "${currentStatus}". Cannot process.`,
        );
        setActiveTab("reports");
      }
    } catch (error) {
      console.error("Error processing QR scan:", error);
      showToast.error("Failed to process QR code scan. Please try again.");

      setShowReportDateQR(null);
      setShowReportDateScanner(null);
    }
  };

  // ─── Effect: Cleanup scanner on unmount or when scanner is closed ──
  useEffect(() => {
    if (!showReportDateScanner && html5QrCodeInstance) {
      stopScanner();
    }
    return () => {
      if (html5QrCodeInstance) {
        stopScanner();
      }
    };
  }, [showReportDateScanner, html5QrCodeInstance, stopScanner]);

  // ─── Effect: Auto-close QR modal when status changes (polled) ─────
  useEffect(() => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }

    if (showReportDateQR) {
      const reportId = showReportDateQR;

      const currentReport = reports.find(
        (r) => r._id === reportId || r.id === reportId,
      );
      const initialStatus = currentReport?.status || "pending";

      console.log(
        `[QR Polling] Started for report ${reportId}, initial status: ${initialStatus}`,
      );

      let currentKnownStatus = initialStatus;

      statusCheckIntervalRef.current = setInterval(async () => {
        try {
          console.log(
            `[QR Polling] Checking status for report ${reportId}...`,
          );

          const response = await fetch(
            `${API_BASE_URL}/api/report-washing/${reportId}`,
          );
          if (response.ok) {
            const result = await response.json();
            const report = result.data || result;
            const newStatus = report.status || "pending";

            console.log(
              `[QR Polling] Current status: ${currentKnownStatus}, New status: ${newStatus}`,
            );

            if (newStatus !== currentKnownStatus) {
              console.log(
                `[QR Polling] ✓ Status changed from ${currentKnownStatus} to ${newStatus} - closing QR modal`,
              );

              if (statusCheckIntervalRef.current) {
                clearInterval(statusCheckIntervalRef.current);
                statusCheckIntervalRef.current = null;
              }

              setShowReportDateQR(null);
              setShowReportDateScanner(null);

              showToast.success(
                `✓ QR Scanned! Report status updated to "${newStatus}"`,
              );

              await fetchReports();

              setActiveTab("reports");

              setTimeout(() => {
                const reportElement = document.querySelector(
                  `[data-report-id="${reportId}"]`,
                );
                if (reportElement) {
                  reportElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  reportElement.style.transition =
                    "background-color 0.5s ease";
                  reportElement.style.backgroundColor = "#d4edda";
                  setTimeout(() => {
                    reportElement.style.backgroundColor = "";
                  }, 2000);
                }
              }, 200);
            } else {
              console.log(
                `[QR Polling] No status change detected, continuing to poll...`,
              );
            }
          } else {
            console.error(
              `[QR Polling] Failed to fetch report: ${response.status}`,
            );
          }
        } catch (error) {
          console.error("[QR Polling] Error checking report status:", error);
        }
      }, 2000);
    }

    return () => {
      if (statusCheckIntervalRef.current) {
        console.log("[QR Polling] Cleanup - stopping interval");
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    };
  }, [showReportDateQR, reports]); // eslint-disable-line

  // ─── Effect: Handle URL-based QR code scan ─────────────────────────
  useEffect(() => {
    const scanReportId = searchParams.get("scan");
    if (!scanReportId) return;
    setActiveTab("reports");
    processQRScanFromURL(scanReportId);
    setSearchParams({});
  }, [searchParams]); // eslint-disable-line

  // ─── Effect: Close QR modal if report becomes completed ────────────
  useEffect(() => {
    if (showReportDateQR) {
      const report = reports.find(
        (r) => r._id === showReportDateQR || r.id === showReportDateQR,
      );
      if (report && report.status === "completed") {
        setShowReportDateQR(null);
      }
    }
  }, [reports, showReportDateQR, setShowReportDateQR]);

  return {
    html5QrCodeInstance,
    scannerFlashOn,
    initializeScanner,
    stopScanner,
    toggleScannerFlash,
    handleQRCodeFileUpload,
    processQRScanFromURL,
  };
};
