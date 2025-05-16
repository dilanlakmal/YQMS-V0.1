// import axios from "axios";
// import { Keyboard } from "lucide-react";
// import React, { useEffect, useRef, useState } from "react";
// import "react-datepicker/dist/react-datepicker.css";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import { API_BASE_URL } from "../../../../config";
// import { useAuth } from "../../authentication/AuthContext";
// import NumberPad from "../../forms/NumberPad";
// import CuttingIssues from "./CuttingIssues";
// import MeasurementTable from "./MeasurementTable";

// const CuttingInspectionModify = () => {
//   const { t } = useTranslation();
//   const { user } = useAuth();
//   const [moNo, setMoNo] = useState("");
//   const [moNoSearch, setMoNoSearch] = useState("");
//   const [moNoOptions, setMoNoOptions] = useState([]);
//   const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
//   const moNoDropdownRef = useRef(null);
//   const [tableNo, setTableNo] = useState("");
//   const [tableNoSearch, setTableNoSearch] = useState("");
//   const [tableNoOptions, setTableNoOptions] = useState([]);
//   const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
//   const tableNoDropdownRef = useRef(null);
//   const [garmentType, setGarmentType] = useState("");
//   const [garmentTypeOptions, setGarmentTypeOptions] = useState([]);
//   const [showGarmentTypeDropdown, setShowGarmentTypeDropdown] = useState(false);
//   const garmentTypeDropdownRef = useRef(null);
//   const [inspectionRecord, setInspectionRecord] = useState(null);
//   const [availableSizes, setAvailableSizes] = useState([]);
//   const [selectedSize, setSelectedSize] = useState("");
//   const [totalBundleQty, setTotalBundleQty] = useState("");
//   const [bundleQtyCheck, setBundleQtyCheck] = useState("");
//   const [totalInspectionQty, setTotalInspectionQty] = useState(0);
//   const [cuttingByAuto, setCuttingByAuto] = useState(false);
//   const [cuttingByManual, setCuttingByManual] = useState(false);
//   const [bundleQty, setBundleQty] = useState("");
//   const [bundleTableData, setBundleTableData] = useState([]); // UI data for bundle details table
//   const [showNumberPad, setShowNumberPad] = useState(false);
//   const [isTablet, setIsTablet] = useState(false);
//   const [measurementPoints, setMeasurementPoints] = useState([]);
//   const [fabricDefects, setFabricDefects] = useState([]);
//   const [tableData, setTableData] = useState([]); // UI data for measurement tables [bundleIndex][location]
//   const [columnDefects, setColumnDefects] = useState([]); // UI data for defect tables [bundleIndex][location][colIndex][defectSlotIndex]
//   const [summary, setSummary] = useState({
//     Top: {
//       totalParts: 0,
//       totalPass: 0,
//       totalReject: 0,
//       rejectMeasurement: 0,
//       rejectDefects: 0,
//       passRate: 0,
//       bundles: [],
//     },
//     Middle: {
//       totalParts: 0,
//       totalPass: 0,
//       totalReject: 0,
//       rejectMeasurement: 0,
//       rejectDefects: 0,
//       passRate: 0,
//       bundles: [],
//     },
//     Bottom: {
//       totalParts: 0,
//       totalPass: 0,
//       totalReject: 0,
//       rejectMeasurement: 0,
//       rejectDefects: 0,
//       passRate: 0,
//       bundles: [],
//     },
//   });
//   const [colCounts, setColCounts] = useState([]);
//   const [tolerance, setTolerance] = useState({ min: -0.125, max: 0.125 });
//   const [activeMeasurementTab, setActiveMeasurementTab] = useState("Top");
//   const [filters, setFilters] = useState({
//     panelName: "",
//     side: "",
//     direction: "",
//     lw: "",
//   });
//   const cuttingIssuesRef = useRef(null);

//   useEffect(() => {
//     const userAgent = navigator.userAgent.toLowerCase();
//     setIsTablet(
//       /ipad|android|tablet|kindle|playbook|silk/.test(userAgent) ||
//         (userAgent.includes("mobile") && !userAgent.includes("phone"))
//     );
//   }, []);

//   useEffect(() => {
//     const fetchMoNumbers = async () => {
//       if (!moNoSearch.trim()) {
//         setMoNoOptions([]);
//         setShowMoNoDropdown(false);
//         return;
//       }
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/cutting-inspections-mo-numbers`,
//           {
//             params: { search: moNoSearch },
//             headers: { "Content-Type": "application/json" },
//             withCredentials: true,
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
//           text: t("cutting.failedToFetchMONumbers"),
//         });
//       }
//     };
//     fetchMoNumbers();
//   }, [moNoSearch, t]);

//   useEffect(() => {
//     const fetchTableNoOptions = async () => {
//       if (!moNo) {
//         setTableNoOptions([]);
//         return;
//       }
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/cutting-inspections-table-nos`,
//           {
//             params: { moNo },
//             headers: { "Content-Type": "application/json" },
//             withCredentials: true,
//           }
//         );
//         setTableNoOptions(response.data);
//       } catch (error) {
//         console.error("Error fetching Table Nos:", error);
//         setTableNoOptions([]);
//         Swal.fire({
//           icon: "error",
//           title: t("cutting.error"),
//           text: t("cutting.failedToFetchTableNos"),
//         });
//       }
//     };
//     fetchTableNoOptions();
//   }, [moNo, t]);

//   useEffect(() => {
//     const fetchGarmentTypeOptions = async () => {
//       if (!moNo || !tableNo) {
//         setGarmentTypeOptions([]);
//         setGarmentType("");
//         return;
//       }
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/cutting-inspections-garment-types`,
//           {
//             params: { moNo, tableNo },
//             headers: { "Content-Type": "application/json" },
//             withCredentials: true,
//           }
//         );
//         setGarmentTypeOptions(response.data);
//         setShowGarmentTypeDropdown(response.data.length > 0);
//       } catch (error) {
//         console.error("Error fetching garment types:", error);
//         setGarmentTypeOptions([]);
//         setGarmentType("");
//         Swal.fire({
//           icon: "error",
//           title: t("cutting.error"),
//           text: t("cutting.failedToFetchGarmentTypes"),
//         });
//       }
//     };
//     fetchGarmentTypeOptions();
//   }, [moNo, tableNo, t]);

//   useEffect(() => {
//     const fetchInspectionRecord = async () => {
//       if (!moNo || !tableNo || !garmentType) {
//         setInspectionRecord(null);
//         setAvailableSizes([]);
//         setSelectedSize("");
//         setBundleQty("");
//         setBundleTableData([]);
//         setTableData([]);
//         setColumnDefects([]);
//         return;
//       }
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/cutting-inspection`,
//           {
//             params: { moNo, tableNo, garmentType },
//             headers: { "Content-Type": "application/json" },
//             withCredentials: true,
//           }
//         );
//         setInspectionRecord(response.data);
//         setTotalBundleQty(response.data.totalBundleQty.toString());
//         setBundleQtyCheck(response.data.bundleQtyCheck.toString());
//         setTotalInspectionQty(response.data.totalInspectionQty);
//         setCuttingByAuto(response.data.cuttingtype.includes("Auto"));
//         setCuttingByManual(response.data.cuttingtype.includes("Manual"));
//         const sizes = response.data.mackerRatio.map((mr) => mr.markerSize);
//         setAvailableSizes([...new Set(sizes)]);
//         // Reset size-specific states if the record changes
//         setSelectedSize("");
//         setBundleQty("");
//         updateBundleTableData(0, ""); // Clear tables
//       } catch (error) {
//         console.error("Error fetching inspection record:", error);
//         setInspectionRecord(null);
//         setAvailableSizes([]);
//         setSelectedSize("");
//         Swal.fire({
//           icon: "error",
//           title: t("cutting.error"),
//           text: t("cutting.failedToFetchInspectionRecord"),
//         });
//       }
//     };
//     fetchInspectionRecord();
//   }, [moNo, tableNo, garmentType, t]);

//   useEffect(() => {
//     const fetchMeasurementPoints = async () => {
//       if (!moNo || !garmentType) {
//         setMeasurementPoints([]);
//         return;
//       }
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/cutting-measurement-points`,
//           {
//             params: { moNo, panel: garmentType },
//             headers: { "Content-Type": "application/json" },
//             withCredentials: true,
//           }
//         );
//         const commonResponse = await axios.get(
//           `${API_BASE_URL}/api/cutting-measurement-points`,
//           {
//             params: { moNo: "Common", panel: garmentType },
//             headers: { "Content-Type": "application/json" },
//             withCredentials: true,
//           }
//         );
//         const combinedPoints = [...response.data];
//         commonResponse.data.forEach((commonPoint) => {
//           if (
//             !combinedPoints.some(
//               (p) =>
//                 p.panelIndexName === commonPoint.panelIndexName &&
//                 p.pointNameEng === commonPoint.pointNameEng
//             )
//           ) {
//             combinedPoints.push(commonPoint);
//           }
//         });
//         setMeasurementPoints(combinedPoints);
//       } catch (error) {
//         console.error("Error fetching measurement points:", error);
//         setMeasurementPoints([]);
//         Swal.fire({
//           icon: "error",
//           title: t("cutting.error"),
//           text: t("cutting.failedToFetchMeasurementPoints"),
//         });
//       }
//     };
//     fetchMeasurementPoints();
//   }, [moNo, garmentType, t]);

//   useEffect(() => {
//     const fetchFabricDefects = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/cutting-fabric-defects`,
//           {
//             headers: { "Content-Type": "application/json" },
//             withCredentials: true,
//           }
//         );
//         setFabricDefects(response.data);
//       } catch (error) {
//         console.error("Error fetching fabric defects:", error);
//         setFabricDefects([]);
//         Swal.fire({
//           icon: "error",
//           title: t("cutting.error"),
//           text: t("cutting.failedToFetchDefects"),
//         });
//       }
//     };
//     fetchFabricDefects();
//   }, [t]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         moNoDropdownRef.current &&
//         !moNoDropdownRef.current.contains(event.target)
//       )
//         setShowMoNoDropdown(false);
//       if (
//         tableNoDropdownRef.current &&
//         !tableNoDropdownRef.current.contains(event.target)
//       )
//         setShowTableNoDropdown(false);
//       if (
//         garmentTypeDropdownRef.current &&
//         !garmentTypeDropdownRef.current.contains(event.target)
//       )
//         setShowGarmentTypeDropdown(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleTotalBundleQtyChange = (value) => {
//     setTotalBundleQty(value);
//     if (!inspectionRecord) return;
//     const layers =
//       inspectionRecord.cuttingTableDetails.actualLayers ||
//       inspectionRecord.cuttingTableDetails.planLayers;
//     const multiplication = parseInt(value) * layers;
//     let calculatedBundleQtyCheck;
//     if (multiplication >= 1 && multiplication <= 500)
//       calculatedBundleQtyCheck = 3;
//     else if (multiplication >= 501 && multiplication <= 1200)
//       calculatedBundleQtyCheck = 5;
//     else if (multiplication >= 1201 && multiplication <= 3000)
//       calculatedBundleQtyCheck = 9;
//     else if (multiplication >= 3201 && multiplication <= 10000)
//       calculatedBundleQtyCheck = 14;
//     else if (multiplication >= 10001 && multiplication <= 35000)
//       calculatedBundleQtyCheck = 20;
//     else calculatedBundleQtyCheck = "";
//     setBundleQtyCheck(calculatedBundleQtyCheck.toString());
//     setTotalInspectionQty(calculatedBundleQtyCheck * 15);
//   };

//   const handleBundleQtyChange = (e) => {
//     const newQtyString = e.target.value;
//     const newQty = parseInt(newQtyString) || 0;

//     if (inspectionRecord && selectedSize) {
//       const sumOtherSizes = inspectionRecord.inspectionData
//         .filter((data) => data.inspectedSize !== selectedSize)
//         .reduce((sum, data) => sum + (data.bundleQtyCheckSize || 0), 0);
//       const availableQtyForThisSize = parseInt(bundleQtyCheck) - sumOtherSizes;

//       if (newQty > availableQtyForThisSize && newQtyString !== "") {
//         // Allow clearing the input
//         Swal.fire({
//           icon: "error",
//           title: t("cutting.error"),
//           text: t("cutting.invalidBundleQtyDetail", {
//             max: availableQtyForThisSize,
//           }),
//         });
//         // Optionally, revert to max available or previous valid value
//         // For now, just show error. User needs to correct.
//         // Or, setBundleQty(availableQtyForThisSize.toString()); updateBundleTableData(availableQtyForThisSize, selectedSize);
//         return;
//       }
//     }

//     setBundleQty(newQtyString); // Allow empty string for clearing
//     updateBundleTableData(newQty, selectedSize);
//   };

//   const updateBundleTableData = (qty, currentSelectedSize) => {
//     if (
//       !inspectionRecord ||
//       !currentSelectedSize ||
//       measurementPoints.length === 0
//     ) {
//       setBundleTableData([]);
//       setTableData([]);
//       setColumnDefects([]);
//       setColCounts([]);
//       // Reset summaries
//       const resetSummary = {
//         totalParts: 0,
//         totalPass: 0,
//         totalReject: 0,
//         rejectMeasurement: 0,
//         rejectDefects: 0,
//         passRate: 0,
//         bundles: [],
//       };
//       setSummary({
//         Top: resetSummary,
//         Middle: resetSummary,
//         Bottom: resetSummary,
//       });
//       return;
//     }

//     const existingSizeData = inspectionRecord.inspectionData.find(
//       (data) => data.inspectedSize === currentSelectedSize
//     );

//     const newBundleTableUiData = Array.from({ length: qty }, (_, i) => {
//       const bundleNo = i + 1;
//       const existingBundleInDb = existingSizeData?.bundleInspectionData.find(
//         (bundle) => bundle.bundleNo === bundleNo
//       );

//       const partsInBundle =
//         existingBundleInDb?.measurementInsepctionData.map((p) => p.partName) ||
//         [];
//       const numPartsInBundle =
//         partsInBundle.length > 0 ? partsInBundle.length : 1; // Avoid division by zero if no parts selected yet for a new bundle

//       return {
//         bundleNo,
//         serialLetter: existingBundleInDb?.serialLetter || "",
//         parts: partsInBundle,
//         tValue: existingBundleInDb
//           ? Math.round(existingBundleInDb.pcs.top / numPartsInBundle)
//           : 5,
//         mValue: existingBundleInDb
//           ? Math.round(existingBundleInDb.pcs.middle / numPartsInBundle)
//           : 5,
//         bValue: existingBundleInDb
//           ? Math.round(existingBundleInDb.pcs.bottom / numPartsInBundle)
//           : 5,
//         isExisting: !!existingBundleInDb,
//       };
//     });

//     const newMeasurementUiData = newBundleTableUiData.map((uiBundle) => {
//       const existingBundleInDb = existingSizeData?.bundleInspectionData.find(
//         (bundle) => bundle.bundleNo === uiBundle.bundleNo
//       );

//       const bundleMeasurementData = { Top: [], Middle: [], Bottom: [] };

//       measurementPoints.forEach((mp, mpIndex) => {
//         const partDataForPointInDb =
//           existingBundleInDb?.measurementInsepctionData.find(
//             (p) => p.partName === mp.panelIndexName
//           );
//         const pointDataFromDb =
//           partDataForPointInDb?.measurementPointsData.find(
//             (pData) => pData.measurementPointName === mp.pointNameEng
//           );

//         ["Top", "Middle", "Bottom"].forEach((location) => {
//           const measurementsFromDbLocation =
//             pointDataFromDb?.measurementValues.find(
//               (mv) => mv.location === location
//             )?.measurements || [];

//           const valuesForUiRow = Array(
//             uiBundle[`${location.toLowerCase()[0]}Value`]
//           )
//             .fill(null)
//             .map((_, pcsIdx) => {
//               const pcsName = `${location[0]}${pcsIdx + 1}`;
//               const dbVal = measurementsFromDbLocation.find(
//                 (m) => m.pcsName === pcsName
//               );
//               return dbVal
//                 ? {
//                     decimal: dbVal.valuedecimal,
//                     fraction: dbVal.valuefraction,
//                     status: dbVal.status,
//                   }
//                 : { decimal: 0, fraction: "0", status: "Pass" };
//             });

//           // Only add if the part for this measurement point is selected for this bundle
//           if (uiBundle.parts.includes(mp.panelIndexName)) {
//             bundleMeasurementData[location].push({
//               no: bundleMeasurementData[location].length + 1, // This might not be stable if parts change, MeasurementTable handles its own 'no'
//               measurementPoint: mp.pointNameEng,
//               pointNameKhmer: mp.pointNameKhmer,
//               panelName: mp.panelName,
//               panelSide: mp.panelSide,
//               panelDirection: mp.panelDirection,
//               measurementSide: mp.measurementSide,
//               panelIndex: mp.panelIndex,
//               panelIndexName: mp.panelIndexName,
//               panelIndexNameKhmer: mp.panelIndexNameKhmer,
//               isUsed: !!pointDataFromDb,
//               values: valuesForUiRow,
//             });
//           }
//         });
//       });
//       return bundleMeasurementData;
//     });

//     const newDefectUiData = newBundleTableUiData.map((uiBundle) => {
//       const existingBundleInDb = existingSizeData?.bundleInspectionData.find(
//         (bundle) => bundle.bundleNo === uiBundle.bundleNo
//       );
//       const bundleDefectData = { Top: [], Middle: [], Bottom: [] };

//       ["Top", "Middle", "Bottom"].forEach((location) => {
//         const numColsForLocation =
//           uiBundle[`${location.toLowerCase()[0]}Value`];
//         // Structure: [colIndex][defectSlotIndex]
//         const defectsForLocationUi = Array(numColsForLocation)
//           .fill(null)
//           .map((_, colIdx) => {
//             const pcsName = `${location[0]}${colIdx + 1}`;
//             const defectsForPcsAcrossAllPartsInBundle = [];

//             if (existingBundleInDb) {
//               existingBundleInDb.measurementInsepctionData.forEach(
//                 (partInDb) => {
//                   // Only consider defects for parts selected in this UI bundle
//                   if (uiBundle.parts.includes(partInDb.partName)) {
//                     const fabricDefectForLocation = partInDb.fabricDefects.find(
//                       (fd) => fd.location === location
//                     );
//                     const defectDataForPcs =
//                       fabricDefectForLocation?.defectData.find(
//                         (dd) => dd.pcsName === pcsName
//                       );
//                     if (defectDataForPcs && defectDataForPcs.defects) {
//                       defectDataForPcs.defects.forEach((dbDefect) => {
//                         defectsForPcsAcrossAllPartsInBundle.push({
//                           defectName: dbDefect.defectName,
//                           count: dbDefect.defectQty,
//                         });
//                       });
//                     }
//                   }
//                 }
//               );
//             }

//             const defectsInUiSlots = Array(5).fill({
//               defectName: "",
//               count: 0,
//             });
//             defectsForPcsAcrossAllPartsInBundle.slice(0, 5).forEach((d, i) => {
//               defectsInUiSlots[i] = d;
//             });
//             return defectsInUiSlots;
//           });
//         bundleDefectData[location] = defectsForLocationUi;
//       });
//       return bundleDefectData;
//     });

//     setBundleTableData(newBundleTableUiData);
//     setColCounts(
//       newBundleTableUiData.map((bundle) => ({
//         Top: bundle.tValue,
//         Middle: bundle.mValue,
//         Bottom: bundle.bValue,
//       }))
//     );
//     setTableData(newMeasurementUiData);
//     setColumnDefects(newDefectUiData);

//     // Initialize summary bundles
//     const emptyBundleSummary = {
//       totalParts: 0,
//       totalPass: 0,
//       totalReject: 0,
//       rejectMeasurement: 0,
//       rejectDefects: 0,
//       passRate: 0,
//     };
//     const updatedSummary = {
//       Top: {
//         ...summary.Top,
//         bundles: Array(qty)
//           .fill(null)
//           .map((_, idx) => ({ ...emptyBundleSummary, bundleIndex: idx })),
//       },
//       Middle: {
//         ...summary.Middle,
//         bundles: Array(qty)
//           .fill(null)
//           .map((_, idx) => ({ ...emptyBundleSummary, bundleIndex: idx })),
//       },
//       Bottom: {
//         ...summary.Bottom,
//         bundles: Array(qty)
//           .fill(null)
//           .map((_, idx) => ({ ...emptyBundleSummary, bundleIndex: idx })),
//       },
//     };
//     setSummary(updatedSummary);
//   };

//   const calculateTotalPcs = (row) => {
//     if (!row || !Array.isArray(row.parts)) return 0;
//     const numParts = row.parts.length || 1; // if parts array is empty, assume 1 for calculation consistency if T/M/B values are present
//     const tValue = parseInt(row.tValue) || 0; // Default to 0 if not a number
//     const mValue = parseInt(row.mValue) || 0;
//     const bValue = parseInt(row.bValue) || 0;
//     return numParts * (tValue + mValue + bValue);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!moNo || !tableNo || !selectedSize || !bundleQty) {
//       Swal.fire({
//         icon: "warning",
//         title: t("cutting.missingInformation"),
//         text: t("cutting.fillRequiredFields"),
//       });
//       return;
//     }
//     // Aggregate overall summary from bundle summaries
//     const aggregateLocationSummary = (location) => {
//       return summary[location].bundles.reduce(
//         (acc, bundleSumm) => {
//           acc.totalParts += bundleSumm.totalParts;
//           acc.totalPass += bundleSumm.totalPass;
//           acc.totalReject += bundleSumm.totalReject;
//           acc.rejectMeasurement += bundleSumm.rejectMeasurement;
//           acc.rejectDefects += bundleSumm.rejectDefects;
//           return acc;
//         },
//         {
//           totalParts: 0,
//           totalPass: 0,
//           totalReject: 0,
//           rejectMeasurement: 0,
//           rejectDefects: 0,
//         }
//       );
//     };

//     const finalSummaryTop = aggregateLocationSummary("Top");
//     const finalSummaryMiddle = aggregateLocationSummary("Middle");
//     const finalSummaryBottom = aggregateLocationSummary("Bottom");

//     const calculatePassRate = (pass, total) =>
//       total > 0 ? parseFloat(((pass / total) * 100).toFixed(2)) : 0;

//     finalSummaryTop.passRate = calculatePassRate(
//       finalSummaryTop.totalPass,
//       finalSummaryTop.totalParts
//     );
//     finalSummaryMiddle.passRate = calculatePassRate(
//       finalSummaryMiddle.totalPass,
//       finalSummaryMiddle.totalParts
//     );
//     finalSummaryBottom.passRate = calculatePassRate(
//       finalSummaryBottom.totalPass,
//       finalSummaryBottom.totalParts
//     );

//     const cuttingtype =
//       cuttingByAuto && cuttingByManual
//         ? "Auto & Manual"
//         : cuttingByAuto
//         ? "Auto"
//         : cuttingByManual
//         ? "Manual"
//         : "None";
//     const cuttingIssuesData = cuttingIssuesRef.current.getIssuesData();

//     const inspectionDataPayload = {
//       inspectedSize: selectedSize,
//       bundleQtyCheckSize: parseInt(bundleQty),
//       tolerance,
//       totalPcsSize:
//         finalSummaryTop.totalParts +
//         finalSummaryMiddle.totalParts +
//         finalSummaryBottom.totalParts,
//       pcsSize: {
//         total:
//           finalSummaryTop.totalParts +
//           finalSummaryMiddle.totalParts +
//           finalSummaryBottom.totalParts,
//         top: finalSummaryTop.totalParts,
//         middle: finalSummaryMiddle.totalParts,
//         bottom: finalSummaryBottom.totalParts,
//       },
//       passSize: {
//         total:
//           finalSummaryTop.totalPass +
//           finalSummaryMiddle.totalPass +
//           finalSummaryBottom.totalPass,
//         top: finalSummaryTop.totalPass,
//         middle: finalSummaryMiddle.totalPass,
//         bottom: finalSummaryBottom.totalPass,
//       },
//       rejectSize: {
//         // Overall reject (measurement or defect)
//         total:
//           finalSummaryTop.totalReject +
//           finalSummaryMiddle.totalReject +
//           finalSummaryBottom.totalReject,
//         top: finalSummaryTop.totalReject,
//         middle: finalSummaryMiddle.totalReject,
//         bottom: finalSummaryBottom.totalReject,
//       },
//       rejectGarmentSize: {
//         // Assuming rejectGarment is same as rejectSize for now based on UI
//         total:
//           finalSummaryTop.totalReject +
//           finalSummaryMiddle.totalReject +
//           finalSummaryBottom.totalReject,
//         top: finalSummaryTop.totalReject,
//         middle: finalSummaryMiddle.totalReject,
//         bottom: finalSummaryBottom.totalReject,
//       },
//       rejectMeasurementSize: {
//         total:
//           finalSummaryTop.rejectMeasurement +
//           finalSummaryMiddle.rejectMeasurement +
//           finalSummaryBottom.rejectMeasurement,
//         top: finalSummaryTop.rejectMeasurement,
//         middle: finalSummaryMiddle.rejectMeasurement,
//         bottom: finalSummaryBottom.rejectMeasurement,
//       },
//       passrateSize: {
//         total: calculatePassRate(
//           finalSummaryTop.totalPass +
//             finalSummaryMiddle.totalPass +
//             finalSummaryBottom.totalPass,
//           finalSummaryTop.totalParts +
//             finalSummaryMiddle.totalParts +
//             finalSummaryBottom.totalParts
//         ),
//         top: finalSummaryTop.passRate,
//         middle: finalSummaryMiddle.passRate,
//         bottom: finalSummaryBottom.passRate,
//       },
//       bundleInspectionData: bundleTableData.map((bundle, bundleIndex) => {
//         const bundleSummTop = summary.Top.bundles[bundleIndex] || {
//           totalParts: 0,
//           totalPass: 0,
//           totalReject: 0,
//           rejectMeasurement: 0,
//           rejectDefects: 0,
//           passRate: 0,
//         };
//         const bundleSummMiddle = summary.Middle.bundles[bundleIndex] || {
//           totalParts: 0,
//           totalPass: 0,
//           totalReject: 0,
//           rejectMeasurement: 0,
//           rejectDefects: 0,
//           passRate: 0,
//         };
//         const bundleSummBottom = summary.Bottom.bundles[bundleIndex] || {
//           totalParts: 0,
//           totalPass: 0,
//           totalReject: 0,
//           rejectMeasurement: 0,
//           rejectDefects: 0,
//           passRate: 0,
//         };

//         const totalPcsBundle =
//           bundleSummTop.totalParts +
//           bundleSummMiddle.totalParts +
//           bundleSummBottom.totalParts;
//         const totalPassBundle =
//           bundleSummTop.totalPass +
//           bundleSummMiddle.totalPass +
//           bundleSummBottom.totalPass;
//         const totalRejectBundle =
//           bundleSummTop.totalReject +
//           bundleSummMiddle.totalReject +
//           bundleSummBottom.totalReject;
//         const totalRejectMeasurementBundle =
//           bundleSummTop.rejectMeasurement +
//           bundleSummMiddle.rejectMeasurement +
//           bundleSummBottom.rejectMeasurement;

//         // Find the original DB entry for this bundle if it exists, to get partNo, partNameKhmer
//         const existingSizeDataForSubmit = inspectionRecord?.inspectionData.find(
//           (d) => d.inspectedSize === selectedSize
//         );
//         const existingBundleInDbForSubmit =
//           existingSizeDataForSubmit?.bundleInspectionData.find(
//             (b) => b.bundleNo === bundle.bundleNo
//           );

//         return {
//           bundleNo: bundle.bundleNo,
//           serialLetter: bundle.serialLetter,
//           totalPcs: totalPcsBundle,
//           pcs: {
//             total: totalPcsBundle,
//             top: bundleSummTop.totalParts,
//             middle: bundleSummMiddle.totalParts,
//             bottom: bundleSummBottom.totalParts,
//           },
//           pass: {
//             total: totalPassBundle,
//             top: bundleSummTop.totalPass,
//             middle: bundleSummMiddle.totalPass,
//             bottom: bundleSummBottom.totalPass,
//           },
//           reject: {
//             total: totalRejectBundle,
//             top: bundleSummTop.totalReject,
//             middle: bundleSummMiddle.totalReject,
//             bottom: bundleSummBottom.totalReject,
//           },
//           rejectGarment: {
//             // Assuming same as reject for now
//             total: totalRejectBundle,
//             top: bundleSummTop.totalReject,
//             middle: bundleSummMiddle.totalReject,
//             bottom: bundleSummBottom.totalReject,
//           },
//           rejectMeasurement: {
//             total: totalRejectMeasurementBundle,
//             top: bundleSummTop.rejectMeasurement,
//             middle: bundleSummMiddle.rejectMeasurement,
//             bottom: bundleSummBottom.rejectMeasurement,
//           },
//           passrate: {
//             total: calculatePassRate(totalPassBundle, totalPcsBundle),
//             top: bundleSummTop.passRate,
//             middle: bundleSummMiddle.passRate,
//             bottom: bundleSummBottom.passRate,
//           },
//           measurementInsepctionData: bundle.parts.map((partName) => {
//             const existingPartInDb =
//               existingBundleInDbForSubmit?.measurementInsepctionData.find(
//                 (p) => p.partName === partName
//               );
//             return {
//               partName,
//               partNo: existingPartInDb?.partNo || 0,
//               partNameKhmer: existingPartInDb?.partNameKhmer || "",
//               measurementPointsData: measurementPoints
//                 .filter((mp) => mp.panelIndexName === partName)
//                 .map((mp) => {
//                   return {
//                     measurementPointName: mp.pointNameEng,
//                     measurementPointNameKhmer: mp.pointNameKhmer,
//                     panelName: mp.panelName,
//                     side: mp.panelSide,
//                     direction: mp.panelDirection,
//                     property: mp.measurementSide,
//                     measurementValues: ["Top", "Middle", "Bottom"].map(
//                       (location) => {
//                         const measurementRowForPoint = tableData[bundleIndex]?.[
//                           location
//                         ]?.find(
//                           (row) =>
//                             row.measurementPoint === mp.pointNameEng &&
//                             row.panelIndexName === partName &&
//                             row.isUsed
//                         );
//                         return {
//                           location,
//                           measurements:
//                             measurementRowForPoint?.values.map((val, idx) => ({
//                               pcsName: `${location[0]}${idx + 1}`,
//                               valuedecimal: val.decimal,
//                               valuefraction: val.fraction,
//                               status:
//                                 val.decimal < tolerance.min ||
//                                 val.decimal > tolerance.max
//                                   ? "Fail"
//                                   : "Pass",
//                             })) || [],
//                         };
//                       }
//                     ),
//                   };
//                 }),
//               fabricDefects: ["Top", "Middle", "Bottom"].map((location) => {
//                 const numColsForLocation =
//                   bundle[`${location.toLowerCase()[0]}Value`];
//                 return {
//                   location,
//                   defectData: Array.from(
//                     { length: numColsForLocation },
//                     (_, colIdx) => {
//                       const defectsInCell =
//                         columnDefects[bundleIndex]?.[location]?.[colIdx] || []; // Array of {defectName, count} from a specific slot
//                       return {
//                         pcsName: `${location[0]}${colIdx + 1}`,
//                         totalDefects: defectsInCell.reduce(
//                           (sum, d) => sum + Number(d.count),
//                           0
//                         ),
//                         defects: defectsInCell
//                           .filter((d) => d.defectName && d.count > 0) // Only include actual defects
//                           .map((d) => ({
//                             defectName: d.defectName, // This should be the ID or unique English name
//                             defectQty: Number(d.count),
//                           })),
//                       };
//                     }
//                   ),
//                 };
//               }),
//             };
//           }),
//         };
//       }),
//       cuttingDefects: {
//         issues: cuttingIssuesData.issues,
//         additionalComments: cuttingIssuesData.additionalComments,
//         additionalImages: cuttingIssuesData.additionalImages,
//       },
//       inspectionTime: new Date().toLocaleTimeString("en-US", { hour12: false }),
//       updated_at: new Date(),
//     };

//     const updatedInspectionRecordData = inspectionRecord.inspectionData
//       .filter((data) => data.inspectedSize !== selectedSize)
//       .concat(inspectionDataPayload);

//     const updatePayload = {
//       _id: inspectionRecord._id,
//       totalBundleQty: parseInt(totalBundleQty),
//       bundleQtyCheck: parseInt(bundleQtyCheck),
//       totalInspectionQty,
//       cuttingtype,
//       inspectionData: updatedInspectionRecordData,
//       // Ensure top-level fields like garmentType are also part of the payload if they can be modified
//       // or if the PUT operation expects the full document structure for some fields.
//       // For this specific update, garmentType isn't changing, but if other top-level fields were, include them.
//     };

//     try {
//       await axios.put(
//         `${API_BASE_URL}/api/update-cutting-inspection`,
//         updatePayload,
//         {
//           headers: { "Content-Type": "application/json" },
//           withCredentials: true,
//         }
//       );
//       Swal.fire({
//         icon: "success",
//         title: t("cutting.success"),
//         text: t("cutting.dataSaved"),
//       });
//       // Optionally re-fetch inspectionRecord here to get the absolute latest data including the update.
//       // This ensures that if the user immediately tries to modify the same size again, they see the just-saved data.
//       const response = await axios.get(
//         `${API_BASE_URL}/api/cutting-inspection`,
//         {
//           params: { moNo, tableNo, garmentType },
//           headers: { "Content-Type": "application/json" },
//           withCredentials: true,
//         }
//       );
//       setInspectionRecord(response.data);
//     } catch (error) {
//       console.error("Error updating cutting inspection:", error);
//       Swal.fire({
//         icon: "error",
//         title: t("cutting.error"),
//         text:
//           t("cutting.failedToSaveData") +
//           (error.response?.data?.message
//             ? `: ${error.response.data.message}`
//             : ""),
//       });
//     }
//   };

//   const serialLetters = Array.from({ length: 26 }, (_, i) =>
//     String.fromCharCode(65 + i)
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
//       <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
//         {" "}
//         {/* Increased max-w */}
//         <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
//           {t("cutting.modifyInspection")}
//         </h1>
//         <div className="mb-6">
//           {/* MO No, Table No, Garment Type selectors */}
//           <div className="flex flex-wrap gap-4 items-end">
//             <div className="flex-1 min-w-[150px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 {t("cutting.moNo")}
//               </label>
//               <div className="relative" ref={moNoDropdownRef}>
//                 <input
//                   type="text"
//                   value={moNoSearch}
//                   onChange={(e) => setMoNoSearch(e.target.value)}
//                   onFocus={() =>
//                     moNoOptions.length > 0 && setShowMoNoDropdown(true)
//                   }
//                   placeholder={t("cutting.search_mono")}
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showMoNoDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {moNoOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setMoNo(option);
//                           setMoNoSearch(option);
//                           setShowMoNoDropdown(false);
//                           setTableNo("");
//                           setTableNoSearch("");
//                           setGarmentType("");
//                           setInspectionRecord(null);
//                           setSelectedSize("");
//                           setBundleTableData([]);
//                           setTableData([]);
//                           setColumnDefects([]);
//                         }}
//                         className="p-2 hover:bg-blue-100 cursor-pointer"
//                       >
//                         {option}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </div>
//             </div>
//             <div className="flex-1 min-w-[150px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 {t("cutting.tableNo")}
//               </label>
//               <div className="relative" ref={tableNoDropdownRef}>
//                 <input
//                   type="text"
//                   value={tableNoSearch}
//                   onChange={(e) => {
//                     setTableNoSearch(e.target.value);
//                     setShowTableNoDropdown(true);
//                   }}
//                   onFocus={() =>
//                     tableNoOptions.length > 0 && setShowTableNoDropdown(true)
//                   }
//                   placeholder={t("cutting.search_table_no")}
//                   className={`mt-1 w-full p-2 border border-gray-300 rounded-lg ${
//                     !moNo ? "bg-gray-100 cursor-not-allowed" : ""
//                   }`}
//                   disabled={!moNo}
//                 />
//                 {showTableNoDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {tableNoOptions
//                       .filter((table) =>
//                         table
//                           .toLowerCase()
//                           .includes(tableNoSearch.toLowerCase())
//                       )
//                       .map((table, index) => (
//                         <li
//                           key={index}
//                           onClick={() => {
//                             setTableNo(table);
//                             setTableNoSearch(table);
//                             setShowTableNoDropdown(false);
//                             setGarmentType("");
//                             setInspectionRecord(null);
//                             setSelectedSize("");
//                             setBundleTableData([]);
//                             setTableData([]);
//                             setColumnDefects([]);
//                           }}
//                           className="p-2 hover:bg-blue-100 cursor-pointer"
//                         >
//                           {table}
//                         </li>
//                       ))}
//                   </ul>
//                 )}
//               </div>
//             </div>
//             <div className="flex-1 min-w-[150px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 {t("cutting.garmentType")}
//               </label>
//               <div className="relative" ref={garmentTypeDropdownRef}>
//                 <select
//                   value={garmentType}
//                   onChange={(e) => {
//                     setGarmentType(e.target.value);
//                     setSelectedSize("");
//                     setBundleTableData([]);
//                     setTableData([]);
//                     setColumnDefects([]);
//                   }}
//                   className={`mt-1 w-full p-2 border border-gray-300 rounded-lg ${
//                     !tableNo ? "bg-gray-100 cursor-not-allowed" : ""
//                   }`}
//                   disabled={!tableNo}
//                 >
//                   <option value="">{t("cutting.select_garment_type")}</option>
//                   {garmentTypeOptions.map((type, index) => (
//                     <option key={index} value={type}>
//                       {type}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>

//           {inspectionRecord && (
//             <div className="mt-4">
//               {/* Marker Ratio Table */}
//               <h2 className="text-sm font-semibold text-gray-700">
//                 {t("cutting.markerRatio")}
//               </h2>
//               <div className="overflow-x-auto">
//                 <table className="w-full border-collapse border border-gray-300 mt-2">
//                   <thead>
//                     <tr className="bg-gray-100">
//                       {inspectionRecord.mackerRatio.map((mr, index) => (
//                         <th
//                           key={index}
//                           className="border border-gray-300 p-2 text-sm"
//                         >
//                           {mr.markerSize}
//                         </th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     <tr>
//                       {inspectionRecord.mackerRatio.map((mr, index) => (
//                         <td
//                           key={index}
//                           className="border border-gray-300 p-2 text-sm text-center"
//                         >
//                           {mr.ratio}
//                         </td>
//                       ))}
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>

//               {/* Inspection Details Inputs */}
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4 items-end">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.totalBundleQty")}
//                   </label>
//                   <div className="relative">
//                     <input
//                       type={isTablet ? "number" : "text"}
//                       value={totalBundleQty}
//                       onChange={(e) =>
//                         handleTotalBundleQtyChange(e.target.value)
//                       }
//                       className="mt-1 w-full p-2 border border-gray-300 rounded-lg pr-10"
//                     />
//                     {!isTablet && (
//                       <button
//                         onClick={() => setShowNumberPad(true)}
//                         className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
//                       >
//                         <Keyboard className="w-5 h-5" />
//                       </button>
//                     )}
//                   </div>
//                   {showNumberPad && (
//                     <NumberPad
//                       onClose={() => setShowNumberPad(false)}
//                       onInput={handleTotalBundleQtyChange}
//                       initialValue={totalBundleQty}
//                     />
//                   )}
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.bundleQtyCheck")}
//                   </label>
//                   <input
//                     type="text"
//                     value={bundleQtyCheck}
//                     readOnly
//                     className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.totalInspectionQty")}
//                   </label>
//                   <input
//                     type="text"
//                     value={totalInspectionQty}
//                     readOnly
//                     className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.cuttingBy")}
//                   </label>
//                   <div className="flex items-center space-x-4 mt-2.5">
//                     {" "}
//                     {/* Adjusted margin for alignment */}
//                     <div className="flex items-center">
//                       <input
//                         type="checkbox"
//                         checked={cuttingByAuto}
//                         onChange={(e) => setCuttingByAuto(e.target.checked)}
//                         className="h-4 w-4 text-blue-600 border-gray-300 rounded"
//                       />
//                       <label className="ml-2 text-sm text-gray-700">
//                         {t("cutting.auto")}
//                       </label>
//                     </div>
//                     <div className="flex items-center">
//                       <input
//                         type="checkbox"
//                         checked={cuttingByManual}
//                         onChange={(e) => setCuttingByManual(e.target.checked)}
//                         className="h-4 w-4 text-blue-600 border-gray-300 rounded"
//                       />
//                       <label className="ml-2 text-sm text-gray-700">
//                         {t("cutting.manual")}
//                       </label>
//                     </div>
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.garmentType")}
//                   </label>
//                   <input
//                     type="text"
//                     value={garmentType}
//                     readOnly
//                     className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.size")}
//                   </label>
//                   <select
//                     value={selectedSize}
//                     onChange={(e) => {
//                       const newSize = e.target.value;
//                       setSelectedSize(newSize);
//                       if (inspectionRecord && newSize) {
//                         const existingSizeData =
//                           inspectionRecord.inspectionData.find(
//                             (data) => data.inspectedSize === newSize
//                           );
//                         const newBundleQtyForSize = existingSizeData
//                           ? existingSizeData.bundleQtyCheckSize.toString()
//                           : "";
//                         setBundleQty(newBundleQtyForSize); // This will trigger handleBundleQtyChange
//                         updateBundleTableData(
//                           parseInt(newBundleQtyForSize) || 0,
//                           newSize
//                         ); // Explicitly call with new size
//                       } else {
//                         setBundleQty("");
//                         updateBundleTableData(0, ""); // Clear if no size
//                       }
//                     }}
//                     className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                   >
//                     <option value="">{t("cutting.select_size")}</option>
//                     {availableSizes.map((size, index) => (
//                       <option key={index} value={size}>
//                         {size}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.bundleQty")}
//                   </label>
//                   <select
//                     value={bundleQty}
//                     onChange={handleBundleQtyChange}
//                     className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                     disabled={!selectedSize || !bundleQtyCheck}
//                   >
//                     <option value="">{t("cutting.select_bundle_qty")}</option>
//                     {Array.from(
//                       { length: parseInt(bundleQtyCheck) || 0 },
//                       (_, i) => (
//                         <option key={i + 1} value={i + 1}>
//                           {i + 1}
//                         </option>
//                       )
//                     )}
//                   </select>
//                 </div>
//               </div>

//               {/* Bundle Details Table */}
//               {selectedSize && bundleQty && bundleTableData.length > 0 && (
//                 <div className="mt-6">
//                   <h2 className="text-lg font-semibold text-gray-700 mb-2">
//                     {t("cutting.bundleDetails")}
//                   </h2>
//                   <div className="overflow-x-auto">
//                     <table className="w-full border-collapse border border-gray-300 mt-2">
//                       <thead>
//                         <tr className="bg-gray-100">
//                           <th className="border border-gray-300 p-2 text-sm">
//                             {t("cutting.bundleNo")}
//                           </th>
//                           <th className="border border-gray-300 p-2 text-sm">
//                             {t("cutting.serialLetter")}
//                           </th>
//                           <th className="border border-gray-300 p-2 text-sm">
//                             {t("cutting.parts")}
//                           </th>
//                           <th className="border border-gray-300 p-2 text-sm">
//                             {t("cutting.pcs")} (T/M/B)
//                           </th>
//                           <th className="border border-gray-300 p-2 text-sm">
//                             {t("cutting.totalPcs")}
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {bundleTableData.map((row, index) => (
//                           <tr key={`bundle-${index}`}>
//                             <td className="border border-gray-300 p-2 text-sm text-center">
//                               {row.bundleNo}
//                             </td>
//                             <td className="border border-gray-300 p-2 text-sm">
//                               <select
//                                 value={row.serialLetter}
//                                 onChange={(e) => {
//                                   const newData = [...bundleTableData];
//                                   newData[index].serialLetter = e.target.value;
//                                   setBundleTableData(newData);
//                                 }}
//                                 className="w-full p-1 border border-gray-300 rounded-lg text-sm"
//                               >
//                                 <option value="">
//                                   {t("cutting.select_serial_letter")}
//                                 </option>
//                                 {serialLetters.map((letter, i) => (
//                                   <option key={i} value={letter}>
//                                     {letter}
//                                   </option>
//                                 ))}
//                               </select>
//                             </td>
//                             <td className="border border-gray-300 p-2 text-sm">
//                               {row.isExisting && row.parts.length > 0 ? (
//                                 <div className="text-sm">
//                                   {row.parts.join(", ")}
//                                 </div>
//                               ) : (
//                                 <div className="flex flex-wrap gap-2">
//                                   {[
//                                     ...new Set(
//                                       measurementPoints.map(
//                                         (mp) => mp.panelIndexName
//                                       )
//                                     ),
//                                   ] // Unique panelIndexNames from all measurement points
//                                     .map((panelName, i) => (
//                                       <label
//                                         key={`part-chk-${index}-${i}`}
//                                         className="flex items-center space-x-1 text-sm"
//                                       >
//                                         <input
//                                           type="checkbox"
//                                           checked={row.parts.includes(
//                                             panelName
//                                           )}
//                                           onChange={(e) => {
//                                             const newData = [
//                                               ...bundleTableData,
//                                             ];
//                                             if (e.target.checked) {
//                                               if (
//                                                 !newData[index].parts.includes(
//                                                   panelName
//                                                 )
//                                               )
//                                                 newData[index].parts.push(
//                                                   panelName
//                                                 );
//                                             } else {
//                                               newData[index].parts = newData[
//                                                 index
//                                               ].parts.filter(
//                                                 (part) => part !== panelName
//                                               );
//                                             }
//                                             setBundleTableData(newData);
//                                             // After changing parts, MeasurementTable data needs to be updated/re-filtered
//                                             // This is complex as MeasurementTable builds its own data based on selectedParts.
//                                             // A simpler way is to re-trigger a light version of updateBundleTableData for this bundle.
//                                             // Or, pass a callback to MeasurementTable to inform it about part changes.
//                                             // For now, MeasurementTable's useEffect on selectedParts should handle it.
//                                           }}
//                                           className="h-4 w-4 text-blue-600 border-gray-300 rounded"
//                                         />
//                                         <span>{panelName}</span>
//                                       </label>
//                                     ))}
//                                 </div>
//                               )}
//                             </td>
//                             <td className="border border-gray-300 p-2 text-sm">
//                               <div className="flex items-center gap-2">
//                                 <span>T:</span>
//                                 <input
//                                   type="number"
//                                   value={row.tValue}
//                                   readOnly
//                                   className="w-12 p-1 border border-gray-300 rounded-lg text-sm bg-gray-100"
//                                 />
//                                 <span>M:</span>
//                                 <input
//                                   type="number"
//                                   value={row.mValue}
//                                   readOnly
//                                   className="w-12 p-1 border border-gray-300 rounded-lg text-sm bg-gray-100"
//                                 />
//                                 <span>B:</span>
//                                 <input
//                                   type="number"
//                                   value={row.bValue}
//                                   readOnly
//                                   className="w-12 p-1 border border-gray-300 rounded-lg text-sm bg-gray-100"
//                                 />
//                               </div>
//                             </td>
//                             <td className="border border-gray-300 p-2 text-sm text-center">
//                               {calculateTotalPcs(row)}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                   <hr className="my-6 border-gray-300" />
//                   <h3 className="text-lg font-semibold text-gray-700 mb-3">
//                     {t("cutting.measurementDetails")}
//                   </h3>
//                   <div className="flex justify-center mb-4">
//                     <button
//                       onClick={() => setActiveMeasurementTab("Top")}
//                       className={`px-4 py-2 ${
//                         activeMeasurementTab === "Top"
//                           ? "bg-blue-600 text-white"
//                           : "bg-gray-200 text-gray-700"
//                       } rounded-l-lg`}
//                     >
//                       {t("cutting.top")}
//                     </button>
//                     <button
//                       onClick={() => setActiveMeasurementTab("Middle")}
//                       className={`px-4 py-2 ${
//                         activeMeasurementTab === "Middle"
//                           ? "bg-blue-600 text-white"
//                           : "bg-gray-200 text-gray-700"
//                       }`}
//                     >
//                       {t("cutting.middle")}
//                     </button>
//                     <button
//                       onClick={() => setActiveMeasurementTab("Bottom")}
//                       className={`px-4 py-2 ${
//                         activeMeasurementTab === "Bottom"
//                           ? "bg-blue-600 text-white"
//                           : "bg-gray-200 text-gray-700"
//                       } rounded-r-lg`}
//                     >
//                       {t("cutting.bottom")}
//                     </button>
//                   </div>

//                   {/* Measurement Tables for each bundle */}
//                   {bundleTableData.map((bundle, bundleIndex) => (
//                     <div
//                       key={`measurement-bundle-${bundle.bundleNo}-${bundleIndex}`}
//                       className="mb-8 p-4 border border-gray-200 rounded-lg shadow"
//                     >
//                       <h2 className="text-md font-semibold text-gray-700 mb-3">
//                         {t("cutting.bundleNo")}: {bundle.bundleNo} (
//                         {t("cutting.serialLetter")}:{" "}
//                         {bundle.serialLetter || "N/A"})
//                       </h2>
//                       {bundle.parts.length === 0 && (
//                         <p className="text-sm text-red-500 mb-2">
//                           {t("cutting.noPartsSelectedForBundle")}
//                         </p>
//                       )}

//                       {activeMeasurementTab === "Top" &&
//                         bundle.parts.length > 0 && (
//                           <MeasurementTable
//                             tab="Top"
//                             measurementPoints={measurementPoints}
//                             numColumns={colCounts[bundleIndex]?.Top || 0}
//                             tolerance={tolerance}
//                             onUpdate={(data) =>
//                               setSummary((prev) => ({
//                                 ...prev,
//                                 Top: {
//                                   ...prev.Top,
//                                   bundles: prev.Top.bundles.map((b, i) =>
//                                     i === bundleIndex ? data : b
//                                   ),
//                                 },
//                               }))
//                             }
//                             tableData={tableData[bundleIndex]?.Top || []}
//                             setTableData={(updatedMeasurementData) =>
//                               setTableData((prev) =>
//                                 prev.map((d, i) =>
//                                   i === bundleIndex
//                                     ? { ...d, Top: updatedMeasurementData }
//                                     : d
//                                 )
//                               )
//                             }
//                             filters={filters}
//                             defects={columnDefects[bundleIndex]?.Top || []}
//                             setDefects={(newDefects) =>
//                               setColumnDefects((prev) =>
//                                 prev.map((d, i) =>
//                                   i === bundleIndex
//                                     ? { ...d, Top: newDefects }
//                                     : d
//                                 )
//                               )
//                             }
//                             bundleIndex={bundleIndex}
//                             selectedParts={bundle.parts}
//                             moNo={moNo}
//                             fabricDefects={fabricDefects}
//                           />
//                         )}
//                       {activeMeasurementTab === "Middle" &&
//                         bundle.parts.length > 0 && (
//                           <MeasurementTable
//                             tab="Middle"
//                             measurementPoints={measurementPoints}
//                             numColumns={colCounts[bundleIndex]?.Middle || 0}
//                             tolerance={tolerance}
//                             onUpdate={(data) =>
//                               setSummary((prev) => ({
//                                 ...prev,
//                                 Middle: {
//                                   ...prev.Middle,
//                                   bundles: prev.Middle.bundles.map((b, i) =>
//                                     i === bundleIndex ? data : b
//                                   ),
//                                 },
//                               }))
//                             }
//                             tableData={tableData[bundleIndex]?.Middle || []}
//                             setTableData={(updatedMeasurementData) =>
//                               setTableData((prev) =>
//                                 prev.map((d, i) =>
//                                   i === bundleIndex
//                                     ? { ...d, Middle: updatedMeasurementData }
//                                     : d
//                                 )
//                               )
//                             }
//                             filters={filters}
//                             defects={columnDefects[bundleIndex]?.Middle || []}
//                             setDefects={(newDefects) =>
//                               setColumnDefects((prev) =>
//                                 prev.map((d, i) =>
//                                   i === bundleIndex
//                                     ? { ...d, Middle: newDefects }
//                                     : d
//                                 )
//                               )
//                             }
//                             bundleIndex={bundleIndex}
//                             selectedParts={bundle.parts}
//                             moNo={moNo}
//                             fabricDefects={fabricDefects}
//                           />
//                         )}
//                       {activeMeasurementTab === "Bottom" &&
//                         bundle.parts.length > 0 && (
//                           <MeasurementTable
//                             tab="Bottom"
//                             measurementPoints={measurementPoints}
//                             numColumns={colCounts[bundleIndex]?.Bottom || 0}
//                             tolerance={tolerance}
//                             onUpdate={(data) =>
//                               setSummary((prev) => ({
//                                 ...prev,
//                                 Bottom: {
//                                   ...prev.Bottom,
//                                   bundles: prev.Bottom.bundles.map((b, i) =>
//                                     i === bundleIndex ? data : b
//                                   ),
//                                 },
//                               }))
//                             }
//                             tableData={tableData[bundleIndex]?.Bottom || []}
//                             setTableData={(updatedMeasurementData) =>
//                               setTableData((prev) =>
//                                 prev.map((d, i) =>
//                                   i === bundleIndex
//                                     ? { ...d, Bottom: updatedMeasurementData }
//                                     : d
//                                 )
//                               )
//                             }
//                             filters={filters}
//                             defects={columnDefects[bundleIndex]?.Bottom || []}
//                             setDefects={(newDefects) =>
//                               setColumnDefects((prev) =>
//                                 prev.map((d, i) =>
//                                   i === bundleIndex
//                                     ? { ...d, Bottom: newDefects }
//                                     : d
//                                 )
//                               )
//                             }
//                             bundleIndex={bundleIndex}
//                             selectedParts={bundle.parts}
//                             moNo={moNo}
//                             fabricDefects={fabricDefects}
//                           />
//                         )}
//                     </div>
//                   ))}
//                   <hr className="my-6 border-gray-300" />
//                   <CuttingIssues
//                     ref={cuttingIssuesRef}
//                     moNo={moNo}
//                     selectedPanel={garmentType}
//                   />
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//         <div className="flex justify-center mt-8">
//           <button
//             onClick={handleSubmit}
//             className="px-8 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 text-lg font-semibold shadow-md"
//           >
//             {t("cutting.submit")}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CuttingInspectionModify;

// import axios from "axios";
// import { Keyboard, Save } from "lucide-react";
// import React, { useEffect, useRef, useState } from "react";
// import "react-datepicker/dist/react-datepicker.css";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import { API_BASE_URL } from "../../../../config";
// import { useAuth } from "../../authentication/AuthContext"; // Assuming useAuth is here
// import NumberPad from "../../forms/NumberPad"; // Assuming NumberPad is here
// import MeasurementTableModify from "./MeasurementTableModify"; // A modified/adapted version

// const CuttingInspectionModify = () => {
//   const { t, i18n } = useTranslation();
//   const { user, loading: authLoading } = useAuth();

//   // Search and Selection
//   const [moNoSearch, setMoNoSearch] = useState("");
//   const [moNoOptions, setMoNoOptions] = useState([]);
//   const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
//   const [selectedMoNo, setSelectedMoNo] = useState("");
//   const moNoDropdownRef = useRef(null);

//   const [tableNoSearch, setTableNoSearch] = useState("");
//   const [tableNoOptions, setTableNoOptions] = useState([]);
//   const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
//   const [selectedTableNo, setSelectedTableNo] = useState("");
//   const tableNoDropdownRef = useRef(null);

//   // Fetched Data
//   const [inspectionDoc, setInspectionDoc] = useState(null); // Original fetched document
//   const [editableInspectionDoc, setEditableInspectionDoc] = useState(null); // Deep copy for editing
//   const [markerRatios, setMarkerRatios] = useState([]);
//   const [uniqueSizesForSelection, setUniqueSizesForSelection] = useState([]);

//   // Top Level Fields (editable or recalculated)
//   const [totalBundleQtyInput, setTotalBundleQtyInput] = useState("");
//   const [bundleQtyCheckDisplay, setBundleQtyCheckDisplay] = useState("");
//   const [totalInspectionQtyDisplay, setTotalInspectionQtyDisplay] = useState(0);
//   const [isTotalInspectionQtyManual, setIsTotalInspectionQtyManual] =
//     useState(false);
//   const [cuttingByType, setCuttingByType] = useState({
//     auto: true,
//     manual: false,
//   });
//   const [garmentTypeDisplay, setGarmentTypeDisplay] = useState("");

//   // Size Specific Editing
//   const [selectedSizeForEdit, setSelectedSizeForEdit] = useState("");
//   const [currentEditingSizeData, setCurrentEditingSizeData] = useState(null); // Points to item in editableInspectionDoc.inspectionData
//   const [bundleQtyForSizeInput, setBundleQtyForSizeInput] = useState(""); // This is bundleQtyCheckSize for the selected size
//   const [
//     originalBundleQtyForSelectedSize,
//     setOriginalBundleQtyForSelectedSize,
//   ] = useState(null); // For non-decreasing rule
//   const [bundleQtyForSizeError, setBundleQtyForSizeError] = useState("");

//   // For Bundle Details, Measurement, Defects (data will be part of currentEditingSizeData)
//   // These states are for controlling UI elements like numpad/defectbox
//   const [showNumPad, setShowNumPad] = useState(false);
//   const [currentMeasurementCell, setCurrentMeasurementCell] = useState(null); // { bundleIndex, partIndex, mpIndex, locIndex, valueIndex }
//   const [showDefectBox, setShowDefectBox] = useState(false);
//   const [currentDefectCell, setCurrentDefectCell] = useState(null); // { bundleIndex, partIndex, locIndex, pcsNameIndex }

//   // Supporting data (like in Cutting.jsx)
//   const [panelIndexNames, setPanelIndexNames] = useState([]);
//   const [measurementPoints, setMeasurementPoints] = useState([]);
//   const [fabricDefectsList, setFabricDefectsList] = useState([]); // List of available fabric defects
//   const [tolerance, setTolerance] = useState({ min: -0.125, max: 0.125 }); // Default, might load from doc

//   // UI State
//   const [isLoading, setIsLoading] = useState(false);
//   const [isTablet, setIsTablet] = useState(false);
//   const [activeMeasurementTab, setActiveMeasurementTab] = useState("Top"); // For MeasurementTableModify
//   const [showNumberPadTotalBundle, setShowNumberPadTotalBundle] =
//     useState(false);

//   useEffect(() => {
//     const userAgent = navigator.userAgent.toLowerCase();
//     setIsTablet(
//       /ipad|android|tablet|kindle|playbook|silk/.test(userAgent) ||
//         (userAgent.includes("mobile") && !userAgent.includes("phone"))
//     );
//   }, []);

//   // Click outside handlers for dropdowns
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         moNoDropdownRef.current &&
//         !moNoDropdownRef.current.contains(event.target)
//       )
//         setShowMoNoDropdown(false);
//       if (
//         tableNoDropdownRef.current &&
//         !tableNoDropdownRef.current.contains(event.target)
//       )
//         setShowTableNoDropdown(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Fetch MO Numbers
//   useEffect(() => {
//     if (moNoSearch.trim() === "") {
//       setMoNoOptions([]);
//       setShowMoNoDropdown(false);
//       return;
//     }
//     const fetchMo = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/cutting-inspections/mo-numbers`,
//           { params: { search: moNoSearch } }
//         );
//         setMoNoOptions(response.data);
//         setShowMoNoDropdown(response.data.length > 0);
//       } catch (error) {
//         console.error("Error fetching MO numbers for modify:", error);
//       }
//     };
//     const debounceFetch = setTimeout(fetchMo, 300);
//     return () => clearTimeout(debounceFetch);
//   }, [moNoSearch]);

//   // Fetch Table Numbers
//   useEffect(() => {
//     if (!selectedMoNo) {
//       setTableNoOptions([]);
//       setShowTableNoDropdown(false);
//       return;
//     }
//     const fetchTables = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/cutting-inspections/table-numbers`,
//           { params: { moNo: selectedMoNo, search: tableNoSearch } }
//         );
//         setTableNoOptions(response.data);
//         setShowTableNoDropdown(
//           response.data.length > 0 || tableNoSearch.length > 0
//         );
//       } catch (error) {
//         console.error("Error fetching Table numbers for modify:", error);
//       }
//     };
//     const debounceFetch = setTimeout(fetchTables, 300);
//     return () => clearTimeout(debounceFetch);
//   }, [selectedMoNo, tableNoSearch]);

//   // Fetch Full Inspection Document
//   useEffect(() => {
//     if (!selectedMoNo || !selectedTableNo) {
//       setInspectionDoc(null);
//       setEditableInspectionDoc(null);
//       resetSubsequentStates();
//       return;
//     }
//     const fetchInspectionDetails = async () => {
//       setIsLoading(true);
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/cutting-inspection-details-for-modify`,
//           {
//             params: { moNo: selectedMoNo, tableNo: selectedTableNo },
//           }
//         );
//         const doc = response.data;
//         setInspectionDoc(doc);
//         setEditableInspectionDoc(JSON.parse(JSON.stringify(doc))); // Deep copy

//         // Populate top-level fields
//         setTotalBundleQtyInput(doc.totalBundleQty.toString());
//         setBundleQtyCheckDisplay(doc.bundleQtyCheck.toString());
//         setTotalInspectionQtyDisplay(doc.totalInspectionQty);
//         setCuttingByType(
//           doc.cuttingtype === "Auto"
//             ? { auto: true, manual: false }
//             : doc.cuttingtype === "Manual"
//             ? { auto: false, manual: true }
//             : doc.cuttingtype === "Auto & Manual"
//             ? { auto: true, manual: true }
//             : { auto: false, manual: false } // Default or handle other cases
//         );
//         setGarmentTypeDisplay(doc.garmentType);
//         setMarkerRatios(doc.mackerRatio || []);
//         const uniqueSizes = [
//           ...new Set(
//             (doc.mackerRatio || [])
//               .filter((mr) => mr.ratio > 0)
//               .map((mr) => mr.markerSize)
//           ),
//         ];
//         setUniqueSizesForSelection(uniqueSizes);

//         // If there's inspectionData, potentially load tolerance from the first item
//         if (
//           doc.inspectionData &&
//           doc.inspectionData.length > 0 &&
//           doc.inspectionData[0].tolerance
//         ) {
//           setTolerance(doc.inspectionData[0].tolerance);
//         }
//       } catch (error) {
//         console.error("Error fetching inspection details:", error);
//         Swal.fire({
//           icon: "error",
//           title: t("cutting.error"),
//           text: t("cutting.failedToFetchInspectionDetails"),
//         });
//         setInspectionDoc(null);
//         setEditableInspectionDoc(null);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchInspectionDetails();
//   }, [selectedMoNo, selectedTableNo, t]);

//   const resetSubsequentStates = () => {
//     setMarkerRatios([]);
//     setUniqueSizesForSelection([]);
//     setTotalBundleQtyInput("");
//     setBundleQtyCheckDisplay("");
//     setTotalInspectionQtyDisplay(0);
//     setCuttingByType({ auto: true, manual: false });
//     setGarmentTypeDisplay("");
//     setSelectedSizeForEdit("");
//     setCurrentEditingSizeData(null);
//     setBundleQtyForSizeInput("");
//     setOriginalBundleQtyForSelectedSize(null);
//     setBundleQtyForSizeError("");
//     setPanelIndexNames([]);
//     setMeasurementPoints([]);
//   };

//   // Recalculate BundleQtyCheck and TotalInspectionQty
//   useEffect(() => {
//     if (totalBundleQtyInput && editableInspectionDoc?.cuttingTableDetails) {
//       const layersToUse =
//         editableInspectionDoc.cuttingTableDetails.actualLayers ||
//         editableInspectionDoc.cuttingTableDetails.planLayers ||
//         0;
//       const multiplication = parseInt(totalBundleQtyInput) * layersToUse;
//       let calculatedBundleQtyCheck;
//       if (multiplication >= 1 && multiplication <= 500)
//         calculatedBundleQtyCheck = 3;
//       else if (multiplication >= 501 && multiplication <= 1200)
//         calculatedBundleQtyCheck = 5;
//       else if (multiplication >= 1201 && multiplication <= 3000)
//         calculatedBundleQtyCheck = 9;
//       else if (multiplication >= 3201 && multiplication <= 10000)
//         calculatedBundleQtyCheck = 14;
//       else if (multiplication >= 10001 && multiplication <= 35000)
//         calculatedBundleQtyCheck = 20;
//       else calculatedBundleQtyCheck = ""; // Or some default/error handling
//       setBundleQtyCheckDisplay(calculatedBundleQtyCheck.toString());
//       if (!isTotalInspectionQtyManual && calculatedBundleQtyCheck) {
//         setTotalInspectionQtyDisplay(calculatedBundleQtyCheck * 15);
//       } else if (!isTotalInspectionQtyManual && !calculatedBundleQtyCheck) {
//         setTotalInspectionQtyDisplay(0);
//       }
//     } else {
//       setBundleQtyCheckDisplay("");
//       if (!isTotalInspectionQtyManual) setTotalInspectionQtyDisplay(0);
//     }
//   }, [totalBundleQtyInput, editableInspectionDoc, isTotalInspectionQtyManual]);

//   // Effect for when selectedSizeForEdit changes
//   useEffect(() => {
//     if (
//       selectedSizeForEdit &&
//       editableInspectionDoc &&
//       editableInspectionDoc.inspectionData
//     ) {
//       const sizeData = editableInspectionDoc.inspectionData.find(
//         (item) => item.inspectedSize === selectedSizeForEdit
//       );
//       if (sizeData) {
//         setCurrentEditingSizeData(sizeData);
//         setBundleQtyForSizeInput(sizeData.bundleQtyCheckSize.toString());
//         setOriginalBundleQtyForSelectedSize(sizeData.bundleQtyCheckSize); // Store original value
//         if (sizeData.tolerance) setTolerance(sizeData.tolerance);
//       } else {
//         // This case should ideally not happen if size selection is from available inspectionData sizes
//         // Or, if we allow adding a new size inspection, this is where we'd initialize it.
//         // For now, based on prompt, we edit existing.
//         setCurrentEditingSizeData(null);
//         setBundleQtyForSizeInput("");
//         setOriginalBundleQtyForSelectedSize(null);
//         Swal.fire({
//           icon: "warning",
//           title: "Size Not Found",
//           text: `Inspection data for size ${selectedSizeForEdit} not found.`,
//         });
//       }
//     } else {
//       setCurrentEditingSizeData(null);
//       setBundleQtyForSizeInput("");
//       setOriginalBundleQtyForSelectedSize(null);
//     }
//     setBundleQtyForSizeError("");
//   }, [selectedSizeForEdit, editableInspectionDoc]);

//   // Fetch PanelIndexNames and MeasurementPoints when MO and GarmentType are available
//   useEffect(() => {
//     if (selectedMoNo && garmentTypeDisplay) {
//       const fetchSupportingData = async () => {
//         try {
//           // Fetch Panel Index Names
//           const panelNamesRes = await axios.get(
//             `${API_BASE_URL}/api/cutting-measurement-panel-index-names-by-mo`,
//             {
//               params: { moNo: selectedMoNo, panel: garmentTypeDisplay },
//             }
//           );
//           setPanelIndexNames(panelNamesRes.data);

//           // Fetch Measurement Points
//           const mpRes = await axios.get(
//             `${API_BASE_URL}/api/cutting-measurement-points`,
//             {
//               params: { moNo: selectedMoNo, panel: garmentTypeDisplay },
//             }
//           );
//           const commonMpRes = await axios.get(
//             `${API_BASE_URL}/api/cutting-measurement-points`,
//             {
//               params: { moNo: "Common", panel: garmentTypeDisplay },
//             }
//           );
//           const combinedPoints = [...mpRes.data];
//           commonMpRes.data.forEach((commonPoint) => {
//             if (
//               !combinedPoints.some(
//                 (p) =>
//                   p.panelIndexName === commonPoint.panelIndexName &&
//                   p.pointNameEng === commonPoint.pointNameEng
//               )
//             ) {
//               combinedPoints.push(commonPoint);
//             }
//           });
//           setMeasurementPoints(combinedPoints);
//         } catch (error) {
//           console.error(
//             "Error fetching supporting data (panels/measurement points):",
//             error
//           );
//           Swal.fire({
//             icon: "error",
//             title: t("cutting.error"),
//             text: t("cutting.failedToFetchSupportingData"),
//           });
//         }
//       };
//       fetchSupportingData();
//     }
//   }, [selectedMoNo, garmentTypeDisplay, t]);

//   // Fetch Fabric Defects List
//   useEffect(() => {
//     const fetchFabricDefects = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/cutting-fabric-defects`
//         );
//         setFabricDefectsList(response.data);
//       } catch (error) {
//         console.error("Error fetching fabric defects:", error);
//       }
//     };
//     fetchFabricDefects();
//   }, []);

//   // Handle Bundle Qty for Size Change and Validation
//   const handleBundleQtyForSizeChange = (newQtyStr) => {
//     const newQty = parseInt(newQtyStr);
//     if (isNaN(newQty) || newQty < 0) {
//       // Allow 0 if user wants to remove all bundles for this size
//       setBundleQtyForSizeError(t("cutting.invalidBundleQtyValue"));
//       setBundleQtyForSizeInput(newQtyStr); // Keep user input
//       return;
//     }

//     // Non-decreasing rule
//     if (
//       originalBundleQtyForSelectedSize !== null &&
//       newQty < originalBundleQtyForSelectedSize
//     ) {
//       setBundleQtyForSizeError(
//         t("cutting.bundleQtyCannotBeDecreased", {
//           original: originalBundleQtyForSelectedSize,
//         })
//       );
//       setBundleQtyForSizeInput(newQtyStr); // Keep user input, but show error
//       return;
//     }
//     if (!editableInspectionDoc || !bundleQtyCheckDisplay) {
//       setBundleQtyForSizeInput(newQtyStr);
//       return;
//     }

//     const mainBundleQtyCheck = parseInt(bundleQtyCheckDisplay);
//     const sumOtherBundleQtyCheckSize = editableInspectionDoc.inspectionData
//       .filter((d) => d.inspectedSize !== selectedSizeForEdit)
//       .reduce((sum, d) => sum + d.bundleQtyCheckSize, 0);

//     if (newQty > mainBundleQtyCheck - sumOtherBundleQtyCheckSize) {
//       setBundleQtyForSizeError(
//         t("cutting.bundleQtyExceedsLimit", {
//           limit: mainBundleQtyCheck - sumOtherBundleQtyCheckSize,
//         })
//       );
//       setBundleQtyForSizeInput(newQtyStr); // Keep user input
//     } else {
//       setBundleQtyForSizeError("");
//       setBundleQtyForSizeInput(newQtyStr);

//       // Update currentEditingSizeData
//       if (currentEditingSizeData) {
//         const updatedSizeData = {
//           ...currentEditingSizeData,
//           bundleQtyCheckSize: newQty,
//         };

//         // Adjust bundleInspectionData array
//         const currentBundles = updatedSizeData.bundleInspectionData || [];
//         if (newQty > currentBundles.length) {
//           // Add new bundles
//           for (let i = currentBundles.length; i < newQty; i++) {
//             currentBundles.push({
//               bundleNo: i + 1,
//               serialLetter: "",
//               totalPcs: 0, // Will be calculated
//               pcs: { total: 0, top: 0, middle: 0, bottom: 0 },
//               pass: { total: 0, top: 0, middle: 0, bottom: 0 },
//               reject: { total: 0, top: 0, middle: 0, bottom: 0 },
//               rejectGarment: { total: 0, top: 0, middle: 0, bottom: 0 },
//               rejectMeasurement: { total: 0, top: 0, middle: 0, bottom: 0 },
//               passrate: { total: 100, top: 100, middle: 100, bottom: 100 },
//               measurementInsepctionData: [], // Initialize as empty, parts need to be selected
//               // fabricDefects will be part of measurementInsepctionData
//             });
//           }
//         } else if (newQty < currentBundles.length) {
//           // Remove bundles
//           currentBundles.splice(newQty);
//         }
//         // Re-number bundles
//         currentBundles.forEach(
//           (bundle, index) => (bundle.bundleNo = index + 1)
//         );

//         updatedSizeData.bundleInspectionData = currentBundles;
//         setCurrentEditingSizeData(updatedSizeData);

//         // Update editableInspectionDoc
//         const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
//         const sizeIndex = docCopy.inspectionData.findIndex(
//           (item) => item.inspectedSize === selectedSizeForEdit
//         );
//         if (sizeIndex > -1) {
//           docCopy.inspectionData[sizeIndex] = updatedSizeData;
//           setEditableInspectionDoc(docCopy);
//         }
//       }
//     }
//   };

//   const handlePartSelectionChange = (bundleIndex, partName, isChecked) => {
//     if (!currentEditingSizeData) return;

//     const updatedSizeData = JSON.parse(JSON.stringify(currentEditingSizeData));
//     const bundleData = updatedSizeData.bundleInspectionData[bundleIndex];

//     if (!bundleData.measurementInsepctionData) {
//       bundleData.measurementInsepctionData = [];
//     }

//     const partInfo = panelIndexNames.find((p) => p.panelIndexName === partName);
//     if (!partInfo) return;

//     if (isChecked) {
//       // Add part if not exists
//       if (
//         !bundleData.measurementInsepctionData.some(
//           (p) => p.partName === partName
//         )
//       ) {
//         bundleData.measurementInsepctionData.push({
//           partName: partName,
//           partNo: partInfo.panelIndex,
//           partNameKhmer: partInfo.panelIndexNameKhmer,
//           measurementPointsData: [], // Will be populated by MeasurementTableModify
//           fabricDefects: [
//             // Initialize fabric defects structure
//             { location: "Top", defectData: [] },
//             { location: "Middle", defectData: [] },
//             { location: "Bottom", defectData: [] },
//           ],
//         });
//       }
//     } else {
//       // Remove part
//       bundleData.measurementInsepctionData =
//         bundleData.measurementInsepctionData.filter(
//           (p) => p.partName !== partName
//         );
//     }

//     // Recalculate Pcs for this bundle (simplified, full calculation in MeasurementTableModify)
//     const numPartsSelected = bundleData.measurementInsepctionData.length;
//     const tPcsPerPart =
//       bundleData.pcs?.top > 0 && numPartsSelected > 0
//         ? bundleData.pcs.top / numPartsSelected
//         : 5; // Placeholder
//     const mPcsPerPart =
//       bundleData.pcs?.middle > 0 && numPartsSelected > 0
//         ? bundleData.pcs.middle / numPartsSelected
//         : 5;
//     const bPcsPerPart =
//       bundleData.pcs?.bottom > 0 && numPartsSelected > 0
//         ? bundleData.pcs.bottom / numPartsSelected
//         : 5;

//     bundleData.pcs.top = numPartsSelected * tPcsPerPart;
//     bundleData.pcs.middle = numPartsSelected * mPcsPerPart;
//     bundleData.pcs.bottom = numPartsSelected * bPcsPerPart;
//     bundleData.pcs.total =
//       bundleData.pcs.top + bundleData.pcs.middle + bundleData.pcs.bottom;
//     bundleData.totalPcs = bundleData.pcs.total;

//     setCurrentEditingSizeData(updatedSizeData);
//     // Update editableInspectionDoc
//     const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
//     const sizeIndex = docCopy.inspectionData.findIndex(
//       (item) => item.inspectedSize === selectedSizeForEdit
//     );
//     if (sizeIndex > -1) {
//       docCopy.inspectionData[sizeIndex] = updatedSizeData;
//       setEditableInspectionDoc(docCopy);
//     }
//   };

//   const handleSerialLetterChange = (bundleIndex, newSerialLetter) => {
//     if (!currentEditingSizeData) return;
//     const updatedSizeData = JSON.parse(JSON.stringify(currentEditingSizeData));
//     if (updatedSizeData.bundleInspectionData[bundleIndex]) {
//       updatedSizeData.bundleInspectionData[bundleIndex].serialLetter =
//         newSerialLetter;
//       setCurrentEditingSizeData(updatedSizeData);
//       // Update editableInspectionDoc
//       const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
//       const sizeIndex = docCopy.inspectionData.findIndex(
//         (item) => item.inspectedSize === selectedSizeForEdit
//       );
//       if (sizeIndex > -1) {
//         docCopy.inspectionData[sizeIndex] = updatedSizeData;
//         setEditableInspectionDoc(docCopy);
//       }
//     }
//   };

//   const handlePcsPerLocationChange = (bundleIndex, location, newValue) => {
//     if (!currentEditingSizeData) return;
//     const updatedSizeData = JSON.parse(JSON.stringify(currentEditingSizeData));
//     const bundle = updatedSizeData.bundleInspectionData[bundleIndex];
//     if (bundle) {
//       if (!bundle.pcsPerLocation) bundle.pcsPerLocation = { t: 5, m: 5, b: 5 }; // Ensure structure
//       if (location === "T") bundle.pcsPerLocation.t = parseInt(newValue);
//       else if (location === "M") bundle.pcsPerLocation.m = parseInt(newValue);
//       else if (location === "B") bundle.pcsPerLocation.b = parseInt(newValue);

//       // This change needs to propagate to MeasurementTableModify to adjust columns
//       // And then totals need recalculation within MeasurementTableModify and rolled up.
//       setCurrentEditingSizeData(updatedSizeData);
//       const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
//       const sizeIndex = docCopy.inspectionData.findIndex(
//         (item) => item.inspectedSize === selectedSizeForEdit
//       );
//       if (sizeIndex > -1) {
//         docCopy.inspectionData[sizeIndex] = updatedSizeData;
//         setEditableInspectionDoc(docCopy);
//       }
//     }
//   };

//   const serialLetters = Array.from({ length: 26 }, (_, i) =>
//     String.fromCharCode(65 + i)
//   );
//   const toleranceOptions = [
//     { label: "-1/16, 1/16", value: { min: -0.0625, max: 0.0625 } },
//     { label: "-1/8, 1/8", value: { min: -0.125, max: 0.125 } },
//   ];

//   const handleToleranceChange = (e) => {
//     const selectedOption =
//       toleranceOptions.find(
//         (opt) =>
//           opt.value.min === tolerance.min && opt.value.max === tolerance.max
//       )?.label === e.target.value
//         ? toleranceOptions.find((opt) => opt.label === e.target.value)
//         : toleranceOptions.find((opt) => opt.label === e.target.value);
//     if (selectedOption) {
//       setTolerance(selectedOption.value);
//       if (currentEditingSizeData) {
//         const updatedSizeData = {
//           ...currentEditingSizeData,
//           tolerance: selectedOption.value,
//         };
//         setCurrentEditingSizeData(updatedSizeData);
//         // Update editableInspectionDoc
//         const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
//         const sizeIndex = docCopy.inspectionData.findIndex(
//           (item) => item.inspectedSize === selectedSizeForEdit
//         );
//         if (sizeIndex > -1) {
//           docCopy.inspectionData[sizeIndex].tolerance = selectedOption.value;
//           setEditableInspectionDoc(docCopy);
//         }
//       }
//     }
//   };

//   // Update measurement/defect data from MeasurementTableModify
//   const handleMeasurementTableUpdate = (updatedBundleInspectionDataForSize) => {
//     if (!currentEditingSizeData || !editableInspectionDoc) return;

//     const updatedSizeData = {
//       ...currentEditingSizeData,
//       bundleInspectionData: updatedBundleInspectionDataForSize,
//       // Potentially re-aggregate totalPcsSize, passSize, rejectSize for this size based on updatedBundleInspectionDataForSize
//       // This logic should be similar to the summary calculation in Cutting.jsx, but scoped to one size.
//     };

//     // Example of re-aggregating totals for the current size:
//     let totalPcsSize = 0,
//       totalPassSize = 0,
//       totalRejectSize = 0;
//     let totalRejectMeasurementSize = 0; // Add other reject types if needed

//     updatedBundleInspectionDataForSize.forEach((bundle) => {
//       totalPcsSize += bundle.totalPcs || 0;
//       totalPassSize += bundle.pass?.total || 0;
//       totalRejectSize += bundle.reject?.total || 0;
//       totalRejectMeasurementSize += bundle.rejectMeasurement?.total || 0;
//     });

//     updatedSizeData.totalPcsSize = totalPcsSize;
//     updatedSizeData.pcsSize = {
//       // Assuming detailed breakdown per location is handled in MeasurementTableModify
//       total: totalPcsSize,
//       top: updatedBundleInspectionDataForSize.reduce(
//         (sum, b) => sum + (b.pcs?.top || 0),
//         0
//       ),
//       middle: updatedBundleInspectionDataForSize.reduce(
//         (sum, b) => sum + (b.pcs?.middle || 0),
//         0
//       ),
//       bottom: updatedBundleInspectionDataForSize.reduce(
//         (sum, b) => sum + (b.pcs?.bottom || 0),
//         0
//       ),
//     };
//     updatedSizeData.passSize = {
//       total: totalPassSize,
//       top: updatedBundleInspectionDataForSize.reduce(
//         (sum, b) => sum + (b.pass?.top || 0),
//         0
//       ),
//       middle: updatedBundleInspectionDataForSize.reduce(
//         (sum, b) => sum + (b.pass?.middle || 0),
//         0
//       ),
//       bottom: updatedBundleInspectionDataForSize.reduce(
//         (sum, b) => sum + (b.pass?.bottom || 0),
//         0
//       ),
//     };
//     updatedSizeData.rejectSize = {
//       total: totalRejectSize,
//       top: updatedBundleInspectionDataForSize.reduce(
//         (sum, b) => sum + (b.reject?.top || 0),
//         0
//       ),
//       middle: updatedBundleInspectionDataForSize.reduce(
//         (sum, b) => sum + (b.reject?.middle || 0),
//         0
//       ),
//       bottom: updatedBundleInspectionDataForSize.reduce(
//         (sum, b) => sum + (b.reject?.bottom || 0),
//         0
//       ),
//     };
//     updatedSizeData.rejectMeasurementSize = {
//       total: totalRejectMeasurementSize,
//       top: updatedBundleInspectionDataForSize.reduce(
//         (sum, b) => sum + (b.rejectMeasurement?.top || 0),
//         0
//       ),
//       middle: updatedBundleInspectionDataForSize.reduce(
//         (sum, b) => sum + (b.rejectMeasurement?.middle || 0),
//         0
//       ),
//       bottom: updatedBundleInspectionDataForSize.reduce(
//         (sum, b) => sum + (b.rejectMeasurement?.bottom || 0),
//         0
//       ),
//     };
//     // ... update other reject types and passrates similarly

//     setCurrentEditingSizeData(updatedSizeData);

//     const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
//     const sizeIndex = docCopy.inspectionData.findIndex(
//       (item) => item.inspectedSize === selectedSizeForEdit
//     );
//     if (sizeIndex > -1) {
//       docCopy.inspectionData[sizeIndex] = updatedSizeData;
//       setEditableInspectionDoc(docCopy);
//     }
//   };

//   const handleSave = async () => {
//     if (!editableInspectionDoc || !currentEditingSizeData) {
//       Swal.fire({
//         icon: "warning",
//         title: t("cutting.noDataToSave"),
//         text: t("cutting.loadAndEditDataFirst"),
//       });
//       return;
//     }
//     if (bundleQtyForSizeError) {
//       Swal.fire({
//         icon: "error",
//         title: t("cutting.validationError"),
//         text: bundleQtyForSizeError,
//       });
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const cuttingTypeString =
//         cuttingByType.auto && cuttingByType.manual
//           ? "Auto & Manual"
//           : cuttingByType.auto
//           ? "Auto"
//           : cuttingByType.manual
//           ? "Manual"
//           : "None";

//       const payload = {
//         moNo: selectedMoNo,
//         tableNo: selectedTableNo,
//         updatedFields: {
//           totalBundleQty: parseInt(totalBundleQtyInput),
//           bundleQtyCheck: parseInt(bundleQtyCheckDisplay),
//           totalInspectionQty: parseInt(totalInspectionQtyDisplay),
//           cuttingtype: cuttingTypeString,
//           // mackerRatio might need update if editable, but not specified
//         },
//         updatedInspectionDataItem: currentEditingSizeData, // This contains all changes for the selected size
//       };

//       // Add created_at and updated_at to the specific inspectionData item being modified
//       if (payload.updatedInspectionDataItem) {
//         payload.updatedInspectionDataItem.updated_at = new Date();
//         if (!payload.updatedInspectionDataItem.created_at) {
//           // Should exist, but as a safeguard
//           payload.updatedInspectionDataItem.created_at = new Date();
//         }
//       }

//       await axios.put(`${API_BASE_URL}/api/cutting-inspection-update`, payload);
//       Swal.fire({
//         icon: "success",
//         title: t("cutting.success"),
//         text: t("cutting.dataUpdatedSuccessfully"),
//       });

//       // Refresh data to see changes or reset
//       const response = await axios.get(
//         `${API_BASE_URL}/api/cutting-inspection-details-for-modify`,
//         {
//           params: { moNo: selectedMoNo, tableNo: selectedTableNo },
//         }
//       );
//       setInspectionDoc(response.data);
//       setEditableInspectionDoc(JSON.parse(JSON.stringify(response.data)));
//       // Reset selected size to trigger re-evaluation of currentEditingSizeData
//       const currentSelSize = selectedSizeForEdit;
//       setSelectedSizeForEdit("");
//       setTimeout(() => setSelectedSizeForEdit(currentSelSize), 0);
//     } catch (error) {
//       console.error("Error updating inspection data:", error);
//       Swal.fire({
//         icon: "error",
//         title: t("cutting.error"),
//         text: error.response?.data?.message || t("cutting.failedToUpdateData"),
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (authLoading) return <div className="p-4 text-center">{t("loading")}</div>;

//   return (
//     <div className="p-4 bg-gray-100 min-h-screen">
//       <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
//         <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
//           {t("cutting.modifyCuttingInspection")}
//         </h1>

//         {/* Search Fields */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//           <div ref={moNoDropdownRef}>
//             <label className="block text-sm font-medium text-gray-700">
//               {t("cutting.moNo")}
//             </label>
//             <div className="relative">
//               <input
//                 type="text"
//                 value={moNoSearch}
//                 onChange={(e) => {
//                   setMoNoSearch(e.target.value);
//                   setSelectedMoNo("");
//                   setSelectedTableNo("");
//                   setTableNoSearch("");
//                 }}
//                 onFocus={() =>
//                   moNoOptions.length > 0 && setShowMoNoDropdown(true)
//                 }
//                 placeholder={t("cutting.search_mono")}
//                 className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//               />
//               {showMoNoDropdown && moNoOptions.length > 0 && (
//                 <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                   {moNoOptions.map((option, index) => (
//                     <li
//                       key={index}
//                       onClick={() => {
//                         setSelectedMoNo(option);
//                         setMoNoSearch(option);
//                         setShowMoNoDropdown(false);
//                       }}
//                       className="p-2 hover:bg-blue-100 cursor-pointer"
//                     >
//                       {option}
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>
//           </div>
//           <div ref={tableNoDropdownRef}>
//             <label className="block text-sm font-medium text-gray-700">
//               {t("cutting.tableNo")}
//             </label>
//             <div className="relative">
//               <input
//                 type="text"
//                 value={tableNoSearch}
//                 onChange={(e) => {
//                   setTableNoSearch(e.target.value);
//                   setSelectedTableNo("");
//                 }}
//                 onFocus={() =>
//                   tableNoOptions.length > 0 && setShowTableNoDropdown(true)
//                 }
//                 placeholder={t("cutting.search_table_no")}
//                 className={`mt-1 w-full p-2 border border-gray-300 rounded-lg ${
//                   !selectedMoNo ? "bg-gray-200 cursor-not-allowed" : ""
//                 }`}
//                 disabled={!selectedMoNo}
//               />
//               {showTableNoDropdown && tableNoOptions.length > 0 && (
//                 <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                   {tableNoOptions
//                     .filter((opt) =>
//                       opt.toLowerCase().includes(tableNoSearch.toLowerCase())
//                     )
//                     .map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedTableNo(option);
//                           setTableNoSearch(option);
//                           setShowTableNoDropdown(false);
//                         }}
//                         className="p-2 hover:bg-blue-100 cursor-pointer"
//                       >
//                         {option}
//                       </li>
//                     ))}
//                 </ul>
//               )}
//             </div>
//           </div>
//         </div>

//         {isLoading && (
//           <div className="text-center p-4">{t("loadingData")}...</div>
//         )}

//         {editableInspectionDoc && (
//           <>
//             {/* Marker Ratio */}
//             <div className="mb-4">
//               <h2 className="text-lg font-semibold text-gray-700 mb-2">
//                 {t("cutting.markerRatio")}
//               </h2>
//               <div className="overflow-x-auto">
//                 <table className="w-full border-collapse border border-gray-300">
//                   <thead>
//                     <tr className="bg-gray-100">
//                       {markerRatios
//                         .filter((mr) => mr.ratio > 0)
//                         .map((mr, index) => (
//                           <th
//                             key={index}
//                             className="border border-gray-300 p-2 text-sm"
//                           >
//                             {mr.markerSize}
//                           </th>
//                         ))}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     <tr>
//                       {markerRatios
//                         .filter((mr) => mr.ratio > 0)
//                         .map((mr, index) => (
//                           <td
//                             key={index}
//                             className="border border-gray-300 p-2 text-sm text-center"
//                           >
//                             {mr.ratio}
//                           </td>
//                         ))}
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             {/* Top Level Editable Fields */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 border p-4 rounded-md">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">
//                   {t("cutting.totalBundleQty")}
//                 </label>
//                 <div className="relative">
//                   <input
//                     type={isTablet ? "number" : "text"}
//                     inputMode="numeric"
//                     value={totalBundleQtyInput}
//                     onChange={(e) => setTotalBundleQtyInput(e.target.value)}
//                     className="mt-1 w-full p-2 border border-gray-300 rounded-lg pr-10"
//                   />
//                   {!isTablet && (
//                     <button
//                       onClick={() => setShowNumberPadTotalBundle(true)}
//                       className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
//                     >
//                       <Keyboard className="w-5 h-5" />
//                     </button>
//                   )}
//                 </div>
//                 {showNumberPadTotalBundle && (
//                   <NumberPad
//                     onClose={() => setShowNumberPadTotalBundle(false)}
//                     onInput={(val) => setTotalBundleQtyInput(val)}
//                     initialValue={totalBundleQtyInput}
//                   />
//                 )}
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">
//                   {t("cutting.bundleQtyCheck")}
//                 </label>
//                 <input
//                   type="text"
//                   value={bundleQtyCheckDisplay}
//                   readOnly
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">
//                   {t("cutting.totalInspectionQty")}
//                 </label>
//                 <input
//                   type={isTablet ? "number" : "text"}
//                   inputMode="numeric"
//                   value={totalInspectionQtyDisplay}
//                   onChange={(e) => {
//                     setTotalInspectionQtyDisplay(e.target.value);
//                     setIsTotalInspectionQtyManual(true);
//                   }}
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">
//                   {t("cutting.cuttingBy")}
//                 </label>
//                 <div className="flex items-center space-x-4 mt-2">
//                   <label className="flex items-center">
//                     <input
//                       type="checkbox"
//                       checked={cuttingByType.auto}
//                       onChange={(e) =>
//                         setCuttingByType({
//                           ...cuttingByType,
//                           auto: e.target.checked,
//                         })
//                       }
//                       className="h-4 w-4 text-blue-600 border-gray-300 rounded"
//                     />
//                     <span className="ml-2 text-sm text-gray-700">
//                       {t("cutting.auto")}
//                     </span>
//                   </label>
//                   <label className="flex items-center">
//                     <input
//                       type="checkbox"
//                       checked={cuttingByType.manual}
//                       onChange={(e) =>
//                         setCuttingByType({
//                           ...cuttingByType,
//                           manual: e.target.checked,
//                         })
//                       }
//                       className="h-4 w-4 text-blue-600 border-gray-300 rounded"
//                     />
//                     <span className="ml-2 text-sm text-gray-700">
//                       {t("cutting.manual")}
//                     </span>
//                   </label>
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">
//                   {t("cutting.garmentType")}
//                 </label>
//                 <input
//                   type="text"
//                   value={garmentTypeDisplay}
//                   readOnly
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">
//                   {t("cutting.tolerance")}
//                 </label>
//                 <select
//                   value={
//                     toleranceOptions.find(
//                       (opt) =>
//                         opt.value.min === tolerance.min &&
//                         opt.value.max === tolerance.max
//                     )?.label
//                   }
//                   onChange={handleToleranceChange}
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 >
//                   {toleranceOptions.map((option, index) => (
//                     <option key={index} value={option.label}>
//                       {option.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             {/* Size Selection for Editing */}
//             <div className="mb-6">
//               <label className="block text-sm font-medium text-gray-700">
//                 {t("cutting.selectSizeToEdit")}
//               </label>
//               <select
//                 value={selectedSizeForEdit}
//                 onChange={(e) => setSelectedSizeForEdit(e.target.value)}
//                 className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//               >
//                 <option value="">{t("cutting.pleaseSelectASize")}</option>
//                 {(editableInspectionDoc.inspectionData || []).map((item) => (
//                   <option key={item.inspectedSize} value={item.inspectedSize}>
//                     {item.inspectedSize}
//                   </option>
//                 ))}
//                 {/* If you want to allow selection from markerRatios as well, merge logic here.
//                         For now, only sizes already in inspectionData are editable via this dropdown.
//                     */}
//               </select>
//             </div>

//             {currentEditingSizeData && (
//               <div className="border p-4 rounded-md mt-4">
//                 <h3 className="text-xl font-semibold text-gray-700 mb-4">
//                   {t("editingInspectionForSize", { size: selectedSizeForEdit })}
//                 </h3>
//                 {/* Bundle Qty for this Size */}
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.bundleQtyForThisSize")} (
//                     {t("cutting.bundleQtyCheckSize")})
//                   </label>
//                   <input
//                     type="number"
//                     value={bundleQtyForSizeInput}
//                     onChange={(e) =>
//                       handleBundleQtyForSizeChange(e.target.value)
//                     }
//                     className={`mt-1 w-full md:w-1/3 p-2 border rounded-lg ${
//                       bundleQtyForSizeError
//                         ? "border-red-500"
//                         : "border-gray-300"
//                     }`}
//                     min="0"
//                   />
//                   {bundleQtyForSizeError && (
//                     <p className="text-red-500 text-sm mt-1">
//                       {bundleQtyForSizeError}
//                     </p>
//                   )}
//                 </div>

//                 {/* Bundle Details Table */}
//                 <div className="mb-6">
//                   <h4 className="text-md font-semibold text-gray-700 mb-2">
//                     {t("cutting.bundleDetails")}
//                   </h4>
//                   <div className="overflow-x-auto">
//                     <table className="w-full border-collapse border border-gray-300">
//                       <thead>
//                         <tr className="bg-gray-100">
//                           <th className="border p-2 text-sm">
//                             {t("cutting.bundleNo")}
//                           </th>
//                           <th className="border p-2 text-sm">
//                             {t("cutting.serialLetter")}
//                           </th>
//                           <th className="border p-2 text-sm">
//                             {t("cutting.parts")}
//                           </th>
//                           <th className="border p-2 text-sm">
//                             {t("cutting.pcs")} (T/M/B)
//                           </th>
//                           <th className="border p-2 text-sm">
//                             {t("cutting.totalPcs")}
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {(
//                           currentEditingSizeData.bundleInspectionData || []
//                         ).map((bundle, bundleIdx) => {
//                           const isNewBundle = !inspectionDoc.inspectionData // Check if original doc had this bundle
//                             .find(
//                               (s) => s.inspectedSize === selectedSizeForEdit
//                             )?.bundleInspectionData[bundleIdx];

//                           return (
//                             <tr key={bundle.bundleNo}>
//                               <td className="border p-2 text-sm text-center">
//                                 {bundle.bundleNo}
//                               </td>
//                               <td className="border p-2 text-sm">
//                                 <select
//                                   value={bundle.serialLetter}
//                                   onChange={(e) =>
//                                     handleSerialLetterChange(
//                                       bundleIdx,
//                                       e.target.value
//                                     )
//                                   }
//                                   className="w-full p-1 border rounded"
//                                 >
//                                   <option value="">{t("select")}</option>
//                                   {serialLetters.map((sl) => (
//                                     <option key={sl} value={sl}>
//                                       {sl}
//                                     </option>
//                                   ))}
//                                 </select>
//                               </td>
//                               <td className="border p-2 text-sm">
//                                 {isNewBundle ||
//                                 !(
//                                   bundle.measurementInsepctionData &&
//                                   bundle.measurementInsepctionData.length > 0
//                                 ) ? (
//                                   <div className="flex flex-wrap gap-2">
//                                     {panelIndexNames.map((pName) => (
//                                       <label
//                                         key={pName.panelIndexName}
//                                         className="flex items-center space-x-1"
//                                       >
//                                         <input
//                                           type="checkbox"
//                                           checked={bundle.measurementInsepctionData?.some(
//                                             (p) =>
//                                               p.partName ===
//                                               pName.panelIndexName
//                                           )}
//                                           onChange={(e) =>
//                                             handlePartSelectionChange(
//                                               bundleIdx,
//                                               pName.panelIndexName,
//                                               e.target.checked
//                                             )
//                                           }
//                                         />
//                                         <span>
//                                           {i18n.language === "km"
//                                             ? pName.panelIndexNameKhmer
//                                             : pName.panelIndexName}
//                                         </span>
//                                       </label>
//                                     ))}
//                                   </div>
//                                 ) : (
//                                   bundle.measurementInsepctionData
//                                     .map((p) =>
//                                       i18n.language === "km"
//                                         ? p.partNameKhmer
//                                         : p.partName
//                                     )
//                                     .join(", ")
//                                 )}
//                               </td>
//                               <td className="border p-2 text-sm">
//                                 <div className="flex items-center gap-1">
//                                   T:{" "}
//                                   <input
//                                     type="number"
//                                     min="1"
//                                     max="5"
//                                     value={
//                                       bundle.pcsPerLocation?.t ||
//                                       bundle.pcs?.top /
//                                         (bundle.measurementInsepctionData
//                                           ?.length || 1) ||
//                                       5
//                                     }
//                                     onChange={(e) =>
//                                       handlePcsPerLocationChange(
//                                         bundleIdx,
//                                         "T",
//                                         e.target.value
//                                       )
//                                     }
//                                     className="w-12 p-1 border rounded"
//                                   />
//                                   M:{" "}
//                                   <input
//                                     type="number"
//                                     min="1"
//                                     max="5"
//                                     value={
//                                       bundle.pcsPerLocation?.m ||
//                                       bundle.pcs?.middle /
//                                         (bundle.measurementInsepctionData
//                                           ?.length || 1) ||
//                                       5
//                                     }
//                                     onChange={(e) =>
//                                       handlePcsPerLocationChange(
//                                         bundleIdx,
//                                         "M",
//                                         e.target.value
//                                       )
//                                     }
//                                     className="w-12 p-1 border rounded"
//                                   />
//                                   B:{" "}
//                                   <input
//                                     type="number"
//                                     min="1"
//                                     max="5"
//                                     value={
//                                       bundle.pcsPerLocation?.b ||
//                                       bundle.pcs?.bottom /
//                                         (bundle.measurementInsepctionData
//                                           ?.length || 1) ||
//                                       5
//                                     }
//                                     onChange={(e) =>
//                                       handlePcsPerLocationChange(
//                                         bundleIdx,
//                                         "B",
//                                         e.target.value
//                                       )
//                                     }
//                                     className="w-12 p-1 border rounded"
//                                   />
//                                 </div>
//                               </td>
//                               <td className="border p-2 text-sm text-center">
//                                 {bundle.totalPcs || 0}
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>

//                 {/* Measurement & Defect Details Table */}
//                 <MeasurementTableModify
//                   key={`${selectedSizeForEdit}-${
//                     (currentEditingSizeData.bundleInspectionData || []).length
//                   }`} // Re-mount when size OR bundle count changes
//                   initialBundleInspectionData={
//                     currentEditingSizeData.bundleInspectionData || []
//                   }
//                   measurementPoints={measurementPoints}
//                   panelIndexNames={panelIndexNames}
//                   fabricDefectsList={fabricDefectsList}
//                   tolerance={tolerance}
//                   onUpdate={handleMeasurementTableUpdate} // This will give the full updated bundleInspectionData for the current size
//                   garmentType={garmentTypeDisplay}
//                   moNo={selectedMoNo}
//                   activeMeasurementTab={activeMeasurementTab}
//                   setActiveMeasurementTab={setActiveMeasurementTab}
//                   // Pass pcsPerLocation for each bundle to MeasurementTableModify
//                   pcsPerLocationInitial={(
//                     currentEditingSizeData.bundleInspectionData || []
//                   ).map((b) => b.pcsPerLocation || { t: 5, m: 5, b: 5 })}
//                 />
//               </div>
//             )}

//             {/* Save Button */}
//             {currentEditingSizeData && (
//               <div className="mt-8 flex justify-center">
//                 <button
//                   onClick={handleSave}
//                   disabled={isLoading}
//                   className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center"
//                 >
//                   <Save size={18} className="mr-2" />{" "}
//                   {isLoading ? t("saving") : t("saveChanges")}
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CuttingInspectionModify;

import axios from "axios";
import { Keyboard, Save } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext"; // Assuming useAuth is here
import NumberPad from "../../forms/NumberPad"; // Assuming NumberPad is here
import MeasurementTableModify from "./MeasurementTableModify"; // A modified/adapted version

const CuttingInspectionModify = () => {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  // Search and Selection
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [selectedMoNo, setSelectedMoNo] = useState("");
  const moNoDropdownRef = useRef(null);

  const [tableNoSearch, setTableNoSearch] = useState("");
  const [tableNoOptions, setTableNoOptions] = useState([]);
  const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
  const [selectedTableNo, setSelectedTableNo] = useState("");
  const tableNoDropdownRef = useRef(null);

  // Fetched Data
  const [inspectionDoc, setInspectionDoc] = useState(null); // Original fetched document
  const [editableInspectionDoc, setEditableInspectionDoc] = useState(null); // Deep copy for editing
  const [markerRatios, setMarkerRatios] = useState([]);
  const [uniqueSizesForSelection, setUniqueSizesForSelection] = useState([]);

  // Top Level Fields (editable or recalculated)
  const [totalBundleQtyInput, setTotalBundleQtyInput] = useState("");
  const [bundleQtyCheckDisplay, setBundleQtyCheckDisplay] = useState("");
  const [totalInspectionQtyDisplay, setTotalInspectionQtyDisplay] = useState(0);
  const [isTotalInspectionQtyManual, setIsTotalInspectionQtyManual] =
    useState(false);
  const [cuttingByType, setCuttingByType] = useState({
    auto: true,
    manual: false
  });
  const [garmentTypeDisplay, setGarmentTypeDisplay] = useState("");

  // Size Specific Editing
  const [selectedSizeForEdit, setSelectedSizeForEdit] = useState("");
  const [currentEditingSizeData, setCurrentEditingSizeData] = useState(null); // Points to item in editableInspectionDoc.inspectionData
  const [bundleQtyForSizeInput, setBundleQtyForSizeInput] = useState(""); // This is bundleQtyCheckSize for the selected size
  const [
    originalBundleQtyForSelectedSize,
    setOriginalBundleQtyForSelectedSize
  ] = useState(null); // For non-decreasing rule
  const [bundleQtyForSizeError, setBundleQtyForSizeError] = useState("");

  // For Bundle Details, Measurement, Defects (data will be part of currentEditingSizeData)
  // These states are for controlling UI elements like numpad/defectbox
  const [showNumPad, setShowNumPad] = useState(false);
  const [currentMeasurementCell, setCurrentMeasurementCell] = useState(null); // { bundleIndex, partIndex, mpIndex, locIndex, valueIndex }
  const [showDefectBox, setShowDefectBox] = useState(false);
  const [currentDefectCell, setCurrentDefectCell] = useState(null); // { bundleIndex, partIndex, locIndex, pcsNameIndex }

  // Supporting data (like in Cutting.jsx)
  const [panelIndexNames, setPanelIndexNames] = useState([]);
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [fabricDefectsList, setFabricDefectsList] = useState([]); // List of available fabric defects
  const [tolerance, setTolerance] = useState({ min: -0.125, max: 0.125 }); // Default, might load from doc

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeMeasurementTab, setActiveMeasurementTab] = useState("Top"); // For MeasurementTableModify
  const [showNumberPadTotalBundle, setShowNumberPadTotalBundle] =
    useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsTablet(
      /ipad|android|tablet|kindle|playbook|silk/.test(userAgent) ||
        (userAgent.includes("mobile") && !userAgent.includes("phone"))
    );
  }, []);

  // Click outside handlers for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      )
        setShowMoNoDropdown(false);
      if (
        tableNoDropdownRef.current &&
        !tableNoDropdownRef.current.contains(event.target)
      )
        setShowTableNoDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch MO Numbers
  useEffect(() => {
    if (moNoSearch.trim() === "") {
      setMoNoOptions([]);
      setShowMoNoDropdown(false);
      return;
    }
    const fetchMo = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/mo-numbers`,
          { params: { search: moNoSearch } }
        );
        setMoNoOptions(response.data);
        setShowMoNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Error fetching MO numbers for modify:", error);
      }
    };
    const debounceFetch = setTimeout(fetchMo, 300);
    return () => clearTimeout(debounceFetch);
  }, [moNoSearch]);

  // Fetch Table Numbers
  useEffect(() => {
    if (!selectedMoNo) {
      setTableNoOptions([]);
      setShowTableNoDropdown(false);
      return;
    }
    const fetchTables = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/table-numbers`,
          { params: { moNo: selectedMoNo, search: tableNoSearch } }
        );
        setTableNoOptions(response.data);
        setShowTableNoDropdown(
          response.data.length > 0 || tableNoSearch.length > 0
        );
      } catch (error) {
        console.error("Error fetching Table numbers for modify:", error);
      }
    };
    const debounceFetch = setTimeout(fetchTables, 300);
    return () => clearTimeout(debounceFetch);
  }, [selectedMoNo, tableNoSearch]);

  // Fetch Full Inspection Document
  useEffect(() => {
    if (!selectedMoNo || !selectedTableNo) {
      setInspectionDoc(null);
      setEditableInspectionDoc(null);
      resetSubsequentStates();
      return;
    }
    const fetchInspectionDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspection-details-for-modify`,
          {
            params: { moNo: selectedMoNo, tableNo: selectedTableNo }
          }
        );
        const doc = response.data;
        setInspectionDoc(doc);
        setEditableInspectionDoc(JSON.parse(JSON.stringify(doc))); // Deep copy

        // Populate top-level fields
        setTotalBundleQtyInput(doc.totalBundleQty.toString());
        setBundleQtyCheckDisplay(doc.bundleQtyCheck.toString());
        setTotalInspectionQtyDisplay(doc.totalInspectionQty);
        setCuttingByType(
          doc.cuttingtype === "Auto"
            ? { auto: true, manual: false }
            : doc.cuttingtype === "Manual"
            ? { auto: false, manual: true }
            : doc.cuttingtype === "Auto & Manual"
            ? { auto: true, manual: true }
            : { auto: false, manual: false } // Default or handle other cases
        );
        setGarmentTypeDisplay(doc.garmentType);
        setMarkerRatios(doc.mackerRatio || []);
        const uniqueSizes = [
          ...new Set(
            (doc.mackerRatio || [])
              .filter((mr) => mr.ratio > 0)
              .map((mr) => mr.markerSize)
          )
        ];
        setUniqueSizesForSelection(uniqueSizes);

        // If there's inspectionData, potentially load tolerance from the first item
        if (
          doc.inspectionData &&
          doc.inspectionData.length > 0 &&
          doc.inspectionData[0].tolerance
        ) {
          setTolerance(doc.inspectionData[0].tolerance);
        }
      } catch (error) {
        console.error("Error fetching inspection details:", error);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchInspectionDetails")
        });
        setInspectionDoc(null);
        setEditableInspectionDoc(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInspectionDetails();
  }, [selectedMoNo, selectedTableNo, t]);

  const resetSubsequentStates = () => {
    setMarkerRatios([]);
    setUniqueSizesForSelection([]);
    setTotalBundleQtyInput("");
    setBundleQtyCheckDisplay("");
    setTotalInspectionQtyDisplay(0);
    setCuttingByType({ auto: true, manual: false });
    setGarmentTypeDisplay("");
    setSelectedSizeForEdit("");
    setCurrentEditingSizeData(null);
    setBundleQtyForSizeInput("");
    setOriginalBundleQtyForSelectedSize(null);
    setBundleQtyForSizeError("");
    setPanelIndexNames([]);
    setMeasurementPoints([]);
  };

  // Recalculate BundleQtyCheck and TotalInspectionQty
  useEffect(() => {
    if (totalBundleQtyInput && editableInspectionDoc?.cuttingTableDetails) {
      const layersToUse =
        editableInspectionDoc.cuttingTableDetails.actualLayers ||
        editableInspectionDoc.cuttingTableDetails.planLayers ||
        0;
      const multiplication = parseInt(totalBundleQtyInput) * layersToUse;
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
      else calculatedBundleQtyCheck = ""; // Or some default/error handling
      setBundleQtyCheckDisplay(calculatedBundleQtyCheck.toString());
      if (!isTotalInspectionQtyManual && calculatedBundleQtyCheck) {
        setTotalInspectionQtyDisplay(calculatedBundleQtyCheck * 15);
      } else if (!isTotalInspectionQtyManual && !calculatedBundleQtyCheck) {
        setTotalInspectionQtyDisplay(0);
      }
    } else {
      setBundleQtyCheckDisplay("");
      if (!isTotalInspectionQtyManual) setTotalInspectionQtyDisplay(0);
    }
  }, [totalBundleQtyInput, editableInspectionDoc, isTotalInspectionQtyManual]);

  // Effect for when selectedSizeForEdit changes
  useEffect(() => {
    if (
      selectedSizeForEdit &&
      editableInspectionDoc &&
      editableInspectionDoc.inspectionData
    ) {
      const sizeData = editableInspectionDoc.inspectionData.find(
        (item) => item.inspectedSize === selectedSizeForEdit
      );
      if (sizeData) {
        setCurrentEditingSizeData(sizeData);
        setBundleQtyForSizeInput(sizeData.bundleQtyCheckSize.toString());
        setOriginalBundleQtyForSelectedSize(sizeData.bundleQtyCheckSize); // Store original value
        if (sizeData.tolerance) setTolerance(sizeData.tolerance);
      } else {
        setCurrentEditingSizeData(null);
        setBundleQtyForSizeInput("");
        setOriginalBundleQtyForSelectedSize(null);
        Swal.fire({
          icon: "warning",
          title: "Size Not Found",
          text: `Inspection data for size ${selectedSizeForEdit} not found.`
        });
      }
    } else {
      setCurrentEditingSizeData(null);
      setBundleQtyForSizeInput("");
      setOriginalBundleQtyForSelectedSize(null);
    }
    setBundleQtyForSizeError("");
  }, [selectedSizeForEdit, editableInspectionDoc]);

  // Fetch PanelIndexNames and MeasurementPoints when MO and GarmentType are available
  useEffect(() => {
    if (selectedMoNo && garmentTypeDisplay) {
      const fetchSupportingData = async () => {
        try {
          // Fetch Panel Index Names
          const panelNamesRes = await axios.get(
            `${API_BASE_URL}/api/cutting-measurement-panel-index-names-by-mo`,
            {
              params: { moNo: selectedMoNo, panel: garmentTypeDisplay }
            }
          );
          setPanelIndexNames(panelNamesRes.data);

          // Fetch Measurement Points
          const mpRes = await axios.get(
            `${API_BASE_URL}/api/cutting-measurement-points`,
            {
              params: { moNo: selectedMoNo, panel: garmentTypeDisplay }
            }
          );
          const commonMpRes = await axios.get(
            `${API_BASE_URL}/api/cutting-measurement-points`,
            {
              params: { moNo: "Common", panel: garmentTypeDisplay }
            }
          );
          const combinedPoints = [...mpRes.data];
          commonMpRes.data.forEach((commonPoint) => {
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
          console.error(
            "Error fetching supporting data (panels/measurement points):",
            error
          );
          Swal.fire({
            icon: "error",
            title: t("cutting.error"),
            text: t("cutting.failedToFetchSupportingData")
          });
        }
      };
      fetchSupportingData();
    }
  }, [selectedMoNo, garmentTypeDisplay, t]);

  // Fetch Fabric Defects List
  useEffect(() => {
    const fetchFabricDefects = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-fabric-defects`
        );
        setFabricDefectsList(response.data);
      } catch (error) {
        console.error("Error fetching fabric defects:", error);
      }
    };
    fetchFabricDefects();
  }, []);

  // Handle Bundle Qty for Size Change and Validation
  const handleBundleQtyForSizeChange = (newQtyStr) => {
    const newQty = parseInt(newQtyStr);
    if (isNaN(newQty) || newQty < 0) {
      setBundleQtyForSizeError(t("cutting.invalidBundleQtyValue"));
      setBundleQtyForSizeInput(newQtyStr);
      return;
    }

    if (
      originalBundleQtyForSelectedSize !== null &&
      newQty < originalBundleQtyForSelectedSize
    ) {
      setBundleQtyForSizeError(
        t("cutting.bundleQtyCannotBeDecreased", {
          original: originalBundleQtyForSelectedSize
        })
      );
      setBundleQtyForSizeInput(newQtyStr);
      return;
    }
    if (!editableInspectionDoc || !bundleQtyCheckDisplay) {
      setBundleQtyForSizeInput(newQtyStr);
      return;
    }

    const mainBundleQtyCheck = parseInt(bundleQtyCheckDisplay);
    const sumOtherBundleQtyCheckSize = editableInspectionDoc.inspectionData
      .filter((d) => d.inspectedSize !== selectedSizeForEdit)
      .reduce((sum, d) => sum + d.bundleQtyCheckSize, 0);

    if (newQty > mainBundleQtyCheck - sumOtherBundleQtyCheckSize) {
      setBundleQtyForSizeError(
        t("cutting.bundleQtyExceedsLimit", {
          limit: mainBundleQtyCheck - sumOtherBundleQtyCheckSize
        })
      );
      setBundleQtyForSizeInput(newQtyStr);
    } else {
      setBundleQtyForSizeError("");
      setBundleQtyForSizeInput(newQtyStr);

      if (currentEditingSizeData) {
        const updatedSizeData = {
          ...currentEditingSizeData,
          bundleQtyCheckSize: newQty
        };

        const currentBundles = updatedSizeData.bundleInspectionData || [];
        if (newQty > currentBundles.length) {
          for (let i = currentBundles.length; i < newQty; i++) {
            currentBundles.push({
              bundleNo: i + 1,
              serialLetter: "",
              totalPcs: 0,
              pcs: { total: 0, top: 0, middle: 0, bottom: 0 },
              pass: { total: 0, top: 0, middle: 0, bottom: 0 },
              reject: { total: 0, top: 0, middle: 0, bottom: 0 },
              rejectGarment: { total: 0, top: 0, middle: 0, bottom: 0 },
              rejectMeasurement: { total: 0, top: 0, middle: 0, bottom: 0 },
              passrate: { total: 100, top: 100, middle: 100, bottom: 100 },
              measurementInsepctionData: [],
              pcsPerLocation: { t: 5, m: 5, b: 5 } // Default pcs per location for new bundles
            });
          }
        } else if (newQty < currentBundles.length) {
          currentBundles.splice(newQty);
        }
        currentBundles.forEach(
          (bundle, index) => (bundle.bundleNo = index + 1)
        );

        updatedSizeData.bundleInspectionData = currentBundles;
        setCurrentEditingSizeData(updatedSizeData);

        const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
        const sizeIndex = docCopy.inspectionData.findIndex(
          (item) => item.inspectedSize === selectedSizeForEdit
        );
        if (sizeIndex > -1) {
          docCopy.inspectionData[sizeIndex] = updatedSizeData;
          setEditableInspectionDoc(docCopy);
        }
      }
    }
  };

  const handlePartSelectionChange = (bundleIndex, partName, isChecked) => {
    if (!currentEditingSizeData) return;

    const updatedSizeData = JSON.parse(JSON.stringify(currentEditingSizeData));
    const bundleData = updatedSizeData.bundleInspectionData[bundleIndex];

    if (!bundleData.measurementInsepctionData) {
      bundleData.measurementInsepctionData = [];
    }

    const partInfo = panelIndexNames.find((p) => p.panelIndexName === partName);
    if (!partInfo) return;

    if (isChecked) {
      if (
        !bundleData.measurementInsepctionData.some(
          (p) => p.partName === partName
        )
      ) {
        bundleData.measurementInsepctionData.push({
          partName: partName,
          partNo: partInfo.panelIndex,
          partNameKhmer: partInfo.panelIndexNameKhmer,
          measurementPointsData: [],
          fabricDefects: [
            { location: "Top", defectData: [] },
            { location: "Middle", defectData: [] },
            { location: "Bottom", defectData: [] }
          ]
        });
      }
    } else {
      bundleData.measurementInsepctionData =
        bundleData.measurementInsepctionData.filter(
          (p) => p.partName !== partName
        );
    }

    const numPartsSelectedCurrentBundle =
      bundleData.measurementInsepctionData.length;
    // Use pcsPerLocation from bundle if it exists, otherwise default
    const tValueForBundle = bundleData.pcsPerLocation?.t || 5;
    const mValueForBundle = bundleData.pcsPerLocation?.m || 5;
    const bValueForBundle = bundleData.pcsPerLocation?.b || 5;

    bundleData.pcs.top = numPartsSelectedCurrentBundle * tValueForBundle;
    bundleData.pcs.middle = numPartsSelectedCurrentBundle * mValueForBundle;
    bundleData.pcs.bottom = numPartsSelectedCurrentBundle * bValueForBundle;
    bundleData.pcs.total =
      bundleData.pcs.top + bundleData.pcs.middle + bundleData.pcs.bottom;
    bundleData.totalPcs = bundleData.pcs.total;

    setCurrentEditingSizeData(updatedSizeData);
    const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
    const sizeIndex = docCopy.inspectionData.findIndex(
      (item) => item.inspectedSize === selectedSizeForEdit
    );
    if (sizeIndex > -1) {
      docCopy.inspectionData[sizeIndex] = updatedSizeData;
      setEditableInspectionDoc(docCopy);
    }
  };

  const handleSerialLetterChange = (bundleIndex, newSerialLetter) => {
    if (!currentEditingSizeData) return;
    const updatedSizeData = JSON.parse(JSON.stringify(currentEditingSizeData));
    if (updatedSizeData.bundleInspectionData[bundleIndex]) {
      updatedSizeData.bundleInspectionData[bundleIndex].serialLetter =
        newSerialLetter;
      setCurrentEditingSizeData(updatedSizeData);
      const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
      const sizeIndex = docCopy.inspectionData.findIndex(
        (item) => item.inspectedSize === selectedSizeForEdit
      );
      if (sizeIndex > -1) {
        docCopy.inspectionData[sizeIndex] = updatedSizeData;
        setEditableInspectionDoc(docCopy);
      }
    }
  };

  const handlePcsPerLocationChange = (bundleIndex, location, newValueStr) => {
    if (!currentEditingSizeData) return;
    const newValue = parseInt(newValueStr);
    if (isNaN(newValue) || newValue < 1 || newValue > 5) return; // Basic validation

    const updatedSizeData = JSON.parse(JSON.stringify(currentEditingSizeData));
    const bundle = updatedSizeData.bundleInspectionData[bundleIndex];
    if (bundle) {
      if (!bundle.pcsPerLocation) bundle.pcsPerLocation = { t: 5, m: 5, b: 5 };
      if (location === "T") bundle.pcsPerLocation.t = newValue;
      else if (location === "M") bundle.pcsPerLocation.m = newValue;
      else if (location === "B") bundle.pcsPerLocation.b = newValue;

      // Recalculate totalPcs for this bundle
      const numPartsSelected = bundle.measurementInsepctionData?.length || 0;
      bundle.pcs.top = numPartsSelected * bundle.pcsPerLocation.t;
      bundle.pcs.middle = numPartsSelected * bundle.pcsPerLocation.m;
      bundle.pcs.bottom = numPartsSelected * bundle.pcsPerLocation.b;
      bundle.pcs.total = bundle.pcs.top + bundle.pcs.middle + bundle.pcs.bottom;
      bundle.totalPcs = bundle.pcs.total;

      setCurrentEditingSizeData(updatedSizeData);
      const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
      const sizeIndex = docCopy.inspectionData.findIndex(
        (item) => item.inspectedSize === selectedSizeForEdit
      );
      if (sizeIndex > -1) {
        docCopy.inspectionData[sizeIndex] = updatedSizeData;
        setEditableInspectionDoc(docCopy);
      }
    }
  };

  const serialLetters = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  );
  const toleranceOptions = [
    { label: "-1/16, 1/16", value: { min: -0.0625, max: 0.0625 } },
    { label: "-1/8, 1/8", value: { min: -0.125, max: 0.125 } }
  ];

  const handleToleranceChange = (e) => {
    const selectedOption = toleranceOptions.find(
      (opt) => opt.label === e.target.value
    );
    if (selectedOption) {
      setTolerance(selectedOption.value);
      if (currentEditingSizeData) {
        const updatedSizeData = {
          ...currentEditingSizeData,
          tolerance: selectedOption.value
        };
        setCurrentEditingSizeData(updatedSizeData);
        const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
        const sizeIndex = docCopy.inspectionData.findIndex(
          (item) => item.inspectedSize === selectedSizeForEdit
        );
        if (sizeIndex > -1) {
          docCopy.inspectionData[sizeIndex].tolerance = selectedOption.value;
          setEditableInspectionDoc(docCopy);
        }
      }
    }
  };

  const handleMeasurementTableUpdate = (updatedBundleInspectionDataForSize) => {
    if (!currentEditingSizeData || !editableInspectionDoc) return;

    const updatedSizeData = {
      ...currentEditingSizeData,
      bundleInspectionData: updatedBundleInspectionDataForSize
    };

    let totalPcsSize = 0,
      totalPassSize = 0,
      totalRejectSize = 0;
    let totalRejectMeasurementSize = 0;

    updatedBundleInspectionDataForSize.forEach((bundle) => {
      totalPcsSize += bundle.totalPcs || 0;
      totalPassSize += bundle.pass?.total || 0;
      totalRejectSize += bundle.reject?.total || 0;
      totalRejectMeasurementSize += bundle.rejectMeasurement?.total || 0;
    });

    updatedSizeData.totalPcsSize = totalPcsSize;
    updatedSizeData.pcsSize = {
      total: totalPcsSize,
      top: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.pcs?.top || 0),
        0
      ),
      middle: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.pcs?.middle || 0),
        0
      ),
      bottom: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.pcs?.bottom || 0),
        0
      )
    };
    updatedSizeData.passSize = {
      total: totalPassSize,
      top: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.pass?.top || 0),
        0
      ),
      middle: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.pass?.middle || 0),
        0
      ),
      bottom: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.pass?.bottom || 0),
        0
      )
    };
    updatedSizeData.rejectSize = {
      total: totalRejectSize,
      top: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.reject?.top || 0),
        0
      ),
      middle: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.reject?.middle || 0),
        0
      ),
      bottom: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.reject?.bottom || 0),
        0
      )
    };
    updatedSizeData.rejectMeasurementSize = {
      total: totalRejectMeasurementSize,
      top: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.rejectMeasurement?.top || 0),
        0
      ),
      middle: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.rejectMeasurement?.middle || 0),
        0
      ),
      bottom: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.rejectMeasurement?.bottom || 0),
        0
      )
    };
    // Update passrateSize
    updatedSizeData.passrateSize = {
      total:
        totalPcsSize > 0
          ? parseFloat(((totalPassSize / totalPcsSize) * 100).toFixed(2))
          : 0,
      top:
        updatedSizeData.pcsSize.top > 0
          ? parseFloat(
              (
                (updatedSizeData.passSize.top / updatedSizeData.pcsSize.top) *
                100
              ).toFixed(2)
            )
          : 0,
      middle:
        updatedSizeData.pcsSize.middle > 0
          ? parseFloat(
              (
                (updatedSizeData.passSize.middle /
                  updatedSizeData.pcsSize.middle) *
                100
              ).toFixed(2)
            )
          : 0,
      bottom:
        updatedSizeData.pcsSize.bottom > 0
          ? parseFloat(
              (
                (updatedSizeData.passSize.bottom /
                  updatedSizeData.pcsSize.bottom) *
                100
              ).toFixed(2)
            )
          : 0
    };

    setCurrentEditingSizeData(updatedSizeData);

    const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
    const sizeIndex = docCopy.inspectionData.findIndex(
      (item) => item.inspectedSize === selectedSizeForEdit
    );
    if (sizeIndex > -1) {
      docCopy.inspectionData[sizeIndex] = updatedSizeData;
      setEditableInspectionDoc(docCopy);
    }
  };

  const handleSave = async () => {
    if (!editableInspectionDoc || !currentEditingSizeData) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.noDataToSave"),
        text: t("cutting.loadAndEditDataFirst")
      });
      return;
    }
    if (bundleQtyForSizeError) {
      Swal.fire({
        icon: "error",
        title: t("cutting.validationError"),
        text: bundleQtyForSizeError
      });
      return;
    }

    setIsLoading(true);
    try {
      const cuttingTypeString =
        cuttingByType.auto && cuttingByType.manual
          ? "Auto & Manual"
          : cuttingByType.auto
          ? "Auto"
          : cuttingByType.manual
          ? "Manual"
          : "None";

      const payload = {
        moNo: selectedMoNo,
        tableNo: selectedTableNo,
        updatedFields: {
          totalBundleQty: parseInt(totalBundleQtyInput),
          bundleQtyCheck: parseInt(bundleQtyCheckDisplay),
          totalInspectionQty: parseInt(totalInspectionQtyDisplay),
          cuttingtype: cuttingTypeString
        },
        updatedInspectionDataItem: currentEditingSizeData
      };

      if (payload.updatedInspectionDataItem) {
        payload.updatedInspectionDataItem.updated_at = new Date();
        if (!payload.updatedInspectionDataItem.created_at) {
          payload.updatedInspectionDataItem.created_at = new Date();
        }
      }

      await axios.put(`${API_BASE_URL}/api/cutting-inspection-update`, payload);
      Swal.fire({
        icon: "success",
        title: t("cutting.success"),
        text: t("cutting.dataUpdatedSuccessfully")
      });

      const response = await axios.get(
        `${API_BASE_URL}/api/cutting-inspection-details-for-modify`,
        {
          params: { moNo: selectedMoNo, tableNo: selectedTableNo }
        }
      );
      setInspectionDoc(response.data);
      setEditableInspectionDoc(JSON.parse(JSON.stringify(response.data)));
      const currentSelSize = selectedSizeForEdit;
      setSelectedSizeForEdit("");
      setTimeout(() => setSelectedSizeForEdit(currentSelSize), 0);
    } catch (error) {
      console.error("Error updating inspection data:", error);
      Swal.fire({
        icon: "error",
        title: t("cutting.error"),
        text: error.response?.data?.message || t("cutting.failedToUpdateData")
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return <div className="p-4 text-center">{t("loading")}</div>;

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {t("cutting.modifyCuttingInspection")}
        </h1>

        {/* Search Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div ref={moNoDropdownRef}>
            <label className="block text-sm font-medium text-gray-700">
              {t("cutting.moNo")}
            </label>
            <div className="relative">
              <input
                type="text"
                value={moNoSearch}
                onChange={(e) => {
                  setMoNoSearch(e.target.value);
                  setSelectedMoNo("");
                  setSelectedTableNo("");
                  setTableNoSearch("");
                }}
                onFocus={() =>
                  moNoOptions.length > 0 && setShowMoNoDropdown(true)
                }
                placeholder={t("cutting.search_mono")}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
              />
              {showMoNoDropdown && moNoOptions.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {moNoOptions.map((option, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setSelectedMoNo(option);
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
          <div ref={tableNoDropdownRef}>
            <label className="block text-sm font-medium text-gray-700">
              {t("cutting.tableNo")}
            </label>
            <div className="relative">
              <input
                type="text"
                value={tableNoSearch}
                onChange={(e) => {
                  setTableNoSearch(e.target.value);
                  setSelectedTableNo("");
                }}
                onFocus={() =>
                  tableNoOptions.length > 0 && setShowTableNoDropdown(true)
                }
                placeholder={t("cutting.search_table_no")}
                className={`mt-1 w-full p-2 border border-gray-300 rounded-lg ${
                  !selectedMoNo ? "bg-gray-200 cursor-not-allowed" : ""
                }`}
                disabled={!selectedMoNo}
              />
              {showTableNoDropdown && tableNoOptions.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {tableNoOptions
                    .filter((opt) =>
                      opt.toLowerCase().includes(tableNoSearch.toLowerCase())
                    )
                    .map((option, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setSelectedTableNo(option);
                          setTableNoSearch(option);
                          setShowTableNoDropdown(false);
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
        </div>

        {isLoading && (
          <div className="text-center p-4">{t("loadingData")}...</div>
        )}

        {editableInspectionDoc && (
          <>
            {/* Marker Ratio */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                {t("cutting.markerRatio")}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      {markerRatios
                        .filter((mr) => mr.ratio > 0)
                        .map((mr, index) => (
                          <th
                            key={index}
                            className="border border-gray-300 p-2 text-sm"
                          >
                            {mr.markerSize}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {markerRatios
                        .filter((mr) => mr.ratio > 0)
                        .map((mr, index) => (
                          <td
                            key={index}
                            className="border border-gray-300 p-2 text-sm text-center"
                          >
                            {mr.ratio}
                          </td>
                        ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Level Editable Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 border p-4 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("cutting.totalBundleQty")}
                </label>
                <div className="relative">
                  <input
                    type={isTablet ? "number" : "text"}
                    inputMode="numeric"
                    value={totalBundleQtyInput}
                    onChange={(e) => setTotalBundleQtyInput(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg pr-10"
                  />
                  {!isTablet && (
                    <button
                      onClick={() => setShowNumberPadTotalBundle(true)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
                    >
                      <Keyboard className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {showNumberPadTotalBundle && (
                  <NumberPad
                    onClose={() => setShowNumberPadTotalBundle(false)}
                    onInput={(val) => setTotalBundleQtyInput(val)}
                    initialValue={totalBundleQtyInput}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("cutting.bundleQtyCheck")}
                </label>
                <input
                  type="text"
                  value={bundleQtyCheckDisplay}
                  readOnly
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("cutting.totalInspectionQty")}
                </label>
                <input
                  type={isTablet ? "number" : "text"}
                  inputMode="numeric"
                  value={totalInspectionQtyDisplay}
                  onChange={(e) => {
                    setTotalInspectionQtyDisplay(e.target.value);
                    setIsTotalInspectionQtyManual(true);
                  }}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("cutting.cuttingBy")}
                </label>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={cuttingByType.auto}
                      onChange={(e) =>
                        setCuttingByType({
                          ...cuttingByType,
                          auto: e.target.checked
                        })
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {t("cutting.auto")}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={cuttingByType.manual}
                      onChange={(e) =>
                        setCuttingByType({
                          ...cuttingByType,
                          manual: e.target.checked
                        })
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {t("cutting.manual")}
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("cutting.garmentType")}
                </label>
                <input
                  type="text"
                  value={garmentTypeDisplay}
                  readOnly
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
              <div>
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

            {/* Size Selection for Editing */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">
                {t("cutting.selectSizeToEdit")}
              </label>
              <select
                value={selectedSizeForEdit}
                onChange={(e) => setSelectedSizeForEdit(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">{t("cutting.pleaseSelectASize")}</option>
                {(editableInspectionDoc.inspectionData || []).map((item) => (
                  <option key={item.inspectedSize} value={item.inspectedSize}>
                    {item.inspectedSize}
                  </option>
                ))}
              </select>
            </div>

            {currentEditingSizeData && (
              <div className="border p-4 rounded-md mt-4">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  {t("editingInspectionForSize", { size: selectedSizeForEdit })}
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.bundleQtyForThisSize")} (
                    {t("cutting.bundleQtyCheckSize")})
                  </label>
                  <input
                    type="number"
                    value={bundleQtyForSizeInput}
                    onChange={(e) =>
                      handleBundleQtyForSizeChange(e.target.value)
                    }
                    className={`mt-1 w-full md:w-1/3 p-2 border rounded-lg ${
                      bundleQtyForSizeError
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    min="0"
                  />
                  {bundleQtyForSizeError && (
                    <p className="text-red-500 text-sm mt-1">
                      {bundleQtyForSizeError}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">
                    {t("cutting.bundleDetails")}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-sm">
                            {t("cutting.bundleNo")}
                          </th>
                          <th className="border p-2 text-sm">
                            {t("cutting.serialLetter")}
                          </th>
                          <th className="border p-2 text-sm">
                            {t("cutting.parts")}
                          </th>
                          <th className="border p-2 text-sm">
                            {t("cutting.pcs")} (T/M/B)
                          </th>
                          <th className="border p-2 text-sm">
                            {t("cutting.totalPcs")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          currentEditingSizeData.bundleInspectionData || []
                        ).map((bundle, bundleIdx) => {
                          const isNewBundle =
                            !inspectionDoc.inspectionData.find(
                              (s) => s.inspectedSize === selectedSizeForEdit
                            )?.bundleInspectionData[bundleIdx];

                          return (
                            <tr key={bundle.bundleNo}>
                              <td className="border p-2 text-sm text-center">
                                {bundle.bundleNo}
                              </td>
                              <td className="border p-2 text-sm">
                                <select
                                  value={bundle.serialLetter}
                                  onChange={(e) =>
                                    handleSerialLetterChange(
                                      bundleIdx,
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-1 border rounded"
                                >
                                  <option value="">{t("select")}</option>
                                  {serialLetters.map((sl) => (
                                    <option key={sl} value={sl}>
                                      {sl}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="border p-2 text-sm">
                                {isNewBundle ||
                                !(
                                  bundle.measurementInsepctionData &&
                                  bundle.measurementInsepctionData.length > 0
                                ) ? (
                                  <div className="flex flex-wrap gap-2">
                                    {panelIndexNames.map((pName) => (
                                      <label
                                        key={pName.panelIndexName}
                                        className="flex items-center space-x-1"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={bundle.measurementInsepctionData?.some(
                                            (p) =>
                                              p.partName ===
                                              pName.panelIndexName
                                          )}
                                          onChange={(e) =>
                                            handlePartSelectionChange(
                                              bundleIdx,
                                              pName.panelIndexName,
                                              e.target.checked
                                            )
                                          }
                                        />
                                        <span>
                                          {i18n.language === "km"
                                            ? pName.panelIndexNameKhmer
                                            : pName.panelIndexName}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                ) : (
                                  bundle.measurementInsepctionData
                                    .map((p) =>
                                      i18n.language === "km"
                                        ? p.partNameKhmer
                                        : p.partName
                                    )
                                    .join(", ")
                                )}
                              </td>
                              <td className="border p-2 text-sm">
                                <div className="flex items-center gap-1">
                                  T:{" "}
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={bundle.pcsPerLocation?.t || 5}
                                    onChange={(e) =>
                                      handlePcsPerLocationChange(
                                        bundleIdx,
                                        "T",
                                        e.target.value
                                      )
                                    }
                                    className="w-12 p-1 border rounded"
                                  />
                                  M:{" "}
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={bundle.pcsPerLocation?.m || 5}
                                    onChange={(e) =>
                                      handlePcsPerLocationChange(
                                        bundleIdx,
                                        "M",
                                        e.target.value
                                      )
                                    }
                                    className="w-12 p-1 border rounded"
                                  />
                                  B:{" "}
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={bundle.pcsPerLocation?.b || 5}
                                    onChange={(e) =>
                                      handlePcsPerLocationChange(
                                        bundleIdx,
                                        "B",
                                        e.target.value
                                      )
                                    }
                                    className="w-12 p-1 border rounded"
                                  />
                                </div>
                              </td>
                              <td className="border p-2 text-sm text-center">
                                {bundle.totalPcs || 0}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <MeasurementTableModify
                  key={`${selectedSizeForEdit}-${
                    (currentEditingSizeData.bundleInspectionData || []).length
                  }-${JSON.stringify(
                    (currentEditingSizeData.bundleInspectionData || []).map(
                      (b) => b.pcsPerLocation
                    )
                  )}`}
                  initialBundleInspectionData={
                    currentEditingSizeData.bundleInspectionData || []
                  }
                  measurementPoints={measurementPoints}
                  panelIndexNames={panelIndexNames}
                  fabricDefectsList={fabricDefectsList}
                  tolerance={tolerance}
                  onUpdate={handleMeasurementTableUpdate}
                  garmentType={garmentTypeDisplay}
                  moNo={selectedMoNo}
                  activeMeasurementTab={activeMeasurementTab}
                  setActiveMeasurementTab={setActiveMeasurementTab}
                  pcsPerLocationInitial={(
                    currentEditingSizeData.bundleInspectionData || []
                  ).map((b) => b.pcsPerLocation || { t: 5, m: 5, b: 5 })}
                />
              </div>
            )}

            {currentEditingSizeData && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center"
                >
                  <Save size={18} className="mr-2" />{" "}
                  {isLoading ? t("saving") : t("saveChanges")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CuttingInspectionModify;
