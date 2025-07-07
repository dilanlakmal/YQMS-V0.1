// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import axios from "axios";
// import { useTranslation } from "react-i18next";
// import { useAuth } from "../components/authentication/AuthContext";
// import { useTheme } from "../components/context/ThemeContext";
// import { API_BASE_URL } from "../../config";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import Select from "react-select";
// import Swal from "sweetalert2";
// import EmpQRCodeScanner from "../components/inspection/qc_roving/EmpQRCodeScanner";
// import AQLDisplay from "../components/inspection/qc_accuracy/AQLDisplay";
// import DefectInputTable from "../components/inspection/qc_accuracy/DefectInputTable";
// import AccuracyResult from "../components/inspection/qc_accuracy/AccuracyResult";
// import { calculateAccuracy } from "../components/inspection/qc_accuracy/aqlHelper";
// import { QrCode, Loader2, Save, Sun, Moon } from "lucide-react";

// const QCAccuracy = () => {
//   const { t } = useTranslation();
//   const { user } = useAuth();
//   const { theme, toggleTheme } = useTheme();

//   // Form State
//   const [reportDate, setReportDate] = useState(new Date());
//   const [reportType, setReportType] = useState("First Output");
//   const [scannedQc, setScannedQc] = useState(null);
//   const [moNo, setMoNo] = useState(null);
//   const [selectedColors, setSelectedColors] = useState([]);
//   const [selectedSizes, setSelectedSizes] = useState([]);
//   const [lineNo, setLineNo] = useState("");
//   const [tableNo, setTableNo] = useState("");
//   const [checkedQty, setCheckedQty] = useState(20);

//   // Data & UI State
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [showScanner, setShowScanner] = useState(false);
//   const [moNoSearch, setMoNoSearch] = useState("");
//   const [moNoOptions, setMoNoOptions] = useState([]);
//   const [colorOptions, setColorOptions] = useState([]);
//   const [sizeOptions, setSizeOptions] = useState([]);
//   const [allDefectsList, setAllDefectsList] = useState([]);
//   const [defects, setDefects] = useState([]); // This holds the defects added to the report

//   // MO search logic
//   const debouncedMoSearch = useCallback(
//     debounce(async (searchTerm) => {
//       if (searchTerm.length < 2) {
//         setMoNoOptions([]);
//         return;
//       }
//       try {
//         const res = await axios.get(`${API_BASE_URL}/api/search-mono`, {
//           params: { term: searchTerm }
//         });
//         setMoNoOptions(res.data.map((m) => ({ value: m, label: m })));
//       } catch (error) {
//         console.error("Error searching MO:", error);
//       }
//     }, 300),
//     []
//   );

//   useEffect(() => {
//     debouncedMoSearch(moNoSearch);
//   }, [moNoSearch, debouncedMoSearch]);

//   // Fetch order details when MO is selected
//   useEffect(() => {
//     const fetchOrderDetails = async () => {
//       if (!moNo) {
//         setColorOptions([]);
//         setSelectedColors([]);
//         return;
//       }
//       try {
//         const res = await axios.get(
//           `${API_BASE_URL}/api/order-details/${moNo.value}`
//         );
//         setColorOptions(
//           res.data.colors.map((c) => ({
//             value: c.original,
//             label: `${c.original} (${c.chn || "N/A"})`
//           }))
//         );
//       } catch (error) {
//         console.error("Error fetching order details:", error);
//       }
//     };
//     fetchOrderDetails();
//   }, [moNo]);

//   // Fetch sizes when colors are selected
//   useEffect(() => {
//     const fetchSizes = async () => {
//       if (!moNo || selectedColors.length === 0) {
//         setSizeOptions([]);
//         setSelectedSizes([]);
//         return;
//       }
//       // For simplicity, we'll fetch sizes for the first selected color
//       // A more complex implementation could merge sizes from all selected colors
//       try {
//         const res = await axios.get(
//           `${API_BASE_URL}/api/order-sizes/${moNo.value}/${selectedColors[0].value}`
//         );
//         const uniqueSizes = [...new Set(res.data.map((s) => s.size))];
//         setSizeOptions(uniqueSizes.map((s) => ({ value: s, label: s })));
//       } catch (error) {
//         console.error("Error fetching sizes:", error);
//       }
//     };
//     fetchSizes();
//   }, [moNo, selectedColors]);

//   // Fetch all available defects on mount
//   useEffect(() => {
//     const fetchAllDefects = async () => {
//       try {
//         const res = await axios.get(`${API_BASE_URL}/api/qa-defects-list`);
//         setAllDefectsList(res.data);
//       } catch (error) {
//         console.error("Failed to fetch defects list", error);
//       }
//     };
//     fetchAllDefects();
//   }, []);

//   const determinedBuyer = useMemo(() => {
//     if (!moNo?.value) return "Other";
//     const mo = moNo.value;
//     if (mo.includes("COM")) return "MWW";
//     if (mo.includes("CO")) return "Costco";
//     if (mo.includes("AR")) return "Aritzia";
//     if (mo.includes("RT")) return "Reitmans";
//     if (mo.includes("AF")) return "ANF";
//     if (mo.includes("NT")) return "STORI";
//     return "Other";
//   }, [moNo]);

//   const handleFinishInspection = async () => {
//     if (!scannedQc || !user) {
//       Swal.fire(
//         t("qcAccuracy.validation.scanQcFirst"),
//         "Please scan the QC inspector QR code.",
//         "warning"
//       );
//       return;
//     }

//     setIsSubmitting(true);
//     const { accuracy, grade, totalDefectPoints } = calculateAccuracy(
//       defects,
//       checkedQty
//     );

//     const payload = {
//       reportDate,
//       qcInspector: { empId: user.emp_id, engName: user.eng_name },
//       scannedQc: { empId: scannedQc.emp_id, engName: scannedQc.eng_name },
//       reportType,
//       moNo: moNo?.value,
//       colors: selectedColors.map((c) => c.value),
//       sizes: selectedSizes.map((s) => s.value),
//       lineNo: reportType === "Inline Finishing" ? "NA" : lineNo,
//       tableNo: reportType === "Inline Finishing" ? tableNo : "NA",
//       totalCheckedQty: checkedQty,
//       aql: getAqlDetails(checkedQty),
//       defects: defects.map((d) => ({
//         pcsNo: d.pcsNo,
//         defectCode: d.defectCode,
//         defectNameEng: d.defectNameEng,
//         defectNameKh: d.defectNameKh,
//         defectNameCh: d.defectNameCh,
//         qty: d.qty,
//         type: d.type
//       })),
//       totalDefectPoints,
//       qcAccuracy: accuracy,
//       grade
//     };

//     try {
//       await axios.post(`${API_BASE_URL}/api/qc-accuracy-reports`, payload);
//       Swal.fire(
//         t("qcAccuracy.submission.successTitle"),
//         t("qcAccuracy.submission.successText"),
//         "success"
//       );
//       // Reset form logic here
//       setDefects([]);
//       // ... reset other fields
//     } catch (error) {
//       console.error("Error submitting report:", error);
//       Swal.fire(
//         t("qcAccuracy.submission.errorTitle"),
//         error.response?.data?.message || t("qcAccuracy.submission.errorText"),
//         "error"
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Debounce helper function
//   function debounce(func, delay) {
//     let timeout;
//     return function (...args) {
//       const context = this;
//       clearTimeout(timeout);
//       timeout = setTimeout(() => func.apply(context, args), delay);
//     };
//   }

//   const reactSelectStyles = {
//     // Styles for react-select in dark/light mode
//     control: (base) => ({
//       ...base,
//       backgroundColor: "var(--color-bg-secondary)",
//       borderColor: "var(--color-border)",
//       color: "var(--color-text-primary)"
//     }),
//     singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
//     multiValue: (base) => ({
//       ...base,
//       backgroundColor: "var(--color-bg-accent)"
//     }),
//     multiValueLabel: (base) => ({ ...base, color: "var(--color-text-accent)" }),
//     input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
//     menu: (base) => ({ ...base, backgroundColor: "var(--color-bg-secondary)" }),
//     option: (base, state) => ({
//       ...base,
//       backgroundColor: state.isFocused
//         ? "var(--color-bg-accent)"
//         : "transparent",
//       color: "var(--color-text-primary)"
//     })
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
//       <div className="max-w-7xl mx-auto">
//         <header className="flex justify-between items-center mb-6">
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
//             {t("qcAccuracy.title", "QC Accuracy Inspection")}
//           </h1>
//           <button
//             onClick={toggleTheme}
//             className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
//           >
//             {theme === "light" ? <Moon /> : <Sun />}
//           </button>
//         </header>

//         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
//           {/* Header Section */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
//             <div>
//               <label className="text-sm font-medium">
//                 {t("qcAccuracy.reportType", "Report Type")}
//               </label>
//               <select
//                 value={reportType}
//                 onChange={(e) => setReportType(e.target.value)}
//                 className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
//               >
//                 <option value="First Output">First Output</option>
//                 <option value="Inline Sewing">Inline Sewing</option>
//                 <option value="Inline Finishing">Inline Finishing</option>
//               </select>
//             </div>
//             <div>
//               <label className="text-sm font-medium">
//                 {t("qcAccuracy.date", "Date")}
//               </label>
//               <DatePicker
//                 selected={reportDate}
//                 onChange={(date) => setReportDate(date)}
//                 className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
//               />
//             </div>
//             <div className="lg:col-span-2">
//               <label className="text-sm font-medium">
//                 {t("qcAccuracy.scanQcQr", "Scan QC QR")}
//               </label>
//               <div className="flex items-center gap-2 mt-1">
//                 <button
//                   onClick={() => setShowScanner(true)}
//                   className="flex-grow flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
//                 >
//                   <QrCode size={18} />{" "}
//                   {scannedQc
//                     ? t("qcAccuracy.reScan", "Re-Scan")
//                     : t("qcAccuracy.scan", "Scan")}
//                 </button>
//                 {scannedQc && (
//                   <div className="p-2 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-md text-sm">
//                     {scannedQc.emp_id} - {scannedQc.eng_name}
//                   </div>
//                 )}
//               </div>
//             </div>
//             <div className="lg:col-span-2">
//               <label className="text-sm font-medium">
//                 {t("qcAccuracy.moNo", "MO No")}
//               </label>
//               <Select
//                 options={moNoOptions}
//                 value={moNo}
//                 onInputChange={setMoNoSearch}
//                 onChange={setMoNo}
//                 styles={reactSelectStyles}
//                 placeholder={t("qcAccuracy.searchMo", "Search MO...")}
//               />
//             </div>
//             <div className="lg:col-span-2">
//               <label className="text-sm font-medium">
//                 {t("qcAccuracy.color", "Color")}
//               </label>
//               <Select
//                 options={colorOptions}
//                 value={selectedColors}
//                 onChange={setSelectedColors}
//                 isDisabled={!moNo}
//                 isMulti
//                 styles={reactSelectStyles}
//               />
//             </div>
//             {reportType === "Inline Finishing" ? (
//               <div>
//                 <label className="text-sm font-medium">
//                   {t("qcAccuracy.tableNo", "Table No")}
//                 </label>
//                 <select
//                   value={tableNo}
//                   onChange={(e) => setTableNo(e.target.value)}
//                   className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
//                 >
//                   <option value="">
//                     {t("qcAccuracy.select", "Select...")}
//                   </option>
//                   {Array.from({ length: 26 }, (_, i) =>
//                     String.fromCharCode(65 + i)
//                   ).map((char) => (
//                     <option key={char} value={char}>
//                       {char}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             ) : (
//               <div>
//                 <label className="text-sm font-medium">
//                   {t("qcAccuracy.lineNo", "Line No")}
//                 </label>
//                 <select
//                   value={lineNo}
//                   onChange={(e) => setLineNo(e.target.value)}
//                   className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
//                 >
//                   <option value="">
//                     {t("qcAccuracy.select", "Select...")}
//                   </option>
//                   {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
//                     <option key={num} value={num}>
//                       {num}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}
//             <div>
//               <label className="text-sm font-medium">
//                 {t("qcAccuracy.size", "Size (Optional)")}
//               </label>
//               <Select
//                 options={sizeOptions}
//                 value={selectedSizes}
//                 onChange={setSelectedSizes}
//                 isDisabled={selectedColors.length === 0}
//                 isMulti
//                 styles={reactSelectStyles}
//               />
//             </div>
//             <div className="lg:col-span-2">
//               <label className="text-sm font-medium">
//                 {t("qcAccuracy.totalCheckedQty", "Total Checked Qty")}
//               </label>
//               <input
//                 type="number"
//                 value={checkedQty}
//                 onChange={(e) => setCheckedQty(Number(e.target.value))}
//                 inputMode="numeric"
//                 className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
//               />
//             </div>
//           </div>

//           {/* AQL Display */}
//           <AQLDisplay checkedQty={checkedQty} />

//           {/* Defect Input Table */}
//           <DefectInputTable
//             defects={defects}
//             setDefects={setDefects}
//             availableDefects={allDefectsList}
//             buyer={determinedBuyer}
//           />

//           {/* Accuracy Result */}
//           <AccuracyResult defects={defects} checkedQty={checkedQty} />

//           {/* Submit Button */}
//           <div className="mt-8 flex justify-end">
//             <button
//               onClick={handleFinishInspection}
//               disabled={isSubmitting || defects.length === 0}
//               className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
//               {t("qcAccuracy.finishInspection", "Finish Inspection")}
//             </button>
//           </div>
//         </div>
//       </div>

//       {showScanner && (
//         <EmpQRCodeScanner
//           onUserDataFetched={(data) => {
//             setScannedQc(data);
//             setShowScanner(false);
//           }}
//           onClose={() => setShowScanner(false)}
//         />
//       )}
//     </div>
//   );
// };

// export default QCAccuracy;

import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../components/context/ThemeContext"; // Keep for styling
import { Check, BarChart3, TrendingUp } from "lucide-react";
import QAInspectionForm from "../components/inspection/qc_accuracy/QAInspectionForm";

// Placeholder for other tabs
const PlaceholderComponent = ({ titleKey, contentKey }) => {
  const { t } = useTranslation();
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[300px] flex flex-col justify-center items-center">
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {t(titleKey)}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center">
        {t(contentKey, "This section is under development.")}
      </p>
    </div>
  );
};

const QCAccuracy = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("inspection");
  const { theme } = useTheme(); // Keep to pass theme context to children if needed

  const tabs = useMemo(
    () => [
      {
        id: "inspection",
        labelKey: "qcAccuracy.tabs.inspection",
        icon: <Check size={18} />,
        component: <QAInspectionForm />
      },
      {
        id: "results",
        labelKey: "qcAccuracy.tabs.results",
        icon: <BarChart3 size={18} />,
        component: <PlaceholderComponent titleKey="qcAccuracy.tabs.results" />
      },
      {
        id: "trend",
        labelKey: "qcAccuracy.tabs.trend",
        icon: <TrendingUp size={18} />,
        component: <PlaceholderComponent titleKey="qcAccuracy.tabs.trend" />
      }
    ],
    []
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("qcAccuracy.title", "QC Accuracy Inspection")}
          </h1>
        </header>

        {/* Tab Navigation */}
        <div className="border-b border-gray-300 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500"
                  }`}
              >
                {React.cloneElement(tab.icon, { className: "mr-2" })}
                {t(tab.labelKey, tab.id)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">{activeComponent}</div>
      </div>
    </div>
  );
};

export default QCAccuracy;
