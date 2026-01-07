import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Search, 
  RefreshCw, 
  ChevronRight,
  Calendar, 
  User, 
  Hash, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  X,
  Printer, 
  Shirt,
  ArrowLeft,
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  Activity
} from 'lucide-react';

// Import both components
import OrderSpecificationSheet from './OrderSpecificationSheet'; 
import SketchTechnicalSheet from './SketchTechnicalSheet'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://192.167.12.85:5000';

// Enhanced page configuration with better colors and descriptions
const PAGES_CONFIG = [
  { 
    id: 1, 
    title: 'Cover Pages', 
    key: 'coverPages', 
    icon: FileText,
    description: 'Basic order information, PO details, and style tables',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600'
  },
  { 
    id: 2, 
    title: 'Sketch Technical', 
    key: 'sketchTechnical', 
    icon: Shirt,
    description: 'Technical sketches, specifications, and measurements',
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  ...Array.from({ length: 17 }, (_, i) => ({
    id: i + 3,
    title: `Page ${i + 3}`,
    key: `page${i + 3}Array`,
    icon: FileText,
    description: `Additional specifications and data for page ${i + 3}`,
    color: 'slate',
    gradient: 'from-slate-500 to-slate-600'
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
  const [viewMode, setViewMode] = useState('grid'); // grid or list

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
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Draft': return <Clock className="w-4 h-4" />;
      case 'Rejected': return <X className="w-4 h-4" />;
      case 'Processing': return <Activity className="w-4 h-4" />;
      case 'Pending': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved': 
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
      case 'Completed': 
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'Draft': 
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
      case 'Rejected': 
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      case 'Processing': 
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'Pending': 
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
      default: 
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      Cover Page Management
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                      Select an order to view detailed cover page overview
                    </p>
                  </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Orders</p>
                        <p className="text-2xl font-bold">{orders.length}</p>
                      </div>
                      <Hash className="w-8 h-8 text-blue-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-sm">Active</p>
                        <p className="text-2xl font-bold">{filteredOrders.length}</p>
                      </div>
                      <Activity className="w-8 h-8 text-emerald-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Progress</p>
                        <p className="text-2xl font-bold">85%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-200" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={fetchSavedOrders}
                  disabled={ordersLoading}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <RefreshCw className={`w-5 h-5 ${ordersLoading ? 'animate-spin' : ''}`} />
                  <span className="font-medium">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filter */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by order number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 text-lg"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-2xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-white dark:bg-gray-600 shadow-md text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-white dark:bg-gray-600 shadow-md text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-2xl mb-6 backdrop-blur-sm">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-3" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Orders Display */}
          {ordersLoading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <span className="text-xl text-gray-600 dark:text-gray-400 font-medium">Loading orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg p-16 text-center border border-white/20 dark:border-gray-700/50">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-fit mx-auto mb-6">
                  <FileText className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No Orders Found</h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {searchTerm ? 'No orders match your search criteria.' : 'No saved orders available.'}
                </p>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer border border-white/20 dark:border-gray-700/50 group ${
                    viewMode === 'list' ? 'flex items-center p-6' : 'p-6'
                  }`}
                  onClick={() => setSelectedOrderId(order._id)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <Hash className="w-6 h-6 text-white" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        Order #{order.orderNo}
                      </h3>
                      
                      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-6">
                        {order.createdAt && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-3" />
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {order.createdBy && (
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-3" />
                            <span>{order.createdBy}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Details</span>
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full group-hover:shadow-lg transition-all duration-200">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                          <Hash className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                            Order #{order.orderNo}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {order.createdAt && (
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                              </div>
                            )}
                            {order.createdBy && (
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                <span>{order.createdBy}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                    </>
                  )}
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 dark:text-gray-400 text-xl font-medium">Loading Overview...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 max-w-md">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full w-fit mx-auto mb-6">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">No Record Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">The selected order data could not be loaded.</p>
          <button
            onClick={() => setSelectedOrderId(null)}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with Order Info */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="flex items-center space-x-2 text-blue-600 dark:text-white hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 bg-blue-50 dark:bg-blue-200/20 px-4 py-2 rounded-xl  border-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="font-medium">Back to Orders</span>
                </button>
              </div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Cover Page Overview
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-400 mt-1">
                    Order #{record?.orderNo || selectedOrder?.orderNo}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Complete overview of all {PAGES_CONFIG.length} pages</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-2xl shadow-lg">
                <div className="text-sm text-blue-100">Overall Progress</div>
                <div className="text-3xl font-bold">{getOverallProgress()}%</div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowFullCoverSheet(true)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Full Cover Sheet</span>
                </button>
                
                {/* <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-medium">Download PDF</span>
                </button> */}
              </div>
            </div>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
              <span className="font-medium">Overall Progress</span>
              <span className="font-bold">{getOverallProgress()}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 h-4 rounded-full transition-all duration-1000 shadow-lg"
                style={{ width: `${getOverallProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>

                {/* Enhanced Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {PAGES_CONFIG.map((page) => {
            const pageData = record[page.key];
            const status = getStatus(pageData);
            const Icon = page.icon;
            
            return (
              <div 
                key={page.id} 
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-white/20 dark:border-gray-700/50 group overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-4 bg-gradient-to-r ${page.gradient} rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${getStatusStyle(status)}`}>
                      {getStatusIcon(status)}
                      <span>{status}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                    {page.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">
                    {page.description}
                  </p>
                  
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-6">
                    <div className="flex justify-between items-center">
                      <span>Items:</span>
                      <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                        {pageData?.length || 0}
                      </span>
                    </div>
                    {pageData && pageData.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span>Last Updated:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {pageData[0].updatedAt ? new Date(pageData[0].updatedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleViewDetail(page)}
                    className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Eye className="w-5 h-5" />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-white/20 dark:border-gray-700/50">
            {/* Only show header for non-cover pages and non-sketch pages */}
            {!['coverPages', 'sketchTechnical'].includes(selectedPage.key) && (
              <div className="flex items-center justify-between p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 bg-gradient-to-r ${selectedPage.gradient} rounded-2xl shadow-lg`}>
                    <selectedPage.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{selectedPage.title} Details</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Data array: {selectedPage.key}</p>
                  </div>
                </div>
                <button 
                  onClick={closeDetail}
                  className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-colors duration-200 group"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                </button>
              </div>
            )}
            
            <div className="overflow-y-auto" style={{ maxHeight: ['coverPages', 'sketchTechnical'].includes(selectedPage.key) ? '95vh' : 'calc(95vh - 140px)' }}>
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
                  
                  {/* Enhanced rendering for other pages */}
                  {!['coverPages', 'sketchTechnical'].includes(selectedPage.key) && (
                    <div className="p-8 space-y-6">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-600">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                          <Activity className="w-5 h-5 mr-2" />
                          Summary
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                              {record[selectedPage.key].length}
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Items</span>
                          </div>
                          <div className="text-center">
                            <div className={`text-3xl font-bold mb-1 ${
                              getStatus(record[selectedPage.key]) === 'Approved' ? 'text-emerald-600 dark:text-emerald-400' : 
                              getStatus(record[selectedPage.key]) === 'Completed' ? 'text-green-600 dark:text-green-400' : 
                              getStatus(record[selectedPage.key]) === 'Draft' ? 'text-amber-600 dark:text-amber-400' : 
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {getStatus(record[selectedPage.key])}
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                              {new Date().toLocaleDateString()}
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Check</span>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                              {Math.floor(Math.random() * 100)}%
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 dark:bg-gray-800 rounded-2xl p-6 border border-gray-700 dark:border-gray-600 shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-lg text-white flex items-center">
                            <FileText className="w-5 h-5 mr-2" />
                            Raw Data
                          </h3>
                          <div className="flex space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          </div>
                        </div>
                        <pre className="text-green-400 dark:text-green-300 text-sm overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                          {JSON.stringify(record[selectedPage.key], null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-20 p-8">
                  <div className="max-w-md mx-auto">
                    <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-full w-fit mx-auto mb-6">
                      <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No Data Available</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">This page doesn't contain any data yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Full Cover Sheet Modal */}
      {showFullCoverSheet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-white/20 dark:border-gray-700/50">
            <div className="flex items-center justify-between p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Complete Cover Sheet</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">Order #{record?.orderNo || selectedOrder?.orderNo} - All Pages Data</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Printer className="w-5 h-5" />
                  <span className="font-medium">Print PDF</span>
                </button>
                <button 
                  onClick={() => setShowFullCoverSheet(false)}
                  className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-colors duration-200 group"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto bg-white dark:bg-gray-800" style={{ maxHeight: 'calc(95vh - 140px)' }}>
              <div className="space-y-8">
                {PAGES_CONFIG.map((page) => {
                  const pageData = record[page.key];
                  const status = getStatus(pageData);
                  
                  return (
                    <div key={page.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-8 py-6 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 bg-gradient-to-r ${page.gradient} rounded-2xl shadow-lg`}>
                              <page.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{page.title}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{page.description}</p>
                            </div>
                          </div>
                          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border text-sm font-medium ${getStatusStyle(status)}`}>
                            {getStatusIcon(status)}
                            <span>{status}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-8 bg-white dark:bg-gray-800">
                        {pageData && pageData.length > 0 ? (
                          <div>
                            {/* Use OrderSpecificationSheet for Cover Pages in full view */}
                            {page.key === 'coverPages' && (
                              <div className="bg-white dark:bg-gray-800 rounded-2xl">
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
                              <div className="bg-white dark:bg-gray-800 rounded-2xl">
                                <SketchTechnicalSheet 
                                  viewMode={true}
                                  initialData={pageData[0]}
                                  onClose={null} 
                                />
                              </div>
                            )}
                            
                            {/* Enhanced rendering for other pages */}
                            {!['coverPages', 'sketchTechnical'].includes(page.key) && (
                              <div className="bg-gray-900 dark:bg-gray-800 rounded-2xl p-6 border border-gray-700 dark:border-gray-600 shadow-inner">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-bold text-lg text-white flex items-center">
                                    <FileText className="w-5 h-5 mr-2" />
                                    Page Data
                                  </h4>
                                  <div className="flex space-x-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  </div>
                                </div>
                                <pre className="text-sm overflow-x-auto text-green-400 dark:text-green-300 whitespace-pre-wrap font-mono leading-relaxed">
                                  {JSON.stringify(pageData, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-600">
                            <div className="max-w-sm mx-auto">
                              <div className="p-4 bg-gray-200 dark:bg-gray-600 rounded-full w-fit mx-auto mb-4">
                                <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                              </div>
                              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No data available for this page</p>
                            </div>
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

