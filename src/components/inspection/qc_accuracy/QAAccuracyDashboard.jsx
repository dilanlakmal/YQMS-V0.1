import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import QCAccuracyDashboardNavPanel from "./QCAccuracyDashboardNavPanel";
import QAAccuracyDashboardDailySummary from "./QAAccuracyDashboardDailySummary";
// Import other views as you build them
// import QAAccuracyDashboardWeeklySummary from './QAAccuracyDashboardWeeklySummary';

const viewComponents = {
  daily: QAAccuracyDashboardDailySummary
  // weekly: QAAccuracyDashboardWeeklySummary, // Example for future
  // monthly: () => <div>Monthly Summary View</div>, // Placeholder
  // qa: () => <div>QA View</div>,
  // qc: () => <div>QC View</div>,
};

const QAAccuracyDashboard = () => {
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [activeView, setActiveView] = useState("daily");

  const ActiveComponent =
    viewComponents[activeView] || (() => <div>View not found</div>);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Side Navigation Panel */}
      <aside className="bg-white dark:bg-gray-800 shadow-lg flex-shrink-0">
        <QCAccuracyDashboardNavPanel
          activeView={activeView}
          setActiveView={setActiveView}
          isOpen={isNavOpen}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {isNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-2xl font-bold ml-4">QA Accuracy Dashboard</h1>
        </div>

        {/* Render the active component */}
        <ActiveComponent />
      </main>
    </div>
  );
};

export default QAAccuracyDashboard;
