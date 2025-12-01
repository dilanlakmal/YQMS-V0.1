import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Sparkles,
  User,
  Upload,
  Save,
  Search,
  Loader,
  Plus,
  Trash2
} from "lucide-react";
import { useAuth } from "../components/authentication/AuthContext";
import {API_BASE_URL} from "../../config";

const CoverPage = () => {
  const { user } = useAuth();
  
  // State management
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderSuggestions, setOrderSuggestions] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    customerStyle: "",
    orderNo: "",
    poNumber: "",
    quantity: "",
    retailSingle: "",
    majorPoints: "",
    testInstructions: ""
  });

  // Updated table data structure for the new format
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
  
  // Available colors from selected order
  const [availableColors, setAvailableColors] = useState([]);
  
  // Stamp data
  const [stampData, setStampData] = useState({
    name: "",
    date: new Date().toISOString().split('T')[0]
  });

  // Backend function to fetch orders with better error handling
  const fetchOrderSuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOrderSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching suggestions for:', searchTerm);
      
      const response = await fetch(`${API_BASE_URL}/api/coverPage/orders/search?term=${encodeURIComponent(searchTerm)}`);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type'));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const data = await response.json();
      console.log('Received suggestions:', data);
      
      setOrderSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Error fetching order suggestions:', error);
      
      // Fallback to mock data for development
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

  // Debounce function
  const debounce = useCallback((func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }, []);

  // Create debounced search function
  const debouncedSearch = useCallback(
    debounce(fetchOrderSuggestions, 300),
    [debounce]
  );

  // Backend function to fetch order details
  const fetchOrderDetails = async (orderNo) => {
    try {
      setLoading(true);
      console.log('Fetching order details for:', orderNo);
      
      const response = await fetch(`${API_BASE_URL}/api/coverPage/orders/${encodeURIComponent(orderNo)}`);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const orderData = await response.json();
      console.log('Received order data:', orderData);
      
      return orderData;
    } catch (error) {
      console.error('Error fetching order details:', error);
      
      // Fallback to mock data for development
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

  // Handle order search with debouncing
  useEffect(() => {
    if (orderSearchTerm) {
      debouncedSearch(orderSearchTerm);
    } else {
      setOrderSuggestions([]);
      setShowSuggestions(false);
    }
  }, [orderSearchTerm, debouncedSearch]);

  // Handle order selection
const handleOrderSelect = async (orderNo) => {
  const orderData = await fetchOrderDetails(orderNo);
  setSelectedOrder(orderData);
  setOrderSearchTerm(orderNo);
  setShowSuggestions(false);
  
  // Update form data
  setFormData(prev => ({
    ...prev,
    customerStyle: orderData.customerStyle || orderData.customer_style || "",
    orderNo: orderData.orderNo || orderNo,
    quantity: orderData.quantity || ""
  }));

  // Set available colors
  setAvailableColors(orderData.colors || []);

  // Update style table with order data and current PO number
  setStyleTable([{
    orderNo: orderData.orderNo || orderNo,
    customerStyle: orderData.customerStyle || orderData.customer_style || "",
    poNumber: formData.poNumber,
    colors: orderData.colors || [],
    quantity: 5,
    remarks: ""
  }]);

  // Initialize size table with updated structure
  if (orderData.colors && orderData.sizes) {
    const sizeTableData = orderData.colors.map(color => ({
      color: color,
      orderTotalQty: orderData.quantity || 0,
      sizeDetails: '' // Single text field for all size details
    }));
    setSizeTable(sizeTableData);
  }
};


// Add this new function to handle PO number changes
const handlePONumberChange = (newPONumber) => {
  // Update form data
  setFormData(prev => ({
    ...prev,
    poNumber: newPONumber
  }));

  // Update all rows in style table with the new PO number
  setStyleTable(prevTable => 
    prevTable.map(row => ({
      ...row,
      poNumber: newPONumber
    }))
  );
};




  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Add new row to style table
  const addStyleRow = () => {
    setStyleTable([...styleTable, {
      orderNo: formData.orderNo,
      customerStyle: formData.customerStyle,
      poNumber: "",
      colors: [],
      quantity: 0,
      remarks: ""
    }]);
  };

  // Remove row from style table
  const removeStyleRow = (index) => {
    if (styleTable.length > 1) {
      const newData = styleTable.filter((_, i) => i !== index);
      setStyleTable(newData);
    }
  };

  // Add color to a style row
  const addColorToRow = (rowIndex, color) => {
    const newData = [...styleTable];
    if (!newData[rowIndex].colors.includes(color)) {
      newData[rowIndex].colors.push(color);
      setStyleTable(newData);
    }
  };

  // Remove color from a style row
  const removeColorFromRow = (rowIndex, colorIndex) => {
    const newData = [...styleTable];
    newData[rowIndex].colors.splice(colorIndex, 1);
    setStyleTable(newData);
  };

  // Calculate totals
  const styleTableTotal = styleTable.reduce((sum, row) => sum + (parseInt(row.quantity) || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg flex items-center gap-2">
            <Loader className="animate-spin" size={20} />
            <span>Loading...</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        
        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <Shield size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                      Order Specification Sheet
                    </h1>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] font-bold text-white">PRO</span>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-xs text-indigo-100 font-medium truncate">
                    Quality Control Documentation
                  </p>
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2.5 py-1.5 shadow-xl flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md shadow-lg">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white font-bold text-xs leading-tight">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 text-[10px] font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <Shield size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-black text-white tracking-tight">
                        Order Specification Sheet
                      </h1>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                        <Sparkles size={12} className="text-yellow-300" />
                        <span className="text-xs font-bold text-white">PRO</span>
                      </div>
                    </div>
                    <p className="text-sm text-indigo-100 font-medium">
                      Quality Control Documentation System
                    </p>
                  </div>
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 shadow-xl">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 text-xs font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <div className="bg-white border-2 border-black p-0">
          
          {/* Top Header Row */}
          <div className="grid grid-cols-2 border-b-2 border-black">
            {/* Order Number Section */}
            <div className="border-r-2 border-black p-2 relative">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={orderSearchTerm}
                  onChange={(e) => setOrderSearchTerm(e.target.value)}
                  placeholder="Enter Order No"
                  className="flex-1 text-lg font-bold border-0 outline-none bg-transparent"
                />
                {loading && <Loader className="animate-spin" size={16} />}
              </div>
              
              {/* Order Suggestions Dropdown */}
              {showSuggestions && orderSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 shadow-lg z-10 max-h-40 overflow-y-auto">
                  {orderSuggestions.map((order, index) => (
                    <div
                      key={index}
                      onClick={() => handleOrderSelect(order.orderNo)}
                      className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                    >
                      <div className="font-semibold">{order.orderNo}</div>
                      <div className="text-sm text-gray-600">
                        {order.customerStyle || order.customer_style}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Attention Major Points */}
            <div className="p-2">
              <div className="text-lg font-bold text-center">Attention Major Points</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-2">
            
            {/* Left Column - Image */}
            <div className="border-r-2 border-b-2 border-black p-4 flex flex-col items-center justify-center min-h-[200px]">
              {uploadedImage ? (
                <img src={uploadedImage} alt="Product" className="max-w-full max-h-40 object-contain" />
              ) : (
                <div className="border-2 border-dashed border-gray-400 w-full h-32 flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500">Upload Image</p>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-2 text-xs"
              />
            </div>

            {/* Right Column - Order Details */}
            <div className="border-r-2 border-b-2 border-black">
              <div className="grid grid-rows-4">
                <div className="border-b border-black p-2 grid grid-cols-2">
                  <span className="font-semibold">Customer Style:</span>
                  <span>{formData.customerStyle}</span>
                </div>
                <div className="border-b border-black p-2 grid grid-cols-2">
                  <span className="font-semibold">Order No:</span>
                  <span>{formData.orderNo}</span>
                </div>
                <div className="border-b border-black p-2 grid grid-cols-2">
                  <span className="font-semibold">PO#:</span>
                  <input
                    type="text"
                    value={formData.poNumber}
                    onChange={(e) => handlePONumberChange(e.target.value)}
                    className="border-0 outline-none bg-transparent border-black"
                  />
                </div>
                <div className="p-2 grid grid-cols-2">
                  <span className="font-semibold">Quantity:</span>
                  <span>{formData.quantity}pcs</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-b-2">
            {/* Major Points Section */}
            <div className="border-r border-black bg-yellow-200 p-2">
              <div className="font-semibold mb-1">Major Points:</div>
              <textarea
                value={formData.majorPoints}
                onChange={(e) => setFormData(prev => ({...prev, majorPoints: e.target.value}))}
                className="w-full border-0 outline-none bg-transparent resize-none"
                rows={2}
                placeholder="Enter major points here..."
              />
            </div>

            {/* Right Column - Additional Info */}
            <div>
              <div className="border-black p-2">
                <span className="font-semibold">Retail Single:</span>
                <input
                  type="text"
                  value={formData.retailSingle}
                  onChange={(e) => setFormData(prev => ({...prev, retailSingle: e.target.value}))}
                  className="w-full border-0 outline-none bg-transparent mt-1"
                />
              </div>
            </div>
          </div>

          {/* Test Instructions */}
          <div className="border-t border-black p-2">
            <textarea
              value={formData.testInstructions}
              onChange={(e) => setFormData(prev => ({...prev, testInstructions: e.target.value}))}
              className="w-full border-0 outline-none bg-transparent"
              rows={12}
              placeholder="Enter test instructions..."
            />
          </div>

          {/* Updated Style Table with new structure */}
          <div className="border-t-2 border-black mb-4 p-2">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 text-xs">STYLE</th>
                  <th className="border border-black p-2 text-xs">COLOR</th>
                  <th className="border border-black p-2 text-xs">QTY</th>
                  <th className="border border-black p-2 text-xs">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {styleTable.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-black p-1">
                      {/* Combined Order Info in first column */}
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="font-semibold">Order No:</span>
                          <input
                            type="text"
                            value={row.orderNo}
                            onChange={(e) => {
                              const newData = [...styleTable];
                              newData[index].orderNo = e.target.value;
                              setStyleTable(newData);
                            }}
                            className="w-full border-0 outline-none bg-transparent text-xs mt-1"
                            placeholder="Order Number"
                          />
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold">Customer Style:</span>
                          <input
                            type="text"
                            value={row.customerStyle}
                            onChange={(e) => {
                              const newData = [...styleTable];
                              newData[index].customerStyle = e.target.value;
                              setStyleTable(newData);
                            }}
                            className="w-full border-0 outline-none bg-transparent text-xs mt-1"
                            placeholder="Customer Style"
                          />
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold">PO#:</span>
                          <input
                            type="text"
                            value={row.poNumber}
                            readOnly
                            className="w-full border-0 outline-none bg-transparent text-xs mt-1"
                            placeholder="PO Number"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="border border-black p-1">
                      {/* Color management in second column */}
                      <div className="space-y-2">
                        {/* Display selected colors */}
                        <div className="flex flex-wrap gap-1">
                          {row.colors.map((color, colorIndex) => (
                            <span
                              key={colorIndex}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {color}
                              <button
                                onClick={() => removeColorFromRow(index, colorIndex)}
                                className="text-red-500 hover:text-red-700 ml-1"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        
                        {/* Add color dropdown */}
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              addColorToRow(index, e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className="w-full border border-gray-300 text-xs p-1 rounded"
                        >
                          <option value="">+ Add Color</option>
                          {availableColors.map((color, colorIndex) => (
                            <option key={colorIndex} value={color}>
                              {color}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="border border-black p-1 text-center">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => {
                          const newData = [...styleTable];
                          newData[index].quantity = parseInt(e.target.value) || 0;
                          setStyleTable(newData);
                        }}
                        className="w-full border-0 outline-none bg-transparent text-s text-center"
                      />
                      pcs
                    </td>
                    <td className="border border-black p-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) => {
                            const newData = [...styleTable];
                            newData[index].remarks = e.target.value;
                            setStyleTable(newData);
                          }}
                          className="flex-1 border-0 outline-none bg-transparent text-xs"
                        />
                        {styleTable.length > 1 && (
                          <button
                            onClick={() => removeStyleRow(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {/* Add Row Button */}
                <tr>
                  <td colSpan={4} className="border border-black p-2 text-center">
                    <button
                      onClick={addStyleRow}
                      className="flex items-center gap-1 mx-auto text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Plus size={16} />
                      Add Row
                    </button>
                  </td>
                </tr>
                
                <tr className="bg-gray-100">
                  <td colSpan={2} className="border border-black p-2 text-center font-semibold text-xs">
                    Total Qty
                  </td>
                  <td className="border border-black p-2 text-center font-semibold text-xs">
                    {styleTableTotal} pc
                  </td>
                  <td className="border border-black p-2"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Size Breakdown Table - Updated Structure */}
            {selectedOrder && selectedOrder.sizes && (
              <div className="border-t-2 border-black p-2">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2 text-xs">STYLE</th>
                      <th className="border border-black p-2 text-xs">COLOR</th>
                      <th className="border border-black p-2 text-xs">TOTAL</th>
                      <th className="border border-black p-1 text-xs">
                        <div className={`grid gap-0 grid-cols-${selectedOrder.sizes.length}`}>
                          {selectedOrder.sizes.map(size => (
                            <div key={size} className="border-r border-black last:border-r-0 p-1 text-center">
                              {size}
                            </div>
                          ))}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeTable.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 1 ? "bg-green-100" : ""}>
                        {/* STYLE Column - Display Order No, Customer Style, and PO# */}
                        <td className="border border-black p-2 text-xs">
                          <div className="space-y-1">
                            <div>
                              <span className="font-semibold">Order No:</span>
                              <div>{formData.orderNo}</div>
                            </div>
                            <div>
                              <span className="font-semibold">Customer Style:</span>
                              <div>{formData.customerStyle}</div>
                            </div>
                            <div>
                              <span className="font-semibold">PO#:</span>
                              <div>{formData.poNumber}</div>
                            </div>
                          </div>
                        </td>
                        
                        {/* COLOR Column */}
                        <td className="border border-black p-2 text-xs">{row.color}</td>
                        
                        {/* TOTAL Column - Editable quantity */}
                        <td className="border border-black p-2 text-xs text-center">
                          <div className="font-semibold text-lg">
                            {row.orderTotalQty || formData.quantity || 0}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">pcs</div>
                        </td>
                        
                        {/* Size Details Column - Merged single textarea */}
                        <td className="border border-black p-1">
                          <textarea
                            value={row.sizeDetails || ''}
                            onChange={(e) => {
                              const newData = [...sizeTable];
                              newData[rowIndex].sizeDetails = e.target.value;
                              setSizeTable(newData);
                            }}
                            className="w-full border-0 outline-none bg-transparent text-xs resize-none"
                            rows={3}
                            placeholder="Enter size details, measurements, or notes..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}


          {/* Stamp Section */}
          <div className="border-t-2 border-black p-4 flex justify-end">
            <div className="border-2 border-red-400 p-3 bg-red-50">
              <div className="text-center">
                <div className="text-red-600 font-bold mb-2">Quality Control</div>
                <div className="space-y-1">
                  <div className="text-xs">
                    <span>Name: </span>
                    <input
                      type="text"
                      value={stampData.name}
                      onChange={(e) => setStampData(prev => ({...prev, name: e.target.value}))}
                      className="border-b border-red-400 bg-transparent text-xs w-20"
                    />
                  </div>
                  <div className="text-xs">
                    <span>Date: </span>
                    <input
                      type="date"
                      value={stampData.date}
                      onChange={(e) => setStampData(prev => ({...prev, date: e.target.value}))}
                      className="border-b border-red-400 bg-transparent text-xs w-24"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-4 flex justify-center">
          <button className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
            <Save size={20} />
            Save Specification Sheet
          </button>
        </div>
      </div>

      {/* Global Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .bg-grid-white {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
        }
        .delay-1000 { animation-delay: 1s; }
      `}</style>
    </div>
  );
};

export default CoverPage;

