import axios from "axios";
import {
  Check,
  Edit2,
  Plus,
  Save,
  Trash2,
  X,
  Filter,
  Search
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

// Reusable Remarks Modal Component
const RemarksModal = ({ isOpen, onClose, remarks, onSave }) => {
  const [text, setText] = useState(remarks);
  const MAX_CHARS = 250;

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Edit Remarks</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_CHARS}
          className="w-full h-32 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          placeholder="Enter remarks..."
        />
        <div className="text-right text-sm text-gray-500 mb-4">
          {text.length} / {MAX_CHARS}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Save Remarks
          </button>
        </div>
      </div>
    </div>
  );
};

const YPivotQASectionsProductDefectManagement = () => {
  const [defects, setDefects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Modal State
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [currentRemarks, setCurrentRemarks] = useState("");
  const [remarksSaveCallback, setRemarksSaveCallback] = useState(null);

  // Form states
  const [newDefect, setNewDefect] = useState({
    code: "",
    english: "",
    khmer: "",
    chinese: "",
    defectLetter: "",
    remarks: "",
    CategoryCode: "",
    isCommon: "Yes"
  });
  const [editData, setEditData] = useState(null);

  // Filter State
  const [filters, setFilters] = useState({
    code: "",
    english: "",
    MainCategoryCode: "",
    CategoryNameEng: "",
    isCommon: ""
  });

  useEffect(() => {
    fetchDefects();
    fetchCategories();
  }, []);

  const fetchDefects = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-defect-list`
      );
      if (response.data.success) {
        //Implement custom numerical sort before setting the state
        const sortedData = response.data.data.sort((a, b) => {
          // Split codes like "1.10" into parts [1, 10]
          const partsA = a.code.split(".").map(Number);
          const partsB = b.code.split(".").map(Number);

          // Compare the main number first (the part before the dot)
          if (partsA[0] !== partsB[0]) {
            return partsA[0] - partsB[0];
          }

          // If main numbers are equal, compare the sub-number (the part after the dot)
          return (partsA[1] || 0) - (partsB[1] || 0);
        });
        setDefects(sortedData);
      }
      //setDefects(response.data.data);
    } catch (error) {
      Swal.fire("Error", "Failed to load defects", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-defect-category`
      );
      setCategories(response.data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Memoized filtered defects for performance
  const filteredDefects = useMemo(() => {
    return defects.filter((defect) => {
      return (
        (filters.code
          ? defect.code.toLowerCase().includes(filters.code.toLowerCase())
          : true) &&
        (filters.english
          ? defect.english.toLowerCase().includes(filters.english.toLowerCase())
          : true) &&
        (filters.MainCategoryCode
          ? defect.MainCategoryCode.toString() === filters.MainCategoryCode
          : true) &&
        (filters.CategoryNameEng
          ? defect.CategoryNameEng === filters.CategoryNameEng
          : true) &&
        (filters.isCommon ? defect.isCommon === filters.isCommon : true)
      );
    });
  }, [defects, filters]);

  // === ADD NEW DEFECT HANDLERS ===
  const handleShowAddNew = () => {
    setIsAddingNew(true);
    setNewDefect({
      code: "",
      english: "",
      khmer: "",
      chinese: "",
      defectLetter: "",
      remarks: "",
      CategoryCode: "",
      isCommon: "Yes"
    });
  };
  const handleCancelAddNew = () => setIsAddingNew(false);

  const handleNewCategorySelect = (e) => {
    const categoryCode = e.target.value;
    setNewDefect({ ...newDefect, CategoryCode: categoryCode });
  };

  const handleSaveNew = async () => {
    const { code, english, defectLetter, CategoryCode, isCommon } = newDefect;
    if (
      !code.trim() ||
      !english.trim() ||
      !defectLetter.trim() ||
      !CategoryCode
    ) {
      Swal.fire(
        "Validation Error",
        "Defect Code, English Name, Letter, and Category are required.",
        "warning"
      );
      return;
    }
    const selectedCategory = categories.find(
      (c) => c.CategoryCode === CategoryCode
    );
    try {
      await axios.post(`${API_BASE_URL}/api/qa-sections-defect-list`, {
        ...newDefect,
        CategoryNameEng: selectedCategory.CategoryNameEng,
        CategoryNameKhmer: selectedCategory.CategoryNameKhmer,
        CategoryNameChinese: selectedCategory.CategoryNameChinese
      });
      Swal.fire("Created!", "New defect has been created.", "success");
      fetchDefects();
      handleCancelAddNew();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to create defect",
        "error"
      );
    }
  };

  // === EDIT DEFECT HANDLERS ===
  const handleEdit = (defect) => {
    setEditingId(defect._id);
    setEditData({ ...defect });
  };
  const handleCancelEdit = () => setEditingId(null);

  const handleEditDataChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditCategoryChange = (e) => {
    const newCategoryCode = e.target.value;
    const selectedCategory = categories.find(
      (c) => c.CategoryCode === newCategoryCode
    );
    if (selectedCategory) {
      setEditData((prev) => ({
        ...prev,
        CategoryCode: newCategoryCode,
        CategoryNameEng: selectedCategory.CategoryNameEng,
        CategoryNameKhmer: selectedCategory.CategoryNameKhmer,
        CategoryNameChinese: selectedCategory.CategoryNameChinese
      }));
    }
  };

  const handleSaveEdit = async (id) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/qa-sections-defect-list/${id}`,
        editData
      );
      Swal.fire("Updated!", "Defect has been updated.", "success");
      fetchDefects();
      handleCancelEdit();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to update defect",
        "error"
      );
    }
  };

  // === DELETE DEFECT HANDLER ===
  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/api/qa-sections-defect-list/${id}`);
        Swal.fire("Deleted!", "Defect has been deleted.", "success");
        fetchDefects();
      } catch (error) {
        Swal.fire("Error", "Failed to delete defect", "error");
      }
    }
  };

  // === REMARKS MODAL HANDLERS ===
  const openRemarksModal = (defect) => {
    setCurrentRemarks(defect.remarks || "");
    setRemarksSaveCallback(() => (newRemarks) => {
      handleEditDataChange("remarks", newRemarks);
    });
    setIsRemarksModalOpen(true);
  };

  const uniqueMainCategories = [...new Set(categories.map((c) => c.no))].sort(
    (a, b) => a - b
  );
  const uniqueCategoryNames = [
    ...new Set(categories.map((c) => c.CategoryNameEng))
  ].sort();

  if (isLoading)
    return <div className="text-center p-10">Loading defects...</div>;

  return (
    <div className="space-y-6">
      <RemarksModal
        isOpen={isRemarksModalOpen}
        onClose={() => setIsRemarksModalOpen(false)}
        remarks={currentRemarks}
        onSave={remarksSaveCallback}
      />

      {/* Filter Section */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <h3 className="col-span-full font-semibold text-lg flex items-center gap-2">
            <Filter size={18} /> Filter Defects
          </h3>
          <div>
            <label className="text-sm font-medium">Defect Code</label>
            <input
              type="text"
              value={filters.code}
              onChange={(e) => setFilters({ ...filters, code: e.target.value })}
              className="w-full p-2 border rounded-md dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Defect Name (Eng)</label>
            <input
              type="text"
              value={filters.english}
              onChange={(e) =>
                setFilters({ ...filters, english: e.target.value })
              }
              className="w-full p-2 border rounded-md dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Main Cat. Code</label>
            <select
              value={filters.MainCategoryCode}
              onChange={(e) =>
                setFilters({ ...filters, MainCategoryCode: e.target.value })
              }
              className="w-full p-2 border rounded-md dark:bg-gray-800"
            >
              <option value="">All</option>
              {uniqueMainCategories.map((mc) => (
                <option key={mc} value={mc}>
                  {mc}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Category Name</label>
            <select
              value={filters.CategoryNameEng}
              onChange={(e) =>
                setFilters({ ...filters, CategoryNameEng: e.target.value })
              }
              className="w-full p-2 border rounded-md dark:bg-gray-800"
            >
              <option value="">All</option>
              {uniqueCategoryNames.map((cn) => (
                <option key={cn} value={cn}>
                  {cn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Is Common</label>
            <select
              value={filters.isCommon}
              onChange={(e) =>
                setFilters({ ...filters, isCommon: e.target.value })
              }
              className="w-full p-2 border rounded-md dark:bg-gray-800"
            >
              <option value="">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <button
            onClick={() =>
              setFilters({
                code: "",
                english: "",
                MainCategoryCode: "",
                CategoryNameEng: "",
                isCommon: ""
              })
            }
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleShowAddNew}
          disabled={isAddingNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md"
        >
          <Plus size={18} /> Add New Defect
        </button>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[60vh] shadow-lg rounded-lg border dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                Main Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                Defect Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                Defect Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                Defect Letter
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                Category
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                Common
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                Remarks
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isAddingNew && (
              <tr className="bg-indigo-50 dark:bg-indigo-900/20">
                <td></td>
                <td>
                  <input
                    type="text"
                    value={newDefect.code}
                    onChange={(e) =>
                      setNewDefect({ ...newDefect, code: e.target.value })
                    }
                    className="w-24 p-1 border rounded"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="English*"
                    value={newDefect.english}
                    onChange={(e) =>
                      setNewDefect({ ...newDefect, english: e.target.value })
                    }
                    className="w-full p-1 border rounded mb-1"
                  />
                  <input
                    type="text"
                    placeholder="Khmer"
                    value={newDefect.khmer}
                    onChange={(e) =>
                      setNewDefect({ ...newDefect, khmer: e.target.value })
                    }
                    className="w-full p-1 border rounded mb-1"
                  />
                  <input
                    type="text"
                    placeholder="Chinese"
                    value={newDefect.chinese}
                    onChange={(e) =>
                      setNewDefect({ ...newDefect, chinese: e.target.value })
                    }
                    className="w-full p-1 border rounded"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={newDefect.defectLetter}
                    onChange={(e) =>
                      setNewDefect({
                        ...newDefect,
                        defectLetter: e.target.value
                      })
                    }
                    className="w-20 p-1 border rounded"
                  />
                </td>
                <td>
                  <select
                    value={newDefect.CategoryCode}
                    onChange={handleNewCategorySelect}
                    className="w-full p-1 border rounded"
                  >
                    <option value="">Select Category*</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c.CategoryCode}>
                        {c.CategoryNameEng}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={newDefect.isCommon}
                    onChange={(e) =>
                      setNewDefect({ ...newDefect, isCommon: e.target.value })
                    }
                    className="w-full p-1 border rounded"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={newDefect.remarks}
                    onChange={(e) =>
                      setNewDefect({ ...newDefect, remarks: e.target.value })
                    }
                    className="w-full p-1 border rounded"
                  />
                </td>
                <td>
                  <div className="flex justify-center gap-2">
                    <button onClick={handleSaveNew}>
                      <Save size={18} className="text-green-600" />
                    </button>
                    <button onClick={handleCancelAddNew}>
                      <X size={18} className="text-gray-500" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {filteredDefects.map((defect) => {
              const isEditing = editingId === defect._id;
              return (
                <tr key={defect._id}>
                  <td className="px-4 py-3 text-center font-semibold">
                    {defect.MainCategoryCode}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.code}
                        onChange={(e) =>
                          handleEditDataChange("code", e.target.value)
                        }
                        className="w-24 p-1 border rounded"
                      />
                    ) : (
                      defect.code
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={editData.english}
                          onChange={(e) =>
                            handleEditDataChange("english", e.target.value)
                          }
                          className="w-full p-1 border rounded"
                        />
                        <input
                          type="text"
                          value={editData.khmer}
                          onChange={(e) =>
                            handleEditDataChange("khmer", e.target.value)
                          }
                          className="w-full p-1 border rounded"
                        />
                        <input
                          type="text"
                          value={editData.chinese}
                          onChange={(e) =>
                            handleEditDataChange("chinese", e.target.value)
                          }
                          className="w-full p-1 border rounded"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold">{defect.english}</div>
                        <div className="text-xs text-gray-500">
                          {defect.khmer}
                        </div>
                        <div className="text-xs text-gray-500">
                          {defect.chinese}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.defectLetter}
                        onChange={(e) =>
                          handleEditDataChange("defectLetter", e.target.value)
                        }
                        className="w-20 p-1 border rounded"
                      />
                    ) : (
                      defect.defectLetter
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={editData.CategoryCode}
                        onChange={handleEditCategoryChange}
                        className="w-full p-1 border rounded"
                      >
                        {categories.map((c) => (
                          <option key={c._id} value={c.CategoryCode}>
                            {c.CategoryNameEng}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        <div className="font-semibold">
                          {defect.CategoryNameEng} ({defect.CategoryCode})
                        </div>
                        <div className="text-xs text-gray-500">
                          {defect.CategoryNameKhmer}
                        </div>
                        <div className="text-xs text-gray-500">
                          {defect.CategoryNameChinese}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isEditing ? (
                      <select
                        value={editData.isCommon}
                        onChange={(e) =>
                          handleEditDataChange("isCommon", e.target.value)
                        }
                        className="p-1 border rounded"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          defect.isCommon === "Yes"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {defect.isCommon}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isEditing ? (
                      <button
                        onClick={() => openRemarksModal(editData)}
                        className="text-indigo-600 hover:underline text-sm"
                      >
                        Edit Remarks
                      </button>
                    ) : (
                      <p
                        className="text-xs text-gray-600 max-w-xs truncate"
                        title={defect.remarks}
                      >
                        {defect.remarks || "-"}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(defect._id)}
                            title="Save"
                          >
                            <Save size={18} className="text-green-600" />
                          </button>
                          <button onClick={handleCancelEdit} title="Cancel">
                            <X size={18} className="text-gray-500" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(defect)}
                            title="Edit"
                          >
                            <Edit2 size={18} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(defect._id, defect.english)
                            }
                            title="Delete"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YPivotQASectionsProductDefectManagement;
