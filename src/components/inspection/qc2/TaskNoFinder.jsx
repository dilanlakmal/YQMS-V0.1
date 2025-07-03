import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";

// FIX: Add forMobile prop to function signature
function TaskNoFinder({ department, value, onChange, forMobile }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [availableTasks, setAvailableTasks] = useState([]);
  const [userAccess, setUserAccess] = useState({
    isAdmin: false,
    assignedTasks: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !department) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [tasksRes, accessRes] = await Promise.all([
          fetch(
            `${API_BASE_URL}/api/ie/tasks-by-department?department=${department}`
          ),
          fetch(`${API_BASE_URL}/api/ie/user-task-access/${user.emp_id}`)
        ]);

        if (!tasksRes.ok || !accessRes.ok) {
          throw new Error("Failed to fetch task data.");
        }

        const tasksData = await tasksRes.json();
        const accessData = await accessRes.json();

        setAvailableTasks(tasksData);
        setUserAccess(accessData);

        if (
          tasksData.length === 1 &&
          (accessData.isAdmin ||
            accessData.assignedTasks.includes(tasksData[0]))
        ) {
          onChange(tasksData[0]);
        }
      } catch (err) {
        console.error("Error in TaskNoFinder:", err);
        setError(err.message || "Could not load tasks.");
        setAvailableTasks([]);
        setUserAccess({ isAdmin: false, assignedTasks: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, department, onChange]);

  // FIX: Define responsive classes
  const selectClasses = forMobile
    ? "px-2 py-1.5 text-xs"
    : "px-4 py-2.5 text-sm";

  if (loading) {
    return (
      <select
        className={`w-full border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed ${selectClasses}`}
        disabled
      >
        <option>{t("loading", "Loading...")}</option>
      </select>
    );
  }

  if (error) {
    return (
      <select
        className={`w-full border-red-400 rounded-md shadow-sm bg-red-50 text-red-700 ${selectClasses}`}
        disabled
      >
        <option>{t("error", "Error")}</option>
      </select>
    );
  }

  if (availableTasks.length === 0) {
    return (
      <select
        className={`w-full border-gray-300 rounded-md shadow-sm bg-gray-100 ${selectClasses}`}
        disabled
      >
        <option>{t("bundle.no_tasks_found", "No Tasks Found")}</option>
      </select>
    );
  }

  if (availableTasks.length === 1) {
    const isAllowed =
      userAccess.isAdmin ||
      userAccess.assignedTasks.includes(availableTasks[0]);
    return (
      <input
        type="text"
        value={availableTasks[0]}
        readOnly
        // FIX: Apply responsive classes to the input
        className={`w-full border-gray-300 rounded-md shadow-sm ${selectClasses} ${
          isAllowed ? "bg-slate-100" : "bg-gray-200 text-gray-500"
        }`}
      />
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
      // FIX: Apply responsive classes to the main select
      className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm ${selectClasses}`}
    >
      <option value="">{t("bundle.select_task", "Select Task No...")}</option>
      {availableTasks.map((taskNo) => {
        const isAllowed =
          userAccess.isAdmin || userAccess.assignedTasks.includes(taskNo);
        return (
          <option
            key={taskNo}
            value={taskNo}
            disabled={!isAllowed}
            className={!isAllowed ? "text-gray-400 bg-gray-100" : ""}
          >
            {taskNo}{" "}
            {!isAllowed && ` (${t("bundle.access_denied", "Access Denied")})`}
          </option>
        );
      })}
    </select>
  );
}

export default TaskNoFinder;
