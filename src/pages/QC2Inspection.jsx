// import React, { useState } from "react";
// import { QrCode, AlertCircle, Package, Loader2 } from "lucide-react";
// import Scanner from "../components/forms/Scanner";

// const QC2InspectionPage = () => {
//   const [error, setError] = useState(null);
//   const [bundleData, setBundleData] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const fetchBundleData = async (randomId) => {
//     try {
//       setLoading(true);
//       const response = await fetch(
//         `http://localhost:5001/api/bundle-by-random-id/${randomId}`
//       );
//       if (!response.ok) {
//         throw new Error("Bundle not found");
//       }
//       const data = await response.json();
//       setBundleData(data);
//       setError(null);
//     } catch (err) {
//       setError(err.message || "Failed to fetch bundle data");
//       setBundleData(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleScanSuccess = (decodedText) => {
//     fetchBundleData(decodedText);
//   };

//   const handleScanError = (errorMessage) => {
//     setError(errorMessage);
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <div className="max-w-4xl mx-auto p-6">
//         <div className="text-center mb-8">
//           <div className="flex items-center justify-center gap-2 mb-4">
//             <QrCode className="w-8 h-8 text-blue-600" />
//             <h1 className="text-3xl font-bold text-gray-800">
//               QC2 Bundle Scanner
//             </h1>
//           </div>
//           <p className="text-gray-600">
//             Scan the QR code on the bundle to retrieve inspection details
//           </p>
//         </div>

//         {error && (
//           <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2">
//             <AlertCircle className="w-5 h-5 text-red-500" />
//             <p className="text-red-700">{error}</p>
//           </div>
//         )}

//         <div className="bg-white p-6 rounded-lg shadow-lg">
//           <Scanner
//             onScanSuccess={handleScanSuccess}
//             onScanError={handleScanError}
//           />

//           {loading && (
//             <div className="flex items-center justify-center gap-2 text-blue-600">
//               <Loader2 className="w-5 h-5 animate-spin" />
//               <p>Loading bundle data...</p>
//             </div>
//           )}

//           {bundleData && (
//             <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
//               <div className="flex items-start gap-4">
//                 <Package className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
//                 <div className="flex-grow">
//                   <h2 className="text-xl font-semibold text-gray-800 mb-4">
//                     Bundle Details
//                   </h2>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <p className="text-sm text-gray-600">Bundle ID</p>
//                       <p className="font-medium">{bundleData.bundle_id}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">Date</p>
//                       <p className="font-medium">
//                         {formatDate(bundleData.date)}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">MO Number</p>
//                       <p className="font-medium">{bundleData.selectedMono}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">Style</p>
//                       <p className="font-medium">{bundleData.custStyle}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">Buyer</p>
//                       <p className="font-medium">{bundleData.buyer}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">Country</p>
//                       <p className="font-medium">{bundleData.country}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">Factory</p>
//                       <p className="font-medium">{bundleData.factory}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">Line No</p>
//                       <p className="font-medium">{bundleData.lineNo}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">Color</p>
//                       <p className="font-medium">{bundleData.color}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">Size</p>
//                       <p className="font-medium">{bundleData.size}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">Count</p>
//                       <p className="font-medium">{bundleData.count}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">Bundle Quantity</p>
//                       <p className="font-medium">{bundleData.totalBundleQty}</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default QC2InspectionPage;

// import React, { useState } from "react";
// import { QrCode, AlertCircle, Package, Loader2, Send } from "lucide-react";
// import Scanner from "../components/forms/Scanner";
// import DefectBox from "../components/inspection/DefectBox";

// const QC2InspectionPage = () => {
//   const [error, setError] = useState(null);
//   const [bundleData, setBundleData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [currentDefectCount, setCurrentDefectCount] = useState({});
//   const [language, setLanguage] = useState("en");
//   const [submitting, setSubmitting] = useState(false);

//   const fetchBundleData = async (randomId) => {
//     try {
//       setLoading(true);
//       const response = await fetch(
//         `http://localhost:5001/api/bundle-by-random-id/${randomId}`
//       );
//       if (!response.ok) throw new Error("Bundle not found");
//       const data = await response.json();
//       setBundleData(data);
//       setError(null);
//     } catch (err) {
//       setError(err.message || "Failed to fetch bundle data");
//       setBundleData(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async () => {
//     try {
//       setSubmitting(true);
//       const response = await fetch("http://localhost:5001/api/save-defects", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           bundleId: bundleData.bundle_id,
//           defects: currentDefectCount,
//           language,
//         }),
//       });

//       if (!response.ok) throw new Error("Failed to save defects");
//       // Reset after successful submission
//       setCurrentDefectCount({});
//       setBundleData(null);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <div className="max-w-6xl mx-auto p-6">
//         <div className="text-center mb-8">
//           <div className="flex items-center justify-center gap-2 mb-4">
//             <QrCode className="w-8 h-8 text-blue-600" />
//             <h1 className="text-3xl font-bold text-gray-800">
//               QC2 Bundle Scanner
//             </h1>
//           </div>
//           <p className="text-gray-600">
//             Scan the QR code on the bundle to start inspection
//           </p>
//         </div>

//         {error && (
//           <div className="mb-6 p-4 bg-red-100 rounded-lg flex items-center gap-2">
//             <AlertCircle className="w-5 h-5 text-red-500" />
//             <p className="text-red-700">{error}</p>
//           </div>
//         )}

//         <div className="bg-white p-6 rounded-lg shadow-lg">
//           <Scanner
//             onScanSuccess={(text) => fetchBundleData(text)}
//             onScanError={(err) => setError(err)}
//           />

//           {loading && (
//             <div className="flex items-center justify-center gap-2 my-4">
//               <Loader2 className="w-5 h-5 animate-spin" />
//               <p>Loading bundle details...</p>
//             </div>
//           )}

//           {bundleData && (
//             <>
//               <div className="mt-6 p-6 bg-blue-50 rounded-lg">
//                 <div className="flex items-start gap-4">
//                   <Package className="w-6 h-6 text-blue-600 mt-1" />
//                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-grow">
//                     {Object.entries({
//                       "Bundle ID": bundleData.bundle_id,
//                       "MO Number": bundleData.selectedMono,
//                       Style: bundleData.custStyle,
//                       Color: bundleData.color,
//                       Size: bundleData.size,
//                       Quantity: bundleData.totalBundleQty,
//                     }).map(([label, value]) => (
//                       <div key={label}>
//                         <p className="text-sm text-gray-600">{label}</p>
//                         <p className="font-medium">{value}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               <DefectBox
//                 language={language}
//                 currentDefectCount={currentDefectCount}
//                 onDefectUpdate={setCurrentDefectCount}
//                 onLanguageChange={setLanguage}
//               />

//               <div className="mt-6 flex justify-end">
//                 <button
//                   onClick={handleSubmit}
//                   disabled={
//                     submitting ||
//                     Object.values(currentDefectCount).every((c) => c === 0)
//                   }
//                   className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
//                 >
//                   {submitting ? (
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                   ) : (
//                     <Send className="w-4 h-4" />
//                   )}
//                   Submit Inspection
//                 </button>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default QC2InspectionPage;

// import React, { useState, useEffect } from "react";
// import {
//   QrCode,
//   AlertCircle,
//   Package,
//   Loader2,
//   CheckCircle,
//   XCircle,
// } from "lucide-react";
// import Scanner from "../components/forms/Scanner";
// import DefectBox from "../components/inspection/DefectBox";

// const QC2InspectionPage = () => {
//   const [error, setError] = useState(null);
//   const [bundleData, setBundleData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [defects, setDefects] = useState({});
//   const [language, setLanguage] = useState("english");
//   const [totalPass, setTotalPass] = useState(0);
//   const [totalRejects, setTotalRejects] = useState(0);

//   useEffect(() => {
//     if (bundleData) {
//       setTotalPass(bundleData.count || 0);
//       setTotalRejects(0);
//     }
//   }, [bundleData]);

//   const fetchBundleData = async (randomId) => {
//     try {
//       setLoading(true);
//       const response = await fetch(
//         `http://localhost:5001/api/bundle-by-random-id/${randomId}`
//       );
//       if (!response.ok) throw new Error("Bundle not found");
//       const data = await response.json();
//       setBundleData(data);
//       setError(null);
//     } catch (err) {
//       setError(err.message || "Failed to fetch bundle data");
//       setBundleData(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePassBundle = () => {
//     // Reset inspection
//     setBundleData(null);
//     setDefects({});
//   };

//   const handleRejectBundle = () => {
//     if (totalPass > 0) {
//       setTotalPass((prev) => prev - 1);
//       setTotalRejects((prev) => prev + 1);
//     }
//   };

//   const hasDefects = Object.values(defects).some((count) => count > 0);

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <div className="max-w-7xl mx-auto p-6">
//         <div className="text-center mb-8">
//           <div className="flex items-center justify-center gap-2 mb-4">
//             <QrCode className="w-8 h-8 text-blue-600" />
//             <h1 className="text-3xl font-bold text-gray-800">
//               QC2 Bundle Scanner
//             </h1>
//           </div>
//           <p className="text-gray-600">
//             Scan the QR code on the bundle to start inspection
//           </p>
//         </div>

//         {error && (
//           <div className="mb-6 p-4 bg-red-100 rounded-lg flex items-center gap-2">
//             <AlertCircle className="w-5 h-5 text-red-500" />
//             <p className="text-red-700">{error}</p>
//           </div>
//         )}

//         <div className="bg-white p-6 rounded-lg shadow-lg">
//           {!bundleData && (
//             <Scanner
//               onScanSuccess={fetchBundleData}
//               onScanError={(err) => setError(err)}
//             />
//           )}

//           {loading && (
//             <div className="flex items-center justify-center gap-2 my-4">
//               <Loader2 className="w-5 h-5 animate-spin" />
//               <p>Loading bundle details...</p>
//             </div>
//           )}

//           {bundleData && (
//             <>
//               <div className="mb-6 p-4 bg-blue-50 rounded-lg">
//                 <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
//                   <div>
//                     <p className="text-sm text-gray-600">Total Pass</p>
//                     <p className="text-2xl font-bold text-green-600">
//                       {totalPass}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Total Rejects</p>
//                     <p className="text-2xl font-bold text-red-600">
//                       {totalRejects}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Bundle ID</p>
//                     <p className="font-medium">{bundleData.bundle_id}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">MO No</p>
//                     <p className="font-medium">{bundleData.selectedMono}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Cust. Style</p>
//                     <p className="font-medium">{bundleData.custStyle}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Color</p>
//                     <p className="font-medium">{bundleData.color}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Size</p>
//                     <p className="font-medium">{bundleData.size}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Line No</p>
//                     <p className="font-medium">{bundleData.lineNo}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Checked Qty</p>
//                     <p className="font-medium">{bundleData.count}</p>
//                   </div>
//                 </div>
//               </div>

//               <DefectBox
//                 language={language}
//                 currentDefectCount={defects}
//                 onDefectUpdate={setDefects}
//                 onLanguageChange={setLanguage}
//               />

//               <div className="mt-6 flex justify-between">
//                 <button
//                   onClick={handleRejectBundle}
//                   disabled={!hasDefects}
//                   className={`px-6 py-2 rounded flex items-center gap-2 ${
//                     hasDefects
//                       ? "bg-red-600 hover:bg-red-700 text-white"
//                       : "bg-gray-300 text-gray-500 cursor-not-allowed"
//                   }`}
//                 >
//                   <XCircle className="w-5 h-5" />
//                   Reject Bundle
//                 </button>

//                 <button
//                   onClick={handlePassBundle}
//                   className={`px-6 py-2 rounded flex items-center gap-2 ${
//                     hasDefects
//                       ? "bg-yellow-500 hover:bg-yellow-600"
//                       : "bg-green-600 hover:bg-green-700"
//                   } text-white`}
//                 >
//                   <CheckCircle className="w-5 h-5" />
//                   {hasDefects ? "Pass with Defects" : "Pass Bundle"}
//                 </button>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default QC2InspectionPage;

import React, { useState, useEffect } from "react";
import {
  QrCode,
  AlertCircle,
  Package,
  Loader2,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import Scanner from "../components/forms/Scanner";
import DefectBox from "../components/inspection/DefectBox";

const QC2InspectionPage = () => {
  const [error, setError] = useState(null);
  const [bundleData, setBundleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tempDefects, setTempDefects] = useState({});
  const [confirmedDefects, setConfirmedDefects] = useState({});
  const [language, setLanguage] = useState("english");
  const [totalPass, setTotalPass] = useState(0);
  const [totalRejects, setTotalRejects] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (bundleData) {
      setTotalPass(bundleData.count || 0);
      setTotalRejects(0);
      setConfirmedDefects({});
      setTempDefects({});
    }
  }, [bundleData]);

  const fetchBundleData = async (randomId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5001/api/bundle-by-random-id/${randomId}`
      );
      if (!response.ok) throw new Error("Bundle not found");
      const data = await response.json();
      setBundleData(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch bundle data");
      setBundleData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePassBundle = () => {
    setBundleData(null);
    setTempDefects({});
    setConfirmedDefects({});
  };

  const handleRejectBundle = () => {
    if (totalPass > 0) {
      // Merge temporary defects with confirmed defects
      const newConfirmedDefects = { ...confirmedDefects };
      Object.keys(tempDefects).forEach((key) => {
        newConfirmedDefects[key] =
          (newConfirmedDefects[key] || 0) + tempDefects[key];
      });

      setConfirmedDefects(newConfirmedDefects);
      setTempDefects({});
      setTotalPass((prev) => prev - 1);
      setTotalRejects((prev) => prev + 1);
    }
  };

  const handleDefectUpdate = (newDefects) => {
    setTempDefects(newDefects);
  };

  const getBundleNumber = (bundleId) => {
    const parts = bundleId?.split(":") || [];
    return parts[parts.length - 1] || "";
  };

  const defectQty = Object.values(confirmedDefects).reduce((a, b) => a + b, 0);
  const hasTempDefects = Object.values(tempDefects).some((count) => count > 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleRejectBundle}
            disabled={!hasTempDefects}
            className={`px-6 py-2 rounded flex items-center gap-2 ${
              hasTempDefects
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <XCircle className="w-5 h-5" />
            Reject Bundle
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <QrCode className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">
                QC2 Bundle Scanner
              </h1>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Filter className="w-5 h-5" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          <button
            onClick={handlePassBundle}
            className={`px-6 py-2 rounded flex items-center gap-2 ${
              hasTempDefects
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-green-600 hover:bg-green-700"
            } text-white`}
          >
            <CheckCircle className="w-5 h-5" />
            {hasTempDefects ? "Pass with Defects" : "Pass Bundle"}
          </button>
        </div>

        {showFilters && (
          <div className="mb-4 p-4 bg-white rounded-lg shadow flex flex-wrap gap-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-4 py-2 border rounded"
            >
              <option value="english">English</option>
              <option value="khmer">Khmer</option>
              <option value="chinese">Chinese</option>
              <option value="all">All Languages</option>
            </select>

            <div className="flex flex-wrap gap-2">
              {[
                "all",
                "common",
                "type1",
                "type2",
                "fabric",
                "workmanship",
                "cleanliness",
                "embellishment",
                "measurement",
                "washing",
                "finishing",
                "miscellaneous",
              ].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded capitalize ${
                    activeFilter === filter
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {filter.replace(/([A-Z])/g, " $1").trim()}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-lg">
          {!bundleData && (
            <Scanner
              onScanSuccess={fetchBundleData}
              onScanError={(err) => setError(err)}
            />
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 my-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p>Loading bundle details...</p>
            </div>
          )}

          {bundleData && (
            <>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Pass</p>
                    <p className="text-2xl font-bold text-green-600">
                      {totalPass}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Rejects</p>
                    <p className="text-2xl font-bold text-red-600">
                      {totalRejects}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Defect Qty</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {defectQty}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bundle No</p>
                    <p className="font-medium">
                      {getBundleNumber(bundleData.bundle_id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">MO No</p>
                    <p className="font-medium">{bundleData.selectedMono}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cust. Style</p>
                    <p className="font-medium">{bundleData.custStyle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Color</p>
                    <p className="font-medium">{bundleData.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Size</p>
                    <p className="font-medium">{bundleData.size}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Line No</p>
                    <p className="font-medium">{bundleData.lineNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Checked Qty</p>
                    <p className="font-medium">{bundleData.count}</p>
                  </div>
                </div>
              </div>

              <DefectBox
                language={language}
                currentDefectCount={{ ...confirmedDefects, ...tempDefects }}
                onDefectUpdate={handleDefectUpdate}
                activeFilter={activeFilter}
                confirmedDefects={confirmedDefects}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QC2InspectionPage;
