import React from "react";
import {
  BarChart3,
  FileText,
  TrendingUp,
  ArrowLeft,
  Scissors,
  ChevronRight,
  Activity
} from "lucide-react";

const cuttingMenuItems = [
  {
    title: "Cutting Dashboard",
    // description: "Real-time cutting performance metrics and analytics",
    icon: <BarChart3 className="w-8 h-8" />,
    image: "assets/Dashboard/CuttingDashboard.png",
    section: "Cutting Dashboard",
    color: "from-blue-500 to-blue-700",
    hoverColor: "from-blue-600 to-blue-800",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400"
  },
  {
    title: "Cutting Reports",
    // description: "Detailed cutting reports and documentation",
    icon: <FileText className="w-8 h-8" />,
    image: "assets/Dashboard/CuttingReport.png",
    section: "Cutting Reports",
    color: "from-green-500 to-green-700",
    hoverColor: "from-green-600 to-green-800",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    iconColor: "text-green-600 dark:text-green-400"
  },
  {
    title: "Cutting Trend",
    // description: "Historical trends and performance analysis",
    icon: <TrendingUp className="w-8 h-8" />,
    image: "assets/Dashboard/CuttingTrend.png",
    section: "Cutting Trend",
    color: "from-purple-500 to-purple-700",
    hoverColor: "from-purple-600 to-purple-800",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    iconColor: "text-purple-600 dark:text-purple-400"
  }
];

const CuttingMenu = ({ setActiveSection }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setActiveSection("Home")}
              className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Back to Home</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Scissors className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Cutting Department
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage cutting operations and analytics
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cuttingMenuItems.map((menu, index) => (
            <div
              key={index}
              onClick={() => setActiveSection(menu.section)}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
                {/* Image Section */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={menu.image}
                    alt={menu.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = `data:image/svg+xml;base64,${btoa(`
                        <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
                          <rect width="100%" height="100%" fill="#f3f4f6"/>
                          <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">
                            ${menu.title}
                          </text>
                        </svg>
                      `)}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  
                  {/* Floating Icon */}
                  <div className="absolute top-4 right-4">
                    <div className={`p-3 ${menu.bgColor} backdrop-blur-sm rounded-xl border border-white/20`}>
                      <div className={menu.iconColor}>
                        {menu.icon}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
                      {menu.title}
                    </h3>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                    {menu.description}
                  </p>

                  {/* Action Button */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${menu.color} group-hover:bg-gradient-to-r group-hover:${menu.hoverColor} text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md group-hover:shadow-lg`}>
                    <span>Open {menu.title.split(' ')[1]}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>

                {/* Hover Border Effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-400 dark:group-hover:border-orange-500 rounded-2xl transition-all duration-300 pointer-events-none"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuttingMenu;
