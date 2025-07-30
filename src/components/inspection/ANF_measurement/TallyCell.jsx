import React from "react";
import { Minus } from "lucide-react";

const TallyCell = ({ count, onIncrement, onDecrement, isOutOfTolerance }) => {
  const bgColor = isOutOfTolerance
    ? "bg-red-100 dark:bg-red-900/50"
    : "bg-green-100 dark:bg-green-900/50";

  return (
    <td
      className={`p-0 text-center relative cursor-pointer group ${bgColor} transition-colors duration-200`}
      onClick={onIncrement}
    >
      <div className="w-full h-full p-2 flex items-center justify-center font-bold text-lg text-gray-800 dark:text-gray-100">
        {count > 0 ? count : ""}
      </div>
      {count > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent the increment event on the parent td
            onDecrement();
          }}
          className="absolute bottom-0 left-0 p-0.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-tr-md opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Decrement"
        >
          <Minus size={12} />
        </button>
      )}
    </td>
  );
};

export default TallyCell;
