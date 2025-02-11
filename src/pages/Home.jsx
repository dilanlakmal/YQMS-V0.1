import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/authentication/AuthContext";

function Home() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!loading && user) {
      // User object is available here
    }
  }, [user, loading]);

  const hasRole = (requiredRoles) => {
    if (!user || !user.roles) {
      return false;
    }
    const allRoles = [...user.roles, ...(user.sub_roles || [])];
    return requiredRoles.some((role) => allRoles.includes(role));
  };

  const handleNavigation = (path, requiredRoles) => {
    if (hasRole(requiredRoles)) {
      navigate(path);
    } else {
      setErrorMessage("Unauthorized Access");
      setTimeout(() => {
        setErrorMessage("");
      }, 1000);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // Update your cards array to include inline SVG icons
  const cards = [
    {
      title: "Order Data",
      items: [
        {
          path: "/bundle-registration",
          roles: ["admin_user"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9l9-5.25M12 12.75l3.75-2.25M12 12.75V15l3.75-2.25"
              />
            </svg>
          ),
          title: "Bundle Registration",
          description: "Click here to register orders for QC2 Inspection.",
        },
        {
          path: "/washing",
          roles: ["admin_user"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 12h16M4 6h16M4 18h16M5 3h14M5 21h14"
              />
            </svg>
          ),
          title: "Washing",
          description: "Click here to register orders for Washing.",
        },
        {
          path: "/dyeing",
          roles: ["admin_user"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2C7.03 2 3 6.03 3 11c0 5 4 9 9 9s9-4 9-9c0-4.97-4.03-9-9-9zM7 12h10"
              />
            </svg>
          ),
          title: "Dyeing",
          description: "Click here to register orders for Dyeing.",
        },
        {
          path: "/ironing",
          roles: ["admin_user"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 14h13.5a3 3 0 002.98-2.64l.54-4.32A2 2 0 0018 5H6a3 3 0 00-3 3v6zM5 18h14"
              />
            </svg>
          ),
          title: "Ironing",
          description: "Click here to register orders for Ironing.",
        },
        {
          path: "/packing",
          roles: ["admin_user"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 14h13.5a3 3 0 002.98-2.64l.54-4.32A2 2 0 0018 5H6a3 3 0 00-3 3v6zM5 18h14"
              />
            </svg>
          ),
          title: "Packing",
          description: "Click here to register orders for Ironing.",
        },
      ],
    },
    {
      title: "Quality Inspection",
      items: [
        {
          path: "/details",
          roles: ["admin_user", "qc1"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12l-9-9-9 9m18-5v14a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2zM9 10h6m-6 4h6m-3-8v4"
              />
            </svg>
          ),
          title: "QC1 Inspection",
          description: "Begin a new QC1 Endline Inspection here.",
        },
        {
          path: "/qc2-inspection",
          roles: ["admin_user", "qc2"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          title: "QC2 Inspection",
          description: "Begin a new QC2 Inspection Report here.",
        },
      ],
    },
    {
      title: "QA Audit",
      items: [
        {
          path: "/audit",
          roles: ["admin_user", "qa"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-green-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm-3 4h6v1H9V6zm0 2h6v5H9V8zm0 6h6v1H9v-1z"
              />
            </svg>
          ),
          title: "QA Audit",
          description: "Start a QA Audit Report here.",
        },
      ],
    },
    {
      title: "Data Analytics",
      items: [
        {
          path: "/download-data",
          roles: ["admin_user"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
              />
            </svg>
          ),
          title: "Download Data",
          description: "Click here to Download Data.",
        },
        {
          path: "/dashboard",
          roles: ["admin_user"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
              />
            </svg>
          ),
          title: "Live Dashboard",
          description: "Click here to see Live Dashboard.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-20 px-20">
      <div className="max-w-8xl mx-auto">
        <h3 className="text-3xl font-extrabold text-blue-900 mb-8 text-center drop-shadow-md">
          Welcome to Quality Data Management System
        </h3>
        <p className="text-lg text-gray-700 text-center mb-12">
          Click on the cards below to start inspection Reports or Live
          monitoring
        </p>
        {errorMessage && (
          <div className="bg-red-500 text-white text-center py-2 mb-4 rounded">
            {errorMessage}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {cards.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">
                {section.title}
              </h2>
              {section.items.map(
                (item, itemIndex) =>
                  hasRole(item.roles) && (
                    <div
                      key={itemIndex}
                      onClick={() => handleNavigation(item.path, item.roles)}
                      className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
                    >
                      <div className="flex items-center justify-center mb-4 bg-blue-100 w-12 h-12 rounded-full group-hover:bg-blue-600">
                        {item.icon}
                      </div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                        {item.title}
                      </h2>
                      <p className="text-sm text-gray-600 group-hover:text-gray-800">
                        {item.description}
                      </p>
                    </div>
                  )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

//   return (
//     <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-20 px-6">
//       <div className="max-w-8xl mx-auto">
//         <h3 className="text-3xl font-extrabold text-blue-900 mb-12 text-left drop-shadow-md">
//           Welcome to Quality Data Management System
//         </h3>

//         <p className="text-lg text-gray-700 text-left mb-12">
//           Click on the cards below to start inspection Reports or Live
//           monitoring
//         </p>

//         {/* Grid with 4 columns */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
//           {/* Column 1: Order Data */}
//           <div className="space-y-8">
//             <h2 className="text-2xl font-bold text-blue-900 mb-4">
//               Order Data
//             </h2>

//             {/* Bundle Registration Card */}
//             <div
//               onClick={() => navigate("/bundle-registration")}
//               className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
//             >
//               <div className="flex items-center justify-center mb-4 bg-blue-100 w-12 h-12 rounded-full group-hover:bg-blue-600">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   strokeWidth={1.5}
//                   stroke="currentColor"
//                   className="w-6 h-6 text-blue-600 group-hover:text-white"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9l9-5.25M12 12.75l3.75-2.25M12 12.75V15l3.75-2.25"
//                   />
//                 </svg>
//               </div>
//               <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
//                 Bundle Registration
//               </h2>
//               <p className="text-sm text-gray-600 group-hover:text-gray-800">
//                 Click here to register orders for QC2 Inspection.
//               </p>
//             </div>

//             {/* Washing Card */}
//             <div
//               onClick={() => navigate("/washing")}
//               className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
//             >
//               <div className="flex items-center justify-center mb-4 bg-blue-100 w-12 h-12 rounded-full group-hover:bg-blue-600">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   strokeWidth={1.5}
//                   stroke="currentColor"
//                   className="w-6 h-6 text-blue-600 group-hover:text-white"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M4 12h16M4 6h16M4 18h16M5 3h14M5 21h14"
//                   />
//                 </svg>
//               </div>
//               <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
//                 Washing
//               </h2>
//               <p className="text-sm text-gray-600 group-hover:text-gray-800">
//                 Click here to register orders for Washing
//               </p>
//             </div>
//             {/* Dyeing Card */}
//             <div
//               onClick={() => navigate("/dyeing")}
//               className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
//             >
//               <div className="flex items-center justify-center mb-4 bg-blue-100 w-12 h-12 rounded-full group-hover:bg-blue-600">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   strokeWidth={1.5}
//                   stroke="currentColor"
//                   className="w-6 h-6 text-blue-600 group-hover:text-white"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M12 2C7.03 2 3 6.03 3 11c0 5 4 9 9 9s9-4 9-9c0-4.97-4.03-9-9-9zM7 12h10"
//                   />
//                 </svg>
//               </div>
//               <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
//                 Dyeing
//               </h2>
//               <p className="text-sm text-gray-600 group-hover:text-gray-800">
//                 Click here to register orders for Dyeing
//               </p>
//             </div>
//             {/* Ironing Card */}
//             <div
//               onClick={() => navigate("/ironing")}
//               className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
//             >
//               <div className="flex items-center justify-center mb-4 bg-blue-100 w-12 h-12 rounded-full group-hover:bg-blue-600">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   strokeWidth={1.5}
//                   stroke="currentColor"
//                   className="w-6 h-6 text-blue-600 group-hover:text-white"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M3 14h13.5a3 3 0 002.98-2.64l.54-4.32A2 2 0 0018 5H6a3 3 0 00-3 3v6zM5 18h14"
//                   />
//                 </svg>
//               </div>
//               <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
//                 Ironing
//               </h2>
//               <p className="text-sm text-gray-600 group-hover:text-gray-800">
//                 Click here to register orders for Ironing
//               </p>
//             </div>
//             {/* Packing */}
//             <div
//               onClick={() => navigate("/packing")}
//               className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
//             >
//               <div className="flex items-center justify-center mb-4 bg-blue-100 w-12 h-12 rounded-full group-hover:bg-blue-600">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   strokeWidth={1.5}
//                   stroke="currentColor"
//                   className="w-6 h-6 text-blue-600 group-hover:text-white"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M3 14h13.5a3 3 0 002.98-2.64l.54-4.32A2 2 0 0018 5H6a3 3 0 00-3 3v6zM5 18h14"
//                   />
//                 </svg>
//               </div>
//               <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
//                 Packing
//               </h2>
//               <p className="text-sm text-gray-600 group-hover:text-gray-800">
//                 Click here to register orders for Ironing
//               </p>
//             </div>
//           </div>

//           {/* Column 2: Quality Inspection */}
//           <div className="space-y-8">
//             <h2 className="text-2xl font-bold text-blue-900 mb-4">
//               Quality Inspection
//             </h2>
//             {/* QC1 Inspection Card */}
//             <div
//               onClick={() => navigate("/details")}
//               className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
//             >
//               <div className="flex items-center justify-center mb-4 bg-blue-100 w-12 h-12 rounded-full group-hover:bg-blue-600">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   strokeWidth={1.5}
//                   stroke="currentColor"
//                   className="w-6 h-6 text-blue-600 group-hover:text-white"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M21 12l-9-9-9 9m18-5v14a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2zM9 10h6m-6 4h6m-3-8v4"
//                   />
//                 </svg>
//               </div>
//               <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
//                 QC1 Inspection
//               </h2>
//               <p className="text-sm text-gray-600 group-hover:text-gray-800">
//                 Begin a new QC1 Endline Inspection here.
//               </p>
//             </div>

//             {/* QC2 Inspection Card */}
//             <div
//               onClick={() => navigate("/qc2-inspection")}
//               className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
//             >
//               <div className="flex items-center justify-center mb-4 bg-blue-100 w-12 h-12 rounded-full group-hover:bg-blue-600">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   strokeWidth={1.5}
//                   stroke="currentColor"
//                   className="w-6 h-6 text-blue-600 group-hover:text-white"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//                   />
//                 </svg>
//               </div>
//               <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
//                 QC2 Inspection
//               </h2>
//               <p className="text-sm text-gray-600 group-hover:text-gray-800">
//                 Begin a new QC2 Inspection Report here.
//               </p>
//             </div>
//           </div>

//           {/* Column 3: QA Audit */}
//           <div className="space-y-8">
//             <h2 className="text-2xl font-bold text-blue-900 mb-4">QA Audit</h2>
//             {/* QA Audit Card */}
//             <div
//               onClick={() => navigate("/audit")}
//               className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
//             >
//               <div className="flex items-center justify-center mb-4 bg-green-100 w-12 h-12 rounded-full group-hover:bg-green-600">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   strokeWidth={1.5}
//                   stroke="currentColor"
//                   className="w-6 h-6 text-green-600 group-hover:text-white"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M12 2c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm-3 4h6v1H9V6zm0 2h6v5H9V8zm0 6h6v1H9v-1z"
//                   />
//                 </svg>
//               </div>
//               <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600">
//                 QA Audit
//               </h2>
//               <p className="text-sm text-gray-600 group-hover:text-gray-800">
//                 Start a QA Audit Report here.
//               </p>
//             </div>
//           </div>

//           {/* Column 4: Data Analytics */}
//           <div className="space-y-8">
//             <h2 className="text-2xl font-bold text-blue-900 mb-4">
//               Data Analytics
//             </h2>
//             {/* Download Data Card */}
//             <div
//               onClick={() => navigate("/download-data")}
//               className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
//             >
//               <div className="flex items-center justify-center mb-4 bg-blue-100 w-12 h-12 rounded-full group-hover:bg-blue-600">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   strokeWidth={1.5}
//                   stroke="currentColor"
//                   className="w-6 h-6 text-blue-600 group-hover:text-white"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
//                   />
//                 </svg>
//               </div>
//               <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
//                 Download Data
//               </h2>
//               <p className="text-sm text-gray-600 group-hover:text-gray-800">
//                 Click here to Download Data.
//               </p>
//             </div>
//             {/* Live Dashboard Card */}
//             <div
//               onClick={() => navigate("/dashboard")}
//               className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
//             >
//               <div className="flex items-center justify-center mb-4 bg-blue-100 w-12 h-12 rounded-full group-hover:bg-blue-600">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   strokeWidth={1.5}
//                   stroke="currentColor"
//                   className="w-6 h-6 text-blue-600 group-hover:text-white"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
//                   />
//                 </svg>
//               </div>
//               <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
//                 Live Dashboard
//               </h2>
//               <p className="text-sm text-gray-600 group-hover:text-gray-800">
//                 Click here to see Live Dashboard.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

export default Home;
