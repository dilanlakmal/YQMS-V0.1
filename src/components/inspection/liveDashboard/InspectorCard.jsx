import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { Camera, AlertCircle } from "lucide-react";

// Placeholder image in case the inspector's photo is not available
const placeholderImage = "https://picsum.photos/150/150?text=No+Photo";

// Define the base URL for images (adjust if your domain differs)
const IMAGE_BASE_URL = "https://ym.kottrahr.com//Uploads/Images/Employee/";

const InspectorCard = ({ inspectorId, filters }) => {
  const [inspectorData, setInspectorData] = useState(null);
  const [summaryData, setSummaryData] = useState({
    checkedQty: 0,
    totalPass: 0,
    totalRejects: 0,
    defectsQty: 0,
    totalBundles: 0,
    defectRate: 0,
    defectRatio: 0
  });
  const [topDefects, setTopDefects] = useState([]);

  // Fetch inspector data from the User collection
  const fetchInspectorData = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/users/${inspectorId}`
      );
      console.log("Inspector data response:", response.data); // Debug log
      setInspectorData(response.data);
    } catch (error) {
      console.error(
        `Error fetching inspector data for ID ${inspectorId}:`,
        error
      );
      setInspectorData(null);
    }
  };

  // Fetch summary data for the inspector
  const fetchSummaryData = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-inspection-summary`,
        {
          params: { emp_id_inspection: inspectorId, ...filters }
        }
      );
      setSummaryData(response.data);
    } catch (error) {
      console.error(
        `Error fetching summary data for inspector ${inspectorId}:`,
        error
      );
      setSummaryData({
        checkedQty: 0,
        totalPass: 0,
        totalRejects: 0,
        defectsQty: 0,
        totalBundles: 0,
        defectRate: 0,
        defectRatio: 0
      });
    }
  };

  // Fetch top 5 defects for the inspector
  const fetchTopDefects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-defect-rates`, {
        params: { emp_id_inspection: inspectorId, ...filters }
      });
      const sortedDefects = response.data
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, 5);
      setTopDefects(sortedDefects);
    } catch (error) {
      console.error(
        `Error fetching top defects for inspector ${inspectorId}:`,
        error
      );
      setTopDefects([]);
    }
  };

  useEffect(() => {
    fetchInspectorData();
    fetchSummaryData();
    fetchTopDefects();
  }, [inspectorId, filters]);

  // Do not render the card if Checked Qty is 0
  if (summaryData.checkedQty === 0) {
    return null;
  }

  // Determine background color based on defect rate for the entire card (light colors)
  const getDefectRateColor = (rate) => {
    const percentage = rate * 100;
    if (percentage > 3) return "bg-red-100";
    if (percentage >= 2 && percentage <= 3) return "bg-yellow-100";
    return "bg-green-100";
  };

  // Determine background color for the Defect Rate summary card (darker colors)
  const getDefectRateSummaryColor = (rate) => {
    const percentage = rate * 100;
    if (percentage > 3) return "bg-red-300";
    if (percentage >= 2 && percentage <= 3) return "bg-yellow-300";
    return "bg-green-300";
  };

  const getImageUrl = (photoPath) => {
    if (!photoPath) return placeholderImage;

    // Check if photoPath is already a full URL
    if (photoPath.startsWith("http")) {
      return photoPath; // Return as-is if it's a full URL
    }

    // Handle relative paths
    const sanitizedPath = photoPath.startsWith("/")
      ? photoPath.slice(1) // Remove leading slash
      : photoPath;

    return `${IMAGE_BASE_URL}${sanitizedPath}`;
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 mb-4 transition-all duration-300 hover:shadow-lg ${getDefectRateColor(
        summaryData.defectRate
      )} w-full max-w-md`}
    >
      {/* Inspector Header */}
      <div className="flex items-center mb-4">
        <div className="relative w-16 h-16 mr-3">
          {inspectorData && inspectorData.face_photo ? (
            <img
              src={getImageUrl(inspectorData.face_photo)}
              alt={inspectorData?.eng_name || "Inspector"}
              className="w-full h-full rounded-full object-cover border-2 border-blue-500"
              onError={(e) => {
                console.error(
                  "Image load failed, switching to placeholder:",
                  e
                );
                e.target.src = placeholderImage;
              }}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
              <Camera className="text-gray-500" size={24} />
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {inspectorData?.eng_name || "Unknown Inspector"}
          </h3>
          <p className="text-xs text-gray-600">Emp ID: {inspectorId}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
        <div className="bg-blue-50 rounded-lg p-2 text-center shadow-sm">
          <p className="text-xs font-medium text-gray-600">Checked Qty</p>
          <p className="text-sm font-bold text-blue-700">
            {summaryData.checkedQty}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center shadow-sm">
          <p className="text-xs font-medium text-gray-600">Total Pass</p>
          <p className="text-sm font-bold text-green-700">
            {summaryData.totalPass}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-2 text-center shadow-sm">
          <p className="text-xs font-medium text-gray-600">Total Rejects</p>
          <p className="text-sm font-bold text-red-700">
            {summaryData.totalRejects}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-2 text-center shadow-sm">
          <p className="text-xs font-medium text-gray-600">Defects Qty</p>
          <p className="text-sm font-bold text-red-700">
            {summaryData.defectsQty}
          </p>
        </div>
        <div
          className={`rounded-lg p-2 text-center shadow-sm ${getDefectRateSummaryColor(
            summaryData.defectRate
          )}`}
        >
          <p className="text-xs font-medium text-gray-600">Defect Rate (%)</p>
          <p className="text-sm font-bold text-gray-800">
            {(summaryData.defectRate * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Top 5 Defects */}
      <div>
        <h4 className="text-base font-semibold text-gray-800 mb-2">
          Top 5 Defects
        </h4>
        {topDefects.length > 0 ? (
          <ul className="space-y-2">
            {topDefects.map((defect, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg shadow-sm"
              >
                <div className="flex items-center">
                  <AlertCircle className="text-red-500 mr-2" size={16} />
                  <span className="text-xs font-medium text-gray-700">
                    {defect.defectName} {defect.totalCount} (
                    {(defect.defectRate * 100).toFixed(2)}%)
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-500 italic">No defects recorded.</p>
        )}
      </div>
    </div>
  );
};

export default InspectorCard;
