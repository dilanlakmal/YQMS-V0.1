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
        text: "Failed to fetch first output records"
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
    setEditedOutput({ ...output });
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
        text: "First output record updated successfully"
      });
      setEditRowId(null);
      fetchFirstOutputs();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error.response?.data?.message || "Failed to update first output record"
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
      cancelButtonText: t("common.cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsSaving(id);
        try {
          await axios.delete(`${API_BASE_URL}/api/qc-washing-first-outputs/${id}`);
          Swal.fire(
            t("common.deleted"),
            "First output record deleted successfully",
            "success"
          );
          fetchFirstOutputs();
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: t("common.error"),
            text: error.response?.data?.message || "Failed to delete first output record"
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
    <td className="px-4 py-2 text-sm whitespace-nowrap">{value || "-"}</td>
  );

  const renderEditCell = (name, value, type = "text") => (
    <td className="px-2 py-1">
      <input
        name={name}
        value={value}
        onChange={handleInputChange}
        type={type}
        className="w-full p-1 border rounded text-sm"
      />
    </td>
  );

  return (
    <div className="space-y-8">
      <QCWashingFirstOutputForm onOutputAdded={fetchFirstOutputs} />

      <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          QC Washing First Output Records
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
               {[
                  "Style No",
                  "Checked Qty",
                  "Added By",
                  "Added Date",
                  "Updated By",
                  "Updated Date",
                  "Actions",
                ].map((header) => (
                  <th
                     key={header}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                     {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                   <td colSpan="12" className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                  </td>
                </tr>
              ) : (
                firstOutputs.map((output) => (
                  <tr key={output._id} className="hover:bg-gray-50">
                    {editRowId === output._id ? (
                      <>
                        {renderEditCell("style", editedOutput.style)}
                        {renderEditCell("quantity", editedOutput.quantity, "number")}
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleSave(output._id)}
                            className="p-1.5 text-green-600 rounded-full hover:bg-green-100 disabled:opacity-50"
                            disabled={isSaving === output._id}
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
                       
                        {renderCell(output.style)}
                        {renderCell(output.quantity)}
                        {renderCell(output.addedBy?.eng_name)}
                        {renderCell(formatDate(output.createdAt))}
                        {renderCell(output.updatedBy?.eng_name)}
                        {renderCell(formatDate(output.updatedAt))}
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleEdit(output)}
                            className="p-1.5 text-indigo-600 rounded-full hover:bg-indigo-100"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(output._id)}
                            disabled={isSaving === output._id}
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

export default QCWashingFirstOutputTab;