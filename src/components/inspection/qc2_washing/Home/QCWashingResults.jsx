import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Select from "react-select";
import DatePicker from "react-datepicker";
import { useAuth } from "../../../authentication/AuthContext";
import { API_BASE_URL } from "../../../../../config";
import { subDays } from "date-fns";
import {
  Loader2,
  AlertTriangle,
  MoreVertical,
  FileText,
  Trash2,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import QCWashingViewDetailsModal from "./QCWashingViewDetailsModal";
import QCWashingFullReportModal from "./QCWashingFullReportModal";

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
      case 'processing':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
      case 'auto-saved':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300";
    }
  };

  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full inline-block ${getStatusColor(status)}`}>
      {status || 'Unknown'}
    </span>
  );
};

const ActionMenu = ({ item, onViewDetails, onFullReport, onDownloadPDF, onDelete }) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex justify-center w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
          <MoreVertical className="w-5 h-5" />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 w-56 mt-2 origin-top-right bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onViewDetails(item)}
                  className={`${
                    active ? "bg-indigo-500 text-white" : "text-gray-900 dark:text-gray-200"
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                >
                  <Eye className="w-5 h-5 mr-2" />
                  View Details
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onFullReport(item)}
                  className={`${
                    active ? "bg-indigo-500 text-white" : "text-gray-900 dark:text-gray-200"
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Full Report
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onDownloadPDF(item)}
                  className={`${
                    active ? "bg-indigo-500 text-white" : "text-gray-900 dark:text-gray-200"
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </button>
              )}
            </Menu.Item>
          </div>
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onDelete(item)}
                  className={`${
                    active ? "bg-red-500 text-white" : "text-red-600 dark:text-red-400"
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const QCWashingResults = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    buyer: { value: "All", label: "All Buyers" },
    moNo: { value: "All", label: "All MOs" },
    color: { value: "All", label: "All Colors" },
    qcID: { value: "All", label: "All QCs" }
  });

  const [filterOptions, setFilterOptions] = useState({
    buyers: [],
    moNos: [],
    colors: [],
    qcIDs: []
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [isFullReportModalOpen, setIsFullReportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/qc-washing/results/filters`);
        setFilterOptions({
          buyers: [
            { value: "All", label: "All Buyers" },
            ...res.data.buyerOptions.map((b) => ({ value: b, label: b }))
          ],
          moNos: [
            { value: "All", label: "All MOs" },
            ...res.data.moOptions.map((m) => ({ value: m, label: m }))
          ],
          colors: [
            { value: "All", label: "All Colors" },
            ...res.data.colorOptions.map((c) => ({ value: c, label: c }))
          ],
          qcIDs: [
            { value: "All", label: "All QCs" },
            ...res.data.qcOptions.map((q) => ({ value: q, label: q }))
          ]
        });
      } catch (err) {
        console.error("Failed to fetch filter options", err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/qc-washing/results`, {
          params: {
            startDate: filters.startDate.toISOString().split("T")[0],
            endDate: filters.endDate.toISOString().split("T")[0],
            buyer: filters.buyer.value !== "All" ? filters.buyer.value : undefined,
            moNo: filters.moNo.value !== "All" ? filters.moNo.value : undefined,
            color: filters.color.value !== "All" ? filters.color.value : undefined,
            qcID: filters.qcID.value !== "All" ? filters.qcID.value : undefined
          }
        });
        setData(res.data);
      } catch (err) {
        setError("Failed to fetch QC Washing results. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (filters.startDate && filters.endDate) {
      fetchData();
    }
  }, [filters]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [data, currentPage]);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setIsViewDetailsModalOpen(true);
  };

  const handleFullReport = (item) => {
    setSelectedItem(item);
    setIsFullReportModalOpen(true);
  };

  const handleDownloadPDF = async (item) => {
    try {
      // First fetch inspector details if userId exists
      let inspectorDetails = null;
      if (item.userId) {
        try {
          const inspectorResponse = await axios.get(`${API_BASE_URL}/api/users/${item.userId}`);
          if (inspectorResponse.data && !inspectorResponse.data.error) {
            inspectorDetails = inspectorResponse.data;
          }
        } catch (inspectorError) {
          console.warn('Could not fetch inspector details:', inspectorError);
        }
      }

      // Call PDF generation endpoint with inspector details
      const response = await axios.post(`${API_BASE_URL}/api/qc-washing/pdf/${item._id}`, {
        inspectorDetails: inspectorDetails
      }, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QC_Washing_Report_${item.orderNo}_${item.colorName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to delete the record for ${item.orderNo} - ${item.colorName}?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/api/qc-washing/${item._id}`);
        setData(data.filter(d => d._id !== item._id));
        alert('Record deleted successfully');
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Failed to delete record. Please try again.');
      }
    }
  };

  const selectStyles = {
    control: (styles) => ({
      ...styles,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border-primary)"
    }),
    singleValue: (styles) => ({
      ...styles,
      color: "var(--color-text-primary)"
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: "var(--color-bg-secondary)"
    }),
    option: (styles, { isFocused, isSelected }) => ({
      ...styles,
      backgroundColor: isSelected
        ? "#4f46e5"
        : isFocused
        ? "var(--color-bg-tertiary)"
        : "var(--color-bg-secondary)",
      color: isSelected ? "white" : "var(--color-text-primary)"
    })
  };

  return (
    <div className="p-2 sm:p-3 lg:p-3 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <div className="max-w-screen-2xl mx-auto">
        <h1 className="text-lg font-bold mb-2">QC Washing Results</h1>

        {/* Filters Section */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <DatePicker
                selected={filters.startDate}
                onChange={(date) => setFilters((f) => ({ ...f, startDate: date }))}
                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <DatePicker
                selected={filters.endDate}
                onChange={(date) => setFilters((f) => ({ ...f, endDate: date }))}
                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Buyer</label>
              <Select
                options={filterOptions.buyers}
                value={filters.buyer}
                onChange={(val) => setFilters((f) => ({ ...f, buyer: val }))}
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">MO No</label>
              <Select
                options={filterOptions.moNos}
                value={filters.moNo}
                onChange={(val) => setFilters((f) => ({ ...f, moNo: val }))}
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <Select
                options={filterOptions.colors}
                value={filters.color}
                onChange={(val) => setFilters((f) => ({ ...f, color: val }))}
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">QC ID</label>
              <Select
                options={filterOptions.qcIDs}
                value={filters.qcID}
                onChange={(val) => setFilters((f) => ({ ...f, qcID: val }))}
                styles={selectStyles}
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Found <span className="text-indigo-600 dark:text-indigo-400">{data.length}</span> records.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th rowSpan="2" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    MO No
                  </th>
                  <th rowSpan="2" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Color
                  </th>
                  <th rowSpan="2" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    QC ID
                  </th>
                  <th rowSpan="2" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Order Qty
                  </th>
                  <th rowSpan="2" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Color Order Qty
                  </th>
                  <th rowSpan="2" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Size
                  </th>
                  <th rowSpan="2" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th colSpan="3" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-l border-r border-gray-200 dark:border-gray-600">
                    Defect Details
                  </th>
                  <th colSpan="7" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                    Measurement Details
                  </th>
                  <th rowSpan="2" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
                <tr className="border-t border-gray-200 dark:border-gray-600">
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-l border-gray-200 dark:border-gray-600">
                    Garment No
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Defect Name
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                    Defect Count
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total Checked Points
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total Pass
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total Fail
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tolerance -
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tolerance +
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Overall Result
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                    Measurement Result
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="18" className="text-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="18" className="text-center p-8 text-red-500">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                      {error}
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="18" className="text-center p-8 text-gray-500">
                      No data available for the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        {item.orderNo}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {item.colorName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {item.userId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        {item.orderQty}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        {item.colorOrderQty}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-center">
                        {item.measurementDetails?.measurement?.[0]?.size || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-center">
                        {item.defectDetails?.defectsByPc?.length || 0}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-center">
                        {item.defectDetails?.defectsByPc?.[0]?.pcDefects?.[0]?.defectName || 'N/A'}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-center">
                        {item.defectDetails?.defectsByPc?.[0]?.pcDefects?.[0]?.defectQty || 0}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-center">
                        {item.totalCheckedPoint}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-green-600 dark:text-green-400 text-center">
                        {item.totalPass}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-red-600 dark:text-red-400 text-center">
                        {item.totalFail}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-red-500 text-center">
                        {item.measurementDetails?.measurementSizeSummary?.[0]?.minusToleranceFailCount || 0}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-rose-500 text-center">
                        {item.measurementDetails?.measurementSizeSummary?.[0]?.plusToleranceFailCount || 0}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm font-semibold text-center">
                        {item.overallFinalResult}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm font-semibold text-center">
                        {item.passRate}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                        <ActionMenu
                          item={item}
                          onViewDetails={handleViewDetails}
                          onFullReport={handleFullReport}
                          onDownloadPDF={handleDownloadPDF}
                          onDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-md transition-colors ${
                      currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-5 w-5 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedItem && (
        <>
          <QCWashingViewDetailsModal
            isOpen={isViewDetailsModalOpen}
            onClose={() => setIsViewDetailsModalOpen(false)}
            itemData={selectedItem}
          />
          <QCWashingFullReportModal
            isOpen={isFullReportModalOpen}
            onClose={() => setIsFullReportModalOpen(false)}
            recordData={selectedItem}
          />
        </>
      )}
    </div>
  );
};

export default QCWashingResults;