import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";
import {
  Edit,
  Save,
  Trash2,
  X,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";
import IEPageTitle from "./IEPageTitle";
import { useIETheme } from "./IEThemeContext"; // Import theme context

const IETaskNoAllocation = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useIETheme(); // Get theme from context
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    department: "",
    productType: "",
    processName: "",
    taskNo: ""
  });
  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    productTypes: [],
    processNames: []
  });

  const [editingRowId, setEditingRowId] = useState(null);
  const [editedTaskNo, setEditedTaskNo] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const currentLanguage = i18n.language;

  const fetchTasks = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/ie/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...filters, page, limit: 10 })
        });
        if (!response.ok) throw new Error("Failed to fetch tasks");
        const data = await response.json();
        setTasks(data.tasks);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // This useEffect handles fetching when the component mounts or filters change
  useEffect(() => {
    fetchTasks(1); // Go to page 1 whenever filters are changed
  }, [filters]); // Dependency is on the filters object

  // This useEffect handles fetching dropdown options for filters only once
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/ie/tasks/filter-options`
        );
        if (!response.ok) throw new Error("Failed to load filter options");
        const data = await response.json();
        setFilterOptions({
          departments: data.departments.map((d) => ({ value: d, label: d })),
          productTypes: data.productTypes.map((p) => ({ value: p, label: p })),
          processNames: data.processNames.map((p) => ({ value: p, label: p }))
        });
      } catch (error) {
        console.error("Failed to load filter options", error);
      }
    };
    fetchOptions();
  }, []);

  const handleFilterChange = (name, selectedOption) => {
    setFilters((prev) => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : ""
    }));
  };

  const handleEdit = (task) => {
    setEditingRowId(task._id);
    setEditedTaskNo(task.taskNo);
  };

  const handleCancel = () => {
    setEditingRowId(null);
    setEditedTaskNo("");
  };

  const handleSave = async (taskId) => {
    if (editedTaskNo === "" || isNaN(Number(editedTaskNo))) {
      Swal.fire({
        icon: "error",
        title: t("ie.task.save_error"),
        text: "Task No cannot be empty and must be a number."
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/ie/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskNo: editedTaskNo })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      Swal.fire({
        icon: "success",
        title: t("ie.task.save_success"),
        showConfirmButton: false,
        timer: 1500
      });
      setEditingRowId(null);
      fetchTasks(currentPage); // Refetch current page to show updated value
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: t("ie.task.save_error"),
        text: err.message
      });
    }
  };

  const handleDelete = (taskId) => {
    Swal.fire({
      title: t("ie.task.delete_confirm_title", "Are you sure?"),
      text: t(
        "ie.task.delete_confirm_text",
        "You won't be able to revert this!"
      ),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("ie.task.delete_confirm_button", "Yes, delete it!"),
      cancelButtonText: t("common.cancel", "Cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/ie/tasks/${taskId}`,
            { method: "DELETE" }
          );
          const resData = await response.json();
          if (!response.ok) throw new Error(resData.message);

          Swal.fire(
            t("ie.task.delete_success_title", "Deleted!"),
            resData.message,
            "success"
          );
          fetchTasks(currentPage); // Refetch data
        } catch (err) {
          Swal.fire(
            t("ie.task.delete_error_title", "Error!"),
            err.message,
            "error"
          );
        }
      }
    });
  };

  const getLocalizedField = (item, fieldName) => {
    const lang = currentLanguage.toLowerCase();
    if (lang.startsWith("kh"))
      return item[`${fieldName}Khmer`] || item[fieldName];
    if (lang.startsWith("zh"))
      return item[`${fieldName}Chinese`] || item[fieldName];
    return item[fieldName];
  };

  const tableHeaders = useMemo(
    () => [
      { key: "department", label: t("ie.task.table.department", "Department") },
      {
        key: "productType",
        label: t("ie.task.table.productType", "Product Type")
      },
      {
        key: "processName",
        label: t("ie.task.table.processName", "Process Name")
      },
      { key: "taskNo", label: t("ie.task.table.taskNo", "Task No") },
      { key: "action", label: t("ie.task.table.action", "Action") }
    ],
    [t]
  );

  const selectStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: theme === "dark" ? "#1f2937" : "white",
      borderColor: theme === "dark" ? "#4b5563" : "#d1d5db",
      color: theme === "dark" ? "#e5e7eb" : "#111827",
      boxShadow: "none",
      "&:hover": { borderColor: theme === "dark" ? "#6b7280" : "#a5b4fc" }
    }),
    singleValue: (provided) => ({
      ...provided,
      color: theme === "dark" ? "#e5e7eb" : "#111827"
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: theme === "dark" ? "#1f2937" : "white",
      border: `1px solid ${theme === "dark" ? "#4b5563" : "#d1d5db"}`
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? theme === "dark"
          ? "#374151"
          : "#eef2ff"
        : "transparent",
      color: theme === "dark" ? "#e5e7eb" : "#111827",
      "&:active": {
        backgroundColor: theme === "dark" ? "#4b5563" : "#e0e7ff"
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: theme === "dark" ? "#9ca3af" : "#6b7280"
    })
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div className="flex justify-center items-center space-x-2 mt-6">
        <button
          onClick={() => fetchTasks(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => fetchTasks(number)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === number
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            {number}
          </button>
        ))}
        <button
          onClick={() => fetchTasks(currentPage + 1)}
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
      <IEPageTitle pageTitle={t("ie.task.page_title", "Task No Adjustment")} />

      <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md transition-colors duration-300">
        <div className="mb-6 p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2" /> {t("common.filters")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              styles={selectStyles}
              placeholder={t("ie.task.filter.department")}
              options={filterOptions.departments}
              isClearable
              onChange={(opt) => handleFilterChange("department", opt)}
            />
            <Select
              styles={selectStyles}
              placeholder={t("ie.task.filter.productType")}
              options={filterOptions.productTypes}
              isClearable
              onChange={(opt) => handleFilterChange("productType", opt)}
            />
            <input
              type="text"
              placeholder={t("ie.task.filter.processName")}
              className="p-2 border border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, processName: e.target.value }))
              }
            />
            <input
              type="number"
              placeholder={t("ie.task.filter.taskNo")}
              className="p-2 border border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, taskNo: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                {tableHeaders.map((header) => (
                  <th
                    key={header.key}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={tableHeaders.length}
                    className="text-center py-8"
                  >
                    <Loader2 className="h-8 w-8 animate-spin inline-block text-indigo-600" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={tableHeaders.length}
                    className="text-center py-8 text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr
                    key={task._id}
                    className={
                      editingRowId === task._id
                        ? "bg-green-50 dark:bg-green-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                      {task.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                      {getLocalizedField(task, "productType")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                      {getLocalizedField(task, "processName")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                      {editingRowId === task._id ? (
                        <input
                          type="number"
                          value={editedTaskNo}
                          onChange={(e) => setEditedTaskNo(e.target.value)}
                          className="w-20 p-1 border rounded-md bg-white dark:bg-slate-600 dark:border-slate-500 dark:text-white"
                        />
                      ) : (
                        task.taskNo
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {editingRowId === task._id ? (
                          <>
                            <button
                              onClick={() => handleSave(task._id)}
                              className="text-green-600 hover:text-green-800 dark:hover:text-green-400"
                              title={t("common.save")}
                            >
                              <Save className="w-5 h-5" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="text-gray-600 hover:text-gray-800 dark:hover:text-gray-300"
                              title={t("common.cancel")}
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(task)}
                              className="text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400"
                              title={t("common.edit")}
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(task._id)}
                              className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
                              title={t("common.delete")}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
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
    </div>
  );
};

export default IETaskNoAllocation;
