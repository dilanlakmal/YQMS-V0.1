import {useState,useEffect} from "react";
import PropTypes from "prop-types";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { cleanup } from "../../../../utils/measurementHelperFunction";
import QCWashingValidation from "./QCWashingValidation";

const OrderDetailsSection = ({
  formData,
  setFormData, 
  handleInputChange,
  fetchOrderDetailsByStyle,
  colorOptions,
  user,
  isVisible,
  onToggle,
  orderNoSuggestions,
  showOrderNoSuggestions,
  setShowOrderNoSuggestions, 
  colorOrderQty,
  activateNextSection,
  setRecordId,
  setSavedSizes,
  onLoadSavedDataById,
  onWashingValidationChange,
}) => {

  const handleReportTypeChange = async (value) => {
    // Handle unchecking SOP or selecting other types
    if (value === '' || value === 'Inline') {
      setFormData(prev => ({
        ...prev,
        reportType: value,
        ironingQty: '', // Clear ironing qty when unchecking SOP
        firstOutput: '',
        inline: value === 'Inline' ? value : ''
      }));
      return;
    }
    
    // If switching to a type that needs AQL details from the 'first-output' endpoint
    if (value === 'SOP' || value === 'First Output') {
      if (!formData.orderNo) {
        Swal.fire('Missing Order No', 'Please enter an Order Number before selecting this report type.', 'warning');
        return;
      }
  
      try {
        const response = await fetch(`${API_BASE_URL}/api/after-ironing/first-output-details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNo: formData.orderNo }),
        });
        const data = await response.json();
  
        if (data.success) {
          setFormData(prev => ({
            ...prev,
            reportType: value,
            ironingQty: value === 'SOP' ? '30' : data.checkedQty,
            checkedQty: data.checkedQty,
            aql: [data.aqlData],
            firstOutput: value,
            inline: ''
          }));
        } else {
          throw new Error(data.message || 'Failed to fetch AQL details.');
        }
      } catch (error) {
        console.error('Error fetching first output details:', error);
        Swal.fire('Error', `Could not fetch AQL details: ${error.message}`, 'error');
      }
    }
  };

  useEffect(() => {
    // If the factory is changed to something other than YM,
    // and the current report type is SOP, reset the report type.
    if (formData.factoryName !== 'YM' && formData.reportType === 'SOP') {
      setFormData(prev => ({
        ...prev,
        reportType: '', // Reset report type
        ironingQty: '',    // Clear the fixed ironing quantity
        firstOutput: '',
        inline: ''
      }));
    }
  }, [formData.factoryName, formData.reportType, setFormData]);

  const handleOrderNoChange = (e) => {
    const newOrderNo = e.target.value;
    handleInputChange("orderNo", newOrderNo);
    // Check for existing record if color is already selected and order number is complete
    if (formData.color && newOrderNo && newOrderNo.length >= 3) {
      // Debounce the check to avoid too many API calls while typing
      clearTimeout(window.orderNoCheckTimeout);
      window.orderNoCheckTimeout = setTimeout(() => {
        checkExistingRecord(newOrderNo, formData.color);
      }, 1000);
    }
  };

  const handleOrderNoBlur = () => {
    setTimeout(() => {
      setShowOrderNoSuggestions(false);
      fetchOrderDetailsByStyle(formData.orderNo);
      // Fetch AQL data for SOP report type
      if (formData.orderNo && formData.reportType === 'SOP') {
        handleReportTypeChange('SOP');
      }
      // Check for existing record if both order and color are available
      if (formData.orderNo && formData.color) {
        setTimeout(() => checkExistingRecord(formData.orderNo, formData.color), 300);
      }
    }, 150);
  };

  const checkExistingRecord = async (orderNo, color) => {
    if (!orderNo || !color || !user?.emp_id || isCheckingExistingRecord) return;
    
    // Don't check if we're already loading data or if washing validation is in progress
    if (document.querySelector('.swal2-container')) return;
    
    setIsCheckingExistingRecord(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/after-ironing/find-existing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNo: orderNo,
          color: color,
          factoryName: 'YM',
          reportType: 'SOP',
          before_after_wash: 'After Ironing',
          inspectorId: user.emp_id
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.exists && data.record) {
        const result = await Swal.fire({
          title: 'Record Already Exists',
          text: `This record is already saved in the After Ironing collection. Do you want to edit this existing record?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, Edit Record',
          cancelButtonText: 'No, Clear Fields',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
        
        if (result.isConfirmed) {
          // Load the existing record data
          if (onLoadSavedDataById && data.record._id) {
            onLoadSavedDataById(data.record._id);
          }
        } else if (result.isDismissed) {
          // Clear order number and color
          handleInputChange("orderNo", "");
          handleInputChange("color", "");
        }
      }
    } catch (error) {
      console.error('Error checking existing record:', error);
      // Don't show error to user as this is a background check
    } finally {
      setIsCheckingExistingRecord(false);
    }
  };

  const handleOrderNoFocus = () => {
    if (orderNoSuggestions.length > 0) {
      setShowOrderNoSuggestions(true);
    }
  };

  const handleSuggestionClick = (selectedOrder) => {
    handleInputChange("orderNo", selectedOrder);
    fetchOrderDetailsByStyle(selectedOrder);
    setShowOrderNoSuggestions(false);
    // Fetch AQL data for SOP report type
    if (formData.reportType === 'SOP') {
      setTimeout(() => {
        handleReportTypeChange('SOP');
      }, 100);
    }
    // Check for existing record if color is already selected
    if (formData.color) {
      setTimeout(() => checkExistingRecord(selectedOrder, formData.color), 200);
    }
  };

  const [washingValidationPassed, setWashingValidationPassed] = useState(true);
  const [isCheckingExistingRecord, setIsCheckingExistingRecord] = useState(false);

  // Handle QC Washing validation result
  const handleValidationResult = (isValid, record) => {
    const isWashingNotCompleted = record?.error === 'WASHING_NOT_COMPLETED';
    setWashingValidationPassed(isValid);
    onWashingValidationChange?.(isValid);

    if (!isValid && isWashingNotCompleted) {
      // Clear order and color if washing is not completed
      handleInputChange("orderNo", "");
      handleInputChange("color", "");
    }
  };

  const loadSavedSizes = async (orderNo, color) => {
    try {
      const response = await fetch(
       `${API_BASE_URL}/api/after-ironing/saved-sizes/${orderNo}/${encodeURIComponent(color)}`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.success) {
        setSavedSizes(data.savedSizes || []);
      }
    } catch (error) {
      console.error("Error loading saved sizes:", error);
      setSavedSizes([]);
    }
  };

   useEffect(() => {
    if (formData.orderNo && formData.color) loadSavedSizes(formData.orderNo, formData.color);
  }, [formData.orderNo, formData.color]);

  // Auto-fetch AQL data when order is available and report type is SOP
  useEffect(() => {
    if (formData.orderNo && formData.reportType === 'SOP' && (!formData.aql || !formData.aql[0] || !formData.aql[0].sampleSize)) {
      handleReportTypeChange('SOP');
    }
  }, [formData.orderNo, formData.reportType]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (window.orderNoCheckTimeout) {
        clearTimeout(window.orderNoCheckTimeout);
      }
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Order Details</h2>
        <button 
          onClick={onToggle}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
         {isVisible && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 dark:text-white">
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">MoNo:</label>
            <div className="relative flex-1">
              <input
                type="text"
                value={formData.orderNo}
                onChange={handleOrderNoChange}
                onBlur={handleOrderNoBlur}
                onFocus={handleOrderNoFocus}
                placeholder="Enter Order No to search"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {showOrderNoSuggestions && formData.orderNo && orderNoSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                  {orderNoSuggestions.map((order, index) => (
                    <li
                      key={index}
                      onMouseDown={() => handleSuggestionClick(order)}
                      className="px-3 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                    >
                      {order}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Date:</label>
            <input 
              type="date" 
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Order QTY:</label>
            <input 
              type="number" 
              value={formData.orderQty}
              onChange={(e) => handleInputChange('orderQty', e.target.value)}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              style={{opacity: 1, color: 'inherit'}}
            />
          </div>
          
         <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Color:</label>
            <select
              value={formData.color}
              onChange={(e) => {
                const newColor = e.target.value;
                handleInputChange('color', newColor);
                // Check for existing record when both order and color are selected
                if (formData.orderNo && newColor) {
                  setTimeout(() => checkExistingRecord(formData.orderNo, newColor), 100);
                }
              }}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">-- Select Color --</option>
              {colorOptions && colorOptions.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
            {colorOrderQty !== null && (
              <span
                className="ml-2 flex items-center px-3 py-1 rounded-full font-semibold text-gray-800 bg-yellow-100 border border-yellow-300 dark:bg-yellow-700 dark:text-yellow-100 dark:border-yellow-600"
                style={{ minWidth: 60 }}
                title="Total order quantity for selected color"
              >
                <span className="mr-1 text-xs font-medium text-gray-600 dark:text-yellow-50">Color Qty:</span>
                {colorOrderQty}
              </span>
            )}
          </div>
          
         <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Ironing Type:</label>
             <input 
              type="text" 
              value="Normal"
              readOnly
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              style={{opacity: 1, color: 'inherit'}}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Factory Name:</label>
              <input 
              type="text" 
              value= "YM"
              readOnly
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              style={{opacity: 1, color: 'inherit'}}
            />
          </div>
         <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Buyer:</label>
            <input 
              type="text" 
              value={formData.buyer}
              onChange={(e) => handleInputChange('buyer', e.target.value)}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white cursor-not-allowed"
              style={{ opacity: 1, color: "inherit" }}
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Report Type:</label>
            <input 
              type="text" 
              value="SOP"
              readOnly
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              style={{opacity: 1, color: 'inherit'}}
            />
          </div>  
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Before/After Iron:</label>
            <input
              type="text"
              value="After Ironing"
              readOnly
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              style={{opacity: 1, color: 'inherit'}}
            />
          </div>         
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Iron Qty:</label>
            <input 
              type="number" 
              value="30"
              readOnly
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              style={{opacity: 1, color: 'inherit'}}
            />
          </div>
        </div>
      )}
      
      {/* QC Washing Validation */}
      {isVisible && formData.orderNo && (
        <QCWashingValidation 
          orderNo={formData.orderNo}
          color={formData.color}
          onValidationResult={handleValidationResult}
        />
      )}
      
      {/* Block other sections if washing validation fails */}
      {isVisible && formData.orderNo && !washingValidationPassed && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900 dark:border-red-700">
          <p className="text-red-800 dark:text-red-200 text-sm font-medium">
            ⚠️ Cannot proceed with After Ironing inspection until QC Washing is completed for this order.
          </p>
        </div>
      )}
  
    </div>
  );
};

OrderDetailsSection.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  fetchOrderDetailsByStyle: PropTypes.func.isRequired,
  colorOptions: PropTypes.array,
  user: PropTypes.object,
  isVisible: PropTypes.bool,
  onToggle: PropTypes.func,
  orderNoSuggestions: PropTypes.array,
  showOrderNoSuggestions: PropTypes.bool,
  setShowOrderNoSuggestions: PropTypes.func,
  colorOrderQty: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  activateNextSection: PropTypes.func,
  setRecordId: PropTypes.func,
  setSavedSizes: PropTypes.func,
  onLoadSavedDataById: PropTypes.func,
  onWashingValidationChange: PropTypes.func,
};

export default OrderDetailsSection;