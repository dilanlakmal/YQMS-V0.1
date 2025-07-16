import React, { useState } from "react";
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2
} from "lucide-react";
import Webcam from "react-webcam";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import Swal from "sweetalert2";

const QAImageUpload = ({ imageUrl, onImageChange, uploadMetadata }) => {
  const [showWebcam, setShowWebcam] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  const webcamRef = React.useRef(null);

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (!uploadMetadata || !uploadMetadata.moNo) {
      Swal.fire("Error", "Cannot upload image without MO Number.", "error");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("imageFile", file);
    formData.append("imageType", "defect");
    formData.append("moNo", uploadMetadata.moNo);
    formData.append("qcId", uploadMetadata.qcId);
    formData.append("date", new Date().toISOString());

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/qa-accuracy/upload-image`,
        formData
      );
      if (res.data.success) {
        onImageChange(res.data.filePath);
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      Swal.fire("Upload Failed", "Could not upload the image.", "error");
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
    handleImageUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    onImageChange(""); // Set URL to empty string
  };

  if (isUploading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className="relative group w-16 h-12">
        <img
          src={imageUrl}
          alt="Defect"
          className="w-full h-full object-cover rounded"
        />
        <button
          onClick={removeImage}
          className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-1 text-gray-500 hover:text-purple-600"
        >
          <Upload size={18} />
        </button>
        <button
          type="button"
          onClick={() => setShowWebcam(true)}
          className="p-1 text-gray-500 hover:text-blue-600"
        >
          <Camera size={18} />
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {showWebcam && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-full max-w-md">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
            />
            <div className="flex justify-center mt-4 gap-4">
              <button
                onClick={handleCapture}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Capture
              </button>
              <button
                onClick={() => setShowWebcam(false)}
                className="px-4 py-2 bg-red-500 text-white rounded"
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

export default QAImageUpload;
