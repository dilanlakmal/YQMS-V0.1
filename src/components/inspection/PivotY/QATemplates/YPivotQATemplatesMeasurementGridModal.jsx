import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Minus,
  Save,
  Search,
  Check,
  AlertTriangle,
  Edit3
} from "lucide-react";
import MeasurementNumPad from "../../cutting/MeasurementNumPad";
import {
  checkTolerance,
  formatToleranceDisplay
} from "./YPivotQATemplatesHelpers";

const YPivotQATemplatesMeasurementGridModal = ({
  isOpen,
  onClose,
  specsData,
  selectedSize,
  selectedKValue,
  initialQty = 3,
  displayMode = "selected",
  onSave,
  measType,
  editingData = null, // Existing measurement data for editing
  isEditing = false // Flag to indicate edit mode
}) => {
  // --- Local State ---
  const [qty, setQty] = useState(initialQty);
  const [measurements, setMeasurements] = useState({});
  const [activePcsIndices, setActivePcsIndices] = useState(new Set([0]));
  const [activeCell, setActiveCell] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize measurements - either with existing data (editing) or fresh zeros (new)
  useEffect(() => {
    if (isOpen && specsData.length > 0) {
      if (isEditing && editingData) {
        // =====================================================================
        // EDITING MODE: Load existing measurement data
        // =====================================================================
        console.log(
          "Loading existing measurement data for editing:",
          editingData
        );

        // Set quantity from existing data
        setQty(editingData.qty || initialQty);

        // Set active pcs indices from existing data
        if (editingData.selectedPcs) {
          if (editingData.selectedPcs === "ALL") {
            const allIndices = new Set(
              Array.from({ length: editingData.qty || initialQty }, (_, i) => i)
            );
            setActivePcsIndices(allIndices);
          } else if (Array.isArray(editingData.selectedPcs)) {
            setActivePcsIndices(new Set(editingData.selectedPcs));
          } else {
            setActivePcsIndices(new Set([0]));
          }
        } else {
          setActivePcsIndices(new Set([0]));
        }

        // Load existing measurements - deep clone to avoid mutation
        if (
          editingData.measurements &&
          Object.keys(editingData.measurements).length > 0
        ) {
          const loadedMeasurements = JSON.parse(
            JSON.stringify(editingData.measurements)
          );
          console.log("Loaded measurements:", loadedMeasurements);
          setMeasurements(loadedMeasurements);
        } else {
          // Initialize with zeros if no measurements exist
          const initialMeasurements = {};
          specsData.forEach((spec) => {
            initialMeasurements[spec.id] = {};
            for (let i = 0; i < (editingData.qty || initialQty); i++) {
              initialMeasurements[spec.id][i] = { decimal: 0, fraction: "0" };
            }
          });
          setMeasurements(initialMeasurements);
        }
      } else {
        // =====================================================================
        // NEW MODE: Initialize with fresh zero values
        // =====================================================================
        console.log("Initializing fresh measurement data");
        setQty(initialQty);
        const initialMeasurements = {};
        specsData.forEach((spec) => {
          initialMeasurements[spec.id] = {};
          for (let i = 0; i < initialQty; i++) {
            initialMeasurements[spec.id][i] = { decimal: 0, fraction: "0" };
          }
        });
        setMeasurements(initialMeasurements);
        setActivePcsIndices(new Set([0]));
      }

      // Reset search when modal opens
      setSearchTerm("");
    }
  }, [isOpen, specsData, isEditing, editingData, initialQty]);

  // Filter specs based on K value and search
  const filteredSpecs = useMemo(() => {
    let specs = specsData;

    // Filter by K value for Before Wash
    if (selectedKValue && measType === "Before") {
      specs = specs.filter(
        (s) => s.kValue === selectedKValue || s.kValue === "NA"
      );
    }

    // Filter by search term
    if (searchTerm) {
      specs = specs.filter(
        (s) =>
          s.MeasurementPointEngName?.toLowerCase().includes(
            searchTerm.toLowerCase()
          ) ||
          s.MeasurementPointChiName?.toLowerCase().includes(
            searchTerm.toLowerCase()
          )
      );
    }

    return specs;
  }, [specsData, selectedKValue, measType, searchTerm]);

  if (!isOpen) return null;

  const togglePcsActive = (index) => {
    const newSet = new Set(activePcsIndices);
    if (newSet.has(index)) {
      if (newSet.size > 1) {
        newSet.delete(index);
      }
    } else {
      newSet.add(index);
    }
    setActivePcsIndices(newSet);
  };

  const handleNumPadInput = (decimal, fraction) => {
    if (activeCell) {
      setMeasurements((prev) => ({
        ...prev,
        [activeCell.specId]: {
          ...(prev[activeCell.specId] || {}),
          [activeCell.sampleIndex]: { decimal, fraction }
        }
      }));
      setActiveCell(null);
    }
  };

  const handleCellClick = (specId, sampleIndex) => {
    if (activePcsIndices.has(sampleIndex)) {
      setActiveCell({ specId, sampleIndex });
    }
  };

  const handleSave = () => {
    const result = {
      size: selectedSize,
      kValue: selectedKValue,
      qty: qty,
      measurements: measurements,
      selectedPcs: Array.from(activePcsIndices),
      measType: measType,
      timestamp: new Date().toISOString(),
      displayMode: displayMode
    };

    console.log("Saving measurement data:", result);
    onSave(result);
    onClose();
  };

  // Handle qty change - ensure measurements object has all columns
  const handleQtyChange = (newQty) => {
    setQty(newQty);

    // Add new columns to measurements if needed
    setMeasurements((prev) => {
      const updated = { ...prev };
      specsData.forEach((spec) => {
        if (!updated[spec.id]) {
          updated[spec.id] = {};
        }
        for (let i = 0; i < newQty; i++) {
          if (!updated[spec.id][i]) {
            updated[spec.id][i] = { decimal: 0, fraction: "0" };
          }
        }
      });
      return updated;
    });
  };

  // Check completion stats
  const getCompletionStats = () => {
    let total = 0;
    let filled = 0;

    filteredSpecs.forEach((spec) => {
      activePcsIndices.forEach((pcsIndex) => {
        total++;
        const val = measurements[spec.id]?.[pcsIndex];
        if (val && val.decimal !== 0) {
          filled++;
        }
      });
    });

    return {
      total,
      filled,
      percentage: total > 0 ? Math.round((filled / total) * 100) : 0
    };
  };

  const completionStats = getCompletionStats();

  // Render Table Rows
  const renderRows = () => {
    return filteredSpecs.map((spec, index) => {
      const specValueObj = spec.Specs?.find((s) => s.size === selectedSize);
      const specValueDisplay =
        specValueObj?.fraction || specValueObj?.decimal?.toString() || "-";

      const tolMinusDisplay = formatToleranceDisplay(spec.TolMinus, true);
      const tolPlusDisplay = formatToleranceDisplay(spec.TolPlus, false);

      const specId = spec.id || index;

      return (
        <tr
          key={specId}
          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          {/* Measurement Point Name */}
          <td className="p-2 sm:p-3 border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-900 z-[5]">
            <div className="max-w-[120px] sm:max-w-[200px]">
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
                {spec.MeasurementPointEngName}
              </span>
              {spec.MeasurementPointChiName && (
                <span className="text-[10px] text-gray-400 block truncate">
                  {spec.MeasurementPointChiName}
                </span>
              )}
            </div>
          </td>

          {/* Tol - */}
          <td className="p-1 sm:p-2 text-center text-xs font-mono border-r dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
            <span className="text-red-600 dark:text-red-400">
              -{tolMinusDisplay}
            </span>
          </td>

          {/* Spec Value */}
          <td className="p-1 sm:p-2 text-center text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 border-r dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            {specValueDisplay}
          </td>

          {/* Tol + */}
          <td className="p-1 sm:p-2 text-center text-xs font-mono border-r dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
            <span className="text-green-600 dark:text-green-400">
              +{tolPlusDisplay}
            </span>
          </td>

          {/* Pcs Columns */}
          {Array.from({ length: qty }).map((_, pcsIndex) => {
            const currentVal = measurements[specId]?.[pcsIndex] || {
              decimal: 0,
              fraction: "0"
            };
            const displayVal = currentVal.fraction || "0";
            const numVal = currentVal.decimal || 0;

            const isActive = activePcsIndices.has(pcsIndex);
            const toleranceResult = checkTolerance(spec, numVal, selectedSize);

            let cellBgClass = "bg-gray-100 dark:bg-gray-800";
            let textClass = "text-gray-400";

            if (isActive) {
              if (toleranceResult.isDefault) {
                cellBgClass = "bg-gray-50 dark:bg-gray-700";
                textClass = "text-gray-600 dark:text-gray-400";
              } else if (toleranceResult.isWithin) {
                cellBgClass = "bg-green-100 dark:bg-green-900/40";
                textClass = "text-green-700 dark:text-green-300";
              } else {
                cellBgClass = "bg-red-100 dark:bg-red-900/40";
                textClass = "text-red-700 dark:text-red-300";
              }
            }

            return (
              <td
                key={pcsIndex}
                className="p-1 border-r border-gray-200 dark:border-gray-700 min-w-[60px] sm:min-w-[80px]"
              >
                <button
                  disabled={!isActive}
                  onClick={() => handleCellClick(specId, pcsIndex)}
                  className={`w-full h-9 sm:h-10 rounded-lg border flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${cellBgClass} ${textClass} ${
                    isActive
                      ? "border-gray-300 dark:border-gray-600 cursor-pointer hover:shadow-md active:scale-95"
                      : "border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50"
                  }`}
                >
                  {displayVal}
                </button>
              </td>
            );
          })}
        </tr>
      );
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col h-[100dvh] animate-fadeIn">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center shadow-lg safe-area-top">
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-base sm:text-xl truncate flex items-center gap-2">
            {isEditing && <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />}
            {isEditing ? "Edit Measurement" : "Measurement Entry"}
          </h2>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
              Size: {selectedSize}
            </span>
            {selectedKValue && (
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                K: {selectedKValue}
              </span>
            )}
            <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold">
              {measType} Wash
            </span>
            {isEditing && (
              <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full font-semibold">
                EDITING
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors ml-2"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex-shrink-0 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search measurement point..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Qty Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                Qty:
              </span>
              <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm">
                <button
                  onClick={() => handleQtyChange(Math.max(1, qty - 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-l-lg transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-10 text-center font-bold text-gray-800 dark:text-white text-sm">
                  {qty}
                </div>
                <button
                  onClick={() => handleQtyChange(qty + 1)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${completionStats.percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {completionStats.filled}/{completionStats.total}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 shadow-sm">
            <tr>
              <th className="p-2 sm:p-3 text-left text-[10px] sm:text-xs font-bold text-gray-500 uppercase border-r dark:border-gray-700 sticky left-0 bg-gray-100 dark:bg-gray-800 z-[15] min-w-[120px] sm:min-w-[200px]">
                Measurement Point
              </th>
              <th className="p-1 sm:p-2 text-center text-[10px] sm:text-xs font-bold text-red-500 uppercase border-r dark:border-gray-700 w-12 sm:w-16 bg-red-50 dark:bg-red-900/20">
                Tol-
              </th>
              <th className="p-1 sm:p-2 text-center text-[10px] sm:text-xs font-bold text-blue-600 uppercase border-r dark:border-gray-700 w-12 sm:w-16 bg-blue-50 dark:bg-blue-900/20">
                Spec
              </th>
              <th className="p-1 sm:p-2 text-center text-[10px] sm:text-xs font-bold text-green-500 uppercase border-r dark:border-gray-700 w-12 sm:w-16 bg-green-50 dark:bg-green-900/20">
                Tol+
              </th>

              {/* Pcs Headers with Checkboxes */}
              {Array.from({ length: qty }).map((_, i) => (
                <th
                  key={i}
                  className={`p-1 sm:p-2 text-center border-r dark:border-gray-700 min-w-[60px] sm:min-w-[80px] transition-colors ${
                    activePcsIndices.has(i)
                      ? "bg-indigo-100 dark:bg-indigo-900/30"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  <button
                    onClick={() => togglePcsActive(i)}
                    className="flex flex-col items-center justify-center w-full gap-1"
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        activePcsIndices.has(i)
                          ? "bg-indigo-500 border-indigo-500 text-white"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      }`}
                    >
                      {activePcsIndices.has(i) && <Check className="w-3 h-3" />}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-bold ${
                        activePcsIndices.has(i)
                          ? "text-indigo-700 dark:text-indigo-300"
                          : "text-gray-400"
                      }`}
                    >
                      Pcs {i + 1}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900">{renderRows()}</tbody>
        </table>

        {filteredSpecs.length === 0 && (
          <div className="text-center py-16">
            <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No measurement points found.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 safe-area-bottom">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400 text-xs">
                Pass
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400 text-xs">
                Fail
              </span>
            </div>
            {isEditing && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium ml-2">
                • Editing Mode
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">
              {isEditing ? "Update Measurements" : "Save Measurements"}
            </span>
            <span className="sm:hidden">{isEditing ? "Update" : "Save"}</span>
          </button>
        </div>
      </div>

      {/* NumPad */}
      {activeCell && (
        <MeasurementNumPad
          onClose={() => setActiveCell(null)}
          onInput={handleNumPadInput}
          initialValue={
            measurements[activeCell.specId]?.[activeCell.sampleIndex]?.decimal
          }
        />
      )}
    </div>,
    document.body
  );
};

export default YPivotQATemplatesMeasurementGridModal;
