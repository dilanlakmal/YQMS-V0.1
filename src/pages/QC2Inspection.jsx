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
import BluetoothComponent from "../components/forms/Bluetooth";
import QRCodePreview from "../components/forms/QRCodePreview";
import Scanner from "../components/forms/Scanner";
import DefectBox from "../components/inspection/DefectBox";
import { allDefects, defectsList } from "../constants/QC Inspection/defects";
// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import DefectNames from "../components/inspection/DefectNames";
import DefectPrint from "../components/inspection/DefectPrint";
import QC2Data from "../components/inspection/QC2Data";
import { useBluetooth } from "../components/context/BluetoothContext";

const QC2InspectionPage = () => {
  const { user, loading } = useAuth();
  const { bluetoothState } = useBluetooth();

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
  const [totalRepair, setTotalRepair] = useState(0);
  const [activeTab, setActiveTab] = useState("first");
  const [inDefectWindow, setInDefectWindow] = useState(false);
  const [sortOption, setSortOption] = useState("alphaAsc");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [language, setLanguage] = useState("english");
  const [menuClicked, setMenuClicked] = useState(false);
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
  const [printMethod, setPrintMethod] = useState("bundle");
  const [rejectedGarments, setRejectedGarments] = useState([]);
  const [passBundleCountdown, setPassBundleCountdown] = useState(null);
  const [isReturnInspection, setIsReturnInspection] = useState(false);
  const [sessionData, setSessionData] = useState(null);

  const bluetoothRef = useRef();
  const isBluetoothConnected = bluetoothState.isConnected;

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

  const defectQty = isReturnInspection
    ? sessionData?.sessionDefectsQty || 0
    : Object.values(confirmedDefects).reduce((a, b) => a + b, 0);
  const hasDefects = Object.values(tempDefects).some((count) => count > 0);

  useEffect(() => {
    if (activeTab === "first" && !inDefectWindow && !scanning) {
      handleStartScanner();
    }
  }, [activeTab, inDefectWindow, scanning]);

  useEffect(() => {
    if (bundleData && !isReturnInspection) {
      setTotalPass(bundleData.passQtyIron || 0);
      setTotalRejects(0);
      setTotalRepair(0);
      setConfirmedDefects({});
      setTempDefects({});
      setBundlePassed(false);
      setRejectedOnce(false);
      setInDefectWindow(true);
      setScanning(false);
      setRejectedGarments([]);
      setQrCodesData({ repair: [], garment: [], bundle: [] });
      setGenerateQRDisabled(false);
      setIsReturnInspection(false);
      setSessionData(null);
    }
  }, [bundleData]);

  useEffect(() => {
    if (Object.values(tempDefects).some((count) => count > 0) && rejectedOnce) {
      setRejectedOnce(false);
    }
  }, [tempDefects, rejectedOnce]);

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

  const generateDefectId = () => {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  };

  const generateGarmentDefectId = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  };

  const computeDefectArray = () => {
    const englishDefectItems = defectsList["english"];
    return Object.keys(confirmedDefects)
      .filter((key) => confirmedDefects[key] > 0)
      .map((key) => ({
        defectName: englishDefectItems[key]?.name || "Unknown",
        totalCount: confirmedDefects[key],
      }));
  };

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

  const groupRejectedGarmentsForBundle = () => {
    const maxLinesPerPaper = 7;
    const chunks = [];
    let currentChunk = [];
    let currentLineCount = 0;

    rejectedGarments.forEach((garment) => {
      const defectCount = garment.defects.length;
      const linesNeeded = defectCount > 6 ? 7 : defectCount;

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

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  };

  const handleStartScanner = () => {
    setScanning(true);
    setInDefectWindow(false);
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
        const initialPayload = {
          package_no: data.package_no,
          moNo: data.selectedMono,
          custStyle: data.custStyle,
          color: data.color,
          size: data.size,
          lineNo: data.lineNo,
          department: data.department,
          buyer: data.buyer,
          checkedQty: data.passQtyIron,
          totalPass: data.passQtyIron,
          totalRejects: 0,
          totalRepair: 0,
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
          printArray: [],
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
        setTotalRepair(0);
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

  const handleDefectCardScan = async (bundleData, defect_print_id) => {
    try {
      const printEntry = bundleData.printArray.find(
        (entry) =>
          entry.defect_print_id === defect_print_id && !entry.isCompleted
      );
      if (!printEntry) {
        throw new Error(
          "This defect card is already completed or does not exist"
        );
      }

      const maxInspectionNo =
        (printEntry.repairGarmentsDefects?.length > 0
          ? Math.max(
              ...printEntry.repairGarmentsDefects.map((r) => r.inspectionNo)
            )
          : 1) || 1;
      const inspectionNo = maxInspectionNo + 1;

      const newSessionData = {
        bundleData,
        printEntry,
        totalRejectGarmentCount: printEntry.totalRejectGarmentCount,
        initialTotalPass: printEntry.totalRejectGarmentCount,
        sessionTotalPass: printEntry.totalRejectGarmentCount,
        sessionTotalRejects: 0,
        sessionDefectsQty: 0,
        sessionRejectedGarments: [],
        inspectionNo,
      };

      setSessionData(newSessionData);
      setBundleData(bundleData);
      setTotalPass(printEntry.totalRejectGarmentCount);
      setTotalRejects(0);
      setTotalRepair(bundleData.totalRepair);
      setIsReturnInspection(true);
      setInDefectWindow(true);
      setScanning(false);
      setError(null);
    } catch (err) {
      setError(err.message);
      setInDefectWindow(false);
      setScanning(false);
    }
  };

  const handleScanSuccess = async (scannedData) => {
    try {
      setLoadingData(true);

      const defectResponse = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle-by-defect-print-id/${scannedData}`
      );
      if (defectResponse.ok) {
        const bundleData = await defectResponse.json();
        await handleDefectCardScan(bundleData, scannedData);
        return;
      }

      const inspectionResponse = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle-by-random-id/${scannedData}`
      );
      if (inspectionResponse.ok) {
        const inspectionData = await inspectionResponse.json();
        if (inspectionData.totalPass === 0) {
          setError("This bundle already finished inspection");
        } else {
          setError("Please scan defect card for Return Garments");
        }
        setScanning(false);
      } else {
        await fetchBundleData(scannedData);
      }
    } catch (err) {
      setError(err.message || "Failed to process scanned data");
      setScanning(false);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRejectGarment = async () => {
    if (!hasDefects || totalPass <= 0) return;

    if (isReturnInspection) {
      const newSessionData = { ...sessionData };
      newSessionData.sessionTotalPass -= 1;
      newSessionData.sessionTotalRejects += 1;
      const garmentDefects = Object.keys(tempDefects)
        .filter((key) => tempDefects[key] > 0)
        .map((key) => ({
          name: defectsList["english"][key].name,
          count: tempDefects[key],
        }));
      const totalDefectCount = garmentDefects.reduce(
        (sum, d) => sum + d.count,
        0
      );
      newSessionData.sessionDefectsQty += totalDefectCount;
      newSessionData.sessionRejectedGarments.push({
        totalDefectCount,
        repairDefectArray: garmentDefects,
      });
      setSessionData(newSessionData);
      setTotalPass((prev) => prev - 1);
      setTotalRejects((prev) => prev + 1);
      setTempDefects({});
    } else {
      const newConfirmed = { ...confirmedDefects };
      const currentTempDefects = { ...tempDefects };
      Object.keys(currentTempDefects).forEach((key) => {
        if (currentTempDefects[key] > 0) {
          newConfirmed[key] =
            (newConfirmed[key] || 0) + currentTempDefects[key];
        }
      });
      setConfirmedDefects(newConfirmed);
      setTempDefects({});
      setTotalPass((prev) => prev - 1);
      setTotalRejects((prev) => prev + 1);
      setTotalRepair((prev) => prev + 1);
      setRejectedOnce(true);

      const now = new Date();
      const currentTime = now.toLocaleTimeString("en-US", { hour12: false });
      const garmentDefectId = generateGarmentDefectId();

      const defects = Object.keys(currentTempDefects)
        .filter((key) => currentTempDefects[key] > 0)
        .map((key) => {
          const defectIndex = parseInt(key);
          const defect = allDefects[defectIndex];
          return {
            name: defect?.english || "Unknown",
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

      const updatePayload = {
        totalPass: totalPass - 1,
        totalRejects: totalRejects + 1,
        totalRepair: totalRepair + 1,
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
        if (!response.ok) throw new Error("Failed to update inspection record");
      } catch (err) {
        setError(`Failed to update inspection record: ${err.message}`);
      }

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
    }
  };

  const handleGenerateQRCodes = async () => {
    if (generateQRDisabled || isReturnInspection) return;
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
                    name: d.name,
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
                  name: d.name,
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
        repairGarmentsDefects: [],
        printData: qrCode.defects,
        isCompleted: false,
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
  };


const handlePrintQRCode = async () => {
  if (!isBluetoothConnected || isReturnInspection) {
    alert("Please connect to a printer first");
    return;
  }

  console.log("Bluetooth Reference:", bluetoothRef.current); 

  if (!bluetoothRef.current) {
    alert("Bluetooth reference is not initialized.");
    return;
  }

  try {
    setPrinting(true);
    const selectedQrCodes = qrCodesData[printMethod];
    console.log("Selected QR Codes:", selectedQrCodes);
    console.log("Bluetooth Connected:", isBluetoothConnected);

    for (const qrCode of selectedQrCodes) {
      console.log(`Printing ${printMethod} QR Code:`, qrCode);
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
    alert(`Failed to print QR codes: ${error.message || "Unknown error"}`);
  } finally {
    setPrinting(false);
  }
};
  

  const handlePassBundle = async () => {
    const hasDefects = Object.values(tempDefects).some((count) => count > 0);
    if (!isReturnInspection && hasDefects && !rejectedOnce) return;

    if (isReturnInspection) {
      const {
        sessionTotalPass,
        sessionTotalRejects,
        sessionRejectedGarments,
        inspectionNo,
        printEntry,
        initialTotalPass,
      } = sessionData;

      const initialTotalRepair = bundleData.totalRepair;
      const initialTotalPassGlobal = bundleData.totalPass;
      const newTotalRejectGarmentCount = initialTotalPass - sessionTotalPass;

      const updatePayload = {
        $set: {
          totalRepair:
            sessionTotalRejects > 0 ? initialTotalRepair - sessionTotalPass : 0,
          totalPass: initialTotalPassGlobal + sessionTotalPass, // Always add sessionTotalPass
          "printArray.$[elem].totalRejectGarmentCount":
            newTotalRejectGarmentCount,
          "printArray.$[elem].isCompleted": newTotalRejectGarmentCount === 0,
        },
      };

      if (sessionTotalRejects > 0) {
        updatePayload.$push = {
          "printArray.$[elem].repairGarmentsDefects": {
            inspectionNo,
            repairGarments: sessionRejectedGarments,
          },
        };
      }

      const arrayFilters = [
        { "elem.defect_print_id": printEntry.defect_print_id },
      ];

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              updateOperations: updatePayload,
              arrayFilters,
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to update record");
      } catch (err) {
        setError(err.message);
      }

      setIsReturnInspection(false);
      setSessionData(null);
    } else {
      // Set inspection_time when directly passing the bundle
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const inspectionTime = `${hours}:${minutes}:${seconds}`;

      const updatePayload = {
        $set: {
          inspection_time: inspectionTime,
        },
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
        if (!response.ok) throw new Error("Failed to update inspection record");
      } catch (err) {
        setError(`Failed to update inspection record: ${err.message}`);
      }
    }

    setTotalPass(0);
    setTotalRejects(0);
    setTotalRepair(0);
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

  const handleIconClick = (feature) => {
    setSelectedFeature(feature);
    setMenuClicked(false);
    setNavOpen(true);
  };

  const handleMenuClick = () => {
    setNavOpen(!navOpen);
    setMenuClicked(true);
  };

  // useEffect(() => {
  //   if (bluetoothRef.current) {
  //     bluetoothRef.current.onConnect = () => {
  //       console.log("Bluetooth Connected");
  //       setIsBluetoothConnected(true);
  //       setBluetoothState((prevState) => ({
  //         ...prevState,
  //         isConnected: true,
  //       }));
  //     };

  //     // Ensure onDisconnect is only set ONCE
  //     if (!bluetoothRef.current.onDisconnect) {
  //       bluetoothRef.current.onDisconnect = () => {
  //         console.log("Bluetooth Disconnected");
  //         setIsBluetoothConnected(false);
  //         setBluetoothState((prevState) => ({
  //           ...prevState,
  //           isConnected: false,
  //         }));
  //       };
  //     }
  //   }
  // }, []); // Run only once on component mount

  return (
    <div className="flex h-screen">
       <div className={`${navOpen ? "w-80 md:w-72" : "w-16"
        } bg-gray-800 text-white h-screen p-2 transition-all duration-300 overflow-y-auto`}>
      <div className="flex items-center justify-center mb-4">
        <button onClick={handleMenuClick} className="p-2 focus:outline-none">
          {navOpen ? <ArrowLeft /> : <Menu />}
        </button>
      </div>
      {navOpen ? (
        <div className="space-y-6">
          {menuClicked ? (
            <>
              <div className="flex items-center mb-1">
                <Globe className="w-5 h-5 mr-1" />
                <span className="font-medium">Language</span>
              </div>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full p-1 text-black rounded">
                <option value="english">English</option>
                <option value="khmer">Khmer</option>
                <option value="chinese">Chinese</option>
                <option value="all">All Languages</option>
              </select>

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
                    className={`p-1 text-sm rounded border ${defectTypeFilter === type && !categoryFilter ? "bg-blue-600" : "bg-gray-700"}`}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}

              </div>

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
                    className={`p-1 text-sm rounded border ${categoryFilter === cat ? "bg-blue-600" : "bg-gray-700"}`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex items-center mb-1">
                <ArrowUpDown className="w-5 h-5 mr-1" />
                <span className="font-medium">Sort</span>
              </div>
              <div className="relative">
                <button onClick={() => setSortDropdownOpen(!sortDropdownOpen)} className="w-full p-1 rounded bg-gray-700 text-left text-sm">
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

              <div className="flex items-center mb-1">
                <Printer className="w-5 h-5 mr-1" />
                <span className="font-medium">Printer</span>
              </div>
              <BluetoothComponent 
                      ref={bluetoothRef}
                      />

              <div className="flex items-center mb-1">
                <span className="font-medium">Printing Method</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:flex space-x-1 md:space-x-2">
                <button
                  onClick={() => setPrintMethod("repair")}
                  className={`p-1 text-sm rounded border ${printMethod === "repair" ? "bg-blue-600" : "bg-gray-700"}`}
                >
                  By Repair
                </button>
                <button
                  onClick={() => setPrintMethod("garment")}
                  className={`p-1 text-sm rounded border ${printMethod === "garment" ? "bg-blue-600" : "bg-gray-700"}`}
                >
                  By Garments
                </button>
                <button
                  onClick={() => setPrintMethod("bundle")}
                  className={`p-1 text-sm rounded border ${printMethod === "bundle" ? "bg-blue-600" : "bg-gray-700"}`}
                >
                  By Bundle
                </button>
              </div>
            </>
          ) : (
            <>
              {selectedFeature === 'language' && (
                <div>
                  <div className="flex items-center mb-1">
                    <Globe className="w-5 h-5 mr-1" />
                    <span className="font-medium">Language</span>
                  </div>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full p-1 text-black rounded">
                    <option value="english">English</option>
                    <option value="khmer">Khmer</option>
                    <option value="chinese">Chinese</option>
                    <option value="all">All Languages</option>
                  </select>
                </div>
              )}

              {selectedFeature === 'defectType' && (
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
                        className={`p-1 text-sm rounded border ${defectTypeFilter === type && !categoryFilter ? "bg-blue-600" : "bg-gray-700"}`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedFeature === 'category' && (
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
                        className={`p-1 text-sm rounded border ${categoryFilter === cat ? "bg-blue-600" : "bg-gray-700"}`}
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedFeature === 'sort' && (
                <div>
                  <div className="flex items-center mb-1">
                    <ArrowUpDown className="w-5 h-5 mr-1" />
                    <span className="font-medium">Sort</span>
                  </div>
                  <div className="relative">
                    <button onClick={() => setSortDropdownOpen(!sortDropdownOpen)} className="w-full p-1 rounded bg-gray-700 text-left text-sm">
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
              )}

              {selectedFeature === 'printer' && (
                <div>
                  <div className="flex items-center mb-1">
                    <Printer className="w-5 h-5 mr-1" />
                    <span className="font-medium">Printer</span>
                  </div>
                  <BluetoothComponent
                      ref={bluetoothRef}
                      // bluetoothState={bluetoothState}
                      // setBluetoothState={setBluetoothState}
                    />
                </div>
              )}

              {selectedFeature === 'printingMethod' && (
                <div>
                  <div className="flex items-center mb-1">
                    <span className="font-medium">Printing Method</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:flex space-x-1 md:space-x-2">
                    <button
                      onClick={() => setPrintMethod("repair")}
                      className={`p-1 text-sm rounded border ${printMethod === "repair" ? "bg-blue-600" : "bg-gray-700"}`}
                    >
                      By Repair
                    </button>
                    <button
                      onClick={() => setPrintMethod("garment")}
                      className={`p-1 text-sm rounded border ${printMethod === "garment" ? "bg-blue-600" : "bg-gray-700"}`}
                    >
                      By Garments
                    </button>
                    <button
                      onClick={() => setPrintMethod("bundle")}
                      className={`p-1 text-sm rounded border ${printMethod === "bundle" ? "bg-blue-600" : "bg-gray-700"}`}
                    >
                      By Bundle
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <button onClick={() => handleIconClick('language')}>
              <Globe className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-center">
            <button onClick={() => handleIconClick('defectType')}>
              <Filter className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-center">
            <button onClick={() => handleIconClick('category')}>
              <Tag className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-center">
            <button onClick={() => handleIconClick('sort')}>
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-center">
            <button onClick={() => handleIconClick('printer')}>
              <Printer className={`w-5 h-5 ${isBluetoothConnected ? "text-green-500" : ""}`} />
            </button>
          </div>
        </div>
      )}
      </div>
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <BluetoothComponent ref={bluetoothRef} />
      </div>
      <div className={`${navOpen ? "w-3/4" : "w-11/12"} flex flex-col`}>
        {!inDefectWindow && (
          <div className="bg-gray-200 p-2">
            <div className="flex space-x-4">
              {["first", "return", "data",  "defect-cards"].map(
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
                      ? "Inspection"
                      : tab === "return"
                      ? "Defect Names"
                      : tab === "data"
                      ? "Data"
                      // : tab === "dashboard"
                      // ? "Dashboard"
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

        {activeTab === "return" && <DefectNames />}

        <div className="flex-grow overflow-hidden bg-gray-50">
          {activeTab !== "first" ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Coming Soon</p>
            </div>
          ) : (
            <>
              {!inDefectWindow ? (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  {scanning && (
                    <div className="w-full max-w-2xl h-96">
                      <Scanner
                        onScanSuccess={handleScanSuccess}
                        onScanError={(err) => setError(err)}
                      />
                      {loadingData && (
                        <div className="flex items-center justify-center gap-2 text-blue-600 mt-4">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <p>Loading data...</p>
                        </div>
                      )}
                      {error && (
                        <div className="text-red-600 mt-4">{error}</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="p-2  bg-blue-100 border-b">
                    <div className="flex items-center">
                      <div className="w-1/6 h-32 flex flex-col justify-center items-center space-y-2">
                        <button
                          onClick={handleRejectGarment}
                          disabled={
                            !hasDefects ||
                            (isReturnInspection && totalPass <= 0)
                          }
                          className={`px-2 md:px-4 py-2 rounded ${
                            !hasDefects ||
                            (isReturnInspection && totalPass <= 0)
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                        >
                          Reject Garment
                        </button>
                        {!isReturnInspection && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => setShowQRPreview(true)}
                              disabled={qrCodesData[printMethod].length === 0}
                              className={`p-2 md:p-2 rounded ${
                                qrCodesData[printMethod].length === 0
                                  ? "bg-gray-300 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                              title="Preview QR"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="w-64 md:w-4/6 mx-4">
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
                          <div className="flex md:flex-1 mx-1 bg-gray-100 rounded p-1 md:p-2 flex items-center">
                            <QrCode className="w-5 h-5 mr-2" />
                            <div className="hidden md:block">
                              <div className="text-xs">
                                {isReturnInspection
                                  ? "Reject Garments"
                                  : "Checked Qty"}
                              </div>
                              <div className="text-xl font-bold">
                                {isReturnInspection
                                  ? sessionData.totalRejectGarmentCount
                                  : bundleData.passQtyIron}
                              </div>
                            </div>
                            <div className="block md:hidden">
                              <div className="text-xl font-bold">
                                {isReturnInspection
                                  ? sessionData.totalRejectGarmentCount
                                  : bundleData.passQtyIron}
                              </div>
                            </div>
                          </div>
                          <div className="flex md:flex-1 mx-1 bg-gray-100 rounded p-1 md:p-2 flex items-center">
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
                          <div className="flex md:flex-1 mx-1 bg-gray-100 rounded p-1 md:p-2 flex items-center">
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
                          <div className="flex md:flex-1 mx-1 bg-gray-100 rounded p-1 md:p-2 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                            <div className="hidden md:block">
                              <div className="text-xs">Defects Qty</div>
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
                            !isReturnInspection &&
                            ((hasDefects && !rejectedOnce) ||
                              (printMethod === "garment" &&
                                qrCodesData.garment.length === 0) ||
                              printing)
                          }
                          className={`px-2 md:px-4 py-1 md:py-2 rounded ${
                            !isReturnInspection &&
                            ((hasDefects && !rejectedOnce) ||
                              (printMethod === "garment" &&
                                qrCodesData.garment.length === 0) ||
                              printing)
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
                        {!isReturnInspection && (
                          <div className="flex space-x-1">
                            <button
                              onClick={handleGenerateQRCodes}
                              disabled={!defectQty || generateQRDisabled}
                              className={`p-2 md:p-2 rounded ${
                                !defectQty || generateQRDisabled
                                  ? "bg-gray-300 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                              title="Generate QR"
                            >
                              <QrCode className="w-5 h-5" />
                            </button>
                            <button
                              onClick={handlePrintQRCode}
                              disabled={
                                // !bluetoothRef.current?.isConnected ||
                                !isBluetoothConnected ||
                                qrCodesData[printMethod].length === 0
                              }
                              className={`p-2 md:p-2 rounded ${
                                // !bluetoothRef.current?.isConnected ||
                                !isBluetoothConnected ||
                                qrCodesData[printMethod].length === 0
                                  ? "bg-gray-300 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                              title="Print QR"
                            >
                              <Printer className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="h-[calc(100vh-200px)] overflow-y-auto p-2">
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
        qrData={(() => {
          // console.log("QRCodePreview qrData:", qrCodesData[printMethod]);
          return qrCodesData[printMethod];
        })()}
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