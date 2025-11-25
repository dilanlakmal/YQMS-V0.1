import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Upload,
  RotateCcw,
  Type,
  Move,
  ArrowRight,
  Square,
  Circle as CircleIcon,
  PenTool,
  Download,
  X,
  Check,
  Trash2,
  Undo2,
  Palette,
  Monitor,
  Smartphone,
  Image as ImageIcon
} from "lucide-react";

const YPivotQATemplatesImageEditor = () => {
  // --- Modes & State ---
  const [mode, setMode] = useState("initial"); // 'initial', 'camera', 'editor'
  const [imgSrc, setImgSrc] = useState(null);

  // --- Camera State ---
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // 'user' or 'environment'

  // --- Editor State ---
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [context, setContext] = useState(null);

  // History for Undo
  // Each item: { type: 'line'|'arrow'|'rect'|'circle'|'text', color, width, points: [], x, y, w, h, text }
  const [history, setHistory] = useState([]);
  const [currentAction, setCurrentAction] = useState(null);

  // Tools
  const [activeTool, setActiveTool] = useState("pen"); // pen, arrow, rect, circle, text
  const [color, setColor] = useState("#ef4444"); // Default Red for defects
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // Text Input Modal State
  const [showTextInput, setShowTextInput] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });

  // ==========================================
  // 1. CAMERA & UPLOAD LOGIC
  // ==========================================

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setMode("camera");
    } catch (err) {
      console.error("Camera Error:", err);
      alert("Unable to access camera. Please check permissions.");
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
      const url = URL.createObjectURL(file);
      setImgSrc(url);
      setMode("editor");
    }
  };

  // ==========================================
  // 2. CANVAS RENDERING ENGINE
  // ==========================================

  // Initialize Canvas when entering Editor mode
  useEffect(() => {
    if (
      mode === "editor" &&
      imgSrc &&
      canvasRef.current &&
      containerRef.current
    ) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Responsive resizing logic
        const containerWidth = containerRef.current.clientWidth;
        const scale = containerWidth / img.width;
        const canvasWidth = containerWidth;
        const canvasHeight = img.height * scale;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        setContext(ctx);
        redrawCanvas(ctx, img, history);
      };
      img.src = imgSrc;
    }
  }, [mode, imgSrc, history]); // Re-run when history changes to redraw

  // Main Draw Function
  const redrawCanvas = (ctx, img, historyData) => {
    if (!ctx) return;

    // 1. Clear & Draw Background Image
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);

    // 2. Draw History Items
    [...historyData, currentAction].forEach((item) => {
      if (!item) return;

      ctx.beginPath();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = item.color;

      if (item.type === "pen") {
        if (item.points.length > 0) {
          ctx.moveTo(item.points[0].x, item.points[0].y);
          item.points.forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
      } else if (item.type === "arrow") {
        drawArrow(ctx, item.x, item.y, item.endX, item.endY);
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
        ctx.font = `bold 24px sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(item.text, item.x, item.y);
      }
    });
  };

  // Helper: Draw Arrow
  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headlen = 15;
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
    ctx.lineTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.fill();
  };

  // ==========================================
  // 3. INTERACTION HANDLERS
  // ==========================================

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStart = (e) => {
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
      // Placeholder for shapes/arrows
      setCurrentAction({
        type: activeTool,
        color: color,
        width: lineWidth,
        x: pos.x,
        y: pos.y,
        w: 0,
        h: 0, // for shapes
        endX: pos.x,
        endY: pos.y // for arrows
      });
    }
  };

  const handleMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent scrolling on touch
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

  // --- Text Handling ---
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

  // --- Undo / Clear / Download ---
  const undoLast = () => {
    setHistory((prev) => prev.slice(0, -1));
  };

  const clearAll = () => {
    if (window.confirm("Clear all edits?")) {
      setHistory([]);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `QA_Inspection_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const resetEditor = () => {
    setMode("initial");
    setImgSrc(null);
    setHistory([]);
    stopCamera();
  };

  // ==========================================
  // 4. UI RENDERING
  // ==========================================

  return (
    <div className="min-h-[600px] bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col relative animate-fadeIn transition-colors duration-300">
      {/* ---------------- HEADER ---------------- */}
      <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-10">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <PenTool className="w-5 h-5 text-indigo-500" />
          QA Image Editor
        </h2>
        {mode === "editor" && (
          <button
            onClick={resetEditor}
            className="text-gray-500 hover:text-red-500 dark:text-gray-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* ---------------- CONTENT AREA ---------------- */}
      <div
        className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden"
        ref={containerRef}
      >
        {/* STATE: INITIAL */}
        {mode === "initial" && (
          <div className="text-center space-y-6 p-8">
            <div className="flex justify-center gap-6">
              <button
                onClick={startCamera}
                className="group flex flex-col items-center justify-center w-40 h-40 bg-gray-800 hover:bg-indigo-600 border-2 border-gray-700 hover:border-indigo-500 rounded-2xl transition-all duration-300 shadow-lg"
              >
                <Camera className="w-12 h-12 text-gray-400 group-hover:text-white mb-3" />
                <span className="text-gray-300 group-hover:text-white font-semibold">
                  Take Photo
                </span>
              </button>

              <label className="group flex flex-col items-center justify-center w-40 h-40 bg-gray-800 hover:bg-emerald-600 border-2 border-gray-700 hover:border-emerald-500 rounded-2xl cursor-pointer transition-all duration-300 shadow-lg">
                <Upload className="w-12 h-12 text-gray-400 group-hover:text-white mb-3" />
                <span className="text-gray-300 group-hover:text-white font-semibold">
                  Upload
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            <p className="text-gray-500 text-sm">
              Supported formats: JPEG, PNG
            </p>
          </div>
        )}

        {/* STATE: CAMERA */}
        {mode === "camera" && (
          <div className="relative w-full h-full bg-black flex flex-col items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />

            {/* Camera Controls Overlay */}
            <div className="absolute bottom-8 flex items-center gap-8 bg-black/50 px-8 py-4 rounded-full backdrop-blur-md border border-white/10">
              <button
                onClick={() => setMode("initial")}
                className="p-3 bg-gray-700 rounded-full text-white hover:bg-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={captureImage}
                className="w-20 h-20 bg-white rounded-full border-4 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:scale-105 transition-transform"
              />
              <button
                onClick={() =>
                  setFacingMode((prev) =>
                    prev === "user" ? "environment" : "user"
                  )
                }
                className="p-3 bg-gray-700 rounded-full text-white hover:bg-gray-600"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* STATE: EDITOR */}
        {mode === "editor" && (
          <>
            <canvas
              ref={canvasRef}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
              className="max-w-full max-h-full object-contain cursor-crosshair touch-none"
            />

            {/* Text Input Overlay */}
            {showTextInput && (
              <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-80 animate-bounce-in">
                  <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
                    Enter Text
                  </h3>
                  <input
                    type="text"
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    autoFocus
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Defect note..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowTextInput(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmText}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
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

      {/* ---------------- TOOLBAR (Editor Only) ---------------- */}
      {mode === "editor" && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2">
          {/* Row 1: Colors & Actions */}
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 dark:border-gray-700 px-2">
            {/* Colors */}
            <div className="flex gap-2 items-center">
              <Palette className="w-4 h-4 text-gray-400 mr-1" />
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
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c
                      ? "border-gray-900 dark:border-white scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Undo / Clear / Download */}
            <div className="flex gap-2">
              <button
                onClick={undoLast}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
                title="Undo"
              >
                <Undo2 className="w-5 h-5" />
              </button>
              <button
                onClick={clearAll}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400"
                title="Clear All"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={downloadImage}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium ml-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Save
              </button>
            </div>
          </div>

          {/* Row 2: Drawing Tools */}
          <div className="flex justify-center gap-2 overflow-x-auto scrollbar-hide py-1">
            {[
              { id: "pen", icon: PenTool, label: "Pen" },
              { id: "arrow", icon: ArrowRight, label: "Arrow" },
              { id: "rect", icon: Square, label: "Box" },
              { id: "circle", icon: CircleIcon, label: "Circle" },
              { id: "text", icon: Type, label: "Text" }
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`
                            flex flex-col items-center justify-center w-16 py-2 rounded-xl transition-all duration-200
                            ${
                              activeTool === tool.id
                                ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 shadow-inner"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }
                        `}
              >
                <tool.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default YPivotQATemplatesImageEditor;
