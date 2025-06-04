// // src/components/inspection/cutting/CuttingInspectionEditData.jsx
// import React, { useState, useEffect } from "react";
// import { useTranslation } from "react-i18next";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import Swal from "sweetalert2";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../config";
// import { Save, Loader2, CalendarDays } from "lucide-react";

// // Helper to parse 'MM/DD/YYYY' string to Date object
// const parseMMDDYYYYtoDate = (dateString) => {
//   if (!dateString) return null;
//   const parts = dateString.split("/");
//   if (parts.length === 3) {
//     // Month is 0-indexed in JS Date
//     return new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
//   }
//   // Try parsing if it's already a Date object or ISO string
//   const d = new Date(dateString);
//   if (!isNaN(d.getTime())) {
//     return d;
//   }
//   return null; // Invalid format
// };

// // Helper to format Date object to 'MM/DD/YYYY' string without leading zeros for month/day
// const formatDateToMMDDYYYYNoLeading = (date) => {
//   if (!date) return "";
//   const d = new Date(date);
//   const month = d.getMonth() + 1;
//   const day = d.getDate();
//   const year = d.getFullYear();
//   return `${month}/${day}/${year}`;
// };

// const CuttingInspectionEditData = ({
//   inspectionRecord,
//   onRecordModified,
//   key: componentKey
// }) => {
//   const { t } = useTranslation();
//   const [editableRecord, setEditableRecord] = useState(null);
//   const [isSaving, setIsSaving] = useState(false);

//   // --- Input and Select Base Styles ---
//   const inputBaseStyle = "block w-full text-sm rounded-md shadow-sm";
//   const inputNormalStyle = `${inputBaseStyle} border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3`;
//   const inputDisabledStyle = `${inputBaseStyle} bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500 py-2 px-3`;

//   // Initialize editableRecord when inspectionRecord prop changes or componentKey changes
//   useEffect(() => {
//     if (inspectionRecord) {
//       setEditableRecord({
//         ...inspectionRecord,
//         inspectionDateObj: parseMMDDYYYYtoDate(inspectionRecord.inspectionDate),
//         // These will be recalculated if totalBundleQty changes, but initialize with record's values
//         bundleQtyCheck: inspectionRecord.bundleQtyCheck,
//         totalInspectionQty: inspectionRecord.totalInspectionQty
//       });
//     } else {
//       setEditableRecord(null);
//     }
//   }, [inspectionRecord, componentKey]);

//   const handleGeneralInfoChange = (field, value) => {
//     setEditableRecord((prev) => {
//       if (!prev) return null;

//       const newState = { ...prev, [field]: value };

//       if (field === "inspectionDateObj") {
//         newState.inspectionDate = formatDateToMMDDYYYYNoLeading(value);
//       }

//       if (field === "totalBundleQty") {
//         const newTotalBundleQty = Number(value) || 0;
//         newState.totalBundleQty = newTotalBundleQty;

//         const layersForCalc = parseFloat(
//           prev.cuttingTableDetails?.actualLayers ||
//             prev.cuttingTableDetails?.planLayers ||
//             0
//         );
//         const multiplication = newTotalBundleQty * layersForCalc;
//         let calculatedBundleQtyCheck = 0;

//         if (multiplication > 35000) {
//           console.warn(
//             "Total Bundle Qty results in multiplication > 35000. Calculations might be inaccurate or capped."
//           );
//           // Retain previous values or set to a state indicating error/max
//           newState.bundleQtyCheck = prev.bundleQtyCheck || 0;
//           newState.totalInspectionQty = prev.totalInspectionQty || 0;
//         } else {
//           if (multiplication >= 1 && multiplication <= 150)
//             calculatedBundleQtyCheck = 2;
//           else if (multiplication >= 151 && multiplication <= 280)
//             calculatedBundleQtyCheck = 3;
//           else if (multiplication >= 281 && multiplication <= 500)
//             calculatedBundleQtyCheck = 4;
//           else if (multiplication >= 501 && multiplication <= 1200)
//             calculatedBundleQtyCheck = 6;
//           else if (multiplication >= 1201 && multiplication <= 3200)
//             calculatedBundleQtyCheck = 9;
//           else if (multiplication >= 3201 && multiplication <= 10000)
//             calculatedBundleQtyCheck = 14;
//           else if (multiplication >= 10001 && multiplication <= 35000)
//             calculatedBundleQtyCheck = 21;
//           // If multiplication is 0 or > 35000 (and not caught above), calculatedBundleQtyCheck remains 0

//           newState.bundleQtyCheck = calculatedBundleQtyCheck;
//           newState.totalInspectionQty = calculatedBundleQtyCheck * 15;
//         }
//       }
//       return newState;
//     });
//   };

//   const handleSaveGeneralInfo = async () => {
//     if (!editableRecord) return;

//     const layersForCalc =
//       editableRecord.cuttingTableDetails?.actualLayers ||
//       editableRecord.cuttingTableDetails?.planLayers ||
//       0;
//     if ((Number(editableRecord.totalBundleQty) || 0) * layersForCalc > 35000) {
//       Swal.fire({
//         icon: "warning",
//         title: t("cutting.invalidInput"),
//         text: t("cuttingReport.validation.totalBundleQtyTooHigh")
//       });
//       return;
//     }

//     setIsSaving(true);
//     try {
//       const payload = {
//         inspectionDate: editableRecord.inspectionDate,
//         orderQty: Number(editableRecord.orderQty) || 0,
//         totalBundleQty: Number(editableRecord.totalBundleQty) || 0,
//         bundleQtyCheck: Number(editableRecord.bundleQtyCheck) || 0,
//         totalInspectionQty: Number(editableRecord.totalInspectionQty) || 0
//       };

//       await axios.put(
//         `${API_BASE_URL}/api/cutting-inspection-general-update/${editableRecord._id}`,
//         payload
//       );
//       Swal.fire({
//         icon: "success",
//         title: t("cutting.success"),
//         text: t("cuttingReport.generalInfoUpdatedSuccess")
//       });
//       if (onRecordModified) onRecordModified();
//     } catch (error) {
//       console.error("Error saving general info:", error);
//       Swal.fire({
//         icon: "error",
//         title: t("cutting.error"),
//         text:
//           error.response?.data?.message ||
//           t("cuttingReport.failedToUpdateGeneralInfo")
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   if (!editableRecord) {
//     return (
//       <div className="mt-6 pt-6 border-t border-gray-300 text-center text-gray-500">
//         {t("cuttingReport.noRecordSelectedForModify")}
//       </div>
//     );
//   }

//   return (
//     <div className="mt-6 pt-6 border-t border-gray-300">
//       <h3 className="text-lg font-semibold text-indigo-700 mb-4">
//         {t("cuttingReport.modifyGeneralInfoTitle")}
//       </h3>
//       <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50 shadow space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
//           {/* Inspection Date */}
//           <div className="space-y-1">
//             <label
//               htmlFor="editInspDate"
//               className="block text-xs font-medium text-gray-700"
//             >
//               {t("cuttingReport.table.inspectionDate")}{" "}
//               <span className="text-red-500">*</span>
//             </label>
//             <div className="relative">
//               <DatePicker
//                 id="editInspDate"
//                 selected={editableRecord.inspectionDateObj}
//                 onChange={(date) =>
//                   handleGeneralInfoChange("inspectionDateObj", date)
//                 }
//                 dateFormat="MM/dd/yyyy"
//                 className={`${inputNormalStyle} py-2 px-3 w-full`}
//                 popperPlacement="bottom-start"
//               />
//               <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
//             </div>
//           </div>

//           {/* Order Qty */}
//           <div className="space-y-1">
//             <label
//               htmlFor="editOrderQty"
//               className="block text-xs font-medium text-gray-700"
//             >
//               {t("cuttingReport.table.orderQty")}
//             </label>
//             <input
//               id="editOrderQty"
//               type="number"
//               min="0"
//               value={
//                 editableRecord.orderQty === null ||
//                 editableRecord.orderQty === undefined
//                   ? ""
//                   : editableRecord.orderQty
//               }
//               onChange={(e) =>
//                 handleGeneralInfoChange("orderQty", e.target.value)
//               }
//               className={`${inputNormalStyle} py-2 px-3`}
//             />
//           </div>

//           {/* Total Bundle Qty */}
//           <div className="space-y-1">
//             <label
//               htmlFor="editTotalBundleQty"
//               className="block text-xs font-medium text-gray-700"
//             >
//               {t("cuttingReport.table.totalBundleQty")}{" "}
//               <span className="text-red-500">*</span>
//             </label>
//             <input
//               id="editTotalBundleQty"
//               type="number"
//               min="0"
//               value={
//                 editableRecord.totalBundleQty === null ||
//                 editableRecord.totalBundleQty === undefined
//                   ? ""
//                   : editableRecord.totalBundleQty
//               }
//               onChange={(e) =>
//                 handleGeneralInfoChange("totalBundleQty", e.target.value)
//               }
//               className={`${inputNormalStyle} py-2 px-3`}
//             />
//           </div>

//           {/* Bundle Qty Check (Readonly - Auto Calculated) */}
//           <div className="space-y-1">
//             <label
//               htmlFor="displayBundleQtyCheck"
//               className="block text-xs font-medium text-gray-700"
//             >
//               {t("cuttingReport.table.bundleQtyCheck")} (
//               {t("cuttingReport.autoCalculated")})
//             </label>
//             <input
//               id="displayBundleQtyCheck"
//               type="text"
//               value={
//                 editableRecord.bundleQtyCheck === null ||
//                 editableRecord.bundleQtyCheck === undefined
//                   ? "0"
//                   : editableRecord.bundleQtyCheck
//               }
//               readOnly
//               className={`${inputDisabledStyle} py-2 px-3`}
//             />
//           </div>

//           {/* Total Inspection Qty (Readonly - Auto Calculated) */}
//           <div className="space-y-1">
//             <label
//               htmlFor="displayTotalInspectionQty"
//               className="block text-xs font-medium text-gray-700"
//             >
//               {t("cuttingReport.table.totalInspectionQty")} (
//               {t("cuttingReport.autoCalculated")})
//             </label>
//             <input
//               id="displayTotalInspectionQty"
//               type="text"
//               value={
//                 editableRecord.totalInspectionQty === null ||
//                 editableRecord.totalInspectionQty === undefined
//                   ? "0"
//                   : editableRecord.totalInspectionQty
//               }
//               readOnly
//               className={`${inputDisabledStyle} py-2 px-3`}
//             />
//           </div>
//         </div>

//         <div className="mt-6 flex justify-end">
//           <button
//             onClick={handleSaveGeneralInfo}
//             disabled={isSaving}
//             className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400"
//           >
//             {isSaving ? (
//               <Loader2 size={18} className="animate-spin mr-2" />
//             ) : (
//               <Save size={18} className="mr-2" />
//             )}
//             {t("cuttingReport.saveGeneralInfo")}
//           </button>
//         </div>
//       </div>

//       <div className="mt-6 p-4 border rounded-lg bg-slate-100 text-center text-sm text-slate-500">
//         {t("cuttingReport.otherSectionsPlaceholder")}
//       </div>
//     </div>
//   );
// };

// export default CuttingInspectionEditData;

// src/components/inspection/cutting/CuttingInspectionEditData.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import {
  Save,
  Loader2,
  CalendarDays,
  PlusCircle,
  Trash2,
  AlertTriangle
} from "lucide-react";

// Helper to parse 'MM/DD/YYYY' string to Date object
const parseMMDDYYYYtoDate = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split("/");
  if (parts.length === 3) {
    return new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
  }
  const d = new Date(dateString);
  if (!isNaN(d.getTime())) return d;
  return null;
};

// Helper to format Date object to 'MM/DD/YYYY' string without leading zeros
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

  const inputBaseStyle = "block w-full text-sm rounded-md shadow-sm";
  const inputNormalStyle = `${inputBaseStyle} border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3`;
  const inputDisabledStyle = `${inputBaseStyle} bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500 py-2 px-3`;

  useEffect(() => {
    if (inspectionRecord) {
      setEditableRecord({
        ...inspectionRecord,
        inspectionDateObj: parseMMDDYYYYtoDate(inspectionRecord.inspectionDate),
        // Ensure mackerRatio has unique keys for React list rendering if not already present
        mackerRatio: (inspectionRecord.mackerRatio || []).map((ratio, idx) => ({
          ...ratio,
          _reactKey: ratio._id || `new-${idx}-${Date.now()}` // Use existing _id or generate temporary key
        })),
        // Ensure fabricDetails and cuttingTableDetails are objects even if null/undefined in DB
        fabricDetails: inspectionRecord.fabricDetails || {},
        cuttingTableDetails: inspectionRecord.cuttingTableDetails || {}
      });
    } else {
      setEditableRecord(null);
    }
  }, [inspectionRecord, componentKey]);

  // Generic handler for top-level fields and direct nested fields
  const handleFieldChange = (fieldPath, value) => {
    setEditableRecord((prev) => {
      if (!prev) return null;
      const pathParts = fieldPath.split(".");
      let newState = { ...prev };
      let currentLevel = newState;

      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!currentLevel[pathParts[i]]) currentLevel[pathParts[i]] = {}; // Create nested object if it doesn't exist
        currentLevel = currentLevel[pathParts[i]];
      }
      currentLevel[pathParts[pathParts.length - 1]] = value;

      // Special handling for date
      if (fieldPath === "inspectionDateObj") {
        newState.inspectionDate = formatDateToMMDDYYYYNoLeading(value);
      }

      // Auto-calculation logic (moved here for directness when totalBundleQty or layers change)
      if (
        fieldPath === "totalBundleQty" ||
        fieldPath === "cuttingTableDetails.actualLayers" ||
        fieldPath === "cuttingTableDetails.planLayers"
      ) {
        const newTotalBundleQty =
          Number(
            fieldPath === "totalBundleQty" ? value : newState.totalBundleQty
          ) || 0;
        const actualLayers =
          Number(
            fieldPath === "cuttingTableDetails.actualLayers"
              ? value
              : newState.cuttingTableDetails.actualLayers
          ) || 0;
        const planLayers =
          Number(
            fieldPath === "cuttingTableDetails.planLayers"
              ? value
              : newState.cuttingTableDetails.planLayers
          ) || 0;

        const layersForCalc = actualLayers > 0 ? actualLayers : planLayers; // Prioritize actualLayers
        newState.totalBundleQty = newTotalBundleQty; // Ensure this is updated if it's the field being changed

        const multiplication = newTotalBundleQty * layersForCalc;
        let calculatedBundleQtyCheck = 0;

        if (multiplication > 35000) {
          console.warn(
            "Multiplication > 35000. Calculations might be capped or inaccurate."
          );
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

          newState.bundleQtyCheck = calculatedBundleQtyCheck;
          newState.totalInspectionQty = calculatedBundleQtyCheck * 15;
        }
      }
      return newState;
    });
  };

  // Marker Ratio Handlers
  const handleMackerRatioChange = (index, field, value) => {
    setEditableRecord((prev) => {
      if (!prev || !prev.mackerRatio) return prev;
      const newMackerRatio = prev.mackerRatio.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            [field]: field === "ratio" ? Number(value) : value
          };
        }
        return item;
      });
      return { ...prev, mackerRatio: newMackerRatio };
    });
  };

  const addMackerRatioRow = () => {
    setEditableRecord((prev) => {
      if (!prev) return null;
      const newIndex = prev.mackerRatio ? prev.mackerRatio.length + 1 : 1;
      return {
        ...prev,
        mackerRatio: [
          ...(prev.mackerRatio || []),
          {
            index: newIndex,
            markerSize: "",
            ratio: null,
            _reactKey: `new-${Date.now()}`
          }
        ]
      };
    });
  };

  const removeMackerRatioRow = (reactKeyToRemove) => {
    setEditableRecord((prev) => {
      if (!prev || !prev.mackerRatio) return prev;
      const newMackerRatio = prev.mackerRatio
        .filter((item) => item._reactKey !== reactKeyToRemove)
        .map((item, idx) => ({ ...item, index: idx + 1 })); // Re-index after removal
      return { ...prev, mackerRatio: newMackerRatio };
    });
  };

  // Master Save Function
  const handleMasterSave = async () => {
    if (!editableRecord) return;

    const layersForCalc = parseFloat(
      editableRecord.cuttingTableDetails?.actualLayers ||
        editableRecord.cuttingTableDetails?.planLayers ||
        0
    );
    if (
      (Number(editableRecord.totalBundleQty) || 0) * layersForCalc > 35000 &&
      editableRecord.totalBundleQty > 0
    ) {
      // check if totalBundleQty is >0 to avoid false alarm
      Swal.fire({
        icon: "warning",
        title: t("cutting.invalidInput"),
        text: t("cuttingReport.validation.totalBundleQtyTooHigh")
      });
      return;
    }
    // Add more validation as needed for other sections

    setIsSaving(true);
    try {
      // Prepare payload, ensuring only relevant data is sent and _reactKey is removed from mackerRatio
      const payload = {
        inspectionDate: editableRecord.inspectionDate,
        orderQty: Number(editableRecord.orderQty) || 0,
        totalBundleQty: Number(editableRecord.totalBundleQty) || 0,
        bundleQtyCheck: Number(editableRecord.bundleQtyCheck) || 0,
        totalInspectionQty: Number(editableRecord.totalInspectionQty) || 0,
        fabricDetails: {
          fabricType: editableRecord.fabricDetails.fabricType || "",
          material: editableRecord.fabricDetails.material || "",
          rollQty: Number(editableRecord.fabricDetails.rollQty) || null,
          spreadYds: Number(editableRecord.fabricDetails.spreadYds) || null,
          unit: editableRecord.fabricDetails.unit || "",
          grossKgs: Number(editableRecord.fabricDetails.grossKgs) || null,
          netKgs: Number(editableRecord.fabricDetails.netKgs) || null,
          totalTTLRoll:
            Number(editableRecord.fabricDetails.totalTTLRoll) || null
        },
        cuttingTableDetails: {
          // PlanLayers and ActualLayers are part of what's fetched, not directly edited here
          spreadTable: editableRecord.cuttingTableDetails.spreadTable || "",
          spreadTableNo: editableRecord.cuttingTableDetails.spreadTableNo || "",
          planLayers: editableRecord.cuttingTableDetails.planLayers, // Sent back as is
          actualLayers: editableRecord.cuttingTableDetails.actualLayers, // Sent back as is
          totalPcs: editableRecord.cuttingTableDetails.totalPcs, // This should also be auto-calculated based on layers and ratio
          mackerNo: editableRecord.cuttingTableDetails.mackerNo || "",
          mackerLength:
            Number(editableRecord.cuttingTableDetails.mackerLength) || null
        },
        mackerRatio: editableRecord.mackerRatio.map(
          ({ _reactKey, ...ratio }) => ({
            ...ratio,
            index: Number(ratio.index),
            ratio: Number(ratio.ratio) || 0
          })
        )
        // Add other sections if they become editable
      };

      // Endpoint needs to be able to handle partial updates or update the whole document structure
      await axios.put(
        `${API_BASE_URL}/api/cutting-inspection-full-update/${editableRecord._id}`,
        payload
      ); // NEW Endpoint
      Swal.fire({
        icon: "success",
        title: t("cutting.success"),
        text: t(
          "cuttingReport.recordModifiedSuccess",
          "Inspection record updated successfully."
        )
      });
      if (onRecordModified) onRecordModified();
    } catch (error) {
      console.error("Error saving inspection record:", error);
      Swal.fire({
        icon: "error",
        title: t("cutting.error"),
        text:
          error.response?.data?.message ||
          t(
            "cuttingReport.failedToUpdateRecordFull",
            "Failed to update inspection record."
          )
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

  const fabricDetailFields = [
    {
      field: "fabricType",
      labelKey: "cuttingReport.table.fabricType",
      type: "text"
    },
    {
      field: "material",
      labelKey: "cuttingReport.table.material",
      type: "text"
    },
    {
      field: "rollQty",
      labelKey: "cuttingReport.table.rollQty",
      type: "number"
    },
    {
      field: "spreadYds",
      labelKey: "cuttingReport.table.spreadYds",
      type: "number"
    },
    { field: "unit", labelKey: "cuttingReport.table.unit", type: "text" },
    {
      field: "grossKgs",
      labelKey: "cuttingReport.table.grossKgs",
      type: "number"
    },
    { field: "netKgs", labelKey: "cuttingReport.table.netKgs", type: "number" },
    {
      field: "totalTTLRoll",
      labelKey: "cuttingReport.table.totalTTLRoll",
      type: "number"
    }
  ];

  const cuttingTableDetailFields = [
    {
      field: "spreadTable",
      labelKey: "cuttingReport.table.spreadTable",
      type: "text"
    },
    {
      field: "spreadTableNo",
      labelKey: "cuttingReport.table.spreadTableNo",
      type: "text"
    },
    {
      field: "planLayers",
      labelKey: "cuttingReport.table.planLayers",
      type: "number",
      readOnly: true
    },
    {
      field: "actualLayers",
      labelKey: "cuttingReport.table.actualLayers",
      type: "number",
      readOnly: true
    },
    // totalPcs is usually calculated: layers * sum of ratios
    {
      field: "totalPcs",
      labelKey: "cuttingReport.table.totalPcs",
      type: "number",
      readOnly: true,
      value: editableRecord.cuttingTableDetails?.totalPcs
    },
    {
      field: "mackerNo",
      labelKey: "cuttingReport.table.mackerNo",
      type: "text"
    },
    {
      field: "mackerLength",
      labelKey: "cuttingReport.table.mackerLength",
      type: "number"
    }
  ];

  return (
    <div className="mt-6 pt-6 border-t border-gray-300 space-y-8">
      {/* General Info Section */}
      <div>
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          {t("cuttingReport.modifyGeneralInfoTitle")}
        </h3>
        <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50 shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
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
                    handleFieldChange("inspectionDateObj", date)
                  }
                  dateFormat="MM/dd/yyyy"
                  className={`${inputNormalStyle} py-2 px-3 w-full`}
                  popperPlacement="bottom-start"
                />
                <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
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
                value={editableRecord.orderQty ?? ""}
                onChange={(e) => handleFieldChange("orderQty", e.target.value)}
                className={`${inputNormalStyle} py-2 px-3`}
              />
            </div>
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
                value={editableRecord.totalBundleQty ?? ""}
                onChange={(e) =>
                  handleFieldChange("totalBundleQty", e.target.value)
                }
                className={`${inputNormalStyle} py-2 px-3`}
              />
            </div>
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
                value={editableRecord.bundleQtyCheck ?? "0"}
                readOnly
                className={`${inputDisabledStyle} py-2 px-3`}
              />
            </div>
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
                value={editableRecord.totalInspectionQty ?? "0"}
                readOnly
                className={`${inputDisabledStyle} py-2 px-3`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fabric Details Section */}
      <div>
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          {t("cuttingReport.modifyFabricDetailsTitle", "Modify Fabric Details")}
        </h3>
        <div className="p-4 border border-sky-200 rounded-lg bg-sky-50 shadow">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {fabricDetailFields.map((item) => (
              <div key={item.field} className="space-y-1">
                <label
                  htmlFor={`fabric-${item.field}`}
                  className="block text-xs font-medium text-gray-700"
                >
                  {t(item.labelKey)}
                </label>
                <input
                  id={`fabric-${item.field}`}
                  type={item.type}
                  value={
                    editableRecord.fabricDetails[item.field] ??
                    (item.type === "number" ? "" : "")
                  }
                  onChange={(e) =>
                    handleFieldChange(
                      `fabricDetails.${item.field}`,
                      item.type === "number"
                        ? e.target.value === ""
                          ? null
                          : Number(e.target.value)
                        : e.target.value
                    )
                  }
                  className={`${inputNormalStyle} py-2 px-3`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cutting Table Details Section */}
      <div>
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          {t(
            "cuttingReport.modifyCuttingTableTitle",
            "Modify Cutting Table Details"
          )}
        </h3>
        <div className="p-4 border border-green-200 rounded-lg bg-green-50 shadow">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cuttingTableDetailFields.map((item) => (
              <div key={item.field} className="space-y-1">
                <label
                  htmlFor={`cuttingTable-${item.field}`}
                  className="block text-xs font-medium text-gray-700"
                >
                  {t(item.labelKey)}
                </label>
                <input
                  id={`cuttingTable-${item.field}`}
                  type={item.type}
                  value={
                    item.readOnly
                      ? editableRecord.cuttingTableDetails[item.field] ??
                        (item.type === "number" ? "0" : "")
                      : editableRecord.cuttingTableDetails[item.field] ??
                        (item.type === "number" ? "" : "")
                  }
                  onChange={(e) =>
                    !item.readOnly &&
                    handleFieldChange(
                      `cuttingTableDetails.${item.field}`,
                      item.type === "number"
                        ? e.target.value === ""
                          ? null
                          : Number(e.target.value)
                        : e.target.value
                    )
                  }
                  readOnly={item.readOnly}
                  className={`${
                    item.readOnly ? inputDisabledStyle : inputNormalStyle
                  } py-2 px-3`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marker Ratio Section */}
      <div>
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          {t("cuttingReport.modifyMarkerRatioTitle", "Modify Marker Ratio")}
        </h3>
        <div className="p-4 border border-purple-200 rounded-lg bg-purple-50 shadow">
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full text-sm">
              <thead className="bg-purple-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-800 uppercase">
                    {t("cuttingReport.table.markerIndex", "No.")}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-800 uppercase">
                    {t("cuttingReport.table.markerSize", "Marker Size")}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-800 uppercase">
                    {t("cuttingReport.table.ratio", "Ratio")}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-800 uppercase">
                    {t("scc.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-purple-200">
                {(editableRecord.mackerRatio || []).map((ratioItem, index) => (
                  <tr key={ratioItem._reactKey}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {ratioItem.index}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={ratioItem.markerSize || ""}
                        onChange={(e) =>
                          handleMackerRatioChange(
                            index,
                            "markerSize",
                            e.target.value
                          )
                        }
                        className={`${inputNormalStyle} text-xs py-1`}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        value={ratioItem.ratio ?? ""}
                        onChange={(e) =>
                          handleMackerRatioChange(
                            index,
                            "ratio",
                            e.target.value
                          )
                        }
                        className={`${inputNormalStyle} text-xs py-1 w-20`}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        onClick={() =>
                          removeMackerRatioRow(ratioItem._reactKey)
                        }
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                        title={t("cutting.removeRow", "Remove Row")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={addMackerRatioRow}
            className="flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700 transition-colors"
          >
            <PlusCircle size={16} className="mr-1.5" />
            {t("cuttingReport.addMarkerRatioRow", "Add Ratio Row")}
          </button>
        </div>
      </div>

      {/* Master Save Button */}
      <div className="mt-8 pt-6 border-t border-gray-300 flex justify-end">
        <button
          onClick={handleMasterSave}
          disabled={isSaving}
          className="flex items-center px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {isSaving ? (
            <Loader2 size={18} className="animate-spin mr-2" />
          ) : (
            <Save size={18} className="mr-2" />
          )}
          {t("cuttingReport.saveAllModifications", "Save All Modifications")}
        </button>
      </div>
    </div>
  );
};

export default CuttingInspectionEditData;
