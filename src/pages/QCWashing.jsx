import { useState, useEffect, useRef } from "react";
import { useAuth } from "../components/authentication/AuthContext";
// import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../config";
import OrderDetailsSection from "../components/inspection/qc2_washing/Home/OrderDetailsSection";
import InspectionDataSection from "../components/inspection/qc2_washing/Home/InspectionDataSection";
import DefectDetailsSection from "../components/inspection/qc2_washing/Home/DefectDetailsSection";
import MeasurementDetailsSection from "../components/inspection/qc2_washing/Home/MeasurementDetailsSection";
import OverAllSummaryCard from "../components/inspection/qc2_washing/Home/OverAllSummaryCard";
import Swal from "sweetalert2";
import imageCompression from "browser-image-compression";
import SubmittedWashingDataPage from "../components/inspection/qc2_washing/Home/SubmittedWashingData";

const normalizeImageSrc = (src) => {
  if (!src) return "";
  if (typeof src === "string" && src.startsWith("data:")) return src;
  if (typeof src === "string" && src.startsWith("/public/")) return src.replace(/^\/public/, "");
  if (typeof src === "string" && src.startsWith("/storage/")) return src;
  if (/^[A-Za-z0-9+/=]+$/.test(src) && src.length > 100) return `data:image/jpeg;base64,${src}`;
  return src;
};

function transformDefectsByPc(savedDefectsByPc) {
  if (Array.isArray(savedDefectsByPc)) {
    // Array from backend
    return savedDefectsByPc.reduce((acc, pcData) => {
      const pcNumber = pcData.pcNumber;
      if (pcNumber) {
        acc[pcNumber] = (pcData.pcDefects || []).map((defect, index) => ({
          id: index + 1,
          selectedDefect: defect.defectId || defect.selectedDefect || "",
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
        selectedDefect: defect.defectId || defect.selectedDefect || "",
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

function calculateSummaryData(currentFormData) {
  // Use top-level fields, not colors[0]
  const currentDefectDetails = currentFormData.defectDetails;
  const currentMeasurementData = currentFormData.measurementDetails;

  let measurementPoints = 0;
  let measurementPass = 0;
  let totalCheckedPcs = 0;

  if (currentMeasurementData && Array.isArray(currentMeasurementData)) {
    currentMeasurementData.forEach((data) => {
      if (data.pcs && Array.isArray(data.pcs)) {
        totalCheckedPcs += data.pcs.length;
        data.pcs.forEach((pc) => {
          if (pc.measurementPoints && Array.isArray(pc.measurementPoints)) {
            pc.measurementPoints.forEach((point) => {
              if (point.result === 'pass' || point.result === 'fail') {
                measurementPoints++;
                if (point.result === 'pass') {
                  measurementPass++;
                }
              }
            });
          }
        });
      }
    });
  }

  const rejectedDefectPcs = Array.isArray(currentDefectDetails?.defectsByPc)
    ? currentDefectDetails.defectsByPc.length
    : 0;

  const defectCount = currentDefectDetails?.defectsByPc
    ? currentDefectDetails.defectsByPc.reduce((sum, pc) => {
        return sum + (Array.isArray(pc.pcDefects)
          ? pc.pcDefects.reduce((defSum, defect) => defSum + (parseInt(defect.defectQty, 10) || 0), 0)
          : 0);
      }, 0)
    : 0;

  const defectRate =
    totalCheckedPcs > 0
      ? ((defectCount / totalCheckedPcs) * 100).toFixed(1)
      : 0;

  const defectRatio =
    totalCheckedPcs > 0
      ? ((rejectedDefectPcs / totalCheckedPcs) * 100).toFixed(1)
      : 0;

  let overallResult = "Pass";
  const measurementOverallResult =
    measurementPoints - measurementPass > 0 ? "Fail" : "Pass";
  const defectOverallResult = currentDefectDetails?.result || "N/A";

  if (measurementOverallResult === "Fail" || defectOverallResult === "Fail") {
    overallResult = "Fail";
  } else if (measurementOverallResult === "Pass" && defectOverallResult === "Pass") {
    overallResult = "Pass";
  } else {
    overallResult = "N/A";
  }

  return {
    totalCheckedPcs: totalCheckedPcs || 0,
    rejectedDefectPcs: rejectedDefectPcs || 0,
    totalDefectCount: defectCount || 0,
    defectRate: parseFloat(defectRate) || 0,
    defectRatio: parseFloat(defectRatio) || 0,
    overallFinalResult: overallResult || "N/A",
  };
}



function machineProcessesToObject(machineProcesses) {
  const obj = {};
  (machineProcesses || []).forEach(proc => {
    obj[proc.machineType] = {
      temperature: proc.temperature || "",
      time: proc.time || "",
      chemical: proc.chemical || ""
    };
  });
  return obj;
}

function fractionToDecimal(fraction) {
  if (typeof fraction === "number") return fraction;
  if (!fraction || typeof fraction !== "string") return 0;
  // Remove + or - for parsing, but keep sign
  let sign = 1;
  let str = fraction.trim();
  if (str.startsWith('-')) { sign = -1; str = str.slice(1); }
  if (str.startsWith('+')) { str = str.slice(1); }
  if (str === "" || str === "-") return 0;
  if (str.includes('/')) {
    const [num, den] = str.split('/').map(Number);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return sign * (num / den);
    }
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : sign * parsed;
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
    washType: "Normal Wash",
    firstOutput: "",
    inline: "",
    reportType: "",
    buyer: "",
    factoryName: "YM",
    before_after_wash: "Before Wash",
    result: "",
    aql:[{
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
  const [overallSummary, setOverallSummary] = useState(null);
  const [colorOrderQty, setColorOrderQty] = useState(null);
  const [sectionVisibility, setSectionVisibility] = useState({
  orderDetails: true,
  inspectionData: false,
  defectDetails: false,
  measurementDetails: false,
});
const [recordId, setRecordId] = useState(null);
  const aql = formData.aql && formData.aql[0];


// Function to activate the next section
const activateNextSection = (currentSection) => {
  setSectionVisibility((prev) => {
    const order = ['orderDetails', 'inspectionData', 'defectDetails', 'measurementDetails'];
    const idx = order.indexOf(currentSection);
    if (idx !== -1 && idx < order.length - 1) {
      return { ...prev, [order[idx + 1]]: true };
    }
    return prev;
  });
};

  const fetchOverallSummary = async (recordId) => {
  if (!recordId) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/qc-washing/overall-summary-by-id/${recordId}`);
    const data = await response.json();
    if (data.success) {
      setOverallSummary(data.summary);
    } else {
      setOverallSummary(null);
    }
  } catch (error) {
    setOverallSummary(null);
    console.error('Error fetching overall summary:', error);
  }
};


  // State: Inspection, Defect, Measurement
  const [inspectionData, setInspectionData] = useState([]);
  const [processData, setProcessData] = useState({
  "Washing Machine": { temperature: "", time: "", chemical: "" },
  "Tumble Dry": { temperature: "", time: "" }
});
  const defaultDefectData = [
    { parameter: "Color Shade 01", ok: true, no: false,  checkedQty: 0, failedQty: 0, result: "Pass", remark: "" },
    { parameter: "Appearance", ok: true, no: false, checkedQty: 0, failedQty: 0,result: "Pass", remark: ""},
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
    acceptedDefect: param.aqlAcceptedDefect || "",
    checkboxes: param.checkboxes || {},
  }));
}
  const [addedDefects, setAddedDefects] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [comment, setComment] = useState("");
  const [savedSizes, setSavedSizes] = useState([]);
  const [measurementData, setMeasurementData] = useState({ beforeWash: [], afterWash: [] });
  const [showMeasurementTable, setShowMeasurementTable] = useState(true);
  const [machineType, setMachineType] = useState('Washing Machine');
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


  const imageToBase64 = (imageObject) => {
    if (!imageObject) {
      return Promise.resolve(null);
    }

    if (imageObject.file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
     
          if (!(imageObject.file instanceof Blob)) {
            reject(new Error("Invalid file object provided."));
            return;
          }
        reader.readAsDataURL(imageObject.file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    } else if (imageObject.preview) {
  
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
  useEffect(() => {
}, [uploadedImages]);


  // --- useEffect: Calculate Checked Qty ---
 useEffect(() => {
  const aql = formData.aql && formData.aql[0];
  if (
    (formData.inline === "Inline" || formData.reportType === "Inline") &&
    aql?.sampleSize &&
    formData.washQty
  ) {
    const newCheckedQty = Math.min(
      parseInt(formData.washQty, 10),
      parseInt(aql.sampleSize, 10)
    ).toString();
    if (formData.checkedQty !== newCheckedQty) {
      setFormData(prev => ({
        ...prev,
        checkedQty: newCheckedQty
      }));
    }
  }
}, [formData.aql, formData.washQty, formData.inline, formData.reportType]);


useEffect(() => {
  if (recordId) {
    fetchOverallSummary(recordId);
  }
}, [recordId, lastSaved]);


   // --- useEffect: Calculate AQL Status ---
  useEffect(() => {
  const aql = formData.aql && formData.aql[0];
  if (
    (formData.inline === 'Inline' || formData.reportType === 'Inline' || formData.firstOutput === "First Output" || formData.reportType === 'First Output')
    && aql?.acceptedDefect
  ) {
    const totalDefects = Object.values(defectsByPc)
      .flat()
      .reduce((sum, defect) => sum + (parseInt(defect.defectQty, 10) || 0), 0);

    const acceptedDefectCount = parseInt(aql.acceptedDefect, 10);
    if (!isNaN(acceptedDefectCount)) {
      const newStatus = totalDefects <= acceptedDefectCount ? 'Pass' : 'Fail';
      if (newStatus !== formData.result) {
        setFormData(prev => ({ ...prev, result: newStatus }));
      }
    }
  } else {
    if (formData.result) {
      setFormData(prev => ({ ...prev, result: '' }));
    }
  }
}, [defectsByPc, formData.aql, formData.inline, formData.reportType, formData.firstOutput, formData.result]);


  useEffect(() => {
  const fetchColorOrderQty = async () => {
    if (!formData.orderNo || !formData.color) {
      setColorOrderQty(null);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing/order-color-qty/${formData.orderNo}/${encodeURIComponent(formData.color)}`);
      const data = await response.json();
      if (data.success) {
        setColorOrderQty(data.colorOrderQty);
      } else {
        setColorOrderQty(null);
      }
    } catch (error) {
      setColorOrderQty(null);
    }
  };
  fetchColorOrderQty();
}, [formData.orderNo, formData.color]);

// Example: When defectsByPc or measurementData changes

  // --- Helper Functions ---
  const processMeasurementData = (loadedMeasurements) => {
    if (Array.isArray(loadedMeasurements)) {
      const beforeWash = loadedMeasurements.filter((m) => m.before_after_wash === "beforeWash");
      const afterWash = loadedMeasurements.filter((m) => m.before_after_wash === "afterWash");
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

  const loadSavedDataById = async (id) => {
  if (!id) return;
  setIsDataLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/api/qc-washing/load-saved-by-id/${id}`);
    const data = await response.json();
    if (!data.success || !data.savedData) {
      Swal.fire("No saved data found", "", "info");
      setIsDataLoading(false);
      return;
    }
    const saved = data.savedData;

    // --- Transform and set all relevant states as before ---
    setFormData(prev => ({
      ...prev,
      ...saved.formData, // or map fields as needed
      date: saved.formData?.date ? saved.formData.date.split("T")[0] : prev.date,
      before_after_wash: saved.before_after_wash || prev.before_after_wash,
      orderQty: saved.formData?.orderQty || prev.orderQty,
      buyer: saved.formData?.buyer || prev.buyer,
     aql: [{
          sampleSize: saved.formData?.aqlSampleSize || prev.aql?.[0]?.sampleSize || "",
          acceptedDefect: saved.formData?.aqlAcceptedDefect || prev.aql?.[0]?.acceptedDefect || "",
          rejectedDefect: saved.formData?.aqlRejectedDefect || prev.aql?.[0]?.rejectedDefect || "",
          levelUsed: saved.formData?.aqlLevelUsed || prev.aql?.[0]?.levelUsed || "",
        }],
    }));

    setInspectionData(
  (saved.inspectionDetails?.checkedPoints || []).map(item => ({
    checkedList: item.pointName || "",
    decision: item.decision === true ? "ok" : item.decision === false ? "no" : "",
    comparisonImages: (item.comparison || []).filter(Boolean).map(img => ({
      file: null,
      preview: normalizeImageSrc(img),
      name: typeof img === "string" ? img.split('/').pop() : "image.jpg"
    })),
    remark: item.remark || "",
    approvedDate: item.approvedDate || "",
    na: item.condition === "N/A" || false,
  }))
);


// 2. Process Data (Machine Processes)
if (saved.inspectionDetails?.machineProcesses) {
  setProcessData(machineProcessesToObject(saved.inspectionDetails.machineProcesses));
}
    if (saved.processData && Array.isArray(saved.processData.machineProcesses)) {
      setProcessData(machineProcessesToObject(saved.processData.machineProcesses));
    }
    setDefectData(
  (saved.inspectionDetails?.parameters || []).map(param => ({
    parameter: param.parameterName || param.parameter || "",
    checkedQty: param.checkedQty || 0,
    failedQty: param.defectQty || param.failedQty || 0,
    passRate: param.passRate || "",
    result: param.result || "",
    remark: param.remark || "",
    ok: param.ok !== undefined ? param.ok : true,
    no: param.no !== undefined ? param.no : false,
    acceptedDefect: param.aqlAcceptedDefect || "",
    checkboxes: param.checkboxes || {},
  }))
);
    setAddedDefects(saved.addedDefects || []);
    setDefectsByPc(transformDefectsByPc(saved.defectDetails?.defectsByPc || {}));
    setUploadedImages(
      (saved.defectDetails?.additionalImages || [])
          .filter(Boolean)
          .map(img => {
            if (typeof img === "object" && img !== null) {
              return { preview: img.preview || "", name: img.name || "image.jpg" };
            }
            if (typeof img === "string") {
              return { preview: img, name: "image.jpg" };
            }
            return { preview: "", name: "image.jpg" };
          })

    );
    setComment(saved.defectDetails?.comment || "");

    setMeasurementData(processMeasurementData(saved.measurementDetails || []));
    setSavedSizes((saved.measurementDetails || []).map(m => m.size));
    setRecordId(saved._id);
    if (saved.savedAt) setLastSaved(new Date(saved.savedAt));
    Swal.fire({
      icon: "success",
      title: "Saved data loaded!",
      timer: 1200,
      toast: true,
      position: "top-end",
      showConfirmButton: false
    });
  } catch (error) {
    Swal.fire("Error loading saved data", error.message, "error");
    console.error("Error loading saved data:", error);
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
          before_after_wash: formData.before_after_wash,
        }
      };
      // Update the cache
      setColorDataCache(prevCache => ({ ...prevCache, [outgoingColor]: currentStateForColor }));
    }

    setFormData((prev) => {
      const newState = { ...prev, [field]: value };
      // When one checkbox is checked, uncheck the other and set reportType field as string
      if (field === "firstOutput") {
        newState.inline = "";
        newState.reportType = value; 
        newState.washQty = "";       
        newState.checkedQty = ""; 
        if (value === "First Output") {
          fetchFirstOutputDetails();
        }
      } else if (field === "inline") {
        newState.firstOutput = "";
        newState.reportType = value;
        newState.washQty = "";       
        newState.checkedQty = "";
      } else if (field === "reportType") {
        if (value === "First Output") {
          newState.firstOutput = "First Output";
          newState.inline = "";
          newState.washQty = "";       
        newState.checkedQty = "";
          // Call the function to fetch details for First Output
          fetchFirstOutputDetails();
        } else if (value === "Inline") {
          newState.inline = "Inline";
          newState.firstOutput = "";
          newState.washQty = "";       
        newState.checkedQty = "";
        }
      }

      if (field === "reportType" && value === "Inline" && formData.washQty) {
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
        if (formData.inline === "Inline" || formData.reportType === "Inline") {
          fetchAQLData(value);
          calculateCheckedQty(value);
        }
      }, 100);
    }
  };
  // --- AQL & Checked Qty ---
  const fetchFirstOutputDetails = async () => {
    const orderNo = formData.orderNo || formData.style;
    if (!orderNo) {
      Swal.fire('Missing Order No', 'Please enter an Order No before selecting First Output.', 'warning');
      // Uncheck the box to prevent inconsistent state
      setFormData(prev => ({ ...prev, firstOutput: '', reportType: '' }));
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
          checkedQty: data.checkedQty,
          // Set the AQL values
          aql:[{sampleSize: data.aqlData.sampleSize,
          acceptedDefect: data.aqlData.acceptedDefect,
          rejectedDefect: data.aqlData.rejectedDefect,
          // Wash Qty can be set to checked Qty for consistency if needed
          levelUsed: data.aqlData.aqlLevelUsed}],
          washQty: data.checkedQty,
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
          aql: [{
            sampleSize: "",
            acceptedDefect: "",
            rejectedDefect: "",
            levelUsed: "",
          }]
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
  // Fetch AQL data for inline reportType field
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
          aql: [{
            sampleSize: "",
            acceptedDefect: "",
            rejectedDefect: "",
            levelUsed: "",
          }]
        }));
        return;
      }

      const data = await response.json();
      if (data.success && data.aqlData) {
        setFormData((prev) => ({
          ...prev,
          aql: [{
            sampleSize: data.aqlData.sampleSize,
            acceptedDefect: data.aqlData.acceptedDefect,
            rejectedDefect: data.aqlData.rejectedDefect,
            levelUsed: data.aqlData.aqlLevelUsed,
          }]
        }));
      } else {
         setFormData((prev) => ({
          ...prev,
          aql: [{
            sampleSize: "",
            acceptedDefect: "",
            rejectedDefect: "",
            levelUsed: "",
          }]
        }));
      }
    } catch (error) {
      console.error("Error fetching AQL data:", error);
    }
  };

  // Calculate checked qty based on wash qty and AQL data
 const calculateCheckedQty = (washQty) => {
  setTimeout(() => {
    setFormData((prev) => {
      const aql = prev.aql && prev.aql[0];
      if (aql?.sampleSize && washQty) {
        const checkedQty = Math.min(
          parseInt(washQty),
          parseInt(aql.sampleSize)
        );
        return { ...prev, checkedQty: checkedQty.toString() };
      }
      return prev;
    });
  }, 100);
};

//   const fetchAqlForParameter = async (orderNo, checkedQty, setDefectData, defectIndex) => {
//   if (!orderNo || !checkedQty) return;

//   try {
//     const response = await fetch(
//       `${API_BASE_URL}/api/qc-washing/aql-chart/parameter`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           orderNo: orderNo,
//           checkedQty: parseInt(checkedQty, 10) || 0,
//         }),
//       }
//     );

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({
//         message: `Request failed with status ${response.status}`,
//       }));
//       // console.error("AQL API Error:", errorData.message || "Unknown error");
//       // Optionally update defectData state to clear AQL values for this parameter
//       if (setDefectData && typeof defectIndex === "number") {
//         setDefectData(prev =>
//           prev.map((item, idx) =>
//             idx === defectIndex
//               ? { ...item, aqlAcceptedDefect: "", aqlLevelUsed: "", result: "" }
//               : item
//           )
//         );
//       }
//       return null;
//     }

//     const data = await response.json();

//     if (data.success && data.aqlData) {
//       // Optionally update defectData state for this parameter
//       if (setDefectData && typeof defectIndex === "number") {
//         setDefectData(prev =>
//           prev.map((item, idx) =>
//             idx === defectIndex
//               ? {
//                   ...item,
//                   aqlAcceptedDefect: data.aqlData.acceptedDefect,
//                   aqlLevelUsed: data.aqlData.aqlLevelUsed,
//                   result:
//                     (Number(item.failedQty) || 0) <= data.aqlData.acceptedDefect
//                       ? "Pass"
//                       : "Fail",
//                 }
//               : item
//           )
//         );
//       }
//       return data.aqlData;
//     } else {
//       if (setDefectData && typeof defectIndex === "number") {
//         setDefectData(prev =>
//           prev.map((item, idx) =>
//             idx === defectIndex
//               ? { ...item, aqlAcceptedDefect: "", aqlLevelUsed: "", result: "" }
//               : item
//           )
//         );
//       }
//       // console.warn(
//       //   "AQL data not found:",
//       //   data.message || "No AQL chart found for the given criteria."
//       // );
//       return null;
//     }
//   } catch (error) {
//     console.error("Error fetching AQL data:", error);
//     if (setDefectData && typeof defectIndex === "number") {
//       setDefectData(prev =>
//         prev.map((item, idx) =>
//           idx === defectIndex
//             ? { ...item, aqlAcceptedDefect: "", aqlLevelUsed: "", result: "" }
//             : item
//         )
//       );
//     }
//     return null;
//   }
// };



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
        const before_after_wash = formData.before_after_wash === "Before Wash" ? "beforeWash" : "afterWash";

        // 1. Update local measurement data and saved sizes
        setMeasurementData((prev) => {
        const currentArray = prev[before_after_wash];
        const existingIndex = currentArray.findIndex((item) => item.size === transformedSizeData.size);
        if (existingIndex >= 0) {
        const updated = [...currentArray];
        updated[existingIndex] = transformedSizeData;
        return { ...prev, [before_after_wash]: updated };
        }else {
        return { ...prev, [before_after_wash]: [...currentArray, transformedSizeData] };
        }
        });

        setSavedSizes((prev) => {
        if (!prev.includes(transformedSizeData.size)) {
        return [...prev, transformedSizeData.size];
        }
        return prev;
        });

        // 2. Remove the just-saved size from selectedSizes to hide its input table
        if (typeof setSelectedSizes === "function") {
        setSelectedSizes((prev) => prev.filter((s) => s.size !== transformedSizeData.size));
        }

        setShowMeasurementTable(true);
        // 3. Save to backend
        if (!recordId) {
        Swal.fire("Order details must be saved first!", "", "warning");
        return;
        }

        const measurementDetail = { ...transformedSizeData, before_after_wash };
        const response = await fetch(`${API_BASE_URL}/api/qc-washing/measurement-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        recordId,
        measurementDetail
        })
        });

        const result = await response.json();
        if (result.success) {
        Swal.fire("Success", `Size data saved to database!`, "success");
        // Optionally reload all saved data for full consistency:
        // if (typeof loadSavedDataById === "function") loadSavedDataById(recordId);
        } else {
        Swal.fire("Error", result.message || "Failed to save measurement data", "error");
        }
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
      const before_after_wash =
        formData.before_after_wash === "Before Wash" ? "beforeWash" : "afterWash";
      setMeasurementData((prev) => ({
        ...prev,
        [before_after_wash]: prev[before_after_wash].filter((item) => item.size !== size),
      }));
    }
  };

  // Handle measurement value changes for auto-save
  const handleMeasurementChange = (newMeasurementValues) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
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

  const autoSaveSummary = async (summary, recordId) => {
  if (!recordId || !summary) return;
  try {
    await fetch(`${API_BASE_URL}/api/qc-washing/save-summary/${recordId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary }),
    });
  } catch (error) {
    console.error("Failed to auto-save summary:", error);
  }
};


     // Function to calculate and update summary data (NEW/MODIFIED)
  // This function should be called whenever relevant data (defectDetails, measurementData) changes
  const updateSummaryData = (currentFormData) => {
  const summary = calculateSummaryData(currentFormData);
  setFormData((prevData) => ({
    ...prevData,
    ...summary,
  }));
  if (recordId) {
    autoSaveSummary(summary, recordId);
  }
};

useEffect(() => {
  // Build up-to-date defectDetails and measurementDetails
  const defectDetails = {
    ...formData.defectDetails,
    checkedQty: formData.checkedQty,
    washQty: formData.washQty,
    result: formData.result,
    defectsByPc: Object.entries(defectsByPc).map(([pcNumber, pcDefects]) => ({
      pcNumber,
      pcDefects,
    })),
  };
  const measurementDetails = [
    ...measurementData.beforeWash.map((item) => ({ ...item, beforeWash: "beforeWash" })),
    ...measurementData.afterWash.map((item) => ({ ...item, afterWash: "afterWash" })),
  ];

  // Calculate summary from the latest data
  const summary = calculateSummaryData({
    ...formData,
    defectDetails,
    measurementDetails,
  });

  // Update formData with the latest defectDetails, measurementDetails, and summary
  setFormData((prev) => ({
    ...prev,
    defectDetails,
    measurementDetails,
    ...summary,
  }));

  // Save summary to backend
  // console.log("Summary to save:", summary);
  if (recordId) {
    autoSaveSummary(summary, recordId);
  }
}, [
  defectsByPc,
  measurementData,
  formData.checkedQty,
  formData.washQty,
  formData.result,
  recordId,
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
                before_after_wash: colorData.orderDetails.before_after_wash || prev.before_after_wash,
                washQty: colorData.defectDetails?.washQty || prev.washQty,
                checkedQty: colorData.defectDetails?.checkedQty || prev.checkedQty,
                aql: [{
                  sampleSize: colorData.orderDetails.aqlSampleSize
                  || colorData.inspectionDetails?.aqlSampleSize
                  || prev.aqlSampleSize,
                  acceptedDefect: colorData.orderDetails.aqlAcceptedDefect
                  || colorData.inspectionDetails?.aqlAcceptedDefect
                  || prev.aqlAcceptedDefect,
                  rejectedDefect: colorData.orderDetails.aqlRejectedDefect
                  || colorData.inspectionDetails?.aqlRejectedDefect
                  || prev.aqlRejectedDefect,
                levelUsed: colorData.orderDetails.aqlLevelUsed
                  || colorData.inspectionDetails?.aqlLevelUsed
                  || prev.aqlLevelUsed, 
                }]
              };
            });
          }
          setInspectionData(colorData.inspectionDetails?.checkedPoints?.map((point) => ({ 
              checkedList: point.pointName,
              approvedDate: point.approvedDate || "",
              na: point.condition === "N/A",
              remark: point.remark || "",
            })) || initializeInspectionData(masterChecklist));

             const colorOrderQty =
              colorData.orderDetails?.colorOrderQty ||
              null;
            setColorOrderQty(colorOrderQty);

         setProcessData(machineProcessesToObject(colorData.inspectionDetails?.machineProcesses));

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

  // Load saved measurement sizes
  const loadSavedSizes = async (orderNo, color) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/saved-sizes/${orderNo}/${color}`
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
      
        <PageTitle />
      
      {/* Tab Navigation */}
        <div className="flex justify-center mb-6 mt-4">
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
           Report
          </button>
        </div>

        {/* Conditionally Render Content Based on Active Tab */}
       
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 dark:bg-slate-900">
         {activeTab === 'newInspection' && (
        <>
        <OverAllSummaryCard
          summary={overallSummary}
          measurementData={formData.measurementDetails} 
          defectDetails={formData.defectDetails} 
          before_after_wash={formData.before_after_wash}
          showMeasurementTable={showMeasurementTable}
        />
        <OrderDetailsSection
        onLoadSavedDataById={loadSavedDataById}
        setSavedSizes={setSavedSizes}
          formData={formData}
          setFormData={setFormData}
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
          colorOrderQty={colorOrderQty}
          inspectionData={inspectionData}
          processData={processData}
          defectData={defectData}
          addedDefects={addedDefects}
          comment={comment}
          measurementData={measurementData}
          uploadedImages={uploadedImages}
          activateNextSection={() => activateNextSection('orderDetails')}
           setRecordId={setRecordId}
        />
        {sectionVisibility.inspectionData && (
        <InspectionDataSection
          onLoadSavedDataById={loadSavedDataById}
          inspectionData={inspectionData}
          setInspectionData={setInspectionData} 
          processData={processData}
          setProcessData={setProcessData}
          defectData={defectData}
          isVisible={sectionVisibility.inspectionData}
          onToggle={() => toggleSection("inspectionData")}
          machineType={machineType}
          setMachineType={setMachineType}
          washQty={formData.washQty}
          setDefectData={setDefectData} 
          activateNextSection={() => activateNextSection('inspectionData')}
          recordId={recordId}
        />
        )}
        {sectionVisibility.defectDetails && (
        <DefectDetailsSection
          onLoadSavedDataById={loadSavedDataById}
          formData={formData}
          handleInputChange={handleInputChange}
          defectOptions={defectOptions}
          addedDefects={addedDefects}
          setAddedDefects={setAddedDefects}
          uploadedImages={uploadedImages}
          setUploadedImages={setUploadedImages}
          isVisible={sectionVisibility.defectDetails}
          onToggle={() => toggleSection("defectDetails")}
          defectStatus={formData.result} 
          activateNextSection={() => activateNextSection('defectDetails')}
          recordId={recordId}
          defectsByPc={defectsByPc}
          setDefectsByPc={setDefectsByPc}
          comment={comment}
          setComment={setComment}
        />
        )}
        {sectionVisibility.measurementDetails && (
        <MeasurementDetailsSection
          onLoadSavedDataById={loadSavedDataById}
          orderNo={formData.orderNo || formData.style}
          color={formData.color}
          before_after_wash={formData.before_after_wash}
          isVisible={sectionVisibility.measurementDetails}
          onToggle={() => toggleSection("measurementDetails")}
          savedSizes={savedSizes}
          onSizeSubmit={handleSizeSubmit}
          measurementData={measurementData}
          showMeasurementTable={showMeasurementTable}
          onMeasurementEdit={handleMeasurementEdit}
          onMeasurementChange={handleMeasurementChange}
          activateNextSection={() => activateNextSection('defectDetails')}
          recordId={recordId}
        />
        )}

        {/* Auto-save status */}
        {/* {lastSaved && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            Last auto-saved: {lastSaved.toLocaleTimeString()}
          </div>
        )} */}

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
                      washType: "Normal Wash",
                      firstOutput: false,
                      inline: false,
                      reportType: "",
                      buyer: "",
                      factoryName: "YM",
                      result: "",
                      aql: [{
                        sampleSize: "",
                        acceptedDefect: "",
                        rejectedDefect: "",
                        levelUsed: "",
                      }]
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
                // --- 1. Recalculate summary with the latest state ---
                const defectDetails = {
                  ...formData.defectDetails,
                  checkedQty: formData.checkedQty,
                  washQty: formData.washQty,
                  result: formData.result,
                  defectsByPc: Object.entries(defectsByPc).map(([pcNumber, pcDefects]) => ({
                    pcNumber,
                    pcDefects,
                  })),
                };
                const measurementDetails = [
                  ...measurementData.before_after_wash.map((item) => ({ ...item, before_after_wash: "beforeWash" })),
                  ...measurementData.afterWash.map((item) => ({ ...item, before_after_wash: "afterWash" })),
                ];
                const summary = calculateSummaryData({
                  ...formData,
                  defectDetails,
                  measurementDetails,
                });



                // --- 2. Build the submitData payload ---
                const { totalCheckedPoint, totalPass, totalFail, passRate } = getMeasurementStats();
                const aql = formData.aql && formData.aql[0];
              const submitAql = [{
                sampleSize: Number(aql?.sampleSize) || 0,
                acceptedDefect: Number(aql?.acceptedDefect) || 0,
                rejectedDefect: Number(aql?.rejectedDefect) || 0,
                levelUsed: Number(aql?.levelUsed) || 0
              }];
                const submitData = {
                  orderNo: formData.orderNo || formData.style,
                  date: formData.date,
                  colorName: formData.color,
                  before_after_wash: formData.before_after_wash,
                  washQty: formData.washQty,
                  checkedQty: formData.checkedQty,
                  totalCheckedPoint,
                  totalPass,
                  totalFail,
                  passRate,
                  submitAql,
                  ...summary, 
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
                        const result = (item.aqlAcceptedDefect !== undefined && checkedQty > 0)
                          ? (failedQty <= item.aqlAcceptedDefect ? "Pass" : "Fail")
                          : "";
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
                            defectImages: await Promise.all((defect.defectImages || []).map(img => imageToBase64(img)))
                          })))
                        })
                      )),
                      comment: comment,
                      additionalImages: await Promise.all(uploadedImages.map(img => imageToBase64(img))),
                    },
                    measurementDetails: [
                      ...measurementData.before_after_wash.map((item) => ({ ...item, before_after_wash: "beforeWash" })),
                      ...measurementData.afterWash.map((item) => ({ ...item, before_after_wash: "afterWash" })),
                    ],
                  },
                };
                // --- 3. Submit to the server ---
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
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
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