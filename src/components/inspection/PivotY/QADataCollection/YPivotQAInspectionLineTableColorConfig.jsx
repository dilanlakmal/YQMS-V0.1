// import React, { useState, useEffect, useMemo, useRef } from "react";
// import {
//   FileText,
//   Plus,
//   Trash2,
//   Scan,
//   User,
//   CheckCircle2,
//   AlertCircle,
//   Play,
//   X,
//   ChevronDown,
//   Calculator,
//   Loader2,
//   Search,
//   Hash
// } from "lucide-react";
// import axios from "axios";
// import Swal from "sweetalert2";
// import { API_BASE_URL } from "../../../../../config";
// import EmpQRCodeScanner from "../../qc_roving/EmpQRCodeScanner";

// // ============================================================
// // Helper: Searchable Dropdown
// // ============================================================
// const SearchableSingleSelect = ({
//   label,
//   options,
//   selectedValue,
//   onSelectionChange,
//   placeholder,
//   disabled = false
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const wrapperRef = useRef(null);

//   const filteredOptions = options.filter((opt) =>
//     String(opt.label).toLowerCase().includes(searchTerm.toLowerCase())
//   );
//   const selectedLabel = options.find((o) => o.value === selectedValue)?.label;

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   if (disabled)
//     return (
//       <div className="opacity-50 pointer-events-none p-2 bg-gray-100 rounded text-sm">
//         N/A
//       </div>
//     );

//   return (
//     <div className="relative" ref={wrapperRef}>
//       {label && (
//         <label className="block text-xs font-bold text-gray-500 mb-1">
//           {label}
//         </label>
//       )}
//       <div
//         className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm flex justify-between items-center cursor-pointer hover:border-indigo-400 transition-colors"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <span
//           className={
//             selectedValue
//               ? "text-gray-800 dark:text-gray-200 font-medium"
//               : "text-gray-400"
//           }
//         >
//           {selectedLabel || placeholder}
//         </span>
//         <ChevronDown
//           className={`w-4 h-4 text-gray-400 transition-transform ${
//             isOpen ? "rotate-180" : ""
//           }`}
//         />
//       </div>

//       {isOpen && (
//         <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
//           <div className="p-2 sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
//             <input
//               type="text"
//               className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
//               placeholder="Filter options..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               autoFocus
//             />
//           </div>
//           {filteredOptions.length > 0 ? (
//             filteredOptions.map((opt) => (
//               <div
//                 key={opt.value}
//                 className={`px-3 py-2 text-sm cursor-pointer ${
//                   opt.value === selectedValue
//                     ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 font-bold"
//                     : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
//                 }`}
//                 onClick={() => {
//                   onSelectionChange(opt.value);
//                   setIsOpen(false);
//                   setSearchTerm("");
//                 }}
//               >
//                 {opt.label}
//               </div>
//             ))
//           ) : (
//             <div className="px-3 py-2 text-xs text-gray-500 text-center">
//               No matches found
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// // ============================================================
// // Helper: QC User Search Component
// // ============================================================
// const QCUserSearch = ({ onSelect }) => {
//   const [term, setTerm] = useState("");
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showDropdown, setShowDropdown] = useState(false);
//   const wrapperRef = useRef(null);

//   useEffect(() => {
//     const delayDebounceFn = setTimeout(async () => {
//       if (term.length >= 2) {
//         setLoading(true);
//         try {
//           const res = await axios.get(
//             `${API_BASE_URL}/api/users/search?term=${term}`
//           );
//           setResults(res.data);
//           setShowDropdown(true);
//         } catch (error) {
//           console.error("Search failed", error);
//         } finally {
//           setLoading(false);
//         }
//       } else {
//         setResults([]);
//         setShowDropdown(false);
//       }
//     }, 400);

//     return () => clearTimeout(delayDebounceFn);
//   }, [term]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleSelection = (user) => {
//     onSelect(user);
//     setTerm("");
//     setShowDropdown(false);
//   };

//   return (
//     <div className="relative w-full" ref={wrapperRef}>
//       <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
//         <Search className="w-4 h-4 text-gray-400 ml-2" />
//         <input
//           type="text"
//           className="w-full px-2 py-1.5 text-xs outline-none bg-transparent dark:text-white"
//           placeholder="Type Name or ID..."
//           value={term}
//           onChange={(e) => setTerm(e.target.value)}
//         />
//         {loading && (
//           <Loader2 className="w-3 h-3 animate-spin text-indigo-500 mr-2" />
//         )}
//       </div>

//       {showDropdown && results.length > 0 && (
//         <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
//           {results.map((user) => (
//             <div
//               key={user.emp_id}
//               className="px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
//               onClick={() => handleSelection(user)}
//             >
//               <div className="flex items-center gap-2">
//                 {user.face_photo ? (
//                   <img
//                     src={user.face_photo}
//                     alt="face"
//                     className="w-6 h-6 rounded-full object-cover"
//                   />
//                 ) : (
//                   <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
//                     {user.eng_name ? user.eng_name.charAt(0) : "U"}
//                   </div>
//                 )}
//                 <div>
//                   <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
//                     {user.eng_name}
//                   </p>
//                   <p className="text-[10px] text-gray-500">{user.emp_id}</p>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// // ============================================================
// // Main Component
// // ============================================================
// const YPivotQAInspectionLineTableColorConfig = ({
//   reportData,
//   orderData,
//   onUpdate
// }) => {
//   const { selectedTemplate, config } = reportData;
//   const isAQL = selectedTemplate?.InspectedQtyMethod === "AQL";
//   const aqlSampleSize = config?.aqlSampleSize || 0;

//   // -- State --
//   const [groups, setGroups] = useState(reportData.lineTableConfig || []);
//   const [lines, setLines] = useState([]);
//   const [tables, setTables] = useState([]);
//   const [orderColors, setOrderColors] = useState([]);

//   const [isScannerOpen, setIsScannerOpen] = useState(false);
//   const [activeGroupIndex, setActiveGroupIndex] = useState(null);

//   // Loading Resources
//   useEffect(() => {
//     const fetchResources = async () => {
//       try {
//         const promises = [];

//         if (selectedTemplate?.Line === "Yes") {
//           if (config?.isSubCon && config?.selectedSubConFactory) {
//             promises.push(
//               axios.get(
//                 `${API_BASE_URL}/api/fincheck-inspection/subcon-factories`
//               )
//             );
//           } else {
//             promises.push(axios.get(`${API_BASE_URL}/api/qa-sections-lines`));
//           }
//         } else {
//           promises.push(Promise.resolve(null));
//         }

//         if (selectedTemplate?.Table === "Yes") {
//           promises.push(axios.get(`${API_BASE_URL}/api/qa-sections-tables`));
//         } else {
//           promises.push(Promise.resolve(null));
//         }

//         if (
//           selectedTemplate?.Colors === "Yes" &&
//           orderData?.selectedOrders?.length
//         ) {
//           promises.push(
//             axios.post(`${API_BASE_URL}/api/fincheck-inspection/order-colors`, {
//               orderNos: orderData.selectedOrders
//             })
//           );
//         } else {
//           promises.push(Promise.resolve(null));
//         }

//         const [linesRes, tablesRes, colorsRes] = await Promise.all(promises);

//         if (linesRes) {
//           if (config?.isSubCon) {
//             const factory = linesRes.data.data.find(
//               (f) => f._id === config.selectedSubConFactory
//             );
//             setLines(
//               factory?.lineList?.map((l) => ({ value: l, label: l })) || []
//             );
//           } else {
//             setLines(
//               linesRes.data.data
//                 .filter((l) => l.Active)
//                 .map((l) => ({ value: l._id, label: l.LineNo }))
//             );
//           }
//         }

//         if (tablesRes) {
//           setTables(
//             tablesRes.data.data
//               .filter((t) => t.Active)
//               .map((t) => ({ value: t._id, label: t.TableNo }))
//           );
//         }

//         if (colorsRes) {
//           setOrderColors(
//             colorsRes.data.data.map((c) => ({ value: c.color, label: c.color }))
//           );
//         }
//       } catch (err) {
//         console.error("Error fetching resources", err);
//       }
//     };

//     if (selectedTemplate) fetchResources();
//   }, [selectedTemplate, config, orderData]);

//   // -- AQL Sync Effect --
//   // Forces the first row qty to match the calculated Sample Size if AQL
//   // Note: Even though we hide the input in UI, we still keep data consistent in state
//   useEffect(() => {
//     if (isAQL && groups.length > 0) {
//       const firstGroup = groups[0];
//       const firstAssignment = firstGroup.assignments[0];

//       if (firstAssignment.qty !== aqlSampleSize.toString()) {
//         const updated = [...groups];
//         updated[0].assignments[0].qty = aqlSampleSize.toString();
//         setGroups(updated);
//         onUpdate({ lineTableConfig: updated });
//       }
//     }
//   }, [isAQL, aqlSampleSize, groups, onUpdate]);

//   // -- Auto Calculation for Total Qty (Header) --
//   const totalDisplayQty = useMemo(() => {
//     // If AQL, show target sample size from previous tab
//     if (isAQL) return aqlSampleSize;

//     // If Fixed, sum all editable rows
//     return groups.reduce((total, group) => {
//       const groupTotal = group.assignments.reduce(
//         (sum, assign) => sum + (parseInt(assign.qty) || 0),
//         0
//       );
//       return total + groupTotal;
//     }, 0);
//   }, [groups, isAQL, aqlSampleSize]);

//   // -- Handlers --

//   const handleAddGroup = () => {
//     let defaultRowQty = "";
//     if (!isAQL && selectedTemplate.InspectedQty) {
//       defaultRowQty = selectedTemplate.InspectedQty.toString();
//     }

//     const newGroup = {
//       id: Date.now(),
//       line: "",
//       table: "",
//       color: "",
//       assignments: [{ id: Date.now() + 1, qcUser: null, qty: defaultRowQty }]
//     };
//     const updated = [...groups, newGroup];
//     setGroups(updated);
//     onUpdate({ lineTableConfig: updated });
//   };

//   const handleRemoveGroup = (index) => {
//     if (window.confirm("Remove this configuration group?")) {
//       const updated = [...groups];
//       updated.splice(index, 1);
//       setGroups(updated);
//       onUpdate({ lineTableConfig: updated });
//     }
//   };

//   const checkForDuplicateScope = (newValues, currentIndex) => {
//     const { line, table, color } = newValues;
//     const exists = groups.some((g, idx) => {
//       if (idx === currentIndex) return false;

//       const lineMatch = (g.line || "") === (line || "");
//       const tableMatch = (g.table || "") === (table || "");
//       const colorMatch = (g.color || "") === (color || "");

//       let isMatch = true;
//       if (selectedTemplate.Line === "Yes" && !lineMatch) isMatch = false;
//       if (selectedTemplate.Table === "Yes" && !tableMatch) isMatch = false;
//       if (selectedTemplate.Colors === "Yes" && !colorMatch) isMatch = false;

//       return isMatch;
//     });
//     return exists;
//   };

//   const handleUpdateGroup = (index, field, value) => {
//     const updated = [...groups];
//     const groupToUpdate = { ...updated[index], [field]: value };

//     if (checkForDuplicateScope(groupToUpdate, index)) {
//       Swal.fire({
//         icon: "warning",
//         title: "Duplicate",
//         text: "This Line/Table/Color combination already exists.",
//         timer: 2000,
//         showConfirmButton: false
//       });
//       return;
//     }

//     updated[index][field] = value;
//     setGroups(updated);
//     onUpdate({ lineTableConfig: updated });
//   };

//   const handleAddAssignment = (groupIndex, qcUser = null) => {
//     if (qcUser) {
//       const group = groups[groupIndex];
//       const exists = group.assignments.some(
//         (a) => a.qcUser && a.qcUser.emp_id === qcUser.emp_id
//       );
//       if (exists) {
//         Swal.fire({
//           icon: "error",
//           title: "Duplicate QC",
//           text: "QC already added."
//         });
//         return;
//       }
//     }

//     let defaultRowQty = "";
//     if (!isAQL && selectedTemplate.InspectedQty) {
//       defaultRowQty = selectedTemplate.InspectedQty.toString();
//     }

//     const updated = [...groups];
//     updated[groupIndex].assignments.push({
//       id: Date.now(),
//       qcUser: qcUser,
//       qty: defaultRowQty
//     });
//     setGroups(updated);
//     onUpdate({ lineTableConfig: updated });
//   };

//   const handleRemoveAssignment = (groupIndex, assignIndex) => {
//     const updated = [...groups];
//     updated[groupIndex].assignments.splice(assignIndex, 1);
//     setGroups(updated);
//     onUpdate({ lineTableConfig: updated });
//   };

//   const handleUpdateAssignment = (groupIndex, assignIndex, field, value) => {
//     const updated = [...groups];
//     if (field === "qcUser" && value) {
//       const group = groups[groupIndex];
//       const exists = group.assignments.some(
//         (a, idx) =>
//           idx !== assignIndex && a.qcUser && a.qcUser.emp_id === value.emp_id
//       );
//       if (exists) {
//         Swal.fire({
//           icon: "error",
//           title: "Duplicate QC",
//           text: "QC already added."
//         });
//         return;
//       }
//     }
//     updated[groupIndex].assignments[assignIndex][field] = value;
//     setGroups(updated);
//     onUpdate({ lineTableConfig: updated });
//   };

//   const handleQCSelect = (userData, groupIndex) => {
//     const group = groups[groupIndex];
//     const isDuplicate = group.assignments.some(
//       (a) => a.qcUser && a.qcUser.emp_id === userData.emp_id
//     );

//     if (isDuplicate) {
//       Swal.fire({
//         icon: "error",
//         title: "Duplicate",
//         text: "QC already in list."
//       });
//       return;
//     }

//     const emptySlotIndex = group.assignments.findIndex((a) => !a.qcUser);
//     if (emptySlotIndex !== -1) {
//       handleUpdateAssignment(groupIndex, emptySlotIndex, "qcUser", userData);
//     } else {
//       handleAddAssignment(groupIndex, userData);
//     }
//   };

//   const handleOpenScanner = (groupIndex) => {
//     setActiveGroupIndex(groupIndex);
//     setIsScannerOpen(true);
//   };

//   const handleScanSuccess = (userData) => {
//     if (activeGroupIndex !== null) handleQCSelect(userData, activeGroupIndex);
//     setIsScannerOpen(false);
//     setActiveGroupIndex(null);
//   };

//   if (!selectedTemplate) return null;

//   const showLine = selectedTemplate.Line === "Yes";
//   const showTable = selectedTemplate.Table === "Yes";
//   const showColors = selectedTemplate.Colors === "Yes";
//   const showQC = selectedTemplate.isQCScan === "Yes";

//   return (
//     <div className="space-y-6 pb-20">
//       {/* Header Info */}
//       <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-0 z-30">
//         <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center shadow-md">
//           <div>
//             <h2 className="text-white font-bold text-lg flex items-center gap-2">
//               <FileText className="w-5 h-5" />
//               {selectedTemplate.ReportType}
//             </h2>
//             <p className="text-indigo-100 text-xs mt-1 opacity-80">
//               {isAQL ? "AQL Standard" : "Fixed Quantity Inspection"}
//             </p>
//           </div>

//           <div className="flex flex-col items-end">
//             <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">
//               {isAQL ? "Target Sample Size" : "Total Inspected Qty"}
//             </span>
//             <div className="flex items-center gap-2">
//               <span className="text-3xl font-black text-white">
//                 {totalDisplayQty || 0}
//               </span>
//               {isAQL ? (
//                 <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
//                   <Hash className="w-3 h-3" /> AQL
//                 </span>
//               ) : (
//                 <span className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
//                   <Calculator className="w-3 h-3" /> Auto
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Cards */}
//       <div className="space-y-4">
//         {groups.map((group, gIdx) => (
//           <div
//             key={group.id}
//             className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg"
//           >
//             <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-xl">
//               <div className="flex flex-wrap items-end gap-4">
//                 {showLine && (
//                   <div className="w-full sm:w-40">
//                     <SearchableSingleSelect
//                       label={config?.isSubCon ? "SubCon Line" : "Line No"}
//                       options={lines}
//                       selectedValue={group.line}
//                       onSelectionChange={(val) =>
//                         handleUpdateGroup(gIdx, "line", val)
//                       }
//                       placeholder="Select Line"
//                     />
//                   </div>
//                 )}
//                 {showTable && (
//                   <div className="w-full sm:w-32">
//                     <SearchableSingleSelect
//                       label="Table No"
//                       options={tables}
//                       selectedValue={group.table}
//                       onSelectionChange={(val) =>
//                         handleUpdateGroup(gIdx, "table", val)
//                       }
//                       placeholder="Select Table"
//                     />
//                   </div>
//                 )}
//                 {showColors && (
//                   <div className="w-full sm:w-48">
//                     <SearchableSingleSelect
//                       label="Color"
//                       options={orderColors}
//                       selectedValue={group.color}
//                       onSelectionChange={(val) =>
//                         handleUpdateGroup(gIdx, "color", val)
//                       }
//                       placeholder="Select Color"
//                     />
//                   </div>
//                 )}
//                 <div className="ml-auto">
//                   <button
//                     onClick={() => handleRemoveGroup(gIdx)}
//                     className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
//                   >
//                     <Trash2 className="w-5 h-5" />
//                   </button>
//                 </div>
//               </div>
//             </div>

//             <div className="p-0 overflow-x-auto">
//               <table className="w-full text-sm text-left">
//                 <thead className="bg-white dark:bg-gray-800 text-gray-500 border-b border-gray-100 dark:border-gray-700">
//                   <tr>
//                     {showQC && (
//                       <th className="px-4 py-2 font-medium w-1/2">
//                         QC / Inspector
//                       </th>
//                     )}
//                     {/* Only show Inspected Qty column if NOT AQL */}
//                     {!isAQL && (
//                       <th className="px-4 py-2 font-medium">
//                         Inspected Qty (Row)
//                       </th>
//                     )}
//                     <th className="px-4 py-2 font-medium text-right">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
//                   {group.assignments.map((assign, aIdx) => (
//                     <tr
//                       key={assign.id}
//                       className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
//                     >
//                       {showQC && (
//                         <td className="px-4 py-3 align-top">
//                           {assign.qcUser ? (
//                             <div className="flex items-center gap-3">
//                               <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
//                                 {assign.qcUser.eng_name?.charAt(0) || "U"}
//                               </div>
//                               <div>
//                                 <p className="font-bold text-gray-800 dark:text-gray-200">
//                                   {assign.qcUser.eng_name}
//                                 </p>
//                                 <p className="text-xs text-gray-500">
//                                   {assign.qcUser.emp_id}
//                                 </p>
//                               </div>
//                               <button
//                                 onClick={() =>
//                                   handleUpdateAssignment(
//                                     gIdx,
//                                     aIdx,
//                                     "qcUser",
//                                     null
//                                   )
//                                 }
//                                 className="ml-auto text-gray-300 hover:text-red-500"
//                               >
//                                 <X className="w-4 h-4" />
//                               </button>
//                             </div>
//                           ) : (
//                             <div className="flex gap-2 items-center">
//                               <button
//                                 onClick={() => handleOpenScanner(gIdx)}
//                                 className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg"
//                               >
//                                 <Scan className="w-4 h-4" />{" "}
//                                 <span className="hidden sm:inline text-xs font-bold">
//                                   Scan
//                                 </span>
//                               </button>
//                               <div className="flex-1">
//                                 <QCUserSearch
//                                   onSelect={(user) =>
//                                     handleQCSelect(user, gIdx)
//                                   }
//                                 />
//                               </div>
//                             </div>
//                           )}
//                         </td>
//                       )}

//                       {/* Qty Column - Only Visible if NOT AQL */}
//                       {!isAQL && (
//                         <td className="px-4 py-3 align-middle">
//                           <div className="flex items-center gap-2">
//                             <input
//                               type="number"
//                               value={assign.qty}
//                               onChange={(e) =>
//                                 handleUpdateAssignment(
//                                   gIdx,
//                                   aIdx,
//                                   "qty",
//                                   e.target.value
//                                 )
//                               }
//                               className="w-24 px-3 py-2 border rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
//                               placeholder="0"
//                             />
//                             <span className="text-xs text-gray-400 font-medium">
//                               pcs
//                             </span>
//                           </div>
//                         </td>
//                       )}

//                       <td className="px-4 py-3 text-right align-middle">
//                         <div className="flex justify-end gap-2">
//                           {group.assignments.length > 1 && (
//                             <button
//                               onClick={() => handleRemoveAssignment(gIdx, aIdx)}
//                               className="p-2 text-gray-400 hover:text-red-500"
//                             >
//                               <Trash2 className="w-4 h-4" />
//                             </button>
//                           )}
//                           <button
//                             onClick={() =>
//                               Swal.fire(
//                                 "Started",
//                                 "Inspection started",
//                                 "success"
//                               )
//                             }
//                             className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
//                             disabled={showQC && !assign.qcUser}
//                           >
//                             <Play className="w-4 h-4 fill-current" />{" "}
//                             <span className="text-xs font-bold">Start</span>
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//               {/* Only allow splitting/adding rows if QC Scan is enabled and it is NOT AQL mode (Fixed mode allows breakdown) */}
//               {showQC && !isAQL && (
//                 <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700">
//                   <button
//                     onClick={() => handleAddAssignment(gIdx)}
//                     className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-indigo-300 w-full justify-center hover:bg-indigo-50"
//                   >
//                     <Plus className="w-4 h-4" /> Add Inspector / Split Quantity
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         ))}

//         {groups.length === 0 && (
//           <div className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
//             <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-3">
//               <FileText className="w-8 h-8 text-gray-400" />
//             </div>
//             <p className="text-gray-500 font-medium">
//               No inspection groups configured.
//             </p>
//           </div>
//         )}

//         <button
//           onClick={handleAddGroup}
//           className="w-full py-4 border-2 border-dashed border-indigo-300 rounded-xl flex items-center justify-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50"
//         >
//           <Plus className="w-5 h-5" /> Add New Configuration Group
//         </button>
//       </div>

//       {isScannerOpen && (
//         <EmpQRCodeScanner
//           onUserDataFetched={(user) => handleScanSuccess(user)}
//           onClose={() => {
//             setIsScannerOpen(false);
//             setActiveGroupIndex(null);
//           }}
//         />
//       )}
//     </div>
//   );
// };

// export default YPivotQAInspectionLineTableColorConfig;

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Scan,
  User,
  CheckCircle2,
  Play,
  X,
  ChevronDown,
  Calculator,
  Loader2,
  Search,
  Hash,
  PauseCircle
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import EmpQRCodeScanner from "../../qc_roving/EmpQRCodeScanner";

// ============================================================
// Helper: Searchable Dropdown
// ============================================================
const SearchableSingleSelect = ({
  label,
  options,
  selectedValue,
  onSelectionChange,
  placeholder,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  const filteredOptions = options.filter((opt) =>
    String(opt.label).toLowerCase().includes(searchTerm.toLowerCase())
  );
  const selectedLabel = options.find((o) => o.value === selectedValue)?.label;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (disabled)
    return (
      <div className="opacity-50 pointer-events-none p-2 bg-gray-100 rounded text-sm">
        N/A
      </div>
    );

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="block text-xs font-bold text-gray-500 mb-1">
          {label}
        </label>
      )}
      <div
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm flex justify-between items-center cursor-pointer hover:border-indigo-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={
            selectedValue
              ? "text-gray-800 dark:text-gray-200 font-medium"
              : "text-gray-400"
          }
        >
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
            <input
              type="text"
              className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Filter options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className={`px-3 py-2 text-sm cursor-pointer ${
                  opt.value === selectedValue
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 font-bold"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => {
                  onSelectionChange(opt.value);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-gray-500 text-center">
              No matches found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Helper: QC User Search Component
// ============================================================
const QCUserSearch = ({ onSelect }) => {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (term.length >= 2) {
        setLoading(true);
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/users/search?term=${term}`
          );
          setResults(res.data);
          setShowDropdown(true);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [term]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelection = (user) => {
    onSelect(user);
    setTerm("");
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
        <Search className="w-4 h-4 text-gray-400 ml-2" />
        <input
          type="text"
          className="w-full px-2 py-1.5 text-xs outline-none bg-transparent dark:text-white"
          placeholder="Type Name or ID..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        {loading && (
          <Loader2 className="w-3 h-3 animate-spin text-indigo-500 mr-2" />
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
          {results.map((user) => (
            <div
              key={user.emp_id}
              className="px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
              onClick={() => handleSelection(user)}
            >
              <div className="flex items-center gap-2">
                {user.face_photo ? (
                  <img
                    src={user.face_photo}
                    alt="face"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                    {user.eng_name ? user.eng_name.charAt(0) : "U"}
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                    {user.eng_name}
                  </p>
                  <p className="text-[10px] text-gray-500">{user.emp_id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
const YPivotQAInspectionLineTableColorConfig = ({
  reportData,
  orderData,
  onUpdate,
  onSetActiveGroup, // NEW: Function to set active group
  activeGroup // NEW: Currently active group object
}) => {
  const { selectedTemplate, config } = reportData;
  const isAQL = selectedTemplate?.InspectedQtyMethod === "AQL";
  const aqlSampleSize = config?.aqlSampleSize || 0;

  // -- State --
  const [groups, setGroups] = useState(reportData.lineTableConfig || []);
  const [lines, setLines] = useState([]);
  const [tables, setTables] = useState([]);
  const [orderColors, setOrderColors] = useState([]);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(null);

  // Loading Resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const promises = [];

        if (selectedTemplate?.Line === "Yes") {
          if (config?.isSubCon && config?.selectedSubConFactory) {
            promises.push(
              axios.get(
                `${API_BASE_URL}/api/fincheck-inspection/subcon-factories`
              )
            );
          } else {
            promises.push(axios.get(`${API_BASE_URL}/api/qa-sections-lines`));
          }
        } else {
          promises.push(Promise.resolve(null));
        }

        if (selectedTemplate?.Table === "Yes") {
          promises.push(axios.get(`${API_BASE_URL}/api/qa-sections-tables`));
        } else {
          promises.push(Promise.resolve(null));
        }

        if (
          selectedTemplate?.Colors === "Yes" &&
          orderData?.selectedOrders?.length
        ) {
          promises.push(
            axios.post(`${API_BASE_URL}/api/fincheck-inspection/order-colors`, {
              orderNos: orderData.selectedOrders
            })
          );
        } else {
          promises.push(Promise.resolve(null));
        }

        const [linesRes, tablesRes, colorsRes] = await Promise.all(promises);

        if (linesRes) {
          if (config?.isSubCon) {
            const factory = linesRes.data.data.find(
              (f) => f._id === config.selectedSubConFactory
            );
            setLines(
              factory?.lineList?.map((l) => ({ value: l, label: l })) || []
            );
          } else {
            setLines(
              linesRes.data.data
                .filter((l) => l.Active)
                .map((l) => ({ value: l._id, label: l.LineNo }))
            );
          }
        }

        if (tablesRes) {
          setTables(
            tablesRes.data.data
              .filter((t) => t.Active)
              .map((t) => ({ value: t._id, label: t.TableNo }))
          );
        }

        if (colorsRes) {
          setOrderColors(
            colorsRes.data.data.map((c) => ({ value: c.color, label: c.color }))
          );
        }
      } catch (err) {
        console.error("Error fetching resources", err);
      }
    };

    if (selectedTemplate) fetchResources();
  }, [selectedTemplate, config, orderData]);

  // -- AQL Sync Effect --
  useEffect(() => {
    if (isAQL && groups.length > 0) {
      const firstGroup = groups[0];
      const firstAssignment = firstGroup.assignments[0];

      if (firstAssignment.qty !== aqlSampleSize.toString()) {
        const updated = [...groups];
        updated[0].assignments[0].qty = aqlSampleSize.toString();
        setGroups(updated);
        onUpdate({ lineTableConfig: updated });
      }
    }
  }, [isAQL, aqlSampleSize, groups, onUpdate]);

  // -- Auto Calculation for Total Qty (Header) --
  const totalDisplayQty = useMemo(() => {
    if (isAQL) return aqlSampleSize;
    return groups.reduce((total, group) => {
      const groupTotal = group.assignments.reduce(
        (sum, assign) => sum + (parseInt(assign.qty) || 0),
        0
      );
      return total + groupTotal;
    }, 0);
  }, [groups, isAQL, aqlSampleSize]);

  // -- Handlers --

  const handleAddGroup = () => {
    let defaultRowQty = "";
    if (!isAQL && selectedTemplate.InspectedQty) {
      defaultRowQty = selectedTemplate.InspectedQty.toString();
    }

    const newGroup = {
      id: Date.now(),
      line: "",
      table: "",
      color: "",
      assignments: [{ id: Date.now() + 1, qcUser: null, qty: defaultRowQty }]
    };
    const updated = [...groups, newGroup];
    setGroups(updated);
    onUpdate({ lineTableConfig: updated });
  };

  const handleRemoveGroup = (index) => {
    if (window.confirm("Remove this configuration group?")) {
      const updated = [...groups];
      // Check if this group was active
      if (activeGroup?.id === updated[index].id) {
        onSetActiveGroup(null);
      }
      updated.splice(index, 1);
      setGroups(updated);
      onUpdate({ lineTableConfig: updated });
    }
  };

  const checkForDuplicateScope = (newValues, currentIndex) => {
    const { line, table, color } = newValues;
    const exists = groups.some((g, idx) => {
      if (idx === currentIndex) return false;
      const lineMatch = (g.line || "") === (line || "");
      const tableMatch = (g.table || "") === (table || "");
      const colorMatch = (g.color || "") === (color || "");
      let isMatch = true;
      if (selectedTemplate.Line === "Yes" && !lineMatch) isMatch = false;
      if (selectedTemplate.Table === "Yes" && !tableMatch) isMatch = false;
      if (selectedTemplate.Colors === "Yes" && !colorMatch) isMatch = false;
      return isMatch;
    });
    return exists;
  };

  const handleUpdateGroup = (index, field, value) => {
    const updated = [...groups];
    const groupToUpdate = { ...updated[index], [field]: value };

    if (checkForDuplicateScope(groupToUpdate, index)) {
      Swal.fire({
        icon: "warning",
        title: "Duplicate",
        text: "This combination exists.",
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    updated[index][field] = value;
    setGroups(updated);
    onUpdate({ lineTableConfig: updated });

    // If updating currently active group, verify consistency or deactivate
    if (activeGroup?.id === updated[index].id) {
      // Optional: Auto-update active group reference or force re-activation
      onSetActiveGroup(updated[index]);
    }
  };

  const handleAddAssignment = (groupIndex, qcUser = null) => {
    if (qcUser) {
      const group = groups[groupIndex];
      const exists = group.assignments.some(
        (a) => a.qcUser && a.qcUser.emp_id === qcUser.emp_id
      );
      if (exists) {
        Swal.fire({
          icon: "error",
          title: "Duplicate QC",
          text: "QC already added."
        });
        return;
      }
    }

    let defaultRowQty = "";
    if (!isAQL && selectedTemplate.InspectedQty) {
      defaultRowQty = selectedTemplate.InspectedQty.toString();
    }

    const updated = [...groups];
    updated[groupIndex].assignments.push({
      id: Date.now(),
      qcUser: qcUser,
      qty: defaultRowQty
    });
    setGroups(updated);
    onUpdate({ lineTableConfig: updated });
  };

  const handleRemoveAssignment = (groupIndex, assignIndex) => {
    const updated = [...groups];
    updated[groupIndex].assignments.splice(assignIndex, 1);
    setGroups(updated);
    onUpdate({ lineTableConfig: updated });
  };

  const handleUpdateAssignment = (groupIndex, assignIndex, field, value) => {
    const updated = [...groups];
    if (field === "qcUser" && value) {
      const group = groups[groupIndex];
      const exists = group.assignments.some(
        (a, idx) =>
          idx !== assignIndex && a.qcUser && a.qcUser.emp_id === value.emp_id
      );
      if (exists) {
        Swal.fire({
          icon: "error",
          title: "Duplicate QC",
          text: "QC already added."
        });
        return;
      }
    }
    updated[groupIndex].assignments[assignIndex][field] = value;
    setGroups(updated);
    onUpdate({ lineTableConfig: updated });
  };

  const handleQCSelect = (userData, groupIndex) => {
    const group = groups[groupIndex];
    const isDuplicate = group.assignments.some(
      (a) => a.qcUser && a.qcUser.emp_id === userData.emp_id
    );

    if (isDuplicate) {
      Swal.fire({
        icon: "error",
        title: "Duplicate",
        text: "QC already in list."
      });
      return;
    }

    const emptySlotIndex = group.assignments.findIndex((a) => !a.qcUser);
    if (emptySlotIndex !== -1) {
      handleUpdateAssignment(groupIndex, emptySlotIndex, "qcUser", userData);
    } else {
      handleAddAssignment(groupIndex, userData);
    }
  };

  const handleOpenScanner = (groupIndex) => {
    setActiveGroupIndex(groupIndex);
    setIsScannerOpen(true);
  };

  const handleScanSuccess = (userData) => {
    if (activeGroupIndex !== null) handleQCSelect(userData, activeGroupIndex);
    setIsScannerOpen(false);
    setActiveGroupIndex(null);
  };

  // --- ACTIVATE GROUP HANDLER ---
  const handleActivateGroup = (group, assignment = null) => {
    // Basic Validation
    if (selectedTemplate.Line === "Yes" && !group.line)
      return Swal.fire("Missing Info", "Please select a Line.", "warning");
    if (selectedTemplate.Table === "Yes" && !group.table)
      return Swal.fire("Missing Info", "Please select a Table.", "warning");
    if (selectedTemplate.Colors === "Yes" && !group.color)
      return Swal.fire("Missing Info", "Please select a Color.", "warning");

    // Construct active context
    // We attach the specific QC user if started from a specific row, otherwise general
    const context = {
      ...group,
      activeAssignmentId: assignment?.id,
      activeQC: assignment?.qcUser
    };

    onSetActiveGroup(context);
    Swal.fire({
      icon: "success",
      title: "Inspection Active",
      text: "You can now proceed to Measurement or Defect tabs.",
      timer: 1500,
      showConfirmButton: false
    });
  };

  if (!selectedTemplate) return null;

  const showLine = selectedTemplate.Line === "Yes";
  const showTable = selectedTemplate.Table === "Yes";
  const showColors = selectedTemplate.Colors === "Yes";
  const showQC = selectedTemplate.isQCScan === "Yes";

  return (
    <div className="space-y-6 pb-20">
      {/* Header Info */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-0 z-30">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center shadow-md">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedTemplate.ReportType}
            </h2>
            <p className="text-indigo-100 text-xs mt-1 opacity-80">
              {isAQL ? "AQL Standard" : "Fixed Quantity Inspection"}
            </p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">
              {isAQL ? "Target Sample Size" : "Total Inspected Qty"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-white">
                {totalDisplayQty || 0}
              </span>
              {isAQL ? (
                <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Hash className="w-3 h-3" /> AQL
                </span>
              ) : (
                <span className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> Auto
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Context Banner */}
      {activeGroup && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
              <Play className="w-5 h-5 text-green-600 dark:text-green-300 fill-current" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-800 dark:text-green-300">
                Active Inspection Session
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">
                Line:{" "}
                {lines.find((l) => l.value === activeGroup.line)?.label ||
                  activeGroup.line ||
                  "-"}{" "}
                • Color: {activeGroup.color || "-"}
              </p>
            </div>
          </div>
          <button
            onClick={() => onSetActiveGroup(null)}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 text-xs font-bold rounded-lg hover:bg-green-50 dark:hover:bg-green-900/40"
          >
            End Session
          </button>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-4">
        {groups.map((group, gIdx) => {
          const isActive = activeGroup?.id === group.id;
          return (
            <div
              key={group.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border transition-all hover:shadow-lg ${
                isActive
                  ? "border-green-500 ring-2 ring-green-100 dark:ring-green-900/30"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-xl">
                <div className="flex flex-wrap items-end gap-4">
                  {showLine && (
                    <div className="w-full sm:w-40">
                      <SearchableSingleSelect
                        label={config?.isSubCon ? "SubCon Line" : "Line No"}
                        options={lines}
                        selectedValue={group.line}
                        onSelectionChange={(val) =>
                          handleUpdateGroup(gIdx, "line", val)
                        }
                        placeholder="Select Line"
                      />
                    </div>
                  )}
                  {showTable && (
                    <div className="w-full sm:w-32">
                      <SearchableSingleSelect
                        label="Table No"
                        options={tables}
                        selectedValue={group.table}
                        onSelectionChange={(val) =>
                          handleUpdateGroup(gIdx, "table", val)
                        }
                        placeholder="Select Table"
                      />
                    </div>
                  )}
                  {showColors && (
                    <div className="w-full sm:w-48">
                      <SearchableSingleSelect
                        label="Color"
                        options={orderColors}
                        selectedValue={group.color}
                        onSelectionChange={(val) =>
                          handleUpdateGroup(gIdx, "color", val)
                        }
                        placeholder="Select Color"
                      />
                    </div>
                  )}

                  <div className="ml-auto flex items-center gap-2">
                    {isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveGroup(gIdx)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white dark:bg-gray-800 text-gray-500 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      {showQC && (
                        <th className="px-4 py-2 font-medium w-1/2">
                          QC / Inspector
                        </th>
                      )}
                      {!isAQL && (
                        <th className="px-4 py-2 font-medium">
                          Inspected Qty (Row)
                        </th>
                      )}
                      <th className="px-4 py-2 font-medium text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {group.assignments.map((assign, aIdx) => (
                      <tr
                        key={assign.id}
                        className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        {showQC && (
                          <td className="px-4 py-3 align-top">
                            {assign.qcUser ? (
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                  {assign.qcUser.eng_name?.charAt(0) || "U"}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800 dark:text-gray-200">
                                    {assign.qcUser.eng_name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {assign.qcUser.emp_id}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    handleUpdateAssignment(
                                      gIdx,
                                      aIdx,
                                      "qcUser",
                                      null
                                    )
                                  }
                                  className="ml-auto text-gray-300 hover:text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2 items-center">
                                <button
                                  onClick={() => handleOpenScanner(gIdx)}
                                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg"
                                >
                                  <Scan className="w-4 h-4" />{" "}
                                  <span className="hidden sm:inline text-xs font-bold">
                                    Scan
                                  </span>
                                </button>
                                <div className="flex-1">
                                  <QCUserSearch
                                    onSelect={(user) =>
                                      handleQCSelect(user, gIdx)
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </td>
                        )}

                        {!isAQL && (
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={assign.qty}
                                onChange={(e) =>
                                  handleUpdateAssignment(
                                    gIdx,
                                    aIdx,
                                    "qty",
                                    e.target.value
                                  )
                                }
                                className="w-24 px-3 py-2 border rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="0"
                              />
                              <span className="text-xs text-gray-400 font-medium">
                                pcs
                              </span>
                            </div>
                          </td>
                        )}

                        <td className="px-4 py-3 text-right align-middle">
                          <div className="flex justify-end gap-2">
                            {group.assignments.length > 1 && (
                              <button
                                onClick={() =>
                                  handleRemoveAssignment(gIdx, aIdx)
                                }
                                className="p-2 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleActivateGroup(group, assign)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 ${
                                isActive
                                  ? "bg-gray-200 text-gray-600 cursor-default"
                                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
                              }`}
                              disabled={(showQC && !assign.qcUser) || isActive}
                            >
                              {isActive ? (
                                <PauseCircle className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4 fill-current" />
                              )}
                              <span className="text-xs font-bold">
                                {isActive ? "Active" : "Start"}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {showQC && !isAQL && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handleAddAssignment(gIdx)}
                      className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-indigo-300 w-full justify-center hover:bg-indigo-50"
                    >
                      <Plus className="w-4 h-4" /> Add Inspector / Split
                      Quantity
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-3">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              No inspection groups configured.
            </p>
          </div>
        )}

        <button
          onClick={handleAddGroup}
          className="w-full py-4 border-2 border-dashed border-indigo-300 rounded-xl flex items-center justify-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50"
        >
          <Plus className="w-5 h-5" /> Add New Configuration Group
        </button>
      </div>

      {isScannerOpen && (
        <EmpQRCodeScanner
          onUserDataFetched={(user) => handleScanSuccess(user)}
          onClose={() => {
            setIsScannerOpen(false);
            setActiveGroupIndex(null);
          }}
        />
      )}
    </div>
  );
};

export default YPivotQAInspectionLineTableColorConfig;
