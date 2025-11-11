import React, { useState } from "react";
import SubConQCDashboardDailyView from "./SubConQCDashboardDailyView";
import SubConQCDashboardNavigationPanel from "./SubConQCDashboardNavigationPanel";
import SubConQCDashboardDailyTrend from "./SubConQCDashboardDailyTrend";

// Placeholder for other views you will build later
const PlaceholderComponent = ({ title }) => (
  <div className="flex items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-lg shadow">
    <h2 className="text-2xl font-bold text-gray-400 dark:text-gray-500">
      {title} is Under Construction
    </h2>
  </div>
);

const SubConQCDashboard = () => {
  const [activeView, setActiveView] = useState("dailyView");

  const renderActiveView = () => {
    switch (activeView) {
      case "dailyView":
        return <SubConQCDashboardDailyView />;
      case "weeklyView":
        return <PlaceholderComponent title="Weekly View" />;
      case "monthlyView":
        return <PlaceholderComponent title="Monthly View" />;
      case "dailyTrend":
        return <SubConQCDashboardDailyTrend />;
      case "weeklyTrend":
        return <PlaceholderComponent title="Weekly Trend" />;
      case "monthlyTrend":
        return <PlaceholderComponent title="Monthly Trend" />;
      default:
        return <SubConQCDashboardDailyView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <SubConQCDashboardNavigationPanel
        activeView={activeView}
        setActiveView={setActiveView}
      />
      <main className="p-4 sm:p-6 lg:p-8">{renderActiveView()}</main>
    </div>
  );
};

export default SubConQCDashboard;
