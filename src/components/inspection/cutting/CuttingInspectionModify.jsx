import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import {
  Search,
  Save,
  Edit,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Layers,
  Scissors,
  AlertTriangle,
  Image as ImageIcon,
  MessageSquare,
  User,
  Package,
  Trash2,
  Plus,
  X,
  Upload,
  Eye,
  FileText,
} from "lucide-react";
import { API_BASE_URL } from "../../../../config";

// Import helper components
import MeasurementNumPad from "./MeasurementNumPad";
import DefectBox from "./DefectBox";

const CuttingInspectionModify = () => {
  const { t, i18n } = useTranslation();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  // Search States
  const [dates, setDates] = useState([]);
  const [mos, setMos] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMo, setSelectedMo] = useState("");
  const [selectedTable, setSelectedTable] = useState("");

  // Data States
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fabricDefectsList, setFabricDefectsList] = useState([]);
  const [cuttingIssuesList, setCuttingIssuesList] = useState([]);

  // View States
  const [activeSizeIndex, setActiveSizeIndex] = useState(0);
  const [activeLocation, setActiveLocation] = useState("Top");
  const [expandedBundles, setExpandedBundles] = useState({});
  const [activeTab, setActiveTab] = useState("measurements");

  // Modal States
  const [showNumPad, setShowNumPad] = useState(false);
  const [numPadTarget, setNumPadTarget] = useState(null);
  const [showDefectBox, setShowDefectBox] = useState(false);
  const [defectBoxTarget, setDefectBoxTarget] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  //AQL result
  const [aqlStatus, setAqlStatus] = useState(null);

  // ==========================================
  // INITIALIZATION
  // ==========================================

  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          fetchDates(),
          fetchFabricDefects(),
          fetchCuttingIssues(),
        ]);
      } catch (error) {
        console.error("Init error:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    init();
  }, []);

  const fetchDates = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cutting-modify/dates`);
      setDates(res.data || []);
    } catch (err) {
      console.error("Failed to fetch dates:", err);
    }
  };

  const fetchFabricDefects = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cutting-fabric-defects`);
      setFabricDefectsList(res.data || []);
    } catch (err) {
      console.error("Failed to fetch fabric defects:", err);
    }
  };

  const fetchCuttingIssues = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cutting-issues-list`);
      setCuttingIssuesList(res.data || []);
    } catch (err) {
      console.error("Failed to fetch cutting issues:", err);
    }
  };

  // fetch AQL status
  const fetchAQLStatus = async () => {
    if (!selectedDate || !selectedMo || !selectedTable) return;

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/cutting-modify/aql-status`,
        {
          params: {
            date: selectedDate,
            moNo: selectedMo,
            tableNo: selectedTable,
          },
        },
      );
      setAqlStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch AQL status:", err);
      setAqlStatus(null);
    }
  };

  // ==========================================
  // CASCADE HANDLERS
  // ==========================================

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    setSelectedMo("");
    setSelectedTable("");
    setMos([]);
    setTables([]);
    setReport(null);

    if (!date) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/api/cutting-modify/mos`, {
        params: { date },
      });
      setMos(res.data || []);
    } catch (err) {
      console.error("Failed to fetch MOs:", err);
    }
  };

  const handleMoChange = async (moNo) => {
    setSelectedMo(moNo);
    setSelectedTable("");
    setTables([]);
    setReport(null);

    if (!moNo || !selectedDate) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/api/cutting-modify/tables`, {
        params: { date: selectedDate, moNo },
      });
      setTables(res.data || []);
    } catch (err) {
      console.error("Failed to fetch tables:", err);
    }
  };

  const handleTableChange = (tableNo) => {
    setSelectedTable(tableNo);
    setReport(null);
  };

  // ==========================================
  // SEARCH & SAVE
  // ==========================================

  const handleSearch = async () => {
    if (!selectedDate || !selectedMo || !selectedTable) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.missingInformation") || "Missing Information",
        text:
          t("cutting.fillRequiredFields") || "Please fill all required fields",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cutting-modify/report`, {
        params: {
          date: selectedDate,
          moNo: selectedMo,
          tableNo: selectedTable,
        },
      });

      if (res.data) {
        setReport(res.data);
        setActiveSizeIndex(0);
        setExpandedBundles({});
        setActiveTab("measurements");
        // Fetch AQL status after loading report
        const aqlRes = await axios.get(
          `${API_BASE_URL}/api/cutting-modify/aql-status`,
          {
            params: {
              date: selectedDate,
              moNo: selectedMo,
              tableNo: selectedTable,
            },
          },
        );
        setAqlStatus(aqlRes.data);
      }
    } catch (err) {
      console.error("Search error:", err);
      Swal.fire({
        icon: "error",
        title: t("cutting.error") || "Error",
        text: t("cutting.reportNotFound") || "Report not found",
      });
      setReport(null);
      setAqlStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle save (update)
  const handleSave = async () => {
    if (!report) return;

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/cutting-modify/update`, report);
      // Refresh AQL status after save
      const aqlRes = await axios.get(
        `${API_BASE_URL}/api/cutting-modify/aql-status`,
        {
          params: {
            date: selectedDate,
            moNo: selectedMo,
            tableNo: selectedTable,
          },
        },
      );
      setAqlStatus(aqlRes.data);
      Swal.fire({
        icon: "success",
        title: t("cutting.success") || "Success",
        text: t("cutting.dataSaved") || "Data saved successfully",
      });
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: t("cutting.error") || "Error",
        text: t("cutting.failedToSaveData") || "Failed to save data",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // MEASUREMENT UPDATE
  // ==========================================

  const handleMeasurementUpdate = useCallback(
    (decimalValue, fractionValue) => {
      if (!numPadTarget || !report) return;
      const { sizeIdx, bundleIdx, partIdx, pointIdx, locationIdx, pcsIdx } =
        numPadTarget;

      try {
        const newReport = JSON.parse(JSON.stringify(report));

        const targetPcs =
          newReport.inspectionData[sizeIdx].bundleInspectionData[bundleIdx]
            .measurementInsepctionData[partIdx].measurementPointsData[pointIdx]
            .measurementValues[locationIdx].measurements[pcsIdx];

        targetPcs.valuedecimal = decimalValue;
        targetPcs.valuefraction = fractionValue;

        const tolerance = newReport.inspectionData[sizeIdx].tolerance;
        targetPcs.status =
          decimalValue !== 0 &&
          (decimalValue < tolerance.min || decimalValue > tolerance.max)
            ? "Fail"
            : "Pass";

        setReport(newReport);
      } catch (error) {
        console.error("Error updating measurement:", error);
      }
    },
    [numPadTarget, report],
  );

  // ==========================================
  // DEFECT UPDATE
  // ==========================================

  const handleDefectChange = useCallback(
    (action, payload) => {
      if (!defectBoxTarget || !report) return;
      const { sizeIdx, bundleIdx, partIdx, locationIdx, pcsIdx } =
        defectBoxTarget;

      try {
        const newReport = JSON.parse(JSON.stringify(report));

        const targetDefectEntry =
          newReport.inspectionData[sizeIdx].bundleInspectionData[bundleIdx]
            .measurementInsepctionData[partIdx].fabricDefects[locationIdx]
            .defectData[pcsIdx];

        let currentDefects = targetDefectEntry.defects || [];

        if (action === "ADD") {
          const defectName = payload;
          const defectInfo = fabricDefectsList.find(
            (d) => d.defectName === defectName,
          );

          if (defectInfo) {
            const existingIndex = currentDefects.findIndex(
              (d) => d.defectName === defectName,
            );
            if (existingIndex >= 0) {
              currentDefects[existingIndex].defectQty =
                (currentDefects[existingIndex].defectQty || 0) + 1;
            } else {
              currentDefects.push({
                defectName: defectInfo.defectName,
                defectQty: 1,
              });
            }
          }
        } else if (action === "REMOVE") {
          currentDefects.splice(payload, 1);
        } else if (action === "UPDATE_COUNT") {
          const { index, count } = payload;
          if (count <= 0) {
            currentDefects.splice(index, 1);
          } else {
            currentDefects[index].defectQty = count;
          }
        }

        targetDefectEntry.defects = currentDefects;
        targetDefectEntry.totalDefects = currentDefects.reduce(
          (sum, d) => sum + (d.defectQty || 0),
          0,
        );

        setReport(newReport);
      } catch (error) {
        console.error("Error updating defects:", error);
      }
    },
    [defectBoxTarget, report, fabricDefectsList],
  );

  // ==========================================
  // CUTTING DEFECTS UPDATE
  // ==========================================

  const handleCuttingDefectUpdate = (sizeIdx, field, value) => {
    const newReport = JSON.parse(JSON.stringify(report));
    if (!newReport.inspectionData[sizeIdx].cuttingDefects) {
      newReport.inspectionData[sizeIdx].cuttingDefects = {
        issues: [],
        additionalComments: "",
        additionalImages: [],
      };
    }
    newReport.inspectionData[sizeIdx].cuttingDefects[field] = value;
    setReport(newReport);
  };

  const handleCuttingIssueUpdate = (sizeIdx, issueIdx, field, value) => {
    const newReport = JSON.parse(JSON.stringify(report));
    newReport.inspectionData[sizeIdx].cuttingDefects.issues[issueIdx][field] =
      value;
    setReport(newReport);
  };

  const addCuttingIssue = (sizeIdx) => {
    const newReport = JSON.parse(JSON.stringify(report));
    if (!newReport.inspectionData[sizeIdx].cuttingDefects) {
      newReport.inspectionData[sizeIdx].cuttingDefects = {
        issues: [],
        additionalComments: "",
        additionalImages: [],
      };
    }
    newReport.inspectionData[sizeIdx].cuttingDefects.issues.push({
      cuttingdefectName: "",
      cuttingdefectNameKhmer: "",
      remarks: "",
      imageData: [],
    });
    setReport(newReport);
  };

  const removeCuttingIssue = (sizeIdx, issueIdx) => {
    const newReport = JSON.parse(JSON.stringify(report));
    newReport.inspectionData[sizeIdx].cuttingDefects.issues.splice(issueIdx, 1);
    setReport(newReport);
  };

  // ==========================================
  // IMAGE HANDLERS
  // ==========================================

  const handleImageUpload = async (e, sizeIdx, issueIdx, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/upload-cutting-image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (!res.data.success) {
        throw new Error(res.data.message);
      }

      const newReport = JSON.parse(JSON.stringify(report));

      if (type === "issue") {
        const images =
          newReport.inspectionData[sizeIdx].cuttingDefects.issues[issueIdx]
            .imageData || [];
        images.push({ no: images.length + 1, path: res.data.url });
        newReport.inspectionData[sizeIdx].cuttingDefects.issues[
          issueIdx
        ].imageData = images;
      } else if (type === "additional") {
        const images =
          newReport.inspectionData[sizeIdx].cuttingDefects.additionalImages ||
          [];
        images.push({ no: images.length + 1, path: res.data.url });
        newReport.inspectionData[sizeIdx].cuttingDefects.additionalImages =
          images;
      }

      setReport(newReport);

      Swal.fire({
        icon: "success",
        title: "Uploaded",
        text: "Image uploaded successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to upload image",
      });
    }
  };

  const handleImageDelete = (sizeIdx, issueIdx, imageIdx, type) => {
    const newReport = JSON.parse(JSON.stringify(report));

    if (type === "issue") {
      newReport.inspectionData[sizeIdx].cuttingDefects.issues[
        issueIdx
      ].imageData.splice(imageIdx, 1);
    } else if (type === "additional") {
      newReport.inspectionData[sizeIdx].cuttingDefects.additionalImages.splice(
        imageIdx,
        1,
      );
    }

    setReport(newReport);
  };

  // ==========================================
  // HELPERS
  // ==========================================

  // helper function image URL construction (handles both relative paths and full URLs)
  const getImageUrl = (path) => {
    if (!path) return "";
    // If path is already a full URL (starts with http:// or https://), use it directly
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    // Otherwise, prepend API_BASE_URL
    return `${API_BASE_URL}${path}`;
  };

  const toggleBundle = (idx) => {
    setExpandedBundles((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getToleranceClass = (val, tolerance) => {
    if (val === null || val === undefined) {
      return "bg-gray-100 text-gray-500";
    }
    if (val < tolerance.min || val > tolerance.max) {
      return "bg-red-100 text-red-700 font-bold";
    }
    return "bg-green-100 text-green-700";
  };

  const formatDisplayValue = (decimal, fraction) => {
    if (fraction && fraction !== "0") return fraction;
    if (decimal === null || decimal === undefined) return "-";
    if (decimal === 0) return "0";
    return decimal.toFixed(4);
  };

  const getDefectDisplayName = (defect) => {
    if (!defect) return "";
    const fd = fabricDefectsList.find(
      (f) => f.defectName === defect.defectName,
    );
    if (!fd) return defect.defectName;
    switch (i18n.language) {
      case "kh":
        return fd.defectNameKhmer || fd.defectNameEng || fd.defectName;
      case "zh":
        return fd.defectNameChinese || fd.defectNameEng || fd.defectName;
      default:
        return fd.defectNameEng || fd.defectName;
    }
  };

  const getCuttingIssueName = (issue) => {
    if (!issue) return "";
    const found = cuttingIssuesList.find(
      (ci) => ci.defectEng === issue.cuttingdefectName,
    );
    if (!found) return issue.cuttingdefectName;
    switch (i18n.language) {
      case "kh":
        return found.defectKhmer || found.defectEng;
      case "zh":
        return found.defectChinese || found.defectEng;
      default:
        return found.defectEng;
    }
  };

  // ==========================================
  // RENDER LOADING STATE
  // ==========================================

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin w-12 h-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4 pb-32">
      {/* Search Header */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Edit className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            {t("cutting.modifyInspection") || "Modify Cutting Inspection"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              {t("cutting.date") || "Date"}
            </label>
            <div className="relative">
              <select
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
              >
                <option value="">
                  {dates.length === 0 ? "No dates" : "Select Date"}
                </option>
                {dates.map((d, idx) => (
                  <option key={idx} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* MO */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              {t("cutting.moNo") || "MO Number"}
            </label>
            <div className="relative">
              <select
                value={selectedMo}
                onChange={(e) => handleMoChange(e.target.value)}
                disabled={!selectedDate}
                className="w-full p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400 text-sm sm:text-base"
              >
                <option value="">
                  {!selectedDate ? "Select date first" : "Select MO"}
                </option>
                {mos.map((m, idx) => (
                  <option key={idx} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              {t("cutting.tableNo") || "Table Number"}
            </label>
            <div className="relative">
              <select
                value={selectedTable}
                onChange={(e) => handleTableChange(e.target.value)}
                disabled={!selectedMo}
                className="w-full p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400 text-sm sm:text-base"
              >
                <option value="">
                  {!selectedMo ? "Select MO first" : "Select Table"}
                </option>
                {tables.map((tbl, idx) => (
                  <option key={idx} value={tbl}>
                    {tbl}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading || !selectedTable}
              className="w-full p-2.5 sm:p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md transition-all active:scale-[0.98] text-sm sm:text-base"
            >
              {loading ? (
                <RefreshCw className="animate-spin w-5 h-5" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {t("cutting.search") || "Search"}
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {report && (
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* General Information Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-4 sm:px-6 py-3 sm:py-4">
              <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                General Information
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <InfoCard
                  icon={<User className="w-4 h-4" />}
                  label="Employee ID"
                  value={report.cutting_emp_id}
                />
                <InfoCard label="Buyer" value={report.buyer} />
                <InfoCard label="Style" value={report.buyerStyle} />
                <InfoCard label="Color" value={report.color} />
                <InfoCard label="Lot No" value={report.lotNo?.join(", ")} />
                <InfoCard
                  label="Total Order Qty"
                  value={report.totalOrderQtyStyle}
                />
              </div>
            </div>
          </div>

          {/* Summary Statistics Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4">
              <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                Inspection Summary
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <StatCard
                  label="Total Bundles"
                  value={report.totalBundleQty}
                  color="blue"
                />
                <StatCard
                  label="Bundles Checked"
                  value={report.bundleQtyCheck}
                  color="green"
                />
                <StatCard
                  label="Inspection Qty"
                  value={report.totalInspectionQty}
                  color="purple"
                />
                <StatCard
                  label="Cutting Type"
                  value={report.cuttingtype}
                  color="orange"
                />
                <StatCard
                  label="Garment Type"
                  value={report.garmentType}
                  color="pink"
                />
              </div>
            </div>
          </div>

          {/* AQL Card */}
          {report && aqlStatus && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div
                className={`px-4 sm:px-6 py-3 sm:py-4 ${
                  aqlStatus.status === "Pass"
                    ? "bg-gradient-to-r from-green-600 to-green-700"
                    : aqlStatus.status === "Fail"
                      ? "bg-gradient-to-r from-red-600 to-red-700"
                      : "bg-gradient-to-r from-yellow-500 to-yellow-600"
                }`}
              >
                <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  Inspection Result
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Status Display */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center ${
                        aqlStatus.status === "Pass"
                          ? "bg-green-100"
                          : aqlStatus.status === "Fail"
                            ? "bg-red-100"
                            : "bg-yellow-100"
                      }`}
                    >
                      {aqlStatus.status === "Pass" ? (
                        <svg
                          className="w-8 h-8 sm:w-10 sm:h-10 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : aqlStatus.status === "Fail" ? (
                        <svg
                          className="w-8 h-8 sm:w-10 sm:h-10 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">
                        Final Status
                      </p>
                      <p
                        className={`text-2xl sm:text-4xl font-bold ${
                          aqlStatus.status === "Pass"
                            ? "text-green-600"
                            : aqlStatus.status === "Fail"
                              ? "text-red-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {aqlStatus.status}
                      </p>
                    </div>
                  </div>

                  {/* AQL Details */}
                  <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Inspected</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-800">
                        {aqlStatus.totalInspectedQty}
                        <span className="text-sm text-gray-400">
                          /{aqlStatus.totalInspectionQty}
                        </span>
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Total Reject</p>
                      <p
                        className={`text-lg sm:text-xl font-bold ${aqlStatus.totalReject > 0 ? "text-red-600" : "text-gray-800"}`}
                      >
                        {aqlStatus.totalReject}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">AQL Accept</p>
                      <p className="text-lg sm:text-xl font-bold text-blue-600">
                        ≤ {aqlStatus.aqlDetails?.acceptableDefects ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Size Tabs */}
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {report.inspectionData?.map((data, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveSizeIndex(idx);
                  setExpandedBundles({});
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-bold whitespace-nowrap transition-all shadow-sm border text-sm sm:text-base ${
                  activeSizeIndex === idx
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Size: {data.inspectedSize}
              </button>
            ))}
          </div>

          {/* Main Data Section */}
          {report.inspectionData?.[activeSizeIndex] && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex overflow-x-auto">
                  {[
                    {
                      id: "measurements",
                      label: "Measurements",
                      icon: Scissors,
                    },
                    {
                      id: "defects",
                      label: "Fabric Defects",
                      icon: AlertTriangle,
                    },
                    {
                      id: "cutting-issues",
                      label: "Cutting Issues",
                      icon: FileText,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base whitespace-nowrap border-b-2 transition-all ${
                        activeTab === tab.id
                          ? "border-blue-600 text-blue-600 bg-white"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6">
                {/* Tolerance & Location Display */}
                {(activeTab === "measurements" || activeTab === "defects") && (
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 bg-blue-50 px-3 sm:px-4 py-2 rounded-lg border border-blue-200">
                      <span className="text-xs font-bold text-blue-600 uppercase">
                        Tolerance:
                      </span>
                      <span className="text-sm sm:text-base font-mono font-bold text-blue-800">
                        {report.inspectionData[activeSizeIndex].tolerance
                          ?.min || 0}{" "}
                        ~{" "}
                        {report.inspectionData[activeSizeIndex].tolerance
                          ?.max || 0}
                      </span>
                    </div>

                    {/* Location Tabs */}
                    <div className="inline-flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                      {["Top", "Middle", "Bottom"].map((loc) => (
                        <button
                          key={loc}
                          onClick={() => setActiveLocation(loc)}
                          className={`px-3 sm:px-6 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all ${
                            activeLocation === loc
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bundles for Measurements and Defects */}
                {(activeTab === "measurements" || activeTab === "defects") && (
                  <div className="space-y-3">
                    {report.inspectionData[
                      activeSizeIndex
                    ].bundleInspectionData?.map((bundle, bIdx) => (
                      <div
                        key={bIdx}
                        className="border border-gray-200 rounded-xl overflow-hidden"
                      >
                        {/* Bundle Header */}
                        <div
                          onClick={() => toggleBundle(bIdx)}
                          className={`px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between cursor-pointer transition-colors ${
                            expandedBundles[bIdx]
                              ? "bg-blue-50"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div
                              className={`p-1.5 rounded-lg transition-colors ${
                                expandedBundles[bIdx]
                                  ? "bg-blue-200 text-blue-800"
                                  : "bg-gray-200 text-gray-500"
                              }`}
                            >
                              {expandedBundles[bIdx] ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-gray-800 text-sm sm:text-base">
                                Bundle #{bundle.bundleNo}
                              </span>
                              <span className="ml-2 text-xs sm:text-sm text-gray-500 font-mono bg-gray-200 px-2 py-0.5 rounded">
                                {bundle.serialLetter}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <Scissors className="w-4 h-4" />
                            <span>Pcs: {bundle.totalPcs}</span>
                          </div>
                        </div>

                        {/* Bundle Content */}
                        {expandedBundles[bIdx] && (
                          <div className="p-3 sm:p-6 bg-white border-t border-gray-100">
                            {activeTab === "measurements" && (
                              <MeasurementGrid
                                bundle={bundle}
                                bIdx={bIdx}
                                activeSizeIndex={activeSizeIndex}
                                activeLocation={activeLocation}
                                tolerance={
                                  report.inspectionData[activeSizeIndex]
                                    .tolerance
                                }
                                onCellClick={(target) => {
                                  setNumPadTarget(target);
                                  setShowNumPad(true);
                                }}
                                getToleranceClass={getToleranceClass}
                                formatDisplayValue={formatDisplayValue}
                                i18n={i18n}
                              />
                            )}

                            {activeTab === "defects" && (
                              <FabricDefectsGrid
                                bundle={bundle}
                                bIdx={bIdx}
                                activeSizeIndex={activeSizeIndex}
                                activeLocation={activeLocation}
                                onDefectCellClick={(target) => {
                                  setDefectBoxTarget(target);
                                  setShowDefectBox(true);
                                }}
                                getDefectDisplayName={getDefectDisplayName}
                                i18n={i18n}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Cutting Issues Tab */}
                {activeTab === "cutting-issues" && (
                  <CuttingIssuesSection
                    sizeData={report.inspectionData[activeSizeIndex]}
                    sizeIdx={activeSizeIndex}
                    cuttingIssuesList={cuttingIssuesList}
                    onIssueUpdate={handleCuttingIssueUpdate}
                    onAddIssue={addCuttingIssue}
                    onRemoveIssue={removeCuttingIssue}
                    onCommentUpdate={(val) =>
                      handleCuttingDefectUpdate(
                        activeSizeIndex,
                        "additionalComments",
                        val,
                      )
                    }
                    onImageUpload={handleImageUpload}
                    onImageDelete={handleImageDelete}
                    onImageView={(path) => {
                      setSelectedImage(path);
                      setShowImageModal(true);
                    }}
                    i18n={i18n}
                    getImageUrl={getImageUrl}
                  />
                )}
              </div>
            </div>
          )}

          {/* Floating Save Button */}
          <div className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 z-50">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 sm:px-8 py-3 sm:py-4 rounded-full shadow-2xl hover:from-green-700 hover:to-green-800 hover:scale-105 active:scale-95 transition-all font-bold text-sm sm:text-lg"
            >
              {loading ? (
                <RefreshCw className="animate-spin w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Save className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
              <span className="hidden sm:inline">
                {t("cutting.saveChanges") || "Save Changes"}
              </span>
              <span className="sm:hidden">Save</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showNumPad && numPadTarget && report && (
        <MeasurementNumPad
          initialValue={
            report.inspectionData[numPadTarget.sizeIdx]?.bundleInspectionData[
              numPadTarget.bundleIdx
            ]?.measurementInsepctionData[numPadTarget.partIdx]
              ?.measurementPointsData[numPadTarget.pointIdx]?.measurementValues[
              numPadTarget.locationIdx
            ]?.measurements[numPadTarget.pcsIdx]?.valuedecimal || 0
          }
          onClose={() => setShowNumPad(false)}
          onInput={(decimalValue, fractionValue) => {
            handleMeasurementUpdate(decimalValue, fractionValue);
            setShowNumPad(false);
          }}
        />
      )}

      {showDefectBox && defectBoxTarget && report && (
        <DefectBox
          defects={
            report.inspectionData[
              defectBoxTarget.sizeIdx
            ]?.bundleInspectionData[
              defectBoxTarget.bundleIdx
            ]?.measurementInsepctionData[
              defectBoxTarget.partIdx
            ]?.fabricDefects[defectBoxTarget.locationIdx]?.defectData[
              defectBoxTarget.pcsIdx
            ]?.defects?.map((d) => ({
              ...d,
              count: d.defectQty,
            })) || []
          }
          fabricDefects={fabricDefectsList}
          onClose={() => setShowDefectBox(false)}
          onAddDefect={(name) => handleDefectChange("ADD", name)}
          onRemoveDefect={(idx) => handleDefectChange("REMOVE", idx)}
          onUpdateDefectCount={(idx, count) =>
            handleDefectChange("UPDATE_COUNT", { index: idx, count })
          }
        />
      )}

      {/* Image Preview Modal */}
      {showImageModal && selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X size={32} />
            </button>
            <img
              src={getImageUrl(selectedImage)} // Changed from `${API_BASE_URL}${selectedImage}`
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='16' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EImage Not Found%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENTS
// ==========================================

// Info Card Component
const InfoCard = ({ icon, label, value }) => (
  <div className="bg-gray-50 rounded-lg p-3">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="text-xs text-gray-500">{label}</span>
    </div>
    <span className="font-semibold text-gray-800 text-sm">{value || "-"}</span>
  </div>
);

// Stat Card Component
const StatCard = ({ label, value, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    pink: "bg-pink-50 border-pink-200 text-pink-700",
  };

  return (
    <div className={`rounded-lg p-3 border ${colorClasses[color]}`}>
      <span className="block text-xs opacity-75 mb-1">{label}</span>
      <span className="font-bold text-lg">{value ?? "-"}</span>
    </div>
  );
};

// Measurement Grid Component
const MeasurementGrid = ({
  bundle,
  bIdx,
  activeSizeIndex,
  activeLocation,
  tolerance,
  onCellClick,
  getToleranceClass,
  formatDisplayValue,
  i18n,
}) => {
  // Get column count
  const getColumnCount = () => {
    try {
      const sample =
        bundle.measurementInsepctionData?.[0]?.measurementPointsData?.[0]?.measurementValues?.find(
          (v) => v.location === activeLocation,
        )?.measurements;
      return sample?.length || 0;
    } catch {
      return 0;
    }
  };

  const columnCount = getColumnCount();

  return (
    <div className="overflow-x-auto -mx-3 sm:mx-0">
      <table className="w-full text-xs sm:text-sm border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-gray-200 font-bold text-gray-700 sticky left-0 bg-gray-100 z-10 min-w-[100px] sm:min-w-[120px]">
              Part Name
            </th>
            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-gray-200 font-bold text-gray-700 min-w-[120px] sm:min-w-[150px]">
              Measurement Point
            </th>
            {Array.from({ length: columnCount }, (_, i) => (
              <th
                key={i}
                className="px-1 sm:px-2 py-2 sm:py-3 text-center border border-gray-200 font-bold text-gray-700 w-14 sm:w-20"
              >
                {activeLocation.charAt(0)}
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bundle.measurementInsepctionData?.map((part, pIdx) =>
            part.measurementPointsData?.map((point, ptIdx) => {
              const locationIdx = point.measurementValues?.findIndex(
                (v) => v.location === activeLocation,
              );
              const locData =
                locationIdx >= 0 ? point.measurementValues[locationIdx] : null;

              if (!locData) return null;

              return (
                <tr key={`${pIdx}-${ptIdx}`} className="hover:bg-gray-50">
                  {ptIdx === 0 && (
                    <td
                      rowSpan={part.measurementPointsData?.length || 1}
                      className="px-2 sm:px-4 py-2 font-semibold text-gray-800 border border-gray-200 bg-gray-50 align-top sticky left-0 z-10"
                    >
                      {i18n.language === "kh"
                        ? part.partNameKhmer || part.partName
                        : part.partName}
                    </td>
                  )}
                  <td
                    className="px-2 sm:px-4 py-2 border border-gray-200 text-gray-600"
                    title={point.measurementPointName}
                  >
                    <div className="truncate max-w-[100px] sm:max-w-[150px]">
                      {i18n.language === "kh"
                        ? point.measurementPointNameKhmer ||
                          point.measurementPointName
                        : point.measurementPointName}
                    </div>
                  </td>
                  {locData.measurements?.map((val, pcsIdx) => (
                    <td
                      key={pcsIdx}
                      onClick={() =>
                        onCellClick({
                          sizeIdx: activeSizeIndex,
                          bundleIdx: bIdx,
                          partIdx: pIdx,
                          pointIdx: ptIdx,
                          locationIdx,
                          pcsIdx,
                        })
                      }
                      className={`px-1 sm:px-2 py-2 text-center border border-gray-200 cursor-pointer hover:opacity-80 transition-all ${getToleranceClass(
                        val.valuedecimal,
                        tolerance,
                      )}`}
                    >
                      {formatDisplayValue(val.valuedecimal, val.valuefraction)}
                    </td>
                  ))}
                </tr>
              );
            }),
          )}
        </tbody>
      </table>
    </div>
  );
};

// Fabric Defects Grid Component
const FabricDefectsGrid = ({
  bundle,
  bIdx,
  activeSizeIndex,
  activeLocation,
  onDefectCellClick,
  getDefectDisplayName,
  i18n,
}) => {
  // Get column count from first part
  const getColumnCount = () => {
    try {
      const sample = bundle.measurementInsepctionData?.[0]?.fabricDefects?.find(
        (f) => f.location === activeLocation,
      )?.defectData;
      return sample?.length || 0;
    } catch {
      return 0;
    }
  };

  const columnCount = getColumnCount();

  return (
    <div className="overflow-x-auto -mx-3 sm:mx-0">
      <table className="w-full text-xs sm:text-sm border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-gray-200 font-bold text-gray-700 sticky left-0 bg-gray-100 z-10 min-w-[100px] sm:min-w-[150px]">
              Part Name
            </th>
            {Array.from({ length: columnCount }, (_, i) => (
              <th
                key={i}
                className="px-1 sm:px-2 py-2 sm:py-3 text-center border border-gray-200 font-bold text-gray-700 min-w-[80px] sm:min-w-[120px]"
              >
                {activeLocation.charAt(0)}
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bundle.measurementInsepctionData?.map((part, pIdx) => {
            const fdIndex = part.fabricDefects?.findIndex(
              (f) => f.location === activeLocation,
            );

            if (fdIndex === -1 || fdIndex === undefined) return null;

            const defectLocation = part.fabricDefects[fdIndex];

            return (
              <tr key={pIdx} className="hover:bg-gray-50">
                <td className="px-2 sm:px-4 py-2 font-semibold text-gray-800 border border-gray-200 bg-gray-50 sticky left-0 z-10">
                  {i18n.language === "kh"
                    ? part.partNameKhmer || part.partName
                    : part.partName}
                </td>
                {defectLocation.defectData?.map((dd, pcsIdx) => (
                  <td
                    key={pcsIdx}
                    onClick={() =>
                      onDefectCellClick({
                        sizeIdx: activeSizeIndex,
                        bundleIdx: bIdx,
                        partIdx: pIdx,
                        locationIdx: fdIndex,
                        pcsIdx,
                      })
                    }
                    className={`px-1 sm:px-2 py-2 border border-gray-200 cursor-pointer hover:opacity-80 transition-all min-h-[50px] ${
                      dd.totalDefects > 0
                        ? "bg-red-100 text-red-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    <div className="text-center min-h-[40px] flex flex-col justify-center">
                      {dd.defects?.length > 0 ? (
                        dd.defects.map((defect, dIdx) => (
                          <div
                            key={dIdx}
                            className="text-xs leading-tight py-0.5"
                          >
                            {getDefectDisplayName(defect)}
                            {defect.defectQty > 1 && ` (${defect.defectQty})`}
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Cutting Issues Section Component
const CuttingIssuesSection = ({
  sizeData,
  sizeIdx,
  cuttingIssuesList,
  onIssueUpdate,
  onAddIssue,
  onRemoveIssue,
  onCommentUpdate,
  onImageUpload,
  onImageDelete,
  onImageView,
  i18n,
  getImageUrl,
}) => {
  const cuttingDefects = sizeData.cuttingDefects || {
    issues: [],
    additionalComments: "",
    additionalImages: [],
  };

  const getIssueName = (issueValue) => {
    const found = cuttingIssuesList.find((ci) => ci.defectEng === issueValue);
    if (!found) return issueValue;
    switch (i18n.language) {
      case "kh":
        return found.defectKhmer || found.defectEng;
      case "zh":
        return found.defectChinese || found.defectEng;
      default:
        return found.defectEng;
    }
  };

  return (
    <div className="space-y-6">
      {/* Issues List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Cutting Defect Issues
          </h4>
          <button
            onClick={() => onAddIssue(sizeIdx)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
          >
            <Plus size={16} />
            Add Issue
          </button>
        </div>

        {cuttingDefects.issues?.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No cutting issues recorded</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cuttingDefects.issues.map((issue, issueIdx) => (
              <div
                key={issueIdx}
                className="border border-gray-200 rounded-xl p-4 bg-gray-50"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                    Issue #{issueIdx + 1}
                  </span>
                  <button
                    onClick={() => onRemoveIssue(sizeIdx, issueIdx)}
                    className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Defect Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Defect Name
                    </label>
                    <select
                      value={issue.cuttingdefectName || ""}
                      onChange={(e) => {
                        const selectedIssue = cuttingIssuesList.find(
                          (ci) => ci.defectEng === e.target.value,
                        );
                        onIssueUpdate(
                          sizeIdx,
                          issueIdx,
                          "cuttingdefectName",
                          e.target.value,
                        );
                        if (selectedIssue) {
                          onIssueUpdate(
                            sizeIdx,
                            issueIdx,
                            "cuttingdefectNameKhmer",
                            selectedIssue.defectKhmer,
                          );
                        }
                      }}
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select Defect</option>
                      {cuttingIssuesList.map((ci, idx) => (
                        <option key={idx} value={ci.defectEng}>
                          {getIssueName(ci.defectEng)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Remarks
                    </label>
                    <input
                      type="text"
                      value={issue.remarks || ""}
                      onChange={(e) =>
                        onIssueUpdate(
                          sizeIdx,
                          issueIdx,
                          "remarks",
                          e.target.value,
                        )
                      }
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Enter remarks..."
                    />
                  </div>
                </div>

                {/* Issue Images */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Images
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {issue.imageData?.map((img, imgIdx) => (
                      <div key={imgIdx} className="relative group">
                        <img
                          src={getImageUrl(img.path)} // Changed from `${API_BASE_URL}${img.path}`
                          alt={`Issue ${issueIdx + 1} Image ${imgIdx + 1}`}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23f3f4f6' width='80' height='80'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='10' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            onClick={() => onImageView(img.path)}
                            className="p-1 bg-white rounded-full"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            onClick={() =>
                              onImageDelete(sizeIdx, issueIdx, imgIdx, "issue")
                            }
                            className="p-1 bg-red-500 text-white rounded-full"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Upload Button */}
                    <label className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                      <Upload size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-400 mt-1">Add</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          onImageUpload(e, sizeIdx, issueIdx, "issue")
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Comments */}
      <div>
        <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          Additional Comments
        </h4>
        <textarea
          value={cuttingDefects.additionalComments || ""}
          onChange={(e) => onCommentUpdate(e.target.value)}
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          placeholder="Enter additional comments here..."
        />
      </div>

      {/* Additional Images */}
      <div>
        <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
          <ImageIcon className="w-5 h-5 text-green-500" />
          Additional Images
        </h4>
        <div className="flex flex-wrap gap-3">
          {cuttingDefects.additionalImages?.map((img, imgIdx) => (
            <div key={imgIdx} className="relative group">
              <img
                src={getImageUrl(img.path)} // Changed from `${API_BASE_URL}${img.path}`
                alt={`Additional Image ${imgIdx + 1}`}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect fill='%23f3f4f6' width='96' height='96'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='10' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => onImageView(img.path)}
                  className="p-1.5 bg-white rounded-full"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() =>
                    onImageDelete(sizeIdx, null, imgIdx, "additional")
                  }
                  className="p-1.5 bg-red-500 text-white rounded-full"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {/* Upload Button */}
          <label className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all">
            <Upload size={20} className="text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Upload</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onImageUpload(e, sizeIdx, null, "additional")}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default CuttingInspectionModify;
