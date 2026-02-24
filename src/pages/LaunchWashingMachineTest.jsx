import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/authentication/AuthContext";
import { useSearchParams } from "react-router-dom";
import { HiDocumentAdd, HiClipboardList } from "react-icons/hi";
import {
  MdWarehouse,
  MdLocalLaundryService,
  MdOutlineDeviceThermostat,
  MdOutlineImagesearchRoller,
  MdOutlineExpand,
  MdAssignmentInd,
} from "react-icons/md";
import { Camera } from "lucide-react";
import { Select, Checkbox } from "antd";
import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE_URL, QR_CODE_BASE_URL } from "../../config.js";
import { pdf } from "@react-pdf/renderer";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeCanvas } from "qrcode.react";
import WashingMachineTestPDF from "../components/inspection/WashingTesting/WashingMachineTestPDF";
import generateWashingMachineTestExcel from "../components/inspection/WashingTesting/WashingMachineTestExcel";
import GameAssignControl from "../components/inspection/WashingTesting/assign_control/GameAssignControl";
import {
  ImageViewerModal,
  useImageViewer,
  FormSection,
  DynamicFormSection,
  ReportsList,
  ReceivedModal,
  CompletionModal,
  DeleteConfirmationModal,
  RejectReportModal,
  EditImagesModal,
  EditReportModal,
  QRCodeModal,
  QRScannerModal,
  useOrderData,
  useQRCode,
  useImageHandling,
  useReportSubmission,
  // Constants
  getQRCodeBaseURL,
  getCurrentDate,
  IMAGE_LIMITS,
  TABS,
  REPORT_TYPES,
  getReportTypeConfig,
  getImageFilename,
  getInitialFormData,
  getCompletionNotesField,
  normalizeDateForInput, // Added import
  // Edit handlers (only used ones)
  prepareEditFormData,
  handleEditFormSubmit,
  // Order handlers
  handleOrderNoSearch,
  handleOrderNoSelection,
  shouldAutoFetchColors,
  // Image handlers (being used)
  handleFileInputChange as handleFileInputChangeHandler,
  handleCameraInputChange as handleCameraInputChangeHandler,
  triggerFileInput as triggerFileInputHandler,
  triggerCameraInput as triggerCameraInputHandler,
} from "../components/inspection/WashingTesting/lib";
import showToast from "../utils/toast";
import {
  useWashingFilterStore,
  useModalStore,
  useWashingReportsStore,
  useFormStore,
  useOrderDataStore,
  useAssignControlStore,
  computeUserRoles,
} from "../stores/washing";

const LaundryWashingMachineTest = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateValue = getCurrentDate(); // Use helper instead of inline code
  const fileInputRef = useRef(null);
  const scannerUploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const receivedImageInputRef = useRef(null);
  const completionImageInputRef = useRef(null);

  // ─── Form store (replaces useFormState + scattered UI states) ───────
  // Seed the store synchronously before the first render so child
  // components never receive undefined for array fields (e.g. formData.images).
  if (!useFormStore.getState().formData.reportType) {
    useFormStore.getState().resetForm(getInitialFormData(REPORT_TYPES.GARMENT_WASH));
  }

  const {
    formData,
    setFormData,
    handleInputChange: handleFormInputChange,
    resetForm,
    orderNoSuggestions, setOrderNoSuggestions,
    showOrderNoSuggestions, setShowOrderNoSuggestions,
    isSearchingOrderNo, setIsSearchingOrderNo,
    showColorDropdown, setShowColorDropdown,
    showPODropdown, setShowPODropdown,
    showETDDropdown, setShowETDDropdown,
    isReportTypeOpen, setIsReportTypeOpen,
    activeTab, setActiveTab,
  } = useFormStore();

  // ─── Reports store (replaces two separate useReports instances) ─────
  const {
    standard: { reports, isLoading: isLoadingReports, printingReportId, pagination },
    warehouse: { reports: whReports, isLoading: isLoadingWhReports, printingReportId: whPrintingReportId, pagination: whPagination },
    fetchReports: _fetchReports,
    deleteReport: _deleteReport,
    rejectReport: _rejectReport,
    setPrintingReportId: _setPrintingReportId,
  } = useWashingReportsStore();

  // Stable tab-scoped wrappers (store fns are stable, empty dep array is safe)
  const fetchReports = useCallback((f) => _fetchReports("standard", f), []);  // eslint-disable-line
  const setPrintingReportId = useCallback((id) => _setPrintingReportId("standard", id), []);  // eslint-disable-line
  const setWhPrintingReportId = useCallback((id) => _setPrintingReportId("warehouse", id), []);  // eslint-disable-line

  // ─── Order data hook (fetch actions only — state lives in useOrderDataStore) ─
  const {
    fetchOrderColors,
    fetchUsedColors,
    fetchYorksysOrderETD,
    fetchAnfSpecs,
    resetOrderData,
  } = useOrderData();

  const {
    generateQRCodeDataURL: generateQRCodeDataURLHook,
    downloadQRCode: downloadQRCodeHook,
    printQRCode,
    statusCheckIntervalRef,
  } = useQRCode(() => getQRCodeBaseURL(QR_CODE_BASE_URL)); // Use helper function

  // Local scanner instance state (needed for custom scanner logic)
  const [html5QrCodeInstance, setHtml5QrCodeInstance] = useState(null);
  const [scannerFlashOn, setScannerFlashOn] = useState(false);

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
  } = useImageHandling();

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

  // ─── Filter store (replaces 18 individual useState hooks) ───────────
  // ReportsList reads & writes filters directly from useWashingFilterStore.
  // No per-field aliases needed here — the store is read via getState() in callbacks.
  const { standard: _stdF, warehouse: _whF } = useWashingFilterStore();

  // Refresh both tabs using current store state (no stale-closure dependencies)
  const refreshAllReports = useCallback(async () => {
    const { standard: sf, warehouse: wf } = useWashingFilterStore.getState();
    const { ymStyle, style } = useFormStore.getState().formData;

    const promises = [
      _fetchReports("standard", sf),
      _fetchReports("warehouse", wf),
    ];
    if (ymStyle || style) promises.push(fetchUsedColors(ymStyle || style));

    await Promise.all(promises);
  }, [_fetchReports, fetchUsedColors]); // eslint-disable-line

  const {
    submitReport,
    saveReceivedStatus,
    saveCompletionStatus,
    updateReport,
  } = useReportSubmission(user, refreshAllReports);

  // ─── Modal store (replaces ~20 individual useState hooks) ───────────
  const {
    receivedModal,
    openReceivedModal,
    closeReceivedModal,
    setReceivedImages,
    setReceivedNotes,
    setShouldUpdateReceivedStatus,
    completionModal,
    openCompletionModal,
    closeCompletionModal,
    setCompletionImages,
    setCompletionNotes,
    completingReport,
    setCompletingReport,
    deleteModal,
    openDeleteModal,
    closeDeleteModal,
    rejectModal,
    openRejectModal,
    closeRejectModal,
    editModal,
    openEditModal,
    closeEditModal,
    editImagesModal,
    openEditImagesModal,
    closeEditImagesModal,
    setEditImages,
    setEditNotes,
    setIsUpdatingImages,
    editFormData,
    setEditFormData,
    editAvailableColors, setEditAvailableColors,
    editAvailablePOs, setEditAvailablePOs,
    editAvailableETDs, setEditAvailableETDs,
    showEditColorDropdown, setShowEditColorDropdown,
    showEditPODropdown, setShowEditPODropdown,
    showEditETDDropdown, setShowEditETDDropdown,
    // ─── QR states (moved from useQRCode) ───────────────────────────
    showReportDateQR, setShowReportDateQR,
    showReportDateScanner, setShowReportDateScanner,
    scanningReportId, setScanningReportId,
  } = useModalStore();

  // ─── Modal store value shortcuts ────────────────────────────────────
  const showReceivedModal = receivedModal.isOpen;
  const receivedReportId = receivedModal.reportId;
  const receivedImages = receivedModal.images;
  const receivedNotes = receivedModal.notes;
  const shouldUpdateReceivedStatus = receivedModal.shouldUpdateStatus;
  const showCompletionModal = completionModal.isOpen;
  const completionReportId = completionModal.reportId;
  const completionImages = completionModal.images;
  const completionNotes = completionModal.notes;
  const showDeleteConfirm = deleteModal.isOpen;
  const reportToDelete = deleteModal.report;
  const showEditModal = editModal.isOpen;
  const editingReport = editModal.report;
  const showEditInitialImagesModal = editImagesModal.isOpen && editImagesModal.type === "initial";
  const showEditReceivedImagesModal = editImagesModal.isOpen && editImagesModal.type === "received";
  const showEditCompletionImagesModal = editImagesModal.isOpen && editImagesModal.type === "completion";
  const editingImageReport = editImagesModal.report;
  const editingImageType = editImagesModal.type;
  const editingImages = editImagesModal.images;
  const editingNotes = editImagesModal.notes;
  const isUpdatingImages = editImagesModal.isUpdating;

  const dropdownRef = useRef(null);

  // Debounce timer for auto-fetching colors when typing
  const colorFetchTimerRef = useRef(null);

  // ─── Factories (now in useOrderDataStore) ───────────────────────────
  const { fetchFactories } = useOrderDataStore();

  // ─── Assign control + users (now in useAssignControlStore) ──────────
  const {
    users,
    causeAssignHistory,
    fetchAssignControl,
    fetchUsers,
  } = useAssignControlStore();

  const { isAdminUser, isWarehouseUser } = computeUserRoles(user, causeAssignHistory);

  // Handle tab access: warehouse default is Warehouse Report; redirect from form unless completing a report (e.g. after scan).
  useEffect(() => {
    if (isWarehouseUser && activeTab === "reports") {
      setActiveTab("warehouse_reports");
    } else if (isWarehouseUser && activeTab === "form" && !completingReport) {
      // After reload, activeTab can still be "form" (store default) — send warehouse user to Warehouse Report so Create tab stays hidden
      setActiveTab("warehouse_reports");
    } else if (
      !isAdminUser &&
      !isWarehouseUser &&
      activeTab === "warehouse_reports"
    ) {
      // Unassigned users should not see warehouse reports
      setActiveTab("reports");
    } else if (!isAdminUser && activeTab === "assign_control") {
      // Unassigned/warehouse users must not see Assign Control; redirect to a valid tab
      setActiveTab(isWarehouseUser ? "warehouse_reports" : "reports");
    }
  }, [isWarehouseUser, activeTab, isAdminUser, completingReport]);

  // Start polling assign control on mount; fetch users once
  useEffect(() => {
    fetchAssignControl();
    fetchUsers();
    const intervalId = setInterval(fetchAssignControl, 5000);
    const handleFocus = () => fetchAssignControl();
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, []); // eslint-disable-line

  // Page auto-resets to 1 on filter change — handled inside useWashingFilterStore.setFilter()

  // Fetch standard reports whenever the standard filter object changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => _fetchReports("standard", _stdF), 500);
    return () => clearTimeout(t);
  }, [_stdF]); // eslint-disable-line

  // Fetch warehouse reports whenever the warehouse filter object changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => _fetchReports("warehouse", _whF), 500);
    return () => clearTimeout(t);
  }, [_whF]); // eslint-disable-line

  // When any client updates a report (e.g. warehouse edits/rejects colors), refetch so list shows latest (e.g. colorEditedByWarehouseAt)
  useEffect(() => {
    if (!API_BASE_URL) return;
    const socket = io(API_BASE_URL, { path: "/socket.io", transports: ["websocket"], secure: API_BASE_URL.startsWith("https") });
    const onUpdated = () => refreshAllReports();
    socket.on("washing-report-updated", onUpdated);
    return () => {
      socket.off("washing-report-updated", onUpdated);
      socket.disconnect();
    };
  }, [refreshAllReports]);

  // Handle input change with order data clearing
  const handleInputChange = (field, value) => {
    // 1. Handle Report Type Change - ONLY UPDATE THE REPORT TYPE VALUE, DON'T RESET FORM
    if (field === "reportType") {
      // Just update the reportType field, keep all other form data intact
      setFormData((prev) => ({
        ...prev,
        reportType: value,
      }));

      // Stop here - don't reset anything else
      return;
    }

    handleFormInputChange(field, value, (field, value, newData, prev) => {
      // Clear user-selected choices (color, PO, ETD) when Style changes manually
      // But keep metadata (season, description) until new search results arrive
      if (
        (field === "ymStyle" && prev.ymStyle !== value) ||
        (field === "style" && prev.style !== value)
      ) {
        newData.color = [];
        newData.po = [];
        newData.exFtyDate = [];
        newData.washType = "Before Wash";
        newData.sampleSize = "";

        // IMMEDIATELY clear metadata if style is cleared or too short
        if (!value || value.length < 2) {
          newData.season = "";
          newData.styleDescription = "";
          newData.custStyle = "";
          newData.buyerStyle = "";
        }
      }
    });

    // Unified logic for Style Search (supports both 'ymStyle' and 'style')
    const isStyleField = field === "ymStyle" || field === "style";

    if (isStyleField && value.length >= 2) {
      // Use handler function
      handleOrderNoSearch(
        value,
        setOrderNoSuggestions,
        setShowOrderNoSuggestions,
        setIsSearchingOrderNo,
      );

      // Clear any existing timer
      if (colorFetchTimerRef.current) {
        clearTimeout(colorFetchTimerRef.current);
        colorFetchTimerRef.current = null;
      }

      // Auto-fetch colors when user stops typing (debounced)
      if (shouldAutoFetchColors(value)) {
        colorFetchTimerRef.current = setTimeout(async () => {
          if (shouldAutoFetchColors(value)) {
            // Fetch the suggestions again or use the ones we have?
            // Better to re-fetch or use results of handleOrderNoSearch
            const suggestions = await handleOrderNoSearch(
              value,
              setOrderNoSuggestions,
              setShowOrderNoSuggestions,
              setIsSearchingOrderNo,
            );

            // If exactly one suggestion or the exact match is in the list, auto-select it
            if (suggestions && suggestions.length === 1) {
              handleOrderNoSelect(suggestions[0]);
            } else if (
              suggestions &&
              suggestions.some((s) => s.toUpperCase() === value.toUpperCase())
            ) {
              const exactMatch = suggestions.find(
                (s) => s.toUpperCase() === value.toUpperCase(),
              );
              handleOrderNoSelect(exactMatch);
            } else {
              // Check if the current value is a prefix of any suggestion
              // If it is, user is likely still typing, so don't fetch yet to avoid 404s
              const isPrefix =
                suggestions &&
                suggestions.some(
                  (s) =>
                    s.toUpperCase().startsWith(value.toUpperCase()) &&
                    s.length > value.length,
                );

              if (!isPrefix) {
                // No auto-select, just fetch data for what we have
                fetchOrderColors(value, setFormData);
                fetchYorksysOrderETD(value, setFormData);
                fetchUsedColors(value);
              }
            }
          }
        }, 800); // Wait 800ms after user stops typing
      }
    } else if (isStyleField && value.length < 2) {
      setOrderNoSuggestions([]);
      setShowOrderNoSuggestions(false);
      resetOrderData();

      // Close any open dropdowns
      setShowColorDropdown(false);
      setShowPODropdown(false);
      setShowETDDropdown(false);

      // Clear auto-populated fields in form data as well
      setFormData((prev) => ({
        ...prev,
        season: "",
        styleDescription: "",
        custStyle: "",
        buyerStyle: "",
        color: [],
        po: [],
        exFtyDate: [],
      }));

      // Clear timer if user deletes the value
      if (colorFetchTimerRef.current) {
        clearTimeout(colorFetchTimerRef.current);
        colorFetchTimerRef.current = null;
      }
    }
  };

  // Search for Order_No suggestions
  const searchOrderNo = (value) => {
    if (value && value.length >= 2) {
      handleOrderNoSearch(
        value,
        setOrderNoSuggestions,
        setShowOrderNoSuggestions,
        setIsSearchingOrderNo,
      );
    }
  };

  // Handle Order_No selection - use handler function
  const handleOrderNoSelect = async (orderNo) => {
    // Clear any pending color fetch timer
    if (colorFetchTimerRef.current) {
      clearTimeout(colorFetchTimerRef.current);
      colorFetchTimerRef.current = null;
    }

    // Immediately reflect selection in the UI for any of the common style fields
    setFormData((prev) => ({
      ...prev,
      moNo: orderNo,
      ymStyle: orderNo,
      style: orderNo,
      styleNo: orderNo,
    }));

    // Use handler function
    await handleOrderNoSelection(
      orderNo,
      formData,
      setFormData,
      setShowOrderNoSuggestions,
      setOrderNoSuggestions,
      fetchOrderColors,
      fetchYorksysOrderETD,
      resetOrderData,
      fetchUsedColors,
    );
  };

  // Handle image upload - store File objects instead of base64
  const handleImageUploadWrapper = (files) => {
    handleImageUpload(files, (prev) => ({
      ...prev,
      images: [
        ...prev.images,
        ...Array.from(files).filter((f) => validateImageFile(f)),
      ],
    }));
  };

  // Use imported handlers for file/camera inputs
  const handleFileInputChange = (e) =>
    handleFileInputChangeHandler(
      e,
      formData.images,
      setFormData,
      fileInputRef,
      IMAGE_LIMITS.INITIAL,
    );

  const handleCameraInputChange = (e) =>
    handleCameraInputChangeHandler(
      e,
      formData.images,
      setFormData,
      cameraInputRef,
      IMAGE_LIMITS.INITIAL,
    );

  const triggerFileInput = () =>
    triggerFileInputHandler(
      formData.images,
      fileInputRef,
      IMAGE_LIMITS.INITIAL,
      "Initial Step",
    );

  const triggerCameraInput = () =>
    triggerCameraInputHandler(
      formData.images,
      cameraInputRef,
      IMAGE_LIMITS.INITIAL,
      "Initial Step",
    );

  // Handle image remove
  const handleRemoveImageWrapper = (index) => {
    handleRemoveImage(
      index,
      formData.images,
      (updater) =>
        setFormData((prevData) => ({
          ...prevData,
          images:
            typeof updater === "function" ? updater(prevData.images) : updater,
        })),
      imageRotations,
      setImageRotations,
    );
  };

  // Image viewer functions are now in useImageViewer hook

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if we are completing a report (e.g. after QR scan — skip received, go direct to form)
    if (completingReport) {
      const now = new Date().toISOString();
      const dateOnly = now.split("T")[0];
      const completionPayload = {
        ...formData,
        images: completingReport.images || [],
        completionImages: formData.images || [],
        status: "completed",
        completedDate: dateOnly,
        completedAt: now,
      };
      // If report was still pending (QR scan skipped received), set received timestamps on completion
      if (completingReport.status === "pending" || !completingReport.status) {
        completionPayload.receivedDate = dateOnly;
        completionPayload.receivedAt = now;
        if (user?.emp_id) completionPayload.receiver_emp_id = user.emp_id;
      }
      const success = await updateReport(completingReport._id, completionPayload);

      if (success) {
        setCompletingReport(null);
        // Reset form
        const currentReportType =
          formData.reportType || REPORT_TYPES.GARMENT_WASH;
        resetForm(getInitialFormData(currentReportType));

        // Switch to reports tab
        setActiveTab("reports");

        // Clear rotations
        setImageRotations({});
        setShowColorDropdown(false);
        setShowPODropdown(false);
        setShowETDDropdown(false);
        resetOrderData();
      }
      return;
    }

    const currentReportType = formData.reportType || REPORT_TYPES.GARMENT_WASH;
    const success = await submitReport(formData, () => {
      // Keep on the form tab for faster subsequent entries
      // setActiveTab("reports"); // Removed per request
      // Reset form with initial data for the current report type
      resetForm(getInitialFormData(currentReportType));
      setImageRotations({});
      setShowColorDropdown(false);
      setShowPODropdown(false);
      setShowETDDropdown(false);
      resetOrderData();
    });
  };

  // Handle delete report - open confirmation modal
  const handleDelete = (id) => {
    openDeleteModal(id);
  };

  // Confirm delete report
  const confirmDelete = async () => {
    if (!reportToDelete) return;
    const success = await _deleteReport(
      activeTab === "warehouse_reports" ? "warehouse" : "standard",
      reportToDelete,
    );
    if (success) {
      closeDeleteModal();
      // Refresh both tabs to keep counts/pagination accurate
      refreshAllReports();
    }
  };

  // Reject report (warehouse: e.g. color mismatch) – only for pending reports
  const handleReject = async (reportId, rejectedNotes = "") => {
    const tab = activeTab === "warehouse_reports" ? "warehouse" : "standard";
    const filters = activeTab === "warehouse_reports"
      ? useWashingFilterStore.getState().warehouse
      : useWashingFilterStore.getState().standard;
    const success = await _rejectReport(
      tab,
      reportId,
      { receiver_emp_id: user?.emp_id || user?.id, rejectedNotes },
      filters,
    );
    if (success) refreshAllReports();
  };

  // Handle edit report - use handler function
  const handleEditReport = async (report) => {
    await prepareEditFormData(
      report,
      setEditFormData,
      setEditAvailableColors,
      setEditAvailablePOs,
      setEditAvailableETDs,
    );
    openEditModal(report);
  };

  // Handle edit form submit - use handler
  const resetEditState = () => {
    closeEditModal();
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
  };

  const handleEditSubmit = (e) =>
    handleEditFormSubmit(
      e,
      editingReport,
      editFormData,
      refreshAllReports,
      closeEditModal,
      resetEditState,
      {
        editedByWarehouse: isWarehouseUser,
        editorUserId: user?.emp_id || user?.id,
        editorEmpId: user?.emp_id || user?.id,
        editorUserName: user?.name || user?.eng_name || "",
        editorName: user?.name || user?.eng_name || "",
      },
    );

  // Initialize QR Code Scanner for a specific report
  const initializeScanner = async (reportId) => {
    try {
      if (html5QrCodeInstance) {
        await html5QrCodeInstance.stop();
        setHtml5QrCodeInstance(null);
      }

      const scannerId = `report-date-scanner-${reportId}`;
      const instance = new Html5Qrcode(scannerId, { verbose: false });
      setHtml5QrCodeInstance(instance);
      setScanningReportId(reportId);

      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        // Prefer back camera
        const backCamera = cameras.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("environment"),
        );
        const cameraId = backCamera ? backCamera.id : cameras[0].id;

        await instance.start(
          cameraId,
          {
            fps: 20, // Increased FPS for smoother scanning
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdgeSize * 0.7);
              return {
                width: qrboxSize,
                height: qrboxSize,
              };
            },
            aspectRatio: 1.0,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true, // Use native browser API if available (faster/better)
            },
          },
          async (decodedText) => {
            // Check if scanned QR code is the Report Date QR
            // Support multiple formats:
            // 1. URL format: "http://...?scan=REPORT_ID" (from QR code)
            // 2. "REPORT_DATE_SCAN" (old format from UI)
            // 3. "REPORT_DATE_SCAN:REPORT_ID" (old format from PDF)
            let targetReportId = reportId;

            // Only assigned users (Admin or Warehouse) can process a scan
            if (!isAdminUser && !isWarehouseUser) {
              showToast.warning("You are not assigned to scan reports. Only assigned users can complete this action.");
              return;
            }

            // Check if it's a URL format
            if (decodedText.includes("?scan=")) {
              try {
                const url = new URL(decodedText);
                const scanParam = url.searchParams.get("scan");
                if (scanParam) {
                  targetReportId = scanParam;
                } else {
                  showToast.warning(
                    "Invalid QR code. Missing report ID in URL.",
                  );
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
              showToast.warning(
                "Invalid QR code. Please scan the Report Date QR code.",
              );
              return;
            }

            // Fetch current report to check status
            try {
              const reportResponse = await fetch(
                `${API_BASE_URL}/api/report-washing/${targetReportId}`,
              );
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
                // Normal flow: open received modal (add images/notes, save → received)
                stopScanner();
                setShowReportDateScanner(null);
                setShowReportDateQR(null);
                openReceivedModal(targetReportId);
                setShouldUpdateReceivedStatus(true);
                setActiveTab("reports");
                showToast.success(
                  "QR Scan success! Add images and notes, then save to set status to Received.",
                );
              } else if (currentStatus === "received") {
                // User already clicked "Accept received" → go direct to completion form
                stopScanner();
                setShowReportDateScanner(null);
                setShowReportDateQR(null);
                setCompletingReport(currentReport);
                setFormData({
                  ...currentReport,
                  reportType: currentReport.reportType || "Garment Wash Report",
                  color: currentReport.color || [],
                  po: currentReport.po || [],
                  exFtyDate: currentReport.exFtyDate || [],
                  images: [],
                  moNo: currentReport.moNo || currentReport.ymStyle || "",
                });
                if (currentReport.ymStyle) {
                  fetchOrderColors(currentReport.ymStyle, setFormData);
                  fetchYorksysOrderETD(currentReport.ymStyle, setFormData);
                }
                setActiveTab("form");
              } else if (currentStatus === "completed") {
                showToast.info("This report is already completed.");
                stopScanner();
                setShowReportDateScanner(null);
                // Switch to Reports tab to show the completed report
                setActiveTab("reports");
              } else {
                showToast.warning(
                  `Report status is "${currentStatus}". Cannot process.`,
                );
                // Switch to Reports tab anyway
                setActiveTab("reports");
              }
            } catch (error) {
              console.error("Error processing QR scan:", error);
              showToast.error(
                "Failed to process QR code scan. Please try again.",
              );
            }
          },
          (errorMessage) => {
            // Ignore scan errors (continuous scanning)
          },
        );
      }
    } catch (error) {
      console.error("Error initializing scanner:", error);
      showToast.error(
        "Failed to initialize scanner. Please check camera permissions.",
      );
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
        setScannerFlashOn(false);
      }
    }
  }, [html5QrCodeInstance, setScanningReportId]);

  // Toggle scanner torch/flash (when supported)
  const toggleScannerFlash = useCallback(() => {
    if (!html5QrCodeInstance || !html5QrCodeInstance.isScanning) return;
    try {
      const caps = html5QrCodeInstance.getRunningTrackCameraCapabilities?.();
      const torch = caps?.torchFeature?.();
      if (torch) {
        torch.apply?.(!torch.value?.());
        setScannerFlashOn((prev) => !prev);
      }
    } catch (_) {
      // Torch not supported on this device/browser
    }
  }, [html5QrCodeInstance]);

  // Handle QR code file upload and scan
  const handleQRCodeFileUpload = async (event, reportId) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isAdminUser && !isWarehouseUser) {
      showToast.error("You are not assigned to scan reports. Only assigned users can complete this action.");
      event.target.value = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast.error(
        "Invalid file type. Please upload an image file (PNG, JPG, JPEG, etc.).",
      );
      event.target.value = "";
      return;
    }

    const { parseQRCodeScanResult } =
      await import("../components/inspection/WashingTesting/lib");

    // Helper to process scan result
    const processResult = async (decodedText) => {
      const result = parseQRCodeScanResult(decodedText, reportId);

      if (!result.isValid) {
        if (result.format === "invalid_url" || result.format === "unknown") {
          showToast.warning(
            "This QR code is not valid. Please upload the QR code that is displayed in the current modal window.",
          );
        } else {
          showToast.warning("Invalid QR code format.");
        }
        return;
      }

      const targetReportId = result.reportId;

      // Check if the scanned QR code belongs to the current report
      if (targetReportId !== reportId) {
        showToast.error(
          "This QR code is from a different report. Please upload the QR code that is displayed in the current modal window.",
        );
        return;
      }

      // Fetch current report to check status
      let reportResponse;
      try {
        reportResponse = await fetch(
          `${API_BASE_URL}/api/report-washing/${targetReportId}`,
        );
        if (!reportResponse.ok) {
          if (reportResponse.status === 404) {
            showToast.error(
              "This QR code is from an old or deleted report. Please upload the QR code that is displayed in the current modal window.",
            );
          } else {
            showToast.error("Unable to verify the report. Please try again.");
          }
          return;
        }
      } catch (fetchError) {
        console.error("Error fetching report:", fetchError);
        showToast.error(
          "Network error. Failed to verify the report. Please check your connection and try again.",
        );
        return;
      }

      const reportResult = await reportResponse.json();
      const currentReport = reportResult.data || reportResult;
      const currentStatus = currentReport.status || "pending";

      if (currentStatus === "pending" || !currentStatus) {
        setShowReportDateQR(null);
        openReceivedModal(targetReportId);
        setShouldUpdateReceivedStatus(true);
        setActiveTab("reports");
        showToast.success(
          "QR Scan success! Add images and notes, then save to set status to Received.",
        );
      } else if (currentStatus === "received") {
        setShowReportDateQR(null);
        setCompletingReport(currentReport);
        setFormData({
          ...currentReport,
          reportType: currentReport.reportType || "Garment Wash Report",
          color: currentReport.color || [],
          po: currentReport.po || [],
          exFtyDate: currentReport.exFtyDate || [],
          images: [],
          moNo: currentReport.moNo || currentReport.ymStyle || "",
        });
        if (currentReport.ymStyle) {
          fetchOrderColors(currentReport.ymStyle, setFormData);
          fetchYorksysOrderETD(currentReport.ymStyle, setFormData);
        }
        setActiveTab("form");
      } else if (currentStatus === "completed") {
        showToast.info("This report is already completed.");
        setShowReportDateQR(null);
        setActiveTab("reports");
      } else {
        showToast.warning(
          `Report status is "${currentStatus}". Cannot process.`,
        );
        setShowReportDateQR(null);
        setActiveTab("reports");
      }
    };

    try {
      // Method 1: Try Html5Qrcode first (fastest)
      const tempContainer = document.createElement("div");
      tempContainer.id = "temp-qr-file-scanner";
      tempContainer.style.display = "none";
      document.body.appendChild(tempContainer);

      const html5QrCode = new Html5Qrcode("temp-qr-file-scanner");
      try {
        const decodedText = await html5QrCode.scanFile(file, false);
        document.body.removeChild(tempContainer);
        await processResult(decodedText);
        event.target.value = "";
        return;
      } catch (scanError) {
        document.body.removeChild(tempContainer);
        console.warn("Html5Qrcode failed, trying fallback...", scanError);
      }

      // Method 2: Fallback to jsQR with Canvas (more robust for some images)
      try {
        const jsQR = (await import("jsqr")).default;

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = objectUrl;
        });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        URL.revokeObjectURL(objectUrl);

        if (code) {
          await processResult(code.data);
          event.target.value = "";
          return;
        }
      } catch (fallbackError) {
        console.error("Fallback scan failed:", fallbackError);
      }

      // If both failed
      showToast.error(
        "Failed to scan QR code. The image may be corrupted or the QR code is not readable.",
      );
    } catch (error) {
      console.error("Error in QR scan process:", error);
      showToast.error("An error occurred while scanning. Please try again.");
    } finally {
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
      const currentReport = reports.find(
        (r) => r._id === reportId || r.id === reportId,
      );
      const initialStatus = currentReport?.status || "pending";

      console.log(
        `[QR Polling] Started for report ${reportId}, initial status: ${initialStatus}`,
      );

      // Use a ref to track status within the interval (avoids stale closure)
      let currentKnownStatus = initialStatus;

      // Poll every 2 seconds to check for status changes
      statusCheckIntervalRef.current = setInterval(async () => {
        try {
          console.log(`[QR Polling] Checking status for report ${reportId}...`);

          const response = await fetch(
            `${API_BASE_URL}/api/report-washing/${reportId}`,
          );
          if (response.ok) {
            const result = await response.json();
            const report = result.data || result;
            const newStatus = report.status || "pending";

            console.log(
              `[QR Polling] Current status: ${currentKnownStatus}, New status: ${newStatus}`,
            );

            // If status changed, close the QR modal and refresh
            if (newStatus !== currentKnownStatus) {
              console.log(
                `[QR Polling] ✓ Status changed from ${currentKnownStatus} to ${newStatus} - closing QR modal`,
              );

              // Clear interval first
              if (statusCheckIntervalRef.current) {
                clearInterval(statusCheckIntervalRef.current);
                statusCheckIntervalRef.current = null;
              }

              // Close QR modal
              setShowReportDateQR(null);
              setShowReportDateScanner(null);

              // Show notification
              showToast.success(
                `✓ QR Scanned! Report status updated to "${newStatus}"`,
              );

              // Refresh reports
              await fetchReports();

              // Switch to reports tab
              setActiveTab("reports");

              // Scroll to updated report with highlight
              setTimeout(() => {
                const reportElement = document.querySelector(
                  `[data-report-id="${reportId}"]`,
                );
                if (reportElement) {
                  reportElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  reportElement.style.transition = "background-color 0.5s ease";
                  reportElement.style.backgroundColor = "#d4edda";
                  setTimeout(() => {
                    reportElement.style.backgroundColor = "";
                  }, 2000);
                }
              }, 200);
            } else {
              console.log(
                `[QR Polling] No status change detected, continuing to poll...`,
              );
            }
          } else {
            console.error(
              `[QR Polling] Failed to fetch report: ${response.status}`,
            );
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

  // Handle URL-based QR code scan (when page is opened via QR code URL e.g. after download and scan)
  // Always fetch report by ID and branch on status (pending → received modal, received → completion form, completed → toast)
  useEffect(() => {
    const scanReportId = searchParams.get("scan");
    if (!scanReportId) return;
    // Switch to Reports tab when scan parameter is detected
    setActiveTab("reports");
    // Process scan by ID regardless of reports list (so received/completed reports work even if filtered out)
    processQRScanFromURL(scanReportId);
    setSearchParams({});
  }, [searchParams]);

  // Process QR scan from URL - Enhanced handler for QR scan success
  const processQRScanFromURL = async (targetReportId) => {
    if (!targetReportId) return;
    if (!isAdminUser && !isWarehouseUser) {
      showToast.error("You are not assigned to scan reports. Only assigned users can complete this action.");
      return;
    }

    try {
      // Show loading state
      showToast.info("Processing QR code...");

      // Fetch current report to check status
      const reportResponse = await fetch(
        `${API_BASE_URL}/api/report-washing/${targetReportId}`,
      );
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
        // Normal flow: open received modal (add images/notes, save → received)
        setShowReportDateQR(null);
        setShowReportDateScanner(null);
        if (html5QrCodeInstance) {
          try {
            await html5QrCodeInstance.stop();
            setHtml5QrCodeInstance(null);
          } catch (err) {
            console.log("Scanner already stopped");
          }
        }
        setScanningReportId(null);
        openReceivedModal(targetReportId);
        setShouldUpdateReceivedStatus(true);
        setActiveTab("reports");
        showToast.success(
          "QR Scan success! Add images and notes, then save to set status to Received.",
        );
      } else if (currentStatus === "received") {
        // User already clicked "Accept received" → go direct to completion form
        setShowReportDateQR(null);
        setShowReportDateScanner(null);
        if (html5QrCodeInstance) {
          try {
            await html5QrCodeInstance.stop();
            setHtml5QrCodeInstance(null);
          } catch (err) {
            console.log("Scanner already stopped");
          }
        }
        setScanningReportId(null);
        setCompletingReport(currentReport);
        setFormData({
          ...currentReport,
          reportType: currentReport.reportType || "Garment Wash Report",
          color: currentReport.color || [],
          po: currentReport.po || [],
          exFtyDate: currentReport.exFtyDate || [],
          images: [],
          moNo: currentReport.moNo || currentReport.ymStyle || "",
        });
        if (currentReport.ymStyle) {
          fetchOrderColors(currentReport.ymStyle, setFormData);
          fetchYorksysOrderETD(currentReport.ymStyle, setFormData);
        }
        setActiveTab("form");
      } else if (currentStatus === "completed") {
        // Close modal and show info
        setShowReportDateQR(null);
        setShowReportDateScanner(null);

        showToast.info("This report is already completed.");

        // Switch to Reports tab to show the completed report
        setActiveTab("reports");

        // Scroll to the report
        setTimeout(() => {
          const reportElement = document.querySelector(
            `[data-report-id="${targetReportId}"]`,
          );
          if (reportElement) {
            reportElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 200);
      } else {
        // Close modal for any other status
        setShowReportDateQR(null);
        setShowReportDateScanner(null);

        showToast.warning(
          `Report status is "${currentStatus}". Cannot process.`,
        );

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

  // Shared image-upload helper — used by received, completion, and edit modals
  const makeImageUploadHandler = (getImages, setImages) => (files) => {
    if (!files || files.length === 0) return;
    const currentCount = getImages().length;
    if (currentCount >= 5) { showToast.warning("Maximum of 5 images allowed per section."); return; }
    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const arr = Array.from(files);
    const slots = 5 - currentCount;
    if (arr.length > slots) showToast.info(`Only ${slots} more image(s) can be added (Limit: 5).`);
    arr.slice(0, slots).forEach((file) => {
      if (!ALLOWED.includes(file.type.toLowerCase())) {
        showToast.error(`Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`);
        return;
      }
      setImages((prev) => [...prev, file]);
    });
  };

  const handleReceivedImageUpload = makeImageUploadHandler(() => receivedImages, setReceivedImages);

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
        closeReceivedModal();

        // 2. Close QR code modal if it's open for this report
        if (showReportDateQR === reportId) {
          setShowReportDateQR(null);
          setShowReportDateScanner(null);
        }

        // 3. Clear received image rotations
        setReceivedImageRotations({});

        // 4. Scroll to updated report with visual feedback
        setTimeout(() => {
          const reportElement = document.querySelector(
            `[data-report-id="${reportId}"]`,
          );
          if (reportElement) {
            reportElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            // Add a temporary highlight effect
            reportElement.style.transition = "background-color 0.5s ease";
            reportElement.style.backgroundColor = "#d4edda";
            setTimeout(() => {
              reportElement.style.backgroundColor = "";
            }, 2000);
          }
        }, 200);
      },
    );
  };

  // Accept received from card action bar (no modal) — quick accept without images/notes
  const handleAcceptReceivedFromCard = async (report) => {
    const reportId = report._id || report.id;
    if (!reportId) return;

    await saveReceivedStatus(
      reportId,
      [],
      "",
      true,
      (id) => {
        if (showReportDateQR === id) {
          setShowReportDateQR(null);
          setShowReportDateScanner(null);
        }
        setTimeout(() => {
          const reportElement = document.querySelector(
            `[data-report-id="${id}"]`,
          );
          if (reportElement) {
            reportElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            reportElement.style.transition = "background-color 0.5s ease";
            reportElement.style.backgroundColor = "#d4edda";
            setTimeout(() => {
              reportElement.style.backgroundColor = "";
            }, 2000);
          }
        }, 200);
      },
    );
  };

  const handleCompletionImageUpload = makeImageUploadHandler(() => completionImages, setCompletionImages);

  // Handle completion form submit - Enhanced with better feedback
  // Handle completion form submit - Enhanced with better feedback
  const handleCompletionSubmit = async () => {
    if (!completionReportId) return;

    // Find the report to get its type so we can save notes to the correct field
    let report = reports.find(
      (r) => r._id === completionReportId || r.id === completionReportId,
    );
    if (!report) {
      report = whReports.find(
        (r) => r._id === completionReportId || r.id === completionReportId,
      );
    }

    // Default to Garment Wash Report if not found (though it should be found)
    const reportType = report?.reportType || "Garment Wash Report";

    // Current assignment's checker/approver to store on report when completing
    const activeAssign = causeAssignHistory && causeAssignHistory.length > 0 ? causeAssignHistory[0] : null;
    const completionAssign = activeAssign ? {
      checkedBy: activeAssign.checkedBy ?? null,
      approvedBy: activeAssign.approvedBy ?? null,
      checkedByName: activeAssign.checkedByName ?? null,
      approvedByName: activeAssign.approvedByName ?? null,
    } : null;

    const success = await saveCompletionStatus(
      completionReportId,
      completionImages,
      completionNotes,
      (reportId) => {
        // 1. Close completion modal immediately
        closeCompletionModal();

        // 2. Close QR code modal if it's open for this report
        if (showReportDateQR === reportId) {
          setShowReportDateQR(null);
          setShowReportDateScanner(null);
        }

        // 3. Reset completion image rotations
        setCompletionImageRotations({});

        // 4. Scroll to updated report with visual feedback
        setTimeout(() => {
          const reportElement = document.querySelector(
            `[data-report-id="${reportId}"]`,
          );
          if (reportElement) {
            reportElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            // Add a temporary highlight effect
            reportElement.style.transition = "background-color 0.5s ease";
            reportElement.style.backgroundColor = "#d1ecf1";
            setTimeout(() => {
              reportElement.style.backgroundColor = "";
            }, 2000);
          }
        }, 200);
      },
      reportType, // Pass the report type to saveCompletionStatus
      completionAssign, // Pass assignment checkedBy/approvedBy and names for completed report view
    );
  };

  // Handle edit initial images
  const handleEditInitialImages = (report) => {
    openEditImagesModal(report, "initial", report.images || [], report.notes || "");
  };

  // Handle edit received images
  const handleEditReceivedImages = (report) => {
    openEditImagesModal(report, "received", report.receivedImages || [], report.receivedNotes || "");
  };

  // Handle edit completion images
  const handleEditCompletionImages = (report) => {
    const noteField = getCompletionNotesField(report.reportType);
    openEditImagesModal(
      report,
      "completion",
      report.completionImages || [],
      report[noteField] || report.completionNotes || "",
    );
  };

  const handleEditImageUpload = makeImageUploadHandler(() => editingImages, setEditImages);

  // Handle remove image from edit modal
  const handleRemoveEditImage = (index) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle update images
  const handleUpdateImages = async () => {
    if (!editingImageReport || !editingImageType) return;

    const reportId = editingImageReport._id || editingImageReport.id;
    setIsUpdatingImages(true);

    try {
      const formDataToSubmit = new FormData();

      // Determine which field name to use based on type
      const fieldName =
        editingImageType === "initial"
          ? "images"
          : editingImageType === "received"
            ? "receivedImages"
            : "completionImages";

      // Separate new File objects from existing URLs
      const newImageFiles = editingImages.filter((img) => img instanceof File);
      const existingImageUrls = editingImages.filter(
        (img) => typeof img === "string",
      );

      // Add new images (File objects) - these will be uploaded
      newImageFiles.forEach((file) => {
        formDataToSubmit.append(fieldName, file);
      });

      // Send the list of existing URLs to keep (so backend knows which ones to preserve)
      // We'll send this as a JSON string in a separate field
      if (existingImageUrls.length > 0) {
        formDataToSubmit.append(
          `${fieldName}Urls`,
          JSON.stringify(existingImageUrls),
        );
      }

      // Add notes using correct field name
      let notesFieldName;
      if (editingImageType === "initial") {
        notesFieldName = "notes";
      } else if (editingImageType === "received") {
        notesFieldName = "receivedNotes";
      } else {
        // completion
        notesFieldName = getCompletionNotesField(editingImageReport.reportType);
      }

      formDataToSubmit.append(notesFieldName, editingNotes);

      const response = await fetch(
        `${API_BASE_URL}/api/report-washing/${reportId}`,
        {
          method: "PUT",
          body: formDataToSubmit,
        },
      );

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
            errorMessage = errorText.split("<br>")[0].trim();
          }
        }
        throw new Error(errorMessage);
      }

      if (response.ok && result.success) {
        showToast.success("Images updated successfully!");

        // Close modal
        closeEditImagesModal();
        setEditImages([]);

        // Refresh all reports
        await refreshAllReports();
      } else {
        const errorMessage =
          result?.message ||
          result?.error ||
          `Server error (${response.status}): ${response.statusText}`;
        showToast.error(errorMessage);
        console.error("Error updating images:", result);
      }
    } catch (error) {
      console.error("Error updating images:", error);
      const errorMessage =
        error.message ||
        "An error occurred while updating images. Please try again.";
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
    // Increase resolution for the data URL to ensure it's sharp in PDF/Print
    const highResSize = 1024;

    return new Promise((resolve) => {
      try {
        // Create a temporary container
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.width = `${highResSize}px`;
        container.style.height = `${highResSize}px`;
        container.style.background = "white";
        document.body.appendChild(container);

        // Dynamically import react-dom/client and render QR code
        import("react-dom/client")
          .then(({ createRoot }) => {
            const root = createRoot(container);
            root.render(
              React.createElement(QRCodeCanvas, {
                value: value,
                size: highResSize,
                level: "H",
                includeMargin: true,
                imageSettings: {
                  src: "/assets/Home/YQMSLogoEdit.png",
                  x: undefined,
                  y: undefined,
                  height: highResSize * 0.2,
                  width: highResSize * 0.2,
                  excavate: true,
                },
              }),
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
          })
          .catch((error) => {
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

    const currentPrintingId =
      activeTab === "warehouse_reports" ? whPrintingReportId : printingReportId;
    const currentSetPrintingId =
      activeTab === "warehouse_reports"
        ? setWhPrintingReportId
        : setPrintingReportId;

    // Prevent multiple clicks
    if (currentPrintingId === reportId) {
      return;
    }

    currentSetPrintingId(reportId);

    try {
      const qrCodeValue = `${getQRCodeBaseURL(QR_CODE_BASE_URL)}/Launch-washing-machine-test?scan=${reportId}`;
      const qrCodeDataURL = await generateQRCodeDataURL(qrCodeValue, 100);

      const blob = await pdf(
        <WashingMachineTestPDF
          report={report}
          apiBaseUrl={API_BASE_URL}
          qrCodeDataURL={qrCodeDataURL}
          savedImageRotations={savedImageRotations}
          users={users}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);

      // Use a hidden iframe so no new tab opens — only the print dialog appears
      const iframe = document.createElement("iframe");
      iframe.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;border:none;";
      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (printError) {
          console.error("Error calling print:", printError);
          showToast.error("Print failed. Use the PDF button to download and print manually.");
        }
        // Clean up after the print dialog is dismissed
        setTimeout(() => {
          try { document.body.removeChild(iframe); } catch (e) { /* ignore */ }
          try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
        }, 60000);
      };

      iframe.src = url;
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast.error("Failed to generate PDF. Please try again.");
    } finally {
      setTimeout(() => {
        currentSetPrintingId(null);
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

      const blob = await pdf(
        <WashingMachineTestPDF
          report={report}
          apiBaseUrl={API_BASE_URL}
          qrCodeDataURL={qrCodeDataURL}
          savedImageRotations={savedImageRotations}
          users={users}
        />,
      ).toBlob();

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
      await generateWashingMachineTestExcel(report, API_BASE_URL, users);
      showToast.success("Excel file downloaded successfully!");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      showToast.error("Failed to export Excel. Please try again.");
    }
  };

  // Fetch factories once on mount (state lives in useOrderDataStore)
  useEffect(() => {
    fetchFactories();
    return () => {
      if (colorFetchTimerRef.current) clearTimeout(colorFetchTimerRef.current);
    };
  }, []); // eslint-disable-line

  // Close all custom dropdowns when clicking outside
  useEffect(() => {
    const onMouseDown = (e) => {
      if (showColorDropdown && !e.target.closest(".color-dropdown-container")) setShowColorDropdown(false);
      if (showPODropdown && !e.target.closest(".po-dropdown-container")) setShowPODropdown(false);
      if (showETDDropdown && !e.target.closest(".etd-dropdown-container")) setShowETDDropdown(false);
      if (showEditColorDropdown && !e.target.closest(".color-dropdown-container")) setShowEditColorDropdown(false);
      if (showEditPODropdown && !e.target.closest(".po-dropdown-container")) setShowEditPODropdown(false);
      if (showEditETDDropdown && !e.target.closest(".etd-dropdown-container")) setShowEditETDDropdown(false);
      if (isReportTypeOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsReportTypeOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [showColorDropdown, showPODropdown, showETDDropdown, showEditColorDropdown, showEditPODropdown, showEditETDDropdown, isReportTypeOpen]);

  // Close QR code modal if report becomes completed
  useEffect(() => {
    if (showReportDateQR) {
      const report = reports.find(
        (r) => r._id === showReportDateQR || r.id === showReportDateQR,
      );
      if (report && report.status === "completed") {
        setShowReportDateQR(null);
      }
    }
  }, [reports, showReportDateQR]);

  // Keyboard and wheel support is now handled in ImageViewerModal component

  // Check if QR actions should be locked (hidden) for Standard Users
  // Only Admin or Warehouse users can Scan/Upload via QR Modal
  const isQRLocked = !isAdminUser && !isWarehouseUser;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-gray-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg">
        {/* Page Title & Report Type Selection - Custom Header */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-700 p-6 md:p-8 rounded-t-xl relative overflow-hidden group">
          {/* Ambient Background Effects - Water Theme */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-all duration-700 group-hover:bg-cyan-400/30"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none transition-all duration-700 group-hover:bg-blue-400/30"></div>

          {/* Bubble/Water Accents */}
          <div className="absolute top-10 right-20 w-4 h-4 bg-white/20 rounded-full blur-sm animate-pulse"></div>
          <div className="absolute bottom-10 left-32 w-6 h-6 bg-white/10 rounded-full blur-md animate-bounce delay-700"></div>

          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-white tracking-tight drop-shadow-md">
              Launch Washing Machine Test
            </h1>
            <p className="text-sm text-blue-100 flex items-center gap-2 font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
              </span>
              Report Washing - Enter test details and view submitted reports
            </p>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {/* Tab Navigation - Mobile Optimized */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav
              className="flex overflow-x-auto scrollbar-hide -mb-px"
              aria-label="Tabs"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {/* Create New Report tab — hidden for warehouse by default; visible when they're on form (e.g. after scan → completion form) */}
              {((isAdminUser || !isWarehouseUser) || (isWarehouseUser && activeTab === "form")) && (
                <button
                  onClick={() => setActiveTab("form")}
                  className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === "form"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                >
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <HiDocumentAdd
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "form" ? "text-emerald-600" : "text-emerald-500/70"}`}
                    />
                    <span className="hidden sm:inline">Create New Report</span>
                    <span className="sm:hidden">Create</span>
                  </span>
                </button>
              )}

              {(isAdminUser || !isWarehouseUser) && (
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === "reports"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                >
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <HiClipboardList
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "reports" ? "text-blue-600" : "text-blue-500/70"}`}
                    />
                    <span className="hidden sm:inline">
                      Reports ({pagination.totalRecords})
                    </span>
                    <span className="sm:hidden">
                      Reports{" "}
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded-full">
                        {pagination.totalRecords}
                      </span>
                    </span>
                  </span>
                </button>
              )}

              {/* Warehouse Report Tab - Show if restricted OR meets other criteria */}
              {(isAdminUser || isWarehouseUser) && (
                <button
                  onClick={() => setActiveTab("warehouse_reports")}
                  className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === "warehouse_reports"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                >
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <MdWarehouse
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "warehouse_reports" ? "text-amber-600" : "text-amber-500/70"}`}
                    />
                    <span className="hidden sm:inline">Warehouse Report</span>
                    <span className="sm:hidden">Warehouse</span>
                  </span>
                </button>
              )}

              {isAdminUser && (
                <button
                  onClick={() => setActiveTab("assign_control")}
                  className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === "assign_control"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                >
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <MdAssignmentInd
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "assign_control" ? "text-purple-600" : "text-purple-500/70"}`}
                    />
                    <span className="hidden sm:inline">Assign Control</span>
                    <span className="sm:hidden">Assign</span>
                  </span>
                </button>
              )}

              <div className="ml-auto flex items-center flex-shrink-0 pr-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportDateScanner("standalone");
                    setTimeout(() => initializeScanner("standalone"), 300);
                  }}
                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transform transition-all duration-300 hover:scale-125 active:scale-95 group border-b-2 border-transparent"
                  title="Open Live Camera Scanner"
                >
                  <Camera size={32} className="group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </nav>
          </div>

          {/* Form Section — shown when Create tab is active (including for warehouse users) */}
          {activeTab === "form" && (
            <DynamicFormSection
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isCompleting={!!completingReport}
              handleOrderNoSelect={handleOrderNoSelect}
              searchOrderNo={searchOrderNo}
              fetchOrderColors={fetchOrderColors}
              fetchYorksysOrderETD={fetchYorksysOrderETD}
              fetchAnfSpecs={fetchAnfSpecs}
              handleFileInputChange={handleFileInputChange}
              handleCameraInputChange={handleCameraInputChange}
              triggerFileInput={triggerFileInput}
              triggerCameraInput={triggerCameraInput}
              handleRemoveImage={handleRemoveImageWrapper}
              fileInputRef={fileInputRef}
              cameraInputRef={cameraInputRef}
              imageRotations={imageRotations}
              dropdownRef={dropdownRef}
              reportTypeIcons={{
                "Home Wash Test": <MdLocalLaundryService />,
                "Garment Wash Report": <MdLocalLaundryService />,
                "HT Testing": <MdOutlineDeviceThermostat />,
                "EMB/Printing Testing": <MdOutlineImagesearchRoller />,
                "Pulling Test": <MdOutlineExpand />,
              }}
              reportTypes={[
                { val: "Garment Wash Report", icon: <MdLocalLaundryService /> },
                { val: "HT Testing", icon: <MdOutlineDeviceThermostat /> },
                { val: "EMB/Printing Testing", icon: <MdOutlineImagesearchRoller /> },
                { val: "Pulling Test", icon: <MdOutlineExpand /> },
              ]}
            />
          )}

          {/* Form Section is now in FormSection component */}

          {/* Submitted Reports Section - Standard Tab */}
          {activeTab === "reports" && (
            <ReportsList
              tab="standard"
              onPrintPDF={handlePrintPDF}
              onDownloadPDF={handleDownloadPDF}
              onExportExcel={handleExportExcel}
              onEdit={handleEditReport}
              onDelete={handleDelete}
              onReject={handleReject}
              openRejectModal={openRejectModal}
              onAcceptReceived={handleAcceptReceivedFromCard}
              savedImageRotations={savedImageRotations}
              openImageViewer={openImageViewer}
              restrictDeleteStatuses={["received", "completed"]}
              restrictEditStatuses={["received", "completed"]}
              onEditInitialImages={handleEditInitialImages}
              onEditReceivedImages={handleEditReceivedImages}
              onEditCompletionImages={handleEditCompletionImages}
            />
          )}

          {/* Submitted Reports Section - Warehouse Tab */}
          {activeTab === "warehouse_reports" && (
            <ReportsList
              tab="warehouse"
              onPrintPDF={handlePrintPDF}
              onDownloadPDF={handleDownloadPDF}
              onExportExcel={handleExportExcel}
              onEdit={handleEditReport}
              onDelete={handleDelete}
              onReject={handleReject}
              openRejectModal={openRejectModal}
              onAcceptReceived={handleAcceptReceivedFromCard}
              savedImageRotations={savedImageRotations}
              openImageViewer={openImageViewer}
              restrictDeleteStatuses={["received", "completed"]}
              restrictEditStatuses={["received", "completed"]}
              onEditInitialImages={handleEditInitialImages}
              onEditReceivedImages={handleEditReceivedImages}
              onEditCompletionImages={handleEditCompletionImages}
              enableRoleLocking={true}
            />
          )}

          {/* Assign Control Tab — only render for admin so unassigned users never see it */}
          {activeTab === "assign_control" && isAdminUser && (
            <GameAssignControl user={user} />
          )}

          {/* Modals */}
          <ReceivedModal
            isOpen={showReceivedModal}
            onClose={() => {
              closeReceivedModal();
              setReceivedImageRotations({});
            }}
            receivedImages={receivedImages}
            setReceivedImages={setReceivedImages}
            receivedNotes={receivedNotes}
            setReceivedNotes={setReceivedNotes}
            receivedImageInputRef={receivedImageInputRef}
            handleReceivedImageUpload={handleReceivedImageUpload}
            handleReceivedSubmit={handleReceivedSubmit}
            receivedImageRotations={receivedImageRotations}
            setReceivedImageRotations={setReceivedImageRotations}
          />

          <CompletionModal
            isOpen={showCompletionModal}
            onClose={() => {
              closeCompletionModal();
              setCompletionImageRotations({});
            }}
            completionImages={completionImages}
            setCompletionImages={setCompletionImages}
            completionNotes={completionNotes}
            setCompletionNotes={setCompletionNotes}
            completionImageInputRef={completionImageInputRef}
            handleCompletionImageUpload={handleCompletionImageUpload}
            handleCompletionSubmit={handleCompletionSubmit}
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
            onClose={resetEditState}
            onSubmit={handleEditSubmit}
          />

          <DeleteConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={closeDeleteModal}
            onConfirm={confirmDelete}
          />

          <RejectReportModal onConfirm={handleReject} />

          <QRCodeModal
            isOpen={!!showReportDateQR}
            reportId={showReportDateQR}
            onClose={() => setShowReportDateQR(null)}
            onDownloadQRCode={downloadQRCodeHook}
            onPrintQRCode={printQRCode}
            onUploadQRCode={handleQRCodeFileUpload}
            onOpenScanner={(reportId) => {
              setShowReportDateScanner(reportId);
              // Wait for modal to animate and element to be available
              setTimeout(() => initializeScanner(reportId), 300);
            }}
            getQRCodeBaseURL={() => getQRCodeBaseURL(QR_CODE_BASE_URL)}
            fileInputRef={fileInputRef}
            isLocked={isQRLocked}
          />

          <QRScannerModal
            isOpen={!!showReportDateScanner}
            reportId={showReportDateScanner}
            onClose={() => {
              stopScanner();
              setShowReportDateScanner(null);
            }}
            scannerElementId={
              showReportDateScanner
                ? `report-date-scanner-${showReportDateScanner}`
                : ""
            }
            onUploadQRClick={() => scannerUploadInputRef.current?.click()}
            onFlashToggle={toggleScannerFlash}
            flashOn={scannerFlashOn}
          />
          <input
            type="file"
            accept="image/*"
            ref={scannerUploadInputRef}
            className="hidden"
            aria-hidden
            onChange={(e) => {
              if (showReportDateScanner) {
                handleQRCodeFileUpload(e, showReportDateScanner);
              }
              e.target.value = "";
            }}
          />

          {/* Edit Images Modals — one per type, all share the same store state */}
          {[
            { type: "initial", isOpen: showEditInitialImagesModal, color: "blue", uploadType: "initial" },
            { type: "received", isOpen: showEditReceivedImagesModal, color: "yellow", uploadType: "received" },
            { type: "completion", isOpen: showEditCompletionImagesModal, color: "green", uploadType: "completion" },
          ].map(({ type, isOpen, color, uploadType }) => (
            <EditImagesModal
              key={type}
              isOpen={isOpen}
              onClose={() => { closeEditImagesModal(); setEditImages([]); setEditNotes(""); }}
              title={`Edit ${type.charAt(0).toUpperCase() + type.slice(1)} Images - ${editingImageReport?.ymStyle || "N/A"}`}
              images={editingImages}
              notes={editingNotes}
              onNotesChange={setEditNotes}
              onRemoveImage={handleRemoveEditImage}
              onUploadImage={(files) => handleEditImageUpload(files, uploadType)}
              onSave={handleUpdateImages}
              isSaving={isUpdatingImages}
              saveButtonColor={color}
            />
          ))}

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
