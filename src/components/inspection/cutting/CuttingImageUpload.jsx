import React, { useState, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { Camera, Upload, Eye, X, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression"; // <-- IMPORT THIS

const CuttingImageUpload = ({
  onUploadSuccess,
  onRemove,
  existingImageUrl = null,
}) => {
  const { t } = useTranslation();
  const [showWebcam, setShowWebcam] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);

  const hasImage = !!existingImageUrl;

  // MODIFIED: This function now takes a compressed file
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
          withCredentials: true,
        },
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
        text: error.response?.data?.message || t("cutting.failedToUploadImage"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // MODIFIED: Intercept the file selection to compress it first
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setIsLoading(true);
      try {
        console.log(
          `Original cutting image size: ${(file.size / 1024 / 1024).toFixed(
            2,
          )} MB`,
        );
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
          fileType: "image/webp",
        };
        const compressedFile = await imageCompression(file, options);
        console.log(
          `Compressed cutting image size: ${(
            compressedFile.size /
            1024 /
            1024
          ).toFixed(2)} MB`,
        );
        await handleUpload(compressedFile); // Upload the compressed file
      } catch (error) {
        console.error("Compression error:", error);
        await handleUpload(file); // Fallback to original if compression fails
      } finally {
        setIsLoading(false);
      }
    }
    event.target.value = null;
  };

  // MODIFIED: Intercept the webcam capture to compress it
  const handleCapture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setShowWebcam(false);
      setIsLoading(true);
      try {
        const blob = await (await fetch(imageSrc)).blob();
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        // Compress the captured image
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
          fileType: "image/webp",
        };
        const compressedFile = await imageCompression(file, options);
        await handleUpload(compressedFile);
      } catch (e) {
        console.error("Error creating/compressing file from blob:", e);
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {isLoading ? (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">
              {t("cutting.processing", "Processing...")}
            </span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              disabled={hasImage || isLoading}
              className={`p-1 rounded transition-colors ${
                hasImage || isLoading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-purple-500 text-white hover:bg-purple-600"
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
              disabled={hasImage || isLoading}
              className={`p-1 rounded transition-colors ${
                hasImage || isLoading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              <Camera className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() =>
                window.open(`${API_BASE_URL}${existingImageUrl}`, "_blank")
              }
              disabled={!hasImage || isLoading}
              className={`p-1 rounded transition-colors ${
                hasImage
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              <Eye className="w-5 h-5" />
            </button>

            {hasImage && (
              <button
                type="button"
                onClick={onRemove}
                disabled={isLoading}
                className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>

      {showWebcam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl">
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
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                {t("cutting.capture")}
              </button>
              <button
                onClick={() => setShowWebcam(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
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
