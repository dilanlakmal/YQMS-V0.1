import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";
import { PlusCircle, Loader2 } from "lucide-react";

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
        className="block w-full text-sm rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
      />
    </div>
  );
};

const QCWashingFirstOutputForm = ({ onOutputAdded }) => {
  const { t } = useTranslation();
  const initialState = {
    style: "",
    quantity: "",
  };
  const [newOutput, setNewOutput] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOutput((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
     const outputData = {
        ...newOutput,
        addedBy: {
          emp_id: user?.emp_id,
          eng_name: user?.eng_name,
        },
      };
      await axios.post(`${API_BASE_URL}/api/qc-washing-first-outputs`, outputData);

      Swal.fire({
        icon: "success",
        title: t("common.success"),
        text: "First output record added successfully"
      });
      setNewOutput(initialState);
      if (onOutputAdded) onOutputAdded();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error.response?.data?.message || "Failed to add first output record"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-8 p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Add New First Output Check Record
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledInput
            id="style"
            labelKey="Style No"
            name="style"
            value={newOutput.style}
            onChange={handleInputChange}
            required
          />
          <LabeledInput
            id="quantity"
            labelKey="Checked Qty"
            name="quantity"
            value={newOutput.quantity}
            onChange={handleInputChange}
            type="number"
            required
          />
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
            Add Record
          </button>
        </div>
      </form>
    </div>
  );
};

export default QCWashingFirstOutputForm;