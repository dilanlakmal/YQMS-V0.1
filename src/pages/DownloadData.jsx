// import { Search } from "lucide-react";
// import React, { useEffect, useState } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import ExcelDownloadButton from "../components/forms/ExcelDownloadButton";
// import PDFDownloadButton from "../components/forms/PDFDownloadButton";

// const RECORDS_PER_PAGE_OPTIONS = [50, 100, 200, 500];
// const DATA_TYPES = ["QC2 Order Data", "Ironing"];
// const API_BASE_URL = "http://localhost:5001"; // Add this line

// function DownloadData() {
//   // Filter states
//   const [startDate, setStartDate] = useState(null);
//   const [endDate, setEndDate] = useState(null);
//   const [type, setType] = useState("QC2 Order Data");
//   const [taskNo, setTaskNo] = useState("52");
//   const [moNo, setMoNo] = useState("");
//   const [styleNo, setStyleNo] = useState("");
//   const [lineNo, setLineNo] = useState("");
//   const [color, setColor] = useState("");
//   const [size, setSize] = useState("");
//   const [buyer, setBuyer] = useState("");

//   // Dropdown options
//   const [moNoOptions, setMoNoOptions] = useState([]);
//   const [styleNoOptions, setStyleNoOptions] = useState([]);
//   const [lineNoOptions, setLineNoOptions] = useState([]);
//   const [colorOptions, setColorOptions] = useState([]);
//   const [sizeOptions, setSizeOptions] = useState([]);
//   const [buyerOptions, setBuyerOptions] = useState([]);

//   // Table states
//   const [data, setData] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [recordsPerPage, setRecordsPerPage] = useState(50);
//   const [totalRecords, setTotalRecords] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [totalPages, setTotalPages] = useState(0);

//   // Dropdown visibility states
//   const [dropdownStates, setDropdownStates] = useState({
//     moNo: false,
//     styleNo: false,
//     lineNo: false,
//     color: false,
//     size: false,
//     buyer: false,
//   });

//   useEffect(() => {
//     fetchUniqueValues();
//   }, []);

//   const fetchUniqueValues = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/unique-values`);
//       if (!response.ok) throw new Error("Failed to fetch unique values");
//       const data = await response.json();
//       setMoNoOptions(data.moNos || []);
//       setStyleNoOptions(data.styleNos || []);
//       setLineNoOptions(data.lineNos || []);
//       setColorOptions(data.colors || []);
//       setSizeOptions(data.sizes || []);
//       setBuyerOptions(data.buyers || []);
//     } catch (error) {
//       console.error("Error fetching unique values:", error);
//     }
//   };

//   const handleTypeChange = (newType) => {
//     setType(newType);
//     setTaskNo(newType === "QC2 Order Data" ? "52" : "53");
//   };

//   const handleTaskNoChange = (newTaskNo) => {
//     setTaskNo(newTaskNo);
//     setType(newTaskNo === "52" ? "QC2 Order Data" : "Ironing");
//   };

//   const toggleDropdown = (field) => {
//     setDropdownStates((prev) => ({
//       ...prev,
//       [field]: !prev[field],
//     }));
//   };

//   const handleSearch = async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({
//         startDate: startDate ? startDate.toISOString() : "",
//         endDate: endDate ? endDate.toISOString() : "",
//         type,
//         taskNo,
//         moNo,
//         styleNo,
//         lineNo,
//         color,
//         size,
//         buyer,
//         page: currentPage,
//         limit: recordsPerPage,
//       });

//       const response = await fetch(
//         `${API_BASE_URL}/api/download-data?${params}`
//       );
//       if (!response.ok) throw new Error("Failed to fetch data");

//       const result = await response.json();
//       setData(result.data);
//       setTotalRecords(result.total);
//       setTotalPages(result.totalPages);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePageChange = (newPage) => {
//     setCurrentPage(newPage);
//   };

//   useEffect(() => {
//     if (currentPage > totalPages && totalPages > 0) {
//       setCurrentPage(totalPages);
//     }
//   }, [totalPages, currentPage]);

//   useEffect(() => {
//     if (
//       data.length > 0 ||
//       startDate ||
//       endDate ||
//       moNo ||
//       styleNo ||
//       lineNo ||
//       color ||
//       size ||
//       buyer
//     ) {
//       handleSearch();
//     }
//   }, [currentPage, recordsPerPage]);

//   const renderPagination = () => {
//     const pages = [];
//     const maxVisiblePages = 5;
//     let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
//     let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

//     if (endPage - startPage + 1 < maxVisiblePages) {
//       startPage = Math.max(1, endPage - maxVisiblePages + 1);
//     }

//     // Add first page
//     if (startPage > 1) {
//       pages.push(
//         <button
//           key={1}
//           onClick={() => handlePageChange(1)}
//           className="px-3 py-1 mx-1 rounded bg-gray-200 hover:bg-gray-300"
//         >
//           1
//         </button>
//       );
//       if (startPage > 2) {
//         pages.push(
//           <span key="ellipsis1" className="mx-1">
//             ...
//           </span>
//         );
//       }
//     }

//     // Add visible pages
//     for (let i = startPage; i <= endPage; i++) {
//       pages.push(
//         <button
//           key={i}
//           onClick={() => handlePageChange(i)}
//           className={`px-3 py-1 mx-1 rounded ${
//             currentPage === i
//               ? "bg-blue-500 text-white"
//               : "bg-gray-200 hover:bg-gray-300"
//           }`}
//         >
//           {i}
//         </button>
//       );
//     }

//     // Add last page
//     if (endPage < totalPages) {
//       if (endPage < totalPages - 1) {
//         pages.push(
//           <span key="ellipsis2" className="mx-1">
//             ...
//           </span>
//         );
//       }
//       pages.push(
//         <button
//           key={totalPages}
//           onClick={() => handlePageChange(totalPages)}
//           className="px-3 py-1 mx-1 rounded bg-gray-200 hover:bg-gray-300"
//         >
//           {totalPages}
//         </button>
//       );
//     }

//     return pages;
//   };

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
//         <h1 className="text-2xl font-bold mb-6">Download Data</h1>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
//           {/* Date Filters */}
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-700">
//               Start Date
//             </label>
//             <DatePicker
//               selected={startDate}
//               onChange={setStartDate}
//               className="w-full px-3 py-2 border rounded-md"
//               dateFormat="MM/dd/yyyy"
//             />
//           </div>
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-700">
//               End Date
//             </label>
//             <DatePicker
//               selected={endDate}
//               onChange={setEndDate}
//               className="w-full px-3 py-2 border rounded-md"
//               dateFormat="MM/dd/yyyy"
//             />
//           </div>

//           {/* Type and Task No */}
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-700">
//               Type
//             </label>
//             <select
//               value={type}
//               onChange={(e) => handleTypeChange(e.target.value)}
//               className="w-full px-3 py-2 border rounded-md"
//             >
//               {DATA_TYPES.map((t) => (
//                 <option key={t} value={t}>
//                   {t}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-700">
//               Task No
//             </label>
//             <select
//               value={taskNo}
//               onChange={(e) => handleTaskNoChange(e.target.value)}
//               className="w-full px-3 py-2 border rounded-md"
//             >
//               <option value="52">52</option>
//               <option value="53">53</option>
//             </select>
//           </div>

//           {/* Searchable Dropdowns */}
//           {[
//             {
//               label: "MO No",
//               value: moNo,
//               setter: setMoNo,
//               options: moNoOptions,
//             },
//             {
//               label: "Style No",
//               value: styleNo,
//               setter: setStyleNo,
//               options: styleNoOptions,
//             },
//             {
//               label: "Line No",
//               value: lineNo,
//               setter: setLineNo,
//               options: lineNoOptions,
//             },
//             {
//               label: "Color",
//               value: color,
//               setter: setColor,
//               options: colorOptions,
//             },
//             {
//               label: "Size",
//               value: size,
//               setter: setSize,
//               options: sizeOptions,
//             },
//             {
//               label: "Buyer",
//               value: buyer,
//               setter: setBuyer,
//               options: buyerOptions,
//             },
//           ].map(({ label, value, setter, options }) => (
//             <div key={label} className="space-y-2 relative">
//               <label className="block text-sm font-medium text-gray-700">
//                 {label}
//               </label>
//               <div className="relative">
//                 <input
//                   type="text"
//                   value={value}
//                   onChange={(e) => {
//                     setter(e.target.value);
//                     toggleDropdown(label.toLowerCase().replace(" ", ""));
//                   }}
//                   onFocus={() =>
//                     toggleDropdown(label.toLowerCase().replace(" ", ""))
//                   }
//                   className="w-full px-3 py-2 border rounded-md"
//                   placeholder={`Search ${label}...`}
//                 />
//                 <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
//                 {dropdownStates[label.toLowerCase().replace(" ", "")] && (
//                   <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
//                     {options
//                       .filter((opt) =>
//                         opt.toLowerCase().includes(value.toLowerCase())
//                       )
//                       .map((opt, idx) => (
//                         <div
//                           key={idx}
//                           className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
//                           onClick={() => {
//                             setter(opt);
//                             toggleDropdown(
//                               label.toLowerCase().replace(" ", "")
//                             );
//                           }}
//                         >
//                           {opt}
//                         </div>
//                       ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="flex justify-between items-center mb-6">
//           <div className="flex items-center">
//             <button
//               onClick={handleSearch}
//               className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
//               disabled={loading}
//             >
//               {loading ? "Searching..." : "Search"}
//             </button>

//             {data.length > 0 && (
//               <>
//                 <ExcelDownloadButton
//                   data={data}
//                   filters={{
//                     taskNo,
//                     type,
//                     moNo,
//                     styleNo,
//                     lineNo,
//                     color,
//                     size,
//                   }}
//                 />
//                 <PDFDownloadButton
//                   data={data}
//                   filters={{
//                     taskNo,
//                     type,
//                     moNo,
//                     styleNo,
//                     lineNo,
//                     color,
//                     size,
//                   }}
//                 />
//               </>
//             )}
//           </div>

//           <div className="flex items-center space-x-2">
//             <span className="text-sm text-gray-600">Records per page:</span>
//             <select
//               value={recordsPerPage}
//               onChange={(e) => {
//                 setRecordsPerPage(Number(e.target.value));
//                 setCurrentPage(1);
//               }}
//               className="border rounded-md px-2 py-1"
//             >
//               {RECORDS_PER_PAGE_OPTIONS.map((option) => (
//                 <option key={option} value={option}>
//                   {option}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         {/* Data Table */}
//         <div className="overflow-x-auto">
//           <div className="inline-block min-w-full align-middle">
//             <div className="overflow-hidden border rounded-lg">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     {[
//                       "Date",
//                       "Type",
//                       "Task No",
//                       "MO No",
//                       "Style No",
//                       "Line No",
//                       "Color",
//                       "Size",
//                       "Buyer",
//                       "Bundle ID",
//                       "Factory",
//                       "Count",
//                     ].map((header) => (
//                       <th
//                         key={header}
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                       >
//                         {header}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {loading ? (
//                     <tr>
//                       <td colSpan="10" className="text-center py-4">
//                         Loading...
//                       </td>
//                     </tr>
//                   ) : data.length === 0 ? (
//                     <tr>
//                       <td colSpan="10" className="text-center py-4">
//                         No data found
//                       </td>
//                     </tr>
//                   ) : (
//                     data.map((item, index) => (
//                       <tr key={index}>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {item.date}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {item.type}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {item.taskNo}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {item.selectedMono}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {item.custStyle}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {item.lineNo}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {item.color}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {item.size}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {item.buyer}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {item.bundle_id}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {item.factory}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {item.count}
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>

//         {/* Pagination */}
//         {totalPages > 0 && (
//           <div className="mt-4 flex justify-between items-center">
//             <div className="text-sm text-gray-700">
//               Showing{" "}
//               {Math.min((currentPage - 1) * recordsPerPage + 1, totalRecords)}{" "}
//               to {Math.min(currentPage * recordsPerPage, totalRecords)} of{" "}
//               {totalRecords} results
//             </div>
//             <div className="flex space-x-2">{renderPagination()}</div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default DownloadData;

import { Filter, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ExcelDownloadButton from "../components/forms/ExcelDownloadButton";
import PDFDownloadButton from "../components/forms/PDFDownloadButton";
import Sidebar from "../components/layout/SideBar";
import TabBar from "../components/layout/TabBar";

const RECORDS_PER_PAGE_OPTIONS = [50, 100, 200, 500];
const DATA_TYPES = ["QC2 Order Data", "Ironing"];
// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "../../config";

function DownloadData() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const [tabs, setTabs] = useState(["Default"]);
  const [activeTab, setActiveTab] = useState(0);
  const [tabData, setTabData] = useState([
    {
      startDate: null,
      endDate: null,
      type: "QC2 Order Data",
      taskNo: "52",
      moNo: "",
      styleNo: "",
      lineNo: "",
      color: "",
      size: "",
      buyer: "",
    },
  ]);

  const [tabDataResults, setTabDataResults] = useState([[]]); // Store data per tab

  const addTab = (tabName) => {
    setTabs((prevTabs) => [...prevTabs, tabName]);
    setActiveTab(tabs.length);
    setTabData((prevTabData) => [
      ...prevTabData,
      {
        startDate: null,
        endDate: null,
        type: "QC2 Order Data",
        taskNo: "52",
        moNo: "",
        styleNo: "",
        lineNo: "",
        color: "",
        size: "",
        buyer: "",
      },
    ]);
    // Initialize data for the new tab
    setTabDataResults((prevTabDataResults) => [
      ...prevTabDataResults,
      [], // Initialize with an empty array for the new tab
    ]);
  };

  const closeTab = (index) => {
    setTabs((prevTabs) => prevTabs.filter((_, i) => i !== index));
    setTabData((prevTabData) => prevTabData.filter((_, i) => i !== index));
    if (activeTab === index) {
      setActiveTab(0);
    } else if (activeTab > index) {
      setActiveTab((prev) => prev - 1);
    }
  };

  const handleTabDataChange = (field, value) => {
    setTabData((prevTabData) => {
      const newTabData = [...prevTabData];
      newTabData[activeTab][field] = value;
      return newTabData;
    });
  };

  const [moNoOptions, setMoNoOptions] = useState([]);
  const [empIdOptions, setEmpIdOptions] = useState([]);
  const [engNameOptions, setEngNameOptions] = useState([]);
  const [jobTitleOptions, setJobTietlOptions] = useState([]);
  const [styleNoOptions, setStyleNoOptions] = useState([]);
  const [lineNoOptions, setLineNoOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  const [dropdownStates, setDropdownStates] = useState({
    date: false,
    moNo: false,
    styleNo: false,
    lineNo: false,
    color: false,
    size: false,
    buyer: false,
  });

  const [headerDropdownStates, setHeaderDropdownStates] = useState({
    date: false,
    type: false,
    taskNo: false,
    moNo: false,
    styleNo: false,
    lineNo: false,
    color: false,
    size: false,
    buyer: false,
    bundleId: false,
  });

  const [filters, setFilters] = useState({
    date: [""],
    type: [""],
    taskNo: [],
    moNo: [],
    styleNo: [],
    lineNo: [],
    color: [],
    size: [],
    buyer: [],
    bundleId: [],
  });

  const [sortOrder, setSortOrder] = useState({
    field: null,
    order: "asc", // 'asc' or 'desc'
  });

  const handleSort = (field) => {
    setSortOrder((prevSortOrder) => ({
      field,
      order:
        prevSortOrder.field === field && prevSortOrder.order === "asc"
          ? "desc"
          : "asc",
    }));
  };

  useEffect(() => {
    fetchUniqueValues();
  }, []);

  const fetchUniqueValues = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/unique-values`);
      if (!response.ok) throw new Error("Failed to fetch unique values");
      const data = await response.json();
      setMoNoOptions(data.moNos || []);
      setStyleNoOptions(data.styleNos || []);
      setLineNoOptions(data.lineNos || []);
      setColorOptions(data.colors || []);
      setSizeOptions(data.sizes || []);
      setBuyerOptions(data.buyers || []);
    } catch (error) {
      console.error("Error fetching unique values:", error);
    }
  };

  const handleTypeChange = (newType) => {
    handleTabDataChange("type", newType);
    handleTabDataChange("taskNo", newType === "QC2 Order Data" ? "52" : "53");
  };

  const handleTaskNoChange = (newTaskNo) => {
    handleTabDataChange("taskNo", newTaskNo);
    handleTabDataChange(
      "type",
      newTaskNo === "52" ? "QC2 Order Data" : "Ironing"
    );
  };

  const toggleDropdown = (field) => {
    setDropdownStates((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const toggleHeaderDropdown = (field) => {
    setHeaderDropdownStates((prevState) => {
      const newState = {
        ...prevState,
        [field]: !prevState[field],
      };
      Object.keys(newState).forEach((key) => {
        if (key !== field) {
          newState[key] = false;
        }
      });
      console.log("Updated Header Dropdown States:", newState);
      return newState;
    });
  };

  function formatDate(dateString) {
    if (!dateString) {
      console.log("Date string is null or undefined");
      return ""; // Return an empty string if the date is null or undefined
    }

    const date = new Date(dateString);
    if (isNaN(date)) {
      console.error("Invalid date:", dateString); // Log the invalid date string
      return "Invalid Date";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  }

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: tabData[activeTab].startDate
          ? formatDate(tabData[activeTab].startDate)
          : "",
        endDate: tabData[activeTab].endDate
          ? formatDate(tabData[activeTab].endDate)
          : "",
        type: tabData[activeTab].type,
        taskNo: tabData[activeTab].taskNo,
        moNo: tabData[activeTab].moNo,
        styleNo: tabData[activeTab].styleNo,
        lineNo: tabData[activeTab].lineNo,
        color: tabData[activeTab].color,
        size: tabData[activeTab].size,
        buyer: tabData[activeTab].buyer,
        page: currentPage,
        limit: recordsPerPage,
      });

      const response = await fetch(
        `${API_BASE_URL}/api/download-data?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch data");
      const result = await response.json();
      const validatedData = result.data.map((item) => ({
        ...item,
        date: item.date ? formatDate(item.date) : "Invalid Date",
      }));

      setTabDataResults((prevTabDataResults) => {
        const newTabDataResults = [...prevTabDataResults];
        newTabDataResults[activeTab] = validatedData;
        return newTabDataResults;
      });

      setData(validatedData);
      setTotalRecords(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    if (
      data.length > 0 ||
      tabData[activeTab].startDate ||
      tabData[activeTab].endDate ||
      tabData[activeTab].moNo ||
      tabData[activeTab].styleNo ||
      tabData[activeTab].lineNo ||
      tabData[activeTab].color ||
      tabData[activeTab].size ||
      tabData[activeTab].buyer
    ) {
      handleSearch();
    }
  }, [currentPage, recordsPerPage]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyFilters = (data, filters) => {
    let filteredData = data.filter((item) => {
      return (
        (!filters.date[0] || item.date === filters.date[0]) &&
        (!filters.type[0] || filters.type.includes(item.type)) &&
        (!filters.taskNo.length || filters.taskNo.includes(item.taskNo)) &&
        (!filters.moNo.length || filters.moNo.includes(item.selectedMono)) &&
        (!filters.styleNo.length || filters.styleNo.includes(item.custStyle)) &&
        (!filters.lineNo.length || filters.lineNo.includes(item.lineNo)) &&
        (!filters.color.length || filters.color.includes(item.color)) &&
        (!filters.size.length || filters.size.includes(item.size)) &&
        (!filters.buyer.length || filters.buyer.includes(item.buyer)) &&
        (!filters.bundleId.length || filters.bundleId.includes(item.bundleId))
      );
    });

    if (sortOrder.field) {
      filteredData = filteredData.sort((a, z) => {
        if (a[sortOrder.field] < z[sortOrder.field])
          return sortOrder.order === "asc" ? -1 : 1;
        if (a[sortOrder.field] > z[sortOrder.field])
          return sortOrder.order === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filteredData;
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 mx-1 rounded bg-gray-200 hover:bg-gray-300"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="mx-1">
            ...
          </span>
        );
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === i
              ? "bg-blue-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {i}
        </button>
      );
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="mx-1">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 mx-1 rounded bg-gray-200 hover:bg-gray-300"
        >
          {totalPages}
        </button>
      );
    }
    return pages;
  };

  const renderFilterDropdown = (field, options) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredOptions = options.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="relative">
        <button
          onClick={() => toggleHeaderDropdown(field)}
          className="flex items-center space-x-1 focus:outline-none"
        >
          <Filter className="h-4 w-4" />
        </button>
        {headerDropdownStates[field] && (
          <div className="absolute z-20 w-48 mt-2 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="p-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-1 border rounded"
              />
            </div>
            <div className="p-2">
              <button
                onClick={() => handleSort(field)}
                className="w-full text-left"
              >
                Sort{" "}
                {sortOrder.field === field && sortOrder.order === "asc"
                  ? "↓"
                  : "↑"}
              </button>
            </div>
            {filteredOptions.map((option, idx) => (
              <div
                key={idx}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters[field].includes(option)}
                    onChange={(e) => {
                      const newFilters = e.target.checked
                        ? [...filters[field], option]
                        : filters[field].filter((item) => item !== option);
                      handleFilterChange(field, newFilters);
                      handleSearch(); // Trigger search when an option is selected
                    }}
                  />
                  <span>{option}</span>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex ">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        addTab={addTab}
      />
      <div
        className={`flex-1 transition-all duration-300 overflow-y-auto ${
          isSidebarOpen ? "ml-64" : "ml-12"
        }`}
      >
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabClick={setActiveTab}
          onCloseTab={closeTab}
        />
        <div className="bg-white rounded-lg shadow-lg p-10 mb-8">
          <h1 className="text-2xl font-bold mb-6">
            Download Data - {tabs[activeTab]}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <DatePicker
                selected={tabData[activeTab].startDate}
                onChange={(date) => handleTabDataChange("startDate", date)}
                className="w-full px-3 py-2 border rounded-md"
                dateFormat="MM/dd/yyyy"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <DatePicker
                selected={tabData[activeTab].endDate}
                onChange={(date) => handleTabDataChange("endDate", date)}
                className="w-full px-3 py-2 border rounded-md"
                dateFormat="MM/dd/yyyy"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={tabData[activeTab].type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {DATA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Task No
              </label>
              <select
                value={tabData[activeTab].taskNo}
                onChange={(e) => handleTaskNoChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="52">52</option>
                <option value="53">53</option>
              </select>
            </div>
            {[
              {
                label: "MO No",
                value: tabData[activeTab].moNo,
                setter: (value) => handleTabDataChange("moNo", value),
                options: moNoOptions,
              },
              {
                label: "Style No",
                value: tabData[activeTab].styleNo,
                setter: (value) => handleTabDataChange("styleNo", value),
                options: styleNoOptions,
              },
              {
                label: "Line No",
                value: tabData[activeTab].lineNo,
                setter: (value) => handleTabDataChange("lineNo", value),
                options: lineNoOptions,
              },
              {
                label: "Color",
                value: tabData[activeTab].color,
                setter: (value) => handleTabDataChange("color", value),
                options: colorOptions,
              },
              {
                label: "Size",
                value: tabData[activeTab].size,
                setter: (value) => handleTabDataChange("size", value),
                options: sizeOptions,
              },
              {
                label: "Buyer",
                value: tabData[activeTab].buyer,
                setter: (value) => handleTabDataChange("buyer", value),
                options: buyerOptions,
              },
            ].map(({ label, value, setter, options }) => (
              <div key={label} className="space-y-2 relative">
                <label className="block text-sm font-medium text-gray-700">
                  {label}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      setter(e.target.value);
                      toggleDropdown(label.toLowerCase().replace(" ", " "));
                    }}
                    onFocus={() =>
                      toggleDropdown(label.toLowerCase().replace(" ", " "))
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder={`${label}...`}
                  />
                  <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  {dropdownStates[label.toLowerCase().replace(" ", " ")] && (
                    <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {options
                        .filter((opt) =>
                          opt.toLowerCase().includes(value.toLowerCase())
                        )
                        .map((opt, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setter(opt);
                              toggleDropdown(
                                label.toLowerCase().replace(" ", " ")
                              );
                              handleSearch(); // Trigger search when an option is selected
                            }}
                          >
                            {opt}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={handleSearch}
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
              {data.length > 0 && (
                <>
                  <ExcelDownloadButton
                    data={data}
                    filters={{
                      taskNo: tabData[activeTab].taskNo,
                      type: tabData[activeTab].type,
                      moNo: tabData[activeTab].moNo,
                      styleNo: tabData[activeTab].styleNo,
                      lineNo: tabData[activeTab].lineNo,
                      color: tabData[activeTab].color,
                      size: tabData[activeTab].size,
                    }}
                  />
                  <PDFDownloadButton
                    data={data}
                    filters={{
                      taskNo: tabData[activeTab].taskNo,
                      type: tabData[activeTab].type,
                      moNo: tabData[activeTab].moNo,
                      styleNo: tabData[activeTab].styleNo,
                      lineNo: tabData[activeTab].lineNo,
                      color: tabData[activeTab].color,
                      size: tabData[activeTab].size,
                    }}
                  />
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Records per page:</span>
              <select
                value={recordsPerPage}
                onChange={(e) => {
                  setRecordsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded-md px-2 py-1"
              >
                {RECORDS_PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Data Table */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        {
                          label: "Date",
                          field: "date",
                          options: data.map((item) => item.date),
                        },
                        { label: "Type", field: "type", options: DATA_TYPES },
                        {
                          label: "Task No",
                          field: "taskNo",
                          options: ["52", "53"],
                        },
                        { label: "MO No", field: "moNo", options: moNoOptions },
                        {
                          label: "Style No",
                          field: "styleNo",
                          options: styleNoOptions,
                        },
                        {
                          label: "Line No",
                          field: "lineNo",
                          options: lineNoOptions,
                        },
                        {
                          label: "Color",
                          field: "color",
                          options: colorOptions,
                        },
                        { label: "Size", field: "size", options: sizeOptions },
                        {
                          label: "Buyer",
                          field: "buyer",
                          options: buyerOptions,
                        },
                        { label: "Bundle ID", field: "bundleId", options: [] },
                      ].map(({ label, field, options }) => (
                        <th
                          key={field}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          <div className="flex items-center space-x-2">
                            <span>{label}</span>
                            {renderFilterDropdown(field, [...new Set(options)])}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody
                    className="bg-white divide-y divide-gray-200"
                    style={{ minHeight: "200px" }}
                  >
                    {loading ? (
                      <tr>
                        <td colSpan="10" className="text-center py-4">
                          Loading...
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap">
                          {item.factory}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.count}
                        </td> */}
                      </tr>
                    ) : tabDataResults[activeTab] &&
                      tabDataResults[activeTab].length === 0 ? (
                      <tr>
                        <td colSpan="10" className="text-center py-4">
                          No data found
                        </td>
                      </tr>
                    ) : (
                      applyFilters(
                        tabDataResults[activeTab] || [],
                        filters
                      ).map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.taskNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.selectedMono}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.custStyle}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.lineNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.color}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.size}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.buyer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.bundle_id}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Pagination */}
          {totalPages > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing{" "}
                {Math.min((currentPage - 1) * recordsPerPage + 1, totalRecords)}{" "}
                to {Math.min(currentPage * recordsPerPage, totalRecords)} of{" "}
                {totalRecords} results
              </div>
              <div className="flex space-x-2">{renderPagination()}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DownloadData;
