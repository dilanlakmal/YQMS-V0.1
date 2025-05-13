// import axios from "axios";
// import React, { useEffect, useRef, useState } from "react";
// import { useTranslation } from "react-i18next";
// import Webcam from "react-webcam";
// import { Camera, Image as ImageIcon, X, Plus } from "lucide-react";
// import { API_BASE_URL } from "../../../../config";

// const CuttingIssues = ({ moNo, selectedPanel, onIssuesChange }) => {
//   const { t, i18n } = useTranslation();
//   const [issuesList, setIssuesList] = useState([]);
//   const [issues, setIssues] = useState([]);
//   const [additionalComments, setAdditionalComments] = useState("");
//   const [additionalImages, setAdditionalImages] = useState([]);
//   const [showWebcam, setShowWebcam] = useState(false);
//   const [captureIndex, setCaptureIndex] = useState(null); // null for additional images, index for evidence
//   const [selectedImage, setSelectedImage] = useState(null); // For popup
//   const webcamRef = useRef(null);

//   //Update parent whenever issues, additionalComments, or additionalImages change
//   useEffect(() => {
//     const formattedIssues = issues.map((issue, index) => {
//       const selectedIssue = issuesList.find(
//         (item) => item._id === issue.issueId
//       );
//       return {
//         cuttingdefectName: selectedIssue ? selectedIssue.defectEng : "",
//         cuttingdefectNameKhmer: selectedIssue ? selectedIssue.defectKhmer : "",
//         remarks: issue.remark || "",
//         imageData: issue.evidence ? [{ no: 1, path: issue.evidence }] : []
//       };
//     });

//     const formattedData = {
//       issues: formattedIssues,
//       additionalComments: additionalComments || "",
//       additionalImages: additionalImages.map((img, idx) => ({
//         no: idx + 1,
//         path: img
//       }))
//     };

//     onIssuesChange(formattedData);
//   }, [
//     issues,
//     additionalComments,
//     additionalImages,
//     issuesList,
//     onIssuesChange
//   ]);

//   useEffect(() => {
//     const fetchIssues = async () => {
//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/cutting-issues`, {
//           headers: { "Content-Type": "application/json" },
//           withCredentials: true
//         });
//         setIssuesList(response.data);
//       } catch (error) {
//         console.error("Error fetching cutting issues:", error);
//       }
//     };
//     fetchIssues();
//   }, []);

//   const handleAddIssue = () => {
//     setIssues([...issues, { issueId: "", remark: "", evidence: null }]);
//   };

//   const handleIssueChange = (index, field, value) => {
//     const newIssues = [...issues];
//     newIssues[index][field] = value;
//     setIssues(newIssues);
//   };

//   const handleUpload = async (imageSrc, index) => {
//     const blob = await (await fetch(imageSrc)).blob();
//     const file = new File([blob], `cutting-capture-${Date.now()}.jpg`, {
//       type: "image/jpeg"
//     });
//     const formData = new FormData();
//     formData.append("image", file);
//     try {
//       const response = await axios.post(
//         `${API_BASE_URL}/api/upload-cutting-image`,
//         formData,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//           withCredentials: true
//         }
//       );
//       const imageUrl = `${API_BASE_URL}${response.data.url}`;
//       if (index === null) {
//         setAdditionalImages([...additionalImages, imageUrl]);
//       } else {
//         const newIssues = [...issues];
//         newIssues[index].evidence = imageUrl;
//         setIssues(newIssues);
//       }
//     } catch (error) {
//       console.error("Error uploading image:", error);
//     }
//   };

//   const handleRemoveEvidence = (index) => {
//     const newIssues = [...issues];
//     newIssues[index].evidence = null;
//     setIssues(newIssues);
//   };

//   const handleRemoveAdditionalImage = (index) => {
//     const newImages = additionalImages.filter((_, i) => i !== index);
//     setAdditionalImages(newImages);
//   };

//   const openImagePopup = (imageUrl) => {
//     setSelectedImage(imageUrl);
//   };

//   const closeImagePopup = () => {
//     setSelectedImage(null);
//   };

//   const getIssueDisplayName = (issueItem) => {
//     if (i18n.language === "kh") {
//       return issueItem.defectKhmer || issueItem.defectEng;
//     } else if (i18n.language === "zh") {
//       return issueItem.defectChinese || issueItem.defectEng;
//     } else {
//       return issueItem.defectEng;
//     }
//   };

//   return (
//     <div className="mt-6">
//       <h3 className="text-lg font-semibold mb-2">{t("cutting.issues")}</h3>
//       <div className="overflow-x-auto">
//         <table className="min-w-full border-collapse border border-gray-300">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="border border-gray-300 p-2 text-sm">
//                 {t("cutting.cuttingIssue")}
//               </th>
//               <th className="border border-gray-300 p-2 text-sm">
//                 {t("cutting.remark")}
//               </th>
//               <th className="border border-gray-300 p-2 text-sm">
//                 {t("cutting.evidence")}
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             {issues.map((issue, index) => {
//               const selectedIssue = issuesList.find(
//                 (item) => item._id === issue.issueId
//               );
//               // Get all issueIds selected in other rows
//               const selectedIssueIds = issues
//                 .filter((_, i) => i !== index) // Exclude current row
//                 .map((i) => i.issueId)
//                 .filter((id) => id); // Exclude empty strings
//               // Filter issuesList to exclude already selected issues
//               const availableIssues = issuesList.filter(
//                 (issueItem) => !selectedIssueIds.includes(issueItem._id)
//               );
//               return (
//                 <tr key={index}>
//                   <td className="border border-gray-300 p-2">
//                     <select
//                       value={issue.issueId}
//                       onChange={(e) =>
//                         handleIssueChange(index, "issueId", e.target.value)
//                       }
//                       className="w-full p-1 border border-gray-300 rounded text-xs"
//                     >
//                       <option value="">{t("cutting.selectIssue")}</option>
//                       {availableIssues.map((issueItem) => (
//                         <option key={issueItem._id} value={issueItem._id}>
//                           {getIssueDisplayName(issueItem)}
//                         </option>
//                       ))}
//                     </select>
//                   </td>
//                   <td className="border border-gray-300 p-2">
//                     <input
//                       type="text"
//                       value={issue.remark}
//                       onChange={(e) =>
//                         handleIssueChange(index, "remark", e.target.value)
//                       }
//                       className="w-full p-1 border border-gray-300 rounded"
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-2">
//                     <div className="flex items-center gap-2">
//                       <button
//                         onClick={() => {
//                           setCaptureIndex(index);
//                           setShowWebcam(true);
//                         }}
//                         disabled={issue.evidence}
//                         className={`p-1 rounded ${
//                           issue.evidence
//                             ? "bg-gray-300 cursor-not-allowed"
//                             : "bg-blue-500 text-white"
//                         }`}
//                       >
//                         <Camera className="w-5 h-5" />
//                       </button>
//                       <button
//                         onClick={() => openImagePopup(issue.evidence)}
//                         disabled={!issue.evidence}
//                         className={`p-1 rounded ${
//                           issue.evidence
//                             ? "bg-green-500 text-white"
//                             : "bg-gray-300 cursor-not-allowed"
//                         }`}
//                       >
//                         <ImageIcon className="w-5 h-5" />
//                       </button>
//                       {issue.evidence && (
//                         <button
//                           onClick={() => handleRemoveEvidence(index)}
//                           className="p-1 bg-red-500 text-white rounded"
//                         >
//                           <X className="w-5 h-5" />
//                         </button>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//       <button
//         onClick={handleAddIssue}
//         className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
//       >
//         {t("cutting.addIssue")}
//       </button>
//       <hr className="my-4 border-gray-300" />
//       <div className="mt-4 relative">
//         <label className="block text-sm font-medium text-gray-700">
//           {t("cutting.additionalComments")}
//         </label>
//         <textarea
//           value={additionalComments}
//           onChange={(e) => setAdditionalComments(e.target.value)}
//           maxLength={250}
//           className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//           rows="3"
//         />
//         <span className="absolute bottom-2 right-2 text-sm text-gray-500">
//           {additionalComments.length}/250
//         </span>
//       </div>
//       <div className="mt-4">
//         <label className="block text-sm font-medium text-gray-700">
//           {t("cutting.additionalImages")}
//         </label>
//         <div className="border border-gray-300 rounded-lg p-4 flex items-center gap-2 flex-wrap">
//           {additionalImages.map((img, idx) => (
//             <div key={idx} className="relative">
//               <img
//                 src={img}
//                 alt="Additional"
//                 className="w-32 h-32 object-cover rounded cursor-pointer"
//                 onClick={() => openImagePopup(img)}
//               />
//               <button
//                 onClick={() => handleRemoveAdditionalImage(idx)}
//                 className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full text-xs"
//               >
//                 <X className="w-3 h-3" />
//               </button>
//             </div>
//           ))}
//           {additionalImages.length < 5 && (
//             <button
//               onClick={() => {
//                 setCaptureIndex(null);
//                 setShowWebcam(true);
//               }}
//               className="p-2 bg-blue-500 text-white rounded"
//             >
//               <Camera className="w-5 h-5" />
//             </button>
//           )}
//           {additionalImages.length > 0 && additionalImages.length < 5 && (
//             <button
//               onClick={() => {
//                 setCaptureIndex(null);
//                 setShowWebcam(true);
//               }}
//               className="p-2 bg-blue-500 text-white rounded"
//             >
//               <Plus className="w-5 h-5" />
//             </button>
//           )}
//         </div>
//       </div>
//       {showWebcam && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-4 rounded-lg">
//             <Webcam
//               audio={false}
//               ref={webcamRef}
//               screenshotFormat="image/jpeg"
//               width="100%"
//               videoConstraints={{
//                 facingMode: { ideal: "environment" }
//               }}
//             />
//             <div className="flex justify-center mt-4 gap-4">
//               <button
//                 onClick={() => {
//                   const imageSrc = webcamRef.current.getScreenshot();
//                   handleUpload(imageSrc, captureIndex);
//                   setShowWebcam(false);
//                 }}
//                 className="px-4 py-2 bg-green-500 text-white rounded"
//               >
//                 {t("cutting.capture")}
//               </button>
//               <button
//                 onClick={() => setShowWebcam(false)}
//                 className="px-4 py-2 bg-red-500 text-white rounded"
//               >
//                 {t("cutting.cancel")}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {selectedImage && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-4 rounded-lg max-w-3xl max-h-[80vh] overflow-auto">
//             <img
//               src={selectedImage}
//               alt="Preview"
//               className="max-w-full max-h-[70vh] object-contain"
//             />
//             <div className="flex justify-center mt-4">
//               <button
//                 onClick={closeImagePopup}
//                 className="px-4 py-2 bg-red-500 text-white rounded"
//               >
//                 {t("cutting.close")}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CuttingIssues;

// import axios from "axios";
// import React, {
//   useEffect,
//   useRef,
//   useState,
//   forwardRef,
//   useImperativeHandle
// } from "react";
// import { useTranslation } from "react-i18next";
// import Webcam from "react-webcam";
// import { Camera, Image as ImageIcon, X, Plus } from "lucide-react";
// import { API_BASE_URL } from "../../../../config";

// const CuttingIssues = forwardRef(({ moNo, selectedPanel }, ref) => {
//   const { t, i18n } = useTranslation();
//   const [issuesList, setIssuesList] = useState([]);
//   const [issues, setIssues] = useState([]);
//   const [additionalComments, setAdditionalComments] = useState("");
//   const [additionalImages, setAdditionalImages] = useState([]);
//   const [showWebcam, setShowWebcam] = useState(false);
//   const [captureIndex, setCaptureIndex] = useState(null); // null for additional images, index for evidence
//   const [selectedImage, setSelectedImage] = useState(null); // For popup
//   const webcamRef = useRef(null);

//   // Expose method to parent to get formatted issues data
//   useImperativeHandle(ref, () => ({
//     getIssuesData: () => {
//       const formattedIssues = issues.map((issue) => {
//         const selectedIssue = issuesList.find(
//           (item) => item._id === issue.issueId
//         );
//         return {
//           cuttingdefectName: selectedIssue ? selectedIssue.defectEng : "",
//           cuttingdefectNameKhmer: selectedIssue
//             ? selectedIssue.defectKhmer
//             : "",
//           remarks: issue.remark || "",
//           imageData: issue.evidence ? [{ no: 1, path: issue.evidence }] : []
//         };
//       });

//       return {
//         issues: formattedIssues,
//         additionalComments: additionalComments || "",
//         additionalImages: additionalImages.map((img, idx) => ({
//           no: idx + 1,
//           path: img
//         }))
//       };
//     }
//   }));

//   useEffect(() => {
//     const fetchIssues = async () => {
//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/cutting-issues`, {
//           headers: { "Content-Type": "application/json" },
//           withCredentials: true
//         });
//         setIssuesList(response.data);
//       } catch (error) {
//         console.error("Error fetching cutting issues:", error);
//       }
//     };
//     fetchIssues();
//   }, []);

//   const handleAddIssue = () => {
//     setIssues([...issues, { issueId: "", remark: "", evidence: null }]);
//   };

//   const handleIssueChange = (index, field, value) => {
//     const newIssues = [...issues];
//     newIssues[index][field] = value;
//     setIssues(newIssues);
//   };

//   const handleUpload = async (imageSrc, index) => {
//     const blob = await (await fetch(imageSrc)).blob();
//     const file = new File([blob], `cutting-capture-${Date.now()}.jpg`, {
//       type: "image/jpeg"
//     });
//     const formData = new FormData();
//     formData.append("image", file);
//     try {
//       const response = await axios.post(
//         `${API_BASE_URL}/api/upload-cutting-image`,
//         formData,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//           withCredentials: true
//         }
//       );
//       const imageUrl = `${API_BASE_URL}${response.data.url}`;
//       if (index === null) {
//         setAdditionalImages([...additionalImages, imageUrl]);
//       } else {
//         const newIssues = [...issues];
//         newIssues[index].evidence = imageUrl;
//         setIssues(newIssues);
//       }
//     } catch (error) {
//       console.error("Error uploading image:", error);
//     }
//   };

//   const handleRemoveEvidence = (index) => {
//     const newIssues = [...issues];
//     newIssues[index].evidence = null;
//     setIssues(newIssues);
//   };

//   const handleRemoveAdditionalImage = (index) => {
//     const newImages = additionalImages.filter((_, i) => i !== index);
//     setAdditionalImages(newImages);
//   };

//   const openImagePopup = (imageUrl) => {
//     setSelectedImage(imageUrl);
//   };

//   const closeImagePopup = () => {
//     setSelectedImage(null);
//   };

//   const getIssueDisplayName = (issueItem) => {
//     if (i18n.language === "kh") {
//       return issueItem.defectKhmer || issueItem.defectEng;
//     } else if (i18n.language === "zh") {
//       return issueItem.defectChinese || issueItem.defectEng;
//     } else {
//       return issueItem.defectEng;
//     }
//   };

//   return (
//     <div className="mt-6">
//       <h3 className="text-lg font-semibold mb-2">{t("cutting.issues")}</h3>
//       <div className="overflow-x-auto">
//         <table className="min-w-full border-collapse border border-gray-300">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="border border-gray-300 p-2 text-sm">
//                 {t("cutting.cuttingIssue")}
//               </th>
//               <th className="border border-gray-300 p-2 text-sm">
//                 {t("cutting.remark")}
//               </th>
//               <th className="border border-gray-300 p-2 text-sm">
//                 {t("cutting.evidence")}
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             {issues.map((issue, index) => {
//               const selectedIssue = issuesList.find(
//                 (item) => item._id === issue.issueId
//               );
//               const selectedIssueIds = issues
//                 .filter((_, i) => i !== index)
//                 .map((i) => i.issueId)
//                 .filter((id) => id);
//               const availableIssues = issuesList.filter(
//                 (issueItem) => !selectedIssueIds.includes(issueItem._id)
//               );
//               return (
//                 <tr key={index}>
//                   <td className="border border-gray-300 p-2">
//                     <select
//                       value={issue.issueId}
//                       onChange={(e) =>
//                         handleIssueChange(index, "issueId", e.target.value)
//                       }
//                       className="w-full p-1 border border-gray-300 rounded text-xs"
//                     >
//                       <option value="">{t("cutting.selectIssue")}</option>
//                       {availableIssues.map((issueItem) => (
//                         <option key={issueItem._id} value={issueItem._id}>
//                           {getIssueDisplayName(issueItem)}
//                         </option>
//                       ))}
//                     </select>
//                   </td>
//                   <td className="border border-gray-300 p-2">
//                     <input
//                       type="text"
//                       value={issue.remark}
//                       onChange={(e) =>
//                         handleIssueChange(index, "remark", e.target.value)
//                       }
//                       className="w-full p-1 border border-gray-300 rounded"
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-2">
//                     <div className="flex items-center gap-2">
//                       <button
//                         onClick={() => {
//                           setCaptureIndex(index);
//                           setShowWebcam(true);
//                         }}
//                         disabled={issue.evidence}
//                         className={`p-1 rounded ${
//                           issue.evidence
//                             ? "bg-gray-300 cursor-not-allowed"
//                             : "bg-blue-500 text-white"
//                         }`}
//                       >
//                         <Camera className="w-5 h-5" />
//                       </button>
//                       <button
//                         onClick={() => openImagePopup(issue.evidence)}
//                         disabled={!issue.evidence}
//                         className={`p-1 rounded ${
//                           issue.evidence
//                             ? "bg-green-500 text-white"
//                             : "bg-gray-300 cursor-not-allowed"
//                         }`}
//                       >
//                         <ImageIcon className="w-5 h-5" />
//                       </button>
//                       {issue.evidence && (
//                         <button
//                           onClick={() => handleRemoveEvidence(index)}
//                           className="p-1 bg-red-500 text-white rounded"
//                         >
//                           <X className="w-5 h-5" />
//                         </button>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//       <button
//         onClick={handleAddIssue}
//         className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
//       >
//         {t("cutting.addIssue")}
//       </button>
//       <hr className="my-4 border-gray-300" />
//       <div className="mt-4 relative">
//         <label className="block text-sm font-medium text-gray-700">
//           {t("cutting.additionalComments")}
//         </label>
//         <textarea
//           value={additionalComments}
//           onChange={(e) => setAdditionalComments(e.target.value)}
//           maxLength={250}
//           className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//           rows="3"
//         />
//         <span className="absolute bottom-2 right-2 text-sm text-gray-500">
//           {additionalComments.length}/250
//         </span>
//       </div>
//       <div className="mt-4">
//         <label className="block text-sm font-medium text-gray-700">
//           {t("cutting.additionalImages")}
//         </label>
//         <div className="border border-gray-300 rounded-lg p-4 flex items-center gap-2 flex-wrap">
//           {additionalImages.map((img, idx) => (
//             <div key={idx} className="relative">
//               <img
//                 src={img}
//                 alt="Additional"
//                 className="w-32 h-32 object-cover rounded cursor-pointer"
//                 onClick={() => openImagePopup(img)}
//               />
//               <button
//                 onClick={() => handleRemoveAdditionalImage(idx)}
//                 className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full text-xs"
//               >
//                 <X className="w-3 h-3" />
//               </button>
//             </div>
//           ))}
//           {additionalImages.length < 5 && (
//             <button
//               onClick={() => {
//                 setCaptureIndex(null);
//                 setShowWebcam(true);
//               }}
//               className="p-2 bg-blue-500 text-white rounded"
//             >
//               <Camera className="w-5 h-5" />
//             </button>
//           )}
//           {additionalImages.length > 0 && additionalImages.length < 5 && (
//             <button
//               onClick={() => {
//                 setCaptureIndex(null);
//                 setShowWebcam(true);
//               }}
//               className="p-2 bg-blue-500 text-white rounded"
//             >
//               <Plus className="w-5 h-5" />
//             </button>
//           )}
//         </div>
//       </div>
//       {showWebcam && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-4 rounded-lg">
//             <Webcam
//               audio={false}
//               ref={webcamRef}
//               screenshotFormat="image/jpeg"
//               width="100%"
//               videoConstraints={{
//                 facingMode: { ideal: "environment" }
//               }}
//             />
//             <div className="flex justify-center mt-4 gap-4">
//               <button
//                 onClick={() => {
//                   const imageSrc = webcamRef.current.getScreenshot();
//                   handleUpload(imageSrc, captureIndex);
//                   setShowWebcam(false);
//                 }}
//                 className="px-4 py-2 bg-green-500 text-white rounded"
//               >
//                 {t("cutting.capture")}
//               </button>
//               <button
//                 onClick={() => setShowWebcam(false)}
//                 className="px-4 py-2 bg-red-500 text-white rounded"
//               >
//                 {t("cutting.cancel")}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {selectedImage && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-4 rounded-lg max-w-3xl max-h-[80vh] overflow-auto">
//             <img
//               src={selectedImage}
//               alt="Preview"
//               className="max-w-full max-h-[70vh] object-contain"
//             />
//             <div className="flex justify-center mt-4">
//               <button
//                 onClick={closeImagePopup}
//                 className="px-4 py-2 bg-red-500 text-white rounded"
//               >
//                 {t("cutting.close")}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// export default CuttingIssues;

// import axios from "axios";
// import React, {
//   useEffect,
//   useRef,
//   useState,
//   forwardRef,
//   useImperativeHandle
// } from "react";
// import { useTranslation } from "react-i18next";
// import Webcam from "react-webcam";
// import { Camera, Eye, X, Upload } from "lucide-react";
// import { API_BASE_URL } from "../../../../config";

// const CuttingIssues = forwardRef(({ moNo, selectedPanel }, ref) => {
//   const { t, i18n } = useTranslation();
//   const [issuesList, setIssuesList] = useState([]);
//   const [issues, setIssues] = useState([]);
//   const [additionalComments, setAdditionalComments] = useState("");
//   const [additionalImages, setAdditionalImages] = useState([]);
//   const [showWebcam, setShowWebcam] = useState(false);
//   const [captureIndex, setCaptureIndex] = useState(null); // null for additional images, index for evidence
//   const [selectedImage, setSelectedImage] = useState(null); // For popup
//   const webcamRef = useRef(null);
//   const fileInputRef = useRef(null); // Ref for file input

//   // Expose method to parent to get formatted issues data
//   useImperativeHandle(ref, () => ({
//     getIssuesData: () => {
//       const formattedIssues = issues.map((issue) => {
//         const selectedIssue = issuesList.find(
//           (item) => item._id === issue.issueId
//         );
//         return {
//           cuttingdefectName: selectedIssue ? selectedIssue.defectEng : "",
//           cuttingdefectNameKhmer: selectedIssue
//             ? selectedIssue.defectKhmer
//             : "",
//           remarks: issue.remark || "",
//           imageData: issue.evidence ? [{ no: 1, path: issue.evidence }] : []
//         };
//       });

//       return {
//         issues: formattedIssues,
//         additionalComments: additionalComments || "",
//         additionalImages: additionalImages.map((img, idx) => ({
//           no: idx + 1,
//           path: img
//         }))
//       };
//     }
//   }));

//   useEffect(() => {
//     const fetchIssues = async () => {
//       try {
//         const response = await axios.get(`${API_BASE_URL}/api/cutting-issues`, {
//           headers: { "Content-Type": "application/json" },
//           withCredentials: true
//         });
//         setIssuesList(response.data);
//       } catch (error) {
//         console.error("Error fetching cutting issues:", error);
//       }
//     };
//     fetchIssues();
//   }, []);

//   const handleAddIssue = () => {
//     setIssues([...issues, { issueId: "", remark: "", evidence: null }]);
//   };

//   const handleIssueChange = (index, field, value) => {
//     const newIssues = [...issues];
//     newIssues[index][field] = value;
//     setIssues(newIssues);
//   };

//   const handleUpload = async (imageSrc, index) => {
//     const blob = await (await fetch(imageSrc)).blob();
//     const file = new File([blob], `cutting-image-${Date.now()}.jpg`, {
//       type: "image/jpeg"
//     });
//     const formData = new FormData();
//     formData.append("image", file);
//     try {
//       const response = await axios.post(
//         `${API_BASE_URL}/api/upload-cutting-image`,
//         formData,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//           withCredentials: true
//         }
//       );
//       const imageUrl = `${API_BASE_URL}${response.data.url}`;
//       if (index === null) {
//         setAdditionalImages([...additionalImages, imageUrl]);
//       } else {
//         const newIssues = [...issues];
//         newIssues[index].evidence = imageUrl;
//         setIssues(newIssues);
//       }
//     } catch (error) {
//       console.error("Error uploading image:", error);
//     }
//   };

//   const handleFileUpload = (event, index) => {
//     const file = event.target.files[0];
//     if (file && file.type.startsWith("image/")) {
//       const reader = new FileReader();
//       reader.onload = () => {
//         handleUpload(reader.result, index);
//       };
//       reader.readAsDataURL(file);
//     }
//     event.target.value = null; // Reset file input
//   };

//   const handleRemoveEvidence = (index) => {
//     const newIssues = [...issues];
//     newIssues[index].evidence = null;
//     setIssues(newIssues);
//   };

//   const handleRemoveAdditionalImage = (index) => {
//     const newImages = additionalImages.filter((_, i) => i !== index);
//     setAdditionalImages(newImages);
//   };

//   const openImagePopup = (imageUrl) => {
//     setSelectedImage(imageUrl);
//   };

//   const closeImagePopup = () => {
//     setSelectedImage(null);
//   };

//   const getIssueDisplayName = (issueItem) => {
//     if (i18n.language === "kh") {
//       return issueItem.defectKhmer || issueItem.defectEng;
//     } else if (i18n.language === "zh") {
//       return issueItem.defectChinese || issueItem.defectEng;
//     } else {
//       return issueItem.defectEng;
//     }
//   };

//   return (
//     <div className="mt-6">
//       <h3 className="text-lg font-semibold mb-2">{t("cutting.issues")}</h3>
//       <div className="overflow-x-auto">
//         <table className="min-w-full border-collapse border border-gray-300">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="border border-gray-300 p-2 text-sm">
//                 {t("cutting.cuttingIssue")}
//               </th>
//               <th className="border border-gray-300 p-2 text-sm">
//                 {t("cutting.remark")}
//               </th>
//               <th className="border border-gray-300 p-2 text-sm">
//                 {t("cutting.evidence")}
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             {issues.map((issue, index) => {
//               const selectedIssue = issuesList.find(
//                 (item) => item._id === issue.issueId
//               );
//               const selectedIssueIds = issues
//                 .filter((_, i) => i !== index)
//                 .map((i) => i.issueId)
//                 .filter((id) => id);
//               const availableIssues = issuesList.filter(
//                 (issueItem) => !selectedIssueIds.includes(issueItem._id)
//               );
//               const hasEvidence = !!issue.evidence;
//               return (
//                 <tr key={index}>
//                   <td className="border border-gray-300 p-2">
//                     <select
//                       value={issue.issueId}
//                       onChange={(e) =>
//                         handleIssueChange(index, "issueId", e.target.value)
//                       }
//                       className="w-full p-1 border border-gray-300 rounded text-xs"
//                     >
//                       <option value="">{t("cutting.selectIssue")}</option>
//                       {availableIssues.map((issueItem) => (
//                         <option key={issueItem._id} value={issueItem._id}>
//                           {getIssueDisplayName(issueItem)}
//                         </option>
//                       ))}
//                     </select>
//                   </td>
//                   <td className="border border-gray-300 p-2">
//                     <input
//                       type="text"
//                       value={issue.remark}
//                       onChange={(e) =>
//                         handleIssueChange(index, "remark", e.target.value)
//                       }
//                       className="w-full p-1 border border-gray-300 rounded"
//                     />
//                   </td>
//                   <td className="border border-gray-300 p-2">
//                     <div className="flex items-center gap-2">
//                       <button
//                         onClick={() => {
//                           fileInputRef.current.click();
//                           setCaptureIndex(index);
//                         }}
//                         disabled={hasEvidence}
//                         className={`p-1 rounded ${
//                           hasEvidence
//                             ? "bg-gray-300 cursor-not-allowed"
//                             : "bg-purple-500 text-white"
//                         }`}
//                       >
//                         <Upload className="w-5 h-5" />
//                       </button>
//                       <input
//                         type="file"
//                         ref={fileInputRef}
//                         onChange={(e) => handleFileUpload(e, index)}
//                         accept="image/*"
//                         className="hidden"
//                       />
//                       <button
//                         onClick={() => {
//                           setCaptureIndex(index);
//                           setShowWebcam(true);
//                         }}
//                         disabled={hasEvidence}
//                         className={`p-1 rounded ${
//                           hasEvidence
//                             ? "bg-gray-300 cursor-not-allowed"
//                             : "bg-blue-500 text-white"
//                         }`}
//                       >
//                         <Camera className="w-5 h-5" />
//                       </button>
//                       <button
//                         onClick={() => openImagePopup(issue.evidence)}
//                         disabled={!hasEvidence}
//                         className={`p-1 rounded ${
//                           hasEvidence
//                             ? "bg-green-500 text-white"
//                             : "bg-gray-300 cursor-not-allowed"
//                         }`}
//                       >
//                         <Eye className="w-5 h-5" />
//                       </button>
//                       {hasEvidence && (
//                         <button
//                           onClick={() => handleRemoveEvidence(index)}
//                           className="p-1 bg-red-500 text-white rounded"
//                         >
//                           <X className="w-5 h-5" />
//                         </button>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//       <button
//         onClick={handleAddIssue}
//         className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
//       >
//         {t("cutting.addIssue")}
//       </button>
//       <hr className="my-4 border-gray-300" />
//       <div className="mt-4 relative">
//         <label className="block text-sm font-medium text-gray-700">
//           {t("cutting.additionalComments")}
//         </label>
//         <textarea
//           value={additionalComments}
//           onChange={(e) => setAdditionalComments(e.target.value)}
//           maxLength={250}
//           className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
//           rows="3"
//         />
//         <span className="absolute bottom-2 right-2 text-sm text-gray-500">
//           {additionalComments.length}/250
//         </span>
//       </div>
//       <div className="mt-4">
//         <label className="block text-sm font-medium text-gray-700">
//           {t("cutting.additionalImages")}
//         </label>
//         <div className="border border-gray-300 rounded-lg p-4 flex items-center gap-2 flex-wrap">
//           {additionalImages.map((img, idx) => (
//             <div key={idx} className="relative">
//               <img
//                 src={img}
//                 alt="Additional"
//                 className="w-32 h-32 object-cover rounded cursor-pointer"
//                 onClick={() => openImagePopup(img)}
//               />
//               <button
//                 onClick={() => handleRemoveAdditionalImage(idx)}
//                 className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full text-xs"
//               >
//                 <X className="w-3 h-3" />
//               </button>
//             </div>
//           ))}
//           {additionalImages.length < 5 && (
//             <div className="flex flex-col gap-2">
//               <button
//                 onClick={() => {
//                   setCaptureIndex(null);
//                   setShowWebcam(true);
//                 }}
//                 className="p-2 bg-blue-500 text-white rounded"
//               >
//                 <Camera className="w-5 h-5" />
//               </button>
//               <button
//                 onClick={() => {
//                   fileInputRef.current.click();
//                   setCaptureIndex(null);
//                 }}
//                 className="p-2 bg-purple-500 text-white rounded"
//               >
//                 <Upload className="w-5 h-5" />
//               </button>
//               <input
//                 type="file"
//                 ref={fileInputRef}
//                 onChange={(e) => handleFileUpload(e, null)}
//                 accept="image/*"
//                 className="hidden"
//               />
//             </div>
//           )}
//         </div>
//       </div>
//       {showWebcam && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-4 rounded-lg">
//             <Webcam
//               audio={false}
//               ref={webcamRef}
//               screenshotFormat="image/jpeg"
//               width="100%"
//               videoConstraints={{
//                 facingMode: { ideal: "environment" }
//               }}
//             />
//             <div className="flex justify-center mt-4 gap-4">
//               <button
//                 onClick={() => {
//                   const imageSrc = webcamRef.current.getScreenshot();
//                   handleUpload(imageSrc, captureIndex);
//                   setShowWebcam(false);
//                 }}
//                 className="px-4 py-2 bg-green-500 text-white rounded"
//               >
//                 {t("cutting.capture")}
//               </button>
//               <button
//                 onClick={() => setShowWebcam(false)}
//                 className="px-4 py-2 bg-red-500 text-white rounded"
//               >
//                 {t("cutting.cancel")}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {selectedImage && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-4 rounded-lg max-w-3xl max-h-[80vh] overflow-auto">
//             <img
//               src={selectedImage}
//               alt="Preview"
//               className="max-w-full max-h-[70vh] object-contain"
//             />
//             <div className="flex justify-center mt-4">
//               <button
//                 onClick={closeImagePopup}
//                 className="px-4 py-2 bg-red-500 text-white rounded"
//               >
//                 {t("cutting.close")}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// export default CuttingIssues;

import axios from "axios";
import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle
} from "react";
import { useTranslation } from "react-i18next";
import Webcam from "react-webcam";
import { Camera, Eye, X, Upload } from "lucide-react";
import { API_BASE_URL } from "../../../../config";

const CuttingIssues = forwardRef(({ moNo, selectedPanel }, ref) => {
  const { t, i18n } = useTranslation();
  const [issuesList, setIssuesList] = useState([]);
  const [issues, setIssues] = useState([]);
  const [additionalComments, setAdditionalComments] = useState("");
  const [additionalImages, setAdditionalImages] = useState([]);
  const [showWebcam, setShowWebcam] = useState(false);
  const [captureIndex, setCaptureIndex] = useState(null); // null for additional images, index for evidence
  const [selectedImage, setSelectedImage] = useState(null); // For popup
  const webcamRef = useRef(null);
  const issueFileInputRef = useRef(null); // For Cutting Issues table
  const additionalFileInputRef = useRef(null); // For Additional Images

  // Expose method to parent to get formatted issues data
  useImperativeHandle(ref, () => ({
    getIssuesData: () => {
      const formattedIssues = issues.map((issue) => {
        const selectedIssue = issuesList.find(
          (item) => item._id === issue.issueId
        );
        return {
          cuttingdefectName: selectedIssue ? selectedIssue.defectEng : "",
          cuttingdefectNameKhmer: selectedIssue
            ? selectedIssue.defectKhmer
            : "",
          remarks: issue.remark || "",
          imageData: issue.evidence ? [{ no: 1, path: issue.evidence }] : []
        };
      });

      return {
        issues: formattedIssues,
        additionalComments: additionalComments || "",
        additionalImages: additionalImages.map((img, idx) => ({
          no: idx + 1,
          path: img
        }))
      };
    }
  }));

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/cutting-issues`, {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        });
        setIssuesList(response.data);
      } catch (error) {
        console.error("Error fetching cutting issues:", error);
      }
    };
    fetchIssues();
  }, []);

  const handleAddIssue = () => {
    setIssues([...issues, { issueId: "", remark: "", evidence: null }]);
  };

  const handleIssueChange = (index, field, value) => {
    const newIssues = [...issues];
    newIssues[index][field] = value;
    setIssues(newIssues);
  };

  const handleUpload = async (imageSrc, index) => {
    const blob = await (await fetch(imageSrc)).blob();
    const file = new File([blob], `cutting-image-${Date.now()}.jpg`, {
      type: "image/jpeg"
    });
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/upload-cutting-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true
        }
      );
      const imageUrl = `${API_BASE_URL}${response.data.url}`;
      if (index === null) {
        setAdditionalImages([...additionalImages, imageUrl]);
      } else {
        const newIssues = [...issues];
        newIssues[index].evidence = imageUrl;
        setIssues(newIssues);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleFileUpload = (event, index) => {
    console.log("handleFileUpload called with index:", index);
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      console.log("File selected:", file.name);
      const reader = new FileReader();
      reader.onload = () => {
        console.log("File read as data URL, passing to handleUpload");
        handleUpload(reader.result, index);
      };
      reader.readAsDataURL(file);
    } else {
      console.log("No valid image file selected");
    }
    event.target.value = null; // Reset file input
  };

  const handleRemoveEvidence = (index) => {
    const newIssues = [...issues];
    newIssues[index].evidence = null;
    setIssues(newIssues);
  };

  const handleRemoveAdditionalImage = (index) => {
    const newImages = additionalImages.filter((_, i) => i !== index);
    setAdditionalImages(newImages);
  };

  const openImagePopup = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImagePopup = () => {
    setSelectedImage(null);
  };

  const getIssueDisplayName = (issueItem) => {
    if (i18n.language === "kh") {
      return issueItem.defectKhmer || issueItem.defectEng;
    } else if (i18n.language === "zh") {
      return issueItem.defectChinese || issueItem.defectEng;
    } else {
      return issueItem.defectEng;
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">{t("cutting.issues")}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-sm">
                {t("cutting.cuttingIssue")}
              </th>
              <th className="border border-gray-300 p-2 text-sm">
                {t("cutting.remark")}
              </th>
              <th className="border border-gray-300 p-2 text-sm">
                {t("cutting.evidence")}
              </th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue, index) => {
              const selectedIssue = issuesList.find(
                (item) => item._id === issue.issueId
              );
              const selectedIssueIds = issues
                .filter((_, i) => i !== index)
                .map((i) => i.issueId)
                .filter((id) => id);
              const availableIssues = issuesList.filter(
                (issueItem) => !selectedIssueIds.includes(issueItem._id)
              );
              const hasEvidence = !!issue.evidence;
              return (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">
                    <select
                      value={issue.issueId}
                      onChange={(e) =>
                        handleIssueChange(index, "issueId", e.target.value)
                      }
                      className="w-full p-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="">{t("cutting.selectIssue")}</option>
                      {availableIssues.map((issueItem) => (
                        <option key={issueItem._id} value={issueItem._id}>
                          {getIssueDisplayName(issueItem)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="text"
                      value={issue.remark}
                      onChange={(e) =>
                        handleIssueChange(index, "remark", e.target.value)
                      }
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          issueFileInputRef.current.click();
                        }}
                        disabled={hasEvidence}
                        className={`p-1 rounded ${
                          hasEvidence
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-purple-500 text-white"
                        }`}
                      >
                        <Upload className="w-5 h-5" />
                      </button>
                      <input
                        type="file"
                        ref={issueFileInputRef}
                        onChange={(e) => handleFileUpload(e, index)}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => {
                          setCaptureIndex(index);
                          setShowWebcam(true);
                        }}
                        disabled={hasEvidence}
                        className={`p-1 rounded ${
                          hasEvidence
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openImagePopup(issue.evidence)}
                        disabled={!hasEvidence}
                        className={`p-1 rounded ${
                          hasEvidence
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 cursor-not-allowed"
                        }`}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {hasEvidence && (
                        <button
                          onClick={() => handleRemoveEvidence(index)}
                          className="p-1 bg-red-500 text-white rounded"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        onClick={handleAddIssue}
        className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
      >
        {t("cutting.addIssue")}
      </button>
      <hr className="my-4 border-gray-300" />
      <div className="mt-4 relative">
        <label className="block text-sm font-medium text-gray-700">
          {t("cutting.additionalComments")}
        </label>
        <textarea
          value={additionalComments}
          onChange={(e) => setAdditionalComments(e.target.value)}
          maxLength={250}
          className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
          rows="3"
        />
        <span className="absolute bottom-2 right-2 text-sm text-gray-500">
          {additionalComments.length}/250
        </span>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          {t("cutting.additionalImages")}
        </label>
        <div className="border border-gray-300 rounded-lg p-4 flex items-center gap-2 flex-wrap">
          {additionalImages.map((img, idx) => (
            <div key={idx} className="relative">
              <img
                src={img}
                alt="Additional"
                className="w-32 h-32 object-cover rounded cursor-pointer"
                onClick={() => openImagePopup(img)}
              />
              <button
                onClick={() => handleRemoveAdditionalImage(idx)}
                className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {additionalImages.length < 5 && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setCaptureIndex(null);
                  setShowWebcam(true);
                }}
                className="p-2 bg-blue-500 text-white rounded"
              >
                <Camera className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  additionalFileInputRef.current.click();
                }}
                className="p-2 bg-purple-500 text-white rounded"
              >
                <Upload className="w-5 h-5" />
              </button>
              <input
                type="file"
                ref={additionalFileInputRef}
                onChange={(e) => handleFileUpload(e, null)}
                accept="image/*"
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
      {showWebcam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={{
                facingMode: { ideal: "environment" }
              }}
            />
            <div className="flex justify-center mt-4 gap-4">
              <button
                onClick={() => {
                  const imageSrc = webcamRef.current.getScreenshot();
                  handleUpload(imageSrc, captureIndex);
                  setShowWebcam(false);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                {t("cutting.capture")}
              </button>
              <button
                onClick={() => setShowWebcam(false)}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                {t("cutting.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-3xl max-h-[80vh] overflow-auto">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[70vh] object-contain"
            />
            <div className="flex justify-center mt-4">
              <button
                onClick={closeImagePopup}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                {t("cutting.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CuttingIssues;
