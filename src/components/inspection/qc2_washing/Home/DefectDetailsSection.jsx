import { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2, Camera, X, PlusCircle, Upload, Eye, EyeOff, Layers, Image as ImageIcon } from 'lucide-react';
import Swal from 'sweetalert2';
import { useTranslation } from "react-i18next";
import imageCompression from 'browser-image-compression';
import { API_BASE_URL } from "../../../../../config";

const DefectDetailsSection = ({ 
  formData,
  handleInputChange,
  defectOptions,
  isVisible = false,
  onToggle,
  defectStatus,
  recordId,
  activateNextSection,
  onLoadSavedDataById,
  uploadedImages,
  setUploadedImages,
  comment,
  setComment,
  defectsByPc,
  setDefectsByPc,
  normalizeImageSrc,
}) => {
  const imageInputRef = useRef(null);
  const { i18n } = useTranslation();
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [stream, setStream] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false); // Guard to prevent overwrite loops

  // State for Multi-Defects (Batch)
  const [multiDefects, setMultiDefects] = useState([]);

  // AQL Data
  const aql = formData.aql && formData.aql[0];

  // --- 1. LOAD SAVED DATA LOGIC ---
  useEffect(() => {
    // Only load if we have data and we haven't already loaded it for this specific recordId
    if (formData.defectDetails && formData.defectDetails.defectsByPc && !hasLoaded) {
      const backendDefects = formData.defectDetails.defectsByPc;
      
      const newSingleDefects = {};
      const newMultiDefects = [];

      const batchMap = new Map();
      
      backendDefects.forEach(pcItem => {
        const firstDefect = pcItem.pcDefects?.[0];
        const isBatch = pcItem.pcNumber && String(pcItem.pcNumber).startsWith("BATCH-");
         const isMulti = firstDefect && (String(firstDefect.isMulti) === "true" || firstDefect.isMulti === true);

        if (isBatch || isMulti) {
         const batchId = isBatch ? pcItem.pcNumber.replace("BATCH-", "") : `${Date.now()}`;
          
          // Create the batch object
          batchMap.set(batchId, { 
            id: batchId,
            selectedDefect: firstDefect.defectId,
            defectName: firstDefect.defectName,
            pcCount: parseInt(firstDefect.pcCount) || 1, // Ensure it's a number
            defectQty: 1,
            defectImages: (firstDefect.defectImages || []).filter(img => img).map(img => ({
              preview: normalizeImageSrc ? normalizeImageSrc(img) : img,
              file: null 
            }))
          });
        } else {
          const pcNum = pcItem.pcNumber;
          newSingleDefects[pcNum] = pcItem.pcDefects.map(d => ({
            id: Date.now() + Math.random(),
            selectedDefect: d.defectId,
            defectName: d.defectName,
            defectQty: 1,
            isMulti: false,
            pcCount: 1,
            defectImages: (d.defectImages || []).filter(img => img).map(img => ({
              preview: normalizeImageSrc ? normalizeImageSrc(img) : img,
              file: null
            }))
          }));
        }
      });
      
      newMultiDefects.push(...Array.from(batchMap.values()));

      setDefectsByPc(newSingleDefects);
      setMultiDefects(newMultiDefects);
      
      if (formData.defectDetails.comment) setComment(formData.defectDetails.comment);
      if (formData.defectDetails.additionalImages) {
         setUploadedImages(formData.defectDetails.additionalImages.map(img => ({
            preview: normalizeImageSrc ? normalizeImageSrc(img) : img,
            file: null
         })));
      }
      
      if (backendDefects.length > 0) {
        setIsSaved(true);
        setIsEditing(false);
      }
      setHasLoaded(true); // Mark as loaded so we don't overwrite user changes later
    } 
  }, [formData.defectDetails, recordId]); // Depend on recordId to allow reloading if the user switches records

  // Reset loading guard if recordId changes
  useEffect(() => {
    setHasLoaded(false);
  }, [recordId]);

  // --- Helper Functions ---
  const getDefectNameForDisplay = (d) => {
    if (!d) return "N/A";
    const lang = i18n.language;
    if (lang.startsWith("kh")) return d.khmer || d.english;
    if (lang.startsWith("ch") || lang.startsWith("zh")) return d.chinese || d.english;
    return d.english;
  };

  // --- MULTI DEFECT HANDLERS ---
  const handleAddMultiDefect = () => {
    setMultiDefects(prev => [...prev, {
      id: Date.now(),
      selectedDefect: '',
      defectName: '',
      pcCount: 1, 
      defectQty: 1,
      defectImages: [],
    }]);
  };

  const handleMultiDefectChange = (id, field, value) => {
  setMultiDefects(prev => prev.map(d => {
    if (d.id === id) {
      if (field === 'pcCount') {
        // Ensure we store a number, but allow empty string while typing
        const numValue = value === "" ? 0 : parseInt(value, 10);
        return { ...d, [field]: numValue };
      }
      if (field === 'selectedDefect') {
        const defectObj = defectOptions.find(opt => opt._id === value);
        return { 
          ...d, 
          selectedDefect: value, 
          defectName: defectObj ? (defectObj.english || "") : '' 
        };
      }
      return { ...d, [field]: value };
    }
    return d;
  }));
};



  // --- SINGLE DEFECT HANDLERS ---
  const handleAddNewPc = () => {
    const existingKeys = Object.keys(defectsByPc).map(Number).filter(n => !isNaN(n));
    const nextPc = existingKeys.length > 0 ? Math.max(...existingKeys) + 1 : 1;
    setDefectsByPc(prev => ({ ...prev, [nextPc]: [] }));
  };

  const handleAddDefectFromDropdown = (pc, defectId) => {
    if (!defectId) return;
    const defectObj = defectOptions.find(opt => opt._id === defectId);
    setDefectsByPc(prev => ({
      ...prev,
      [pc]: [...(prev[pc] || []), {
          id: Date.now(),
          selectedDefect: defectId,
          defectName: defectObj ? (defectObj.english || "") : '', 
          defectQty: 1, 
          defectImages: []
        }]
    }));
  };

  const handleSingleDefectChange = (pc, defectId, field, value) => {
    setDefectsByPc(prev => ({
      ...prev,
      [pc]: prev[pc].map(d => {
        if (d.id === defectId) {
          if (field === 'selectedDefect') {
            const defectObj = defectOptions.find(opt => opt._id === value);
            return { 
              ...d, 
              selectedDefect: value, 
              defectName: defectObj ? (defectObj.english || "") : '' 
            };
          }
          return { ...d, [field]: value };
        }
        return d;
      })
    }));
  };

  // ... (Other handlers: Camera, Save, etc. - keeping your existing logic as it was mostly correct)

  const compressImage = async (file) => {
    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
    try { return await imageCompression(file, options); } 
    catch (error) { console.error("Compression error:", error); return file; }
  };

  const handleMultiDefectImageChange = async (id, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    Swal.fire({ title: 'Compressing...', didOpen: () => Swal.showLoading() });
    const compressedFiles = await Promise.all(files.map(async file => {
      try { const c = await compressImage(file); return { file: c, preview: URL.createObjectURL(c), name: c.name }; } catch { return null; }
    }));
    Swal.close();
    setMultiDefects(prev => prev.map(d => d.id === id ? { ...d, defectImages: [...(d.defectImages || []), ...compressedFiles.filter(Boolean)] } : d));
  };

  const handleRemoveMultiDefect = (id) => setMultiDefects(prev => prev.filter(d => d.id !== id));
  const handleRemoveMultiDefectImage = (id, imageIndex) => {
    setMultiDefects(prev => prev.map(d => d.id === id ? { ...d, defectImages: d.defectImages.filter((_, i) => i !== imageIndex) } : d));
  };

  const handleRemoveDefectRow = (pc, defectId) => {
    setDefectsByPc(prev => {
      const updatedPcDefects = prev[pc].filter(d => d.id !== defectId);
      if (updatedPcDefects.length === 0) { const { [pc]: _, ...rest } = prev; return rest; }
      return { ...prev, [pc]: updatedPcDefects };
    });
  };

  const handleSingleDefectImageChange = async (pc, defectId, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    Swal.fire({ title: 'Compressing...', didOpen: () => Swal.showLoading() });
    const compressedFiles = await Promise.all(files.map(async file => {
      try { const c = await compressImage(file); return { file: c, preview: URL.createObjectURL(c), name: c.name }; } catch { return null; }
    }));
    Swal.close();
    setDefectsByPc(prev => ({
      ...prev,
      [pc]: prev[pc].map(d => d.id === defectId ? { ...d, defectImages: [...(d.defectImages || []), ...compressedFiles.filter(Boolean)] } : d)
    }));
  };

  const handleRemoveSingleDefectImage = (pc, defectId, imageIndex) => {
    setDefectsByPc(prev => ({
      ...prev,
      [pc]: prev[pc].map(d => d.id === defectId ? { ...d, defectImages: d.defectImages.filter((_, i) => i !== imageIndex) } : d)
    }));
  };

  const handleAdditionalImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > 5) {
      Swal.fire('Limit Exceeded', 'Max 5 additional images.', 'warning');
      return;
    }
    Swal.fire({ title: 'Compressing...', didOpen: () => Swal.showLoading() });
    const compressedFiles = await Promise.all(files.map(async file => {
        try {
          const compressedFile = await compressImage(file);
          return { file: compressedFile, preview: URL.createObjectURL(compressedFile), name: compressedFile.name };
        } catch (error) { return null; }
    }));
    Swal.close();
    setUploadedImages(prev => [...prev, ...compressedFiles.filter(Boolean)]);
  };

  const handleRemoveAdditionalImage = (index) => setUploadedImages(prev => prev.filter((_, i) => i !== index));

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setIsCapturing(true);
      const result = await Swal.fire({
        title: 'Camera Active',
        html: `<video id="camera-video" autoplay playsinline style="width: 100%; max-width: 400px; border-radius: 8px;"></video><canvas id="camera-canvas" style="display: none;"></canvas>`,
        showCancelButton: true, confirmButtonText: 'Capture', cancelButtonText: 'Close', allowOutsideClick: false,
        didOpen: () => { const video = document.getElementById('camera-video'); if (video && mediaStream) video.srcObject = mediaStream; },
        preConfirm: async () => await capturePhoto()
      });
      stopCamera();
      if (result.isConfirmed && result.value) return result.value;
      return null;
    } catch (error) { Swal.fire('Error', 'Unable to access camera.', 'error'); return null; }
  };

  const capturePhoto = async () => {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    if (video && canvas && video.videoWidth > 0) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `captured-${Date.now()}.jpg`, { type: 'image/jpeg' });
            resolve({ file, preview: URL.createObjectURL(blob), name: file.name });
          } else resolve(null);
        }, 'image/jpeg', 0.8);
      });
    }
    return Promise.resolve(null);
  };

  const stopCamera = () => { if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); } setIsCapturing(false); };

  const handleCameraCapture = async (type, id, pc) => {
    const img = await startCamera();
    if (!img) return;
    if (type === 'single') setDefectsByPc(prev => ({ ...prev, [pc]: prev[pc].map(d => d.id === id ? { ...d, defectImages: [...(d.defectImages || []), img] } : d) }));
    else if (type === 'multi') setMultiDefects(prev => prev.map(d => d.id === id ? { ...d, defectImages: [...(d.defectImages || []), img] } : d));
    else if (type === 'additional') setUploadedImages(prev => [...prev, img]);
  };

  // --- Calculation Logic ---
  let actualDefectStatus = defectStatus;
  if (aql && aql.acceptedDefect !== undefined) {
    const totalSingleDefects = Object.values(defectsByPc).reduce((total, pcDefects) => {
      return total + pcDefects.reduce((pcTotal, defect) => pcTotal + (parseInt(defect.defectQty) || 0), 0);
    }, 0);
    const totalMultiDefects = multiDefects.reduce((total, mDefect) => {
      return total + ((parseInt(mDefect.pcCount) || 0) * 1);
    }, 0);
    const totalDefects = totalSingleDefects + totalMultiDefects;
    actualDefectStatus = totalDefects <= aql.acceptedDefect ? 'Pass' : 'Fail';
  }

  let statusColorClass = actualDefectStatus === 'Pass' 
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';

  const preparePayload = () => {
  const formDataObj = new FormData();
  formDataObj.append("recordId", recordId);
  
  const defectDetails = {
    checkedQty: formData.checkedQty,
    washQty: formData.washQty,
    result: actualDefectStatus,
    levelUsed: formData.levelUsed,
    defectsByPc: [],
    additionalImages: [],
    comment,
  };

  let singlePcCounter = 0;
  
  // 1. Process Single PC Defects (Only numeric keys)
  Object.entries(defectsByPc).forEach(([pcNumber, pcDefects]) => {
    // CRITICAL FIX: Skip any keys that are batches (safety check)
    if (String(pcNumber).startsWith("BATCH-")) return;

    const pcDefectsArr = [];
    pcDefects.forEach((defect, defectIdx) => {
      const defectImages = (defect.defectImages || []).map((img, imgIdx) => {
        if (img.file) {
          formDataObj.append(`defectImages_${singlePcCounter}_${defectIdx}_${imgIdx}`, img.file);
          return null; 
        }
        return img.preview || img; 
      });

      pcDefectsArr.push({
        defectId: defect.selectedDefect,
        defectName: defect.defectName, 
        defectQty: 1, 
        defectImages,
        isMulti: false,
        pcCount: 1 
      });
    });

    if (pcDefectsArr.length > 0) {
      defectDetails.defectsByPc.push({
        pcNumber: pcNumber.toString(),
        pcDefects: pcDefectsArr,
      });
      singlePcCounter++;
    }
  });

  // 2. Process Multi/Batch Defects
  multiDefects.forEach((mDefect, mIdx) => {
    const defectImages = (mDefect.defectImages || []).map((img, imgIdx) => {
      if (img.file) {
        formDataObj.append(`defectImages_MULTI_${mIdx}_0_${imgIdx}`, img.file);
        return null;
      }
      return img.preview || img;
    });

    defectDetails.defectsByPc.push({
      pcNumber: `BATCH-${mDefect.id}`,
      batchId: String(mDefect.id),
      pcDefects: [{
        defectId: mDefect.selectedDefect,
        defectName: mDefect.defectName,
        defectQty: 1,
        defectImages,
        isMulti: true,
        pcCount: parseInt(mDefect.pcCount, 10) || 1
      }]
    });
  });

  // (Additional images logic remains same...)
  (uploadedImages || []).forEach((img, imgIdx) => {
    if (img.file) {
      formDataObj.append(`additionalImages_${imgIdx}`, img.file);
      defectDetails.additionalImages.push(null);
    } else {
      defectDetails.additionalImages.push(img.preview || img);
    }
  });

  formDataObj.append("defectDetails", JSON.stringify(defectDetails));
  return formDataObj;
};

  const handleSaveOrUpdate = async (isUpdate = false) => {
    if (!recordId) { Swal.fire("Order details must be saved first!", "", "warning"); return; }
    const missingDefects = [];
    Object.entries(defectsByPc).forEach(([pc, pcDefects]) => {
      pcDefects.forEach((d, i) => { if (!d.selectedDefect) missingDefects.push(`PC ${pc} - Row ${i + 1}`); });
    });
    multiDefects.forEach((d, i) => { if (!d.selectedDefect) missingDefects.push(`Batch ${i + 1}`); });
    if (missingDefects.length > 0) return Swal.fire({ icon: 'warning', title: 'Missing defect names', text: missingDefects.join(', ') });

    try {
      const formDataObj = preparePayload();
      const endpoint = isUpdate ? 'defect-details-update' : 'defect-details-save';
      const response = await fetch(`${API_BASE_URL}/api/qc-washing/${endpoint}`, { method: "POST", body: formDataObj });
      const result = await response.json();

      if (result.success) {
        Swal.fire({ icon: 'success', title: isUpdate ? 'Updated!' : 'Saved!', timer: 1000, showConfirmButton: false, toast: true, position: 'top-end' });
        setIsSaved(true);
        setIsEditing(false);
        if (onLoadSavedDataById) onLoadSavedDataById(recordId);
        if (!isUpdate && activateNextSection) activateNextSection();
      } else {
        Swal.fire({ icon: 'error', title: result.message || "Failed" });
      }
    } catch (err) { Swal.fire({ icon: 'error', title: "Error saving" }); console.error(err); }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Defect Details</h2>
        <button onClick={onToggle} className="text-indigo-600 hover:text-indigo-800 font-medium">
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
      {isVisible && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-4">
              <label className="w-28 text-sm font-medium dark:text-gray-300">Wash Qty:</label>
              <input type="number" value={formData.washQty} onChange={(e) => handleInputChange('washQty', e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white disabled:bg-gray-200" disabled={!isEditing} />
            </div>
            <div className="flex items-center space-x-4">
              <label className="w-28 text-sm font-medium dark:text-gray-300">Checked Qty:</label>
              <input type="text" value={formData.checkedQty || ''} readOnly className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white disabled:bg-gray-200" placeholder="Auto-calculated" disabled={!isEditing} />
            </div>
             {(['SOP', 'Inline', 'First Output'].includes(formData.reportType)) && (
                <div className="md:col-span-2 bg-blue-50 dark:bg-slate-800 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                      <span className="font-semibold text-blue-800 dark:text-blue-300">Level II, AQL {aql?.levelUsed || 'N/A'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColorClass}`}>{actualDefectStatus || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                    <div>Sample: {aql?.sampleSize || 'N/A'}</div>
                    <div>Acc: {aql?.acceptedDefect === 0 ? 0 : (aql?.acceptedDefect || 'N/A')}</div>
                    <div>Rej: {aql?.rejectedDefect || 'N/A'}</div>
                  </div>
                </div>
            )}
          </div>

          {/* --- MULTI DEFECT SECTION --- */}
          <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50 dark:bg-gray-750 dark:border-indigo-900">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-semibold dark:text-white text-indigo-800 flex items-center">
                <Layers className="w-4 h-4 mr-2" /> Multi-PC Defects (Batch Entry)
              </h3>
              <button onClick={handleAddMultiDefect} disabled={!isEditing} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:bg-gray-300">
                <PlusCircle size={18} className="mr-1" /> Add Batch
              </button>
            </div>
            
            <div className="space-y-4">
              {multiDefects.map((mDefect) => (
                <div key={mDefect.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-indigo-100 p-3 relative">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-5">
                      <select
                        value={mDefect.selectedDefect}
                        onChange={(e) => handleMultiDefectChange(mDefect.id, 'selectedDefect', e.target.value)}
                        className="w-full px-2 py-2 border rounded-md text-sm dark:bg-gray-700 dark:text-white"
                        disabled={!isEditing}
                      >
                        <option value="">-- Select Defect --</option>
                        {defectOptions.map(d => (
                          <option key={d._id} value={d._id}>{getDefectNameForDisplay(d)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                       <input
                          type="number" min="1" placeholder="PCs"
                          value={mDefect.pcCount}
                          onChange={(e) => handleMultiDefectChange(mDefect.id, 'pcCount', e.target.value)}
                          className="w-full px-2 py-2 border rounded-md text-center text-sm dark:bg-gray-700 dark:text-white"
                          disabled={!isEditing}
                        />
                    </div>
                    <div className="md:col-span-5 flex justify-end gap-2">
                       <button onClick={() => document.getElementById(`multi-img-${mDefect.id}`).click()} disabled={!isEditing} className="p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"><Upload size={16}/></button>
                       <input type="file" multiple accept="image/*" id={`multi-img-${mDefect.id}`} className="hidden" onChange={(e) => handleMultiDefectImageChange(mDefect.id, e)} />
                       <button onClick={() => handleCameraCapture('multi', mDefect.id)} disabled={!isEditing} className="p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"><Camera size={16}/></button>
                       <button onClick={() => handleRemoveMultiDefect(mDefect.id)} disabled={!isEditing} className="p-2 bg-red-100 text-red-500 rounded hover:bg-red-200 disabled:opacity-50"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  {/* Thumbnails */}
                  {(mDefect.defectImages || []).length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {mDefect.defectImages.map((img, i) => (
                        <div key={i} className="relative w-10 h-10 flex-shrink-0">
                          <img src={img.preview || img} className="w-full h-full object-cover rounded border" alt="" />
                          <button onClick={() => handleRemoveMultiDefectImage(mDefect.id, i)} disabled={!isEditing} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={8}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>


          {/* --- SINGLE PC DEFECT SECTION --- */}
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
            <div className="flex justify-between items-center mb-3">
               <h3 className="text-md font-semibold dark:text-white">Single PC Defects</h3>
               <button onClick={handleAddNewPc} disabled={!isEditing} className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-200">
                 <PlusCircle size={18} className="mr-1" /> New PC
               </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(defectsByPc).filter(pc => !String(pc).startsWith('BATCH-')).map(pc => (
                <div key={pc} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-600">
                  <div className="border-b pb-2 mb-2 font-bold">PC {pc}</div>
                  <div className="space-y-3">
                    {(defectsByPc[pc] || []).map((defect) => (
                      <div key={defect.id} className="border-b last:border-0 pb-2 border-gray-100 dark:border-gray-700">
                         <div className="flex items-center gap-2 mb-2">
                            <div className="flex-grow">
                                <select
                                  value={defect.selectedDefect}
                                  onChange={(e) => handleSingleDefectChange(pc, defect.id, 'selectedDefect', e.target.value)}
                                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:text-white"
                                  disabled={!isEditing}
                                >
                                  <option value="">Select Defect...</option>
                                  {defectOptions.map(d => (
                                    <option key={d._id} value={d._id}>{getDefectNameForDisplay(d)}</option>
                                  ))}
                                </select>
                            </div>
                            <div className="flex gap-1">
                               <button onClick={() => document.getElementById(`single-img-${defect.id}`).click()} disabled={!isEditing} className="p-1.5 bg-gray-100 rounded hover:bg-gray-200"><Upload size={14}/></button>
                               <input type="file" multiple accept="image/*" id={`single-img-${defect.id}`} className="hidden" onChange={(e) => handleSingleDefectImageChange(pc, defect.id, e)} />
                               <button onClick={() => handleCameraCapture('single', defect.id, pc)} disabled={!isEditing} className="p-1.5 bg-gray-100 rounded hover:bg-gray-200"><Camera size={14}/></button>
                               <button onClick={() => handleRemoveDefectRow(pc, defect.id)} disabled={!isEditing} className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100"><X size={14}/></button>
                            </div>
                         </div>
                         {(defect.defectImages || []).length > 0 && (
                            <div className="flex gap-2 overflow-x-auto">
                               {defect.defectImages.map((img, i) => (
                                 <div key={i} className="relative w-10 h-10 flex-shrink-0">
                                   <img src={img.preview || img} className="w-full h-full object-cover rounded border" alt="" />
                                   <button onClick={() => handleRemoveSingleDefectImage(pc, defect.id, i)} disabled={!isEditing} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={8}/></button>
                                 </div>
                               ))}
                            </div>
                         )}
                      </div>
                    ))}
                    
                    <div className="mt-2">
                        <select
                          value="" 
                          onChange={(e) => handleAddDefectFromDropdown(pc, e.target.value)}
                          className="w-full px-2 py-2 border border-blue-300 rounded-md text-sm text-blue-700 bg-blue-50 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-blue-300 dark:border-gray-500"
                          disabled={!isEditing}
                        >
                          <option value="">+ Add Defect row...</option>
                          {defectOptions.map(d => (
                            <option key={d._id} value={d._id}>{getDefectNameForDisplay(d)}</option>
                          ))}
                        </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- ADDITIONAL IMAGES --- */}
          <div>
            <h3 className="text-md font-semibold mb-2 dark:text-white">Additional Images</h3>
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => imageInputRef.current.click()} disabled={!isEditing} className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm">
                <Upload size={16} className="mr-2" /> Upload
              </button>
              <input type="file" multiple accept="image/*" ref={imageInputRef} onChange={handleAdditionalImageChange} className="hidden" />
              <button disabled={!isEditing} onClick={() => handleCameraCapture('additional')} className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm">
                <Camera size={16} className="mr-2" /> Capture
              </button>
              <span className="text-sm text-gray-500">{uploadedImages.length} / 5</span>
            </div>
            <div className="flex gap-2 mt-2">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative h-16 w-16">
                  <img src={image.preview || (typeof image === "string" ? normalizeImageSrc(image) : "")} className="w-full h-full object-cover rounded-md shadow-sm" alt="additional" onClick={() => Swal.fire({ imageUrl: image.preview || image })} />
                  <button onClick={() => handleRemoveAdditionalImage(index)} disabled={!isEditing} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={10} /></button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-md font-semibold mb-2 block dark:text-white">Comments</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="4" 
            disabled={!isEditing} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white disabled:bg-gray-100"></textarea>
          </div>
          
          <div className="flex justify-end mt-6">
            {!isEditing && isSaved ? (
              <button className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600" onClick={() => setIsEditing(true)}>Edit</button>
            ) : (
              <button className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700" onClick={() => handleSaveOrUpdate(isSaved)}>
                {isSaved ? 'Update' : 'Save'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectDetailsSection;