import { getWeek, startOfWeek, endOfWeek, format } from "date-fns";

// Gets the ISO week number for a given date. weekStartsOn: 1 means Monday.
export const getWeekNumber = (date) => {
  return getWeek(date, { weekStartsOn: 1 });
};

// Gets the Monday of the week for a given date.
export const getStartOfWeek = (date) => {
  return startOfWeek(date, { weekStartsOn: 1 });
};

// Gets the Sunday of the week for a given date.
export const getEndOfWeek = (date) => {
  return endOfWeek(date, { weekStartsOn: 1 });
};

// Formats a date into YYYY-MM-DD string.
export const formatDate = (date) => {
  return format(date, "yyyy-MM-dd");
};

// Creates a user-friendly week label, e.g., "W45: Nov 04 - Nov 10"
export const formatWeekLabel = (date) => {
  const weekNum = getWeekNumber(date);
  const monday = getStartOfWeek(date);
  const sunday = getEndOfWeek(date);
  return `W${weekNum}: ${format(monday, "MMM dd")} - ${format(
    sunday,
    "MMM dd"
  )}`;
};
