import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config";

const DigitalMeasurementBuyerSpec = () => {
  const [filters, setFilters] = useState({
    factory: "",
    mono: "",
    custStyle: "",
    buyer: "",
    mode: "",
    country: "",
    origin: ""
  });

  const [filterOptions, setFilterOptions] = useState({
    factories: [],
    monos: [],
    custStyles: [],
    buyers: [],
    modes: [],
    countries: [],
    origins: []
  });

  const [orderData, setOrderData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentMono, setCurrentMono] = useState(null);
  const [isManualMonoSelection, setIsManualMonoSelection] = useState(false);

  // Updated decimal to fraction conversion to match DigitalMeasurement.jsx
  const decimalToFraction = (decimal) => {
    if (!decimal || isNaN(decimal)) return <span> </span>;

    // Extract the sign
    const sign = decimal < 0 ? "-" : "";
    // Work with the absolute value
    const absDecimal = Math.abs(decimal);
    // For tolerances, we expect the magnitude to be between 0 and 1
    // If the value is greater than 1, take the fractional part
    const fractionValue =
      absDecimal >= 1 ? absDecimal - Math.floor(absDecimal) : absDecimal;
    const whole = absDecimal >= 1 ? Math.floor(absDecimal) : 0;

    // If there's no fractional part, return the whole number with sign
    if (fractionValue === 0)
      return (
        <span>
          {sign}
          {whole || 0}
        </span>
      );

    const fractions = [
      { value: 0.0625, fraction: { numerator: 1, denominator: 16 } },
      { value: 0.125, fraction: { numerator: 1, denominator: 8 } },
      { value: 0.1875, fraction: { numerator: 3, denominator: 16 } },
      { value: 0.25, fraction: { numerator: 1, denominator: 4 } },
      { value: 0.3125, fraction: { numerator: 5, denominator: 16 } },
      { value: 0.375, fraction: { numerator: 3, denominator: 8 } },
      { value: 0.4375, fraction: { numerator: 7, denominator: 16 } },
      { value: 0.5, fraction: { numerator: 1, denominator: 2 } },
      { value: 0.5625, fraction: { numerator: 9, denominator: 16 } },
      { value: 0.625, fraction: { numerator: 5, denominator: 8 } },
      { value: 0.6875, fraction: { numerator: 11, denominator: 16 } },
      { value: 0.75, fraction: { numerator: 3, denominator: 4 } },
      { value: 0.8125, fraction: { numerator: 13, denominator: 16 } },
      { value: 0.875, fraction: { numerator: 7, denominator: 8 } },
      { value: 0.9375, fraction: { numerator: 15, denominator: 16 } }
    ];

    const tolerance = 0.01;
    const closestFraction = fractions.find(
      (f) => Math.abs(fractionValue - f.value) < tolerance
    );

    if (closestFraction) {
      const { numerator, denominator } = closestFraction.fraction;
      const fractionElement = (
        <span className="inline-flex flex-col items-center">
          <span className="text-xs leading-none">{numerator}</span>
          <span className="border-t border-black w-3"></span>
          <span className="text-xs leading-none">{denominator}</span>
        </span>
      );
      return (
        <span className="inline-flex items-center justify-center">
          {sign}
          {whole !== 0 && <span className="mr-1">{whole}</span>}
          {fractionElement}
        </span>
      );
    }
    return (
      <span>
        {sign}
        {fractionValue.toFixed(3)}
      </span>
    );
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/filter-options`, {
          params: filters,
          withCredentials: true
        });
        setFilterOptions({
          factories: response.data.factories.map((f) => ({
            value: f,
            label: f
          })),
          monos: response.data.monos.map((m) => ({ value: m, label: m })),
          custStyles: response.data.custStyles.map((cs) => ({
            value: cs,
            label: cs
          })),
          buyers: response.data.buyers.map((b) => ({ value: b, label: b })),
          modes: response.data.modes.map((m) => ({ value: m, label: m })),
          countries: response.data.countries.map((c) => ({
            value: c,
            label: c
          })),
          origins: response.data.origins.map((o) => ({ value: o, label: o }))
        });
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    fetchFilterOptions();
  }, [filters]);

  useEffect(() => {
    const fetchPaginatedMonos = async () => {
      try {
        if (isManualMonoSelection) {
          setTotalPages(1);
          setCurrentPage(1);
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/paginated-monos`,
          {
            params: { page: currentPage, ...filters },
            withCredentials: true
          }
        );
        if (response.data.monos.length > 0) {
          setCurrentMono(response.data.monos[0]);
          setTotalPages(response.data.totalPages);
        } else {
          setCurrentMono(null);
          setOrderData(null);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching paginated MONos:", error);
        setTotalPages(1);
      }
    };
    fetchPaginatedMonos();
  }, [currentPage, filters, isManualMonoSelection]);

  useEffect(() => {
    if (currentMono) {
      const fetchOrderDetails = async () => {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/buyer-spec-order-details/${currentMono}`,
            {
              withCredentials: true
            }
          );
          if (response.data.buyerSpec) {
            response.data.buyerSpec.sort((a, b) => a.seq - b.seq);
          }
          setOrderData(response.data);
        } catch (error) {
          console.error("Error fetching order details:", error);
          setOrderData(null);
        }
      };
      fetchOrderDetails();
    } else {
      setOrderData(null);
    }
  }, [currentMono]);

  const handlePrevious = () => {
    if (currentPage > 1 && !isManualMonoSelection) {
      setCurrentPage(currentPage - 1);
      setIsManualMonoSelection(false);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !isManualMonoSelection) {
      setCurrentPage(currentPage + 1);
      setIsManualMonoSelection(false);
    }
  };

  const handlePageClick = (page) => {
    if (!isManualMonoSelection) {
      setCurrentPage(page);
      setIsManualMonoSelection(false);
    }
  };

  const getPaginationRange = () => {
    if (isManualMonoSelection) {
      return [1];
    }

    const maxPagesToShow = 10;
    const halfRange = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - halfRange);
    let end = Math.min(totalPages, start + maxPagesToShow - 1);

    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }

    const pages = [];
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-white text-black p-4">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4">
          Buyer Measurement Specs
        </h1>

        <div className="p-4 bg-gray-100 rounded shadow mb-4">
          <h2 className="text-xl font-bold mb-4">Filter Pane</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div>
              <label className="block text-sm font-medium">Factory</label>
              <Select
                options={filterOptions.factories}
                value={filterOptions.factories.find(
                  (opt) => opt.value === filters.factory
                )}
                onChange={(option) =>
                  setFilters({
                    ...filters,
                    factory: option ? option.value : ""
                  })
                }
                isClearable
                className="text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">MO No</label>
              <Select
                options={filterOptions.monos}
                value={filterOptions.monos.find(
                  (opt) => opt.value === filters.mono
                )}
                onChange={(option) => {
                  const monoValue = option ? option.value : "";
                  setFilters({ ...filters, mono: monoValue });
                  setCurrentMono(monoValue);
                  setCurrentPage(1);
                  setIsManualMonoSelection(!!monoValue);
                }}
                isClearable
                className="text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Cust. Style</label>
              <Select
                options={filterOptions.custStyles}
                value={filterOptions.custStyles.find(
                  (opt) => opt.value === filters.custStyle
                )}
                onChange={(option) =>
                  setFilters({
                    ...filters,
                    custStyle: option ? option.value : ""
                  })
                }
                isClearable
                className="text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Buyer</label>
              <Select
                options={filterOptions.buyers}
                value={filterOptions.buyers.find(
                  (opt) => opt.value === filters.buyer
                )}
                onChange={(option) =>
                  setFilters({
                    ...filters,
                    buyer: option ? option.value : ""
                  })
                }
                isClearable
                className="text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Mode</label>
              <Select
                options={filterOptions.modes}
                value={filterOptions.modes.find(
                  (opt) => opt.value === filters.mode
                )}
                onChange={(option) =>
                  setFilters({
                    ...filters,
                    mode: option ? option.value : ""
                  })
                }
                isClearable
                className="text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Country</label>
              <Select
                options={filterOptions.countries}
                value={filterOptions.countries.find(
                  (opt) => opt.value === filters.country
                )}
                onChange={(option) =>
                  setFilters({
                    ...filters,
                    country: option ? option.value : ""
                  })
                }
                isClearable
                className="text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Origin</label>
              <Select
                options={filterOptions.origins}
                value={filterOptions.origins.find(
                  (opt) => opt.value === filters.origin
                )}
                onChange={(option) =>
                  setFilters({
                    ...filters,
                    origin: option ? option.value : ""
                  })
                }
                isClearable
                className="text-black"
              />
            </div>
          </div>
        </div>

        {orderData && (
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Order Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded border table-auto">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border min-w-[100px]">MO No</th>
                    <th className="p-2 border min-w-[100px]">Cust. Style</th>
                    <th className="p-2 border min-w-[100px]">Buyer</th>
                    <th className="p-2 border min-w-[80px]">Mode</th>
                    <th className="p-2 border min-w-[80px]">Country</th>
                    <th className="p-2 border min-w-[80px]">Origin</th>
                    <th className="p-2 border min-w-[80px]">Order Qty</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-center text-sm">
                    <td className="p-2 border align-middle">
                      {orderData.moNo}
                    </td>
                    <td className=" vendedor-2 border align-middle">
                      {orderData.custStyle}
                    </td>
                    <td className="p-2 border align-middle">
                      {orderData.buyer}
                    </td>
                    <td className="p-2 border align-middle">
                      {orderData.mode}
                    </td>
                    <td className="p-2 border align-middle">
                      {orderData.country}
                    </td>
                    <td className="p-2 border align-middle">
                      {orderData.origin}
                    </td>
                    <td className="p-2 border align-middle">
                      {orderData.orderQty}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {orderData && orderData.colors.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">
              Color and Size Order Quantities
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded border table-auto">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border min-w-[100px]">Color</th>
                    {orderData.sizes.map((size) => (
                      <th key={size} className="p-2 border min-w-[60px]">
                        {size}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orderData.colors.map((color) => (
                    <tr key={color} className="text-center text-sm">
                      <td className="p-2 border align-middle">{color}</td>
                      {orderData.sizes.map((size) => (
                        <td key={size} className="p-2 border align-middle">
                          {orderData.colorSizeMap[color][size] || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {orderData && orderData.buyerSpec.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Buyer Specification</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded border table-auto">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border min-w-[50px]">Seq</th>
                    <th className="p-2 border min-w-[150px] text-left">
                      Measurement Points
                    </th>
                    <th className="p-2 border min-w-[150px] text-left">
                      Chinese Remark
                    </th>
                    <th className="p-2 border min-w-[50px]">Tol -</th>
                    <th className="p-2 border min-w-[50px]">Tol +</th>
                    {orderData.sizes.map((size) => (
                      <th key={size} className="p-2 border min-w-[50px]">
                        {size}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orderData.buyerSpec.map((spec) => (
                    <tr key={spec.seq} className="text-sm">
                      <td className="p-2 border text-center align-middle">
                        {spec.seq}
                      </td>
                      <td className="p-2 border text-left align-middle">
                        {spec.measurementPoint}
                      </td>
                      <td className="p-2 border text-left align-middle">
                        {spec.chineseRemark}
                      </td>
                      <td className="p-2 border text-center align-middle">
                        {decimalToFraction(spec.tolMinus)}
                      </td>
                      <td className="p-2 border text-center align-middle">
                        {decimalToFraction(spec.tolPlus)}
                      </td>
                      {orderData.sizes.map((size) => (
                        <td
                          key={size}
                          className="p-2 border text-center align-middle"
                        >
                          {decimalToFraction(spec.specs[size])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-center items-center space-x-2 mt-4 flex-wrap">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1 || isManualMonoSelection}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          {getPaginationRange().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === "number" && handlePageClick(page)}
              className={`px-4 py-2 rounded ${
                page === currentPage ? "bg-blue-500 text-white" : "bg-gray-200"
              } ${typeof page === "string" ? "cursor-default" : ""} ${
                isManualMonoSelection ? "cursor-default" : ""
              }`}
              disabled={typeof page === "string" || isManualMonoSelection}
            >
              {page}
            </button>
          ))}
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages || isManualMonoSelection}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalMeasurementBuyerSpec;
