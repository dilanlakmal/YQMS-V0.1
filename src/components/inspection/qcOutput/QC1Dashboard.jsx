import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Calendar,
  View,
  TrendingUp,
  CalendarDays,
  CalendarClock,
  CalendarHeart
} from "lucide-react";

//-- Common UI Components --
import HeaderButton from "./CommonUI/HeaderButton";

//-- Dashboard Views --
import DailyView from "./dashboard/DailyView";
import DailyTrendView from "./dashboard/DailyTrendView";

/**
 * The main container for the QC1 Dashboard.
 * It manages the header, date range, and switches between different dashboard views.
 */
const QC1Dashboard = () => {
  const [dateRange, setDateRange] = useState([
    new Date(new Date().setDate(new Date().getDate() - 6)),
    new Date()
  ]);
  const [startDate, endDate] = dateRange;
  const [activeDashboardView, setActiveDashboardView] = useState("Daily View");

  // A helper function to render the currently active view component
  const renderActiveView = () => {
    switch (activeDashboardView) {
      case "Daily View":
        return <DailyView startDate={startDate} endDate={endDate} />;
      case "Daily Trend":
        return <DailyTrendView startDate={startDate} endDate={endDate} />;
      case "Weekly View":
      case "Monthly View":
      case "Weekly Trend":
      case "Monthly Trend":
      default:
        return (
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-12 text-center">
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">
              {activeDashboardView} is Under Development
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              This section will be available in a future update.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 p-6">
      <div className="max-w-full mx-auto space-y-6">
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">
                  QC1 Sunrise Dashboard
                </h1>
                <p className="text-indigo-100">
                  QC1 Inspection Quality Control Summary and Analysis
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/20">
                <HeaderButton
                  label="Daily View"
                  icon={View}
                  active={activeDashboardView === "Daily View"}
                  onClick={() => setActiveDashboardView("Daily View")}
                />
                <HeaderButton
                  label="Weekly View"
                  icon={CalendarDays}
                  active={activeDashboardView === "Weekly View"}
                  onClick={() => setActiveDashboardView("Weekly View")}
                />
                <HeaderButton
                  label="Monthly View"
                  icon={CalendarHeart}
                  active={activeDashboardView === "Monthly View"}
                  onClick={() => setActiveDashboardView("Monthly View")}
                />
                <HeaderButton
                  label="Daily Trend"
                  icon={TrendingUp}
                  active={activeDashboardView === "Daily Trend"}
                  onClick={() => setActiveDashboardView("Daily Trend")}
                />
                <HeaderButton
                  label="Weekly Trend"
                  icon={TrendingUp}
                  active={activeDashboardView === "Weekly Trend"}
                  onClick={() => setActiveDashboardView("Weekly Trend")}
                />
                <HeaderButton
                  label="Monthly Trend"
                  icon={CalendarClock}
                  active={activeDashboardView === "Monthly Trend"}
                  onClick={() => setActiveDashboardView("Monthly Trend")}
                />
              </div>
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-xl px-4 py-3">
                <Calendar className="text-white" size={20} />
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  className="bg-transparent text-white font-medium outline-none w-64 placeholder-white/70"
                  popperClassName="react-datepicker-popper-z-50"
                  portalId="root-portal"
                />
              </div>
            </div>
          </div>
        </header>

        {/* --- Render the active view --- */}
        {renderActiveView()}
      </div>
    </div>
  );
};

export default QC1Dashboard;
