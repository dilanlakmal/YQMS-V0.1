import axios from "axios";
import { Camera, Upload, X as XIcon } from "lucide-react"; // Renamed X to XIcon to avoid conflict
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Webcam from "react-webcam";
import { API_BASE_URL } from "../../../../config"; // Adjust path if you have this

const AuditImageUpload = ({
  images = [],
  onImagesChange,
  maxImages = 5,
  requirementId // This should be a unique identifier for the audit item/row
}) => {
  const { t } = useTranslation();
  const [showWebcam, setShowWebcam] = useState(false);
  const [selectedImageForPopup, setSelectedImageForPopup] = useState(null);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleUpload = async (fileOrSrc, isCapture = false) => {
    if (images.length >= maxImages) {
      // Consider using a more user-friendly notification system (e.g., react-toastify)
      alert(
        t("auditTable.maxImagesReached", { max: maxImages }) ||
          `Maximum ${maxImages} images allowed.`
      );
      return;
    }

    const formData = new FormData();
    if (isCapture) {
      try {
        const blob = await fetch(fileOrSrc).then((res) => res.blob());
        const file = new File(
          [blob],
          `audit-capture-${requirementId || "item"}-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );
        formData.append("auditImage", file);
      } catch (error) {
        console.error("Error creating blob from captured image:", error);
        alert(t("auditTable.captureError", "Error processing captured image."));
        setShowWebcam(false);
        return;
      }
    } else {
      formData.append("auditImage", fileOrSrc);
    }
    // Ensure requirementId is a string or number, not undefined.
    formData.append("requirementId", String(requirementId || "general"));

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/audit/upload-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      if (response.data && response.data.success && response.data.filePath) {
        onImagesChange([...images, response.data.filePath]);
      } else {
        console.error(
          "Image upload failed:",
          response.data?.message || "Unknown server error during upload."
        );
        alert(
          t("auditTable.uploadFailedMsg", {
            message: response.data?.message || "Server error"
          }) ||
            `Image upload failed: ${response.data?.message || "Server error"}`
        );
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Network error";
      alert(
        t("auditTable.uploadErrorMsg", { message: errorMessage }) ||
          `Error uploading image: ${errorMessage}`
      );
    } finally {
      if (isCapture) setShowWebcam(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert(
          t(
            "auditTable.invalidFileType",
            "Invalid file type. Please select an image."
          ) || "Invalid file type. Please select an image."
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit (example)
        alert(
          t(
            "auditTable.fileTooLarge",
            "File is too large. Maximum size is 5MB."
          ) || "File is too large. Maximum size is 5MB."
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      handleUpload(file, false);
    }
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
  };

  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        handleUpload(imageSrc, true);
      } else {
        console.error("Failed to get screenshot from webcam.");
        alert(
          t(
            "auditTable.webcamScreenshotFailed",
            "Failed to capture image from webcam."
          )
        );
      }
    } else {
      console.error("Webcam reference is not available.");
      alert(t("auditTable.webcamNotAvailable", "Webcam is not available."));
    }
  };

  const removeImage = (indexToRemove) => {
    // Optional: API call to delete image from server
    // const imagePathToDelete = images[indexToRemove];
    // axios.post(`${API_BASE_URL}/api/audit/delete-image`, { filePath: imagePathToDelete })
    //   .then(response => console.log('Image deleted from server:', response))
    //   .catch(error => console.error('Error deleting image from server:', error));

    onImagesChange(images.filter((_, index) => index !== indexToRemove));
  };

  // Video constraints for react-webcam
  const videoConstraints = {
    width: 1280, // You can adjust these dimensions
    height: 720,
    // 'environment' for rear camera on mobile, 'user' for front camera
    facingMode: { ideal: "environment" }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {images.map((imgSrc, index) => (
        <div
          key={index}
          className="relative w-16 h-16 border border-gray-300 rounded-md shadow-sm"
        >
          <img
            src={
              imgSrc.startsWith("http") || imgSrc.startsWith("data:")
                ? imgSrc
                : `${API_BASE_URL}${imgSrc}`
            }
            alt={
              t("auditTable.auditImageAlt", { index: index + 1 }) ||
              `Audit ${index + 1}`
            }
            className="w-full h-full object-cover rounded-md cursor-pointer"
            onClick={() =>
              setSelectedImageForPopup(
                imgSrc.startsWith("http") || imgSrc.startsWith("data:")
                  ? imgSrc
                  : `${API_BASE_URL}${imgSrc}`
              )
            }
          />
          <button
            onClick={() => removeImage(index)}
            className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-600 text-white rounded-full leading-none hover:bg-red-700 transition-colors"
            title={t("auditTable.removeImage")}
          >
            <XIcon size={14} strokeWidth={3} />
          </button>
        </div>
      ))}

      {images.length < maxImages && (
        <div className="flex flex-col items-center justify-center w-16 h-16 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 transition-colors p-1">
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="p-1 text-gray-600 hover:text-indigo-700"
            title={t("auditTable.uploadImage")}
          >
            <Upload size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/gif" // Be more specific with accept types
            className="hidden"
          />
          <button
            onClick={() => setShowWebcam(true)}
            className="p-1 text-gray-600 hover:text-indigo-700"
            title={t("auditTable.captureImage")}
          >
            <Camera size={20} />
          </button>
        </div>
      )}

      {showWebcam && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl max-w-xl w-full">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={videoConstraints} // Use the defined constraints
              mirrored={videoConstraints.facingMode === "user"} // Mirror if front camera
              onUserMediaError={(err) => {
                console.error("Webcam UserMedia Error:", err);
                alert(
                  t("auditTable.webcamAccessError", { error: err.name }) ||
                    `Webcam access error: ${err.name}. Please ensure camera permissions are granted.`
                );
                setShowWebcam(false);
              }}
            />
            <div className="mt-4 flex flex-col sm:flex-row justify-around gap-3">
              <button
                onClick={handleCapture}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors w-full sm:w-auto"
              >
                {t("auditTable.captureImage")}
              </button>
              <button
                onClick={() => setShowWebcam(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors w-full sm:w-auto"
              >
                {t("common.cancel", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImageForPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4" // Higher z-index
          onClick={() => setSelectedImageForPopup(null)} // Close on backdrop click
        >
          <div
            className="bg-white p-3 rounded-lg shadow-xl max-w-4xl w-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on image/modal content
          >
            <img
              src={selectedImageForPopup}
              alt={
                t("auditTable.imagePreviewAlt", "Image Preview") ||
                "Image Preview"
              }
              className="max-w-full max-h-[calc(90vh-80px)] object-contain rounded-md" // Adjust max-h for button space
            />
            <button
              onClick={() => setSelectedImageForPopup(null)}
              className="mt-3 block mx-auto px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              {t("common.close", "Close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditImageUpload;
