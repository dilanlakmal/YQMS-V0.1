import React from "react";
import {
  Search,
  Package,
  Shirt,
  Eye,
  Box,
  BarChart,
  Clock,
  TrendingUp,
  Calendar,
  FileText
} from "lucide-react";

// Array of tile card data for all main menus and QC2 submenus
const menuItems = [
  {
    title: "QC Roving",
    icon: <Search className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/inlineRoving.png",
    section: "QC Inline Roving"
  },
  {
    title: "Order Data",
    icon: <Package className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/orderData.png",
    section: "Order Data"
  },
  {
    title: "Washing",
    icon: <Shirt className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/washing.png",
    section: "Washing"
  },
  {
    title: "Ironing",
    icon: <Shirt className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/ironing.png",
    section: "Ironing"
  },
  {
    title: "OPA",
    icon: <Eye className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/opa.png",
    section: "OPA"
  },
  {
    title: "QC 2 Live Dashboard",
    icon: <BarChart className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/live.png",
    section: "Live Dashboard"
  },
  {
    title: "QC 2 MO Analysis",
    icon: <Clock className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/styleqc2.png",
    section: "MO Analysis"
  },
  {
    title: "QC 2 Line Hr Trend",
    icon: <TrendingUp className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/lineqc2.png",
    section: "Line Hr Trend"
  },
  {
    title: "QC 2 Daily Summary",
    icon: <Calendar className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/dailyqc2.png",
    section: "Daily Summary"
  },
  {
    title: "QC 2 Weekly Analysis",
    icon: <FileText className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/weeklyqc2.png",
    section: "Weekly Analysis"
  },
  {
    title: "QC 2 Monthly Analysis",
    icon: <FileText className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/monthlyqc2.png",
    section: "Monthly Analysis"
  },
  {
    title: "Packing",
    icon: <Box className="w-6 h-6 text-white" />,
    image: "assets/Dashboard/packing.png",
    section: "Packing"
  }
];

const HomeMenu = ({ setActiveSection }) => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0">
        {menuItems.map((menu, index) => (
          <div
            key={index}
            onClick={() => setActiveSection(menu.section)}
            className="relative group cursor-pointer overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-200"
          >
            {/* Image Section */}
            <div className="relative z-10">
              <img
                src={menu.image}
                alt={menu.title}
                className="w-full h-56 object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>

            {/* Title Section in a Separate Rectangular Div */}
            <div className="absolute bottom-0 left-0 right-0 z-20">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-3 rounded-b-lg shadow-lg flex items-center space-x-2 transform transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-blue-700 group-hover:to-blue-900">
                {menu.icon}
                <h3 className="text-base font-semibold truncate">
                  {menu.title}
                </h3>
              </div>
            </div>

            {/* Hover Effect Border */}
            <div className="absolute inset-0 border-4 border-transparent group-hover:border-blue-500 transition-all duration-300 z-10"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeMenu;
