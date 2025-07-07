import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../authentication/AuthContext";
import { API_BASE_URL } from "../../../../config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import Swal from "sweetalert2";
import EmpQRCodeScanner from "../qc_roving/EmpQRCodeScanner";
import AQLDisplay from "./AQLDisplay";
import DefectInputTable from "./DefectInputTable";
import AccuracyResult from "./AccuracyResult";
import { calculateAccuracy, getAqlDetails } from "./aqlHelper";
import { QrCode, Loader2, Save } from "lucide-react";

const QAInspectionForm = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Form State
  const [reportDate, setReportDate] = useState(new Date());
  const [reportType, setReportType] = useState("First Output");
  const [scannedQc, setScannedQc] = useState(null);
  const [moNo, setMoNo] = useState(null);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [lineNo, setLineNo] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [checkedQty, setCheckedQty] = useState(5);

  // Data & UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [allDefectsList, setAllDefectsList] = useState([]);
  const [defects, setDefects] = useState([]);

  useEffect(() => {
    if (reportType === "First Output") {
      setCheckedQty(5);
    } else {
      setCheckedQty(20);
    }
  }, [reportType]);

  const debounce = useCallback((func, delay) => {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }, []);

  const debouncedMoSearch = useCallback(
    debounce(async (searchTerm) => {
      if (searchTerm.length < 2) {
        setMoNoOptions([]);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/api/search-mono`, {
          params: { term: searchTerm }
        });
        setMoNoOptions(res.data.map((m) => ({ value: m, label: m })));
      } catch (error) {
        console.error("Error searching MO:", error);
      }
    }, 300),
    [API_BASE_URL, debounce]
  );

  useEffect(() => {
    debouncedMoSearch(moNoSearch);
  }, [moNoSearch, debouncedMoSearch]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!moNo) {
        setColorOptions([]);
        setSelectedColors([]);
        return;
      }
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/order-details/${moNo.value}`
        );
        setColorOptions(
          res.data.colors.map((c) => ({
            value: c.original,
            label: `${c.original} (${c.chn || "N/A"})`
          }))
        );
      } catch (error) {
        console.error("Error fetching order details:", error);
      }
    };
    fetchOrderDetails();
  }, [moNo, API_BASE_URL]);

  useEffect(() => {
    const fetchSizes = async () => {
      if (!moNo || selectedColors.length === 0) {
        setSizeOptions([]);
        setSelectedSizes([]);
        return;
      }
      try {
        const sizeRequests = selectedColors.map((color) =>
          axios.get(
            `${API_BASE_URL}/api/order-sizes/${moNo.value}/${color.value}`
          )
        );
        const responses = await Promise.all(sizeRequests);
        const allSizes = responses.flatMap((res) =>
          res.data.map((s) => s.size)
        );
        const uniqueSizes = [...new Set(allSizes)];
        setSizeOptions(uniqueSizes.map((s) => ({ value: s, label: s })));
      } catch (error) {
        console.error("Error fetching sizes:", error);
      }
    };
    fetchSizes();
  }, [moNo, selectedColors, API_BASE_URL]);

  useEffect(() => {
    const fetchAllDefects = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/qa-defects-list`);
        setAllDefectsList(res.data);
      } catch (error) {
        console.error("Failed to fetch defects list", error);
      }
    };
    fetchAllDefects();
  }, [API_BASE_URL]);

  const determinedBuyer = useMemo(() => {
    if (!moNo?.value) return "Other";
    const mo = moNo.value;
    if (mo.includes("COM")) return "MWW";
    if (mo.includes("CO")) return "Costco";
    if (mo.includes("AR")) return "Aritzia";
    if (mo.includes("RT")) return "Reitmans";
    if (mo.includes("AF")) return "ANF";
    if (mo.includes("NT")) return "STORI";
    return "Other";
  }, [moNo]);

  const handleFinishInspection = async () => {
    if (!scannedQc || !user) {
      Swal.fire(
        t("qcAccuracy.validation.scanQcFirst"),
        t("qcAccuracy.validation.scanQcFirstDetail"),
        "warning"
      );
      return;
    }
    if (!moNo?.value) {
      Swal.fire(
        t("qcAccuracy.validation.selectMo"),
        t("qcAccuracy.validation.selectMoDetail"),
        "warning"
      );
      return;
    }

    setIsSubmitting(true);
    const { accuracy, grade, totalDefectPoints } = calculateAccuracy(
      defects,
      checkedQty,
      reportType
    );

    const aqlDetails =
      reportType === "First Output"
        ? { codeLetter: "C", sampleSize: 5, ac: 0, re: 1 }
        : getAqlDetails(checkedQty);

    const payload = {
      reportDate,
      qcInspector: { empId: user.emp_id, engName: user.eng_name },
      scannedQc: { empId: scannedQc.emp_id, engName: scannedQc.eng_name },
      reportType,
      moNo: moNo?.value,
      colors: selectedColors.map((c) => c.value),
      sizes: selectedSizes.map((s) => s.value),
      lineNo: reportType === "Inline Finishing" ? "NA" : lineNo,
      tableNo: reportType === "Inline Finishing" ? tableNo : "NA",
      totalCheckedQty: checkedQty,
      aql: aqlDetails,
      defects: defects
        .map((d) => ({
          pcsNo: d.pcsNo,
          defectCode: d.defectCode,
          defectNameEng: d.defectNameEng,
          defectNameKh: d.defectNameKh,
          defectNameCh: d.defectNameCh,
          qty: d.qty,
          type: d.type
        }))
        .filter((d) => d.defectCode),
      totalDefectPoints,
      qcAccuracy: accuracy,
      grade
    };

    try {
      await axios.post(`${API_BASE_URL}/api/qc-accuracy-reports`, payload);
      Swal.fire(
        t("qcAccuracy.submission.successTitle"),
        t("qcAccuracy.submission.successText"),
        "success"
      );
      setDefects([]);
      setScannedQc(null);
      setMoNo(null);
      setMoNoSearch("");
      setSelectedColors([]);
      setSelectedSizes([]);
    } catch (error) {
      console.error("Error submitting report:", error);
      Swal.fire(
        t("qcAccuracy.submission.errorTitle"),
        error.response?.data?.message || t("qcAccuracy.submission.errorText"),
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // *** FIX #2 START: Create a single, corrected style object for react-select ***
  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border)",
      boxShadow: "none",
      "&:hover": {
        borderColor: "var(--color-border-hover)"
      }
    }),
    singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-accent)"
    }),
    multiValueLabel: (base) => ({ ...base, color: "var(--color-text-accent)" }),
    multiValueRemove: (base) => ({
      ...base,
      color: "var(--color-text-accent)",
      "&:hover": {
        backgroundColor: "var(--color-bg-accent-hover)",
        color: "white"
      }
    }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)", // This sets the dropdown background
      zIndex: 50
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      // Don't use 'transparent'. Let it inherit from the menu.
      backgroundColor: isSelected
        ? "var(--color-bg-accent-active)"
        : isFocused
        ? "var(--color-bg-accent)"
        : "var(--color-bg-secondary)", // Use the menu background color
      color: "var(--color-text-primary)",
      ":active": {
        backgroundColor: "var(--color-bg-accent-active)"
      }
    }),
    placeholder: (base) => ({ ...base, color: "var(--color-text-secondary)" })
  };
  // *** FIX #2 END ***

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-sm font-medium">
            {t("qcAccuracy.reportType", "Report Type")}
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
          >
            <option value="First Output">First Output</option>
            <option value="Inline Sewing">Inline Sewing</option>
            <option value="Inline Finishing">Inline Finishing</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">
            {t("qcAccuracy.date", "Date")}
          </label>
          <DatePicker
            selected={reportDate}
            onChange={(date) => setReportDate(date)}
            className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
          />
        </div>
        <div className="lg:col-span-2">
          <label className="text-sm font-medium">
            {t("qcAccuracy.scanQcQr", "Scan QC Inspector QR")}
          </label>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => setShowScanner(true)}
              className="flex-grow flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <QrCode size={18} />{" "}
              {scannedQc
                ? t("qcAccuracy.reScan", "Re-Scan")
                : t("qcAccuracy.scan", "Scan")}
            </button>
            {scannedQc && (
              <div className="p-2 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-md text-sm">
                {scannedQc.emp_id} - {scannedQc.eng_name}
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
          <label className="text-sm font-medium">
            {t("qcAccuracy.moNo", "MO No")}
          </label>
          <Select
            options={moNoOptions}
            value={moNo}
            onInputChange={setMoNoSearch}
            onChange={setMoNo}
            styles={reactSelectStyles} // Apply corrected styles
            placeholder={t("qcAccuracy.searchMo", "Search MO...")}
            isClearable={true} // *** FIX #1: Add this prop to allow clearing the selection ***
          />
        </div>
        <div className="lg:col-span-2">
          <label className="text-sm font-medium">
            {t("qcAccuracy.color", "Color")}
          </label>
          <Select
            options={colorOptions}
            value={selectedColors}
            onChange={setSelectedColors}
            isDisabled={!moNo}
            isMulti
            styles={reactSelectStyles} // Apply corrected styles
          />
        </div>
        {reportType === "Inline Finishing" ? (
          <div>
            <label className="text-sm font-medium">
              {t("qcAccuracy.tableNo", "Table No")}
            </label>
            <select
              value={tableNo}
              onChange={(e) => setTableNo(e.target.value)}
              className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              <option value="">{t("qcAccuracy.select", "Select...")}</option>
              {Array.from({ length: 26 }, (_, i) =>
                String.fromCharCode(65 + i)
              ).map((char) => (
                <option key={char} value={char}>
                  {char}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium">
              {t("qcAccuracy.lineNo", "Line No")}
            </label>
            <select
              value={lineNo}
              onChange={(e) => setLineNo(e.target.value)}
              className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              <option value="">{t("qcAccuracy.select", "Select...")}</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="text-sm font-medium">
            {t("qcAccuracy.size", "Size (Optional)")}
          </label>
          <Select
            options={sizeOptions}
            value={selectedSizes}
            onChange={setSelectedSizes}
            isDisabled={selectedColors.length === 0}
            isMulti
            styles={reactSelectStyles} // Apply corrected styles
          />
        </div>
        <div className="lg:col-span-2">
          <label className="text-sm font-medium">
            {t("qcAccuracy.totalCheckedQty", "Total Checked Qty")}
          </label>
          <input
            type="number"
            value={checkedQty}
            onChange={(e) => setCheckedQty(Number(e.target.value))}
            inputMode="numeric"
            className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
          />
        </div>
      </div>

      <AQLDisplay checkedQty={checkedQty} />

      <DefectInputTable
        defects={defects}
        setDefects={setDefects}
        availableDefects={allDefectsList}
        buyer={determinedBuyer}
      />

      <AccuracyResult
        defects={defects}
        checkedQty={checkedQty}
        reportType={reportType}
      />

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleFinishInspection}
          disabled={
            isSubmitting || defects.filter((d) => d.defectCode).length === 0
          } // Disable if no valid defects are added
          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
          {t("qcAccuracy.finishInspection", "Finish Inspection")}
        </button>
      </div>

      {showScanner && (
        <EmpQRCodeScanner
          onUserDataFetched={(data) => {
            setScannedQc(data);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default QAInspectionForm;
