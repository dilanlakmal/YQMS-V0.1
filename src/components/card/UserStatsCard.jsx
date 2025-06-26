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
      return "text-red-600"; // Defect tasks
    }
    return "text-green-600"; // Good tasks
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
    <div
      className={`bg-white shadow-lg rounded-xl p-3 sm:p-4 grid grid-cols-3 gap-2 sm:gap-3 items-start ${className}`}
    >
      {/* Column 1: User Info */}
      <div className="flex flex-col items-center text-center space-y-1 border-r border-gray-200 pr-2 sm:pr-3">
        {userFacePhotoUrl && !facePhotoError ? (
          <img
            src={userFacePhotoUrl}
            alt={`${user.emp_id || "User"}'s photo`}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-indigo-300 shadow-sm"
            onError={() => {
              console.error(
                "Error loading user face photo. URL attempted:",
                userFacePhotoUrl
              );
              setFacePhotoError(true);
            }}
          />
        ) : (
          <UserCircle className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-500" />
        )}
        <p className="text-sm sm:text-base font-semibold text-indigo-700">
          {user.emp_id}
        </p>
      </div>

      {/* Column 2: Total Garment Count */}
      <div className="flex flex-col items-center text-center space-y-1 h-full justify-center border-r border-gray-200 pr-2 sm:pr-3">
        <p className="text-xs sm:text-sm text-gray-500 font-medium">
          {stats.totalLabel || "Total Scanned"}
        </p>
        <p className={`text-lg sm:text-xl font-bold text-blue-600`}>
          {stats.totalValue !== undefined ? stats.totalValue : "N/A"}
        </p>
        {stats.totalUnit && (
          <p className="text-xs text-gray-500">{stats.totalUnit}</p>
        )}
      </div>

      {/* Column 3: Task No Related Count */}
      <div className="flex flex-col items-center text-center space-y-1 h-full justify-center">
        <p className="text-xs sm:text-sm text-gray-500 font-medium">
          By Task (Today)
        </p>
        <div className="space-y-0.5">
          {displayableTasks.length > 0 ? (
            displayableTasks.map(
              (task, index) =>
                task.label && ( // Ensure task.label exists
                  <p
                    key={index}
                    className="text-xs sm:text-sm text-gray-700 leading-tight"
                  >
                    {formatTaskLabelForDisplay(task.label)}:
                    <span
                      className={`font-bold ${getTaskColor(task.label)} ml-1`}
                    >
                      {task.value}
                    </span>
                  </p>
                )
            )
          ) : (
            <p className="text-xs text-gray-400">No task data</p>
          )}
        </div>
      </div>

      {/* Daily Target section removed as per request */}
    </div>
  );
};

export default UserStatsCard;
