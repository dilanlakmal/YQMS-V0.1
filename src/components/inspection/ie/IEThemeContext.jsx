import React, { createContext, useState, useContext, useEffect } from "react";

const IEThemeContext = createContext();

export const useIETheme = () => useContext(IEThemeContext);

export const IEThemeProvider = ({ children }) => {
  // Check for saved theme in localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("ie-theme");
    return savedTheme || "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove the opposite class and add the current one
    root.classList.remove(theme === "dark" ? "light" : "dark");
    root.classList.add(theme);
    // Save the theme preference
    localStorage.setItem("ie-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const value = {
    theme,
    toggleTheme
  };

  return (
    <IEThemeContext.Provider value={value}>{children}</IEThemeContext.Provider>
  );
};
