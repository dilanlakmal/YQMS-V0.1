import React, { useState, useRef, useCallback } from 'react';
import { Upload, Save, Download, FileText, Calendar, User, Building, Search, Loader } from 'lucide-react';
import DrawingCanvas from '../../../components/inspection/YDT/drowingCanvas.jsx';
import { useAuth } from '../../../components/authentication/AuthContext';
import { API_BASE_URL } from '../../../../config.js';

const SketchTechnicalSheet = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  
  // ✅ NEW: Order search states
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderSuggestions, setOrderSuggestions] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [justSelected, setJustSelected] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    // Header information
    styleId: '',
    shortDesc: '',
    department: '',
    initialDcDate: new Date().toISOString().split('T')[0],
    commodity: '',
    season: '',
    vendor3d: 'No',
    
    // Style details
    styleStatus: 'In Work',
    longDescription: '',
    
    // Approval and sizing
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
    
    // ✅ NEW: Order-related fields
    orderNo: '',
    buyerEngName: '',
    custStyle: '',
    orderQty: ''
  });

  // Image states
  const [mainSketchImage, setMainSketchImage] = useState(null);
  const [secondaryImage, setSecondaryImage] = useState(null);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);

  // ✅ NEW: Debounce function for search
  const debounce = useCallback((func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }, []);

  // ✅ NEW: Fetch order suggestions using your existing backend
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

  // ✅ NEW: Debounced search function
  const debouncedSearch = useCallback(
    debounce(fetchOrderSuggestions, 300),
    [debounce]
  );

  // ✅ NEW: Fetch order details using your existing backend
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

  // ✅ NEW: Handle order search with debouncing
  React.useEffect(() => {
    if (orderSearchTerm && !justSelected) { 
      debouncedSearch(orderSearchTerm);
    } else if (!orderSearchTerm) {
      setOrderSuggestions([]);
      setShowSuggestions(false);
    }
  }, [orderSearchTerm, debouncedSearch, justSelected]);

  // ✅ NEW: Handle order selection and auto-populate fields
  const handleOrderSelect = useCallback(async (orderNo) => {
    setJustSelected(true);
    setShowSuggestions(false);
    
    const orderData = await fetchOrderDetails(orderNo);
    if (orderData) {
      setSelectedOrder(orderData);
      setOrderSearchTerm(orderNo);
      
      // ✅ Auto-populate form fields based on order data
      setFormData(prev => ({
        ...prev,
        orderNo: orderData.orderNo || orderNo,
        styleId: orderData.customerStyle || orderData.custStyle || '', // CustStyle goes to Style ID
        buyerEngName: orderData.engName || '', // EngName goes to buyer section
        targetUnits: orderData.quantity || orderData.totalQty || '', // Order quantity goes to target units
        custStyle: orderData.customerStyle || orderData.custStyle || '',
        orderQty: orderData.quantity || orderData.totalQty || ''
      }));
    }
    
    // Reset the justSelected flag
    // setTimeout(() => {
    //   setJustSelected(false);
    // }, 500);
  }, []);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle main image upload
  const handleMainImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMainSketchImage(e.target.result);
        setShowDrawingCanvas(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle secondary image upload
  const handleSecondaryImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setSecondaryImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle canvas save
  const handleCanvasSave = (imageData) => {
    setMainSketchImage(imageData);
  };

  // Save technical sheet
  const handleSave = async () => {
    try {
      setLoading(true);

      const dataToSave = {
        ...formData,
        mainSketchImage,
        secondaryImage,
        selectedOrderData: selectedOrder, // Include full order data
        createdBy: user?.emp_Id || user?.empId || user?.id || 'unknown',
        userInfo: {
          emp_Id: user?.emp_Id || user?.empId || user?.id,
          name: user?.name || user?.engName || user?.fullName || '',
          email: user?.email || '',
          department: user?.department || user?.dept || '',
          role: user?.role || user?.position || ''
        }
      };

      const accessToken = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE_URL}/api/technicalSheet/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(dataToSave)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        alert('Technical sheet saved successfully!');
        console.log('Saved technical sheet:', result.data);
      } else {
        throw new Error(result.message || 'Failed to save technical sheet');
      }
    } catch (error) {
      console.error('Error saving technical sheet:', error);
      alert(`Failed to save technical sheet: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Main Container */}
        <div className="bg-white border-2 border-black">
          
          {/* Top Row - Updated with Order Search */}
          <div className="grid grid-cols-12 border-b border-black">
            {/* ✅ UPDATED: Brand Logo Area with Order Search */}
            <div className="col-span-2 border-r border-black p-3 bg-gray-50 relative">
              
              {/* ✅ NEW: Order Search Section */}
              <div className="mt-2">
                <div className="text-xs font-semibold mb-1">Search Order:</div>
                <div className="relative">
                  <div className="flex items-center">
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
                      className="w-full text-xs border border-gray-300 rounded p-1 pr-6"
                    />
                    {searchLoading && (
                      <Loader className="absolute right-1 animate-spin" size={12} />
                    )}
                  </div>
                  
                  {/* Order Suggestions Dropdown */}
                  {showSuggestions && orderSuggestions.length > 0 && !justSelected && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 shadow-lg z-50 max-h-32 overflow-y-auto mt-1">
                      {orderSuggestions.map((order, index) => (
                        <div
                          key={index}
                          onClick={() => handleOrderSelect(order.orderNo)}
                          className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 text-xs"
                        >
                          <div className="font-semibold">{order.orderNo}</div>
                          <div className="text-gray-600">{order.customerStyle}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* ✅ NEW: Display Buyer Eng Name when order is selected */}
                {selectedOrder && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-ms">
                    <div className="font-semibold">Buyer:</div>
                    <div  className="font-bold">{formData.buyerEngName || 'N/A'}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Style ID - Auto-populated from CustStyle */}
            <div className="col-span-2 border-r border-black">
              <div className="grid grid-rows-2">
                <div className="border-b border-black p-1 grid grid-cols-2 text-xs">
                  <span className="font-semibold">Style ID:</span>
                  <input
                    type="text"
                    value={formData.styleId}
                    onChange={(e) => handleInputChange('styleId', e.target.value)}
                    className="border-0 outline-none bg-transparent"
                    placeholder="W02-490014"
                  />
                </div>
                <div className="p-1 grid grid-cols-2 text-xs">
                  <span className="font-semibold">Initial DC Date:</span>
                  <input
                    type="date"
                    value={formData.initialDcDate}
                    onChange={(e) => handleInputChange('initialDcDate', e.target.value)}
                    className="border-0 outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Short Description */}
            <div className="col-span-4 border-r border-black">
              <div className="grid grid-rows-2">
                <div className="border-b border-black p-1 grid grid-cols-3 text-xs">
                  <span className="font-semibold">Short Desc:</span>
                  <input
                    type="text"
                    value={formData.shortDesc}
                    onChange={(e) => handleInputChange('shortDesc', e.target.value)}
                    className="col-span-2 border-0 outline-none bg-transparent"
                    placeholder="F- DRY VISCOSE CREW NECK KNIT T-SHIRT"
                  />
                </div>
                <div className="p-1 grid grid-cols-3 text-xs">
                  <span className="font-semibold">Commodity:</span>
                  <input
                    type="text"
                    value={formData.commodity}
                    onChange={(e) => handleInputChange('commodity', e.target.value)}
                    className="col-span-2 border-0 outline-none bg-transparent"
                    placeholder="T-shirt / Cami"
                  />
                </div>
              </div>
            </div>

            {/* Department */}
            <div className="col-span-2 border-r border-black">
              <div className="grid grid-rows-2">
                <div className="border-b border-black p-1 grid grid-cols-2 text-xs">
                  <span className="font-semibold">Department:</span>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="border-0 outline-none bg-transparent"
                    placeholder="310 Womens Promo T-Shirt"
                  />
                </div>
                <div className="p-1 grid grid-cols-2 text-xs">
                  <span className="font-semibold">Season:</span>
                  <input
                    type="text"
                    value={formData.season}
                    onChange={(e) => handleInputChange('season', e.target.value)}
                    className="border-0 outline-none bg-transparent"
                    placeholder="Fall 2025 Apparel Womens RW & CO"
                  />
                </div>
              </div>
            </div>

            {/* 3D Vendor */}
            <div className="col-span-2">
              <div className="grid grid-rows-2">
                <div className="border-b border-black p-1 text-xs">
                  <div className="grid grid-cols-2">
                    <span className="font-semibold">3D Vendor:</span>
                    <select
                      value={formData.vendor3d}
                      onChange={(e) => handleInputChange('vendor3d', e.target.value)}
                      className="border-0 outline-none bg-transparent"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
                <div className="p-1">
                  {/* Empty space */}
                </div>
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-12 border-b border-black">
            {/* Style Status & Long Description */}
            <div className="col-span-2 border-r border-b border-black p-2">
              <div className="text-xs">
                <div className="mb-2">
                  <span className="font-semibold">Style Status:</span>
                  <select
                    value={formData.styleStatus}
                    onChange={(e) => handleInputChange('styleStatus', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-1 mt-1"
                  >
                    <option value="In Work">In Work</option>
                    <option value="Approved">Approved</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <span className="font-semibold">Long Description:</span>
                  <textarea
                    value={formData.longDescription}
                    onChange={(e) => handleInputChange('longDescription', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-1 mt-1"
                    rows={2}
                    placeholder="F- DRY VISCOSE CREW NECK KNIT T-SHIRT"
                  />
                </div>
              </div>
            </div>

            {/* Final Fit Approval & Fit Type */}
            <div className="col-span-2 border-r border-b border-black p-2">
              <div className="text-xs">
                <div className="mb-2">
                  <span className="font-semibold">Final Fit Approval:</span>
                  <input
                    type="text"
                    value={formData.finalFitApproval}
                    onChange={(e) => handleInputChange('finalFitApproval', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-1 mt-1"
                  />
                </div>
                <div>
                  <span className="font-semibold">Fit Type:</span>
                  <select
                    value={formData.fitType}
                    onChange={(e) => handleInputChange('fitType', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-1 mt-1"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Slim">Slim</option>
                    <option value="Loose">Loose</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Size Range & Coll 1 */}
            <div className="col-span-2 border-r border-b border-black p-2">
              <div className="text-xs">
                <div className="mb-2">
                  <span className="font-semibold">Size Range:</span>
                  <input
                    type="text"
                    value={formData.sizeRange}
                    onChange={(e) => handleInputChange('sizeRange', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-1 mt-1"
                    placeholder="XXS,XS,S,M,L,XL,XXL"
                  />
                </div>
                <div>
                  <span className="font-semibold">Coll 1:</span>
                  <input
                    type="text"
                    value={formData.coll1}
                    onChange={(e) => handleInputChange('coll1', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-1 mt-1"
                    placeholder="SEASONAL SHOP"
                  />
                </div>
              </div>
            </div>

            {/* Target Cost & Coll 2 */}
            <div className="col-span-2 border-r border-b border-black p-2">
              <div className="text-xs">
                <div className="mb-2">
                  <span className="font-semibold">Target Cost:</span>
                  <input
                    type="text"
                    value={formData.targetCost}
                    onChange={(e) => handleInputChange('targetCost', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-1 mt-1"
                    placeholder="0 USD"
                  />
                </div>
                <div>
                  <span className="font-semibold">Coll 2:</span>
                  <input
                    type="text"
                    value={formData.coll2}
                    onChange={(e) => handleInputChange('coll2', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-1 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* ✅ UPDATED: Target Units - Auto-populated from Order Qty */}
            <div className="col-span-2 border-r border-b border-black p-2">
              <div className="text-xs">
                <div className="mb-2">
                  <span className="font-semibold">Target Units:</span>
                  <input
                    type="number"
                    value={formData.targetUnits}
                    onChange={(e) => handleInputChange('targetUnits', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-1 mt-1"
                    placeholder="3200"
                  />
                  {/* Show order quantity reference */}
                  {selectedOrder && (
                    <div className="text-xs text-gray-500 mt-1">
                      Order Qty: {formData.orderQty}
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Retail Price:</span>
                  <input
                    type="text"
                    value={formData.retailPrice}
                    onChange={(e) => handleInputChange('retailPrice', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-1 mt-1"
                    placeholder="35.9 USD"
                  />
                </div>
              </div>
            </div>

            {/* # Planned Colors & Floor Set */}
            <div className="col-span-2 border-r border-b border-black p-2">
              <div className="text-xs">
                <div className="mb-2">
                  <span className="font-semibold"># Planned Colors:</span>
                  <input
                    type="number"
                    value={formData.plannedColors}
                    onChange={(e) => handleInputChange('plannedColors', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-1 mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <span className="font-semibold">Floor Set:</span>
                  <input
                    type="date"
                    value={formData.floorSet}
                    onChange={(e) => handleInputChange('floorSet', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-1 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* # of Deliv & Size Curve */}
            <div className="col-span-2 p-2 border-r ">
              <div className="text-xs">
                <div className="mb-2">
                  <span className="font-semibold"># of Deliv:</span>
                  <input
                    type="number"
                    value={formData.deliveryCount}
                    onChange={(e) => handleInputChange('deliveryCount', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-1 mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <span className="font-semibold">Size Curve:</span>
                  <input
                    type="text"
                    value={formData.sizeCurve}
                    onChange={(e) => handleInputChange('sizeCurve', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-1 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Sketch Area */}
          <div className="min-h-[600px] relative">
            <div className="p-4 bg-gray-50">
              {showDrawingCanvas ? (
                <DrawingCanvas
                  backgroundImage={mainSketchImage}
                  onSave={handleCanvasSave}
                  width={900}
                  height={550}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-[550px] border-2 border-dashed border-gray-400 flex flex-col items-center justify-center">
                  <Upload className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">Upload an image to start sketching</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Upload Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t-2 border-black p-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span>Created by: {user?.name || user?.engName || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Date: {new Date().toLocaleDateString()}</span>
                </div>
                {/* ✅ NEW: Show selected order info */}
                {selectedOrder && (
                  <div className="flex items-center gap-1">
                    <FileText size={14} />
                    <span>Order: {formData.orderNo}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  <FileText size={16} />
                  Print
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save Technical Sheet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SketchTechnicalSheet;
