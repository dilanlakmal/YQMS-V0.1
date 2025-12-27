import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Save,
  Loader2,
  Ruler,
  Edit3,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQAInspectionMeasurementConfig from "./YPivotQAInspectionMeasurementConfig";

// --- AUTO DISMISS MODAL COMPONENT HERE ---
const AutoDismissModal = ({ isOpen, onClose, type, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === "success";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center gap-3 min-w-[250px] transform scale-100 transition-all">
        <div
          className={`p-3 rounded-full ${
            isSuccess
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <AlertCircle className="w-8 h-8" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center">
          {isSuccess ? "Success" : "Error"}
        </h3>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
          {message}
        </p>
      </div>
    </div>,
    document.body
  );
};

const YPivotQAInspectionMeasurementDataSave = ({
  selectedOrders,
  orderData,
  reportData,
  onUpdateMeasurementData,
  activeGroup,
  reportId,
  isReportSaved,
  onSaveSuccess
}) => {
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    message: ""
  });

  // --- FETCH EXISTING DATA ---
  useEffect(() => {
    const fetchExistingMeasurementData = async () => {
      if (!reportId) return;

      // Check if data already exists AND is properly formatted (Sets, not arrays)
      const savedMeasurements =
        reportData.measurementData?.savedMeasurements || [];
      const hasProperlyFormattedData =
        savedMeasurements.length > 0 &&
        savedMeasurements[0]?.allEnabledPcs instanceof Set;

      const hasManualData =
        Object.keys(reportData.measurementData?.manualDataByGroup || {})
          .length > 0;

      // If data is already properly formatted (hydrated from parent), skip fetch
      if (hasProperlyFormattedData || hasManualData) {
        setIsUpdateMode(true);
        console.log("Measurement data already hydrated, skipping fetch");
        return;
      }

      // Check if we have raw data (arrays, not Sets) - this means parent hydrated but didn't process
      const hasRawData =
        savedMeasurements.length > 0 &&
        Array.isArray(savedMeasurements[0]?.allEnabledPcs);

      if (hasRawData) {
        console.log("Converting raw measurement data to proper format");
        // Convert in place
        const processedMeasurements = savedMeasurements.map((m) => ({
          ...m,
          allEnabledPcs: new Set(m.allEnabledPcs || []),
          criticalEnabledPcs: new Set(m.criticalEnabledPcs || [])
        }));

        onUpdateMeasurementData(
          {
            ...reportData.measurementData,
            savedMeasurements: processedMeasurements
          },
          { isFromBackend: true }
        );
        setIsUpdateMode(true);
        return;
      }

      // No data exists, fetch from backend
      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success && res.data.data.measurementData) {
          const backendData = res.data.data.measurementData;

          if (Array.isArray(backendData) && backendData.length > 0) {
            setIsUpdateMode(true);
          } else {
            setIsUpdateMode(false);
          }

          // Process Standard Measurements
          const processedMeasurements = backendData
            .filter((m) => m.size !== "Manual_Entry")
            .map((m) => ({
              ...m,
              allEnabledPcs: new Set(m.allEnabledPcs || []),
              criticalEnabledPcs: new Set(m.criticalEnabledPcs || [])
            }));

          // Process Manual Data
          const processedManualDataByGroup = {};
          backendData.forEach((item) => {
            if (item.manualData) {
              const groupId = item.groupId;
              const processedImages = (item.manualData.images || []).map(
                (img) => {
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
                }
              );

              processedManualDataByGroup[groupId] = {
                remarks: item.manualData.remarks || "",
                status: item.manualData.status || "Pass",
                images: processedImages
              };
            }
          });

          onUpdateMeasurementData(
            {
              savedMeasurements: processedMeasurements,
              manualDataByGroup: processedManualDataByGroup,
              isConfigured: processedMeasurements.length > 0
            },
            { isFromBackend: true }
          );
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
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Please save Order information first."
      });
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
        setStatusModal({
          isOpen: true,
          type: "error",
          message: "No data to save."
        });
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
        setIsUpdateMode(true);
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        setStatusModal({
          isOpen: true,
          type: "success",
          message: isUpdateMode
            ? "Measurement Data Updated Successfully!"
            : "Measurement Data Saved Successfully!"
        });
      }
    } catch (error) {
      console.error("Error saving measurement results:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Failed to save measurement results."
      });
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
                !isReportSaved
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : isUpdateMode
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white" // Blue for Update
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" // Green for Save
              }
            `}
            title={
              !isReportSaved
                ? "Save Order Data first"
                : isUpdateMode
                ? "Update Measurement Data"
                : "Save Measurement Data"
            }
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isUpdateMode ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>
                {isUpdateMode ? (
                  <Edit3 className="w-5 h-5" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isUpdateMode ? "Update Measurements" : "Save Measurements"}
              </>
            )}
          </button>
        </div>
      </div>
      {/* Auto Dismiss Modal */}
      <AutoDismissModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        message={statusModal.message}
      />
    </div>
  );
};

export default YPivotQAInspectionMeasurementDataSave;
