import React, { useRef, useEffect } from "react";
import {
  X,
  RotateCcw,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import showToast from "../../../../utils/toast";

const ImageViewerModal = ({
  isOpen,
  imageUrl,
  imageTitle,
  images = [],
  currentIndex = 0,
  rotation,
  zoom,
  panX,
  panY,
  isDragging,
  onClose,
  onRotate,
  onZoom,
  onPanStart,
  onPanMove,
  onPanEnd,
  onToggleZoom,
  onDownload,
  onNextImage,
  onPreviousImage,
}) => {
  const touchStartRef = useRef({ x: 0, y: 0, distance: 0, time: 0 });

  // Handle mouse down for dragging
  const handleImageMouseDown = (e) => {
    if (zoom > 1) {
      onPanStart(e);
    } else {
      // If not zoomed, toggle zoom on click
      onToggleZoom();
    }
  };

  // Handle double click to zoom
  const handleImageDoubleClick = () => {
    onToggleZoom();
  };

  // Touch support for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      // Single touch - prepare for panning
      if (zoom > 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX - panX,
          y: e.touches[0].clientY - panY,
          distance: 0,
          time: Date.now(),
        };
        onPanStart(e);
      } else {
        // Single tap - prepare for zoom toggle
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          distance: 0,
          time: Date.now(),
        };
      }
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchStartRef.current = {
        x: 0,
        y: 0,
        distance: distance,
        time: Date.now(),
      };
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();

    if (e.touches.length === 1 && zoom > 1) {
      // Single touch panning
      const newPanX = e.touches[0].clientX - touchStartRef.current.x;
      const newPanY = e.touches[0].clientY - touchStartRef.current.y;

      const maxPan = 500;
      const constrainedPanX = Math.max(-maxPan, Math.min(maxPan, newPanX));
      const constrainedPanY = Math.max(-maxPan, Math.min(maxPan, newPanY));

      onPanMove({ panX: constrainedPanX, panY: constrainedPanY });
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (touchStartRef.current.distance > 0) {
        const scale = distance / touchStartRef.current.distance;
        const newZoom = Math.max(1, Math.min(5, zoom * scale));
        onZoom(newZoom - zoom);
        touchStartRef.current.distance = distance;
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      // Check if it was a tap (quick touch)
      const touchDuration = Date.now() - touchStartRef.current.time;
      if (touchDuration < 300 && zoom === 1) {
        // Single tap - toggle zoom
        onToggleZoom();
      }

      onPanEnd();
      touchStartRef.current = { x: 0, y: 0, distance: 0, time: 0 };
    }
  };

  // Keyboard and wheel support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "+" || event.key === "=") {
        onZoom(0.5);
      } else if (event.key === "-") {
        onZoom(-0.5);
      } else if (event.key === "0") {
        onZoom(1 - zoom);
      } else if (event.key === "ArrowLeft" && images.length > 1) {
        onPreviousImage();
      } else if (event.key === "ArrowRight" && images.length > 1) {
        onNextImage();
      }
    };

    const handleWheel = (event) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.2 : 0.2;
      onZoom(delta);
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      document.body.style.overflow = "";
    };
  }, [
    isOpen,
    zoom,
    onClose,
    onZoom,
    images.length,
    onNextImage,
    onPreviousImage,
  ]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black z-[60] overflow-hidden"
      onClick={(e) => {
        // Only close if clicking the background, not the image
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onMouseMove={(e) => {
        if (isDragging && zoom > 1) {
          onPanMove(e);
        }
      }}
      onMouseUp={onPanEnd}
      onMouseLeave={onPanEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        touchAction: "none",
      }}
    >
      {/* Image Counter - Bottom Right (if multiple images) */}
      {images.length > 1 && (
        <div className="absolute bottom-0 right-0 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm z-20 pointer-events-none">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Close Button - Top Right */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full p-2.5 shadow-lg transition-all z-20"
        title="Close (ESC)"
      >
        <X size={20} />
      </button>

      {/* Image Title - Top Left */}
      {imageTitle && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm z-20 pointer-events-none">
          {imageTitle}
        </div>
      )}

      {/* Navigation Arrows - Left */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreviousImage();
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full p-3 shadow-lg transition-all z-20"
          title="Previous Image (←)"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Navigation Arrows - Right */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNextImage();
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full p-3 shadow-lg transition-all z-20"
          title="Next Image (→)"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Image Container - Centered with zoom and pan support */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        onDoubleClick={handleImageDoubleClick}
        style={{ touchAction: "none" }}
      >
        <div
          className="relative transition-transform duration-300 ease-out"
          style={{
            transform: `
              rotate(${rotation}deg) 
              scale(${zoom}) 
              translate(${panX / zoom}px, ${panY / zoom}px)
            `,
            transformOrigin: "center center",
            touchAction: "none",
          }}
          onMouseDown={handleImageMouseDown}
          onClick={(e) => {
            // Single click to toggle zoom (only if not dragging)
            if (!isDragging && zoom === 1) {
              e.stopPropagation();
              onToggleZoom();
            }
          }}
        >
          <img
            src={imageUrl}
            alt={imageTitle || "Image"}
            className="max-w-[90vw] max-h-[90vh] object-contain select-none"
            draggable={false}
            onError={(e) => {
              console.error("Image load error:", imageUrl);
              e.target.style.display = "none";
              const placeholder = document.createElement("div");
              placeholder.className =
                "text-white text-center p-8 bg-black/50 rounded-lg";
              placeholder.textContent = "Failed to load image";
              e.target.parentElement.appendChild(placeholder);
            }}
          />
        </div>
      </div>

      {/* Control Buttons - Bottom Center (Telegram Style) */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-2 z-20">
        {/* Zoom Out */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onZoom(-0.5);
          }}
          disabled={zoom <= 1}
          className="bg-transparent hover:bg-white/20 text-white rounded-full p-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Zoom Out"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>

        {/* Zoom Indicator */}
        <div className="flex items-center px-3 text-white text-sm">
          {Math.round(zoom * 100)}%
        </div>

        {/* Zoom In */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onZoom(0.5);
          }}
          disabled={zoom >= 5}
          className="bg-transparent hover:bg-white/20 text-white rounded-full p-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Zoom In"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>

        {/* Rotate Left */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRotate("ccw");
          }}
          className="bg-transparent hover:bg-white/20 text-white rounded-full p-2 transition-colors"
          title="Rotate Left"
        >
          <RotateCcw size={20} />
        </button>

        {/* Download Image */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="bg-transparent hover:bg-white/20 text-white rounded-full p-2 transition-colors"
          title="Download Image"
        >
          <Download size={20} />
        </button>
      </div>
    </div>
  );
};

export default ImageViewerModal;
