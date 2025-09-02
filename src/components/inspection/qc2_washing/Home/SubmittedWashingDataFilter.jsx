import { useState, useEffect } from 'react';
import { Filter, X, RotateCcw, Calendar, FileText, Palette, User, Building, ClipboardList, Droplets, CheckCircle, Search } from 'lucide-react';
import { API_BASE_URL } from '../../../../../config';

const SubmittedWashingDataFilter = ({ 
  data, 
  onFilterChange, 
  onReset, 
  isVisible, 
  onToggle 
}) => {
  const [filters, setFilters] = useState({
    dateRange: {
      startDate: '',
      endDate: ''
    },
    orderNo: '',
    color: '',
    qcId: '',
    before_after_wash: '',
    buyer: '',
    factoryName: '',
    reportType: '',
    washType: ''
  });

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Search states for searchable dropdowns
  const [searchStates, setSearchStates] = useState({
    orderNo: '',
    qcId: ''
  });
  
  // Dropdown visibility states
  const [dropdownStates, setDropdownStates] = useState({
    orderNo: false,
    qcId: false
  });

  const getUniqueUsersWithNames = () => {
    const uniqueUserIds = [...new Set(data.map(item => item.userId).filter(Boolean))];
    return uniqueUserIds.map(userId => {
      const user = users.find(u => u.emp_id === userId || u.userId === userId);
      return {
        id: userId,
        display: user ? `${userId} - ${user.eng_name || user.name}` : userId
      };
    }).sort((a, b) => a.display.localeCompare(b.display));
  };

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await fetch(`${API_BASE_URL}/api/users`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || data || []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Extract unique values for dropdown options
  const getUniqueValues = (field) => {
    const values = data
      .map(item => {
        switch (field) {
          case 'color':
            return item.color;
          case 'before_after_wash':
            return item.before_after_wash;
          case 'buyer':
            return item.buyer;
          case 'factoryName':
            return item.factoryName;
          case 'reportType':
            return item.reportType;
          case 'washType':
            return item.washType;
          case 'orderNo':
            return item.orderNo;
          default:
            return null;
        }
      })
      .filter(value => value && value.trim() !== '')
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    
    return values;
  };

  // Filter options based on search term
  const getFilteredOptions = (field, searchTerm) => {
    const options = field === 'qcId' ? getUniqueUsersWithNames() : getUniqueValues(field);
    if (!searchTerm) return options;
    
    if (field === 'qcId') {
      return options.filter(option => 
        option.display.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      return options.filter(option => 
        option.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value, subField = null) => {
    const newFilters = { ...filters };
    
    if (subField) {
      newFilters[field][subField] = value;
    } else {
      newFilters[field] = value;
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Handle search input changes
  const handleSearchChange = (field, value) => {
    setSearchStates(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Also update the filter value
    handleFilterChange(field, value);
  };

  // Handle dropdown toggle
  const toggleDropdown = (field) => {
    setDropdownStates(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle option selection
  const handleOptionSelect = (field, value) => {
    if (field === 'qcId') {
      const selectedUser = getUniqueUsersWithNames().find(user => user.id === value);
      setSearchStates(prev => ({
        ...prev,
        [field]: selectedUser ? selectedUser.display : value
      }));
      handleFilterChange(field, value);
    } else {
      setSearchStates(prev => ({
        ...prev,
        [field]: value
      }));
      handleFilterChange(field, value);
    }
    
    setDropdownStates(prev => ({
      ...prev,
      [field]: false
    }));
  };

  // Reset all filters
  const handleReset = () => {
    const resetFilters = {
      dateRange: {
        startDate: '',
        endDate: ''
      },
      orderNo: '',
      color: '',
      qcId: '',
      before_after_wash: '',
      buyer: '',
      factoryName: '',
      reportType: '',
      washType: ''
    };
    
    setFilters(resetFilters);
    setSearchStates({
      orderNo: '',
      qcId: ''
    });
    setDropdownStates({
      orderNo: false,
      qcId: false
    });
    onReset();
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters.dateRange.startDate ||
      filters.dateRange.endDate ||
      filters.orderNo ||
      filters.color ||
      filters.qcId ||
      filters.before_after_wash ||
      filters.buyer ||
      filters.factoryName ||
      filters.reportType ||
      filters.washType
    );
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.searchable-dropdown')) {
        setDropdownStates({
          orderNo: false,
          qcId: false
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Filter Toggle Button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onToggle}
          className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <Filter size={20} />
          <span className="font-medium">Filters</span>
          {hasActiveFilters() && (
            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </button>
      </div>

      {/* Filter Content */}
      {isVisible && (
        <div className="p-6 bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-10 gap-6">
            
            {/* Date Range Filters */}
            <div className="relative">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.dateRange.startDate}
                onChange={(e) => handleFilterChange('dateRange', e.target.value, 'startDate')}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 transition-all"
              />
              <Calendar className="absolute left-3 top-10 w-4 h-4 text-gray-400" />
            </div>

            <div className="relative">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={filters.dateRange.endDate}
                onChange={(e) => handleFilterChange('dateRange', e.target.value, 'endDate')}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 transition-all"
              />
              <Calendar className="absolute left-3 top-10 w-4 h-4 text-gray-400" />
            </div>

            {/* Searchable MO Number Filter */}
            <div className="relative searchable-dropdown">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 mr-1" />
                MO Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchStates.orderNo}
                  onChange={(e) => handleSearchChange('orderNo', e.target.value)}
                  onFocus={() => toggleDropdown('orderNo')}
                  placeholder="MO Number"
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 transition-all"
                />
                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => toggleDropdown('orderNo')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Options */}
                {dropdownStates.orderNo && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm"
                      onClick={() => handleOptionSelect('orderNo', '')}
                    >
                      All MO Numbers
                    </div>
                    {getFilteredOptions('orderNo', searchStates.orderNo).map(orderNo => (
                      <div
                        key={orderNo}
                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm"
                        onClick={() => handleOptionSelect('orderNo', orderNo)}
                      >
                        {orderNo}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Searchable QC ID Filter */}
            <div className="relative searchable-dropdown">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 mr-1" />
                QC / QA ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchStates.qcId}
                  onChange={(e) => handleSearchChange('qcId', e.target.value)}
                  onFocus={() => toggleDropdown('qcId')}
                  placeholder={loadingUsers ? 'Loading...' : ' QC/QA ID'}
                  disabled={loadingUsers}
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 transition-all disabled:opacity-50"
                />
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => toggleDropdown('qcId')}
                  disabled={loadingUsers}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Options */}
                {dropdownStates.qcId && !loadingUsers && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm"
                      onClick={() => handleOptionSelect('qcId', '')}
                    >
                      All QC IDs
                    </div>
                    {getFilteredOptions('qcId', searchStates.qcId).map(user => (
                      <div
                        key={user.id}
                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm"
                        onClick={() => handleOptionSelect('qcId', user.id)}
                      >
                        {user.display}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Regular Dropdown Filters */}
            <div className="relative">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Palette className="w-4 h-4 mr-1" />
                Color
              </label>
              <div className="relative">
                <select
                  value={filters.color}
                  onChange={(e) => handleFilterChange('color', e.target.value)}
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 transition-all appearance-none"
                >
                  <option value="">All Colors</option>
                  {getUniqueValues('color').map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
                <Palette className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="relative">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CheckCircle className="w-4 h-4 mr-1" />
                Before/After Wash
              </label>
              <div className="relative">
                <select
                  value={filters.before_after_wash}
                  onChange={(e) => handleFilterChange('before_after_wash', e.target.value)}
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 transition-all appearance-none"
                >
                  <option value="">All</option>
                  {getUniqueValues('before_after_wash').map(before_after_wash => (
                    <option key={before_after_wash} value={before_after_wash}>{before_after_wash}</option>
                  ))}
                </select>
                <CheckCircle className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Continue with other regular dropdowns... */}
            {/* <div className="relative">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 mr-1" />
                Buyer
              </label>
              <div className="relative">
                <select
                  value={filters.buyer}
                  onChange={(e) => handleFilterChange('buyer', e.target.value)}
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 transition-all appearance-none"
                >
                  <option value="">All Buyers</option>
                  {getUniqueValues('buyer').map(buyer => (
                    <option key={buyer} value={buyer}>{buyer}</option>
                  ))}
                </select>
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div> */}

            <div className="relative">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Building className="w-4 h-4 mr-1" />
                Factory Name
              </label>
              <div className="relative">
                <select
                  value={filters.factoryName}
                  onChange={(e) => handleFilterChange('factoryName', e.target.value)}
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 transition-all appearance-none"
                >
                  <option value="">All Factories</option>
                  {getUniqueValues('factoryName').map(factory => (
                    <option key={factory} value={factory}>{factory}</option>
                  ))}
                </select>
                <Building className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="relative">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ClipboardList className="w-4 h-4 mr-1" />
                Report Type
              </label>
              <div className="relative">
                <select
                  value={filters.reportType}
                  onChange={(e) => handleFilterChange('reportType', e.target.value)}
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 transition-all appearance-none"
                >
                  <option value="">All Report Types</option>
                  {getUniqueValues('reportType').map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ClipboardList className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="relative">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Droplets className="w-4 h-4 mr-1" />
                Wash Type
              </label>
              <div className="relative">
                <select
                  value={filters.washType}
                  onChange={(e) => handleFilterChange('washType', e.target.value)}
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 transition-all appearance-none"
                >
                  <option value="">All Wash Types</option>
                  {getUniqueValues('washType').map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <Droplets className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-0">
            <div className="text-sm text-gray-500 dark:text-gray-400">
            </div>
            <button
              onClick={handleReset}
              disabled={!hasActiveFilters()}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all font-medium"
            >
              <RotateCcw size={16} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmittedWashingDataFilter;
