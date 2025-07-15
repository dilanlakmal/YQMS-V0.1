// --- FIX #4: NEW COMPONENT FOR ADDITIONAL IMAGES ---
import React, { useState } from "react";
import {
  Camera,
  Upload,
  XCircle,
  Loader2,
  Trash2,
  PlusCircle
} from "lucide-react";
import Webcam from "react-webcam";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import Swal from "sweetalert2";

const QAAdditionalImageUpload = ({ sections, setSections, uploadMetadata }) => {
  const [showWebcam, setShowWebcam] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(null);
  const fileInputRef = React.useRef(null);
  const webcamRef = React.useRef(null);

  const handleAddSection = () => {
    setSections([
      ...sections,
      { sectionName: "", imageUrls: [], tempId: Date.now() }
    ]);
  };

  const handleRemoveSection = (index) => {
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
  };

  const handleSectionNameChange = (index, name) => {
    const newSections = [...sections];
    newSections[index].sectionName = name;
    setSections(newSections);
  };

  const handleImageUpload = async (file, sectionIndex) => {
    if (!file) return;
    if (!uploadMetadata || !uploadMetadata.moNo) {
      Swal.fire("Error", "Cannot upload image without MO Number.", "error");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("imageFile", file);
    formData.append("imageType", "additional");
    formData.append("moNo", uploadMetadata.moNo);
    formData.append("qcId", uploadMetadata.qcId);
    formData.append("date", new Date().toISOString());

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/qa-accuracy/upload-image`,
        formData
      );
      if (res.data.success) {
        const newSections = [...sections];
        newSections[sectionIndex].imageUrls.push(res.data.filePath);
        setSections(newSections);
      }
    } catch (error) {
      Swal.fire("Upload Failed", "Could not upload the image.", "error");
    } finally {
      setIsUploading(false);
      setShowWebcam(false);
      setActiveSectionIndex(null);
    }
  };

  const handleCapture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    const blob = await (await fetch(imageSrc)).blob();
    const file = new File([blob], `capture-${Date.now()}.jpg`, {
      type: "image/jpeg"
    });
    handleImageUpload(file, activeSectionIndex);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, activeSectionIndex);
  };

  const triggerUpload = (index) => {
    setActiveSectionIndex(index);
    fileInputRef.current?.click();
  };

  const triggerWebcam = (index) => {
    setActiveSectionIndex(index);
    setShowWebcam(true);
  };

  const removeImageUrl = (sectionIndex, urlIndex) => {
    const newSections = [...sections];
    newSections[sectionIndex].imageUrls = newSections[
      sectionIndex
    ].imageUrls.filter((_, i) => i !== urlIndex);
    setSections(newSections);
  };

  return (
    <div className="mt-6 space-y-4">
      {sections.map((section, sectionIndex) => (
        <div
          key={section.tempId}
          className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50"
        >
          <div className="flex items-center gap-4 mb-3">
            <input
              type="text"
              placeholder="Section Name (e.g., Packing, Labeling)"
              value={section.sectionName}
              onChange={(e) =>
                handleSectionNameChange(sectionIndex, e.target.value)
              }
              className="flex-grow p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
            />
            <button
              onClick={() => handleRemoveSection(sectionIndex)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 />
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {section.imageUrls.map((url, urlIndex) => (
              <div key={url} className="relative group w-full h-24">
                <img
                  src={url}
                  alt={`Additional ${urlIndex}`}
                  className="w-full h-full object-cover rounded-md"
                />
                <button
                  onClick={() => removeImageUrl(sectionIndex, urlIndex)}
                  className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100"
                >
                  <XCircle size={16} />
                </button>
              </div>
            ))}
            {section.imageUrls.length < 5 &&
              (isUploading && activeSectionIndex === sectionIndex ? (
                <div className="w-full h-24 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <div className="w-full h-24 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-md">
                  <button
                    onClick={() => triggerUpload(sectionIndex)}
                    className="p-2 text-gray-600 hover:text-purple-600"
                  >
                    <Upload size={24} />
                  </button>
                  <button
                    onClick={() => triggerWebcam(sectionIndex)}
                    className="p-2 text-gray-600 hover:text-blue-600"
                  >
                    <Camera size={24} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={handleAddSection}
        className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2"
      >
        <PlusCircle size={16} /> Add Section
      </button>

      {showWebcam && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-full max-w-md">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
            />
            <div className="flex justify-center mt-4 gap-4">
              <button
                onClick={handleCapture}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Capture
              </button>
              <button
                onClick={() => setShowWebcam(false)}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAAdditionalImageUpload;
