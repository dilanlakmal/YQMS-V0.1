/**
 * Date Helper Functions
 * Utilities for date formatting and validation
 */

/**
 * Normalize date to YYYY-MM-DD format for date input
 * @param {string} dateString - Date string to normalize
 * @returns {string} - Normalized date string in YYYY-MM-DD format
 */
export const normalizeDateForInput = (dateString) => {
    if (!dateString) return new Date().toISOString().split("T")[0];

    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }

    // Try to parse the date and convert to YYYY-MM-DD
    try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split("T")[0];
        }
    } catch (error) {
        console.error("Error parsing date:", error);
    }

    // If parsing fails, return today's date
    return new Date().toISOString().split("T")[0];
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} - Current date
 */
export const getCurrentDate = () => {
    return new Date().toISOString().split("T")[0];
};

/**
 * Parse ETD date string to standard format
 * @param {string} etd - ETD date string
 * @returns {string|null} - Normalized date or original if parsing fails
 */
export const parseETDDate = (etd) => {
    if (!etd || etd.trim() === "") return null;

    const etdDate = etd.trim();

    try {
        // Already in correct format
        if (/^\d{4}-\d{2}-\d{2}$/.test(etdDate)) {
            return etdDate;
        }

        // Try to parse and convert
        const parsedDate = new Date(etdDate);
        if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString().split("T")[0];
        }
    } catch (dateError) {
        console.error("Error parsing ETD date:", dateError);
    }

    return etdDate;
};

/**
 * Validate if a string is a valid date
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid date
 */
export const isValidDate = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
};
