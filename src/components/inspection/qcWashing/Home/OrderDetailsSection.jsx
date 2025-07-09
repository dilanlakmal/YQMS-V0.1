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
  filterOrderNumbers
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-800">Order Details</h2>
        <button 
          onClick={onToggle}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
      {isVisible && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Oeder No:</label>
            <input 
              type="text" 
              value={formData.orderNo}
              onChange={(e) => handleInputChange('orderNo', e.target.value)}
              onBlur={() => fetchOrderDetailsByStyle(formData.orderNo)}
              placeholder="Enter Order No and click away"
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Date:</label>
            <input 
              type="date" 
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Order QTY:</label>
            <input 
              type="number" 
              value={formData.orderQty}
              onChange={(e) => handleInputChange('orderQty', e.target.value)}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Color:</label>
            <select 
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select Color --</option>
              {colorOptions && colorOptions.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
         
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Washing Type:</label>
            <select 
              value={formData.washingType}
              onChange={(e) => handleInputChange('washingType', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Normal Wash">Normal Wash</option>
              <option value="Acid Wash">Acid Wash</option>
              <option value="Garment Dye">Garment Dye</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Daily:</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={formData.firstOutput === true || formData.firstOutput === 'First Output'}
                  onChange={(e) => handleInputChange('firstOutput', e.target.checked ? 'First Output' : '')}
                  className="mr-2"
                />
                First Output
              </label>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={formData.inline === true || formData.inline === 'Inline'}
                  onChange={(e) => handleInputChange('inline', e.target.checked ? 'Inline' : '')}
                  className="mr-2"
                />
                Inline
              </label>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Buyer:</label>
            <input 
              type="text" 
              value={formData.buyer}
              onChange={(e) => handleInputChange('buyer', e.target.value)}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Factory Name:</label>
            <select 
              value={formData.factoryName}
              onChange={(e) => handleInputChange('factoryName', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              <option value="YM">YM</option>
              {subFactories.map((factory, index) => (
                <option key={index} value={factory.factory}>{factory.factory}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Report Type:</label>
            <select
              value={formData.reportType || 'Before Wash'}
              onChange={(e) => handleInputChange('reportType', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Before Wash">Before Wash</option>
              <option value="After Wash">After Wash</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsSection;