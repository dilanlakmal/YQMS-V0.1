// YPivotQATemplatesMeasurementResultsTab.jsx
import React from "react";
import {
  Edit3,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { calculateMeasurementStats } from "./YPivotQATemplatesHelpers";

const YPivotQATemplatesMeasurementResultsTab = ({
  savedMeasurements,
  specsData,
  onEditMeasurement
}) => {
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

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-indigo-500" />
        Measurement Results
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedMeasurements.map((measurement, index) => {
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

          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Card Header */}
              <div
                className={`p-4 ${
                  stats.totalFailPoints === 0
                    ? "bg-gradient-to-r from-green-500 to-emerald-600"
                    : stats.totalFailPoints > stats.totalPassPoints
                    ? "bg-gradient-to-r from-red-500 to-rose-600"
                    : "bg-gradient-to-r from-yellow-500 to-orange-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold text-lg">
                      Size: {measurement.size}
                    </h4>
                    <p className="text-white/80 text-xs mt-0.5">
                      {measurement.measType} Wash
                      {measurement.kValue && ` • K: ${measurement.kValue}`}
                    </p>
                  </div>
                  <button
                    onClick={() => onEditMeasurement(measurement, index)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="p-4 space-y-4">
                {/* Points Summary */}
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

                {/* Pcs Summary */}
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

                {/* Tolerance Direction */}
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

                {/* Pass Rate Bar */}
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

                {/* Pcs Pass Rate Bar */}
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

              {/* Timestamp */}
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                <p className="text-[10px] text-gray-400 text-center">
                  {new Date(measurement.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default YPivotQATemplatesMeasurementResultsTab;
