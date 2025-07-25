// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import Select from "react-select";
// import { useAuth } from "../components/authentication/AuthContext";
// import { API_BASE_URL } from "../../config";
// import { Plus, Minus } from "lucide-react";

// // Reusable Page Title Component (assuming it's generic enough)
// const PageTitle = ({ user }) => (
//   <div className="text-center mb-8">
//     <h1 className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
//       Yorkmars (Cambodia) Garment MFG Co., LTD
//     </h1>
//     <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
//       ANF Digital Measurement
//       {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
//     </p>
//   </div>
// );

// // Component for the +/- buttons and input field
// const ValueInputCell = ({
//   value,
//   onIncrement,
//   onDecrement,
//   onManualChange
// }) => {
//   return (
//     <div className="flex items-center justify-center space-x-1">
//       <button
//         onClick={onDecrement}
//         className="p-1 rounded-full bg-red-200 dark:bg-red-800/50 text-red-700 dark:text-red-300 hover:bg-red-300"
//       >
//         <Minus size={12} />
//       </button>
//       <input
//         type="text" // Use text to allow empty state, but handle as number
//         inputMode="numeric" // This suggests a number pad on mobile devices
//         pattern="[0-9]*" // Helps enforce numeric input
//         value={value}
//         onChange={onManualChange}
//         className="w-10 h-8 text-center bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//       />
//       <button
//         onClick={onIncrement}
//         className="p-1 rounded-full bg-green-200 dark:bg-green-800/50 text-green-700 dark:text-green-300 hover:bg-green-300"
//       >
//         <Plus size={12} />
//       </button>
//     </div>
//   );
// };

// const ANFMeasurement = () => {
//   const { user } = useAuth();
//   const [moOptions, setMoOptions] = useState([]);
//   const [selectedMo, setSelectedMo] = useState(null);
//   const [buyer, setBuyer] = useState("");
//   const [sizeOptions, setSizeOptions] = useState([]);
//   const [selectedSize, setSelectedSize] = useState(null);
//   const [specTableData, setSpecTableData] = useState([]);
//   const [measurementValues, setMeasurementValues] = useState({}); // Stores the values for the -1 to 1 columns

//   const measurementColumns = [-1, -0.75, -0.5, 0, 0.5, 0.75, 1];
//   const columnLabels = ["-1", "-3/4", "-1/2", "OK", "1/2", "3/4", "1"];

//   // Fetch all MO numbers for the dropdown
//   useEffect(() => {
//     const fetchMoOptions = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/anf-measurement/mo-options`,
//           { withCredentials: true }
//         );
//         setMoOptions(response.data.map((mo) => ({ value: mo, label: mo })));
//       } catch (error) {
//         console.error("Error fetching MO options:", error);
//       }
//     };
//     fetchMoOptions();
//   }, []);

//   // Fetch buyer and sizes when an MO is selected
//   useEffect(() => {
//     if (selectedMo) {
//       const fetchMoDetails = async () => {
//         try {
//           const response = await axios.get(
//             `${API_BASE_URL}/api/anf-measurement/mo-details/${selectedMo.value}`,
//             { withCredentials: true }
//           );
//           setBuyer(response.data.buyer);
//           setSizeOptions(
//             response.data.sizes.map((s) => ({ value: s, label: s }))
//           );
//           // Reset subsequent fields
//           setSelectedSize(null);
//           setSpecTableData([]);
//           setMeasurementValues({});
//         } catch (error) {
//           console.error("Error fetching MO details:", error);
//           setBuyer("");
//           setSizeOptions([]);
//         }
//       };
//       fetchMoDetails();
//     } else {
//       // Clear all dependent fields if MO is cleared
//       setBuyer("");
//       setSizeOptions([]);
//       setSelectedSize(null);
//       setSpecTableData([]);
//       setMeasurementValues({});
//     }
//   }, [selectedMo]);

//   // Fetch the spec table data when MO and Size are selected
//   useEffect(() => {
//     if (selectedMo && selectedSize) {
//       const fetchSpecTable = async () => {
//         try {
//           const response = await axios.get(
//             `${API_BASE_URL}/api/anf-measurement/spec-table`,
//             {
//               params: { moNo: selectedMo.value, size: selectedSize.value },
//               withCredentials: true
//             }
//           );
//           setSpecTableData(response.data);
//           // Initialize measurement values state with all zeros
//           const initialValues = {};
//           response.data.forEach((row) => {
//             initialValues[row.orderNo] = {};
//             measurementColumns.forEach((col) => {
//               initialValues[row.orderNo][col] = 0;
//             });
//           });
//           setMeasurementValues(initialValues);
//         } catch (error) {
//           console.error("Error fetching spec table data:", error);
//           setSpecTableData([]);
//         }
//       };
//       fetchSpecTable();
//     } else {
//       setSpecTableData([]);
//     }
//   }, [selectedMo, selectedSize]);

//   const handleValueChange = (orderNo, col, newValue) => {
//     // Ensure the new value is a non-negative integer
//     const sanitizedValue = Math.max(0, parseInt(newValue, 10) || 0);
//     setMeasurementValues((prev) => ({
//       ...prev,
//       [orderNo]: {
//         ...prev[orderNo],
//         [col]: sanitizedValue
//       }
//     }));
//   };

//   const getCellBackgroundColor = (tolMinus, tolPlus, colValue) => {
//     if (colValue >= tolMinus && colValue <= tolPlus) {
//       return "bg-green-100 dark:bg-green-900/50"; // Pass
//     }
//     return "bg-red-100 dark:bg-red-900/50"; // Fail
//   };

//   const selectStyles = {
//     control: (styles) => ({
//       ...styles,
//       backgroundColor: "white",
//       borderColor: "#d1d5db"
//     }),
//     menu: (styles) => ({ ...styles, backgroundColor: "white" }),
//     option: (styles, { isFocused, isSelected }) => ({
//       ...styles,
//       backgroundColor: isSelected ? "#4f46e5" : isFocused ? "#e0e7ff" : "white",
//       color: isSelected ? "white" : "black"
//     })
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-black dark:text-gray-200 p-4 sm:p-6 lg:p-8">
//       <div className="max-w-screen-2xl mx-auto">
//         <PageTitle user={user} />

//         <div className="max-w-4xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
//           <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
//             Filters
//           </h2>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 MO No
//               </label>
//               <Select
//                 options={moOptions}
//                 value={selectedMo}
//                 onChange={setSelectedMo}
//                 isClearable
//                 placeholder="Search and select MO..."
//                 styles={selectStyles}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Buyer
//               </label>
//               <input
//                 type="text"
//                 value={buyer}
//                 readOnly
//                 className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Size
//               </label>
//               <Select
//                 options={sizeOptions}
//                 value={selectedSize}
//                 onChange={setSelectedSize}
//                 isClearable
//                 isDisabled={!selectedMo}
//                 placeholder="Select Size..."
//                 styles={selectStyles}
//               />
//             </div>
//           </div>
//         </div>

//         {specTableData.length > 0 && (
//           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
//             <table className="min-w-full table-fixed">
//               <thead className="bg-gray-100 dark:bg-gray-700">
//                 <tr>
//                   <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider w-12">
//                     No
//                   </th>
//                   <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider w-64">
//                     Measurement Point
//                   </th>
//                   <th className="p-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider w-20">
//                     Tol -
//                   </th>
//                   <th className="p-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider w-20">
//                     Tol +
//                   </th>
//                   <th className="p-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider w-20">
//                     Spec
//                   </th>
//                   {columnLabels.map((label) => (
//                     <th
//                       key={label}
//                       className="p-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider w-32"
//                     >
//                       {label}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
//                 {specTableData.map((row) => (
//                   <tr key={row.orderNo}>
//                     <td className="p-2 text-center text-sm text-gray-800 dark:text-gray-200">
//                       {row.orderNo}
//                     </td>
//                     <td className="p-2 text-left text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
//                       {row.specName}
//                     </td>
//                     <td className="p-2 text-center text-sm text-red-600 dark:text-red-400 font-semibold">
//                       {row.specValueFraction.includes(row.tolMinus.toString())
//                         ? "N/A"
//                         : row.tolMinus}
//                     </td>
//                     <td className="p-2 text-center text-sm text-green-600 dark:text-green-400 font-semibold">
//                       {row.tolPlus}
//                     </td>
//                     <td className="p-2 text-center text-sm text-gray-800 dark:text-gray-200 font-semibold">
//                       {row.specValueFraction}
//                     </td>

//                     {measurementColumns.map((col) => (
//                       <td
//                         key={col}
//                         className={`p-2 text-center text-sm ${getCellBackgroundColor(
//                           row.tolMinus,
//                           row.tolPlus,
//                           col
//                         )}`}
//                       >
//                         <ValueInputCell
//                           value={measurementValues[row.orderNo]?.[col] ?? 0}
//                           onIncrement={() =>
//                             handleValueChange(
//                               row.orderNo,
//                               col,
//                               (measurementValues[row.orderNo]?.[col] ?? 0) + 1
//                             )
//                           }
//                           onDecrement={() =>
//                             handleValueChange(
//                               row.orderNo,
//                               col,
//                               (measurementValues[row.orderNo]?.[col] ?? 0) - 1
//                             )
//                           }
//                           onManualChange={(e) =>
//                             handleValueChange(row.orderNo, col, e.target.value)
//                           }
//                         />
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ANFMeasurement;

import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/authentication/AuthContext";
import { Check, BarChart3, LayoutDashboard } from "lucide-react";
import ANFMeasurementPageTitle from "../components/inspection/ANF_measurement/ANFMeasurementPageTitle";
import ANFMeasurementInspectionForm from "../components/inspection/ANF_measurement/ANFMeasurementInspectionForm";

const PlaceholderComponent = ({ title }) => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[300px] flex flex-col justify-center items-center">
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center">
        This section is under development.
      </p>
    </div>
  );
};

const ANFMeasurement = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("inspection");
  const { user } = useAuth();

  const tabs = useMemo(
    () => [
      {
        id: "inspection",
        labelKey: "anfMeasurement.tabs.inspection",
        icon: <Check size={18} />,
        component: <ANFMeasurementInspectionForm />
      },
      {
        id: "results",
        labelKey: "anfMeasurement.tabs.results",
        icon: <BarChart3 size={18} />,
        component: <PlaceholderComponent title="Results" />
      },
      {
        id: "dashboard",
        labelKey: "anfMeasurement.tabs.dashboard",
        icon: <LayoutDashboard size={18} />,
        component: <PlaceholderComponent title="Dashboard" />
      }
    ],
    []
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto">
        <ANFMeasurementPageTitle user={user} />

        <div className="border-b border-gray-300 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap
                                  ${
                                    activeTab === tab.id
                                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500"
                                  }`}
              >
                {React.cloneElement(tab.icon, { className: "mr-2" })}
                {t(
                  tab.labelKey,
                  tab.id.charAt(0).toUpperCase() + tab.id.slice(1)
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">{activeComponent}</div>
      </div>
    </div>
  );
};

export default ANFMeasurement;
