import React from "react";
import { Plus, Minus } from "lucide-react";

const DefectRow = ({ defect, count, onIncrement, onDecrement, onSetCount }) => {
  return (
    <tr className="border-b dark:border-gray-700">
      <td className="p-2 font-mono text-center w-12">{defect.no}</td>
      <td className="p-2 font-semibold text-gray-800 dark:text-gray-200">
        {defect.defectNameEng}
      </td>
      <td className="p-2 w-48">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onDecrement}
            className="p-2 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900"
          >
            <Minus size={16} />
          </button>
          <input
            type="number"
            value={count > 0 ? count : ""}
            onChange={(e) => onSetCount(Number(e.target.value) || 0)}
            className="w-20 text-center font-bold text-lg p-2 bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 rounded-md"
            placeholder="0"
            inputMode="numeric"
          />
          <button
            onClick={onIncrement}
            className="p-2 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900"
          >
            <Plus size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default DefectRow;
