// Helper function to sanitize input for filenames and URLs
export const sanitize = (input) => {
  if (typeof input !== "string") input = String(input);
  let sane = input.replace(/[^a-zA-Z0-9-._]/g, "_");
  if (sane === "." || sane === "..") return "_";
  return sane;
};

// New cleanup function that accepts all characters and symbols
// and properly handles URL encoding for cross-platform compatibility
export const cleanup = (input) => {
  if (typeof input !== "string") input = String(input);

  // For URL parameters, we need to handle special characters properly
  // This ensures compatibility between Windows and Ubuntu servers
  return input
    .trim()                    // Remove leading/trailing whitespace
    .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
    .replace(/\/+/g, '/')      // Replace multiple slashes with single slash
    .replace(/\\+/g, '\\')    // Replace multiple backslashes with single backslash
    .replace(/:/g, ':')        // Keep colons as-is
    .replace(/%/g, '%');       // Keep percent signs as-is
};
