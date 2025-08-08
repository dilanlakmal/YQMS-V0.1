import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, ChevronsDown, ChevronsUp } from "lucide-react";

// --- UPDATED PROPS ---
// It now receives `isActive` and an `onToggle` function from its parent.
const InspectionTimer = ({
  onTimeUpdate,
  initialSeconds = 0,
  isActive,
  onToggle
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [time, setTime] = useState(initialSeconds);
  const intervalRef = useRef(null);

  // This internal state is REMOVED:
  // const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setTime(initialSeconds);
  }, [initialSeconds]);

  // This effect's logic is perfect. It will now run whenever the `isActive` prop changes.
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1;
          onTimeUpdate(newTime);
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, onTimeUpdate]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            // The button now calls the onToggle function passed from the parent.
            onClick={onToggle}
            className={`p-3 rounded-full text-white ${
              isActive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isActive ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <div>
            <div className="text-3xl font-mono font-bold text-gray-800 dark:text-gray-100">
              {formatTime(time)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {isActive ? "INSPECTION IN PROGRESS" : "TIMER PAUSED"}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {isMinimized ? <ChevronsDown size={20} /> : <ChevronsUp size={20} />}
        </button>
      </div>
      {!isMinimized && isActive && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            Inspection Time
          </h4>
          <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
            Inspection is currently running.
          </p>
        </div>
      )}
    </div>
  );
};

export default InspectionTimer;
