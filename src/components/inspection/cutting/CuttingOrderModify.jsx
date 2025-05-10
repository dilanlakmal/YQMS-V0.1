// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../config";
// import { useTranslation } from "react-i18next";
// import { measurementPoints } from "../../../constants/cuttingmeasurement";

// const CuttingOrderModify = () => {
//   const { t } = useTranslation();
//   const [moNo, setMoNo] = useState("");
//   const [moNoSearch, setMoNoSearch] = useState("");
//   const [moNoOptions, setMoNoOptions] = useState([]);
//   const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
//   const moNoDropdownRef = useRef(null);
//   const [orderData, setOrderData] = useState(null);
//   const [sizes, setSizes] = useState([]);
//   const [lotNos, setLotNos] = useState([]);
//   const [colors, setColors] = useState([]);
//   const [selectedGarmentType, setSelectedGarmentType] = useState("");
//   const [khmerName, setKhmerName] = useState("");
//   const [additionalPoints, setAdditionalPoints] = useState([]);
//   const [panelIndexCounter, setPanelIndexCounter] = useState(1);

//   // Fetch MO No options
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
//       }
//     };
//     fetchMoNumbers();
//   }, [moNoSearch]);

//   // Fetch order details
//   useEffect(() => {
//     const fetchOrderData = async () => {
//       if (!moNo) {
//         setOrderData(null);
//         setSizes([]);
//         setLotNos([]);
//         setColors([]);
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
//         setOrderData(response.data);
//         const uniqueSizes = [
//           ...new Set(
//             response.data
//               .flatMap((d) => d.cuttingData)
//               .flatMap((cd) => cd.markerData)
//               .map((md) => md.size)
//               .filter((size) => size && size !== "0")
//           )
//         ].sort();
//         setSizes(uniqueSizes);
//         const uniqueLotNos = [
//           ...new Set(
//             response.data.flatMap((d) => d.lotNo.map((ln) => ln.LotName))
//           )
//         ];
//         setLotNos(uniqueLotNos);
//         const uniqueColors = [...new Set(response.data.map((d) => d.EngColor))];
//         setColors(uniqueColors);
//       } catch (error) {
//         console.error("Error fetching order data:", error);
//       }
//     };
//     fetchOrderData();
//   }, [moNo]);

//   // Handle clicks outside dropdown
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
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Handle Garment Type change
//   const handleGarmentTypeChange = (e) => {
//     const value = e.target.value;
//     setSelectedGarmentType(value);
//     setKhmerName(
//       value === "Top"
//         ? "អាវ"
//         : value === "Bottom"
//         ? "ខោ"
//         : value === "Zipper Jacket"
//         ? "អាវបើកមុខ"
//         : ""
//     );
//     if (value) {
//       const maxPanelIndex = Math.max(
//         ...measurementPoints
//           .filter((point) => point.panel === value)
//           .map((point) => point.panelIndex),
//         0
//       );
//       setPanelIndexCounter(maxPanelIndex + 1);
//     } else {
//       setPanelIndexCounter(1);
//     }
//     setAdditionalPoints([]);
//   };

//   // Handle adding a new measurement point
//   const handleAddPoint = () => {
//     setAdditionalPoints([
//       ...additionalPoints,
//       {
//         panelName: "",
//         panelIndex: panelIndexCounter,
//         panelNameKhmer: "",
//         measurementPointEng: "",
//         measurementPointKhmer: ""
//       }
//     ]);
//     setPanelIndexCounter(panelIndexCounter + 1);
//   };

//   // Handle changes to additional points
//   const handlePointChange = (index, field, value) => {
//     const updatedPoints = [...additionalPoints];
//     if (field === "panelName") {
//       const selectedPanel = measurementPoints.find(
//         (p) => p.panelIndexName === value && p.panel === selectedGarmentType
//       );
//       if (selectedPanel) {
//         updatedPoints[index].panelName = value;
//         updatedPoints[index].panelIndex = selectedPanel.panelIndex;
//         updatedPoints[index].panelNameKhmer = selectedPanel.panelIndexNameKhmer;
//       } else {
//         updatedPoints[index].panelName = value;
//         updatedPoints[index].panelIndex = panelIndexCounter + index;
//         updatedPoints[index].panelNameKhmer = "";
//       }
//     } else {
//       updatedPoints[index][field] = value;
//     }
//     setAdditionalPoints(updatedPoints);
//   };

//   // Save data to backend
//   const handleSave = async () => {
//     if (
//       !moNo ||
//       !selectedGarmentType ||
//       additionalPoints.some(
//         (p) =>
//           !p.panelName ||
//           !p.panelIndex ||
//           !p.panelNameKhmer ||
//           !p.measurementPointEng ||
//           !p.measurementPointKhmer
//       )
//     ) {
//       alert(t("cutting.fillRequiredFields"));
//       return;
//     }
//     try {
//       const response = await axios.post(
//         `${API_BASE_URL}/api/save-additional-points`,
//         {
//           moNo,
//           orderQty: orderData[0]?.totalOrderQty || 0,
//           orderDetails: colors.map((color) => {
//             const colorData = orderData.find((d) => d.EngColor === color);
//             const sizeData = sizes.map((size) => {
//               const qty =
//                 colorData?.cuttingData
//                   .flatMap((cd) => cd.markerData)
//                   .find((md) => md.size === size)?.orderQty || 0;
//               return { sizeName: size, orderQtySize: qty };
//             });
//             const orderQtyColor = sizeData.reduce(
//               (sum, s) => sum + s.orderQtySize,
//               0
//             );
//             return { color, orderQtyColor, sizes: sizeData };
//           }),
//           additionalPoints: additionalPoints.map((point) => ({
//             garmentType: selectedGarmentType,
//             garmentTypeKhmer: khmerName,
//             panelIndex: point.panelIndex,
//             panelName: point.panelName,
//             panelNameKhmer: point.panelNameKhmer,
//             measurementPoint: point.measurementPointEng,
//             measurementPointKhmer: point.measurementPointKhmer
//           }))
//         },
//         {
//           headers: { "Content-Type": "application/json" },
//           withCredentials: true
//         }
//       );
//       alert(t("cutting.dataSaved"));
//       console.log("Data saved:", response.data);
//     } catch (error) {
//       console.error("Error saving data:", error);
//       alert(t("cutting.failedToSaveData"));
//     }
//   };

//   // Prepare table data
//   const tableData = colors.map((color) => {
//     const colorData = orderData?.find((d) => d.EngColor === color);
//     const sizeQtys = sizes.map((size) => {
//       const qty =
//         colorData?.cuttingData
//           .flatMap((cd) => cd.markerData)
//           .find((md) => md.size === size)?.orderQty || "";
//       return qty;
//     });
//     return { color, sizeQtys };
//   });

//   const totalOrderQty = orderData?.[0]?.totalOrderQty || 0;

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">
//         {t("cutting.modifyCuttingOrder")}
//       </h1>
//       {/* MO No Search */}
//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-700">
//           {t("cutting.moNo")}
//         </label>
//         <div className="relative" ref={moNoDropdownRef}>
//           <input
//             type="text"
//             value={moNoSearch}
//             onChange={(e) => setMoNoSearch(e.target.value)}
//             placeholder={t("cutting.search_mono")}
//             className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//           />
//           {showMoNoDropdown && (
//             <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//               {moNoOptions.map((option, index) => (
//                 <li
//                   key={index}
//                   onClick={() => {
//                     setMoNo(option);
//                     setMoNoSearch(option);
//                     setShowMoNoDropdown(false);
//                   }}
//                   className="p-2 hover:bg-blue-100 cursor-pointer"
//                 >
//                   {option}
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       </div>

//       {/* Lot Nos and Order Details */}
//       {orderData && (
//         <div className="mb-6">
//           <h2 className="text-xl font-semibold mb-2">{t("cutting.lotNo")}</h2>
//           <p className="mb-4">{lotNos.join(", ")}</p>
//           <h2 className="text-xl font-semibold mb-2">
//             {t("cutting.orderDetails")}
//           </h2>
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse border border-gray-300">
//               <thead>
//                 <tr className="bg-gray-200">
//                   <th className="border border-gray-300 p-2 text-left">
//                     {t("cutting.color")}
//                   </th>
//                   {sizes.map((size, index) => (
//                     <th
//                       key={index}
//                       className="border border-gray-300 p-2 text-center"
//                     >
//                       {size}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {tableData.map((row, index) => (
//                   <tr key={index}>
//                     <td className="border border-gray-300 p-2">{row.color}</td>
//                     {row.sizeQtys.map((qty, i) => (
//                       <td
//                         key={i}
//                         className="border border-gray-300 p-2 text-center"
//                       >
//                         {qty || ""}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//               <tfoot>
//                 <tr className="bg-gray-100 font-semibold">
//                   <td className="border border-gray-300 p-2 text-right">
//                     {t("cutting.totalOrderQty")}:
//                   </td>
//                   <td
//                     colSpan={sizes.length}
//                     className="border border-gray-300 p-2 text-center"
//                   >
//                     {totalOrderQty}
//                   </td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* Garment Type Selection */}
//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-700">
//           {t("cutting.panel")}
//         </label>
//         <div className="flex items-center space-x-4">
//           <select
//             value={selectedGarmentType}
//             onChange={handleGarmentTypeChange}
//             className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//           >
//             <option value="">{t("cutting.selectGarmentType")}</option>
//             <option value="Top">{t("cutting.garment_top")}</option>
//             <option value="Bottom">{t("cutting.garment_bottom")}</option>
//             <option value="Zipper Jacket">{t("cutting.zipper")}</option>
//           </select>
//           {khmerName && (
//             <span className="text-sm text-gray-700">{khmerName}</span>
//           )}
//         </div>
//       </div>

//       {/* Additional Measurement Points Table */}
//       {selectedGarmentType && (
//         <div className="mb-6">
//           <h2 className="text-xl font-semibold mb-2">
//             {t("cutting.addAdditionalPoints")}
//           </h2>
//           <button
//             onClick={handleAddPoint}
//             className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//           >
//             {t("cutting.addPoint")}
//           </button>
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse border border-gray-300">
//               <thead>
//                 <tr className="bg-gray-200">
//                   <th className="border border-gray-300 p-2">
//                     {t("cutting.panelName")}
//                   </th>
//                   <th className="border border-gray-300 p-2">
//                     {t("cutting.panelIndex")}
//                   </th>
//                   <th className="border border-gray-300 p-2">
//                     {t("cutting.panelNameKhmer")}
//                   </th>
//                   <th className="border border-gray-300 p-2">
//                     {t("cutting.measurementPointEng")}
//                   </th>
//                   <th className="border border-gray-300 p-2">
//                     {t("cutting.measurementPointKhmer")}
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {additionalPoints.map((point, index) => (
//                   <tr key={index}>
//                     <td className="border border-gray-300 p-2">
//                       <input
//                         type="text"
//                         value={point.panelName}
//                         onChange={(e) =>
//                           handlePointChange(index, "panelName", e.target.value)
//                         }
//                         list={`panel-options-${index}`}
//                         className="w-full p-1 border border-gray-300 rounded"
//                       />
//                       <datalist id={`panel-options-${index}`}>
//                         {[
//                           ...new Set(
//                             measurementPoints
//                               .filter((p) => p.panel === selectedGarmentType)
//                               .map((p) => p.panelIndexName)
//                           )
//                         ].map((name, i) => (
//                           <option key={i} value={name} />
//                         ))}
//                       </datalist>
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <input
//                         type="number"
//                         value={point.panelIndex}
//                         readOnly
//                         className="w-full p-1 border border-gray-300 rounded bg-gray-100"
//                       />
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <input
//                         type="text"
//                         value={point.panelNameKhmer}
//                         onChange={(e) =>
//                           handlePointChange(
//                             index,
//                             "panelNameKhmer",
//                             e.target.value
//                           )
//                         }
//                         className="w-full p-1 border border-gray-300 rounded"
//                       />
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <input
//                         type="text"
//                         value={point.measurementPointEng}
//                         onChange={(e) =>
//                           handlePointChange(
//                             index,
//                             "measurementPointEng",
//                             e.target.value
//                           )
//                         }
//                         className="w-full p-1 border border-gray-300 rounded"
//                       />
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <input
//                         type="text"
//                         value={point.measurementPointKhmer}
//                         onChange={(e) =>
//                           handlePointChange(
//                             index,
//                             "measurementPointKhmer",
//                             e.target.value
//                           )
//                         }
//                         className="w-full p-1 border border-gray-300 rounded"
//                       />
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           <button
//             onClick={handleSave}
//             className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
//           >
//             {t("cutting.save")}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CuttingOrderModify;

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useTranslation } from "react-i18next";

const CuttingOrderModify = () => {
  const { t } = useTranslation();
  const [moNo, setMoNo] = useState("");
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const moNoDropdownRef = useRef(null);
  const [orderData, setOrderData] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [lotNos, setLotNos] = useState([]);
  const [colors, setColors] = useState([]);
  const [selectedGarmentType, setSelectedGarmentType] = useState("");
  const [garmentTypes, setGarmentTypes] = useState([]);
  const [panelIndexNames, setPanelIndexNames] = useState([]);
  const [uniquePanelNames, setUniquePanelNames] = useState([]);
  const [additionalPoints, setAdditionalPoints] = useState([]);

  // Fetch MO No options from CuttingOrders
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
      }
    };
    fetchMoNumbers();
  }, [moNoSearch]);

  // Fetch Garment Types (panels)
  useEffect(() => {
    const fetchGarmentTypes = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-panels`,
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setGarmentTypes(response.data);
      } catch (error) {
        console.error("Error fetching garment types:", error);
      }
    };
    fetchGarmentTypes();
  }, []);

  // Fetch unique panelNames
  useEffect(() => {
    const fetchPanelNames = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-panel-names`,
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setUniquePanelNames(response.data);
      } catch (error) {
        console.error("Error fetching panel names:", error);
      }
    };
    fetchPanelNames();
  }, []);

  // Fetch panelIndexNames when Garment Type changes
  useEffect(() => {
    const fetchPanelIndexNames = async () => {
      if (!selectedGarmentType) {
        setPanelIndexNames([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-panel-index-names`,
          {
            params: { panel: selectedGarmentType },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setPanelIndexNames(response.data);
      } catch (error) {
        console.error("Error fetching panel index names:", error);
      }
    };
    fetchPanelIndexNames();
  }, [selectedGarmentType]);

  // Fetch order details
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!moNo) {
        setOrderData(null);
        setSizes([]);
        setLotNos([]);
        setColors([]);
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
        setOrderData(response.data);
        const uniqueSizes = [
          ...new Set(
            response.data
              .flatMap((d) => d.cuttingData)
              .flatMap((cd) => cd.markerData)
              .map((md) => md.size)
              .filter((size) => size && size !== "0")
          )
        ].sort();
        setSizes(uniqueSizes);
        const uniqueLotNos = [
          ...new Set(
            response.data.flatMap((d) => d.lotNo.map((ln) => ln.LotName))
          )
        ];
        setLotNos(uniqueLotNos);
        const uniqueColors = [...new Set(response.data.map((d) => d.EngColor))];
        setColors(uniqueColors);
      } catch (error) {
        console.error("Error fetching order data:", error);
      }
    };
    fetchOrderData();
  }, [moNo]);

  // Handle clicks outside dropdown
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Garment Type change
  const handleGarmentTypeChange = (e) => {
    setSelectedGarmentType(e.target.value);
    setAdditionalPoints([]);
  };

  // Handle adding a new measurement point
  const handleAddPoint = () => {
    setAdditionalPoints([
      ...additionalPoints,
      {
        panelIndexName: "",
        panelIndex: 0,
        panelIndexNameKhmer: "",
        panelName: "NA",
        panelSide: "NA",
        panelDirection: "NA",
        measurementSide: "NA",
        measurementPointEng: "",
        measurementPointKhmer: ""
      }
    ]);
  };

  // Handle changes to additional points
  const handlePointChange = (index, field, value) => {
    const updatedPoints = [...additionalPoints];
    if (field === "panelIndexName") {
      const selectedPanel = panelIndexNames.find(
        (p) => p.panelIndexName === value
      );
      if (selectedPanel) {
        updatedPoints[index].panelIndexName = value;
        updatedPoints[index].panelIndex = selectedPanel.panelIndex;
        updatedPoints[index].panelIndexNameKhmer =
          selectedPanel.panelIndexNameKhmer;
      } else {
        updatedPoints[index].panelIndexName = value;
        updatedPoints[index].panelIndex = 0;
        updatedPoints[index].panelIndexNameKhmer = "";
      }
    } else if (field === "measurementPointEng") {
      updatedPoints[index].measurementPointEng = value;
      updatedPoints[index].pointName = value; // pointName same as measurementPointEng
      // Auto-fill fields based on measurementPointEng
      const lowerValue = value.toLowerCase();
      // panelName
      if (
        lowerValue.includes("body") ||
        lowerValue.includes("chest") ||
        lowerValue.includes("crotch")
      ) {
        updatedPoints[index].panelName = "Body";
      } else if (
        lowerValue.includes("sleeve") ||
        lowerValue.includes("bicep")
      ) {
        updatedPoints[index].panelName = "Sleeve";
      } else if (lowerValue.includes("pocket")) {
        updatedPoints[index].panelName = "Pocket";
      } else if (lowerValue.includes("hat")) {
        updatedPoints[index].panelName = "Hat";
      } else if (lowerValue.includes("waistband")) {
        updatedPoints[index].panelName = "Waistband";
      } else if (lowerValue.includes("neck band")) {
        updatedPoints[index].panelName = "Neck Band";
      } else {
        updatedPoints[index].panelName = "NA";
      }
      // panelSide
      if (lowerValue.includes("front")) {
        updatedPoints[index].panelSide = "Front";
      } else if (lowerValue.includes("back")) {
        updatedPoints[index].panelSide = "Back";
      } else {
        updatedPoints[index].panelSide = "NA";
      }
      // panelDirection
      if (lowerValue.includes("left")) {
        updatedPoints[index].panelDirection = "Left";
      } else if (lowerValue.includes("right")) {
        updatedPoints[index].panelDirection = "Right";
      } else {
        updatedPoints[index].panelDirection = "NA";
      }
      // measurementSide
      if (lowerValue.includes("length")) {
        updatedPoints[index].measurementSide = "Length";
      } else if (lowerValue.includes("width")) {
        updatedPoints[index].measurementSide = "Width";
      } else {
        updatedPoints[index].measurementSide = "NA";
      }
    } else {
      updatedPoints[index][field] = value;
    }
    setAdditionalPoints(updatedPoints);
  };

  // Save data to backend
  const handleSave = async () => {
    if (
      !moNo ||
      !selectedGarmentType ||
      additionalPoints.some(
        (p) =>
          !p.panelIndexName ||
          !p.panelIndex ||
          !p.panelIndexNameKhmer ||
          !p.panelName ||
          !p.panelSide ||
          !p.panelDirection ||
          !p.measurementSide ||
          !p.measurementPointEng ||
          !p.measurementPointKhmer
      )
    ) {
      alert(t("cutting.fillRequiredFields"));
      return;
    }
    try {
      for (const point of additionalPoints) {
        await axios.post(
          `${API_BASE_URL}/api/save-measurement-point`,
          {
            moNo,
            panel: selectedGarmentType,
            pointName: point.measurementPointEng,
            pointNameEng: point.measurementPointEng,
            pointNameKhmer: point.measurementPointKhmer,
            panelName: point.panelName,
            panelSide: point.panelSide,
            panelDirection: point.panelDirection,
            measurementSide: point.measurementSide,
            panelIndex: point.panelIndex,
            panelIndexName: point.panelIndexName,
            panelIndexNameKhmer: point.panelIndexNameKhmer
          },
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
      }
      alert(t("cutting.dataSaved"));
      setAdditionalPoints([]);
    } catch (error) {
      console.error("Error saving data:", error);
      alert(t("cutting.failedToSaveData"));
    }
  };

  // Prepare table data
  const tableData = colors.map((color) => {
    const colorData = orderData?.find((d) => d.EngColor === color);
    const sizeQtys = sizes.map((size) => {
      const qty =
        colorData?.cuttingData
          .flatMap((cd) => cd.markerData)
          .find((md) => md.size === size)?.orderQty || "";
      return qty;
    });
    return { color, sizeQtys };
  });

  const totalOrderQty = orderData?.[0]?.totalOrderQty || 0;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        {t("cutting.modifyCuttingOrder")}
      </h1>
      {/* MO No Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {t("cutting.moNo")}
        </label>
        <div className="relative" ref={moNoDropdownRef}>
          <input
            type="text"
            value={moNoSearch}
            onChange={(e) => setMoNoSearch(e.target.value)}
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

      {/* Lot Nos and Order Details */}
      {orderData && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{t("cutting.lotNo")}</h2>
          <p className="mb-4">{lotNos.join(", ")}</p>
          <h2 className="text-xl font-semibold mb-2">
            {t("cutting.orderDetails")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2 text-left">
                    {t("cutting.color")}
                  </th>
                  {sizes.map((size, index) => (
                    <th
                      key={index}
                      className="border border-gray-300 p-2 text-center"
                    >
                      {size}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{row.color}</td>
                    {row.sizeQtys.map((qty, i) => (
                      <td
                        key={i}
                        className="border border-gray-300 p-2 text-center"
                      >
                        {qty || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td className="border border-gray-300 p-2 text-right">
                    {t("cutting.totalOrderQty")}:
                  </td>
                  <td
                    colSpan={sizes.length}
                    className="border border-gray-300 p-2 text-center"
                  >
                    {totalOrderQty}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Garment Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {t("cutting.panel")}
        </label>
        <select
          value={selectedGarmentType}
          onChange={handleGarmentTypeChange}
          className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
        >
          <option value="">{t("cutting.selectGarmentType")}</option>
          {garmentTypes.map((type, index) => (
            <option key={index} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Additional Measurement Points Table */}
      {selectedGarmentType && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            {t("cutting.addAdditionalPoints")}
          </h2>
          <button
            onClick={handleAddPoint}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {t("cutting.addPoint")}
          </button>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2">
                    {t("cutting.panelIndexName")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.panelIndex")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.panelIndexNameKhmer")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.panelName")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.panelSide")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.panelDirection")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.measurementSide")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.measurementPointEng")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.measurementPointKhmer")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {additionalPoints.map((point, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="text"
                        value={point.panelIndexName}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "panelIndexName",
                            e.target.value
                          )
                        }
                        list={`panel-index-options-${index}`}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                      <datalist id={`panel-index-options-${index}`}>
                        {panelIndexNames.map((item, i) => (
                          <option key={i} value={item.panelIndexName} />
                        ))}
                      </datalist>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="number"
                        value={point.panelIndex}
                        readOnly
                        className="w-full p-1 border border-gray-300 rounded bg-gray-100"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="text"
                        value={point.panelIndexNameKhmer}
                        readOnly
                        className="w-full p-1 border border-gray-300 rounded bg-gray-100"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <select
                        value={point.panelName}
                        onChange={(e) =>
                          handlePointChange(index, "panelName", e.target.value)
                        }
                        className="w-full p-1 border border-gray-300 rounded"
                      >
                        <option value="NA">NA</option>
                        {uniquePanelNames.map((name, i) => (
                          <option key={i} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="text"
                        value={point.panelSide}
                        readOnly
                        className="w-full p-1 border border-gray-300 rounded bg-gray-100"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="text"
                        value={point.panelDirection}
                        readOnly
                        className="w-full p-1 border border-gray-300 rounded bg-gray-100"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="text"
                        value={point.measurementSide}
                        readOnly
                        className="w-full p-1 border border-gray-300 rounded bg-gray-100"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="text"
                        value={point.measurementPointEng}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "measurementPointEng",
                            e.target.value
                          )
                        }
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="text"
                        value={point.measurementPointKhmer}
                        onChange={(e) =>
                          handlePointChange(
                            index,
                            "measurementPointKhmer",
                            e.target.value
                          )
                        }
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleSave}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            {t("cutting.save")}
          </button>
        </div>
      )}
    </div>
  );
};

export default CuttingOrderModify;
