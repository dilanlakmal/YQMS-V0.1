import { useState } from "react";
import { API_BASE_URL } from "../../config";
import ExcelUploader from "../components/inspection/qc2_washing/QC2_Washing_Upload/ExcelUpload";
// import FinalResultTable from "../components/inspection/QC2_Washing_Upload/FinalResultTable";
// import Swal from "sweetalert2";

const QC2WashingUpload = () => {
  const [outputData, setOutputData] = useState([]);
  const [defectData, setDefectData] = useState([]);
  const [washingData, setWashingData] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingProcess, setLoadingProcess] = useState(false);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allResults, setAllResults] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({
    output: false,
    defect: false,
    washing: false
  });
  const [washingQtyData, setWashingQtyData] = useState([]);
  const [currentDataType, setCurrentDataType] = useState("");

  // Handle data from the uploader
  const handleDataLoaded = ({ data, type, originalData }) => {
    setCurrentDataType(type);

    console.log(`Data loaded - Type: ${type}, Records: ${data.length}`);

    if (type === "output") {
      setOutputData(data);
      setUploadProgress((prev) => ({ ...prev, output: true }));
    } else if (type === "defect") {
      setDefectData(data);
      setUploadProgress((prev) => ({ ...prev, defect: true }));
    } else if (type === "washing") {
      setWashingData(data);
      setUploadProgress((prev) => ({ ...prev, washing: true }));

      // Process washing data for saving
      const processedWashingData = processWashingDataForSave(data);
      setWashingQtyData(processedWashingData);
    } else {
      // For unknown type, try to detect or ask user
      console.log("Unknown data type uploaded:", data);
    }
  };

  // Process washing data for the qc_real_washing_qty collection
  const processWashingDataForSave = (data) => {
    const groupedData = data.reduce((acc, row) => {
      const inspectionDate =
        row["日期"] || row["Date"] || new Date().toISOString().split("T")[0];
      const styleNo = row["款号"] || row["Style No."] || "";
      const color = row["颜色"] || row["Color"] || "";
      const quantity = parseInt(row["数量"] || row["Quantity"] || 0);

      // Get employee ID from the data instead of hardcoding
      const employeeId = row["工号"] || row["Employee ID"] || "";

      // Use employee ID as QC_Id
      const qcId = employeeId;

      const key = `${inspectionDate}_${qcId}_${styleNo}_${color}`;

      if (!acc[key]) {
        acc[key] = {
          inspectionDate,
          QC_Id: qcId, // Now using actual employee ID
          Style_No: styleNo,
          color,
          washQty: 0
        };
      }

      acc[key].washQty += quantity;
      return acc;
    }, {});

    return Object.values(groupedData);
  };

  // Save washing data to qc_real_washing_qty collection
  const saveWashingData = async (washingDataToSave) => {
    if (!washingDataToSave || washingDataToSave.length === 0) {
      return { success: true, count: 0 };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing-qty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: washingDataToSave })
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error saving washing data:", error);
      throw error;
    }
  };

  const handleFinalResult = async (skipLoading, skipSetState) => {
    // Check if we have the required data based on what's been uploaded
    const hasRequiredData =
      (outputData.length > 0 && defectData.length > 0) ||
      washingData.length > 0;

    if (!hasRequiredData) {
      alert(
        "Please upload the required files (Output & Defect, or Washing data)."
      );
      return null;
    }

    if (!skipLoading) setLoadingProcess(true);

    try {
      // If we have washing data, process it
      if (washingData.length > 0) {
        const processedWashingData = processWashingDataForSave(washingData);

        if (!skipSetState) {
          setFinalResult(washingData); // Show washing data in preview
          setWashingQtyData(processedWashingData);
        }

        return {
          finalDocs: washingData,
          washingQtyDocs: processedWashingData
        };
      }

      // For output and defect data, you'll need to create a separate endpoint
      // or handle this differently based on your backend structure
      if (outputData.length > 0 && defectData.length > 0) {
        // Process output and defect data locally or create new endpoint
        const combinedData = [...outputData, ...defectData];

        if (!skipSetState) {
          setFinalResult(combinedData);
          setWashingQtyData([]);
        }

        return { finalDocs: combinedData, washingQtyDocs: [] };
      }
    } catch (error) {
      console.error("Error processing data:", error);
      alert("Failed to process data.");
      return null;
    } finally {
      if (!skipLoading) setLoadingProcess(false);
    }
  };

  const fetchAllResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing-qty`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setFinalResult(data.data);
      } else {
        setFinalResult([]);
        alert(data?.message || "Unexpected server response.");
      }
    } catch (error) {
      alert("Failed to fetch saved QC2 data.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async (
    resultToSave,
    washingDataToSave,
    skipLoading
  ) => {
    const dataToSave = resultToSave || finalResult;
    const washingToSave = washingDataToSave || washingQtyData || [];

    if (!skipLoading) setLoadingSave(true);

    try {
      let washingResult = { success: true, data: { total: 0 } };

      // Save washing data to qc_real_washing_qty collection
      if (washingToSave.length > 0) {
        washingResult = await saveWashingData(washingToSave);
      }

      // For other QC data, you might need to create additional endpoints
      // or handle them differently based on your requirements

      if (washingResult.success) {
        Swal.fire({
          icon: "success",
          title: "Saved!",
          text: `Saved ${
            washingResult.data?.total || washingToSave.length
          } washing records successfully!`,
          showConfirmButton: false,
          timer: 2000
        });
      } else {
        throw new Error(washingResult.message || "Failed to save washing data");
      }
    } catch (error) {
      console.error("Save error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to save data.",
        showConfirmButton: false,
        timer: 2000
      });
    } finally {
      if (!skipLoading) setLoadingSave(false);
    }
  };

  // Check if we have any data to work with
  const hasAnyData =
    outputData.length > 0 || defectData.length > 0 || washingData.length > 0;
  const hasRequiredData =
    (outputData.length > 0 && defectData.length > 0) || washingData.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 transition-all duration-300">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-full mb-4 shadow-lg">
            <span className="text-2xl text-white">📊</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
            QC2 Washing Upload
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Upload and manage washing quality control data
          </p>
        </div>

        {/* Upload Progress Indicators */}
        <div className="mb-6 flex flex-wrap justify-center gap-4">
          {uploadProgress.output && (
            <div className="flex items-center px-3 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full text-sm">
              <span className="mr-1">📊</span>
              Output Data Loaded ({outputData.length})
            </div>
          )}
          {uploadProgress.defect && (
            <div className="flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full text-sm">
              <span className="mr-1">🔍</span>
              Defect Data Loaded ({defectData.length})
            </div>
          )}
          {uploadProgress.washing && (
            <div className="flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-full text-sm">
              <span className="mr-1">🧺</span>
              Washing Data Loaded ({washingData.length})
            </div>
          )}
        </div>

        {/* Single Upload Section */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <span className="text-white text-xl">📁</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Excel Data Upload
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Upload Excel files (Output, Defect, or Washing data)
              </p>
            </div>
          </div>

          <ExcelUploader onDataLoaded={handleDataLoaded} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {/* Save Button */}
          <button
            onClick={async () => {
              if (!hasRequiredData) {
                alert(
                  "Please upload the required files (Output & Defect, or Washing data)."
                );
                return;
              }

              setLoadingSave(true);

              try {
                let result = finalResult;
                let washingDataToSave = washingQtyData;

                if (!result || !Array.isArray(result) || result.length === 0) {
                  console.log("Processing data first...");
                  const processedData = await handleFinalResult(true, true);

                  if (processedData) {
                    result = processedData.finalDocs || processedData;
                    washingDataToSave = processedData.washingQtyDocs || [];
                  }
                }

                await handleManualSave(result, washingDataToSave, true);
              } catch (error) {
                console.error("Save process error:", error);
                Swal.fire({
                  icon: "error",
                  title: "Error",
                  text: "Failed to process and save data.",
                  showConfirmButton: false,
                  timer: 2000
                });
              } finally {
                setLoadingSave(false);
              }
            }}
            disabled={
              loadingSave || loadingProcess || loadingFetch || !hasRequiredData
            }
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
          {/* <button
            onClick={async () => {
              if (!hasRequiredData) {
                alert('Please upload the required files (Output & Defect, or Washing data).');
                              return;
            }
            setLoadingProcess(true);
            await handleFinalResult();
            setLoadingProcess(false);
          }}
          disabled={loadingProcess || loadingSave || loadingFetch || !hasRequiredData}
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
        </button> */}

          {/* Fetch All Results Button */}
          {/* <button
          onClick={fetchAllResults}
          disabled={loading || loadingSave || loadingProcess}
          className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-500 dark:to-teal-500 hover:from-green-700 hover:to-teal-700 dark:hover:from-green-600 dark:hover:to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Loading...
              </>
            ) : (
              <>
                <span className="mr-2">📋</span>
                Fetch All Results
              </>
            )}
          </span>
        </button> */}
        </div>

        {/* Results Section */}
        {/* {finalResult && (
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
      )} */}

        {/* Debug Info */}
        {/* {washingQtyData.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Debug: {washingQtyData.length} washing records ready to save
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-blue-600 dark:text-blue-400 text-sm">
              View washing data summary
            </summary>
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              {washingQtyData.map((item, index) => (
                <div key={index} className="mb-1">
                  {item.Style_No} - {item.color}: {item.washQty} units ({item.inspectionDate})
                </div>
              ))}
            </div>
          </details>
        </div>
      )} */}

        {/* Data Type Info */}
        {/* {currentDataType && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last uploaded: <span className="font-medium">{currentDataType}</span> data
          </p>
        </div>
      )} */}
      </div>
    </div>
  );
};

export default QC2WashingUpload;
