import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { PlusCircle, Loader2, Image as ImageIcon, X } from "lucide-react";

const LabeledInput = ({
  id,
  labelKey,
  value,
  name,
  onChange,
  type = "text",
  required = false,
  placeholderKey = "",
  readOnly = false
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1 text-xs font-medium text-gray-700">
        {labelKey} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholderKey}
        readOnly={readOnly}
        className={`block w-full text-sm rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 ${readOnly ? "bg-gray-100 cursor-not-allowed" : ""}`}
      />
    </div>
  );
};

const QCWashingDefectForm = ({ onDefectAdded }) => {
  const { t } = useTranslation();
  const initialState = {
    code: "",
    english: "",
    khmer: "",
    chinese: "",
    image: ""
  };
  const [newDefect, setNewDefect] = useState(initialState);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const fetchNextCode = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc-washing-defects/next-code`
      );
      if (response.data.success) {
        setNewDefect((prev) => ({ ...prev, code: response.data.nextCode }));
      }
    } catch (error) {
      console.error("Failed to fetch next defect code", error);
      Swal.fire({
        icon: "warning",
        title: "Could not fetch next code",
        text: "Please enter the defect code manually or refresh."
      });
    }
  }, [t]);

  useEffect(() => {
    fetchNextCode();
  }, [fetchNextCode]);

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
      fileInputRef.current.value = "";
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
          `${API_BASE_URL}/api/qc-washing-defects/upload-image`,
          formData
        );
        if (uploadRes.data.success) {
          imageUrl = uploadRes.data.url;
        } else {
          throw new Error("Image upload failed");
        }
      }

      const finalPayload = { ...newDefect, image: imageUrl };
      await axios.post(`${API_BASE_URL}/api/qc-washing-defects`, finalPayload);

      Swal.fire({
        icon: "success",
        title: t("common.success"),
        text: "Washing defect added successfully"
      });
      setNewDefect(initialState);
      removeImage();
      if (onDefectAdded) onDefectAdded();
      fetchNextCode();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error.response?.data?.message || "Failed to add washing defect"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-8 p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Add New QC Washing Defect
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <LabeledInput
            id="code"
            labelKey="Code"
            name="code"
            value={newDefect.code}
            onChange={handleInputChange}
            type="number"
            readOnly
            required
          />
          
          <LabeledInput
            id="english"
            labelKey="English"
            name="english"
            value={newDefect.english}
            onChange={handleInputChange}
            required
          />
          <LabeledInput
            id="khmer"
            labelKey="Khmer"
            name="khmer"
            value={newDefect.khmer}
            onChange={handleInputChange}
            required
          />
          <LabeledInput
            id="chinese"
            labelKey="Chinese"
            name="chinese"
            value={newDefect.chinese}
            onChange={handleInputChange}
          />
         
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Image
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
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="py-2 px-4 rounded-md border-0 text-sm font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
              >
                Choose File
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                name="image"
                onChange={handleImageChange}
                className="hidden"
              />
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
            Add Defect
          </button>
        </div>
      </form>
    </div>
  );
};

export default QCWashingDefectForm;
