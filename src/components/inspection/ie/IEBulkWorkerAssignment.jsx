import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";
import { Users, Save, Loader2, Tag, User as UserIcon } from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";
import IEPageTitle from "./IEPageTitle";
import { useIETheme } from "./IEThemeContext";
import { MultiSelect } from "react-multi-select-component";
import IEWorkerFacePhoto from "./IEWorkerFacePhoto";

const WorkerDisplay = ({ worker, onPhotoClick }) => {
  return (
    <div className="flex flex-col items-center text-center w-14">
      <button onClick={() => onPhotoClick(worker)} className="relative group">
        {worker.face_photo ? (
          <img
            src={worker.face_photo}
            alt={worker.emp_id}
            className="h-10 w-10 rounded-full object-cover border-2 border-white dark:border-slate-600"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center border-2 border-white dark:border-slate-600">
            <UserIcon className="h-6 w-6 text-gray-500" />
          </div>
        )}
        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 text-xs text-white bg-black rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          {worker.eng_name || worker.emp_id}
        </span>
      </button>
      <span className="text-xs mt-1 text-gray-600 dark:text-gray-400 font-semibold">
        {worker.emp_id}
      </span>
      <div className="mt-1">
        {(worker.tasks || []).map((task) => (
          <div
            key={task}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400"
          >
            {task}
          </div>
        ))}
      </div>
    </div>
  );
};

const IEBulkWorkerAssignment = () => {
  const { t } = useTranslation();
  const { theme } = useIETheme();

  const [jobTitles, setJobTitles] = useState([]);
  const [taskOptions, setTaskOptions] = useState([]);
  const [selectedJobTitle, setSelectedJobTitle] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [summaryData, setSummaryData] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const [error, setError] = useState(null);

  const [selectedUserForPhoto, setSelectedUserForPhoto] = useState(null);

  const [expandedRows, setExpandedRows] = useState(new Set());

  const fetchOptions = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ie/worker-assignment/filter-options`
      );
      if (!response.ok) throw new Error("Failed to fetch filter options");
      const data = await response.json();

      setJobTitles(
        (data.jobTitles || []).map((jt) => ({ value: jt, label: jt }))
      );

      setTaskOptions(
        (data.taskNos || []).map((t) => ({ value: t, label: String(t) }))
      );
    } catch (error) {
      console.error("Failed to load filter options", error);
      setError("Could not load dropdown options.");
    }
  }, []);

  const fetchSummaryData = useCallback(async () => {
    setLoadingSummary(true);
    setError(null);
    try {
      const summaryRes = await fetch(
        `${API_BASE_URL}/api/ie/bulk-assignment/summary`
      );
      if (!summaryRes.ok) throw new Error("Failed to load assignment summary");
      const data = await summaryRes.json();
      setSummaryData(data);
    } catch (error) {
      console.error("Failed to fetch summary data", error);
      setError("Could not load summary data. Please try refreshing.");
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
    fetchSummaryData();
  }, [fetchOptions, fetchSummaryData]);

  const handleBulkSave = async () => {
    if (!selectedJobTitle || selectedTasks.length === 0) {
      Swal.fire({
        icon: "warning",
        title: t("ie.bulk_assignment.validation.title", "Missing Information"),
        text: t(
          "ie.bulk_assignment.validation.text",
          "Please select a job title and at least one task."
        )
      });
      return;
    }
    setIsSaving(true);
    try {
      const taskNumbers = selectedTasks.map((t) => t.value);
      const response = await fetch(
        `${API_BASE_URL}/api/ie/bulk-assignment/by-job-title`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_title: selectedJobTitle.value,
            tasks: taskNumbers
          })
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      Swal.fire({
        icon: "success",
        title: t("ie.bulk_assignment.success_title", "Assignment Successful"),
        text: `${
          result.insertedCount + result.modifiedCount
        } worker(s) updated.`
      });

      setSelectedJobTitle(null);
      setSelectedTasks([]);
      fetchSummaryData();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("ie.bulk_assignment.error_title", "Assignment Failed"),
        text: error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectStyles = {
    control: (p) => ({
      ...p,
      minHeight: "42px",
      backgroundColor: theme === "dark" ? "#1f2937" : "white",
      borderColor: theme === "dark" ? "#4b5563" : "#d1d5db"
    }),
    valueContainer: (p) => ({ ...p, padding: "0 8px" }),
    singleValue: (p) => ({
      ...p,
      color: theme === "dark" ? "#e5e7eb" : "#111827"
    }),
    menu: (p) => ({
      ...p,
      zIndex: 20,
      backgroundColor: theme === "dark" ? "#1f2937" : "white"
    }),
    option: (p, { isFocused, isSelected }) => ({
      ...p,
      backgroundColor: isSelected
        ? "#4f46e5"
        : isFocused
        ? theme === "dark"
          ? "#374151"
          : "#eef2ff"
        : "transparent",
      color: isSelected ? "white" : theme === "dark" ? "#e5e7eb" : "#111827"
    }),
    placeholder: (p) => ({
      ...p,
      color: theme === "dark" ? "#9ca3af" : "#6b7280"
    })
  };

  const customMultiSelectStyles = {
    "value-container": (styles) => ({
      ...styles,
      "&>div": { "&>span": { color: theme === "dark" ? "#e5e7eb" : "#1e293b" } }
    })
  };

  const sortWorkers = (workers) => {
    return [...workers].sort((a, b) => {
      const aIsYM = a.emp_id.startsWith("YM");
      const bIsYM = b.emp_id.startsWith("YM");

      if (aIsYM && !bIsYM) return 1;
      if (!aIsYM && bIsYM) return -1;

      if (aIsYM && bIsYM) {
        const aNum = parseInt(a.emp_id.substring(2), 10);
        const bNum = parseInt(b.emp_id.substring(2), 10);
        return aNum - bNum;
      }
      return a.emp_id.localeCompare(b.emp_id);
    });
  };

  const toggleShowMore = (jobTitle) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobTitle)) {
        newSet.delete(jobTitle);
      } else {
        newSet.add(jobTitle);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <IEPageTitle
        pageTitle={t("ie.bulk_assignment.page_title", "Bulk Worker Assignment")}
      />

      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="md:col-span-1">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Users className="w-4 h-4 mr-2" />
              {t("ie.bulk_assignment.job_title", "Job Title")}
            </label>
            <Select
              options={jobTitles}
              value={selectedJobTitle}
              onChange={setSelectedJobTitle}
              styles={selectStyles}
              placeholder={t(
                "ie.bulk_assignment.select_job_title",
                "Select a job title..."
              )}
            />
          </div>
          <div className="md:col-span-1">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Tag className="w-4 h-4 mr-2" />
              {t("ie.bulk_assignment.tasks", "Assign Tasks")}
            </label>
            <MultiSelect
              options={taskOptions}
              value={selectedTasks}
              onChange={setSelectedTasks}
              labelledBy="Select Tasks"
              className="dark-multiselect"
              style={customMultiSelectStyles}
              overrideStrings={{
                selectSomeItems: t(
                  "ie.worker_assignment.select_tasks",
                  "Select Tasks..."
                )
              }}
            />
          </div>
          <div>
            <button
              onClick={handleBulkSave}
              disabled={isSaving}
              className="w-full h-[42px] flex justify-center items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {t("common.save")}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          {t("ie.bulk_assignment.summary_title", "Assignment Summary")}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("ie.bulk_assignment.table.job_title", "Job Title")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("ie.bulk_assignment.table.total_count", "Total Count")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("ie.bulk_assignment.table.workers", "Workers")}
                </th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {loadingSummary ? (
                <tr>
                  <td colSpan="3" className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin inline-block text-indigo-600" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-red-500">
                    {error}
                  </td>
                </tr>
              ) : summaryData.length === 0 ? (
                <tr>
                  <td
                    colSpan="3"
                    className="text-center py-8 text-gray-500 dark:text-gray-400"
                  >
                    No workers with assigned tasks found.
                  </td>
                </tr>
              ) : (
                summaryData.map((row) => {
                  const isExpanded = expandedRows.has(row.jobTitle);
                  const sortedWorkers = sortWorkers(row.workers);
                  const workersToShow = isExpanded
                    ? sortedWorkers
                    : sortedWorkers.slice(0, 20);

                  return (
                    <tr key={row.jobTitle}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 align-top">
                        {row.jobTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-200 align-top">
                        {row.workers.length}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 align-top">
                        <div className="flex flex-wrap items-start gap-4">
                          {workersToShow.map((worker) => (
                            <WorkerDisplay
                              key={worker.emp_id}
                              worker={worker}
                              onPhotoClick={setSelectedUserForPhoto}
                            />
                          ))}
                          {sortedWorkers.length > 20 && (
                            <button
                              onClick={() => toggleShowMore(row.jobTitle)}
                              className="h-10 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline self-center"
                            >
                              {isExpanded
                                ? "Show Less"
                                : `+${sortedWorkers.length - 20} more`}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedUserForPhoto && (
        <IEWorkerFacePhoto
          user={selectedUserForPhoto}
          onClose={() => setSelectedUserForPhoto(null)}
        />
      )}
    </div>
  );
};

export default IEBulkWorkerAssignment;
