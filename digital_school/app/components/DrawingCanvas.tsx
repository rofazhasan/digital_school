"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Undo, 
  Save, 
  Eraser, 
  X, 
  Type, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Eye,
  EyeOff,
  Hand,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Point { x: number; y: number; }

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

interface TextAnnotation {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  id: string;
}

type DrawTool = 'pen' | 'eraser' | 'text' | 'hand';

interface DrawingCanvasProps {
  backgroundImage: string;
  onSave?: (blob: Blob, drawingData: { strokes: Stroke[]; texts: TextAnnotation[] }) => void;
  onCancel: () => void;
  readOnly?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalImages?: number;
  initialStrokes?: Stroke[];
  initialTexts?: TextAnnotation[];
}

export default function DrawingCanvas({
  backgroundImage,
  onSave,
  onCancel,
  readOnly = false,
  onNext,
  onPrev,
  currentIndex = 0,
  totalImages = 0,
  initialStrokes = [],
  initialTexts = [],
}: DrawingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgElRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Natural dimensions of the source image
  const [natW, setNatW] = useState(0);
  const [natH, setNatH] = useState(0);

  // The base CSS size of the image inside the container (fit-to-container)
  const [displayW, setDisplayW] = useState(0);
  const [displayH, setDisplayH] = useState(0);

  // User zoom (1 = fit, 2 = 2× zoom, etc.)
  const [zoom, setZoom] = useState(1);
  // Pan offset in CSS pixels
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [tool, setTool] = useState<DrawTool>('pen');
  const [color, setColor] = useState('#EF4444');
  const [lineWidth, setLineWidth] = useState(3);

  const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
  const [texts, setTexts] = useState<TextAnnotation[]>(initialTexts);
  const [history, setHistory] = useState<{ strokes: Stroke[]; texts: TextAnnotation[] }[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const [showAnnotations, setShowAnnotations] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });
  const [activeTextInput, setActiveTextInput] = useState<{ x: number; y: number } | null>(null);
  const [currentText, setCurrentText] = useState('');

  // For stale-closure-free wheel handler
  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panXRef.current = panX; }, [panX]);
  useEffect(() => { panYRef.current = panY; }, [panY]);

  // ─── Image Load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!backgroundImage) { setImgLoaded(false); return; }
    setImgLoaded(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = backgroundImage;

    img.onload = () => {
      const container = containerRef.current;
      if (!container) return;

      const padW = container.clientWidth  - 32;
      const padH = container.clientHeight - 32;

      const ratio = Math.min(padW / img.width, padH / img.height, 1);
      setNatW(img.width);
      setNatH(img.height);
      setDisplayW(img.width  * ratio);
      setDisplayH(img.height * ratio);

      // Reset view
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setImgLoaded(true);
    };

    img.onerror = () => { console.error('Failed to load', backgroundImage); };
  }, [backgroundImage]);

  // sync initialStrokes/texts if they change (e.g. opening different question)
  useEffect(() => { setStrokes(initialStrokes); }, [initialStrokes]);
  useEffect(() => { setTexts(initialTexts); }, [initialTexts]);

  // ─── Draw Annotations ────────────────────────────────────────────────────────
  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showAnnotations) return;

    // Draw strokes
    strokes.forEach(stroke => {
      if (!stroke.points.length) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      if (stroke.points.length < 3) {
        stroke.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      } else {
        for (let i = 1; i < stroke.points.length - 2; i++) {
          const mx = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
          const my = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, mx, my);
        }
        const n = stroke.points.length;
        ctx.quadraticCurveTo(stroke.points[n-2].x, stroke.points[n-2].y, stroke.points[n-1].x, stroke.points[n-1].y);
      }
      ctx.stroke();
    });

    // Draw texts
    ctx.globalCompositeOperation = 'source-over';
    texts.forEach(t => {
      ctx.font = `bold ${t.size}px Arial, sans-serif`;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = Math.max(2, t.size / 8);
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    });
  }, [strokes, texts, showAnnotations]);

  useEffect(() => {
    if (!imgLoaded) return;
    const raf = requestAnimationFrame(drawAnnotations);
    return () => cancelAnimationFrame(raf);
  }, [imgLoaded, drawAnnotations]);

  // ─── History ─────────────────────────────────────────────────────────────────
  const saveToHistory = (s: Stroke[], t: TextAnnotation[]) => {
    const h = history.slice(0, historyStep + 1);
    h.push({ strokes: [...s], texts: [...t] });
    setHistory(h);
    setHistoryStep(h.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const prev = history[historyStep - 1];
      setStrokes(prev.strokes);
      setTexts(prev.texts);
      setHistoryStep(historyStep - 1);
    } else if (historyStep === 0) {
      setStrokes([]); setTexts([]); setHistoryStep(-1);
    }
  };

  // ─── Coordinate Mapping ───────────────────────────────────────────────────────
  // Convert screen coords → natural image coords
  const toImageCoords = (clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // rect.width  = displayW * zoom  (set via CSS on the inner div)
    // rect.height = displayH * zoom
    const scaleX = natW / rect.width;
    const scaleY = natH / rect.height;
    return {
      x: (clientX - rect.left)  * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const getEventCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // ─── Drawing Handlers ─────────────────────────────────────────────────────────
  const startAction = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly || tool === 'hand' || isPanning) return;
    const { clientX, clientY } = getEventCoords(e);
    const pos = toImageCoords(clientX, clientY);

    if (tool === 'text') {
      setActiveTextInput(pos);
      return;
    }
    setIsDrawing(true);
    setStrokes(prev => [...prev, { points: [pos], color, width: lineWidth, tool: tool as 'pen' | 'eraser' }]);
  };

  const continueAction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { clientX, clientY } = getEventCoords(e);
    const pos = toImageCoords(clientX, clientY);
    setStrokes(prev => {
      const copy = [...prev];
      const last = { ...copy[copy.length - 1], points: [...copy[copy.length - 1].points, pos] };
      copy[copy.length - 1] = last;
      return copy;
    });
  };

  const endAction = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory(strokes, texts);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentText.trim() || !activeTextInput) return;
    const newText: TextAnnotation = {
      ...activeTextInput,
      text: currentText,
      color,
      size: Math.max(18, lineWidth * 6),
      id: Date.now().toString(),
    };
    const updated = [...texts, newText];
    setTexts(updated);
    saveToHistory(strokes, updated);
    setCurrentText('');
    setActiveTextInput(null);
  };

  // ─── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSave) return;
    setIsSaving(true);

    const out = document.createElement('canvas');
    out.width  = natW;
    out.height = natH;
    const ctx = out.getContext('2d')!;

    // Draw background
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, natW, natH);
      if (showAnnotations) ctx.drawImage(canvas, 0, 0, natW, natH);
      out.toBlob(blob => {
        if (blob) onSave(blob, { strokes, texts });
        setIsSaving(false);
      }, 'image/jpeg', 0.9);
    };
    img.src = backgroundImage;
  };

  // ─── Wheel Zoom ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      const curZoom = zoomRef.current;
      const newZoom = Math.min(Math.max(0.5, curZoom + delta * curZoom), 8);

      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Keep the point under the cursor stable
      const ratio = newZoom / curZoom;
      setPanX(prev => mx - (mx - prev) * ratio);
      setPanY(prev => my - (my - prev) * ratio);
      setZoom(newZoom);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !activeTextInput) { e.preventDefault(); setIsPanning(true); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') setIsPanning(false);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [activeTextInput]);

  const resetZoom = () => { setZoom(1); setPanX(0); setPanY(0); };

  // ─── Render ───────────────────────────────────────────────────────────────────
  // The inner wrapper is sized to displayW×displayH (fit scale).
  // We then apply scale(zoom) and translate(panX, panY) via CSS transform.
  // The canvas sits on top of the img, both sized to match.

  const innerStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: displayW,
    height: displayH,
    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
    transformOrigin: '0 0',
    visibility: imgLoaded ? 'visible' : 'hidden',
    boxShadow: '0 4px 40px rgba(0,0,0,0.6)',
    borderRadius: 4,
    overflow: 'hidden',
    background: '#fff',
  };

  const canvasCursor = tool === 'hand' || isPanning
    ? 'cursor-grabbing'
    : readOnly
    ? 'cursor-default'
    : tool === 'text'
    ? 'cursor-text'
    : 'cursor-crosshair';

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white rounded-xl overflow-hidden shadow-2xl border border-slate-800">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between p-3 bg-slate-900 border-b border-slate-800 gap-3 z-20">

        {/* Navigation + Zoom */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
            <Button variant="ghost" size="icon" onClick={onPrev}
              disabled={!onPrev || currentIndex === 0} className="h-8 w-8 hover:bg-slate-700">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-x border-slate-700">
              {currentIndex + 1} / {totalImages}
            </div>
            <Button variant="ghost" size="icon" onClick={onNext}
              disabled={!onNext || currentIndex >= totalImages - 1} className="h-8 w-8 hover:bg-slate-700">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg">
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(z + 0.25, 8))} className="h-8 w-8">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="h-8 w-8">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={resetZoom} className="h-8 w-8">
              <Maximize className="h-4 w-4" />
            </Button>
            <span className="text-[10px] text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* Drawing tools (hidden in readOnly) */}
        {!readOnly && (
          <div className="flex items-center gap-3">
            {/* Tool buttons */}
            <div className="flex gap-0.5 p-1 bg-slate-800 rounded-lg border border-slate-700">
              {([
                { t: 'hand' as DrawTool, Icon: Hand,    title: 'Hand (H)' },
                { t: 'pen'  as DrawTool, Icon: Pencil,  title: 'Pen (P)'  },
                { t: 'eraser' as DrawTool, Icon: Eraser, title: 'Eraser'  },
                { t: 'text' as DrawTool, Icon: Type,    title: 'Text (T)' },
              ] as const).map(({ t, Icon, title }) => (
                <button key={t} title={title} onClick={() => setTool(t)}
                  className={cn('p-2 rounded-md transition-all', tool === t ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-400')}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            {/* Colors */}
            <div className="hidden md:flex items-center gap-1.5 px-2 bg-slate-800/50 rounded-lg h-10 border border-slate-700/50">
              {['#EF4444','#10B981','#3B82F6','#F59E0B','#000000'].map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn('w-5 h-5 rounded-full border-2 transition-transform', color===c ? 'scale-125 border-white' : 'border-transparent opacity-60 hover:opacity-100')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Stroke width */}
            <div className="w-24 px-2 hidden md:block">
              <Slider value={[lineWidth]} onValueChange={v => setLineWidth(v[0])} min={1} max={12} step={1} />
            </div>

            <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyStep < 0}
              className="text-slate-400 hover:text-white hover:bg-slate-800">
              <Undo className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon"
            onClick={() => setShowAnnotations(v => !v)} className="text-slate-400 hover:bg-slate-800">
            {showAnnotations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-white hidden sm:flex">
            Close
          </Button>
          {!readOnly && (
            <Button onClick={handleSave} disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 shadow-lg px-6">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          )}
        </div>
      </div>

      {/* ── Viewport ── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-slate-950"
        style={{ cursor: isPanning || tool === 'hand' ? 'grab' : 'default' }}
        onMouseDown={e => {
          // Middle-mouse or Space-pan or Hand tool
          if (e.button === 1 || isPanning || tool === 'hand') {
            setIsPanning(true);
            setLastPan({ x: e.clientX, y: e.clientY });
            e.preventDefault();
          }
        }}
        onMouseMove={e => {
          if (isPanning) {
            setPanX(prev => prev + e.clientX - lastPan.x);
            setPanY(prev => prev + e.clientY - lastPan.y);
            setLastPan({ x: e.clientX, y: e.clientY });
          }
        }}
        onMouseUp={() => { if (isPanning) setIsPanning(false); }}
        onMouseLeave={() => { if (isPanning) setIsPanning(false); }}
      >
        {/* Spinner while loading */}
        {!imgLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
            <span className="text-sm text-slate-500 uppercase tracking-widest">Loading…</span>
          </div>
        )}

        {/* Inner image + canvas container */}
        {imgLoaded && (
          <div style={innerStyle}>
            {/* Background image */}
            <img
              ref={imgElRef}
              src={backgroundImage}
              alt="Question"
              style={{ display: 'block', width: displayW, height: displayH, userSelect: 'none' }}
              draggable={false}
            />

            {/* Annotation canvas — same CSS size as img, natural coords via width/height attrs */}
            <canvas
              ref={canvasRef}
              width={natW}
              height={natH}
              style={{ position: 'absolute', inset: 0, width: displayW, height: displayH }}
              className={cn('touch-none', canvasCursor)}
              onMouseDown={startAction}
              onMouseMove={continueAction}
              onMouseUp={endAction}
              onMouseLeave={endAction}
              onTouchStart={startAction}
              onTouchMove={continueAction}
              onTouchEnd={endAction}
            />

            {/* Floating text input */}
            {activeTextInput && (
              <div
                className="absolute z-20"
                style={{
                  left: activeTextInput.x * (displayW / natW),
                  top:  activeTextInput.y * (displayH / natH),
                  transform: 'translateY(-100%)',
                }}
              >
                <form onSubmit={handleTextSubmit}
                  className="flex flex-col bg-slate-900 border border-indigo-500 rounded-lg p-2 shadow-2xl min-w-[200px]">
                  <input
                    autoFocus
                    className="bg-transparent text-white border-none outline-none p-1 text-sm mb-2"
                    placeholder="Type feedback…"
                    value={currentText}
                    onChange={e => setCurrentText(e.target.value)}
                  />
                  <div className="flex justify-end gap-1">
                    <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-[10px]"
                      onClick={() => setActiveTextInput(null)}>Cancel</Button>
                    <Button type="submit" size="sm" className="h-6 px-2 text-[10px] bg-indigo-600">Add</Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Image-nav dots for read-only */}
        {readOnly && totalImages > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 gap-4 shadow-2xl z-30">
            <Button variant="ghost" size="icon" onClick={onPrev} disabled={currentIndex === 0}
              className="text-white hover:bg-white/20 rounded-full h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalImages }).map((_, i) => (
                <div key={i} className={cn('h-2 rounded-full transition-all', i === currentIndex ? 'w-4 bg-indigo-500' : 'w-2 bg-white/30')} />
              ))}
            </div>
            <Button variant="ghost" size="icon" onClick={onNext} disabled={currentIndex >= totalImages - 1}
              className="text-white hover:bg-white/20 rounded-full h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="py-1.5 px-4 bg-slate-900/50 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
        <div className="flex gap-2">
          <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase">HD</span>
          <span>Scroll = Zoom • Space/Middle-click = Pan</span>
        </div>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
