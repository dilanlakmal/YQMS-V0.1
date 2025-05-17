import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config'; 
import { Camera, Upload, XCircle, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

const ImageCaptureUpload = ({
  imageType, // 'spi' or 'measurement'
  maxImages = 5,
  onImageFilesChange, // (files: File[]) => void
  inspectionData, 
}) => {
  const { t } = useTranslation();
  const [imageFiles, setImageFiles] = useState([]); // Stores File objects
  const [previewUrls, setPreviewUrls] = useState([]); // Stores blob URLs for preview
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  // const captureInputRef = useRef(null); // Capture functionality can be added similarly if needed
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  // Effect to clear images if the context (inspectionData) changes
  useEffect(() => {
    console.log(`ImageCaptureUpload (${imageType}): useEffect triggered due to inspectionData/imageType change. Resetting images. InspectionData:`, JSON.stringify(inspectionData));
    // Revoke existing blob URLs before clearing
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setImageFiles([]);
    setPreviewUrls([]);
    if (onImageFilesChange) {
      onImageFilesChange([]);
    }
    setError('');
    setShowPreviewModal(false);
    setPreviewImageUrl('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionData.date, inspectionData.lineNo, inspectionData.moNo, inspectionData.operationId, imageType, onImageFilesChange]);

  // Cleanup blob URLs on component unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    console.log(`ImageCaptureUpload (${imageType}): handleFileChange called. Current local imageFiles.length: ${imageFiles.length}, Files selected: ${files.length}`);
    if (files.length === 0) return;

    if (imageFiles.length >= maxImages) {
      console.warn(`ImageCaptureUpload (${imageType}): Max images (${maxImages}) reached or exceeded. Current count: ${imageFiles.length}.`);
      Swal.fire(t('qcRoving.imageUpload.limitTitle'), t('qcRoving.imageUpload.maxImagesReached', { max: maxImages, current: imageFiles.length }), 'warning');
      return;
    }
    
    setError('');
    setIsUploading(true); // Indicate processing

    const newImageFiles = [...imageFiles];
    const newPreviewUrls = [...previewUrls];
    let filesAddedCount = 0;

    for (const file of files) {
      if (newImageFiles.length >= maxImages) {
       Swal.fire(t('qcRoving.imageUpload.limitTitle'), t('qcRoving.imageUpload.maxImagesReachedSome', { max: maxImages, uploaded: newImageFiles.length, attempting: files.length - filesAddedCount }), 'warning');
        break; // Stop processing if limit reached during loop
      }
      newImageFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
      filesAddedCount++;
    }
    setImageFiles(newImageFiles);
    setPreviewUrls(newPreviewUrls);
    if (onImageFilesChange) {
      onImageFilesChange(newImageFiles);
    }
    setIsUploading(false);
    if (event.target) event.target.value = null; // Clear file input
  };

  const handleDeleteImage = (indexToDelete) => {
    Swal.fire({
      title: t('qcRoving.imageUpload.confirmDeleteTitle'),
      text: t('qcRoving.imageUpload.confirmDeleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('qcRoving.imageUpload.confirmDeleteButton'),
      cancelButtonText: t('qcRoving.buttons.cancel'),
    }).then((result) => {
      if (result.isConfirmed) {
        // Revoke the blob URL for the image being deleted
        URL.revokeObjectURL(previewUrls[indexToDelete]);

        const updatedFiles = imageFiles.filter((_, index) => index !== indexToDelete);
        const updatedPreviewUrls = previewUrls.filter((_, index) => index !== indexToDelete);
        
        setImageFiles(updatedFiles);
        setPreviewUrls(updatedPreviewUrls);

        if (onImageFilesChange) {
          onImageFilesChange(updatedFiles);
        }
        setError('');
      }
    });
  };
  const triggerFileUpload = () => fileInputRef.current?.click();

  const openImagePreview = (url) => {
    setPreviewImageUrl(url);
    setShowPreviewModal(true);
  };
  const closeImagePreview = () => {
    setShowPreviewModal(false);
    setPreviewImageUrl('');
  };
  
  const isContextDataComplete = inspectionData.date &&
                             inspectionData.lineNo && inspectionData.lineNo !== 'NA_Line' &&
                             inspectionData.moNo && inspectionData.moNo !== 'NA_MO' &&
                             inspectionData.operationId && inspectionData.operationId !== 'NA_Op';

   const canSelectFiles = !isUploading && imageFiles.length < maxImages && isContextDataComplete;

  return (
    <div className="border p-3 rounded-lg shadow-sm bg-gray-50">
      {!isContextDataComplete && (
         <div className="mb-2 p-2 text-xs bg-yellow-100 text-yellow-700 rounded-md flex items-center">
            <AlertTriangle size={16} className="mr-1 flex-shrink-0" />
            {t('qcRoving.imageUpload.fillRequiredFields')}
        </div>
      )}
      <div className="flex items-center space-x-2 mb-3">
        <button type="button" onClick={triggerFileUpload} disabled={!canSelectFiles}
          className="flex items-center px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs">
          <Upload size={16} className="mr-1" /> 
        </button>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
        
        <span className="text-xs text-gray-600 ml-auto">
          ({imageFiles.length}/{maxImages})
        </span>
      </div>

      {isUploading && <p className="text-xs text-blue-600 animate-pulse">{t('qcRoving.imageUpload.processing')}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      {previewUrls.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative group border rounded-md overflow-hidden shadow">
              <img 
                // src={`${API_BASE_URL}${path}`} // Old: using server path
                src={url} // New: using local blob URL
                alt={`${imageType} ${index + 1}`} 
                className="w-full h-20 object-cover cursor-pointer hover:opacity-75"
                onClick={() => openImagePreview(url)}
              />
              <button type="button" onClick={() => handleDeleteImage(index)}
                className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                aria-label={t('qcRoving.buttons.deleteImage')}>
                <XCircle size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Image Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70]"> {/* Higher z-index if needed */}
          <div className="bg-white p-4 rounded-lg shadow-xl max-w-3xl max-h-[90vh] relative">
            <button
              onClick={closeImagePreview}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-white rounded-full p-1 z-10"
            >
             <XCircle className="w-6 h-6" />
            </button>
            <img
              src={previewImageUrl}
              alt={t('qcRoving.imageUpload.previewAlt', 'Image Preview')}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCaptureUpload;