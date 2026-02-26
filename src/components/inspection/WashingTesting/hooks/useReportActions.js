import { useCallback } from "react";
import { API_BASE_URL } from "../../../../../config.js";
import showToast from "../../../../utils/toast.js";
import { useModalStore } from "../stores/useModalStore.js";
import { useFormStore } from "../stores/useFormStore.js";
import {
  useWashingReportsStore,
  useWashingFilterStore,
  useAssignControlStore,
} from "../stores";
import { getCompletionNotesField } from "../utils.js";
import { prepareEditFormData, handleEditFormSubmit } from "../handlers/index.js";

/**
 * Custom hook encapsulating report-level actions:
 * - Delete, reject, edit reports
 * - Received / completion status handling (modal submits)
 * - Image editing (initial, received, completion)
 */
export const useReportActions = ({
  user,
  isWarehouseUser,
  saveReceivedStatus,
  saveCompletionStatus,
  refreshAllReports,
  setReceivedImageRotations,
  setCompletionImageRotations,
}) => {
  const {
    receivedModal,
    openReceivedModal,
    closeReceivedModal,
    setReceivedImages,
    setReceivedNotes,
    completionModal,
    closeCompletionModal,
    setCompletionImages,
    setCompletionNotes,
    deleteModal,
    openDeleteModal,
    closeDeleteModal,
    openRejectModal,
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
    setEditAvailableColors,
    setEditAvailablePOs,
    setEditAvailableETDs,
    showReportDateQR,
    setShowReportDateQR,
    setShowReportDateScanner,
  } = useModalStore();

  const { activeTab } = useFormStore();

  const {
    standard: { reports },
    warehouse: { reports: whReports },
    deleteReport: _deleteReport,
    rejectReport: _rejectReport,
  } = useWashingReportsStore();

  const { causeAssignHistory } = useAssignControlStore();

  // ─── Shortcut accessors ────────────────────────────────────────────
  const receivedReportId = receivedModal.reportId;
  const receivedImages = receivedModal.images;
  const receivedNotes = receivedModal.notes;
  const shouldUpdateReceivedStatus = receivedModal.shouldUpdateStatus;

  const completionReportId = completionModal.reportId;
  const completionImages = completionModal.images;
  const completionNotes = completionModal.notes;

  const reportToDelete = deleteModal.report;
  const editingReport = editModal.report;

  const editingImageReport = editImagesModal.report;
  const editingImageType = editImagesModal.type;
  const editingImages = editImagesModal.images;
  const editingNotes = editImagesModal.notes;

  // ─── Shared image-upload helper ────────────────────────────────────
  const makeImageUploadHandler = (getImages, setImages) => (files) => {
    if (!files || files.length === 0) return;
    const currentCount = getImages().length;
    if (currentCount >= 5) {
      showToast.warning("Maximum of 5 images allowed per section.");
      return;
    }
    const ALLOWED = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const arr = Array.from(files);
    const slots = 5 - currentCount;
    if (arr.length > slots)
      showToast.info(
        `Only ${slots} more image(s) can be added (Limit: 5).`,
      );
    arr.slice(0, slots).forEach((file) => {
      if (!ALLOWED.includes(file.type.toLowerCase())) {
        showToast.error(
          `Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`,
        );
        return;
      }
      setImages((prev) => [...prev, file]);
    });
  };

  // ─── Delete ────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    openDeleteModal(id);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    const success = await _deleteReport(
      activeTab === "warehouse_reports" ? "warehouse" : "standard",
      reportToDelete,
    );
    if (success) {
      closeDeleteModal();
      refreshAllReports();
    }
  };

  // ─── Reject ────────────────────────────────────────────────────────
  const handleReject = async (reportId, rejectedNotes = "") => {
    const tab =
      activeTab === "warehouse_reports" ? "warehouse" : "standard";
    const filters =
      activeTab === "warehouse_reports"
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

  // ─── Edit report ──────────────────────────────────────────────────
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

  // ─── Received status ──────────────────────────────────────────────
  const handleReceivedImageUpload = makeImageUploadHandler(
    () => receivedImages,
    setReceivedImages,
  );

  const handleReceivedSubmit = async () => {
    if (!receivedReportId) return;

    await saveReceivedStatus(
      receivedReportId,
      receivedImages,
      receivedNotes,
      shouldUpdateReceivedStatus,
      (reportId) => {
        closeReceivedModal();

        if (showReportDateQR === reportId) {
          setShowReportDateQR(null);
          setShowReportDateScanner(null);
        }

        setReceivedImageRotations({});

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
      },
    );
  };

  const handleAcceptReceivedFromCard = async (report) => {
    const reportId = report._id || report.id;
    if (!reportId) return;

    await saveReceivedStatus(reportId, [], "", true, (id) => {
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
    });
  };

  // ─── Completion status ─────────────────────────────────────────────
  const handleCompletionImageUpload = makeImageUploadHandler(
    () => completionImages,
    setCompletionImages,
  );

  const handleCompletionSubmit = async () => {
    if (!completionReportId) return;

    let report = reports.find(
      (r) => r._id === completionReportId || r.id === completionReportId,
    );
    if (!report) {
      report = whReports.find(
        (r) => r._id === completionReportId || r.id === completionReportId,
      );
    }

    const reportType = report?.reportType || "Garment Wash Report";

    const activeAssign =
      causeAssignHistory && causeAssignHistory.length > 0
        ? causeAssignHistory[0]
        : null;
    const completionAssign = activeAssign
      ? {
        checkedBy: activeAssign.checkedBy ?? null,
        approvedBy: activeAssign.approvedBy ?? null,
        checkedByName: activeAssign.checkedByName ?? null,
        approvedByName: activeAssign.approvedByName ?? null,
      }
      : null;

    await saveCompletionStatus(
      completionReportId,
      completionImages,
      completionNotes,
      (reportId) => {
        closeCompletionModal();

        if (showReportDateQR === reportId) {
          setShowReportDateQR(null);
          setShowReportDateScanner(null);
        }

        setCompletionImageRotations({});

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
            reportElement.style.backgroundColor = "#d1ecf1";
            setTimeout(() => {
              reportElement.style.backgroundColor = "";
            }, 2000);
          }
        }, 200);
      },
      reportType,
      completionAssign,
    );
  };

  // ─── Edit images (initial / received / completion) ─────────────────
  const handleEditInitialImages = (report) => {
    openEditImagesModal(
      report,
      "initial",
      report.images || [],
      report.notes || "",
    );
  };

  const handleEditReceivedImages = (report) => {
    openEditImagesModal(
      report,
      "received",
      report.receivedImages || [],
      report.receivedNotes || "",
    );
  };

  const handleEditCompletionImages = (report) => {
    const noteField = getCompletionNotesField(report.reportType);
    openEditImagesModal(
      report,
      "completion",
      report.completionImages || [],
      report[noteField] || report.completionNotes || "",
    );
  };

  const handleEditImageUpload = makeImageUploadHandler(
    () => editingImages,
    setEditImages,
  );

  const handleRemoveEditImage = (index) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateImages = async () => {
    if (!editingImageReport || !editingImageType) return;

    const reportId = editingImageReport._id || editingImageReport.id;
    setIsUpdatingImages(true);

    try {
      const formDataToSubmit = new FormData();

      const fieldName =
        editingImageType === "initial"
          ? "images"
          : editingImageType === "received"
            ? "receivedImages"
            : "completionImages";

      const newImageFiles = editingImages.filter(
        (img) => img instanceof File,
      );
      const existingImageUrls = editingImages.filter(
        (img) => typeof img === "string",
      );

      newImageFiles.forEach((file) => {
        formDataToSubmit.append(fieldName, file);
      });

      if (existingImageUrls.length > 0) {
        formDataToSubmit.append(
          `${fieldName}Urls`,
          JSON.stringify(existingImageUrls),
        );
      }

      let notesFieldName;
      if (editingImageType === "initial") {
        notesFieldName = "notes";
      } else if (editingImageType === "received") {
        notesFieldName = "receivedNotes";
      } else {
        notesFieldName = getCompletionNotesField(
          editingImageReport.reportType,
        );
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

        closeEditImagesModal();
        setEditImages([]);

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

  return {
    handleDelete,
    confirmDelete,
    handleReject,
    handleEditReport,
    handleEditSubmit,
    resetEditState,
    handleReceivedImageUpload,
    handleReceivedSubmit,
    handleAcceptReceivedFromCard,
    handleCompletionImageUpload,
    handleCompletionSubmit,
    handleEditInitialImages,
    handleEditReceivedImages,
    handleEditCompletionImages,
    handleEditImageUpload,
    handleRemoveEditImage,
    handleUpdateImages,
  };
};
