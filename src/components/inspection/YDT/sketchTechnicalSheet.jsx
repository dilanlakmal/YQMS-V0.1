import{ useState, useRef, useCallback, useEffect } from 'react'; 
import { 
  Upload, 
  Save, 
  FileText, 
  Calendar, 
  User,  
  Search, 
  Loader,
  Settings,
  Image as ImageIcon,
  Edit3,
  CheckCircle,
  Info,
  Package,
  Target,
  Layers,
} from 'lucide-react';
import DrawingCanvas from './Dependent/drowingCanvas.jsx';
import { useAuth } from '../../../components/authentication/AuthContext';
import { API_BASE_URL } from '../../../../config.js';
import Swal from 'sweetalert2';

const SketchTechnicalSheet = ({ 
  viewMode = false, 
  initialData = null, 
  onClose = null 
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  
  // Order search states
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderSuggestions, setOrderSuggestions] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [justSelected, setJustSelected] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [currentStatus, setCurrentStatus] = useState('draft'); // Remove duplicate declaration

  // Form data state
  const [formData, setFormData] = useState({
    styleId: '',
    shortDesc: '',
    department: '',
    initialDcDate: new Date().toISOString().split('T')[0],
    commodity: '',
    season: '',
    vendor3d: 'No',
    styleStatus: 'In Work',
    longDescription: '',
    finalFitApproval: '',
    sizeRange: '',
    targetCost: '',
    targetUnits: '',
    plannedColors: '',
    deliveryCount: '',
    fitType: 'Regular',
    coll1: '',
    coll2: '',
    retailPrice: '',
    floorSet: new Date().toISOString().split('T')[0],
    sizeCurve: '',
    orderNo: '',
    buyerEngName: '',
    custStyle: '',
    orderQty: ''
  });

  // Image states
  const [mainSketchImage, setMainSketchImage] = useState(null);
  const [secondaryImage, setSecondaryImage] = useState(null);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [canvasData, setCanvasData] = useState([]);
  const [shouldLoadCanvasData, setShouldLoadCanvasData] = useState(false);
  const [dataLoadAttempted, setDataLoadAttempted] = useState(false);

  // Add effect to load initial data in view mode
  useEffect(() => {
    if (viewMode && initialData) {
      console.log('Loading sketch technical data:', initialData);
      
      const sketchData = initialData;
      
      // Load form data
      setFormData({
        styleId: sketchData.styleId || '',
        shortDesc: sketchData.shortDesc || '',
        department: sketchData.department || '',
        initialDcDate: sketchData.initialDcDate ? sketchData.initialDcDate.split('T')[0] : new Date().toISOString().split('T')[0],
        commodity: sketchData.commodity || '',
        season: sketchData.season || '',
        vendor3d: sketchData.vendor3d || 'No',
        styleStatus: sketchData.styleStatus || 'In Work',
        longDescription: sketchData.longDescription || '',
        finalFitApproval: sketchData.finalFitApproval || '',
        sizeRange: Array.isArray(sketchData.sizeRange) ? sketchData.sizeRange.join(', ') : sketchData.sizeRange || '',
        targetCost: sketchData.targetCost || '',
        targetUnits: sketchData.targetUnits || '',
        plannedColors: sketchData.plannedColors || '',
        deliveryCount: sketchData.deliveryCount || '',
        fitType: sketchData.fitType || 'Regular',
        coll1: sketchData.coll1 || '',
        coll2: sketchData.coll2 || '',
        retailPrice: sketchData.retailPrice || '',
        floorSet: sketchData.floorSet ? sketchData.floorSet.split('T')[0] : new Date().toISOString().split('T')[0],
        sizeCurve: sketchData.sizeCurve || '',
        orderNo: sketchData.orderNo || '',
        buyerEngName: sketchData.buyerEngName || '',
        custStyle: sketchData.custStyle || '',
        orderQty: sketchData.orderQty || ''
      });

      // Load images
      if (sketchData.originalImage) {
        setOriginalImage(sketchData.originalImage);
      }
      if (sketchData.canvasData && Array.isArray(sketchData.canvasData) && sketchData.canvasData.length > 0) {
        setCanvasData(sketchData.canvasData);
        setShouldLoadCanvasData(true);
        console.log('Canvas data loaded:', sketchData.canvasData);
      }
      if (sketchData.mainSketchImage) {
        setMainSketchImage(sketchData.mainSketchImage);
      }
      if (sketchData.secondaryImage) {
        setSecondaryImage(sketchData.secondaryImage);
      }

      // Load other data
      if (sketchData.selectedOrderData) {
        setSelectedOrder(sketchData.selectedOrderData);
      }
      if (sketchData.availableSizes) {
        setAvailableSizes(sketchData.availableSizes);
      }
      if (sketchData.status) {
        setCurrentStatus(sketchData.status);
      }

      // Set order search term
      if (sketchData.orderNo) {
        setOrderSearchTerm(sketchData.orderNo);
      }
    }
  }, [viewMode, initialData]);

  useEffect(() => {
  if (viewMode && canvasData.length > 0 && !dataLoadAttempted && canvasRef.current) {
    console.log('Attempting to load canvas data:', canvasData);
    
    // Add a longer delay to ensure canvas is fully rendered
    const timer = setTimeout(() => {
      try {
        if (canvasRef.current && canvasRef.current.loadCanvasData) {
          console.log('Loading canvas data into canvas...');
          canvasRef.current.loadCanvasData(canvasData);
          setDataLoadAttempted(true);
          console.log('Canvas data loaded successfully');
        } else {
          console.error('Canvas ref or loadCanvasData method not available');
        }
      } catch (error) {
        console.error('Error loading canvas data:', error);
      }
    }, 1000); // Increased delay

    return () => clearTimeout(timer);
  }
}, [viewMode, canvasData, dataLoadAttempted]);

  // useEffect(() => {
//   if (viewMode && shouldLoadCanvasData && canvasRef.current && canvasData.length > 0 && originalImage) {
//     // Small delay to ensure canvas is fully initialized
//     const timer = setTimeout(() => {
//       try {
//         console.log('Loading canvas data into canvas:', canvasData);
//         canvasRef.current.loadCanvasData(canvasData);
//         setShouldLoadCanvasData(false); // Prevent re-loading
//       } catch (error) {
//         console.error('Error loading canvas data:', error);
//       }
//     }, 500);

//     return () => clearTimeout(timer);
//   }
// }, [viewMode, shouldLoadCanvasData, canvasData, originalImage]);
  // Keep all existing functions
  const debounce = useCallback((func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }, []);

  const fetchOrderSuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOrderSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      setSearchLoading(true);
      
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/api/coverPage/orders/search?term=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setOrderSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Error fetching order suggestions:', error);
      setOrderSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce(fetchOrderSuggestions, 300),
    [debounce]
  );

  const fetchOrderDetails = async (orderNo) => {
    try {
      setSearchLoading(true);
      
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/api/coverPage/orders/${encodeURIComponent(orderNo)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const orderData = await response.json();
      return orderData;
    } catch (error) {
      console.error('Error fetching order details:', error);
      return null;
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (orderSearchTerm && !justSelected && !viewMode) { 
      debouncedSearch(orderSearchTerm);
    } else if (!orderSearchTerm) {
      setOrderSuggestions([]);
      setShowSuggestions(false);
    }
  }, [orderSearchTerm, debouncedSearch, justSelected, viewMode]);

  const handleOrderSelect = useCallback(async (orderNo) => {
    if (viewMode) return;
    
    setJustSelected(true);
    setShowSuggestions(false);
    
    const orderData = await fetchOrderDetails(orderNo);
    if (orderData) {
      setSelectedOrder(orderData);
      setOrderSearchTerm(orderNo);
      
      const sizes = orderData.sizes || [];
      setAvailableSizes(sizes);
      
      setFormData(prev => ({
        ...prev,
        orderNo: orderData.orderNo || orderNo,
        styleId: orderData.customerStyle || orderData.custStyle || '',
        buyerEngName: orderData.engName || '',
        targetUnits: orderData.quantity || orderData.totalQty || '',
        custStyle: orderData.customerStyle || orderData.custStyle || '',
        orderQty: orderData.quantity || orderData.totalQty || '',
        sizeRange: sizes.join(', ') || ''
      }));
    }
  }, [viewMode]);

  const handleInputChange = (field, value) => {
    if (viewMode) return;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMainImageUpload = (event) => {
    if (viewMode) return;
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        setOriginalImage(imageData); 
        setMainSketchImage(imageData);
        setShowDrawingCanvas(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasSave = (imageData) => {
    if (viewMode) return;
    setMainSketchImage(imageData);
  };

  // In your SketchTechnicalSheet component, update the handleSave function:

const handleSave = async (status = 'draft') => {
  if (viewMode) return;
  
  try {
    setLoading(true);
    
    let canvasImageData = null;
    let drawnObjectsData = null;
    
    // Get canvas data using the ref method
    if (canvasRef.current) {
      try {
        // Get the canvas drawing data (objects)
        drawnObjectsData = canvasRef.current.getCanvasData();
        console.log('Retrieved canvas data:', drawnObjectsData);
        
        // Get the canvas image data
        canvasImageData = canvasRef.current.saveCanvasImage();
        console.log('Retrieved canvas image data:', canvasImageData ? 'Image data present' : 'No image data');
      } catch (error) {
        console.error('Error getting canvas data:', error);
      }
    }

    const sizeRangeArray = formData.sizeRange 
      ? formData.sizeRange.split(',').map(s => s.trim()).filter(s => s)
      : availableSizes;

    const dataToSave = {
      ...formData,
      sizeRange: sizeRangeArray,
      originalImage: originalImage,
      mainSketchImage: canvasImageData || mainSketchImage,
      secondaryImage,
      canvasData: drawnObjectsData || [], // Ensure we always have an array
      selectedOrderData: selectedOrder,
      availableSizes,
      status,
      createdBy: (() => {
        try {
          const userDataString = localStorage.getItem('user');
          if (userDataString) {
            const userData = JSON.parse(userDataString);
            return userData?.emp_id || 'unknown_user';
          }
        } catch (error) {
          console.error('Failed to parse user data:', error);
        }
        return 'unknown_user';
      })()
    };

    console.log('Data to save with canvas data:', {
      ...dataToSave,
      canvasDataLength: drawnObjectsData ? drawnObjectsData.length : 0,
      hasCanvasData: !!drawnObjectsData
    });

    const accessToken = localStorage.getItem("accessToken");
    const response = await fetch(`${API_BASE_URL}/api/coverPage/sketch-technical/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(dataToSave)
    });

    const result = await response.json();
    if (result.success) {
      setCurrentStatus(status); 
      
      const message = status === 'submitted' 
        ? 'Technical sheet submitted successfully!' 
        : 'Technical sheet saved as draft!';
        
      const icon = status === 'submitted' ? 'success' : 'info';
      
      await Swal.fire({
        icon: icon,
        title: status === 'submitted' ? 'Submitted!' : 'Saved!',
        text: message,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });
    } else {
      throw new Error(result.message || 'Failed to save technical sheet');
    }
  } catch (error) {
    console.error('Error saving technical sheet:', error);
    await Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: `Failed to save: ${error.message}`,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      position: 'top-end',
      toast: true
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl flex items-center gap-3">
            <Loader className="animate-spin h-6 w-6 text-blue-600" />
            <span className="text-gray-900 dark:text-white font-medium">
              {viewMode ? 'Loading...' : 'Saving technical sheet...'}
            </span>
          </div>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full shadow-lg">
              <Edit3 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {viewMode ? 'Sketch Technical Sheet - View Mode' : 'Sketch Technical Sheet'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {viewMode 
              ? 'Complete overview of saved technical specifications and sketches'
              : 'Create detailed technical specifications with visual sketches'
            }
          </p>
          {viewMode && onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              ← Back to Overview
            </button>
          )}
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          {/* Order Search Section - Hide in view mode */}
          {!viewMode && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Information</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Search and select manufacturing order</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Search */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Order Number
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={orderSearchTerm}
                      onChange={(e) => {
                        setOrderSearchTerm(e.target.value);
                        if (justSelected) {
                          setJustSelected(false);
                        }
                      }}
                      placeholder="Enter Order Number..."
                      className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    {searchLoading && <Loader className="animate-spin h-5 w-5 text-blue-600" />}
                  </div>
                  
                  {/* Order Suggestions Dropdown */}
                  {showSuggestions && orderSuggestions.length > 0 && !justSelected && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto mt-2">
                      {orderSuggestions.map((order, index) => (
                        <div
                          key={index}
                          onClick={() => handleOrderSelect(order.orderNo)}
                          className="p-4 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-200"
                        >
                          <div className="font-semibold text-gray-900 dark:text-white">{order.orderNo}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{order.customerStyle}</div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Qty: {order.quantity} | Sizes: {order.sizes?.length || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Order Info */}
                {selectedOrder && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Selected Order Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Order No:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formData.orderNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Buyer:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formData.buyerEngName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formData.orderQty}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Show order info in view mode */}
          {viewMode && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Technical Sheet Information - View Mode</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Saved technical specifications and details</p>
                </div>
                {/* Status Indicator */}
                {currentStatus && (
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                    currentStatus === 'submitted' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : currentStatus === 'draft'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      currentStatus === 'submitted' ? 'bg-green-500' : 
                      currentStatus === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></div>
                    <span>Status: {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Sections */}
          <div className="p-6">
            {/* Basic Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Style ID
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.styleId || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.styleId}
                      onChange={(e) => handleInputChange('styleId', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="W02-490014"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Initial DC Date
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.initialDcDate ? new Date(formData.initialDcDate).toLocaleDateString() : 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={formData.initialDcDate}
                      onChange={(e) => handleInputChange('initialDcDate', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.department || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="310 Womens Promo T-Shirt"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Short Description
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.shortDesc || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.shortDesc}
                      onChange={(e) => handleInputChange('shortDesc', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="F- DRY VISCOSE CREW NECK KNIT T-SHIRT"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Commodity
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.commodity || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.commodity}
                      onChange={(e) => handleInputChange('commodity', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="T-shirt / Cami"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Season
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                                            {formData.season || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.season}
                      onChange={(e) => handleInputChange('season', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Fall 2025 Apparel Womens RW & CO"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Style Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                Style Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Style Status
                  </label>
                  {viewMode ? (
                    <div className={`w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl flex items-center ${
                      formData.styleStatus === 'In Work' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' : 
                      formData.styleStatus === 'Approved' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 
                      'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      {formData.styleStatus || 'Not specified'}
                    </div>
                  ) : (
                    <select
                      value={formData.styleStatus}
                      onChange={(e) => handleInputChange('styleStatus', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="In Work">In Work</option>
                      <option value="Approved">Approved</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fit Type
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.fitType || 'Not specified'}
                    </div>
                  ) : (
                    <select
                      value={formData.fitType}
                      onChange={(e) => handleInputChange('fitType', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="Regular">Regular</option>
                      <option value="Slim">Slim</option>
                      <option value="Loose">Loose</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    3D Vendor
                  </label>
                  {viewMode ? (
                    <div className={`w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl ${
                      formData.vendor3d === 'Yes' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 
                      'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      {formData.vendor3d || 'No'}
                    </div>
                  ) : (
                    <select
                      value={formData.vendor3d}
                      onChange={(e) => handleInputChange('vendor3d', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  )}
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Long Description
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl min-h-[100px]">
                      {formData.longDescription || 'No description provided'}
                    </div>
                  ) : (
                    <textarea
                      value={formData.longDescription}
                      onChange={(e) => handleInputChange('longDescription', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      rows={3}
                      placeholder="F- DRY VISCOSE CREW NECK KNIT T-SHIRT"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Sizing & Pricing */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                Sizing & Pricing
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Size Range
                    {availableSizes.length > 0 && !viewMode && (
                      <span className="text-xs text-green-600 dark:text-green-400 ml-2">(Auto-filled)</span>
                    )}
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.sizeRange || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.sizeRange}
                      onChange={(e) => handleInputChange('sizeRange', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="XXS,XS,S,M,L,XL,XXL"
                      readOnly={availableSizes.length > 0}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Units
                    {selectedOrder && !viewMode && (
                      <span className="text-xs text-green-600 dark:text-green-400 ml-2">(From Order)</span>
                    )}
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.targetUnits || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={formData.targetUnits}
                      onChange={(e) => handleInputChange('targetUnits', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="3200"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Cost
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.targetCost || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.targetCost}
                      onChange={(e) => handleInputChange('targetCost', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0 USD"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Retail Price
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.retailPrice || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.retailPrice}
                      onChange={(e) => handleInputChange('retailPrice', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="35.9 USD"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Planned Colors
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.plannedColors || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={formData.plannedColors}
                      onChange={(e) => handleInputChange('plannedColors', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Delivery Count
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.deliveryCount || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={formData.deliveryCount}
                      onChange={(e) => handleInputChange('deliveryCount', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Floor Set
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.floorSet ? new Date(formData.floorSet).toLocaleDateString() : 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={formData.floorSet}
                      onChange={(e) => handleInputChange('floorSet', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Size Curve
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.sizeCurve || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.sizeCurve}
                      onChange={(e) => handleInputChange('sizeCurve', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Size curve details"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Layers className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
                Additional Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Final Fit Approval
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.finalFitApproval || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.finalFitApproval}
                      onChange={(e) => handleInputChange('finalFitApproval', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Approval details"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Collection 1
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.coll1 || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.coll1}
                      onChange={(e) => handleInputChange('coll1', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="SEASONAL SHOP"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Collection 2
                  </label>
                  {viewMode ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
                      {formData.coll2 || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.coll2}
                      onChange={(e) => handleInputChange('coll2', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Collection 2"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Sketch Canvas Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ImageIcon className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Technical Sketch
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                {(showDrawingCanvas && !viewMode) ? (
                  // Edit mode canvas (existing code)
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Edit3 className="h-4 w-4" />
                        <span>Use the tools below to annotate and sketch on your image</span>
                      </div>
                      <button
                        onClick={() => setShowDrawingCanvas(false)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                      >
                        Reset Canvas
                      </button>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden">
                      <DrawingCanvas
                        ref={canvasRef}
                        // Pass the image URL or base64 here
                        backgroundImage={mainSketchImage || originalImage} 
                        onSave={handleCanvasSave}
                        viewMode={viewMode}
                        initialCanvasData={canvasData} // Pass the saved JSON objects here
                      />
                    </div>
                  </div>
                ) : viewMode && originalImage ? (
                  // View mode with canvas
                  <div className="space-y-4">
                    <div className="flex items-center justify-center mb-4">
                      <ImageIcon className="h-8 w-8 text-green-600 dark:text-green-400 mr-2" />
                      <span className="text-lg font-medium text-gray-900 dark:text-white">
                        Technical Sketch {canvasData.length > 0 ? 'with Annotations' : ''}
                      </span>
                    </div>
                    
                    {/* Debug info */}
                    {canvasData.length > 0 && (
                      <div className="text-center text-sm text-blue-600 dark:text-blue-400 mb-2">
                        <Info className="h-4 w-4 inline mr-1" />
                        Canvas data available: {canvasData.length} objects
                      </div>
                    )}
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden">
                      <DrawingCanvas
                        ref={canvasRef}
                        backgroundImage={originalImage}
                        onSave={() => {}} // No save function in view mode
                        width={900}
                        height={550}
                        className="w-full h-full"
                        viewMode={true}
                        onCanvasReady={() => {
                          console.log('Canvas ready callback triggered');
                          setCanvasData(true);
                        }}
                        initialCanvasData={canvasData} // Pass data as prop
                      />
                    </div>
                    
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                      <Info className="h-4 w-4 inline mr-1" />
                      {canvasData.length > 0 
                        ? `Technical sketch with ${canvasData.length} saved annotations and measurements`
                        : 'Technical sketch (no annotations)'
                      }
                    </div>
                  </div>
                ) : (
                  // Fallback for other cases
                  <div className="text-center py-16">
                    {(mainSketchImage || originalImage) ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center mb-4">
                          <ImageIcon className="h-8 w-8 text-green-600 dark:text-green-400 mr-2" />
                          <span className="text-lg font-medium text-gray-900 dark:text-white">
                            {viewMode ? 'Technical Sketch' : 'Uploaded Technical Image'}
                          </span>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden max-w-4xl mx-auto">
                          <img 
                            src={mainSketchImage || originalImage} 
                            alt="Technical sketch"
                            className="w-full h-auto max-h-96 object-contain"
                          />
                        </div>
                        
                        {!viewMode && (
                          <div className="flex justify-center space-x-4 mt-4">
                            <button
                              onClick={() => setShowDrawingCanvas(true)}
                              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                            >
                              <Edit3 className="h-5 w-5" />
                              <span>Edit Sketch</span>
                            </button>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 font-medium"
                            >
                              <Upload className="h-5 w-5" />
                              <span>Replace Image</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      // No image case
                      <div className="w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center">
                        <Upload className="h-16 w-16 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                          {viewMode ? 'No Technical Image' : 'Upload Technical Image'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                          {viewMode ? 'No image was uploaded for this technical sheet' : 'Upload an image to start creating your technical sketch'}
                        </p>
                        {!viewMode && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                          >
                            <Upload className="h-5 w-5" />
                            <span>Choose Image</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>


            {/* Action Buttons - Hide in view mode */}
            {!viewMode && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Created by: {user?.name || user?.engName || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Date: {new Date().toLocaleDateString()}</span>
                  </div>
                  {selectedOrder && (
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4" />
                      <span>Order: {formData.orderNo}</span>
                    </div>
                  )}
                  
                  {/* Status Indicator */}
                  {currentStatus && (
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                      currentStatus === 'submitted' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : currentStatus === 'draft'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        currentStatus === 'submitted' ? 'bg-green-500' : 
                        currentStatus === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                      <span>Status: {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                  >
                    <FileText className="h-5 w-5" />
                    <span>Print</span>
                  </button>
                  
                  {/* Save as Draft Button */}
                  <button
                    onClick={() => handleSave('draft')}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>Save as Draft</span>
                      </>
                    )}
                                      </button>
                  
                  {/* Submit Button */}
                  <button
                    onClick={() => handleSave('submitted')}
                    disabled={loading}
                    className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Submit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Metadata in view mode */}
            {viewMode && initialData && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Info className="h-4 w-4" />
                    <span>Technical sheet saved and viewable</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    <span>Created by: {initialData.createdBy || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {initialData.createdAt ? new Date(initialData.createdAt).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                  {initialData.updatedAt && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>Updated: {new Date(initialData.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            formData.orderNo 
              ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' 
              : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${formData.orderNo ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Selected</span>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            formData.styleId 
              ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' 
              : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${formData.styleId ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Style ID</span>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            mainSketchImage 
              ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' 
              : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${mainSketchImage ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sketch Added</span>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            formData.longDescription 
              ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' 
              : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${formData.longDescription ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</span>
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            currentStatus === 'submitted'
              ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' 
              : currentStatus === 'draft'
              ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800'
              : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                currentStatus === 'submitted' ? 'bg-green-500' : 
                currentStatus === 'draft' ? 'bg-yellow-500' : 'bg-gray-300'
              }`}></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentStatus === 'submitted' ? 'Submitted' : 
                 currentStatus === 'draft' ? 'Draft' : 'Not Saved'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Tips - Hide in view mode */}
        {!viewMode && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-3">
                  Quick Tips for Technical Sheets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
                  <ul className="space-y-2">
                    <li>• Search for existing orders to auto-populate fields</li>
                    <li>• Upload clear, high-resolution technical images</li>
                    <li>• Use the drawing tools to add measurements and annotations</li>
                    <li>• Fill in all required fields for complete documentation</li>
                  </ul>
                  <ul className="space-y-2">
                    <li>• Size ranges are automatically filled from order data</li>
                    <li>• Target units sync with order quantities</li>
                    <li>• Save frequently to prevent data loss</li>
                    <li>• Print function creates a clean technical document</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleMainImageUpload}
        accept="image/*"
        className="hidden"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default SketchTechnicalSheet;