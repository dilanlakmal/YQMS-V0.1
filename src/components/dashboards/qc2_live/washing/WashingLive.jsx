import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config"; // Adjust path if needed
import FilterPaneWOI from "./FilterPaneWOI";
import CardVisuals from "./CardVisuals";
import InspectorSummaryTable from "./InspectorSummaryTable";
import DataTableWOI from "./DataTableWOI";
import { FaSpinner } from "react-icons/fa";

const WashingLive = () => {
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    moNo: "",
    custStyle: "",
    buyer: "",
    color: "",
    size: "",
    empId: ""
  });

  const [statsData, setStatsData] = useState(null);
  const [inspectorSummaryData, setInspectorSummaryData] = useState([]);
  const [detailedTableData, setDetailedTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsLimit = 50;
  const [isLoading, setIsLoading] = useState(false);

  // Converts Date object from DatePicker to 'YYYY-MM-DD' string for API
  const formatDateForAPI = (date) => {
    if (!date) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  };

  const fetchDashboardData = useCallback(async (currentFilters, page = 1) => {
    setIsLoading(true);
    const params = {
      moNo: currentFilters.moNo,
      custStyle: currentFilters.custStyle,
      buyer: currentFilters.buyer,
      color: currentFilters.color,
      size: currentFilters.size,
      empId: currentFilters.empId,
      startDate: formatDateForAPI(currentFilters.startDate),
      endDate: formatDateForAPI(currentFilters.endDate)
    };

    try {
      const statsPromise = axios.get(`${API_BASE_URL}/api/washing-stats`, {
        params
      });
      const inspectorSummaryPromise = axios.get(
        `${API_BASE_URL}/api/washing-inspector-summary`,
        { params }
      );
      const detailedDataPromise = axios.get(
        `${API_BASE_URL}/api/washing-detailed-data`,
        {
          params: { ...params, page, limit: recordsLimit }
        }
      );

      const [statsRes, inspectorRes, detailedRes] = await Promise.all([
        statsPromise,
        inspectorSummaryPromise,
        detailedDataPromise
      ]);

      setStatsData(statsRes.data);
      setInspectorSummaryData(inspectorRes.data);
      setDetailedTableData(detailedRes.data.tableData);
      setTotalRecords(detailedRes.data.total);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStatsData({
        totalGoodQty: 0,
        totalGoodBundles: 0,
        totalRewashQty: 0,
        totalInspectors: 0
      });
      setInspectorSummaryData([]);
      setDetailedTableData([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array as formatDateForAPI is stable and recordsLimit too.

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    fetchDashboardData(newFilters, 1);
  };

  useEffect(() => {
    fetchDashboardData(filters, 1); // Initial load

    // Optional: Auto-refresh
    // const intervalId = setInterval(() => fetchDashboardData(filters, currentPage), 30000);
    // return () => clearInterval(intervalId);
  }, []); // Only on mount for initial load. Subsequent loads via handleApplyFilters or page change.

  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= Math.ceil(totalRecords / recordsLimit) &&
      newPage !== currentPage
    ) {
      fetchDashboardData(filters, newPage);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        QC2 Washing Live Dashboard
      </h1>

      <FilterPaneWOI
        filters={filters}
        // setFilters is not strictly needed by FilterPaneWOI if all updates go through onApply
        onApply={handleApplyFilters} // Renamed from setFilters to onApply for clarity
        module="washing"
        empIdField="emp_id_washing"
      />

      {isLoading && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl flex items-center">
            <FaSpinner className="animate-spin text-2xl text-blue-600 mr-3" />
            <div className="text-lg font-medium">Loading Dashboard Data...</div>
          </div>
        </div>
      )}

      <CardVisuals stats={statsData} />
      <InspectorSummaryTable inspectorData={inspectorSummaryData} />
      <DataTableWOI
        tableData={detailedTableData}
        totalRecords={totalRecords}
        page={currentPage}
        limit={recordsLimit}
        handlePageChange={handlePageChange}
      />
    </div>
  );
};

export default WashingLive;
