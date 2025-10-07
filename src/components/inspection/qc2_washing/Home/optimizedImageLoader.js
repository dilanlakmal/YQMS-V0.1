// Optimized Image Loader for PDF Generation
const imageCache = new Map();
const loadingPromises = new Map();

export const normalizeImageUrl = (src) => {
  if (!src) return null;

  if (typeof src === "string") {
    if (src.startsWith("data:")) return src;
    if (src.startsWith("{")) {
      try {
        const parsed = JSON.parse(src);
        return parsed.originalUrl || parsed.url || parsed.src || parsed.path;
      } catch (e) {
        return src;
      }
    }
    return src.trim();
  }

  if (typeof src === "object" && src !== null) {
    return src.originalUrl || src.url || src.src || src.path;
  }

  return null;
};

export const generateImageKeys = (url) => {
  const keys = new Set([url]);

  if (url.includes("192.167.12.85:5000")) {
    const path = url.split("192.167.12.85:5000")[1];
    if (path) {
      keys.add(path);
      keys.add(path.startsWith("/") ? path.substring(1) : "/" + path);
    }
  }

  if (url.includes("yqms.yaikh.com")) {
    const path = url.split("yqms.yaikh.com")[1];
    if (path) {
      keys.add(path);
      keys.add(path.startsWith("/") ? path.substring(1) : "/" + path);
    }
  }

  return Array.from(keys);
};

const loadImageOptimized = async (imageUrl, API_BASE_URL) => {
  try {
    if (imageUrl.startsWith("data:")) {
      return imageUrl;
    }

    let cleanUrl = imageUrl;
    if (cleanUrl.startsWith("/")) {
      cleanUrl = `${API_BASE_URL}${cleanUrl}`;
    }

    const proxyUrl = `${API_BASE_URL}/api/image-proxy-all?url=${encodeURIComponent(
      cleanUrl
    )}`;

    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3000) // 3s timeout
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.dataUrl || null;
  } catch (error) {
    return null;
  }
};

export const loadImageAsBase64 = async (src, API_BASE_URL) => {
  const imageUrl = normalizeImageUrl(src);
  if (!imageUrl) return null;

  // Check cache first
  if (imageCache.has(imageUrl)) {
    return imageCache.get(imageUrl);
  }

  // Check if already loading
  if (loadingPromises.has(imageUrl)) {
    return loadingPromises.get(imageUrl);
  }

  // Create loading promise
  const loadPromise = loadImageOptimized(imageUrl, API_BASE_URL);
  loadingPromises.set(imageUrl, loadPromise);

  try {
    const result = await loadPromise;
    imageCache.set(imageUrl, result);
    return result;
  } finally {
    loadingPromises.delete(imageUrl);
  }
};

export const collectAllImageUrls = (recordData, inspectorDetails) => {
  const imageUrls = new Set();

  const collectImages = (images) => {
    if (!Array.isArray(images)) return;
    images.forEach((img) => {
      const url = normalizeImageUrl(img);
      if (url) imageUrls.add(url);
    });
  };

  // Collect defect images
  recordData.defectDetails?.defectsByPc?.forEach((pc) => {
    pc.pcDefects?.forEach((defect) => {
      collectImages(defect.defectImages || defect.capturedImages || []);
      collectImages(
        defect.uploadedImages || defect.uploaded_images || defect.images || []
      );
    });
  });

  // Collect additional images
  collectImages(recordData.defectDetails?.additionalImages || []);

  // Collect inspection images
  recordData.inspectionDetails?.checkpointInspectionData?.forEach(
    (checkpoint) => {
      collectImages(checkpoint.comparisonImages || []);
      collectImages(checkpoint.uploadedImages || []);
      checkpoint.subPoints?.forEach((subPoint) => {
        collectImages(subPoint.comparisonImages || []);
        collectImages(subPoint.uploadedImages || []);
      });
    }
  );

  // Collect legacy inspection images
  recordData.inspectionDetails?.checkedPoints?.forEach((point) => {
    collectImages(point.comparison || []);
    collectImages(point.uploadedImages || []);
  });

  // Collect machine images
  recordData.inspectionDetails?.machineProcesses?.forEach((machine) => {
    if (machine.image) {
      const url = normalizeImageUrl(machine.image);
      if (url) imageUrls.add(url);
    }
  });

  // Collect inspector photo
  if (inspectorDetails?.face_photo) {
    const url = normalizeImageUrl(inspectorDetails.face_photo);
    if (url) imageUrls.add(url);
  }

  return Array.from(imageUrls);
};

export const loadImagesInBatches = async (
  imageUrls,
  API_BASE_URL,
  batchSize = 5
) => {
  const imageMap = {};

  for (let i = 0; i < imageUrls.length; i += batchSize) {
    const batch = imageUrls.slice(i, i + batchSize);
    const batchPromises = batch.map(async (url) => {
      try {
        const base64 = await loadImageAsBase64(url, API_BASE_URL);
        if (base64) {
          const keys = generateImageKeys(url);
          keys.forEach((key) => {
            imageMap[key] = base64;
          });
        }
      } catch (error) {
        // Silently fail individual images
      }
    });

    await Promise.allSettled(batchPromises);

    // Small delay between batches to prevent server overload
    if (i + batchSize < imageUrls.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return imageMap;
};
