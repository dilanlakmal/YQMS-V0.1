/**
 * Week utility functions for handling weekly data operations
 */

// Gets the ISO week number for a given date (Monday = start of week)
export const getWeekNumber = (date) => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

// Gets the Monday of the week for a given date
export const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// Gets the Sunday of the week for a given date
export const getEndOfWeek = (date) => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

// Creates a user-friendly week label, e.g., "W45: Nov 04 - Nov 10"
export const formatWeekLabel = (startDate, endDate) => {
  const weekNum = getWeekNumber(startDate);
  const formatShort = (d) => {
    const month = d.toLocaleString("en", { month: "short" });
    const day = String(d.getDate()).padStart(2, "0");
    return `${month} ${day}`;
  };
  return `W${weekNum}: ${formatShort(startDate)} - ${formatShort(endDate)}`;
};
