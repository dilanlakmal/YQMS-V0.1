import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import FilterPane from "../liveDashboard/FilterPane";
import OrderChart from "./OrderChart";
import {
  Table,
  BarChart2,
  Package,
  Shirt,
  Palette,
  Ruler,
  ShoppingBag
} from "lucide-react"; // Added icons for cards

const OrderData = () => {
  const [summary, setSummary] = useState({
    totalRegisteredBundleQty: 0,
    totalGarmentsQty: 0,
    totalMO: 0,
    totalColors: 0,
    totalSizes: 0,
    totalOrderQty: 0
  });
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;
  const [activeTab, setActiveTab] = useState("Summary");

  // Filter states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [moNo, setMoNo] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [department, setDepartment] = useState("");
  const [empId, setEmpId] = useState("");
  const [buyer, setBuyer] = useState("");
  const [lineNo, setLineNo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});

  const filtersRef = useRef({});

  // Format Date to "MM/DD/YYYY"
  const formatDate = (date) => {
    if (!date) return "";
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Fetch order data
  const fetchOrderData = async (filters = {}, currentPage = page) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-orderdata-summary`,
        {
          params: { ...filters, page: currentPage, limit }
        }
      );
      setSummary(response.data.summary);
      setTableData(response.data.tableData);
      setTotalRecords(response.data.total);
    } catch (error) {
      console.error("Error fetching order data:", error);
    }
  };

  // Apply Filters
  const handleApplyFilters = async () => {
    const filters = {};
    if (moNo) filters.moNo = moNo;
    if (color) filters.color = color;
    if (size) filters.size = size;
    if (department) filters.department = department;
    if (empId) filters.empId = empId;
    if (startDate) filters.startDate = formatDate(startDate);
    if (endDate) filters.endDate = formatDate(endDate);
    if (buyer) filters.buyer = buyer;
    if (lineNo) filters.lineNo = lineNo;

    const applied = {};
    if (startDate) applied["Start Date"] = formatDate(startDate);
    if (endDate) applied["End Date"] = formatDate(endDate);
    if (moNo) applied["MO No"] = moNo;
    if (color) applied["Color"] = color;
    if (size) applied["Size"] = size;
    if (department) applied["Department"] = department;
    if (empId) applied["Emp ID"] = empId;
    if (buyer) applied["Buyer"] = buyer;
    if (lineNo) applied["Line No"] = lineNo;

    setAppliedFilters(applied);
    filtersRef.current = filters;
    setPage(1);
    await fetchOrderData(filters, 1);
  };

  // Reset Filters
  const handleResetFilters = async () => {
    setStartDate(null);
    setEndDate(null);
    setMoNo("");
    setColor("");
    setSize("");
    setDepartment("");
    setEmpId("");
    setBuyer("");
    setLineNo("");
    setAppliedFilters({});
    filtersRef.current = {};
    setPage(1);
    await fetchOrderData({}, 1);
  };

  // Handle Pagination
  const handlePageChange = async (newPage) => {
    setPage(newPage);
    await fetchOrderData(filtersRef.current, newPage);
  };

  // Initial Fetch and Auto-Refresh
  useEffect(() => {
    fetchOrderData();

    const intervalId = setInterval(async () => {
      await fetchOrderData(filtersRef.current);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Update filtersRef
  useEffect(() => {
    filtersRef.current = {
      moNo,
      color,
      size,
      department,
      empId,
      startDate: startDate ? formatDate(startDate) : null,
      endDate: endDate ? formatDate(endDate) : null,
      buyer,
      lineNo
    };
  }, [moNo, color, size, department, empId, startDate, endDate, buyer, lineNo]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Filter Pane */}
      <FilterPane
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        moNo={moNo}
        setMoNo={setMoNo}
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
        department={department}
        setDepartment={setDepartment}
        empId={empId}
        setEmpId={setEmpId}
        buyer={buyer}
        setBuyer={setBuyer}
        lineNo={lineNo}
        setLineNo={setLineNo}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        dataSource="qc2_orderdata"
      />

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("Summary")}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            activeTab === "Summary"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Table className="mr-2" size={20} />
          Summary
        </button>
        <button
          onClick={() => setActiveTab("Chart")}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            activeTab === "Chart"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-200"
          }`}
        >
          <BarChart2 className="mr-2" size={20} />
          Chart
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "Summary" && (
        <>
          {/* Header Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {/* Total Registered Bundle Qty */}
            <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
              <Shirt className="text-green-500" size={32} />
              <div>
                <h3 className="text-sm font-semibold text-gray-600">
                  Total Bundle Qty
                </h3>
                <p className="text-xl font-bold text-gray-800">
                  {(summary.totalRegisteredBundleQty || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Total Order Qty */}
            <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
              <ShoppingBag className="text-teal-500" size={32} />
              <div>
                <h3 className="text-sm font-semibold text-gray-600">
                  Total Order Qty
                </h3>
                <p className="text-xl font-bold text-gray-800">
                  {(summary.totalOrderQty || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Total Garments Qty */}
            <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
              <Shirt className="text-green-500" size={32} />
              <div>
                <h3 className="text-sm font-semibold text-gray-600">
                  Total Garments Qty
                </h3>
                <p className="text-xl font-bold text-gray-800">
                  {(summary.totalGarmentsQty || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Total MO */}
            <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
              <Table className="text-purple-500" size={32} />
              <div>
                <h3 className="text-sm font-semibold text-gray-600">
                  Total Unique MOs
                </h3>
                <p className="text-xl font-bold text-gray-800">
                  {(summary.totalMO || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Total Colors */}
            <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
              <Palette className="text-pink-500" size={32} />
              <div>
                <h3 className="text-sm font-semibold text-gray-600">
                  Total Unique Colors
                </h3>
                <p className="text-xl font-bold text-gray-800">
                  {(summary.totalColors || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Total Sizes */}
            <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
              <Ruler className="text-orange-500" size={32} />
              <div>
                <h3 className="text-sm font-semibold text-gray-600">
                  Total Unique Sizes
                </h3>
                <p className="text-xl font-bold text-gray-800">
                  {(summary.totalSizes || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="min-w-full table-fixed">
                <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-1/12">
                      Line No
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-1/12">
                      MO No
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-2/12">
                      Cust. Style
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-1/12">
                      Country
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-1/12">
                      Buyer
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-1/12">
                      Color
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-1/12">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-2/12">
                      Total Registered
                      <br />
                      Bundle Qty
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-1/12">
                      Total
                      <br />
                      Garments
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tableData.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.lineNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.moNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.custStyle}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.country}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.buyer}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.color}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.size}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                        {row.totalRegisteredBundleQty.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                        {row.totalGarments.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300 hover:bg-blue-600"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {page} of {Math.ceil(totalRecords / limit)}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= Math.ceil(totalRecords / limit)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300 hover:bg-blue-600"
            >
              Next
            </button>
          </div>
        </>
      )}

      {activeTab === "Chart" && <OrderChart filters={filtersRef.current} />}
    </div>
  );
};

export default OrderData;
