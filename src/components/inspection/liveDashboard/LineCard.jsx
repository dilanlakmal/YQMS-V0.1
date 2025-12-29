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
  Target,
  Activity,
  BarChart3
} from "lucide-react";
import React, { useState } from "react";

const LineCard = ({ lineNo, lineDefectRates }) => {
  const [showMore, setShowMore] = useState(false);

  const toggleMore = () => {
    setShowMore(!showMore);
  };

  // Compute summary data from lineDefectRates for this lineNo
  const summaryData = (() => {
    const lineData = {
      checkedQty: 0,
      defectsQty: 0,
      defectArray: [],
      totalPass: 0,
      totalRejects: 0,
      totalBundles: 0,
      defectiveBundles: 0,
      defectRate: 0,
      defectRatio: 0
    };

    const moData = lineDefectRates[lineNo] || {};

    Object.keys(moData).forEach((moNo) => {
      if (moNo !== "totalRate") {
        Object.keys(moData[moNo]).forEach((hour) => {
          if (hour !== "totalRate") {
            const hourData = moData[moNo][hour];
            lineData.checkedQty += hourData.checkedQty || 0;

            const hourDefectsQty = hourData.defects.reduce(
              (sum, defect) => sum + defect.count,
              0
            );

            lineData.defectsQty += hourDefectsQty;
            lineData.defectArray = [
              ...lineData.defectArray,
              ...hourData.defects.map((defect) => ({
                defectName: defect.name,
                totalCount: defect.count
              }))
            ];
          }
        });
      }
    });

    lineData.totalPass = lineData.checkedQty - lineData.defectsQty;
    lineData.totalRejects = lineData.defectsQty;
    lineData.totalBundles = lineData.checkedQty > 0 ? 1 : 0;
    lineData.defectiveBundles = lineData.defectsQty > 0 ? 1 : 0;
    lineData.defectRate =
      lineData.checkedQty > 0 ? lineData.defectsQty / lineData.checkedQty : 0;
    lineData.defectRatio = lineData.defectRate;

    return lineData;
  })();

  // Calculate defect rate and performance status
  const defectRate = summaryData.defectRate * 100;
  
  const getPerformanceStatus = () => {
    if (defectRate > 3) return {
      status: 'Critical',
      bgColor: 'bg-red-500 dark:bg-red-600',
      textColor: 'text-white',
      badgeColor: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700',
      cardBorder: 'border-red-200 dark:border-red-800',
      cardBg: 'bg-red-50 dark:bg-red-900/20'
    };
    if (defectRate >= 2) return {
      status: 'Warning',
      bgColor: 'bg-yellow-500 dark:bg-yellow-600',
      textColor: 'text-white',
      badgeColor: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
      cardBorder: 'border-yellow-200 dark:border-yellow-800',
      cardBg: 'bg-yellow-50 dark:bg-yellow-900/20'
    };
    return {
      status: 'Good',
      bgColor: 'bg-green-500 dark:bg-green-600',
      textColor: 'text-white',
      badgeColor: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
      cardBorder: 'border-green-200 dark:border-green-800',
      cardBg: 'bg-green-50 dark:bg-green-900/20'
    };
  };

  const performance = getPerformanceStatus();

  // Aggregate defect counts from defectArray for this Line No
  const defectTotals = summaryData.defectArray.reduce((acc, defect) => {
    acc[defect.defectName] = (acc[defect.defectName] || 0) + defect.totalCount;
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

  // Format Line No as L:1, L:2, L:Sub, etc.
  const formattedLineNo = `L:${lineNo}`;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl dark:shadow-gray-900/50 transition-all duration-300 transform hover:-translate-y-1 ${performance.cardBorder} border-2 w-full max-w-sm mx-auto overflow-hidden`}>
      
      {/* Header Section */}
      <div className={`${performance.cardBg} px-6 py-4 border-b ${performance.cardBorder}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg">
                <Activity className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{formattedLineNo}</h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${performance.badgeColor}`}>
                {performance.status === 'Critical' ? <AlertTriangle size={12} className="mr-1" /> :
                 performance.status === 'Warning' ? <Target size={12} className="mr-1" /> :
                 <Award size={12} className="mr-1" />}
                {performance.status}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
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
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white">
        <div className="flex items-center justify-center space-x-2">
          <TrendingUp size={20} />
          <div className="text-center">
            <div className="text-2xl font-bold">{passRate.toFixed(1)}%</div>
            <div className="text-sm opacity-90">Pass Rate</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Preview */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{summaryData.checkedQty}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Checked</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-800">
            <div className="text-lg font-bold text-red-700 dark:text-red-300">{summaryData.defectsQty}</div>
            <div className="text-xs text-red-600 dark:text-red-400">Defects</div>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={toggleMore}
          className="w-full mt-4 flex items-center justify-center space-x-2 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300 font-medium"
        >
          <span>{showMore ? "Show Less" : "View Details"}</span>
          {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expandable Detailed Information */}
      {showMore && (
        <div className="px-6 pb-6">
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            {/* Detailed Metrics Grid */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <BarChart3 className="text-blue-600 dark:text-blue-400" size={16} />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Production Metrics</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Checked Quantity */}
                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 border border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-purple-500 dark:text-purple-400" size={16} />
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Checked Qty</p>
                      <p className="text-lg font-bold text-purple-800 dark:text-purple-300">
                        {summaryData.checkedQty}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Pass */}
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 border border-green-100 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-green-500 dark:text-green-400" size={16} />
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Total Pass</p>
                      <p className="text-lg font-bold text-green-800 dark:text-green-300">
                        {summaryData.totalPass}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Defect Quantity */}
                <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3 border border-yellow-100 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <List className="text-yellow-500 dark:text-yellow-400" size={16} />
                    <div>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Defect Qty</p>
                      <p className="text-lg font-bold text-yellow-800 dark:text-yellow-300">
                        {summaryData.defectsQty}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reject Garments */}
                <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <XCircle className="text-red-500 dark:text-red-400" size={16} />
                    <div>
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">Rejects</p>
                      <p className="text-lg font-bold text-red-800 dark:text-red-300">
                        {summaryData.totalRejects}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Bundles */}
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <Archive className="text-blue-500 dark:text-blue-400" size={16} />
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Bundles</p>
                      <p className="text-lg font-bold text-blue-800 dark:text-blue-300">
                        {summaryData.totalBundles}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Defective Bundles */}
                <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 border border-orange-100 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <PackageX className="text-orange-500 dark:text-orange-400" size={16} />
                    <div>
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Defective</p>
                      <p className="text-lg font-bold text-orange-800 dark:text-orange-300">
                        {summaryData.defectiveBundles}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top 5 Defect Rates */}
            {topDefectRates.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                    <AlertTriangle className="text-red-600 dark:text-red-400" size={16} />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Top Defects</h4>
                </div>
                
                <div className="space-y-3">
                  {topDefectRates.map((defect, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            index === 0 ? 'bg-red-500 dark:bg-red-600' : 
                            index === 1 ? 'bg-orange-500 dark:bg-orange-600' : 
                            index === 2 ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-gray-500 dark:bg-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{defect.defectName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Count: {defect.totalCount}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            defect.defectRate * 100 > 3 ? 'text-red-600 dark:text-red-400' :
                            defect.defectRate * 100 >= 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            {(defect.defectRate * 100).toFixed(2)}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Rate</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              defect.defectRate * 100 > 3 ? 'bg-red-500 dark:bg-red-600' :
                              defect.defectRate * 100 >= 2 ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-green-500 dark:bg-green-600'
                            }`}
                            style={{ width: `${Math.min(defect.defectRate * 100 * 10, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Defects Message */}
            {topDefectRates.length === 0 && (
              <div className="text-center py-8">
                <Award className="mx-auto text-green-500 dark:text-green-400 mb-3" size={48} />
                <p className="text-gray-600 dark:text-gray-300 font-medium">No defects recorded</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Excellent line performance!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer with Quick Stats */}
      <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-800 dark:text-gray-200">{topDefectRates.length}</span> defect types
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Quality: <span className={`font-medium ${
                defectRate <= 2 ? 'text-green-600 dark:text-green-400' : 
                defectRate <= 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
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

export default LineCard;
