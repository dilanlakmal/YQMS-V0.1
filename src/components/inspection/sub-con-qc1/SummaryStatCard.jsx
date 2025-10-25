import { TrendingDown, TrendingUp } from "lucide-react";
import React from "react";

const SummaryStatCard = ({
  cardType = "default",
  title,
  icon,
  gradientFrom,
  gradientTo,
  iconBg,
  iconColor,
  qcData = [],
  total,
  totalMinor = 0,
  totalMajor = 0,
  totalCritical = 0,
  isPercentage = false
}) => {
  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:border-transparent">
      {/* Animated gradient border on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`}
      ></div>
      <div className="absolute inset-[2px] bg-white dark:bg-gray-800 rounded-2xl z-0"></div>

      {/* Content */}
      <div className="relative z-10 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl ${iconBg} ${iconColor} transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                {title}
              </h3>
            </div>
          </div>
        </div>

        {/* QC Breakdown List */}
        <div className="space-y-2 mb-4">
          {qcData.map((qc, index) => {
            // Determine if this QC is above threshold
            let isQcAboveThreshold = false;

            if (cardType === "rejectPcs") {
              isQcAboveThreshold = qc.hasMajorOrCritical || false;
            } else if (cardType === "defectQty") {
              // Above if Minor > 1 OR Major >= 1 OR Critical >= 1
              isQcAboveThreshold =
                (qc.minorCount || 0) > 1 ||
                (qc.majorCount || 0) >= 1 ||
                (qc.criticalCount || 0) >= 1;
            } else if (cardType === "defectRate") {
              const rate = parseFloat(qc.value);
              // Above if rate > 5% OR (rate > 0 AND has Major/Critical)
              isQcAboveThreshold =
                rate > 5 || (rate > 0 && (qc.hasMajorOrCritical || false));
            }

            return (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo}`}
                    ></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {qc.qcLabel}
                    </span>
                  </div>
                  <span className="text-base font-bold text-gray-900 dark:text-gray-100 ml-2">
                    {qc.value}
                  </span>
                </div>

                {/* Defect Breakdown for defectQty card */}
                {cardType === "defectQty" &&
                  (qc.minorCount > 0 ||
                    qc.majorCount > 0 ||
                    qc.criticalCount > 0) && (
                    <div className="px-3 pb-2 pt-0">
                      <div className="flex gap-2 text-xs flex-wrap">
                        {qc.minorCount > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-md">
                            <span className="font-semibold">Minor:</span>
                            <span>{qc.minorCount}</span>
                          </div>
                        )}
                        {qc.majorCount > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-md">
                            <span className="font-semibold">Major:</span>
                            <span>{qc.majorCount}</span>
                          </div>
                        )}
                        {qc.criticalCount > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
                            <span className="font-semibold">Critical:</span>
                            <span>{qc.criticalCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Individual QC Threshold Indicator */}
                {cardType !== "checkedQty" && (
                  <div className="px-3 pb-3 pt-1">
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        isQcAboveThreshold
                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                          : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                      }`}
                    >
                      {isQcAboveThreshold ? (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          <span>Above Threshold</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3" />
                          <span>Within Limits</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total Section with Gradient Background */}
        <div
          className={`relative p-4 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} overflow-hidden shadow-lg`}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Total
                </span>
              </div>
              <div className="text-right">
                <div className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">
                  {total}
                </div>
              </div>
            </div>

            {/* Defect Breakdown for Total */}
            {cardType === "defectQty" &&
              (totalMinor > 0 || totalMajor > 0 || totalCritical > 0) && (
                <div className="mt-3 pt-3 border-t border-white/30">
                  <div className="flex flex-wrap gap-2 justify-end">
                    {totalMinor > 0 && (
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg text-xs font-bold">
                        <span>Minor:</span>
                        <span>{totalMinor}</span>
                      </div>
                    )}
                    {totalMajor > 0 && (
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg text-xs font-bold">
                        <span>Major:</span>
                        <span>{totalMajor}</span>
                      </div>
                    )}
                    {totalCritical > 0 && (
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg text-xs font-bold">
                        <span>Critical:</span>
                        <span>{totalCritical}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Quality indicator for percentage */}
            {isPercentage && parseFloat(total) > 0 && (
              <div className="text-xs text-white/80 font-semibold mt-2 text-right">
                {parseFloat(total) <= 2
                  ? "Excellent"
                  : parseFloat(total) <= 5
                  ? "Good"
                  : "Needs Improvement"}
              </div>
            )}

            {/* Progress bar for percentage */}
            {isPercentage && (
              <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min(parseFloat(total) * 10, 100)}%`
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Note: No threshold indicator for Total - as per requirement */}
      </div>

      {/* Bottom accent line with animation */}
      <div className="h-1.5 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent group-hover:via-current transition-all duration-500"></div>
      <div
        className={`absolute bottom-0 left-0 h-1.5 bg-gradient-to-r ${gradientFrom} ${gradientTo} w-0 group-hover:w-full transition-all duration-700 ease-out`}
      ></div>
    </div>
  );
};

export default SummaryStatCard;
