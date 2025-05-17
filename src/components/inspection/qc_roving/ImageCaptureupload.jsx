import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { Camera, Upload, XCircle, AlertTriangle } from "lucide-react";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

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
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const initialRenderForContext = useRef(true);

  useEffect(() => {
    const currentGeneratedPreviewUrls = imageFiles
      .map((file) => {
        if (file instanceof File) {
          return URL.createObjectURL(file);
        }
        return null;
      })
      .filter((url) => url !== null);

    setPreviewUrls(currentGeneratedPreviewUrls);

    return () => {
      currentGeneratedPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  useEffect(() => {
    if (initialRenderForContext.current) {
      initialRenderForContext.current = false;
      if (imageFiles.length > 0 && imageFiles === initialImageFiles) {
        return;
      }

      return;
    }

    console.log(
      `ImageCaptureUpload (${imageType}): Context/type changed AFTER initial setup. Resetting. InspectionData:`,
      JSON.stringify(inspectionData)
    );
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
    imageType
  ]);

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    console.log(
      `ImageCaptureUpload (${imageType}): handleFileChange called. Current local imageFiles.length: ${imageFiles.length}, Files selected: ${files.length}`
    );
    if (files.length === 0) return;

    if (imageFiles.length >= maxImages) {
      console.warn(
        `ImageCaptureUpload (${imageType}): Max images (${maxImages}) reached or exceeded. Current count: ${imageFiles.length}.`
      );
      Swal.fire(
        t("qcRoving.imageUpload.limitTitle"),
        t("qcRoving.imageUpload.maxImagesReached", {
          max: maxImages,
          current: imageFiles.length
        }),
        "warning"
      );
      if (event.target) event.target.value = null;
      return;
    }

    setError("");
    setIsUploading(true);
    const combinedImageFiles = [...imageFiles];
    let filesAddedCount = 0;

    for (const file of files) {
      if (combinedImageFiles.length >= maxImages) {
        Swal.fire(
          t("qcRoving.imageUpload.limitTitle"),
          t("qcRoving.imageUpload.maxImagesReachedSome", {
            max: maxImages,
            uploaded: combinedImageFiles.length,
            attempting: files.length - filesAddedCount
          }),
          "warning"
        );
        break;
      }

      combinedImageFiles.push(file);
      filesAddedCount++;
    }

    setImageFiles(combinedImageFiles);
    if (onImageFilesChange) {
      onImageFilesChange(combinedImageFiles);
    }
    setIsUploading(false);
    if (event.target) event.target.value = null;
  };

  const handleDeleteImage = (indexToDelete) => {
    Swal.fire({
      title: t("qcRoving.imageUpload.confirmDeleteTitle"),
      text: t("qcRoving.imageUpload.confirmDeleteText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("qcRoving.imageUpload.confirmDeleteButton"),
      cancelButtonText: t("qcRoving.buttons.cancel")
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedFiles = imageFiles.filter(
          (_, index) => index !== indexToDelete
        );

        setImageFiles(updatedFiles);

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

  const canSelectFiles =
    !isUploading && imageFiles.length < maxImages && isContextDataComplete;

  return (
    <div className="border p-3 rounded-lg shadow-sm bg-gray-50">
      {!isContextDataComplete && (
        <div className="mb-2 p-2 text-xs bg-yellow-100 text-yellow-700 rounded-md flex items-center">
          <AlertTriangle size={16} className="mr-1 flex-shrink-0" />
          {t("qcRoving.imageUpload.fillRequiredFields")}
        </div>
      )}
      <div className="flex items-center space-x-2 mb-3">
        <button
          type="button"
          onClick={triggerFileUpload}
          disabled={!canSelectFiles}
          className="flex items-center px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs"
        >
          <Upload size={16} className="mr-1" />
        </button>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: "none" }}
        />

        <span className="text-xs text-gray-600 ml-auto">
          ({imageFiles.length}/{maxImages})
        </span>
      </div>

      {isUploading && (
        <p className="text-xs text-blue-600 animate-pulse">
          {t("qcRoving.imageUpload.processing")}
        </p>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      {previewUrls.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {previewUrls.map((url, index) => (
            <div
              key={index}
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
                <XCircle size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Image Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70]">
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
