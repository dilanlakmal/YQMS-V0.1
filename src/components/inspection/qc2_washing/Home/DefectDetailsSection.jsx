import React, { useRef } from "react";
import { Plus, Trash2, UploadCloud, X } from 'lucide-react';
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
  onToggle 
}) => {
  const imageInputRef = useRef(null);
  const { i18n } = useTranslation();


  const getDefectNameForDisplay = (d) => {
    if (!d) return "N/A";
    const lang = i18n.language;
    if (lang.startsWith("kh")) return d.khmer || d.english;
    if (lang.startsWith("ch") || lang.startsWith("zh"))
      return d.chinese || d.english;
    return d.english;
  };

  const totalDefects = addedDefects.reduce((sum, defect) => sum + defect.qty, 0);

  let defectStatus = 'N/A';
  let statusColorClass = 'bg-gray-100 text-gray-800';
  if ((formData.inline === 'Inline' || formData.daily === 'Inline' || formData.firstOutput === "First Output" || formData.daily === 'First Output') && formData.aqlAcceptedDefect) {
    const acceptedDefectCount = parseInt(formData.aqlAcceptedDefect, 10);
    if (!isNaN(acceptedDefectCount)) {
      if (totalDefects <= acceptedDefectCount) {
        defectStatus = 'Pass';
        statusColorClass = 'bg-green-100 text-green-800';
      } else {
        defectStatus = 'Fail';
        statusColorClass = 'bg-red-100 text-red-800';
      }
    }
  }

  const handleAddDefect = () => {
    if (!selectedDefect || !defectQty) {
      Swal.fire('Incomplete', 'Please select a defect and enter a quantity.', 'warning');
      return;
    }

    const defectExists = addedDefects.some(d => d.defectId === selectedDefect);
    if (defectExists) {
      Swal.fire('Duplicate', 'This defect has already been added.', 'error');
      return;
    }

    const defectDetails = defectOptions.find(d => d._id === selectedDefect);
    setAddedDefects(prev => [...prev, {
      defectId: defectDetails._id,
      defectName: defectDetails.english,
      qty: parseInt(defectQty, 10),
    }]);

    setSelectedDefect('');
    setDefectQty('');
  };

  const handleDeleteDefect = (defectId) => {
    setAddedDefects(prev => prev.filter(d => d.defectId !== defectId));
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
            <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">AQL Information (Level II, AQL 1.0)</h3>
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
                  <span className="font-medium text-blue-700">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${statusColorClass}`}>
                    {defectStatus}
                  </span>
                </div>
              </div>
            </div>
          )}
          </div>

          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
            <h3 className="text-md font-semibold mb-3 dark:text-white">Add Defect</h3>
            <div className="flex flex-col md:flex-row items-end gap-3">
              <div className="flex-grow w-full">
                <label className="text-xs font-medium dark:text-gray-300">Defect</label>
                <select
                  value={selectedDefect}
                  onChange={(e) => setSelectedDefect(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="">-- Select a defect --</option>
                  {defectOptions.map(defect => (
                    
                  <option key={defect._id} value={defect._id}>
                      {getDefectNameForDisplay(defect)}
                    </option>                  ))}
                </select> 

           </div>
              <div className="w-full md:w-40">
                <label className="text-xs font-medium dark:text-gray-300">Quantity</label>
                <input
                  type="number"
                  value={defectQty}
                  onChange={(e) => setDefectQty(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="Qty"
                />
              </div>
              <button 
                onClick={handleAddDefect}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 w-full md:w-auto"
              >
                <Plus size={18} className="mr-1" /> Add
              </button>
            </div>
          </div>

          {addedDefects.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr className="dark:bg-gray-700 dark:text-white">
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Defect Name</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">Quantity</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {addedDefects.map((defect, index) => (
                    <tr key={defect.defectId}>
                      <td className="border border-gray-300 px-4 py-2">{defect.defectName}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{defect.qty}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                        <button onClick={() => handleDeleteDefect(defect.defectId)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <h3 className="text-md font-semibold mb-2 dark:text-white">Upload Images (Max 5)</h3>
            <div className="flex items-center gap-4">
              <button onClick={() => imageInputRef.current.click()} className="flex items-center px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
                <UploadCloud size={18} className="mr-2" /> Choose Images
              </button>
              <input type="file" multiple accept="image/*" ref={imageInputRef} onChange={handleImageChange} className="hidden" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{uploadedImages.length} / 5 selected</span>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img src={image.preview} alt={image.name} className="w-full h-24 object-cover rounded-md shadow-md dark:shadow-none" />
                  <button onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
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