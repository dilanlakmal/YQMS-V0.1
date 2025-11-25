// import React, { useState } from "react";
// import { FileText, Sparkles, Shield, User, Layout, Camera } from "lucide-react";
// import { useAuth } from "../components/authentication/AuthContext";
// import YPivotQATemplatesReportType from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesReportType";
// import YPivotQATemplatesHeader from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesHeader";
// import YPivotQATemplatesPhotos from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesPhotos";

// const YPivotQATemplates = () => {
//   const { user } = useAuth();
//   const [activeTab, setActiveTab] = useState("reports");

//   const tabs = [
//     {
//       id: "reports",
//       label: "Reports",
//       icon: <FileText size={18} />,
//       component: <YPivotQATemplatesReportType />
//     },
//     {
//       id: "header",
//       label: "Header Preview",
//       icon: <Layout size={18} />,
//       component: <YPivotQATemplatesHeader />
//     },
//     {
//       id: "photos",
//       label: "Photo Sections",
//       icon: <Camera size={18} />,
//       component: <YPivotQATemplatesPhotos />
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
//       {/* --- Header Section --- */}
//       <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
//         <div className="absolute inset-0 bg-black/10"></div>
//         <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>

//         <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
//           <div className="flex items-center justify-between gap-4">
//             {/* Title Area */}
//             <div className="flex items-center gap-4">
//               <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
//                 <Shield size={24} className="text-white" />
//               </div>
//               <div>
//                 <div className="flex items-center gap-2 mb-1">
//                   <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
//                     Fin Check | Templates
//                   </h1>
//                   <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
//                     <Sparkles size={12} className="text-yellow-300" />
//                     <span className="text-xs font-bold text-white">PRO</span>
//                   </div>
//                 </div>
//                 <p className="text-xs sm:text-sm text-indigo-100 font-medium">
//                   Manage Inspection Templates & Configurations
//                 </p>
//               </div>
//             </div>

//             {/* User Info */}
//             {user && (
//               <div className="hidden sm:flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 shadow-xl">
//                 <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
//                   <User size={20} className="text-white" />
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

//           {/* Navigation Tabs */}
//           <div className="mt-6 flex gap-2 overflow-x-auto scrollbar-hide">
//             {tabs.map((tab) => {
//               const isActive = activeTab === tab.id;
//               return (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300 ${
//                     isActive
//                       ? "bg-white shadow-lg text-indigo-600 scale-105"
//                       : "bg-white/10 text-white hover:bg-white/20"
//                   }`}
//                 >
//                   {React.cloneElement(tab.icon, { className: "w-4 h-4" })}
//                   <span className="text-sm font-bold whitespace-nowrap">
//                     {tab.label}
//                   </span>
//                   {isActive && (
//                     <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
//                   )}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       </div>

//       {/* --- Content Area --- */}
//       <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
//         <div className="animate-fadeIn">
//           <div className="transform transition-all duration-500 ease-out">
//             {tabs.find((t) => t.id === activeTab)?.component}
//           </div>
//         </div>
//       </div>

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
//           animation: fadeIn 0.5s ease-out;
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
//       `}</style>
//     </div>
//   );
// };

// export default YPivotQATemplates;

import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  Shield,
  User,
  Layout,
  Camera,
  PenTool
} from "lucide-react"; // Added PenTool icon
import { useAuth } from "../components/authentication/AuthContext";
import YPivotQATemplatesReportType from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesReportType";
import YPivotQATemplatesHeader from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesHeader";
import YPivotQATemplatesPhotos from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesPhotos";
import YPivotQATemplatesImageEditor from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesImageEditor"; // <--- NEW IMPORT

const YPivotQATemplates = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("reports");

  const tabs = [
    {
      id: "reports",
      label: "Reports",
      icon: <FileText size={18} />,
      component: <YPivotQATemplatesReportType />
    },
    {
      id: "header",
      label: "Header Preview",
      icon: <Layout size={18} />,
      component: <YPivotQATemplatesHeader />
    },
    {
      id: "photos",
      label: "Photo Sections",
      icon: <Camera size={18} />,
      component: <YPivotQATemplatesPhotos />
    },
    // ---- NEW TAB ----
    {
      id: "editor",
      label: "Image Editor",
      icon: <PenTool size={18} />,
      component: <YPivotQATemplatesImageEditor />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      {/* --- Header Section --- */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>

        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
          <div className="flex items-center justify-between gap-4">
            {/* Title Area */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Fin Check | Templates
                  </h1>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                    <Sparkles size={12} className="text-yellow-300" />
                    <span className="text-xs font-bold text-white">PRO</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-indigo-100 font-medium">
                  Manage Inspection Templates & Configurations
                </p>
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="hidden sm:flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 shadow-xl">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
                  <User size={20} className="text-white" />
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

          {/* Navigation Tabs */}
          <div className="mt-6 flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "bg-white shadow-lg text-indigo-600 scale-105"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {React.cloneElement(tab.icon, { className: "w-4 h-4" })}
                  <span className="text-sm font-bold whitespace-nowrap">
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- Content Area --- */}
      <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <div className="animate-fadeIn">
          <div className="transform transition-all duration-500 ease-out">
            {tabs.find((t) => t.id === activeTab)?.component}
          </div>
        </div>
      </div>

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
          animation: fadeIn 0.5s ease-out;
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
      `}</style>
    </div>
  );
};

export default YPivotQATemplates;
