import React, { useState, useEffect } from "react";
import axios from "axios";
import { Save, Loader2, Ruler } from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQAInspectionMeasurementConfig from "./YPivotQAInspectionMeasurementConfig";

const YPivotQAInspectionMeasurementDataSave = ({
  selectedOrders,
  orderData,
  reportData,
  onUpdateMeasurementData,
  activeGroup,
  reportId,
  isReportSaved
}) => {
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // --- FETCH EXISTING DATA ---
  useEffect(() => {
    const fetchExistingMeasurementData = async () => {
      if (!reportId) return;

      // Check if data already exists in client state to avoid overwrite
      const hasSavedMeasurements =
        reportData.measurementData?.savedMeasurements?.length > 0;
      const hasManualData =
        Object.keys(reportData.measurementData?.manualDataByGroup || {})
          .length > 0;

      if (hasSavedMeasurements || hasManualData) {
        return;
      }

      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success && res.data.data.measurementData) {
          const backendData = res.data.data.measurementData;

          // 1. Process Standard Measurements
          const processedMeasurements = backendData
            .filter((m) => m.size !== "Manual_Entry")
            .map((m) => ({
              ...m,
              allEnabledPcs: new Set(m.allEnabledPcs || []),
              criticalEnabledPcs: new Set(m.criticalEnabledPcs || [])
            }));

          // 2. Process Manual Data
          const processedManualDataByGroup = {};

          backendData.forEach((item) => {
            if (item.manualData) {
              const groupId = item.groupId;

              // Process Images
              const processedImages = (item.manualData.images || []).map(
                (img) => {
                  let displayUrl = img.imageURL;
                  // Prepend API_BASE_URL for display if it's a relative path
                  if (
                    displayUrl &&
                    !displayUrl.startsWith("http") &&
                    !displayUrl.startsWith("data:")
                  ) {
                    displayUrl = `${API_BASE_URL}${displayUrl}`;
                  }

                  return {
                    id: img.imageId,
                    url: displayUrl, // Used for display logic in Editor
                    imgSrc: displayUrl, // Used for display logic in Manual Component
                    editedImgSrc: displayUrl, // Ensure preview works
                    remark: img.remark || "",
                    history: []
                  };
                }
              );

              processedManualDataByGroup[groupId] = {
                remarks: item.manualData.remarks || "",
                status: item.manualData.status || "Pass",
                images: processedImages
              };
            }
          });

          onUpdateMeasurementData({
            savedMeasurements: processedMeasurements,
            manualDataByGroup: processedManualDataByGroup,
            isConfigured: processedMeasurements.length > 0
          });
        }
      } catch (error) {
        console.error("Error fetching measurement data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (reportId) {
      fetchExistingMeasurementData();
    }
  }, [reportId]);

  // --- SAVE HANDLER ---
  const handleSaveData = async () => {
    if (!isReportSaved || !reportId) {
      alert("Please save the Order information first.");
      return;
    }

    const currentMeasurements =
      reportData.measurementData?.savedMeasurements || [];
    const manualDataByGroup =
      reportData.measurementData?.manualDataByGroup || {};

    setSaving(true);
    try {
      const payload = [];

      // Helper to process Manual Data Images for Upload
      const processManualImagesForSave = (images) => {
        return (images || []).map((img) => {
          let payloadImageURL = null;
          let payloadImgSrc = null;

          // Check for Base64 in editedImgSrc (preferred) or imgSrc
          const imageData = img.editedImgSrc || img.imgSrc || img.url;

          if (imageData && imageData.startsWith("data:")) {
            // New Image (Base64) -> Send in imgSrc for backend to save
            payloadImgSrc = imageData;
            payloadImageURL = null;
          } else if (imageData && imageData.includes(API_BASE_URL)) {
            // Existing Image with Full URL -> Strip API_BASE_URL to save relative path
            payloadImageURL = imageData.replace(API_BASE_URL, "");
            payloadImgSrc = null;
          } else {
            // Already relative or other URL
            payloadImageURL = imageData;
            payloadImgSrc = null;
          }

          return {
            id: img.id,
            imageId: img.id,
            imageURL: payloadImageURL,
            imgSrc: payloadImgSrc,
            remark: img.remark
          };
        });
      };

      const measurementsByGroup = {};
      currentMeasurements.forEach((m) => {
        if (!measurementsByGroup[m.groupId])
          measurementsByGroup[m.groupId] = [];
        measurementsByGroup[m.groupId].push(m);
      });

      const allGroupIds = new Set([
        ...Object.keys(measurementsByGroup).map(Number),
        ...Object.keys(manualDataByGroup).map(Number)
      ]);

      allGroupIds.forEach((groupId) => {
        const groupMeasurements = measurementsByGroup[groupId] || [];
        const groupManualData = manualDataByGroup[groupId];

        if (groupMeasurements.length > 0) {
          groupMeasurements.forEach((m, index) => {
            const isFirst = index === 0;
            const cleanMeasurement = {
              ...m,
              allEnabledPcs: Array.from(m.allEnabledPcs || []),
              criticalEnabledPcs: Array.from(m.criticalEnabledPcs || [])
            };

            if (isFirst && groupManualData) {
              cleanMeasurement.manualData = {
                remarks: groupManualData.remarks,
                status: groupManualData.status,
                images: processManualImagesForSave(groupManualData.images)
              };
            } else {
              cleanMeasurement.manualData = null;
            }
            payload.push(cleanMeasurement);
          });
        } else if (groupManualData) {
          // Placeholder for Manual-Only Entry
          payload.push({
            groupId: groupId,
            size: "Manual_Entry",
            line: "",
            table: "",
            color: "",
            qcUser: null,
            allMeasurements: {},
            criticalMeasurements: {},
            allEnabledPcs: [],
            criticalEnabledPcs: [],
            inspectorDecision:
              groupManualData.status === "Pass" ? "pass" : "fail",
            manualData: {
              remarks: groupManualData.remarks,
              status: groupManualData.status,
              images: processManualImagesForSave(groupManualData.images)
            }
          });
        }
      });

      if (payload.length === 0) {
        setSaving(false);
        alert("No data to save.");
        return;
      }

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-measurement-data`,
        {
          reportId: reportId,
          measurementData: payload
        }
      );

      if (res.data.success) {
        alert("Measurement results saved successfully!");

        // OPTIONAL: Reload data to ensure image URLs are synced back from server
        // This fixes the "broken image" issue immediately after save if frontend kept base64
        // You might want to update the state here with the response data if returned
      }
    } catch (error) {
      console.error("Error saving measurement results:", error);
      alert("Failed to save measurement results.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="ml-3 text-gray-600 font-medium">
          Loading existing measurements...
        </span>
      </div>
    );
  }

  if (!reportData?.selectedTemplate) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Ruler className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500">Please select a Report Type first.</p>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      <YPivotQAInspectionMeasurementConfig
        selectedOrders={selectedOrders}
        orderData={orderData}
        reportData={reportData}
        onUpdateMeasurementData={onUpdateMeasurementData}
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
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              }
            `}
            title={
              !isReportSaved ? "Save Order Data first" : "Save Measurements"
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
                Save Measurements
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default YPivotQAInspectionMeasurementDataSave;
