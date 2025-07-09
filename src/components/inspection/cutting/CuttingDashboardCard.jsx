import React from "react";
import { useTheme } from "../../context/ThemeContext";

/**
 * A helper function to determine the card's styling based on rules and values.
 * This keeps the main component's JSX clean.
 */
const getCardStyles = (rule, value, theme) => {
  // Define color palettes
  const palettes = {
    green:
      theme === "dark"
        ? {
            card: "bg-green-900/40",
            icon: "bg-green-500/30",
            text: "text-green-300"
          }
        : { card: "bg-green-50", icon: "bg-green-100", text: "text-green-600" },
    red:
      theme === "dark"
        ? { card: "bg-red-900/40", icon: "bg-red-500/30", text: "text-red-300" }
        : { card: "bg-red-50", icon: "bg-red-100", text: "text-red-600" },
    default:
      theme === "dark"
        ? { card: "bg-gray-800", icon: "bg-gray-700", text: "text-blue-400" }
        : { card: "bg-white", icon: "bg-blue-100", text: "text-blue-600" }
  };

  switch (rule) {
    case "pass":
      return palettes.green;
    case "reject":
      return palettes.red;
    case "passRate":
      if (value >= 98) return palettes.green;
      if (value >= 90) {
        // Orange shades
        return theme === "dark"
          ? {
              card: "bg-orange-900/40",
              icon: "bg-orange-500/30",
              text: "text-orange-300"
            }
          : {
              card: "bg-orange-50",
              icon: "bg-orange-100",
              text: "text-orange-600"
            };
      }
      if (value < 90 && value !== null) return palettes.red;
      return palettes.default;
    default:
      return palettes.default;
  }
};

const CuttingDashboardCard = ({
  icon,
  title,
  value,
  unit = "",
  colorRule = "default"
}) => {
  const { theme } = useTheme();

  const formattedValue =
    typeof value === "number"
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : value || "0";

  // Get the dynamic styles based on the rule and value
  const styles = getCardStyles(colorRule, value, theme);

  return (
    <div
      className={`p-4 rounded-lg shadow-md flex items-center space-x-4 h-24 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${styles.card}`}
    >
      <div className={`p-3 rounded-full ${styles.icon}`}>
        <span className={styles.text}>{icon}</span>
      </div>
      <div className="flex-1">
        <h3
          className={`text-xs font-semibold uppercase tracking-wider ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-2xl font-bold ${
            theme === "dark" ? "text-gray-100" : "text-gray-800"
          }`}
        >
          {formattedValue}
          {unit && <span className="text-lg ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
};

export default CuttingDashboardCard;
