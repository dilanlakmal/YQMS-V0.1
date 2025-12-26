import React, { useState, useMemo } from "react";
import { 
  User, 
  ClipboardCheck, 
  ClipboardList, 
  ClipboardX, 
  TrendingUp,
  Calendar,
  Eye,
  X,
  BarChart3,
  Target,
  Award
} from "lucide-react";
import { useTranslation } from "react-i18next";

// --- Enhanced Stat Card Sub-component ---
const StatCard = ({ icon, label, value, color, trend, subtitle }) => (
  <div className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 ${color} transform hover:scale-105`}>
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('border-l-', 'bg-')}`}>
            {React.cloneElement(icon, { className: `w-6 h-6 ${color.replace('border-l-', 'text-')}` })}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
              {label}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {trend && (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium ml-1">{trend}</span>
          </div>
        )}
      </div>
    </div>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 dark:to-gray-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  </div>
);

// --- Performance Badge Component ---
const PerformanceBadge = ({ stats }) => {
  const totalQty = stats?.totalCheckedQty || 0;
  const target = 500; // Daily target
  const percentage = Math.min((totalQty / target) * 100, 100);
  
  const getBadgeColor = () => {
    if (percentage >= 100) return "bg-green-500 dark:bg-green-600";
    if (percentage >= 80) return "bg-blue-500 dark:bg-blue-600";
    if (percentage >= 60) return "bg-yellow-500 dark:bg-yellow-600";
    return "bg-gray-500 dark:bg-gray-600";
  };

  const getBadgeText = () => {
    if (percentage >= 100) return "Excellent";
    if (percentage >= 80) return "Good";
    if (percentage >= 60) return "Average";
    return "Below Target";
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getBadgeColor()}`}>
        <Award className="w-3 h-3 inline mr-1" />
        {getBadgeText()}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {percentage.toFixed(1)}% of target
      </div>
    </div>
  );
};

// --- Main Worker Stats Component ---
const QC2WorkerStats = ({ stats, onRefresh, user }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const moSummaryData = useMemo(() => {
    if (!stats || !stats.dailyData) return [];

    const summary = stats.dailyData.reduce((acc, item) => {
      if (!acc[item.moNo]) {
        acc[item.moNo] = {
          moNo: item.moNo,
          checkedQty: 0,
          task54Qty: 0,
          task84Qty: 0
        };
      }
      acc[item.moNo].checkedQty += item.qty;
      if (item.taskNo === 54) {
        acc[item.moNo].task54Qty += item.qty;
      } else if (item.taskNo === 84) {
        acc[item.moNo].task84Qty += item.qty;
      }
      return acc;
    }, {});

    return Object.values(summary);
  }, [stats]);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-800 dark:via-purple-800 dark:to-pink-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 dark:bg-gray-700/30 rounded-xl backdrop-blur-sm">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Daily Performance</h2>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center space-x-1 text-white/80">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{today}</span>
                </div>
                <div className="flex items-center space-x-1 text-white/80">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">Updated: {currentTime}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <PerformanceBadge stats={stats} />
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-white/20 dark:bg-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-600/40 backdrop-blur-sm rounded-lg text-sm font-medium transition-all duration-200 border border-white/20 dark:border-gray-600/30"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          icon={<User />}
          label="QC Inspector"
          value={user.emp_id}
          subtitle={user.eng_name || user.kh_name || "Inspector"}
          color="border-l-gray-500 bg-gray-500 text-gray-600 dark:text-gray-400"
        />
        <StatCard
          icon={<ClipboardCheck />}
          label="Total Inspected"
          value={stats?.totalCheckedQty || 0}
          subtitle="Garments Today"
          color="border-l-blue-500 bg-blue-500 text-blue-600 dark:text-blue-400"
          trend={stats?.totalCheckedQty > 0 ? "+12%" : null}
        />
        <StatCard
          icon={<ClipboardList />}
          label="Order Cards"
          value={stats?.totalQtyTask54 || 0}
          subtitle="Task 54 (Pass)"
          color="border-l-green-500 bg-green-500 text-green-600 dark:text-green-400"
        />
        <StatCard
          icon={<ClipboardX />}
          label="Defect Cards"
          value={stats?.totalQtyTask84 || 0}
          subtitle="Task 84 (Reject)"
          color="border-l-red-500 bg-red-500 text-red-600 dark:text-red-400"
        />
      </div>

      {/* Quick Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Today's Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Pass Rate:</span>
                <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                  {stats?.totalCheckedQty > 0 
                    ? ((stats?.totalQtyTask54 / stats?.totalCheckedQty) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Defect Rate:</span>
                <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                  {stats?.totalCheckedQty > 0 
                    ? ((stats?.totalQtyTask84 / stats?.totalCheckedQty) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">MO Count:</span>
                <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">
                  {moSummaryData.length}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-800 dark:hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Eye className="w-5 h-5" />
            <span>View Detailed Report</span>
          </button>
        </div>
      </div>

      {/* Enhanced Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border dark:border-gray-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Detailed Inspection Report
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {today} • Inspector: {user.emp_id}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors duration-200"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden p-6">
              <div className="h-full overflow-y-auto">
                {moSummaryData.length > 0 ? (
                  <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {stats?.totalCheckedQty || 0}
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Total Inspected</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {stats?.totalQtyTask54 || 0}
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">Passed (T54)</div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {stats?.totalQtyTask84 || 0}
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300">Rejected (T84)</div>
                      </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden border dark:border-gray-600">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                          <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                MO Number
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Total Inspected
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Passed (T54)
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Rejected (T84)
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Pass Rate
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                            {moSummaryData.map((row, index) => {
                              const passRate = row.checkedQty > 0 ? ((row.task54Qty / row.checkedQty) * 100).toFixed(1) : 0;
                              return (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {row.moNo}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                                      {row.checkedQty.toLocaleString()}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                                      {row.task54Qty.toLocaleString()}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                                      {row.task84Qty.toLocaleString()}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      passRate >= 95 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                        : passRate >= 90
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                    }`}>
                                      {passRate}%
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardList className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No Data Available
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      No inspection records found for today.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Add export functionality here
                  console.log('Export data:', moSummaryData);
                }}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              >
                Export Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QC2WorkerStats;
