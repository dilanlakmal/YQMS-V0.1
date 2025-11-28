// import React, { useState, useEffect, useMemo } from "react";
// import { createPortal } from "react-dom";
// import axios from "axios";
// import {
//   Search,
//   ClipboardList,
//   Ruler,
//   Check,
//   Loader2,
//   X,
//   Plus,
//   Minus,
//   Maximize2,
//   Save,
//   AlertCircle,
//   Settings,
//   Filter
// } from "lucide-react";
// import { API_BASE_URL } from "../../../../../config";

// // Import Number Pad
// import MeasurementNumPad from "../../cutting/MeasurementNumPad";

// // ==========================================================================
// // SUB-COMPONENT: SPECS CONFIGURATION MODAL
// // Allows user to tick/untick which measurement points to include
// // ==========================================================================
// const SpecsConfigModal = ({
//   isOpen,
//   onClose,
//   specsData,
//   selectedSpecsIds,
//   onSaveConfig,
//   measType // "Before" or "After"
// }) => {
//   const [localSelection, setLocalSelection] = useState(
//     new Set(selectedSpecsIds)
//   );

//   useEffect(() => {
//     setLocalSelection(new Set(selectedSpecsIds));
//   }, [selectedSpecsIds, isOpen]);

//   if (!isOpen) return null;

//   const toggleSpec = (id) => {
//     const newSet = new Set(localSelection);
//     if (newSet.has(id)) newSet.delete(id);
//     else newSet.add(id);
//     setLocalSelection(newSet);
//   };

//   const handleSave = () => {
//     onSaveConfig(Array.from(localSelection));
//     onClose();
//   };

//   return createPortal(
//     <div className="fixed inset-0 z-[110] bg-white dark:bg-gray-900 flex flex-col h-[100dvh] animate-fadeIn">
//       <div className="flex-shrink-0 px-6 py-4 bg-indigo-600 flex justify-between items-center shadow-md safe-area-top">
//         <div>
//           <h2 className="text-white font-bold text-xl">
//             Configure Measurement Points
//           </h2>
//           <p className="text-indigo-200 text-xs mt-1">
//             Select points to be measured for {measType} Wash
//           </p>
//         </div>
//         <button
//           onClick={onClose}
//           className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
//         >
//           <X className="w-6 h-6" />
//         </button>
//       </div>

//       <div className="flex-1 overflow-auto p-4">
//         <div className="max-w-4xl mx-auto space-y-2">
//           {specsData.map((spec, index) => (
//             <div
//               key={spec.id || index}
//               onClick={() => toggleSpec(spec.id)}
//               className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-4
//                  ${
//                    localSelection.has(spec.id)
//                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
//                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
//                  }
//                `}
//             >
//               <div
//                 className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors
//                  ${
//                    localSelection.has(spec.id)
//                      ? "bg-indigo-500 border-indigo-500 text-white"
//                      : "border-gray-300 bg-white dark:bg-gray-800"
//                  }
//                `}
//               >
//                 {localSelection.has(spec.id) && <Check className="w-4 h-4" />}
//               </div>
//               <div>
//                 <h4 className="font-bold text-gray-800 dark:text-white">
//                   {spec.MeasurementPointEngName}
//                 </h4>
//                 {spec.MeasurementPointChiName && (
//                   <p className="text-sm text-gray-500">
//                     {spec.MeasurementPointChiName}
//                   </p>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
//         <div className="max-w-4xl mx-auto">
//           <button
//             onClick={handleSave}
//             className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all"
//           >
//             Save Configuration ({localSelection.size} Selected)
//           </button>
//         </div>
//       </div>
//     </div>,
//     document.body
//   );
// };

// // ==========================================================================
// // SUB-COMPONENT: MEASUREMENT GRID MODAL
// // The actual data entry table
// // ==========================================================================
// const MeasurementGridModal = ({
//   isOpen,
//   onClose,
//   specsData,
//   selectedSize,
//   selectedKValue,
//   initialQty = 3,
//   measureAllPcs = false, // Global toggle from parent
//   onSave
// }) => {
//   if (!isOpen) return null;

//   // --- Local State ---
//   const [qty, setQty] = useState(initialQty);
//   const [measurements, setMeasurements] = useState({}); // { specId: { sampleIndex: { decimal, fraction } } }
//   const [selectedPcsIndices, setSelectedPcsIndices] = useState(new Set()); // Which columns are selected
//   const [activeCell, setActiveCell] = useState(null); // { specId, sampleIndex }

//   // --- Helpers ---
//   const checkTolerance = (spec, value) => {
//     if (value === 0) return true; // Default 0 is neutral/pass

//     const baseValObj = spec.Specs.find((s) => s.size === selectedSize);
//     const baseVal = baseValObj ? baseValObj.decimal : 0;

//     const tolMinus = spec.TolMinus?.decimal || 0;
//     const tolPlus = spec.TolPlus?.decimal || 0;

//     // Logic: (Base - TolMinus) <= Value <= (Base + TolPlus)
//     // Assuming TolMinus is stored as positive number (e.g. 0.5 for -1/2)
//     // If DB stores it negative, use addition. If positive, subtraction.
//     // Usually TolMinus is stored as absolute value in most systems, so we subtract.
//     const min = baseVal - Math.abs(tolMinus);
//     const max = baseVal + Math.abs(tolPlus);

//     // Precision fix for floats
//     return value >= min - 0.0001 && value <= max + 0.0001;
//   };

//   const togglePcsSelection = (index) => {
//     // If global "All" is on, disable toggle
//     if (measureAllPcs) return;

//     const newSet = new Set(selectedPcsIndices);
//     if (newSet.has(index)) newSet.delete(index);
//     else newSet.add(index);
//     setSelectedPcsIndices(newSet);
//   };

//   const handleNumPadInput = (decimal, fraction) => {
//     if (activeCell) {
//       setMeasurements((prev) => ({
//         ...prev,
//         [activeCell.specId]: {
//           ...(prev[activeCell.specId] || {}),
//           [activeCell.sampleIndex]: { decimal, fraction }
//         }
//       }));
//     }
//   };

//   const handleSave = () => {
//     const result = {
//       size: selectedSize,
//       kValue: selectedKValue,
//       qty: qty,
//       measurements: measurements,
//       selectedPcs: measureAllPcs ? "ALL" : Array.from(selectedPcsIndices)
//     };
//     onSave(result);
//     onClose();
//   };

//   // Render Table Rows
//   const renderRows = () => {
//     // Filter specs based on K Value if provided
//     const filteredSpecs = selectedKValue
//       ? specsData.filter(
//           (s) => s.kValue === selectedKValue || s.kValue === "NA"
//         )
//       : specsData;

//     return filteredSpecs.map((spec, index) => {
//       const specValueObj = spec.Specs.find((s) => s.size === selectedSize);
//       const specValueDisplay = specValueObj?.fraction || "-";
//       const tolMinus = spec.TolMinus?.fraction || "-";
//       const tolPlus = spec.TolPlus?.fraction || "-";
//       const specId = spec.id || index;

//       return (
//         <tr
//           key={specId}
//           className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
//         >
//           <td className="p-3 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 max-w-xs truncate">
//             {spec.MeasurementPointEngName}
//           </td>
//           <td className="p-2 text-center text-xs text-red-500 font-mono border-r dark:border-gray-700">
//             -{tolMinus}
//           </td>
//           <td className="p-2 text-center text-sm font-bold text-gray-800 dark:text-gray-200 border-r dark:border-gray-700">
//             {specValueDisplay}
//           </td>
//           <td className="p-2 text-center text-xs text-green-500 font-mono border-r dark:border-gray-700">
//             +{tolPlus}
//           </td>

//           {Array.from({ length: qty }).map((_, i) => {
//             const currentVal = measurements[specId]?.[i];
//             const displayVal = currentVal?.fraction || "0";
//             const numVal = currentVal?.decimal || 0;

//             // Check if this Pcs is selected for measurement
//             const isTarget = measureAllPcs || selectedPcsIndices.has(i);
//             const isPass = checkTolerance(spec, numVal);

//             let cellClass = "bg-gray-50 dark:bg-gray-800 text-gray-400"; // Default inactive
//             if (isTarget) {
//               cellClass = isPass
//                 ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200"
//                 : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200";
//             }

//             return (
//               <td
//                 key={i}
//                 className="p-1 border-r border-gray-200 dark:border-gray-700 min-w-[80px]"
//               >
//                 <button
//                   disabled={!isTarget} // Only allow input if selected
//                   onClick={() => setActiveCell({ specId, sampleIndex: i })}
//                   className={`w-full h-10 rounded border flex items-center justify-center text-sm font-bold transition-all ${cellClass}`}
//                 >
//                   {displayVal}
//                 </button>
//               </td>
//             );
//           })}
//         </tr>
//       );
//     });
//   };

//   return createPortal(
//     <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col h-[100dvh] animate-fadeIn">
//       {/* Header */}
//       <div className="flex-shrink-0 px-6 py-4 bg-indigo-600 flex justify-between items-center shadow-md safe-area-top">
//         <div>
//           <h2 className="text-white font-bold text-xl">Measurement Entry</h2>
//           <div className="text-indigo-200 text-xs flex gap-3 mt-1">
//             <span className="bg-indigo-700 px-2 py-0.5 rounded">
//               Size: {selectedSize}
//             </span>
//             {selectedKValue && (
//               <span className="bg-indigo-700 px-2 py-0.5 rounded">
//                 K: {selectedKValue}
//               </span>
//             )}
//             {measureAllPcs && (
//               <span className="bg-orange-500 text-white px-2 py-0.5 rounded font-bold">
//                 ALL PCS MODE
//               </span>
//             )}
//           </div>
//         </div>
//         <button
//           onClick={onClose}
//           className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
//         >
//           <X className="w-6 h-6" />
//         </button>
//       </div>

//       {/* Controls */}
//       <div className="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
//         <div className="flex items-center gap-4">
//           <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">
//             Total Pcs:
//           </span>
//           <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
//             <button
//               onClick={() => setQty(Math.max(1, qty - 1))}
//               className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 border-r"
//             >
//               <Minus className="w-4 h-4" />
//             </button>
//             <div className="w-12 text-center font-bold text-gray-800 dark:text-white">
//               {qty}
//             </div>
//             <button
//               onClick={() => setQty(qty + 1)}
//               className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 border-l"
//             >
//               <Plus className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//         <button
//           onClick={handleSave}
//           className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2"
//         >
//           <Save className="w-4 h-4" /> Save Data
//         </button>
//       </div>

//       {/* Table */}
//       <div className="flex-1 overflow-auto p-4">
//         <table className="w-full border-collapse">
//           <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 shadow-sm">
//             <tr>
//               <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase border-r dark:border-gray-700 w-1/3">
//                 Measurement Point
//               </th>
//               <th className="p-2 text-center text-xs font-bold text-gray-500 uppercase border-r dark:border-gray-700 w-16">
//                 Tol -
//               </th>
//               <th className="p-2 text-center text-xs font-bold text-gray-500 uppercase border-r dark:border-gray-700 w-16">
//                 Spec
//               </th>
//               <th className="p-2 text-center text-xs font-bold text-gray-500 uppercase border-r dark:border-gray-700 w-16">
//                 Tol +
//               </th>
//               {Array.from({ length: qty }).map((_, i) => (
//                 <th
//                   key={i}
//                   onClick={() => togglePcsSelection(i)}
//                   className={`p-2 text-center text-xs font-bold uppercase border-r dark:border-gray-700 min-w-[80px] cursor-pointer transition-colors
//                     ${
//                       measureAllPcs || selectedPcsIndices.has(i)
//                         ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
//                         : "text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
//                     }
//                   `}
//                 >
//                   Pcs {i + 1}
//                   {!measureAllPcs && (
//                     <div className="text-[9px] font-normal mt-1">
//                       {selectedPcsIndices.has(i) ? "(Active)" : "(Tap)"}
//                     </div>
//                   )}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody className="bg-white dark:bg-gray-900">{renderRows()}</tbody>
//         </table>
//       </div>

//       {/* NumPad */}
//       {activeCell && (
//         <MeasurementNumPad
//           onClose={() => setActiveCell(null)}
//           onInput={handleNumPadInput}
//           initialValue={
//             measurements[activeCell.specId]?.[activeCell.sampleIndex]?.decimal
//           }
//         />
//       )}
//     </div>,
//     document.body
//   );
// };

// // ==========================================================================
// // MAIN COMPONENT
// // ==========================================================================
// const YPivotQATemplatesMeasurementSelection = () => {
//   // Tabs: 'orders' -> 'type' -> 'specs'
//   const [activeTab, setActiveTab] = useState("orders");

//   // Data State
//   const [ordersResults, setOrdersResults] = useState([]);
//   const [reportTypes, setReportTypes] = useState([]);

//   // Selection State
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedOrder, setSelectedOrder] = useState(null); // { moNo, ...details }
//   const [selectedReport, setSelectedReport] = useState(null);

//   // Config State
//   const [measConfig, setMeasConfig] = useState("No"); // "Before", "After"
//   const [fullSpecsList, setFullSpecsList] = useState([]); // All available specs from source
//   const [selectedSpecsList, setSelectedSpecsList] = useState([]); // Only enabled specs
//   const [sourceType, setSourceType] = useState(""); // "dt_orders" or "qa_sections"

//   // User Inputs
//   const [selectedSize, setSelectedSize] = useState("");
//   const [orderSizes, setOrderSizes] = useState([]);
//   const [selectedKValue, setSelectedKValue] = useState("");
//   const [kValuesList, setKValuesList] = useState([]);
//   const [measureAllPcs, setMeasureAllPcs] = useState(false); // Global checkbox
//   const [displayAllSpecs, setDisplayAllSpecs] = useState(false); // Toggle full list view

//   // Modals
//   const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
//   const [isGridOpen, setIsGridOpen] = useState(false);
//   const [loading, setLoading] = useState(false);

//   // --- Fetch Initial Reports ---
//   useEffect(() => {
//     axios
//       .get(`${API_BASE_URL}/api/qa-sections-templates`)
//       .then((res) => {
//         if (res.data.success) setReportTypes(res.data.data);
//       })
//       .catch((err) => console.error(err));
//   }, []);

//   // --- Search Order ---
//   useEffect(() => {
//     const delayDebounceFn = setTimeout(async () => {
//       if (searchTerm.length >= 3) {
//         setLoading(true);
//         try {
//           const res = await axios.get(
//             `${API_BASE_URL}/api/search-mono?term=${searchTerm}`
//           );
//           setOrdersResults(res.data);
//         } catch (error) {
//           console.error(error);
//         } finally {
//           setLoading(false);
//         }
//       } else {
//         setOrdersResults([]);
//       }
//     }, 500);
//     return () => clearTimeout(delayDebounceFn);
//   }, [searchTerm]);

//   const handleSelectOrder = async (moNo) => {
//     setLoading(true);
//     try {
//       const res = await axios.get(`${API_BASE_URL}/api/order-details/${moNo}`);
//       setSelectedOrder({ ...res.data, moNo });

//       // Extract Sizes
//       const allSizes = new Set();
//       if (res.data.colorSizeMap) {
//         Object.values(res.data.colorSizeMap).forEach((c) => {
//           if (c.sizes) c.sizes.forEach((s) => allSizes.add(s));
//         });
//       }
//       setOrderSizes(Array.from(allSizes));
//       setActiveTab("type");
//     } catch (error) {
//       alert("Failed to load order details");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- Handle Report Selection & Fetch Specs ---
//   const handleSelectReport = (report) => {
//     setSelectedReport(report);
//     setMeasConfig(report.Measurement);
//     if (report.Measurement === "No") return alert("No measurements required.");

//     fetchMeasurementSpecs(report.Measurement);
//     setActiveTab("specs");
//   };

//   const fetchMeasurementSpecs = async (type) => {
//     setLoading(true);
//     const endpoint =
//       type === "Before"
//         ? `/api/qa-sections/measurement-specs/${selectedOrder.moNo}`
//         : `/api/qa-sections/measurement-specs-aw/${selectedOrder.moNo}`;

//     try {
//       const res = await axios.get(`${API_BASE_URL}${endpoint}`);
//       const { source, data } = res.data;
//       setSourceType(source);

//       let all = [];
//       let selected = [];

//       if (type === "Before") {
//         all = data.AllBeforeWashSpecs || [];
//         selected = data.selectedBeforeWashSpecs || [];
//         // Extract K Values
//         const kSet = new Set(
//           all.map((s) => s.kValue).filter((k) => k && k !== "NA")
//         );
//         setKValuesList(Array.from(kSet));
//       } else {
//         all = data.AllAfterWashSpecs || [];
//         selected = data.selectedAfterWashSpecs || [];
//       }

//       setFullSpecsList(all);
//       // If source is 'dt_orders' (first time), selected list is empty, so we might want to start with empty or all?
//       // Requirement says: "if it exist then get data from there, but in that case you have to display all of specs"
//       // If source is 'qa_sections', we use saved 'selected' list.
//       setSelectedSpecsList(
//         source === "dt_orders" ? all : selected.length > 0 ? selected : all
//       );
//     } catch (error) {
//       console.error(error);
//       alert("Specs not found.");
//       setFullSpecsList([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- Save Configuration (Tick Selection) ---
//   const handleSaveConfig = async (selectedIds) => {
//     const filtered = fullSpecsList.filter((s) => selectedIds.includes(s.id));
//     setSelectedSpecsList(filtered);

//     // API Call to save selection to qa_sections_measurement_specs
//     const endpoint =
//       measConfig === "Before"
//         ? `/api/qa-sections/measurement-specs/save`
//         : `/api/qa-sections/measurement-specs-aw/save`;

//     const payload = {
//       moNo: selectedOrder.moNo,
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

//   // --- Renderers ---

//   const renderOrderTab = () => (
//     <div className="max-w-xl mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
//       <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
//         <Search className="w-5 h-5 text-indigo-500" /> Search Order
//       </h3>
//       <input
//         type="text"
//         placeholder="Type MO Number (e.g. 12345)..."
//         className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//       />
//       {loading && (
//         <div className="mt-4 flex justify-center">
//           <Loader2 className="animate-spin text-indigo-500" />
//         </div>
//       )}
//       <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
//         {ordersResults.map((mo) => (
//           <button
//             key={mo}
//             onClick={() => handleSelectOrder(mo)}
//             className="w-full text-left p-3 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg border border-transparent hover:border-indigo-200 transition-all font-bold text-gray-700 dark:text-gray-300"
//           >
//             {mo}
//           </button>
//         ))}
//       </div>
//     </div>
//   );

//   const renderTypeTab = () => (
//     <div className="max-w-4xl mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
//       <div className="flex justify-between mb-6">
//         <h3 className="text-lg font-bold text-gray-800 dark:text-white">
//           Select Report Type{" "}
//           <span className="text-xs font-normal text-gray-500 ml-2">
//             ({selectedOrder?.moNo})
//           </span>
//         </h3>
//         <button
//           onClick={() => setActiveTab("orders")}
//           className="text-indigo-500 hover:underline text-sm"
//         >
//           Change Order
//         </button>
//       </div>
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//         {reportTypes.map((report) => (
//           <button
//             key={report._id}
//             onClick={() => handleSelectReport(report)}
//             className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left transition-all"
//           >
//             <div className="flex justify-between mb-2">
//               <ClipboardList className="text-gray-400" />
//               <span
//                 className={`text-[10px] px-2 py-0.5 rounded font-bold ${
//                   report.Measurement === "No"
//                     ? "bg-gray-200"
//                     : "bg-green-100 text-green-700"
//                 }`}
//               >
//                 {report.Measurement} Wash
//               </span>
//             </div>
//             <h4 className="font-bold text-gray-800 dark:text-white">
//               {report.ReportType}
//             </h4>
//           </button>
//         ))}
//       </div>
//     </div>
//   );

//   const renderSpecsTab = () => {
//     // Decide which list to show
//     const activeSpecs = displayAllSpecs ? fullSpecsList : selectedSpecsList;

//     return (
//       <div className="max-w-5xl mx-auto mt-8 space-y-6">
//         <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between">
//           <div>
//             <h3 className="font-bold text-lg text-gray-800 dark:text-white">
//               Measurement Setup
//             </h3>
//             <p className="text-xs text-gray-500">
//               Order: {selectedOrder?.moNo} • {measConfig} Wash
//             </p>
//           </div>
//           <div className="flex gap-3">
//             <button
//               onClick={() => setIsConfigModalOpen(true)}
//               className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2 text-sm font-bold"
//             >
//               <Settings className="w-4 h-4" /> Configure Points
//             </button>
//             <button
//               onClick={() => setActiveTab("type")}
//               className="text-sm text-gray-500 hover:text-indigo-500"
//             >
//               Back
//             </button>
//           </div>
//         </div>

//         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//             <div>
//               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
//                 Select Size
//               </label>
//               <select
//                 value={selectedSize}
//                 onChange={(e) => setSelectedSize(e.target.value)}
//                 className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
//               >
//                 <option value="">-- Choose Size --</option>
//                 {orderSizes.map((s) => (
//                   <option key={s} value={s}>
//                     {s}
//                   </option>
//                 ))}
//               </select>

//               {/* Global Measure All Toggle */}
//               <div className="mt-3 flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   id="measureAll"
//                   checked={measureAllPcs}
//                   onChange={(e) => setMeasureAllPcs(e.target.checked)}
//                   className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
//                 />
//                 <label
//                   htmlFor="measureAll"
//                   className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
//                 >
//                   Measure All Pcs (Enable All Columns)
//                 </label>
//               </div>
//             </div>

//             {measConfig === "Before" && (
//               <div>
//                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
//                   Select K Value
//                 </label>
//                 <select
//                   value={selectedKValue}
//                   onChange={(e) => setSelectedKValue(e.target.value)}
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
//                 >
//                   <option value="">-- Choose K Value --</option>
//                   {kValuesList.map((k) => (
//                     <option key={k} value={k}>
//                       {k}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}
//           </div>

//           {/* Display Toggle */}
//           <div className="flex justify-end mb-4">
//             <button
//               onClick={() => setDisplayAllSpecs(!displayAllSpecs)}
//               className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
//             >
//               <Filter className="w-3 h-3" />{" "}
//               {displayAllSpecs
//                 ? "Show Selected Only"
//                 : "Display All Available Specs"}
//             </button>
//           </div>

//           {/* Action */}
//           <button
//             onClick={() => setIsGridOpen(true)}
//             disabled={
//               !selectedSize ||
//               (measConfig === "Before" &&
//                 kValuesList.length > 0 &&
//                 !selectedKValue)
//             }
//             className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//           >
//             <Maximize2 className="w-5 h-5" /> Start Measuring
//           </button>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20 animate-fadeIn">
//       {/* Navigation */}
//       <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 mb-6">
//         <div className="flex items-center justify-center p-2 gap-2">
//           <button
//             onClick={() => setActiveTab("orders")}
//             className={`px-4 py-2 rounded-lg text-sm font-bold ${
//               activeTab === "orders"
//                 ? "bg-indigo-600 text-white"
//                 : "text-gray-500"
//             }`}
//           >
//             1. Orders
//           </button>
//           <button
//             disabled={!selectedOrder}
//             onClick={() => setActiveTab("type")}
//             className={`px-4 py-2 rounded-lg text-sm font-bold ${
//               activeTab === "type"
//                 ? "bg-indigo-600 text-white"
//                 : "text-gray-500 disabled:opacity-30"
//             }`}
//           >
//             2. Type
//           </button>
//           <button
//             disabled={!selectedReport}
//             onClick={() => setActiveTab("specs")}
//             className={`px-4 py-2 rounded-lg text-sm font-bold ${
//               activeTab === "specs"
//                 ? "bg-indigo-600 text-white"
//                 : "text-gray-500 disabled:opacity-30"
//             }`}
//           >
//             3. Specs
//           </button>
//         </div>
//       </div>

//       {activeTab === "orders" && renderOrderTab()}
//       {activeTab === "type" && renderTypeTab()}
//       {activeTab === "specs" && renderSpecsTab()}

//       {/* Modals */}
//       <SpecsConfigModal
//         isOpen={isConfigModalOpen}
//         onClose={() => setIsConfigModalOpen(false)}
//         specsData={fullSpecsList}
//         selectedSpecsIds={selectedSpecsList.map((s) => s.id)}
//         measType={measConfig}
//         onSaveConfig={handleSaveConfig}
//       />

//       <MeasurementGridModal
//         isOpen={isGridOpen}
//         onClose={() => setIsGridOpen(false)}
//         specsData={displayAllSpecs ? fullSpecsList : selectedSpecsList}
//         selectedSize={selectedSize}
//         selectedKValue={selectedKValue}
//         measureAllPcs={measureAllPcs}
//         onSave={(data) => console.log("Saved Measurements:", data)}
//       />

//       <style jsx>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//             transform: translateY(5px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.3s ease-out;
//         }
//         .safe-area-top {
//           padding-top: env(safe-area-inset-top);
//         }
//       `}</style>
//     </div>
//   );
// };

// export default YPivotQATemplatesMeasurementSelection;

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Search,
  ClipboardList,
  Ruler,
  Check,
  Loader2,
  X,
  Plus,
  Minus,
  Maximize2,
  Save,
  AlertCircle,
  Settings,
  Filter,
  ListChecks,
  XCircle
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// Import Number Pad
import MeasurementNumPad from "../../cutting/MeasurementNumPad";

// ==========================================================================
// SUB-COMPONENT: SPECS CONFIGURATION MODAL
// ==========================================================================
const SpecsConfigModal = ({
  isOpen,
  onClose,
  specsData,
  selectedSpecsIds,
  onSaveConfig,
  measType // "Before" or "After"
}) => {
  const [localSelection, setLocalSelection] = useState(
    new Set(selectedSpecsIds)
  );
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLocalSelection(new Set(selectedSpecsIds));
      setSearchTerm("");
    }
  }, [selectedSpecsIds, isOpen]);

  if (!isOpen) return null;

  // Filter Data based on Search
  const filteredSpecs = specsData.filter(
    (spec) =>
      spec.MeasurementPointEngName.toLowerCase().includes(
        searchTerm.toLowerCase()
      ) ||
      (spec.MeasurementPointChiName &&
        spec.MeasurementPointChiName.toLowerCase().includes(
          searchTerm.toLowerCase()
        ))
  );

  const toggleSpec = (id) => {
    const newSet = new Set(localSelection);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setLocalSelection(newSet);
  };

  const handleSelectAll = () => {
    const newSet = new Set(localSelection);
    filteredSpecs.forEach((spec) => newSet.add(spec.id));
    setLocalSelection(newSet);
  };

  const handleDeselectAll = () => {
    const newSet = new Set(localSelection);
    filteredSpecs.forEach((spec) => newSet.delete(spec.id));
    setLocalSelection(newSet);
  };

  const handleSave = () => {
    onSaveConfig(Array.from(localSelection));
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] bg-white dark:bg-gray-900 flex flex-col h-[100dvh] animate-fadeIn">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-indigo-600 flex justify-between items-center shadow-md safe-area-top">
        <div>
          <h2 className="text-white font-bold text-xl">
            Configure Measurement Points
          </h2>
          <p className="text-indigo-200 text-xs mt-1">
            Select points to be measured for {measType} Wash
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Search & Bulk Actions */}
      <div className="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search measurement points..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSelectAll}
            className="flex-1 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-bold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center justify-center gap-2"
          >
            <ListChecks className="w-4 h-4" /> Select All
          </button>
          <button
            onClick={handleDeselectAll}
            className="flex-1 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" /> Deselect All
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-2">
          {filteredSpecs.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No matching points found.
            </div>
          ) : (
            filteredSpecs.map((spec, index) => (
              <div
                key={spec.id || index}
                onClick={() => toggleSpec(spec.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-4
                    ${
                      localSelection.has(spec.id)
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }
                `}
              >
                <div
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0
                    ${
                      localSelection.has(spec.id)
                        ? "bg-indigo-500 border-indigo-500 text-white"
                        : "border-gray-300 bg-white dark:bg-gray-800"
                    }
                `}
                >
                  {localSelection.has(spec.id) && <Check className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">
                    {spec.MeasurementPointEngName}
                  </h4>
                  {spec.MeasurementPointChiName && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {spec.MeasurementPointChiName}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 safe-area-bottom">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
          >
            Save Configuration ({localSelection.size} Selected)
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ==========================================================================
// SUB-COMPONENT: MEASUREMENT GRID MODAL
// ==========================================================================
const MeasurementGridModal = ({
  isOpen,
  onClose,
  specsData,
  selectedSize,
  selectedKValue,
  initialQty = 3,
  measureAllPcs = false,
  onSave
}) => {
  if (!isOpen) return null;

  // --- Local State ---
  const [qty, setQty] = useState(initialQty);
  const [measurements, setMeasurements] = useState({}); // { specId: { sampleIndex: { decimal, fraction } } }
  const [selectedPcsIndices, setSelectedPcsIndices] = useState(new Set());
  const [activeCell, setActiveCell] = useState(null); // { specId, sampleIndex }

  // --- Helpers ---
  const checkTolerance = (spec, value) => {
    if (value === 0) return true;

    const baseValObj = spec.Specs.find((s) => s.size === selectedSize);
    const baseVal = baseValObj ? baseValObj.decimal : 0;

    const tolMinus = spec.TolMinus?.decimal || 0;
    const tolPlus = spec.TolPlus?.decimal || 0;

    const min = baseVal - Math.abs(tolMinus);
    const max = baseVal + Math.abs(tolPlus);

    return value >= min - 0.0001 && value <= max + 0.0001;
  };

  const togglePcsSelection = (index) => {
    if (measureAllPcs) return;
    const newSet = new Set(selectedPcsIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedPcsIndices(newSet);
  };

  const handleNumPadInput = (decimal, fraction) => {
    if (activeCell) {
      setMeasurements((prev) => ({
        ...prev,
        [activeCell.specId]: {
          ...(prev[activeCell.specId] || {}),
          [activeCell.sampleIndex]: { decimal, fraction }
        }
      }));
    }
  };

  const handleSave = () => {
    const result = {
      size: selectedSize,
      kValue: selectedKValue,
      qty: qty,
      measurements: measurements,
      selectedPcs: measureAllPcs ? "ALL" : Array.from(selectedPcsIndices)
    };
    onSave(result);
    onClose();
  };

  // Render Table Rows
  const renderRows = () => {
    const filteredSpecs = selectedKValue
      ? specsData.filter(
          (s) => s.kValue === selectedKValue || s.kValue === "NA"
        )
      : specsData;

    return filteredSpecs.map((spec, index) => {
      const specValueObj = spec.Specs.find((s) => s.size === selectedSize);
      const specValueDisplay = specValueObj?.fraction || "-";
      const tolMinus = spec.TolMinus?.fraction || "-";
      const tolPlus = spec.TolPlus?.fraction || "-";
      const specId = spec.id || index;

      return (
        <tr
          key={specId}
          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <td className="p-3 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 max-w-xs truncate">
            {spec.MeasurementPointEngName}
          </td>
          <td className="p-2 text-center text-xs text-red-500 font-mono border-r dark:border-gray-700">
            -{tolMinus}
          </td>
          <td className="p-2 text-center text-sm font-bold text-gray-800 dark:text-gray-200 border-r dark:border-gray-700">
            {specValueDisplay}
          </td>
          <td className="p-2 text-center text-xs text-green-500 font-mono border-r dark:border-gray-700">
            +{tolPlus}
          </td>

          {Array.from({ length: qty }).map((_, i) => {
            const currentVal = measurements[specId]?.[i];
            const displayVal = currentVal?.fraction || "0";
            const numVal = currentVal?.decimal || 0;

            const isTarget = measureAllPcs || selectedPcsIndices.has(i);
            const isPass = checkTolerance(spec, numVal);

            let cellClass = "bg-gray-50 dark:bg-gray-800 text-gray-400";
            if (isTarget) {
              cellClass = isPass
                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200"
                : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200";
            }

            return (
              <td
                key={i}
                className="p-1 border-r border-gray-200 dark:border-gray-700 min-w-[80px]"
              >
                <button
                  disabled={!isTarget}
                  onClick={() => setActiveCell({ specId, sampleIndex: i })}
                  className={`w-full h-10 rounded border flex items-center justify-center text-sm font-bold transition-all ${cellClass}`}
                >
                  {displayVal}
                </button>
              </td>
            );
          })}
        </tr>
      );
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col h-[100dvh] animate-fadeIn">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-indigo-600 flex justify-between items-center shadow-md safe-area-top">
        <div>
          <h2 className="text-white font-bold text-xl">Measurement Entry</h2>
          <div className="text-indigo-200 text-xs flex gap-3 mt-1">
            <span className="bg-indigo-700 px-2 py-0.5 rounded">
              Size: {selectedSize}
            </span>
            {selectedKValue && (
              <span className="bg-indigo-700 px-2 py-0.5 rounded">
                K: {selectedKValue}
              </span>
            )}
            {measureAllPcs && (
              <span className="bg-orange-500 text-white px-2 py-0.5 rounded font-bold">
                ALL PCS MODE
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">
            Total Pcs:
          </span>
          <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 border-r"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="w-12 text-center font-bold text-gray-800 dark:text-white">
              {qty}
            </div>
            <button
              onClick={() => setQty(qty + 1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 border-l"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Data
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 shadow-sm">
            <tr>
              <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase border-r dark:border-gray-700 w-1/3">
                Measurement Point
              </th>
              <th className="p-2 text-center text-xs font-bold text-gray-500 uppercase border-r dark:border-gray-700 w-16">
                Tol -
              </th>
              <th className="p-2 text-center text-xs font-bold text-gray-500 uppercase border-r dark:border-gray-700 w-16">
                Spec
              </th>
              <th className="p-2 text-center text-xs font-bold text-gray-500 uppercase border-r dark:border-gray-700 w-16">
                Tol +
              </th>
              {Array.from({ length: qty }).map((_, i) => (
                <th
                  key={i}
                  onClick={() => togglePcsSelection(i)}
                  className={`p-2 text-center text-xs font-bold uppercase border-r dark:border-gray-700 min-w-[80px] cursor-pointer transition-colors
                    ${
                      measureAllPcs || selectedPcsIndices.has(i)
                        ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                        : "text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  Pcs {i + 1}
                  {!measureAllPcs && (
                    <div className="text-[9px] font-normal mt-1">
                      {selectedPcsIndices.has(i) ? "(Active)" : "(Tap)"}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900">{renderRows()}</tbody>
        </table>
      </div>

      {/* NumPad */}
      {activeCell && (
        <MeasurementNumPad
          onClose={() => setActiveCell(null)}
          onInput={handleNumPadInput}
          initialValue={
            measurements[activeCell.specId]?.[activeCell.sampleIndex]?.decimal
          }
        />
      )}
    </div>,
    document.body
  );
};

// ==========================================================================
// MAIN COMPONENT
// ==========================================================================
const YPivotQATemplatesMeasurementSelection = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [ordersResults, setOrdersResults] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const [measConfig, setMeasConfig] = useState("No");
  const [fullSpecsList, setFullSpecsList] = useState([]);
  const [selectedSpecsList, setSelectedSpecsList] = useState([]);
  const [sourceType, setSourceType] = useState("");

  const [selectedSize, setSelectedSize] = useState("");
  const [orderSizes, setOrderSizes] = useState([]);
  const [selectedKValue, setSelectedKValue] = useState("");
  const [kValuesList, setKValuesList] = useState([]);
  const [measureAllPcs, setMeasureAllPcs] = useState(false);
  const [displayAllSpecs, setDisplayAllSpecs] = useState(false);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedMeasurements, setSavedMeasurements] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/qa-sections-templates`)
      .then((res) => {
        if (res.data.success) setReportTypes(res.data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 3) {
        setLoading(true);
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/search-mono?term=${searchTerm}`
          );
          setOrdersResults(res.data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setOrdersResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelectOrder = async (moNo) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/order-details/${moNo}`);
      setSelectedOrder({ ...res.data, moNo });
      const allSizes = new Set();
      if (res.data.colorSizeMap) {
        Object.values(res.data.colorSizeMap).forEach((c) => {
          if (c.sizes) c.sizes.forEach((s) => allSizes.add(s));
        });
      }
      setOrderSizes(Array.from(allSizes));
      setActiveTab("type");
    } catch (error) {
      alert("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReport = (report) => {
    setSelectedReport(report);
    setMeasConfig(report.Measurement);
    if (report.Measurement === "No") return alert("No measurements required.");
    fetchMeasurementSpecs(report.Measurement);
    setActiveTab("specs");
  };

  const fetchMeasurementSpecs = async (type) => {
    setLoading(true);
    const endpoint =
      type === "Before"
        ? `/api/qa-sections/measurement-specs/${selectedOrder.moNo}`
        : `/api/qa-sections/measurement-specs-aw/${selectedOrder.moNo}`;

    try {
      const res = await axios.get(`${API_BASE_URL}${endpoint}`);
      const { source, data } = res.data;
      setSourceType(source);

      let all = [];
      let selected = [];

      if (type === "Before") {
        all = data.AllBeforeWashSpecs || [];
        selected = data.selectedBeforeWashSpecs || [];
        const kSet = new Set(
          all.map((s) => s.kValue).filter((k) => k && k !== "NA")
        );
        setKValuesList(Array.from(kSet));
      } else {
        all = data.AllAfterWashSpecs || [];
        selected = data.selectedAfterWashSpecs || [];
      }

      setFullSpecsList(all);
      setSelectedSpecsList(
        source === "dt_orders" ? all : selected.length > 0 ? selected : all
      );
    } catch (error) {
      console.error(error);
      alert("Specs not found.");
      setFullSpecsList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (selectedIds) => {
    const filtered = fullSpecsList.filter((s) => selectedIds.includes(s.id));
    setSelectedSpecsList(filtered);

    const endpoint =
      measConfig === "Before"
        ? `/api/qa-sections/measurement-specs/save`
        : `/api/qa-sections/measurement-specs-aw/save`;

    const payload = {
      moNo: selectedOrder.moNo,
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

  const renderOrderTab = () => (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
        <Search className="w-5 h-5 text-indigo-500" /> Search Order
      </h3>
      <input
        type="text"
        placeholder="Type MO Number (e.g. 12345)..."
        className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {loading && (
        <div className="mt-4 flex justify-center">
          <Loader2 className="animate-spin text-indigo-500" />
        </div>
      )}
      <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
        {ordersResults.map((mo) => (
          <button
            key={mo}
            onClick={() => handleSelectOrder(mo)}
            className="w-full text-left p-3 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg border border-transparent hover:border-indigo-200 transition-all font-bold text-gray-700 dark:text-gray-300"
          >
            {mo}
          </button>
        ))}
      </div>
    </div>
  );

  const renderTypeTab = () => (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
          Select Report Type{" "}
          <span className="text-xs font-normal text-gray-500 ml-2">
            ({selectedOrder?.moNo})
          </span>
        </h3>
        <button
          onClick={() => setActiveTab("orders")}
          className="text-indigo-500 hover:underline text-sm"
        >
          Change Order
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <button
            key={report._id}
            onClick={() => handleSelectReport(report)}
            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left transition-all"
          >
            <div className="flex justify-between mb-2">
              <ClipboardList className="text-gray-400" />
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  report.Measurement === "No"
                    ? "bg-gray-200"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {report.Measurement} Wash
              </span>
            </div>
            <h4 className="font-bold text-gray-800 dark:text-white">
              {report.ReportType}
            </h4>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSpecsTab = () => {
    return (
      <div className="max-w-5xl mx-auto mt-8 space-y-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">
              Measurement Setup
            </h3>
            <p className="text-xs text-gray-500">
              Order: {selectedOrder?.moNo} • {measConfig} Wash
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2 text-sm font-bold"
            >
              <Settings className="w-4 h-4" /> Configure Points
            </button>
            <button
              onClick={() => setActiveTab("type")}
              className="text-sm text-gray-500 hover:text-indigo-500"
            >
              Back
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Select Size
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose Size --</option>
                {orderSizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="measureAll"
                  checked={measureAllPcs}
                  onChange={(e) => setMeasureAllPcs(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <label
                  htmlFor="measureAll"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Measure All Pcs (Enable All Columns)
                </label>
              </div>
            </div>

            {measConfig === "Before" && (
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Select K Value
                </label>
                <select
                  value={selectedKValue}
                  onChange={(e) => setSelectedKValue(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose K Value --</option>
                  {kValuesList.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={() => setDisplayAllSpecs(!displayAllSpecs)}
              className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
            >
              <Filter className="w-3 h-3" />{" "}
              {displayAllSpecs
                ? "Show Selected Only"
                : "Display All Available Specs"}
            </button>
          </div>

          <button
            onClick={() => setIsGridOpen(true)}
            disabled={
              !selectedSize ||
              (measConfig === "Before" &&
                kValuesList.length > 0 &&
                !selectedKValue)
            }
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Maximize2 className="w-5 h-5" /> Start Measuring
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20 animate-fadeIn">
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-center p-2 gap-2">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              activeTab === "orders"
                ? "bg-indigo-600 text-white"
                : "text-gray-500"
            }`}
          >
            1. Orders
          </button>
          <button
            disabled={!selectedOrder}
            onClick={() => setActiveTab("type")}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              activeTab === "type"
                ? "bg-indigo-600 text-white"
                : "text-gray-500 disabled:opacity-30"
            }`}
          >
            2. Report Type
          </button>
          <button
            disabled={!selectedReport}
            onClick={() => setActiveTab("specs")}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              activeTab === "specs"
                ? "bg-indigo-600 text-white"
                : "text-gray-500 disabled:opacity-30"
            }`}
          >
            3. Specs
          </button>
        </div>
      </div>

      {activeTab === "orders" && renderOrderTab()}
      {activeTab === "type" && renderTypeTab()}
      {activeTab === "specs" && renderSpecsTab()}

      <SpecsConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        specsData={fullSpecsList}
        selectedSpecsIds={selectedSpecsList.map((s) => s.id)}
        measType={measConfig}
        onSaveConfig={handleSaveConfig}
      />

      <MeasurementGridModal
        isOpen={isGridOpen}
        onClose={() => setIsGridOpen(false)}
        specsData={displayAllSpecs ? fullSpecsList : selectedSpecsList}
        selectedSize={selectedSize}
        selectedKValue={selectedKValue}
        measureAllPcs={measureAllPcs}
        onSave={(data) => setSavedMeasurements([...savedMeasurements, data])}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
      `}</style>
    </div>
  );
};

export default YPivotQATemplatesMeasurementSelection;
