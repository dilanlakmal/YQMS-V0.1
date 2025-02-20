// New code 2

import {
  AlertCircle,
  ArrowLeft,
  ArrowUpDown,
  CheckCircle,
  Eye,
  Filter,
  Globe,
  Loader2,
  Menu,
  Printer,
  QrCode,
  Tag,
  XCircle,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import BluetoothComponent from "../components/forms/Bluetooth";
import QRCodePreview from "../components/forms/QRCodePreview";
import Scanner from "../components/forms/Scanner";
import DefectBox from "../components/inspection/DefectBox";
import DefectPrint from "../components/inspection/DefectPrint";
import QC2Data from "../components/inspection/QC2Data";
import { allDefects, defectsList } from "../constants/defects";

const QC2InspectionPage = () => {
  const { user, loading } = useAuth();
  const [error, setError] = useState(null);
  const [bundleData, setBundleData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  //const [loading, setLoading] = useState(false);
  const [tempDefects, setTempDefects] = useState({});
  const [confirmedDefects, setConfirmedDefects] = useState({});
  const [bundlePassed, setBundlePassed] = useState(false);
  const [rejectedOnce, setRejectedOnce] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [totalPass, setTotalPass] = useState(0);
  const [totalRejects, setTotalRejects] = useState(0);
  const [activeTab, setActiveTab] = useState("first");
  const [inDefectWindow, setInDefectWindow] = useState(false);
  const [sortOption, setSortOption] = useState("alphaAsc");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [language, setLanguage] = useState("english");
  const [defectTypeFilter, setDefectTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [qrCodesData, setQrCodesData] = useState([]);
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [generateQRDisabled, setGenerateQRDisabled] = useState(false); // New state for button disable status

  const bluetoothRef = useRef();

  useEffect(() => {
    if (bundleData) {
      setTotalPass(bundleData.passQtyIron || 0);
      setTotalRejects(0);
      setConfirmedDefects({});
      setTempDefects({});
      setBundlePassed(false);
      setRejectedOnce(false);
      setInDefectWindow(true);
      setScanning(false);
    }
  }, [bundleData]);

  useEffect(() => {
    if (Object.values(tempDefects).some((count) => count > 0) && rejectedOnce) {
      setRejectedOnce(false);
    }
  }, [tempDefects, rejectedOnce]);

  const generateDefectId = () => {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  };

  const groupDefectsByRepair = () => {
    const groups = {};

    Object.entries(confirmedDefects).forEach(([index, count]) => {
      const defect = allDefects[parseInt(index)];
      if (!defect || count === 0) return;

      const repair = defect.repair;
      if (!groups[repair]) {
        groups[repair] = {
          defects: [],
          totalCount: 0,
          defectChunks: [],
        };
      }

      groups[repair].defects.push({
        defectName: defect.english,
        count,
      });
      groups[repair].totalCount += count;
    });

    // Calculate count_print for each chunk
    Object.values(groups).forEach((group) => {
      const chunkSize = 3;
      let tempDefects = [];
      let countPrint = 0;

      group.defects.forEach((defect) => {
        tempDefects.push(defect);
        countPrint += defect.count;

        if (tempDefects.length === chunkSize) {
          group.defectChunks.push({
            defects: tempDefects,
            count_print: countPrint,
          });
          tempDefects = [];
          countPrint = 0;
        }
      });

      if (tempDefects.length > 0) {
        group.defectChunks.push({
          defects: tempDefects,
          count_print: countPrint,
        });
      }
    });

    return groups;
  };

  const handleGenerateQRCodes = async () => {
    if (generateQRDisabled) return; // Prevent multiple clicks
    setGenerateQRDisabled(true); // Disable the button
    const defectGroups = groupDefectsByRepair();
    const qrCodes = [];

    for (const [repair, group] of Object.entries(defectGroups)) {
      for (const chunk of group.defectChunks) {
        const defectId = generateDefectId();
        const now = new Date();
        const print_time = now.toLocaleTimeString("en-US", { hour12: false });
        const qrData = {
          factory: bundleData.factory || "YM",
          package_no: bundleData.package_no, //getBundleNumber(bundleData.bundle_id),
          moNo: bundleData.selectedMono,
          custStyle: bundleData.custStyle,
          color: bundleData.color,
          size: bundleData.size,
          repair,
          count: group.totalCount, // Keep the original total count
          count_print: chunk.count_print, // Use count_print here
          defects: chunk.defects.map((d) => ({
            defectName: d.defectName,
            count: d.count,
          })),
          print_time,
          defect_id: defectId,
          emp_id_inspection: user.emp_id,
          eng_name_inspection: user.eng_name,
          kh_name_inspection: user.kh_name,
          job_title_inspection: user.job_title,
          dept_name_inspection: user.dept_name,
          sect_name_inspection: user.sect_name,
          bundle_id: bundleData.bundle_id, // Add this line
          bundle_random_id: bundleData.bundle_random_id, // Add this line
        };

        try {
          const response = await fetch(`${API_BASE_URL}/api/qc2-defect-print`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(qrData),
          });

          if (!response.ok) throw new Error("Failed to save defect print data");

          const savedData = await response.json();
          console.log("Defect print data saved:", savedData);
          qrCodes.push(qrData);
        } catch (error) {
          console.error("Error saving defect print:", error);
          setError(`Failed to generate QR codes: ${error.message}`);
          alert(`Failed to save defect data: ${error.message}`);
          setGenerateQRDisabled(false); // Re-enable the button in case of error
          return;
        }
      }
    }

    setQrCodesData(qrCodes);
    setPrinting(true);
  };

  const handlePrintQRCode = async () => {
    if (!bluetoothRef.current?.isConnected) {
      alert("Please connect to a printer first");
      return;
    }

    try {
      setPrinting(true);

      // Iterate through all QR codes and print them
      for (const qrCode of qrCodesData) {
        await bluetoothRef.current.printDefectData(qrCode);
      }

      alert("All QR codes printed successfully!");
    } catch (error) {
      console.error("Print error:", error);
      alert(`Failed to print QR codes: ${error.message}`);
    } finally {
      setPrinting(false);
    }
  };

  const fetchBundleData = async (randomId) => {
    try {
      setLoadingData(true);
      const response = await fetch(
        `${API_BASE_URL}/api/bundle-by-random-id/${randomId}`
      );
      if (!response.ok) throw new Error("Bundle not found");

      const data = await response.json();

      if (data.passQtyIron === undefined) {
        setError(
          "This bundle has not been ironed yet. Please wait until it is ironed."
        );
        setBundleData(null);
        setInDefectWindow(false);
        setScanning(false);
      } else {
        setBundleData(data);
        setInDefectWindow(true);
        setScanning(false);
        setError(null);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch bundle data");
      setBundleData(null);
    } finally {
      setLoadingData(false);
    }
  };

  const handlePassBundle = async () => {
    const hasDefects = Object.values(tempDefects).some((count) => count > 0);
    if (hasDefects && !rejectedOnce) return;

    const englishDefectItems = defectsList["english"];
    const defectArray = Object.keys(confirmedDefects).map((key) => ({
      defectName: englishDefectItems[key]?.name || "",
      totalCount: confirmedDefects[key],
    }));

    const now = new Date();
    const inspection_time = now.toLocaleTimeString("en-US", { hour12: false });
    const inspection_date = now.toLocaleDateString("en-US");

    const payload = {
      package_no: bundleData.package_no, //getBundleNumber(bundleData.bundle_id),
      moNo: bundleData.selectedMono,
      custStyle: bundleData.custStyle,
      color: bundleData.color,
      size: bundleData.size,
      lineNo: bundleData.lineNo,
      department: bundleData.department,
      checkedQty: bundleData.passQtyIron,
      totalPass: totalPass,
      totalRejects: totalRejects,
      defectQty,
      defectArray,
      inspection_time,
      inspection_date,
      emp_id_inspection: user.emp_id,
      eng_name_inspection: user.eng_name,
      kh_name_inspection: user.kh_name,
      job_title_inspection: user.job_title,
      dept_name_inspection: user.dept_name,
      sect_name_inspection: user.sect_name,
      bundle_id: bundleData.bundle_id, // Add this line
      bundle_random_id: bundleData.bundle_random_id, // Add this line
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
      const currentTempDefects = { ...tempDefects };
      Object.keys(currentTempDefects).forEach((key) => {
        newConfirmed[key] = (newConfirmed[key] || 0) + currentTempDefects[key];
      });
      setConfirmedDefects(newConfirmed);
      setTempDefects({});
      setTotalPass((prev) => prev - 1);
      setTotalRejects((prev) => prev + 1);
      setRejectedOnce(true);

      const englishDefectItems = defectsList["english"];
      const now = new Date();
      const currentTime = now.toLocaleTimeString("en-US", { hour12: false });
      const reworkGarments = Object.keys(currentTempDefects).map((key) => ({
        defectName: englishDefectItems[key]?.name || "",
        count: currentTempDefects[key],
        time: currentTime,
      }));

      const payload = {
        package_no: bundleData.package_no, //getBundleNumber(bundleData.bundle_id),
        moNo: bundleData.selectedMono,
        custStyle: bundleData.custStyle,
        color: bundleData.color,
        size: bundleData.size,
        lineNo: bundleData.lineNo,
        department: bundleData.department,
        reworkGarments,
        emp_id_inspection: user.emp_id,
        eng_name_inspection: user.eng_name,
        kh_name_inspection: user.kh_name,
        job_title_inspection: user.job_title,
        dept_name_inspection: user.dept_name,
        sect_name_inspection: user.sect_name,
        bundle_id: bundleData.bundle_id, // Add this line
        bundle_random_id: bundleData.bundle_random_id, // Add this line
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

  const handleStartScanner = () => {
    setScanning(true);
    setInDefectWindow(false);
  };

  // const getBundleNumber = (bundleId) => {
  //   const parts = bundleId?.split(":") || [];
  //   return parts[parts.length - 1] || "";
  // };

  //{getBundleNumber(bundleData.package_no)}

  const defectQty = Object.values(confirmedDefects).reduce((a, b) => a + b, 0);
  const hasDefects = Object.values(tempDefects).some((count) => count > 0);

  const activeFilter = categoryFilter || defectTypeFilter;
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

            <div>
              <div className="flex items-center mb-1">
                <Printer className="w-5 h-5 mr-1" />
                <span className="font-medium">Printer</span>
              </div>
              <BluetoothComponent ref={bluetoothRef} />
            </div>
          </div>
        )}
      </div>

      <div className={`${navOpen ? "w-3/4" : "w-11/12"} flex flex-col`}>
        {!inDefectWindow && (
          <div className="bg-gray-200 p-2">
            <div className="flex space-x-4">
              {["first", "return", "data", "dashboard", "defect-cards"].map(
                (tab) => (
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
                      : tab === "dashboard"
                      ? "Dashboard"
                      : "Defect Cards"}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {activeTab === "defect-cards" && (
          <DefectPrint bluetoothRef={bluetoothRef} />
        )}

        {activeTab === "data" && <QC2Data />}

        <div className="flex-grow overflow-hidden bg-gray-50">
          {activeTab !== "first" ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Coming Soon</p>
            </div>
          ) : (
            <>
              {!inDefectWindow ? (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  {!scanning && (
                    <button
                      onClick={handleStartScanner}
                      className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white mb-4"
                    >
                      Start Inspection
                    </button>
                  )}
                  {scanning && (
                    <div className="w-full max-w-2xl h-96">
                      <Scanner
                        onScanSuccess={fetchBundleData}
                        onScanError={(err) => setError(err)}
                      />
                      {loadingData && (
                        <div className="flex items-center justify-center gap-2 text-blue-600 mt-4">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <p>Loading bundle data...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="p-2 bg-blue-100 border-b">
                    <div className="flex items-center">
                      <div className="w-1/6 h-32 flex justify-center">
                        <button
                          onClick={handleReturnBundle}
                          disabled={!hasDefects || printing}
                          className={`px-4 py-2 rounded ${
                            !hasDefects || printing
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                        >
                          Rejects Garment
                        </button>
                      </div>

                      <div className="w-4/6 mx-4">
                        <div className="overflow-x-auto whitespace-nowrap h-12 border-b mb-2">
                          <div className="flex space-x-4 items-center">
                            <div>
                              <span className="text-xs">Department: </span>
                              <span className="text-xs font-bold">
                                {bundleData.department}
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
                              <span className="text-xs">Package No: </span>
                              <span className="text-xs font-bold">
                                {bundleData.package_no}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <div className="flex-1 mx-1 bg-gray-100 rounded p-2 flex items-center">
                            <QrCode className="w-5 h-5 mr-2" />
                            <div className="hidden md:block">
                              <div className="text-xs">Checked Qty</div>
                              <div className="text-xl font-bold">
                                {bundleData.passQtyIron}
                              </div>
                            </div>
                            <div className="block md:hidden">
                              <div className="text-xl font-bold">
                                {bundleData.passQtyIron}
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

                      <div className="w-1/6 h-32 flex flex-col justify-center items-center space-y-2">
                        <button
                          onClick={handlePassBundle}
                          disabled={(hasDefects && !rejectedOnce) || printing}
                          className={`px-4 py-2 rounded ${
                            (hasDefects && !rejectedOnce) || printing
                              ? "bg-gray-300 cursor-not-allowed"
                              : totalRejects > 0
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-green-600 hover:bg-green-700"
                          } text-white`}
                        >
                          Pass Bundle
                        </button>

                        <div className="flex space-x-2">
                          <button
                            onClick={handleGenerateQRCodes}
                            disabled={!defectQty || generateQRDisabled}
                            className={`p-2 rounded ${
                              !defectQty || generateQRDisabled
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                            title="Generate QR"
                          >
                            <QrCode className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setShowQRPreview(true)}
                            disabled={!qrCodesData.length}
                            className={`p-2 rounded ${
                              !qrCodesData.length
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                            title="Preview QR"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handlePrintQRCode}
                            //onClick={() => handlePrintQRCode(qrCodesData[0])}
                            disabled={
                              !qrCodesData.length ||
                              !bluetoothRef.current?.isConnected
                            }
                            className={`p-2 rounded ${
                              !qrCodesData.length ||
                              !bluetoothRef.current?.isConnected
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                            title="Print QR"
                          >
                            <Printer className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

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

      <QRCodePreview
        isOpen={showQRPreview}
        onClose={() => setShowQRPreview(false)}
        qrData={qrCodesData}
        onPrint={handlePrintQRCode}
        mode="inspection" // Add this line
      />
    </div>
  );
};

export default QC2InspectionPage;
