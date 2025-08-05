import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config";
import {
  Search,
  X,
  Download,
  Edit,
  Save,
  XCircle,
  Eye,
  EyeOff,
  Filter
} from "lucide-react";
import SuccessToast from "./SuccessToast";

// Helper function can be moved to a shared utils file
const decimalToFractionString = (decimal) => {
  if (decimal === null || decimal === undefined || isNaN(decimal)) return " ";
  const sign = decimal < 0 ? "-" : "";
  const absDecimal = Math.abs(decimal);
  const whole = Math.floor(absDecimal);
  const fractionValue = absDecimal - whole;
  if (fractionValue === 0) return `${sign}${whole || 0}`;
  const tolerance = 0.01;
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
  const closest = fractions.find(
    (fr) => Math.abs(fractionValue - fr.v) < tolerance
  );
  const fractionPart = closest ? closest.f : fractionValue.toFixed(3);
  return `${sign}${whole > 0 ? whole + " " : ""}${fractionPart}`;
};

const EditDTSpecs = () => {
  const [moNo, setMoNo] = useState(null);
  const [moOptions, setMoOptions] = useState([]);
  const [templateData, setTemplateData] = useState(null);
  const [patternData, setPatternData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingRowKey, setEditingRowKey] = useState(null); // Use orderNo as key
  const [editedData, setEditedData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isPatternTableVisible, setIsPatternTableVisible] = useState(false);
  const [isPatternFilterActive, setIsPatternFilterActive] = useState(true);

  // Fetch all MO numbers that exist in the BuyerSpecTemplates collection
  useEffect(() => {
    const fetchTemplateMonos = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/buyer-spec-templates/mo-options`
        );
        setMoOptions(response.data.map((m) => ({ value: m, label: m })));
      } catch (error) {
        console.error("Error fetching MO options for templates:", error);
      }
    };
    fetchTemplateMonos();
  }, []);

  // Fetch detailed data when a MO is selected
  useEffect(() => {
    if (moNo && moNo.value) {
      const fetchEditData = async () => {
        setLoading(true);
        setError(null);
        setTemplateData(null);
        setPatternData(null);
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/edit-specs-data/${moNo.value}`
          );
          setTemplateData(response.data.templateData);
          setPatternData(response.data.patternData);
        } catch (err) {
          console.error(`Error fetching data for MO ${moNo.value}:`, err);
          setError(
            "Failed to fetch spec data. The MO might not exist in one or both sources."
          );
        } finally {
          setLoading(false);
        }
      };
      fetchEditData();
    }
  }, [moNo]);

  const handleClear = () => {
    setMoNo(null);
    setTemplateData(null);
    setPatternData(null);
    setError(null);
    setEditingRowKey(null);
  };

  const handleEditClick = (orderNo, specRow) => {
    setEditingRowKey(orderNo);
    const initialEditData = {};
    // Populate with the spec values for each size for the selected row
    templateData.specData.forEach((sizeData) => {
      const specDetail = sizeData.specDetails.find(
        (sd) => sd.orderNo === orderNo
      );
      if (specDetail) {
        initialEditData[sizeData.size] = specDetail.specValueDecimal;
      }
    });
    setEditedData(initialEditData);
  };

  const handleEditChange = (size, value) => {
    setEditedData((prev) => ({ ...prev, [size]: value }));
  };

  const handleSaveClick = async (orderNo) => {
    setIsSaving(true);
    // Create a deep copy of the specData to modify
    const updatedSpecData = JSON.parse(JSON.stringify(templateData.specData));

    // Find and update the spec details for the saved row across all sizes
    updatedSpecData.forEach((sizeData) => {
      const specDetailToUpdate = sizeData.specDetails.find(
        (sd) => sd.orderNo === orderNo
      );
      if (specDetailToUpdate) {
        const newDecimalValue = parseFloat(editedData[sizeData.size]) || 0;
        specDetailToUpdate.specValueDecimal = newDecimalValue;
        specDetailToUpdate.specValueFraction =
          decimalToFractionString(newDecimalValue);
      }
    });

    try {
      await axios.put(
        `${API_BASE_URL}/api/buyer-spec-templates/${moNo.value}`,
        {
          specData: updatedSpecData
        }
      );

      // Update local state with the saved data to reflect changes immediately
      setTemplateData((prev) => ({ ...prev, specData: updatedSpecData }));
      setEditingRowKey(null);
      setShowSuccessToast(true);
    } catch (err) {
      console.error("Failed to save spec data:", err);
      alert(
        "Error: " + (err.response?.data?.error || "Could not save changes.")
      );
    } finally {
      setIsSaving(false);
    }
  };

  // --- NEW useMemo FOR FILTERING ---
  const filteredPatternSpecs = useMemo(() => {
    // If there's no data or the filter is off, return the original full list
    if (!isPatternFilterActive || !patternData || !templateData) {
      return patternData?.AfterWashSpecs || [];
    }

    // Get the set of spec names from the DT Orders table for efficient lookup
    const dtOrderSpecNames = new Set(
      templateData.specData[0]?.specDetails.map((spec) => spec.specName)
    );

    // Filter the pattern specs
    return patternData.AfterWashSpecs.filter((patternSpec) =>
      dtOrderSpecNames.has(patternSpec.MeasurementPointEngName)
    );
  }, [patternData, templateData, isPatternFilterActive]);

  const selectStyles = {
    control: (styles) => ({
      ...styles,
      backgroundColor: "var(--color-bg-secondary)",
      border: "1px solid var(--color-border-primary)"
    }),
    option: (styles, { isFocused, isSelected }) => ({
      ...styles,
      backgroundColor: isSelected
        ? "var(--color-primary)"
        : isFocused
        ? "var(--color-bg-tertiary)"
        : "var(--color-bg-secondary)",
      color: "var(--color-text-primary)",
      ":active": {
        ...styles[":active"],
        backgroundColor: "var(--color-primary-active)"
      }
    }),
    input: (styles) => ({ ...styles, color: "var(--color-text-primary)" }),
    singleValue: (styles) => ({
      ...styles,
      color: "var(--color-text-primary)"
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: "var(--color-bg-secondary)"
    })
  };

  return (
    <div>
      <div className="max-w-xl mx-auto p-4 bg-gray-300 dark:bg-gray-600 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Filters
        </h2>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">MO No</label>
            <Select
              options={moOptions}
              value={moNo}
              onChange={setMoNo}
              styles={selectStyles}
              isClearable
              placeholder="Select an MO to edit..."
            />
          </div>
          <button
            onClick={handleClear}
            className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200"
          >
            {" "}
            <X size={20} />{" "}
          </button>
          <button
            onClick={() => alert("PDF download coming soon!")}
            className="p-2.5 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            {" "}
            <Download size={20} />{" "}
          </button>
        </div>
      </div>

      {loading && <div className="text-center p-4">Loading...</div>}
      {error && <div className="text-center p-4 text-red-500">{error}</div>}

      {/* Table 1: Pattern Team Specs */}
      {patternData && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* --- This is the new header with the toggle button --- */}
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
            <h3 className="text-lg font-bold">
              Buyer Spec Table (Pattern Team)
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPatternFilterActive(!isPatternFilterActive)}
                className={`p-2 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600
                            ${
                              isPatternFilterActive
                                ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                                : ""
                            }`}
                aria-label="Toggle Spec Filter"
                title={
                  isPatternFilterActive
                    ? "Show All Specs"
                    : "Filter to Match DT Orders Specs"
                }
              >
                <Filter size={20} />
              </button>
              <button
                onClick={() => setIsPatternTableVisible(!isPatternTableVisible)}
                className="p-2 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                aria-label="Toggle Pattern Spec Table"
              >
                {isPatternTableVisible ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
            {/* <button
              onClick={() => setIsPatternTableVisible(!isPatternTableVisible)}
              className="p-2 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              aria-label="Toggle Pattern Spec Table"
            >
              {isPatternTableVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button> */}
          </div>
          {/* --- This is the new conditional rendering block --- */}
          {isPatternTableVisible && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-3">No.</th>
                    <th className="p-3 text-left">Measurement Point</th>
                    <th className="p-3">Tol-</th>
                    <th className="p-3">Tol+</th>
                    {patternData.AfterWashSpecs[0]?.Specs.map((s) => (
                      <th key={s.size} className="p-3">
                        {s.size}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPatternSpecs.map((spec, index) => (
                    <tr key={index} className="border-b dark:border-gray-700">
                      <td className="p-3 text-center">{index + 1}</td>
                      <td className="p-3">{spec.MeasurementPointEngName}</td>

                      {/* --- MODIFIED Tol- CELL --- */}
                      <td className="p-3 text-center text-red-500 font-semibold">
                        {decimalToFractionString(spec.TolMinus.decimal)}
                        <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                          ({spec.TolMinus.decimal})
                        </span>
                      </td>

                      {/* --- MODIFIED Tol+ CELL --- */}
                      <td className="p-3 text-center text-green-500 font-semibold">
                        {decimalToFractionString(spec.TolPlus.decimal)}
                        <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                          ({spec.TolPlus.decimal})
                        </span>
                      </td>

                      {/* --- MODIFIED SIZE SPEC CELLS --- */}
                      {spec.Specs.map((sizeSpec) => (
                        <td
                          key={sizeSpec.size}
                          className="p-3 text-center font-mono"
                        >
                          {decimalToFractionString(sizeSpec.decimal)}
                          <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                            ({sizeSpec.decimal})
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Table 2: DT Orders Specs (Editable) */}
      {templateData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <h3 className="text-lg font-bold p-4 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
            Buyer Spec Table (DT Orders)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-3">No.</th>
                  <th className="p-3 text-left">Measurement Point</th>
                  <th className="p-3">Tol-</th>
                  <th className="p-3">Tol+</th>
                  {templateData.specData.map((s) => (
                    <th key={s.size} className="p-3">
                      {s.size}
                    </th>
                  ))}
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {templateData.specData[0]?.specDetails.map((baseSpec) => (
                  <tr
                    key={baseSpec.orderNo}
                    className="border-b dark:border-gray-700"
                  >
                    <td className="p-3 text-center">{baseSpec.orderNo}</td>
                    <td className="p-3">{baseSpec.specName}</td>
                    <td className="p-3 text-center text-red-500 font-semibold">
                      {baseSpec.tolMinus}
                      <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                        ({decimalToFractionString(baseSpec.tolMinus)})
                      </span>
                    </td>
                    <td className="p-3 text-center text-green-500 font-semibold">
                      {baseSpec.tolPlus}
                      <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                        ({decimalToFractionString(baseSpec.tolPlus)})
                      </span>
                    </td>
                    {templateData.specData.map((sizeData) => {
                      const currentSpec = sizeData.specDetails.find(
                        (sd) => sd.orderNo === baseSpec.orderNo
                      );
                      const isEditingThisRow =
                        editingRowKey === baseSpec.orderNo;
                      return (
                        <td key={sizeData.size} className="p-1.5 text-center">
                          {isEditingThisRow ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editedData[sizeData.size] || ""}
                              onChange={(e) =>
                                handleEditChange(sizeData.size, e.target.value)
                              }
                              className="w-20 text-center bg-blue-50 dark:bg-gray-900 border border-blue-400 rounded-md py-1"
                            />
                          ) : (
                            <div className="font-mono">
                              {currentSpec.specValueDecimal}
                              <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                                ({currentSpec.specValueFraction})
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-1.5 text-center">
                      {editingRowKey === baseSpec.orderNo ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleSaveClick(baseSpec.orderNo)}
                            disabled={isSaving}
                            className="p-1.5 text-green-600 hover:text-green-800 disabled:text-gray-400"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={() => setEditingRowKey(null)}
                            className="p-1.5 text-red-600 hover:text-red-800"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            handleEditClick(baseSpec.orderNo, baseSpec)
                          }
                          className="p-1.5 text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SuccessToast
        isOpen={showSuccessToast}
        message="Spec data updated successfully!"
        onClose={() => setShowSuccessToast(false)}
      />
    </div>
  );
};

export default EditDTSpecs;
