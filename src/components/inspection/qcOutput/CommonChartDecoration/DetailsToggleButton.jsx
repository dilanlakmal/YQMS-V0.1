import React from "react";
import { Eye, EyeOff } from "lucide-react";

const DetailsToggleButton = ({ showDetails, onToggle }) => {
  const baseClasses =
    "flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200";
  const variantClasses = showDetails
    ? "bg-white/20 text-white hover:bg-white/30"
    : "bg-white/10 text-indigo-200 hover:bg-white/20";

  return (
    <button onClick={onToggle} className={`${baseClasses} ${variantClasses}`}>
      {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
      <span>{showDetails ? "Hide Details" : "Show Details"}</span>
    </button>
  );
};

export default DetailsToggleButton;
