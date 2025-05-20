import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import Swal from "sweetalert2";
import { Loader2, Save, AlertTriangle, Trash2 } from "lucide-react";

const DefectBuyerStatus = () => {
  const { t } = useTranslation();

  const mapI18nLangToDisplayLang = (lang) => {
    if (lang.startsWith("kh")) return "kh";
    if (lang.startsWith("ch") || lang.startsWith("zh")) return "ch";
    return "en";
  };

  const [currentDisplayLanguage, setCurrentDisplayLanguage] = useState(
    mapI18nLangToDisplayLang(i18next.language)
  );
  const [allDefects, setAllDefects] = useState([]);
  const [allBuyers, setAllBuyers] = useState([]);
  const [defectStatuses, setDefectStatuses] = useState({});
  const [loadingDefects, setLoadingDefects] = useState(true);
  const [loadingBuyers, setLoadingBuyers] = useState(true);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoadingDefects(true);
    setLoadingBuyers(true);
    setLoadingStatuses(true);
    setError(null);

    try {
      const defectsResponse = await axios.get(
        `${API_BASE_URL}/api/defects/all-details`
      );
      const fetchedDefects = defectsResponse.data || [];
      setAllDefects(fetchedDefects);

      // Populate defectStatuses from fetchedDefects' statusByBuyer array
      const initialStatuses = {};
      fetchedDefects.forEach((defect) => {
        initialStatuses[defect.code] = {};
        (defect.statusByBuyer || []).forEach((statusEntry) => {
          if (statusEntry.buyerName) {
            if (!initialStatuses[defect.code][statusEntry.buyerName]) {
              initialStatuses[defect.code][statusEntry.buyerName] = {
                defectStatus: [],
                isCommon: "Minor"
              };
            }
            initialStatuses[defect.code][statusEntry.buyerName].defectStatus =
              Array.isArray(statusEntry.defectStatus)
                ? statusEntry.defectStatus
                : [];
            initialStatuses[defect.code][statusEntry.buyerName].isCommon =
              statusEntry.isCommon || "Minor";
          }
        });
      });
      setDefectStatuses(initialStatuses);
    } catch (err) {
      console.error("Error fetching defects:", err);
      setError(
        t("defectBuyerStatus.errors.fetchDefects", "Failed to load defects.")
      );
      setAllDefects([]);
    } finally {
      setLoadingDefects(false);
    }

    try {
      // Fetch Buyers
      const buyersResponse = await axios.get(`${API_BASE_URL}/api/buyers`);
      setAllBuyers(buyersResponse.data || []);
    } catch (err) {
      console.error("Error fetching buyers:", err);
      setError((prev) =>
        prev
          ? `${prev}\n${t(
              "defectBuyerStatus.errors.fetchBuyers",
              "Failed to load buyers."
            )}`
          : t("defectBuyerStatus.errors.fetchBuyers", "Failed to load buyers.")
      );
      setAllBuyers([]);
    } finally {
      setLoadingBuyers(false);
    }

    setLoadingStatuses(false);
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentDisplayLanguage(mapI18nLangToDisplayLang(lng));
    };
    i18next.on("languageChanged", handleLanguageChanged);

    setCurrentDisplayLanguage(mapI18nLangToDisplayLang(i18next.language));

    return () => {
      i18next.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  const handleDeleteDefect = async (defectCode) => {
    Swal.fire({
      title: t("defectBuyerStatus.confirmDelete.title", "Are you sure?"),
      text: t(
        "defectBuyerStatus.confirmDelete.text",
        "You won't be able to revert this!"
      ),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t(
        "defectBuyerStatus.confirmDelete.confirmButton",
        "Yes, delete it!"
      ),
      cancelButtonText: t(
        "defectBuyerStatus.confirmDelete.cancelButton",
        "Cancel"
      )
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsSaving(true); // Use isSaving state for delete operation too
        setError(null);
        try {
          await axios.delete(
            `${API_BASE_URL}/api/sewing-defects/${defectCode}`
          );
          // Remove the defect from the state
          setAllDefects((prevDefects) =>
            prevDefects.filter((d) => d.code !== defectCode)
          );
          setDefectStatuses((prevStatuses) => {
            const newStatuses = { ...prevStatuses };
            delete newStatuses[defectCode];
            return newStatuses;
          });
          Swal.fire(
            t("defectBuyerStatus.deleted.title", "Deleted!"),
            t("defectBuyerStatus.deleted.text", "The defect has been deleted."),
            "success"
          );
        } catch (err) {
          console.error("Error deleting defect:", err);
          setError(
            t(
              "defectBuyerStatus.errors.deleteDefect",
              "Failed to delete defect."
            )
          );
          Swal.fire(
            t("defectBuyerStatus.errors.deleteFailedTitle", "Delete Failed"),
            err.response?.data?.message ||
              t(
                "defectBuyerStatus.errors.deleteDefect",
                "Failed to delete defect."
              ),
            "error"
          );
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  const getDefectDisplayName = (defect) => {
    return defect[`name_${currentDisplayLanguage}`] || defect.name_en;
  };

  const handleCheckboxChange = (defectCode, buyerName, statusType) => {
    setDefectStatuses((prevStatuses) => {
      const newStatuses = JSON.parse(JSON.stringify(prevStatuses));
      if (!newStatuses[defectCode]) {
        newStatuses[defectCode] = {};
      }
      if (!newStatuses[defectCode][buyerName]) {
        newStatuses[defectCode][buyerName] = {
          defectStatus: [],
          isCommon: "Minor"
        };
      }

      const currentDefectStatuses =
        newStatuses[defectCode][buyerName].defectStatus || [];
      const isChecked = currentDefectStatuses.includes(statusType);
      if (isChecked) {
        newStatuses[defectCode][buyerName].defectStatus =
          currentDefectStatuses.filter((c) => c !== statusType);
      } else {
        newStatuses[defectCode][buyerName].defectStatus = [
          ...currentDefectStatuses,
          statusType
        ];
      }

      return newStatuses;
    });
  };

  const handleDropdownChange = (
    defectCode,
    buyerName,
    newCommonClassification
  ) => {
    setDefectStatuses((prevStatuses) => {
      const newStatuses = JSON.parse(JSON.stringify(prevStatuses));
      if (!newStatuses[defectCode]) {
        newStatuses[defectCode] = {};
      }
      if (!newStatuses[defectCode][buyerName]) {
        newStatuses[defectCode][buyerName] = {
          defectStatus: [],
          isCommon: "Minor"
        };
      }
      newStatuses[defectCode][buyerName].isCommon = newCommonClassification;

      return newStatuses;
    });
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);

    const payload = [];
    for (const defectCode in defectStatuses) {
      for (const buyerName in defectStatuses[defectCode]) {
        const status = defectStatuses[defectCode][buyerName];
        payload.push({
          defectCode,
          buyerName,
          defectStatus: status.defectStatus || [],
          isCommon: status.isCommon || "Minor"
        });
      }
    }

    try {
      await axios.post(
        `${API_BASE_URL}/api/sewing-defects/buyer-statuses`,
        payload
      );
      Swal.fire({
        icon: "success",
        title: t("defectBuyerStatus.success.title", "Success"),
        text: t(
          "defectBuyerStatus.success.message",
          "Defect statuses saved successfully!"
        )
      });
    } catch (err) {
      console.error("Error saving defect statuses:", err);
      setError(
        t(
          "defectBuyerStatus.errors.saveStatuses",
          "Failed to save defect statuses."
        )
      );
      Swal.fire({
        icon: "error",
        title: t("defectBuyerStatus.errors.saveFailedTitle", "Save Failed"),
        text:
          err.response?.data?.message ||
          t(
            "defectBuyerStatus.errors.saveStatuses",
            "Failed to save defect statuses."
          )
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingDefects || loadingBuyers || loadingStatuses) {
    return (
      <div className="flex justify-center items-center h-screen p-6">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="ml-4 text-lg">
          {t("defectBuyerStatus.loading", "Loading data...")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-8xl mx-auto bg-white shadow-xl rounded-lg p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
          {t("defectBuyerStatus.title", "Manage Defect Statuses by Buyer")}
        </h1>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            <pre className="whitespace-pre-wrap">{error}</pre>
          </div>
        )}
        <div className="overflow-auto max-h-[70vh]">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr className="text-xs font-medium text-gray-600 uppercase tracking-wider text-center">
                <th
                  scope="col"
                  rowSpan="2"
                  className="px-4 py-3 text-center border border-gray-300 bg-gray-100"
                >
                  {t("defectBuyerStatus.defectName", "Defect Name")}
                </th>
                <th
                  scope="col"
                  rowSpan="2"
                  className="px-2 py-3 text-center border border-gray-300 bg-gray-100" // New Actions column header
                >
                  {t("defectBuyerStatus.actions", "Actions")}
                </th>
                {allBuyers.map((buyer) => (
                  <th
                    key={buyer}
                    scope="col"
                    colSpan="2"
                    className="px-4 py-3 text-center border border-gray-300 bg-gray-100"
                  >
                    {buyer}
                  </th>
                ))}
              </tr>
              <tr className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                {allBuyers.map((buyer) => (
                  <React.Fragment key={`${buyer}-sub`}>
                    <th
                      scope="col"
                      className="px-2 py-2 text-left border border-gray-300 bg-gray-100"
                    >
                      {t("defectBuyerStatus.classifications", "Status")}
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-2 text-left border border-gray-300 bg-gray-100"
                    >
                      {t("defectBuyerStatus.commonStatus", "Common")}
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allDefects.length === 0 && (
                <tr>
                  <td
                    colSpan={2 + allBuyers.length * 2}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    {t("defectBuyerStatus.noDefectsFound", "No defects found.")}
                  </td>
                </tr>
              )}
              {allBuyers.length === 0 && allDefects.length > 0 && (
                <tr>
                  <td
                    colSpan={2 + allBuyers.length * 2}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    {t(
                      "defectBuyerStatus.noBuyersFound",
                      "No buyers found. Please add buyers to the system."
                    )}
                  </td>
                </tr>
              )}
              {allDefects.map((defect) => (
                <tr key={defect.code} className="hover:bg-gray-50">
                  <td className="px-4 py-3 align-top border border-gray-300 md:w-auto whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getDefectDisplayName(defect)}
                    </div>
                    <div className="text-xs text-gray-500">({defect.code})</div>
                  </td>
                  <td className="px-2 py-3 align-top border-r border-gray-300 text-center">
                    <button
                      onClick={() => handleDeleteDefect(defect.code)}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      disabled={isSaving}
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                  {allBuyers.map((buyer) => (
                    <React.Fragment key={`${defect.code}-${buyer}`}>
                      <td className="px-2 py-3 align-top border-r border-gray-300">
                        <div className="space-y-1">
                          {["Critical", "Major", "Minor"].map(
                            (classification) => (
                              <label
                                key={classification}
                                className="flex items-center space-x-1 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  className={`form-checkbox h-4 w-4 border-gray-300 rounded ${
                                    classification === "Critical"
                                      ? "text-red-600 focus:ring-red-500"
                                      : classification === "Major"
                                      ? "text-orange-500 focus:ring-orange-400"
                                      : "text-yellow-500 focus:ring-yellow-400"
                                  }`}
                                  checked={
                                    defectStatuses[defect.code]?.[
                                      buyer
                                    ]?.defectStatus?.includes(classification) ||
                                    false
                                  }
                                  onChange={() =>
                                    handleCheckboxChange(
                                      defect.code,
                                      buyer,
                                      classification
                                    )
                                  }
                                />
                                <span>
                                  {t(
                                    `defectBuyerStatus.classifications.${classification.toLowerCase()}`,
                                    classification
                                  )}
                                </span>
                              </label>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3 align-top border-r border-gray-300">
                        <select
                          value={
                            defectStatuses[defect.code]?.[buyer]?.isCommon ||
                            "Minor"
                          }
                          onChange={(e) =>
                            handleDropdownChange(
                              defect.code,
                              buyer,
                              e.target.value
                            )
                          }
                          className="block w-full text-xs p-1 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md shadow-sm"
                        >
                          <option value="Minor">
                            {t(
                              "defectBuyerStatus.classifications.minor",
                              "Minor"
                            )}
                          </option>
                          <option value="Major">
                            {t(
                              "defectBuyerStatus.classifications.major",
                              "Major"
                            )}
                          </option>
                          <option value="Critical">
                            {t(
                              "defectBuyerStatus.classifications.critical",
                              "Critical"
                            )}
                          </option>
                        </select>
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {allDefects.length > 0 && allBuyers.length > 0 && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {isSaving
                ? t("defectBuyerStatus.saving", "Saving...")
                : t("defectBuyerStatus.saveChanges", "Save Changes")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DefectBuyerStatus;
