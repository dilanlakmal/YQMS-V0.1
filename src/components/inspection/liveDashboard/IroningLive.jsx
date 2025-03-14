import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import DataTableWOI from "./DataTableWOI";
import FilterPaneWOI from "./FilterPaneWOI";

const IroningLive = () => {
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

  // Fetch ironing data
  const fetchIroningData = async (filters = {}, currentPage = page) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ironing-summary`, {
        params: { ...filters, page: currentPage, limit }
      });
      setTableData(response.data.tableData);
      setTotalRecords(response.data.total);
    } catch (error) {
      console.error("Error fetching ironing data:", error);
    }
  };

  // Handle pagination
  const handlePageChange = async (newPage) => {
    setPage(newPage);
    await fetchIroningData(filters, newPage);
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchIroningData();

    const intervalId = setInterval(() => fetchIroningData(filters), 5000);
    return () => clearInterval(intervalId);
  }, [filters]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <FilterPaneWOI
        module="ironing"
        empIdField="emp_id_ironing"
        filters={filters}
        setFilters={setFilters}
        fetchData={fetchIroningData}
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

export default IroningLive;
