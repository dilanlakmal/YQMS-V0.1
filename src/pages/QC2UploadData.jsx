import React, { useState } from 'react';
import { API_BASE_URL } from "../../config";
import ExcelUploader from '../components/inspection/QC_upload_Data/ExcelUpload';
import FinalResultTable from '../components/inspection/QC_upload_Data/FinalResultTable';
import Swal from 'sweetalert2';

const QC2UploadData = () => {
  const [outputData, setOutputData] = useState([]);
  const [defectData, setDefectData] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingProcess, setLoadingProcess] = useState(false);
  const [loadingFetch, setLoadingFetch] = useState(false);

  const [loading, setLoading] = useState(false);
  const [allResults, setAllResults] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({ output: false, defect: false });

  const handleFinalResult = async (skipLoading, skipSetState) => {
    if (outputData.length === 0 || defectData.length === 0) {
      alert('Please upload both Output and Defect files.');
      return null;
    }
    if (!skipLoading) setLoadingProcess(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload-qc2-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputData, defectData }),
      });
      const data = await response.json();
      if (!skipSetState) setFinalResult(data); 
      return data;
    } catch (error) {
      console.error('Error fetching final result:', error);
      alert('Failed to process data.');
      return null;
    } finally {
      if (!skipLoading) setLoadingProcess(false);
    }
  };


  const fetchAllResults = async () => {
  setLoading(true); 
  try {
    const response = await fetch(`${API_BASE_URL}/api/fetch-qc2-data`);
    const data = await response.json();
    if (Array.isArray(data)) {
      setFinalResult(data);
    } else {
      setFinalResult([]);
      alert(data?.error || "Unexpected server response.");
    }
  } catch (error) {
    alert('Failed to fetch saved QC2 data.');
  } finally {
    setLoading(false);
  }
};

// In your QC2UploadData component
  const handleManualSave = async (resultToSave, skipLoading) => {
      const dataToSave = resultToSave || finalResult;
      if (!dataToSave || !Array.isArray(dataToSave) || dataToSave.length === 0) {
        alert('No data to save.');
        return;
      }
      if (!skipLoading) setLoadingSave(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/manual-save-qc2-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ finalDocs: dataToSave }),
        });
        const data = await response.json();
        if (data.success) {
          // SweetAlert2: show success and auto-close after 2 seconds
          Swal.fire({
            icon: 'success',
            title: 'Saved!',
            text: `Saved ${data.count} records successfully!`,
            showConfirmButton: false,
            timer: 2000
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.error || 'Failed to save.',
            showConfirmButton: false,
            timer: 2000
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to save data.',
          showConfirmButton: false,
          timer: 2000
        });
      } finally {
        if (!skipLoading) setLoadingSave(false);
      }
    };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 transition-all duration-300">
      <div className="max-w-8xl mx-auto p-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-full mb-4 shadow-lg">
            <span className="text-2xl text-white">📊</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
            QC2 Data Upload
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Upload and manage your quality control inspection data</p>
        </div>

        {/* Upload Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="group">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-xl">📦</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Output Data</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Upload production output information</p>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50">
                <ExcelUploader label="Output" type="output" onDataLoaded={setOutputData} />
              </div>
              {outputData.length > 0 && (
                <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-sm">
                  <span className="mr-2">✅</span>
                  <span className="font-medium">{outputData.length} records loaded</span>
                </div>
              )}
            </div>
          </div>

          <div className="group">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Defect Data</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Upload quality defect information</p>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-700/50">
                <ExcelUploader label="Defect" type="defect" onDataLoaded={setDefectData} />
              </div>
              {defectData.length > 0 && (
                <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-sm">
                  <span className="mr-2">✅</span>
                  <span className="font-medium">{defectData.length} records loaded</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {/* Save Button */}
         <button
            onClick={async () => {
              if (outputData.length === 0 || defectData.length === 0) {
                alert('Please upload both Output and Defect files.');
                return;
              }
              setLoadingSave(true);
              let result = finalResult;
              if (!result || !Array.isArray(result) || result.length === 0) {
                result = await handleFinalResult(true, true); 
              }
              if (result && Array.isArray(result) && result.length > 0) {
                await handleManualSave(result, true);
              }
              setLoadingSave(false);
            }}
            disabled={loadingSave || loadingProcess || loadingFetch || outputData.length === 0 || defectData.length === 0}
            className="group relative px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 hover:from-orange-700 hover:to-red-700 dark:hover:from-orange-600 dark:hover:to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center">
              {loadingSave ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Saving...
                </>
              ) : (
                <>
                  <span className="mr-2">💾</span>
                  Save
                </>
              )}
            </span>
          </button>

          {/* Final Result Button */}
          <button
            onClick={async () => {
              if (outputData.length === 0 || defectData.length === 0) {
                alert('Please upload both Output and Defect files.');
                return;
              }
              setLoadingProcess(true);
              await handleFinalResult();
              setLoadingProcess(false);
            }}
            disabled={loadingProcess || loadingSave || loadingFetch || outputData.length === 0 || defectData.length === 0}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="flex items-center">
              {loadingProcess ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Processing...
                </>
              ) : (
                <>
                  <span className="mr-2">🔄</span>
                  Final Result
                </>
              )}
            </span>
          </button>

          {/* Submitted Data Button */}
          {/* <button
            onClick={async () => {
              setLoadingFetch(true);
              await fetchAllResults();
              setLoadingFetch(false);
            }}
            disabled={loadingFetch || loadingSave || loadingProcess}
            className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center">
              {loadingFetch ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Loading...
                </>
              ) : (
                <>
                  <span className="mr-2">📋</span>
                  Submitted Data
                </>
              )}
            </span>
          </button> */}
        </div>

        {/* Results Section */}
        {finalResult && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Final Result Preview</h3>
                    <p className="text-purple-100 text-sm">Review your processed QC data</p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                  <span className="text-white text-sm font-medium">
                    {Array.isArray(finalResult) ? finalResult.length : 0} Records
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <FinalResultTable data={finalResult} />
              </div>
              
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QC2UploadData;
