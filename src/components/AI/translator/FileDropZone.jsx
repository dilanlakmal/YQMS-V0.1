import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon } from '../translator/icon';

const FileDropzone = ({ onFileSelect }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (file && (file.type.startsWith('image/'))) {
      onFileSelect(file);
    } else {
      alert('Please upload a valid image file (PNG, JPG, etc.).');
    }
  }, [onFileSelect]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      className={`relative w-full max-w-2xl mx-auto border-2 border-dashed rounded-xl transition-colors duration-300 ${
        isDragActive 
          ? 'border-indigo-500 bg-gray-800' 
          : 'border-gray-600 hover:border-indigo-500 bg-gray-900'
      } p-12 text-center cursor-pointer`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
      />
      <div className="flex flex-col items-center justify-center space-y-4 text-gray-400">
        <UploadIcon className="w-16 h-16" />
        <p className="text-xl font-semibold">
          <span className="text-indigo-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-sm">PNG, JPG, or WEBP recommended</p>
      </div>
    </div>
  );
};

export default FileDropzone;
