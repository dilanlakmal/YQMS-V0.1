import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../../config";
import React, { useEffect, useRef, useState } from "react";
import LiveStyleCard from "../components/inspection/liveDashboard/LiveStyleCard";
import LineCard from "../components/inspection/liveDashboard/LineCard";
import TrendAnalysisMO from "../components/inspection/liveDashboard/TrendAnalysisMO";
import TrendAnalysisLine from "../components/inspection/liveDashboard/TrendAnalysisLine";
import TrendAnalysisLineDefects from "../components/inspection/liveDashboard/TrendAnalysisLineDefects";
import NavigationPanel from "../components/inspection/liveDashboard/NavigationPanel";
import LiveSummary from "../components/inspection/liveDashboard/LiveSummary";
import SummaryCard from "../components/inspection/liveDashboard/SummaryCard";
import DefectBarChart from "../components/inspection/liveDashboard/DefectBarChart";
import MOBarChart from "../components/inspection/liveDashboard/MOBarChart";
import LineBarChart from "../components/inspection/liveDashboard/LineBarChart";
import FilterPane from "../components/inspection/liveDashboard/FilterPane";

const LiveDashboard = () => {
  const [activeSection, setActiveSection] = useState("Live Dashboard");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeMoTab, setActiveMoTab] = useState("MO Summary"); // For MO Hr Trend tabs
  const [activeLineTab, setActiveLineTab] = useState("Line Summary");
  const [activeDashboardTab, setActiveDashboardTab] = useState("Bar Chart"); // For Live Dashboard tabs

  // Filter states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [moNo, setMoNo] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [department, setDepartment] = useState("");
  const [empId, setEmpId] = useState("");
  const [buyer, setBuyer] = useState("");
  const [lineNo, setLineNo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});

  // Data states
  const [summaryData, setSummaryData] = useState({
    checkedQty: 0,
    totalPass: 0,
    totalRejects: 0,
    defectsQty: 0,
    totalBundles: 0,
    defectRate: 0,
    defectRatio: 0
  });
  const [defectRates, setDefectRates] = useState([]);
  const [moSummaries, setMoSummaries] = useState([]);
  const [hourlyDefectRates, setHourlyDefectRates] = useState({});
  const [lineDefectRates, setLineDefectRates] = useState({});

  const filtersRef = useRef({});

  // Format Date to "MM/DD/YYYY"
  const formatDate = (date) => {
    if (!date) return "";
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Fetch summary data
  const fetchSummaryData = async (filters = {}) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-inspection-summary`,
        { params: filters }
      );
      setSummaryData(response.data);
    } catch (error) {
      console.error("Error fetching summary data:", error);
    }
  };

  // Fetch defect rates
  const fetchDefectRates = async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-defect-rates`, {
        params: filters
      });
      const sorted = response.data.sort((a, b) => b.defectRate - a.defectRate);
      let rank = 1;
      let previousRate = null;
      const ranked = sorted.map((item, index) => {
        if (item.defectRate !== previousRate) {
          rank = index + 1;
          previousRate = item.defectRate;
        }
        return { ...item, rank };
      });
      setDefectRates(ranked);
    } catch (error) {
      console.error("Error fetching defect rates:", error);
    }
  };

  // Fetch MO No Summaries
  const fetchMoSummaries = async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-mo-summaries`, {
        params: filters
      });
      setMoSummaries(response.data);
    } catch (error) {
      console.error("Error fetching MO summaries:", error);
    }
  };

  // Fetch Hourly Defect Rates by MO No
  const fetchHourlyDefectRates = async (filters = {}) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-defect-rates-by-hour`,
        { params: filters }
      );
      setHourlyDefectRates(response.data);
    } catch (error) {
      console.error("Error fetching hourly defect rates:", error);
    }
  };

  // Fetch Defect Rates by Line No and MO No
  const fetchLineDefectRates = async (filters = {}) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-defect-rates-by-line`,
        { params: filters }
      );
      setLineDefectRates(response.data);
    } catch (error) {
      console.error("Error fetching line defect rates:", error);
    }
  };

  // Apply Filters
  const handleApplyFilters = async () => {
    const filters = {};
    if (moNo) filters.moNo = moNo;
    if (color) filters.color = color;
    if (size) filters.size = size;
    if (department) filters.department = department;
    if (empId) filters.emp_id_inspection = empId;
    if (startDate) filters.startDate = formatDate(startDate);
    if (endDate) filters.endDate = formatDate(endDate);
    if (buyer) filters.buyer = buyer;
    if (lineNo) filters.lineNo = lineNo;

    const applied = {};
    if (startDate) applied["Start Date"] = formatDate(startDate);
    if (endDate) applied["End Date"] = formatDate(endDate);
    if (moNo) applied["MO No"] = moNo;
    if (color) applied["Color"] = color;
    if (size) applied["Size"] = size;
    if (department) applied["Department"] = department;
    if (empId) applied["Emp ID"] = empId;
    if (buyer) applied["Buyer"] = buyer;
    if (lineNo) applied["Line No"] = lineNo;

    setAppliedFilters(applied);
    filtersRef.current = filters;

    await Promise.all([
      fetchSummaryData(filters),
      fetchDefectRates(filters),
      fetchMoSummaries(filters),
      fetchHourlyDefectRates(filters),
      fetchLineDefectRates(filters)
    ]);
  };

  // Reset Filters
  const handleResetFilters = async () => {
    setStartDate(null);
    setEndDate(null);
    setMoNo("");
    setColor("");
    setSize("");
    setDepartment("");
    setEmpId("");
    setBuyer("");
    setLineNo("");
    setAppliedFilters({});

    await Promise.all([
      fetchSummaryData(),
      fetchDefectRates(),
      fetchMoSummaries(),
      fetchHourlyDefectRates(),
      fetchLineDefectRates()
    ]);
  };

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([
        fetchSummaryData(),
        fetchDefectRates(),
        fetchMoSummaries(),
        fetchHourlyDefectRates(),
        fetchLineDefectRates()
      ]);
    };
    fetchInitialData();

    const intervalId = setInterval(async () => {
      const currentFilters = filtersRef.current;
      await Promise.all([
        fetchSummaryData(currentFilters),
        fetchDefectRates(currentFilters),
        fetchMoSummaries(currentFilters),
        fetchHourlyDefectRates(currentFilters),
        fetchLineDefectRates(currentFilters)
      ]);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Update filtersRef
  useEffect(() => {
    filtersRef.current = {
      moNo,
      color,
      size,
      department,
      emp_id_inspection: empId,
      startDate: startDate ? formatDate(startDate) : null,
      endDate: endDate ? formatDate(endDate) : null,
      buyer,
      lineNo
    };
  }, [moNo, color, size, department, empId, startDate, endDate, buyer, lineNo]);

  // Socket.io connection
  useEffect(() => {
    const socket = io(`${API_BASE_URL}`, {
      path: "/socket.io",
      transports: ["websocket"]
    });

    socket.on("qc2_data_updated", async () => {
      console.log("Data updated event received");
      const currentFilters = filtersRef.current;
      await Promise.all([
        fetchSummaryData(currentFilters),
        fetchDefectRates(currentFilters),
        fetchMoSummaries(currentFilters),
        fetchHourlyDefectRates(currentFilters),
        fetchLineDefectRates(currentFilters)
      ]);
    });

    return () => socket.disconnect();
  }, []);

  // Summary Cards Component (Common for all tabs)
  const SummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
      <SummaryCard
        title="Checked Qty"
        value={summaryData.checkedQty}
        icon="checkCircle"
      />
      <SummaryCard
        title="Total Pass"
        value={summaryData.totalPass}
        icon="checkCircle"
      />
      <SummaryCard
        title="Total Rejects"
        value={summaryData.totalRejects}
        icon="xCircle"
      />
      <SummaryCard
        title="Defects Qty"
        value={summaryData.defectsQty}
        icon="list"
      />
      <SummaryCard
        title="Total Bundles"
        value={summaryData.totalBundles}
        icon="archive"
      />
      <SummaryCard
        title="Defect Rate"
        value={summaryData.defectRate * 100}
        icon="pieChart"
      />
      <SummaryCard
        title="Defect Ratio"
        value={summaryData.defectRatio * 100}
        icon="trendingDown"
      />
    </div>
  );

  // MO Card Summaries Component
  const MoCardSummaries = () => (
    <div className="mt-6">
      <h2 className="text-sm font-medium text-gray-900 mb-2">
        MO No Summaries
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-4">
        {moSummaries
          .sort((a, b) => b.defectRate - a.defectRate)
          .map((summary) => (
            <LiveStyleCard
              key={summary.moNo}
              moNo={summary.moNo}
              summaryData={summary}
            />
          ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Navigation Panel */}
      <NavigationPanel
        isOpen={isNavOpen}
        toggleNav={() => setIsNavOpen(!isNavOpen)}
        setActiveSection={setActiveSection}
        activeSection={activeSection}
      />

      {/* Main Content */}
      <div
        className={`flex-1 p-4 transition-all duration-300 ${
          isNavOpen ? "ml-72" : "ml-0"
        }`}
      >
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
          {activeSection}
        </h1>

        {/* Common Filter Pane for QC2 Sections */}
        {[
          "Live Dashboard",
          "MO Hr Trend",
          "Line Hr Trend",
          "Daily Summary",
          "Weekly Analysis",
          "Monthly Analysis"
        ].includes(activeSection) && (
          <FilterPane
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            moNo={moNo}
            setMoNo={setMoNo}
            color={color}
            setColor={setColor}
            size={size}
            setSize={setSize}
            department={department}
            setDepartment={setDepartment}
            empId={empId}
            setEmpId={setEmpId}
            buyer={buyer}
            setBuyer={setBuyer}
            lineNo={lineNo}
            setLineNo={setLineNo}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />
        )}

        {/* Section Content */}
        {activeSection === "Live Dashboard" && (
          <>
            {/* Summary Cards (Common for all tabs) */}
            <SummaryCards />

            {/* Tabs for Live Dashboard */}
            <div className="mb-4">
              <button
                onClick={() => setActiveDashboardTab("Bar Chart")}
                className={`px-4 py-2 mr-2 rounded ${
                  activeDashboardTab === "Bar Chart"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Bar Chart
              </button>
              <button
                onClick={() => setActiveDashboardTab("Summary Table")}
                className={`px-4 py-2 mr-2 rounded ${
                  activeDashboardTab === "Summary Table"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Summary Table
              </button>
              <button
                onClick={() => setActiveDashboardTab("Inspector Data")}
                className={`px-4 py-2 rounded ${
                  activeDashboardTab === "Inspector Data"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Inspector Data
              </button>
            </div>

            {/* Tab Content */}
            {activeDashboardTab === "Bar Chart" && (
              <div className="mt-6">
                <h2 className="text-sm font-medium text-gray-900 mb-2">
                  QC2 Defect Rate by Defect Name
                </h2>
                <DefectBarChart defectRates={defectRates} />
                <h2 className="text-sm font-medium text-gray-900 mt-6 mb-2">
                  QC2 Defect Rate by MO No
                </h2>
                <MOBarChart filters={filtersRef.current} />
                <h2 className="text-sm font-medium text-gray-900 mt-6 mb-2">
                  QC2 Defect Rate by Line No
                </h2>
                <LineBarChart filters={filtersRef.current} />
              </div>
            )}

            {activeDashboardTab === "Summary Table" && (
              <div className="mt-6">
                <LiveSummary filters={filtersRef.current} />
              </div>
            )}

            {activeDashboardTab === "Inspector Data" && (
              <div className="text-center mt-8 text-gray-700">
                <h2 className="text-xl font-medium">Coming soon</h2>
              </div>
            )}
          </>
        )}

        {activeSection === "MO Hr Trend" && (
          <>
            <div className="mb-4">
              <button
                onClick={() => setActiveMoTab("MO Summary")}
                className={`px-4 py-2 mr-2 rounded ${
                  activeMoTab === "MO Summary"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                MO Summary
              </button>
              <button
                onClick={() => setActiveMoTab("MO Trend")}
                className={`px-4 py-2 rounded ${
                  activeMoTab === "MO Trend"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                MO Trend
              </button>
            </div>
            {activeMoTab === "MO Summary" && (
              <>
                <SummaryCards />
                <MoCardSummaries />
              </>
            )}
            {activeMoTab === "MO Trend" && (
              <TrendAnalysisMO data={hourlyDefectRates} />
            )}
          </>
        )}

        {activeSection === "Line Hr Trend" && (
          <>
            <div className="mb-4">
              <button
                onClick={() => setActiveLineTab("Line Summary")}
                className={`px-4 py-2 mr-2 rounded ${
                  activeLineTab === "Line Summary"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Line Summary
              </button>
              <button
                onClick={() => setActiveLineTab("Line Trend")}
                className={`px-4 py-2 mr-2 rounded ${
                  activeLineTab === "Line Trend"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Line-MO Trend
              </button>
              <button
                onClick={() => setActiveLineTab("Line Rate")}
                className={`px-4 py-2 mr-2 rounded ${
                  activeLineTab === "Line Rate"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Line Trend
              </button>
            </div>
            {activeLineTab === "Line Summary" && (
              <>
                <SummaryCards />
                <div className="mt-6">
                  <h2 className="text-sm font-medium text-gray-900 mb-2">
                    Line Summaries
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-4">
                    {Object.keys(lineDefectRates)
                      .filter((key) => key !== "total" && key !== "grand")
                      .filter((lineNum) => (lineNo ? lineNum === lineNo : true)) // Exact match filter using lineNo
                      .map((lineNum) => ({
                        lineNo: lineNum,
                        defectRate: (() => {
                          const moData = lineDefectRates[lineNum] || {};
                          let totalCheckedQty = 0;
                          let totalDefectsQty = 0;
                          Object.keys(moData).forEach((moNum) => {
                            if (moNum !== "totalRate") {
                              Object.keys(moData[moNum]).forEach((hour) => {
                                if (hour !== "totalRate") {
                                  const hourData = moData[moNum][hour];
                                  totalCheckedQty += hourData.checkedQty || 0;
                                  totalDefectsQty += hourData.defects.reduce(
                                    (sum, defect) => sum + defect.count,
                                    0
                                  );
                                }
                              });
                            }
                          });
                          return totalCheckedQty > 0
                            ? totalDefectsQty / totalCheckedQty
                            : 0;
                        })()
                      }))
                      .sort((a, b) => b.defectRate - a.defectRate) // Sort by defectRate descending
                      .map(({ lineNo }) => (
                        <LineCard
                          key={lineNo}
                          lineNo={lineNo}
                          lineDefectRates={lineDefectRates}
                        />
                      ))}
                  </div>
                </div>
              </>
            )}
            {activeLineTab === "Line Trend" && (
              <TrendAnalysisLine data={lineDefectRates} />
            )}
            {activeLineTab === "Line Rate" && (
              <TrendAnalysisLineDefects
                data={lineDefectRates}
                lineNo={lineNo}
              />
            )}
          </>
        )}

        {["Order Data", "Washing", "Ironing", "OPA", "Packing"].includes(
          activeSection
        ) && (
          <div className="text-center mt-8 text-gray-700">
            <h2 className="text-xl font-medium">Coming soon</h2>
          </div>
        )}

        {["Daily Summary", "Weekly Analysis", "Monthly Analysis"].includes(
          activeSection
        ) && (
          <div className="text-center mt-8 text-gray-700">
            <h2 className="text-xl font-medium">Coming soon</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveDashboard;
