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

      // If we already have data in client state (e.g. from nav), don't re-fetch
      // unless you want to ensure sync. For now, check if empty.
      if (
        reportData.measurementData &&
        reportData.measurementData.savedMeasurements &&
        reportData.measurementData.savedMeasurements.length > 0
      ) {
        return;
      }

      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success && res.data.data.measurementData) {
          const backendData = res.data.data.measurementData;

          // CRITICAL: Transform Arrays back to Sets for UI Logic
          const processedMeasurements = backendData.map((m) => ({
            ...m,
            allEnabledPcs: new Set(m.allEnabledPcs || []),
            criticalEnabledPcs: new Set(m.criticalEnabledPcs || [])
          }));

          // Update parent state so the UI component receives it
          onUpdateMeasurementData({
            savedMeasurements: processedMeasurements,
            // We set isConfigured to true if we have data,
            // forcing the UI to unlock if needed
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

    if (currentMeasurements.length === 0) {
      alert("No measurements recorded to save.");
      return;
    }

    setSaving(true);
    try {
      // CRITICAL: Transform Sets back to Arrays for MongoDB
      const payloadData = currentMeasurements.map((m) => ({
        ...m,
        allEnabledPcs: Array.from(m.allEnabledPcs || []),
        criticalEnabledPcs: Array.from(m.criticalEnabledPcs || [])
      }));

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-measurement-data`,
        {
          reportId: reportId,
          measurementData: payloadData
        }
      );

      if (res.data.success) {
        alert("Measurement results saved successfully!");
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

  // Warning if no template selected (Early return handled in child, but good to have context here)
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
      {/* 1. The Main UI Component (Unmodified logic) */}
      <YPivotQAInspectionMeasurementConfig
        selectedOrders={selectedOrders}
        orderData={orderData}
        reportData={reportData}
        onUpdateMeasurementData={onUpdateMeasurementData}
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
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
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
