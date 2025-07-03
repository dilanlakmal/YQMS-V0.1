import React, { useState } from "react";
import IENavigationPanel from "../components/inspection/ie/IENavigationPanel";
import { IEThemeProvider } from "../components/inspection/ie/IEThemeContext";
import { useTranslation } from "react-i18next";
import { Menu } from "lucide-react";

// --- STEP 1: Import the new component you want to display ---
import IETaskNoAllocation from "../components/inspection/ie/IETaskNoAllocation";
import IEWorkerAssignment from "../components/inspection/ie/IEWorkerAssignment";
import IEBulkWorkerAssignment from "../components/inspection/ie/IEBulkWorkerAssignment";
import IERoleManagement from "../components/inspection/ie/IERoleManagement";

const IEPage = () => {
  const { t } = useTranslation();
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("Task No"); // Default active section

  const renderContent = () => {
    // --- STEP 2: Use a switch statement to render the correct component ---
    switch (activeSection) {
      case "Task No":
        return <IETaskNoAllocation />;

      case "Worker Assignment":
        return <IEWorkerAssignment />;

      case "Bulk Assignment":
        return <IEBulkWorkerAssignment />;

      case "Role Management":
        return <IERoleManagement />;

      case "Bundle Generation":
        // Placeholder for another future component
        return (
          <div className="p-4 sm:p-6 lg:p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Bundle Generation Content (Coming Soon)
            </h2>
          </div>
        );

      default:
        // A fallback for any section that doesn't have a component yet
        return (
          <div className="p-4 sm:p-6 lg:p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {t("ie.content.title", "Content for:")}{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                {activeSection}
              </span>
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              {t(
                "ie.content.placeholder",
                "The component for this section will be built here."
              )}
            </p>
          </div>
        );
    }
  };

  // --- STEP 3: The rest of the component remains the same ---
  // It provides the theme and layout structure.
  return (
    <IEThemeProvider>
      <div className="flex min-h-screen bg-gray-100 dark:bg-slate-900 transition-colors duration-300">
        <IENavigationPanel
          isNavOpen={isNavOpen}
          setIsNavOpen={setIsNavOpen}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

        <main
          className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
            isNavOpen ? "lg:ml-64" : "lg:ml-20"
          }`}
        >
          {/* This now calls the renderContent function which acts as a mini-router */}
          {renderContent()}
        </main>
      </div>
    </IEThemeProvider>
  );
};

export default IEPage;
