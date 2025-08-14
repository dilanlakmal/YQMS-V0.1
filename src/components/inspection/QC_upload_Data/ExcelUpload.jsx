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
  '打菲组别': 'Line No',
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef();

  const getHeaderTranslations = () => {
    if (type === 'output') return outputHeaderTranslations;
    if (type === 'defect') return defectHeaderTranslations;
    return {};
  };

  const headerTranslations = getHeaderTranslations();
  const headers = tableData.length > 0 ? Object.keys(tableData[0]) : [];

  const handleFile = (file) => {
    setIsUploading(true);
    setFileName(file.name);
    setShowPreview(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        setTableData(json);
        onDataLoaded(json);
      } catch (error) {
        console.error('Error processing file:', error);
        alert('Error processing file. Please check the file format.');
      } finally {
        setIsUploading(false);
      }
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
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onDataLoaded([]);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-2xl">
      <div className="p-6">
        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`relative group border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-300 ${
            fileName 
              ? 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20' 
              : `border-gray-300 dark:border-gray-600 hover:border-${type === 'output' ? 'blue' : 'red'}-400 dark:hover:border-${type === 'output' ? 'blue' : 'red'}-500 hover:bg-${type === 'output' ? 'blue' : 'red'}-50 dark:hover:bg-${type === 'output' ? 'blue' : 'red'}-900/20`
          }`}
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
          
          <div className="text-center">
            {fileName ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-green-700 dark:text-green-300 font-semibold mb-2">File Uploaded Successfully!</p>
                <p className="text-sm text-green-600 dark:text-green-400 mb-4">{fileName}</p>
                <div className="flex items-center justify-center space-x-2 text-sm text-green-600 dark:text-green-400">
                  <span>📊</span>
                  <span className="font-medium">{tableData.length} records loaded</span>
                </div>
              </>
            ) : (
              <>
                <div className={`w-16 h-16 mx-auto mb-4 bg-${type === 'output' ? 'blue' : 'red'}-100 dark:bg-${type === 'output' ? 'blue' : 'red'}-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">📁</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-semibold mb-2">Drop your Excel file here</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or click to browse files</p>
                <div className={`inline-flex items-center px-6 py-3 bg-gradient-to-r from-${type === 'output' ? 'blue' : 'red'}-500 to-${type === 'output' ? 'blue' : 'red'}-600 dark:from-${type === 'output' ? 'blue' : 'red'}-600 dark:to-${type === 'output' ? 'blue' : 'red'}-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300`}>
                  <span className="mr-2">📤</span>
                  Select Excel File
                </div>
              </>
            )}
          </div>
        </div>

        {/* File Actions */}
        {fileName && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="flex items-center px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-300 transform hover:-translate-y-0.5"
              onClick={handleRemoveFile}
              type="button"
            >
              <span className="mr-2">🗑️</span>
              Remove File
            </button>
            
            {tableData.length > 0 && !showPreview && (
              <button
                className={`flex items-center px-4 py-2 bg-gradient-to-r from-${type === 'output' ? 'blue' : 'red'}-500 to-${type === 'output' ? 'blue' : 'red'}-600 dark:from-${type === 'output' ? 'blue' : 'red'}-600 dark:to-${type === 'output' ? 'blue' : 'red'}-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300`}
                onClick={() => setShowPreview(true)}
                type="button"
              >
                <span className="mr-2">👁️</span>
                Preview Data
              </button>
            )}
          </div>
        )}

        {/* Preview Section */}
        {showPreview && tableData.length > 0 && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xl mr-2">📊</span>
                  <div>
                    <h4 className="font-bold text-white">Data Preview</h4>
                    <p className="text-purple-100 text-sm">First {Math.min(PREVIEW_ROW_LIMIT, tableData.length)} of {tableData.length} records</p>
                  </div>
                </div>
                <button
                  className="flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-all duration-300"
                  onClick={handleClosePreview}
                  type="button"
                >
                  <span className="mr-1">✕</span>
                  Close
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="overflow-x-auto max-h-80">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      {headers.map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-600"
                        >
                          <div className="flex items-center">
                            <span className="mr-1">📋</span>
                            {headerTranslations[key] || key}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {tableData.slice(0, PREVIEW_ROW_LIMIT).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        {headers.map((header, i) => (
                          <td
                            key={i}
                            className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap"
                          >
                            <div className="max-w-32 truncate" title={typeof row[header] === 'object' ? JSON.stringify(row[header]) : row[header]}>
                              {typeof row[header] === 'object' ? JSON.stringify(row[header]) : row[header] || '-'}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelUploader;
