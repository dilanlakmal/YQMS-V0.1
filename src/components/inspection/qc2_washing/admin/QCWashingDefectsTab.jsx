import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import QCWashingDefectForm from "./QCWashingDefectForm";
import {
  Edit3,
  Save,
  Trash2,
  XCircle,
  Loader2,
  UploadCloud,
  X
} from "lucide-react";

const QCWashingDefectsTab = () => {
  const { t } = useTranslation();
  const [defects, setDefects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editRowId, setEditRowId] = useState(null);
  const [editedDefect, setEditedDefect] = useState({});
  const [isSaving, setIsSaving] = useState(null);
  const imageInputRef = useRef(null);

  const fetchDefects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc-washing-defects`
      );
      setDefects(response.data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: "Failed to fetch washing defects"
      });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDefects();
  }, [fetchDefects]);

  const handleEdit = (defect) => {
    setEditRowId(defect._id);
    setEditedDefect({ ...defect });
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
    setEditedDefect({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedDefect((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (id) => {
    setIsSaving(id);
    try {
      await axios.put(
        `${API_BASE_URL}/api/qc-washing-defects/${id}`,
        editedDefect
      );
      Swal.fire({
        icon: "success",
        title: t("common.success"),
        text: "Defect updated successfully"
      });
      setEditRowId(null);
      fetchDefects();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error.response?.data?.message || "Failed to update defect"
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleDeleteDefect = async (id) => {
    Swal.fire({
      title: t("common.confirmDeleteTitle"),
      text: t("common.confirmDeleteText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("common.yesDelete"),
      cancelButtonText: t("common.cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsSaving(id);
        try {
          await axios.delete(`${API_BASE_URL}/api/qc-washing-defects/${id}`);
          Swal.fire(
            t("common.deleted"),
            "Defect deleted successfully",
            "success"
          );
          fetchDefects();
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: t("common.error"),
            text: error.response?.data?.message || "Failed to delete defect"
          });
        } finally {
          setIsSaving(null);
        }
      }
    });
  };

  const handleReplaceImage = async (defectId, file) => {
    if (!file) return;

    setIsSaving(`image-${defectId}`);
    const formData = new FormData();
    formData.append("defectImage", file);

    try {
      await axios.put(
        `${API_BASE_URL}/api/qc-washing-defects/${defectId}/image`,
        formData
      );
      Swal.fire({
        icon: "success",
        title: t("common.success"),
        text: "Image replaced successfully."
      });
      fetchDefects();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: "Failed to replace image."
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleDeleteImage = async (defectId) => {
    Swal.fire({
      title: "Delete Image?",
      text: "This will permanently remove the image.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("common.yesDelete"),
      cancelButtonText: t("common.cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsSaving(`image-${defectId}`);
        try {
          await axios.delete(
            `${API_BASE_URL}/api/qc-washing-defects/${defectId}/image`
          );
          Swal.fire(
            t("common.deleted"),
            "Image deleted successfully.",
            "success"
          );
          fetchDefects();
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: t("common.error"),
            text: "Failed to delete image."
          });
        } finally {
          setIsSaving(null);
        }
      }
    });
  };

  const renderCell = (value) => (
    <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
      {value || "-"}
    </td>
  );

  const renderEditCell = (name, value) => (
    <td className="px-2 py-1">
      <input
        name={name}
        value={value}
        onChange={handleInputChange}
        className="w-full p-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-200"
      />
    </td>
  );

  return (
    <div className="space-y-8">
      <QCWashingDefectForm onDefectAdded={fetchDefects} />

      <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/20">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          QC Washing Defects List
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {[
                  "code",
                  "english",
                  "khmer",
                  "chinese",
                  "image",
                  "actions"
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {h.replace(/([A-Z])/g, " $1").trim()}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
                  </td>
                </tr>
              ) : (
                defects.map((defect) => (
                  <tr
                    key={defect._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    {editRowId === defect._id ? (
                      <>
                        {renderEditCell("code", editedDefect.code)}
                        {renderEditCell("english", editedDefect.english)}
                        {renderEditCell("khmer", editedDefect.khmer)}
                        {renderEditCell("chinese", editedDefect.chinese)}

                        <td className="px-4 py-2 text-center text-gray-500 dark:text-gray-400">
                          ...
                        </td>

                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleSave(defect._id)}
                            className="p-1.5 text-green-600 dark:text-green-400 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50 transition-colors duration-200"
                            disabled={isSaving === defect._id}
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <XCircle size={18} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        {renderCell(defect.code)}
                        {renderCell(defect.english)}
                        {renderCell(defect.khmer)}
                        {renderCell(defect.chinese)}

                        <td className="px-4 py-2">
                          {defect.image ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={`${API_BASE_URL}${defect.image}`}
                                alt={defect.english}
                                className="h-12 w-12 object-cover rounded-md shadow dark:shadow-gray-900/50"
                              />
                              <button
                                onClick={() => handleDeleteImage(defect._id)}
                                className="p-1 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors duration-200"
                                disabled={isSaving === `image-${defect._id}`}
                              >
                                {isSaving === `image-${defect._id}` ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => imageInputRef.current?.click()}
                              className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors duration-200"
                            >
                              <UploadCloud size={18} />
                            </button>
                          )}
                          <input
                            type="file"
                            ref={imageInputRef}
                            onChange={(e) =>
                              handleReplaceImage(defect._id, e.target.files[0])
                            }
                            className="hidden"
                          />
                        </td>

                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleEdit(defect)}
                            className="p-1.5 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors duration-200"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteDefect(defect._id)}
                            disabled={isSaving === defect._id}
                            className="p-1.5 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors duration-200"
                          >
                            {isSaving === defect._id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QCWashingDefectsTab;
