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
  // Authentication and User Data
  const { user, loading } = useAuth();

  // State Management
  const [error, setError] = useState(null);
  const [bundleData, setBundleData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
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
  const [qrCodesData, setQrCodesData] = useState({
    repair: [],
    garment: [],
    bundle: [],
  });
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [generateQRDisabled, setGenerateQRDisabled] = useState(false);
  const [printMethod, setPrintMethod] = useState("repair");
  const [rejectedGarments, setRejectedGarments] = useState([]);
  const [passBundleCountdown, setPassBundleCountdown] = useState(null);

  const bluetoothRef = useRef();

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

  const defectQty = Object.values(confirmedDefects).reduce((a, b) => a + b, 0);
  const hasDefects = Object.values(tempDefects).some((count) => count > 0);

  // Effects

  // Reset state when new bundle data is loaded
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
      setRejectedGarments([]);
      setQrCodesData({ repair: [], garment: [], bundle: [] });
      setGenerateQRDisabled(false);
    }
  }, [bundleData]);

  // Reset rejectedOnce flag when tempDefects change after a rejection
  useEffect(() => {
    if (Object.values(tempDefects).some((count) => count > 0) && rejectedOnce) {
      setRejectedOnce(false);
    }
  }, [tempDefects, rejectedOnce]);

  // Auto-pass bundle after printing in "By Garment" mode
  useEffect(() => {
    let timer;
    if (
      printing &&
      qrCodesData[printMethod].length > 0 &&
      printMethod === "garment"
    ) {
      setPassBundleCountdown(5);
      timer = setInterval(() => {
        setPassBundleCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handlePassBundle();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [printing, qrCodesData, printMethod]);

  // Helper Functions

  // Generate a random defect ID
  const generateDefectId = () => {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  };

  // Generate a random garment defect ID
  const generateGarmentDefectId = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  };

  // Compute the aggregated defect array from all confirmed defects
  const computeDefectArray = () => {
    const englishDefectItems = defectsList["english"];
    return Object.keys(confirmedDefects)
      .filter((key) => confirmedDefects[key] > 0)
      .map((key) => ({
        defectName: englishDefectItems[key]?.name || "Unknown",
        totalCount: confirmedDefects[key],
      }));
  };

  // Group defects by repair type for "By Repair" method
  const groupDefectsByRepair = () => {
    const groups = {};
    Object.entries(confirmedDefects).forEach(([index, count]) => {
      const defect = allDefects[parseInt(index)];
      if (!defect || count === 0) return;
      const repair = defect.repair;
      if (!groups[repair]) {
        groups[repair] = { defects: [], totalCount: 0, defectChunks: [] };
      }
      groups[repair].defects.push({ defectName: defect.english, count });
      groups[repair].totalCount += count;
    });
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

  // Group rejected garments into chunks for "By Bundle" method
  const groupRejectedGarmentsForBundle = () => {
    const maxLinesPerPaper = 7; // Maximum defect names per QR code
    const chunks = [];
    let currentChunk = [];
    let currentLineCount = 0;

    rejectedGarments.forEach((garment) => {
      const defectCount = garment.defects.length;
      const linesNeeded = defectCount > 6 ? 7 : defectCount; // 7 lines if >6 defects (6 + "Others")

      // Start a new chunk if adding this garment exceeds maxLinesPerPaper
      if (
        currentLineCount + linesNeeded > maxLinesPerPaper &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentLineCount = 0;
      }

      currentChunk.push(garment);
      currentLineCount += linesNeeded;
    });

    // Push any remaining garments as a final chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  };

  // Event Handlers

  // Start the scanner interface
  const handleStartScanner = () => {
    setScanning(true);
    setInDefectWindow(false);
  };

  // Fetch bundle data and create initial server record
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
        const initialPayload = {
          package_no: data.package_no,
          moNo: data.selectedMono,
          custStyle: data.custStyle,
          color: data.color,
          size: data.size,
          lineNo: data.lineNo,
          department: data.department,
          checkedQty: data.passQtyIron,
          totalPass: data.passQtyIron,
          totalRejects: 0,
          defectQty: 0,
          defectArray: [],
          rejectGarments: [],
          inspection_time: "",
          inspection_date: new Date().toLocaleDateString("en-US"),
          emp_id_inspection: user.emp_id,
          eng_name_inspection: user.eng_name,
          kh_name_inspection: user.kh_name,
          job_title_inspection: user.job_title,
          dept_name_inspection: user.dept_name,
          sect_name_inspection: user.sect_name,
          bundle_id: data.bundle_id,
          bundle_random_id: data.bundle_random_id,
        };
        const createResponse = await fetch(
          `${API_BASE_URL}/api/inspection-pass-bundle`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(initialPayload),
          }
        );
        if (!createResponse.ok)
          throw new Error("Failed to create inspection record");

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

  // Handle rejecting a garment and updating server

  const handleReturnBundle = async () => {
    const hasDefects = Object.values(tempDefects).some((count) => count > 0);
    if (!hasDefects || totalPass <= 0) return;

    const newConfirmed = { ...confirmedDefects };
    const currentTempDefects = { ...tempDefects };
    Object.keys(currentTempDefects).forEach((key) => {
      if (currentTempDefects[key] > 0) {
        newConfirmed[key] = (newConfirmed[key] || 0) + currentTempDefects[key];
      }
    });
    setConfirmedDefects(newConfirmed);
    setTempDefects({});
    setTotalPass((prev) => prev - 1);
    setTotalRejects((prev) => prev + 1);
    setRejectedOnce(true);

    const now = new Date();
    const currentTime = now.toLocaleTimeString("en-US", { hour12: false });

    const garmentDefectId = generateGarmentDefectId(); // Your existing function

    // Map defects with name, count, and repair
    const defects = Object.keys(currentTempDefects)
      .filter((key) => currentTempDefects[key] > 0)
      .map((key) => {
        const defectIndex = parseInt(key);
        const defect = allDefects[defectIndex];
        return {
          name: defect?.english || "Unknown", // Use 'name' instead of 'defectName'
          count: currentTempDefects[key],
          repair: defect?.repair || "Unknown",
        };
      });

    const totalCount = defects.reduce((sum, d) => sum + d.count, 0);
    const newRejectGarment = {
      totalCount,
      defects,
      garment_defect_id: garmentDefectId,
      rejectTime: currentTime,
    };
    const newRejectedGarments = [...rejectedGarments, newRejectGarment];
    setRejectedGarments(newRejectedGarments);

    // Update server record
    const updatePayload = {
      totalPass: totalPass - 1,
      totalRejects: totalRejects + 1,
      defectQty: defectQty + totalCount,
      rejectGarments: newRejectedGarments,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update inspection record: ${errorText}`);
      }
      console.log("Inspection record updated successfully");
    } catch (err) {
      setError(`Failed to update inspection record: ${err.message}`);
      console.error(err);
    }

    // Save to reworks (unchanged, assuming it’s correct)
    const reworkGarments = defects.map((defect) => ({
      defectName: defect.name,
      count: defect.count,
      time: currentTime,
    }));
    const payload = {
      package_no: bundleData.package_no,
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
      bundle_id: bundleData.bundle_id,
      bundle_random_id: bundleData.bundle_random_id,
    };
    try {
      const response = await fetch(`${API_BASE_URL}/api/reworks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to save reworks data");
    } catch (err) {
      setError(`Failed to save reworks data: ${err.message}`);
    }
  };

  // Handle QR code generation for all methods
  const handleGenerateQRCodes = async () => {
    if (generateQRDisabled) return;
    setGenerateQRDisabled(true);

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const print_time = `${hours}:${minutes}:${seconds}`;
    const inspection_date = now.toLocaleDateString("en-US");

    const repairQrCodes = [];
    const garmentQrCodes = [];
    const bundleQrCodes = [];

    // "By Repair" method
    const defectGroups = groupDefectsByRepair();
    for (const [repair, group] of Object.entries(defectGroups)) {
      for (const chunk of group.defectChunks) {
        const defectId = generateDefectId();
        const qrData = {
          factory: bundleData.factory || "YM",
          package_no: bundleData.package_no,
          moNo: bundleData.selectedMono,
          custStyle: bundleData.custStyle,
          color: bundleData.color,
          size: bundleData.size,
          repair,
          count: group.totalCount,
          count_print: chunk.count_print,
          defects: chunk.defects,
          inspection_time: print_time,
          defect_id: defectId,
          emp_id_inspection: user.emp_id,
          eng_name_inspection: user.eng_name,
          kh_name_inspection: user.kh_name,
          job_title_inspection: user.job_title,
          dept_name_inspection: user.dept_name,
          sect_name_inspection: user.sect_name,
          bundle_id: bundleData.bundle_id,
          bundle_random_id: bundleData.bundle_random_id,
        };
        try {
          const response = await fetch(`${API_BASE_URL}/api/qc2-defect-print`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(qrData),
          });
          if (!response.ok) throw new Error("Failed to save defect print data");
          repairQrCodes.push(qrData);
        } catch (error) {
          setError(`Failed to generate QR codes (Repair): ${error.message}`);
          setGenerateQRDisabled(false);
          return;
        }
      }
    }

    // "By Garment" method
    garmentQrCodes.push(
      ...rejectedGarments.map((garment) => {
        const defectId = generateDefectId();
        const garmentDefectId = garment.garment_defect_id;
        const defectsWithRepair = garment.defects.map((d) => ({
          name: d.name,
          count: d.count,
          repair:
            allDefects.find((def) => def.english === d.name)?.repair ||
            "Unknown",
        }));
        return {
          factory: bundleData.factory || "YM",
          package_no: bundleData.package_no,
          moNo: bundleData.selectedMono,
          custStyle: bundleData.custStyle,
          color: bundleData.color,
          size: bundleData.size,
          lineNo: bundleData.lineNo,
          department: bundleData.department,
          checkedQty: bundleData.passQtyIron,
          totalPass,
          totalRejects,
          defectQty: garment.totalCount,
          rejectGarments: [
            {
              totalCount: garment.totalCount,
              defects: defectsWithRepair,
              garment_defect_id: garmentDefectId,
            },
          ],
          inspection_time: print_time,
          inspection_date,
          emp_id_inspection: user.emp_id,
          eng_name_inspection: user.eng_name,
          kh_name_inspection: user.kh_name,
          job_title_inspection: user.job_title,
          dept_name_inspection: user.dept_name,
          sect_name_inspection: user.sect_name,
          bundle_id: bundleData.bundle_id,
          bundle_random_id: bundleData.bundle_random_id,
          defect_id: defectId,
          count: garment.totalCount,
          defects: defectsWithRepair,
        };
      })
    );

    // "By Bundle" method
    if (rejectedGarments.length > 0) {
      const chunks = groupRejectedGarmentsForBundle();
      chunks.forEach((chunk) => {
        const defectPrintId = generateGarmentDefectId();
        const totalRejectGarmentCount = chunk.length;
        const totalPrintDefectCount = chunk.reduce(
          (sum, garment) => sum + garment.totalCount,
          0
        );
        const printData = chunk.map((garment, index) => {
          const defects =
            garment.defects.length > 6
              ? [
                  ...garment.defects.slice(0, 6).map((d) => ({
                    name: d.name, // Ensure 'name' is explicitly set
                    count: d.count,
                    repair: d.repair || "Unknown",
                  })),
                  {
                    name: "Others",
                    count: garment.defects
                      .slice(6)
                      .reduce((sum, d) => sum + d.count, 0),
                    repair: "Various",
                  },
                ]
              : garment.defects.map((d) => ({
                  name: d.name, // Ensure 'name' is explicitly set
                  count: d.count,
                  repair: d.repair || "Unknown",
                }));

          return { garmentNumber: index + 1, defects };
        });
        bundleQrCodes.push({
          package_no: bundleData.package_no,
          moNo: bundleData.selectedMono,
          color: bundleData.color,
          size: bundleData.size,
          bundleQty: bundleData.passQtyIron,
          totalRejectGarments: totalRejectGarmentCount,
          totalDefectCount: totalPrintDefectCount,
          defects: printData,
          defect_print_id: defectPrintId,
        });
      });
    }

    setQrCodesData({
      repair: repairQrCodes,
      garment: garmentQrCodes,
      bundle: bundleQrCodes,
    });

    // Update server record with defectArray and inspection_time
    const defectArray = computeDefectArray();
    const updatePayload = {
      inspection_time: print_time,
      defectArray: defectArray,
    };
    if (bundleQrCodes.length > 0) {
      updatePayload.printArray = bundleQrCodes.map((qrCode) => ({
        method: "bundle",
        defect_print_id: qrCode.defect_print_id,
        totalRejectGarmentCount: qrCode.totalRejectGarments,
        totalPrintDefectCount: qrCode.totalDefectCount,
        printData: qrCode.defects,
      }));
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        }
      );
      if (!response.ok) throw new Error("Failed to update inspection record");
    } catch (err) {
      setError(`Failed to update inspection record: ${err.message}`);
      setGenerateQRDisabled(false);
      return;
    }

    // Do not re-enable Generate QR button here to keep it disabled
    // setGenerateQRDisabled(false);
  };

  // Handle printing of QR codes
  const handlePrintQRCode = async () => {
    if (!bluetoothRef.current?.isConnected) {
      alert("Please connect to a printer first");
      return;
    }
    try {
      setPrinting(true);
      const selectedQrCodes = qrCodesData[printMethod];
      for (const qrCode of selectedQrCodes) {
        if (printMethod === "repair") {
          await bluetoothRef.current.printDefectData(qrCode);
        } else if (printMethod === "garment") {
          await bluetoothRef.current.printGarmentDefectData(qrCode);
          if (!passBundleCountdown) setPassBundleCountdown(5);
        } else if (printMethod === "bundle") {
          await bluetoothRef.current.printBundleDefectData(qrCode);
        }
      }
      alert("All QR codes printed successfully!");
    } catch (error) {
      console.error("Print error:", error);
      alert(`Failed to print QR codes: ${error.message}`);
    } finally {
      setPrinting(false);
    }
  };

  // Handle passing the bundle and reset state
  const handlePassBundle = async () => {
    const hasDefects = Object.values(tempDefects).some((count) => count > 0);
    if (hasDefects && !rejectedOnce) return;

    setTotalPass(0);
    setTotalRejects(0);
    setConfirmedDefects({});
    setTempDefects({});
    setBundlePassed(true);
    setRejectedOnce(false);
    setBundleData(null);
    setInDefectWindow(false);
    setScanning(true);
    setRejectedGarments([]);
    setQrCodesData({ repair: [], garment: [], bundle: [] });
    setGenerateQRDisabled(false);
    setPassBundleCountdown(null);
  };

  // Render UI
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
            <div>
              <div className="flex items-center mb-1">
                <span className="font-medium">Printing Method</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPrintMethod("repair")}
                  className={`p-1 text-sm rounded border ${
                    printMethod === "repair" ? "bg-blue-600" : "bg-gray-700"
                  }`}
                >
                  By Repair
                </button>
                <button
                  onClick={() => setPrintMethod("garment")}
                  className={`p-1 text-sm rounded border ${
                    printMethod === "garment" ? "bg-blue-600" : "bg-gray-700"
                  }`}
                >
                  By Garments
                </button>
                <button
                  onClick={() => setPrintMethod("bundle")}
                  className={`p-1 text-sm rounded border ${
                    printMethod === "bundle" ? "bg-blue-600" : "bg-gray-700"
                  }`}
                >
                  By Bundle
                </button>
              </div>
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
          <DefectPrint bluetoothRef={bluetoothRef} printMethod={printMethod} />
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
                          Reject Garment
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
                          disabled={
                            (hasDefects && !rejectedOnce) ||
                            (printMethod === "garment" &&
                              qrCodesData.garment.length === 0) ||
                            printing
                          }
                          className={`px-4 py-2 rounded ${
                            (hasDefects && !rejectedOnce) ||
                            (printMethod === "garment" &&
                              qrCodesData.garment.length === 0) ||
                            printing
                              ? "bg-gray-300 cursor-not-allowed"
                              : totalRejects > 0
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-green-600 hover:bg-green-700"
                          } text-white`}
                        >
                          Pass Bundle{" "}
                          {passBundleCountdown !== null
                            ? `(${passBundleCountdown}s)`
                            : ""}
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
                            disabled={qrCodesData[printMethod].length === 0}
                            className={`p-2 rounded ${
                              qrCodesData[printMethod].length === 0
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                            title="Preview QR"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handlePrintQRCode}
                            disabled={
                              !bluetoothRef.current?.isConnected ||
                              qrCodesData[printMethod].length === 0
                            }
                            className={`p-2 rounded ${
                              !bluetoothRef.current?.isConnected ||
                              qrCodesData[printMethod].length === 0
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
        qrData={qrCodesData[printMethod]}
        onPrint={handlePrintQRCode}
        mode={
          printMethod === "repair"
            ? "inspection"
            : printMethod === "garment"
            ? "garment"
            : "bundle"
        }
      />
    </div>
  );
};

export default QC2InspectionPage;
