import { useState, useEffect } from 'react';
import { 
  FileText, Download, Eye, Search, RefreshCw, ChevronRight,
  Calendar, User, Hash, CheckCircle, Clock, AlertCircle, X, Info,
  Printer, Package, Ruler, Image, Table, Shirt, Scissors,
  Shield, AlertTriangle
} from 'lucide-react';

// Import both components
import OrderSpecificationSheet from './OrderSpecificationSheet'; // Adjust the path as needed
import SketchTechnicalSheet from './SketchTechnicalSheet'; // Adjust the path as needed

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://192.167.12.85:5000';

// Enhanced page configuration based on your schema
const PAGES_CONFIG = [
  { 
    id: 1, 
    title: 'Cover Pages', 
    key: 'coverPages', 
    icon: FileText,
    description: 'Basic order information, PO details, and style tables',
    color: 'blue'
  },
  { 
    id: 2, 
    title: 'Sketch Technical', 
    key: 'sketchTechnical', 
    icon: Shirt,
    description: 'Technical sketches, specifications, and measurements',
    color: 'green'
  },
  ...Array.from({ length: 17 }, (_, i) => ({
    id: i + 3,
    title: `Page ${i + 3}`,
    key: `page${i + 3}Array`,
    icon: FileText,
    description: `Additional page ${i + 3} data`,
    color: 'gray'
  }))
];

const OverView = () => {
  // State Management
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState(null);
  const [showFullCoverSheet, setShowFullCoverSheet] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch saved orders on component mount
  useEffect(() => {
    fetchSavedOrders();
  }, []);

  // Fetch order details when an order is selected
  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetails(selectedOrderId);
    }
  }, [selectedOrderId]);

  const fetchSavedOrders = async () => {
    try {
      setOrdersLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/coverPage/orders`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.orders) {
        setOrders(data.orders);
      } else {
        setOrders(Array.isArray(data) ? data : data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders. Please try again.');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/coverPage/overview/${orderId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setRecord(data);
      setSelectedOrder(orders.find(order => order._id === orderId));
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to fetch order details. Please try again.');
      setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (dataArray) => {
    if (!dataArray || dataArray.length === 0) {
      return 'Pending';
    }
    
    const statuses = dataArray.map(item => item.status).filter(Boolean);
    
    if (statuses.length === 0) {
      return 'Pending';
    }
    
    if (statuses.some(status => status === 'submitted')) {
      return 'Completed';
    }
    
    if (statuses.some(status => status === 'approved')) {
      return 'Approved';
    }
    
    if (statuses.some(status => status === 'draft')) {
      return 'Draft';
    }
    
    if (statuses.some(status => status === 'rejected')) {
      return 'Rejected';
    }
    
    return 'Processing';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="w-4 h-4" />;
      case 'Completed': return <Clock className="w-4 h-4" />;
      case 'Draft': return <AlertCircle className="w-4 h-4" />;
      case 'Rejected': return <X className="w-4 h-4" />;
      case 'Processing': return <Clock className="w-4 h-4" />;
      case 'Pending': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved': 
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'Completed': 
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'Draft': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
      case 'Rejected': 
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'Processing': 
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      case 'Pending': 
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getOverallProgress = () => {
    if (!record) return 0;
    
    const totalPages = PAGES_CONFIG.length;
    const completedPages = PAGES_CONFIG.filter(page => {
      const pageData = record[page.key];
      return getStatus(pageData) === 'Completed';
    }).length;
    
    return Math.round((completedPages / totalPages) * 100);
  };

  const handleViewDetail = (page) => {
    setSelectedPage(page);
  };

  const closeDetail = () => {
    setSelectedPage(null);
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/coverPage/download-pdf/${selectedOrderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `cover-sheet-${selectedOrder?.orderNo || 'unknown'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Order Selection View
  if (!selectedOrderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Cover Page Management</h1>
                <p className="text-gray-600 dark:text-gray-400">Select an order to view detailed cover page overview</p>
              </div>
              <button
                onClick={fetchSavedOrders}
                disabled={ordersLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by order number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            </div>
          )}

          {/* Orders Grid */}
          {ordersLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Orders Found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No orders match your search criteria.' : 'No saved orders available.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer border border-gray-200 dark:border-gray-700"
                  onClick={() => setSelectedOrderId(order._id)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                        <Hash className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Order #{order.orderNo}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      {order.createdAt && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      )}
                      {order.createdBy && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          {order.createdBy}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Details</span>
                        <div className="bg-blue-600 text-white p-1 rounded-full">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Overview Display
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading Overview...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Record Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The selected order data could not be loaded.</p>
          <button
            onClick={() => setSelectedOrderId(null)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Order Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  ← Back to Orders
                </button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Cover Page Overview - Order #{record?.orderNo || selectedOrder?.orderNo}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Complete overview of all {PAGES_CONFIG.length} pages</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{getOverallProgress()}%</div>
              </div>
              
              <button
                onClick={() => setShowFullCoverSheet(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <FileText className="w-5 h-5" />
                <span>Full Cover Sheet</span>
              </button>
              
              <button
                onClick={handleDownloadPDF}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Overall Progress</span>
              <span>{getOverallProgress()}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getOverallProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {PAGES_CONFIG.map((page) => {
            const pageData = record[page.key];
            const status = getStatus(pageData);
            const Icon = page.icon;
            
            return (
              <div 
                key={page.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-200 dark:border-gray-700"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`bg-${page.color}-100 dark:bg-${page.color}-900/30 p-3 rounded-full`}>
                      <Icon className={`w-6 h-6 text-${page.color}-600 dark:text-${page.color}-400`} />
                    </div>
                    <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-sm font-medium ${getStatusStyle(status)}`}>
                      {getStatusIcon(status)}
                      <span>{status}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{page.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{page.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex justify-between">
                      <span>Items:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{pageData?.length || 0}</span>
                    </div>
                    {pageData && pageData.length > 0 && (
                      <div className="flex justify-between">
                        <span>Last Updated:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {pageData[0].updatedAt ? new Date(pageData[0].updatedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleViewDetail(page)}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Detail Modal */}
      {selectedPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Only show header for non-cover pages and non-sketch pages */}
            {!['coverPages', 'sketchTechnical'].includes(selectedPage.key) && (
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedPage.title} Details</h2>
                  <p className="text-gray-600 dark:text-gray-400">Data array: {selectedPage.key}</p>
                </div>
                <button 
                  onClick={closeDetail}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            )}
            
            <div className="overflow-y-auto" style={{ maxHeight: ['coverPages', 'sketchTechnical'].includes(selectedPage.key) ? '95vh' : 'calc(95vh - 120px)' }}>
              {record[selectedPage.key] && record[selectedPage.key].length > 0 ? (
                <div>
                  {/* Use the reusable OrderSpecificationSheet component for Cover Pages */}
                  {selectedPage.key === 'coverPages' && (
                    <OrderSpecificationSheet 
                      viewMode={true}
                      initialData={{
                        ...record[selectedPage.key][0],
                        orderNo: record.orderNo, 
                        parentOrderNo: record.orderNo 
                      }}
                      onClose={closeDetail}
                    />
                  )}
                  
                  {/* Use the SketchTechnicalSheet component for Sketch Technical */}
                  {selectedPage.key === 'sketchTechnical' && (
                    <SketchTechnicalSheet 
                      viewMode={true}
                      initialData={record[selectedPage.key][0]}
                      onClose={closeDetail}
                    />
                  )}
                  
                  {/* Default rendering for other pages */}
                  {!['coverPages', 'sketchTechnical'].includes(selectedPage.key) && (
                    <div className="p-6 space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Total Items:</span>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{record[selectedPage.key].length}</div>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                            <div className={`font-semibold ${getStatus(record[selectedPage.key]) === 'Approved' ? 'text-green-600 dark:text-green-400' : getStatus(record[selectedPage.key]) === 'Submitted' ? 'text-blue-600 dark:text-blue-400' : getStatus(record[selectedPage.key]) === 'Draft' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                              {getStatus(record[selectedPage.key])}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 border border-gray-700 dark:border-gray-600">
                        <pre className="text-green-400 dark:text-green-300 text-sm overflow-x-auto">
                          {JSON.stringify(record[selectedPage.key], null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 p-6">
                  <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Data Available</h3>
                  <p className="text-gray-600 dark:text-gray-400">This page doesn't contain any data yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Full Cover Sheet Modal */}
      {showFullCoverSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Complete Cover Sheet</h2>
                <p className="text-gray-600 dark:text-gray-400">Order #{record?.orderNo || selectedOrder?.orderNo} - All Pages Data</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                                    onClick={handleDownloadPDF}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print PDF</span>
                </button>
                <button 
                  onClick={() => setShowFullCoverSheet(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto bg-white dark:bg-gray-800" style={{ maxHeight: 'calc(95vh - 120px)' }}>
              <div className="space-y-8">
                {PAGES_CONFIG.map((page) => {
                  const pageData = record[page.key];
                  const status = getStatus(pageData);
                  
                  return (
                    <div key={page.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <page.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{page.title}</h3>
                          </div>
                          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-sm font-medium ${getStatusStyle(status)}`}>
                            {getStatusIcon(status)}
                            <span>{status}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{page.description}</p>
                      </div>
                      
                      <div className="p-6 bg-white dark:bg-gray-800">
                        {pageData && pageData.length > 0 ? (
                          <div>
                            {/* Use OrderSpecificationSheet for Cover Pages in full view */}
                            {page.key === 'coverPages' && (
                              <div className="bg-white dark:bg-gray-800">
                                <OrderSpecificationSheet 
                                  viewMode={true}
                                  initialData={{
                                    ...pageData[0],
                                    orderNo: record.orderNo, 
                                    parentOrderNo: record.orderNo 
                                  }}
                                  onClose={null} 
                                />
                              </div>
                            )}
                            
                            {/* Use SketchTechnicalSheet for Sketch Technical in full view */}
                            {page.key === 'sketchTechnical' && (
                              <div className="bg-white dark:bg-gray-800">
                                <SketchTechnicalSheet 
                                  viewMode={true}
                                  initialData={pageData[0]}
                                  onClose={null} 
                                />
                              </div>
                            )}
                            
                            {/* Default rendering for other pages */}
                            {!['coverPages', 'sketchTechnical'].includes(page.key) && (
                              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                <pre className="text-sm overflow-x-auto text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                  {JSON.stringify(pageData, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-600">
                            <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No data available for this page</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverView;

