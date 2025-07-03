// import React, { useState } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { useTranslation } from "react-i18next";
// import {
//   FaBuilding,
//   FaEye,
//   FaEyeSlash,
//   FaGlobeAmericas,
//   FaHashtag,
//   FaMinus,
//   FaPlus,
//   FaPrint,
//   FaQrcode,
//   FaRegCheckSquare,
//   FaRegListAlt,
//   FaShoppingCart,
//   FaTag,
//   FaTimes,
//   FaUserTie,
//   FaWarehouse
// } from "react-icons/fa";
// import Select from "react-select"; // Import react-select
// import BluetoothComponent from "../../forms/Bluetooth";
// import MonoSearch from "../../forms/MonoSearch";

// // New component for adding/removing lines
// const AdditionalLinesInput = ({
//   department,
//   additionalLines,
//   setAdditionalLines
// }) => {
//   const { t } = useTranslation();
//   const [lineInput, setLineInput] = useState("");
//   const inputType = department === "Washing" ? "number" : "text";
//   const placeholder =
//     department === "Washing"
//       ? t("bundle.add_line_no_placeholder", "Add Line No...")
//       : t("bundle.add_line_name_placeholder", "Add Line Name...");

//   const handleAddLine = (e) => {
//     e.preventDefault(); // Prevent form submission
//     const trimmedInput = lineInput.trim();
//     if (trimmedInput && !additionalLines.includes(trimmedInput)) {
//       setAdditionalLines([...additionalLines, trimmedInput]);
//       setLineInput("");
//     }
//   };

//   const handleRemoveLine = (lineToRemove) => {
//     setAdditionalLines(additionalLines.filter((line) => line !== lineToRemove));
//   };

//   return (
//     <div>
//       <label className="block text-xs font-medium text-gray-700 mb-1">
//         {t("bundle.add_lines", "Add Lines (Optional)")}
//       </label>
//       <form onSubmit={handleAddLine} className="flex items-center space-x-2">
//         <input
//           type={inputType}
//           value={lineInput}
//           onChange={(e) => setLineInput(e.target.value)}
//           placeholder={placeholder}
//           className="w-full px-3 py-2 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
//           inputMode={inputType === "number" ? "numeric" : "text"}
//         />
//         <button
//           type="submit"
//           className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//         >
//           {t("bundle.add", "Add")}
//         </button>
//       </form>
//       {additionalLines.length > 0 && (
//         <div className="flex flex-wrap gap-2 mt-2 p-2 bg-slate-100 rounded-md">
//           {additionalLines.map((line) => (
//             <span
//               key={line}
//               className="flex items-center bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-1 rounded-full"
//             >
//               {line}
//               <button
//                 type="button"
//                 onClick={() => handleRemoveLine(line)}
//                 className="ml-1.5 text-indigo-500 hover:text-indigo-700"
//               >
//                 <FaTimes size={12} />
//               </button>
//             </span>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// function BundleRegistrationTabData({
//   formData,
//   setFormData,
//   colors,
//   sizes,
//   hasColors,
//   hasSizes,
//   isSubCon,
//   setIsSubCon,
//   subConName,
//   setSubConName,
//   subConFactories,
//   additionalLines,
//   setAdditionalLines,
//   totalBundleQty,
//   estimatedTotal,
//   isMobileDevice,
//   setShowNumberPad,
//   setNumberPadTarget,
//   handleGenerateQR,
//   handlePrintQR,
//   qrData,
//   isGenerateDisabled,
//   isPrinting,
//   setShowQRPreview,
//   bluetoothComponentRef,
//   validateLineNo
// }) {
//   const { t } = useTranslation();
//   const [showOrderDetails, setShowOrderDetails] = useState(false);

//   const toggleOrderDetails = () => {
//     setShowOrderDetails(!showOrderDetails);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     if (name === "count" || name === "bundleQty") {
//       setFormData((prev) => ({
//         ...prev,
//         [name]:
//           value === ""
//             ? ""
//             : parseInt(value, 10) || (name === "bundleQty" ? 1 : 10)
//       }));
//     } else {
//       setFormData((prev) => ({ ...prev, [name]: value }));
//     }
//   };

//   const incrementValue = (field) =>
//     setFormData((prev) => ({
//       ...prev,
//       [field]: (parseInt(prev[field], 10) || 0) + 1
//     }));
//   const decrementValue = (field) =>
//     setFormData((prev) => ({
//       ...prev,
//       [field]: Math.max(1, (parseInt(prev[field], 10) || 1) - 1)
//     }));

//   const QtyInfoDisplay = () => (
//     <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 p-2.5 bg-indigo-50 rounded-lg border border-indigo-200 text-xs sm:text-sm">
//       {formData.sizeOrderQty !== "" && Number(formData.sizeOrderQty) > 0 && (
//         <div className="flex items-center space-x-1.5 text-indigo-700">
//           <FaRegListAlt className="text-indigo-500 flex-shrink-0" />
//           <span className="font-medium whitespace-nowrap">
//             {t("bundle.size_order_qty")}:
//           </span>
//           <span className="truncate">{formData.sizeOrderQty}</span>
//         </div>
//       )}
//       {formData.planCutQty !== "" && Number(formData.planCutQty) > 0 && (
//         <div className="flex items-center space-x-1.5 text-green-700">
//           <FaRegCheckSquare className="text-green-500 flex-shrink-0" />
//           <span className="font-medium whitespace-nowrap">
//             {t("bundle.plan_cut_qty")}:
//           </span>
//           <span className="truncate">{formData.planCutQty}</span>
//         </div>
//       )}
//       {formData.totalGarmentsCount !== undefined && (
//         <div
//           className={`flex items-center space-x-1.5 ${
//             formData.planCutQty > 0 &&
//             formData.totalGarmentsCount > formData.planCutQty
//               ? "text-red-600"
//               : "text-teal-700"
//           }`}
//         >
//           <FaWarehouse
//             className={`${
//               formData.planCutQty > 0 &&
//               formData.totalGarmentsCount > formData.planCutQty
//                 ? "text-red-500"
//                 : "text-teal-500"
//             } flex-shrink-0`}
//           />
//           <span className="font-medium whitespace-nowrap">
//             {t("bundle.total_garment_count")}:
//           </span>
//           <span className="truncate">{formData.totalGarmentsCount}</span>
//         </div>
//       )}
//     </div>
//   );

//   const mobileInputClass =
//     "w-full px-3 py-2 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-slate-100";
//   const laptopReadOnlyInputClass =
//     "w-full px-4 py-2.5 bg-slate-100 border-gray-300 rounded-lg cursor-pointer focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm";
//   const laptopNumericInputClass =
//     "w-full px-3 py-2.5 bg-slate-100 text-center cursor-pointer focus:outline-none text-sm";

//   const RegistrationFormContent = ({ forMobile }) => {
//     // --- FIX IS HERE: selectStyles is now defined inside the component ---
//     const selectStyles = {
//       control: (provided) => ({
//         ...provided,
//         minHeight: forMobile ? "40px" : "42px", // Now `forMobile` is defined
//         fontSize: "0.875rem",
//         borderRadius: "0.375rem",
//         boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
//       }),
//       menu: (provided) => ({ ...provided, zIndex: 20 })
//     };
//     // --- END OF FIX ---

//     return (
//       <div
//         className={`bg-white rounded-xl shadow-xl p-4 space-y-4 ${
//           forMobile ? "" : "md:p-8 md:space-y-6"
//         }`}
//       >
//         <div
//           className={`flex items-end ${forMobile ? "space-x-2" : "space-x-4"}`}
//         >
//           <div className="flex-grow">
//             <label
//               className={`block font-medium text-gray-700 mb-1 ${
//                 forMobile ? "text-xs" : "text-sm mb-1.5"
//               }`}
//             >
//               {t("bundle.date")}
//             </label>
//             <DatePicker
//               selected={formData.date}
//               onChange={(date) =>
//                 setFormData((prev) => ({ ...prev, date: date || new Date() }))
//               }
//               className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm ${
//                 forMobile ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm"
//               }`}
//               dateFormat="yyyy-MM-dd"
//               readOnly={isMobileDevice} // PREVENT KEYBOARD ON MOBILE
//             />
//           </div>
//           <div className={`${forMobile ? "self-end pb-px" : ""}`}>
//             <BluetoothComponent ref={bluetoothComponentRef} />
//           </div>
//         </div>

//         <div
//           className={`grid gap-4 ${
//             forMobile ? "grid-cols-2" : "md:grid-cols-2 md:gap-x-8 md:gap-y-6"
//           }`}
//         >
//           <div>
//             <label
//               className={`block font-medium text-gray-700 mb-1 ${
//                 forMobile ? "text-xs" : "text-sm mb-1.5"
//               }`}
//             >
//               {t("bundle.department")}
//             </label>
//             <select
//               value={formData.department}
//               onChange={(e) =>
//                 setFormData((prev) => ({ ...prev, department: e.target.value }))
//               }
//               className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm ${
//                 forMobile ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm"
//               }`}
//             >
//               <option value="">{t("bundle.select_department")}</option>
//               <option value="QC1 Endline">{t("bundle.qc1_endline")}</option>
//               <option value="Washing">{t("bundle.washing")}</option>
//               <option value="Sub-con">{t("bundle.sub_con")}</option>
//             </select>
//           </div>
//           <div>
//             <label
//               className={`block font-medium text-gray-700 mb-1 ${
//                 forMobile ? "text-xs" : "text-sm mb-1.5"
//               }`}
//             >
//               {t("bundle.search_mono")}
//             </label>
//             <MonoSearch
//               value={formData.selectedMono}
//               onSelect={(mono) =>
//                 setFormData((prev) => ({ ...prev, selectedMono: mono }))
//               }
//               placeholder={t(
//                 "bundle.search_mono_placeholder",
//                 "Search MONo..."
//               )}
//               showSearchIcon={true}
//               closeOnOutsideClick={true}
//               inputClassName={`shadow-sm ${
//                 forMobile ? "text-sm" : "text-sm py-2.5"
//               }`}
//             />
//           </div>
//         </div>

//         {formData.selectedMono && (
//           <div
//             className={`p-3 bg-slate-50 rounded-lg border border-slate-200 ${
//               forMobile ? "mb-3" : "my-5 md:p-5 md:rounded-xl md:shadow"
//             }`}
//           >
//             <div className="flex justify-between items-center mb-1 md:mb-3">
//               <h2
//                 className={`font-semibold text-gray-800 ${
//                   forMobile ? "text-sm" : "text-xl"
//                 }`}
//               >
//                 {t("bundle.order_details")}
//               </h2>
//               <button
//                 onClick={toggleOrderDetails}
//                 className={`text-indigo-500 hover:text-indigo-700 p-1 ${
//                   forMobile
//                     ? "text-lg"
//                     : "text-2xl md:p-1.5 md:rounded-full md:hover:bg-indigo-100 transition-colors"
//                 }`}
//               >
//                 {showOrderDetails ? <FaEyeSlash /> : <FaEye />}
//               </button>
//             </div>
//             {showOrderDetails && (
//               <div
//                 className={`grid gap-x-3 gap-y-2 text-gray-700 mt-2 ${
//                   forMobile
//                     ? "grid-cols-2 text-xs"
//                     : "md:grid-cols-3 md:gap-y-3 md:text-sm md:mt-3"
//                 }`}
//               >
//                 <p className="flex items-center space-x-1.5">
//                   <FaHashtag
//                     className={`text-indigo-500 ${forMobile ? "" : "text-lg"}`}
//                   />
//                   <span className="font-medium">
//                     {t("bundle.selected_mono")}:
//                   </span>
//                   <span>{formData.selectedMono}</span>
//                 </p>
//                 <p className="flex items-center space-x-1.5">
//                   <FaTag
//                     className={`text-indigo-500 ${forMobile ? "" : "text-lg"}`}
//                   />
//                   <span className="font-medium">
//                     {t("bundle.customer_style")}:
//                   </span>
//                   <span>{formData.custStyle}</span>
//                 </p>
//                 <p className="flex items-center space-x-1.5">
//                   <FaUserTie
//                     className={`text-indigo-500 ${forMobile ? "" : "text-lg"}`}
//                   />
//                   <span className="font-medium">{t("bundle.buyer")}:</span>
//                   <span>{formData.buyer}</span>
//                 </p>
//                 <p className="flex items-center space-x-1.5">
//                   <FaGlobeAmericas
//                     className={`text-indigo-500 ${forMobile ? "" : "text-lg"}`}
//                   />
//                   <span className="font-medium">{t("bundle.country")}:</span>
//                   <span>{formData.country}</span>
//                 </p>
//                 <p className="flex items-center space-x-1.5">
//                   <FaShoppingCart
//                     className={`text-indigo-500 ${forMobile ? "" : "text-lg"}`}
//                   />
//                   <span className="font-medium">{t("bundle.order_qty")}:</span>
//                   <span>{formData.orderQty}</span>
//                 </p>
//                 <p className="flex items-center space-x-1.5">
//                   <FaBuilding
//                     className={`text-indigo-500 ${forMobile ? "" : "text-lg"}`}
//                   />
//                   <span className="font-medium">{t("bundle.factory")}:</span>
//                   <span>{formData.factoryInfo}</span>
//                 </p>
//               </div>
//             )}
//           </div>
//         )}

//         {/* --- NEW LINE NO SECTION --- */}

//         {/* SCENARIO 1: Washing or Sub-con Department */}
//         {(formData.department === "Washing" ||
//           formData.department === "Sub-con") && (
//           <div className="space-y-4">
//             <div>
//               <label
//                 className={`block font-medium text-gray-700 mb-1 ${
//                   forMobile ? "text-xs" : "text-sm mb-1.5"
//                 }`}
//               >
//                 {t("bundle.line_no")}
//               </label>
//               <input
//                 type="text"
//                 value={
//                   additionalLines.length > 0
//                     ? `${formData.lineNo} (${additionalLines.join(",")})`
//                     : formData.lineNo
//                 }
//                 readOnly
//                 className={`${
//                   forMobile ? mobileInputClass : laptopReadOnlyInputClass
//                 } bg-slate-200 cursor-default`}
//               />
//             </div>
//             <AdditionalLinesInput
//               department={formData.department}
//               additionalLines={additionalLines}
//               setAdditionalLines={setAdditionalLines}
//             />
//           </div>
//         )}

//         {/* SCENARIO 2: QC1 Endline Department */}
//         {formData.department === "QC1 Endline" && (
//           <div>
//             <label
//               className={`block font-medium text-gray-700 mb-1 ${
//                 forMobile ? "text-xs" : "text-sm mb-1.5"
//               }`}
//             >
//               {t("bundle.line_no", "Line No")}
//             </label>
//             {isMobileDevice ? (
//               <input
//                 type="number"
//                 name="lineNo"
//                 value={formData.lineNo}
//                 onChange={handleInputChange}
//                 className={mobileInputClass}
//                 placeholder="1-30"
//                 inputMode="numeric"
//               />
//             ) : (
//               <input
//                 type="text"
//                 value={formData.lineNo}
//                 onClick={() => {
//                   setNumberPadTarget("lineNo");
//                   setShowNumberPad(true);
//                 }}
//                 readOnly
//                 className={`${laptopReadOnlyInputClass} cursor-pointer bg-slate-100`}
//                 placeholder="1-30"
//               />
//             )}
//           </div>
//         )}

//         {/* SCENARIO 3: No specific department or a different one */}
//         {formData.department !== "Washing" &&
//           formData.department !== "Sub-con" &&
//           formData.department !== "QC1 Endline" && (
//             <div>
//               <label
//                 className={`block font-medium text-gray-700 mb-1 ${
//                   forMobile ? "text-xs" : "text-sm mb-1.5"
//                 }`}
//               >
//                 {t("bundle.line_no")}
//               </label>
//               <input
//                 type="text"
//                 value={formData.lineNo}
//                 readOnly
//                 className={`${
//                   forMobile ? mobileInputClass : laptopReadOnlyInputClass
//                 } bg-slate-200 cursor-default`}
//                 placeholder={t(
//                   "bundle.select_dept_first",
//                   "Select Department First"
//                 )}
//               />
//             </div>
//           )}
//         <div
//           className={`grid gap-x-3 gap-y-4 ${
//             forMobile ? "grid-cols-2" : "md:grid-cols-2 md:gap-x-8 md:gap-y-6"
//           }`}
//         >
//           <div>
//             <label
//               className={`block font-medium text-gray-700 mb-1 ${
//                 forMobile ? "text-xs" : "text-sm mb-1.5"
//               }`}
//             >
//               {t("bundle.color")}
//             </label>
//             {hasColors ? (
//               <select
//                 value={formData.color}
//                 onChange={(e) => {
//                   const d = colors.find((c) => c.original === e.target.value);
//                   setFormData((p) => ({
//                     ...p,
//                     color: e.target.value,
//                     colorCode: d?.code || "",
//                     chnColor: d?.chn || "",
//                     colorKey: d?.key || "",
//                     size: "",
//                     sizeOrderQty: "",
//                     planCutQty: ""
//                   }));
//                 }}
//                 className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm ${
//                   forMobile ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm"
//                 }`}
//               >
//                 <option value="">{t("bundle.select_color")}</option>
//                 {colors.map((c) => (
//                   <option key={c.original} value={c.original}>
//                     {c.original}
//                   </option>
//                 ))}
//               </select>
//             ) : (
//               <p
//                 className={`text-gray-500 ${
//                   forMobile ? "text-xs py-2.5" : "text-sm pt-3"
//                 }`}
//               >
//                 {formData.selectedMono
//                   ? t("bundle.no_colors_available")
//                   : t("bundle.select_mono_first")}
//               </p>
//             )}
//           </div>
//           <div>
//             <label
//               className={`block font-medium text-gray-700 mb-1 ${
//                 forMobile ? "text-xs" : "text-sm mb-1.5"
//               }`}
//             >
//               {t("bundle.size")}
//             </label>
//             {hasColors && formData.color ? (
//               hasSizes ? (
//                 <select
//                   value={formData.size}
//                   onChange={(e) => {
//                     const d = sizes.find((s) => s.size === e.target.value);
//                     setFormData((p) => ({
//                       ...p,
//                       size: e.target.value,
//                       sizeOrderQty: d?.orderQty || 0,
//                       planCutQty: d?.planCutQty || 0
//                     }));
//                   }}
//                   className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm ${
//                     forMobile ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm"
//                   }`}
//                 >
//                   <option value="">{t("bundle.select_size")}</option>
//                   {sizes.map((sObj) => (
//                     <option key={sObj.size} value={sObj.size}>
//                       {sObj.size}
//                     </option>
//                   ))}
//                 </select>
//               ) : (
//                 <p
//                   className={`text-gray-500 ${
//                     forMobile ? "text-xs py-2.5" : "text-sm pt-3"
//                   }`}
//                 >
//                   {t("bundle.no_sizes_available")}
//                 </p>
//               )
//             ) : (
//               <p
//                 className={`text-gray-500 ${
//                   forMobile ? "text-xs py-2.5" : "text-sm pt-3"
//                 }`}
//               >
//                 {formData.selectedMono
//                   ? t("bundle.select_color_first")
//                   : t("bundle.select_mono_color_first")}
//               </p>
//             )}
//           </div>
//         </div>

//         {(formData.sizeOrderQty !== "" ||
//           formData.planCutQty !== "" ||
//           formData.totalGarmentsCount !== undefined) && <QtyInfoDisplay />}

//         <div
//           className={`grid gap-4 ${
//             forMobile ? "grid-cols-2" : "md:grid-cols-2 md:gap-x-8 md:gap-y-6"
//           }`}
//         >
//           <div>
//             <label
//               className={`block font-medium text-gray-700 mb-1 ${
//                 forMobile ? "text-xs" : "text-sm mb-1.5"
//               }`}
//             >
//               {t("bundle.count")}
//             </label>
//             {isMobileDevice ? (
//               <input
//                 type="number"
//                 name="count"
//                 value={formData.count}
//                 onChange={handleInputChange}
//                 inputMode="numeric"
//                 pattern="[0-9]*"
//                 className={mobileInputClass}
//               />
//             ) : (
//               <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
//                 <button
//                   type="button"
//                   onClick={() => decrementValue("count")}
//                   className={`bg-slate-200 hover:bg-slate-300 rounded-l-lg text-slate-700 focus:outline-none ${
//                     forMobile ? "px-3 py-2" : "px-4 py-2.5"
//                   }`}
//                 >
//                   <FaMinus size={forMobile ? 12 : undefined} />
//                 </button>
//                 <input
//                   type="text"
//                   value={formData.count}
//                   onClick={() => {
//                     setNumberPadTarget("count");
//                     setShowNumberPad(true);
//                   }}
//                   readOnly
//                   className={`${
//                     forMobile
//                       ? "w-full px-2 py-2 text-sm"
//                       : laptopNumericInputClass
//                   } bg-slate-100 text-center cursor-pointer focus:outline-none`}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => incrementValue("count")}
//                   className={`bg-slate-200 hover:bg-slate-300 rounded-r-lg text-slate-700 focus:outline-none ${
//                     forMobile ? "px-3 py-2" : "px-4 py-2.5"
//                   }`}
//                 >
//                   <FaPlus size={forMobile ? 12 : undefined} />
//                 </button>
//               </div>
//             )}
//           </div>
//           <div>
//             <label
//               className={`block font-medium text-gray-700 mb-1 ${
//                 forMobile ? "text-xs" : "text-sm mb-1.5"
//               }`}
//             >
//               {t("bundle.bundle_qty")}
//             </label>
//             {isMobileDevice ? (
//               <input
//                 type="number"
//                 name="bundleQty"
//                 value={formData.bundleQty}
//                 onChange={handleInputChange}
//                 inputMode="numeric"
//                 pattern="[0-9]*"
//                 className={mobileInputClass}
//               />
//             ) : (
//               <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
//                 <button
//                   type="button"
//                   onClick={() => decrementValue("bundleQty")}
//                   className={`bg-slate-200 hover:bg-slate-300 rounded-l-lg text-slate-700 focus:outline-none ${
//                     forMobile ? "px-3 py-2" : "px-4 py-2.5"
//                   }`}
//                 >
//                   <FaMinus size={forMobile ? 12 : undefined} />
//                 </button>
//                 <input
//                   type="text"
//                   value={formData.bundleQty}
//                   onClick={() => {
//                     setNumberPadTarget("bundleQty");
//                     setShowNumberPad(true);
//                   }}
//                   readOnly
//                   className={`${
//                     forMobile
//                       ? "w-full px-2 py-2 text-sm"
//                       : laptopNumericInputClass
//                   } bg-slate-100 text-center cursor-pointer focus:outline-none`}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => incrementValue("bundleQty")}
//                   className={`bg-slate-200 hover:bg-slate-300 rounded-r-lg text-slate-700 focus:outline-none ${
//                     forMobile ? "px-3 py-2" : "px-4 py-2.5"
//                   }`}
//                 >
//                   <FaPlus size={forMobile ? 12 : undefined} />
//                 </button>
//               </div>
//             )}
//             {formData.selectedMono && (
//               <p
//                 className={`mt-1 text-gray-600 ${
//                   forMobile ? "text-xs" : "text-sm mt-2"
//                 }`}
//               >
//                 {t("bundle.total_registered_bundle_qty")}: {totalBundleQty}
//               </p>
//             )}
//           </div>
//         </div>

//         {/* --- NEW SUB-CON SECTION --- */}
//         {formData.department === "Washing" && (
//           <div className="space-y-3 p-3 bg-slate-50 rounded-lg border">
//             <label className="block text-sm font-medium text-gray-700">
//               {t("bundle.send_to_sub_con_factory", "Send to Sub Con Factory?")}
//             </label>
//             <div className="flex items-center space-x-4">
//               <label className="inline-flex items-center">
//                 <input
//                   type="radio"
//                   name="isSubCon"
//                   checked={!isSubCon}
//                   onChange={() => {
//                     setIsSubCon(false);
//                     setSubConName("");
//                   }}
//                   className="form-radio h-4 w-4 text-indigo-600"
//                 />
//                 <span className="ml-2">{t("no", "No")}</span>
//               </label>
//               <label className="inline-flex items-center">
//                 <input
//                   type="radio"
//                   name="isSubCon"
//                   checked={isSubCon}
//                   onChange={() => setIsSubCon(true)}
//                   className="form-radio h-4 w-4 text-indigo-600"
//                 />
//                 <span className="ml-2">{t("yes", "Yes")}</span>
//               </label>
//             </div>
//             {isSubCon && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   {t(
//                     "bundle.sub_con_factory_name_send",
//                     "Sub Con Factory Name (Send)"
//                   )}
//                 </label>
//                 <Select
//                   options={subConFactories}
//                   value={subConFactories.find((f) => f.value === subConName)}
//                   onChange={(selectedOption) =>
//                     setSubConName(selectedOption ? selectedOption.value : "")
//                   }
//                   isClearable
//                   isSearchable
//                   placeholder={t(
//                     "bundle.select_or_search_factory",
//                     "Select or search factory..."
//                   )}
//                   styles={selectStyles}
//                 />
//               </div>
//             )}
//           </div>
//         )}

//         {formData.department === "Sub-con" && (
//           <div className="space-y-3 p-3 bg-slate-50 rounded-lg border">
//             <label className="block text-sm font-medium text-gray-700">
//               {t("bundle.sub_con_factory_receive", "Sub Con Factory (Receive)")}
//             </label>
//             <div className="flex items-center space-x-4">
//               <label className="inline-flex items-center">
//                 <input
//                   type="radio"
//                   checked={true}
//                   readOnly
//                   className="form-radio h-4 w-4 text-indigo-600 bg-gray-200"
//                 />
//                 <span className="ml-2">{t("yes", "Yes")}</span>
//               </label>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t(
//                   "bundle.sub_con_factory_name_receive",
//                   "Sub Con Factory Name (Receive)"
//                 )}
//               </label>
//               <Select
//                 options={subConFactories}
//                 value={subConFactories.find((f) => f.value === subConName)}
//                 onChange={(selectedOption) =>
//                   setSubConName(selectedOption ? selectedOption.value : "")
//                 }
//                 isClearable
//                 isSearchable
//                 placeholder={t(
//                   "bundle.select_or_search_factory_optional",
//                   "Select or search (Optional)..."
//                 )}
//                 styles={selectStyles}
//               />
//             </div>
//           </div>
//         )}

//         {formData.planCutQty !== undefined && estimatedTotal !== null && (
//           <div
//             className={`font-medium p-2 rounded-md ${
//               forMobile ? "mt-2 text-xs" : "mt-5 text-sm p-3.5"
//             } ${
//               formData.planCutQty > 0 && estimatedTotal > formData.planCutQty
//                 ? "bg-red-100 text-red-700 border border-red-300"
//                 : "bg-green-100 text-green-700 border border-green-300"
//             }`}
//           >
//             {formData.planCutQty > 0 && estimatedTotal > formData.planCutQty
//               ? `⚠️ ${t("bundle.actual_cut_qty_exceeds", {
//                   actual: estimatedTotal,
//                   plan: formData.planCutQty
//                 })}`
//               : `✅ ${t("bundle.actual_cut_qty_within", {
//                   actual: estimatedTotal,
//                   plan: formData.planCutQty > 0 ? formData.planCutQty : "N/A"
//                 })}`}
//           </div>
//         )}

//         {/* QR Action Buttons Section */}
//         <div
//           className={`flex pt-4 ${
//             forMobile
//               ? "space-x-1.5"
//               : "justify-between items-center mt-6 border-t border-gray-300 pt-6"
//           }`}
//         >
//           <div
//             className={`flex ${forMobile ? "w-full space-x-1.5" : "space-x-4"}`}
//           >
//             <button
//               type="button"
//               onClick={handleGenerateQR}
//               disabled={
//                 isGenerateDisabled ||
//                 !formData.selectedMono ||
//                 !formData.color ||
//                 !formData.size ||
//                 !formData.bundleQty ||
//                 !validateLineNo() ||
//                 !formData.count ||
//                 (estimatedTotal !== null &&
//                   formData.planCutQty > 0 &&
//                   estimatedTotal > formData.planCutQty)
//               }
//               className={`flex items-center justify-center font-semibold transition-colors shadow-md text-white
//                       ${
//                         forMobile
//                           ? "flex-1 px-2 py-2.5 rounded-lg text-xs"
//                           : "px-8 py-3 rounded-lg transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2"
//                       }
//                       ${
//                         !isGenerateDisabled &&
//                         formData.selectedMono &&
//                         formData.color &&
//                         formData.size &&
//                         formData.bundleQty &&
//                         validateLineNo() &&
//                         formData.count &&
//                         !(
//                           estimatedTotal !== null &&
//                           formData.planCutQty > 0 &&
//                           estimatedTotal > formData.planCutQty
//                         )
//                           ? "bg-green-500 hover:bg-green-600 focus:ring-green-500"
//                           : "bg-gray-300 text-gray-500 cursor-not-allowed"
//                       }`}
//             >
//               <FaQrcode className={`${forMobile ? "mr-1" : "mr-2.5"}`} />
//               <span className={forMobile ? "hidden xs:inline" : ""}>
//                 {t("bundle.generate_qr")}
//               </span>
//               <span className={forMobile ? "xs:hidden" : "hidden"}>Gen</span>
//             </button>
//             {qrData.length > 0 && (
//               <>
//                 <button
//                   type="button"
//                   onClick={() => setShowQRPreview(true)}
//                   className={`flex items-center justify-center font-semibold transition-colors shadow-md text-white bg-blue-500 hover:bg-blue-600
//                           ${
//                             forMobile
//                               ? "flex-1 px-2 py-2.5 rounded-lg text-xs"
//                               : "px-8 py-3 rounded-lg transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
//                           }`}
//                 >
//                   <FaEye className={`${forMobile ? "mr-1" : "mr-2.5"}`} />
//                   <span className={forMobile ? "hidden xs:inline" : ""}>
//                     {t("bundle.preview_qr")}
//                   </span>
//                   <span className={forMobile ? "xs:hidden" : "hidden"}>
//                     View
//                   </span>
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handlePrintQR}
//                   disabled={isPrinting}
//                   className={`flex items-center justify-center font-semibold transition-colors shadow-md text-white
//                           ${
//                             forMobile
//                               ? "flex-1 px-2 py-2.5 rounded-lg text-xs"
//                               : "px-8 py-3 rounded-lg transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
//                           }
//                           ${
//                             isPrinting
//                               ? "bg-gray-400 text-gray-600 cursor-not-allowed"
//                               : "bg-teal-500 hover:bg-teal-600 focus:ring-teal-500"
//                           }`}
//                 >
//                   <FaPrint className={`${forMobile ? "mr-1" : "mr-2.5"}`} />
//                   <span className={forMobile ? "hidden xs:inline" : ""}>
//                     {isPrinting ? t("bundle.printing") : t("bundle.print_qr")}
//                   </span>
//                   <span className={forMobile ? "xs:hidden" : "hidden"}>
//                     Print
//                   </span>
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return isMobileDevice ? (
//     <RegistrationFormContent forMobile={true} />
//   ) : (
//     <RegistrationFormContent forMobile={false} />
//   );
// }

// export default BundleRegistrationTabData;

import React, { useState, forwardRef, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import {
  FaBuilding,
  FaEye,
  FaEyeSlash,
  FaGlobeAmericas,
  FaHashtag,
  FaMinus,
  FaPlus,
  FaPrint,
  FaQrcode,
  FaRegCheckSquare,
  FaRegListAlt,
  FaShoppingCart,
  FaTag,
  FaTimes,
  FaUserTie,
  FaWarehouse
} from "react-icons/fa";
import Select from "react-select"; // Import react-select
import BluetoothComponent from "../../forms/Bluetooth";
import MonoSearch from "../../forms/MonoSearch";

import TaskNoFinder from "./TaskNoFinder";

// New component for adding/removing lines
const AdditionalLinesInput = ({
  department,
  additionalLines,
  setAdditionalLines
}) => {
  const { t } = useTranslation();

  const [lineInput, setLineInput] = useState("");
  const inputType = department === "Washing" ? "number" : "text";
  const placeholder =
    department === "Washing"
      ? t("bundle.add_line_no_placeholder", "Add Line No...")
      : t("bundle.add_line_name_placeholder", "Add Line Name...");

  const handleAddLine = (e) => {
    e.preventDefault(); // Prevent form submission
    const trimmedInput = lineInput.trim();
    if (trimmedInput && !additionalLines.includes(trimmedInput)) {
      setAdditionalLines([...additionalLines, trimmedInput]);
      setLineInput("");
    }
  };

  const handleRemoveLine = (lineToRemove) => {
    setAdditionalLines(additionalLines.filter((line) => line !== lineToRemove));
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {t("bundle.add_lines", "Add Lines (Optional)")}
      </label>
      <form onSubmit={handleAddLine} className="flex items-center space-x-2">
        <input
          type={inputType}
          value={lineInput}
          onChange={(e) => setLineInput(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          inputMode={inputType === "number" ? "numeric" : "text"}
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t("bundle.add", "Add")}
        </button>
      </form>
      {additionalLines.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 p-2 bg-slate-100 rounded-md">
          {additionalLines.map((line) => (
            <span
              key={line}
              className="flex items-center bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-1 rounded-full"
            >
              {line}
              <button
                type="button"
                onClick={() => handleRemoveLine(line)}
                className="ml-1.5 text-indigo-500 hover:text-indigo-700"
              >
                <FaTimes size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// --- ToggleSwitch component with this compact version ---
const ToggleSwitch = ({ label, isChecked, onToggle, option1, option2 }) => {
  const { t } = useTranslation();
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative inline-block w-24 h-7 select-none">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onToggle}
          className="absolute block w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className={`h-full w-full flex items-center justify-center rounded-full text-xs font-medium transition-colors duration-200 ease-in-out ${
            isChecked ? "bg-orange-500 text-white" : "bg-green-500 text-white"
          }`}
        >
          <div className="w-1/2 text-center">{t(option1)}</div>
          <div className="w-1/2 text-center">{t(option2)}</div>
        </div>
        <div
          className={`absolute top-0.5 left-0.5 w-[calc(50%-2px)] h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
            isChecked ? "translate-x-[96%]" : "translate-x-0"
          }`}
        ></div>
      </div>
    </div>
  );
};

// Custom Input for DatePicker to prevent mobile keyboard
const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
  <button
    type="button"
    className="w-full text-left border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-xs px-2 py-1.5 md:text-sm md:px-4 md:py-2.5 bg-white"
    onClick={onClick}
    ref={ref}
  >
    {value}
  </button>
));

function BundleRegistrationTabData({
  formData,
  setFormData,
  colors,
  sizes,
  hasColors,
  hasSizes,
  isSubCon,
  setIsSubCon,
  subConName,
  setSubConName,
  subConFactories,
  additionalLines,
  setAdditionalLines,
  totalBundleQty,
  estimatedTotal,
  isMobileDevice,
  setShowNumberPad,
  setNumberPadTarget,
  handleGenerateQR,
  handlePrintQR,
  qrData,
  isGenerateDisabled,
  isPrinting,
  setShowQRPreview,
  // --- DESTRUCTURE NEW PROPS ---
  registrationType,
  setRegistrationType,
  selectedTaskNo,
  setSelectedTaskNo,
  bluetoothComponentRef,
  validateLineNo
}) {
  const { t } = useTranslation();
  // --- DEFINE THE REF HERE, IN THE MAIN COMPONENT BODY ---
  const datePickerRef = useRef(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const toggleOrderDetails = () => {
    setShowOrderDetails(!showOrderDetails);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "count" || name === "bundleQty") {
      setFormData((prev) => ({
        ...prev,
        [name]:
          value === ""
            ? ""
            : parseInt(value, 10) || (name === "bundleQty" ? 1 : 10)
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const incrementValue = (field) =>
    setFormData((prev) => ({
      ...prev,
      [field]: (parseInt(prev[field], 10) || 0) + 1
    }));
  const decrementValue = (field) =>
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(1, (parseInt(prev[field], 10) || 1) - 1)
    }));

  const QtyInfoDisplay = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 p-2.5 bg-indigo-50 rounded-lg border border-indigo-200 text-xs sm:text-sm">
      {formData.sizeOrderQty !== "" && Number(formData.sizeOrderQty) > 0 && (
        <div className="flex items-center space-x-1.5 text-indigo-700">
          <FaRegListAlt className="text-indigo-500 flex-shrink-0" />
          <span className="font-medium whitespace-nowrap">
            {t("bundle.size_order_qty")}:
          </span>
          <span className="truncate">{formData.sizeOrderQty}</span>
        </div>
      )}
      {formData.planCutQty !== "" && Number(formData.planCutQty) > 0 && (
        <div className="flex items-center space-x-1.5 text-green-700">
          <FaRegCheckSquare className="text-green-500 flex-shrink-0" />
          <span className="font-medium whitespace-nowrap">
            {t("bundle.plan_cut_qty")}:
          </span>
          <span className="truncate">{formData.planCutQty}</span>
        </div>
      )}
      {formData.totalGarmentsCount !== undefined && (
        <div
          className={`flex items-center space-x-1.5 ${
            formData.planCutQty > 0 &&
            formData.totalGarmentsCount > formData.planCutQty
              ? "text-red-600"
              : "text-teal-700"
          }`}
        >
          <FaWarehouse
            className={`${
              formData.planCutQty > 0 &&
              formData.totalGarmentsCount > formData.planCutQty
                ? "text-red-500"
                : "text-teal-500"
            } flex-shrink-0`}
          />
          <span className="font-medium whitespace-nowrap">
            {t("bundle.total_garment_count")}:
          </span>
          <span className="truncate">{formData.totalGarmentsCount}</span>
        </div>
      )}
    </div>
  );

  const mobileInputClass =
    "w-full px-3 py-2 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-slate-100";
  const laptopReadOnlyInputClass =
    "w-full px-4 py-2.5 bg-slate-100 border-gray-300 rounded-lg cursor-pointer focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm";
  const laptopNumericInputClass =
    "w-full px-3 py-2.5 bg-slate-100 text-center cursor-pointer focus:outline-none text-sm";

  const RegistrationFormContent = ({ forMobile }) => {
    // selectStyles is now defined inside the component ---
    const selectStyles = {
      control: (provided) => ({
        ...provided,
        minHeight: forMobile ? "40px" : "42px", // Now `forMobile` is defined
        fontSize: "0.875rem",
        borderRadius: "0.375rem",
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
      }),
      menu: (provided) => ({ ...provided, zIndex: 20 })
    };

    return (
      <div
        className={`bg-white rounded-xl shadow-xl p-4 space-y-4 ${
          forMobile ? "" : "md:p-8 md:space-y-6"
        }`}
      >
        {/* --- new single-line grid --- */}
        <div className="grid grid-cols-4 gap-2 items-end md:gap-4">
          {/* 1. Date Picker */}
          <div className="col-span-1">
            <div
              className="block text-xs font-medium text-gray-700 mb-1 cursor-pointer"
              onClick={() => datePickerRef.current.setOpen(true)}
            >
              {t("bundle.date")}
            </div>
            <DatePicker
              ref={datePickerRef}
              selected={formData.date}
              onChange={(date) =>
                setFormData((prev) => ({ ...prev, date: date || new Date() }))
              }
              dateFormat="yyyy-MM-dd"
              customInput={<CustomDateInput />}
              popperPlacement="bottom-start"
            />
          </div>

          {/* 2. Type Toggle */}
          <div className="col-span-1">
            <ToggleSwitch
              label={t("bundle.type", "Type")}
              isChecked={registrationType === "repack"}
              onToggle={() =>
                setRegistrationType((prev) =>
                  prev === "end" ? "repack" : "end"
                )
              }
              option1="bundle.end"
              option2="bundle.repack"
            />
          </div>

          {/* 3. Task No Finder */}
          <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("bundle.task_no", "Task No")}
            </label>
            <TaskNoFinder
              department="Bundle Registration"
              value={selectedTaskNo}
              onChange={setSelectedTaskNo}
              forMobile={forMobile}
            />
          </div>

          {/* 4. Bluetooth Component */}
          <div className="col-span-1 flex justify-center">
            <BluetoothComponent ref={bluetoothComponentRef} />
          </div>
        </div>

        <div
          className={`grid gap-4 ${
            forMobile ? "grid-cols-2" : "md:grid-cols-2 md:gap-x-8 md:gap-y-6"
          }`}
        >
          <div>
            <label
              className={`block font-medium text-gray-700 mb-1 ${
                forMobile ? "text-xs" : "text-sm mb-1.5"
              }`}
            >
              {t("bundle.department")}
            </label>
            <select
              value={formData.department}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, department: e.target.value }))
              }
              className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm ${
                forMobile ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm"
              }`}
            >
              <option value="">{t("bundle.select_department")}</option>
              <option value="QC1 Endline">{t("bundle.qc1_endline")}</option>
              <option value="Washing">{t("bundle.washing")}</option>
              <option value="Sub-con">{t("bundle.sub_con")}</option>
            </select>
          </div>
          <div>
            <label
              className={`block font-medium text-gray-700 mb-1 ${
                forMobile ? "text-xs" : "text-sm mb-1.5"
              }`}
            >
              {t("bundle.search_mono")}
            </label>
            <MonoSearch
              value={formData.selectedMono}
              onSelect={(mono) =>
                setFormData((prev) => ({ ...prev, selectedMono: mono }))
              }
              placeholder={t(
                "bundle.search_mono_placeholder",
                "Search MONo..."
              )}
              showSearchIcon={true}
              closeOnOutsideClick={true}
              inputClassName={`shadow-sm ${
                forMobile ? "text-sm" : "text-sm py-2.5"
              }`}
            />
          </div>
        </div>

        {formData.selectedMono && (
          <div
            className={`p-3 bg-slate-50 rounded-lg border border-slate-200 ${
              forMobile ? "mb-3" : "my-5 md:p-5 md:rounded-xl md:shadow"
            }`}
          >
            <div className="flex justify-between items-center mb-1 md:mb-3">
              <h2
                className={`font-semibold text-gray-800 ${
                  forMobile ? "text-sm" : "text-xl"
                }`}
              >
                {t("bundle.order_details")}
              </h2>
              <button
                onClick={toggleOrderDetails}
                className={`text-indigo-500 hover:text-indigo-700 p-1 ${
                  forMobile
                    ? "text-lg"
                    : "text-2xl md:p-1.5 md:rounded-full md:hover:bg-indigo-100 transition-colors"
                }`}
              >
                {showOrderDetails ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {showOrderDetails && (
              <div
                className={`grid gap-x-3 gap-y-2 text-gray-700 mt-2 ${
                  forMobile
                    ? "grid-cols-2 text-xs"
                    : "md:grid-cols-3 md:gap-y-3 md:text-sm md:mt-3"
                }`}
              >
                <p className="flex items-center space-x-1.5">
                  <FaHashtag
                    className={`text-indigo-500 ${forMobile ? "" : "text-lg"}`}
                  />
                  <span className="font-medium">
                    {t("bundle.selected_mono")}:
                  </span>
                  <span>{formData.selectedMono}</span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <FaTag
                    className={`text-indigo-500 ${forMobile ? "" : "text-lg"}`}
                  />
                  <span className="font-medium">
                    {t("bundle.customer_style")}:
                  </span>
                  <span>{formData.custStyle}</span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <FaUserTie
                    className={`text-indigo-500 ${forMobile ? "" : "text-lg"}`}
                  />
                  <span className="font-medium">{t("bundle.buyer")}:</span>
                  <span>{formData.buyer}</span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <FaGlobeAmericas
                    className={`text-indigo-500 ${forMobile ? "" : "text-lg"}`}
                  />
                  <span className="font-medium">{t("bundle.country")}:</span>
                  <span>{formData.country}</span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <FaShoppingCart
                    className={`text-indigo-500 ${forMobile ? "" : "text-lg"}`}
                  />
                  <span className="font-medium">{t("bundle.order_qty")}:</span>
                  <span>{formData.orderQty}</span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <FaBuilding
                    className={`text-indigo-500 ${forMobile ? "" : "text-lg"}`}
                  />
                  <span className="font-medium">{t("bundle.factory")}:</span>
                  <span>{formData.factoryInfo}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* --- NEW LINE NO SECTION --- */}

        {/* SCENARIO 1: Washing or Sub-con Department */}
        {(formData.department === "Washing" ||
          formData.department === "Sub-con") && (
          <div className="space-y-4">
            <div>
              <label
                className={`block font-medium text-gray-700 mb-1 ${
                  forMobile ? "text-xs" : "text-sm mb-1.5"
                }`}
              >
                {t("bundle.line_no")}
              </label>
              <input
                type="text"
                value={
                  additionalLines.length > 0
                    ? `${formData.lineNo} (${additionalLines.join(",")})`
                    : formData.lineNo
                }
                readOnly
                className={`${
                  forMobile ? mobileInputClass : laptopReadOnlyInputClass
                } bg-slate-200 cursor-default`}
              />
            </div>
            <AdditionalLinesInput
              department={formData.department}
              additionalLines={additionalLines}
              setAdditionalLines={setAdditionalLines}
            />
          </div>
        )}

        {/* SCENARIO 2: QC1 Endline Department */}
        {formData.department === "QC1 Endline" && (
          <div>
            <label
              className={`block font-medium text-gray-700 mb-1 ${
                forMobile ? "text-xs" : "text-sm mb-1.5"
              }`}
            >
              {t("bundle.line_no", "Line No")}
            </label>
            {isMobileDevice ? (
              <input
                type="number"
                name="lineNo"
                value={formData.lineNo}
                onChange={handleInputChange}
                className={mobileInputClass}
                placeholder="1-30"
                inputMode="numeric"
              />
            ) : (
              <input
                type="text"
                value={formData.lineNo}
                onClick={() => {
                  setNumberPadTarget("lineNo");
                  setShowNumberPad(true);
                }}
                readOnly
                className={`${laptopReadOnlyInputClass} cursor-pointer bg-slate-100`}
                placeholder="1-30"
              />
            )}
          </div>
        )}

        {/* SCENARIO 3: No specific department or a different one */}
        {formData.department !== "Washing" &&
          formData.department !== "Sub-con" &&
          formData.department !== "QC1 Endline" && (
            <div>
              <label
                className={`block font-medium text-gray-700 mb-1 ${
                  forMobile ? "text-xs" : "text-sm mb-1.5"
                }`}
              >
                {t("bundle.line_no")}
              </label>
              <input
                type="text"
                value={formData.lineNo}
                readOnly
                className={`${
                  forMobile ? mobileInputClass : laptopReadOnlyInputClass
                } bg-slate-200 cursor-default`}
                placeholder={t(
                  "bundle.select_dept_first",
                  "Select Department First"
                )}
              />
            </div>
          )}
        <div
          className={`grid gap-x-3 gap-y-4 ${
            forMobile ? "grid-cols-2" : "md:grid-cols-2 md:gap-x-8 md:gap-y-6"
          }`}
        >
          <div>
            <label
              className={`block font-medium text-gray-700 mb-1 ${
                forMobile ? "text-xs" : "text-sm mb-1.5"
              }`}
            >
              {t("bundle.color")}
            </label>
            {hasColors ? (
              <select
                value={formData.color}
                onChange={(e) => {
                  const d = colors.find((c) => c.original === e.target.value);
                  setFormData((p) => ({
                    ...p,
                    color: e.target.value,
                    colorCode: d?.code || "",
                    chnColor: d?.chn || "",
                    colorKey: d?.key || "",
                    size: "",
                    sizeOrderQty: "",
                    planCutQty: ""
                  }));
                }}
                className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm ${
                  forMobile ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm"
                }`}
              >
                <option value="">{t("bundle.select_color")}</option>
                {colors.map((c) => (
                  <option key={c.original} value={c.original}>
                    {c.original}
                  </option>
                ))}
              </select>
            ) : (
              <p
                className={`text-gray-500 ${
                  forMobile ? "text-xs py-2.5" : "text-sm pt-3"
                }`}
              >
                {formData.selectedMono
                  ? t("bundle.no_colors_available")
                  : t("bundle.select_mono_first")}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block font-medium text-gray-700 mb-1 ${
                forMobile ? "text-xs" : "text-sm mb-1.5"
              }`}
            >
              {t("bundle.size")}
            </label>
            {hasColors && formData.color ? (
              hasSizes ? (
                <select
                  value={formData.size}
                  onChange={(e) => {
                    const d = sizes.find((s) => s.size === e.target.value);
                    setFormData((p) => ({
                      ...p,
                      size: e.target.value,
                      sizeOrderQty: d?.orderQty || 0,
                      planCutQty: d?.planCutQty || 0
                    }));
                  }}
                  className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm ${
                    forMobile ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm"
                  }`}
                >
                  <option value="">{t("bundle.select_size")}</option>
                  {sizes.map((sObj) => (
                    <option key={sObj.size} value={sObj.size}>
                      {sObj.size}
                    </option>
                  ))}
                </select>
              ) : (
                <p
                  className={`text-gray-500 ${
                    forMobile ? "text-xs py-2.5" : "text-sm pt-3"
                  }`}
                >
                  {t("bundle.no_sizes_available")}
                </p>
              )
            ) : (
              <p
                className={`text-gray-500 ${
                  forMobile ? "text-xs py-2.5" : "text-sm pt-3"
                }`}
              >
                {formData.selectedMono
                  ? t("bundle.select_color_first")
                  : t("bundle.select_mono_color_first")}
              </p>
            )}
          </div>
        </div>

        {(formData.sizeOrderQty !== "" ||
          formData.planCutQty !== "" ||
          formData.totalGarmentsCount !== undefined) && <QtyInfoDisplay />}

        <div
          className={`grid gap-4 ${
            forMobile ? "grid-cols-2" : "md:grid-cols-2 md:gap-x-8 md:gap-y-6"
          }`}
        >
          <div>
            <label
              className={`block font-medium text-gray-700 mb-1 ${
                forMobile ? "text-xs" : "text-sm mb-1.5"
              }`}
            >
              {t("bundle.count")}
            </label>
            {isMobileDevice ? (
              <input
                type="number"
                name="count"
                value={formData.count}
                onChange={handleInputChange}
                inputMode="numeric"
                pattern="[0-9]*"
                className={mobileInputClass}
              />
            ) : (
              <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                <button
                  type="button"
                  onClick={() => decrementValue("count")}
                  className={`bg-slate-200 hover:bg-slate-300 rounded-l-lg text-slate-700 focus:outline-none ${
                    forMobile ? "px-3 py-2" : "px-4 py-2.5"
                  }`}
                >
                  <FaMinus size={forMobile ? 12 : undefined} />
                </button>
                <input
                  type="text"
                  value={formData.count}
                  onClick={() => {
                    setNumberPadTarget("count");
                    setShowNumberPad(true);
                  }}
                  readOnly
                  className={`${
                    forMobile
                      ? "w-full px-2 py-2 text-sm"
                      : laptopNumericInputClass
                  } bg-slate-100 text-center cursor-pointer focus:outline-none`}
                />
                <button
                  type="button"
                  onClick={() => incrementValue("count")}
                  className={`bg-slate-200 hover:bg-slate-300 rounded-r-lg text-slate-700 focus:outline-none ${
                    forMobile ? "px-3 py-2" : "px-4 py-2.5"
                  }`}
                >
                  <FaPlus size={forMobile ? 12 : undefined} />
                </button>
              </div>
            )}
          </div>
          <div>
            <label
              className={`block font-medium text-gray-700 mb-1 ${
                forMobile ? "text-xs" : "text-sm mb-1.5"
              }`}
            >
              {t("bundle.bundle_qty")}
            </label>
            {isMobileDevice ? (
              <input
                type="number"
                name="bundleQty"
                value={formData.bundleQty}
                onChange={handleInputChange}
                inputMode="numeric"
                pattern="[0-9]*"
                className={mobileInputClass}
              />
            ) : (
              <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                <button
                  type="button"
                  onClick={() => decrementValue("bundleQty")}
                  className={`bg-slate-200 hover:bg-slate-300 rounded-l-lg text-slate-700 focus:outline-none ${
                    forMobile ? "px-3 py-2" : "px-4 py-2.5"
                  }`}
                >
                  <FaMinus size={forMobile ? 12 : undefined} />
                </button>
                <input
                  type="text"
                  value={formData.bundleQty}
                  onClick={() => {
                    setNumberPadTarget("bundleQty");
                    setShowNumberPad(true);
                  }}
                  readOnly
                  className={`${
                    forMobile
                      ? "w-full px-2 py-2 text-sm"
                      : laptopNumericInputClass
                  } bg-slate-100 text-center cursor-pointer focus:outline-none`}
                />
                <button
                  type="button"
                  onClick={() => incrementValue("bundleQty")}
                  className={`bg-slate-200 hover:bg-slate-300 rounded-r-lg text-slate-700 focus:outline-none ${
                    forMobile ? "px-3 py-2" : "px-4 py-2.5"
                  }`}
                >
                  <FaPlus size={forMobile ? 12 : undefined} />
                </button>
              </div>
            )}
            {formData.selectedMono && (
              <p
                className={`mt-1 text-gray-600 ${
                  forMobile ? "text-xs" : "text-sm mt-2"
                }`}
              >
                {t("bundle.total_registered_bundle_qty")}: {totalBundleQty}
              </p>
            )}
          </div>
        </div>

        {/* --- NEW SUB-CON SECTION --- */}
        {formData.department === "Washing" && (
          <div className="space-y-3 p-3 bg-slate-50 rounded-lg border">
            <label className="block text-sm font-medium text-gray-700">
              {t("bundle.send_to_sub_con_factory", "Send to Sub Con Factory?")}
            </label>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="isSubCon"
                  checked={!isSubCon}
                  onChange={() => {
                    setIsSubCon(false);
                    setSubConName("");
                  }}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">{t("no", "No")}</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="isSubCon"
                  checked={isSubCon}
                  onChange={() => setIsSubCon(true)}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">{t("yes", "Yes")}</span>
              </label>
            </div>
            {isSubCon && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(
                    "bundle.sub_con_factory_name_send",
                    "Sub Con Factory Name (Send)"
                  )}
                </label>
                <Select
                  options={subConFactories}
                  value={subConFactories.find((f) => f.value === subConName)}
                  onChange={(selectedOption) =>
                    setSubConName(selectedOption ? selectedOption.value : "")
                  }
                  isClearable
                  isSearchable
                  placeholder={t(
                    "bundle.select_or_search_factory",
                    "Select or search factory..."
                  )}
                  styles={selectStyles}
                />
              </div>
            )}
          </div>
        )}

        {formData.department === "Sub-con" && (
          <div className="space-y-3 p-3 bg-slate-50 rounded-lg border">
            <label className="block text-sm font-medium text-gray-700">
              {t("bundle.sub_con_factory_receive", "Sub Con Factory (Receive)")}
            </label>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={true}
                  readOnly
                  className="form-radio h-4 w-4 text-indigo-600 bg-gray-200"
                />
                <span className="ml-2">{t("yes", "Yes")}</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(
                  "bundle.sub_con_factory_name_receive",
                  "Sub Con Factory Name (Receive)"
                )}
              </label>
              <Select
                options={subConFactories}
                value={subConFactories.find((f) => f.value === subConName)}
                onChange={(selectedOption) =>
                  setSubConName(selectedOption ? selectedOption.value : "")
                }
                isClearable
                isSearchable
                placeholder={t(
                  "bundle.select_or_search_factory_optional",
                  "Select or search (Optional)..."
                )}
                styles={selectStyles}
              />
            </div>
          </div>
        )}

        {formData.planCutQty !== undefined && estimatedTotal !== null && (
          <div
            className={`font-medium p-2 rounded-md ${
              forMobile ? "mt-2 text-xs" : "mt-5 text-sm p-3.5"
            } ${
              formData.planCutQty > 0 && estimatedTotal > formData.planCutQty
                ? "bg-red-100 text-red-700 border border-red-300"
                : "bg-green-100 text-green-700 border border-green-300"
            }`}
          >
            {formData.planCutQty > 0 && estimatedTotal > formData.planCutQty
              ? `⚠️ ${t("bundle.actual_cut_qty_exceeds", {
                  actual: estimatedTotal,
                  plan: formData.planCutQty
                })}`
              : `✅ ${t("bundle.actual_cut_qty_within", {
                  actual: estimatedTotal,
                  plan: formData.planCutQty > 0 ? formData.planCutQty : "N/A"
                })}`}
          </div>
        )}

        {/* QR Action Buttons Section */}
        <div
          className={`flex pt-4 ${
            forMobile
              ? "space-x-1.5"
              : "justify-between items-center mt-6 border-t border-gray-300 pt-6"
          }`}
        >
          <div
            className={`flex ${forMobile ? "w-full space-x-1.5" : "space-x-4"}`}
          >
            <button
              type="button"
              onClick={handleGenerateQR}
              disabled={
                isGenerateDisabled ||
                !formData.selectedMono ||
                !formData.color ||
                !formData.size ||
                !formData.bundleQty ||
                !validateLineNo() ||
                !formData.count ||
                (estimatedTotal !== null &&
                  formData.planCutQty > 0 &&
                  estimatedTotal > formData.planCutQty)
              }
              className={`flex items-center justify-center font-semibold transition-colors shadow-md text-white
                      ${
                        forMobile
                          ? "flex-1 px-2 py-2.5 rounded-lg text-xs"
                          : "px-8 py-3 rounded-lg transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2"
                      } 
                      ${
                        !isGenerateDisabled &&
                        formData.selectedMono &&
                        formData.color &&
                        formData.size &&
                        formData.bundleQty &&
                        validateLineNo() &&
                        formData.count &&
                        !(
                          estimatedTotal !== null &&
                          formData.planCutQty > 0 &&
                          estimatedTotal > formData.planCutQty
                        )
                          ? "bg-green-500 hover:bg-green-600 focus:ring-green-500"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
            >
              <FaQrcode className={`${forMobile ? "mr-1" : "mr-2.5"}`} />
              <span className={forMobile ? "hidden xs:inline" : ""}>
                {t("bundle.generate_qr")}
              </span>
              <span className={forMobile ? "xs:hidden" : "hidden"}>Gen</span>
            </button>
            {qrData.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setShowQRPreview(true)}
                  className={`flex items-center justify-center font-semibold transition-colors shadow-md text-white bg-blue-500 hover:bg-blue-600
                          ${
                            forMobile
                              ? "flex-1 px-2 py-2.5 rounded-lg text-xs"
                              : "px-8 py-3 rounded-lg transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          }`}
                >
                  <FaEye className={`${forMobile ? "mr-1" : "mr-2.5"}`} />
                  <span className={forMobile ? "hidden xs:inline" : ""}>
                    {t("bundle.preview_qr")}
                  </span>
                  <span className={forMobile ? "xs:hidden" : "hidden"}>
                    View
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintQR}
                  disabled={isPrinting}
                  className={`flex items-center justify-center font-semibold transition-colors shadow-md text-white
                          ${
                            forMobile
                              ? "flex-1 px-2 py-2.5 rounded-lg text-xs"
                              : "px-8 py-3 rounded-lg transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                          }
                          ${
                            isPrinting
                              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                              : "bg-teal-500 hover:bg-teal-600 focus:ring-teal-500"
                          }`}
                >
                  <FaPrint className={`${forMobile ? "mr-1" : "mr-2.5"}`} />
                  <span className={forMobile ? "hidden xs:inline" : ""}>
                    {isPrinting ? t("bundle.printing") : t("bundle.print_qr")}
                  </span>
                  <span className={forMobile ? "xs:hidden" : "hidden"}>
                    Print
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return isMobileDevice ? (
    <RegistrationFormContent forMobile={true} />
  ) : (
    <RegistrationFormContent forMobile={false} />
  );
}

export default BundleRegistrationTabData;
