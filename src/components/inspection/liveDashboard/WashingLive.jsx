import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import DataTableWOI from "./DataTableWOI";
import FilterPaneWOI from "./FilterPaneWOI";

const WashingLive = () => {
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [filters, setFilters] = useState({
    moNo: "",
    custStyle: "",
    buyer: "",
    color: "",
    size: "",
    empId: ""
  });

  // Fetch washing data
  const fetchWashingData = async (filters = {}, currentPage = page) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/washing-summary`, {
        params: { ...filters, page: currentPage, limit }
      });
      setTableData(response.data.tableData);
      setTotalRecords(response.data.total);
    } catch (error) {
      console.error("Error fetching washing data:", error);
    }
  };

  // Handle pagination
  const handlePageChange = async (newPage) => {
    setPage(newPage);
    await fetchWashingData(filters, newPage);
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchWashingData();

    const intervalId = setInterval(() => fetchWashingData(filters), 5000);
    return () => clearInterval(intervalId);
  }, [filters]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <FilterPaneWOI
        module="washing"
        empIdField="emp_id_washing"
        filters={filters}
        setFilters={setFilters}
        fetchData={fetchWashingData}
        setPage={setPage}
      />
      <DataTableWOI
        tableData={tableData}
        totalRecords={totalRecords}
        page={page}
        limit={limit}
        handlePageChange={handlePageChange}
      />
    </div>
  );
};

export default WashingLive;
