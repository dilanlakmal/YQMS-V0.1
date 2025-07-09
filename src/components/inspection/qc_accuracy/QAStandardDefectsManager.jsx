// --- FIX #4: NEW MANAGER PAGE FOR STANDARD DEFECTS ---
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import QAStandardDefectAdd from "./QAStandardDefectAdd";

const QAStandardDefectsManager = () => {
  const { t } = useTranslation();
  const [defects, setDefects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-standard-defects`
      );
      setDefects(response.data);
    } catch (err) {
      setError("Failed to load standard defects.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id, name) => {
    Swal.fire({
      title: `Delete '${name}'?`,
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_BASE_URL}/api/qa-standard-defects/${id}`);
          fetchData();
          Swal.fire("Deleted!", "The defect has been deleted.", "success");
        } catch (err) {
          Swal.fire("Error!", "Could not delete the defect.", "error");
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-8xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Manage Standard Defects
        </h1>

        <QAStandardDefectAdd onDefectAdded={fetchData} />

        {error && (
          <div className="my-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto mt-6">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-100">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Defect Name</th>
                <th className="px-4 py-3">Decisions</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {defects.map((defect) => (
                <tr key={defect.code}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">
                    {defect.code}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div>{defect.english}</div>
                    <div className="text-xs text-gray-500">{defect.khmer}</div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <ul className="list-disc list-inside space-y-1">
                      {defect.decisions.map((dec, index) => (
                        <li key={index}>
                          {dec.decisionEng} -{" "}
                          <span
                            className={`font-bold ${
                              dec.status === "Critical"
                                ? "text-red-600"
                                : dec.status === "Major"
                                ? "text-orange-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {dec.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleDelete(defect._id, defect.english)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QAStandardDefectsManager;
