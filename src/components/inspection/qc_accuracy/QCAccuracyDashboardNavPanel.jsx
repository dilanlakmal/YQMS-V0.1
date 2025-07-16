import React from "react";
import { useTranslation } from "react-i18next";
import { BarChart2, Calendar, Users, Briefcase } from "lucide-react";

const NavLink = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 ${
      active
        ? "bg-indigo-600 text-white"
        : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
    }`}
  >
    {React.cloneElement(icon, { size: 18, className: "mr-3 flex-shrink-0" })}
    <span className="truncate">{label}</span>
  </button>
);

const QCAccuracyDashboardNavPanel = ({ activeView, setActiveView, isOpen }) => {
  const { t } = useTranslation();

  const navItems = [
    { id: "daily", label: "Daily Summary", icon: <Calendar /> },
    { id: "weekly", label: "Weekly Summary", icon: <BarChart2 /> },
    { id: "monthly", label: "Monthly Summary", icon: <Briefcase /> },
    { id: "qa", label: "QA View", icon: <Users /> },
    { id: "qc", label: "QC View", icon: <Users /> }
  ];

  return (
    <nav
      className={`transition-all duration-300 ease-in-out ${
        isOpen ? "w-60 p-4" : "w-0 p-0"
      } overflow-hidden`}
    >
      {isOpen && (
        <div className="space-y-2">
          <h2 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Views
          </h2>
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeView === item.id}
              onClick={() => setActiveView(item.id)}
            />
          ))}
        </div>
      )}
    </nav>
  );
};

export default QCAccuracyDashboardNavPanel;
