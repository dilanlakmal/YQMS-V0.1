import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FailedReportsFilter = ({ onFilterChange, filters }) => {
    const [users, setUsers] = useState([]);
    const [inspectionNumbers, setInspectionNumbers] = useState([]);
    const [groupIds, setGroupIds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    const fetchFilterOptions = async () => {
        try {
            setLoading(true);
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const response = await axios.get(`${apiBaseUrl}/api/p88failedReport/filter-options`);
            
            if (response.data.success) {
                setUsers(response.data.users || []);
                setInspectionNumbers(response.data.inspectionNumbers || []);
                setGroupIds(response.data.groupIds || []);
            }
        } catch (error) {
            console.error('Error fetching filter options:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filterType, value) => {
        const newFilters = {
            ...filters,
            [filterType]: value
        };
        onFilterChange(newFilters);
    };

    const clearAllFilters = () => {
        const clearedFilters = {
            userId: '',
            inspectionNumber: '',
            groupId: '',
            status: '',
            startDate: '',
            endDate: ''
        };
        onFilterChange(clearedFilters);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>Filter Failed Reports</span>
                </h3>
                <button
                    onClick={clearAllFilters}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                    🗑️ Clear All
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* User ID Filter */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        👤 User ID
                    </label>
                    <select
                        value={filters.userId || ''}
                        onChange={(e) => handleFilterChange('userId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        disabled={loading}
                    >
                        <option value="">All Users</option>
                        {users.map((user) => (
                            <option key={user} value={user}>
                                {user}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Inspection Number Filter */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        📋 Inspection No
                    </label>
                    <select
                        value={filters.inspectionNumber || ''}
                        onChange={(e) => handleFilterChange('inspectionNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        disabled={loading}
                    >
                        <option value="">All Inspections</option>
                        {inspectionNumbers.map((inspNo) => (
                            <option key={inspNo} value={inspNo}>
                                {inspNo}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Group ID Filter */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        🏷️ Group ID
                    </label>
                    <select
                        value={filters.groupId || ''}
                        onChange={(e) => handleFilterChange('groupId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        disabled={loading}
                    >
                        <option value="">All Groups</option>
                        {groupIds.map((groupId) => (
                            <option key={groupId} value={groupId}>
                                {groupId}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        📊 Status
                    </label>
                    <select
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Downloaded">Downloaded</option>
                    </select>
                </div>

                {/* Start Date Filter */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        📅 Start Date
                    </label>
                    <input
                        type="date"
                        value={filters.startDate || ''}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>

                {/* End Date Filter */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        📅 End Date
                    </label>
                    <input
                        type="date"
                        value={filters.endDate || ''}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>
            </div>

            {/* Filter Summary */}
            {Object.values(filters).some(value => value) && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-sm text-blue-800">
                        <strong>Active Filters:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {filters.userId && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    User: {filters.userId}
                                </span>
                            )}
                            {filters.inspectionNumber && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Inspection: {filters.inspectionNumber}
                                </span>
                            )}
                            {filters.groupId && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Group: {filters.groupId}
                                </span>
                            )}
                            {filters.status && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Status: {filters.status}
                                </span>
                            )}
                            {filters.startDate && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    From: {filters.startDate}
                                </span>
                            )}
                            {filters.endDate && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    To: {filters.endDate}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Date Range Validation */}
            {filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate) && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center space-x-2 text-red-700 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Invalid date range: Start date must be before end date</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FailedReportsFilter;
