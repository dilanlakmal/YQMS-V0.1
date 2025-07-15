import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Loader,
  AlertTriangle,
  Save,
  CheckCircle,
  XCircle
} from "lucide-react";
import { read, utils } from "xlsx";
import { cleanWashingSpecData } from "../components/inspection/qc2_washing/WashingSpecDataCleaning";
import WashingSpecsDataPreview from "../components/inspection/qc2_washing/WashingSpecsDataPreview";
import { API_BASE_URL } from "../../config";

const UploadWashingSpecs = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [moNo, setMoNo] = useState("");
  const [washingSpecsData, setWashingSpecsData] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // New state for save status
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ message: "", type: "" }); // type: 'success' or 'error'

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setWashingSpecsData([]); // Reset preview on new file selection
      setError("");
      setSaveStatus({ message: "", type: "" }); // Reset save status on new file

      // Extract MO No from filename (e.g., "GPAR11234-K1.xlsx" -> "GPAR11234")
      const extractedMo = file.name.replace(/\.[^/.]+$/, ""); // Removes extension
      setMoNo(extractedMo.trim());
    }
    //   const extractedMo = file.name.split("-")[0];
    //   setMoNo(extractedMo.trim());
    // }
  };

  const handlePreview = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select an Excel file first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSaveStatus({ message: "", type: "" });
    setWashingSpecsData([]);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target.result;
          const workbook = read(data, { type: "array" });
          const processedData = [];

          workbook.SheetNames.forEach((sheetName) => {
            // Process only sheets that look like K1, K2, etc.
            if (sheetName.match(/^K([a-z]+|\d+)$/i)) {
              //if (sheetName.match(/^K\d+$/i))
              const worksheet = workbook.Sheets[sheetName];
              const json_data = utils.sheet_to_json(worksheet, {
                header: 1,
                defval: null, // Use null for empty cells
                raw: false
              });

              const cleanedData = cleanWashingSpecData(json_data, sheetName);
              processedData.push(cleanedData);
            }
          });

          if (processedData.length === 0) {
            throw new Error(
              "No valid sheets (e.g., K1, K2) found in the Excel file."
            );
          }

          setWashingSpecsData(processedData);
        } catch (e) {
          console.error("Parsing Error:", e);
          setError(
            e.message ||
              "Failed to parse the Excel file. Please check the format."
          );
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = (err) => {
        console.error("FileReader Error:", err);
        setError("Failed to read the file.");
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (e) {
      console.error("General Error:", e);
      setError(e.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  }, [selectedFile]);

  // New function to handle saving the data
  const handleSave = async () => {
    if (washingSpecsData.length === 0) {
      setError("No data to save. Please preview a file first.");
      return;
    }

    setIsSaving(true);
    setSaveStatus({ message: "", type: "" });
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/washing-specs/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ moNo, washingSpecsData })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save data.");
      }

      setSaveStatus({ message: result.message, type: "success" });
    } catch (err) {
      console.error("Save Error:", err);
      setSaveStatus({ message: err.message, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-md text-gray-600">After and Before Washing Specs</p>
      </div>

      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label
            htmlFor="file-upload"
            className="flex-1 w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <Upload className="w-6 h-6 text-gray-500 mr-3" />
            <span className="text-gray-700">
              {selectedFile ? selectedFile.name : "Select an Excel file"}
            </span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
            />
          </label>
          <button
            onClick={handlePreview}
            disabled={!selectedFile || isLoading || isSaving}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" /> Processing...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" /> Preview
              </>
            )}
          </button>
          {/* --- SAVE BUTTON --- */}
          <button
            onClick={handleSave}
            disabled={washingSpecsData.length === 0 || isLoading || isSaving}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" /> Save
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="mt-4 flex items-center p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
            <AlertTriangle className="w-5 h-5 mr-2" /> <span>{error}</span>
          </div>
        )}
        {saveStatus.message && (
          <div
            className={`mt-4 flex items-center p-3 rounded-md border ${
              saveStatus.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {saveStatus.type === "success" ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <XCircle className="w-5 h-5 mr-2" />
            )}
            <span>{saveStatus.message}</span>
          </div>
        )}
      </div>

      <div className="mt-8">
        {washingSpecsData.map((specData) => (
          <WashingSpecsDataPreview
            key={specData.sheetName}
            moNo={moNo}
            specData={specData}
          />
        ))}
      </div>
    </div>
  );
};

export default UploadWashingSpecs;
