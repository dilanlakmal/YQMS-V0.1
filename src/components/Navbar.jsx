// import axios from "axios";
// import {
//   Activity,
//   BarChart2,
//   ChevronDown,
//   ChevronRight,
//   ClipboardList,
//   FileText,
//   LayoutDashboard,
//   LogOut,
//   Menu,
//   Package,
//   Settings,
//   User,
//   X
// } from "lucide-react";
// import React, { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import { Link, useNavigate } from "react-router-dom";
// import { API_BASE_URL } from "../../config";
// import LanguageSwitcher from "../components/layout/LangSwitch";
// import { useAuth } from "./authentication/AuthContext";

// export default function Navbar({ onLogout }) {
//   const { t } = useTranslation();
//   const navigate = useNavigate();
//   const { user, clearUser } = useAuth();
//   const [isMenuOpen, setIsMenuOpen] = useState(null);
//   const [isProfileOpen, setIsProfileOpen] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [expandedSection, setExpandedSection] = useState(null);
//   const [roleManagement, setRoleManagement] = useState(null);
//   const [userRoles, setUserRoles] = useState([]);

//   useEffect(() => {
//     fetchRoleManagement();
//     if (user) {
//       fetchUserRoles();
//     }
//   }, [user]);

//   const fetchUserRoles = async () => {
//     try {
//       const response = await axios.get(
//         `${API_BASE_URL}/api/user-roles/${user.emp_id}`
//       );
//       setUserRoles(response.data.roles);
//     } catch (error) {
//       console.error("Error fetching user roles:", error);
//     }
//   };

//   const fetchRoleManagement = async () => {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/api/role-management`);
//       setRoleManagement(response.data);
//     } catch (error) {
//       console.error("Error fetching role management:", error);
//     }
//   };

//   const isSuperAdmin = userRoles.includes("Super Admin");
//   const isAdmin = userRoles.includes("Admin");
//   const isAllowedSuperAdmin = ["YM6702", "YM7903"].includes(user?.emp_id);

//   // Updated hasAccess function to check jobTitles instead of users
//   const hasAccess = (requiredRoles) => {
//     if (!user || !roleManagement) return false;
//     if (isSuperAdmin || isAdmin) return true;
//     return requiredRoles.some((reqRole) =>
//       roleManagement.some(
//         (roleObj) =>
//           roleObj.role === reqRole && roleObj.jobTitles.includes(user.job_title)
//       )
//     );
//   };

//   const handleSignOut = () => {
//     localStorage.removeItem("accessToken");
//     sessionStorage.removeItem("accessToken");
//     localStorage.removeItem("refreshToken");
//     sessionStorage.removeItem("refreshToken");
//     localStorage.removeItem("user");
//     sessionStorage.removeItem("user");
//     clearUser();
//     onLogout();
//     navigate("/", { replace: true });
//   };

//   const navItems = [
//     {
//       title: t("home.cutting"),
//       icon: <ClipboardList className="h-4 w-4 mr-2" />,
//       items: [
//         {
//           path: "/fabric",
//           title: t("home.fabric"),
//           requiredRoles: ["Super Admin", "Admin", "Fabric"]
//         },
//         {
//           path: "/cutting",
//           title: t("home.cutting"),
//           requiredRoles: ["Super Admin", "Admin", "Cutting"]
//         },
//         {
//           path: "/scc",
//           title: t("home.scc"),
//           requiredRoles: ["Super Admin", "Admin", "SCC"]
//         },
//         {
//           path: "/sysadmin",
//           title: t("home.systemadmin"),
//           requiredRoles: ["Super Admin", "System Administration"]
//         },
//         {
//           path: "/yqms",
//           title: t("home.yqms"),
//           requiredRoles: ["Super Admin", "YQMS"]
//         }
//       ]
//     },
//     {
//       title: t("nav.orders"),
//       icon: <Package className="h-4 w-4 mr-2" />,
//       items: [
//         {
//           path: "/bundle-registration",
//           title: t("home.bundle_registration"),
//           requiredRoles: ["Super Admin", "Admin", "Bundle Registration"]
//         },
//         {
//           path: "/washing",
//           title: t("home.washing"),
//           requiredRoles: ["Super Admin", "Admin", "Washing"]
//         },
//         {
//           path: "/opa",
//           title: t("home.opa"),
//           requiredRoles: ["Super Admin", "Admin", "OPA"]
//         },
//         {
//           path: "/ironing",
//           title: t("home.ironing"),
//           requiredRoles: ["Super Admin", "Admin", "Ironing"]
//         },
//         {
//           path: "/packing",
//           title: t("home.packing"),
//           requiredRoles: ["Super Admin", "Admin", "Packing"]
//         }
//       ]
//     },
//     {
//       title: t("nav.qc"),
//       icon: <Activity className="h-4 w-4 mr-2" />,
//       items: [
//         {
//           path: "/roving",
//           title: t("qcRoving.qcInlineRoving"),
//           requiredRoles: ["Super Admin", "Admin", "QC Roving"]
//         },
//         {
//           path: "/inline-emp",
//           title: t("home.printing_QR"),
//           requiredRoles: ["Super Admin", "Admin", "Printing"]
//         },
//         {
//           path: "/details",
//           title: t("home.qc1_inspection"),
//           requiredRoles: ["Super Admin", "Admin", "QC1 Inspection"]
//         },
//         {
//           path: "/qc2-repair-tracking",
//           title: t("home.qc2_repair_tracking"),
//           requiredRoles: [
//             "Super Admin",
//             "Admin",
//             "QC2 Tracking",
//             "QC2 Inspection"
//           ]
//         },
//         {
//           path: "/qc2-inspection",
//           title: t("home.qc2_inspection"),
//           requiredRoles: ["Super Admin", "Admin", "QC2 Inspection"]
//         },
//         {
//           path: "/b-grade-defect",
//           title: t("home.b-grade_defect"),
//           requiredRoles: ["Super Admin", "Admin", "QC2 Inspection"]
//         },
//         {
//           path: "/b-grade-stcok",
//           title: t("home.b-grade_stock"),
//           requiredRoles: ["Super Admin", "Admin", "QC2 Inspection"]
//         }
//       ]
//     },
//     {
//       title: t("nav.qa"),
//       icon: <BarChart2 className="h-4 w-4 mr-2" />,
//       items: [
//         {
//           path: "/audit",
//           title: t("home.qa_audit"),
//           requiredRoles: ["Super Admin", "Admin", "QA Audit"]
//         },
//         {
//           path: "/final-inspection",
//           title: t("home.final_inspection"),
//           requiredRoles: ["Super Admin", "Admin", "QA Audit"]
//         }
//       ]
//     },
//     {
//       title: t("nav.report"),
//       icon: <FileText className="h-4 w-4 mr-2" />,
//       items: [
//         {
//           path: "/download-data",
//           title: t("home.download_data"),
//           requiredRoles: ["Super Admin", "Admin", "Download Data"]
//         },
//         {
//           path: "/live-dashboard",
//           title: t("home.live_dashboard"),
//           requiredRoles: ["Super Admin", "Admin", "Live Dashboard"]
//         },
//         {
//           path: "/powerbi",
//           title: "Power BI",
//           requiredRoles: ["Super Admin", "Admin", "Power BI"]
//         },
//         {
//           path: "/qa-pivot",
//           title: "QA Evaluation",
//           requiredRoles: ["Super Admin", "Admin", "QA Pivot"]
//         },
//         {
//           path: "/qc1-sunrise",
//           title: "QC1 Sunrise",
//           requiredRoles: ["Super Admin", "Admin", "QC1 Sunrise"]
//         }
//       ]
//     }
//   ];

//   const showRoleManagement = isSuperAdmin || isAdmin;

//   const toggleDropdown = (sectionTitle) => {
//     setIsMenuOpen((prevState) =>
//       prevState === sectionTitle ? null : sectionTitle
//     );
//   };

//   const closeAllDropdowns = () => {
//     setIsMenuOpen(null);
//     setIsProfileOpen(false);
//     setExpandedSection(null);
//   };

//   const toggleMobileMenu = () => {
//     setIsMobileMenuOpen(!isMobileMenuOpen);
//   };

//   const handleSectionClick = (sectionTitle) => {
//     setExpandedSection((prevState) =>
//       prevState === sectionTitle ? null : sectionTitle
//     );
//   };

//   const handleSubLinkClick = (path) => {
//     navigate(path);
//     setIsMobileMenuOpen(false);
//     setExpandedSection(null);
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (isMenuOpen || isProfileOpen) {
//         const isDropdownClicked = event.target.closest(".relative.group");
//         const isProfileClicked = event.target.closest(".relative");
//         if (!isDropdownClicked && !isProfileClicked) {
//           closeAllDropdowns();
//         }
//       }
//     };

//     document.addEventListener("click", handleClickOutside);
//     return () => {
//       document.removeEventListener("click", handleClickOutside);
//     };
//   }, [isMenuOpen, isProfileOpen]);

//   return (
//     <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
//       <div className="max-w-7xl mx-auto px-4">
//         <div className="flex justify-between h-16 items-center">
//           <div className="flex items-center">
//             <Link to="/home" className="text-xl font-bold text-blue-600">
//               YQMS
//             </Link>
//           </div>

//           <div className="hidden sm:flex sm:space-x-8">
//             {navItems.map((section) => (
//               <div key={section.title} className="relative group">
//                 <button
//                   className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
//                   onClick={() => toggleDropdown(section.title)}
//                 >
//                   {section.icon}
//                   {section.title}
//                   <ChevronDown className="ml-1 h-4 w-4" />
//                 </button>
//                 <div
//                   className={`absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 ${
//                     isMenuOpen === section.title
//                       ? "opacity-100 visible"
//                       : "opacity-0 invisible"
//                   } transition-all duration-200`}
//                 >
//                   <div className="py-1">
//                     {section.items.map((item) => {
//                       const accessible = hasAccess(item.requiredRoles);
//                       return accessible ? (
//                         <Link
//                           key={item.path}
//                           to={item.path}
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                           onClick={closeAllDropdowns}
//                         >
//                           {item.title}
//                         </Link>
//                       ) : (
//                         <span
//                           key={item.path}
//                           className="block px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
//                         >
//                           {item.title}
//                         </span>
//                       );
//                     })}
//                   </div>
//                 </div>
//               </div>
//             ))}

//             {isAllowedSuperAdmin && (
//               <Link
//                 to="/settings"
//                 className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
//               >
//                 <Settings className="h-4 w-4 mr-2" />
//                 {t("nav.setting")}
//               </Link>
//             )}

//             {showRoleManagement && (
//               <>
//                 <Link
//                   to="/role-management"
//                   className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
//                 >
//                   <LayoutDashboard className="h-4 w-4 mr-2" />
//                   {t("nav.roles")}
//                 </Link>
//                 <Link
//                   to="/user-list"
//                   className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
//                 >
//                   <User className="h-4 w-4 mr-2" />
//                   {t("nav.users")}
//                 </Link>
//               </>
//             )}
//           </div>

//           <div className="inline-flex items-center space-x-3 mr-3">
//             <LanguageSwitcher />
//           </div>

//           <div className="flex items-center">
//             {user && (
//               <div className="relative">
//                 <div
//                   className="flex items-center space-x-4 cursor-pointer"
//                   onClick={() => setIsProfileOpen(!isProfileOpen)}
//                 >
//                   <span className="text-sm font-medium text-gray-900">
//                     {user.name}
//                   </span>
//                   <div className="relative">
//                     <img
//                       src={user.face_photo || "/default-avatar.png"}
//                       alt={user.name}
//                       className="h-8 w-8 rounded-full"
//                     />
//                     <ChevronDown className="h-4 w-4 absolute -bottom-1 -right-1 text-gray-500" />
//                   </div>
//                 </div>

//                 {isProfileOpen && (
//                   <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
//                     <div className="py-1">
//                       <Link
//                         to="/profile"
//                         className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                         onClick={closeAllDropdowns}
//                       >
//                         <User className="h-4 w-4 mr-2" />
//                         Profile
//                       </Link>
//                       <button
//                         onClick={() => {
//                           handleSignOut();
//                           closeAllDropdowns();
//                         }}
//                         className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                       >
//                         <LogOut className="h-4 w-4 mr-2" />
//                         Sign out
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             <div className="sm:hidden">
//               <button
//                 onClick={toggleMobileMenu}
//                 className="text-gray-900 hover:text-gray-600 focus:outline-none"
//               >
//                 {isMobileMenuOpen ? (
//                   <X className="h-6 w-6" />
//                 ) : (
//                   <Menu className="h-6 w-6" />
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {isMobileMenuOpen && (
//         <div className="sm:hidden">
//           <div className="px-2 pt-2 pb-3 space-y-1">
//             {navItems.map((section) => (
//               <div key={section.title}>
//                 <div
//                   className="flex items-center justify-between px-4 py-2 text-base font-medium text-gray-700"
//                   onClick={() => handleSectionClick(section.title)}
//                 >
//                   {section.icon}
//                   {section.title}
//                   <ChevronRight
//                     className={`h-4 w-4 transition-transform ${
//                       expandedSection === section.title ? "rotate-90" : ""
//                     }`}
//                   />
//                 </div>
//                 {expandedSection === section.title && (
//                   <div className="pl-4">
//                     {section.items.map((item) => {
//                       const accessible = hasAccess(item.requiredRoles);
//                       return (
//                         <div
//                           key={item.path}
//                           className={`block pl-4 pr-4 py-2 text-base font-medium ${
//                             accessible
//                               ? "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
//                               : "text-gray-400 cursor-not-allowed"
//                           }`}
//                           onClick={() =>
//                             accessible && handleSubLinkClick(item.path)
//                           }
//                         >
//                           {item.title}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>
//             ))}

//             {isAllowedSuperAdmin && (
//               <div
//                 className="block pl-4 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50"
//                 onClick={() => handleSubLinkClick("/settings")}
//               >
//                 <Settings className="h-4 w-4 mr-2" />
//                 {t("nav.setting")}
//               </div>
//             )}

//             {showRoleManagement && (
//               <>
//                 <div
//                   className="block pl-4 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50"
//                   onClick={() => handleSubLinkClick("/role-management")}
//                 >
//                   <LayoutDashboard className="h-4 w-4 mr-2" />
//                   {t("nav.roles")}
//                 </div>
//                 <div
//                   className="block pl-4 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50"
//                   onClick={() => handleSubLinkClick("/user-list")}
//                 >
//                   <User className="h-4 w-4 mr-2" />
//                   {t("nav.users")}
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </nav>
//   );
// }

import axios from "axios";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef
} from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./authentication/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { API_BASE_URL } from "../../config";
import LanguageSwitcher from "../components/layout/LangSwitch";
import {
  Layers,
  Settings,
  BarChart3,
  Scissors,
  CheckSquare,
  Shield,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
  TerminalSquare,
  UserPlus
} from "lucide-react";

export default function Navbar({ onLogout }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, clearUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isMenuOpen, setIsMenuOpen] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState(null);

  const [roleManagement, setRoleManagement] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [accessMap, setAccessMap] = useState({});
  const profileMenuRef = useRef(null);
  const navRef = useRef(null);

  const navStructure = useMemo(
    () => [
      /* ... your navStructure is correct and unchanged ... */
      {
        id: "qc2-system",
        title: "QC2",
        icon: <Layers size={16} />,
        items: [
          {
            path: "/bundle-registration",
            pageId: "bundle-registration",
            title: t("home.bundle_registration")
          },
          { path: "/washing", pageId: "washing", title: t("home.washing") },
          { path: "/opa", pageId: "opa", title: t("home.opa") },
          { path: "/ironing", pageId: "ironing", title: t("home.ironing") },
          {
            path: "/qc2-inspection",
            pageId: "qc2-inspection",
            title: t("home.qc2_inspection")
          },
          {
            path: "/qc2-repair-tracking",
            pageId: "qc2-inspection",
            title: "Defect Tracking"
          },
          { path: "/packing", pageId: "packing", title: t("home.packing") },
          {
            path: "/b-grade-defect",
            pageId: "qc2-inspection",
            title: "B-Grade Defects"
          },
          {
            path: "/b-grade-stcok",
            pageId: "qc2-inspection",
            title: "B-Grade Stock"
          }
        ]
      },
      {
        id: "fabric-cutting",
        title: "F & C",
        icon: <Scissors size={16} />,
        items: [
          { path: "/Fabric", roles: ["Fabric"], title: t("home.fabric") },
          { path: "/cutting", roles: ["Cutting"], title: t("home.cutting") },
          { path: "/scc", roles: ["SCC"], title: t("SCC") }
        ]
      },
      {
        id: "sewing-qc",
        title: "Sewing",
        icon: <CheckSquare size={16} />,
        items: [
          { path: "/roving", roles: ["QC Roving"], title: "QC Inline Roving" },
          {
            path: "/details",
            roles: ["QC1 Inspection"],
            title: t("home.qc1_inspection")
          },
          { path: "/inline-emp", roles: ["Printing"], title: "Print QR" }
        ]
      },
      {
        id: "qa-inspection",
        title: "QA",
        icon: <Shield size={16} />,
        items: [
          { path: "/audit", roles: ["QA Audit"], title: "Audit" },
          {
            path: "/final-inspection",
            roles: ["QA Audit"],
            title: "Final Inspection"
          }
        ]
      },
      {
        id: "admin-panel",
        title: "Admin",
        icon: <TerminalSquare size={16} />,
        items: [
          {
            path: "/ieadmin",
            roles: ["IE", "System Administration"],
            title: t("home.ieadmin")
          },
          {
            path: "/sysadmin",
            roles: ["System Administration"],
            title: t("home.systemadmin")
          },
          { path: "/yqms", roles: ["YQMS"], title: t("home.yqms") },
          {
            path: "/role-management",
            roles: ["Admin", "Super Admin"],
            title: "Role Management"
          },
          {
            path: "/user-list",
            roles: ["Admin", "Super Admin"],
            title: "User Management"
          }
        ]
      },
      {
        id: "analytics",
        title: "Analytics",
        icon: <BarChart3 size={16} />,
        items: [
          {
            path: "/download-data",
            roles: ["Download Data"],
            title: t("home.download_data")
          },
          {
            path: "/live-dashboard",
            roles: ["Live Dashboard"],
            title: t("home.live_dashboard")
          },
          { path: "/powerbi", roles: ["Power BI"], title: "Power BI" },
          { path: "/qa-pivot", roles: ["QA Pivot"], title: "QA Evaluation" },
          { path: "/qc1-sunrise", roles: ["QC1 Sunrise"], title: "QC1 Sunrise" }
        ]
      },
      {
        id: "settings",
        title: "Settings",
        icon: <Settings size={16} />,
        roles: ["Admin", "Super Admin"], // The whole section is visible to Admins
        items: [
          // This item is ONLY visible to specific Super Admins
          {
            path: "/super-admin-assign",
            title: "Super Admin Assign",
            requiredEmpIds: ["YM6702", "YM7903"],
            icon: <UserPlus size={16} />
          }
          // will add more general settings links here that all admins can see
          // e.g., { path: "/general-settings", title: "General Settings" },
        ]
      }
    ],
    [t]
  );

  // All access control logic from Home.jsx, adapted for Navbar
  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [roleManagementRes, userRolesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/role-management`),
        axios.get(`${API_BASE_URL}/api/user-roles/${user.emp_id}`)
      ]);
      setRoleManagement(roleManagementRes.data);
      setUserRoles(userRolesRes.data.roles);

      const pageIdsToCheck = [
        ...new Set(
          navStructure
            .flatMap((s) => s.items)
            .filter((item) => item.pageId)
            .map((item) => item.pageId)
        )
      ];
      const accessPromises = pageIdsToCheck.map((pageId) =>
        axios.get(
          `${API_BASE_URL}/api/ie/role-management/access-check?emp_id=${user.emp_id}&page=${pageId}`
        )
      );
      const results = await Promise.all(accessPromises);
      const newAccessMap = {};
      results.forEach((res, index) => {
        newAccessMap[pageIdsToCheck[index]] = res.data.hasAccess;
      });
      setAccessMap(newAccessMap);
    } catch (error) {
      console.error("Error fetching Navbar permissions:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Updated hasAccess to handle requiredEmpIds on individual items
  const hasAccess = useCallback(
    (item) => {
      if (!user) return false;

      // Check if access is restricted by employee ID first
      if (item.requiredEmpIds) {
        return item.requiredEmpIds.includes(user.emp_id);
      }

      // Fallback to role-based access
      const isSuperAdmin = userRoles.includes("Super Admin");
      const isAdmin = userRoles.includes("Admin");
      if (isSuperAdmin || isAdmin) return true;

      if (item.pageId) return accessMap[item.pageId] === true;

      if (item.roles && roleManagement && user.job_title) {
        return roleManagement.some(
          (role) =>
            item.roles.includes(role.role) &&
            role.jobTitles.includes(user.job_title)
        );
      }
      return false;
    },
    [user, userRoles, roleManagement, accessMap]
  );

  // Filter the entire nav structure based on access
  const accessibleNav = useMemo(() => {
    if (!userRoles || !user) return [];
    return navStructure
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => hasAccess(item))
      }))
      .filter((section) => hasAccess(section) || section.items.length > 0);
  }, [navStructure, hasAccess, userRoles, user]);

  const handleSignOut = () => {
    clearUser();
    onLogout();
    navigate("/", { replace: true });
  };
  const toggleDropdown = (sectionId) =>
    setIsMenuOpen((prev) => (prev === sectionId ? null : sectionId));
  const closeAllDropdowns = () => {
    setIsMenuOpen(null);
    setIsProfileOpen(false);
  };
  const handleMobileSectionClick = (sectionId) =>
    setMobileExpandedSection((prev) => (prev === sectionId ? null : sectionId));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      )
        setIsProfileOpen(false);
      if (navRef.current && !navRef.current.contains(event.target))
        setIsMenuOpen(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-md fixed top-0 left-0 right-0 z-50 transition-colors">
        <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center flex-1 min-w-0">
              {/* Fix: Replace the previous logo block with this single Link component */}
              <Link
                to="/home"
                className="
                  flex-shrink-0 rounded-lg px-4 py-1
                  text-xl font-bold
                  transition-all duration-300 ease-in-out
                  bg-transparent text-blue-600 dark:text-blue-400
                  hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500
                  hover:text-white dark:hover:text-slate-900
                "
              >
                YQMS
              </Link>

              {/* --- DESKTOP NAVIGATION FIX --- */}
              <div className="hidden md:flex items-center ml-4" ref={navRef}>
                <div className="flex items-center space-x-1">
                  {accessibleNav.map((section) => (
                    <div key={section.id} className="relative">
                      <button
                        onClick={() => toggleDropdown(section.id)}
                        className="flex items-center px-3 py-2 text-sm font-semibold rounded-md text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
                      >
                        {React.cloneElement(section.icon, {
                          className: "mr-2"
                        })}{" "}
                        {section.title}{" "}
                        <ChevronDown
                          className={`w-4 h-4 ml-1 transition-transform ${
                            isMenuOpen === section.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isMenuOpen === section.id && (
                        <div className="absolute left-0 mt-2 w-56 origin-top-left rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black dark:ring-slate-700 ring-opacity-5 focus:outline-none py-1">
                          {section.items.map((item) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={closeAllDropdowns}
                              className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                              {item.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Right Side: Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <LanguageSwitcher />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>
              {user && (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileOpen((p) => !p)}
                    className="flex items-center space-x-2"
                  >
                    <img
                      src={user.face_photo || "/default-avatar.png"}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="hidden lg:inline text-sm font-medium text-slate-700 dark:text-slate-200">
                      {user.name}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        isProfileOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black dark:ring-slate-700 ring-opacity-5 focus:outline-none py-1">
                      <Link
                        to="/profile"
                        onClick={closeAllDropdowns}
                        className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 rounded-md text-slate-600 dark:text-slate-300"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- REDESIGNED MOBILE MENU --- */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
        <div
          className={`relative w-full max-w-xs ml-auto h-full bg-white dark:bg-slate-900 flex flex-col transition-transform transform ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">
              Menu
            </h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-md text-slate-600 dark:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {accessibleNav.map((section) => (
                <div key={`mobile-${section.id}`} className="px-2">
                  <button
                    onClick={() => handleMobileSectionClick(section.id)}
                    className="flex items-center justify-between w-full p-2 text-base font-semibold text-slate-700 dark:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <span className="flex items-center">
                      {React.cloneElement(section.icon, { className: "mr-3" })}{" "}
                      {section.title}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        mobileExpandedSection === section.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {mobileExpandedSection === section.id && (
                    <div className="pl-4 mt-1 space-y-1">
                      {section.items.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center w-full p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
