import { create } from "zustand";
import { API_BASE_URL } from "../../../../../config.js";
import showToast from "../../../../utils/toast.js";
import { getCompletionNotesField } from "../utils.js";
import { prepareEditFormData, handleEditFormSubmit } from "../handlers/index.js";
import { useFormStore } from "./useFormStore.js";
import { useWashingFilterStore } from "./useWashingFilterStore.js";
import { useAssignControlStore, computeUserRoles } from "./useAssignControlStore.js";
import { useImageStore } from "./useImageStore.js";
import { useWashingReportsStore } from "./useWashingReportsStore.js";

export const useModalStore = create((set, get) => ({
    // ─── Received Modal ───────────────────────────────────────────────
    receivedModal: { isOpen: false, reportId: null, images: [], notes: "", shouldUpdateStatus: false },
    openReceivedModal: (reportId) =>
        set({ receivedModal: { isOpen: true, reportId, images: [], notes: "", shouldUpdateStatus: false } }),
    closeReceivedModal: () =>
        set({ receivedModal: { isOpen: false, reportId: null, images: [], notes: "", shouldUpdateStatus: false } }),
    setReceivedImages: (images) =>
        set((s) => ({
            receivedModal: { ...s.receivedModal, images: typeof images === "function" ? images(s.receivedModal.images) : images },
        })),
    setReceivedNotes: (notes) => set((s) => ({ receivedModal: { ...s.receivedModal, notes } })),
    setShouldUpdateReceivedStatus: (v) => set((s) => ({ receivedModal: { ...s.receivedModal, shouldUpdateStatus: v } })),

    // ─── Completion Modal ─────────────────────────────────────────────
    completionModal: { isOpen: false, reportId: null, images: [], notes: "" },
    completingReport: null,
    openCompletionModal: (reportId) =>
        set({ completionModal: { isOpen: true, reportId, images: [], notes: "" } }),
    closeCompletionModal: () =>
        set({ completionModal: { isOpen: false, reportId: null, images: [], notes: "" }, completingReport: null }),
    setCompletionImages: (images) =>
        set((s) => ({
            completionModal: { ...s.completionModal, images: typeof images === "function" ? images(s.completionModal.images) : images },
        })),
    setCompletionNotes: (notes) => set((s) => ({ completionModal: { ...s.completionModal, notes } })),
    setCompletingReport: (report) => set({ completingReport: report }),

    // ─── Delete Modal ─────────────────────────────────────────────────
    deleteModal: { isOpen: false, report: null },
    openDeleteModal: (report) => set({ deleteModal: { isOpen: true, report } }),
    closeDeleteModal: () => set({ deleteModal: { isOpen: false, report: null } }),

    // ─── Reject Modal ─────────────────────────────────────────────────
    rejectModal: { isOpen: false, report: null, rejectedNotes: "" },
    openRejectModal: (report) => set({ rejectModal: { isOpen: true, report, rejectedNotes: "" } }),
    closeRejectModal: () => set({ rejectModal: { isOpen: false, report: null, rejectedNotes: "" } }),
    setRejectNotes: (notes) => set((s) => ({ rejectModal: { ...s.rejectModal, rejectedNotes: notes } })),

    // ─── Edit Report Modal ────────────────────────────────────────────
    editModal: { isOpen: false, report: null },
    openEditModal: (report) => set({ editModal: { isOpen: true, report } }),
    closeEditModal: () => set({ editModal: { isOpen: false, report: null } }),

    // ─── Edit Images Modal ────────────────────────────────────────────
    editImagesModal: { isOpen: false, report: null, type: null, images: [], notes: "", isUpdating: false },
    openEditImagesModal: (report, type, images = [], notes = "") =>
        set({ editImagesModal: { isOpen: true, report, type, images, notes, isUpdating: false } }),
    closeEditImagesModal: () =>
        set({ editImagesModal: { isOpen: false, report: null, type: null, images: [], notes: "", isUpdating: false } }),
    setEditImages: (images) =>
        set((s) => ({
            editImagesModal: { ...s.editImagesModal, images: typeof images === "function" ? images(s.editImagesModal.images) : images },
        })),
    setEditNotes: (notes) => set((s) => ({ editImagesModal: { ...s.editImagesModal, notes } })),
    setIsUpdatingImages: (v) => set((s) => ({ editImagesModal: { ...s.editImagesModal, isUpdating: v } })),

    // ─── Edit Report Form Data ────────────────────────────────────────
    editFormData: { color: [], buyerStyle: "", po: [], exFtyDate: [], factory: "", sendToHomeWashingDate: "" },
    editAvailableColors: [],
    editAvailablePOs: [],
    editAvailableETDs: [],
    showEditColorDropdown: false,
    showEditPODropdown: false,
    showEditETDDropdown: false,

    setEditFormData: (data) =>
        set((s) => ({ editFormData: typeof data === "function" ? data(s.editFormData) : data })),
    setEditAvailableColors: (v) => set({ editAvailableColors: v }),
    setEditAvailablePOs: (v) => set({ editAvailablePOs: v }),
    setEditAvailableETDs: (v) => set({ editAvailableETDs: v }),
    setShowEditColorDropdown: (v) => set({ showEditColorDropdown: v }),
    setShowEditPODropdown: (v) => set({ showEditPODropdown: v }),
    setShowEditETDDropdown: (v) => set({ showEditETDDropdown: v }),

    // ─── QR Code display / scanner ────────────────────────────────────
    showReportDateQR: null,
    showReportDateScanner: null,
    scanningReportId: null,
    setShowReportDateQR: (id) => set({ showReportDateQR: id }),
    setShowReportDateScanner: (id) => set({ showReportDateScanner: id }),
    setScanningReportId: (id) => set({ scanningReportId: id }),

    // ─── Size Follow-Up Modal (shown after submit with 2+ sizes) ─────
    sizeFollowUpModal: { isOpen: false, sizes: [], ymStyle: "", colors: [] },
    openSizeFollowUpModal: (sizes, ymStyle, colors) =>
        set({ sizeFollowUpModal: { isOpen: true, sizes, ymStyle, colors: colors || [] } }),
    closeSizeFollowUpModal: () =>
        set({ sizeFollowUpModal: { isOpen: false, sizes: [], ymStyle: "", colors: [] } }),

    // ─── Async saving flags ───────────────────────────────────────────
    isSavingReceived: false,
    setIsSavingReceived: (v) => set({ isSavingReceived: v }),
    isSavingCompletion: false,
    setIsSavingCompletion: (v) => set({ isSavingCompletion: v }),

    // ═══════════════════════════════════════════════════════════════════
    // REPORT ACTIONS (merged from useReportActions)
    // ═══════════════════════════════════════════════════════════════════

    _makeImageUploadHandler: (getImages, setImages) => (files) => {
        if (!files || files.length === 0) return;
        const currentCount = getImages().length;
        if (currentCount >= 5) {
            showToast.warning("Maximum of 5 images allowed per section.");
            return;
        }
        const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        const arr = Array.from(files);
        const slots = 5 - currentCount;
        if (arr.length > slots) showToast.info(`Only ${slots} more image(s) can be added (Limit: 5).`);
        arr.slice(0, slots).forEach((file) => {
            if (!ALLOWED.includes(file.type.toLowerCase())) {
                showToast.error(`Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`);
                return;
            }
            setImages((prev) => [...prev, file]);
        });
    },

    handleDelete: (id) => get().openDeleteModal(id),

    confirmDelete: async () => {
        const { deleteModal, closeDeleteModal } = get();
        if (!deleteModal.report) return;
        const reportStore = useWashingReportsStore.getState();
        const { activeTab } = useFormStore.getState();
        const tab = activeTab === "warehouse_reports" ? "warehouse" : "standard";
        const success = await reportStore.deleteReport(tab, deleteModal.report);
        if (success) {
            closeDeleteModal();
            reportStore.refreshAllReports();
        }
    },

    handleReject: async (reportId, rejectedNotes = "") => {
        const { activeTab } = useFormStore.getState();
        const tab = activeTab === "warehouse_reports" ? "warehouse" : "standard";
        const filters = useWashingFilterStore.getState()[tab === "warehouse" ? "warehouse" : "standard"];
        const { _currentUser } = useAssignControlStore.getState();
        const reportStore = useWashingReportsStore.getState();
        const success = await reportStore.rejectReport(
            tab,
            reportId,
            { receiver_emp_id: _currentUser?.emp_id || _currentUser?.id, rejectedNotes },
            filters,
        );
        if (success) reportStore.refreshAllReports();
    },

    handleEditReport: async (report) => {
        const { setEditFormData, setEditAvailableColors, setEditAvailablePOs, setEditAvailableETDs, openEditModal } = get();
        await prepareEditFormData(report, setEditFormData, setEditAvailableColors, setEditAvailablePOs, setEditAvailableETDs);
        openEditModal(report);
    },

    resetEditState: () => {
        const { closeEditModal, setEditFormData, setEditAvailableColors, setEditAvailablePOs, setEditAvailableETDs } = get();
        closeEditModal();
        setEditFormData({ color: [], buyerStyle: "", po: [], exFtyDate: [], factory: "", sendToHomeWashingDate: "" });
        setEditAvailableColors([]);
        setEditAvailablePOs([]);
        setEditAvailableETDs([]);
    },

    handleEditSubmit: (e) => {
        const { editModal, editFormData, closeEditModal, resetEditState } = get();
        const { _currentUser, causeAssignHistory } = useAssignControlStore.getState();
        const { isWarehouseUser } = computeUserRoles(_currentUser, causeAssignHistory);
        handleEditFormSubmit(
            e,
            editModal.report,
            editFormData,
            useWashingReportsStore.getState().refreshAllReports,
            closeEditModal,
            resetEditState,
            {
                editedByWarehouse: isWarehouseUser,
                editorUserId: _currentUser?.emp_id || _currentUser?.id,
                editorEmpId: _currentUser?.emp_id || _currentUser?.id,
                editorUserName: _currentUser?.name || _currentUser?.eng_name || "",
                editorName: _currentUser?.name || _currentUser?.eng_name || "",
            },
        );
    },

    handleReceivedImageUpload: (files) => {
        const { receivedModal, setReceivedImages, _makeImageUploadHandler } = get();
        _makeImageUploadHandler(() => receivedModal.images, setReceivedImages)(files);
    },

    handleReceivedSubmit: async () => {
        const { receivedModal, closeReceivedModal, showReportDateQR, setShowReportDateQR, setShowReportDateScanner } = get();
        if (!receivedModal.reportId) return;
        const { _currentUser } = useAssignControlStore.getState();
        await useWashingReportsStore.getState().saveReceivedStatus(
            receivedModal.reportId,
            receivedModal.images,
            receivedModal.notes,
            receivedModal.shouldUpdateStatus,
            _currentUser,
            (reportId) => {
                closeReceivedModal();
                if (showReportDateQR === reportId) {
                    setShowReportDateQR(null);
                    setShowReportDateScanner(null);
                }
                useImageStore.getState().setReceivedImageRotations({});
                setTimeout(() => {
                    const el = document.querySelector(`[data-report-id="${reportId}"]`);
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        el.style.transition = "background-color 0.5s ease";
                        el.style.backgroundColor = "#d4edda";
                        setTimeout(() => { el.style.backgroundColor = ""; }, 2000);
                    }
                }, 200);
            },
        );
    },

    handleAcceptReceivedFromCard: async (report) => {
        const reportId = report._id || report.id;
        if (!reportId) return;
        const { _currentUser } = useAssignControlStore.getState();
        const { showReportDateQR, setShowReportDateQR, setShowReportDateScanner } = get();
        await useWashingReportsStore.getState().saveReceivedStatus(reportId, [], "", true, _currentUser, (id) => {
            if (showReportDateQR === id) {
                setShowReportDateQR(null);
                setShowReportDateScanner(null);
            }
            setTimeout(() => {
                const el = document.querySelector(`[data-report-id="${id}"]`);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    el.style.transition = "background-color 0.5s ease";
                    el.style.backgroundColor = "#d4edda";
                    setTimeout(() => { el.style.backgroundColor = ""; }, 2000);
                }
            }, 200);
        });
    },

    handleCompletionImageUpload: (files) => {
        const { completionModal, setCompletionImages, _makeImageUploadHandler } = get();
        _makeImageUploadHandler(() => completionModal.images, setCompletionImages)(files);
    },

    handleCompletionSubmit: async () => {
        const {
            completionModal, closeCompletionModal, showReportDateQR,
            setShowReportDateQR, setShowReportDateScanner,
        } = get();
        if (!completionModal.reportId) return;

        const reportStore = useWashingReportsStore.getState();
        const reports = reportStore.standard.reports;
        const whReports = reportStore.warehouse.reports;
        let report = reports.find((r) => r._id === completionModal.reportId || r.id === completionModal.reportId);
        if (!report) report = whReports.find((r) => r._id === completionModal.reportId || r.id === completionModal.reportId);

        const reportType = report?.reportType || "Garment Wash Report";

        const { causeAssignHistory, _currentUser } = useAssignControlStore.getState();
        const activeAssign = causeAssignHistory?.length > 0 ? causeAssignHistory[0] : null;
        const completionAssign = activeAssign
            ? {
                checkedBy: activeAssign.checkedBy ?? null,
                approvedBy: activeAssign.approvedBy ?? null,
                checkedByName: activeAssign.checkedByName ?? null,
                approvedByName: activeAssign.approvedByName ?? null,
            }
            : null;

        await reportStore.saveCompletionStatus(
            completionModal.reportId,
            completionModal.images,
            completionModal.notes,
            (reportId) => {
                closeCompletionModal();
                if (showReportDateQR === reportId) {
                    setShowReportDateQR(null);
                    setShowReportDateScanner(null);
                }
                useImageStore.getState().setCompletionImageRotations({});
                setTimeout(() => {
                    const el = document.querySelector(`[data-report-id="${reportId}"]`);
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        el.style.transition = "background-color 0.5s ease";
                        el.style.backgroundColor = "#d1ecf1";
                        setTimeout(() => { el.style.backgroundColor = ""; }, 2000);
                    }
                }, 200);
            },
            reportType,
            completionAssign,
            _currentUser,
        );
    },

    // ─── Edit images ──────────────────────────────────────────────────
    handleEditInitialImages: (report) =>
        get().openEditImagesModal(report, "initial", report.images || [], report.notes || ""),

    handleEditReceivedImages: (report) =>
        get().openEditImagesModal(report, "received", report.receivedImages || [], report.receivedNotes || ""),

    handleEditCompletionImages: (report) => {
        const noteField = getCompletionNotesField(report.reportType);
        get().openEditImagesModal(
            report,
            "completion",
            report.completionImages || [],
            report[noteField] || report.completionNotes || "",
        );
    },

    handleEditImageUpload: (files) => {
        const { editImagesModal, setEditImages, _makeImageUploadHandler } = get();
        _makeImageUploadHandler(() => editImagesModal.images, setEditImages)(files);
    },

    handleRemoveEditImage: (index) => {
        get().setEditImages((prev) => prev.filter((_, i) => i !== index));
    },

    handleUpdateImages: async () => {
        const { editImagesModal, closeEditImagesModal, setEditImages, setIsUpdatingImages } = get();
        if (!editImagesModal.report || !editImagesModal.type) return;

        const reportId = editImagesModal.report._id || editImagesModal.report.id;
        setIsUpdatingImages(true);

        try {
            const fd = new FormData();
            const fieldName = editImagesModal.type === "initial" ? "images"
                : editImagesModal.type === "received" ? "receivedImages" : "completionImages";

            const newFiles = editImagesModal.images.filter((img) => img instanceof File);
            const existingUrls = editImagesModal.images.filter((img) => typeof img === "string");

            newFiles.forEach((file) => fd.append(fieldName, file));
            if (existingUrls.length > 0) fd.append(`${fieldName}Urls`, JSON.stringify(existingUrls));

            let notesFieldName;
            if (editImagesModal.type === "initial") notesFieldName = "notes";
            else if (editImagesModal.type === "received") notesFieldName = "receivedNotes";
            else notesFieldName = getCompletionNotesField(editImagesModal.report.reportType);

            fd.append(notesFieldName, editImagesModal.notes);

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
                showToast.success("Images updated successfully!");
                closeEditImagesModal();
                setEditImages([]);
                await useWashingReportsStore.getState().refreshAllReports();
            } else {
                showToast.error(result?.message || result?.error || `Server error (${response.status})`);
            }
        } catch (error) {
            console.error("Error updating images:", error);
            showToast.error(error.message || "An error occurred while updating images.");
        } finally {
            setIsUpdatingImages(false);
        }
    },
}));
