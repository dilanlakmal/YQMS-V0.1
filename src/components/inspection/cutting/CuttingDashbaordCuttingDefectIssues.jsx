import { ArrowLeft, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../../../config";
import { useTheme } from "../../context/ThemeContext";

// --- MODIFIED: Sub-component for the Summary Pivot Table (MOs as Rows) ---
const CuttingDefectSummaryTable = ({ data, theme }) => {
  // Memoize the new data transformation
  const { defectHeaders, moData, columnTotals } = useMemo(() => {
    if (!data || data.length === 0) {
      return { defectHeaders: [], moData: [], columnTotals: {} };
    }

    // Step 1: Get all unique defect names to use as table headers
    const headers = new Set();
    data.forEach((defect) => {
      headers.add(defect.defectName);
    });
    const sortedDefectHeaders = Array.from(headers).sort();

    // Step 2: Pivot the data to have MOs as the primary key
    const pivotData = {}; // { "MO123": { "Defect A": 1, "Defect B": 2 }, "MO456": { ... } }
    data.forEach((defect) => {
      const defectName = defect.defectName;
      Object.entries(defect.moBreakdown).forEach(([moNo, qty]) => {
        if (!pivotData[moNo]) {
          pivotData[moNo] = {};
        }
        pivotData[moNo][defectName] = qty;
      });
    });

    // Convert the pivoted object into a sorted array for rendering rows
    const sortedMoData = Object.entries(pivotData)
      .map(([moNo, defects]) => ({ moNo, ...defects }))
      .sort((a, b) => a.moNo.localeCompare(b.moNo));

    // Step 3: Calculate the total for each defect column
    const totals = {};
    sortedDefectHeaders.forEach((defectName) => {
      totals[defectName] = sortedMoData.reduce(
        (sum, moRow) => sum + (moRow[defectName] || 0),
        0
      );
    });

    return {
      defectHeaders: sortedDefectHeaders,
      moData: sortedMoData,
      columnTotals: totals
    };
  }, [data]);

  return (
    <div
      className={`p-4 rounded-lg shadow-md ${
        theme === "dark" ? "bg-[#1f2937]" : "bg-white"
      }`}
    >
      <h3
        className={`text-lg font-bold mb-4 ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        Cutting Defect Summary
      </h3>
      <div className="overflow-x-auto">
        <table
          className={`w-full text-left text-xs border-collapse ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          <thead
            className={`uppercase ${
              theme === "dark"
                ? "bg-gray-800 text-gray-400"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            <tr>
              <th className="sticky left-0 z-10 py-2 px-3 border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-800">
                MO No
              </th>
              {defectHeaders.map((header) => (
                <th
                  key={header}
                  className="py-2 px-3 text-center border border-gray-300 dark:border-gray-600"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {moData.map((moRow) => (
              <tr
                key={moRow.moNo}
                className={`border-b ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <td className="sticky left-0 z-10 py-2 px-3 font-medium border-x border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1f2937]">
                  {moRow.moNo}
                </td>
                {defectHeaders.map((defectName) => {
                  const value = moRow[defectName] || 0;
                  return (
                    <td
                      key={defectName}
                      className={`py-2 px-3 text-center border border-gray-300 dark:border-gray-600 ${
                        value > 0 ? "font-semibold text-red-500" : ""
                      }`}
                    >
                      {value > 0 ? value : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {/* --- NEW: Footer row for Totals --- */}
          <tfoot
            className={`font-bold uppercase ${
              theme === "dark"
                ? "bg-gray-800 text-gray-300"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            <tr>
              <td className="sticky left-0 z-10 py-2 px-3 border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-800">
                Total Qty
              </td>
              {defectHeaders.map((defectName) => (
                <td
                  key={defectName}
                  className="py-2 px-3 text-center border border-gray-300 dark:border-gray-600"
                >
                  {columnTotals[defectName] > 0 ? columnTotals[defectName] : ""}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// --- The rest of the components are UNCHANGED ---

// Sub-component for the Image Evidence Section
const CuttingDefectEvidence = ({ data, theme, onImageClick }) => {
  const getImagePath = (relativePath) => {
    if (!relativePath) return "";
    if (relativePath.startsWith("http")) return relativePath;
    const base = API_BASE_URL.endsWith("/")
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;
    const path = relativePath.startsWith("/")
      ? relativePath
      : `/${relativePath}`;
    return `${base}${path}`;
  };
  return (
    <div className="mt-6">
      <h3
        className={`text-lg font-bold mb-4 ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        Defect Issue Evidence
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.map((moData) => (
          <div
            key={moData.moNo}
            className={`rounded-xl shadow-lg p-4 ${
              theme === "dark" ? "bg-[#1f2937]" : "bg-white"
            }`}
          >
            <h4
              className={`font-bold text-md mb-3 ${
                theme === "dark" ? "text-gray-200" : "text-gray-800"
              }`}
            >
              {moData.moNo}
            </h4>
            <div className="max-h-96 overflow-y-auto pr-2">
              <table
                className={`w-full text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <thead>
                  <tr className="text-left border-b border-gray-300 dark:border-gray-600">
                    <th className="py-2">Table No</th>
                    <th className="py-2">Images</th>
                  </tr>
                </thead>
                <tbody>
                  {moData.imagesByTable.map((table) => (
                    <tr
                      key={table.tableNo}
                      className="border-b border-gray-200 dark:border-gray-700"
                    >
                      <td className="py-2 font-semibold align-top">
                        {table.tableNo}
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-2">
                          {table.images.slice(0, 3).map((path, index) => (
                            <img
                              key={index}
                              src={getImagePath(path)}
                              alt={`Defect evidence ${index + 1}`}
                              className="w-16 h-16 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => onImageClick(table.images)}
                            />
                          ))}
                          {table.images.length > 3 && (
                            <div
                              className="w-16 h-16 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500"
                              onClick={() => onImageClick(table.images)}
                            >
                              <span className="text-lg font-bold">
                                +{table.images.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MODIFIED: Image Viewer Modal Component with Enlarge Functionality ---
const ImageViewerModal = ({ images, onClose, theme }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  // This effect resets the view to the gallery whenever a new set of images is passed in.
  useEffect(() => {
    setSelectedImage(null);
  }, [images]);

  if (!images || images.length === 0) return null;

  const getImagePath = (relativePath) => {
    if (!relativePath) return "";
    if (relativePath.startsWith("http")) return relativePath;
    const base = API_BASE_URL.endsWith("/")
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;
    const path = relativePath.startsWith("/")
      ? relativePath
      : `/${relativePath}`;
    return `${base}${path}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      {/* The modal container is now larger to accommodate the big image */}
      <div
        className={`relative w-full max-w-6xl h-[90vh] rounded-lg p-4 flex flex-col ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-red-500 rounded-full p-1 z-20"
        >
          <X size={24} />
        </button>

        {/* Conditional Rendering: Show single image or gallery */}
        {selectedImage ? (
          // --- SINGLE ENLARGED IMAGE VIEW ---
          <div className="relative w-full h-full flex flex-col">
            <div className="flex-shrink-0 mb-2">
              <button
                onClick={() => setSelectedImage(null)}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-semibold ${
                  theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-black"
                }`}
              >
                <ArrowLeft size={16} />
                Back to Gallery
              </button>
            </div>
            <div className="flex-grow flex items-center justify-center">
              <img
                src={getImagePath(selectedImage)}
                alt="Enlarged evidence"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        ) : (
          // --- GALLERY GRID VIEW ---
          <div className="flex flex-col h-full">
            <h3
              className={`flex-shrink-0 text-lg font-bold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              Image Gallery ({images.length} images)
            </h3>
            <div className="flex-grow overflow-y-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((path, index) => (
                <div key={index} className="aspect-square">
                  <img
                    src={getImagePath(path)}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => setSelectedImage(path)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Wrapper Component
const CuttingDashboardCuttingDefectIssues = ({ data, title }) => {
  const { theme } = useTheme();
  const [modalImages, setModalImages] = useState(null);
  const pivotData = data?.pivotData || [];
  const evidenceData = data?.evidenceData || [];

  if (pivotData.length === 0 && evidenceData.length === 0) {
    return (
      <div
        className={`p-4 mt-6 rounded-lg shadow-md h-96 flex items-center justify-center ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
          No cutting defect data available for the selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 relative z-0">
      <h2
        className={`text-xl font-bold mb-4 ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        {title}
      </h2>
      {pivotData.length > 0 && (
        <CuttingDefectSummaryTable data={pivotData} theme={theme} />
      )}
      {evidenceData.length > 0 && (
        <CuttingDefectEvidence
          data={evidenceData}
          theme={theme}
          onImageClick={setModalImages}
        />
      )}
      <ImageViewerModal
        images={modalImages}
        onClose={() => setModalImages(null)}
        theme={theme}
      />
    </div>
  );
};

export default CuttingDashboardCuttingDefectIssues;
