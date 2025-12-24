import React, { useState } from "react";
import { FileText, Camera, Upload, X, Edit, Plus, Trash2 } from "lucide-react";
import YPivotQATemplatesImageEditor from "../QATemplates/YPivotQATemplatesImageEditor";

const YPivotQAInspectionManualDefect = ({ data, onUpdate }) => {
  // Local state for UI controls
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editorContext, setEditorContext] = useState(null);

  // Destructure data or provide defaults
  const remarks = data?.remarks || "";
  const images = data?.images || [];

  // --- Handlers ---

  const handleTextChange = (e) => {
    const text = e.target.value.slice(0, 1000); // Enforce 1000 char limit
    onUpdate({
      ...data,
      remarks: text
    });
  };

  // mode can be 'camera', 'upload', or null
  const handleOpenEditor = (mode = "upload", existingImages = null) => {
    setEditorContext({
      mode: mode,
      existingData: existingImages,
      isEditing: !!existingImages
    });
    setShowImageEditor(true);
  };

  const handleEditorSave = (savedImages) => {
    let updatedList;

    if (editorContext.isEditing) {
      // If we passed existing images to edit, replace them
      updatedList = savedImages;
    } else {
      // If adding new, combine
      updatedList = [...images, ...savedImages];
    }

    // Enforce max 10 images constraint logic
    if (updatedList.length > 10) {
      alert("Maximum 10 images allowed. Trimming excess.");
      updatedList = updatedList.slice(0, 10);
    }

    onUpdate({
      ...data,
      images: updatedList
    });

    setShowImageEditor(false);
    setEditorContext(null);
  };

  const handleDeleteImage = (index) => {
    if (window.confirm("Delete this photo?")) {
      const newImages = [...images];
      newImages.splice(index, 1);
      onUpdate({
        ...data,
        images: newImages
      });
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* --- Remarks Section --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            General Remarks
          </h3>
          <span
            className={`text-xs font-bold ${
              remarks.length >= 1000 ? "text-red-500" : "text-gray-400"
            }`}
          >
            {remarks.length} / 1000
          </span>
        </div>
        <textarea
          value={remarks}
          onChange={handleTextChange}
          placeholder="Type your manual inspection notes, general observations, or specific issues not covered by the defect list..."
          rows={6}
          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
        />
      </div>

      {/* --- Photos Section --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-500" />
            Manual Photos
          </h3>
          <span className="text-xs text-gray-400 font-medium">
            {images.length} / 10 Max
          </span>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id || idx}
              className="relative group aspect-square bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <img
                src={img.editedImgSrc || img.imgSrc}
                alt={`Evidence ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => handleOpenEditor(null, [img])} // Re-open editor for this specific image
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                  title="Edit Annotations"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteImage(idx)}
                  className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                #{idx + 1}
              </div>
            </div>
          ))}

          {/* Add Buttons (Capture & Upload) */}
          {images.length < 10 && (
            <div className="aspect-square flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-2 transition-all">
              <span className="text-xs font-bold text-gray-400">Add Photo</span>
              <div className="flex gap-2">
                {/* Camera Button */}
                <button
                  onClick={() => handleOpenEditor("camera")}
                  className="flex flex-col items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 hover:scale-105 transition-all shadow-sm"
                  title="Take Photo"
                >
                  <Camera className="w-5 h-5" />
                </button>

                {/* Upload Button */}
                <button
                  onClick={() => handleOpenEditor("upload")}
                  className="flex flex-col items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 hover:scale-105 transition-all shadow-sm"
                  title="Upload Image"
                >
                  <Upload className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {images.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            No photos added yet. Click above to add evidence.
          </div>
        )}
      </div>

      {/* --- Image Editor Portal --- */}
      {showImageEditor && (
        <YPivotQATemplatesImageEditor
          autoStartMode={editorContext?.isEditing ? null : editorContext?.mode}
          existingData={editorContext?.existingData}
          onSave={handleEditorSave}
          onCancel={() => {
            setShowImageEditor(false);
            setEditorContext(null);
          }}
        />
      )}
    </div>
  );
};

export default YPivotQAInspectionManualDefect;
