import React, { useState, useEffect, useCallback } from "react";
import { FaInfoCircle } from "react-icons/fa"; // Using react-icons for the 'i' icon
import { API_BASE_URL } from "../../../config";
import { Loader2, AlertTriangle } from "lucide-react"; // For loading and error icons

const DefectNames = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [defects, setDefects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const imageBaseUrl = API_BASE_URL.endsWith("/api")
    ? API_BASE_URL.slice(0, -4)
    : API_BASE_URL;

  const fetchDefects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc2-defects`);
      if (!response.ok) {
        throw new Error(`Failed to fetch defects: ${response.statusText}`);
      }
      const data = await response.json();
      setDefects(data);
    } catch (err) {
      setError(err.message);
      setDefects([]); // Clear defects on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDefects();
  }, [fetchDefects]);

  const handleImageClick = (imagePath) => {
    setSelectedImage(imagePath);
  };

  const handleClosePreview = () => {
    setSelectedImage(null);
  };

  return (
    <div className="h-full w-full p-4 bg-white rounded-lg shadow-md overflow-hidden">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        Defect Master List
      </h2>
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-150px)]">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 table-auto">
          <thead className="bg-sky-100 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200 whitespace-nowrap w-16">
                Defect Code
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200 whitespace-nowrap w-48">
                Defect Image
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200 min-w-[150px]">
                English Name
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200 min-w-[150px]">
                Khmer Name
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200 min-w-[150px]">
                Chinese Name
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200 min-w-[150px]">
                Printing Name
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                  <p className="text-sm text-gray-500 mt-2">
                    Loading defects...
                  </p>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="text-center py-10">
                  <AlertTriangle className="h-8 w-8 mx-auto text-red-500" />
                  <p className="text-sm text-red-600 mt-2">Error: {error}</p>
                  <button
                    onClick={fetchDefects}
                    className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : defects.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-500">
                  No defects found.
                </td>
              </tr>
            ) : (
              defects.map((defect) => (
                <tr key={defect._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 align-top">
                    {defect.code || "-"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 align-top relative">
                    {defect.image ? (
                      <div className="relative">
                        <img
                          src={`${imageBaseUrl}${defect.image}`}
                          alt={defect.english}
                          className="h-24 w-24 object-cover rounded"
                          onError={(e) => {
                            e.target.src = "assets/Img/default.jpg"; // Fallback image
                          }}
                        />
                        <button
                          onClick={() =>
                            handleImageClick(`${imageBaseUrl}${defect.image}`)
                          }
                          className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 focus:outline-none"
                          title="View Image"
                        >
                          <FaInfoCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No Image</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 align-top whitespace-normal break-words">
                    {defect.english || "-"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 align-top whitespace-normal break-words">
                    {defect.khmer || "-"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 align-top whitespace-normal break-words">
                    {defect.chinese || "-"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 align-top whitespace-normal break-words">
                    {defect.shortEng || defect.english || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-[90vw] max-h-[90vh] relative overflow-hidden">
            <img
              src={selectedImage}
              alt="Defect Preview"
              className="max-w-full max-h-[80vh] object-contain"
              onError={(e) => {
                e.target.src = "assets/Img/default.jpg"; // Fallback image
              }}
            />
            <button
              onClick={handleClosePreview}
              className="absolute top-2 right-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectNames;
