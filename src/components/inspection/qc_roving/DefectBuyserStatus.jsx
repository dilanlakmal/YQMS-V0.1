import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import Swal from 'sweetalert2';
import { Loader2, Save, AlertTriangle } from 'lucide-react';

const DefectBuyerStatus = () => {
  const { t } = useTranslation();
 const mapI18nLangToDisplayLang = (lang) => {
    if (lang.startsWith('kh')) return 'kh';
    if (lang.startsWith('ch') || lang.startsWith('zh')) return 'ch';
    return 'en';
  };
  const [currentDisplayLanguage, setCurrentDisplayLanguage] = useState(mapI18nLangToDisplayLang(i18next.language));

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
      // Fetch Defects
      const defectsResponse = await axios.get(`${API_BASE_URL}/api/defects/all-details`);
      const fetchedDefects = defectsResponse.data || [];
      setAllDefects(fetchedDefects);

      // Populate defectStatuses from fetchedDefects' statusByBuyer array
      const initialStatuses = {};
      fetchedDefects.forEach(defect => {
        initialStatuses[defect.code] = {}; 
        (defect.statusByBuyer || []).forEach(statusEntry => {
          if (statusEntry.buyerName) {
            if (!initialStatuses[defect.code][statusEntry.buyerName]) {
              initialStatuses[defect.code][statusEntry.buyerName] = { critical: false, minor: false };
            }
            initialStatuses[defect.code][statusEntry.buyerName].critical = statusEntry.isCritical === "Yes";
            initialStatuses[defect.code][statusEntry.buyerName].minor = statusEntry.isMinor === "Yes";
          }
        });
      });
      setDefectStatuses(initialStatuses);
    } catch (err) {
      console.error("Error fetching defects:", err);
      setError(t('defectBuyerStatus.errors.fetchDefects', "Failed to load defects."));
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
      setError(prev => prev ? `${prev}\n${t('defectBuyerStatus.errors.fetchBuyers', "Failed to load buyers.")}` : t('defectBuyerStatus.errors.fetchBuyers', "Failed to load buyers."));
      setAllBuyers([]);
    } finally {
      setLoadingBuyers(false);
    }
      setLoadingStatuses(false);
    }
 , [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Effect to update currentDisplayLanguage when i18next.language changes
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentDisplayLanguage(mapI18nLangToDisplayLang(lng));
    };
    i18next.on('languageChanged', handleLanguageChanged);
    // Initial sync
    setCurrentDisplayLanguage(mapI18nLangToDisplayLang(i18next.language));
    return () => {
      i18next.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
     i18next.changeLanguage(newLang);
  };

  const getDefectDisplayName = (defect) => {
    return defect[`name_${currentDisplayLanguage}`] || defect.name_en;
  };

  const handleCheckboxChange = (defectCode, buyerName, statusType) => {
    setDefectStatuses(prevStatuses => {
      const newStatuses = JSON.parse(JSON.stringify(prevStatuses));

      if (!newStatuses[defectCode]) {
        newStatuses[defectCode] = {};
      }
      if (!newStatuses[defectCode][buyerName]) {
        newStatuses[defectCode][buyerName] = { critical: false, minor: false };
      }

       const currentlyChecked = newStatuses[defectCode][buyerName][statusType];

      if (!currentlyChecked) { 
        newStatuses[defectCode][buyerName][statusType] = true; 
        if (statusType === 'critical') {
          newStatuses[defectCode][buyerName]['minor'] = false; 
        } else if (statusType === 'minor') {
          newStatuses[defectCode][buyerName]['critical'] = false; 
        }
      } else { // If user is trying to uncheck this box
        newStatuses[defectCode][buyerName][statusType] = false; 
      }
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
          isCritical: status.critical ? "Yes" : "No",
          isMinor: status.minor ? "Yes" : "No",
        });
      }
    }

    try {
      await axios.post(`${API_BASE_URL}/api/sewing-defects/buyer-statuses`, payload);
      Swal.fire({
        icon: 'success',
        title: t('defectBuyerStatus.success.title', 'Success'),
        text: t('defectBuyerStatus.success.message', 'Defect statuses saved successfully!'),
      });
    } catch (err) {
      console.error("Error saving defect statuses:", err);
      setError(t('defectBuyerStatus.errors.saveStatuses', "Failed to save defect statuses."));
      Swal.fire({
        icon: 'error',
        title: t('defectBuyerStatus.errors.saveFailedTitle', 'Save Failed'),
        text: err.response?.data?.message || t('defectBuyerStatus.errors.saveStatuses', "Failed to save defect statuses."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingDefects || loadingBuyers || loadingStatuses) {
    return (
      <div className="flex justify-center items-center h-screen p-6">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="ml-4 text-lg">{t('defectBuyerStatus.loading', 'Loading data...')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-lg p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
          {t('defectBuyerStatus.title', 'Manage Defect Statuses by Buyser')}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            <pre className="whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" rowSpan="2" className="px-4 py-3 text-left text-m font-medium text-gray-600 uppercase tracking-wider border-r border-gray-300 align-middle">
                  {t('defectBuyerStatus.defectName', 'Defect Name')}
                </th>
               <th scope="col" colSpan="2" className="px-4 py-3 text-center text-m font-medium text-gray-600 uppercase tracking-wider">
                  {t('defectBuyerStatus.buyerStatuses', 'Buyer Statuses')}
                </th>
                 </tr>
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider border-r border-t border-gray-300">
                  {t('defectBuyerStatus.critical', 'Critical')}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider border-t">
                  {t('defectBuyerStatus.minor', 'Minor')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allDefects.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-4 py-10 text-center text-gray-500">
                    {t('defectBuyerStatus.noDefectsFound', 'No defects found.')}
                  </td>
                </tr>
              )}
              {allBuyers.length === 0 && allDefects.length > 0 && (
                 <tr>
                  <td colSpan="3" className="px-4 py-10 text-center text-gray-500">
                    {t('defectBuyerStatus.noBuyersFound', 'No buyers found. Please add buyers to the system.')}
                  </td>
                </tr>
              )}
              {allDefects.map((defect) => (
                <tr key={defect.code} className="hover:bg-gray-50">
                  <td className="px-4 py-3 align-top border-r border-gray-300 md:w-1/3">
                    <div className="text-sm font-medium text-gray-900">{getDefectDisplayName(defect)}</div>
                    <div className="text-xs text-gray-500">({defect.code})</div>
                  </td>
                  <td className="px-4 py-3 align-top border-r border-gray-300 md:w-1/3"> 
                    {allBuyers.length > 0 ? (
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {allBuyers.map((buyer) => (
                          <label key={`${defect.code}-${buyer}-critical`} className="flex items-center space-x-1 text-sm">
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                              checked={defectStatuses[defect.code]?.[buyer]?.critical || false}
                              onChange={() => handleCheckboxChange(defect.code, buyer, 'critical')}
                            />
                            <span>{buyer}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">{t('defectBuyerStatus.noBuyersToAssign', 'No buyers available to assign status.')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top md:w-1/3"> {/* Minor Statuses Cell */}
                    {allBuyers.length > 0 ? (
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {allBuyers.map((buyer) => (
                          <label key={`${defect.code}-${buyer}-minor`} className="flex items-center space-x-1 text-sm">
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400"
                              checked={defectStatuses[defect.code]?.[buyer]?.minor || false}
                              onChange={() => handleCheckboxChange(defect.code, buyer, 'minor')}
                            />
                            <span>{buyer}</span>
                          </label>
                        ))}
                        </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">{t('defectBuyerStatus.noBuyersToAssign', 'No buyers available to assign status.')}</span>
                    )}
                  </td>
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
              {isSaving ? t('defectBuyerStatus.saving', 'Saving...') : t('defectBuyerStatus.saveChanges', 'Save Changes')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DefectBuyerStatus;