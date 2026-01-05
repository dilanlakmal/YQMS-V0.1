import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  User,
  Upload,
  Save,
  Search,
  Loader,
  Plus,
  Trash2,
  FileText,
  Package,
  Palette,
  Hash,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  Image as ImageIcon,
  X
} from "lucide-react";
import {API_BASE_URL} from "../../../../config.js";
import RichTextEditor from '../YDT/RichTextEditor.jsx';
import Swal from 'sweetalert2';

// Enhanced ColorDropdown with better styling
const ColorDropdown = ({ rowIndex, orderNo, selectedColors, onColorAdd, fetchOrderColors, viewMode = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);

  useEffect(() => {
    const loadColors = async () => {
      if (orderNo && !viewMode) {
        setIsLoading(true);
        try {
          const colors = await fetchOrderColors(orderNo);
          setAvailableColors(colors);
        } catch (error) {
          console.error('Error loading colors:', error);
          setAvailableColors([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setAvailableColors([]);
      }
    };

    loadColors();
  }, [orderNo, fetchOrderColors, viewMode]);

  if (viewMode) {
    return null; // Don't show dropdown in view mode
  }

  const unselectedColors = availableColors.filter(color => !selectedColors.includes(color));

  return (
    <select
      onChange={(e) => {
        if (e.target.value) {
          onColorAdd(e.target.value);
          e.target.value = "";
        }
      }}
      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
      disabled={isLoading || !orderNo}
    >
      <option value="">
        {isLoading ? "Loading colors..." : 
         !orderNo ? "Enter Order No first" :
         availableColors.length === 0 ? "No colors found for this order" :
         unselectedColors.length === 0 ? "All colors already selected" :
         `+ Add Color (${unselectedColors.length} available)`}
      </option>
      {unselectedColors.map((color, colorIndex) => (
        <option key={colorIndex} value={color}>
          {color}
        </option>
      ))}
    </select>
  );
};

const OrderSpecificationSheet = ({ 
  viewMode = false, 
  initialData = null, 
  onClose = null 
}) => {
  // State management
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderSuggestions, setOrderSuggestions] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [justSelected, setJustSelected] = useState(false);
  const [orderColors, setOrderColors] = useState({});
  const [currentStatus, setCurrentStatus] = useState('draft');
  
  const [formData, setFormData] = useState({
    customerStyle: "",
    orderNo: "",
    poNumber: "",
    quantity: "",
    retailSingle: "",
    majorPoints: "",
    testInstructions: ""
  });

  const [styleTable, setStyleTable] = useState([
    { 
      orderNo: "", 
      customerStyle: "", 
      poNumber: "", 
      colors: [], 
      quantity: 5, 
      remarks: "" 
    }
  ]);
  
  const [sizeTable, setSizeTable] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  
  const [stampData, setStampData] = useState({
    name: "",
    date: new Date().toISOString().split('T')[0]
  });

  // Add effect to load initial data in view mode
  useEffect(() => {
    if (viewMode && initialData) {
      // Load the data into the component state
      const coverData = initialData;
      
      setFormData({
        customerStyle: coverData.customerStyle || "",
        orderNo: coverData.orderNo || "",
        poNumber: coverData.poNumber || "",
        quantity: coverData.quantity || "",
        retailSingle: coverData.retailSingle || "",
        majorPoints: coverData.majorPoints || "",
        testInstructions: coverData.testInstructions || ""
      });

      if (coverData.styleTable) {
        setStyleTable(coverData.styleTable);
      }

      if (coverData.sizeTable) {
        setSizeTable(coverData.sizeTable);
      }

      if (coverData.stampData) {
        setStampData(coverData.stampData);
      }

      if (coverData.uploadedImage) {
        setUploadedImage(coverData.uploadedImage);
      }

      if (coverData.status) {
        setCurrentStatus(coverData.status);
      }

      // Set as selected order for size table display
      if (coverData.sizeTable && coverData.sizeTable.length > 0) {
        setSelectedOrder({
          sizes: coverData.sizeTable[0].sizes || []
        });
      }
    }
  }, [viewMode, initialData]);

  // Keep all existing functions
  const fetchOrderColors = useCallback(async (orderNo) => {
    if (!orderNo) {
      return [];
    }
    return new Promise((resolve) => {
      setOrderColors(currentOrderColors => {
        if (currentOrderColors[orderNo]) {
          resolve(currentOrderColors[orderNo]);
          return currentOrderColors;
        }
        (async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/coverPage/orders/${encodeURIComponent(orderNo)}`);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const orderData = await response.json();
            const colors = orderData.colors || [];
            
            setOrderColors(prev => ({
              ...prev,
              [orderNo]: colors
            }));
            
            resolve(colors);
          } catch (error) {
            console.error('Error fetching order colors:', error);
            
            const mockColors = ["BLACK", "DARK HEATHER BLACK", "NAVY", "WHITE"];
            
            setOrderColors(prev => ({
              ...prev,
              [orderNo]: mockColors
            }));
            
            resolve(mockColors);
          }
        })();
        return currentOrderColors;
      });
    });
  }, []);

  const fetchOrderSuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOrderSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/coverPage/orders/search?term=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const data = await response.json();
      
      setOrderSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Error fetching order suggestions:', error);
      
      const mockSuggestions = [
        {
          orderNo: "GPRT00077C",
          customerStyle: "W02-490014",
          factoryNo: "YM",
          quantity: 3200,
          colors: ["BLACK", "DARK HEATHER BLACK", "NAVY", "WHITE"],
          sizes: ["XXS", "XS", "S", "M", "L", "XL", "XXL"]
        }
      ].filter(order => 
        order.orderNo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setOrderSuggestions(mockSuggestions);
      setShowSuggestions(mockSuggestions.length > 0);
    } finally {
      setLoading(false);
    }
  };

  const debounce = useCallback((func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }, []);

  const debouncedSearch = useCallback(
    debounce(fetchOrderSuggestions, 300),
    [debounce]
  );

  const fetchOrderDetails = async (orderNo) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/coverPage/orders/${encodeURIComponent(orderNo)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const orderData = await response.json();
      
      return orderData;
    } catch (error) {
      console.error('Error fetching order details:', error);
      
      return {
        orderNo: "GPRT00077C",
        customerStyle: "W02-490014",
        factoryNo: "YM",
        quantity: 3200,
        colors: ["BLACK", "DARK HEATHER BLACK", "NAVY", "WHITE"],
        sizes: ["XXS", "XS", "S", "M", "L", "XL", "XXL"]
      };
    } finally {
      setLoading(false);
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
    setJustSelected(true); 
    setShowSuggestions(false);
    
    const orderData = await fetchOrderDetails(orderNo);
    setSelectedOrder(orderData);
    setOrderSearchTerm(orderNo);
    
    setFormData(prev => ({
      ...prev,
      customerStyle: orderData.customerStyle || orderData.customer_style || "",
      orderNo: orderData.orderNo || orderNo,
      quantity: orderData.quantity || ""
    }));
    setAvailableColors(orderData.colors || []);
    
    setOrderColors(prev => ({
      ...prev,
      [orderNo]: orderData.colors || []
    }));
    setStyleTable([{
      orderNo: orderData.orderNo || orderNo,
      customerStyle: orderData.customerStyle || orderData.customer_style || "",
      poNumber: formData.poNumber,
      colors: [],
      quantity: 5,
      remarks: ""
    }]);
    if (orderData.sizes) {
      const sizeTableData = [{
        orderTotalQty: orderData.quantity || 0,
        sizeDetails: '',
        sizes: orderData.sizes || [],        
        colors: orderData.colors || [] 
      }];
      setSizeTable(sizeTableData);
    }
  }, [formData.poNumber]);

  const handlePONumberChange = (newPONumber) => {
    if (viewMode) return;
    setFormData(prev => ({
      ...prev,
      poNumber: newPONumber
    }));
    setStyleTable(prevTable => 
      prevTable.map(row => ({
        ...row,
        poNumber: newPONumber
      }))
    );
  };

  const handleImageUpload = (event) => {
    if (viewMode) return;
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const addStyleRow = () => {
    if (viewMode) return;
    setStyleTable([...styleTable, {
      orderNo: formData.orderNo,
      customerStyle: formData.customerStyle,
      poNumber: formData.poNumber,
      colors: [],
      quantity: 0,
      remarks: ""
    }]);
  };

  const removeStyleRow = (index) => {
    if (viewMode) return;
    if (styleTable.length > 1) {
      const newData = styleTable.filter((_, i) => i !== index);
      setStyleTable(newData);
    }
  };

  const addColorToRow = (rowIndex, color) => {
    if (viewMode) return;
    const newData = [...styleTable];
    if (!newData[rowIndex].colors.includes(color)) {
      newData[rowIndex].colors.push(color);
      setStyleTable(newData);
    }
  };

  const removeColorFromRow = (rowIndex, colorIndex) => {
    if (viewMode) return;
    const newData = [...styleTable];
    newData[rowIndex].colors.splice(colorIndex, 1);
    setStyleTable(newData);
  };

  const styleTableTotal = styleTable.reduce((sum, row) => sum + (parseInt(row.quantity) || 0), 0);

  const cleanDataForJSON = (obj) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        cleaned[key] = '';
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = cleanDataForJSON(value);
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map(item => 
          typeof item === 'object' && item !== null ? cleanDataForJSON(item) : item
        );
      } else if (typeof value === 'string') {
        cleaned[key] = value;
      } else {
        cleaned[key] = String(value);
      }
    }
    return cleaned;
  };

  const handleSave = async (status = 'draft') => {
    if (viewMode) return;
    try {
      setLoading(true);
      let empId = 'unknown_user';
      try {
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          empId = userData?.emp_id || 'unknown_user';
        }
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
      }

      const preparedSizeTable = sizeTable && sizeTable.length > 0 
        ? sizeTable.map(item => ({
            orderTotalQty: item.orderTotalQty || 0,
            sizeDetails: item.sizeDetails || '',
            sizes: item.sizes || (selectedOrder?.sizes || []),
            colors: item.colors || styleTable.flatMap(styleRow => styleRow.colors)
          }))
        : [];

      const preparedStyleTable = styleTable && styleTable.length > 0
        ? styleTable.filter(row => row.orderNo || row.customerStyle)
        : [];

      const cleanTestInstructions = typeof formData.testInstructions === 'string' 
        ? formData.testInstructions 
        : String(formData.testInstructions || '');

      const dataToSave = cleanDataForJSON({
        orderNo: formData.orderNo,
        customerStyle: formData.customerStyle,
        poNumber: formData.poNumber,
        quantity: formData.quantity,
        retailSingle: formData.retailSingle,
        majorPoints: formData.majorPoints,
        testInstructions: cleanTestInstructions,
        testInstructionsHTML: cleanTestInstructions,
        uploadedImage: uploadedImage,
        styleTable: preparedStyleTable,
        sizeTable: preparedSizeTable,
        stampData: {
          name: stampData.name || '',
          date: stampData.date || new Date().toISOString().split('T')[0]
        },
        createdBy: empId,
        status: status
      });

      const response = await fetch(`${API_BASE_URL}/api/coverPage/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setCurrentStatus(status);
        
        const message = status === 'submitted' 
          ? 'Order specification sheet submitted successfully!' 
          : 'Order specification sheet saved as draft!';
          
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
        throw new Error(result.message || 'Failed to save cover page');
      }
    } catch (error) {
      console.error('Error saving cover page:', error);
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
            <span className="text-gray-900 dark:text-white font-medium">Loading...</span>
          </div>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {viewMode ? 'Order Specification Sheet - View Mode' : 'Order Specification Sheet'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {viewMode 
              ? 'Complete overview of saved product specifications and quality requirements'
              : 'Create comprehensive product specifications and quality requirements'
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
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Information</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Search and select manufacturing order</p>
                </div>
              </div>
              
              <div className="mt-4 relative">
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
                    placeholder="Enter Order Number to search..."
                    className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  {loading && <Loader className="animate-spin h-5 w-5 text-blue-600" />}
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
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {order.customerStyle || order.customer_style}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Qty: {order.quantity} | Colors: {order.colors?.length || 0}
                        </div>
                      </div>
                    ))}
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Information - View Mode</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Saved order specifications and details</p>
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

          {/* Product Information Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              {/* Left Column - Image Upload/Display */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Product Image
                </h3>
                
                <div className="space-y-4">
                  {uploadedImage ? (
                    <div className="relative group">
                      <img 
                        src={uploadedImage} 
                        alt="Product" 
                        className="w-full h-64 object-contain bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-600" 
                      />
                      {!viewMode && (
                        <button
                          onClick={() => setUploadedImage(null)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {viewMode ? 'No Product Image' : 'Upload Product Image'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {viewMode ? 'Image not uploaded' : 'PNG, JPG up to 10MB'}
                      </p>
                    </div>
                  )}
                  
                  {!viewMode && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  )}
                </div>
              </div>

              {/* Right Column - Order Details */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  Order Details
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Customer Style
                      </label>
                      <div className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                        {formData.customerStyle || 'Not selected'}
                      </div>
                    </div>
                    <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Order Number
                      </label>
                      <div className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                        {formData.orderNo || 'Not selected'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        PO Number
                      </label>
                      {viewMode ? (
                        <div className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                          {formData.poNumber || 'Not specified'}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formData.poNumber}
                          onChange={(e) => handlePONumberChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter PO Number"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantity
                      </label>
                      <div className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                        {formData.quantity ? `${formData.quantity} pcs` : 'Not selected'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Major Points and Retail Single */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                  Major Points
                </h3>
                {viewMode ? (
                  <div className="w-full px-4 py-3 border border-yellow-300 dark:border-yellow-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg min-h-[100px]">
                    {formData.majorPoints || 'No major points specified'}
                  </div>
                ) : (
                  <textarea
                    value={formData.majorPoints}
                    onChange={(e) => setFormData(prev => ({...prev, majorPoints: e.target.value}))}
                    className="w-full px-4 py-3 border border-yellow-300 dark:border-yellow-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                    rows={4}
                    placeholder="Enter critical quality points and requirements..."
                  />
                )}
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Retail Single
                </h3>
                {viewMode ? (
                  <div className="w-full px-4 py-3 border border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg min-h-[100px]">
                    {formData.retailSingle || 'No retail specifications'}
                  </div>
                ) : (
                  <textarea
                    value={formData.retailSingle}
                    onChange={(e) => setFormData(prev => ({...prev, retailSingle: e.target.value}))}
                    className="w-full px-4 py-3 border border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={4}
                    placeholder="Enter retail specifications..."
                  />
                )}
              </div>
            </div>

            {/* Test Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Test Instructions
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-300 dark:border-blue-600">
                {viewMode ? (
                  <div className="p-4 min-h-[200px]">
                    {formData.testInstructions ? (
                      <div 
                        className="
                          text-gray-800 dark:text-gray-200 leading-relaxed font-sans
                          [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                          
                          [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:dark:text-gray-100 [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:leading-tight
                          [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:dark:text-gray-100 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:leading-tight
                          [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:dark:text-gray-100 [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:leading-tight
                          [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-gray-900 [&_h4]:dark:text-gray-100 [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:leading-tight
                          [&_h5]:text-base [&_h5]:font-semibold [&_h5]:text-gray-900 [&_h5]:dark:text-gray-100 [&_h5]:mt-4 [&_h5]:mb-2 [&_h5]:leading-tight
                          [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:text-gray-900 [&_h6]:dark:text-gray-100 [&_h6]:mt-4 [&_h6]:mb-2 [&_h6]:leading-tight
                          
                          [&_p]:mb-4 [&_p]:leading-7 [&_p]:text-gray-800 [&_p]:dark:text-gray-200
                          
                          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:mt-2 [&_ul]:space-y-1
                          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:mt-2 [&_ol]:space-y-1
                          [&_li]:leading-7 [&_li]:text-gray-800 [&_li]:dark:text-gray-200
                          
                          [&_ul_ul]:list-[circle] [&_ul_ul]:mt-2 [&_ul_ul]:mb-2
                          [&_ol_ol]:list-[lower-alpha] [&_ol_ol]:mt-2 [&_ol_ol]:mb-2
                          [&_ul_ul_ul]:list-[square]
                          [&_ol_ol_ol]:list-[lower-roman]
                          
                          [&_strong]:font-semibold [&_strong]:text-gray-900 [&_strong]:dark:text-gray-100
                          [&_b]:font-semibold [&_b]:text-gray-900 [&_b]:dark:text-gray-100
                          [&_em]:italic [&_em]:text-gray-800 [&_em]:dark:text-gray-200
                          [&_i]:italic [&_i]:text-gray-800 [&_i]:dark:text-gray-200
                          [&_u]:underline
                          
                          [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:decoration-blue-600 [&_a]:dark:decoration-blue-400
                          [&_a:hover]:text-blue-800 [&_a:hover]:dark:text-blue-300 [&_a:hover]:decoration-blue-800 [&_a:hover]:dark:decoration-blue-300
                          
                          [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-4 
                          [&_blockquote]:italic [&_blockquote]:text-gray-700 [&_blockquote]:dark:text-gray-300 [&_blockquote]:bg-gray-50 [&_blockquote]:dark:bg-gray-800/50
                          
                          [&_code]:bg-gray-100 [&_code]:dark:bg-gray-700 [&_code]:text-red-600 [&_code]:dark:text-red-400 
                          [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_code]:font-medium
                          
                          [&_pre]:bg-gray-100 [&_pre]:dark:bg-gray-700 [&_pre]:text-gray-900 [&_pre]:dark:text-gray-100 
                          [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-6
                          [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0
                          
                          [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:text-sm
                          [&_th]:border [&_th]:border-gray-300 [&_th]:dark:border-gray-600 [&_th]:bg-gray-50 [&_th]:dark:bg-gray-700 
                          [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900 [&_th]:dark:text-gray-100
                          [&_td]:border [&_td]:border-gray-300 [&_td]:dark:border-gray-600 [&_td]:px-4 [&_td]:py-3 
                          [&_td]:text-gray-800 [&_td]:dark:text-gray-200
                          
                          [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-gray-300 [&_hr]:dark:border-gray-600 [&_hr]:my-8
                          
                          [&_div]:my-1
                          [&_div>ul:first-child]:mt-0 [&_div>ul:last-child]:mb-0
                          [&_div>ol:first-child]:mt-0 [&_div>ol:last-child]:mb-0
                          [&_div>p:first-child]:mt-0 [&_div>p:last-child]:mb-0
                          
                          [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_img]:shadow-sm
                          
                          [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-800 [&_mark]:px-1 [&_mark]:rounded
                          
                          [&_sub]:text-xs [&_sub]:align-sub
                          [&_sup]:text-xs [&_sup]:align-super
                          
                          [&_del]:line-through [&_del]:text-gray-500 [&_del]:dark:text-gray-400
                          [&_ins]:underline [&_ins]:text-green-600 [&_ins]:dark:text-green-400 [&_ins]:no-underline [&_ins]:bg-green-100 [&_ins]:dark:bg-green-900/30
                          
                          [&_kbd]:bg-gray-100 [&_kbd]:dark:bg-gray-700 [&_kbd]:border [&_kbd]:border-gray-300 [&_kbd]:dark:border-gray-600 
                          [&_kbd]:rounded [&_kbd]:px-2 [&_kbd]:py-1 [&_kbd]:text-xs [&_kbd]:font-mono [&_kbd]:shadow-sm
                          
                          [&_small]:text-sm [&_small]:text-gray-600 [&_small]:dark:text-gray-400
                          
                          [&_abbr]:underline [&_abbr]:decoration-dotted [&_abbr]:cursor-help
                          
                          [&_details]:my-4 [&_details]:border [&_details]:border-gray-200 [&_details]:dark:border-gray-700 [&_details]:rounded-lg [&_details]:p-4
                          [&_summary]:font-semibold [&_summary]:cursor-pointer [&_summary]:text-gray-900 [&_summary]:dark:text-gray-100 [&_summary]:mb-2
                          
                          [&_figure]:my-6 [&_figure]:text-center
                          [&_figcaption]:text-sm [&_figcaption]:text-gray-600 [&_figcaption]:dark:text-gray-400 [&_figcaption]:mt-2 [&_figcaption]:italic
                          
                          [&_dl]:my-4
                          [&_dt]:font-semibold [&_dt]:text-gray-900 [&_dt]:dark:text-gray-100 [&_dt]:mt-4 [&_dt]:first:mt-0
                          [&_dd]:ml-4 [&_dd]:mt-1 [&_dd]:text-gray-800 [&_dd]:dark:text-gray-200
                        "
                        dangerouslySetInnerHTML={{ __html: formData.testInstructions }} 
                      />
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">No test instructions provided</p>
                    )}
                  </div>
                ) : (
                  <RichTextEditor
                    value={formData.testInstructions}
                    onChange={(content) => {
                      const cleanContent = typeof content === 'string' ? content : String(content || '');
                      setFormData(prev => ({...prev, testInstructions: cleanContent}));
                    }}
                    placeholder="Enter detailed test instructions and procedures..."
                    height="300px"
                    className="w-full"
                  />
                )}
              </div>
            </div>


            {/* Style Table */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Palette className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Style Configuration {styleTable.length > 0 && `(${styleTable.length} entries)`}
                </h3>
                {!viewMode && (
                  <button
                    onClick={addStyleRow}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Row</span>
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Style Information
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Colors
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 p-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                        Quantity
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Remarks
                      </th>
                      {!viewMode && (
                        <th className="border border-gray-300 dark:border-gray-600 p-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {styleTable.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <td className="border border-gray-300 dark:border-gray-600 p-3">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Order Number
                              </label>
                              {viewMode ? (
                                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm">
                                  {row.orderNo || 'Not specified'}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={row.orderNo}
                                  onChange={(e) => {
                                    const newData = [...styleTable];
                                    newData[index].orderNo = e.target.value;
                                    setStyleTable(newData);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  placeholder="Order Number"
                                />
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Customer Style
                              </label>
                              {viewMode ? (
                                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm">
                                  {row.customerStyle || 'Not specified'}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={row.customerStyle}
                                  onChange={(e) => {
                                    const newData = [...styleTable];
                                    newData[index].customerStyle = e.target.value;
                                    setStyleTable(newData);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  placeholder="Customer Style"
                                />
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                PO Number
                              </label>
                              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm cursor-not-allowed">
                                {row.poNumber || 'Not specified'}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="border border-gray-300 dark:border-gray-600 p-3">
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {row.colors && row.colors.length > 0 ? row.colors.map((color, colorIndex) => (
                                <span
                                  key={colorIndex}
                                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-full border border-blue-200 dark:border-blue-700"
                                >
                                  {color}
                                  {!viewMode && (
                                    <button
                                      onClick={() => removeColorFromRow(index, colorIndex)}
                                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </span>
                              )) : (
                                <span className="text-gray-500 dark:text-gray-400 text-sm italic">No colors specified</span>
                              )}
                            </div>
                            
                            <ColorDropdown 
                              rowIndex={index}
                              orderNo={row.orderNo}
                              selectedColors={row.colors}
                              onColorAdd={(color) => addColorToRow(index, color)}
                              fetchOrderColors={fetchOrderColors}
                              viewMode={viewMode}
                            />
                          </div>
                        </td>
                        
                        <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {viewMode ? (
                              <div className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-center">
                                {row.quantity || 0}
                              </div>
                            ) : (
                              <input
                                type="number"
                                value={row.quantity}
                                onChange={(e) => {
                                  const newData = [...styleTable];
                                  newData[index].quantity = parseInt(e.target.value) || 0;
                                  setStyleTable(newData);
                                }}
                                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                              />
                            )}
                            <span className="text-sm text-gray-600 dark:text-gray-400">pcs</span>
                          </div>
                        </td>
                        
                        <td className="border border-gray-300 dark:border-gray-600 p-3">
                          {viewMode ? (
                            <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm min-h-[100px]">
                              {row.remarks || 'No remarks'}
                            </div>
                          ) : (
                            <textarea
                              value={row.remarks}
                              onChange={(e) => {
                                const newData = [...styleTable];
                                newData[index].remarks = e.target.value;
                                setStyleTable(newData);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                              rows={4}
                              placeholder="Enter remarks..."
                            />
                          )}
                        </td>
                        
                        {!viewMode && (
                          <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                            {styleTable.length > 1 && (
                              <button
                                onClick={() => removeStyleRow(index)}
                                className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                title="Remove Row"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    
                    {/* Total Row */}
                    <tr className="bg-blue-50 dark:bg-blue-900/20 font-semibold">
                      <td colSpan={2} className="border border-gray-300 dark:border-gray-600 p-3 text-center text-gray-900 dark:text-white">
                        Total Quantity
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 text-center text-blue-600 dark:text-blue-400 font-bold">
                        {styleTableTotal} pcs
                      </td>
                      <td colSpan={viewMode ? 1 : 2} className="border border-gray-300 dark:border-gray-600 p-3"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Size Breakdown Table */}
            {selectedOrder && selectedOrder.sizes && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Hash className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  Size Breakdown & Details
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Style Information
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Colors
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 p-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                          Total Quantity
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Size Details & Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeTable.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                          <td className="border border-gray-300 dark:border-gray-600 p-3">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formData.orderNo || 'Not specified'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {formData.customerStyle || 'Not specified'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Hash className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  PO: {formData.poNumber || 'Not specified'}
                                </span>
                              </div>
                            </div>
                          </td>
                          
                          <td className="border border-gray-300 dark:border-gray-600 p-3">
                            <div className="flex flex-wrap gap-2">
                              {row.colors && row.colors.length > 0 ? row.colors.map((color, idx) => (
                                <span 
                                  key={idx} 
                                  className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-full border border-blue-200 dark:border-blue-700"
                                >
                                  {color}
                                </span>
                              )) : (
                                <span className="text-gray-500 dark:text-gray-400 text-sm italic">No colors specified</span>
                              )}
                            </div>
                          </td>
                          
                          <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-700">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {row.orderTotalQty || formData.quantity || 0}
                              </div>
                              <div className="text-sm text-green-700 dark:text-green-300">pieces</div>
                            </div>
                          </td>
                          
                          <td className="border border-gray-300 dark:border-gray-600 p-3">
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Available Sizes: {selectedOrder.sizes.join(', ')}
                              </div>
                              {viewMode ? (
                                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm min-h-[150px]">
                                  {row.sizeDetails || 'No size details provided'}
                                </div>
                              ) : (
                                <textarea
                                  value={row.sizeDetails || ''}
                                  onChange={(e) => {
                                    const newData = [...sizeTable];
                                    newData[rowIndex].sizeDetails = e.target.value;
                                    setSizeTable(newData);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                                  rows={6}
                                  placeholder="Enter size breakdown, measurements, or special notes..."
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quality Control Stamp */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
                Quality Control Approval
              </h3>
              
              <div className="flex justify-end">
                <div className="bg-white dark:bg-gray-800 border-2 border-red-400 dark:border-red-600 rounded-xl p-6 shadow-lg">
                  <div className="text-center">
                    <div className="text-red-600 dark:text-red-400 font-bold text-lg mb-4 flex items-center justify-center">
                      <Shield className="h-6 w-6 mr-2" />
                      Quality Control
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Name:</span>
                        {viewMode ? (
                          <div className="border-b-2 border-red-400 dark:border-red-600 bg-transparent text-sm w-24 text-gray-900 dark:text-white px-2 py-1">
                            {stampData.name || 'Not specified'}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={stampData.name}
                            onChange={(e) => setStampData(prev => ({...prev, name: e.target.value}))}
                            className="border-b-2 border-red-400 dark:border-red-600 bg-transparent text-sm w-24 focus:outline-none focus:border-red-600 dark:focus:border-red-400 text-gray-900 dark:text-white"
                            placeholder="Inspector"
                          />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date:</span>
                        {viewMode ? (
                          <div className="border-b-2 border-red-400 dark:border-red-600 bg-transparent text-sm w-32 text-gray-900 dark:text-white px-2 py-1">
                            {stampData.date ? new Date(stampData.date).toLocaleDateString() : 'Not specified'}
                          </div>
                        ) : (
                          <input
                            type="date"
                            value={stampData.date}
                            onChange={(e) => setStampData(prev => ({...prev, date: e.target.value}))}
                            className="border-b-2 border-red-400 dark:border-red-600 bg-transparent text-sm w-32 focus:outline-none focus:border-red-600 dark:focus:border-red-400 text-gray-900 dark:text-white"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Hide in view mode */}
            {!viewMode && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Info className="h-4 w-4" />
                    <span>All information will be saved to the specification sheet</span>
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
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  {/* Save as Draft Button */}
                  <button 
                    onClick={() => handleSave('draft')}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save as Draft</span>
                      </>
                    )}
                  </button>
                  {/* Submit Button */}
                  <button 
                    onClick={() => handleSave('submitted')}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
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
                    <span>Specification sheet saved and viewable</span>
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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Info</span>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            formData.poNumber 
              ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' 
              : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${formData.poNumber ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">PO Number</span>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            styleTable.some(row => row.colors && row.colors.length > 0) 
              ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' 
              : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${styleTable.some(row => row.colors && row.colors.length > 0) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Colors Added</span>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            stampData.name 
              ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' 
              : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${stampData.name ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">QC Approval</span>
            </div>
          </div>

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
      </div>
    </div>
  );
};

export default OrderSpecificationSheet;


