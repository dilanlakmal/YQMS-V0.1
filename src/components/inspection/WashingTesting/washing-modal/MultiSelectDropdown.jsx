import React from "react";

/**
 * Reusable multi-select checkbox dropdown.
 * Used for Color, PO, and Ex Fty Date fields in EditReportModal.
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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          title={Array.isArray(selected) && selected.length > 0 ? selected.join(", ") : summaryText}
        >
          <span className="truncate block">{summaryText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${containerClass}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => onToggle(!isOpen)}
          disabled={options.length === 0}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="truncate">{summaryText}</span>
          <svg
            className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && options.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {/* Select All / Clear All */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <button
                type="button"
                onClick={() => onChange([...options])}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => onChange([])}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="p-2">
              {options.map((item, index) => (
                <label
                  key={index}
                  className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(item)}
                    onChange={(e) =>
                      onChange(
                        e.target.checked
                          ? [...selected, item]
                          : selected.filter((v) => v !== item)
                      )
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelectDropdown;
