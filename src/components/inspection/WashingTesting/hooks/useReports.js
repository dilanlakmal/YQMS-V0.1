import { useState, useCallback } from "react";
import { API_BASE_URL } from "../../../../../config.js";
import showToast from "../../../../utils/toast.js";

/**
 * Custom hook for report CRUD operations.
 * NOTE: This hook is superseded by useWashingReportsStore (Zustand).
 * Kept for potential re-use; socket dependency removed.
 */
export const useReports = () => {
  const [reports, setReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [expandedReports, setExpandedReports] = useState(new Set());
  const [printingReportId, setPrintingReportId] = useState(null);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });

  // Fetch reports from backend
  const fetchReports = useCallback(async (filters = {}) => {
    setIsLoadingReports(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("limit", filters.limit || 10);
      queryParams.append("page", filters.page || 1);

      if (filters.search) queryParams.append("ymStyle", filters.search);
      if (filters.factory) queryParams.append("factory", filters.factory);
      if (filters.color) queryParams.append("color", filters.color);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.reportType)
        queryParams.append("reportType", filters.reportType);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);

      const response = await fetch(
        `${API_BASE_URL}/api/report-washing?${queryParams.toString()}`,
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setReports(result.data || []);
          if (result.pagination) {
            setPagination(result.pagination);
          }
        } else {
          showToast.error(
            "Failed to load reports. Please check your connection.",
          );
        }
      } else {
        showToast.error(
          "Failed to load reports. Please check your connection.",
        );
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
      setIsLoadingReports(false);
    }
  }, []);

  // Delete report
  const deleteReport = useCallback(
    async (reportId) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/report-washing/${reportId}`,
          {
            method: "DELETE",
          },
        );

        if (response.ok) {
          setReports((prev) =>
            prev.filter(
              (report) => report._id !== reportId && report.id !== reportId,
            ),
          );
          showToast.success("Report deleted successfully!");
          await fetchReports();
          return true;
        } else {
          const result = await response.json();
          showToast.error(result.message || "Failed to delete report");
          return false;
        }
      } catch (error) {
        console.error("Error deleting report:", error);
        showToast.error("An error occurred while deleting the report.");
        return false;
      }
    },
    [fetchReports],
  );

  // Toggle report expansion
  const toggleReport = useCallback((reportId) => {
    setExpandedReports((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  }, []);

  return {
    reports,
    setReports,
    isLoadingReports,
    expandedReports,
    printingReportId,
    setPrintingReportId,
    fetchReports,
    deleteReport,
    toggleReport,
    pagination,
  };
};
