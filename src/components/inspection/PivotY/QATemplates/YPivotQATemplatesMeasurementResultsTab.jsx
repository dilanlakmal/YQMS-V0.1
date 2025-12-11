import React, { useMemo } from "react";
import {
  Edit3,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  BarChart3,
  Trash2,
  Layers,
  Lock,
  Star,
  List
} from "lucide-react";
import { calculateMeasurementStats } from "./YPivotQATemplatesHelpers";

const YPivotQATemplatesMeasurementResultsTab = ({
  savedMeasurements,
  specsData,
  selectedSpecsList, // ⭐ NEW: Pass to know which are critical points
  onEditMeasurement,
  onDeleteMeasurement,
  activeGroup
}) => {
  const groupedMeasurements = useMemo(() => {
    const groups = {};
    const noContext = [];

    savedMeasurements.forEach((m) => {
      if (m.groupId) {
        if (!groups[m.groupId]) {
          groups[m.groupId] = {
            id: m.groupId,
            line: m.line,
            table: m.table,
            color: m.color,
            lineName: m.lineName || m.line,
            tableName: m.tableName || m.table,
            colorName: m.colorName || m.color,
            qcUser: m.qcUser,
            measurements: []
          };
        }
        groups[m.groupId].measurements.push(m);
      } else {
        noContext.push(m);
      }
    });

    return { groups: Object.values(groups), noContext };
  }, [savedMeasurements]);

  if (!savedMeasurements || savedMeasurements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-2">
          No Measurements Yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-500 text-center max-w-md">
          Complete measurement entries from the Specs tab to see results here.
        </p>
      </div>
    );
  }

  const renderCard = (measurement, index, isEditable) => {
    const stats = calculateMeasurementStats(
      measurement,
      specsData,
      measurement.size
    );

    const passRate =
      stats.totalPoints > 0
        ? Math.round((stats.totalPassPoints / stats.totalPoints) * 100)
        : 0;
    const pcsPassRate =
      stats.pcsCount > 0
        ? Math.round((stats.totalOkPcs / stats.pcsCount) * 100)
        : 0;

    // ⭐ Display mode for card
    const isCritical = measurement.displayMode === "selected";

    return (
      <div
        key={index}
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all ${
          isEditable
            ? "border-gray-200 dark:border-gray-700"
            : "border-gray-300 dark:border-gray-600 opacity-75 grayscale-[0.5]"
        }`}
      >
        {/* ⭐ MODIFIED: Card Header with displayMode badge */}
        <div
          className={`p-4 ${
            stats.totalFailPoints === 0
              ? isEditable
                ? "bg-gradient-to-r from-green-500 to-emerald-600"
                : "bg-gray-500"
              : stats.totalFailPoints > stats.totalPassPoints
              ? isEditable
                ? "bg-gradient-to-r from-red-500 to-rose-600"
                : "bg-gray-500"
              : isEditable
              ? "bg-gradient-to-r from-yellow-500 to-orange-500"
              : "bg-gray-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-bold text-lg flex items-center gap-2">
                Size: {measurement.size}
                {!isEditable && <Lock className="w-3 h-3 text-gray-300" />}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-white/80 text-xs">
                  {measurement.measType} Wash
                  {measurement.kValue && ` • K: ${measurement.kValue}`}
                </p>
                {/* ⭐ Display Mode Badge */}
                {isCritical ? (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white/30 text-white px-2 py-0.5 rounded-full font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    Critical
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white/30 text-white px-2 py-0.5 rounded-full font-bold">
                    <List className="w-3 h-3" />
                    All Points
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  isEditable && onEditMeasurement(measurement, index)
                }
                disabled={!isEditable}
                className={`p-2 rounded-full transition-colors ${
                  isEditable
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : "bg-black/10 text-gray-300 cursor-not-allowed"
                }`}
                title={isEditable ? "Edit" : "Locked"}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => isEditable && onDeleteMeasurement(index)}
                disabled={!isEditable}
                className={`p-2 rounded-full transition-colors ${
                  isEditable
                    ? "bg-white/20 hover:bg-red-500 text-white"
                    : "bg-black/10 text-gray-300 cursor-not-allowed"
                }`}
                title={isEditable ? "Delete" : "Locked"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Target className="w-4 h-4 mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {stats.totalPoints}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                Total
              </p>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 mx-auto text-green-500 mb-1" />
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {stats.totalPassPoints}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                Pass
              </p>
            </div>
            <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="w-4 h-4 mx-auto text-red-500 mb-1" />
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {stats.totalFailPoints}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                Fail
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Users className="w-4 h-4 mx-auto text-indigo-500 mb-1" />
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {stats.pcsCount}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                Pcs
              </p>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 mx-auto text-green-500 mb-1" />
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {stats.totalOkPcs}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                OK Pcs
              </p>
            </div>
            <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="w-4 h-4 mx-auto text-red-500 mb-1" />
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {stats.totalFailPcs}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                Fail Pcs
              </p>
            </div>
          </div>

          {stats.totalFailPoints > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {stats.totalPositiveTolPoints}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    +ve Out
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <TrendingDown className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {stats.totalNegativeTolPoints}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    -ve Out
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">
                Points Pass Rate
              </span>
              <span
                className={`font-bold ${
                  passRate >= 90
                    ? "text-green-600"
                    : passRate >= 70
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {passRate}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  passRate >= 90
                    ? "bg-green-500"
                    : passRate >= 70
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${passRate}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">
                Pcs Pass Rate
              </span>
              <span
                className={`font-bold ${
                  pcsPassRate >= 90
                    ? "text-green-600"
                    : pcsPassRate >= 70
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {pcsPassRate}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  pcsPassRate >= 90
                    ? "bg-green-500"
                    : pcsPassRate >= 70
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${pcsPassRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-[10px] text-gray-400 text-center">
            {new Date(measurement.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-8 max-w-6xl mx-auto">
      {groupedMeasurements.groups.map((group) => {
        const isGroupActive = activeGroup && activeGroup.id === group.id;

        const headerParts = [
          group.lineName ? `Line ${group.lineName}` : null,
          group.tableName ? `Table ${group.tableName}` : null,
          group.colorName ? `Color ${group.colorName}` : null
        ].filter(Boolean);

        const headerLabel =
          headerParts.length > 0
            ? headerParts.join(" / ")
            : "Inspection Session";

        return (
          <div key={group.id} className="space-y-3">
            <div
              className={`flex items-center gap-3 pb-2 border-b-2 ${
                isGroupActive
                  ? "border-green-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  isGroupActive
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4
                  className={`text-sm font-bold ${
                    isGroupActive
                      ? "text-green-700 dark:text-green-400"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {headerLabel}
                </h4>
                {group.qcUser && (
                  <p className="text-xs text-gray-500">
                    QC: {group.qcUser.eng_name}
                  </p>
                )}
              </div>
              {isGroupActive ? (
                <span className="ml-auto text-xs bg-green-500 text-white px-2 py-1 rounded font-bold">
                  Active Session
                </span>
              ) : (
                <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.measurements.map((m) => {
                const originalIndex = savedMeasurements.indexOf(m);
                return renderCard(m, originalIndex, isGroupActive);
              })}
            </div>
          </div>
        );
      })}

      {groupedMeasurements.noContext.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 pb-2 border-b-2 border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300">
              General Measurements (No Context)
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedMeasurements.noContext.map((m) => {
              const originalIndex = savedMeasurements.indexOf(m);
              return renderCard(m, originalIndex, !activeGroup);
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default YPivotQATemplatesMeasurementResultsTab;
