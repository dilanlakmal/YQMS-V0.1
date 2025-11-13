/**
 * Color utility functions for frontend
 * Handles color name cleaning and URL encoding
 */

/**
 * Safely encode color for URL without modifying the original name
 * @param {string} colorName - The color name to encode
 * @returns {string} - URL-encoded color name
 */
export const encodeColorForUrl = (colorName) => {
  if (!colorName || typeof colorName !== "string") {
    return "";
  }
  return encodeURIComponent(colorName);
};

/**
 * Decode color from URL parameter
 * @param {string} encodedColor - URL-encoded color name
 * @returns {string} - Decoded color name
 */
export const decodeColorFromUrl = (encodedColor) => {
  if (!encodedColor || typeof encodedColor !== "string") {
    return "";
  }

  try {
    return decodeURIComponent(encodedColor);
  } catch (error) {
    console.warn("Failed to decode color from URL:", encodedColor, error);
    return encodedColor;
  }
};
