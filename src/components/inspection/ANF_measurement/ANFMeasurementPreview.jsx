import React, { useState, useEffect, useMemo } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

// Helper function to format fractions and decimals (can be moved to a shared utils file)
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
    return `${sign}${closest.f}`;
  }
  return `${sign}${absDecimal.toFixed(3)}`;
};

// Reusable Measurement Cell for the preview
const PreviewMeasurementCell = ({ measurement, spec }) => {
  const cellColor = useMemo(() => {
    if (!measurement || measurement.decimal === null) {
      return "bg-green-100 dark:bg-green-900/50";
    }
    const diff = measurement.decimal - spec.specValueDecimal;
    if (diff >= spec.tolMinus && diff <= spec.tolPlus) {
      return "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200";
    }
    return "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200";
  }, [measurement, spec]);

  return (
    <td className={`p-2 text-center text-sm font-semibold ${cellColor}`}>
      {measurement ? measurement.fraction : "0"}
    </td>
  );
};

const ANFMeasurementPreview = ({
  isOpen,
  onClose,
  inspectionState,
  orderDetails,
  specTableData,
  buyer
}) => {
  const { inspectionDate, selectedMo, selectedSize, selectedColors, garments } =
    inspectionState;
  const [visibleChunks, setVisibleChunks] = useState({});

  // Chunk garments into groups of 10
  const garmentChunks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < garments.length; i += 10) {
      chunks.push(garments.slice(i, i + 10));
    }
    return chunks;
  }, [garments]);

  // Initialize visibility state when chunks are created
  useEffect(() => {
    const initialVisibility = {};
    garmentChunks.forEach((_, index) => {
      initialVisibility[index] = true; // Default to visible
    });
    setVisibleChunks(initialVisibility);
  }, [garmentChunks]);

  const toggleChunkVisibility = (chunkIndex) => {
    setVisibleChunks((prev) => ({ ...prev, [chunkIndex]: !prev[chunkIndex] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-7xl my-8 flex flex-col h-[90vh]">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Inspection Data
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          {/* Top Details Section */}
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-6 gap-2 text-sm">
            <div>
              <strong className="block text-gray-500">Date:</strong>{" "}
              {format(inspectionDate, "MM/dd/yyyy")}
            </div>
            <div>
              <strong className="block text-gray-500">MO No:</strong>{" "}
              {selectedMo?.label}
            </div>
            <div>
              <strong className="block text-gray-500">Cust. Style:</strong>{" "}
              {orderDetails?.custStyle}
            </div>
            <div>
              <strong className="block text-gray-500">Buyer:</strong> {buyer}
            </div>
            <div>
              <strong className="block text-gray-500">Color(s):</strong>{" "}
              {selectedColors.map((c) => c.label).join(", ")}
            </div>
            <div>
              <strong className="block text-gray-500">Size:</strong>{" "}
              {selectedSize?.label}
            </div>
          </div>

          <hr className="my-4 border-gray-200 dark:border-gray-700" />

          {/* Buyer Specs Table */}
          <div>
            <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">
              Buyer Specs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
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
                      <td className="p-2 text-center text-red-500 font-semibold">
                        {decimalToFractionString(row.tolMinus)}
                        <span className="block text-xs font-normal text-gray-500">
                          ({row.tolMinus})
                        </span>
                      </td>
                      <td className="p-2 text-center text-green-500 font-semibold">
                        {decimalToFractionString(row.tolPlus)}
                        <span className="block text-xs font-normal text-gray-500">
                          ({row.tolPlus})
                        </span>
                      </td>
                      <td className="p-2 text-center font-bold">
                        {row.specValueFraction}
                        <span className="block text-xs font-normal text-gray-500">
                          ({row.specValueDecimal})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Measured Values Tables */}
          <div className="space-y-6">
            {garmentChunks.map((chunk, chunkIndex) => {
              const startGarment = chunkIndex * 10 + 1;
              const endGarment = startGarment + chunk.length - 1;
              return (
                <div key={chunkIndex}>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => toggleChunkVisibility(chunkIndex)}
                      className="p-1 text-gray-500 hover:text-gray-800"
                    >
                      {visibleChunks[chunkIndex] ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                      Measured Values (G{startGarment} to G{endGarment})
                    </h3>
                  </div>
                  {visibleChunks[chunkIndex] && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase">
                          <tr>
                            <th className="p-2 text-center w-12">No</th>
                            {chunk.map((_, garmentIndex) => (
                              <th
                                key={garmentIndex}
                                className="p-2 text-center w-24"
                              >
                                G{startGarment + garmentIndex}
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
                              <td className="p-2 text-center text-xs">
                                {specRow.orderNo}
                              </td>
                              {chunk.map((garmentData, garmentIndex) => (
                                <PreviewMeasurementCell
                                  key={garmentIndex}
                                  measurement={garmentData[specRow.orderNo]}
                                  spec={specRow}
                                />
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ANFMeasurementPreview;
