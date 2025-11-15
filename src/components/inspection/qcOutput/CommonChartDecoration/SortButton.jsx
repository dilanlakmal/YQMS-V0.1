import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const SortButton = ({ sortType, currentSort, order, onSort }) => {
  const isActive = currentSort === sortType;
  const baseClasses =
    "flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105";
  const variantClasses = isActive
    ? "bg-white text-indigo-600 shadow-lg"
    : "bg-white/10 text-white hover:bg-white/20";

  const getSortIcon = () => {
    if (!isActive) return <ArrowUpDown size={16} />;
    return order === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
  };

  const getSortLabel = () => {
    const labels = {
      date: "Date",
      "date-line": "Date-Line",
      "date-mo": "Date-MO",
      defect: "Defect Rate"
    };
    return labels[sortType] || sortType;
  };

  return (
    <button
      onClick={() => onSort(sortType)}
      className={`${baseClasses} ${variantClasses}`}
    >
      {getSortIcon()}
      <span>{getSortLabel()}</span>
      {isActive && (
        <span className="text-xs opacity-75">
          ({order === "asc" ? "ASC" : "DESC"})
        </span>
      )}
    </button>
  );
};

export default SortButton;
