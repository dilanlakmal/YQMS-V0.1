import React from "react";
import { Minus } from "lucide-react";

const DefectBox = ({ defect, count, onIncrement, onDecrement }) => {
  const hasDefects = count > 0;
  const borderColor = hasDefects
    ? "border-red-500"
    : "border-gray-300 dark:border-gray-600";

  return (
    <div
      onClick={onIncrement}
      className={`relative p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 ${borderColor} cursor-pointer group transition-all duration-200 hover:shadow-md hover:border-indigo-500`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-full">
          {defect.no}
        </span>
        {hasDefects && (
          <span className="text-xl font-bold text-red-500 dark:text-red-400">
            {count}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 text-center min-h-[40px] flex items-center justify-center">
        {defect.defectNameEng}
      </p>
      {hasDefects && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDecrement();
          }}
          className="absolute bottom-1 left-1 p-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Minus size={12} />
        </button>
      )}
    </div>
  );
};

export default DefectBox;
