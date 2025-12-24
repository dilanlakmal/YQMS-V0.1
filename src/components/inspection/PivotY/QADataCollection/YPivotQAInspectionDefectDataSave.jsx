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

      // Check if data already exists in client state
      const hasDefects = reportData.defectData?.savedDefects?.length > 0;
      const hasManual =
        Object.keys(reportData.defectData?.manualDataByGroup || {}).length > 0;

      if (hasDefects || hasManual) {
        return;
      }

      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success) {
          const backendData = res.data.data;

          // 1. Process Standard Defects (Deep Restore)
          const backendDefects = backendData.defectData || [];
          const processedDefects = backendDefects.map((defect) => {
            // Restore Location Images & Logic
            const restoredLocations = (defect.locations || []).map((loc) => {
              const restoredLocImages = (loc.images || []).map((img) => {
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
                  imgSrc: displayUrl,
                  editedImgSrc: displayUrl,
                  history: []
                };
              });

              return { ...loc, images: restoredLocImages };
            });

            // Restore General Images
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
                imgSrc: displayUrl,
                history: []
              };
            });

            return {
              ...defect,
              locations: restoredLocations,
              images: restoredImages
            };
          });

          // 2. Process Manual Defect Data (Array -> Object Map)
          const backendManualData = backendData.defectManualData || [];
          const processedManualDataByGroup = {};

          backendManualData.forEach((item) => {
            const groupId = item.groupId;
            const processedImages = (item.images || []).map((img) => {
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
                imgSrc: displayUrl,
                editedImgSrc: displayUrl,
                remark: img.remark || "",
                history: []
              };
            });

            processedManualDataByGroup[groupId] = {
              remarks: item.remarks || "",
              images: processedImages
            };
          });

          // Update parent state
          onUpdateDefectData({
            savedDefects: processedDefects,
            manualDataByGroup: processedManualDataByGroup
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
    const manualDataByGroup = reportData.defectData?.manualDataByGroup || {};

    if (
      currentDefects.length === 0 &&
      Object.keys(manualDataByGroup).length === 0
    ) {
      alert("No defect data recorded to save.");
      return;
    }

    setSaving(true);
    try {
      // 1. Prepare Standard Defects Payload
      const payloadDefects = currentDefects.map((defect) => {
        // Process Location Images
        const processedLocations = (defect.locations || []).map((loc) => {
          const locImages = (loc.images || []).map((img) => {
            let payloadImageURL = null;
            let payloadImgSrc = null;
            const imageData = img.editedImgSrc || img.imgSrc || img.url;

            if (imageData && imageData.startsWith("data:")) {
              payloadImgSrc = imageData;
            } else if (imageData) {
              payloadImageURL = imageData.replace(API_BASE_URL, "");
            }

            return {
              id: img.id,
              imageURL: payloadImageURL,
              imgSrc: payloadImgSrc
            };
          });
          return { ...loc, images: locImages };
        });

        // Process General Images
        const processedImages = (defect.images || []).map((img) => {
          let payloadImageURL = null;
          let payloadImgSrc = null;
          const imageData = img.url || img.imgSrc;

          if (imageData && imageData.startsWith("data:")) {
            payloadImgSrc = imageData;
          } else if (imageData) {
            payloadImageURL = imageData.replace(API_BASE_URL, "");
          }

          return {
            id: img.id,
            imageURL: payloadImageURL,
            imgSrc: payloadImgSrc
          };
        });

        return {
          ...defect,
          additionalRemark: defect.additionalRemark || "",
          locations: processedLocations,
          images: processedImages
        };
      });

      // 2. Prepare Manual Defects Payload
      const payloadManualData = Object.entries(manualDataByGroup).map(
        ([groupIdStr, data]) => {
          const groupId = isNaN(Number(groupIdStr))
            ? groupIdStr
            : Number(groupIdStr);

          const processedImages = (data.images || []).map((img) => {
            let payloadImageURL = null;
            let payloadImgSrc = null;
            const imageData = img.editedImgSrc || img.imgSrc || img.url;

            if (imageData && imageData.startsWith("data:")) {
              payloadImgSrc = imageData;
            } else if (imageData) {
              payloadImageURL = imageData.replace(API_BASE_URL, "");
            }

            return {
              id: img.id,
              imageId: img.id,
              imageURL: payloadImageURL,
              imgSrc: payloadImgSrc,
              remark: img.remark
            };
          });

          return {
            groupId: groupId,
            remarks: data.remarks,
            images: processedImages
            // We can attach minimal context if needed, otherwise backend relies on groupId
          };
        }
      );

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-defect-data`,
        {
          reportId: reportId,
          defectData: payloadDefects,
          defectManualData: payloadManualData
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
      <YPivotQAInspectionDefectConfig
        selectedOrders={selectedOrders}
        orderData={orderData}
        reportData={reportData}
        onUpdateDefectData={onUpdateDefectData}
        activeGroup={activeGroup}
      />

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
