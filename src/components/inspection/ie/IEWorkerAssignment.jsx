import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";
import {
  Edit,
  Save,
  X,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";
import IEPageTitle from "./IEPageTitle";
import { useIETheme } from "./IEThemeContext";
import IEWorkerFacePhoto from "./IEWorkerFacePhoto";
import { MultiSelect } from "react-multi-select-component";

const IEWorkerAssignment = () => {
  const { t } = useTranslation();
  const { theme } = useIETheme();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    emp_id: "",
    emp_code: "",
    dept_name: "",
    sect_name: "",
    job_title: "",
    taskNo: ""
  });
  const [filterOptions, setFilterOptions] = useState({
    empIds: [],
    empCodes: [],
    departments: [],
    sections: [],
    jobTitles: [],
    taskNos: []
  });
  const [editingRowId, setEditingRowId] = useState(null);
  const [editedTasks, setEditedTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUserForPhoto, setSelectedUserForPhoto] = useState(null);

  const fetchWorkers = useCallback(async (page = 1, appliedFilters) => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Fetch the paginated list of workers from the `users` collection
      const workersResponse = await fetch(
        `${API_BASE_URL}/api/ie/worker-assignment/workers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...appliedFilters, page, limit: 12 })
        }
      );
      if (!workersResponse.ok) throw new Error("Failed to fetch workers");
      const workersData = await workersResponse.json();

      // Step 2: Fetch ALL task assignments from the `ie_worker_tasks` collection
      const tasksResponse = await fetch(
        `${API_BASE_URL}/api/ie/worker-assignment/all-tasks`
      );
      if (!tasksResponse.ok)
        throw new Error("Failed to fetch task assignments");
      const allAssignedTasks = await tasksResponse.json();

      // Create a fast lookup map for tasks: { emp_id => [tasks] }
      const tasksMap = new Map(
        allAssignedTasks.map((item) => [item.emp_id, item.tasks])
      );

      // Step 3: Combine the data on the client-side
      const combinedWorkers = workersData.workers.map((worker) => ({
        ...worker,
        tasks: tasksMap.get(worker.emp_id) || [] // Get tasks from map, or default to empty array
      }));

      // Step 4: If filtering by task number, do it now on the combined data
      let finalWorkers = combinedWorkers;
      if (appliedFilters.taskNo) {
        finalWorkers = combinedWorkers.filter((w) =>
          w.tasks.includes(Number(appliedFilters.taskNo))
        );
      }

      setWorkers(finalWorkers);
      setTotalPages(workersData.totalPages); // Pagination is still based on the main user query
      setCurrentPage(workersData.currentPage);
      setTotalUsers(workersData.totalUsers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers(1, filters);
  }, [filters, fetchWorkers]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/ie/worker-assignment/filter-options`
        );
        const data = await res.json();
        setFilterOptions({
          empIds: data.empIds.map((d) => ({ value: d, label: d })),
          empCodes: data.empCodes.map((d) => ({ value: d, label: d })),
          departments: data.departments.map((d) => ({ value: d, label: d })),
          sections: data.sections.map((d) => ({ value: d, label: d })),
          jobTitles: data.jobTitles.map((d) => ({ value: d, label: d })),
          taskNos: data.taskNos.map((d) => ({ value: d, label: String(d) }))
        });
      } catch (error) {
        console.error("Failed to load filter options", error);
      }
    };
    fetchOptions();
  }, []);

  const handleFilterChange = (name, selectedOption) =>
    setFilters((prev) => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : ""
    }));
  const handleClearFilters = () =>
    setFilters({
      emp_id: "",
      emp_code: "",
      dept_name: "",
      sect_name: "",
      job_title: "",
      taskNo: ""
    });
  const handleEdit = (worker) => {
    setEditingRowId(worker._id);
    setEditedTasks(
      filterOptions.taskNos.filter((option) =>
        worker.tasks.includes(option.value)
      )
    );
  };
  const handleCancel = () => {
    setEditingRowId(null);
    setEditedTasks([]);
  };

  const handleSave = async (workerToUpdate) => {
    try {
      const taskNumbers = editedTasks.map((task) => task.value);
      const response = await fetch(
        `${API_BASE_URL}/api/ie/worker-assignment/tasks/${workerToUpdate.emp_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasks: taskNumbers,
            emp_code: workerToUpdate.emp_code
          })
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      Swal.fire({
        icon: "success",
        title: t("common.saved"),
        showConfirmButton: false,
        timer: 1500
      });

      // This is the most reliable way: refetch the current page to get the true data from the server.
      setEditingRowId(null);
      fetchWorkers(currentPage, filters);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: t("common.save_error"),
        text: err.message
      });
    }
  };

  const selectStyles = {
    control: (p) => ({
      ...p,
      minHeight: "38px",
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

  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pageNumbers = [];
      const maxPagesToShow = 5;
      const ellipsis = "...";

      if (totalPages <= maxPagesToShow + 2) {
        for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        if (currentPage > 3) pageNumbers.push(ellipsis);

        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);

        if (currentPage <= 3) endPage = maxPagesToShow - 1;
        if (currentPage >= totalPages - 2)
          startPage = totalPages - (maxPagesToShow - 2);

        for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

        if (currentPage < totalPages - 2) pageNumbers.push(ellipsis);
        pageNumbers.push(totalPages);
      }
      return pageNumbers;
    };

    const pages = getPageNumbers();

    return (
      <div className="flex justify-center items-center space-x-1 mt-6">
        <button
          onClick={() => fetchWorkers(currentPage - 1, filters)}
          disabled={currentPage === 1}
          className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {pages.map((page, index) =>
          typeof page === "number" ? (
            <button
              key={index}
              onClick={() => fetchWorkers(page, filters)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === page
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="px-4 py-2 text-gray-500">
              ...
            </span>
          )
        )}
        <button
          onClick={() => fetchWorkers(currentPage + 1, filters)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <IEPageTitle
        pageTitle={t("ie.worker_assignment.page_title", "Worker Assignment")}
      />
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="mb-6 p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center justify-between">
            <span className="flex items-center">
              <Filter className="w-5 h-5 mr-2" /> {t("common.filters")}
            </span>
            <button
              onClick={handleClearFilters}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {t("common.clear")}
            </button>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Select
              styles={selectStyles}
              placeholder={t("ie.worker_assignment.filter_emp_id")}
              options={filterOptions.empIds}
              isClearable
              onChange={(opt) => handleFilterChange("emp_id", opt)}
              value={filterOptions.empIds.find(
                (o) => o.value === filters.emp_id
              )}
            />
            <Select
              styles={selectStyles}
              placeholder={t("ie.worker_assignment.filter_emp_code")}
              options={filterOptions.empCodes}
              isClearable
              onChange={(opt) => handleFilterChange("emp_code", opt)}
              value={filterOptions.empCodes.find(
                (o) => o.value === filters.emp_code
              )}
            />
            <Select
              styles={selectStyles}
              placeholder={t("ie.worker_assignment.filter_dept")}
              options={filterOptions.departments}
              isClearable
              onChange={(opt) => handleFilterChange("dept_name", opt)}
              value={filterOptions.departments.find(
                (o) => o.value === filters.dept_name
              )}
            />
            <Select
              styles={selectStyles}
              placeholder={t("ie.worker_assignment.filter_sect")}
              options={filterOptions.sections}
              isClearable
              onChange={(opt) => handleFilterChange("sect_name", opt)}
              value={filterOptions.sections.find(
                (o) => o.value === filters.sect_name
              )}
            />
            <Select
              styles={selectStyles}
              placeholder={t("ie.worker_assignment.filter_job")}
              options={filterOptions.jobTitles}
              isClearable
              onChange={(opt) => handleFilterChange("job_title", opt)}
              value={filterOptions.jobTitles.find(
                (o) => o.value === filters.job_title
              )}
            />
            <Select
              styles={selectStyles}
              placeholder={t("ie.worker_assignment.filter_task")}
              options={filterOptions.taskNos}
              isClearable
              onChange={(opt) => handleFilterChange("taskNo", opt)}
              value={filterOptions.taskNos.find(
                (o) => o.value === filters.taskNo
              )}
            />
          </div>
        </div>

        <div className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
          {loading
            ? "Loading..."
            : `${totalUsers} ${t(
                "ie.worker_assignment.users_found",
                "user(s) found"
              )}`}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("ie.worker_assignment.table.emp_id")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("ie.worker_assignment.table.photo")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("ie.worker_assignment.table.emp_code")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("ie.worker_assignment.table.eng_name")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("ie.worker_assignment.table.kh_name")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("ie.worker_assignment.table.job_title")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("ie.worker_assignment.table.dept")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("ie.worker_assignment.table.sect")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-64">
                  {t("ie.worker_assignment.table.tasks")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("ie.worker_assignment.table.action")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin inline-block text-indigo-600" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-red-500">
                    {error}
                  </td>
                </tr>
              ) : (
                workers.map((worker) => (
                  <tr
                    key={worker._id}
                    className={
                      editingRowId === worker._id
                        ? "bg-green-50 dark:bg-green-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    }
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {worker.emp_id}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedUserForPhoto(worker)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {worker.emp_code}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {worker.eng_name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {worker.kh_name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {worker.job_title}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {worker.dept_name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {worker.sect_name}
                    </td>
                    <td className="px-4 py-2 w-64">
                      {editingRowId === worker._id ? (
                        <MultiSelect
                          options={filterOptions.taskNos}
                          value={editedTasks}
                          onChange={setEditedTasks}
                          labelledBy="Select Tasks"
                          className="dark-multiselect"
                          style={customMultiSelectStyles}
                          overrideStrings={{
                            selectSomeItems: t(
                              "ie.worker_assignment.select_tasks"
                            )
                          }}
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {worker.tasks
                            .sort((a, b) => a - b)
                            .map((task) => (
                              <span
                                key={task}
                                className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full"
                              >
                                {task}
                              </span>
                            ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-3">
                        {editingRowId === worker._id ? (
                          <>
                            <button
                              onClick={() => handleSave(worker)}
                              className="text-green-600 hover:text-green-800"
                              title={t("common.save")}
                            >
                              <Save className="w-5 h-5" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="text-gray-600 hover:text-gray-800"
                              title={t("common.cancel")}
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEdit(worker)}
                            className="text-indigo-600 hover:text-indigo-800"
                            title={t("common.edit")}
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination />
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

export default IEWorkerAssignment;
