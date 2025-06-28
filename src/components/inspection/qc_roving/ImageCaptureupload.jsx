import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { Camera, Upload, XCircle, AlertTriangle, Eye, X } from "lucide-react";

const ImageCaptureUpload = ({
  imageType,
  maxImages = 5,
  onImageFilesChange,
  inspectionData,
  initialImageFiles = []
}) => {
  const { t } = useTranslation();
  const [imageFiles, setImageFiles] = useState(initialImageFiles);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [error, setError] = useState("");

  // --- NEW --- Webcam and Modal state
  const [showWebcam, setShowWebcam] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");

  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);
  const initialRenderForContext = useRef(true);

  // Effect to create temporary preview URLs for the image files
  useEffect(() => {
    const urls = imageFiles
      .map((file) => {
        if (file instanceof File) {
          return URL.createObjectURL(file);
        }
        return null; // Should not happen if state is managed correctly
      })
      .filter(Boolean);

    setPreviewUrls(urls);

    // Cleanup function to revoke the object URLs to avoid memory leaks
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  // Effect to clear images when the context (e.g., MO No) changes
  useEffect(() => {
    if (initialRenderForContext.current) {
      initialRenderForContext.current = false;
      return;
    }
    // This logic correctly resets the component on context change
    setImageFiles([]);
    if (onImageFilesChange) {
      onImageFilesChange([]);
    }
    setError("");
  }, [
    inspectionData.date,
    inspectionData.lineNo,
    inspectionData.moNo,
    inspectionData.operationId,
    imageType,
    onImageFilesChange // Added dependency
  ]);

  // --- NEW --- Function to add a file (from upload or camera) to the state
  const addImageFile = (file) => {
    if (imageFiles.length >= maxImages) {
      Swal.fire(
        t("qcRoving.imageUpload.limitReachedTitle", "Image Limit Reached"),
        t(
          "qcRoving.imageUpload.limitReachedText",
          `Maximum ${maxImages} images allowed.`
        ),
        "warning"
      );
      return;
    }

    const updatedFiles = [...imageFiles, file];
    setImageFiles(updatedFiles);
    // This is the crucial part that communicates with the parent component
    if (onImageFilesChange) {
      onImageFilesChange(updatedFiles);
    }
  };

  // Handler for file input change
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    files.forEach((file) => addImageFile(file));

    // Reset file input to allow selecting the same file again
    if (event.target) event.target.value = null;
  };

  // --- NEW --- Handler for capturing an image from the webcam
  const handleCapture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      try {
        const blob = await (await fetch(imageSrc)).blob();
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg"
        });
        addImageFile(file);
        setShowWebcam(false);
      } catch (e) {
        console.error("Error creating file from blob:", e);
        setError(
          t(
            "qcRoving.imageUpload.captureError",
            "Could not process captured image."
          )
        );
      }
    }
  };

  // Handler for deleting an image
  const handleDeleteImage = (indexToDelete) => {
    Swal.fire({
      title: t("qcRoving.imageUpload.confirmDeleteTitle", "Confirm Delete"),
      text: t(
        "qcRoving.imageUpload.confirmDeleteText",
        "Are you sure you want to delete this image?"
      ),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("qcRoving.buttons.yesDeleteIt", "Yes, delete it!"),
      cancelButtonText: t("cancel", "Cancel")
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedFiles = imageFiles.filter(
          (_, index) => index !== indexToDelete
        );
        setImageFiles(updatedFiles);

        // Notify the parent component of the change
        if (onImageFilesChange) {
          onImageFilesChange(updatedFiles);
        }
        setError("");
      }
    });
  };

  const triggerFileUpload = () => fileInputRef.current?.click();
  const openImagePreview = (url) => {
    setPreviewImageUrl(url);
    setShowPreviewModal(true);
  };
  const closeImagePreview = () => {
    setShowPreviewModal(false);
    setPreviewImageUrl("");
  };

  const isContextDataComplete =
    inspectionData.date &&
    inspectionData.lineNo &&
    inspectionData.lineNo !== "NA_Line" &&
    inspectionData.moNo &&
    inspectionData.moNo !== "NA_MO" &&
    inspectionData.operationId &&
    inspectionData.operationId !== "NA_Op";

  const canAddImages = imageFiles.length < maxImages && isContextDataComplete;

  return (
    <div className="border p-3 rounded-lg shadow-sm bg-gray-50">
      {!isContextDataComplete && (
        <div className="mb-2 p-2 text-xs bg-yellow-100 text-yellow-700 rounded-md flex items-center">
          <AlertTriangle size={16} className="mr-1 flex-shrink-0" />
          {t(
            "qcRoving.imageUpload.fillRequiredFields",
            "Fill required fields to enable image upload."
          )}
        </div>
      )}

      {/* --- MODIFIED --- Buttons Section */}
      <div className="flex items-center space-x-2 mb-3">
        <button
          type="button"
          onClick={() => setShowWebcam(true)}
          disabled={!canAddImages}
          className="flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs"
        >
          <Camera size={16} className="mr-1" />
        </button>
        <button
          type="button"
          onClick={triggerFileUpload}
          disabled={!canAddImages}
          className="flex items-center px-3 py-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs"
        >
          <Upload size={16} className="mr-1" />
        </button>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          ref={fileInputRef}
          style={{ display: "none" }}
        />
        <span className="text-xs text-gray-600 ml-auto">
          ({imageFiles.length}/{maxImages})
        </span>
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      {/* Image Preview Grid */}
      {previewUrls.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {previewUrls.map((url, index) => (
            <div
              key={url}
              className="relative group border rounded-md overflow-hidden shadow"
            >
              <img
                src={url}
                alt={`${imageType} ${index + 1}`}
                className="w-full h-20 object-cover cursor-pointer hover:opacity-75"
                onClick={() => openImagePreview(url)}
              />
              <button
                type="button"
                onClick={() => handleDeleteImage(index)}
                className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                aria-label={t("qcRoving.buttons.deleteImage")}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- NEW --- Webcam Modal */}
      {showWebcam && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70]">
          <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-lg">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={{
                facingMode: { ideal: "environment" }
              }}
            />
            <div className="flex justify-center mt-4 gap-4">
              <button
                onClick={handleCapture}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                {t("qcRoving.buttons.capture", "Capture")}
              </button>
              <button
                onClick={() => setShowWebcam(false)}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                {t("cancel", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[80]">
          <div className="bg-white p-4 rounded-lg shadow-xl max-w-3xl max-h-[90vh] relative">
            <button
              onClick={closeImagePreview}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-white rounded-full p-1 z-10"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <img
              src={previewImageUrl}
              alt={t("qcRoving.imageUpload.previewAlt", "Image Preview")}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCaptureUpload;
