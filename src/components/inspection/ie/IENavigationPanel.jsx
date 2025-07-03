import React, { useState } from "react";
import {
  ChevronDown,
  BarChart3,
  Users,
  Database,
  FileText,
  WashingMachine,
  CheckSquare,
  Flame,
  ShieldCheck,
  Package,
  Wrench,
  AlertTriangle,
  Menu,
  Sun,
  Moon,
  Shield
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIETheme } from "./IEThemeContext";

// Helper NavLink component (no changes needed)
const NavLink = ({ icon, label, isActive, onClick, isNavOpen }) => (
  <button
    onClick={onClick}
    title={!isNavOpen ? label : ""}
    className={`w-full flex items-center h-11 px-4 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-indigo-400 ${
      isActive
        ? "bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-indigo-300"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white"
    } ${isNavOpen ? "justify-start" : "justify-center"}`}
  >
    {React.cloneElement(icon, { className: "h-5 w-5 flex-shrink-0" })}
    <span
      className={`flex-grow text-left ml-3 transition-opacity duration-200 whitespace-nowrap ${
        isNavOpen ? "opacity-100" : "opacity-0 sr-only"
      }`}
    >
      {label}
    </span>
  </button>
);

// Helper SubNavLink component (no changes needed)
const SubNavLink = ({ icon, label, isActive, onClick, isNavOpen }) => (
  <button
    onClick={onClick}
    title={!isNavOpen ? label : ""}
    className={`w-full flex items-center h-9 pr-4 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-800 focus:ring-indigo-400 ${
      isActive
        ? "text-indigo-600 dark:text-indigo-400"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-gray-200"
    } ${isNavOpen ? "pl-11" : "justify-center pl-4"}`}
  >
    {React.cloneElement(icon, {
      className: `h-4 w-4 flex-shrink-0 ${isNavOpen ? "mr-3" : "mr-0"}`
    })}
    <span
      className={`flex-grow text-left transition-opacity duration-200 whitespace-nowrap ${
        isNavOpen ? "opacity-100" : "opacity-0 sr-only"
      }`}
    >
      {label}
    </span>
  </button>
);

const IENavigationPanel = ({
  isNavOpen,
  setIsNavOpen,
  activeSection,
  setActiveSection
}) => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useIETheme();
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(true);

  const handleNavClick = (section) => {
    setActiveSection(section);
    if (window.innerWidth < 1024) {
      setIsNavOpen(false);
    }
  };

  const dataSubMenuItems = [
    {
      key: "Bundle Generation",
      label: t("ie.nav.data.bundle", "Bundle Generation"),
      icon: <Package />
    },
    {
      key: "Washing",
      label: t("ie.nav.data.washing", "Washing"),
      icon: <WashingMachine />
    },
    { key: "OPA", label: t("ie.nav.data.opa", "OPA"), icon: <CheckSquare /> },
    {
      key: "Ironing",
      label: t("ie.nav.data.ironing", "Ironing"),
      icon: <Flame />
    },
    {
      key: "QC2 Inspection",
      label: t("ie.nav.data.qc2", "QC2 Inspection"),
      icon: <ShieldCheck />
    },
    {
      key: "Packing",
      label: t("ie.nav.data.packing", "Packing"),
      icon: <Package />
    },
    {
      key: "Rework Tracing",
      label: t("ie.nav.data.rework", "Rework Tracing"),
      icon: <Wrench />
    },
    {
      key: "B Grade Stock",
      label: t("ie.nav.data.b_grade", "B-Grade Stock"),
      icon: <AlertTriangle />
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isNavOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 lg:hidden"
          onClick={() => setIsNavOpen(false)}
        ></div>
      )}

      {/* Main sidebar container */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 z-40 transition-all duration-300 ease-in-out flex flex-col lg:relative ${
          isNavOpen ? "w-64" : "w-20"
        } ${
          isNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header with Toggle Button */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
            title={
              isNavOpen
                ? t("ie.nav.collapse", "Collapse Menu")
                : t("ie.nav.expand", "Expand Menu")
            }
          >
            <Menu className="h-6 w-6" />
          </button>
          {/* The trick for hiding the text is to wrap it */}
          <div
            className={`flex items-center space-x-2 ml-2 overflow-hidden transition-all duration-200 ${
              isNavOpen ? "max-w-xs" : "max-w-0"
            }`}
          >
            <img src="/assets/Home/ie.png" alt="IE Logo" className="h-8 w-8" />
            <span className="text-lg font-bold text-gray-800 dark:text-white whitespace-nowrap">
              {t("ie.nav.title", "Dashboard")}
            </span>
          </div>
        </div>

        {/* Navigation Links - This section will scroll if content is too long */}
        <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
          <NavLink
            icon={<FileText />}
            label={t("ie.nav.task_no", "Task No")}
            isActive={activeSection === "Task No"}
            onClick={() => handleNavClick("Task No")}
            isNavOpen={isNavOpen}
          />
          <NavLink
            icon={<Users />}
            label={t("ie.nav.worker_assignment", "Worker Assignment")}
            isActive={activeSection === "Worker Assignment"}
            onClick={() => handleNavClick("Worker Assignment")}
            isNavOpen={isNavOpen}
          />

          <NavLink
            icon={<Users />}
            label={t("ie.nav.bulk_assignment", "Bulk Assignment")}
            isActive={activeSection === "Bulk Assignment"}
            onClick={() => handleNavClick("Bulk Assignment")}
            isNavOpen={isNavOpen}
          />
          <NavLink
            icon={<Shield />}
            label={t("ie.nav.role_management", "Role Management")}
            isActive={activeSection === "Role Management"}
            onClick={() => handleNavClick("Role Management")}
            isNavOpen={isNavOpen}
          />

          <div>
            <button
              onClick={() => {
                if (isNavOpen) setIsDataMenuOpen(!isDataMenuOpen);
                else setIsNavOpen(true);
              }}
              className={`w-full flex items-center h-11 px-4 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-indigo-400 ${
                isNavOpen ? "justify-between" : "justify-center"
              }`}
            >
              <div className="flex items-center">
                <Database className="h-5 w-5" />
                <span
                  className={`ml-3 transition-opacity duration-200 whitespace-nowrap ${
                    isNavOpen ? "opacity-100" : "opacity-0 sr-only"
                  }`}
                >
                  {t("ie.nav.data.title", "Data")}
                </span>
              </div>
              {isNavOpen && (
                <ChevronDown
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isDataMenuOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {/* Submenu with slide-down transition */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isDataMenuOpen && isNavOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="mt-2 space-y-1">
                  {dataSubMenuItems.map((item) => (
                    <SubNavLink
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      isActive={activeSection === item.key}
                      onClick={() => handleNavClick(item.key)}
                      isNavOpen={isNavOpen}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Footer with Theme Toggle */}
        <div className="p-2 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
          <button
            onClick={toggleTheme}
            title={t("ie.nav.toggle_theme", "Toggle Theme")}
            className="w-full flex items-center h-11 px-4 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-indigo-400"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span
              className={`ml-3 transition-opacity duration-200 whitespace-nowrap ${
                isNavOpen ? "opacity-100" : "opacity-0 sr-only"
              }`}
            >
              {theme === "light"
                ? t("ie.nav.dark_mode", "Dark Mode")
                : t("ie.nav.light_mode", "Light Mode")}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default IENavigationPanel;
