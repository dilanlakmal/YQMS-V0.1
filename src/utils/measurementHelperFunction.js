// Helper function to sanitize input for filenames and URLs
export const sanitize = (input) => {
  if (typeof input !== "string") input = String(input);
  let sane = input.replace(/[^a-zA-Z0-9-._]/g, "_");
  if (sane === "." || sane === "..") return "_";
  return sane;
};

// New cleanup function that accepts all characters and symbols
export const cleanup = (input) => {
  if (typeof input !== "string") input = String(input);
  return input;
};
