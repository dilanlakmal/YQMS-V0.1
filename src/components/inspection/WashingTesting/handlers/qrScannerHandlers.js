/**
 * QR Scanner Handlers
 * Centralized QR scanner logic for washing machine tests
 */

import { Html5Qrcode } from "html5-qrcode";
import { parseQRCodeScanResult } from '../helpers';
import showToast from '../../../../utils/toast';

/**
 * Initialize QR Code Scanner for a specific report
 * @param {string} reportId - Report ID to scan for
 * @param {function} setHtml5QrCodeInstance - State setter for scanner instance
 * @param {function} setScanningReportId - State setter for scanning report ID
 * @param {function} processQRScanFromURLCallback - Callback to process scan result
 * @returns {Promise<Html5Qrcode|null>} - Scanner instance or null
 */
export const initializeQRScanner = async (
    reportId,
    setHtml5QrCodeInstance,
    setScanningReportId,
    processQRScanFromURLCallback
) => {
    try {
        const scannerId = `report-date-scanner-${reportId}`;
        const instance = new Html5Qrcode(scannerId, { verbose: false });
        setHtml5QrCodeInstance(instance);
        setScanningReportId(reportId);

        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
            // Prefer back camera
            const backCamera = cameras.find(
                (device) =>
                    device.label.toLowerCase().includes("back") ||
                    device.label.toLowerCase().includes("environment")
            );
            const cameraId = backCamera ? backCamera.id : cameras[0].id;

            await instance.start(
                cameraId,
                {
                    fps: 20,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                        const qrboxSize = Math.floor(minEdgeSize * 0.7);
                        return {
                            width: qrboxSize,
                            height: qrboxSize
                        };
                    },
                    aspectRatio: 1.0,
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    }
                },
                async (decodedText) => {
                    // Parse QR code
                    const scanResult = parseQRCodeScanResult(decodedText, reportId);

                    if (scanResult.isValid && scanResult.reportId) {
                        showToast.info("QR Code scanned successfully! Processing...");

                        // Stop scanner
                        await instance.stop();
                        setHtml5QrCodeInstance(null);

                        // Process the scan
                        await processQRScanFromURLCallback(scanResult.reportId);
                    } else {
                        showToast.error("Invalid QR code format");
                    }
                },
                (errorMessage) => {
                    // Silent error - scanning in progress
                }
            );

            return instance;
        } else {
            showToast.error("No cameras found");
            return null;
        }
    } catch (error) {
        console.error("Error initializing scanner:", error);
        showToast.error("Failed to initialize camera");
        setHtml5QrCodeInstance(null);
        return null;
    }
};

/**
 * Stop QR scanner
 * @param {Html5Qrcode} instance - Scanner instance
 * @param {function} setHtml5QrCodeInstance - State setter
 */
export const stopQRScanner = async (instance, setHtml5QrCodeInstance) => {
    if (instance) {
        try {
            await instance.stop();
            setHtml5QrCodeInstance(null);
        } catch (error) {
            console.error("Error stopping scanner:", error);
        }
    }
};

/**
 * Handle QR code file upload and scan
 * @param {Event} event - File input event
 * @param {string} reportId - Report ID to scan for
 * @param {function} processQRScanFromURLCallback - Callback to process scan
 */
export const handleQRCodeFileUpload = async (
    event,
    reportId,
    processQRScanFromURLCallback
) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        const html5QrCode = new Html5Qrcode("qr-code-file-reader");

        const result = await html5QrCode.scanFile(file, true);

        // Parse QR code
        const scanResult = parseQRCodeScanResult(result, reportId);

        if (scanResult.isValid && scanResult.reportId) {
            showToast.info("QR Code scanned successfully! Processing...");
            await processQRScanFromURLCallback(scanResult.reportId);
        } else {
            showToast.error("Invalid QR code format");
        }
    } catch (error) {
        console.error("Error scanning QR code from file:", error);
        showToast.error("Failed to scan QR code. The image may be corrupted or the QR code is not readable.");
    }

    // Clear the input
    if (event.target) {
        event.target.value = "";
    }
};
