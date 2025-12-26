import React, { useState, useRef } from 'react';
import { Upload, Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';

const QRCodeUpload = ({ onScanSuccess, onScanError, disabled = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);

  const processImage = async (file) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          resolve(code.data);
        } else {
          reject(new Error('No QR code found in the image'));
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFile = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onScanError(new Error('Please upload an image file'));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onScanError(new Error('File size too large. Please upload an image smaller than 10MB'));
      return;
    }

    setProcessing(true);
    setUploadedImage(URL.createObjectURL(file));

    try {
      const qrData = await processImage(file);
      onScanSuccess(qrData);
    } catch (error) {
      onScanError(error);
      setUploadedImage(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (disabled) return;
    
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
          dragActive
            ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
            : disabled
            ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        {processing ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Processing image...</p>
          </div>
        ) : uploadedImage ? (
          <div className="relative">
            <img
              src={uploadedImage}
              alt="Uploaded QR Code"
              className="max-w-full max-h-48 mx-auto rounded-lg shadow-md border dark:border-gray-600"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearImage();
              }}
              className="absolute -top-2 -right-2 bg-red-500 dark:bg-red-600 text-white rounded-full p-1 hover:bg-red-600 dark:hover:bg-red-700 transition-colors shadow-lg"
            >
              <X size={16} />
            </button>
            <div className="mt-3 flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle size={16} className="mr-1" />
              <span className="text-sm font-medium">QR Code detected!</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={`p-3 rounded-full mb-4 transition-colors duration-300 ${
              disabled 
                ? 'bg-gray-200 dark:bg-gray-600' 
                : 'bg-indigo-100 dark:bg-indigo-900/50'
            }`}>
              <Upload className={`w-8 h-8 transition-colors duration-300 ${
                disabled 
                  ? 'text-gray-400 dark:text-gray-500' 
                  : 'text-indigo-600 dark:text-indigo-400'
              }`} />
            </div>

            <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
              disabled 
                ? 'text-gray-400 dark:text-gray-500' 
                : 'text-gray-700 dark:text-gray-200'
            }`}>
              Upload QR Code Image
            </h3>

            <p className={`text-sm mb-4 transition-colors duration-300 ${
              disabled 
                ? 'text-gray-400 dark:text-gray-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              Drag and drop an image here, or click to select
            </p>

            <div className={`text-xs transition-colors duration-300 ${
              disabled 
                ? 'text-gray-400 dark:text-gray-500' 
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              Supports: JPG, PNG, GIF (Max 10MB)
            </div>
          </div>
        )}
      </div>

      {!disabled && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border dark:border-gray-700">
            💡 <span className="font-medium">Tip:</span> Make sure the QR code is clearly visible and well-lit in the image
          </p>
        </div>
      )}
    </div>
  );
};

export default QRCodeUpload;
