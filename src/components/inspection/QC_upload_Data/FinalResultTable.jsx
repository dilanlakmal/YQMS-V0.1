import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const ExcelUploader = ({ label, onDataLoaded }) => {
  const [fileName, setFileName] = useState('');
  const [tableData, setTableData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef();

  const handleFile = (file) => {
    setFileName(file.name);
    setShowPreview(false); // Hide preview on new upload
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setTableData(json);
      onDataLoaded(json);
    };
    reader.readAsBinaryString(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleRemoveFile = () => {
    setFileName('');
    setTableData([]);
    setShowPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onDataLoaded([]); // Notify parent that data is cleared
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 border border-gray-200 w-full">
      <h3 className="text-lg font-semibold mb-2 text-blue-700">{label} Upload</h3>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-6 cursor-pointer hover:bg-blue-50 transition w-full"
        onClick={handleClick}
      >
        <input
          type="file"
          onChange={handleChange}
          accept=".xlsx, .xls"
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        <p className="text-gray-600 mb-2">Drag and drop an Excel file here, or click to select</p>
        <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-medium">
          Select File
        </span>
      </div>
      {fileName && (
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
          <p className="text-sm text-gray-700">
            <span className="font-medium">File:</span> {fileName}
          </p>
          <button
            className="ml-0 sm:ml-2 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium hover:bg-red-200 transition"
            onClick={handleRemoveFile}
            type="button"
          >
            Remove File
          </button>
        </div>
      )}
      {tableData.length > 0 && !showPreview && (
        <button
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-4 rounded transition"
          onClick={() => setShowPreview(true)}
          type="button"
        >
          Preview
        </button>
      )}
      {showPreview && tableData.length > 0 && (
        <div className="max-h-64 overflow-y-auto mt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-700">Uploaded Data</h4>
            <button
              className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium hover:bg-gray-300 transition"
              onClick={handleClosePreview}
              type="button"
            >
              Close Preview
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(tableData[0]).map((key) => (
                    <th key={key} className="px-2 py-1 border border-gray-200 text-left font-medium text-gray-600">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index} className="even:bg-gray-50">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="px-2 py-1 border border-gray-200">
                        {typeof value === 'object' ? JSON.stringify(value) : value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelUploader;
