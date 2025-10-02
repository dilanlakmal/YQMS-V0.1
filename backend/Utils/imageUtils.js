import { API_BASE_URL } from "../config.js";

export const convertImageToBase64 = async (imageUrl) => {
  try {
    // Handle relative URLs
    let fullUrl = imageUrl;
    if (imageUrl.startsWith('./public/storage/')) {
      const relativePath = imageUrl.replace('./public/storage/', 'storage/');
      fullUrl = `${API_BASE_URL}/${relativePath}`;
    } else if (imageUrl.startsWith('/storage/')) {
      fullUrl = `${API_BASE_URL}${imageUrl}`;
    }

    // Try to fetch with CORS handling
    const response = await fetch(fullUrl, {
      method: 'GET',
      mode: 'cors', // Enable CORS
      headers: {
        'Accept': 'image/*',
        'Origin': window.location.origin,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    
    // Try alternative method using canvas proxy
    try {
      return await convertImageViaCanvas(imageUrl);
    } catch (canvasError) {
      console.error('Canvas conversion also failed:', canvasError);
      return null;
    }
  }
};

// Alternative method using canvas (for CORS issues)
const convertImageViaCanvas = async (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    // Handle relative URLs
    let fullUrl = imageUrl;
    if (imageUrl.startsWith('./public/storage/')) {
      const relativePath = imageUrl.replace('./public/storage/', 'storage/');
      fullUrl = `${API_BASE_URL}/${relativePath}`;
    } else if (imageUrl.startsWith('/storage/')) {
      fullUrl = `${API_BASE_URL}${imageUrl}`;
    }
    
    img.src = fullUrl;
  });
};

export const processImagesInData = async (data) => {
  const processedData = JSON.parse(JSON.stringify(data)); // Deep clone
  
  console.log('🔄 Starting image processing...');
  
  // Process defect images
  if (processedData.defectDetails?.defectsByPc) {
    console.log('📸 Processing defect images...');
    for (const pcDefect of processedData.defectDetails.defectsByPc) {
      if (pcDefect.pcDefects) {
        for (const defect of pcDefect.pcDefects) {
          if (defect.defectImages) {
            for (let i = 0; i < defect.defectImages.length; i++) {
              const img = defect.defectImages[i];
              const originalUrl = img.originalUrl || img;
              if (originalUrl && typeof originalUrl === 'string') {
                console.log(`Converting defect image: ${originalUrl}`);
                const base64 = await convertImageToBase64(originalUrl);
                defect.defectImages[i] = base64 || { isPlaceholder: true, originalUrl };
              }
            }
          }
        }
      }
    }
  }

  // Process additional images
  if (processedData.defectDetails?.additionalImages) {
    console.log('📸 Processing additional images...');
    for (let i = 0; i < processedData.defectDetails.additionalImages.length; i++) {
      const img = processedData.defectDetails.additionalImages[i];
      const originalUrl = img.originalUrl || img;
      if (originalUrl && typeof originalUrl === 'string') {
        console.log(`Converting additional image: ${originalUrl}`);
        const base64 = await convertImageToBase64(originalUrl);
        processedData.defectDetails.additionalImages[i] = base64 || { isPlaceholder: true, originalUrl };
      }
    }
  }

  // Process inspection images
  if (processedData.inspectionDetails?.checkpointInspectionData) {
    console.log('📸 Processing inspection images...');
    for (const checkpoint of processedData.inspectionDetails.checkpointInspectionData) {
      // Main checkpoint images
      if (checkpoint.comparisonImages) {
        for (let i = 0; i < checkpoint.comparisonImages.length; i++) {
          console.log(`Converting checkpoint image: ${checkpoint.comparisonImages[i]}`);
          const base64 = await convertImageToBase64(checkpoint.comparisonImages[i]);
          checkpoint.comparisonImages[i] = base64 || { isPlaceholder: true, originalUrl: checkpoint.comparisonImages[i] };
        }
      }

      // Sub-point images
      if (checkpoint.subPoints) {
        for (const subPoint of checkpoint.subPoints) {
          if (subPoint.comparisonImages) {
            for (let i = 0; i < subPoint.comparisonImages.length; i++) {
              console.log(`Converting sub-point image: ${subPoint.comparisonImages[i]}`);
              const base64 = await convertImageToBase64(subPoint.comparisonImages[i]);
              subPoint.comparisonImages[i] = base64 || { isPlaceholder: true, originalUrl: subPoint.comparisonImages[i] };
            }
          }
        }
      }
    }
  }

  // Process machine images
  if (processedData.inspectionDetails?.machineProcesses) {
    console.log('📸 Processing machine images...');
    for (const machine of processedData.inspectionDetails.machineProcesses) {
      if (machine.image) {
        console.log(`Converting machine image: ${machine.image}`);
        const base64 = await convertImageToBase64(machine.image);
        machine.image = base64 || { isPlaceholder: true, originalUrl: machine.image };
      }
    }
  }

  // Process legacy inspection images
  if (processedData.inspectionDetails?.checkedPoints) {
    console.log('📸 Processing legacy inspection images...');
    for (const point of processedData.inspectionDetails.checkedPoints) {
      if (point.comparison) {
        for (let i = 0; i < point.comparison.length; i++) {
          console.log(`Converting legacy inspection image: ${point.comparison[i]}`);
          const base64 = await convertImageToBase64(point.comparison[i]);
          point.comparison[i] = base64 || { isPlaceholder: true, originalUrl: point.comparison[i] };
        }
      }
    }
  }

  console.log('✅ Image processing completed');
  return processedData;
};