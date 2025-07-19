import React from "react";

const YorksysOrderPreview = ({ orderData }) => {
  if (
    !orderData ||
    !orderData.skuDetails ||
    orderData.skuDetails.length === 0
  ) {
    return null;
  }

  const {
    buyer, // Destructure the new buyer property
    factory,
    moNo,
    style,
    season,
    skuDescription,
    destination,
    shipMode,
    currency,
    skuDetails,
    poSummary
  } = orderData;

  // Add Buyer to the list of summary items
  const summaryItems = [
    { label: "Factory", value: factory },
    { label: "Buyer", value: buyer },
    { label: "MO No", value: moNo },
    { label: "Style", value: style },
    { label: "Season", value: season },
    { label: "SKU Description", value: skuDescription },
    { label: "Destination", value: destination },
    { label: "Ship Mode", value: shipMode },
    { label: "Currency", value: currency }
  ];

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-lg space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Yorksys Order Upload | MO No: {moNo}
        </h2>
        {/* The grid will automatically adjust to include the new Buyer field */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-4 p-4 border border-gray-200 rounded-md bg-gray-50">
          {summaryItems.map((item) => (
            <div key={item.label}>
              <dt className="text-xs font-semibold text-gray-500 uppercase">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 font-medium">
                {item.value}
              </dd>
            </div>
          ))}
        </div>
      </div>

      {/* --- PO Summary Table (No changes here) --- */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">PO Summary</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  PO #
                </th>
                <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Total SKUs
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Unique ETD(s)
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  ETD Period
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Unique ETA(s)
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  ETA Period
                </th>
                <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Total Colors
                </th>
                <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Total PO Lines
                </th>
                <th className="px-3 py-2 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Total Qty
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {poSummary.map((row) => (
                <tr
                  key={row.poNo}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-3 py-3 font-semibold text-gray-800">
                    {row.poNo}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-800">
                    {row.totalSkus}
                  </td>
                  <td className="px-3 py-3 text-gray-800">{row.uniqueEtds}</td>
                  <td className="px-3 py-3 text-gray-800">{row.etdPeriod}</td>
                  <td className="px-3 py-3 text-gray-800">{row.uniqueEtas}</td>
                  <td className="px-3 py-3 text-gray-800">{row.etaPeriod}</td>
                  <td className="px-3 py-3 text-center text-gray-800">
                    {row.totalColors}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-800">
                    {row.totalPoLines}
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-gray-800">
                    {row.totalQty.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SKU Details Table --- */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          SKU Details
        </h3>
        <div className="overflow-y-auto h-[400px] border border-gray-200 rounded-lg relative">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="sticky top-0 z-10 bg-gray-100 px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  SKU #
                </th>
                <th className="sticky top-0 z-10 bg-gray-100 px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  ETD
                </th>
                <th className="sticky top-0 z-10 bg-gray-100 px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  ETA
                </th>
                <th className="sticky top-0 z-10 bg-gray-100 px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  PO Line
                </th>
                <th className="sticky top-0 z-10 bg-gray-100 px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Color
                </th>
                <th className="sticky top-0 z-10 bg-gray-100 px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Qty
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {skuDetails.map((row, index) => (
                <tr
                  key={`${row.sku}-${index}`}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-800">{row.sku}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{row.etd}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{row.eta}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {row.poLine}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {row.color}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-right">
                    {row.qty.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default YorksysOrderPreview;
