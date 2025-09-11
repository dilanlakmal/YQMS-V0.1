import { BarChart2, Calendar, Menu, TrendingUp, X } from "lucide-react";
import React, { useState } from "react";

const SubConQCDashboardNavigationPanel = ({ activeView, setActiveView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: "dailyView", label: "Daily View", icon: <Calendar size={18} /> },
    { id: "weeklyView", label: "Weekly View", icon: <Calendar size={18} /> },
    { id: "monthlyView", label: "Monthly View", icon: <Calendar size={18} /> },
    { id: "dailyTrend", label: "Daily Trend", icon: <TrendingUp size={18} /> },
    {
      id: "weeklyTrend",
      label: "Weekly Trend",
      icon: <TrendingUp size={18} />
    },
    {
      id: "monthlyTrend",
      label: "Monthly Trend",
      icon: <BarChart2 size={18} />
    }
  ];

  const handleNavClick = (viewId) => {
    setActiveView(viewId);
    setIsMenuOpen(false);
  };

  const ActiveLabel =
    menuItems.find((item) => item.id === activeView)?.label || "Dashboard";

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 ml-4">
              Sub-Con QC Dashboard:{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                {ActiveLabel}
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* Slide-out Menu */}
      <div
        className={`absolute top-16 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg h-[calc(100vh-4rem)] transform transition-transform duration-300 ease-in-out z-50 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="py-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left text-sm font-medium transition-colors duration-150 ${
                activeView === item.id
                  ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-r-4 border-indigo-500"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {item.icon &&
                React.cloneElement(item.icon, { className: "mr-3" })}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default SubConQCDashboardNavigationPanel;
