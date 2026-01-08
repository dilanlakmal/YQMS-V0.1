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
  // HELPER: Image Compression
  // =========================================================
  const compressImage = async (base64Str, maxWidth = 1920, quality = 0.7) => {
    // If it's already a URL (not base64), return as is
    if (!base64Str.startsWith("data:image")) return base64Str;

    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize if too large
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.7 quality (Good balance for ~300KB)
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(base64Str); // Fallback
    });
  };

  // =========================================================
  // ACTION: Add to Upload Queue
  // =========================================================
  const addToUploadQueue = useCallback(async (payload) => {
    const { sectionId, itemNo, images } = payload;
    const uniqueKey = `${sectionId}_${itemNo}`;

    // 1. Set Status to Pending/Compressing
    setUploadStatus((prev) => ({
      ...prev,
      [uniqueKey]: { status: "compressing", progress: 0, total: images.length }
    }));

    // 2. Compress Images (Only the new Base64 ones)
    const compressedImages = await Promise.all(
      images.map(async (img) => {
        if (img.imgSrc && img.imgSrc.startsWith("data:")) {
          const compressed = await compressImage(img.imgSrc);
          return { ...img, imgSrc: compressed };
        }
        return img;
      })
    );

    // 3. Add to Queue
    setUploadQueue((prev) => [
      ...prev,
      { ...payload, images: compressedImages, uniqueKey }
    ]);

    // 4. Update Status to Queued
    setUploadStatus((prev) => ({
      ...prev,
      [uniqueKey]: { status: "queued", progress: 0, total: images.length }
    }));
  }, []);

  // =========================================================
  // WORKER: Process Queue
  // =========================================================
  useEffect(() => {
    const processQueue = async () => {
      if (isProcessingRef.current || uploadQueue.length === 0) return;

      isProcessingRef.current = true;
      const currentTask = uploadQueue[0]; // Peek
      const {
        uniqueKey,
        reportId: taskReportId,
        sectionId,
        itemNo,
        images,
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

        // Use the actual reportId passed in payload, fallback to context prop
        const targetReportId = taskReportId || reportId;

        if (!targetReportId) {
          throw new Error("Report ID missing");
        }

        // Send to Backend
        // We use the existing controller endpoint which handles the batch
        const response = await axios.post(
          `${API_BASE_URL}/api/fincheck-inspection/upload-photo-batch`,
          {
            reportId: targetReportId,
            sectionId,
            sectionName,
            itemNo: parseInt(itemNo),
            itemName,
            images: images.map((img, idx) => ({
              id: img.id,
              imgSrc: img.imgSrc || img.url, // Controller expects this
              index: idx
            })),
            remarks
          },
          {
            // Optional: Monitor Upload Progress for huge batches
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              // Map upload percentage to item count for the UI (roughly)
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

          // Clear success status after 3 seconds
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
        // Remove processed item from queue
        setUploadQueue((prev) => prev.slice(1));
        isProcessingRef.current = false;
      }
    };

    processQueue();
  }, [uploadQueue, reportId]); // Run whenever queue changes

  return (
    <PhotoUploadContext.Provider value={{ addToUploadQueue, uploadStatus }}>
      {children}
    </PhotoUploadContext.Provider>
  );
};
