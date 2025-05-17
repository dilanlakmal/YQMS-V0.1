import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config'; // Adjust path as needed
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import Swal from 'sweetalert2';
import { Loader2, Save, AlertTriangle } from 'lucide-react';

const DefectBuyerStatus = () => {
  const { t } = useTranslation();
  const [currentDisplayLanguage, setCurrentDisplayLanguage] = useState(i18next.language.startsWith('en') ? 'en' : i18next.language);

  const [allDefects, setAllDefects] = useState([]);
  const [allBuyers, setAllBuyers] = useState([]);
  const [defectStatuses, setDefectStatuses] = useState({}); // { defectCode: { buyerName: { critical: bool, minor: bool }}}

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
      setAllDefects(defectsResponse.data || []);
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

    try {
      // Fetch Existing Statuses
      const statusesResponse = await axios.get(`${API_BASE_URL}/api/defect-buyer-statuses`);
      const statusesData = statusesResponse.data || [];
      const formattedStatuses = {};
      statusesData.forEach(status => {
        if (!formattedStatuses[status.defectCode]) {
          formattedStatuses[status.defectCode] = {};
        }
        if (!formattedStatuses[status.defectCode][status.buyerName]) {
          formattedStatuses[status.defectCode][status.buyerName] = { critical: false, minor: false };
        }
        formattedStatuses[status.defectCode][status.buyerName].critical = status.isCritical || false;
        formattedStatuses[status.defectCode][status.buyerName].minor = status.isMinor || false;
      });
      setDefectStatuses(formattedStatuses);
    } catch (err) {
      console.error("Error fetching defect statuses:", err);
      setError(prev => prev ? `${prev}\n${t('defectBuyerStatus.errors.fetchStatuses', "Failed to load defect statuses.")}` : t('defectBuyerStatus.errors.fetchStatuses', "Failed to load defect statuses."));
      // Keep existing defectStatuses or set to empty if it's the first load
    } finally {
      setLoadingStatuses(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setCurrentDisplayLanguage(newLang);
    // If you also want to change the i18next language:
    // i18next.changeLanguage(newLang);
  };

  const getDefectDisplayName = (defect) => {
    return defect[`name_${currentDisplayLanguage}`] || defect.name_en; // Fallback to English
  };

  const handleCheckboxChange = (defectCode, buyerName, statusType) => {
    setDefectStatuses(prevStatuses => {
      const newStatuses = JSON.parse(JSON.stringify(prevStatuses)); // Deep copy

      if (!newStatuses[defectCode]) {
        newStatuses[defectCode] = {};
      }
      if (!newStatuses[defectCode][buyerName]) {
        newStatuses[defectCode][buyerName] = { critical: false, minor: false };
      }

      newStatuses[defectCode][buyerName][statusType] = !newStatuses[defectCode][buyerName][statusType];
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
        // Only send if either critical or minor is true, or if you want to explicitly send false values
        // if (status.critical || status.minor) {
          payload.push({
            defectCode,
            buyerName,
            isCritical: status.critical,
            isMinor: status.minor,
          });
        // }
      }
    }

    try {
      await axios.post(`${API_BASE_URL}/api/defect-buyer-statuses`, payload);
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
          {t('defectBuyerStatus.title', 'Manage Defect Buyer Statuses')}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            <pre className="whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        <div className="mb-6 flex justify-end">
          <div className="w-full sm:w-auto">
            <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-1">
              {t('defectBuyerStatus.displayLanguage', 'Display Language for Defects')}
            </label>
            <select
              id="language-select"
              value={currentDisplayLanguage}
              onChange={handleLanguageChange}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="en">{t('languages.en', 'English')}</option>
              <option value="kh">{t('languages.kh', 'Khmer')}</option>
              <option value="ch">{t('languages.ch', 'Chinese')}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-gray-300">
                  {t('defectBuyerStatus.defectName', 'Defect Name')}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  {t('defectBuyerStatus.buyerStatuses', 'Buyer Statuses')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allDefects.length === 0 && (
                <tr>
                  <td colSpan="2" className="px-4 py-10 text-center text-gray-500">
                    {t('defectBuyerStatus.noDefectsFound', 'No defects found.')}
                  </td>
                </tr>
              )}
              {allBuyers.length === 0 && allDefects.length > 0 && (
                 <tr>
                  <td colSpan="2" className="px-4 py-10 text-center text-gray-500">
                    {t('defectBuyerStatus.noBuyersFound', 'No buyers found. Please add buyers to the system.')}
                  </td>
                </tr>
              )}
              {allDefects.map((defect) => (
                <tr key={defect.code} className="hover:bg-gray-50">
                  <td className="px-4 py-3 align-top border-r border-gray-300 w-1/3">
                    <div className="text-sm font-medium text-gray-900">{getDefectDisplayName(defect)}</div>
                    <div className="text-xs text-gray-500">({defect.code})</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {allBuyers.length > 0 ? (
                      <>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">{t('defectBuyerStatus.critical', 'Critical')}:</p>
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
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-semibold text-gray-700 mb-1">{t('defectBuyerStatus.minor', 'Minor')}:</p>
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
                        </div>
                      </>
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