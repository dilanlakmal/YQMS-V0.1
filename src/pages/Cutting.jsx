// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../config";
// import { useAuth } from "../components/authentication/AuthContext";
// import { useTranslation } from "react-i18next";
// import { Eye, EyeOff, Database } from "lucide-react";
// import Swal from "sweetalert2";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

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
//   const [lotNo, setLotNo] = useState("");
//   const [color, setColor] = useState("");
//   const [tableNo, setTableNo] = useState("");
//   const [cuttingTableL, setCuttingTableL] = useState("");
//   const [cuttingTableNo, setCuttingTableNo] = useState("");
//   const [marker, setMarker] = useState("");
//   const [showOrderDetails, setShowOrderDetails] = useState(false);

//   // State for data fetched from server
//   const [moData, setMoData] = useState(null);
//   const [lotNos, setLotNos] = useState([]);
//   const [colors, setColors] = useState([]);
//   const [tableNos, setTableNos] = useState([]);
//   const [markerData, setMarkerData] = useState([]);

//   // Fetch MO Numbers when the user types in the MO No field
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
//   }, [moNoSearch, t]);

//   // Fetch data when MO No is selected
//   useEffect(() => {
//     const fetchMoData = async () => {
//       if (!moNo) {
//         setMoData(null);
//         setLotNos([]);
//         setColors([]);
//         setTableNos([]);
//         setMarkerData([]);
//         setLotNo("");
//         setColor("");
//         setTableNo("");
//         setCuttingTableL("");
//         setCuttingTableNo("");
//         setMarker("");
//         setShowOrderDetails(false);
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

//         // Populate Lot No options
//         const lotNames =
//           response.data[0]?.lotNo?.length > 0
//             ? response.data[0].lotNo.map((l) => l.LotName)
//             : ["N/A"];
//         setLotNos(lotNames);
//         setLotNo(""); // Reset Lot No selection

//         // Populate Color options
//         const uniqueColors = [
//           ...new Set(response.data.map((d) => d.EngColor))
//         ].filter((color) => color); // Remove null/undefined colors
//         setColors(uniqueColors);
//         setColor(""); // Reset Color selection
//       } catch (error) {
//         console.error("Error fetching MO data:", error);
//         setMoData(null);
//         setLotNos([]);
//         setColors([]);
//         setTableNos([]);
//         setMarkerData([]);
//         setLotNo("");
//         setColor("");
//         setTableNo("");
//         setCuttingTableL("");
//         setCuttingTableNo("");
//         setMarker("");
//         setShowOrderDetails(false);
//         if (error.response?.status === 404) {
//           Swal.fire({
//             icon: "error",
//             title: t("cutting.error"),
//             text: t("cutting.moNotFound", { moNo })
//           });
//         } else {
//           Swal.fire({
//             icon: "error",
//             title: t("cutting.error"),
//             text:
//               error.response?.data?.message || t("cutting.failedToFetchMOData")
//           });
//         }
//       }
//     };

//     fetchMoData();
//   }, [moNo, t]);

//   // Update Table No options when Color is selected
//   useEffect(() => {
//     if (color && moData) {
//       const selectedDocument = moData.find((d) => d.EngColor === color);
//       if (selectedDocument) {
//         const tableNumbers = selectedDocument.cuttingData
//           .filter((cd) => cd.tableNo)
//           .map((cd) => cd.tableNo);
//         setTableNos(tableNumbers);
//         setTableNo(""); // Reset Table No selection
//       } else {
//         setTableNos([]);
//         setTableNo("");
//       }
//     } else {
//       setTableNos([]);
//       setTableNo("");
//     }
//     // Reset dependent fields
//     setCuttingTableL("");
//     setCuttingTableNo("");
//     setMarker("");
//     setMarkerData([]);
//   }, [color, moData]);

//   // Update Cutting Table No, Marker, and Marker Data when Table No is selected
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
//           setMarkerData(
//             selectedCuttingData.markerData.filter(
//               (md) => md.markerRatio !== null
//             )
//           );
//         } else {
//           setCuttingTableNo("");
//           setMarker("");
//           setMarkerData([]);
//         }
//       }
//     } else {
//       setCuttingTableNo("");
//       setMarker("");
//       setMarkerData([]);
//     }
//     // Reset dependent fields
//     setCuttingTableL("");
//   }, [tableNo, color, moData]);

//   // Handle clicks outside the MO No dropdown to close it
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         moNoDropdownRef.current &&
//         !moNoDropdownRef.current.contains(event.target)
//       ) {
//         setShowMoNoDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   // Reset form
//   const resetForm = () => {
//     setMoNo("");
//     setMoNoSearch("");
//     setMoNoOptions([]);
//     setShowMoNoDropdown(false);
//     setMoData(null);
//     setLotNo("");
//     setColor("");
//     setTableNo("");
//     setCuttingTableL("");
//     setCuttingTableNo("");
//     setMarker("");
//     setLotNos([]);
//     setColors([]);
//     setTableNos([]);
//     setMarkerData([]);
//     setShowOrderDetails(false);
//   };

//   // Get order details for selected color
//   const orderDetails =
//     color && moData ? moData.find((d) => d.EngColor === color) : null;

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!moNo || !lotNo || !color || !tableNo) {
//       Swal.fire({
//         icon: "warning",
//         title: t("cutting.missingInformation"),
//         text: t("cutting.fillRequiredFields")
//       });
//       return;
//     }

//     const report = {
//       cutting_report_id: Date.now(),
//       report_name: "Cutting Report",
//       emp_id: user?.emp_id || "Guest",
//       eng_name: user?.eng_name || "Guest",
//       inspection_date: inspectionDate.toLocaleDateString("en-US"),
//       mo_no: moNo,
//       lot_no: lotNo,
//       color: color,
//       table_no: tableNo,
//       cutting_table_l: cuttingTableL,
//       cutting_table_no: cuttingTableNo,
//       marker: marker,
//       marker_data: markerData,
//       order_details: orderDetails
//         ? {
//             customer_style: orderDetails.BuyerStyle,
//             buyer: orderDetails.Buyer,
//             order_qty: orderDetails.totalOrderQty
//           }
//         : null
//     };

//     try {
//       // Placeholder for API call to save the report
//       // await axios.post(`${API_BASE_URL}/api/save-cutting-report`, report);
//       Swal.fire({
//         icon: "success",
//         title: t("cutting.success"),
//         text: t("cutting.dataSaved")
//       });
//       resetForm();
//     } catch (error) {
//       console.error("Error saving Cutting data:", error);
//       Swal.fire({
//         icon: "error",
//         title: t("cutting.error"),
//         text: t("cutting.failedToSaveData")
//       });
//     }
//   };

//   if (authLoading) {
//     return <div>{t("cutting.loading")}</div>;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
//       <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
//         <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
//           {t("cutting.cutting_inspection")}
//         </h1>
//         {/* Tab Navigation */}
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
//             {/* Basic Info Section */}
//             <div className="mb-8">
//               {/* First Row: Date, MO No, Lot No */}
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
//                 </div>
//                 <div className="flex-1 min-w-[150px]">
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.moNo")}
//                   </label>
//                   <div className="relative" ref={moNoDropdownRef}>
//                     <input
//                       type="text"
//                       value={moNoSearch}
//                       onChange={(e) => {
//                         setMoNoSearch(e.target.value);
//                       }}
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
//                   <select
//                     value={lotNo}
//                     onChange={(e) => setLotNo(e.target.value)}
//                     className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                     disabled={!moNo || lotNos.length === 0}
//                   >
//                     <option value="">{t("cutting.select_lot_no")}</option>
//                     {lotNos.map((lot, index) => (
//                       <option key={index} value={lot}>
//                         {lot}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               {/* Second Row: Color, Order Details Toggle */}
//               <div className="flex flex-wrap items-center gap-4 mt-4">
//                 <div className="flex-1 min-w-[150px]">
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.color")}
//                   </label>
//                   <div className="flex items-center gap-2">
//                     <select
//                       value={color}
//                       onChange={(e) => setColor(e.target.value)}
//                       className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                       disabled={!moNo || colors.length === 0}
//                     >
//                       <option value="">{t("cutting.select_color")}</option>
//                       {colors.map((col, index) => (
//                         <option key={index} value={col}>
//                           {col}
//                         </option>
//                       ))}
//                     </select>
//                     {orderDetails && (
//                       <button
//                         onClick={() => setShowOrderDetails(!showOrderDetails)}
//                         className="text-gray-600 hover:text-gray-800 mt-1"
//                       >
//                         {showOrderDetails ? (
//                           <EyeOff className="w-5 h-5" />
//                         ) : (
//                           <Eye className="w-5 h-5" />
//                         )}
//                       </button>
//                     )}
//                   </div>
//                   {showOrderDetails && orderDetails && (
//                     <div className="mt-2 p-4 bg-gray-100 rounded-lg">
//                       <div className="grid grid-cols-1 gap-2 text-sm">
//                         <p>
//                           <strong>{t("cutting.customerStyle")}:</strong>{" "}
//                           {orderDetails.BuyerStyle || "N/A"}
//                         </p>
//                         <p>
//                           <strong>{t("cutting.buyer")}:</strong>{" "}
//                           {orderDetails.Buyer || "N/A"}
//                         </p>
//                         <p>
//                           <strong>{t("cutting.orderQty")}:</strong>{" "}
//                           {orderDetails.totalOrderQty || "N/A"}
//                         </p>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Horizontal Divider */}
//               <hr className="my-6 border-gray-300" />

//               {/* Third Row: Table No, Cutting Table, Marker */}
//               <div className="flex flex-wrap items-start gap-4">
//                 <div className="flex-1 min-w-[150px]">
//                   <label className="block text-sm font-medium text-gray-700">
//                     {t("cutting.tableNo")}
//                   </label>
//                   <select
//                     value={tableNo}
//                     onChange={(e) => setTableNo(e.target.value)}
//                     className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                     disabled={!color || tableNos.length === 0}
//                   >
//                     <option value="">{t("cutting.select_table_no")}</option>
//                     {tableNos.map((table, index) => (
//                       <option key={index} value={table}>
//                         {table}
//                       </option>
//                     ))}
//                   </select>
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

//             {/* Marker Ratio Section */}
//             {markerData.length > 0 && (
//               <div className="mb-8">
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

//             {/* Submit Button */}
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
//           <div className="text-center text-gray-600">
//             {t("cutting.dbTabPlaceholder")}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CuttingPage;

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Database } from "lucide-react";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CuttingPage = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("form");
  const [inspectionDate, setInspectionDate] = useState(new Date());
  const [moNo, setMoNo] = useState("");
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const moNoDropdownRef = useRef(null);
  const [lotNo, setLotNo] = useState("");
  const [color, setColor] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [cuttingTableL, setCuttingTableL] = useState("");
  const [cuttingTableNo, setCuttingTableNo] = useState("");
  const [marker, setMarker] = useState("");
  const [planLayerQty, setPlanLayerQty] = useState(0); // New state for PlanLayerQty
  const [totalPlanPcs, setTotalPlanPcs] = useState(0); // New state for TotalPlanPcs
  const [actualLayers, setActualLayers] = useState(0); // New state for ActualLayers
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // State for data fetched from server
  const [moData, setMoData] = useState(null);
  const [lotNos, setLotNos] = useState([]);
  const [colors, setColors] = useState([]);
  const [tableNos, setTableNos] = useState([]);
  const [markerData, setMarkerData] = useState([]);

  // Fetch MO Numbers when the user types in the MO No field
  useEffect(() => {
    const fetchMoNumbers = async () => {
      if (moNoSearch.trim() === "") {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-orders-mo-numbers`,
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

  // Fetch data when MO No is selected
  useEffect(() => {
    const fetchMoData = async () => {
      if (!moNo) {
        setMoData(null);
        setLotNos([]);
        setColors([]);
        setTableNos([]);
        setMarkerData([]);
        setLotNo("");
        setColor("");
        setTableNo("");
        setCuttingTableL("");
        setCuttingTableNo("");
        setMarker("");
        setPlanLayerQty(0);
        setTotalPlanPcs(0);
        setActualLayers(0);
        setShowOrderDetails(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-orders-details`,
          {
            params: { styleNo: moNo },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setMoData(response.data);

        // Populate Lot No options
        const lotNames =
          response.data[0]?.lotNo?.length > 0
            ? response.data[0].lotNo.map((l) => l.LotName)
            : ["N/A"];
        setLotNos(lotNames);
        setLotNo(""); // Reset Lot No selection

        // Populate Color options
        const uniqueColors = [
          ...new Set(response.data.map((d) => d.EngColor))
        ].filter((color) => color); // Remove null/undefined colors
        setColors(uniqueColors);
        setColor(""); // Reset Color selection
      } catch (error) {
        console.error("Error fetching MO data:", error);
        setMoData(null);
        setLotNos([]);
        setColors([]);
        setTableNos([]);
        setMarkerData([]);
        setLotNo("");
        setColor("");
        setTableNo("");
        setCuttingTableL("");
        setCuttingTableNo("");
        setMarker("");
        setPlanLayerQty(0);
        setTotalPlanPcs(0);
        setActualLayers(0);
        setShowOrderDetails(false);
        if (error.response?.status === 404) {
          Swal.fire({
            icon: "error",
            title: t("cutting.error"),
            text: t("cutting.moNotFound", { moNo })
          });
        } else {
          Swal.fire({
            icon: "error",
            title: t("cutting.error"),
            text:
              error.response?.data?.message || t("cutting.failedToFetchMOData")
          });
        }
      }
    };

    fetchMoData();
  }, [moNo, t]);

  // Update Table No options when Color is selected
  useEffect(() => {
    if (color && moData) {
      const selectedDocument = moData.find((d) => d.EngColor === color);
      if (selectedDocument) {
        const tableNumbers = selectedDocument.cuttingData
          .filter((cd) => cd.tableNo)
          .map((cd) => cd.tableNo);
        setTableNos(tableNumbers);
        setTableNo(""); // Reset Table No selection
      } else {
        setTableNos([]);
        setTableNo("");
      }
    } else {
      setTableNos([]);
      setTableNo("");
    }
    // Reset dependent fields
    setCuttingTableL("");
    setCuttingTableNo("");
    setMarker("");
    setPlanLayerQty(0);
    setTotalPlanPcs(0);
    setActualLayers(0);
    setMarkerData([]);
  }, [color, moData]);

  // Update Cutting Table No, Marker, PlanLayerQty, TotalPlanPcs, ActualLayers, and Marker Data when Table No is selected
  useEffect(() => {
    if (tableNo && color && moData) {
      const selectedDocument = moData.find((d) => d.EngColor === color);
      if (selectedDocument) {
        const selectedCuttingData = selectedDocument.cuttingData.find(
          (cd) => cd.tableNo === tableNo
        );
        if (selectedCuttingData) {
          const tableNoStr = selectedCuttingData.tableNo || "";
          const no = tableNoStr.replace(/[T\s]/g, "");
          setCuttingTableNo(no);
          setMarker(selectedCuttingData.markerNo || "N/A");
          setPlanLayerQty(selectedCuttingData.planLayerQty || 0);
          setTotalPlanPcs(selectedCuttingData.totalPlanPcs || 0);
          setActualLayers(selectedCuttingData.actualLayers || 0);
          setMarkerData(
            selectedCuttingData.markerData.filter(
              (md) => md.markerRatio !== null
            )
          );
        } else {
          setCuttingTableNo("");
          setMarker("");
          setPlanLayerQty(0);
          setTotalPlanPcs(0);
          setActualLayers(0);
          setMarkerData([]);
        }
      }
    } else {
      setCuttingTableNo("");
      setMarker("");
      setPlanLayerQty(0);
      setTotalPlanPcs(0);
      setActualLayers(0);
      setMarkerData([]);
    }
    // Reset dependent fields
    setCuttingTableL("");
  }, [tableNo, color, moData]);

  // Handle clicks outside the MO No dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset form
  const resetForm = () => {
    setMoNo("");
    setMoNoSearch("");
    setMoNoOptions([]);
    setShowMoNoDropdown(false);
    setMoData(null);
    setLotNo("");
    setColor("");
    setTableNo("");
    setCuttingTableL("");
    setCuttingTableNo("");
    setMarker("");
    setPlanLayerQty(0);
    setTotalPlanPcs(0);
    setActualLayers(0);
    setLotNos([]);
    setColors([]);
    setTableNos([]);
    setMarkerData([]);
    setShowOrderDetails(false);
  };

  // Get order details for selected color
  const orderDetails =
    color && moData ? moData.find((d) => d.EngColor === color) : null;

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!moNo || !lotNo || !color || !tableNo) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.missingInformation"),
        text: t("cutting.fillRequiredFields")
      });
      return;
    }

    const report = {
      cutting_report_id: Date.now(),
      report_name: "Cutting Report",
      emp_id: user?.emp_id || "Guest",
      eng_name: user?.eng_name || "Guest",
      inspection_date: inspectionDate.toLocaleDateString("en-US"),
      mo_no: moNo,
      lot_no: lotNo,
      color: color,
      table_no: tableNo,
      cutting_table_l: cuttingTableL,
      cutting_table_no: cuttingTableNo,
      marker: marker,
      plan_layer_qty: planLayerQty,
      total_plan_pcs: totalPlanPcs,
      actual_layers: actualLayers,
      marker_data: markerData,
      order_details: orderDetails
        ? {
            customer_style: orderDetails.BuyerStyle,
            buyer: orderDetails.Buyer,
            order_qty: orderDetails.totalOrderQty
          }
        : null
    };

    try {
      // Placeholder for API call to save the report
      // await axios.post(`${API_BASE_URL}/api/save-cutting-report`, report);
      Swal.fire({
        icon: "success",
        title: t("cutting.success"),
        text: t("cutting.dataSaved")
      });
      resetForm();
    } catch (error) {
      console.error("Error saving Cutting data:", error);
      Swal.fire({
        icon: "error",
        title: t("cutting.error"),
        text: t("cutting.failedToSaveData")
      });
    }
  };

  if (authLoading) {
    return <div>{t("cutting.loading")}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          {t("cutting.cutting_inspection")}
        </h1>
        {/* Tab Navigation */}
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
            {/* Basic Info Section */}
            <div className="mb-8">
              {/* First Row: Date, MO No, Lot No */}
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
                      onChange={(e) => {
                        setMoNoSearch(e.target.value);
                      }}
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
                    {t("cutting.lotNo")}
                  </label>
                  <select
                    value={lotNo}
                    onChange={(e) => setLotNo(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    disabled={!moNo || lotNos.length === 0}
                  >
                    <option value="">{t("cutting.select_lot_no")}</option>
                    {lotNos.map((lot, index) => (
                      <option key={index} value={lot}>
                        {lot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Second Row: Color, Order Details Toggle */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.color")}
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                      disabled={!moNo || colors.length === 0}
                    >
                      <option value="">{t("cutting.select_color")}</option>
                      {colors.map((col, index) => (
                        <option key={index} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                    {orderDetails && (
                      <button
                        onClick={() => setShowOrderDetails(!showOrderDetails)}
                        className="text-gray-600 hover:text-gray-800 mt-1"
                      >
                        {showOrderDetails ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                  {showOrderDetails && orderDetails && (
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <p>
                          <strong>{t("cutting.customerStyle")}:</strong>{" "}
                          {orderDetails.BuyerStyle || "N/A"}
                        </p>
                        <p>
                          <strong>{t("cutting.buyer")}:</strong>{" "}
                          {orderDetails.Buyer || "N/A"}
                        </p>
                        <p>
                          <strong>{t("cutting.orderQty")}:</strong>{" "}
                          {orderDetails.totalOrderQty || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Horizontal Divider */}
              <hr className="my-6 border-gray-300" />

              {/* Third Row: Table No, Cutting Table, Marker */}
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.tableNo")}
                  </label>
                  <select
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    disabled={!color || tableNos.length === 0}
                  >
                    <option value="">{t("cutting.select_table_no")}</option>
                    {tableNos.map((table, index) => (
                      <option key={index} value={table}>
                        {table}
                      </option>
                    ))}
                  </select>
                  {/* Display PlanLayerQty, TotalPlanPcs, and ActualLayers */}
                  {tableNo && (
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg">
                      <div className="flex space-x-4 text-sm">
                        <p>
                          <strong>Layer Qty:</strong> {planLayerQty}
                        </p>
                        <p>
                          <strong>TotalPcs:</strong> {totalPlanPcs}
                        </p>
                        <p>
                          <strong>Actual Layer Qty:</strong> {actualLayers}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.cuttingTable")}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600">
                        {t("cutting.l")}
                      </label>
                      <select
                        value={cuttingTableL}
                        onChange={(e) => setCuttingTableL(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                        disabled={!tableNo}
                      >
                        <option value="">{t("cutting.select")}</option>
                        {[...Array(26)].map((_, i) => (
                          <option key={i} value={String.fromCharCode(65 + i)}>
                            {String.fromCharCode(65 + i)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600">
                        {t("cutting.no")}
                      </label>
                      <input
                        type="text"
                        value={cuttingTableNo}
                        readOnly
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.marker")}
                  </label>
                  <input
                    type="text"
                    value={marker}
                    readOnly
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Marker Ratio Section */}
            {markerData.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {t("cutting.markerRatio")}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-200">
                        {markerData.map((data, index) => (
                          <th
                            key={index}
                            className="border border-gray-300 p-2 text-center"
                          >
                            {data.size || `Size ${data.No}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {markerData.map((data, index) => (
                          <td
                            key={index}
                            className="border border-gray-300 p-2 text-center"
                          >
                            {data.markerRatio}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Submit Button */}
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
          <div className="text-center text-gray-600">
            {t("cutting.dataTabPlaceholder")}
          </div>
        ) : (
          <div className="text-center text-gray-600">
            {t("cutting.dbTabPlaceholder")}
          </div>
        )}
      </div>
    </div>
  );
};

export default CuttingPage;
