import { useState, useEffect, useRef } from 'react';

const OrderDetails = () => {
  const [orderNo, setOrderNo] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // New states for autocomplete
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounce function for search
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Search for order suggestions
  const searchOrderSuggestions = async (query) => {
  if (query.length < 2) {
    setSuggestions([]);
    setShowSuggestions(false);
    return;
  }

  try {
    setLoadingSuggestions(true);
    const searchUrl = `${apiBaseUrl}/api/coverPage/orders/search?query=${encodeURIComponent(query)}`;
    console.log('🔍 Searching with URL:', searchUrl);
    
    const response = await fetch(searchUrl);
    console.log('🔍 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('🔍 Full response:', result);
      console.log('🔍 Response length:', result.length);
      
      // Handle direct array response
      if (Array.isArray(result)) {
        console.log('🔍 Setting suggestions:', result);
        setSuggestions(result);
        setShowSuggestions(result.length > 0);
        setSelectedIndex(-1);
      } else if (result && result.success && Array.isArray(result.data)) {
        // Handle wrapped response
        console.log('🔍 Setting suggestions from data:', result.data);
        setSuggestions(result.data);
        setShowSuggestions(result.data.length > 0);
        setSelectedIndex(-1);
      } else {
        console.log('🔍 Unexpected response format:', result);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      console.error('🔍 HTTP Error:', response.status);
      const errorText = await response.text();
      console.error('🔍 Error response:', errorText);
    }
  } catch (err) {
    console.error('🔍 Network/Parse Error:', err);
  } finally {
    setLoadingSuggestions(false);
  }
};

  // Debounced search function
  const debouncedSearch = debounce(searchOrderSuggestions, 300);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setOrderNo(value);
    debouncedSearch(value);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setOrderNo(suggestion.orderNo);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    // Automatically fetch order data when suggestion is selected
    fetchOrderData(suggestion.orderNo);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchOrderData = async (orderNumber) => {
    try {
      setLoading(true);
      setError(null);
      setOrderData(null);
      
      console.log('Fetching data for order:', orderNumber);
      console.log('API URL:', `${apiBaseUrl}/api/coverPage/${orderNumber}`);
      
      const response = await fetch(`${apiBaseUrl}/api/coverPage/${orderNumber}`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success) {
        setOrderData(result.data);
      } else {
        setError(result.message || 'Failed to fetch order data');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch order data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (orderNo.trim()) {
      fetchOrderData(orderNo.trim());
      setShowSuggestions(false);
    } else {
      setError('Please enter an order number');
    }
  };

  // Your existing image upload functions...
  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    handleImageUpload(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
  };

  if (!orderData && !loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="flex justify-center items-center min-h-screen">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Order Details Search</h2>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <label htmlFor="orderNo" className="block text-sm font-medium text-gray-700 mb-2">
                  Order Number
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  id="orderNo"
                  value={orderNo}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Enter order number (e.g., PTAF0430)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoComplete="off"
                />
                
                {/* Loading indicator for suggestions */}
                {loadingSuggestions && (
                  <div className="absolute right-3 top-9 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                  >
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.orderNo}
                        className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-50 ${
                          index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-800">{suggestion.orderNo}</div>
                            <div className="text-sm text-gray-600">
                              {suggestion.customerCode} • {suggestion.customerStyle}
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No suggestions message */}
                {showSuggestions && suggestions.length === 0 && orderNo.length >= 2 && !loadingSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="px-4 py-3 text-gray-500 text-center">
                      No orders found matching "{orderNo}"
                    </div>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="text-red-600 text-sm mt-2">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Search Order
              </button>
            </form>

            {/* Search tips */}
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">
                💡 <strong>Tip:</strong> Start typing to see order suggestions. Use arrow keys to navigate and Enter to select.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rest of your existing component code remains the same...
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading order details for {orderNo}...</p>
          <p className="mt-2 text-sm text-gray-500">API: {apiBaseUrl}/api/coverPage/{orderNo}</p>
        </div>
      </div>
    );
  }

  if (error && orderNo) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        <div className="text-center">
          <p className="text-xl font-semibold">Error: {error}</p>
          <p className="text-sm text-gray-600 mt-2">Order Number: {orderNo}</p>
          <p className="text-sm text-gray-500 mt-1">API: {apiBaseUrl}/api/coverPage/{orderNo}</p>
          <button 
            onClick={() => {
              setError(null);
              setOrderData(null);
              setOrderNo('');
            }} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Search Again
          </button>
        </div>
      </div>
    );
  }

  if (!orderData || !orderData.colorBreakdown || !orderData.sizeList) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold text-red-500">Incomplete order data received</p>
          <p className="text-sm text-gray-600 mt-2">Order Number: {orderNo}</p>
          <p className="text-sm text-gray-500 mt-1">Missing required data fields</p>
          <button 
            onClick={() => {
              setError(null);
              setOrderData(null);
              setOrderNo('');
            }} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Search Again
          </button>
        </div>
      </div>
    );
  }

  // Your existing JSX for displaying order details remains exactly the same...
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Add a search again button at the top */}
      <div className="mb-4">
        <button
          onClick={() => {
            setOrderData(null);
            setOrderNo('');
            setError(null);
            setSuggestions([]);
            setShowSuggestions(false);
          }}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          ← Search Another Order
        </button>
      </div>
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {/* Company name will be populated here */}
                <span className="text-blue-100">Yorkmars (cambodia) Garment MFG. Co. Ltd.</span>
              </h1>
            </div>
            
            {/* Image Upload Section */}
            <div className="relative">
              <div
                className={`w-32 h-32 bg-white/10 backdrop-blur-sm border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isDragging 
                    ? 'border-white/60 bg-white/20' 
                    : 'border-white/20 hover:border-white/40 hover:bg-white/15'
                } cursor-pointer`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('imageUpload').click()}
              >
                {uploadedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={uploadedImage}
                      alt="Product"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <svg className="w-8 h-8 text-white/60 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-xs text-white/80 block">
                      {isDragging ? 'Drop image here' : 'Upload Product Image'}
                    </span>
                    <span className="text-xs text-white/60 block mt-1">
                      Click or drag & drop
                    </span>
                  </div>
                )}
              </div>
              
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* Upload Instructions */}
              <div className="mt-2 text-center">
                <span className="text-xs text-white/70">
                  JPG, PNG, GIF up to 10MB
                </span>
              </div>
            </div>
            
            <div className="flex-1 text-right">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
               Order Details
              </h2>
              <div className="inline-flex items-center bg-white rounded-lg px-4 py-2 shadow-md">
                <span className="text-sm text-gray-500 mr-2">Order #</span>
                <span className="font-bold text-gray-800">{orderData.orderNo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Customer Information
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">CUSTOMER CODE</label>
                    <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                       {orderData.cust_Code}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">CUSTOMER STYLE</label>
                    <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                      {orderData.customerStyle}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">QUANTITY</label>
                    <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center font-semibold">
                     <span className="text-2xl font-bold text-blue-700">{orderData?.totalQuantity?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Order Timeline
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ORDER DATE</label>
                    <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                      {/* Order date */}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">EX FACTORY DATE</label>
                    <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center font-semibold text-red-600">
                      {/* Ex factory date */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Additional Information
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CUSTOMER PO</label>
                <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                  {/* Customer PO */}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CUSTOMER STY</label>
                <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                  {/* Customer style 2 */}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SEASON</label>
                <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                  {/* Season */}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">C.O.O.</label>
                <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                  {orderData.countryOfOrigin}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
          <h2 className="text-lg font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Product Specifications
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">DESCRIPTION</label>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[80px] flex items-start">
                {/* Product description */}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">COLOUR</label>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[80px] flex items-start">
                {orderData?.colorBreakdown?.map(color => color.colorName).join(', ') || 'No colors available'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">QUANTITY</label>
              <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center font-semibold">
                {orderData?.totalQuantity?.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Size Breakdown Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4">
          <h2 className="text-lg font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Size Breakdown
          </h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                    Color Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                    Colour
                  </th>
                  {(orderData?.sizeList || []).map((size) => (
                    <th key={size} className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                      {size}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 bg-blue-50">
                    Total
                  </th>
                </tr>
              </thead>
               <tbody>
                {(orderData?.colorBreakdown || []).map((color, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 border-b border-gray-200">
                      <div className="bg-gray-100 rounded px-2 py-1 text-sm font-mono">
                        {color.colorCode}
                      </div>
                    </td>
                    <td className="px-4 py-4 border-b border-gray-200">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-gray-300 border-2 border-gray-400 rounded mr-3 shadow-sm"></div>
                        <span className="text-sm text-gray-700">{color.colorName}</span>
                      </div>
                    </td>
                    {(orderData?.sizeList || []).map((size) => (
                      <td key={size} className="px-4 py-4 text-center border-b border-gray-200">
                        <div className="bg-gray-50 rounded px-2 py-1 min-h-[32px] flex items-center justify-center">
                          {color?.sizes?.[size] || 0}
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-4 text-center border-b border-gray-200 bg-blue-50">
                      <div className="bg-blue-100 rounded px-3 py-1 font-bold text-blue-800 min-h-[32px] flex items-center justify-center">
                        {color.colorTotal}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Shipment and Processing Details */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Shipment Information */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-4">
            <h2 className="text-lg font-bold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Shipment Information
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SHIPMENT LOT #</label>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[44px] flex items-center">
                  {/* Shipment lot */}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">EX FACTORY DATE</label>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[44px] flex items-center">
                  {/* Ex factory date */}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">QUANTITY</label>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200 min-h-[44px] flex items-center font-semibold text-green-700">
                  {/* Quantity */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Details */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-4">
            <h2 className="text-lg font-bold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Processing Details
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { label: "PRINT", icon: "🖨️" },
                { label: "EMBROIDERY", icon: "🧵" },
                { label: "WASHING", icon: "🧼" },
                { label: "HEAT TRANSFER", icon: "🔥" }
              ].map((item) => (
                <div key={item.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[44px] flex items-center">
                    {/* Processing details */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Remarks Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mt-8 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-4">
          <h2 className="text-lg font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Remarks
          </h2>
        </div>
        <div className="p-6">
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 min-h-[120px]">
            {/* Remarks content */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
