import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../components/authentication/AuthContext";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../config";
import OrderDetailsSection from "../components/inspection/qcWashing/Home/OrderDetailsSection";
import InspectionDataSection from "../components/inspection/qcWashing/Home/InspectionDataSection";
import Swal from "sweetalert2";
import DefectDetailsSection from "../components/inspection/qcWashing/Home/DefectDetailsSection";
import MeasurementDetailsSection from "../components/inspection/qcWashing/Home/MeasurementDetailsSection";
import SummaryCard from "../components/inspection/qcWashing/Home/SummaryCard";
import imageCompression from 'browser-image-compression';

const QCWashingPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderNo: '',
    style: '',
    orderQty: '',
    checkedQty: '',
    color: '',
    washQty: '',
    washingType: 'Normal Wash',
    firstOutput: false,
    inline: false,
    buyer: '',
    factoryName: 'YM',
    result: 'pass',
    aqlSampleSize: '',
    aqlAcceptedDefect: '',
    aqlRejectedDefect: ''
  });
  
  const [subFactories, setSubFactories] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [styleSuggestions, setStyleSuggestions] = useState([]);
  const [orderNumbers, setOrderNumbers] = useState([]);
  const [filteredOrderNumbers, setFilteredOrderNumbers] = useState([]);
  const [masterChecklist, setMasterChecklist] = useState([]);
  const [inspectionData, setInspectionData] = useState([]);
  
  const [processData, setProcessData] = useState({
    temperature: '',
    time: '',
    chemical: ''
  });
  
  const [defectData, setDefectData] = useState([
    { parameter: 'Color Shade 01', ok: true, no: false, qty: '', defectPercent: '', remark: '' },
    { parameter: 'Color Shade 02', ok: true, no: false, qty: '', defectPercent: '', remark: '' },
    { parameter: 'Color Shade 03', ok: true, no: false, qty: '', defectPercent: '', remark: '' },
    { parameter: 'Hand Feel', ok: true, no: false, qty: '', defectPercent: '', remark: '' },
    { parameter: 'Effect', ok: true, no: false, qty: '', defectPercent: '', remark: '', checkboxes: { All: false, A: false, B: false, C: false, D: false, E: false, F: false, G: false, H: false, I: false, J: false } },
    { parameter: 'Measurement', ok: true, no: false, qty: '', defectPercent: '', remark: '' },
    { parameter: 'Appearance', ok: true, no: false, qty: '', defectPercent: '', remark: '' },
    
  ]);
  
  // State for new Defect Details section
  const [defectOptions, setDefectOptions] = useState([]);
  const [addedDefects, setAddedDefects] = useState([]);
  const [selectedDefect, setSelectedDefect] = useState('');
  const [defectQty, setDefectQty] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const imageInputRef = useRef(null);

  const [comment, setComment] = useState('');
  const [signatures, setSignatures] = useState({
    agreedBy: '',
    reportedBy: '',
    reportedTo: ''
  });
  
  const [sectionVisibility, setSectionVisibility] = useState({
    orderDetails: true,
    inspectionData: false,
    defectDetails: false,
    measurementDetails: false
  });

  // Auto-save states
  const [autoSaveId, setAutoSaveId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimeoutRef = useRef(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  
  // Measurement tracking
  const [savedSizes, setSavedSizes] = useState([]);
  const [measurementData, setMeasurementData] = useState([]);
  const [showMeasurementTable, setShowMeasurementTable] = useState(true);

  const toggleSection = (section) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    fetchSubFactories();
    fetchWashingDefects();
    fetchOrderNumbers();
    fetchChecklist();
  }, []);

  // Auto-save effect
  useEffect(() => {
     // Prevent auto-saving while data is being loaded for a new order number.
    if (isDataLoading) {
      return;
    }

    if (formData.orderNo || formData.style) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveData();
      }, 3000); // Auto-save after 3 seconds of inactivity
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, inspectionData, processData, defectData, addedDefects, comment, signatures, measurementData, isDataLoading]);

  // Load saved data when order number changes
  useEffect(() => {
    if (formData.orderNo) {
      // Clear any pending auto-save before loading new data
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      loadSavedData(formData.orderNo);
    }
  }, [formData.orderNo]);

  // Load saved measurement sizes when order details change
  useEffect(() => {
    if (formData.orderNo && formData.color) {
      loadSavedSizes(formData.orderNo, formData.color);
    }
  }, [formData.orderNo, formData.color]);

  // Calculate checked qty when AQL data is loaded and wash qty exists
  useEffect(() => {
    if (formData.inline && formData.aqlSampleSize && formData.washQty) {
      calculateCheckedQty(formData.washQty);
    }
  }, [formData.aqlSampleSize, formData.inline]);

  const initializeInspectionData = (checklist = []) => {
    if (!Array.isArray(checklist)) return [];
    return checklist.map(item => ({
      checkedList: item.name,
      approvedDate: '',
      na: false,
      remark: ''
    }));
  };

  const fetchChecklist = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing-checklist`);
      const data = await response.json();
      setMasterChecklist(data);
      setInspectionData(initializeInspectionData(data));
    } catch (error) {
      console.error('Error fetching washing checklist:', error);
    }
  };

  const fetchSubFactories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subcon-factories`);
      const data = await response.json();
      setSubFactories(data);
    } catch (error) {
      console.error('Error fetching factories:', error);
    }
  };

  const fetchWashingDefects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing-defects`);
      const data = await response.json();
      setDefectOptions(data);
    } catch (error) {
      console.error('Error fetching washing defects:', error);
    }
  }

  const fetchOrderNumbers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing/order-numbers`);
      const data = await response.json();
      if (data.success) {
        setOrderNumbers(data.orderNumbers || []);
        setFilteredOrderNumbers(data.orderNumbers || []);
      }
    } catch (error) {
      console.error('Error fetching order numbers:', error);
    }
  };

  const filterOrderNumbers = (searchTerm) => {
    if (!searchTerm) {
      setFilteredOrderNumbers(orderNumbers);
      return;
    }
    const filtered = orderNumbers.filter(orderNo => 
      orderNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOrderNumbers(filtered);
  };

  const fetchMatchingStyles = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setStyleSuggestions([]);
      return;
    }
    try {
      // You may need to create this endpoint on your backend.
      const response = await fetch(`${API_BASE_URL}/api/qc-washing/styles/search/${searchTerm}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStyleSuggestions(data.styles || []);
        } else {
          setStyleSuggestions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching matching styles:', error);
      setStyleSuggestions([]);
    }
  };

  const fetchOrderDetailsByStyle = async (styleNo) => {
    if (!styleNo) {
      // Clear related fields if styleNo is cleared
      setColorOptions([]);
      setFormData(prev => ({
        ...prev,
        color: '',
        orderQty: '',
        buyer: ''
      }));
      setStyleSuggestions([]);
      return;
    }

    try {
      // First try to fetch by style number
      let response = await fetch(`${API_BASE_URL}/api/qc-washing/order-details-by-style/${styleNo}`);
      let data = await response.json();

      // If not found by style, try to fetch by order number
      if (!data.success) {
        response = await fetch(`${API_BASE_URL}/api/qc-washing/order-details-by-order/${styleNo}`);
        data = await response.json();
      }

      if (data.success) {
        setColorOptions(data.colors || []);
        setFormData(prev => ({
          ...prev,
          orderQty: data.orderQty || '',
          buyer: data.buyer || '',
          // Set the first color as default, or clear it if no colors are available
          color: data.colors && data.colors.length > 0 ? data.colors[0] : ''
        }));
        
        // Check if there's saved data for this order
        if (data.orderNo) {
          loadSavedData(data.orderNo);
        }
      } else {
        // Handle API-level errors (e.g., style not found)
        throw new Error(data.message || 'Style/Order not found');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Swal.fire('Error', `Could not fetch details for: ${styleNo}. Please check the Style No or Order No.`, 'error');
      setColorOptions([]);
      setFormData(prev => ({ ...prev, color: '', orderQty: '', buyer: '' }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newState = { ...prev, [field]: value };
      // When one checkbox is checked, uncheck the other.
      if (field === 'firstOutput' && value) {
        newState.inline = false;
      }
      if (field === 'inline' && value) {
        newState.firstOutput = false;
      }
      return newState;
    });
    
    // Handle async operations after state update
    if (field === 'inline' && value && (formData.orderNo || formData.style) && formData.washQty) {
      setTimeout(() => fetchAQLData(formData.orderNo || formData.style, formData.washQty), 100);
    }
    if (field === 'washQty' && value) {
      setTimeout(() => {
        if (formData.inline) {
          fetchAQLData(formData.orderNo || formData.style, value);
          calculateCheckedQty(value);
        }
      }, 100);
    }
  };

  // Fetch AQL data for inline daily field
  const fetchAQLData = async (orderNo, washQty) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/aql-chart/find`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'general',
          level: 'II',
          orderNo: orderNo,
          lotSize: parseInt(washQty) || 0
        })
      });
      
      const data = await response.json();
      if (data.success && data.aqlData) {
        setFormData(prev => ({
          ...prev,
          aqlSampleSize: data.aqlData.sampleSize.toString(),
          aqlAcceptedDefect: data.aqlData.acceptedDefect.toString(),
          aqlRejectedDefect: data.aqlData.rejectedDefect.toString()
        }));
      }
    } catch (error) {
      console.error('Error fetching AQL data:', error);
    }
  };

  // Calculate checked qty based on wash qty and AQL data
  const calculateCheckedQty = (washQty) => {
    setTimeout(() => {
      setFormData(prev => {
        if (prev.aqlSampleSize && washQty) {
          const checkedQty = Math.min(parseInt(washQty), parseInt(prev.aqlSampleSize));
          return { ...prev, checkedQty: checkedQty.toString() };
        }
        return prev;
      });
    }, 100);
  };

  const handleInspectionChange = (index, field, value) => {
    setInspectionData(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleDefectChange = (index, field, value) => {
    setDefectData(prev => prev.map((item, i) => {
      if (i === index) {
        if (field === 'ok' && value) {
          return { ...item, ok: true, no: false, qty: '', defectPercent: '' };
        } else if (field === 'no' && value) {
          return { ...item, ok: false, no: true };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleCheckboxChange = (index, checkbox, value) => {
    setDefectData(prev => prev.map((item, i) => 
      i === index ? { ...item, checkboxes: { ...item.checkboxes, [checkbox]: value } } : item
    ));
  };

  const handleAddDefect = () => {
    if (!selectedDefect || !defectQty) {
      Swal.fire('Incomplete', 'Please select a defect and enter a quantity.', 'warning');
      return;
    }

    const defectExists = addedDefects.some(d => d.defectId === selectedDefect);
    if (defectExists) {
      Swal.fire('Duplicate', 'This defect has already been added.', 'error');
      return;
    }

    const defectDetails = defectOptions.find(d => d._id === selectedDefect);
    setAddedDefects(prev => [...prev, {
      defectId: defectDetails._id,
      defectName: defectDetails.english,
      qty: parseInt(defectQty, 10)
    }]);

    // Reset inputs
    setSelectedDefect('');
    setDefectQty('');
  };

  const handleDeleteDefect = (defectId) => {
    setAddedDefects(prev => prev.filter(d => d.defectId !== defectId));
  };

  // Auto-save functionality - always save data for editing
  const autoSaveData = async () => {
    if (!formData.orderNo && !formData.style) return;
    
    try {
      const saveData = {
        formData,
        inspectionData,
        processData,
        defectData,
        addedDefects,
        uploadedImages: uploadedImages.map(img => ({ name: img.name, preview: img.preview })),
        comment,
        signatures,
        measurementDetails: measurementData,
        savedAt: new Date().toISOString(),
        userId: user?.emp_id
      };

      const response = await fetch(`${API_BASE_URL}/api/qc-washing/auto-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setAutoSaveId(result.id);
        setLastSaved(new Date());
        console.log('Auto-saved successfully');
      } else {
        console.error('Auto-save failed:', result.message);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Load saved data - check both auto-save and submitted records
  const loadSavedData = async (orderNo) => {
    try {
      // First try to load auto-saved data
      const autoSaveResponse = await fetch(`${API_BASE_URL}/api/qc-washing/load-saved/${orderNo}`);
      
      if (autoSaveResponse.ok) {
        const autoSaveData = await autoSaveResponse.json();
        
        if (autoSaveData.success && autoSaveData.savedData) {
          const saved = autoSaveData.savedData;
          
          // Set form data
          setFormData(prev => ({ ...prev, ...saved.formData }));
          
          // Set inspection data with proper structure
          if (saved.inspectionData && saved.inspectionData.length > 0) {
            setInspectionData(saved.inspectionData);
            } else if (masterChecklist.length > 0) {
            setInspectionData(initializeInspectionData(masterChecklist));
          }
          
          // Set process data
          if (saved.processData) {
            setProcessData(saved.processData);
          }
          
          // Set defect data with proper structure
          if (saved.defectData && saved.defectData.length > 0) {
            setDefectData(saved.defectData);
          }
          
          // Set added defects
          if (saved.addedDefects) {
            setAddedDefects(saved.addedDefects);
          }
          
          // Set comment
          setComment(saved.comment || '');
          
          // Set measurement data
          const measurementDetails = saved.measurementDetails || [];
          setMeasurementData(measurementDetails);
          setShowMeasurementTable(true);
          
          setAutoSaveId(saved._id);
          if (saved.savedAt) {
            setLastSaved(new Date(saved.savedAt));
          }
          
          console.log('Loaded auto-saved data for order:', orderNo);
          return;
        }
      }
 
      // If no auto-save found, try to load submitted data
      const submittedResponse = await fetch(`${API_BASE_URL}/api/qc-washing/load-submitted/${orderNo}`);
      
      if (submittedResponse.ok) {
        const submittedData = await submittedResponse.json();
        
        if (submittedData.success && submittedData.data) {
          const saved = submittedData.data;
          
          // Set form data
          setFormData(prev => ({ 
            ...prev, 
            orderNo: saved.orderNo,
            style: saved.orderNo,
            orderQty: saved.color?.orderDetails?.orderQty || '',
            color: saved.color?.orderDetails?.color || '',
            washingType: saved.color?.orderDetails?.washingType || 'Normal Wash',
            firstOutput: saved.color?.orderDetails?.daily || false,
            inline: saved.color?.orderDetails?.daily || false,
            buyer: saved.color?.orderDetails?.buyer || '',
            factoryName: saved.color?.orderDetails?.factoryName || 'YM',
            checkedQty: saved.color?.defectDetails?.checkedQty || '',
            washQty: saved.color?.defectDetails?.washQty || ''
          }));
          
          // Transform and set inspection data
          const transformedInspectionData = saved.color?.inspectionDetails?.checkedPoints?.map(point => ({
            checkedList: point.pointName,
            approvedDate: point.approvedDate || '',
            na: point.condition === 'N/A',
            remark: point.remark || ''
          })) || [];
          
          if (transformedInspectionData.length > 0) {
            setInspectionData(transformedInspectionData);
            } else if (masterChecklist.length > 0) {
            setInspectionData(initializeInspectionData(masterChecklist));
          }
          
          // Set process data
          setProcessData({
            temperature: saved.color?.inspectionDetails?.temp || '',
            time: saved.color?.inspectionDetails?.time || '',
            chemical: saved.color?.inspectionDetails?.chemical || ''
          });
          
          // Transform and set defect data
          const transformedDefectData = saved.color?.inspectionDetails?.parameters?.map(param => ({
            parameter: param.parameterName,
            ok: param.status === 'ok',
            no: param.status === 'no',
            qty: param.qty || '',
            remark: param.remark || '',
            checkboxes: param.checkboxes || {}
          })) || [];
          
          if (transformedDefectData.length > 0) {
            setDefectData(transformedDefectData);
          }
          
          // Transform and set added defects
          const transformedAddedDefects = saved.color?.defectDetails?.defects?.map(defect => ({
            defectId: defect._id || '',
            defectName: defect.defectName,
            qty: defect.defectQty
          })) || [];
          
          setAddedDefects(transformedAddedDefects);
          setComment(saved.color?.defectDetails?.comment || '');
          setMeasurementData(saved.color?.measurementDetails || []);
          setShowMeasurementTable(true);
          
          console.log('Loaded submitted data for order:', orderNo);
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  // Load saved measurement sizes
  const loadSavedSizes = async (orderNo, color) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing/saved-sizes/${orderNo}/${color}`);
      
      if (!response.ok) {
        setSavedSizes([]);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSavedSizes(data.savedSizes || []);
        console.log('Loaded saved sizes:', data.savedSizes);
      }
    } catch (error) {
      console.error('Error loading saved sizes:', error);
      setSavedSizes([]);
    }
  };

  // Handle measurement size save with nested structure
  const handleSizeSubmit = async (transformedSizeData) => {
    try {
      // Add to measurement data immediately
      setMeasurementData(prev => {
        const existingIndex = prev.findIndex(item => item.size === transformedSizeData.size);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = transformedSizeData;
          return updated;
        } else {
          return [...prev, transformedSizeData];
        }
      });
      
      setSavedSizes(prev => {
        if (!prev.includes(transformedSizeData.size)) {
          return [...prev, transformedSizeData.size];
        }
        return prev;
      });
      
      // Always show measurement table for next size selection
      setShowMeasurementTable(true);
      
      Swal.fire('Success', 'Size data saved successfully!', 'success');
      
      // Trigger auto-save to include the new measurement data
      setTimeout(() => autoSaveData(), 500);
    } catch (error) {
      console.error('Error saving size:', error);
      Swal.fire('Error', 'Failed to save size data', 'error');
    }
  };

  // Handle measurement data edit
  const handleMeasurementEdit = (size = null) => {
    setShowMeasurementTable(true);
    if (size) {
      // Remove the size from saved sizes to allow editing
      setSavedSizes(prev => prev.filter(s => s !== size));
      // Remove from measurement data to allow re-entry
      setMeasurementData(prev => prev.filter(item => item.size !== size));
    }
  };

  // Handle measurement value changes for auto-save
  const handleMeasurementChange = (newMeasurementValues) => {
    // Trigger auto-save when measurement values change
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveData();
    }, 2000); // Auto-save after 2 seconds of measurement input
  };
    const handleRemoveImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > 5) {
      Swal.fire('Limit Exceeded', 'You can only upload a maximum of 5 images.', 'warning');
      return;
    }

    const options = {
      maxSizeMB: 0.5, // Compress to max 500KB
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    Swal.fire({
      title: 'Compressing images...',
      text: 'Please wait.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    for (const file of files) {
      try {
        const compressedFile = await imageCompression(file, options);
        const preview = URL.createObjectURL(compressedFile);
        setUploadedImages(prev => [...prev, { file: compressedFile, preview, name: compressedFile.name }]);
      } catch (error) {
        console.error('Image compression failed:', error);
        Swal.fire('Error', 'Failed to compress image.', 'error');
      }
    }
    Swal.close();
  };

  const PageTitle = () => (
    <div className="text-center">
      <h1 className="text-xl md:text-2xl font-bold text-indigo-700 tracking-tight">
        Yorkmars (Cambodia) Garment MFG Co., LTD
      </h1>
      <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 md:mt-1">
        QC Washing
        {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-2 sm:p-4 md:p-6">
      <header className="bg-gradient-to-r from-slate-50 to-gray-100 shadow-lg py-5 px-8">
        <PageTitle />
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        
        <SummaryCard 
          inspectionData={inspectionData}
          defectData={defectData}
          measurementData={measurementData}
          showMeasurementTable={showMeasurementTable}
        />
        
        <OrderDetailsSection 
          formData={formData}
          handleInputChange={handleInputChange}
          fetchOrderDetailsByStyle={fetchOrderDetailsByStyle}
          colorOptions={colorOptions}
          subFactories={subFactories}
          user={user}
          isVisible={sectionVisibility.orderDetails}
          onToggle={() => toggleSection('orderDetails')}
          styleSuggestions={styleSuggestions}
          fetchMatchingStyles={fetchMatchingStyles}
          setStyleSuggestions={setStyleSuggestions}
          orderNumbers={filteredOrderNumbers}
          filterOrderNumbers={filterOrderNumbers}
        />

        <InspectionDataSection 
          inspectionData={inspectionData}
          handleInspectionChange={handleInspectionChange}
          processData={processData}
          setProcessData={setProcessData}
          defectData={defectData}
          handleDefectChange={handleDefectChange}
          handleCheckboxChange={handleCheckboxChange}
          isVisible={sectionVisibility.inspectionData}
          onToggle={() => toggleSection('inspectionData')}
        />

        <DefectDetailsSection 
          formData={formData}
          handleInputChange={handleInputChange}
          defectOptions={defectOptions}
          addedDefects={addedDefects}
          setAddedDefects={setAddedDefects}
          selectedDefect={selectedDefect}
          setSelectedDefect={setSelectedDefect}
          defectQty={defectQty}
          setDefectQty={setDefectQty}
          uploadedImages={uploadedImages}
          setUploadedImages={setUploadedImages}
          comment={comment}
          setComment={setComment}
          isVisible={sectionVisibility.defectDetails}
          onToggle={() => toggleSection('defectDetails')}
        />

        <MeasurementDetailsSection 
          orderNo={formData.style}
          color={formData.color}
          isVisible={sectionVisibility.measurementDetails}
          onToggle={() => toggleSection('measurementDetails')}
          savedSizes={savedSizes}
          onSizeSubmit={handleSizeSubmit}
          measurementData={measurementData}
          showMeasurementTable={showMeasurementTable}
          onMeasurementEdit={handleMeasurementEdit}
          onMeasurementChange={handleMeasurementChange}
        />

        {/* Auto-save status */}
        {lastSaved && (
          <div className="text-center text-sm text-gray-600">
            Last auto-saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button 
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            onClick={() => {
              // Reset form but keep auto-saved data available
              if (autoSaveId) {
                Swal.fire({
                  title: 'Reset Form?',
                  text: 'This will clear all current data. Auto-saved data will remain available.',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Reset'
                }).then((result) => {
                  if (result.isConfirmed) {
                    // Reset all states to initial values
                    setFormData({
                      date: new Date().toISOString().split('T')[0],
                      orderNo: '',
                      style: '',
                      orderQty: '',
                      checkedQty: '',
                      color: '',
                      washQty: '',
                      washingType: 'Normal Wash',
                      firstOutput: false,
                      inline: false,
                      buyer: '',
                      factoryName: 'YM',
                      result: 'pass',
                      aqlSampleSize: '',
                      aqlAcceptedDefect: '',
                      aqlRejectedDefect: ''
                    });
                    setInspectionData(initializeInspectionData(masterChecklist));
                    setProcessData({ temperature: '', time: '', chemical: '' });
                    setDefectData([
                      { parameter: 'Color Shade 01', ok: true, no: false, qty: '', defectPercent: '', remark: '' },
                      { parameter: 'Color Shade 02', ok: true, no: false, qty: '', defectPercent: '', remark: '' },
                      { parameter: 'Color Shade 03', ok: true, no: false, qty: '', defectPercent: '', remark: '' },
                      { parameter: 'Hand Feel', ok: true, no: false, qty: '', defectPercent: '', remark: '' },
                      { parameter: 'Effect', ok: true, no: false, qty: '', defectPercent: '', remark: '', checkboxes: { All: false, A: false, B: false, C: false, D: false, E: false, F: false, G: false, H: false, I: false, J: false } },
                      { parameter: 'Measurement', ok: true, no: false, qty: '', defectPercent: '', remark: '' },
                      { parameter: 'Appearance', ok: true, no: false, qty: '', defectPercent: '', remark: '' }
                    ]);
                    setAddedDefects([]);
                    setUploadedImages([]);
                    setComment('');
                    setSignatures({ agreedBy: '', reportedBy: '', reportedTo: '' });
                    setMeasurementData([]);
                    setShowMeasurementTable(true);
                  }
                });
              }
            }}
          >
            Reset
          </button>
          <button 
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            onClick={async () => {
              try {
                const submitData = {
                  formData,
                  inspectionData,
                  processData,
                  defectData,
                  addedDefects,
                  uploadedImages,
                  comment,
                  signatures,
                  measurementDetails: measurementData,
                  submittedAt: new Date().toISOString(),
                  userId: user?.emp_id
                };

                const response = await fetch(`${API_BASE_URL}/api/qc-washing/submit`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(submitData)
                });

                const result = await response.json();
                if (result.success) {
                  Swal.fire('Success', 'QC Washing data submitted successfully!', 'success');
                  // Auto-save is automatically cleared by backend on submit
                  setAutoSaveId(null);
                  setLastSaved(null);
                  
                  // Reset form after successful submission
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
                } else {
                  Swal.fire('Error', result.message || 'Failed to submit data', 'error');
                }
              } catch (error) {
                console.error('Submit error:', error);
                Swal.fire('Error', 'Failed to submit data', 'error');
              }
            }}
          >
            Submit
          </button>
        </div>
      </main>
    </div>
  );
};

export default QCWashingPage;
