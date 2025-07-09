// --- FIX #3: NEW COMPONENT TO ADD STANDARD DEFECTS ---
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import { useTranslation } from "react-i18next";
import { Loader2, PlusCircle, X, Trash2 } from "lucide-react";

const QAStandardDefectAdd = ({ onDefectAdded }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    english: "",
    khmer: "",
    chinese: ""
  });
  const [decisions, setDecisions] = useState([]);

  useEffect(() => {
    if (isOpen) {
      resetForm(); // Reset form every time it opens
      fetchNextCode();
    }
  }, [isOpen]);

  const fetchNextCode = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-standard-defects/next-code`
      );
      setFormData((prev) => ({ ...prev, code: response.data.nextCode }));
    } catch (error) {
      console.error("Failed to fetch next defect code", error);
    }
  };

  const resetForm = () => {
    setFormData({ code: "", english: "", khmer: "", chinese: "" });
    setDecisions([
      {
        id: Date.now(),
        decisionEng: "N/A",
        decisionKhmer: "N/A",
        status: "Major"
      }
    ]);
  };

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDecisionChange = (id, field, value) => {
    setDecisions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleAddDecision = () => {
    setDecisions((prev) => [
      ...prev,
      { id: Date.now(), decisionEng: "", decisionKhmer: "", status: "Major" }
    ]);
  };

  const handleRemoveDecision = (id) => {
    if (decisions.length > 1) {
      setDecisions((prev) => prev.filter((d) => d.id !== id));
    } else {
      Swal.fire(
        "Action denied",
        "At least one decision is required.",
        "warning"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = {
      ...formData,
      decisions: decisions.map(({ id, ...rest }) => rest) // Remove temporary id
    };

    try {
      await axios.post(`${API_BASE_URL}/api/qa-standard-defects`, payload);
      Swal.fire(
        "Success",
        "New Standard Defect added successfully!",
        "success"
      );
      onDefectAdded();
      setIsOpen(false);
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
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusCircle size={20} className="mr-2" /> Add New Standard Defect
        </button>
      </div>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-10 z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Standard Defect</h2>
              <button onClick={() => setIsOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    readOnly
                    className="mt-1 w-full p-2 border bg-gray-100 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    English Name*
                  </label>
                  <input
                    type="text"
                    name="english"
                    value={formData.english}
                    onChange={handleFormChange}
                    required
                    className="mt-1 w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Khmer Name*
                  </label>
                  <input
                    type="text"
                    name="khmer"
                    value={formData.khmer}
                    onChange={handleFormChange}
                    required
                    className="mt-1 w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Chinese Name
                  </label>
                  <input
                    type="text"
                    name="chinese"
                    value={formData.chinese}
                    onChange={handleFormChange}
                    className="mt-1 w-full p-2 border rounded"
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-2">Decisions</h3>
              <div className="space-y-3">
                {decisions.map((decision, index) => (
                  <div
                    key={decision.id}
                    className="grid grid-cols-12 gap-2 items-center p-2 border rounded-md"
                  >
                    <div className="col-span-4">
                      <label className="text-xs">Decision (Eng)*</label>
                      <input
                        type="text"
                        value={decision.decisionEng}
                        onChange={(e) =>
                          handleDecisionChange(
                            decision.id,
                            "decisionEng",
                            e.target.value
                          )
                        }
                        required
                        className="w-full p-1 border rounded"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="text-xs">Decision (Kh)</label>
                      <input
                        type="text"
                        value={decision.decisionKhmer}
                        onChange={(e) =>
                          handleDecisionChange(
                            decision.id,
                            "decisionKhmer",
                            e.target.value
                          )
                        }
                        className="w-full p-1 border rounded"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs">Status*</label>
                      <select
                        value={decision.status}
                        onChange={(e) =>
                          handleDecisionChange(
                            decision.id,
                            "status",
                            e.target.value
                          )
                        }
                        className="w-full p-1 border rounded"
                      >
                        <option value="Minor">Minor</option>
                        <option value="Major">Major</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div className="col-span-1 text-right pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveDecision(decision.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddDecision}
                className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <PlusCircle size={16} /> Add Decision
              </button>

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
                  )}{" "}
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
export default QAStandardDefectAdd;
