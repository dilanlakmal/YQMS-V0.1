import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";
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
  Button
} from "@mui/material";
import {
  Globe,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Palette,
  Ruler,
  Hash,
  Clock,
  User
} from "lucide-react";

const QC2InspectionReturnDetails = ({
  defectTrackingDetails,
  language,
  handleLanguageChange,
  lockedGarments,
  rejectedGarmentNumbers,
  repairStatuses,
  handleDefectStatusToggle,
  rejectedGarmentDefects
}) => {
  const { t } = useTranslation();
  const [bGradeData, setBGradeData] = useState(null);
  const [loadingBGrade, setLoadingBGrade] = useState(false);
  const [defectsMasterList, setDefectsMasterList] = useState([]);
  const [localLanguage, setLocalLanguage] = useState(language || "english");

  // Fetch defects master list (same as DefectTrack)
  useEffect(() => {
    const fetchAllDefects = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/qc2-defects`);
        if (!response.ok) throw new Error("Could not load defect definitions.");
        const data = await response.json();
        setDefectsMasterList(data);
      } catch (err) {
        console.error("Error fetching defects master list:", err);
      }
    };

    fetchAllDefects();
  }, []);

  // Fetch B-Grade data when defectTrackingDetails changes
  useEffect(() => {
    const fetchBGradeData = async () => {
      if (!defectTrackingDetails?.defect_print_id) return;

      setLoadingBGrade(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/qc2-bgrade/by-defect-id/${defectTrackingDetails.defect_print_id}`
        );

        if (response.ok) {
          const data = await response.json();
          setBGradeData(data);
        } else {
          setBGradeData(null);
        }
      } catch (error) {
        console.error("Error fetching B-Grade data:", error);
        setBGradeData(null);
      } finally {
        setLoadingBGrade(false);
      }
    };

    fetchBGradeData();
  }, [defectTrackingDetails?.defect_print_id]);

  // Update local language when prop changes
  useEffect(() => {
    if (language) {
      setLocalLanguage(language);
    }
  }, [language]);

  // Helper function to get translated defect name (same logic as DefectTrack)
  const getTranslatedDefectName = (defectName) => {
    if (localLanguage === "english") {
      return defectName;
    }

    const defectEntry = defectsMasterList.find((d) => d.english === defectName);

    return defectEntry ? defectEntry[localLanguage] || defectName : defectName;
  };

  // FIXED: Handle language change exactly like DefectTrack
  const handleLanguageChangeInternal = (newLanguage) => {
    console.log("Language changed to:", newLanguage);
    setLocalLanguage(newLanguage);

    if (handleLanguageChange) {
      const syntheticEvent = {
        target: { value: newLanguage }
      };
      handleLanguageChange(syntheticEvent);
    }
  };

  // Helper function to determine effective status considering B-Grade leader status
  const getEffectiveStatus = (garment, defect) => {
    if (defect.status !== "B Grade") {
      return defect.status;
    }

    if (bGradeData && bGradeData.bgradeArray) {
      const bGradeGarment = bGradeData.bgradeArray.find(
        (bg) => bg.garmentNumber === garment.garmentNumber
      );

      if (bGradeGarment) {
        if (bGradeGarment.leader_status === "Not B Grade") {
          return "OK";
        }
      }
    }

    return defect.status;
  };

  // Helper function to get effective button color
  const getEffectiveButtonColor = (garment, defect) => {
    const repairStatusKey = `${garment.garmentNumber}-${defect.name}`;

    if (repairStatuses[repairStatusKey] === "OK") {
      return "success";
    }

    const effectiveStatus = getEffectiveStatus(garment, defect);
    if (effectiveStatus === "OK") {
      return "success";
    }

    return "error";
  };

  // Helper function to get effective button text
  const getEffectiveButtonText = (garment, defect) => {
    const repairStatusKey = `${garment.garmentNumber}-${defect.name}`;

    if (repairStatuses[repairStatusKey] === "OK") {
      return "PASS";
    }

    const effectiveStatus = getEffectiveStatus(garment, defect);
    if (effectiveStatus === "OK") {
      return "PASS";
    }

    return "FAIL";
  };

  // Helper function to get effective row background color
  const getEffectiveRowClassName = (garment, defect) => {
    if (
      lockedGarments.has(garment.garmentNumber) ||
      rejectedGarmentNumbers.has(garment.garmentNumber)
    ) {
      return "bg-gray-100 opacity-60";
    }

    const repairStatusKey = `${garment.garmentNumber}-${defect.name}`;

    if (repairStatuses[repairStatusKey] === "OK") {
      return "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400";
    }

    const effectiveStatus = getEffectiveStatus(garment, defect);
    if (effectiveStatus === "OK") {
      return "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400";
    }

    return "bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-400 hover:from-red-100 hover:to-rose-100";
  };

  // Helper function to check if status was overridden by B-Grade
  const isOverriddenByBGrade = (garment, defect) => {
    if (defect.status !== "B Grade") return false;

    if (bGradeData && bGradeData.bgradeArray) {
      const bGradeGarment = bGradeData.bgradeArray.find(
        (bg) => bg.garmentNumber === garment.garmentNumber
      );

      return bGradeGarment && bGradeGarment.leader_status === "Not B Grade";
    }

    return false;
  };

  // Get status icon
  const getStatusIcon = (garment, defect) => {
    const repairStatusKey = `${garment.garmentNumber}-${defect.name}`;

    if (repairStatuses[repairStatusKey] === "OK") {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }

    const effectiveStatus = getEffectiveStatus(garment, defect);
    if (effectiveStatus === "OK") {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }

    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  if (!defectTrackingDetails) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-6 lg:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <Info className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                  {t("qc2In.defect_card_details", "Defect Card Details")}
                </h1>
                <p className="text-indigo-100 font-medium">
                  Quality Control Inspection Return
                </p>
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-white">
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">Language:</span>
              </div>
              <div className="flex bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1 shadow-lg">
                {["english", "khmer", "chinese"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChangeInternal(lang)}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
                      localLanguage === lang
                        ? "bg-white text-indigo-600 shadow-md transform scale-105"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {lang === "english" ? "EN" : lang === "khmer" ? "KH" : "CN"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bundle Information Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-white/80" />
                <div>
                  <p className="text-xs text-white/60 font-medium uppercase tracking-wide">
                    MO No
                  </p>
                  <p className="text-lg font-bold text-white">
                    {defectTrackingDetails.moNo}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-white/80" />
                <div>
                  <p className="text-xs text-white/60 font-medium uppercase tracking-wide">
                    Line No
                  </p>
                  <p className="text-lg font-bold text-white">
                    {defectTrackingDetails.lineNo}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-white/80" />
                <div>
                  <p className="text-xs text-white/60 font-medium uppercase tracking-wide">
                    Color
                  </p>
                  <p className="text-lg font-bold text-white">
                    {defectTrackingDetails.color}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Ruler className="w-5 h-5 text-white/80" />
                <div>
                  <p className="text-xs text-white/60 font-medium uppercase tracking-wide">
                    Size
                  </p>
                  <p className="text-lg font-bold text-white">
                    {defectTrackingDetails.size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap gap-4 mb-6">
          {loadingBGrade && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 shadow-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium text-blue-700">
                Loading B-Grade status...
              </span>
            </div>
          )}

          {bGradeData && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 shadow-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                B-Grade data loaded - "Not B Grade" items will show as PASS
              </span>
            </div>
          )}
        </div>

        {/* Defects Table */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Defect Status ({localLanguage.toUpperCase()})
              </h2>
              <div className="text-sm text-gray-500">
                {defectTrackingDetails.garments?.reduce(
                  (total, garment) =>
                    total +
                    garment.defects.filter((d) => d.pass_bundle !== "Pass")
                      .length,
                  0
                )}{" "}
                defects found
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Garment
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Repair Group
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Defect Name
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {defectTrackingDetails.garments.some((g) =>
                  g.defects.some((d) => d.pass_bundle !== "Pass")
                ) ? (
                  defectTrackingDetails.garments.map((garment) =>
                    garment.defects
                      .filter((defect) => defect.pass_bundle !== "Pass")
                      .map((defect, index) => {
                        const effectiveStatus = getEffectiveStatus(
                          garment,
                          defect
                        );
                        const isOverridden = isOverriddenByBGrade(
                          garment,
                          defect
                        );

                        return (
                          <tr
                            key={`${garment.garmentNumber}-${defect.name}-${index}-${localLanguage}`}
                            className={`transition-all duration-300 hover:shadow-md ${getEffectiveRowClassName(
                              garment,
                              defect
                            )}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full shadow-sm">
                                  <span className="text-indigo-700 font-bold text-sm">
                                    {garment.garmentNumber}
                                  </span>
                                </div>
                                {isOverridden && (
                                  <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                    <CheckCircle className="w-3 h-3" />
                                    B→PASS
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {defect.repair}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(garment, defect)}
                                <span className="text-sm font-medium text-gray-900">
                                  {getTranslatedDefectName(defect.name)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                {defect.count}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <Button
                                variant="contained"
                                color={getEffectiveButtonColor(garment, defect)}
                                onClick={() =>
                                  handleDefectStatusToggle(
                                    garment.garmentNumber,
                                    defect.name
                                  )
                                }
                                disabled={
                                  rejectedGarmentDefects.has(
                                    garment.garmentNumber
                                  ) &&
                                  rejectedGarmentNumbers.has(
                                    garment.garmentNumber
                                  )
                                }
                                className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                                sx={{
                                  borderRadius: "12px",
                                  fontWeight: "bold",
                                  textTransform: "none",
                                  minWidth: "80px",
                                  height: "36px"
                                }}
                              >
                                {getEffectiveButtonText(garment, defect)}
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                  )
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            No defects found
                          </h3>
                          <p className="text-gray-500">
                            All garments have passed inspection
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .delay-1000 {
          animation-delay: 1s;
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
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default QC2InspectionReturnDetails;
