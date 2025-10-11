import axios from "axios";
import { Camera, Loader2, Upload, XCircle } from "lucide-react";
import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";

const ImageUpload = ({
  imageUrls,
  onImageChange,
  uploadMetadata,
  maxImages = 5,
  imageType,
  sectionName = ""
}) => {
  const [showWebcam, setShowWebcam] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file) return;
    const requiredMeta = [
      "reportType",
      "factory",
      "lineNo",
      "moNo",
      //"color",
      "qcId"
    ];
    for (const key of requiredMeta) {
      if (!uploadMetadata?.[key]) {
        Swal.fire(
          "Error",
          `Cannot upload image. Missing required information: ${key}`,
          "error"
        );
        return;
      }
    }
    // if (!uploadMetadata?.moNo || !uploadMetadata?.qcId) {
    //   Swal.fire(
    //     "Error",
    //     "Cannot upload image without MO Number and QC ID.",
    //     "error"
    //   );
    //   return;
    // }
    if (imageUrls.length >= maxImages) {
      Swal.fire(
        "Limit Reached",
        `You can only upload a maximum of ${maxImages} images.`,
        "warning"
      );
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("imageFile", file);
    formData.append("reportType", uploadMetadata.reportType);
    formData.append("factory", uploadMetadata.factory);
    formData.append("lineNo", uploadMetadata.lineNo);
    formData.append("moNo", uploadMetadata.moNo);
    formData.append("color", uploadMetadata.color);
    formData.append("qcId", uploadMetadata.qcId);
    formData.append("imageType", imageType);
    if (sectionName) formData.append("sectionName", sectionName);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/subcon-qa/upload-image`,
        formData
      );
      if (res.data.success) {
        onImageChange([...imageUrls, res.data.filePath]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      Swal.fire(
        "Upload Failed",
        error.response?.data?.message || "Could not upload the image.",
        "error"
      );
    } finally {
      setIsUploading(false);
      setShowWebcam(false);
    }
  };

  const handleCapture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    const blob = await (await fetch(imageSrc)).blob();
    const file = new File([blob], `capture-${Date.now()}.jpg`, {
      type: "image/jpeg"
    });
    handleUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = null; // Reset file input
  };

  const removeImage = (indexToRemove) => {
    onImageChange(imageUrls.filter((_, index) => index !== indexToRemove));
  };

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {imageUrls.map((url, index) => (
          <div key={url} className="relative group w-full h-24">
            <img
              src={`${API_BASE_URL}${url}`} //{url}
              alt={`Upload ${index + 1}`}
              className="w-full h-full object-cover rounded-md"
            />
            <button
              onClick={() => removeImage(index)}
              className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <XCircle size={16} />
            </button>
          </div>
        ))}
        {imageUrls.length < maxImages &&
          (isUploading ? (
            <div className="w-full h-24 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md">
              <Loader2 className="animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="w-full h-24 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-md col-span-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600"
                title="Upload from device"
              >
                <Upload size={24} />
              </button>
              <button
                onClick={() => setShowWebcam(true)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600"
                title="Use Camera"
              >
                <Camera size={24} />
              </button>
            </div>
          ))}
      </div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {showWebcam && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg w-full max-w-md">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
            />
            <div className="flex justify-center mt-4 gap-4">
              <button
                onClick={handleCapture}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Capture
              </button>
              <button
                onClick={() => setShowWebcam(false)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageUpload;
