import React from "react";
import { create } from "zustand";
import { pdf } from "@react-pdf/renderer";
import { API_BASE_URL, QR_CODE_BASE_URL } from "../../../../../config.js";
import showToast from "../../../../utils/toast.js";
import { PRINT_WASH_TEST_DEFAULTS, EMB_PRINT_WASH_TEST_DEFAULTS } from "../constants/reportTypes.js";
import WashingMachineTestPDF from "../WashingMachineTestPDF";
import generateWashingMachineTestExcel from "../WashingMachineTestExcel";
import { getQRCodeBaseURL } from "../helpers/qrHelpers.js";
import { useFormStore } from "./useFormStore.js";
import { useAssignControlStore } from "./useAssignControlStore.js";
import { useImageStore } from "./useImageStore.js";
import { useWashingFilterStore } from "./useWashingFilterStore.js";
import { useOrderDataStore } from "./useOrderDataStore.js";
import { useModalStore } from "./useModalStore.js";
import { useQRScannerStore } from "./useQRScannerStore.js";

const defaultTabState = () => ({
    reports: [],
    isLoading: false,
    expandedReports: new Set(),
    printingReportId: null,
    pagination: {
        totalRecords: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10,
    },
});

const getCompletionNotesField = (reportType) => {
    switch (reportType) {
        case "Home Wash Test":
            return "completionNotes_HomeWash";
        case "HT Testing":
            return "completionNotes_HTTesting";
        case "EMB/Printing Testing":
            return "completionNotes_EMBPrinting";
        case "Pulling Test":
            return "completionNotes_Pulling";
        default:
            return "completionNotes";
    }
};

export const useWashingReportsStore = create((set, get) => ({
    standard: defaultTabState(),
    warehouse: defaultTabState(),
    easy_scan: defaultTabState(),

    // ─── Fetch ────────────────────────────────────────────────────────
    fetchReports: async (tab, filters = {}) => {
        set((s) => ({ [tab]: { ...s[tab], isLoading: true } }));
        try {
            const queryParams = new URLSearchParams();
            queryParams.append("limit", filters.limit || 10);
            queryParams.append("page", filters.page || 1);
            if (filters.search) queryParams.append("ymStyle", filters.search);
            if (filters.factory) queryParams.append("factory", filters.factory);
            if (filters.color) queryParams.append("color", filters.color);
            if (tab === "easy_scan") {
                queryParams.append("excludeStatus", "completed");
                if (filters.idOrQr) queryParams.append("idOrQr", filters.idOrQr.trim());
            } else if (filters.status) {
                queryParams.append("status", filters.status);
            }
            if (filters.reportType) queryParams.append("reportType", filters.reportType);
            if (filters.startDate) queryParams.append("startDate", filters.startDate);
            if (filters.endDate) queryParams.append("endDate", filters.endDate);

            const response = await fetch(
                `${API_BASE_URL}/api/report-washing?${queryParams.toString()}`,
            );
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    set((s) => ({
                        [tab]: {
                            ...s[tab],
                            reports: result.data || [],
                            pagination: result.pagination || s[tab].pagination,
                        },
                    }));
                } else {
                    showToast.error("Failed to load reports. Please check your connection.");
                }
            } else {
                showToast.error("Failed to load reports. Please check your connection.");
            }
        } catch (error) {
            if (
                error.message.includes("Failed to fetch") ||
                error.message.includes("ERR_CONNECTION_REFUSED")
            ) {
                showToast.error(
                    `Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend server is running on port 5001.`,
                );
            } else {
                showToast.error("Error loading reports. Please try again.");
            }
        } finally {
            set((s) => ({ [tab]: { ...s[tab], isLoading: false } }));
        }
    },

    // ─── Refresh both tabs ────────────────────────────────────────────
    refreshAllReports: async () => {
        const { standard: sf, warehouse: wf, easy_scan: ef } = useWashingFilterStore.getState();
        const { ymStyle, style } = useFormStore.getState().formData;
        const promises = [
            get().fetchReports("standard", sf),
            get().fetchReports("warehouse", wf),
            get().fetchReports("easy_scan", ef),
        ];
        if (ymStyle || style) promises.push(useOrderDataStore.getState().fetchUsedColors(ymStyle || style));
        await Promise.all(promises);
    },

    // ─── Reject ───────────────────────────────────────────────────────
    rejectReport: async (tab, reportId, body = {}, refetchFilters) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/report-washing/${reportId != null ? String(reportId) : ""}/reject`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                },
            );
            if (response.ok) {
                showToast.success("Report rejected.");
                if (refetchFilters) await get().fetchReports(tab, refetchFilters);
                return true;
            }
            const result = await response.json();
            showToast.error(result.message || "Failed to reject report");
            return false;
        } catch {
            showToast.error("An error occurred while rejecting the report.");
            return false;
        }
    },

    // ─── Delete ───────────────────────────────────────────────────────
    deleteReport: async (tab, reportId, refetchFilters) => {
        try {
            const id = reportId != null ? String(reportId) : "";
            const response = await fetch(`${API_BASE_URL}/api/report-washing/${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                set((s) => ({
                    [tab]: {
                        ...s[tab],
                        reports: s[tab].reports.filter((r) => r._id !== reportId && r.id !== reportId),
                    },
                }));
                showToast.success("Report deleted successfully!");
                if (refetchFilters) await get().fetchReports(tab, refetchFilters);
                return true;
            }
            const result = await response.json();
            showToast.error(result.message || "Failed to delete report");
            return false;
        } catch {
            showToast.error("An error occurred while deleting the report.");
            return false;
        }
    },

    // ─── Toggle expand ────────────────────────────────────────────────
    toggleReport: (tab, reportId) =>
        set((s) => {
            const next = new Set(s[tab].expandedReports);
            next.has(reportId) ? next.delete(reportId) : next.add(reportId);
            return { [tab]: { ...s[tab], expandedReports: next } };
        }),

    setPrintingReportId: (tab, id) =>
        set((s) => ({ [tab]: { ...s[tab], printingReportId: id } })),

    // ═══════════════════════════════════════════════════════════════════
    // SUBMISSION ACTIONS (merged from useReportSubmission)
    // ═══════════════════════════════════════════════════════════════════

    submitReport: async (formData, user, onSuccess) => {
        if (
            (formData.reportType === "Garment Wash Report" || formData.reportType === "Home Wash Test") &&
            (!formData.color || formData.color.length === 0)
        ) {
            showToast.warning("Please select at least one color");
            return false;
        }
        if (
            (formData.reportType === "Garment Wash Report" || formData.reportType === "Home Wash Test") &&
            (!formData.size || String(formData.size).trim() === "")
        ) {
            showToast.warning("Please select at least one size");
            return false;
        }
        if (
            formData.reportType === "HT Testing" &&
            Array.isArray(formData.fabricColor) &&
            formData.fabricColor.length === 0
        ) {
            showToast.warning("Please select at least one fabric");
            return false;
        }

        useFormStore.getState().setIsSubmitting(true);
        try {
            const defaultsMap =
                formData.reportType === "HT Testing"
                    ? PRINT_WASH_TEST_DEFAULTS
                    : formData.reportType === "EMB/Printing Testing"
                        ? EMB_PRINT_WASH_TEST_DEFAULTS
                        : null;
            const dataToSubmit = defaultsMap
                ? {
                    ...formData,
                    ...Object.fromEntries(
                        Object.entries(defaultsMap).map(([k, v]) => [
                            k,
                            formData[k] != null && String(formData[k]).trim() !== "" ? formData[k] : v,
                        ]),
                    ),
                }
                : formData;

            const fd = new FormData();
            fd.append("reportType", dataToSubmit.reportType || "Garment Wash Report");
            fd.append("ymStyle", dataToSubmit.ymStyle || dataToSubmit.style || "");
            fd.append("buyerStyle", dataToSubmit.buyerStyle || "");
            fd.append("color", JSON.stringify(dataToSubmit.color || []));
            fd.append("po", JSON.stringify(dataToSubmit.po || []));
            fd.append("exFtyDate", JSON.stringify(dataToSubmit.exFtyDate || []));
            fd.append("factory", dataToSubmit.factory || "");
            fd.append("sendToHomeWashingDate", dataToSubmit.sendToHomeWashingDate || "");
            fd.append("notes", dataToSubmit.notes || "");
            fd.append("reporter_emp_id", user?.emp_id || user?.id || user?._id || "");
            fd.append("reporter_name", user?.name || user?.username || "");

            const skipFields = [
                "reportType", "ymStyle", "buyerStyle", "color", "po", "exFtyDate",
                "factory", "sendToHomeWashingDate", "notes", "images", "userId",
                "userName", "reporter_emp_id", "reporter_name", "careLabelImage",
            ];
            Object.keys(dataToSubmit).forEach((key) => {
                if (!skipFields.includes(key) && dataToSubmit[key] !== undefined && dataToSubmit[key] !== null) {
                    if (key === "fabricColor" && Array.isArray(dataToSubmit[key]))
                        fd.append(key, dataToSubmit[key].join(", "));
                    else if (key === "shrinkageRows" && Array.isArray(dataToSubmit[key]))
                        fd.append(key, JSON.stringify(dataToSubmit[key].filter((r) => r.selected)));
                    else if (Array.isArray(dataToSubmit[key])) fd.append(key, JSON.stringify(dataToSubmit[key]));
                    else if (typeof dataToSubmit[key] === "object") fd.append(key, JSON.stringify(dataToSubmit[key]));
                    else fd.append(key, dataToSubmit[key]);
                }
            });

            if (dataToSubmit.careLabelImage && Array.isArray(dataToSubmit.careLabelImage)) {
                dataToSubmit.careLabelImage.forEach((item) => {
                    if (item instanceof File) fd.append("careLabelImage", item);
                });
                const existingUrls = dataToSubmit.careLabelImage.filter((item) => typeof item === "string");
                if (existingUrls.length > 0) fd.append("careLabelImageUrls", JSON.stringify(existingUrls));
            } else if (dataToSubmit.careLabelImage instanceof File) {
                fd.append("careLabelImage", dataToSubmit.careLabelImage);
            } else if (dataToSubmit.careLabelImage && typeof dataToSubmit.careLabelImage === "string") {
                fd.append("careLabelImageUrls", JSON.stringify([dataToSubmit.careLabelImage]));
            }

            if (dataToSubmit.images && dataToSubmit.images.length > 0) {
                const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
                dataToSubmit.images.forEach((imgFile) => {
                    if (imgFile instanceof File) {
                        if (!allowedTypes.includes(imgFile.type.toLowerCase()))
                            throw new Error(`Invalid image file: ${imgFile.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`);
                        fd.append("images", imgFile);
                    }
                });
            }

            const response = await fetch(`${API_BASE_URL}/api/report-washing/submit`, { method: "POST", body: fd });
            const contentType = response.headers.get("content-type");
            let result;
            if (contentType && contentType.includes("application/json")) {
                result = await response.json();
            } else {
                const text = await response.text();
                let errorMessage = `Server error (${response.status}): ${response.statusText}`;
                const preMatch = text.match(/<pre>([^<]+)<\/pre>/i);
                if (preMatch) {
                    const m = preMatch[1].match(/Error:\s*([^<]+)/i);
                    errorMessage = m ? m[1].trim() : preMatch[1].split("<br>")[0].trim();
                }
                throw new Error(errorMessage);
            }

            if (response.ok && result.success) {
                showToast.success("Report submitted successfully!");
                await get().refreshAllReports();

                // ── Size follow-up: show dialog if 2+ sizes were submitted ──
                const sizeField = formData.size || formData.range || "";
                if (sizeField) {
                    const submittedSizes = sizeField.split(",").map((s) => s.trim()).filter(Boolean);
                    if (submittedSizes.length >= 2) {
                        // Small delay so the success toast renders first
                        setTimeout(() => {
                            useModalStore.getState().openSizeFollowUpModal(
                                submittedSizes,
                                formData.ymStyle || formData.style || "",
                                Array.isArray(formData.color) ? formData.color : (formData.color ? [formData.color] : []),
                            );
                        }, 600);
                    }
                }

                if (onSuccess) onSuccess();
                return true;
            }
            showToast.error(result?.message || result?.error || `Server error (${response.status})`);
            return false;
        } catch (error) {
            console.error("Error submitting report:", error);
            showToast.error(error.message || "An error occurred while submitting the report.");
            return false;
        } finally {
            useFormStore.getState().setIsSubmitting(false);
        }
    },

    saveReceivedStatus: async (reportId, receivedImages, receivedNotes, shouldUpdateStatus, user, onSuccess) => {
        if (!reportId) return false;
        useModalStore.getState().setIsSavingReceived(true);
        try {
            const fd = new FormData();
            fd.append("receivedNotes", receivedNotes || "");
            receivedImages.forEach((f) => { if (f instanceof File) fd.append("receivedImages", f); });

            if (shouldUpdateStatus) {
                const now = new Date().toISOString();
                fd.append("status", "received");
                fd.append("receivedDate", now.split("T")[0]);
                fd.append("receivedAt", now);
                if (user?.emp_id) {
                    fd.append("receiver_emp_id", user.emp_id);
                    fd.append("receiver_status", "received");
                }
            }

            const id = String(reportId);
            const response = await fetch(`${API_BASE_URL}/api/report-washing/${id}`, { method: "PUT", body: fd });
            const ct = response.headers.get("content-type");
            let result;
            if (ct && ct.includes("application/json")) result = await response.json();
            else {
                const text = await response.text();
                let errorMessage = `Server error (${response.status}): ${response.statusText}`;
                const preMatch = text.match(/<pre>([^<]+)<\/pre>/i);
                if (preMatch) { const m = preMatch[1].match(/Error:\s*([^<]+)/i); if (m) errorMessage = m[1].trim(); }
                throw new Error(errorMessage);
            }

            if (response.ok && result.success) {
                showToast.success("✓ Received saved successfully!");
                await get().refreshAllReports();
                if (onSuccess) onSuccess(reportId);
                return true;
            }
            showToast.error(result.message || "Failed to save received.");
            return false;
        } catch (error) {
            console.error("Error saving received:", error);
            showToast.error(error.message || "An error occurred while saving received.");
            return false;
        } finally {
            useModalStore.getState().setIsSavingReceived(false);
        }
    },

    saveCompletionStatus: async (reportId, completionImages, completionNotes, onSuccess, reportType, completionAssign, user) => {
        if (!reportId) return false;
        const noteFieldName = reportType ? getCompletionNotesField(reportType) : "completionNotes";
        useModalStore.getState().setIsSavingCompletion(true);
        try {
            const fd = new FormData();
            fd.append("status", "completed");
            fd.append("completedDate", new Date().toISOString().split("T")[0]);
            fd.append("completedAt", new Date().toISOString());
            if (user?.emp_id) {
                fd.append("completer_emp_id", user.emp_id);
                fd.append("receiver_status", "completed");
            }
            if (completionAssign) {
                if (completionAssign.checkedBy != null && completionAssign.checkedBy !== "") fd.append("checkedBy", completionAssign.checkedBy);
                if (completionAssign.approvedBy != null && completionAssign.approvedBy !== "") fd.append("approvedBy", completionAssign.approvedBy);
                if (completionAssign.checkedByName != null && completionAssign.checkedByName !== "") fd.append("checkedByName", completionAssign.checkedByName);
                if (completionAssign.approvedByName != null && completionAssign.approvedByName !== "") fd.append("approvedByName", completionAssign.approvedByName);
            }
            fd.append(noteFieldName, completionNotes || "");
            completionImages.forEach((f, i) => {
                if (f instanceof File) fd.append("completionImages", f);
                else if (f && typeof f === "object" && f instanceof Blob) fd.append("completionImages", f, `completion-${i}.webp`);
            });

            const id = String(reportId);
            const response = await fetch(`${API_BASE_URL}/api/report-washing/${id}`, { method: "PUT", body: fd });
            const ct = response.headers.get("content-type");
            let result;
            if (ct && ct.includes("application/json")) result = await response.json();
            else {
                const text = await response.text();
                let errorMessage = `Server error (${response.status}): ${response.statusText}`;
                const preMatch = text.match(/<pre>([^<]+)<\/pre>/i);
                if (preMatch) { const m = preMatch[1].match(/Error:\s*([^<]+)/i); if (m) errorMessage = m[1].trim(); }
                throw new Error(errorMessage);
            }

            if (response.ok && result.success) {
                showToast.success("✓ Report Completed Successfully!");
                await get().refreshAllReports();
                if (onSuccess) onSuccess(reportId);
                return true;
            }
            showToast.error(result.message || "Failed to complete report.");
            return false;
        } catch (error) {
            console.error("Error completing report:", error);
            showToast.error(error.message || "An error occurred while completing the report.");
            return false;
        } finally {
            useModalStore.getState().setIsSavingCompletion(false);
        }
    },

    updateReport: async (reportId, editFormData) => {
        if (!editFormData.color || editFormData.color.length === 0) {
            showToast.warning("Please select at least one color");
            return false;
        }
        try {
            const fd = new FormData();
            const reportType = editFormData.reportType || "Garment Wash Report";
            fd.append("reportType", reportType);
            fd.append("color", JSON.stringify(editFormData.color || []));
            fd.append("buyerStyle", editFormData.buyerStyle || "");
            fd.append("po", JSON.stringify(editFormData.po || []));
            fd.append("exFtyDate", JSON.stringify(editFormData.exFtyDate || []));
            fd.append("factory", editFormData.factory || "");
            fd.append("sendToHomeWashingDate", editFormData.sendToHomeWashingDate || "");

            const skipFields = [
                "reportType", "color", "buyerStyle", "po", "exFtyDate",
                "factory", "sendToHomeWashingDate", "images", "receivedImages",
                "completionImages", "completionNotes", "careLabelImage",
            ];
            Object.keys(editFormData).forEach((key) => {
                if (!skipFields.includes(key) && editFormData[key] !== undefined && editFormData[key] !== null) {
                    if (key === "shrinkageRows" && Array.isArray(editFormData[key]))
                        fd.append(key, JSON.stringify(editFormData[key].filter((r) => r.selected)));
                    else if (Array.isArray(editFormData[key])) fd.append(key, JSON.stringify(editFormData[key]));
                    else if (typeof editFormData[key] === "object") fd.append(key, JSON.stringify(editFormData[key]));
                    else fd.append(key, editFormData[key]);
                }
            });

            const appendImages = (arr, fieldName) => {
                if (!arr || !Array.isArray(arr)) return;
                const urls = arr.filter((item) => typeof item === "string");
                if (urls.length > 0) fd.append(`${fieldName}Urls`, JSON.stringify(urls));
                arr.forEach((item, i) => {
                    if (item instanceof File) fd.append(fieldName, item);
                    else if (item && typeof item === "object" && item instanceof Blob)
                        fd.append(fieldName, item, `${fieldName}-${i}.webp`);
                });
            };
            appendImages(editFormData.images, "images");
            appendImages(editFormData.receivedImages, "receivedImages");
            appendImages(editFormData.completionImages, "completionImages");

            if (editFormData.careLabelImage && Array.isArray(editFormData.careLabelImage)) {
                editFormData.careLabelImage.forEach((item) => { if (item instanceof File) fd.append("careLabelImage", item); });
                const urls = editFormData.careLabelImage.filter((item) => typeof item === "string");
                if (urls.length > 0) fd.append("careLabelImageUrls", JSON.stringify(urls));
            } else if (editFormData.careLabelImage instanceof File) {
                fd.append("careLabelImage", editFormData.careLabelImage);
            } else if (editFormData.careLabelImage && typeof editFormData.careLabelImage === "string") {
                fd.append("careLabelImageUrls", JSON.stringify([editFormData.careLabelImage]));
            }

            if (editFormData.completionNotes !== undefined) {
                fd.append(getCompletionNotesField(reportType), editFormData.completionNotes);
            }

            const id = reportId != null ? String(reportId) : "";
            const response = await fetch(`${API_BASE_URL}/api/report-washing/${id}`, { method: "PUT", body: fd });
            const ct = response.headers.get("content-type");
            let result;
            if (ct && ct.includes("application/json")) result = await response.json();
            else {
                const text = await response.text();
                let errorMessage = `Server error (${response.status}): ${response.statusText}`;
                const preMatch = text.match(/<pre>([^<]+)<\/pre>/i);
                if (preMatch) {
                    const m = preMatch[1].match(/Error:\s*([^<]+)/i);
                    errorMessage = m ? m[1].trim() : preMatch[1].split("<br>")[0].trim();
                }
                throw new Error(errorMessage);
            }

            if (response.ok && result.success) {
                showToast.success("Report updated successfully!");
                await get().refreshAllReports();
                return true;
            }
            showToast.error(result?.message || result?.error || `Server error (${response.status})`);
            return false;
        } catch (error) {
            console.error("Error updating report:", error);
            showToast.error(error.message || "An error occurred while updating the report.");
            return false;
        }
    },

    // ═══════════════════════════════════════════════════════════════════
    // EXPORT ACTIONS (merged from useReportExport)
    // ═══════════════════════════════════════════════════════════════════

    handlePrintPDF: async (report) => {
        const reportId = report._id || report.id;
        const { activeTab } = useFormStore.getState();
        const tab = activeTab === "warehouse_reports" ? "warehouse" : "standard";
        const currentPrintingId = get()[tab].printingReportId;
        if (currentPrintingId === reportId) return;

        get().setPrintingReportId(tab, reportId);

        try {
            const qrCodeValue = `${getQRCodeBaseURL(QR_CODE_BASE_URL)}/Launch-washing-machine-test?scan=${reportId}`;
            const qrCodeDataURL = await useQRScannerStore.getState().generateQRCodeDataURL(qrCodeValue, 100);
            const { users } = useAssignControlStore.getState();
            const { savedImageRotations } = useImageStore.getState();

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
            iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;border:none;";
            document.body.appendChild(iframe);
            iframe.onload = () => {
                try { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
                catch (e) { console.error("Error calling print:", e); showToast.error("Print failed. Use the PDF button to download and print manually."); }
                setTimeout(() => {
                    try { document.body.removeChild(iframe); } catch { }
                    try { URL.revokeObjectURL(url); } catch { }
                }, 60000);
            };
            iframe.src = url;
        } catch (error) {
            console.error("Error generating PDF:", error);
            showToast.error("Failed to generate PDF. Please try again.");
        } finally {
            setTimeout(() => get().setPrintingReportId(tab, null), 3000);
        }
    },

    handleDownloadPDF: async (report) => {
        try {
            const reportId = report._id || report.id;
            const qrCodeValue = `REPORT_DATE_SCAN:${reportId}`;
            const qrCodeDataURL = await useQRScannerStore.getState().generateQRCodeDataURL(qrCodeValue, 100);
            const { users } = useAssignControlStore.getState();
            const { savedImageRotations } = useImageStore.getState();

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
    },

    handleExportExcel: async (report) => {
        try {
            const { users } = useAssignControlStore.getState();
            await generateWashingMachineTestExcel(report, API_BASE_URL, users);
            showToast.success("Excel file downloaded successfully!");
        } catch (error) {
            console.error("Error exporting Excel:", error);
            showToast.error("Failed to export Excel. Please try again.");
        }
    },
}));
