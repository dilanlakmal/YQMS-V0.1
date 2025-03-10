import React from "react";

function AlphabetFilter({ letters, activeFilter, onFilterChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => onFilterChange(null)}
        className={`px-3 py-1 rounded text-sm ${
          activeFilter === null
            ? "bg-indigo-600 text-white"
            : "bg-gray-200 hover:bg-gray-300"
        }`}
      >
        All
      </button>
      {letters.map((letter) => (
        <button
          key={letter}
          onClick={() => onFilterChange(letter)}
          className={`px-3 py-1 rounded text-sm ${
            activeFilter === letter
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}
