import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import {
  PlusCircle,
  Edit3,
  Save,
  Trash2,
  XCircle,
  Loader2,
  ListFilter,
  ChevronDown,
  Search
} from "lucide-react";

const CuttingDefectsModifyAdd = () => {
  const { t } = useTranslation();
  const [defects, setDefects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [editRowId, setEditRowId] = useState(null);
  const [editedDefect, setEditedDefect] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDefect, setNewDefect] = useState({
    defectCode: "",
    defectNameEng: "",
    defectNameKhmer: "",
    defectNameChinese: "" // Optional, so initial empty string is fine
  });

  const inputBaseStyle = "block w-full text-sm rounded-md shadow-sm";
  const inputNormalStyle = `${inputBaseStyle} border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3`;
  // const inputErrorStyle = `${inputBaseStyle} border-red-500 focus:border-red-500 focus:ring-red-500 py-2 px-3`; // Not actively used for now, validation via Swal

  const fetchDefects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/cutting-fabric-defects`
      );
      setDefects(response.data.map((d) => ({ ...d, isChanged: false })));
    } catch (error) {
      console.error("Error fetching cutting fabric defects:", error);
      Swal.fire({
        icon: "error",
        title: t("cutting.error"),
        text: t("cutting.failedToFetchDefects")
      });
      setDefects([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDefects();
  }, [fetchDefects]);

  const handleInputChange = (e, field, id = null) => {
    const { value } = e.target;
    if (id) {
      setEditedDefect((prev) => ({ ...prev, [field]: value, isChanged: true }));
    } else {
      setNewDefect((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleEdit = (defect) => {
    setEditRowId(defect._id);
    setEditedDefect({
      ...defect,
      defectNameChinese: defect.defectNameChinese || "",
      isChanged: false
    }); // Ensure Chinese name is empty string if null/undefined
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
    setEditedDefect({});
  };

  const handleSave = async (id) => {
    // Validation: Chinese name is optional for edit as well
    if (
      !editedDefect.defectCode ||
      !editedDefect.defectNameEng ||
      !editedDefect.defectNameKhmer
    ) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.missingInformation"),
        text: t("cutting.fillRequiredDefectFields")
      });
      return;
    }
    setIsSaving(id);
    try {
      const payload = {
        defectCode: editedDefect.defectCode,
        defectNameEng: editedDefect.defectNameEng,
        defectNameKhmer: editedDefect.defectNameKhmer,
        defectNameChinese: editedDefect.defectNameChinese || "", // Send empty string if not provided
        defectName: editedDefect.defectNameEng // Sync main name
      };
      // No need to delete extra fields as we construct payload explicitly

      await axios.put(
        `${API_BASE_URL}/api/cutting-fabric-defects/${id}`,
        payload
      );
      Swal.fire({
        icon: "success",
        title: t("cutting.success"),
        text: t("cutting.defectUpdatedSuccess")
      });
      setEditRowId(null);
      setEditedDefect({});
      fetchDefects();
    } catch (error) {
      console.error("Error updating defect:", error);
      Swal.fire({
        icon: "error",
        title: t("cutting.error"),
        text: error.response?.data?.message || t("cutting.failedToUpdateDefect")
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleAddNewDefect = async () => {
    // Validation: Chinese name is optional
    if (
      !newDefect.defectCode ||
      !newDefect.defectNameEng ||
      !newDefect.defectNameKhmer
    ) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.missingInformation"),
        text: t("cutting.fillRequiredDefectFields")
      });
      return;
    }
    setIsSaving("new");
    try {
      const payload = {
        defectCode: newDefect.defectCode,
        defectNameEng: newDefect.defectNameEng,
        defectNameKhmer: newDefect.defectNameKhmer,
        defectNameChinese: newDefect.defectNameChinese || "", // Send empty string if not provided
        defectName: newDefect.defectNameEng
      };
      await axios.post(`${API_BASE_URL}/api/cutting-fabric-defects`, payload);
      Swal.fire({
        icon: "success",
        title: t("cutting.success"),
        text: t("cutting.defectAddedSuccess")
      });
      setNewDefect({
        defectCode: "",
        defectNameEng: "",
        defectNameKhmer: "",
        defectNameChinese: ""
      });
      setShowAddForm(false);
      fetchDefects();
    } catch (error) {
      console.error("Error adding new defect:", error);
      Swal.fire({
        icon: "error",
        title: t("cutting.error"),
        text: error.response?.data?.message || t("cutting.failedToAddDefect")
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: t("cutting.confirmDeleteTitle", "Are you sure?"),
      text: t(
        "cutting.confirmDeleteDefectMsg",
        "You won't be able to revert this!"
      ),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("cutting.yesDeleteIt", "Yes, delete it!"),
      cancelButtonText: t("cutting.cancel", "Cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsDeleting(id);
        try {
          await axios.delete(
            `${API_BASE_URL}/api/cutting-fabric-defects/${id}`
          );
          Swal.fire({
            icon: "success",
            title: t("cutting.deleted"),
            text: t("cutting.defectDeletedSuccess")
          });
          fetchDefects();
        } catch (error) {
          console.error("Error deleting defect:", error);
          Swal.fire({
            icon: "error",
            title: t("cutting.error"),
            text:
              error.response?.data?.message || t("cutting.failedToDeleteDefect")
          });
        } finally {
          setIsDeleting(null);
        }
      }
    });
  };

  const filteredDefects = defects.filter((defect) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      defect.defectCode.toLowerCase().includes(searchLower) ||
      defect.defectNameEng.toLowerCase().includes(searchLower) ||
      defect.defectNameKhmer.toLowerCase().includes(searchLower) ||
      (defect.defectNameChinese &&
        defect.defectNameChinese.toLowerCase().includes(searchLower))
    );
  });

  const commonInputProps = (id, field, value, isOptional = false) => ({
    type: "text",
    value: value,
    onChange: (e) => handleInputChange(e, field, id),
    className: `${inputNormalStyle} text-xs py-1.5`,
    required: !isOptional // Add required attribute for HTML5 validation (visual cue)
  });

  // Updated to use labels and group inputs for "Add New Defect" form
  const renderLabeledInputField = (
    id,
    field,
    value,
    labelKey,
    placeholderKey,
    isOptional = false
  ) => (
    <div className="space-y-1">
      <label
        htmlFor={`${field}-${id || "new"}`}
        className="block text-xs font-medium text-gray-700"
      >
        {t(labelKey)} {!isOptional && <span className="text-red-500">*</span>}
      </label>
      <input
        id={`${field}-${id || "new"}`}
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e, field, id)}
        placeholder={t(placeholderKey)}
        className={`${inputNormalStyle} py-2 px-3`} // Use slightly larger padding for add form
        required={!isOptional}
      />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200 gap-3">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
          {t(
            "cutting.manageFabricDefectsTitle",
            "Manage Cutting Fabric Defects"
          )}
        </h1>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditRowId(null);
            setNewDefect({
              defectCode: "",
              defectNameEng: "",
              defectNameKhmer: "",
              defectNameChinese: ""
            });
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          {showAddForm ? (
            <XCircle size={18} className="mr-2" />
          ) : (
            <PlusCircle size={18} className="mr-2" />
          )}
          {showAddForm
            ? t("cutting.cancelAdd", "Cancel Add")
            : t("cutting.addNewDefect", "Add New Defect")}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 border border-indigo-200 rounded-lg bg-indigo-50 shadow">
          <h2 className="text-lg font-semibold text-indigo-700 mb-4">
            {t("cutting.addNewDefectFormTitle", "Add New Defect")}
          </h2>
          {/* Updated "Add New Defect" form to show all 4 names in one row with labels */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {renderLabeledInputField(
              null,
              "defectCode",
              newDefect.defectCode,
              "cutting.defectCode",
              "cutting.defectCodePlaceholder"
            )}
            {renderLabeledInputField(
              null,
              "defectNameEng",
              newDefect.defectNameEng,
              "cutting.defectNameEng",
              "cutting.defectNameEngPlaceholder"
            )}
            {renderLabeledInputField(
              null,
              "defectNameKhmer",
              newDefect.defectNameKhmer,
              "cutting.defectNameKhmer",
              "cutting.defectNameKhmerPlaceholder"
            )}
            {renderLabeledInputField(
              null,
              "defectNameChinese",
              newDefect.defectNameChinese,
              "cutting.defectNameChinese",
              "cutting.defectNameChinesePlaceholder",
              true
            )}{" "}
            {/* Chinese is optional */}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAddNewDefect}
              disabled={isSaving === "new"}
              className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {isSaving === "new" ? (
                <Loader2 size={18} className="animate-spin mr-2" />
              ) : (
                <Save size={18} className="mr-2" />
              )}
              {t("cutting.saveNewDefect", "Save New Defect")}
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t(
              "cutting.searchDefectPlaceholder",
              "Search by code or name..."
            )}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputNormalStyle} pl-10 py-2.5 w-full sm:w-auto sm:min-w-[300px]`}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="ml-3 text-gray-600">
            {t("cutting.loadingDefects", "Loading defects...")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg max-h-[65vh]">
          <table className="min-w-full w-max border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-100 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap">
                  {t("cutting.defectCode")}
                </th>
                <th className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap">
                  {t("cutting.defectNameEng")}
                </th>
                <th className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap">
                  {t("cutting.defectNameKhmer")}
                </th>
                <th className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap">
                  {t("cutting.defectNameChinese")}
                </th>
                <th className="px-3 py-3 border-b border-gray-300 whitespace-nowrap text-center">
                  {t("cutting.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDefects.length > 0 ? (
                filteredDefects.map((defect) => (
                  <tr key={defect._id} className="hover:bg-gray-50">
                    {editRowId === defect._id ? (
                      <>
                        <td className="px-3 py-2 border-r border-gray-300">
                          <input
                            {...commonInputProps(
                              defect._id,
                              "defectCode",
                              editedDefect.defectCode
                            )}
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-gray-300">
                          <input
                            {...commonInputProps(
                              defect._id,
                              "defectNameEng",
                              editedDefect.defectNameEng
                            )}
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-gray-300">
                          <input
                            {...commonInputProps(
                              defect._id,
                              "defectNameKhmer",
                              editedDefect.defectNameKhmer
                            )}
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-gray-300">
                          <input
                            {...commonInputProps(
                              defect._id,
                              "defectNameChinese",
                              editedDefect.defectNameChinese,
                              true
                            )}
                          />
                        </td>{" "}
                        {/* Chinese optional */}
                        <td className="px-3 py-2 border-gray-300 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleSave(defect._id)}
                            disabled={isSaving === defect._id}
                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full mr-1 transition-colors"
                          >
                            {isSaving === defect._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                          >
                            <XCircle size={16} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 border-r border-gray-300 text-xs whitespace-nowrap">
                          {defect.defectCode}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-300 text-xs whitespace-nowrap">
                          {defect.defectNameEng}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-300 text-xs whitespace-nowrap">
                          {defect.defectNameKhmer}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-300 text-xs whitespace-nowrap">
                          {defect.defectNameChinese || "-"}
                        </td>{" "}
                        {/* Display dash if empty */}
                        <td className="px-3 py-2 border-gray-300 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(defect)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-full mr-1 transition-colors"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(defect._id)}
                            disabled={isDeleting === defect._id}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors"
                          >
                            {isDeleting === defect._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">
                    <ListFilter
                      size={32}
                      className="mx-auto mb-2 text-gray-400"
                    />
                    {t(
                      "cutting.noDefectsFound",
                      "No cutting fabric defects found."
                    )}
                    {searchTerm && (
                      <span className="block text-sm">
                        {" "}
                        {t(
                          "cutting.tryDifferentSearch",
                          "Try adjusting your search terms."
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CuttingDefectsModifyAdd;
