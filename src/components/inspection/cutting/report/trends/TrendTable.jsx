// src/components/inspection/cutting/report/trends/TrendTable.jsx

import { Loader2, FileText, AlertCircle, BarChart3 } from "lucide-react";
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
  noDataMessageKey = "cutting.noDataForChart",
  customHeaderContent
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
      {/* Enhanced Header Section */}
      {title && (
        <div className="relative p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10"></div>
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              {titleIcon && (
                <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl">
                  {React.createElement(titleIcon, {
                    className: "h-6 w-6 text-blue-600 dark:text-blue-400"
                  })}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {title}
                </h2>
                {appliedFiltersText && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {appliedFiltersText}
                  </p>
                )}
              </div>
            </div>
            
            {/* Data Count Badge */}
            {!loading && data.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <BarChart3 size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  {data.length} {data.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>
            )}
          </div>
          
          {/* Custom Header Content (like legends) */}
          {customHeaderContent && (
            <div className="relative mt-4">
              {customHeaderContent}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-16">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
            <Loader2 className="absolute inset-0 w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mt-4">
            Loading data...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Please wait while we process your request
          </p>
        </div>
      )}

      {/* No Data State */}
      {!loading && data.length === 0 && (
        <div className="flex flex-col items-center justify-center p-16">
          <div className="p-6 bg-gray-100 dark:bg-gray-700/50 rounded-full w-20 h-20 flex items-center justify-center mb-6">
            <AlertCircle size={40} className="text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
            {t(noDataMessageKey)}
          </p>
        </div>
      )}

      {/* Enhanced Table */}
      {!loading && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
            {/* Enhanced Table Header */}
            <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 backdrop-blur-sm">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    scope="col"
                    className={`px-4 py-4 text-left font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200/50 dark:border-gray-600/50 text-xs ${
                      header.className || ""
                    } ${
                      header.sticky
                        ? `sticky ${header.left || "left-0"} bg-gradient-to-r from-gray-50/90 to-gray-100/90 dark:from-gray-700/90 dark:to-gray-800/90 z-20 backdrop-blur-sm`
                        : ""
                    }`}
                    style={header.sticky ? { left: header.left || "0" } : {}}
                  >
                    <div className="flex items-center gap-2">
                      {header.icon && (
                        <div className="p-1 bg-white dark:bg-gray-600 rounded-lg">
                          {React.createElement(header.icon, {
                            className: "h-4 w-4 text-blue-600 dark:text-blue-400"
                          })}
                        </div>
                      )}
                      <span>{header.label}</span>
                    </div>
                    
                    {/* Sub Headers */}
                    {header.subHeaders && (
                      <div className="flex justify-around mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        {header.subHeaders.map((sub, subIndex) => (
                          <span 
                            key={subIndex} 
                            className="text-xs font-medium text-gray-500 dark:text-gray-400 normal-case"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Enhanced Table Body */}
            <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/30 dark:divide-gray-700/30">
              {data.map((item, index) => {
                const rowElement = renderRow(item, index, data);
                
                // If renderRow returns a fragment with multiple rows, handle it
                if (React.isValidElement(rowElement) && rowElement.type === React.Fragment) {
                  return React.cloneElement(rowElement, {
                    key: rowElement.key || index
                  });
                }
                
                // For single row elements, add enhanced styling
                if (React.isValidElement(rowElement)) {
                  return React.cloneElement(rowElement, {
                    key: rowElement.key || index,
                    className: `${rowElement.props.className || ''} hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-200 group`
                  });
                }
                
                return rowElement;
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Enhanced Footer */}
      {!loading && data.length > 0 && (
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText size={16} className="text-blue-500 dark:text-blue-400" />
              <span className="font-medium">
                Total Records: <span className="font-bold text-gray-900 dark:text-gray-100">{data.length}</span>
              </span>
            </div>
            
            {/* Additional footer content can be added here */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Data updated in real-time</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendTable;
