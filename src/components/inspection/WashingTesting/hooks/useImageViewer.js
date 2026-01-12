import { useState, useCallback } from "react";
import { normalizeImageUrl, getImageFilename } from "../utils";
import showToast from "../../../../utils/toast";

/**
 * Custom hook for managing image viewer state and operations
 */
export const useImageViewer = () => {
  // Load saved rotations from localStorage on mount
  const [savedImageRotations, setSavedImageRotations] = useState(() => {
    try {
      const saved = localStorage.getItem("washingMachineImageRotations");
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("Error loading saved rotations from localStorage:", error);
      return {};
    }
  });

  const [imageViewer, setImageViewer] = useState({
    isOpen: false,
    imageUrl: null,
    imageTitle: null,
    images: [], // Array of all images in the group
    currentIndex: 0, // Current image index in the group
    rotation: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
  });

  // Open image viewer modal
  // Can accept: (imageUrl, imageTitle) or (imageUrl, imageTitle, images, currentIndex)
  const openImageViewer = useCallback(
    (imageUrl, imageTitle = null, images = null, currentIndex = 0) => {
      const normalizedUrl = normalizeImageUrl(imageUrl);
      // Load saved rotation for this image, or default to 0
      const savedRotation = savedImageRotations[normalizedUrl] || 0;
      const title = imageTitle || getImageFilename(normalizedUrl);

      // If images array is provided, normalize all URLs
      const normalizedImages = images
        ? images.map((url) => normalizeImageUrl(url))
        : [normalizedUrl];
      const index = images ? currentIndex : 0;

      setImageViewer({
        isOpen: true,
        imageUrl: normalizedUrl,
        imageTitle: title,
        images: normalizedImages,
        currentIndex: index,
        rotation: savedRotation,
        zoom: 1,
        panX: 0,
        panY: 0,
        isDragging: false,
        dragStart: { x: 0, y: 0 },
      });
    },
    [savedImageRotations]
  );

  // Close image viewer modal
  const closeImageViewer = useCallback(() => {
    setImageViewer({
      isOpen: false,
      imageUrl: null,
      imageTitle: null,
      images: [],
      currentIndex: 0,
      rotation: 0,
      zoom: 1,
      panX: 0,
      panY: 0,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
    });
  }, []);

  // Navigate to next image in group
  const goToNextImage = useCallback(() => {
    setImageViewer((prev) => {
      if (prev.images.length <= 1) return prev;

      const nextIndex = (prev.currentIndex + 1) % prev.images.length;
      const nextImageUrl = prev.images[nextIndex];
      const savedRotation = savedImageRotations[nextImageUrl] || 0;
      const title = getImageFilename(nextImageUrl);

      return {
        ...prev,
        currentIndex: nextIndex,
        imageUrl: nextImageUrl,
        imageTitle: title,
        rotation: savedRotation,
        zoom: 1, // Reset zoom when changing images
        panX: 0,
        panY: 0,
      };
    });
  }, [savedImageRotations]);

  // Navigate to previous image in group
  const goToPreviousImage = useCallback(() => {
    setImageViewer((prev) => {
      if (prev.images.length <= 1) return prev;

      const prevIndex =
        (prev.currentIndex - 1 + prev.images.length) % prev.images.length;
      const prevImageUrl = prev.images[prevIndex];
      const savedRotation = savedImageRotations[prevImageUrl] || 0;
      const title = getImageFilename(prevImageUrl);

      return {
        ...prev,
        currentIndex: prevIndex,
        imageUrl: prevImageUrl,
        imageTitle: title,
        rotation: savedRotation,
        zoom: 1, // Reset zoom when changing images
        panX: 0,
        panY: 0,
      };
    });
  }, [savedImageRotations]);

  // Rotate image in viewer (reset zoom and pan on rotation, save rotation)
  const rotateImageViewer = useCallback((direction = "ccw") => {
    setImageViewer((prev) => {
      const rotationStep = direction === "cw" ? 90 : -90;
      const newRotation = (prev.rotation + rotationStep) % 360;

      // Save rotation for this image URL
      if (prev.imageUrl) {
        setSavedImageRotations((rotations) => {
          const updatedRotations = {
            ...rotations,
            [prev.imageUrl]: newRotation,
          };

          // Save to localStorage
          try {
            localStorage.setItem(
              "washingMachineImageRotations",
              JSON.stringify(updatedRotations)
            );
          } catch (error) {
            console.error("Error saving rotations to localStorage:", error);
          }

          return updatedRotations;
        });
      }

      return {
        ...prev,
        rotation: newRotation,
        zoom: 1,
        panX: 0,
        panY: 0,
      };
    });
  }, []);

  // Zoom image in viewer
  const zoomImageViewer = useCallback((delta) => {
    setImageViewer((prev) => {
      const newZoom = Math.max(1, Math.min(5, prev.zoom + delta));
      // Reset pan when zooming out to 1x
      if (newZoom === 1) {
        return { ...prev, zoom: newZoom, panX: 0, panY: 0 };
      }
      return { ...prev, zoom: newZoom };
    });
  }, []);

  // Toggle zoom (Telegram-like: click to zoom in/out)
  const toggleZoom = useCallback(() => {
    setImageViewer((prev) => {
      if (prev.zoom > 1) {
        return { ...prev, zoom: 1, panX: 0, panY: 0 };
      } else {
        return { ...prev, zoom: 2 };
      }
    });
  }, []);

  // Handle mouse down for dragging
  const handleImageMouseDown = useCallback(
    (e) => {
      if (imageViewer.zoom > 1) {
        setImageViewer((prev) => ({
          ...prev,
          isDragging: true,
          dragStart: { x: e.clientX - prev.panX, y: e.clientY - prev.panY },
        }));
      } else {
        toggleZoom();
      }
    },
    [imageViewer.zoom, toggleZoom]
  );

  // Handle mouse move for dragging
  const handleImageMouseMove = useCallback(
    (e) => {
      if (imageViewer.isDragging && imageViewer.zoom > 1) {
        const newPanX = e.clientX - imageViewer.dragStart.x;
        const newPanY = e.clientY - imageViewer.dragStart.y;

        // Constrain panning to reasonable bounds
        const maxPan = 500;
        const constrainedPanX = Math.max(-maxPan, Math.min(maxPan, newPanX));
        const constrainedPanY = Math.max(-maxPan, Math.min(maxPan, newPanY));

        setImageViewer((prev) => ({
          ...prev,
          panX: constrainedPanX,
          panY: constrainedPanY,
        }));
      }
    },
    [imageViewer.isDragging, imageViewer.zoom, imageViewer.dragStart]
  );

  // Handle mouse up
  const handleImageMouseUp = useCallback(() => {
    setImageViewer((prev) => ({ ...prev, isDragging: false }));
  }, []);

  // Handle pan move (for touch events)
  const handlePanMove = useCallback(({ panX, panY }) => {
    setImageViewer((prev) => ({
      ...prev,
      panX,
      panY,
    }));
  }, []);

  // Download image from viewer (convert to JPG)
  const downloadImageViewer = useCallback(async () => {
    try {
      // Create an image element to load the image
      const img = new Image();
      img.crossOrigin = "anonymous";

      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageViewer.imageUrl;
      });

      // Create canvas to convert to JPG
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Calculate canvas dimensions based on rotation
      let canvasWidth = img.width;
      let canvasHeight = img.height;

      // If rotated 90 or 270 degrees, swap dimensions
      if (
        imageViewer.rotation === 90 ||
        imageViewer.rotation === 270 ||
        imageViewer.rotation === -90 ||
        imageViewer.rotation === -270
      ) {
        canvasWidth = img.height;
        canvasHeight = img.width;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Fill white background (JPG doesn't support transparency)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply rotation if any
      if (imageViewer.rotation !== 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((imageViewer.rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
      } else {
        ctx.drawImage(img, 0, 0);
      }

      // Convert canvas to JPG blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            showToast.error("Failed to convert image to JPG.");
            return;
          }

          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;

          // Extract filename from URL and change extension to .jpg
          const urlParts = imageViewer.imageUrl.split("/");
          let filename = urlParts[urlParts.length - 1] || "image";
          filename = filename.replace(/\.[^/.]+$/, "") + ".jpg";
          link.download = filename;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          showToast.success("Image downloaded as JPG successfully!");
        },
        "image/jpeg",
        0.95
      );
    } catch (error) {
      console.error("Error downloading image:", error);
      showToast.error("Failed to download image. Please try again.");
    }
  }, [imageViewer.imageUrl, imageViewer.rotation]);

  return {
    imageViewer,
    savedImageRotations,
    openImageViewer,
    closeImageViewer,
    goToNextImage,
    goToPreviousImage,
    rotateImageViewer,
    zoomImageViewer,
    toggleZoom,
    handleImageMouseDown,
    handleImageMouseMove,
    handleImageMouseUp,
    handlePanMove,
    downloadImageViewer,
  };
};
