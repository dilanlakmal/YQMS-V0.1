import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  CheckSquare,
  Square,
  Loader,
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

const YPivotQATemplatesReportType = () => {
  // --- State ---
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const initialFormState = {
    _id: null,
    ReportType: "",
    Measurement: "No",
    Header: "Yes",
    Photos: "Yes",
    QualityPlan: "Yes",
    Conclusion: "Yes",
    DefectCategoryList: [] // Array of category objects
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [tplRes, catRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/qa-sections-templates`),
        axios.get(`${API_BASE_URL}/api/qa-sections-templates/categories`)
      ]);
      setTemplates(tplRes.data.data);
      setCategories(catRes.data.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers ---
  const handleAddNew = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (template) => {
    setFormData({
      _id: template._id,
      ReportType: template.ReportType,
      Measurement: template.Measurement,
      Header: template.Header,
      Photos: template.Photos,
      QualityPlan: template.QualityPlan,
      Conclusion: template.Conclusion,
      DefectCategoryList: template.DefectCategoryList || []
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?"))
      return;
    try {
      await axios.delete(`${API_BASE_URL}/api/qa-sections-templates/${id}`);
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete.");
    }
  };

  const handleCategoryToggle = (cat) => {
    const exists = formData.DefectCategoryList.find(
      (c) => c.categoryId === cat._id
    );
    let newList;
    if (exists) {
      // Remove
      newList = formData.DefectCategoryList.filter(
        (c) => c.categoryId !== cat._id
      );
    } else {
      // Add (store snapshot)
      newList = [
        ...formData.DefectCategoryList,
        {
          categoryId: cat._id,
          CategoryCode: cat.CategoryCode,
          CategoryNameEng: cat.CategoryNameEng
        }
      ];
    }
    setFormData({ ...formData, DefectCategoryList: newList });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEditing) {
        await axios.put(
          `${API_BASE_URL}/api/qa-sections-templates/${formData._id}`,
          formData
        );
      } else {
        await axios.post(`${API_BASE_URL}/api/qa-sections-templates`, formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save template.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- UI Components ---

  const StatusBadge = ({ val }) => {
    const isYes = val === "Yes";
    const isMeas = val === "Before" || val === "After";

    let colorClass =
      "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    let icon = <XCircle className="w-3 h-3" />;

    if (isYes) {
      colorClass =
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      icon = <CheckCircle className="w-3 h-3" />;
    } else if (isMeas) {
      colorClass =
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      icon = <FileText className="w-3 h-3" />;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${colorClass}`}
      >
        {icon} {val}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Manage Report Templates
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure report structures and categories.
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Report
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 w-16 text-center">No</th>
                <th className="px-6 py-3">Report Type</th>
                <th className="px-6 py-3 text-center">Measurement</th>
                <th className="px-6 py-3 text-center">Header</th>
                <th className="px-6 py-3 text-center">Photos</th>
                <th className="px-6 py-3">Defect Categories</th>
                <th className="px-6 py-3 text-center">Quality Plan</th>
                <th className="px-6 py-3 text-center">Conclusion</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-10">
                    <Loader className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-gray-500">
                    No templates found.
                  </td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr
                    key={t._id}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-center font-mono text-gray-500 dark:text-gray-400">
                      {t.no}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-100">
                      {t.ReportType}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge val={t.Measurement} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge val={t.Header} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge val={t.Photos} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {t.DefectCategoryList.map((c) => (
                          <span
                            key={c.categoryId}
                            className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] rounded border border-indigo-100 dark:border-indigo-800"
                          >
                            {c.CategoryCode}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge val={t.QualityPlan} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge val={t.Conclusion} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(t)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md dark:hover:bg-red-900/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {isEditing ? "Edit Report Template" : "Add New Report Template"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form
                id="templateForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Report Type Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ReportType}
                    onChange={(e) =>
                      setFormData({ ...formData, ReportType: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., Pilot Run - Sewing"
                  />
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Measurement
                    </label>
                    <select
                      value={formData.Measurement}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          Measurement: e.target.value
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                    >
                      <option value="No">No</option>
                      <option value="Before">Before Wash</option>
                      <option value="After">After Wash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Header (Checklist)
                    </label>
                    <select
                      value={formData.Header}
                      onChange={(e) =>
                        setFormData({ ...formData, Header: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Photos
                    </label>
                    <select
                      value={formData.Photos}
                      onChange={(e) =>
                        setFormData({ ...formData, Photos: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Quality Plan
                    </label>
                    <select
                      value={formData.QualityPlan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          QualityPlan: e.target.value
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Conclusion
                    </label>
                    <select
                      value={formData.Conclusion}
                      onChange={(e) =>
                        setFormData({ ...formData, Conclusion: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {/* Defect Categories Grid */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                    Include Defect Categories
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categories.map((cat) => {
                      const isSelected = formData.DefectCategoryList.some(
                        (c) => c.categoryId === cat._id
                      );
                      return (
                        <div
                          key={cat._id}
                          onClick={() => handleCategoryToggle(cat)}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                            ${
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 dark:border-indigo-400 shadow-sm"
                                : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700"
                            }
                          `}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          )}
                          <div>
                            <span className="block font-bold text-gray-800 dark:text-gray-100 text-sm">
                              {cat.no}. {cat.CategoryCode}
                            </span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                              {cat.CategoryNameEng}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="templateForm"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YPivotQATemplatesReportType;
