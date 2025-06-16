import React, { useState, useRef } from "react"; // 1. Import useRef
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import { PlusCircle, Loader2, Image as ImageIcon, X } from "lucide-react";

// Reusable Labeled Input Field Component (No changes needed here)
const LabeledInput = ({
  id,
  labelKey,
  value,
  name,
  onChange,
  type = "text",
  required = false,
  placeholderKey = ""
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1 text-xs font-medium text-gray-700">
        {t(labelKey)} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={t(placeholderKey)}
        className="block w-full text-sm rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
      />
    </div>
  );
};

const QC2DefectForm = ({ onDefectAdded }) => {
  const { t } = useTranslation();
  const initialState = {
    code: "",
    defectLetter: "",
    shortEng: "",
    english: "",
    khmer: "",
    chinese: "",
    image: "",
    repair: "",
    categoryEnglish: "",
    categoryKhmer: "",
    categoryChinese: "",
    type: 1,
    isCommon: "no"
  };
  const [newDefect, setNewDefect] = useState(initialState);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 2. Create a ref for the hidden file input
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDefect((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else if (file) {
      // if a file is selected but it's not an image
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: "Please select a valid image file."
      });
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset the file input
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    let imageUrl = "";

    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("defectImage", imageFile);
        const uploadRes = await axios.post(
          `${API_BASE_URL}/api/qc2-defects/upload-image`,
          formData
        );
        if (uploadRes.data.success) {
          imageUrl = uploadRes.data.url;
        } else {
          throw new Error("Image upload failed");
        }
      }

      const finalPayload = { ...newDefect, image: imageUrl };
      await axios.post(`${API_BASE_URL}/api/qc2-defects`, finalPayload);

      Swal.fire({
        icon: "success",
        title: t("common.success"),
        text: t("qc2defects.defect.addSuccess")
      });
      setNewDefect(initialState);
      removeImage(); // Use the reset function
      if (onDefectAdded) onDefectAdded();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error.response?.data?.message || t("qc2defects.defect.addFail")
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-8 p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {t("qc2defects.defect.addTitle")}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* All LabeledInput components remain the same */}
          <LabeledInput
            id="code"
            labelKey="qc2defects.defect.code"
            name="code"
            value={newDefect.code}
            onChange={handleInputChange}
            type="number"
            required
          />
          <LabeledInput
            id="defectLetter"
            labelKey="qc2defects.defect.defectLetter"
            name="defectLetter"
            value={newDefect.defectLetter}
            onChange={handleInputChange}
            required
          />
          <LabeledInput
            id="shortEng"
            labelKey="qc2defects.defect.shortEng"
            name="shortEng"
            value={newDefect.shortEng}
            onChange={handleInputChange}
            required
          />
          <LabeledInput
            id="english"
            labelKey="qc2defects.defect.english"
            name="english"
            value={newDefect.english}
            onChange={handleInputChange}
            required
          />
          <LabeledInput
            id="khmer"
            labelKey="qc2defects.defect.khmer"
            name="khmer"
            value={newDefect.khmer}
            onChange={handleInputChange}
            required
          />
          <LabeledInput
            id="chinese"
            labelKey="qc2defects.defect.chinese"
            name="chinese"
            value={newDefect.chinese}
            onChange={handleInputChange}
          />
          <LabeledInput
            id="repair"
            labelKey="qc2defects.defect.repair"
            name="repair"
            value={newDefect.repair}
            onChange={handleInputChange}
            required
          />
          <LabeledInput
            id="categoryEnglish"
            labelKey="qc2defects.defect.categoryEnglish"
            name="categoryEnglish"
            value={newDefect.categoryEnglish}
            onChange={handleInputChange}
            required
          />
          <LabeledInput
            id="categoryKhmer"
            labelKey="qc2defects.defect.categoryKhmer"
            name="categoryKhmer"
            value={newDefect.categoryKhmer}
            onChange={handleInputChange}
            required
          />
          <LabeledInput
            id="categoryChinese"
            labelKey="qc2defects.defect.categoryChinese"
            name="categoryChinese"
            value={newDefect.categoryChinese}
            onChange={handleInputChange}
            required
          />
          <div>
            <label
              htmlFor="type"
              className="mb-1 text-xs font-medium text-gray-700 block"
            >
              {t("qc2defects.defect.type")}*
            </label>
            <select
              id="type"
              name="type"
              value={newDefect.type}
              onChange={handleInputChange}
              className="input-style w-full py-2 px-3 border-gray-300 rounded-md shadow-sm"
            >
              <option value={1}>Type 1</option>
              <option value={2}>Type 2</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="isCommon"
              className="mb-1 text-xs font-medium text-gray-700 block"
            >
              {t("qc2defects.defect.isCommon")}*
            </label>
            <select
              id="isCommon"
              name="isCommon"
              value={newDefect.isCommon}
              onChange={handleInputChange}
              className="input-style w-full py-2 px-3 border-gray-300 rounded-md shadow-sm"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>

        {/* --- MODIFIED IMAGE UPLOAD SECTION --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("qc2defects.defect.image")}
          </label>
          <div className="mt-1 flex items-center gap-4">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 w-20 object-cover rounded-md shadow-sm"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 focus:outline-none"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <div className="h-20 w-20 bg-gray-100 rounded-md flex items-center justify-center border-2 border-dashed">
                <ImageIcon className="text-gray-400 h-8 w-8" />
              </div>
            )}

            <div className="flex flex-col justify-center">
              {/* 3. This is the custom, styled button */}
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="py-2 px-4 rounded-md border-0 text-sm font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
              >
                {t("common.chooseFile", "Choose File")}
              </button>

              {/* 4. The actual file input is now hidden */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                name="image"
                onChange={handleImageChange}
                className="hidden"
              />
              {/* Optional: Show selected file name */}
              {imageFile && (
                <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
                  {imageFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <PlusCircle className="mr-2 h-5 w-5" />
            )}
            {t("common.addDefect")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QC2DefectForm;
