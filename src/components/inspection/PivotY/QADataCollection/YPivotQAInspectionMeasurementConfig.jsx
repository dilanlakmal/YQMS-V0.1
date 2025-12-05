// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";
// import {
//   Ruler,
//   Loader2,
//   Maximize2,
//   AlertCircle,
//   Settings,
//   BarChart3,
//   CheckCircle2,
//   Lock,
//   Unlock,
//   AlertTriangle
// } from "lucide-react";
// import { API_BASE_URL } from "../../../../../config";

// // Import Sub-Components
// import YPivotQATemplatesSpecsConfigModal from "../QATemplates/YPivotQATemplatesSpecsConfigModal";
// import YPivotQATemplatesMeasurementGridModal from "../QATemplates/YPivotQATemplatesMeasurementGridModal";
// import YPivotQATemplatesMeasurementResultsTab from "../QATemplates/YPivotQATemplatesMeasurementResultsTab";

// const YPivotQAInspectionMeasurementConfig = ({
//   selectedOrders,
//   orderData,
//   reportData,
//   onUpdateMeasurementData // Sync prop from Parent
// }) => {
//   // --- Derived Props ---
//   const activeMoNo =
//     selectedOrders && selectedOrders.length > 0 ? selectedOrders[0] : null;
//   const activeReportTemplate = reportData?.selectedTemplate;
//   const measConfig = activeReportTemplate?.Measurement || "No";

//   // Access saved measurement state from parent (persistence)
//   const savedState = reportData?.measurementData || {};

//   // --- Internal Navigation State ---
//   const [internalTab, setInternalTab] = useState("specs");

//   // --- Loading State ---
//   const [loading, setLoading] = useState(false);
//   const [initialLoadDone, setInitialLoadDone] = useState(false);

//   // --- Data State (Restored from Parent if available) ---
//   const [fullSpecsList, setFullSpecsList] = useState(
//     savedState.fullSpecsList || []
//   );
//   const [selectedSpecsList, setSelectedSpecsList] = useState(
//     savedState.selectedSpecsList || []
//   );
//   const [sourceType, setSourceType] = useState(savedState.sourceType || "");
//   const [isConfigured, setIsConfigured] = useState(
//     savedState.isConfigured || false
//   );
//   const [savedMeasurements, setSavedMeasurements] = useState(
//     savedState.savedMeasurements || []
//   );
//   const [orderSizes, setOrderSizes] = useState(savedState.orderSizes || []);
//   const [kValuesList, setKValuesList] = useState(savedState.kValuesList || []);

//   // --- Selection State ---
//   const [selectedSize, setSelectedSize] = useState("");
//   const [selectedKValue, setSelectedKValue] = useState("");
//   const [displayMode, setDisplayMode] = useState("selected");

//   // --- Modal State ---
//   const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
//   const [isGridOpen, setIsGridOpen] = useState(false);
//   const [editingMeasurementIndex, setEditingMeasurementIndex] = useState(null);
//   const [editingMeasurementData, setEditingMeasurementData] = useState(null);

//   // ==========================================================================
//   // SYNC HELPER
//   // ==========================================================================
//   const updateParent = (updates) => {
//     if (onUpdateMeasurementData) {
//       onUpdateMeasurementData({
//         fullSpecsList,
//         selectedSpecsList,
//         sourceType,
//         isConfigured,
//         savedMeasurements,
//         orderSizes,
//         kValuesList,
//         ...updates
//       });
//     }
//   };

//   // ==========================================================================
//   // EFFECTS
//   // ==========================================================================

//   // Auto-Load Data
//   useEffect(() => {
//     if (!activeMoNo || !activeReportTemplate || measConfig === "No") {
//       setInitialLoadDone(true);
//       return;
//     }

//     // If data already exists in savedState, skip fetching to preserve state
//     if (savedState.fullSpecsList && savedState.fullSpecsList.length > 0) {
//       setInitialLoadDone(true);
//       return;
//     }

//     // New Load
//     const initData = async () => {
//       const sizes = extractSizesFromOrderData();
//       setOrderSizes(sizes);
//       await fetchMeasurementSpecs(measConfig, activeMoNo, sizes);
//     };

//     initData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [activeMoNo, activeReportTemplate?._id]);

//   // ==========================================================================
//   // LOGIC
//   // ==========================================================================

//   const extractSizesFromOrderData = () => {
//     if (!orderData) return [];
//     const allSizes = new Set();

//     if (orderData.orderBreakdowns && Array.isArray(orderData.orderBreakdowns)) {
//       orderData.orderBreakdowns.forEach((breakdown) => {
//         if (breakdown.colorSizeBreakdown?.sizeList) {
//           breakdown.colorSizeBreakdown.sizeList.forEach((s) => allSizes.add(s));
//         }
//       });
//     } else if (orderData.colorSizeBreakdown?.sizeList) {
//       orderData.colorSizeBreakdown.sizeList.forEach((s) => allSizes.add(s));
//     } else if (orderData.dtOrder?.sizeList) {
//       orderData.dtOrder.sizeList.forEach((s) => allSizes.add(s));
//     }

//     return Array.from(allSizes);
//   };

//   const fetchMeasurementSpecs = async (type, moNo, currentSizes) => {
//     setLoading(true);
//     const endpoint =
//       type === "Before"
//         ? `/api/qa-sections/measurement-specs/${moNo}`
//         : `/api/qa-sections/measurement-specs-aw/${moNo}`;

//     try {
//       const res = await axios.get(`${API_BASE_URL}${endpoint}`);
//       const { source, data } = res.data;

//       const newSourceType = source;
//       const newIsConfigured = source === "qa_sections";
//       let all = [];
//       let selected = [];
//       let newKValues = [];

//       if (type === "Before") {
//         all = data.AllBeforeWashSpecs || [];
//         selected = data.selectedBeforeWashSpecs || [];
//         const kSet = new Set(
//           all.map((s) => s.kValue).filter((k) => k && k !== "NA")
//         );
//         newKValues = Array.from(kSet).sort();
//       } else {
//         all = data.AllAfterWashSpecs || [];
//         selected = data.selectedAfterWashSpecs || [];
//       }

//       const finalList =
//         source === "qa_sections" && selected.length > 0 ? selected : all;

//       setSourceType(newSourceType);
//       setIsConfigured(newIsConfigured);
//       setFullSpecsList(all);
//       setSelectedSpecsList(finalList);
//       setKValuesList(newKValues);

//       updateParent({
//         sourceType: newSourceType,
//         isConfigured: newIsConfigured,
//         fullSpecsList: all,
//         selectedSpecsList: finalList,
//         kValuesList: newKValues,
//         orderSizes: currentSizes
//       });
//     } catch (error) {
//       console.error("Error fetching specs:", error);
//     } finally {
//       setLoading(false);
//       setInitialLoadDone(true);
//     }
//   };

//   // ==========================================================================
//   // HANDLERS
//   // ==========================================================================

//   const handleSaveConfig = async (selectedIds) => {
//     const filtered = fullSpecsList.filter((s) => selectedIds.includes(s.id));

//     setSelectedSpecsList(filtered);
//     setIsConfigured(true);
//     setSourceType("qa_sections");

//     updateParent({
//       selectedSpecsList: filtered,
//       isConfigured: true,
//       sourceType: "qa_sections"
//     });

//     const endpoint =
//       measConfig === "Before"
//         ? `/api/qa-sections/measurement-specs/save`
//         : `/api/qa-sections/measurement-specs-aw/save`;

//     const payload = {
//       moNo: activeMoNo,
//       allSpecs: fullSpecsList,
//       selectedSpecs: filtered,
//       isSaveAll: false
//     };

//     try {
//       await axios.post(`${API_BASE_URL}${endpoint}`, payload);
//     } catch (e) {
//       console.error("Failed to save config", e);
//       alert("Failed to save configuration to server.");
//     }
//   };

//   const handleSaveMeasurement = (data) => {
//     let updatedMeasurements;
//     if (editingMeasurementIndex !== null) {
//       updatedMeasurements = [...savedMeasurements];
//       updatedMeasurements[editingMeasurementIndex] = {
//         ...data,
//         displayMode: displayMode
//       };
//       setEditingMeasurementIndex(null);
//       setEditingMeasurementData(null);
//     } else {
//       updatedMeasurements = [
//         ...savedMeasurements,
//         {
//           ...data,
//           displayMode: displayMode
//         }
//       ];
//     }

//     setSavedMeasurements(updatedMeasurements);
//     updateParent({ savedMeasurements: updatedMeasurements });

//     // Reset selection after save
//     if (editingMeasurementIndex === null) {
//       setSelectedSize("");
//       // Don't reset K Value to allow easy next size selection
//     }
//   };

//   const handleEditMeasurement = (measurement, index) => {
//     setEditingMeasurementIndex(index);
//     setEditingMeasurementData(measurement);
//     setSelectedSize(measurement.size);
//     setSelectedKValue(measurement.kValue || "");
//     setDisplayMode(measurement.displayMode || "selected");
//     setIsGridOpen(true);
//   };

//   // --- NEW: Delete Handler ---
//   const handleDeleteMeasurement = (index) => {
//     // Confirm deletion
//     if (!window.confirm("Are you sure you want to delete this measurement?")) {
//       return;
//     }

//     const updatedMeasurements = [...savedMeasurements];
//     updatedMeasurements.splice(index, 1);

//     setSavedMeasurements(updatedMeasurements);
//     updateParent({ savedMeasurements: updatedMeasurements });
//   };

//   const handleStartMeasuring = () => {
//     setEditingMeasurementIndex(null);
//     setEditingMeasurementData(null);
//     setIsGridOpen(true);
//   };

//   // ==========================================================================
//   // HELPER: CHECK IF SIZE IS COMPLETED (Disable in Dropdown)
//   // ==========================================================================
//   const isSizeDisabled = (size) => {
//     if (measConfig !== "Before") {
//       // For After Wash or No K, simple check on size
//       return savedMeasurements.some((m) => m.size === size);
//     } else {
//       // For Before Wash, we need Size + K Value combination
//       // If no K value selected yet, we can't disable size (as it might be available for other K)
//       if (!selectedKValue) return false;
//       return savedMeasurements.some(
//         (m) => m.size === size && m.kValue === selectedKValue
//       );
//     }
//   };

//   // ==========================================================================
//   // RENDER
//   // ==========================================================================

//   const canSelectSizeAndK = isConfigured || sourceType === "qa_sections";
//   const needsKValue = measConfig === "Before" && kValuesList.length > 0;
//   const canStartMeasuring = selectedSize && (!needsKValue || selectedKValue);

//   if (!activeMoNo)
//     return (
//       <div className="p-8 text-center bg-white rounded-xl shadow">
//         No Order Selected
//       </div>
//     );
//   if (!activeReportTemplate)
//     return (
//       <div className="p-8 text-center bg-white rounded-xl shadow">
//         No Report Type Selected
//       </div>
//     );
//   if (measConfig === "No")
//     return (
//       <div className="p-8 text-center bg-white rounded-xl shadow">
//         Measurement Not Required
//       </div>
//     );
//   if (loading && !initialLoadDone)
//     return (
//       <div className="p-12 text-center">
//         <Loader2 className="animate-spin inline w-8 h-8" />
//       </div>
//     );

//   return (
//     <div className="space-y-4 animate-fadeIn">
//       {/* Header - ORIGINAL STYLING PRESERVED */}
//       <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
//             <Ruler className="w-5 h-5 text-indigo-500" />
//             Measurement: {measConfig} Wash
//           </h3>
//           <p className="text-xs text-gray-500 mt-1">
//             Order:{" "}
//             <span className="font-mono text-indigo-600 dark:text-indigo-400">
//               {activeMoNo}
//             </span>{" "}
//             • {selectedSpecsList.length} Points Configured
//           </p>
//         </div>

//         {/* Tab Buttons - ORIGINAL STYLING PRESERVED */}
//         <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
//           <button
//             onClick={() => setInternalTab("specs")}
//             className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
//               internalTab === "specs"
//                 ? "bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300"
//                 : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
//             }`}
//           >
//             Setup & Measure
//           </button>
//           <button
//             onClick={() => setInternalTab("results")}
//             className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
//               internalTab === "results"
//                 ? "bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300"
//                 : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
//             }`}
//           >
//             Results
//             {savedMeasurements.length > 0 && (
//               <span className="bg-indigo-500 text-white text-[9px] px-1.5 rounded-full">
//                 {savedMeasurements.length}
//               </span>
//             )}
//           </button>
//         </div>
//       </div>

//       {!isConfigured && sourceType === "dt_orders" && (
//         <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
//           <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
//           <div>
//             <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
//               Action Required
//             </p>
//             <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
//               Please configure measurement points specific to this order before
//               starting.
//             </p>
//           </div>
//         </div>
//       )}

//       {/* --- CONTENT: SPECS TAB --- */}
//       {internalTab === "specs" && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//           <div className="lg:col-span-1 space-y-4">
//             <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
//               <div className="flex justify-between items-center mb-4">
//                 <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">
//                   Setup
//                 </h4>
//                 <button
//                   onClick={() => setIsConfigModalOpen(true)}
//                   className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-medium flex items-center gap-1"
//                 >
//                   <Settings className="w-3 h-3" /> Configure
//                 </button>
//               </div>

//               <div className="space-y-4">
//                 {/* K Value (Conditional) */}
//                 {measConfig === "Before" && kValuesList.length > 0 && (
//                   <div>
//                     <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-2">
//                       K Value
//                       {canSelectSizeAndK ? (
//                         <Unlock className="w-3 h-3 text-green-500" />
//                       ) : (
//                         <Lock className="w-3 h-3 text-gray-400" />
//                       )}
//                     </label>
//                     <select
//                       value={selectedKValue}
//                       onChange={(e) => {
//                         setSelectedKValue(e.target.value);
//                         setSelectedSize(""); // Reset size when K changes
//                       }}
//                       disabled={!canSelectSizeAndK}
//                       className={`w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
//                         !canSelectSizeAndK
//                           ? "opacity-50 cursor-not-allowed"
//                           : ""
//                       }`}
//                     >
//                       <option value="">-- Select K --</option>
//                       {kValuesList.map((k) => (
//                         <option key={k} value={k}>
//                           {k}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 )}

//                 {/* Size Selection */}
//                 <div>
//                   <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-2">
//                     Size
//                     {canSelectSizeAndK ? (
//                       <Unlock className="w-3 h-3 text-green-500" />
//                     ) : (
//                       <Lock className="w-3 h-3 text-gray-400" />
//                     )}
//                   </label>
//                   <select
//                     value={selectedSize}
//                     onChange={(e) => setSelectedSize(e.target.value)}
//                     disabled={!canSelectSizeAndK}
//                     className={`w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
//                       !canSelectSizeAndK ? "opacity-50 cursor-not-allowed" : ""
//                     }`}
//                   >
//                     <option value="">-- Select Size --</option>
//                     {orderSizes.map((s) => {
//                       const disabled = isSizeDisabled(s);
//                       return (
//                         <option
//                           key={s}
//                           value={s}
//                           disabled={disabled}
//                           className={
//                             disabled
//                               ? "text-gray-400 bg-gray-100 dark:bg-gray-800"
//                               : ""
//                           }
//                         >
//                           {s} {disabled ? "(Completed)" : ""}
//                         </option>
//                       );
//                     })}
//                   </select>
//                 </div>

//                 {/* Display Mode Toggle - ORIGINAL STYLING */}
//                 <div className="pt-2">
//                   <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
//                     <button
//                       onClick={() => setDisplayMode("selected")}
//                       className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
//                         displayMode === "selected"
//                           ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
//                           : "text-gray-500 dark:text-gray-400"
//                       }`}
//                     >
//                       Selected ({selectedSpecsList.length})
//                     </button>
//                     <button
//                       onClick={() => setDisplayMode("all")}
//                       className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
//                         displayMode === "all"
//                           ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
//                           : "text-gray-500 dark:text-gray-400"
//                       }`}
//                     >
//                       All ({fullSpecsList.length})
//                     </button>
//                   </div>
//                 </div>

//                 <button
//                   onClick={handleStartMeasuring}
//                   disabled={!canStartMeasuring || !canSelectSizeAndK}
//                   className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
//                 >
//                   <Maximize2 className="w-4 h-4" /> Start Measuring
//                 </button>
//               </div>
//             </div>
//           </div>

//           <div className="lg:col-span-2">
//             <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-full max-h-[500px] flex flex-col">
//               <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
//                 <CheckCircle2 className="w-4 h-4 text-green-500" />
//                 Active Points Preview
//               </h4>

//               <div className="flex-1 overflow-y-auto pr-2 space-y-2">
//                 {selectedSpecsList.length > 0 ? (
//                   selectedSpecsList.map((spec, idx) => (
//                     <div
//                       key={spec.id || idx}
//                       className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700"
//                     >
//                       <div className="min-w-0">
//                         <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
//                           {spec.MeasurementPointEngName}
//                         </p>
//                         <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
//                           {spec.MeasurementPointTurName || spec.Description}
//                         </p>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         {spec.kValue && spec.kValue !== "NA" && (
//                           <span className="text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-800">
//                             K: {spec.kValue}
//                           </span>
//                         )}
//                         {spec.Tolerance && (
//                           <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
//                             ±{spec.Tolerance}
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <div className="h-32 flex items-center justify-center text-gray-400 text-sm italic">
//                     No measurement points configured.
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* --- RESULTS TAB --- */}
//       {internalTab === "results" && (
//         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
//           <YPivotQATemplatesMeasurementResultsTab
//             savedMeasurements={savedMeasurements}
//             // Pass full specs to ensure accurate calculations
//             specsData={fullSpecsList}
//             onEditMeasurement={handleEditMeasurement}
//             // Pass the delete handler
//             onDeleteMeasurement={handleDeleteMeasurement}
//           />
//         </div>
//       )}

//       {/* --- MODALS --- */}
//       <YPivotQATemplatesSpecsConfigModal
//         isOpen={isConfigModalOpen}
//         onClose={() => setIsConfigModalOpen(false)}
//         specsData={fullSpecsList}
//         selectedSpecsIds={selectedSpecsList.map((s) => s.id)}
//         measType={measConfig}
//         onSaveConfig={handleSaveConfig}
//       />

//       <YPivotQATemplatesMeasurementGridModal
//         isOpen={isGridOpen}
//         onClose={() => {
//           setIsGridOpen(false);
//           setEditingMeasurementIndex(null);
//           setEditingMeasurementData(null);
//         }}
//         specsData={displayMode === "all" ? fullSpecsList : selectedSpecsList}
//         selectedSize={selectedSize}
//         selectedKValue={selectedKValue}
//         displayMode={displayMode}
//         measType={measConfig}
//         onSave={handleSaveMeasurement}
//         initialQty={editingMeasurementData?.qty || 3}
//         editingData={editingMeasurementData}
//         isEditing={editingMeasurementIndex !== null}
//       />
//     </div>
//   );
// };

// export default YPivotQAInspectionMeasurementConfig;

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Ruler,
  Loader2,
  Maximize2,
  AlertCircle,
  Settings,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Play
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// Import Sub-Components
import YPivotQATemplatesSpecsConfigModal from "../QATemplates/YPivotQATemplatesSpecsConfigModal";
import YPivotQATemplatesMeasurementGridModal from "../QATemplates/YPivotQATemplatesMeasurementGridModal";
import YPivotQATemplatesMeasurementResultsTab from "../QATemplates/YPivotQATemplatesMeasurementResultsTab";

const YPivotQAInspectionMeasurementConfig = ({
  selectedOrders,
  orderData,
  reportData,
  onUpdateMeasurementData, // Sync prop from Parent
  activeGroup // NEW: Prop from parent to know which line/table is active
}) => {
  // --- Derived Props ---
  const activeMoNo =
    selectedOrders && selectedOrders.length > 0 ? selectedOrders[0] : null;
  const activeReportTemplate = reportData?.selectedTemplate;
  const measConfig = activeReportTemplate?.Measurement || "No";

  // Access saved measurement state from parent
  const savedState = reportData?.measurementData || {};

  // --- Internal Navigation State ---
  const [internalTab, setInternalTab] = useState("specs");

  // --- Loading State ---
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // --- Data State (Restored from Parent if available) ---
  const [fullSpecsList, setFullSpecsList] = useState(
    savedState.fullSpecsList || []
  );
  const [selectedSpecsList, setSelectedSpecsList] = useState(
    savedState.selectedSpecsList || []
  );
  const [sourceType, setSourceType] = useState(savedState.sourceType || "");
  const [isConfigured, setIsConfigured] = useState(
    savedState.isConfigured || false
  );
  const [savedMeasurements, setSavedMeasurements] = useState(
    savedState.savedMeasurements || []
  );
  const [orderSizes, setOrderSizes] = useState(savedState.orderSizes || []);
  const [kValuesList, setKValuesList] = useState(savedState.kValuesList || []);

  // --- Selection State ---
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedKValue, setSelectedKValue] = useState("");
  const [displayMode, setDisplayMode] = useState("selected");

  // --- Modal State ---
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [editingMeasurementIndex, setEditingMeasurementIndex] = useState(null);
  const [editingMeasurementData, setEditingMeasurementData] = useState(null);

  // ==========================================================================
  // SYNC HELPER
  // ==========================================================================
  const updateParent = (updates) => {
    if (onUpdateMeasurementData) {
      onUpdateMeasurementData({
        fullSpecsList,
        selectedSpecsList,
        sourceType,
        isConfigured,
        savedMeasurements,
        orderSizes,
        kValuesList,
        ...updates
      });
    }
  };

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Auto-Load Data
  useEffect(() => {
    if (!activeMoNo || !activeReportTemplate || measConfig === "No") {
      setInitialLoadDone(true);
      return;
    }

    if (savedState.fullSpecsList && savedState.fullSpecsList.length > 0) {
      setInitialLoadDone(true);
      return;
    }

    const initData = async () => {
      const sizes = extractSizesFromOrderData();
      setOrderSizes(sizes);
      await fetchMeasurementSpecs(measConfig, activeMoNo, sizes);
    };

    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMoNo, activeReportTemplate?._id]);

  // Reset selection if active group changes (to ensure data consistency)
  useEffect(() => {
    setSelectedSize("");
    // We don't reset K Value necessarily, but good to ensure user selects afresh
  }, [activeGroup?.id]);

  // ==========================================================================
  // LOGIC
  // ==========================================================================

  const extractSizesFromOrderData = () => {
    if (!orderData) return [];
    const allSizes = new Set();

    if (orderData.orderBreakdowns && Array.isArray(orderData.orderBreakdowns)) {
      orderData.orderBreakdowns.forEach((breakdown) => {
        if (breakdown.colorSizeBreakdown?.sizeList) {
          breakdown.colorSizeBreakdown.sizeList.forEach((s) => allSizes.add(s));
        }
      });
    } else if (orderData.colorSizeBreakdown?.sizeList) {
      orderData.colorSizeBreakdown.sizeList.forEach((s) => allSizes.add(s));
    } else if (orderData.dtOrder?.sizeList) {
      orderData.dtOrder.sizeList.forEach((s) => allSizes.add(s));
    }

    return Array.from(allSizes);
  };

  const fetchMeasurementSpecs = async (type, moNo, currentSizes) => {
    setLoading(true);
    const endpoint =
      type === "Before"
        ? `/api/qa-sections/measurement-specs/${moNo}`
        : `/api/qa-sections/measurement-specs-aw/${moNo}`;

    try {
      const res = await axios.get(`${API_BASE_URL}${endpoint}`);
      const { source, data } = res.data;

      const newSourceType = source;
      const newIsConfigured = source === "qa_sections";
      let all = [];
      let selected = [];
      let newKValues = [];

      if (type === "Before") {
        all = data.AllBeforeWashSpecs || [];
        selected = data.selectedBeforeWashSpecs || [];
        const kSet = new Set(
          all.map((s) => s.kValue).filter((k) => k && k !== "NA")
        );
        newKValues = Array.from(kSet).sort();
      } else {
        all = data.AllAfterWashSpecs || [];
        selected = data.selectedAfterWashSpecs || [];
      }

      const finalList =
        source === "qa_sections" && selected.length > 0 ? selected : all;

      setSourceType(newSourceType);
      setIsConfigured(newIsConfigured);
      setFullSpecsList(all);
      setSelectedSpecsList(finalList);
      setKValuesList(newKValues);

      updateParent({
        sourceType: newSourceType,
        isConfigured: newIsConfigured,
        fullSpecsList: all,
        selectedSpecsList: finalList,
        kValuesList: newKValues,
        orderSizes: currentSizes
      });
    } catch (error) {
      console.error("Error fetching specs:", error);
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSaveConfig = async (selectedIds) => {
    const filtered = fullSpecsList.filter((s) => selectedIds.includes(s.id));

    setSelectedSpecsList(filtered);
    setIsConfigured(true);
    setSourceType("qa_sections");

    updateParent({
      selectedSpecsList: filtered,
      isConfigured: true,
      sourceType: "qa_sections"
    });

    const endpoint =
      measConfig === "Before"
        ? `/api/qa-sections/measurement-specs/save`
        : `/api/qa-sections/measurement-specs-aw/save`;

    const payload = {
      moNo: activeMoNo,
      allSpecs: fullSpecsList,
      selectedSpecs: filtered,
      isSaveAll: false
    };

    try {
      await axios.post(`${API_BASE_URL}${endpoint}`, payload);
    } catch (e) {
      console.error("Failed to save config", e);
      alert("Failed to save configuration to server.");
    }
  };

  const handleSaveMeasurement = (data) => {
    // Inject active group info into the measurement data
    const enhancedData = {
      ...data,
      groupId: activeGroup?.id,
      line: activeGroup?.line,
      table: activeGroup?.table,
      color: activeGroup?.color,
      qcUser: activeGroup?.activeQC
    };

    let updatedMeasurements;
    if (editingMeasurementIndex !== null) {
      updatedMeasurements = [...savedMeasurements];
      updatedMeasurements[editingMeasurementIndex] = {
        ...enhancedData,
        displayMode: displayMode
      };
      setEditingMeasurementIndex(null);
      setEditingMeasurementData(null);
    } else {
      updatedMeasurements = [
        ...savedMeasurements,
        {
          ...enhancedData,
          displayMode: displayMode
        }
      ];
    }

    setSavedMeasurements(updatedMeasurements);
    updateParent({ savedMeasurements: updatedMeasurements });

    if (editingMeasurementIndex === null) {
      setSelectedSize("");
    }
  };

  const handleEditMeasurement = (measurement, index) => {
    setEditingMeasurementIndex(index);
    setEditingMeasurementData(measurement);
    setSelectedSize(measurement.size);
    setSelectedKValue(measurement.kValue || "");
    setDisplayMode(measurement.displayMode || "selected");
    setIsGridOpen(true);
  };

  const handleDeleteMeasurement = (index) => {
    if (!window.confirm("Are you sure you want to delete this measurement?")) {
      return;
    }
    const updatedMeasurements = [...savedMeasurements];
    updatedMeasurements.splice(index, 1);
    setSavedMeasurements(updatedMeasurements);
    updateParent({ savedMeasurements: updatedMeasurements });
  };

  const handleStartMeasuring = () => {
    setEditingMeasurementIndex(null);
    setEditingMeasurementData(null);
    setIsGridOpen(true);
  };

  // ==========================================================================
  // HELPER: CHECK IF SIZE IS COMPLETED (Disable in Dropdown)
  // ==========================================================================
  const isSizeDisabled = (size) => {
    // Only check measurements that match the current active group context if applicable
    // Filter relevant measurements for this check
    const relevantMeasurements = savedMeasurements.filter((m) => {
      return true;
    });

    if (measConfig !== "Before") {
      return relevantMeasurements.some((m) => m.size === size);
    } else {
      if (!selectedKValue) return false;
      return relevantMeasurements.some(
        (m) => m.size === size && m.kValue === selectedKValue
      );
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const canSelectSizeAndK = isConfigured || sourceType === "qa_sections";
  const needsKValue = measConfig === "Before" && kValuesList.length > 0;
  const canStartMeasuring = selectedSize && (!needsKValue || selectedKValue);

  if (!activeMoNo)
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow">
        No Order Selected
      </div>
    );
  if (!activeReportTemplate)
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow">
        No Report Type Selected
      </div>
    );
  if (measConfig === "No")
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow">
        Measurement Not Required
      </div>
    );
  if (loading && !initialLoadDone)
    return (
      <div className="p-12 text-center">
        <Loader2 className="animate-spin inline w-8 h-8" />
      </div>
    );

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header - ORIGINAL STYLING PRESERVED */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Ruler className="w-5 h-5 text-indigo-500" />
            Measurement: {measConfig} Wash
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Order:{" "}
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              {activeMoNo}
            </span>{" "}
            • {selectedSpecsList.length} Points Configured
          </p>
        </div>

        {/* Tab Buttons - ORIGINAL STYLING PRESERVED */}
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
          <button
            onClick={() => setInternalTab("specs")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              internalTab === "specs"
                ? "bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            Setup & Measure
          </button>
          <button
            onClick={() => setInternalTab("results")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              internalTab === "results"
                ? "bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            Results
            {savedMeasurements.length > 0 && (
              <span className="bg-indigo-500 text-white text-[9px] px-1.5 rounded-full">
                {savedMeasurements.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Context Banner */}
      {activeGroup ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-green-600 dark:text-green-400 fill-current" />
            <div className="text-sm font-bold text-green-800 dark:text-green-300">
              Active: Line {activeGroup.line} / Table {activeGroup.table} /
              Color {activeGroup.color}
            </div>
          </div>
          {activeGroup.activeQC && (
            <div className="text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-800 px-2 py-1 rounded">
              QC: {activeGroup.activeQC.eng_name}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <p className="font-bold text-amber-700 dark:text-amber-400">
              No Active Inspection Context
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              Please go back to the <strong>Info</strong> tab and click "Start"
              on a specific card to begin measuring.
            </p>
          </div>
        </div>
      )}

      {!isConfigured && sourceType === "dt_orders" && activeGroup && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Action Required
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              Please configure measurement points specific to this order before
              starting.
            </p>
          </div>
        </div>
      )}

      {/* --- CONTENT: SPECS TAB --- */}
      {internalTab === "specs" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            {/* Disable Setup if no active group */}
            <div
              className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 ${
                !activeGroup ? "opacity-50 pointer-events-none grayscale" : ""
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">
                  Setup
                </h4>
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-medium flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" /> Configure
                </button>
              </div>

              <div className="space-y-4">
                {/* K Value (Conditional) */}
                {measConfig === "Before" && kValuesList.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-2">
                      K Value
                      {canSelectSizeAndK ? (
                        <Unlock className="w-3 h-3 text-green-500" />
                      ) : (
                        <Lock className="w-3 h-3 text-gray-400" />
                      )}
                    </label>
                    <select
                      value={selectedKValue}
                      onChange={(e) => {
                        setSelectedKValue(e.target.value);
                        setSelectedSize(""); // Reset size when K changes
                      }}
                      disabled={!canSelectSizeAndK}
                      className={`w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                        !canSelectSizeAndK
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <option value="">-- Select K --</option>
                      {kValuesList.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Size Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-2">
                    Size
                    {canSelectSizeAndK ? (
                      <Unlock className="w-3 h-3 text-green-500" />
                    ) : (
                      <Lock className="w-3 h-3 text-gray-400" />
                    )}
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    disabled={!canSelectSizeAndK}
                    className={`w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                      !canSelectSizeAndK ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="">-- Select Size --</option>
                    {orderSizes.map((s) => {
                      const disabled = isSizeDisabled(s);
                      return (
                        <option
                          key={s}
                          value={s}
                          disabled={disabled}
                          className={
                            disabled
                              ? "text-gray-400 bg-gray-100 dark:bg-gray-800"
                              : ""
                          }
                        >
                          {s} {disabled ? "(Completed)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Display Mode Toggle - ORIGINAL STYLING */}
                <div className="pt-2">
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setDisplayMode("selected")}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                        displayMode === "selected"
                          ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      Selected ({selectedSpecsList.length})
                    </button>
                    <button
                      onClick={() => setDisplayMode("all")}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                        displayMode === "all"
                          ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      All ({fullSpecsList.length})
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleStartMeasuring}
                  disabled={!canStartMeasuring || !canSelectSizeAndK}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
                >
                  <Maximize2 className="w-4 h-4" /> Start Measuring
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-full max-h-[500px] flex flex-col">
              <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Active Points Preview
              </h4>

              <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {selectedSpecsList.length > 0 ? (
                  selectedSpecsList.map((spec, idx) => (
                    <div
                      key={spec.id || idx}
                      className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {spec.MeasurementPointEngName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {spec.MeasurementPointTurName || spec.Description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {spec.kValue && spec.kValue !== "NA" && (
                          <span className="text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-800">
                            K: {spec.kValue}
                          </span>
                        )}
                        {spec.Tolerance && (
                          <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                            ±{spec.Tolerance}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-400 text-sm italic">
                    No measurement points configured.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- RESULTS TAB --- */}
      {internalTab === "results" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <YPivotQATemplatesMeasurementResultsTab
            savedMeasurements={savedMeasurements}
            specsData={fullSpecsList}
            onEditMeasurement={handleEditMeasurement}
            onDeleteMeasurement={handleDeleteMeasurement}
          />
        </div>
      )}

      {/* --- MODALS --- */}
      <YPivotQATemplatesSpecsConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        specsData={fullSpecsList}
        selectedSpecsIds={selectedSpecsList.map((s) => s.id)}
        measType={measConfig}
        onSaveConfig={handleSaveConfig}
      />

      <YPivotQATemplatesMeasurementGridModal
        isOpen={isGridOpen}
        onClose={() => {
          setIsGridOpen(false);
          setEditingMeasurementIndex(null);
          setEditingMeasurementData(null);
        }}
        specsData={displayMode === "all" ? fullSpecsList : selectedSpecsList}
        selectedSize={selectedSize}
        selectedKValue={selectedKValue}
        displayMode={displayMode}
        measType={measConfig}
        onSave={handleSaveMeasurement}
        initialQty={editingMeasurementData?.qty || 3}
        editingData={editingMeasurementData}
        isEditing={editingMeasurementIndex !== null}
      />
    </div>
  );
};

export default YPivotQAInspectionMeasurementConfig;
