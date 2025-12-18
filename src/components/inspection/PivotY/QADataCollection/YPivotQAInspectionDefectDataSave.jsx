import React, { useState, useEffect } from "react";
import axios from "axios";
import { Save, Loader2, Bug } from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQAInspectionDefectConfig from "./YPivotQAInspectionDefectConfig";

const YPivotQAInspectionDefectDataSave = ({
  selectedOrders,
  orderData,
  reportData,
  onUpdateDefectData,
  activeGroup,
  reportId,
  isReportSaved
}) => {
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // --- FETCH EXISTING DATA ---
  useEffect(() => {
    const fetchExistingDefectData = async () => {
      if (!reportId) return;

      // Avoid re-fetching if data is already in state (client nav)
      if (
        reportData.defectData &&
        reportData.defectData.savedDefects &&
        reportData.defectData.savedDefects.length > 0
      ) {
        return;
      }

      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success && res.data.data.defectData) {
          const backendDefects = res.data.data.defectData;

          // Restore Image URLs (Prepend API_BASE_URL if relative)
          const processedDefects = backendDefects.map((defect) => {
            const restoredImages = (defect.images || []).map((img) => {
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

            return {
              ...defect,
              images: restoredImages
            };
          });

          // Update parent state
          onUpdateDefectData({
            savedDefects: processedDefects
          });
        }
      } catch (error) {
        console.error("Error fetching defect data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (reportId) {
      fetchExistingDefectData();
    }
  }, [reportId]);

  // --- SAVE HANDLER ---
  const handleSaveData = async () => {
    if (!isReportSaved || !reportId) {
      alert("Please save the Order information first.");
      return;
    }

    const currentDefects = reportData.defectData?.savedDefects || [];

    if (currentDefects.length === 0) {
      alert("No defects recorded to save.");
      return;
    }

    setSaving(true);
    try {
      // Prepare payload - Handle Images
      const payloadData = currentDefects.map((defect) => {
        const processedImages = (defect.images || []).map((img) => {
          let payloadImageURL = null;
          let payloadImgSrc = null;

          if (img.url.startsWith("data:")) {
            // New Image -> Send Base64 in imgSrc for backend to save
            payloadImgSrc = img.url;
            payloadImageURL = null;
          } else {
            // Existing Image -> Send Relative Path in imageURL
            payloadImageURL = img.url.replace(API_BASE_URL, "");
            payloadImgSrc = null;
          }

          return {
            id: img.id,
            imageURL: payloadImageURL,
            imgSrc: payloadImgSrc
          };
        });

        // Ensure we send only necessary fields and match schema
        return {
          groupId: defect.groupId,
          defectId: defect.defectId,
          defectName: defect.defectName,
          defectCode: defect.defectCode,
          categoryName: defect.categoryName,
          status: defect.status,
          qty: defect.qty,
          determinedBuyer: defect.determinedBuyer,

          isNoLocation: defect.isNoLocation,
          locations: defect.locations, // Array of location objects

          images: processedImages,

          line: defect.line,
          table: defect.table,
          color: defect.color,
          lineName: defect.lineName,
          tableName: defect.tableName,
          colorName: defect.colorName,
          qcUser: defect.qcUser,

          timestamp: defect.timestamp || new Date()
        };
      });

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-defect-data`,
        {
          reportId: reportId,
          defectData: payloadData
        }
      );

      if (res.data.success) {
        alert("Defect data saved successfully!");
      }
    } catch (error) {
      console.error("Error saving defect data:", error);
      alert("Failed to save defect data.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="ml-3 text-gray-600 font-medium">
          Loading existing defects...
        </span>
      </div>
    );
  }

  // Warning if no template selected
  if (!reportData?.selectedTemplate) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Bug className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500">Please select a Report Type first.</p>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      {/* 1. Main UI Component */}
      <YPivotQAInspectionDefectConfig
        selectedOrders={selectedOrders}
        orderData={orderData}
        reportData={reportData}
        onUpdateDefectData={onUpdateDefectData}
        activeGroup={activeGroup}
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
                  ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              }
            `}
            title={
              !isReportSaved ? "Save Order Data first" : "Save Defect Data"
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
                Save Defects
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default YPivotQAInspectionDefectDataSave;
