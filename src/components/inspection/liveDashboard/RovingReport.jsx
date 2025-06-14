import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { PDFDownloadLink,  Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import RovingReportPDFA3 from "./RovingReportPDFA3";
import RovingReportPDFA4 from "./RovingReportPDFA4";
import { Eye } from "lucide-react";
import RovingReportFilterPane from "./RovingReportFilterPane";
import RovingReportDetailView from "./RovingReportDetailView";
import { determineBuyerRoving } from "../../../utils/fractionUtils.js";

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
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [moNos, setMoNos] = useState([]);
  const [buyers, setBuyers] = useState([]); 
  const [operations, setOperations] = useState([]); 
  const [qcIds, setQcIds] = useState([]);
  const [lineNos, setLineNos] = useState([]); // Make lineNos stateful
  const [lastUpdated, setLastUpdated] = useState(null);
  const RECORDS_PER_PAGE = 20;

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
    fetchReportData(); // Initial fetch

    // Set up polling every 10 seconds
    const intervalId = setInterval(() => {
      fetchReportData();
    }, 10000); // 10 seconds interval

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [startDate, endDate, lineNo, moNo, qcId, buyer, operation]); 
  // The dependency array ensures data is re-fetched whenever filters change.

  // Process fetched reportData and extract dropdown options
  useEffect(() => {
    const applyFilters = () => {
      // Extract unique values for dropdowns from the fetched data
      const uniqueLineNos = new Set();
      const uniqueMoNos = new Set();
      const uniqueBuyers = new Set();
      const uniqueQcIds = new Set();
      const uniqueTgNos = new Set(); // For the Operation filter

      reportData.forEach(report => {
        if (report.line_no) uniqueLineNos.add(report.line_no);
        if (report.mo_no) uniqueMoNos.add(report.mo_no);
        //  console.log("Inspecting report for buyer_name:", report.buyer_name, "Full report object:", report);
        // Assuming buyer_name is at the root level
        const derivedBuyer = determineBuyerRoving(report.mo_no);
        if (derivedBuyer) uniqueBuyers.add(derivedBuyer);

        if (report.inspection_rep && Array.isArray(report.inspection_rep)) {
          report.inspection_rep.forEach(repEntry => {
            if (repEntry.emp_id) uniqueQcIds.add(repEntry.emp_id);
            if (repEntry.inlineData && Array.isArray(repEntry.inlineData)) {
              repEntry.inlineData.forEach(item => {
                if (item.tg_no) uniqueTgNos.add(item.tg_no); // Extract TG No.
              });
            }
          });
        }
      });

      const processedData = reportData.map(report => {
        const inspectionRepCount = (report.inspection_rep && Array.isArray(report.inspection_rep))
          ? report.inspection_rep.length
          : 0;
        return {
          ...report,
          inspectionRepCount,
          uniqueKey: `report-${report._id?.$oid || report.inline_roving_id || (typeof report._id === 'string' ? report._id : JSON.stringify(report._id))}`,
        };
      });

      // Update dropdown states with extracted unique values
      setLineNos(Array.from(uniqueLineNos).sort());
      setMoNos(Array.from(uniqueMoNos).sort());
      setBuyers(Array.from(uniqueBuyers).sort());
      setQcIds(Array.from(uniqueQcIds).sort());
      setOperations(Array.from(uniqueTgNos).sort()); // Set TG Nos for Operations
      const groupedData = processedData; 
      setFilteredData(groupedData); 

      const newTotalPages = Math.ceil(groupedData.length / RECORDS_PER_PAGE);
      if (currentPage >= newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages - 1);
      } else if (newTotalPages === 0 && currentPage !== 0) {
        setCurrentPage(0);
      } else if (currentPage < 0 && newTotalPages > 0) { 
        setCurrentPage(0);
      }
    };

    applyFilters();
  }, [reportData]); // This effect runs whenever reportData changes

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

    const dataToProcess = [];
    if (group && Array.isArray(group.inspection_rep)) { 
      group.inspection_rep.forEach(repEntry => {
        if (repEntry && Array.isArray(repEntry.inlineData)) {
          dataToProcess.push(...repEntry.inlineData);
        }
      });
    } else if (group && Array.isArray(group.inlineData)) { 
      dataToProcess.push(...group.inlineData);
    } else {
      return { totalCheckedQty: 0, totalDefectsQty: 0, totalRejectGarmentCount: 0, defectRate: "0.00", defectRatio: "0.00", passRate: "0.00", totalSpiPass: 0, totalSpiReject: 0, totalMeasurementPass: 0, totalMeasurementReject: 0 };
    }

    dataToProcess.forEach((entry) => {
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
    const defectRate = totalCheckedQty > 0 ? (totalDefectsQty / totalCheckedQty) * 100 : 0;
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
  const totalPages = Math.ceil(filteredData.length / RECORDS_PER_PAGE);
  // Ensure validCurrentPage is 0 if totalPages is 0, otherwise between 0 and totalPages - 1
  const validCurrentPage = Math.max(0, Math.min(currentPage, totalPages > 0 ? totalPages - 1 : 0));

  const startIndex = validCurrentPage * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const currentRecordsOnPage = filteredData.slice(startIndex, endIndex);

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

   const handleToggleDetailView = (rowKey) => {
    setExpandedRowKey(prevKey => (prevKey === rowKey ? null : rowKey));
  };

  const closeDetailView = () => {
    setExpandedRowKey(null);
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
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 bg-gradient-to-r from-blue-100 to-blue-100 text-gray py-4 rounded-t-lg">
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
                    Inspection Count
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
                {currentRecordsOnPage.map((record) => {
                  if (expandedRowKey && record.uniqueKey !== expandedRowKey) {
                    return null; // Hide other rows when one is expanded
                  }
                  const metrics = calculateGroupMetrics(record);
                  return (
                    <React.Fragment key={record.uniqueKey}>
                      <tr className="hover:bg-blue-100">
                        <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                          {record.inspection_date}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                          {record.line_no}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                          {record.mo_no}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                          {record.inspectionRepCount}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 text-center">
                          {metrics.totalCheckedQty || 0}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 text-center">
                          {metrics.totalRejectGarmentCount || 0}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 text-center">
                          {metrics.totalDefectsQty || 0}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm text-gray-700 border border-gray-200 text-center ${getBackgroundColor(
                            metrics.defectRate,
                            "defectRate"
                          )}`}
                        >
                          {metrics.defectRate || 0}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm text-gray-700 border border-gray-200 text-center ${getBackgroundColor(
                            metrics.defectRatio,
                            "defectRatio"
                          )}`}
                        >
                          {metrics.defectRatio || 0}
                        </td>
                        <td className="px-4 py-2 text-sm text-green-700 border border-gray-200 bg-green-50 text-center">
                          {metrics.totalSpiPass || 0}
                        </td>
                        <td className="px-4 py-2 text-sm text-red-700 border border-gray-200 bg-red-50 text-center">
                          {metrics.totalSpiReject || 0}
                        </td>
                        <td className="px-4 py-2 text-sm text-green-700 border border-gray-200 bg-green-50 text-center">
                          {metrics.totalMeasurementPass || 0}
                        </td>
                        <td className="px-4 py-2 text-sm text-red-700 border border-gray-200 bg-red-50 text-center">
                          {metrics.totalMeasurementReject || 0}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 text-center  border border-gray-200">
                          <button
                            onClick={() => handleToggleDetailView(record.uniqueKey)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                      {expandedRowKey === record.uniqueKey && (
                        <tr>
                          <RovingReportDetailView
                            reportDetail={record}
                            onClose={closeDetailView}
                            calculateGroupMetrics={calculateGroupMetrics} 
                            filters={{
                              startDate: formatDate(startDate), // Pass formatted dates
                              endDate: endDate ? formatDate(endDate) : null,
                              lineNo,
                              moNo,
                              buyer,
                              operation,
                              qcId,
                            }}
                          />
                        </tr>
                      )}
                    </React.Fragment>
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
             Page {totalPages > 0 ? validCurrentPage + 1 : 0} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
               disabled={currentPage >= totalPages - 1 || totalPages === 0}
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
