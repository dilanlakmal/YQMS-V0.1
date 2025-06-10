import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback
} from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../authentication/AuthContext";
import { API_BASE_URL } from "../../../../config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import EmpQRCodeScanner from "./EmpQRCodeScanner";
import {
  QrCode,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  FileBarChart2,
  Minus,
  Plus,
  X,
  Calculator,
  ClipboardList,
  HardHat,
  PackageCheck,
  Ruler,
  AlertCircle,
  Wrench,
  Sticker
} from "lucide-react";
import Select from "react-select"; // Import react-select for multi-select dropdown

// --- Sub-component for Measurement NumPad ---
const MeasurementNumPad = ({ onClose, onSetValue, currentValue }) => {
  const [nValue, setNValue] = useState(0);
  const [isNegative, setIsNegative] = useState(
    currentValue?.startsWith("-") || false
  );

  const handleNClick = () => setNValue((prev) => (prev + 1) % 6);
  const handleSignClick = () => setIsNegative((prev) => !prev);

  const handleSelectValue = (fraction) => {
    let value =
      fraction === "✔" ? "✔" : `${nValue > 0 ? `${nValue} ` : ""}${fraction}`;
    if (isNegative && value !== "✔") {
      value = `-${value}`;
    }
    onSetValue(value);
    onClose();
  };

  const fractions = [
    "1/16",
    "1/8",
    "3/16",
    "1/4",
    "5/16",
    "3/8",
    "7/16",
    "1/2",
    "9/16",
    "5/8",
    "11/16",
    "3/4",
    "13/16",
    "7/8",
    "15/16"
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded-lg shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={handleSignClick}
            className={`p-3 rounded-md font-bold text-xl col-span-2 ${
              isNegative ? "bg-orange-400 text-white" : "bg-blue-400 text-white"
            }`}
          >
            +/-
          </button>
          <button
            onClick={handleNClick}
            className="p-3 bg-indigo-500 text-white rounded-md font-bold text-xl col-span-2"
          >
            N: {nValue}
          </button>
          {fractions.map((f) => (
            <button
              key={f}
              onClick={() => handleSelectValue(f)}
              className="p-3 bg-gray-200 rounded-md hover:bg-gray-300 text-sm md:text-base"
            >
              {f}
            </button>
          ))}
          <button
            key={nValue + 1}
            onClick={() => handleSelectValue(`${nValue + 1}`)}
            className="p-3 bg-gray-800 text-white rounded-md hover:bg-black font-bold"
          >
            {nValue + 1}
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => handleSelectValue("✔")}
            className="w-full p-3 bg-green-500 text-white rounded-md hover:bg-green-600 font-bold flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} /> Pass
          </button>
          <button
            onClick={onClose}
            className="w-full p-3 bg-red-500 text-white rounded-md hover:bg-red-600 font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Sub-component for Defect Modal ---
const DefectModal = ({
  isOpen,
  onClose,
  onSave,
  allDefects,
  currentDefects,
  partIdentifier
}) => {
  const { t, i18n } = useTranslation();
  const [defectsForPart, setDefectsForPart] = useState(currentDefects || []);

  const getDefectDisplayName = (defect) => {
    if (i18n.language.startsWith("kh")) return defect.defectNameKhmer;
    if (i18n.language.startsWith("zh"))
      return defect.defectNameChinese || defect.defectNameEng;
    return defect.defectNameEng;
  };

  useEffect(() => {
    setDefectsForPart(currentDefects || []);
  }, [currentDefects]);
  if (!isOpen) return null;

  const addDefect = (defectId) => {
    const defectToAdd = allDefects.find((d) => d._id === defectId);
    if (defectToAdd)
      setDefectsForPart((prev) => [...prev, { ...defectToAdd, count: 1 }]);
  };

  const updateCount = (defectId, change) =>
    setDefectsForPart((prev) =>
      prev.map((d) =>
        d._id === defectId ? { ...d, count: Math.max(1, d.count + change) } : d
      )
    );
  const removeDefect = (defectId) =>
    setDefectsForPart((prev) => prev.filter((d) => d._id !== defectId));
  const availableDefects = allDefects.filter(
    (d) => !defectsForPart.some((dfp) => dfp._id === d._id)
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">
          Defects for Part:{" "}
          <span className="text-blue-600 font-mono">{partIdentifier}</span>
        </h3>
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2">
          {defectsForPart.map((defect) => (
            <div
              key={defect._id}
              className="flex items-center justify-between p-2 bg-gray-100 rounded-md text-sm"
            >
              <span className="flex-grow">{getDefectDisplayName(defect)}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateCount(defect._id, -1)}
                  className="p-1 bg-gray-300 rounded"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="text"
                  readOnly
                  value={defect.count}
                  className="w-10 text-center border rounded"
                />
                <button
                  onClick={() => updateCount(defect._id, 1)}
                  className="p-1 bg-gray-300 rounded"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => removeDefect(defect._id)}
                  className="p-1 text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 items-center mb-4">
          <select
            className="p-2 border rounded-md flex-grow"
            onChange={(e) => {
              if (e.target.value) addDefect(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">
              {t("qcPairing.addDefectPlaceholder", "Add a defect...")}
            </option>
            {availableDefects.map((d) => (
              <option key={d._id} value={d._id}>
                {getDefectDisplayName(d)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
          >
            {t("cancel", "Cancel")}
          </button>
          <button
            onClick={() => onSave(defectsForPart)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            {t("qcPairing.saveDefects", "Save Defects")}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Pairing Component ---
const RovingPairing = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // State
  const [inspectionRep, setInspectionRep] = useState("1st Inspection");
  const [inspectionDate, setInspectionDate] = useState(new Date());
  const [lineNo, setLineNo] = useState("");
  const [moNo, setMoNo] = useState("");
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [scannedUserData, setScannedUserData] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showOperatorDetails, setShowOperatorDetails] = useState(false);

  // --- (MODIFIED) State for Accessory Issues ---
  const [accessoryComplete, setAccessoryComplete] = useState("Yes");
  const [selectedAccessoryIssues, setSelectedAccessoryIssues] = useState([]); // State for selected issues
  const [allAccessoryIssues, setAllAccessoryIssues] = useState([]); // State for all available issues

  const [quantities, setQuantities] = useState({ T: 5, M: 5, B: 5 });
  const [tolerance, setTolerance] = useState("1/8");
  const [measurementData, setMeasurementData] = useState({});
  const [defectData, setDefectData] = useState({});
  const [allDefects, setAllDefects] = useState([]);

  // Modal State
  const [showNumPad, setShowNumPad] = useState(false);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState(null);

  // Refs
  const moNoDropdownRef = useRef(null);
  const inspectionRepOptions = [1, 2, 3, 4, 5].map((num) => {
    const s = ["th", "st", "nd", "rd"];
    const v = num % 100;
    const text = `${num}${s[(v - 20) % 10] || s[v] || s[0]} Inspection`;
    return { value: text, label: text };
  });

  // --- API and Data Fetching ---
  useEffect(() => {
    // --- (MODIFIED) Fetch Pairing Defects ---
    const fetchDefects = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/pairing-defects`);
        setAllDefects(
          response.data.sort((a, b) =>
            a.defectNameEng.localeCompare(b.defectNameEng)
          )
        );
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: t("error"),
          text: t("qcPairing.defectFetchError")
        });
      }
    };

    // --- (NEW) Fetch Accessory Issues ---
    const fetchAccessoryIssues = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/accessory-issues`
        );
        setAllAccessoryIssues(
          response.data.sort((a, b) => a.issueEng.localeCompare(b.issueEng))
        );
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: t("error"),
          text: t("qcPairing.accessoryIssueFetchError")
        });
      }
    };

    fetchDefects();
    fetchAccessoryIssues();
  }, [t]);

  useEffect(() => {
    const fetchMoNumbers = async () => {
      if (moNoSearch.trim() === "") {
        setShowMoNoDropdown(false);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/inline-orders-mo-numbers`,
          { params: { search: moNoSearch } }
        );
        setMoNoOptions(response.data);
        setShowMoNoDropdown(response.data.length > 0 && moNoSearch !== moNo);
      } catch (error) {
        console.error("Error fetching MO numbers:", error);
      }
    };
    fetchMoNumbers();
  }, [moNoSearch, moNo]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      )
        setShowMoNoDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- (NEW) Helper function for react-select options ---
  const getIssueDisplayName = (issue, lang) => {
    if (lang.startsWith("kh")) return issue.issueKhmer;
    if (lang.startsWith("zh")) return issue.issueChi || issue.issueEng;
    return issue.issueEng;
  };

  const accessoryOptions = useMemo(
    () =>
      allAccessoryIssues.map((issue) => ({
        value: issue, // Store the whole object
        label: getIssueDisplayName(issue, i18n.language)
      })),
    [allAccessoryIssues, i18n.language]
  );

  // --- Event Handlers ---
  const handleQuantityChange = (part, value) =>
    setQuantities((prev) => ({
      ...prev,
      [part]: Math.max(0, parseInt(value, 10) || 0)
    }));
  const handleMeasurementCellClick = (part, index) => {
    setActiveCell({ type: "measure", part, index });
    setShowNumPad(true);
  };
  const handleDefectCellClick = (part, index) => {
    setActiveCell({ type: "defect", part, index });
    setIsDefectModalOpen(true);
  };

  const handleSetMeasurement = (value) => {
    if (activeCell)
      setMeasurementData((prev) => ({
        ...prev,
        [`${activeCell.part}-${activeCell.index}`]: value
      }));
    setShowNumPad(false);
    setActiveCell(null);
  };

  const handleSaveDefects = (defects) => {
    const key = `${activeCell.part}-${activeCell.index}`;
    if (defects.length > 0)
      setDefectData((prev) => ({ ...prev, [key]: defects }));
    else {
      setDefectData((prev) => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
    setIsDefectModalOpen(false);
    setActiveCell(null);
  };

  const getDefectDisplayName = (defect) => {
    if (i18n.language.startsWith("kh")) return defect.defectNameKhmer;
    if (i18n.language.startsWith("zh"))
      return defect.defectNameChinese || defect.defectNameEng;
    return defect.defectNameEng;
  };

  // --- (MODIFIED) Format defect cell to show one defect per line ---
  const formatDefectCell = (defectsArray) => {
    if (!defectsArray || defectsArray.length === 0) return "✔";
    return (
      <div className="text-left text-xs space-y-0.5">
        {defectsArray.map((d, index) => (
          <div key={index}>{`${getDefectDisplayName(d)}: ${d.count}`}</div>
        ))}
      </div>
    );
  };

  // --- Calculations ---
  const totalParts = quantities.T + quantities.M + quantities.B;

  const getFractionValue = (str) => {
    if (!str || typeof str !== "string" || str === "✔") return 0;
    const sign = str.startsWith("-") ? -1 : 1;
    const absStr = str.replace(/[-+]/g, "");
    return (
      absStr
        .trim()
        .split(" ")
        .reduce((acc, part) => {
          if (part.includes("/")) {
            const [num, den] = part.split("/").map(Number);
            return acc + (den ? num / den : 0);
          }
          return acc + (parseFloat(part) || 0);
        }, 0) * sign
    );
  };

  const isOutOfTolerance = useCallback(
    (valueStr) =>
      !valueStr || valueStr === "✔"
        ? false
        : Math.abs(getFractionValue(valueStr)) > getFractionValue(tolerance),
    [tolerance]
  );

  const measurementRejects = useMemo(() => {
    let stats = {
      total: 0,
      positive: 0,
      negative: 0,
      rejectedParts: new Set()
    };
    Object.entries(measurementData).forEach(([key, value]) => {
      if (isOutOfTolerance(value)) {
        stats.total++;
        getFractionValue(value) > 0 ? stats.positive++ : stats.negative++;
        stats.rejectedParts.add(key);
      }
    });
    return stats;
  }, [measurementData, isOutOfTolerance]);

  const defectSummary = useMemo(() => {
    let stats = { totalQty: 0, rejectedParts: new Set() };
    Object.entries(defectData).forEach(([key, defects]) => {
      if (defects.length > 0) {
        stats.rejectedParts.add(key);
        stats.totalQty += defects.reduce((sum, d) => sum + d.count, 0);
      }
    });
    return stats;
  }, [defectData]);

  const totalRejects = new Set([
    ...measurementRejects.rejectedParts,
    ...defectSummary.rejectedParts
  ]).size;
  const totalPass = Math.max(0, totalParts - totalRejects);
  const passRate =
    totalParts > 0 ? ((totalPass / totalParts) * 100).toFixed(2) : "0.00";
  const isFormValid =
    inspectionRep && inspectionDate && lineNo && moNo && scannedUserData;

  // --- Submission Logic ---
  const handleSubmit = async () => {
    if (!isFormValid) {
      Swal.fire({
        icon: "warning",
        title: t("qcRoving.validationErrorTitle"),
        text: t("qcRoving.validationErrorMsg")
      });
      return;
    }

    const payload = {
      report_name: "QC Inline Roving Pairing",
      inspection_date: `${
        inspectionDate.getMonth() + 1
      }/${inspectionDate.getDate()}/${inspectionDate.getFullYear()}`,
      lineNo,
      moNo,
      emp_id: user?.emp_id || "Guest",
      eng_name: user?.eng_name || "Guest",
      operationNo: 7,
      operationName: "Pairing",
      operationName_kh: t("qcPairing.pairing_kh"),
      pairingDataItem: {
        inspection_rep_name: inspectionRep,
        operator_emp_id: scannedUserData?.emp_id,
        operator_eng_name: scannedUserData?.eng_name,
        operator_kh_name: scannedUserData?.kh_name,
        operator_job_title: scannedUserData?.job_title,
        operator_dept_name: scannedUserData?.dept_name,
        operator_sect_name: scannedUserData?.sect_name,
        accessoryComplete,
        // --- (MODIFIED) Send accessory issues array ---
        accessoryIssues:
          accessoryComplete === "No"
            ? selectedAccessoryIssues.map((issue) => ({
                issueEng: issue.issueEng,
                issueKhmer: issue.issueKhmer,
                issueChi: issue.issueChi
              }))
            : [],
        measurementData: Object.entries(quantities).map(([partType, qty]) => ({
          partType,
          measurements: Array.from({ length: qty }, (_, i) => ({
            partNo: i + 1,
            value: measurementData[`${partType}-${i}`] || "✔"
          }))
        })),
        defectSummary: {
          totalRejectedParts: defectSummary.rejectedParts.size,
          totalDefectQty: defectSummary.totalQty,
          defectDetails: Object.entries(quantities).map(([partType, qty]) => ({
            partType,
            defectsForPart: Array.from({ length: qty }, (_, i) => ({
              partNo: i + 1,
              // --- (MODIFIED) Save defect details including Chinese name ---
              defects:
                defectData[`${partType}-${i}`]?.map((d) => ({
                  defectNameEng: d.defectNameEng,
                  defectNameKhmer: d.defectNameKhmer,
                  defectNameChinese: d.defectNameChinese,
                  count: d.count
                })) || []
            })).filter((p) => p.defects.length > 0)
          }))
        },
        totalSummary: {
          totalParts,
          totalRejects,
          totalPass,
          passRate: `${passRate}%`,
          t_qty: quantities.T,
          m_qty: quantities.M,
          b_qty: quantities.B,
          tolerance: tolerance, // The selected tolerance value
          measurementTotalRejects: measurementRejects.total,
          measurementPositiveRejects: measurementRejects.positive,
          measurementNegativeRejects: measurementRejects.negative,
          defectTotalRejectedParts: defectSummary.rejectedParts.size,
          defectTotalQty: defectSummary.totalQty
        }
      }
    };

    try {
      Swal.fire({
        title: t("submitting"),
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      await axios.post(`${API_BASE_URL}/api/save-qc-roving-pairing`, payload);
      Swal.fire({
        icon: "success",
        title: t("success"),
        text: t("qcPairing.saveSuccess")
      });
      // Reset state here if needed
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("error"),
        text: error.response?.data?.message || t("qcPairing.saveError")
      });
    }
  };

  // --- (NEW) Helper function to format measurement values with a + sign ---
  const formatMeasurementValue = (value) => {
    if (!value || value === "✔") return "✔";
    const numericValue = getFractionValue(value);
    if (numericValue > 0 && !value.startsWith("+")) return `+${value}`;
    return value;
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 text-center">
        {t("qcPairing.title")}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4 p-4 bg-white rounded-lg border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("qcRoving.inspectionNo")}
              </label>
              <select
                value={inspectionRep}
                onChange={(e) => setInspectionRep(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
              >
                {inspectionRepOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("qcRoving.date")}
              </label>
              <DatePicker
                selected={inspectionDate}
                onChange={(date) => setInspectionDate(date)}
                dateFormat="MM/dd/yyyy"
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("qcRoving.lineNo")}
              </label>
              <select
                value={lineNo}
                onChange={(e) => setLineNo(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">{t("qcRoving.select_line_no")}</option>
                {Array.from({ length: 30 }, (_, i) => (i + 1).toString()).map(
                  (num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("qcRoving.moNo")}
              </label>
              <div className="relative" ref={moNoDropdownRef}>
                <input
                  type="text"
                  value={moNoSearch}
                  onChange={(e) => {
                    setMoNoSearch(e.target.value);
                    setMoNo("");
                  }}
                  placeholder={t("qcRoving.search_mono")}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                />
                {showMoNoDropdown && (
                  <ul className="absolute z-20 w-full bg-white border rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {moNoOptions.map((option) => (
                      <li
                        key={option}
                        onClick={() => {
                          setMoNo(option);
                          setMoNoSearch(option);
                          setShowMoNoDropdown(false);
                        }}
                        className="p-2 hover:bg-blue-100 cursor-pointer text-sm"
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border flex items-start gap-4">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
              <ClipboardList size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">
                {t("qcPairing.opDetails")}
              </h4>
              <div className="text-sm text-gray-600 mt-1">
                <p>
                  <strong>{t("qcRoving.operationNo")}:</strong>{" "}
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                    7
                  </span>
                </p>
                <p>
                  <strong>{t("qcPairing.opName")}:</strong> Pairing (
                  {t("qcPairing.pairing_kh")})
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border flex items-start gap-4">
            <div className="bg-green-100 text-green-600 p-2 rounded-full">
              <HardHat size={24} />
            </div>
            <div className="flex-grow">
              <h4 className="font-semibold text-gray-800">
                {t("qcRoving.scanQR")}
              </h4>
              <button
                onClick={() => setShowScanner(true)}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 w-full justify-center text-sm"
              >
                <QrCode className="w-5 h-5" />
                <span>
                  {scannedUserData
                    ? t("qcPairing.reScan")
                    : t("qcRoving.scanQR")}
                </span>
              </button>
              {scannedUserData && (
                <div className="mt-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 font-bold">
                      {scannedUserData.eng_name}
                    </span>
                    <button
                      onClick={() =>
                        setShowOperatorDetails(!showOperatorDetails)
                      }
                      className="text-gray-500 hover:text-gray-800"
                    >
                      {showOperatorDetails ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {showOperatorDetails && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-md border text-xs text-gray-600 space-y-1">
                      <p>
                        <strong>ID:</strong> {scannedUserData.emp_id}
                      </p>
                      <p>
                        <strong>Dept:</strong> {scannedUserData.dept_name} /{" "}
                        {scannedUserData.sect_name}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <hr />

      <div className="p-4 bg-white rounded-lg border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <PackageCheck className="text-gray-500" size={24} />
            <label className="font-semibold text-gray-700">
              {t("qcPairing.accessoryComplete")}
            </label>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="accessory"
                value="Yes"
                checked={accessoryComplete === "Yes"}
                onChange={(e) => setAccessoryComplete(e.target.value)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="accessory"
                value="No"
                checked={accessoryComplete === "No"}
                onChange={(e) => setAccessoryComplete(e.target.value)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm">No</span>
            </label>
          </div>
          {accessoryComplete === "No" && (
            <div className="flex-grow w-full">
              <Select
                isMulti
                options={accessoryOptions}
                value={accessoryOptions.filter((opt) =>
                  selectedAccessoryIssues.some(
                    (issue) => issue._id === opt.value._id
                  )
                )}
                onChange={(selectedOptions) =>
                  setSelectedAccessoryIssues(
                    selectedOptions
                      ? selectedOptions.map((opt) => opt.value)
                      : []
                  )
                }
                className="react-select-container text-sm"
                classNamePrefix="react-select"
                placeholder={t("qcPairing.accessoryRemarkPlaceholder")}
              />
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-white">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 p-3 bg-gray-50 rounded-md border">
          {["T", "M", "B"].map((part) => (
            <div key={part} className="flex items-center gap-2">
              <label className="font-bold text-gray-700">{part}:</label>
              <input
                type="number"
                inputMode="numeric"
                value={quantities[part]}
                onChange={(e) => handleQuantityChange(part, e.target.value)}
                className="w-16 p-1 border rounded-md text-sm"
              />
            </div>
          ))}
          <div className="font-semibold text-gray-700">
            {t("qcPairing.totalParts")}:{" "}
            <span className="text-blue-600 font-bold">{totalParts}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-semibold text-gray-700">
              {t("qcPairing.tolerance")}:
            </label>
            <select
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              className="p-1 border rounded-md text-sm"
            >
              <option value="1/4">+/- 1/4</option>
              <option value="1/8">+/- 1/8</option>
              <option value="1/16">+/- 1/16</option>
            </select>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            {t("qcPairing.measurementDetails")}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-sm font-medium">Part</th>
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((i) => (
                    <th key={i} className="border p-2 text-sm font-medium">
                      {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["T", "M", "B"].map((part) => (
                  <tr key={part}>
                    <td className="border p-2 font-bold">{part}</td>
                    {Array.from({ length: 5 }, (_, i) => i).map((i) => {
                      if (i >= quantities[part])
                        return (
                          <td key={i} className="border p-2 bg-gray-200"></td>
                        );
                      const cellValue = measurementData[`${part}-${i}`];
                      const isReject = isOutOfTolerance(cellValue);
                      const cellColor = isReject
                        ? "bg-red-200 text-red-800 font-bold"
                        : "bg-green-100";
                      return (
                        <td
                          key={i}
                          className={`border p-2 cursor-pointer ${cellColor} hover:bg-blue-100 transition-colors duration-150`}
                          onClick={() => handleMeasurementCellClick(part, i)}
                        >
                          {formatMeasurementValue(cellValue)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <h4 className="text-base font-semibold mb-2 text-gray-700">
              {t("qcPairing.measurementSummary")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center p-3 bg-red-50 rounded-lg border border-red-200 gap-3">
                <Ruler className="text-red-500" size={32} />
                <div className="text-red-800">
                  <p className="text-sm">Rejects (Measurement)</p>
                  <p className="text-xl font-bold">
                    {measurementRejects.total}
                  </p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200 gap-3">
                <TrendingUp className="text-yellow-600" size={32} />
                <div className="text-yellow-800">
                  <p className="text-sm">Positive Rejects</p>
                  <p className="text-xl font-bold">
                    {measurementRejects.positive}
                  </p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-200 gap-3">
                <TrendingDown className="text-orange-600" size={32} />
                <div className="text-orange-800">
                  <p className="text-sm">Negative Rejects</p>
                  <p className="text-xl font-bold">
                    {measurementRejects.negative}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-6" />

        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            {t("qcPairing.defectDetails")}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-sm font-medium">Part</th>
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((i) => (
                    <th key={i} className="border p-2 text-sm font-medium">
                      {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["T", "M", "B"].map((part) => (
                  <tr key={part}>
                    <td className="border p-2 font-bold">{part}</td>
                    {Array.from({ length: 5 }, (_, i) => i).map((i) => {
                      if (i >= quantities[part])
                        return (
                          <td key={i} className="border p-2 bg-gray-200"></td>
                        );
                      const cellDefects = defectData[`${part}-${i}`];
                      const hasDefects = cellDefects && cellDefects.length > 0;
                      const cellColor = hasDefects
                        ? "bg-red-200"
                        : "bg-green-100";
                      return (
                        <td
                          key={i}
                          className={`border p-2 cursor-pointer ${cellColor} hover:bg-blue-100 transition-colors duration-150 align-top`}
                          onClick={() => handleDefectCellClick(part, i)}
                        >
                          {formatDefectCell(cellDefects)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <h4 className="text-base font-semibold mb-2 text-gray-700">
              {t("qcPairing.defectSummary")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-3 bg-red-50 rounded-lg border border-red-200 gap-3">
                <Wrench className="text-red-500" size={32} />
                <div className="text-red-800">
                  <p className="text-sm">Total Reject Parts (Defect)</p>
                  <p className="text-xl font-bold">
                    {defectSummary.rejectedParts.size}
                  </p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-indigo-50 rounded-lg border border-indigo-200 gap-3">
                <Sticker className="text-indigo-500" size={32} />
                <div className="text-indigo-800">
                  <p className="text-sm">Total Defect Qty</p>
                  <p className="text-xl font-bold">{defectSummary.totalQty}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-lg">
        <h3 className="text-lg font-bold text-indigo-800 mb-4 text-center">
          {t("qcPairing.finalSummary")}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-2">
            <FileBarChart2 className="mx-auto text-gray-500 mb-1" size={28} />
            <p className="text-xs text-gray-600">Total Parts</p>
            <p className="text-xl font-bold text-gray-800">{totalParts}</p>
          </div>
          <div className="p-2">
            <AlertCircle className="mx-auto text-red-500 mb-1" size={28} />
            <p className="text-xs text-red-600">Total Rejects</p>
            <p className="text-xl font-bold text-red-800">{totalRejects}</p>
          </div>
          <div className="p-2">
            <CheckCircle className="mx-auto text-green-500 mb-1" size={28} />
            <p className="text-xs text-green-600">Total Pass</p>
            <p className="text-xl font-bold text-green-800">{totalPass}</p>
          </div>
          <div className="p-2">
            <Calculator className="mx-auto text-blue-500 mb-1" size={28} />
            <p className="text-xs text-blue-600">Pass Rate</p>
            <p className="text-xl font-bold text-blue-800">{passRate}%</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`px-8 py-3 rounded-lg text-white font-bold text-lg transition-all ${
            isFormValid
              ? "bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {t("qcRoving.finish_inspection")}
        </button>
      </div>

      {showScanner && (
        <EmpQRCodeScanner
          onUserDataFetched={(data) => {
            setScannedUserData(data);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
      {showNumPad && (
        <MeasurementNumPad
          onClose={() => setShowNumPad(false)}
          onSetValue={handleSetMeasurement}
          currentValue={
            measurementData[`${activeCell.part}-${activeCell.index}`] || ""
          }
        />
      )}
      {isDefectModalOpen && (
        <DefectModal
          isOpen={isDefectModalOpen}
          onClose={() => setIsDefectModalOpen(false)}
          onSave={handleSaveDefects}
          allDefects={allDefects}
          currentDefects={
            defectData[`${activeCell.part}-${activeCell.index}`] || []
          }
          partIdentifier={`${activeCell.part}-${activeCell.index + 1}`}
        />
      )}
    </div>
  );
};

export default RovingPairing;
