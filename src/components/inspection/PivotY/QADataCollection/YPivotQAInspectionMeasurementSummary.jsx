import React, { useMemo } from "react";
import { Star, Layers, Lock, Target } from "lucide-react";
import { checkTolerance } from "../QATemplates/YPivotQATemplatesHelpers";

const YPivotQAInspectionMeasurementSummary = ({
  savedMeasurements,
  specsData,
  selectedSpecsList,
  activeGroup
}) => {
  // Group measurements by groupId (Session Context)
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
        <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-2">
          No Measurements Yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-500 text-center max-w-md">
          Complete measurement entries from the Specs tab to see summary here.
        </p>
      </div>
    );
  }

  // Helper to check if a spec is critical
  const isCriticalSpec = (specId) => {
    if (!selectedSpecsList || selectedSpecsList.length === 0) return false;
    return selectedSpecsList.some((s) => s.id === specId);
  };

  // Render table for a group of measurements
  const renderSummaryTable = (
    measurements,
    title,
    showOnlyCritical = false
  ) => {
    // Get all unique specs from measurements
    const allSpecIds = new Set();
    measurements.forEach((m) => {
      if (m.measurements) {
        Object.keys(m.measurements).forEach((specId) => {
          allSpecIds.add(specId);
        });
      }
    });

    // Filter specs based on showOnlyCritical
    let filteredSpecs = specsData.filter((spec) => allSpecIds.has(spec.id));
    if (showOnlyCritical) {
      filteredSpecs = filteredSpecs.filter((spec) => isCriticalSpec(spec.id));
    }

    if (filteredSpecs.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400 text-sm italic">
          No {showOnlyCritical ? "critical" : ""} measurements found
        </div>
      );
    }

    // Sort measurements by size for consistent display
    const sortedMeasurements = [...measurements].sort((a, b) =>
      a.size.localeCompare(b.size)
    );

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
          <thead>
            {/* Size Header Row */}
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-100 dark:bg-gray-800 z-10 min-w-[200px]">
                {title}
              </th>
              {sortedMeasurements.map((m, idx) => {
                const pcsCount = Array.isArray(m.selectedPcs)
                  ? m.selectedPcs.length
                  : m.selectedPcs === "ALL"
                  ? m.qty
                  : 1;

                return (
                  <th
                    key={idx}
                    colSpan={pcsCount}
                    className="border border-gray-300 dark:border-gray-600 p-2 text-center bg-indigo-50 dark:bg-indigo-900/30"
                  >
                    <div className="font-bold text-sm text-gray-800 dark:text-gray-200">
                      Size: {m.size}
                    </div>
                    {m.kValue && (
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        K: {m.kValue}
                      </div>
                    )}
                    <div className="text-[9px] text-gray-400 mt-0.5">
                      {m.displayMode === "selected" ? "Critical" : "All Points"}
                    </div>
                  </th>
                );
              })}
            </tr>
            {/* Pcs Sub-Header Row */}
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="border border-gray-300 dark:border-gray-600 p-2 text-xs text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">
                Measurement Point
              </th>
              {sortedMeasurements.map((m, mIdx) => {
                const pcsIndices = Array.isArray(m.selectedPcs)
                  ? m.selectedPcs
                  : m.selectedPcs === "ALL"
                  ? Array.from({ length: m.qty }, (_, i) => i)
                  : [0];

                return pcsIndices.map((pcsIdx) => (
                  <th
                    key={`${mIdx}-${pcsIdx}`}
                    className="border border-gray-300 dark:border-gray-600 p-1 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 min-w-[60px]"
                  >
                    Pcs #{pcsIdx + 1}
                  </th>
                ));
              })}
            </tr>
          </thead>
          <tbody>
            {filteredSpecs.map((spec) => {
              const isCritical = isCriticalSpec(spec.id);

              return (
                <tr
                  key={spec.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* Measurement Point Name */}
                  <td
                    className={`border border-gray-300 dark:border-gray-600 p-2 sticky left-0 z-10 ${
                      isCritical && !showOnlyCritical
                        ? "bg-blue-50 dark:bg-blue-900/30"
                        : "bg-white dark:bg-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isCritical && !showOnlyCritical && (
                        <Star className="w-3 h-3 text-blue-500 fill-current flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {spec.MeasurementPointEngName}
                        </div>
                        {spec.MeasurementPointChiName && (
                          <div className="text-[10px] text-gray-400 truncate">
                            {spec.MeasurementPointChiName}
                          </div>
                        )}
                      </div>
                    </div>
                    {isCritical && !showOnlyCritical && (
                      <span className="inline-block mt-1 text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
                        CRITICAL
                      </span>
                    )}
                  </td>

                  {/* Measurement Values */}
                  {sortedMeasurements.map((m, mIdx) => {
                    const pcsIndices = Array.isArray(m.selectedPcs)
                      ? m.selectedPcs
                      : m.selectedPcs === "ALL"
                      ? Array.from({ length: m.qty }, (_, i) => i)
                      : [0];

                    return pcsIndices.map((pcsIdx) => {
                      const measurement = m.measurements?.[spec.id]?.[pcsIdx];
                      const value = measurement?.decimal || 0;
                      const displayValue = measurement?.fraction || "0";

                      // Check tolerance
                      const toleranceResult = checkTolerance(
                        spec,
                        value,
                        m.size
                      );

                      let bgColor = "bg-gray-50 dark:bg-gray-800";
                      let textColor = "text-gray-400";

                      if (!toleranceResult.isDefault) {
                        if (toleranceResult.isWithin) {
                          bgColor = "bg-green-100 dark:bg-green-900/40";
                          textColor = "text-green-700 dark:text-green-300";
                        } else {
                          bgColor = "bg-red-100 dark:bg-red-900/40";
                          textColor = "text-red-700 dark:text-red-300";
                        }
                      }

                      return (
                        <td
                          key={`${mIdx}-${pcsIdx}`}
                          className={`border border-gray-300 dark:border-gray-600 p-1 text-center ${bgColor}`}
                        >
                          <span
                            className={`text-xs font-mono font-bold ${textColor}`}
                          >
                            {displayValue}
                          </span>
                        </td>
                      );
                    });
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-8 max-w-full mx-auto">
      {/* Render for each group */}
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
          <div key={group.id} className="space-y-6">
            {/* Group Header */}
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

            {/* Critical Point Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 fill-current" />
                  Critical Point Summary
                </h3>
                <p className="text-blue-100 text-xs mt-1">
                  Selected critical measurement points only
                </p>
              </div>
              <div className="p-4">
                {renderSummaryTable(
                  group.measurements,
                  "Critical Points",
                  true
                )}
              </div>
            </div>

            {/* All Point Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  All Point Summary
                </h3>
                <p className="text-purple-100 text-xs mt-1">
                  All measurement points (Critical points are highlighted)
                </p>
              </div>
              <div className="p-4">
                {renderSummaryTable(group.measurements, "All Points", false)}
              </div>
            </div>
          </div>
        );
      })}

      {/* Render Legacy / No Context Measurements */}
      {groupedMeasurements.noContext.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b-2 border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300">
              General Measurements (No Context)
            </h4>
          </div>

          {/* Critical Point Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Star className="w-5 h-5 fill-current" />
                Critical Point Summary
              </h3>
              <p className="text-blue-100 text-xs mt-1">
                Selected critical measurement points only
              </p>
            </div>
            <div className="p-4">
              {renderSummaryTable(
                groupedMeasurements.noContext,
                "Critical Points",
                true
              )}
            </div>
          </div>

          {/* All Point Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                All Point Summary
              </h3>
              <p className="text-purple-100 text-xs mt-1">
                All measurement points (Critical points are highlighted)
              </p>
            </div>
            <div className="p-4">
              {renderSummaryTable(
                groupedMeasurements.noContext,
                "All Points",
                false
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YPivotQAInspectionMeasurementSummary;
