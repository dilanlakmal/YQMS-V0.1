import { create } from "zustand";
import {
  REPORT_TYPES,
  getInitialFormData,
  IMAGE_LIMITS,
} from "../constants/index.js";
import {
  handleOrderNoSearch,
  handleOrderNoSelection,
  shouldAutoFetchColors,
  handleFileInputChange as handleFileInputChangeHandler,
  handleCameraInputChange as handleCameraInputChangeHandler,
  triggerFileInput as triggerFileInputHandler,
  triggerCameraInput as triggerCameraInputHandler,
} from "../handlers/index.js";
import { useOrderDataStore } from "./useOrderDataStore.js";
import { useImageStore } from "./useImageStore.js";
import { useModalStore } from "./useModalStore.js";
import { useWashingReportsStore } from "./useWashingReportsStore.js";

let _colorFetchTimer = null;
let _fileInputRef = null;
let _cameraInputRef = null;

export const useFormStore = create((set, get) => ({
  formData: {},

  setFormData: (data) =>
    set({ formData: typeof data === "function" ? data(get().formData) : data }),

  setField: (field, value) =>
    set((s) => ({ formData: { ...s.formData, [field]: value } })),

  _handleInputChangeBase: (field, value, onFieldChange) => {
    set((s) => {
      const newData = { ...s.formData, [field]: value };
      if (onFieldChange) onFieldChange(field, value, newData, s.formData);
      return { formData: newData };
    });
  },

  // Form is only reset on explicit submit/completion (not when switching tabs).
  resetForm: (defaultData) => set({ formData: defaultData || {} }),

  orderNoSuggestions: [],
  showOrderNoSuggestions: false,
  isSearchingOrderNo: false,
  setOrderNoSuggestions: (v) => set({ orderNoSuggestions: v }),
  setShowOrderNoSuggestions: (v) => set({ showOrderNoSuggestions: v }),
  setIsSearchingOrderNo: (v) => set({ isSearchingOrderNo: v }),

  showColorDropdown: false,
  showPODropdown: false,
  showETDDropdown: false,
  isReportTypeOpen: false,
  setShowColorDropdown: (v) => set({ showColorDropdown: v }),
  setShowPODropdown: (v) => set({ showPODropdown: v }),
  setShowETDDropdown: (v) => set({ showETDDropdown: v }),
  setIsReportTypeOpen: (v) => set({ isReportTypeOpen: v }),

  activeTab: "form",
  setActiveTab: (tab) => set({ activeTab: tab }),

  isSubmitting: false,
  setIsSubmitting: (v) => set({ isSubmitting: v }),

  // ─── Refs (set by page on mount) ──────────────────────────────────
  setRefs: ({ fileInputRef, cameraInputRef }) => {
    _fileInputRef = fileInputRef;
    _cameraInputRef = cameraInputRef;
  },

  // ═══════════════════════════════════════════════════════════════════
  // FORM ACTIONS (merged from useFormActions)
  // ═══════════════════════════════════════════════════════════════════

  handleOrderNoSelect: async (orderNo) => {
    if (_colorFetchTimer) {
      clearTimeout(_colorFetchTimer);
      _colorFetchTimer = null;
    }

    const {
      setFormData,
      formData,
      setShowOrderNoSuggestions,
      setOrderNoSuggestions,
    } = get();
    const orderStore = useOrderDataStore.getState();

    setFormData((prev) => ({
      ...prev,
      moNo: orderNo,
      ymStyle: orderNo,
      style: orderNo,
      styleNo: orderNo,
    }));

    await handleOrderNoSelection(
      orderNo,
      formData,
      setFormData,
      setShowOrderNoSuggestions,
      setOrderNoSuggestions,
      orderStore.fetchOrderColors,
      orderStore.fetchYorksysOrderETD,
      orderStore.resetOrderData,
      orderStore.fetchUsedColors,
    );

    // Auto-fill care symbols from the last report for this style
    orderStore.fetchLastCareSymbols(orderNo, setFormData);
  },

  handleInputChange: (field, value) => {
    const {
      _handleInputChangeBase,
      setFormData,
      setOrderNoSuggestions,
      setShowOrderNoSuggestions,
      setIsSearchingOrderNo,
      setShowColorDropdown,
      setShowPODropdown,
      setShowETDDropdown,
      handleOrderNoSelect,
    } = get();
    const orderStore = useOrderDataStore.getState();

    if (field === "reportType") {
      setFormData((prev) => ({ ...prev, reportType: value }));
      return;
    }

    _handleInputChangeBase(field, value, (f, v, newData, prev) => {
      if (
        (f === "ymStyle" && prev.ymStyle !== v) ||
        (f === "style" && prev.style !== v)
      ) {
        newData.color = [];
        newData.po = [];
        newData.exFtyDate = [];
        newData.washType = "Before Wash";
        newData.sampleSize = "";
        if (!v || v.length < 2) {
          newData.season = "";
          newData.styleDescription = "";
          newData.custStyle = "";
          newData.buyerStyle = "";
        }
      }
    });

    const isStyleField = field === "ymStyle" || field === "style";
    if (isStyleField && value.length >= 2) {
      handleOrderNoSearch(
        value,
        setOrderNoSuggestions,
        setShowOrderNoSuggestions,
        setIsSearchingOrderNo,
      );

      if (_colorFetchTimer) {
        clearTimeout(_colorFetchTimer);
        _colorFetchTimer = null;
      }
      if (shouldAutoFetchColors(value)) {
        _colorFetchTimer = setTimeout(async () => {
          if (shouldAutoFetchColors(value)) {
            const suggestions = await handleOrderNoSearch(
              value,
              setOrderNoSuggestions,
              setShowOrderNoSuggestions,
              setIsSearchingOrderNo,
            );
            if (suggestions && suggestions.length === 1) {
              handleOrderNoSelect(suggestions[0]);
            } else if (
              suggestions &&
              suggestions.some((s) => s.toUpperCase() === value.toUpperCase())
            ) {
              handleOrderNoSelect(
                suggestions.find(
                  (s) => s.toUpperCase() === value.toUpperCase(),
                ),
              );
            } else {
              const isPrefix =
                suggestions &&
                suggestions.some(
                  (s) =>
                    s.toUpperCase().startsWith(value.toUpperCase()) &&
                    s.length > value.length,
                );
              if (!isPrefix) {
                orderStore.fetchOrderColors(value, setFormData);
                orderStore.fetchYorksysOrderETD(value, setFormData);
                orderStore.fetchUsedColors(value);
              }
            }
          }
        }, 800);
      }
    } else if (isStyleField && value.length < 2) {
      setOrderNoSuggestions([]);
      setShowOrderNoSuggestions(false);
      orderStore.resetOrderData();
      setShowColorDropdown(false);
      setShowPODropdown(false);
      setShowETDDropdown(false);
      setFormData((prev) => ({
        ...prev,
        season: "",
        styleDescription: "",
        custStyle: "",
        buyerStyle: "",
        color: [],
        po: [],
        exFtyDate: [],
      }));
      if (_colorFetchTimer) {
        clearTimeout(_colorFetchTimer);
        _colorFetchTimer = null;
      }
    }
  },

  searchOrderNo: (value) => {
    if (value && value.length >= 2) {
      const {
        setOrderNoSuggestions,
        setShowOrderNoSuggestions,
        setIsSearchingOrderNo,
      } = get();
      handleOrderNoSearch(
        value,
        setOrderNoSuggestions,
        setShowOrderNoSuggestions,
        setIsSearchingOrderNo,
      );
    }
  },

  handleFileInputChange: (e) => {
    const { formData, setFormData } = get();
    handleFileInputChangeHandler(
      e,
      formData.images,
      setFormData,
      _fileInputRef,
      IMAGE_LIMITS.INITIAL,
    );
  },

  handleCameraInputChange: (e) => {
    const { formData, setFormData } = get();
    handleCameraInputChangeHandler(
      e,
      formData.images,
      setFormData,
      _cameraInputRef,
      IMAGE_LIMITS.INITIAL,
    );
  },

  triggerFileInput: () => {
    const { formData } = get();
    triggerFileInputHandler(
      formData.images,
      _fileInputRef,
      IMAGE_LIMITS.INITIAL,
      "Initial Step",
    );
  },

  triggerCameraInput: () => {
    const { formData } = get();
    triggerCameraInputHandler(
      formData.images,
      _cameraInputRef,
      IMAGE_LIMITS.INITIAL,
      "Initial Step",
    );
  },

  handleRemoveImageWrapper: (index) => {
    const { formData, setFormData } = get();
    const { imageRotations, setImageRotations, handleRemoveImage } =
      useImageStore.getState();
    handleRemoveImage(
      index,
      formData.images,
      (updater) =>
        setFormData((prevData) => ({
          ...prevData,
          images:
            typeof updater === "function" ? updater(prevData.images) : updater,
        })),
      imageRotations,
      setImageRotations,
    );
  },

  handleSubmit: async (e, user) => {
    e.preventDefault();
    const {
      formData,
      setFormData,
      resetForm,
      setActiveTab,
      setShowColorDropdown,
      setShowPODropdown,
      setShowETDDropdown,
    } = get();
    const modalStore = useModalStore.getState();
    const { completingReport } = modalStore;
    const reportStore = useWashingReportsStore.getState();
    const imageStore = useImageStore.getState();
    const orderStore = useOrderDataStore.getState();

    if (completingReport) {
      // While completing from the main form, show the same
      // submitting spinner + disable the button to block
      // duplicate clicks while the update is in-flight.
      set({ isSubmitting: true });
      try {
        const now = new Date().toISOString();
        const dateOnly = now.split("T")[0];
        const completionPayload = {
          ...formData,
          images: completingReport.images || [],
          completionImages: formData.images || [],
          status: "completed",
          completedDate: dateOnly,
          completedAt: now,
        };
        if (completingReport.status === "pending" || !completingReport.status) {
          completionPayload.receivedDate = dateOnly;
          completionPayload.receivedAt = now;
          if (user?.emp_id) completionPayload.receiver_emp_id = user.emp_id;
        }
        const reportId =
          completingReport._id != null
            ? String(completingReport._id)
            : completingReport.id != null
              ? String(completingReport.id)
              : "";
        const success = reportId
          ? await reportStore.updateReport(reportId, completionPayload)
          : false;
        if (success) {
          modalStore.setCompletingReport(null);
          const currentReportType =
            formData.reportType || REPORT_TYPES.GARMENT_WASH;
          resetForm(getInitialFormData(currentReportType));
          setActiveTab("reports");
          imageStore.setImageRotations({});
          setShowColorDropdown(false);
          setShowPODropdown(false);
          setShowETDDropdown(false);
          orderStore.resetOrderData();
        }
      } finally {
        set({ isSubmitting: false });
      }
      return;
    }

    const currentReportType = formData.reportType || REPORT_TYPES.GARMENT_WASH;
    await reportStore.submitReport(formData, user, () => {
      resetForm(getInitialFormData(currentReportType));
      imageStore.setImageRotations({});
      setShowColorDropdown(false);
      setShowPODropdown(false);
      setShowETDDropdown(false);
      orderStore.resetOrderData();
    });
  },

  cleanupTimers: () => {
    if (_colorFetchTimer) {
      clearTimeout(_colorFetchTimer);
      _colorFetchTimer = null;
    }
  },
}));
