import React, { useState, useEffect, useMemo, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import Select from "react-select";
import { useAuth } from "../../authentication/AuthContext";
import { API_BASE_URL } from "../../../../config";
import TallyCell from "./TallyCell"; // <-- IMPORT THE NEW CELL COMPONENT
import {
  Target,
  Percent,
  Check,
  AlertTriangle,
  MoveHorizontal,
  TrendingDown,
  Eye,
  EyeOff,
  Save,
  Loader2
} from "lucide-react";

// --- Constants for the new table structure ---
const DEVIATION_COLUMNS = [
  { label: "-1", value: -1.0 },
  { label: "-3/4", value: -0.75 },
  { label: "-1/2", value: -0.5 },
  { label: "-1/4", value: -0.25 },
  { label: "OK", value: 0 },
  { label: "+1/4", value: 0.25 },
  { label: "+1/2", value: 0.5 },
  { label: "+3/4", value: 0.75 },
  { label: "+1", value: 1.0 }
];

// --- STEP 1: COPY THE HELPER FUNCTION FROM V1 ---
const decimalToFractionString = (decimal) => {
  if (decimal === null || decimal === undefined || isNaN(decimal)) return " ";
  if (decimal === 0) return "0";

  const sign = decimal < 0 ? "-" : "+";
  const absDecimal = Math.abs(decimal);

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
    // For tolerance values, we typically don't show a sign for positive
    const displaySign = decimal < 0 ? "-" : "+";
    return `${displaySign}${closest.f}`;
  }

  // Fallback for decimals that don't match a common fraction
  return `${sign}${absDecimal.toFixed(3)}`;
};

const ANFMeasurementInspectionFormVer2 = ({
  inspectionState,
  setInspectionState
}) => {
  const { inspectionDate, selectedMo, selectedSize, selectedColors } =
    inspectionState;
  const { user } = useAuth();

  // --- Component-specific state ---
  const [moOptions, setMoOptions] = useState([]);
  const [buyer, setBuyer] = useState("");
  const [sizeOptions, setSizeOptions] = useState([]);
  const [orderDetails, setOrderDetails] = useState(null); // No changes here
  const [specTableData, setSpecTableData] = useState([]);
  const [isLoadingSizeData, setIsLoadingSizeData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- NEW STATE for the measurement grid data ---
  const [measurementCounts, setMeasurementCounts] = useState({});

  const updateState = useCallback(
    (field, value) => {
      setInspectionState((prevState) => ({ ...prevState, [field]: value }));
    },
    [setInspectionState]
  );

  // --- useEffect hooks for fetching data (largely unchanged) ---
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/anf-measurement/mo-options`)
      .then((res) =>
        setMoOptions(res.data.map((mo) => ({ value: mo, label: mo })))
      )
      .catch((err) => console.error("Error fetching MO options:", err));
  }, []);

  useEffect(() => {
    if (selectedMo) {
      axios
        .get(
          `${API_BASE_URL}/api/anf-measurement/mo-details/${selectedMo.value}`
        )
        .then((res) => {
          setBuyer(res.data.buyer);
          setSizeOptions(res.data.sizes.map((s) => ({ value: s, label: s })));
        })
        .catch((err) => console.error("Error fetching MO details:", err));
      axios
        .get(
          `${API_BASE_URL}/api/anf-measurement/order-details/${selectedMo.value}`
        )
        .then((res) => setOrderDetails(res.data))
        .catch((err) => console.error("Error fetching order details:", err));
    } else {
      // Reset dependent state
      setBuyer("");
      setSizeOptions([]);
      setOrderDetails(null);
      updateState("selectedSize", null);
      updateState("selectedColors", []);
    }
  }, [selectedMo, updateState]);

  // --- Fetch spec table and initialize measurement counts ---
  useEffect(() => {
    const fetchSizeData = async () => {
      if (selectedMo && selectedSize) {
        setIsLoadingSizeData(true);
        try {
          const specRes = await axios.get(
            `${API_BASE_URL}/api/anf-measurement/spec-table`,
            { params: { moNo: selectedMo.value, size: selectedSize.value } }
          );
          const specs = specRes.data;
          setSpecTableData(specs);

          // ** NEW: Initialize the measurement counts state based on the fetched specs **
          const initialCounts = {};
          specs.forEach((specRow) => {
            initialCounts[specRow.orderNo] = {};
            DEVIATION_COLUMNS.forEach((col) => {
              initialCounts[specRow.orderNo][col.label] = 0;
            });
          });
          setMeasurementCounts(initialCounts);
          // NOTE: Logic to fetch and populate EXISTING data would go here.
          // It would need to transform saved data into the `measurementCounts` format.
        } catch (err) {
          console.error("Error fetching spec data:", err);
          setSpecTableData([]);
          setMeasurementCounts({});
        } finally {
          setIsLoadingSizeData(false);
        }
      } else {
        setSpecTableData([]);
        setMeasurementCounts({});
      }
    };
    fetchSizeData();
  }, [selectedMo, selectedSize, updateState]);

  // --- NEW: Handlers for incrementing/decrementing cell counts ---
  const handleIncrement = (orderNo, deviationLabel) => {
    setMeasurementCounts((prevCounts) => ({
      ...prevCounts,
      [orderNo]: {
        ...prevCounts[orderNo],
        [deviationLabel]: (prevCounts[orderNo]?.[deviationLabel] || 0) + 1
      }
    }));
  };

  const handleDecrement = (orderNo, deviationLabel) => {
    setMeasurementCounts((prevCounts) => {
      const currentCount = prevCounts[orderNo]?.[deviationLabel] || 0;
      return {
        ...prevCounts,
        [orderNo]: {
          ...prevCounts[orderNo],
          [deviationLabel]: Math.max(0, currentCount - 1)
        }
      };
    });
  };

  // --- NEW: Recalculated summary stats based on the grid data ---
  const summaryStats = useMemo(() => {
    let totalMeasurementPoints = 0; // <-- Will be calculated directly now
    let totalOkPoints = 0;
    let totalPosTol = 0;
    let totalNegTol = 0;

    if (specTableData.length > 0 && Object.keys(measurementCounts).length > 0) {
      // This directly sums up every single count in the entire grid.
      totalMeasurementPoints = Object.values(measurementCounts).reduce(
        (totalSum, specCounts) =>
          totalSum +
          Object.values(specCounts).reduce(
            (specSum, count) => specSum + count,
            0
          ),
        0
      );

      // The rest of this logic is correct and remains the same.
      // It iterates through the grid to classify each point.
      specTableData.forEach((spec) => {
        const countsForSpec = measurementCounts[spec.orderNo] || {};
        DEVIATION_COLUMNS.forEach((col) => {
          const count = countsForSpec[col.label] || 0;
          if (count > 0) {
            // Check if the point is within tolerance
            if (col.value >= spec.tolMinus && col.value <= spec.tolPlus) {
              totalOkPoints += count;
            } else {
              // It's an issue point
              if (col.value > spec.tolPlus) {
                totalPosTol += count;
              } else if (col.value < spec.tolMinus) {
                totalNegTol += count;
              }
            }
          }
        });
      });
    }

    const totalIssuesPoints = totalPosTol + totalNegTol;
    const passRateByPoints =
      totalMeasurementPoints > 0
        ? ((totalOkPoints / totalMeasurementPoints) * 100).toFixed(2)
        : "0.00";
    const defectRate =
      totalMeasurementPoints > 0
        ? ((totalIssuesPoints / totalMeasurementPoints) * 100).toFixed(2)
        : "0.00";

    return {
      totalMeasurementPoints, // This value is now correct
      totalOkPoints,
      totalIssuesPoints,
      totalPosTol,
      totalNegTol,
      passRateByPoints,
      defectRate
    };
  }, [measurementCounts, specTableData]);

  const handleSave = async () => {
    // This function would need to be adapted to send the `measurementCounts`
    // data to a new or modified backend endpoint.
    setIsSaving(true);
    console.log("Saving data:", {
      inspectionState,
      measurementCounts,
      summaryStats
    });
    // Mock saving
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    alert("Data saved to console. Backend endpoint needs implementation.");
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
      {/* Filters Section (Unchanged) */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Date, MO, Buyer, Color Selects - No changes needed here */}
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
              options={orderDetails?.colorOptions || []}
              value={selectedColors}
              onChange={(val) => updateState("selectedColors", val)}
              isDisabled={!selectedMo}
              styles={selectStyles}
            />
          </div>
        </div>
      </div>

      {/* Size Selection and Actions (Unchanged) */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex justify-between items-end flex-wrap gap-4">
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Size
          </label>
          <Select
            options={sizeOptions}
            value={selectedSize}
            onChange={(val) => updateState("selectedSize", val)}
            isDisabled={!selectedMo || isLoadingSizeData}
            isClearable
            placeholder={isLoadingSizeData ? "Loading..." : "Select..."}
            styles={selectStyles}
          />
        </div>
        {isLoadingSizeData && (
          <Loader2 className="animate-spin text-indigo-500" />
        )}
        {specTableData.length > 0 && (
          <div className="flex items-center gap-4">
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

      {/* --- MODIFIED Measurement Table Section --- */}
      {specTableData.length > 0 && (
        <div className="space-y-6">
          {/* Table 1: Spec Display */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-bold">Buyer After Wash Spec Data</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase">
                  <tr>
                    <th className="p-2 text-center w-12">No</th>
                    <th className="p-2 text-left w-64">Point</th>
                    <th className="p-2 text-center w-24">Tol-</th>
                    <th className="p-2 text-center w-24">Tol+</th>
                    <th className="p-2 text-center w-24">Spec</th>
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
                      {/* Tol- Cell */}
                      <td className="p-2 text-center text-red-500 font-semibold">
                        {decimalToFractionString(row.tolMinus)}
                        <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                          ({row.tolMinus})
                        </span>
                      </td>

                      {/* Tol+ Cell */}
                      <td className="p-2 text-center text-green-500 font-semibold">
                        {decimalToFractionString(row.tolPlus)}
                        <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                          ({row.tolPlus})
                        </span>
                      </td>

                      {/* Spec Cell */}
                      <td className="p-2 text-center font-bold">
                        {row.specValueFraction}
                        <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                          ({row.specValueDecimal})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Interactive Measurement Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-bold">Inspected Measurement Data</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed">
                <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase">
                  <tr>
                    <th className="p-2 text-center w-12">No</th>
                    {DEVIATION_COLUMNS.map((col) => (
                      <th key={col.label} className="p-2 text-center w-20">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {specTableData.map((specRow) => (
                    <tr
                      key={specRow.orderNo}
                      className="border-b dark:border-gray-700"
                    >
                      <td className="p-2 text-center font-semibold">
                        {specRow.orderNo}
                      </td>
                      {DEVIATION_COLUMNS.map((col) => {
                        // Determine if this cell is out of tolerance
                        const isOutOfTol =
                          col.label !== "OK" &&
                          (col.value < specRow.tolMinus ||
                            col.value > specRow.tolPlus);

                        return (
                          <TallyCell
                            key={col.label}
                            count={
                              measurementCounts[specRow.orderNo]?.[col.label] ||
                              0
                            }
                            onIncrement={() =>
                              handleIncrement(specRow.orderNo, col.label)
                            }
                            onDecrement={() =>
                              handleDecrement(specRow.orderNo, col.label)
                            }
                            isOutOfTolerance={isOutOfTol}
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODIFIED Summary Cards Section --- */}
      {specTableData.length > 0 && (
        <>
          <hr className="my-6 border-gray-200 dark:border-gray-700" />
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {/* Card 1: Measurement Details */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
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

            {/* Card 2: Pass Rate */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-teal-100 dark:bg-teal-900/50 p-3 rounded-full">
                  <Percent className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  Pass/Defect Rate by Points
                </h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">
                    Pass Rate
                  </span>
                  <span className="font-bold text-lg text-green-500 dark:text-green-400">
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
    </div>
  );
};

export default ANFMeasurementInspectionFormVer2;
