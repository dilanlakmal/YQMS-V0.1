import { 
  Archive, 
  CheckCircle, 
  List, 
  PackageX, 
  XCircle, 
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  Award,
  Target
} from "lucide-react";
import React, { useState } from "react";

const LiveStyleCard = ({ moNo, summaryData }) => {
  const [showMore, setShowMore] = useState(false);

  const toggleMore = () => {
    setShowMore(!showMore);
  };

  // Calculate defect rate background color
  const defectRate = summaryData.defectRate * 100 || 0;
  
  const getPerformanceStatus = () => {
    if (defectRate > 3) return {
      status: 'Critical',
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      badgeColor: 'bg-red-100 text-red-800 border-red-300',
      cardBorder: 'border-red-200',
      cardBg: 'bg-red-50'
    };
    if (defectRate >= 2) return {
      status: 'Warning',
      bgColor: 'bg-yellow-500',
      textColor: 'text-white',
      badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      cardBorder: 'border-yellow-200',
      cardBg: 'bg-yellow-50'
    };
    return {
      status: 'Good',
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      badgeColor: 'bg-green-100 text-green-800 border-green-300',
      cardBorder: 'border-green-200',
      cardBg: 'bg-green-50'
    };
  };

  const performance = getPerformanceStatus();

  // Aggregate defect counts from defectArray for this MO No
  const defectTotals = (summaryData.defectArray || []).reduce((acc, defect) => {
    if (defect && defect.defectName && defect.hasOwnProperty("totalCount")) {
      acc[defect.defectName] = (acc[defect.defectName] || 0) + defect.totalCount;
    }
    return acc;
  }, {});

  // Convert to array and calculate defect rates
  const totalCheckedQty = summaryData.checkedQty || 1;
  const topDefectRates = Object.entries(defectTotals)
    .map(([defectName, totalCount]) => ({
      defectName,
      totalCount,
      defectRate: totalCount / totalCheckedQty
    }))
    .sort((a, b) => b.defectRate - a.defectRate)
    .slice(0, 5);

  // Calculate pass rate
  const passRate = totalCheckedQty > 0 ? ((summaryData.totalPass || 0) / totalCheckedQty * 100) : 0;

  return (
    <div className={`bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${performance.cardBorder} border-2 w-full max-w-sm mx-auto overflow-hidden`}>
      
      {/* Header Section */}
      <div className={`${performance.cardBg} px-6 py-4 border-b ${performance.cardBorder}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{moNo}</h3>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${performance.badgeColor}`}>
                {performance.status === 'Critical' ? <AlertTriangle size={12} className="mr-1" /> :
                 performance.status === 'Warning' ? <Target size={12} className="mr-1" /> :
                 <Award size={12} className="mr-1" />}
                {performance.status}
              </span>
              <span className="text-xs text-gray-600">
                Ratio: {(summaryData.defectRatio * 100).toFixed(2)}%
              </span>
            </div>
          </div>
          
          {/* Defect Rate Badge */}
          <div className={`${performance.bgColor} ${performance.textColor} px-4 py-2 rounded-xl shadow-lg`}>
            <div className="text-center">
              <div className="text-2xl font-bold">{defectRate.toFixed(1)}%</div>
              <div className="text-xs opacity-90">Defect Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pass Rate Highlight */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center justify-center space-x-2">
          <TrendingUp size={20} />
          <div className="text-center">
            <div className="text-2xl font-bold">{passRate.toFixed(1)}%</div>
            <div className="text-sm opacity-90">Pass Rate</div>
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Total Bundles */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 hover:bg-blue-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Archive className="text-white" size={16} />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Total Bundles</p>
                <p className="text-xl font-bold text-blue-800">
                  {summaryData.totalBundles || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Defective Bundles */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-100 hover:bg-orange-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <PackageX className="text-white" size={16} />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-medium">Defective</p>
                <p className="text-xl font-bold text-orange-800">
                  {summaryData.defectiveBundles || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Checked Quantity */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 hover:bg-purple-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <CheckCircle className="text-white" size={16} />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium">Checked Qty</p>
                <p className="text-xl font-bold text-purple-800">
                  {summaryData.checkedQty || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Total Pass */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-100 hover:bg-green-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="text-white" size={16} />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">Total Pass</p>
                <p className="text-xl font-bold text-green-800">
                  {summaryData.totalPass || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <div className="flex items-center space-x-2">
              <XCircle className="text-red-500" size={16} />
              <div>
                <p className="text-xs text-red-600 font-medium">Rejects</p>
                <p className="text-lg font-bold text-red-800">
                  {summaryData.totalRejects || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
            <div className="flex items-center space-x-2">
              <List className="text-yellow-500" size={16} />
              <div>
                <p className="text-xs text-yellow-600 font-medium">Defects Qty</p>
                <p className="text-lg font-bold text-yellow-800">
                  {summaryData.defectsQty || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={toggleMore}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-medium"
        >
          <span>{showMore ? "Show Less" : "View Defect Details"}</span>
          {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expandable Top 5 Defect Rates */}
      {showMore && (
        <div className="px-6 pb-6">
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="text-red-600" size={16} />
              </div>
              <h4 className="text-lg font-semibold text-gray-800">Top Defects</h4>
            </div>
            
            {topDefectRates.length > 0 ? (
              <div className="space-y-3">
                {topDefectRates.map((defect, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 border border-gray-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-red-500' : 
                          index === 1 ? 'bg-orange-500' : 
                          index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{defect.defectName}</p>
                          <p className="text-sm text-gray-500">Count: {defect.totalCount}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          defect.defectRate * 100 > 3 ? 'text-red-600' :
                          defect.defectRate * 100 >= 2 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {(defect.defectRate * 100).toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-500">Rate</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            defect.defectRate * 100 > 3 ? 'bg-red-500' :
                            defect.defectRate * 100 >= 2 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(defect.defectRate * 100 * 10, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="mx-auto text-green-500 mb-3" size={48} />
                <p className="text-gray-600 font-medium">No defects recorded</p>
                <p className="text-sm text-gray-500">Excellent quality performance!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer with Quick Stats */}
      <div className="bg-gray-50 px-6 py-3 border-t">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              <span className="font-medium text-gray-800">{topDefectRates.length}</span> defect types
            </span>
            <span className="text-gray-600">
              Quality: <span className={`font-medium ${
                defectRate <= 2 ? 'text-green-600' : 
                defectRate <= 3 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {defectRate <= 2 ? 'Excellent' : defectRate <= 3 ? 'Good' : 'Needs Attention'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStyleCard;
