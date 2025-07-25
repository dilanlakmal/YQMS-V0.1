import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { UploadCloud, FileText, X } from "lucide-react";

// This maps the Chinese headers in the Excel file to the English keys we'll use in our app.
const headerMapping = {
  序号: "No",
  工序代码: "Code",
  部件: "Part",
  工序名称: "Process Title",
  工序描述: "Description",
  基础时间: "Base Time",
  标准时间: "Std Time",
  单价: "Price",
  工序类型: "Type",
  机器类型: "Machine Type", // Note: 'Type' appears twice in your list, I've named the second one 'Machine Type'
  每厘米针数: "SPCM",
  辅助工具1: "Tool 1",
  辅助工具2: "Tool 2",
  辅助工具3: "Tool 3",
  辅助工具4: "Tool 4",
  工段名称: "Section Name",
  面料: "Fabric",
  工序等级: "Grade",
  额外系数: "Add Coe.",
  捆扎时间: "Bundle Time",
  小时指标: "Indicator/H",
  状态: "Status",
  工序类别: "Category",
  品质说明: "Quality Description",
  创建人: "Created By",
  创建日期: "Created At",
  分析员: "Update User",
  分析日期: "Update Date",
  审核人: "Approv User",
  审核日期: "Approv Date",
  标签: "Label"
};

function UploadMasterList({ onDataParsed, onPreview, onClear }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const onDrop = useCallback(
    (acceptedFiles) => {
      setError("");
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        if (
          selectedFile.name.endsWith(".xls") ||
          selectedFile.name.endsWith(".xlsx")
        ) {
          setFile(selectedFile);
          parseExcel(selectedFile);
        } else {
          setError("Invalid file type. Please upload an .xls or .xlsx file.");
          setFile(null);
          onClear(); // Clear any previous data
        }
      }
    },
    [onClear]
  );

  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary", cellDates: true });
        const sheetName = "工序词库";
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          setError(`Sheet "${sheetName}" not found in the Excel file.`);
          onClear();
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map Chinese headers to English keys
        const mappedData = jsonData.map((row) => {
          const newRow = {};
          for (const chineseHeader in headerMapping) {
            const englishKey = headerMapping[chineseHeader];
            newRow[englishKey] =
              row[chineseHeader] !== undefined ? row[chineseHeader] : "";
          }
          return newRow;
        });

        onDataParsed(mappedData);
      } catch (err) {
        console.error("Error parsing Excel file:", err);
        setError(
          "An error occurred while parsing the file. Please check the file format."
        );
        onClear();
      }
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      setError("Failed to read the file.");
      onClear();
    };
    reader.readAsBinaryString(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx"
      ]
    }
  });

  const handleRemoveFile = () => {
    setFile(null);
    setError("");
    onClear();
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Upload Master List File
      </h3>

      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${
              isDragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
            }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        {isDragActive ? (
          <p className="text-gray-600 dark:text-gray-300">
            Drop the file here ...
          </p>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">
            Drag & drop an Excel file here, or click to select
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Supported formats: .xls, .xlsx
        </p>
      </div>

      {file && (
        <div className="mt-4 flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-500" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {file.name}
            </span>
          </div>
          <button
            onClick={handleRemoveFile}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onPreview}
          disabled={!file || error}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Preview
        </button>
        <button
          // onClick={onSave} // We will implement this later
          disabled={!file || error}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default UploadMasterList;
