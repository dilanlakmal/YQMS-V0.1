import { format } from "date-fns";
import { AlertTriangle, CheckSquare, Percent, User, X } from "lucide-react";
import React, { useMemo } from "react";

// --- Reusable card for the summary section in the preview ---
const PreviewSummaryCard = ({ icon, title, value, colorClass }) => (
  <div className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg flex-1">
    <div className="flex items-center gap-3">
      <div className={`text-xl ${colorClass}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">
          {title}
        </p>
        <p
          className={`text-xl font-bold ${
            colorClass || "text-gray-800 dark:text-gray-200"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  </div>
);

const SubConQCInspectionPreview = ({ isOpen, onClose, data }) => {
  // Memoize the sorted and filtered defect list
  const processedDefects = useMemo(() => {
    if (!data || !data.defects) return [];
    return data.defects
      .filter((d) => Number(d.qty) > 0)
      .sort((a, b) => Number(b.qty) - Number(a.qty));
  }, [data]);

  if (!isOpen || !data) return null;

  const {
    inspectionState,
    totalDefectQty,
    totalDefectRate,
    user,
    getTotalRateStyling,
    getDefectRateCellColor
  } = data;
  const hasCheckedQty = Number(inspectionState.checkedQty) > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* --- MODAL HEADER --- */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            Inspection Preview
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* --- INSPECTION DETAILS --- */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-semibold mb-3">Inspection Details</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 text-sm">
              <p>
                <strong className="text-gray-500 dark:text-gray-400">
                  Date:
                </strong>{" "}
                {format(inspectionState.inspectionDate, "yyyy-MM-dd")}
              </p>
              <p>
                <strong className="text-gray-500 dark:text-gray-400">
                  Factory:
                </strong>{" "}
                {inspectionState.factory?.label}
              </p>
              <p>
                <strong className="text-gray-500 dark:text-gray-400">
                  Line No:
                </strong>{" "}
                {inspectionState.lineNo?.label}
              </p>
              <p>
                <strong className="text-gray-500 dark:text-gray-400">
                  MO No:
                </strong>{" "}
                {inspectionState.moNo?.label}
              </p>
              <p>
                <strong className="text-gray-500 dark:text-gray-400">
                  Color:
                </strong>{" "}
                {inspectionState.color?.label}
              </p>
            </div>
          </div>

          {/* --- SUMMARY CARDS --- */}
          <div className="flex flex-wrap gap-4">
            <PreviewSummaryCard
              icon={<CheckSquare />}
              title="Checked Qty"
              value={hasCheckedQty ? inspectionState.checkedQty : "-"}
              colorClass="text-blue-500"
            />
            <PreviewSummaryCard
              icon={<AlertTriangle />}
              title="Total Defect Qty"
              value={totalDefectQty}
              colorClass="text-yellow-500"
            />
            <PreviewSummaryCard
              icon={<Percent />}
              title="Defect Rate"
              value={hasCheckedQty ? `${totalDefectRate.toFixed(2)}%` : "-"}
              colorClass={getTotalRateStyling().color}
            />
            <PreviewSummaryCard
              icon={<User />}
              title="Prepared By"
              value={user?.emp_id || "N/A"}
              colorClass="text-gray-500"
            />
          </div>

          {/* --- DEFECT DATA TABLE --- */}
          <div>
            <h3 className="font-semibold mb-2 text-sm">Defect Data</h3>
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/60">
                  <tr>
                    <th className="px-3 py-2 text-left">Display Code</th>
                    <th className="px-3 py-2 text-left">Defect Code</th>
                    <th className="px-3 py-2 text-left">Defect Name</th>
                    <th className="px-3 py-2 text-center">Defect Qty</th>
                    <th className="px-3 py-2 text-center">Defect Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {processedDefects.map((defect) => {
                    const defectRate = hasCheckedQty
                      ? (Number(defect.qty) /
                          Number(inspectionState.checkedQty)) *
                        100
                      : null;
                    return (
                      <tr key={defect.DefectCode}>
                        <td className="px-3 py-2">{defect.DisplayCode}</td>
                        <td className="px-3 py-2">{defect.DefectCode}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-800 dark:text-gray-100">
                            {defect.DefectNameEng}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>{defect.DefectNameKhmer}</span> |{" "}
                            <span>{defect.DefectNameChi}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center font-bold">
                          {defect.qty}
                        </td>
                        <td
                          className={`px-3 py-2 text-center font-semibold ${
                            defectRate !== null
                              ? getDefectRateCellColor(defectRate)
                              : ""
                          }`}
                        >
                          {defectRate !== null
                            ? `${defectRate.toFixed(2)}%`
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubConQCInspectionPreview;
