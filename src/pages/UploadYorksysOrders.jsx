import {
  AlertTriangle,
  CheckCircle,
  FileText,
  FileUp,
  Loader,
  Save,
  XCircle,
  UploadCloud,
  View,
  Layers,
  GitMerge
} from "lucide-react";
import React, { useCallback, useState } from "react";
import { read, utils } from "xlsx";
import { API_BASE_URL } from "../../config";
import { cleanYorksysOrderData } from "../components/inspection/qa-pivot/YorksysOrderClean";
import YorksysOrderPreview from "../components/inspection/qa-pivot/YorksysOrderPreview";
import YorksysOrdersView from "../components/inspection/qa-pivot/YorksysOrdersView";
import YorksysProductTypeView from "../components/inspection/qa-pivot/YorksysProductTypeView";
import YorksysCuttingSyncView from "../components/inspection/qa-pivot/YorksysCuttingSyncView";

const UploadYorksysOrders = () => {
  // --- State for Upload Tab ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ message: "", type: "" });
  const [isDragging, setIsDragging] = useState(false);

  // --- State for Active Tab ---
  const [activeTab, setActiveTab] = useState("upload");

  const resetState = () => {
    setOrderData(null);
    setError("");
    setSaveStatus({ message: "", type: "" });
  };

  const processFile = (file) => {
    if (
      file &&
      (file.type === "application/vnd.ms-excel" || file.name.endsWith(".xls"))
    ) {
      setSelectedFile(file);
      resetState();
    } else {
      setError("Invalid file type. Please upload a .xls file.");
      setSelectedFile(null);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    processFile(file);
  };

  const handleDragEvents = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    handleDragEvents(e);
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    handleDragEvents(e);
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    handleDragEvents(e);
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handlePreview = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select a .xls file first.");
      return;
    }

    setIsLoading(true);
    resetState();

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target.result;
          const workbook = read(data, { type: "array", cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json_data = utils.sheet_to_json(worksheet);
          const cleanedData = cleanYorksysOrderData(json_data);
          setOrderData(cleanedData);
        } catch (e) {
          console.error("Parsing Error:", e);
          setError(
            e.message ||
              "Failed to parse the Excel file. Please check the format and column names."
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

  // ============================================================
  // 🆕 NEW: Helper function to transform data for MongoDB
  // ============================================================
  /**
   * Transforms the preview data into the format required by MongoDB schema
   * @param {Object} data - The cleaned order data from preview
   * @returns {Object} Transformed data matching MongoDB schema
   */
  const transformOrderDataForSave = (data) => {
    // 1. Parse Fabric Content string into array
    // Example: "COTTON: 60%, POLYESTER: 40%" -> [{fabricName: "COTTON", percentageValue: 60}, ...]
    const parseFabricContent = (fabricContentStr) => {
      if (!fabricContentStr || fabricContentStr === "N/A") return [];

      return fabricContentStr.split(",").map((item) => {
        const parts = item.trim().split(":");
        const fabricName = parts[0]?.trim() || "";
        const percentageStr = parts[1]?.trim().replace("%", "") || "0";
        const percentageValue = parseInt(percentageStr, 10) || 0;

        return { fabricName, percentageValue };
      });
    };

    // 2. Transform PO Summary
    const transformMOSummary = (poSummary) => {
      if (!poSummary || poSummary.length === 0) return [];

      return poSummary.map((po) => ({
        TotalSku: po.totalSkus || 0,
        AllETD: po.uniqueEtds ? po.uniqueEtds.split(", ") : [],
        AllETA: po.uniqueEtas ? po.uniqueEtas.split(", ") : [],
        ETDPeriod: po.etdPeriod || "N/A",
        ETAPeriod: po.etaPeriod || "N/A",
        TotalColors: po.totalColors || 0,
        TotalPos: po.totalPoLines || 0,
        TotalQty: po.totalQty || 0
      }));
    };

    // 3. Transform SKU Details
    const transformSKUData = (skuDetails) => {
      if (!skuDetails || skuDetails.length === 0) return [];

      return skuDetails.map((sku) => ({
        sku: sku.sku || "",
        ETD: sku.etd || "",
        ETA: sku.eta || "",
        POLine: sku.poLine || "",
        Color: sku.color || "",
        Qty: sku.qty || 0
      }));
    };

    // 4. Transform Order Qty by Country
    const transformOrderQtyByCountry = (orderQtyByCountry) => {
      if (!orderQtyByCountry || orderQtyByCountry.length === 0) return [];

      return orderQtyByCountry.map((country) => {
        // Parse the qtyByColor string "Black: 100, White: 200" into array
        const colorQtyArray =
          country.qtyByColor && country.qtyByColor !== "N/A"
            ? country.qtyByColor.split(", ").map((item) => {
                const [colorName, qty] = item.split(": ");
                return {
                  ColorName: colorName?.trim() || "",
                  Qty: parseInt(qty?.replace(/,/g, ""), 10) || 0
                };
              })
            : [];

        return {
          CountryID: country.countryId || "",
          TotalQty: country.totalQty || 0,
          ColorQty: colorQtyArray
        };
      });
    };

    // Build the final payload
    return {
      buyer: data.buyer || "N/A",
      factory: data.factory || "N/A",
      moNo: data.moNo || "N/A",
      season: data.season || "N/A",
      style: data.style || "N/A",
      product: data.product || "N/A",
      destination: data.destination || "N/A",
      shipMode: data.shipMode || "N/A",
      currency: data.currency || "N/A",
      skuDescription: data.skuDescription || "N/A",
      FabricContent: parseFabricContent(data.fabricContent),
      MOSummary: transformMOSummary(data.poSummary),
      SKUData: transformSKUData(data.skuDetails),
      OrderQtyByCountry: transformOrderQtyByCountry(data.orderQtyByCountry)
    };
  };
  // ============================================================

  // ============================================================
  // 🆕 MODIFIED: Transform data before sending to backend
  // ============================================================
  const handleSave = async () => {
    if (!orderData) {
      setError("No data to save. Please preview a file first.");
      return;
    }

    setIsSaving(true);
    setSaveStatus({ message: "", type: "" });
    setError("");

    try {
      // Transform the data to match MongoDB schema
      const transformedData = transformOrderDataForSave(orderData);

      console.log("Transformed Data:", transformedData); // For debugging

      const response = await fetch(`${API_BASE_URL}/api/yorksys-orders/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save data.");
      }

      setSaveStatus({
        message: result.message || "Order saved successfully!",
        type: "success"
      });
    } catch (err) {
      console.error("Save Error:", err);
      setSaveStatus({ message: err.message, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };
  // ============================================================

  return (
    <div className="mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-md text-gray-600">Yorksys Order Upload</p>
      </div>

      {/* 🆕 Tab Navigation */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("upload")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "upload"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <UploadCloud className="h-5 w-5" />
              Upload Order
            </button>
            <button
              onClick={() => setActiveTab("view")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "view"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <View className="h-5 w-5" />
              View Orders
            </button>
            {/* Product Type Tab */}
            <button
              onClick={() => setActiveTab("productType")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "productType"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Layers className="h-5 w-5" />
              Product Type
            </button>
            {/* Sync from Cutting Tab */}
            <button
              onClick={() => setActiveTab("cuttingSync")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "cuttingSync"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <GitMerge className="h-5 w-5" />
              Sync from Cutting
            </button>
          </nav>
        </div>
      </div>

      {activeTab === "upload" && (
        <>
          <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col gap-4">
              <label
                htmlFor="file-upload"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragEvents}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                  isDragging
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                <FileUp className="w-10 h-10 text-gray-400 mb-3" />
                <span className="font-semibold text-gray-700">
                  Drag & drop your .xls file here
                </span>
                <span className="text-sm text-gray-500">
                  or click to browse
                </span>
                <input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".xls"
                  onChange={handleFileChange}
                />
              </label>
              {selectedFile && (
                <div className="text-center text-sm text-gray-600 bg-gray-100 p-2 rounded-md">
                  Selected File:{" "}
                  <span className="font-semibold">{selectedFile.name}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
                <button
                  onClick={handlePreview}
                  disabled={!selectedFile || isLoading || isSaving}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin mr-2" />{" "}
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" /> Preview
                    </>
                  )}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!orderData || isLoading || isSaving}
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

          {orderData && <YorksysOrderPreview orderData={orderData} />}
        </>
      )}
      {activeTab === "view" && (
        <div className="max-w-8xl mx-auto">
          {" "}
          {/* 👈 Add this wrapper div */}
          <YorksysOrdersView />
        </div>
      )}

      {/* Render Product Type view when active */}
      {activeTab === "productType" && (
        <div className="max-w-8xl mx-auto">
          <YorksysProductTypeView />
        </div>
      )}

      {/* Render Cutting Sync view when active */}
      {activeTab === "cuttingSync" && (
        <div className="max-w-8xl mx-auto">
          <YorksysCuttingSyncView />
        </div>
      )}
    </div>
  );
};

export default UploadYorksysOrders;
