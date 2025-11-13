/**
 * Color cleanup utility functions for QC Washing API
 * Handles color name sanitization and encoding for URL parameters
 */

/**
 * Create color variations for flexible matching without modifying original
 * @param {string} colorName - The original color name
 * @returns {Array} - Array of color variations to try for matching
 */
export const createColorVariations = (colorName) => {
  if (!colorName || typeof colorName !== 'string') {
    return [];
  }
  
  return [
    colorName,                           // Exact original
    colorName.toLowerCase(),             // Lowercase for case-insensitive matching
    colorName.trim(),                    // Trimmed version
    colorName.trim().toLowerCase()       // Trimmed and lowercase
  ].filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates
};

/**
 * Decode URL-encoded color name back to original format
 * @param {string} encodedColor - URL-encoded color name
 * @returns {string} - Decoded color name
 */
export const decodeColorFromUrl = (encodedColor) => {
  if (!encodedColor || typeof encodedColor !== 'string') {
    return '';
  }
  
  try {
    return decodeURIComponent(encodedColor);
  } catch (error) {
    console.warn('Failed to decode color from URL:', encodedColor, error);
    return encodedColor;
  }
};