//Old Code

// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../config";
// import { useAuth } from "../components/authentication/AuthContext";
// import { useTranslation } from "react-i18next";
// import { Eye, EyeOff, Database, Keyboard } from "lucide-react";
// import Swal from "sweetalert2";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import NumberPad from "../components/forms/NumberPad";
// import { measurementPoints } from "../constants/cuttingmeasurement";
// import MeasurementTable from "../components/inspection/cutting/MeasurementTable";
// import CuttingOrderModify from "../components/inspection/cutting/CuttingOrderModify";

// const CuttingPage = () => {
//   const { t } = useTranslation();
//   const { user, loading: authLoading } = useAuth();
//   const [activeTab, setActiveTab] = useState("form");
//   const [inspectionDate, setInspectionDate] = useState(new Date());
//   const [moNo, setMoNo] = useState("");
//   const [moNoSearch, setMoNoSearch] = useState("");
//   const [moNoOptions, setMoNoOptions] = useState([]);
//   const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
//   const moNoDropdownRef = useRef(null);
//   //const [lotNo, setLotNo] = useState("");
//   const [lotNo, setLotNo] = useState([]); // Array to store multiple selected Lot Nos
//   const [color, setColor] = useState("");
//   const [tableNo, setTableNo] = useState("");
//   const [tableNoSearch, setTableNoSearch] = useState("");
//   const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
//   const tableNoDropdownRef = useRef(null);

//   const [cuttingTableL, setCuttingTableL] = useState("");
//   const [cuttingTableNo, setCuttingTableNo] = useState("");
//   const [marker, setMarker] = useState("");
//   const [planLayerQty, setPlanLayerQty] = useState(0);
//   const [totalPlanPcs, setTotalPlanPcs] = useState(0);
//   const [actualLayers, setActualLayers] = useState(0);
//   const [showOrderDetails, setShowOrderDetails] = useState(false);
//   const [totalBundleQty, setTotalBundleQty] = useState("");
//   const [bundleQtyCheck, setBundleQtyCheck] = useState("");
//   const [totalInspectionQty, setTotalInspectionQty] = useState(0);
//   const [cuttingByAuto, setCuttingByAuto] = useState(true); // Default to Auto
//   const [cuttingByManual, setCuttingByManual] = useState(false);
//   const [showNumberPad, setShowNumberPad] = useState(false);
//   const [showBundleQtyCheckNumberPad, setShowBundleQtyCheckNumberPad] =
//     useState(false);

//   const [isTablet, setIsTablet] = useState(false);
//   const [showTotalInspectionQtyNumberPad, setShowTotalInspectionQtyNumberPad] =
//     useState(false);
//   const [isTotalInspectionQtyManual, setIsTotalInspectionQtyManual] =
//     useState(false);
//   const [selectedPanel, setSelectedPanel] = useState("");
//   const [selectedSize, setSelectedSize] = useState("");
//   const [selectedSerialLetter, setSelectedSerialLetter] = useState("");
//   const [availableSizes, setAvailableSizes] = useState([]);
//   const [tolerance, setTolerance] = useState({ min: -0.125, max: 0.125 });
//   const [activeMeasurementTab, setActiveMeasurementTab] = useState("Top");
//   const [colCounts, setColCounts] = useState({ Top: 5, Middle: 5, Bottom: 5 });

//   const [summary, setSummary] = useState({
//     Top: {
//       totalParts: 0,
//       totalPass: 0,
//       totalReject: 0,
//       rejectMeasurement: 0,
//       rejectDefects: 0,
//       passRate: 0
//     },
//     Middle: {
//       totalParts: 0,
//       totalPass: 0,
//       totalReject: 0,
//       rejectMeasurement: 0,
//       rejectDefects: 0,
//       passRate: 0
//     },
//     Bottom: {
//       totalParts: 0,
//       totalPass: 0,
//       totalReject: 0,
//       rejectMeasurement: 0,
//       rejectDefects: 0,
//       passRate: 0
//     }
//   });

//   const [tableData, setTableData] = useState({
//     Top: [],
//     Middle: [],
//     Bottom: []
//   });

//   const [columnDefects, setColumnDefects] = useState({
//     Top: Array(5)
//       .fill([])
//       .map(() => Array(5).fill([])), // 5 columns, each with 5 panel indices
//     Middle: Array(5)
//       .fill([])
//       .map(() => Array(5).fill([])),
//     Bottom: Array(5)
//       .fill([])
//       .map(() => Array(5).fill([]))
//   });

//   const [moData, setMoData] = useState(null);
//   const [lotNoSearch, setLotNoSearch] = useState(""); // Search input for filtering Lot Nos
//   const [lotNoInput, setLotNoInput] = useState(""); // Input for typing Lot Nos when no dropdown
//   const [lotNos, setLotNos] = useState([]); // List of available Lot Nos
//   const [showLotNoDropdown, setShowLotNoDropdown] = useState(false); // Control dropdown visibility
//   const lotNoInputRef = useRef(null); // Ref to handle clicks outside the dropdown
//   const [colors, setColors] = useState([]);
//   const [tableNos, setTableNos] = useState([]);
//   const [markerData, setMarkerData] = useState([]);
//   const [filters, setFilters] = useState({
//     panelName: "",
//     side: "",
//     direction: "",
//     lw: ""
//   });

//   useEffect(() => {
//     const userAgent = navigator.userAgent.toLowerCase();
//     const isTabletDevice =
//       /ipad|android|tablet|kindle|playbook|silk/.test(userAgent) ||
//       (userAgent.includes("mobile") && !userAgent.includes("phone"));
//     setIsTablet(isTabletDevice);
//   }, []);

//   useEffect(() => {
//     const fetchMoNumbers = async () => {
//       if (moNoSearch.trim() === "") {
//         setMoNoOptions([]);
//         setShowMoNoDropdown(false);
//         return;
//       }
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/cutting-orders-mo-numbers`,
//           {
//             params: { search: moNoSearch },
//             headers: { "Content-Type": "application/json" },
//             withCredentials: true
//           }
//         );
//         setMoNoOptions(response.data);
//         setShowMoNoDropdown(response.data.length > 0);
//       } catch (error) {
//         console.error("Error fetching MO numbers:", error);
//         setMoNoOptions([]);
//         setShowMoNoDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: t("cutting.error"),
//           text: t("cutting.failedToFetchMONumbers")
//         });
//       }
//     };
//     fetchMoNumbers();
//   }, [moNoSearch]);

//   useEffect(() => {
//     const fetchMoData = async () => {
//       if (!moNo) {
//         resetForm();
//         return;
//       }
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/cutting-orders-details`,
//           {
//             params: { styleNo: moNo },
//             headers: { "Content-Type": "application/json" },
//             withCredentials: true
//           }
//         );
//         setMoData(response.data);
//         const lotNames =
//           response.data[0]?.lotNo?.length > 0
//             ? response.data[0].lotNo.map((l) => l.LotName)
//             : [];
//         //: ["N/A"];
//         setLotNos(lotNames);
//         setLotNo([]); // Reset to empty array
//         setLotNoSearch(""); // Reset search input
//         setLotNoInput(""); // Reset typed input
//         setShowLotNoDropdown(false); // Close dropdown
//         //setLotNo("");
//         const uniqueColors = [
//           ...new Set(response.data.map((d) => d.EngColor))
//         ].filter((color) => color);
//         setColors(uniqueColors);
//         setColor("");
//       } catch (error) {
//         console.error("Error fetching MO data:", error);
//         resetForm();
//         Swal.fire({
//           icon: "error",
//           title: t("cutting.error"),
//           text:
//             error.response?.status === 404
//               ? t("cutting.moNotFound", { moNo })
//               : error.response?.data?.message ||
//                 t("cutting.failedToFetchMOData")
//         });
//       }
//     };
//     fetchMoData();
//   }, [moNo]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         lotNoInputRef.current &&
//         !lotNoInputRef.current.contains(event.target)
//       ) {
//         setShowLotNoDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => {
//     if (color && moData) {
//       const selectedDocument = moData.find((d) => d.EngColor === color);
//       if (selectedDocument) {
//         const tableNumbers = selectedDocument.cuttingData
//           .filter((cd) => cd.tableNo)
//           .map((cd) => cd.tableNo);
//         setTableNos(tableNumbers);
//         setTableNo("");
//       } else {
//         setTableNos([]);
//         setTableNo("");
//       }
//     } else {
//       setTableNos([]);
//       setTableNo("");
//     }
//     setCuttingTableL("");
//     setCuttingTableNo("");
//     setMarker("");
//     setPlanLayerQty(0);
//     setTotalPlanPcs(0);
//     setActualLayers(0);
//     setTotalBundleQty("");
//     setBundleQtyCheck("");
//     setTotalInspectionQty(0);
//     setSelectedPanel("");
//     setSelectedSize("");
//     setSelectedSerialLetter("");
//     setMarkerData([]);
//     setAvailableSizes([]);
//   }, [color, moData]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         tableNoDropdownRef.current &&
//         !tableNoDropdownRef.current.contains(event.target)
//       ) {
//         setShowTableNoDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => {
//     if (tableNo && color && moData) {
//       const selectedDocument = moData.find((d) => d.EngColor === color);
//       if (selectedDocument) {
//         const selectedCuttingData = selectedDocument.cuttingData.find(
//           (cd) => cd.tableNo === tableNo
//         );
//         if (selectedCuttingData) {
//           const tableNoStr = selectedCuttingData.tableNo || "";
//           const no = tableNoStr.replace(/[T\s]/g, "");
//           setCuttingTableNo(no);
//           setMarker(selectedCuttingData.markerNo || "N/A");
//           setPlanLayerQty(selectedCuttingData.planLayerQty || 0);
//           setTotalPlanPcs(selectedCuttingData.totalPlanPcs || 0);
//           setActualLayers(selectedCuttingData.actualLayers || 0);
//           setMarkerData(
//             selectedCuttingData.markerData.filter(
//               (md) => md.markerRatio !== null
//             )
//           );
//           const fetchSizes = async () => {
//             try {
//               const response = await axios.get(
//                 `${API_BASE_URL}/api/cutting-orders-sizes`,
//                 {
//                   params: { styleNo: moNo, color, tableNo },
//                   headers: { "Content-Type": "application/json" },
//                   withCredentials: true
//                 }
//               );
//               setAvailableSizes(response.data);
//             } catch (error) {
//               console.error("Error fetching sizes:", error);
//               setAvailableSizes([]);
//               Swal.fire({
//                 icon: "error",
//                 title: t("cutting.error"),
//                 text: t("cutting.failedToFetchSizes")
//               });
//             }
//           };
//           fetchSizes();
//         } else {
//           resetTableData();
//         }
//       }
//     } else {
//       resetTableData();
//     }
//     setCuttingTableL("");
//   }, [tableNo, color, moData, moNo, t]);

//   useEffect(() => {
//     if (totalBundleQty && (actualLayers || planLayerQty)) {
//       const layersToUse = actualLayers || planLayerQty;
//       const multiplication = parseInt(totalBundleQty) * layersToUse;
//       let calculatedBundleQtyCheck;
//       if (multiplication >= 501 && multiplication <= 1200)
//         calculatedBundleQtyCheck = 5;
//       else if (multiplication >= 1201 && multiplication <= 3000)
//         calculatedBundleQtyCheck = 9;
//       else if (multiplication >= 3201 && multiplication <= 10000)
//         calculatedBundleQtyCheck = 14;
//       else if (multiplication >= 10001 && multiplication <= 35000)
//         calculatedBundleQtyCheck = 20;
//       else calculatedBundleQtyCheck = bundleQtyCheck || "";
//       setBundleQtyCheck(calculatedBundleQtyCheck.toString());
//       if (!isTotalInspectionQtyManual) {
//         setTotalInspectionQty(calculatedBundleQtyCheck * 15);
//       }
//     } else {
//       setBundleQtyCheck("");
//       if (!isTotalInspectionQtyManual) {
//         setTotalInspectionQty(0);
//       }
//     }
//     //   setTotalInspectionQty(calculatedBundleQtyCheck * 15);
//     // } else {
//     //   setBundleQtyCheck("");
//     //   setTotalInspectionQty(0);
//     // }
//   }, [totalBundleQty, actualLayers, planLayerQty, isTotalInspectionQtyManual]);

//   useEffect(() => {
//     if (bundleQtyCheck && !isTotalInspectionQtyManual) {
//       setTotalInspectionQty(parseInt(bundleQtyCheck) * 15);
//     } else if (!bundleQtyCheck && !isTotalInspectionQtyManual) {
//       setTotalInspectionQty(0);
//     }
//   }, [bundleQtyCheck, isTotalInspectionQtyManual]);

//   // useEffect(() => {
//   //   if (bundleQtyCheck) setTotalInspectionQty(parseInt(bundleQtyCheck) * 15);
//   //   else setTotalInspectionQty(0);
//   // }, [bundleQtyCheck]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         moNoDropdownRef.current &&
//         !moNoDropdownRef.current.contains(event.target)
//       )
//         setShowMoNoDropdown(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const resetForm = () => {
//     setMoNo("");
//     setMoNoSearch("");
//     setMoNoOptions([]);
//     setShowMoNoDropdown(false);
//     setMoData(null);
//     setLotNo([]); // Changed to array
//     //setLotNo("");
//     setLotNoSearch(""); // Reset search input
//     setLotNoInput(""); // Reset typed input
//     setShowLotNoDropdown(false); // Close dropdown
//     setColor("");
//     setTableNo("");
//     setCuttingTableL("");
//     setCuttingTableNo("");
//     setMarker("");
//     setPlanLayerQty(0);
//     setTotalPlanPcs(0);
//     setActualLayers(0);
//     setTotalBundleQty("");
//     setBundleQtyCheck("");
//     setTotalInspectionQty(0);
//     setShowTotalInspectionQtyNumberPad(false); // Reset NumberPad visibility
//     setIsTotalInspectionQtyManual(false); // Reset manual edit flag
//     setCuttingByAuto(true); // Reset to default
//     setCuttingByManual(false);
//     setSelectedPanel("");
//     setSelectedSize("");
//     setSelectedSerialLetter("");
//     setLotNos([]);
//     setColors([]);
//     setTableNos([]);
//     setMarkerData([]);
//     setAvailableSizes([]);
//     setShowOrderDetails(false);
//     setTolerance({ min: -0.125, max: 0.125 });
//     setActiveMeasurementTab("Top");
//     setColCounts({ Top: 5, Middle: 5, Bottom: 5 });
//     setSummary({
//       Top: {
//         totalParts: 0,
//         totalPass: 0,
//         totalReject: 0,
//         rejectMeasurement: 0,
//         rejectDefects: 0,
//         passRate: 0
//       },
//       Middle: {
//         totalParts: 0,
//         totalPass: 0,
//         totalReject: 0,
//         rejectMeasurement: 0,
//         rejectDefects: 0,
//         passRate: 0
//       },
//       Bottom: {
//         totalParts: 0,
//         totalPass: 0,
//         totalReject: 0,
//         rejectMeasurement: 0,
//         rejectDefects: 0,
//         passRate: 0
//       }
//     });
//     setTableData({ Top: [], Middle: [], Bottom: [] });
//     setColumnDefects({
//       Top: Array(5)
//         .fill([])
//         .map(() => Array(5).fill([])),
//       Middle: Array(5)
//         .fill([])
//         .map(() => Array(5).fill([])),
//       Bottom: Array(5)
//         .fill([])
//         .map(() => Array(5).fill([]))
//     });
//     setFilters({ panelName: "", side: "", direction: "", lw: "" });
//   };

//   const resetMeasurementData = () => {
//     setSummary({
//       Top: {
//         totalParts: 0,
//         totalPass: 0,
//         totalReject: 0,
//         rejectMeasurement: 0,
//         rejectDefects: 0,
//         passRate: 0
//       },
//       Middle: {
//         totalParts: 0,
//         totalPass: 0,
//         totalReject: 0,
//         rejectMeasurement: 0,
//         rejectDefects: 0,
//         passRate: 0
//       },
//       Bottom: {
//         totalParts: 0,
//         totalPass: 0,
//         totalReject: 0,
//         rejectMeasurement: 0,
//         rejectDefects: 0,
//         passRate: 0
//       }
//     });
//     setTableData({ Top: [], Middle: [], Bottom: [] });

//     setColumnDefects({
//       Top: Array(colCounts.Top)
//         .fill([])
//         .map(() => Array(5).fill([])),
//       Middle: Array(colCounts.Middle)
//         .fill([])
//         .map(() => Array(5).fill([])),
//       Bottom: Array(colCounts.Bottom)
//         .fill([])
//         .map(() => Array(5).fill([]))
//     });
//     setFilters({ panelName: "", side: "", direction: "", lw: "" });
//   };

//   // New useEffect
//   useEffect(() => {
//     //Reset tableData and columnDefects when selectedPanel changes
//     setTableData({
//       Top: [],
//       Middle: [],
//       Bottom: []
//     });

//     // Reset summary to reflect the new panel
//     setSummary({
//       Top: {
//         totalParts: 0,
//         totalPass: 0,
//         totalReject: 0,
//         rejectMeasurement: 0,
//         rejectDefects: 0,
//         passRate: 0
//       },
//       Middle: {
//         totalParts: 0,
//         totalPass: 0,
//         totalReject: 0,
//         rejectMeasurement: 0,
//         rejectDefects: 0,
//         passRate: 0
//       },
//       Bottom: {
//         totalParts: 0,
//         totalPass: 0,
//         totalReject: 0,
//         rejectMeasurement: 0,
//         rejectDefects: 0,
//         passRate: 0
//       }
//     });
//     setColumnDefects({
//       Top: Array(colCounts.Top)
//         .fill([])
//         .map(() => Array(5).fill([])),
//       Middle: Array(colCounts.Middle)
//         .fill([])
//         .map(() => Array(5).fill([])),
//       Bottom: Array(colCounts.Bottom)
//         .fill([])
//         .map(() => Array(5).fill([]))
//     });
//     // Reset filters to ensure they don't interfere with the new panel
//     setFilters({ panelName: "", side: "", direction: "", lw: "" });
//   }, [selectedPanel, colCounts.Top, colCounts.Middle, colCounts.Bottom]);

//   const resetTableData = () => {
//     setCuttingTableNo("");
//     setMarker("");
//     setPlanLayerQty(0);
//     setTotalPlanPcs(0);
//     setActualLayers(0);
//     setTotalBundleQty("");
//     setBundleQtyCheck("");
//     setTotalInspectionQty(0);
//     setCuttingByAuto(true); // Reset to default
//     setCuttingByManual(false);
//     setSelectedPanel("");
//     setSelectedSize("");
//     setSelectedSerialLetter("");
//     setMarkerData([]);
//     setAvailableSizes([]);
//   };

//   const collectMeasurementData = (
//     tab,
//     tableDataTab,
//     defectsTab,
//     tolerance,
//     numColumns
//   ) => {
//     const usedPanelIndices = [
//       ...new Set(
//         tableDataTab.filter((row) => row.isUsed).map((row) => row.panelIndex)
//       )
//     ];
//     return usedPanelIndices.map((panelIndex) => {
//       let totalMeasurementDefects = 0;
//       let totalDefectPcs = 0;
//       for (let colIndex = 0; colIndex < numColumns; colIndex++) {
//         const hasMeasurementDefect = tableDataTab
//           .filter((row) => row.panelIndex === panelIndex && row.isUsed)
//           .some((row) => {
//             const value = row.values[colIndex].decimal;
//             return (
//               value !== null && (value < tolerance.min || value > tolerance.max)
//             );
//           });
//         if (hasMeasurementDefect) totalMeasurementDefects++;
//         const hasDefects = defectsTab[colIndex][panelIndex - 1].length > 0;
//         if (hasDefects) totalDefectPcs++;
//       }
//       return {
//         panelIndex,
//         totalMeasurementDefects,
//         totalDefectPcs,
//         measurementPointData: tableDataTab
//           .filter((row) => row.panelIndex === panelIndex && row.isUsed)
//           .map((row) => ({
//             no: row.no,
//             measurementPointName: row.measurementPoint,
//             panelName: row.panelName,
//             side: row.panelSide,
//             direction: row.panelDirection,
//             property: row.measurementSide,
//             measurementValues: row.values.map((value, colIndex) => ({
//               partName: `${tab[0]}${colIndex + 1}`,
//               measurement: value.decimal,
//               status:
//                 value.decimal !== null &&
//                 (value.decimal < tolerance.min || value.decimal > tolerance.max)
//                   ? "Fail"
//                   : "Pass"
//             }))
//           })),
//         defectData: Array.from({ length: numColumns }, (_, colIndex) => ({
//           column: `${tab[0]}${colIndex + 1}`,
//           defects: defectsTab[colIndex][panelIndex - 1].map((d) => ({
//             defectName: d.defectName,
//             defectQty: d.count
//           }))
//         }))
//       };
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (
//       !moNo ||
//       //!lotNo ||
//       lotNo.length === 0 || // Changed to check array length
//       !color ||
//       !tableNo ||
//       !totalBundleQty ||
//       !bundleQtyCheck ||
//       !selectedPanel ||
//       !selectedSize ||
//       !selectedSerialLetter
//     ) {
//       Swal.fire({
//         icon: "warning",
//         title: t("cutting.missingInformation"),
//         text: t("cutting.fillRequiredFields")
//       });
//       return;
//     }

//     let cuttingtype = "";
//     if (cuttingByAuto && cuttingByManual) {
//       cuttingtype = "Auto & Manual";
//     } else if (cuttingByAuto) {
//       cuttingtype = "Auto";
//     } else if (cuttingByManual) {
//       cuttingtype = "Manual";
//     } else {
//       cuttingtype = "None"; // Optional: handle case where neither is selected
//     }

//     const inspectionData = {
//       size: selectedSize,
//       serialLetter: selectedSerialLetter,
//       tolerance,
//       totalPcs: totalParts,
//       totalPass: totalPass,
//       totalReject: totalReject,
//       totalRejectMeasurement:
//         summary.Top.rejectMeasurement +
//         summary.Middle.rejectMeasurement +
//         summary.Bottom.rejectMeasurement,
//       totalRejectDefects:
//         summary.Top.rejectDefects +
//         summary.Middle.rejectDefects +
//         summary.Bottom.rejectDefects,
//       passRate:
//         totalParts > 0
//           ? parseFloat(((totalPass / totalParts) * 100).toFixed(2))
//           : 0,
//       pcsLocation: [
//         {
//           location: "Top",
//           pcs: summary.Top.totalParts,
//           pass: summary.Top.totalPass,
//           reject: summary.Top.totalReject,
//           rejectGarment: summary.Top.totalReject, // Assuming rejectGarment is same as totalReject
//           rejectMeasurement: summary.Top.rejectMeasurement,
//           passrate: summary.Top.passRate,
//           measurementData: collectMeasurementData(
//             "Top",
//             tableData.Top,
//             columnDefects.Top,
//             tolerance,
//             colCounts.Top
//           )
//         },
//         {
//           location: "Middle",
//           pcs: summary.Middle.totalParts,
//           pass: summary.Middle.totalPass,
//           reject: summary.Middle.totalReject,
//           rejectGarment: summary.Middle.totalReject,
//           rejectMeasurement: summary.Middle.rejectMeasurement,
//           passrate: summary.Middle.passRate,
//           measurementData: collectMeasurementData(
//             "Middle",
//             tableData.Middle,
//             columnDefects.Middle,
//             tolerance,
//             colCounts.Middle
//           )
//         },
//         {
//           location: "Bottom",
//           pcs: summary.Bottom.totalParts,
//           pass: summary.Bottom.totalPass,
//           reject: summary.Bottom.totalReject,
//           rejectGarment: summary.Bottom.totalReject,
//           rejectMeasurement: summary.Bottom.rejectMeasurement,
//           passrate: summary.Bottom.passRate,
//           measurementData: collectMeasurementData(
//             "Bottom",
//             tableData.Bottom,
//             columnDefects.Bottom,
//             tolerance,
//             colCounts.Bottom
//           )
//         }
//       ],
//       inspectionTime: new Date().toLocaleTimeString("en-US", { hour12: false })
//     };

//     const report = {
//       inspectionDate: inspectionDate.toLocaleDateString("en-US"),
//       cutting_emp_id: user.emp_id,
//       cutting_emp_engName: user.eng_name,
//       cutting_emp_khName: user.kh_name,
//       cutting_emp_dept: user.dept_name,
//       cutting_emp_section: user.sect_name,
//       moNo,
//       lotNo: lotNo.join(","), // Join array into comma-separated string
//       //lotNo,
//       buyer: orderDetails?.Buyer || "N/A", // New field from orderDetails
//       color,
//       tableNo,
//       planLayerQty,
//       actualLayerQty: actualLayers,
//       totalPcs: totalPlanPcs,
//       cuttingtableLetter: cuttingTableL,
//       cuttingtableNo: cuttingTableNo,
//       marker,
//       markerRatio: markerData.map((data, index) => ({
//         index: index + 1,
//         markerSize: data.size,
//         ratio: data.markerRatio
//       })),
//       totalBundleQty: parseInt(totalBundleQty),
//       bundleQtyCheck: parseInt(bundleQtyCheck),
//       totalInspectionQty,
//       cuttingtype,
//       garmentType: selectedPanel,
//       orderQty: orderDetails?.totalOrderQty || 0, // New field from orderDetails
//       inspectionData
//     };

//     try {
//       //  API call
//       await axios.post(`${API_BASE_URL}/api/save-cutting-inspection`, report);
//       Swal.fire({
//         icon: "success",
//         title: t("cutting.success"),
//         text: t("cutting.dataSaved")
//       });
//       resetMeasurementData(); // Reset only summary details and below
//       //resetForm();
//     } catch (error) {
//       console.error("Error saving Cutting data:", error);
//       Swal.fire({
//         icon: "error",
//         title: t("cutting.error"),
//         text: t("cutting.failedToSaveData")
//       });
//     }
//   };

//   const orderDetails =
//     color && moData ? moData.find((d) => d.EngColor === color) : null;

//   const filteredMeasurementPoints = measurementPoints.filter(
//     (point) => point.panel === selectedPanel
//   );

//   const serialLetters = Array.from({ length: 26 }, (_, i) =>
//     String.fromCharCode(65 + i)
//   );
//   const toleranceOptions = [
//     { label: "-1/16, 1/16", value: { min: -0.0625, max: 0.0625 } },
//     { label: "-1/8, 1/8", value: { min: -0.125, max: 0.125 } }
//   ];

//   const handleToleranceChange = (e) => {
//     const selectedOption = toleranceOptions.find(
//       (option) => option.label === e.target.value
//     );
//     if (selectedOption) setTolerance(selectedOption.value);
//   };

//   const handleColChange = (tab, value) => {
//     const newCount = parseInt(value);
//     setColCounts((prev) => ({ ...prev, [tab]: newCount }));
//     setColumnDefects((prev) => {
//       const currentDefects = prev[tab];
//       const newDefects = Array(newCount)
//         .fill([])
//         .map(() => Array(5).fill([]));
//       for (let i = 0; i < Math.min(currentDefects.length, newCount); i++) {
//         // Copy existing panel indices (up to 5)
//         for (let j = 0; j < Math.min(currentDefects[i].length, 5); j++) {
//           newDefects[i] = currentDefects[i];
//         }
//       }
//       return { ...prev, [tab]: newDefects };
//     });
//     // Summary will be recalculated by MeasurementTable
//   };

//   const updateSummary = (tab, data) => {
//     setSummary((prev) => ({ ...prev, [tab]: data }));
//   };

//   const updateTableData = (tab, data) => {
//     setTableData((prev) => ({ ...prev, [tab]: data }));
//   };

//   const totalParts =
//     summary.Top.totalParts +
//     summary.Middle.totalParts +
//     summary.Bottom.totalParts;
//   const totalPass =
//     summary.Top.totalPass + summary.Middle.totalPass + summary.Bottom.totalPass;
//   const totalReject =
//     summary.Top.totalReject +
//     summary.Middle.totalReject +
//     summary.Bottom.totalReject;

//   const uniqueOptions = (key) => [
//     ...new Set(
//       filteredMeasurementPoints.map((point) => point[key]).filter(Boolean)
//     )
//   ];

//   if (authLoading) return <div>{t("cutting.loading")}</div>;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
//       <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
//         <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
//           {t("cutting.cutting_inspection")}
//         </h1>
//         <div className="flex justify-center mb-4">
//           <button
//             onClick={() => setActiveTab("form")}
//             className={`px-4 py-2 ${
//               activeTab === "form"
//                 ? "bg-blue-600 text-white"
//                 : "bg-gray-200 text-gray-700"
//             } rounded-l-lg`}
//           >
//             {t("cutting.cuttingForm")}
//           </button>
//           <button
//             onClick={() => setActiveTab("data")}
//             className={`px-4 py-2 ${
//               activeTab === "data"
//                 ? "bg-blue-600 text-white"
//                 : "bg-gray-200 text-gray-700"
//             }`}
//           >
//             {t("cutting.data")}
//           </button>
//           <button
//             onClick={() => setActiveTab("db")}
//             className={`px-4 py-2 flex items-center space-x-2 ${
//               activeTab === "db"
//                 ? "bg-blue-600 text-white"
//                 : "bg-gray-200 text-gray-700"
//             } rounded-r-lg`}
//           >
//             <Database className="w-5 h-5" />
//             <span>DB</span>
//           </button>
//         </div>

//         {activeTab === "form" ? (
//           <>
//             <div className="mb-6">
//               <div className="flex flex-wrap gap-4 items-end">
//                 <div className="flex-1 min-w-[150px]">
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.date")}
//                   </label>
//                   <DatePicker
//                     selected={inspectionDate}
//                     onChange={(date) => setInspectionDate(date)}
//                     className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
//                   />
//                   {orderDetails && (
//                     <button
//                       onClick={() => setShowOrderDetails(!showOrderDetails)}
//                       className="text-gray-600 hover:text-gray-800 mt-1"
//                     >
//                       {showOrderDetails ? (
//                         <EyeOff className="w-5 h-5" />
//                       ) : (
//                         <Eye className="w-5 h-5" />
//                       )}
//                     </button>
//                   )}
//                 </div>
//                 <div className="flex-1 min-w-[150px]">
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.moNo")}
//                   </label>
//                   <div className="relative" ref={moNoDropdownRef}>
//                     <input
//                       type="text"
//                       value={moNoSearch}
//                       onChange={(e) => setMoNoSearch(e.target.value)}
//                       placeholder={t("cutting.search_mono")}
//                       className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                     />
//                     {showMoNoDropdown && (
//                       <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                         {moNoOptions.map((option, index) => (
//                           <li
//                             key={index}
//                             onClick={() => {
//                               setMoNo(option);
//                               setMoNoSearch(option);
//                               setShowMoNoDropdown(false);
//                             }}
//                             className="p-2 hover:bg-blue-100 cursor-pointer"
//                           >
//                             {option}
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>
//                 </div>

//                 <div className="flex-1 min-w-[150px]">
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.lotNo")}
//                   </label>
//                   <div className="relative mt-1" ref={lotNoInputRef}>
//                     {lotNos.length > 0 ? (
//                       <>
//                         <div
//                           className={`w-full p-2 border border-gray-300 rounded-lg flex flex-wrap gap-1 items-center ${
//                             !moNo
//                               ? "bg-gray-100 cursor-not-allowed"
//                               : "bg-white"
//                           }`}
//                         >
//                           {lotNo.map((lot, index) => (
//                             <span
//                               key={index}
//                               className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded"
//                             >
//                               {lot}
//                               <button
//                                 type="button"
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   setLotNo(lotNo.filter((_, i) => i !== index));
//                                 }}
//                                 className="ml-1 text-blue-600 hover:text-blue-800"
//                               >
//                                 ×
//                               </button>
//                             </span>
//                           ))}
//                           <input
//                             type="text"
//                             value={lotNoSearch}
//                             onChange={(e) => {
//                               setLotNoSearch(e.target.value);
//                               setShowLotNoDropdown(true);
//                             }}
//                             onClick={() => moNo && setShowLotNoDropdown(true)}
//                             placeholder={t("cutting.search_lot_no")}
//                             className="flex-1 outline-none bg-transparent min-w-[100px]"
//                             disabled={!moNo}
//                           />
//                         </div>
//                         {showLotNoDropdown && (
//                           <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-80 overflow-y-auto shadow-lg">
//                             {lotNos
//                               .filter((lot) =>
//                                 lot
//                                   .toLowerCase()
//                                   .includes(lotNoSearch.toLowerCase())
//                               )
//                               .map((lot, index) => (
//                                 <li
//                                   key={index}
//                                   onClick={() => {
//                                     if (!lotNo.includes(lot)) {
//                                       setLotNo([...lotNo, lot]);
//                                       setLotNoSearch("");
//                                       setShowLotNoDropdown(false);
//                                     }
//                                   }}
//                                   className="p-2 hover:bg-blue-100 cursor-pointer"
//                                 >
//                                   {lot}
//                                 </li>
//                               ))}
//                           </ul>
//                         )}
//                       </>
//                     ) : (
//                       <div
//                         className={`w-full p-2 border border-gray-300 rounded-lg flex flex-wrap gap-1 items-center ${
//                           !moNo ? "bg-gray-100 cursor-not-allowed" : "bg-white"
//                         }`}
//                       >
//                         {lotNo.map((lot, index) => (
//                           <span
//                             key={index}
//                             className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded"
//                           >
//                             {lot}
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 setLotNo(lotNo.filter((_, i) => i !== index))
//                               }
//                               className="ml-1 text-blue-600 hover:text-blue-800"
//                             >
//                               ×
//                             </button>
//                           </span>
//                         ))}
//                         <div className="inline-flex items-center gap-1">
//                           <input
//                             type="text"
//                             value={lotNoInput}
//                             onChange={(e) => setLotNoInput(e.target.value)}
//                             placeholder={t("cutting.enter_lot_no")}
//                             className="flex-1 outline-none bg-transparent"
//                             disabled={!moNo}
//                           />
//                           <button
//                             type="button"
//                             onClick={() => {
//                               if (
//                                 lotNoInput.trim() &&
//                                 !lotNo.includes(lotNoInput.trim())
//                               ) {
//                                 setLotNo([...lotNo, lotNoInput.trim()]);
//                                 setLotNoInput("");
//                               }
//                             }}
//                             className={`p-1 text-blue-600 hover:text-blue-800 ${
//                               !lotNoInput.trim() || !moNo
//                                 ? "opacity-50 cursor-not-allowed"
//                                 : ""
//                             }`}
//                             disabled={!lotNoInput.trim() || !moNo}
//                           >
//                             +
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <div className="flex-1 min-w-[150px]">
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.color")}
//                   </label>
//                   <select
//                     value={color}
//                     onChange={(e) => setColor(e.target.value)}
//                     className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                     disabled={!moNo || colors.length === 0}
//                   >
//                     <option value="">{t("cutting.select_color")}</option>
//                     {colors.map((col, index) => (
//                       <option key={index} value={col}>
//                         {col}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//               {showOrderDetails && orderDetails && (
//                 <div className="mt-2 p-4 bg-gray-100 rounded-lg">
//                   <div className="grid grid-cols-1 gap-2 text-sm">
//                     <p>
//                       <strong>{t("cutting.customerStyle")}:</strong>{" "}
//                       {orderDetails.BuyerStyle || "N/A"}
//                     </p>
//                     <p>
//                       <strong>{t("cutting.buyer")}:</strong>{" "}
//                       {orderDetails.Buyer || "N/A"}
//                     </p>
//                     <p>
//                       <strong>{t("cutting.orderQty")}:</strong>{" "}
//                       {orderDetails.totalOrderQty || "N/A"}
//                     </p>
//                   </div>
//                 </div>
//               )}
//               <hr className="my-4 border-gray-300" />
//               <div className="flex flex-wrap items-start gap-4">
//                 <div className="flex-1 min-w-[150px]">
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.tableNo")}
//                   </label>
//                   <div className="relative" ref={tableNoDropdownRef}>
//                     <input
//                       type="text"
//                       inputMode="numeric"
//                       value={tableNoSearch}
//                       onChange={(e) => {
//                         setTableNoSearch(e.target.value);
//                         setShowTableNoDropdown(true);
//                       }}
//                       onClick={() => {
//                         if (color && tableNos.length > 0) {
//                           setShowTableNoDropdown(true);
//                         }
//                       }}
//                       placeholder={t("cutting.search_table_no")}
//                       className={`mt-1 w-full p-2 border border-gray-300 rounded-lg ${
//                         !color || tableNos.length === 0
//                           ? "bg-gray-100 cursor-not-allowed"
//                           : ""
//                       }`}
//                       disabled={!color || tableNos.length === 0}
//                     />
//                     {showTableNoDropdown && (
//                       <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-64 overflow-y-auto shadow-lg">
//                         {tableNos
//                           .filter((table) =>
//                             table
//                               .toLowerCase()
//                               .includes(tableNoSearch.toLowerCase())
//                           )
//                           .map((table, index) => (
//                             <li
//                               key={index}
//                               onClick={() => {
//                                 setTableNo(table);
//                                 setTableNoSearch(table);
//                                 setShowTableNoDropdown(false);
//                               }}
//                               className="p-2 hover:bg-blue-100 cursor-pointer"
//                             >
//                               {table}
//                             </li>
//                           ))}
//                       </ul>
//                     )}
//                   </div>
//                   {tableNo && (
//                     <div className="mt-2 p-4 bg-gray-100 rounded-lg">
//                       <div className="flex space-x-4 text-sm">
//                         <p>
//                           <strong>{t("cutting.layerQty")}</strong>{" "}
//                           {planLayerQty}
//                         </p>
//                         <p>
//                           <strong>{t("cutting.totalPcs")}</strong>{" "}
//                           {totalPlanPcs}
//                         </p>
//                         <p>
//                           <strong>{t("cutting.actualLayerQty")}</strong>{" "}
//                           {actualLayers}
//                         </p>
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex-1 min-w-[150px]">
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.cuttingTable")}
//                   </label>
//                   <div className="flex items-center gap-2">
//                     <div className="flex-1">
//                       <label className="block text-xs font-medium text-gray-600">
//                         {t("cutting.l")}
//                       </label>
//                       <select
//                         value={cuttingTableL}
//                         onChange={(e) => setCuttingTableL(e.target.value)}
//                         className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                         disabled={!tableNo}
//                       >
//                         <option value="">{t("cutting.select")}</option>
//                         {[...Array(26)].map((_, i) => (
//                           <option key={i} value={String.fromCharCode(65 + i)}>
//                             {String.fromCharCode(65 + i)}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="flex-1">
//                       <label className="block text-xs font-medium text-gray-600">
//                         {t("cutting.no")}
//                       </label>
//                       <input
//                         type="text"
//                         value={cuttingTableNo}
//                         readOnly
//                         className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
//                       />
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex-1 min-w-[150px]">
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.marker")}
//                   </label>
//                   <input
//                     type="text"
//                     value={marker}
//                     readOnly
//                     className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
//                   />
//                 </div>
//               </div>
//             </div>
//             {markerData.length > 0 && (
//               <div className="mb-6">
//                 <h2 className="text-xl font-semibold text-gray-800 mb-4">
//                   {t("cutting.markerRatio")}
//                 </h2>
//                 <div className="overflow-x-auto">
//                   <table className="w-full border-collapse border border-gray-300">
//                     <thead>
//                       <tr className="bg-gray-200">
//                         {markerData.map((data, index) => (
//                           <th
//                             key={index}
//                             className="border border-gray-300 p-2 text-center"
//                           >
//                             {data.size || `Size ${data.No}`}
//                           </th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody>
//                       <tr>
//                         {markerData.map((data, index) => (
//                           <td
//                             key={index}
//                             className="border border-gray-300 p-2 text-center"
//                           >
//                             {data.markerRatio}
//                           </td>
//                         ))}
//                       </tr>
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}
//             {markerData.length > 0 && (
//               <div className="mb-6">
//                 <div className="flex flex-wrap items-center gap-4">
//                   <div className="flex-1 min-w-[200px]">
//                     <label className="block text-sm font-medium text-gray-700">
//                       {t("cutting.totalBundleQty")}
//                     </label>
//                     <div className="relative">
//                       <input
//                         type={isTablet ? "number" : "text"}
//                         inputMode="numeric"
//                         value={totalBundleQty}
//                         onChange={(e) => setTotalBundleQty(e.target.value)}
//                         className="mt-1 w-full p-2 border border-gray-300 rounded-lg pr-10"
//                         placeholder="Enter Total Bundle Qty"
//                       />
//                       {!isTablet && (
//                         <button
//                           onClick={() => setShowNumberPad(true)}
//                           className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
//                         >
//                           <Keyboard className="w-5 h-5" />
//                         </button>
//                       )}
//                     </div>
//                     {showNumberPad && (
//                       <NumberPad
//                         onClose={() => setShowNumberPad(false)}
//                         onInput={(value) => setTotalBundleQty(value)}
//                         initialValue={totalBundleQty}
//                       />
//                     )}
//                   </div>
//                   <div className="flex-1 min-w-[200px]">
//                     <label className="block text-sm font-medium text-gray-700">
//                       {t("cutting.bundleQtyCheck")}
//                     </label>
//                     <div className="relative">
//                       <input
//                         type={isTablet ? "number" : "text"}
//                         inputMode="numeric"
//                         value={bundleQtyCheck}
//                         onChange={(e) => setBundleQtyCheck(e.target.value)}
//                         className="mt-1 w-full p-2 border border-gray-300 rounded-lg pr-10"
//                         placeholder="Enter Bundle Qty Check"
//                         readOnly={
//                           totalBundleQty &&
//                           (actualLayers || planLayerQty) &&
//                           parseInt(totalBundleQty) *
//                             (actualLayers || planLayerQty) >=
//                             501 &&
//                           parseInt(totalBundleQty) *
//                             (actualLayers || planLayerQty) <=
//                             35000
//                         }
//                       />
//                       {!isTablet &&
//                         (!totalBundleQty ||
//                           (!actualLayers && !planLayerQty) ||
//                           parseInt(totalBundleQty) *
//                             (actualLayers || planLayerQty) <
//                             501 ||
//                           parseInt(totalBundleQty) *
//                             (actualLayers || planLayerQty) >
//                             35000) && (
//                           <button
//                             onClick={() => setShowBundleQtyCheckNumberPad(true)}
//                             className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
//                           >
//                             <Keyboard className="w-5 h-5" />
//                           </button>
//                         )}
//                     </div>
//                     {showBundleQtyCheckNumberPad && (
//                       <NumberPad
//                         onClose={() => setShowBundleQtyCheckNumberPad(false)}
//                         onInput={(value) => setBundleQtyCheck(value)}
//                         initialValue={bundleQtyCheck}
//                       />
//                     )}
//                   </div>
//                   <div className="flex-1 min-w-[200px]">
//                     <label className="block text-sm font-medium text-gray-700">
//                       {t("cutting.totalInspectionQty")}
//                     </label>
//                     <div className="relative">
//                       <input
//                         type={isTablet ? "number" : "text"}
//                         inputMode="numeric"
//                         value={totalInspectionQty}
//                         onChange={(e) => {
//                           setTotalInspectionQty(e.target.value);
//                           setIsTotalInspectionQtyManual(true);
//                         }}
//                         className="mt-1 w-full p-2 border border-gray-300 rounded-lg pr-10"
//                         placeholder="Enter Total Inspection Qty"
//                       />
//                       {!isTablet && (
//                         <button
//                           onClick={() =>
//                             setShowTotalInspectionQtyNumberPad(true)
//                           }
//                           className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
//                         >
//                           <Keyboard className="w-5 h-5" />
//                         </button>
//                       )}
//                     </div>
//                     {showTotalInspectionQtyNumberPad && (
//                       <NumberPad
//                         onClose={() =>
//                           setShowTotalInspectionQtyNumberPad(false)
//                         }
//                         onInput={(value) => {
//                           setTotalInspectionQty(value);
//                           setIsTotalInspectionQtyManual(true);
//                         }}
//                         initialValue={totalInspectionQty}
//                       />
//                     )}
//                   </div>

//                   <div className="flex-1 min-w-[200px]">
//                     <label className="block text-sm font-medium text-gray-700">
//                       {t("cutting.cuttingBy")}
//                     </label>
//                     <div className="flex items-center space-x-4 mt-1">
//                       <div className="flex items-center">
//                         <input
//                           type="checkbox"
//                           checked={cuttingByAuto}
//                           onChange={(e) => setCuttingByAuto(e.target.checked)}
//                           className="h-4 w-4 text-blue-600 border-gray-300 rounded"
//                         />
//                         <label className="ml-2 text-sm text-gray-700">
//                           {t("cutting.auto")}
//                         </label>
//                       </div>
//                       <div className="flex items-center">
//                         <input
//                           type="checkbox"
//                           checked={cuttingByManual}
//                           onChange={(e) => setCuttingByManual(e.target.checked)}
//                           className="h-4 w-4 text-blue-600 border-gray-300 rounded"
//                         />
//                         <label className="ml-2 text-sm text-gray-700">
//                           {t("cutting.manual")}
//                         </label>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="mt-2 text-sm text-gray-600">
//                   {t("cutting.samplingStandard")}
//                 </div>
//                 <hr className="my-4 border-gray-300" />
//                 <div className="flex flex-wrap items-center gap-4">
//                   <div className="flex-1 min-w-[200px]">
//                     <label className="block text-sm font-medium text-gray-700">
//                       {t("cutting.panel")}
//                     </label>
//                     <select
//                       value={selectedPanel}
//                       onChange={(e) => {
//                         setSelectedPanel(e.target.value);
//                         // Do not reset tableData or columnDefects here to persist data
//                       }}
//                       className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                     >
//                       <option value="">{t("cutting.select_panel")}</option>
//                       <option value="Top">{t("cutting.garment_top")}</option>
//                       <option value="Bottom">
//                         {t("cutting.garment_bottom")}
//                       </option>
//                       <option value="Zipper Jacket">
//                         {t("cutting.zipper")}
//                       </option>
//                     </select>
//                   </div>
//                   <div className="flex-1 min-w-[200px]">
//                     <label className="block text-sm font-medium text-gray-700">
//                       {t("cutting.size")}
//                     </label>
//                     <select
//                       value={selectedSize}
//                       onChange={(e) => setSelectedSize(e.target.value)}
//                       className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                       disabled={!tableNo || availableSizes.length === 0}
//                     >
//                       <option value="">{t("cutting.select_size")}</option>
//                       {availableSizes.map((size, index) => (
//                         <option key={index} value={size}>
//                           {size}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <div className="flex-1 min-w-[200px]">
//                     <label className="block text-sm font-medium text-gray-700">
//                       {t("cutting.serialLetter")}
//                     </label>
//                     <select
//                       value={selectedSerialLetter}
//                       onChange={(e) => setSelectedSerialLetter(e.target.value)}
//                       className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                     >
//                       <option value="">
//                         {t("cutting.select_serial_letter")}
//                       </option>
//                       {serialLetters.map((letter, index) => (
//                         <option key={index} value={letter}>
//                           {letter}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <div className="flex-1 min-w-[200px]">
//                     <label className="block text-sm font-medium text-gray-700">
//                       {t("cutting.tolerance")}
//                     </label>
//                     <select
//                       value={
//                         toleranceOptions.find(
//                           (opt) =>
//                             opt.value.min === tolerance.min &&
//                             opt.value.max === tolerance.max
//                         )?.label
//                       }
//                       onChange={handleToleranceChange}
//                       className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                     >
//                       {toleranceOptions.map((option, index) => (
//                         <option key={index} value={option.label}>
//                           {option.label}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//                 {selectedPanel && filteredMeasurementPoints.length > 0 && (
//                   <>
//                     <hr className="my-4 border-gray-300" />
//                     <h3 className="text-sm font-medium text-gray-600 mb-2">
//                       {t("cutting.summaryDetails")}
//                     </h3>
//                     <div className="mb-4">
//                       <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-6 gap-4">
//                         <div className="p-4 bg-blue-100 rounded-lg text-center">
//                           <p className="text-xs font-medium text-gray-700">
//                             {t("cutting.parts")}
//                           </p>
//                           <p className="text-lg font-bold">{totalParts}</p>
//                         </div>
//                         <div className="p-4 bg-green-100 rounded-lg text-center">
//                           <p className="text-xs font-medium text-gray-700">
//                             {t("cutting.pass")}
//                           </p>
//                           <p className="text-lg font-bold">{totalPass}</p>
//                         </div>
//                         <div className="p-4 bg-red-100 rounded-lg text-center">
//                           <p className="text-xs font-medium text-gray-700">
//                             {t("cutting.reject")}
//                           </p>
//                           <p className="text-lg font-bold">{totalReject}</p>
//                         </div>
//                         <div className="p-4 bg-orange-100 rounded-lg text-center">
//                           <p className="text-xs font-medium text-gray-700">
//                             {t("cutting.rejectMeasurements")}
//                           </p>
//                           <p className="text-lg font-bold">
//                             {summary.Top.rejectMeasurement +
//                               summary.Middle.rejectMeasurement +
//                               summary.Bottom.rejectMeasurement}
//                           </p>
//                         </div>
//                         <div className="p-4 bg-purple-100 rounded-lg text-center">
//                           <p className="text-xs font-medium text-gray-700">
//                             {t("cutting.rejectDefects")}
//                           </p>
//                           <p className="text-lg font-bold">
//                             {summary.Top.rejectDefects +
//                               summary.Middle.rejectDefects +
//                               summary.Bottom.rejectDefects}
//                           </p>
//                         </div>
//                         <div className="p-4 bg-yellow-100 rounded-lg text-center">
//                           <p className="text-xs font-medium text-gray-700">
//                             {t("cutting.passRate")}
//                           </p>
//                           <p className="text-lg font-bold">
//                             {totalParts > 0
//                               ? ((totalPass / totalParts) * 100).toFixed(2)
//                               : 0}
//                             %
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                     <hr className="my-4 border-gray-300" />
//                     <h3 className="text-sm font-medium text-gray-600 mb-2">
//                       {t("cutting.measurementDetails")}
//                     </h3>
//                     <div className="flex justify-center mb-4">
//                       <button
//                         onClick={() => setActiveMeasurementTab("Top")}
//                         className={`px-4 py-2 ${
//                           activeMeasurementTab === "Top"
//                             ? "bg-blue-600 text-white"
//                             : "bg-gray-200 text-gray-700"
//                         } rounded-l-lg`}
//                       >
//                         {t("cutting.top")}
//                       </button>
//                       <button
//                         onClick={() => setActiveMeasurementTab("Middle")}
//                         className={`px-4 py-2 ${
//                           activeMeasurementTab === "Middle"
//                             ? "bg-blue-600 text-white"
//                             : "bg-gray-200 text-gray-700"
//                         }`}
//                       >
//                         {t("cutting.middle")}
//                       </button>
//                       <button
//                         onClick={() => setActiveMeasurementTab("Bottom")}
//                         className={`px-4 py-2 ${
//                           activeMeasurementTab === "Bottom"
//                             ? "bg-blue-600 text-white"
//                             : "bg-gray-200 text-gray-700"
//                         } rounded-r-lg`}
//                       >
//                         {t("cutting.bottom")}
//                       </button>
//                     </div>
//                     <div className="flex items-center gap-4 mb-4">
//                       <label className="text-sm font-medium text-gray-700">
//                         Col:
//                       </label>
//                       <select
//                         value={colCounts[activeMeasurementTab]}
//                         onChange={(e) =>
//                           handleColChange(activeMeasurementTab, e.target.value)
//                         }
//                         className="p-2 border border-gray-300 rounded-lg"
//                       >
//                         {[...Array(5)].map((_, i) => (
//                           <option key={i + 1} value={i + 1}>
//                             {i + 1}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-4 mb-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">
//                           {t("cutting.panelName")}
//                         </label>
//                         <select
//                           value={filters.panelName}
//                           onChange={(e) =>
//                             setFilters({
//                               ...filters,
//                               panelName: e.target.value
//                             })
//                           }
//                           className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                         >
//                           <option value="">All</option>
//                           {uniqueOptions("panelName").map((option, index) => (
//                             <option key={index} value={option}>
//                               {option}
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">
//                           {t("cutting.side")}
//                         </label>
//                         <select
//                           value={filters.side}
//                           onChange={(e) =>
//                             setFilters({ ...filters, side: e.target.value })
//                           }
//                           className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                         >
//                           <option value="">All</option>
//                           {uniqueOptions("panelSide").map((option, index) => (
//                             <option key={index} value={option}>
//                               {option}
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">
//                           {t("cutting.direction")}
//                         </label>
//                         <select
//                           value={filters.direction}
//                           onChange={(e) =>
//                             setFilters({
//                               ...filters,
//                               direction: e.target.value
//                             })
//                           }
//                           className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                         >
//                           <option value="">All</option>
//                           {uniqueOptions("panelDirection").map(
//                             (option, index) => (
//                               <option key={index} value={option}>
//                                 {option}
//                               </option>
//                             )
//                           )}
//                         </select>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">
//                           {t("cutting.lw")}
//                         </label>
//                         <select
//                           value={filters.lw}
//                           onChange={(e) =>
//                             setFilters({ ...filters, lw: e.target.value })
//                           }
//                           className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                         >
//                           <option value="">All</option>
//                           {uniqueOptions("measurementSide").map(
//                             (option, index) => (
//                               <option key={index} value={option}>
//                                 {option}
//                               </option>
//                             )
//                           )}
//                         </select>
//                       </div>
//                     </div>
//                     <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-4">
//                       <div className="p-4 bg-blue-100 rounded-lg text-center">
//                         <p className="text-xs font-medium text-gray-700">
//                           {t("cutting.parts")}
//                         </p>
//                         <p className="text-lg font-bold">
//                           {summary[activeMeasurementTab].totalParts}
//                         </p>
//                       </div>
//                       <div className="p-4 bg-green-100 rounded-lg text-center">
//                         <p className="text-xs font-medium text-gray-700">
//                           {t("cutting.pass")}
//                         </p>
//                         <p className="text-lg font-bold">
//                           {summary[activeMeasurementTab].totalPass}
//                         </p>
//                       </div>
//                       <div className="p-4 bg-red-100 rounded-lg text-center">
//                         <p className="text-xs font-medium text-gray-700">
//                           {t("cutting.reject")}
//                         </p>
//                         <p className="text-lg font-bold">
//                           {summary[activeMeasurementTab].totalReject}
//                         </p>
//                       </div>
//                       <div className="p-4 bg-orange-100 rounded-lg text-center">
//                         <p className="text-xs font-medium text-gray-700">
//                           {t("cutting.rejectMeasurements")}
//                         </p>
//                         <p className="text-lg font-bold">
//                           {summary[activeMeasurementTab].rejectMeasurement}
//                         </p>
//                       </div>
//                       <div className="p-4 bg-purple-100 rounded-lg text-center">
//                         <p className="text-xs font-medium text-gray-700">
//                           {t("cutting.rejectDefects")}
//                         </p>
//                         <p className="text-lg font-bold">
//                           {summary[activeMeasurementTab].rejectDefects}
//                         </p>
//                       </div>
//                       <div className="p-4 bg-yellow-100 rounded-lg text-center">
//                         <p className="text-xs font-medium text-gray-700">
//                           {t("cutting.passRate")}
//                         </p>
//                         <p className="text-lg font-bold">
//                           {summary[activeMeasurementTab].passRate}%
//                         </p>
//                       </div>
//                     </div>
//                     {activeMeasurementTab === "Top" && (
//                       <MeasurementTable
//                         key={`Top-${selectedPanel}`}
//                         tab="Top"
//                         measurementPoints={filteredMeasurementPoints}
//                         numColumns={colCounts.Top}
//                         tolerance={tolerance}
//                         onUpdate={(data) => updateSummary("Top", data)}
//                         tableData={tableData.Top}
//                         setTableData={(data) => updateTableData("Top", data)}
//                         filters={filters}
//                         defects={columnDefects.Top}
//                         setDefects={(newDefects) =>
//                           setColumnDefects((prev) => ({
//                             ...prev,
//                             Top: newDefects
//                           }))
//                         }
//                       />
//                     )}
//                     {activeMeasurementTab === "Middle" && (
//                       <MeasurementTable
//                         key={`Middle-${selectedPanel}`}
//                         tab="Middle"
//                         measurementPoints={filteredMeasurementPoints}
//                         numColumns={colCounts.Middle}
//                         tolerance={tolerance}
//                         onUpdate={(data) => updateSummary("Middle", data)}
//                         tableData={tableData.Middle}
//                         setTableData={(data) => updateTableData("Middle", data)}
//                         filters={filters}
//                         defects={columnDefects.Middle}
//                         setDefects={(newDefects) =>
//                           setColumnDefects((prev) => ({
//                             ...prev,
//                             Middle: newDefects
//                           }))
//                         }
//                       />
//                     )}
//                     {activeMeasurementTab === "Bottom" && (
//                       <MeasurementTable
//                         key={`Bottom-${selectedPanel}`}
//                         tab="Bottom"
//                         measurementPoints={filteredMeasurementPoints}
//                         numColumns={colCounts.Bottom}
//                         tolerance={tolerance}
//                         onUpdate={(data) => updateSummary("Bottom", data)}
//                         tableData={tableData.Bottom}
//                         setTableData={(data) => updateTableData("Bottom", data)}
//                         filters={filters}
//                         defects={columnDefects.Bottom}
//                         setDefects={(newDefects) =>
//                           setColumnDefects((prev) => ({
//                             ...prev,
//                             Bottom: newDefects
//                           }))
//                         }
//                       />
//                     )}
//                   </>
//                 )}
//                 <div className="mt-2 text-sm text-gray-600">
//                   Additional Information
//                 </div>
//               </div>
//             )}
//             <div className="flex justify-center mt-6">
//               <button
//                 onClick={handleSubmit}
//                 className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800"
//               >
//                 {t("cutting.submit")}
//               </button>
//             </div>
//           </>
//         ) : activeTab === "data" ? (
//           <div className="text-center text-gray-600">
//             {t("cutting.dataTabPlaceholder")}
//           </div>
//         ) : (
//           <CuttingOrderModify />
//           // <div className="text-center text-gray-600">
//           //   {t("cutting.dbTabPlaceholder")}
//           // </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CuttingPage;

import axios from "axios";
import { Database, Eye, EyeOff, Keyboard } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import NumberPad from "../components/forms/NumberPad";
import CuttingOrderModify from "../components/inspection/cutting/CuttingOrderModify";
import CuttingMeasurementPointsModify from "../components/inspection/cutting/CuttingMeasurementPointsModify ";
import MeasurementTable from "../components/inspection/cutting/MeasurementTable";
import CuttingIssues from "../components/inspection/cutting/CuttingIssues";

//import { measurementPoints } from "../constants/cuttingmeasurement";

const CuttingPage = () => {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("form");
  const [inspectionDate, setInspectionDate] = useState(new Date());
  const [moNo, setMoNo] = useState("");
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const moNoDropdownRef = useRef(null);
  const [tableNo, setTableNo] = useState("");
  const [tableNoSearch, setTableNoSearch] = useState("");
  const [tableNoOptions, setTableNoOptions] = useState([]);
  const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
  const tableNoDropdownRef = useRef(null);
  const [cutPanelData, setCutPanelData] = useState(null);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [planLayerQty, setPlanLayerQty] = useState(0);
  const [totalPlanPcs, setTotalPlanPcs] = useState(0);
  const [actualLayers, setActualLayers] = useState(0);
  const [showOrderDetails, setShowOrderDetails] = useState(true);
  const [totalBundleQty, setTotalBundleQty] = useState("");
  const [bundleQtyCheck, setBundleQtyCheck] = useState("");
  const [totalInspectionQty, setTotalInspectionQty] = useState(0);
  const [cuttingByAuto, setCuttingByAuto] = useState(true);
  const [cuttingByManual, setCuttingByManual] = useState(false);
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [showBundleQtyCheckNumberPad, setShowBundleQtyCheckNumberPad] =
    useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showTotalInspectionQtyNumberPad, setShowTotalInspectionQtyNumberPad] =
    useState(false);
  const [isTotalInspectionQtyManual, setIsTotalInspectionQtyManual] =
    useState(false);
  const [selectedPanel, setSelectedPanel] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedSerialLetter, setSelectedSerialLetter] = useState("");
  const [bundleQty, setBundleQty] = useState("");
  const [bundleTableData, setBundleTableData] = useState([]);
  const [tolerance, setTolerance] = useState({ min: -0.125, max: 0.125 });
  const [activeMeasurementTab, setActiveMeasurementTab] = useState("Top");
  const [colCounts, setColCounts] = useState([]);
  const [panels, setPanels] = useState([]);
  const [panelIndexNames, setPanelIndexNames] = useState([]);
  const [summary, setSummary] = useState({
    Top: {
      totalParts: 0,
      totalPass: 0,
      totalReject: 0,
      rejectMeasurement: 0,
      rejectDefects: 0,
      passRate: 0,
      bundles: []
    },
    Middle: {
      totalParts: 0,
      totalPass: 0,
      totalReject: 0,
      rejectMeasurement: 0,
      rejectDefects: 0,
      passRate: 0,
      bundles: []
    },
    Bottom: {
      totalParts: 0,
      totalPass: 0,
      totalReject: 0,
      rejectMeasurement: 0,
      rejectDefects: 0,
      passRate: 0,
      bundles: []
    }
  });
  const [tableData, setTableData] = useState([]);
  const [columnDefects, setColumnDefects] = useState([]);
  const [filters, setFilters] = useState({
    panelName: "",
    side: "",
    direction: "",
    lw: ""
  });
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [fabricDefects, setFabricDefects] = useState([]);
  const [cuttingIssuesData, setCuttingIssuesData] = useState({
    issues: [],
    additionalComments: "",
    additionalImages: []
  });

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isTabletDevice =
      /ipad|android|tablet|kindle|playbook|silk/.test(userAgent) ||
      (userAgent.includes("mobile") && !userAgent.includes("phone"));
    setIsTablet(isTabletDevice);
  }, []);

  useEffect(() => {
    const fetchMoNumbers = async () => {
      if (moNoSearch.trim() === "") {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutpanel-orders-mo-numbers`,
          {
            params: { search: moNoSearch },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setMoNoOptions(response.data);
        setShowMoNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Error fetching MO numbers:", error);
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchMONumbers")
        });
      }
    };
    fetchMoNumbers();
  }, [moNoSearch, t]);

  useEffect(() => {
    const fetchTableNoOptions = async () => {
      if (!moNo) {
        setTableNoOptions([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutpanel-orders-table-nos`,
          {
            params: { styleNo: moNo },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setTableNoOptions(response.data);
      } catch (error) {
        console.error("Error fetching Table Nos:", error);
        setTableNoOptions([]);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchTableNos")
        });
      }
    };
    fetchTableNoOptions();
  }, [moNo, t]);

  useEffect(() => {
    const fetchCutPanelData = async () => {
      if (!moNo || !tableNo) {
        setCutPanelData(null);
        setAvailableSizes([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutpanel-orders-details`,
          {
            params: { styleNo: moNo, tableNo },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setCutPanelData(response.data);
        const sizes = response.data.MarkerRatio.filter(
          (mr) =>
            mr.cuttingRatio !== null &&
            mr.cuttingRatio !== "" &&
            mr.cuttingRatio > 0
        ).map((mr) => mr.size);
        setAvailableSizes([...new Set(sizes)]);
        setPlanLayerQty(response.data.PlanLayer || 0);
        setTotalPlanPcs(response.data.TotalPcs || 0);
        setActualLayers(response.data.ActualLayer || 0);
      } catch (error) {
        console.error("Error fetching Cut Panel data:", error);
        setCutPanelData(null);
        setAvailableSizes([]);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchCutPanelData")
        });
      }
    };
    fetchCutPanelData();
  }, [moNo, tableNo, t]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
      if (
        tableNoDropdownRef.current &&
        !tableNoDropdownRef.current.contains(event.target)
      ) {
        setShowTableNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (totalBundleQty && (actualLayers || planLayerQty)) {
      const layersToUse = actualLayers || planLayerQty;
      const multiplication = parseInt(totalBundleQty) * layersToUse;
      let calculatedBundleQtyCheck;
      if (multiplication >= 1 && multiplication <= 500)
        calculatedBundleQtyCheck = 3;
      else if (multiplication >= 501 && multiplication <= 1200)
        calculatedBundleQtyCheck = 5;
      else if (multiplication >= 1201 && multiplication <= 3000)
        calculatedBundleQtyCheck = 9;
      else if (multiplication >= 3201 && multiplication <= 10000)
        calculatedBundleQtyCheck = 14;
      else if (multiplication >= 10001 && multiplication <= 35000)
        calculatedBundleQtyCheck = 20;
      else calculatedBundleQtyCheck = "";
      setBundleQtyCheck(calculatedBundleQtyCheck.toString());
      if (!isTotalInspectionQtyManual)
        setTotalInspectionQty(calculatedBundleQtyCheck * 15);
    } else {
      setBundleQtyCheck("");
      if (!isTotalInspectionQtyManual) setTotalInspectionQty(0);
    }
  }, [totalBundleQty, actualLayers, planLayerQty, isTotalInspectionQtyManual]);

  useEffect(() => {
    if (bundleQtyCheck && !isTotalInspectionQtyManual) {
      setTotalInspectionQty(parseInt(bundleQtyCheck) * 15);
    } else if (!bundleQtyCheck && !isTotalInspectionQtyManual) {
      setTotalInspectionQty(0);
    }
  }, [bundleQtyCheck, isTotalInspectionQtyManual]);

  useEffect(() => {
    const newBundleQty = parseInt(bundleQty) || 0;
    const newTableData = Array.from({ length: newBundleQty }, () => ({
      Top: [],
      Middle: [],
      Bottom: []
    }));
    const newColCounts = Array.from({ length: newBundleQty }, () => ({
      Top: 5,
      Middle: 5,
      Bottom: 5
    }));
    const newColumnDefects = Array.from({ length: newBundleQty }, () => ({
      Top: Array(5)
        .fill([])
        .map(() => Array(5).fill([])),
      Middle: Array(5)
        .fill([])
        .map(() => Array(5).fill([])),
      Bottom: Array(5)
        .fill([])
        .map(() => Array(5).fill([]))
    }));
    setTableData(newTableData);
    setColCounts(newColCounts);
    setColumnDefects(newColumnDefects);
    setSummary({
      Top: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: Array(newBundleQty).fill(null)
      },
      Middle: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: Array(newBundleQty).fill(null)
      },
      Bottom: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: Array(newBundleQty).fill(null)
      }
    });
    setFilters({ panelName: "", side: "", direction: "", lw: "" });
  }, [bundleQty, selectedPanel]);

  useEffect(() => {
    const newColCounts = bundleTableData.map((row) => ({
      Top: parseInt(row.tValue) || 5,
      Middle: parseInt(row.mValue) || 5,
      Bottom: parseInt(row.bValue) || 5
    }));

    // Only update colCounts if they actually changed
    if (JSON.stringify(colCounts) !== JSON.stringify(newColCounts)) {
      setColCounts(newColCounts);
    }

    // Adapt tableData (measurement values) for column count changes
    setTableData((prevTableData) => {
      return prevTableData.map((bundleData, bundleIdx) => {
        const currentBundleData = bundleData || {
          Top: [],
          Middle: [],
          Bottom: []
        };
        const updatedBundleData = { ...currentBundleData };

        ["Top", "Middle", "Bottom"].forEach((tab) => {
          const currentTabData = currentBundleData[tab] || [];
          const targetColCount = newColCounts[bundleIdx]?.[tab] || 5;

          updatedBundleData[tab] = currentTabData.map((row) => {
            if (row.values.length !== targetColCount) {
              const newValues = Array(targetColCount).fill({
                decimal: 0,
                fraction: "0"
              });
              for (
                let i = 0;
                i < Math.min(row.values.length, targetColCount);
                i++
              ) {
                newValues[i] = row.values[i];
              }
              return { ...row, values: newValues };
            }
            return row;
          });
        });
        return updatedBundleData;
      });
    });

    // Adapt columnDefects for column count changes
    setColumnDefects((prevColumnDefects) => {
      return prevColumnDefects.map((bundleDefects, bundleIdx) => {
        const currentBundleDefects = bundleDefects || {
          Top: [],
          Middle: [],
          Bottom: []
        };
        const updatedBundleDefects = { ...currentBundleDefects };
        const maxPanelIndexForCurrentPanel = Math.max(
          1,
          ...measurementPoints
            .filter((mp) => mp.panel === selectedPanel)
            .map((mp) => mp.panelIndex)
        );

        ["Top", "Middle", "Bottom"].forEach((tab) => {
          const currentTabDefects = currentBundleDefects[tab] || [];
          const targetColCount = newColCounts[bundleIdx]?.[tab] || 5;
          let newTabDefects = JSON.parse(JSON.stringify(currentTabDefects)); // Deep copy

          // Adjust number of columns
          if (newTabDefects.length > targetColCount) {
            newTabDefects = newTabDefects.slice(0, targetColCount);
          } else if (newTabDefects.length < targetColCount) {
            for (let i = newTabDefects.length; i < targetColCount; i++) {
              newTabDefects.push(
                Array(maxPanelIndexForCurrentPanel)
                  .fill(null)
                  .map(() => [])
              );
            }
          }

          // Ensure each column has the correct number of panel index arrays
          newTabDefects = newTabDefects.map((colArray) => {
            let newColArray = Array.isArray(colArray)
              ? [...colArray]
              : Array(maxPanelIndexForCurrentPanel)
                  .fill(null)
                  .map(() => []);
            if (newColArray.length > maxPanelIndexForCurrentPanel) {
              newColArray = newColArray.slice(0, maxPanelIndexForCurrentPanel);
            } else if (newColArray.length < maxPanelIndexForCurrentPanel) {
              for (
                let i = newColArray.length;
                i < maxPanelIndexForCurrentPanel;
                i++
              ) {
                newColArray.push([]);
              }
            }
            return newColArray;
          });
          updatedBundleDefects[tab] = newTabDefects;
        });
        return updatedBundleDefects;
      });
    });
  }, [bundleTableData, selectedPanel, measurementPoints, colCounts]); // Added dependencies

  useEffect(() => {
    const fetchPanels = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-panels`,
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setPanels(response.data);
      } catch (error) {
        console.error("Error fetching panels:", error);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchPanels")
        });
      }
    };
    fetchPanels();
  }, [t]);

  useEffect(() => {
    const fetchPanelIndexNames = async () => {
      if (!moNo || !selectedPanel) {
        setPanelIndexNames([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-panel-index-names-by-mo`,
          {
            params: { moNo, panel: selectedPanel },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        // Log the actual data received from the API
        console.log("Fetched panelIndexNames data:", response.data);
        setPanelIndexNames(response.data);
      } catch (error) {
        console.error("Error fetching panel index names:", error);
        setPanelIndexNames([]);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchPanelIndexNames")
        });
      }
    };
    fetchPanelIndexNames();
  }, [moNo, selectedPanel, i18n.language, t]);

  useEffect(() => {
    const fetchMeasurementPoints = async () => {
      if (!moNo || !selectedPanel) {
        setMeasurementPoints([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-points`,
          {
            params: { moNo, panel: selectedPanel },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        // Fetch Common measurement points
        const commonResponse = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-points`,
          {
            params: { moNo: "Common", panel: selectedPanel },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        // Combine and deduplicate measurement points, prioritizing specific moNo
        const combinedPoints = [...response.data];
        commonResponse.data.forEach((commonPoint) => {
          if (
            !combinedPoints.some(
              (p) =>
                p.panelIndexName === commonPoint.panelIndexName &&
                p.pointNameEng === commonPoint.pointNameEng
            )
          ) {
            combinedPoints.push(commonPoint);
          }
        });
        setMeasurementPoints(combinedPoints);
      } catch (error) {
        console.error("Error fetching measurement points:", error);
        setMeasurementPoints([]);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchMeasurementPoints")
        });
      }
    };
    fetchMeasurementPoints();
  }, [moNo, selectedPanel, t]);

  // Add this useEffect after other useEffects (e.g., after fetchMeasurementPoints)
  useEffect(() => {
    const fetchFabricDefects = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-fabric-defects`,
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setFabricDefects(response.data);
      } catch (error) {
        console.error("Error fetching fabric defects:", error);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchDefects")
        });
      }
    };
    fetchFabricDefects();
  }, [t]); // Dependency on t for translation updates

  const resetForm = () => {
    setMoNo("");
    setMoNoSearch("");
    setMoNoOptions([]);
    setShowMoNoDropdown(false);
    setTableNo("");
    setTableNoSearch("");
    setTableNoOptions([]);
    setShowTableNoDropdown(false);
    setCutPanelData(null);
    setAvailableSizes([]);
    setPlanLayerQty(0);
    setTotalPlanPcs(0);
    setActualLayers(0);
    setTotalBundleQty("");
    setBundleQtyCheck("");
    setTotalInspectionQty(0);
    setCuttingByAuto(true);
    setCuttingByManual(false);
    setSelectedPanel("");
    setSelectedSize("");
    setSelectedSerialLetter("");
    setShowOrderDetails(true);
    setTolerance({ min: -0.125, max: 0.125 });
    setActiveMeasurementTab("Top");
    setColCounts([]);
    setSummary({
      Top: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: []
      },
      Middle: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: []
      },
      Bottom: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: []
      }
    });
    setTableData([]);
    setColumnDefects([]);
    setFilters({ panelName: "", side: "", direction: "", lw: "" });
  };

  const resetMeasurementData = () => {
    const newBundleQty = parseInt(bundleQty) || 0;
    setSummary({
      Top: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: Array(newBundleQty).fill(null)
      },
      Middle: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: Array(newBundleQty).fill(null)
      },
      Bottom: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: Array(newBundleQty).fill(null)
      }
    });
    setTableData(
      Array.from({ length: newBundleQty }, () => ({
        Top: [],
        Middle: [],
        Bottom: []
      }))
    );
    setColumnDefects(
      Array.from({ length: newBundleQty }, (_, i) => ({
        Top: Array(colCounts[i]?.Top || 5)
          .fill([])
          .map(() => Array(5).fill([])),
        Middle: Array(colCounts[i]?.Middle || 5)
          .fill([])
          .map(() => Array(5).fill([])),
        Bottom: Array(colCounts[i]?.Bottom || 5)
          .fill([])
          .map(() => Array(5).fill([]))
      }))
    );
    setFilters({ panelName: "", side: "", direction: "", lw: "" });
  };

  const collectMeasurementData = (
    tab,
    bundleIndex,
    tableDataTab,
    defectsTab,
    tolerance,
    numColumns
  ) => {
    const usedPanelIndices = [
      ...new Set(
        tableDataTab.filter((row) => row.isUsed).map((row) => row.panelIndex)
      )
    ];
    return usedPanelIndices.map((panelIndex) => {
      let totalMeasurementDefects = 0;
      let totalDefectPcs = 0;
      for (let colIndex = 0; colIndex < numColumns; colIndex++) {
        const hasMeasurementDefect = tableDataTab
          .filter((row) => row.panelIndex === panelIndex && row.isUsed)
          .some((row) => {
            const value = row.values[colIndex].decimal;
            return (
              value !== null && (value < tolerance.min || value > tolerance.max)
            );
          });
        if (hasMeasurementDefect) totalMeasurementDefects++;
        const hasDefects = defectsTab[colIndex][panelIndex - 1].length > 0;
        if (hasDefects) totalDefectPcs++;
      }
      return {
        bundleNo: bundleIndex + 1,
        panelIndex,
        totalMeasurementDefects,
        totalDefectPcs,
        measurementPointData: tableDataTab
          .filter((row) => row.panelIndex === panelIndex && row.isUsed)
          .map((row) => ({
            no: row.no,
            measurementPointName: row.measurementPoint,
            panelName: row.panelName,
            side: row.panelSide,
            direction: row.panelDirection,
            property: row.measurementSide,
            measurementValues: row.values.map((value, colIndex) => ({
              partName: `${tab[0]}${colIndex + 1}`,
              measurement: value.decimal,
              status:
                value.decimal !== null &&
                (value.decimal < tolerance.min || value.decimal > tolerance.max)
                  ? "Fail"
                  : "Pass"
            }))
          })),
        defectData: Array.from({ length: numColumns }, (_, colIndex) => ({
          column: `${tab[0]}${colIndex + 1}`,
          defects: defectsTab[colIndex][panelIndex - 1].map((d) => ({
            defectName: d.defectName,
            defectQty: d.count
          }))
        }))
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !moNo ||
      !tableNo ||
      !totalBundleQty ||
      !bundleQtyCheck ||
      !selectedPanel ||
      !selectedSize ||
      !selectedSerialLetter
    ) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.missingInformation"),
        text: t("cutting.fillRequiredFields")
      });
      return;
    }

    let cuttingtype = "";
    if (cuttingByAuto && cuttingByManual) cuttingtype = "Auto & Manual";
    else if (cuttingByAuto) cuttingtype = "Auto";
    else if (cuttingByManual) cuttingtype = "Manual";
    else cuttingtype = "None";

    const inspectionData = {
      size: selectedSize,
      serialLetter: selectedSerialLetter,
      tolerance,
      totalPcs: totalParts,
      totalPass: totalPass,
      totalReject: totalReject,
      totalRejectMeasurement:
        summary.Top.rejectMeasurement +
        summary.Middle.rejectMeasurement +
        summary.Bottom.rejectMeasurement,
      totalRejectDefects:
        summary.Top.rejectDefects +
        summary.Middle.rejectDefects +
        summary.Bottom.rejectDefects,
      passRate:
        totalParts > 0
          ? parseFloat(((totalPass / totalParts) * 100).toFixed(2))
          : 0,
      pcsLocation: [
        {
          location: "Top",
          pcs: summary.Top.totalParts,
          pass: summary.Top.totalPass,
          reject: summary.Top.totalReject,
          rejectGarment: summary.Top.totalReject,
          rejectMeasurement: summary.Top.rejectMeasurement,
          passrate: summary.Top.passRate,
          measurementData: bundleTableData.flatMap((bundle, bundleIndex) =>
            collectMeasurementData(
              "Top",
              bundleIndex,
              tableData[bundleIndex]?.Top || [],
              columnDefects[bundleIndex]?.Top || [],
              tolerance,
              colCounts[bundleIndex]?.Top || 5
            )
          )
        },
        {
          location: "Middle",
          pcs: summary.Middle.totalParts,
          pass: summary.Middle.totalPass,
          reject: summary.Middle.totalReject,
          rejectGarment: summary.Middle.totalReject,
          rejectMeasurement: summary.Middle.rejectMeasurement,
          passrate: summary.Middle.passRate,
          measurementData: bundleTableData.flatMap((bundle, bundleIndex) =>
            collectMeasurementData(
              "Middle",
              bundleIndex,
              tableData[bundleIndex]?.Middle || [],
              columnDefects[bundleIndex]?.Middle || [],
              tolerance,
              colCounts[bundleIndex]?.Middle || 5
            )
          )
        },
        {
          location: "Bottom",
          pcs: summary.Bottom.totalParts,
          pass: summary.Bottom.totalPass,
          reject: summary.Bottom.totalReject,
          rejectGarment: summary.Bottom.totalReject,
          rejectMeasurement: summary.Bottom.rejectMeasurement,
          passrate: summary.Bottom.passRate,
          measurementData: bundleTableData.flatMap((bundle, bundleIndex) =>
            collectMeasurementData(
              "Bottom",
              bundleIndex,
              tableData[bundleIndex]?.Bottom || [],
              columnDefects[bundleIndex]?.Bottom || [],
              tolerance,
              colCounts[bundleIndex]?.Bottom || 5
            )
          )
        }
      ],
      cuttingIssues: cuttingIssuesData, // Add cutting issues to inspection data
      inspectionTime: new Date().toLocaleTimeString("en-US", { hour12: false })
    };

    const report = {
      inspectionDate: inspectionDate.toLocaleDateString("en-US"),
      cutting_emp_id: user.emp_id,
      cutting_emp_engName: user.eng_name,
      cutting_emp_khName: user.kh_name,
      cutting_emp_dept: user.dept_name,
      cutting_emp_section: user.sect_name,
      moNo,
      lotNo: cutPanelData?.LotNos.join(",") || "",
      buyer: cutPanelData?.Buyer || "N/A",
      orderQty: cutPanelData?.TotalOrderQty || 0,
      color: cutPanelData?.Color || "",
      tableNo,
      planLayerQty,
      actualLayerQty: actualLayers,
      totalPcs: totalPlanPcs,
      cuttingtableLetter: cutPanelData?.SpreadTable || "",
      cuttingtableNo: cutPanelData?.SpreadTableNo || "",
      marker: cutPanelData?.MackerNo || "N/A",
      markerRatio:
        cutPanelData?.MarkerRatio.filter((mr) => mr.cuttingRatio !== null).map(
          (data, index) => ({
            index: index + 1,
            markerSize: data.size,
            ratio: data.cuttingRatio
          })
        ) || [],
      totalBundleQty: parseInt(totalBundleQty),
      bundleQtyCheck: parseInt(bundleQtyCheck),
      totalInspectionQty,
      cuttingtype,
      garmentType: selectedPanel,
      inspectionData
    };

    try {
      await axios.post(`${API_BASE_URL}/api/save-cutting-inspection`, report);
      Swal.fire({
        icon: "success",
        title: t("cutting.success"),
        text: t("cutting.dataSaved")
      });
      resetMeasurementData();
      // Reset cutting issues data after submission
      setCuttingIssuesData({
        issues: [],
        additionalComments: "",
        additionalImages: []
      });
    } catch (error) {
      console.error("Error saving Cutting data:", error);
      Swal.fire({
        icon: "error",
        title: t("cutting.error"),
        text: t("cutting.failedToSaveData")
      });
    }
  };

  const filteredMeasurementPoints = measurementPoints.filter(
    (point) => point.panel === selectedPanel
  );
  const serialLetters = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  );
  const toleranceOptions = [
    { label: "-1/16, 1/16", value: { min: -0.0625, max: 0.0625 } },
    { label: "-1/8, 1/8", value: { min: -0.125, max: 0.125 } }
  ];

  const handleToleranceChange = (e) => {
    const selectedOption = toleranceOptions.find(
      (option) => option.label === e.target.value
    );
    if (selectedOption) setTolerance(selectedOption.value);
  };

  const calculateTotalPcs = (row) => {
    const numParts = row.parts.length;
    const tValue = parseInt(row.tValue) || 5; // Default to 5 if not set
    const mValue = parseInt(row.mValue) || 5;
    const bValue = parseInt(row.bValue) || 5;
    return numParts > 0 ? numParts * (tValue + mValue + bValue) : 0;
  };

  const handleColChange = (bundleIndex, tab, value) => {
    const bundle = bundleTableData[bundleIndex];
    if (bundle.parts.length > 0) return; // Prevent state update if parts selected
    const newCount = parseInt(value);
    setColCounts((prev) => {
      const newColCounts = [...prev];
      newColCounts[bundleIndex] = {
        ...newColCounts[bundleIndex],
        [tab]: newCount
      };
      return newColCounts;
    });
    setColumnDefects((prev) => {
      const newDefects = [...prev];
      newDefects[bundleIndex][tab] = Array(newCount)
        .fill([])
        .map(() => Array(5).fill([]));
      return newDefects;
    });
  };

  const updateSummary = React.useCallback(
    (tab, data, bundleIndex) => {
      setSummary((prev) => {
        const newSummary = { ...prev };
        // Ensure bundles array exists and has correct length
        const expectedBundleLength = parseInt(bundleQty) || 0;
        if (
          !newSummary[tab].bundles ||
          newSummary[tab].bundles.length !== expectedBundleLength
        ) {
          newSummary[tab].bundles = Array(expectedBundleLength).fill(null);
        }

        newSummary[tab].bundles[bundleIndex] = data;

        const totalParts = newSummary[tab].bundles.reduce(
          (acc, curr) => acc + (curr?.totalParts || 0),
          0
        );
        const totalPass = newSummary[tab].bundles.reduce(
          (acc, curr) => acc + (curr?.totalPass || 0),
          0
        );
        const totalReject = newSummary[tab].bundles.reduce(
          (acc, curr) => acc + (curr?.totalReject || 0),
          0
        );
        const rejectMeasurement = newSummary[tab].bundles.reduce(
          (acc, curr) => acc + (curr?.rejectMeasurement || 0),
          0
        );
        const rejectDefects = newSummary[tab].bundles.reduce(
          (acc, curr) => acc + (curr?.rejectDefects || 0),
          0
        );
        const passRate =
          totalParts > 0 ? ((totalPass / totalParts) * 100).toFixed(2) : 0;
        newSummary[tab] = {
          totalParts,
          totalPass,
          totalReject,
          rejectMeasurement,
          rejectDefects,
          passRate,
          bundles: newSummary[tab].bundles
        };
        return newSummary;
      });
    },
    [bundleQty]
  ); // bundleQty is needed if it determines the structure of summary.bundles

  const updateTableData = React.useCallback((bundleIndex, tab, data) => {
    setTableData((prev) => {
      const newData = [...prev];
      // Ensure the bundle entry exists
      if (!newData[bundleIndex]) {
        newData[bundleIndex] = { Top: [], Middle: [], Bottom: [] };
      }
      newData[bundleIndex] = { ...newData[bundleIndex], [tab]: data };
      return newData;
    });
  }, []); // setTableData is stable

  const updateDefects = React.useCallback(
    (bundleIndex, tab, newDefects) => {
      setColumnDefects((prev) => {
        const newDefectsData = [...prev];
        // Ensure the bundle entry exists
        if (!newDefectsData[bundleIndex]) {
          // Initialize with a structure that matches colCounts and panel indices
          const currentBundleColCounts = colCounts[bundleIndex] || {
            Top: 5,
            Middle: 5,
            Bottom: 5
          };
          const maxPanelIdx = Math.max(
            1,
            ...measurementPoints
              .filter((mp) => mp.panel === selectedPanel)
              .map((mp) => mp.panelIndex)
          );
          newDefectsData[bundleIndex] = {
            Top: Array(currentBundleColCounts.Top)
              .fill(null)
              .map(() => Array(maxPanelIdx).fill([])),
            Middle: Array(currentBundleColCounts.Middle)
              .fill(null)
              .map(() => Array(maxPanelIdx).fill([])),
            Bottom: Array(currentBundleColCounts.Bottom)
              .fill(null)
              .map(() => Array(maxPanelIdx).fill([]))
          };
        }
        newDefectsData[bundleIndex] = {
          ...newDefectsData[bundleIndex],
          [tab]: newDefects
        };
        return newDefectsData;
      });
    },
    [colCounts, measurementPoints, selectedPanel]
  ); // Dependencies for initializing defect structure

  const totalParts =
    summary.Top.totalParts +
    summary.Middle.totalParts +
    summary.Bottom.totalParts;
  const totalPass =
    summary.Top.totalPass + summary.Middle.totalPass + summary.Bottom.totalPass;
  const totalReject =
    summary.Top.totalReject +
    summary.Middle.totalReject +
    summary.Bottom.totalReject;

  const uniqueOptions = (key) => [
    ...new Set(measurementPoints.map((point) => point[key]).filter(Boolean))
  ];

  if (authLoading) return <div>{t("cutting.loading")}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          {t("cutting.cutting_inspection")}
        </h1>
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setActiveTab("form")}
            className={`px-4 py-2 ${
              activeTab === "form"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-l-lg`}
          >
            {t("cutting.cuttingForm")}
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`px-4 py-2 ${
              activeTab === "data"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {t("cutting.data")}
          </button>
          <button
            onClick={() => setActiveTab("Modify")}
            className={`px-4 py-2 ${
              activeTab === "Modify"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {t("cutting.modify")}
          </button>
          <button
            onClick={() => setActiveTab("Adding")}
            className={`px-4 py-2 ${
              activeTab === "Adding"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {t("cutting.adding")}
          </button>
          <button
            onClick={() => setActiveTab("db")}
            className={`px-4 py-2 flex items-center space-x-2 ${
              activeTab === "db"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-r-lg`}
          >
            <Database className="w-5 h-5" />
            <span>DB</span>
          </button>
        </div>

        {activeTab === "form" ? (
          <>
            <div className="mb-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.date")}
                  </label>
                  <DatePicker
                    selected={inspectionDate}
                    onChange={(date) => setInspectionDate(date)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.moNo")}
                  </label>
                  <div className="relative" ref={moNoDropdownRef}>
                    <input
                      type="text"
                      value={moNoSearch}
                      onChange={(e) => setMoNoSearch(e.target.value)}
                      onFocus={() =>
                        moNoOptions.length > 0 && setShowMoNoDropdown(true)
                      }
                      placeholder={t("cutting.search_mono")}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    />
                    {showMoNoDropdown && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {moNoOptions.map((option, index) => (
                          <li
                            key={index}
                            onClick={() => {
                              setMoNo(option);
                              setMoNoSearch(option);
                              setShowMoNoDropdown(false);
                            }}
                            className="p-2 hover:bg-blue-100 cursor-pointer"
                          >
                            {option}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.tableNo")}
                  </label>
                  <div className="flex items-center gap-2">
                    {cutPanelData && (
                      <button
                        onClick={() => setShowOrderDetails(!showOrderDetails)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        {showOrderDetails ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    <div className="relative flex-1" ref={tableNoDropdownRef}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={tableNoSearch}
                        onChange={(e) => {
                          setTableNoSearch(e.target.value);
                          setShowTableNoDropdown(true);
                        }}
                        onFocus={() =>
                          tableNoOptions.length > 0 &&
                          setShowTableNoDropdown(true)
                        }
                        placeholder={t("cutting.search_table_no")}
                        className={`mt-1 w-full p-2 border border-gray-300 rounded-lg ${
                          !moNo ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                        disabled={!moNo}
                      />
                      {showTableNoDropdown && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                          {tableNoOptions
                            .filter((table) =>
                              table
                                .toLowerCase()
                                .includes(tableNoSearch.toLowerCase())
                            )
                            .map((table, index) => (
                              <li
                                key={index}
                                onClick={() => {
                                  setTableNo(table);
                                  setTableNoSearch(table);
                                  setShowTableNoDropdown(false);
                                }}
                                className="p-2 hover:bg-blue-100 cursor-pointer"
                              >
                                {table}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {cutPanelData && showOrderDetails && (
                <div className="mt-4">
                  <h2 className="text-sm font-semibold text-gray-700">
                    {t("cutting.orderDetails")}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 mt-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.buyer")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.buyerStyle")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.color")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.lotNo")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.orderQty")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2 text-sm">
                            {cutPanelData.Buyer}
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {cutPanelData.BuyerStyle}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.Color}
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {cutPanelData.LotNos.join(", ")}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.TotalOrderQty}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700 mt-4">
                    {t("cutting.fabricDetails")}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 mt-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.fabricType")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.material")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.rollQty")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.spreadYds")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.unit")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.grossKgs")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.netKgs")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.totalTTLRoll")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2 text-sm">
                            {cutPanelData.FabricType}
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {cutPanelData.Material}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.RollQty}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.SpreadYds}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.Unit}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.GrossKgs}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.NetKgs}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.TotalTTLRoll}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700 mt-4">
                    {t("cutting.cuttingTableDetails")}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 mt-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.spreadTable")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.spreadTableNo")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.planLayers")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.actualLayers")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.totalPcs")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.mackerNo")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.mackerLength")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2 text-center  text-sm">
                            {cutPanelData.SpreadTable}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {tableNo ? tableNo.replace(/^T\s*/, "") : ""}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.PlanLayer}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.ActualLayer}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.TotalPcs}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.MackerNo}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.MackerLength}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700 mt-4">
                    {t("cutting.markerRatio")}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 mt-2">
                      <thead>
                        <tr className="bg-gray-100">
                          {cutPanelData.MarkerRatio.filter(
                            (mr) =>
                              mr.cuttingRatio !== null &&
                              mr.cuttingRatio !== "" &&
                              mr.cuttingRatio > 0
                          ).map((mr, index) => (
                            <th
                              key={index}
                              className="border border-gray-300 p-2 text-sm"
                            >
                              {mr.size}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {cutPanelData.MarkerRatio.filter(
                            (mr) =>
                              mr.cuttingRatio !== null &&
                              mr.cuttingRatio !== "" &&
                              mr.cuttingRatio > 0
                          ).map((mr, index) => (
                            <td
                              key={index}
                              className="border border-gray-300 p-2 text-sm text-center"
                            >
                              {mr.cuttingRatio}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {cutPanelData && (
                <div className="mt-6">
                  <hr className="my-4 border-gray-300" />
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.totalBundleQty")}
                      </label>
                      <div className="relative">
                        <input
                          type={isTablet ? "number" : "text"}
                          inputMode="numeric"
                          value={totalBundleQty}
                          onChange={(e) => setTotalBundleQty(e.target.value)}
                          className="mt-1 w-full p-2 border border-gray-300 rounded-lg pr-10"
                          placeholder="Enter Total Bundle Qty"
                        />
                        {!isTablet && (
                          <button
                            onClick={() => setShowNumberPad(true)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                          >
                            <Keyboard className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      {showNumberPad && (
                        <NumberPad
                          onClose={() => setShowNumberPad(false)}
                          onInput={(value) => setTotalBundleQty(value)}
                          initialValue={totalBundleQty}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.bundleQtyCheck")}
                      </label>
                      <div className="relative">
                        <input
                          type={isTablet ? "number" : "text"}
                          inputMode="numeric"
                          value={bundleQtyCheck}
                          onChange={(e) => setBundleQtyCheck(e.target.value)}
                          className="mt-1 w-full p-2 border border-gray-300 rounded-lg pr-10"
                          placeholder="Enter Bundle Qty Check"
                          readOnly={
                            totalBundleQty &&
                            (actualLayers || planLayerQty) &&
                            parseInt(totalBundleQty) *
                              (actualLayers || planLayerQty) >=
                              501 &&
                            parseInt(totalBundleQty) *
                              (actualLayers || planLayerQty) <=
                              35000
                          }
                        />
                        {!isTablet &&
                          (!totalBundleQty ||
                            (!actualLayers && !planLayerQty) ||
                            parseInt(totalBundleQty) *
                              (actualLayers || planLayerQty) <
                              501 ||
                            parseInt(totalBundleQty) *
                              (actualLayers || planLayerQty) >
                              35000) && (
                            <button
                              onClick={() =>
                                setShowBundleQtyCheckNumberPad(true)
                              }
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                            >
                              <Keyboard className="w-5 h-5" />
                            </button>
                          )}
                      </div>
                      {showBundleQtyCheckNumberPad && (
                        <NumberPad
                          onClose={() => setShowBundleQtyCheckNumberPad(false)}
                          onInput={(value) => setBundleQtyCheck(value)}
                          initialValue={bundleQtyCheck}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.totalInspectionQty")}
                      </label>
                      <div className="relative">
                        <input
                          type={isTablet ? "number" : "text"}
                          inputMode="numeric"
                          value={totalInspectionQty}
                          onChange={(e) => {
                            setTotalInspectionQty(e.target.value);
                            setIsTotalInspectionQtyManual(true);
                          }}
                          className="mt-1 w-full p-2 border border-gray-300 rounded-lg pr-10"
                          placeholder="Enter Total Inspection Qty"
                        />
                        {!isTablet && (
                          <button
                            onClick={() =>
                              setShowTotalInspectionQtyNumberPad(true)
                            }
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                          >
                            <Keyboard className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      {showTotalInspectionQtyNumberPad && (
                        <NumberPad
                          onClose={() =>
                            setShowTotalInspectionQtyNumberPad(false)
                          }
                          onInput={(value) => {
                            setTotalInspectionQty(value);
                            setIsTotalInspectionQtyManual(true);
                          }}
                          initialValue={totalInspectionQty}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.cuttingBy")}
                      </label>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={cuttingByAuto}
                            onChange={(e) => setCuttingByAuto(e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <label className="ml-2 text-sm text-gray-700">
                            {t("cutting.auto")}
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={cuttingByManual}
                            onChange={(e) =>
                              setCuttingByManual(e.target.checked)
                            }
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <label className="ml-2 text-sm text-gray-700">
                            {t("cutting.manual")}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {t("cutting.samplingStandard")}
                  </div>
                  <hr className="my-4 border-gray-300" />
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.panel")}
                      </label>
                      <select
                        value={selectedPanel}
                        onChange={(e) => {
                          setSelectedPanel(e.target.value);
                          setBundleQty("");
                          setBundleTableData([]);
                        }}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">{t("cutting.select_panel")}</option>
                        {panels.map((panelObj, index) => (
                          <option key={index} value={panelObj.panel}>
                            {i18n.language === "km"
                              ? panelObj.panelKhmer || panelObj.panel
                              : i18n.language === "zh"
                              ? panelObj.panelChinese || panelObj.panel
                              : panelObj.panel}
                            :--({panelObj.panelKhmer})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.size")}
                      </label>
                      <select
                        value={selectedSize}
                        onChange={(e) => {
                          setSelectedSize(e.target.value);
                          setBundleQty("");
                          setBundleTableData([]);
                        }}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                        disabled={!tableNo || availableSizes.length === 0}
                      >
                        <option value="">{t("cutting.select_size")}</option>
                        {availableSizes.map((size, index) => (
                          <option key={index} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.bundleQty")}
                      </label>
                      <select
                        value={bundleQty}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value) || 0;
                          setBundleQty(e.target.value);
                          const newBundleTableData = Array.from(
                            { length: qty },
                            (_, i) => ({
                              bundleNo: i + 1,
                              serialLetter: "",
                              parts: [],
                              tValue: 5,
                              mValue: 5,
                              bValue: 5
                            })
                          );
                          setBundleTableData(newBundleTableData);
                          setColCounts(
                            Array.from({ length: qty }, () => ({
                              Top: 5,
                              Middle: 5,
                              Bottom: 5
                            }))
                          );
                          setTableData(
                            Array.from({ length: qty }, () => ({
                              Top: [],
                              Middle: [],
                              Bottom: []
                            }))
                          );
                          setColumnDefects(
                            Array.from({ length: qty }, () => ({
                              Top: Array(5)
                                .fill([])
                                .map(() => Array(5).fill([])),
                              Middle: Array(5)
                                .fill([])
                                .map(() => Array(5).fill([])),
                              Bottom: Array(5)
                                .fill([])
                                .map(() => Array(5).fill([]))
                            }))
                          );
                          setSummary({
                            Top: {
                              totalParts: 0,
                              totalPass: 0,
                              totalReject: 0,
                              rejectMeasurement: 0,
                              rejectDefects: 0,
                              passRate: 0,
                              bundles: Array(qty).fill(null)
                            },
                            Middle: {
                              totalParts: 0,
                              totalPass: 0,
                              totalReject: 0,
                              rejectMeasurement: 0,
                              rejectDefects: 0,
                              passRate: 0,
                              bundles: Array(qty).fill(null)
                            },
                            Bottom: {
                              totalParts: 0,
                              totalPass: 0,
                              totalReject: 0,
                              rejectMeasurement: 0,
                              rejectDefects: 0,
                              passRate: 0,
                              bundles: Array(qty).fill(null)
                            }
                          });
                        }}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                        disabled={!selectedSize}
                      >
                        <option value="">
                          {t("cutting.select_bundle_qty")}
                        </option>
                        {[...Array(20)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.tolerance")}
                      </label>
                      <select
                        value={
                          toleranceOptions.find(
                            (opt) =>
                              opt.value.min === tolerance.min &&
                              opt.value.max === tolerance.max
                          )?.label
                        }
                        onChange={handleToleranceChange}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                      >
                        {toleranceOptions.map((option, index) => (
                          <option key={index} value={option.label}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {bundleQty && (
                    <div className="mt-4">
                      <h2 className="text-sm font-semibold text-gray-700">
                        {t("cutting.bundleDetails")}
                      </h2>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 mt-2">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 p-2 text-sm w-16">
                                {t("cutting.bundleNo")}
                              </th>
                              <th className="border border-gray-300 p-2 text-sm w-24">
                                {t("cutting.serialLetter")}
                              </th>
                              <th className="border border-gray-300 p-2 text-sm w-auto">
                                {t("cutting.parts")}
                              </th>
                              <th className="border border-gray-300 p-2 text-sm w-40">
                                {t("cutting.pcs")}
                              </th>
                              <th className="border border-gray-300 p-2 text-sm w-20">
                                {t("cutting.totalPcs")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {bundleTableData.map((row, index) => (
                              <tr key={index}>
                                <td className="border border-gray-300 p-2 text-sm text-center w-16">
                                  {row.bundleNo}
                                </td>
                                <td className="border border-gray-300 p-2 text-sm w-24">
                                  <select
                                    value={row.serialLetter}
                                    onChange={(e) => {
                                      const newData = [...bundleTableData];
                                      newData[index].serialLetter =
                                        e.target.value;
                                      setBundleTableData(newData);
                                    }}
                                    className="w-full p-1 border border-gray-300 rounded-lg text-sm"
                                  >
                                    <option value="">
                                      {t("cutting.select_serial_letter")}
                                    </option>
                                    {serialLetters.map((letter, i) => (
                                      <option key={i} value={letter}>
                                        {letter}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                <td className="border border-gray-300 p-2 text-sm w-auto">
                                  <div className="flex flex-wrap gap-2">
                                    {panelIndexNames.map((item, i) => (
                                      <label
                                        key={i}
                                        className="flex items-center space-x-1 text-sm"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={row.parts.includes(
                                            item.panelIndexName
                                          )}
                                          onChange={(e) => {
                                            const newBundleTableDataState = [
                                              ...bundleTableData
                                            ];
                                            const currentBundleObject =
                                              newBundleTableDataState[index];
                                            const partName =
                                              item.panelIndexName;

                                            let updatedPartsArray;
                                            if (e.target.checked) {
                                              updatedPartsArray = [
                                                ...currentBundleObject.parts,
                                                partName
                                              ];
                                            } else {
                                              updatedPartsArray =
                                                currentBundleObject.parts.filter(
                                                  (part) => part !== partName
                                                );
                                            }
                                            newBundleTableDataState[
                                              index
                                            ].parts = updatedPartsArray;
                                            setBundleTableData(
                                              newBundleTableDataState
                                            );
                                          }}
                                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <span>
                                          {i18n.language === "km"
                                            ? item.panelIndexNameKhmer ||
                                              item.panelIndexName
                                            : item.panelIndexName}
                                          ({item.panelIndexNameKhmer})
                                          {/* <br /> ({item.panelIndexNameKhmer}) */}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                  <div className="mt-2 text-sm">
                                    {row.parts
                                      .map((part) => {
                                        const item = panelIndexNames.find(
                                          (p) => p.panelIndexName === part
                                        );
                                        return item
                                          ? i18n.language === "km"
                                            ? item.panelIndexNameKhmer ||
                                              item.panelIndexName
                                            : item.panelIndexName
                                          : part;
                                      })
                                      .join(", ")}
                                  </div>
                                </td>

                                <td className="border border-gray-300 p-2 text-sm w-40">
                                  <div className="flex items-center gap-2">
                                    <span>T:</span>
                                    <select
                                      value={row.tValue || 5}
                                      onChange={(e) => {
                                        //if (row.parts.length > 0) return; // Prevent state update if parts selected
                                        const newData = [...bundleTableData];
                                        newData[index].tValue = e.target.value;
                                        setBundleTableData(newData);
                                      }}
                                      className="p-1 border border-gray-300 rounded-lg text-sm"
                                      //disabled={row.parts.length > 0}
                                    >
                                      {[...Array(5)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                          {i + 1}
                                        </option>
                                      ))}
                                    </select>
                                    <span>M:</span>
                                    <select
                                      value={row.mValue || 5}
                                      onChange={(e) => {
                                        //if (row.parts.length > 0) return; // Prevent state update if parts selected
                                        const newData = [...bundleTableData];
                                        newData[index].mValue = e.target.value;
                                        setBundleTableData(newData);
                                      }}
                                      className="p-1 border border-gray-300 rounded-lg text-sm"
                                      //disabled={row.parts.length > 0}
                                    >
                                      {[...Array(5)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                          {i + 1}
                                        </option>
                                      ))}
                                    </select>
                                    <span>B:</span>
                                    <select
                                      value={row.bValue || 5}
                                      onChange={(e) => {
                                        //if (row.parts.length > 0) return; // Prevent state update if parts selected
                                        const newData = [...bundleTableData];
                                        newData[index].bValue = e.target.value;
                                        setBundleTableData(newData);
                                      }}
                                      className="p-1 border border-gray-300 rounded-lg text-sm"
                                      //disabled={row.parts.length > 0}
                                    >
                                      {[...Array(5)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                          {i + 1}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </td>
                                <td className="border border-gray-300 p-2 text-sm text-center w-20">
                                  {calculateTotalPcs(row)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {selectedPanel && filteredMeasurementPoints.length > 0 && (
                    <>
                      <hr className="my-4 border-gray-300" />
                      <h3 className="text-sm font-medium text-gray-600 mb-2">
                        {t("cutting.summaryDetails")}
                      </h3>
                      <div className="mb-4">
                        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-6 gap-4">
                          <div className="p-4 bg-blue-100 rounded-lg text-center">
                            <p className="text-xs font-medium text-gray-700">
                              {t("cutting.parts")}
                            </p>
                            <p className="text-lg font-bold">
                              {bundleTableData.reduce(
                                (acc, row) => acc + calculateTotalPcs(row),
                                0
                              )}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              T:{" "}
                              {bundleTableData.reduce(
                                (acc, row) =>
                                  acc +
                                  row.parts.length *
                                    (parseInt(row.tValue) || 5),
                                0
                              )}
                              , M:{" "}
                              {bundleTableData.reduce(
                                (acc, row) =>
                                  acc +
                                  row.parts.length *
                                    (parseInt(row.mValue) || 5),
                                0
                              )}
                              , B:{" "}
                              {bundleTableData.reduce(
                                (acc, row) =>
                                  acc +
                                  row.parts.length *
                                    (parseInt(row.bValue) || 5),
                                0
                              )}
                            </p>
                          </div>
                          <div className="p-4 bg-green-100 rounded-lg text-center">
                            <p className="text-xs font-medium text-gray-700">
                              {t("cutting.pass")}
                            </p>
                            <p className="text-lg font-bold">
                              {bundleTableData.reduce((acc, row) => {
                                const bundleIndex = row.bundleNo - 1;
                                const totalPcs = calculateTotalPcs(row);
                                const totalReject = [
                                  "Top",
                                  "Middle",
                                  "Bottom"
                                ].reduce(
                                  (rejectAcc, tab) =>
                                    rejectAcc +
                                    (summary[tab].bundles?.[bundleIndex]
                                      ?.totalReject || 0),
                                  0
                                );
                                return acc + (totalPcs - totalReject);
                              }, 0)}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              T:{" "}
                              {bundleTableData.reduce((acc, row) => {
                                const bundleIndex = row.bundleNo - 1;
                                const totalPcs =
                                  row.parts.length *
                                  (parseInt(row.tValue) || 5);
                                const reject =
                                  summary.Top.bundles?.[bundleIndex]
                                    ?.totalReject || 0;
                                return acc + (totalPcs - reject);
                              }, 0)}
                              , M:{" "}
                              {bundleTableData.reduce((acc, row) => {
                                const bundleIndex = row.bundleNo - 1;
                                const totalPcs =
                                  row.parts.length *
                                  (parseInt(row.mValue) || 5);
                                const reject =
                                  summary.Middle.bundles?.[bundleIndex]
                                    ?.totalReject || 0;
                                return acc + (totalPcs - reject);
                              }, 0)}
                              , B:{" "}
                              {bundleTableData.reduce((acc, row) => {
                                const bundleIndex = row.bundleNo - 1;
                                const totalPcs =
                                  row.parts.length *
                                  (parseInt(row.bValue) || 5);
                                const reject =
                                  summary.Bottom.bundles?.[bundleIndex]
                                    ?.totalReject || 0;
                                return acc + (totalPcs - reject);
                              }, 0)}
                            </p>
                          </div>
                          <div className="p-4 bg-red-100 rounded-lg text-center">
                            <p className="text-xs font-medium text-gray-700">
                              {t("cutting.reject")}
                            </p>
                            <p className="text-lg font-bold">{totalReject}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              T: {summary.Top.totalReject}, M:{" "}
                              {summary.Middle.totalReject}, B:{" "}
                              {summary.Bottom.totalReject}
                            </p>
                          </div>
                          <div className="p-4 bg-orange-100 rounded-lg text-center">
                            <p className="text-xs font-medium text-gray-700">
                              {t("cutting.rejectMeasurements")}
                            </p>
                            <p className="text-lg font-bold">
                              {summary.Top.rejectMeasurement +
                                summary.Middle.rejectMeasurement +
                                summary.Bottom.rejectMeasurement}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              T: {summary.Top.rejectMeasurement}, M:{" "}
                              {summary.Middle.rejectMeasurement}, B:{" "}
                              {summary.Bottom.rejectMeasurement}
                            </p>
                          </div>
                          <div className="p-4 bg-purple-100 rounded-lg text-center">
                            <p className="text-xs font-medium text-gray-700">
                              {t("cutting.rejectDefects")}
                            </p>
                            <p className="text-lg font-bold">
                              {summary.Top.rejectDefects +
                                summary.Middle.rejectDefects +
                                summary.Bottom.rejectDefects}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              T: {summary.Top.rejectDefects}, M:{" "}
                              {summary.Middle.rejectDefects}, B:{" "}
                              {summary.Bottom.rejectDefects}
                            </p>
                          </div>
                          {(() => {
                            const totalParts = bundleTableData.reduce(
                              (acc, row) => acc + calculateTotalPcs(row),
                              0
                            );
                            const totalPass = bundleTableData.reduce(
                              (acc, row) => {
                                const bundleIndex = row.bundleNo - 1;
                                const totalPcs = calculateTotalPcs(row);
                                const totalReject = [
                                  "Top",
                                  "Middle",
                                  "Bottom"
                                ].reduce(
                                  (rejectAcc, tab) =>
                                    rejectAcc +
                                    (summary[tab].bundles?.[bundleIndex]
                                      ?.totalReject || 0),
                                  0
                                );
                                return acc + (totalPcs - totalReject);
                              },
                              0
                            );
                            const passRate =
                              totalParts > 0
                                ? ((totalPass / totalParts) * 100).toFixed(2)
                                : 0;
                            const bgColor =
                              passRate < 90 ? "bg-red-100" : "bg-green-100";

                            return (
                              <div
                                className={`p-4 ${bgColor} rounded-lg text-center`}
                              >
                                <p className="text-xs font-medium text-gray-700">
                                  {t("cutting.passRate")}
                                </p>
                                <p className="text-lg font-bold">{passRate}%</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  T:{" "}
                                  {(() => {
                                    const parts = bundleTableData.reduce(
                                      (acc, row) =>
                                        acc +
                                        row.parts.length *
                                          (parseInt(row.tValue) || 5),
                                      0
                                    );
                                    const pass = bundleTableData.reduce(
                                      (acc, row) => {
                                        const bundleIndex = row.bundleNo - 1;
                                        const totalPcs =
                                          row.parts.length *
                                          (parseInt(row.tValue) || 5);
                                        const reject =
                                          summary.Top.bundles?.[bundleIndex]
                                            ?.totalReject || 0;
                                        return acc + (totalPcs - reject);
                                      },
                                      0
                                    );
                                    return parts > 0
                                      ? ((pass / parts) * 100).toFixed(0)
                                      : 0;
                                  })()}
                                  %, M:{" "}
                                  {(() => {
                                    const parts = bundleTableData.reduce(
                                      (acc, row) =>
                                        acc +
                                        row.parts.length *
                                          (parseInt(row.mValue) || 5),
                                      0
                                    );
                                    const pass = bundleTableData.reduce(
                                      (acc, row) => {
                                        const bundleIndex = row.bundleNo - 1;
                                        const totalPcs =
                                          row.parts.length *
                                          (parseInt(row.mValue) || 5);
                                        const reject =
                                          summary.Middle.bundles?.[bundleIndex]
                                            ?.totalReject || 0;
                                        return acc + (totalPcs - reject);
                                      },
                                      0
                                    );
                                    return parts > 0
                                      ? ((pass / parts) * 100).toFixed(0)
                                      : 0;
                                  })()}
                                  %, B:{" "}
                                  {(() => {
                                    const parts = bundleTableData.reduce(
                                      (acc, row) =>
                                        acc +
                                        row.parts.length *
                                          (parseInt(row.bValue) || 5),
                                      0
                                    );
                                    const pass = bundleTableData.reduce(
                                      (acc, row) => {
                                        const bundleIndex = row.bundleNo - 1;
                                        const totalPcs =
                                          row.parts.length *
                                          (parseInt(row.bValue) || 5);
                                        const reject =
                                          summary.Bottom.bundles?.[bundleIndex]
                                            ?.totalReject || 0;
                                        return acc + (totalPcs - reject);
                                      },
                                      0
                                    );
                                    return parts > 0
                                      ? ((pass / parts) * 100).toFixed(0)
                                      : 0;
                                  })()}
                                  %
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <hr className="my-4 border-gray-300" />
                      <h3 className="text-sm font-medium text-gray-600 mb-2">
                        {t("cutting.measurementDetails")}
                      </h3>
                      <div className="flex justify-center mb-4">
                        <button
                          onClick={() => setActiveMeasurementTab("Top")}
                          className={`px-4 py-2 ${
                            activeMeasurementTab === "Top"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          } rounded-l-lg`}
                        >
                          {t("cutting.top")}
                        </button>
                        <button
                          onClick={() => setActiveMeasurementTab("Middle")}
                          className={`px-4 py-2 ${
                            activeMeasurementTab === "Middle"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {t("cutting.middle")}
                        </button>
                        <button
                          onClick={() => setActiveMeasurementTab("Bottom")}
                          className={`px-4 py-2 ${
                            activeMeasurementTab === "Bottom"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          } rounded-r-lg`}
                        >
                          {t("cutting.bottom")}
                        </button>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {t("cutting.panelType")}
                          </label>
                          <select
                            value={filters.panelName}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                panelName: e.target.value
                              })
                            }
                            className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">All</option>
                            {uniqueOptions("panelName").map((option, index) => (
                              <option key={index} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {t("cutting.side")}
                          </label>
                          <select
                            value={filters.side}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                side: e.target.value
                              })
                            }
                            className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">All</option>
                            {uniqueOptions("panelSide").map((option, index) => (
                              <option key={index} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {t("cutting.direction")}
                          </label>
                          <select
                            value={filters.direction}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                direction: e.target.value
                              })
                            }
                            className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">All</option>
                            {uniqueOptions("panelDirection").map(
                              (option, index) => (
                                <option key={index} value={option}>
                                  {option}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {t("cutting.lw")}
                          </label>
                          <select
                            value={filters.lw}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                lw: e.target.value
                              })
                            }
                            className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">All</option>
                            {uniqueOptions("measurementSide").map(
                              (option, index) => (
                                <option key={index} value={option}>
                                  {option}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>
                      {bundleTableData.map((bundle, bundleIndex) => {
                        if (
                          !tableData[bundleIndex] ||
                          bundle.parts.length === 0
                        ) {
                          return (
                            <div key={bundleIndex} className="mt-4">
                              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                                {t("cutting.bundleNo")}: {bundle.bundleNo}
                              </h2>
                              <p className="text-sm text-gray-600">
                                {t("cutting.noPartsSelected")}
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div key={bundleIndex} className="mt-4">
                            <h2 className="text-sm font-semibold text-gray-700 mb-2">
                              {t("cutting.bundleNo")}: {bundle.bundleNo}
                            </h2>

                            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-6 gap-4 mb-4">
                              <div className="p-4 bg-blue-100 rounded-lg text-center">
                                <p className="text-xs font-medium text-gray-700">
                                  {t("cutting.parts")}
                                </p>

                                <p className="text-lg font-bold">
                                  {calculateTotalPcs(bundle)}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  T:{" "}
                                  {bundle.parts.length *
                                    (parseInt(bundle.tValue) || 5)}
                                  , M:{" "}
                                  {bundle.parts.length *
                                    (parseInt(bundle.mValue) || 5)}
                                  , B:{" "}
                                  {bundle.parts.length *
                                    (parseInt(bundle.bValue) || 5)}
                                </p>
                              </div>
                              <div className="p-4 bg-green-100 rounded-lg text-center">
                                <p className="text-xs font-medium text-gray-700">
                                  {t("cutting.pass")}
                                </p>
                                <p className="text-lg font-bold">
                                  {(() => {
                                    const totalPcs = calculateTotalPcs(bundle);
                                    const totalReject = [
                                      "Top",
                                      "Middle",
                                      "Bottom"
                                    ].reduce(
                                      (acc, tab) =>
                                        acc +
                                        (summary[tab].bundles?.[bundleIndex]
                                          ?.totalReject || 0),
                                      0
                                    );
                                    return totalPcs - totalReject;
                                  })()}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  T:{" "}
                                  {bundle.parts.length *
                                    (parseInt(bundle.tValue) || 5) -
                                    (summary.Top.bundles?.[bundleIndex]
                                      ?.totalReject || 0)}
                                  , M:{" "}
                                  {bundle.parts.length *
                                    (parseInt(bundle.mValue) || 5) -
                                    (summary.Middle.bundles?.[bundleIndex]
                                      ?.totalReject || 0)}
                                  , B:{" "}
                                  {bundle.parts.length *
                                    (parseInt(bundle.bValue) || 5) -
                                    (summary.Bottom.bundles?.[bundleIndex]
                                      ?.totalReject || 0)}
                                </p>
                              </div>
                              <div className="p-4 bg-red-100 rounded-lg text-center">
                                <p className="text-xs font-medium text-gray-700">
                                  {t("cutting.reject")}
                                </p>
                                <p className="text-lg font-bold">
                                  {["Top", "Middle", "Bottom"].reduce(
                                    (acc, tab) =>
                                      acc +
                                      (summary[tab].bundles?.[bundleIndex]
                                        ?.totalReject || 0),
                                    0
                                  )}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  T:{" "}
                                  {summary.Top.bundles?.[bundleIndex]
                                    ?.totalReject || 0}
                                  , M:{" "}
                                  {summary.Middle.bundles?.[bundleIndex]
                                    ?.totalReject || 0}
                                  , B:{" "}
                                  {summary.Bottom.bundles?.[bundleIndex]
                                    ?.totalReject || 0}
                                </p>
                              </div>
                              <div className="p-4 bg-orange-100 rounded-lg text-center">
                                <p className="text-xs font-medium text-gray-700">
                                  {t("cutting.rejectMeasurements")}
                                </p>
                                <p className="text-lg font-bold">
                                  {["Top", "Middle", "Bottom"].reduce(
                                    (acc, tab) =>
                                      acc +
                                      (summary[tab].bundles?.[bundleIndex]
                                        ?.rejectMeasurement || 0),
                                    0
                                  )}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  T:{" "}
                                  {summary.Top.bundles?.[bundleIndex]
                                    ?.rejectMeasurement || 0}
                                  , M:{" "}
                                  {summary.Middle.bundles?.[bundleIndex]
                                    ?.rejectMeasurement || 0}
                                  , B:{" "}
                                  {summary.Bottom.bundles?.[bundleIndex]
                                    ?.rejectMeasurement || 0}
                                </p>
                              </div>
                              <div className="p-4 bg-purple-100 rounded-lg text-center">
                                <p className="text-xs font-medium text-gray-700">
                                  {t("cutting.rejectDefects")}
                                </p>
                                <p className="text-lg font-bold">
                                  {["Top", "Middle", "Bottom"].reduce(
                                    (acc, tab) =>
                                      acc +
                                      (summary[tab].bundles?.[bundleIndex]
                                        ?.rejectDefects || 0),
                                    0
                                  )}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  T:{" "}
                                  {summary.Top.bundles?.[bundleIndex]
                                    ?.rejectDefects || 0}
                                  , M:{" "}
                                  {summary.Middle.bundles?.[bundleIndex]
                                    ?.rejectDefects || 0}
                                  , B:{" "}
                                  {summary.Bottom.bundles?.[bundleIndex]
                                    ?.rejectDefects || 0}
                                </p>
                              </div>
                              {(() => {
                                const totalPcs = calculateTotalPcs(bundle);
                                const totalPass =
                                  totalPcs -
                                  ["Top", "Middle", "Bottom"].reduce(
                                    (acc, tab) =>
                                      acc +
                                      (summary[tab].bundles?.[bundleIndex]
                                        ?.totalReject || 0),
                                    0
                                  );
                                const passRate =
                                  totalPcs > 0
                                    ? ((totalPass / totalPcs) * 100).toFixed(2)
                                    : 0;
                                const bgColor =
                                  passRate < 90 ? "bg-red-100" : "bg-green-100";

                                return (
                                  <div
                                    className={`p-4 ${bgColor} rounded-lg text-center`}
                                  >
                                    <p className="text-xs font-medium text-gray-700">
                                      {t("cutting.passRate")}
                                    </p>
                                    <p className="text-lg font-bold">
                                      {passRate}%
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                      T:{" "}
                                      {(() => {
                                        const totalPcs =
                                          bundle.parts.length *
                                          (parseInt(bundle.tValue) || 5);
                                        const totalPass =
                                          totalPcs -
                                          (summary.Top.bundles?.[bundleIndex]
                                            ?.totalReject || 0);
                                        return totalPcs > 0
                                          ? (
                                              (totalPass / totalPcs) *
                                              100
                                            ).toFixed(0)
                                          : 0;
                                      })()}
                                      %, M:{" "}
                                      {(() => {
                                        const totalPcs =
                                          bundle.parts.length *
                                          (parseInt(bundle.mValue) || 5);
                                        const totalPass =
                                          totalPcs -
                                          (summary.Middle.bundles?.[bundleIndex]
                                            ?.totalReject || 0);
                                        return totalPcs > 0
                                          ? (
                                              (totalPass / totalPcs) *
                                              100
                                            ).toFixed(0)
                                          : 0;
                                      })()}
                                      %, B:{" "}
                                      {(() => {
                                        const totalPcs =
                                          bundle.parts.length *
                                          (parseInt(bundle.bValue) || 5);
                                        const totalPass =
                                          totalPcs -
                                          (summary.Bottom.bundles?.[bundleIndex]
                                            ?.totalReject || 0);
                                        return totalPcs > 0
                                          ? (
                                              (totalPass / totalPcs) *
                                              100
                                            ).toFixed(0)
                                          : 0;
                                      })()}
                                      %
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                            {activeMeasurementTab === "Top" && (
                              <MeasurementTable
                                key={`Top-${selectedPanel}-${bundleIndex}`}
                                tab="Top"
                                measurementPoints={measurementPoints} //{filteredMeasurementPoints}
                                numColumns={colCounts[bundleIndex]?.Top || 5}
                                tolerance={tolerance}
                                onUpdate={(data) =>
                                  updateSummary("Top", data, bundleIndex)
                                }
                                tableData={tableData[bundleIndex]?.Top || []}
                                setTableData={(data) =>
                                  updateTableData(bundleIndex, "Top", data)
                                }
                                filters={filters}
                                defects={columnDefects[bundleIndex]?.Top || []}
                                setDefects={(newDefects) =>
                                  updateDefects(bundleIndex, "Top", newDefects)
                                }
                                bundleIndex={bundleIndex}
                                selectedParts={bundle.parts}
                                moNo={moNo}
                                fabricDefects={fabricDefects} // Add this prop
                              />
                            )}
                            {activeMeasurementTab === "Middle" && (
                              <MeasurementTable
                                key={`Middle-${selectedPanel}-${bundleIndex}`}
                                tab="Middle"
                                measurementPoints={measurementPoints} //{filteredMeasurementPoints}
                                numColumns={colCounts[bundleIndex]?.Middle || 5}
                                tolerance={tolerance}
                                onUpdate={(data) =>
                                  updateSummary("Middle", data, bundleIndex)
                                }
                                tableData={tableData[bundleIndex]?.Middle || []}
                                setTableData={(data) =>
                                  updateTableData(bundleIndex, "Middle", data)
                                }
                                filters={filters}
                                defects={
                                  columnDefects[bundleIndex]?.Middle || []
                                }
                                setDefects={(newDefects) =>
                                  updateDefects(
                                    bundleIndex,
                                    "Middle",
                                    newDefects
                                  )
                                }
                                bundleIndex={bundleIndex}
                                selectedParts={bundle.parts}
                                moNo={moNo}
                                fabricDefects={fabricDefects} // Add this prop
                              />
                            )}
                            {activeMeasurementTab === "Bottom" && (
                              <MeasurementTable
                                key={`Bottom-${selectedPanel}-${bundleIndex}`}
                                tab="Bottom"
                                measurementPoints={measurementPoints} //{filteredMeasurementPoints}
                                numColumns={colCounts[bundleIndex]?.Bottom || 5}
                                tolerance={tolerance}
                                onUpdate={(data) =>
                                  updateSummary("Bottom", data, bundleIndex)
                                }
                                tableData={tableData[bundleIndex]?.Bottom || []}
                                setTableData={(data) =>
                                  updateTableData(bundleIndex, "Bottom", data)
                                }
                                filters={filters}
                                defects={
                                  columnDefects[bundleIndex]?.Bottom || []
                                }
                                setDefects={(newDefects) =>
                                  updateDefects(
                                    bundleIndex,
                                    "Bottom",
                                    newDefects
                                  )
                                }
                                bundleIndex={bundleIndex}
                                selectedParts={bundle.parts}
                                moNo={moNo}
                                fabricDefects={fabricDefects} // Add this prop
                              />
                            )}
                          </div>
                        );
                      })}
                      {/* Add CuttingIssues here, after all bundles */}
                      {bundleQty && (
                        <>
                          <hr className="my-4 border-gray-300" />
                          <CuttingIssues
                            moNo={moNo}
                            selectedPanel={selectedPanel}
                          />
                        </>
                      )}
                    </>
                  )}
                  <div className="mt-2 text-sm text-gray-600">
                    {t("cutting.additionalInformation")}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800"
              >
                {t("cutting.submit")}
              </button>
            </div>
          </>
        ) : activeTab === "data" ? (
          <div className="text-gray-600">{t("cutting.dataTabPlaceholder")}</div>
        ) : activeTab === "Modify" ? (
          <div className="text-gray-600">
            <CuttingMeasurementPointsModify />
          </div>
        ) : activeTab === "Adding" ? (
          <div className="text-gray-600">
            <CuttingOrderModify />
          </div>
        ) : (
          <div className="text-gray-600">{t("cutting.dataTabPlaceholder")}</div>
        )}
      </div>
    </div>
  );
};

export default CuttingPage;
