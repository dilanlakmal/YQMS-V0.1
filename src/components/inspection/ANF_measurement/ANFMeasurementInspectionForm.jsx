import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config";
import MeasurementNumPad from "../cutting/MeasurementNumPad";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

const MeasurementCell = ({ value, specDecimal, tol, onClick }) => {
  const cellColor = useMemo(() => {
    if (value === null || value === undefined)
      return "bg-gray-50 dark:bg-gray-700/50";
    const diff = value - specDecimal;
    if (diff >= tol.minus && diff <= tol.plus) {
      return "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"; // OK
    }
    return "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200"; // Fail
  }, [value, specDecimal, tol]);

  return (
    <td
      className={`p-0 text-center text-sm font-semibold cursor-pointer ${cellColor}`}
    >
      <div
        onClick={onClick}
        className="w-full h-full p-2 flex items-center justify-center"
      >
        {value !== null ? value : "0"}
      </div>
    </td>
  );
};

const ANFMeasurementInspectionForm = () => {
  const [moOptions, setMoOptions] = useState([]);
  const [selectedMo, setSelectedMo] = useState(null);
  const [buyer, setBuyer] = useState("");
  const [sizeOptions, setSizeOptions] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [colorOptions, setColorOptions] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [orderDetails, setOrderDetails] = useState(null);
  const [specTableData, setSpecTableData] = useState([]);
  const [garments, setGarments] = useState([{}]);
  const [currentGarmentIndex, setCurrentGarmentIndex] = useState(0);
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [activeCell, setActiveCell] = useState(null);

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
      setSelectedSize(null);
      setColorOptions([]);
      setSelectedColors([]);
      setOrderDetails(null);
      setSpecTableData([]);
      setGarments([{}]);
      setCurrentGarmentIndex(0);
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
  }, [selectedMo]);

  useEffect(() => {
    if (selectedMo && selectedSize) {
      axios
        .get(`${API_BASE_URL}/api/anf-measurement/spec-table`, {
          params: { moNo: selectedMo.value, size: selectedSize.value },
          withCredentials: true
        })
        .then((res) => {
          setSpecTableData(res.data);
          const initialGarmentData = {};
          res.data.forEach((row) => {
            initialGarmentData[row.orderNo] = { decimal: null, fraction: "0" };
          });
          setGarments([initialGarmentData]);
          setCurrentGarmentIndex(0);
        })
        .catch((err) => console.error("Error fetching spec table data:", err));
    } else {
      setSpecTableData([]);
    }
  }, [selectedMo, selectedSize]);

  const handleNumpadInput = (decimalValue, fractionValue) => {
    if (activeCell) {
      const { garmentIndex, orderNo } = activeCell;
      setGarments((prev) => {
        const newGarments = [...prev];
        const specValue =
          specTableData.find((s) => s.orderNo === orderNo)?.specValueDecimal ||
          0;
        newGarments[garmentIndex] = {
          ...newGarments[garmentIndex],
          [orderNo]: {
            decimal: specValue + decimalValue,
            fraction: fractionValue
          }
        };
        return newGarments;
      });
    }
  };

  const addGarment = () => {
    const initialGarmentData = {};
    specTableData.forEach((row) => {
      initialGarmentData[row.orderNo] = { decimal: null, fraction: "0" };
    });
    setGarments((prev) => [...prev, initialGarmentData]);
    setCurrentGarmentIndex(garments.length);
  };

  const removeGarment = (indexToRemove) => {
    if (garments.length <= 1) return;
    setGarments((prev) => prev.filter((_, i) => i !== indexToRemove));
    if (currentGarmentIndex >= indexToRemove) {
      setCurrentGarmentIndex((prev) => Math.max(0, prev - 1));
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

  const summaryStats = useMemo(() => {
    if (specTableData.length === 0) return {};
    const totalGarmentsChecked = garments.length;
    const totalMeasurementPoints = specTableData.length * totalGarmentsChecked;
    let totalPosTol = 0,
      totalNegTol = 0,
      totalOkGarments = 0;
    garments.forEach((garment) => {
      let isGarmentOk = true;
      specTableData.forEach((spec) => {
        const measurement = garment[spec.orderNo];
        if (measurement?.decimal !== null) {
          const diff = measurement.decimal - spec.specValueDecimal;
          if (diff > spec.tolPlus) {
            totalPosTol++;
            isGarmentOk = false;
          } else if (diff < spec.tolMinus) {
            totalNegTol++;
            isGarmentOk = false;
          }
        }
      });
      if (isGarmentOk) totalOkGarments++;
    });
    const totalIssuesPoints = totalPosTol + totalNegTol;
    const totalOkPoints = totalMeasurementPoints - totalIssuesPoints;
    const totalIssuesGarments = totalGarmentsChecked - totalOkGarments;
    const passRateByGarment =
      totalGarmentsChecked > 0
        ? ((totalOkGarments / totalGarmentsChecked) * 100).toFixed(2)
        : "0.00";
    const passRateByPoints =
      totalMeasurementPoints > 0
        ? ((totalOkPoints / totalMeasurementPoints) * 100).toFixed(2)
        : "0.00";
    return {
      totalGarmentsChecked,
      totalMeasurementPoints,
      totalPosTol,
      totalNegTol,
      totalIssuesPoints,
      totalOkGarments,
      totalIssuesGarments,
      passRateByGarment,
      passRateByPoints
    };
  }, [garments, specTableData]);

  const selectStyles = {
    /* ... your react-select styles ... */
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">MO No</label>
            <Select
              options={moOptions}
              value={selectedMo}
              onChange={setSelectedMo}
              isClearable
              styles={selectStyles}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Buyer</label>
            <input
              type="text"
              value={buyer}
              readOnly
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Size</label>
            <Select
              options={sizeOptions}
              value={selectedSize}
              onChange={setSelectedSize}
              isDisabled={!selectedMo}
              isClearable
              styles={selectStyles}
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm font-medium mb-1">Color</label>
            <Select
              isMulti
              options={colorOptions}
              value={selectedColors}
              onChange={setSelectedColors}
              isDisabled={!selectedMo}
              styles={selectStyles}
            />
          </div>
        </div>
      </div>

      {orderDetails && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">Order Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                      {Object.values(orderQtyBySelectedColor).map((qty, i) => (
                        <td key={i} className="p-2">
                          {qty}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {specTableData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
            <h3 className="text-lg font-bold">Measurement Entry</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCurrentGarmentIndex((p) => Math.max(0, p - 1))
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
                  setCurrentGarmentIndex((p) =>
                    Math.min(garments.length - 1, p + 1)
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
                  <th className="p-2 text-left w-12">No</th>
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
                    <td className="p-2">{row.specName}</td>
                    <td className="p-2 text-center text-red-500 font-semibold">
                      {row.tolMinus}
                    </td>
                    <td className="p-2 text-center text-green-500 font-semibold">
                      {row.tolPlus}
                    </td>
                    <td className="p-2 text-center font-bold">
                      {row.specValueFraction}
                    </td>
                    <MeasurementCell
                      value={
                        garments[currentGarmentIndex]?.[row.orderNo]
                          ?.fraction || "0"
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

      {specTableData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(summaryStats).map(([key, value]) => (
            <div
              key={key}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
            >
              <h4 className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {value}
                {key.includes("Rate") ? "%" : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      {isNumpadOpen && (
        <MeasurementNumPad
          onClose={() => setIsNumpadOpen(false)}
          onInput={handleNumpadInput}
        />
      )}
    </div>
  );
};

export default ANFMeasurementInspectionForm;
