import React from "react";

const DataTableWOI = ({
  tableData,
  totalRecords,
  page,
  limit,
  handlePageChange
}) => {
  return (
    <>
      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white sticky top-0 z-10 shadow-md">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold w-[14.28%]">
                  MO No
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold w-[14.28%]">
                  Cust. Style
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold w-[14.28%]">
                  Buyer
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold w-[14.28%]">
                  Color
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold w-[14.28%]">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold w-[14.28%] border-r border-gray-300">
                  Total Bundle Qty
                  <div className="flex justify-between text-xs mt-1 border-t border-gray-300 pt-1">
                    <span className="w-1/3">First</span>
                    <span className="w-1/3 border-l border-gray-300">
                      Defective
                    </span>
                    <span className="w-1/3 border-l border-gray-300">
                      Total
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold w-[14.28%] border-r border-gray-300">
                  Total Garments
                  <div className="flex justify-between text-xs mt-1 border-t border-gray-300 pt-1">
                    <span className="w-1/3">First</span>
                    <span className="w-1/3 border-l border-gray-300">
                      Defective
                    </span>
                    <span className="w-1/3 border-l border-gray-300">
                      Total
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tableData.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.moNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.custStyle}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.buyer}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.color}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.size}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium border-r border-gray-300">
                    <div className="flex justify-between">
                      <span className="w-1/3 text-green-600">
                        {(row.goodBundleQty || 0).toLocaleString()}
                      </span>
                      <span className="w-1/3 text-red-600 border-l border-gray-300">
                        {(row.defectiveBundleQty || 0).toLocaleString()}
                      </span>
                      <span className="w-1/3 border-l border-gray-300">
                        {(row.goodBundleQty || 0).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium border-r border-gray-300">
                    <div className="flex justify-between">
                      <span className="w-1/3 text-green-600">
                        {(row.goodGarments || 0).toLocaleString()}
                      </span>
                      <span className="w-1/3 text-red-600 border-l border-gray-300">
                        {(row.defectiveGarments || 0).toLocaleString()}
                      </span>
                      <span className="w-1/3 border-l border-gray-300">
                        {(row.goodGarments || 0).toLocaleString()}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300 hover:bg-blue-600 transition-colors duration-200"
        >
          Previous
        </button>
        <span className="text-gray-700">
          Page {page} of {Math.ceil(totalRecords / limit)}
        </span>
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= Math.ceil(totalRecords / limit)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300 hover:bg-blue-600 transition-colors duration-200"
        >
          Next
        </button>
      </div>
    </>
  );
};

export default DataTableWOI;
