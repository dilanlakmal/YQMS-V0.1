import React, { useState, useMemo } from "react";
import { User, ClipboardCheck, ClipboardList, ClipboardX } from "lucide-react";
import { useTranslation } from "react-i18next";

// --- Stat Card Sub-component ---
const StatCard = ({ icon, label, value, color }) => (
  <div
    className={`flex-1 p-3 bg-white rounded-lg shadow-md flex items-center space-x-3 border-l-4 ${color}`}
  >
    <div className="p-2 bg-gray-100 rounded-full">{icon}</div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

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

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
      {/* --- Stat Cards Display --- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <StatCard
          icon={<User className="w-5 h-5 text-gray-600" />}
          label="QC ID"
          value={user.emp_id}
          color="border-gray-400"
        />
        <StatCard
          icon={<ClipboardCheck className="w-5 h-5 text-blue-600" />}
          label="Total Checked Qty"
          value={stats?.totalCheckedQty || 0}
          color="border-blue-500"
        />
        <StatCard
          icon={<ClipboardList className="w-5 h-5 text-green-600" />}
          label="Order Cards (Task 54)"
          value={stats?.totalQtyTask54 || 0}
          color="border-green-500"
        />
        <StatCard
          icon={<ClipboardX className="w-5 h-5 text-red-600" />}
          label="Defect Cards (Task 84)"
          value={stats?.totalQtyTask84 || 0}
          color="border-red-500"
        />
      </div>

      {/* --- View More Button --- */}
      <div className="mt-4 text-center">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          View More Details
        </button>
      </div>

      {/* --- Details Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Daily Scan Summary
                </h2>
                <p className="text-sm font-medium text-gray-500">{today}</p>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MO No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Checked
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Qty (T54)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Defect Qty (T84)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {moSummaryData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.moNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {row.checkedQty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">
                          {row.task54Qty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700">
                          {row.task84Qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 sticky bottom-0">
                    <tr className="font-bold text-gray-800">
                      <td className="px-6 py-3 text-left">Total</td>
                      <td className="px-6 py-3 text-left">
                        {stats?.totalCheckedQty || 0}
                      </td>
                      <td className="px-6 py-3 text-left text-green-800">
                        {stats?.totalQtyTask54 || 0}
                      </td>
                      <td className="px-6 py-3 text-left text-red-800">
                        {stats?.totalQtyTask84 || 0}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 text-right">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QC2WorkerStats;
