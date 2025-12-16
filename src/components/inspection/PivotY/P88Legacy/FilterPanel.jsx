import React from 'react';

const FilterPanel = ({ filters, onFilterChange, options }) => {
  return (
    <div className="bg-white p-5 rounded-lg mb-5 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Inspector:</label>
          <input
            list="inspector-options"
            type="text"
            placeholder="Filter by inspector..."
            value={filters.inspector}
            onChange={(e) => onFilterChange('inspector', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <datalist id="inspector-options">
            {options.inspector?.map(option => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Approval Status:</label>
          <select
            value={filters.approvalStatus}
            onChange={(e) => onFilterChange('approvalStatus', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Report Type:</label>
          <input
            list="reportType-options"
            type="text"
            placeholder="Filter by report type..."
            value={filters.reportType}
            onChange={(e) => onFilterChange('reportType', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <datalist id="reportType-options">
            {options.reportType?.map(option => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Supplier:</label>
          <input
            list="supplier-options"
            type="text"
            placeholder="Filter by supplier..."
            value={filters.supplier}
            onChange={(e) => onFilterChange('supplier', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <datalist id="supplier-options">
            {options.supplier?.map(option => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Project:</label>
          <input
            list="project-options"
            type="text"
            placeholder="Filter by project..."
            value={filters.project}
            onChange={(e) => onFilterChange('project', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <datalist id="project-options">
            {options.project?.map(option => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;