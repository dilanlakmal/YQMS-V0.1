import React from "react";
import ImageUpload from "./ImageUpload";

const StatusAndImageSection = ({
  title,
  status,
  setStatus,
  options,
  images,
  setImages,
  uploadMetadata
}) => {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <div className="mt-2 flex gap-4">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name={title}
                  value={option.value}
                  checked={status === option.value}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-gray-800 dark:text-gray-200">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Images (Max 5)
          </label>
          <div className="mt-2">
            <ImageUpload
              imageUrls={images}
              onImageChange={setImages}
              uploadMetadata={uploadMetadata}
              maxImages={5}
              imageType={title.toLowerCase()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusAndImageSection;
