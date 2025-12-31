import { API_BASE_URL } from "../../../../config.js";

/**
 * Normalize image URL to ensure it's properly formatted
 */
export const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl) return "";

  // If it's a data URL (base64), return as is
  if (imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  // Extract filename from URL if it's a full URL
  let filename = "";
  if (imageUrl.includes("/washing_machine_test/")) {
    filename = imageUrl.split("/washing_machine_test/")[1];
  } else if (imageUrl.includes("washing-test-")) {
    filename = imageUrl.split("/").pop();
  }

  // If we have a filename, use the API route
  if (filename) {
    return `${API_BASE_URL}/api/report-washing/image/${filename}`;
  }

  // If already a full URL (http/https), return as is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // If it starts with /storage/, add API_BASE_URL
  if (imageUrl.startsWith("/storage/")) {
    return `${API_BASE_URL}${imageUrl}`;
  }

  // If it starts with storage/ (no leading slash), add API_BASE_URL and leading slash
  if (imageUrl.startsWith("storage/")) {
    return `${API_BASE_URL}/${imageUrl}`;
  }

  // If it already includes API_BASE_URL, return as is
  if (imageUrl.includes(API_BASE_URL)) {
    return imageUrl;
  }

  // Default: assume it needs API_BASE_URL prefix
  const cleanPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${API_BASE_URL}${cleanPath}`;
};

/**
 * Extract filename from image URL (without file extension)
 */
export const getImageFilename = (imageUrl) => {
  if (!imageUrl) return "Image";
  
  // Remove query parameters if any
  const urlWithoutQuery = imageUrl.split('?')[0];
  
  // Extract filename from URL
  const urlParts = urlWithoutQuery.split('/');
  let filename = urlParts[urlParts.length - 1];
  
  // If filename is empty or just a path, try to get from the original URL
  if (!filename || filename === urlWithoutQuery) {
    // Try to extract from various URL patterns
    if (urlWithoutQuery.includes('/image/')) {
      filename = urlWithoutQuery.split('/image/')[1] || "Image";
    } else if (urlWithoutQuery.includes('/washing_machine_test/')) {
      filename = urlWithoutQuery.split('/washing_machine_test/')[1] || "Image";
    } else {
      return "Image";
    }
  }
  
  // Remove file extension (everything after the last dot)
  if (filename && filename !== "Image") {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex > 0) {
      filename = filename.substring(0, lastDotIndex);
    }
  }
  
  return filename || "Image";
};

/**
 * Normalize date to YYYY-MM-DD format for date input
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

