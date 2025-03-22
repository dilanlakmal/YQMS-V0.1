import React from "react";
import { FaChartBar, FaList, FaChartLine } from "react-icons/fa";

const SunriseSummaryCard = ({
  title,
  value,
  iconType,
  getDefectRateStyles
}) => {
  // Determine the icon and styles based on the title
  const getIconAndStyles = () => {
    switch (title) {
      case "Checked Qty":
        return {
          icon: <FaChartBar className="text-4xl text-blue-500 mr-4" />,
          valueStyle: "text-2xl font-bold text-blue-600"
        };
      case "Defects Qty":
        return {
          icon: <FaList className="text-4xl text-red-500 mr-4" />,
          valueStyle: "text-2xl font-bold text-red-600"
        };
      case "Defect Rate":
        return {
          icon: <FaChartLine className="text-4xl text-green-500 mr-4" />,
          valueStyle: "text-2xl font-bold",
          cardStyle: getDefectRateStyles(parseFloat(value))
        };
      default:
        return {
          icon: null,
          valueStyle: "text-2xl font-bold",
          cardStyle: {}
        };
    }
  };

  const { icon, valueStyle, cardStyle } = getIconAndStyles();

  return (
    <div
      className="bg-white p-4 rounded-lg shadow-lg flex items-center transform hover:scale-105 transition duration-300"
      style={cardStyle || {}}
    >
      {icon}
      <div>
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <p className={valueStyle}>
          {title === "Defect Rate" ? `${value}%` : value}
        </p>
      </div>
    </div>
  );
};

export default SunriseSummaryCard;
