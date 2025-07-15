import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import Swal from "sweetalert2";
import { Loader2, Save, AlertTriangle, Trash2 } from "lucide-react";
import QADefectAdd from "./QADefectAdd";

const QADefectsManager = () => {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [defectsResponse, buyersResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/qa-defects/all-details`),
        axios.get(`${API_BASE_URL}/api/buyers`)
      ]);

      const fetchedDefects = defectsResponse.data || [];
      const fetchedBuyers = buyersResponse.data || []; // Store fetched buyers in a local variable

      setAllDefects(fetchedDefects);
      setAllBuyers(fetchedBuyers);

      const initialStatuses = {};
      fetchedDefects.forEach((defect) => {
        initialStatuses[defect.code] = {};
        // *** FIX IS HERE: Loop over the newly fetched data, not the old state variable ***
        fetchedBuyers.forEach((buyerName) => {
          const statusEntry = (defect.statusByBuyer || []).find(
            (s) => s.buyerName === buyerName
          );
          initialStatuses[defect.code][buyerName] = {
            defectStatus: statusEntry ? statusEntry.defectStatus || [] : [],
            isCommon: statusEntry ? statusEntry.isCommon || "Major" : "Major"
          };
        });
      });
      setDefectStatuses(initialStatuses);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        t(
          "qaDefectManager.errors.fetch",
          "Failed to load data. Please refresh the page."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDefectAdded = () => {
    fetchData();
  };

  useEffect(() => {
    const handleLanguageChanged = (lng) =>
      setCurrentDisplayLanguage(mapI18nLangToDisplayLang(lng));
    i18next.on("languageChanged", handleLanguageChanged);
    return () => i18next.off("languageChanged", handleLanguageChanged);
  }, []);

  const handleDeleteDefect = async (defectCode) => {
    Swal.fire({
      title: t("qaDefectManager.confirmDelete.title"),
      text: t("qaDefectManager.confirmDelete.text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("qaDefectManager.confirmDelete.confirmButton"),
      cancelButtonText: t("qaDefectManager.confirmDelete.cancelButton")
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsSaving(true);
        try {
          await axios.delete(`${API_BASE_URL}/api/qa-defects/${defectCode}`);
          await fetchData();
          Swal.fire(
            t("qaDefectManager.deleted.title"),
            t("qaDefectManager.deleted.text"),
            "success"
          );
        } catch (err) {
          Swal.fire(
            t("qaDefectManager.errors.deleteFailedTitle"),
            err.response?.data?.message ||
              t("qaDefectManager.errors.deleteDefect"),
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
    setDefectStatuses((prev) => {
      const newStatuses = JSON.parse(JSON.stringify(prev));
      const current = newStatuses[defectCode][buyerName].defectStatus;
      const isChecked = current.includes(statusType);
      newStatuses[defectCode][buyerName].defectStatus = isChecked
        ? current.filter((c) => c !== statusType)
        : [...current, statusType];
      return newStatuses;
    });
  };

  const handleDropdownChange = (defectCode, buyerName, newCommon) => {
    setDefectStatuses((prev) => {
      const newStatuses = JSON.parse(JSON.stringify(prev));
      newStatuses[defectCode][buyerName].isCommon = newCommon;
      return newStatuses;
    });
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    const payload = [];
    for (const defectCode in defectStatuses) {
      for (const buyerName in defectStatuses[defectCode]) {
        payload.push({
          defectCode,
          buyerName,
          ...defectStatuses[defectCode][buyerName]
        });
      }
    }

    try {
      await axios.post(
        `${API_BASE_URL}/api/qa-defects/buyer-statuses`,
        payload
      );
      Swal.fire("Success", "QA Defect statuses saved successfully!", "success");
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to save statuses",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-8xl mx-auto bg-white shadow-xl rounded-lg p-6">
        <h1 className="text-lg md:text-xl font-bold text-gray-800 mb-2 text-center">
          {t("qaDefectManager.title", "Manage QA Defects by Buyer")}
        </h1>

        <QADefectAdd onDefectAdded={handleDefectAdded} />

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            <span>{error}</span>
          </div>
        )}
        <div className="overflow-auto max-h-[70vh]">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr className="text-xs font-medium text-gray-600 uppercase tracking-wider text-center">
                <th rowSpan="2" className="px-4 py-3 border border-gray-300">
                  {t("qaDefectManager.defectName", "Defect Name")}
                </th>
                <th rowSpan="2" className="px-2 py-3 border border-gray-300">
                  {t("qaDefectManager.actions", "Actions")}
                </th>
                {allBuyers.map((buyer) => (
                  <th
                    key={buyer}
                    colSpan="2"
                    className="px-4 py-3 border border-gray-300"
                  >
                    {buyer}
                  </th>
                ))}
              </tr>
              <tr className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                {allBuyers.map((buyer) => (
                  <React.Fragment key={`${buyer}-sub`}>
                    <th className="px-2 py-2 text-left border border-gray-300">
                      {t("qaDefectManager.classifications", "Status")}
                    </th>
                    <th className="px-2 py-2 text-left border border-gray-300">
                      {t("qaDefectManager.commonStatus", "Common")}
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allDefects.map((defect) => (
                <tr key={defect.code} className="hover:bg-gray-50">
                  <td className="px-4 py-3 align-top border border-gray-300 md:w-auto whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getDefectDisplayName(defect)}
                    </div>
                    <div className="text-xs text-gray-500">
                      ({defect.code}) [{defect.defectLetter}]
                    </div>
                  </td>
                  <td className="px-2 py-3 align-top border-r border-gray-300 text-center">
                    <button
                      onClick={() => handleDeleteDefect(defect.code)}
                      className="text-red-600 hover:text-red-800"
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
                                  className="form-checkbox h-4 w-4"
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
                                    `classifications.${classification.toLowerCase()}`,
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
                            "Major"
                          }
                          onChange={(e) =>
                            handleDropdownChange(
                              defect.code,
                              buyer,
                              e.target.value
                            )
                          }
                          className="block w-full text-xs p-1 border-gray-300 rounded-md"
                        >
                          <option value="Minor">
                            {t("classifications.minor", "Minor")}
                          </option>
                          <option value="Major">
                            {t("classifications.major", "Major")}
                          </option>
                          <option value="Critical">
                            {t("classifications.critical", "Critical")}
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
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSaving || isLoading}
            className="flex items-center justify-center px-6 py-2 border text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {isSaving
              ? t("qaDefectManager.saving", "Saving...")
              : t("qaDefectManager.saveChanges", "Save Changes")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QADefectsManager;
