import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  MinusCircle,
  Loader
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

const YPivotQATemplatesHeader = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState({}); // { sectionId: optionName }
  const [images, setImages] = useState({}); // { sectionId: previewUrl }

  // --- Fetch Header Configuration ---
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/qa-sections-home`
        );
        setSections(response.data.data);

        // Initialize default selections (first option if available)
        const initialSelections = {};
        response.data.data.forEach((section) => {
          if (section.Options && section.Options.length > 0) {
            // Default to N/A if exists, else first option
            const naOption = section.Options.find((o) => o.Name === "N/A");
            initialSelections[section._id] = naOption
              ? "N/A"
              : section.Options[0].Name;
          }
        });
        setSelectedOptions(initialSelections);
      } catch (error) {
        console.error("Failed to load header sections:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  // --- Handlers ---
  const handleOptionSelect = (sectionId, optionName) => {
    setSelectedOptions((prev) => ({ ...prev, [sectionId]: optionName }));
  };

  const handleImageUpload = (e, sectionId) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImages((prev) => ({ ...prev, [sectionId]: previewUrl }));
    }
  };

  const removeImage = (sectionId) => {
    setImages((prev) => {
      const newImages = { ...prev };
      delete newImages[sectionId];
      return newImages;
    });
  };

  // Helper to get option style
  const getOptionStyle = (optionName, isSelected) => {
    if (!isSelected)
      return "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700";

    switch (optionName) {
      case "Conform":
      case "Yes":
      case "New Order":
        return "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]";
      case "Non-Conform":
      case "No":
        return "bg-red-600 border-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]";
      case "N/A":
        return "bg-gray-600 border-gray-500 text-white";
      default:
        return "bg-blue-600 border-blue-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
        {/* Header Title Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 to-purple-700 flex justify-between items-center">
          <h3 className="text-white font-bold text-sm tracking-wider">
            MAIN DATA
          </h3>
          <h3 className="text-white font-bold text-sm tracking-wider hidden sm:block">
            OPTIONS
          </h3>
        </div>

        {/* Content Rows */}
        <div className="divide-y divide-gray-800">
          {sections.map((section) => (
            <div
              key={section._id}
              className="p-6 hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
                {/* Left Side: Title & Image Upload */}
                <div className="flex-1 min-w-0 w-full">
                  <h4 className="text-gray-100 font-bold text-sm sm:text-base mb-3">
                    {section.MainTitle}
                  </h4>

                  {/* Image Preview Area */}
                  <div className="mt-2">
                    {images[section._id] ? (
                      <div className="relative w-32 h-24 group rounded-lg overflow-hidden border border-gray-700 shadow-md">
                        <img
                          src={images[section._id]}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(section._id)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-400 cursor-pointer transition-colors">
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Image</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, section._id)}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Right Side: Options Toggles */}
                <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-start lg:justify-end">
                  {section.Options.map((option) => {
                    const isSelected =
                      selectedOptions[section._id] === option.Name;
                    return (
                      <button
                        key={option.OptionNo}
                        onClick={() =>
                          handleOptionSelect(section._id, option.Name)
                        }
                        className={`
                          px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 transform active:scale-95
                          ${getOptionStyle(option.Name, isSelected)}
                        `}
                      >
                        {option.Name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Sheet Note (Optional) */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-gray-400 text-xs px-4 py-2 rounded-full shadow-lg border border-gray-700 pointer-events-none">
        Preview Mode • Changes here are visual only
      </div>
    </div>
  );
};

export default YPivotQATemplatesHeader;
