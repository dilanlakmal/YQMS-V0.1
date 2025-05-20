import React, { useState, useRef, useEffect } from "react";
import { X, Camera } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import Swal from "sweetalert2";

const RovingCamera = ({
  isOpen,
  onClose,
  onImageCaptured,
  date,
  type,
  empId
}) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" } // Use back camera
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to access camera. Please ensure camera permissions are granted."
      });
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg");
    setCapturedImage(imageData);
    stopCamera();
  };

  const uploadImage = async () => {
    try {
      const blob = await fetch(capturedImage).then((res) => res.blob());
      const formData = new FormData();
      formData.append("image", blob, "image.jpg");
      formData.append("date", date);
      formData.append("type", type);
      formData.append("emp_id", empId);

      const response = await axios.post(
        `${API_BASE_URL}/api/upload-qc-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      onImageCaptured(response.data.imagePath);
      onClose();
    } catch (error) {
      console.error("Error uploading image:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to upload image."
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Capture Image</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {capturedImage ? (
          <div className="flex flex-col items-center">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-auto rounded-lg mb-4"
            />
            <div className="flex space-x-4">
              <button
                onClick={() => setCapturedImage(null)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Retake
              </button>
              <button
                onClick={uploadImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <video ref={videoRef} className="w-full h-auto rounded-lg mb-4" />
            <button
              onClick={captureImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Capture
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RovingCamera;
