// import {
//   FileText,
//   Camera,
//   ClipboardCheck,
//   User,
//   Shield,
//   Sparkles,
//   Package,
//   Ruler,
//   CheckSquare,
//   Settings,
//   Info,
//   Lock,
//   FileSpreadsheet
// } from "lucide-react";
// import React, { useMemo, useState, useCallback } from "react";
// import { useAuth } from "../components/authentication/AuthContext";
// import YPivotQAInspectionOrderData from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionOrderData";
// import YPivotQATemplatesHeader from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesHeader";
// import YPivotQAInspectionPhotosDetermination from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionPhotosDetermination";
// import YPivotQAInspectionLineTableColorConfig from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionLineTableColorConfig";
// import YPivotQAInspectionMeasurementConfig from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionMeasurementConfig";
// import YPivotQAInspectionDefectConfig from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionDefectConfig";
// import YPivotQAInspectionSummary from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionSummary";
// import YPivotQAInspectionPPSheetDetermination from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionPPSheetDetermination";

// const PlaceholderComponent = ({ title, icon: Icon }) => {
//   return (
//     <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg min-h-[400px] flex flex-col justify-center items-center border border-gray-200 dark:border-gray-700">
//       <div className="mb-4 p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
//         <Icon
//           size={48}
//           strokeWidth={1.5}
//           className="text-indigo-500 dark:text-indigo-400"
//         />
//       </div>
//       <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
//         {title}
//       </h2>
//       <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
//         This section is under development.
//       </p>
//     </div>
//   );
// };

// const YPivotQAInspection = () => {
//   const { user } = useAuth();
//   const [activeTab, setActiveTab] = useState("order");

//   // NEW: Report saved state
//   const [savedReportData, setSavedReportData] = useState(null);
//   const [isReportSaved, setIsReportSaved] = useState(false);

//   // Shared state for order data
//   const [sharedOrderState, setSharedOrderState] = useState({
//     inspectionDate: new Date().toISOString().split("T")[0],
//     orderType: "single",
//     selectedOrders: [],
//     orderData: null,
//     inspectionType: "first"
//   });

//   // Shared state for Report Configuration
//   const [sharedReportState, setSharedReportState] = useState({
//     selectedTemplate: null,
//     headerData: {},
//     photoData: {},
//     config: {},
//     lineTableConfig: [],
//     measurementData: {},
//     defectData: {}
//   });

//   // Add new state for quality plan (after sharedReportState):
//   const [qualityPlanData, setQualityPlanData] = useState({
//     productionStatus: {},
//     packingList: {},
//     accountedPercentage: "0.00"
//   });

//   // State for Active Inspection Context (Activated via Play button)
//   const [activeGroup, setActiveGroup] = useState(null);

//   // NEW: State to persist PP Sheet data across tab switches
//   const [ppSheetData, setPPSheetData] = useState(null);

//   // NEW: Handler to update PP Sheet data
//   const handlePPSheetUpdate = useCallback((newData) => {
//     setPPSheetData(newData);
//   }, []);

//   // NEW: Handler for save complete
//   const handleSaveComplete = useCallback((savedData) => {
//     setSavedReportData(savedData);
//     setIsReportSaved(true);
//   }, []);

//   // NEW: Handle tab change with validation
//   const handleTabChange = useCallback(
//     (tabId) => {
//       // If trying to leave "order" tab and report is not saved
//       if (activeTab === "order" && tabId !== "order" && !isReportSaved) {
//         // Could show a warning or prevent navigation
//         // For now, we just block it
//         return;
//       }
//       setActiveTab(tabId);
//     },
//     [activeTab, isReportSaved]
//   );

//   // Handler for order data changes
//   const handleOrderDataChange = useCallback((newState) => {
//     setSharedOrderState((prev) => ({ ...prev, ...newState }));
//   }, []);

//   // Handler for report data changes
//   const handleReportDataChange = useCallback((newState) => {
//     setSharedReportState((prev) => ({ ...prev, ...newState }));
//   }, []);

//   // Add after other handlers:
//   const handleQualityPlanChange = useCallback((newData) => {
//     setQualityPlanData(newData);
//   }, []);

//   // Handler for header updates
//   const handleHeaderDataUpdate = useCallback((headerUpdates) => {
//     setSharedReportState((prev) => ({
//       ...prev,
//       headerData: {
//         ...prev.headerData,
//         ...headerUpdates
//       }
//     }));
//   }, []);

//   // Handler for photo updates
//   const handlePhotoDataUpdate = useCallback((photoUpdates) => {
//     setSharedReportState((prev) => ({
//       ...prev,
//       photoData: {
//         ...prev.photoData,
//         ...photoUpdates
//       }
//     }));
//   }, []);

//   // Handler specifically for measurement updates
//   const handleMeasurementDataUpdate = useCallback((measurementUpdates) => {
//     setSharedReportState((prev) => ({
//       ...prev,
//       measurementData: {
//         ...prev.measurementData,
//         ...measurementUpdates
//       }
//     }));
//   }, []);

//   // Handler for defect updates
//   const handleDefectDataUpdate = useCallback((defectUpdates) => {
//     setSharedReportState((prev) => ({
//       ...prev,
//       defectData: {
//         ...prev.defectData,
//         ...defectUpdates
//       }
//     }));
//   }, []);

//   // Handler for setting active group (Play button)
//   const handleSetActiveGroup = useCallback((group) => {
//     setActiveGroup(group);
//   }, []);

//   const tabs = useMemo(
//     () => [
//       {
//         id: "order",
//         label: "Order",
//         icon: <Package size={18} />,
//         component: (
//           <YPivotQAInspectionOrderData
//             onOrderDataChange={handleOrderDataChange}
//             externalSelectedOrders={sharedOrderState.selectedOrders}
//             externalOrderData={sharedOrderState.orderData}
//             externalOrderType={sharedOrderState.orderType}
//             externalInspectionDate={sharedOrderState.inspectionDate}
//             externalInspectionType={sharedOrderState.inspectionType}
//             // NEW: Pass report-related props
//             onReportDataChange={handleReportDataChange}
//             savedReportState={sharedReportState}
//             onQualityPlanChange={handleQualityPlanChange} // Add this
//             qualityPlanData={qualityPlanData} // Add this
//             user={user}
//             onSaveComplete={handleSaveComplete}
//             savedReportId={savedReportData?.reportId}
//             isReportSaved={isReportSaved}
//           />
//         ),
//         gradient: "from-blue-500 to-cyan-500",
//         description: "Order & Report configuration",
//         requiresSave: false // Order tab doesn't require prior save
//       },
//       ...(sharedReportState.selectedTemplate?.ReportType === "Pilot Run-Sewing"
//         ? [
//             {
//               id: "pp_sheet",
//               label: "PP Sheet",
//               icon: <FileSpreadsheet size={18} />,
//               component: (
//                 <YPivotQAInspectionPPSheetDetermination
//                   orderData={sharedOrderState.orderData}
//                   selectedOrders={sharedOrderState.selectedOrders}
//                   inspectionDate={sharedOrderState.inspectionDate}
//                   // ADD THESE TWO LINES:
//                   savedState={ppSheetData}
//                   onUpdate={handlePPSheetUpdate}
//                 />
//               ),
//               gradient: "from-indigo-600 to-blue-600",
//               description: "Pre-Production Meeting Sheet",
//               requiresSave: true
//             }
//           ]
//         : []),
//       {
//         id: "header",
//         label: "Header",
//         icon: <FileText size={18} />,
//         component: (
//           <YPivotQATemplatesHeader
//             headerData={sharedReportState.headerData}
//             onUpdateHeaderData={handleHeaderDataUpdate}
//           />
//         ),
//         gradient: "from-purple-500 to-pink-500",
//         description: "Inspection header",
//         requiresSave: true // Requires save before access
//       },
//       {
//         id: "photos",
//         label: "Photos",
//         icon: <Camera size={18} />,
//         component: (
//           <YPivotQAInspectionPhotosDetermination
//             reportData={sharedReportState}
//             onUpdatePhotoData={handlePhotoDataUpdate}
//           />
//         ),
//         gradient: "from-orange-500 to-red-500",
//         description: "Photo documentation",
//         requiresSave: true
//       },
//       {
//         id: "info",
//         label: "Info",
//         icon: <Info size={18} />,
//         component: (
//           <YPivotQAInspectionLineTableColorConfig
//             reportData={sharedReportState}
//             orderData={sharedOrderState}
//             onUpdate={handleReportDataChange}
//             onSetActiveGroup={handleSetActiveGroup}
//             activeGroup={activeGroup}
//           />
//         ),
//         gradient: "from-teal-500 to-cyan-500",
//         description: "Detailed Configuration",
//         requiresSave: true
//       },
//       {
//         id: "measurement",
//         label: "Measurement",
//         icon: <Ruler size={18} />,
//         component: (
//           <YPivotQAInspectionMeasurementConfig
//             selectedOrders={sharedOrderState.selectedOrders}
//             orderData={sharedOrderState.orderData}
//             reportData={sharedReportState}
//             onUpdateMeasurementData={handleMeasurementDataUpdate}
//             activeGroup={activeGroup}
//           />
//         ),
//         gradient: "from-green-500 to-emerald-500",
//         description: "Measurement data",
//         requiresSave: true
//       },
//       {
//         id: "defects",
//         label: "Defects",
//         icon: <ClipboardCheck size={18} />,
//         component: (
//           <YPivotQAInspectionDefectConfig
//             selectedOrders={sharedOrderState.selectedOrders}
//             orderData={sharedOrderState.orderData}
//             reportData={sharedReportState}
//             activeGroup={activeGroup}
//             onUpdateDefectData={handleDefectDataUpdate}
//           />
//         ),
//         gradient: "from-red-500 to-rose-500",
//         description: "Defect recording",
//         requiresSave: true
//       },
//       {
//         id: "summary",
//         label: "Summary",
//         icon: <CheckSquare size={18} />,
//         component: (
//           <YPivotQAInspectionSummary
//             orderData={sharedOrderState}
//             reportData={sharedReportState}
//           />
//         ),
//         gradient: "from-indigo-500 to-violet-500",
//         description: "Inspection summary",
//         requiresSave: true
//       }
//     ],
//     [
//       handleOrderDataChange,
//       sharedOrderState,
//       handleReportDataChange,
//       sharedReportState,
//       handleHeaderDataUpdate,
//       handlePhotoDataUpdate,
//       handleMeasurementDataUpdate,
//       handleDefectDataUpdate,
//       handleSetActiveGroup,
//       activeGroup,
//       handleQualityPlanChange, // Add this
//       qualityPlanData, // Add this
//       user,
//       handleSaveComplete,
//       savedReportData,
//       isReportSaved,
//       ppSheetData,
//       handlePPSheetUpdate
//     ]
//   );

//   const activeComponent = useMemo(() => {
//     return tabs.find((tab) => tab.id === activeTab)?.component || null;
//   }, [activeTab, tabs]);

//   const activeTabData = useMemo(() => {
//     return tabs.find((tab) => tab.id === activeTab);
//   }, [activeTab, tabs]);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
//       {/* Animated Background Elements */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
//       </div>

//       {/* Compact Header with Integrated Tabs */}
//       <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-xl">
//         <div className="absolute inset-0 bg-black/10"></div>
//         <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:16px_16px]"></div>

//         <div className="relative max-w-8xl mx-auto px-3 sm:px-4 lg:px-6 py-2 lg:py-3">
//           {/* MOBILE/TABLET LAYOUT */}
//           <div className="lg:hidden space-y-2">
//             {/* Top Row: Title + User Info */}
//             <div className="flex items-center justify-between gap-2">
//               {/* Title Section */}
//               <div className="flex items-center gap-2 flex-1 min-w-0">
//                 <div className="flex items-center justify-center w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
//                   <Shield size={18} className="text-white" />
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <div className="flex items-center gap-1.5">
//                     <h1 className="text-sm font-black text-white tracking-tight truncate">
//                       Fin Check | Inspection
//                     </h1>
//                     <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
//                       <Sparkles size={8} className="text-yellow-300" />
//                       <span className="text-[8px] font-bold text-white">
//                         PRO
//                       </span>
//                     </div>
//                   </div>
//                   {/* Active Tab Indicator - Inline with title */}
//                   <div className="flex items-center gap-1.5 mt-0.5">
//                     <div className="relative flex h-1.5 w-1.5">
//                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
//                       <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
//                     </div>
//                     <p className="text-[10px] text-indigo-100 font-medium truncate">
//                       {activeTabData?.label} • Active
//                     </p>
//                   </div>
//                 </div>
//               </div>
//               {/* User Info */}
//               {user && (
//                 <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2 py-1 shadow-lg flex-shrink-0">
//                   <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md shadow">
//                     <User size={14} className="text-white" />
//                   </div>
//                   <div className="hidden sm:block">
//                     <p className="text-white font-bold text-[10px] leading-tight truncate max-w-[80px]">
//                       {user.job_title || "Operator"}
//                     </p>
//                     <p className="text-indigo-200 text-[9px] font-medium leading-tight">
//                       {user.emp_id}
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </div>
//             {/* Tabs - Scrollable */}
//             <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
//               <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1 min-w-max">
//                 {tabs.map((tab) => {
//                   const isActive = activeTab === tab.id;
//                   const isLocked = tab.requiresSave && !isReportSaved;

//                   return (
//                     <button
//                       key={tab.id}
//                       onClick={() => !isLocked && handleTabChange(tab.id)}
//                       disabled={isLocked}
//                       className={`group relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${
//                         isActive
//                           ? "bg-white shadow-lg scale-105"
//                           : isLocked
//                           ? "bg-transparent opacity-50 cursor-not-allowed"
//                           : "bg-transparent hover:bg-white/20"
//                       }`}
//                       title={
//                         isLocked
//                           ? "Save order data first to access this tab"
//                           : tab.description
//                       }
//                     >
//                       <div
//                         className={`transition-colors duration-300 ${
//                           isActive ? "text-indigo-600" : "text-white"
//                         }`}
//                       >
//                         {isLocked ? (
//                           <Lock className="w-4 h-4" />
//                         ) : (
//                           React.cloneElement(tab.icon, { className: "w-4 h-4" })
//                         )}
//                       </div>
//                       <span
//                         className={`text-[9px] font-bold transition-colors duration-300 whitespace-nowrap ${
//                           isActive ? "text-indigo-600" : "text-white"
//                         }`}
//                       >
//                         {tab.label}
//                       </span>
//                       {isActive && (
//                         <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow animate-pulse"></div>
//                       )}
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>

//           {/* DESKTOP LAYOUT */}
//           <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
//             {/* Left Side */}
//             <div className="flex items-center gap-4 flex-1">
//               {/* Title */}
//               <div className="flex items-center gap-3">
//                 <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
//                   <Shield size={22} className="text-white" />
//                 </div>
//                 <div>
//                   <div className="flex items-center gap-2">
//                     <h1 className="text-xl font-black text-white tracking-tight">
//                       Fin Check | Inspection
//                     </h1>
//                     <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
//                       <Sparkles size={10} className="text-yellow-300" />
//                       <span className="text-[10px] font-bold text-white">
//                         PRO
//                       </span>
//                     </div>
//                   </div>
//                   <p className="text-xs text-indigo-100 font-medium">
//                     Quality Inspection Data Collection
//                   </p>
//                 </div>
//               </div>
//               {/* Tabs */}
//               <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5">
//                 {tabs.map((tab) => {
//                   const isActive = activeTab === tab.id;
//                   return (
//                     <button
//                       key={tab.id}
//                       onClick={() => setActiveTab(tab.id)}
//                       className={`group relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-300 ${
//                         isActive
//                           ? "bg-white shadow-lg scale-105"
//                           : "bg-transparent hover:bg-white/20"
//                       }`}
//                     >
//                       <div
//                         className={`transition-colors duration-300 ${
//                           isActive ? "text-indigo-600" : "text-white"
//                         }`}
//                       >
//                         {React.cloneElement(tab.icon, { className: "w-4 h-4" })}
//                       </div>
//                       <span
//                         className={`text-[10px] font-bold transition-colors duration-300 ${
//                           isActive ? "text-indigo-600" : "text-white"
//                         }`}
//                       >
//                         {tab.label}
//                       </span>
//                       {isActive && (
//                         <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow animate-pulse"></div>
//                       )}
//                     </button>
//                   );
//                 })}
//               </div>
//               {/* Active Status */}
//               <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2">
//                 <div className="relative flex h-2 w-2">
//                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
//                   <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
//                 </div>
//                 <div>
//                   <p className="text-white font-bold text-sm leading-tight">
//                     {activeTabData?.label}
//                   </p>
//                   <p className="text-indigo-200 text-[10px] font-medium leading-tight">
//                     Active Section
//                   </p>
//                 </div>
//               </div>
//             </div>
//             {/* Right Side - User Info */}
//             {user && (
//               <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 shadow-lg">
//                 <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow">
//                   <User size={18} className="text-white" />
//                 </div>
//                 <div>
//                   <p className="text-white font-bold text-sm leading-tight">
//                     {user.job_title || "Operator"}
//                   </p>
//                   <p className="text-indigo-200 text-xs font-medium leading-tight">
//                     ID: {user.emp_id}
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Content Container */}
//       <div className="relative max-w-8xl mx-auto px-3 sm:px-4 lg:px-6 pb-6 pt-4">
//         <div className="animate-fadeIn">
//           <div className="transform transition-all duration-500 ease-out">
//             {activeComponent}
//           </div>
//         </div>
//       </div>

//       {/* Styles */}
//       <style jsx>{`
//         .scrollbar-hide::-webkit-scrollbar {
//           display: none;
//         }
//         .scrollbar-hide {
//           -ms-overflow-style: none;
//           scrollbar-width: none;
//         }
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//             transform: translateY(10px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.4s ease-out;
//         }
//         .bg-grid-white {
//           background-image: linear-gradient(
//               to right,
//               rgba(255, 255, 255, 0.1) 1px,
//               transparent 1px
//             ),
//             linear-gradient(
//               to bottom,
//               rgba(255, 255, 255, 0.1) 1px,
//               transparent 1px
//             );
//         }
//         .delay-1000 {
//           animation-delay: 1s;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default YPivotQAInspection;

import {
  FileText,
  Camera,
  ClipboardCheck,
  User,
  Shield,
  Sparkles,
  Package,
  Ruler,
  CheckSquare,
  Settings,
  Info,
  Lock,
  FileSpreadsheet,
  Home,
  ArrowLeft
} from "lucide-react";
import React, { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/authentication/AuthContext";
import YPivotQAInspectionOrderData from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionOrderData";
import YPivotQATemplatesHeader from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesHeader";
import YPivotQAInspectionPhotosDetermination from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionPhotosDetermination";
import YPivotQAInspectionLineTableColorConfig from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionLineTableColorConfig";
import YPivotQAInspectionMeasurementConfig from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionMeasurementConfig";
import YPivotQAInspectionDefectConfig from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionDefectConfig";
import YPivotQAInspectionSummary from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionSummary";
import YPivotQAInspectionPPSheetDetermination from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionPPSheetDetermination";
import YPivotQAInspectionHeaderDataSave from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionHeaderDataSave";

const PlaceholderComponent = ({ title, icon: Icon }) => {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg min-h-[400px] flex flex-col justify-center items-center border border-gray-200 dark:border-gray-700">
      <div className="mb-4 p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
        <Icon
          size={48}
          strokeWidth={1.5}
          className="text-indigo-500 dark:text-indigo-400"
        />
      </div>
      <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
        {title}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
        This section is under development.
      </p>
    </div>
  );
};

const YPivotQAInspection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("order");

  // NEW: Report saved state
  const [savedReportData, setSavedReportData] = useState(null);
  const [isReportSaved, setIsReportSaved] = useState(false);

  // Shared state for order data
  const [sharedOrderState, setSharedOrderState] = useState({
    inspectionDate: new Date().toISOString().split("T")[0],
    orderType: "single",
    selectedOrders: [],
    orderData: null,
    inspectionType: "first"
  });

  // Shared state for Report Configuration
  const [sharedReportState, setSharedReportState] = useState({
    selectedTemplate: null,
    headerData: {},
    photoData: {},
    config: {},
    lineTableConfig: [],
    measurementData: {},
    defectData: {}
  });

  // Add new state for quality plan (after sharedReportState):
  const [qualityPlanData, setQualityPlanData] = useState({
    productionStatus: {},
    packingList: {},
    accountedPercentage: "0.00"
  });

  // State for Active Inspection Context (Activated via Play button)
  const [activeGroup, setActiveGroup] = useState(null);

  // NEW: State to persist PP Sheet data across tab switches
  const [ppSheetData, setPPSheetData] = useState(null);

  // NEW: Handler to update PP Sheet data
  const handlePPSheetUpdate = useCallback((newData) => {
    setPPSheetData(newData);
  }, []);

  // NEW: Handler for save complete
  const handleSaveComplete = useCallback((result) => {
    // Destructure the result passed from the Modal
    const { reportData, isNew, message } = result;

    setSavedReportData(reportData);
    setIsReportSaved(true);

    // --- LOGIC TO SHOW MESSAGE IF EXISTING ---
    if (isNew === false) {
      // You can use a standard alert, or a custom Toast component if you have one
      alert(
        `⚠️ EXISTING REPORT FOUND\n\n${message}\n\nThe system detected a report for this Date, Order, and Inspection Type created by you. It has been updated with your current data.`
      );
    } else {
      // Optional: Success message for new report
      // alert("Success! New inspection report created.");
    }

    // Optional: Automatically move to next logical tab
    // setActiveTab("header");
  }, []);

  // NEW: Handle tab change with validation
  const handleTabChange = useCallback(
    (tabId) => {
      // If trying to leave "order" tab and report is not saved
      if (activeTab === "order" && tabId !== "order" && !isReportSaved) {
        // Could show a warning or prevent navigation
        // For now, we just block it
        return;
      }
      setActiveTab(tabId);
    },
    [activeTab, isReportSaved]
  );

  // Handler for order data changes
  const handleOrderDataChange = useCallback((newState) => {
    setSharedOrderState((prev) => ({ ...prev, ...newState }));
  }, []);

  // Handler for report data changes
  const handleReportDataChange = useCallback((newState) => {
    setSharedReportState((prev) => ({ ...prev, ...newState }));
  }, []);

  // Add after other handlers:
  const handleQualityPlanChange = useCallback((newData) => {
    setQualityPlanData(newData);
  }, []);

  // Handler for header updates
  const handleHeaderDataUpdate = useCallback((headerUpdates) => {
    setSharedReportState((prev) => ({
      ...prev,
      headerData: {
        ...prev.headerData,
        ...headerUpdates
      }
    }));
  }, []);

  // Handler for photo updates
  const handlePhotoDataUpdate = useCallback((photoUpdates) => {
    setSharedReportState((prev) => ({
      ...prev,
      photoData: {
        ...prev.photoData,
        ...photoUpdates
      }
    }));
  }, []);

  // Handler specifically for measurement updates
  const handleMeasurementDataUpdate = useCallback((measurementUpdates) => {
    setSharedReportState((prev) => ({
      ...prev,
      measurementData: {
        ...prev.measurementData,
        ...measurementUpdates
      }
    }));
  }, []);

  // Handler for defect updates
  const handleDefectDataUpdate = useCallback((defectUpdates) => {
    setSharedReportState((prev) => ({
      ...prev,
      defectData: {
        ...prev.defectData,
        ...defectUpdates
      }
    }));
  }, []);

  // Handler for setting active group (Play button)
  const handleSetActiveGroup = useCallback((group) => {
    setActiveGroup(group);
  }, []);

  // Navigate to Home
  const handleGoHome = useCallback(() => {
    navigate("/home");
  }, [navigate]);

  const tabs = useMemo(
    () => [
      {
        id: "order",
        label: "Order",
        icon: <Package size={18} />,
        component: (
          <YPivotQAInspectionOrderData
            onOrderDataChange={handleOrderDataChange}
            externalSelectedOrders={sharedOrderState.selectedOrders}
            externalOrderData={sharedOrderState.orderData}
            externalOrderType={sharedOrderState.orderType}
            externalInspectionDate={sharedOrderState.inspectionDate}
            externalInspectionType={sharedOrderState.inspectionType}
            // NEW: Pass report-related props
            onReportDataChange={handleReportDataChange}
            savedReportState={sharedReportState}
            onQualityPlanChange={handleQualityPlanChange}
            qualityPlanData={qualityPlanData}
            user={user}
            onSaveComplete={handleSaveComplete}
            savedReportId={savedReportData?.reportId}
            isReportSaved={isReportSaved}
          />
        ),
        gradient: "from-blue-500 to-cyan-500",
        description: "Order & Report configuration",
        requiresSave: false
      },
      ...(sharedReportState.selectedTemplate?.ReportType === "Pilot Run-Sewing"
        ? [
            {
              id: "pp_sheet",
              label: "PP Sheet",
              icon: <FileSpreadsheet size={18} />,
              component: (
                <YPivotQAInspectionPPSheetDetermination
                  orderData={sharedOrderState.orderData}
                  selectedOrders={sharedOrderState.selectedOrders}
                  inspectionDate={sharedOrderState.inspectionDate}
                  savedState={ppSheetData}
                  onUpdate={handlePPSheetUpdate}
                />
              ),
              gradient: "from-indigo-600 to-blue-600",
              description: "Pre-Production Meeting Sheet",
              requiresSave: true
            }
          ]
        : []),
      {
        id: "header",
        label: "Header",
        icon: <FileText size={18} />,
        component: (
          // MODIFIED: Use the Wrapper Component instead of YPivotQATemplatesHeader directly
          <YPivotQAInspectionHeaderDataSave
            headerData={sharedReportState.headerData}
            onUpdateHeaderData={handleHeaderDataUpdate}
            reportId={savedReportData?.reportId} // Pass the ID from saved order
            isReportSaved={isReportSaved} // Pass status to enable button
          />
        ),
        gradient: "from-purple-500 to-pink-500",
        description: "Inspection header",
        requiresSave: true
      },
      // {
      //   id: "header",
      //   label: "Header",
      //   icon: <FileText size={18} />,
      //   component: (
      //     <YPivotQATemplatesHeader
      //       headerData={sharedReportState.headerData}
      //       onUpdateHeaderData={handleHeaderDataUpdate}
      //     />
      //   ),
      //   gradient: "from-purple-500 to-pink-500",
      //   description: "Inspection header",
      //   requiresSave: true
      // },
      {
        id: "photos",
        label: "Photos",
        icon: <Camera size={18} />,
        component: (
          <YPivotQAInspectionPhotosDetermination
            reportData={sharedReportState}
            onUpdatePhotoData={handlePhotoDataUpdate}
          />
        ),
        gradient: "from-orange-500 to-red-500",
        description: "Photo documentation",
        requiresSave: true
      },
      {
        id: "info",
        label: "Info",
        icon: <Info size={18} />,
        component: (
          <YPivotQAInspectionLineTableColorConfig
            reportData={sharedReportState}
            orderData={sharedOrderState}
            onUpdate={handleReportDataChange}
            onSetActiveGroup={handleSetActiveGroup}
            activeGroup={activeGroup}
          />
        ),
        gradient: "from-teal-500 to-cyan-500",
        description: "Detailed Configuration",
        requiresSave: true
      },
      {
        id: "measurement",
        label: "Measurement",
        icon: <Ruler size={18} />,
        component: (
          <YPivotQAInspectionMeasurementConfig
            selectedOrders={sharedOrderState.selectedOrders}
            orderData={sharedOrderState.orderData}
            reportData={sharedReportState}
            onUpdateMeasurementData={handleMeasurementDataUpdate}
            activeGroup={activeGroup}
          />
        ),
        gradient: "from-green-500 to-emerald-500",
        description: "Measurement data",
        requiresSave: true
      },
      {
        id: "defects",
        label: "Defects",
        icon: <ClipboardCheck size={18} />,
        component: (
          <YPivotQAInspectionDefectConfig
            selectedOrders={sharedOrderState.selectedOrders}
            orderData={sharedOrderState.orderData}
            reportData={sharedReportState}
            activeGroup={activeGroup}
            onUpdateDefectData={handleDefectDataUpdate}
          />
        ),
        gradient: "from-red-500 to-rose-500",
        description: "Defect recording",
        requiresSave: true
      },
      {
        id: "summary",
        label: "Summary",
        icon: <CheckSquare size={18} />,
        component: (
          <YPivotQAInspectionSummary
            orderData={sharedOrderState}
            reportData={sharedReportState}
          />
        ),
        gradient: "from-indigo-500 to-violet-500",
        description: "Inspection summary",
        requiresSave: true
      }
    ],
    [
      handleOrderDataChange,
      sharedOrderState,
      handleReportDataChange,
      sharedReportState,
      handleHeaderDataUpdate,
      handlePhotoDataUpdate,
      handleMeasurementDataUpdate,
      handleDefectDataUpdate,
      handleSetActiveGroup,
      activeGroup,
      handleQualityPlanChange,
      qualityPlanData,
      user,
      handleSaveComplete,
      savedReportData,
      isReportSaved,
      ppSheetData,
      handlePPSheetUpdate
    ]
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  const activeTabData = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab);
  }, [activeTab, tabs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* FIXED Header with Integrated Tabs */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:16px_16px]"></div>

        <div className="relative max-w-8xl mx-auto px-3 sm:px-4 lg:px-6 py-2 lg:py-3">
          {/* MOBILE/TABLET LAYOUT */}
          <div className="lg:hidden space-y-2">
            {/* Top Row: Title + YQMS Button + User Info */}
            <div className="flex items-center justify-between gap-2">
              {/* Title Section with YQMS Button */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* YQMS Home Button - Mobile */}
                <button
                  onClick={handleGoHome}
                  className="flex-shrink-0 flex items-center justify-center w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 rounded-lg shadow-lg transition-all active:scale-95"
                  title="Go to YQMS Home"
                >
                  <Home size={18} className="text-white" />
                </button>

                <div className="flex items-center justify-center w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <Shield size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-black text-white tracking-tight truncate">
                      Fin Check
                    </h1>
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={8} className="text-yellow-300" />
                      <span className="text-[8px] font-bold text-white">
                        PRO
                      </span>
                    </div>
                  </div>
                  {/* Active Tab Indicator - Inline with title */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
                    </div>
                    <p className="text-[10px] text-indigo-100 font-medium truncate">
                      {activeTabData?.label} • Active
                    </p>
                  </div>
                </div>
              </div>
              {/* User Info */}
              {user && (
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2 py-1 shadow-lg flex-shrink-0">
                  <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md shadow">
                    <User size={14} className="text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white font-bold text-[10px] leading-tight truncate max-w-[80px]">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 text-[9px] font-medium leading-tight">
                      {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {/* Tabs - Scrollable */}
            <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1 min-w-max">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const isLocked = tab.requiresSave && !isReportSaved;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => !isLocked && handleTabChange(tab.id)}
                      disabled={isLocked}
                      className={`group relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-white shadow-lg scale-105"
                          : isLocked
                          ? "bg-transparent opacity-50 cursor-not-allowed"
                          : "bg-transparent hover:bg-white/20"
                      }`}
                      title={
                        isLocked
                          ? "Save order data first to access this tab"
                          : tab.description
                      }
                    >
                      <div
                        className={`transition-colors duration-300 ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          React.cloneElement(tab.icon, { className: "w-4 h-4" })
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-bold transition-colors duration-300 whitespace-nowrap ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DESKTOP LAYOUT */}
          <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
            {/* Left Side */}
            <div className="flex items-center gap-4 flex-1">
              {/* YQMS Home Button - Desktop */}
              <button
                onClick={handleGoHome}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
                title="Go to YQMS Home"
              >
                <ArrowLeft size={16} className="text-white" />
                <span className="text-sm font-bold text-white">YQMS</span>
              </button>

              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <Shield size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-white tracking-tight">
                      Fin Check | Inspection
                    </h1>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] font-bold text-white">
                        PRO
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-indigo-100 font-medium">
                    Quality Inspection Data Collection
                  </p>
                </div>
              </div>
              {/* Tabs */}
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const isLocked = tab.requiresSave && !isReportSaved;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => !isLocked && handleTabChange(tab.id)}
                      disabled={isLocked}
                      className={`group relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-white shadow-lg scale-105"
                          : isLocked
                          ? "bg-transparent opacity-50 cursor-not-allowed"
                          : "bg-transparent hover:bg-white/20"
                      }`}
                      title={
                        isLocked
                          ? "Save order data first to access this tab"
                          : tab.description
                      }
                    >
                      <div
                        className={`transition-colors duration-300 ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          React.cloneElement(tab.icon, { className: "w-4 h-4" })
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold transition-colors duration-300 ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Active Status */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">
                    {activeTabData?.label}
                  </p>
                  <p className="text-indigo-200 text-[10px] font-medium leading-tight">
                    Active Section
                  </p>
                </div>
              </div>
            </div>
            {/* Right Side - User Info */}
            {user && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 shadow-lg">
                <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow">
                  <User size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">
                    {user.job_title || "Operator"}
                  </p>
                  <p className="text-indigo-200 text-xs font-medium leading-tight">
                    ID: {user.emp_id}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Container - Reduced padding-top */}
      <div className="relative max-w-8xl mx-auto px-3 sm:px-4 lg:px-6 pb-6 pt-[100px] lg:pt-[72px]">
        <div className="animate-fadeIn">
          <div className="transform transition-all duration-500 ease-out">
            {activeComponent}
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .bg-grid-white {
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            );
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default YPivotQAInspection;
