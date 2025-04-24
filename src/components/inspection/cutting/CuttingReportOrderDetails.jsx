import React from "react";

const CuttingReportOrderDetails = ({ data }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      {/* Dynamic Title */}
      <h2 className="text-sm font-bold mb-4">
        {data.moNo} - Cutting Table {data.cuttingtableLetter}
        {data.cuttingtableNo} Summary
      </h2>

      {/* Order Details Table */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2">Order Details</h3>
        <table className="w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Inspection Date
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                MO No
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Buyer
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Lot No
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Color
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Table No
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Cutting Table
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Cutting Type
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Garment Type
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                QC ID
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-700">
                {data.inspectionDate}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700">{data.moNo}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{data.buyer}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{data.lotNo}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{data.color}</td>
              <td className="px-4 py-2 text-sm text-gray-700">
                {data.tableNo}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700">
                {data.cuttingtableLetter}
                {data.cuttingtableNo}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700">
                {data.cuttingtype}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700">
                {data.garmentType}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700">
                {data.cutting_emp_id}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Inspection Details and Marker Data in the Same Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inspection Details Table */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Inspection Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Order Qty
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Total Bundle Qty
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Bundle Qty Check
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Total Inspection Qty
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Total Layer Qty
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Total Pcs
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {data.orderQty}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {data.totalBundleQty}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {data.bundleQtyCheck}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {data.totalInspectionQty}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {data.actualLayerQty || data.planLayerQty}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {data.totalPcs}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Marker Data Table */}
        <div>
          <h3 className="text-sm font-semibold mb-2">
            Marker Data (Marker: {data.marker || "N/A"})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  {data.markerRatio
                    .sort((a, b) => a.index - b.index)
                    .map((ratio) => (
                      <th
                        key={ratio.index}
                        className="px-4 py-2 text-left text-sm font-medium text-gray-700"
                      >
                        {ratio.markerSize}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {data.markerRatio
                    .sort((a, b) => a.index - b.index)
                    .map((ratio) => (
                      <td
                        key={ratio.index}
                        className="px-4 py-2 text-sm text-gray-700"
                      >
                        {ratio.ratio}
                      </td>
                    ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuttingReportOrderDetails;
