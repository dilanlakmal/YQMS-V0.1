import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpDown,
  CheckCircle,
  Eye,
  Filter,
  Loader2,
  Menu,
  Printer,
  QrCode,
  Tag,
  XCircle,
  Languages,
  Paperclip,
} from "lucide-react";
import BluetoothComponent from "../components/forms/Bluetooth";
import QRCodePreview from "../components/forms/QRCodePreview";
import Scanner from "../components/forms/Scanner";
import DefectBox from "../components/inspection/DefectBox";
import { allDefects, defectsList } from "../constants/QC Inspection/defects";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import DefectNames from "../components/inspection/DefectNames";
import DefectPrint from "../components/inspection/DefectPrint";
import EditInspection from "../components/inspection/EditInspection";
import QC2Data from "../components/inspection/QC2Data";
import { useBluetooth } from "../components/context/BluetoothContext";
import { useTranslation } from "react-i18next";
import i18next from 'i18next'; 
import Swal from "sweetalert2";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TableContainer,
  Paper,
  Button,
} from "@mui/material";

const QC2InspectionPage = () => {
  const { t } = useTranslation();
  const currentLanguage = i18next.language;
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
  const [language, setLanguage] = useState("khmer");
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
  const [defectTrackingDetails, setDefectTrackingDetails] = useState(null); // New state for defect tracking details
  const [repairStatuses, setRepairStatuses] = useState({});
  const [showDefectBoxes, setShowDefectBoxes] = useState(!isReturnInspection); // New state for toggling defect boxes visibility
  const bluetoothRef = useRef();
  const isBluetoothConnected = bluetoothState.isConnected;
  const activeFilter = categoryFilter || defectTypeFilter;
  const [lockedGarments, setLockedGarments] = useState(new Set()); 
  const [rejectedGarmentNumbers, setRejectedGarmentNumbers] = useState(new Set())
  const [lockedDefects, setLockedDefects] = useState(new Set());
  const [rejectedGarmentDefects, setRejectedGarmentDefects] = useState(new Set()); // New state to track rejected garment defects
  const [garmentDefectHistory, setGarmentDefectHistory] = useState({}); 

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

  const defectTypes = ["all", "common", "type1", "type2"];

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
    if (passBundleCountdown !== null) {
      if (passBundleCountdown > 0) {
        timer = setInterval(() => {
          setPassBundleCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        handlePassBundle(); // Automatically trigger Pass Bundle when countdown reaches 0
        setPassBundleCountdown(null); // Reset countdown state
      }
    }
    return () => clearInterval(timer); // Cleanup interval on unmount or state change
  }, [passBundleCountdown]);

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
          factory: data.factory, // Added
          country: data.country, // Added
          sub_con: data.sub_con, // Added
          sub_con_factory: data.sub_con_factory, // Added
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

      // Check if there is re_return_garment data
      // const hasReReturnGarments = printEntry.re_return_garment && printEntry.re_return_garment.length > 0;

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

      // if (hasReReturnGarments) {
      //   // Add logic to lock all garments if there are re_return_garments
      //   const allGarmentNumbers = printEntry.printData.map((item) => item.garmentNumber);
      //   setLockedGarments(new Set(allGarmentNumbers));
       
      //   const reReturnGarments = printEntry.re_return_garment.reduce((acc, current) => {
      //       // Ensure the correct format for each re-return garment's defects
      //       const formattedDefects = current.defects.map(defect => ({
      //           name: defect.name,
      //           count: defect.count,
      //           repair: defect.repair,
      //       }));
      //       // Ensure garment is included in each re-return entry
      //       acc.push({ garmentNumber: current.garment.garmentNumber, defects: formattedDefects, time: current.garment.time });
      //       return acc;
      //   }, []);
      //  setRejectedGarments(reReturnGarments);
      //   reReturnGarments.forEach((garment) => {
      //     setReReturnGarmentNumbers((prev) => new Set(prev).add(garment.garmentNumber));
      //   });
      // }
    } catch (err) {
      setError(err.message);
      setInDefectWindow(false);
      setScanning(false);
    }
  };

  const handleDefectStatusToggle = (garmentNumber, defectName) => {
    // Check if the defect is already locked OR if the garment is rejected
    if (rejectedGarmentDefects.has(garmentNumber)) {
      return; // Prevent any changes if the garment is rejected
    }

    setRepairStatuses((prev) => {
      const key = `${garmentNumber}-${defectName}`;
      const currentStatus = prev[key];
      const newStatus = currentStatus === "OK" ? "Fail" : "OK";
      return { ...prev, [key]: newStatus };
    });
  
    setDefectTrackingDetails((prev) => {
      if (!prev) return prev;
  
      const updatedGarments = prev.garments.map((garment) => {
        if (garment.garmentNumber === garmentNumber) {
          const updatedDefects = garment.defects.map((defect) => {
            if (defect.name === defectName) {
              const now = new Date();
              const newStatus = defect.status === "OK" ? "Fail" : "OK";
  
              // Update tempDefects state based on the actual defect count
              setTempDefects((prevTempDefects) => {
                const defectIndex = allDefects.findIndex(d => d.english === defectName);
                if (defectIndex === -1) return prevTempDefects;
  
                const newTempDefects = { ...prevTempDefects };

                if (newStatus === "Fail") {
                  // When marking as fail, add the original defect count
                  newTempDefects[defectIndex] = defect.count;
                  setRejectedOnce(true); // Set rejectedOnce to true when a defect is marked as Fail
                  // setLockedGarments((prevLocked) => new Set(prevLocked).add(garmentNumber));
                  //Call the function to update the defect status on qc2_repair_tracking
                  updateDefectStatusInRepairTracking(sessionData.printEntry.defect_print_id, garmentNumber, defect.name, "Fail");
                } else {
                  // When marking as OK, remove the defect count
                  delete newTempDefects[defectIndex];
                   //Call the function to update the defect status on qc2_repair_tracking
                 updateDefectStatusInRepairTracking(sessionData.printEntry.defect_print_id, garmentNumber, defect.name, "OK");
                }

                return newTempDefects;
              });

              return {
                ...defect,
                status: newStatus,
                repair_date: newStatus === "OK" ? now.toLocaleDateString("en-US") : "",
                repair_time: newStatus === "OK" ? now.toLocaleTimeString("en-US", { hour12: false }) : "",
              };
            }
            return defect;
          });
  
          return { ...garment, defects: updatedDefects };
        }
        return garment;
      });
  
      // Update total counts
      let totalRejected = 0;
      let totalPassed = 0;
      let totalDefects = 0;
  
      updatedGarments.forEach((garment) => {
        const hasFail = garment.defects.some((defect) => defect.status === "Fail");
        if (hasFail) {
          totalRejected++;
          // Sum up defect counts for failed items
          garment.defects.forEach((defect) => {
            if (defect.status === "Fail") {
              totalDefects += defect.count;
            }
          });
        } else {
          totalPassed++;
        }
      });
  
      // setTotalRejects(totalRejected); // Update totalRejects state
      // setTotalPass(totalPassed); // Update totalPass state
      // setDefectQty(totalDefects); // Update defectQty state
  
      return { ...prev, garments: updatedGarments };
    });
  };
  
  const updateDefectStatusInRepairTracking = async (defect_print_id, garmentNumber, defectName, status) => {
    try {
      const payload = {
        defect_print_id,
        garmentNumber,
        defectName,
        status,
      };
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status-by-name`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update defect status in repair tracking: ${errorText}`);
      }
      console.log("Defect status updated in repair tracking successfully");
    } catch (err) {
      setError(`Failed to update defect status in repair tracking: ${err.message}`);
      console.error("Error updating defect status in repair tracking:", err.message);
    }
  };

  const handleScanSuccess = async (scannedData) => {
    try {
      setLoadingData(true);
  
      // Step 1: Check if the scanned data is a defect_print_id (repair QR code)
      const defectResponse = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle-by-defect-print-id/${scannedData}`
      );
  
      if (defectResponse.ok) {
        const bundleData = await defectResponse.json();
        await handleDefectCardScan(bundleData, scannedData);
  
        // Fetch repair tracking details (defect card details)
        const trackingResponse = await fetch(
          `${API_BASE_URL}/api/defect-track/${scannedData}`
        );
        if (trackingResponse.ok) {
          const trackingData = await trackingResponse.json();
          setDefectTrackingDetails(trackingData); // Set defect card details for display
          setIsReturnInspection(true); // Mark this as a return inspection
  
          // Initialize repair statuses for each defect
          const initialStatuses = {};
          trackingData.garments.forEach((garment) => {
            garment.defects.forEach((defect) => {
              initialStatuses[`${garment.garmentNumber}-${defect.name}`] = defect.status || "Not Repaired";
            });
          });
          setRepairStatuses(initialStatuses); // Track repair status changes
        } else {
          console.error("Failed to fetch defect tracking details");
        }
        return; // Exit after handling defect card scan
      }
  
      // Step 2: Check if the scanned data is a bundle_random_id
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
        // Step 3: Fallback to fetching bundle data if neither defect nor inspection ID matches
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
    if (!hasDefects || totalPass <= 0) {
      console.log("handleRejectGarment aborted: No defects or totalPass <= 0", { hasDefects, totalPass });
      return;
    }
  
    if (isReturnInspection) {
      console.log("Starting handleRejectGarment for return inspection", { sessionData, tempDefects }); 
      
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

      // Find the actual garment number from defectTrackingDetails
      const currentGarment = defectTrackingDetails.garments.find(garment => {
        // Check if the garment has any of the defects in tempDefects
        return garment.defects.some(defect => garmentDefects.some(gd => gd.name === defect.name));
      });

      if (!currentGarment) {
        console.error("Could not find the garment to reject in defectTrackingDetails.");
        return;
      }

      const actualGarmentNumber = currentGarment.garmentNumber;

      // // Assign a garment number
      // const garmentNumber = newSessionData.sessionRejectedGarments.length + 1;
      // // Add the garment number to the set of rejected garment numbers
      // setRejectedGarmentNumbers(prev => new Set(prev).add(garmentNumber));
      // Record the current time
      const now = new Date();
      const currentTime = now.toLocaleTimeString("en-US", { hour12: false });
      // Create re-return garment object
      const reReturnGarment = {
        garment: { garmentNumber: actualGarmentNumber, time: currentTime }, // Use actualGarmentNumber here
        defects: garmentDefects.map((defect) => {
          const defectIndex = allDefects.findIndex((d) => d.english === defect.name);
          const repair = defectIndex !== -1 ? allDefects[defectIndex].repair : "Unknown";
          return {
            name: defect.name,
            count: defect.count,
            repair: repair,
            _id: defect._id || null
          };
        }),
      };
      newSessionData.sessionRejectedGarments.push({
        totalDefectCount,
        repairDefectArray: garmentDefects,
      });
      setSessionData(newSessionData);
      setTotalPass((prev) => prev - 1);
      setTotalRejects((prev) => prev + 1);
      console.log("reReturnGarment created:", reReturnGarment);
      console.log("Updated sessionRejectedGarments:", newSessionData.sessionRejectedGarments);
      // Add re-return garment to qc2_inspection_pass_bundle
      const updatePayload = {
        $push: {
          "printArray.$[elem].re_return_garment": reReturnGarment,
        },
      };
      const arrayFilters = [{ "elem.defect_print_id": sessionData.printEntry.defect_print_id }];
      try {
        console.log("Updating qc2_inspection_pass_bundle with payload:", updatePayload, "and filters:", arrayFilters);
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
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update re-return garment record: ${errorText}`);
        }
        console.log("qc2_inspection_pass_bundle updated successfully");
        setLockedGarments((prev) => new Set(prev).add(actualGarmentNumber));
        reReturnGarment.defects.forEach(defect => {
          setLockedDefects(prev => new Set(prev).add(`${actualGarmentNumber}-${defect.name}`));
        });
        setRejectedGarmentDefects(prev => new Set(prev).add(actualGarmentNumber));
        // setRejectedGarmentNumbers((prev) => new Set(prev).add(garmentNumber));
      } catch (err) {
        setError(`Failed to update re-return garment record: ${err.message}`);
        console.error("Error updating qc2_inspection_pass_bundle:", err.message);
        return;
      }
      console.log("Calling handleReReturnGarment with:", { actualGarmentNumber, garmentDefects });
      // Update repair tracking for re-return garment
      await handleReReturnGarment(actualGarmentNumber, garmentDefects);
      
      // Update defect status in repair tracking for each defect in the rejected garment
     for (const defect of reReturnGarment.defects) {
      await updateDefectStatusInRepairTracking(
        sessionData.printEntry.defect_print_id,
        actualGarmentNumber,
        defect.name,
        "Fail" // or the appropriate status
      );

      // setTempDefects({});
 }
    } else {
      console.log("Handling non-return inspection rejection");
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
  
      //  // Increment garment number for each rejected garment
      //  const garmentNumber = rejectedGarments.length +1
      //   // Add the garment number to the set of rejected garment numbers
      //  setRejectedGarmentNumbers(prev => new Set(prev).add(garmentNumber));
  
  
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
      // Lock the garment and its defects after rejection
      setLockedGarments((prev) => new Set(prev).add(garmentDefectId));
      defects.forEach(defect => {
        setLockedDefects(prev => new Set(prev).add(`${garmentDefectId}-${defect.name}`));
      });
      setRejectedGarmentDefects(prev => new Set(prev).add(garmentDefectId));
    }
  };
  
  
  const handleReReturnGarment = async (garmentNumber, garmentDefects,_id) => {
    try {
        const failedDefects = garmentDefects.map((defect,) => ({
          name: defect.name,
          count: defect.count,
          status: "Fail", // Set status to Fail for re-returned garments
          _id: defect._id,
          // // Extract the defect ID
        }));

        console.log("handleReReturnGarment started", { garmentNumber, failedDefects });

        const payload = {
            defect_print_id: sessionData.printEntry.defect_print_id,
            garmentNumber,
            _id,
            failedDefects, // Include the array of failed defects with IDs
        };

        console.log("Sending payload to qc2_repair_tracking:", payload);

        const repairUpdateResponse = await fetch(
            `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );

        if (!repairUpdateResponse.ok) {
            const errorText = await repairUpdateResponse.text();
            throw new Error(`Failed to update repair tracking: ${errorText}`);
        }

        console.log("qc2_repair_tracking updated successfully for garment", garmentNumber);
    } catch (err) {
        setError(`Failed to update repair tracking: ${err.message}`);
        console.error("Error in handleReReturnGarment:", err.message);
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
        const totalRejectGarment_Var = totalRejectGarmentCount; // Set constant value
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
          totalRejectGarment_Var, // New field, remains constant
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
        totalRejectGarment_Var: qrCode.totalRejectGarment_Var, // Remains constant
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
    if (!bluetoothRef.current) {
      alert("Bluetooth reference is not initialized.");
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
      if (totalRejects > 0) {
        setPassBundleCountdown(3); // Initiate countdown from 3 seconds
      }
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
        // Update qc2_repair_tracking for passed garments
      const rejectedCount = sessionData.sessionRejectedGarments.length;
      const totalGarments = sessionData.totalRejectGarmentCount;
      const passedGarmentNumbers = Array.from(
        { length: totalGarments - rejectedCount },
        (_, i) => rejectedCount + i + 1
      );

      if (passedGarmentNumbers.length > 0) {
        const passUpdateResponse = await fetch(
          `${API_BASE_URL}/api/qc2-repair-tracking/update-passed-garments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              defect_print_id: sessionData.printEntry.defect_print_id,
              garmentNumbers: passedGarmentNumbers,
            }),
          }
        );
        if (!passUpdateResponse.ok) throw new Error("Failed to update repair tracking for passed garments");
      }
      } catch (err) {
        setError(err.message);
      }
      setIsReturnInspection(false);
      setSessionData(null);
    } else {
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

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    if (defectTrackingDetails) {
      setDefectTrackingDetails((prev) => ({
        ...prev,
        garments: prev.garments.map((garment) => ({
          ...garment,
          defects: garment.defects.map((defect) => {
            const defectEntry = allDefects.find((d) => d.english === defect.name);
            return {
              ...defect,
              displayName: defectEntry ? defectEntry[newLanguage] || defect.name : defect.name,
            };
          }),
        })),
      }));
    }
  };

  useEffect(() => {
    setShowDefectBoxes(!isReturnInspection);
  }, [isReturnInspection]);

  useEffect(() => {
    if (defectTrackingDetails) {
      setDefectTrackingDetails((prev) => ({
        ...prev,
        garments: prev.garments.map((garment) => ({
          ...garment,
          defects: garment.defects.map((defect) => {
            const defectEntry = allDefects.find(d => d.english === defect.name);
            return {
              ...defect,
              displayName: defectEntry ? defectEntry[language] || defect.name : defect.name
            };
          })
        }))
      }));
    }
  }, [defectTrackingDetails, language]);

  return (
    <div className="flex h-screen">
      <div
        className={`${
          navOpen ? "w-80 md:w-72" : "w-16"
        } bg-gray-800 text-white h-screen p-2 transition-all duration-300 overflow-y-auto`}
      >
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
                  <Languages className="w-5 h-5 mr-1" />
                  <span className="font-medium">{t("qc2In.language")}</span>
                </div>
                <select
                  value={language}
                  onChange={handleLanguageChange}
                  className="w-full p-1 text-black rounded"
                >
                  <option value="english">{t("languages.en")}</option>
                  <option value="khmer">{t("languages.kh")}</option>
                  <option value="chinese">{t("languages.ch")}</option>
                  <option value="all">{t("qc2In.all_languages")}</option>
                </select>
                <div className="flex items-center mb-1">
                  <Filter className="w-5 h-5 mr-1" />
                  <span className="font-medium">{t("preview.defect_type")}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {defectTypes.map((type) => (
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
                      {currentLanguage === "en"
                        ? t(`qc2In.${type}`).toUpperCase()
                        : t(`qc2In.${type}`)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center mb-1">
                  <Tag className="w-5 h-5 mr-1" />
                  <span className="font-medium">{t("ana.category")}</span>
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
                        categoryFilter === cat
                          ? "bg-blue-600"
                          : "bg-gray-700"
                      }`}
                    >
                      {currentLanguage === "en"
                        ? t(`qc2In.${cat}`).toUpperCase()
                        : t(`qc2In.${cat}`)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center mb-1">
                  <ArrowUpDown className="w-5 h-5 mr-1" />
                  <span className="font-medium">{t("qc2In.sort")}</span>
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
                <div className="flex items-center mb-1">
                  <Printer className="w-5 h-5 mr-1" />
                  <span className="font-medium">{t("qc2In.printer")}</span>
                </div>
                <BluetoothComponent ref={bluetoothRef} />
                <div className="flex items-center mb-1">
                  <Paperclip className="w-5 h-5 mr-1" />
                  <span className="font-medium">{t("qc2In.printing_method")}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:flex space-x-1 md:space-x-2">
                  <button
                    onClick={() => setPrintMethod("repair")}
                    className={`p-1 text-sm rounded border ${printMethod === "repair" ? "bg-blue-600" : "bg-gray-700"}`}
                  >
                    {t("qc2In.repair")}
                  </button>
                  <button
                    onClick={() => setPrintMethod("garment")}
                    className={`p-1 text-sm rounded border ${printMethod === "garment" ? "bg-blue-600" : "bg-gray-700"}`}
                  >
                    {t("qc2In.garment")}
                  </button>
                  <button
                    onClick={() => setPrintMethod("bundle")}
                    className={`p-1 text-sm rounded border ${printMethod === "bundle" ? "bg-blue-600" : "bg-gray-700"}`}
                  >
                    {t("qc2In.bundle")}
                  </button>
                </div>
              </>
            ) : (
              <>
                {selectedFeature === 'language' && (
                  <div>
                    <div className="flex items-center mb-1">
                      <Languages className="w-5 h-5 mr-1" />
                      <span className="font-medium">{t("qc2In.language")}</span>
                    </div>
                    <select value={language} onChange={handleLanguageChange} className="w-full p-1 text-black rounded">
                      <option value="english">{t("languages.en")}</option>
                      <option value="khmer">{t("languages.kh")}</option>
                      <option value="chinese">{t("languages.ch")}</option>
                      <option value="all">{t("qc2In.all_languages")}</option>
                    </select>
                  </div>
                )}
                {selectedFeature === 'defectType' && (
                  <div>
                    <div className="flex items-center mb-1">
                      <Filter className="w-5 h-5 mr-1" />
                      <span className="font-medium">{t("preview.defect_type")}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {defectTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setDefectTypeFilter(type);
                            setCategoryFilter("");
                          }}
                          className={`p-1 text-sm rounded border ${defectTypeFilter === type && !categoryFilter ? "bg-blue-600" : "bg-gray-700"}`}
                        >
                          {currentLanguage === 'en' ? t(`qc2In.${type}`).toUpperCase() : t(`qc2In.${type}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {selectedFeature === 'category' && (
                  <div>
                    <div className="flex items-center mb-1">
                      <Tag className="w-5 h-5 mr-1" />
                      <span className="font-medium">{t("ana.category")}</span>
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
                          {currentLanguage === 'en' ? t(`qc2In.${cat}`).toUpperCase() : t(`qc2In.${cat}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {selectedFeature === 'sort' && (
                  <div>
                    <div className="flex items-center mb-1">
                      <ArrowUpDown className="w-5 h-5 mr-1" />
                      <span className="font-medium">{t("qc2In.sort")}</span>
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
                      <span className="font-medium">{t("qc2In.printer")}</span>
                    </div>
                    <BluetoothComponent ref={bluetoothRef} />
                  </div>
                )}
                {selectedFeature === 'printingMethod' && (
                  <div>
                    <div className="flex items-center mb-1">
                      <Paperclip className="w-5 h-5 mr-1" />
                      <span className="font-medium">{t("qc2In.printing_method")}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:flex space-x-1 md:space-x-2">
                      <button
                        onClick={() => setPrintMethod("repair")}
                        className={`p-1 text-sm rounded border ${printMethod === "repair" ? "bg-blue-600" : "bg-gray-700"}`}
                      >
                        {t("qc2In.repair")}
                      </button>
                      <button
                        onClick={() => setPrintMethod("garment")}
                        className={`p-1 text-sm rounded border ${printMethod === "garment" ? "bg-blue-600" : "bg-gray-700"}`}
                      >
                        {t("qc2In.garment")}
                      </button>
                      <button
                        onClick={() => setPrintMethod("bundle")}
                        className={`p-1 text-sm rounded border ${printMethod === "bundle" ? "bg-blue-600" : "bg-gray-700"}`}
                      >
                        {t("qc2In.bundle")}
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
                <Languages className="w-5 h-5" />
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
            <div className="flex items-center justify-center">
              <button onClick={() => handleIconClick('printingMethod')}>
                <Paperclip className="w-5 h-5" />
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
              {["first", "edit", "return", "data", "defect-cards"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 rounded ${
                      activeTab === tab
                        ? "bg-blue-600 text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    {tab === "first"
                      ? t("qc2In.inspection")
                      : tab === "edit"
                      ? t("qc2In.edit_inspection")
                      : tab === "return"
                      ? t("defIm.defect_name")
                      : tab === "data"
                      ? t("bundle.data")
                      : t("qc2In.defect_card")}
                  </button>
                )
              )}
            </div>
          </div>
        )}
        {activeTab === "edit" && <EditInspection />}
        {activeTab === "return" && <DefectNames />}
        {activeTab === "data" && <QC2Data />}
        {activeTab === "defect-cards" && (
          <DefectPrint bluetoothRef={bluetoothRef} printMethod={printMethod} />
        )}
        <div className="flex-grow overflow-hidden bg-gray-50">
          {activeTab !== "first" ? (
            <div className="h-full flex items-center justify-center">
              {/* <p className="text-gray-500">Coming Soon</p> */}
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
                          <p>{t("qc2In.loading_data")}</p>
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
                  <div className="p-2 bg-blue-100 border-b">
                    <div className="flex items-center">
                      <div className="w-1/6 h-32 flex flex-col justify-center items-center space-y-2">
                        <button
                          onClick={handleRejectGarment}
                          disabled={
                            !hasDefects ||
                            (isReturnInspection && totalPass <= 0) || rejectedGarmentNumbers.has(rejectedGarments.length + 1)
                          }
                          className={`px-2 md:px-4 py-2 rounded ${
                            !hasDefects ||
                            (isReturnInspection && totalPass <= 0 ) || rejectedGarmentNumbers.has(rejectedGarments.length + 1)
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                        >
                          {t("qc2In.reject_garment")}
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
                              <span className="text-xs">{t("bundle.department")}: </span>
                              <span className="text-xs font-bold">
                                {bundleData.department}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs">{t("bundle.mono")}: </span>
                              <span className="text-xs font-bold">
                                {bundleData.selectedMono}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs">{t("bundle.customer_style")}: </span>
                              <span className="text-xs font-bold">
                                {bundleData.custStyle}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs">{t("bundle.color")}: </span>
                              <span className="text-xs font-bold">
                                {bundleData.color}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs">{t("bundle.size")}: </span>
                              <span className="text-xs font-bold">
                                {bundleData.size}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs">{t("bundle.line_no")}: </span>
                              <span className="text-xs font-bold">
                                {bundleData.lineNo}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs">{t("bundle.package_no")}: </span>
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
                              <div className="text-xs">{t("dash.total_pass")}</div>
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
                              <div className="text-xs">{t("dash.total_rejects")}</div>
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
                              <div className="text-xs">{t("qc2In.defect_qty")}</div>
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
                          {t("qc2In.pass_bundle")}{" "}
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
                              title={t("bundle.generate_qr")}
                            >
                              <QrCode className="w-5 h-5" />
                            </button>
                            <button
                              onClick={handlePrintQRCode}
                              disabled={
                                !isBluetoothConnected ||
                                qrCodesData[printMethod].length === 0
                              }
                              className={`p-2 md:p-2 rounded ${
                                !isBluetoothConnected ||
                                qrCodesData[printMethod].length === 0
                                  ? "bg-gray-300 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                              title={t("bundle.print_qr")}
                            >
                              <Printer className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="h-[calc(100vh-200px)] overflow-y-auto p-2">
                    <div className="mt-4 max-w-5xl mx-auto mb-4">
                 
                      {defectTrackingDetails && (
                        <div className="mt-4">
                          <div className="bg-gray-50 rounded-lg p-4 mb-1">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Defect Card Details</h3>
                            <div className="flex justify-between mb-6 bg-gray-100 p-2 rounded">
                              <p className="text-gray-700"><strong>MO No:</strong> {defectTrackingDetails.moNo}</p>
                              <p className="text-gray-700"><strong>Line No:</strong> {defectTrackingDetails.lineNo}</p>
                              <p className="text-gray-700"><strong>Color:</strong> {defectTrackingDetails.color}</p>
                              <p className="text-gray-700"><strong>Size:</strong> {defectTrackingDetails.size}</p>
                            </div>
                            <div className="flex justify-end mb-1">
                              <FormControl variant="outlined" sx={{ minWidth: 200 }}>
                                <InputLabel id="language-select-label">Select Language</InputLabel>
                                <Select
                                  labelId="language-select-label"
                                  id="language-select"
                                  value={language}
                                  onChange={handleLanguageChange}
                                  label="Select Language"
                                >
                                  <MenuItem value="english">English</MenuItem>
                                  <MenuItem value="khmer">Khmer</MenuItem>
                                  <MenuItem value="chinese">Chinese</MenuItem>
                                </Select>
                              </FormControl>
                            </div>
                          </div>
                          <TableContainer component={Paper} className="shadow-lg">
                            <Table className="min-w-full">
                              <TableHead>
                                <TableRow className="bg-gray-100 text-white">
                                  <TableCell scope="col" className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">Garment Number</TableCell>
                                  <TableCell scope="col" className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">Repair Group</TableCell>
                                  <TableCell scope="col" className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">Defect Name ({language})</TableCell>
                                  <TableCell scope="col" className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">Defect Count</TableCell>
                                  <TableCell scope="col" className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">Status</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {defectTrackingDetails.garments && defectTrackingDetails.garments.length > 0 ? (
                                  defectTrackingDetails.garments.map((garment) =>
                                    garment.defects.map((defect, index) => (
                                      <TableRow
                                      key={`${garment.garmentNumber}-${defect.name}-${index}`}
                                      className={lockedGarments.has(garment.garmentNumber) || 
                                      rejectedGarmentNumbers.has(garment.garmentNumber) ? "bg-gray-300" : (defect.status === "OK" ? "bg-green-100" : "bg-red-100")}
                                   >
                                        <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{garment.garmentNumber}</TableCell>
                                        <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{defect.repair}</TableCell>
                                        <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{defect.displayName || defect.name}</TableCell>
                                        <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{defect.count}</TableCell>
                                        <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                                        <Button
                                          variant="contained"
                                          color={repairStatuses[`${garment.garmentNumber}-${defect.name}`] === "OK" ? "success" : "error"}
                                          onClick={() => handleDefectStatusToggle(garment.garmentNumber, defect.name)}
                                          disabled={rejectedGarmentDefects.has(garment.garmentNumber)} // Check if the garment is rejected
                                        >
                                          {repairStatuses[`${garment.garmentNumber}-${defect.name}`] === "OK" ? "PASS" : "Fail"}
                                        </Button>
                                          </TableCell>
                                      </TableRow>
                                    ))
                                  )
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center text-gray-700">No garments found.</TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </div>
                      )}
                      </div>
                      {/* Conditionally render the hide/show button and defect boxes only for return inspections */}
                      {isReturnInspection && (
                        <div className="flex justify-between bg-gray-200 items-center mb-4">
                          {/* <h3 className="text-xl font-semibold text-gray-800">Defect</h3>
                          <button
                            onClick={() => setShowDefectBoxes(!showDefectBoxes)}
                            className="p-2 bg-blue-600 text-white rounded"
                          >
                            {showDefectBoxes ? "Hide" : "Show"}
                          </button> */}
                        </div>
                      )}

                      {isReturnInspection || showDefectBoxes && (
                        <DefectBox
                          language={language}
                          tempDefects={tempDefects}
                          onDefectUpdate={setTempDefects}
                          activeFilter={activeFilter}
                          confirmedDefects={confirmedDefects}
                          sortOption={sortOption}
                        />
                      )}
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



 



