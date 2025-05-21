import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { PDFDownloadLink } from "@react-pdf/renderer";
import RovingReportPDFA3 from "./RovingReportPDFA3";
import RovingReportPDFA4 from "./RovingReportPDFA4";
import { FileText } from "lucide-react";
import RovingReportFilterPane from "./RovingReportFilterPane";

const RovingReport = () => {
  // Filter states
  const [startDate, setStartDate] = useState(new Date()); // Default to today
  const [endDate, setEndDate] = useState(null);
  const [lineNo, setLineNo] = useState("");
  const [moNo, setMoNo] = useState("");
  const [buyer, setBuyer] = useState(""); 
  const [operation, setOperation] = useState(""); 
  const [qcId, setQcId] = useState("");
  const [paperSize, setPaperSize] = useState("A3"); // Default to A3
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [moNos, setMoNos] = useState([]);
  const [buyers, setBuyers] = useState([]); 
  const [operations, setOperations] = useState([]); 
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
     const [moResponse, qcResponse, buyerResponse, operationResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/qc-inline-roving-mo-nos`),
       axios.get(`${API_BASE_URL}/api/qc-inline-roving-qc-ids`),
        axios.get(`${API_BASE_URL}/api/qc-inline-roving-buyers`), 
        axios.get(`${API_BASE_URL}/api/qc-inline-roving-operations`) 
      ]);
      setMoNos(moResponse.data);
      setQcIds(qcResponse.data);
      setBuyers(buyerResponse.data || []); 
      setOperations(operationResponse.data || []);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      setBuyers([]); 
      setOperations([]);
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
      if (buyer) params.buyer_name = buyer; 
      if (operation) params.operation_name = operation;
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
  }, [startDate, endDate, lineNo, moNo, qcId, buyer, operation]); 

  // Apply filters and group data
  useEffect(() => {
    const applyFilters = () => {
      // Group by inspection_date, line_no, mo_no, and emp_id
      const grouped = reportData.reduce((acc, record) => {
        const key = `${record.inspection_date}-${record.line_no}-${record.mo_no}-${record.emp_id}`;
        if (!acc[key]) {
          acc[key] = { ...record, inlineData: [] };
        }
        if (Array.isArray(record.inlineData)) {
          acc[key].inlineData.push(...record.inlineData);
        }
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
    let totalSpiPass = 0;
    let totalSpiReject = 0;
    let totalMeasurementPass = 0;
    let totalMeasurementReject = 0;

    group.inlineData.forEach((entry) => {
      const metrics = calculateMetrics(entry);
      totalCheckedQty += entry.checked_quantity || 0;
      totalDefectsQty += metrics.totalDefectsQty;
      totalRejectGarmentCount += metrics.rejectGarmentCount;
      if (entry.spi === "Pass") totalSpiPass++;
      if (entry.spi === "Reject") totalSpiReject++;
      if (entry.measurement === "Pass") totalMeasurementPass++;
      if (entry.measurement === "Reject") totalMeasurementReject++;
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
      passRate: passRate.toFixed(2),
      totalSpiPass,
      totalSpiReject,
      totalMeasurementPass,
      totalMeasurementReject,
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
    setBuyer("");
    setOperation("");
    setQcId("");
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
       <RovingReportFilterPane
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        lineNo={lineNo}
        setLineNo={setLineNo}
        lineNos={lineNos}
        buyer={buyer}
        setBuyer={setBuyer}
        buyers={buyers}
        operation={operation}
        setOperation={setOperation}
        operations={operations}
        qcId={qcId}
        setQcId={setQcId}
        qcIds={qcIds}
        moNo={moNo}
        setMoNo={setMoNo}
        moNos={moNos}
        onClearFilters={handleClearFilters}
        lastUpdated={lastUpdated}
        formatTimestamp={formatTimestamp}
      />

      {/* PDF Download Options - Kept separate from the filter pane */}
      {/* <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-end space-x-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Report Paper Size
          </label>
          <select
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="A3">A3</option>
            <option value="A4">A4</option>
          </select>
        </div>
        <div>
         
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
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm shadow-sm"
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
            
          </div>
        </div>
      </div> */}

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
                  <th rowSpan="2" className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 align-middle">
                    Inspection Date
                  </th>
                  <th rowSpan="2" className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 align-middle">
                    Line No
                  </th>
                  <th rowSpan="2" className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 align-middle">
                    MO No
                  </th>
                  <th rowSpan="2" className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 align-middle">
                    Inspection Rep Name
                  </th>
                  <th rowSpan="2" className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 align-middle">
                    Checked Qty
                  </th>
                  <th rowSpan="2" className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 align-middle">
                    Reject Garment
                  </th>
                  <th rowSpan="2" className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 align-middle">
                    Defect Qty
                  </th>
                  <th rowSpan="2" className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 align-middle">
                    Defect Rate (%)
                  </th>
                  <th rowSpan="2" className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 align-middle">
                    Defect Ratio (%)
                  </th>
                  <th colSpan="2" className="px-4 py-2 text-center text-sm font-medium text-gray-700 border-b border-r border-gray-200">
                    Total SPI
                  </th>
                  <th colSpan="2" className="px-4 py-2 text-center text-sm font-medium text-gray-700 border-b border-r border-gray-200">
                    Measurement
                  </th>
                  <th rowSpan="2" className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200 align-middle">
                    View
                  </th>
                </tr>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 border-b border-r border-gray-200">Pass</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 border-b border-r border-gray-200">Reject</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 border-b border-r border-gray-200">Pass</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 border-b border-gray-200">Reject</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                    {currentRecord?.inspection_date}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                    {currentRecord?.line_no}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                    {currentRecord?.mo_no}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                    {currentRecord?.eng_name} {/* Inspection Rep Name */}
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
                  <td className="px-4 py-2 text-sm text-green-700 border-r border-gray-200 bg-green-50">
                    {currentGroupMetrics.totalSpiPass || 0}
                  </td>
                  <td className="px-4 py-2 text-sm text-red-700 border-r border-gray-200 bg-red-50">
                    {currentGroupMetrics.totalSpiReject || 0}
                  </td>
                  <td className="px-4 py-2 text-sm text-green-700 border-r border-gray-200 bg-green-50">
                    {currentGroupMetrics.totalMeasurementPass || 0}
                  </td>
                  <td className="px-4 py-2 text-sm text-red-700 border-r border-gray-200 bg-red-50">
                    {currentGroupMetrics.totalMeasurementReject || 0}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {/* Placeholder for View - functionality to be defined */}
                  </td>
                </tr>
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
