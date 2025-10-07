import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Eye } from 'lucide-react';
import { API_BASE_URL } from '../../../../config';

const ImageUpload = ({ 
  images = [], 
  onImagesChange, 
  uploadEndpoint, 
  maxImages = 5,
  type = 'defect' // defect, measurement, accessory
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`${API_BASE_URL}${uploadEndpoint}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        const newImages = [...images, ...result.images];
        onImagesChange(newImages);
      } else {
        alert('Failed to upload images: ' + result.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (index) => {
    const imageToRemove = images[index];
    
    try {
      // Delete from server
      await fetch(`${API_BASE_URL}/api/roving-pairing/delete-image`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imagePath: imageToRemove })
      });

      // Remove from local state
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
    } catch (error) {
      console.error('Error deleting image:', error);
      // Still remove from local state even if server deletion fails
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'defect': return 'Defect';
      case 'measurement': return 'Measurement';
      case 'accessory': return 'Accessory';
      default: return 'Image';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'defect': return 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400';
      case 'measurement': return 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400';
      case 'accessory': return 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400';
      default: return 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-400';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">
          {getTypeLabel()} Images ({images.length}/{maxImages})
        </h4>
      </div>
      
      {/* Upload Options */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* File Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className={`p-3 rounded-lg border-2 border-dashed transition-all duration-200 flex flex-col items-center gap-2 ${getTypeColor()} disabled:opacity-50 hover:scale-105`}
        >
          <Upload size={24} />
          <span className="text-sm font-medium">Upload</span>
          <span className="text-xs opacity-75">From Gallery</span>
        </button>
        
        {/* Camera Capture Button */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className={`p-3 rounded-lg border-2 border-dashed transition-all duration-200 flex flex-col items-center gap-2 ${getTypeColor()} disabled:opacity-50 hover:scale-105`}
        >
          <Camera size={24} />
          <span className="text-sm font-medium">Camera</span>
          <span className="text-xs opacity-75">Take Photo</span>
        </button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={`${API_BASE_URL}${image}`}
                alt={`${getTypeLabel()} ${index + 1}`}
                className="w-full h-20 object-cover rounded-md border cursor-pointer"
                onClick={() => setPreviewImage(`${API_BASE_URL}${image}`)}
              />
              
              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
              
              {/* Preview Button */}
              <button
                type="button"
                onClick={() => setPreviewImage(`${API_BASE_URL}${image}`)}
                className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Eye size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-600 mt-2">Uploading images...</p>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-4xl p-4">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;