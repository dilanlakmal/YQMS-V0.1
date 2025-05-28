import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config"; // Adjust path as needed
import {
  PlusCircle,
  Edit3,
  Save,
  Trash2,
  XCircle,
  Loader2,
  ListFilter,
  Search
} from "lucide-react";

const SCCDefectsModifyAdd = () => {
  const { t } = useTranslation();
  const [defects, setDefects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(null); // To track saving state for specific row or 'new'
  const [isDeleting, setIsDeleting] = useState(null); // To track deleting state for specific row
  const [editRowId, setEditRowId] = useState(null); // ID of the row currently being edited
  const [editedDefect, setEditedDefect] = useState({}); // Holds data for the row being edited

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDefect, setNewDefect] = useState({
    no: null, // Will try to auto-increment or let user set if needed
    defectNameEng: "",
    defectNameKhmer: "",
    defectNameChinese: "" // Optional
  });

  // --- Input Base Styles ---
  const inputBaseStyle = "block w-full text-sm rounded-md shadow-sm";
  const inputNormalStyle = `${inputBaseStyle} border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3`;

  const fetchSccDefects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scc/defects`); // Use existing endpoint
      setDefects(response.data.map((d) => ({ ...d, isChanged: false })));
    } catch (error) {
      console.error("Error fetching SCC defects:", error);
      Swal.fire({
        icon: "error",
        title: t("scc.error"),
        text: t("sccDefects.failedToFetch")
      });
      setDefects([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSccDefects();
  }, [fetchSccDefects]);

  const handleInputChange = (e, field, id = null) => {
    const { value } = e.target;
    if (id) {
      // Editing existing defect
      setEditedDefect((prev) => ({ ...prev, [field]: value, isChanged: true }));
    } else {
      // Adding new defect
      setNewDefect((prev) => ({
        ...prev,
        [field]: field === "no" ? (value === "" ? null : Number(value)) : value
      }));
    }
  };

  const handleEdit = (defect) => {
    setEditRowId(defect._id);
    setEditedDefect({
      ...defect,
      defectNameChinese: defect.defectNameChinese || "",
      isChanged: false
    });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
    setEditedDefect({});
  };

  const handleSave = async (id) => {
    if (
      !editedDefect.no ||
      !editedDefect.defectNameEng ||
      !editedDefect.defectNameKhmer
    ) {
      Swal.fire({
        icon: "warning",
        title: t("scc.missingInformation"),
        text: t("sccDefects.validation.fillRequired")
      });
      return;
    }
    setIsSaving(id);
    try {
      const payload = {
        no: Number(editedDefect.no),
        defectNameEng: editedDefect.defectNameEng,
        defectNameKhmer: editedDefect.defectNameKhmer,
        defectNameChinese: editedDefect.defectNameChinese || ""
      };
      await axios.put(`${API_BASE_URL}/api/scc/defects/${id}`, payload);
      Swal.fire({
        icon: "success",
        title: t("scc.success"),
        text: t("sccDefects.updatedSuccess")
      });
      setEditRowId(null);
      setEditedDefect({});
      fetchSccDefects();
    } catch (error) {
      console.error("Error updating SCC defect:", error);
      Swal.fire({
        icon: "error",
        title: t("scc.error"),
        text: error.response?.data?.message || t("sccDefects.failedToUpdate")
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleAddNewDefect = async () => {
    if (
      newDefect.no === null ||
      newDefect.no === undefined ||
      newDefect.no <= 0 ||
      !newDefect.defectNameEng ||
      !newDefect.defectNameKhmer
    ) {
      Swal.fire({
        icon: "warning",
        title: t("scc.missingInformation"),
        text: t("sccDefects.validation.fillRequiredNew")
      });
      return;
    }
    setIsSaving("new");
    try {
      const payload = {
        no: Number(newDefect.no),
        defectNameEng: newDefect.defectNameEng,
        defectNameKhmer: newDefect.defectNameKhmer,
        defectNameChinese: newDefect.defectNameChinese || ""
      };
      await axios.post(`${API_BASE_URL}/api/scc/defects`, payload);
      Swal.fire({
        icon: "success",
        title: t("scc.success"),
        text: t("sccDefects.addedSuccess")
      });
      setNewDefect({
        no: null,
        defectNameEng: "",
        defectNameKhmer: "",
        defectNameChinese: ""
      });
      setShowAddForm(false);
      fetchSccDefects();
    } catch (error) {
      console.error("Error adding new SCC defect:", error);
      Swal.fire({
        icon: "error",
        title: t("scc.error"),
        text: error.response?.data?.message || t("sccDefects.failedToAdd")
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: t("scc.confirmDeleteTitle", "Are you sure?"),
      text: t(
        "sccDefects.confirmDeleteMsg",
        "You won't be able to revert this defect!"
      ),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("scc.yesDeleteIt", "Yes, delete it!"),
      cancelButtonText: t("scc.cancel", "Cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsDeleting(id);
        try {
          await axios.delete(`${API_BASE_URL}/api/scc/defects/${id}`);
          Swal.fire({
            icon: "success",
            title: t("scc.deleted"),
            text: t("sccDefects.deletedSuccess")
          });
          fetchSccDefects();
        } catch (error) {
          console.error("Error deleting SCC defect:", error);
          Swal.fire({
            icon: "error",
            title: t("scc.error"),
            text:
              error.response?.data?.message || t("sccDefects.failedToDelete")
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
      String(defect.no).includes(searchLower) ||
      defect.defectNameEng.toLowerCase().includes(searchLower) ||
      defect.defectNameKhmer.toLowerCase().includes(searchLower) ||
      (defect.defectNameChinese &&
        defect.defectNameChinese.toLowerCase().includes(searchLower))
    );
  });

  const commonInputProps = (
    id,
    field,
    value,
    type = "text",
    isOptional = false
  ) => ({
    type: type,
    value: value,
    onChange: (e) => handleInputChange(e, field, id),
    className: `${inputNormalStyle} text-xs py-1.5`,
    required: !isOptional
  });

  const renderLabeledInputField = (
    id,
    field,
    value,
    labelKey,
    placeholderKey,
    type = "text",
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
        type={type}
        value={value === null ? "" : value} // Ensure value is not null for input
        onChange={(e) => handleInputChange(e, field, id)}
        placeholder={t(placeholderKey)}
        className={`${inputNormalStyle} py-2 px-3`}
        required={!isOptional}
        min={type === "number" ? 1 : undefined}
      />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200 gap-3">
        <h1 className="text-lg sm:text-2xl font-semibold text-gray-800">
          {t("sccDefects.manageTitle", "Manage Heat Transfer Defects")}
        </h1>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditRowId(null);
            setNewDefect({
              no: null,
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
            ? t("scc.cancelAdd", "Cancel Add")
            : t("sccDefects.addNew", "Add New Defect")}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 border border-indigo-200 rounded-lg bg-indigo-50 shadow">
          <h2 className="text-lg font-semibold text-indigo-700 mb-4">
            {t("sccDefects.addNewFormTitle", "Add New Heat Transfer Defect")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {renderLabeledInputField(
              null,
              "no",
              newDefect.no,
              "sccDefects.defectNo",
              "sccDefects.defectNoPlaceholder",
              "number"
            )}
            {renderLabeledInputField(
              null,
              "defectNameEng",
              newDefect.defectNameEng,
              "sccDefects.defectNameEng",
              "sccDefects.defectNameEngPlaceholder"
            )}
            {renderLabeledInputField(
              null,
              "defectNameKhmer",
              newDefect.defectNameKhmer,
              "sccDefects.defectNameKhmer",
              "sccDefects.defectNameKhmerPlaceholder"
            )}
            {renderLabeledInputField(
              null,
              "defectNameChinese",
              newDefect.defectNameChinese,
              "sccDefects.defectNameChinese",
              "sccDefects.defectNameChinesePlaceholder",
              "text",
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
              {t("scc.saveNew", "Save New Defect")}
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
              "sccDefects.searchPlaceholder",
              "Search by No. or name..."
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
            {t("sccDefects.loading", "Loading defects...")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg max-h-[65vh]">
          <table className="min-w-full w-max border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-100 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap">
                  {t("sccDefects.defectNo")}
                </th>
                <th className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap">
                  {t("sccDefects.defectNameEng")}
                </th>
                <th className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap">
                  {t("sccDefects.defectNameKhmer")}
                </th>
                <th className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap">
                  {t("sccDefects.defectNameChinese")}
                </th>
                <th className="px-3 py-3 border-b border-gray-300 whitespace-nowrap text-center">
                  {t("scc.actions")}
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
                              "no",
                              editedDefect.no,
                              "number"
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
                              "text",
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
                        <td className="px-3 py-2 border-r border-gray-300 text-xs whitespace-nowrap text-center">
                          {defect.no}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-300 text-xs whitespace-nowrap">
                          {defect.defectNameEng}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-300 text-xs whitespace-nowrap">
                          {defect.defectNameKhmer}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-300 text-xs whitespace-nowrap">
                          {defect.defectNameChinese || "-"}
                        </td>
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
                      "sccDefects.noDefectsFound",
                      "No Heat Transfer defects found."
                    )}
                    {searchTerm && (
                      <span className="block text-sm">
                        {" "}
                        {t(
                          "sccDefects.tryDifferentSearch",
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

export default SCCDefectsModifyAdd;
