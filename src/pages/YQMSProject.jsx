// src/pages/YQMSProject.jsx
import React, { useState } from "react";
import { LayoutGrid, FileText, GanttChartSquare } from "lucide-react";
import YQMSData from "../components/inspection/yqms/YQMSData"; // Adjust path if needed

const YQMSProject = () => {
  const [activeTab, setActiveTab] = useState("data");

  const tabs = [
    { id: "data", label: "Data", icon: LayoutGrid },
    { id: "docs", label: "Documentation Community", icon: FileText },
    { id: "gantt", label: "Gantt Chart", icon: GanttChartSquare }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "data":
        return <YQMSData />;
      case "docs":
        return (
          <div className="text-center p-10 text-gray-500">
            Documentation Community content coming soon.
          </div>
        );
      case "gantt":
        return (
          <div className="text-center p-10 text-gray-500">
            Gantt Chart content coming soon.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">YQMS Projects</h1>
        <p className="text-md text-gray-600 mb-8">
          Manage, track, and collaborate on YQMS development and improvement
          projects.
        </p>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <tab.icon className="mr-2 h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-8">{renderContent()}</div>
      </div>
    </div>
  );
};

export default YQMSProject;
