import React, { useState, useEffect } from "react";
import axios from "axios";
import "antd/dist/reset.css";
import { Modal } from "antd";
import { FaClock } from "react-icons/fa";
import DigitalMeasurementFilterPane from "../digital_measurement/DigitalMeasurementFilterPane";
import DigialMeasurementSummaryCards from "../digital_measurement/DigialMeasurementSummaryCards";
import DigitalMeasurementTotalSummary from "../digital_measurement/DigitalMeasurementTotalSummary";
import { API_BASE_URL } from "../../../../config";

const DigitalMeasurementCPK = () => {
  const [filters, setFilters] = useState({
    factory: "",
    startDate: null,
    endDate: null,
    mono: "",
    custStyle: "",
    buyer: "",
    empId: "",
    stage: ""
  });

  const [filterOptions, setFilterOptions] = useState({
    factories: [],
    monos: [],
    custStyles: [],
    buyers: [],
    empIds: [],
    stages: [],
    minDate: null,
    maxDate: null
  });

  const [summaryData, setSummaryData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [measurementSummary, setMeasurementSummary] = useState([]);
  const [selectedMono, setSelectedMono] = useState(null);
  const [measurementDetails, setMeasurementDetails] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");

  const filteredMeasurementSummary = selectedMono
    ? measurementSummary.filter((item) => item.moNo === selectedMono)
    : measurementSummary;

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
          empIds: response.data.empIds.map((e) => ({ value: e, label: e })),
          stages: response.data.stages.map((s) => ({ value: s, label: s })),
          minDate: response.data.minDate
            ? new Date(response.data.minDate)
            : null,
          maxDate: response.data.maxDate
            ? new Date(response.data.maxDate)
            : null
        });
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    fetchFilterOptions();
  }, [filters]);

  const fetchSummaryData = async () => {
    try {
      const params = {
        factory: filters.factory,
        startDate: filters.startDate ? filters.startDate.toISOString() : null,
        endDate: filters.endDate ? filters.endDate.toISOString() : null,
        mono: filters.mono,
        custStyle: filters.custStyle,
        buyer: filters.buyer,
        empId: filters.empId,
        stage: filters.stage
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/measurement-summary`,
        {
          params,
          withCredentials: true
        }
      );
      setSummaryData(response.data);
    } catch (error) {
      console.error("Error fetching summary data:", error);
      setSummaryData(null);
    }
  };

  const fetchMeasurementSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const params = {
        page: currentPage,
        factory: filters.factory,
        startDate: filters.startDate ? filters.startDate.toISOString() : null,
        endDate: filters.endDate ? filters.endDate.toISOString() : null,
        mono: filters.mono,
        custStyle: filters.custStyle,
        buyer: filters.buyer,
        empId: filters.empId,
        stage: filters.stage
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/measurement-summary-per-mono`,
        {
          params,
          withCredentials: true
        }
      );
      setMeasurementSummary(response.data.summaryPerMono);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching measurement summary:", error);
      setMeasurementSummary([]);
      setTotalPages(1);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const fetchMeasurementDetails = async () => {
    if (selectedMono) {
      try {
        const params = {
          startDate: filters.startDate ? filters.startDate.toISOString() : null,
          endDate: filters.endDate ? filters.endDate.toISOString() : null,
          empId: filters.empId,
          stage: filters.stage
        };
        const response = await axios.get(
          `${API_BASE_URL}/api/measurement-details/${selectedMono}`,
          {
            params,
            withCredentials: true
          }
        );
        setMeasurementDetails(response.data);
      } catch (error) {
        console.error("Error fetching measurement details:", error);
        setMeasurementDetails(null);
      }
    } else {
      setMeasurementDetails(null);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [filters]);

  useEffect(() => {
    fetchMeasurementSummary();
  }, [currentPage, filters]);

  useEffect(() => {
    fetchMeasurementDetails();
  }, [selectedMono, filters]);

  const decimalToFraction = (decimal) => {
    if (!decimal || isNaN(decimal)) return <span> </span>;

    const sign = decimal < 0 ? "-" : "";
    const absDecimal = Math.abs(decimal);
    const fractionValue =
      absDecimal >= 1 ? absDecimal - Math.floor(absDecimal) : absDecimal;
    const whole = absDecimal >= 1 ? Math.floor(absDecimal) : 0;

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

  const handleEditClick = (garmentIndex, pointIndex, currentValue) => {
    setEditingCell(`${garmentIndex}-${pointIndex}`);
    setEditValue(currentValue.toString());
  };

  const handleSaveClick = async (
    moNo,
    referenceNo,
    actualIndex,
    garmentIndex,
    pointIndex
  ) => {
    try {
      const newValue = parseFloat(editValue);
      if (isNaN(newValue)) {
        alert("Please enter a valid number");
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/update-measurement-value`,
        {
          moNo,
          referenceNo,
          index: actualIndex,
          newValue
        },
        { withCredentials: true }
      );

      const updatedRecords = [...measurementDetails.records];
      updatedRecords[garmentIndex].actual[actualIndex].value = newValue;
      setMeasurementDetails({ ...measurementDetails, records: updatedRecords });

      setEditingCell(null);
      setEditValue("");

      await Promise.all([
        fetchSummaryData(),
        fetchMeasurementSummary(),
        fetchMeasurementDetails()
      ]);
    } catch (error) {
      console.error(
        "Error saving measurement value:",
        error.response?.data || error.message
      );
      alert(
        `Failed to save the measurement value: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPaginationRange = () => {
    const maxPagesToShow = 5;
    const halfRange = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - halfRange);
    let end = Math.min(totalPages, start + maxPagesToShow - 1);
    if (end - start + 1 < maxPagesToShow)
      start = Math.max(1, end - maxPagesToShow + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="min-h-screen bg-white text-black p-4">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          Digital Measurement Dashboard
        </h1>

        <DigitalMeasurementFilterPane
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
          selectedMono={selectedMono}
        />

        <DigialMeasurementSummaryCards summaryData={summaryData} />

        <div className="flex items-center mb-4">
          {selectedMono && (
            <button
              onClick={() => setSelectedMono(null)}
              className="mr-2 text-red-600 hover:text-red-800 focus:outline-none"
              title="Clear selected MO No"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          )}
          <h2 className="text-lg font-semibold">Measurement Summary</h2>
        </div>
        <div className="relative overflow-x-auto mb-6">
          {isLoadingSummary && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
            </div>
          )}
          <table className="w-full bg-white rounded border table-auto">
            <thead>
              <tr className="bg-gray-200 text-sm">
                <th className="p-2 border">MO No</th>
                <th className="p-2 border">Cust. Style</th>
                <th className="p-2 border">Buyer</th>
                <th className="p-2 border">Country</th>
                <th className="p-2 border">Origin</th>
                <th className="p-2 border">Mode</th>
                <th className="p-2 border">Order Qty</th>
                <th className="p-2 border">Inspected Qty</th>
                <th className="p-2 border">Total Pass</th>
                <th className="p-2 border">Total Reject</th>
                <th className="p-2 border">Pass Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeasurementSummary.length > 0 ? (
                filteredMeasurementSummary.map((item, index) => (
                  <tr key={index} className="text-center text-sm">
                    <td
                      className="p-2 border cursor-pointer text-blue-600 hover:underline"
                      onClick={() => setSelectedMono(item.moNo)}
                    >
                      {item.moNo}
                    </td>
                    <td className="p-2 border">{item.custStyle || "N/A"}</td>
                    <td className="p-2 border">{item.buyer || "N/A"}</td>
                    <td className="p-2 border">{item.country || "N/A"}</td>
                    <td className="p-2 border">{item.origin || "N/A"}</td>
                    <td className="p-2 border">{item.mode || "N/A"}</td>
                    <td className="p-2 border">{item.orderQty}</td>
                    <td className="p-2 border">{item.inspectedQty}</td>
                    <td className="p-2 border">{item.totalPass}</td>
                    <td className="p-2 border">{item.totalReject}</td>
                    <td className="p-2 border">{item.passRate}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="p-4 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!selectedMono && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mb-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoadingSummary}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
            >
              Previous
            </button>
            {getPaginationRange().map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                disabled={isLoadingSummary}
                className={`px-4 py-2 rounded ${
                  page === currentPage
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                } disabled:opacity-50`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoadingSummary}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
            >
              Next
            </button>
          </div>
        )}

        <div>
          {selectedMono && measurementDetails ? (
            <>
              <DigitalMeasurementTotalSummary
                summaryData={measurementDetails.measurementPointSummary || []}
                records={measurementDetails.records || []}
                sizeSpec={measurementDetails.sizeSpec || []}
                decimalToFraction={decimalToFraction}
              />
              <h2 className="text-lg font-semibold mb-4">
                Inspected Summary for MO No: {selectedMono}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded border table-auto">
                  <thead>
                    <tr className="bg-gray-200 text-sm">
                      <th className="p-2 border">Inspection Date</th>
                      <th className="p-2 border">Garment NO</th>
                      <th className="p-2 border">Size</th>
                      <th className="p-2 border">Measurement Point</th>
                      <th className="p-2 border">Buyer Specs</th>
                      <th className="p-2 border">TolMinus</th>
                      <th className="p-2 border">TolPlus</th>
                      <th className="p-2 border">Measure Value</th>
                      <th className="p-2 border">Diff</th>
                      <th className="p-2 border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurementDetails.records.length > 0 ? (
                      measurementDetails.records.map((record, garmentIndex) => {
                        const inspectionDate = new Date(
                          record.created_at
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit"
                        });
                        const garmentNo = garmentIndex + 1;
                        const size = record.size || "N/A";
                        const points = record.actual
                          .map((actualItem, index) => {
                            if (actualItem.value === 0) return null;
                            const spec = measurementDetails.sizeSpec[index];
                            const measurementPoint = spec.EnglishRemark;
                            const tolMinus = spec.ToleranceMinus.decimal;
                            const tolPlus = spec.TolerancePlus.decimal;
                            const buyerSpec =
                              spec.Specs.find(
                                (s) => Object.keys(s)[0] === record.size
                              )?.[record.size]?.decimal || 0;
                            const measureValue = actualItem.value;
                            const diff = buyerSpec - measureValue;
                            const lower = buyerSpec + tolMinus;
                            const upper = buyerSpec + tolPlus;
                            const status =
                              measureValue >= lower && measureValue <= upper
                                ? "Pass"
                                : "Fail";
                            return {
                              measurementPoint,
                              buyerSpec,
                              tolMinus,
                              tolPlus,
                              measureValue,
                              diff,
                              status,
                              actualIndex: index,
                              referenceNo: record.reference_no
                            };
                          })
                          .filter((p) => p !== null);

                        return points.map((point, pointIndex) => {
                          const cellId = `${garmentIndex}-${pointIndex}`;
                          const isEditing = editingCell === cellId;
                          const diffBgColor =
                            point.diff >= point.tolMinus &&
                            point.diff <= point.tolPlus
                              ? "bg-green-100"
                              : "bg-red-100";

                          return (
                            <tr
                              key={`${garmentIndex}-${pointIndex}`}
                              className="text-center text-sm"
                            >
                              {pointIndex === 0 ? (
                                <td
                                  rowSpan={points.length}
                                  className="p-2 border align-middle"
                                >
                                  <div className="flex flex-col items-center">
                                    <span>{inspectionDate}</span>
                                    <button
                                      onClick={() =>
                                        Modal.confirm({
                                          title: "Confirm Deletion",
                                          content:
                                            "Do you really need to delete this measurement record?",
                                          okText: "Yes",
                                          okType: "danger",
                                          cancelText: "No",
                                          onOk: async () => {
                                            try {
                                              await axios.delete(
                                                `${API_BASE_URL}/api/delete-measurement-record`,
                                                {
                                                  data: {
                                                    moNo: selectedMono,
                                                    referenceNo:
                                                      point.referenceNo
                                                  },
                                                  withCredentials: true,
                                                  headers: {
                                                    "Content-Type":
                                                      "application/json"
                                                  }
                                                }
                                              );
                                              // Refresh all data
                                              await Promise.all([
                                                fetchSummaryData(),
                                                fetchMeasurementSummary(),
                                                fetchMeasurementDetails()
                                              ]);
                                            } catch (error) {
                                              console.error(
                                                "Error deleting measurement record:",
                                                error.response?.data ||
                                                  error.message
                                              );
                                              Modal.error({
                                                title: "Deletion Failed",
                                                content:
                                                  error.response?.data?.error ||
                                                  error.message
                                              });
                                            }
                                          }
                                        })
                                      }
                                      className="mt-1 px-2 py-1 bg-red-500 text-white rounded-md border-2 border-red-800 hover:bg-red-600 text-sm"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              ) : null}
                              {pointIndex === 0 ? (
                                <td
                                  rowSpan={points.length}
                                  className="p-2 border align-middle"
                                >
                                  <div className="flex flex-col items-center">
                                    <span>{garmentNo}</span>
                                    <span>(Ref: "{point.referenceNo}")</span>
                                    <span className="flex items-center">
                                      <FaClock className="mr-1 text-sm" />
                                      {new Date(
                                        record.created_at
                                      ).toLocaleTimeString("en-US", {
                                        hour12: false,
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit"
                                      })}
                                    </span>
                                    <span
                                      className={`mt-1 px-2 py-1 rounded-md border-2 text-sm font-semibold ${
                                        points.every((p) => p.status === "Pass")
                                          ? "bg-green-100 text-green-800 border-green-800"
                                          : "bg-red-100 text-red-800 border-red-800"
                                      }`}
                                    >
                                      {points.every((p) => p.status === "Pass")
                                        ? "Pass"
                                        : "Fail"}
                                    </span>
                                  </div>
                                </td>
                              ) : null}
                              {pointIndex === 0 ? (
                                <td
                                  rowSpan={points.length}
                                  className="p-2 border align-middle"
                                >
                                  {size}
                                </td>
                              ) : null}
                              <td className="p-2 border text-left">
                                {point.measurementPoint}
                              </td>
                              <td className="p-2 border">
                                {decimalToFraction(point.buyerSpec)}
                              </td>
                              <td className="p-2 border">
                                {decimalToFraction(point.tolMinus)}
                              </td>
                              <td className="p-2 border">
                                {decimalToFraction(point.tolPlus)}
                              </td>
                              <td className="p-2 border">
                                <div className="flex items-center justify-center space-x-2">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      value={editValue}
                                      onChange={(e) =>
                                        setEditValue(e.target.value)
                                      }
                                      className="w-20 p-1 border rounded text-center"
                                      autoFocus
                                    />
                                  ) : (
                                    <span>{point.measureValue.toFixed(3)}</span>
                                  )}
                                  <button
                                    onClick={() =>
                                      isEditing
                                        ? handleSaveClick(
                                            selectedMono,
                                            point.referenceNo,
                                            point.actualIndex,
                                            garmentIndex,
                                            pointIndex
                                          )
                                        : handleEditClick(
                                            garmentIndex,
                                            pointIndex,
                                            point.measureValue
                                          )
                                    }
                                    className={`px-2 py-1 rounded text-sm ${
                                      isEditing
                                        ? "bg-green-500 text-white hover:bg-green-600"
                                        : "bg-blue-500 text-white hover:bg-blue-600"
                                    }`}
                                  >
                                    {isEditing ? "Save" : "Edit"}
                                  </button>
                                </div>
                              </td>
                              <td className={`p-2 border ${diffBgColor}`}>
                                {point.diff.toFixed(3)}
                              </td>
                              <td
                                className={`p-2 border ${
                                  point.status === "Pass"
                                    ? "bg-green-100"
                                    : "bg-red-100"
                                }`}
                              >
                                {point.status}
                              </td>
                            </tr>
                          );
                        });
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="9"
                          className="p-4 text-center text-gray-500"
                        >
                          No garments inspected for this MO No
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 mb-6">
              Select a MO No to display in detail inspection summary
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalMeasurementCPK;
