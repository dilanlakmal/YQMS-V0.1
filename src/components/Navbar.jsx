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
import YQMSAIChatBox from "../pages/YQMSAIChatBox";

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
  UserPlus,
  Bot
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

  const [isChatOpen, setIsChatOpen] = useState(false);

  const navStructure = useMemo(
    () => [
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
          { path: "/scc", roles: ["SCC"], title: t("SCC") },
          {
            path: "/upload-beforewash-specs",
            roles: ["Washing Clerk"],
            title: t("home.upload_beforewash_specs")
          }
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
            path: "/qc-accuracy",
            roles: ["QA"],
            title: "QC Accuracy"
          },
          {
            path: "/qa-yorksys",
            roles: ["QA Clerk"],
            title: "Upload Orders"
          },
          {
            path: "/final-inspection",
            roles: ["QA"],
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
              {/* --- ADD THE AI BOT BUTTON HERE --- */}
              <button
                onClick={() => setIsChatOpen((prev) => !prev)}
                className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors relative"
                aria-label="Open AI Chat"
              >
                <Bot className="w-5 h-5" />
                {/* Optional: Add a notification dot */}
                {/* <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900" /> */}
              </button>
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
      {/* --- RENDER THE CHATBOX CONDITIONALLY --- */}
      {isChatOpen && <YQMSAIChatBox onClose={() => setIsChatOpen(false)} />}
    </>
  );
}
