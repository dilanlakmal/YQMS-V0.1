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
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// --- Base Styles ---
const inputBaseStyle = "block w-full text-sm rounded-md shadow-sm";
const inputNormalStyle = `${inputBaseStyle} border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3`;

// --- Generic Section Component (Corrected and Simplified) ---
const DataSection = ({
  dataType,
  titleKey,
  addFormTitleKey,
  addNewKey,
  apiEndpoint,
  // --- EXPLICIT PROPS (The Core of the Fix) ---
  engFieldName, // e.g., "defectNameEng" or "issueEng"
  khmerFieldName, // e.g., "defectNameKhmer" or "issueKhmer"
  chineseFieldName, // e.g., "defectNameChinese" or "issueChi"
  t
}) => {
  const [dataList, setDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [editRowId, setEditRowId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newData, setNewData] = useState({});
  const [showSection, setShowSection] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/${apiEndpoint}`);
      setDataList(response.data);
    } catch (error) {
      console.error(`Error fetching ${dataType} data:`, error);
      Swal.fire({
        icon: "error",
        title: t("scc.error"),
        text: t(`${dataType}.failedToFetch`)
      });
      setDataList([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, dataType, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e, field, id = null) => {
    const { value } = e.target;
    const targetStateUpdater = id ? setEditedData : setNewData;
    targetStateUpdater((prev) => ({
      ...prev,
      [field]: field === "no" ? (value === "" ? null : Number(value)) : value
    }));
  };

  const handleEdit = (item) => {
    setEditRowId(item._id);
    setEditedData({
      no: item.no,
      [engFieldName]: item[engFieldName],
      [khmerFieldName]: item[khmerFieldName],
      [chineseFieldName]: item[chineseFieldName] || ""
    });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => setEditRowId(null);

  const handleSave = async (id) => {
    if (
      !editedData.no ||
      !editedData[engFieldName] ||
      !editedData[khmerFieldName]
    ) {
      Swal.fire({
        icon: "warning",
        title: t("scc.missingInformation"),
        text: t(`${dataType}.validation.fillRequired`)
      });
      return;
    }
    setIsSaving(id);
    try {
      // Send the state directly, as it now has the correct keys.
      await axios.put(`${API_BASE_URL}/api/${apiEndpoint}/${id}`, editedData);
      Swal.fire({
        icon: "success",
        title: t("scc.success"),
        text: t(`${dataType}.updatedSuccess`)
      });
      setEditRowId(null);
      fetchData();
    } catch (error) {
      console.error(`Error updating ${dataType}:`, error);
      Swal.fire({
        icon: "error",
        title: t("scc.error"),
        text: error.response?.data?.message || t(`${dataType}.failedToUpdate`)
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleAddNew = async () => {
    if (!newData.no || !newData[engFieldName] || !newData[khmerFieldName]) {
      Swal.fire({
        icon: "warning",
        title: t("scc.missingInformation"),
        text: t(`${dataType}.validation.fillRequiredNew`)
      });
      return;
    }
    setIsSaving("new");
    try {
      // Send the state directly.
      await axios.post(`${API_BASE_URL}/api/${apiEndpoint}`, newData);
      Swal.fire({
        icon: "success",
        title: t("scc.success"),
        text: t(`${dataType}.addedSuccess`)
      });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error(`Error adding new ${dataType}:`, error);
      Swal.fire({
        icon: "error",
        title: t("scc.error"),
        text: error.response?.data?.message || t(`${dataType}.failedToAdd`)
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: t("scc.confirmDeleteTitle"),
      text: t(`${dataType}.confirmDeleteMsg`),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("scc.yesDeleteIt"),
      cancelButtonText: t("scc.cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsDeleting(id);
        try {
          await axios.delete(`${API_BASE_URL}/api/${apiEndpoint}/${id}`);
          Swal.fire({
            icon: "success",
            title: t("scc.deleted"),
            text: t(`${dataType}.deletedSuccess`)
          });
          fetchData();
        } catch (error) {
          console.error(`Error deleting ${dataType}:`, error);
          Swal.fire({
            icon: "error",
            title: t("scc.error"),
            text:
              error.response?.data?.message || t(`${dataType}.failedToDelete`)
          });
        } finally {
          setIsDeleting(null);
        }
      }
    });
  };

  const filteredData = dataList.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      String(item.no).includes(searchLower) ||
      (item[engFieldName] &&
        item[engFieldName].toLowerCase().includes(searchLower)) ||
      (item[khmerFieldName] &&
        item[khmerFieldName].toLowerCase().includes(searchLower)) ||
      (item[chineseFieldName] &&
        item[chineseFieldName].toLowerCase().includes(searchLower))
    );
  });

  const renderLabeledInputField = (
    id,
    field,
    val,
    labelKey,
    placeholderKey,
    type = "text",
    isOptional = false
  ) => (
    <div className="space-y-1">
      <label
        htmlFor={`${field}-${dataType}-${id || "new"}`}
        className="block text-xs font-medium text-gray-700"
      >
        {t(labelKey)} {!isOptional && <span className="text-red-500">*</span>}
      </label>
      <input
        id={`${field}-${dataType}-${id || "new"}`}
        type={type}
        value={val || ""}
        onChange={(e) => handleInputChange(e, field, id)}
        placeholder={t(placeholderKey)}
        className={`${inputNormalStyle} py-2 px-3`}
        required={!isOptional}
        min={type === "number" ? 1 : undefined}
      />
    </div>
  );

  return (
    <div className="mb-10 p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2
          className="text-lg sm:text-xl font-semibold text-gray-800 cursor-pointer hover:text-indigo-600 flex items-center"
          onClick={() => setShowSection(!showSection)}
        >
          {t(titleKey)}
          {showSection ? (
            <ChevronUp size={20} className="ml-2" />
          ) : (
            <ChevronDown size={20} className="ml-2" />
          )}
        </h2>
        {showSection && (
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditRowId(null);
              setNewData({
                // Initialize with correct, explicit keys
                no: null,
                [engFieldName]: "",
                [khmerFieldName]: "",
                [chineseFieldName]: ""
              });
            }}
            className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            {showAddForm ? (
              <XCircle size={16} className="mr-1 sm:mr-2" />
            ) : (
              <PlusCircle size={16} className="mr-1 sm:mr-2" />
            )}
            {showAddForm ? t("scc.cancelAdd") : t(addNewKey)}
          </button>
        )}
      </div>
      {showSection && (
        <>
          {showAddForm && (
            <div className="mb-6 p-4 border border-indigo-200 rounded-lg bg-indigo-50 shadow">
              <h3 className="text-md sm:text-lg font-semibold text-indigo-700 mb-4">
                {t(addFormTitleKey)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {renderLabeledInputField(
                  null,
                  "no",
                  newData.no,
                  `${dataType}.no`,
                  `${dataType}.noPlaceholder`,
                  "number"
                )}
                {renderLabeledInputField(
                  null,
                  engFieldName,
                  newData[engFieldName],
                  `${dataType}.nameEng`,
                  `${dataType}.nameEngPlaceholder`
                )}
                {renderLabeledInputField(
                  null,
                  khmerFieldName,
                  newData[khmerFieldName],
                  `${dataType}.nameKhmer`,
                  `${dataType}.nameKhmerPlaceholder`
                )}
                {renderLabeledInputField(
                  null,
                  chineseFieldName,
                  newData[chineseFieldName],
                  `${dataType}.nameChinese`,
                  `${dataType}.nameChinesePlaceholder`,
                  "text",
                  true
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAddNew}
                  disabled={isSaving === "new"}
                  className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isSaving === "new" ? (
                    <Loader2 size={18} className="animate-spin mr-2" />
                  ) : (
                    <Save size={18} className="mr-2" />
                  )}
                  {t("scc.saveNew")}
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
                placeholder={t(`${dataType}.searchPlaceholder`)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputNormalStyle} pl-10 py-2 w-full sm:w-auto sm:min-w-[300px]`}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="ml-3 text-gray-600">{t(`${dataType}.loading`)}</p>
            </div>
          ) : (
            <div className="overflow-x-auto shadow-md rounded-lg max-h-[60vh]">
              <table className="min-w-full w-max border-collapse">
                <thead className="sticky top-0 z-10 bg-gray-100 text-xs uppercase text-gray-700">
                  <tr>
                    <th className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap">
                      {t(`${dataType}.no`)}
                    </th>
                    <th className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap">
                      {t(`${dataType}.nameEng`)}
                    </th>
                    <th className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap">
                      {t(`${dataType}.nameKhmer`)}
                    </th>
                    <th className="px-3 py-3 border-b border-r border-gray-300 whitespace-nowrap">
                      {t(`${dataType}.nameChinese`)}
                    </th>
                    <th className="px-3 py-3 border-b border-gray-300 whitespace-nowrap text-center">
                      {t("scc.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        {editRowId === item._id ? (
                          <>
                            <td className="px-3 py-2 border-r">
                              <input
                                type="number"
                                value={editedData.no || ""}
                                onChange={(e) =>
                                  handleInputChange(e, "no", item._id)
                                }
                                className={`${inputNormalStyle} text-xs py-1.5`}
                              />
                            </td>
                            <td className="px-3 py-2 border-r">
                              <input
                                type="text"
                                value={editedData[engFieldName] || ""}
                                onChange={(e) =>
                                  handleInputChange(e, engFieldName, item._id)
                                }
                                className={`${inputNormalStyle} text-xs py-1.5`}
                              />
                            </td>
                            <td className="px-3 py-2 border-r">
                              <input
                                type="text"
                                value={editedData[khmerFieldName] || ""}
                                onChange={(e) =>
                                  handleInputChange(e, khmerFieldName, item._id)
                                }
                                className={`${inputNormalStyle} text-xs py-1.5`}
                              />
                            </td>
                            <td className="px-3 py-2 border-r">
                              <input
                                type="text"
                                value={editedData[chineseFieldName] || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    e,
                                    chineseFieldName,
                                    item._id
                                  )
                                }
                                className={`${inputNormalStyle} text-xs py-1.5`}
                              />
                            </td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">
                              <button
                                onClick={() => handleSave(item._id)}
                                disabled={isSaving === item._id}
                                className="p-1.5 text-green-600 hover:text-green-800 rounded-full mr-1"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 text-red-500 hover:text-red-700 rounded-full"
                              >
                                <XCircle size={16} />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 border-r text-xs text-center">
                              {item.no}
                            </td>
                            <td className="px-3 py-2 border-r text-xs">
                              {item[engFieldName]}
                            </td>
                            <td className="px-3 py-2 border-r text-xs">
                              {item[khmerFieldName]}
                            </td>
                            <td className="px-3 py-2 border-r text-xs">
                              {item[chineseFieldName] || "-"}
                            </td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-full mr-1"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(item._id)}
                                disabled={isDeleting === item._id}
                                className="p-1.5 text-red-600 hover:text-red-800 rounded-full"
                              >
                                {isDeleting === item._id ? (
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
                      <td
                        colSpan="5"
                        className="text-center py-10 text-gray-500"
                      >
                        <ListFilter
                          size={32}
                          className="mx-auto mb-2 text-gray-400"
                        />
                        {t(`${dataType}.noDataFound`)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// --- Parent Component (The Fix is Applied Here) ---
const RovingMasterDataManage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <DataSection
        dataType="pairingDefect"
        titleKey="pairingDefect.manageTitle"
        addFormTitleKey="pairingDefect.addNewFormTitle"
        addNewKey="pairingDefect.addNew"
        apiEndpoint="pairing-defects"
        // --- Explicitly tell the component which fields to use ---
        engFieldName="defectNameEng"
        khmerFieldName="defectNameKhmer"
        chineseFieldName="defectNameChinese"
        t={t}
      />
      <DataSection
        dataType="accessoryIssue"
        titleKey="accessoryIssue.manageTitle"
        addFormTitleKey="accessoryIssue.addNewFormTitle"
        addNewKey="accessoryIssue.addNew"
        apiEndpoint="accessory-issues"
        // --- Explicitly tell the component the *different* fields to use ---
        engFieldName="issueEng"
        khmerFieldName="issueKhmer"
        chineseFieldName="issueChi"
        t={t}
      />
    </div>
  );
};

export default RovingMasterDataManage;
