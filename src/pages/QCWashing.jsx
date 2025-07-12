import { useState, useEffect, useRef } from "react";
import { useAuth } from "../components/authentication/AuthContext";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../config";
import OrderDetailsSection from "../components/inspection/qcWashing/Home/OrderDetailsSection";
import InspectionDataSection from "../components/inspection/qcWashing/Home/InspectionDataSection";
import DefectDetailsSection from "../components/inspection/qcWashing/Home/DefectDetailsSection";
import MeasurementDetailsSection from "../components/inspection/qcWashing/Home/MeasurementDetailsSection";
import SummaryCard from "../components/inspection/qcWashing/Home/SummaryCard";
import Swal from "sweetalert2";
import imageCompression from "browser-image-compression";
import SubmittedWashingDataPage from "../components/inspection/qcWashing/Home/SubmittedWashingData";

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
  });

  // State: Data Lists
  const [subFactories, setSubFactories] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [styleSuggestions, setStyleSuggestions] = useState([]);
  const [orderNumbers, setOrderNumbers] = useState([]);
  const [filteredOrderNumbers, setFilteredOrderNumbers] = useState([]);
  const [masterChecklist, setMasterChecklist] = useState([]);
  const [defectOptions, setDefectOptions] = useState([]);
  const [activeTab, setActiveTab] = useState('newInspection');

  // State: Inspection, Defect, Measurement
  const [inspectionData, setInspectionData] = useState([]);
  const [processData, setProcessData] = useState({ temperature: "", time: "", chemical: "" });
  const [defectData, setDefectData] = useState([
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
  ]);
  const [addedDefects, setAddedDefects] = useState([]);
  const [selectedDefect, setSelectedDefect] = useState("");
  const [defectQty, setDefectQty] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [comment, setComment] = useState("");
  const [savedSizes, setSavedSizes] = useState([]);
  const [measurementData, setMeasurementData] = useState({ beforeWash: [], afterWash: [] });
  const [showMeasurementTable, setShowMeasurementTable] = useState(true);

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

  // Section Toggle
  const toggleSection = (section) => {
    setSectionVisibility((prev) => ({ ...prev, [section]: !prev[section] }));
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
  }, [formData, inspectionData, processData, defectData, addedDefects, comment, measurementData, isDataLoading]);

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
          // Instead of calling loadSavedData again, directly set the saved data here to avoid redundant calls
          const saved = qcWashingData.savedData;

          setFormData((prev) => ({
            ...prev,
            ...saved.formData,
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
          }));

          // Ensure colorOptions includes the saved color
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
            setDefectData(saved.defectData);
          }

          if (saved.addedDefects) {
            setAddedDefects(saved.addedDefects);
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
    setFormData((prev) => {
      const newState = { ...prev, [field]: value };
      // When one checkbox is checked, uncheck the other and set daily field as string
      if (field === "firstOutput") {
        newState.inline = "";
        newState.daily = value;
      } else if (field === "inline") {
        newState.firstOutput = "";
        newState.daily = value;
      } else if (field === "daily") {
        if (value === "First Output") {
          newState.firstOutput = "First Output";
          newState.inline = "";
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
        setInspectionData(initializeInspectionData(masterChecklist));
        setProcessData({ temperature: "", time: "", chemical: "" });
        setDefectData([
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
        ]);
        setAddedDefects([]);
        setComment("");
        setMeasurementData({ beforeWash: [], afterWash: [] });
        setSavedSizes([]);

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
    setDefectData((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          if (field === "ok" && value) {
            return { ...item, ok: true, no: false, qty: "", defectPercent: "" };
          } else if (field === "no" && value) {
            return { ...item, ok: false, no: true };
          }
          return { ...item, [field]: value };
        }
        return item;
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

  const handleAddDefect = () => {
    if (!selectedDefect || !defectQty) {
      Swal.fire(
        "Incomplete",
        "Please select a defect and enter a quantity.",
        "warning"
      );
      return;
    }

    const defectExists = addedDefects.some(
      (d) => d.defectId === selectedDefect
    );
    if (defectExists) {
      Swal.fire("Duplicate", "This defect has already been added.", "error");
      return;
    }

    const defectDetails = defectOptions.find((d) => d._id === selectedDefect);
    setAddedDefects((prev) => [
      ...prev,
      {
        defectId: defectDetails._id,
        defectName: defectDetails.english,
        qty: parseInt(defectQty, 10),
      },
    ]);

    // Reset inputs
    setSelectedDefect("");
    setDefectQty("");
  };

  const handleDeleteDefect = (defectId) => {
    setAddedDefects((prev) => prev.filter((d) => d.defectId !== defectId));
  };

   // --- AQL & Checked Qty ---
  // Fetch AQL data for inline daily field
  const fetchAQLData = async (washQty) => {
    if (!washQty) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/aql-chart/find`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lotSize: parseInt(washQty) || 0,
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
        }));
      } else {
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
  const handleRemoveImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

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
        formData,
        reportType: formData.reportType,
        washQty: formData.washQty,         
        checkedQty: formData.checkedQty,   
        inspectionData,
        processData,
        defectData,
        addedDefects,
        uploadedImages: uploadedImages.map((img) => ({
          name: img.name,
          preview: img.preview,
        })),
        comment,
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
        totalCheckedPoint,
        totalPass,
        totalFail,
        passRate,
        savedAt: new Date().toISOString(),
        userId: user?.emp_id,
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
      console.error("Auto-save failed:", error);
    }
  };

  // Load color-specific data
  const loadColorSpecificData = async (orderNo, color) => {
    setIsDataLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/load-color-data/${orderNo}/${color}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.colorData) {
          const colorData = data.colorData;

          if (colorData.formData) {
            setFormData(prev => {
              // Only update color if different to avoid unnecessary re-renders
              const newColor = colorData.formData.color || color;
              const updatedColor = prev.color === newColor ? prev.color : newColor;

              return {
                ...prev,
                ...colorData.formData,
                color: updatedColor,
                reportType: colorData.reportType || prev.reportType,
                washQty: colorData.washQty || prev.washQty,
                checkedQty: colorData.checkedQty || prev.checkedQty,
              };
            });
          }
          setInspectionData(colorData.inspectionData || initializeInspectionData(masterChecklist));
          setProcessData(colorData.processData || { temperature: "", time: "", chemical: "" });
          setDefectData(colorData.defectData || []); 
          setAddedDefects(colorData.addedDefects || []);
          setComment(colorData.comment || "");
          setMeasurementData(processMeasurementData(colorData.measurementDetails || []));

        } else {
          console.log(`No saved data found for color "${color}". Using a clean form.`);
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
            setDefectData(saved.defectData);
          }

          if (saved.addedDefects) {
            setAddedDefects(saved.addedDefects);
          }

          setComment(saved.comment || "");

          // Set measurement data
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
            saved.color?.inspectionDetails?.parameters?.map((param) => ({
              parameter: param.parameterName,
              ok: param.status === "ok",
              no: param.status === "no",
              qty: param.qty || "",
              remark: param.remark || "",
              checkboxes: param.checkboxes || {},
            })) || [];

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
        console.log("Loaded saved sizes:", data.savedSizes);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-2 sm:p-4 md:p-6">
      <header className="bg-gradient-to-r from-slate-50 to-gray-100 shadow-lg py-5 px-8">
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
       
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
         {activeTab === 'newInspection' && (
        <>
        <SummaryCard
          measurementData={measurementData}
          showMeasurementTable={showMeasurementTable}
          reportType={formData.reportType}
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
                    setProcessData({ temperature: "", time: "", chemical: "" });
                    setDefectData([
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
                                ]);
                    setAddedDefects([]);
                    setUploadedImages([]);
                    setComment("");
                    setMeasurementData({ beforeWash: [], afterWash: [] });
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
                  formData,
                  inspectionData,
                  processData,
                  defectData,
                  addedDefects,
                  reportType: formData.reportType,
                  washQty: formData.washQty,
                  checkedQty: formData.checkedQty,
                  uploadedImages,
                  comment,
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
                  totalCheckedPoint,
                  totalPass,
                  totalFail,
                  passRate,
                  submittedAt: new Date().toISOString(),
                  userId: user?.emp_id,
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
