import React, { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import Swal from "sweetalert2";
import MeasurementNumPad from "../../cutting/MeasurementNumPad";
import SummaryCard from "../Home/SummaryCard";
import PropTypes from "prop-types";

const MeasurementDetailsSection = ({
  orderNo,
  color,
  isVisible = false,
  onToggle,
  savedSizes = [],
  setSavedSizes,
  onSizeSubmit,
  measurementData = { beforeWash: [], afterWash: [] },
  showMeasurementTable = true,
  onMeasurementEdit,
  before_after_wash,
  recordId
}) => {
  const [sizes, setSizes] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [measurementSpecs, setMeasurementSpecs] = useState({ beforeWash: [], afterWash: [], beforeWashGrouped: {}, afterWashGrouped: {} });
  const [activeBeforeTab, setActiveBeforeTab] = useState('');
  const [activeAfterTab, setActiveAfterTab] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fullColumnsBySize, setFullColumnsBySize] = useState({});
  const [selectedRowsBySize, setSelectedRowsBySize] = useState({});
  const [hideUnselectedRowsBySize, setHideUnselectedRowsBySize] = useState({});
  const [selectAllBySize, setSelectAllBySize] = useState({});
  const [showNumPad, setShowNumPad] = useState(false);
  const [currentCell, setCurrentCell] = useState({ size: null, table: null, rowIndex: null, colIndex: null });
  const [measurementValues, setMeasurementValues] = useState({});
  const [noMeasurementData, setNoMeasurementData] = useState(false);
  const [lastSelectedPattern, setLastSelectedPattern] = useState({
    beforeWash: null,
    afterWash: null,
    beforeWashKValue: null,  
    afterWashKValue: null 
  });
  const [savedSizeKValueCombinations, setSavedSizeKValueCombinations] = useState([]);
  const [sizeSpecificKValues, setSizeSpecificKValues] = useState({});
  const [editingMeasurements, setEditingMeasurements] = useState(new Set());

  const currentWashMeasurements = (before_after_wash === 'Before Wash' ? measurementData.beforeWash : measurementData.afterWash) || [];

  const saveMeasurementPattern = (size, selectedRows, tableType) => {
    const washType = tableType === 'before' ? 'beforeWash' : 'afterWash';
    const kValueField = tableType === 'before' ? 'beforeWashKValue' : 'afterWashKValue';
    const currentKValue = getKValueForSize(size, tableType);
    
    setLastSelectedPattern(prev => ({
      ...prev,
      [washType]: selectedRows,
      [kValueField]: currentKValue 
    }));
  };


  // Helper function to get next available K-value for a size
  const getKValueForSize = (size, washType) => {
  const key = `${size}-${washType}`;
  
  // If already set for this specific size, return it (unless it's saved)
  if (sizeSpecificKValues[key]) {
    const currentKValue = sizeSpecificKValues[key];
    const isCurrentSaved = currentWashMeasurements.some(
      m => m.size === size && m.kvalue === currentKValue
    );
    
    // If current K-value is not saved, return it
    if (!isCurrentSaved) {
      return currentKValue;
    }
  }
  
  // Find next available (unsaved) K-value
  const specs = washType === 'before' 
    ? measurementSpecs.beforeWashGrouped 
    : measurementSpecs.afterWashGrouped;
  const availableKValues = Object.keys(specs);
  const savedKValues = getSavedKValuesForSize(size);
  
  // Find first K-value that is not saved for this size
  const nextAvailable = availableKValues.find(kValue => !savedKValues.includes(kValue));
  return nextAvailable || (availableKValues.length > 0 ? availableKValues[0] : '');
};

// Helper function to set K-value for a specific size
const setKValueForSize = (size, washType, kValue) => {
  // Check if this K-value is already saved for this size (but allow editing)
  const isKValueSaved = currentWashMeasurements.some(
    m => m.size === size && m.kvalue === kValue
  );
  const isEditing = editingMeasurements.has(`${size}-${kValue}`);
  
  if (isKValueSaved && !isEditing) {
    // Show warning and don't allow selecting already saved K-values
    Swal.fire({
      icon: 'warning',
      title: 'K-Value Already Saved',
      text: `Size ${size} with K-value ${kValue} is already saved. Please select a different K-value.`,
    });
    return;
  }
  
  const key = `${size}-${washType}`;
  setSizeSpecificKValues(prev => ({
    ...prev,
    [key]: kValue
  }));
  
  // Clear measurement data for this specific size and wash type when switching K-values
  setMeasurementValues(prev => {
    const newValues = { ...prev };
    Object.keys(newValues).forEach(key => {
      if (key.startsWith(`${size}-${washType}-`)) {
        delete newValues[key];
      }
    });
    return newValues;
  });
  
  // Get the new specs for the selected K-value
  const specs = washType === 'before'
    ? (measurementSpecs.beforeWashGrouped[kValue] || measurementSpecs.beforeWash)
    : (measurementSpecs.afterWashGrouped[kValue] || measurementSpecs.afterWash);
  
  // Try to apply global pattern first
  const globalWashType = washType === 'before' ? 'beforeWash' : 'afterWash';
  const globalPattern = lastSelectedPattern[globalWashType];
  
  let patternApplied = false;
  
  if (globalPattern && globalPattern.length === specs.length) {
    setSelectedRowsBySize(prev => ({
      ...prev,
      [size]: [...globalPattern]
    }));
    patternApplied = true;
    
    // Initialize measurement values for selected rows with 0 values (not previous values)
    const tableType = washType;
    setMeasurementValues(prevValues => {
      const newValues = { ...prevValues };
      
      globalPattern.forEach((isSelected, rowIndex) => {
        if (isSelected) {
          for (let colIndex = 0; colIndex < 3; colIndex++) {
            const cellKey = `${size}-${tableType}-${rowIndex}-${colIndex}`;
            // Always set to 0, don't carry over previous values
            newValues[cellKey] = { decimal: 0, fraction: '0' };
          }
        }
      });
      
      return newValues;
    });
  }
  
  // If no global pattern, try to apply pattern from saved data for this size
  if (!patternApplied) {
    const savedDataForThisSize = currentWashMeasurements.filter(m => m.size === size);
    
    if (savedDataForThisSize.length > 0) {
      // Use the pattern from the most recent saved K-value for this size
      const mostRecentSaved = savedDataForThisSize[savedDataForThisSize.length - 1];
      if (mostRecentSaved.selectedRows && mostRecentSaved.selectedRows.length === specs.length) {
        setSelectedRowsBySize(prev => ({
          ...prev,
          [size]: [...mostRecentSaved.selectedRows]
        }));
        patternApplied = true;
        
        // Initialize measurement values for selected rows with 0 values (not previous values)
        const tableType = washType;
        setMeasurementValues(prevValues => {
          const newValues = { ...prevValues };
          
          mostRecentSaved.selectedRows.forEach((isSelected, rowIndex) => {
            if (isSelected) {
              for (let colIndex = 0; colIndex < 3; colIndex++) {
                const cellKey = `${size}-${tableType}-${rowIndex}-${colIndex}`;
                // Always set to 0, don't carry over previous values
                newValues[cellKey] = { decimal: 0, fraction: '0' };
              }
            }
          });
          
          return newValues;
        });
      }
    }
  }
  
  // If no pattern was applied, reset to default
  if (!patternApplied) {
    setSelectedRowsBySize(prev => ({
      ...prev,
      [size]: Array(specs.length).fill(false)
    }));
  }
};

  const getSavedKValuesForSize = (size) => {
    return currentWashMeasurements
      .filter(m => m.size === size)
      .map(m => m.kvalue);
  };

  const isSizeKValueSaved = (size, kvalue) => {
    return currentWashMeasurements.some(
      (m) => m.size === size && m.kvalue === kvalue
    );
  };

  // Helper function to check if a size has any available K-values left
  const hasAvailableKValues = (size) => {
    const currentSpecs = before_after_wash === 'Before Wash' 
      ? measurementSpecs.beforeWashGrouped 
      : measurementSpecs.afterWashGrouped;
    
    const availableKValues = Object.keys(currentSpecs);
    const savedKValues = getSavedKValuesForSize(size);
    
    return availableKValues.some(kvalue => !savedKValues.includes(kvalue));
  };

  const areAllKValuesSaved = (size) => {
  const currentSpecs = before_after_wash === 'Before Wash' 
    ? measurementSpecs.beforeWashGrouped 
    : measurementSpecs.afterWashGrouped;
  
  const availableKValues = Object.keys(currentSpecs);
  const savedKValues = getSavedKValuesForSize(size);
  
  return availableKValues.length > 0 && availableKValues.every(kvalue => savedKValues.includes(kvalue));
};

  const transformMeasurementData = (
    size,
    qty,
    measurements,
    selectedRows,
    fullColumns,
    measurementSpecs,
    tableType,
    kvalue,
    before_after_wash,
    isEdit = false
  ) => {
    const pcs = [];
    for (let pcIndex = 0; pcIndex < qty; pcIndex++) {
      const measurementPoints = [];
      const isFullColumn = fullColumns?.[pcIndex] || false;

      measurementSpecs.forEach((spec, specIndex) => {
        // Only include if full, or row is selected
        const isRowIndividuallySelected = selectedRows?.[specIndex] ?? false;
        if (!isFullColumn && !isRowIndividuallySelected) return;

        const cellKey = `${size}-${tableType}-${specIndex}-${pcIndex}`;
        const measurementValue = measurements?.[cellKey];

        let result = '';
        if (measurementValue && typeof measurementValue.decimal === 'number') {
          const measuredDeviation = measurementValue.decimal;
          const tolMinus = spec.ToleranceMinus || '0';
          const tolPlus = spec.TolerancePlus || '0';
          const tolMinusValue = fractionToDecimal(tolMinus);
          const tolPlusValue = fractionToDecimal(tolPlus);

          if (!isNaN(tolMinusValue) && !isNaN(tolPlusValue)) {
            if (measuredDeviation >= tolMinusValue && measuredDeviation <= tolPlusValue) {
              result = 'pass';
            } else {
              result = 'fail';
            }
          }
        }

        // Only push if result is 'pass' or 'fail'
        if (result === 'pass' || result === 'fail') {
          measurementPoints.push({
            pointName: spec.MeasurementPointEngName || `Point ${specIndex + 1}`,
            pointNo: specIndex + 1,
            rowNo: specIndex,
            measured_value_decimal: measurementValue?.decimal ?? null,
            measured_value_fraction: measurementValue?.fraction ?? '',
            specs: spec.Specs?.fraction || spec.Specs || '-',
            toleranceMinus: fractionToDecimal(spec.ToleranceMinus || '0'),
            tolerancePlus: fractionToDecimal(spec.TolerancePlus || '0'),
            result: result,
          });
        }
      });

      pcs.push({
        pcNumber: pcIndex + 1,
        isFullColumn: isFullColumn,
        measurementPoints: measurementPoints,
      });
    }

    // Calculate summary data for measurementSizeSummary
    const totalCheckedPoints = pcs.reduce((sum, pc) => sum + pc.measurementPoints.length, 0);
    const totalPass = pcs.reduce((sum, pc) => 
      sum + pc.measurementPoints.filter(point => point.result === 'pass').length, 0
    );
    const totalFail = pcs.reduce((sum, pc) => 
      sum + pc.measurementPoints.filter(point => point.result === 'fail').length, 0
    );
    const minusToleranceFailCount = pcs.reduce((sum, pc) => 
      sum + pc.measurementPoints.filter(point => 
        point.result === 'fail' && point.measured_value_decimal < point.toleranceMinus
      ).length, 0
    );
    const plusToleranceFailCount = pcs.reduce((sum, pc) => 
      sum + pc.measurementPoints.filter(point => 
        point.result === 'fail' && point.measured_value_decimal > point.tolerancePlus
      ).length, 0
    );

    const washType = before_after_wash === 'Before Wash' ? 'beforeWash' : 'afterWash';

    return {
      size: size,
      qty: qty,
      pcs: pcs,
      selectedRows: selectedRows,
      fullColumns: fullColumns,
      kvalue: kvalue,
      before_after_wash: washType,
      isEdit: isEdit,
      measurementId: isEdit ? `${size}-${kvalue}` : null,
      // Include summary data for measurementSizeSummary
      summaryData: {
        size: size,
        kvalue: kvalue, 
        checkedPcs: qty,
        checkedPoints: totalCheckedPoints,
        totalPass: totalPass,
        totalFail: totalFail,
        plusToleranceFailCount: plusToleranceFailCount,
        minusToleranceFailCount: minusToleranceFailCount
      }
    };
  };

  const fractionToDecimal = (frac) => {
    if (typeof frac !== 'string' || !frac || frac.trim() === '-') return NaN;
    frac = frac
      .replace('⁄', '/')
      .replace('½', '1/2').replace('¼', '1/4').replace('¾', '3/4')
      .replace('⅛', '1/8').replace('⅜', '3/8').replace('⅝', '5/8').replace('⅞', '7/8')
      .trim();

    const isNegative = frac.startsWith('-');
    if (isNegative) {
      frac = frac.substring(1);
    }

    let total = 0;
    if (frac.includes('/')) {
      const parts = frac.split(' ');
      if (parts.length > 1 && parts[0]) {
        total += parseFloat(parts[0]);
      }
      const fractionPart = parts.length > 1 ? parts[1] : parts[0];
      const [num, den] = fractionPart.split('/').map(Number);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        total += num / den;
      } else {
        return NaN;
      }
    } else {
      total = parseFloat(frac);
    }

    if (isNaN(total)) return NaN;
    return isNegative ? -total : total;
  };

  const handleKValueChange = (newKValue, washType) => {
  if (washType === 'before') {
    setActiveBeforeTab(newKValue);
  } else {
    setActiveAfterTab(newKValue);
  }
  
  // Clear measurement data for all selected sizes when switching K-values
  selectedSizes.forEach(({ size }) => {
    // Clear measurement values for this size and table type
    setMeasurementValues(prev => {
      const newValues = { ...prev };
      Object.keys(newValues).forEach(key => {
        if (key.startsWith(`${size}-${washType}-`)) {
          delete newValues[key];
        }
      });
      return newValues;
    });
    
    // Reset row selections for this size
    setSelectedRowsBySize(prev => {
      const specs = washType === 'before'
        ? (measurementSpecs.beforeWashGrouped[newKValue] || measurementSpecs.beforeWash)
        : (measurementSpecs.afterWashGrouped[newKValue] || measurementSpecs.afterWash);
      
      return {
        ...prev,
        [size]: Array(specs.length).fill(false)
      };
    });
  });
};


  const handleEditClick = (sizeToEdit, kvalue) => {
    const before_after_wash_Key = before_after_wash === 'Before Wash' ? 'beforeWash' : 'afterWash';
    const dataToEdit = (measurementData[before_after_wash_Key] || []).find(
      item => item.size === sizeToEdit && item.kvalue === kvalue
    );

    if (!dataToEdit) return;

    // Remove from saved combinations
    setSavedSizeKValueCombinations(prev => 
      prev.filter(combo => !(combo.size === sizeToEdit && combo.kvalue === kvalue))
    );

    // Mark this size-kvalue combination as being edited FIRST
    setEditingMeasurements(prev => new Set([...prev, `${sizeToEdit}-${kvalue}`]));
    
    // Add to selected sizes if not already there
    setSelectedSizes(prev => {
      if (prev.some(s => s.size === sizeToEdit)) {
        return prev.map(s => s.size === sizeToEdit ? { ...s, qty: dataToEdit.qty } : s);
      }
      return [...prev, { size: sizeToEdit, qty: dataToEdit.qty }];
    });

    // Set the K-value for this specific size directly without validation
    const tableType = before_after_wash === 'Before Wash' ? 'before' : 'after';
    const key = `${sizeToEdit}-${tableType}`;
    setSizeSpecificKValues(prev => ({
      ...prev,
      [key]: kvalue
    }));

    // Set the active tab to the K-value being edited
    if (before_after_wash === 'Before Wash') {
      setActiveBeforeTab(kvalue);
    } else {
      setActiveAfterTab(kvalue);
    }

    // Reset UI state for this size
    setSelectedRowsBySize(prev => {
      const next = { ...prev };
      delete next[sizeToEdit];
      return next;
    });

    setFullColumnsBySize(prev => {
      const next = { ...prev };
      delete next[sizeToEdit];
      return next;
    });

    setMeasurementValues(prev => {
      const newValues = { ...prev };
      Object.keys(newValues).forEach(key => {
        if (key.startsWith(`${sizeToEdit}-before-`) || key.startsWith(`${sizeToEdit}-after-`)) {
          delete newValues[key];
        }
      });
      return newValues;
    });

    // Don't remove from measurementData here - let the parent component handle it

    // Hydrate from the saved record
    hydrateMeasurementUIFromSavedData([dataToEdit], before_after_wash === 'Before Wash' ? 'before' : 'after');

    if (onMeasurementEdit) onMeasurementEdit(sizeToEdit, kvalue);
  };

  useEffect(() => {
    if (orderNo && color) {
      fetchSizes();
      fetchMeasurementSpecs();
    } else {
      setSizes([]);
      setSelectedSizes([]);
      setMeasurementSpecs({ beforeWash: [], afterWash: [], beforeWashGrouped: {}, afterWashGrouped: {} });
    }
  }, [orderNo, color]);

  const fetchSizes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/qc-washing/order-sizes/${orderNo}/${color}`);
      const data = await response.json();
      
      if (data.success) {
        const availableSizes = data.sizes || data.Sizes || [];
        setSizes(availableSizes);
        setSelectedSizes([]);
      } else {
        setError(data.message || 'Failed to fetch sizes');
        setSizes([]);
        setSelectedSizes([]);
      }
    } catch (error) {
      console.error('Error fetching sizes:', error);
      setError('Error fetching sizes');
      setSizes([]);
      setSelectedSizes([]);
    } finally {
      setLoading(false);
    }
  };

  function hydrateMeasurementUIFromSavedData(dataArr, tableType) {
    dataArr.forEach((data) => {
      const { size, qty, pcs, selectedRows, fullColumns } = data;
      if (!size || !pcs) return;

      // Find the number of measurement points (rows)
      const numRows = pcs[0]?.measurementPoints?.length || 0;
      // Find the number of columns (pcs)
      const numCols = pcs.length;

      // 1. Build measurementValues
      let newMeasurementValues = {};

      // 2. Use selectedRows from saved data, or default to all false
      let newSelectedRows = Array.isArray(selectedRows)
        ? [...selectedRows]
        : Array(numRows).fill(false);

      // 3. Use fullColumns from saved data, or default to all false
      let newFullColumns = Array.isArray(fullColumns)
        ? [...fullColumns]
        : Array(numCols).fill(false);

      // 4. Set measurement values for all points
      for (let colIndex = 0; colIndex < numCols; colIndex++) {
        pcs[colIndex].measurementPoints.forEach((point) => {
          const rowIndex = point.rowNo;
          const cellKey = `${size}-${tableType}-${rowIndex}-${colIndex}`;
          newMeasurementValues[cellKey] = {
            decimal: point.measured_value_decimal,
            fraction: point.measured_value_fraction
          };
        });
      }

      setMeasurementValues(prev => ({ ...prev, ...newMeasurementValues }));
      setSelectedRowsBySize(prev => ({ ...prev, [size]: newSelectedRows }));
      setFullColumnsBySize(prev => ({ ...prev, [size]: newFullColumns }));
    });
  }

  const fetchMeasurementSpecs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing/measurement-specs/${orderNo}/${color}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setNoMeasurementData(!!data.isDefault);
        const beforeWashGrouped = data.beforeWashGrouped || {};
        const afterWashGrouped = data.afterWashGrouped || {};
        
        setMeasurementSpecs({
          beforeWash: data.beforeWashSpecs || [],
          afterWash: data.afterWashSpecs || [],
          beforeWashGrouped: beforeWashGrouped,
          afterWashGrouped: afterWashGrouped
        });
        
        // Set default active tabs
        const beforeKeys = Object.keys(beforeWashGrouped);
        const afterKeys = Object.keys(afterWashGrouped);
        if (beforeKeys.length > 0) setActiveBeforeTab(beforeKeys[0]);
        if (afterKeys.length > 0) setActiveAfterTab(afterKeys[0]);
        
      } else {
        setNoMeasurementData(false);
        setMeasurementSpecs({ beforeWash: [], afterWash: [], beforeWashGrouped: {}, afterWashGrouped: {} });
      }
    } catch (error) {
      setNoMeasurementData(false);
      console.error('Error fetching measurement specs:', error);
      setMeasurementSpecs({ beforeWash: [], afterWash: [], beforeWashGrouped: {}, afterWashGrouped: {} });
    }
  };

  const convertToFraction = (value) => {
    if (!value || value === '-') return '-';
    const num = parseFloat(value.toString().replace(/[+-]/g, ''));
    
    const fractions = {
      0.125: '1/8', 0.25: '1/4', 0.375: '3/8', 0.5: '1/2',
      0.625: '5/8', 0.75: '3/4', 0.875: '7/8'
    };
    
    if (fractions[num]) return fractions[num];
    
    for (let denom = 2; denom <= 16; denom++) {
      const numerator = Math.round(num * denom);
      if (Math.abs(numerator / denom - num) < 0.001) {
        return `${numerator}/${denom}`;
      }
    }
    
    return num.toString();
  };

const addSize = (size) => {
  const sizeStr = String(size);
  
  // If size is not in selectedSizes, add it
  if (!selectedSizes.find(s => s.size === sizeStr)) {
    const newSize = { size: sizeStr, qty: 3 };
    setSelectedSizes(prev => [...prev, newSize]);
    
    // Get current wash type and automatically select next available K-value
    const washType = before_after_wash === 'Before Wash' ? 'beforeWash' : 'afterWash';
    const kValueField = before_after_wash === 'Before Wash' ? 'beforeWashKValue' : 'afterWashKValue';
    const tableType = before_after_wash === 'Before Wash' ? 'before' : 'after';
    
    // Get next available K-value for this size (first unsaved one)
    const currentKValue = getKValueForSize(sizeStr, tableType);
    
    // Set the K-value for this size
    const key = `${sizeStr}-${tableType}`;
    setSizeSpecificKValues(prev => ({
      ...prev,
      [key]: currentKValue
    }));
    
    // Get the specs for current K-value
    const specs = before_after_wash === 'Before Wash'
      ? (measurementSpecs.beforeWashGrouped[currentKValue] || measurementSpecs.beforeWash)
      : (measurementSpecs.afterWashGrouped[currentKValue] || measurementSpecs.afterWash);
    
    // Try to apply pattern from global last selected pattern first
    const globalPattern = lastSelectedPattern[washType];
    const globalKValue = lastSelectedPattern[kValueField];
    
    let patternApplied = false;
    
    // Apply global pattern if available and specs length matches
    if (globalPattern && globalPattern.length === specs.length) {
      setSelectedRowsBySize(prev => ({
        ...prev,
        [sizeStr]: [...globalPattern]
      }));
      patternApplied = true;
      
      // Initialize measurement values for selected rows with 0 values
      setMeasurementValues(prevValues => {
        const newValues = { ...prevValues };
        
        globalPattern.forEach((isSelected, rowIndex) => {
          if (isSelected) {
            for (let colIndex = 0; colIndex < 3; colIndex++) {
              const cellKey = `${sizeStr}-${tableType}-${rowIndex}-${colIndex}`;
              // Always initialize with 0, not previous values
              newValues[cellKey] = { decimal: 0, fraction: '0' };
            }
          }
        });
        
        return newValues;
      });
    }
    
    // If no global pattern, try to apply pattern from saved data for this size
    if (!patternApplied) {
      const savedDataForThisSize = currentWashMeasurements.filter(m => m.size === sizeStr);
      
      if (savedDataForThisSize.length > 0) {
        // Use the pattern from the most recent saved K-value for this size
        const mostRecentSaved = savedDataForThisSize[savedDataForThisSize.length - 1];
        
        // Apply pattern if the specs length matches
        if (mostRecentSaved.selectedRows && mostRecentSaved.selectedRows.length === specs.length) {
          setSelectedRowsBySize(prev => ({
            ...prev,
            [sizeStr]: [...mostRecentSaved.selectedRows]
          }));
          patternApplied = true;
          
          // Initialize measurement values for selected rows with 0 values
          setMeasurementValues(prevValues => {
            const newValues = { ...prevValues };
            
            mostRecentSaved.selectedRows.forEach((isSelected, rowIndex) => {
              if (isSelected) {
                for (let colIndex = 0; colIndex < 3; colIndex++) {
                  const cellKey = `${sizeStr}-${tableType}-${rowIndex}-${colIndex}`;
                  // Always initialize with 0, not previous values
                  newValues[cellKey] = { decimal: 0, fraction: '0' };
                }
              }
            });
            
            return newValues;
          });
        }
      }

      // If no global pattern, try to apply pattern from saved data for this size
      if (!patternApplied) {
        const savedDataForThisSize = currentWashMeasurements.filter(
          (m) => m.size === sizeStr
        );

        if (savedDataForThisSize.length > 0) {
          // Use the pattern from the most recent saved K-value for this size
          const mostRecentSaved =
            savedDataForThisSize[savedDataForThisSize.length - 1];

          // Apply pattern if the specs length matches
          if (
            mostRecentSaved.selectedRows &&
            mostRecentSaved.selectedRows.length === specs.length
          ) {
            setSelectedRowsBySize((prev) => ({
              ...prev,
              [sizeStr]: [...mostRecentSaved.selectedRows]
            }));
            patternApplied = true;

            // Initialize measurement values for selected rows with 0 values
            setMeasurementValues((prevValues) => {
              const newValues = { ...prevValues };

              mostRecentSaved.selectedRows.forEach((isSelected, rowIndex) => {
                if (isSelected) {
                  for (let colIndex = 0; colIndex < 3; colIndex++) {
                    const cellKey = `${sizeStr}-${tableType}-${rowIndex}-${colIndex}`;
                    // Always initialize with 0, not previous values
                    newValues[cellKey] = { decimal: 0, fraction: "0" };
                  }
                }
              });

              return newValues;
            });
          }
        }
      }

      // If no pattern was applied, reset to default
      if (!patternApplied) {
        setSelectedRowsBySize((prev) => ({
          ...prev,
          [sizeStr]: Array(specs.length).fill(false)
        }));
      }
    }
    
    // If no pattern was applied, reset to default
    if (!patternApplied) {
      setSelectedRowsBySize(prev => ({
        ...prev,
        [sizeStr]: Array(specs.length).fill(false)
      }));
    }
  }
};


const removeSize = (size) => {
  setSelectedSizes(prev => prev.filter(s => s.size !== size));
  
  // Clean up related state
  setSelectedRowsBySize(prev => {
    const next = { ...prev };
    delete next[size];
    return next;
  });
  
  setFullColumnsBySize(prev => {
    const next = { ...prev };
    delete next[size];
    return next;
  });
  
  setMeasurementValues(prev => {
    const newValues = { ...prev };
    Object.keys(newValues).forEach(key => {
      if (key.startsWith(`${size}-before-`) || key.startsWith(`${size}-after-`)) {
        delete newValues[key];
      }
    });
    return newValues;
  });
};


  const updateQty = (size, change) => {
    setSelectedSizes(prev => prev.map(s => 
      s.size === size 
        ? { ...s, qty: Math.max(1, s.qty + change) }
        : s
    ));
  };

  const toggleFullColumn = (size, columnIndex) => {
    setFullColumnsBySize(prev => {
      const prevForSize = prev[size] || [];
      const updated = [...prevForSize];
      updated[columnIndex] = !updated[columnIndex];

      if (updated[columnIndex]) {
        const tableType = before_after_wash === 'Before Wash' ? 'before' : 'after';
        const currentKValue = getKValueForSize(size, tableType);
        const specs = before_after_wash === 'Before Wash'
          ? (measurementSpecs.beforeWashGrouped[currentKValue] || measurementSpecs.beforeWash)
          : (measurementSpecs.afterWashGrouped[currentKValue] || measurementSpecs.afterWash);

        setMeasurementValues(prevValues => {
          const newValues = { ...prevValues };
          specs.forEach((spec, specIndex) => {
            const cellKey = `${size}-${tableType}-${specIndex}-${columnIndex}`;
            if (!newValues[cellKey]) {
              newValues[cellKey] = { decimal: 0, fraction: '0' };
            }
          });
          return newValues;
        });
      }

      return {
        ...prev,
        [size]: updated
      };
    });
  };

  const toggleSelectAll = (size) => {
    setSelectAllBySize(prev => ({
      ...prev,
      [size]: !prev[size]
    }));
    setSelectedRowsBySize(prev => ({
      ...prev,
      [size]: prev[size]?.map(() => !prev[size][0]) || Array(measurementSpecs.beforeWash?.length || measurementSpecs.afterWash?.length).fill(!prev[size]?.[0])
    }));
  };

  const toggleRowSelection = (size, rowIndex) => {
  setSelectedRowsBySize(prev => {
    const prevSelections = prev[size] || Array(measurementSpecs.beforeWash?.length || measurementSpecs.afterWash?.length).fill(true);
    const updatedSelections = [...prevSelections];
    updatedSelections[rowIndex] = !updatedSelections[rowIndex];
    
    // If now checked, set all related cells to 0 (not previous values)
    if (updatedSelections[rowIndex]) {
      const qty = selectedSizes.find(s => s.size === size)?.qty || 1;
      const tableType = before_after_wash === 'Before Wash' ? 'before' : 'after';
      setMeasurementValues(prevValues => {
        const newValues = { ...prevValues };
        for (let i = 0; i < qty; i++) {
          const cellKey = `${size}-${tableType}-${rowIndex}-${i}`;
          // Always initialize with 0
          newValues[cellKey] = { decimal: 0, fraction: '0' };
        }
        return newValues;
      });
    }

    // Update selectAll state based on row selections
    const allSelected = updatedSelections.every(Boolean);
    setSelectAllBySize(prevSelectAll => ({
      ...prevSelectAll,
      [size]: allSelected
    }));
    
    return { ...prev, [size]: updatedSelections };
  });
};

  const toggleSelectAllRows = (size, checked, tableType) => {
    const currentKValue = getKValueForSize(size, tableType);
    const specs =
      tableType === 'before'
        ? measurementSpecs.beforeWashGrouped[currentKValue] || measurementSpecs.beforeWash
        : measurementSpecs.afterWashGrouped[currentKValue] || measurementSpecs.afterWash;
    const newSelections = specs.map(() => checked);

    setSelectedRowsBySize(prev => ({
      ...prev,
      [size]: newSelections,
    }));
  };

  useEffect(() => {
    if (!measurementData || (!measurementData.beforeWash && !measurementData.afterWash)) return;
    const currentTable = before_after_wash === 'Before Wash' ? 'beforeWash' : 'afterWash';
    const dataArr = measurementData[currentTable] || [];
    hydrateMeasurementUIFromSavedData(dataArr, before_after_wash === 'Before Wash' ? 'before' : 'after');
  }, [measurementData, before_after_wash]);

  // Function to check if current selection matches the saved pattern
 const isPatternAutoApplied = (size) => {
  const washType = before_after_wash === 'Before Wash' ? 'beforeWash' : 'afterWash';
  const globalPattern = lastSelectedPattern[washType];
  const currentSelection = selectedRowsBySize[size];
  
  if (!globalPattern || !currentSelection) return false;
  
  const patternMatches = JSON.stringify(globalPattern) === JSON.stringify(currentSelection);
  
  return patternMatches;
};

  const renderMeasurementTable = (size, qty) => {
    return (
      <div key={`measurement-${size}`} className="mb-8">
        <h4 className="text-lg font-semibold mb-4 border-b pb-2 text-gray-800 dark:text-white">
          Size: {size} (Qty: {qty})
        </h4>
        {isPatternAutoApplied(size) && (
          <div className="mb-2 p-2 bg-blue-100 border border-blue-300 rounded text-sm text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            <span className="font-medium">📋 Pattern Applied:</span> Measurement points from previously saved data have been automatically selected. You can modify them as needed.
          </div>
        )}
        
        {/* K1 Sheet - Before Wash */}
        {before_after_wash === 'Before Wash' && (
          <>
            {Object.keys(measurementSpecs.beforeWashGrouped).length > 1 && (
              <div className="mb-3">
                <label className="mr-2 text-sm font-medium ">K Value:</label>
                <select
                  value={getKValueForSize(size, 'before')}
                  onChange={e => {
                    const selectedKValue = e.target.value;
                    setKValueForSize(size, 'before', selectedKValue);
                  }}
                  className="px-2 py-1 border rounded text-sm dark:text-white dark:bg-gray-800"
                >
                  {Object.keys(measurementSpecs.beforeWashGrouped).map(kValue => {
                    // Check if this specific K-value is saved for THIS specific size
                    const isKValueSavedForThisSize = currentWashMeasurements.some(
                      m => m.size === size && m.kvalue === kValue
                    );
                    
                    return (
                      <option 
                        className="dark:bg-gray-800 dark:text-white" 
                        key={kValue} 
                        value={kValue}
                        disabled={isKValueSavedForThisSize}
                        style={isKValueSavedForThisSize ? { 
                          color: '#9CA3AF', 
                          backgroundColor: '#F3F4F6',
                          fontStyle: 'italic' 
                        } : {}}
                      >
                        {kValue === 'NA' ? 'General' : `${kValue}`}
                        {isKValueSavedForThisSize ? ' (Saved)' : ''}
                      </option>
                    );
                  })}
                </select>
                {/* Show info about current K-value status */}
                {currentWashMeasurements.some(m => m.size === size && m.kvalue === getKValueForSize(size, 'before')) && (
                  <div className="mt-1 text-xs text-blue-600">
                    This K-value is already saved for size {size}
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end mb-2">
              <button
                onClick={() =>
                  setHideUnselectedRowsBySize(prev => ({
                    ...prev,
                    [size]: !prev[size],
                  }))
                }
                className="text-xs px-3 py-1 border border-gray-400 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-white"
              >
                {hideUnselectedRowsBySize[size] ? 'Show All' : 'Hide Unselected'}
              </button>
            </div>
            
            <div className="overflow-x-auto ">
              <table className="w-full border-collapse border border-gray-300 text-xs dark:bg-gray-800 dark:text-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th rowSpan={2} className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">
                      
                    </th>
                    <th rowSpan={2} className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">Area</th>
                    <th colSpan={2} className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">Tolerance</th>
                    <th rowSpan={2} className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">Specs</th>
                    <th colSpan={selectedSizes.find(s => s.size === size)?.qty || 1} className="border border-gray-300 px-2 py-1 font-medium text-center dark:bg-gray-700 dark:text-white">
                      Measurements
                    </th>
                  </tr>
                  <tr>
                    <th className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">-</th>
                    <th className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">+</th>
                    {[...Array(qty)].map((_, i) => (
                      <th key={`measure-header-${i}`} className="border border-gray-300 px-2 py-1 font-medium text-center dark:bg-gray-800 dark:text-white">
                        <div className="flex flex-col items-center">
                          <span>{i + 1}</span>
                          <label className="flex items-center space-x-1 text-[10px]">
                            <input 
                              type="checkbox"
                              checked={fullColumnsBySize[size]?.[i] || false}
                              onChange={() => toggleFullColumn(size, i)}
                              className="w-3 h-3"
                            />
                            <span>Full</span>
                          </label>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(measurementSpecs.beforeWashGrouped[getKValueForSize(size, 'before')] || measurementSpecs.beforeWash)?.map((spec, index) => {
                    const area = spec.MeasurementPointEngName || `Point ${index + 1}`;
                    
                    // Get size-specific specs
                    const sizeSpec = Array.isArray(spec.Specs) ? spec.Specs.find(s => s.size === size) : null;
                    const specs = sizeSpec ? sizeSpec.fraction : (spec.Specs?.fraction || spec.Specs || '-');
                    
                    // Get size-specific tolerances
                    const sizeSpecTolMinus = Array.isArray(spec.ToleranceMinus) ? spec.ToleranceMinus.find(t => t.size === size) : null;
                    const sizeSpecTolPlus = Array.isArray(spec.TolerancePlus) ? spec.TolerancePlus.find(t => t.size === size) : null;
                    
                    const tolMinus = (sizeSpecTolMinus?.fraction || spec.TolMinus?.fraction || spec.ToleranceMinus?.fraction || spec.ToleranceMinus || '-').toString().trim();
                    const tolPlus = (sizeSpecTolPlus?.fraction || spec.TolPlus?.fraction || spec.TolerancePlus?.fraction || spec.TolerancePlus || '-').toString().trim();
                    const isSelected = selectedRowsBySize[size]?.[index] === true;
                    const shouldHide = hideUnselectedRowsBySize[size] && !isSelected;
                    if (shouldHide) return null;
                    
                    return (
                      <tr key={`k1-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                          <input
                            type="checkbox"
                            checked={selectedRowsBySize[size]?.[index] === true}
                            onChange={() => toggleRowSelection(size, index)}
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 dark:bg-gray-800 dark:text-white">{area}</td>
                        <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                          {tolMinus !== '-' && tolMinus !== '0' ? (tolMinus.startsWith('-') ? tolMinus : `-${tolMinus}`) : '0'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                          {tolPlus !== '-' && tolPlus !== '0' ? (tolPlus.startsWith('+') ? tolPlus : `+${tolPlus}`) : '0'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                          {specs !== '-' ? specs : '-'}
                        </td>
                        {[...Array(qty)].map((_, i) => {
                          const cellKey = `${size}-before-${index}-${i}`;
                          const value = measurementValues[cellKey];
                          const isFull = fullColumnsBySize[size]?.[i] === true;
                          const isRowSelected = selectedRowsBySize[size]?.[index] === true;
                          const isEnabled = isFull || isRowSelected;
                          const cellColorClass = !isEnabled
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : (value && typeof value.decimal === 'number'
                                ? (value.decimal >= fractionToDecimal(tolMinus) && value.decimal <= fractionToDecimal(tolPlus)
                                    ? 'bg-green-200 dark:bg-green-700'
                                    : 'bg-red-200 dark:bg-red-700')
                                : 'bg-transparent');

                          return (
                            <td
                              key={`measurement-input-${index}-${i}`}
                              className={`border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white ${cellColorClass} cursor-pointer`}
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentCell({
                                  size,
                                  table: "before",
                                  rowIndex: index,
                                  colIndex: i
                                });
                                setShowNumPad(true);
                              }}
                            >
                              <input
                                type="text"
                                value={value?.fraction || ""}
                                readOnly
                                className="w-full px-1 py-1 text-center border-0 bg-transparent dark:text-white"
                                placeholder="0.0"
                                style={{ pointerEvents: "none" }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* K2 Sheet - After Wash */}
        {before_after_wash === 'After Wash' && (
        <>
          <div className="flex justify-end mb-2">
            <button
              onClick={() =>
                setHideUnselectedRowsBySize(prev => ({
                  ...prev,
                  [size]: !prev[size],
                }))
              }
              className="text-xs px-3 py-1 border border-gray-400 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-white"
            >
              {hideUnselectedRowsBySize[size] ? 'Show All' : 'Hide Unselected'}
            </button>
          </div>

          <div className="bg-green-50 p-4 rounded-lg mb-4 dark:bg-gray-800 dark:text-white">
            <h5 className="text-sm font-medium mb-3">After Wash</h5>
            
            {Object.keys(measurementSpecs.afterWashGrouped).length > 1 && (
              <div className="mb-3">
                <label className="mr-2 text-sm font-medium">K Value:</label>
                <select
                  value={getKValueForSize(size, 'after')}
                  onChange={e => {
                    const selectedKValue = e.target.value;
                    setKValueForSize(size, 'after', selectedKValue);
                  }}
                  className="px-2 py-1 border rounded text-sm dark:text-white dark:bg-gray-800"
                >
                  {Object.keys(measurementSpecs.afterWashGrouped).map(kValue => {
                    // Check if this specific K-value is saved for THIS specific size
                    const isKValueSavedForThisSize = currentWashMeasurements.some(
                      m => m.size === size && m.kvalue === kValue
                    );
                    
                    return (
                      <option 
                        className="dark:bg-gray-800 dark:text-white" 
                        key={kValue} 
                        value={kValue}
                        disabled={isKValueSavedForThisSize}
                        style={isKValueSavedForThisSize ? { 
                          color: '#9CA3AF', 
                          backgroundColor: '#F3F4F6',
                          fontStyle: 'italic' 
                        } : {}}
                      >
                        {kValue === 'NA' ? 'General' : `${kValue}`}
                        {isKValueSavedForThisSize ? ' (Saved)' : ''}
                      </option>
                    );
                  })}
                </select>
                {/* Show info about current K-value status */}
                {currentWashMeasurements.some(m => m.size === size && m.kvalue === getKValueForSize(size, 'after')) && (
                  <div className="mt-1 text-xs text-blue-600">
                    This K-value is already saved for size {size}
                  </div>
                )}
              </div>
            )}        
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-xs dark:bg-gray-800 dark:text-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th rowSpan={2} className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">
                        
                      </th>
                      <th rowSpan={2} className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">Area</th>
                      <th colSpan={2} className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">Tolerance</th>
                      <th rowSpan={2} className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">Specs</th>
                      <th colSpan={selectedSizes.find(s => s.size === size)?.qty || 1} className="border border-gray-300 px-2 py-1 font-medium text-center dark:bg-gray-700 dark:text-white">
                        Measurements
                      </th>
                    </tr>
                    <tr>
                      <th className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">-</th>
                      <th className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">+</th>
                      {[...Array(qty)].map((_, i) => (
                        <th key={`measure-header-${i}`} className="border border-gray-300 px-2 py-1 font-medium text-center dark:bg-gray-800 dark:text-white">
                          <div className="flex flex-col items-center">
                            <span>{i + 1}</span>
                            <label className="flex items-center space-x-1 text-[10px]">
                              <input 
                                type="checkbox"
                                checked={fullColumnsBySize[size]?.[i] || false}
                                onChange={() => toggleFullColumn(size, i)}
                                className="w-3 h-3"
                              />
                              <span>Full</span>
                            </label>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(measurementSpecs.afterWashGrouped[getKValueForSize(size, 'after')] || measurementSpecs.afterWash)?.map((spec, index) => {
                      const isSelected = selectedRowsBySize[size]?.[index] === true;
                      const shouldHide = hideUnselectedRowsBySize[size] && !isSelected;
                      const area = spec.MeasurementPointEngName || `Point ${index + 1}`;
                      
                      // Get size-specific specs
                      const sizeSpec = Array.isArray(spec.Specs) ? spec.Specs.find(s => s.size === size) : null;
                      const specs = sizeSpec ? sizeSpec.fraction : (spec.Specs?.fraction || spec.Specs || '-');
                      
                      // Get size-specific tolerances
                      const sizeSpecTolMinus = Array.isArray(spec.ToleranceMinus) ? spec.ToleranceMinus.find(t => t.size === size) : null;
                      const sizeSpecTolPlus = Array.isArray(spec.TolerancePlus) ? spec.TolerancePlus.find(t => t.size === size) : null;
                      
                      const tolMinus = (sizeSpecTolMinus?.fraction || spec.TolMinus?.fraction || spec.ToleranceMinus?.fraction || spec.ToleranceMinus || '-').toString().trim();
                      const tolPlus = (sizeSpecTolPlus?.fraction || spec.TolPlus?.fraction || spec.TolerancePlus?.fraction || spec.TolerancePlus || '-').toString().trim();
                      
                      if (shouldHide) return null;
                      
                      return (
                        <tr
                          key={`k2-${index}`}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-600 ${!isSelected ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500' : ''}`}
                        >
                          <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                            <input
                              type="checkbox"
                              checked={selectedRowsBySize[size]?.[index] === true}
                              onChange={() => toggleRowSelection(size, index)}
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 dark:bg-gray-800 dark:text-white">{area}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                            {tolMinus !== '-' && tolMinus !== '0' ? (tolMinus.startsWith('-') ? tolMinus : `-${tolMinus}`) : '0'}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                            {tolPlus !== '-' && tolPlus !== '0' ? (tolPlus.startsWith('+') ? tolPlus : `+${tolPlus}`) : '0'}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                            {specs !== '-' ? specs : '-'}
                          </td>
                          {[...Array(qty)].map((_, i) => {
                            const cellKey = `${size}-after-${index}-${i}`;
                            const value = measurementValues[cellKey];
                            const isFull = fullColumnsBySize[size]?.[i] === true;
                            const isRowSelected = selectedRowsBySize[size]?.[index] ?? true;
                            const isEnabled = isFull || isRowSelected;
                            const cellColorClass = !isEnabled
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : (value && typeof value.decimal === 'number'
                                  ? (value.decimal >= fractionToDecimal(tolMinus) && value.decimal <= fractionToDecimal(tolPlus)
                                      ? 'bg-green-200 dark:bg-green-700'
                                      : 'bg-red-200 dark:bg-red-700')
                                  : 'bg-transparent');

                            return (
                              <td
                                key={`measurement-input-${index}-${i}`}
                                className={`border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white ${cellColorClass} cursor-pointer`}
                                onClick={e => {
                                  e.preventDefault();
                                  if (!isEnabled) return;
                                  setCurrentCell({ size, table: 'after', rowIndex: index, colIndex: i });
                                  setShowNumPad(true);
                                }}
                              >
                                <input
                                  type="text"
                                  value={value?.fraction || ''}
                                  readOnly
                                  className="w-full px-1 py-1 text-center border-0 bg-transparent dark:text-white"
                                  placeholder="0.0"
                                  style={{ pointerEvents: 'none' }}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <div>
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Measurement Details</h2>
        <button 
          onClick={onToggle}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
      <SummaryCard
        measurementData={measurementData}
        showMeasurementTable={showMeasurementTable}
        before_after_wash={before_after_wash}
        recordId={recordId}
        API_BASE_URL={API_BASE_URL}
      />
    </div>

    {noMeasurementData ? (
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
          Measurement Details
        </h4>
        <div className="text-sm text-gray-500 p-4 border border-gray-300 rounded">
          No measurement data are available for this style.
        </div>
      </div>
    ) : (
      isVisible && (
        <div className="space-y-6">
          {!orderNo || !color ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="text-sm text-yellow-700">Please select Order No and Color from Order Details section first.</div>
            </div>
          ) : (
            <>
              {loading && (
                <div className="text-center py-4">
                  <div className="text-sm text-gray-600">Loading sizes...</div>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="text-sm text-red-600">{error}</div>
                </div>
              )}
              
              {!loading && !error && (
                <div>
                  {sizes.length > 0 ? (
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center space-x-4">
                        <label htmlFor="size-select" className="text-sm font-medium dark:text-gray-300 dark:bg-gray-800">Select Sizes:</label>
                        <select 
                          id="size-select"
                          onChange={(e) => e.target.value && addSize(e.target.value)}
                          value=""
                          className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:text-gray-300 dark:bg-gray-800"
                        >
                          <option className="text-sm font-medium dark:text-gray-300 dark:bg-gray-800" value="">-- Select Size to Add --</option>
                          {sizes.map((size, index) => {
                            let sizeValue;
                            if (typeof size === 'object' && size !== null) {
                              sizeValue = size.size || size.Size || size.name || size.value || Object.values(size)[0] || 'Unknown';
                            } else {
                              sizeValue = size;
                            }
                            sizeValue = String(sizeValue);
                            
                            const isSelected = selectedSizes.find(s => s.size === sizeValue);
                            
                            // Check if ALL K-values are saved for this size
                            const currentSpecs = before_after_wash === 'Before Wash' 
                              ? measurementSpecs.beforeWashGrouped 
                              : measurementSpecs.afterWashGrouped;
                            const availableKValues = Object.keys(currentSpecs);
                            const savedKValues = currentWashMeasurements
                              .filter(m => m.size === sizeValue)
                              .map(m => m.kvalue);
                            
                            // Only hide if ALL K-values are saved AND not currently selected
                            const allKValuesSaved = availableKValues.length > 0 && availableKValues.every(kValue => savedKValues.includes(kValue));
                            const shouldShow = !allKValuesSaved || isSelected;
                            
                            return (
                              <option 
                                key={`size-${index}-${sizeValue}`} 
                                value={sizeValue}
                                style={!shouldShow ? { display: 'none' } : {}}
                              >
                                {sizeValue}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-300">
                        Note: Sizes are only hidden when ALL K-values are saved. You can re-select sizes with remaining K-values.
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-md">
                      No sizes available for this order and color
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {selectedSizes.length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-3 dark:text-white dark:bg-gray-800">Selected Sizes</h3>
              <div className="space-y-2">
                {selectedSizes.map(({ size, qty }) => {
                  // Check if current K-value for this size is saved
                  const currentKValue = getKValueForSize(size, before_after_wash === 'Before Wash' ? 'before' : 'after');
                  const isCurrentKValueSaved = isSizeKValueSaved(size, currentKValue);
                  const savedKValues = getSavedKValuesForSize(size);
                  const hasAvailableKVals = hasAvailableKValues(size);
                  
                  return (
                    <div key={size} className={`flex items-center justify-between p-3 border rounded-md ${
                      isCurrentKValueSaved ? 'bg-gray-100 border-gray-300 dark:bg-gray-600 dark:border-gray-500' : 'bg-white dark:bg-gray-800'
                    }`}>
                      <div className={`font-medium ${
                        isCurrentKValueSaved ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                      }`}>
                        <div>Size: {size} (K: {currentKValue}) {isCurrentKValueSaved ? '(Current K-value saved)' : ''}</div>
                        {savedKValues.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            Saved K-values: {savedKValues.join(', ')}
                          </div>
                        )}
                        {!areAllKValuesSaved(size) && (
                          <div className="text-xs text-green-600 mt-1">
                            More K-values available
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQty(size, -1)}
                            disabled={isCurrentKValueSaved}
                            className={`p-1 rounded-full dark:bg-gray-700 ${
                              isCurrentKValueSaved 
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:text-gray-500'
                                : 'bg-red-100 text-red-600 hover:bg-red-200 dark:text-red-400'
                            }`}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center dark:text-gray-300">{qty}</span>
                          <button
                            onClick={() => updateQty(size, 1)}
                            disabled={isCurrentKValueSaved}
                            className={`p-1 rounded-full dark:bg-gray-700 ${
                              isCurrentKValueSaved 
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:text-gray-500'
                                : 'bg-green-100 text-green-600 hover:bg-green-200 dark:text-green-400'
                            }`}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeSize(size)}
                          className="px-3 py-1 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 dark:bg-gray-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Show saved measurement data */}
          {currentWashMeasurements.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Saved Measurement Data</h3>
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
                {currentWashMeasurements.map((data, index) => (
                  <div key={`saved-${data.size}-${data.kvalue}-${index}`} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-800 text-xs">
                        {data.size} : {data.qty}
                        <br />
                        <span className="text-blue-600">K: {data.kvalue || 'N/A'}</span>
                      </h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(data.size, data.kvalue)}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <span className="text-xs text-gray-900 font-bold bg-green-300 px-2 py-1 rounded-full">
                          Saved
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {/* Total Checked Points */}
                      <div className="bg-gray-100 p-2 rounded-md text-center">
                        <span className="text-blue-500 font-semibold text-xl">
                          {data.pcs.flatMap(pc => pc.measurementPoints).length}
                        </span>
                        <p className="text-s text-gray-900">📝</p>
                      </div>
                      {/* Pass Count */}
                      <div className="bg-green-100 p-2 rounded-md text-center">
                        <span className="text-green-500 font-semibold text-xl">
                          {data.pcs.flatMap(pc => pc.measurementPoints).filter(point => point.result === 'pass').length}
                        </span>
                        <p className="text-s text-gray-900">✔️</p>
                      </div>
                      {/* Fail Count */}
                      <div className="bg-red-100 p-2 rounded-md text-center">
                        <span className="text-red-500 font-semibold text-xl">
                          {data.pcs.flatMap(pc => pc.measurementPoints).filter(point => point.result === 'fail').length}
                        </span>
                        <p className="text-s text-gray-900">❌</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show measurement table for new sizes */}
          {showMeasurementTable && selectedSizes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Measurement Input</h3>
              <div className="grid grid-cols-1 gap-6">
                {selectedSizes.map(({ size, qty }) => {
                  // Check if current K-value for this size is saved
                  const currentKValue = getKValueForSize(size, before_after_wash === 'Before Wash' ? 'before' : 'after');
                  const isCurrentKValueSaved = currentWashMeasurements.some(
                    m => m.size === size && m.kvalue === currentKValue
                  );
                  const isEditing = editingMeasurements.has(`${size}-${currentKValue}`);
                  
                  // Only show measurement table if current K-value is NOT saved OR is being edited
                  if (isCurrentKValueSaved && !isEditing) return null;
                  
                  return (
                    <div key={`measurement-container-${size}`} className="border rounded-lg p-4 bg-white border-gray-200 dark:bg-gray-800 dark:text-white">
                      {renderMeasurementTable(size, qty)}
                      {onSizeSubmit && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => {
                              const tableType = before_after_wash === 'Before Wash' ? 'before' : 'after';
                              const kvalue = getKValueForSize(size, tableType);
                              
                              // Check if this K-value is already saved for this size (but allow editing)
                              const isAlreadySaved = currentWashMeasurements.some(
                                m => m.size === size && m.kvalue === kvalue
                              );
                              const isEditing = editingMeasurements.has(`${size}-${kvalue}`);
                              
                              if (isAlreadySaved && !isEditing) {
                                Swal.fire({
                                  icon: 'warning',
                                  title: 'K-Value Already Saved',
                                  text: `Size ${size} with K-value ${kvalue} is already saved. Please select a different K-value.`,
                                });
                                return;
                              }
                              
                              const validationErrors = [];
                              const specsForSubmit = before_after_wash === 'Before Wash'
                                ? (measurementSpecs.beforeWashGrouped[kvalue] || measurementSpecs.beforeWash || [])
                                : (measurementSpecs.afterWashGrouped[kvalue] || measurementSpecs.afterWash || []);
                              
                              const isFullColumnChecked = fullColumnsBySize[size] || [];
                              const isRowSelected = selectedRowsBySize[size] || Array(specsForSubmit.length).fill(true);
                              
                              for (let pcIndex = 0; pcIndex < qty; pcIndex++) {
                                const isFull = isFullColumnChecked[pcIndex];
                                if (isFull) {
                                  const isAnyEmpty = specsForSubmit.some((spec, specIndex) => {
                                    const cellKey = `${size}-${tableType}-${specIndex}-${pcIndex}`;
                                    return !measurementValues[cellKey] || !measurementValues[cellKey].fraction;
                                  });
                                  if (isAnyEmpty) {
                                    validationErrors.push(`You must fill all the measurement points in "pcs ${pcIndex + 1}".`);
                                  }
                                } else {
                                  specsForSubmit.forEach((spec, specIndex) => {
                                    if (isRowSelected[specIndex]) {
                                      const cellKey = `${size}-${tableType}-${specIndex}-${pcIndex}`;
                                      if (!measurementValues[cellKey] || !measurementValues[cellKey].fraction) {
                                        validationErrors.push(`Piece ${pcIndex + 1}: Measurement for selected row "${spec.MeasurementPointEngName}" is required.`);
                                      }
                                    }
                                  });
                                }
                              }
                              
                              if (validationErrors.length > 0) {
                                Swal.fire({
                                  icon: 'error',
                                  title: 'Incomplete Measurements',
                                  html: `<div style="text-align: left; max-height: 200px; overflow-y: auto;"><ul>${validationErrors.map(e => `<li>${e}</li>`).join('')}</ul></div>`,
                                });
                                return;
                              }
                              
                              const transformedData = transformMeasurementData(
                                size, 
                                qty, 
                                measurementValues, 
                                selectedRowsBySize[size], 
                                fullColumnsBySize[size], 
                                specsForSubmit, 
                                tableType, 
                                kvalue,
                                before_after_wash,
                                isEditing // Pass editing flag
                              );
                              
                              // Save the pattern for future use
                              saveMeasurementPattern(size, selectedRowsBySize[size], tableType);
                              onSizeSubmit(transformedData);
                              
                              // Remove from editing state
                              setEditingMeasurements(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(`${size}-${kvalue}`);
                                return newSet;
                              });
                              
                              // Always remove the size from selectedSizes after saving
                              // User needs to manually select it again to work on next K-value
                              setSelectedSizes(prev => prev.filter(s => s.size !== size));
                              
                              // Clean up related state
                              setSelectedRowsBySize(prev => {
                                const next = { ...prev };
                                delete next[size];
                                return next;
                              });
                              
                              setFullColumnsBySize(prev => {
                                const next = { ...prev };
                                delete next[size];
                                return next;
                              });
                              
                              setMeasurementValues(prev => {
                                const newValues = { ...prev };
                                Object.keys(newValues).forEach(key => {
                                  if (key.startsWith(`${size}-before-`) || key.startsWith(`${size}-after-`)) {
                                    delete newValues[key];
                                  }
                                });
                                return newValues;
                              });
                              
                              // Clear size-specific K-values
                              setSizeSpecificKValues(prev => {
                                const newValues = { ...prev };
                                delete newValues[`${size}-before`];
                                delete newValues[`${size}-after`];
                                return newValues;
                              });
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            Save Size {size} (K: {getKValueForSize(size, before_after_wash === 'Before Wash' ? 'before' : 'after')})
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )
    )}

    {showNumPad && (
      <MeasurementNumPad
        onClose={() => setShowNumPad(false)}
        onInput={(decimalValue, fractionValue) => {
          const { size, table, rowIndex, colIndex } = currentCell;
          const cellKey = `${size}-${table}-${rowIndex}-${colIndex}`;
          setMeasurementValues(prev => ({
            ...prev,
            [cellKey]: { decimal: decimalValue, fraction: fractionValue }
          }));
          setShowNumPad(false);
        }}
      />
    )}
  </div>
);

};

MeasurementDetailsSection.propTypes = {
  orderNo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  color: PropTypes.string,
  isVisible: PropTypes.bool,
  onToggle: PropTypes.func,
  savedSizes: PropTypes.array,
  setSavedSizes: PropTypes.func,
  onSizeSubmit: PropTypes.func,
  measurementData: PropTypes.shape({
    beforeWash: PropTypes.array,
    afterWash: PropTypes.array,
  }),
  showMeasurementTable: PropTypes.bool,
  onMeasurementEdit: PropTypes.func,
  before_after_wash: PropTypes.string,
  recordId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default MeasurementDetailsSection;