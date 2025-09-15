import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../../../config'; 
import { Edit, Save, X } from 'lucide-react';
import SubmittedWashingDataFilter from './SubmittedWashingDataFilter';

const SubConEdit = () => {
  const [submittedData, setSubmittedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editWashQty, setEditWashQty] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);

  useEffect(() => {
    const fetchSubmittedData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/qc-washing/all-submitted`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          const filteredRecords = data.data.filter(record => 
            record.factoryName && record.factoryName.toUpperCase() !== 'YM' &&
            record.reportType === 'Inline'
          );
          setSubmittedData(filteredRecords);
          setFilteredData(filteredRecords);
        } else {
          setError(data.message || "Failed to fetch submitted data.");
        }
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmittedData();
  }, []);

  const handleEdit = (record) => {
    setEditingRecord(record._id);
    // Pre-fill with edited quantity if it exists, otherwise use original
    setEditWashQty(record.editedActualWashQty || record.washQty || '');
  };

  const handleSave = async (record) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing/update-edited-wash-qty/${record._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ editedWashQty: parseInt(editWashQty) || 0 }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state with the new edited quantity
        setSubmittedData(prev => 
          prev.map(item => 
            item._id === record._id 
              ? { 
                  ...item, 
                  editedActualWashQty: parseInt(editWashQty) || 0,
                  lastEditedAt: new Date()
                }
              : item
          )
        );
        
        setFilteredData(prev => 
          prev.map(item => 
            item._id === record._id 
              ? { 
                  ...item, 
                  editedActualWashQty: parseInt(editWashQty) || 0,
                  lastEditedAt: new Date()
                }
              : item
          )
        );

        setEditingRecord(null);
        setEditWashQty('');
        
        // Optional: Show success message
        alert('Edited wash quantity saved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update edited wash qty: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating edited wash qty:', error);
      alert('Error updating edited wash qty');
    }
  };

  const handleCancel = () => {
    setEditingRecord(null);
    setEditWashQty('');
  };

  // ADD THESE MISSING FILTER FUNCTIONS:
  const applyFilters = (filters) => {
    let filtered = [...submittedData];

    if (filters.dateRange && (filters.dateRange.startDate || filters.dateRange.endDate)) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        const startDate = filters.dateRange.startDate ? new Date(filters.dateRange.startDate) : null;
        const endDate = filters.dateRange.endDate ? new Date(filters.dateRange.endDate) : null;
        
        if (startDate && endDate) {
          return itemDate >= startDate && itemDate <= endDate;
        } else if (startDate) {
          return itemDate >= startDate;
        } else if (endDate) {
          return itemDate <= endDate;
        }
        return true;
      });
    }

    if (filters.orderNo) {
      filtered = filtered.filter(item => 
        item.orderNo?.toLowerCase().includes(filters.orderNo.toLowerCase())
      );
    }

    if (filters.color) {
      filtered = filtered.filter(item => item.color === filters.color);
    }

    if (filters.qcId) {
      filtered = filtered.filter(item => 
        item.userId?.toLowerCase().includes(filters.qcId.toLowerCase())
      );
    }

    if (filters.reportType) {
      filtered = filtered.filter(item => item.reportType === filters.reportType);
    }

    if (filters.washType) {
      filtered = filtered.filter(item => item.washType === filters.washType);
    }

    if (filters.before_after_wash) {
      filtered = filtered.filter(item => item.before_after_wash === filters.before_after_wash);
    }

    setFilteredData(filtered);
  };

  const handleFilterChange = (filters) => {
    applyFilters(filters);
  };

  const handleFilterReset = () => {
    setFilteredData(submittedData);
  };

  useEffect(() => {
    setFilteredData(submittedData);
  }, [submittedData]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-300">Loading data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="text-center py-8">
          <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">⚠️ Error</div>
          <div className="text-gray-600 dark:text-gray-300">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Sub-Con QC Washing Data
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredData.length} of {submittedData.length} records (Non-YM factories, Inline reports only)
          </div>
        </div>

        <SubmittedWashingDataFilter
          data={submittedData}
          onFilterChange={handleFilterChange}
          onReset={handleFilterReset}
          isVisible={filterVisible}
          onToggle={() => setFilterVisible(!filterVisible)}
        />

        {filteredData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">📋</div>
            <div className="text-gray-600 dark:text-gray-300 mb-2">
              No non-YM factory Inline records found.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 min-w-max">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Factory</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Wash Type</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Report Type</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">MO No</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Color</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">QC/QA ID</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Original Wash Qty</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Edited Wash Qty</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Checked Qty</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Before/After Wash</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredData.map((record, index) => (
                  <tr key={record._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                      {record.factoryName || 'N/A'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                      {record.washType || 'N/A'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                      {record.reportType || 'N/A'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                      {record.orderNo || 'N/A'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {record.color || 'N/A'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {record.userId || 'N/A'}
                    </td>
                    {/* Original Wash Qty - Always shows the original value */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {record.washQty || 'N/A'}
                    </td>
                    {/* Edited Wash Qty - Shows input when editing, otherwise shows edited value */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {editingRecord === record._id ? (
                        <input
                          type="number"
                          value={editWashQty}
                          onChange={(e) => setEditWashQty(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200"
                          autoFocus
                        />
                      ) : (
                        <span className={`${record.editedActualWashQty ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
                          {record.editedActualWashQty || '-'}
                          {record.editedActualWashQty && (
                            <span className="ml-1 text-xs text-gray-400">
                              (edited)
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {record.checkedQty || 'N/A'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {record.before_after_wash || 'N/A'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.overallFinalResult === 'Pass' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' 
                          : record.overallFinalResult === 'Fail'
                          ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-yellow-600 dark:text-gray-200'
                      }`}>
                        {record.overallFinalResult || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {editingRecord === record._id ? (
                          <>
                            <button
                              onClick={() => handleSave(record)}
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEdit(record)}
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition-colors"
                            title="Edit Wash Qty"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubConEdit;
