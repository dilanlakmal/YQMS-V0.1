import React, { useRef } from 'react';
import { Camera, Upload, X, Save, RotateCw } from 'lucide-react';
import { normalizeImageUrl } from '../lib';

const EditImagesModal = ({
    isOpen,
    onClose,
    title,
    images, // Array of Files or URL strings
    onRemoveImage,
    onUploadImage,
    onSave,
    isSaving,
    saveButtonColor = "blue" // "blue" | "yellow" | "green"
}) => {
    const localFileInputRef = useRef(null);
    const localCameraInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        if (onUploadImage && e.target.files) {
            onUploadImage(e.target.files);
        }
        if (e.target) e.target.value = "";
    };

    const getButtonColorClass = () => {
        switch (saveButtonColor) {
            case "yellow": return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
            case "green": return "bg-green-600 hover:bg-green-700 focus:ring-green-500";
            default: return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                        {title}
                    </h3>

                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Images
                            </label>
                            <span className={`text-xs font-medium ${images.length >= 5 ? 'text-red-500' : 'text-gray-500'}`}>
                                {images.length}/5 images
                            </span>
                        </div>
                        <div className="space-y-4">
                            {images.length > 0 && (
                                <div className="flex flex-row flex-wrap gap-2">
                                    {images.map((image, index) => {
                                        const imageUrl = image instanceof File ? URL.createObjectURL(image) : normalizeImageUrl(image);
                                        return (
                                            <div key={index} className="relative w-32 h-32 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <img
                                                        src={imageUrl}
                                                        alt={`Image ${index + 1}`}
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveImage(index)}
                                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                                                    title="Remove"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => localCameraInputRef.current?.click()}
                                    disabled={images.length >= 5}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Camera size={18} className="mr-2" />
                                    Capture
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        localFileInputRef.current?.click();
                                    }}
                                    disabled={images.length >= 5}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Upload size={18} className="mr-2" />
                                    Upload
                                </button>
                            </div>
                            <input
                                ref={localFileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                multiple
                                onChange={handleFileChange}
                            />
                            <input
                                ref={localCameraInputRef}
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                capture="environment"
                                multiple
                                onChange={handleFileChange}
                            />
                        </div>
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
                            onClick={onSave}
                            disabled={isSaving}
                            className={`px-4 py-2 text-sm text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${getButtonColorClass()}`}
                        >
                            {isSaving ? (
                                <RotateCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isSaving ? "Updating..." : "Update Images"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditImagesModal;
