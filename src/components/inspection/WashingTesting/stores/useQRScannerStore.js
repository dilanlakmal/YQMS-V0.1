import React from "react";
import { create } from "zustand";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeCanvas } from "qrcode.react";
import { API_BASE_URL, QR_CODE_BASE_URL } from "../../../../../config.js";
import showToast from "../../../../utils/toast.js";
import { getQRCodeBaseURL, parseQRCodeScanResult } from "../helpers/qrHelpers.js";
import { useModalStore } from "./useModalStore.js";
import { useFormStore } from "./useFormStore.js";
import { useOrderDataStore } from "./useOrderDataStore.js";
import { useAssignControlStore, computeUserRoles } from "./useAssignControlStore.js";
import { useWashingReportsStore } from "./useWashingReportsStore.js";

let _statusCheckInterval = null;

const _getBaseURL = () => getQRCodeBaseURL(QR_CODE_BASE_URL);

export const useQRScannerStore = create((set, get) => ({
    html5QrCodeInstance: null,
    scannerFlashOn: false,

    // ─── QR Code Generation (no logo - for download/print) ───────────
    generateQRCodeDataURLNoLogo: async (value, size = 1024) => {
        return new Promise((resolve) => {
            try {
                const container = document.createElement("div");
                container.style.position = "absolute";
                container.style.left = "-9999px";
                container.style.width = `${size}px`;
                container.style.height = `${size}px`;
                container.style.background = "white";
                document.body.appendChild(container);

                import("react-dom/client")
                    .then(({ createRoot }) => {
                        const root = createRoot(container);
                        root.render(
                            React.createElement(QRCodeCanvas, {
                                value,
                                size,
                                level: "H",
                                includeMargin: true,
                            }),
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
                    })
                    .catch((error) => {
                        console.error("Error generating QR code (no logo):", error);
                        if (document.body.contains(container)) document.body.removeChild(container);
                        resolve(null);
                    });
            } catch (error) {
                console.error("Error generating QR code:", error);
                resolve(null);
            }
        });
    },

    // ─── QR Code Generation (with logo - for PDF) ────────────────────
    generateQRCodeDataURL: async (value, size = 100) => {
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

                const preloadImg = new Image();
                preloadImg.src = "/assets/Home/YQMSLogoEdit.png";

                import("react-dom/client")
                    .then(({ createRoot }) => {
                        const root = createRoot(container);
                        root.render(
                            React.createElement(QRCodeCanvas, {
                                value,
                                size: highResSize,
                                level: "H",
                                includeMargin: true,
                                imageSettings: {
                                    src: "/assets/Home/YQMSLogoEdit.png",
                                    x: undefined,
                                    y: undefined,
                                    height: highResSize * 0.09,
                                    width: highResSize * 0.09,
                                    excavate: true,
                                },
                            }),
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
                        }, 1000);
                    })
                    .catch((error) => {
                        console.error("Error importing react-dom/client:", error);
                        if (document.body.contains(container)) document.body.removeChild(container);
                        resolve(null);
                    });
            } catch (error) {
                console.error("Error generating QR code:", error);
                resolve(null);
            }
        });
    },

    // ─── Download QR code as image ────────────────────────────────────
    downloadQRCode: (reportId) => {
        const value = `${_getBaseURL()}/Launch-washing-machine-test?scan=${reportId}`;
        get()
            .generateQRCodeDataURLNoLogo(value, 1024)
            .then((dataURL) => {
                if (!dataURL) {
                    showToast.error("Failed to generate QR code. Please try again.");
                    return;
                }
                try {
                    const link = document.createElement("a");
                    link.href = dataURL;
                    link.download = `QR-Code-Report-${reportId}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast.success("QR code downloaded successfully!");
                } catch (e) {
                    console.error("Download failed:", e);
                    showToast.error("Failed to download QR code. Please try again.");
                }
            });
    },

    // ─── Print QR code as stamp ───────────────────────────────────────
    printQRCode: (reportId) => {
        const value = `${_getBaseURL()}/Launch-washing-machine-test?scan=${reportId}`;
        get()
            .generateQRCodeDataURLNoLogo(value, 1024)
            .then((qrDataURL) => {
                if (!qrDataURL) {
                    showToast.error("Failed to generate QR code for printing.");
                    return;
                }
                const printWindow = window.open("", "_blank", "width=600,height=600");
                if (!printWindow) {
                    showToast.error("Pop-up blocked! Please allow pop-ups to print the stamp.");
                    return;
                }
                printWindow.document.write(`
      <html>
        <head>
          <title>QR Stamp - ${reportId}</title>
          <style>
            @page { size: 5cm 4cm; margin: 0; }
            body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden; }
            .stamp-container { border: 1.2px solid #000; padding: 1mm 2mm 2mm 2mm; display: flex; flex-direction: row; align-items: center; justify-content: center; box-sizing: border-box; gap: 2.2mm; border-radius: 4px; }
            .qr-side { flex: 0 0 20mm; display: flex; align-items: center; justify-content: center; }
            .info-side { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; height: 100%; overflow: hidden; }
            .label { font-size: 7pt; font-weight: 800; color: #000; text-transform: uppercase; line-height: 1.05; margin-bottom: 1.4mm; border-bottom: 1.4px solid #000; padding-bottom: 0.6mm; width: 100%; }
            .report-id-container { width: 100%; }
            .id-label { font-size: 6.5pt; font-weight: 700; color: #4b5563; display: block; margin-bottom: 0.8mm; }
            .report-id { font-size: 6pt; color: #000; font-family: 'Courier New', monospace; word-break: break-all; line-height: 1.2; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="stamp-container">
            <div class="qr-side">
              <img src="${qrDataURL}" alt="QR Code" style="width:22mm;height:22mm;background:#fff;padding:2px;object-fit:contain;border-radius:3px;" />
            </div>
            <div class="info-side">
              <div class="label">Washing<br>Test Stamp</div>
              <div class="report-id-container">
                <span class="id-label">REPORT ID:</span>
                <div class="report-id">#${reportId}</div>
              </div>
            </div>
          </div>
          <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };<\/script>
        </body>
      </html>
    `);
                printWindow.document.close();
            });
    },

    // ─── Scanner control ──────────────────────────────────────────────
    stopScanner: async () => {
        const { html5QrCodeInstance } = get();
        if (html5QrCodeInstance) {
            try {
                if (html5QrCodeInstance.isScanning) await html5QrCodeInstance.stop();
                await html5QrCodeInstance.clear();
            } catch (error) {
                console.error("Error stopping scanner:", error);
            } finally {
                set({ html5QrCodeInstance: null, scannerFlashOn: false });
                useModalStore.getState().setScanningReportId(null);
            }
        }
    },

    toggleScannerFlash: () => {
        const { html5QrCodeInstance } = get();
        if (!html5QrCodeInstance || !html5QrCodeInstance.isScanning) return;
        try {
            const caps = html5QrCodeInstance.getRunningTrackCameraCapabilities?.();
            const torch = caps?.torchFeature?.();
            if (torch) {
                torch.apply?.(!torch.value?.());
                set((s) => ({ scannerFlashOn: !s.scannerFlashOn }));
            }
        } catch (_) {
            /* Torch not supported */
        }
    },

    // Shared handler for processing a scanned/uploaded QR result against a report
    _processQRResult: async (targetReportId, reportId) => {
        const modalStore = useModalStore.getState();
        const formStore = useFormStore.getState();
        const orderStore = useOrderDataStore.getState();

        try {
            const id = targetReportId != null ? String(targetReportId) : "";
            const reportResponse = await fetch(`${API_BASE_URL}/api/report-washing/${id}`);
            if (!reportResponse.ok) {
                if (reportResponse.status === 404)
                    showToast.error("This QR code is from an old or deleted report.");
                else showToast.error("Failed to fetch report details.");
                return;
            }

            const reportResult = await reportResponse.json();
            const currentReport = reportResult.data || reportResult;
            const currentStatus = currentReport.status || "pending";

            if (currentStatus === "pending" || !currentStatus) {
                get().stopScanner();
                modalStore.setShowReportDateScanner(null);
                modalStore.setShowReportDateQR(null);
                modalStore.openReceivedModal(targetReportId);
                modalStore.setShouldUpdateReceivedStatus(true);
                formStore.setActiveTab("reports");
                showToast.success(
                    "QR Scan success! Add images and notes, then save to set status to Received.",
                );
            } else if (currentStatus === "received") {
                get().stopScanner();
                modalStore.setShowReportDateScanner(null);
                modalStore.setShowReportDateQR(null);
                modalStore.setCompletingReport(currentReport);
                formStore.setFormData({
                    ...currentReport,
                    reportType: currentReport.reportType || "Garment Wash Report",
                    color: currentReport.color || [],
                    po: currentReport.po || [],
                    exFtyDate: currentReport.exFtyDate || [],
                    images: [],
                    moNo: currentReport.moNo || currentReport.ymStyle || "",
                });
                if (currentReport.ymStyle) {
                    orderStore.fetchOrderColors(currentReport.ymStyle, formStore.setFormData);
                    orderStore.fetchYorksysOrderETD(currentReport.ymStyle, formStore.setFormData);
                }
                formStore.setActiveTab("form");
            } else if (currentStatus === "completed") {
                showToast.info("This report is already completed.");
                get().stopScanner();
                modalStore.setShowReportDateScanner(null);
                modalStore.setShowReportDateQR(null);
                formStore.setActiveTab("reports");

                setTimeout(() => {
                    const el = document.querySelector(`[data-report-id="${targetReportId}"]`);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 200);
            } else {
                showToast.warning(`Report status is "${currentStatus}". Cannot process.`);
                modalStore.setShowReportDateQR(null);
                modalStore.setShowReportDateScanner(null);
                formStore.setActiveTab("reports");
            }
        } catch (error) {
            console.error("Error processing QR scan:", error);
            showToast.error("Failed to process QR code scan. Please try again.");
            modalStore.setShowReportDateQR(null);
            modalStore.setShowReportDateScanner(null);
        }
    },

    initializeScanner: async (reportId) => {
        const { _currentUser, causeAssignHistory } = useAssignControlStore.getState();
        const { isAdminUser, isWarehouseUser } = computeUserRoles(_currentUser, causeAssignHistory);
        const modalStore = useModalStore.getState();

        try {
            const { html5QrCodeInstance: prevInstance } = get();
            if (prevInstance) {
                await prevInstance.stop();
                set({ html5QrCodeInstance: null });
            }

            const scannerId = `report-date-scanner-${reportId}`;
            const instance = new Html5Qrcode(scannerId, { verbose: false });
            set({ html5QrCodeInstance: instance });
            modalStore.setScanningReportId(reportId);

            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
                const backCamera = cameras.find(
                    (d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("environment"),
                );
                const cameraId = backCamera ? backCamera.id : cameras[0].id;

                await instance.start(
                    cameraId,
                    {
                        fps: 20,
                        qrbox: (vw, vh) => {
                            const min = Math.min(vw, vh);
                            const s = Math.floor(min * 0.7);
                            return { width: s, height: s };
                        },
                        aspectRatio: 1.0,
                        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
                    },
                    async (decodedText) => {
                        if (!isAdminUser && !isWarehouseUser) {
                            showToast.warning(
                                "You are not assigned to scan reports. Only assigned users can complete this action.",
                            );
                            return;
                        }

                        let targetReportId = reportId;
                        if (decodedText.includes("?scan=")) {
                            try {
                                const url = new URL(decodedText);
                                const scanParam = url.searchParams.get("scan");
                                if (scanParam) targetReportId = scanParam;
                                else {
                                    showToast.warning("Invalid QR code. Missing report ID in URL.");
                                    return;
                                }
                            } catch {
                                showToast.warning("Invalid QR code URL format.");
                                return;
                            }
                        } else if (decodedText === "REPORT_DATE_SCAN") {
                            targetReportId = reportId;
                        } else if (decodedText.startsWith("REPORT_DATE_SCAN:")) {
                            const qrReportId = decodedText.split(":")[1];
                            if (qrReportId) targetReportId = qrReportId;
                        } else {
                            showToast.warning("Invalid QR code. Please scan the Report Date QR code.");
                            return;
                        }

                        await get()._processQRResult(targetReportId, reportId);
                    },
                    () => {
                        /* Ignore continuous scan errors */
                    },
                );
            }
        } catch (error) {
            console.error("Error initializing scanner:", error);
            showToast.error("Failed to initialize scanner. Please check camera permissions.");
            modalStore.setShowReportDateScanner(null);
            modalStore.setScanningReportId(null);
        }
    },

    handleQRCodeFileUpload: async (event, reportId) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const { _currentUser, causeAssignHistory } = useAssignControlStore.getState();
        const { isAdminUser, isWarehouseUser } = computeUserRoles(_currentUser, causeAssignHistory);

        if (!isAdminUser && !isWarehouseUser) {
            showToast.error("You are not assigned to scan reports. Only assigned users can complete this action.");
            event.target.value = "";
            return;
        }
        if (!file.type.startsWith("image/")) {
            showToast.error("Invalid file type. Please upload an image file (PNG, JPG, JPEG, etc.).");
            event.target.value = "";
            return;
        }

        const processResult = async (decodedText) => {
            const result = parseQRCodeScanResult(decodedText, reportId);
            if (!result.isValid) {
                if (result.format === "invalid_url" || result.format === "unknown")
                    showToast.warning("This QR code is not valid. Please upload the QR code that is displayed in the current modal window.");
                else showToast.warning("Invalid QR code format.");
                return;
            }
            if (result.reportId !== reportId) {
                showToast.error("This QR code is from a different report. Please upload the QR code that is displayed in the current modal window.");
                return;
            }
            await get()._processQRResult(result.reportId, reportId);
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
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
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

            showToast.error("Failed to scan QR code. The image may be corrupted or the QR code is not readable.");
        } catch (error) {
            console.error("Error in QR scan process:", error);
            showToast.error("An error occurred while scanning. Please try again.");
        } finally {
            event.target.value = "";
        }
    },

    processQRScanFromURL: async (targetReportId) => {
        if (!targetReportId) return;
        const { _currentUser, causeAssignHistory } = useAssignControlStore.getState();
        const { isAdminUser, isWarehouseUser } = computeUserRoles(_currentUser, causeAssignHistory);
        if (!isAdminUser && !isWarehouseUser) {
            showToast.error("You are not assigned to scan reports. Only assigned users can complete this action.");
            return;
        }
        showToast.info("Processing QR code...");
        await get()._processQRResult(targetReportId, targetReportId);
    },

    // ─── Polling helpers (called from page effects) ───────────────────
    clearStatusInterval: () => {
        if (_statusCheckInterval) {
            clearInterval(_statusCheckInterval);
            _statusCheckInterval = null;
        }
    },

    startStatusPolling: (reportId, initialStatus, reports) => {
        get().clearStatusInterval();
        let currentKnownStatus = initialStatus;
        _statusCheckInterval = setInterval(async () => {
            try {
                const id = reportId != null ? String(reportId) : "";
                const response = await fetch(`${API_BASE_URL}/api/report-washing/${id}`);
                if (response.ok) {
                    const result = await response.json();
                    const report = result.data || result;
                    const newStatus = report.status || "pending";

                    if (newStatus !== currentKnownStatus) {
                        get().clearStatusInterval();
                        useModalStore.getState().setShowReportDateQR(null);
                        useModalStore.getState().setShowReportDateScanner(null);
                        showToast.success(`✓ QR Scanned! Report status updated to "${newStatus}"`);
                        await useWashingReportsStore.getState().fetchReports("standard");
                        useFormStore.getState().setActiveTab("reports");

                        setTimeout(() => {
                            const el = document.querySelector(`[data-report-id="${reportId}"]`);
                            if (el) {
                                el.scrollIntoView({ behavior: "smooth", block: "center" });
                                el.style.transition = "background-color 0.5s ease";
                                el.style.backgroundColor = "#d4edda";
                                setTimeout(() => {
                                    el.style.backgroundColor = "";
                                }, 2000);
                            }
                        }, 200);
                    }
                }
            } catch (error) {
                console.error("[QR Polling] Error checking report status:", error);
            }
        }, 2000);
    },
}));
