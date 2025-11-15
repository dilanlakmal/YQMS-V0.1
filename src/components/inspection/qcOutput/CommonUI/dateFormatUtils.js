/**
 * Formats a JavaScript Date object into a "YYYY-MM-DD" string for API calls.
 * Returns null if the input date is falsy.
 * @param {Date | null | undefined} date - The date object to format.
 * @returns {string | null} The formatted date string or null.
 */
export const formatDateForAPI = (date) => {
  if (!date) return null;

  const year = date.getFullYear();
  // String.prototype.padStart() is used to ensure month and day are two digits
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
