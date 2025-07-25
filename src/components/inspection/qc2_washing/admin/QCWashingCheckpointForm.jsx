import React, { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";
import { Plus, Loader2 } from "lucide-react";

const QCWashingCheckpointForm = ({ onCheckpointAdded }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [checkpointName, setCheckpointName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!checkpointName.trim()) return;

    setIsSubmitting(true);
    try {
      const checkpointData = {
        name: checkpointName.trim(),
        addedBy: {
          emp_id: user?.emp_id,
          eng_name: user?.eng_name
        }
      };

      await axios.post(
        `${API_BASE_URL}/api/qc-washing-checklist`,
        checkpointData
      );

      Swal.fire({
        icon: "success",
        title: t("common.success"),
        text: "Checkpoint added successfully"
      });

      setCheckpointName("");
      onCheckpointAdded();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error.response?.data?.message || "Failed to add checkpoint"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Add New Checkpoint
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Checkpoint Name *
          </label>
          <input
            type="text"
            value={checkpointName}
            onChange={(e) => setCheckpointName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter checkpoint name"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !checkpointName.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {isSubmitting ? "Adding..." : "Add Checkpoint"}
        </button>
      </form>
    </div>
  );
};

export default QCWashingCheckpointForm;
