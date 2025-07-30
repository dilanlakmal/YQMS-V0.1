import React, { useState, useEffect, useMemo, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import Select from "react-select";
import { useAuth } from "../../authentication/AuthContext";
import { API_BASE_URL } from "../../../../config";
import MeasurementNumPad from "../cutting/MeasurementNumPad";
import ANFMeasurementPreview from "./ANFMeasurementPreview";
import SuccessToast from "./SuccessToast";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Shirt,
  Target,
  Percent,
  ClipboardList,
  CheckCircle2,
  XCircle,
  MoveHorizontal,
  Check,
  AlertTriangle,
  TrendingDown,
  Eye,
  EyeOff,
  Save,
  Loader2
} from "lucide-react";

// --- MeasurementCell Component ---
const MeasurementCell = ({
  displayValue,
  actualDecimalValue,
  specDecimal,
  tol,
  onClick
}) => {
  // calculates the color based on the final absolute measurement
  const cellColor = useMemo(() => {
    // If the cell hasn't been measured yet, use a neutral color
    if (actualDecimalValue === null || actualDecimalValue === undefined) {
      return "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200";
    }

    // Calculate the tolerance boundaries
    const lowerBound = specDecimal + tol.minus;
    const upperBound = specDecimal + tol.plus;

    // Check if the actual measured value is within the boundaries
    if (actualDecimalValue >= lowerBound && actualDecimalValue <= upperBound) {
      return "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"; // In Tolerance (OK)
    }

    return "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200"; // Out of Tolerance (Fail)
  }, [actualDecimalValue, specDecimal, tol]);

  return (
    <td
      className={`p-0 text-center text-sm font-semibold cursor-pointer ${cellColor} transition-colors duration-200`}
    >
      <div
        onClick={onClick}
        className="w-full h-full p-2 flex items-center justify-center"
      >
        {displayValue}
      </div>
    </td>
  );
};

const decimalToFractionString = (decimal) => {
  if (decimal === null || decimal === undefined || isNaN(decimal)) return " ";
  if (decimal === 0) return "0";

  const sign = decimal < 0 ? "-" : "+";
  const absDecimal = Math.abs(decimal);

  // This mapping covers common fractions used in measurements.
  const fractions = [
    { v: 0.0625, f: "1/16" },
    { v: 0.125, f: "1/8" },
    { v: 0.1875, f: "3/16" },
    { v: 0.25, f: "1/4" },
    { v: 0.3125, f: "5/16" },
    { v: 0.375, f: "3/8" },
    { v: 0.4375, f: "7/16" },
    { v: 0.5, f: "1/2" },
    { v: 0.5625, f: "9/16" },
    { v: 0.625, f: "5/8" },
    { v: 0.6875, f: "11/16" },
    { v: 0.75, f: "3/4" },
    { v: 0.8125, f: "13/16" },
    { v: 0.875, f: "7/8" },
    { v: 0.9375, f: "15/16" }
  ];

  const tolerance = 0.01;
  const closest = fractions.find(
    (fr) => Math.abs(absDecimal - fr.v) < tolerance
  );

  if (closest) {
    return `${sign}${closest.f}`;
  }

  // Fallback for decimals that don't match a common fraction
  return `${sign}${absDecimal.toFixed(3)}`;
};

const ANFMeasurementInspectionForm = ({
  inspectionState,
  setInspectionState
}) => {
  // Destructure the state from props for easier use
  const {
    inspectionDate,
    selectedMo,
    selectedSize,
    selectedColors,
    garments,
    currentGarmentIndex
  } = inspectionState;
  // --- State Hooks ---

  const { user } = useAuth();

  const [moOptions, setMoOptions] = useState([]);
  const [buyer, setBuyer] = useState("");
  const [sizeOptions, setSizeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [orderDetails, setOrderDetails] = useState(null);
  const [specTableData, setSpecTableData] = useState([]);
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [activeCell, setActiveCell] = useState(null);
  const [isOrderDetailsVisible, setIsOrderDetailsVisible] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingSizeData, setIsLoadingSizeData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Helper function to update a specific field in the parent's state
  const updateState = useCallback(
    (field, value) => {
      setInspectionState((prevState) => ({ ...prevState, [field]: value }));
    },
    [setInspectionState]
  );

  // --- All useEffect hooks---
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/anf-measurement/mo-options`, {
        withCredentials: true
      })
      .then((res) =>
        setMoOptions(res.data.map((mo) => ({ value: mo, label: mo })))
      )
      .catch((err) => console.error("Error fetching MO options:", err));
  }, []);

  useEffect(() => {
    const resetState = () => {
      setBuyer("");
      setSizeOptions([]);
      setColorOptions([]);
      setOrderDetails(null);
      setSpecTableData([]);

      // Reset parts of the parent state
      updateState("selectedSize", null);
      updateState("selectedColors", []);
      updateState("garments", [{}]);
      updateState("currentGarmentIndex", 0);
    };
    if (selectedMo) {
      resetState();
      axios
        .get(
          `${API_BASE_URL}/api/anf-measurement/mo-details/${selectedMo.value}`,
          { withCredentials: true }
        )
        .then((res) => {
          setBuyer(res.data.buyer);
          setSizeOptions(res.data.sizes.map((s) => ({ value: s, label: s })));
        })
        .catch((err) => console.error("Error fetching MO details:", err));
      axios
        .get(
          `${API_BASE_URL}/api/anf-measurement/order-details/${selectedMo.value}`,
          { withCredentials: true }
        )
        .then((res) => {
          setOrderDetails(res.data);
          setColorOptions(res.data.colorOptions);
        })
        .catch((err) => console.error("Error fetching order details:", err));
    } else {
      resetState();
    }
  }, [selectedMo, updateState]);

  useEffect(() => {
    const fetchSizeData = async () => {
      if (selectedMo && selectedSize) {
        setIsLoadingSizeData(true);
        try {
          // --- Step 1: Fetch the spec table (this is required for both new and existing data) ---
          const specRes = await axios.get(
            `${API_BASE_URL}/api/anf-measurement/spec-table`,
            {
              params: { moNo: selectedMo.value, size: selectedSize.value },
              withCredentials: true
            }
          );
          const fetchedSpecTable = specRes.data;
          setSpecTableData(fetchedSpecTable);

          // --- Step 2: Fetch existing measurement data for this size ---
          const existingDataRes = await axios.get(
            `${API_BASE_URL}/api/anf-measurement/existing-data`,
            {
              params: {
                date: inspectionDate.toISOString().split("T")[0],
                qcId: user.emp_id,
                moNo: selectedMo.value,
                color: selectedColors.map((c) => c.value).join(","), // Pass colors as comma-separated string
                size: selectedSize.value
              },
              withCredentials: true
            }
          );

          const existingGarmentsData = existingDataRes.data;

          // --- Step 3: Process the data ---
          if (
            Array.isArray(existingGarmentsData) &&
            existingGarmentsData.length > 0
          ) {
            // DATA FOUND: Transform it to frontend state format
            const loadedGarments = existingGarmentsData.map(
              (backendGarment) => {
                const frontendGarment = {};
                backendGarment.measurements.forEach((measurement) => {
                  const specRow = fetchedSpecTable.find(
                    (s) => s.orderNo === measurement.orderNo
                  );
                  if (specRow) {
                    // Re-calculate the ABSOLUTE decimal value from the saved DEVIATION
                    // Frontend state requires the absolute value for the cell color logic
                    const absoluteDecimal =
                      specRow.specValueDecimal + measurement.decimalValue;
                    frontendGarment[measurement.orderNo] = {
                      decimal: absoluteDecimal,
                      fraction: measurement.fractionValue
                    };
                  }
                });
                return frontendGarment;
              }
            );

            // If any garments were empty, fill with default values
            if (loadedGarments.length === 0) {
              // Fallback to new garment logic if transform fails
              const initialGarmentData = {};
              fetchedSpecTable.forEach((row) => {
                initialGarmentData[row.orderNo] = {
                  decimal: null,
                  fraction: "0"
                };
              });
              updateState("garments", [initialGarmentData]);
              updateState("currentGarmentIndex", 0);
            } else {
              updateState("garments", loadedGarments);
              updateState("currentGarmentIndex", loadedGarments.length - 1); // Set to the last garment
            }
          } else {
            // NO DATA FOUND: Initialize a new, empty garment
            const initialGarmentData = {};
            fetchedSpecTable.forEach((row) => {
              initialGarmentData[row.orderNo] = {
                decimal: null,
                fraction: "0"
              };
            });
            updateState("garments", [initialGarmentData]);
            updateState("currentGarmentIndex", 0);
          }
        } catch (err) {
          console.error("Error fetching spec or existing data:", err);
          setSpecTableData([]); // Clear on error
          updateState("garments", [{}]);
          updateState("currentGarmentIndex", 0);
        } finally {
          setIsLoadingSizeData(false);
        }
      } else {
        // Clear table if size is deselected
        setSpecTableData([]);
        updateState("garments", [{}]);
        updateState("currentGarmentIndex", 0);
      }
    };

    fetchSizeData();
  }, [
    selectedMo,
    selectedSize,
    selectedColors,
    inspectionDate,
    user,
    updateState
  ]); // Add dependencies

  // --- calculates and stores the final measurement ---
  const handleNumpadInput = (deviationDecimal, deviationFraction) => {
    if (activeCell) {
      const { garmentIndex, orderNo } = activeCell;
      const specValue =
        specTableData.find((s) => s.orderNo === orderNo)?.specValueDecimal || 0;
      const finalAbsoluteValue = specValue + deviationDecimal;

      const newGarments = [...garments];
      if (!newGarments[garmentIndex]) {
        newGarments[garmentIndex] = {};
      }
      newGarments[garmentIndex] = {
        ...newGarments[garmentIndex],
        [orderNo]: { decimal: finalAbsoluteValue, fraction: deviationFraction }
      };
      updateState("garments", newGarments);
    }
  };

  // --- handler functions and memos---
  const addGarment = () => {
    const initialGarmentData = {};
    specTableData.forEach((row) => {
      initialGarmentData[row.orderNo] = { decimal: null, fraction: "0" };
    });
    const newGarments = [...garments, initialGarmentData];
    updateState("garments", newGarments);
    updateState("currentGarmentIndex", garments.length);
  };

  const removeGarment = (indexToRemove) => {
    if (garments.length <= 1) return;
    const newGarments = garments.filter((_, i) => i !== indexToRemove);
    updateState("garments", newGarments);
    if (currentGarmentIndex >= indexToRemove) {
      updateState("currentGarmentIndex", Math.max(0, currentGarmentIndex - 1));
    }
  };

  const orderQtyBySelectedColor = useMemo(() => {
    if (!orderDetails?.colorQtyBySize || selectedColors.length === 0) return {};
    const qtyMap = {};
    selectedColors.forEach((color) => {
      const sizesForColor = orderDetails.colorQtyBySize[color.value] || {};
      for (const [size, qty] of Object.entries(sizesForColor)) {
        qtyMap[size] = (qtyMap[size] || 0) + qty;
      }
    });
    return qtyMap;
  }, [orderDetails, selectedColors]);

  const totalQtyForSelectedColors = useMemo(() => {
    if (!orderDetails?.colorQtyBySize || selectedColors.length === 0) return 0;
    // Get all quantities from the orderQtyBySelectedColor map and sum them up
    return Object.values(orderQtyBySelectedColor).reduce(
      (sum, qty) => sum + qty,
      0
    );
  }, [orderQtyBySelectedColor]);

  const summaryStats = useMemo(() => {
    if (specTableData.length === 0 || garments.length === 0) {
      // ... (no change to this part)
      return {
        totalGarmentsChecked: garments.length,
        totalMeasurementPoints: 0,
        totalPosTol: 0,
        totalNegTol: 0,
        totalIssuesPoints: 0,
        totalOkGarments: 0,
        totalIssuesGarments: 0,
        passRateByGarment: "0.00",
        passRateByPoints: "0.00",
        totalOkPoints: 0,
        defectRate: "0.00"
      };
    }

    // --- GARMENT LOGIC (This part is correct and remains unchanged) ---
    let totalOkGarments = 0;
    garments.forEach((garment) => {
      let isGarmentRejected = false;
      if (typeof garment !== "object" || garment === null) return;

      specTableData.forEach((spec) => {
        const measurement = garment[spec.orderNo];
        if (
          measurement &&
          measurement.decimal !== null &&
          measurement.decimal !== undefined
        ) {
          const diff = measurement.decimal - spec.specValueDecimal;
          if (diff > spec.tolPlus || diff < spec.tolMinus) {
            isGarmentRejected = true;
          }
        }
      });
      if (!isGarmentRejected) {
        totalOkGarments++;
      }
    });
    const totalGarmentsChecked = garments.length;
    const totalIssuesGarments = totalGarmentsChecked - totalOkGarments;
    const passRateByGarment =
      totalGarmentsChecked > 0
        ? ((totalOkGarments / totalGarmentsChecked) * 100).toFixed(2)
        : "0.00";
    const defectRate =
      totalGarmentsChecked > 0
        ? ((totalIssuesGarments / totalGarmentsChecked) * 100).toFixed(2)
        : "0.00";
    // --- END OF GARMENT LOGIC ---

    // --- START: CORRECTED POINT CALCULATION LOGIC ---
    let totalPosTol = 0;
    let totalNegTol = 0;
    let totalIssuesPoints = 0;

    // Loop through every possible measurement point
    garments.forEach((garment) => {
      if (typeof garment !== "object" || garment === null) return;
      specTableData.forEach((spec) => {
        const measurement = garment[spec.orderNo];

        // We only care about points that have an explicit, non-null value.
        // Unmeasured points are considered "Pass" by default for this calculation.
        if (
          measurement &&
          measurement.decimal !== null &&
          measurement.decimal !== undefined
        ) {
          const diff = measurement.decimal - spec.specValueDecimal;

          if (diff > spec.tolPlus) {
            totalPosTol++;
          } else if (diff < spec.tolMinus) {
            totalNegTol++;
          }
        }
      });
    });

    // The total number of points is simply garments * spec points.
    const totalMeasurementPoints = garments.length * specTableData.length;

    // Total issues is the sum of tolerance failures.
    totalIssuesPoints = totalPosTol + totalNegTol;

    // Pass points are all the points that are not issues.
    const totalOkPoints = totalMeasurementPoints - totalIssuesPoints;

    const passRateByPoints =
      totalMeasurementPoints > 0
        ? ((totalOkPoints / totalMeasurementPoints) * 100).toFixed(2)
        : "0.00";
    // --- END OF CORRECTED POINT LOGIC ---

    // Return the combined results
    return {
      totalGarmentsChecked,
      totalOkGarments,
      totalIssuesGarments,
      passRateByGarment,
      defectRate,
      // Point stats:
      totalMeasurementPoints,
      totalOkPoints,
      totalIssuesPoints,
      totalPosTol,
      totalNegTol,
      passRateByPoints
    };
  }, [garments, specTableData]);

  // --- NEW: Save Logic ---
  const handleSave = async () => {
    if (
      !user?.emp_id ||
      !selectedMo ||
      !selectedSize ||
      selectedColors.length === 0
    ) {
      Swal.fire(
        "Incomplete Data",
        "Please ensure MO, Color, and Size are selected before saving.",
        "warning"
      );
      return;
    }
    setIsSaving(true);

    // This helper function correctly handles timezone offsets to get the right day.
    const toLocalISOString = (date) => {
      const offset = date.getTimezoneOffset();
      const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
      return adjustedDate.toISOString().split("T")[0];
    };

    // 1. Construct the payload
    const payload = {
      //inspectionDate,
      inspectionDate: toLocalISOString(inspectionDate),
      qcID: user.emp_id,
      moNo: selectedMo.value,
      buyer: buyer,
      color: selectedColors.map((c) => c.value),
      orderDetails: {
        custStyle: orderDetails.custStyle,
        mode: orderDetails.mode,
        country: orderDetails.country,
        origin: orderDetails.origin,
        orderQty_style: orderDetails.totalOrderQty,
        orderQty_bySize: orderDetails.colorQtyBySize
      },
      measurementDetails: [
        {
          size: selectedSize.value,
          sizeSummary: {
            garmentDetailsCheckedQty: summaryStats.totalGarmentsChecked,
            garmentDetailsOKGarment: summaryStats.totalOkGarments,
            garmentDetailsRejected: summaryStats.totalIssuesGarments,
            measurementDetailsPoints: summaryStats.totalMeasurementPoints,
            measurementDetailsPass: summaryStats.totalOkPoints,
            measurementDetailsTotalIssues: summaryStats.totalIssuesPoints,
            measurementDetailsTolPositive: summaryStats.totalPosTol,
            measurementDetailsTolNegative: summaryStats.totalNegTol
          },
          buyerSpecData: specTableData.map((spec) => ({
            no: spec.orderNo,
            measurementPoint: spec.specName,
            tolNeg_fraction: decimalToFractionString(spec.tolMinus),
            tolPos_fraction: decimalToFractionString(spec.tolPlus),
            spec_fraction: spec.specValueFraction,
            tolNeg_decimal: spec.tolMinus,
            tolPos_decimal: spec.tolPlus,
            spec_decimal: spec.specValueDecimal
          })),
          sizeMeasurementData: garments.map((garment, index) => ({
            garmentNo: index + 1,
            measurements: specTableData.map((spec) => {
              const measurement = garment[spec.orderNo];

              // Recalculate the deviation by subtracting the base spec from the final measured value.
              const deviationDecimal =
                measurement?.decimal !== null &&
                measurement?.decimal !== undefined
                  ? parseFloat(
                      (measurement.decimal - spec.specValueDecimal).toFixed(4)
                    )
                  : 0;

              return {
                orderNo: spec.orderNo,
                decimalValue: deviationDecimal, // Now saves the correct deviation decimal
                fractionValue: measurement?.fraction || "0" // The fraction is already the deviation
              };
            })
          }))
        }
      ]
    };

    // 2. Send to the API
    try {
      await axios.post(`${API_BASE_URL}/api/anf-measurement/reports`, payload, {
        withCredentials: true
      });
      // Instead of Swal, set toast state to true
      setShowSuccessToast(true);
      // Swal.fire(
      //   "Success!",
      //   "Measurement data for this size has been saved.",
      //   "success"
      // );

      // // 3. Reset for next size
      // updateState("selectedSize", null);
      // setSpecTableData([]);
      // updateState("garments", [{}]);
      // updateState("currentGarmentIndex", 0);
    } catch (error) {
      console.error("Error saving inspection data:", error);
      Swal.fire(
        "Error",
        error.response?.data?.error || "Failed to save data. Please try again.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const selectStyles = {
    control: (styles) => ({
      ...styles,
      backgroundColor: "white",
      borderColor: "#d1d5db"
    }),
    menu: (styles) => ({ ...styles, backgroundColor: "white" }),
    option: (styles, { isFocused, isSelected }) => ({
      ...styles,
      backgroundColor: isSelected ? "#4f46e5" : isFocused ? "#e0e7ff" : "white",
      color: isSelected ? "white" : "black"
    })
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Inspection Date
            </label>
            <DatePicker
              selected={inspectionDate}
              onChange={(date) => updateState("inspectionDate", date)}
              className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">MO No</label>
            <Select
              options={moOptions}
              value={selectedMo}
              onChange={(val) => updateState("selectedMo", val)}
              isClearable
              styles={selectStyles}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Buyer</label>
            <input
              type="text"
              value={buyer}
              readOnly
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border rounded-md"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Color</label>
            <Select
              isMulti
              options={colorOptions}
              value={selectedColors}
              onChange={(val) => updateState("selectedColors", val)}
              isDisabled={!selectedMo}
              styles={selectStyles}
            />
          </div>
        </div>
      </div>

      {/* Order Details Section */}
      {orderDetails && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold mb-4">Order Details</h3>
            <button
              onClick={() => setIsOrderDetailsVisible(!isOrderDetailsVisible)}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle order details"
            >
              {isOrderDetailsVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {isOrderDetailsVisible && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <strong className="block text-gray-500">Cust. Style:</strong>{" "}
                  {orderDetails.custStyle}
                </div>
                <div>
                  <strong className="block text-gray-500">Mode:</strong>{" "}
                  {orderDetails.mode}
                </div>
                <div>
                  <strong className="block text-gray-500">Country:</strong>{" "}
                  {orderDetails.country}
                </div>
                <div>
                  <strong className="block text-gray-500">Origin:</strong>{" "}
                  {orderDetails.origin}
                </div>
                <div>
                  <strong className="block text-gray-500">
                    Order Qty (Style):
                  </strong>{" "}
                  {orderDetails.totalOrderQty}
                </div>

                <div>
                  <strong className="block text-gray-500">
                    Order Qty (Colors):
                  </strong>{" "}
                  {totalQtyForSelectedColors}
                </div>

                <div className="col-span-full mt-4">
                  <h4 className="font-semibold mb-2">
                    Order Qty by Size (for selected colors)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                          {Object.keys(orderQtyBySelectedColor).map((size) => (
                            <th key={size} className="p-2 font-medium">
                              {size}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {Object.values(orderQtyBySelectedColor).map(
                            (qty, i) => (
                              <td key={i} className="p-2">
                                {qty}
                              </td>
                            )
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Size selection */}
      {orderDetails && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex justify-between items-end flex-wrap gap-4">
          {/* Size Dropdown */}
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Size
              </label>
              <Select
                options={sizeOptions}
                value={selectedSize}
                onChange={(val) => updateState("selectedSize", val)}
                isDisabled={!selectedMo || isLoadingSizeData} // Disable while loading
                //isDisabled={!selectedMo}
                isClearable
                placeholder={isLoadingSizeData ? "Loading..." : "Select..."}
                //placeholder="Select..."
                styles={selectStyles}
              />
            </div>
            {/* NEW: Loading spinner */}
            {isLoadingSizeData && (
              <Loader2 className="animate-spin text-indigo-500" />
            )}
          </div>

          {/* Action Buttons */}
          {specTableData.length > 0 && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <Eye size={16} className="mr-2" />
                Preview
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                {isSaving ? "Saving..." : "Save Inspection"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Measurement Table Section */}
      {specTableData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
            <h3 className="text-lg font-bold">Measurement Entry</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  updateState(
                    "currentGarmentIndex",
                    Math.max(0, currentGarmentIndex - 1)
                  )
                }
                disabled={currentGarmentIndex === 0}
                className="p-2 rounded-md disabled:opacity-50"
              >
                <ChevronLeft />
              </button>
              <span className="font-semibold">
                Garment: {currentGarmentIndex + 1}/{garments.length}
              </span>
              {currentGarmentIndex > 0 && (
                <button
                  onClick={() => removeGarment(currentGarmentIndex)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-md"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() =>
                  updateState(
                    "currentGarmentIndex",
                    Math.min(garments.length - 1, currentGarmentIndex + 1)
                  )
                }
                disabled={currentGarmentIndex === garments.length - 1}
                className="p-2 rounded-md disabled:opacity-50"
              >
                <ChevronRight />
              </button>
              <button
                onClick={addGarment}
                className="ml-4 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md"
              >
                Next Garment
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase">
                <tr>
                  <th className="p-2 text-center w-12">No</th>
                  <th className="p-2 text-left w-64">Point</th>
                  <th className="p-2 text-center w-20">Tol-</th>
                  <th className="p-2 text-center w-20">Tol+</th>
                  <th className="p-2 text-center w-20">Spec</th>
                  <th className="p-2 text-center w-32">
                    G{currentGarmentIndex + 1}
                  </th>
                </tr>
              </thead>
              <tbody>
                {specTableData.map((row) => (
                  <tr
                    key={row.orderNo}
                    className="border-b dark:border-gray-700"
                  >
                    <td className="p-2 text-center">{row.orderNo}</td>
                    <td className="p-2 text-xs">{row.specName}</td>
                    {/* --- Tol- Cell --- */}
                    <td className="p-2 text-center text-red-500 font-semibold">
                      {decimalToFractionString(row.tolMinus)}
                      <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                        ({row.tolMinus})
                      </span>
                    </td>
                    {/* --- Tol+ Spec Cell --- */}
                    <td className="p-2 text-center text-green-500 font-semibold">
                      {decimalToFractionString(row.tolPlus)}
                      <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                        ({row.tolPlus})
                      </span>
                    </td>
                    {/* --- Spec Cell --- */}
                    <td className="p-2 text-center font-bold">
                      {row.specValueFraction}
                      <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                        ({row.specValueDecimal})
                      </span>
                    </td>
                    {/* --- props to the cell --- */}
                    <MeasurementCell
                      displayValue={
                        garments[currentGarmentIndex]?.[row.orderNo]
                          ?.fraction || "0"
                      }
                      actualDecimalValue={
                        garments[currentGarmentIndex]?.[row.orderNo]?.decimal
                      }
                      specDecimal={row.specValueDecimal}
                      tol={{ minus: row.tolMinus, plus: row.tolPlus }}
                      onClick={() => {
                        setActiveCell({
                          garmentIndex: currentGarmentIndex,
                          orderNo: row.orderNo
                        });
                        setIsNumpadOpen(true);
                      }}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Cards Section */}
      {specTableData.length > 0 && (
        <>
          <hr className="my-6 border-gray-200 dark:border-gray-700" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2">
            {/* Card 1: Garment Details */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
                  <Shirt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  Garment Details
                </h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-gray-600 dark:text-gray-300">
                    <ClipboardList size={16} className="mr-2" />
                    Checked
                  </span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    {summaryStats.totalGarmentsChecked}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle2 size={16} className="mr-2" />
                    OK
                  </span>
                  <span className="font-bold text-lg text-green-600 dark:text-green-400">
                    {summaryStats.totalOkGarments}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-red-600 dark:text-red-400">
                    <XCircle size={16} className="mr-2" />
                    Rejected
                  </span>
                  <span className="font-bold text-lg text-red-600 dark:text-red-400">
                    {summaryStats.totalIssuesGarments}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Measurement Details */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  Measurement Details
                </h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-gray-600 dark:text-gray-300">
                    <MoveHorizontal size={16} className="mr-2" />
                    Points
                  </span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    {summaryStats.totalMeasurementPoints}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-green-600 dark:text-green-400">
                    <Check size={16} className="mr-2" />
                    Pass
                  </span>
                  <span className="font-bold text-lg text-green-600 dark:text-green-400">
                    {summaryStats.totalOkPoints}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-red-600 dark:text-red-400">
                    <AlertTriangle size={16} className="mr-2" />
                    Total Issues
                  </span>
                  <span className="font-bold text-lg text-red-600 dark:text-red-400">
                    {summaryStats.totalIssuesPoints}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-600 dark:text-gray-300">
                    Tolerance Issues:
                  </span>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded-md text-sm font-semibold bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-300">
                      TOL- : {summaryStats.totalNegTol}
                    </span>
                    <span className="px-2 py-1 rounded-md text-sm font-semibold bg-rose-200 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                      TOL+ : {summaryStats.totalPosTol}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Pass Rate */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-teal-100 dark:bg-teal-900/50 p-3 rounded-full">
                  <Percent className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  Pass Rate
                </h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">
                    By Garment
                  </span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    {summaryStats.passRateByGarment}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">
                    By Point
                  </span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    {summaryStats.passRateByPoints}%
                  </span>
                </div>
                <hr className="my-2 border-gray-200 dark:border-gray-600" />
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-orange-600 dark:text-orange-400 font-semibold">
                    <TrendingDown size={16} className="mr-2" />
                    Defect Rate
                  </span>
                  <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                    {summaryStats.defectRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- NEW: Render the Preview Modal --- */}
      {isPreviewOpen && (
        <ANFMeasurementPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          inspectionState={inspectionState}
          orderDetails={orderDetails}
          specTableData={specTableData}
          buyer={buyer}
        />
      )}

      {isNumpadOpen && (
        <MeasurementNumPad
          onClose={() => setIsNumpadOpen(false)}
          onInput={handleNumpadInput}
        />
      )}

      {/* --- RENDER THE TOAST COMPONENT AT THE END --- */}
      <SuccessToast
        isOpen={showSuccessToast}
        message="Data for this size has been saved!"
        onClose={() => setShowSuccessToast(false)}
      />
    </div>
  );
};

export default ANFMeasurementInspectionForm;
