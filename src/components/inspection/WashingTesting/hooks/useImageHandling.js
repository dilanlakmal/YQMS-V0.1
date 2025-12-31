import { useState, useCallback } from "react";
import showToast from "../../../../utils/toast";

/**
 * Custom hook for image handling (upload, rotation, removal)
 */
export const useImageHandling = () => {
  const [imageRotations, setImageRotations] = useState({});
  const [receivedImageRotations, setReceivedImageRotations] = useState({});
  const [completionImageRotations, setCompletionImageRotations] = useState({});
  const [reportImageRotations, setReportImageRotations] = useState({});

  // Validate image file
  const validateImageFile = useCallback((file) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    const isValidType = allowedTypes.includes(file.type.toLowerCase());
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidType && !hasValidExtension) {
      showToast.error(`Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`);
      return false;
    }

    return true;
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback((files, setImages) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (validateImageFile(file)) {
        setImages((prev) => [...prev, file]);
      }
    });
  }, [validateImageFile]);

  // Handle image remove
  const handleRemoveImage = useCallback((index, images, setImages, rotationState, setRotationState) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    
    // Clean up rotation state
    if (setRotationState) {
      setRotationState((prev) => {
        const newRotations = { ...prev };
        delete newRotations[index];
        // Shift rotations for images after the removed one
        Object.keys(newRotations).forEach((key) => {
          const keyIndex = parseInt(key);
          if (keyIndex > index) {
            newRotations[keyIndex - 1] = newRotations[keyIndex];
            delete newRotations[keyIndex];
          }
        });
        return newRotations;
      });
    }
  }, []);

  // Rotate image
  const rotateImage = useCallback((index, direction, rotationState, setRotationState) => {
    if (!setRotationState) return;
    
    setRotationState((prev) => {
      const currentRotation = prev[index] || 0;
      const rotationStep = direction === 'cw' ? 90 : -90;
      const newRotation = (currentRotation + rotationStep) % 360;
      return { ...prev, [index]: newRotation };
    });
  }, []);

  // Rotate form image
  const rotateFormImage = useCallback((index, direction = 'cw') => {
    rotateImage(index, direction, imageRotations, setImageRotations);
  }, [rotateImage, imageRotations]);

  // Rotate received image
  const rotateReceivedImage = useCallback((index, direction = 'cw') => {
    rotateImage(index, direction, receivedImageRotations, setReceivedImageRotations);
  }, [rotateImage, receivedImageRotations]);

  // Rotate completion image
  const rotateCompletionImage = useCallback((index, direction = 'cw') => {
    rotateImage(index, direction, completionImageRotations, setCompletionImageRotations);
  }, [rotateImage, completionImageRotations]);

  // Rotate report image (view-only)
  const rotateReportImage = useCallback((reportId, imageKey, direction = 'cw') => {
    const key = `${reportId}_${imageKey}`;
    setReportImageRotations((prev) => {
      const currentRotation = prev[key] || 0;
      const rotationStep = direction === 'cw' ? 90 : -90;
      const newRotation = (currentRotation + rotationStep) % 360;
      return { ...prev, [key]: newRotation };
    });
  }, []);

  return {
    imageRotations,
    receivedImageRotations,
    completionImageRotations,
    reportImageRotations,
    setImageRotations,
    setReceivedImageRotations,
    setCompletionImageRotations,
    validateImageFile,
    handleImageUpload,
    handleRemoveImage,
    rotateFormImage,
    rotateReceivedImage,
    rotateCompletionImage,
    rotateReportImage,
  };
};

