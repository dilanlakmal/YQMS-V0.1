import React, { useState } from 'react';
import ImageUpload from './ImageUpload';

const ImageUploadTest = () => {
  const [defectImages, setDefectImages] = useState([]);
  const [measurementImages, setMeasurementImages] = useState([]);
  const [accessoryImages, setAccessoryImages] = useState([]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-center">Image Upload Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Defect Images</h2>
          <ImageUpload
            images={defectImages}
            onImagesChange={setDefectImages}
            uploadEndpoint="/api/roving-pairing/upload-defect-images"
            maxImages={5}
            type="defect"
          />
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Measurement Images</h2>
          <ImageUpload
            images={measurementImages}
            onImagesChange={setMeasurementImages}
            uploadEndpoint="/api/roving-pairing/upload-measurement-images"
            maxImages={5}
            type="measurement"
          />
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Accessory Images</h2>
          <ImageUpload
            images={accessoryImages}
            onImagesChange={setAccessoryImages}
            uploadEndpoint="/api/roving-pairing/upload-accessory-images"
            maxImages={5}
            type="accessory"
          />
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Current State:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Defect Images:</strong>
            <pre className="mt-1 text-xs">{JSON.stringify(defectImages, null, 2)}</pre>
          </div>
          <div>
            <strong>Measurement Images:</strong>
            <pre className="mt-1 text-xs">{JSON.stringify(measurementImages, null, 2)}</pre>
          </div>
          <div>
            <strong>Accessory Images:</strong>
            <pre className="mt-1 text-xs">{JSON.stringify(accessoryImages, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadTest;