import React from "react";

const WashingSpecsDataPreview = ({ moNo, specData }) => {
  if (!specData || !specData.rows || specData.rows.length === 0) {
    return null;
  }

  return (
    <div className="mb-10 bg-white p-4 sm:p-6 rounded-lg shadow-xl">
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
        {moNo} | {specData.sheetName}
      </h2>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th
                rowSpan="2"
                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r"
              >
                Measurement Point - Eng
              </th>
              <th
                rowSpan="2"
                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r"
              >
                Measurement Point - Chi
              </th>
              <th
                rowSpan="2"
                className="px-2 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider border-r"
              >
                Tol (-)
              </th>
              <th
                rowSpan="2"
                className="px-2 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider border-r"
              >
                Tol (+)
              </th>
              {specData.headers.map((header) => (
                <th
                  key={header.size}
                  colSpan="2"
                  className="px-6 py-3 text-center text-sm font-bold text-gray-700 uppercase tracking-wider border-r"
                >
                  {header.size}
                </th>
              ))}
            </tr>
            <tr>
              {specData.headers.map((header) => (
                <React.Fragment key={`${header.size}-specs`}>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r">
                    After Washing
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r">
                    Before Washing
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {specData.rows.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-800 border-r">
                  {row["Measurement Point - Eng"]}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800 border-r">
                  {row["Measurement Point - Chi"]}
                </td>
                <td className="px-2 py-3 text-center text-sm text-red-600 border-r">
                  {row["Tol Minus"].raw}
                </td>
                <td className="px-2 py-3 text-center text-sm text-green-600 border-r">
                  {row["Tol Plus"].raw}
                </td>
                {specData.headers.map((header) => (
                  <React.Fragment key={`${header.size}-${index}`}>
                    <td className="px-3 py-3 text-center text-sm text-gray-900 border-r">
                      {row.specs[header.size]["After Washing"].raw}
                    </td>
                    <td className="px-3 py-3 text-center text-sm text-gray-900 border-r">
                      {row.specs[header.size]["Before Washing"].raw}
                    </td>
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WashingSpecsDataPreview;
