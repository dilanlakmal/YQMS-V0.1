import { create } from "zustand";

/**
 * Zustand store for the washing report submission form.
 * Replaces useFormState hook + related local UI states.
 */
export const useFormStore = create((set, get) => ({
  formData: {},

  setFormData: (data) =>
    set({ formData: typeof data === "function" ? data(get().formData) : data }),

  setField: (field, value) =>
    set((s) => ({ formData: { ...s.formData, [field]: value } })),

  handleInputChange: (field, value, onFieldChange) => {
    set((s) => {
      const newData = { ...s.formData, [field]: value };
      if (onFieldChange) onFieldChange(field, value, newData, s.formData);
      return { formData: newData };
    });
  },

  resetForm: (defaultData) => set({ formData: defaultData || {} }),

  // ─── Order autocomplete UI state ──────────────────────────────────
  orderNoSuggestions: [],
  showOrderNoSuggestions: false,
  isSearchingOrderNo: false,
  setOrderNoSuggestions: (orderNoSuggestions) => set({ orderNoSuggestions }),
  setShowOrderNoSuggestions: (showOrderNoSuggestions) =>
    set({ showOrderNoSuggestions }),
  setIsSearchingOrderNo: (isSearchingOrderNo) => set({ isSearchingOrderNo }),

  // ─── Dropdown visibility states ───────────────────────────────────
  showColorDropdown: false,
  showPODropdown: false,
  showETDDropdown: false,
  isReportTypeOpen: false,
  setShowColorDropdown: (showColorDropdown) => set({ showColorDropdown }),
  setShowPODropdown: (showPODropdown) => set({ showPODropdown }),
  setShowETDDropdown: (showETDDropdown) => set({ showETDDropdown }),
  setIsReportTypeOpen: (isReportTypeOpen) => set({ isReportTypeOpen }),

  // ─── Navigation tab ───────────────────────────────────────────────
  activeTab: "form",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ─── Submission loading flag ──────────────────────────────────────
  isSubmitting: false,
  setIsSubmitting: (v) => set({ isSubmitting: v }),
}));
