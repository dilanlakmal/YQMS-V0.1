import React from "react";

/**
 * A compact, vertical summary card for displaying key metrics.
 * Used in the left-hand summary column.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.icon - The icon to display.
 * @param {string} props.title - The title of the card.
 * @param {string | number} props.value - The value to display.
 * @param {string} props.colorClass - Tailwind CSS class for the text color of the value and icon.
 * @param {string} props.bgColorClass - Tailwind CSS class for the background color of the card.
 */
export const VerticalSummaryCard = ({
  icon,
  title,
  value,
  colorClass,
  bgColorClass
}) => (
  <div
    className={`p-3 rounded-lg shadow-sm flex flex-col h-full ${bgColorClass}`}
  >
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">
        {title}
      </h4>
      <div className={`text-opacity-80 ${colorClass}`}>{icon}</div>
    </div>
    <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
  </div>
);

/**
 * A dedicated card for a multi-line text input for comments.
 * Includes a character counter.
 * @param {object} props - The component props.
 * @param {string} props.comments - The current value of the comments textarea.
 * @param {(e: React.ChangeEvent<HTMLTextAreaElement>) => void} props.onChange - The function to call when the textarea value changes.
 * @param {number} [props.maxLength=500] - The maximum number of characters allowed.
 */
export const CommentsCard = ({ comments, onChange, maxLength = 500 }) => (
  <div className="p-4 rounded-lg shadow-md flex flex-col bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
    <label
      htmlFor="comments-box"
      className="text-sm font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider mb-2"
    >
      Comments
    </label>
    <textarea
      id="comments-box"
      value={comments}
      onChange={onChange}
      maxLength={maxLength}
      rows={4}
      className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 rounded-md p-2 text-gray-700 dark:text-gray-200 resize-none"
      placeholder="Enter any comments here..."
    />
    <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
      {maxLength - (comments?.length || 0)} characters remaining
    </div>
  </div>
);
