import { useState, useRef, useEffect } from 'react';

const ModifyDTspec = () => {
  const [orderNo, setOrderNo] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [modifiedData, setModifiedData] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [draggedSizeIndex, setDraggedSizeIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [modifiedFields, setModifiedFields] = useState(new Set());
  const [originalData, setOriginalData] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedOrderNo = useDebounce(orderNo, 300);

  // Fetch suggestions when user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedOrderNo.length >= 2) {
        setLoadingSuggestions(true);
        try {
          // Use the modified getDtOrderByOrderNo with suggest=true
          const response = await fetch(
            `${apiBaseUrl}/api/dt-modify/${encodeURIComponent(debouncedOrderNo)}?suggest=true`
          );
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.type === 'suggestions') {
              setSuggestions(result.data);
              setShowSuggestions(true);
            }
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setLoadingSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedOrderNo, apiBaseUrl]);

  // Handle input change
  const handleOrderNoChange = (e) => {
    const value = e.target.value;
    setOrderNo(value);
    setSelectedSuggestionIndex(-1);
    
    if (value.length < 2) {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setOrderNo(suggestion.Order_No);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    // Automatically search when suggestion is selected
    setTimeout(() => {
      handleSearch(suggestion.Order_No);
    }, 100);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  // Search for order by order number
    const handleSearch = async (searchOrderNo = null) => {
    const orderToSearch = searchOrderNo || orderNo;
    
    if (!orderToSearch.trim()) {
      setError('Please enter an order number');
      return;
    }

    setLoading(true);
    setError('');
    setShowSuggestions(false);
    
    try {
      console.log('🔍 Fetching order:', orderToSearch);
      
      const url = `${apiBaseUrl}/api/dt-modify/${orderToSearch}`;
      console.log('📡 Full URL:', url);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          const errorText = await response.text();
          console.log('❌ Error response text:', errorText);
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('✅ API Response:', result);
      
      if (result.success && result.data && result.type === 'exact_match') {
        setOrderData(result.data);
        setModifiedData(JSON.parse(JSON.stringify(result.data)));
        setOriginalData(JSON.parse(JSON.stringify(result.data))); // Store original data
        setIsModified(false);
        setModifiedFields(new Set()); // Clear modified fields tracking
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

  const createFieldKey = (type, ...identifiers) => {
    return `${type}_${identifiers.join('_')}`;
  };

  const isFieldModified = (fieldKey) => {
    return modifiedFields.has(fieldKey);
  };

   const markFieldAsModified = (fieldKey) => {
    setModifiedFields(prev => new Set([...prev, fieldKey]));
  };


  // Handle size reordering
  const handleSizeReorder = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    console.log('🔄 Reordering size from index', fromIndex, 'to', toIndex);

    setModifiedData(prevData => {
      const updatedData = { ...prevData };
      
      // Reorder SizeList
      const newSizeList = [...updatedData.SizeList];
      const [movedSize] = newSizeList.splice(fromIndex, 1);
      newSizeList.splice(toIndex, 0, movedSize);
      updatedData.SizeList = newSizeList;

      console.log('✅ New size order:', newSizeList);

      // Update SizeSpec - reorder the Specs arrays to match new size order
      updatedData.SizeSpec = updatedData.SizeSpec.map(spec => {
        const newSpecs = [];
        
        // Reorder specs according to new size order
        newSizeList.forEach(size => {
          const existingSpec = spec.Specs.find(s => s[size]);
          if (existingSpec) {
            newSpecs.push(existingSpec);
          } else {
            // If spec doesn't exist for this size, create default
            newSpecs.push({
              [size]: { fraction: "0", decimal: 0 }
            });
          }
        });
        
        return {
          ...spec,
          Specs: newSpecs
        };
      });

      // Update OrderColors - reorder OrderQty arrays to match new size order
      updatedData.OrderColors = updatedData.OrderColors.map(color => {
        const newOrderQty = [];
        
        // Reorder OrderQty according to new size order
        newSizeList.forEach(size => {
          const existingQty = color.OrderQty.find(q => q[size] !== undefined);
          if (existingQty) {
            newOrderQty.push(existingQty);
          } else {
            // If qty doesn't exist for this size, create default
            newOrderQty.push({ [size]: 0 });
          }
        });

        // CutQty doesn't need reordering as it's an object, not an array
        // But ensure all sizes exist in CutQty
        const newCutQty = { ...color.CutQty };
        newSizeList.forEach(size => {
          if (!newCutQty[size]) {
            newCutQty[size] = {
              ActualCutQty: 0,
              PlanCutQty: 0
            };
          }
        });

        return {
          ...color,
          OrderQty: newOrderQty,
          CutQty: newCutQty
        };
      });

      // Update OrderColorShip - reorder sizes arrays to match new size order
      updatedData.OrderColorShip = updatedData.OrderColorShip.map(colorShip => ({
        ...colorShip,
        ShipSeqNo: colorShip.ShipSeqNo.map(shipSeq => {
          const newSizes = [];
          
          // Reorder sizes according to new size order
          newSizeList.forEach(size => {
            const existingSize = shipSeq.sizes.find(s => s[size] !== undefined);
            if (existingSize) {
              newSizes.push(existingSize);
            } else {
              // If size doesn't exist, create default
              newSizes.push({ [size]: 0 });
            }
          });

          return {
            ...shipSeq,
            sizes: newSizes
          };
        })
      }));

      return updatedData;
    });

    setIsModified(true);
    console.log('✅ Size reordering completed');
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedSizeIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedSizeIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedSizeIndex !== null && draggedSizeIndex !== dropIndex) {
      handleSizeReorder(draggedSizeIndex, dropIndex);
    }
    setDraggedSizeIndex(null);
    setDragOverIndex(null);
  };

  // Alternative: Handle size reordering with up/down buttons
  const moveSizeUp = (index) => {
    if (index > 0) {
      handleSizeReorder(index, index - 1);
    }
  };

  const moveSizeDown = (index) => {
    if (index < modifiedData.SizeList.length - 1) {
      handleSizeReorder(index, index + 1);
    }
  };

  // Handle specification changes
  const handleSpecChange = (specIndex, sizeKey, field, value) => {
    console.log('🔧 handleSpecChange called:', { specIndex, sizeKey, field, value });
    
    const fieldKey = createFieldKey('spec', specIndex, sizeKey, field);
    
    // Check if value is different from original
    const originalValue = originalData?.SizeSpec?.[specIndex]?.Specs?.find(spec => spec[sizeKey])?.[sizeKey]?.[field];
    
    const updatedData = { ...modifiedData };
    
    if (field === 'fraction') {
      updatedData.SizeSpec[specIndex].Specs.forEach(spec => {
        if (spec[sizeKey]) {
          spec[sizeKey].fraction = value;
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

    // Track if field is modified
    if (value !== originalValue) {
      markFieldAsModified(fieldKey);
    } else {
      // Remove from modified fields if value matches original
      setModifiedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldKey);
        return newSet;
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
    const fieldKey = createFieldKey('qty', colorIndex, sizeKey, qtyType);
    const qty = parseInt(value) || 0;
    
    // Get original value for comparison
    let originalValue = 0;
    if (qtyType === 'order') {
      const originalOrderQty = originalData?.OrderColors?.[colorIndex]?.OrderQty?.find(q => q[sizeKey] !== undefined);
      originalValue = originalOrderQty?.[sizeKey] || 0;
    } else if (qtyType === 'actualCut') {
      originalValue = originalData?.OrderColors?.[colorIndex]?.CutQty?.[sizeKey]?.ActualCutQty || 0;
    } else if (qtyType === 'planCut') {
      originalValue = originalData?.OrderColors?.[colorIndex]?.CutQty?.[sizeKey]?.PlanCutQty || 0;
    }

    const updatedData = { ...modifiedData };
    
    if (qtyType === 'order') {
      if (!updatedData.OrderColors[colorIndex].OrderQty) {
        updatedData.OrderColors[colorIndex].OrderQty = [];
      }
      
      let orderQtyItem = updatedData.OrderColors[colorIndex].OrderQty.find(q => q[sizeKey] !== undefined);
      if (orderQtyItem) {
        orderQtyItem[sizeKey] = qty;
      } else {
        updatedData.OrderColors[colorIndex].OrderQty.push({ [sizeKey]: qty });
      }
      
    } else if (qtyType === 'actualCut') {
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

    // Track if field is modified
    if (qty !== originalValue) {
      markFieldAsModified(fieldKey);
    } else {
      setModifiedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldKey);
        return newSet;
      });
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
        isModify: true,
        modifiedAt: new Date(),
        modifiedBy: 'Current User'
      };

      console.log('💾 Saving order:', orderData._id);
      console.log('💾 isModify being sent:', dataToSave.isModify);
      
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
      console.log('✅ Saved isModify status:', result.data?.isModify);

      if (result.success && result.data) {
        setOrderData(result.data);
        setModifiedData(JSON.parse(JSON.stringify(result.data)));
        setOriginalData(JSON.parse(JSON.stringify(result.data))); // Update original data
        setIsModified(false);
        setModifiedFields(new Set()); // Clear all modified field tracking
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
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> You can reorder sizes by:
            <br />• Dragging and dropping the size column headers
            <br />• Using the ↑↓ arrow buttons in each size header
            <br />• <span className="bg-yellow-200 px-1 rounded">Yellow background</span> indicates modified fields
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 min-w-[800px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10">Seq</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10">Description</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10">Unit</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10">Tolerance -</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10">Tolerance +</th>
                {modifiedData.SizeList.map((size, sizeIndex) => (
                  <th 
                    key={size} 
                    className={`border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10 cursor-move ${
                      dragOverIndex === sizeIndex ? 'bg-blue-200' : ''
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, sizeIndex)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, sizeIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, sizeIndex)}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 mb-1">
                        <button
                          onClick={() => moveSizeUp(sizeIndex)}
                          disabled={sizeIndex === 0}
                          className="text-xs px-1 py-0.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                          title="Move size left"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveSizeDown(sizeIndex)}
                          disabled={sizeIndex === modifiedData.SizeList.length - 1}
                          className="text-xs px-1 py-0.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                          title="Move size right"
                        >
                          ↓
                        </button>
                      </div>
                      
                      <span className="font-semibold">{size}</span>
                      <div className="text-xs text-gray-500">#{sizeIndex + 1}</div>
                      
                      <button
                        onClick={() => handleDeleteSize(size)}
                        className="text-red-600 hover:text-red-800 text-xs px-1 py-0.5 rounded hover:bg-red-100 transition-colors mt-1"
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
                    const fieldKey = createFieldKey('spec', specIndex, size, 'fraction');
                    const isModified = isFieldModified(fieldKey);
                    
                    return (
                      <td key={size} className="border border-gray-300 px-2 py-2 text-center">
                        <input
                          type="text"
                          value={value?.fraction || ''}
                          onChange={(e) => handleSpecChange(specIndex, size, 'fraction', e.target.value)}
                          className={`w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            isModified 
                              ? 'bg-yellow-100 border-yellow-400' 
                              : 'bg-white'
                          }`}
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
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>✅ Note:</strong> Size order in quantity tables automatically matches the specification table order above.
            <br />• <span className="bg-yellow-200 px-1 rounded">Yellow background</span> indicates modified fields
          </p>
        </div>
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
                    {modifiedData.SizeList.map((size, index) => (
                      <th key={size} className="border border-gray-300 px-3 py-2 text-center font-bold sticky top-0 bg-gray-50 z-10">
                        <div className="flex flex-col items-center">
                          <span>{size}</span>
                          <span className="text-xs text-gray-500">#{index + 1}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 font-semibold">Order Qty</td>
                    {modifiedData.SizeList.map(size => {
                      const orderQtyItem = color.OrderQty?.find(q => q[size] !== undefined);
                      const fieldKey = createFieldKey('qty', colorIndex, size, 'order');
                      const isModified = isFieldModified(fieldKey);
                      
                      return (
                        <td key={size} className="border border-gray-300 px-2 py-2 text-center">
                          <input
                            type="number"
                            value={orderQtyItem?.[size] || 0}
                            onChange={(e) => handleQtyChange(colorIndex, size, 'order', e.target.value)}
                            className={`w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                              isModified 
                                ? 'bg-yellow-100 border-yellow-400' 
                                : 'bg-white'
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 font-semibold">Plan Cut Qty</td>
                    {modifiedData.SizeList.map(size => {
                      const fieldKey = createFieldKey('qty', colorIndex, size, 'planCut');
                      const isModified = isFieldModified(fieldKey);
                      
                      return (
                        <td key={size} className="border border-gray-300 px-2 py-2 text-center">
                          <input
                            type="number"
                            value={color.CutQty?.[size]?.PlanCutQty || 0}
                            onChange={(e) => handleQtyChange(colorIndex, size, 'planCut', e.target.value)}
                            className={`w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                              isModified 
                                ? 'bg-yellow-100 border-yellow-400' 
                                : 'bg-white'
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 font-semibold">Actual Cut Qty</td>
                    {modifiedData.SizeList.map(size => {
                      const fieldKey = createFieldKey('qty', colorIndex, size, 'actualCut');
                      const isModified = isFieldModified(fieldKey);
                      
                      return (
                        <td key={size} className="border border-gray-300 px-2 py-2 text-center">
                          <input
                            type="number"
                            value={color.CutQty?.[size]?.ActualCutQty || 0}
                            onChange={(e) => handleQtyChange(colorIndex, size, 'actualCut', e.target.value)}
                            className={`w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                              isModified 
                                ? 'bg-yellow-100 border-yellow-400' 
                                : 'bg-white'
                            }`}
                          />
                        </td>
                      );
                    })}
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
        
        {/* Search Section with Autocomplete */}
        <div className="bg-gray-50 p-5 rounded-lg mb-5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={orderNo}
                onChange={handleOrderNoChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter Order Number (e.g., PTAF, GPRT, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="off"
              />
              
              {/* Loading indicator for suggestions */}
              {loadingSuggestions && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
              
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion._id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 ${
                        index === selectedSuggestionIndex ? 'bg-blue-100' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {suggestion.Order_No}
                          </div>
                          <div className="text-sm text-gray-600">
                            {suggestion.Style} - {suggestion.ShortName}
                          </div>
                          {suggestion.CustStyle && (
                            <div className="text-xs text-gray-500">
                              Customer Style: {suggestion.CustStyle}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm font-medium text-gray-700">
                            Qty: {suggestion.TotalQty}
                          </div>
                          {suggestion.isModify && (
                            <span className="inline-block bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold mt-1">
                              Modified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No suggestions found */}
              {showSuggestions && suggestions.length === 0 && !loadingSuggestions && debouncedOrderNo.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    No orders found matching {debouncedOrderNo}
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => handleSearch()}
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
               <span className="text-red-600 font-semibold text-sm">
            * {modifiedFields.size} field{modifiedFields.size !== 1 ? 's' : ''} modified
          </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModifyDTspec;
