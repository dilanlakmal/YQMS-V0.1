import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";
import QCWashingFirstOutputForm from "./QCWashingFirstOutputForm";
import {
  Edit3,
  Save,
  Trash2,
  XCircle,
  Loader2
} from "lucide-react";

const QCWashingFirstOutputTab = () => {
  const { t } = useTranslation();
  const [firstOutputs, setFirstOutputs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editRowId, setEditRowId] = useState(null);
  const [editedOutput, setEditedOutput] = useState({});
  const [isSaving, setIsSaving] = useState(null);
  const { user } = useAuth();

  const fetchFirstOutputs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc-washing-first-outputs`);
      setFirstOutputs(response.data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: "Failed to fetch first output records",
        background: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937'
      });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchFirstOutputs();
  }, [fetchFirstOutputs]);

  const handleEdit = (output) => {
    setEditRowId(output._id);
    setEditedOutput({ quantity: output.quantity });
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
    setEditedOutput({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedOutput((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (id) => {
    setIsSaving(id);
    try {
      const updateData = {
        ...editedOutput,
        updatedBy: {
          emp_id: user?.emp_id,
          eng_name: user?.eng_name,
        },
      };

      await axios.put(`${API_BASE_URL}/api/qc-washing-first-outputs/${id}`, updateData);
      Swal.fire({
        icon: "success",
        title: t("common.success"),
        text: "First output record updated successfully",
        background: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937'
      });
      setEditRowId(null);
      fetchFirstOutputs();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error.response?.data?.message || "Failed to update first output record",
        background: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937'
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: t("common.confirmDeleteTitle"),
      text: t("common.confirmDeleteText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("common.yesDelete"),
      cancelButtonText: t("common.cancel"),
      background: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsSaving(id);
        try {
          await axios.delete(`${API_BASE_URL}/api/qc-washing-first-outputs/${id}`);
          Swal.fire({
            title: t("common.deleted"),
            text: "First output record deleted successfully",
            icon: "success",
            background: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937'
          });
          fetchFirstOutputs();
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: t("common.error"),
            text: error.response?.data?.message || "Failed to delete first output record",
            background: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937'
          });
        } finally {
          setIsSaving(null);
        }
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const renderCell = (value) => (
    <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
      {value || "-"}
    </td>
  );

  const renderEditCell = (name, value, type = "text") => (
    <td className="px-2 py-1">
      <input
        name={name}
        value={value}
        onChange={handleInputChange}
        type={type}
        className="w-full p-1 border rounded text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
      />
    </td>
  );

  return (
    <div className="space-y-8">
      <QCWashingFirstOutputForm onOutputAdded={fetchFirstOutputs} />
      
      <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          QC Washing First Output Records
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {[
                  "Checked Qty",
                  "Added By",
                  "Added Date",
                  "Updated By",
                  "Updated Date",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                  </td>
                </tr>
              ) : firstOutputs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">No first output records found</p>
                  </td>
                </tr>
              ) : (
                firstOutputs.map((output) => (
                  <tr key={output._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {editRowId === output._id ? (
                      <>
                        {renderEditCell("quantity", editedOutput.quantity, "number")}
                        {renderCell(output.addedBy?.eng_name)}
                        {renderCell(formatDate(output.createdAt))}
                        {renderCell(output.updatedBy?.eng_name)}
                        {renderCell(formatDate(output.updatedAt))}
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleSave(output._id)}
                              className="p-1.5 text-green-600 dark:text-green-400 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20 disabled:opacity-50 transition-colors"
                              disabled={isSaving === output._id}
                              title="Save"
                            >
                              {isSaving === output._id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Save size={18} />
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title="Cancel"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {renderCell(output.quantity)}
                        {renderCell(output.addedBy?.eng_name)}
                        {renderCell(formatDate(output.createdAt))}
                        {renderCell(output.updatedBy?.eng_name)}
                        {renderCell(formatDate(output.updatedAt))}
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(output)}
                              className="p-1.5 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors"
                              title="Edit"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(output._id)}
                              disabled={isSaving === output._id}
                              className="p-1.5 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                              title="Delete"
                            >
                              {isSaving === output._id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          </div>
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

export default QCWashingFirstOutputTab;
