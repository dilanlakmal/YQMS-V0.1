export const reactSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: "0.75rem",
    border: "2px solid",
    borderColor: state.isFocused ? "#6366f1" : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
    padding: "0.25rem",
    backgroundColor: "var(--color-bg-secondary)",
    "&:hover": {
      borderColor: "#6366f1"
    }
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.75rem",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    zIndex: 50
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#6366f1"
      : state.isFocused
      ? "#eef2ff"
      : "transparent",
    color: state.isSelected ? "#ffffff" : "#1f2937",
    "&:hover": {
      backgroundColor: state.isSelected ? "#6366f1" : "#eef2ff"
    }
  })
};
