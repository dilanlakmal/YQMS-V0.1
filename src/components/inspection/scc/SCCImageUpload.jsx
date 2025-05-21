import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const SCCImageUpload = ({
  label,
  onImageChange, // Callback with (file, previewUrl)
  onImageRemove,
  initialImageUrl,
  imageType // 'referenceSample' or 'afterWash' - used for differentiation if needed
}) => {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState(initialImageUrl || null);
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreviewUrl(initialImageUrl); // Sync with prop changes
  }, [initialImageUrl]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        setImageFile(file);
        if (onImageChange) {
          onImageChange(file, reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation(); // Prevent click from triggering file input if preview is inside label
    setPreviewUrl(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
    if (onImageRemove) {
      onImageRemove();
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Basic camera functionality (opens file dialog with camera option on mobile)
  const triggerCameraInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment"); // or "user" for front camera
      fileInputRef.current.click();
      // Clean up the capture attribute after use
      fileInputRef.current.onchange = () => {
        handleFileChange({ target: fileInputRef.current }); // process the file
        fileInputRef.current.removeAttribute("capture"); // remove attribute
      };
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="mt-1 flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-md">
        {previewUrl ? (
          <div className="relative group w-full max-w-xs h-48 mb-2">
            <img
              src={previewUrl}
              alt={t("scc.imagePreview", "Preview")}
              className="w-full h-full object-contain rounded-md"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-75 group-hover:opacity-100 transition-opacity"
              aria-label={t("scc.removeImage", "Remove image")}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Upload size={40} className="mx-auto mb-2" />
            <p>{t("scc.noImageSelected", "No image selected")}</p>
          </div>
        )}
        <div className="flex space-x-2 mt-2">
          <button
            type="button"
            onClick={triggerCameraInput}
            className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <Camera size={18} className="mr-2" />
            {t("scc.capture", "Capture")}
          </button>
          <button
            type="button"
            onClick={triggerFileInput}
            className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <Upload size={18} className="mr-2" />
            {t("scc.upload", "Upload")}
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
      </div>
    </div>
  );
};

export default SCCImageUpload;
