import React, { useState } from "react";
import { Check, Search, X } from "lucide-react";

/**
 * Reusable multi-select checkbox dropdown.
 * Used for Color, PO, Ex Fty Date, and Size fields in EditReportModal.
 */
const MultiSelectDropdown = ({
  containerClass,   // e.g. "color-dropdown-container" — used by outside-click handler
  label,            // Field label text
  required,         // Show red asterisk
  options,          // string[]
  selected,         // string[]
  onChange,         // (newSelected: string[]) => void
  isOpen,
  onToggle,
  emptyText,        // Text when options.length === 0
  placeholder,      // Text when nothing selected
  allSelectedText,  // Text when all selected
  countLabel,       // e.g. "color(s)", "PO(s)", "date(s)"
  readOnly,         // When true, show value only — no dropdown, no changes
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const summaryText =
    options.length === 0
      ? emptyText
      : selected.length === 0
        ? placeholder
        : selected.length === options.length
          ? allSelectedText
          : `${selected.length} ${countLabel} selected`;

  if (readOnly) {
    return (
      <div className={`relative ${containerClass}`}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div
          className="w-full min-h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center"
          title={Array.isArray(selected) && selected.length > 0 ? selected.join(", ") : summaryText}
        >
          <span className="truncate block">{summaryText}</span>
        </div>
      </div>
    );
  }

  const filteredOptions = options.filter((opt) =>
    String(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${containerClass}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            onToggle(!isOpen);
            if (!isOpen) setSearchTerm(""); // Clear search when opening
          }}
          disabled={options.length === 0}
          className="w-full min-h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <span className="truncate">{summaryText}</span>
          <svg
            className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* In-flow panel: opens below trigger and pushes content down (aligned pushing behavior) */}
        {isOpen && options.length > 0 && (
          <div className="w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden flex flex-col max-h-80">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 dark:text-white placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>

            {/* Select All / Clear All */}
            <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex gap-2 bg-white dark:bg-gray-800">
              <button
                type="button"
                onClick={() => onChange([...options])}
                className="flex-1 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800/50"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => onChange([])}
                className="flex-1 py-1 text-xs font-semibold bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
              >
                Clear All
              </button>
            </div>

            <div className="p-2 space-y-0.5 overflow-y-auto overflow-x-hidden flex-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((item, index) => {
                  const isSelected = selected.includes(item);
                  return (
                    <label
                      key={index}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors duration-200 ${isSelected
                        ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            onChange(
                              e.target.checked
                                ? [...selected, item]
                                : selected.filter((v) => v !== item)
                            )
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                        />
                        <span className="text-sm font-medium truncate">{item}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                    </label>
                  );
                })
              ) : (
                <div className="p-4 text-center text-sm text-gray-500 italic">
                  No matches found for "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelectDropdown;

