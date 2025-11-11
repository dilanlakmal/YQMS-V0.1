import axios from "axios";
import { Check, Edit2, Plus, Save, Trash2, X, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

const GARMENT_TYPES = ["Top", "Bottom", "Top Layer", "Zipper Jacket", "Dress"];

const YPivotQASectionsProductDefectManagement = () => {
  const [defects, setDefects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states for new defect
  const [newDefect, setNewDefect] = useState({
    english: "",
    khmer: "",
    chinese: "",
    defectLetter: "",
    CategoryEngName: "",
    CategoryCode: "",
    isCommon: "yes"
  });

  // Edit states
  const [editData, setEditData] = useState({
    english: "",
    khmer: "",
    chinese: "",
    defectLetter: "",
    CategoryEngName: "",
    CategoryCode: "",
    isCommon: "yes",
    defectLocations: []
  });

  // Category search
  const [categorySearch, setCategorySearch] = useState("");
  const [editCategorySearch, setEditCategorySearch] = useState("");

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
        setDefects(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching defects:", error);
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
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Filter categories based on search
  const filteredCategories = categories.filter((cat) => {
    if (!cat || !cat.CategoryNameEng) return false;
    if (!categorySearch) return false;
    return cat.CategoryNameEng.toLowerCase().includes(
      categorySearch.toLowerCase()
    );
  });

  const filteredEditCategories = categories.filter((cat) => {
    if (!cat || !cat.CategoryNameEng) return false;
    if (!editCategorySearch) return false;
    return cat.CategoryNameEng.toLowerCase().includes(
      editCategorySearch.toLowerCase()
    );
  });

  // === ADD NEW DEFECT ===
  const handleShowAddNew = () => {
    setIsAddingNew(true);
    setNewDefect({
      english: "",
      khmer: "",
      chinese: "",
      defectLetter: "",
      CategoryEngName: "",
      CategoryCode: "",
      isCommon: "yes"
    });
    setCategorySearch("");
  };

  const handleCancelAddNew = () => {
    setIsAddingNew(false);
    setNewDefect({
      english: "",
      khmer: "",
      chinese: "",
      defectLetter: "",
      CategoryEngName: "",
      CategoryCode: "",
      isCommon: "yes"
    });
    setCategorySearch("");
  };

  const handleCategorySelect = (category) => {
    setNewDefect({
      ...newDefect,
      CategoryEngName: category.CategoryNameEng,
      CategoryCode: category.CategoryCode
    });
    setCategorySearch(category.CategoryNameEng);
  };

  const handleSaveNew = async () => {
    if (
      !newDefect.english.trim() ||
      !newDefect.defectLetter.trim() ||
      !newDefect.CategoryEngName
    ) {
      Swal.fire(
        "Validation Error",
        "English name, Defect Letter, and Category are required",
        "warning"
      );
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections-defect-list`,
        newDefect
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Created!",
          text: `Defect created with Code: ${response.data.data.code}`,
          timer: 1500,
          showConfirmButton: false
        });
        fetchDefects();
        handleCancelAddNew();
      }
    } catch (error) {
      console.error("Error creating defect:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to create defect",
        "error"
      );
    }
  };

  // === EDIT DEFECT ===
  const handleEdit = (defect) => {
    setEditingId(defect._id);
    setEditData({
      english: defect.english || "",
      khmer: defect.khmer || "",
      chinese: defect.chinese || "",
      defectLetter: defect.defectLetter || "",
      CategoryEngName: defect.CategoryEngName || "",
      CategoryCode: defect.CategoryCode || "",
      isCommon: defect.isCommon || "yes",
      defectLocations: defect.defectLocations || []
    });
    // 🔧 FIXED: Provide default empty string if CategoryEngName is undefined
    setEditCategorySearch(defect.CategoryEngName || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({
      english: "",
      khmer: "",
      chinese: "",
      defectLetter: "",
      CategoryEngName: "",
      CategoryCode: "",
      isCommon: "yes",
      defectLocations: []
    });
    setEditCategorySearch(""); // 🔧 Explicitly set to empty string
  };

  const handleEditCategorySelect = (category) => {
    setEditData({
      ...editData,
      CategoryEngName: category.CategoryNameEng,
      CategoryCode: category.CategoryCode
    });
    setEditCategorySearch(category.CategoryNameEng);
  };

  const handleSaveEdit = async (id) => {
    if (
      !editData.english.trim() ||
      !editData.defectLetter.trim() ||
      !editData.CategoryEngName
    ) {
      Swal.fire(
        "Validation Error",
        "English name, Defect Letter, and Category are required",
        "warning"
      );
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/qa-sections-defect-list/${id}`,
        editData
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Defect updated successfully",
          timer: 1500,
          showConfirmButton: false
        });
        fetchDefects();
        handleCancelEdit();
      }
    } catch (error) {
      console.error("Error updating defect:", error);
      Swal.fire("Error", "Failed to update defect", "error");
    }
  };

  // === DELETE DEFECT ===
  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/api/qa-sections-defect-list/${id}`
        );

        if (response.data.success) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Defect deleted successfully",
            timer: 1500,
            showConfirmButton: false
          });
          fetchDefects();
        }
      } catch (error) {
        console.error("Error deleting defect:", error);
        Swal.fire("Error", "Failed to delete defect", "error");
      }
    }
  };

  // === DEFECT LOCATIONS MANAGEMENT ===
  const handleAddLocation = () => {
    const newLocationNo =
      editData.defectLocations.length > 0
        ? Math.max(...editData.defectLocations.map((loc) => loc.locationNo)) + 1
        : 1;

    setEditData({
      ...editData,
      defectLocations: [
        ...editData.defectLocations,
        {
          locationNo: newLocationNo,
          garmentType: "Top",
          locationName: ""
        }
      ]
    });
  };

  const handleRemoveLocation = (locationNo) => {
    const filtered = editData.defectLocations.filter(
      (loc) => loc.locationNo !== locationNo
    );
    // Re-number locations
    const renumbered = filtered.map((loc, index) => ({
      ...loc,
      locationNo: index + 1
    }));
    setEditData({
      ...editData,
      defectLocations: renumbered
    });
  };

  const handleLocationChange = (locationNo, field, value) => {
    setEditData({
      ...editData,
      defectLocations: editData.defectLocations.map((loc) =>
        loc.locationNo === locationNo ? { ...loc, [field]: value } : loc
      )
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Defect Button */}
      <div className="flex justify-end">
        <button
          onClick={handleShowAddNew}
          disabled={isAddingNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
        >
          <Plus size={18} />
          Add New Defect
        </button>
      </div>

      {/* Add New Defect Form */}
      {isAddingNew && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-lg shadow-lg border-2 border-indigo-200 dark:border-indigo-700">
          <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-4">
            Add New Defect
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* English */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                English Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newDefect.english}
                onChange={(e) =>
                  setNewDefect({ ...newDefect, english: e.target.value })
                }
                placeholder="English defect name..."
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Khmer */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Khmer Name
              </label>
              <input
                type="text"
                value={newDefect.khmer}
                onChange={(e) =>
                  setNewDefect({ ...newDefect, khmer: e.target.value })
                }
                placeholder="ឈ្មោះជាភាសាខ្មែរ..."
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Chinese */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Chinese Name
              </label>
              <input
                type="text"
                value={newDefect.chinese}
                onChange={(e) =>
                  setNewDefect({ ...newDefect, chinese: e.target.value })
                }
                placeholder="中文名称..."
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Defect Letter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Defect Letter <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newDefect.defectLetter}
                onChange={(e) =>
                  setNewDefect({ ...newDefect, defectLetter: e.target.value })
                }
                placeholder="e.g., A, B, C"
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Category Name with Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Type to search category..."
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {categorySearch && filteredCategories.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCategories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => handleCategorySelect(cat)}
                        className="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm"
                      >
                        {cat.CategoryNameEng}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Category Code (Auto) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Category Code (Auto)
              </label>
              <input
                type="text"
                value={newDefect.CategoryCode}
                readOnly
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
            </div>

            {/* Is Common */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Is Common <span className="text-red-500">*</span>
              </label>
              <select
                value={newDefect.isCommon}
                onChange={(e) =>
                  setNewDefect({ ...newDefect, isCommon: e.target.value })
                }
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            <strong>Note:</strong> Code will be auto-generated. StatusByBuyer,
            Decisions, and DefectLocations will be saved as empty arrays.
          </p>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleCancelAddNew}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleSaveNew}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
            >
              <Check size={16} />
              Save Defect
            </button>
          </div>
        </div>
      )}

      {/* Manage Defect List Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-700 dark:to-blue-700">
          <h2 className="text-xl font-bold text-white">Manage Defect List</h2>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-16">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  English
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Khmer
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Chinese
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Letter
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-24">
                  Cat Code
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-24">
                  Common
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Defect Locations
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {defects.map((defect) => (
                <tr
                  key={defect._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {/* Code - Not Editable */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                      {defect.code}
                    </span>
                  </td>

                  {/* English */}
                  <td className="px-4 py-3">
                    {editingId === defect._id ? (
                      <input
                        type="text"
                        value={editData.english}
                        onChange={(e) =>
                          setEditData({ ...editData, english: e.target.value })
                        }
                        className="w-full p-2 border-2 border-indigo-300 dark:border-indigo-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {defect.english}
                      </span>
                    )}
                  </td>

                  {/* Khmer */}
                  <td className="px-4 py-3">
                    {editingId === defect._id ? (
                      <input
                        type="text"
                        value={editData.khmer}
                        onChange={(e) =>
                          setEditData({ ...editData, khmer: e.target.value })
                        }
                        className="w-full p-2 border-2 border-indigo-300 dark:border-indigo-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {defect.khmer || "-"}
                      </span>
                    )}
                  </td>

                  {/* Chinese */}
                  <td className="px-4 py-3">
                    {editingId === defect._id ? (
                      <input
                        type="text"
                        value={editData.chinese}
                        onChange={(e) =>
                          setEditData({ ...editData, chinese: e.target.value })
                        }
                        className="w-full p-2 border-2 border-indigo-300 dark:border-indigo-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {defect.chinese || "-"}
                      </span>
                    )}
                  </td>

                  {/* Defect Letter */}
                  <td className="px-4 py-3">
                    {editingId === defect._id ? (
                      <input
                        type="text"
                        value={editData.defectLetter}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            defectLetter: e.target.value
                          })
                        }
                        className="w-full p-2 border-2 border-indigo-300 dark:border-indigo-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {defect.defectLetter}
                      </span>
                    )}
                  </td>

                  {/* Category Name */}
                  <td className="px-4 py-3">
                    {editingId === defect._id ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={editCategorySearch}
                          onChange={(e) =>
                            setEditCategorySearch(e.target.value)
                          }
                          placeholder="Search category..."
                          className="w-full p-2 border-2 border-indigo-300 dark:border-indigo-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                        />
                        {editCategorySearch &&
                          filteredEditCategories.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                              {filteredEditCategories.map((cat) => (
                                <button
                                  key={cat._id}
                                  onClick={() => handleEditCategorySelect(cat)}
                                  className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-xs"
                                >
                                  {cat.CategoryNameEng}
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {defect.CategoryEngName}
                      </span>
                    )}
                  </td>

                  {/* Category Code (Auto) */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      {editingId === defect._id
                        ? editData.CategoryCode
                        : defect.CategoryCode}
                    </span>
                  </td>

                  {/* Is Common */}
                  <td className="px-4 py-3 text-center">
                    {editingId === defect._id ? (
                      <select
                        value={editData.isCommon}
                        onChange={(e) =>
                          setEditData({ ...editData, isCommon: e.target.value })
                        }
                        className="w-full p-2 border-2 border-indigo-300 dark:border-indigo-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                          defect.isCommon === "yes"
                            ? "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30"
                            : "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900/30"
                        }`}
                      >
                        {defect.isCommon}
                      </span>
                    )}
                  </td>

                  {/* Defect Locations */}
                  <td className="px-4 py-3">
                    {editingId === defect._id ? (
                      <div className="space-y-2">
                        {editData.defectLocations.map((location) => (
                          <div
                            key={location.locationNo}
                            className="flex gap-2 items-center bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-200 dark:border-gray-700"
                          >
                            <span className="text-xs font-bold text-gray-500 w-6">
                              {location.locationNo}.
                            </span>
                            <select
                              value={location.garmentType}
                              onChange={(e) =>
                                handleLocationChange(
                                  location.locationNo,
                                  "garmentType",
                                  e.target.value
                                )
                              }
                              className="flex-1 p-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800"
                            >
                              {GARMENT_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={location.locationName}
                              onChange={(e) =>
                                handleLocationChange(
                                  location.locationNo,
                                  "locationName",
                                  e.target.value
                                )
                              }
                              placeholder="Location..."
                              className="flex-1 p-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800"
                            />
                            <button
                              onClick={() =>
                                handleRemoveLocation(location.locationNo)
                              }
                              className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                              title="Remove location"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={handleAddLocation}
                          className="w-full p-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 text-xs font-medium"
                        >
                          + Add Location
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {defect.defectLocations &&
                        defect.defectLocations.length > 0 ? (
                          defect.defectLocations.map((location) => (
                            <div
                              key={location.locationNo}
                              className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded"
                            >
                              {location.locationNo}. {location.garmentType} -{" "}
                              {location.locationName}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">
                            No locations
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {editingId === defect._id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(defect._id)}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all"
                            title="Save changes"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 shadow-md transition-all"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(defect)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all"
                            title="Edit defect"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(defect._id, defect.english)
                            }
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition-all"
                            title="Delete defect"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {defects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No defects available. Click "Add New Defect" to create one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YPivotQASectionsProductDefectManagement;
