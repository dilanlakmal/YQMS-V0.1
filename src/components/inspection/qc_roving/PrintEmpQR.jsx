// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../config";
// import { QrCode, ChevronLeft, ChevronRight } from "lucide-react";
// import QRCode from "react-qr-code";
// import Swal from "sweetalert2";

// const PrintEmpQR = () => {
//   const [users, setUsers] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalUsers, setTotalUsers] = useState(0);
//   const [limit] = useState(10); // Number of users per page
//   const [selectedEmpId, setSelectedEmpId] = useState(null);

//   // Filter states
//   const [jobTitleSearch, setJobTitleSearch] = useState("");
//   const [empIdSearch, setEmpIdSearch] = useState("");
//   const [sectionSearch, setSectionSearch] = useState("");
//   const [jobTitleOptions, setJobTitleOptions] = useState([]);
//   const [empIdOptions, setEmpIdOptions] = useState([]);
//   const [sectionOptions, setSectionOptions] = useState([]);
//   const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false);
//   const [showEmpIdDropdown, setShowEmpIdDropdown] = useState(false);
//   const [showSectionDropdown, setShowSectionDropdown] = useState(false);
//   const [selectedJobTitle, setSelectedJobTitle] = useState("");
//   const [selectedEmpIdFilter, setSelectedEmpIdFilter] = useState("");
//   const [selectedSection, setSelectedSection] = useState("");
//   const jobTitleDropdownRef = useRef(null);
//   const empIdDropdownRef = useRef(null);
//   const sectionDropdownRef = useRef(null);

//   // Fetch paginated users with filters
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/users-paginated`,
//           {
//             params: {
//               page: currentPage,
//               limit,
//               jobTitle: selectedJobTitle,
//               empId: selectedEmpIdFilter,
//               section: selectedSection
//             }
//           }
//         );
//         setUsers(response.data.users);
//         setTotalPages(response.data.totalPages);
//         setTotalUsers(response.data.total);
//       } catch (error) {
//         console.error("Error fetching users:", error);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch users."
//         });
//       }
//     };

//     fetchUsers();
//   }, [
//     currentPage,
//     limit,
//     selectedJobTitle,
//     selectedEmpIdFilter,
//     selectedSection
//   ]);

//   // Fetch Job Titles for dropdown
//   useEffect(() => {
//     const fetchJobTitles = async () => {
//       if (jobTitleSearch.trim() === "") {
//         setJobTitleOptions([]);
//         setShowJobTitleDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/job-titles`);
//         const filteredTitles = response.data.filter((title) =>
//           title.toLowerCase().includes(jobTitleSearch.toLowerCase())
//         );
//         setJobTitleOptions(filteredTitles);
//         setShowJobTitleDropdown(filteredTitles.length > 0);
//       } catch (error) {
//         console.error("Error fetching job titles:", error);
//         setJobTitleOptions([]);
//         setShowJobTitleDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch job titles."
//         });
//       }
//     };

//     fetchJobTitles();
//   }, [jobTitleSearch]);

//   // Fetch Emp IDs for dropdown
//   useEffect(() => {
//     const fetchEmpIds = async () => {
//       if (empIdSearch.trim() === "") {
//         setEmpIdOptions([]);
//         setShowEmpIdDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/search-users`, {
//           params: { q: empIdSearch }
//         });
//         const empIds = response.data.map((user) => user.emp_id);
//         setEmpIdOptions(empIds);
//         setShowEmpIdDropdown(empIds.length > 0);
//       } catch (error) {
//         console.error("Error fetching emp IDs:", error);
//         setEmpIdOptions([]);
//         setShowEmpIdDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch emp IDs."
//         });
//       }
//     };

//     fetchEmpIds();
//   }, [empIdSearch]);

//   // Fetch Sections for dropdown
//   useEffect(() => {
//     const fetchSections = async () => {
//       if (sectionSearch.trim() === "") {
//         setSectionOptions([]);
//         setShowSectionDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/sections`);
//         const filteredSections = response.data.filter((section) =>
//           section.toLowerCase().includes(sectionSearch.toLowerCase())
//         );
//         setSectionOptions(filteredSections);
//         setShowSectionDropdown(filteredSections.length > 0);
//       } catch (error) {
//         console.error("Error fetching sections:", error);
//         setSectionOptions([]);
//         setShowSectionDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch sections."
//         });
//       }
//     };

//     fetchSections();
//   }, [sectionSearch]);

//   // Handle clicks outside the dropdowns to close them
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         jobTitleDropdownRef.current &&
//         !jobTitleDropdownRef.current.contains(event.target)
//       ) {
//         setShowJobTitleDropdown(false);
//       }
//       if (
//         empIdDropdownRef.current &&
//         !empIdDropdownRef.current.contains(event.target)
//       ) {
//         setShowEmpIdDropdown(false);
//       }
//       if (
//         sectionDropdownRef.current &&
//         !sectionDropdownRef.current.contains(event.target)
//       ) {
//         setShowSectionDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   // Handle QR code preview
//   const handleShowQR = (empId) => {
//     setSelectedEmpId(empId);
//   };

//   // Close QR code preview
//   const handleCloseQR = () => {
//     setSelectedEmpId(null);
//   };

//   // Pagination handlers
//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   const handlePreviousPage = () => {
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//     }
//   };

//   const handleNextPage = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage(currentPage + 1);
//     }
//   };

//   // Generate page numbers for pagination
//   const getPageNumbers = () => {
//     const pageNumbers = [];
//     const maxPagesToShow = 5; // Show up to 5 page numbers at a time
//     let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
//     let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

//     // Adjust startPage if endPage is at the maximum
//     if (endPage === totalPages) {
//       startPage = Math.max(1, endPage - maxPagesToShow + 1);
//     }

//     for (let i = startPage; i <= endPage; i++) {
//       pageNumbers.push(i);
//     }

//     return pageNumbers;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
//       <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
//         <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
//           Employee QR Code List
//         </h1>

//         {/* Filter Panel */}
//         <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
//           <div className="flex flex-wrap gap-4 items-center">
//             {/* Job Title Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Job Title
//               </label>
//               <div className="relative" ref={jobTitleDropdownRef}>
//                 <input
//                   type="text"
//                   value={jobTitleSearch}
//                   onChange={(e) => setJobTitleSearch(e.target.value)}
//                   placeholder="Search Job Title..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showJobTitleDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {jobTitleOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedJobTitle(option);
//                           setJobTitleSearch(option);
//                           setShowJobTitleDropdown(false);
//                           setCurrentPage(1); // Reset to first page on filter change
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

//             {/* Emp ID Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Emp ID
//               </label>
//               <div className="relative" ref={empIdDropdownRef}>
//                 <input
//                   type="text"
//                   value={empIdSearch}
//                   onChange={(e) => setEmpIdSearch(e.target.value)}
//                   placeholder="Search Emp ID..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showEmpIdDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {empIdOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedEmpIdFilter(option);
//                           setEmpIdSearch(option);
//                           setShowEmpIdDropdown(false);
//                           setCurrentPage(1); // Reset to first page on filter change
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

//             {/* Section Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Section
//               </label>
//               <div className="relative" ref={sectionDropdownRef}>
//                 <input
//                   type="text"
//                   value={sectionSearch}
//                   onChange={(e) => setSectionSearch(e.target.value)}
//                   placeholder="Search Section..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showSectionDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {sectionOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedSection(option);
//                           setSectionSearch(option);
//                           setShowSectionDropdown(false);
//                           setCurrentPage(1); // Reset to first page on filter change
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

//             {/* Clear Filters Button */}
//             <div className="flex-1 min-w-[200px]">
//               <button
//                 onClick={() => {
//                   setSelectedJobTitle("");
//                   setSelectedEmpIdFilter("");
//                   setSelectedSection("");
//                   setJobTitleSearch("");
//                   setEmpIdSearch("");
//                   setSectionSearch("");
//                   setCurrentPage(1);
//                 }}
//                 className="mt-6 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
//               >
//                 Clear Filters
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-200">
//               <tr>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Emp ID
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Eng Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Kh Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Dept Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Sect Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   QR Code
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {users.length > 0 ? (
//                 users.map((user) => (
//                   <tr key={user.emp_id}>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.emp_id}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.eng_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.kh_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.dept_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.sect_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       <button
//                         onClick={() => handleShowQR(user.emp_id)}
//                         className="text-blue-600 hover:text-blue-800"
//                       >
//                         <QrCode className="w-6 h-6" />
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td
//                     colSpan="6"
//                     className="px-4 py-3 text-center text-gray-500"
//                   >
//                     No users found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         <div className="flex justify-between items-center mt-6">
//           <div className="text-sm text-gray-600">
//             Showing {(currentPage - 1) * limit + 1} to{" "}
//             {Math.min(currentPage * limit, totalUsers)} of {totalUsers} users
//           </div>
//           <div className="flex space-x-2">
//             <button
//               onClick={handlePreviousPage}
//               disabled={currentPage === 1}
//               className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
//             >
//               <ChevronLeft className="w-5 h-5" />
//               Previous
//             </button>
//             {getPageNumbers().map((page) => (
//               <button
//                 key={page}
//                 onClick={() => handlePageChange(page)}
//                 className={`px-3 py-1 rounded-lg ${
//                   currentPage === page
//                     ? "bg-blue-600 text-white"
//                     : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//                 }`}
//               >
//                 {page}
//               </button>
//             ))}
//             <button
//               onClick={handleNextPage}
//               disabled={currentPage === totalPages}
//               className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
//             >
//               Next
//               <ChevronRight className="w-5 h-5" />
//             </button>
//           </div>
//         </div>

//         {/* QR Code Preview Modal */}
//         {selectedEmpId && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
//               <h2 className="text-xl font-semibold mb-4">QR Code Preview</h2>
//               <div className="flex flex-col items-center">
//                 <QRCode value={selectedEmpId} height={150} width={150} />
//                 <p className="mt-2 text-sm text-gray-600">
//                   Emp ID: {selectedEmpId}
//                 </p>
//               </div>
//               <button
//                 onClick={handleCloseQR}
//                 className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PrintEmpQR;

// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../config";
// import { QrCode, ChevronLeft, ChevronRight } from "lucide-react";
// import QRCode from "react-qr-code";
// import Swal from "sweetalert2";
// import PDFEmpQR from "./PDFEmpQR"; // Import the new PDFEmpQR component

// const PrintEmpQR = () => {
//   const [users, setUsers] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalUsers, setTotalUsers] = useState(0);
//   const [limit] = useState(10); // Number of users per page
//   const [selectedEmpId, setSelectedEmpId] = useState(null);

//   // Filter states
//   const [jobTitleSearch, setJobTitleSearch] = useState("");
//   const [empIdSearch, setEmpIdSearch] = useState("");
//   const [sectionSearch, setSectionSearch] = useState("");
//   const [jobTitleOptions, setJobTitleOptions] = useState([]);
//   const [empIdOptions, setEmpIdOptions] = useState([]);
//   const [sectionOptions, setSectionOptions] = useState([]);
//   const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false);
//   const [showEmpIdDropdown, setShowEmpIdDropdown] = useState(false);
//   const [showSectionDropdown, setShowSectionDropdown] = useState(false);
//   const [selectedJobTitle, setSelectedJobTitle] = useState("");
//   const [selectedEmpIdFilter, setSelectedEmpIdFilter] = useState("");
//   const [selectedSection, setSelectedSection] = useState("");
//   const jobTitleDropdownRef = useRef(null);
//   const empIdDropdownRef = useRef(null);
//   const sectionDropdownRef = useRef(null);

//   // Fetch paginated users with filters
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/users-paginated`,
//           {
//             params: {
//               page: currentPage,
//               limit,
//               jobTitle: selectedJobTitle,
//               empId: selectedEmpIdFilter,
//               section: selectedSection
//             }
//           }
//         );
//         setUsers(response.data.users);
//         setTotalPages(response.data.totalPages);
//         setTotalUsers(response.data.total);
//       } catch (error) {
//         console.error("Error fetching users:", error);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch users."
//         });
//       }
//     };

//     fetchUsers();
//   }, [
//     currentPage,
//     limit,
//     selectedJobTitle,
//     selectedEmpIdFilter,
//     selectedSection
//   ]);

//   // Fetch Job Titles for dropdown
//   useEffect(() => {
//     const fetchJobTitles = async () => {
//       if (jobTitleSearch.trim() === "") {
//         setJobTitleOptions([]);
//         setShowJobTitleDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/job-titles`);
//         const filteredTitles = response.data.filter((title) =>
//           title.toLowerCase().includes(jobTitleSearch.toLowerCase())
//         );
//         setJobTitleOptions(filteredTitles);
//         setShowJobTitleDropdown(filteredTitles.length > 0);
//       } catch (error) {
//         console.error("Error fetching job titles:", error);
//         setJobTitleOptions([]);
//         setShowJobTitleDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch job titles."
//         });
//       }
//     };

//     fetchJobTitles();
//   }, [jobTitleSearch]);

//   // Fetch Emp IDs for dropdown
//   useEffect(() => {
//     const fetchEmpIds = async () => {
//       if (empIdSearch.trim() === "") {
//         setEmpIdOptions([]);
//         setShowEmpIdDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/search-users`, {
//           params: { q: empIdSearch }
//         });
//         const empIds = response.data.map((user) => user.emp_id);
//         setEmpIdOptions(empIds);
//         setShowEmpIdDropdown(empIds.length > 0);
//       } catch (error) {
//         console.error("Error fetching emp IDs:", error);
//         setEmpIdOptions([]);
//         setShowEmpIdDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch emp IDs."
//         });
//       }
//     };

//     fetchEmpIds();
//   }, [empIdSearch]);

//   // Fetch Sections for dropdown
//   useEffect(() => {
//     const fetchSections = async () => {
//       if (sectionSearch.trim() === "") {
//         setSectionOptions([]);
//         setShowSectionDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/sections`);
//         const filteredSections = response.data.filter((section) =>
//           section.toLowerCase().includes(sectionSearch.toLowerCase())
//         );
//         setSectionOptions(filteredSections);
//         setShowSectionDropdown(filteredSections.length > 0);
//       } catch (error) {
//         console.error("Error fetching sections:", error);
//         setSectionOptions([]);
//         setShowSectionDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch sections."
//         });
//       }
//     };

//     fetchSections();
//   }, [sectionSearch]);

//   // Handle clicks outside the dropdowns to close them
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         jobTitleDropdownRef.current &&
//         !jobTitleDropdownRef.current.contains(event.target)
//       ) {
//         setShowJobTitleDropdown(false);
//       }
//       if (
//         empIdDropdownRef.current &&
//         !empIdDropdownRef.current.contains(event.target)
//       ) {
//         setShowEmpIdDropdown(false);
//       }
//       if (
//         sectionDropdownRef.current &&
//         !sectionDropdownRef.current.contains(event.target)
//       ) {
//         setShowSectionDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   // Handle QR code preview
//   const handleShowQR = (empId) => {
//     setSelectedEmpId(empId);
//   };

//   // Close QR code preview
//   const handleCloseQR = () => {
//     setSelectedEmpId(null);
//   };

//   // Pagination handlers
//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   const handlePreviousPage = () => {
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//     }
//   };

//   const handleNextPage = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage(currentPage + 1);
//     }
//   };

//   // Generate page numbers for pagination
//   const getPageNumbers = () => {
//     const pageNumbers = [];
//     const maxPagesToShow = 5; // Show up to 5 page numbers at a time
//     let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
//     let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

//     // Adjust startPage if endPage is at the maximum
//     if (endPage === totalPages) {
//       startPage = Math.max(1, endPage - maxPagesToShow + 1);
//     }

//     for (let i = startPage; i <= endPage; i++) {
//       pageNumbers.push(i);
//     }

//     return pageNumbers;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
//       <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
//         <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
//           Employee QR Code List
//         </h1>

//         {/* Filter Panel */}
//         <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
//           <div className="flex flex-wrap gap-4 items-center">
//             {/* Job Title Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Job Title
//               </label>
//               <div className="relative" ref={jobTitleDropdownRef}>
//                 <input
//                   type="text"
//                   value={jobTitleSearch}
//                   onChange={(e) => setJobTitleSearch(e.target.value)}
//                   placeholder="Search Job Title..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showJobTitleDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {jobTitleOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedJobTitle(option);
//                           setJobTitleSearch(option);
//                           setShowJobTitleDropdown(false);
//                           setCurrentPage(1); // Reset to first page on filter change
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

//             {/* Emp ID Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Emp ID
//               </label>
//               <div className="relative" ref={empIdDropdownRef}>
//                 <input
//                   type="text"
//                   value={empIdSearch}
//                   onChange={(e) => setEmpIdSearch(e.target.value)}
//                   placeholder="Search Emp ID..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showEmpIdDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {empIdOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedEmpIdFilter(option);
//                           setEmpIdSearch(option);
//                           setShowEmpIdDropdown(false);
//                           setCurrentPage(1); // Reset to first page on filter change
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

//             {/* Section Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Section
//               </label>
//               <div className="relative" ref={sectionDropdownRef}>
//                 <input
//                   type="text"
//                   value={sectionSearch}
//                   onChange={(e) => setSectionSearch(e.target.value)}
//                   placeholder="Search Section..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showSectionDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {sectionOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedSection(option);
//                           setSectionSearch(option);
//                           setShowSectionDropdown(false);
//                           setCurrentPage(1); // Reset to first page on filter change
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

//             {/* Clear Filters Button */}
//             <div className="flex-1 min-w-[200px]">
//               <button
//                 onClick={() => {
//                   setSelectedJobTitle("");
//                   setSelectedEmpIdFilter("");
//                   setSelectedSection("");
//                   setJobTitleSearch("");
//                   setEmpIdSearch("");
//                   setSectionSearch("");
//                   setCurrentPage(1);
//                 }}
//                 className="mt-6 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
//               >
//                 Clear Filters
//               </button>
//             </div>

//             {/* PDF Button */}
//             <div className="flex-1 min-w-[200px]">
//               <PDFEmpQR users={users} />
//             </div>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-200">
//               <tr>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Emp ID
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Eng Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Kh Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Dept Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Sect Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   QR Code
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {users.length > 0 ? (
//                 users.map((user) => (
//                   <tr key={user.emp_id}>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.emp_id}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.eng_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.kh_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.dept_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.sect_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       <button
//                         onClick={() => handleShowQR(user.emp_id)}
//                         className="text-blue-600 hover:text-blue-800"
//                       >
//                         <QrCode className="w-6 h-6" />
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td
//                     colSpan="6"
//                     className="px-4 py-3 text-center text-gray-500"
//                   >
//                     No users found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         <div className="flex justify-between items-center mt-6">
//           <div className="text-sm text-gray-600">
//             Showing {(currentPage - 1) * limit + 1} to{" "}
//             {Math.min(currentPage * limit, totalUsers)} of {totalUsers} users
//           </div>
//           <div className="flex space-x-2">
//             <button
//               onClick={handlePreviousPage}
//               disabled={currentPage === 1}
//               className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
//             >
//               <ChevronLeft className="w-5 h-5" />
//               Previous
//             </button>
//             {getPageNumbers().map((page) => (
//               <button
//                 key={page}
//                 onClick={() => handlePageChange(page)}
//                 className={`px-3 py-1 rounded-lg ${
//                   currentPage === page
//                     ? "bg-blue-600 text-white"
//                     : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//                 }`}
//               >
//                 {page}
//               </button>
//             ))}
//             <button
//               onClick={handleNextPage}
//               disabled={currentPage === totalPages}
//               className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
//             >
//               Next
//               <ChevronRight className="w-5 h-5" />
//             </button>
//           </div>
//         </div>

//         {/* QR Code Preview Modal */}
//         {selectedEmpId && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
//               <h2 className="text-xl font-semibold mb-4">QR Code Preview</h2>
//               <div className="flex flex-col items-center">
//                 <QRCode value={selectedEmpId} height={150} width={150} />
//                 <p className="mt-2 text-sm text-gray-600">
//                   Emp ID: {selectedEmpId}
//                 </p>
//               </div>
//               <button
//                 onClick={handleCloseQR}
//                 className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PrintEmpQR;

// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../config";
// import { QrCode, ChevronLeft, ChevronRight } from "lucide-react";
// import QRCode from "react-qr-code";
// import Swal from "sweetalert2";
// import { jsPDF } from "jspdf";
// import html2canvas from "html2canvas";

// // Constants for PDF layout
// const A4_WIDTH = 210; // A4 width in mm (portrait)
// const A4_HEIGHT = 297; // A4 height in mm (portrait)
// const QR_SIZE_MM = 20; // 2 cm x 2 cm for QR code
// const QR_SIZE_PX = 72; // Approximate pixel size for 2 cm at 96 DPI (2 cm = 20 mm, 1 mm ≈ 3.6 px at 96 DPI)
// const GRID_COLS = 8; // 8 QR codes per row
// const GRID_ROWS = 10; // 10 rows per page
// const MARGIN = 10; // 10 mm margin on all sides
// const SPACING = 5; // 5 mm spacing between QR codes
// const LABEL_HEIGHT = 5; // Height for Emp ID label below QR code (in mm)

// const PrintEmpQR = () => {
//   const [users, setUsers] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalUsers, setTotalUsers] = useState(0);
//   const [limit] = useState(10); // Number of users per page
//   const [selectedEmpId, setSelectedEmpId] = useState(null);

//   // Filter states
//   const [jobTitleSearch, setJobTitleSearch] = useState("");
//   const [empIdSearch, setEmpIdSearch] = useState("");
//   const [sectionSearch, setSectionSearch] = useState("");
//   const [jobTitleOptions, setJobTitleOptions] = useState([]);
//   const [empIdOptions, setEmpIdOptions] = useState([]);
//   const [sectionOptions, setSectionOptions] = useState([]);
//   const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false);
//   const [showEmpIdDropdown, setShowEmpIdDropdown] = useState(false);
//   const [showSectionDropdown, setShowSectionDropdown] = useState(false);
//   const [selectedJobTitle, setSelectedJobTitle] = useState("");
//   const [selectedEmpIdFilter, setSelectedEmpIdFilter] = useState("");
//   const [selectedSection, setSelectedSection] = useState("");
//   const jobTitleDropdownRef = useRef(null);
//   const empIdDropdownRef = useRef(null);
//   const sectionDropdownRef = useRef(null);
//   const qrCodeContainerRef = useRef(null);

//   // Fetch paginated users with filters
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/users-paginated`,
//           {
//             params: {
//               page: currentPage,
//               limit,
//               jobTitle: selectedJobTitle,
//               empId: selectedEmpIdFilter,
//               section: selectedSection
//             }
//           }
//         );
//         setUsers(response.data.users);
//         setTotalPages(response.data.totalPages);
//         setTotalUsers(response.data.total);
//       } catch (error) {
//         console.error("Error fetching users:", error);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch users."
//         });
//       }
//     };

//     fetchUsers();
//   }, [
//     currentPage,
//     limit,
//     selectedJobTitle,
//     selectedEmpIdFilter,
//     selectedSection
//   ]);

//   // Fetch Job Titles for dropdown
//   useEffect(() => {
//     const fetchJobTitles = async () => {
//       if (jobTitleSearch.trim() === "") {
//         setJobTitleOptions([]);
//         setShowJobTitleDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/job-titles`);
//         const filteredTitles = response.data.filter((title) =>
//           title.toLowerCase().includes(jobTitleSearch.toLowerCase())
//         );
//         setJobTitleOptions(filteredTitles);
//         setShowJobTitleDropdown(filteredTitles.length > 0);
//       } catch (error) {
//         console.error("Error fetching job titles:", error);
//         setJobTitleOptions([]);
//         setShowJobTitleDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch job titles."
//         });
//       }
//     };

//     fetchJobTitles();
//   }, [jobTitleSearch]);

//   // Fetch Emp IDs for dropdown
//   useEffect(() => {
//     const fetchEmpIds = async () => {
//       if (empIdSearch.trim() === "") {
//         setEmpIdOptions([]);
//         setShowEmpIdDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/search-users`, {
//           params: { q: empIdSearch }
//         });
//         const empIds = response.data.map((user) => user.emp_id);
//         setEmpIdOptions(empIds);
//         setShowEmpIdDropdown(empIds.length > 0);
//       } catch (error) {
//         console.error("Error fetching emp IDs:", error);
//         setEmpIdOptions([]);
//         setShowEmpIdDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch emp IDs."
//         });
//       }
//     };

//     fetchEmpIds();
//   }, [empIdSearch]);

//   // Fetch Sections for dropdown
//   useEffect(() => {
//     const fetchSections = async () => {
//       if (sectionSearch.trim() === "") {
//         setSectionOptions([]);
//         setShowSectionDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/sections`);
//         const filteredSections = response.data.filter((section) =>
//           section.toLowerCase().includes(sectionSearch.toLowerCase())
//         );
//         setSectionOptions(filteredSections);
//         setShowSectionDropdown(filteredSections.length > 0);
//       } catch (error) {
//         console.error("Error fetching sections:", error);
//         setSectionOptions([]);
//         setShowSectionDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch sections."
//         });
//       }
//     };

//     fetchSections();
//   }, [sectionSearch]);

//   // Handle clicks outside the dropdowns to close them
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         jobTitleDropdownRef.current &&
//         !jobTitleDropdownRef.current.contains(event.target)
//       ) {
//         setShowJobTitleDropdown(false);
//       }
//       if (
//         empIdDropdownRef.current &&
//         !empIdDropdownRef.current.contains(event.target)
//       ) {
//         setShowEmpIdDropdown(false);
//       }
//       if (
//         sectionDropdownRef.current &&
//         !sectionDropdownRef.current.contains(event.target)
//       ) {
//         setShowSectionDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   // Handle QR code preview
//   const handleShowQR = (empId) => {
//     setSelectedEmpId(empId);
//   };

//   // Close QR code preview
//   const handleCloseQR = () => {
//     setSelectedEmpId(null);
//   };

//   // Pagination handlers
//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   const handlePreviousPage = () => {
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//     }
//   };

//   const handleNextPage = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage(currentPage + 1);
//     }
//   };

//   // Generate page numbers for pagination
//   const getPageNumbers = () => {
//     const pageNumbers = [];
//     const maxPagesToShow = 5; // Show up to 5 page numbers at a time
//     let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
//     let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

//     // Adjust startPage if endPage is at the maximum
//     if (endPage === totalPages) {
//       startPage = Math.max(1, endPage - maxPagesToShow + 1);
//     }

//     for (let i = startPage; i <= endPage; i++) {
//       pageNumbers.push(i);
//     }

//     return pageNumbers;
//   };

//   // Function to generate PDF
//   const generatePDF = async () => {
//     if (!users || users.length === 0) {
//       Swal.fire({
//         icon: "warning",
//         title: "No Data",
//         text: "No users available to generate PDF."
//       });
//       return;
//     }

//     const doc = new jsPDF({
//       orientation: "portrait",
//       unit: "mm",
//       format: "a4"
//     });

//     // Group users by sect_name
//     const groupedUsers = users.reduce((acc, user) => {
//       const sectName = user.sect_name || "No Section";
//       if (!acc[sectName]) {
//         acc[sectName] = [];
//       }
//       acc[sectName].push(user);
//       return acc;
//     }, {});

//     let currentPage = 1;
//     let currentRow = 0;
//     let currentCol = 0;
//     let yOffset = MARGIN;

//     // Iterate over each section
//     for (const sectName of Object.keys(groupedUsers)) {
//       // Add section header
//       if (currentRow !== 0 || currentCol !== 0) {
//         doc.addPage();
//         currentPage++;
//         currentRow = 0;
//         currentCol = 0;
//         yOffset = MARGIN;
//       }

//       doc.setFontSize(14);
//       doc.text(`Section: ${sectName}`, MARGIN, yOffset);
//       yOffset += 10; // Space after section header

//       const usersInSection = groupedUsers[sectName];

//       // Iterate over users in the section
//       for (const user of usersInSection) {
//         // Calculate position
//         const x = MARGIN + currentCol * (QR_SIZE_MM + SPACING);
//         const y = yOffset + currentRow * (QR_SIZE_MM + LABEL_HEIGHT + SPACING);

//         // If we've filled the current page, add a new page
//         if (currentRow >= GRID_ROWS) {
//           doc.addPage();
//           currentPage++;
//           currentRow = 0;
//           currentCol = 0;
//           yOffset = MARGIN;

//           // Add section header again on the new page
//           doc.setFontSize(14);
//           doc.text(`Section: ${sectName} (Continued)`, MARGIN, yOffset);
//           yOffset += 10;
//         }

//         try {
//           // Render the QR code in the hidden container
//           const qrContainer = qrCodeContainerRef.current;
//           qrContainer.innerHTML = ""; // Clear previous QR code
//           const qrWrapper = document.createElement("div");
//           qrWrapper.style.width = `${QR_SIZE_PX}px`;
//           qrWrapper.style.height = `${QR_SIZE_PX}px`;
//           qrContainer.appendChild(qrWrapper);

//           // Create a React element for the QR code
//           const qrElement = <QRCode value={user.emp_id} size={QR_SIZE_PX} />;

//           // Temporarily render the QR code to capture it
//           qrWrapper.appendChild(
//             document.createElementNS("http://www.w3.org/2000/svg", "svg")
//           );
//           qrWrapper.querySelector("svg").outerHTML = qrElement.props
//             .dangerouslySetInnerHTML
//             ? qrElement.props.dangerouslySetInnerHTML.__html
//             : `<svg width="${QR_SIZE_PX}" height="${QR_SIZE_PX}"></svg>`;

//           // Use html2canvas to capture the QR code as an image
//           const canvas = await html2canvas(qrWrapper, {
//             scale: 2, // Increase resolution for better quality
//             width: QR_SIZE_PX,
//             height: QR_SIZE_PX
//           });
//           const imgData = canvas.toDataURL("image/png");

//           // Add QR code to PDF
//           doc.addImage(imgData, "PNG", x, y, QR_SIZE_MM, QR_SIZE_MM);

//           // Add Emp ID label below QR code
//           doc.setFontSize(8);
//           doc.text(user.emp_id, x + QR_SIZE_MM / 2, y + QR_SIZE_MM + 3, {
//             align: "center"
//           });
//         } catch (error) {
//           console.error(
//             `Failed to generate QR code for ${user.emp_id}:`,
//             error
//           );
//           // Add a placeholder text in case of failure
//           doc.setFontSize(8);
//           doc.text(
//             `QR Error: ${user.emp_id}`,
//             x + QR_SIZE_MM / 2,
//             y + QR_SIZE_MM / 2,
//             { align: "center" }
//           );
//         }

//         // Update grid position
//         currentCol++;
//         if (currentCol >= GRID_COLS) {
//           currentCol = 0;
//           currentRow++;
//         }
//       }

//       // Reset the grid for the next section
//       currentRow = 0;
//       currentCol = 0;
//       yOffset = MARGIN;
//     }

//     // Save the PDF and trigger download
//     const pdfBlob = doc.output("blob");
//     const url = URL.createObjectURL(pdfBlob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = "Employee_QR_Codes.pdf";
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
//       <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
//         <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
//           Employee QR Code List
//         </h1>

//         {/* Filter Panel */}
//         <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
//           <div className="flex flex-wrap gap-4 items-center">
//             {/* Job Title Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Job Title
//               </label>
//               <div className="relative" ref={jobTitleDropdownRef}>
//                 <input
//                   type="text"
//                   value={jobTitleSearch}
//                   onChange={(e) => setJobTitleSearch(e.target.value)}
//                   placeholder="Search Job Title..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showJobTitleDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {jobTitleOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedJobTitle(option);
//                           setJobTitleSearch(option);
//                           setShowJobTitleDropdown(false);
//                           setCurrentPage(1); // Reset to first page on filter change
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

//             {/* Emp ID Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Emp ID
//               </label>
//               <div className="relative" ref={empIdDropdownRef}>
//                 <input
//                   type="text"
//                   value={empIdSearch}
//                   onChange={(e) => setEmpIdSearch(e.target.value)}
//                   placeholder="Search Emp ID..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showEmpIdDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {empIdOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedEmpIdFilter(option);
//                           setEmpIdSearch(option);
//                           setShowEmpIdDropdown(false);
//                           setCurrentPage(1); // Reset to first page on filter change
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

//             {/* Section Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Section
//               </label>
//               <div className="relative" ref={sectionDropdownRef}>
//                 <input
//                   type="text"
//                   value={sectionSearch}
//                   onChange={(e) => setSectionSearch(e.target.value)}
//                   placeholder="Search Section..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showSectionDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {sectionOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedSection(option);
//                           setSectionSearch(option);
//                           setShowSectionDropdown(false);
//                           setCurrentPage(1); // Reset to first page on filter change
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

//             {/* Clear Filters Button */}
//             <div className="flex-1 min-w-[200px]">
//               <button
//                 onClick={() => {
//                   setSelectedJobTitle("");
//                   setSelectedEmpIdFilter("");
//                   setSelectedSection("");
//                   setJobTitleSearch("");
//                   setEmpIdSearch("");
//                   setSectionSearch("");
//                   setCurrentPage(1);
//                 }}
//                 className="mt-6 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
//               >
//                 Clear Filters
//               </button>
//             </div>

//             {/* PDF Button */}
//             <div className="flex-1 min-w-[200px]">
//               <button
//                 onClick={generatePDF}
//                 className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
//                 disabled={users.length === 0}
//               >
//                 <svg
//                   className="w-5 h-5 mr-2"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                   xmlns="http://www.w3.org/2000/svg"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth="2"
//                     d="M12 4v16m8-8H4"
//                   ></path>
//                 </svg>
//                 Download PDF
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Hidden container for rendering QR codes */}
//         <div
//           ref={qrCodeContainerRef}
//           style={{ position: "absolute", left: "-9999px" }}
//         ></div>

//         {/* Table */}
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-200">
//               <tr>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Emp ID
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Eng Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Kh Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Dept Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Sect Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   QR Code
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {users.length > 0 ? (
//                 users.map((user) => (
//                   <tr key={user.emp_id}>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.emp_id}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.eng_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.kh_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.dept_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.sect_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       <button
//                         onClick={() => handleShowQR(user.emp_id)}
//                         className="text-blue-600 hover:text-blue-800"
//                       >
//                         <QrCode className="w-6 h-6" />
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td
//                     colSpan="6"
//                     className="px-4 py-3 text-center text-gray-500"
//                   >
//                     No users found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         <div className="flex justify-between items-center mt-6">
//           <div className="text-sm text-gray-600">
//             Showing {(currentPage - 1) * limit + 1} to{" "}
//             {Math.min(currentPage * limit, totalUsers)} of {totalUsers} users
//           </div>
//           <div className="flex space-x-2">
//             <button
//               onClick={handlePreviousPage}
//               disabled={currentPage === 1}
//               className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
//             >
//               <ChevronLeft className="w-5 h-5" />
//               Previous
//             </button>
//             {getPageNumbers().map((page) => (
//               <button
//                 key={page}
//                 onClick={() => handlePageChange(page)}
//                 className={`px-3 py-1 rounded-lg ${
//                   currentPage === page
//                     ? "bg-blue-600 text-white"
//                     : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//                 }`}
//               >
//                 {page}
//               </button>
//             ))}
//             <button
//               onClick={handleNextPage}
//               disabled={currentPage === totalPages}
//               className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
//             >
//               Next
//               <ChevronRight className="w-5 h-5" />
//             </button>
//           </div>
//         </div>

//         {/* QR Code Preview Modal */}
//         {selectedEmpId && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
//               <h2 className="text-xl font-semibold mb-4">QR Code Preview</h2>
//               <div className="flex flex-col items-center">
//                 <QRCode value={selectedEmpId} height={150} width={150} />
//                 <p className="mt-2 text-sm text-gray-600">
//                   Emp ID: {selectedEmpId}
//                 </p>
//               </div>
//               <button
//                 onClick={handleCloseQR}
//                 className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PrintEmpQR;

// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../config";
// import { QrCode, ChevronLeft, ChevronRight } from "lucide-react";
// import QRCode from "react-qr-code";
// import Swal from "sweetalert2";

// // Constants for layout
// const QR_SIZE_PX = 72; // Approximate pixel size for 2 cm at 96 DPI
// const GRID_COLS = 8; // 8 QR codes per row

// const PrintEmpQR = () => {
//   const [users, setUsers] = useState([]); // For paginated table display
//   const [allUsers, setAllUsers] = useState([]); // For preview (all filtered users)
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalUsers, setTotalUsers] = useState(0);
//   const [limit] = useState(10); // Number of users per page for table
//   const [selectedEmpId, setSelectedEmpId] = useState(null);

//   // Filter states
//   const [jobTitleSearch, setJobTitleSearch] = useState("");
//   const [empIdSearch, setEmpIdSearch] = useState("");
//   const [sectionSearch, setSectionSearch] = useState("");
//   const [jobTitleOptions, setJobTitleOptions] = useState([]);
//   const [empIdOptions, setEmpIdOptions] = useState([]);
//   const [sectionOptions, setSectionOptions] = useState([]);
//   const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false);
//   const [showEmpIdDropdown, setShowEmpIdDropdown] = useState(false);
//   const [showSectionDropdown, setShowSectionDropdown] = useState(false);
//   const [selectedJobTitle, setSelectedJobTitle] = useState("");
//   const [selectedEmpIdFilter, setSelectedEmpIdFilter] = useState("");
//   const [selectedSection, setSelectedSection] = useState("");
//   const jobTitleDropdownRef = useRef(null);
//   const empIdDropdownRef = useRef(null);
//   const sectionDropdownRef = useRef(null);

//   // Fetch paginated users for table display
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/users-paginated`,
//           {
//             params: {
//               page: currentPage,
//               limit,
//               jobTitle: selectedJobTitle,
//               empId: selectedEmpIdFilter,
//               section: selectedSection
//             }
//           }
//         );
//         setUsers(response.data.users);
//         setTotalPages(response.data.totalPages);
//         setTotalUsers(response.data.total);
//       } catch (error) {
//         console.error("Error fetching users:", error);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch users."
//         });
//       }
//     };

//     fetchUsers();
//   }, [
//     currentPage,
//     limit,
//     selectedJobTitle,
//     selectedEmpIdFilter,
//     selectedSection
//   ]);

//   // Fetch all filtered users for preview (ignoring pagination)
//   useEffect(() => {
//     const fetchAllUsers = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/users-paginated`,
//           {
//             params: {
//               page: 1, // Fetch all users by setting a high limit
//               limit: 10000, // Large limit to get all filtered users
//               jobTitle: selectedJobTitle,
//               empId: selectedEmpIdFilter,
//               section: selectedSection
//             }
//           }
//         );
//         setAllUsers(response.data.users);
//       } catch (error) {
//         console.error("Error fetching all users:", error);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch all users."
//         });
//       }
//     };

//     fetchAllUsers();
//   }, [selectedJobTitle, selectedEmpIdFilter, selectedSection]);

//   // Fetch Job Titles for dropdown
//   useEffect(() => {
//     const fetchJobTitles = async () => {
//       if (jobTitleSearch.trim() === "") {
//         setJobTitleOptions([]);
//         setShowJobTitleDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/job-titles`);
//         const filteredTitles = response.data.filter((title) =>
//           title.toLowerCase().includes(jobTitleSearch.toLowerCase())
//         );
//         setJobTitleOptions(filteredTitles);
//         setShowJobTitleDropdown(filteredTitles.length > 0);
//       } catch (error) {
//         console.error("Error fetching job titles:", error);
//         setJobTitleOptions([]);
//         setShowJobTitleDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch job titles."
//         });
//       }
//     };

//     fetchJobTitles();
//   }, [jobTitleSearch]);

//   // Fetch Emp IDs for dropdown
//   useEffect(() => {
//     const fetchEmpIds = async () => {
//       if (empIdSearch.trim() === "") {
//         setEmpIdOptions([]);
//         setShowEmpIdDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/search-users`, {
//           params: { q: empIdSearch }
//         });
//         const empIds = response.data.map((user) => user.emp_id);
//         setEmpIdOptions(empIds);
//         setShowEmpIdDropdown(empIds.length > 0);
//       } catch (error) {
//         console.error("Error fetching emp IDs:", error);
//         setEmpIdOptions([]);
//         setShowEmpIdDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch emp IDs."
//         });
//       }
//     };

//     fetchEmpIds();
//   }, [empIdSearch]);

//   // Fetch Sections for dropdown
//   useEffect(() => {
//     const fetchSections = async () => {
//       if (sectionSearch.trim() === "") {
//         setSectionOptions([]);
//         setShowSectionDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/sections`);
//         const filteredSections = response.data.filter((section) =>
//           section.toLowerCase().includes(sectionSearch.toLowerCase())
//         );
//         setSectionOptions(filteredSections);
//         setShowSectionDropdown(filteredSections.length > 0);
//       } catch (error) {
//         console.error("Error fetching sections:", error);
//         setSectionOptions([]);
//         setShowSectionDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch sections."
//         });
//       }
//     };

//     fetchSections();
//   }, [sectionSearch]);

//   // Handle clicks outside the dropdowns to close them
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         jobTitleDropdownRef.current &&
//         !jobTitleDropdownRef.current.contains(event.target)
//       ) {
//         setShowJobTitleDropdown(false);
//       }
//       if (
//         empIdDropdownRef.current &&
//         !empIdDropdownRef.current.contains(event.target)
//       ) {
//         setShowEmpIdDropdown(false);
//       }
//       if (
//         sectionDropdownRef.current &&
//         !sectionDropdownRef.current.contains(event.target)
//       ) {
//         setShowSectionDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   // Handle QR code preview in table
//   const handleShowQR = (empId) => {
//     setSelectedEmpId(empId);
//   };

//   // Close QR code preview in table
//   const handleCloseQR = () => {
//     setSelectedEmpId(null);
//   };

//   // Pagination handlers
//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   const handlePreviousPage = () => {
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//     }
//   };

//   const handleNextPage = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage(currentPage + 1);
//     }
//   };

//   // Generate page numbers for pagination
//   const getPageNumbers = () => {
//     const pageNumbers = [];
//     const maxPagesToShow = 5;
//     let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
//     let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

//     if (endPage === totalPages) {
//       startPage = Math.max(1, endPage - maxPagesToShow + 1);
//     }

//     for (let i = startPage; i <= endPage; i++) {
//       pageNumbers.push(i);
//     }

//     return pageNumbers;
//   };

//   // Function to open preview window with all QR codes
//   const openPreviewWindow = () => {
//     if (!allUsers || allUsers.length === 0) {
//       Swal.fire({
//         icon: "warning",
//         title: "No Data",
//         text: "No users available to preview."
//       });
//       return;
//     }

//     // Open a new popup window
//     const previewWindow = window.open(
//       "",
//       "QR Code Preview",
//       "width=800,height=600,scrollbars=yes"
//     );

//     // Group users by sect_name
//     const groupedUsers = allUsers.reduce((acc, user) => {
//       const sectName = user.sect_name || "No Section";
//       if (!acc[sectName]) {
//         acc[sectName] = [];
//       }
//       acc[sectName].push(user);
//       return acc;
//     }, {});

//     // Create HTML content for the preview window
//     let htmlContent = `
//       <html>
//         <head>
//           <title>QR Code Preview</title>
//           <style>
//             body {
//               font-family: Arial, sans-serif;
//               margin: 20px;
//             }
//             .section {
//               margin-bottom: 30px;
//             }
//             .section-header {
//               font-size: 18px;
//               font-weight: bold;
//               margin-bottom: 10px;
//             }
//             .qr-grid {
//               display: grid;
//               grid-template-columns: repeat(${GRID_COLS}, 1fr);
//               gap: 10px;
//             }
//             .qr-item {
//               text-align: center;
//             }
//             .qr-code {
//               width: ${QR_SIZE_PX}px;
//               height: ${QR_SIZE_PX}px;
//             }
//             .emp-id {
//               margin-top: 5px;
//               font-size: 12px;
//             }
//             .close-button {
//               position: fixed;
//               top: 10px;
//               right: 10px;
//               padding: 10px 20px;
//               background-color: #dc3545;
//               color: white;
//               border: none;
//               cursor: pointer;
//             }
//           </style>
//         </head>
//         <body>
//           <button class="close-button" onclick="window.close()">Close</button>
//           <div id="qr-container">
//     `;

//     // Iterate over each section
//     for (const sectName of Object.keys(groupedUsers)) {
//       htmlContent += `
//         <div class="section">
//           <div class="section-header">Section: ${sectName}</div>
//           <div class="qr-grid">
//       `;

//       const usersInSection = groupedUsers[sectName];

//       // Iterate over users in the section
//       for (const user of usersInSection) {
//         const qrValue = user.emp_id;
//         const qrCode = <QRCode value={qrValue} size={QR_SIZE_PX} />;
//         const qrSvg = qrCode.props.dangerouslySetInnerHTML
//           ? qrCode.props.dangerouslySetInnerHTML.__html
//           : `<svg width="${QR_SIZE_PX}" height="${QR_SIZE_PX}"></svg>`;

//         htmlContent += `
//           <div class="qr-item">
//             <div class="qr-code">${qrSvg}</div>
//             <div class="emp-id">${user.emp_id}</div>
//           </div>
//         `;
//       }

//       htmlContent += `
//           </div>
//         </div>
//       `;
//     }

//     htmlContent += `
//           </div>
//         </body>
//       </html>
//     `;

//     // Write the HTML content to the new window
//     previewWindow.document.write(htmlContent);
//     previewWindow.document.close();
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
//       <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
//         <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
//           Employee QR Code List
//         </h1>

//         {/* Filter Panel */}
//         <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
//           <div className="flex flex-wrap gap-4 items-center">
//             {/* Job Title Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Job Title
//               </label>
//               <div className="relative" ref={jobTitleDropdownRef}>
//                 <input
//                   type="text"
//                   value={jobTitleSearch}
//                   onChange={(e) => setJobTitleSearch(e.target.value)}
//                   placeholder="Search Job Title..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showJobTitleDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {jobTitleOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedJobTitle(option);
//                           setJobTitleSearch(option);
//                           setShowJobTitleDropdown(false);
//                           setCurrentPage(1);
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

//             {/* Emp ID Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Emp ID
//               </label>
//               <div className="relative" ref={empIdDropdownRef}>
//                 <input
//                   type="text"
//                   value={empIdSearch}
//                   onChange={(e) => setEmpIdSearch(e.target.value)}
//                   placeholder="Search Emp ID..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showEmpIdDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {empIdOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedEmpIdFilter(option);
//                           setEmpIdSearch(option);
//                           setShowEmpIdDropdown(false);
//                           setCurrentPage(1);
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

//             {/* Section Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Section
//               </label>
//               <div className="relative" ref={sectionDropdownRef}>
//                 <input
//                   type="text"
//                   value={sectionSearch}
//                   onChange={(e) => setSectionSearch(e.target.value)}
//                   placeholder="Search Section..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showSectionDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {sectionOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedSection(option);
//                           setSectionSearch(option);
//                           setShowSectionDropdown(false);
//                           setCurrentPage(1);
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

//             {/* Clear Filters Button */}
//             <div className="flex-1 min-w-[200px]">
//               <button
//                 onClick={() => {
//                   setSelectedJobTitle("");
//                   setSelectedEmpIdFilter("");
//                   setSelectedSection("");
//                   setJobTitleSearch("");
//                   setEmpIdSearch("");
//                   setSectionSearch("");
//                   setCurrentPage(1);
//                 }}
//                 className="mt-6 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
//               >
//                 Clear Filters
//               </button>
//             </div>

//             {/* Preview Button */}
//             <div className="flex-1 min-w-[200px]">
//               <button
//                 onClick={openPreviewWindow}
//                 className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
//                 disabled={allUsers.length === 0}
//               >
//                 <QrCode className="w-5 h-5 mr-2" />
//                 Preview
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-200">
//               <tr>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Emp ID
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Eng Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Kh Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Dept Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Sect Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   QR Code
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {users.length > 0 ? (
//                 users.map((user) => (
//                   <tr key={user.emp_id}>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.emp_id}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.eng_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.kh_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.dept_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.sect_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       <button
//                         onClick={() => handleShowQR(user.emp_id)}
//                         className="text-blue-600 hover:text-blue-800"
//                       >
//                         <QrCode className="w-6 h-6" />
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td
//                     colSpan="6"
//                     className="px-4 py-3 text-center text-gray-500"
//                   >
//                     No users found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         <div className="flex justify-between items-center mt-6">
//           <div className="text-sm text-gray-600">
//             {`Showing ${(currentPage - 1) * limit + 1} to ${Math.min(
//               currentPage * limit,
//               totalUsers
//             )} of ${totalUsers} users`}
//           </div>
//           <div className="flex space-x-2">
//             <button
//               onClick={handlePreviousPage}
//               disabled={currentPage === 1}
//               className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
//             >
//               <ChevronLeft className="w-5 h-5" />
//               Previous
//             </button>
//             {getPageNumbers().map((page) => (
//               <button
//                 key={page}
//                 onClick={() => handlePageChange(page)}
//                 className={`px-3 py-1 rounded-lg ${
//                   currentPage === page
//                     ? "bg-blue-600 text-white"
//                     : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//                 }`}
//               >
//                 {page}
//               </button>
//             ))}
//             <button
//               onClick={handleNextPage}
//               disabled={currentPage === totalPages}
//               className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
//             >
//               Next
//               <ChevronRight className="w-5 h-5" />
//             </button>
//           </div>
//         </div>

//         {/* QR Code Preview Modal (for individual QR in table) */}
//         {selectedEmpId && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
//               <h2 className="text-xl font-semibold mb-4">QR Code Preview</h2>
//               <div className="flex flex-col items-center">
//                 <QRCode value={selectedEmpId} height={150} width={150} />
//                 <p className="mt-2 text-sm text-gray-600">
//                   Emp ID: {selectedEmpId}
//                 </p>
//               </div>
//               <button
//                 onClick={handleCloseQR}
//                 className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PrintEmpQR;

// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../config";
// import { QrCode, ChevronLeft, ChevronRight } from "lucide-react";
// import QRCode from "react-qr-code";
// import Swal from "sweetalert2";

// // Constants for layout
// const QR_SIZE_PX = 72; // Approximate pixel size for 2 cm at 96 DPI
// const GRID_COLS = 8; // 8 QR codes per row

// const PrintEmpQR = () => {
//   const [users, setUsers] = useState([]); // For paginated table display
//   const [allUsers, setAllUsers] = useState([]); // For preview (all filtered users)
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalUsers, setTotalUsers] = useState(0);
//   const [limit] = useState(10); // Number of users per page for table
//   const [selectedEmpId, setSelectedEmpId] = useState(null);

//   // Filter states
//   const [jobTitleSearch, setJobTitleSearch] = useState("");
//   const [empIdSearch, setEmpIdSearch] = useState("");
//   const [sectionSearch, setSectionSearch] = useState("");
//   const [jobTitleOptions, setJobTitleOptions] = useState([]);
//   const [empIdOptions, setEmpIdOptions] = useState([]);
//   const [sectionOptions, setSectionOptions] = useState([]);
//   const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false);
//   const [showEmpIdDropdown, setShowEmpIdDropdown] = useState(false);
//   const [showSectionDropdown, setShowSectionDropdown] = useState(false);
//   const [selectedJobTitle, setSelectedJobTitle] = useState("");
//   const [selectedEmpIdFilter, setSelectedEmpIdFilter] = useState("");
//   const [selectedSection, setSelectedSection] = useState("");
//   const jobTitleDropdownRef = useRef(null);
//   const empIdDropdownRef = useRef(null);
//   const sectionDropdownRef = useRef(null);
//   const qrCodeContainerRef = useRef(null);

//   // Fetch paginated users for table display
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/users-paginated`,
//           {
//             params: {
//               page: currentPage,
//               limit,
//               jobTitle: selectedJobTitle,
//               empId: selectedEmpIdFilter,
//               section: selectedSection
//             }
//           }
//         );
//         setUsers(response.data.users);
//         setTotalPages(response.data.totalPages);
//         setTotalUsers(response.data.total);
//       } catch (error) {
//         console.error("Error fetching users:", error);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch users."
//         });
//       }
//     };

//     fetchUsers();
//   }, [
//     currentPage,
//     limit,
//     selectedJobTitle,
//     selectedEmpIdFilter,
//     selectedSection
//   ]);

//   // Fetch all filtered users for preview (ignoring pagination)
//   useEffect(() => {
//     const fetchAllUsers = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/users-paginated`,
//           {
//             params: {
//               page: 1,
//               limit: 10000,
//               jobTitle: selectedJobTitle,
//               empId: selectedEmpIdFilter,
//               section: selectedSection
//             }
//           }
//         );
//         setAllUsers(response.data.users);
//       } catch (error) {
//         console.error("Error fetching all users:", error);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch all users."
//         });
//       }
//     };

//     fetchAllUsers();
//   }, [selectedJobTitle, selectedEmpIdFilter, selectedSection]);

//   // Fetch Job Titles for dropdown
//   useEffect(() => {
//     const fetchJobTitles = async () => {
//       if (jobTitleSearch.trim() === "") {
//         setJobTitleOptions([]);
//         setShowJobTitleDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/job-titles`);
//         const filteredTitles = response.data.filter((title) =>
//           title.toLowerCase().includes(jobTitleSearch.toLowerCase())
//         );
//         setJobTitleOptions(filteredTitles);
//         setShowJobTitleDropdown(filteredTitles.length > 0);
//       } catch (error) {
//         console.error("Error fetching job titles:", error);
//         setJobTitleOptions([]);
//         setShowJobTitleDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch job titles."
//         });
//       }
//     };

//     fetchJobTitles();
//   }, [jobTitleSearch]);

//   // Fetch Emp IDs for dropdown
//   useEffect(() => {
//     const fetchEmpIds = async () => {
//       if (empIdSearch.trim() === "") {
//         setEmpIdOptions([]);
//         setShowEmpIdDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/search-users`, {
//           params: { q: empIdSearch }
//         });
//         const empIds = response.data.map((user) => user.emp_id);
//         setEmpIdOptions(empIds);
//         setShowEmpIdDropdown(empIds.length > 0);
//       } catch (error) {
//         console.error("Error fetching emp IDs:", error);
//         setEmpIdOptions([]);
//         setShowEmpIdDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch emp IDs."
//         });
//       }
//     };

//     fetchEmpIds();
//   }, [empIdSearch]);

//   // Fetch Sections for dropdown
//   useEffect(() => {
//     const fetchSections = async () => {
//       if (sectionSearch.trim() === "") {
//         setSectionOptions([]);
//         setShowSectionDropdown(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/sections`);
//         const filteredSections = response.data.filter((section) =>
//           section.toLowerCase().includes(sectionSearch.toLowerCase())
//         );
//         setSectionOptions(filteredSections);
//         setShowSectionDropdown(filteredSections.length > 0);
//       } catch (error) {
//         console.error("Error fetching sections:", error);
//         setSectionOptions([]);
//         setShowSectionDropdown(false);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to fetch sections."
//         });
//       }
//     };

//     fetchSections();
//   }, [sectionSearch]);

//   // Handle clicks outside the dropdowns to close them
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         jobTitleDropdownRef.current &&
//         !jobTitleDropdownRef.current.contains(event.target)
//       ) {
//         setShowJobTitleDropdown(false);
//       }
//       if (
//         empIdDropdownRef.current &&
//         !empIdDropdownRef.current.contains(event.target)
//       ) {
//         setShowEmpIdDropdown(false);
//       }
//       if (
//         sectionDropdownRef.current &&
//         !sectionDropdownRef.current.contains(event.target)
//       ) {
//         setShowSectionDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   // Handle QR code preview in table
//   const handleShowQR = (empId) => {
//     setSelectedEmpId(empId);
//   };

//   // Close QR code preview in table
//   const handleCloseQR = () => {
//     setSelectedEmpId(null);
//   };

//   // Pagination handlers
//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   const handlePreviousPage = () => {
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//     }
//   };

//   const handleNextPage = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage(currentPage + 1);
//     }
//   };

//   // Generate page numbers for pagination
//   const getPageNumbers = () => {
//     const pageNumbers = [];
//     const maxPagesToShow = 5;
//     let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
//     let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

//     if (endPage === totalPages) {
//       startPage = Math.max(1, endPage - maxPagesToShow + 1);
//     }

//     for (let i = startPage; i <= endPage; i++) {
//       pageNumbers.push(i);
//     }

//     return pageNumbers;
//   };

//   // Function to convert an SVG element to a PNG data URL
//   const svgToImage = (svgElement) => {
//     return new Promise((resolve, reject) => {
//       try {
//         const svgString = new XMLSerializer().serializeToString(svgElement);
//         const img = new Image();
//         img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;

//         img.onload = () => {
//           const canvas = document.createElement("canvas");
//           canvas.width = QR_SIZE_PX;
//           canvas.height = QR_SIZE_PX;
//           const ctx = canvas.getContext("2d");
//           ctx.drawImage(img, 0, 0, QR_SIZE_PX, QR_SIZE_PX);
//           const imgData = canvas.toDataURL("image/png");
//           resolve(imgData);
//         };

//         img.onerror = (err) => {
//           reject(new Error("Failed to load SVG as image: " + err.message));
//         };
//       } catch (error) {
//         reject(error);
//       }
//     });
//   };

//   // Function to open preview window with all QR codes
//   const openPreviewWindow = async () => {
//     if (!allUsers || allUsers.length === 0) {
//       Swal.fire({
//         icon: "warning",
//         title: "No Data",
//         text: "No users available to preview."
//       });
//       return;
//     }

//     // Ensure the QR code container exists
//     if (!qrCodeContainerRef.current) {
//       console.error("QR code container ref is not available");
//       return;
//     }

//     // Group users by sect_name
//     const groupedUsers = allUsers.reduce((acc, user) => {
//       const sectName = user.sect_name || "No Section";
//       if (!acc[sectName]) {
//         acc[sectName] = [];
//       }
//       acc[sectName].push(user);
//       return acc;
//     }, {});

//     // Pre-render all QR codes in the hidden container
//     const qrImages = await Promise.all(
//       allUsers.map(async (user, index) => {
//         try {
//           // Wait for the QR code to render in the DOM
//           await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay to ensure rendering

//           const svgElement = qrCodeContainerRef.current.querySelector(
//             `#qr-code-${index}`
//           );
//           if (!svgElement) {
//             throw new Error(`SVG element for ${user.emp_id} not found`);
//           }

//           const imgData = await svgToImage(svgElement);
//           return { user, imgData };
//         } catch (error) {
//           console.error(
//             `Failed to generate QR code for ${user.emp_id}:`,
//             error
//           );
//           return { user, imgData: null };
//         }
//       })
//     );

//     // Open a new popup window
//     const previewWindow = window.open(
//       "",
//       "QR Code Preview",
//       "width=800,height=600,scrollbars=yes"
//     );

//     // Create HTML content for the preview window
//     let htmlContent = `
//       <html>
//         <head>
//           <title>QR Code Preview</title>
//           <style>
//             body {
//               font-family: Arial, sans-serif;
//               margin: 20px;
//             }
//             .section {
//               margin-bottom: 30px;
//             }
//             .section-header {
//               font-size: 18px;
//               font-weight: bold;
//               margin-bottom: 10px;
//             }
//             .qr-grid {
//               display: grid;
//               grid-template-columns: repeat(${GRID_COLS}, 1fr);
//               gap: 10px;
//             }
//             .qr-item {
//               text-align: center;
//             }
//             .qr-code {
//               width: ${QR_SIZE_PX}px;
//               height: ${QR_SIZE_PX}px;
//             }
//             .emp-id {
//               margin-top: 5px;
//               font-size: 12px;
//             }
//             .close-button {
//               position: fixed;
//               top: 10px;
//               right: 10px;
//               padding: 10px 20px;
//               background-color: #dc3545;
//               color: white;
//               border: none;
//               cursor: pointer;
//             }
//           </style>
//         </head>
//         <body>
//           <button class="close-button" onclick="window.close()">Close</button>
//           <div id="qr-container">
//     `;

//     // Iterate over each section
//     for (const sectName of Object.keys(groupedUsers)) {
//       htmlContent += `
//         <div class="section">
//           <div class="section-header">Section: ${sectName}</div>
//           <div class="qr-grid">
//       `;

//       const usersInSection = groupedUsers[sectName];

//       // Iterate over users in the section
//       for (const user of usersInSection) {
//         const qrData = qrImages.find(
//           (item) => item.user.emp_id === user.emp_id
//         );
//         const imgSrc = qrData.imgData || "";

//         htmlContent += `
//           <div class="qr-item">
//             ${
//               imgSrc
//                 ? `<img src="${imgSrc}" class="qr-code" />`
//                 : `<div class="qr-code" style="color: red;">QR Error</div>`
//             }
//             <div class="emp-id">${user.emp_id}</div>
//           </div>
//         `;
//       }

//       htmlContent += `
//           </div>
//         </div>
//       `;
//     }

//     htmlContent += `
//           </div>
//         </body>
//       </html>
//     `;

//     // Write the HTML content to the new window
//     previewWindow.document.write(htmlContent);
//     previewWindow.document.close();
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
//       <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
//         <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
//           Employee QR Code List
//         </h1>

//         {/* Filter Panel */}
//         <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
//           <div className="flex flex-wrap gap-4 items-center">
//             {/* Job Title Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Job Title
//               </label>
//               <div className="relative" ref={jobTitleDropdownRef}>
//                 <input
//                   type="text"
//                   value={jobTitleSearch}
//                   onChange={(e) => setJobTitleSearch(e.target.value)}
//                   placeholder="Search Job Title..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showJobTitleDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {jobTitleOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedJobTitle(option);
//                           setJobTitleSearch(option);
//                           setShowJobTitleDropdown(false);
//                           setCurrentPage(1);
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

//             {/* Emp ID Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Emp ID
//               </label>
//               <div className="relative" ref={empIdDropdownRef}>
//                 <input
//                   type="text"
//                   value={empIdSearch}
//                   onChange={(e) => setEmpIdSearch(e.target.value)}
//                   placeholder="Search Emp ID..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showEmpIdDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {empIdOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedEmpIdFilter(option);
//                           setEmpIdSearch(option);
//                           setShowEmpIdDropdown(false);
//                           setCurrentPage(1);
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

//             {/* Section Filter */}
//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-sm font-medium text-gray-700">
//                 Section
//               </label>
//               <div className="relative" ref={sectionDropdownRef}>
//                 <input
//                   type="text"
//                   value={sectionSearch}
//                   onChange={(e) => setSectionSearch(e.target.value)}
//                   placeholder="Search Section..."
//                   className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//                 />
//                 {showSectionDropdown && (
//                   <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
//                     {sectionOptions.map((option, index) => (
//                       <li
//                         key={index}
//                         onClick={() => {
//                           setSelectedSection(option);
//                           setSectionSearch(option);
//                           setShowSectionDropdown(false);
//                           setCurrentPage(1);
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

//             {/* Clear Filters Button */}
//             <div className="flex-1 min-w-[200px]">
//               <button
//                 onClick={() => {
//                   setSelectedJobTitle("");
//                   setSelectedEmpIdFilter("");
//                   setSelectedSection("");
//                   setJobTitleSearch("");
//                   setEmpIdSearch("");
//                   setSectionSearch("");
//                   setCurrentPage(1);
//                 }}
//                 className="mt-6 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
//               >
//                 Clear Filters
//               </button>
//             </div>

//             {/* Preview Button */}
//             <div className="flex-1 min-w-[200px]">
//               <button
//                 onClick={openPreviewWindow}
//                 className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
//                 disabled={allUsers.length === 0}
//               >
//                 <QrCode className="w-5 h-5 mr-2" />
//                 Preview
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-200">
//               <tr>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Emp ID
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Eng Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Kh Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Dept Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   Sect Name
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
//                   QR Code
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {users.length > 0 ? (
//                 users.map((user) => (
//                   <tr key={user.emp_id}>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.emp_id}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.eng_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.kh_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.dept_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       {user.sect_name || "N/A"}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-700">
//                       <button
//                         onClick={() => handleShowQR(user.emp_id)}
//                         className="text-blue-600 hover:text-blue-800"
//                       >
//                         <QrCode className="w-6 h-6" />
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td
//                     colSpan="6"
//                     className="px-4 py-3 text-center text-gray-500"
//                   >
//                     No users found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         <div className="flex justify-between items-center mt-6">
//           <div className="text-sm text-gray-600">
//             {`Showing ${(currentPage - 1) * limit + 1} to ${Math.min(
//               currentPage * limit,
//               totalUsers
//             )} of ${totalUsers} users`}
//           </div>
//           <div className="flex space-x-2">
//             <button
//               onClick={handlePreviousPage}
//               disabled={currentPage === 1}
//               className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
//             >
//               <ChevronLeft className="w-5 h-5" />
//               Previous
//             </button>
//             {getPageNumbers().map((page) => (
//               <button
//                 key={page}
//                 onClick={() => handlePageChange(page)}
//                 className={`px-3 py-1 rounded-lg ${
//                   currentPage === page
//                     ? "bg-blue-600 text-white"
//                     : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//                 }`}
//               >
//                 {page}
//               </button>
//             ))}
//             <button
//               onClick={handleNextPage}
//               disabled={currentPage === totalPages}
//               className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
//             >
//               Next
//               <ChevronRight className="w-5 h-5" />
//             </button>
//           </div>
//         </div>

//         {/* QR Code Preview Modal (for individual QR in table) */}
//         {selectedEmpId && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
//               <h2 className="text-xl font-semibold mb-4">QR Code Preview</h2>
//               <div className="flex flex-col items-center">
//                 <QRCode value={selectedEmpId} height={150} width={150} />
//                 <p className="mt-2 text-sm text-gray-600">
//                   Emp ID: {selectedEmpId}
//                 </p>
//               </div>
//               <button
//                 onClick={handleCloseQR}
//                 className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Hidden container for rendering QR codes */}
//         <div
//           ref={qrCodeContainerRef}
//           style={{ position: "absolute", left: "-9999px" }}
//         >
//           {allUsers.map((user, index) => (
//             <div key={user.emp_id} id={`qr-wrapper-${index}`}>
//               <QRCode
//                 id={`qr-code-${index}`}
//                 value={user.emp_id}
//                 size={QR_SIZE_PX}
//               />
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PrintEmpQR;

import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { QrCode, ChevronLeft, ChevronRight } from "lucide-react";
import QRCode from "react-qr-code";
import Swal from "sweetalert2";

// Constants for layout
const QR_SIZE_PX = 72; // Approximate pixel size for 2 cm at 96 DPI
const GRID_COLS = 8; // 8 QR codes per row

// Simple loading spinner component
const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
      <p className="mt-4 text-gray-700">Generating QR Codes...</p>
    </div>
  </div>
);

// Debounce function to limit the frequency of API calls
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const PrintEmpQR = () => {
  const [users, setUsers] = useState([]); // For paginated table display
  const [allUsers, setAllUsers] = useState([]); // For preview (all filtered users)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [limit] = useState(10); // Number of users per page for table
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // For loading spinner
  const [qrCodesToRender, setQrCodesToRender] = useState([]); // For rendering QR codes only when previewing

  // Filter states
  const [jobTitleSearch, setJobTitleSearch] = useState("");
  const [empIdSearch, setEmpIdSearch] = useState("");
  const [sectionSearch, setSectionSearch] = useState("");
  const [jobTitleOptions, setJobTitleOptions] = useState([]);
  const [empIdOptions, setEmpIdOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false);
  const [showEmpIdDropdown, setShowEmpIdDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState("");
  const [selectedEmpIdFilter, setSelectedEmpIdFilter] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const jobTitleDropdownRef = useRef(null);
  const empIdDropdownRef = useRef(null);
  const sectionDropdownRef = useRef(null);
  const qrCodeContainerRef = useRef(null);

  // Fetch paginated users for table display
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/users-paginated`,
          {
            params: {
              page: currentPage,
              limit,
              jobTitle: selectedJobTitle,
              empId: selectedEmpIdFilter,
              section: selectedSection
            }
          }
        );
        setUsers(response.data.users);
        setTotalPages(response.data.totalPages);
        setTotalUsers(response.data.total);
      } catch (error) {
        console.error("Error fetching users:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch users."
        });
      }
    };

    fetchUsers();
  }, [
    currentPage,
    limit,
    selectedJobTitle,
    selectedEmpIdFilter,
    selectedSection
  ]);

  // Fetch all filtered users for preview (ignoring pagination)
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/users-paginated`,
          {
            params: {
              page: 1,
              limit: 10000,
              jobTitle: selectedJobTitle,
              empId: selectedEmpIdFilter,
              section: selectedSection
            }
          }
        );
        setAllUsers(response.data.users);
      } catch (error) {
        console.error("Error fetching all users:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch all users."
        });
      }
    };

    fetchAllUsers();
  }, [selectedJobTitle, selectedEmpIdFilter, selectedSection]);

  // Debounced fetch functions for filter options
  const fetchJobTitles = useMemo(
    () =>
      debounce(async (search) => {
        if (search.trim() === "") {
          setJobTitleOptions([]);
          setShowJobTitleDropdown(false);
          return;
        }

        try {
          const response = await axios.get(`${API_BASE_URL}/api/job-titles`);
          const filteredTitles = response.data.filter((title) =>
            title.toLowerCase().includes(search.toLowerCase())
          );
          setJobTitleOptions(filteredTitles);
          setShowJobTitleDropdown(filteredTitles.length > 0);
        } catch (error) {
          console.error("Error fetching job titles:", error);
          setJobTitleOptions([]);
          setShowJobTitleDropdown(false);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch job titles."
          });
        }
      }, 300),
    []
  );

  const fetchEmpIds = useMemo(
    () =>
      debounce(async (search) => {
        if (search.trim() === "") {
          setEmpIdOptions([]);
          setShowEmpIdDropdown(false);
          return;
        }

        try {
          const response = await axios.get(`${API_BASE_URL}/api/search-users`, {
            params: { q: search }
          });
          const empIds = response.data.map((user) => user.emp_id);
          setEmpIdOptions(empIds);
          setShowEmpIdDropdown(empIds.length > 0);
        } catch (error) {
          console.error("Error fetching emp IDs:", error);
          setEmpIdOptions([]);
          setShowEmpIdDropdown(false);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch emp IDs."
          });
        }
      }, 300),
    []
  );

  const fetchSections = useMemo(
    () =>
      debounce(async (search) => {
        if (search.trim() === "") {
          setSectionOptions([]);
          setShowSectionDropdown(false);
          return;
        }

        try {
          const response = await axios.get(`${API_BASE_URL}/api/sections`);
          const filteredSections = response.data.filter((section) =>
            section.toLowerCase().includes(search.toLowerCase())
          );
          setSectionOptions(filteredSections);
          setShowSectionDropdown(filteredSections.length > 0);
        } catch (error) {
          console.error("Error fetching sections:", error);
          setSectionOptions([]);
          setShowSectionDropdown(false);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch sections."
          });
        }
      }, 300),
    []
  );

  // Trigger debounced fetch functions when search inputs change
  useEffect(() => {
    fetchJobTitles(jobTitleSearch);
  }, [jobTitleSearch, fetchJobTitles]);

  useEffect(() => {
    fetchEmpIds(empIdSearch);
  }, [empIdSearch, fetchEmpIds]);

  useEffect(() => {
    fetchSections(sectionSearch);
  }, [sectionSearch, fetchSections]);

  // Handle clicks outside the dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        jobTitleDropdownRef.current &&
        !jobTitleDropdownRef.current.contains(event.target)
      ) {
        setShowJobTitleDropdown(false);
      }
      if (
        empIdDropdownRef.current &&
        !empIdDropdownRef.current.contains(event.target)
      ) {
        setShowEmpIdDropdown(false);
      }
      if (
        sectionDropdownRef.current &&
        !sectionDropdownRef.current.contains(event.target)
      ) {
        setShowSectionDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle QR code preview in table
  const handleShowQR = (empId) => {
    setSelectedEmpId(empId);
  };

  // Close QR code preview in table
  const handleCloseQR = () => {
    setSelectedEmpId(null);
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  // Function to convert an SVG element to a PNG data URL
  const svgToImage = (svgElement) => {
    return new Promise((resolve, reject) => {
      try {
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = QR_SIZE_PX;
          canvas.height = QR_SIZE_PX;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, QR_SIZE_PX, QR_SIZE_PX);
          const imgData = canvas.toDataURL("image/png");
          resolve(imgData);
        };

        img.onerror = (err) => {
          reject(new Error("Failed to load SVG as image: " + err.message));
        };
      } catch (error) {
        reject(error);
      }
    });
  };

  // Function to open preview window with all QR codes
  const openPreviewWindow = async () => {
    if (!allUsers || allUsers.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Data",
        text: "No users available to preview."
      });
      return;
    }

    setIsLoading(true); // Show loading spinner

    try {
      // Set the users to render QR codes for
      setQrCodesToRender(allUsers);

      // Ensure the QR code container exists
      if (!qrCodeContainerRef.current) {
        console.error("QR code container ref is not available");
        return;
      }

      // Group users by sect_name
      const groupedUsers = allUsers.reduce((acc, user) => {
        const sectName = user.sect_name || "No Section";
        if (!acc[sectName]) {
          acc[sectName] = [];
        }
        acc[sectName].push(user);
        return acc;
      }, {});

      // Wait for QR codes to render in the DOM
      await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay to ensure rendering

      // Pre-render all QR codes as PNG images
      const qrImages = await Promise.all(
        allUsers.map(async (user, index) => {
          try {
            const svgElement = qrCodeContainerRef.current.querySelector(
              `#qr-code-${index}`
            );
            if (!svgElement) {
              throw new Error(`SVG element for ${user.emp_id} not found`);
            }
            const imgData = await svgToImage(svgElement);
            return { user, imgData };
          } catch (error) {
            console.error(
              `Failed to generate QR code for ${user.emp_id}:`,
              error
            );
            return { user, imgData: null };
          }
        })
      );

      // Open a new popup window
      const previewWindow = window.open(
        "",
        "QR Code Preview",
        "width=800,height=600,scrollbars=yes"
      );

      // Create HTML content for the preview window
      let htmlContent = `
        <html>
          <head>
            <title>QR Code Preview</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
              }
              .section {
                margin-bottom: 30px;
              }
              .section-header {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .qr-grid {
                display: grid;
                grid-template-columns: repeat(${GRID_COLS}, 1fr);
                gap: 10px;
              }
              .qr-item {
                text-align: center;
              }
              .qr-code {
                width: ${QR_SIZE_PX}px;
                height: ${QR_SIZE_PX}px;
              }
              .emp-id {
                margin-top: 5px;
                font-size: 12px;
              }
              .close-button {
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 10px 20px;
                background-color: #dc3545;
                color: white;
                border: none;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <button class="close-button" onclick="window.close()">Close</button>
            <div id="qr-container">
      `;

      // Iterate over each section
      for (const sectName of Object.keys(groupedUsers)) {
        htmlContent += `
          <div class="section">
            <div class="section-header">Section: ${sectName}</div>
            <div class="qr-grid">
        `;

        const usersInSection = groupedUsers[sectName];

        // Iterate over users in the section
        for (const user of usersInSection) {
          const qrData = qrImages.find(
            (item) => item.user.emp_id === user.emp_id
          );
          const imgSrc = qrData.imgData || "";

          htmlContent += `
            <div class="qr-item">
              ${
                imgSrc
                  ? `<img src="${imgSrc}" class="qr-code" />`
                  : `<div class="qr-code" style="color: red;">QR Error</div>`
              }
              <div class="emp-id">${user.emp_id}</div>
            </div>
          `;
        }

        htmlContent += `
            </div>
          </div>
        `;
      }

      htmlContent += `
            </div>
          </body>
        </html>
      `;

      // Write the HTML content to the new window
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    } catch (error) {
      console.error("Error generating preview:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to generate QR code preview."
      });
    } finally {
      setIsLoading(false); // Hide loading spinner
      setQrCodesToRender([]); // Clear QR codes to free up memory
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Employee QR Code List
        </h1>

        {/* Filter Panel */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Job Title Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700">
                Job Title
              </label>
              <div className="relative" ref={jobTitleDropdownRef}>
                <input
                  type="text"
                  value={jobTitleSearch}
                  onChange={(e) => setJobTitleSearch(e.target.value)}
                  placeholder="Search Job Title..."
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                />
                {showJobTitleDropdown && (
                  <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {jobTitleOptions.map((option, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setSelectedJobTitle(option);
                          setJobTitleSearch(option);
                          setShowJobTitleDropdown(false);
                          setCurrentPage(1);
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

            {/* Emp ID Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700">
                Emp ID
              </label>
              <div className="relative" ref={empIdDropdownRef}>
                <input
                  type="text"
                  value={empIdSearch}
                  onChange={(e) => setEmpIdSearch(e.target.value)}
                  placeholder="Search Emp ID..."
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                />
                {showEmpIdDropdown && (
                  <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {empIdOptions.map((option, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setSelectedEmpIdFilter(option);
                          setEmpIdSearch(option);
                          setShowEmpIdDropdown(false);
                          setCurrentPage(1);
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

            {/* Section Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700">
                Section
              </label>
              <div className="relative" ref={sectionDropdownRef}>
                <input
                  type="text"
                  value={sectionSearch}
                  onChange={(e) => setSectionSearch(e.target.value)}
                  placeholder="Search Section..."
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                />
                {showSectionDropdown && (
                  <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {sectionOptions.map((option, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setSelectedSection(option);
                          setSectionSearch(option);
                          setShowSectionDropdown(false);
                          setCurrentPage(1);
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

            {/* Clear Filters Button */}
            <div className="flex-1 min-w-[200px]">
              <button
                onClick={() => {
                  setSelectedJobTitle("");
                  setSelectedEmpIdFilter("");
                  setSelectedSection("");
                  setJobTitleSearch("");
                  setEmpIdSearch("");
                  setSectionSearch("");
                  setCurrentPage(1);
                }}
                className="mt-6 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Clear Filters
              </button>
            </div>

            {/* Preview Button */}
            <div className="flex-1 min-w-[200px]">
              <button
                onClick={openPreviewWindow}
                className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                disabled={allUsers.length === 0 || isLoading}
              >
                <QrCode className="w-5 h-5 mr-2" />
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Emp ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Eng Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Kh Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Dept Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Sect Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  QR Code
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.emp_id}>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.emp_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.eng_name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.kh_name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.dept_name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.sect_name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <button
                        onClick={() => handleShowQR(user.emp_id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <QrCode className="w-6 h-6" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-3 text-center text-gray-500"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            {`Showing ${(currentPage - 1) * limit + 1} to ${Math.min(
              currentPage * limit,
              totalUsers
            )} of ${totalUsers} users`}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-lg ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* QR Code Preview Modal (for individual QR in table) */}
        {selectedEmpId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h2 className="text-xl font-semibold mb-4">QR Code Preview</h2>
              <div className="flex flex-col items-center">
                <QRCode value={selectedEmpId} height={150} width={150} />
                <p className="mt-2 text-sm text-gray-600">
                  Emp ID: {selectedEmpId}
                </p>
              </div>
              <button
                onClick={handleCloseQR}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && <LoadingSpinner />}

        {/* Hidden container for rendering QR codes (only when previewing) */}
        <div
          ref={qrCodeContainerRef}
          style={{ position: "absolute", left: "-9999px" }}
        >
          {qrCodesToRender.map((user, index) => (
            <div key={user.emp_id} id={`qr-wrapper-${index}`}>
              <QRCode
                id={`qr-code-${index}`}
                value={user.emp_id}
                size={QR_SIZE_PX}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrintEmpQR;
