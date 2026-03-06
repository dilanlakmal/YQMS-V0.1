import React, { useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { API_BASE_URL, QR_CODE_BASE_URL } from "../../../../../config.js";
import showToast from "../../../../utils/toast.js";
import { useFormStore } from "../stores/useFormStore.js";
import { useWashingReportsStore } from "../stores/useWashingReportsStore.js";
import { useAssignControlStore } from "../stores/useAssignControlStore.js";
import WashingMachineTestPDF from "../WashingMachineTestPDF";
import generateWashingMachineTestExcel from "../WashingMachineTestExcel";
import { getQRCodeBaseURL } from "../helpers/qrHelpers.js";

/**
 * Custom hook encapsulating report export logic:
 * - Print PDF (via hidden iframe)
 * - Download PDF
 * - Export Excel
 * - QR code data URL generation wrapper
 */
export const useReportExport = ({
  savedImageRotations,
  generateQRCodeDataURLHook,
}) => {
  const { activeTab } = useFormStore();
  const { setPrintingReportId: _setPrintingReportId } =
    useWashingReportsStore();
  const { users } = useAssignControlStore();

  const setPrintingReportId = useCallback(
    (id) => _setPrintingReportId("standard", id),
    [_setPrintingReportId],
  );
  const setWhPrintingReportId = useCallback(
    (id) => _setPrintingReportId("warehouse", id),
    [_setPrintingReportId],
  );

  // Access printingReportId from store snapshot (avoids subscribing to full state)
  const getPrintingReportId = () => {
    const state = useWashingReportsStore.getState();
    return activeTab === "warehouse_reports"
      ? state.warehouse.printingReportId
      : state.standard.printingReportId;
  };

  const generateQRCodeDataURL = async (value, size = 100) => {
    return generateQRCodeDataURLHook(value, size);
  };

  const handlePrintPDF = async (report) => {
    const reportId = report._id || report.id;

    const currentPrintingId = getPrintingReportId();
    const currentSetPrintingId =
      activeTab === "warehouse_reports"
        ? setWhPrintingReportId
        : setPrintingReportId;

    if (currentPrintingId === reportId) {
      return;
    }

    currentSetPrintingId(reportId);

    try {
      const qrCodeValue = `${getQRCodeBaseURL(QR_CODE_BASE_URL)}/Launch-washing-machine-test?scan=${reportId}`;
      const qrCodeDataURL = await generateQRCodeDataURL(qrCodeValue, 100);

      const blob = await pdf(
        React.createElement(WashingMachineTestPDF, {
          report,
          apiBaseUrl: API_BASE_URL,
          qrCodeDataURL,
          savedImageRotations,
          users,
        }),
      ).toBlob();
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;border:none;";
      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (printError) {
          console.error("Error calling print:", printError);
          showToast.error(
            "Print failed. Use the PDF button to download and print manually.",
          );
        }
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch (e) {
            /* ignore */
          }
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            /* ignore */
          }
        }, 60000);
      };

      iframe.src = url;
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast.error("Failed to generate PDF. Please try again.");
    } finally {
      setTimeout(() => {
        currentSetPrintingId(null);
      }, 3000);
    }
  };

  const handleDownloadPDF = async (report) => {
    try {
      const reportId = report._id || report.id;
      const qrCodeValue = `REPORT_DATE_SCAN:${reportId}`;
      const qrCodeDataURL = await generateQRCodeDataURL(qrCodeValue, 100);

      const blob = await pdf(
        React.createElement(WashingMachineTestPDF, {
          report,
          apiBaseUrl: API_BASE_URL,
          qrCodeDataURL,
          savedImageRotations,
          users,
        }),
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Washing_Test_Report_${report.ymStyle || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);

      showToast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast.error("Failed to generate PDF. Please try again.");
    }
  };

  const handleExportExcel = async (report) => {
    try {
      await generateWashingMachineTestExcel(report, API_BASE_URL, users);
      showToast.success("Excel file downloaded successfully!");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      showToast.error("Failed to export Excel. Please try again.");
    }
  };

  return {
    generateQRCodeDataURL,
    handlePrintPDF,
    handleDownloadPDF,
    handleExportExcel,
  };
};
