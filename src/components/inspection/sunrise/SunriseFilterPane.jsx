import React from "react";
import FindBuyer from "./FindBuyer";

const SunriseFilterPane = ({
  isFilterOpen,
  filters,
  handleFilterChange,
  clearFilters,
  uniqueWorkLines,
  uniqueMoNos,
  uniqueColorNames,
  //uniqueColorNos,
  uniqueSizeNames,
  formatToInputDate
}) => {
  // Get all possible buyers from uniqueMoNos
  const allBuyerNames = uniqueMoNos.map((mo) => FindBuyer({ moNo: mo }));
  const uniqueBuyers = [...new Set(allBuyerNames)].sort();

  // Filter buyers based on selected MO No
  const filteredBuyers = filters.moNo
    ? [FindBuyer({ moNo: filters.moNo })]
    : uniqueBuyers;

  // Filter MO Nos based on selected Buyer
  const filteredMoNos = filters.buyer
    ? uniqueMoNos.filter((mo) => FindBuyer({ moNo: mo }) === filters.buyer)
    : uniqueMoNos;

  return (
    isFilterOpen && (
      <div className="mb-6 grid grid-cols-7 gap-4 p-4 bg-gray-100 rounded-lg shadow-md">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Date:
          </label>
          <input
            type="date"
            name="startDate"
            value={formatToInputDate(filters.startDate)}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            End Date:
          </label>
          <input
            type="date"
            name="endDate"
            value={formatToInputDate(filters.endDate)}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Line No:
          </label>
          <select
            name="workLine"
            value={filters.workLine}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            {uniqueWorkLines.map((line) => (
              <option key={line} value={line}>
                {line}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            MO No:
          </label>
          <select
            name="moNo"
            value={filters.moNo}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            {filteredMoNos.map((mo) => (
              <option key={mo} value={mo}>
                {mo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Color:
          </label>
          <select
            name="colorName"
            value={filters.colorName}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            {uniqueColorNames.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Size:
          </label>
          <select
            name="sizeName"
            value={filters.sizeName}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            {uniqueSizeNames.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Buyer:
          </label>
          <select
            name="buyer"
            value={filters.buyer}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            {filteredBuyers.map((buyer) => (
              <option key={buyer} value={buyer}>
                {buyer}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-7 flex justify-center mt-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300"
          >
            Clear Filters
          </button>
        </div>
      </div>
    )
  );
};

export default SunriseFilterPane;
