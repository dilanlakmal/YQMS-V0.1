// import React from "react";
// import {
//   CheckCircle,
//   XCircle,
//   List,
//   Archive,
//   PieChart,
//   TrendingDown
// } from "lucide-react";

// const SummaryCard = ({ title, value, icon }) => {
//   const getIconComponent = () => {
//     switch (icon) {
//       case "checkCircle":
//         return <CheckCircle className="text-green-500 text-xl" />;
//       case "xCircle":
//         return <XCircle className="text-red-500 text-xl" />;
//       case "list":
//         return <List className="text-yellow-500 text-xl" />;
//       case "archive":
//         return <Archive className="text-blue-500 text-xl" />;
//       case "pieChart":
//         return <PieChart className="text-purple-500 text-xl" />;
//       case "trendingDown":
//         return <TrendingDown className="text-orange-500 text-xl" />;
//       default:
//         return null;
//     }
//   };

//   const getBackgroundColor = (title) => {
//     if (title === "Defect Rate") {
//       return value > 3
//         ? "bg-red-200"
//         : value >= 2
//         ? "bg-yellow-200"
//         : "bg-green-200";
//     }
//     if (title === "Defect Ratio") {
//       return value > 3
//         ? "bg-red-300"
//         : value >= 2
//         ? "bg-yellow-300"
//         : "bg-green-300";
//     }
//     return "bg-white";
//   };

//   const getTextColor = (title) => {
//     if (title === "Defect Rate") {
//       return value > 3
//         ? "text-red-800"
//         : value >= 2
//         ? "text-orange-800"
//         : "text-green-800";
//     }
//     if (title === "Defect Ratio") {
//       return value > 3
//         ? "text-red-800"
//         : value >= 2
//         ? "text-orange-800"
//         : "text-green-800";
//     }
//     return "text-gray-900";
//   };

//   return (
//     <div
//       className={`p-6 ${getBackgroundColor(
//         title
//       )} shadow-md rounded-lg flex items-center justify-between`}
//     >
//       <div>
//         <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
//         <p className={`text-2xl font-bold ${getTextColor(title)}`}>
//           {typeof value === "number"
//             ? [
//                 "Checked Qty",
//                 "Total Pass",
//                 "Defects Qty",
//                 "Total Rejects",
//                 "Total Bundles"
//               ].includes(title)
//               ? Math.round(value) // Round to nearest integer
//               : Number(value).toFixed(2) // Keep two decimals for others
//             : value}
//           {title === "Defect Rate" || title === "Defect Ratio" ? "%" : ""}
//         </p>
//       </div>
//       {getIconComponent()}
//     </div>
//   );
// };

// export default SummaryCard;

import React from "react";
import {
  CheckCircle,
  XCircle,
  List,
  Archive,
  PieChart,
  TrendingDown,
  Wrench, // New icon for Repair
  AlertTriangle, // New icon for B-Grade
  Shirt // New icon for Total Garments
} from "lucide-react";

const SummaryCard = ({ title, value, icon }) => {
  const getIconComponent = () => {
    switch (icon) {
      case "shirt":
        return <Shirt className="text-gray-500 text-xl" />;
      case "checkCircle":
        return <CheckCircle className="text-green-500 text-xl" />;
      case "xCircle":
        return <XCircle className="text-red-500 text-xl" />;
      case "wrench": // New case for repair
        return <Wrench className="text-blue-500 text-xl" />;
      case "alertTriangle": // New case for B-Grade
        return <AlertTriangle className="text-orange-500 text-xl" />;
      case "list":
        return <List className="text-yellow-500 text-xl" />;
      case "archive":
        return <Archive className="text-blue-500 text-xl" />;
      case "pieChart":
        return <PieChart className="text-purple-500 text-xl" />;
      case "trendingDown":
        return <TrendingDown className="text-orange-500 text-xl" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = (title) => {
    // Background color logic can be simplified or kept as is
    if (title === "Defect Rate") {
      return value > 3
        ? "bg-red-200"
        : value >= 2
        ? "bg-yellow-200"
        : "bg-green-200";
    }
    if (title === "Defect Ratio") {
      return value > 3
        ? "bg-red-300"
        : value >= 2
        ? "bg-yellow-300"
        : "bg-green-300";
    }
    return "bg-white";
  };

  const getTextColor = (title) => {
    // Text color logic can be simplified or kept as is
    if (title === "Defect Rate" || title === "Defect Ratio") {
      return value > 3
        ? "text-red-800"
        : value >= 2
        ? "text-orange-800"
        : "text-green-800";
    }
    return "text-gray-900";
  };

  const integerFields = [
    "Total Garments",
    "Total Pass",
    "Initial Rejects",
    "Repair Left",
    "B Grade Qty",
    "Defects Qty",
    "Total Bundles"
  ];

  return (
    <div
      className={`p-6 ${getBackgroundColor(
        title
      )} shadow-md rounded-lg flex items-center justify-between`}
    >
      <div>
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        <p className={`text-2xl font-bold ${getTextColor(title)}`}>
          {typeof value === "number"
            ? integerFields.includes(title)
              ? Math.round(value)
              : Number(value).toFixed(2)
            : value}
          {title === "Defect Rate" || title === "Defect Ratio" ? "%" : ""}
        </p>
      </div>
      {getIconComponent()}
    </div>
  );
};

export default SummaryCard;
