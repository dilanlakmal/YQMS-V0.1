// src/components/inspection/cutting/report/trends/TrendTable.jsx
import { Loader2 } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

const TrendTable = ({
  title,
  headers,
  data,
  renderRow,
  appliedFiltersText,
  titleIcon,
  loading,
  noDataMessageKey = "cutting.noDataForChart"
}) => {
  const { t } = useTranslation();

  return (
    <div className="mb-8 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-700 mb-1 flex items-center">
        {titleIcon &&
          React.createElement(titleIcon, {
            className: "mr-2 h-6 w-6 text-blue-600"
          })}
        {title}
        {appliedFiltersText && (
          <span className="text-xs text-gray-500 ml-2">
            {appliedFiltersText}
          </span>
        )}
      </h2>
      {loading && (
        <div className="flex justify-center p-4">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      )}
      {!loading && data.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          {t(noDataMessageKey)}
        </p>
      )}
      {!loading && data.length > 0 && (
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300 text-xs">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    scope="col"
                    className={`px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider border-r ${
                      header.className || ""
                    } ${
                      header.sticky
                        ? `sticky ${header.left || "left-0"} bg-gray-50 z-10`
                        : ""
                    }`}
                  >
                    {header.label}
                    {header.subHeaders && (
                      <div className="flex justify-around mt-1">
                        {header.subHeaders.map((sub) => (
                          <span key={sub} className="text-xxs font-normal">
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map(renderRow)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TrendTable;
