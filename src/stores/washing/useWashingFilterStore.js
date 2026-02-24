import { create } from "zustand";

const defaultFilters = {
  startDate: "",
  endDate: "",
  search: "",
  color: "",
  factory: "",
  status: "",
  page: 1,
  limit: 10,
  reportType: "",
};

/**
 * Zustand store for washing report filter states.
 * Replaces 18 individual useState hooks (9 standard + 9 warehouse).
 */
export const useWashingFilterStore = create((set, get) => ({
  standard: { ...defaultFilters },
  warehouse: { ...defaultFilters },

  /**
   * Set a single filter field. Automatically resets page to 1
   * unless the field being changed IS page.
   */
  setFilter: (tab, key, value) =>
    set((state) => ({
      [tab]: {
        ...state[tab],
        [key]: value,
        ...(key !== "page" ? { page: 1 } : {}),
      },
    })),

  /**
   * Set page directly (no auto-reset, used for pagination clicks).
   */
  setPage: (tab, page) =>
    set((state) => ({
      [tab]: { ...state[tab], page },
    })),

  /**
   * Reset all filters for a tab back to defaults,
   * preserving the current limit preference.
   */
  resetFilters: (tab) =>
    set((state) => ({
      [tab]: { ...defaultFilters, limit: state[tab].limit },
    })),

  /** Convenience getter — returns filter object for a tab. */
  getFilters: (tab) => get()[tab],
}));
