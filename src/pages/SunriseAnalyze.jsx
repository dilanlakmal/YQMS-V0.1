import React, { useState } from "react";
import { FaTimes, FaBars } from "react-icons/fa";
import SunriseNavigationPanel from "../components/inspection/sunrise/SunriseNavigationPanel";
import SunriseDownloadExcel from "../components/inspection/sunrise/SunriseDownloadExcel";
import SunriseDownloadPDF from "../components/inspection/sunrise/SunriseDownloadPDF";
import SunriseSummaryTable from "../components/inspection/sunrise/SunriseSummaryTable";
import SunriseLineBarChart from "../components/inspection/sunrise/SunriseLineBarChart";
import SunriseTopN from "../components/inspection/sunrise/SunriseTopN";
import SunriseFilterPane from "../components/inspection/sunrise/SunriseFilterPane";
import SunriseSummaryCard from "../components/inspection/sunrise/SunriseSummaryCard"; // New import
import SunriseDailyDefectTrend from "../components/inspection/sunrise/SunriseDailyDefectTrend"; // New import
import FindBuyer from "../components/inspection/sunrise/FindBuyer";

const SunriseAnalyze = ({ rs18Data, outputData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("Daily Summary");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    workLine: "",
    moNo: "",
    colorName: "",
    sizeName: "",
    buyer: "",
    reworkName: "" // Added new filter for ReworkName
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [topN, setTopN] = useState(5);
  const rowsPerPage = 10;

  // Helper Functions
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [month, day, year] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const formatToInternalDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${month}-${day}-${year}`;
  };

  const formatToInputDate = (dateStr) => {
    if (!dateStr) return "";
    const [month, day, year] = dateStr.split("-");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  const getUniqueValuesInDateRange = (key) => {
    if (!outputData) return [];
    const startDate = filters.startDate ? parseDate(filters.startDate) : null;
    const endDate = filters.endDate ? parseDate(filters.endDate) : null;

    const filtered = outputData.filter((row) => {
      const rowDate = parseDate(row.InspectionDate);
      return (
        (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate)
      );
    });

    return [...new Set(filtered.map((row) => row[key]))].sort();
  };

  const getMergedData = () => {
    if (!rs18Data || !outputData) return [];

    const commonKeys = [
      "InspectionDate",
      "WorkLine",
      "MONo",
      "SizeName",
      "ColorNo",
      "ColorName"
    ];
    const mergedData = [];

    const outputMap = new Map();
    outputData.forEach((row) => {
      const key = commonKeys.map((k) => row[k]).join("|");
      outputMap.set(key, {
        TotalQtyT38: row.TotalQtyT38,
        TotalQtyT39: row.TotalQtyT39
      });
    });

    const defectMap = new Map();
    rs18Data.forEach((row) => {
      const key = commonKeys.map((k) => row[k]).join("|");
      if (!defectMap.has(key)) defectMap.set(key, []);
      defectMap
        .get(key)
        .push({ ReworkName: row.ReworkName, DefectsQty: row.DefectsQty });
    });

    const allKeys = new Set([...outputMap.keys(), ...defectMap.keys()]);
    allKeys.forEach((key) => {
      const [InspectionDate, WorkLine, MONo, SizeName, ColorNo, ColorName] =
        key.split("|");
      const output = outputMap.get(key) || { TotalQtyT38: 0, TotalQtyT39: 0 };
      const defects = defectMap.get(key) || [];

      // Modified line:
      const checkedQty =
        output.TotalQtyT38 === 0
          ? output.TotalQtyT39
          : output.TotalQtyT39 === 0
          ? output.TotalQtyT38
          : Math.round((output.TotalQtyT38 + output.TotalQtyT39) / 2);

      //const checkedQty = Math.max(output.TotalQtyT38, output.TotalQtyT39);
      const defectsQty = defects.reduce(
        (sum, defect) => sum + defect.DefectsQty,
        0
      );
      const defectRate = checkedQty === 0 ? 0 : (defectsQty / checkedQty) * 100;

      const defectsWithRate = defects.map((defect) => ({
        ...defect,
        DefectRate:
          checkedQty === 0 ? 0 : (defect.DefectsQty / checkedQty) * 100
      }));

      mergedData.push({
        InspectionDate,
        WorkLine,
        MONo,
        SizeName,
        ColorNo,
        ColorName,
        TotalQtyT38: output.TotalQtyT38,
        TotalQtyT39: output.TotalQtyT39,
        CheckedQty: checkedQty,
        DefectsQty: defectsQty,
        DefectRate: defectRate,
        DefectDetails: defectsWithRate,
        Buyer: FindBuyer({ moNo: MONo }) // Updated for consistency (optional)
      });
    });

    return mergedData.filter((row) => {
      const rowDate = parseDate(row.InspectionDate);
      const startDate = filters.startDate ? parseDate(filters.startDate) : null;
      const endDate = filters.endDate ? parseDate(filters.endDate) : null;

      // Check if the row has any DefectDetails matching the selected reworkName
      const matchesReworkName =
        !filters.reworkName ||
        row.DefectDetails.some(
          (defect) => defect.ReworkName === filters.reworkName
        );

      return (
        (!startDate || rowDate >= startDate) &&
        (!endDate || rowDate <= endDate) &&
        (!filters.workLine || row.WorkLine === filters.workLine) &&
        (!filters.moNo || row.MONo === filters.moNo) &&
        (!filters.colorName || row.ColorName === filters.colorName) &&
        (!filters.sizeName || row.SizeName === filters.sizeName) &&
        (!filters.buyer || row.Buyer === filters.buyer) &&
        matchesReworkName // Added filter for ReworkName
      );
    });
  };

  const filteredData = getMergedData();
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const totals = {
    TotalQtyT38: filteredData.reduce((sum, row) => sum + row.TotalQtyT38, 0),
    TotalQtyT39: filteredData.reduce((sum, row) => sum + row.TotalQtyT39, 0),
    CheckedQty: filteredData.reduce((sum, row) => sum + row.CheckedQty, 0),
    DefectsQty: filteredData.reduce((sum, row) => sum + row.DefectsQty, 0),
    DefectRate:
      filteredData.reduce((sum, row) => sum + row.CheckedQty, 0) === 0
        ? 0
        : (
            (filteredData.reduce((sum, row) => sum + row.DefectsQty, 0) /
              filteredData.reduce((sum, row) => sum + row.CheckedQty, 0)) *
            100
          ).toFixed(2)
  };

  const getDefectRateStyles = (rate) => {
    if (rate > 5) return { background: "#ffcccc", color: "#cc0000" };
    if (rate >= 3 && rate <= 5)
      return { background: "#ffebcc", color: "#e68a00" };
    return { background: "#ccffcc", color: "#006600" };
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]:
        name === "startDate" || name === "endDate"
          ? formatToInternalDate(value)
          : value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      workLine: "",
      moNo: "",
      colorName: "",
      sizeName: "",
      buyer: "",
      reworkName: "" // Added to clear the new filter
    });
    setCurrentPage(1);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-300"
      >
        Analyze
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-full h-full overflow-auto relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-2xl text-gray-600 hover:text-red-600 transition duration-300"
            >
              <FaTimes />
            </button>

            {!isNavOpen && (
              <button
                onClick={() => setIsNavOpen(true)}
                className="absolute top-4 left-4 text-2xl text-gray-600 hover:text-blue-600 transition duration-300"
              >
                <FaBars />
              </button>
            )}

            <SunriseNavigationPanel
              isNavOpen={isNavOpen}
              selectedMenu={selectedMenu}
              setSelectedMenu={setSelectedMenu}
              setIsNavOpen={setIsNavOpen}
            />

            <div className={`p-6 ${isNavOpen ? "ml-72" : ""}`}>
              <h1 className="text-4xl font-extrabold text-center mb-2 text-blue-700">
                QC1 Dashboard
              </h1>
              <h2 className="text-xl text-center mb-6 text-gray-600 italic">
                {selectedMenu}
              </h2>

              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
              >
                {isFilterOpen ? "Hide Filters" : "Show Filters"}
              </button>

              <SunriseFilterPane
                isFilterOpen={isFilterOpen}
                filters={filters}
                handleFilterChange={handleFilterChange}
                clearFilters={clearFilters}
                uniqueWorkLines={getUniqueValuesInDateRange("WorkLine")}
                uniqueMoNos={getUniqueValuesInDateRange("MONo")}
                uniqueColorNames={getUniqueValuesInDateRange("ColorName")}
                uniqueSizeNames={getUniqueValuesInDateRange("SizeName")}
                uniqueReworkNames={(() => {
                  if (!rs18Data) return [];
                  const startDate = filters.startDate
                    ? parseDate(filters.startDate)
                    : null;
                  const endDate = filters.endDate
                    ? parseDate(filters.endDate)
                    : null;

                  const filtered = rs18Data.filter((row) => {
                    const rowDate = parseDate(row.InspectionDate);
                    return (
                      (!startDate || rowDate >= startDate) &&
                      (!endDate || rowDate <= endDate)
                    );
                  });

                  return [
                    ...new Set(filtered.map((row) => row.ReworkName))
                  ].sort();
                })()} // Added unique ReworkNames
                formatToInputDate={formatToInputDate}
              />

              {selectedMenu === "Daily Summary" && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <SunriseSummaryCard
                    title="Checked Qty"
                    value={totals.CheckedQty}
                    iconType="chart"
                    filteredData={filteredData} // Added
                    filters={filters} // Added
                  />
                  <SunriseSummaryCard
                    title="Defects Qty"
                    value={totals.DefectsQty}
                    iconType="list"
                    filteredData={filteredData} // Added
                    filters={filters} // Added
                  />
                  <SunriseSummaryCard
                    title="Defect Rate"
                    value={totals.DefectRate}
                    getDefectRateStyles={getDefectRateStyles}
                    filteredData={filteredData} // Added
                    filters={filters} // Added
                  />
                </div>
              )}

              {selectedMenu === "Daily Summary" && (
                <>
                  <SunriseSummaryTable
                    //paginatedData={paginatedData}
                    filteredData={filteredData} // Changed from paginatedData
                    totals={totals}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                    getDefectRateStyles={getDefectRateStyles}
                    filters={filters}
                  />
                  <div className="grid grid-cols-2 gap-6">
                    <SunriseLineBarChart
                      filteredData={filteredData}
                      filters={filters}
                    />
                    <SunriseTopN
                      filteredData={filteredData}
                      topN={topN}
                      setTopN={setTopN}
                    />
                  </div>
                </>
              )}

              {selectedMenu === "Daily Trend" && (
                <>
                  <SunriseDailyDefectTrend
                    filteredData={filteredData}
                    filters={filters}
                  />
                </>
              )}

              <div className="flex justify-end mt-6 space-x-4">
                <SunriseDownloadExcel
                  filteredData={filteredData}
                  totals={totals}
                />
                <SunriseDownloadPDF
                  filteredData={filteredData}
                  totals={totals}
                  getDefectRateStyles={getDefectRateStyles}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SunriseAnalyze;
