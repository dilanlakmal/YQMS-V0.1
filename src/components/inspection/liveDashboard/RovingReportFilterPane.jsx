import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const RovingReportFilterPane = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  lineNo,
  setLineNo,
  lineNos,
  buyer,
  setBuyer,
  buyers,
  operation,
  setOperation,
  operations,
  qcId,
  setQcId,
  qcIds,
  moNo,
  setMoNo,
  moNos,
  onClearFilters,
  lastUpdated,
  formatTimestamp,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-sm font-semibold mb-4 text-gray-700">
        Filter Roving Reports{" "}
        {lastUpdated && (
          <span className="text-xs text-gray-500">
            (Last Updated: {formatTimestamp(lastUpdated)})
          </span>
        )}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-8 gap-4 items-end">
        {/* Start Date */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            dateFormat="MM/dd/yyyy"
            placeholderText="Select Start Date"
            isClearable
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            End Date
          </label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            dateFormat="MM/dd/yyyy"
            placeholderText="Select End Date"
            isClearable
            minDate={startDate}
          />
        </div>

        {/* Line No */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Line No
          </label>
          <select
            value={lineNo}
            onChange={(e) => setLineNo(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Lines</option>
            {lineNos.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        {/* Buyer Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Buyer Name
          </label>
          <select
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Buyers</option>
            {buyers.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Operation */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Operation
          </label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Operations</option>
            {operations.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>

        {/* QC ID */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">QC ID</label>
          <select value={qcId} onChange={(e) => setQcId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" >
            <option value="">All QC IDs</option>
            {qcIds.map((id) => (<option key={id} value={id}>{id}</option>))}
          </select>
        </div>

        {/* MO No */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">MO No</label>
          <select value={moNo} onChange={(e) => setMoNo(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" >
            <option value="">All MO Nos</option>
            {moNos.map((mo) => (<option key={mo} value={mo}>{mo}</option>))}
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <button
            onClick={onClearFilters}
            className="w-full px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm shadow-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default RovingReportFilterPane;