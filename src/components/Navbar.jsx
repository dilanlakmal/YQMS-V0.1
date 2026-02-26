import axios from "axios";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./authentication/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { API_BASE_URL } from "../../config";
import LanguageSwitcher from "../components/layout/LangSwitch";

import NormalNotifications from "./NormalNotifications";
import SpecialNotifications from "./SpecialNotifications";

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
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  X,
  TerminalSquare,
  UserPlus,
  Home,
  FlaskConical,
  Package,
  Factory,
  Droplets,
  QrCode,
  Sparkles,
  FileCheck,
  Cog,
  TrendingUp,
  Wrench,
} from "lucide-react";

// Custom hook for screen size detection
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return "mobile";
      if (window.innerWidth < 1024) return "tablet";
      return "desktop";
    }
    return "desktop";
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setScreenSize("mobile");
      } else if (window.innerWidth < 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
};

export default function Navbar({ onLogout }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const screenSize = useScreenSize();

  const isMobile = screenSize === "mobile";
  const isTablet = screenSize === "tablet";
  const isDesktop = screenSize === "desktop";

  const [isMenuOpen, setIsMenuOpen] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileSection, setExpandedMobileSection] = useState(null);

  const [roleManagement, setRoleManagement] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [accessMap, setAccessMap] = useState({});

  const profileMenuRef = useRef(null);
  const adminMenuRef = useRef(null);
  const navRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const navScrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const [dropdownPosition, setDropdownPosition] = useState({ left: 0 });

  // Navigation sections with items matching Home.jsx (excluding admin-panel)
  const navSections = useMemo(
    () => [
      {
        id: "development",
        title: "Development",
        icon: <FlaskConical size={16} />,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
        items: [
          {
            path: "/Development",
            roles: ["Development"],
            title: "Development",
          },
        ],
      },
      {
        id: "material",
        title: "Material",
        icon: <Package size={16} />,
        color: "text-teal-600 dark:text-teal-400",
        bgColor: "bg-teal-100 dark:bg-teal-900/30",
        items: [
          {
            path: "/Fabric",
            roles: ["Fabric"],
            title: t("home.fabric"),
          },
          {
            path: "/Accessories",
            roles: ["Accessories"],
            title: t("home.accessories"),
          },
        ],
      },
      {
        id: "cut-panel",
        title: "Cut Panel",
        icon: <Scissors size={16} />,
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
        items: [
          {
            path: "/cutting",
            roles: ["Cutting"],
            title: t("home.cutting"),
          },
          {
            path: "/cutting-inline",
            roles: ["Cutting"],
            title: t("home.cutting-inline"),
          },
          {
            path: "/scc",
            roles: ["SCC"],
            title: t("SCC"),
          },
        ],
      },
      {
        id: "production",
        title: "Production",
        icon: <Factory size={16} />,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        items: [
          {
            path: "/roving",
            roles: ["QC Roving"],
            title: "QC Inline Roving",
          },
          {
            path: "/details",
            roles: ["QC1 Inspection"],
            title: t("home.qc1_inspection"),
          },
          {
            path: "/sub-con-qc1",
            roles: ["QC1 Sub Con"],
            title: t("home.qc1_subcon_inspection"),
          },
          {
            path: "/qc-accuracy",
            roles: ["QA"],
            title: "QA Random Inspection",
          },
          {
            path: "/qc-output",
            roles: ["QA"],
            title: "QC Output",
          },
        ],
      },
      {
        id: "washing",
        title: "Washing",
        icon: <Droplets size={16} />,
        color: "text-cyan-600 dark:text-cyan-400",
        bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
        items: [
          {
            path: "/qcWashing",
            roles: ["QC Washing"],
            title: t("home.qcWashing"),
          },
          {
            path: "/select-dt-specs",
            roles: ["Washing Clerk", "QA Clerk"],
            title: t("home.select_dt_specs"),
          },
        ],
      },
      {
        id: "qrcode-system",
        title: "QR Code",
        icon: <QrCode size={16} />,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        items: [
          {
            path: "/bundle-registration",
            pageId: "bundle-registration",
            title: t("home.bundle_registration"),
          },
          {
            path: "/washing",
            pageId: "washing",
            title: t("home.washing"),
          },
          {
            path: "/opa",
            pageId: "opa",
            title: t("home.opa"),
          },
          {
            path: "/ironing",
            pageId: "ironing",
            title: t("home.ironing"),
          },
          {
            path: "/afterIroning",
            roles: ["QC Ironing"],
            title: t("home.afterIroning"),
          },
          {
            path: "/qc2-inspection",
            pageId: "qc2-inspection",
            title: t("home.qc2_inspection"),
          },
          {
            path: "/qc2-repair-tracking",
            pageId: "qc2-inspection",
            title: "Defect Tracking",
          },
          {
            path: "/packing",
            pageId: "packing",
            title: t("home.packing"),
          },
          {
            path: "/b-grade-defect",
            pageId: "qc2-inspection",
            title: "B-Grade Defects",
          },
          {
            path: "/b-grade-stcok",
            pageId: "qc2-inspection",
            title: "B-Grade Stock",
          },
        ],
      },
      {
        id: "finishing",
        title: "Finishing",
        icon: <Sparkles size={16} />,
        color: "text-pink-600 dark:text-pink-400",
        bgColor: "bg-pink-100 dark:bg-pink-900/30",
        items: [
          {
            path: "/anf-washing",
            roles: ["ANF QA"],
            title: t("home.anf_washing"),
          },
          {
            path: "/afterIroning",
            roles: ["QC Ironing"],
            title: t("home.afterIroning"),
          },
          {
            path: "/humidity-report",
            roles: ["Humidity QC"],
            title: "Humidity Report",
          },
          {
            path: "/supplier-issues",
            roles: ["Supplier QC"],
            title: t("home.supplier-issues"),
          },
        ],
      },
      {
        id: "y-pivot",
        title: "Fincheck",
        icon: <FileCheck size={16} />,
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
        items: [
          {
            path: "/qa-sections",
            roles: ["Fincheck Config"],
            title: t("home.qa_sections"),
          },
          {
            path: "/qa-measurements",
            roles: ["Fincheck Measurement"],
            title: t("home.qa_measurements"),
          },
          {
            path: "/qa-templates",
            roles: ["Fincheck Templates"],
            title: t("home.qa_templates"),
          },
          {
            path: "/fincheck-inspection",
            roles: ["Fincheck Inspections"],
            title: t("home.y_pivot_inspection"),
          },
          {
            path: "/fincheck-reports",
            roles: ["Fincheck Reports"],
            title: t("home.y_pivot_report"),
          },
          {
            path: "/P88Legacy",
            roles: ["P88"],
            title: t("home.p88_Legacy"),
          },
        ],
      },
      {
        id: "process",
        title: "Process",
        icon: <Shield size={16} />,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-100 dark:bg-amber-900/30",
        items: [
          {
            path: "/audit",
            roles: ["QA Audit"],
            title: "QMS Audit",
          },
          {
            path: "/training",
            roles: ["System Administration"],
            title: "YQMS Training",
          },
          {
            path: "/exam",
            roles: ["System Administration"],
            title: "YQMS Exam",
          },
          {
            path: "/packing-list",
            roles: ["QA Clerk"],
            title: "Upload Packing List",
          },
        ],
      },
      {
        id: "analytics",
        title: "Analytics",
        icon: <TrendingUp size={16} />,
        color: "text-rose-600 dark:text-rose-400",
        bgColor: "bg-rose-100 dark:bg-rose-900/30",
        items: [
          {
            path: "/live-dashboard",
            roles: ["Live Dashboard"],
            title: t("home.live_dashboard"),
          },
          {
            path: "/powerbi",
            roles: ["Power BI"],
            title: "Power BI",
          },
        ],
      },
    ],
    [t],
  );

  // Admin menu items - ONLY shown in Menu dropdown
  const adminMenuItems = useMemo(
    () => [
      // Primary Admin Items
      {
        path: "/ieadmin",
        roles: ["IE", "System Administration"],
        title: "IE Administration",
        icon: <TerminalSquare size={16} />,
      },
      {
        path: "/sysadmin",
        roles: ["System Administration"],
        title: "System Administration",
        icon: <Settings size={16} />,
      },
      {
        path: "/user-list",
        roles: ["Admin", "Super Admin"],
        title: "User Management",
        icon: <User size={16} />,
      },
      {
        path: "/role-management",
        roles: ["Admin", "Super Admin"],
        title: "Role Management",
        icon: <Shield size={16} />,
      },
      // Supporting Configuration - Add separator flag
      {
        isSeparator: true,
        title: "Supporting Tools",
        icon: <Wrench size={14} />, // Icon for the header
      },
      {
        path: "/qc2-upload-data",
        roles: ["Washing Clerk"],
        title: t("home.qc2_upload_data"),
        icon: <BarChart3 size={16} />,
      },
      {
        path: "/qc2-washing-upload",
        roles: ["Washing Clerk"],
        title: t("home.qc2_washing_data"),
        icon: <BarChart3 size={16} />,
      },
      {
        path: "/yqms",
        roles: ["YQMS"],
        title: t("home.yqms"),
        icon: <Layers size={16} />,
      },
      {
        path: "/inline-emp",
        roles: ["Printing"],
        title: "Print QR",
        icon: <QrCode size={16} />,
      },
      {
        path: "/super-admin-assign",
        title: "Super Admin Assign",
        requiredEmpIds: ["TL04", "TL09"],
        icon: <UserPlus size={16} />,
      },
    ],
    [t],
  );

  // Fetch roles and access data
  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [roleManagementRes, userRolesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/role-management`),
        axios.get(`${API_BASE_URL}/api/user-roles/${user.emp_id}`),
      ]);
      setRoleManagement(roleManagementRes.data);
      setUserRoles(userRolesRes.data.roles);

      // Get all pageIds from navSections
      const pageIdsToCheck = [
        ...new Set(
          navSections
            .flatMap((s) => s.items)
            .filter((item) => item.pageId)
            .map((item) => item.pageId),
        ),
      ];

      if (pageIdsToCheck.length > 0) {
        const accessPromises = pageIdsToCheck.map((pageId) =>
          axios.get(
            `${API_BASE_URL}/api/ie/role-management/access-check?emp_id=${user.emp_id}&page=${pageId}`,
          ),
        );
        const results = await Promise.all(accessPromises);
        const newAccessMap = {};
        results.forEach((res, index) => {
          newAccessMap[pageIdsToCheck[index]] = res.data.hasAccess;
        });
        setAccessMap(newAccessMap);
      }
    } catch (error) {
      console.error("Error fetching Navbar permissions:", error);
    }
  }, [user, navSections]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Access control function
  const hasAccess = useCallback(
    (item) => {
      if (!user) return false;

      if (item.requiredEmpIds) {
        return item.requiredEmpIds.includes(user.emp_id);
      }

      const isSuperAdmin = userRoles.includes("Super Admin");
      const isAdmin = userRoles.includes("Admin");
      if (isSuperAdmin || isAdmin) return true;

      if (item.pageId) return accessMap[item.pageId] === true;

      if (item.roles && roleManagement && user.job_title) {
        return roleManagement.some(
          (role) =>
            item.roles.includes(role.role) &&
            role.jobTitles.includes(user.job_title),
        );
      }
      return false;
    },
    [user, userRoles, roleManagement, accessMap],
  );

  // Filter navigation sections based on access
  const accessibleNavSections = useMemo(() => {
    if (!userRoles || !user) return [];
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => hasAccess(item)),
      }))
      .filter((section) => section.items.length > 0);
  }, [navSections, hasAccess, userRoles, user]);

  // Filter admin menu items based on access
  const accessibleAdminItems = useMemo(() => {
    if (!userRoles || !user) return [];
    return adminMenuItems.filter((item) => item.isSeparator || hasAccess(item));
  }, [adminMenuItems, hasAccess, userRoles, user]);

  // Check if user has access to admin menu
  const hasAdminAccess = accessibleAdminItems.length > 0;

  const handleSignOut = () => {
    clearUser();
    onLogout();
    navigate("/", { replace: true });
  };

  const toggleDropdown = (sectionId) => {
    if (isMenuOpen === sectionId) {
      setIsMenuOpen(null);
    } else {
      // Calculate button position
      const buttonElement = navScrollRef.current?.querySelector(
        `[data-section-id="${sectionId}"]`,
      );
      if (buttonElement && navRef.current) {
        const buttonRect = buttonElement.getBoundingClientRect();
        const navRect = navRef.current.getBoundingClientRect();
        setDropdownPosition({
          left: buttonRect.left - navRect.left,
        });
      }
      setIsMenuOpen(sectionId);
    }
  };

  const closeAllDropdowns = () => {
    setIsMenuOpen(null);
    setIsProfileOpen(false);
    setIsAdminMenuOpen(false);
    setIsMobileMenuOpen(false);
    setExpandedMobileSection(null);
  };

  // Handle navigation to a page
  const handleNavigate = (path) => {
    closeAllDropdowns();
    navigate(path);
  };

  // Check scroll position for arrows
  const checkScrollArrows = useCallback(() => {
    if (navScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navScrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  // Scroll navigation left/right
  const scrollNav = (direction) => {
    if (navScrollRef.current) {
      const scrollAmount = 200;
      navScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Check arrows on mount and resize
  useEffect(() => {
    checkScrollArrows();
    window.addEventListener("resize", checkScrollArrows);
    return () => window.removeEventListener("resize", checkScrollArrows);
  }, [checkScrollArrows, accessibleNavSections]);

  // Click outside handler - FIXED VERSION
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close dropdown if clicking on a dropdown trigger button
      if (event.target.closest("button")) {
        return;
      }

      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
      if (
        adminMenuRef.current &&
        !adminMenuRef.current.contains(event.target)
      ) {
        setIsAdminMenuOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsMenuOpen(null);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest("[data-mobile-menu-trigger]")
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- MOBILE & TABLET NAVBAR ---
  if (isMobile || isTablet) {
    return (
      <>
        <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-sm fixed top-0 left-0 right-0 z-50 transition-colors">
          <div className="px-3 sm:px-4">
            <div className="flex justify-between h-12 items-center">
              {/* Left Side: Menu Button & YQMS Logo */}
              <div className="flex items-center gap-2">
                {/* Mobile Menu Button */}
                <button
                  data-mobile-menu-trigger
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isMobileMenuOpen
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>

                {/* YQMS Logo - Text Only with Golden Orange Hover */}
                <Link
                  to="/home"
                  className="flex-shrink-0 rounded-lg px-3 py-1 text-base font-bold tracking-wide transition-all duration-300 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-amber-400 hover:via-orange-500 hover:to-amber-500 hover:text-white hover:shadow-lg hover:shadow-orange-500/25"
                  style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
                >
                  YQMS
                </Link>
              </div>

              {/* Right Side: Actions */}
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                {/* Language Switcher - Compact */}
                <div className="scale-75 sm:scale-90 origin-right">
                  <LanguageSwitcher />
                </div>

                {/* Notifications */}
                {user && (
                  <>
                    <div className="scale-90">
                      <SpecialNotifications />
                    </div>
                    <div className="scale-90">
                      <NormalNotifications />
                    </div>
                  </>
                )}

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
                >
                  {theme === "light" ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                </button>

                {/* User Profile */}
                {user && (
                  <div className="relative" ref={profileMenuRef}>
                    <button
                      onClick={() => {
                        setIsProfileOpen((p) => !p);
                        setIsAdminMenuOpen(false);
                      }}
                      className="flex items-center"
                    >
                      <img
                        src={user.face_photo || "/default-avatar.png"}
                        alt={user.name}
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border-2 border-gray-200 dark:border-slate-700"
                      />
                    </button>
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black dark:ring-slate-700 ring-opacity-5 py-1 z-50">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user.emp_id}
                          </p>
                        </div>
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
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Slide-out Menu */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Slide-out Panel */}
            <div
              ref={mobileMenuRef}
              className="fixed top-12 left-0 bottom-0 w-80 bg-white dark:bg-slate-900 z-50 shadow-xl overflow-y-auto transition-transform"
            >
              {/* User Info Header */}
              {user && (
                <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.face_photo || "/default-avatar.png"}
                      alt={user.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-white/30"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-white/70 truncate">
                        {user.job_title || "Employee"} • {user.emp_id}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Home Link */}
              <div className="p-2 border-b border-gray-100 dark:border-slate-800">
                <Link
                  to="/home"
                  onClick={closeAllDropdowns}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Home className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="font-medium">Home Dashboard</span>
                </Link>
              </div>

              {/* Section Navigation with Expandable Sub-items */}
              <div className="p-2">
                <p className="px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Modules
                </p>
                <div className="space-y-1">
                  {accessibleNavSections.map((section) => (
                    <div key={section.id}>
                      {/* Section Header */}
                      <button
                        onClick={() =>
                          setExpandedMobileSection(
                            expandedMobileSection === section.id
                              ? null
                              : section.id,
                          )
                        }
                        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all ${
                          expandedMobileSection === section.id
                            ? `${section.bgColor} ${section.color}`
                            : "text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg ${
                              expandedMobileSection === section.id
                                ? "bg-white/50 dark:bg-black/20"
                                : "bg-gray-100 dark:bg-slate-800"
                            }`}
                          >
                            {React.cloneElement(section.icon, {
                              className: `w-4 h-4 ${
                                expandedMobileSection === section.id
                                  ? section.color
                                  : "text-slate-500 dark:text-slate-400"
                              }`,
                            })}
                          </div>
                          <span className="text-sm font-medium">
                            {section.title}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedMobileSection === section.id
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </button>

                      {/* Sub-items */}
                      {expandedMobileSection === section.id && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                          {section.items.map((item) => (
                            <button
                              key={item.path}
                              onClick={() => handleNavigate(item.path)}
                              className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                              {item.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Section - Under Menu */}
              {hasAdminAccess && (
                <div className="p-2 border-t border-gray-100 dark:border-slate-800">
                  <p className="px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Administration
                  </p>
                  <div className="space-y-1">
                    {accessibleAdminItems.map((item) =>
                      item.isSeparator ? (
                        <div key={item.title} className="mt-3 mb-2">
                          <div className="flex items-center gap-3 px-4">
                            <div className="h-px flex-1 bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 dark:from-amber-600 dark:via-orange-500 dark:to-amber-600" />
                          </div>
                          <div className="px-4 py-2 mt-1">
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                              {item.title}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={closeAllDropdowns}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          {item.icon && (
                            <span className="mr-3 text-slate-400 dark:text-slate-500">
                              {item.icon}
                            </span>
                          )}
                          {item.title}
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Sign Out Button */}
              <div className="p-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  // --- DESKTOP NAVBAR ---
  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm fixed top-0 left-0 right-0 z-50 transition-colors border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="w-full mx-auto px-4 lg:px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Left Side: Logo & Section Navigation */}
          <div className="flex items-center flex-1 min-w-0">
            {/* YQMS Logo - Text Only with Golden Orange Hover */}
            <Link
              to="/home"
              className="flex-shrink-0 rounded-xl px-4 py-2 text-xl font-bold tracking-wide transition-all duration-300 ease-in-out text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-amber-400 hover:via-orange-500 hover:to-amber-500 hover:text-white hover:shadow-lg hover:shadow-orange-500/25"
              style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
            >
              YQMS
            </Link>

            {/* Divider */}
            <div className="hidden lg:block w-px h-8 bg-slate-200 dark:bg-slate-700 mx-4" />

            {/* Section Navigation Dropdowns */}
            <div
              className="hidden lg:flex items-center flex-1 min-w-0 relative"
              ref={navRef}
            >
              {/* Left Arrow */}
              {showLeftArrow && (
                <button
                  onClick={() => scrollNav("left")}
                  className="absolute left-0 z-10 p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Scrollable Navigation Container */}
              <div
                ref={navScrollRef}
                onScroll={checkScrollArrows}
                className={`flex items-center space-x-1 overflow-x-auto scrollbar-hide scroll-smooth ${
                  showLeftArrow ? "ml-8" : ""
                } ${showRightArrow ? "mr-8" : ""}`}
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {accessibleNavSections.map((section) => (
                  <div key={section.id} className="relative flex-shrink-0">
                    <button
                      data-section-id={section.id}
                      onClick={() => toggleDropdown(section.id)}
                      className={`flex items-center px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        isMenuOpen === section.id
                          ? `${section.bgColor} ${section.color}`
                          : "text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      {React.cloneElement(section.icon, {
                        className: "mr-2",
                      })}
                      {section.title}
                      <ChevronDown
                        className={`w-4 h-4 ml-1 transition-transform ${
                          isMenuOpen === section.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* Dropdown Menu - Rendered Outside Scrollable Container */}
              {accessibleNavSections.map((section) => {
                if (isMenuOpen !== section.id) return null;
                return (
                  <div
                    key={`dropdown-${section.id}`}
                    className="absolute top-full mt-2 w-56 rounded-xl shadow-xl bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-slate-700 py-2 z-50"
                    style={{
                      left: `${dropdownPosition.left}px`,
                    }}
                  >
                    {section.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={closeAllDropdowns}
                        className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                );
              })}

              {/* Right Arrow */}
              {showRightArrow && (
                <button
                  onClick={() => scrollNav("right")}
                  className="absolute right-0 z-10 p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            <LanguageSwitcher />

            {/* Notifications */}
            {user && (
              <>
                <SpecialNotifications />
                <NormalNotifications />
              </>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

            {/* User Profile */}
            {user && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => {
                    setIsProfileOpen((p) => !p);
                    setIsAdminMenuOpen(false);
                  }}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <img
                    src={user.face_photo || "/default-avatar.png"}
                    alt={user.name}
                    className="h-8 w-8 rounded-lg object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                  />
                  <div className="hidden xl:block text-left">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[100px]">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {user.emp_id}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-slate-700 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {user.job_title || "Employee"}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={closeAllDropdowns}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <User className="w-4 h-4 mr-3 text-slate-400" />
                      View Profile
                    </Link>
                    <Link
                      to="/home"
                      onClick={closeAllDropdowns}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Home className="w-4 h-4 mr-3 text-slate-400" />
                      Go to Home
                    </Link>
                    <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Admin Menu (Menu Icon) - Only show if user has admin access */}
            {user && hasAdminAccess && (
              <div className="relative" ref={adminMenuRef}>
                <button
                  onClick={() => {
                    setIsAdminMenuOpen((p) => !p);
                    setIsProfileOpen(false);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isAdminMenuOpen
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                  title="Admin Panel"
                >
                  <Menu className="w-5 h-5" />
                </button>
                {isAdminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl shadow-xl bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-slate-700 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-t-xl">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                          <Cog className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                            Admin Panel
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            System Configuration
                          </p>
                        </div>
                      </div>
                    </div>
                    {accessibleAdminItems.map((item, index) => {
                      // --- START MODIFICATION ---
                      if (item.isSeparator) {
                        return (
                          <div
                            key={`sep-${index}`}
                            className="px-4 py-2 mt-2 mb-1"
                          >
                            {/* Horizontal Line */}
                            <div className="h-px w-full bg-slate-200 dark:bg-slate-700 mb-2" />

                            {/* Header with Icon and Color */}
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
                              {item.icon}
                              <span>{item.title}</span>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={closeAllDropdowns}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          {item.icon && (
                            <span className="mr-3 text-slate-400 dark:text-slate-500">
                              {item.icon}
                            </span>
                          )}
                          {item.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
