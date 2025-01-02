import { X } from "lucide-react";

export function ImagePreviewDialog({ isOpen, onClose, imageUrl }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-3xl w-full mx-4">
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <img
          src={imageUrl}
          alt="Defect preview"
          className="w-full h-auto max-h-[80vh] object-contain"
        />
      </div>
    </div>
  );
}
