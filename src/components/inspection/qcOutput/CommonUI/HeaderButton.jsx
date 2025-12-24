import React from "react";

const HeaderButton = ({ label, icon: Icon, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 w-28 h-20 rounded-xl transition-all duration-300 transform hover:-translate-y-1 ${
        active
          ? "bg-white/30 backdrop-blur-lg shadow-xl"
          : "bg-white/10 hover:bg-white/20"
      }`}
    >
      <Icon className="w-6 h-6 text-white" />
      <span className="text-xs font-bold text-white tracking-wide">
        {label}
      </span>
    </button>
  );
};

export default HeaderButton;
