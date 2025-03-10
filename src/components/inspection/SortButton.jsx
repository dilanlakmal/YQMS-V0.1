/*

import React, { useState } from "react";
import { ArrowDownAZ, ArrowDownZA } from "lucide-react";

function SortButton({ onSortChange }) {
  const [sortType, setSortType] = useState("none"); // 'none', 'alpha-asc', 'alpha-desc', 'count-desc'

  const handleSortChange = () => {
    const newSortType =
      sortType === "none"
        ? "alpha-asc"
        : sortType === "alpha-asc"
        ? "alpha-desc"
        : sortType === "alpha-desc"
        ? "count-desc"
        : "none";

    setSortType(newSortType);
    onSortChange(newSortType);
  };

  return (
    <button
      onClick={handleSortChange}
      className="px-4 py-0 bg-indigo-100 text-white rounded hover:bg-indigo-400 flex items-center justify-center"
      title={
        sortType === "none"
          ? "Sort A to Z"
          : sortType === "alpha-asc"
          ? "Sort Z to A"
          : sortType === "alpha-desc"
          ? "Sort by Count"
          : "Clear Sort"
      }
    >
      {sortType === "alpha-desc" || sortType === "count-desc" ? (
        <ArrowDownZA size={20} />
      ) : (
        <ArrowDownAZ size={20} />
      )}
    </button>
  );
}
*/
