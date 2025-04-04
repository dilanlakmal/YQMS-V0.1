import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { PDFDownloadLink } from "@react-pdf/renderer";
import RovingReportPDFA3 from "./RovingReportPDFA3";
import RovingReportPDFA4 from "./RovingReportPDFA4";
import { FileText } from "lucide-react";

const RovingReport = () => {
  // Filter states
  const [startDate, setStartDate] = useState(new Date()); // Default to today
  const [endDate, setEndDate] = useState(null);
  const [lineNo, setLineNo] = useState("");
  const [moNo, setMoNo] = useState("");
  const [qcId, setQcId] = useState("");
  const [paperSize, setPaperSize] = useState("A3"); // Default to A3
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [moNos, setMoNos] = useState([]);
  const [qcIds, setQcIds] = useState([]);
  const [lineNos] = useState(
    Array.from({ length: 30 }, (_, i) => (i + 1).toString())
  );
  const [lastUpdated, setLastUpdated] = useState(null); // State for last updated timestamp

  // Format date to "MM/DD/YYYY"
  const formatDate = (date) => {
    if (!date) return "";
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Format timestamp to "MM/DD/YYYY HH:MM:SS"
  const formatTimestamp = (date) => {
    if (!date) return "Never";
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear();
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    const seconds = ("0" + date.getSeconds()).slice(-2);
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const [moResponse, qcResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/qc-inline-roving-mo-nos`),
        axios.get(`${API_BASE_URL}/api/qc-inline-roving-qc-ids`)
      ]);
      setMoNos(moResponse.data);
      setQcIds(qcResponse.data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  // Fetch report data
  const fetchReportData = async () => {
    try {
      const params = {};
      if (startDate) params.startDate = formatDate(startDate);
      if (endDate) params.endDate = formatDate(endDate);
      if (lineNo) params.line_no = lineNo;
      if (moNo) params.mo_no = moNo;
      if (qcId) params.emp_id = qcId;

      const response = await axios.get(
        `${API_BASE_URL}/api/qc-inline-roving-reports-filtered`,
        {
          params
        }
      );
      setReportData(response.data);
      setLastUpdated(new Date()); // Update the last updated timestamp
    } catch (error) {
      console.error("Error fetching roving report data:", error);
      setReportData([]);
      setLastUpdated(new Date()); // Update timestamp even on error
    }
  };

  // Initial data fetch and set up polling
  useEffect(() => {
    fetchDropdownData();
    fetchReportData(); // Initial fetch

    // Set up polling every 10 seconds
    const intervalId = setInterval(() => {
      fetchReportData();
    }, 10000); // 10 seconds interval

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [startDate, endDate, lineNo, moNo, qcId]); // Dependencies to refetch when filters change

  // Apply filters and group data
  useEffect(() => {
    const applyFilters = () => {
      // Group by inspection_date, line_no, mo_no, and emp_id
      const grouped = reportData.reduce((acc, record) => {
        const key = `${record.inspection_date}-${record.line_no}-${record.mo_no}-${record.emp_id}`;
        if (!acc[key]) {
          acc[key] = { ...record, inlineData: [] };
        }
        acc[key].inlineData.push(...record.inlineData);
        return acc;
      }, {});

      const groupedData = Object.values(grouped);
      setFilteredData(groupedData);

      // Adjust currentPage to stay within bounds
      if (currentPage >= groupedData.length && groupedData.length > 0) {
        setCurrentPage(groupedData.length - 1);
      } else if (groupedData.length === 0) {
        setCurrentPage(0);
      }
    };

    applyFilters();
  }, [reportData, currentPage]); // Recalculate when reportData changes

  const calculateMetrics = (inlineEntry) => {
    const checkedQty = inlineEntry?.checked_quantity || 0;
    const rejectGarments = Array.isArray(inlineEntry?.rejectGarments)
      ? inlineEntry.rejectGarments
      : [];

    // Calculate totalDefectsQty (sum of defect counts)
    const totalDefectsQty = rejectGarments.reduce(
      (sum, garment) => sum + (garment?.totalCount || 0),
      0
    );

    // Calculate rejectGarmentCount based on garments array
    let rejectGarmentCount = 0;
    rejectGarments.forEach((garment) => {
      if (Array.isArray(garment?.garments) && garment.garments.length > 0) {
        rejectGarmentCount += garment.garments.length; // Count objects in garments array
      }
    });

    const goodOutput = checkedQty - rejectGarmentCount;
    const defectRate =
      checkedQty > 0 ? (totalDefectsQty / checkedQty) * 100 : 0;
    const defectRatio =
      checkedQty > 0 ? (rejectGarmentCount / checkedQty) * 100 : 0;
    const passRate = checkedQty > 0 ? (goodOutput / checkedQty) * 100 : 0;

    const defectDetails = rejectGarments
      .flatMap((garment) =>
        Array.isArray(garment?.garments)
          ? garment.garments.flatMap((g) =>
              Array.isArray(g?.defects)
                ? g.defects.map((defect) => ({
                    name: defect?.name || "Unknown",
                    count: defect?.count || 0
                  }))
                : []
            )
          : []
      )
      .reduce((acc, defect) => {
        if (!defect || !defect.name) return acc; // Skip invalid defects
        const existing = acc.find((d) => d.name === defect.name);
        if (existing) {
          existing.count += defect.count;
        } else {
          acc.push({ name: defect.name, count: defect.count });
        }
        return acc;
      }, []);

    return {
      defectRate: defectRate.toFixed(2),
      defectRatio: defectRatio.toFixed(2),
      passRate: passRate.toFixed(2),
      totalDefectsQty,
      rejectGarmentCount,
      defectDetails
    };
  };

  const calculateGroupMetrics = (group) => {
    let totalCheckedQty = 0;
    let totalDefectsQty = 0;
    let totalRejectGarmentCount = 0;

    group.inlineData.forEach((entry) => {
      const metrics = calculateMetrics(entry);
      totalCheckedQty += entry.checked_quantity || 0;
      totalDefectsQty += metrics.totalDefectsQty;
      totalRejectGarmentCount += metrics.rejectGarmentCount;
    });

    const goodOutput = totalCheckedQty - totalRejectGarmentCount;
    const defectRate =
      totalCheckedQty > 0 ? (totalDefectsQty / totalCheckedQty) * 100 : 0;
    const defectRatio =
      totalCheckedQty > 0
        ? (totalRejectGarmentCount / totalCheckedQty) * 100
        : 0;
    const passRate =
      totalCheckedQty > 0 ? (goodOutput / totalCheckedQty) * 100 : 0;

    return {
      totalCheckedQty,
      totalDefectsQty,
      totalRejectGarmentCount,
      defectRate: defectRate.toFixed(2),
      defectRatio: defectRatio.toFixed(2),
      passRate: passRate.toFixed(2)
    };
  };

  // Pagination
  const totalPages = filteredData.length;
  const currentRecord = filteredData[currentPage];
  const currentGroupMetrics = currentRecord
    ? calculateGroupMetrics(currentRecord)
    : {};

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setStartDate(new Date()); // Reset to today
    setEndDate(null);
    setLineNo("");
    setMoNo("");
    setQcId("");
    setPaperSize("A3"); // Reset to default A3
  };

  // Helper function to get background color based on value and type
  const getBackgroundColor = (value, type) => {
    const numValue = parseFloat(value);
    if (type === "passRate") {
      if (numValue > 80) return "bg-green-100";
      if (numValue >= 50 && numValue <= 80) return "bg-orange-100";
      return "bg-red-100";
    } else {
      // For defectRate and defectRatio
      if (numValue > 10) return "bg-red-100";
      if (numValue >= 5 && numValue <= 10) return "bg-orange-100";
      return "bg-green-100";
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* Filter Panel */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-sm font-semibold mb-4">
          Filter Roving Reports -- Last Updated at{" "}
          {lastUpdated && `(${formatTimestamp(lastUpdated)})`}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              dateFormat="MM/dd/yyyy"
              placeholderText="Select Start Date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              dateFormat="MM/dd/yyyy"
              placeholderText="Select End Date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Line No
            </label>
            <select
              value={lineNo}
              onChange={(e) => setLineNo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Line No</option>
              {lineNos.map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MO No
            </label>
            <select
              value={moNo}
              onChange={(e) => setMoNo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select MO No</option>
              {moNos.map((mo) => (
                <option key={mo} value={mo}>
                  {mo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              QC ID
            </label>
            <select
              value={qcId}
              onChange={(e) => setQcId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select QC ID</option>
              {qcIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paper Size
            </label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="A3">A3</option>
              <option value="A4">A4</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <PDFDownloadLink
              document={
                paperSize === "A3" ? (
                  <RovingReportPDFA3 data={filteredData} />
                ) : (
                  <RovingReportPDFA4 data={filteredData} />
                )
              }
              fileName={`QC_Inline_Roving_Report_${paperSize}.pdf`}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {({ loading }) =>
                loading ? (
                  "Generating PDF..."
                ) : (
                  <>
                    <FileText size={16} className="mr-2" /> Download PDF
                  </>
                )
              }
            </PDFDownloadLink>
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {filteredData.length === 0 ? (
        <div className="text-center text-gray-700">
          <h2 className="text-xl font-medium">
            No data available for the selected filters.
          </h2>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 bg-gradient-to-r from-blue-500 to-blue-700 text-white py-4 rounded-t-lg">
            QC Inline Roving - Summary Report
          </h1>

          {/* Summary Table */}
          <div className="overflow-x-auto">
            <table className="w-full mb-6 border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Inspection Date
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    QC ID
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    QC Name
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Line No
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    MO No
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Checked Qty
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Reject Part
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Defect Qty
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Defect Rate (%)
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Defect Ratio (%)
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Pass Rate (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                    {currentRecord?.inspection_date}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                    {currentRecord?.emp_id}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                    {currentRecord?.eng_name}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                    {currentRecord?.line_no}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                    {currentRecord?.mo_no}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                    {currentGroupMetrics.totalCheckedQty || 0}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                    {currentGroupMetrics.totalRejectGarmentCount || 0}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                    {currentGroupMetrics.totalDefectsQty || 0}
                  </td>
                  <td
                    className={`px-4 py-2 text-sm text-gray-700 border-r border-gray-200 ${getBackgroundColor(
                      currentGroupMetrics.defectRate,
                      "defectRate"
                    )}`}
                  >
                    {currentGroupMetrics.defectRate || 0}
                  </td>
                  <td
                    className={`px-4 py-2 text-sm text-gray-700 border-r border-gray-200 ${getBackgroundColor(
                      currentGroupMetrics.defectRatio,
                      "defectRatio"
                    )}`}
                  >
                    {currentGroupMetrics.defectRatio || 0}
                  </td>
                  <td
                    className={`px-4 py-2 text-sm text-gray-700 border-r border-gray-200 ${getBackgroundColor(
                      currentGroupMetrics.passRate,
                      "passRate"
                    )}`}
                  >
                    {currentGroupMetrics.passRate || 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Inspection Data Subtitle */}
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Inspection Data
          </h2>

          {/* Inspection Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Operator ID
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Operator Name
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Operation Name
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Machine Code
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Inspection Type
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    SPI Status
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Measurement Status
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Quality Status
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Inspection Time
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Checked Qty
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Defects Qty
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Defect Rate (%)
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Defect Ratio (%)
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                    Pass Rate (%)
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200 w-64">
                    Defect Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentRecord?.inlineData.map((entry, index) => {
                  const metrics = calculateMetrics(entry);
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                        {entry.operator_emp_id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                        {entry.operator_eng_name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                        {entry.operation_kh_name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                        {entry.ma_code}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                        {entry.type}
                      </td>
                      <td
                        className={`px-4 py-2 text-sm text-gray-700 border-r border-gray-200 ${
                          entry.spi === "Reject" ? "bg-red-100" : "bg-green-100"
                        }`}
                      >
                        {entry.spi}
                      </td>
                      <td
                        className={`px-4 py-2 text-sm text-gray-700 border-r border-gray-200 ${
                          entry.measurement === "Reject"
                            ? "bg-red-100"
                            : "bg-green-100"
                        }`}
                      >
                        {entry.measurement}
                      </td>
                      <td
                        className={`px-4 py-2 text-sm text-gray-700 border-r border-gray-200 ${
                          entry.qualityStatus === "Reject"
                            ? "bg-red-100"
                            : "bg-green-100"
                        }`}
                      >
                        {entry.qualityStatus}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                        {entry.inspection_time}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                        {entry.checked_quantity}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                        {metrics.totalDefectsQty}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                        {metrics.defectRate}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                        {metrics.defectRatio}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                        {metrics.passRate}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200 w-64">
                        {metrics.defectDetails.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {metrics.defectDetails.map((defect, idx) => (
                              <li key={idx}>
                                {defect.name}: {defect.count}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "No Defects"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className={`px-4 py-2 rounded-md ${
                currentPage === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className={`px-4 py-2 rounded-md ${
                currentPage === totalPages - 1
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RovingReport;
