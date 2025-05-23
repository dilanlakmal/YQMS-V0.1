import React from "react";

const DataTableWOI = ({
  tableData,
  totalRecords,
  page,
  limit,
  handlePageChange
}) => {
  if (!tableData)
    return (
      <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500">
        Loading table data...
      </div>
    );

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">
            Washing Transaction Log
          </h3>
        </div>
        <div className="max-h-[60vh] overflow-auto">
          {" "}
          {/* Changed to overflow-auto for both axes */}
          <table className="min-w-full table-fixed">
            <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white sticky top-0 z-10 shadow-md">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold w-[10%]">
                  MO No
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold w-[10%]">
                  Cust. Style
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold w-[10%]">
                  Buyer
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold w-[8%]">
                  Color
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold w-[7%]">
                  Size
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold w-[10%]">
                  Emp ID
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold w-[10%]">
                  Date
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold w-[8%]">
                  Time
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold w-[15%] border-r border-gray-300">
                  Bundle Qty
                  <div className="flex justify-between text-xxs mt-1 border-t border-gray-300 pt-1">
                    <span className="w-1/3">First</span>
                    <span className="w-1/3 border-l border-gray-300">
                      Defect.
                    </span>
                    <span className="w-1/3 border-l border-gray-300">
                      Total
                    </span>
                  </div>
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold w-[12%]">
                  Garments
                  <div className="flex justify-between text-xxs mt-1 border-t border-gray-300 pt-1">
                    <span className="w-1/3">First</span>
                    <span className="w-1/3 border-l border-gray-300">
                      Defect.
                    </span>
                    <span className="w-1/3 border-l border-gray-300">
                      Total
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tableData.map(
                (
                  row // Use row.recordId (washing_bundle_id) or row._id
                ) => (
                  <tr
                    key={row.recordId || row._id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                      {row.moNo}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                      {row.custStyle}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                      {row.buyer}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                      {row.color}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                      {row.size}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                      {row.empId}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                      {row.time}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 font-medium border-r border-gray-300">
                      <div className="flex justify-between text-center">
                        <span className="w-1/3 text-green-600">
                          {(row.bundleQtyFirst || 0).toLocaleString()}
                        </span>
                        <span className="w-1/3 text-red-600 border-l border-gray-300">
                          {(row.bundleQtyDefective || 0).toLocaleString()}
                        </span>
                        <span className="w-1/3 border-l border-gray-300">
                          {(row.originalTotalBundleQty || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 font-medium">
                      <div className="flex justify-between text-center">
                        <span className="w-1/3 text-green-600">
                          {(row.garmentsFirst || 0).toLocaleString()}
                        </span>
                        <span className="w-1/3 text-red-600 border-l border-gray-300">
                          {(row.garmentsDefective || 0).toLocaleString()}
                        </span>
                        <span className="w-1/3 border-l border-gray-300">
                          {(row.originalPassQtyWash || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              )}
              {tableData.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-10 text-gray-500">
                    No data available for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalRecords > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300 hover:bg-blue-600 transition-colors duration-200 w-full sm:w-auto"
          >
            Previous
          </button>
          <span className="text-gray-700 text-sm">
            Page {page} of {Math.ceil(totalRecords / limit)} (Total:{" "}
            {totalRecords.toLocaleString()} records)
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= Math.ceil(totalRecords / limit)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300 hover:bg-blue-600 transition-colors duration-200 w-full sm:w-auto"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default DataTableWOI;
