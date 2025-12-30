import React, { useState } from "react";
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
  FileText,
  Scissors,
  Star,
  Zap,
  ArrowRight,
  Activity
} from "lucide-react";

// Enhanced menu items with additional properties
const menuItems = [
  {
    title: "QC Roving",
    // subtitle: "Inline Quality Control",
    icon: <Search className="w-6 h-6" />,
    image: "assets/Dashboard/inlineRoving.png",
    section: "QC Inline Roving",
    category: "Quality Control",
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-500",
    description: "Real-time inline inspection monitoring"
  },
  {
    title: "Order Data",
    // subtitle: "Production Orders",
    icon: <Package className="w-6 h-6" />,
    image: "assets/Dashboard/orderData.png",
    section: "Order Data",
    category: "Management",
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-500",
    description: "Comprehensive order management system"
  },
  {
    title: "Washing",
    // subtitle: "Garment Processing",
    icon: <Shirt className="w-6 h-6" />,
    image: "assets/Dashboard/washing.png",
    section: "Washing",
    category: "Processing",
    color: "from-cyan-500 to-blue-600",
    bgColor: "bg-cyan-500",
    description: "Washing process quality control"
  },
  {
    title: "Ironing",
    // subtitle: "Finishing Process",
    icon: <Shirt className="w-6 h-6" />,
    image: "assets/Dashboard/ironing.png",
    section: "Ironing",
    category: "Processing",
    color: "from-orange-500 to-red-600",
    bgColor: "bg-orange-500",
    description: "Ironing quality assurance"
  },
  {
    title: "OPA",
    // subtitle: "Final Inspection",
    icon: <Eye className="w-6 h-6" />,
    image: "assets/Dashboard/opa.png",
    section: "OPA",
    category: "Quality Control",
    color: "from-purple-500 to-indigo-600",
    bgColor: "bg-purple-500",
    description: "Overall Product Audit system"
  },
  {
    title: "QC 2 Live Dashboard",
    // subtitle: "Real-time Analytics",
    icon: <BarChart className="w-6 h-6" />,
    image: "assets/Dashboard/live.png",
    section: "Live Dashboard",
    category: "Analytics",
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-500",
    description: "Live quality control dashboard",
    featured: true
  },
  {
    title: "QC 2 MO Analysis",
    // subtitle: "Manufacturing Orders",
    icon: <Clock className="w-6 h-6" />,
    image: "assets/Dashboard/styleqc2.png",
    section: "MO Analysis",
    category: "Analytics",
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500",
    description: "Manufacturing order analysis"
  },
  {
    title: "QC 2 Line Hr Trend",
    // subtitle: "Production Lines",
    icon: <TrendingUp className="w-6 h-6" />,
    image: "assets/Dashboard/lineqc2.png",
    section: "Line Hr Trend",
    category: "Analytics",
    color: "from-rose-500 to-pink-600",
    bgColor: "bg-rose-500",
    description: "Hourly line performance trends"
  },
  {
    title: "QC 2 Daily Summary",
    // subtitle: "Daily Reports",
    icon: <Calendar className="w-6 h-6" />,
    image: "assets/Dashboard/dailyqc2.png",
    section: "Daily Summary",
    category: "Reports",
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-500",
    description: "Comprehensive daily summaries"
  },
  {
    title: "QC 2 Weekly Analysis",
    // subtitle: "Weekly Insights",
    icon: <FileText className="w-6 h-6" />,
    image: "assets/Dashboard/weeklyqc2.png",
    section: "Weekly Analysis",
    category: "Reports",
    color: "from-teal-500 to-cyan-600",
    bgColor: "bg-teal-500",
    description: "Weekly performance analysis"
  },
  {
    title: "QC 2 Monthly Analysis",
    // subtitle: "Monthly Trends",
    icon: <FileText className="w-6 h-6" />,
    image: "assets/Dashboard/monthlyqc2.png",
    section: "Monthly Analysis",
    category: "Reports",
    color: "from-indigo-500 to-blue-600",
    bgColor: "bg-indigo-500",
    description: "Monthly trend analysis"
  },
  {
    title: "Packing",
    // subtitle: "Final Packaging",
    icon: <Box className="w-6 h-6" />,
    image: "assets/Dashboard/packing.png",
    section: "Packing",
    category: "Processing",
    color: "from-lime-500 to-green-600",
    bgColor: "bg-lime-500",
    description: "Packaging quality control"
  },
  {
    title: "Cutting",
    // subtitle: "Fabric Cutting",
    icon: <Scissors className="w-6 h-6" />,
    image: "assets/Dashboard/CuttingLive.png",
    section: "Cutting",
    category: "Processing",
    color: "from-red-500 to-rose-600",
    bgColor: "bg-red-500",
    description: "Cutting process monitoring"
  }
];

const HomeMenu = ({ setActiveSection }) => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Get unique categories
  const categories = ["All", ...new Set(menuItems.map(item => item.category))];

  // Filter items based on selected category
  const filteredItems = selectedCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 p-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-5 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-4 gap-4">
          {filteredItems.map((menu, index) => (
            <div
              key={index}
              onClick={() => setActiveSection(menu.section)}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative cursor-pointer transform transition-all duration-500 hover:scale-105"
            >
              {/* Main Card */}
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Featured Badge */}
                {menu.featured && (
                  <div className="absolute top-4 right-4 z-30">
                    <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Featured</span>
                    </div>
                  </div>
                )}

                {/* Image Section */}
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={menu.image}
                    alt={menu.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4 z-20">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30">
                      {menu.category}
                    </span>
                  </div>

                  {/* Hover Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${menu.color} opacity-0 group-hover:opacity-90 transition-opacity duration-500 flex items-center justify-center`}>
                    <div className="text-center text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        {React.cloneElement(menu.icon, { className: "w-8 h-8 text-white" })}
                      </div>
                      <p className="text-sm font-medium px-4">
                        {menu.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                        {menu.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {menu.subtitle}
                      </p>
                    </div>
                    
                    {/* Icon Container */}
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${menu.bgColor} group-hover:scale-110 group-hover:rotate-12 shadow-lg`}>
                      {React.cloneElement(menu.icon, { className: "w-6 h-6 text-white" })}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                      <Zap className="w-4 h-4" />
                      <span className="text-xs font-medium">Quick Access</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <span className="text-sm font-semibold">Open</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Animated Border */}
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-blue-500 transition-all duration-500"></div>
                
                {/* Glow Effect */}
                <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${menu.color} blur-xl -z-10`}></div>
              </div>

              {/* Floating Action Indicator */}
              <div className={`absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 ${
                hoveredCard === index ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}>
                <ArrowRight className="w-3 h-3 text-white" />
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No items found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              No items match the selected category. Try selecting a different category.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto mt-12 text-center">
        <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            All systems operational
          </span>
          <div className="w-1 h-4 bg-gray-300 dark:bg-gray-600"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredItems.length} modules available
          </span>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5); }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default HomeMenu;
