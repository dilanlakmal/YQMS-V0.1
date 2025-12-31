import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  AlertCircle,
  Loader2,
  Sparkles,
  User,
  Scan,
  Database,
  Edit,
  RotateCcw,
  FileText,
  Search,
  Camera,
  Upload
} from "lucide-react";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import i18next from "i18next";

// Local Imports
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import { useBluetooth } from "../components/context/BluetoothContext";

// Existing Components
import BluetoothComponent from "../components/forms/Bluetooth";
import QRCodePreview from "../components/forms/QRCodePreview";
import DefectNames from "../components/inspection/DefectNames";
import DefectPrint from "../components/inspection/DefectPrint";
import EditInspection from "../components/inspection/EditInspection";
import QC2Data from "../components/inspection/QC2Data";

// New Refactored Components
import QC2InspectionPageTitle from "../components/inspection/qc2/QC2InspectionPageTitle";
import QC2InspectionSidebar from "../components/inspection/qc2/QC2InspectionSidebar";
import QC2InspectionTabs from "../components/inspection/qc2/QC2InspectionTabs";
import QC2InspectionScannerView from "../components/inspection/qc2/QC2InspectionScannerView";
import QC2InspectionWindow from "../components/inspection/qc2/QC2InspectionWindow";

// --- NEW: Import the new worker stats component ---
import QC2WorkerStats from "../components/inspection/qc2/QC2WorkerStats";

const QC2InspectionPage = () => {
  // --- State Management ---
  const { t } = useTranslation();
  const { user } = useAuth();
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
  const [language, setLanguage] = useState("khmer");
  const [defectTypeFilter, setDefectTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [qrCodesData, setQrCodesData] = useState({ bundle: [] });
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [generateQRDisabled, setGenerateQRDisabled] = useState(false);
  const [rejectedGarments, setRejectedGarments] = useState([]);
  const [passBundleCountdown, setPassBundleCountdown] = useState(null);
  const [isReturnInspection, setIsReturnInspection] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [defectTrackingDetails, setDefectTrackingDetails] = useState(null);
  const [repairStatuses, setRepairStatuses] = useState({});
  const [showDefectBoxes, setShowDefectBoxes] = useState(!isReturnInspection);
  const [currentTime, setCurrentTime] = useState(new Date());
  const bluetoothRef = useRef();
  const isBluetoothConnected = bluetoothState.isConnected;
  const activeFilter = categoryFilter || defectTypeFilter;
  const [lockedGarments, setLockedGarments] = useState(new Set());
  const [rejectedGarmentNumbers, setRejectedGarmentNumbers] = useState(
    new Set()
  );
  const [lockedDefects, setLockedDefects] = useState(new Set());
  const [rejectedGarmentDefects, setRejectedGarmentDefects] = useState(
    new Set()
  );
  const [selectedGarment, setSelectedGarment] = useState(null);
  const [isPassingBundle, setIsPassingBundle] = useState(false);
  const [locallyRejectedDefects, setLocallyRejectedDefects] = useState(
    new Set()
  );
  const [bGradingGarment, setBGradingGarment] = useState(null);
  const [defectsData, setDefectsData] = useState([]);
  const [defectsLoading, setDefectsLoading] = useState(true);
  const [defectsError, setDefectsError] = useState(null);

  // --- NEW: State to hold the worker's daily stats ---
  const [workerStats, setWorkerStats] = useState(null);

  // Define tabs with modern icons
  const tabs = [
    {
      id: "first",
      label: t("qc2.tabs.first_inspection", "First Inspection"),
      icon: <Scan size={20} />,
      description: "First Quality Inspection"
    },
    {
      id: "return",
      label: t("qc2.tabs.return_inspection", "Defects"),
      icon: <RotateCcw size={20} />,
      description: "Return Quality Inspection"
    },
    {
      id: "data",
      label: t("qc2.tabs.data", "Data"),
      icon: <Database size={20} />,
      description: "Inspection Data Records"
    },
    {
      id: "defect-cards",
      label: t("qc2.tabs.defect_cards", "Defect Cards"),
      icon: <FileText size={20} />,
      description: "Defect Card Management"
    }
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // Update current time
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // --- NEW: useCallback to fetch worker stats. This can be called to refresh data. ---
  const fetchWorkerStats = useCallback(async () => {
    if (!user?.emp_id) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-workers-data/today/${user.emp_id}`
      );
      if (!response.ok) {
        throw new Error("Could not fetch worker stats.");
      }
      const data = await response.json();
      setWorkerStats(data);
    } catch (err) {
      console.error(err.message);
      // Don't set a page-level error for this, just log it.
    }
  }, [user]);

  // --- NEW: useEffect to fetch initial stats and after a scan ---
  useEffect(() => {
    fetchWorkerStats();
  }, [fetchWorkerStats, bundleData, sessionData]); // Refreshes when a new bundle or session is loaded

  useEffect(() => {
    const fetchDefects = async () => {
      try {
        setDefectsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/qc2-defects`);
        if (!response.ok) {
          throw new Error("Failed to fetch defect data from the server.");
        }
        const data = await response.json();
        setDefectsData(data);
        setDefectsError(null);
      } catch (err) {
        console.error("Error fetching defects:", err);
        setDefectsError(err.message);
      } finally {
        setDefectsLoading(false);
      }
    };

    fetchDefects();
  }, []);

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
      setQrCodesData({ bundle: [] });
      setGenerateQRDisabled(false);
      setIsReturnInspection(false);
      setSessionData(null);
    }
  }, [bundleData, isReturnInspection]);

  useEffect(() => {
    if (Object.values(tempDefects).some((count) => count > 0) && rejectedOnce) {
      setRejectedOnce(false);
    }
  }, [tempDefects, rejectedOnce]);

  const handlePassBundle = useCallback(async () => {
    if (isPassingBundle) return;

    setIsPassingBundle(true);
    const hasDefects = Object.values(tempDefects).some((count) => count > 0);

    if (!isReturnInspection && hasDefects && !rejectedOnce) {
      setIsPassingBundle(false);
      return;
    }

    try {
      if (isReturnInspection) {
        if (!sessionData || !bundleData || !sessionData.printEntry) {
          throw new Error("Missing required session or bundle data");
        }

        const hasFailDefects = defectTrackingDetails.garments.some((garment) =>
          garment.defects.some(
            (defect) =>
              defect.status === "Fail" &&
              !lockedDefects.has(`${garment.garmentNumber}-${defect.name}`)
          )
        );

        if (hasFailDefects) {
          Swal.fire({
            icon: "error",
            title: "Cannot Pass Bundle",
            text: "There are still failed defects. Please resolve them before passing the bundle."
          });
          setIsPassingBundle(false);
          return;
        }

        const allGarmentsPassed = defectTrackingDetails.garments.every(
          (garment) =>
            garment.defects.every(
              (defect) =>
                defect.status === "OK" ||
                lockedDefects.has(`${garment.garmentNumber}-${defect.name}`)
            )
        );

        if (!allGarmentsPassed) {
          Swal.fire({
            icon: "error",
            title: "Cannot Pass Bundle",
            text: "Not all defects for each garment are marked as OK. Please review and correct the defect status before passing the bundle."
          });
          setIsPassingBundle(false);
          return;
        }

        const {
          sessionTotalPass,
          sessionTotalRejects,
          sessionRejectedGarments,
          inspectionNo,
          printEntry,
          initialTotalPass
        } = sessionData;

        const newTotalRejectGarmentCount = initialTotalPass - sessionTotalPass;

        const updatePayload = {
          $set: {
            totalRepair:
              sessionTotalRejects > 0
                ? bundleData.totalRepair - sessionTotalPass
                : 0,
            totalPass: bundleData.totalPass + sessionTotalPass,
            "printArray.$[elem].totalRejectGarmentCount":
              newTotalRejectGarmentCount,
            "printArray.$[elem].isCompleted": newTotalRejectGarmentCount === 0
          }
        };

        if (sessionTotalRejects > 0) {
          updatePayload.$push = {
            "printArray.$[elem].repairGarmentsDefects": {
              inspectionNo,
              repairGarments: sessionRejectedGarments
            }
          };
        }

        const arrayFilters = [
          { "elem.defect_print_id": printEntry.defect_print_id }
        ];

        const response = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              updateOperations: updatePayload,
              arrayFilters
            })
          }
        );

        if (!response.ok) throw new Error(await response.text());

        if (sessionData.printEntry.defect_print_id) {
          await updatePassBundleStatusForOKDefects(
            sessionData.printEntry.defect_print_id
          );
        }

        setIsReturnInspection(false);
        setSessionData(null);
      } else {
        const inspectionTime = new Date().toLocaleTimeString("en-US", {
          hour12: false
        });
        const updatePayload = { $set: { inspection_time: inspectionTime } };

        const response = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatePayload)
          }
        );

        if (!response.ok) throw new Error(await response.text());
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
      setQrCodesData({ bundle: [] });
      setGenerateQRDisabled(false);
      setPassBundleCountdown(null);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to update inspection record");
    } finally {
      setIsPassingBundle(false);
      setLoadingData(false);
    }
  }, [
    isPassingBundle,
    isReturnInspection,
    tempDefects,
    rejectedOnce,
    sessionData,
    bundleData,
    defectTrackingDetails,
    lockedDefects
  ]);

  useEffect(() => {
    let timer;
    if (passBundleCountdown !== null && !isPassingBundle) {
      if (passBundleCountdown > 0) {
        timer = setInterval(() => {
          setPassBundleCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        handlePassBundle();
        setPassBundleCountdown(null);
      }
    }
    return () => clearInterval(timer);
  }, [passBundleCountdown, isPassingBundle, handlePassBundle]);

  const generateDefectId = () =>
    Math.random().toString(36).substring(2, 12).toUpperCase();

  const generateGarmentDefectId = () =>
    Math.floor(1000000000 + Math.random() * 9000000000).toString();

  const computeDefectArray = useCallback(() => {
    return Object.keys(confirmedDefects)
      .filter((key) => confirmedDefects[key] > 0)
      .map((key) => {
        const defect = defectsData[key];
        return {
          defectName: defect?.english || "Unknown",
          defectCode: defect?.code || 0,
          totalCount: confirmedDefects[key]
        };
      });
  }, [confirmedDefects, defectsData]);

  const groupRejectedGarmentsForBundle = useCallback(() => {
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
  }, [rejectedGarments]);

  const handleStartScanner = () => {
    setScanning(true);
    setInDefectWindow(false);
  };

  const logWorkerScan = async (payload) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-workers-data/log-scan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();
      if (!response.ok) {
        console.error("Failed to log worker scan data:", result.message);
      } else {
        console.log("Worker scan logged successfully.");
        // --- NEW: Refresh stats after a successful log ---
        fetchWorkerStats();
      }
    } catch (err) {
      console.error("Error in logWorkerScan:", err);
    }
  };

  const fetchBundleData = useCallback(
    async (randomId) => {
      try {
        setLoadingData(true);
        const response = await fetch(
          `${API_BASE_URL}/api/bundle-by-random-id/${randomId}`
        );

        if (!response.ok) throw new Error("Bundle not found");

        const data = await response.json();
        const ironingEntry = data.inspectionFirst?.find(
          (entry) => entry.process === "ironing"
        );

        if (!ironingEntry) {
          setError(
            "This bundle has not been ironed yet. Please wait until it is ironed."
          );
          setBundleData(null);
          setInDefectWindow(false);
          setScanning(false);
        } else {
          await logWorkerScan({
            qc_id: user.emp_id,
            moNo: data.selectedMono,
            taskNo: 54,
            qty: ironingEntry.passQty || 0,
            random_id: data.bundle_random_id
          });

          const passQtyIron = ironingEntry.passQty || 0;

          const initialPayload = {
            package_no: data.package_no,
            moNo: data.selectedMono,
            custStyle: data.custStyle,
            color: data.color,
            size: data.size,
            lineNo: data.lineNo,
            department: data.department,
            buyer: data.buyer,
            factory: data.factory,
            country: data.country,
            sub_con: data.sub_con,
            sub_con_factory: data.sub_con_factory,
            checkedQty: passQtyIron,
            totalPass: passQtyIron,
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
            printArray: []
          };

          const createResponse = await fetch(
            `${API_BASE_URL}/api/inspection-pass-bundle`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(initialPayload)
            }
          );

          if (!createResponse.ok)
            throw new Error("Failed to create inspection record");

          setBundleData({ ...data, passQtyIron });
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
    },
    [user, fetchWorkerStats]
  );

  const handleDefectCardScan = useCallback(
    async (bundleData, defect_print_id) => {
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

        // The `totalRejectGarmentCount` from the server is now the source of truth.
        // It has already been decremented if any items were marked as B-Grade.
        const currentRejectCount = printEntry.totalRejectGarmentCount || 0;

        await logWorkerScan({
          qc_id: user.emp_id,
          moNo: bundleData.moNo,
          taskNo: 84,
          qty: currentRejectCount,
          random_id: defect_print_id
        });

        const trackingResponse = await fetch(
          `${API_BASE_URL}/api/defect-track/${defect_print_id}`
        );
        if (!trackingResponse.ok)
          throw new Error("Failed to fetch defect tracking details");

        const trackingData = await trackingResponse.json();

        const rejectedGarmentsInInspection =
          printEntry.re_return_garment?.map((g) => g.garment.garmentNumber) ||
          [];

        const filteredGarments = trackingData.garments
          .filter(
            (garment) =>
              !rejectedGarmentsInInspection.includes(garment.garmentNumber) &&
              !garment.defects.some((defect) => defect.status === "B-Grade") &&
              garment.defects.some((defect) => defect.pass_bundle !== "Pass")
          )
          .map((garment) => ({
            ...garment,
            defects: garment.defects
              .filter((d) => d.pass_bundle !== "Pass")
              .map((defect) => {
                const defectEntry = defectsData.find(
                  (d) => d.english === defect.name
                );
                return {
                  ...defect,
                  displayName: defectEntry
                    ? defectEntry[language] || defect.name
                    : defect.name
                };
              })
          }));

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
          totalRejectGarmentCount: currentRejectCount,
          initialTotalPass: currentRejectCount,
          sessionTotalPass: currentRejectCount,
          sessionTotalRejects: 0,
          sessionDefectsQty: 0,
          sessionRejectedGarments: [],
          inspectionNo
        };

        setSessionData(newSessionData);
        setBundleData(bundleData);
        setTotalPass(currentRejectCount); // Set Total Pass to the correct initial value
        setTotalRejects(0);
        setTotalRepair(bundleData.totalRepair);
        setIsReturnInspection(true);
        setInDefectWindow(true);
        setScanning(false);
        setError(null);

        // --- NEW: Identify B-Grade garments to lock them in the UI ---
        const bGradeGarmentNumbers = new Set();
        const initialLockedDefects = new Set();

        trackingData.garments.forEach((garment) => {
          if (garment.defects.some((d) => d.status === "B Grade")) {
            bGradeGarmentNumbers.add(garment.garmentNumber);
            garment.defects.forEach((defect) => {
              initialLockedDefects.add(
                `${garment.garmentNumber}-${defect.name}`
              );
            });
          }
        });

        // Mark remaining 'Fail' garments as locked
        const initialStatuses = {};
        const initialRejectedGarmentDefects = new Set();

        filteredGarments.forEach((garment) => {
          garment.defects.forEach((defect) => {
            const key = `${garment.garmentNumber}-${defect.name}`;
            initialStatuses[key] = defect.status || "Fail";

            if (defect.status === "Fail") {
              initialLockedDefects.add(key);
              initialRejectedGarmentDefects.add(garment.garmentNumber);
            }
          });
        });

        setDefectTrackingDetails(trackingData);
        setRepairStatuses(initialStatuses);
        setLockedDefects(initialLockedDefects);
        setRejectedGarmentDefects(initialRejectedGarmentDefects);
      } catch (err) {
        setError(err.message);
        setInDefectWindow(false);
        setScanning(false);
      }
    },
    [user, logWorkerScan]
  );

  const handleDefectStatusToggle = (garmentNumber, defectName) => {
    const key = `${garmentNumber}-${defectName}`;

    if (rejectedGarmentDefects.has(garmentNumber)) return;

    if (lockedDefects.has(key)) {
      Swal.fire({
        icon: "error",
        title: "Defect Locked",
        text: "This defect is locked and cannot be changed."
      });
      return;
    }

    if (
      selectedGarment &&
      selectedGarment !== garmentNumber &&
      Object.keys(tempDefects).length > 0
    ) {
      Swal.fire({
        icon: "error",
        title: "Pending Defects",
        text: "Please reject or clear defects for the selected garment first."
      });
      return;
    }

    setSelectedGarment(garmentNumber);

    const newStatus = (repairStatuses[key] || "Fail") === "OK" ? "Fail" : "OK";

    setRepairStatuses((prev) => ({ ...prev, [key]: newStatus }));

    setDefectTrackingDetails((prev) => {
      if (!prev) return prev;

      const updatedGarments = prev.garments.map((garment) => {
        if (garment.garmentNumber === garmentNumber) {
          const updatedDefects = garment.defects.map((defect) => {
            if (defect.name === defectName) {
              let newPassBundleStatus = defect.pass_bundle;

              setTempDefects((prevTempDefects) => {
                const defectIndex = defectsData.findIndex(
                  (d) => d.english === defectName
                );

                if (defectIndex === -1) return prevTempDefects;

                const newTempDefects = { ...prevTempDefects };

                if (newStatus === "Fail") {
                  newTempDefects[defectIndex] = defect.count;
                  setRejectedOnce(true);
                  setRejectedGarmentDefects((prevSet) =>
                    new Set(prevSet).add(garmentNumber)
                  );
                } else {
                  delete newTempDefects[defectIndex];
                  setRejectedGarmentDefects((prevSet) => {
                    const newSet = new Set(prevSet);
                    newSet.delete(garmentNumber);
                    return newSet;
                  });
                }

                return newTempDefects;
              });

              if (newStatus === "Fail") {
                newPassBundleStatus = "Fail";
                setLockedDefects((prevLocked) => new Set(prevLocked).add(key));
              } else if (newStatus === "OK" && defect.status === "Fail") {
                newPassBundleStatus = "Not Checked";
                setLockedDefects((prevLocked) => {
                  const newSet = new Set(prevLocked);
                  newSet.delete(key);
                  return newSet;
                });
              }

              updateDefectStatusInRepairTrackingAndPassBundle(
                sessionData.printEntry.defect_print_id,
                garmentNumber,
                defect.name,
                newStatus,
                newPassBundleStatus
              );

              const defectEntry = defectsData.find(
                (d) => d.english === defect.name
              );

              const newDisplayName = defectEntry
                ? defectEntry[language] || defectEntry.english
                : defect.name;

              return {
                ...defect,
                status: newStatus,
                pass_bundle: newPassBundleStatus,
                displayName: newDisplayName
              };
            }

            return defect;
          });

          return { ...garment, defects: updatedDefects };
        }

        return garment;
      });

      return { ...prev, garments: updatedGarments };
    });
  };

  const updateDefectStatusInRepairTracking = async (
    defect_print_id,
    garmentNumber,
    defectName,
    status
  ) => {
    try {
      const payload = { defect_print_id, garmentNumber, defectName, status };
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status-by-name`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) throw new Error(await response.text());
    } catch (err) {
      setError(`Failed to update defect status: ${err.message}`);
      throw err;
    }
  };

  const updateDefectStatusInRepairTrackingAndPassBundle = async (
    defect_print_id,
    garmentNumber,
    defectName,
    status,
    passBundleStatus
  ) => {
    try {
      const payload = {
        defect_print_id,
        garmentNumber,
        defectName,
        status,
        pass_bundle: passBundleStatus
      };

      const response = await fetch(
        `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status-by-name`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) throw new Error(await response.text());
    } catch (err) {
      setError(
        `Failed to update defect status in repair tracking: ${err.message}`
      );
    }
  };

  const handleScanSuccess = useCallback(
    async (scannedData) => {
      setLoadingData(true);
      setError(null);

      try {
        const defectResponse = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle-by-defect-print-id/${scannedData}`
        );

        if (defectResponse.ok) {
          const bundleDataFromDefectCard = await defectResponse.json();
          await handleDefectCardScan(bundleDataFromDefectCard, scannedData);
          return;
        }

        const orderResponse = await fetch(
          `${API_BASE_URL}/api/bundle-by-random-id/${scannedData}`
        );

        if (orderResponse.ok) {
          await fetchBundleData(scannedData);
          return;
        }

        const inspectionResponse = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle-by-random-id/${scannedData}`
        );

        if (inspectionResponse.ok) {
          setError("This bundle has already been inspected and passed.");
          setScanning(false);
          return;
        }

        throw new Error(
          "Invalid QR Code. Not found as an Order Card or a Defect Card."
        );
      } catch (err) {
        setError(`Error processing scan: ${err.message}`);
      } finally {
        setLoadingData(false);
      }
    },
    [fetchBundleData, handleDefectCardScan, user]
  );

  const handleScanError = useCallback((err) => {
    setError(err.message || "Failed to process scanned data");
  }, []);

  const handleRejectGarment = async () => {
    if (!hasDefects || totalPass <= 0) return;
    if (isReturnInspection) {
      const actualGarmentNumber = selectedGarment;
      if (!actualGarmentNumber) {
        setError("No garment selected for rejection.");
        return;
      }
      setRejectedGarmentNumbers((prev) =>
        new Set(prev).add(actualGarmentNumber)
      );
      const newSessionData = { ...sessionData };
      newSessionData.sessionTotalPass -= 1;
      newSessionData.sessionTotalRejects += 1;
      const garmentDefects = Object.keys(tempDefects)
        .filter((key) => tempDefects[key] > 0)
        .map((key) => {
          const defect = defectsData[key];
          return {
            name: defect?.english || "Unknown",
            code: defect?.code || 0,
            count: tempDefects[key],
            garmentNumber: selectedGarment
          };
        });
      const totalDefectCount = garmentDefects.reduce(
        (sum, d) => sum + d.count,
        0
      );
      newSessionData.sessionDefectsQty += totalDefectCount;
      const reReturnGarment = {
        garment: {
          garmentNumber: actualGarmentNumber,
          time: new Date().toLocaleTimeString("en-US", { hour12: false })
        },
        defects: garmentDefects.map((defect) => ({
          name: defect.name,
          count: defect.count,
          repair:
            defectsData.find((d) => d.english === defect.name)?.repair ||
            "Unknown"
        }))
      };
      newSessionData.sessionRejectedGarments.push({
        totalDefectCount,
        repairDefectArray: garmentDefects.map((d) => ({
          name: d.name,
          code: d.code,
          count: d.count
        })),
        garmentNumber: actualGarmentNumber
      });
      setSessionData(newSessionData);
      setTotalPass((prev) => prev - 1);
      setTotalRejects((prev) => prev + 1);
      setTempDefects({});
      setSelectedGarment(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              updateOperations: {
                $push: {
                  "printArray.$[elem].re_return_garment": reReturnGarment
                }
              },
              arrayFilters: [
                {
                  "elem.defect_print_id": sessionData.printEntry.defect_print_id
                }
              ]
            })
          }
        );
        if (!response.ok) throw new Error(await response.text());
        setLockedGarments((prev) => new Set(prev).add(actualGarmentNumber));
        reReturnGarment.defects.forEach((defect) => {
          const defectKey = `${actualGarmentNumber}-${defect.name}`;
          setLockedDefects((prev) => new Set(prev).add(defectKey));
          setRepairStatuses((prevStatuses) => ({
            ...prevStatuses,
            [defectKey]: "Fail"
          }));
        });
        setRejectedGarmentDefects((prev) =>
          new Set(prev).add(actualGarmentNumber)
        );
        await handleReReturnGarment(actualGarmentNumber, garmentDefects);
        for (const defect of reReturnGarment.defects) {
          await updateDefectStatusInRepairTracking(
            sessionData.printEntry.defect_print_id,
            actualGarmentNumber,
            defect.name,
            "Fail"
          );
        }
      } catch (err) {
        setError(`Failed to process garment rejection: ${err.message}`);
      }
    } else {
      const newConfirmed = { ...confirmedDefects };
      const currentTempDefects = { ...tempDefects };
      Object.keys(currentTempDefects).forEach((key) => {
        if (currentTempDefects[key] > 0)
          newConfirmed[key] =
            (newConfirmed[key] || 0) + currentTempDefects[key];
      });
      setConfirmedDefects(newConfirmed);
      setTempDefects({});
      setSelectedGarment(null);
      setTotalPass((prev) => prev - 1);
      setTotalRejects((prev) => prev + 1);
      setTotalRepair((prev) => prev + 1);
      setRejectedOnce(true);
      const garmentDefectId = generateGarmentDefectId();
      const defects = Object.keys(currentTempDefects)
        .filter((key) => currentTempDefects[key] > 0)
        .map((key) => {
          const defect = defectsData[parseInt(key)];
          return {
            name: defect?.english || "Unknown",
            code: defect?.code || 0,
            count: currentTempDefects[key],
            repair: defect?.repair || "Unknown"
          };
        });
      const totalCount = defects.reduce((sum, d) => sum + d.count, 0);
      const newRejectGarment = {
        totalCount,
        defects,
        garment_defect_id: garmentDefectId,
        rejectTime: new Date().toLocaleTimeString("en-US", { hour12: false })
      };
      const newRejectedGarments = [...rejectedGarments, newRejectGarment];
      setRejectedGarments(newRejectedGarments);
      const updatePayload = {
        totalPass: totalPass - 1,
        totalRejects: totalRejects + 1,
        totalRepair: totalRepair + 1,
        defectQty: defectQty + totalCount,
        rejectGarments: newRejectedGarments
      };
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatePayload)
          }
        );
        if (!response.ok) throw new Error(await response.text());
        await updatePassBundleStatusForRejectedGarment(garmentDefectId);
      } catch (err) {
        setError(`Failed to update inspection record: ${err.message}`);
      }
    }
  };

  const updatePassBundleStatusForRejectedGarment = async (garmentNumber) => {
    try {
      const rejectedGarment = rejectedGarments.find(
        (garment) => garment.garment_defect_id === garmentNumber
      );
      if (!rejectedGarment) {
        console.error(
          `Rejected garment with number ${garmentNumber} not found.`
        );
        return;
      }
      const updatePromises = rejectedGarment.defects.map(async (defect) => {
        let defect_print_id;
        if (isReturnInspection) {
          defect_print_id = sessionData.printEntry.defect_print_id;
        } else {
          defect_print_id = bundleData.printArray.find(
            (item) => item.defect_print_id
          ).defect_print_id;
        }
        const payload = {
          defect_print_id: defect_print_id,
          garmentNumber: garmentNumber,
          defectName: defect.name,
          status: "Fail"
        };
        await updateDefectStatusInRepairTracking(
          defect_print_id,
          garmentNumber,
          defect.name,
          "Fail"
        );
        const response = await fetch(
          `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status-by-name`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to update pass_bundle status for defect ${defect.name}: ${errorText}`
          );
        }
      });
      await Promise.all(updatePromises);
    } catch (err) {
      setError(
        `Failed to update pass_bundle status for rejected garment ${garmentNumber}: ${err.message}`
      );
    }
  };

  const handleReReturnGarment = async (garmentNumber, garmentDefects) => {
    try {
      const failedDefects = garmentDefects.map((defect) => ({
        name: defect.name,
        count: defect.count,
        status: "Fail",
        pass_bundle: "Fail"
      }));
      const payload = {
        defect_print_id: sessionData.printEntry.defect_print_id,
        garmentNumber,
        failedDefects,
        isRejecting: true
      };
      const repairUpdateResponse = await fetch(
        `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      if (!repairUpdateResponse.ok) {
        const errorText = await repairUpdateResponse.text();
        throw new Error(`Failed to update repair tracking: ${errorText}`);
      }
    } catch (err) {
      setError(`Failed to update repair tracking: ${err.message}`);
    }
  };

  const handleGenerateQRCodes = async () => {
    if (generateQRDisabled || isReturnInspection) return;
    setGenerateQRDisabled(true);

    const now = new Date();
    const print_time = now.toLocaleTimeString("en-US", { hour12: false });

    const bundleQrCodes = [];

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
          const defectsWithCode = garment.defects.map((d) => ({
            name: d.name,
            code: d.code,
            count: d.count,
            repair: d.repair || "Unknown"
          }));

          const processedDefects =
            defectsWithCode.length > 6
              ? [
                  ...defectsWithCode.slice(0, 6),
                  {
                    name: "Others",
                    code: 999,
                    count: defectsWithCode
                      .slice(6)
                      .reduce((sum, d) => sum + d.count, 0),
                    repair: "Various"
                  }
                ]
              : defectsWithCode;

          return { garmentNumber: index + 1, defects: processedDefects };
        });

        bundleQrCodes.push({
          package_no: bundleData.package_no,
          moNo: bundleData.selectedMono,
          color: bundleData.color,
          size: bundleData.size,
          lineNo: bundleData.lineNo,
          bundleQty: bundleData.passQtyIron,
          totalRejectGarments: totalRejectGarmentCount,
          totalRejectGarment_Var: totalRejectGarmentCount,
          totalDefectCount: totalPrintDefectCount,
          defects: printData,
          defect_print_id: defectPrintId
        });
      });
    }

    setQrCodesData({
      bundle: bundleQrCodes
    });

    const defectArray = computeDefectArray();
    const updatePayload = {
      inspection_time: print_time,
      defectArray: defectArray
    };

    if (bundleQrCodes.length > 0) {
      updatePayload.printArray = bundleQrCodes.map((qrCode) => ({
        method: "bundle",
        defect_print_id: qrCode.defect_print_id,
        totalRejectGarmentCount: qrCode.totalRejectGarments,
        totalRejectGarment_Var: qrCode.totalRejectGarment_Var,
        totalPrintDefectCount: qrCode.totalDefectCount,
        repairGarmentsDefects: [],
        printData: qrCode.defects,
        isCompleted: false
      }));
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload)
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
      const selectedQrCodes = qrCodesData.bundle;
      for (const qrCode of selectedQrCodes) {
        await bluetoothRef.current.printBundleDefectData(qrCode);
      }

      if (totalRejects > 0) {
        setPassBundleCountdown(3);
      }
    } catch (error) {
      console.error("Print error:", error);
      alert(`Failed to print QR codes: ${error.message || "Unknown error"}`);
    } finally {
      setPrinting(false);
    }
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const updatePassBundleStatusForOKDefects = async (defect_print_id) => {
    try {
      const payload = { defect_print_id: defect_print_id, pass_bundle: "Pass" };

      const response = await fetch(
        `${API_BASE_URL}/api/qc2-repair-tracking/update-pass-bundle-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update pass_bundle status for defect ${defect_print_id}: ${errorText}`
        );
      }
    } catch (err) {
      setError(
        `Failed to update pass_bundle status for OK defects: ${err.message}`
      );
    }
  };

  useEffect(() => {
    setShowDefectBoxes(!isReturnInspection);
  }, [isReturnInspection]);

  if (defectsLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-100 text-indigo-700">
        <Loader2 className="w-10 h-10 animate-spin mr-4" />
        <span className="text-xl font-semibold">Loading Defect Data...</span>
      </div>
    );
  }

  if (defectsError) {
    return (
      <div className="flex justify-center items-center h-screen bg-red-50 text-red-700">
        <AlertCircle className="w-10 h-10 mr-4" />
        <span className="text-xl font-semibold">Error: {defectsError}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
          {/* MOBILE/TABLET LAYOUT (< lg) */}
          <div className="lg:hidden space-y-3">
            {/* Top Row: Title + User */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <Search size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                      QC2 Inspection
                    </h1>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] font-bold text-white">
                        QC
                      </span>
                    </div>
                  </div>
                  {/* Active Tab Indicator - Inline with title */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
                    </div>
                    <p className="text-[10px] text-indigo-100 font-medium truncate">
                      {activeTabData?.label} • Active
                    </p>
                  </div>
                </div>
              </div>

              {user && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2.5 py-1.5 shadow-xl flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md shadow-lg">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white font-bold text-xs leading-tight">
                      {user.job_title || "Inspector"}
                    </p>
                    <p className="text-indigo-200 text-[10px] font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Date and Time Info */}
            <div className="flex items-center justify-center gap-4 text-white/80 text-xs">
              <div className="flex items-center gap-1">
                <span>{currentTime.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{currentTime.toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Main Tabs - Scrollable */}
            {!inDefectWindow && (
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 min-w-max">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`group relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                          isActive
                            ? "bg-white shadow-lg scale-105"
                            : "bg-transparent hover:bg-white/20 hover:scale-102"
                        }`}
                      >
                        <div
                          className={`transition-colors duration-300 ${
                            isActive ? "text-indigo-600" : "text-white"
                          }`}
                        >
                          {React.cloneElement(tab.icon, {
                            className: "w-4 h-4"
                          })}
                        </div>
                        <span
                          className={`text-[10px] font-bold transition-colors duration-300 whitespace-nowrap ${
                            isActive ? "text-indigo-600" : "text-white"
                          }`}
                        >
                          {tab.label}
                        </span>
                        {isActive && (
                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* DESKTOP LAYOUT (>= lg) */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-1">
                {/* Logo Area */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <Search size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-black text-white tracking-tight">
                        QC2 Inspection
                      </h1>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                        <Sparkles size={12} className="text-yellow-300" />
                        <span className="text-xs font-bold text-white">QC</span>
                      </div>
                    </div>
                    <p className="text-sm text-indigo-100 font-medium">
                      Yorkmars (Cambodia) Garment MFG Co., LTD
                    </p>
                  </div>
                </div>

                {/* Date and Time Info */}
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <span>{currentTime.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{currentTime.toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Navigation Bar */}
                {!inDefectWindow && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2">
                      {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`group relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-300 ${
                              isActive
                                ? "bg-white shadow-lg scale-105"
                                : "bg-transparent hover:bg-white/20 hover:scale-102"
                            }`}
                          >
                            <div
                              className={`transition-colors duration-300 ${
                                isActive ? "text-indigo-600" : "text-white"
                              }`}
                            >
                              {React.cloneElement(tab.icon, {
                                className: "w-5 h-5"
                              })}
                            </div>
                            <span
                              className={`text-xs font-bold transition-colors duration-300 ${
                                isActive ? "text-indigo-600" : "text-white"
                              }`}
                            >
                              {tab.label}
                            </span>
                            {isActive && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* Status Indicator */}
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5">
                      <div className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm leading-tight">
                          {activeTabData?.label}
                        </p>
                        <p className="text-indigo-200 text-xs font-medium leading-tight">
                          Active Module
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Info */}
              {user && (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 shadow-xl">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">
                      {user.job_title || "Inspector"}
                    </p>
                    <p className="text-indigo-200 text-xs font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-screen bg-transparent">
        <QC2InspectionSidebar
          handleLanguageChange={handleLanguageChange}
          defectTypeFilter={defectTypeFilter}
          setDefectTypeFilter={setDefectTypeFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
          bluetoothRef={bluetoothRef}
          isBluetoothConnected={isBluetoothConnected}
          language={language}
        />

        <div style={{ position: "absolute", left: "-9999px" }}>
          <BluetoothComponent ref={bluetoothRef} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-grow overflow-y-auto">
            {activeTab === "return" && <DefectNames />}
            {activeTab === "data" && <QC2Data />}
            {activeTab === "defect-cards" && (
              <DefectPrint bluetoothRef={bluetoothRef} />
            )}
            {activeTab === "first" &&
              (!inDefectWindow ? (
                <div className="p-4">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3 shadow-md m-4">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  {/* --- NEW: Render the worker stats component --- */}
                  {workerStats && (
                    <QC2WorkerStats
                      stats={workerStats}
                      onRefresh={fetchWorkerStats}
                      user={user}
                    />
                  )}
                  {/* --- The existing scanner view is now inside this div --- */}
                  <QC2InspectionScannerView
                    onScanSuccess={handleScanSuccess}
                    onScanError={handleScanError}
                    loadingData={loadingData}
                  />
                </div>
              ) : (
                <QC2InspectionWindow
                  defectsData={defectsData}
                  bundleData={bundleData}
                  isReturnInspection={isReturnInspection}
                  sessionData={sessionData}
                  totalPass={totalPass}
                  totalRejects={totalRejects}
                  defectQty={defectQty}
                  hasDefects={hasDefects}
                  selectedGarment={selectedGarment}
                  rejectedGarmentNumbers={rejectedGarmentNumbers}
                  qrCodesData={qrCodesData}
                  isPassingBundle={isPassingBundle}
                  rejectedOnce={rejectedOnce}
                  passBundleCountdown={passBundleCountdown}
                  generateQRDisabled={generateQRDisabled}
                  isBluetoothConnected={isBluetoothConnected}
                  printing={printing}
                  handleRejectGarment={handleRejectGarment}
                  handlePassBundle={handlePassBundle}
                  handleGenerateQRCodes={handleGenerateQRCodes}
                  handlePrintQRCode={handlePrintQRCode}
                  setShowQRPreview={setShowQRPreview}
                  defectTrackingDetails={defectTrackingDetails}
                  language={language}
                  handleLanguageChange={handleLanguageChange}
                  lockedGarments={lockedGarments}
                  repairStatuses={repairStatuses}
                  handleDefectStatusToggle={handleDefectStatusToggle}
                  rejectedGarmentDefects={rejectedGarmentDefects}
                  showDefectBoxes={showDefectBoxes}
                  bGradingGarment={bGradingGarment}
                  tempDefects={tempDefects}
                  setTempDefects={setTempDefects}
                  activeFilter={activeFilter}
                  confirmedDefects={confirmedDefects}
                  sortOption={sortOption}
                />
              ))}
          </main>
        </div>

        <QRCodePreview
          isOpen={showQRPreview}
          onClose={() => setShowQRPreview(false)}
          qrData={qrCodesData.bundle}
          onPrint={handlePrintQRCode}
          mode="bundle"
        />
      </div>

      {/* Custom Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .bg-grid-white {
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            );
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default QC2InspectionPage;
