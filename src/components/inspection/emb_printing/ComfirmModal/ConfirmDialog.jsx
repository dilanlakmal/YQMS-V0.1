import React from "react";
import { X, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, type = "warning", confirmText = "Confirm", cancelText = "Cancel", confirmColor = "red" }) => {
  if (!isOpen) return null;

  const iconMap = {
    warning: <AlertTriangle className="w-6 h-6 text-orange-500" />,
    danger: <AlertTriangle className="w-6 h-6 text-red-500" />,
    success: <CheckCircle className="w-6 h-6 text-green-500" />,
    question: <HelpCircle className="w-6 h-6 text-blue-500" />
  };

  const colorMap = {
    red: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    green: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
    blue: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            {/* <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100">
              {iconMap[type] || iconMap.warning}
            </div> */}

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {title}
            </h3>

            {/* Message */}
            <p className="text-sm text-gray-600 text-center mb-6">
              {message}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (onConfirm) {
                    onConfirm();
                  }
                  onClose();
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${colorMap[confirmColor] || colorMap.red}`}
              >
                {confirmText}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

