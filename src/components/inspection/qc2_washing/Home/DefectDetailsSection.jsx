import React, { useRef } from "react";
import { Plus, Trash2, Camera, X, PlusCircle, Upload, Minus, Eye, EyeOff  } from 'lucide-react';
import Swal from 'sweetalert2';
import { useTranslation } from "react-i18next";
import imageCompression from 'browser-image-compression';

const DefectDetailsSection = ({ 
  formData,
  handleInputChange,
  defectOptions,
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
  isVisible,
  onToggle,
  defectsByPc,
  setDefectsByPc,
  defectStatus
}) => {
  const imageInputRef = useRef(null);
  const { i18n } = useTranslation();
  const videoRef = useRef(null);
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

  const handleAddDefect = (pc, defect) => {
    if (!defect.selectedDefect || !defect.defectQty) {
      Swal.fire('Incomplete', 'Please select a defect and enter a quantity.', 'warning');
      return;
    }

    const defectDetails = defectOptions.find(d => d._id === defect.selectedDefect);
    if (!defectDetails) return;

    const defectExists = defectsByPc[pc].some(d => d.defectId === defect.selectedDefect && d.id !== defect.id);
    if (defectExists) {
      Swal.fire('Duplicate', 'This defect has already been added.', 'error');
      return;
    }
  
    setDefectsByPc(prev => ({
      ...prev,
      [pc]: prev[pc].map(d => 
        d.id === defect.id
          ? { ...d, defectId: defectDetails._id }
          : d
      ),
    }));
  };

  const handleAddDefectCard = (pc) => {
    setDefectsByPc(prev => ({
      ...prev,
      [pc]: [
        ...(prev[pc] || []),
        {
          id: (prev[pc]?.length || 0) + 1,
          selectedDefect: '',
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
      [(Object.keys(prev).length || 0) + 1]: [{ id: 1, selectedDefect: '', defectQty: 1,  defectImages: [], isBodyVisible: true }],
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
        [pc]: prev[pc].map(d => d.id === defectId ? { ...d, [field]: value } : d)
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
                className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
               />
            </div>
            <div className="flex items-center space-x-4">
              <label className="w-28 text-sm font-medium dark:text-gray-300">Checked Qty:</label>
              <input 
                type="text" 
                value={formData.checkedQty || ''}
                readOnly={formData.daily === "Inline" || formData.firstOutput === "First Output"}
                className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder={
                  formData.firstOutput === "First Output"
                    ? "Auto-fetched for First Output"
                    : "Auto-calculated when Inline is selected"
                }
              />
            </div>
           
            {/* AQL Information Display */}
         {((formData.inline === 'Inline' || formData.daily === 'Inline') || formData.firstOutput === "First Output") && 
           (formData.aqlSampleSize || formData.aqlAcceptedDefect || formData.aqlRejectedDefect) && (
            <div className="md:col-span-2 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                AQL Information (Level II, AQL {formData.aqlLevelUsed || 'N/A'})
              </h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Sample Size:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-200">{formData.aqlSampleSize || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Accepted Defect:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-200">{formData.aqlAcceptedDefect || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Rejected Defect:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-200">{formData.aqlRejectedDefect || 'N/A'}</span>
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
                className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
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
                      className="absolute top-2 right-2 p-1 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white"
                      aria-label={`Remove Defect ${defect.id} for PC ${pc}`}
                    >
                      <Trash2 size={16} />
                    </button>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                      PC {pc} 
                    </h4>
                    <button
                        onClick={() => handleToggleVisibility(pc, defect.id)}
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title={defect.isBodyVisible ? "Hide Details" : "Show Details"}
                        style={{position:'absolute',right:'30px',top:'10px'}}
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
                          className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        >
                          <option value="">-- Select a defect --</option>
                          {defectOptions.map(d => (
                            <option key={d._id} value={d.defectName}>
                              {getDefectNameForDisplay(d)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full md:w-40">
                        <label className="text-xs font-medium dark:text-gray-300">Quantity</label>
                      <div className="flex items-center space-x-2">
                          <button onClick={() => handleDefectChange(pc, defect.id, 'defectQty', Math.max(0, (parseInt(defect.defectQty, 10) || 1) - 1))} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
                           <Minus size={16} />
                         </button>
                          <input
                          min="0"
                          value={defect.defectQty}
                          onChange={(e) => {
                            const newValue = Math.max(0, parseInt(e.target.value, 10) || 0);
                            handleDefectChange(pc, defect.id, 'defectQty', newValue);
                          }}
                          className="w-full  border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 text-center"
                          placeholder="Qty"
                        />
                          <button onClick={() => handleDefectChange(pc, defect.id, 'defectQty', (parseInt(defect.defectQty, 10) || 0) + 1)} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
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
                          className="flex items-center px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                          <Upload  size={18} className="mr-2" />Upload
                        </button>
                         <input
                          type="file"
                          multiple
                          accept="image/*"
                         id={`image-input-${pc}-${defect.id}`}
                          onChange={(e) => handleDefectImageChange(pc, defect.id, e)}
                          className="hidden"
                        />
                         <button
                          // onClick={capture}
                          className="flex items-center px-4 py-2 bg-blue-200 rounded-md hover:bg-blue-300"
                        >
                          <Camera size={18} className="mr-2" />Capture
                        </button>
                       
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {(defect.defectImages || []).length} / 5 selected
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {(defect.defectImages || []).map((image, index) => (
                          <div key={index} className="relative">
                             <img
                                  src={image.preview || image}
                                  alt={image.name}
                                  className="w-full h-24 object-cover rounded-md shadow-md dark:shadow-none cursor-pointer"
                                  onClick={() => {
                                    Swal.fire({
                                      imageUrl: image.preview || image,
                                      imageAlt: image.name,
                                      imageWidth: 600,
                                      imageHeight: 400,
                                    });
                                  }}
                                />
                          
                            <button
                              onClick={() => handleRemoveDefectImage(pc, defect.id, index)}
                              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
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
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-white"
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
              <button onClick={() => imageInputRef.current.click()} className="flex items-center px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
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
                  // onClick={capture}
                  className="flex items-center px-4 py-2 bg-blue-200 rounded-md hover:bg-blue-300"
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
                          src={image.preview || image}
                          alt={image.name}
                          className="w-full h-24 object-cover rounded-md shadow-md dark:shadow-none cursor-pointer"
                          onClick={() => {
                            Swal.fire({
                              imageUrl: image.preview || image,
                              imageAlt: image.name,
                              imageWidth: 600,
                              imageHeight: 400,
                            });
                          }}
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
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
            <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows="4" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"></textarea>
          </div>


        </div>
      )}
    </div>
  );
};

export default DefectDetailsSection;