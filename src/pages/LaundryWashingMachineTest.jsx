import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/authentication/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Upload, X, Camera, ChevronDown, ChevronUp, FileText, FileSpreadsheet, Printer, QrCode, Scan, Pencil, CheckCircle, RotateCw, RotateCcw, Download, Trash2, Save, RefreshCw, Send } from "lucide-react";
import { API_BASE_URL, QR_CODE_BASE_URL } from "../../config.js";
import Select from "react-select";
import { pdf } from "@react-pdf/renderer";
import QRCode from "react-qr-code";
import { Html5Qrcode } from "html5-qrcode";
import WashingMachineTestPDF from "../components/inspection/WashingTesting/WashingMachineTestPDF";
import generateWashingMachineTestExcel from "../components/inspection/WashingTesting/WashingMachineTestExcel";
import {
  ImageViewerModal,
  useImageViewer,
  normalizeImageUrl,
  getImageFilename,
  FormSection,
  ReportsList,
  ReceivedModal,
  CompletionModal,
  EditReportModal,
  QRCodeModal,
  QRScannerModal,
  useOrderData,
  useQRCode,
  useReports,
  useImageHandling,
  useFormState,
  useReportSubmission,
} from "../components/inspection/WashingTesting/lib";
import showToast from "../utils/toast";

const LaundryWashingMachineTest = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateValue = new Date().toISOString().split("T")[0];
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const receivedImageInputRef = useRef(null);
  const completionImageInputRef = useRef(null);

  // Get the base URL for QR codes - use computer's network IP so phones can access
  const getQRCodeBaseURL = () => {
    const currentProtocol = window.location.protocol; // Get current protocol (http: or https:)
    
    if (QR_CODE_BASE_URL) {
      // This ensures QR codes use the same protocol as the current page (HTTP/HTTPS)
      try {
        const url = new URL(QR_CODE_BASE_URL);
        url.protocol = currentProtocol;
        return url.toString().replace(/\/$/, ''); // Remove trailing slash if present
      } catch (error) {
        // If URL parsing fails, try simple string replacement
        const protocolMatch = QR_CODE_BASE_URL.match(/^https?:\/\//);
        if (protocolMatch) {
          return QR_CODE_BASE_URL.replace(/^https?:\/\//, `${currentProtocol}//`);
        }
        // Fallback: prepend protocol if missing
        return `${currentProtocol}//${QR_CODE_BASE_URL.replace(/^\/\//, '')}`;
      }
    }
    
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      console.warn("Accessing via localhost - QR codes may not work for network devices. Please set VITE_QR_CODE_BASE_URL in .env file.");
    }
    return origin;
  };

  // Initialize custom hooks
  const initialFormData = {
    color: [],
    ymStyle: "",
    buyerStyle: "",
    po: [],
    exFtyDate: [],
    factory: "",
    sendToHomeWashingDate: dateValue,
    images: [],
    notes: "",
  };

  const { formData, setFormData, handleInputChange: handleFormInputChange, resetForm } = useFormState(initialFormData);
  
  const {
    reports,
    isLoadingReports,
    expandedReports,
    printingReportId,
    setPrintingReportId,
    fetchReports,
    deleteReport,
    toggleReport,
  } = useReports();

  const {
    availableColors,
    availablePOs,
    availableETDs,
    isLoadingColors,
    fetchOrderColors,
    fetchYorksysOrderETD,
    resetOrderData,
  } = useOrderData();

  const {
    showReportDateQR,
    setShowReportDateQR,
    showReportDateScanner,
    setShowReportDateScanner,
    scanningReportId,
    setScanningReportId,
    generateQRCodeDataURL: generateQRCodeDataURLHook,
    downloadQRCode: downloadQRCodeHook,
    initializeScannerHook,
    stopScannerHook,
    handleQRCodeFileUploadHook,
    processQRScanResult,
    statusCheckIntervalRef,
  } = useQRCode(getQRCodeBaseURL);

  // Local scanner instance state (needed for custom scanner logic)
  const [html5QrCodeInstance, setHtml5QrCodeInstance] = useState(null);

  const {
    imageRotations,
    receivedImageRotations,
    completionImageRotations,
    reportImageRotations,
    setImageRotations,
    setReceivedImageRotations,
    setCompletionImageRotations,
    validateImageFile,
    handleImageUpload,
    handleRemoveImage,
    rotateFormImage,
    rotateReceivedImage,
    rotateCompletionImage,
    rotateReportImage,
  } = useImageHandling();

  const {
    isSubmitting,
    isSavingReceived,
    isSavingCompletion,
    submitReport,
    saveReceivedStatus,
    saveCompletionStatus,
    updateReport,
  } = useReportSubmission(user, fetchReports);

  // Received modal state
  const [showReceivedModal, setShowReceivedModal] = useState(false);
  const [receivedReportId, setReceivedReportId] = useState(null);
  const [receivedImages, setReceivedImages] = useState([]);
  const [receivedNotes, setReceivedNotes] = useState("");
  const [shouldUpdateReceivedStatus, setShouldUpdateReceivedStatus] = useState(false);

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionReportId, setCompletionReportId] = useState(null);
  const [completionImages, setCompletionImages] = useState([]);
  const [completionNotes, setCompletionNotes] = useState("");

  // Image viewer hook
  const {
    imageViewer,
    savedImageRotations,
    openImageViewer,
    closeImageViewer,
    goToNextImage,
    goToPreviousImage,
    rotateImageViewer,
    zoomImageViewer,
    toggleZoom,
    handleImageMouseDown,
    handleImageMouseMove,
    handleImageMouseUp,
    handlePanMove,
    downloadImageViewer,
  } = useImageViewer();

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  // Edit image modals state
  const [showEditInitialImagesModal, setShowEditInitialImagesModal] = useState(false);
  const [showEditReceivedImagesModal, setShowEditReceivedImagesModal] = useState(false);
  const [showEditCompletionImagesModal, setShowEditCompletionImagesModal] = useState(false);
  const [editingImageReport, setEditingImageReport] = useState(null);
  const [editingImageType, setEditingImageType] = useState(null); // 'initial', 'received', 'completion'
  const [editingImages, setEditingImages] = useState([]);
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);
  const [editFormData, setEditFormData] = useState({
    color: [],
    buyerStyle: "",
    po: [],
    exFtyDate: [],
    factory: "",
    sendToHomeWashingDate: "",
  });
  const [editAvailableColors, setEditAvailableColors] = useState([]);
  const [editAvailablePOs, setEditAvailablePOs] = useState([]);
  const [editAvailableETDs, setEditAvailableETDs] = useState([]);
  const [showEditColorDropdown, setShowEditColorDropdown] = useState(false);
  const [showEditPODropdown, setShowEditPODropdown] = useState(false);
  const [showEditETDDropdown, setShowEditETDDropdown] = useState(false);
  const editImageInputRef = useRef(null);
  const editInitialImagesInputRef = useRef(null);
  const editReceivedImagesInputRef = useRef(null);
  const editCompletionImagesInputRef = useRef(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("form"); // "form" or "reports"

  // normalizeImageUrl and getImageFilename are now imported from utils

  // Order_No autocomplete state
  const [orderNoSuggestions, setOrderNoSuggestions] = useState([]);
  const [showOrderNoSuggestions, setShowOrderNoSuggestions] = useState(false);
  const [isSearchingOrderNo, setIsSearchingOrderNo] = useState(false);
  
  // Debounce timer for auto-fetching colors when typing
  const colorFetchTimerRef = useRef(null);

  // Factory dropdown state
  const [factories, setFactories] = useState([]);
  const [isLoadingFactories, setIsLoadingFactories] = useState(false);

  // Dropdown states
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showPODropdown, setShowPODropdown] = useState(false);
  const [showETDDropdown, setShowETDDropdown] = useState(false);

  // Handle input change with order data clearing
  const handleInputChange = (field, value) => {
    handleFormInputChange(field, value, (field, value, newData, prev) => {
      // Clear color, PO, and ETD when Order_No changes manually
      if (field === "ymStyle" && prev.ymStyle !== value) {
        newData.color = [];
        newData.po = [];
        newData.exFtyDate = [];
        resetOrderData();
      }
    });

    // If Order_No field is being changed, search for suggestions
    if (field === "ymStyle" && value.length >= 2) {
      searchOrderNo(value);
      
      // Clear any existing timer
      if (colorFetchTimerRef.current) {
        clearTimeout(colorFetchTimerRef.current);
        colorFetchTimerRef.current = null;
      }
      
      // Auto-fetch colors when user stops typing (debounced)
      // Only fetch if it looks like a complete YM Style (min 4 chars, starts with letters)
      // Also check that value doesn't contain invalid characters like colons
      const trimmedValue = value.trim();
      if (trimmedValue.length >= 4 && /^[A-Za-z]{2,}/.test(trimmedValue) && !trimmedValue.includes(':')) {
        colorFetchTimerRef.current = setTimeout(() => {
          // Double-check the value hasn't changed while waiting
          // The trimmedValue is captured in closure, so we can safely use it
          if (trimmedValue.length >= 4 && !trimmedValue.includes(':')) {
            fetchOrderColors(trimmedValue, setFormData);
            fetchYorksysOrderETD(trimmedValue);
          }
        }, 800); // Wait 800ms after user stops typing
      }
    } else if (field === "ymStyle" && value.length < 2) {
      setOrderNoSuggestions([]);
      setShowOrderNoSuggestions(false);
      resetOrderData();
      
      // Clear timer if user deletes the value
      if (colorFetchTimerRef.current) {
        clearTimeout(colorFetchTimerRef.current);
        colorFetchTimerRef.current = null;
      }
    }
  };

  // Search Order_No from dt_orders collection
  const searchOrderNo = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOrderNoSuggestions([]);
      setShowOrderNoSuggestions(false);
      return;
    }

    setIsSearchingOrderNo(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/search-mono?term=${encodeURIComponent(searchTerm)}`
      );
      if (response.ok) {
        const suggestions = await response.json();
        setOrderNoSuggestions(suggestions);
        setShowOrderNoSuggestions(suggestions.length > 0);
      } else {
        setOrderNoSuggestions([]);
        setShowOrderNoSuggestions(false);
      }
    } catch (error) {
      console.error("Error searching Order_No:", error);
      setOrderNoSuggestions([]);
      setShowOrderNoSuggestions(false);
    } finally {
      setIsSearchingOrderNo(false);
    }
  };

  // Handle Order_No selection from suggestions
  const handleOrderNoSelect = async (orderNo) => {
    // Clear any pending color fetch timer since we're selecting from dropdown
    if (colorFetchTimerRef.current) {
      clearTimeout(colorFetchTimerRef.current);
      colorFetchTimerRef.current = null;
    }
    
    // Clear color, PO, and ETD when Order_No changes
    setFormData((prev) => ({
      ...prev,
      ymStyle: orderNo,
      color: [],
      po: [],
      exFtyDate: [],
    }));
    setShowOrderNoSuggestions(false);
    setOrderNoSuggestions([]);
    resetOrderData();

    // Fetch colors from dt_orders when Order_No is selected
    await fetchOrderColors(orderNo, setFormData);

    // Check if Order_No == moNo to get access to SKUData and fetch ETD
    await fetchYorksysOrderETD(orderNo);
  };

  // Handle image upload - store File objects instead of base64
  const handleImageUploadWrapper = (files) => {
    handleImageUpload(files, (prev) => ({
      ...prev,
      images: [...prev.images, ...Array.from(files).filter(f => validateImageFile(f))],
    }));
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter(f => validateImageFile(f));
      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...validFiles],
        }));
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle camera input change
  const handleCameraInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter(f => validateImageFile(f));
      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...validFiles],
        }));
      }
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  };

  // Trigger camera input
  const triggerCameraInput = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.setAttribute("capture", "environment");
      cameraInputRef.current.click();
    }
  };

  // Handle image remove
  const handleRemoveImageWrapper = (index) => {
    handleRemoveImage(
      index,
      formData.images,
      (prev) => setFormData((prevData) => ({ ...prevData, images: prev })),
      imageRotations,
      setImageRotations
    );
  };

  // Image viewer functions are now in useImageViewer hook

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await submitReport(formData, () => {
      // Switch to reports tab to show the newly submitted report
      setActiveTab("reports");
      // Reset form
      resetForm({
        color: [],
        ymStyle: "",
        buyerStyle: "",
        po: [],
        exFtyDate: [],
        factory: "",
        sendToHomeWashingDate: new Date().toISOString().split("T")[0],
        images: [],
        notes: "",
      });
      setImageRotations({});
      setShowColorDropdown(false);
      setShowPODropdown(false);
      setShowETDDropdown(false);
      resetOrderData();
    });
  };

  // Handle delete report - open confirmation modal
  const handleDelete = (id) => {
    setReportToDelete(id);
    setShowDeleteConfirm(true);
  };

  // Confirm delete report
  const confirmDelete = async () => {
    if (!reportToDelete) return;
    const success = await deleteReport(reportToDelete);
    if (success) {
      setShowDeleteConfirm(false);
      setReportToDelete(null);
    }
  };

  // Helper function to normalize date to YYYY-MM-DD format for date input
  const normalizeDateForInput = (dateString) => {
    if (!dateString) return new Date().toISOString().split("T")[0];

    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Try to parse the date and convert to YYYY-MM-DD
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    } catch (error) {
      console.error("Error parsing date:", error);
    }

    // If parsing fails, return today's date
    return new Date().toISOString().split("T")[0];
  };

  // Handle edit report - open modal and populate form
  const handleEditReport = async (report) => {
    setEditingReport(report);

    // Populate edit form with current report data
    setEditFormData({
      color: report.color || [],
      buyerStyle: report.buyerStyle || "",
      po: report.po || [],
      exFtyDate: report.exFtyDate || [],
      factory: report.factory || "",
      sendToHomeWashingDate: normalizeDateForInput(report.sendToHomeWashingDate),
    });

    // Fetch available options for the report's ymStyle
    if (report.ymStyle) {
      // Fetch colors
      try {
        const colorResponse = await fetch(
          `${API_BASE_URL}/api/order-details/${encodeURIComponent(report.ymStyle)}`
        );
        if (colorResponse.ok) {
          const orderData = await colorResponse.json();
          if (orderData.colors && Array.isArray(orderData.colors)) {
            const colorNames = orderData.colors
              .map(c => c.original || c)
              .filter(Boolean);
            const uniqueColors = [...new Set(colorNames)];
            setEditAvailableColors(uniqueColors);
          } else {
            setEditAvailableColors([]);
          }
        }
      } catch (error) {
        console.error("Error fetching order colors for edit:", error);
        setEditAvailableColors([]);
      }

      // Fetch ETD and PO
      try {
        const etdResponse = await fetch(
          `${API_BASE_URL}/api/yorksys-orders/by-style/${encodeURIComponent(report.ymStyle)}`
        );
        if (etdResponse.ok) {
          const result = await etdResponse.json();
          if (result.success && result.data && result.data.SKUData && Array.isArray(result.data.SKUData) && result.data.SKUData.length > 0) {
            // Get ETDs
            const allETDs = result.data.SKUData
              .map(sku => sku.ETD)
              .filter(etd => etd && etd.trim() !== "")
              .map(etd => {
                let etdDate = etd.trim();
                try {
                  if (/^\d{4}-\d{2}-\d{2}$/.test(etdDate)) {
                    return etdDate;
                  } else {
                    const parsedDate = new Date(etdDate);
                    if (!isNaN(parsedDate.getTime())) {
                      return parsedDate.toISOString().split("T")[0];
                    }
                  }
                } catch (dateError) {
                  console.error("Error parsing ETD date:", dateError);
                }
                return etdDate;
              })
              .filter(Boolean);
            const uniqueETDs = [...new Set(allETDs)].sort();
            setEditAvailableETDs(uniqueETDs);

            // Get POs
            const allPOLines = result.data.SKUData
              .map(sku => sku.POLine)
              .filter(poline => poline && poline.trim() !== "")
              .map(poline => poline.trim());
            const uniquePOLines = [...new Set(allPOLines)];
            setEditAvailablePOs(uniquePOLines);
          } else {
            setEditAvailablePOs([]);
            setEditAvailableETDs([]);
          }
        } else if (etdResponse.status === 404) {
          // Order not found - this is expected if Order_No doesn't match moNo or style
          setEditAvailablePOs([]);
          setEditAvailableETDs([]);
        } else {
          // Other error status
          console.error(`Error fetching yorksys order for edit: ${etdResponse.status} ${etdResponse.statusText}`);
          setEditAvailablePOs([]);
          setEditAvailableETDs([]);
        }
      } catch (error) {
        // Only log non-connection errors (connection errors are handled elsewhere)
        if (!error.message.includes("Failed to fetch") && !error.message.includes("ERR_CONNECTION_REFUSED")) {
          console.error("Error fetching yorksys order for edit:", error);
        }
        setEditAvailablePOs([]);
        setEditAvailableETDs([]);
      }
    }

    setShowEditModal(true);
  };

  // Handle edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editingReport) return;

    // Validate that at least one color is selected
    if (!editFormData.color || editFormData.color.length === 0) {
      showToast.warning("Please select at least one color");
      return;
    }

    try {
      const formDataToSubmit = new FormData();

      // Add form fields
      formDataToSubmit.append("color", JSON.stringify(editFormData.color || []));
      formDataToSubmit.append("buyerStyle", editFormData.buyerStyle || "");
      formDataToSubmit.append("po", JSON.stringify(editFormData.po || []));
      formDataToSubmit.append("exFtyDate", JSON.stringify(editFormData.exFtyDate || []));
      formDataToSubmit.append("factory", editFormData.factory || "");
      formDataToSubmit.append("sendToHomeWashingDate", editFormData.sendToHomeWashingDate || "");

      const reportId = editingReport._id || editingReport.id;
      const response = await fetch(`${API_BASE_URL}/api/report-washing/${reportId}`, {
        method: "PUT",
        body: formDataToSubmit,
      });

      const contentType = response.headers.get("content-type");
      let result;

      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);
        let errorMessage = `Server error (${response.status}): ${response.statusText}`;
        const preMatch = text.match(/<pre>([^<]+)<\/pre>/i);
        if (preMatch) {
          const errorText = preMatch[1];
          const errorMatch = errorText.match(/Error:\s*([^<]+)/i);
          if (errorMatch) {
            errorMessage = errorMatch[1].trim();
          } else {
            errorMessage = errorText.split('<br>')[0].trim();
          }
        }
        throw new Error(errorMessage);
      }

      if (response.ok && result.success) {
        showToast.success("Report updated successfully!");

        // Refresh reports list
        await fetchReports();

        // Close modal and reset
        setShowEditModal(false);
        setEditingReport(null);
        setEditFormData({
          color: [],
          buyerStyle: "",
          po: [],
          exFtyDate: [],
          factory: "",
          sendToHomeWashingDate: "",
        });
        setEditAvailableColors([]);
        setEditAvailablePOs([]);
        setEditAvailableETDs([]);
      } else {
        const errorMessage = result?.message || result?.error || `Server error (${response.status}): ${response.statusText}`;
        showToast.error(errorMessage);
        console.error("Error updating report:", result);
      }
    } catch (error) {
      console.error("Error updating report:", error);
      const errorMessage = error.message || "An error occurred while updating the report. Please try again.";
      showToast.error(errorMessage);
    }
  };

  // Initialize QR Code Scanner for a specific report
  const initializeScanner = async (reportId) => {
    try {
      if (html5QrCodeInstance) {
        await html5QrCodeInstance.stop();
        setHtml5QrCodeInstance(null);
      }

      const scannerId = `report-date-scanner-${reportId}`;
      const instance = new Html5Qrcode(scannerId);
      setHtml5QrCodeInstance(instance);
      setScanningReportId(reportId);

      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        // Prefer back camera
        const backCamera = cameras.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("environment")
        );
        const cameraId = backCamera ? backCamera.id : cameras[0].id;

        await instance.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          async (decodedText) => {
            // Check if scanned QR code is the Report Date QR
            // Support multiple formats:
            // 1. URL format: "http://...?scan=REPORT_ID" (from QR code)
            // 2. "REPORT_DATE_SCAN" (old format from UI)
            // 3. "REPORT_DATE_SCAN:REPORT_ID" (old format from PDF)
            let targetReportId = reportId;

            // Check if it's a URL format
            if (decodedText.includes("?scan=")) {
              try {
                const url = new URL(decodedText);
                const scanParam = url.searchParams.get("scan");
                if (scanParam) {
                  targetReportId = scanParam;
                } else {
                  showToast.warning("Invalid QR code. Missing report ID in URL.");
                  return;
                }
              } catch (error) {
                showToast.warning("Invalid QR code URL format.");
                return;
              }
            } else if (decodedText === "REPORT_DATE_SCAN") {
              // Old format - use current reportId from scanner context
              targetReportId = reportId;
            } else if (decodedText.startsWith("REPORT_DATE_SCAN:")) {
              // Old format from PDF - extract report ID from QR code
              const qrReportId = decodedText.split(":")[1];
              if (qrReportId) {
                targetReportId = qrReportId;
              }
            } else {
              // Not a valid report date QR code
              showToast.warning("Invalid QR code. Please scan the Report Date QR code.");
              return;
            }

            // Fetch current report to check status
            try {
              const reportResponse = await fetch(`${API_BASE_URL}/api/report-washing/${targetReportId}`);
              if (!reportResponse.ok) {
                showToast.error("Failed to fetch report details.");
                return;
              }

              const reportResult = await reportResponse.json();
              const currentReport = reportResult.data || reportResult;
              const currentStatus = currentReport.status || "pending";
              const currentDate = new Date().toISOString();
              const currentDateOnly = currentDate.split("T")[0];

              if (currentStatus === "pending" || !currentStatus) {
                // First scan - Open received modal (status will be updated when user saves)
                // Stop scanner and close all modals
                stopScanner();
                setShowReportDateScanner(null);
                setShowReportDateQR(null); // Close QR code modal if open

                // Open received modal for user to upload images and add notes
                setReceivedReportId(targetReportId);
                setReceivedImages([]);
                setReceivedNotes("");
                setShouldUpdateReceivedStatus(true); // Flag to update status when saving
                setShowReceivedModal(true);

                // Switch to Reports tab
                setActiveTab("reports");

                showToast.success(`QR Scan Success! Please add images and notes, then save to update status to "Received".`);
              } else if (currentStatus === "received") {
                // Second scan - Open completion modal
                stopScanner();
                setShowReportDateScanner(null);
                setShowReportDateQR(null); // Close QR code modal if open
                setCompletionReportId(targetReportId);
                setCompletionImages([]);
                setCompletionNotes("");
                setShowCompletionModal(true);
                // Switch to Reports tab
                setActiveTab("reports");
              } else if (currentStatus === "completed") {
                showToast.info("This report is already completed.");
                stopScanner();
                setShowReportDateScanner(null);
                // Switch to Reports tab to show the completed report
                setActiveTab("reports");
              } else {
                showToast.warning(`Report status is "${currentStatus}". Cannot process.`);
                // Switch to Reports tab anyway
                setActiveTab("reports");
              }
            } catch (error) {
              console.error("Error processing QR scan:", error);
              showToast.error("Failed to process QR code scan. Please try again.");
            }
          },
          (errorMessage) => {
            // Ignore scan errors (continuous scanning)
          }
        );
      }
    } catch (error) {
      console.error("Error initializing scanner:", error);
      showToast.error("Failed to initialize scanner. Please check camera permissions.");
      setShowReportDateScanner(null);
      setScanningReportId(null);
    }
  };

  // Stop QR Code Scanner (local version for custom logic)
  const stopScanner = useCallback(async () => {
    if (html5QrCodeInstance) {
      try {
        if (html5QrCodeInstance.isScanning) {
          await html5QrCodeInstance.stop();
        }
        await html5QrCodeInstance.clear();
      } catch (error) {
        console.error("Error stopping scanner:", error);
      } finally {
        setHtml5QrCodeInstance(null);
        setScanningReportId(null);
      }
    }
  }, [html5QrCodeInstance, setScanningReportId]);

  // Handle QR code file upload and scan
  const handleQRCodeFileUpload = async (event, reportId) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast.error("Invalid file type. Please upload an image file (PNG, JPG, JPEG, etc.).");
      event.target.value = "";
      return;
    }

    try {
      // Create a temporary container for Html5Qrcode (required by constructor)
      const tempContainer = document.createElement('div');
      tempContainer.id = 'temp-qr-file-scanner';
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);

      // Use Html5Qrcode to scan QR code from file
      const html5QrCode = new Html5Qrcode('temp-qr-file-scanner');
      let decodedText;
      
      try {
        decodedText = await html5QrCode.scanFile(file, false);
      } catch (scanError) {
        // Clean up temporary container
        document.body.removeChild(tempContainer);
        
        // Check if it's a QR code scanning error
        if (scanError && scanError.message) {
          if (scanError.message.includes("No QR code found") || scanError.message.includes("QR code parse error")) {
            showToast.error("No QR code found in the image. Please make sure the image contains a valid QR code and try again.");
          } else {
            showToast.error("Failed to scan QR code. The image may be corrupted or the QR code is not readable. Please try with a clearer image.");
          }
        } else {
          showToast.error("Failed to scan QR code from the image. Please ensure the image contains a valid QR code.");
        }
        event.target.value = "";
        return;
      }
      
      // Clean up temporary container
      document.body.removeChild(tempContainer);

      // Process the scanned QR code (same logic as camera scanner)
      let targetReportId = reportId;
      let isValidQRCode = false;

      if (decodedText.includes("?scan=")) {
        try {
          const url = new URL(decodedText);
          const scanParam = url.searchParams.get("scan");
          if (scanParam) {
            targetReportId = scanParam;
            isValidQRCode = true;
          } else {
            showToast.warning("This QR code is not valid. Please upload the QR code that is displayed in the current modal window.");
            event.target.value = "";
            return;
          }
        } catch (error) {
          showToast.warning("This QR code is not valid. Please upload the QR code that is displayed in the current modal window.");
          event.target.value = "";
          return;
        }
      } else if (decodedText === "REPORT_DATE_SCAN") {
        targetReportId = reportId;
        isValidQRCode = true;
      } else if (decodedText.startsWith("REPORT_DATE_SCAN:")) {
        const qrReportId = decodedText.split(":")[1];
        if (qrReportId) {
          targetReportId = qrReportId;
          isValidQRCode = true;
        }
      } else {
        showToast.warning("This QR code is not valid. Please upload the QR code that is displayed in the current modal window.");
        event.target.value = "";
        return;
      }

      // Check if the scanned QR code belongs to the current report
      if (isValidQRCode && targetReportId !== reportId) {
        showToast.error("This QR code is from a different report. Please upload the QR code that is displayed in the current modal window.");
        event.target.value = "";
        return;
      }

      // Fetch current report to check status
      let reportResponse;
      try {
        reportResponse = await fetch(`${API_BASE_URL}/api/report-washing/${targetReportId}`);
        if (!reportResponse.ok) {
          if (reportResponse.status === 404) {
            showToast.error("This QR code is from an old or deleted report. Please upload the QR code that is displayed in the current modal window.");
          } else {
            showToast.error("Unable to verify the report. Please try again.");
          }
          event.target.value = "";
          return;
        }
      } catch (fetchError) {
        console.error("Error fetching report:", fetchError);
        showToast.error("Network error. Failed to verify the report. Please check your connection and try again.");
        event.target.value = "";
        return;
      }

      const reportResult = await reportResponse.json();
      const currentReport = reportResult.data || reportResult;
      const currentStatus = currentReport.status || "pending";

      if (currentStatus === "pending" || !currentStatus) {
        setShowReportDateQR(null);
        setReceivedReportId(targetReportId);
        setReceivedImages([]);
        setReceivedNotes("");
        setShouldUpdateReceivedStatus(true);
        setShowReceivedModal(true);
        setActiveTab("reports");
        showToast.success(`QR Scan Success! Please add images and notes, then save to update status to "Received".`);
      } else if (currentStatus === "received") {
        setShowReportDateQR(null);
        setCompletionReportId(targetReportId);
        setCompletionImages([]);
        setCompletionNotes("");
        setShowCompletionModal(true);
        setActiveTab("reports");
      } else if (currentStatus === "completed") {
        showToast.info("This report is already completed.");
        setShowReportDateQR(null);
        setActiveTab("reports");
      } else {
        showToast.warning(`Report status is "${currentStatus}". Cannot process.`);
        setShowReportDateQR(null);
        setActiveTab("reports");
      }
    } catch (error) {
      console.error("Error scanning QR code from file:", error);
      
      // Provide more specific error messages based on error type
      if (error.message && error.message.includes("No QR code")) {
        showToast.error("No QR code found in the image. Please make sure the image contains a valid QR code and try again.");
      } else if (error.message && error.message.includes("parse")) {
        showToast.error("Failed to read the QR code. The image may be blurry or the QR code is damaged. Please try with a clearer image.");
      } else {
        showToast.error("Failed to scan QR code from file. Please make sure it's a valid QR code image file (PNG, JPG, JPEG) and try again.");
      }
      
      // Clean up temporary container if it exists
      const tempContainer = document.getElementById('temp-qr-file-scanner');
      if (tempContainer) {
        document.body.removeChild(tempContainer);
      }
    } finally {
      // Reset file input
      event.target.value = "";
    }
  };

  // Download QR code as image (wrapper for hook function)
  const downloadQRCode = downloadQRCodeHook;

  // Cleanup scanner on unmount or when scanner is closed
  useEffect(() => {
    if (!showReportDateScanner && html5QrCodeInstance) {
      stopScanner();
    }
    return () => {
      if (html5QrCodeInstance) {
        stopScanner();
      }
    };
  }, [showReportDateScanner, html5QrCodeInstance, stopScanner]);

  // Auto-close QR modal when status changes (scanned from another device)
  useEffect(() => {
    // Clear any existing interval
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }

    // If QR modal is open, start polling for status changes
    if (showReportDateQR) {
      const reportId = showReportDateQR;

      // Store initial status using ref to avoid re-renders
      const currentReport = reports.find(r => (r._id === reportId || r.id === reportId));
      const initialStatus = currentReport?.status || "pending";

      console.log(`[QR Polling] Started for report ${reportId}, initial status: ${initialStatus}`);

      // Use a ref to track status within the interval (avoids stale closure)
      let currentKnownStatus = initialStatus;

      // Poll every 2 seconds to check for status changes
      statusCheckIntervalRef.current = setInterval(async () => {
        try {
          console.log(`[QR Polling] Checking status for report ${reportId}...`);

          const response = await fetch(`${API_BASE_URL}/api/report-washing/${reportId}`);
          if (response.ok) {
            const result = await response.json();
            const report = result.data || result;
            const newStatus = report.status || "pending";

            console.log(`[QR Polling] Current status: ${currentKnownStatus}, New status: ${newStatus}`);

            // If status changed, close the QR modal and refresh
            if (newStatus !== currentKnownStatus) {
              console.log(`[QR Polling] ✓ Status changed from ${currentKnownStatus} to ${newStatus} - closing QR modal`);

              // Clear interval first
              if (statusCheckIntervalRef.current) {
                clearInterval(statusCheckIntervalRef.current);
                statusCheckIntervalRef.current = null;
              }

              // Close QR modal
              setShowReportDateQR(null);
              setShowReportDateScanner(null);

              // Show notification
              showToast.success(`✓ QR Scanned! Report status updated to "${newStatus}"`);

              // Refresh reports
              await fetchReports();

              // Switch to reports tab
              setActiveTab("reports");

              // Scroll to updated report with highlight
              setTimeout(() => {
                const reportElement = document.querySelector(`[data-report-id="${reportId}"]`);
                if (reportElement) {
                  reportElement.scrollIntoView({ behavior: "smooth", block: "center" });
                  reportElement.style.transition = "background-color 0.5s ease";
                  reportElement.style.backgroundColor = "#d4edda";
                  setTimeout(() => {
                    reportElement.style.backgroundColor = "";
                  }, 2000);
                }
              }, 200);
            } else {
              console.log(`[QR Polling] No status change detected, continuing to poll...`);
            }
          } else {
            console.error(`[QR Polling] Failed to fetch report: ${response.status}`);
          }
        } catch (error) {
          console.error("[QR Polling] Error checking report status:", error);
        }
      }, 2000); // Check every 2 seconds
    }

    // Cleanup on unmount or when modal closes
    return () => {
      if (statusCheckIntervalRef.current) {
        console.log("[QR Polling] Cleanup - stopping interval");
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    };
  }, [showReportDateQR, reports]);


  // Handle URL-based QR code scan (when page is opened via QR code URL)
  useEffect(() => {
    const scanReportId = searchParams.get("scan");
    if (scanReportId) {
      // Switch to Reports tab immediately when scan parameter is detected
      setActiveTab("reports");

      if (reports.length > 0) {
        // Find the report
        const report = reports.find(r => (r._id === scanReportId || r.id === scanReportId));
        if (report) {
          // Process the scan automatically
          processQRScanFromURL(scanReportId);
          // Clear the URL parameter
          setSearchParams({});
        }
      }
    }
  }, [searchParams, reports]);

  // Process QR scan from URL - Enhanced handler for QR scan success
  const processQRScanFromURL = async (targetReportId) => {
    if (!targetReportId) return;

    try {
      // Show loading state
      showToast.info("Processing QR code...");

      // Fetch current report to check status
      const reportResponse = await fetch(`${API_BASE_URL}/api/report-washing/${targetReportId}`);
      if (!reportResponse.ok) {
        showToast.error("Failed to fetch report details.");
        return;
      }

      const reportResult = await reportResponse.json();
      const currentReport = reportResult.data || reportResult;
      const currentStatus = currentReport.status || "pending";
      const currentDate = new Date().toISOString();
      const currentDateOnly = currentDate.split("T")[0];

      if (currentStatus === "pending" || !currentStatus) {
        // First scan - Open received modal (status will be updated when user saves)
        // 1. Close QR code modal immediately
        setShowReportDateQR(null);
        setShowReportDateScanner(null);

        // 2. Stop scanner if running
        if (html5QrCodeInstance) {
          try {
            await html5QrCodeInstance.stop();
            setHtml5QrCodeInstance(null);
          } catch (err) {
            console.log("Scanner already stopped");
          }
        }
        setScanningReportId(null);

        // 3. Open received modal for user to upload images and add notes
        setReceivedReportId(targetReportId);
        setReceivedImages([]);
        setReceivedNotes("");
        setShouldUpdateReceivedStatus(true); // Flag to update status when saving
        setShowReceivedModal(true);

        // 4. Switch to Reports tab
        setActiveTab("reports");

        showToast.success(`✓ QR Scan Success! Please add images and notes, then save to update status to "Received".`);
      } else if (currentStatus === "received") {
        // Second scan - Open completion modal
        // 1. Close QR code modal
        setShowReportDateQR(null);
        setShowReportDateScanner(null);

        // 2. Stop scanner if running
        if (html5QrCodeInstance) {
          try {
            await html5QrCodeInstance.stop();
            setHtml5QrCodeInstance(null);
          } catch (err) {
            console.log("Scanner already stopped");
          }
        }
        setScanningReportId(null);

        // 3. Open completion modal
        setCompletionReportId(targetReportId);
        setCompletionImages([]);
        setCompletionNotes("");
        setShowCompletionModal(true);

        // 4. Switch to Reports tab
        setActiveTab("reports");

        showToast.success("QR Scan Success! Please complete the report details.");
      } else if (currentStatus === "completed") {
        // Close modal and show info
        setShowReportDateQR(null);
        setShowReportDateScanner(null);

        showToast.info("This report is already completed.");

        // Switch to Reports tab to show the completed report
        setActiveTab("reports");

        // Scroll to the report
        setTimeout(() => {
          const reportElement = document.querySelector(`[data-report-id="${targetReportId}"]`);
          if (reportElement) {
            reportElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 200);
      } else {
        // Close modal for any other status
        setShowReportDateQR(null);
        setShowReportDateScanner(null);

        showToast.warning(`Report status is "${currentStatus}". Cannot process.`);

        // Switch to Reports tab anyway
        setActiveTab("reports");
      }
    } catch (error) {
      console.error("Error processing QR scan:", error);
      showToast.error("Failed to process QR code scan. Please try again.");

      // Close modal on error
      setShowReportDateQR(null);
      setShowReportDateScanner(null);
    }
  };

  // Handle received image upload
  const handleReceivedImageUpload = (files) => {
    if (!files || files.length === 0) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

    Array.from(files).forEach((file) => {
      const isValidType = allowedTypes.includes(file.type.toLowerCase());
      if (!isValidType) {
        showToast.error(`Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`);
        return;
      }
      setReceivedImages((prev) => [...prev, file]);
    });
  };

  // Handle received form submit - Save images and notes for received status
  const handleReceivedSubmit = async () => {
    if (!receivedReportId) return;

    const success = await saveReceivedStatus(
      receivedReportId,
      receivedImages,
      receivedNotes,
      shouldUpdateReceivedStatus,
      (reportId) => {
        // 1. Close received modal immediately
        setShowReceivedModal(false);

        // 2. Close QR code modal if it's open for this report
        if (showReportDateQR === reportId) {
          setShowReportDateQR(null);
          setShowReportDateScanner(null);
        }

        // 3. Reset received form data
        setReceivedReportId(null);
        setReceivedImages([]);
        setReceivedNotes("");
        setShouldUpdateReceivedStatus(false); // Clear the flag
        setReceivedImageRotations({}); // Clear received image rotations

        // 4. Scroll to updated report with visual feedback
        setTimeout(() => {
          const reportElement = document.querySelector(`[data-report-id="${reportId}"]`);
          if (reportElement) {
            reportElement.scrollIntoView({ behavior: "smooth", block: "center" });
            // Add a temporary highlight effect
            reportElement.style.transition = "background-color 0.5s ease";
            reportElement.style.backgroundColor = "#d4edda";
            setTimeout(() => {
              reportElement.style.backgroundColor = "";
            }, 2000);
          }
        }, 200);
      }
    );
  };

  // Handle completion image upload
  const handleCompletionImageUpload = (files) => {
    if (!files || files.length === 0) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

    Array.from(files).forEach((file) => {
      const isValidType = allowedTypes.includes(file.type.toLowerCase());
      if (!isValidType) {
        showToast.error(`Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`);
        return;
      }
      setCompletionImages((prev) => [...prev, file]);
    });
  };

  // Handle completion form submit - Enhanced with better feedback
  const handleCompletionSubmit = async () => {
    if (!completionReportId) return;

    const success = await saveCompletionStatus(
      completionReportId,
      completionImages,
      completionNotes,
      (reportId) => {
        // 1. Close completion modal immediately
        setShowCompletionModal(false);

        // 2. Close QR code modal if it's open for this report
        if (showReportDateQR === reportId) {
          setShowReportDateQR(null);
          setShowReportDateScanner(null);
        }

        // 3. Reset completion form data
        setCompletionReportId(null);
        setCompletionImages([]);
        setCompletionNotes("");
        setCompletionImageRotations({}); // Clear completion image rotations

        // 4. Scroll to updated report with visual feedback
        setTimeout(() => {
          const reportElement = document.querySelector(`[data-report-id="${reportId}"]`);
          if (reportElement) {
            reportElement.scrollIntoView({ behavior: "smooth", block: "center" });
            // Add a temporary highlight effect
            reportElement.style.transition = "background-color 0.5s ease";
            reportElement.style.backgroundColor = "#d1ecf1";
            setTimeout(() => {
              reportElement.style.backgroundColor = "";
            }, 2000);
          }
        }, 200);
      }
    );
  };

  // Handle edit initial images
  const handleEditInitialImages = (report) => {
    setEditingImageReport(report);
    setEditingImageType('initial');
    setEditingImages(report.images || []);
    setShowEditInitialImagesModal(true);
  };

  // Handle edit received images
  const handleEditReceivedImages = (report) => {
    setEditingImageReport(report);
    setEditingImageType('received');
    setEditingImages(report.receivedImages || []);
    setShowEditReceivedImagesModal(true);
  };

  // Handle edit completion images
  const handleEditCompletionImages = (report) => {
    setEditingImageReport(report);
    setEditingImageType('completion');
    setEditingImages(report.completionImages || []);
    setShowEditCompletionImagesModal(true);
  };

  // Handle image upload for edit modals
  const handleEditImageUpload = (files, type) => {
    if (!files || files.length === 0) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

    Array.from(files).forEach((file) => {
      const isValidType = allowedTypes.includes(file.type.toLowerCase());
      if (!isValidType) {
        showToast.error(`Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`);
        return;
      }
      setEditingImages((prev) => [...prev, file]);
    });
  };

  // Handle remove image from edit modal
  const handleRemoveEditImage = (index) => {
    setEditingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle update images
  const handleUpdateImages = async () => {
    if (!editingImageReport || !editingImageType) return;

    const reportId = editingImageReport._id || editingImageReport.id;
    setIsUpdatingImages(true);

    try {
      const formDataToSubmit = new FormData();

      // Determine which field name to use based on type
      const fieldName = editingImageType === 'initial' 
        ? 'images' 
        : editingImageType === 'received' 
          ? 'receivedImages' 
          : 'completionImages';

      // Separate new File objects from existing URLs
      const newImageFiles = editingImages.filter(img => img instanceof File);
      const existingImageUrls = editingImages.filter(img => typeof img === 'string');

      // Add new images (File objects) - these will be uploaded
      newImageFiles.forEach((file) => {
        formDataToSubmit.append(fieldName, file);
      });

      // Send the list of existing URLs to keep (so backend knows which ones to preserve)
      // We'll send this as a JSON string in a separate field
      if (existingImageUrls.length > 0) {
        formDataToSubmit.append(`${fieldName}Urls`, JSON.stringify(existingImageUrls));
      }

      const response = await fetch(`${API_BASE_URL}/api/report-washing/${reportId}`, {
        method: "PUT",
        body: formDataToSubmit,
      });

      const contentType = response.headers.get("content-type");
      let result;

      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);
        let errorMessage = `Server error (${response.status}): ${response.statusText}`;
        const preMatch = text.match(/<pre>([^<]+)<\/pre>/i);
        if (preMatch) {
          const errorText = preMatch[1];
          const errorMatch = errorText.match(/Error:\s*([^<]+)/i);
          if (errorMatch) {
            errorMessage = errorMatch[1].trim();
          } else {
            errorMessage = errorText.split('<br>')[0].trim();
          }
        }
        throw new Error(errorMessage);
      }

      if (response.ok && result.success) {
        showToast.success("Images updated successfully!");
        
        // Close modal
        setShowEditInitialImagesModal(false);
        setShowEditReceivedImagesModal(false);
        setShowEditCompletionImagesModal(false);
        setEditingImageReport(null);
        setEditingImageType(null);
        setEditingImages([]);

        // Refresh reports
        await fetchReports();
      } else {
        const errorMessage = result?.message || result?.error || `Server error (${response.status}): ${response.statusText}`;
        showToast.error(errorMessage);
        console.error("Error updating images:", result);
      }
    } catch (error) {
      console.error("Error updating images:", error);
      const errorMessage = error.message || "An error occurred while updating images. Please try again.";
      showToast.error(errorMessage);
    } finally {
      setIsUpdatingImages(false);
    }
  };

  // Generate QR code as data URL for PDF using QRCodeCanvas (wrapper for hook function)
  const generateQRCodeDataURL = async (value, size = 100) => {
    return generateQRCodeDataURLHook(value, size);
  };

  // Legacy function - now uses hook
  const generateQRCodeDataURLLegacy = async (value, size = 100) => {
    return new Promise((resolve) => {
      try {
        // Create a temporary container
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.width = `${size}px`;
        container.style.height = `${size}px`;
        container.style.background = "white";
        document.body.appendChild(container);

        // Dynamically import react-dom/client and render QR code
        import("react-dom/client").then(({ createRoot }) => {
          const root = createRoot(container);
          root.render(
            React.createElement(QRCodeCanvas, {
              value: value,
              size: size,
              level: "H",
              includeMargin: true
            })
          );

          // Wait for QR code to render, then get canvas data
          setTimeout(() => {
            const canvas = container.querySelector("canvas");
            if (canvas) {
              const dataURL = canvas.toDataURL("image/png");
              root.unmount();
              document.body.removeChild(container);
              resolve(dataURL);
            } else {
              root.unmount();
              document.body.removeChild(container);
              resolve(null);
            }
          }, 300);
        }).catch((error) => {
          console.error("Error importing react-dom/client:", error);
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
          resolve(null);
        });
      } catch (error) {
        console.error("Error generating QR code:", error);
        resolve(null);
      }
    });
  };

  // Handle Print PDF for single report
  const handlePrintPDF = async (report) => {
    const reportId = report._id || report.id;

    // Prevent multiple clicks
    if (printingReportId === reportId) {
      return;
    }

    setPrintingReportId(reportId);

    try {
      // Generate QR code data URL for the report - use URL format for mobile compatibility
      const qrCodeValue = `${getQRCodeBaseURL()}/laundry-washing-machine-test?scan=${reportId}`;
      const qrCodeDataURL = await generateQRCodeDataURL(qrCodeValue, 100);

      const blob = await pdf(<WashingMachineTestPDF report={report} apiBaseUrl={API_BASE_URL} qrCodeDataURL={qrCodeDataURL} />).toBlob();
      const url = URL.createObjectURL(blob);

      // Clean up any existing print iframes first
      const existingIframes = document.querySelectorAll('iframe[id^="print-iframe-"]');
      existingIframes.forEach(iframe => {
        try {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      });

      // Create a temporary iframe for printing
      const iframeId = `print-iframe-${Date.now()}`;
      const iframe = document.createElement("iframe");
      iframe.id = iframeId;
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";

      let printTriggered = false;
      let cleanupDone = false;

      // Function to cleanup
      const cleanup = () => {
        if (cleanupDone) return;
        cleanupDone = true;

        setTimeout(() => {
          try {
            if (iframe && iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          } catch (e) {
            // Ignore cleanup errors
          }
          // Revoke URL after print dialog has been shown
          setTimeout(() => {
            try {
              URL.revokeObjectURL(url);
            } catch (e) {
              // Ignore URL revocation errors
            }
          }, 2000);
        }, 500);
      };

      // Function to trigger print and cleanup
      const triggerPrint = () => {
        if (printTriggered) return;
        printTriggered = true;

        try {
          // Wait a bit more to ensure iframe content is fully loaded
          setTimeout(() => {
            if (iframe && iframe.contentWindow) {
              try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                cleanup();
              } catch (printError) {
                console.error("Error calling print:", printError);
                cleanup();
              }
            } else {
              cleanup();
            }
          }, 200);
        } catch (error) {
          console.error("Error printing:", error);
          cleanup();
        }
      };

      // Wait for iframe to load the PDF
      iframe.onload = () => {
        // Give more time for PDF to fully render
        setTimeout(triggerPrint, 300);
      };

      // Add error handler
      iframe.onerror = () => {
        console.error("Iframe load error");
        cleanup();
      };

      // Append iframe to DOM first
      document.body.appendChild(iframe);

      // Set the PDF URL after iframe is in DOM
      iframe.src = url;

      // Fallback timeout in case onload doesn't fire
      setTimeout(() => {
        if (!printTriggered) {
          try {
            if (iframe && iframe.contentDocument) {
              const readyState = iframe.contentDocument.readyState;
              if (readyState === "complete" || readyState === "interactive") {
                triggerPrint();
              } else {
                // If still loading, wait a bit more
                setTimeout(() => {
                  if (!printTriggered && iframe && iframe.contentDocument) {
                    triggerPrint();
                  }
                }, 500);
              }
            } else {
              // If iframe doesn't have contentDocument, try anyway
              triggerPrint();
            }
          } catch (e) {
            console.error("Error in fallback:", e);
            cleanup();
          }
        }
      }, 2000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast.error("Failed to generate PDF. Please try again.");
    } finally {
      // Reset printing state after a delay
      setTimeout(() => {
        setPrintingReportId(null);
      }, 3000);
    }
  };

  // Handle Download PDF for single report
  const handleDownloadPDF = async (report) => {
    try {
      // Generate QR code data URL for the report
      const reportId = report._id || report.id;
      const qrCodeValue = `REPORT_DATE_SCAN:${reportId}`;
      const qrCodeDataURL = await generateQRCodeDataURL(qrCodeValue, 100);

      const blob = await pdf(<WashingMachineTestPDF report={report} apiBaseUrl={API_BASE_URL} qrCodeDataURL={qrCodeDataURL} />).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Washing_Test_Report_${report.ymStyle || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      setTimeout(() => URL.revokeObjectURL(url), 100);

      showToast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast.error("Failed to generate PDF. Please try again.");
    }
  };

  // Handle Export Excel for single report
  const handleExportExcel = async (report) => {
    try {
      await generateWashingMachineTestExcel(report);
      showToast.success("Excel file downloaded successfully!");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      showToast.error("Failed to export Excel. Please try again.");
    }
  };

  // Fetch factories from subcon-sewing-factories-manage
  useEffect(() => {
    const fetchFactories = async () => {
      setIsLoadingFactories(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/subcon-sewing-factories-manage`
        );
        if (response.ok) {
          const data = await response.json();
          setFactories(data);
        } else {
          console.error("Failed to fetch factories");
          showToast.error("Failed to load factories. Please check your connection.");
        }
      } catch (error) {
        console.error("Error fetching factories:", error);
        // Check if it's a connection error
        if (error.message.includes("Failed to fetch") || error.message.includes("ERR_CONNECTION_REFUSED")) {
          showToast.error(`Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend server is running on port 5001.`);
        } else {
          showToast.error("Error loading factories. Please try again.");
        }
      } finally {
        setIsLoadingFactories(false);
      }
    };

    fetchFactories();
    fetchReports(); // Fetch reports on component mount
    
    // Cleanup timer on unmount
    return () => {
      if (colorFetchTimerRef.current) {
        clearTimeout(colorFetchTimerRef.current);
      }
    };
  }, []);

  // Close color, PO, and ETD dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColorDropdown && !event.target.closest('.color-dropdown-container')) {
        setShowColorDropdown(false);
      }
      if (showPODropdown && !event.target.closest('.po-dropdown-container')) {
        setShowPODropdown(false);
      }
      if (showETDDropdown && !event.target.closest('.etd-dropdown-container')) {
        setShowETDDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorDropdown, showPODropdown, showETDDropdown]);

  // Close edit color, PO, and ETD dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEditColorDropdown && !event.target.closest('.color-dropdown-container')) {
        setShowEditColorDropdown(false);
      }
      if (showEditPODropdown && !event.target.closest('.po-dropdown-container')) {
        setShowEditPODropdown(false);
      }
      if (showEditETDDropdown && !event.target.closest('.etd-dropdown-container')) {
        setShowEditETDDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEditColorDropdown, showEditPODropdown, showEditETDDropdown]);

  // Close QR code modal if report becomes completed
  useEffect(() => {
    if (showReportDateQR) {
      const report = reports.find(r => (r._id === showReportDateQR || r.id === showReportDateQR));
      if (report && report.status === "completed") {
        setShowReportDateQR(null);
      }
    }
  }, [reports, showReportDateQR]);

  // Keyboard and wheel support is now handled in ImageViewerModal component

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-gray-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg">
        <div className="p-4 md:p-6">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Launch Washing Machine Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Report Washing - Enter test details and view submitted reports
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("form")}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === "form"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  New Report
                </span>
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === "reports"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Reports ({reports.length})
                </span>
              </button>
            </nav>
          </div>

          {/* Form Section */}
          {activeTab === "form" && (
            <FormSection
              formData={formData}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              orderNoSuggestions={orderNoSuggestions}
              showOrderNoSuggestions={showOrderNoSuggestions}
              setShowOrderNoSuggestions={setShowOrderNoSuggestions}
              isSearchingOrderNo={isSearchingOrderNo}
              handleOrderNoSelect={handleOrderNoSelect}
              searchOrderNo={searchOrderNo}
              fetchOrderColors={fetchOrderColors}
              fetchYorksysOrderETD={fetchYorksysOrderETD}
              availableColors={availableColors}
              isLoadingColors={isLoadingColors}
              showColorDropdown={showColorDropdown}
              setShowColorDropdown={setShowColorDropdown}
              availablePOs={availablePOs}
              showPODropdown={showPODropdown}
              setShowPODropdown={setShowPODropdown}
              availableETDs={availableETDs}
              showETDDropdown={showETDDropdown}
              setShowETDDropdown={setShowETDDropdown}
              factories={factories}
              isLoadingFactories={isLoadingFactories}
              handleFileInputChange={handleFileInputChange}
              handleCameraInputChange={handleCameraInputChange}
              triggerFileInput={triggerFileInput}
              triggerCameraInput={triggerCameraInput}
              handleRemoveImage={handleRemoveImage}
              fileInputRef={fileInputRef}
              cameraInputRef={cameraInputRef}
              imageRotations={imageRotations}
            />
          )}

          {/* Form Section is now in FormSection component */}

          {/* Submitted Reports Section */}
          {activeTab === "reports" && (
            <ReportsList
              reports={reports}
              isLoadingReports={isLoadingReports}
              onRefresh={fetchReports}
              expandedReports={expandedReports}
              onToggleReport={toggleReport}
              onPrintPDF={handlePrintPDF}
              onDownloadPDF={handleDownloadPDF}
              onExportExcel={handleExportExcel}
              onEdit={handleEditReport}
              onDelete={handleDelete}
              onShowQRCode={(reportId) => setShowReportDateQR(showReportDateQR === reportId ? null : reportId)}
              printingReportId={printingReportId}
              savedImageRotations={savedImageRotations}
              openImageViewer={openImageViewer}
              setActiveTab={setActiveTab}
              onEditInitialImages={handleEditInitialImages}
              onEditReceivedImages={handleEditReceivedImages}
              onEditCompletionImages={handleEditCompletionImages}
            />
          )}

          {/* Old Reports Section - Removed */}
          {false && activeTab === "reports" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Form Report
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                  {/* YM Style */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      YM Style
                    </label>
                    <input
                      type="text"
                      value={formData.ymStyle}
                      onChange={(e) => handleInputChange("ymStyle", e.target.value)}
                      onFocus={() => {
                        if (formData.ymStyle.length >= 2) {
                          searchOrderNo(formData.ymStyle);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow click on suggestion
                        setTimeout(() => {
                          setShowOrderNoSuggestions(false);
                          // Fetch colors if Order_No is entered and looks like a valid style
                          // Only fetch if it looks like a complete YM Style (starts with letters, min 4 chars)
                          if (formData.ymStyle && formData.ymStyle.trim().length >= 4) {
                            const trimmedStyle = formData.ymStyle.trim();
                            // Only make API calls if it looks like a valid YM Style format
                            if (/^[A-Za-z]{2,}/.test(trimmedStyle)) {
                              fetchOrderColors(trimmedStyle);
                              // Also fetch ETD from yorksys_orders if Order_No == moNo
                              // Note: Browser console may show 404 errors if style doesn't exist in yorksys_orders
                              // This is normal browser behavior and cannot be prevented
                              fetchYorksysOrderETD(trimmedStyle);
                            }
                          }
                        }, 200);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                      placeholder="Search from Yorksys"
                    />
                    {isSearchingOrderNo && (
                      <div className="absolute right-3 top-9 text-gray-400">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                    {showOrderNoSuggestions && orderNoSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                        {orderNoSuggestions.map((orderNo, index) => (
                          <div
                            key={index}
                            onClick={() => handleOrderNoSelect(orderNo)}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                          >
                            {orderNo}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* COLOR - Multi-Select */}
                  <div className="relative color-dropdown-container">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      COLOR
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowColorDropdown(!showColorDropdown)}
                        disabled={isLoadingColors || !formData.ymStyle || availableColors.length === 0}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="truncate">
                          {isLoadingColors
                            ? "Loading colors..."
                            : !formData.ymStyle
                              ? "Select Order_No first"
                              : availableColors.length === 0
                                ? "No colors available"
                                : formData.color.length === 0
                                  ? "Select Color(s)"
                                  : formData.color.length === availableColors.length
                                    ? "All colors selected"
                                    : `${formData.color.length} color(s) selected`}
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform ${showColorDropdown ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showColorDropdown && availableColors.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  color: [...availableColors],
                                }));
                              }}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  color: [],
                                }));
                              }}
                              className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Available Colors:
                            </div>
                            <div className="space-y-1">
                              {availableColors.map((color, index) => (
                                <label
                                  key={index}
                                  className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.color.includes(color)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData((prev) => ({
                                          ...prev,
                                          color: [...prev.color, color],
                                        }));
                                      } else {
                                        setFormData((prev) => ({
                                          ...prev,
                                          color: prev.color.filter((c) => c !== color),
                                        }));
                                      }
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                  />
                                  <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                    {color}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {formData.ymStyle && availableColors.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {availableColors.length} color(s) available
                      </p>
                    )}
                  </div>


                  {/* Buyer Style */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Buyer Style <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.buyerStyle}
                      readOnly
                      placeholder="Select YM Style first"
                      className="w-full px-3 py-2 border border-gray-300  rounded-md  cursor-not-allowed"
                    />
                  </div>

                  {/* PO - Multi-Select */}
                  <div className="relative po-dropdown-container">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      PO <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowPODropdown(!showPODropdown)}
                        disabled={!formData.ymStyle}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="truncate">
                          {!formData.ymStyle
                            ? "Select YM Style first"
                            : availablePOs.length === 0
                              ? "No PO available (Optional)"
                              : formData.po.length === 0
                                ? "Select PO(s) (Optional)"
                                : formData.po.length === availablePOs.length
                                  ? "All PO(s) selected"
                                  : `${formData.po.length} PO(s) selected`}
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform ${showPODropdown ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showPODropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {availablePOs.length > 0 ? (
                            <>
                              <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      po: [...availablePOs],
                                    }));
                                  }}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  Select All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      po: [],
                                    }));
                                  }}
                                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                  Clear All
                                </button>
                              </div>
                              <div className="p-2">
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Available PO(s):
                                </div>
                                <div className="space-y-1">
                                  {availablePOs.map((po, index) => (
                                    <label
                                      key={index}
                                      className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={formData.po.includes(po)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setFormData((prev) => ({
                                              ...prev,
                                              po: [...prev.po, po],
                                            }));
                                          } else {
                                            setFormData((prev) => ({
                                              ...prev,
                                              po: prev.po.filter((p) => p !== po),
                                            }));
                                          }
                                        }}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                      />
                                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                        {po}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                              No PO available. This field is optional.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.ymStyle && availablePOs.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {availablePOs.length} PO(s) available
                      </p>
                    )}
                  </div>

                  {/* Ex Fty Date - Multi-Select */}
                  <div className="relative etd-dropdown-container">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ex Fty Date <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowETDDropdown(!showETDDropdown)}
                        disabled={!formData.ymStyle}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="truncate">
                          {!formData.ymStyle
                            ? "Select YM Style first"
                            : availableETDs.length === 0
                              ? "No ETD dates available (Optional)"
                              : formData.exFtyDate.length === 0
                                ? "Select ETD Date(s) (Optional)"
                                : formData.exFtyDate.length === availableETDs.length
                                  ? "All ETD dates selected"
                                  : `${formData.exFtyDate.length} date(s) selected`}
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform ${showETDDropdown ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showETDDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {availableETDs.length > 0 ? (
                            <>
                              <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      exFtyDate: [...availableETDs],
                                    }));
                                  }}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  Select All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      exFtyDate: [],
                                    }));
                                  }}
                                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                  Clear All
                                </button>
                              </div>
                              <div className="p-2">
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Available ETD Dates:
                                </div>
                                <div className="space-y-1">
                                  {availableETDs.map((etd, index) => (
                                    <label
                                      key={index}
                                      className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={formData.exFtyDate.includes(etd)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setFormData((prev) => ({
                                              ...prev,
                                              exFtyDate: [...prev.exFtyDate, etd],
                                            }));
                                          } else {
                                            setFormData((prev) => ({
                                              ...prev,
                                              exFtyDate: prev.exFtyDate.filter((d) => d !== etd),
                                            }));
                                          }
                                        }}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                      />
                                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                        {etd}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                              No ETD dates available. This field is optional.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.ymStyle && availableETDs.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {availableETDs.length} ETD date(s) available
                      </p>
                    )}
                  </div>

                  {/* Factory */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Factory
                    </label>
                    <Select
                      value={formData.factory ? { value: formData.factory, label: formData.factory } : null}
                      onChange={(selectedOption) => {
                        handleInputChange("factory", selectedOption ? selectedOption.value : "");
                      }}
                      options={factories.map((factory) => ({
                        value: factory.factory,
                        label: factory.factory
                      }))}
                      placeholder="Select Factory"
                      isSearchable={true}
                      isClearable={true}
                      isLoading={isLoadingFactories}
                      isDisabled={isLoadingFactories}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (baseStyles, state) => ({
                          ...baseStyles,
                          borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                          boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                          minHeight: '42px',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: '#3b82f6',
                          },
                        }),
                        menu: (baseStyles) => ({
                          ...baseStyles,
                          zIndex: 9999,
                        }),
                        option: (baseStyles, state) => ({
                          ...baseStyles,
                          backgroundColor: state.isSelected
                            ? '#3b82f6'
                            : state.isFocused
                              ? '#eff6ff'
                              : '#ffffff',
                          color: state.isSelected ? '#ffffff' : '#1f2937',
                          cursor: 'pointer',
                          '&:active': {
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                          },
                        }),
                        indicatorSeparator: () => ({
                          display: 'none',
                        }),
                        dropdownIndicator: (baseStyles) => ({
                          ...baseStyles,
                          cursor: 'pointer',
                        }),
                        clearIndicator: (baseStyles) => ({
                          ...baseStyles,
                          cursor: 'pointer',
                        }),
                      }}
                      theme={(theme) => ({
                        ...theme,
                        colors: {
                          ...theme.colors,
                          primary: '#3b82f6',
                          primary25: '#eff6ff',
                          primary50: '#dbeafe',
                          primary75: '#93c5fd',
                        },
                      })}
                    />
                    {isLoadingFactories && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Loading factories...
                      </p>
                    )}
                  </div>

                  {/* Report Date */}
                  {/* SEND To Home Washing Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SEND To Home Washing Date
                    </label>
                    <input
                      type="date"
                      value={formData.sendToHomeWashingDate}
                      onChange={(e) => handleInputChange("sendToHomeWashingDate", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>





                  {/* Image Upload */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Images
                    </label>
                    <div className="mt-1 space-y-4">
                      {/* Image Preview Area */}
                      {formData.images.length > 0 ? (
                        <div className="space-y-4">
                          {formData.images.map((imageFile, index) => {
                            // Create preview URL from File object
                            const imageUrl = URL.createObjectURL(imageFile);
                            return (
                              <div
                                key={index}
                                className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 p-3"
                              >
                                {/* Image Container */}
                                <div className="relative w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                                  <img
                                    src={imageUrl}
                                    alt={`Preview ${index + 1}`}
                                    className="max-w-xs max-h-64 object-contain rounded-md"
                                    onLoad={() => {
                                      // Clean up the object URL after image loads (optional, for memory management)
                                      // URL.revokeObjectURL(imageUrl);
                                    }}
                                  />
                                  {/* Control Buttons - Top Right */}
                                  <div className="absolute top-2 right-2 flex gap-2 z-10">
                                    {/* Remove Button - Red Circular X */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        URL.revokeObjectURL(imageUrl); // Clean up object URL
                                        handleRemoveImage(index);
                                      }}
                                      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                                      aria-label="Remove image"
                                      title="Remove"
                                    >
                                      <X size={18} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 p-8">
                          <div className="text-center text-gray-500 dark:text-gray-400">
                            <Upload size={40} className="mx-auto mb-2" />
                            <p>No image selected</p>
                          </div>
                        </div>
                      )}

                      {/* Capture and Upload Buttons */}
                      <div className="flex justify-center space-x-2">
                        <button
                          type="button"
                          onClick={triggerCameraInput}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors"
                        >
                          <Camera size={18} className="mr-2" />
                          Capture
                        </button>
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors"
                        >
                          <Upload size={18} className="mr-2" />
                          Upload
                        </button>
                      </div>

                      {/* Hidden File Inputs */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        multiple
                        onChange={handleFileInputChange}
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        capture="environment"
                        onChange={handleCameraInputChange}
                      />
                    </div>
                  </div>

                 

                  {/* Notes Field */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                      placeholder="Add any additional notes or comments about this report..."
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <RotateCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            </div>
          )}

        

          {/* Modals */}
          <ReceivedModal
            isOpen={showReceivedModal}
            onClose={() => {
              setShowReceivedModal(false);
              setReceivedReportId(null);
              setReceivedImages([]);
              setReceivedNotes("");
              setShouldUpdateReceivedStatus(false);
              setReceivedImageRotations({});
            }}
            receivedImages={receivedImages}
            setReceivedImages={setReceivedImages}
            receivedNotes={receivedNotes}
            setReceivedNotes={setReceivedNotes}
            receivedImageInputRef={receivedImageInputRef}
            handleReceivedImageUpload={handleReceivedImageUpload}
            handleReceivedSubmit={handleReceivedSubmit}
            isSavingReceived={isSavingReceived}
            receivedImageRotations={receivedImageRotations}
            setReceivedImageRotations={setReceivedImageRotations}
          />

          <CompletionModal
            isOpen={showCompletionModal}
            onClose={() => {
              setShowCompletionModal(false);
              setCompletionReportId(null);
              setCompletionImages([]);
              setCompletionNotes("");
              setCompletionImageRotations({});
            }}
            completionImages={completionImages}
            setCompletionImages={setCompletionImages}
            completionNotes={completionNotes}
            setCompletionNotes={setCompletionNotes}
            completionImageInputRef={completionImageInputRef}
            handleCompletionImageUpload={handleCompletionImageUpload}
            handleCompletionSubmit={handleCompletionSubmit}
            isSavingCompletion={isSavingCompletion}
            completionImageRotations={completionImageRotations}
            setCompletionImageRotations={setCompletionImageRotations}
          />

          <EditReportModal
            isOpen={showEditModal}
            editingReport={editingReport}
            editFormData={editFormData}
            setEditFormData={setEditFormData}
            editAvailableColors={editAvailableColors}
            editAvailablePOs={editAvailablePOs}
            editAvailableETDs={editAvailableETDs}
            showEditColorDropdown={showEditColorDropdown}
            setShowEditColorDropdown={setShowEditColorDropdown}
            showEditPODropdown={showEditPODropdown}
            setShowEditPODropdown={setShowEditPODropdown}
            showEditETDDropdown={showEditETDDropdown}
            setShowEditETDDropdown={setShowEditETDDropdown}
            factories={factories}
            isLoadingFactories={isLoadingFactories}
            onClose={() => {
              setShowEditModal(false);
              setEditingReport(null);
              setEditFormData({
                color: [],
                buyerStyle: "",
                po: [],
                exFtyDate: [],
                factory: "",
                sendToHomeWashingDate: "",
              });
              setEditAvailableColors([]);
              setEditAvailablePOs([]);
              setEditAvailableETDs([]);
            }}
            onSubmit={handleEditSubmit}
          />

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                    Delete Report
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                    Are you sure you want to delete this report?
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setReportToDelete(null);
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <QRCodeModal
            isOpen={!!showReportDateQR}
            reportId={showReportDateQR}
            onClose={() => setShowReportDateQR(null)}
            onDownloadQRCode={downloadQRCode}
            onUploadQRCode={handleQRCodeFileUpload}
            getQRCodeBaseURL={getQRCodeBaseURL}
            fileInputRef={fileInputRef}
          />

          <QRScannerModal
            isOpen={!!showReportDateScanner}
            reportId={showReportDateScanner}
            onClose={() => {
              stopScanner();
              setShowReportDateScanner(null);
            }}
            scannerElementId={showReportDateScanner ? `report-date-scanner-${showReportDateScanner}` : ""}
          />

          {/* Old Received Modal - Removed */}
          {false && showReceivedModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    Received Report
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Please upload images and add notes for this received report.
                  </p>

                  {/* Received Images */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Received Images
                    </label>
                    <div className="space-y-4">
                      {receivedImages.length > 0 && (
                        <div className="flex flex-row gap-2 overflow-x-auto">
                          {receivedImages.map((imageFile, index) => {
                            const imageUrl = URL.createObjectURL(imageFile);
                            const rotation = receivedImageRotations[index] || 0;
                            return (
                              <div key={index} className="relative w-32 h-32 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                                <div className="w-full h-full flex items-center justify-center">
                                  <img
                                    src={imageUrl}
                                    alt={`Received ${index + 1}`}
                                    className="max-w-full max-h-full object-contain transition-transform duration-300"
                                    style={{ transform: `rotate(${rotation}deg)` }}
                                  />
                                </div>
                                {/* Control Buttons */}
                                <div className="absolute top-1 right-1 flex flex-col gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      URL.revokeObjectURL(imageUrl);
                                      setReceivedImages((prev) => prev.filter((_, i) => i !== index));
                                      setReceivedImageRotations((prev) => {
                                        const newRotations = { ...prev };
                                        delete newRotations[index];
                                        return newRotations;
                                      });
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                                    title="Remove"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => receivedImageInputRef.current?.click()}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors"
                        >
                          <Camera size={18} className="mr-2" />
                          Capture
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/jpeg,image/jpg,image/png,image/gif,image/webp";
                            input.multiple = true;
                            input.onchange = (e) => handleReceivedImageUpload(e.target.files);
                            input.click();
                          }}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors"
                        >
                          <Upload size={18} className="mr-2" />
                          Upload
                        </button>
                      </div>
                      <input
                        ref={receivedImageInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        capture="environment"
                        multiple
                        onChange={(e) => {
                          handleReceivedImageUpload(e.target.files);
                          if (receivedImageInputRef.current) {
                            receivedImageInputRef.current.value = "";
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Received Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={receivedNotes}
                      onChange={(e) => setReceivedNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter received notes..."
                    />
                  </div>

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReceivedModal(false);
                        setReceivedReportId(null);
                        setReceivedImages([]);
                        setReceivedNotes("");
                        setShouldUpdateReceivedStatus(false); // Clear the flag when canceling
                        setReceivedImageRotations({}); // Clear received image rotations
                      }}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReceivedSubmit}
                      disabled={isSavingReceived}
                      className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSavingReceived ? (
                        <RotateCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isSavingReceived ? "Saving..." : "Save Received Details"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completion Modal */}
          {showCompletionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    Complete Report
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Please upload images and add notes to complete this report.
                  </p>

                  {/* Completion Images */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Completion Images
                    </label>
                    <div className="space-y-4">
                      {completionImages.length > 0 && (
                        <div className="flex flex-row gap-2 overflow-x-auto">
                          {completionImages.map((imageFile, index) => {
                            const imageUrl = URL.createObjectURL(imageFile);
                            const rotation = completionImageRotations[index] || 0;
                            return (
                              <div key={index} className="relative w-32 h-32 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                                <div className="w-full h-full flex items-center justify-center">
                                  <img
                                    src={imageUrl}
                                    alt={`Completion ${index + 1}`}
                                    className="max-w-full max-h-full object-contain transition-transform duration-300"
                                    style={{ transform: `rotate(${rotation}deg)` }}
                                  />
                                </div>
                                {/* Control Buttons */}
                                <div className="absolute top-1 right-1 flex flex-col gap-1">
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      URL.revokeObjectURL(imageUrl);
                                      setCompletionImages((prev) => prev.filter((_, i) => i !== index));
                                      setCompletionImageRotations((prev) => {
                                        const newRotations = { ...prev };
                                        delete newRotations[index];
                                        return newRotations;
                                      });
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                                    title="Remove"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => completionImageInputRef.current?.click()}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors"
                        >
                          <Camera size={18} className="mr-2" />
                          Capture
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/jpeg,image/jpg,image/png,image/gif,image/webp";
                            input.multiple = true;
                            input.onchange = (e) => handleCompletionImageUpload(e.target.files);
                            input.click();
                          }}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors"
                        >
                          <Upload size={18} className="mr-2" />
                          Upload
                        </button>
                      </div>
                      <input
                        ref={completionImageInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        capture="environment"
                        multiple
                        onChange={(e) => {
                          handleCompletionImageUpload(e.target.files);
                          if (completionImageInputRef.current) {
                            completionImageInputRef.current.value = "";
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Completion Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter completion notes..."
                    />
                  </div>

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCompletionModal(false);
                        setCompletionReportId(null);
                        setCompletionImages([]);
                        setCompletionNotes("");
                        setCompletionImageRotations({}); // Clear completion image rotations
                      }}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCompletionSubmit}
                      disabled={isSavingCompletion}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSavingCompletion ? (
                        <RotateCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {isSavingCompletion ? "Completing..." : "Complete Report"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Report Modal */}
          {showEditModal && editingReport && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
              onClick={() => {
                setShowEditModal(false);
                setEditingReport(null);
              }}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    Edit Report - {editingReport.ymStyle || "N/A"}
                  </h3>

                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Buyer Style - Read Only */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Buyer Style
                        </label>
                        <input
                          type="text"
                          value={editFormData.buyerStyle}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-not-allowed bg-gray-100 dark:bg-gray-700"
                        />
                      </div>

                      {/* Color - Multi-Select */}
                      <div className="relative color-dropdown-container">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          COLOR <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowEditColorDropdown(!showEditColorDropdown)}
                            disabled={editAvailableColors.length === 0}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="truncate">
                              {editAvailableColors.length === 0
                                ? "No colors available"
                                : editFormData.color.length === 0
                                  ? "Select Color(s)"
                                  : editFormData.color.length === editAvailableColors.length
                                    ? "All colors selected"
                                    : `${editFormData.color.length} color(s) selected`}
                            </span>
                            <svg
                              className={`w-4 h-4 transition-transform ${showEditColorDropdown ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {showEditColorDropdown && editAvailableColors.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      color: [...editAvailableColors],
                                    }));
                                  }}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  Select All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      color: [],
                                    }));
                                  }}
                                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                  Clear All
                                </button>
                              </div>
                              <div className="p-2">
                                {editAvailableColors.map((color, index) => (
                                  <label
                                    key={index}
                                    className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={editFormData.color.includes(color)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setEditFormData((prev) => ({
                                            ...prev,
                                            color: [...prev.color, color],
                                          }));
                                        } else {
                                          setEditFormData((prev) => ({
                                            ...prev,
                                            color: prev.color.filter((c) => c !== color),
                                          }));
                                        }
                                      }}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                      {color}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PO - Multi-Select */}
                      <div className="relative po-dropdown-container">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          PO <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowEditPODropdown(!showEditPODropdown)}
                            disabled={editAvailablePOs.length === 0}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="truncate">
                              {editAvailablePOs.length === 0
                                ? "No PO available (Optional)"
                                : editFormData.po.length === 0
                                  ? "Select PO(s) (Optional)"
                                  : editFormData.po.length === editAvailablePOs.length
                                    ? "All PO(s) selected"
                                    : `${editFormData.po.length} PO(s) selected`}
                            </span>
                            <svg
                              className={`w-4 h-4 transition-transform ${showEditPODropdown ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {showEditPODropdown && editAvailablePOs.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      po: [...editAvailablePOs],
                                    }));
                                  }}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  Select All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      po: [],
                                    }));
                                  }}
                                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                  Clear All
                                </button>
                              </div>
                              <div className="p-2">
                                {editAvailablePOs.map((po, index) => (
                                  <label
                                    key={index}
                                    className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={editFormData.po.includes(po)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setEditFormData((prev) => ({
                                            ...prev,
                                            po: [...prev.po, po],
                                          }));
                                        } else {
                                          setEditFormData((prev) => ({
                                            ...prev,
                                            po: prev.po.filter((p) => p !== po),
                                          }));
                                        }
                                      }}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                      {po}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ex Fty Date - Multi-Select */}
                      <div className="relative etd-dropdown-container">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Ex Fty Date <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowEditETDDropdown(!showEditETDDropdown)}
                            disabled={editAvailableETDs.length === 0}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="truncate">
                              {editAvailableETDs.length === 0
                                ? "No ETD dates available (Optional)"
                                : editFormData.exFtyDate.length === 0
                                  ? "Select ETD Date(s) (Optional)"
                                  : editFormData.exFtyDate.length === editAvailableETDs.length
                                    ? "All ETD dates selected"
                                    : `${editFormData.exFtyDate.length} date(s) selected`}
                            </span>
                            <svg
                              className={`w-4 h-4 transition-transform ${showEditETDDropdown ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {showEditETDDropdown && editAvailableETDs.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      exFtyDate: [...editAvailableETDs],
                                    }));
                                  }}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  Select All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      exFtyDate: [],
                                    }));
                                  }}
                                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                  Clear All
                                </button>
                              </div>
                              <div className="p-2">
                                {editAvailableETDs.map((etd, index) => (
                                  <label
                                    key={index}
                                    className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={editFormData.exFtyDate.includes(etd)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setEditFormData((prev) => ({
                                            ...prev,
                                            exFtyDate: [...prev.exFtyDate, etd],
                                          }));
                                        } else {
                                          setEditFormData((prev) => ({
                                            ...prev,
                                            exFtyDate: prev.exFtyDate.filter((d) => d !== etd),
                                          }));
                                        }
                                      }}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                      {etd}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Factory */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Factory
                        </label>
                        <Select
                          value={editFormData.factory ? { value: editFormData.factory, label: editFormData.factory } : null}
                          onChange={(selectedOption) => {
                            setEditFormData((prev) => ({
                              ...prev,
                              factory: selectedOption ? selectedOption.value : "",
                            }));
                          }}
                          options={factories.map((factory) => ({
                            value: factory.factory,
                            label: factory.factory
                          }))}
                          placeholder="Select Factory"
                          isSearchable={true}
                          isClearable={true}
                          isLoading={isLoadingFactories}
                          isDisabled={isLoadingFactories}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          styles={{
                            control: (baseStyles, state) => ({
                              ...baseStyles,
                              borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                              boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                              minHeight: '42px',
                              backgroundColor: '#ffffff',
                              cursor: 'pointer',
                              '&:hover': {
                                borderColor: '#3b82f6',
                              },
                            }),
                            menu: (baseStyles) => ({
                              ...baseStyles,
                              zIndex: 9999,
                            }),
                            option: (baseStyles, state) => ({
                              ...baseStyles,
                              backgroundColor: state.isSelected
                                ? '#3b82f6'
                                : state.isFocused
                                  ? '#eff6ff'
                                  : '#ffffff',
                              color: state.isSelected ? '#ffffff' : '#1f2937',
                              cursor: 'pointer',
                              '&:active': {
                                backgroundColor: '#3b82f6',
                                color: '#ffffff',
                              },
                            }),
                            indicatorSeparator: () => ({
                              display: 'none',
                            }),
                            dropdownIndicator: (baseStyles) => ({
                              ...baseStyles,
                              cursor: 'pointer',
                            }),
                            clearIndicator: (baseStyles) => ({
                              ...baseStyles,
                              cursor: 'pointer',
                            }),
                          }}
                          theme={(theme) => ({
                            ...theme,
                            colors: {
                              ...theme.colors,
                              primary: '#3b82f6',
                              primary25: '#eff6ff',
                              primary50: '#dbeafe',
                              primary75: '#93c5fd',
                            },
                          })}
                        />
                      </div>

                      {/* Send To Home Washing Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          SEND To Home Washing Date
                        </label>
                        <input
                          type="date"
                          value={editFormData.sendToHomeWashingDate}
                          onChange={(e) => setEditFormData((prev) => ({
                            ...prev,
                            sendToHomeWashingDate: e.target.value,
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingReport(null);
                          setEditFormData({
                            color: [],
                            buyerStyle: "",
                            po: [],
                            exFtyDate: [],
                            factory: "",
                            sendToHomeWashingDate: "",
                          });
                          setEditAvailableColors([]);
                          setEditAvailablePOs([]);
                          setEditAvailableETDs([]);
                        }}
                        className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Update Report
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Modal */}
          {showReportDateQR && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowReportDateQR(null)}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button in top right */}
                <button
                  type="button"
                  onClick={() => setShowReportDateQR(null)}
                  className="absolute top-0 right-0 m-0 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-tl-lg rounded-br-lg transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
                
                <div className="p-6">
                  <div className="flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Scan this QR code to set Report Date
                    </h3>
                    <div 
                      id={`qr-code-${showReportDateQR}`}
                      className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-4 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                      onClick={() => downloadQRCode(showReportDateQR)}
                      title="Click to download QR code"
                    >
                      <QRCode
                        value={`${getQRCodeBaseURL()}/laundry-washing-machine-test?scan=${showReportDateQR}`}
                        size={256}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      />
                    </div>
                    <div className="w-full">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => handleQRCodeFileUpload(e, showReportDateQR)}
                        className="hidden"
                        id={`qr-upload-${showReportDateQR}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById(`qr-upload-${showReportDateQR}`);
                          if (input) input.click();
                        }}
                        className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Upload size={16} />
                        Upload QR Code to Scan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Scanner Modal */}
          {showReportDateScanner && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => {
                stopScanner();
                setShowReportDateScanner(null);
              }}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Scan QR code to capture Report Date
                    </h3>
                    <div
                      id={`report-date-scanner-${showReportDateScanner}`}
                      className="w-full max-w-md mb-4"
                      style={{ minHeight: "300px" }}
                    ></div>
                    <button
                      type="button"
                      onClick={() => {
                        stopScanner();
                        setShowReportDateScanner(null);
                      }}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Close Scanner
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Initial Images Modal */}
          {showEditInitialImagesModal && editingImageReport && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    Edit Initial Images - {editingImageReport.ymStyle || "N/A"}
                  </h3>
                  
                  {/* Current Images */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Images ({editingImages.length})
                    </label>
                    <div className="space-y-4">
                      {editingImages.length > 0 && (
                        <div className="flex flex-row flex-wrap gap-2">
                          {editingImages.map((image, index) => {
                            const imageUrl = image instanceof File ? URL.createObjectURL(image) : normalizeImageUrl(image);
                            return (
                              <div key={index} className="relative w-32 h-32 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                                <div className="w-full h-full flex items-center justify-center">
                                  <img
                                    src={imageUrl}
                                    alt={`Image ${index + 1}`}
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                                  title="Remove"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editInitialImagesInputRef.current?.click()}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors"
                        >
                          <Camera size={18} className="mr-2" />
                          Capture
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/jpeg,image/jpg,image/png,image/gif,image/webp";
                            input.multiple = true;
                            input.onchange = (e) => handleEditImageUpload(e.target.files, 'initial');
                            input.click();
                          }}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors"
                        >
                          <Upload size={18} className="mr-2" />
                          Upload
                        </button>
                      </div>
                      <input
                        ref={editInitialImagesInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        capture="environment"
                        multiple
                        onChange={(e) => {
                          handleEditImageUpload(e.target.files, 'initial');
                          if (editInitialImagesInputRef.current) {
                            editInitialImagesInputRef.current.value = "";
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditInitialImagesModal(false);
                        setEditingImageReport(null);
                        setEditingImageType(null);
                        setEditingImages([]);
                      }}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateImages}
                      disabled={isUpdatingImages}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isUpdatingImages ? (
                        <RotateCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isUpdatingImages ? "Updating..." : "Update Images"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Received Images Modal */}
          {showEditReceivedImagesModal && editingImageReport && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    Edit Received Images - {editingImageReport.ymStyle || "N/A"}
                  </h3>
                  
                  {/* Current Images */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Images ({editingImages.length})
                    </label>
                    <div className="space-y-4">
                      {editingImages.length > 0 && (
                        <div className="flex flex-row flex-wrap gap-2">
                          {editingImages.map((image, index) => {
                            const imageUrl = image instanceof File ? URL.createObjectURL(image) : normalizeImageUrl(image);
                            return (
                              <div key={index} className="relative w-32 h-32 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                                <div className="w-full h-full flex items-center justify-center">
                                  <img
                                    src={imageUrl}
                                    alt={`Image ${index + 1}`}
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                                  title="Remove"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editReceivedImagesInputRef.current?.click()}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors"
                        >
                          <Camera size={18} className="mr-2" />
                          Capture
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/jpeg,image/jpg,image/png,image/gif,image/webp";
                            input.multiple = true;
                            input.onchange = (e) => handleEditImageUpload(e.target.files, 'received');
                            input.click();
                          }}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors"
                        >
                          <Upload size={18} className="mr-2" />
                          Upload
                        </button>
                      </div>
                      <input
                        ref={editReceivedImagesInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        capture="environment"
                        multiple
                        onChange={(e) => {
                          handleEditImageUpload(e.target.files, 'received');
                          if (editReceivedImagesInputRef.current) {
                            editReceivedImagesInputRef.current.value = "";
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditReceivedImagesModal(false);
                        setEditingImageReport(null);
                        setEditingImageType(null);
                        setEditingImages([]);
                      }}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateImages}
                      disabled={isUpdatingImages}
                      className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isUpdatingImages ? (
                        <RotateCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isUpdatingImages ? "Updating..." : "Update Images"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Completion Images Modal */}
          {showEditCompletionImagesModal && editingImageReport && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    Edit Completion Images - {editingImageReport.ymStyle || "N/A"}
                  </h3>
                  
                  {/* Current Images */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Images ({editingImages.length})
                    </label>
                    <div className="space-y-4">
                      {editingImages.length > 0 && (
                        <div className="flex flex-row flex-wrap gap-2">
                          {editingImages.map((image, index) => {
                            const imageUrl = image instanceof File ? URL.createObjectURL(image) : normalizeImageUrl(image);
                            return (
                              <div key={index} className="relative w-32 h-32 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                                <div className="w-full h-full flex items-center justify-center">
                                  <img
                                    src={imageUrl}
                                    alt={`Image ${index + 1}`}
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                                  title="Remove"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editCompletionImagesInputRef.current?.click()}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors"
                        >
                          <Camera size={18} className="mr-2" />
                          Capture
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/jpeg,image/jpg,image/png,image/gif,image/webp";
                            input.multiple = true;
                            input.onchange = (e) => handleEditImageUpload(e.target.files, 'completion');
                            input.click();
                          }}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors"
                        >
                          <Upload size={18} className="mr-2" />
                          Upload
                        </button>
                      </div>
                      <input
                        ref={editCompletionImagesInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        capture="environment"
                        multiple
                        onChange={(e) => {
                          handleEditImageUpload(e.target.files, 'completion');
                          if (editCompletionImagesInputRef.current) {
                            editCompletionImagesInputRef.current.value = "";
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditCompletionImagesModal(false);
                        setEditingImageReport(null);
                        setEditingImageType(null);
                        setEditingImages([]);
                      }}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateImages}
                      disabled={isUpdatingImages}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isUpdatingImages ? (
                        <RotateCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isUpdatingImages ? "Updating..." : "Update Images"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image Viewer Modal */}
          <ImageViewerModal
            isOpen={imageViewer.isOpen}
            imageUrl={imageViewer.imageUrl}
            imageTitle={imageViewer.imageTitle}
            images={imageViewer.images}
            currentIndex={imageViewer.currentIndex}
            rotation={imageViewer.rotation}
            zoom={imageViewer.zoom}
            panX={imageViewer.panX}
            panY={imageViewer.panY}
            isDragging={imageViewer.isDragging}
            onClose={closeImageViewer}
            onNextImage={goToNextImage}
            onPreviousImage={goToPreviousImage}
            onRotate={rotateImageViewer}
            onZoom={zoomImageViewer}
            onPanStart={handleImageMouseDown}
            onPanMove={handleImageMouseMove}
            onPanEnd={handleImageMouseUp}
            onToggleZoom={toggleZoom}
            onDownload={downloadImageViewer}
          />

        </div>
      </div>
    </div>
  );
};

export default LaundryWashingMachineTest;