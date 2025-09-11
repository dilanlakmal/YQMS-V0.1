import axios from "axios";
import { Camera, Loader2, Minus, Plus, Upload, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";

const SubConQCQADefect = ({
  defect,
  onUpdate,
  onRemove,
  inspectionContext
}) => {
  const [qty, setQty] = useState(defect.qty || 1);
  const [images, setImages] = useState(defect.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Notify parent of any internal state changes
    onUpdate(defect.code, { ...defect, qty, images });
  }, [qty, images]);

  const handleQtyChange = (amount) => {
    setQty((prevQty) => Math.max(1, prevQty + amount));
  };

  const uploadFile = async (file) => {
    if (
      !inspectionContext.date ||
      !inspectionContext.factory ||
      !inspectionContext.lineNo ||
      !inspectionContext.moNo
    ) {
      Swal.fire(
        "Missing Info",
        "Please select a Date, Factory, and MO No before uploading images.",
        "warning"
      );
      return;
    }
    if (images.length >= 5) {
      Swal.fire(
        "Limit Reached",
        "A maximum of 5 images are allowed per defect.",
        "warning"
      );
      return;
    }

    const formData = new FormData();
    formData.append("imageFile", file);
    formData.append("date", inspectionContext.date.toISOString().split("T")[0]);
    formData.append("factory", inspectionContext.factory.value);
    formData.append("lineNo", inspectionContext.lineNo.value);
    formData.append("moNo", inspectionContext.moNo.value);
    formData.append("defectCode", defect.code);

    setIsUploading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/subcon-qa/upload-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );
      if (res.data.success) {
        setImages([...images, res.data.filePath]);
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      Swal.fire(
        "Upload Failed",
        "There was an error uploading the image.",
        "error"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadFile(file);
    }
    event.target.value = null; // Reset input
  };

  const handleCapture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const blob = await (await fetch(imageSrc)).blob();
      const file = new File([blob], `capture-${Date.now()}.jpg`, {
        type: "image/jpeg"
      });
      uploadFile(file);
      setShowWebcam(false);
    }
  };

  const handleDeleteImage = (indexToDelete) => {
    setImages(images.filter((_, index) => index !== indexToDelete));
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-4 space-y-3">
      {/* Defect Info Header */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
            {defect.english}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {defect.khmer} | {defect.chinese}
          </p>
        </div>
        <button
          onClick={() => onRemove(defect.code)}
          className="text-red-500 hover:text-red-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Content: Qty and Images */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Quantity Control */}
        <div className="flex flex-col items-center justify-center space-y-2 p-2 border rounded-md">
          <label className="text-xs font-semibold uppercase">Qty</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleQtyChange(-1)}
              className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full"
            >
              <Minus size={16} />
            </button>
            <span className="text-2xl font-bold w-10 text-center">{qty}</span>
            <button
              onClick={() => handleQtyChange(1)}
              className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Image Upload and Previews */}
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setShowWebcam(true)}
              disabled={isUploading || images.length >= 5}
              className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              <Camera size={20} />
            </button>
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={isUploading || images.length >= 5}
              className="p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-gray-400"
            >
              <Upload size={20} />
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <span className="text-sm text-gray-500 ml-auto">
              ({images.length}/5)
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {images.map((imgUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imgUrl}
                  alt={`Defect ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md"
                />
                <button
                  onClick={() => handleDeleteImage(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {isUploading && (
              <div className="w-full h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md">
                <Loader2 className="animate-spin" size={24} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Webcam Modal */}
      {showWebcam && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-lg">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
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
    </div>
  );
};

export default SubConQCQADefect;
