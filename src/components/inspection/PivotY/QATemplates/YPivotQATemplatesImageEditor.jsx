import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Upload,
  Type,
  ArrowRight,
  Square,
  Circle as CircleIcon,
  PenTool,
  X,
  Trash2,
  Undo2,
  SwitchCamera,
  Minus,
  Plus,
  ZoomIn,
  ZoomOut,
  Save,
  Palette,
  Settings,
  Loader,
  Move,
  Check,
  Eraser, // for background removal button
  ImageOff // alternative icon
} from "lucide-react";

import {
  useBackgroundRemoval,
  BackgroundRemovalModal,
  BackgroundColorPicker
} from "./YPivotQATemplatesImageRemoveBackground";

const MAX_IMAGES = 7;

const YPivotQATemplatesImageEditor = ({
  autoStartMode = null,
  existingData = null,
  onSave = null,
  onCancel = null
}) => {
  // --- Device Detection ---
  const [deviceType, setDeviceType] = useState("desktop");
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 768) return "mobile";
      if (width < 1024) return "tablet";
      return "desktop";
    };
    setDeviceType(detectDevice());
    const handleResize = () => setDeviceType(detectDevice());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Lock Body Scroll ---
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.overscrollBehavior = "unset";
    };
  }, []);

  // --- Modes & State ---
  const [mode, setMode] = useState(
    existingData ? "editor" : autoStartMode ? "initializing" : "initial"
  );

  // MULTIPLE IMAGES STATE
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const currentImage = images[currentImageIndex] || null;
  const imgSrc = currentImage?.imgSrc || null;

  // --- Camera State ---
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");

  // --- Uploading State ---
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);

  // --- Editor State ---
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const didInitRef = useRef(false);
  const [context, setContext] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // History for current image
  const [history, setHistory] = useState([]);
  const [currentAction, setCurrentAction] = useState(null);

  // Tools
  const [activeTool, setActiveTool] = useState("pen");
  const [color, setColor] = useState("#ef4444");
  const [lineWidth, setLineWidth] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);

  // Text Input Modal State
  const [showTextInput, setShowTextInput] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });

  // TEXT SELECTION & MOVEMENT
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [hoveredElementId, setHoveredElementId] = useState(null);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Touch/pinch zoom
  const [lastTouchDistance, setLastTouchDistance] = useState(null);

  // --- Background Removal State ---
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [bgRemovalColor, setBgRemovalColor] = useState("#FFFFFF");

  // Use the background removal hook
  const {
    removeImageBackground,
    isProcessing: isBgRemoving,
    progress: bgRemovalProgress,
    progressMessage: bgRemovalMessage,
    error: bgRemovalError,
    resetState: resetBgRemovalState
  } = useBackgroundRemoval();

  // Generate unique ID
  const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // ✅ ADD: Helper to scale dimensions for high-res canvas
  const getScaledValue = useCallback(
    (value) => {
      if (!canvasSize.width || canvasSize.width <= 0) return value;
      // Scale based on canvas resolution (reference: 1000px)
      const scaleFactor = Math.max(1, canvasSize.width / 1000);
      return value * scaleFactor;
    },
    [canvasSize.width]
  );

  // Sync history when image changes
  useEffect(() => {
    if (currentImage) {
      setHistory(currentImage.history || []);
      setSelectedElementId(null);
      setHoveredElementId(null);
    } else {
      setHistory([]);
    }
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentImageIndex, currentImage?.id, images.length]);

  // Update images array when history changes
  const updateCurrentImageHistory = useCallback(
    (newHistory) => {
      setImages((prev) =>
        prev.map((img, idx) =>
          idx === currentImageIndex ? { ...img, history: newHistory } : img
        )
      );
    },
    [currentImageIndex]
  );

  // ==========================================
  // INITIALIZE WITH PROPS
  // ==========================================

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    const initializeEditor = async () => {
      if (existingData) {
        if (Array.isArray(existingData)) {
          setImages(
            existingData.map((data, idx) => ({
              id: generateId(),
              imgSrc: data.imgSrc,
              history: data.history || [],
              editedImgSrc: null
            }))
          );
        } else {
          setImages([
            {
              id: generateId(),
              imgSrc: existingData.imgSrc,
              history: existingData.history || [],
              editedImgSrc: null
            }
          ]);
        }
        setMode("editor");
        return;
      }

      // ✅ AUTO-START CAMERA
      if (autoStartMode === "camera") {
        setIsInitializing(true);
        await startCamera();
        setIsInitializing(false);
      }
      // ✅ AUTO-START UPLOAD
      else if (autoStartMode === "upload") {
        setIsInitializing(true);
        // Longer delay to ensure file input is mounted
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (fileInputRef.current) {
          fileInputRef.current.click();
          // Keep initializing state until user interacts with file picker
        } else {
          console.error("File input not found");
          setMode("initial");
        }
        setIsInitializing(false);
      }
      // ✅ NO AUTO-START - Show initial screen
      else {
        setMode("initial");
      }
    };

    initializeEditor();
  }, []);

  // ==========================================
  // 1. CAMERA & UPLOAD LOGIC
  // ==========================================

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      const isMobile = window.innerWidth < 1024;
      const initialMode = isMobile ? "environment" : "user";
      setFacingMode(initialMode);

      const constraints = {
        audio: false,
        video: {
          facingMode: initialMode,
          width: { ideal: 4096, min: 1280 },
          height: { ideal: 2160, min: 720 },
          frameRate: { ideal: 30 }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setMode("camera");
    } catch (err) {
      console.error("Camera Error:", err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 4096 },
            height: { ideal: 2160 }
          }
        });
        setStream(fallbackStream);
        if (videoRef.current) videoRef.current.srcObject = fallbackStream;
        setMode("camera");
      } catch (e) {
        alert("Unable to access camera. Please check permissions.");
        setMode("initial");
      }
    }
  };

  const switchCamera = async () => {
    const nextMode = facingMode === "user" ? "environment" : "user";

    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
        stream.removeTrack(track);
      });
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setFacingMode(nextMode);
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const constraints = {
        audio: false,
        video: {
          facingMode: { exact: nextMode },
          width: { ideal: 4096, min: 1280 },
          height: { ideal: 2160, min: 720 }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.warn("Exact switch failed, trying loose constraint...", err);
      try {
        const looseStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: nextMode,
            width: { ideal: 4096 },
            height: { ideal: 2160 }
          }
        });
        setStream(looseStream);
        if (videoRef.current) {
          videoRef.current.srcObject = looseStream;
        }
      } catch (finalErr) {
        console.error("Camera switch error:", finalErr);
        alert("Could not switch camera. Your device might be busy.");
        startCamera();
      }
    }
  };

  // MODIFIED: Capture without stopping camera, add to images array
  const captureImage = () => {
    if (!videoRef.current) return;
    if (images.length >= MAX_IMAGES) {
      alert(`Maximum ${MAX_IMAGES} images allowed!`);
      return;
    }

    const video = videoRef.current;
    // ADD: Check if video is ready with valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("Video not ready");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // ADD: High quality rendering settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    //ctx.drawImage(video, 0, 0);

    const newImage = {
      id: generateId(),
      imgSrc: canvas.toDataURL("image/jpeg", 1.0),
      //imgSrc: canvas.toDataURL("image/png"),
      history: [],
      editedImgSrc: null
    };

    setImages((prev) => [...prev, newImage]);

    // Visual feedback - flash effect
    if (videoRef.current) {
      videoRef.current.style.opacity = "0.5";
      setTimeout(() => {
        if (videoRef.current) videoRef.current.style.opacity = "1";
      }, 100);
    }
  };

  const finishCapturing = () => {
    stopCamera();
    if (images.length > 0) {
      setCurrentImageIndex(0);
      setMode("editor");
    } else {
      setMode("initial");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // MODIFIED: Handle multiple file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) {
      // User cancelled file selection
      if (autoStartMode === "upload" && images.length === 0) {
        // Auto-upload was cancelled - close modal
        handleCancel();
      } else if (images.length === 0) {
        // Manual upload cancelled - go back to initial screen
        setMode("initial");
        setIsInitializing(false);
      }
      // Reset initializing state
      setIsInitializing(false);
      return;
    }

    const remainingSlots = MAX_IMAGES - images.length;
    const filesToProcess = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      alert(
        `Only ${remainingSlots} more image(s) can be added. Maximum is ${MAX_IMAGES}.`
      );
    }

    // ✅ IMMEDIATELY show loading state and switch to editor
    setIsUploading(true);
    setUploadProgress(0);
    setUploadTotal(filesToProcess.length);
    setMode("editor");

    let loadedCount = 0;
    const startIndex = images.length;

    // ✅ Process each file and add to images IMMEDIATELY as it loads
    filesToProcess.forEach((file, index) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const newImage = {
          id: generateId(),
          imgSrc: event.target.result,
          history: [],
          editedImgSrc: null
        };

        // ✅ Add image IMMEDIATELY (don't wait for others)
        setImages((prev) => [...prev, newImage]);

        // ✅ Set as current if it's the first one
        if (index === 0 && loadedCount === 0) {
          setCurrentImageIndex(startIndex);
        }

        loadedCount++;
        setUploadProgress(loadedCount);

        // ✅ Hide loading when all done
        if (loadedCount === filesToProcess.length) {
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadTotal(0);
          }, 300);
        }
      };

      reader.readAsDataURL(file);
    });

    // Reset file input
    e.target.value = "";
  };

  // ==========================================
  // 2. CANVAS RENDERING ENGINE
  // ==========================================

  // Keep full resolution, use CSS for display
  useEffect(() => {
    if (mode === "editor" && imgSrc && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const headerHeight = 60;
        const toolbarHeight = deviceType === "mobile" ? 180 : 140;
        const thumbnailHeight = images.length > 0 ? 80 : 0;
        const padding = 20;

        const maxAvailableWidth = screenW - padding;
        const maxAvailableHeight =
          screenH - headerHeight - toolbarHeight - thumbnailHeight - padding;

        const scale = Math.min(
          maxAvailableWidth / img.width,
          maxAvailableHeight / img.height,
          1
        );

        // Keep canvas at FULL original resolution
        canvas.width = img.width;
        canvas.height = img.height;

        // Use CSS to scale the DISPLAY size only
        const displayWidth = img.width * scale;
        const displayHeight = img.height * scale;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        // ✅ Store both original and display sizes
        setCanvasSize({
          width: img.width, // Original resolution
          height: img.height, // Original resolution
          displayWidth: displayWidth, // CSS display size
          displayHeight: displayHeight,
          scale: scale // Scale factor for coordinate conversion
        });

        setContext(ctx);
        redrawCanvas(ctx, img, img.width, img.height);
      };
      img.src = imgSrc;
    }
  }, [mode, imgSrc, deviceType, images.length]);

  // Just make sure it uses the original dimensions
  useEffect(() => {
    if (context && imgSrc && canvasSize.width > 0) {
      const img = new Image();
      img.onload = () => {
        // Uses full resolution width/height
        redrawCanvas(context, img, canvasSize.width, canvasSize.height);
      };
      img.src = imgSrc;
    }
  }, [history, currentAction, zoom, pan, selectedElementId, hoveredElementId]);

  const redrawCanvas = (ctx, img, width, height) => {
    if (!ctx) return;

    // ✅ ADD: Calculate scale factor for stroke widths
    const scaleFactor = Math.max(1, width / 1000);

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    ctx.drawImage(img, 0, 0, width, height);

    [...history, currentAction].forEach((item) => {
      if (!item) return;

      ctx.strokeStyle = item.color;
      //  Scale the line width
      ctx.lineWidth = item.width * scaleFactor;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = item.color;

      if (item.type === "pen") {
        if (item.points && item.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(item.points[0].x, item.points[0].y);
          item.points.forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
      } else if (item.type === "arrow") {
        //  Pass scaled width
        drawArrow(
          ctx,
          item.x,
          item.y,
          item.endX,
          item.endY,
          item.width * scaleFactor
        );
      } else if (item.type === "rect") {
        ctx.beginPath();
        ctx.strokeRect(item.x, item.y, item.w, item.h);
      } else if (item.type === "circle") {
        ctx.beginPath();
        ctx.ellipse(
          item.x + item.w / 2,
          item.y + item.h / 2,
          Math.abs(item.w / 2),
          Math.abs(item.h / 2),
          0,
          0,
          2 * Math.PI
        );
        ctx.stroke();
      } else if (item.type === "text") {
        //  Scale font size
        const baseFontSize = deviceType === "mobile" ? 20 : 24;
        const fontSize = Math.round(baseFontSize * scaleFactor);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = "middle";

        const textMetrics = ctx.measureText(item.text);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;
        //  Scale padding
        const padding = 8 * scaleFactor;

        const isSelected = selectedElementId === item.id;
        const isHovered = hoveredElementId === item.id;

        if (isSelected || isHovered) {
          ctx.save();
          ctx.strokeStyle = isSelected ? "#3b82f6" : "#6b7280";
          //  Scale selection box stroke
          ctx.lineWidth = 2 * scaleFactor;
          ctx.setLineDash(
            isHovered && !isSelected ? [5 * scaleFactor, 5 * scaleFactor] : []
          );
          ctx.strokeRect(
            item.x - padding,
            item.y - textHeight / 2 - padding,
            textWidth + padding * 2,
            textHeight + padding * 2
          );
          ctx.setLineDash([]);
          ctx.restore();
        }

        ctx.fillStyle = item.color;
        ctx.fillText(item.text, item.x, item.y);
      }
    });

    ctx.restore();
  };

  // width is already scaled when passed
  const drawArrow = (ctx, fromX, fromY, toX, toY, width) => {
    // ✅ Arrow head scales with the line width (which is already scaled)
    const headlen = Math.max(width * 2, width * 4);
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  // ==========================================
  // 3. ZOOM & PAN
  // ==========================================

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && !isDrawing && !isDraggingElement) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastTouchDistance) {
        const delta = distance - lastTouchDistance;
        setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta * 0.005)));
      }
      setLastTouchDistance(distance);
    }
  };

  const handleTouchEndZoom = () => setLastTouchDistance(null);

  // ==========================================
  // 4. TEXT ELEMENT DETECTION
  // ==========================================

  const getTextElementAtPosition = (pos) => {
    const fontSize = deviceType === "mobile" ? 20 : 24;
    const padding = 8;

    // Check in reverse order (top-most first)
    for (let i = history.length - 1; i >= 0; i--) {
      const item = history[i];
      if (item.type === "text") {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx) {
          ctx.font = `bold ${fontSize}px sans-serif`;
          const textMetrics = ctx.measureText(item.text);
          const textWidth = textMetrics.width;
          const textHeight = fontSize;

          const bounds = {
            left: item.x - padding,
            right: item.x + textWidth + padding,
            top: item.y - textHeight / 2 - padding,
            bottom: item.y + textHeight / 2 + padding
          };

          if (
            pos.x >= bounds.left &&
            pos.x <= bounds.right &&
            pos.y >= bounds.top &&
            pos.y <= bounds.bottom
          ) {
            return { item, index: i };
          }
        }
      }
    }
    return null;
  };

  // ==========================================
  // 5. INTERACTION HANDLERS
  // ==========================================

  // Account for display scaling
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // ✅ Calculate the ratio between internal size and display size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // ✅ Convert screen coordinates to canvas coordinates
    const x = ((clientX - rect.left) * scaleX - pan.x) / zoom;
    const y = ((clientY - rect.top) * scaleY - pan.y) / zoom;

    return { x, y };
  };

  const handleMouseMove = (e) => {
    if (isDraggingElement && selectedElementId) {
      const pos = getCoords(e);
      setHistory((prev) =>
        prev.map((item) =>
          item.id === selectedElementId
            ? { ...item, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
            : item
        )
      );
      return;
    }

    if (isDrawing) {
      handleMove(e);
      return;
    }

    // Hover detection for desktop
    if (deviceType === "desktop" && !isDrawing) {
      const pos = getCoords(e);
      const textElement = getTextElementAtPosition(pos);
      setHoveredElementId(textElement?.item?.id || null);
    }
  };

  const handleStart = (e) => {
    if (e.touches && e.touches.length > 1) return;

    const pos = getCoords(e);

    // Check if clicking on a text element
    const textElement = getTextElementAtPosition(pos);

    if (textElement) {
      setSelectedElementId(textElement.item.id);
      setDragOffset({
        x: pos.x - textElement.item.x,
        y: pos.y - textElement.item.y
      });

      // For touch devices, start long press timer
      if (e.touches) {
        setIsLongPressing(false);
        longPressTimerRef.current = setTimeout(() => {
          setIsLongPressing(true);
          setIsDraggingElement(true);
        }, 500);
      } else {
        // Desktop - immediate drag on click
        setIsDraggingElement(true);
      }
      return;
    }

    // Clear selection if clicking elsewhere
    setSelectedElementId(null);

    if (activeTool === "text") {
      setTextPos(pos);
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    setStartPos(pos);

    if (activeTool === "pen") {
      setCurrentAction({
        id: generateId(),
        type: "pen",
        color: color,
        width: lineWidth,
        points: [pos]
      });
    } else {
      setCurrentAction({
        id: generateId(),
        type: activeTool,
        color: color,
        width: lineWidth,
        x: pos.x,
        y: pos.y,
        w: 0,
        h: 0,
        endX: pos.x,
        endY: pos.y
      });
    }
  };

  const handleMove = (e) => {
    if (!isDrawing) return;
    if (e.touches && e.touches.length > 1) return;

    e.preventDefault();
    const pos = getCoords(e);

    if (activeTool === "pen") {
      setCurrentAction((prev) => ({
        ...prev,
        points: [...(prev?.points || []), pos]
      }));
    } else if (activeTool === "arrow") {
      setCurrentAction((prev) => ({ ...prev, endX: pos.x, endY: pos.y }));
    } else if (activeTool === "rect" || activeTool === "circle") {
      setCurrentAction((prev) => ({
        ...prev,
        w: pos.x - startPos.x,
        h: pos.y - startPos.y
      }));
    }
  };

  const handleEnd = () => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDraggingElement) {
      setIsDraggingElement(false);
      setIsLongPressing(false);
      updateCurrentImageHistory(history);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentAction) {
      const newHistory = [...history, currentAction];
      setHistory(newHistory);
      updateCurrentImageHistory(newHistory);
      setCurrentAction(null);
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      handleStart(e);
    }
  };

  const handleTouchMoveCanvas = (e) => {
    handleTouchMove(e);
    if (isDraggingElement) {
      e.preventDefault();
      const pos = getCoords(e);
      setHistory((prev) =>
        prev.map((item) =>
          item.id === selectedElementId
            ? { ...item, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
            : item
        )
      );
    } else if (isDrawing) {
      handleMove(e);
    }
  };

  const handleTouchEndCanvas = () => {
    handleEnd();
    handleTouchEndZoom();
  };

  const confirmText = () => {
    if (textValue.trim()) {
      const newTextItem = {
        id: generateId(),
        type: "text",
        text: textValue,
        x: textPos.x,
        y: textPos.y,
        color: color,
        width: lineWidth
      };
      const newHistory = [...history, newTextItem];
      setHistory(newHistory);
      updateCurrentImageHistory(newHistory);
    }
    setTextValue("");
    setShowTextInput(false);
  };

  const deleteSelectedElement = () => {
    if (selectedElementId) {
      const newHistory = history.filter(
        (item) => item.id !== selectedElementId
      );
      setHistory(newHistory);
      updateCurrentImageHistory(newHistory);
      setSelectedElementId(null);
    }
  };

  const undoLast = () => {
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    updateCurrentImageHistory(newHistory);
    setSelectedElementId(null);
  };

  const clearAll = () => {
    if (window.confirm("Clear all edits on this image?")) {
      setHistory([]);
      updateCurrentImageHistory([]);
      setSelectedElementId(null);
    }
  };

  // ==========================================
  // 6. IMAGE MANAGEMENT
  // ==========================================

  const selectImage = (index) => {
    // Save current canvas state before switching
    if (canvasRef.current && currentImage) {
      const editedImgSrc = canvasRef.current.toDataURL("image/png");
      setImages((prev) =>
        prev.map((img, idx) =>
          idx === currentImageIndex ? { ...img, editedImgSrc, history } : img
        )
      );
    }
    setCurrentImageIndex(index);
  };

  const removeImage = (index, e) => {
    e.stopPropagation();
    if (window.confirm("Remove this image?")) {
      setImages((prev) => prev.filter((_, idx) => idx !== index));
      if (currentImageIndex >= index && currentImageIndex > 0) {
        setCurrentImageIndex((prev) => prev - 1);
      }
      if (images.length === 1) {
        setMode("initial");
      }
    }
  };

  const handleSave = () => {
    if (!onSave) return;

    // Generate final images with edits
    const savePromises = images.map((img, idx) => {
      return new Promise((resolve) => {
        if (idx === currentImageIndex && canvasRef.current) {
          // Current image - get from canvas
          const originalZoom = zoom;
          const originalPan = { ...pan };
          setZoom(1);
          setPan({ x: 0, y: 0 });

          setTimeout(() => {
            const editedImgSrc = canvasRef.current.toDataURL("image/png");
            setZoom(originalZoom);
            setPan(originalPan);
            resolve({
              id: img.id,
              imgSrc: img.imgSrc,
              editedImgSrc,
              history: img.history
            });
          }, 100);
        } else {
          // Generate edited image for other images
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const image = new Image();

          image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            // ✅ ADD: Calculate scale factor
            const scaleFactor = Math.max(1, image.width / 1000);

            (img.history || []).forEach((item) => {
              ctx.strokeStyle = item.color;
              //  Scale line width
              ctx.lineWidth = item.width * scaleFactor;
              ctx.lineCap = "round";
              ctx.lineJoin = "round";
              ctx.fillStyle = item.color;

              if (item.type === "pen" && item.points?.length > 1) {
                ctx.beginPath();
                ctx.moveTo(item.points[0].x, item.points[0].y);
                item.points.forEach((p) => ctx.lineTo(p.x, p.y));
                ctx.stroke();
              } else if (item.type === "arrow") {
                //  Pass scaled width
                drawArrow(
                  ctx,
                  item.x,
                  item.y,
                  item.endX,
                  item.endY,
                  item.width * scaleFactor
                );
              } else if (item.type === "rect") {
                ctx.strokeRect(item.x, item.y, item.w, item.h);
              } else if (item.type === "circle") {
                ctx.beginPath();
                ctx.ellipse(
                  item.x + item.w / 2,
                  item.y + item.h / 2,
                  Math.abs(item.w / 2),
                  Math.abs(item.h / 2),
                  0,
                  0,
                  2 * Math.PI
                );
                ctx.stroke();
              } else if (item.type === "text") {
                //  Scale font size
                const fontSize = Math.round(24 * scaleFactor);
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.textBaseline = "middle";
                ctx.fillText(item.text, item.x, item.y);
              }
            });

            resolve({
              id: img.id,
              imgSrc: img.imgSrc,
              editedImgSrc: canvas.toDataURL("image/png"),
              history: img.history
            });
          };
          image.src = img.imgSrc;
        }
      });
    });

    Promise.all(savePromises).then((savedImages) => {
      onSave(savedImages);
    });
  };

  const handleCancel = () => {
    stopCamera();
    if (onCancel) {
      onCancel();
    }
  };

  const addMoreImages = () => {
    fileInputRef.current?.click();
  };

  // ==========================================
  // BACKGROUND REMOVAL HANDLER
  // ==========================================

  const handleRemoveBackground = async (backgroundColor = "#FFFFFF") => {
    if (!imgSrc) return;

    setShowBgColorPicker(false);

    try {
      const result = await removeImageBackground(imgSrc, {
        backgroundColor,
        quality: 0.95,
        outputFormat: "image/png"
      });

      if (result.success) {
        // Update the current image with the new background-removed image
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === currentImageIndex
              ? {
                  ...img,
                  imgSrc: result.imageSrc,
                  // Clear history since we have a new base image
                  // Or you could keep it: history: img.history
                  history: []
                }
              : img
          )
        );

        // Clear current image history
        setHistory([]);
      }
    } catch (error) {
      console.error("Background removal failed:", error);
    }
  };

  const handleBgRemovalCancel = () => {
    resetBgRemovalState();
  };

  const handleBgRemovalRetry = () => {
    resetBgRemovalState();
    setShowBgColorPicker(true);
  };

  // ==========================================
  // 7. UI RENDERING
  // ==========================================

  return createPortal(
    <div className="fixed top-0 left-0 w-full h-[100dvh] bg-black/95 z-[9999] flex flex-col overflow-hidden overscroll-none">
      {/* HEADER */}
      <div className="relative z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-2 sm:p-3 flex justify-between items-center flex-shrink-0 border-b border-white/10 safe-area-top">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
            <PenTool className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white">
              Image Editor Pro
            </h2>
            <p className="text-[10px] text-indigo-100 hidden sm:block">
              {images.length > 0
                ? `${images.length}/${MAX_IMAGES} images`
                : "Professional QA Annotation Tool"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === "editor" && images.length > 0 && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/90 hover:bg-white text-indigo-600 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Save All</span>
            </button>
          )}

          <button
            onClick={handleCancel}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden bg-gray-900 min-h-0"
        ref={containerRef}
      >
        {/* Loading State */}
        {isInitializing && (
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-white text-sm">Initializing...</p>
          </div>
        )}

        {/* STATE: INITIAL */}
        {(mode === "initial" || mode === "initializing") && (
          <div className="text-center space-y-6 p-4 sm:p-8">
            {mode === "initializing" || isInitializing ? (
              <div className="flex flex-col items-center gap-4">
                <Loader className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-white text-sm">
                  {isUploading
                    ? "Uploading in Progress..."
                    : autoStartMode === "camera"
                    ? "Starting camera..."
                    : "Processing..."}
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-row justify-center gap-3 sm:gap-6">
                  <button
                    onClick={startCamera}
                    className="group flex flex-col items-center justify-center w-28 h-28 sm:w-40 sm:h-40 bg-gray-800 hover:bg-indigo-600 border-2 border-gray-700 hover:border-indigo-500 rounded-2xl transition-all duration-300 shadow-lg"
                  >
                    <Camera className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 group-hover:text-white mb-2 sm:mb-3" />
                    <span className="text-xs sm:text-base text-gray-300 group-hover:text-white font-semibold">
                      Take Photos
                    </span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex flex-col items-center justify-center w-28 h-28 sm:w-40 sm:h-40 bg-gray-800 hover:bg-emerald-600 border-2 border-gray-700 hover:border-emerald-500 rounded-2xl cursor-pointer transition-all duration-300 shadow-lg"
                  >
                    <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 group-hover:text-white mb-2 sm:mb-3" />
                    <span className="text-xs sm:text-base text-gray-300 group-hover:text-white font-semibold">
                      Upload
                    </span>
                  </button>
                </div>

                {/* ✅ ADD PROGRESS BAR HERE */}
                {isUploading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-indigo-400">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>
                        Uploading {uploadProgress} of {uploadTotal} images...
                      </span>
                    </div>
                    <div className="w-full max-w-md mx-auto bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 ease-out"
                        style={{
                          width: `${(uploadProgress / uploadTotal) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-gray-500 text-sm">Max {MAX_IMAGES} images</p>
              </>
            )}
          </div>
        )}

        {/* STATE: CAMERA */}
        {mode === "camera" && (
          <div className="relative w-full h-full bg-black flex flex-col">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full flex-1 object-contain transition-opacity duration-100"
            />

            {/* Captured Images Preview */}
            {images.length > 0 && (
              <div className="absolute top-4 left-4 right-4 flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-white/50"
                  >
                    <img
                      src={img.imgSrc}
                      alt={`Capture ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] text-center py-0.5">
                      {idx + 1}
                    </span>
                    <button
                      onClick={(e) => removeImage(idx, e)}
                      className="absolute top-0 right-0 bg-red-500 rounded-bl-lg p-0.5"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 sm:gap-8 safe-area-bottom">
              <div className="flex items-center gap-4 sm:gap-8 bg-black/50 px-4 sm:px-8 py-4 rounded-full backdrop-blur-md border border-white/10">
                <button
                  onClick={() => {
                    stopCamera();
                    if (images.length > 0) {
                      setMode("editor");
                    } else {
                      handleCancel();
                    }
                  }}
                  className="p-2 sm:p-3 bg-gray-700 rounded-full text-white hover:bg-gray-600 transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <div className="flex flex-col items-center">
                  <button
                    onClick={captureImage}
                    disabled={images.length >= MAX_IMAGES}
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full border-4 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-white text-xs mt-1">
                    {images.length}/{MAX_IMAGES}
                  </span>
                </div>

                {images.length > 0 ? (
                  <button
                    onClick={finishCapturing}
                    className="p-2 sm:p-3 bg-green-600 rounded-full text-white hover:bg-green-500 transition-colors"
                    title="Done Capturing"
                  >
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                ) : (
                  deviceType !== "desktop" && (
                    <button
                      onClick={switchCamera}
                      className="p-2 sm:p-3 bg-gray-700 rounded-full text-white hover:bg-gray-600 transition-colors"
                      title="Switch Camera"
                    >
                      <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* STATE: EDITOR */}
        {mode === "editor" && (
          <>
            {/* ✅ LOADING STATE - Show when uploading but NO image loaded yet */}
            {isUploading && !imgSrc && (
              <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center gap-6 p-4">
                <div className="relative">
                  <Loader className="w-16 h-16 text-indigo-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-indigo-500/20 rounded-full animate-ping"></div>
                  </div>
                </div>

                <div className="text-white text-center space-y-3">
                  <p className="text-xl font-bold">Processing Images...</p>
                  <p className="text-sm text-gray-300">
                    Please wait while we prepare your images
                  </p>

                  {/* Progress Counter */}
                  <div className="flex items-center justify-center gap-2 text-indigo-400 font-mono text-sm mt-4">
                    <span className="text-2xl font-bold">{uploadProgress}</span>
                    <span className="text-gray-500">/</span>
                    <span className="text-lg">{uploadTotal}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-sm space-y-2">
                  <div className="bg-gray-800 rounded-full h-2 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-500 ease-out relative overflow-hidden"
                      style={{
                        width: `${(uploadProgress / uploadTotal) * 100}%`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                  <p className="text-xs text-center text-gray-400">
                    {Math.round((uploadProgress / uploadTotal) * 100)}% Complete
                  </p>
                </div>
              </div>
            )}

            {/* ✅ CANVAS & CONTROLS - Only show when image exists */}
            {imgSrc && (
              <>
                {/* Upload Progress Indicator (compact, when adding more images) */}
                {isUploading && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-sm px-6 py-3 rounded-full border border-indigo-500/50 shadow-lg">
                    <div className="flex items-center gap-3 text-white">
                      <Loader className="w-5 h-5 text-indigo-400 animate-spin" />
                      <div className="text-sm font-medium">
                        Loading {uploadProgress}/{uploadTotal}
                      </div>
                      <div className="w-24 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                          style={{
                            width: `${(uploadProgress / uploadTotal) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Canvas */}
                <canvas
                  id="image-editor-canvas"
                  ref={canvasRef}
                  onMouseDown={handleStart}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                  onWheel={handleWheel}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMoveCanvas}
                  onTouchEnd={handleTouchEndCanvas}
                  className={`object-contain shadow-2xl block ${
                    isDraggingElement
                      ? "cursor-move"
                      : hoveredElementId
                      ? "cursor-pointer"
                      : "cursor-crosshair"
                  } ${isDraggingElement ? "" : "touch-none"}`}
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${
                      pan.y / zoom
                    }px)`,
                    transformOrigin: "center center"
                  }}
                />

                {/* Selected Element Controls */}
                {selectedElementId && (
                  <div className="absolute top-4 right-4 bg-gray-800 rounded-lg p-2 flex gap-2 shadow-lg z-50">
                    <button
                      onClick={() => setIsDraggingElement(true)}
                      className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors"
                      title="Move"
                    >
                      <Move className="w-4 h-4" />
                    </button>
                    <button
                      onClick={deleteSelectedElement}
                      className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-500 transition-colors"
                      title="Delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Long press indicator */}
                {isLongPressing && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                      Dragging enabled - Move your finger
                    </div>
                  </div>
                )}

                {/* Text Input Modal */}
                {showTextInput && (
                  <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md">
                      <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
                        Enter Text
                      </h3>
                      <input
                        type="text"
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && confirmText()}
                        autoFocus
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Defect note..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setShowTextInput(false);
                            setTextValue("");
                          }}
                          className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmText}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                        >
                          Add Text
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Background Removal Progress Modal */}
                <BackgroundRemovalModal
                  isOpen={isBgRemoving}
                  progress={bgRemovalProgress}
                  progressMessage={bgRemovalMessage}
                  error={bgRemovalError}
                  onCancel={handleBgRemovalCancel}
                  onRetry={handleBgRemovalRetry}
                />

                {/* Background Color Picker Modal */}
                <BackgroundColorPicker
                  isOpen={showBgColorPicker}
                  currentColor={bgRemovalColor}
                  onSelect={(color) => {
                    setBgRemovalColor(color);
                    handleRemoveBackground(color);
                  }}
                  onCancel={() => setShowBgColorPicker(false)}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* IMAGE THUMBNAILS (Editor Only) */}
      {mode === "editor" && images.length > 0 && (
        <div className="bg-gray-900 border-t border-gray-700 p-2 flex-shrink-0 z-40">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-2">
            {images.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => selectImage(idx)}
                className={`relative flex-shrink-0 cursor-pointer transition-all ${
                  idx === currentImageIndex
                    ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-900"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-800">
                  <img
                    src={img.imgSrc}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute -top-2 -left-2 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {idx + 1}
                </span>
                <button
                  onClick={(e) => removeImage(idx, e)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add More Button */}
            {images.length < MAX_IMAGES && (
              <button
                onClick={addMoreImages}
                className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 border-dashed border-gray-600 hover:border-indigo-500 flex items-center justify-center text-gray-500 hover:text-indigo-400 transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* TOOLBAR (Editor Only) */}
      {mode === "editor" && (
        <div className="bg-gray-800 border-t border-gray-700 flex-shrink-0 safe-area-bottom z-50 relative">
          {/* Settings Panel */}
          {showSettings && (
            <div className="p-3 border-b border-gray-700 bg-gray-900/50">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="flex gap-2 items-center">
                  <Palette className="w-4 h-4 text-gray-400" />
                  {[
                    "#ef4444",
                    "#22c55e",
                    "#3b82f6",
                    "#eab308",
                    "#ffffff",
                    "#000000"
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        color === c
                          ? "border-white scale-110 ring-2 ring-offset-1 ring-offset-gray-800 ring-indigo-500"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
                  <button
                    onClick={() => setLineWidth(Math.max(1, lineWidth - 2))}
                    className="p-1 hover:bg-gray-600 rounded transition-colors text-white"
                    disabled={lineWidth <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 min-w-[60px] justify-center">
                    <div
                      className="rounded-full"
                      style={{
                        width: `${lineWidth * 2}px`,
                        height: `${lineWidth * 2}px`,
                        backgroundColor: color
                      }}
                    />
                    <span className="text-xs font-bold text-white">
                      {lineWidth}px
                    </span>
                  </div>
                  <button
                    onClick={() => setLineWidth(Math.min(20, lineWidth + 2))}
                    className="p-1 hover:bg-gray-600 rounded transition-colors text-white"
                    disabled={lineWidth >= 20}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Toolbar */}
          <div className="p-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1">
              {[
                { id: "pen", icon: PenTool },
                { id: "arrow", icon: ArrowRight },
                { id: "rect", icon: Square },
                { id: "circle", icon: CircleIcon },
                { id: "text", icon: Type }
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id);
                    setSelectedElementId(null);
                  }}
                  className={`p-2 rounded-lg transition-all ${
                    activeTool === tool.id
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:bg-gray-700 hover:text-white"
                  }`}
                  title={tool.id}
                >
                  <tool.icon className="w-5 h-5" />
                </button>
              ))}
              {/* Divider */}
              <div className="w-px h-6 bg-gray-600 mx-1" />
              {/* Background Removal Button */}
              <button
                onClick={() => setShowBgColorPicker(true)}
                disabled={!imgSrc || isBgRemoving}
                className={`p-2 rounded-lg transition-all relative ${
                  isBgRemoving
                    ? "bg-emerald-600/20 text-emerald-400"
                    : "text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-300"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
                title="Remove Background"
              >
                {isBgRemoving ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Eraser className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="flex gap-1 items-center bg-gray-700 rounded-lg px-2">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-600 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-white" />
              </button>
              <span className="text-xs font-bold text-white px-2 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-600 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-all ${
                  showSettings
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={undoLast}
                disabled={history.length === 0}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Undo"
              >
                <Undo2 className="w-5 h-5" />
              </button>
              <button
                onClick={clearAll}
                disabled={history.length === 0}
                className="p-2 rounded-lg text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Clear All"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for adding more images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>,
    document.body
  );
};

export default YPivotQATemplatesImageEditor;
