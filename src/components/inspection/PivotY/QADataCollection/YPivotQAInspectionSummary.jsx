// import React, { useMemo, useState, useEffect } from "react";
// import axios from "axios";
// import {
//   FileText,
//   Package,
//   Layers,
//   Hash,
//   Users,
//   MapPin,
//   Calendar,
//   Settings,
//   Tag,
//   Shirt,
//   Globe,
//   Truck,
//   Camera,
//   MessageSquare,
//   XCircle,
//   ChevronDown,
//   ChevronUp,
//   Loader,
//   Building2,
//   ClipboardCheck,
//   AlertCircle
// } from "lucide-react";
// import { API_BASE_URL } from "../../../../../config";
// import YPivotQAInspectionQRCode from "./YPivotQAInspectionQRCode";

// // --- Helper: Modal for Image Preview ---
// const ImagePreviewModal = ({ src, alt, onClose }) => {
//   if (!src) return null;
//   return (
//     <div
//       className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
//       onClick={onClose}
//     >
//       <div className="relative max-w-4xl w-full max-h-[90vh]">
//         <button
//           onClick={onClose}
//           className="absolute -top-4 -right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
//         >
//           <XCircle className="w-8 h-8" />
//         </button>
//         <img
//           src={src}
//           alt={alt}
//           className="w-full h-full object-contain rounded-lg shadow-2xl"
//         />
//         <p className="text-center text-white/80 mt-2 font-mono text-sm">
//           {alt}
//         </p>
//       </div>
//     </div>
//   );
// };

// // --- Helper: Info Row ---
// const InfoRow = ({ label, value, icon: Icon, subValue, className = "" }) => (
//   <div
//     className={`flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 ${className}`}
//   >
//     <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
//       {Icon ? <Icon className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
//     </div>
//     <div className="min-w-0 flex-1">
//       <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
//         {label}
//       </p>
//       <p
//         className="text-sm font-bold text-gray-800 dark:text-white mt-0.5 truncate"
//         title={value}
//       >
//         {value || "-"}
//       </p>
//       {subValue && (
//         <p
//           className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate"
//           title={subValue}
//         >
//           {subValue}
//         </p>
//       )}
//     </div>
//   </div>
// );

// // --- Helper: Section Header ---
// const SectionHeader = ({ title, icon: Icon, color = "text-gray-800" }) => (
//   <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
//     <div className={`p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700`}>
//       {Icon && <Icon className={`w-5 h-5 ${color}`} />}
//     </div>
//     <h3 className={`font-bold text-gray-800 dark:text-white text-lg`}>
//       {title}
//     </h3>
//   </div>
// );

// // --- Helper: Status Badge ---
// const StatusBadge = ({ value }) => {
//   let style = "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
//   if (["Conform", "Yes", "New Order"].includes(value)) {
//     style =
//       "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400";
//   } else if (["Non-Conform", "No"].includes(value)) {
//     style =
//       "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400";
//   } else if (value === "N/A") {
//     style =
//       "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400";
//   }

//   return (
//     <span
//       className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${style}`}
//     >
//       {value}
//     </span>
//   );
// };

// // --- MAIN COMPONENT ---
// const YPivotQAInspectionSummary = ({ orderData, reportData, qrData }) => {
//   const { selectedOrders, orderData: details } = orderData;
//   const { selectedTemplate, config, lineTableConfig, headerData, photoData } =
//     reportData;

//   const [definitions, setDefinitions] = useState({ headers: [], photos: [] });
//   const [loading, setLoading] = useState(true);
//   const [previewImage, setPreviewImage] = useState(null);
//   const [expandedSections, setExpandedSections] = useState({
//     order: true,
//     config: true,
//     header: true,
//     photos: true
//   });

//   useEffect(() => {
//     const fetchDefinitions = async () => {
//       try {
//         const [headersRes, photosRes] = await Promise.all([
//           axios.get(`${API_BASE_URL}/api/qa-sections-home`),
//           axios.get(`${API_BASE_URL}/api/qa-sections-photos`)
//         ]);
//         setDefinitions({
//           headers: headersRes.data.data,
//           photos: photosRes.data.data
//         });
//       } catch (error) {
//         console.error("Failed to load section definitions", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchDefinitions();
//   }, []);

//   const dtOrder = details?.dtOrder || {};
//   const yorksys = details?.yorksysOrder || {};
//   const skuData = yorksys.skuData || [];

//   const colorSizeBreakdown = useMemo(() => {
//     if (!details?.orderBreakdowns) return null;
//     return (
//       details.colorSizeBreakdown ||
//       details.orderBreakdowns[0]?.colorSizeBreakdown
//     );
//   }, [details]);

//   const scopeColumns = useMemo(() => {
//     if (!selectedTemplate) return [];
//     const cols = [];
//     if (selectedTemplate.Line === "Yes") cols.push("Line");
//     if (selectedTemplate.Table === "Yes") cols.push("Table");
//     if (selectedTemplate.Colors === "Yes") cols.push("Color");
//     return cols;
//   }, [selectedTemplate]);

//   const toggleSection = (key) => {
//     setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
//   };

//   const relevantPhotoSections = useMemo(() => {
//     if (
//       !selectedTemplate?.SelectedPhotoSectionList ||
//       definitions.photos.length === 0
//     )
//       return [];
//     const allowedIds = selectedTemplate.SelectedPhotoSectionList.map(
//       (i) => i.PhotoSectionID
//     );
//     return definitions.photos.filter((p) => allowedIds.includes(p._id));
//   }, [selectedTemplate, definitions.photos]);

//   if (!selectedOrders.length) {
//     return (
//       <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 h-96">
//         <Package className="w-16 h-16 mb-4 opacity-30" />
//         <p className="text-lg font-medium">No Order Selected</p>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-96">
//         <Loader className="w-8 h-8 animate-spin text-indigo-500" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8 pb-24 animate-fadeIn">
//       {/* 1. QR CODE SECTION */}
//       <YPivotQAInspectionQRCode
//         reportId={qrData?.reportId}
//         inspectionDate={qrData?.inspectionDate}
//         orderNos={qrData?.orderNos}
//         reportType={qrData?.reportType}
//         inspectionType={qrData?.inspectionType}
//         empId={qrData?.empId}
//       />

//       {/* 2. ORDER SUMMARY HEADER */}
//       <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
//         <div
//           className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center cursor-pointer"
//           onClick={() => toggleSection("order")}
//         >
//           <div>
//             <h2 className="text-white font-bold text-xl flex items-center gap-2">
//               <FileText className="w-6 h-6" /> {dtOrder.customer || "Customer"}
//             </h2>
//             <p className="text-blue-100 text-sm mt-1 font-medium">
//               Style: {dtOrder.custStyle}
//             </p>
//           </div>
//           <div className="flex items-center gap-4">
//             <div className="text-right hidden sm:block">
//               <span className="text-xs text-blue-200 font-bold uppercase block">
//                 Selected Orders
//               </span>
//               <span className="text-white font-mono font-bold text-lg bg-white/20 px-2 py-1 rounded">
//                 {selectedOrders.length}
//               </span>
//             </div>
//             {expandedSections.order ? (
//               <ChevronUp className="text-white" />
//             ) : (
//               <ChevronDown className="text-white" />
//             )}
//           </div>
//         </div>

//         {expandedSections.order && (
//           <div className="p-6">
//             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
//               <InfoRow
//                 label="Order No(s)"
//                 value={selectedOrders.join(", ")}
//                 icon={Package}
//                 className="col-span-2"
//               />
//               <InfoRow
//                 label="Total Qty"
//                 value={dtOrder.totalQty?.toLocaleString()}
//                 icon={Hash}
//               />
//               <InfoRow
//                 label="Factory"
//                 value={dtOrder.factory}
//                 icon={Building2}
//               />
//               <InfoRow label="Origin" value={dtOrder.origin} icon={Globe} />
//               <InfoRow label="Mode" value={dtOrder.mode} icon={Truck} />
//               <InfoRow
//                 label="Sales Team"
//                 value={dtOrder.salesTeamName}
//                 icon={Users}
//               />
//               <InfoRow label="Country" value={dtOrder.country} icon={MapPin} />
//               <InfoRow label="Season" value={yorksys.season} icon={Calendar} />
//               <InfoRow
//                 label="Destination"
//                 value={yorksys.destination}
//                 icon={MapPin}
//               />
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-700 pt-6">
//               <div className="md:col-span-3 lg:col-span-1">
//                 <InfoRow
//                   label="Product Type"
//                   value={yorksys.productType}
//                   icon={Layers}
//                   className="h-full"
//                 />
//               </div>
//               <div className="md:col-span-3 lg:col-span-2 grid grid-cols-2 gap-4">
//                 <InfoRow
//                   label="SKU Desc."
//                   value={yorksys.skuDescription}
//                   icon={Tag}
//                   className="col-span-2"
//                 />
//                 <InfoRow
//                   label="Fabric Content"
//                   value={yorksys.fabricContent
//                     ?.map((f) => `${f.fabricName} ${f.percentageValue}%`)
//                     .join(", ")}
//                   icon={Shirt}
//                   className="col-span-2"
//                 />
//               </div>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
//               {colorSizeBreakdown && (
//                 <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
//                   <div className="bg-purple-600 px-3 py-1.5 text-white text-xs font-bold flex items-center gap-2">
//                     <Package className="w-3 h-3" /> Order Qty Breakdown
//                   </div>
//                   <div className="overflow-x-auto">
//                     <table className="w-full text-[10px] text-left">
//                       <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
//                         <tr>
//                           <th className="px-2 py-1">Color</th>
//                           <th className="px-2 py-1 text-right">Total</th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
//                         {colorSizeBreakdown.colors.map((row, i) => (
//                           <tr key={i}>
//                             <td className="px-2 py-1">{row.color}</td>
//                             <td className="px-2 py-1 text-right font-bold">
//                               {row.total.toLocaleString()}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               )}
//               {skuData.length > 0 && (
//                 <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
//                   <div className="bg-emerald-600 px-3 py-1.5 text-white text-xs font-bold flex items-center gap-2">
//                     <Hash className="w-3 h-3" /> SKU Data
//                   </div>
//                   <div className="overflow-x-auto max-h-[150px]">
//                     <table className="w-full text-[10px] text-left">
//                       <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
//                         <tr>
//                           <th className="px-2 py-1">SKU</th>
//                           <th className="px-2 py-1">PO Line</th>
//                           <th className="px-2 py-1 text-right">Qty</th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
//                         {skuData.map((row, i) => (
//                           <tr key={i}>
//                             <td className="px-2 py-1 font-mono">{row.sku}</td>
//                             <td className="px-2 py-1">{row.POLine}</td>
//                             <td className="px-2 py-1 text-right font-bold text-emerald-600">
//                               {row.Qty.toLocaleString()}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* 3. REPORT CONFIGURATION */}
//       {selectedTemplate && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5">
//             <SectionHeader title="Inspection Setup" icon={Settings} />
//             <div className="space-y-4">
//               <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200 dark:border-gray-700">
//                 <span className="text-sm text-gray-500">Report Type</span>
//                 <span className="text-sm font-bold text-indigo-600">
//                   {selectedTemplate.ReportType}
//                 </span>
//               </div>
//               <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200 dark:border-gray-700">
//                 <span className="text-sm text-gray-500">Sampling Method</span>
//                 <span
//                   className={`text-xs px-2 py-0.5 rounded font-bold ${
//                     selectedTemplate.InspectedQtyMethod === "AQL"
//                       ? "bg-orange-100 text-orange-700"
//                       : "bg-purple-100 text-purple-700"
//                   }`}
//                 >
//                   {selectedTemplate.InspectedQtyMethod}
//                 </span>
//               </div>
//               <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200 dark:border-gray-700">
//                 <span className="text-sm text-gray-500">
//                   Inspected Qty (Lot)
//                 </span>
//                 <span className="text-sm font-bold text-blue-600">
//                   {config?.inspectedQty || 0}
//                 </span>
//               </div>
//               {selectedTemplate.InspectedQtyMethod === "AQL" && (
//                 <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200 dark:border-gray-700">
//                   <span className="text-sm text-gray-500">AQL Sample Size</span>
//                   <span className="text-sm font-bold text-orange-600">
//                     {config?.aqlSampleSize}
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
//             <div className="p-5 border-b border-gray-100 dark:border-gray-700">
//               <SectionHeader
//                 title="Inspection Scope & Assignments"
//                 icon={Layers}
//                 color="text-teal-600"
//               />
//             </div>
//             <div className="flex-1 overflow-x-auto p-0">
//               {lineTableConfig.length > 0 ? (
//                 <table className="w-full text-sm text-left">
//                   <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium">
//                     <tr>
//                       {scopeColumns.map((col) => (
//                         <th key={col} className="px-4 py-2">
//                           {col}
//                         </th>
//                       ))}
//                       {selectedTemplate.isQCScan === "Yes" && (
//                         <th className="px-4 py-2">Inspector</th>
//                       )}
//                       <th className="px-4 py-2 text-right">Qty</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
//                     {lineTableConfig.map((group) =>
//                       group.assignments.map((assign, idx) => (
//                         <tr
//                           key={`${group.id}-${assign.id}`}
//                           className="hover:bg-gray-50 dark:hover:bg-gray-700/20"
//                         >
//                           {scopeColumns.includes("Line") && (
//                             <td className="px-4 py-2 font-bold">
//                               {idx === 0 ? group.lineName || group.line : ""}
//                             </td>
//                           )}
//                           {scopeColumns.includes("Table") && (
//                             <td className="px-4 py-2">
//                               {idx === 0 ? group.tableName || group.table : ""}
//                             </td>
//                           )}
//                           {scopeColumns.includes("Color") && (
//                             <td className="px-4 py-2 text-indigo-600">
//                               {idx === 0 ? group.colorName || group.color : ""}
//                             </td>
//                           )}
//                           {selectedTemplate.isQCScan === "Yes" && (
//                             <td className="px-4 py-2">
//                               {assign.qcUser ? (
//                                 <div className="flex items-center gap-2">
//                                   <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
//                                     {assign.qcUser.eng_name.charAt(0)}
//                                   </div>
//                                   <span>{assign.qcUser.eng_name}</span>
//                                 </div>
//                               ) : (
//                                 <span className="text-gray-400 italic">
//                                   Unassigned
//                                 </span>
//                               )}
//                             </td>
//                           )}
//                           <td className="px-4 py-2 text-right font-mono">
//                             {assign.qty || 0}
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               ) : (
//                 <div className="p-8 text-center text-gray-400">
//                   <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
//                   <p>No scope configured yet.</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* 4. HEADER INSPECTION DATA */}
//       {definitions.headers.length > 0 && (
//         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
//           <div
//             className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex justify-between items-center cursor-pointer"
//             onClick={() => toggleSection("header")}
//           >
//             <h2 className="text-white font-bold text-lg flex items-center gap-2">
//               <ClipboardCheck className="w-5 h-5" /> Header Inspection Check
//             </h2>
//             {expandedSections.header ? (
//               <ChevronUp className="text-white" />
//             ) : (
//               <ChevronDown className="text-white" />
//             )}
//           </div>

//           {expandedSections.header && (
//             <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
//               {definitions.headers.map((section) => {
//                 const selectedVal = headerData?.selectedOptions?.[section._id];
//                 const remark = headerData?.remarks?.[section._id];

//                 const images = Object.keys(headerData?.capturedImages || {})
//                   .filter((k) => k.startsWith(`${section._id}_`))
//                   .map((k) => ({ ...headerData.capturedImages[k], key: k }))
//                   .sort(
//                     (a, b) =>
//                       parseInt(a.key.split("_")[1]) -
//                       parseInt(b.key.split("_")[1])
//                   );

//                 return (
//                   <div
//                     key={section._id}
//                     className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3"
//                   >
//                     <div className="flex justify-between items-start gap-2">
//                       <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm flex-1">
//                         {section.MainTitle}
//                       </h4>
//                       {selectedVal ? (
//                         <StatusBadge value={selectedVal} />
//                       ) : (
//                         <span className="text-xs text-gray-400 italic">
//                           Not Checked
//                         </span>
//                       )}
//                     </div>

//                     {remark && (
//                       <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-800/50 flex gap-2">
//                         <MessageSquare className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
//                         <p className="text-xs text-amber-800 dark:text-amber-200 italic">
//                           "{remark}"
//                         </p>
//                       </div>
//                     )}

//                     {images.length > 0 && (
//                       <div className="flex gap-2 mt-auto pt-2 overflow-x-auto scrollbar-thin">
//                         {images.map((img) => (
//                           <div
//                             key={img.key}
//                             className="relative group flex-shrink-0 cursor-pointer"
//                             onClick={() =>
//                               setPreviewImage({
//                                 src: img.url,
//                                 alt: `${section.MainTitle} Photo`
//                               })
//                             }
//                           >
//                             <img
//                               src={img.url}
//                               className="w-10 h-10 object-cover rounded-md border border-gray-300 shadow-sm"
//                               alt="Evidence"
//                             />
//                             <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors rounded-md" />
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       )}

//       {/* 5. PHOTO DOCUMENTATION */}
//       {relevantPhotoSections.length > 0 &&
//         selectedTemplate?.Photos !== "No" && (
//           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
//             <div
//               className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 flex justify-between items-center cursor-pointer"
//               onClick={() => toggleSection("photos")}
//             >
//               <h2 className="text-white font-bold text-lg flex items-center gap-2">
//                 <Camera className="w-5 h-5" /> Photo Documentation
//               </h2>
//               {expandedSections.photos ? (
//                 <ChevronUp className="text-white" />
//               ) : (
//                 <ChevronDown className="text-white" />
//               )}
//             </div>

//             {expandedSections.photos && (
//               <div className="p-6 space-y-6">
//                 {relevantPhotoSections.map((section) => (
//                   <div
//                     key={section._id}
//                     className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-6 last:pb-0"
//                   >
//                     <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
//                       <Layers className="w-4 h-4 text-orange-500" />{" "}
//                       {section.sectionName}
//                     </h3>

//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                       {section.itemList.map((item) => {
//                         const images = [];
//                         let idx = 0;
//                         while (idx < 20) {
//                           const key = `${section._id}_${item.no}_${idx}`;
//                           if (photoData?.capturedImages?.[key]) {
//                             images.push({
//                               ...photoData.capturedImages[key],
//                               key
//                             });
//                           } else if (images.length > 0 && idx > item.maxCount) {
//                             break;
//                           }
//                           idx++;
//                         }

//                         const remarkKey = `${section._id}_${item.no}`;
//                         const remark = photoData?.remarks?.[remarkKey];

//                         if (images.length === 0 && !remark) return null;

//                         return (
//                           <div
//                             key={item.no}
//                             className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
//                           >
//                             <div className="flex justify-between items-start mb-2">
//                               <span
//                                 className="text-xs font-bold text-gray-700 dark:text-gray-200 line-clamp-2"
//                                 title={item.itemName}
//                               >
//                                 <span className="inline-block bg-orange-100 text-orange-700 px-1.5 rounded mr-1.5">
//                                   #{item.no}
//                                 </span>
//                                 {item.itemName}
//                               </span>
//                             </div>

//                             <div className="grid grid-cols-3 gap-2 mt-2">
//                               {images.map((img) => (
//                                 <div
//                                   key={img.key}
//                                   className="aspect-square rounded-md overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-600 relative group"
//                                   onClick={() =>
//                                     setPreviewImage({
//                                       src: img.url,
//                                       alt: item.itemName
//                                     })
//                                   }
//                                 >
//                                   <img
//                                     src={img.url}
//                                     className="w-full h-full object-cover transition-transform group-hover:scale-110"
//                                     alt="Doc"
//                                   />
//                                 </div>
//                               ))}
//                             </div>

//                             {remark && (
//                               <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400 italic">
//                                 <MessageSquare className="w-3 h-3 inline mr-1" />
//                                 {remark}
//                               </div>
//                             )}
//                           </div>
//                         );
//                       })}
//                     </div>
//                     {(!photoData?.capturedImages ||
//                       Object.keys(photoData.capturedImages).filter((k) =>
//                         k.startsWith(`${section._id}_`)
//                       ).length === 0) && (
//                       <p className="text-xs text-gray-400 italic pl-6">
//                         No photos captured for this section.
//                       </p>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//       {/* Preview Modal */}
//       {previewImage && (
//         <ImagePreviewModal
//           src={previewImage.src}
//           alt={previewImage.alt}
//           onClose={() => setPreviewImage(null)}
//         />
//       )}

//       <style jsx>{`
//         .animate-fadeIn {
//           animation: fadeIn 0.3s ease-out;
//         }
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//           }
//           to {
//             opacity: 1;
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default YPivotQAInspectionSummary;

import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import {
  FileText,
  Package,
  Layers,
  Hash,
  Users,
  MapPin,
  Calendar,
  Settings,
  Tag,
  Shirt,
  Globe,
  Truck,
  Camera,
  MessageSquare,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader,
  Building2,
  ClipboardCheck,
  AlertCircle,
  Shield,
  Trophy,
  Ruler,
  Bug,
  Award,
  User,
  Save, // Ensure Save icon is imported
  CheckCircle2
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";
import YPivotQAInspectionQRCode from "./YPivotQAInspectionQRCode";
import { determineBuyerFromOrderNo } from "./YPivotQAInspectionBuyerDetermination";

// Import from Measurement Summary
import {
  groupMeasurementsByGroupId,
  calculateGroupStats,
  calculateOverallMeasurementResult,
  MeasurementStatsCards,
  MeasurementLegend,
  MeasurementSummaryTable,
  OverallMeasurementSummaryTable
} from "./YPivotQAInspectionMeasurementSummary";

// Import from Defect Summary
import {
  useDefectSummaryData,
  useAqlData,
  calculateAqlResult,
  AQLConfigCards,
  AQLResultTable,
  FinalDefectResultBanner,
  DefectSummaryTable
} from "./YPivotQAInspectionDefectSummary";

// --- Helper: Modal for Image Preview ---
const ImagePreviewModal = ({ src, alt, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
        >
          <XCircle className="w-8 h-8" />
        </button>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain rounded-lg shadow-2xl"
        />
        <p className="text-center text-white/80 mt-2 font-mono text-sm">
          {alt}
        </p>
      </div>
    </div>
  );
};

// --- Helper: Info Row ---
const InfoRow = ({ label, value, icon: Icon, className = "" }) => (
  <div
    className={`flex items-start gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 ${className}`}
  >
    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-md shadow-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
      {Icon ? (
        <Icon className="w-3.5 h-3.5" />
      ) : (
        <Hash className="w-3.5 h-3.5" />
      )}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p
        className="text-xs font-bold text-gray-800 dark:text-white mt-0.5 truncate"
        title={value}
      >
        {value || "-"}
      </p>
    </div>
  </div>
);

// --- Helper: Section Header ---
const SectionHeader = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
    <div className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700">
      {Icon && <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
    </div>
    <h3 className="font-bold text-gray-800 dark:text-white text-sm">{title}</h3>
  </div>
);

// --- Helper: Status Badge ---
const StatusBadge = ({ value }) => {
  let style = "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  if (["Conform", "Yes", "New Order"].includes(value)) {
    style = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (["Non-Conform", "No"].includes(value)) {
    style = "bg-red-100 text-red-700 border-red-200";
  } else if (value === "N/A") {
    style = "bg-orange-100 text-orange-700 border-orange-200";
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style}`}
    >
      {value}
    </span>
  );
};

// --- Helper: Compact Result Card ---
const ResultCard = ({ title, result, icon: Icon, colorClass }) => {
  const isPass = result === "PASS";
  return (
    <div
      className={`flex items-center gap-2 p-2.5 rounded-lg border ${
        isPass
          ? `bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800`
          : `bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800`
      }`}
    >
      <div
        className={`p-1.5 rounded-full ${
          isPass ? "bg-green-100" : "bg-red-100"
        }`}
      >
        <Icon
          className={`w-4 h-4 ${isPass ? "text-green-600" : "text-red-600"}`}
        />
      </div>
      <div>
        <p className="text-[8px] font-bold text-gray-500 uppercase">{title}</p>
        <p
          className={`text-sm font-black ${
            isPass ? "text-green-600" : "text-red-600"
          }`}
        >
          {result}
        </p>
      </div>
    </div>
  );
};

// --- NEW HELPER: Resolve Photo URL ---
const getInspectorPhotoUrl = (facePhoto) => {
  if (!facePhoto) return null;
  if (facePhoto.startsWith("http://") || facePhoto.startsWith("https://")) {
    return facePhoto;
  }
  const cleanPath = facePhoto.startsWith("/")
    ? facePhoto.substring(1)
    : facePhoto;
  const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
    ? PUBLIC_ASSET_URL
    : `${PUBLIC_ASSET_URL}/`;
  return `${baseUrl}${cleanPath}`;
};

// --- MAIN COMPONENT ---
const YPivotQAInspectionSummary = ({
  orderData,
  reportData,
  qrData,
  defectData = null,
  activeGroup = null
}) => {
  const { selectedOrders, orderData: details } = orderData;
  const { selectedTemplate, config, lineTableConfig, headerData, photoData } =
    reportData;

  const [inspectorInfo, setInspectorInfo] = useState(null);

  const savedDefects = useMemo(() => {
    if (defectData?.savedDefects) return defectData.savedDefects;
    if (reportData?.defectData?.savedDefects)
      return reportData.defectData.savedDefects;
    return [];
  }, [defectData, reportData]);

  const savedMeasurements = useMemo(() => {
    return reportData?.measurementData?.savedMeasurements || [];
  }, [reportData]);

  const measurementSpecsData = useMemo(() => {
    return reportData?.measurementData?.fullSpecsList || [];
  }, [reportData]);

  const measurementSelectedSpecs = useMemo(() => {
    return reportData?.measurementData?.selectedSpecsList || [];
  }, [reportData]);

  const groupedMeasurements = useMemo(() => {
    return groupMeasurementsByGroupId(savedMeasurements);
  }, [savedMeasurements]);

  const measurementResult = useMemo(() => {
    return calculateOverallMeasurementResult(savedMeasurements);
  }, [savedMeasurements]);

  const [definitions, setDefinitions] = useState({ headers: [], photos: [] });
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    aql: true,
    defectSummary: true,
    order: true,
    config: true,
    header: true,
    photos: true,
    measurement: true
  });

  // Derived values
  const isAQLMethod = useMemo(
    () => selectedTemplate?.InspectedQtyMethod === "AQL",
    [selectedTemplate]
  );
  const determinedBuyer = useMemo(() => {
    if (!selectedOrders || selectedOrders.length === 0) return "Unknown";
    return determineBuyerFromOrderNo(selectedOrders[0]).buyer;
  }, [selectedOrders]);
  const inspectedQty = useMemo(
    () => parseInt(config?.inspectedQty) || 0,
    [config?.inspectedQty]
  );

  // Use exported hooks
  const summaryData = useDefectSummaryData(savedDefects, activeGroup);
  const { aqlSampleData, loadingAql } = useAqlData(
    isAQLMethod,
    determinedBuyer,
    inspectedQty
  );
  const aqlResult = useMemo(
    () => calculateAqlResult(aqlSampleData, summaryData.totals),
    [aqlSampleData, summaryData.totals]
  );

  // Final results
  const defectResult = useMemo(() => {
    if (aqlResult) return aqlResult.final;
    if (summaryData.totals.critical > 0 || summaryData.totals.major > 0)
      return "FAIL";
    return "PASS";
  }, [aqlResult, summaryData.totals]);

  // Final Overall Report Result (Combines Measurement & Defect)
  const finalReportResult = useMemo(() => {
    const measResult = measurementResult.result; // "PASS", "FAIL", or "N/A"
    const defResult = defectResult; // "PASS" or "FAIL"

    // If ANY component fails, the whole report fails
    if (measResult === "FAIL" || defResult === "FAIL") {
      return "FAIL";
    }

    // If Measurement is N/A (not taken) and Defect is PASS, result is PASS.
    // Otherwise, require both to be PASS.
    return "PASS";
  }, [measurementResult.result, defectResult]);

  // --- NEW: Submit Handler ---
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const empId = reportData?.empId || qrData?.empId;
    if (empId) {
      const fetchInspector = async () => {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/user-details?empId=${empId}`
          );
          if (res.data) {
            setInspectorInfo(res.data);
          }
        } catch (err) {
          console.error("Failed to fetch inspector details", err);
          // Fallback to basic info present in report data
          setInspectorInfo({
            emp_id: empId,
            eng_name: reportData?.empName || qrData?.empName,
            face_photo: null
          });
        }
      };
      fetchInspector();
    }
  }, [reportData?.empId, qrData?.empId]);

  useEffect(() => {
    const fetchDefinitions = async () => {
      try {
        const [headersRes, photosRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/qa-sections-home`),
          axios.get(`${API_BASE_URL}/api/qa-sections-photos`)
        ]);
        setDefinitions({
          headers: headersRes.data.data,
          photos: photosRes.data.data
        });
      } catch (error) {
        console.error("Failed to load section definitions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDefinitions();
  }, []);

  const dtOrder = details?.dtOrder || {};
  const yorksys = details?.yorksysOrder || {};
  const skuData = yorksys.skuData || [];

  const colorSizeBreakdown = useMemo(() => {
    if (!details?.orderBreakdowns) return null;
    return (
      details.colorSizeBreakdown ||
      details.orderBreakdowns[0]?.colorSizeBreakdown
    );
  }, [details]);

  const scopeColumns = useMemo(() => {
    if (!selectedTemplate) return [];
    const cols = [];
    if (selectedTemplate.Line === "Yes") cols.push("Line");
    if (selectedTemplate.Table === "Yes") cols.push("Table");
    if (selectedTemplate.Colors === "Yes") cols.push("Color");
    return cols;
  }, [selectedTemplate]);

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const relevantPhotoSections = useMemo(() => {
    if (
      !selectedTemplate?.SelectedPhotoSectionList ||
      definitions.photos.length === 0
    )
      return [];
    const allowedIds = selectedTemplate.SelectedPhotoSectionList.map(
      (i) => i.PhotoSectionID
    );
    return definitions.photos.filter((p) => allowedIds.includes(p._id));
  }, [selectedTemplate, definitions.photos]);

  const handleFullSubmit = async () => {
    if (!qrData?.reportId) {
      alert("Report ID is missing. Cannot submit.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to submit the final report? This will save all data from all sections."
      )
    ) {
      return;
    }

    setSubmitting(true);

    try {
      // 1. Prepare Inspection Details (Order/Config)
      // Merge initial order data with current config state
      const inspectionDetails = {
        buyer: determinedBuyer,
        productType:
          reportData.config?.productType ||
          orderData?.yorksysOrder?.productType,
        productTypeId: reportData.config?.productTypeId,
        reportTypeName: selectedTemplate?.ReportType,
        reportTypeId: selectedTemplate?._id,
        measurement: selectedTemplate?.Measurement,
        method: selectedTemplate?.InspectedQtyMethod,

        inspectedQty: reportData.config?.inspectedQty,
        cartonQty: reportData.config?.cartonQty,
        shippingStage: reportData.config?.shippingStage,
        remarks: reportData.config?.remarks,
        isSubCon: reportData.config?.isSubCon,
        subConFactory: reportData.config?.selectedSubConFactoryName,
        subConFactoryId: reportData.config?.selectedSubConFactory,

        aqlSampleSize: reportData.config?.aqlSampleSize,
        totalOrderQty: details?.dtOrder?.totalQty,

        // Pass AQL Config if method is AQL
        aqlConfig: reportData.config?.aqlConfig
      };

      // 2. Construct Payload
      const payload = {
        reportId: qrData.reportId,
        inspectionDetails: inspectionDetails,
        headerData: reportData.headerData?.headerData || [], // Access stored array
        photoData: reportData.photoData?.photoData || [], // Access stored array
        measurementData: savedMeasurements,
        defectData: savedDefects,
        defectManualData: Object.values(
          reportData?.defectData?.manualDataByGroup || {}
        ).map((item) => ({ ...item, groupId: item.groupId || 0 })),
        ppSheetData: reportData?.ppSheetData || null // If you have PP Sheet state
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/submit-full-report`,
        payload
      );

      if (res.data.success) {
        alert("Report Submitted Successfully!");
        // Optional: Redirect or refresh
      } else {
        alert("Submission failed: " + res.data.message);
      }
    } catch (err) {
      console.error("Submit Error:", err);
      alert("An error occurred while submitting the report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedOrders.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 h-96">
        <Package className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No Order Selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-24 animate-fadeIn">
      {/* --- NEW: TOP HEADER WITH SUBMIT BUTTON --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">
            Inspection Summary
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Review results below. Click submit to finalize the report.
          </p>
        </div>

        <button
          onClick={handleFullSubmit}
          disabled={submitting}
          className={`px-6 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all transform active:scale-95 ${
            submitting
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          }`}
        >
          {submitting ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Submit Final Report
            </>
          )}
        </button>
      </div>

      {/* 1. QR CODE AND USER INFO */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* LEFT: INSPECTOR CARD */}
        <div className="md:col-span-4 lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-full relative overflow-hidden flex flex-col">
            {/* Gradient Header */}
            <div className="h-20 bg-gradient-to-br from-indigo-600 to-purple-700 relative">
              <div className="absolute inset-0 bg-white/10 opacity-30"></div>
            </div>

            {/* Profile Image (Centered) */}
            <div className="flex justify-center -mt-10 relative px-4">
              <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                {inspectorInfo?.face_photo ? (
                  <img
                    src={getInspectorPhotoUrl(inspectorInfo.face_photo)}
                    alt="Inspector"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.querySelector(
                        ".fallback-icon"
                      ).style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`fallback-icon w-full h-full items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-700 ${
                    inspectorInfo?.face_photo ? "hidden" : "flex"
                  }`}
                >
                  <User className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="p-4 pt-2 text-center flex-1 flex flex-col">
              <h3 className="text-base font-bold text-gray-800 dark:text-white leading-tight">
                {inspectorInfo?.eng_name || inspectorInfo?.name || "Unknown"}
              </h3>

              <div className="mt-2 flex justify-center">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-100 dark:border-indigo-800">
                  <span className="text-[10px] font-bold uppercase">ID</span>
                  <span className="text-xs font-mono font-bold">
                    {inspectorInfo?.emp_id || "--"}
                  </span>
                </div>
              </div>

              <div className="mt-4 w-full pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 text-left">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-medium">
                    Title
                  </p>
                  <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">
                    {inspectorInfo?.job_title || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-medium">
                    Dept
                  </p>
                  <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">
                    {inspectorInfo?.dept_name || "N/A"} (
                    {inspectorInfo?.sect_name || "N/A"})
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: QR CODE (Original Component) */}
        <div className="md:col-span-8 lg:col-span-9 h-full">
          <YPivotQAInspectionQRCode
            reportId={qrData?.reportId}
            inspectionDate={qrData?.inspectionDate}
            orderNos={qrData?.orderNos}
            reportType={qrData?.reportType}
            inspectionType={qrData?.inspectionType}
            empId={qrData?.empId}
          />
        </div>
      </div>
      {/* <YPivotQAInspectionQRCode
        reportId={qrData?.reportId}
        inspectionDate={qrData?.inspectionDate}
        orderNos={qrData?.orderNos}
        reportType={qrData?.reportType}
        inspectionType={qrData?.inspectionType}
        empId={qrData?.empId}
      /> */}

      {/* 2. REPORT RESULT CARDS - Compact */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-gray-800 dark:text-white">
            Report Result
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <ResultCard title="Final" result={finalReportResult} icon={Award} />
          <ResultCard
            title="Measurement"
            result={measurementResult.result}
            icon={Ruler}
          />
          <ResultCard title="Defect" result={defectResult} icon={Bug} />
        </div>
      </div>

      {/* 3. AQL DEFECT RESULT (Only if AQL) */}
      {isAQLMethod && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("aql")}
          >
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" /> Report: Defect Result (AQL)
            </h2>
            {expandedSections.aql ? (
              <ChevronUp className="text-white w-4 h-4" />
            ) : (
              <ChevronDown className="text-white w-4 h-4" />
            )}
          </div>

          {expandedSections.aql && (
            <div className="p-3 space-y-3">
              {loadingAql ? (
                <div className="flex items-center justify-center py-6">
                  <Loader className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : aqlResult ? (
                <>
                  <AQLConfigCards
                    aqlSampleData={aqlSampleData}
                    aqlResult={aqlResult}
                    inspectedQty={inspectedQty}
                  />
                  <AQLResultTable
                    defectsList={summaryData.defectsList}
                    totals={summaryData.totals}
                    aqlResult={aqlResult}
                  />
                  <FinalDefectResultBanner result={aqlResult.final} compact />
                </>
              ) : (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-center">
                  <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-amber-700">
                    AQL Configuration Not Available
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. DEFECT SUMMARY BY CONFIG */}
      {summaryData.groups.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("defectSummary")}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-white" />
              <h2 className="text-white font-bold text-sm">
                Defect Summary by Configuration
              </h2>
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-white text-[10px] font-bold">
                {summaryData.totals.total} total
              </span>
            </div>
            {expandedSections.defectSummary ? (
              <ChevronUp className="text-white w-4 h-4" />
            ) : (
              <ChevronDown className="text-white w-4 h-4" />
            )}
          </div>
          {expandedSections.defectSummary && (
            <DefectSummaryTable
              groups={summaryData.groups}
              totals={summaryData.totals}
            />
          )}
        </div>
      )}

      {/* 5. OVERALL MEASUREMENT SUMMARY */}
      {savedMeasurements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("measurement")}
          >
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <Ruler className="w-4 h-4" /> Overall Measurement Summary
            </h2>
            {expandedSections.measurement ? (
              <ChevronUp className="text-white w-4 h-4" />
            ) : (
              <ChevronDown className="text-white w-4 h-4" />
            )}
          </div>

          {expandedSections.measurement && (
            <div className="p-3 space-y-4">
              {/* Overall Summary Table */}
              <OverallMeasurementSummaryTable
                groupedMeasurements={groupedMeasurements}
              />

              {/* Per-Config Detailed Summary */}
              {groupedMeasurements.groups.map((group) => {
                const configLabel =
                  [
                    group.lineName ? `Line ${group.lineName}` : null,
                    group.tableName ? `Table ${group.tableName}` : null,
                    group.colorName || null
                  ]
                    .filter(Boolean)
                    .join(" / ") || "General";

                const stats = calculateGroupStats(
                  group.measurements,
                  measurementSpecsData,
                  measurementSelectedSpecs
                );

                return (
                  <div
                    key={group.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {configLabel}
                      </span>
                    </div>
                    <div className="p-3 space-y-2">
                      <MeasurementStatsCards stats={stats} compact />
                      <MeasurementLegend compact />
                      <MeasurementSummaryTable
                        measurements={group.measurements}
                        specsData={measurementSpecsData}
                        selectedSpecsList={measurementSelectedSpecs}
                        compact
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. ORDER INFORMATION */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection("order")}
        >
          <div>
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <FileText className="w-5 h-5" /> Order Information
            </h2>
            <p className="text-blue-100 text-xs mt-0.5">
              {dtOrder.customer} • Style: {dtOrder.custStyle}
            </p>
          </div>
          {expandedSections.order ? (
            <ChevronUp className="text-white" />
          ) : (
            <ChevronDown className="text-white" />
          )}
        </div>

        {expandedSections.order && (
          <div className="p-4 space-y-4">
            {/* Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <InfoRow
                label="Order No(s)"
                value={selectedOrders.join(", ")}
                icon={Package}
              />
              <InfoRow
                label="Total Qty"
                value={dtOrder.totalQty?.toLocaleString()}
                icon={Hash}
              />
              <InfoRow
                label="Factory"
                value={dtOrder.factory}
                icon={Building2}
              />
              <InfoRow label="Origin" value={dtOrder.origin} icon={Globe} />
              <InfoRow label="Mode" value={dtOrder.mode} icon={Truck} />
              <InfoRow
                label="Sales Team"
                value={dtOrder.salesTeamName}
                icon={Users}
              />
              <InfoRow label="Country" value={dtOrder.country} icon={MapPin} />
              <InfoRow label="Season" value={yorksys.season} icon={Calendar} />
              <InfoRow
                label="Destination"
                value={yorksys.destination}
                icon={MapPin}
              />
              <InfoRow
                label="Product Type"
                value={yorksys.productType}
                icon={Layers}
              />
              <InfoRow
                label="SKU Description"
                value={yorksys.skuDescription}
                icon={Tag}
                className="md:col-span-2"
              />
              <InfoRow
                label="Fabric Content"
                value={yorksys.fabricContent
                  ?.map((f) => `${f.fabricName} ${f.percentageValue}%`)
                  .join(", ")}
                icon={Shirt}
                className="md:col-span-2"
              />
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {colorSizeBreakdown && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-purple-600 px-3 py-1.5 text-white text-xs font-bold flex items-center gap-1">
                    <Package className="w-3 h-3" /> Order Qty Breakdown
                  </div>
                  <div className="overflow-x-auto max-h-[200px]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                        <tr>
                          <th className="px-3 py-1.5 font-bold">Color</th>
                          <th className="px-3 py-1.5 text-right font-bold">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {colorSizeBreakdown.colors.map((row, i) => (
                          <tr
                            key={i}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                          >
                            <td className="px-3 py-1.5">{row.color}</td>
                            <td className="px-3 py-1.5 text-right font-bold text-indigo-600">
                              {row.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {skuData.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-emerald-600 px-3 py-1.5 text-white text-xs font-bold flex items-center gap-1">
                    <Hash className="w-3 h-3" /> SKU Data
                  </div>
                  <div className="overflow-x-auto max-h-[200px]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                        <tr>
                          <th className="px-3 py-1.5 font-bold">SKU</th>
                          <th className="px-3 py-1.5 font-bold">PO Line</th>
                          <th className="px-3 py-1.5 text-right font-bold">
                            Qty
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {skuData.map((row, i) => (
                          <tr
                            key={i}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                          >
                            <td className="px-3 py-1.5 font-mono">{row.sku}</td>
                            <td className="px-3 py-1.5">{row.POLine}</td>
                            <td className="px-3 py-1.5 text-right font-bold text-emerald-600">
                              {row.Qty.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6. REPORT CONFIGURATION */}
      {selectedTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <SectionHeader title="Inspection Setup" icon={Settings} />
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                <span className="text-gray-500">Report Type</span>
                <span className="font-bold text-indigo-600">
                  {selectedTemplate.ReportType}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                <span className="text-gray-500">Sampling</span>
                <span
                  className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                    selectedTemplate.InspectedQtyMethod === "AQL"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {selectedTemplate.InspectedQtyMethod}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                <span className="text-gray-500">Inspected Qty</span>
                <span className="font-bold text-blue-600">
                  {config?.inspectedQty || 0}
                </span>
              </div>
              {selectedTemplate.InspectedQtyMethod === "AQL" && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500">AQL Sample</span>
                  <span className="font-bold text-orange-600">
                    {config?.aqlSampleSize}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <SectionHeader title="Inspection Scope" icon={Layers} />
            </div>
            <div className="flex-1 overflow-x-auto">
              {lineTableConfig.length > 0 ? (
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium">
                    <tr>
                      {scopeColumns.map((col) => (
                        <th key={col} className="px-3 py-2">
                          {col}
                        </th>
                      ))}
                      {selectedTemplate.isQCScan === "Yes" && (
                        <th className="px-3 py-2">Inspector</th>
                      )}
                      <th className="px-3 py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {lineTableConfig.map((group) =>
                      group.assignments.map((assign, idx) => (
                        <tr
                          key={`${group.id}-${assign.id}`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/20"
                        >
                          {scopeColumns.includes("Line") && (
                            <td className="px-3 py-1.5 font-bold">
                              {idx === 0 ? group.lineName || group.line : ""}
                            </td>
                          )}
                          {scopeColumns.includes("Table") && (
                            <td className="px-3 py-1.5">
                              {idx === 0 ? group.tableName || group.table : ""}
                            </td>
                          )}
                          {scopeColumns.includes("Color") && (
                            <td className="px-3 py-1.5 text-indigo-600">
                              {idx === 0 ? group.colorName || group.color : ""}
                            </td>
                          )}
                          {selectedTemplate.isQCScan === "Yes" && (
                            <td className="px-3 py-1.5">
                              {assign.qcUser ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[8px] font-bold">
                                    {assign.qcUser.eng_name.charAt(0)}
                                  </div>
                                  <span>{assign.qcUser.eng_name}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">—</span>
                              )}
                            </td>
                          )}
                          <td className="px-3 py-1.5 text-right font-mono">
                            {assign.qty || 0}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-400">
                  <AlertCircle className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">No scope configured</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. HEADER INSPECTION */}
      {definitions.headers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("header")}
          >
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" /> Header Inspection Check
            </h2>
            {expandedSections.header ? (
              <ChevronUp className="text-white w-4 h-4" />
            ) : (
              <ChevronDown className="text-white w-4 h-4" />
            )}
          </div>

          {expandedSections.header && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {definitions.headers.map((section) => {
                const selectedVal = headerData?.selectedOptions?.[section._id];
                const remark = headerData?.remarks?.[section._id];
                const images = Object.keys(headerData?.capturedImages || {})
                  .filter((k) => k.startsWith(`${section._id}_`))
                  .map((k) => ({ ...headerData.capturedImages[k], key: k }));

                return (
                  <div
                    key={section._id}
                    className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs flex-1">
                        {section.MainTitle}
                      </h4>
                      {selectedVal ? (
                        <StatusBadge value={selectedVal} />
                      ) : (
                        <span className="text-[9px] text-gray-400 italic">
                          Not Checked
                        </span>
                      )}
                    </div>
                    {remark && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded border border-amber-100 flex gap-1.5">
                        <MessageSquare className="w-2.5 h-2.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-amber-800 italic">
                          "{remark}"
                        </p>
                      </div>
                    )}
                    {images.length > 0 && (
                      <div className="flex gap-1.5 mt-auto pt-1 overflow-x-auto">
                        {images.map((img) => (
                          <div
                            key={img.key}
                            className="relative flex-shrink-0 cursor-pointer"
                            onClick={() =>
                              setPreviewImage({
                                src: img.url,
                                alt: section.MainTitle
                              })
                            }
                          >
                            <img
                              src={img.url}
                              className="w-8 h-8 object-cover rounded border border-gray-300"
                              alt="Evidence"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 8. PHOTO DOCUMENTATION */}
      {relevantPhotoSections.length > 0 &&
        selectedTemplate?.Photos !== "No" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("photos")}
            >
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <Camera className="w-4 h-4" /> Photo Documentation
              </h2>
              {expandedSections.photos ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.photos && (
              <div className="p-4 space-y-4">
                {relevantPhotoSections.map((section) => (
                  <div
                    key={section._id}
                    className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-4 last:pb-0"
                  >
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-xs flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-orange-500" />{" "}
                      {section.sectionName}
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {section.itemList.map((item) => {
                        const images = [];
                        let idx = 0;
                        while (idx < 20) {
                          const key = `${section._id}_${item.no}_${idx}`;
                          if (photoData?.capturedImages?.[key]) {
                            images.push({
                              ...photoData.capturedImages[key],
                              key
                            });
                          } else if (images.length > 0 && idx > item.maxCount)
                            break;
                          idx++;
                        }
                        const remarkKey = `${section._id}_${item.no}`;
                        const remark = photoData?.remarks?.[remarkKey];

                        if (images.length === 0 && !remark) return null;

                        return (
                          <div
                            key={item.no}
                            className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 border border-gray-200 dark:border-gray-700"
                          >
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 line-clamp-1">
                              <span className="inline-block bg-orange-100 text-orange-700 px-1 rounded mr-1">
                                #{item.no}
                              </span>
                              {item.itemName}
                            </span>
                            <div className="grid grid-cols-3 gap-1 mt-1.5">
                              {images.map((img) => (
                                <div
                                  key={img.key}
                                  className="aspect-square rounded overflow-hidden cursor-pointer border border-gray-200"
                                  onClick={() =>
                                    setPreviewImage({
                                      src: img.url,
                                      alt: item.itemName
                                    })
                                  }
                                >
                                  <img
                                    src={img.url}
                                    className="w-full h-full object-cover"
                                    alt="Doc"
                                  />
                                </div>
                              ))}
                            </div>
                            {remark && (
                              <p className="mt-1 text-[9px] text-gray-500 italic truncate">
                                <MessageSquare className="w-2.5 h-2.5 inline mr-0.5" />
                                {remark}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default YPivotQAInspectionSummary;
