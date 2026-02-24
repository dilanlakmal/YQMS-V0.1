import React, { useRef } from "react";
import { X, Camera, Upload, RotateCw, Save, CheckCircle } from "lucide-react";
import showToast from "../../../../utils/toast";

/**
 * Shared modal for uploading images + adding notes.
 * Replaces the near-identical ReceivedModal and CompletionModal.
 *
 * Required props:
 *   isOpen, onClose, images, setImages, notes, setNotes,
 *   captureInputRef, onUpload, onSubmit, isSaving,
 *   imageRotations, setImageRotations,
 *   title, description, imageLabel, notesPlaceholder,
 *   submitLabel, savingLabel, submitColor ("yellow" | "green"),
 *   submitIcon ("save" | "check")
 */
const ImageUploadModal = ({
  isOpen,
  onClose,
  images,
  setImages,
  notes,
  setNotes,
  captureInputRef,
  onUpload,
  onSubmit,
  isSaving,
  imageRotations,
  setImageRotations,
  // Config
  title,
  description,
  imageLabel,
  notesPlaceholder,
  submitLabel,
  savingLabel,
  submitColor = "yellow",
  submitIcon = "save",
  // Optional: quick accept (no images/notes)
  quickAcceptLabel,
  onQuickAccept,
}) => {
  const uploadInputRef = useRef(null);

  if (!isOpen) return null;

  const submitBtnClass =
    submitColor === "green"
      ? "bg-green-600 hover:bg-green-700"
      : "bg-yellow-600 hover:bg-yellow-700";

  const SubmitIcon = submitIcon === "check" ? CheckCircle : Save;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>

          {/* Image section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {imageLabel}
              </label>
              <span className={`text-xs font-medium ${images.length >= 5 ? "text-red-500" : "text-gray-500"}`}>
                {images.length}/5 images
              </span>
            </div>

            <div className="space-y-4">
              {images.length > 0 && (
                <div className="flex flex-row gap-2 overflow-x-auto">
                  {images.map((imageFile, index) => {
                    const imageUrl = URL.createObjectURL(imageFile);
                    const rotation = imageRotations[index] || 0;
                    return (
                      <div key={index} className="relative w-32 h-32 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                        <div className="w-full h-full flex items-center justify-center">
                          <img
                            src={imageUrl}
                            alt={`${imageLabel} ${index + 1}`}
                            className="max-w-full max-h-full object-contain transition-transform duration-300"
                            style={{ transform: `rotate(${rotation}deg)` }}
                          />
                        </div>
                        <div className="absolute top-1 right-1 flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(imageUrl);
                              setImages((prev) => prev.filter((_, i) => i !== index));
                              setImageRotations((prev) => {
                                const next = { ...prev };
                                delete next[index];
                                return next;
                              });
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                            title="Remove"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (images.length >= 5) { showToast.warning("Maximum of 5 images allowed."); return; }
                    captureInputRef.current?.click();
                  }}
                  disabled={images.length >= 5}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera size={18} className="mr-2" />
                  Capture
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (images.length >= 5) { showToast.warning("Maximum of 5 images allowed."); return; }
                    uploadInputRef.current?.click();
                  }}
                  disabled={images.length >= 5}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={18} className="mr-2" />
                  Upload
                </button>
              </div>

              {/* Camera capture input */}
              <input
                ref={captureInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                capture="environment"
                multiple
                onChange={(e) => {
                  onUpload(e.target.files);
                  if (captureInputRef.current) captureInputRef.current.value = "";
                }}
              />
              {/* Gallery/file upload input */}
              <input
                ref={uploadInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                multiple
                onChange={(e) => {
                  onUpload(e.target.files);
                  if (uploadInputRef.current) uploadInputRef.current.value = "";
                }}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder={notesPlaceholder}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            {quickAcceptLabel && onQuickAccept && (
              <button
                type="button"
                onClick={onQuickAccept}
                disabled={isSaving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? <RotateCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isSaving ? savingLabel : quickAcceptLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSaving}
              className={`px-4 py-2 text-sm ${submitBtnClass} text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            >
              {isSaving ? <RotateCw className="w-4 h-4 animate-spin" /> : <SubmitIcon className="w-4 h-4" />}
              {isSaving ? savingLabel : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;
