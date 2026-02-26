import { useRef, useEffect, useCallback } from "react";
import { useFormStore } from "../stores/useFormStore.js";
import { useModalStore } from "../stores/useModalStore.js";
import { REPORT_TYPES, getInitialFormData, IMAGE_LIMITS } from "../constants/index.js";
import {
  handleOrderNoSearch,
  handleOrderNoSelection,
  shouldAutoFetchColors,
} from "../handlers/index.js";
import {
  handleFileInputChange as handleFileInputChangeHandler,
  handleCameraInputChange as handleCameraInputChangeHandler,
  triggerFileInput as triggerFileInputHandler,
  triggerCameraInput as triggerCameraInputHandler,
} from "../handlers/index.js";

/**
 * Custom hook encapsulating form-level actions:
 * - Input change handling (including report type & style search)
 * - Order number search & selection
 * - Image upload / remove wrappers
 * - Form submission (new report + completing existing report)
 */
export const useFormActions = ({
  user,
  fetchOrderColors,
  fetchYorksysOrderETD,
  fetchUsedColors,
  resetOrderData,
  updateReport,
  submitReport,
  fileInputRef,
  cameraInputRef,
  imageRotations,
  setImageRotations,
  validateImageFile,
  handleImageUpload,
  handleRemoveImage: handleRemoveImageHook,
}) => {
  const {
    formData,
    setFormData,
    handleInputChange: handleFormInputChange,
    resetForm,
    orderNoSuggestions,
    setOrderNoSuggestions,
    showOrderNoSuggestions,
    setShowOrderNoSuggestions,
    isSearchingOrderNo,
    setIsSearchingOrderNo,
    showColorDropdown,
    setShowColorDropdown,
    showPODropdown,
    setShowPODropdown,
    showETDDropdown,
    setShowETDDropdown,
    setActiveTab,
  } = useFormStore();

  const {
    completingReport,
    setCompletingReport,
  } = useModalStore();

  const colorFetchTimerRef = useRef(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (colorFetchTimerRef.current) clearTimeout(colorFetchTimerRef.current);
    };
  }, []);

  // ─── Handle Order_No selection ─────────────────────────────────────
  const handleOrderNoSelect = useCallback(
    async (orderNo) => {
      if (colorFetchTimerRef.current) {
        clearTimeout(colorFetchTimerRef.current);
        colorFetchTimerRef.current = null;
      }

      setFormData((prev) => ({
        ...prev,
        moNo: orderNo,
        ymStyle: orderNo,
        style: orderNo,
        styleNo: orderNo,
      }));

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
    },
    [
      formData,
      setFormData,
      setShowOrderNoSuggestions,
      setOrderNoSuggestions,
      fetchOrderColors,
      fetchYorksysOrderETD,
      resetOrderData,
      fetchUsedColors,
    ],
  );

  // ─── Handle input change with order data clearing ──────────────────
  const handleInputChange = (field, value) => {
    if (field === "reportType") {
      setFormData((prev) => ({
        ...prev,
        reportType: value,
      }));
      return;
    }

    handleFormInputChange(field, value, (field, value, newData, prev) => {
      if (
        (field === "ymStyle" && prev.ymStyle !== value) ||
        (field === "style" && prev.style !== value)
      ) {
        newData.color = [];
        newData.po = [];
        newData.exFtyDate = [];
        newData.washType = "Before Wash";
        newData.sampleSize = "";

        if (!value || value.length < 2) {
          newData.season = "";
          newData.styleDescription = "";
          newData.custStyle = "";
          newData.buyerStyle = "";
        }
      }
    });

    const isStyleField = field === "ymStyle" || field === "style";

    if (isStyleField && value.length >= 2) {
      handleOrderNoSearch(
        value,
        setOrderNoSuggestions,
        setShowOrderNoSuggestions,
        setIsSearchingOrderNo,
      );

      if (colorFetchTimerRef.current) {
        clearTimeout(colorFetchTimerRef.current);
        colorFetchTimerRef.current = null;
      }

      if (shouldAutoFetchColors(value)) {
        colorFetchTimerRef.current = setTimeout(async () => {
          if (shouldAutoFetchColors(value)) {
            const suggestions = await handleOrderNoSearch(
              value,
              setOrderNoSuggestions,
              setShowOrderNoSuggestions,
              setIsSearchingOrderNo,
            );

            if (suggestions && suggestions.length === 1) {
              handleOrderNoSelect(suggestions[0]);
            } else if (
              suggestions &&
              suggestions.some(
                (s) => s.toUpperCase() === value.toUpperCase(),
              )
            ) {
              const exactMatch = suggestions.find(
                (s) => s.toUpperCase() === value.toUpperCase(),
              );
              handleOrderNoSelect(exactMatch);
            } else {
              const isPrefix =
                suggestions &&
                suggestions.some(
                  (s) =>
                    s.toUpperCase().startsWith(value.toUpperCase()) &&
                    s.length > value.length,
                );

              if (!isPrefix) {
                fetchOrderColors(value, setFormData);
                fetchYorksysOrderETD(value, setFormData);
                fetchUsedColors(value);
              }
            }
          }
        }, 800);
      }
    } else if (isStyleField && value.length < 2) {
      setOrderNoSuggestions([]);
      setShowOrderNoSuggestions(false);
      resetOrderData();

      setShowColorDropdown(false);
      setShowPODropdown(false);
      setShowETDDropdown(false);

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

      if (colorFetchTimerRef.current) {
        clearTimeout(colorFetchTimerRef.current);
        colorFetchTimerRef.current = null;
      }
    }
  };

  // ─── Search for Order_No suggestions ───────────────────────────────
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

  // ─── Image upload wrappers ─────────────────────────────────────────
  const handleImageUploadWrapper = (files) => {
    handleImageUpload(files, (prev) => ({
      ...prev,
      images: [
        ...prev.images,
        ...Array.from(files).filter((f) => validateImageFile(f)),
      ],
    }));
  };

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

  const handleRemoveImageWrapper = (index) => {
    handleRemoveImageHook(
      index,
      formData.images,
      (updater) =>
        setFormData((prevData) => ({
          ...prevData,
          images:
            typeof updater === "function"
              ? updater(prevData.images)
              : updater,
        })),
      imageRotations,
      setImageRotations,
    );
  };

  // ─── Form submit ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

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
      if (
        completingReport.status === "pending" ||
        !completingReport.status
      ) {
        completionPayload.receivedDate = dateOnly;
        completionPayload.receivedAt = now;
        if (user?.emp_id) completionPayload.receiver_emp_id = user.emp_id;
      }
      const success = await updateReport(
        completingReport._id,
        completionPayload,
      );

      if (success) {
        setCompletingReport(null);
        const currentReportType =
          formData.reportType || REPORT_TYPES.GARMENT_WASH;
        resetForm(getInitialFormData(currentReportType));
        setActiveTab("reports");
        setImageRotations({});
        setShowColorDropdown(false);
        setShowPODropdown(false);
        setShowETDDropdown(false);
        resetOrderData();
      }
      return;
    }

    const currentReportType =
      formData.reportType || REPORT_TYPES.GARMENT_WASH;
    await submitReport(formData, () => {
      resetForm(getInitialFormData(currentReportType));
      setImageRotations({});
      setShowColorDropdown(false);
      setShowPODropdown(false);
      setShowETDDropdown(false);
      resetOrderData();
    });
  };

  return {
    handleInputChange,
    handleOrderNoSelect,
    searchOrderNo,
    handleImageUploadWrapper,
    handleFileInputChange,
    handleCameraInputChange,
    triggerFileInput,
    triggerCameraInput,
    handleRemoveImageWrapper,
    handleSubmit,
  };
};
