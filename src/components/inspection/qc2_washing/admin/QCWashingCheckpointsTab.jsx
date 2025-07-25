import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";
import QCWashingCheckpointForm from "./QCWashingCheckpointForm";
import { Edit3, Save, Trash2, XCircle, Loader2 } from "lucide-react";

const QCWashingCheckpointsTab = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [checkpoints, setCheckpoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editRowId, setEditRowId] = useState(null);
  const [editedCheckpoint, setEditedCheckpoint] = useState({});
  const [isSaving, setIsSaving] = useState(null);

  const fetchCheckpoints = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc-washing-checklist`
      );
      setCheckpoints(response.data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: "Failed to fetch checkpoints"
      });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCheckpoints();
  }, [fetchCheckpoints]);

  const handleEdit = (checkpoint) => {
    setEditRowId(checkpoint._id);
    setEditedCheckpoint({ name: checkpoint.name });
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
    setEditedCheckpoint({});
  };

  const handleInputChange = (e) => {
    const { value } = e.target;
    setEditedCheckpoint({ name: value });
  };

  const handleSave = async (id) => {
    if (!editedCheckpoint.name?.trim()) return;

    setIsSaving(id);
    try {
      const updateData = {
        name: editedCheckpoint.name.trim(),
        updatedBy: {
          emp_id: user?.emp_id,
          eng_name: user?.eng_name
        }
      };

      await axios.put(
        `${API_BASE_URL}/api/qc-washing-checklist/${id}`,
        updateData
      );

      Swal.fire({
        icon: "success",
        title: t("common.success"),
        text: "Checkpoint updated successfully"
      });

      setEditRowId(null);
      fetchCheckpoints();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error.response?.data?.message || "Failed to update checkpoint"
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
          await axios.delete(`${API_BASE_URL}/api/qc-washing-checklist/${id}`);
          Swal.fire(
            t("common.deleted"),
            "Checkpoint deleted successfully",
            "success"
          );
          fetchCheckpoints();
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: t("common.error"),
            text: error.response?.data?.message || "Failed to delete checkpoint"
          });
        } finally {
          setIsSaving(null);
        }
      }
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      <QCWashingCheckpointForm onCheckpointAdded={fetchCheckpoints} />

      <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Checkpoints List
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Checkpoint Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated Date
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                  </td>
                </tr>
              ) : (
                checkpoints.map((checkpoint) => (
                  <tr key={checkpoint._id} className="hover:bg-gray-50">
                    {editRowId === checkpoint._id ? (
                      <>
                        <td className="px-2 py-1">
                          <input
                            value={editedCheckpoint.name || ""}
                            onChange={handleInputChange}
                            className="w-full p-1 border rounded text-sm"
                            placeholder="Checkpoint name"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {checkpoint.addedBy?.eng_name || "-"}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {checkpoint.createdAt
                            ? formatDate(checkpoint.createdAt)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {checkpoint.updatedBy?.eng_name || "-"}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {checkpoint.updatedAt
                            ? formatDate(checkpoint.updatedAt)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleSave(checkpoint._id)}
                            className="p-1.5 text-green-600 rounded-full hover:bg-green-100 disabled:opacity-50"
                            disabled={isSaving === checkpoint._id}
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
                        <td className="px-4 py-2 text-sm font-medium">
                          {checkpoint.name}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {checkpoint.addedBy?.eng_name || "-"}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {checkpoint.createdAt
                            ? formatDate(checkpoint.createdAt)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {checkpoint.updatedBy?.eng_name || "-"}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {checkpoint.updatedAt
                            ? formatDate(checkpoint.updatedAt)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleEdit(checkpoint)}
                            className="p-1.5 text-indigo-600 rounded-full hover:bg-indigo-100"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(checkpoint._id)}
                            disabled={isSaving === checkpoint._id}
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

export default QCWashingCheckpointsTab;
