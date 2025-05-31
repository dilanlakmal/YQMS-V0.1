// src/components/inspection/cutting/CuttingInspectionEditData.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { Save, Loader2, CalendarDays } from "lucide-react";

// Helper to parse 'MM/DD/YYYY' string to Date object
const parseMMDDYYYYtoDate = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split("/");
  if (parts.length === 3) {
    // Month is 0-indexed in JS Date
    return new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
  }
  // Try parsing if it's already a Date object or ISO string
  const d = new Date(dateString);
  if (!isNaN(d.getTime())) {
    return d;
  }
  return null; // Invalid format
};

// Helper to format Date object to 'MM/DD/YYYY' string without leading zeros for month/day
const formatDateToMMDDYYYYNoLeading = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

const CuttingInspectionEditData = ({
  inspectionRecord,
  onRecordModified,
  key: componentKey
}) => {
  const { t } = useTranslation();
  const [editableRecord, setEditableRecord] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Input and Select Base Styles ---
  const inputBaseStyle = "block w-full text-sm rounded-md shadow-sm";
  const inputNormalStyle = `${inputBaseStyle} border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3`;
  const inputDisabledStyle = `${inputBaseStyle} bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500 py-2 px-3`;

  // Initialize editableRecord when inspectionRecord prop changes or componentKey changes
  useEffect(() => {
    if (inspectionRecord) {
      setEditableRecord({
        ...inspectionRecord,
        inspectionDateObj: parseMMDDYYYYtoDate(inspectionRecord.inspectionDate),
        // These will be recalculated if totalBundleQty changes, but initialize with record's values
        bundleQtyCheck: inspectionRecord.bundleQtyCheck,
        totalInspectionQty: inspectionRecord.totalInspectionQty
      });
    } else {
      setEditableRecord(null);
    }
  }, [inspectionRecord, componentKey]);

  const handleGeneralInfoChange = (field, value) => {
    setEditableRecord((prev) => {
      if (!prev) return null;

      const newState = { ...prev, [field]: value };

      if (field === "inspectionDateObj") {
        newState.inspectionDate = formatDateToMMDDYYYYNoLeading(value);
      }

      if (field === "totalBundleQty") {
        const newTotalBundleQty = Number(value) || 0;
        newState.totalBundleQty = newTotalBundleQty;

        const layersForCalc = parseFloat(
          prev.cuttingTableDetails?.actualLayers ||
            prev.cuttingTableDetails?.planLayers ||
            0
        );
        const multiplication = newTotalBundleQty * layersForCalc;
        let calculatedBundleQtyCheck = 0;

        if (multiplication > 35000) {
          console.warn(
            "Total Bundle Qty results in multiplication > 35000. Calculations might be inaccurate or capped."
          );
          // Retain previous values or set to a state indicating error/max
          newState.bundleQtyCheck = prev.bundleQtyCheck || 0;
          newState.totalInspectionQty = prev.totalInspectionQty || 0;
        } else {
          if (multiplication >= 1 && multiplication <= 150)
            calculatedBundleQtyCheck = 2;
          else if (multiplication >= 151 && multiplication <= 280)
            calculatedBundleQtyCheck = 3;
          else if (multiplication >= 281 && multiplication <= 500)
            calculatedBundleQtyCheck = 4;
          else if (multiplication >= 501 && multiplication <= 1200)
            calculatedBundleQtyCheck = 6;
          else if (multiplication >= 1201 && multiplication <= 3200)
            calculatedBundleQtyCheck = 9;
          else if (multiplication >= 3201 && multiplication <= 10000)
            calculatedBundleQtyCheck = 14;
          else if (multiplication >= 10001 && multiplication <= 35000)
            calculatedBundleQtyCheck = 21;
          // If multiplication is 0 or > 35000 (and not caught above), calculatedBundleQtyCheck remains 0

          newState.bundleQtyCheck = calculatedBundleQtyCheck;
          newState.totalInspectionQty = calculatedBundleQtyCheck * 15;
        }
      }
      return newState;
    });
  };

  const handleSaveGeneralInfo = async () => {
    if (!editableRecord) return;

    const layersForCalc =
      editableRecord.cuttingTableDetails?.actualLayers ||
      editableRecord.cuttingTableDetails?.planLayers ||
      0;
    if ((Number(editableRecord.totalBundleQty) || 0) * layersForCalc > 35000) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.invalidInput"),
        text: t("cuttingReport.validation.totalBundleQtyTooHigh")
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        inspectionDate: editableRecord.inspectionDate,
        orderQty: Number(editableRecord.orderQty) || 0,
        totalBundleQty: Number(editableRecord.totalBundleQty) || 0,
        bundleQtyCheck: Number(editableRecord.bundleQtyCheck) || 0,
        totalInspectionQty: Number(editableRecord.totalInspectionQty) || 0
      };

      await axios.put(
        `${API_BASE_URL}/api/cutting-inspection-general-update/${editableRecord._id}`,
        payload
      );
      Swal.fire({
        icon: "success",
        title: t("cutting.success"),
        text: t("cuttingReport.generalInfoUpdatedSuccess")
      });
      if (onRecordModified) onRecordModified();
    } catch (error) {
      console.error("Error saving general info:", error);
      Swal.fire({
        icon: "error",
        title: t("cutting.error"),
        text:
          error.response?.data?.message ||
          t("cuttingReport.failedToUpdateGeneralInfo")
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!editableRecord) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-300 text-center text-gray-500">
        {t("cuttingReport.noRecordSelectedForModify")}
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-300">
      <h3 className="text-lg font-semibold text-indigo-700 mb-4">
        {t("cuttingReport.modifyGeneralInfoTitle")}
      </h3>
      <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50 shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {/* Inspection Date */}
          <div className="space-y-1">
            <label
              htmlFor="editInspDate"
              className="block text-xs font-medium text-gray-700"
            >
              {t("cuttingReport.table.inspectionDate")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DatePicker
                id="editInspDate"
                selected={editableRecord.inspectionDateObj}
                onChange={(date) =>
                  handleGeneralInfoChange("inspectionDateObj", date)
                }
                dateFormat="MM/dd/yyyy"
                className={`${inputNormalStyle} py-2 px-3 w-full`}
                popperPlacement="bottom-start"
              />
              <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Order Qty */}
          <div className="space-y-1">
            <label
              htmlFor="editOrderQty"
              className="block text-xs font-medium text-gray-700"
            >
              {t("cuttingReport.table.orderQty")}
            </label>
            <input
              id="editOrderQty"
              type="number"
              min="0"
              value={
                editableRecord.orderQty === null ||
                editableRecord.orderQty === undefined
                  ? ""
                  : editableRecord.orderQty
              }
              onChange={(e) =>
                handleGeneralInfoChange("orderQty", e.target.value)
              }
              className={`${inputNormalStyle} py-2 px-3`}
            />
          </div>

          {/* Total Bundle Qty */}
          <div className="space-y-1">
            <label
              htmlFor="editTotalBundleQty"
              className="block text-xs font-medium text-gray-700"
            >
              {t("cuttingReport.table.totalBundleQty")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="editTotalBundleQty"
              type="number"
              min="0"
              value={
                editableRecord.totalBundleQty === null ||
                editableRecord.totalBundleQty === undefined
                  ? ""
                  : editableRecord.totalBundleQty
              }
              onChange={(e) =>
                handleGeneralInfoChange("totalBundleQty", e.target.value)
              }
              className={`${inputNormalStyle} py-2 px-3`}
            />
          </div>

          {/* Bundle Qty Check (Readonly - Auto Calculated) */}
          <div className="space-y-1">
            <label
              htmlFor="displayBundleQtyCheck"
              className="block text-xs font-medium text-gray-700"
            >
              {t("cuttingReport.table.bundleQtyCheck")} (
              {t("cuttingReport.autoCalculated")})
            </label>
            <input
              id="displayBundleQtyCheck"
              type="text"
              value={
                editableRecord.bundleQtyCheck === null ||
                editableRecord.bundleQtyCheck === undefined
                  ? "0"
                  : editableRecord.bundleQtyCheck
              }
              readOnly
              className={`${inputDisabledStyle} py-2 px-3`}
            />
          </div>

          {/* Total Inspection Qty (Readonly - Auto Calculated) */}
          <div className="space-y-1">
            <label
              htmlFor="displayTotalInspectionQty"
              className="block text-xs font-medium text-gray-700"
            >
              {t("cuttingReport.table.totalInspectionQty")} (
              {t("cuttingReport.autoCalculated")})
            </label>
            <input
              id="displayTotalInspectionQty"
              type="text"
              value={
                editableRecord.totalInspectionQty === null ||
                editableRecord.totalInspectionQty === undefined
                  ? "0"
                  : editableRecord.totalInspectionQty
              }
              readOnly
              className={`${inputDisabledStyle} py-2 px-3`}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveGeneralInfo}
            disabled={isSaving}
            className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <Save size={18} className="mr-2" />
            )}
            {t("cuttingReport.saveGeneralInfo")}
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 border rounded-lg bg-slate-100 text-center text-sm text-slate-500">
        {t("cuttingReport.otherSectionsPlaceholder")}
      </div>
    </div>
  );
};

export default CuttingInspectionEditData;
