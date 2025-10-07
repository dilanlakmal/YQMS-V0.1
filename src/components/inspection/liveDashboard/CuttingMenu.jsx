import React from "react";
import { BarChart3, FileText, TrendingUp } from "lucide-react";

const cuttingMenuItems = [
  {
    title: "Cutting Dashboard",
    icon: <BarChart3 className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/CuttingDashboard.png",
    section: "Cutting Dashboard"
  },
  {
    title: "Cutting Reports",
    icon: <FileText className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/CuttingReport.png",
    section: "Cutting Reports"
  },
  {
    title: "Cutting Trend",
    icon: <TrendingUp className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/CuttingTrend.png",
    section: "Cutting Trend"
  }
];

const CuttingMenu = ({ setActiveSection }) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => setActiveSection("Home")}
          className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          ← Back to Home
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {cuttingMenuItems.map((menu, index) => (
          <div
            key={index}
            onClick={() => setActiveSection(menu.section)}
            className="relative group cursor-pointer overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-200 rounded-lg"
          >
            {/* Image Section */}
            <div className="relative z-10">
              <img
                src={menu.image}
                alt={menu.title}
                className="w-full h-48 object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>

            {/* Title Section */}
            <div className="absolute bottom-0 left-0 right-0 z-20">
              <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-4 rounded-b-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-orange-700 group-hover:to-orange-900">
                {menu.icon}
                <h3 className="text-lg font-semibold">{menu.title}</h3>
              </div>
            </div>

            {/* Hover Effect Border */}
            <div className="absolute inset-0 border-4 border-transparent group-hover:border-orange-500 transition-all duration-300 z-10 rounded-lg"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CuttingMenu;
