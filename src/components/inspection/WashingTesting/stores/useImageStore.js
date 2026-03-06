import { create } from "zustand";
import { normalizeImageUrl, getImageFilename } from "../utils";
import showToast from "../../../../utils/toast";

const defaultViewer = {
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
};

const loadSavedRotations = () => {
  try {
    const saved = localStorage.getItem("washingMachineImageRotations");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const useImageStore = create((set, get) => ({
  // ─── Image rotation state (form / received / completion / report) ──
  imageRotations: {},
  receivedImageRotations: {},
  completionImageRotations: {},
  reportImageRotations: {},

  setImageRotations: (v) =>
    set({
      imageRotations: typeof v === "function" ? v(get().imageRotations) : v,
    }),
  setReceivedImageRotations: (v) =>
    set({
      receivedImageRotations:
        typeof v === "function" ? v(get().receivedImageRotations) : v,
    }),
  setCompletionImageRotations: (v) =>
    set({
      completionImageRotations:
        typeof v === "function" ? v(get().completionImageRotations) : v,
    }),

  // ─── Saved rotations (persisted to localStorage) ──────────────────
  savedImageRotations: loadSavedRotations(),

  // ─── Image viewer state ───────────────────────────────────────────
  imageViewer: { ...defaultViewer },

  // ─── Image validation ─────────────────────────────────────────────
  validateImageFile: (file) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const isValidType = allowedTypes.includes(file.type.toLowerCase());
    const hasValidExtension = allowedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext),
    );
    if (!isValidType && !hasValidExtension) {
      showToast.error(
        `Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`,
      );
      return false;
    }
    return true;
  },

  handleImageUpload: (files, setImages) => {
    if (!files || files.length === 0) return;
    const { validateImageFile } = get();
    Array.from(files).forEach((file) => {
      if (validateImageFile(file)) {
        setImages((prev) => [...prev, file]);
      }
    });
  },

  handleRemoveImage: (
    index,
    images,
    setImages,
    rotationState,
    setRotationState,
  ) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (setRotationState) {
      setRotationState((prev) => {
        const newRotations = { ...prev };
        delete newRotations[index];
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
  },

  // ─── Rotation helpers ─────────────────────────────────────────────
  _rotateImage: (index, direction, field) => {
    set((s) => {
      const current = s[field][index] || 0;
      const step = direction === "cw" ? 90 : -90;
      return { [field]: { ...s[field], [index]: (current + step) % 360 } };
    });
  },

  rotateFormImage: (index, direction = "cw") =>
    get()._rotateImage(index, direction, "imageRotations"),
  rotateReceivedImage: (index, direction = "cw") =>
    get()._rotateImage(index, direction, "receivedImageRotations"),
  rotateCompletionImage: (index, direction = "cw") =>
    get()._rotateImage(index, direction, "completionImageRotations"),

  rotateReportImage: (reportId, imageKey, direction = "cw") => {
    const key = `${reportId}_${imageKey}`;
    set((s) => {
      const current = s.reportImageRotations[key] || 0;
      const step = direction === "cw" ? 90 : -90;
      return {
        reportImageRotations: {
          ...s.reportImageRotations,
          [key]: (current + step) % 360,
        },
      };
    });
  },

  // ─── Image viewer actions ─────────────────────────────────────────
  openImageViewer: (
    imageUrl,
    imageTitle = null,
    images = null,
    currentIndex = 0,
  ) => {
    const normalizedUrl = normalizeImageUrl(imageUrl);
    const { savedImageRotations } = get();
    const savedRotation = savedImageRotations[normalizedUrl] || 0;
    const title = imageTitle || getImageFilename(normalizedUrl);
    const normalizedImages = images
      ? images.map((url) => normalizeImageUrl(url))
      : [normalizedUrl];
    const idx = images ? currentIndex : 0;

    set({
      imageViewer: {
        isOpen: true,
        imageUrl: normalizedUrl,
        imageTitle: title,
        images: normalizedImages,
        currentIndex: idx,
        rotation: savedRotation,
        zoom: 1,
        panX: 0,
        panY: 0,
        isDragging: false,
        dragStart: { x: 0, y: 0 },
      },
    });
  },

  closeImageViewer: () => set({ imageViewer: { ...defaultViewer } }),

  goToNextImage: () => {
    set((s) => {
      const v = s.imageViewer;
      if (v.images.length <= 1) return s;
      const nextIndex = (v.currentIndex + 1) % v.images.length;
      const nextUrl = v.images[nextIndex];
      const savedRotation = s.savedImageRotations[nextUrl] || 0;
      return {
        imageViewer: {
          ...v,
          currentIndex: nextIndex,
          imageUrl: nextUrl,
          imageTitle: getImageFilename(nextUrl),
          rotation: savedRotation,
          zoom: 1,
          panX: 0,
          panY: 0,
        },
      };
    });
  },

  goToPreviousImage: () => {
    set((s) => {
      const v = s.imageViewer;
      if (v.images.length <= 1) return s;
      const prevIndex =
        (v.currentIndex - 1 + v.images.length) % v.images.length;
      const prevUrl = v.images[prevIndex];
      const savedRotation = s.savedImageRotations[prevUrl] || 0;
      return {
        imageViewer: {
          ...v,
          currentIndex: prevIndex,
          imageUrl: prevUrl,
          imageTitle: getImageFilename(prevUrl),
          rotation: savedRotation,
          zoom: 1,
          panX: 0,
          panY: 0,
        },
      };
    });
  },

  rotateImageViewer: (direction = "ccw") => {
    set((s) => {
      const v = s.imageViewer;
      const step = direction === "cw" ? 90 : -90;
      const newRotation = (v.rotation + step) % 360;

      let updatedSaved = s.savedImageRotations;
      if (v.imageUrl) {
        updatedSaved = { ...s.savedImageRotations, [v.imageUrl]: newRotation };
        try {
          localStorage.setItem(
            "washingMachineImageRotations",
            JSON.stringify(updatedSaved),
          );
        } catch (error) {
          console.error("Error saving rotations to localStorage:", error);
        }
      }

      return {
        savedImageRotations: updatedSaved,
        imageViewer: { ...v, rotation: newRotation, zoom: 1, panX: 0, panY: 0 },
      };
    });
  },

  zoomImageViewer: (delta) => {
    set((s) => {
      const v = s.imageViewer;
      const newZoom = Math.max(1, Math.min(5, v.zoom + delta));
      if (newZoom === 1) {
        return { imageViewer: { ...v, zoom: 1, panX: 0, panY: 0 } };
      }
      return { imageViewer: { ...v, zoom: newZoom } };
    });
  },

  toggleZoom: () => {
    set((s) => {
      const v = s.imageViewer;
      if (v.zoom > 1) {
        return { imageViewer: { ...v, zoom: 1, panX: 0, panY: 0 } };
      }
      return { imageViewer: { ...v, zoom: 2 } };
    });
  },

  handleImageMouseDown: (e) => {
    const { imageViewer, toggleZoom } = get();
    if (imageViewer.zoom > 1) {
      set((s) => ({
        imageViewer: {
          ...s.imageViewer,
          isDragging: true,
          dragStart: {
            x: e.clientX - s.imageViewer.panX,
            y: e.clientY - s.imageViewer.panY,
          },
        },
      }));
    } else {
      toggleZoom();
    }
  },

  handleImageMouseMove: (e) => {
    const { imageViewer } = get();
    if (imageViewer.isDragging && imageViewer.zoom > 1) {
      const newPanX = e.clientX - imageViewer.dragStart.x;
      const newPanY = e.clientY - imageViewer.dragStart.y;
      const maxPan = 500;
      set((s) => ({
        imageViewer: {
          ...s.imageViewer,
          panX: Math.max(-maxPan, Math.min(maxPan, newPanX)),
          panY: Math.max(-maxPan, Math.min(maxPan, newPanY)),
        },
      }));
    }
  },

  handleImageMouseUp: () => {
    set((s) => ({ imageViewer: { ...s.imageViewer, isDragging: false } }));
  },

  handlePanMove: ({ panX, panY }) => {
    set((s) => ({ imageViewer: { ...s.imageViewer, panX, panY } }));
  },

  downloadImageViewer: async () => {
    const { imageViewer } = get();
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageViewer.imageUrl;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let canvasWidth = img.width;
      let canvasHeight = img.height;

      if ([90, 270, -90, -270].includes(imageViewer.rotation)) {
        canvasWidth = img.height;
        canvasHeight = img.width;
      }
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (imageViewer.rotation !== 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((imageViewer.rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
      } else {
        ctx.drawImage(img, 0, 0);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            showToast.error("Failed to convert image to JPG.");
            return;
          }
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
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
        0.95,
      );
    } catch (error) {
      console.error("Error downloading image:", error);
      showToast.error("Failed to download image. Please try again.");
    }
  },
}));
