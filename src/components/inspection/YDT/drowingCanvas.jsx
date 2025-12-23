// components/DrawingCanvas.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  MousePointer, Hand, Pencil, Eraser, Minus, ArrowRight, Square, Circle, Triangle,
  Type, Undo, Redo, Trash2, Download, Upload, Save, Eye, EyeOff, Plus,
  Move, RotateCcw, Copy, Scissors, Palette, ZoomIn, ZoomOut, RotateCw,
  Grid3X3, Maximize, Target, Settings, Info, X, Check, AlertCircle
} from 'lucide-react';

const DrawingCanvas = ({ 
  backgroundImage, 
  onSave, 
  width = 900, 
  height = 900,
  className = '' 
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [tool, setTool] = useState('select');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  
  // View states
  const [zoom, setZoom] = useState(0.54);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // History
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDirty, setIsDirty] = useState(false);
  
  // Grid
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  
  // Object management
  const [drawnObjects, setDrawnObjects] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  const [isDraggingObjects, setIsDraggingObjects] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [objectIdCounter, setObjectIdCounter] = useState(0);
  
  // Enhanced interaction states
  const [panStartPoint, setPanStartPoint] = useState({ x: 0, y: 0 });
  const [panStartOffset, setPanStartOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Transform states
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [rotationCenter, setRotationCenter] = useState({ x: 0, y: 0 });
  const [initialRotation, setInitialRotation] = useState(0);
  const [transformStartPos, setTransformStartPos] = useState({ x: 0, y: 0 });
  const [initialObjectState, setInitialObjectState] = useState(null);
  const [isProportionalResize, setIsProportionalResize] = useState(false);
  
  // Drawing state
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState([]);
  const [textInput, setTextInput] = useState({ show: false, x: 0, y: 0, text: '' });
  const [editingId, setEditingId] = useState(null);
  const [previewShape, setPreviewShape] = useState(null);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [showTransformHint, setShowTransformHint] = useState(false);
  const [resizeInfo, setResizeInfo] = useState(null);
  
  // Extended canvas dimensions
  const [canvasWidth] = useState(width * 3);
  const [canvasHeight] = useState(height * 3);
  
  // Professional color palette
  const strokeColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#800000', '#008000', '#000080', '#808000',
    '#800080', '#008080', '#C0C0C0', '#808080'
  ];

  // Object creation helper with enhanced properties
  const createDrawnObject = (type, data) => {
    const id = `obj_${objectIdCounter}_${Date.now()}`;
    setObjectIdCounter(prev => prev + 1);
    
    const newObject = {
      id,
      type,
      data: { ...data },
      strokeColor,
      fillColor,
      strokeWidth,
      fontSize: type === 'text' ? (data.fontSize || fontSize) : fontSize,
      fontFamily: type === 'text' ? (data.fontFamily || fontFamily) : fontFamily,
      selected: false,
      visible: true,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      transformOrigin: { x: 0, y: 0 }
    };
    
    // Calculate bounds immediately
    newObject.bounds = calculateObjectBounds(type, data);
    newObject.transformOrigin = {
      x: newObject.bounds.x + newObject.bounds.width / 2,
      y: newObject.bounds.y + newObject.bounds.height / 2
    };
    
    return newObject;
  };

  // Enhanced bounds calculation
  const calculateObjectBounds = (type, data, scaleX = 1, scaleY = 1) => {
    const padding = 10;
    
    switch (type) {
      case 'text':
        // Create a temporary canvas to measure text accurately
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        const fontSize = data.fontSize || 16;
        const fontFamily = data.fontFamily || 'Arial';
        const text = data.text || '';
        
        tempCtx.font = `${fontSize}px ${fontFamily}`;
        
        // Handle multi-line text
        const lines = text.split('\n');
        let maxWidth = 0;
        
        lines.forEach(line => {
          const metrics = tempCtx.measureText(line);
          maxWidth = Math.max(maxWidth, metrics.width);
        });
        
        const textWidth = maxWidth * scaleX;
        const textHeight = (fontSize * lines.length * 1.2) * scaleY; // 1.2 for line height
        
        return {
          x: data.x - padding,
          y: data.y - padding,
          width: textWidth + (padding * 2),
          height: textHeight + (padding * 2)
        };
        
      case 'line':
      case 'arrow':
        return {
          x: Math.min(data.x1, data.x2) - padding,
          y: Math.min(data.y1, data.y2) - padding,
          width: Math.abs(data.x2 - data.x1) * scaleX + (padding * 2),
          height: Math.abs(data.y2 - data.y1) * scaleY + (padding * 2)
        };
      
      case 'rectangle':
        return {
          x: Math.min(data.x, data.x + data.width) - padding,
          y: Math.min(data.y, data.y + data.height) - padding,
          width: Math.abs(data.width) * scaleX + (padding * 2),
          height: Math.abs(data.height) * scaleY + (padding * 2)
        };
      
      case 'circle':
        return {
          x: data.x - data.radius * scaleX - padding,
          y: data.y - data.radius * scaleY - padding,
          width: (data.radius * 2 * scaleX) + (padding * 2),
          height: (data.radius * 2 * scaleY) + (padding * 2)
        };
      
      case 'path':
        if (!data.points || data.points.length === 0) {
          return { x: 0, y: 0, width: 0, height: 0 };
        }
        const xs = data.points.map(p => p.x);
        const ys = data.points.map(p => p.y);
        return {
          x: Math.min(...xs) - padding,
          y: Math.min(...ys) - padding,
          width: (Math.max(...xs) - Math.min(...xs)) * scaleX + (padding * 2),
          height: (Math.max(...ys) - Math.min(...ys)) * scaleY + (padding * 2)
        };
      
      case 'triangle':
        const minX = Math.min(data.x1, data.x2, data.x1 + (data.x2 - data.x1) / 2);
        const maxX = Math.max(data.x1, data.x2, data.x1 + (data.x2 - data.x1) / 2);
        const minY = Math.min(data.y1, data.y2);
        const maxY = Math.max(data.y1, data.y2);
        return {
          x: minX - padding,
          y: minY - padding,
          width: (maxX - minX) * scaleX + (padding * 2),
          height: (maxY - minY) * scaleY + (padding * 2)
        };
        
      case 'image':
        return {
          x: data.x - padding,
          y: data.y - padding,
          width: data.width * scaleX + (padding * 2),
          height: data.height * scaleY + (padding * 2)
        };
      
      default:
        return { x: 0, y: 0, width: 0, height: 0 };
    }
  };

  // Add background image as an object when it changes
  useEffect(() => {
    if (backgroundImage) {
      const imageX = (canvasWidth - width) / 2;
      const imageY = (canvasHeight - height) / 2;
      
      // Check if image object already exists
      const existingImageIndex = drawnObjects.findIndex(obj => obj.type === 'image' && obj.id.includes('background'));
      const existingImage = existingImageIndex >= 0 ? drawnObjects[existingImageIndex] : null;
      
      // If image exists and the source is the same, do nothing.
      if (existingImage && existingImage.data.src === backgroundImage) {
        return;
      }
      
      const imageObject = createDrawnObject('image', {
        x: imageX,
        y: imageY,
        width: width,
        height: height,
        src: backgroundImage
      });
      imageObject.id = 'background_image';
      
      if (existingImageIndex >= 0) {
        // Update existing image
        setDrawnObjects(prev => {
          const newObjects = [...prev];
          newObjects[existingImageIndex] = imageObject;
          return newObjects;
        });
      } else {
        // Add new image at the beginning (background)
        setDrawnObjects(prev => [imageObject, ...prev]);
      }
    }
  }, [backgroundImage, canvasWidth, canvasHeight, width, height]);

  // Enhanced point in object detection with rotation
  const isPointInObject = (point, object) => {
    const { bounds, rotation = 0, transformOrigin } = object;
    
    if (rotation === 0) {
      return point.x >= bounds.x && 
             point.x <= bounds.x + bounds.width &&
             point.y >= bounds.y && 
             point.y <= bounds.y + bounds.height;
    }
    
    // For rotated objects, transform the point to object's local space
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const dx = point.x - transformOrigin.x;
    const dy = point.y - transformOrigin.y;
    
    const localX = dx * cos - dy * sin + transformOrigin.x;
    const localY = dx * sin + dy * cos + transformOrigin.y;
    
    return localX >= bounds.x && 
           localX <= bounds.x + bounds.width &&
           localY >= bounds.y && 
           localY <= bounds.y + bounds.height;
  };

  // Get resize handle at point
  const getResizeHandleAtPoint = (point, object) => {
    const { bounds } = object;
    const handleSize = 16; // Larger handle size
    const tolerance = 8; // More tolerance for easier clicking
    
    const handles = [
      { type: 'nw', x: bounds.x, y: bounds.y },
      { type: 'ne', x: bounds.x + bounds.width, y: bounds.y },
      { type: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { type: 'sw', x: bounds.x, y: bounds.y + bounds.height },
      { type: 'n', x: bounds.x + bounds.width / 2, y: bounds.y },
      { type: 'e', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
      { type: 's', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
      { type: 'w', x: bounds.x, y: bounds.y + bounds.height / 2 }
    ];
    
    for (const handle of handles) {
      const distance = Math.sqrt(
        Math.pow(point.x - handle.x, 2) + Math.pow(point.y - handle.y, 2)
      );
      
      if (distance <= (handleSize / 2 + tolerance)) {
        return handle.type;
      }
    }
    
    return null;
  };

  // Get rotation handle at point
  const getRotationHandleAtPoint = (point, object) => {
    const { bounds } = object;
    const handleSize = 8;
    const rotationHandle = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y - 30
    };
    
    if (point.x >= rotationHandle.x - handleSize/2 && 
        point.x <= rotationHandle.x + handleSize/2 &&
        point.y >= rotationHandle.y - handleSize/2 && 
        point.y <= rotationHandle.y + handleSize/2) {
      return true;
    }
    
    return false;
  };

  // Find objects at point
  const findObjectsAtPoint = (point) => {
    return drawnObjects
      .filter(obj => obj.visible && isPointInObject(point, obj))
      .reverse();
  };

  // Complete redraw function
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Light gray background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw white placeholder area
    const imageX = (canvasWidth - width) / 2;
    const imageY = (canvasHeight - height) / 2;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(imageX, imageY, width, height);
    
    // Dashed border for canvas area
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(imageX, imageY, width, height);
    ctx.setLineDash([]);
    
    drawAllObjects(ctx);
    drawPreviewShape(ctx);
  }, [drawnObjects, selectedObjects, previewShape, canvasWidth, canvasHeight, width, height]);

  // Draw all objects with transforms
  const drawAllObjects = (ctx) => {
    ctx.save();
    
    drawnObjects.forEach(obj => {
      if (obj.visible) {
        drawObjectWithTransform(ctx, obj);
      }
    });
    
    drawnObjects.forEach(obj => {
      if (obj.visible && selectedObjects.includes(obj.id)) {
        drawSelectionHandles(ctx, obj);
      }
    });
    
    ctx.restore();
  };

  // Draw object with transform applied
  const drawObjectWithTransform = (ctx, obj) => {
    ctx.save();
    
    // Apply transforms
    if (obj.rotation !== 0 || obj.scaleX !== 1 || obj.scaleY !== 1) {
      const origin = obj.transformOrigin;
      ctx.translate(origin.x, origin.y);
      ctx.rotate(obj.rotation || 0);
      ctx.scale(obj.scaleX || 1, obj.scaleY || 1);
      ctx.translate(-origin.x, -origin.y);
    }
    
    drawObject(ctx, obj);
    
    ctx.restore();
  };

  // Draw preview shape
  const drawPreviewShape = (ctx) => {
    if (!previewShape) return;
    
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = strokeWidth;
    ctx.setLineDash([5, 5]);
    
    drawObject(ctx, { ...previewShape, strokeColor, fillColor, strokeWidth });
    
    ctx.restore();
  };

  // Enhanced draw individual object
  const drawObject = (ctx, obj) => {
    ctx.save();
    
    ctx.strokeStyle = obj.strokeColor || '#000000';
    ctx.fillStyle = obj.fillColor || 'transparent';
    ctx.lineWidth = obj.strokeWidth || 2;
    
    switch (obj.type) {
      case 'text':
        // Set text properties BEFORE drawing
        const fontSize = obj.fontSize || obj.data.fontSize || 16;
        const fontFamily = obj.fontFamily || obj.data.fontFamily || 'Arial';
        
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = obj.strokeColor || '#000000'; // Use strokeColor for text color
        ctx.textBaseline = 'top'; // Important: set baseline to top
        
        // Handle multi-line text
        const text = obj.data.text || '';
        const lines = text.split('\n');
        const lineHeight = fontSize * 1.2; // Standard line height
        
        lines.forEach((line, index) => {
          ctx.fillText(line, obj.data.x, obj.data.y + (index * lineHeight));
        });
        break;
        
      case 'line':
        ctx.beginPath();
        ctx.moveTo(obj.data.x1, obj.data.y1);
        ctx.lineTo(obj.data.x2, obj.data.y2);
        ctx.stroke();
        break;
        
      case 'rectangle':
        if (obj.fillColor && obj.fillColor !== 'transparent') {
          ctx.fillRect(obj.data.x, obj.data.y, obj.data.width, obj.data.height);
        }
        ctx.strokeRect(obj.data.x, obj.data.y, obj.data.width, obj.data.height);
        break;
        
      case 'circle':
        ctx.beginPath();
        ctx.arc(obj.data.x, obj.data.y, obj.data.radius, 0, 2 * Math.PI);
        if (obj.fillColor && obj.fillColor !== 'transparent') {
          ctx.fill();
        }
        ctx.stroke();
        break;
        
      case 'path':
        if (obj.data.points && obj.data.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(obj.data.points[0].x, obj.data.points[0].y);
          for (let i = 1; i < obj.data.points.length; i++) {
            ctx.lineTo(obj.data.points[i].x, obj.data.points[i].y);
          }
          ctx.stroke();
        }
        break;
        
      case 'arrow':
        drawArrowObject(ctx, obj.data);
        break;
        
      case 'triangle':
        drawTriangleObject(ctx, obj.data, obj.fillColor);
        break;
        
      case 'image':
        if (obj.data.src) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, obj.data.x, obj.data.y, obj.data.width, obj.data.height);
          };
          img.src = obj.data.src;
        }
        break;
    }
    
    ctx.restore();
  };

  // Enhanced selection handles with resize and rotation handles
  const drawSelectionHandles = (ctx, obj) => {
    const { bounds } = obj;
    const handleSize = obj.type === 'text' ? 8 : 10; // Smaller handles for text
    
    ctx.save();
    
    // Selection border - different style for text
    if (obj.type === 'text') {
      ctx.strokeStyle = '#10b981'; // Green for text
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
    } else {
      ctx.strokeStyle = '#0066cc';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
    }
    
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.setLineDash([]);
    
    // Only show resize handles for non-text objects or when specifically resizing
    if (obj.type !== 'text' || isResizing) {
      // Resize handles with better visibility
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = obj.type === 'text' ? '#10b981' : '#0066cc';
      ctx.lineWidth = 2;
      
      const handles = [
        { x: bounds.x, y: bounds.y }, // nw
        { x: bounds.x + bounds.width, y: bounds.y }, // ne
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // se
        { x: bounds.x, y: bounds.y + bounds.height }, // sw
        { x: bounds.x + bounds.width / 2, y: bounds.y }, // n
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }, // e
        { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // s
        { x: bounds.x, y: bounds.y + bounds.height / 2 } // w
      ];
      
      handles.forEach(handle => {
        ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
        ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
      });
    }
    
    // Special indicator for text objects
    if (obj.type === 'text') {
      // Add a small text icon
      ctx.fillStyle = '#10b981';
      ctx.font = '12px Arial';
      ctx.fillText('T', bounds.x + bounds.width + 5, bounds.y + 12);
    }
    
    // Rotation handle (only for non-text or when specifically rotating)
    if (obj.type !== 'text' || isRotating) {
      const rotationHandle = {
        x: bounds.x + bounds.width / 2,
        y: bounds.y - 30
      };
      
      // Line to rotation handle
      ctx.beginPath();
      ctx.moveTo(bounds.x + bounds.width / 2, bounds.y);
      ctx.lineTo(rotationHandle.x, rotationHandle.y);
      ctx.stroke();
      
      // Rotation handle circle
      ctx.beginPath();
      ctx.arc(rotationHandle.x, rotationHandle.y, handleSize/2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    
    ctx.restore();
  };

  // Arrow drawing function
  const drawArrowObject = (ctx, data) => {
    const headLength = 15;
    const angle = Math.atan2(data.y2 - data.y1, data.x2 - data.x1);
    
    ctx.beginPath();
    ctx.moveTo(data.x1, data.y1);
    ctx.lineTo(data.x2, data.y2);
    
    ctx.moveTo(data.x2, data.y2);
    ctx.lineTo(
      data.x2 - headLength * Math.cos(angle - Math.PI / 6),
      data.y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    
    ctx.moveTo(data.x2, data.y2);
    ctx.lineTo(
      data.x2 - headLength * Math.cos(angle + Math.PI / 6),
      data.y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    
    ctx.stroke();
  };

  // Triangle drawing function
  const drawTriangleObject = (ctx, data, fillColor) => {
    const width = data.x2 - data.x1;
    const height = data.y2 - data.y1;
    
    ctx.beginPath();
    ctx.moveTo(data.x1 + width / 2, data.y1);
    ctx.lineTo(data.x1, data.y2);
    ctx.lineTo(data.x2, data.y2);
    ctx.closePath();
    
    if (fillColor && fillColor !== 'transparent') {
      ctx.fill();
    }
    ctx.stroke();
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;
    
    const initialState = {
      objects: [],
      timestamp: Date.now()
    };
    setHistory([initialState]);
    setHistoryIndex(0);
    
    redrawCanvas();
  }, []);

  useEffect(() => {
    redrawCanvas();
  }, [drawnObjects, selectedObjects, redrawCanvas]);

  // Save to history
  const saveToHistory = useCallback(() => {
    const historyState = {
      objects: JSON.parse(JSON.stringify(drawnObjects)),
      timestamp: Date.now()
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(historyState);
    setHistory(newHistory);
    setIsDirty(true); // Mark canvas as dirty when history is saved
    setHistoryIndex(newHistory.length - 1);
  }, [drawnObjects, history, historyIndex]);

  // Object manipulation functions
  const deleteSelectedObjects = () => {
    setDrawnObjects(prev => prev.filter(obj => !selectedObjects.includes(obj.id)));
    setSelectedObjects([]);
    saveToHistory();
  };

  const selectAllObjects = () => {
    setSelectedObjects(drawnObjects.map(obj => obj.id));
  };

  const copySelectedObjects = () => {
    console.log('Copy selected objects:', selectedObjects);
  };

  // Separate function to finish text editing
  const finishTextEditing = () => {
    if (!textInput.text.trim()) {
      // If text is empty, remove the object if editing, or just cancel if new
      if (editingId) {
        setDrawnObjects(prev => prev.filter(obj => obj.id !== editingId));
      }
    } else {
      // Update or create text object
      if (editingId) {
        // Update existing text
        setDrawnObjects(prev => prev.map(obj => {
          if (obj.id === editingId) {
            const newObj = {
              ...obj,
              data: { 
                ...obj.data, 
                text: textInput.text,
                fontSize: fontSize,
                fontFamily: fontFamily
              },
              fontSize: fontSize,
              fontFamily: fontFamily,
              strokeColor: strokeColor // Make sure color is applied
            };
            
            // Recalculate bounds with new text
            newObj.bounds = calculateObjectBounds('text', newObj.data, newObj.scaleX || 1, newObj.scaleY || 1);
            newObj.transformOrigin = {
              x: newObj.bounds.x + newObj.bounds.width / 2,
              y: newObj.bounds.y + newObj.bounds.height / 2
            };
            
            return newObj;
          }
          return obj;
        }));
      } else {
        // Create new text object
        const newObject = createDrawnObject('text', {
          x: textInput.x,
          y: textInput.y,
          text: textInput.text,
          fontSize: fontSize,
          fontFamily: fontFamily
        });
        
        // Ensure the text object has the current stroke color
        newObject.strokeColor = strokeColor;
        
        setDrawnObjects(prev => [...prev, newObject]);
      }
      saveToHistory();
    }
    
    // Clean up editing state
    setTextInput({ show: false, x: 0, y: 0, text: '', screenX: 0, screenY: 0 });
    setEditingId(null);
    setIsInlineEditing(false);
  };

  // Function to cancel text editing
  const cancelTextEditing = () => {
    setTextInput({ show: false, x: 0, y: 0, text: '', screenX: 0, screenY: 0 });
    setEditingId(null);
    setIsInlineEditing(false);
  };

  // Handle the text editing
  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvasPos = getCanvasCoordinates(e);
    const objectsAtPoint = findObjectsAtPoint(canvasPos);
    
    if (objectsAtPoint.length > 0) {
      const targetObj = objectsAtPoint[0];
      
      // Always select the object first
      setSelectedObjects([targetObj.id]);
      
      // Special handling for text objects - enable inline editing
      if (targetObj.type === 'text') {
        setEditingId(targetObj.id);
        setIsInlineEditing(true);
        
        // Position the inline editor at the text location
        const screenX = (targetObj.data.x + pan.x) * zoom;
        const screenY = (targetObj.data.y + pan.y) * zoom;
        
        setTextInput({
          show: true,
          x: targetObj.data.x,
                   y: targetObj.data.y,
          text: targetObj.data.text || '',
          screenX: screenX,
          screenY: screenY - 35 // Position above the text
        });
        
        // Temporarily switch to select tool for better UX
        setTool('select');
      } else {
        // For non-text objects, just ensure they're selected and ready for transform
        setTool('select'); // Switch to select tool
        setIsInlineEditing(false);
        setEditingId(null);
      }
    }
  };

  // Enhanced move function
  const moveSelectedObjects = (deltaX, deltaY) => {
    setDrawnObjects(prev => prev.map(obj => {
      if (selectedObjects.includes(obj.id)) {
        const newObj = { ...obj };
        
        switch (obj.type) {
          case 'line':
          case 'arrow':
            newObj.data = {
              ...obj.data,
              x1: obj.data.x1 + deltaX,
              y1: obj.data.y1 + deltaY,
              x2: obj.data.x2 + deltaX,
              y2: obj.data.y2 + deltaY
            };
            break;
            
          case 'rectangle':
          case 'text':
          case 'image':
            newObj.data = {
              ...obj.data,
              x: obj.data.x + deltaX,
              y: obj.data.y + deltaY
            };
            break;
            
          case 'circle':
            newObj.data = {
              ...obj.data,
              x: obj.data.x + deltaX,
              y: obj.data.y + deltaY
            };
            break;
            
          case 'path':
            newObj.data = {
              ...obj.data,
              points: obj.data.points.map(point => ({
                x: point.x + deltaX,
                y: point.y + deltaY
              }))
            };
            break;
            
          case 'triangle':
            newObj.data = {
              ...obj.data,
              x1: obj.data.x1 + deltaX,
              y1: obj.data.y1 + deltaY,
              x2: obj.data.x2 + deltaX,
              y2: obj.data.y2 + deltaY
            };
            break;
        }
        
        newObj.bounds = calculateObjectBounds(newObj.type, newObj.data, newObj.scaleX, newObj.scaleY);
        newObj.transformOrigin = {
          x: newObj.bounds.x + newObj.bounds.width / 2,
          y: newObj.bounds.y + newObj.bounds.height / 2
        };
        return newObj;
      }
      return obj;
    }));
  };

  // Resize selected objects with improved UX
  const resizeSelectedObjects = (handle, startPos, currentPos, proportional = false) => {
    if (!initialObjectState) return;
    
    setDrawnObjects(prev => prev.map(obj => {
      if (selectedObjects.includes(obj.id)) {
        const initialObj = initialObjectState.find(o => o.id === obj.id);
        if (!initialObj) return obj;
        
        const newObj = { ...obj };
        const { type, data: initialData } = initialObj;
        
        // Calculate delta from initial position
        const deltaX = currentPos.x - startPos.x;
        const deltaY = currentPos.y - startPos.y;
        
        switch (type) {
          case 'rectangle':
          case 'image':
            let { x, y, width, height } = initialData;
            let newX = x, newY = y, newWidth = width, newHeight = height;
            
            // Calculate aspect ratio for proportional resize
            const aspectRatio = width / height;
            
            if (handle.includes('w')) {
              newWidth = width - deltaX;
              newX = x + deltaX;
            } else if (handle.includes('e')) {
              newWidth = width + deltaX;
            }
            
            if (handle.includes('n')) {
              newHeight = height - deltaY;
              newY = y + deltaY;
            } else if (handle.includes('s')) {
              newHeight = height + deltaY;
            }
            
            // Proportional resize for corner handles or when Shift is pressed
            if (proportional && (handle.length === 2)) {
              if (Math.abs(deltaX) > Math.abs(deltaY)) {
                newHeight = newWidth / aspectRatio;
                if (handle.includes('n')) newY = y + height - newHeight;
              } else {
                newWidth = newHeight * aspectRatio;
                if (handle.includes('w')) newX = x + width - newWidth;
              }
            }
            
            // Apply minimum size
            if (newWidth > 10 && newHeight > 10) {
              newObj.data = { ...initialData, x: newX, y: newY, width: newWidth, height: newHeight };
            }
            break;
            
          case 'circle':
            const { x: cx, y: cy, radius } = initialData;
            let newRadius = radius;
            
            if (handle.includes('e') || handle.includes('w')) {
              newRadius = radius + (handle.includes('e') ? deltaX : -deltaX);
            } else if (handle.includes('n') || handle.includes('s')) {
              newRadius = radius + (handle.includes('s') ? deltaY : -deltaY);
            } else {
              const avgDelta = (Math.abs(deltaX) + Math.abs(deltaY)) / 2;
              newRadius = radius + (deltaX > 0 || deltaY > 0 ? avgDelta : -avgDelta);
            }
            
            if (newRadius > 5) {
              newObj.data = { ...initialData, radius: newRadius };
            }
            break;
            
          case 'line':
          case 'arrow':
            const { x1, y1, x2, y2 } = initialData;
            
            if (handle.includes('nw') || handle.includes('w') || handle.includes('sw') || handle.includes('n')) {
              newObj.data = { ...initialData, x1: x1 + deltaX, y1: y1 + deltaY };
            } else {
              newObj.data = { ...initialData, x2: x2 + deltaX, y2: y2 + deltaY };
            }
            break;
            
          case 'triangle':
            const { x1: tx1, y1: ty1, x2: tx2, y2: ty2 } = initialData;
            let newX1 = tx1, newY1 = ty1, newX2 = tx2, newY2 = ty2;
            
            if (handle.includes('w')) newX1 = tx1 + deltaX;
            else if (handle.includes('e')) newX2 = tx2 + deltaX;
            
            if (handle.includes('n')) newY1 = ty1 + deltaY;
            else if (handle.includes('s')) newY2 = ty2 + deltaY;
            
            newObj.data = { ...initialData, x1: newX1, y1: newY1, x2: newX2, y2: newY2 };
            break;
            
          case 'text':
            const initialFontSize = initialObj.fontSize || 16;
            const fontSizeChange = deltaY / 2;
            const newFontSize = Math.max(8, Math.min(72, initialFontSize + fontSizeChange));
            newObj.fontSize = newFontSize;
            newObj.data = { ...initialData, fontSize: newFontSize };
            break;
        }
        
        // Recalculate bounds
        newObj.bounds = calculateObjectBounds(newObj.type, newObj.data, newObj.scaleX || 1, newObj.scaleY || 1);
        newObj.transformOrigin = {
          x: newObj.bounds.x + newObj.bounds.width / 2,
          y: newObj.bounds.y + newObj.bounds.height / 2
        };
        
        return newObj;
      }
      return obj;
    }));
  };

  // Rotate selected objects
  const rotateSelectedObjects = (angle) => {
    setDrawnObjects(prev => prev.map(obj => {
      if (selectedObjects.includes(obj.id)) {
        const newObj = { ...obj };
        newObj.rotation = (obj.rotation || 0) + angle;
        return newObj;
      }
      return obj;
    }));
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setDrawnObjects(prevState.objects);
      setSelectedObjects([]);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setDrawnObjects(nextState.objects);
      setSelectedObjects([]);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Get mouse coordinates
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    const canvasX = (clientX / zoom) - pan.x;
    const canvasY = (clientY / zoom) - pan.y;
    
    return { x: canvasX, y: canvasY };
  };

  const getScreenCoordinates = (e) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    
    const rect = container.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Enhanced mouse down handler with better object selection
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvasPos = getCanvasCoordinates(e);
    const screenPos = getScreenCoordinates(e);
    
    // If we're inline editing text, finish editing first
    if (isInlineEditing && textInput.show) {
      finishTextEditing();
      return;
    }
    
    // For any tool, first check if we're clicking on an object
    const objectsAtPoint = findObjectsAtPoint(canvasPos);
    
    if (objectsAtPoint.length > 0) {
      const topObject = objectsAtPoint[0];
      
      // Always select the object when clicked (regardless of current tool)
      if (!selectedObjects.includes(topObject.id)) {
        if (!e.ctrlKey && !e.metaKey) {
          setSelectedObjects([topObject.id]);
        } else {
          setSelectedObjects(prev => [...prev, topObject.id]);
        }
      } else if (e.ctrlKey || e.metaKey) {
        // Deselect if already selected and ctrl/cmd is held
        setSelectedObjects(prev => prev.filter(id => id !== topObject.id));
        return;
      }
      
      // If we're in select mode or clicked on an already selected object, handle transforms
      if (tool === 'select' || selectedObjects.includes(topObject.id)) {
        // Check for resize handle first
        const resizeHandleType = getResizeHandleAtPoint(canvasPos, topObject);
        if (resizeHandleType && selectedObjects.includes(topObject.id)) {
          setIsResizing(true);
          setResizeHandle(resizeHandleType);
          setTransformStartPos(canvasPos);
          setInitialObjectState(drawnObjects.filter(o => selectedObjects.includes(o.id)).map(o => JSON.parse(JSON.stringify(o))));
          setIsProportionalResize(e.shiftKey);
          setShowTransformHint(true);
          return;
        }
        
        // Check for rotation handle
        if (getRotationHandleAtPoint(canvasPos, topObject) && selectedObjects.includes(topObject.id)) {
          setIsRotating(true);
          setRotationCenter(topObject.transformOrigin);
          setInitialRotation(Math.atan2(
            canvasPos.y - topObject.transformOrigin.y,
            canvasPos.x - topObject.transformOrigin.x
          ));
          setShowTransformHint(true);
          return;
        }
        
        // Start dragging the object
        setIsDraggingObjects(true);
        setDragStartPos(canvasPos);
        setShowTransformHint(true);
        return;
      }
    } else {
      // CLICKED ON EMPTY SPACE - Handle unselect logic
      
      // If we have selected objects and we're in select mode, unselect them
      if (selectedObjects.length > 0 && tool === 'select' && !e.ctrlKey && !e.metaKey) {
        setSelectedObjects([]);
        return;
      }
      
      // If we're in a drawing tool and have selected objects, unselect them
      if (selectedObjects.length > 0 && ['pen', 'rectangle', 'circle', 'line', 'arrow', 'triangle', 'text'].includes(tool)) {
        setSelectedObjects([]);
        // Continue with the drawing tool logic below
      }
    }
    
    // Handle tool-specific behavior only if no object was clicked
    if (tool === 'pan') {
      setIsPanning(true);
      setIsDragging(true);
      setPanStartPoint(screenPos);
      setPanStartOffset({ ...pan });
      return;
    }
    
    if (tool === 'select') {
      // Clicked on empty space - start selection box
      if (!e.ctrlKey && !e.metaKey) {
        setSelectedObjects([]);
      }
      setIsSelecting(true);
      setSelectionBox({ x: canvasPos.x, y: canvasPos.y, width: 0, height: 0 });
      return;
    }
    
    // Handle drawing tools
    setIsDrawing(true);
    setStartPos(canvasPos);
    
    if (tool === 'text') {
      setTextInput({ 
        show: true, 
        x: canvasPos.x, 
        y: canvasPos.y, 
        text: '',
        screenX: (canvasPos.x + pan.x) * zoom,
        screenY: (canvasPos.y + pan.y) * zoom
      });
      setIsInlineEditing(true);
      return;
    }
    
    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      setCurrentPath([canvasPos]);
    }
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvasPos = getCanvasCoordinates(e);
    const screenPos = getScreenCoordinates(e);
    
    // Update cursor for better UX
    const canvas = canvasRef.current;
    if (canvas && tool === 'select') {
      const objectsAtPoint = findObjectsAtPoint(canvasPos);
      if (objectsAtPoint.length > 0) {
        const topObject = objectsAtPoint[0];
        if (selectedObjects.includes(topObject.id)) {
          const resizeHandleType = getResizeHandleAtPoint(canvasPos, topObject);
          const isRotationHandle = getRotationHandleAtPoint(canvasPos, topObject);
          
          if (resizeHandleType) {
            const cursors = {
              'nw': 'nw-resize', 'ne': 'ne-resize', 'se': 'se-resize', 'sw': 'sw-resize',
              'n': 'n-resize', 'e': 'e-resize', 's': 's-resize', 'w': 'w-resize'
            };
            canvas.style.cursor = cursors[resizeHandleType] || 'default';
          } else if (isRotationHandle) {
            canvas.style.cursor = 'grab';
          } else {
            canvas.style.cursor = 'move';
          }
        } else {
          canvas.style.cursor = 'pointer';
        }
      } else {
        canvas.style.cursor = 'default';
      }
    }
    
    // Handle panning
    if (isPanning && tool === 'pan' && isDragging) {
      const deltaX = screenPos.x - panStartPoint.x;
      const deltaY = screenPos.y - panStartPoint.y;
      
      setPan({
        x: panStartOffset.x + (deltaX / zoom),
        y: panStartOffset.y + (deltaY / zoom)
      });
      return;
    }
    
    // Handle resizing with smooth feedback
    if (isResizing && selectedObjects.length > 0 && transformStartPos) {
      const deltaX = canvasPos.x - transformStartPos.x;
      const deltaY = canvasPos.y - transformStartPos.y;
      
      setResizeInfo({
        handle: resizeHandle,
        deltaX: Math.round(deltaX),
        deltaY: Math.round(deltaY)
      });
      
      resizeSelectedObjects(resizeHandle, transformStartPos, canvasPos, e.shiftKey || isProportionalResize);
      return;
    }
    
    // Handle rotation
    if (isRotating && selectedObjects.length > 0) {
      const currentAngle = Math.atan2(
        canvasPos.y - rotationCenter.y,
        canvasPos.x - rotationCenter.x
      );
      const deltaAngle = currentAngle - initialRotation;
      
      rotateSelectedObjects(deltaAngle);
      setInitialRotation(currentAngle);
      return;
    }
    
    // Handle object dragging
    if (isDraggingObjects && selectedObjects.length > 0) {
      const deltaX = canvasPos.x - dragStartPos.x;
      const deltaY = canvasPos.y - dragStartPos.y;
      
      moveSelectedObjects(deltaX, deltaY);
      setDragStartPos(canvasPos);
      return;
    }
    
    // Handle selection box
    if (isSelecting && selectionBox) {
      const newSelectionBox = {
        x: Math.min(selectionBox.x, canvasPos.x),
        y: Math.min(selectionBox.y, canvasPos.y),
        width: Math.abs(canvasPos.x - selectionBox.x),
        height: Math.abs(canvasPos.y - selectionBox.y)
      };
      setSelectionBox(newSelectionBox);
      return;
    }
    
    // Handle drawing preview
    if (isDrawing && !['pen', 'highlighter', 'eraser'].includes(tool)) {
      let preview = null;
      
      switch (tool) {
        case 'rectangle':
          preview = {
            type: 'rectangle',
            data: {
              x: startPos.x,
              y: startPos.y,
              width: canvasPos.x - startPos.x,
              height: canvasPos.y - startPos.y
            }
          };
          break;
          
        case 'circle':
          const radius = Math.sqrt(Math.pow(canvasPos.x - startPos.x, 2) + Math.pow(canvasPos.y - startPos.y, 2));
          preview = {
            type: 'circle',
            data: {
              x: startPos.x,
              y: startPos.y,
              radius
            }
          };
          break;
          
        case 'line':
          preview = {
            type: 'line',
            data: {
              x1: startPos.x,
              y1: startPos.y,
              x2: canvasPos.x,
              y2: canvasPos.y
            }
          };
          break;
          
        case 'arrow':
          preview = {
            type: 'arrow',
            data: {
              x1: startPos.x,
              y1: startPos.y,
              x2: canvasPos.x,
              y2: canvasPos.y
            }
          };
          break;
          
        case 'triangle':
          preview = {
            type: 'triangle',
            data: {
              x1: startPos.x,
              y1: startPos.y,
              x2: canvasPos.x,
              y2: canvasPos.y
            }
          };
          break;
      }
      
      setPreviewShape(preview);
      return;
    }

    if (isDrawing && ['pen', 'highlighter', 'eraser'].includes(tool)) {
      setCurrentPath(prev => [...prev, canvasPos]);
    }
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvasPos = getCanvasCoordinates(e);
    setPreviewShape(null);
    setShowTransformHint(false);
    
    if (isPanning) {
      setIsPanning(false);
      setIsDragging(false);
      return;
    }
    
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setInitialObjectState(null);
      setIsProportionalResize(false);
      saveToHistory();
      return;
    }
    
    if (isRotating) {
      setIsRotating(false);
      saveToHistory();
      return;
    }
    
    if (isDraggingObjects) {
      setIsDraggingObjects(false);
      saveToHistory();
      return;
    }
    
    if (isSelecting) {
      setIsSelecting(false);
      
      if (selectionBox && (selectionBox.width > 5 || selectionBox.height > 5)) {
        const selectedIds = drawnObjects
          .filter(obj => {
            const bounds = obj.bounds;
            return bounds.x >= selectionBox.x &&
                   bounds.y >= selectionBox.y &&
                   bounds.x + bounds.width <= selectionBox.x + selectionBox.width &&
                   bounds.y + bounds.height <= selectionBox.y + selectionBox.height;
          })
          .map(obj => obj.id);
        
        if (e.ctrlKey || e.metaKey) {
          setSelectedObjects(prev => [...new Set([...prev, ...selectedIds])]);
        } else {
          setSelectedObjects(selectedIds);
        }
      }
      
      setSelectionBox(null);
      return;
    }
    
    // Handle drawing completion
    if (!isDrawing) return;
    let newObject = null;
    const minDistance = 5;
    
    if (tool === 'rectangle') {
      const width = canvasPos.x - startPos.x;
      const height = canvasPos.y - startPos.y;
      if (Math.abs(width) > minDistance && Math.abs(height) > minDistance) {
        newObject = createDrawnObject('rectangle', {
          x: startPos.x,
          y: startPos.y,
          width,
          height
        });
      }
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(canvasPos.x - startPos.x, 2) + Math.pow(canvasPos.y - startPos.y, 2));
      if (radius > minDistance) {
        newObject = createDrawnObject('circle', {
          x: startPos.x,
          y: startPos.y,
          radius
        });
      }
    } else if (tool === 'line') {
      const distance = Math.sqrt(Math.pow(canvasPos.x - startPos.x, 2) + Math.pow(canvasPos.y - startPos.y, 2));
      if (distance > minDistance) {
        newObject = createDrawnObject('line', {
          x1: startPos.x,
          y1: startPos.y,
          x2: canvasPos.x,
          y2: canvasPos.y
        });
      }
    } else if (tool === 'arrow') {
      const distance = Math.sqrt(Math.pow(canvasPos.x - startPos.x, 2) + Math.pow(canvasPos.y - startPos.y, 2));
      if (distance > minDistance) {
        newObject = createDrawnObject('arrow', {
          x1: startPos.x,
          y1: startPos.y,
          x2: canvasPos.x,
          y2: canvasPos.y
        });
      }
    } else if (tool === 'triangle') {
      const distance = Math.sqrt(Math.pow(canvasPos.x - startPos.x, 2) + Math.pow(canvasPos.y - startPos.y, 2));
      if (distance > minDistance) {
        newObject = createDrawnObject('triangle', {
          x1: startPos.x,
          y1: startPos.y,
          x2: canvasPos.x,
          y2: canvasPos.y
        });
      }
    } else if ((tool === 'pen' || tool === 'highlighter') && currentPath.length > 1) {
      newObject = createDrawnObject('path', {
        points: [...currentPath],
        tool: tool
      });
    }

    if (newObject) {
      setDrawnObjects(prev => [...prev, newObject]);
      saveToHistory();
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const handleMouseLeave = (e) => {
    setPreviewShape(null);
    if (isPanning) {
      setIsPanning(false);
      setIsDragging(false);
    }
    if (isDrawing) {
      setIsDrawing(false);
    }
    if (isDraggingObjects) {
      setIsDraggingObjects(false);
    }
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionBox(null);
    }
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setInitialObjectState(null);
      setIsProportionalResize(false);
    }
    if (isRotating) {
      setIsRotating(false);
    }
  };

  // Clear canvas
  const clearCanvas = () => {
    setDrawnObjects([]);
    setSelectedObjects([]);
    saveToHistory();
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Fit to screen
  const fitToScreen = () => {
    const container = containerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const scaleX = (containerRect.width - 40) / canvasWidth;
    const scaleY = (containerRect.height - 40) / canvasHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    
    setZoom(scale);
    setPan({ x: 0, y: 0 });
  };

  // Focus on image
  const focusOnImage = () => {
    const container = containerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const imageX = (canvasWidth - width) / 2;
    const imageY = (canvasHeight - height) / 2;
    
    const scaleX = (containerRect.width - 40) / width;
    const scaleY = (containerRect.height - 40) / height;
    const scale = Math.min(scaleX, scaleY, 1);
    
    setZoom(scale);
    
    const centerX = (containerRect.width / 2 - imageX * scale) / scale;
    const centerY = (containerRect.height / 2 - imageY * scale) / scale;
    
    setPan({ x: centerX, y: centerY });
  };

  // Center canvas
  const centerCanvas = () => {
    const container = containerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const centerX = (containerRect.width / 2 - canvasWidth * zoom / 2) / zoom;
    const centerY = (containerRect.height / 2 - canvasHeight * zoom / 2) / zoom;
    
    setPan({ x: centerX, y: centerY });
  };

  // Download canvas
  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `sketch_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Save canvas
  const saveCanvas = () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    if (onSave) {
      onSave(imageData);
    }
  };

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC key - unselect all objects and cancel current operations
      if (e.key === 'Escape') {
        e.preventDefault();
        
        // If we're editing text, cancel text editing
        if (isInlineEditing || textInput.show) {
          cancelTextEditing();
          return;
        }
        
        // If we're in any transform mode, cancel it
        if (isResizing || isRotating || isDraggingObjects) {
          setIsResizing(false);
          setIsRotating(false);
          setIsDraggingObjects(false);
          setResizeHandle(null);
          setShowTransformHint(false);
          return;
        }
        
        // Unselect all objects
        if (selectedObjects.length > 0) {
          setSelectedObjects([]);
          return;
        }
        
        // If no objects selected, switch to select tool
        setTool('select');
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjects.length > 0) {
          e.preventDefault();
          deleteSelectedObjects();
        }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAllObjects();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedObjects.length > 0) {
          e.preventDefault();
          copySelectedObjects();
        }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      
      // Tool shortcuts - only if not editing text
      if (!isInlineEditing && !textInput.show) {
        if (e.key === 'v' || e.key === 'V') {
          setTool('select');
        }
               if (e.key === 'h' || e.key === 'H') {
          setTool('pan');
        }
        if (e.key === 'p' || e.key === 'P') {
          setTool('pen');
        }
        if (e.key === 'r' || e.key === 'R') {
          setTool('rectangle');
        }
        if (e.key === 'c' || e.key === 'C') {
          if (!e.ctrlKey && !e.metaKey) {
            setTool('circle');
          }
        }
        if (e.key === 't' || e.key === 'T') {
          setTool('text');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjects, isInlineEditing, textInput.show, isResizing, isRotating, isDraggingObjects]);

  // Tool button component with enhanced styling
  const ToolButton = ({ toolName, icon: Icon, title, active = false, size = 18, variant = 'default' }) => {
    const handleToolChange = () => {
      if (['pen', 'rectangle', 'circle', 'line', 'arrow', 'triangle', 'text', 'eraser'].includes(toolName)) {
        if (selectedObjects.length > 0) {
          setSelectedObjects([]);
        }
      }
      setTool(toolName);
    };

    const getVariantClasses = () => {
      switch (variant) {
        case 'primary':
          return active 
            ? 'bg-blue-600 text-white shadow-lg border-blue-600' 
            : 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700';
        case 'danger':
          return active 
            ? 'bg-red-600 text-white shadow-lg border-red-600' 
            : 'bg-white hover:bg-red-50 border-gray-200 hover:border-red-300 text-gray-700';
        case 'success':
          return active 
            ? 'bg-green-600 text-white shadow-lg border-green-600' 
            : 'bg-white hover:bg-green-50 border-gray-200 hover:border-green-300 text-gray-700';
        default:
          return active 
            ? 'bg-indigo-600 text-white shadow-lg border-indigo-600' 
            : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700';
      }
    };

    return (
      <button
        onClick={handleToolChange}
        title={title}
        className={`p-3 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${getVariantClasses()}`}
      >
        <Icon size={size} />
      </button>
    );
  };

  // Color button component with enhanced styling
  const ColorButton = ({ color, active = false, onClick }) => (
    <button
      onClick={() => onClick(color)}
      className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 transform hover:scale-110 ${
        active ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
      }`}
      style={{ backgroundColor: color }}
      title={`Color: ${color}`}
    />
  );

  return (
    <div className={`drawing-canvas-container ${className} bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen`}>
      {/* Modern Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Pencil className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Drawing Canvas</h2>
              <p className="text-sm text-gray-500">Professional sketching and annotation tool</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-600">
              Objects: {drawnObjects.length}
            </div>
            {selectedObjects.length > 0 && (
              <div className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium text-blue-700">
                Selected: {selectedObjects.length}
              </div>
            )}
            <button
              onClick={downloadCanvas}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            <button
              onClick={saveCanvas}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Save size={16} />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Tool Palette */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Selection Tools */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <MousePointer className="h-4 w-4 mr-2" />
                Selection Tools
              </h3>
              <div className="flex items-center space-x-2">
                <ToolButton 
                  toolName="select" 
                  icon={MousePointer} 
                  title="Select Tool (V) - Move, Resize, Rotate" 
                  active={tool === 'select'}
                  variant="primary"
                />
                <ToolButton 
                  toolName="pan" 
                  icon={Hand} 
                  title="Pan Tool (H)" 
                  active={tool === 'pan'}
                  variant="primary"
                />
                {selectedObjects.length > 0 && (
                  <button
                    onClick={() => setSelectedObjects([])}
                    title="Unselect All (ESC)"
                    className="p-3 rounded-xl bg-orange-100 hover:bg-orange-200 border-2 border-orange-300 text-orange-700 transition-all duration-200"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Drawing Tools */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Pencil className="h-4 w-4 mr-2" />
                Drawing Tools
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <ToolButton toolName="pen" icon={Pencil} title="Pen Tool (P)" active={tool === 'pen'} />
                <ToolButton toolName="eraser" icon={Eraser} title="Eraser Tool" active={tool === 'eraser'} variant="danger" />
                <ToolButton toolName="line" icon={Minus} title="Line Tool" active={tool === 'line'} />
                <ToolButton toolName="arrow" icon={ArrowRight} title="Arrow Tool" active={tool === 'arrow'} />
                <ToolButton toolName="rectangle" icon={Square} title="Rectangle Tool (R)" active={tool === 'rectangle'} />
                <ToolButton toolName="circle" icon={Circle} title="Circle Tool (C)" active={tool === 'circle'} />
                <ToolButton toolName="triangle" icon={Triangle} title="Triangle Tool" active={tool === 'triangle'} />
                <ToolButton toolName="text" icon={Type} title="Text Tool (T)" active={tool === 'text'} variant="success" />
              </div>
            </div>

            {/* Action Tools */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Actions
              </h3>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={undo} 
                  title="Undo (Ctrl+Z)" 
                  className="p-3 rounded-xl bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  disabled={historyIndex <= 0}
                >
                  <Undo size={18} />
                </button>
                <button 
                  onClick={redo} 
                  title="Redo (Ctrl+Y)" 
                  className="p-3 rounded-xl bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  disabled={historyIndex >= history.length - 1}
                >
                  <Redo size={18} />
                </button>
                <button 
                  onClick={deleteSelectedObjects} 
                  title="Delete Selected (Del)" 
                  className="p-3 rounded-xl bg-white hover:bg-red-50 border-2 border-gray-200 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-red-600"
                  disabled={selectedObjects.length === 0}
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={copySelectedObjects} 
                  title="Copy Selected (Ctrl+C)" 
                  className="p-3 rounded-xl bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-blue-600"
                  disabled={selectedObjects.length === 0}
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Stroke Properties */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Palette className="h-4 w-4 mr-2" />
                Stroke
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm"
                    style={{ backgroundColor: strokeColor }}
                    onClick={() => document.getElementById('stroke-color-picker').click()}
                  />
                  <input
                    id="stroke-color-picker"
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="hidden"
                  />
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-xs text-gray-500 text-center mt-1">{strokeWidth}px</div>
                  </div>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {strokeColors.map(color => (
                    <ColorButton
                      key={color}
                      color={color}
                      active={strokeColor === color}
                      onClick={setStrokeColor}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Text Properties */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Type className="h-4 w-4 mr-2" />
                Text
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map(size => (
                      <option key={size} value={size}>{size}px</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>
              </div>
            </div>

            {/* View Controls */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                View
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-sm font-medium">{Math.round(zoom * 100)}%</div>
                    <input
                      type="range"
                      min="10"
                      max="300"
                      value={zoom * 100}
                      onChange={(e) => setZoom(e.target.value / 100)}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-1"
                    />
                  </div>
                  <button
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={fitToScreen}
                    className="px-3 py-2 text-xs rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors duration-200"
                    title="Fit All"
                  >
                    Fit All
                  </button>
                  <button
                    onClick={focusOnImage}
                    className="px-3 py-2 text-xs rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors duration-200"
                    title="Focus Image"
                  >
                    Focus
                  </button>
                </div>
              </div>
            </div>

            {/* Grid & Options */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Grid3X3 className="h-4 w-4 mr-2" />
                Options
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Show Grid</span>
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      showGrid ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        showGrid ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {showGrid && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Grid Size</label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={gridSize}
                      onChange={(e) => setGridSize(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-xs text-gray-500 text-center mt-1">{gridSize}px</div>
                  </div>
                )}
                <button
                  onClick={clearCanvas}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200"
                >
                  Clear Canvas
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${tool === 'select' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="font-medium text-gray-700">
                  {tool === 'select' ? 'Transform Mode' : `${tool.charAt(0).toUpperCase() + tool.slice(1)} Tool`}
                </span>
              </div>
              {selectedObjects.length > 0 && (
                <div className="flex items-center space-x-2 text-blue-700">
                  <Target size={16} />
                  <span>{selectedObjects.length} object(s) selected</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Canvas: {canvasWidth}×{canvasHeight}</span>
              <span>Zoom: {Math.round(zoom * 100)}%</span>
              <span>Objects: {drawnObjects.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden bg-gray-100"
        style={{ height: height + 200 }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth + 600}
          height={canvasHeight + 600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onDoubleClick={handleDoubleClick}
          className="cursor-crosshair shadow-lg"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'top left'
          }}
        />

        {/* Selection box overlay */}
        {selectionBox && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none rounded"
            style={{
              left: (selectionBox.x + pan.x) * zoom,
              top: (selectionBox.y + pan.y) * zoom,
              width: selectionBox.width * zoom,
              height: selectionBox.height * zoom,
              transform: 'translateZ(0)'
            }}
          />
        )}

        {/* Grid Overlay */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(to right, #3b82f6 1px, transparent 1px),
                linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
              `,
              backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
              transform: `translate(${pan.x * zoom}px, ${pan.y * zoom}px)`,
              backgroundPosition: `${pan.x * zoom}px ${pan.y * zoom}px`
            }}
          />
        )}

        {/* Rest of the JSX remains the same as in the previous response... */}
        {/* Including floating action buttons, status indicators, mode indicators, transform feedback overlays, text input modal, quick help panel, progress indicators, and save status indicator */}

        {/* Floating Action Buttons */}
        <div className="absolute top-6 right-6 flex flex-col space-y-3">
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.2))}
            className="w-12 h-12 bg-white bg-opacity-95 hover:bg-opacity-100 rounded-full shadow-lg flex items-center justify-center border border-gray-200 transition-all duration-200 hover:scale-110"
            title="Zoom In"
          >
            <ZoomIn size={20} className="text-gray-700" />
          </button>
          <button
            onClick={() => setZoom(Math.max(0.1, zoom - 0.2))}
            className="w-12 h-12 bg-white bg-opacity-95 hover:bg-opacity-100 rounded-full shadow-lg flex items-center justify-center border border-gray-200 transition-all duration-200 hover:scale-110"
            title="Zoom Out"
          >
            <ZoomOut size={20} className="text-gray-700" />
          </button>
          <button
            onClick={resetView}
            className="w-12 h-12 bg-white bg-opacity-95 hover:bg-opacity-100 rounded-full shadow-lg flex items-center justify-center text-xs font-bold border border-gray-200 transition-all duration-200 hover:scale-110"
            title="Reset View"
          >
            1:1
          </button>
          <button
            onClick={focusOnImage}
            className="w-12 h-12 bg-blue-600 bg-opacity-95 hover:bg-opacity-100 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            title="Focus on Image"
          >
            <Target size={20} />
          </button>
        </div>

        {/* Enhanced Text Input Modal */}
        {textInput.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-4">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Type className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {editingId ? 'Edit Text' : 'Add Text'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {editingId ? 'Modify existing text' : 'Create new text element'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={cancelTextEditing}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  title="Cancel (Esc)"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Content
                  </label>
                  <textarea
                    value={textInput.text}
                    onChange={(e) => setTextInput(prev => ({ ...prev, text: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        finishTextEditing();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelTextEditing();
                      }
                    }}
                    autoFocus
                    rows={Math.max(3, textInput.text.split('\n').length)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                    style={{ 
                      fontSize: `${Math.min(fontSize, 16)}px`, 
                      fontFamily: fontFamily,
                      lineHeight: '1.5'
                    }}
                    placeholder={editingId ? "Edit your text..." : "Type your text here..."}
                  />
                </div>

                {/* Text Properties */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Size
                    </label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map(size => (
                        <option key={size} value={size}>{size}px</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Family
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                </div>

                {/* Color Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm"
                      style={{ backgroundColor: strokeColor }}
                      onClick={() => document.getElementById('text-color-picker').click()}
                    />
                    <input
                      id="text-color-picker"
                      type="color"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="hidden"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Current: {strokeColor}</div>
                      <div className="grid grid-cols-8 gap-1 mt-2">
                                                {strokeColors.slice(0, 8).map(color => (
                          <button
                            key={color}
                            onClick={() => setStrokeColor(color)}
                            className={`w-6 h-6 rounded border-2 transition-all duration-200 ${
                              strokeColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <div className="text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>💡 <strong>Tips:</strong></span>
                    <span>Enter to apply</span>
                    <span>Shift+Enter for new line</span>
                    <span>Esc to cancel</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={cancelTextEditing}
                    className="px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={finishTextEditing}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Check className="h-4 w-4" />
                    <span>Apply Text</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="absolute bottom-6 left-6 bg-gray-900 bg-opacity-90 text-white px-4 py-3 rounded-xl shadow-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-300">Zoom</div>
              <div className="font-semibold">{Math.round(zoom * 100)}%</div>
            </div>
            <div>
              <div className="text-gray-300">Objects</div>
              <div className="font-semibold">{drawnObjects.length}</div>
            </div>
            {selectedObjects.length > 0 && (
              <>
                <div>
                  <div className="text-yellow-300">Selected</div>
                  <div className="font-semibold text-yellow-400">{selectedObjects.length}</div>
                </div>
              </>
            )}
            {isResizing && (
              <div>
                <div className="text-green-300">Mode</div>
                <div className="font-semibold text-green-400">Resizing</div>
              </div>
            )}
            {isRotating && (
              <div>
                <div className="text-purple-300">Mode</div>
                <div className="font-semibold text-purple-400">Rotating</div>
              </div>
            )}
          </div>
        </div>

        {/* Mode Indicators */}
        <div className="absolute top-6 left-6 space-y-2">
          {tool === 'select' && selectedObjects.length > 0 && (
            <div className="bg-blue-600 bg-opacity-95 text-white px-4 py-3 rounded-xl shadow-lg max-w-xs">
              <div className="font-semibold mb-2 flex items-center">
                <MousePointer className="h-4 w-4 mr-2" />
                Transform Mode
              </div>
              <div className="text-sm space-y-1 text-blue-100">
                <div>• <strong>Drag</strong> to move objects</div>
                <div>• <strong>Drag corners</strong> to resize</div>
                <div>• <strong>Hold Shift</strong> for proportional resize</div>
                <div>• <strong>Top handle</strong> to rotate</div>
                <div>• <strong>Double-click text</strong> to edit</div>
              </div>
            </div>
          )}

          {isInlineEditing && (
            <div className="bg-green-600 bg-opacity-95 text-white px-4 py-2 rounded-xl shadow-lg flex items-center space-x-2">
              <Type className="h-4 w-4" />
              <span className="text-sm font-medium">Text Editing Mode</span>
              <span className="text-xs text-green-200">Press ESC to cancel</span>
            </div>
          )}

          {tool !== 'select' && !isInlineEditing && (
            <div className="bg-gray-800 bg-opacity-95 text-white px-4 py-2 rounded-xl shadow-lg flex items-center space-x-2">
              <Pencil className="h-4 w-4" />
              <span className="text-sm font-medium">
                {tool.charAt(0).toUpperCase() + tool.slice(1)} Tool Active
              </span>
            </div>
          )}
        </div>

        {/* Transform Feedback Overlays */}
        {isResizing && resizeInfo && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 bg-opacity-95 text-white px-6 py-4 rounded-xl shadow-lg pointer-events-none">
            <div className="text-center">
              <div className="font-semibold text-lg">Resizing</div>
              <div className="text-sm mt-1 text-blue-200">
                Handle: {resizeInfo.handle.toUpperCase()}
              </div>
              <div className="text-xs mt-2 space-x-4">
                <span>ΔX: {resizeInfo.deltaX}px</span>
                <span>ΔY: {resizeInfo.deltaY}px</span>
              </div>
              {isProportionalResize && (
                <div className="text-xs text-yellow-300 mt-1 flex items-center justify-center">
                  <span className="mr-1">⇧</span>
                  Proportional Mode
                </div>
              )}
            </div>
          </div>
        )}

        {isRotating && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-600 bg-opacity-95 text-white px-6 py-4 rounded-xl shadow-lg pointer-events-none">
            <div className="text-center">
              <div className="font-semibold text-lg flex items-center justify-center">
                <RotateCw className="h-5 w-5 mr-2" />
                Rotating
              </div>
              <div className="text-sm mt-1 text-purple-200">
                Drag to adjust rotation
              </div>
            </div>
          </div>
        )}

        {isDraggingObjects && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-600 bg-opacity-95 text-white px-6 py-4 rounded-xl shadow-lg pointer-events-none">
            <div className="text-center">
              <div className="font-semibold text-lg flex items-center justify-center">
                <Move className="h-5 w-5 mr-2" />
                Moving Objects
              </div>
              <div className="text-sm mt-1 text-green-200">
                {selectedObjects.length} object(s)
              </div>
            </div>
          </div>
        )}

        {/* Quick Help Panel */}
        <div className="absolute bottom-6 right-6 bg-white bg-opacity-95 rounded-xl shadow-lg p-4 max-w-xs">
          <div className="flex items-center space-x-2 mb-3">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Quick Shortcuts</span>
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Select Tool:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">V</kbd>
            </div>
            <div className="flex justify-between">
              <span>Pan Tool:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">H</kbd>
            </div>
            <div className="flex justify-between">
              <span>Pen Tool:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">P</kbd>
            </div>
            <div className="flex justify-between">
              <span>Text Tool:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">T</kbd>
            </div>
            <div className="flex justify-between">
              <span>Undo:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Z</kbd>
            </div>
            <div className="flex justify-between">
              <span>Delete:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Del</kbd>
            </div>
            <div className="flex justify-between">
              <span>Unselect:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
            </div>
          </div>
        </div>

        {/* Progress Indicators */}
        {(isResizing || isRotating || isDraggingObjects) && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
            <div className="bg-white rounded-full shadow-lg px-6 py-3 flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                {isResizing && 'Resizing objects...'}
                {isRotating && 'Rotating objects...'}
                {isDraggingObjects && 'Moving objects...'}
              </span>
            </div>
          </div>
        )}

        {/* Save Status Indicator */}
        {isDirty && (
          <div className="fixed top-4 right-4 z-40">
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-2 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Unsaved changes</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrawingCanvas;



