import { useCallback } from "react";
import { API_BASE_URL } from "../../../../../config.js";
import showToast from "../../../../utils/toast.js";
import {
  PRINT_WASH_TEST_DEFAULTS,
  EMB_PRINT_WASH_TEST_DEFAULTS,
} from "../constants/reportTypes.js";
import { useFormStore } from "../stores/useFormStore.js";
import { useModalStore } from "../stores/useModalStore.js";

/**
 * Custom hook for report submission and status updates.
 * Loading flags live in useFormStore (isSubmitting) and useModalStore
 * (isSavingReceived, isSavingCompletion) so modals/forms can read them
 * without prop drilling.
 */
export const useReportSubmission = (user, fetchReports) => {
  const { setIsSubmitting } = useFormStore();
  const { setIsSavingReceived, setIsSavingCompletion } = useModalStore();

  // Submit new report
  const submitReport = useCallback(
    async (formData, onSuccess) => {
      // Validate that at least one color is selected (Garment/Home Wash)
      if (
        (formData.reportType === "Garment Wash Report" ||
          formData.reportType === "Home Wash Test") &&
        (!formData.color || formData.color.length === 0)
      ) {
        showToast.warning("Please select at least one color");
        return false;
      }
      // Validate fabric selection for HT Testing when fabricColor is multi-select array
      if (
        formData.reportType === "HT Testing" &&
        Array.isArray(formData.fabricColor) &&
        formData.fabricColor.length === 0
      ) {
        showToast.warning("Please select at least one fabric");
        return false;
      }

      setIsSubmitting(true);
      try {
        // For HT Testing or EMB/Printing Testing, fill empty test result fields with defaults before submit
        const defaultsMap =
          formData.reportType === "HT Testing"
            ? PRINT_WASH_TEST_DEFAULTS
            : formData.reportType === "EMB/Printing Testing"
              ? EMB_PRINT_WASH_TEST_DEFAULTS
              : null;
        const dataToSubmit = defaultsMap
          ? {
              ...formData,
              ...Object.fromEntries(
                Object.entries(defaultsMap).map(([k, v]) => [
                  k,
                  formData[k] != null && String(formData[k]).trim() !== ""
                    ? formData[k]
                    : v,
                ]),
              ),
            }
          : formData;

        const formDataToSubmit = new FormData();

        // Add common form fields
        formDataToSubmit.append(
          "reportType",
          dataToSubmit.reportType || "Garment Wash Report",
        );
        formDataToSubmit.append(
          "ymStyle",
          dataToSubmit.ymStyle || dataToSubmit.style || "",
        );
        formDataToSubmit.append("buyerStyle", dataToSubmit.buyerStyle || "");
        formDataToSubmit.append(
          "color",
          JSON.stringify(dataToSubmit.color || []),
        );
        formDataToSubmit.append("po", JSON.stringify(dataToSubmit.po || []));
        formDataToSubmit.append(
          "exFtyDate",
          JSON.stringify(dataToSubmit.exFtyDate || []),
        );
        formDataToSubmit.append("factory", dataToSubmit.factory || "");
        formDataToSubmit.append(
          "sendToHomeWashingDate",
          dataToSubmit.sendToHomeWashingDate || "",
        );
        formDataToSubmit.append("notes", dataToSubmit.notes || "");
        formDataToSubmit.append(
          "reporter_emp_id",
          user?.emp_id || user?.id || user?._id || "",
        );
        formDataToSubmit.append(
          "reporter_name",
          user?.name || user?.username || "",
        );

        // Add all other fields dynamically (avoiding already added ones, images, and complex objects)
        const skipFields = [
          "reportType",
          "ymStyle",
          "buyerStyle",
          "color",
          "po",
          "exFtyDate",
          "factory",
          "sendToHomeWashingDate",
          "notes",
          "images",
          "userId",
          "userName",
          "reporter_emp_id",
          "reporter_name",
          "careLabelImage",
          "style",
          "styleNo",
          "moNo",
          "date",
        ];
        Object.keys(dataToSubmit).forEach((key) => {
          if (
            !skipFields.includes(key) &&
            dataToSubmit[key] !== undefined &&
            dataToSubmit[key] !== null
          ) {
            if (key === "fabricColor" && Array.isArray(dataToSubmit[key])) {
              // Multi-select fabric: send as comma-separated string
              formDataToSubmit.append(key, dataToSubmit[key].join(", "));
            } else if (
              key === "shrinkageRows" &&
              Array.isArray(dataToSubmit[key])
            ) {
              // Store only rows that are selected AND have measurement data (G1/G2)
              const rowsToStore = dataToSubmit[key].filter(
                (row) =>
                  row.selected !== false && (row.beforeWash || row.afterWash),
              );
              formDataToSubmit.append(key, JSON.stringify(rowsToStore));
            } else if (Array.isArray(dataToSubmit[key])) {
              formDataToSubmit.append(key, JSON.stringify(dataToSubmit[key]));
            } else if (typeof dataToSubmit[key] === "object") {
              formDataToSubmit.append(key, JSON.stringify(dataToSubmit[key]));
            } else {
              formDataToSubmit.append(key, dataToSubmit[key]);
            }
          }
        });

        // Handle careLabelImage as an array of files or URLs
        if (
          dataToSubmit.careLabelImage &&
          Array.isArray(dataToSubmit.careLabelImage)
        ) {
          dataToSubmit.careLabelImage.forEach((item) => {
            if (item instanceof File) {
              formDataToSubmit.append("careLabelImage", item);
            }
          });
          // Also send existing URLs if any
          const existingUrls = dataToSubmit.careLabelImage.filter(
            (item) => typeof item === "string",
          );
          if (existingUrls.length > 0) {
            formDataToSubmit.append(
              "careLabelImageUrls",
              JSON.stringify(existingUrls),
            );
          }
        } else if (dataToSubmit.careLabelImage instanceof File) {
          formDataToSubmit.append(
            "careLabelImage",
            dataToSubmit.careLabelImage,
          );
        } else if (
          dataToSubmit.careLabelImage &&
          typeof dataToSubmit.careLabelImage === "string"
        ) {
          formDataToSubmit.append(
            "careLabelImageUrls",
            JSON.stringify([dataToSubmit.careLabelImage]),
          );
        }

        // Validate and add image files
        if (dataToSubmit.images && dataToSubmit.images.length > 0) {
          const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
          ];

          dataToSubmit.images.forEach((imageFile) => {
            if (imageFile instanceof File) {
              const fileType = imageFile.type.toLowerCase();
              if (!allowedTypes.includes(fileType)) {
                throw new Error(
                  `Invalid image file: ${imageFile.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`,
                );
              }
              formDataToSubmit.append("images", imageFile);
            }
          });
        }

        const response = await fetch(
          `${API_BASE_URL}/api/report-washing/submit`,
          {
            method: "POST",
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
          showToast.success("Report submitted successfully!");
          await fetchReports();
          if (onSuccess) onSuccess();
          return true;
        } else {
          const errorMessage =
            result?.message ||
            result?.error ||
            `Server error (${response.status}): ${response.statusText}`;
          showToast.error(errorMessage);
          console.error("Error submitting report:", result);
          return false;
        }
      } catch (error) {
        console.error("Error submitting report:", error);
        const errorMessage =
          error.message ||
          "An error occurred while submitting the report. Please try again.";
        showToast.error(errorMessage);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, fetchReports],
  );

  // Save received status
  const saveReceivedStatus = useCallback(
    async (
      reportId,
      receivedImages,
      receivedNotes,
      shouldUpdateStatus,
      onSuccess,
    ) => {
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
          // Add receiver_emp_id (status is set to "received" above)
          if (user?.emp_id) {
            formDataToSubmit.append("receiver_emp_id", user.emp_id);
          }
        }

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
            }
          }
          throw new Error(errorMessage);
        }

        if (response.ok && result.success) {
          showToast.success("✓ Received saved successfully!");
          await fetchReports();
          if (onSuccess) onSuccess(reportId);
          return true;
        } else {
          showToast.error(
            result.message || "Failed to save received. Please try again.",
          );
          return false;
        }
      } catch (error) {
        console.error("Error saving received:", error);
        showToast.error(
          error.message ||
            "An error occurred while saving received. Please try again.",
        );
        return false;
      } finally {
        setIsSavingReceived(false);
      }
    },
    [fetchReports],
  );

  // Helper to get completion notes field name based on report type
  const getCompletionNotesField = (reportType) => {
    switch (reportType) {
      case "Home Wash Test":
        return "completionNotes_HomeWash";
      case "HT Testing":
        return "completionNotes_HTTesting";
      case "EMB/Printing Testing":
        return "completionNotes_EMBPrinting";
      case "Pulling Test":
        return "completionNotes_Pulling";
      default:
        // Fallback or default
        return "completionNotes";
    }
  };

  // Save completion status
  // completionAssign: optional { checkedBy, approvedBy, checkedByName, approvedByName } from assignment to store on report
  const saveCompletionStatus = useCallback(
    async (
      reportId,
      completionImages,
      completionNotes,
      onSuccess,
      reportType,
      completionAssign,
    ) => {
      if (!reportId) return false;

      // Determine the field name for completion notes
      // If reportType is not provided, we might default to generic 'completionNotes' or try to fetch it first?
      // For now assuming reportType is passed or we default to generic if missing,
      // but ideally we should know the type.
      const noteFieldName = reportType
        ? getCompletionNotesField(reportType)
        : "completionNotes";

      setIsSavingCompletion(true);
      try {
        const formDataToSubmit = new FormData();
        formDataToSubmit.append("status", "completed");
        formDataToSubmit.append(
          "completedDate",
          new Date().toISOString().split("T")[0],
        );
        formDataToSubmit.append("completedAt", new Date().toISOString());

        // Add completer_emp_id (status is set to "completed" above)
        if (user?.emp_id) {
          formDataToSubmit.append("completer_emp_id", user.emp_id);
        }

        // Store assignment checkedBy/approvedBy and names for view on completed report
        if (completionAssign) {
          if (
            completionAssign.checkedBy != null &&
            completionAssign.checkedBy !== ""
          )
            formDataToSubmit.append("checkedBy", completionAssign.checkedBy);
          if (
            completionAssign.approvedBy != null &&
            completionAssign.approvedBy !== ""
          )
            formDataToSubmit.append("approvedBy", completionAssign.approvedBy);
          if (
            completionAssign.checkedByName != null &&
            completionAssign.checkedByName !== ""
          )
            formDataToSubmit.append(
              "checkedByName",
              completionAssign.checkedByName,
            );
          if (
            completionAssign.approvedByName != null &&
            completionAssign.approvedByName !== ""
          )
            formDataToSubmit.append(
              "approvedByName",
              completionAssign.approvedByName,
            );
        }

        // Use the dynamic field name
        formDataToSubmit.append(noteFieldName, completionNotes || "");

        completionImages.forEach((imageFile, index) => {
          if (imageFile instanceof File) {
            formDataToSubmit.append("completionImages", imageFile);
          } else if (
            imageFile &&
            typeof imageFile === "object" &&
            imageFile instanceof Blob
          ) {
            // Some capture APIs return Blob; append with a filename so multer receives it
            formDataToSubmit.append(
              "completionImages",
              imageFile,
              `completion-${index}.webp`,
            );
          }
        });

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
          showToast.error(
            result.message || "Failed to complete report. Please try again.",
          );
          return false;
        }
      } catch (error) {
        console.error("Error completing report:", error);
        showToast.error(
          error.message ||
            "An error occurred while completing the report. Please try again.",
        );
        return false;
      } finally {
        setIsSavingCompletion(false);
      }
    },
    [fetchReports],
  );

  // Update report
  const updateReport = useCallback(
    async (reportId, editFormData) => {
      if (!editFormData.color || editFormData.color.length === 0) {
        showToast.warning("Please select at least one color");
        return false;
      }

      try {
        const formDataToSubmit = new FormData();
        const reportType = editFormData.reportType || "Garment Wash Report";
        formDataToSubmit.append("reportType", reportType);

        formDataToSubmit.append(
          "color",
          JSON.stringify(editFormData.color || []),
        );
        formDataToSubmit.append("buyerStyle", editFormData.buyerStyle || "");
        formDataToSubmit.append("po", JSON.stringify(editFormData.po || []));
        formDataToSubmit.append(
          "exFtyDate",
          JSON.stringify(editFormData.exFtyDate || []),
        );
        formDataToSubmit.append("factory", editFormData.factory || "");
        formDataToSubmit.append(
          "sendToHomeWashingDate",
          editFormData.sendToHomeWashingDate || "",
        );

        // Add all other fields dynamically
        const skipFields = [
          "reportType",
          "color",
          "buyerStyle",
          "po",
          "exFtyDate",
          "factory",
          "sendToHomeWashingDate",
          "images",
          "receivedImages",
          "completionImages",
          "completionNotes",
          "careLabelImage",
          "style",
          "styleNo",
          "moNo",
          "date",
        ];
        Object.keys(editFormData).forEach((key) => {
          if (
            !skipFields.includes(key) &&
            editFormData[key] !== undefined &&
            editFormData[key] !== null
          ) {
            if (key === "shrinkageRows" && Array.isArray(editFormData[key])) {
              // Store only rows that are selected AND have measurement data (G1/G2)
              const rowsToStore = editFormData[key].filter(
                (row) =>
                  row.selected !== false && (row.beforeWash || row.afterWash),
              );
              formDataToSubmit.append(key, JSON.stringify(rowsToStore));
            } else if (Array.isArray(editFormData[key])) {
              formDataToSubmit.append(key, JSON.stringify(editFormData[key]));
            } else if (typeof editFormData[key] === "object") {
              formDataToSubmit.append(key, JSON.stringify(editFormData[key]));
            } else {
              formDataToSubmit.append(key, editFormData[key]);
            }
          }
        });

        // Handle images (initial)
        if (editFormData.images && Array.isArray(editFormData.images)) {
          const existingUrls = editFormData.images.filter(
            (item) => typeof item === "string",
          );
          if (existingUrls.length > 0) {
            formDataToSubmit.append("imagesUrls", JSON.stringify(existingUrls));
          }
          editFormData.images.forEach((item) => {
            if (item instanceof File) {
              formDataToSubmit.append("images", item);
            }
          });
        }

        // Handle receivedImages
        if (
          editFormData.receivedImages &&
          Array.isArray(editFormData.receivedImages)
        ) {
          const existingUrls = editFormData.receivedImages.filter(
            (item) => typeof item === "string",
          );
          if (existingUrls.length > 0) {
            formDataToSubmit.append(
              "receivedImagesUrls",
              JSON.stringify(existingUrls),
            );
          }
          editFormData.receivedImages.forEach((item) => {
            if (item instanceof File) {
              formDataToSubmit.append("receivedImages", item);
            }
          });
        }

        // Handle completionImages
        if (
          editFormData.completionImages &&
          Array.isArray(editFormData.completionImages)
        ) {
          const existingUrls = editFormData.completionImages.filter(
            (item) => typeof item === "string",
          );
          if (existingUrls.length > 0) {
            formDataToSubmit.append(
              "completionImagesUrls",
              JSON.stringify(existingUrls),
            );
          }
          editFormData.completionImages.forEach((item, index) => {
            if (item instanceof File) {
              formDataToSubmit.append("completionImages", item);
            } else if (
              item &&
              typeof item === "object" &&
              item instanceof Blob
            ) {
              formDataToSubmit.append(
                "completionImages",
                item,
                `completion-${index}.webp`,
              );
            }
          });
        }

        // Handle careLabelImage as an array of files or URLs
        if (
          editFormData.careLabelImage &&
          Array.isArray(editFormData.careLabelImage)
        ) {
          editFormData.careLabelImage.forEach((item) => {
            if (item instanceof File) {
              formDataToSubmit.append("careLabelImage", item);
            }
          });
          // Also send existing URLs if any
          const existingUrls = editFormData.careLabelImage.filter(
            (item) => typeof item === "string",
          );
          if (existingUrls.length > 0) {
            formDataToSubmit.append(
              "careLabelImageUrls",
              JSON.stringify(existingUrls),
            );
          }
        } else if (editFormData.careLabelImage instanceof File) {
          formDataToSubmit.append(
            "careLabelImage",
            editFormData.careLabelImage,
          );
        } else if (
          editFormData.careLabelImage &&
          typeof editFormData.careLabelImage === "string"
        ) {
          formDataToSubmit.append(
            "careLabelImageUrls",
            JSON.stringify([editFormData.careLabelImage]),
          );
        }

        // Handle completionNotes separately to map to correct field
        if (editFormData.completionNotes !== undefined) {
          const noteFieldName = getCompletionNotesField(reportType);
          formDataToSubmit.append(noteFieldName, editFormData.completionNotes);
        }

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
          showToast.success("Report updated successfully!");
          await fetchReports();
          return true;
        } else {
          const errorMessage =
            result?.message ||
            result?.error ||
            `Server error (${response.status}): ${response.statusText}`;
          showToast.error(errorMessage);
          console.error("Error updating report:", result);
          return false;
        }
      } catch (error) {
        console.error("Error updating report:", error);
        const errorMessage =
          error.message ||
          "An error occurred while updating the report. Please try again.";
        showToast.error(errorMessage);
        return false;
      }
    },
    [fetchReports],
  );

  return {
    submitReport,
    saveReceivedStatus,
    saveCompletionStatus,
    updateReport,
  };
};
