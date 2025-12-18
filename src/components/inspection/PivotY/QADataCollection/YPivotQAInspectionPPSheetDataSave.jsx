import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Save, Loader2, FileText, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQATemplatesPPSheet from "../QATemplates/YPivotQATemplatesPPSheet";

const YPivotQAInspectionPPSheetDataSave = ({
  orderData,
  selectedOrders,
  inspectionDate,
  reportData,
  onUpdatePPSheetData, // Pass a handler to update parent state (e.g., ppSheetData)
  reportId,
  isReportSaved
}) => {
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // 1. Determine Pre-filled Data (Logic from Determination Component)
  const prefilledData = useMemo(() => {
    // 1. Determine Style: Join all selected order numbers with a comma
    const style =
      selectedOrders && selectedOrders.length > 0
        ? selectedOrders.join(", ")
        : "";

    // 2. Determine Qty: Get total quantity from calculated order data
    const qty = orderData?.dtOrder?.totalQty
      ? orderData.dtOrder.totalQty.toString()
      : "";

    // 3. Date comes directly from the picker in Order Tab
    const date = inspectionDate || new Date().toISOString().split("T")[0];

    return {
      style,
      qty,
      date
    };
  }, [orderData, selectedOrders, inspectionDate]);

  // 2. Fetch Existing Data
  useEffect(() => {
    const fetchExistingPPSheetData = async () => {
      if (!reportId) return;

      // Avoid re-fetching if data is already in state (client nav)
      // Check if reportData.ppSheetData has content (e.g. style is set)
      if (
        reportData.ppSheetData &&
        Object.keys(reportData.ppSheetData).length > 0
      ) {
        return;
      }

      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success && res.data.data.ppSheetData) {
          const backendData = res.data.data.ppSheetData;

          // Restore Image URLs (Prepend API_BASE_URL if relative)
          const processedImages = (backendData.images || []).map((img) => {
            let displayUrl = img.imageURL;
            if (
              displayUrl &&
              !displayUrl.startsWith("http") &&
              !displayUrl.startsWith("data:")
            ) {
              displayUrl = `${API_BASE_URL}${displayUrl}`;
            }

            return {
              id: img.imageId,
              url: displayUrl,
              imgSrc: displayUrl, // For editor preview
              history: []
            };
          });

          // Update parent state
          if (onUpdatePPSheetData) {
            onUpdatePPSheetData({
              ...backendData,
              images: processedImages
            });
          }
        }
      } catch (error) {
        console.error("Error fetching PP Sheet data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (reportId) {
      fetchExistingPPSheetData();
    }
  }, [reportId]);

  // 3. Save Handler
  const handleSaveData = async () => {
    if (!isReportSaved || !reportId) {
      alert("Please save the Order information first.");
      return;
    }

    const currentData = reportData.ppSheetData;

    // Basic validation
    if (!currentData) {
      alert("No data to save.");
      return;
    }

    setSaving(true);
    try {
      // Prepare Payload - Handle Images
      const processedImages = (currentData.images || []).map((img) => {
        let payloadImageURL = null;
        let payloadImgSrc = null;

        if (img.url.startsWith("data:")) {
          // New Image -> Base64
          payloadImgSrc = img.url;
          payloadImageURL = null;
        } else {
          // Existing Image -> Relative URL
          payloadImageURL = img.url.replace(API_BASE_URL, "");
          payloadImgSrc = null;
        }

        return {
          id: img.id,
          imageURL: payloadImageURL,
          imgSrc: payloadImgSrc
        };
      });

      const payload = {
        ...currentData,
        images: processedImages
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-pp-sheet-data`,
        {
          reportId: reportId,
          ppSheetData: payload
        }
      );

      if (res.data.success) {
        alert("PP Sheet data saved successfully!");
      }
    } catch (error) {
      console.error("Error saving PP Sheet data:", error);
      alert("Failed to save PP Sheet data.");
    } finally {
      setSaving(false);
    }
  };

  if (!orderData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">
          Waiting for Order Data
        </h3>
        <p className="text-sm text-gray-400 text-center max-w-xs mt-2">
          Please select an order in the "Order" tab to generate the PP Sheet
          details.
        </p>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="ml-3 text-gray-600 font-medium">
          Loading existing PP Sheet...
        </span>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      {/* 1. Main Template Component */}
      <YPivotQATemplatesPPSheet
        prefilledData={prefilledData}
        savedState={reportData.ppSheetData}
        onDataChange={onUpdatePPSheetData}
      />

      {/* 2. Floating Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-8xl mx-auto flex justify-end px-4">
          <button
            onClick={handleSaveData}
            disabled={!isReportSaved || saving}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95
              ${
                isReportSaved
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              }
            `}
            title={
              !isReportSaved ? "Save Order Data first" : "Save PP Sheet Data"
            }
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save PP Sheet Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default YPivotQAInspectionPPSheetDataSave;
