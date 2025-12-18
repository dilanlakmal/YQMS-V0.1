// YPivotQATemplatesImageRemoveBackground.jsx
import React, { useState, useCallback } from "react";
import { removeBackground } from "@imgly/background-removal";

/**
 * Custom hook for background removal functionality
 * Uses @imgly/background-removal (free, runs entirely in browser using ML)
 */
export const useBackgroundRemoval = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState(null);

  const removeImageBackground = useCallback(async (imageSrc, options = {}) => {
    const {
      backgroundColor = "#FFFFFF",
      quality = 0.95,
      outputFormat = "image/png"
    } = options;

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage("Initializing...");
    setError(null);

    try {
      // Convert data URL to blob if needed
      let imageBlob;
      if (imageSrc.startsWith("data:")) {
        const response = await fetch(imageSrc);
        imageBlob = await response.blob();
      } else {
        const response = await fetch(imageSrc);
        imageBlob = await response.blob();
      }

      setProgressMessage("Loading AI model...");

      // Remove background using @imgly/background-removal
      const resultBlob = await removeBackground(imageBlob, {
        progress: (key, current, total) => {
          const progressPercent = Math.round((current / total) * 100);
          setProgress(progressPercent);

          // Update message based on progress stage
          if (key === "compute:inference") {
            setProgressMessage("Analyzing image...");
          } else if (key === "compute:mask") {
            setProgressMessage("Detecting edges...");
          } else if (key === "compute:output") {
            setProgressMessage("Removing background...");
          }
        },
        model: "medium", // 'small' (faster), 'medium' (balanced), 'large' (best quality)
        output: {
          format: "image/png",
          quality: 1.0
        }
      });

      setProgressMessage("Applying white background...");
      setProgress(90);

      // Convert result blob to image
      const img = new Image();
      const resultUrl = URL.createObjectURL(resultBlob);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = resultUrl;
      });

      // Create canvas with white background
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      // Enable high quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill with background color (white by default)
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the image with removed background on top
      ctx.drawImage(img, 0, 0);

      // Clean up blob URL
      URL.revokeObjectURL(resultUrl);

      // Return as data URL
      const finalImageSrc = canvas.toDataURL(outputFormat, quality);

      setProgress(100);
      setProgressMessage("Complete!");
      setIsProcessing(false);

      return {
        success: true,
        imageSrc: finalImageSrc,
        originalWidth: img.width,
        originalHeight: img.height
      };
    } catch (err) {
      console.error("Background removal error:", err);
      const errorMessage =
        err.message || "Failed to remove background. Please try again.";
      setError(errorMessage);
      setIsProcessing(false);
      setProgressMessage("");

      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setProgressMessage("");
    setError(null);
  }, []);

  return {
    removeImageBackground,
    isProcessing,
    progress,
    progressMessage,
    error,
    resetState
  };
};

/**
 * Modal component for showing background removal progress
 */
export const BackgroundRemovalModal = ({
  isOpen,
  progress,
  progressMessage,
  onCancel,
  error,
  onRetry
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-700">
        <div className="text-center space-y-4">
          {error ? (
            // Error State
            <>
              <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-white">
                Processing Failed
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{error}</p>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={onCancel}
                  className="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </>
          ) : (
            // Processing State
            <>
              <div className="w-24 h-24 mx-auto relative">
                {/* Outer ring */}
                <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>

                {/* Progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="url(#progressGradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 44 * (1 - progress / 100)
                    }`}
                    className="transition-all duration-300"
                  />
                  <defs>
                    <linearGradient
                      id="progressGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {progress}%
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white">
                Removing Background
              </h3>

              <p className="text-indigo-400 text-sm font-medium">
                {progressMessage || "Processing..."}
              </p>

              <p className="text-gray-500 text-xs">
                AI is detecting and removing the background
              </p>

              {/* Progress bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>

              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm mt-2"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Background color picker for replacement background
 */
export const BackgroundColorPicker = ({
  isOpen,
  onSelect,
  onCancel,
  currentColor = "#FFFFFF"
}) => {
  const [selectedColor, setSelectedColor] = useState(currentColor);

  const presetColors = [
    { color: "#FFFFFF", name: "White" },
    { color: "#F3F4F6", name: "Light Gray" },
    { color: "#E5E7EB", name: "Gray" },
    { color: "#000000", name: "Black" },
    { color: "#FEF3C7", name: "Cream" },
    { color: "#DBEAFE", name: "Light Blue" },
    { color: "#D1FAE5", name: "Light Green" },
    { color: "#FCE7F3", name: "Light Pink" }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[10000] flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4 text-center">
          Choose Background Color
        </h3>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {presetColors.map((preset) => (
            <button
              key={preset.color}
              onClick={() => setSelectedColor(preset.color)}
              className={`aspect-square rounded-xl border-2 transition-all ${
                selectedColor === preset.color
                  ? "border-indigo-500 scale-105 ring-2 ring-indigo-500/50"
                  : "border-gray-600 hover:border-gray-500"
              }`}
              style={{ backgroundColor: preset.color }}
              title={preset.name}
            />
          ))}
        </div>

        {/* Custom color input */}
        <div className="flex items-center gap-3 mb-6">
          <label className="text-gray-400 text-sm">Custom:</label>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-600"
          />
          <input
            type="text"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 text-sm font-mono"
            placeholder="#FFFFFF"
          />
        </div>

        {/* Preview */}
        <div className="mb-6">
          <p className="text-gray-400 text-xs mb-2">Preview:</p>
          <div
            className="h-16 rounded-lg border border-gray-600"
            style={{ backgroundColor: selectedColor }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(selectedColor)}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
          >
            Remove Background
          </button>
        </div>
      </div>
    </div>
  );
};

export default useBackgroundRemoval;
