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
import {API_BASE_URL} from "../../../../config.js";
import RichTextEditor from '../YDT/RichTextEditor.jsx';

// Move ColorDropdown OUTSIDE of CoverPage component
const ColorDropdown = ({ rowIndex, orderNo, selectedColors, onColorAdd, fetchOrderColors }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);

  useEffect(() => {
    const loadColors = async () => {
      if (orderNo) {
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
  }, [orderNo, fetchOrderColors]);

  // Filter out already selected colors
  const unselectedColors = availableColors.filter(color => !selectedColors.includes(color));

  return (
    <select
      onChange={(e) => {
        if (e.target.value) {
          onColorAdd(e.target.value);
          e.target.value = "";
        }
      }}
      className="w-full border border-gray-300 text-xs p-1 rounded"
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

// Now define the main CoverPage component
const OrderSpecificationSheet = () => {
  // State management
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderSuggestions, setOrderSuggestions] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [justSelected, setJustSelected] = useState(false);
  const [orderColors, setOrderColors] = useState({});
  
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

  // FIXED: Remove orderColors dependency to prevent infinite loop
  const fetchOrderColors = useCallback(async (orderNo) => {
    if (!orderNo) {
      return [];
    }

    // Use functional update to access current orderColors without dependency
    return new Promise((resolve) => {
      setOrderColors(currentOrderColors => {
        // Check if colors are already cached
        if (currentOrderColors[orderNo]) {
          resolve(currentOrderColors[orderNo]);
          return currentOrderColors;
        }

        // If not cached, fetch from API
        (async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/coverPage/orders/${encodeURIComponent(orderNo)}`);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const orderData = await response.json();
            const colors = orderData.colors || [];
            
            // Store colors for this order
            setOrderColors(prev => ({
              ...prev,
              [orderNo]: colors
            }));
            
            resolve(colors);
          } catch (error) {
            console.error('Error fetching order colors:', error);
            
            // Fallback to mock data
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
  }, []); // Empty dependency array

  // Backend function to fetch orders with better error handling
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
    if (orderSearchTerm && !justSelected) { 
      debouncedSearch(orderSearchTerm);
    } else if (!orderSearchTerm) {
      setOrderSuggestions([]);
      setShowSuggestions(false);
    }
  }, [orderSearchTerm, debouncedSearch, justSelected]);

const handleOrderSelect = useCallback(async (orderNo) => {
  setJustSelected(true); 
  setShowSuggestions(false); // Hide suggestions immediately
  
  const orderData = await fetchOrderDetails(orderNo);
  setSelectedOrder(orderData);
  setOrderSearchTerm(orderNo);
  
  // Update form data
  setFormData(prev => ({
    ...prev,
    customerStyle: orderData.customerStyle || orderData.customer_style || "",
    orderNo: orderData.orderNo || orderNo,
    quantity: orderData.quantity || ""
  }));

  // Set available colors
  setAvailableColors(orderData.colors || []);
  
  // Store colors for this order
  setOrderColors(prev => ({
    ...prev,
    [orderNo]: orderData.colors || []
  }));

  // Update style table with order data and current PO number
  setStyleTable([{
    orderNo: orderData.orderNo || orderNo,
    customerStyle: orderData.customerStyle || orderData.customer_style || "",
    poNumber: formData.poNumber,
    colors: [], // Start with empty colors array
    quantity: 5,
    remarks: ""
  }]);

  // Initialize size table with updated structure
  if (orderData.sizes) {
    const sizeTableData = [{
      orderTotalQty: orderData.quantity || 0,
      sizeDetails: ''
    }];
    setSizeTable(sizeTableData);
  }

  // // Reset the justSelected flag after a longer delay to ensure it works
  // setTimeout(() => {
  //   setJustSelected(false);
  // }, 500); // Increased from 100ms to 500ms
}, [formData.poNumber]);

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
      poNumber: formData.poNumber, // Use current PO number
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
                  onChange={(e) => {
                    setOrderSearchTerm(e.target.value);
                    if (justSelected) {
                      setJustSelected(false);
                    }
                  }}
                  placeholder="Enter Order No"
                  className="flex-1 text-lg font-bold border-0 outline-none bg-transparent"
                />
                {loading && <Loader className="animate-spin" size={16} />}
              </div>
              
              {/* Order Suggestions Dropdown */}
              {showSuggestions && orderSuggestions.length > 0 && !justSelected && ( 
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

          {/* Rest of your JSX remains the same... */}
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
            <div className="font-semibold mb-2 text-sm">Test Instructions:</div>
            <RichTextEditor
              value={formData.testInstructions}
              onChange={(content) => setFormData(prev => ({...prev, testInstructions: content}))}
              placeholder="Enter detailed test instructions..."
              height="300px"
              className="w-full"
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
                        
                        {/* Add color dropdown - UPDATED */}
                        <ColorDropdown 
                          rowIndex={index}
                          orderNo={row.orderNo}
                          selectedColors={row.colors}
                          onColorAdd={(color) => addColorToRow(index, color)}
                          fetchOrderColors={fetchOrderColors}
                        />
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
                      <tr key={rowIndex}>
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
                        <td className="border border-black p-2 text-xs">
                          <div className="flex flex-wrap gap-1">
                            {styleTable.flatMap(styleRow => styleRow.colors).map((color, idx) => (
                              <span 
                                key={idx} 
                                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                              >
                                {color}
                              </span>
                            ))}
                          </div>
                        </td>
                        
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
                            rows={10}
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
    </div>
  );
};

export default OrderSpecificationSheet;
