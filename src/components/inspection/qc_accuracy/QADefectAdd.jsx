// src/components/inspection/qc_accuracy/QADefectAdd.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import { useTranslation } from "react-i18next";
import { Loader2, PlusCircle, X } from "lucide-react";

const QADefectAdd = ({ onDefectAdded }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    defectLetter: "",
    shortEng: "",
    english: "",
    khmer: "",
    chinese: "",
    isCommon: "no",
    code: ""
  });

  useEffect(() => {
    if (isOpen) {
      const fetchNextCode = async () => {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/qa-defects/options`
          );
          setFormData((prev) => ({ ...prev, code: response.data.nextCode }));
        } catch (error) {
          console.error("Failed to fetch next defect code", error);
        }
      };
      fetchNextCode();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      defectLetter: "",
      shortEng: "",
      english: "",
      khmer: "",
      chinese: "",
      isCommon: "no",
      code: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.post(`${API_BASE_URL}/api/qa-defects`, formData);
      Swal.fire("Success", "New QA Defect added successfully!", "success");
      onDefectAdded(); // Callback to refresh parent list
      setIsOpen(false);
      resetForm();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to add defect",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="my-4">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <PlusCircle size={20} className="mr-2" />
          {t("qaDefectManager.addNewDefect", "Add New Defect")}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {t("qaDefectManager.addNewDefect", "Add New Defect")}
              </h2>
              <button onClick={() => setIsOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium">
                    Defect Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    readOnly
                    className="mt-1 block w-full p-2 border bg-gray-100 rounded-md"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium">
                    Defect Letter *
                  </label>
                  <input
                    type="text"
                    name="defectLetter"
                    value={formData.defectLetter}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-4 md:col-span-2">
                  <label className="block text-sm font-medium">
                    Short English *
                  </label>
                  <input
                    type="text"
                    name="shortEng"
                    value={formData.shortEng}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-4 md:col-span-2">
                  <label className="block text-sm font-medium">English *</label>
                  <input
                    type="text"
                    name="english"
                    value={formData.english}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium">Khmer *</label>
                  <input
                    type="text"
                    name="khmer"
                    value={formData.khmer}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium">Chinese</label>
                  <input
                    type="text"
                    name="chinese"
                    value={formData.chinese}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium">
                    Is Common *
                  </label>
                  <select
                    name="isCommon"
                    value={formData.isCommon}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 mr-2 bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300 flex items-center"
                >
                  {isSaving && (
                    <Loader2 size={20} className="animate-spin mr-2" />
                  )}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default QADefectAdd;
