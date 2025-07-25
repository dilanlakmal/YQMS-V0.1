import React from "react";

const Tabs = ({ children, value, onValueChange, className = "" }) => {
  return (
    <div className={`tabs ${className}`} data-value={value}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          activeTab: value,
          onTabChange: onValueChange
        })
      )}
    </div>
  );
};

const TabsList = ({ children, className = "", activeTab, onTabChange }) => {
  return (
    <div
      className={`flex space-x-1 rounded-lg bg-blue-100 p-1 border ${className}`}
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeTab, onTabChange })
      )}
    </div>
  );
};

const TabsTrigger = ({
  value,
  children,
  activeTab,
  onTabChange,
  className = ""
}) => {
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => onTabChange(value)}
      className={`
        flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all border
        ${
          isActive
            ? "bg-green-100 text-blue-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900 hover:bg-blue-50"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children, activeTab, className = "" }) => {
  if (activeTab !== value) return null;

  return <div className={`tab-content ${className}`}>{children}</div>;
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
