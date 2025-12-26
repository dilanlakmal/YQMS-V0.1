import React, { useState, useMemo, useEffect } from "react";
import { UserCircle } from "lucide-react";

const UserStatsCard = ({ user, apiBaseUrl, stats, className = "" }) => {
  const [facePhotoError, setFacePhotoError] = useState(false);

  const userFacePhotoUrl = useMemo(() => {
    if (user && user.face_photo && apiBaseUrl) {
      try {
        return new URL(user.face_photo, apiBaseUrl).href;
      } catch (e) {
        console.error(
          `Error constructing face photo URL for '${user.face_photo}' with base '${apiBaseUrl}':`,
          e
        );
        return null;
      }
    }
    return null;
  }, [user, apiBaseUrl]);

  useEffect(() => {
    // Reset error if user or photo URL changes
    setFacePhotoError(false);
  }, [userFacePhotoUrl]);

  if (!user) {
    return null; // Or a loading/placeholder state
  }

  const getTaskColor = (label) => {
    const lowerLabel = label ? label.toLowerCase() : "";
    if (
      lowerLabel.includes("defect") ||
      lowerLabel.includes("t85") || // Ironing defect
      lowerLabel.includes("t101") || // Washing defect
      lowerLabel.includes("t103") || // OPA defect
      lowerLabel.includes("t104") || // OPA defect
      lowerLabel.includes("t105") || // OPA defect
      lowerLabel.includes("t106") || // Packing defect
      lowerLabel.includes("t107") || // Packing defect
      lowerLabel.includes("t108") || // Packing defect
      lowerLabel.includes("t109") // Packing defect
    ) {
      return "text-red-600 dark:text-red-400"; // Defect tasks
    }
    return "text-green-600 dark:text-green-400"; // Good tasks
  };

  const formatTaskLabelForDisplay = (label) => {
    // Try to extract "Txx" or "xx" from patterns like "(Txx)" or "(xx)"
    const match = label.match(/\(\s*(T\s*\d+|\d+)\s*\)/);
    if (match && match[1]) {
      let taskIdentifier = match[1].replace(/\s+/g, ""); // "T 53" -> "T53", or "52" -> "52"
      if (taskIdentifier.startsWith("T")) {
        const numberPart = taskIdentifier.substring(1); // "53" from "T53"
        return `T (${numberPart})`; // Format as "T (53)"
      } else {
        return `T (${taskIdentifier})`; // Format as "T (52)" from "52"
      }
    }
    // Fallback: if no specific "T (xx)" pattern, return the main part of the label
    const mainLabelPart = label.split("(")[0].trim();
    if (mainLabelPart) return mainLabelPart; // Handles "OPA Task 60"
    return label;
  };

  const displayableTasks = useMemo(() => {
    return stats.tasks
      ? stats.tasks.filter((task) => task.value !== undefined && task.value > 0)
      : [];
  }, [stats.tasks]);

  return (
    <div className={`group relative overflow-hidden bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl rounded-xl border dark:border-gray-700 p-4 sm:p-6 grid grid-cols-3 gap-4 sm:gap-6 items-start transition-all duration-300 hover:scale-[1.02] ${className}`}>
      
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 dark:from-indigo-900/10 dark:via-transparent dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Column 1: User Info */}
      <div className="relative flex flex-col items-center text-center space-y-3 border-r border-gray-200 dark:border-gray-600 pr-4 sm:pr-6">
        <div className="relative">
          {userFacePhotoUrl && !facePhotoError ? (
            <img
              src={userFacePhotoUrl}
              alt={`${user.emp_id || "User"}'s photo`}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-3 border-indigo-300 dark:border-indigo-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
              onError={() => {
                console.error(
                  "Error loading user face photo. URL attempted:",
                  userFacePhotoUrl
                );
                setFacePhotoError(true);
              }}
            />
          ) : (
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-800 dark:to-purple-800 border-3 border-indigo-300 dark:border-indigo-500 shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110">
              <UserCircle className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-500 dark:text-indigo-400" />
            </div>
          )}
          {/* Online Status Indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 dark:bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm sm:text-lg font-bold text-indigo-700 dark:text-indigo-400 tracking-wide">
            {user.emp_id}
          </p>
          <div className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
            <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">
              Inspector
            </p>
          </div>
        </div>
      </div>

      {/* Column 2: Total Garment Count */}
      <div className="relative flex flex-col items-center text-center space-y-3 h-full justify-center border-r border-gray-200 dark:border-gray-600 pr-4 sm:pr-6">
        <div className="w-full">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2">
            {stats.totalLabel || "Total Scanned"}
          </p>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-blue-800/50 hover:shadow-md transition-all duration-300">
            <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {stats.totalValue !== undefined ? stats.totalValue.toLocaleString() : "N/A"}
            </p>
            {stats.totalUnit && (
              <p className="text-xs sm:text-sm text-blue-500 dark:text-blue-300 font-medium">
                {stats.totalUnit}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Column 3: Task No Related Count */}
      <div className="relative flex flex-col items-center text-center space-y-3 h-full justify-center">
        <div className="w-full">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-3">
            By Task (Today)
          </p>
          
          <div className="space-y-2">
            {displayableTasks.length > 0 ? (
              displayableTasks.map(
                (task, index) =>
                  task.label && ( // Ensure task.label exists
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600 hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-all duration-200"
                    >
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {formatTaskLabelForDisplay(task.label)}
                      </span>
                      <span className={`text-sm sm:text-base font-bold ${getTaskColor(task.label)} px-2 py-1 rounded-md bg-white dark:bg-gray-800 shadow-sm`}>
                        {task.value.toLocaleString()}
                      </span>
                    </div>
                  )
              )
            ) : (
              <div className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-medium">
                  No task data
                </p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                  Start scanning to see progress
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Corner Elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/20 to-pink-200/20 dark:from-purple-800/10 dark:to-pink-800/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-indigo-200/20 to-blue-200/20 dark:from-indigo-800/10 dark:to-blue-800/10 rounded-full translate-y-8 -translate-x-8 group-hover:scale-110 transition-transform duration-300"></div>
    </div>
  );
};

export default UserStatsCard;
