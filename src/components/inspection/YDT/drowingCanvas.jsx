import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  MousePointer, Hand, Pencil, Square, Circle, ArrowRight, Type, ZoomIn, ZoomOut, Trash2, Hash
} from 'lucide-react';

const DrawingCanvas = forwardRef(({ 
  backgroundImage, 
  viewMode = false,
  initialCanvasData = []
}, ref) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const textAreaRef = useRef(null);
  const bgImageRef = useRef(null);
  
  const [tool, setTool] = useState('select');
  const [drawnObjects, setDrawnObjects] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [hoveredObjectId, setHoveredObjectId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#FF0000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); 
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState([]);
  const [editingText, setEditingText] = useState(null); 

  // --- 1. COORDINATE HELPER ---
  const getCanvasCoords = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom - pan.x,
      y: (e.clientY - rect.top) / zoom - pan.y
    };
  };

  // --- 2. KEYBOARD LISTENERS (DELETE) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') setIsSpacePressed(true);
      const isTyping = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA';
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping && !viewMode) {
        if (selectedObjects.length > 0) {
          setDrawnObjects(prev => prev.filter(obj => !selectedObjects.includes(obj.id)));
          setSelectedObjects([]);
        }
      }
    };
    const handleKeyUp = (e) => { if (e.code === 'Space') setIsSpacePressed(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [selectedObjects, viewMode, editingText]);

  // --- 3. AUTO-CENTERING ---
  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => {
        bgImageRef.current = img;
        setTimeout(() => {
          if (!containerRef.current) return;
          const contW = containerRef.current.clientWidth;
          const contH = containerRef.current.clientHeight;
          const scale = Math.min(0.8, (contW * 0.8) / img.width, (contH * 0.8) / img.height);
          setZoom(scale);
          setPan({ x: (contW / scale / 2) - (img.width / 2), y: (contH / scale / 2) - (img.height / 2) });
          draw();
        }, 100);
      };
    }
  }, [backgroundImage]);

  useEffect(() => {
    if (initialCanvasData?.length > 0) setDrawnObjects(initialCanvasData);
  }, [initialCanvasData]);

  // --- 4. HIT DETECTION & BOUNDS ---
  const calculateBounds = (type, data) => {
    const p = 10;
    if (type === 'rectangle') return { x: data.x - p, y: data.y - p, w: data.width + p*2, h: data.height + p*2 };
    if (type === 'circle') return { x: data.x - data.radius - p, y: data.y - data.radius - p, w: data.radius*2 + p*2, h: data.radius*2 + p*2 };
    if (type === 'text') {
        const fs = data.fontSize || 20;
        const width = (data.text.length * fs * 0.6) + 20;
        return { x: data.x - 5, y: data.y - 5, w: width, h: fs + 15 };
    }
    if (type === 'line' || type === 'arrow') return { x: Math.min(data.x1, data.x2)-p, y: Math.min(data.y1, data.y2)-p, w: Math.abs(data.x2-data.x1)+p*2, h: Math.abs(data.y2-data.y1)+p*2 };
    if (type === 'path') {
        const xs = data.points.map(p => p.x); const ys = data.points.map(p => p.y);
        const minX = Math.min(...xs); const minY = Math.min(...ys);
        return { x: minX - p, y: minY - p, w: (Math.max(...xs) - minX) + p*2, h: (Math.max(...ys) - minY) + p*2 };
    }
    return null;
  };

  const isPointInObj = (p, obj) => {
    const b = obj.bounds;
    return b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  };

  // --- 5. RENDER ENGINE ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);

    if (bgImageRef.current) ctx.drawImage(bgImageRef.current, 0, 0);

    drawnObjects.forEach(obj => {
      if (editingText && obj.id === editingText.id) return; // Hide while editing

      ctx.strokeStyle = obj.strokeColor;
      ctx.fillStyle = obj.strokeColor;
      ctx.lineWidth = obj.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (obj.type === 'rectangle') ctx.strokeRect(obj.data.x, obj.data.y, obj.data.width, obj.data.height);
      if (obj.type === 'circle') { ctx.beginPath(); ctx.arc(obj.data.x, obj.data.y, obj.data.radius, 0, Math.PI * 2); ctx.stroke(); }
      if (obj.type === 'line' || obj.type === 'arrow') {
        ctx.beginPath(); ctx.moveTo(obj.data.x1, obj.data.y1); ctx.lineTo(obj.data.x2, obj.data.y2); ctx.stroke();
        if (obj.type === 'arrow') {
            const angle = Math.atan2(obj.data.y2 - obj.data.y1, obj.data.x2 - obj.data.x1);
            ctx.lineTo(obj.data.x2 - 15 * Math.cos(angle - Math.PI/6), obj.data.y2 - 15 * Math.sin(angle - Math.PI/6));
            ctx.moveTo(obj.data.x2, obj.data.y2);
            ctx.lineTo(obj.data.x2 - 15 * Math.cos(angle + Math.PI/6), obj.data.y2 - 15 * Math.sin(angle + Math.PI/6));
            ctx.stroke();
        }
      }
      if (obj.type === 'text') {
        ctx.font = `bold ${obj.data.fontSize || 20}px Arial`;
        ctx.textBaseline = "top";
        ctx.fillText(obj.data.text, obj.data.x, obj.data.y);
      }
      if (obj.type === 'path') {
        ctx.beginPath(); obj.data.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.stroke();
      }

      if (!viewMode && (selectedObjects.includes(obj.id) || hoveredObjectId === obj.id)) {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = selectedObjects.includes(obj.id) ? '#3b82f6' : '#cbd5e1';
        ctx.lineWidth = 1;
        if (obj.bounds) {
            ctx.strokeRect(obj.bounds.x, obj.bounds.y, obj.bounds.w, obj.bounds.h);
            if (selectedObjects.includes(obj.id)) {
                ctx.setLineDash([]); ctx.fillStyle = '#3b82f6';
                const hS = 12 / zoom;
                ctx.fillRect(obj.bounds.x + obj.bounds.w - hS, obj.bounds.y + obj.bounds.h - hS, hS, hS);
            }
        }
        ctx.restore();
      }
    });

    if (isDragging && dragMode === 'draw' && currentPath.length > 0) {
        ctx.beginPath(); ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeWidth;
        currentPath.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.stroke();
    }
  }, [drawnObjects, zoom, pan, selectedObjects, hoveredObjectId, editingText, isDragging, dragMode, currentPath, strokeColor, strokeWidth, viewMode]);

  useEffect(() => { draw(); }, [draw]);

  // --- 6. TEXT EDITING LOGIC ---
  const handleDoubleClick = (e) => {
    if (viewMode) return;
    const coords = getCanvasCoords(e);
    const hit = drawnObjects.slice().reverse().find(o => isPointInObj(coords, o));

    if (hit && hit.type === 'text') {
        setEditingText({ 
            id: hit.id, 
            x: hit.data.x, 
            y: hit.data.y, 
            text: hit.data.text, 
            fontSize: hit.data.fontSize || 20 
        });
        setSelectedObjects([]);
    }
  };

  const finishTextEditing = () => {
    if (!editingText) return;
    if (editingText.text.trim() === '') {
        setDrawnObjects(prev => prev.filter(o => o.id !== editingText.id));
        setEditingText(null);
        return;
    }

    const data = { x: editingText.x, y: editingText.y, text: editingText.text, fontSize: editingText.fontSize };
    const updatedObj = { id: editingText.id, type: 'text', strokeColor, strokeWidth: 1, data, bounds: calculateBounds('text', data) };

    setDrawnObjects(prev => {
        const filtered = prev.filter(o => o.id !== editingText.id);
        return [...filtered, updatedObj];
    });
    setEditingText(null);
    setSelectedObjects([updatedObj.id]);
  };

  // --- 7. MOUSE INTERACTION ---
  const onMouseDown = (e) => {
    if (viewMode) return;
    if (editingText) finishTextEditing();
    const coords = getCanvasCoords(e);
    const hit = drawnObjects.slice().reverse().find(o => isPointInObj(coords, o));

    if (isSpacePressed || tool === 'pan') { setDragMode('pan'); setStartPos({ x: e.clientX, y: e.clientY }); setIsDragging(true); return; }

    if (hit) {
      setSelectedObjects([hit.id]);
      const isResize = coords.x > hit.bounds.x + hit.bounds.w - 30 && coords.y > hit.bounds.y + hit.bounds.h - 30;
      setDragMode(isResize ? 'resize' : 'move');
      setStartPos(coords); setIsDragging(true); return;
    }

    if (tool !== 'select') {
      setSelectedObjects([]); setDragMode('draw'); setStartPos(coords); setIsDragging(true);
      if (tool === 'pen') setCurrentPath([coords]); return;
    }
    setSelectedObjects([]);
  };

  const onMouseMove = (e) => {
    const coords = getCanvasCoords(e);
    const hit = drawnObjects.slice().reverse().find(o => isPointInObj(coords, o));
    setHoveredObjectId(hit?.id || null);
    if (!isDragging) return;

    if (dragMode === 'pan') {
      const dx = (e.clientX - startPos.x) / zoom; const dy = (e.clientY - startPos.y) / zoom;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy })); setStartPos({ x: e.clientX, y: e.clientY });
      return;
    }

    const dx = coords.x - startPos.x; const dy = coords.y - startPos.y;

    if (dragMode === 'move') {
      setDrawnObjects(prev => prev.map(obj => {
        if (!selectedObjects.includes(obj.id)) return obj;
        let newData = { ...obj.data };
        if (obj.type === 'rectangle' || obj.type === 'text' || obj.type === 'circle') { newData.x += dx; newData.y += dy; }
        else if (obj.type === 'line' || obj.type === 'arrow') { newData.x1 += dx; newData.y1 += dy; newData.x2 += dx; newData.y2 += dy; }
        else if (obj.type === 'path') { newData.points = newData.points.map(p => ({ x: p.x + dx, y: p.y + dy })); }
        return { ...obj, data: newData, bounds: calculateBounds(obj.type, newData) };
      }));
      setStartPos(coords);
    }

    if (dragMode === 'resize') {
        setDrawnObjects(prev => prev.map(obj => {
          if (!selectedObjects.includes(obj.id)) return obj;
          let newData = { ...obj.data };
          if (obj.type === 'rectangle') { newData.width += dx; newData.height += dy; }
          if (obj.type === 'circle') { newData.radius += Math.max(dx, dy); }
          if (obj.type === 'line' || obj.type === 'arrow') { newData.x2 += dx; newData.y2 += dy; }
          if (obj.type === 'text') { newData.fontSize = Math.max(10, (newData.fontSize || 20) + (dx / 5)); }
          if (obj.type === 'path') {
              const centerX = obj.bounds.x; const centerY = obj.bounds.y;
              const scaleX = 1 + (dx / obj.bounds.w); const scaleY = 1 + (dy / obj.bounds.h);
              newData.points = newData.points.map(p => ({ x: centerX + (p.x - centerX) * scaleX, y: centerY + (p.y - centerY) * scaleY }));
          }
          return { ...obj, data: newData, bounds: calculateBounds(obj.type, newData) };
        }));
        setStartPos(coords);
    }
    if (dragMode === 'draw' && tool === 'pen') setCurrentPath(prev => [...prev, coords]);
  };

  const onMouseUp = (e) => {
    if (dragMode === 'draw') {
      const coords = getCanvasCoords(e);
      if (tool === 'text') {
          setEditingText({ id: Date.now().toString(), x: coords.x, y: coords.y, text: '', fontSize: 20 });
          setIsDragging(false); setDragMode(null); return;
      }
      let newObj = { id: Date.now().toString(), strokeColor, strokeWidth, type: tool };
      if (tool === 'rectangle') newObj.data = { x: Math.min(startPos.x, coords.x), y: Math.min(startPos.y, coords.y), width: Math.abs(coords.x - startPos.x), height: Math.abs(coords.y - startPos.y) };
      else if (tool === 'circle') newObj.data = { x: startPos.x, y: startPos.y, radius: Math.sqrt(Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2)) };
      else if (tool === 'line' || tool === 'arrow') newObj.data = { x1: startPos.x, y1: startPos.y, x2: coords.x, y2: coords.y };
      else if (tool === 'pen') { newObj.data = { points: [...currentPath] }; newObj.type = 'path'; }
      if (newObj.data) { newObj.bounds = calculateBounds(newObj.type, newObj.data); setDrawnObjects(prev => [...prev, newObj]); }
    }
    setIsDragging(false); setDragMode(null); setCurrentPath([]);
  };

  useImperativeHandle(ref, () => ({
    getCanvasData: () => JSON.parse(JSON.stringify(drawnObjects)),
    loadCanvasData: (data) => setDrawnObjects(data || []),
    saveCanvasImage: () => canvasRef.current.toDataURL('image/png')
  }));

  return (
    <div className="flex flex-col h-[650px] w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-300">
      {!viewMode && (
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b z-10 shadow-sm">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            <ToolBtn active={tool === 'select'} icon={<MousePointer size={18}/>} onClick={() => setTool('select')} />
            <ToolBtn active={tool === 'pan'} icon={<Hand size={18}/>} onClick={() => setTool('pan')} />
            <div className="w-px h-6 bg-slate-300 mx-1" />
            <ToolBtn active={tool === 'pen'} icon={<Pencil size={18}/>} onClick={() => setTool('pen')} />
            <ToolBtn active={tool === 'rectangle'} icon={<Square size={18}/>} onClick={() => setTool('rectangle')} />
            <ToolBtn active={tool === 'circle'} icon={<Circle size={18}/>} onClick={() => setTool('circle')} />
            <ToolBtn active={tool === 'arrow'} icon={<ArrowRight size={18}/>} onClick={() => setTool('arrow')} />
            <ToolBtn active={tool === 'text'} icon={<Type size={18}/>} onClick={() => setTool('text')} />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                <Hash size={14} className="text-slate-400" />
                <select value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="text-xs font-bold bg-transparent border-none outline-none text-slate-700 cursor-pointer">
                    {[1, 2, 3, 5, 8, 12, 18].map(s => <option key={s} value={s}>{s}px</option>)}
                </select>
            </div>
            <input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none shadow-sm" />
            <button onClick={() => { setDrawnObjects(prev => prev.filter(o => !selectedObjects.includes(o.id))); setSelectedObjects([]); }} className="flex items-center px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-md border border-red-100 transition-colors">
              <Trash2 size={14} className="mr-1.5" /> Delete
            </button>
          </div>
        </div>
      )}

      <div ref={containerRef} className="relative flex-1 bg-slate-200 overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={containerRef.current?.clientWidth || 1000}
          height={containerRef.current?.clientHeight || 600}
          onMouseDown={onMouseDown} 
          onMouseMove={onMouseMove} 
          onMouseUp={onMouseUp}
          onDoubleClick={handleDoubleClick}
          className={`touch-none ${isSpacePressed ? 'cursor-grab' : ''}`}
        />

        {editingText && (
          <textarea
            ref={textAreaRef} autoFocus
            className="absolute bg-white border-2 border-blue-500 outline-none p-2 shadow-2xl rounded text-center overflow-hidden resize-none"
            style={{ 
                left: (editingText.x + pan.x) * zoom, 
                top: (editingText.y + pan.y) * zoom, 
                fontSize: `${editingText.fontSize * zoom}px`, 
                color: strokeColor,
                minWidth: '100px',
                height: 'auto'
            }}
            value={editingText.text} 
            onChange={e => setEditingText({ ...editingText, text: e.target.value })} 
            onBlur={finishTextEditing}
          />
        )}

        <div className="absolute bottom-4 right-4 flex items-center bg-white shadow-xl border p-1 space-x-1 rounded-lg">
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1.5 hover:bg-slate-100 rounded"><ZoomOut size={16}/></button>
            <span className="text-[11px] font-bold w-12 text-center text-slate-700">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(4, z + 0.1))} className="p-1.5 hover:bg-slate-100 rounded"><ZoomIn size={16}/></button>
        </div>
      </div>
    </div>
  );
});

const ToolBtn = ({ active, icon, onClick }) => (
  <button onClick={onClick} className={`p-2 rounded-md transition-all ${active ? 'bg-white text-blue-600 shadow-md border-b-2 border-blue-600' : 'text-slate-600 hover:bg-white/60'}`}>
    {icon}
  </button>
);

DrawingCanvas.displayName = 'DrawingCanvas';
export default DrawingCanvas;