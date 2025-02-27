// import { Archive, CheckCircle, List, XCircle } from "lucide-react";
// import React, { useState } from "react";

// const LiveStyleCard = ({ moNo, summaryData, defectRates }) => {
//   const [showMore, setShowMore] = useState(false);

//   const toggleMore = () => {
//     setShowMore(!showMore);
//   };

//   // Filter top 5 defect rates for this MO No
//   const topDefectRates = defectRates
//     .filter((rate) => rate.moNo === moNo)
//     .sort((a, b) => b.defectRate - a.defectRate)
//     .slice(0, 5);

//   return (
//     <div className="bg-white shadow-md rounded-lg p-4 flex flex-col w-full max-w-sm">
//       {/* Title */}
//       <h3 className="text-lg font-semibold text-gray-800 mb-2">{moNo}</h3>

//       {/* Defect Rate and Ratio */}
//       <div className="flex justify-between mb-4">
//         <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
//           Defect Rate: {(summaryData.defectRate * 100).toFixed(2)}%
//         </div>
//         <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
//           Defect Ratio: {(summaryData.defectRatio * 100).toFixed(2)}%
//         </div>
//       </div>

//       {/* Summary Data */}
//       <div className="grid grid-cols-2 gap-2 mb-4">
//         <div className="flex items-center">
//           <Archive className="text-blue-500 mr-2" size={20} />
//           <div>
//             <p className="text-sm text-gray-600">No of Bundles</p>
//             <p className="text-lg font-bold text-gray-900">
//               {summaryData.totalBundles}
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center">
//           <CheckCircle className="text-green-500 mr-2" size={20} />
//           <div>
//             <p className="text-sm text-gray-600">Checked Qty</p>
//             <p className="text-lg font-bold text-gray-900">
//               {summaryData.checkedQty}
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center">
//           <CheckCircle className="text-green-500 mr-2" size={20} />
//           <div>
//             <p className="text-sm text-gray-600">Total Pass</p>
//             <p className="text-lg font-bold text-gray-900">
//               {summaryData.totalPass}
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center">
//           <XCircle className="text-red-500 mr-2" size={20} />
//           <div>
//             <p className="text-sm text-gray-600">Reject Units</p>
//             <p className="text-lg font-bold text-gray-900">
//               {summaryData.totalRejects}
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center col-span-2">
//           <List className="text-yellow-500 mr-2" size={20} />
//           <div>
//             <p className="text-sm text-gray-600">Defects Qty</p>
//             <p className="text-lg font-bold text-gray-900">
//               {summaryData.defectsQty}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* More Button */}
//       <button
//         onClick={toggleMore}
//         className="text-blue-500 hover:underline text-sm text-center"
//       >
//         {showMore ? "- Less" : "+ More..."}
//       </button>

//       {/* Top 5 Defect Rates (shown when expanded) */}
//       {showMore && topDefectRates.length > 0 && (
//         <div className="mt-4">
//           <h4 className="text-sm font-medium text-gray-700 mb-2">
//             Top 5 Defect Rates
//           </h4>
//           <div className="space-y-2">
//             {topDefectRates.map((defect, index) => (
//               <div
//                 key={index}
//                 className="bg-gray-50 p-2 rounded flex justify-between items-center"
//               >
//                 <span className="text-sm text-gray-700">
//                   {defect.defectName}
//                 </span>
//                 <span className="text-sm font-bold text-gray-900">
//                   {(defect.defectRate * 100).toFixed(2)}%
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default LiveStyleCard;

import { Archive, CheckCircle, List, XCircle } from "lucide-react";
import React, { useState } from "react";

const LiveStyleCard = ({ moNo, summaryData }) => {
  const [showMore, setShowMore] = useState(false);

  const toggleMore = () => {
    setShowMore(!showMore);
  };

  // Aggregate defect counts from defectArray for this MO No
  const defectTotals = summaryData.defectArray.reduce((acc, defect) => {
    acc[defect.defectName] = (acc[defect.defectName] || 0) + defect.totalCount;
    return acc;
  }, {});

  // Convert to array and calculate defect rates
  const totalCheckedQty = summaryData.checkedQty || 1; // Avoid division by zero
  const topDefectRates = Object.entries(defectTotals)
    .map(([defectName, totalCount]) => ({
      defectName,
      totalCount,
      defectRate: totalCount / totalCheckedQty,
    }))
    .sort((a, b) => b.defectRate - a.defectRate)
    .slice(0, 5);

  return (
    <div className="bg-white shadow-md rounded-lg p-4 flex flex-col w-full max-w-sm">
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{moNo}</h3>

      {/* Defect Rate and Ratio */}
      <div className="flex justify-between mb-4">
        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
          Defect Rate: {(summaryData.defectRate * 100).toFixed(2)}%
        </div>
        <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
          Defect Ratio: {(summaryData.defectRatio * 100).toFixed(2)}%
        </div>
      </div>

      {/* Summary Data */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center">
          <Archive className="text-blue-500 mr-2" size={20} />
          <div>
            <p className="text-sm text-gray-600">No of Bundles</p>
            <p className="text-lg font-bold text-gray-900">
              {summaryData.totalBundles}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <CheckCircle className="text-green-500 mr-2" size={20} />
          <div>
            <p className="text-sm text-gray-600">Checked Qty</p>
            <p className="text-lg font-bold text-gray-900">
              {summaryData.checkedQty}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <CheckCircle className="text-green-500 mr-2" size={20} />
          <div>
            <p className="text-sm text-gray-600">Total Pass</p>
            <p className="text-lg font-bold text-gray-900">
              {summaryData.totalPass}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <XCircle className="text-red-500 mr-2" size={20} />
          <div>
            <p className="text-sm text-gray-600">Reject Units</p>
            <p className="text-lg font-bold text-gray-900">
              {summaryData.totalRejects}
            </p>
          </div>
        </div>
        <div className="flex items-center col-span-2">
          <List className="text-yellow-500 mr-2" size={20} />
          <div>
            <p className="text-sm text-gray-600">Defects Qty</p>
            <p className="text-lg font-bold text-gray-900">
              {summaryData.defectsQty}
            </p>
          </div>
        </div>
      </div>

      {/* More Button */}
      <button
        onClick={toggleMore}
        className="text-blue-500 hover:underline text-sm text-center"
      >
        {showMore ? "- Less" : "+ More..."}
      </button>

      {/* Top 5 Defect Rates */}
      {showMore && topDefectRates.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Top 5 Defect Rates
          </h4>
          <div className="space-y-2">
            {topDefectRates.map((defect, index) => (
              <div
                key={index}
                className="bg-gray-50 p-2 rounded flex justify-between items-center"
              >
                <span className="text-sm text-gray-700">
                  {defect.defectName}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {(defect.defectRate * 100).toFixed(2)}% ({defect.totalCount})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStyleCard;
