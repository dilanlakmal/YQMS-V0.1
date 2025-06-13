import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API_BASE_URL } from "../../../../config"; // For API calls
import {
  Settings,
  ToggleLeft,
  ToggleRight,
  Save,
  Edit3,
  Trash2,
  Search,
  XCircle,
  Loader2,
  UserCheck,
  UserX,
  AlertCircle
} from "lucide-react";
import Swal from "sweetalert2";

const DEFAULTS = {
  HT_MACHINES: 12,
  FU_MACHINES: 3,
  ELASTIC_MACHINES: 5
};

// Helper function to determine the correct image URL
// CUSTOMIZE THIS FUNCTION BASED ON YOUR face_photo URL/PATH STRUCTURE
const getFacePhotoUrl = (facePhotoPath) => {
  if (!facePhotoPath) {
    return null;
  }
  if (
    facePhotoPath.startsWith("http://") ||
    facePhotoPath.startsWith("https://")
  ) {
    return facePhotoPath;
  }
  if (facePhotoPath.startsWith("/storage/")) {
    // Example specific prefix
    return `${API_BASE_URL}${facePhotoPath}`;
  }
  if (facePhotoPath.startsWith("/")) {
    // Root relative path
    try {
      const apiOrigin = new URL(API_BASE_URL).origin;
      return `${apiOrigin}${facePhotoPath}`;
    } catch (e) {
      console.warn(
        "API_BASE_URL is not a valid URL for constructing image paths, using path directly:",
        facePhotoPath
      );
      return facePhotoPath; // Fallback for root-relative if API_BASE_URL is not a full URL
    }
  }
  // Fallback for other cases (e.g., just a filename, or unhandled format)
  console.warn(
    "Unhandled face_photo path format:",
    facePhotoPath,
    "- rendering as is. This might be incorrect."
  );
  return facePhotoPath;
};

const SCCOperatorsManage = () => {
  const { t } = useTranslation();
  const [settingsPaneOpen, setSettingsPaneOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const [htMachineCountInput, setHtMachineCountInput] = useState(
    String(DEFAULTS.HT_MACHINES)
  );
  const [fuMachineCountInput, setFuMachineCountInput] = useState(
    String(DEFAULTS.FU_MACHINES)
  );
  const [elasticMachineCountInput, setElasticMachineCountInput] = useState(
    String(DEFAULTS.ELASTIC_MACHINES)
  );

  const [htOperators, setHtOperators] = useState([]);
  const [fuOperators, setFuOperators] = useState([]);
  const [elasticOperators, setElasticOperators] = useState([]);

  const [currentEditing, setCurrentEditing] = useState({});
  const [savingStates, setSavingStates] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [htRes, fuRes, elasticRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/scc/operators/ht`),
        axios.get(`${API_BASE_URL}/api/scc/operators/fu`),
        axios.get(`${API_BASE_URL}/api/scc/operators/elastic`)
      ]);

      setHtOperators(htRes.data);
      setFuOperators(fuRes.data);
      setElasticOperators(elasticRes.data);

      setHtMachineCountInput(
        String(Math.max(DEFAULTS.HT_MACHINES, htRes.data?.length || 0))
      );
      setFuMachineCountInput(
        String(Math.max(DEFAULTS.FU_MACHINES, fuRes.data?.length || 0))
      );
      setElasticMachineCountInput(
        String(
          Math.max(DEFAULTS.ELASTIC_MACHINES, elasticRes.data?.length || 0)
        )
      );
    } catch (error) {
      console.error("Error fetching operator data:", error);
      Swal.fire(
        t("common.error"),
        t("sccOperators.errorFetchingData"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMachineCountChange = (setter, value) => {
    if (value === "" || (/^\d+$/.test(value) && Number(value) >= 0)) {
      setter(value);
    }
  };

  const getMachineNumbersArray = (countStr, type) => {
    const count = Number(countStr) || 0;
    if (type === "fu") {
      return Array.from({ length: count }, (_, i) =>
        String(i + 1).padStart(3, "0")
      );
    }
    return Array.from({ length: count }, (_, i) => String(i + 1));
  };

  const debouncedSearch = useMemo(() => {
    let timer;
    return (type, machineNo, searchTerm) => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (searchTerm.trim().length < 2) {
          setCurrentEditing((prev) => ({
            ...prev,
            [`${type}-${machineNo}-searchResults`]: []
          }));
          return;
        }
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/users/search-by-empid?term=${searchTerm}`
          );
          setCurrentEditing((prev) => ({
            ...prev,
            [`${type}-${machineNo}-searchResults`]: Array.isArray(response.data)
              ? response.data
              : []
          }));
        } catch (error) {
          console.error(
            "Error searching users (frontend):",
            error.response?.data || error.message
          );
          setCurrentEditing((prev) => ({
            ...prev,
            [`${type}-${machineNo}-searchResults`]: []
          }));
        }
      }, 500);
    };
  }, []); // API_BASE_URL is a static config, not needed as dep typically

  const handleEmpIdSearchChange = (type, machineNo, value) => {
    setCurrentEditing((prev) => ({
      ...prev,
      [`${type}-${machineNo}-emp_id_search`]: value,
      [`${type}-${machineNo}-selectedUser`]: null
    }));
    debouncedSearch(type, machineNo, value);
  };

  const selectUser = (type, machineNo, user) => {
    setCurrentEditing((prev) => ({
      ...prev,
      [`${type}-${machineNo}-emp_id_search`]: user.emp_id,
      [`${type}-${machineNo}-selectedUser`]: user,
      [`${type}-${machineNo}-searchResults`]: []
    }));
  };

  const getOperatorForMachine = (operatorsList, machineNo) => {
    return operatorsList.find((op) => op.machineNo === machineNo);
  };

  const handleSaveOperator = async (type, machineNo) => {
    const currentEmpIdSearch =
      currentEditing[`${type}-${machineNo}-emp_id_search`]?.trim();
    let selectedUserDetailsFromState =
      currentEditing[`${type}-${machineNo}-selectedUser`];
    let empToSave = null;

    if (!currentEmpIdSearch) {
      Swal.fire(
        t("common.warning"),
        t("sccOperators.selectEmployeeWarning"),
        "warning"
      );
      return;
    }

    if (
      selectedUserDetailsFromState &&
      selectedUserDetailsFromState.emp_id === currentEmpIdSearch
    ) {
      empToSave = selectedUserDetailsFromState;
    } else {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/users/search-by-empid?term=${currentEmpIdSearch}`
        );
        const usersFound = Array.isArray(response.data) ? response.data : [];
        const exactMatchUser = usersFound.find(
          (user) => user.emp_id === currentEmpIdSearch
        );

        if (exactMatchUser) {
          empToSave = exactMatchUser;
          setCurrentEditing((prev) => ({
            ...prev,
            [`${type}-${machineNo}-selectedUser`]: exactMatchUser
          }));
        } else {
          Swal.fire(
            t("common.error"),
            t("sccOperators.errorUserNotFound", { emp_id: currentEmpIdSearch }),
            "error"
          );
          return;
        }
      } catch (error) {
        console.error(
          `Error validating user ${currentEmpIdSearch} for save:`,
          error.response?.data || error.message
        );
        Swal.fire(
          t("common.error"),
          t("sccOperators.errorValidatingUser", { emp_id: currentEmpIdSearch }),
          "error"
        );
        return;
      }
    }

    if (!empToSave || !empToSave.emp_id) {
      Swal.fire(
        t("common.warning"),
        t("sccOperators.selectEmployeeWarning"),
        "warning"
      );
      return;
    }

    const saveKey = `${type}-${machineNo}`;
    setSavingStates((prev) => ({ ...prev, [saveKey]: true }));

    try {
      // Send only emp_id; backend will fetch user details again to ensure data integrity
      await axios.post(`${API_BASE_URL}/api/scc/operators/${type}`, {
        machineNo: machineNo,
        emp_id: empToSave.emp_id
      });
      Swal.fire(
        t("common.success"),
        t("sccOperators.operatorSavedSuccess"),
        "success"
      );
      fetchData(); // Refresh data, which will include the newly saved operator with populated emp_reference
      setCurrentEditing((prev) => {
        const newState = { ...prev };
        delete newState[`${type}-${machineNo}-emp_id_search`];
        delete newState[`${type}-${machineNo}-selectedUser`];
        delete newState[`${type}-${machineNo}-searchResults`];
        return newState;
      });
    } catch (error) {
      console.error(
        "Error saving operator:",
        error.response?.data || error.message
      );
      Swal.fire(
        t("common.error"),
        error.response?.data?.error || t("sccOperators.errorSavingOperator"),
        "error"
      );
    } finally {
      setSavingStates((prev) => ({ ...prev, [saveKey]: false }));
    }
  };

  const handleEditOperator = (type, machineNo, operator) => {
    const userToEdit = operator?.emp_reference || {
      emp_id: operator?.emp_id,
      eng_name: operator?.emp_eng_name,
      face_photo: operator?.emp_face_photo,
      _id: operator?.emp_reference
    };
    setCurrentEditing((prev) => ({
      ...prev,
      [`${type}-${machineNo}-emp_id_search`]: userToEdit.emp_id || "",
      [`${type}-${machineNo}-selectedUser`]: userToEdit,
      [`${type}-${machineNo}-searchResults`]: []
    }));
  };

  const handleRemoveOperator = async (type, machineNo) => {
    Swal.fire({
      title: t("common.areYouSure"),
      text: t("sccOperators.confirmRemoveOperator", { machineNo }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: t("common.yesRemoveIt"),
      cancelButtonText: t("common.cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(
            `${API_BASE_URL}/api/scc/operators/${type}/${machineNo}`
          );
          Swal.fire(
            t("common.removed"),
            t("sccOperators.operatorRemovedSuccess"),
            "success"
          );
          fetchData();
        } catch (error) {
          console.error("Error removing operator:", error);
          Swal.fire(
            t("common.error"),
            error.response?.data?.error ||
              t("sccOperators.errorRemovingOperator"),
            "error"
          );
        }
      }
    });
  };

  const renderOperatorTable = (
    title,
    type,
    machineCountInput,
    operatorsList
  ) => {
    const machineNumbers = getMachineNumbersArray(machineCountInput, type);

    return (
      <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
                >
                  {t("sccOperators.machineNo")}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/6"
                >
                  {t("sccOperators.empId")}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
                >
                  {t("sccOperators.photo")}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
                >
                  {t("sccOperators.name")}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
                >
                  {t("sccOperators.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {machineNumbers.map((machineNo) => {
                const operator = getOperatorForMachine(
                  operatorsList,
                  machineNo
                );
                const empIdSearchInState =
                  currentEditing[`${type}-${machineNo}-emp_id_search`];
                const selectedUserInState =
                  currentEditing[`${type}-${machineNo}-selectedUser`];

                const empIdToDisplayInInput =
                  empIdSearchInState ?? (operator?.emp_id || "");
                const userForPhotoAndName =
                  selectedUserInState || operator?.emp_reference;

                const searchResultsValue =
                  currentEditing[`${type}-${machineNo}-searchResults`] || [];
                const isSaving = savingStates[`${type}-${machineNo}`];

                const imageUrl = userForPhotoAndName?.face_photo
                  ? getFacePhotoUrl(userForPhotoAndName.face_photo)
                  : null;

                return (
                  <tr key={`${type}-${machineNo}`}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {machineNo}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 relative">
                      <input
                        type="text"
                        value={empIdToDisplayInInput}
                        onChange={(e) =>
                          handleEmpIdSearchChange(
                            type,
                            machineNo,
                            e.target.value
                          )
                        }
                        placeholder={t("sccOperators.searchEmpIdPlaceholder")}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      />
                      {searchResultsValue.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                          {searchResultsValue.map((user) => (
                            <li
                              key={user._id}
                              onClick={() => selectUser(type, machineNo, user)}
                              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                              {user.emp_id} - {user.eng_name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={t("sccOperators.photo")}
                          className="h-10 w-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <UserX className="h-10 w-10 text-gray-400" />
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {userForPhotoAndName?.eng_name || "N/A"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSaveOperator(type, machineNo)}
                        className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                        title={t("common.save")}
                        disabled={isSaving || !empIdToDisplayInInput}
                      >
                        {isSaving ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Save className="h-5 w-5" />
                        )}
                      </button>
                      {operator && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleEditOperator(type, machineNo, operator)
                            }
                            className="text-green-600 hover:text-green-900"
                            title={t("common.edit")}
                          >
                            <Edit3 className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveOperator(type, machineNo)
                            }
                            className="text-red-600 hover:text-red-900"
                            title={t("common.remove")}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {machineNumbers.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-3 py-4 text-center text-sm text-gray-500"
                  >
                    {t("sccOperators.noMachinesConfigured")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (
    loading &&
    !htOperators.length &&
    !fuOperators.length &&
    !elasticOperators.length
  ) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="ml-3 text-gray-700">{t("common.loadingData")}</p>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {t("sccOperators.settingsTitle")}
          </h2>
          <button
            type="button"
            onClick={() => setSettingsPaneOpen(!settingsPaneOpen)}
            className="text-indigo-600 hover:text-indigo-800"
            title={settingsPaneOpen ? t("common.collapse") : t("common.expand")}
          >
            {settingsPaneOpen ? (
              <ToggleRight size={28} />
            ) : (
              <ToggleLeft size={28} />
            )}
          </button>
        </div>
        {settingsPaneOpen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="htMachines"
                className="block text-sm font-medium text-gray-700"
              >
                {t("sccOperators.htMachines")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                id="htMachines"
                value={htMachineCountInput}
                onChange={(e) =>
                  handleMachineCountChange(
                    setHtMachineCountInput,
                    e.target.value
                  )
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min="0"
              />
            </div>
            <div>
              <label
                htmlFor="fuMachines"
                className="block text-sm font-medium text-gray-700"
              >
                {t("sccOperators.fuMachines")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                id="fuMachines"
                value={fuMachineCountInput}
                onChange={(e) =>
                  handleMachineCountChange(
                    setFuMachineCountInput,
                    e.target.value
                  )
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min="0"
              />
            </div>
            <div>
              <label
                htmlFor="elasticMachines"
                className="block text-sm font-medium text-gray-700"
              >
                {t("sccOperators.elasticMachines")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                id="elasticMachines"
                value={elasticMachineCountInput}
                onChange={(e) =>
                  handleMachineCountChange(
                    setElasticMachineCountInput,
                    e.target.value
                  )
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min="0"
              />
            </div>
          </div>
        )}
      </div>

      {renderOperatorTable(
        t("sccOperators.htMachineOperators"),
        "ht",
        htMachineCountInput,
        htOperators
      )}
      {renderOperatorTable(
        t("sccOperators.fuMachineOperators"),
        "fu",
        fuMachineCountInput,
        fuOperators
      )}
      {renderOperatorTable(
        t("sccOperators.elasticMachineOperators"),
        "elastic",
        elasticMachineCountInput,
        elasticOperators
      )}
    </div>
  );
};

export default SCCOperatorsManage;
