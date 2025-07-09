// src/components/inspection/cutting/CuttingDashboardCard.jsx
import React from "react";
import { useTheme } from "../../context/ThemeContext";

// --- MODIFICATION 1: UPDATE THE HELPER FUNCTION ---
// We need to add a 'card' background color property to our special palettes.
const getCardStyles = (rule, value, theme) => {
  const palettes = {
    green:
      theme === "dark"
        ? {
            card: "bg-green-900/40", // Added this line
            icon: "bg-green-500/30",
            text: "text-green-300"
          }
        : {
            card: "bg-green-50", // Added this line
            icon: "bg-green-100",
            text: "text-green-600"
          },
    red:
      theme === "dark"
        ? {
            card: "bg-red-900/40", // Added this line
            icon: "bg-red-500/30",
            text: "text-red-300"
          }
        : {
            card: "bg-red-50", // Added this line
            icon: "bg-red-100",
            text: "text-red-600"
          },
    // The default palette does NOT get a 'card' property. This is intentional.
    default:
      theme === "dark"
        ? { icon: "bg-gray-700", text: "text-blue-400" }
        : { icon: "bg-blue-100", text: "text-blue-600" }
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
              card: "bg-orange-900/40", // Added this line
              icon: "bg-orange-500/30",
              text: "text-orange-300"
            }
          : {
              card: "bg-orange-50", // Added this line
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
// --- END OF MODIFICATION 1 ---

const StatMiniCard = ({
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
      : value || (typeof value === "number" ? "0" : "N/A");

  const styles = getCardStyles(colorRule, value, theme);

  return (
    // --- MODIFICATION 2: APPLY THE CONDITIONAL BACKGROUND ---
    // The background color is now determined by the color rule.
    // If a special rule is active (styles.card exists), we use it.
    // Otherwise, we fall back to the standard gray background.
    <div
      className={`p-3 rounded-lg flex items-start space-x-3 h-24 ${
        styles.card
          ? styles.card
          : theme === "dark"
          ? "bg-gray-700/50"
          : "bg-gray-50"
      }`}
    >
      {/* --- END OF MODIFICATION 2 --- */}

      {/* Icon with its colored background - a slight top margin for better vertical alignment */}
      <div
        className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full mt-1 ${styles.icon}`}
      >
        <span className={styles.text}>
          {React.cloneElement(icon, { size: 18 })}
        </span>
      </div>

      {/* The rest of the component remains the same */}
      <div className="flex-1 min-w-0 flex flex-col h-full justify-between">
        <h4
          className={`text-[10px] font-semibold uppercase tracking-wider leading-tight ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {title}
        </h4>
        <p
          className={`text-lg font-bold ${
            theme === "dark" ? "text-gray-100" : "text-gray-800"
          }`}
          title={formattedValue}
        >
          {formattedValue}
          {unit && <span className="text-sm ml-1 font-medium">{unit}</span>}
        </p>
      </div>
    </div>
  );
};

const CuttingDashboardCard = ({ title, stats = [] }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`rounded-xl shadow-lg p-4 flex flex-col h-full ${
        theme === "dark" ? "bg-[#1f2937]" : "bg-white"
      }`}
    >
      <h3
        className={`text-base font-bold mb-3 ${
          theme === "dark" ? "text-gray-200" : "text-gray-900"
        }`}
      >
        {title}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.length > 0 ? (
          stats.map((stat) =>
            stat ? <StatMiniCard key={stat.title} {...stat} /> : null
          )
        ) : (
          <p
            className={`col-span-full text-center py-8 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            No data available.
          </p>
        )}
      </div>
    </div>
  );
};

export default CuttingDashboardCard;
