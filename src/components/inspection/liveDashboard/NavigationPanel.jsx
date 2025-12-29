import {
  BarChart,
  Box,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Home,
  Menu,
  Package,
  Search,
  Shirt,
  TrendingUp,
  X,
  Activity,
  Settings,
  User
} from "lucide-react";
import React, { useState, useEffect } from "react";

const NavigationPanel = ({
  isOpen,
  toggleNav,
  setActiveSection,
  activeSection
}) => {
  const [expandedMenus, setExpandedMenus] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    { 
      name: "Home", 
      icon: <Home size={18} />, 
      subMenus: [],
      color: "from-blue-500 to-blue-600",
      description: "Dashboard overview"
    },
    {
      name: "QC Inline Roving",
      icon: <Search size={16} />,
      color: "from-green-500 to-green-600",
      description: "Quality control roving",
      subMenus: [
        { name: "Roving Report", icon: <BarChart size={16} />, description: "View roving reports" },
        { name: "Roving Trend", icon: <TrendingUp size={16} />, description: "Analyze roving trends" }
      ]
    },
    {
      name: "Cutting",
      icon: <Search size={16} />,
      color: "from-purple-500 to-purple-600",
      description: "Cutting operations",
      subMenus: [
        { name: "Cutting Dashboard", icon: <BarChart size={16} />, description: "Real-time cutting data" },
        { name: "Cutting Reports", icon: <BarChart size={16} />, description: "Detailed cutting reports" },
        { name: "Cutting Trend", icon: <TrendingUp size={16} />, description: "Cutting performance trends" }
      ]
    },
    {
      name: "Digital Measurement",
      icon: <Shirt size={16} />,
      color: "from-indigo-500 to-indigo-600",
      description: "Digital measurement tools",
      subMenus: [
        { name: "Buyer Specs", icon: <BarChart size={16} />, description: "Buyer specifications" },
        { name: "Measurement Summary", icon: <TrendingUp size={16} />, description: "Measurement overview" },
        { name: "Measurement Summary - CPK", icon: <TrendingUp size={16} />, description: "CPK analysis" }
      ]
    },
    {
      name: "QC 1 Dashboard",
      icon: <BarChart size={16} />,
      color: "from-teal-500 to-teal-600",
      description: "Quality control stage 1",
      subMenus: [
        { name: "Daily Analysis", icon: <BarChart size={16} />, description: "Daily QC analysis" },
        { name: "Daily Trend", icon: <TrendingUp size={16} />, description: "Daily performance trends" },
        { name: "Monthly Trend", icon: <TrendingUp size={16} />, description: "Monthly analysis" },
        { name: "Yearly Trend", icon: <TrendingUp size={16} />, description: "Yearly overview" }
      ]
    },
    { 
      name: "Order Data", 
      icon: <Package size={18} />, 
      subMenus: [],
      color: "from-orange-500 to-orange-600",
      description: "Order management"
    },
    { 
      name: "Washing", 
      icon: <Shirt size={18} />, 
      subMenus: [],
      color: "from-cyan-500 to-cyan-600",
      description: "Washing operations"
    },
    { 
      name: "Ironing", 
      icon: <Shirt size={18} />, 
      subMenus: [],
      color: "from-pink-500 to-pink-600",
      description: "Ironing operations"
    },
    { 
      name: "OPA", 
      icon: <Eye size={18} />, 
      subMenus: [],
      color: "from-amber-500 to-amber-600",
      description: "OPA operations"
    },
    {
      name: "QC2",
      icon: <BarChart size={18} />,
      color: "from-red-500 to-red-600",
      description: "Quality control stage 2",
      subMenus: [
        { name: "Live Dashboard", icon: <Activity size={16} />, description: "Real-time QC2 data" },
        { name: "MO Analysis", icon: <Clock size={16} />, description: "Manufacturing order analysis" },
        { name: "Line Hr Trend", icon: <TrendingUp size={16} />, description: "Hourly line trends" },
        { name: "Daily Summary", icon: <Calendar size={16} />, description: "Daily performance summary" },
        { name: "Weekly Analysis", icon: <FileText size={16} />, description: "Weekly analysis reports" },
        { name: "Monthly Analysis", icon: <FileText size={16} />, description: "Monthly analysis reports" }
      ]
    },
    { 
      name: "Packing", 
      icon: <Box size={18} />, 
      subMenus: [],
      color: "from-emerald-500 to-emerald-600",
      description: "Packing operations"
    }
  ];

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  // Filter menu items based on search term
  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subMenus.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Close navigation on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        toggleNav();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, toggleNav]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={toggleNav}
        />
      )}

      {/* Navigation Panel */}
      <div
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl transition-all duration-300 ease-in-out z-40 ${
          isOpen ? "w-80" : "w-0"
        } overflow-hidden border-r border-gray-700`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 pt-20 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Activity size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-wide text-white">
                    Dashboard
                  </h2>
                  <p className="text-xs text-gray-300">Quality Control System</p>
                </div>
              </div>
              
              <button
                onClick={toggleNav}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <div className="p-4">
              <ul className="space-y-2">
                {filteredMenuItems.map((item) => (
                  <li key={item.name}>
                    <div
                      className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                        activeSection === item.name && item.subMenus.length === 0
                          ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                          : "hover:bg-gray-700 text-gray-200 hover:shadow-md"
                      }`}
                      onClick={() => {
                        if (item.subMenus.length > 0) {
                          toggleMenu(item.name);
                        } else {
                          setActiveSection(item.name);
                        }
                      }}
                      onMouseEnter={() => setHoveredItem(item.name)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg transition-all duration-200 ${
                          activeSection === item.name && item.subMenus.length === 0
                            ? "bg-white bg-opacity-20"
                            : `bg-gradient-to-r ${item.color} bg-opacity-20 group-hover:bg-opacity-30`
                        }`}>
                          {item.icon}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{item.name}</span>
                          {hoveredItem === item.name && (
                            <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {item.subMenus.length > 0 && (
                        <div className={`p-1 rounded-lg transition-all duration-200 ${
                          expandedMenus[item.name] ? "bg-white bg-opacity-20 rotate-180" : "group-hover:bg-gray-600"
                        }`}>
                          <ChevronDown size={16} className="text-gray-300" />
                        </div>
                      )}

                      {/* Notification Badge (example) */}
                      {item.name === "QC2" && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                    </div>

                    {/* Submenu */}
                    {expandedMenus[item.name] && item.subMenus.length > 0 && (
                      <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-600 pl-4">
                        {item.subMenus.map((subMenu) => (
                          <div
                            key={subMenu.name}
                            className={`group flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.01] ${
                              activeSection === subMenu.name
                                ? `bg-gradient-to-r ${item.color} text-white shadow-md`
                                : "hover:bg-gray-700 text-gray-300"
                            }`}
                            onClick={() => setActiveSection(subMenu.name)}
                            onMouseEnter={() => setHoveredItem(subMenu.name)}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            <div className={`p-1.5 rounded-md mr-3 transition-all duration-200 ${
                              activeSection === subMenu.name
                                ? "bg-white bg-opacity-20"
                                : `bg-gradient-to-r ${item.color} bg-opacity-20 group-hover:bg-opacity-30`
                            }`}>
                              {subMenu.icon}
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium">{subMenu.name}</span>
                              {hoveredItem === subMenu.name && subMenu.description && (
                                <p className="text-xs text-gray-400 mt-1">{subMenu.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {filteredMenuItems.length === 0 && (
                <div className="text-center py-8">
                  <Search size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No menu items found</p>
                  <p className="text-sm text-gray-500">Try a different search term</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Admin User</p>
                  <p className="text-xs text-gray-400">Quality Manager</p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200">
                <Settings size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={toggleNav}
          className="fixed left-4 z-50 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 hover:rotate-3"
          style={{ top: "80px" }}
        >
          <Menu size={24} />
        </button>
      )}
    </>
  );
};

export default NavigationPanel;
