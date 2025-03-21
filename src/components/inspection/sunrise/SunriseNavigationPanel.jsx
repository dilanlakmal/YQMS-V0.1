// import React from "react";
// import {
//   FaCalendarDay,
//   FaCalendarWeek,
//   FaCalendarAlt,
//   FaChartLine
// } from "react-icons/fa";

// const SunriseNavigationPanel = ({
//   isNavOpen,
//   selectedMenu,
//   setSelectedMenu,
//   setIsNavOpen
// }) => {
//   const menuItems = [
//     { name: "Daily Summary", icon: <FaCalendarDay /> },
//     { name: "Weekly Summary", icon: <FaCalendarWeek /> },
//     { name: "Monthly Summary", icon: <FaCalendarAlt /> },
//     { name: "Daily Trend", icon: <FaChartLine /> },
//     { name: "Weekly Trend", icon: <FaChartLine /> },
//     { name: "Monthly Trend", icon: <FaChartLine /> }
//   ];

//   return (
//     isNavOpen && (
//       <div className="fixed top-0 left-0 w-64 h-full bg-gray-800 text-white p-4 shadow-lg">
//         <h2 className="text-xl font-bold mb-4 text-center">Menu</h2>
//         <ul>
//           {menuItems.map((item) => (
//             <li
//               key={item.name}
//               className={`cursor-pointer p-2 flex items-center rounded-md hover:bg-gray-600 transition duration-300 ${
//                 selectedMenu === item.name ? "bg-gray-600" : ""
//               }`}
//               onClick={() => {
//                 setSelectedMenu(item.name);
//                 setIsNavOpen(false);
//               }}
//             >
//               <span className="text-lg mr-2">{item.icon}</span>
//               <span>{item.name}</span>
//             </li>
//           ))}
//         </ul>
//       </div>
//     )
//   );
// };

// export default SunriseNavigationPanel;

// import React from "react";
// import {
//   FaCalendarDay,
//   FaCalendarWeek,
//   FaCalendarAlt,
//   FaChartLine,
// } from "react-icons/fa";

// const SunriseNavigationPanel = ({
//   isNavOpen,
//   selectedMenu,
//   setSelectedMenu,
//   setIsNavOpen
// }) => {
//   const menuItems = [
//     { name: "Daily Summary", icon: <FaCalendarDay /> },
//     { name: "Weekly Summary", icon: <FaCalendarWeek /> },
//     { name: "Monthly Summary", icon: <FaCalendarAlt /> },
//     { name: "Daily Trend", icon: <FaChartLine /> },
//     { name: "Weekly Trend", icon: <FaChartLine /> },
//     { name: "Monthly Trend", icon: <FaChartLine /> }
//   ];

//   return (
//     isNavOpen && (
//       <div className="fixed top-0 left-0 w-72 h-full bg-gradient-to-b from-gray-900 to-gray-700 text-white p-6 shadow-2xl transform transition-transform duration-500 ease-in-out z-50">
//         {/* Header */}
//         <h2 className="text-3xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 tracking-wider">
//           Dashboard Menu
//         </h2>

//         {/* Menu List */}
//         <ul className="space-y-4">
//           {menuItems.map((item) => (
//             <li
//               key={item.name}
//               className={`cursor-pointer flex items-center p-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:bg-gray-800 hover:shadow-md ${
//                 selectedMenu === item.name
//                   ? "bg-gray-800 shadow-md border-l-4 border-blue-500"
//                   : "border-l-4 border-transparent"
//               }`}
//               onClick={() => {
//                 setSelectedMenu(item.name);
//                 setIsNavOpen(false); // Close the panel on selection
//               }}
//             >
//               <span className="text-2xl mr-4 text-blue-300 transition-colors duration-300 hover:text-blue-100">
//                 {item.icon}
//               </span>
//               <span className="text-lg font-medium tracking-wide">
//                 {item.name}
//               </span>
//             </li>
//           ))}
//         </ul>

//         {/* Decorative Element */}
//         <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-green-500 to-transparent" />
//       </div>
//     )
//   );
// };

// export default SunriseNavigationPanel;

import React from "react";
import {
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaChartLine,
  FaArrowLeft // Add this import
} from "react-icons/fa";

const SunriseNavigationPanel = ({
  isNavOpen,
  selectedMenu,
  setSelectedMenu,
  setIsNavOpen
}) => {
  const menuItems = [
    { name: "Daily Summary", icon: <FaCalendarDay /> },
    { name: "Weekly Summary", icon: <FaCalendarWeek /> },
    { name: "Monthly Summary", icon: <FaCalendarAlt /> },
    { name: "Daily Trend", icon: <FaChartLine /> },
    { name: "Weekly Trend", icon: <FaChartLine /> },
    { name: "Monthly Trend", icon: <FaChartLine /> }
  ];

  return (
    isNavOpen && (
      <div className="fixed top-0 left-0 w-72 h-full bg-gradient-to-b from-gray-900 to-gray-700 text-white p-6 shadow-2xl transform transition-transform duration-500 ease-in-out z-50">
        {/* Close Button (Left Arrow) */}
        <button
          onClick={() => setIsNavOpen(false)}
          className="absolute top-4 right-4 text-2xl text-gray-300 hover:text-blue-400 transition duration-300"
        >
          <FaArrowLeft />
        </button>

        {/* Header */}
        <h2 className="text-3xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 tracking-wider">
          Dashboard Menu
        </h2>

        {/* Menu List */}
        <ul className="space-y-4">
          {menuItems.map((item) => (
            <li
              key={item.name}
              className={`cursor-pointer flex items-center p-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:bg-gray-800 hover:shadow-md ${
                selectedMenu === item.name
                  ? "bg-gray-800 shadow-md border-l-4 border-blue-500"
                  : "border-l-4 border-transparent"
              }`}
              onClick={() => {
                setSelectedMenu(item.name);
                setIsNavOpen(false); // Close the panel on selection
              }}
            >
              <span className="text-2xl mr-4 text-blue-300 transition-colors duration-300 hover:text-blue-100">
                {item.icon}
              </span>
              <span className="text-lg font-medium tracking-wide">
                {item.name}
              </span>
            </li>
          ))}
        </ul>

        {/* Decorative Element */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-green-500 to-transparent" />
      </div>
    )
  );
};

export default SunriseNavigationPanel;
