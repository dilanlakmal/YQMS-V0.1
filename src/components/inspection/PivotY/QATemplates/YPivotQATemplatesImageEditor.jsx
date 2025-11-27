import React, { useState, useRef, useEffect } from "react";
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
  Loader
} from "lucide-react";

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
    // Prevent scrolling on the background page when this modal is open
    document.body.style.overflow = "hidden";
    // Also prevent pull-to-refresh on mobile
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = "unset";
      document.body.style.overscrollBehavior = "unset";
    };
  }, []);

  // --- Modes & State ---
  const [mode, setMode] = useState("initial");
  const [imgSrc, setImgSrc] = useState(null);

  // --- Camera State ---
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");

  // --- Editor State ---
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [context, setContext] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // History for Undo
  const [history, setHistory] = useState([]);
  const [currentAction, setCurrentAction] = useState(null);

  // Tools
  const [activeTool, setActiveTool] = useState("pen");
  const [color, setColor] = useState("#ef4444");
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);

  // Text Input Modal State
  const [showTextInput, setShowTextInput] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });

  // Touch/pinch zoom
  const [lastTouchDistance, setLastTouchDistance] = useState(null);

  // ==========================================
  // INITIALIZE WITH PROPS
  // ==========================================

  useEffect(() => {
    const initializeEditor = async () => {
      // Load existing data if editing
      if (existingData) {
        setImgSrc(existingData.imgSrc);
        setHistory(existingData.history || []);
        setMode("editor");
        return;
      }

      // Auto-start camera or upload based on mode
      if (autoStartMode === "camera") {
        setIsInitializing(true);
        await startCamera();
        setIsInitializing(false);
      } else if (autoStartMode === "upload") {
        // Trigger file input
        setIsInitializing(true);
        setTimeout(() => {
          fileInputRef.current?.click();
          setIsInitializing(false);
        }, 300);
      }
    };

    initializeEditor();
  }, []); // Run only once on mount

  // ==========================================
  // 1. CAMERA & UPLOAD LOGIC
  // ==========================================

  const startCamera = async () => {
    try {
      // Ensure any previous stream is dead
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Determine starting mode based on screen width immediately
      // (Don't wait for deviceType state)
      const isMobile = window.innerWidth < 1024;
      const initialMode = isMobile ? "environment" : "user";

      setFacingMode(initialMode); // Sync state

      const constraints = {
        audio: false,
        video: {
          facingMode: initialMode,
          width: { ideal: 1920 }, // Try for high res
          height: { ideal: 1080 }
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
      // Fallback: If environment fails (some laptops), try user
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true
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
    // 1. Calculate the NEW mode locally (don't rely on state updating yet)
    const nextMode = facingMode === "user" ? "environment" : "user";

    // 2. STOP the current stream completely
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
        stream.removeTrack(track); // Explicitly remove
      });
      setStream(null); // Clear state
    }

    // 3. Clear the video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // 4. Update state for UI
    setFacingMode(nextMode);

    // 5. SMALL DELAY - Critical for mobile devices to release hardware lock
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      // 6. Request new stream
      const constraints = {
        audio: false,
        video: {
          // 'exact' is strict. If it fails, we fall back to loose.
          facingMode: { exact: nextMode }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.warn("Exact switch failed, trying loose constraint...", err);

      // FALLBACK: Try without 'exact' if the specific camera label wasn't found
      try {
        const looseStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextMode }
        });
        setStream(looseStream);
        if (videoRef.current) {
          videoRef.current.srcObject = looseStream;
        }
      } catch (finalErr) {
        console.error("Camera switch error:", finalErr);
        alert("Could not switch camera. Your device might be busy.");

        // Emergency: try to restart whatever worked before
        startCamera();
      }
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    setImgSrc(canvas.toDataURL("image/png"));
    stopCamera();
    setMode("editor");
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImgSrc(event.target.result);
        setMode("editor");
      };
      reader.readAsDataURL(file);
    } else {
      // User cancelled
      if (autoStartMode) {
        handleCancel();
      }
    }
  };

  // ==========================================
  // 2. CANVAS RENDERING ENGINE (FULL SCREEN LOGIC)
  // ==========================================

  useEffect(() => {
    if (mode === "editor" && imgSrc && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // --- VIEWPORT BASED CALCULATION ---
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        // Heights of UI elements (Header + Toolbar)
        // Header approx 60px, Toolbar approx 100-140px depending on settings
        const headerHeight = 60;
        const toolbarHeight = deviceType === "mobile" ? 140 : 100;
        const padding = 20;

        // Calculate available space
        const maxAvailableWidth = screenW - padding;
        const maxAvailableHeight =
          screenH - headerHeight - toolbarHeight - padding;

        // Calculate scale to fit perfectly
        const scale = Math.min(
          maxAvailableWidth / img.width,
          maxAvailableHeight / img.height,
          1 // Don't upscale small images too much
        );

        const canvasWidth = img.width * scale;
        const canvasHeight = img.height * scale;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        setCanvasSize({ width: canvasWidth, height: canvasHeight });
        setContext(ctx);
        redrawCanvas(ctx, img, canvasWidth, canvasHeight);
      };
      img.src = imgSrc;
    }
  }, [mode, imgSrc, deviceType]);

  useEffect(() => {
    if (context && imgSrc && canvasSize.width > 0) {
      const img = new Image();
      img.onload = () => {
        redrawCanvas(context, img, canvasSize.width, canvasSize.height);
      };
      img.src = imgSrc;
    }
  }, [history, currentAction, zoom, pan]);

  const redrawCanvas = (ctx, img, width, height) => {
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply zoom and pan
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    ctx.drawImage(img, 0, 0, width, height);

    // Draw History Items
    [...history, currentAction].forEach((item) => {
      if (!item) return;

      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = item.color;

      if (item.type === "pen") {
        if (item.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(item.points[0].x, item.points[0].y);
          item.points.forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
      } else if (item.type === "arrow") {
        drawArrow(ctx, item.x, item.y, item.endX, item.endY, item.width);
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
        ctx.font = `bold ${
          deviceType === "mobile" ? "20px" : "24px"
        } sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(item.text, item.x, item.y);
      }
    });

    ctx.restore();
  };

  const drawArrow = (ctx, fromX, fromY, toX, toY, width) => {
    const headlen = Math.max(15, width * 3);
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

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && !isDrawing) {
      e.preventDefault();
      // Pinch to zoom
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

  const handleTouchEndZoom = () => {
    setLastTouchDistance(null);
  };

  // ==========================================
  // 4. INTERACTION HANDLERS
  // ==========================================

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Adjust for zoom and pan
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;

    return { x, y };
  };

  const handleStart = (e) => {
    if (e.touches && e.touches.length > 1) return; // Ignore multi-touch for drawing

    if (activeTool === "text") {
      const pos = getCoords(e);
      setTextPos(pos);
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    const pos = getCoords(e);
    setStartPos(pos);

    if (activeTool === "pen") {
      setCurrentAction({
        type: "pen",
        color: color,
        width: lineWidth,
        points: [pos]
      });
    } else {
      setCurrentAction({
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
        points: [...prev.points, pos]
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
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentAction) {
      setHistory((prev) => [...prev, currentAction]);
      setCurrentAction(null);
    }
  };

  const confirmText = () => {
    if (textValue.trim()) {
      setHistory((prev) => [
        ...prev,
        {
          type: "text",
          text: textValue,
          x: textPos.x,
          y: textPos.y,
          color: color,
          width: lineWidth
        }
      ]);
    }
    setTextValue("");
    setShowTextInput(false);
  };

  const undoLast = () => {
    setHistory((prev) => prev.slice(0, -1));
  };

  const clearAll = () => {
    if (window.confirm("Clear all edits?")) {
      setHistory([]);
    }
  };

  const handleSave = () => {
    if (onSave && canvasRef.current) {
      // Reset zoom and pan before saving
      const originalZoom = zoom;
      const originalPan = { ...pan };

      setZoom(1);
      setPan({ x: 0, y: 0 });

      setTimeout(() => {
        const canvas = canvasRef.current;
        const imageDataUrl = canvas.toDataURL("image/png");
        onSave(imageDataUrl, history, imgSrc);

        // Restore zoom/pan
        setZoom(originalZoom);
        setPan(originalPan);
      }, 100);
    }
  };

  const handleCancel = () => {
    stopCamera();
    if (onCancel) {
      onCancel();
    }
  };

  // ==========================================
  // 5. UI RENDERING (REACT PORTAL)
  // ==========================================

  return createPortal(
    // 1. Removed 'touch-none' from here so buttons work
    <div className="fixed top-0 left-0 w-full h-[100dvh] bg-black/95 z-[9999] flex flex-col overflow-hidden overscroll-none">
      {/* 2. Added 'relative z-50' here to ensure header sits on top */}
      <div className="relative z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-2 sm:p-3 flex justify-between items-center flex-shrink-0 border-b border-white/10 safe-area-top">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
            <PenTool className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white">
              Fin Check Image Editor Pro
            </h2>
            <p className="text-[10px] text-indigo-100 hidden sm:block">
              Professional QA Annotation Tool
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save Button */}
          {mode === "editor" && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/90 hover:bg-white text-indigo-600 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Save</span>
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
        {mode === "initial" && !isInitializing && (
          <div className="text-center space-y-6 p-4 sm:p-8">
            <div className="flex flex-row justify-center gap-3 sm:gap-6">
              <button
                onClick={startCamera}
                className="group flex flex-col items-center justify-center w-28 h-28 sm:w-40 sm:h-40 bg-gray-800 hover:bg-indigo-600 border-2 border-gray-700 hover:border-indigo-500 rounded-2xl transition-all duration-300 shadow-lg"
              >
                <Camera className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 group-hover:text-white mb-2 sm:mb-3" />
                <span className="text-xs sm:text-base text-gray-300 group-hover:text-white font-semibold">
                  Take Photo
                </span>
              </button>

              <label className="group flex flex-col items-center justify-center w-28 h-28 sm:w-40 sm:h-40 bg-gray-800 hover:bg-emerald-600 border-2 border-gray-700 hover:border-emerald-500 rounded-2xl cursor-pointer transition-all duration-300 shadow-lg">
                <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 group-hover:text-white mb-2 sm:mb-3" />
                <span className="text-xs sm:text-base text-gray-300 group-hover:text-white font-semibold">
                  Upload
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        )}

        {/* STATE: CAMERA */}
        {mode === "camera" && (
          <div className="relative w-full h-full bg-black flex flex-col items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />

            <div className="absolute bottom-8 flex items-center gap-4 sm:gap-8 bg-black/50 px-4 sm:px-8 py-4 rounded-full backdrop-blur-md border border-white/10 safe-area-bottom">
              <button
                onClick={() => {
                  stopCamera();
                  handleCancel();
                }}
                className="p-2 sm:p-3 bg-gray-700 rounded-full text-white hover:bg-gray-600 transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <button
                onClick={captureImage}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full border-4 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:scale-105 transition-transform active:scale-95"
              />

              {deviceType !== "desktop" && (
                <button
                  onClick={switchCamera}
                  className="p-2 sm:p-3 bg-gray-700 rounded-full text-white hover:bg-gray-600 transition-colors"
                  title="Switch Camera"
                >
                  <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STATE: EDITOR */}
        {mode === "editor" && imgSrc && (
          <>
            <canvas
              id="image-editor-canvas"
              ref={canvasRef}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onWheel={handleWheel}
              onTouchStart={handleStart}
              onTouchMove={(e) => {
                handleTouchMove(e);
                handleMove(e);
              }}
              onTouchEnd={() => {
                handleEnd();
                handleTouchEndZoom();
              }}
              className="object-contain cursor-crosshair touch-none shadow-2xl block"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${
                  pan.y / zoom
                }px)`,
                transformOrigin: "center center"
              }}
            />

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
          </>
        )}
      </div>

      {/* TOOLBAR (Editor Only) */}
      {mode === "editor" && (
        <div className="bg-gray-800 border-t border-gray-700 flex-shrink-0 safe-area-bottom z-50 relative">
          {/* Settings Panel - Collapsible */}
          {showSettings && (
            <div className="p-3 border-b border-gray-700 bg-gray-900/50">
              <div className="flex flex-wrap items-center justify-center gap-4">
                {/* Colors */}
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

                {/* Line Width */}
                <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
                  <button
                    onClick={() => setLineWidth(Math.max(1, lineWidth - 1))}
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
                    onClick={() => setLineWidth(Math.min(20, lineWidth + 1))}
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
            {/* Drawing Tools */}
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
                  onClick={() => setActiveTool(tool.id)}
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
            </div>

            {/* Zoom Controls */}
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

            {/* Actions */}
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
