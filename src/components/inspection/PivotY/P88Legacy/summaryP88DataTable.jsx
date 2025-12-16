import React, { useState, useEffect, useCallback } from 'react';
import InspectionReportModal from '../P88Legacy/inspectionreport.jsx';
import FilterPanel from './FilterPanel.jsx';
import SummaryCards from './SummaryCards.jsx';
import ReactPaginate from 'react-paginate';

const SummaryP88Data = () => {
  const [inspectionData, setInspectionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [summary, setSummary] = useState({ total: 0, passed: 0, failed: 0, pending: 0, hold: 0 });
  const [filterOptions, setFilterOptions] = useState({
    inspector: [],
    supplier: [],
    project: [],
    reportType: []
  });

  // State for server-side operations
  const [currentPage, setCurrentPage] = useState(0); // react-paginate is 0-indexed
  const [pageCount, setPageCount] = useState(0);
  const [filters, setFilters] = useState({
    inspectionResult: '',
    approvalStatus: '',
    inspector: '',
    supplier: '',
    project: '',
    reportType: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'scheduledInspectionDate',
    direction: 'desc'
  });

  useEffect(() => {
    // Fetch options only on initial component mount
    fetchFilterOptions();
  }, []);

  const fetchInspectionData = useCallback(async () => {
    try {
      setLoading(true);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const params = new URLSearchParams({
        page: currentPage + 1, // API is 1-indexed
        limit: 50,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });
      const response = await fetch(`${apiBaseUrl}/api/p88-data?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch inspection data');
      }
      const data = await response.json();
      setInspectionData(data.results || []);
      setPageCount(data.pagination.totalPages || 0);
      setSummary(data.summary || { total: 0, passed: 0, failed: 0, pending: 0, hold: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sortConfig]); // fetchInspectionData is dependent on these states

  // This primary useEffect handles all data fetching logic
  useEffect(() => {
    // Debounce to prevent rapid API calls while typing in filters
    const handler = setTimeout(() => {
      fetchInspectionData();
    }, 500); // 500ms delay

    // Cleanup function to cancel the timeout if dependencies change again quickly
    return () => {
      clearTimeout(handler);
    };
    // This effect runs when the page, filters, or sort config change
  }, [currentPage, filters, sortConfig, fetchInspectionData]);

  const fetchFilterOptions = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/p88-data/filter-options`);
      if (!response.ok) {
        throw new Error('Failed to fetch filter options');
      }
      const data = await response.json();
      setFilterOptions(data.data);
    } catch (err) {
      // Non-critical error, so we just log it
      console.error(err.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Pass': 'bg-green-100 text-green-800',
      'Fail': 'bg-red-100 text-red-800',
      'Pending Approval': 'bg-yellow-100 text-yellow-800',
      'Not Completeed': 'bg-blue-100 text-blue-800',
      'Reworked': 'bg-purple-100 text-purple-800',
      'Accepted': 'bg-green-500 text-white',
      'Rejected': 'bg-red-500 text-white'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Not Completed'}
      </span>
    );
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    // When filters change, always go back to the first page
    setCurrentPage(0);
  };

  // const handleFilterChange = (key, value) => {
  //   setFilters(prev => ({
  //     ...prev,
  //     [key]: value
  //   }));
  // };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  const handleViewReport = (inspection) => {
    setSelectedInspection(inspection);
    setShowReportModal(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-600">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg">Loading inspection data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-red-600">
        <p className="text-lg mb-4">Error: {error}</p>
        <button 
          onClick={fetchInspectionData} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 bg-gray-50 min-h-screen">
      
      {/* Summary Cards Section */}
      <SummaryCards summary={summary} />

      <FilterPanel filters={filters} onFilterChange={handleFilterChange} options={filterOptions} />

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th 
                  onClick={() => handleSort('scheduledInspectionDate')}
                  className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  Scheduled Inspection Date
                  {sortConfig.key === 'scheduledInspectionDate' && (
                    <span className={`ml-1 text-xs ${sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-blue-500'}`}>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th 
                  onClick={() => handleSort('inspector')}
                  className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  Inspector
                  {sortConfig.key === 'inspector' && (
                    <span className={`ml-1 text-xs ${sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-blue-500'}`}>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th 
                  onClick={() => handleSort('approvalStatus')}
                  className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  Approval Status
                  {sortConfig.key === 'approvalStatus' && (
                    <span className={`ml-1 text-xs ${sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-blue-500'}`}>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th 
                  onClick={() => handleSort('reportType')}
                  className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  Report Type
                </th>
                <th 
                  onClick={() => handleSort('etd')}
                  className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  ETD
                </th>
                <th 
                  onClick={() => handleSort('eta')}
                  className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  ETA
                </th>
                <th 
                  onClick={() => handleSort('poNumbers')}
                  className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  PO #
                </th>
                <th 
                  onClick={() => handleSort('submittedInspectionDate')}
                  className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  Submitted Inspection Date
                </th>
                <th 
                  onClick={() => handleSort('qtyToInspect')}
                  className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  Qty to Inspect
                </th>
                <th 
                  onClick={() => handleSort('qtyInspected')}
                  className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  Qty Inspected
                </th>
                <th 
                  onClick={() => handleSort('totalPoItemsQty')}
                  className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  Total PO Items Qty
                </th>
                <th 
                  onClick={() => handleSort('supplier')}
                  className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  Supplier Booking Comments
                </th>
                <th 
                  onClick={() => handleSort('project')}
                  className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  Project
                </th>
                <th 
                  onClick={() => handleSort('sampleInspected')}
                  className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  Sample Inspected
                </th>
                <th className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 whitespace-nowrap">
                  Factory Name (Inspection)
                </th>
                <th className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 whitespace-nowrap">
                  Docs
                </th>
                <th className="px-2 py-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {inspectionData.map((inspection, index) => (
                <tr key={inspection._id || index} className="hover:bg-gray-50 border-b border-gray-200">
                  <td className="px-2 py-2.5 align-middle max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {formatDateTime(inspection.scheduledInspectionDate)}
                  </td>
                  <td className="px-2 py-2.5 align-middle max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {inspection.inspector || '-'}
                  </td>
                  <td className="px-2 py-2.5 align-middle">
                    {getStatusBadge(inspection.approvalStatus)}
                  </td>
                  <td className="px-2 py-2.5 align-middle max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {inspection.reportType || '-'}
                  </td>
                  <td className="px-2 py-2.5 align-middle max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {inspection.etd && inspection.etd.length > 0 
                      ? formatDate(inspection.etd[0]) 
                      : '-'
                    }
                  </td>
                  <td className="px-2 py-2.5 align-middle max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {inspection.eta && inspection.eta.length > 0 
                      ? formatDate(inspection.eta[0]) 
                      : '-'
                    }
                  </td>
                  <td className="px-2 py-2.5 align-middle max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {inspection.poNumbers?.join(', ') || '-'}
                  </td>
                  <td className="px-2 py-2.5 align-middle max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {formatDateTime(inspection.submittedInspectionDate)}
                  </td>
                  <td className="px-2 py-2.5 align-middle text-center">
                    {inspection.qtyToInspect || 0}
                  </td>
                  <td className="px-2 py-2.5 align-middle text-center">
                    {inspection.qtyInspected || 0}
                  </td>
                  <td className="px-2 py-2.5 align-middle text-center">
                    {inspection.totalPoItemsQty || 0}
                  </td>
                  <td className="px-2 py-2.5 align-middle max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {inspection.allComments || '-'}
                  </td>
                  <td className="px-2 py-2.5 align-middle max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {inspection.project || '-'}
                  </td>
                  <td className="px-2 py-2.5 align-middle text-center">
                    {inspection.sampleInspected || 0}
                  </td>
                  <td className="px-2 py-2.5 align-middle max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {inspection.inspectionLocation || '-'}
                  </td>
                  <td className="px-2 py-2.5 align-middle text-center">
                    <button 
                      className="px-2 py-1 bg-gray-500 text-white rounded text-xs opacity-60 cursor-not-allowed"
                      disabled
                    >
                      📄
                    </button>
                  </td>
                  <td className="px-2 py-2.5 align-middle">
                    <div className="flex gap-1">
                      <button 
                        className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors duration-200 whitespace-nowrap"
                        onClick={() => handleViewReport(inspection)}
                        title="View Full Report"
                      >
                        📊 Full Report
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      <div className="flex justify-center mt-5">
        <ReactPaginate
          previousLabel={'< Previous'}
          nextLabel={'Next >'}
          breakLabel={'...'}
          pageCount={pageCount}
          marginPagesDisplayed={2}
          pageRangeDisplayed={5}
          onPageChange={handlePageClick}
          containerClassName={'flex items-center space-x-1'}
          pageClassName={'px-1'}
          pageLinkClassName={'px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100'}
          previousClassName={'px-1'}
          previousLinkClassName={'px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100'}
          nextClassName={'px-1'}
          nextLinkClassName={'px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100'}
          breakClassName={'px-1'}
          breakLinkClassName={'px-3 py-2 rounded-md text-sm font-medium text-gray-700'}
          activeClassName={'bg-blue-500 text-white rounded-md'}
          activeLinkClassName={'px-3 py-2 rounded-md text-sm font-medium text-white'}
        />
      </div>

      {/* Report Modal */}
      {showReportModal && selectedInspection && (
        <InspectionReportModal
          inspection={selectedInspection}
          onClose={() => {
            setShowReportModal(false);
            setSelectedInspection(null);
          }}
        />
      )}
    </div>
  );
};

export default SummaryP88Data;
