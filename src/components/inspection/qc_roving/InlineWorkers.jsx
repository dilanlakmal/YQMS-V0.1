import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config"; // Ensure this path is correct
import { useTranslation } from "react-i18next";
import { Pencil, Save, XCircle } from "lucide-react";
import Swal from "sweetalert2";

const LineWorkers = ({ onWorkerCountUpdated }) => {
  const { t } = useTranslation();
  const [lineSummaries, setLineSummaries] = useState([]);
  const [filteredLineSummaries, setFilteredLineSummaries] = useState([]);
  const [filters, setFilters] = useState({
    lineNo: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingLineNo, setEditingLineNo] = useState(null);
  const [currentEditValue, setCurrentEditValue] = useState("");

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/line-summary`);
        const transformedData = response.data.map((summary) => ({
          lineNo: summary.line_no,
          // workerCount: summary.worker_count,
          realWorkerCount: summary.real_worker_count,
          editedWorkerCount: summary.edited_worker_count
        }));
        setLineSummaries(transformedData);
        setFilteredLineSummaries(transformedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching line workers:", err);
        setError(
          t(
            "lineWorkersDb.fetchError",
            "Failed to fetch line summary data. Please try again later."
          )
        );
        setLineSummaries([]);
        setFilteredLineSummaries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [t]);

  const handleEdit = (summary) => {
    setEditingLineNo(summary.lineNo);
    setCurrentEditValue(
      String(
        summary.editedWorkerCount !== null &&
          summary.editedWorkerCount !== undefined
          ? summary.editedWorkerCount
          : ""
      )
    );
  };

  const handleCancelEdit = () => {
    setEditingLineNo(null);
    setCurrentEditValue("");
  };

  const handleSave = async (lineNoToSave) => {
    const newWorkerCount = parseInt(currentEditValue, 10);
    if (isNaN(newWorkerCount) || newWorkerCount < 0) {
      Swal.fire(
        t("lineWorkersDb.invalidCountTitle", "Invalid Count"),
        t(
          "lineWorkersDb.invalidCountMsg",
          "Worker count must be a non-negative number."
        ),
        "error"
      );
      return;
    }

    try {
      // Assuming your backend endpoint is PUT /api/line-summary/:lineNo
      // The backend needs to be set up to handle this request
      await axios.put(
        `${API_BASE_URL}/api/line-sewing-workers/${lineNoToSave}`,
        {
          edited_worker_count: newWorkerCount // Send as edited_worker_count
        }
      );

      const updatedSummaries = lineSummaries.map((s) =>
        s.lineNo === lineNoToSave
          ? { ...s, editedWorkerCount: newWorkerCount }
          : s
      );
      setLineSummaries(updatedSummaries);
      // filteredLineSummaries will update via useEffect
      setEditingLineNo(null);
      Swal.fire(
        t("lineWorkersDb.saveSuccessTitle", "Success"),
        t("lineWorkersDb.saveSuccessMsg", "Worker count updated successfully."),
        "success"
      );
      if (onWorkerCountUpdated) {
        onWorkerCountUpdated();
      }
    } catch (err) {
      console.error("Error updating line worker count:", err);
      Swal.fire(
        t("lineWorkersDb.saveErrorTitle", "Error"),
        err.response?.data?.message ||
          t("lineWorkersDb.saveErrorMsg", "Failed to update worker count."),
        "error"
      );
    }
  };

  useEffect(() => {
    let currentSummaries = [...lineSummaries];
    if (filters.lineNo) {
      currentSummaries = currentSummaries.filter(
        (summary) =>
          summary.lineNo &&
          String(summary.lineNo)
            .toLowerCase()
            .includes(filters.lineNo.toLowerCase())
      );
    }
    setFilteredLineSummaries(currentSummaries);
  }, [filters, lineSummaries]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        {t("lineWorkers.loading", "Loading line data...")}
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-6 text-gray-700">
        {t("lineWorkersDb.title", "Inline Worker Summary by Line")}
      </h2>
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                {t("lineWorkersDb.headerLineNo", "Line No")}
                <input
                  type="text"
                  name="lineNo"
                  value={filters.lineNo}
                  onChange={handleFilterChange}
                  placeholder={t(
                    "lineWorkersDb.filterPlaceholderLineNo",
                    "Filter by Line No..."
                  )}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                {t("lineWorkersDb.headerWorkerCount", "Number of Workers")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                {t("lineWorkersDb.headerEditedCount", "Edited Count")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLineSummaries.length > 0 ? (
              filteredLineSummaries.map((summary, index) => (
                <tr
                  key={summary.lineNo || index}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {summary.lineNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {summary.realWorkerCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center space-x-2">
                      {editingLineNo === summary.lineNo ? (
                        <>
                          <input
                            type="number"
                            value={currentEditValue}
                            onChange={(e) =>
                              setCurrentEditValue(e.target.value)
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSave(summary.lineNo)}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-100"
                            title={t("lineWorkersDb.save", "Save")}
                          >
                            <Save size={24} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100"
                            title={t("lineWorkersDb.cancel", "Cancel")}
                          >
                            <XCircle size={24} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="min-w-[30px] text-center">
                            {summary.editedWorkerCount !== null &&
                            summary.editedWorkerCount !== undefined
                              ? summary.editedWorkerCount
                              : "-"}
                          </span>
                          <button
                            onClick={() => handleEdit(summary)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100"
                            title={t("lineWorkersDb.edit", "Edit")}
                          >
                            <Pencil size={24} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  {" "}
                  {/* Adjusted colSpan */}
                  {t(
                    "lineWorkersDb.noResults",
                    "No line summaries found matching your criteria."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LineWorkers;
