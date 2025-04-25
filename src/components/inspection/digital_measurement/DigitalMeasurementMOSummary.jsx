// // import React, { useState, useEffect } from "react";
// // import axios from "axios";
// // import { API_BASE_URL } from "../../../../config";

// // const DigitalMeasurementMOSummary = ({ filters }) => {
// //   const [moSummary, setMoSummary] = useState(null);
// //   const [currentPage, setCurrentPage] = useState(1);
// //   const [totalPages, setTotalPages] = useState(1);

// //   useEffect(() => {
// //     const fetchMOSummary = async () => {
// //       try {
// //         const params = {
// //           page: currentPage,
// //           startDate: filters.startDate ? filters.startDate.toISOString() : "",
// //           endDate: filters.endDate ? filters.endDate.toISOString() : "",
// //           factory: filters.factory,
// //           mono: filters.mono,
// //           custStyle: filters.custStyle,
// //           buyer: filters.buyer,
// //           empId: filters.empId,
// //           stage: filters.stage
// //         };
// //         const response = await axios.get(
// //           `${API_BASE_URL}/api/digital-measurement-mo-summary`,
// //           {
// //             params,
// //             withCredentials: true
// //           }
// //         );
// //         setMoSummary(response.data.data);
// //         setTotalPages(response.data.totalPages);
// //       } catch (error) {
// //         console.error("Error fetching MO summary:", error);
// //         setMoSummary(null);
// //       }
// //     };
// //     fetchMOSummary();
// //   }, [filters, currentPage]);

// //   const handlePrevious = () => {
// //     if (currentPage > 1) {
// //       setCurrentPage(currentPage - 1);
// //     }
// //   };

// //   const handleNext = () => {
// //     if (currentPage < totalPages) {
// //       setCurrentPage(currentPage + 1);
// //     }
// //   };

// //   const getPaginationRange = () => {
// //     const maxPagesToShow = 10;
// //     const halfRange = Math.floor(maxPagesToShow / 2);
// //     let start = Math.max(1, currentPage - halfRange);
// //     let end = Math.min(totalPages, start + maxPagesToShow - 1);

// //     if (end - start + 1 < maxPagesToShow) {
// //       start = Math.max(1, end - maxPagesToShow + 1);
// //     }

// //     const pages = [];
// //     if (start > 1) {
// //       pages.push(1);
// //       if (start > 2) pages.push("...");
// //     }

// //     for (let i = start; i <= end; i++) {
// //       pages.push(i);
// //     }

// //     if (end < totalPages) {
// //       if (end < totalPages - 1) pages.push("...");
// //       pages.push(totalPages);
// //     }

// //     return pages;
// //   };

// //   if (!moSummary) {
// //     return (
// //       <div className="p-4">
// //         <h2 className="text-xl font-bold mb-4">MO Summary</h2>
// //         <p>No data available for the selected filters.</p>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="p-4">
// //       <h2 className="text-xl font-bold mb-4">
// //         MO Summary: {moSummary.mono} (Stage: {moSummary.stage})
// //       </h2>

// //       {/* Order Details Table */}
// //       <div className="mb-4">
// //         <h3 className="text-sm font-semibold mb-2">Order Details</h3>
// //         <div className="overflow-x-auto">
// //           <table className="w-full bg-white rounded border table-auto">
// //             <thead>
// //               <tr className="bg-gray-200">
// //                 <th className="p-2 border min-w-[100px]">Order Qty</th>
// //                 <th className="p-2 border min-w-[100px]">Inspected Qty</th>
// //                 <th className="p-2 border min-w-[100px]">Total Pass</th>
// //                 <th className="p-2 border min-w-[100px]">Total Reject</th>
// //                 <th className="p-2 border min-w-[100px]">Pass Rate</th>
// //               </tr>
// //             </thead>
// //             <tbody>
// //               <tr className="text-center text-sm">
// //                 <td className="p-2 border align-middle">
// //                   {moSummary.orderQty}
// //                 </td>
// //                 <td className="p-2 border align-middle">
// //                   {moSummary.totalInspected}
// //                 </td>
// //                 <td className="p-2 border align-middle">
// //                   {moSummary.totalPass}
// //                 </td>
// //                 <td className="p-2 border align-middle">
// //                   {moSummary.totalReject}
// //                 </td>
// //                 <td className="p-2 border align-middle">
// //                   {moSummary.passRate}%
// //                 </td>
// //               </tr>
// //             </tbody>
// //           </table>
// //         </div>
// //       </div>

// //       {/* Measurement Details Table */}
// //       <div className="mb-4">
// //         <h3 className="text-sm font-semibold mb-2">Measurement Details</h3>
// //         <div className="overflow-x-auto">
// //           <table className="w-full bg-white rounded border table-auto">
// //             <thead>
// //               <tr className="bg-gray-200">
// //                 <th className="p-2 border min-w-[100px]">QC ID</th>
// //                 <th className="p-2 border min-w-[120px]">Inspection Date</th>
// //                 <th className="p-2 border min-w-[100px]">Inspected Qty</th>
// //                 <th className="p-2 border min-w-[100px]">Total Pass</th>
// //                 <th className="p-2 border min-w-[100px]">Total Reject</th>
// //                 <th className="p-2 border min-w-[100px]">Pass Rate</th>
// //               </tr>
// //             </thead>
// //             <tbody>
// //               {moSummary.measurementDetails.length > 0 ? (
// //                 moSummary.measurementDetails.map((detail, index) => (
// //                   <tr key={index} className="text-center text-sm">
// //                     <td className="p-2 border align-middle">{detail.qcId}</td>
// //                     <td className="p-2 border align-middle">
// //                       {detail.inspectionDate}
// //                     </td>
// //                     <td className="p-2 border align-middle">
// //                       {detail.totalInspected}
// //                     </td>
// //                     <td className="p-2 border align-middle">
// //                       {detail.totalPass}
// //                     </td>
// //                     <td className="p-2 border align-middle">
// //                       {detail.totalReject}
// //                     </td>
// //                     <td className="p-2 border align-middle">
// //                       {detail.passRate.toFixed(2)}%
// //                     </td>
// //                   </tr>
// //                 ))
// //               ) : (
// //                 <tr>
// //                   <td colSpan="6" className="p-2 text-center text-sm">
// //                     No measurement details available.
// //                   </td>
// //                 </tr>
// //               )}
// //             </tbody>
// //           </table>
// //         </div>
// //       </div>

// //       {/* Detailed Measurements Table */}
// //       <div className="mb-4">
// //         <h3 className="text-sm font-semibold mb-2">
// //           Detailed Measurements (Grouped by QC ID, Inspection Date, Reference
// //           No)
// //         </h3>
// //         <div className="overflow-x-auto">
// //           <table className="w-full bg-white rounded border table-auto">
// //             <thead>
// //               <tr className="bg-gray-200">
// //                 <th className="p-2 border min-w-[100px]">QC ID</th>
// //                 <th className="p-2 border min-w-[120px]">Inspection Date</th>
// //                 <th className="p-2 border min-w-[100px]">Garment No</th>
// //                 <th className="p-2 border min-w-[100px]">Reference No</th>
// //                 <th className="p-2 border min-w-[150px]">Measurement Point</th>
// //                 <th className="p-2 border min-w-[80px]">Tol -</th>
// //                 <th className="p-2 border min-w-[80px]">Tol +</th>
// //                 <th className="p-2 border min-w-[100px]">Buyer Spec</th>
// //                 <th className="p-2 border min-w-[100px]">Inspected Value</th>
// //                 <th className="p-2 border min-w-[80px]">Status</th>
// //               </tr>
// //             </thead>
// //             <tbody>
// //               {moSummary.detailedMeasurements.length > 0 ? (
// //                 moSummary.detailedMeasurements.map((detail, index) => (
// //                   <tr key={index} className="text-center text-sm">
// //                     <td className="p-2 border align-middle">{detail.qcId}</td>
// //                     <td className="p-2 border align-middle">
// //                       {detail.inspectionDate}
// //                     </td>
// //                     <td className="p-2 border align-middle">
// //                       {detail.garmentNo}
// //                     </td>
// //                     <td className="p-2 border align-middle">
// //                       {detail.referenceNo}
// //                     </td>
// //                     <td className="p-2 border align-middle">
// //                       {detail.measurementPoint}
// //                     </td>
// //                     <td className="p-2 border align-middle">
// //                       {detail.tolMinus}
// //                     </td>
// //                     <td className="p-2 border align-middle">
// //                       {detail.tolPlus}
// //                     </td>
// //                     <td className="p-2 border align-middle">
// //                       {detail.buyerSpec}
// //                     </td>
// //                     <td className="p-2 border align-middle">
// //                       {detail.inspectedValue}
// //                     </td>
// //                     <td className="p-2 border align-middle">{detail.status}</td>
// //                   </tr>
// //                 ))
// //               ) : (
// //                 <tr>
// //                   <td colSpan="10" className="p-2 text-center text-sm">
// //                     No detailed measurements available.
// //                   </td>
// //                 </tr>
// //               )}
// //             </tbody>
// //           </table>
// //         </div>
// //       </div>

// //       {/* Pagination */}
// //       <div className="flex justify-center items-center space-x-2 mt-4 flex-wrap">
// //         <button
// //           onClick={handlePrevious}
// //           disabled={currentPage === 1}
// //           className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
// //         >
// //           Previous
// //         </button>
// //         {getPaginationRange().map((page, index) => (
// //           <button
// //             key={index}
// //             onClick={() => typeof page === "number" && setCurrentPage(page)}
// //             className={`px-4 py-2 rounded ${
// //               page === currentPage ? "bg-blue-500 text-white" : "bg-gray-200"
// //             } ${typeof page === "string" ? "cursor-default" : ""}`}
// //             disabled={typeof page === "string"}
// //           >
// //             {page}
// //           </button>
// //         ))}
// //         <button
// //           onClick={handleNext}
// //           disabled={currentPage === totalPages}
// //           className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
// //         >
// //           Next
// //         </button>
// //       </div>
// //     </div>
// //   );
// // };

// // export default DigitalMeasurementMOSummary;

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../config";

// const DigitalMeasurementMOSummary = ({ filters }) => {
//   const [summaries, setSummaries] = useState([]);

//   useEffect(() => {
//     const fetchMOSummaries = async () => {
//       try {
//         const params = {
//           startDate: filters.startDate ? filters.startDate.toISOString() : "",
//           endDate: filters.endDate ? filters.endDate.toISOString() : "",
//           factory: filters.factory,
//           mono: filters.mono,
//           custStyle: filters.custStyle,
//           buyer: filters.buyer,
//           empId: filters.empId,
//           stage: filters.stage
//         };
//         const response = await axios.get(
//           `${API_BASE_URL}/api/digital-measurement-summary`,
//           {
//             params,
//             withCredentials: true
//           }
//         );
//         setSummaries(response.data);
//       } catch (error) {
//         console.error("Error fetching MO summaries:", error);
//         setSummaries([]);
//       }
//     };
//     fetchMOSummaries();
//   }, [filters]);

//   if (summaries.length === 0) {
//     return (
//       <div className="p-4">
//         <h2 className="text-xl font-bold mb-4">MO Summary</h2>
//         <p>No data available for the selected filters.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="p-4">
//       <h2 className="text-xl font-bold mb-4">MO Summary</h2>
//       {summaries.map((summary, index) => (
//         <div key={index} className="mb-6">
//           <h3 className="text-lg font-semibold mb-2">
//             MO Summary: {summary.mono} (Stage: {summary.stage})
//           </h3>
//           {/* Order Details Table */}
//           <div className="mb-4">
//             <h4 className="text-sm font-semibold mb-2">Order Details</h4>
//             <div className="overflow-x-auto">
//               <table className="w-full bg-white rounded border table-auto">
//                 <thead>
//                   <tr className="bg-gray-200">
//                     <th className="p-2 border min-w-[100px]">Order Qty</th>
//                     <th className="p-2 border min-w-[100px]">Inspected Qty</th>
//                     <th className="p-2 border min-w-[100px]">Total Pass</th>
//                     <th className="p-2 border min-w-[100px]">Total Reject</th>
//                     <th className="p-2 border min-w-[100px]">Pass Rate</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr className="text-center text-sm">
//                     <td className="p-2 border align-middle">
//                       {summary.orderQty}
//                     </td>
//                     <td className="p-2 border align-middle">
//                       {summary.totalInspected}
//                     </td>
//                     <td className="p-2 border align-middle">
//                       {summary.totalPass}
//                     </td>
//                     <td className="p-2 border align-middle">
//                       {summary.totalReject}
//                     </td>
//                     <td className="p-2 border align-middle">
//                       {summary.passRate.toFixed(2)}%
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default DigitalMeasurementMOSummary;
