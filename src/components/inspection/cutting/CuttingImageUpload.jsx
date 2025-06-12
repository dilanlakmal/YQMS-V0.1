import React, { useState, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { Camera, Upload, Eye, X, Loader2 } from "lucide-react";

const CuttingImageUpload = ({
  onUploadSuccess,
  onRemove,
  existingImageUrl = null
}) => {
  const { t } = useTranslation();
  const [showWebcam, setShowWebcam] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);

  const hasImage = !!existingImageUrl;

  const handleUpload = async (file) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/upload-cutting-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true
        }
      );

      if (response.data.success) {
        onUploadSuccess(response.data.url); // Pass the relative URL
      } else {
        throw new Error(response.data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Swal.fire({
        icon: "error",
        title: t("cutting.error"),
        text: error.response?.data?.message || t("cutting.failedToUploadImage")
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    }
    event.target.value = null; // Reset file input
  };

  const handleCapture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      try {
        const blob = await (await fetch(imageSrc)).blob();
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg"
        });
        setShowWebcam(false);
        handleUpload(file);
      } catch (e) {
        console.error("Error creating file from blob:", e);
      }
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              disabled={hasImage}
              className={`p-1 rounded ${
                hasImage
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-purple-500 text-white"
              }`}
            >
              <Upload className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => setShowWebcam(true)}
              disabled={hasImage}
              className={`p-1 rounded ${
                hasImage
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 text-white"
              }`}
            >
              <Camera className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => onUploadSuccess(existingImageUrl)} // This re-uses the existing URL for preview
              disabled={!hasImage}
              className={`p-1 rounded ${
                hasImage
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              <Eye className="w-5 h-5" />
            </button>

            {hasImage && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1 bg-red-500 text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>

      {showWebcam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={{ facingMode: { ideal: "environment" } }}
            />
            <div className="flex justify-center mt-4 gap-4">
              <button
                onClick={handleCapture}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                {t("cutting.capture")}
              </button>
              <button
                onClick={() => setShowWebcam(false)}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                {t("cutting.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CuttingImageUpload;
