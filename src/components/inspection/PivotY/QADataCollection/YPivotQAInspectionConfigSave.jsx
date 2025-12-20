import React, { useState, useEffect } from "react";
import axios from "axios";
import { Save, Loader2, Info } from "lucide-react";
import Swal from "sweetalert2";
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

      if (reportData.lineTableConfig && reportData.lineTableConfig.length > 0) {
        return;
      }

      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success && res.data.data.inspectionConfig) {
          const savedConfig = res.data.data.inspectionConfig;
          if (savedConfig && savedConfig.configGroups) {
            onUpdate({ lineTableConfig: savedConfig.configGroups });
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

  // --- REUSABLE SAVE FUNCTION ---
  const saveToBackend = async (groupsToSave, isSilent = false) => {
    if (!isReportSaved || !reportId) return; // Validation handled in UI trigger usually

    const selectedTemplate = reportData.selectedTemplate;
    const isAQL = selectedTemplate?.InspectedQtyMethod === "AQL";
    const aqlSampleSize = reportData.config?.aqlSampleSize || 0;

    // Calculate Total
    let calculatedTotal = 0;
    if (isAQL) {
      calculatedTotal = aqlSampleSize;
    } else {
      calculatedTotal = groupsToSave.reduce((total, group) => {
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
        configGroups: groupsToSave
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-inspection-config`,
        {
          reportId: reportId,
          configData: payload
        }
      );

      if (res.data.success) {
        if (!isSilent) {
          Swal.fire({
            icon: "success",
            title: "Saved Successfully",
            text: "Configuration data has been updated.",
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true
          });
        }
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      if (!isSilent) {
        Swal.fire({
          icon: "error",
          title: "Save Failed",
          text: "Failed to save configuration."
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // --- UI BUTTON SAVE HANDLER ---
  const handleSaveClick = () => {
    if (!isReportSaved || !reportId) {
      Swal.fire({
        icon: "warning",
        title: "Order Not Saved",
        text: "Please save the Order information first.",
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    const currentGroups = reportData.lineTableConfig || [];
    if (currentGroups.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Empty Configuration",
        text: "Please add at least one configuration group before saving.",
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    saveToBackend(currentGroups);
  };

  // --- IMMEDIATE SAVE HANDLER (Passed to Child) ---
  const handleImmediateSave = (updatedGroups) => {
    // We save silently or with toast, up to preference. Here we show toast.
    saveToBackend(updatedGroups, false);
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
      {!activeGroup && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
              Configuration Required
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Please configure the inspection scope...
            </p>
          </div>
        </div>
      )}

      <YPivotQAInspectionLineTableColorConfig
        reportData={reportData}
        orderData={orderData}
        onUpdate={onUpdate}
        onSetActiveGroup={onSetActiveGroup}
        activeGroup={activeGroup}
        // --- PASS THE SAVE FUNCTION ---
        onSaveWithData={handleImmediateSave}
      />

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-8xl mx-auto flex justify-end px-4">
          <button
            onClick={handleSaveClick}
            disabled={!isReportSaved || saving}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95
              ${
                isReportSaved
                  ? "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              }
            `}
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
