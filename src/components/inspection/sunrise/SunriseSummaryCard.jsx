import React from "react";
import { FaChartBar, FaList, FaChartLine } from "react-icons/fa";

const SunriseSummaryCard = ({
  title,
  value,
  iconType,
  getDefectRateStyles,
  filteredData, // Added
  filters // Added
}) => {
  // Calculate the filtered DefectsQty based on the selected reworkName
  const calculateFilteredDefectsQty = () => {
    if (!filteredData || !filters) return value; // Fallback to original value if props are missing

    const filteredDefectsQty = filteredData.reduce((sum, row) => {
      const matchingDefects = filters.reworkName
        ? row.DefectDetails.filter(
            (defect) => defect.ReworkName === filters.reworkName
          )
        : row.DefectDetails;
      return (
        sum +
        matchingDefects.reduce(
          (defectSum, defect) => defectSum + defect.DefectsQty,
          0
        )
      );
    }, 0);

    return filteredDefectsQty;
  };

  // Calculate the filtered Defect Rate based on the filtered DefectsQty
  const calculateFilteredDefectRate = () => {
    if (!filteredData || !filters) return value; // Fallback to original value if props are missing

    const totalCheckedQty = filteredData.reduce(
      (sum, row) => sum + row.CheckedQty,
      0
    );
    const filteredDefectsQty = calculateFilteredDefectsQty();

    return totalCheckedQty === 0
      ? 0
      : ((filteredDefectsQty / totalCheckedQty) * 100).toFixed(2);
  };

  // Determine the value to display based on the title
  const displayValue = () => {
    if (title === "Defects Qty") {
      return calculateFilteredDefectsQty();
    } else if (title === "Defect Rate") {
      return calculateFilteredDefectRate();
    }
    return value; // Use the original value for "Checked Qty"
  };

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
          cardStyle: getDefectRateStyles(
            parseFloat(calculateFilteredDefectRate())
          )
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
  const finalValue = displayValue();

  return (
    <div
      className="bg-white p-4 rounded-lg shadow-lg flex items-center transform hover:scale-105 transition duration-300"
      style={cardStyle || {}}
    >
      {icon}
      <div>
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <p className={valueStyle}>
          {title === "Defect Rate" ? `${finalValue}%` : finalValue}
        </p>
      </div>
    </div>
  );
};

export default SunriseSummaryCard;
