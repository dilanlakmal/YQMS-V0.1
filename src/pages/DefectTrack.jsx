import React, { useState, useEffect, useCallback, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import Swal from "sweetalert2";
import QrCodeScannerRepair from "../components/forms/QrCodeScannerRepair";
import QRCodeUpload from "../components/forms/QRCodeUpload";
import { useAuth } from "../components/authentication/AuthContext";
import {
  CheckCircle,
  AlertTriangle,
  Ban,
  CalendarDays,
  Clock,
  Camera,
  Upload,
  Scan,
  Database,
  Sparkles,
  User,
  Wrench,
  Save,
  X,
  Info,
  Globe
} from "lucide-react";
import { useTranslation } from "react-i18next";

const DefectTrack = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("khmer");
  const [showScanner, setShowScanner] = useState(true);
  const [defectsMasterList, setDefectsMasterList] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scanMethod, setScanMethod] = useState("camera");
  const [activeTab, setActiveTab] = useState("scan");

  // Define tabs with modern icons
  const tabs = useMemo(() => [
    {
      id: "scan",
      label: t("defectTrack.tabs.scan", "QR Scan"),
      icon: <Scan size={20} />,
      description: "Scan Defect Cards for Repair Tracking"
    },
    {
      id: "data",
      label: t("defectTrack.tabs.data", "Data"),
      icon: <Database size={20} />,
      description: "View Repair Tracking Records"
    }
  ], [t]);

  const activeTabData = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab);
  }, [activeTab, tabs]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // Add useEffect for the clock
  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  // This useEffect to fetch master defects is correct and unchanged.
  useEffect(() => {
    const fetchAllDefects = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/qc2-defects`);
        if (!response.ok) throw new Error("Could not load defect definitions.");
        const data = await response.json();
        setDefectsMasterList(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchAllDefects();
  }, []);

  // This function is correct and unchanged.
  const onScanSuccess = async (decodedText) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/defect-track/${decodedText}`
      );
      if (!response.ok) throw new Error("Failed to fetch defect data");

      const data = await response.json();
      const mappedData = {
        ...data,
        garments: data.garments.map((garment) => {
          const isInitiallyBGrade = garment.defects.some(
            (d) => d.status === "B Grade"
          );
          return {
            ...garment,
            isPermanentlyBGrade: isInitiallyBGrade,
            defects: garment.defects.map((defect) => {
              const defectEntry = defectsMasterList.find(
                (d) => d.english === defect.name
              );
              return {
                ...defect,
                displayName: defectEntry
                  ? defectEntry[language] || defect.name
                  : defect.name,
                status: defect.status || "Fail",
                isLocked: defect.pass_bundle === "Pass"
              };
            })
          };
        })
      };

      setScannedData(mappedData);
      setShowScanner(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onScanError = (err) => {
    setError(err.message || "Scanner error");
  };

  const handleStatusChange = (newStatus, garmentNumber, defectName) => {
    setScannedData((prevData) => {
      const newData = {
        ...prevData,
        garments: prevData.garments.map((garment) => {
          if (garment.garmentNumber !== garmentNumber) {
            return garment;
          }
          return {
            ...garment,
            defects: garment.defects.map((defect) => {
              if (defect.name !== defectName) {
                return defect;
              }
              return { ...defect, status: newStatus };
            })
          };
        })
      };
      return newData;
    });
  };

  // The handleSave function logic is correct and remains unchanged.
  const handleSave = async () => {
    if (!scannedData) return;

    setLoading(true);
    try {
      const bundleResponse = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle-by-defect-print-id/${scannedData.defect_print_id}`
      );

      if (!bundleResponse.ok) {
        console.warn(
          "Could not find the parent inspection bundle. B-Grade records will not be created."
        );
      } else {
        const bundleData = await bundleResponse.json();
        const bundle_random_id = bundleData.bundle_random_id;

        const bGradeGarments = scannedData.garments.filter((g) =>
          g.defects.some((d) => d.status === "B Grade")
        );

        for (const garment of bGradeGarments) {
          const now = new Date();
          const garmentDataForBGrade = {
            garmentNumber: garment.garmentNumber,
            record_date: now.toLocaleDateString("en-US"),
            record_time: now.toLocaleTimeString("en-US", { hour12: false }),
            defectDetails: garment.defects.map((d) => ({
              defectName: d.name,
              defectCount: d.count,
              status: d.status
            }))
          };

          if (garmentDataForBGrade.defectDetails.length === 0) continue;

          const headerData = {
            package_no: scannedData.package_no,
            moNo: scannedData.moNo,
            custStyle: scannedData.custStyle,
            color: scannedData.color,
            size: scannedData.size,
            lineNo: scannedData.lineNo,
            department: scannedData.department
          };

          await fetch(`${API_BASE_URL}/api/qc2-bgrade`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              defect_print_id: scannedData.defect_print_id,
              bundle_random_id: bundle_random_id,
              garmentData: garmentDataForBGrade,
              headerData
            })
          });
        }
      }

      const repairArray = scannedData.garments.flatMap((garment) =>
        garment.defects.map((defect) => ({
          defectName: defect.name,
          defectCount: defect.count,
          repairGroup: defect.repair,
          status: defect.status,
          garmentNumber: garment.garmentNumber,
          pass_bundle: defect.pass_bundle
        }))
      );

      const payload = {
        defect_print_id: scannedData.defect_print_id,
        repairArray,
        package_no: scannedData.package_no,
        moNo: scannedData.moNo,
        custStyle: scannedData.custStyle,
        color: scannedData.color,
        size: scannedData.size,
        lineNo: scannedData.lineNo,
        department: scannedData.department,
        buyer: scannedData.buyer,
        factory: scannedData.factory,
        sub_con: scannedData.sub_con,
        sub_con_factory: scannedData.sub_con_factory
      };

      const response = await fetch(`${API_BASE_URL}/api/repair-tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to save repair tracking data.");

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Data saved successfully!"
      });

      setScannedData(null);
      setShowScanner(true);
    } catch (err) {
      setError(err.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, cancel!"
    }).then((result) => {
      if (result.isConfirmed) {
        setScannedData(null);
        setShowScanner(true);
      }
    });
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (scannedData) {
      setScannedData((prev) => ({
        ...prev,
        garments: prev.garments.map((garment) => ({
          ...garment,
          defects: garment.defects.map((defect) => {
            const defectEntry = defectsMasterList.find(
              (d) => d.english === defect.name
            );
            return {
              ...defect,
              displayName: defectEntry
                ? defectEntry[newLanguage] || defect.name
                : defect.name
            };
          })
        }))
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 dark:from-gray-800 dark:via-slate-800 dark:to-gray-900 shadow-2xl transition-colors duration-300">
        <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
          
          {/* MOBILE/TABLET LAYOUT (< lg) */}
          <div className="lg:hidden space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <Wrench size={20} className="text-white dark:text-gray-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm sm:text-base font-black text-white dark:text-gray-100 tracking-tight truncate">
                      {t("defectTrack.header", "Repair Tracking")}
                    </h1>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={10} className="text-yellow-300 dark:text-yellow-400" />
                      <span className="text-[10px] font-bold text-white dark:text-gray-200">QC</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400 dark:bg-green-500"></span>
                    </div>
                    <p className="text-[10px] text-indigo-100 dark:text-gray-300 font-medium truncate">
                      {activeTabData?.label} • Active
                    </p>
                  </div>
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-2 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-lg px-2.5 py-1.5 shadow-xl flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 rounded-md shadow-lg">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white dark:text-gray-100 font-bold text-xs leading-tight">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 dark:text-gray-300 text-[10px] font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-4 text-white/80 dark:text-gray-300 text-xs">
              <div className="flex items-center gap-1">
                <CalendarDays size={14} />
                <span>{currentTime.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{currentTime.toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex items-center gap-2 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-xl p-1.5 min-w-max">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`group relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-white dark:bg-gray-700 shadow-lg scale-105"
                          : "bg-transparent hover:bg-white/20 dark:hover:bg-gray-600/30 hover:scale-102"
                      }`}
                    >
                      <div className={`transition-colors duration-300 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-white dark:text-gray-200"}`}>
                        {React.cloneElement(tab.icon, { className: "w-4 h-4" })}
                      </div>
                      <span className={`text-[10px] font-bold transition-colors duration-300 whitespace-nowrap ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-white dark:text-gray-200"}`}>
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 dark:bg-green-500 rounded-full shadow-lg animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DESKTOP LAYOUT (>= lg) */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl shadow-lg">
                    <Wrench size={24} className="text-white dark:text-gray-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-black text-white dark:text-gray-100 tracking-tight">
                        {t("defectTrack.header", "Repair Tracking")}
                      </h1>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-full">
                        <Sparkles size={12} className="text-yellow-300 dark:text-yellow-400" />
                        <span className="text-xs font-bold text-white dark:text-gray-200">QC</span>
                      </div>
                    </div>
                    <p className="text-sm text-indigo-100 dark:text-gray-300 font-medium">
                      Yorkmars (Cambodia) Garment MFG Co., LTD
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-white/80 dark:text-gray-300 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} />
                    <span>{currentTime.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{currentTime.toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-xl p-2">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`group relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-300 ${
                            isActive
                              ? "bg-white dark:bg-gray-700 shadow-lg scale-105"
                              : "bg-transparent hover:bg-white/20 dark:hover:bg-gray-600/30 hover:scale-102"
                          }`}
                        >
                          <div className={`transition-colors duration-300 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-white dark:text-gray-200"}`}>
                            {React.cloneElement(tab.icon, { className: "w-5 h-5" })}
                          </div>
                          <span className={`text-xs font-bold transition-colors duration-300 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-white dark:text-gray-200"}`}>
                            {tab.label}
                          </span>
                          {isActive && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 dark:bg-green-500 rounded-full shadow-lg animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-xl px-4 py-2.5">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400 dark:bg-green-500"></span>
                    </div>
                    <div>
                      <p className="text-white dark:text-gray-100 font-bold text-sm leading-tight">
                        {activeTabData?.label}
                      </p>
                      <p className="text-indigo-200 dark:text-gray-300 text-xs font-medium leading-tight">
                        Active Module
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-3 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-xl px-4 py-2.5 shadow-xl">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 rounded-lg shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white dark:text-gray-100 font-bold text-sm leading-tight">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 dark:text-gray-300 text-xs font-medium leading-tight">
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
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <div className="animate-fadeIn">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-4 rounded-lg shadow-md">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-400 dark:text-red-300 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "scan" ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border dark:border-gray-700 transition-colors duration-300">
              {showScanner && (
                <div className="p-6 lg:p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-full mb-4 shadow-lg">
                      <Scan className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Defect Card Scanner
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      Scan a defect card QR code to start repair tracking process
                    </p>
                  </div>

                  {/* Scan Method Selection */}
                  <div className="flex justify-center mb-8">
                    <div className="inline-flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 shadow-inner">
                      <button
                        onClick={() => setScanMethod("camera")}
                        className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                          scanMethod === "camera"
                            ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }`}
                      >
                        <Camera size={20} />
                        <span>Camera Scan</span>
                      </button>
                      <button
                        onClick={() => setScanMethod("upload")}
                        className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                          scanMethod === "upload"
                            ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }`}
                      >
                        <Upload size={20} />
                        <span>Upload Image</span>
                      </button>
                    </div>
                  </div>

                  {/* Scanner Component */}
                    {scanMethod === "camera" ? (
                      <QrCodeScannerRepair
                        onScanSuccess={onScanSuccess}
                        onScanError={onScanError}
                      />
                    ) : (
                      <QRCodeUpload
                        onScanSuccess={onScanSuccess}
                        onScanError={onScanError}
                        disabled={loading}
                      />
                    )}

                  {/* Loading State */}
                  {loading && (
                    <div className="flex flex-col items-center justify-center mt-8 p-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">Processing QR code...</p>
                    </div>
                  )}
                </div>
              )}

              {scannedData && (
                <div className="p-6 lg:p-8">
                  {/* Defect Card Details Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-6 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Defect Card Details
                      </h3>
                      
                      {/* Language Selector */}
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <div className="flex bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
                          {["english", "khmer", "chinese"].map((lang) => (
                            <button
                              key={lang}
                              onClick={() => handleLanguageChange(lang)}
                              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                language === lang
                                  ? "bg-indigo-600 dark:bg-indigo-500 text-white"
                                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                              }`}
                            >
                              {lang === "english" ? "EN" : lang === "khmer" ? "KH" : "CN"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-100 dark:border-gray-600 transition-colors duration-300">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">MO No</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{scannedData.moNo}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-100 dark:border-gray-600 transition-colors duration-300">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Line No</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{scannedData.lineNo}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-100 dark:border-gray-600 transition-colors duration-300">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Color</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{scannedData.color}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-100 dark:border-gray-600 transition-colors duration-300">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Size</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{scannedData.size}</p>
                      </div>
                    </div>
                  </div>

                  {/* Defects Table */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm transition-colors duration-300">
                    <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Defect Status ({language})
                      </h4>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Garment No.
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Defect Name
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Count
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                          {scannedData.garments.map((garment) => {
                            const isBGradeNow = garment.defects.some(
                              (d) => d.status === "B Grade"
                            );
                            return garment.defects.map((defect, index) => (
                              <tr
                                key={`${garment.garmentNumber}-${defect.name}-${index}`}
                                className={`transition-colors duration-200 ${
                                  defect.isLocked
                                    ? "bg-gray-100 dark:bg-gray-700"
                                    : isBGradeNow
                                    ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                                    : defect.status === "OK"
                                    ? "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                              >
                                {index === 0 && (
                                  <td
                                    rowSpan={garment.defects.length}
                                    className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                  >
                                    <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                        {garment.garmentNumber}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-3 ${
                                      defect.status === "OK"
                                        ? "bg-green-400 dark:bg-green-500"
                                        : defect.status === "B Grade"
                                        ? "bg-red-400 dark:bg-red-500"
                                        : "bg-gray-400 dark:bg-gray-500"
                                    }`}></div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {defect.displayName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                    {defect.count}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="flex justify-center">
                                    {defect.isLocked || garment.isPermanentlyBGrade ? (
                                      <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                                        <Ban className="w-3 h-3 mr-1" />
                                        Locked
                                      </div>
                                    ) : (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() =>
                                            handleStatusChange(
                                              "Fail",
                                              garment.garmentNumber,
                                              defect.name
                                            )
                                          }
                                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                            defect.status === "Fail"
                                              ? "bg-gray-600 dark:bg-gray-500 text-white shadow-md transform scale-105"
                                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                                          }`}
                                        >
                                          <Ban className="w-3 h-3 mr-1" />
                                          Fail
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleStatusChange(
                                              "OK",
                                              garment.garmentNumber,
                                              defect.name
                                            )
                                          }
                                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                            defect.status === "OK"
                                              ? "bg-green-600 dark:bg-green-500 text-white shadow-md transform scale-105"
                                              : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800"
                                          }`}
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          OK
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleStatusChange(
                                              "B Grade",
                                              garment.garmentNumber,
                                              defect.name
                                            )
                                          }
                                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                            defect.status === "B Grade"
                                              ? "bg-red-600 dark:bg-red-500 text-white shadow-md transform scale-105"
                                              : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800"
                                          }`}
                                        >
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          B Grade
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ));
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-500 dark:to-green-600 text-white font-semibold rounded-xl shadow-lg hover:from-green-700 hover:to-green-800 dark:hover:from-green-600 dark:hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="inline-flex items-center justify-center px-8 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Data Tab - Enhanced placeholder
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 lg:p-12 border dark:border-gray-700 transition-colors duration-300">
              <div className="text-center max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full mb-6 shadow-inner">
                  <Database className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Repair Tracking Data
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Data view functionality is coming soon. This will display comprehensive repair tracking records, analytics, and reporting features.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Coming Features:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Repair tracking history</li>
                    <li>• Status analytics</li>
                    <li>• Performance reports</li>
                    <li>• Export capabilities</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Custom Styles for Dark Mode */}
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
        
        /* Dark mode specific styles */
        @media (prefers-color-scheme: dark) {
          .bg-grid-white {
            background-image: linear-gradient(
                to right,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
              ),
              linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
              );
          }
        }
        
        /* Custom scrollbar for dark mode */
        .dark .overflow-x-auto::-webkit-scrollbar {
          height: 8px;
        }
        .dark .overflow-x-auto::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 4px;
        }
        .dark .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 4px;
        }
        .dark .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default DefectTrack;

