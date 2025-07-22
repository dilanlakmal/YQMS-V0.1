import { useState, useEffect, useRef } from "react";
import { useAuth } from "../components/authentication/AuthContext";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../config";
import OrderDetailsSection from "../components/inspection/qc2_washing/Home/OrderDetailsSection";
import InspectionDataSection from "../components/inspection/qc2_washing/Home/InspectionDataSection";
import DefectDetailsSection from "../components/inspection/qc2_washing/Home/DefectDetailsSection";
import MeasurementDetailsSection from "../components/inspection/qc2_washing/Home/MeasurementDetailsSection";
import SummaryCard from "../components/inspection/qc2_washing/Home/SummaryCard";
import OverAllSummaryCard from "../components/inspection/qc2_washing/Home/OverAllSummaryCard";
import Swal from "sweetalert2";
import imageCompression from "browser-image-compression";
import SubmittedWashingDataPage from "../components/inspection/qc2_washing/Home/SubmittedWashingData";

function transformDefectsByPc(savedDefectsByPc) {
  const normalizeImageSrc = (src) => {
    if (!src) return "";
    return src.startsWith("data:") || src.startsWith("/storage/")
      ? src
      : `data:image/jpeg;base64,${src}`;
  };

  if (Array.isArray(savedDefectsByPc)) {
    // Array from backend
    return savedDefectsByPc.reduce((acc, pcData) => {
      const pcNumber = pcData.pcNumber;
      if (pcNumber) {
        acc[pcNumber] = (pcData.pcDefects || []).map((defect, index) => ({
          id: index + 1,
          selectedDefect: defect.defectName || defect.selectedDefect || "",
          defectQty: defect.defectQty || "",
          isBodyVisible: true,
          defectImages: (defect.defectImages || []).map(imgStr => ({
            file: null,
            preview: normalizeImageSrc(imgStr),
            name: "image.jpg"
          }))
        }));
      }
      return acc;
    }, {});
  }
  // Already an object
  if (typeof savedDefectsByPc === "object" && savedDefectsByPc !== null) {
    const result = {};
    Object.keys(savedDefectsByPc).forEach(pc => {
      result[pc] = (savedDefectsByPc[pc] || []).map((defect, index) => ({
        id: defect.id || index + 1,
        selectedDefect: defect.defectName || defect.selectedDefect || "",
        defectQty: defect.defectQty || "",
        isBodyVisible: defect.isBodyVisible !== undefined ? defect.isBodyVisible : true,
        defectImages: (defect.defectImages || []).map(imgStr => ({
          file: null,
          preview: normalizeImageSrc(imgStr),
          name: "image.jpg"
        }))
      }));
    });
    return result;
  }
  return {};
}

function normalizeImagePreview(img) {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object" && img.preview) {
    // If img.preview is a string, return it. If it's an object, return its .preview property.
    return typeof img.preview === "string" ? img.preview : (img.preview.preview || "");
  }
  return "";
}



const QCWashingPage = () => {
  // Hooks
  const { user } = useAuth();

  // State: Form Data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    orderNo: "",
    style: "",
    orderQty: "",
    checkedQty: "",
    color: "",
    washQty: "",
    washingType: "Normal Wash",
    firstOutput: "",
    inline: "",
    daily: "",
    buyer: "",
    factoryName: "YM",
    reportType: "Before Wash",
    result: "",
    aqlSampleSize: "",
    aqlAcceptedDefect: "",
    aqlRejectedDefect: "",
    aqlLevelUsed: "", 
    colors: [
      {
        colorName: "",
        orderDetails: {},
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
      },
    ],
    totalCheckedPcs: 0,
    rejectedDefectPcs: 0,
    totalDefectCount: 0,
    defectRate: 0,
    defectRatio: 0,
    overallFinalResult: "N/A",
  });

  // State: Data Lists
  const [subFactories, setSubFactories] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [orderNoSuggestions, setOrderNoSuggestions] = useState([]); 
  const [showOrderNoSuggestions, setShowOrderNoSuggestions] = useState(false); 
  const [orderNumbers, setOrderNumbers] = useState([]);
  const [styleSuggestions, setStyleSuggestions] = useState([]);
  const [filteredOrderNumbers, setFilteredOrderNumbers] = useState([]);
  const [masterChecklist, setMasterChecklist] = useState([]);
  const [defectOptions, setDefectOptions] = useState([]);
  const [activeTab, setActiveTab] = useState('newInspection');

  // State: Inspection, Defect, Measurement
  const [inspectionData, setInspectionData] = useState([]);
  const [processData, setProcessData] = useState({ machineType: "", temperature: "", time: "", chemical: "" });
  const defaultDefectData = [
    { parameter: "Color Shade 01", ok: true, no: false, qty: "", defectPercent: "", remark: "" },
    { parameter: "Color Shade 02", ok: true, no: false, qty: "", defectPercent: "", remark: "" },
    { parameter: "Color Shade 03", ok: true, no: false, qty: "", defectPercent: "", remark: "" },
    { parameter: "Hand Feel", ok: true, no: false, qty: "", defectPercent: "", remark: "" },
    {
      parameter: "Effect", ok: true, no: false, qty: "", defectPercent: "", remark: "",
      checkboxes: { All: false, A: false, B: false, C: false, D: false, E: false, F: false, G: false, H: false, I: false, J: false }
    },
    { parameter: "Measurement", ok: true, no: false, qty: "", defectPercent: "", remark: "" },
    { parameter: "Appearance", ok: true, no: false, qty: "", defectPercent: "", remark: "" },
  ];
  const [defectData, setDefectData] = useState(normalizeDefectData(defaultDefectData));
  function normalizeDefectData(data) {
  return (data || []).map(param => ({
    ...param,
    parameter: param.parameter || param.parameterName || "",
    ok: param.ok !== undefined ? param.ok : true,
    no: param.no !== undefined ? param.no : false,
    checkedQty: param.checkedQty || 0,
    failedQty: param.failedQty || 0,
    remark: param.remark || "",
    checkboxes: param.checkboxes || {},
  }));
}
  const [addedDefects, setAddedDefects] = useState([]);
  const [selectedDefect, setSelectedDefect] = useState("");
  const [defectQty, setDefectQty] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [comment, setComment] = useState("");
  const [savedSizes, setSavedSizes] = useState([]);
  const [measurementData, setMeasurementData] = useState({ beforeWash: [], afterWash: [] });
  const [showMeasurementTable, setShowMeasurementTable] = useState(true);
  const [machineType, setMachineType] = useState('Washing Machine');

  // State: UI/UX
  const [sectionVisibility, setSectionVisibility] = useState({
    orderDetails: true,
    inspectionData: false,
    defectDetails: false,
    measurementDetails: false,
  });
  const [isDataLoading, setIsDataLoading] = useState(false);

  // State: Auto-save
  const [autoSaveId, setAutoSaveId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimeoutRef = useRef(null);
  const [defectsByPc, setDefectsByPc] =  useState({});

  // State: Cache for color-specific data to prevent data loss on switching
  const [colorDataCache, setColorDataCache] = useState({});

  // Section Toggle
  const toggleSection = (section) => {
    setSectionVisibility((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper function to convert image file to Base64 or return existing preview string
  const imageToBase64 = (imageObject) => {
    if (!imageObject) {
      return Promise.resolve(null);
    }
    // If it's a File object (newly uploaded or re-selected), convert it to Base64
    if (imageObject.file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        // Add a check to ensure the file is actually a blob/file
          if (!(imageObject.file instanceof Blob)) {
            reject(new Error("Invalid file object provided."));
            return;
          }
        reader.readAsDataURL(imageObject.file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    } else if (imageObject.preview) {
      // If it's already a preview string (from loaded data), send it as is
      // This assumes the backend can identify if this preview string refers to an already-saved image
      return Promise.resolve(imageObject.preview);
    }
    return Promise.resolve(null);
  };


  // --- useEffect: Initial Data Fetch ---
  useEffect(() => {
    fetchSubFactories();
    fetchWashingDefects();
    fetchOrderNumbers();
    fetchChecklist();
  }, []);

  // --- useEffect: Auto-save ---
  useEffect(() => {
    if (isDataLoading) return;
    if (formData.orderNo || formData.style) {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = setTimeout(() => { autoSaveData(); }, 3000);
    }
    return () => { if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current); };
  }, [formData, inspectionData, processData, defectData, addedDefects, comment, measurementData, uploadedImages, defectsByPc, isDataLoading]); 

  useEffect(() => {
  // console.log("defectsByPc after load:", defectsByPc);
}, [defectsByPc]);

useEffect(() => {
  // console.log("uploadedImages after load:", uploadedImages);
}, [uploadedImages]);


  // --- useEffect: Load Saved Data on Order Change ---
  useEffect(() => {
    const identifier = formData.style && formData.style !== formData.orderNo ? formData.style : formData.orderNo;
    if (identifier) {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      loadSavedData(identifier);
    }
  }, [formData.orderNo, formData.style]);

  // --- useEffect: Load Saved Sizes on Order/Color Change ---
  useEffect(() => {
    if (formData.orderNo && formData.color) loadSavedSizes(formData.orderNo, formData.color);
  }, [formData.orderNo, formData.color]);

  // --- useEffect: Calculate Checked Qty ---
  useEffect(() => {
    if ((formData.inline === "Inline" || formData.daily === "Inline") && formData.aqlSampleSize && formData.washQty) {
      calculateCheckedQty(formData.washQty);
    }
  }, [formData.aqlSampleSize, formData.inline, formData.daily]);

   // --- useEffect: Calculate AQL Status ---
  useEffect(() => {
    if ((formData.inline === 'Inline' || formData.daily === 'Inline' || formData.firstOutput === "First Output" || formData.daily === 'First Output') && formData.aqlAcceptedDefect) {
        const totalDefects = Object.values(defectsByPc)
            .flat()
            .reduce((sum, defect) => sum + (parseInt(defect.defectQty, 10) || 0), 0);
        
        const acceptedDefectCount = parseInt(formData.aqlAcceptedDefect, 10);

        if (!isNaN(acceptedDefectCount)) {
            const newStatus = totalDefects <= acceptedDefectCount ? 'Pass' : 'Fail';
            if (newStatus !== formData.result) {
                setFormData(prev => ({ ...prev, result: newStatus }));
            }
        }
    } else {
        // If not an AQL check, reset the status
        if (formData.result) { 
            setFormData(prev => ({ ...prev, result: '' }));
        }
    }
  }, [defectsByPc, formData.aqlAcceptedDefect, formData.inline, formData.daily, formData.firstOutput, formData.result]);

  // --- Helper Functions ---
  const processMeasurementData = (loadedMeasurements) => {
    if (Array.isArray(loadedMeasurements)) {
      const beforeWash = loadedMeasurements.filter((m) => m.washType === "beforeWash");
      const afterWash = loadedMeasurements.filter((m) => m.washType === "afterWash");
      return { beforeWash, afterWash };
    }
    if (loadedMeasurements && (loadedMeasurements.beforeWash || loadedMeasurements.afterWash)) {
      return { beforeWash: loadedMeasurements.beforeWash || [], afterWash: loadedMeasurements.afterWash || [] };
    }
    return { beforeWash: [], afterWash: [] };
  };

  const initializeInspectionData = (checklist = []) => {
    if (!Array.isArray(checklist)) return [];
    return checklist.map((item) => ({
      checkedList: item.name,
      approvedDate: "",
      na: false,
      remark: "",
    }));
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

    // --- Data Fetch Functions ---
  const fetchChecklist = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing-checklist`);
      const data = await response.json();
      setMasterChecklist(data);
      setInspectionData(initializeInspectionData(data));
    } catch (error) {
      console.error("Error fetching washing checklist:", error);
    }
  };

  const fetchSubFactories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subcon-factories`);
      const data = await response.json();
      setSubFactories(data);
    } catch (error) {
      console.error("Error fetching factories:", error);
    }
  };

  const fetchWashingDefects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing-defects`);
      const data = await response.json();
      setDefectOptions(data);
    } catch (error) {
      console.error("Error fetching washing defects:", error);
    }
  };

  // Renamed and updated to use /api/search-mono for order number suggestions
  const fetchOrderNoSuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) { // Only search if at least 2 characters typed
      setOrderNoSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/search-mono?term=${searchTerm}` // Use the new endpoint
      );
      if (response.ok) {
        const data = await response.json();
        // Assuming the endpoint returns an array of order numbers directly
        setOrderNoSuggestions(data || []);
      } else {
        setOrderNoSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching order number suggestions:", error);
      setOrderNoSuggestions([]);
    }
  };

  const fetchOrderNumbers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/order-numbers`
      );
      const data = await response.json();
      if (data.success) {
        setOrderNumbers(data.orderNumbers || []);
        setFilteredOrderNumbers(data.orderNumbers || []);
      }
    } catch (error) {
      console.error("Error fetching order numbers:", error);
    }
  };

  const filterOrderNumbers = (searchTerm) => {
    if (!searchTerm) {
      setFilteredOrderNumbers(orderNumbers);
      return;
    }
    const filtered = orderNumbers.filter((orderNo) =>
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
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/styles/search/${searchTerm}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStyleSuggestions(data.styles || []);
        } else {
          setStyleSuggestions([]);
        }
      }
    } catch (error) {
      console.error("Error fetching matching styles:", error);
      setStyleSuggestions([]);
    }
  };
  

  const fetchOrderDetailsByStyle = async (orderNo) => {
    if (!orderNo) {
      // Clear related fields if styleNo is cleared
      setColorOptions([]);
      setFormData((prev) => ({
        ...prev,
        color: "",
        orderQty: "",
        buyer: "",
      }));
      setStyleSuggestions([]);
      return;
    }

    try {
      setIsDataLoading(true);

      // 1. Check if the record has already been submitted
      const submittedResponse = await fetch(
        `${API_BASE_URL}/api/qc-washing/load-submitted/${orderNo}`
      );

      if (submittedResponse.ok) {
        const submittedData = await submittedResponse.json();
        if (submittedData.success && submittedData.data) {
          Swal.fire(
            "Record Submitted",
            `The record for Order No '${orderNo}' has already been submitted and cannot be edited.`,
            "info"
          );
          // Clear the input to prevent re-triggering
          setFormData((prev) => ({ ...prev, orderNo: "", style: "" }));
          return; // Stop further processing
        }
      }

      // 2. Check for auto-saved data and load it
      const qcWashingResponse = await fetch(
        `${API_BASE_URL}/api/qc-washing/load-saved/${orderNo}`
      );

      if (qcWashingResponse.ok) {
        const qcWashingData = await qcWashingResponse.json();
        if (qcWashingData.success && qcWashingData.savedData) {
         
          const saved = qcWashingData.savedData;

          setFormData((prev) => ({
            ...prev,
            ...saved.formData,
            reportType: saved.reportType,
            date: saved.formData.date
              ? saved.formData.date.split("T")[0]
              : new Date().toISOString().split("T")[0],
            orderQty: saved?.formData.orderQty || prev.orderQty,
            buyer: saved?.formData.buyer || prev.buyer,
            aqlSampleSize: saved?.formData.aqlSampleSize || prev.aqlSampleSize,
            aqlAcceptedDefect:
              saved?.formData.aqlAcceptedDefect || prev.aqlAcceptedDefect,
            aqlRejectedDefect:
              saved?.formData.aqlRejectedDefect || prev.aqlRejectedDefect,
            aqlLevelUsed: saved?.formData.aqlLevelUsed || "",
          }));

          // Fetch all colors for the order/style, even when loading saved data
          let colorResponse = await fetch(
            `${API_BASE_URL}/api/qc-washing/order-details-by-style/${orderNo}`
          );
          let orderData = await colorResponse.json();

          if (!orderData.success) {
            colorResponse = await fetch(
              `${API_BASE_URL}/api/qc-washing/order-details-by-order/${orderNo}`
            );
            orderData = await colorResponse.json();
          }
           if (orderData.success && orderData.colors) {
            setColorOptions(orderData.colors);
          } else if (saved.formData.color) {
            // Fallback: if fetching all colors fails, at least ensure the saved color is an option
            setColorOptions((prev) =>
              prev.includes(saved.formData.color)
                ? prev
                : [...prev, saved.formData.color]
            );
          }

          if (saved.inspectionData && saved.inspectionData.length > 0) {
            setInspectionData(saved.inspectionData);
          } else if (masterChecklist.length > 0) {
            setInspectionData(initializeInspectionData(masterChecklist));
          }

          if (saved.processData) {
            setProcessData(saved.processData);
          }

          if (saved.defectData && saved.defectData.length > 0) {
            setDefectData(saved.defectData.map(param => ({
              ...param,
              parameter: param.parameter || param.parameterName || "",
              ok: param.ok !== undefined ? param.ok : true,
              no: param.no !== undefined ? param.no : false,
              checkedQty: param.checkedQty || 0,
              failedQty: param.failedQty || 0,
              remark: param.remark || "",
              checkboxes: param.checkboxes || {},
            })));
          }

          if (saved.addedDefects) {
            setAddedDefects(saved.addedDefects);
          }

          // Load defectsByPc and uploadedImages from saved data
          if (saved.defectsByPc) {
            setDefectsByPc(transformDefectsByPc(saved.defectsByPc));
          }
          if (saved.additionalImage) {
            // If images were saved as base64 or URLs, ensure they are handled correctly for display
            setUploadedImages(saved.additionalImage.map(img => ({
             file: null, 
              preview: normalizeImagePreview(img),
              name: 'image.jpg'
            })));
            }

          setComment(saved.comment || "");

          // Set measurement data
          setMeasurementData(processMeasurementData(saved.measurementDetails));
          setShowMeasurementTable(true);

          setAutoSaveId(saved._id);
          if (saved.savedAt) {
            setLastSaved(new Date(saved.savedAt));
          }
          setIsDataLoading(false);
          return;
        }
      }

      // 3. If not submitted, fetch order details from dt_orders
      let response = await fetch(
        `${API_BASE_URL}/api/qc-washing/order-details-by-style/${orderNo}`
      );
      let orderData = await response.json();

      if (!orderData.success) {
        response = await fetch(
          `${API_BASE_URL}/api/qc-washing/order-details-by-order/${orderNo}`
        );
        orderData = await response.json();
      }

      if (orderData.success) {
        setColorOptions(orderData.colors || []);
        setFormData((prev) => ({
          ...prev,
          orderQty: orderData.orderQty || "",
          buyer: orderData.buyer || "",
          color:
            prev.color ||
            (orderData.colors && orderData.colors.length > 0
              ? orderData.colors[0]
              : ""),
        }));
      } else {
        // If no order details found in dt_orders, it's a critical error.
        throw new Error(
          orderData.message || "Style/Order not found in master records."
        );
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      Swal.fire(
        "Error",
        `Could not fetch details for: ${orderNo}. Please check the Style No or Order No.`,
        "error"
      );
      setColorOptions([]);
      setFormData((prev) => ({ ...prev, color: "", orderQty: "", buyer: "" }));
    } finally {
      setIsDataLoading(false);
    }
  };

    // --- Form Handlers ---
  const handleInputChange = (field, value) => {
     // --- Fetch order suggestions ---
    if (field === "orderNo") {
      fetchOrderNoSuggestions(value);
      setShowOrderNoSuggestions(true);
    }
    // --- Cache state before changing color ---
    if (field === 'color' && value !== formData.color && formData.color) {
      const outgoingColor = formData.color;
      // Capture the current UI state for the color we are leaving
      const currentStateForColor = {
        inspectionData,
        processData,
        defectData,
        addedDefects,
        comment,
        measurementData,
        uploadedImages,
        savedSizes,
        defectsByPc, // Capture defectsByPc
        // also capture relevant form data fields
        formData: {
          washQty: formData.washQty,
          checkedQty: formData.checkedQty,
          reportType: formData.reportType,
        }
      };
      // Update the cache
      setColorDataCache(prevCache => ({ ...prevCache, [outgoingColor]: currentStateForColor }));
    }

    setFormData((prev) => {
      const newState = { ...prev, [field]: value };
      // When one checkbox is checked, uncheck the other and set daily field as string
      if (field === "firstOutput") {
        newState.inline = "";
        newState.daily = value;
        if (value === "First Output") {
          fetchFirstOutputDetails();
        }
      } else if (field === "inline") {
        newState.firstOutput = "";
        newState.daily = value;
      } else if (field === "daily") {
        if (value === "First Output") {
          newState.firstOutput = "First Output";
          newState.inline = "";
          // Call the function to fetch details for First Output
          fetchFirstOutputDetails();
        } else if (value === "Inline") {
          newState.inline = "Inline";
          newState.firstOutput = "";
        }
      }

      if (field === "daily" && value === "Inline" && formData.washQty) {
          fetchAQLData(formData.washQty);
          calculateCheckedQty(formData.washQty);
        }

      // Handle color change - reset color-specific data
      if (field === "color" && value !== prev.color) {
        if (value && (prev.orderNo || prev.style)) {
          setTimeout(
            () => loadColorSpecificData(prev.orderNo || prev.style, value),
            100
          );
        }
      }

      return newState;
    });

    // Handle async operations after state update
    if (
      field === "inline" &&
      value &&
      (formData.orderNo || formData.style) &&
      formData.washQty
    ) {
      setTimeout(() => fetchAQLData(formData.washQty), 100);
    }
    if (field === "washQty" && value) {
      setTimeout(() => {
        if (formData.inline === "Inline" || formData.daily === "Inline") {
          fetchAQLData(value);
          calculateCheckedQty(value);
        }
      }, 100);
    }
  };

  const handleInspectionChange = (index, field, value) => {
    setInspectionData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleDefectChange = (index, field, value) => {
  setDefectData(prev =>
    prev.map((item, i) => {
      if (i !== index) return item;
      if (field === "ok" && value) {
        // If Ok is selected, reset other fields and set no to false
        return { ...item, ok: true, no: false, checkedQty: 0, failedQty: 0, remark: "" };
      }
      if (field === "no" && value) {
        // If No is selected, set ok to false
        return { ...item, ok: false, no: true };
      }
      return { ...item, [field]: value };
    })
  );
};

  const handleCheckboxChange = (index, checkbox, value) => {
    setDefectData((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const newCheckboxes = { ...item.checkboxes };

          if (checkbox === "All") {
            // If 'All' is clicked, set all checkboxes to its value
            Object.keys(newCheckboxes).forEach((key) => {
              newCheckboxes[key] = value;
            });
          } else {
            // If an individual checkbox is clicked
            newCheckboxes[checkbox] = value;

            if (!value) {
              // If unchecking an individual box, uncheck 'All'
              newCheckboxes.All = false;
            } else {
              // If checking an individual box, check if all others (except 'All') are now checked
              const allOthersChecked = Object.keys(newCheckboxes)
                .filter((k) => k !== "All")
                .every((k) => newCheckboxes[k]);
              if (allOthersChecked) {
                newCheckboxes.All = true;
              }
            }
          }
          return { ...item, checkboxes: newCheckboxes };
        }
        return item;
      })
    );
  };

  // --- AQL & Checked Qty ---
  const fetchFirstOutputDetails = async () => {
    const orderNo = formData.orderNo || formData.style;
    if (!orderNo) {
      Swal.fire('Missing Order No', 'Please enter an Order No before selecting First Output.', 'warning');
      // Uncheck the box to prevent inconsistent state
      setFormData(prev => ({ ...prev, firstOutput: '', daily: '' }));
      return;
    }
    try {
      setIsDataLoading(true);
     // This endpoint must be changed to a POST on the backend to accept the orderNo
      const response = await fetch(`${API_BASE_URL}/api/qc-washing/first-output-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo: orderNo }) // Send orderNo for buyer-specific AQL
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setFormData(prev => ({
          ...prev,
          // Set the checked Qty from the database
          checkedQty: data.checkedQty.toString(),
          // Set the AQL values
          aqlSampleSize: data.aqlData.sampleSize.toString(),
          aqlAcceptedDefect: data.aqlData.acceptedDefect.toString(),
          aqlRejectedDefect: data.aqlData.rejectedDefect.toString(),
          // Wash Qty can be set to checked Qty for consistency if needed
          aqlLevelUsed: data.aqlData.aqlLevelUsed,
          washQty: data.checkedQty.toString(),
        }));
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Could not fetch First Output data',
          text: data.message || 'An unknown error occurred.',
        });
        // Clear relevant fields on failure
        setFormData(prev => ({
          ...prev,
          checkedQty: "",
          washQty: "",
          aqlSampleSize: "",
          aqlAcceptedDefect: "",
          aqlRejectedDefect: "",
           aqlLevelUsed: "",
        }));
      }
    } catch (error) {
      console.error("Error fetching First Output details:", error);
      Swal.fire('Error', 'A network error occurred while fetching First Output details.', 'error');
    } finally {
      setIsDataLoading(false);
    }
  };

   // --- AQL & Checked Qty ---
  // Fetch AQL data for inline daily field
  const fetchAQLData = async (washQty) => {
   if (!washQty) return;
    const orderNo = formData.orderNo || formData.style;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/aql-chart/find`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lotSize: parseInt(washQty) || 0,
            orderNo: orderNo,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Request failed with status ${response.status}`,
        }));
        console.error("AQL API Error:", errorData.message || "Unknown error");
        setFormData((prev) => ({
          ...prev,
          aqlSampleSize: "",
          aqlAcceptedDefect: "",
          aqlRejectedDefect: "",
          aqlLevelUsed: "",
        }));
        return;
      }

      const data = await response.json();
      if (data.success && data.aqlData) {
        setFormData((prev) => ({
          ...prev,
          aqlSampleSize: data.aqlData.sampleSize.toString(),
          aqlAcceptedDefect: data.aqlData.acceptedDefect.toString(),
          aqlRejectedDefect: data.aqlData.rejectedDefect.toString(),
          aqlLevelUsed: data.aqlData.aqlLevelUsed, 
        }));
      } else {
         setFormData((prev) => ({
          ...prev,
          aqlSampleSize: "",
          aqlAcceptedDefect: "",
          aqlRejectedDefect: "",
           aqlLevelUsed: "",
        }));
        console.warn(
          "AQL data not found:",
          data.message || "No AQL chart found for the given criteria."
        );
      }
    } catch (error) {
      console.error("Error fetching AQL data:", error);
    }
  };

  // Calculate checked qty based on wash qty and AQL data
  const calculateCheckedQty = (washQty) => {
    setTimeout(() => {
      setFormData((prev) => {
        if (prev.aqlSampleSize && washQty) {
          const checkedQty = Math.min(
            parseInt(washQty),
            parseInt(prev.aqlSampleSize)
          );
          return { ...prev, checkedQty: checkedQty.toString() };
        }
        return prev;
      });
    }, 100);
  };

  // --- Measurement ---
  // Calculate totals from Measurement Data to match the Summary Card
  const getMeasurementStats = () => {
    let totalCheckedPoints = 0;
    let totalPass = 0;

    if (measurementData && typeof measurementData === "object") {
      const allMeasurements = [
        ...(measurementData.beforeWash || []),
        ...(measurementData.afterWash || []),
      ];

      allMeasurements.forEach((data) => {
        if (data.pcs && Array.isArray(data.pcs)) {
          data.pcs.forEach((pc) => {
            if (pc.measurementPoints && Array.isArray(pc.measurementPoints)) {
              pc.measurementPoints.forEach((point) => {
                if (point.result === "pass" || point.result === "fail") {
                  totalCheckedPoints++;
                  if (point.result === "pass") {
                    totalPass++;
                  }
                }
              });
            }
          });
        }
      });
    }

    const totalFail = totalCheckedPoints - totalPass;
    const passRate = totalCheckedPoints > 0 ? Math.round((totalPass / totalCheckedPoints) * 100) : 0;
    return { totalCheckedPoint: totalCheckedPoints, totalPass, totalFail, passRate };
  };

  // Handle measurement size save with nested structure
  const handleSizeSubmit = async (transformedSizeData) => {
    try {
      const washType =
        formData.reportType === "Before Wash" ? "beforeWash" : "afterWash";

      setMeasurementData((prev) => {
        const currentArray = prev[washType];
        const existingIndex = currentArray.findIndex(
          (item) => item.size === transformedSizeData.size
        );

        if (existingIndex >= 0) {
          const updated = [...currentArray];
          updated[existingIndex] = transformedSizeData;
          return { ...prev, [washType]: updated };
        } else {
          return {
            ...prev,
            [washType]: [...currentArray, transformedSizeData],
          };
        }
      });

      setSavedSizes((prev) => {
        if (!prev.includes(transformedSizeData.size)) {
          return [...prev, transformedSizeData.size];
        }
        return prev;
      });

      setShowMeasurementTable(true);

      Swal.fire(
        "Success",
        `Size data saved successfully to ${formData.reportType}!`,
        "success"
      );

      setTimeout(() => autoSaveData(), 500);
    } catch (error) {
      console.error("Error saving size:", error);
      Swal.fire("Error", "Failed to save size data", "error");
    }
  };

  // Handle measurement data edit
  const handleMeasurementEdit = (size = null) => {
    setShowMeasurementTable(true);
    if (size) {
      setSavedSizes((prev) => prev.filter((s) => s !== size));
      const washType =
        formData.reportType === "Before Wash" ? "beforeWash" : "afterWash";
      setMeasurementData((prev) => ({
        ...prev,
        [washType]: prev[washType].filter((item) => item.size !== size),
      }));
    }
  };

  // Handle measurement value changes for auto-save
  const handleMeasurementChange = (newMeasurementValues) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveData();
    }, 2000);
  };

 // --- Image Upload ---
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > 5) {
      Swal.fire(
        "Limit Exceeded",
        "You can only upload a maximum of 5 images.",
        "warning"
      );
      return;
    }

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    Swal.fire({
      title: "Compressing images...",
      text: "Please wait.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    for (const file of files) {
      try {
        const compressedFile = await imageCompression(file, options);
        const preview = URL.createObjectURL(compressedFile);
        setUploadedImages((prev) => [
          ...prev,
          { file: compressedFile, preview, name: compressedFile.name },
        ]);
      } catch (error) {
        console.error("Image compression failed:", error);
        Swal.fire("Error", "Failed to compress image.", "error");
      }
    }
    Swal.close();
  };

  // --- Auto-save & Data Load ---
    // Auto-save functionality - always save data for editing
    const autoSaveData = async () => {
      if (!formData.orderNo && !formData.style) return;
      if (!formData.color) return;

      // Calculate stats
    const { totalCheckedPoint, totalPass, totalFail, passRate } = getMeasurementStats();

      try {
        const saveData = {
          orderNo: formData.orderNo || formData.style,
          date: formData.date,
          colorName: formData.color,
          reportType: formData.reportType,
          washQty: formData.washQty,         
          checkedQty: formData.checkedQty,   
          totalCheckedPoint,
          totalPass,
          totalFail,
          passRate,
          savedAt: new Date().toISOString(),
          userId: user?.emp_id,
          colorData: {
            orderDetails: {
              ...formData,
              inspector: {
                empId: user?.emp_id,
                name: user?.username, 
              },
            },
            inspectionDetails: {
              temp: processData.temperature,
              time: processData.time,
              chemical: processData.chemical,
              checkedPoints: inspectionData.map(item => ({
                pointName: item.checkedList,
                approvedDate: item.approvedDate,
                condition: item.na ? "N/A" : "Active", 
                remark: item.remark,
              })),
              parameters: defectData.map(item => {
                // Calculate passRate and result for each parameter
                const checkedQty = Number(item.checkedQty) || 0;
                const failedQty = Number(item.failedQty) || 0;
                const passRate = checkedQty > 0 ? (((checkedQty - failedQty) / checkedQty) * 100).toFixed(2) : '0.00';
                const result = checkedQty > 0 ? (passRate >= 90 ? 'Pass' : 'Fail') : '';
                return {
                  parameterName: item.parameter,
                  checkedQty: item.checkedQty || 0,
                  failedQty: item.failedQty || 0,
                  passRate,
                  result,
                  remark: item.remark,
                  ok: item.ok,
                  no: item.no,
                  checkboxes: item.checkboxes || {},
                };
              }),
            },
            defectDetails: {
              washQty: formData.washQty,
              checkedQty: formData.checkedQty,
              result: formData.result, 
              defectsByPc: await Promise.all(Object.entries(defectsByPc).map(
                async ([pcKey, pcDefects]) => ({
                  pcNumber: pcKey,  
                  pcDefects: await Promise.all((Array.isArray(pcDefects) ? pcDefects : []).map(async (defect) => ({
                        defectName: defect.selectedDefect,
                      defectQty: defect.defectQty,
                      defectImages: await Promise.all((defect.defectImages || []).map(img => imageToBase64(img))), // Use the new helper here
                    }))), 
                })
              )),

              comment: comment,
              additionalImages: await Promise.all(
                uploadedImages.map(img => imageToBase64(img) // Use the new helper here
              )),
            },
            measurementDetails: [
              ...measurementData.beforeWash.map((item) => ({
                ...item,
                washType: "beforeWash",
              })),
              ...measurementData.afterWash.map((item) => ({
                ...item,
                washType: "afterWash",
              })),
            ],
          },
        };

     

        const response = await fetch(
          `${API_BASE_URL}/api/qc-washing/auto-save-color`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(saveData),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setAutoSaveId(result.id);
          setLastSaved(new Date());
        } else {
          console.error("Auto-save failed:", result.message);
        }
      } catch (error) {
        // console.error("Auto-save request failed:", error);
        const errorBody = await error.response?.json().catch(() => null);
        console.error("Auto-save request failed:", {
          errorMessage: error.message,
          errorBody: errorBody,
        });
        // console.error("Auto-save failed:", error);
      }
    };

     // Function to calculate and update summary data (NEW/MODIFIED)
  // This function should be called whenever relevant data (defectDetails, measurementData) changes
  const updateSummaryData = (currentFormData) => {
    const currentDefectDetails = currentFormData.colors[0]?.defectDetails; // Assuming single color for simplicity
    const currentMeasurementData = currentFormData.colors[0]?.measurementDetails; // Assuming single color

    // Recalculate based on the logic in OverAllSummaryCard
    let calculatedMeasurementPoints = 0;
    let calculatedMeasurementPass = 0;

    if (currentMeasurementData && Array.isArray(currentMeasurementData)) {
        currentMeasurementData.forEach((data) => {
            if (data.pcs && Array.isArray(data.pcs)) {
                data.pcs.forEach((pc) => {
                    if (pc.measurementPoints && Array.isArray(pc.measurementPoints)) {
                        pc.measurementPoints.forEach((point) => {
                            if (point.result === 'pass' || point.result === 'fail') {
                                calculatedMeasurementPoints++;
                                if (point.result === 'pass') {
                                    calculatedMeasurementPass++;
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    const calculatedTotalCheckedPcs = currentDefectDetails?.checkedQty || 0;
    const calculatedWashQty = currentDefectDetails?.washQty || 0;
    const calculatedRejectedDefectPcs = currentDefectDetails?.result === "Fail" ? calculatedTotalCheckedPcs : 0;
    
    const calculatedTotalDefectCount = currentDefectDetails?.defectsByPc.reduce((sum, pc) => {
        return sum + (pc.defects ? pc.defects.length : 0);
    }, 0);

    const calculatedDefectRate =
        calculatedTotalCheckedPcs > 0
            ? ((calculatedTotalDefectCount / calculatedTotalCheckedPcs) * 100).toFixed(2)
            : 0;
    
    const calculatedDefectRatio = calculatedTotalCheckedPcs > 0 ? (calculatedTotalDefectCount / calculatedTotalCheckedPcs).toFixed(2) : 0;

    let calculatedOverallResult = "Pass";
    const measurementOverallResult = calculatedMeasurementPoints - calculatedMeasurementPass > 0 ? "Fail" : "Pass";
    const defectOverallResult = currentDefectDetails?.result || "N/A";

    if (measurementOverallResult === "Fail" || defectOverallResult === "Fail") {
      calculatedOverallResult = "Fail";
    } else if (measurementOverallResult === "Pass" && defectOverallResult === "Pass") {
      calculatedOverallResult = "Pass";
    } else {
      calculatedOverallResult = "N/A";
    }


    setFormData((prevData) => ({
      ...prevData,
      totalCheckedPcs: calculatedTotalCheckedPcs,
      rejectedDefectPcs: calculatedRejectedDefectPcs,
      totalDefectCount: calculatedTotalDefectCount,
      defectRate: parseFloat(calculatedDefectRate), // Ensure it's a number
      defectRatio: parseFloat(calculatedDefectRatio), // Ensure it's a number
      overallFinalResult: calculatedOverallResult,
    }));
  };

  // useEffect to trigger summary data update when relevant form data changes
  useEffect(() => {
    updateSummaryData(formData);
  }, [
    formData.colors[0]?.defectDetails?.checkedQty,
    formData.colors[0]?.defectDetails?.washQty,
    formData.colors[0]?.defectDetails?.result,
    formData.colors[0]?.defectDetails?.defectsByPc,
    formData.colors[0]?.measurementDetails,
  ]);

  // Load color-specific data
  const loadColorSpecificData = async (orderNo, color) => {
    // 1. Check client-side cache first to avoid data loss and unnecessary API calls
    if (colorDataCache[color]) {
      const cachedData = colorDataCache[color];
      setInspectionData(cachedData.inspectionData);
      setProcessData(cachedData.processData);
      setDefectData(cachedData.defectData);
      setAddedDefects(cachedData.addedDefects);
      setComment(cachedData.comment);
      setMeasurementData(cachedData.measurementData);
      setUploadedImages(cachedData.uploadedImages);
      setSavedSizes(cachedData.savedSizes);
      setDefectsByPc(cachedData.defectsByPc || {}); 
      setFormData(prev => ({
        ...prev,
        ...(cachedData.formData || {}) // Restore color-specific form data
      }));
      return; 
    }

    // 2. If not in cache, fetch from the server
    setIsDataLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/load-color-data/${orderNo}/${color}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.colorData) {
          const colorData = data.colorData;

          if (colorData.orderDetails) {
            setFormData(prev => {
              const newColor = colorData.orderDetails.color || color;
              const updatedColor = prev.color === newColor ? prev.color : newColor;

              return {
                ...prev,
                ...colorData.orderDetails,
                color: updatedColor,
                reportType: colorData.orderDetails.reportType || prev.reportType,
                washQty: colorData.defectDetails?.washQty || prev.washQty,
                checkedQty: colorData.defectDetails?.checkedQty || prev.checkedQty, 
              };
            });
          }
          setInspectionData(colorData.inspectionDetails?.checkedPoints?.map((point) => ({ 
              checkedList: point.pointName,
              approvedDate: point.approvedDate || "",
              na: point.condition === "N/A",
              remark: point.remark || "",
            })) || initializeInspectionData(masterChecklist));

          setProcessData(colorData.inspectionDetails ? { temperature: colorData.inspectionDetails.temp || "", time: colorData.inspectionDetails.time || "", chemical: colorData.inspectionDetails.chemical || "" } : { temperature: "", time: "", chemical: "" });

         if (colorData.inspectionDetails?.parameters && colorData.inspectionDetails.parameters.length > 0)  {
            setDefectData(normalizeDefectData(colorData.inspectionDetails.parameters));
          } else {
            setDefectData(normalizeDefectData(defaultDefectData));
          }

          setAddedDefects(colorData.defectDetails?.defects?.map(d => ({ 
            defectId: d.defectId,
            defectName: d.defectName,
            qty: d.defectQty
          })) || []);

          
        if (colorData.defectDetails?.defectsByPc) {
          setDefectsByPc(transformDefectsByPc(colorData.defectDetails.defectsByPc));
        } else {
          setDefectsByPc({});
        }
         if (colorData.defectDetails?.additionalImages) {
            setUploadedImages(
              (colorData.defectDetails.additionalImages || []).map(img => ({
                file: null,
                preview: normalizeImagePreview(img),
                name: "image.jpg"
              }))
            );
          }

          setComment(colorData.defectDetails?.comment || "");
          setMeasurementData(processMeasurementData(colorData.measurementDetails || []));
          setSavedSizes(colorData.measurementDetails ? [...new Set([...(colorData.measurementDetails.beforeWash || []).map(m => m.size), ...(colorData.measurementDetails.afterWash || []).map(m => m.size)])] : []);
          setShowMeasurementTable(true);


          if (!colorData.inspectionDetails || colorData.inspectionDetails.checkedPoints.length === 0) {
            setInspectionData(initializeInspectionData(masterChecklist));
          }

        } else {
          // console.log(`No saved data found for color "${color}". Using a clean form.`);
          setInspectionData(initializeInspectionData(masterChecklist));
          setProcessData({ machineType: "", temperature: "", time: "", chemical: "" });
          setDefectData(normalizeDefectData(defaultDefectData));

          setAddedDefects([]);
          setDefectsByPc({}); 
          setUploadedImages([]); 
          setComment("");
          setMeasurementData({ beforeWash: [], afterWash: [] });
          setSavedSizes([]);
          setShowMeasurementTable(true);
        }
      }
    } catch (error) {
      console.error("Error loading color-specific data:", error);
      Swal.fire({
        icon: "error",
        title: "Load Failed",
        text: `Could not load data for color "${color}". Please try again.`,
      });
    } finally {
      setIsDataLoading(false);
    }
  };

  // Load saved data - check both auto-save and submitted records
  const loadSavedData = async (orderNo) => {
    try {
      const autoSaveResponse = await fetch(
        `${API_BASE_URL}/api/qc-washing/load-saved/${orderNo}`
      );

      if (autoSaveResponse.ok) {
        const autoSaveData = await autoSaveResponse.json();

        if (autoSaveData.success && autoSaveData.savedData) {
          const saved = autoSaveData.savedData;

          setFormData((prev) => ({
            ...prev,
            ...saved.formData,
            reportType: saved.reportType,
            date: saved.formData.date
              ? saved.formData.date.split("T")[0]
              : new Date().toISOString().split("T")[0],
              orderQty: saved?.formData.orderQty || prev.orderQty,
              buyer: saved?.formData.buyer || prev.buyer,
              aqlSampleSize: saved?.formData.aqlSampleSize || prev.aqlSampleSize,
            aqlAcceptedDefect:
              saved?.formData.aqlAcceptedDefect || prev.aqlAcceptedDefect,
            aqlRejectedDefect:
              saved?.formData.aqlRejectedDefect || prev.aqlRejectedDefect,
            aqlLevelUsed: saved?.formData.aqlLevelUsed || "",
            
          }));

          if (saved.formData.color) {
            setColorOptions((prev) => {
              if (!prev.includes(saved.formData.color)) {
                return [...prev, saved.formData.color];
              }
              return prev;
            });
          }

          if (saved.inspectionData && saved.inspectionData.length > 0) {
            setInspectionData(saved.inspectionData);
          } else if (masterChecklist.length > 0) {
            setInspectionData(initializeInspectionData(masterChecklist));
          }

          if (saved.processData) {
            setProcessData(saved.processData);
          }

          if (saved.defectData && saved.defectData.length > 0) {
            setDefectData(normalizeDefectData(saved.defectData));
          }

          // if (saved.addedDefects) {
          //   setAddedDefects(saved.addedDefects);
          // }

         if (saved.defectDetails?.defectsByPc) {
            setDefectsByPc(transformDefectsByPc(saved.defectDetails.defectsByPc));
          } else if (saved.defectsByPc) {
            setDefectsByPc(transformDefectsByPc(saved.defectsByPc));
          } else {
            setDefectsByPc({});
          }

          if (saved.defectDetails?.additionalImages) {
            setUploadedImages(
              (saved.defectDetails.additionalImages || []).map(img => ({
                file: null,
                preview: normalizeImagePreview(img),
                name: "image.jpg"
              }))
            );
          }

          // If defectsByPc also exists under defectDetails, normalize and set it too
          if (saved.defectDetails?.defectsByPc) {
            const normalizedDefectsByPc = (saved.defectDetails.defectsByPc || []).reduce((acc, item) => {
              if (item && item.pcNumber) {
                acc[item.pcNumber] = (item.pcDefects || []).map((defect, index) => ({
                id: index + 1,
                isBodyVisible: true,
                selectedDefect: defect.defectName || defect.selectedDefect || "",
                defectQty: defect.defectQty || "",
                defectImages: (defect.defectImages || []).map(imgStr => ({
                  file: null,
                  preview: normalizeImageSrcForSaved(imgStr),
                  name: "image.jpg",
                })),
              }));
              }
              return acc;
            }, {});
            setDefectsByPc(normalizedDefectsByPc);
          }
          setComment(saved.comment || "");
          setMeasurementData(processMeasurementData(saved.measurementDetails));
          setShowMeasurementTable(true);

          setAutoSaveId(saved._id);
          if (saved.savedAt) {
            setLastSaved(new Date(saved.savedAt));
          }
          return;
        }
      }

      // If no auto-save found, try to load submitted data
      const submittedResponse = await fetch(
        `${API_BASE_URL}/api/qc-washing/load-submitted/${orderNo}`
      );

      if (submittedResponse.ok) {
        const submittedData = await submittedResponse.json();

        if (submittedData.success && submittedData.data) {
          const saved = submittedData.data;

          const dailyValue = saved.color?.orderDetails?.daily || "";
          setFormData((prev) => ({
            ...prev,
            date: saved.date
              ? saved.date.split("T")[0]
              : new Date().toISOString().split("T")[0],
            orderNo: saved.orderNo,
            style: saved.orderNo,
            orderQty: saved.color?.orderDetails?.orderQty || prev.orderQty,
            color: saved.color?.orderDetails?.color || prev.color,
            washingType:
              saved.color?.orderDetails?.washingType || "Normal Wash",
            firstOutput: dailyValue === "First Output" ? "First Output" : "",
            inline: dailyValue === "Inline" ? "Inline" : "",
            daily: dailyValue || prev.daily,
            buyer: saved.color?.orderDetails?.buyer || prev.buyer,
            factoryName: saved.color?.orderDetails?.factoryName || "YM",
            result: saved.color?.orderDetails?.result || prev.result,
            reportType: saved.reportType || saved.color?.orderDetails?.reportType || prev.reportType,
            washQty: saved.washQty || saved.color?.defectDetails?.washQty || prev.washQty,
            checkedQty: saved.checkedQty || saved.color?.defectDetails?.checkedQty || prev.checkedQty,
            aqlSampleSize:
              saved.color?.orderDetails?.aqlSampleSize || prev.aqlSampleSize,
            aqlAcceptedDefect:
              saved.color?.orderDetails?.aqlAcceptedDefect ||
              prev.aqlAcceptedDefect,
            aqlRejectedDefect:
              saved.color?.orderDetails?.aqlRejectedDefect ||
              prev.aqlRejectedDefect,
          }));

          // Merge saved color with existing color options
          if (saved.color?.orderDetails?.color) {
            setColorOptions((prev) => {
              if (!prev.includes(saved.color.orderDetails.color)) {
                return [...prev, saved.color.orderDetails.color];
              }
              return prev;
            });
          }

          const transformedInspectionData =
            saved.color?.inspectionDetails?.checkedPoints?.map((point) => ({
              checkedList: point.pointName,
              approvedDate: point.approvedDate || "",
              na: point.condition === "N/A",
              remark: point.remark || "",
            })) || [];

          if (transformedInspectionData.length > 0) {
            setInspectionData(transformedInspectionData);
          } else if (masterChecklist.length > 0) {
            setInspectionData(initializeInspectionData(masterChecklist));
          }

          setProcessData({
            temperature: saved.color?.inspectionDetails?.temp || "",
            time: saved.color?.inspectionDetails?.time || "",
            chemical: saved.color?.inspectionDetails?.chemical || "",
          });

          const transformedDefectData =
            normalizeDefectData(saved.color?.inspectionDetails?.parameters) || [];
          if (transformedDefectData.length > 0) {
            setDefectData(transformedDefectData);
          }

          const transformedAddedDefects =
            saved.color?.defectDetails?.defects?.map((defect) => ({
              defectId: defect._id || "",
              defectName: defect.defectName,
              qty: defect.defectQty,
            })) || [];

          setAddedDefects(transformedAddedDefects);
          // Load defectsByPc from submitted data and format for display
          const loadedDefectsByPc = saved.color?.defectDetails?.defectsByPc || {};
          Object.keys(loadedDefectsByPc).forEach(pc => {
            loadedDefectsByPc[pc] = loadedDefectsByPc[pc].map(defect => ({
              ...defect,
              defectImages: (defect.defectImages || []).map(imgStr => ({ file: null, preview: imgStr, name: 'image.jpg' }))
            }));
          });
          setDefectsByPc(loadedDefectsByPc);
          setUploadedImages(saved.color?.defectDetails?.additionalImages?.map(img => ({

            file: null,
            preview: img.preview || img.url || img,
            name:'image.jpg'
          })) || []);

          setComment(saved.color?.defectDetails?.comment || "");
          setMeasurementData(processMeasurementData(saved.color?.measurementDetails));
          setShowMeasurementTable(true);
        }
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  };

  // Load saved measurement sizes
  const loadSavedSizes = async (orderNo, color) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/saved-sizes/${orderNo}/${color}`
      );

      if (!response.ok) {
        setSavedSizes([]);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-2 sm:p-4 md:p-6">
      <header className="bg-gradient-to-r from-slate-50 to-gray-100 shadow-lg py-5 px-8 dark:from-slate-900">
        <PageTitle />
      </header>
      {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <button
            className={`px-6 py-2 rounded-l-md font-medium ${
              activeTab === 'newInspection'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => handleTabChange('newInspection')}
          >
            New Inspection
          </button>
          <button
            className={`px-6 py-2 rounded-r-md font-medium ${
              activeTab === 'submittedData'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => handleTabChange('submittedData')}
          >
            Submitted Data
          </button>
        </div>

        {/* Conditionally Render Content Based on Active Tab */}
       
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 dark:bg-slate-900">
         {activeTab === 'newInspection' && (
        <>
        <OverAllSummaryCard
          measurementData={formData.colors[0]?.measurementDetails} 
          defectDetails={formData.colors[0]?.defectDetails} 
          reportType={formData.reportType}
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
          onToggle={() => toggleSection("orderDetails")}
          styleSuggestions={styleSuggestions}
          fetchMatchingStyles={fetchMatchingStyles}
          setStyleSuggestions={setStyleSuggestions}
          orderNumbers={filteredOrderNumbers}
          filterOrderNumbers={filterOrderNumbers}
          orderNoSuggestions={orderNoSuggestions}
          showOrderNoSuggestions={showOrderNoSuggestions}
          setShowOrderNoSuggestions={setShowOrderNoSuggestions}
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
          onToggle={() => toggleSection("inspectionData")}
          machineType={machineType}
          setMachineType={setMachineType}
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
          onToggle={() => toggleSection("defectDetails")}
          defectStatus={formData.result} 
          defectsByPc={defectsByPc}
          setDefectsByPc={setDefectsByPc}
        />
         
        <MeasurementDetailsSection
          orderNo={formData.orderNo || formData.style}
          color={formData.color}
          reportType={formData.reportType}
          isVisible={sectionVisibility.measurementDetails}
          onToggle={() => toggleSection("measurementDetails")}
          savedSizes={savedSizes}
          onSizeSubmit={handleSizeSubmit}
          measurementData={measurementData}
          showMeasurementTable={showMeasurementTable}
          onMeasurementEdit={handleMeasurementEdit}
          onMeasurementChange={handleMeasurementChange}
        />

        {/* Auto-save status */}
        {lastSaved && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            Last auto-saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            onClick={() => {
              if (autoSaveId) {
                Swal.fire({
                  title: "Reset Form?",
                  text: "This will clear all current data. Auto-saved data will remain available.",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "Reset",
                }).then((result) => {
                  if (result.isConfirmed) {
                    setFormData({
                      date: new Date().toISOString().split("T")[0],
                      orderNo: "",
                      style: "",
                      orderQty: "",
                      checkedQty: "",
                      color: "",
                      washQty: "",
                      washingType: "Normal Wash",
                      firstOutput: false,
                      inline: false,
                      daily: "",
                      buyer: "",
                      factoryName: "YM",
                      result: "",
                      aqlSampleSize: "",
                      aqlAcceptedDefect: "",
                      aqlRejectedDefect: "",
                      
                    });
                    setInspectionData(
                      initializeInspectionData(masterChecklist)
                    );
                    setProcessData({machineType: "", temperature: "", time: "", chemical: "" });
                    setDefectData(normalizeDefectData(defaultDefectData));

                    setAddedDefects([]);
                    setUploadedImages([]);
                    setComment("");
                    setMeasurementData({ beforeWash: [], afterWash: [] });
                    setDefectsByPc({});
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
                 const { totalCheckedPoint, totalPass, totalFail, passRate } = getMeasurementStats();
                const submitData = {
                  orderNo: formData.orderNo || formData.style,
                  date: formData.date,
                  colorName: formData.color,
                  reportType: formData.reportType,
                  washQty: formData.washQty,
                  checkedQty: formData.checkedQty,
                  totalCheckedPoint,
                  totalPass,
                  totalFail,
                  passRate,
                  totalCheckedPcs: formData.totalCheckedPcs,
                  rejectedDefectPcs: formData.rejectedDefectPcs,
                  totalDefectCount: formData.totalDefectCount,
                  defectRate: formData.defectRate,
                  defectRatio: formData.defectRatio,
                  overallFinalResult: formData.overallFinalResult,
                  submittedAt: new Date().toISOString(),
                  userId: user?.emp_id,
                  color: {
                    orderDetails: {
                      ...formData,
                      inspector: {
                        empId: user?.emp_id,
                        name: user?.username,
                      },
                    },
                    inspectionDetails: {
                      temp: processData.temperature,
                      time: processData.time,
                      chemical: processData.chemical,
                      checkedPoints: inspectionData.map(item => ({
                        pointName: item.checkedList,
                        approvedDate: item.approvedDate,
                        condition: item.na ? "N/A" : "Active",
                        remark: item.remark,
                      })),
                     parameters: defectData.map(item => {
                      const checkedQty = Number(item.checkedQty) || 0;
                      const failedQty = Number(item.failedQty) || 0;
                      const passRate = checkedQty > 0 ? (((checkedQty - failedQty) / checkedQty) * 100).toFixed(2) : '0.00';
                      const result = checkedQty > 0 ? (passRate >= 90 ? 'Pass' : 'Fail') : '';
                      return {
                        parameterName: item.parameter,
                        checkedQty: item.checkedQty || 0,
                        failedQty: item.failedQty || 0,
                        passRate,
                        result,
                        remark: item.remark,
                        ok: item.ok,
                        no: item.no,
                        checkboxes: item.checkboxes || {},
                      };
                    }),
                  },
                    defectDetails: {
                      washQty: formData.washQty,
                      checkedQty: formData.checkedQty,
                      result: formData.result,
                      defectsByPc: await Promise.all(Object.entries(defectsByPc).map(
                        async ([pcKey, pcDefects]) => ({
                          pcNumber: pcKey,
                          pcDefects: await Promise.all((Array.isArray(pcDefects) ? pcDefects : []).map(async (defect) => ({
                            defectName: defect.selectedDefect,
                            defectQty: defect.defectQty,
                            defectImages: await Promise.all((defect.defectImages || []).map(img => imageToBase64(img))) // Use the new helper here
                          })))
                        })
                      )),

                      comment: comment,            
                       additionalImages: await Promise.all(uploadedImages.map(img => imageToBase64(img))), // Use the new helper here
                    },
                    measurementDetails: [
                      ...measurementData.beforeWash.map((item) => ({
                        ...item,
                        washType: "beforeWash",
                      })),
                      ...measurementData.afterWash.map((item) => ({
                        ...item,
                        washType: "afterWash",
                      })),
                    ],
                  },
                };

                const response = await fetch(
                  `${API_BASE_URL}/api/qc-washing/submit`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(submitData),
                  }
                );

                const result = await response.json();
                if (result.success) {
                  Swal.fire(
                    "Success",
                    "QC Washing data submitted successfully!",
                    "success"
                  );
                  setAutoSaveId(null);
                  setLastSaved(null);

                  // Reset form after successful submission
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
                } else {
                  Swal.fire(
                    "Error",
                    result.message || "Failed to submit data",
                    "error"
                  );
                }
              } catch (error) {
                console.error("Submit error:", error);
                Swal.fire("Error", "Failed to submit data", "error");
              }
            }}
          >
            Submit
          </button>
        </div>
        </>
        )}

        {activeTab === 'submittedData' && (
          <SubmittedWashingDataPage />
        )}
      </main>
    </div>
  );
};

export default QCWashingPage;