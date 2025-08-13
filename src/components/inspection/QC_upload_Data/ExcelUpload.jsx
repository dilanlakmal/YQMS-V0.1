import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const outputHeaderTranslations = {
  '序号': 'No.',
  '姓名': 'Name',
  '工号': 'Employee ID',
  '组名': 'Group Name',
  '单号': 'Order No.',
  '款号': 'MoNo.',
  '颜色': 'Color',
  '尺码': 'Size',
  '工序号': 'Process No.',
  '工序名': 'Process Name',
  '数量': 'Quantity',
  '日期': 'Date',
  '打菲组别': 'Batch Group',
  '打菲日期': 'Batch Date',
};

const defectHeaderTranslations = {
  '序号': 'No.',
  '日期': 'Date',
  '组别': 'Group',
  '工号': 'Employee ID',
  '姓名': 'Name',
  '款号': 'MoNo.',
  '颜色': 'Color',
  '尺码': 'Size',
  '数量': 'Quantity',
  '疵点名称': 'Defect Name',
};

const PREVIEW_ROW_LIMIT = 100;

const ExcelUploader = ({ label, onDataLoaded, type }) => {
  const [fileName, setFileName] = useState('');
  const [tableData, setTableData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef();

  const getHeaderTranslations = () => {
    if (type === 'output') return outputHeaderTranslations;
    if (type === 'defect') return defectHeaderTranslations;
    return {};
  };

  const headerTranslations = getHeaderTranslations();
  const headers = tableData.length > 0 ? Object.keys(tableData[0]) : [];

  const handleFile = (file) => {
    setFileName(file.name);
    setShowPreview(false);
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
    onDataLoaded([]);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 mb-4 border border-gray-200 dark:border-gray-700 w-full transition-colors">
      <h3 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-300">{label} Upload</h3>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-6 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 transition w-full"
        onClick={handleClick}
        tabIndex={0}
        role="button"
        aria-label={`Upload ${label} Excel file`}
      >
        <input
          type="file"
          onChange={handleChange}
          accept=".xlsx, .xls"
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        <p className="text-gray-600 dark:text-gray-300 mb-2">Drag and drop an Excel file here, or click to select</p>
        <span className="inline-block bg-blue-100 dark:bg-blue-900 dark:text-blue-200 text-blue-700 px-3 py-1 rounded text-sm font-medium">
          Select File
        </span>
      </div>

      {fileName && (
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
          <p className="text-sm text-gray-700 dark:text-gray-200">
            <span className="font-medium">File:</span> {fileName}
          </p>
          <button
            className="ml-0 sm:ml-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-2 py-1 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-800 transition"
            onClick={handleRemoveFile}
            type="button"
          >
            Remove File
          </button>
        </div>
      )}

      {tableData.length > 0 && !showPreview && (
        <button
          className="mt-4 bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 dark:hover:bg-blue-900 text-white font-semibold py-1 px-4 rounded transition"
          onClick={() => setShowPreview(true)}
          type="button"
        >
          Preview
        </button>
      )}

      {showPreview && tableData.length > 0 && (
        <div className="max-h-96 overflow-y-auto mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-700 dark:text-gray-200">Uploaded Data</h4>
            <button
              className="bg-blue-200 dark:bg-blue-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs font-medium hover:bg-gray-300 dark:hover:bg-green-600 transition"
              onClick={handleClosePreview}
              type="button"
            >
              Close Preview
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Showing first {PREVIEW_ROW_LIMIT} rows of {tableData.length}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  {headers.map((key) => (
                    <th
                      key={key}
                      className="px-2 py-1 border border-gray-200 dark:border-gray-700 text-left font-medium text-gray-600 dark:text-gray-200"
                    >
                      {headerTranslations[key] || key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.slice(0, PREVIEW_ROW_LIMIT).map((row, index) => (
                  <tr key={index} className="even:bg-gray-50 dark:even:bg-gray-800">
                    {headers.map((header, i) => (
                      <td
                        key={i}
                        className="px-2 py-1 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                      >
                        {typeof row[header] === 'object' ? JSON.stringify(row[header]) : row[header]}
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
