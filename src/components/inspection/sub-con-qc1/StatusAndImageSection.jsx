import { Camera, CheckCircle, XCircle } from "lucide-react";
import React from "react";
import ImageUpload from "./ImageUpload";

const StatusAndImageSection = ({
  title,
  subtitle = "",
  status,
  setStatus,
  options = [],
  images,
  setImages,
  uploadMetadata,
  gradientFrom = "from-indigo-500",
  gradientTo = "to-purple-500",
  iconColor = "text-indigo-600",
  iconBg = "bg-indigo-100 dark:bg-indigo-900/30"
}) => {
  // Determine status icon and colors
  const getStatusConfig = (optionValue) => {
    const isSelected = status === optionValue;

    if (optionValue === "Pass" || optionValue === "Correct") {
      return {
        icon: <CheckCircle className="w-5 h-5" />,
        baseColor: isSelected
          ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-600"
          : "bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:border-green-500",
        ringColor: "ring-green-500/20"
      };
    } else {
      return {
        icon: <XCircle className="w-5 h-5" />,
        baseColor: isSelected
          ? "bg-gradient-to-br from-red-500 to-rose-600 text-white border-red-600"
          : "bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:border-red-500",
        ringColor: "ring-red-500/20"
      };
    }
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-2xl">
      {/* Gradient header */}
      <div
        className={`relative bg-gradient-to-br ${gradientFrom} ${gradientTo} px-5 py-4 overflow-hidden`}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

        <div className="relative flex items-center gap-3">
          <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {subtitle && (
              <p className="text-xs text-white/80 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Status Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
            ></div>
            Status Selection
          </label>

          <div className="grid grid-cols-2 gap-3">
            {options.map((option) => {
              const config = getStatusConfig(option.value);
              const isSelected = status === option.value;

              return (
                <label key={option.value} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name={`${title}-status`}
                    value={option.value}
                    checked={isSelected}
                    onChange={(e) => setStatus(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all duration-300 transform ${
                      config.baseColor
                    } ${
                      isSelected
                        ? "scale-105 shadow-lg ring-4 " + config.ringColor
                        : "hover:scale-102 shadow-md"
                    }`}
                  >
                    {config.icon}
                    <span>{option.label}</span>
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
                      <div
                        className={`w-4 h-4 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center`}
                      >
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-gray-800 px-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Evidence Images
            </span>
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Attach Images
            </label>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
              {images.length}/5
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200">
            <ImageUpload
              imageUrls={images}
              onImageChange={setImages}
              uploadMetadata={uploadMetadata}
              maxImages={5}
              imageType={title.toLowerCase()}
              sectionName={title}
            />
          </div>
        </div>

        {/* Status Summary Badge */}
        <div className="pt-2">
          <div
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold ${
              status === "Pass" || status === "Correct"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-2 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-2 border-red-200 dark:border-red-800"
            }`}
          >
            {status === "Pass" || status === "Correct" ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Status: {status}</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>Status: {status}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className={`h-1.5 bg-gradient-to-r ${gradientFrom} ${gradientTo} group-hover:h-2 transition-all duration-300`}
      ></div>
    </div>
  );
};

export default StatusAndImageSection;
