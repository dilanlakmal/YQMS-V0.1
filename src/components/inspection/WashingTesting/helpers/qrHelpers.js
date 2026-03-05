/**
 * QR Code Helper Functions
 * Utilities for QR code URL generation and parsing
 */

/**
 * Get the base URL for QR codes
 * Uses computer's network IP so phones can access
 * @param {string} QR_CODE_BASE_URL - Base URL from config
 * @returns {string} - Base URL for QR codes
 */
export const getQRCodeBaseURL = (QR_CODE_BASE_URL) => {
  const httpsProtocol = "https:"; // Force HTTPS for QR codes

  if (QR_CODE_BASE_URL) {
    // This ensures QR codes always use HTTPS protocol
    try {
      const url = new URL(QR_CODE_BASE_URL);
      url.protocol = httpsProtocol;
      return url.toString().replace(/\/$/, ""); // Remove trailing slash if present
    } catch (error) {
      // If URL parsing fails, try simple string replacement
      const protocolMatch = QR_CODE_BASE_URL.match(/^https?:\/\//);
      if (protocolMatch) {
        return QR_CODE_BASE_URL.replace(/^https?:\/\//, `${httpsProtocol}//`);
      }
      // Fallback: prepend protocol if missing
      return `${httpsProtocol}//${QR_CODE_BASE_URL.replace(/^\/\//, "")}`;
    }
  }

  const origin = window.location.origin;
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    console.warn(
      "Accessing via localhost - QR codes may not work for network devices. Please set VITE_QR_CODE_BASE_URL in .env file.",
    );
  }
  // Force HTTPS even for window.location.origin
  return origin.replace(/^http:/, "https:");
};

/**
 * Parse QR code scan result
 * Supports multiple formats:
 * 1. URL format: "http://...?scan=REPORT_ID"
 * 2. "REPORT_DATE_SCAN"
 * 3. "REPORT_DATE_SCAN:REPORT_ID"
 * @param {string} decodedText - Scanned QR code text
 * @param {string} currentReportId - Current report ID being scanned for
 * @returns {object} - { isValid: boolean, reportId: string|null, format: string }
 */
export const parseQRCodeScanResult = (decodedText, currentReportId) => {
  let targetReportId = currentReportId;
  let format = "unknown";

  // Check if it's a URL format
  if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
    try {
      const url = new URL(decodedText);
      const scanParam = url.searchParams.get("scan");
      const idQrParam = url.searchParams.get("idQr");
      if (scanParam) {
        targetReportId = scanParam;
        format = "url";
      } else if (idQrParam) {
        // Fallback: some QRs use idQr instead of scan
        targetReportId = idQrParam;
        format = "url_idQr";
      }
    } catch (error) {
      console.error("Error parsing QR URL:", error);
      return { isValid: false, reportId: null, format: "invalid_url" };
    }
  }
  // Check legacy formats
  else if (decodedText.includes(":")) {
    const parts = decodedText.split(":");
    if (parts[0] === "REPORT_DATE_SCAN" && parts[1]) {
      targetReportId = parts[1];
      format = "legacy_with_id";
    }
  } else if (decodedText === "REPORT_DATE_SCAN") {
    format = "legacy_simple";
  }

  return {
    isValid: !!targetReportId,
    reportId: targetReportId,
    format,
  };
};

/**
 * Build QR code URL for a report
 * @param {string} baseURL - Base URL
 * @param {string} reportId - Report ID
 * @returns {string} - Complete QR code URL
 */
export const buildQRCodeURL = (baseURL, reportId) => {
  return `${baseURL}?scan=${reportId}`;
};

/**
 * Build QR code URL with report meta (id qr, date, style, color, size, qty, buyer style, report type)
 * Used for QR download so scanned data includes all key fields.
 * @param {string} baseURL - Base URL (e.g. getQRCodeBaseURL() + '/Launch-washing-machine-test')
 * @param {string} reportId - Report ID (scan param)
 * @param {object} report - Report object (optional); if provided, adds idQr, date, style, color, size, qty, buyerStyle, reportType
 * @returns {string} - URL with query params
 */
export const buildQRCodeURLWithMeta = (baseURL, reportId, report = null) => {
  const path = baseURL.replace(/\/?$/, "") + "/Launch-washing-machine-test";
  const params = new URLSearchParams();
  params.set("scan", reportId);

  if (report) {
    const idQr = report.qrId || reportId;
    params.set("idQr", String(idQr));

    const dateRaw = report.createdAt || report.submittedAt || report.reportDate;
    const dateStr = dateRaw
      ? new Date(dateRaw).toISOString().split("T")[0]
      : "";
    if (dateStr) params.set("date", dateStr);

    const style = report.ymStyle || "";
    if (style) params.set("style", String(style));

    const color = Array.isArray(report.color)
      ? report.color.join(",")
      : report.color
        ? String(report.color)
        : "";
    if (color) params.set("color", color);

    const size = report.size ?? report.sizes ?? report.sizeList;
    const sizeStr = Array.isArray(size)
      ? size.join(",")
      : size != null && size !== ""
        ? String(size)
        : "";
    if (sizeStr) params.set("size", sizeStr);

    const qty = report.qty ?? report.quantity ?? report.qtyTotal;
    if (qty != null && qty !== "") params.set("qty", String(qty));

    const buyerStyle = report.buyerStyle || "";
    if (buyerStyle) params.set("buyerStyle", String(buyerStyle));

    const reportType = report.reportType || "";
    if (reportType) params.set("reportType", String(reportType));
  }

  return `${path}?${params.toString()}`;
};
