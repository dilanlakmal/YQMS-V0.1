import { useState, useCallback } from "react";
import { API_BASE_URL } from "../../../../../config.js";
import showToast from "../../../../utils/toast.js";

/**
 * Custom hook for report submission and status updates
 */
export const useReportSubmission = (user, fetchReports) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingReceived, setIsSavingReceived] = useState(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);

  // Submit new report
  const submitReport = useCallback(async (formData, onSuccess) => {
    // Validate that at least one color is selected
    if (!formData.color || formData.color.length === 0) {
      showToast.warning("Please select at least one color");
      return false;
    }

    setIsSubmitting(true);
    try {
      const formDataToSubmit = new FormData();

      // Add form fields
      formDataToSubmit.append("reportType", formData.reportType || "Home Wash/Garment Wash Test");
      formDataToSubmit.append("ymStyle", formData.ymStyle || "");
      formDataToSubmit.append("buyerStyle", formData.buyerStyle || "");
      formDataToSubmit.append("color", JSON.stringify(formData.color || []));
      formDataToSubmit.append("po", JSON.stringify(formData.po || []));
      formDataToSubmit.append("exFtyDate", JSON.stringify(formData.exFtyDate || []));
      formDataToSubmit.append("factory", formData.factory || "");
      formDataToSubmit.append("sendToHomeWashingDate", formData.sendToHomeWashingDate || "");
      formDataToSubmit.append("notes", formData.notes || "");
      formDataToSubmit.append("userId", user?.id || user?._id || "");
      formDataToSubmit.append("userName", user?.name || user?.username || "");

      // Validate and add image files
      if (formData.images && formData.images.length > 0) {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

        formData.images.forEach((imageFile) => {
          if (imageFile instanceof File) {
            const fileType = imageFile.type.toLowerCase();
            if (!allowedTypes.includes(fileType)) {
              throw new Error(`Invalid image file: ${imageFile.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`);
            }
            formDataToSubmit.append("images", imageFile);
          }
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/report-washing/submit`, {
        method: "POST",
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
        showToast.success("Report submitted successfully!");
        await fetchReports();
        if (onSuccess) onSuccess();
        return true;
      } else {
        const errorMessage = result?.message || result?.error || `Server error (${response.status}): ${response.statusText}`;
        showToast.error(errorMessage);
        console.error("Error submitting report:", result);
        return false;
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      const errorMessage = error.message || "An error occurred while submitting the report. Please try again.";
      showToast.error(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, fetchReports]);

  // Save received status
  const saveReceivedStatus = useCallback(async (reportId, receivedImages, receivedNotes, shouldUpdateStatus, onSuccess) => {
    if (!reportId) return false;

    setIsSavingReceived(true);
    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("receivedNotes", receivedNotes || "");

      receivedImages.forEach((imageFile) => {
        if (imageFile instanceof File) {
          formDataToSubmit.append("receivedImages", imageFile);
        }
      });

      if (shouldUpdateStatus) {
        const currentDate = new Date().toISOString();
        const currentDateOnly = currentDate.split("T")[0];
        formDataToSubmit.append("status", "received");
        formDataToSubmit.append("receivedDate", currentDateOnly);
        formDataToSubmit.append("receivedAt", currentDate);
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
          }
        }
        throw new Error(errorMessage);
      }

      if (response.ok && result.success) {
        showToast.success("✓ Received details saved successfully!");
        await fetchReports();
        if (onSuccess) onSuccess(reportId);
        return true;
      } else {
        showToast.error(result.message || "Failed to save received details. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("Error saving received details:", error);
      showToast.error(error.message || "An error occurred while saving received details. Please try again.");
      return false;
    } finally {
      setIsSavingReceived(false);
    }
  }, [fetchReports]);

  // Save completion status
  const saveCompletionStatus = useCallback(async (reportId, completionImages, completionNotes, onSuccess) => {
    if (!reportId) return false;

    setIsSavingCompletion(true);
    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("status", "completed");
      formDataToSubmit.append("completedDate", new Date().toISOString().split("T")[0]);
      formDataToSubmit.append("completedAt", new Date().toISOString());
      formDataToSubmit.append("completionNotes", completionNotes || "");

      completionImages.forEach((imageFile) => {
        if (imageFile instanceof File) {
          formDataToSubmit.append("completionImages", imageFile);
        }
      });

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
          }
        }
        throw new Error(errorMessage);
      }

      if (response.ok && result.success) {
        showToast.success("✓ Report Completed Successfully!");
        await fetchReports();
        if (onSuccess) onSuccess(reportId);
        return true;
      } else {
        showToast.error(result.message || "Failed to complete report. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("Error completing report:", error);
      showToast.error(error.message || "An error occurred while completing the report. Please try again.");
      return false;
    } finally {
      setIsSavingCompletion(false);
    }
  }, [fetchReports]);

  // Update report
  const updateReport = useCallback(async (reportId, editFormData) => {
    if (!editFormData.color || editFormData.color.length === 0) {
      showToast.warning("Please select at least one color");
      return false;
    }

    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("reportType", editFormData.reportType || "Home Wash/Garment Wash Test");
      formDataToSubmit.append("color", JSON.stringify(editFormData.color || []));
      formDataToSubmit.append("buyerStyle", editFormData.buyerStyle || "");
      formDataToSubmit.append("po", JSON.stringify(editFormData.po || []));
      formDataToSubmit.append("exFtyDate", JSON.stringify(editFormData.exFtyDate || []));
      formDataToSubmit.append("factory", editFormData.factory || "");
      formDataToSubmit.append("sendToHomeWashingDate", editFormData.sendToHomeWashingDate || "");

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
        await fetchReports();
        return true;
      } else {
        const errorMessage = result?.message || result?.error || `Server error (${response.status}): ${response.statusText}`;
        showToast.error(errorMessage);
        console.error("Error updating report:", result);
        return false;
      }
    } catch (error) {
      console.error("Error updating report:", error);
      const errorMessage = error.message || "An error occurred while updating the report. Please try again.";
      showToast.error(errorMessage);
      return false;
    }
  }, [fetchReports]);

  return {
    isSubmitting,
    isSavingReceived,
    isSavingCompletion,
    submitReport,
    saveReceivedStatus,
    saveCompletionStatus,
    updateReport,
  };
};

