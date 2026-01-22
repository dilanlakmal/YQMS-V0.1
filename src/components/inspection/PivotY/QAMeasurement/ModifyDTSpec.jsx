import React, { useState, useEffect } from 'react';

const ModifyDTspec = () => {
  const [orderNo, setOrderNo] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [modifiedData, setModifiedData] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

  // Search for order by order number
  const handleSearch = async () => {
    if (!orderNo.trim()) {
      setError('Please enter an order number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔍 Fetching order:', orderNo);
      console.log('🌐 API Base URL:', apiBaseUrl);
      
      const url = `${apiBaseUrl}/api/dt-modify/${orderNo}`;
      console.log('📡 Full URL:', url);
      
      const response = await fetch(url);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers.get('content-type'));
      
      // Check if the response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const htmlText = await response.text();
        console.log('❌ HTML Response (first 500 chars):', htmlText.substring(0, 500));
        throw new Error('Server returned HTML instead of JSON. The API endpoint might not exist.');
      }
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.log('❌ Error response:', errorData);
        } catch (jsonError) {
          const errorText = await response.text();
          console.log('❌ Error response text:', errorText);
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('✅ API Response:', result);
      
      if (result.success && result.data) {
        setOrderData(result.data);
        setModifiedData(JSON.parse(JSON.stringify(result.data)));
        setIsModified(false);
        console.log('✅ Order data loaded successfully');
      } else {
        throw new Error(result.message || 'Failed to fetch order');
      }
      
    } catch (err) {
      console.error('❌ Search error:', err);
      setError(err.message);
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle specification changes
  const handleSpecChange = (specIndex, sizeKey, field, value) => {
  console.log('🔧 handleSpecChange called:', { specIndex, sizeKey, field, value });
  
  const updatedData = { ...modifiedData };
  
  if (field === 'fraction') {
    updatedData.SizeSpec[specIndex].Specs.forEach(spec => {
      if (spec[sizeKey]) {
        spec[sizeKey].fraction = value;
        // Enhanced fraction to decimal conversion
        spec[sizeKey].decimal = convertFractionToDecimal(value);
        console.log(`✅ Converted "${value}" to decimal: ${spec[sizeKey].decimal}`);
      }
    });
  } else if (field === 'decimal') {
    updatedData.SizeSpec[specIndex].Specs.forEach(spec => {
      if (spec[sizeKey]) {
        const decimalValue = parseFloat(value) || 0;
        spec[sizeKey].decimal = decimalValue;
        spec[sizeKey].fraction = convertDecimalToFraction(decimalValue);
        console.log(`✅ Converted decimal ${decimalValue} to fraction: ${spec[sizeKey].fraction}`);
      }
    });
  }

  setModifiedData(updatedData);
  setIsModified(true);
};

const convertFractionToDecimal = (fractionStr) => {
  if (!fractionStr || typeof fractionStr !== 'string') {
    return 0;
  }

  const trimmed = fractionStr.trim();
  
  // Handle empty string
  if (trimmed === '') {
    return 0;
  }

  // Handle pure decimal numbers (like "1.5", "0.75")
  if (!trimmed.includes('/') && !trimmed.includes(' ')) {
    const decimal = parseFloat(trimmed);
    return isNaN(decimal) ? 0 : decimal;
  }

  // Handle mixed numbers (like "1 1/2", "2 3/4")
  if (trimmed.includes(' ') && trimmed.includes('/')) {
    const parts = trimmed.split(' ');
    if (parts.length === 2) {
      const wholePart = parseInt(parts[0]) || 0;
      const fractionPart = parts[1];
      
      if (fractionPart.includes('/')) {
        const [numerator, denominator] = fractionPart.split('/');
        const num = parseInt(numerator) || 0;
        const den = parseInt(denominator) || 1;
        
        if (den !== 0) {
          const decimal = wholePart + (num / den);
          return Math.round(decimal * 10000) / 10000; // Round to 4 decimal places
        }
      }
    }
  }

  // Handle pure fractions (like "1/2", "3/4", "5/8")
  if (trimmed.includes('/')) {
    const [numerator, denominator] = trimmed.split('/');
    const num = parseInt(numerator) || 0;
    const den = parseInt(denominator) || 1;
    
    if (den !== 0) {
      const decimal = num / den;
      return Math.round(decimal * 10000) / 10000; // Round to 4 decimal places
    }
  }

  // If all else fails, try to parse as a regular number
  const fallback = parseFloat(trimmed);
  return isNaN(fallback) ? 0 : fallback;
};

// Convert decimal number to fraction string
const convertDecimalToFraction = (decimal) => {
  if (typeof decimal !== 'number' || isNaN(decimal)) {
    return "0";
  }

  // Handle whole numbers
  if (decimal % 1 === 0) {
    return decimal.toString();
  }

  // Handle negative numbers
  const isNegative = decimal < 0;
  const absDecimal = Math.abs(decimal);
  
  // Separate whole and fractional parts
  const wholePart = Math.floor(absDecimal);
  const fractionalPart = absDecimal - wholePart;

  // Convert fractional part to fraction
  const tolerance = 1e-6;
  let numerator = 1;
  let denominator = 1;
  let bestNumerator = 1;
  let bestDenominator = 1;
  let bestError = Math.abs(fractionalPart - (bestNumerator / bestDenominator));

  // Try common denominators first (more accurate for typical measurements)
  const commonDenominators = [2, 4, 8, 16, 32, 64, 3, 6, 12, 5, 10, 100, 1000];
  
  for (const den of commonDenominators) {
    const num = Math.round(fractionalPart * den);
    const error = Math.abs(fractionalPart - (num / den));
    
    if (error < bestError) {
      bestNumerator = num;
      bestDenominator = den;
      bestError = error;
    }
    
    if (error < tolerance) break;
  }

  // Reduce the fraction
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const commonDivisor = gcd(bestNumerator, bestDenominator);
  bestNumerator /= commonDivisor;
  bestDenominator /= commonDivisor;

  // Format the result
  let result = '';
  
  if (isNegative) result += '-';
  
  if (wholePart > 0) {
    result += wholePart;
    if (bestNumerator > 0) {
      result += ` ${bestNumerator}/${bestDenominator}`;
    }
  } else if (bestNumerator > 0) {
    result += `${bestNumerator}/${bestDenominator}`;
  } else {
    result += '0';
  }

  return result;
};



  // Add new size to specifications
  const handleAddSize = (newSize) => {
  console.log('🔧 handleAddSize called with:', newSize);
  console.log('🔧 Current modifiedData:', modifiedData);
  
  if (!modifiedData) {
    console.log('❌ modifiedData is null - order not loaded yet');
    alert('Please search and load an order first');
    return;
  }
  
  if (!newSize.trim()) {
    console.log('❌ New size is empty');
    return;
  }
  
  if (modifiedData.SizeList.includes(newSize)) {
    console.log('❌ Size already exists:', newSize);
    alert(`Size "${newSize}" already exists!`);
    return;
  }

  console.log('✅ Adding new size:', newSize);
  
  setModifiedData(prevData => {
    const updatedData = { ...prevData };
    
    // Add to SizeList
    updatedData.SizeList = [...prevData.SizeList, newSize];
    updatedData.NoOfSize = updatedData.SizeList.length;

    // Add to each specification with proper initialization
    updatedData.SizeSpec = prevData.SizeSpec.map(spec => ({
      ...spec,
      Specs: [...spec.Specs, {
        [newSize]: {
          fraction: "0",
          decimal: 0
        }
      }]
    }));

    // Add to OrderQty and CutQty for each color
    updatedData.OrderColors = prevData.OrderColors.map(color => ({
      ...color,
      OrderQty: [...(color.OrderQty || []), { [newSize]: 0 }],
      CutQty: {
        ...(color.CutQty || {}),
        [newSize]: {
          ActualCutQty: 0,
          PlanCutQty: 0
        }
      }
    }));

    // Add to OrderColorShip
    updatedData.OrderColorShip = prevData.OrderColorShip.map(colorShip => ({
      ...colorShip,
      ShipSeqNo: colorShip.ShipSeqNo.map(shipSeq => ({
        ...shipSeq,
        sizes: [...(shipSeq.sizes || []), { [newSize]: 0 }]
      }))
    }));

    return updatedData;
  });
  
  setIsModified(true);
  console.log('✅ handleAddSize completed');
};


  // Handle quantity changes
   const handleQtyChange = (colorIndex, sizeKey, qtyType, value) => {
  const updatedData = { ...modifiedData };
  const qty = parseInt(value) || 0;

  if (qtyType === 'order') {
    // Update OrderQty - ensure the array exists
    if (!updatedData.OrderColors[colorIndex].OrderQty) {
      updatedData.OrderColors[colorIndex].OrderQty = [];
    }
    
    // Find existing item or create new one
    let orderQtyItem = updatedData.OrderColors[colorIndex].OrderQty.find(q => q[sizeKey] !== undefined);
    if (orderQtyItem) {
      orderQtyItem[sizeKey] = qty;
    } else {
      updatedData.OrderColors[colorIndex].OrderQty.push({ [sizeKey]: qty });
    }
    
  } else if (qtyType === 'actualCut') {
    // Update ActualCutQty - ensure the CutQty object and size key exist
    if (!updatedData.OrderColors[colorIndex].CutQty) {
      updatedData.OrderColors[colorIndex].CutQty = {};
    }
    if (!updatedData.OrderColors[colorIndex].CutQty[sizeKey]) {
      updatedData.OrderColors[colorIndex].CutQty[sizeKey] = {
        ActualCutQty: 0,
        PlanCutQty: 0
      };
    }
    updatedData.OrderColors[colorIndex].CutQty[sizeKey].ActualCutQty = qty;
    
  } else if (qtyType === 'planCut') {
    // Update PlanCutQty - ensure the CutQty object and size key exist
    if (!updatedData.OrderColors[colorIndex].CutQty) {
      updatedData.OrderColors[colorIndex].CutQty = {};
    }
    if (!updatedData.OrderColors[colorIndex].CutQty[sizeKey]) {
      updatedData.OrderColors[colorIndex].CutQty[sizeKey] = {
        ActualCutQty: 0,
        PlanCutQty: 0
      };
    }
    updatedData.OrderColors[colorIndex].CutQty[sizeKey].PlanCutQty = qty;
  }

  setModifiedData(updatedData);
  setIsModified(true);
};

  // Save changes
   const handleSave = async () => {
    if (!isModified) return;

    setLoading(true);
    try {
      const dataToSave = {
        ...modifiedData,
        isModify: true
      };

      console.log('💾 Saving order:', orderData._id);
      const url = `${apiBaseUrl}/api/dt-modify/${orderData._id}`;
      console.log('📡 Save URL:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      console.log('📡 Save response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to save changes';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          const errorText = await response.text();
          console.log('❌ Save error response:', errorText);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Save API Response:', result);

      if (result.success && result.data) {
        setOrderData(result.data);
        setModifiedData(JSON.parse(JSON.stringify(result.data)));
        setIsModified(false);
        alert('Changes saved successfully!');
      } else {
        throw new Error(result.message || 'Failed to save changes');
      }

    } catch (err) {
      console.error('❌ Save error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete size from specifications
const handleDeleteSize = async (sizeToDelete) => {
  if (!orderData || !sizeToDelete) return;
  
  // Confirm deletion
  const confirmDelete = window.confirm(
    `Are you sure you want to delete size "${sizeToDelete}"? This will remove it from all specifications and quantity tables.`
  );
  
  if (!confirmDelete) return;

  console.log('🗑️ Deleting size:', sizeToDelete);
  
  // Update UI immediately (optimistic update)
  setModifiedData(prevData => {
    if (!prevData) return prevData;
    
    const updatedData = { ...prevData };
    
    // Remove from SizeList
    updatedData.SizeList = prevData.SizeList.filter(size => size !== sizeToDelete);
    updatedData.NoOfSize = updatedData.SizeList.length;

    // Remove from SizeSpec
    updatedData.SizeSpec = prevData.SizeSpec.map(spec => ({
      ...spec,
      Specs: spec.Specs.filter(specItem => !specItem.hasOwnProperty(sizeToDelete))
    }));

    // Remove from OrderColors
    updatedData.OrderColors = prevData.OrderColors.map(color => {
      const updatedColor = { ...color };
      
      // Remove from OrderQty
      updatedColor.OrderQty = color.OrderQty.filter(qtyItem => 
        !qtyItem.hasOwnProperty(sizeToDelete)
      );
      
      // Remove from CutQty
      const { [sizeToDelete]: deletedSize, ...remainingCutQty } = color.CutQty;
      updatedColor.CutQty = remainingCutQty;
      
      return updatedColor;
    });

    // Remove from OrderColorShip
    updatedData.OrderColorShip = prevData.OrderColorShip.map(colorShip => ({
      ...colorShip,
      ShipSeqNo: colorShip.ShipSeqNo.map(shipSeq => ({
        ...shipSeq,
        sizes: shipSeq.sizes.filter(sizeItem => !sizeItem.hasOwnProperty(sizeToDelete))
      }))
    }));

    return updatedData;
  });
  
  setIsModified(true);
  console.log('✅ Size deleted from UI, remember to save changes');
};

  // Render specifications table
  const renderSpecsTable = () => {
  if (!modifiedData?.SizeSpec) return null;

  return (
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Size Specifications</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 min-w-[800px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10">Seq</th>
              <th className="border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10">Description</th>
              <th className="border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10">Unit</th>
              <th className="border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10">Tolerance -</th>
              <th className="border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10">Tolerance +</th>
              {modifiedData.SizeList.map(size => (
                <th key={size} className="border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10">
                  <div className="flex flex-col items-center gap-1">
                    <span>{size}</span>
                    <button
                      onClick={() => handleDeleteSize(size)}
                      className="text-red-600 hover:text-red-800 text-xs px-1 py-0.5 rounded hover:bg-red-100 transition-colors"
                      title={`Delete size ${size}`}
                    >
                      🗑️
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modifiedData.SizeSpec.map((spec, specIndex) => (
              <tr key={spec.Seq} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 text-center">{spec.Seq}</td>
                <td className="border border-gray-300 px-3 py-2">
                  <div className="text-left min-w-[200px]">
                    <div className="text-sm">{spec.EnglishRemark}</div>
                    <div className="text-xs text-gray-600 mt-1">{spec.ChineseRemark}</div>
                  </div>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">{spec.SizeSpecMeasUnit}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{spec.ToleranceMinus?.fraction}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{spec.TolerancePlus?.fraction}</td>
                {modifiedData.SizeList.map(size => {
                  const sizeSpec = spec.Specs.find(s => s[size]);
                  const value = sizeSpec?.[size];
                  return (
                    <td key={size} className="border border-gray-300 px-2 py-2 text-center">
                      <input
                        type="text"
                        value={value?.fraction || ''}
                        onChange={(e) => handleSpecChange(specIndex, size, 'fraction', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

  // Render quantities table
  const renderQuantitiesTable = () => {
  if (!modifiedData?.OrderColors) return null;

  return (
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Quantities & Cut Quantities</h3>
      {modifiedData.OrderColors.map((color, colorIndex) => (
        <div key={color.ColorCode} className="mb-8">
          <h4 className="text-base font-medium text-gray-700 mb-4 p-3 bg-gray-100 rounded">
            {color.ColorCode} - {color.Color}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10">Type</th>
                  {modifiedData.SizeList.map(size => (
                    <th key={size} className="border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10">{size}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-semibold">Order Qty</td>
                  {modifiedData.SizeList.map(size => {
                    const orderQtyItem = color.OrderQty?.find(q => q[size] !== undefined);
                    return (
                      <td key={size} className="border border-gray-300 px-2 py-2 text-center">
                        <input
                          type="number"
                          value={orderQtyItem?.[size] || 0}
                          onChange={(e) => handleQtyChange(colorIndex, size, 'order', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                    );
                  })}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-semibold">Plan Cut Qty</td>
                  {modifiedData.SizeList.map(size => (
                    <td key={size} className="border border-gray-300 px-2 py-2 text-center">
                      <input
                        type="number"
                        value={color.CutQty?.[size]?.PlanCutQty || 0}
                        onChange={(e) => handleQtyChange(colorIndex, size, 'planCut', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-semibold">Actual Cut Qty</td>
                  {modifiedData.SizeList.map(size => (
                    <td key={size} className="border border-gray-300 px-2 py-2 text-center">
                      <input
                        type="number"
                        value={color.CutQty?.[size]?.ActualCutQty || 0}
                        onChange={(e) => handleQtyChange(colorIndex, size, 'actualCut', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

  // Add size component
  const AddSizeComponent = () => {
    const [newSize, setNewSize] = useState('');

    const handleAddNewSize = () => {
      if (newSize.trim()) {
        handleAddSize(newSize.trim());
        setNewSize('');
      }
    };

    return (
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-base font-semibold text-gray-800 mb-3">Add New Size</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            placeholder="Enter new size (e.g., XXXL)"
            className="flex-1 sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button 
            onClick={handleAddNewSize} 
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Add Size
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-5">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Modify DT Specifications</h2>
        
        {/* Search Section */}
        <div className="bg-gray-50 p-5 rounded-lg mb-5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              type="text"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="Enter Order Number (e.g., GPRT00077C)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch} 
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Order Information */}
      {orderData && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Information</h3>
            <div className="flex flex-wrap gap-5 text-sm">
              <span><strong>Order No:</strong> {orderData.Order_No}</span>
              <span><strong>Style:</strong> {orderData.Style}</span>
              <span><strong>Customer:</strong> {orderData.ShortName}</span>
              <span><strong>Total Qty:</strong> {orderData.TotalQty}</span>
              {orderData.isModify && (
                <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                  Modified
                </span>
              )}
            </div>
          </div>

          {/* Add Size Section */}
          <AddSizeComponent />

          {/* Specifications Table */}
          {renderSpecsTable()}

          {/* Quantities Table */}
          {renderQuantitiesTable()}

          {/* Save Section */}
          {isModified && (
            <div className="p-5 bg-gray-50 flex items-center gap-4">
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-semibold"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <span className="text-red-600 font-semibold text-sm">* Unsaved changes</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModifyDTspec;
