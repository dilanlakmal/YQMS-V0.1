// Utility function to properly encode color parameters for URL compatibility
// This ensures the color parameter works correctly on both Windows and Ubuntu servers

export const encodeColorForUrl = (color) => {
  if (!color || typeof color !== "string") {
    return "";
  }

  // Clean the color string first
  const cleanedColor = color
    .trim() // Remove leading/trailing whitespace
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\/+/g, "/") // Replace multiple slashes with single slash
    .replace(/\\+/g, "\\") // Replace multiple backslashes with single backslash
    .replace(/:/g, ":") // Keep colons as-is
    .replace(/%/g, "%"); // Keep percent signs as-is

  // Use encodeURIComponent for proper URL encoding
  // This handles special characters like spaces, slashes, colons, etc.
  return encodeURIComponent(cleanedColor);
};

// Alternative function for cases where double encoding might be needed
export const doubleEncodeColorForUrl = (color) => {
  const singleEncoded = encodeColorForUrl(color);
  return encodeURIComponent(singleEncoded);
};

// Function to decode color from URL
export const decodeColorFromUrl = (encodedColor) => {
  if (!encodedColor || typeof encodedColor !== "string") {
    return "";
  }

  try {
    return decodeURIComponent(encodedColor);
  } catch (error) {
    console.error("Error decoding color from URL:", error);
    return encodedColor; // Return original if decoding fails
  }
};
