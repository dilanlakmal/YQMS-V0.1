// src/components/inspection/NavigationPanel.jsx
import React, { useState } from "react";
import { Menu, ChevronLeft, ChevronDown, ChevronRight } from "lucide-react";

const NavigationPanel = ({
  isOpen,
  toggleNav,
  setActiveSection,
  activeSection
}) => {
  const [expandedMenus, setExpandedMenus] = useState({});

  const menuItems = [
    { name: "Order Data", subMenus: [] },
    { name: "Washing", subMenus: [] },
    { name: "Ironing", subMenus: [] },
    { name: "OPA", subMenus: [] },
    {
      name: "QC2",
      subMenus: [
        "Live Dashboard",
        "MO Hr Trend",
        "Line Hr Trend",
        "Daily Summary",
        "Weekly Analysis",
        "Monthly Analysis"
      ]
    },
    { name: "Packing", subMenus: [] }
  ];

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleNav}
        className="fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all"
      >
        {isOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
      </button>

      {/* Navigation Panel */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white shadow-xl transition-all duration-300 ease-in-out z-40 ${
          isOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        <div className="p-4">
          <h2 className="text-xl font-bold mb-6 mt-12">Dashboard Menu</h2>
          <ul>
            {menuItems.map((item) => (
              <li key={item.name} className="mb-2">
                <div
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    if (item.subMenus.length > 0) {
                      toggleMenu(item.name);
                    } else {
                      setActiveSection(item.name);
                    }
                  }}
                >
                  <span>{item.name}</span>
                  {item.subMenus.length > 0 && (
                    <span>
                      {expandedMenus[item.name] ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                    </span>
                  )}
                </div>
                {expandedMenus[item.name] && item.subMenus.length > 0 && (
                  <ul className="ml-4 mt-1">
                    {item.subMenus.map((subMenu) => (
                      <li
                        key={subMenu}
                        className={`p-2 rounded-lg hover:bg-gray-600 cursor-pointer ${
                          activeSection === subMenu ? "bg-gray-600" : ""
                        }`}
                        onClick={() => setActiveSection(subMenu)}
                      >
                        {subMenu}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default NavigationPanel;
