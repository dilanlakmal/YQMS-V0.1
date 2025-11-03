import {useState,useEffect} from "react";
import PropTypes from "prop-types";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { sanitize } from "../../../../../backend/helpers/helperFunctions.js";

const OrderDetailsSection = ({
  formData,
  setFormData, 
  handleInputChange,
  fetchOrderDetailsByStyle,
  colorOptions,
  subFactories,
  user,
  isVisible,
  onToggle,
  styleSuggestions,
  fetchMatchingStyles,
  setStyleSuggestions,
  orderNumbers,
  filterOrderNumbers,
  // filteredOrderNumbers,
  orderNoSuggestions,
  showOrderNoSuggestions,
  setShowOrderNoSuggestions, 
  colorOrderQty,
  activateNextSection,
  setRecordId,
  setSavedSizes,
  onLoadSavedDataById,
  isSaved: externalIsSaved,
  setIsSaved: setExternalIsSaved,
}) => {
  // const [isSaved, setIsSaved] = useState(false);
  const isSaved = externalIsSaved || false;
  const setIsSaved = setExternalIsSaved || (() => {});

  const handleReportTypeChange = async (value) => {
    // If switching to a type that needs AQL details from the 'first-output' endpoint
    if (value === 'SOP' || value === 'First Output') {
      if (!formData.orderNo) {
        Swal.fire('Missing Order No', 'Please enter an Order Number before selecting this report type.', 'warning');
        return;
      }
  
      try {
        const response = await fetch(`${API_BASE_URL}/api/qc-washing/first-output-details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNo: formData.orderNo }),
        });
        const data = await response.json();
  
        if (data.success) {
          setFormData(prev => ({
            ...prev,
            reportType: value,
            washQty: value === 'SOP' ? 30 : '',
            checkedQty: data.checkedQty,
            aql: [data.aqlData],
            firstOutput: value === 'First Output' ? value : '',
            inline: ''
          }));
        } else {
          throw new Error(data.message || 'Failed to fetch AQL details.');
        }
      } catch (error) {
        console.error('Error fetching first output details:', error);
        Swal.fire('Error', `Could not fetch AQL details: ${error.message}`, 'error');
      }
    } else { // For 'Inline' or when unchecking
      setFormData(prev => ({
        ...prev,
        reportType: value,
        washQty: (prev.reportType === 'SOP' || prev.reportType === 'First Output') ? '' : prev.washQty,
        firstOutput: '',
        inline: value === 'Inline' ? value : ''
      }));
    }
  };

  useEffect(() => {
    // If the factory is changed to something other than YM,
    // and the current report type is SOP, reset the report type.
    if (formData.factoryName !== 'YM' && formData.reportType === 'SOP') {
      setFormData(prev => ({
        ...prev,
        reportType: '', // Reset report type
        washQty: '',    // Clear the fixed wash quantity
        firstOutput: '',
        inline: ''
      }));
    }
  }, [formData.factoryName, formData.reportType, setFormData]);

   const checkMeasurementDetails = async (orderNo) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/qc-washing/check-measurement-details/${orderNo}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error checking measurement details:', error);
    return { success: false, hasMeasurement: false };
  }
};


  // Function to clear the form
  const clearForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      orderNo: "",
      style: "",
      orderQty: "",
      checkedQty: "",
      color: "",
      washQty: "",
      washType: "Normal Wash",
      firstOutput: "",
      inline: "",
      reportType: "",
      buyer: "",
      factoryName: "YM",
      before_after_wash: "After Wash",
      result: "",
      aql: [{
        sampleSize: "",
        acceptedDefect: "",
        rejectedDefect: "",
        levelUsed: "",
      }],
      inspectionDetails: {},
      defectDetails: {
        checkedQty: "",
        washQty: "",
        result: "",
        defectsByPc: [],
        additionalImages: [],
        comment: "",
      },
      measurementDetails: [],
      totalCheckedPcs: 0,
      rejectedDefectPcs: 0,
      totalDefectCount: 0,
      defectRate: 0,
      defectRatio: 0,
      overallFinalResult: "N/A",
    });
    
    // Clear other related states if needed
    if (setSavedSizes) setSavedSizes([]);
    if (setRecordId) setRecordId(null);
    setIsSaved(false);
  };
  
const handleSave = async () => {
  try {
    // Check for required fields
    const requiredFields = [
      { field: 'orderNo', label: 'Order Number' },
      { field: 'color', label: 'Color' },
      { field: 'reportType', label: 'Report Type' }
    ];

    // Check basic required fields first
    for (const { field, label } of requiredFields) {
      if (!formData[field]) {
        Swal.fire({
          icon: 'warning',
          title: `Missing ${label}`,
          text: `Please enter ${label} before saving.`,
          confirmButtonText: 'OK'
        });
        return;
      }
    }

    // Special handling for washQty - check existing record if missing
    if (!formData.washQty) {
      // First check if there's an existing record for this user
      const uniqueKey = {
        orderNo: formData.orderNo,
        date: formData.date,
        color: formData.color,
        washType: formData.washType,
        before_after_wash: formData.before_after_wash,
        factoryName: formData.factoryName,
        reportType: formData.reportType,
        inspectorId: user?.emp_id 
      };

      const checkRes = await fetch(`${API_BASE_URL}/api/qc-washing/find-existing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uniqueKey)
      });
      const checkData = await checkRes.json();

      if (checkData.success && checkData.exists) {
        // Load existing record
        const result = await Swal.fire({
          icon: 'info',
          title: 'Existing record found',
          text: 'Found an existing record. Do you want to load it for editing?',
          showCancelButton: true,
          confirmButtonText: 'Yes, load record',
          cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
          const record = checkData.record;
          setFormData({
            ...formData,
            ...record,
          });
          setRecordId(record._id);
          setIsSaved(true);

          // Load the existing record data
          if (onLoadSavedDataById) {
            await onLoadSavedDataById(record._id);
          }

          // Activate all sections when order details are saved/loaded
          if (activateNextSection) activateNextSection();

          Swal.fire({
            icon: 'success',
            title: 'Existing record loaded for editing.',
            showConfirmButton: false,
            timer: 1500,
            position: 'top-end',
            toast: true
          });
          return;
        } else {
          return; // User cancelled
        }
      } else {
        // No existing record found and washQty is missing
        Swal.fire({
          icon: 'warning',
          title: 'Missing Wash Quantity',
          text: 'Please enter Estimate Wash Qty before saving.',
          confirmButtonText: 'OK'
        });
        return;
      }
    }

    // Check measurement details
    const measurementCheck = await checkMeasurementDetails(formData.orderNo);
   
    if (!measurementCheck.success || !measurementCheck.hasMeasurement) {
      const result = await Swal.fire({
        icon: 'error',
        title: 'No Measurement Details Found',
        text: `No measurement details are available for MoNo: ${formData.orderNo}. Please ensure measurement data exists before proceeding.`,
        confirmButtonText: 'OK',
        showCancelButton: false
      });
      if (result.isConfirmed) {
        clearForm();
      }
      return;
    }

    // Check for existing record (this is now redundant if washQty was missing, but kept for other cases)
    const uniqueKey = {
      orderNo: formData.orderNo,
      date: formData.date,
      color: formData.color,
      washType: formData.washType,
      before_after_wash: formData.before_after_wash,
      factoryName: formData.factoryName,
      reportType: formData.reportType,
      inspectorId: user?.emp_id 
    };

    const checkRes = await fetch(`${API_BASE_URL}/api/qc-washing/find-existing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uniqueKey)
    });
    const checkData = await checkRes.json();
   
    if (checkData.success && checkData.exists) {
      const result = await Swal.fire({
        icon: 'info',
        title: 'Order details already saved',
        text: 'Do you want to edit the existing record?',
        showCancelButton: true,
        confirmButtonText: 'Yes, edit',
        cancelButtonText: 'No, cancel'
      });
     
      if (result.isConfirmed) {
        const record = checkData.record;
        setFormData({
          ...formData,
          ...record,
        });
        setRecordId(record._id);
        setIsSaved(true);
       
        // Load the existing record data
        if (onLoadSavedDataById) {
          await onLoadSavedDataById(record._id);
        }
       
        // Activate all sections when order details are saved/loaded
        if (activateNextSection) activateNextSection();
       
        Swal.fire({
          icon: 'success',
          title: 'Existing record loaded for editing.',
          showConfirmButton: false,
          timer: 1500,
          position: 'top-end',
          toast: true
        });
        return;
      } else if (result.isDismissed) {
        // User clicked "No, cancel" or closed the popup
        clearForm();
       
        // Optional: Show a brief message that the form was cleared
        Swal.fire({
          icon: 'info',
          title: 'Form cleared',
          showConfirmButton: false,
          timer: 1000,
          position: 'top-end',
          toast: true
        });
        return;
      }
    }

    // Save as new record
    const saveData = {
      formData: {
        ...formData,
        colorOrderQty: colorOrderQty
      },
      userId: user?.emp_id,
      savedAt: new Date().toISOString(),
    };

    const response = await fetch(`${API_BASE_URL}/api/qc-washing/orderData-save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saveData)
    });
    const result = await response.json();
   
    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'Data saved successfully!',
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });
     
      setIsSaved(true);
     
      // Activate all sections when order details are saved
      if (activateNextSection) activateNextSection();
     
      if (result.id && setRecordId) {
        setRecordId(result.id);
        // Auto-save inspection data to create the default checklist and other sections.
        await autoSaveInspectionData(result.id);
        // After auto-saving, reload the data to update the UI with the new checklist
        if (onLoadSavedDataById) {
          await onLoadSavedDataById(result.id);
        }
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: result.message || "Failed to save data",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: "Failed to save data",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      position: 'top-end',
      toast: true
    });
    console.error("Save error:", error);
  }
};

// Auto-save inspection data - get ALL data from existing collection endpoint
const autoSaveInspectionData = async (recordId) => {
  try {
    // Fetch ALL checkpoint data from the existing QCWashingCheckpoints collection
    let standardInspectionData = [];
    let checkpointInspectionData = [];
    
    try {
      const checkpointResponse = await fetch(`${API_BASE_URL}/api/qc-washing-checklist`);
      const checkpointResult = await checkpointResponse.json();
      
      if (Array.isArray(checkpointResult)) {
        checkpointResult.forEach(checkpoint => {
          // ALL data from the collection goes to checkpointInspectionData
          // Add main checkpoint
          const defaultOption = checkpoint.options.find(opt => opt.isDefault);
          let defaultRemark = '';
          
          if (defaultOption?.hasRemark && defaultOption?.remark) {
            defaultRemark = typeof defaultOption.remark === 'object' 
              ? defaultOption.remark.english || ''
              : defaultOption.remark || '';
          }
          
          checkpointInspectionData.push({
            id: `main_${checkpoint._id}`,
            checkpointId: checkpoint._id,
            type: 'main',
            name: checkpoint.name,
            optionType: checkpoint.optionType,
            options: checkpoint.options,
            decision: defaultOption?.name || '',
            remark: defaultRemark,
            comparisonImages: []
          });
          
          // Add subpoints
          checkpoint.subPoints?.forEach(subPoint => {
            const defaultSubOption = subPoint.options.find(opt => opt.isDefault);
            let defaultSubRemark = '';
            
            if (defaultSubOption?.hasRemark && defaultSubOption?.remark) {
              defaultSubRemark = typeof defaultSubOption.remark === 'object'
                ? defaultSubOption.remark.english || ''
                : defaultSubOption.remark || '';
            }
            
            checkpointInspectionData.push({
              id: `sub_${checkpoint._id}_${subPoint.id}`,
              checkpointId: checkpoint._id,
              subPointId: subPoint.id,
              type: 'sub',
              name: subPoint.name,
              parentName: checkpoint.name,
              optionType: subPoint.optionType,
              options: subPoint.options,
              decision: defaultSubOption?.name || '',
              remark: defaultSubRemark,
              comparisonImages: []
            });
          });
        });
      }
    } catch (error) {
      console.error("Error fetching checkpoint data:", error);
    }

    // Keep standardInspectionData empty since all inspection points are now in the checkpoint collection
    // No separate standard inspection points endpoint needed

    // Create default defect data with calculated pass rate
    const washQtyNum = Number(formData.washQty) || 0;
    const defaultDefectData = [
      {
        parameter: "Color Shade 01",
        checkedQty: washQtyNum,
        failedQty: 0,
        passRate: washQtyNum > 0 ? ((washQtyNum - 0) / washQtyNum * 100).toFixed(2) : "0.00",
        result: "Pass",
        remark: ""
      },
      {
        parameter: "Appearance",
        checkedQty: washQtyNum,
        failedQty: 0,
        passRate: washQtyNum > 0 ? ((washQtyNum - 0) / washQtyNum * 100).toFixed(2) : "0.00",
        result: "Pass",
        remark: ""
      }
    ];

    // Create default machine status with "OK" status (timeCool and timeHot disabled by default)
    const defaultMachineStatus = {
      "Washing Machine": {
        temperature: { ok: true, no: false },
        time: { ok: true, no: false },
        silicon: { ok: true, no: false },
        softener: { ok: true, no: false }
      },
      "Tumble Dry": {
        temperature: { ok: true, no: false },
        timeCool: { ok: false, no: false },
        timeHot: { ok: false, no: false }
      }
    };

    // Get standard values for the wash type
    let defaultStandardValues = {
      "Washing Machine": { temperature: "", time: "", silicon: "", softener: "" },
      "Tumble Dry": { temperature: "", timeCool: "", timeHot: "" }
    };

    let defaultActualValues = {
      "Washing Machine": { temperature: "", time: "", silicon: "", softener: "" },
      "Tumble Dry": { temperature: "", timeCool: "", timeHot: "" }
    };

    // Fetch standard values for the wash type
    try {
      const standardResponse = await fetch(`${API_BASE_URL}/api/qc-washing/standards`);
      const standardData = await standardResponse.json();
      
      if (standardData.success) {
        const standardRecord = standardData.data.find(
          (record) => record.washType === formData.washType
        );
        
        if (standardRecord) {
          const sWM = standardRecord.washingMachine || {};
          const sTD = standardRecord.tumbleDry || {};
          const toStringOrEmpty = (val) => (val === null || val === undefined ? "" : String(val));

          defaultStandardValues = {
            "Washing Machine": {
              temperature: toStringOrEmpty(sWM.temperature),
              time: toStringOrEmpty(sWM.time),
              silicon: toStringOrEmpty(sWM.silicon),
              softener: toStringOrEmpty(sWM.softener)
            },
            "Tumble Dry": {
              temperature: toStringOrEmpty(sTD.temperature),
              timeCool: toStringOrEmpty(sTD.timeCool),
              timeHot: toStringOrEmpty(sTD.timeHot)
            }
          };
          
          // Set actual values. For timeCool/timeHot, they are empty because the switch is off.
          defaultActualValues = {
            "Washing Machine": { ...defaultStandardValues["Washing Machine"] },
            "Tumble Dry": { ...defaultStandardValues["Tumble Dry"], timeCool: "", timeHot: "" }
          };
        }
      }
    } catch (error) {
      console.error("Error fetching standard values:", error);
    }

    // Build FormData for inspection save
    const formDataForInspection = new FormData();
    formDataForInspection.append("recordId", recordId);
    formDataForInspection.append("inspectionData", JSON.stringify(standardInspectionData)); // Empty array
    formDataForInspection.append("processData", JSON.stringify({}));
    formDataForInspection.append("defectData", JSON.stringify(defaultDefectData));
    formDataForInspection.append("standardValues", JSON.stringify(defaultStandardValues));
    formDataForInspection.append("actualValues", JSON.stringify(defaultActualValues));
    formDataForInspection.append("machineStatus", JSON.stringify(defaultMachineStatus));
    formDataForInspection.append("checkpointInspectionData", JSON.stringify(checkpointInspectionData)); // All from existing endpoint
    formDataForInspection.append("timeCoolEnabled", JSON.stringify(false));
    formDataForInspection.append("timeHotEnabled", JSON.stringify(false));

    // Send to backend
    const response = await fetch(`${API_BASE_URL}/api/qc-washing/inspection-save`, {
      method: "POST",
      body: formDataForInspection
    });

    const result = await response.json();
    if (result.success) {
      console.log("Inspection data auto-saved successfully - all checkpoint data from existing collection");
    } else {
      console.error("Failed to auto-save inspection data:", result.message);
    }
  } catch (error) {
    console.error("Error auto-saving inspection data:", error);
  }
};

  const handleOrderNoChange = (e) => {
    handleInputChange("orderNo", e.target.value);
    // Suggestions are fetched and visibility is set in parent's handleInputChange
  };

  const handleOrderNoBlur = () => {
    // A small delay to allow click on suggestion to register before hiding
    setTimeout(() => {
      setShowOrderNoSuggestions(false);
      fetchOrderDetailsByStyle(formData.orderNo); // Fetch details after selection or blur
    }, 150);
  };

  const handleOrderNoFocus = () => {
    // Show suggestions again if input is focused and there are suggestions
    if (orderNoSuggestions.length > 0) {
      setShowOrderNoSuggestions(true);
    }
  };

  const handleSuggestionClick = (selectedOrder) => {
    handleInputChange("orderNo", selectedOrder);
    fetchOrderDetailsByStyle(selectedOrder);
    setShowOrderNoSuggestions(false); // Hide suggestions immediately on click
  };
  // Load saved measurement sizes
  const loadSavedSizes = async (orderNo, color) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/saved-sizes/${orderNo}/${encodeURIComponent(sanitize(color))}`
      );

      if (!response.ok) {
        // setSavedSizes([]);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setSavedSizes(data.savedSizes || []);
        // console.log("Loaded saved sizes:", data.savedSizes);
      }
    } catch (error) {
      console.error("Error loading saved sizes:", error);
      setSavedSizes([]);
    }
  };

   useEffect(() => {
    if (formData.orderNo && formData.color) loadSavedSizes(formData.orderNo, formData.color);
  }, [formData.orderNo, formData.color]);


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
                disabled={isSaved}
              />
              {showOrderNoSuggestions && formData.orderNo && orderNoSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                  {orderNoSuggestions.map((order, index) => (
                    <li
                      key={index}
                      onMouseDown={() => handleSuggestionClick(order)}
                      className="px-3 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                       disabled={isSaved}
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
               disabled={isSaved}
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
               disabled={isSaved}
            />
          </div>
          
         <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Color:</label>
            <select
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
               disabled={isSaved}
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
            <label className="w-20 text-sm font-medium dark:text-gray-300">Washing Type:</label>
            <select
              value={formData.washType}
              onChange={(e) => handleInputChange("washType", e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
               disabled={isSaved}
            >
              <option value="Normal Wash">Normal</option>
              <option value="Acid Wash">Acid</option>
              <option value="Garment Dye">Garment Dye</option>
              <option value="Soft Wash">Soft</option>
              <option value="Garment Dye + Acid Wash"> Garment Dye + Acid </option>
            </select>
          </div>
          
          
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Factory Name:</label>
              <select
                value={formData.factoryName}
                onChange={e => setFormData(prev => ({ ...prev, factoryName: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaved}
              >
                
                {subFactories.map(factory => (
                  <option key={factory} value={factory}>
                    {factory}
                  </option>
                ))}
              </select>

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
               disabled={isSaved}
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Report Type:</label>
            <div className="flex space-x-4">
              {formData.factoryName === 'YM' && (
                <label className="flex items-center dark:text-gray-300">
                  <input
                    type="checkbox"
                    name="reportType"
                    value="SOP"
                    checked={formData.reportType === 'SOP'}
                    onChange={(e) => handleReportTypeChange(e.target.value)}
                    className="mr-2 dark:bg-gray-700 checked:bg-indigo-500 dark:border-gray-600"
                    disabled={isSaved}
                  />
                  SOP
                </label>
              )}
              <label className="flex items-center dark:text-gray-300">
                <input
                  type="checkbox"
                  name="reportType"
                  value="First Output"
                  checked={formData.reportType === 'First Output'}
                  onChange={(e) => handleReportTypeChange(e.target.value)}
                  className="mr-2 dark:bg-gray-700 checked:bg-indigo-500 dark:border-gray-600"
                  disabled={isSaved}
                />
                First Output
              </label>
              <label className="flex items-center dark:text-gray-300">
                <input
                  type="checkbox"
                  name="reportType"
                  value="Inline"
                  checked={formData.reportType === 'Inline'}
                  onChange={(e) => handleReportTypeChange(e.target.value)}
                  className="mr-2 dark:bg-gray-700 checked:bg-indigo-500 dark:border-gray-600"
                  disabled={isSaved}
                />
                Inline
              </label>
              
            </div>
          </div>  
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Befor/After Wash:</label>
            <select
              value={formData.before_after_wash || 'After Wash'}
              onChange={(e) => handleInputChange('before_after_wash', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
               disabled={isSaved}
            >
              <option value="Before Wash">Before</option>
              <option value="After Wash">After</option>
            </select>
          </div>         
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Estimate Wash Qty:</label>
            <input
              type="number"
              value={formData.washQty}
              onChange={e => handleInputChange('washQty', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              min={0}
               disabled={isSaved || formData.reportType === 'SOP'}
            />
          </div>
        </div>
      )}
      <div className="flex justify-end mt-4">
            <button
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              onClick={handleSave}
              disabled={isSaved}
            >
              Save
            </button>
          </div>
    </div>
  );
};
OrderDetailsSection.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  fetchOrderDetailsByStyle: PropTypes.func.isRequired,
  colorOptions: PropTypes.array,
  subFactories: PropTypes.array,
  user: PropTypes.object,
  isVisible: PropTypes.bool,
  onToggle: PropTypes.func,
  styleSuggestions: PropTypes.array,
  fetchMatchingStyles: PropTypes.func,
  setStyleSuggestions: PropTypes.func,
  orderNumbers: PropTypes.array,
  filterOrderNumbers: PropTypes.func,
  orderNoSuggestions: PropTypes.array,
  showOrderNoSuggestions: PropTypes.bool,
  setShowOrderNoSuggestions: PropTypes.func,
  colorOrderQty: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  activateNextSection: PropTypes.func,
  setRecordId: PropTypes.func,
  setSavedSizes: PropTypes.func,
  onLoadSavedDataById: PropTypes.func,
};

export default OrderDetailsSection;
