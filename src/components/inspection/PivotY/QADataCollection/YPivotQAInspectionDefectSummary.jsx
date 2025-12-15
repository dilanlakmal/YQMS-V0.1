import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart3,
  Layers,
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Award,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Target,
  Percent
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import { determineBuyerFromOrderNo } from "./YPivotQAInspectionBuyerDetermination";

const YPivotQAInspectionDefectSummary = ({
  savedDefects = [],
  activeGroup = null,
  reportData = null,
  selectedOrders = []
}) => {
  // AQL Config State
  const [aqlConfigs, setAqlConfigs] = useState([]);
  const [loadingAql, setLoadingAql] = useState(false);

  // Determine if AQL method is used
  const isAQLMethod = useMemo(() => {
    return reportData?.selectedTemplate?.InspectedQtyMethod === "AQL";
  }, [reportData?.selectedTemplate]);

  // Determine buyer
  const determinedBuyer = useMemo(() => {
    if (!selectedOrders || selectedOrders.length === 0) return "Unknown";
    return determineBuyerFromOrderNo(selectedOrders[0]).buyer;
  }, [selectedOrders]);

  // Get inspected qty from report config
  const inspectedQty = useMemo(() => {
    return parseInt(reportData?.config?.inspectedQty) || 0;
  }, [reportData?.config?.inspectedQty]);

  // Fetch AQL Config when needed
  useEffect(() => {
    if (!isAQLMethod || !determinedBuyer || determinedBuyer === "Unknown") {
      setAqlConfigs([]);
      return;
    }

    const fetchAqlConfig = async () => {
      setLoadingAql(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/aql-config?buyer=${determinedBuyer}`
        );
        if (res.data.success) {
          setAqlConfigs(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching AQL config:", err);
        setAqlConfigs([]);
      } finally {
        setLoadingAql(false);
      }
    };

    fetchAqlConfig();
  }, [isAQLMethod, determinedBuyer]);

  // Find matching sample data for each status
  const aqlSampleData = useMemo(() => {
    if (!aqlConfigs || aqlConfigs.length === 0 || !inspectedQty) {
      return { minor: null, major: null, critical: null, baseConfig: null };
    }

    const findMatchingSample = (config) => {
      if (!config?.SampleData) return null;
      return config.SampleData.find(
        (sample) => inspectedQty >= sample.Min && inspectedQty <= sample.Max
      );
    };

    const minorConfig = aqlConfigs.find((c) => c.Status === "Minor");
    const majorConfig = aqlConfigs.find((c) => c.Status === "Major");
    const criticalConfig = aqlConfigs.find((c) => c.Status === "Critical");

    return {
      minor: findMatchingSample(minorConfig),
      major: findMatchingSample(majorConfig),
      critical: findMatchingSample(criticalConfig),
      minorConfig,
      majorConfig,
      criticalConfig,
      baseConfig: minorConfig || majorConfig || criticalConfig
    };
  }, [aqlConfigs, inspectedQty]);

  // Process data for summary table
  const summaryData = useMemo(() => {
    if (!savedDefects || savedDefects.length === 0) {
      return {
        groups: [],
        totals: { minor: 0, major: 0, critical: 0, total: 0 },
        uniqueDefects: 0,
        defectsList: []
      };
    }

    // Group defects by config (groupId)
    const groupedByConfig = savedDefects.reduce((acc, defect) => {
      const configKey = defect.groupId || "legacy";

      let configLabel = "";
      if (defect.lineName) configLabel += `Line ${defect.lineName}`;
      if (defect.tableName)
        configLabel += (configLabel ? " • " : "") + `Table ${defect.tableName}`;
      if (defect.colorName)
        configLabel += (configLabel ? " • " : "") + defect.colorName;
      if (!configLabel) configLabel = "Unknown";

      if (!acc[configKey]) {
        acc[configKey] = {
          configKey,
          configLabel,
          lineName: defect.lineName,
          tableName: defect.tableName,
          colorName: defect.colorName,
          isActive: activeGroup && activeGroup.id === configKey,
          defects: {}
        };
      }

      const defectKey = defect.defectId || defect.defectName;
      if (!acc[configKey].defects[defectKey]) {
        acc[configKey].defects[defectKey] = {
          defectId: defect.defectId,
          defectName: defect.defectName,
          defectCode: defect.defectCode,
          minor: 0,
          major: 0,
          critical: 0,
          total: 0
        };
      }

      const qty = defect.qty || 1;
      const status = defect.status?.toLowerCase();

      if (status === "minor") {
        acc[configKey].defects[defectKey].minor += qty;
      } else if (status === "major") {
        acc[configKey].defects[defectKey].major += qty;
      } else if (status === "critical") {
        acc[configKey].defects[defectKey].critical += qty;
      }
      acc[configKey].defects[defectKey].total += qty;

      return acc;
    }, {});

    const groups = Object.values(groupedByConfig).map((group) => ({
      ...group,
      defects: Object.values(group.defects).sort((a, b) => {
        const codeA = parseFloat(a.defectCode) || 0;
        const codeB = parseFloat(b.defectCode) || 0;
        return codeA - codeB;
      })
    }));

    // Calculate grand totals
    const totals = { minor: 0, major: 0, critical: 0, total: 0 };
    let uniqueDefectsSet = new Set();

    // Aggregate defects for AQL table (combine same defects across all configs)
    const allDefectsMap = {};

    groups.forEach((group) => {
      group.defects.forEach((defect) => {
        totals.minor += defect.minor;
        totals.major += defect.major;
        totals.critical += defect.critical;
        totals.total += defect.total;
        uniqueDefectsSet.add(defect.defectId || defect.defectName);

        // Aggregate for AQL table
        const defectKey = defect.defectId || defect.defectName;
        if (!allDefectsMap[defectKey]) {
          allDefectsMap[defectKey] = {
            defectId: defect.defectId,
            defectName: defect.defectName,
            defectCode: defect.defectCode,
            minor: 0,
            major: 0,
            critical: 0,
            total: 0
          };
        }
        allDefectsMap[defectKey].minor += defect.minor;
        allDefectsMap[defectKey].major += defect.major;
        allDefectsMap[defectKey].critical += defect.critical;
        allDefectsMap[defectKey].total += defect.total;
      });
    });

    const defectsList = Object.values(allDefectsMap).sort((a, b) => {
      const codeA = parseFloat(a.defectCode) || 0;
      const codeB = parseFloat(b.defectCode) || 0;
      return codeA - codeB;
    });

    return {
      groups,
      totals,
      uniqueDefects: uniqueDefectsSet.size,
      defectsList
    };
  }, [savedDefects, activeGroup]);

  // Calculate AQL Pass/Fail Result
  const aqlResult = useMemo(() => {
    if (!isAQLMethod || !aqlSampleData.baseConfig) {
      return null;
    }

    const {
      minor: minorSample,
      major: majorSample,
      critical: criticalSample
    } = aqlSampleData;
    const {
      minor: minorCount,
      major: majorCount,
      critical: criticalCount
    } = summaryData.totals;

    // Determine pass/fail for each status
    // Pass if actual count <= Accept value (Ac)
    // Fail if actual count >= Reject value (Re)
    const getStatus = (count, sample) => {
      if (!sample || sample.Ac === null || sample.Ac === undefined) {
        return { status: "N/A", reason: "No AQL config" };
      }

      const ac = parseInt(sample.Ac);
      const re = parseInt(sample.Re);

      if (count <= ac) {
        return { status: "PASS", reason: `${count} ≤ ${ac} (Ac)` };
      } else {
        return { status: "FAIL", reason: `${count} ≥ ${re} (Re)` };
      }
    };

    const minorResult = getStatus(minorCount, minorSample);
    const majorResult = getStatus(majorCount, majorSample);
    const criticalResult = getStatus(criticalCount, criticalSample);

    // Final result: PASS only if ALL pass
    const allPass =
      minorResult.status === "PASS" &&
      majorResult.status === "PASS" &&
      criticalResult.status === "PASS";

    // If any is N/A, check only the ones that have config
    const hasAnyFail =
      minorResult.status === "FAIL" ||
      majorResult.status === "FAIL" ||
      criticalResult.status === "FAIL";

    let finalStatus = "PASS";
    if (hasAnyFail) {
      finalStatus = "FAIL";
    }

    return {
      minor: {
        ...minorResult,
        count: minorCount,
        ac: minorSample?.Ac,
        re: minorSample?.Re
      },
      major: {
        ...majorResult,
        count: majorCount,
        ac: majorSample?.Ac,
        re: majorSample?.Re
      },
      critical: {
        ...criticalResult,
        count: criticalCount,
        ac: criticalSample?.Ac,
        re: criticalSample?.Re
      },
      final: finalStatus,
      sampleSize: minorSample?.SampleSize || majorSample?.SampleSize || 0,
      batch: minorSample?.BatchName || majorSample?.BatchName || "N/A",
      sampleLetter:
        minorSample?.SampleLetter || majorSample?.SampleLetter || "N/A"
    };
  }, [isAQLMethod, aqlSampleData, summaryData.totals]);

  // Calculate group subtotals
  const getGroupSubtotals = (defects) => {
    return defects.reduce(
      (acc, defect) => ({
        minor: acc.minor + defect.minor,
        major: acc.major + defect.major,
        critical: acc.critical + defect.critical,
        total: acc.total + defect.total
      }),
      { minor: 0, major: 0, critical: 0, total: 0 }
    );
  };

  if (!savedDefects || savedDefects.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <FileSpreadsheet className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-bold text-gray-600 dark:text-gray-300">
            No Defects Recorded
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Add defects from the "Select Defects" tab to see the summary.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Header Card with Stats */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-5 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Defect Summary</h2>
              <p className="text-xs text-slate-400">
                {summaryData.groups.length} configuration(s) •{" "}
                {summaryData.uniqueDefects} unique defect(s)
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="text-center px-4 py-2 bg-white/10 rounded-xl">
              <p className="text-2xl font-black">{summaryData.totals.total}</p>
              <p className="text-[9px] uppercase tracking-wider opacity-70">
                Total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table by Config */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Defect Summary by Configuration
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                <th className="px-4 py-3 text-left font-bold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 min-w-[160px]">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Config
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 min-w-[180px]">
                  Defect Name
                </th>
                <th className="px-3 py-3 text-center font-bold text-xs uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 w-[80px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  Minor
                </th>
                <th className="px-3 py-3 text-center font-bold text-xs uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 w-[80px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                  Major
                </th>
                <th className="px-3 py-3 text-center font-bold text-xs uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 w-[80px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                  Critical
                </th>
                <th className="px-3 py-3 text-center font-bold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[80px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {summaryData.groups.map((group, groupIndex) => {
                const totalRows = group.defects.length;

                return group.defects.map((defect, defectIndex) => (
                  <tr
                    key={`${group.configKey}-${defect.defectId}-${defectIndex}`}
                    className={`border-b border-gray-100 dark:border-gray-700/50 ${
                      group.isActive
                        ? "bg-green-50/50 dark:bg-green-900/10"
                        : groupIndex % 2 === 0
                        ? "bg-white dark:bg-gray-800"
                        : "bg-gray-50/50 dark:bg-gray-800/50"
                    } hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors`}
                  >
                    {defectIndex === 0 && (
                      <td
                        rowSpan={totalRows}
                        className={`px-4 py-3 align-top border-r border-gray-200 dark:border-gray-700 ${
                          group.isActive
                            ? "bg-green-100/50 dark:bg-green-900/20"
                            : "bg-gray-50 dark:bg-gray-900/30"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Layers
                              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                group.isActive
                                  ? "text-green-500"
                                  : "text-gray-400"
                              }`}
                            />
                            <div className="min-w-0">
                              {group.lineName && (
                                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                  Line {group.lineName}
                                </p>
                              )}
                              {group.tableName && (
                                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                  Table {group.tableName}
                                </p>
                              )}
                              {group.colorName && (
                                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                  {group.colorName}
                                </p>
                              )}
                            </div>
                          </div>
                          {group.isActive && (
                            <span className="inline-flex px-2 py-0.5 bg-green-500 text-white text-[8px] font-bold rounded-full uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    <td className="px-4 py-2.5 border-r border-gray-100 dark:border-gray-700/50">
                      <div className="flex items-center gap-2">
                        <span className="flex-shrink-0 font-mono text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 min-w-[36px] text-center">
                          {defect.defectCode}
                        </span>
                        <span
                          className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate"
                          title={defect.defectName}
                        >
                          {defect.defectName}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-center border-r border-gray-100 dark:border-gray-700/50">
                      {defect.minor > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-bold text-xs rounded-lg">
                          {defect.minor}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">
                          -
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-center border-r border-gray-100 dark:border-gray-700/50">
                      {defect.major > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 font-bold text-xs rounded-lg">
                          {defect.major}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">
                          -
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-center border-r border-gray-100 dark:border-gray-700/50">
                      {defect.critical > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-bold text-xs rounded-lg">
                          {defect.critical}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">
                          -
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold text-sm rounded-lg">
                        {defect.total}
                      </span>
                    </td>
                  </tr>
                ));
              })}

              {/* Grand Totals Row */}
              <tr className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white">
                <td
                  colSpan={2}
                  className="px-4 py-4 text-right font-bold text-xs uppercase tracking-wider border-r border-gray-600"
                >
                  <div className="flex items-center justify-end gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Grand Total
                  </div>
                </td>
                <td className="px-3 py-4 text-center border-r border-gray-600">
                  {summaryData.totals.minor > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[36px] h-8 px-3 bg-green-500 text-white font-bold text-sm rounded-lg shadow-lg">
                      {summaryData.totals.minor}
                    </span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-3 py-4 text-center border-r border-gray-600">
                  {summaryData.totals.major > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[36px] h-8 px-3 bg-orange-500 text-white font-bold text-sm rounded-lg shadow-lg">
                      {summaryData.totals.major}
                    </span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-3 py-4 text-center border-r border-gray-600">
                  {summaryData.totals.critical > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[36px] h-8 px-3 bg-red-500 text-white font-bold text-sm rounded-lg shadow-lg">
                      {summaryData.totals.critical}
                    </span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-3 py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[40px] h-9 px-3 bg-white text-indigo-700 font-black text-base rounded-lg shadow-lg">
                    {summaryData.totals.total}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* AQL Defect Result Section - Only show if AQL method */}
      {isAQLMethod && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Report: Defect Result (AQL)
            </h3>
          </div>

          <div className="p-4 space-y-4">
            {loadingAql ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : aqlResult ? (
              <>
                {/* AQL Configuration Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  <div className="p-2.5 bg-gray-100 dark:bg-gray-900 rounded-lg text-center">
                    <p className="text-[9px] text-gray-500 uppercase font-medium">
                      Type
                    </p>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {aqlSampleData.baseConfig?.InspectionType || "N/A"}
                    </p>
                  </div>
                  <div className="p-2.5 bg-gray-100 dark:bg-gray-900 rounded-lg text-center">
                    <p className="text-[9px] text-gray-500 uppercase font-medium">
                      Level
                    </p>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {aqlSampleData.baseConfig?.Level || "N/A"}
                    </p>
                  </div>
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-center">
                    <p className="text-[9px] text-purple-600 uppercase font-medium">
                      Batch
                    </p>
                    <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
                      {aqlResult.batch}
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-center">
                    <p className="text-[9px] text-emerald-600 uppercase font-medium">
                      Sample Letter
                    </p>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {aqlResult.sampleLetter}
                    </p>
                  </div>
                  <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg text-center">
                    <p className="text-[9px] text-cyan-600 uppercase font-medium">
                      Sample Size
                    </p>
                    <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                      {aqlResult.sampleSize}
                    </p>
                  </div>
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-center">
                    <p className="text-[9px] text-indigo-600 uppercase font-medium">
                      Inspected Qty
                    </p>
                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      {inspectedQty}
                    </p>
                  </div>
                </div>

                {/* AQL Levels */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-lg text-center border border-green-200 dark:border-green-800">
                    <p className="text-[9px] text-green-600 uppercase font-medium">
                      Minor AQL
                    </p>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300">
                      {aqlSampleData.minorConfig?.AQLLevel || "N/A"}
                    </p>
                  </div>
                  <div className="p-2.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-center border border-orange-200 dark:border-orange-800">
                    <p className="text-[9px] text-orange-600 uppercase font-medium">
                      Major AQL
                    </p>
                    <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
                      {aqlSampleData.majorConfig?.AQLLevel || "N/A"}
                    </p>
                  </div>
                  <div className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-lg text-center border border-red-200 dark:border-red-800">
                    <p className="text-[9px] text-red-600 uppercase font-medium">
                      Critical AQL
                    </p>
                    <p className="text-sm font-bold text-red-700 dark:text-red-300">
                      {aqlSampleData.criticalConfig?.AQLLevel || "N/A"}
                    </p>
                  </div>
                </div>

                {/* AQL Result Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                          Defect Name
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider w-[80px] bg-green-600/80">
                          Minor
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider w-[80px] bg-orange-600/80">
                          Major
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider w-[80px] bg-red-600/80">
                          Critical
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider w-[80px]">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.defectsList.map((defect, idx) => (
                        <tr
                          key={defect.defectId || idx}
                          className={`border-b border-gray-200 dark:border-gray-700 ${
                            idx % 2 === 0
                              ? "bg-white dark:bg-gray-800"
                              : "bg-gray-50 dark:bg-gray-800/50"
                          }`}
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">
                                {defect.defectCode}
                              </span>
                              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {defect.defectName}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {defect.minor > 0 ? (
                              <span className="font-bold text-green-700 dark:text-green-400">
                                {defect.minor}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {defect.major > 0 ? (
                              <span className="font-bold text-orange-700 dark:text-orange-400">
                                {defect.major}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {defect.critical > 0 ? (
                              <span className="font-bold text-red-700 dark:text-red-400">
                                {defect.critical}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-gray-800 dark:text-gray-200">
                            {defect.total}
                          </td>
                        </tr>
                      ))}

                      {/* Totals Row */}
                      <tr className="bg-gray-100 dark:bg-gray-900 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                        <td className="px-4 py-3 text-right text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">
                          Total
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-green-700 dark:text-green-400 text-sm">
                            {summaryData.totals.minor}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-orange-700 dark:text-orange-400 text-sm">
                            {summaryData.totals.major}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-red-700 dark:text-red-400 text-sm">
                            {summaryData.totals.critical}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-indigo-700 dark:text-indigo-400 text-base">
                            {summaryData.totals.total}
                          </span>
                        </td>
                      </tr>

                      {/* Ac/Re Row */}
                      <tr className="bg-gray-200 dark:bg-gray-800 text-xs">
                        <td className="px-4 py-2 text-right font-medium text-gray-500">
                          Ac / Re
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-green-600">
                            {aqlResult.minor.ac ?? "—"} /{" "}
                            {aqlResult.minor.re ?? "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-orange-600">
                            {aqlResult.major.ac ?? "—"} /{" "}
                            {aqlResult.major.re ?? "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-red-600">
                            {aqlResult.critical.ac ?? "—"} /{" "}
                            {aqlResult.critical.re ?? "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-gray-400">—</span>
                        </td>
                      </tr>

                      {/* Status Row */}
                      <tr className="bg-gray-100 dark:bg-gray-900">
                        <td className="px-4 py-3 text-right font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">
                          Status
                        </td>
                        <td className="px-3 py-3 text-center">
                          {aqlResult.minor.status === "PASS" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded-lg">
                              <ThumbsUp className="w-3 h-3" />
                              PASS
                            </span>
                          ) : aqlResult.minor.status === "FAIL" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg">
                              <ThumbsDown className="w-3 h-3" />
                              FAIL
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {aqlResult.major.status === "PASS" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded-lg">
                              <ThumbsUp className="w-3 h-3" />
                              PASS
                            </span>
                          ) : aqlResult.major.status === "FAIL" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg">
                              <ThumbsDown className="w-3 h-3" />
                              FAIL
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {aqlResult.critical.status === "PASS" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded-lg">
                              <ThumbsUp className="w-3 h-3" />
                              PASS
                            </span>
                          ) : aqlResult.critical.status === "FAIL" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg">
                              <ThumbsDown className="w-3 h-3" />
                              FAIL
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-gray-400">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Final Result Banner */}
                <div
                  className={`p-6 rounded-xl border-2 ${
                    aqlResult.final === "PASS"
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700"
                      : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-300 dark:border-red-700"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div
                      className={`p-4 rounded-full ${
                        aqlResult.final === "PASS"
                          ? "bg-green-100 dark:bg-green-800/50"
                          : "bg-red-100 dark:bg-red-800/50"
                      }`}
                    >
                      {aqlResult.final === "PASS" ? (
                        <Award className="w-10 h-10 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Final Defect Result
                      </p>
                      <p
                        className={`text-4xl font-black ${
                          aqlResult.final === "PASS"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {aqlResult.final}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {aqlResult.final === "PASS"
                          ? "All defect categories are within acceptable limits"
                          : "One or more defect categories exceeded acceptable limits"}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  AQL Configuration Not Available
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  Please ensure inspected quantity is entered and AQL
                  configuration is set for buyer: {determinedBuyer}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Layers className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
              Configs
            </p>
          </div>
          <p className="text-2xl font-black text-gray-800 dark:text-gray-200">
            {summaryData.groups.length}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-md border border-green-200 dark:border-green-800 p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-100 dark:bg-green-800/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-[10px] text-green-600 dark:text-green-400 uppercase tracking-wider font-medium">
              Minor
            </p>
          </div>
          <p className="text-2xl font-black text-green-700 dark:text-green-400">
            {summaryData.totals.minor}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl shadow-md border border-orange-200 dark:border-orange-800 p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-800/50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-[10px] text-orange-600 dark:text-orange-400 uppercase tracking-wider font-medium">
              Major
            </p>
          </div>
          <p className="text-2xl font-black text-orange-700 dark:text-orange-400">
            {summaryData.totals.major}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl shadow-md border border-red-200 dark:border-red-800 p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-100 dark:bg-red-800/50 rounded-lg">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-wider font-medium">
              Critical
            </p>
          </div>
          <p className="text-2xl font-black text-red-700 dark:text-red-400">
            {summaryData.totals.critical}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default YPivotQAInspectionDefectSummary;
