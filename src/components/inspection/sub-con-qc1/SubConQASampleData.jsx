import axios from "axios";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle,
  ClipboardList,
  Factory,
  FileText,
  Hash,
  List,
  Loader2,
  Palette,
  Percent,
  Save,
  Send,
  TrendingUp,
  User,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";

// Import supporting components
import DefectInputSection from "./DefectInputSection";
import StatusAndImageSection from "./StatusAndImageSection";
import SummaryStatCard from "./SummaryStatCard";

// Helper to create a new, empty data object for a QC
const createNewQcDataObject = () => ({
  checkedQty: 20,
  defects: [],
  spi: { status: "Pass", images: [] },
  measurement: { status: "Pass", images: [] },
  labelling: { status: "Correct", images: [] },
});

const SubConQASampleData = () => {
  const { user } = useAuth();

  // --- ACTIVE TAB STATE ---
  const [activeTab, setActiveTab] = useState("order-data");

  // --- TOP LEVEL FORM STATE ---
  const [inspectionDate, setInspectionDate] = useState(new Date());
  const [reportType, setReportType] = useState(null);
  const [factory, setFactory] = useState(null);
  const [lineNo, setLineNo] = useState(null);
  const [moNo, setMoNo] = useState(null);
  const [color, setColor] = useState(null);
  const [additionalComments, setAdditionalComments] = useState("");
  const [existingReportId, setExistingReportId] = useState(null);

  // --- QC-SPECIFIC STATE ---
  const [selectedQcs, setSelectedQcs] = useState([]);
  const [qcData, setQcData] = useState({});

  // --- UI & DATA FETCHING STATE ---
  const [allFactories, setAllFactories] = useState([]);
  const [qcOptions, setQcOptions] = useState([]);
  const [lineOptions, setLineOptions] = useState([]);
  const [moNoSearchTerm, setMoNoSearchTerm] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [standardDefects, setStandardDefects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFindingReport, setIsFindingReport] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchFactories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-sewing-factories`
        );
        setAllFactories(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to fetch factories", error);
      }
    };
    const fetchStandardDefects = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/qa-standard-defects-list`
        );
        setStandardDefects(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to fetch standard defects", error);
      }
    };
    fetchFactories();
    fetchStandardDefects();
  }, []);

  const debounce = useCallback((func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }, []);

  const debouncedMoSearch = useCallback(
    debounce(async (term) => {
      if (term.length < 3) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/search-mono`, {
          params: { term },
        });
        setMoNoOptions(res.data.map((mo) => ({ value: mo, label: mo })));
      } catch (error) {
        console.error("Error searching MO:", error);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedMoSearch(moNoSearchTerm);
  }, [moNoSearchTerm, debouncedMoSearch]);

  useEffect(() => {
    if (factory) {
      const selectedFactory = allFactories.find(
        (f) => f.factory === factory.value
      );
      setLineOptions(
        selectedFactory?.lineList.map((line) => ({
          value: line,
          label: line,
        })) || []
      );
    } else {
      setLineOptions([]);
    }

    // Check if QC2 is selected, if yes set NA, otherwise set null
    if (reportType?.value === "QC2") {
      setLineNo({ value: "NA", label: "NA" }); // ✅ Set NA for QC2
    } else {
      setLineNo(null);
    }
  }, [factory, allFactories, reportType]); // ✅ Add reportType to dependencies

  useEffect(() => {
    if (reportType?.value === "QC2") setLineNo({ value: "NA", label: "NA" });
  }, [reportType]);

  useEffect(() => {
    const fetchColors = async () => {
      if (!moNo) {
        setColorOptions([]);
        setColor(null);
        return;
      }
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/order-details/${moNo.value}`
        );
        setColorOptions(
          res.data.colors.map((c) => ({ value: c.original, label: c.original }))
        );
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };
    fetchColors();
  }, [moNo]);

  useEffect(() => {
    if (factory && allFactories.length > 0) {
      const selectedFactoryData = allFactories.find(
        (f) => f.factory === factory.value
      );
      if (selectedFactoryData && selectedFactoryData.qcList) {
        setQcOptions(
          selectedFactoryData.qcList.map((qc) => ({
            value: qc.qcID,
            label: `${qc.qcID} (${qc.qcName})`,
            qcName: qc.qcName,
          }))
        );
      } else {
        setQcOptions([]);
      }
    } else {
      setQcOptions([]);
    }
    setSelectedQcs([]);
    setQcData({});
  }, [factory, allFactories]);

  // --- QC MANAGEMENT LOGIC ---
  const handleAddQc = (selectedOption) => {
    if (!selectedOption) return;

    setSelectedQcs([...selectedQcs, selectedOption]);

    if (!qcData[selectedOption.value]) {
      setQcData((prev) => ({
        ...prev,
        [selectedOption.value]: createNewQcDataObject(),
      }));
    }

    // Auto-switch to the newly added QC tab
    setActiveTab(`qc-${selectedOption.value}`);
  };

  const handleRemoveQc = (qcToRemove) => {
    setSelectedQcs((prev) =>
      prev.filter((qc) => qc.value !== qcToRemove.value)
    );

    if (qcToRemove && qcToRemove.value) {
      const newQcData = { ...qcData };
      delete newQcData[qcToRemove.value];
      setQcData(newQcData);
    }

    // If we're on the tab being removed, switch to QC Data tab
    if (activeTab === `qc-${qcToRemove.value}`) {
      setActiveTab("qc-data");
    }
  };

  const availableQcOptions = useMemo(() => {
    const currentlySelectedIds = new Set(selectedQcs.map((qc) => qc.value));
    return qcOptions.filter(
      (option) => !currentlySelectedIds.has(option.value)
    );
  }, [qcOptions, selectedQcs]);

  const updateQcDataField = (qcId, field, value) => {
    setQcData((prev) => ({
      ...prev,
      [qcId]: { ...prev[qcId], [field]: value },
    }));
  };

  // --- Check for existing report ---
  useEffect(() => {
    const findExistingReport = async () => {
      if (inspectionDate && reportType && factory && lineNo && moNo && color) {
        setIsFindingReport(true);
        try {
          const params = {
            inspectionDate: inspectionDate.toISOString().split("T")[0],
            reportType: reportType.value,
            factory: factory.value,
            lineNo: lineNo.value,
            moNo: moNo.value,
            color: color.value,
          };
          const res = await axios.get(
            `${API_BASE_URL}/api/subcon-sewing-qa-report/find`,
            { params }
          );

          if (res.data) {
            const report = res.data;
            setExistingReportId(report._id);
            setAdditionalComments(report.additionalComments || "");

            const loadedSelectedQcs = report.qcList.map((qc) => ({
              value: qc.qcID,
              label: `${qc.qcID} (${qc.qcName})`,
              qcName: qc.qcName,
            }));
            setSelectedQcs(loadedSelectedQcs);

            const loadedQcData = {};
            report.qcData.forEach((data) => {
              loadedQcData[data.qcID] = {
                checkedQty: data.checkedQty,
                defects: data.defectList.map((d) => ({
                  ...d,
                  tempId: Math.random(),
                })),
                spi: data.spi,
                measurement: data.measurement,
                labelling: data.labelling,
              };
            });
            setQcData(loadedQcData);

            Swal.fire({
              icon: "info",
              title: "Previous Report Loaded",
              text: "You are editing an existing QA report.",
              toast: true,
              position: "top-end",
              showConfirmButton: false,
              timer: 3500,
            });
          } else {
            setExistingReportId(null);
            setSelectedQcs([]);
            setQcData({});
            setAdditionalComments("");
          }
        } catch (error) {
          console.error("Error checking for existing QA report:", error);
        } finally {
          setIsFindingReport(false);
        }
      }
    };
    findExistingReport();
  }, [inspectionDate, reportType, factory, lineNo, moNo, color]);

  // --- COMPUTED VALUES ---
  const qcSummary = useMemo(() => {
    const summary = {};
    let totalCheckedQty = 0;
    let totalRejectPcs = 0;
    let totalOverallDefectQty = 0;
    let totalMinorCount = 0;
    let totalMajorCount = 0;
    let totalCriticalCount = 0;

    selectedQcs.forEach((qc) => {
      const data = qcData[qc.value] || {};
      const defects = data.defects || [];
      const checkedQty = Number(data.checkedQty) || 0;

      const totalDefectQty = defects.reduce(
        (sum, defect) => sum + (Number(defect.qty) || 0),
        0
      );

      // Count by severity status
      const minorCount = defects
        .filter((d) => d.standardStatus === "Minor" && d.defectCode)
        .reduce((sum, d) => sum + (Number(d.qty) || 0), 0);

      const majorCount = defects
        .filter((d) => d.standardStatus === "Major" && d.defectCode)
        .reduce((sum, d) => sum + (Number(d.qty) || 0), 0);

      const criticalCount = defects
        .filter((d) => d.standardStatus === "Critical" && d.defectCode)
        .reduce((sum, d) => sum + (Number(d.qty) || 0), 0);

      const rejectPcs = new Set(
        defects.filter((d) => d.defectCode).map((d) => d.pcsNo)
      ).size;

      const defectRate =
        checkedQty > 0
          ? ((rejectPcs / checkedQty) * 100).toFixed(2) + "%"
          : "0.00%";

      // Determine if above threshold for reject pieces
      const hasMajorOrCritical = majorCount > 0 || criticalCount > 0;

      summary[qc.value] = {
        totalDefectQty,
        rejectPcs,
        defectRate,
        checkedQty,
        minorCount,
        majorCount,
        criticalCount,
        hasMajorOrCritical,
      };

      totalCheckedQty += checkedQty;
      totalRejectPcs += rejectPcs;
      totalOverallDefectQty += totalDefectQty;
      totalMinorCount += minorCount;
      totalMajorCount += majorCount;
      totalCriticalCount += criticalCount;
    });

    const totalDefectRate =
      totalCheckedQty > 0
        ? ((totalRejectPcs / totalCheckedQty) * 100).toFixed(2) + "%"
        : "0.00%";

    const hasTotalMajorOrCritical =
      totalMajorCount > 0 || totalCriticalCount > 0;

    return {
      individual: summary,
      totals: {
        totalCheckedQty,
        totalRejectPcs,
        totalOverallDefectQty,
        totalDefectRate,
        totalMinorCount,
        totalMajorCount,
        totalCriticalCount,
        hasTotalMajorOrCritical,
      },
    };
  }, [qcData, selectedQcs]);

  const isFormHeaderInvalid = useMemo(() => {
    return (
      !reportType ||
      !factory ||
      !lineNo ||
      !moNo ||
      !color ||
      selectedQcs.length === 0
    );
  }, [reportType, factory, lineNo, moNo, color, selectedQcs]);

  // --- SAVE/UPDATE HANDLER ---
  const handleSave = async () => {
    if (isFormHeaderInvalid) {
      Swal.fire(
        "Incomplete Form",
        "Please fill all header fields and select at least one valid QC.",
        "warning"
      );
      return;
    }
    setIsSubmitting(true);

    const finalQcDataForPayload = selectedQcs.map((qc) => {
      const data = qcData[qc.value];
      const summary = qcSummary.individual[qc.value];
      return {
        qcID: qc.value,
        qcName: qc.qcName,
        checkedQty: data.checkedQty,
        rejectPcs: summary.rejectPcs,
        totalDefectQty: summary.totalDefectQty,
        defectList: data.defects
          .filter((d) => d.defectCode)
          .map(({ tempId, ...rest }) => rest),
        spi: data.spi,
        measurement: data.measurement,
        labelling: data.labelling,
      };
    });

    const factoryData = allFactories.find((f) => f.factory === factory.value);
    const payload = {
      inspectionDate,
      reportType: reportType.value,
      factory: factory.value,
      factory_second_name: factoryData?.factory_second_name || "",
      lineNo: lineNo.value,
      moNo: moNo.value,
      color: color.value,
      qcList: selectedQcs.map((qc) => ({
        qcID: qc.value,
        qcName: qc.qcName,
      })),
      preparedBy: { empId: user.emp_id, engName: user.eng_name },
      qcData: finalQcDataForPayload,
      additionalComments,
    };

    try {
      if (existingReportId) {
        await axios.put(
          `${API_BASE_URL}/api/subcon-sewing-qa-reports/${existingReportId}`,
          payload
        );
        Swal.fire({
          icon: "success",
          title: "Report Updated!",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await axios.post(
          `${API_BASE_URL}/api/subcon-sewing-qa-reports`,
          payload
        );
        Swal.fire({
          icon: "success",
          title: "Report Saved!",
          timer: 2000,
          showConfirmButton: false,
        });
      }
      setLineNo(null);
      setMoNo(null);
      setColor(null);
      setSelectedQcs([]);
      setQcData({});
      setExistingReportId(null);
      setActiveTab("order-data");
    } catch (error) {
      console.error("Error saving QA report:", error);
      Swal.fire(
        "Save Failed",
        error.response?.data?.error || "An unexpected error occurred.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const reactSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: state.isFocused ? "#6366f1" : "var(--color-border)",
      borderWidth: "2px",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
      "&:hover": { borderColor: "#6366f1" },
      minHeight: "44px",
      borderRadius: "0.5rem",
      transition: "all 0.2s",
    }),
    singleValue: (base) => ({
      ...base,
      color: "var(--color-text-primary)",
      fontWeight: "500",
    }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderRadius: "0.5rem",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      border: "1px solid var(--color-border)",
      zIndex: 50,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#6366f1"
        : isFocused
        ? "var(--color-bg-tertiary)"
        : "transparent",
      color: isSelected ? "white" : "var(--color-text-primary)",
      padding: "0.75rem 1rem",
      cursor: "pointer",
      borderRadius: "0.375rem",
      transition: "all 0.15s",
      fontWeight: isSelected ? "600" : "400",
    }),
    placeholder: (base) => ({ ...base, color: "#9ca3af", fontSize: "0.95rem" }),
  };

  // --- TAB DEFINITIONS ---
  const tabs = [
    {
      id: "order-data",
      label: "Order Data",
      icon: <ClipboardList className="w-4 h-4" />,
      enabled: true,
    },
    {
      id: "qc-data",
      label: "QC Data",
      icon: <Users className="w-4 h-4" />,
      enabled: true,
    },
    ...selectedQcs.map((qc) => ({
      id: `qc-${qc.value}`,
      label: qc.value,
      icon: <UserCheck className="w-4 h-4" />,
      enabled: true,
    })),
    {
      id: "summary",
      label: "Data",
      icon: <TrendingUp className="w-4 h-4" />,
      enabled: selectedQcs.length > 0,
    },
    {
      id: "submit",
      label: "Submit",
      icon: <Send className="w-4 h-4" />,
      enabled: selectedQcs.length > 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Page Title */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm sm:text-xl font-bold text-gray-800 dark:text-gray-100">
                Yorkmars Garment MFG Co., LTD | Sub-Con QA Inspection
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Prepared by:{" "}
                <span className="font-semibold">
                  {user?.emp_id} | {user?.eng_name} | {user.job_title}
                </span>
              </p>
            </div>
            <FileText className="w-12 h-12 text-indigo-500" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => tab.enabled && setActiveTab(tab.id)}
                disabled={!tab.enabled}
                className={`flex items-center gap-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-4 ${
                  activeTab === tab.id
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    : tab.enabled
                    ? "border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    : "border-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* ORDER DATA TAB */}
          {activeTab === "order-data" && (
            <div className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                  <ClipboardList className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Order Information
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Fill in the inspection details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {/* Inspection Date */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    Inspection Date
                  </label>
                  <DatePicker
                    selected={inspectionDate}
                    onChange={setInspectionDate}
                    dateFormat="MM/dd/yyyy"
                    className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 transition-all duration-200 text-gray-900 dark:text-gray-100 font-medium"
                    wrapperClassName="w-full"
                    menuPortalTarget={document.body}
                  />
                </div>

                {/* Report Type */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    Report Type
                  </label>
                  <Select
                    options={[
                      { value: "QC1", label: "QC1 - Inline Sewing" },
                      { value: "QC2", label: "QC2 - Inline Finishing" },
                    ]}
                    value={reportType}
                    onChange={setReportType}
                    styles={reactSelectStyles}
                    placeholder="Select type..."
                    menuPortalTarget={document.body}
                  />
                </div>

                {/* Factory */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Factory className="w-4 h-4 text-indigo-500" />
                    Factory
                  </label>
                  <Select
                    options={allFactories.map((f) => ({
                      value: f.factory,
                      label: f.factory_second_name
                        ? `${f.factory} (${f.factory_second_name})`
                        : f.factory,
                    }))}
                    value={factory}
                    onChange={setFactory}
                    styles={reactSelectStyles}
                    placeholder="Select factory..."
                    menuPortalTarget={document.body}
                  />
                </div>

                {/* Line No */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <List className="w-4 h-4 text-indigo-500" />
                    Line Number
                  </label>
                  <Select
                    options={lineOptions}
                    value={lineNo}
                    onChange={setLineNo}
                    styles={reactSelectStyles}
                    isDisabled={!factory || reportType?.value === "QC2"}
                    placeholder="Select line..."
                    menuPortalTarget={document.body}
                  />
                </div>

                {/* MO No */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-500" />
                    MO Number
                  </label>
                  <Select
                    options={moNoOptions}
                    value={moNo}
                    onInputChange={setMoNoSearchTerm}
                    onChange={setMoNo}
                    styles={reactSelectStyles}
                    placeholder="Type to search..."
                    menuPortalTarget={document.body}
                  />
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-500" />
                    Color
                  </label>
                  <Select
                    options={colorOptions}
                    value={color}
                    onChange={setColor}
                    styles={reactSelectStyles}
                    isDisabled={!moNo}
                    placeholder="Select color..."
                    menuPortalTarget={document.body}
                  />
                </div>
              </div>

              {/* Navigation Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab("qc-data")}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Next: QC Data
                  <Users className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* QC DATA TAB */}
          {activeTab === "qc-data" && (
            <div className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    QC Inspector Selection
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select QC Inspectors
                  </p>
                </div>
              </div>

              {/* QC Selector */}
              <div className="space-y-4">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Add QC Inspector
                </label>
                <Select
                  options={availableQcOptions}
                  onChange={handleAddQc}
                  value={null}
                  styles={reactSelectStyles}
                  isDisabled={!factory}
                  placeholder="Select a QC inspector to add..."
                />
              </div>

              {/* Selected QCs Display */}
              {selectedQcs.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Selected Inspectors ({selectedQcs.length})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedQcs.map((qc) => (
                      <div
                        key={qc.value}
                        className="relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-4 hover:shadow-lg transition-all duration-200 group"
                      >
                        <button
                          onClick={() => handleRemoveQc(qc)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 transform hover:scale-110 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            <User className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                              {qc.value}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {qc.qcName}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedQcs.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                  <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No QC inspectors selected
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Please select at least one QC inspector from the dropdown
                    above
                  </p>
                </div>
              )}
            </div>
          )}

          {/* INDIVIDUAL QC TABS */}
          {selectedQcs.map((qc) => {
            const qcId = qc.value;
            const data = qcData[qcId];
            const uploadMetadata = {
              reportType: reportType?.value,
              factory: factory?.value,
              lineNo: lineNo?.value,
              moNo: moNo?.value,
              color: color?.value,
              qcId,
            };

            if (activeTab !== `qc-${qcId}` || !data) return null;

            return (
              <div key={qcId} className="p-4 sm:p-6 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                      {qc.label}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Inspector quality checks and defects
                    </p>
                  </div>
                </div>

                {/* Checked Qty */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500" />
                    Checked Quantity
                  </label>
                  <input
                    type="number"
                    value={data.checkedQty}
                    onChange={(e) =>
                      updateQcDataField(
                        qcId,
                        "checkedQty",
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-gray-100 font-semibold text-lg"
                    min="0"
                  />
                </div>

                {/* Defect Input Section */}
                <DefectInputSection
                  defects={data.defects}
                  setDefects={(newDefects) =>
                    updateQcDataField(qcId, "defects", newDefects)
                  }
                  uploadMetadata={uploadMetadata}
                  standardDefects={standardDefects}
                />

                {/* Status Sections */}
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                    Quality Checkpoints
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                    <StatusAndImageSection
                      title="SPI"
                      subtitle="Sewing Process Inspection"
                      status={data.spi.status}
                      setStatus={(val) =>
                        updateQcDataField(qcId, "spi", {
                          ...data.spi,
                          status: val,
                        })
                      }
                      options={[
                        { value: "Pass", label: "Pass" },
                        { value: "Fail", label: "Fail" },
                      ]}
                      images={data.spi.images}
                      setImages={(imgs) =>
                        updateQcDataField(qcId, "spi", {
                          ...data.spi,
                          images: imgs,
                        })
                      }
                      uploadMetadata={uploadMetadata}
                      gradientFrom="from-blue-500"
                      gradientTo="to-cyan-500"
                      iconColor="text-blue-600"
                      iconBg="bg-blue-100 dark:bg-blue-900/30"
                    />
                    <StatusAndImageSection
                      title="Measurement"
                      subtitle="Dimension Verification"
                      status={data.measurement.status}
                      setStatus={(val) =>
                        updateQcDataField(qcId, "measurement", {
                          ...data.measurement,
                          status: val,
                        })
                      }
                      options={[
                        { value: "Pass", label: "Pass" },
                        { value: "Fail", label: "Fail" },
                      ]}
                      images={data.measurement.images}
                      setImages={(imgs) =>
                        updateQcDataField(qcId, "measurement", {
                          ...data.measurement,
                          images: imgs,
                        })
                      }
                      uploadMetadata={uploadMetadata}
                      gradientFrom="from-purple-500"
                      gradientTo="to-pink-500"
                      iconColor="text-purple-600"
                      iconBg="bg-purple-100 dark:bg-purple-900/30"
                    />
                    <StatusAndImageSection
                      title="Labelling"
                      subtitle="Label Accuracy Check"
                      status={data.labelling.status}
                      setStatus={(val) =>
                        updateQcDataField(qcId, "labelling", {
                          ...data.labelling,
                          status: val,
                        })
                      }
                      options={[
                        { value: "Correct", label: "Correct" },
                        { value: "Incorrect", label: "Incorrect" },
                      ]}
                      images={data.labelling.images}
                      setImages={(imgs) =>
                        updateQcDataField(qcId, "labelling", {
                          ...data.labelling,
                          images: imgs,
                        })
                      }
                      uploadMetadata={uploadMetadata}
                      gradientFrom="from-emerald-500"
                      gradientTo="to-teal-500"
                      iconColor="text-emerald-600"
                      iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* SUMMARY TAB */}
          {activeTab === "summary" && selectedQcs.length > 0 && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Inspection Summary
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    QC Summary Statistics
                  </p>
                </div>
              </div>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
                <SummaryStatCard
                  cardType="checkedQty"
                  title="Checked Quantity"
                  icon={<Check className="w-6 h-6" />}
                  gradientFrom="from-blue-500"
                  gradientTo="to-cyan-500"
                  iconBg="bg-blue-100 dark:bg-blue-900/30"
                  iconColor="text-blue-600 dark:text-blue-400"
                  qcData={selectedQcs.map((qc) => ({
                    qcLabel: qc.value,
                    value: qcSummary.individual[qc.value]?.checkedQty || 0,
                  }))}
                  total={qcSummary.totals.totalCheckedQty}
                />

                {/* Reject Pcs Card - Threshold based on Major/Critical per QC */}
                <SummaryStatCard
                  cardType="rejectPcs"
                  title="Reject Pieces"
                  icon={<UserX className="w-6 h-6" />}
                  gradientFrom="from-red-500"
                  gradientTo="to-pink-500"
                  iconBg="bg-red-100 dark:bg-red-900/30"
                  iconColor="text-red-600 dark:text-red-400"
                  qcData={selectedQcs.map((qc) => ({
                    qcLabel: qc.value,
                    value: qcSummary.individual[qc.value]?.rejectPcs || 0,
                    hasMajorOrCritical:
                      qcSummary.individual[qc.value]?.hasMajorOrCritical ||
                      false,
                  }))}
                  total={qcSummary.totals.totalRejectPcs}
                />

                {/* Defect Qty Card - Show breakdown with threshold per QC */}
                <SummaryStatCard
                  cardType="defectQty"
                  title="Total Defects"
                  icon={<AlertTriangle className="w-6 h-6" />}
                  gradientFrom="from-amber-500"
                  gradientTo="to-orange-500"
                  iconBg="bg-amber-100 dark:bg-amber-900/30"
                  iconColor="text-amber-600 dark:text-amber-400"
                  qcData={selectedQcs.map((qc) => ({
                    qcLabel: qc.value,
                    value: qcSummary.individual[qc.value]?.totalDefectQty || 0,
                    minorCount: qcSummary.individual[qc.value]?.minorCount || 0,
                    majorCount: qcSummary.individual[qc.value]?.majorCount || 0,
                    criticalCount:
                      qcSummary.individual[qc.value]?.criticalCount || 0,
                  }))}
                  total={qcSummary.totals.totalOverallDefectQty}
                  totalMinor={qcSummary.totals.totalMinorCount}
                  totalMajor={qcSummary.totals.totalMajorCount}
                  totalCritical={qcSummary.totals.totalCriticalCount}
                />

                {/* Defect Rate Card - Threshold based on rate and defect type per QC */}
                <SummaryStatCard
                  cardType="defectRate"
                  title="Defect Rate"
                  icon={<Percent className="w-6 h-6" />}
                  gradientFrom="from-purple-500"
                  gradientTo="to-indigo-500"
                  iconBg="bg-purple-100 dark:bg-purple-900/30"
                  iconColor="text-purple-600 dark:text-purple-400"
                  qcData={selectedQcs.map((qc) => ({
                    qcLabel: qc.value,
                    value: qcSummary.individual[qc.value]?.defectRate || "0%",
                    hasMajorOrCritical:
                      qcSummary.individual[qc.value]?.hasMajorOrCritical ||
                      false,
                  }))}
                  total={qcSummary.totals.totalDefectRate}
                  isPercentage={true}
                />
              </div>
            </div>
          )}

          {/* SUBMIT TAB */}
          {activeTab === "submit" && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Send className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Final Review & Submit
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add comments and submit the report
                  </p>
                </div>
              </div>

              {/* Additional Comments */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  Additional Comments
                </label>
                <textarea
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 focus:border-purple-500 transition-all duration-200 text-gray-900 dark:text-gray-100 resize-none"
                  placeholder="Enter any final comments, observations, or recommendations here..."
                ></textarea>
              </div>

              {/* Summary Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-600">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Report Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      Report Type
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {reportType?.label || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      Factory
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {factory?.label || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      MO Number
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {moNo?.value || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      Color
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {color?.value || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      QC Inspectors
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {selectedQcs.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      Defect Rate
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {qcSummary.totals.totalDefectRate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab("summary")}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold rounded-lg transition-all duration-200"
                >
                  Back to Summary
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting || isFormHeaderInvalid}
                  className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>
                        {existingReportId ? "Update Report" : "Submit Report"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isFindingReport && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Searching for existing report...
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default SubConQASampleData;
