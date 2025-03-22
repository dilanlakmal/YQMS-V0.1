import React, { useState } from "react";
import WeeklySummaryTrend from "./WeeklySummaryTrend";
import WeeklyDefectTrend from "./WeeklyDefectTrend";

const WeeklySummary = ({ filters }) => {
  const [activeTab, setActiveTab] = useState("Summary");

  return (
    <div className="p-4">
      {/* Tab Navigation */}
      <div className="mb-4">
        <button
          onClick={() => setActiveTab("Summary")}
          className={`px-4 py-2 mr-2 rounded ${
            activeTab === "Summary"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab("Trend")}
          className={`px-4 py-2 mr-2 rounded ${
            activeTab === "Trend"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Trend
        </button>
        <button
          onClick={() => setActiveTab("DefectTrend")}
          className={`px-4 py-2 mr-2 rounded ${
            activeTab === "DefectTrend"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Defect Trend
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "Summary" && (
        <div>
          {/* Placeholder for Summary content */}
          <p className="text-gray-500">
            Summary content to be implemented here.
          </p>
        </div>
      )}
      {activeTab === "Trend" && <WeeklySummaryTrend filters={filters} />}
      {activeTab === "DefectTrend" && <WeeklyDefectTrend filters={filters} />}
    </div>
  );
};

export default WeeklySummary;
