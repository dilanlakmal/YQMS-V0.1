import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { Camera, AlertCircle, TrendingUp, TrendingDown, Award, Target } from "lucide-react";

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
      console.log("Inspector data response:", response.data);
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

  // Determine status and colors based on defect rate
  const getPerformanceStatus = (rate) => {
    const percentage = rate * 100;
    if (percentage > 3) return { 
      status: 'needs-improvement', 
      color: 'red', 
      bgColor: 'bg-red-50 dark:bg-red-900/20', 
      borderColor: 'border-red-200 dark:border-red-800' 
    };
    if (percentage >= 2 && percentage <= 3) return { 
      status: 'average', 
      color: 'yellow', 
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', 
      borderColor: 'border-yellow-200 dark:border-yellow-800' 
    };
    return { 
      status: 'excellent', 
      color: 'green', 
      bgColor: 'bg-green-50 dark:bg-green-900/20', 
      borderColor: 'border-green-200 dark:border-green-800' 
    };
  };

  const getImageUrl = (photoPath) => {
    if (!photoPath) return placeholderImage;
    if (photoPath.startsWith("http")) {
      return photoPath;
    }
    const sanitizedPath = photoPath.startsWith("/")
      ? photoPath.slice(1)
      : photoPath;
    return `${IMAGE_BASE_URL}${sanitizedPath}`;
  };

  const performance = getPerformanceStatus(summaryData.defectRate);
  const passRate = summaryData.checkedQty > 0 ? ((summaryData.totalPass / summaryData.checkedQty) * 100).toFixed(1) : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl dark:shadow-gray-900/50 transition-all duration-300 transform hover:-translate-y-1 ${performance.bgColor} ${performance.borderColor} border-2 w-full max-w-sm mx-auto overflow-hidden`}>
      
      {/* Header with Inspector Info */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {inspectorData && inspectorData.face_photo ? (
              <img
                src={getImageUrl(inspectorData.face_photo)}
                alt={inspectorData?.eng_name || "Inspector"}
                className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-gray-200 shadow-lg"
                onError={(e) => {
                  console.error("Image load failed, switching to placeholder:", e);
                  e.target.src = placeholderImage;
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 dark:bg-white/30 flex items-center justify-center border-4 border-white dark:border-gray-200 shadow-lg">
                <Camera className="text-white" size={24} />
              </div>
            )}
            
            {/* Performance Badge */}
            <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center ${
              performance.status === 'excellent' ? 'bg-green-500 dark:bg-green-600' : 
              performance.status === 'average' ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-red-500 dark:bg-red-600'
            }`}>
              {performance.status === 'excellent' ? <Award size={12} className="text-white" /> : 
               performance.status === 'average' ? <Target size={12} className="text-white" /> : 
               <AlertCircle size={12} className="text-white" />}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold truncate text-white">
              {inspectorData?.eng_name || "Unknown Inspector"}
            </h3>
            <p className="text-blue-100 dark:text-blue-200 text-sm">ID: {inspectorId}</p>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
              performance.status === 'excellent' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 
              performance.status === 'average' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
            }`}>
              {performance.status === 'excellent' ? 'Excellent' : 
               performance.status === 'average' ? 'Average' : 'Needs Improvement'}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Pass Rate - Main Metric */}
          <div className="col-span-2 bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg p-4 text-white text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <TrendingUp size={20} />
              <span className="text-sm font-medium">Pass Rate</span>
            </div>
            <div className="text-3xl font-bold">{passRate}%</div>
          </div>
          
          {/* Checked Quantity */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-center border border-blue-100 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">{summaryData.checkedQty}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Checked</div>
          </div>
          
          {/* Defect Rate */}
          <div className={`rounded-lg p-4 text-center border ${
            performance.status === 'excellent' ? 'bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800' : 
            performance.status === 'average' ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-100 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800'
          }`}>
            <div className={`text-2xl font-bold mb-1 ${
              performance.status === 'excellent' ? 'text-green-700 dark:text-green-300' : 
              performance.status === 'average' ? 'text-yellow-700 dark:text-yellow-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {(summaryData.defectRate * 100).toFixed(1)}%
            </div>
            <div className={`text-xs font-medium ${
              performance.status === 'excellent' ? 'text-green-600 dark:text-green-400' : 
              performance.status === 'average' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
            }`}>
              Defect Rate
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">{summaryData.totalPass}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Pass</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">{summaryData.totalRejects}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Rejects</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">{summaryData.defectsQty}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Defects</div>
          </div>
        </div>

        {/* Top Defects Section */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingDown className="text-red-500 dark:text-red-400" size={18} />
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Top Defects</h4>
          </div>
          
          {topDefects.length > 0 ? (
            <div className="space-y-2">
              {topDefects.map((defect, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      index === 0 ? 'bg-red-500 dark:bg-red-600' : 
                      index === 1 ? 'bg-orange-500 dark:bg-orange-600' : 
                      index === 2 ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-gray-500 dark:bg-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{defect.defectName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{(defect.defectRate * 100).toFixed(1)}% rate</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{defect.totalCount}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">count</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Award className="mx-auto text-green-500 dark:text-green-400 mb-2" size={32} />
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">No defects recorded</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Excellent performance!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InspectorCard;
