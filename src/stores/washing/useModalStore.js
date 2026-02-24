import { create } from "zustand";

/**
 * Zustand store for all washing modal states.
 * Replaces ~20 individual useState hooks spread across LaunchWashingMachineTest.jsx.
 */
export const useModalStore = create((set) => ({
  // ─── Received Modal ───────────────────────────────────────────────
  receivedModal: {
    isOpen: false,
    reportId: null,
    images: [],
    notes: "",
    shouldUpdateStatus: false,
  },
  openReceivedModal: (reportId) =>
    set({
      receivedModal: {
        isOpen: true,
        reportId,
        images: [],
        notes: "",
        shouldUpdateStatus: false,
      },
    }),
  closeReceivedModal: () =>
    set({
      receivedModal: {
        isOpen: false,
        reportId: null,
        images: [],
        notes: "",
        shouldUpdateStatus: false,
      },
    }),
  setReceivedImages: (images) =>
    set((s) => ({
      receivedModal: {
        ...s.receivedModal,
        images: typeof images === "function" ? images(s.receivedModal.images) : images,
      },
    })),
  setReceivedNotes: (notes) =>
    set((s) => ({ receivedModal: { ...s.receivedModal, notes } })),
  setShouldUpdateReceivedStatus: (shouldUpdateStatus) =>
    set((s) => ({ receivedModal: { ...s.receivedModal, shouldUpdateStatus } })),

  // ─── Completion Modal ─────────────────────────────────────────────
  completionModal: {
    isOpen: false,
    reportId: null,
    images: [],
    notes: "",
  },
  completingReport: null,
  openCompletionModal: (reportId) =>
    set({
      completionModal: { isOpen: true, reportId, images: [], notes: "" },
    }),
  closeCompletionModal: () =>
    set({
      completionModal: { isOpen: false, reportId: null, images: [], notes: "" },
      completingReport: null,
    }),
  setCompletionImages: (images) =>
    set((s) => ({
      completionModal: {
        ...s.completionModal,
        images: typeof images === "function" ? images(s.completionModal.images) : images,
      },
    })),
  setCompletionNotes: (notes) =>
    set((s) => ({ completionModal: { ...s.completionModal, notes } })),
  setCompletingReport: (report) => set({ completingReport: report }),

  // ─── Delete Confirmation Modal ────────────────────────────────────
  deleteModal: { isOpen: false, report: null },
  openDeleteModal: (report) =>
    set({ deleteModal: { isOpen: true, report } }),
  closeDeleteModal: () =>
    set({ deleteModal: { isOpen: false, report: null } }),

  // ─── Reject Report Modal (warehouse: e.g. color mismatch) ──────────
  rejectModal: { isOpen: false, report: null, rejectedNotes: "" },
  openRejectModal: (report) =>
    set({ rejectModal: { isOpen: true, report, rejectedNotes: "" } }),
  closeRejectModal: () =>
    set({ rejectModal: { isOpen: false, report: null, rejectedNotes: "" } }),
  setRejectNotes: (notes) =>
    set((s) => ({ rejectModal: { ...s.rejectModal, rejectedNotes: notes } })),

  // ─── Edit Report Modal ────────────────────────────────────────────
  editModal: { isOpen: false, report: null },
  openEditModal: (report) =>
    set({ editModal: { isOpen: true, report } }),
  closeEditModal: () =>
    set({ editModal: { isOpen: false, report: null } }),

  // ─── Edit Images Modal ────────────────────────────────────────────
  editImagesModal: {
    isOpen: false,
    report: null,
    type: null, // 'initial' | 'received' | 'completion'
    images: [],
    notes: "",
    isUpdating: false,
  },
  openEditImagesModal: (report, type, images = [], notes = "") =>
    set({
      editImagesModal: {
        isOpen: true,
        report,
        type,
        images,
        notes,
        isUpdating: false,
      },
    }),
  closeEditImagesModal: () =>
    set({
      editImagesModal: {
        isOpen: false,
        report: null,
        type: null,
        images: [],
        notes: "",
        isUpdating: false,
      },
    }),
  setEditImages: (images) =>
    set((s) => ({
      editImagesModal: {
        ...s.editImagesModal,
        images: typeof images === "function" ? images(s.editImagesModal.images) : images,
      },
    })),
  setEditNotes: (notes) =>
    set((s) => ({ editImagesModal: { ...s.editImagesModal, notes } })),
  setIsUpdatingImages: (isUpdating) =>
    set((s) => ({ editImagesModal: { ...s.editImagesModal, isUpdating } })),

  // ─── Edit Report Form Data (inside edit modal) ────────────────────
  editFormData: {
    color: [],
    buyerStyle: "",
    po: [],
    exFtyDate: [],
    factory: "",
    sendToHomeWashingDate: "",
  },
  editAvailableColors: [],
  editAvailablePOs: [],
  editAvailableETDs: [],
  showEditColorDropdown: false,
  showEditPODropdown: false,
  showEditETDDropdown: false,

  setEditFormData: (data) =>
    set((s) => ({
      editFormData: typeof data === "function" ? data(s.editFormData) : data,
    })),
  setEditAvailableColors: (editAvailableColors) => set({ editAvailableColors }),
  setEditAvailablePOs: (editAvailablePOs) => set({ editAvailablePOs }),
  setEditAvailableETDs: (editAvailableETDs) => set({ editAvailableETDs }),
  setShowEditColorDropdown: (showEditColorDropdown) =>
    set({ showEditColorDropdown }),
  setShowEditPODropdown: (showEditPODropdown) => set({ showEditPODropdown }),
  setShowEditETDDropdown: (showEditETDDropdown) =>
    set({ showEditETDDropdown }),

  // ─── QR Code display / scanner ────────────────────────────────────
  showReportDateQR: null,      // reportId whose QR is expanded, or null
  showReportDateScanner: null, // reportId whose scanner is open, or null
  scanningReportId: null,
  setShowReportDateQR: (id) => set({ showReportDateQR: id }),
  setShowReportDateScanner: (id) => set({ showReportDateScanner: id }),
  setScanningReportId: (id) => set({ scanningReportId: id }),

  // ─── Async saving flags (modals) ──────────────────────────────────
  isSavingReceived: false,
  setIsSavingReceived: (v) => set({ isSavingReceived: v }),
  isSavingCompletion: false,
  setIsSavingCompletion: (v) => set({ isSavingCompletion: v }),
}));
