import React, { useState } from 'react';
import { API_BASE_URL } from "../../config";
import ExcelUploader from '../components/inspection/QC_upload_Data/ExcelUpload';
import FinalResultTable from '../components/inspection/QC_upload_Data/FinalResultTable';

const QC2UploadData = () => {
  const [outputData, setOutputData] = useState([]);
  const [defectData, setDefectData] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allResults, setAllResults] = useState([]);

  const handleFinalResult = async () => {
    if (outputData.length === 0 || defectData.length === 0) {
      alert('Please upload both Output and Defect files.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload-qc2-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputData, defectData }),
      });
      const data = await response.json();
      setFinalResult(data);
    } catch (error) {
      console.error('Error fetching final result:', error);
      alert('Failed to process data.');
    } finally {
      setLoading(false);
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

const handleManualSave = async () => {
  if (!finalResult || !Array.isArray(finalResult) || finalResult.length === 0) {
    alert('No data to save.');
    return;
  }
  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/api/manual-save-qc2-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finalDocs: finalResult }),
    });
    const data = await response.json();
    if (data.success) {
      alert(`Saved ${data.count} records successfully!`);
    } else {
      alert(data.error || 'Failed to save.');
    }
  } catch (error) {
    alert('Failed to save data.');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="bg-white dark:bg-gray-900 p-6  shadow-md max-w-7xl mx-auto  transition-colors">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100">QC2 Data Upload</h2>
      <div className="flex flex-col md:flex-row gap-8 justify-between mb-8 min-w-0">
        <div className="flex-1 min-w-0 bg-blue-50 dark:bg-blue-900 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2 text-blue-700 dark:text-blue-200">Output Data</h3>
          <ExcelUploader label="Output" type="output" onDataLoaded={setOutputData} />
        </div>
        <div className="flex-1 min-w-0 bg-green-50 dark:bg-green-900 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2 text-green-700 dark:text-green-200">Defect Data</h3>
          <ExcelUploader label="Defect" type="defect" onDataLoaded={setDefectData} />
        </div>
      </div>
      <div className="text-center mb-6">
          <button
            onClick={handleFinalResult}
            disabled={loading}
            className="bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 dark:hover:bg-blue-900 text-white font-semibold py-2 px-6 rounded transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Final Result'}
          </button>
          <button
            onClick={fetchAllResults}
            disabled={loading}
            className="ml-4 bg-green-600 dark:bg-green-800 hover:bg-green-700 dark:hover:bg-green-900 text-white font-semibold py-2 px-6 rounded transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Show All Saved Results'}
          </button>
        </div>
      {finalResult && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-200">Final Result Preview</h3>
          <div className="overflow-x-auto">
            <FinalResultTable data={finalResult} />
          </div>
          <div className="text-center mt-4">
            <button
              onClick={handleManualSave}
              disabled={loading}
              className="bg-orange-600 dark:bg-orange-800 hover:bg-orange-700 dark:hover:bg-orange-900 text-white font-semibold py-2 px-6 rounded transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save to Database'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QC2UploadData;
