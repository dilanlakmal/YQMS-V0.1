import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useTranslation } from "react-i18next";
import ReactPaginate from "react-paginate";
import CuttingReportFilterPane from "../cutting/CuttingReportFilterPane";
import CuttingReportOrderDetails from "../cutting/CuttingReportOrderDetails";
import CuttingReportSummaryCard from "../cutting/CuttingReportSummaryCard";
import CuttingReportMeasurementTable from "../cutting/CuttingReportMeasurementTable";
import CuttingReportDefects from "../cutting/CuttingReportDefects";
import { measurementPoints } from "../../../constants/cuttingmeasurement";

const CuttingReport = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    startDate: new Date(), // Default to today
    endDate: null,
    moNo: "",
    lotNo: "",
    buyer: "",
    color: "",
    tableNo: ""
  });
  const [reportData, setReportData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch report data when filters or page changes
  useEffect(() => {
    fetchReportData();
  }, [filters, currentPage]);

  const fetchReportData = async () => {
    try {
      const params = {
        startDate: filters.startDate ? formatDate(filters.startDate) : "",
        endDate: filters.endDate ? formatDate(filters.endDate) : "",
        moNo: filters.moNo,
        lotNo: filters.lotNo,
        buyer: filters.buyer,
        color: filters.color,
        tableNo: filters.tableNo,
        page: currentPage,
        limit: 1 // One combination per page
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/cutting-inspection-detailed-report`,
        { params }
      );
      setReportData(response.data.data);
      setTotalPages(response.data.totalPages);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching cutting report data:", error);
      setReportData([]);
      setTotalPages(0);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`; // e.g., "04/05/2025"
  };

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  // Function to get panelIndexName based on garmentType and panelIndex
  const getPanelIndexName = (garmentType, panelIndex) => {
    if (!garmentType || !panelIndex) return `Panel Index: ${panelIndex}`;

    // Find matching measurement points for the garmentType (case-insensitive)
    const matchingPoints = measurementPoints.find(
      (point) => point.panel.toLowerCase() === garmentType.toLowerCase()
    );

    if (!matchingPoints) return `Panel Index: ${panelIndex}`;

    // Find the first matching panelIndex and get its panelIndexName
    const matchingPoint = measurementPoints.find(
      (point) =>
        point.panel.toLowerCase() === garmentType.toLowerCase() &&
        point.panelIndex === panelIndex
    );

    return matchingPoint
      ? matchingPoint.panelIndexName
      : `Panel Index: ${panelIndex}`;
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 bg-gradient-to-r from-blue-500 to-blue-700 text-white py-4 rounded-t-lg">
          {t("cuttingReport.title")}
        </h1>

        {/* Filter Pane */}
        <CuttingReportFilterPane
          filters={filters}
          setFilters={setFilters}
          setCurrentPage={setCurrentPage}
          lastUpdated={lastUpdated}
        />

        {/* Paginated Report */}
        {reportData.length > 0 ? (
          reportData.map((data, index) => (
            <div key={index} className="mb-8">
              {/* Order Details, Inspection Details, Marker Data */}
              <div className="mb-4">
                <CuttingReportOrderDetails data={data} />
              </div>

              {/* Combined Section: Summary, Inspected Sample Details, Measurement Tables, Defects */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                {/* Summary Data */}
                <CuttingReportSummaryCard summary={data.summary} />

                {/* Inspected Sample Details */}
                {data.inspectionData.map((sizeData, idx) => (
                  <div key={idx} className="mt-6">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold mb-2">
                        Inspected Sample Details - Size: {sizeData.size}
                      </h3>
                      {/* 6-Column Table for Inspected Sample Details */}
                      <table className="w-full border border-gray-900 rounded-lg shadow-md">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border border-gray-900">
                              Serial Letter
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border border-gray-900">
                              Total Pcs
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border border-gray-900">
                              Total Pass
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border border-gray-900">
                              Total Reject
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border border-gray-900">
                              Measurement Issues
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border border-gray-900">
                              Physical Defects
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-2 text-sm text-gray-900 border border-gray-900">
                              {sizeData.serialLetter}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 border border-gray-900">
                              {sizeData.totalPcs}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 border border-gray-900">
                              {sizeData.totalPass}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 border border-gray-900">
                              {sizeData.totalReject}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 border border-gray-900">
                              {sizeData.totalRejectMeasurement}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 border border-gray-900">
                              {sizeData.totalRejectDefects}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Panel Index Tables */}
                    {sizeData.pcsLocation
                      .reduce((acc, loc) => {
                        loc.measurementData.forEach((panel) => {
                          const existing = acc.find(
                            (p) => p.panelIndex === panel.panelIndex
                          );
                          if (!existing) {
                            acc.push({
                              panelIndex: panel.panelIndex,
                              measurementData: [],
                              defectData: []
                            });
                          }
                          const panelEntry = acc.find(
                            (p) => p.panelIndex === panel.panelIndex
                          );
                          panelEntry.measurementData.push({
                            location: loc.location,
                            ...panel
                          });
                          if (panel.defectData.length > 0) {
                            panelEntry.defectData.push(...panel.defectData);
                          }
                        });
                        return acc;
                      }, [])
                      .map((panel, panelIdx) => (
                        <div key={panelIdx} className="mb-4">
                          <h4 className="text-md font-medium mb-2">
                            {getPanelIndexName(
                              data.garmentType,
                              panel.panelIndex
                            )}
                          </h4>
                          {/* Measurement Table */}
                          <CuttingReportMeasurementTable panel={panel} />
                          {/* Defects */}
                          <CuttingReportDefects defectData={panel.defectData} />
                        </div>
                      ))}
                    {idx < data.inspectionData.length - 1 && (
                      <hr className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">
            No data available for the selected filters.
          </p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <ReactPaginate
            previousLabel={"Previous"}
            nextLabel={"Next"}
            breakLabel={"..."}
            pageCount={totalPages}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageClick}
            containerClassName={"flex justify-center space-x-2 mt-4"}
            pageClassName={
              "px-3 py-1 bg-white border border-gray-300 rounded-md cursor-pointer"
            }
            activeClassName={"bg-blue-900 text-white"}
            previousClassName={
              "px-3 py-1 bg-white border border-gray-300 rounded-md cursor-pointer"
            }
            nextClassName={
              "px-3 py-1 bg-white border border-gray-300 rounded-md cursor-pointer"
            }
            breakClassName={"px-3 py-1"}
          />
        )}
      </div>
    </div>
  );
};

export default CuttingReport;
