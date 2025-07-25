import React, { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import Swal from "sweetalert2";
import MeasurementNumPad from "../../cutting/MeasurementNumPad";
import SummaryCard from "../Home/SummaryCard";

const MeasurementDetailsSection = ({
  orderNo,
  color,
  isVisible,
  onToggle,
  savedSizes = [],
  onSizeSubmit,
  measurementData = { beforeWash: [], afterWash: [] },
  showMeasurementTable = true,
  onMeasurementEdit,
  reportType
}) => {
  const [sizes, setSizes] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [measurementSpecs, setMeasurementSpecs] = useState({
    beforeWash: [],
    afterWash: [],
    beforeWashGrouped: {},
    afterWashGrouped: {}
  });
  const [activeBeforeTab, setActiveBeforeTab] = useState("");
  const [activeAfterTab, setActiveAfterTab] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fullColumnsBySize, setFullColumnsBySize] = useState({});
  const [selectedRowsBySize, setSelectedRowsBySize] = useState({});
  const [hideUnselectedRowsBySize, setHideUnselectedRowsBySize] = useState({});
  const [selectAllBySize, setSelectAllBySize] = useState({});
  const [showNumPad, setShowNumPad] = useState(false);
  const [currentCell, setCurrentCell] = useState({
    size: null,
    table: null,
    rowIndex: null,
    colIndex: null
  });
  const [measurementValues, setMeasurementValues] = useState({});

  const currentWashMeasurements =
    (reportType === "Before Wash"
      ? measurementData.beforeWash
      : measurementData.afterWash) || [];

  // Transform measurement data into nested structure
  const transformMeasurementData = (
    size,
    qty,
    measurements,
    selectedRows,
    fullColumns,
    measurementSpecs,
    tableType
  ) => {
    const pcs = [];
    for (let pcIndex = 0; pcIndex < qty; pcIndex++) {
      const measurementPoints = [];
      const isFullColumn = fullColumns?.[pcIndex] || false;

      measurementSpecs.forEach((spec, specIndex) => {
        const isRowIndividuallySelected = selectedRows?.[specIndex] ?? true;

        // If the column is not 'Full', only include individually selected rows.
        if (!isFullColumn && !isRowIndividuallySelected) return;

        const cellKey = `${size}-${tableType}-${specIndex}-${pcIndex}`;
        const measurementValue = measurements?.[cellKey];

        // Determine the pass/fail result based on the same logic as the UI
        let result = "";
        if (measurementValue && typeof measurementValue.decimal === "number") {
          const measuredDeviation = measurementValue.decimal;
          const tolMinus = spec.ToleranceMinus || "0";
          const tolPlus = spec.TolerancePlus || "0";
          const tolMinusValue = fractionToDecimal(tolMinus);
          const tolPlusValue = fractionToDecimal(tolPlus);

          if (!isNaN(tolMinusValue) && !isNaN(tolPlusValue)) {
            if (
              measuredDeviation >= tolMinusValue &&
              measuredDeviation <= tolPlusValue
            ) {
              result = "pass";
            } else {
              result = "fail";
            }
          }
        }

        measurementPoints.push({
          pointName: spec.MeasurementPointEngName || `Point ${specIndex + 1}`,
          value:
            measurementValue?.decimal ?? (measurementValue?.fraction || ""),
          specs: spec.Specs?.fraction || spec.Specs || "-",
          toleranceMinus: spec.ToleranceMinus || "0",
          tolerancePlus: spec.TolerancePlus || "0",
          specIndex: specIndex,
          isFullColumn: fullColumns?.[pcIndex] || false,
          result: result
        });
      });

      pcs.push({
        pcNumber: pcIndex + 1,
        measurementPoints: measurementPoints
      });
    }

    return {
      size: size,
      qty: qty,
      pcs: pcs,
      selectedRows: selectedRows,
      fullColumns: fullColumns,
      measurements: measurements
    };
  };

  const fractionToDecimal = (frac) => {
    if (typeof frac !== "string" || !frac || frac.trim() === "-") return NaN;

    // Standardize fraction characters
    frac = frac
      .replace("⁄", "/")
      .replace("½", "1/2")
      .replace("¼", "1/4")
      .replace("¾", "3/4")
      .replace("⅛", "1/8")
      .replace("⅜", "3/8")
      .replace("⅝", "5/8")
      .replace("⅞", "7/8")
      .trim();

    const isNegative = frac.startsWith("-");
    if (isNegative) {
      frac = frac.substring(1);
    }

    let total = 0;
    if (frac.includes("/")) {
      const parts = frac.split(" ");
      if (parts.length > 1 && parts[0]) {
        total += parseFloat(parts[0]);
      }
      const fractionPart = parts.length > 1 ? parts[1] : parts[0];
      const [num, den] = fractionPart.split("/").map(Number);
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

  const handleEditClick = (sizeToEdit) => {
    const washTypeKey =
      reportType === "Before Wash" ? "beforeWash" : "afterWash";
    const dataToEdit = (measurementData[washTypeKey] || []).find(
      (item) => item.size === sizeToEdit
    );

    if (!dataToEdit) {
      console.error("Data to edit not found for size:", sizeToEdit);
      return;
    }

    // Add the size to the list of sizes being actively edited/viewed
    setSelectedSizes((prev) => {
      if (prev.some((s) => s.size === sizeToEdit)) {
        return prev.map((s) =>
          s.size === sizeToEdit ? { ...s, qty: dataToEdit.qty } : s
        );
      }
      return [...prev, { size: sizeToEdit, qty: dataToEdit.qty }];
    });

    // Populate the measurement values state from the saved data
    if (dataToEdit.measurements) {
      setMeasurementValues((prev) => ({
        ...prev,
        ...dataToEdit.measurements
      }));
    }

    // Populate the row/column selection states
    if (dataToEdit.selectedRows) {
      setSelectedRowsBySize((prev) => ({
        ...prev,
        [sizeToEdit]: dataToEdit.selectedRows
      }));
    }
    if (dataToEdit.fullColumns) {
      setFullColumnsBySize((prev) => ({
        ...prev,
        [sizeToEdit]: dataToEdit.fullColumns
      }));
    }

    // Trigger the parent to remove it from the "saved" data state.
    // This will cause a re-render, removing it from the "Saved" list
    // and showing it in the "Measurement Input" section.
    if (onMeasurementEdit) {
      onMeasurementEdit(sizeToEdit);
    }
  };

  useEffect(() => {
    if (orderNo && color) {
      fetchSizes();
      fetchMeasurementSpecs();
    } else {
      setSizes([]);
      setSelectedSizes([]);
      setMeasurementSpecs({
        beforeWash: [],
        afterWash: [],
        beforeWashGrouped: {},
        afterWashGrouped: {}
      });
    }
  }, [orderNo, color]);

  const fetchSizes = async () => {
    try {
      setLoading(true);
      setError(null);
      // console.log('Fetching sizes for:', orderNo, color);
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/order-sizes/${orderNo}/${color}`
      );
      const data = await response.json();
      // console.log('Sizes response:', data);

      if (data.success) {
        // Handle case where API returns 'Sizes' instead of 'sizes'
        const availableSizes = data.sizes || data.Sizes || [];
        setSizes(availableSizes);
        // console.log('Set sizes:', availableSizes);

        // Automatically populate selected sizes with a default quantity when they are fetched
        // const initialSelectedSizes = availableSizes.map(size => {
        //   let sizeValue;
        //   if (typeof size === 'object' && size !== null) {
        //     sizeValue = size.size || size.Size || size.name || size.value || Object.values(size)[0] || 'Unknown';
        //   } else {
        //     sizeValue = size;
        //   }
        //   return { size: String(sizeValue), qty: 5 };
        // });
        // setSelectedSizes(initialSelectedSizes);
        setSelectedSizes([]);
      } else {
        setError(data.message || "Failed to fetch sizes");
        setSizes([]);
        setSelectedSizes([]);
      }
    } catch (error) {
      console.error("Error fetching sizes:", error);
      setError("Error fetching sizes");
      setSizes([]);
      setSelectedSizes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeasurementSpecs = async () => {
    try {
      // console.log('Fetching measurement specs for:', orderNo, color);
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/measurement-specs/${orderNo}/${color}`
      );
      const data = await response.json();

      // console.log('Measurement specs response:', data);

      if (response.ok && data.success) {
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

        // console.log('Set measurement specs:', {
        //   beforeWash: data.beforeWashSpecs || [],
        //   afterWash: data.afterWashSpecs || [],
        //   beforeWashGrouped,
        //   afterWashGrouped
        // });
      } else {
        // console.error('Failed to fetch measurement specs:', data.message);
        setMeasurementSpecs({
          beforeWash: [],
          afterWash: [],
          beforeWashGrouped: {},
          afterWashGrouped: {}
        });
      }
    } catch (error) {
      console.error("Error fetching measurement specs:", error);
      setMeasurementSpecs({
        beforeWash: [],
        afterWash: [],
        beforeWashGrouped: {},
        afterWashGrouped: {}
      });
    }
  };

  const convertToFraction = (value) => {
    if (!value || value === "-") return "-";
    const num = parseFloat(value.toString().replace(/[+-]/g, ""));

    const fractions = {
      0.125: "1/8",
      0.25: "1/4",
      0.375: "3/8",
      0.5: "1/2",
      0.625: "5/8",
      0.75: "3/4",
      0.875: "7/8"
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
    if (!selectedSizes.find((s) => s.size === sizeStr)) {
      const newSize = { size: sizeStr, qty: 5 };
      setSelectedSizes((prev) => [...prev, newSize]);
    }
  };

  const removeSize = (size) => {
    setSelectedSizes((prev) => prev.filter((s) => s.size !== size));
  };

  const updateQty = (size, change) => {
    setSelectedSizes((prev) =>
      prev.map((s) =>
        s.size === size ? { ...s, qty: Math.max(1, s.qty + change) } : s
      )
    );
  };

  const toggleFullColumn = (size, columnIndex) => {
    setFullColumnsBySize((prev) => {
      const prevForSize = prev[size] || [];
      const updated = [...prevForSize];
      updated[columnIndex] = !updated[columnIndex];
      return {
        ...prev,
        [size]: updated
      };
    });
  };

  const toggleSelectAll = (size) => {
    setSelectAllBySize((prev) => ({
      ...prev,
      [size]: !prev[size]
    }));
    setSelectedRowsBySize((prev) => ({
      ...prev,
      [size]:
        prev[size]?.map(() => !prev[size][0]) ||
        Array(
          measurementSpecs.beforeWash?.length ||
            measurementSpecs.afterWash?.length
        ).fill(!prev[size]?.[0])
    }));
  };

  const toggleRowSelection = (size, rowIndex) => {
    setSelectedRowsBySize((prev) => {
      const prevSelections =
        prev[size] ||
        Array(
          measurementSpecs.beforeWash?.length ||
            measurementSpecs.afterWash?.length
        ).fill(true);
      const updatedSelections = [...prevSelections];
      updatedSelections[rowIndex] = !updatedSelections[rowIndex];

      // Update selectAll state based on row selections
      const allSelected = updatedSelections.every(Boolean);
      setSelectAllBySize((prevSelectAll) => ({
        ...prevSelectAll,
        [size]: allSelected
      }));

      return { ...prev, [size]: updatedSelections };
    });
  };

  const toggleSelectAllRows = (size, checked, tableType) => {
    const specs =
      tableType === "before"
        ? measurementSpecs.beforeWashGrouped[activeBeforeTab] ||
          measurementSpecs.beforeWash
        : measurementSpecs.afterWashGrouped[activeAfterTab] ||
          measurementSpecs.afterWash;

    const newSelections = specs.map(() => checked);

    setSelectedRowsBySize((prev) => ({
      ...prev,
      [size]: newSelections
    }));
  };

  const renderMeasurementTable = (size, qty) => {
    if (
      !measurementSpecs ||
      (!measurementSpecs.beforeWash?.length &&
        !measurementSpecs.afterWash?.length)
    ) {
      return (
        <div className="mb-8" key={`table-${size}`}>
          <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
            Size: {size} (Qty: {qty})
          </h4>
          <div className="text-sm text-gray-500 p-4 border border-gray-300 rounded">
            No measurement specifications available
          </div>
        </div>
      );
    }

    return (
      <div key={`measurement-${size}`} className="mb-8">
        <h4 className="text-lg font-semibold mb-4 border-b pb-2 text-gray-800 dark:text-white">
          Size: {size} (Qty: {qty})
        </h4>

        {/* K1 Sheet - Before Wash */}
        {reportType === "Before Wash" && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4 dark:bg-gray-800 dark:text-white">
            <h5 className="text-sm font-medium mb-3">Before Wash</h5>

            {Object.keys(measurementSpecs.beforeWashGrouped).length > 1 && (
              <div className="flex space-x-2 mb-3">
                {Object.keys(measurementSpecs.beforeWashGrouped).map(
                  (kValue) => (
                    <button
                      key={kValue}
                      onClick={() => setActiveBeforeTab(kValue)}
                      className={`px-3 py-1 text-xs rounded ${
                        activeBeforeTab === kValue
                          ? "bg-blue-600 text-white"
                          : "bg-white text-blue-600 border border-blue-600"
                      }`}
                    >
                      {kValue === "NA" ? "General" : `K-${kValue}`}
                    </button>
                  )
                )}
              </div>
            )}
            <div className="flex justify-end mb-2">
              <button
                onClick={() =>
                  setHideUnselectedRowsBySize((prev) => ({
                    ...prev,
                    [size]: !prev[size]
                  }))
                }
                className="text-xs px-3 py-1 border border-gray-400 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-white"
              >
                {hideUnselectedRowsBySize[size]
                  ? "Show All"
                  : "Hide Unselected"}
              </button>
            </div>

            <div className="overflow-x-auto ">
              <table className="w-full border-collapse border border-gray-300 text-xs dark:bg-gray-800 dark:text-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      rowSpan={2}
                      className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={
                          (selectedRowsBySize[size] || []).every(Boolean) // all true = checked
                        }
                        onChange={(e) =>
                          toggleSelectAllRows(size, e.target.checked, "before")
                        } // or 'after' depending on table
                        className="w-4 h-4"
                      />
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white"
                    >
                      Area
                    </th>
                    <th
                      colSpan={2}
                      className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white"
                    >
                      Tolerance
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white"
                    >
                      Specs
                    </th>
                    <th
                      colSpan={
                        selectedSizes.find((s) => s.size === size)?.qty || 1
                      }
                      className="border border-gray-300 px-2 py-1 font-medium text-center dark:bg-gray-700 dark:text-white"
                    >
                      Measurements
                    </th>
                  </tr>
                  <tr>
                    <th className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">
                      -
                    </th>
                    <th className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">
                      +
                    </th>
                    {[...Array(qty)].map((_, i) => (
                      <th
                        key={`measure-header-${i}`}
                        className="border border-gray-300 px-2 py-1 font-medium text-center dark:bg-gray-800 dark:text-white"
                      >
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
                  {(
                    measurementSpecs.beforeWashGrouped[activeBeforeTab] ||
                    measurementSpecs.beforeWash
                  )?.map((spec, index) => {
                    const area =
                      spec.MeasurementPointEngName || `Point ${index + 1}`;
                    const specs = (spec.Specs?.fraction || spec.Specs || "-")
                      .toString()
                      .trim();
                    const tolMinus = (spec.ToleranceMinus || "-")
                      .toString()
                      .trim();
                    const tolPlus = (spec.TolerancePlus || "-")
                      .toString()
                      .trim();
                    const isSelected =
                      selectedRowsBySize[size]?.[index] ?? true;
                    const shouldHide =
                      hideUnselectedRowsBySize[size] && !isSelected;

                    if (shouldHide) return null;

                    return (
                      <tr
                        key={`k1-${index}`}
                        className="hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRowSelection(size, index)}
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 dark:bg-gray-800 dark:text-white">
                          {area}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                          {tolMinus !== "-" && tolMinus !== "0"
                            ? tolMinus.startsWith("-")
                              ? tolMinus
                              : `-${tolMinus}`
                            : "0"}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                          {tolPlus !== "-" && tolPlus !== "0"
                            ? tolPlus.startsWith("+")
                              ? tolPlus
                              : `+${tolPlus}`
                            : "0"}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                          {specs !== "-" ? specs : "-"}
                        </td>
                        {[...Array(qty)].map((_, i) => {
                          const cellKey = `${size}-before-${index}-${i}`;
                          const value = measurementValues[cellKey];
                          let cellColorClass = "bg-transparent";

                          if (value && typeof value.decimal === "number") {
                            const measuredDeviation = value.decimal;
                            const tolMinusValue = fractionToDecimal(tolMinus);
                            const tolPlusValue = fractionToDecimal(tolPlus);

                            if (!isNaN(tolMinusValue) && !isNaN(tolPlusValue)) {
                              // The deviation should be within the tolerance range.
                              if (
                                measuredDeviation >= tolMinusValue &&
                                measuredDeviation <= tolPlusValue
                              ) {
                                cellColorClass =
                                  "bg-green-200 dark:bg-green-700"; // Pass
                              } else {
                                cellColorClass = "bg-red-200 dark:bg-red-700"; // Fail
                              }
                            }
                          }

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
          </div>
        )}

        {/* K2 Sheet - After Wash */}
        {reportType === "After Wash" && (
          <>
            <div className="flex justify-end mb-2">
              <button
                onClick={() =>
                  setHideUnselectedRowsBySize((prev) => ({
                    ...prev,
                    [size]: !prev[size]
                  }))
                }
                className="text-xs px-3 py-1 border border-gray-400 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-white"
              >
                {hideUnselectedRowsBySize[size]
                  ? "Show All"
                  : "Hide Unselected"}
              </button>
            </div>
            <div className="bg-green-50 p-4 rounded-lg mb-4 dark:bg-gray-800 dark:text-white">
              <h5 className="text-sm font-medium mb-3">After Wash</h5>

              {Object.keys(measurementSpecs.afterWashGrouped).length > 1 && (
                <div className="flex space-x-2 mb-3">
                  {Object.keys(measurementSpecs.afterWashGrouped).map(
                    (kValue) => (
                      <button
                        key={kValue}
                        onClick={() => setActiveAfterTab(kValue)}
                        className={`px-3 py-1 text-xs rounded ${
                          activeAfterTab === kValue
                            ? "bg-green-600 text-white"
                            : "bg-white text-green-600 border border-green-600"
                        }`}
                      >
                        {kValue === "NA" ? "General" : `K-${kValue}`}
                      </button>
                    )
                  )}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-xs dark:bg-gray-800 dark:text-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        rowSpan={2}
                        className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white"
                      >
                        <input
                          type="checkbox"
                          checked={
                            (selectedRowsBySize[size] || []).every(Boolean) // all true = checked
                          }
                          onChange={(e) =>
                            toggleSelectAllRows(
                              size,
                              e.target.checked,
                              "before"
                            )
                          } // or 'after' depending on table
                          className="w-4 h-4"
                        />
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white"
                      >
                        Area
                      </th>
                      <th
                        colSpan={2}
                        className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white"
                      >
                        Tolerance
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white"
                      >
                        Specs
                      </th>
                      <th
                        colSpan={
                          selectedSizes.find((s) => s.size === size)?.qty || 1
                        }
                        className="border border-gray-300 px-2 py-1 font-medium text-center dark:bg-gray-700 dark:text-white"
                      >
                        Measurements
                      </th>
                    </tr>
                    <tr>
                      <th className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">
                        -
                      </th>
                      <th className="border border-gray-300 px-2 py-1 font-medium dark:bg-gray-700 dark:text-white">
                        +
                      </th>
                      {[...Array(qty)].map((_, i) => (
                        <th
                          key={`measure-header-${i}`}
                          className="border border-gray-300 px-2 py-1 font-medium text-center dark:bg-gray-800 dark:text-white"
                        >
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
                    {(
                      measurementSpecs.afterWashGrouped[activeAfterTab] ||
                      measurementSpecs.afterWash
                    )?.map((spec, index) => {
                      // console.log('After wash spec:', spec);
                      const isSelected =
                        selectedRowsBySize[size]?.[index] ?? true;
                      const shouldHide =
                        hideUnselectedRowsBySize[size] && !isSelected;
                      const area =
                        spec.MeasurementPointEngName || `Point ${index + 1}`;
                      const specs = (spec.Specs?.fraction || spec.Specs || "-")
                        .toString()
                        .trim();
                      const tolMinus = (spec.ToleranceMinus || "-")
                        .toString()
                        .trim();
                      const tolPlus = (spec.TolerancePlus || "-")
                        .toString()
                        .trim();

                      if (shouldHide) return null;

                      return (
                        <tr
                          key={`k2-${index}`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRowSelection(size, index)}
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 dark:bg-gray-800 dark:text-white">
                            {area}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                            {tolMinus !== "-" && tolMinus !== "0"
                              ? tolMinus.startsWith("-")
                                ? tolMinus
                                : `-${tolMinus}`
                              : "0"}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                            {tolPlus !== "-" && tolPlus !== "0"
                              ? tolPlus.startsWith("+")
                                ? tolPlus
                                : `+${tolPlus}`
                              : "0"}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white">
                            {specs !== "-" ? specs : "-"}
                          </td>
                          {[...Array(qty)].map((_, i) => {
                            const cellKey = `${size}-after-${index}-${i}`;
                            const value = measurementValues[cellKey];
                            let cellColorClass = "bg-transparent";

                            if (value && typeof value.decimal === "number") {
                              const measuredDeviation = value.decimal;
                              const tolMinusValue = fractionToDecimal(tolMinus);
                              const tolPlusValue = fractionToDecimal(tolPlus);

                              if (
                                !isNaN(tolMinusValue) &&
                                !isNaN(tolPlusValue)
                              ) {
                                // The deviation should be within the tolerance range.
                                if (
                                  measuredDeviation >= tolMinusValue &&
                                  measuredDeviation <= tolPlusValue
                                ) {
                                  cellColorClass =
                                    "bg-green-200 dark:bg-green-700"; // Pass
                                } else {
                                  cellColorClass = "bg-red-200 dark:bg-red-700"; // Fail
                                }
                              }
                            }
                            return (
                              <td
                                key={`measurement-input-${index}-${i}`}
                                className={`border border-gray-300 px-2 py-1 text-center dark:bg-gray-800 dark:text-white ${cellColorClass} cursor-pointer`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentCell({
                                    size,
                                    table: "after",
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
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Measurement Details
          </h2>
          <button
            onClick={onToggle}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {isVisible ? "Hide" : "Show"}
          </button>
        </div>
        <SummaryCard
          measurementData={measurementData}
          showMeasurementTable={showMeasurementTable}
          reportType={reportType}
        />
      </div>
      {isVisible && (
        <div className="space-y-6">
          {/* Display selected order and color */}
          {orderNo && color && (
            <div className="bg-blue-50 p-4 rounded-lg dark:bg-gray-700">
              <h3 className="text-md font-semibold mb-2 dark:text-white">
                Selected Order Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium dark:text-gray-300">
                    Order No:
                  </span>{" "}
                  <span className="dark:text-white">{orderNo}</span>
                </div>
                <div>
                  <span className="font-medium dark:text-gray-300">Color:</span>{" "}
                  <span className="dark:text-white">{color}</span>
                </div>
              </div>
              {savedSizes.length > 0 && (
                <div className="mt-3 dark:text-gray-300 dark:bg-gray-800">
                  <span className="font-medium text-sm dark:text-gray-300">
                    Saved Sizes:
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {savedSizes.map((size) => (
                      <span
                        key={size}
                        className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!orderNo || !color ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="text-sm text-yellow-700">
                Please select Order No and Color from Order Details section
                first.
              </div>
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
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <label
                          htmlFor="size-select"
                          className="text-sm font-medium dark:text-gray-300 dark:bg-gray-800"
                        >
                          Select Sizes:
                        </label>
                        <select
                          id="size-select"
                          onChange={(e) =>
                            e.target.value && addSize(e.target.value)
                          }
                          value=""
                          className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:text-gray-300 dark:bg-gray-800"
                        >
                          <option
                            className="text-sm font-medium dark:text-gray-300 dark:bg-gray-800"
                            value=""
                          >
                            -- Select Size to Add --
                          </option>
                          {sizes.map((size, index) => {
                            let sizeValue;
                            if (typeof size === "object" && size !== null) {
                              // Handle different casings for the size property and keep original fallbacks
                              sizeValue =
                                size.size ||
                                size.Size ||
                                size.name ||
                                size.value ||
                                Object.values(size)[0] ||
                                "Unknown";
                            } else {
                              sizeValue = size;
                            }
                            sizeValue = String(sizeValue);

                            const isSelected = selectedSizes.find(
                              (s) => s.size === sizeValue
                            );
                            const isSaved = currentWashMeasurements.some(
                              (m) => m.size === sizeValue
                            );

                            return (
                              <option
                                key={`size-${index}-${sizeValue}`}
                                value={sizeValue}
                                disabled={isSelected || isSaved}
                                style={
                                  isSaved
                                    ? {
                                        color: "#9CA3AF",
                                        backgroundColor: "#F3F4F6"
                                      }
                                    : {}
                                }
                              >
                                {sizeValue}{" "}
                                {isSelected
                                  ? "(Added)"
                                  : isSaved
                                  ? "(Saved)"
                                  : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      {savedSizes.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-300">
                          Note: Saved sizes are grayed out and cannot be
                          selected again.
                        </div>
                      )}
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
              <h3 className="text-md font-semibold mb-3 dark:text-white dark:bg-gray-800">
                Selected Sizes
              </h3>
              <div className="space-y-2">
                {selectedSizes.map(({ size, qty }) => {
                  const isSaved = savedSizes.includes(size);
                  return (
                    <div
                      key={size}
                      className={`flex items-center justify-between p-3 border rounded-md ${
                        isSaved
                          ? "bg-gray-100 border-gray-300 dark:bg-gray-600 dark:border-gray-500"
                          : "bg-white dark:bg-gray-800"
                      }`}
                    >
                      <span
                        className={`font-medium ${
                          isSaved
                            ? "text-gray-500 dark:text-gray-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        Size: {size} {isSaved ? "(Saved)" : ""}
                      </span>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQty(size, -1)}
                            disabled={isSaved}
                            className={`p-1 rounded-full dark:bg-gray-700 ${
                              isSaved
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:text-gray-500"
                                : "bg-red-100 text-red-600 hover:bg-red-200 dark:text-red-400"
                            }`}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center dark:text-gray-300">
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQty(size, 1)}
                            disabled={isSaved}
                            className={`p-1 rounded-full dark:bg-gray-700 ${
                              isSaved
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:text-gray-500"
                                : "bg-green-100 text-green-600 hover:bg-green-200 dark:text-green-400"
                            }`}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeSize(size)}
                          disabled={isSaved}
                          className={`px-3 py-1 rounded-md text-sm dark:bg-gray-600 ${
                            isSaved
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-red-500 text-white hover:bg-red-600"
                          }`}
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
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Saved Measurement Data
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {currentWashMeasurements.map((data, index) => (
                  <div
                    key={`saved-${index}`}
                    className="bg-green-50 border border-green-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-800 text-lg">
                        Size: {data.size} (Qty: {data.qty})
                      </h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(data.size)}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-s hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <span className="text-s text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          Saved
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {/* <p>Total measurements: {(data.pcs || []).reduce((total, pc) => total + (pc.measurementPoints?.length || 0), 0)}</p>                       */}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {/* Total Checked Points */}
                      <div className="bg-gray-100 p-2 rounded-md text-center">
                        <span className="text-blue-500 font-semibold text-2xl">
                          {
                            data.pcs.flatMap((pc) => pc.measurementPoints)
                              .length
                          }
                        </span>
                        <p className="text-s text-gray-900">Checked</p>
                      </div>

                      {/* Pass Count */}
                      <div className="bg-green-100 p-2 rounded-md text-center">
                        <span className="text-green-500 font-semibold text-2xl">
                          {
                            data.pcs
                              .flatMap((pc) => pc.measurementPoints)
                              .filter((point) => point.result === "pass").length
                          }
                        </span>
                        <p className="text-s text-gray-900">Pass</p>
                      </div>

                      {/* Fail Count */}
                      <div className="bg-red-100 p-2 rounded-md text-center">
                        <span className="text-red-500 font-semibold text-2xl">
                          {
                            data.pcs
                              .flatMap((pc) => pc.measurementPoints)
                              .filter((point) => point.result === "fail").length
                          }
                        </span>
                        <p className="text-s text-gray-900">Fail</p>
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
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                Measurement Input
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {selectedSizes.map(({ size, qty }) => {
                  const isSaved = savedSizes.includes(size);
                  if (isSaved) return null; // Don't show saved sizes in input section

                  return (
                    <div
                      key={`measurement-container-${size}`}
                      className="border rounded-lg p-4 bg-white border-gray-200 dark:bg-gray-800 dark:text-white"
                    >
                      {renderMeasurementTable(size, qty)}
                      {onSizeSubmit && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => {
                              const validationErrors = [];
                              const tableType =
                                reportType === "Before Wash"
                                  ? "before"
                                  : "after";
                              const specsForSubmit =
                                reportType === "Before Wash"
                                  ? measurementSpecs.beforeWashGrouped[
                                      activeBeforeTab
                                    ] ||
                                    measurementSpecs.beforeWash ||
                                    []
                                  : measurementSpecs.afterWashGrouped[
                                      activeAfterTab
                                    ] ||
                                    measurementSpecs.afterWash ||
                                    [];

                              const isFullColumnChecked =
                                fullColumnsBySize[size] || [];
                              const isRowSelected =
                                selectedRowsBySize[size] ||
                                Array(specsForSubmit.length).fill(true);

                              for (let pcIndex = 0; pcIndex < qty; pcIndex++) {
                                const isFull = isFullColumnChecked[pcIndex];

                                if (isFull) {
                                  // "Full" is checked, all rows are required
                                  const isAnyEmpty = specsForSubmit.some(
                                    (spec, specIndex) => {
                                      const cellKey = `${size}-${tableType}-${specIndex}-${pcIndex}`;
                                      return (
                                        !measurementValues[cellKey] ||
                                        !measurementValues[cellKey].fraction
                                      );
                                    }
                                  );
                                  if (isAnyEmpty) {
                                    validationErrors.push(
                                      `You must fill all the measurement points in "pcs ${
                                        pcIndex + 1
                                      }".`
                                    );
                                  }
                                } else {
                                  // "Full" is not checked, only selected rows are required
                                  specsForSubmit.forEach((spec, specIndex) => {
                                    if (isRowSelected[specIndex]) {
                                      const cellKey = `${size}-${tableType}-${specIndex}-${pcIndex}`;
                                      if (
                                        !measurementValues[cellKey] ||
                                        !measurementValues[cellKey].fraction
                                      ) {
                                        validationErrors.push(
                                          `Piece ${
                                            pcIndex + 1
                                          }: Measurement for selected row "${
                                            spec.MeasurementPointEngName
                                          }" is required.`
                                        );
                                      }
                                    }
                                  });
                                }
                              }

                              if (validationErrors.length > 0) {
                                Swal.fire({
                                  icon: "error",
                                  title: "Incomplete Measurements",
                                  html: `<div style="text-align: left; max-height: 200px; overflow-y: auto;"><ul>${validationErrors
                                    .map((e) => `<li>${e}</li>`)
                                    .join("")}</ul></div>`
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
                                tableType
                              );
                              onSizeSubmit(transformedData);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            Save Size {size}
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
      )}

      {/* Measurement NumPad */}
      {showNumPad && (
        <MeasurementNumPad
          onClose={() => setShowNumPad(false)}
          onInput={(decimalValue, fractionValue) => {
            const { size, table, rowIndex, colIndex } = currentCell;
            const cellKey = `${size}-${table}-${rowIndex}-${colIndex}`;
            setMeasurementValues((prev) => ({
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

export default MeasurementDetailsSection;
