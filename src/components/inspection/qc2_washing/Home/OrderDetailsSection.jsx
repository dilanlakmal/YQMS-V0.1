import React from 'react';

const OrderDetailsSection = ({ 
  formData, 
  handleInputChange,
  fetchOrderDetailsByStyle,
  colorOptions,
  subFactories, 
  user,
  isVisible,
  onToggle,
  styleSuggestions,
  fetchMatchingStyles,
  setStyleSuggestions,
  orderNumbers,
  filterOrderNumbers,
  // filteredOrderNumbers,
  orderNoSuggestions,
  showOrderNoSuggestions,
  setShowOrderNoSuggestions, 
  
}) => {

  const handleOrderNoChange = (e) => {
    handleInputChange("orderNo", e.target.value);
    // Suggestions are fetched and visibility is set in parent's handleInputChange
  };

  const handleOrderNoBlur = () => {
    // A small delay to allow click on suggestion to register before hiding
    setTimeout(() => {
      setShowOrderNoSuggestions(false);
      fetchOrderDetailsByStyle(formData.orderNo); // Fetch details after selection or blur
    }, 150);
  };

  const handleOrderNoFocus = () => {
    // Show suggestions again if input is focused and there are suggestions
    if (orderNoSuggestions.length > 0) {
      setShowOrderNoSuggestions(true);
    }
  };

  const handleSuggestionClick = (selectedOrder) => {
    handleInputChange("orderNo", selectedOrder);
    fetchOrderDetailsByStyle(selectedOrder);
    setShowOrderNoSuggestions(false); // Hide suggestions immediately on click
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Order Details</h2>
        <button 
          onClick={onToggle}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
         {isVisible && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 dark:text-white">
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Order No:</label>
            <div className="relative flex-1">
              <input
                type="text"
                value={formData.orderNo}
                onChange={handleOrderNoChange}
                onBlur={handleOrderNoBlur}
                onFocus={handleOrderNoFocus}
                placeholder="Enter Order No to search"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {showOrderNoSuggestions && formData.orderNo && orderNoSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                  {orderNoSuggestions.map((order, index) => (
                    <li
                      key={index}
                      onMouseDown={() => handleSuggestionClick(order)}
                      className="px-3 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                    >
                      {order}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Date:</label>
            <input 
              type="date" 
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Order QTY:</label>
            <input 
              type="number" 
              value={formData.orderQty}
              onChange={(e) => handleInputChange('orderQty', e.target.value)}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              style={{opacity: 1, color: 'inherit'}}
            />
          </div>
          
         <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Color:</label>
            <select
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">-- Select Color --</option>
              {colorOptions && colorOptions.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
          
         <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Washing Type:</label>
            <select
              value={formData.washingType}
              onChange={(e) => handleInputChange("washingType", e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="Normal Wash">Normal Wash</option>
              <option value="Acid Wash">Acid Wash</option>
              <option value="Garment Dye">Garment Dye</option>
            </select>
          </div>
          
         <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Inspection Report:</label>
            <div className="flex space-x-4">
              <label className="flex items-center dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.firstOutput === true || formData.firstOutput === 'First Output'}
                  onChange={(e) => handleInputChange('firstOutput', e.target.checked ? 'First Output' : '')}
                  className="mr-2 dark:bg-gray-700 dark:checked:bg-indigo-500 dark:border-gray-600 dark:text-white"
                />
                First Output
              </label>
              <label className="flex items-center dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.inline === true || formData.inline === 'Inline'}
                  onChange={(e) => handleInputChange('inline', e.target.checked ? 'Inline' : '')}
                  className="mr-2 dark:bg-gray-700 dark:checked:bg-indigo-500 dark:border-gray-600 dark:text-white"
                />
                Inline
              </label>
            </div>
          </div>
         <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Buyer:</label>
            <input 
              type="text" 
              value={formData.buyer}
              onChange={(e) => handleInputChange('buyer', e.target.value)}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white cursor-not-allowed"
              style={{ opacity: 1, color: "inherit" }}
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Factory Name:</label>
            <select
              value={formData.factoryName}
              onChange={(e) => handleInputChange("factoryName", e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="YM">YM</option>
              {subFactories.map((factory, index) => (
                <option key={index} value={factory.factory}>
                  {factory.factory}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Washing Method:</label>
            <select
              value={formData.reportType || 'Before Wash'}
              onChange={(e) => handleInputChange('reportType', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="Before Wash">Before Wash</option>
              <option value="After Wash">After Wash</option>
            </select>
          </div>         
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">Wash Qty:</label>
            <input
              type="number"
              value={formData.washQty}
              onChange={e => handleInputChange('washQty', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              min={0}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsSection;