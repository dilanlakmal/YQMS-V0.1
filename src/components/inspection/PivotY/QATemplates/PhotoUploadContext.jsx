import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef
} from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config";

const PhotoUploadContext = createContext();

export const usePhotoUpload = () => useContext(PhotoUploadContext);

export const PhotoUploadProvider = ({ children, reportId }) => {
  // Queue: Array of { id, sectionId, itemNo, images, ... }
  const [uploadQueue, setUploadQueue] = useState([]);

  // Status: Map of `${sectionId}_${itemNo}` -> { status: 'pending'|'uploading'|'success'|'error', progress: 0, total: 0 }
  const [uploadStatus, setUploadStatus] = useState({});

  const isProcessingRef = useRef(false);

  // =========================================================
  // HELPER: Image Compression (Returns BLOB for low RAM usage)
  // =========================================================
  const compressToBlob = async (source, maxWidth = 1920, quality = 0.7) => {
    return new Promise((resolve) => {
      // Create an image object
      const img = new Image();

      // Handle File/Blob objects vs Base64/URL strings
      let src = "";
      let isObjectUrl = false;

      if (source instanceof Blob || source instanceof File) {
        src = URL.createObjectURL(source);
        isObjectUrl = true;
      } else {
        src = source;
      }

      img.src = src;

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        // Draw to canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Export as BLOB (Binary), NOT Base64
        canvas.toBlob(
          (blob) => {
            if (isObjectUrl) URL.revokeObjectURL(src); // Cleanup
            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        if (isObjectUrl) URL.revokeObjectURL(src);
        resolve(source); // Return original if compression fails
      };
    });
  };

  // =========================================================
  // ACTION: Add to Upload Queue
  // =========================================================
  const addToUploadQueue = useCallback(async (payload) => {
    const { sectionId, itemNo, images } = payload;
    const uniqueKey = `${sectionId}_${itemNo}`;

    // 1. Set Status to Compressing
    setUploadStatus((prev) => ({
      ...prev,
      [uniqueKey]: { status: "compressing", progress: 0, total: images.length }
    }));

    // 2. Compress Images
    const processedImages = await Promise.all(
      images.map(async (img) => {
        // A. If it's a Raw File or Edited Blob (from ImageEditor) -> Compress it
        if (img.file instanceof Blob || img.file instanceof File) {
          const compressedBlob = await compressToBlob(img.file);
          return { ...img, file: compressedBlob };
        }

        // B. If it's a new Base64 string (Legacy/Fallback) -> Compress to Blob
        if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
          const compressedBlob = await compressToBlob(img.imgSrc);
          return { ...img, file: compressedBlob };
        }

        // C. Existing URL -> Pass through
        return img;
      })
    );

    // 3. Add to Queue
    setUploadQueue((prev) => [
      ...prev,
      { ...payload, images: processedImages, uniqueKey }
    ]);

    // 4. Update Status to Queued
    setUploadStatus((prev) => ({
      ...prev,
      [uniqueKey]: { status: "queued", progress: 0, total: images.length }
    }));
  }, []);

  // =========================================================
  // WORKER: Process Queue (Hybrid: Multipart + JSON)
  // =========================================================

  useEffect(() => {
    const processQueue = async () => {
      if (isProcessingRef.current || uploadQueue.length === 0) return;

      isProcessingRef.current = true;
      const currentTask = uploadQueue[0];
      const {
        uniqueKey,
        reportId: taskReportId,
        sectionId,
        itemNo,
        images, // This contains the full list of images for this item
        sectionName,
        itemName,
        remarks
      } = currentTask;

      try {
        setUploadStatus((prev) => ({
          ...prev,
          [uniqueKey]: {
            status: "uploading",
            progress: 0,
            total: images.length
          }
        }));

        const targetReportId = taskReportId || reportId;
        if (!targetReportId) throw new Error("Report ID missing");

        // --- BUILD FORM DATA ---
        const formData = new FormData();
        formData.append("reportId", targetReportId);
        formData.append("sectionId", sectionId);
        formData.append("itemNo", itemNo);
        if (sectionName) formData.append("sectionName", sectionName);
        if (itemName) formData.append("itemName", itemName);
        if (remarks) formData.append("remarks", remarks);

        const imageMeta = [];

        // ✅ Iterate through ALL images to maintain order
        images.forEach((img, idx) => {
          // Is this a binary file (New Upload / Edited)?
          // CASE A: It has a binary file (New Upload or Edit)
          if (
            img.file &&
            (img.file instanceof Blob || img.file instanceof File)
          ) {
            const ext = img.file.type.split("/")[1] || "jpg";
            const fileName = `image_${idx}.${ext}`;

            formData.append("images", img.file, fileName);

            // Tell backend: "Index X is a new file"
            imageMeta.push({
              type: "file",
              id: img.id,
              index: idx
            });
          }
          // CASE B: It is an existing server URL
          else if (
            img.url &&
            typeof img.url === "string" &&
            img.url.includes("/storage/")
          ) {
            imageMeta.push({
              type: "url",
              id: img.id,
              imageURL: img.url,
              index: idx
            });
          }
          // CASE C: It is a blob string BUT NO FILE (The Error State)
          else if (
            img.url &&
            typeof img.url === "string" &&
            img.url.startsWith("blob:")
          ) {
            console.error("⚠️ DETECTED BLOB URL WITHOUT FILE:", img);
            // FAIL SAFE: Do not send this as a URL.
          }
        });

        // Send the blueprint
        formData.append("imageMetadata", JSON.stringify(imageMeta));

        // --- SEND REQUEST ---
        const response = await axios.post(
          `${API_BASE_URL}/api/fincheck-inspection/upload-photo-batch`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              const simulatedItemProgress = Math.floor(
                (percentCompleted / 100) * images.length
              );
              setUploadStatus((prev) => ({
                ...prev,
                [uniqueKey]: {
                  ...prev[uniqueKey],
                  status: "uploading",
                  progress: simulatedItemProgress
                }
              }));
            }
          }
        );

        if (response.data.success) {
          setUploadStatus((prev) => ({
            ...prev,
            [uniqueKey]: {
              status: "success",
              progress: images.length,
              total: images.length
            }
          }));

          // ✅ Trigger the Success Callback if provided
          // This passes the real server paths back to the component
          if (
            currentTask.onSuccess &&
            response.data.data &&
            response.data.data.savedImages
          ) {
            currentTask.onSuccess(response.data.data.savedImages);
          }

          setTimeout(() => {
            setUploadStatus((prev) => {
              const newState = { ...prev };
              delete newState[uniqueKey];
              return newState;
            });
          }, 3000);
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error("Background Upload Error:", error);
        setUploadStatus((prev) => ({
          ...prev,
          [uniqueKey]: {
            status: "error",
            progress: 0,
            total: images.length,
            error: error.message
          }
        }));
      } finally {
        setUploadQueue((prev) => prev.slice(1));
        isProcessingRef.current = false;
      }
    };

    processQueue();
  }, [uploadQueue, reportId]);

  return (
    <PhotoUploadContext.Provider value={{ addToUploadQueue, uploadStatus }}>
      {children}
    </PhotoUploadContext.Provider>
  );
};
