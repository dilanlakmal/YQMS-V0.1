import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import FactoryManager from "./FactoryManager";
import QC2DefectForm from "./QC2DefectForm";
import {
  Edit3,
  Save,
  Trash2,
  XCircle,
  Loader2,
  Image as ImageIcon,
  UploadCloud,
  X
} from "lucide-react";

const QC2DefectsAddModify = () => {
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
      const response = await axios.get(`${API_BASE_URL}/api/qc2-defects`);
      setDefects(response.data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: t("qc2defects.defect.fetchError")
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
      await axios.put(`${API_BASE_URL}/api/qc2-defects/${id}`, editedDefect);
      Swal.fire({
        icon: "success",
        title: t("common.success"),
        text: t("qc2defects.defect.updateSuccess")
      });
      setEditRowId(null);
      fetchDefects();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error.response?.data?.message || t("qc2defects.defect.updateFail")
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
          await axios.delete(`${API_BASE_URL}/api/qc2-defects/${id}`);
          Swal.fire(
            t("common.deleted"),
            t("qc2defects.defect.deleteSuccess"),
            "success"
          );
          fetchDefects();
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: t("common.error"),
            text:
              error.response?.data?.message || t("qc2defects.defect.deleteFail")
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
        `${API_BASE_URL}/api/qc2-defects/${defectId}/image`,
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
            `${API_BASE_URL}/api/qc2-defects/${defectId}/image`
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
    <td className="px-4 py-2 text-sm whitespace-nowrap">{value || "-"}</td>
  );
  const renderEditCell = (name, value) => (
    <td className="px-2 py-1">
      <input
        name={name}
        value={value}
        onChange={handleInputChange}
        className="w-full p-1 border rounded text-sm"
      />
    </td>
  );

  return (
    <div className="space-y-8">
      <FactoryManager />
      <QC2DefectForm onDefectAdded={fetchDefects} />

      <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {t("qc2defects.defect.listTitle")}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "code",
                  "defectLetter",
                  "english",
                  "khmer",
                  "chinese",
                  "categoryEnglish",
                  "type",
                  "isCommon",
                  "image",
                  "actions"
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {t(`qc2defects.table.${h}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                  </td>
                </tr>
              ) : (
                defects.map((defect) => (
                  <tr key={defect._id} className="hover:bg-gray-50">
                    {editRowId === defect._id ? (
                      <>
                        {renderEditCell("code", editedDefect.code)}
                        {renderEditCell(
                          "defectLetter",
                          editedDefect.defectLetter
                        )}
                        {renderEditCell("english", editedDefect.english)}
                        {renderEditCell("khmer", editedDefect.khmer)}
                        {renderEditCell("chinese", editedDefect.chinese)}
                        {renderEditCell(
                          "categoryEnglish",
                          editedDefect.categoryEnglish
                        )}
                        {renderEditCell("type", editedDefect.type)}
                        <td className="px-2 py-1">
                          <select
                            name="isCommon"
                            value={editedDefect.isCommon}
                            onChange={handleInputChange}
                            className="w-full p-1 border rounded text-sm"
                          >
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 text-center">...</td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleSave(defect._id)}
                            className="p-1.5 text-green-600 rounded-full hover:bg-green-100 disabled:opacity-50"
                            disabled={isSaving === defect._id}
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 text-gray-600 rounded-full hover:bg-gray-100"
                          >
                            <XCircle size={18} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        {renderCell(defect.code)}
                        {renderCell(defect.defectLetter)}
                        {renderCell(defect.english)}
                        {renderCell(defect.khmer)}
                        {renderCell(defect.chinese)}
                        {renderCell(defect.categoryEnglish)}
                        {renderCell(defect.type)}
                        {renderCell(defect.isCommon)}
                        <td className="px-4 py-2">
                          {defect.image ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={`${API_BASE_URL}${defect.image}`}
                                alt={defect.english}
                                className="h-12 w-12 object-cover rounded-md shadow"
                              />
                              <button
                                onClick={() => handleDeleteImage(defect._id)}
                                className="p-1 text-red-500 hover:bg-red-100 rounded-full"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => imageInputRef.current?.click()}
                              className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-full"
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
                            className="p-1.5 text-indigo-600 rounded-full hover:bg-indigo-100"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteDefect(defect._id)}
                            disabled={isSaving === defect._id}
                            className="p-1.5 text-red-600 rounded-full hover:bg-red-100 disabled:opacity-50"
                          >
                            <Trash2 size={18} />
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

export default QC2DefectsAddModify;
