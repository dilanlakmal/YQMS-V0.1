import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config";
import { Eye, Search, X, CheckCircle } from "lucide-react";
import BuyerSpecPreview from "./BuyerSpecPreview";

// Helper function to derive buyer from MO number
const getBuyerFromMoNumber = (moNo) => {
  if (!moNo) return "Other";
  if (moNo.includes("COM")) return "MWW";
  if (moNo.includes("CO")) return "Costco";
  if (moNo.includes("AR")) return "Aritzia";
  if (moNo.includes("RT")) return "Reitmans";
  if (moNo.includes("AF")) return "ANF";
  if (moNo.includes("NT")) return "STORI";
  return "Other";
};

const SelectDTBuyerSpec = () => {
  const [buyer, setBuyer] = useState({ value: "ANF", label: "ANF" });
  const [moNo, setMoNo] = useState(null);
  const [moOptions, setMoOptions] = useState([]);
  const [orderData, setOrderData] = useState(null);
  const [selectedSpecs, setSelectedSpecs] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const buyerOptions = [
    { value: "ANF", label: "ANF" },
    { value: "MWW", label: "MWW" },
    { value: "Costco", label: "Costco" },
    { value: "Aritzia", label: "Aritzia" },
    { value: "Reitmans", label: "Reitmans" },
    { value: "STORI", label: "STORI" },
    { value: "Other", label: "Other" }
  ];

  useEffect(() => {
    const fetchAllMonos = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/filter-options`, {
          withCredentials: true
        });
        const allMonos = response.data.monos.map((m) => ({
          value: m,
          label: m
        }));
        setMoOptions(allMonos);
      } catch (error) {
        console.error("Error fetching MO options:", error);
      }
    };
    fetchAllMonos();
  }, []);

  useEffect(() => {
    if (moNo && moNo.value) {
      const fetchOrderDetails = async () => {
        setLoading(true);
        setOrderData(null);
        setSelectedSpecs([]);
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/buyer-spec-order-details/${moNo.value}`,
            { withCredentials: true }
          );
          const sortedSpec = response.data.buyerSpec.sort(
            (a, b) => a.seq - b.seq
          );
          setOrderData({ ...response.data, buyerSpec: sortedSpec });
        } catch (error) {
          console.error("Error fetching order details:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchOrderDetails();
    } else {
      setOrderData(null);
      setSelectedSpecs([]);
    }
  }, [moNo]);

  const handleClearFilters = () => {
    setBuyer({ value: "ANF", label: "ANF" });
    setMoNo(null);
    setSearchTerm("");
  };

  // --- MODIFIED: Simplified toggle function ---
  const handleSpecToggle = (spec) => {
    setSelectedSpecs((currentSelected) => {
      const isSelected = currentSelected.some((s) => s.seq === spec.seq);
      if (isSelected) {
        return currentSelected.filter((s) => s.seq !== spec.seq);
      } else {
        return [...currentSelected, spec];
      }
    });
  };

  const filteredMoOptions = useMemo(() => {
    if (!buyer) return moOptions;
    return moOptions.filter(
      (option) => getBuyerFromMoNumber(option.value) === buyer.value
    );
  }, [buyer, moOptions]);

  const filteredSpecs = useMemo(() => {
    if (!orderData) return [];
    if (!searchTerm) return orderData.buyerSpec;
    const lowercasedFilter = searchTerm.toLowerCase();
    return orderData.buyerSpec.filter(
      (spec) =>
        spec.measurementPoint.toLowerCase().includes(lowercasedFilter) ||
        spec.seq.toString().includes(lowercasedFilter)
    );
  }, [orderData, searchTerm]);

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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="max-w-2xl mx-auto p-4 bg-gray-300 dark:bg-gray-600 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            Filters
          </h2>
          <div className="flex flex-row items-end gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buyer
              </label>
              <Select
                options={buyerOptions}
                value={buyer}
                onChange={setBuyer}
                isClearable
                styles={selectStyles}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                MO No
              </label>
              <Select
                options={filteredMoOptions}
                value={moNo}
                onChange={(selectedOption) => {
                  if (!buyer && selectedOption) {
                    alert("Please select a Buyer before selecting an MO No.");
                    return;
                  }
                  setMoNo(selectedOption);
                }}
                //onChange={setMoNo}
                isClearable
                isLoading={!moOptions.length}
                styles={selectStyles}
              />
            </div>
            <div className="pb-[1px]">
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center p-4">Loading spec details...</div>
        )}

        {orderData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-4 border-b dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Available Specs for {moNo && moNo.label}
              </h2>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or seq..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setIsPreviewOpen(true)}
                  disabled={selectedSpecs.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <Eye className="mr-2 -ml-1 h-5 w-5" />
                  Preview ({selectedSpecs.length})
                </button>
              </div>
            </div>

            {/* --- MODIFIED: Spec Selection Grid --- */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSpecs.map((spec) => {
                const isSelected = selectedSpecs.some(
                  (s) => s.seq === spec.seq
                );
                return (
                  <div
                    key={spec.seq}
                    onClick={() => handleSpecToggle(spec)}
                    className={`p-3 rounded-lg border-2 flex items-center justify-between cursor-pointer transition-colors duration-200
                                            ${
                                              isSelected
                                                ? "bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-600"
                                                : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500"
                                            }`}
                  >
                    <div className="flex-grow">
                      <span
                        className={`font-semibold text-gray-800 dark:text-gray-100 ${
                          isSelected ? "text-red-800 dark:text-red-200" : ""
                        }`}
                      >
                        {spec.seq}. {spec.measurementPoint}
                      </span>
                    </div>
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center transition-all duration-200
                                            ${
                                              isSelected
                                                ? "bg-red-500"
                                                : "bg-gray-300 dark:bg-gray-600"
                                            }`}
                    >
                      {isSelected && (
                        <CheckCircle size={16} className="text-white" />
                      )}
                    </div>
                    {/* Visually hidden but accessible checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="sr-only"
                      aria-labelledby={`spec-label-${spec.seq}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <BuyerSpecPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          selectedSpecs={selectedSpecs}
          orderData={orderData}
          selectedBuyer={buyer}
        />
      </div>
    </div>
  );
};

export default SelectDTBuyerSpec;
