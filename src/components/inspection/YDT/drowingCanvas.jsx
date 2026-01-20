import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  MousePointer, Hand, Pencil, Square, Circle, ArrowRight, Type, ZoomIn, ZoomOut, Trash2, Hash, 
  Minus, Type as TypeIcon, Palette, Square as FillIcon
} from 'lucide-react';

const DrawingCanvas = forwardRef(({ backgroundImage, viewMode = false, initialCanvasData = [] }, ref) => {
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
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDashed, setIsDashed] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); 
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState([]);
  const [editingText, setEditingText] = useState(null); 
  const [lastClickTime, setLastClickTime] = useState(0);

  const getCanvasCoords = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / zoom - pan.x, y: (e.clientY - rect.top) / zoom - pan.y };
  };

  // --- 1. KEYBOARD ACTIONS (DELETE) ---
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

  // --- 2. AUTO-CENTERING ON LOAD ---
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
          const scale = Math.min(0.8, (contW * 0.9) / img.width, (contH * 0.9) / img.height);
          setZoom(scale);
          setPan({ 
            x: (contW / scale / 2) - (img.width / 2), 
            y: (contH / scale / 2) - (img.height / 2) 
          });
        }, 100);
      };
    }
  }, [backgroundImage]);

  useEffect(() => { if (initialCanvasData?.length > 0) setDrawnObjects(initialCanvasData); }, [initialCanvasData]);

  const calculateBounds = (type, data) => {
    const p = 10;
    if (!data) return null;
    if (type === 'rectangle') return { x: data.x - p, y: data.y - p, w: data.width + p*2, h: data.height + p*2 };
    if (type === 'circle') return { x: data.x - data.radius - p, y: data.y - data.radius - p, w: data.radius*2 + p*2, h: data.radius*2 + p*2 };
    if (type === 'text') {
        const lines = (data.text || "").split('\n');
        const fs = data.fontSize || 16;
        const width = Math.max(...lines.map(l => l.length)) * fs * 0.6 + 25;
        const height = lines.length * fs * 1.3 + 10;
        return { x: data.x - 5, y: data.y - 5, w: width, h: height };
    }
    if (type === 'line' || type === 'arrow') return { x: Math.min(data.x1, data.x2)-p, y: Math.min(data.y1, data.y2)-p, w: Math.abs(data.x2-data.x1)+p*2, h: Math.abs(data.y2-data.y1)+p*2 };
    if (type === 'path' && data.points) {
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

  // --- 3. RENDER ENGINE ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);

    if (bgImageRef.current) ctx.drawImage(bgImageRef.current, 0, 0);

    const renderObject = (obj, isPreview = false) => {
      ctx.save();
      ctx.strokeStyle = obj.strokeColor;
      ctx.fillStyle = obj.fillColor || 'transparent';
      ctx.lineWidth = obj.strokeWidth;
      ctx.setLineDash(obj.isDashed ? [5, 5] : []);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (isPreview) ctx.globalAlpha = 0.5;

      if (obj.type === 'rectangle') {
        if (obj.fillColor !== 'transparent') ctx.fillRect(obj.data.x, obj.data.y, obj.data.width, obj.data.height);
        ctx.strokeRect(obj.data.x, obj.data.y, obj.data.width, obj.data.height);
      } else if (obj.type === 'circle') {
        ctx.beginPath(); ctx.arc(obj.data.x, obj.data.y, obj.data.radius, 0, Math.PI * 2);
        if (obj.fillColor !== 'transparent') ctx.fill();
        ctx.stroke();
      } else if (obj.type === 'line' || obj.type === 'arrow') {
        ctx.beginPath(); ctx.moveTo(obj.data.x1, obj.data.y1); ctx.lineTo(obj.data.x2, obj.data.y2); ctx.stroke();
        if (obj.type === 'arrow') {
            const angle = Math.atan2(obj.data.y2 - obj.data.y1, obj.data.x2 - obj.data.x1);
            ctx.setLineDash([]);
            ctx.lineTo(obj.data.x2 - 12 * Math.cos(angle - Math.PI/6), obj.data.y2 - 12 * Math.sin(angle - Math.PI/6));
            ctx.moveTo(obj.data.x2, obj.data.y2);
            ctx.lineTo(obj.data.x2 - 12 * Math.cos(angle + Math.PI/6), obj.data.y2 - 12 * Math.sin(angle + Math.PI/6));
            ctx.stroke();
        }
      } else if (obj.type === 'text') {
        const textVal = obj.data?.text || "";
        const lines = textVal.split('\n');
        const fs = obj.data.fontSize || 16;
        if (obj.fillColor !== 'transparent') {
            const b = calculateBounds('text', obj.data);
            if (b) { ctx.fillRect(b.x+5, b.y+5, b.w-10, b.h-10); ctx.strokeRect(b.x+5, b.y+5, b.w-10, b.h-10); }
        }
        ctx.fillStyle = obj.strokeColor;
        ctx.font = `bold ${fs}px Arial`; ctx.textBaseline = "top";
        lines.forEach((line, i) => ctx.fillText(line, obj.data.x, obj.data.y + (i * fs * 1.3)));
      } else if (obj.type === 'path' && obj.data.points) {
        ctx.beginPath(); obj.data.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.stroke();
      }
      ctx.restore();
    };

    drawnObjects.forEach(obj => {
      if (editingText && obj.id === editingText.id) return;
      renderObject(obj);
      if (!viewMode && (selectedObjects.includes(obj.id) || hoveredObjectId === obj.id)) {
        ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = selectedObjects.includes(obj.id) ? '#3b82f6' : '#cbd5e1'; ctx.lineWidth = 1;
        if (obj.bounds) {
            ctx.strokeRect(obj.bounds.x, obj.bounds.y, obj.bounds.w, obj.bounds.h);
            if (selectedObjects.includes(obj.id)) {
                ctx.setLineDash([]); ctx.fillStyle = '#3b82f6';
                const hS = 12 / zoom; ctx.fillRect(obj.bounds.x + obj.bounds.w - hS, obj.bounds.y + obj.bounds.h - hS, hS, hS);
            }
        }
        ctx.restore();
      }
    });

    if (isDragging && dragMode === 'draw') {
        let previewObj = { strokeColor, fillColor, strokeWidth, isDashed, type: tool, data: null };
        if (tool === 'rectangle') previewObj.data = { x: Math.min(startPos.x, currentMousePos.x), y: Math.min(startPos.y, currentMousePos.y), width: Math.abs(currentMousePos.x - startPos.x), height: Math.abs(currentMousePos.y - startPos.y) };
        else if (tool === 'circle') previewObj.data = { x: startPos.x, y: startPos.y, radius: Math.sqrt(Math.pow(currentMousePos.x - startPos.x, 2) + Math.pow(currentMousePos.y - startPos.y, 2)) };
        else if (['line', 'arrow'].includes(tool)) previewObj.data = { x1: startPos.x, y1: startPos.y, x2: currentMousePos.x, y2: currentMousePos.y };
        else if (tool === 'pen') { previewObj.type = 'path'; previewObj.data = { points: [...currentPath, currentMousePos] }; }
        if (previewObj.data) renderObject(previewObj, true);
    }
  }, [drawnObjects, zoom, pan, selectedObjects, hoveredObjectId, editingText, isDragging, dragMode, currentPath, currentMousePos, strokeColor, fillColor, strokeWidth, isDashed, viewMode]);

  useEffect(() => { draw(); }, [draw]);

  // --- 4. TEXT EDITING FIX ---
  const handleDoubleClick = (e) => {
    if (viewMode) return;
    const coords = getCanvasCoords(e);
    const hit = drawnObjects.slice().reverse().find(o => isPointInObj(coords, o));
    
    if (hit && hit.type === 'text') {
        setEditingText({ 
            id: hit.id, 
            x: hit.data.x,  // Correctly mapping internal coordinate
            y: hit.data.y, 
            text: hit.data.text, 
            fontSize: hit.data.fontSize || 16 
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
    const obj = { id: editingText.id, type: 'text', strokeColor, fillColor, strokeWidth, isDashed, data, bounds: calculateBounds('text', data) };
    setDrawnObjects(prev => [...prev.filter(o => o.id !== editingText.id), obj]);
    setEditingText(null);
  };

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
      setSelectedObjects([]); setDragMode('draw'); setStartPos(coords); setCurrentMousePos(coords); setIsDragging(true);
      if (tool === 'pen') setCurrentPath([coords]); return;
    }
    setSelectedObjects([]);
  };

  const onMouseMove = (e) => {
    const coords = getCanvasCoords(e);
    const hit = drawnObjects.slice().reverse().find(o => isPointInObj(coords, o));
    setHoveredObjectId(hit?.id || null);
    setCurrentMousePos(coords);
    if (!isDragging) return;

    if (dragMode === 'pan') {
      const dx = (e.clientX - startPos.x) / zoom; const dy = (e.clientY - startPos.y) / zoom;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy })); setStartPos({ x: e.clientX, y: e.clientY }); return;
    }

    const dx = coords.x - startPos.x; const dy = coords.y - startPos.y;
    if (dragMode === 'move') {
      setDrawnObjects(prev => prev.map(obj => {
        if (!selectedObjects.includes(obj.id)) return obj;
        let d = { ...obj.data };
        if (['rectangle', 'text', 'circle'].includes(obj.type)) { d.x += dx; d.y += dy; }
        else if (['line', 'arrow'].includes(obj.type)) { d.x1 += dx; d.y1 += dy; d.x2 += dx; d.y2 += dy; }
        else if (obj.type === 'path' && d.points) d.points = d.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        return { ...obj, data: d, bounds: calculateBounds(obj.type, d) };
      }));
      setStartPos(coords);
    } else if (dragMode === 'resize') {
      setDrawnObjects(prev => prev.map(obj => {
        if (!selectedObjects.includes(obj.id)) return obj;
        let d = { ...obj.data };
        if (obj.type === 'rectangle') { d.width += dx; d.height += dy; }
        if (obj.type === 'circle') d.radius += Math.max(dx, dy);
        if (['line', 'arrow'].includes(obj.type)) { d.x2 += dx; d.y2 += dy; }
        if (obj.type === 'text') d.fontSize = Math.max(8, (d.fontSize || 16) + dx/10);
        return { ...obj, data: d, bounds: calculateBounds(obj.type, d) };
      }));
      setStartPos(coords);
    }
    if (dragMode === 'draw' && tool === 'pen') setCurrentPath(prev => [...prev, coords]);
  };

  const onMouseUp = (e) => {
    if (dragMode === 'draw') {
      const coords = getCanvasCoords(e);
      if (tool === 'text') { setEditingText({ id: Date.now().toString(), x: coords.x, y: coords.y, text: '', fontSize: 16 }); setIsDragging(false); setDragMode(null); return; }
      let newObj = { id: Date.now().toString(), strokeColor, fillColor, strokeWidth, isDashed, type: tool };
      if (tool === 'rectangle') newObj.data = { x: Math.min(startPos.x, coords.x), y: Math.min(startPos.y, coords.y), width: Math.abs(coords.x - startPos.x), height: Math.abs(coords.y - startPos.y) };
      else if (tool === 'circle') newObj.data = { x: startPos.x, y: startPos.y, radius: Math.sqrt(Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2)) };
      else if (['line', 'arrow'].includes(tool)) newObj.data = { x1: startPos.x, y1: startPos.y, x2: coords.x, y2: coords.y };
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
    <div className="flex flex-col h-[700px] w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-300 shadow-xl">
      {!viewMode && (
        <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-white border-b z-10 gap-2 shadow-sm">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            <ToolBtn active={tool === 'select'} icon={<MousePointer size={18}/>} onClick={() => setTool('select')} />
            <ToolBtn active={tool === 'pan'} icon={<Hand size={18}/>} onClick={() => setTool('pan')} />
            <div className="w-px h-6 bg-slate-300 mx-1" />
            <ToolBtn active={tool === 'pen'} icon={<Pencil size={18}/>} onClick={() => setTool('pen')} />
            <ToolBtn active={tool === 'rectangle'} icon={<Square size={18}/>} onClick={() => setTool('rectangle')} />
            <ToolBtn active={tool === 'circle'} icon={<Circle size={18}/>} onClick={() => setTool('circle')} />
            <ToolBtn active={tool === 'line'} icon={<Minus size={18}/>} onClick={() => setTool('line')} />
            <ToolBtn active={tool === 'arrow'} icon={<ArrowRight size={18}/>} onClick={() => setTool('arrow')} />
            <ToolBtn active={tool === 'text'} icon={<TypeIcon size={18}/>} onClick={() => setTool('text')} />
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-slate-100 rounded-lg p-1 space-x-2">
                <div title="Color" className="flex items-center space-x-1 px-1 border-r border-slate-300">
                    <Palette size={14} className="text-slate-500"/><input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" />
                </div>
                <div title="Fill" className="flex items-center space-x-1 px-1 border-r border-slate-300">
                    <FillIcon size={14} className="text-slate-500"/><input type="color" value={fillColor === 'transparent' ? '#ffffff' : fillColor} onChange={e => setFillColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" />
                    <button onClick={() => setFillColor('transparent')} className={`text-[10px] font-bold px-1 rounded ${fillColor === 'transparent' ? 'bg-blue-500 text-white' : 'bg-white'}`}>None</button>
                </div>
                <button onClick={() => setIsDashed(!isDashed)} className={`p-1 rounded ${isDashed ? 'bg-blue-500 text-white' : 'hover:bg-white'}`}><Hash size={16}/></button>
            </div>
            <button onClick={() => {setDrawnObjects(prev => prev.filter(o => !selectedObjects.includes(o.id))); setSelectedObjects([]);}} className="p-2 text-red-500 hover:bg-red-50 rounded-md"><Trash2 size={18}/></button>
          </div>
        </div>
      )}
      <div ref={containerRef} className="relative flex-1 bg-[#cbd5e1] overflow-hidden">
        <canvas ref={canvasRef} width={containerRef.current?.clientWidth || 1000} height={containerRef.current?.clientHeight || 600}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onDoubleClick={handleDoubleClick}
          className={`touch-none ${isSpacePressed ? 'cursor-grab' : 'cursor-crosshair'}`}
        />
        {editingText && (
          <textarea ref={textAreaRef} autoFocus className="absolute bg-white border-2 border-blue-500 outline-none p-2 shadow-2xl rounded text-left overflow-hidden"
            style={{ 
                left: (editingText.x + pan.x) * zoom, 
                top: (editingText.y + pan.y) * zoom, 
                fontSize: `${editingText.fontSize * zoom}px`, 
                color: strokeColor, 
                backgroundColor: fillColor === 'transparent' ? 'white' : fillColor, 
                minWidth: '150px', 
                minHeight: '80px' 
            }}
            value={editingText.text} 
            onChange={e => setEditingText({ ...editingText, text: e.target.value })} 
            onBlur={finishTextEditing}
          />
        )}
        <div className="absolute bottom-4 right-4 flex items-center bg-white shadow-xl border p-1 rounded-lg">
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