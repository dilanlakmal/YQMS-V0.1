import {
  AlertCircle,
  ArrowLeft,
  ArrowUpDown,
  CheckCircle,
  Filter,
  Globe,
  Menu,
  QrCode,
  Tag,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Scanner from "../components/forms/Scanner";
import DefectBox from "../components/inspection/DefectBox";
import { defectsList } from "../constants/defects";
// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "../../config";

const QC2InspectionPage = () => {
  // Bundle, defect, and scanning states
  const [error, setError] = useState(null);
  const [bundleData, setBundleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tempDefects, setTempDefects] = useState({});
  const [confirmedDefects, setConfirmedDefects] = useState({});
  const [bundlePassed, setBundlePassed] = useState(false);
  const [rejectedOnce, setRejectedOnce] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [totalPass, setTotalPass] = useState(0);
  const [totalRejects, setTotalRejects] = useState(0);

  // Tab and view state
  const [activeTab, setActiveTab] = useState("first"); // "first", "return", "data", "dashboard"
  const [inDefectWindow, setInDefectWindow] = useState(false);

  // Sort option (for DefectBox) and dropdown toggle
  const [sortOption, setSortOption] = useState("alphaAsc");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Left Navigation Panel states and filters
  const [navOpen, setNavOpen] = useState(false);
  const [language, setLanguage] = useState("english");
  const [defectTypeFilter, setDefectTypeFilter] = useState("all"); // "all", "common", "type1", "type2"
  const [categoryFilter, setCategoryFilter] = useState(""); // e.g. "fabric", etc.

  // Whenever bundleData is set, initialize header values and switch into defect window mode.
  useEffect(() => {
    if (bundleData) {
      setTotalPass(bundleData.count || 0);
      setTotalRejects(0);
      setConfirmedDefects({});
      setTempDefects({});
      setBundlePassed(false);
      setRejectedOnce(false);
      setInDefectWindow(true);
      setScanning(false);
    }
  }, [bundleData]);

  //If the user selects any defect (i.e. tempDefects nonzero), then reset rejectedOnce.
  useEffect(() => {
    if (Object.values(tempDefects).some((count) => count > 0) && rejectedOnce) {
      setRejectedOnce(false);
    }
  }, [tempDefects, rejectedOnce]);

  // API call to fetch bundle data (e.g. after scanning a QR code)
  const fetchBundleData = async (randomId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/bundle-by-random-id/${randomId}`
      );
      if (!response.ok) throw new Error("Bundle not found");
      const data = await response.json();
      setBundleData(data);
      setInDefectWindow(true);
      setScanning(false);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch bundle data");
      setBundleData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePassBundle = async () => {
    const hasDefects = Object.values(tempDefects).some((count) => count > 0);
    if (hasDefects && !rejectedOnce) return; // Button is disabled if there are temporary defects not yet rejected

    // Build defectArray from confirmedDefects using defect indices to get English names
    const englishDefectItems = defectsList["english"];
    const defectArray = Object.keys(confirmedDefects).map((key) => ({
      defectName: englishDefectItems[key]?.name || "",
      totalCount: confirmedDefects[key],
    }));

    // Get current time and date
    const now = new Date();
    const inspection_time = now.toLocaleTimeString("en-US", { hour12: false });
    const inspection_date = now.toLocaleDateString("en-US");

    // Build payload with separate header fields extracted from bundleData
    const payload = {
      bundleNo: getBundleNumber(bundleData.bundle_id),
      moNo: bundleData.selectedMono,
      custStyle: bundleData.custStyle,
      color: bundleData.color,
      size: bundleData.size,
      lineNo: bundleData.lineNo,
      department: bundleData.department,
      checkedQty: bundleData.count,
      totalPass: totalPass,
      totalRejects: totalRejects,
      defectQty: defectQty,
      defectArray,
      inspection_time,
      inspection_date,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/inspection-pass-bundle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok)
        throw new Error("Failed to save inspection pass bundle");
      const data = await response.json();
      console.log("Inspection pass bundle saved:", data);
    } catch (err) {
      console.error(err);
    }

    // Reset states and return to scanner view
    setTotalPass(0);
    setTotalRejects(0);
    setConfirmedDefects({});
    setTempDefects({});
    setBundlePassed(true);
    setRejectedOnce(false);
    setBundleData(null);
    setInDefectWindow(false);
    setScanning(true);
  };

  const handleReturnBundle = async () => {
    const hasDefects = Object.values(tempDefects).some((count) => count > 0);
    if (totalPass > 0 && hasDefects) {
      const newConfirmed = { ...confirmedDefects };
      // Capture current temporary defects before clearing
      const currentTempDefects = { ...tempDefects };
      Object.keys(currentTempDefects).forEach((key) => {
        newConfirmed[key] = (newConfirmed[key] || 0) + currentTempDefects[key];
      });
      setConfirmedDefects(newConfirmed);
      setTempDefects({});
      setTotalPass((prev) => prev - 1);
      setTotalRejects((prev) => prev + 1);
      setRejectedOnce(true);

      // Build ReworkGarments array using defect indices to get English names
      const englishDefectItems = defectsList["english"];
      const now = new Date();
      const currentTime = now.toLocaleTimeString("en-US", { hour12: false });
      const reworkGarments = Object.keys(currentTempDefects).map((key) => ({
        defectName: englishDefectItems[key]?.name || "",
        count: currentTempDefects[key],
        time: currentTime,
      }));

      // Build payload with separate header fields
      const payload = {
        bundleNo: getBundleNumber(bundleData.bundle_id),
        moNo: bundleData.selectedMono,
        custStyle: bundleData.custStyle,
        color: bundleData.color,
        size: bundleData.size,
        lineNo: bundleData.lineNo,
        department: bundleData.department,
        reworkGarments,
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/reworks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to save reworks data");
        const data = await response.json();
        console.log("Reworks data saved:", data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // "Start Scanner" button handler (only one button in First Inspection tab)
  const handleStartScanner = () => {
    setScanning(true);
    setInDefectWindow(false);
  };

  // Helper to extract bundle number from bundleData.bundle_id
  const getBundleNumber = (bundleId) => {
    const parts = bundleId?.split(":") || [];
    return parts[parts.length - 1] || "";
  };

  // Calculate total defect quantity.
  const defectQty = Object.values(confirmedDefects).reduce((a, b) => a + b, 0);
  const hasDefects = Object.values(tempDefects).some((count) => count > 0);

  // Determine active filter for DefectBox.
  const activeFilter = categoryFilter || defectTypeFilter;

  // Options for Category filter (8 buttons)
  const categoryOptions = [
    "fabric",
    "workmanship",
    "cleanliness",
    "embellishment",
    "measurement",
    "washing",
    "finishing",
    "miscellaneous",
  ];

  return (
    <div className="flex h-screen">
      {/* LEFT NAVIGATION PANEL */}
      <div
        className={`${
          navOpen ? "w-64" : "w-16"
        } bg-gray-800 text-white h-screen p-2 transition-all duration-300`}
      >
        <div className="flex items-center justify-center mb-4">
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="p-2 focus:outline-none"
          >
            {navOpen ? <ArrowLeft /> : <Menu />}
          </button>
        </div>
        {navOpen && (
          <div className="space-y-6">
            {/* Language Filter */}
            <div>
              <div className="flex items-center mb-1">
                <Globe className="w-5 h-5 mr-1" />
                <span className="font-medium">Language</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-1 text-black rounded"
              >
                <option value="english">English</option>
                <option value="khmer">Khmer</option>
                <option value="chinese">Chinese</option>
                <option value="all">All Languages</option>
              </select>
            </div>
            {/* Defect Type Filter (4 buttons) */}
            <div>
              <div className="flex items-center mb-1">
                <Filter className="w-5 h-5 mr-1" />
                <span className="font-medium">Defect Type</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {["all", "common", "type1", "type2"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setDefectTypeFilter(type);
                      setCategoryFilter("");
                    }}
                    className={`p-1 text-sm rounded border ${
                      defectTypeFilter === type && !categoryFilter
                        ? "bg-blue-600"
                        : "bg-gray-700"
                    }`}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {/* Category Filter (8 buttons, single select) */}
            <div>
              <div className="flex items-center mb-1">
                <Tag className="w-5 h-5 mr-1" />
                <span className="font-medium">Category</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategoryFilter(cat === categoryFilter ? "" : cat);
                      setDefectTypeFilter("all");
                    }}
                    className={`p-1 text-sm rounded border ${
                      categoryFilter === cat ? "bg-blue-600" : "bg-gray-700"
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {/* Sort Filter */}
            <div>
              <div className="flex items-center mb-1">
                <ArrowUpDown className="w-5 h-5 mr-1" />
                <span className="font-medium">Sort</span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="w-full p-1 rounded bg-gray-700 text-left text-sm"
                >
                  {sortOption === "alphaAsc"
                    ? "A-Z"
                    : sortOption === "alphaDesc"
                    ? "Z-A"
                    : sortOption === "countDesc"
                    ? "Count (High-Low)"
                    : "Select Sort"}
                </button>
                {sortDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white text-black rounded shadow p-2">
                    <button
                      onClick={() => {
                        setSortOption("alphaAsc");
                        setSortDropdownOpen(false);
                      }}
                      className="block w-full text-left px-2 py-1 hover:bg-gray-200 text-sm"
                    >
                      A-Z
                    </button>
                    <button
                      onClick={() => {
                        setSortOption("alphaDesc");
                        setSortDropdownOpen(false);
                      }}
                      className="block w-full text-left px-2 py-1 hover:bg-gray-200 text-sm"
                    >
                      Z-A
                    </button>
                    <button
                      onClick={() => {
                        setSortOption("countDesc");
                        setSortDropdownOpen(false);
                      }}
                      className="block w-full text-left px-2 py-1 hover:bg-gray-200 text-sm"
                    >
                      Count (High-Low)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT MAIN CONTENT */}
      <div className={`${navOpen ? "w-3/4" : "w-11/12"} flex flex-col`}>
        {/* TAB BAR – visible only when NOT in defect window mode */}
        {!inDefectWindow && (
          <div className="bg-gray-200 p-2">
            <div className="flex space-x-4">
              {["first", "return", "data", "dashboard"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "bg-white text-black"
                  }`}
                >
                  {tab === "first"
                    ? "First Inspection"
                    : tab === "return"
                    ? "Return Inspection"
                    : tab === "data"
                    ? "Data"
                    : "Dashboard"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex-grow overflow-hidden bg-gray-50">
          {activeTab !== "first" ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Coming Soon</p>
            </div>
          ) : (
            <>
              {!inDefectWindow ? (
                // Start Scanner View (only one button)
                <div className="flex flex-col items-center justify-center h-full p-4">
                  {!scanning && (
                    <button
                      onClick={handleStartScanner}
                      className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white mb-4"
                    >
                      Start Inspetion
                    </button>
                  )}
                  {scanning && (
                    <div className="w-full max-w-2xl h-96">
                      <Scanner
                        onScanSuccess={fetchBundleData}
                        onScanError={(err) => setError(err)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                // Defect Window View: Fixed header area and scrollable defect box.
                <>
                  {/* FIXED HEADER AREA */}
                  <div className="p-2 bg-blue-100 border-b">
                    <div className="flex items-center">
                      {/* Return Bundle Button (left) */}
                      <div className="w-1/6 h-32 flex justify-center">
                        <button
                          onClick={handleReturnBundle}
                          disabled={!hasDefects}
                          className={`px-4 py-2 rounded ${
                            !hasDefects
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                        >
                          Rejects Garment
                        </button>
                      </div>

                      {/* HEADER DATA & 4 CARD VISUALS (center) */}
                      <div className="w-4/6 mx-4">
                        {/* Horizontal scrolling header data */}
                        <div className="overflow-x-auto whitespace-nowrap h-12 border-b mb-2">
                          <div className="flex space-x-4 items-center">
                            <div>
                              <span className="text-xs">Bundle No: </span>
                              <span className="text-xs font-bold">
                                {getBundleNumber(bundleData.bundle_id)}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs">MO No: </span>
                              <span className="text-xs font-bold">
                                {bundleData.selectedMono}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs">Cust. Style: </span>
                              <span className="text-xs font-bold">
                                {bundleData.custStyle}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs">Color: </span>
                              <span className="text-xs font-bold">
                                {bundleData.color}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs">Size: </span>
                              <span className="text-xs font-bold">
                                {bundleData.size}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs">Line No: </span>
                              <span className="text-xs font-bold">
                                {bundleData.lineNo}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs">Department: </span>
                              <span className="text-xs font-bold">
                                {bundleData.department}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 4 Card Visuals */}
                        <div className="flex justify-between">
                          <div className="flex-1 mx-1 bg-gray-100 rounded p-2 flex items-center">
                            <QrCode className="w-5 h-5 mr-2" />
                            <div className="hidden md:block">
                              <div className="text-xs">Checked Qty</div>
                              <div className="text-xl font-bold">
                                {bundleData.count}
                              </div>
                            </div>
                            <div className="block md:hidden">
                              <div className="text-xl font-bold">
                                {bundleData.count}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 mx-1 bg-gray-100 rounded p-2 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                            <div className="hidden md:block">
                              <div className="text-xs">Total Pass</div>
                              <div className="text-xl font-bold text-green-600">
                                {totalPass}
                              </div>
                            </div>
                            <div className="block md:hidden">
                              <div className="text-xl font-bold text-green-600">
                                {totalPass}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 mx-1 bg-gray-100 rounded p-2 flex items-center">
                            <XCircle className="w-5 h-5 mr-2 text-red-600" />
                            <div className="hidden md:block">
                              <div className="text-xs">Total Rejects</div>
                              <div className="text-xl font-bold text-red-600">
                                {totalRejects}
                              </div>
                            </div>
                            <div className="block md:hidden">
                              <div className="text-xl font-bold text-red-600">
                                {totalRejects}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 mx-1 bg-gray-100 rounded p-2 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                            <div className="hidden md:block">
                              <div className="text-xs">Defect Qty</div>
                              <div className="text-xl font-bold text-orange-600">
                                {defectQty}
                              </div>
                            </div>
                            <div className="block md:hidden">
                              <div className="text-xl font-bold text-orange-600">
                                {defectQty}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pass Bundle Button (right) */}
                      <div className="w-1/6 h-32 flex justify-center">
                        <button
                          onClick={handlePassBundle}
                          disabled={hasDefects && !rejectedOnce}
                          className={`px-4 py-2 rounded ${
                            hasDefects && !rejectedOnce
                              ? "bg-gray-300 cursor-not-allowed"
                              : totalRejects > 0
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-green-600 hover:bg-green-700"
                          } text-white`}
                        >
                          Pass Bundle
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SCROLLABLE DEFECT BOX – only this area scrolls vertically */}
                  <div className="h-[calc(100vh-200px)] overflow-y-auto p-4">
                    <DefectBox
                      language={language}
                      tempDefects={tempDefects}
                      onDefectUpdate={setTempDefects}
                      activeFilter={activeFilter}
                      confirmedDefects={confirmedDefects}
                      sortOption={sortOption}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QC2InspectionPage;
