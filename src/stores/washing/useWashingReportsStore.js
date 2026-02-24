import { create } from "zustand";
import { API_BASE_URL } from "../../../config.js";
import showToast from "../../utils/toast.js";

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

/**
 * Zustand store for washing reports data.
 * Replaces two separate useReports hook instances (standard + warehouse).
 * Real-time updates are handled via explicit fetchReports() calls after
 * every mutation (create / update / delete) and on filter changes.
 * Socket.IO is no longer used here.
 */
export const useWashingReportsStore = create((set, get) => ({
  standard: defaultTabState(),
  warehouse: defaultTabState(),

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
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.reportType) queryParams.append("reportType", filters.reportType);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);

      const response = await fetch(
        `${API_BASE_URL}/api/report-washing?${queryParams.toString()}`
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
          `Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend server is running on port 5001.`
        );
      } else {
        showToast.error("Error loading reports. Please try again.");
      }
    } finally {
      set((s) => ({ [tab]: { ...s[tab], isLoading: false } }));
    }
  },

  // ─── Reject (warehouse: e.g. color mismatch) ──────────────────────
  rejectReport: async (tab, reportId, body = {}, refetchFilters) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/report-washing/${reportId}/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (response.ok) {
        showToast.success("Report rejected.");
        if (refetchFilters) {
          await get().fetchReports(tab, refetchFilters);
        }
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
      const response = await fetch(
        `${API_BASE_URL}/api/report-washing/${reportId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        set((s) => ({
          [tab]: {
            ...s[tab],
            reports: s[tab].reports.filter(
              (r) => r._id !== reportId && r.id !== reportId
            ),
          },
        }));
        showToast.success("Report deleted successfully!");
        if (refetchFilters) {
          await get().fetchReports(tab, refetchFilters);
        }
        return true;
      } else {
        const result = await response.json();
        showToast.error(result.message || "Failed to delete report");
        return false;
      }
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
}));
