import { create } from "zustand";
import { API_BASE_URL } from "../../../config.js";
import showToast from "../../utils/toast.js";

/**
 * Zustand store for order lookup data (colors, POs, ETDs, sizes, etc.)
 * and factory list. Any component can read directly without prop drilling.
 */
export const useOrderDataStore = create((set) => ({
  availableColors:  [],
  availablePOs:     [],
  availableETDs:    [],
  availableSizes:   [],
  usedColors:       [],
  fabrication:      "",
  fabricContent:    [],
  season:           "",
  styleDescription: "",
  custStyle:        "",
  anfSpecs:         [],
  isLoadingColors:  false,
  isLoadingSpecs:   false,

  // ─── Factories (shared across FormSection, ReportsList, EditReportModal) ─
  factories:          [],
  isLoadingFactories: false,

  setAvailableColors:  (v) => set({ availableColors: v }),
  setAvailablePOs:     (v) => set({ availablePOs: v }),
  setAvailableETDs:    (v) => set({ availableETDs: v }),
  setAvailableSizes:   (v) => set({ availableSizes: v }),
  setUsedColors:       (v) => set({ usedColors: v }),
  setFabrication:      (v) => set({ fabrication: v }),
  setFabricContent:    (v) => set({ fabricContent: v }),
  setSeason:           (v) => set({ season: v }),
  setStyleDescription: (v) => set({ styleDescription: v }),
  setCustStyle:        (v) => set({ custStyle: v }),
  setAnfSpecs:         (v) => set({ anfSpecs: v }),
  setIsLoadingColors:  (v) => set({ isLoadingColors: v }),
  setIsLoadingSpecs:   (v) => set({ isLoadingSpecs: v }),

  fetchFactories: async () => {
    set({ isLoadingFactories: true });
    try {
      const response = await fetch(`${API_BASE_URL}/api/subcon-sewing-factories-manage`);
      if (response.ok) {
        const data = await response.json();
        set({ factories: data });
      } else {
        console.error("Failed to fetch factories");
        showToast.error("Failed to load factories. Please check your connection.");
      }
    } catch (error) {
      console.error("Error fetching factories:", error);
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("ERR_CONNECTION_REFUSED")
      ) {
        showToast.error(
          `Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend server is running.`
        );
      } else {
        showToast.error("Error loading factories. Please try again.");
      }
    } finally {
      set({ isLoadingFactories: false });
    }
  },

  resetOrderData: () =>
    set({
      availableColors:  [],
      availablePOs:     [],
      availableETDs:    [],
      availableSizes:   [],
      fabrication:      "",
      fabricContent:    [],
      season:           "",
      styleDescription: "",
      custStyle:        "",
      anfSpecs:         [],
    }),
}));
