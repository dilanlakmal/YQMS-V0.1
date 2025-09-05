import  { useRef,useState,useEffect } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2, Camera, X, PlusCircle, Upload, Minus, Eye, EyeOff  } from 'lucide-react';
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
   addedDefects,
  setAddedDefects,
  selectedDefect,
  setSelectedDefect,
  defectQty,
  setDefectQty,
  uploadedImages,
  setUploadedImages,
  comment,
  setComment,
  defectsByPc,
  setDefectsByPc,
  normalizeImageSrc,
}) => {
  const imageInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { i18n } = useTranslation();
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState(null);
  const aql = formData.aql && formData.aql[0];
  // console.log("AQL array in DefectDetailsSection:", formData.aql);

  // State is now managed by the parent QCWashingPage component
  
  const getDefectNameForDisplay = (d) => {
    if (!d) return "N/A";
    const lang = i18n.language;
    if (lang.startsWith("kh")) return d.khmer || d.english;
    if (lang.startsWith("ch") || lang.startsWith("zh"))
      return d.chinese || d.english;
    return d.english;
  };

  let statusColorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
  // Correctly calculate total defects from the new defectsByPc structure
 if (defectStatus === 'Pass') {
    statusColorClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  } else if (defectStatus === 'Fail') {
    statusColorClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  } else {
    defectStatus = 'N/A';
  }

  const handleAddDefectCard = (pc) => {
    setDefectsByPc(prev => ({
      ...prev,
      [pc]: [
        ...(prev[pc] || []),
        {
          id: (prev[pc]?.length || 0) + 1,
          selectedDefect: '',
          defectName: '',
          defectQty: 1,
          defectImages: [],
          isBodyVisible: true,
        },
      ],
    }));
  };

  const handleAddPc = () => {
    setDefectsByPc(prev => ({
      ...prev,
      [(Object.keys(prev).length || 0) + 1]: [{ id: 1, selectedDefect: '',defectNmae:'', defectQty: 1,  defectImages: [], isBodyVisible: true }],
    }));
  };
  
  
  const handleToggleVisibility = (pc, defectId) => {
    setDefectsByPc(prev => ({
      ...prev,
      [pc]: prev[pc].map(d => d.id === defectId ? { ...d, isBodyVisible: !d.isBodyVisible } : d),
    }));
  };
  
  
    const handleRemoveDefectCard = (pc, defectId) => {
    setDefectsByPc(prev => {
      const updatedPcDefects = prev[pc].filter(d => d.id !== defectId);
      // If no defects are left for this PC, remove the PC entry itself
      if (updatedPcDefects.length === 0) {
        const { [pc]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [pc]: updatedPcDefects
      };
    });
  };

  const handleRemoveDefectImage = (pc, defectId, imageIndex) => {
    setDefectsByPc(prev => ({
      ...prev,
      [pc]: prev[pc].map(d =>
        d.id === defectId
          ? { ...d, defectImages: (d.defectImages || []).filter((_, i) => i !== imageIndex) }
          : d
      )
    }));
  };

  const handleRemoveImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > 5) {
      Swal.fire('Limit Exceeded', 'You can only upload a maximum of 5 images.', 'warning');
      return;
    }

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    Swal.fire({
      title: 'Compressing images...',
      text: 'Please wait.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    for (const file of files) {
      try {
        const compressedFile = await imageCompression(file, options);
        const preview = URL.createObjectURL(compressedFile);
        setUploadedImages(prev => [...prev, { file: compressedFile, preview, name: compressedFile.name }]);
      } catch (error) {
        console.error('Image compression failed:', error);
        Swal.fire('Error', 'Failed to compress image.', 'error');
      }
    }
    Swal.close();
  };

  const handleDefectChange = (pc, defectId, field, value) => {
  setDefectsByPc(prev => ({
    ...prev,
    [pc]: prev[pc].map(d => {
      if (d.id === defectId) {
        if (field === 'selectedDefect') {
          // Find the defect object by _id
          const defectObj = defectOptions.find(opt => opt._id === value);
          return {
            ...d,
            selectedDefect: value,
            defectName: defectObj ? getDefectNameForDisplay(defectObj) : '', 
          };
        }
        return { ...d, [field]: value };
      }
      return d;
    })
  }));
};


  
    const handleDefectImageChange = async (pc, defectId, e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
  
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
  
      Swal.fire({
        title: 'Compressing images...',
        text: 'Please wait.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });
  
      const compressedFiles = await Promise.all(files.map(async file => {
        try {
          const compressedFile = await imageCompression(file, options);
          return { file: compressedFile, preview: URL.createObjectURL(compressedFile), name: compressedFile.name };
        } catch (error) {
          console.error('Image compression failed:', error);
          Swal.fire('Error', 'Failed to compress image.', 'error');
          return null;
        }
      }));
  
      Swal.close();
      const validImages = compressedFiles.filter(img => img !== null);
      setDefectsByPc(prev => ({
        ...prev,
        [pc]: prev[pc].map(d =>
          d.id === defectId
            ? { ...d, defectImages: [...(d.defectImages || []), ...validImages] }
            : d
        )
      }));
    };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setIsCapturing(true);
      
      const result = await Swal.fire({
        title: 'Camera Active',
        html: `
          <video id="camera-video" autoplay playsinline style="width: 100%; max-width: 400px; border-radius: 8px;"></video>
          <canvas id="camera-canvas" style="display: none;"></canvas>
        `,
        showCancelButton: true,
        confirmButtonText: 'Capture Photo',
        cancelButtonText: 'Close Camera',
        allowOutsideClick: false,
        didOpen: () => {
          const video = document.getElementById('camera-video');
          if (video && mediaStream) {
            video.srcObject = mediaStream;
          }
        },
        preConfirm: async () => {
          return await capturePhoto();
        }
      });
      
      stopCamera();
      
      if (result.isConfirmed && result.value) {
        return result.value;
      }
      return null;
    } catch (error) {
      console.error('Camera access failed:', error);
      Swal.fire('Error', 'Unable to access camera. Please check permissions.', 'error');
      return null;
    }
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
            const preview = URL.createObjectURL(blob);
            resolve({ file, preview, name: file.name });
          } else {
            resolve(null);
          }
        }, 'image/jpeg', 0.8);
      });
    }
    return Promise.resolve(null);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const handleDefectCapture = async (pc, defectId) => {
    try {
      const capturedImage = await startCamera();
      if (capturedImage) {
        setDefectsByPc(prev => ({
          ...prev,
          [pc]: prev[pc].map(d =>
            d.id === defectId
              ? { ...d, defectImages: [...(d.defectImages || []), capturedImage] }
              : d
          )
        }));
        Swal.fire({
          icon: 'success',
          title: 'Image captured successfully!',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Capture failed:', error);
      Swal.fire('Error', 'Failed to capture image', 'error');
    }
  };

  const handleAdditionalCapture = async () => {
    try {
      const capturedImage = await startCamera();
      if (capturedImage) {
        setUploadedImages(prev => [...prev, capturedImage]);
        Swal.fire({
          icon: 'success',
          title: 'Image captured successfully!',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Capture failed:', error);
      Swal.fire('Error', 'Failed to capture image', 'error');
    }
  };

  
    function stripFileFromDefectImages(defectsByPc, uploadedImages) {
  const newDefectsByPc = {};
  Object.entries(defectsByPc).forEach(([pc, pcDefects]) => {
    newDefectsByPc[pc] = pcDefects.map(defect => ({
      ...defect,
      defectImages: (defect.defectImages || []).map(img => {
        if (img && typeof img === "object" && img.preview) {
          return { preview: img.preview, name: img.name || "image.jpg" };
        }
        if (typeof img === "string") {
          return { preview: img, name: "image.jpg" };
        }
        return { preview: "", name: "image.jpg" };
      })
    }));
  });
  // Remove .file from additional images
  const newUploadedImages = (uploadedImages || []).map(img => {
    if (img && typeof img === "object" && img.preview) {
      return { preview: img.preview, name: img.name || "image.jpg" };
    }
    if (typeof img === "string") {
      return { preview: img, name: "image.jpg" };
    }
    return { preview: "", name: "image.jpg" };
  });
  return { newDefectsByPc, newUploadedImages };
}


    const handleSaveDefectDetails = async () => {
  if (!recordId) {
    Swal.fire("Order details must be saved first!", "", "warning");
    return;
  }

  // Validate defect names are selected
  const missingDefects = [];
  Object.entries(defectsByPc).forEach(([pc, pcDefects]) => {
    pcDefects.forEach((defect, index) => {
      if (!defect.selectedDefect || defect.selectedDefect === '') {
        missingDefects.push(`PC ${pc} - Defect ${index + 1}`);
      }
    });
  });

  if (missingDefects.length > 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Please select defect names',
      text: `Missing defect names for: ${missingDefects.join(', ')}`,
      confirmButtonText: 'OK'
    });
    return;
  }

  try {
    // 1. Build defectDetails object
    const defectDetails = {
      checkedQty: formData.checkedQty,
      washQty: formData.washQty,
      result: defectStatus,
      levelUsed: formData.levelUsed,
      defectsByPc: [],
      additionalImages: [],
      comment,
    };

    // 2. Build FormData and collect files
    const formDataObj = new FormData();
    formDataObj.append("recordId", recordId);

    // For each PC and defect, handle images
    Object.entries(defectsByPc).forEach(([pcNumber, pcDefects], pcIdx) => {
      const pcDefectsArr = [];
      pcDefects.forEach((defect, defectIdx) => {
        const defectImages = (defect.defectImages || []).map((img, imgIdx) => {
          if (img.file) {
            formDataObj.append(`defectImages_${pcIdx}_${defectIdx}_${imgIdx}`, img.file);
            return null; 
          }
          return img.preview || img; 
        });

        // Find the defect object to get the English name
        const defectObj = defectOptions.find(opt => opt._id === defect.selectedDefect);
        
        pcDefectsArr.push({
          defectId: defect.selectedDefect,
          defectName: defectObj ? defectObj.english : "", // Always save English name
          defectQty: defect.defectQty,
          defectImages,
        });
      });

      defectDetails.defectsByPc.push({
        pcNumber,
        pcDefects: pcDefectsArr,
      });
    });

    // Additional images handling remains the same...
    (uploadedImages || []).forEach((img, imgIdx) => {
      if (img.file) {
        formDataObj.append(`additionalImages_${imgIdx}`, img.file);
        defectDetails.additionalImages.push(null);
      } else {
        defectDetails.additionalImages.push(img.preview || img);
      }
    });

    formDataObj.append("defectDetails", JSON.stringify(defectDetails));

    // 3. Send to backend
    const response = await fetch(`${API_BASE_URL}/api/qc-washing/defect-details-save`, {
      method: "POST",
      body: formDataObj,
    });

    const result = await response.json();
    if (result.success) {
      Swal.fire({ 
        icon: 'success', 
        title: 'Defect details saved!', 
        timer: 1000, 
        toast: true, 
        position: 'top-end', 
        showConfirmButton: false 
      });
      
      // Update the state with the saved data - but display localized names
      const { defectsByPc: backendDefectsByPc, additionalImages } = result.data || {};
      setDefectsByPc(
        (backendDefectsByPc || []).reduce((acc, pc) => {
          acc[pc.pcNumber] = (pc.pcDefects || []).map((defect, index) => {
            // Find the defect object to get the localized display name
            const defectObj = defectOptions.find(opt => opt.english === defect.defectName);
            
            return {
              id: index + 1,
              selectedDefect: defect.defectId || "",
              defectName: defectObj ? getDefectNameForDisplay(defectObj) : defect.defectName, // Display localized name
              defectQty: defect.defectQty || "",
              isBodyVisible: true,
              defectImages: (defect.defectImages || []).map(imgStr => ({
                file: null,
                preview: normalizeImageSrc(imgStr),
                name: "image.jpg"
              }))
            };
          });
          return acc;
        }, {})
      );

      // Update additional images with proper preview URLs
      setUploadedImages((additionalImages || []).map(imgStr => {
        if (typeof imgStr === "string") {
          return {
            file: null,
            preview: normalizeImageSrc(imgStr),
            name: imgStr.split('/').pop() || "image.jpg"
          };
        } else if (typeof imgStr === "object" && imgStr !== null) {
          return {
            file: null,
            preview: normalizeImageSrc(imgStr.preview || imgStr),
            name: imgStr.name || "image.jpg"
          };
        }
        return {
          file: null,
          preview: "",
          name: "image.jpg"
        };
      }));
      
      setIsSaved(true);
      setIsEditing(false);
      if (onLoadSavedDataById) onLoadSavedDataById(recordId);
      if (activateNextSection) activateNextSection();
    } else {
      Swal.fire({ 
        icon: 'error', 
        title: result.message || "Failed to save defect details", 
        timer: 2000, 
        toast: true, 
        position: 'top-end', 
        showConfirmButton: false 
      });
    }
  } catch (err) {
    Swal.fire({ 
      icon: 'error', 
      title: "Error saving defect details", 
      timer: 2000, 
      toast: true, 
      position: 'top-end', 
      showConfirmButton: false 
    });
    console.error(err);
  }
};

    const handleUpdateDefectDetails = async () => {
  if (!recordId) {
    Swal.fire("Order details must be saved first!", "", "warning");
    return;
  }

  // Validate defect names are selected
  const missingDefects = [];
  Object.entries(defectsByPc).forEach(([pc, pcDefects]) => {
    pcDefects.forEach((defect, index) => {
      if (!defect.selectedDefect || defect.selectedDefect === '') {
        missingDefects.push(`PC ${pc} - Defect ${index + 1}`);
      }
    });
  });

  if (missingDefects.length > 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Please select defect names',
      text: `Missing defect names for: ${missingDefects.join(', ')}`,
      confirmButtonText: 'OK'
    });
    return;
  }

  try {
    // Same logic as save, but for update
    const defectDetails = {
      checkedQty: formData.checkedQty,
      washQty: formData.washQty,
      result: defectStatus,
      levelUsed: formData.levelUsed,
      defectsByPc: [],
      additionalImages: [],
      comment,
    };

    const formDataObj = new FormData();
    formDataObj.append("recordId", recordId);

    Object.entries(defectsByPc).forEach(([pcNumber, pcDefects], pcIdx) => {
      const pcDefectsArr = [];
      pcDefects.forEach((defect, defectIdx) => {
        const defectImages = (defect.defectImages || []).map((img, imgIdx) => {
          if (img.file) {
            formDataObj.append(`defectImages_${pcIdx}_${defectIdx}_${imgIdx}`, img.file);
            return null; 
          }
          return img.preview || img;
        });

        // Find the defect object to get the English name
        const defectObj = defectOptions.find(opt => opt._id === defect.selectedDefect);

        pcDefectsArr.push({
          defectId: defect.selectedDefect,
          defectName: defectObj ? defectObj.english : "", // Always save English name
          defectQty: defect.defectQty,
          defectImages,
        });
      });

      defectDetails.defectsByPc.push({
        pcNumber,
        pcDefects: pcDefectsArr,
      });
    });

    // Additional images
    (uploadedImages || []).forEach((img, imgIdx) => {
      if (img.file) {
        formDataObj.append(`additionalImages_${imgIdx}`, img.file);
        defectDetails.additionalImages.push(null);
      } else {
        defectDetails.additionalImages.push(img.preview || img);
      }
    });

    formDataObj.append("defectDetails", JSON.stringify(defectDetails));

    const response = await fetch(`${API_BASE_URL}/api/qc-washing/defect-details-update`, {
      method: "POST",
      body: formDataObj,
    });

    const result = await response.json();
    if (result.success) {
      Swal.fire({ 
        icon: 'success', 
        title: 'Defect details updated!', 
        timer: 1000, 
        toast: true, 
        position: 'top-end', 
        showConfirmButton: false 
      });
      
      // Update the state with the saved data if available
      if (result.data) {
        const { defectsByPc: backendDefectsByPc, additionalImages } = result.data;
        if (backendDefectsByPc) {
          setDefectsByPc(
            (backendDefectsByPc || []).reduce((acc, pc) => {
              acc[pc.pcNumber] = (pc.pcDefects || []).map((defect, index) => {
                const defectObj = defectOptions.find(opt => opt.english === defect.defectName);
                return {
                  id: index + 1,
                  selectedDefect: defect.defectId || "",
                  defectName: defectObj ? getDefectNameForDisplay(defectObj) : defect.defectName,
                  defectQty: defect.defectQty || "",
                  isBodyVisible: true,
                  defectImages: (defect.defectImages || []).map(imgStr => ({
                    file: null,
                    preview: normalizeImageSrc(imgStr),
                    name: "image.jpg"
                  }))
                };
              });
              return acc;
            }, {})
          );
        }
        
        if (additionalImages) {
          setUploadedImages((additionalImages || []).map(imgStr => {
            if (typeof imgStr === "string") {
              return {
                file: null,
                preview: normalizeImageSrc(imgStr),
                name: imgStr.split('/').pop() || "image.jpg"
              };
            } else if (typeof imgStr === "object" && imgStr !== null) {
              return {
                file: null,
                preview: normalizeImageSrc(imgStr.preview || imgStr),
                name: imgStr.name || "image.jpg"
              };
            }
            return {
              file: null,
              preview: "",
              name: "image.jpg"
            };
          }));
        }
      }
      
      setIsSaved(true);
      setIsEditing(false);
    } else {
      Swal.fire({ 
        icon: 'error', 
        title: result.message || "Failed to update defect details", 
        timer: 2000, 
        toast: true, 
        position: 'top-end', 
        showConfirmButton: false 
      });
    }
  } catch (err) {
    Swal.fire({ 
      icon: 'error', 
      title: "Error updating defect details", 
      timer: 2000, 
      toast: true, 
      position: 'top-end', 
      showConfirmButton: false 
    });
    console.error(err);
  }
};

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Defect Details</h2>
        <button
          onClick={onToggle}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
      {isVisible && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-4">
              <label className="w-28 text-sm font-medium dark:text-gray-300">Wash Qty:</label>
              <input
                type="number"
                value={formData.washQty}
                onChange={(e) => handleInputChange('washQty', e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 disabled:bg-gray-200 disabled:dark:bg-gray-500"
                disabled={!isEditing}
               />
            </div>
            <div className="flex items-center space-x-4">
              <label className="w-28 text-sm font-medium dark:text-gray-300">Checked Qty:</label>
              <input 
                type="text" 
                value={formData.checkedQty || ''}
                readOnly={formData.reportType === "Inline" || formData.firstOutput === "First Output"}
                className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 disabled:bg-gray-200 disabled:dark:bg-gray-500"
                placeholder={
                  formData.firstOutput === "First Output"
                    ? "Auto-fetched for First Output"
                    : "Auto-calculated when Inline is selected"
                }
                 disabled={!isEditing}
              />
            </div>
           
            {/* AQL Information Display */}
             {((formData.inline === 'Inline' || formData.reportType === 'Inline') || formData.firstOutput === "First Output") && 
                (aql?.sampleSize || aql?.acceptedDefect || aql?.rejectedDefect) && (
                <div className="md:col-span-2 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    AQL Information (Level II, AQL {aql?.levelUsed || 'N/A'})
                  </h3>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-700 dark:text-blue-300">Sample Size:</span>
                      <span className="ml-2 text-blue-900 dark:text-blue-200">{aql?.sampleSize || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700 dark:text-blue-300">Accepted Defect:</span>
                      <span className="ml-2 text-blue-900 dark:text-blue-200">{aql?.acceptedDefect || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700 dark:text-blue-300">Rejected Defect:</span>
                      <span className="ml-2 text-blue-900 dark:text-blue-200">{aql?.rejectedDefect || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700 dark:text-blue-300">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${statusColorClass}`}>
                        {defectStatus || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
            )}
          </div>

          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
            <div className="flex justify-between items-center">
            <h3 className="text-md font-semibold mb-3 dark:text-white">Defect Details</h3>
            <div className="mt-4 mb-4">
              <button
                onClick={handleAddPc}
                className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-200 disabled:dark:bg-gray-500"
                 disabled={!isEditing}
              >
                <PlusCircle size={18} className="mr-1" /> Add Defect for New PC
              </button>
            </div>
            </div>
            
            {Object.keys(defectsByPc).map(pc => (
              <div key={pc} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Array.isArray(defectsByPc[pc]) ? defectsByPc[pc] : []).map((defect, index) => (
                  <div key={index} className="relative bg-gray-200 dark:bg-gray-800 rounded-lg shadow-md flex-shrink-0 p-3 mb-3 w-full">
                   <button
                      onClick={() => handleRemoveDefectCard(pc, defect.id)}
                      className="absolute top-2 right-2 p-1 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white disabled:bg-gray-200 disabled:dark:bg-gray-500"
                      aria-label={`Remove Defect ${defect.id} for PC ${pc}`}
                       disabled={!isEditing}
                    >
                      <Trash2 size={16} />
                    </button>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                      PC {pc} 
                    </h4>
                    <button
                        onClick={() => handleToggleVisibility(pc, defect.id)}
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:bg-gray-200 disabled:dark:bg-gray-500"
                        title={defect.isBodyVisible ? "Hide Details" : "Show Details"}
                        style={{position:'absolute',right:'30px',top:'10px'}}
                         disabled={!isEditing}
                      >
                        {defect.isBodyVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                     <h5 className="text-sm font-medium dark:text-gray-300 mb-2">Defect Details</h5>
                     {defect.isBodyVisible && (
                    <>
                    <div className="flex flex-col md:flex-row items-end gap-3 mt-2">
                      <div className="flex-grow w-full">
                        <label className="text-xs font-medium dark:text-gray-300">Defect Name</label>
                        <select
                          value={defect.selectedDefect}
                          onChange={(e) => handleDefectChange(pc, defect.id, 'selectedDefect', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 disabled:bg-gray-200 disabled:dark:bg-gray-500"
                          disabled={!isEditing}
                        >
                          <option value="">-- Select a defect --</option>
                          {defectOptions.map(d => (
                            <option key={d._id} value={d._id}>
                              {getDefectNameForDisplay(d)}
                            </option>
                          ))}
                        </select>
                        {/* Display the selected defect name */}
                        {/* {defect.defectName && (
                          <p className="text-xs text-gray-500 mt-1">Selected: {defect.defectName}</p>
                        )} */}
                      </div>
                      <div className="w-full md:w-40">
                        <label className="text-xs font-medium dark:text-gray-300">Quantity</label>
                      <div className="flex items-center space-x-2">
                          <button onClick={() => handleDefectChange(pc, defect.id, 'defectQty', Math.max(1, (parseInt(defect.defectQty, 10) || 1) - 1))} 
                          disabled={!isEditing}
                          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white disabled:bg-gray-200 disabled:dark:bg-gray-500">
                            
                           <Minus size={16} />
                         </button>
                          <input
                          min="1"
                          value={defect.defectQty}
                          onChange={(e) => {
                            const newValue = Math.max(1, parseInt(e.target.value, 10) || 1);
                            handleDefectChange(pc, defect.id, 'defectQty', newValue);
                          }}
                          className="w-full  border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 text-center disabled:bg-gray-200 disabled:dark:bg-gray-500"
                          placeholder="Qty"
                           disabled={!isEditing}
                        />
                          <button onClick={() => handleDefectChange(pc, defect.id, 'defectQty', (parseInt(defect.defectQty, 10) || 0) + 1)} 
                           disabled={!isEditing}
                          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white disabled:bg-gray-200 disabled:dark:bg-gray-500">
                           <Plus size={16} />
                          </button>
                        </div>
                        </div>
                    </div>
                     
                     <div className="mt-4">
                      <h5 className="text-sm font-medium dark:text-gray-300 mb-2">Defect Images (Max 5)</h5>
                      <div className="flex items-center gap-4 mt-3">
                        <button
                           onClick={() => document.getElementById(`image-input-${pc}-${defect.id}`).click()}
                            disabled={!isEditing}
                          className="flex items-center px-4 py-2 bg-green-200 rounded-md hover:bg-gray-300 disabled:bg-gray-200 disabled:dark:bg-gray-500"
                        >
                          <Upload  size={18} className="mr-2" />Upload
                        </button>
                         <input
                          type="file"
                          multiple
                          accept="image/*"
                         id={`image-input-${pc}-${defect.id}`}
                          onChange={(e) => handleDefectImageChange(pc, defect.id, e)}
                          className="hidden disabled:bg-gray-200 disabled:dark:bg-gray-500"
                           disabled={!isEditing}
                        />
                         <button
                          onClick={() => handleDefectCapture(pc, defect.id)}
                          disabled={!isEditing}
                          className="flex items-center px-4 py-2 bg-blue-200 rounded-md hover:bg-blue-300 disabled:bg-gray-200 disabled:dark:bg-gray-500"
                        >
                          <Camera size={18} className="mr-2" />Capture
                        </button>
                       
                        <span
                          className="text-xs  dark:bg-gray-800 
                          px-2 py-1 rounded shadow text-gray-600 dark:text-gray-300"
                          style={{ zIndex: 2 }}
                        >
                          {(defect.defectImages || []).length} / 5 selected
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {(defect.defectImages || []).map((image, index) => (
                          <div key={index} className="relative">
                               {image && (
                                <img
                                    src={image && typeof image === "object" ? image.preview : ""}
                                    alt={image && typeof image === "object" ? image.name || "defect image" : "defect image"}
                                    className="w-full h-24 object-cover rounded-md shadow-md dark:shadow-none cursor-pointer"
                                    onClick={() => {
                                      Swal.fire({
                                        imageUrl: image && typeof image === "object" ? image.preview : "",
                                        imageAlt: image && typeof image === "object" ? image.name || "" : "",
                                        imageWidth: 600,
                                        imageHeight: 400,
                                      });
                                    }}
                                    onError={e => { e.target.src = "/no-image.png"; }}
                                  />
                              )}
                          
                            <button
                              onClick={() => handleRemoveDefectImage(pc, defect.id, index)}
                               disabled={!isEditing}
                              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 disabled:bg-gray-200 disabled:dark:bg-gray-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    </>)}
                  </div>
                ))}

                <div className="mt-2 mb-2">
                  <button
                    onClick={() => handleAddDefectCard(pc)}
                     disabled={!isEditing}
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-white disabled:bg-gray-200 disabled:dark:bg-gray-500"
                  >
                    <PlusCircle size={18} className="mr-1" /> Add Defect for PC {pc}
                  </button>
                </div>
              </div>
            ))}
            
          </div>

          <div>
            <h3 className="text-md font-semibold mb-2 dark:text-white">Additional Images (Max 5)</h3>

            <div className="flex items-center gap-4">
              <button onClick={() => imageInputRef.current.click()} 
               disabled={!isEditing}
              className="flex items-center px-4 py-2 bg-green-200 rounded-md hover:bg-gray-300 disabled:bg-gray-200 disabled:dark:bg-gray-500">
                <Upload size={18} className="mr-2" /> Upload Images
              </button>
              
              <input
                type="file"
                multiple
                accept="image/*"
                ref={imageInputRef}
                onChange={handleImageChange}
                className="hidden"              
            />
             <button
                  disabled={!isEditing}
                  onClick={handleAdditionalCapture}
                  className="flex items-center px-4 py-2 bg-blue-200 rounded-md hover:bg-blue-300 disabled:bg-gray-200 disabled:dark:bg-gray-500"
                >
                  <Camera size={18} className="mr-2" />Capture
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">{uploadedImages.length} / 5 selected</span>
              </div>
              {uploadedImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploaded Images:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-2">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={
                                typeof image === "object" && image !== null
                                  ? (image.preview || "")
                                  : typeof image === "string"
                                    ? (normalizeImageSrc ? normalizeImageSrc(image) : image)
                                    : ""
                              }
                              alt={
                                typeof image === "object" && image !== null
                                  ? image.name || "additional image"
                                  : "additional image"
                              }
                          className="w-full h-24 object-cover rounded-md shadow-md dark:shadow-none cursor-pointer"
                          onClick={() => {
                            const imageUrl = typeof image === "object" && image !== null
                              ? (image.preview || "")
                              : typeof image === "string"
                                ? (normalizeImageSrc ? normalizeImageSrc(image) : image)
                                : "";
                            Swal.fire({
                              imageUrl: imageUrl,
                              imageAlt: (typeof image === "object" && image !== null ? image.name : "") || "",
                              imageWidth: 600,
                              imageHeight: 400,
                            });
                          }}
                          onError={e => { e.target.src = "/no-image.png"; }}
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          disabled={!isEditing}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 disabled:bg-gray-200 disabled:dark:bg-gray-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
          <div>
            <label htmlFor="comment" className="text-md font-semibold mb-2 block dark:text-white">Comments</label>
            <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows="4" 
            disabled={!isEditing} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 disabled:bg-gray-200 disabled:dark:bg-gray-500"></textarea>
          </div>
          <div className="flex justify-end mt-6">
            <button
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              onClick={isSaved ? handleUpdateDefectDetails : handleSaveDefectDetails}
              disabled={isSaved && !isEditing}
              style={{ display: isSaved && !isEditing ? 'none' : 'inline-block' }}
            >
              Save
            </button>
            {isSaved && !isEditing && (
              <button
                className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
DefectDetailsSection.propTypes = {
  formData: PropTypes.object.isRequired,
  handleInputChange: PropTypes.func,
  defectOptions: PropTypes.array,
  isVisible: PropTypes.bool,
  onToggle: PropTypes.func,
  defectStatus: PropTypes.string,
  recordId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  activateNextSection: PropTypes.func,
  onLoadSavedDataById: PropTypes.func,
  addedDefects: PropTypes.array,
  setAddedDefects: PropTypes.func,
  selectedDefect: PropTypes.any,
  setSelectedDefect: PropTypes.func,
  defectQty: PropTypes.any,
  setDefectQty: PropTypes.func,
  uploadedImages: PropTypes.array,
  setUploadedImages: PropTypes.func,
  comment: PropTypes.string,
  setComment: PropTypes.func,
  defectsByPc: PropTypes.object,
  setDefectsByPc: PropTypes.func,
  normalizeImageSrc: PropTypes.func, 
};

export default DefectDetailsSection;
