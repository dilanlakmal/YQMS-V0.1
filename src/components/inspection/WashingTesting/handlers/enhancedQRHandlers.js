/**
 * Enhanced QR Scanner Handlers
 * Additional QR scanner functionality
 */

import { API_BASE_URL } from '../../../../../config';
import { parseQRCodeScanResult } from '../helpers';
import showToast from '../../../../utils/toast';

/**
 * Process QR scan result from URL
 * Enhanced handler for QR scan success with status checking
 * @param {string} targetReportId - Target report ID to update
 * @param {function} fetchReports - Function to refresh reports
 * @param {function} setShowReportDateScanner - Scanner modal state setter
 * @param {function} stopScanner - Function to stop scanner
 * @param {object} statusCheckIntervalRef - Ref for status check interval
 * @param {string} receiver_emp_id - Employee ID of user who scanned the QR code
 */
export const processQRScanFromURL = async (
    targetReportId,
    fetchReports,
    setShowReportDateScanner,
    stopScanner,
    statusCheckIntervalRef,
    receiver_emp_id
) => {
    try {
        // Update the report's receivedDate
        const response = await fetch(
            `${API_BASE_URL}/api/report-washing/${targetReportId}/scan-received`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ receiver_emp_id })
            }
        );

        if (response.ok) {
            const result = await response.json();

            if (result.success) {
                showToast.success("Report marked as received via QR scan!");

                // Close scanner
                setShowReportDateScanner(false);
                if (stopScanner) {
                    stopScanner();
                }

                // Start polling for status update
                let checkCount = 0;
                const maxChecks = 10;

                statusCheckIntervalRef.current = setInterval(async () => {
                    checkCount++;

                    try {
                        // Fetch latest reports to check if received date is updated
                        await fetchReports();

                        // Stop checking after max attempts
                        if (checkCount >= maxChecks) {
                            clearInterval(statusCheckIntervalRef.current);
                        }
                    } catch (error) {
                        console.error("Error checking report status:", error);
                        clearInterval(statusCheckIntervalRef.current);
                    }
                }, 1000); // Check every second

                // Clear interval after 10 seconds regardless
                setTimeout(() => {
                    if (statusCheckIntervalRef.current) {
                        clearInterval(statusCheckIntervalRef.current);
                    }
                }, 10000);
            } else {
                showToast.error(result.message || "Failed to update report");
            }
        } else {
            const errorData = await response.json();
            showToast.error(errorData.message || "Failed to update report via QR scan");
        }
    } catch (error) {
        console.error("Error processing QR scan:", error);
        showToast.error("An error occurred while processing the QR scan");
    }
};

/**
 * Handle QR scan success callback
 * @param {string} decodedText - Scanned QR code text
 * @param {string} currentReportId - Current report ID context
 * @param {function} processQRCallback - Callback to process the scan
 * @param {function} stopScanner - Function to stop scanner
 */
export const handleQRScanSuccess = async (
    decodedText,
    currentReportId,
    processQRCallback,
    stopScanner
) => {
    // Parse the QR code
    const scanResult = parseQRCodeScanResult(decodedText, currentReportId);

    if (scanResult.isValid && scanResult.reportId) {
        showToast.info("QR Code scanned successfully! Processing...");

        // Stop scanner
        if (stopScanner) {
            await stopScanner();
        }

        // Process the scan
        await processQRCallback(scanResult.reportId);
    } else {
        showToast.error("Invalid QR code format");
    }
};
