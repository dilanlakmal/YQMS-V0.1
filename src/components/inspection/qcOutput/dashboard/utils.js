export const getDefectRateColor = (rate, type = "bg-text") => {
  if (type === "bg-text") {
    if (rate > 5)
      return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300";
    if (rate >= 3)
      return "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300";
    if (rate > 0)
      return "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300";
    return "bg-gray-100 dark:bg-gray-700/50";
  }
  // For Chart.js background color
  if (rate > 5) return "rgba(228, 54, 54, 0.6)"; // red
  if (rate >= 3) return "rgba(249, 115, 22, 0.6)"; // orange
  return "rgba(34, 197, 94, 0.6)"; // green
};
