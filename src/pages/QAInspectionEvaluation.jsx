import React, { useState } from "react";
import ExcelUploadSubQA from "../components/inspection/subconqa/ExcelUploadSubQA";

const QAInspectionEvaluation = () => {
  const [activeTab, setActiveTab] = useState("subcon"); // 'subcon', 'ym', 'dashboard'

  const renderTabContent = () => {
    switch (activeTab) {
      case "subcon":
        return <ExcelUploadSubQA />;
      case "ym":
        return (
          <div className="p-6 text-gray-700">
            Excel Upload - YM (Content to be built)
          </div>
        );
      case "dashboard":
        return (
          <div className="p-6 text-gray-700">
            Dashboard (Content to be built)
          </div>
        );
      default:
        return null;
    }
  };

  const tabStyles =
    "py-3 px-6 font-medium text-sm focus:outline-none transition-colors duration-150";
  const activeTabStyles = "border-b-2 border-indigo-600 text-indigo-600";
  const inactiveTabStyles =
    "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300";

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-md">
        <nav className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("subcon")}
            className={`${tabStyles} ${
              activeTab === "subcon" ? activeTabStyles : inactiveTabStyles
            }`}
          >
            Excel Upload - Sub Con
          </button>
          <button
            onClick={() => setActiveTab("ym")}
            className={`${tabStyles} ${
              activeTab === "ym" ? activeTabStyles : inactiveTabStyles
            }`}
          >
            Excel Upload - YM
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`${tabStyles} ${
              activeTab === "dashboard" ? activeTabStyles : inactiveTabStyles
            }`}
          >
            Dashboard
          </button>
        </nav>
      </div>

      <div className="container mx-auto mt-2">
        {" "}
        {/* Added container for better content alignment */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default QAInspectionEvaluation;
