import React from "react";
import { X, Camera, Upload, RotateCw, Save } from "lucide-react";
import showToast from "../../../utils/toast";

const ReceivedModal = ({
  isOpen,
  onClose,
  receivedImages,
  setReceivedImages,
  receivedNotes,
  setReceivedNotes,
  receivedImageInputRef,
  handleReceivedImageUpload,
  handleReceivedSubmit,
  isSavingReceived,
  receivedImageRotations,
  setReceivedImageRotations,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Received Report
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Please upload images and add notes for this received report.
          </p>

          {/* Received Images */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Received Images
            </label>
            <div className="space-y-4">
              {receivedImages.length > 0 && (
                <div className="flex flex-row gap-2 overflow-x-auto">
                  {receivedImages.map((imageFile, index) => {
                    const imageUrl = URL.createObjectURL(imageFile);
                    const rotation = receivedImageRotations[index] || 0;
                    return (
                      <div key={index} className="relative w-32 h-32 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                        <div className="w-full h-full flex items-center justify-center">
                          <img
                            src={imageUrl}
                            alt={`Received ${index + 1}`}
                            className="max-w-full max-h-full object-contain transition-transform duration-300"
                            style={{ transform: `rotate(${rotation}deg)` }}
                          />
                        </div>
                        {/* Control Buttons */}
                        <div className="absolute top-1 right-1 flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(imageUrl);
                              setReceivedImages((prev) => prev.filter((_, i) => i !== index));
                              setReceivedImageRotations((prev) => {
                                const newRotations = { ...prev };
                                delete newRotations[index];
                                return newRotations;
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
                  onClick={() => receivedImageInputRef.current?.click()}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors"
                >
                  <Camera size={18} className="mr-2" />
                  Capture
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/jpeg,image/jpg,image/png,image/gif,image/webp";
                    input.multiple = true;
                    input.onchange = (e) => handleReceivedImageUpload(e.target.files);
                    input.click();
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors"
                >
                  <Upload size={18} className="mr-2" />
                  Upload
                </button>
              </div>
              <input
                ref={receivedImageInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                capture="environment"
                multiple
                onChange={(e) => {
                  handleReceivedImageUpload(e.target.files);
                  if (receivedImageInputRef.current) {
                    receivedImageInputRef.current.value = "";
                  }
                }}
              />
            </div>
          </div>

          {/* Received Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={receivedNotes}
              onChange={(e) => setReceivedNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter received notes..."
            />
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReceivedSubmit}
              disabled={isSavingReceived}
              className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSavingReceived ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSavingReceived ? "Saving..." : "Save Received Details"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceivedModal;

