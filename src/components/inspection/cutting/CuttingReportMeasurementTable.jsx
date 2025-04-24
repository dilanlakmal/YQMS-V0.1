import React from "react";

// Helper function to convert decimal to fraction
const decimalToFraction = (decimal) => {
  if (decimal === 0) return "0";

  const sign = decimal < 0 ? "-" : "";
  decimal = Math.abs(decimal);

  const precision = 10000; // To handle floating-point precision issues
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const numerator = Math.round(decimal * precision);
  const denominator = precision;
  const divisor = gcd(numerator, denominator);

  const num = numerator / divisor;
  const den = denominator / divisor;

  // Simplify common fractions
  if (den === 1) return `${sign}${num}`;
  if (num === 1 && den === 8) return `${sign}1/8`;
  if (num === 1 && den === 16) return `${sign}1/16`;
  if (num === 1 && den === 32) return `${sign}1/32`;
  if (num === 1 && den === 4) return `${sign}1/4`;
  if (num === 3 && den === 8) return `${sign}3/8`;
  if (num === 5 && den === 8) return `${sign}5/8`;
  if (num === 3 && den === 4) return `${sign}3/4`;

  return `${sign}${num}/${den}`;
};

const CuttingReportMeasurementTable = ({ panel }) => {
  // Determine the number of sub-columns for Top, Middle, Bottom
  const getSubColumns = (location) => {
    const md = panel.measurementData.find((m) => m.location === location);
    if (!md) return [];
    const allPartNames = md.measurementPointData.flatMap((mpd) =>
      mpd.measurementValues.map((mv) => mv.partName)
    );
    const uniquePartNames = [...new Set(allPartNames)].sort(); // Sort for consistency (e.g., T1, T2, ...)
    return uniquePartNames;
  };

  const topSubColumns = getSubColumns("Top");
  const middleSubColumns = getSubColumns("Middle");
  const bottomSubColumns = getSubColumns("Bottom");

  // Get all unique measurement point names across Top, Middle, Bottom
  const allPoints = panel.measurementData.flatMap((md) =>
    md.measurementPointData.map((mpd) => mpd.measurementPointName)
  );
  const uniquePoints = [...new Set(allPoints)];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-900 rounded-lg shadow-md mb-4">
        <thead className="bg-gray-200">
          {/* First Row: Measurement Point (merged), Top, Middle, Bottom */}
          <tr>
            <th
              rowSpan={2}
              className="px-4 py-2 text-left text-sm font-medium text-gray-900 border border-gray-900 align-middle"
            >
              Measurement Point
            </th>
            <th
              className="px-4 py-2 text-center text-sm font-medium text-gray-900 border border-gray-900"
              colSpan={topSubColumns.length || 1}
            >
              Top
            </th>
            <th
              className="px-4 py-2 text-center text-sm font-medium text-gray-900 border border-gray-900"
              colSpan={middleSubColumns.length || 1}
            >
              Middle
            </th>
            <th
              className="px-4 py-2 text-center text-sm font-medium text-gray-900 border border-gray-900"
              colSpan={bottomSubColumns.length || 1}
            >
              Bottom
            </th>
          </tr>
          {/* Second Row: Sub-columns for Top, Middle, Bottom */}
          <tr>
            {topSubColumns.length > 0 ? (
              topSubColumns.map((partName) => (
                <th
                  key={partName}
                  className="px-4 py-2 text-center text-sm font-medium text-gray-900 border border-gray-900"
                >
                  {partName}
                </th>
              ))
            ) : (
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-900 border border-gray-900">
                -
              </th>
            )}
            {middleSubColumns.length > 0 ? (
              middleSubColumns.map((partName) => (
                <th
                  key={partName}
                  className="px-4 py-2 text-center text-sm font-medium text-gray-900 border border-gray-900"
                >
                  {partName}
                </th>
              ))
            ) : (
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-900 border border-gray-900">
                -
              </th>
            )}
            {bottomSubColumns.length > 0 ? (
              bottomSubColumns.map((partName) => (
                <th
                  key={partName}
                  className="px-4 py-2 text-center text-sm font-medium text-gray-900 border border-gray-900"
                >
                  {partName}
                </th>
              ))
            ) : (
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-900 border border-gray-900">
                -
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {uniquePoints.map((pointName, pointIdx) => (
            <tr key={pointIdx}>
              <td className="px-4 py-2 text-sm text-gray-900 border border-gray-900">
                {pointName}
              </td>
              {/* Top Sub-columns */}
              {topSubColumns.length > 0 ? (
                topSubColumns.map((partName) => {
                  const md = panel.measurementData.find(
                    (m) => m.location === "Top"
                  );
                  const mpd = md?.measurementPointData.find(
                    (mp) => mp.measurementPointName === pointName
                  );
                  const mv = mpd?.measurementValues.find(
                    (v) => v.partName === partName
                  );
                  return (
                    <td
                      key={partName}
                      className={`px-4 py-2 text-sm text-gray-900 border border-gray-900 text-center ${
                        mv
                          ? mv.status === "Pass"
                            ? "bg-green-100"
                            : "bg-red-100"
                          : ""
                      }`}
                    >
                      {mv ? decimalToFraction(mv.measurement) : "0"}
                    </td>
                  );
                })
              ) : (
                <td className="px-4 py-2 text-sm text-gray-900 border border-gray-900 text-center">
                  0
                </td>
              )}
              {/* Middle Sub-columns */}
              {middleSubColumns.length > 0 ? (
                middleSubColumns.map((partName) => {
                  const md = panel.measurementData.find(
                    (m) => m.location === "Middle"
                  );
                  const mpd = md?.measurementPointData.find(
                    (mp) => mp.measurementPointName === pointName
                  );
                  const mv = mpd?.measurementValues.find(
                    (v) => v.partName === partName
                  );
                  return (
                    <td
                      key={partName}
                      className={`px-4 py-2 text-sm text-gray-900 border border-gray-900 text-center ${
                        mv
                          ? mv.status === "Pass"
                            ? "bg-green-100"
                            : "bg-red-100"
                          : ""
                      }`}
                    >
                      {mv ? decimalToFraction(mv.measurement) : "0"}
                    </td>
                  );
                })
              ) : (
                <td className="px-4 py-2 text-sm text-gray-900 border border-gray-900 text-center">
                  0
                </td>
              )}
              {/* Bottom Sub-columns */}
              {bottomSubColumns.length > 0 ? (
                bottomSubColumns.map((partName) => {
                  const md = panel.measurementData.find(
                    (m) => m.location === "Bottom"
                  );
                  const mpd = md?.measurementPointData.find(
                    (mp) => mp.measurementPointName === pointName
                  );
                  const mv = mpd?.measurementValues.find(
                    (v) => v.partName === partName
                  );
                  return (
                    <td
                      key={partName}
                      className={`px-4 py-2 text-sm text-gray-900 border border-gray-900 text-center ${
                        mv
                          ? mv.status === "Pass"
                            ? "bg-green-100"
                            : "bg-red-100"
                          : ""
                      }`}
                    >
                      {mv ? decimalToFraction(mv.measurement) : "0"}
                    </td>
                  );
                })
              ) : (
                <td className="px-4 py-2 text-sm text-gray-900 border border-gray-900 text-center">
                  0
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CuttingReportMeasurementTable;
