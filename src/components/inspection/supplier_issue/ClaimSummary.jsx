import React, { useMemo } from "react";

const CLAIM_RATE_PER_HR_USD = 4.38;
const USD_TO_KHR_RATE = 4000;

const ClaimSummary = ({ totalSeconds }) => {
  const summary = useMemo(() => {
    const totalHours = totalSeconds / 3600;
    const totalUSD = totalHours * CLAIM_RATE_PER_HR_USD;
    const totalKHR = totalUSD * USD_TO_KHR_RATE;

    return {
      totalHours: totalHours.toFixed(2),
      totalUSD: totalUSD.toFixed(4),
      totalKHR: totalKHR.toLocaleString("en-US", { maximumFractionDigits: 0 })
    };
  }, [totalSeconds]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
        Claimed Money Summary
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase">
            <tr>
              <th className="p-2 text-left">Total Time (Hrs)</th>
              <th className="p-2 text-left">Claim Rate ($/Hr)</th>
              <th className="p-2 text-right">Total Money ($)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b dark:border-gray-700">
              <td className="p-2 font-semibold">{summary.totalHours}</td>
              <td className="p-2">${CLAIM_RATE_PER_HR_USD.toFixed(2)}</td>
              <td className="p-2 text-right font-bold text-green-600 dark:text-green-400 text-lg">
                ${summary.totalUSD}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
        (Equivalent to approx. {summary.totalKHR} KHR)
      </p>
    </div>
  );
};

export default ClaimSummary;
