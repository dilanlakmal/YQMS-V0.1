import React, { useState } from 'react';
import ExcelUploader from '../components/inspection/QC_upload_Data/ExcelUpload';
import FinalResultTable from '../components/inspection/QC_upload_Data/FinalResultTable';

const QC2UploadData = () => {
  const [outputData, setOutputData] = useState([]);
  const [defectData, setDefectData] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFinalResult = async () => {
    if (outputData.length === 0 || defectData.length === 0) {
      alert('Please upload both Output and Defect files.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/upload-qc-data', {
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-7xl mx-auto mt-8">
      <h2 className="text-2xl font-semibold mb-6 text-center">QC2 Data Upload</h2>
      <div className="flex flex-col md:flex-row gap-8 justify-between mb-8 min-w-0">
        <div className="flex-1 min-w-0 bg-blue-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2 text-blue-700">Output Data</h3>
          <ExcelUploader label="Output" onDataLoaded={setOutputData} />
        </div>
        <div className="flex-1 min-w-0 bg-green-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2 text-green-700">Defect Data</h3>
          <ExcelUploader label="Defect" onDataLoaded={setDefectData} />
        </div>
      </div>
      <div className="text-center mb-6">
        <button
          onClick={handleFinalResult}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Final Result'}
        </button>
      </div>
      {finalResult && (
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-gray-700">Final Result Preview</h3>
          <div className="overflow-x-auto">
            <FinalResultTable data={finalResult} />
          </div>
        </div>
      )}
    </div>
  );
};

export default QC2UploadData;
