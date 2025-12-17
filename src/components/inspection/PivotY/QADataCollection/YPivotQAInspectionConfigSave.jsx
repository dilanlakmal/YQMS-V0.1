import React, { useState, useEffect } from "react";
import axios from "axios";
import { Save, Loader2, Info } from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQAInspectionLineTableColorConfig from "./YPivotQAInspectionLineTableColorConfig";

const YPivotQAInspectionConfigSave = ({
  reportData,
  orderData,
  onUpdate,
  onSetActiveGroup,
  activeGroup,
  reportId,
  isReportSaved
}) => {
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // --- FETCH EXISTING DATA ---
  useEffect(() => {
    const fetchExistingConfig = async () => {
      if (!reportId) return;

      // Avoid re-fetching if we already have data in state (client-side navigation)
      // Check if lineTableConfig has items
      if (reportData.lineTableConfig && reportData.lineTableConfig.length > 0) {
        return;
      }

      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success && res.data.data.inspectionConfig) {
          const configArr = res.data.data.inspectionConfig;

          // Assuming we want the latest config or the one matching current template
          // For now, we take the first one as established in the controller
          if (configArr.length > 0) {
            const savedConfig = configArr[0];

            // Restore the UI state
            if (savedConfig.configGroups) {
              onUpdate({ lineTableConfig: savedConfig.configGroups });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching inspection config:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (reportId) {
      fetchExistingConfig();
    }
  }, [reportId]);

  // --- SAVE HANDLER ---
  const handleSaveConfig = async () => {
    if (!isReportSaved || !reportId) {
      alert("Please save the Order information first.");
      return;
    }

    const currentGroups = reportData.lineTableConfig || [];
    const selectedTemplate = reportData.selectedTemplate;
    const isAQL = selectedTemplate?.InspectedQtyMethod === "AQL";
    const aqlSampleSize = reportData.config?.aqlSampleSize || 0;

    if (currentGroups.length === 0) {
      alert("Please add at least one configuration group before saving.");
      return;
    }

    // Calculate Total Sample Size based on Logic
    let calculatedTotal = 0;
    if (isAQL) {
      calculatedTotal = aqlSampleSize;
    } else {
      // Sum all assignments
      calculatedTotal = currentGroups.reduce((total, group) => {
        const groupTotal = group.assignments.reduce(
          (sum, assign) => sum + (parseInt(assign.qty) || 0),
          0
        );
        return total + groupTotal;
      }, 0);
    }

    setSaving(true);
    try {
      const payload = {
        reportName: selectedTemplate.ReportType,
        inspectionMethod: selectedTemplate.InspectedQtyMethod || "Fixed",
        sampleSize: calculatedTotal,
        configGroups: currentGroups // Saving the dynamic array directly
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-inspection-config`,
        {
          reportId: reportId,
          configData: payload
        }
      );

      if (res.data.success) {
        alert("Configuration saved successfully!");
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      alert("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="ml-3 text-gray-600 font-medium">
          Loading configuration...
        </span>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      {/* 1. Context Banner (Optional visual cue) */}
      {!activeGroup && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
              Configuration Required
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Please configure the inspection scope (Line, Table, Colors) and
              assign QCs or quantities below. Click "Start" on a card to begin
              inspecting defects or measurements for that specific group.
            </p>
          </div>
        </div>
      )}

      {/* 2. The Original UI Component */}
      <YPivotQAInspectionLineTableColorConfig
        reportData={reportData}
        orderData={orderData}
        onUpdate={onUpdate}
        onSetActiveGroup={onSetActiveGroup}
        activeGroup={activeGroup}
      />

      {/* 3. Floating Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-8xl mx-auto flex justify-end px-4">
          <button
            onClick={handleSaveConfig}
            disabled={!isReportSaved || saving}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95
              ${
                isReportSaved
                  ? "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              }
            `}
            title={
              !isReportSaved ? "Save Order Data first" : "Save Configuration"
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
                Save Config
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default YPivotQAInspectionConfigSave;
