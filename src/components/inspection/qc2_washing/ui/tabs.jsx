import React from "react";

const Tabs = ({ children, value, onValueChange, className = "" }) => {
  return (
    <div className={`tabs ${className}`} data-value={value}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeTab: value, onTabChange: onValueChange })
      )}
    </div>
  );
};

const TabsList = ({ children, className = "", activeTab, onTabChange }) => {
  return (
    <div className={`
      flex space-x-1 rounded-xl 
      bg-gradient-to-r from-blue-50 to-indigo-50 
      dark:from-gray-700 dark:to-gray-800 
      p-1.5 border border-blue-200 dark:border-gray-600
      shadow-sm backdrop-blur-sm
      ${className}
    `}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeTab, onTabChange })
      )}
    </div>
  );
};

const TabsTrigger = ({ value, children, activeTab, onTabChange, className = "" }) => {
  const isActive = activeTab === value;
  
  return (
    <button
      onClick={() => onTabChange(value)}
      className={`
        flex-1 rounded-lg px-4 py-3 text-sm font-semibold 
        transition-all duration-200 ease-in-out
        border border-transparent
        relative overflow-hidden
        group
        ${isActive 
          ? `
            bg-white dark:bg-gray-600 
            text-indigo-700 dark:text-white 
            shadow-lg shadow-indigo-100 dark:shadow-gray-900/50
            border-indigo-200 dark:border-gray-500
            transform scale-[1.02]
          ` 
          : `
            text-gray-600 dark:text-gray-300 
            hover:text-indigo-600 dark:hover:text-white
            hover:bg-white/50 dark:hover:bg-gray-600/50
            hover:shadow-md
            hover:border-indigo-100 dark:hover:border-gray-500
            active:scale-95
          `
        }
        ${className}
      `}
    >
      {/* Background gradient effect for active state */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 dark:from-indigo-400/10 dark:to-blue-400/10" />
      )}
      
      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-blue-500/0 group-hover:from-indigo-500/5 group-hover:to-blue-500/5 dark:group-hover:from-indigo-400/10 dark:group-hover:to-blue-400/10 transition-all duration-200" />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-indigo-500 dark:bg-indigo-400 rounded-full" />
      )}
    </button>
  );
};

const TabsContent = ({ value, children, activeTab, className = "" }) => {
  if (activeTab !== value) return null;
  
  return (
    <div className={`
      tab-content 
      animate-in fade-in-0 slide-in-from-bottom-1 
      duration-300 ease-out
      bg-white dark:bg-gray-800 
      rounded-xl border border-gray-200 dark:border-gray-700
      shadow-sm
      p-6
      ${className}
    `}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
