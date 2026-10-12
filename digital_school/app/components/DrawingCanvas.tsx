"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Undo2, 
  Redo2,
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
  Pencil,
  Highlighter,
  Check,
  Download,
  Trash2,
  Stamp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser' | 'highlighter';
}

export interface TextAnnotation {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  id: string;
  isStamp?: boolean;
  bg?: string;
}

export type DrawTool = 'hand' | 'pen' | 'highlighter' | 'eraser' | 'text' | 'stamp';

export interface DrawingCanvasProps {
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

const COLOR_PALETTE = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Black', hex: '#0F172A' },
  { name: 'White', hex: '#FFFFFF' },
];

const QUICK_STAMPS = [
  { label: '✓', title: 'Correct', color: '#10B981', bg: '#DCFCE7' },
  { label: '✗', title: 'Incorrect', color: '#EF4444', bg: '#FEE2E2' },
  { label: '+1', title: 'Plus 1', color: '#059669', bg: '#D1FAE5' },
  { label: '+0.5', title: 'Half mark', color: '#0D9488', bg: '#CCFBF1' },
  { label: '-1', title: 'Minus 1', color: '#DC2626', bg: '#FFE4E6' },
  { label: '⭐', title: 'Excellent', color: '#F59E0B', bg: '#FEF3C7' },
];

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

  // Natural image dimensions
  const [natW, setNatW] = useState(1920);
  const [natH, setNatH] = useState(1080);

  // Container fit base CSS size
  const [displayW, setDisplayW] = useState(0);
  const [displayH, setDisplayH] = useState(0);

  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgLoadingError, setImgLoadingError] = useState(false);
  const [tool, setTool] = useState<DrawTool>(readOnly ? 'hand' : 'pen');
  const [color, setColor] = useState('#EF4444');
  const [lineWidth, setLineWidth] = useState(4);
  const [selectedStamp, setSelectedStamp] = useState(QUICK_STAMPS[0]);

  // Clean data helpers
  const sanitizeStrokes = (st: any): Stroke[] => {
    if (!st) return [];
    if (typeof st === 'string') {
      try { st = JSON.parse(st); } catch { return []; }
    }
    if (!Array.isArray(st)) return [];
    return st.filter((s: any) => s && Array.isArray(s.points) && s.points.length > 0);
  };

  const sanitizeTexts = (tx: any): TextAnnotation[] => {
    if (!tx) return [];
    if (typeof tx === 'string') {
      try { tx = JSON.parse(tx); } catch { return []; }
    }
    if (!Array.isArray(tx)) return [];
    return tx.filter(Boolean);
  };

  const [strokes, setStrokes] = useState<Stroke[]>(() => sanitizeStrokes(initialStrokes));
  const [texts, setTexts] = useState<TextAnnotation[]>(() => sanitizeTexts(initialTexts));

  // Multi-step undo & redo
  const [history, setHistory] = useState<{ strokes: Stroke[]; texts: TextAnnotation[] }[]>(() => [
    { strokes: sanitizeStrokes(initialStrokes), texts: sanitizeTexts(initialTexts) }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [showAnnotations, setShowAnnotations] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePanning, setIsSpacePanning] = useState(false);
  const [activeTextInput, setActiveTextInput] = useState<{ x: number; y: number } | null>(null);
  const [currentText, setCurrentText] = useState('');

  // Active stroke in-memory ref for zero-latency 120 FPS drawing
  const isDrawingRef = useRef(false);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const lastPanPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Stale-closure refs for listeners
  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panXRef.current = panX; }, [panX]);
  useEffect(() => { panYRef.current = panY; }, [panY]);

  // Sync incoming props
  useEffect(() => {
    const s = sanitizeStrokes(initialStrokes);
    const t = sanitizeTexts(initialTexts);
    setStrokes(s);
    setTexts(t);
    setHistory([{ strokes: s, texts: t }]);
    setHistoryIndex(0);
  }, [initialStrokes, initialTexts]);

  // Safe image index & total display
  const safeTotal = Math.max(totalImages || 0, 1);
  const safeIndex = Math.min(Math.max(currentIndex || 0, 0), safeTotal - 1);

  // ─── Image Loading (with robust CORS fallback) ──────────────────────────────────
  useEffect(() => {
    if (!backgroundImage) {
      setImgLoaded(false);
      setImgLoadingError(false);
      return;
    }

    setImgLoaded(false);
    setImgLoadingError(false);

    let cancelled = false;

    const loadImg = (useCors: boolean) => {
      const img = new Image();
      if (useCors) img.crossOrigin = 'anonymous';

      img.onload = () => {
        if (cancelled) return;
        const container = containerRef.current;
        const w = img.naturalWidth || img.width || 1200;
        const h = img.naturalHeight || img.height || 800;

        setNatW(w);
        setNatH(h);

        const padW = (container?.clientWidth || window.innerWidth) - 32;
        const padH = (container?.clientHeight || window.innerHeight) - 48;
        const ratio = Math.min(padW / w, padH / h, 1);

        setDisplayW(Math.max(w * ratio, 320));
        setDisplayH(Math.max(h * ratio, 240));

        // Center on initial fit
        setZoom(1);
        setPanX(0);
        setPanY(0);
        setImgLoaded(true);
      };

      img.onerror = () => {
        if (cancelled) return;
        if (useCors) {
          // Retry without crossOrigin
          loadImg(false);
        } else {
          console.warn('[DrawingCanvas] Background image failed to load, falling back to default view:', backgroundImage);
          setNatW(1280);
          setNatH(900);
          setDisplayW(1000);
          setDisplayH(700);
          setImgLoaded(true);
          setImgLoadingError(true);
        }
      };

      img.src = backgroundImage;
    };

    loadImg(true);

    return () => {
      cancelled = true;
    };
  }, [backgroundImage]);

  // ─── Full Canvas Redraw Function ──────────────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showAnnotations) return;

    // 1. Draw all committed strokes with spline smoothing
    strokes.forEach(stroke => {
      if (!stroke || !Array.isArray(stroke.points) || stroke.points.length === 0) return;
      const pts = stroke.points;

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.globalCompositeOperation = 'multiply';
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      if (pts.length === 1) {
        ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else if (pts.length === 2) {
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.stroke();
      } else {
        // Catmull-Rom / Midpoint Quadratic Spline for butter-smooth ink
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const midX = (pts[i].x + pts[i + 1].x) / 2;
          const midY = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 2. Draw text and stamps
    texts.forEach(t => {
      ctx.save();
      if (t.isStamp) {
        // Render stylized stamp badge
        const badgePaddingX = 14;
        const badgePaddingY = 8;
        const fontSize = Math.max(t.size, 22);
        ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
        const metrics = ctx.measureText(t.text);
        const w = metrics.width + badgePaddingX * 2;
        const h = fontSize + badgePaddingY * 2;
        const rx = t.x - w / 2;
        const ry = t.y - h / 2;
        const radius = 10;

        // Shadow & Background
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = t.bg || '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(rx, ry, w, h, radius) : ctx.rect(rx, ry, w, h);
        ctx.fill();

        // Border
        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = t.color;
        ctx.stroke();

        // Text
        ctx.fillStyle = t.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.text, t.x, t.y);
      } else {
        // Freeform text annotation with high-contrast text border
        ctx.font = `bold ${Math.max(t.size, 18)}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Outer white glow/halo for readability on any dark/light background
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = Math.max(3, t.size / 6);
        ctx.lineJoin = 'round';
        ctx.strokeText(t.text, t.x, t.y);

        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
      }
      ctx.restore();
    });
  }, [strokes, texts, showAnnotations]);

  useEffect(() => {
    if (!imgLoaded) return;
    redrawCanvas();
  }, [imgLoaded, redrawCanvas]);

  // ─── History Management ────────────────────────────────────────────────────────
  const pushHistory = (newStrokes: Stroke[], newTexts: TextAnnotation[]) => {
    const updated = history.slice(0, historyIndex + 1);
    updated.push({ strokes: [...newStrokes], texts: [...newTexts] });
    if (updated.length > 30) updated.shift();
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setStrokes(prev.strokes);
      setTexts(prev.texts);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setStrokes(next.strokes);
      setTexts(next.texts);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleClearAll = () => {
    if (strokes.length === 0 && texts.length === 0) return;
    if (confirm("Clear all annotations on this image?")) {
      setStrokes([]);
      setTexts([]);
      pushHistory([], []);
      toast.info("Annotations cleared");
    }
  };

  // ─── Coordinate Mapping ───────────────────────────────────────────────────────
  const toImageCoords = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };

    const scaleX = natW / rect.width;
    const scaleY = natH / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, [natW, natH]);

  // ─── Pointer Event Handlers (Butter-Smooth 120 FPS Engine) ────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;

    // Middle-click or Space or Hand Tool -> Pan
    if (e.button === 1 || isSpacePanning || tool === 'hand') {
      setIsPanning(true);
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }

    if (e.button !== 0) return; // Only left button for drawing

    const pos = toImageCoords(e.clientX, e.clientY);

    // Stamp tool
    if (tool === 'stamp') {
      const stampAnnotation: TextAnnotation = {
        id: `stamp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        x: pos.x,
        y: pos.y,
        text: selectedStamp.label,
        color: selectedStamp.color,
        bg: selectedStamp.bg,
        size: 26,
        isStamp: true,
      };
      const updatedTexts = [...texts, stampAnnotation];
      setTexts(updatedTexts);
      pushHistory(strokes, updatedTexts);
      return;
    }

    // Text tool
    if (tool === 'text') {
      setActiveTextInput(pos);
      return;
    }

    // Pen / Highlighter / Eraser
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const strokeWidth = tool === 'highlighter' ? 24 : tool === 'eraser' ? lineWidth * 3 : lineWidth;
    const strokeColor = tool === 'highlighter' ? '#FACC15' : color;
    const activeTool = tool === 'highlighter' ? 'highlighter' : tool === 'eraser' ? 'eraser' : 'pen';

    activeStrokeRef.current = {
      points: [pos],
      color: strokeColor,
      width: strokeWidth,
      tool: activeTool,
    };

    // Draw initial dot immediately
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, strokeWidth / 2, 0, Math.PI * 2);
        if (activeTool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fill();
        } else if (activeTool === 'highlighter') {
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = strokeColor;
          ctx.globalCompositeOperation = 'multiply';
          ctx.fill();
        } else {
          ctx.fillStyle = strokeColor;
          ctx.fill();
        }
        ctx.restore();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Panning
    if (isPanning) {
      const dx = e.clientX - lastPanPointRef.current.x;
      const dy = e.clientY - lastPanPointRef.current.y;
      setPanX(prev => prev + dx);
      setPanY(prev => prev + dy);
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isDrawingRef.current || !activeStrokeRef.current) return;

    const pos = toImageCoords(e.clientX, e.clientY);
    const pts = activeStrokeRef.current.points;
    const lastPos = pts[pts.length - 1];

    // Minimal distance filter for smoother interpolation
    const distSq = (pos.x - lastPos.x) ** 2 + (pos.y - lastPos.y) ** 2;
    if (distSq < 2) return;

    pts.push(pos);

    // Direct 2D context rendering with zero React lag
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const len = pts.length;
    if (len >= 2) {
      const p0 = pts[len - 2];
      const p1 = pts[len - 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = activeStrokeRef.current.color;
      ctx.lineWidth = activeStrokeRef.current.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (activeStrokeRef.current.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.globalCompositeOperation = 'multiply';
      } else if (activeStrokeRef.current.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      if (len === 2) {
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(midX, midY);
      } else {
        const pPrev = pts[len - 3];
        const prevMidX = (pPrev.x + p0.x) / 2;
        const prevMidY = (pPrev.y + p0.y) / 2;
        ctx.moveTo(prevMidX, prevMidY);
        ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      }

      ctx.stroke();
      ctx.restore();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (isPanning) {
      setIsPanning(false);
    }

    if (isDrawingRef.current && activeStrokeRef.current) {
      isDrawingRef.current = false;
      const completedStroke = { ...activeStrokeRef.current };
      activeStrokeRef.current = null;

      const newStrokes = [...strokes, completedStroke];
      setStrokes(newStrokes);
      pushHistory(newStrokes, texts);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerUp(e);
  };

  // ─── Text Annotation Submit ───────────────────────────────────────────────────
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentText.trim() || !activeTextInput) return;

    const newText: TextAnnotation = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      x: activeTextInput.x,
      y: activeTextInput.y,
      text: currentText.trim(),
      color,
      size: Math.max(18, lineWidth * 5),
    };

    const updated = [...texts, newText];
    setTexts(updated);
    pushHistory(strokes, updated);
    setCurrentText('');
    setActiveTextInput(null);
  };

  // ─── Wheel Zoom & Key Listeners ───────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      const curZoom = zoomRef.current;
      const nextZoom = Math.min(Math.max(0.4, curZoom + delta * curZoom), 8);

      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Maintain focal point under mouse
      const factor = nextZoom / curZoom;
      setPanX(prev => mouseX - (mouseX - prev) * factor);
      setPanY(prev => mouseY - (mouseY - prev) * factor);
      setZoom(nextZoom);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !activeTextInput) {
        setIsSpacePanning(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
      if (e.key === 'ArrowRight' && onNext) {
        onNext();
      }
      if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePanning(false);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [activeTextInput, onNext, onPrev]);

  // ─── Reset Zoom ───────────────────────────────────────────────────────────────
  const resetZoom = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // ─── High-Res Merge & Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);

    try {
      const outCanvas = document.createElement('canvas');
      outCanvas.width = natW;
      outCanvas.height = natH;
      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) throw new Error("Could not initialize 2D context");

      // Load background onto outCanvas
      await new Promise<void>((resolve) => {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.onload = () => {
          outCtx.drawImage(bgImg, 0, 0, natW, natH);
          resolve();
        };
        bgImg.onerror = () => {
          // If CORS fails, try without crossOrigin or draw white background
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            try { outCtx.drawImage(fallbackImg, 0, 0, natW, natH); } catch {}
            resolve();
          };
          fallbackImg.onerror = () => {
            outCtx.fillStyle = '#FFFFFF';
            outCtx.fillRect(0, 0, natW, natH);
            resolve();
          };
          fallbackImg.src = backgroundImage;
        };
        bgImg.src = backgroundImage;
      });

      // Overlay annotations canvas
      const mainCanvas = canvasRef.current;
      if (mainCanvas && showAnnotations) {
        outCtx.drawImage(mainCanvas, 0, 0, natW, natH);
      }

      // Export as Blob with SecurityError catch
      const blob = await new Promise<Blob>((resolve, reject) => {
        try {
          outCanvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error("Canvas toBlob failed"));
          }, 'image/jpeg', 0.92);
        } catch (err) {
          // Canvas tainted fallback: export annotations directly
          if (mainCanvas) {
            mainCanvas.toBlob((b) => {
              if (b) resolve(b);
              else reject(err);
            }, 'image/png');
          } else {
            reject(err);
          }
        }
      });

      onSave(blob, { strokes, texts });
    } catch (err: any) {
      console.error("[DrawingCanvas] Error during save:", err);
      toast.error(`Save failed: ${err.message || String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Quick Download ───────────────────────────────────────────────────────────
  const handleDownload = () => {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = natW;
    outCanvas.height = natH;
    const outCtx = outCanvas.getContext('2d')!;

    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.onload = () => {
      outCtx.drawImage(bgImg, 0, 0, natW, natH);
      if (canvasRef.current && showAnnotations) {
        outCtx.drawImage(canvasRef.current, 0, 0, natW, natH);
      }
      try {
        const link = document.createElement('a');
        link.download = `graded_script_${Date.now()}.jpg`;
        link.href = outCanvas.toDataURL('image/jpeg', 0.92);
        link.click();
        toast.success("Script downloaded!");
      } catch {
        toast.error("Could not export script due to browser security restrictions.");
      }
    };
    bgImg.onerror = () => {
      if (canvasRef.current) {
        const link = document.createElement('a');
        link.download = `graded_script_${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
      }
    };
    bgImg.src = backgroundImage;
  };

  // ─── Style & Cursor ───────────────────────────────────────────────────────────
  const innerStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: displayW,
    height: displayH,
    transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${zoom})`,
    transformOrigin: 'center center',
    visibility: imgLoaded ? 'visible' : 'hidden',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    overflow: 'hidden',
    background: '#FFFFFF',
    transition: isPanning || isDrawingRef.current ? 'none' : 'transform 0.05s ease-out',
  };

  const canvasCursor = isPanning || isSpacePanning || tool === 'hand'
    ? 'cursor-grab active:cursor-grabbing'
    : readOnly
    ? 'cursor-default'
    : tool === 'text'
    ? 'cursor-text'
    : tool === 'stamp'
    ? 'cursor-pointer'
    : tool === 'highlighter'
    ? 'cursor-crosshair'
    : 'cursor-crosshair';

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800 select-none">
      
      {/* ── Top Studio Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 gap-2 z-30">
        
        {/* Left: Script Info, Pagination & Zoom */}
        <div className="flex items-center gap-2">
          {/* Pagination Controls */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700/60 shadow-inner">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrev}
              disabled={!onPrev || safeIndex === 0}
              className="h-8 w-8 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30"
              title="Previous script image (Left arrow)"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-indigo-300 border-x border-slate-700/60">
              {safeIndex + 1} / {safeTotal}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              disabled={!onNext || safeIndex >= safeTotal - 1}
              className="h-8 w-8 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30"
              title="Next script image (Right arrow)"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-0.5 bg-slate-800/60 p-0.5 rounded-xl border border-slate-700/40">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(z => Math.max(z - 0.25, 0.4))}
              className="h-8 w-8 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-[11px] font-mono font-bold text-slate-300 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(z => Math.min(z + 0.25, 8))}
              className="h-8 w-8 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetZoom}
              className="h-8 w-8 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
              title="Reset fit"
            >
              <Maximize className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Center: Interactive Teacher Grading Tools (Hidden in readOnly) */}
        {!readOnly && (
          <div className="flex items-center gap-2">
            {/* Tool Selection Group */}
            <div className="flex items-center p-1 bg-slate-800/90 rounded-xl border border-slate-700/80 gap-1 shadow-inner">
              {[
                { t: 'hand' as DrawTool, icon: Hand, title: 'Hand / Pan (Spacebar + Drag)' },
                { t: 'pen' as DrawTool, icon: Pencil, title: 'Pen (Smooth ink)' },
                { t: 'highlighter' as DrawTool, icon: Highlighter, title: 'Highlighter' },
                { t: 'stamp' as DrawTool, icon: Stamp, title: 'Quick Grade Stamps' },
                { t: 'text' as DrawTool, icon: Type, title: 'Add Text Feedback' },
                { t: 'eraser' as DrawTool, icon: Eraser, title: 'Eraser' },
              ].map(({ t, icon: Icon, title }) => (
                <button
                  key={t}
                  title={title}
                  onClick={() => setTool(t)}
                  className={cn(
                    'p-2 rounded-lg transition-all flex items-center justify-center',
                    tool === t
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                      : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            {/* Quick Stamps Picker (When Stamp Tool is Active) */}
            {tool === 'stamp' ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/80 rounded-xl border border-slate-700/60 animate-in fade-in duration-200">
                {QUICK_STAMPS.map(stamp => (
                  <button
                    key={stamp.label}
                    title={stamp.title}
                    onClick={() => setSelectedStamp(stamp)}
                    className={cn(
                      'px-2 py-1 text-xs font-black rounded-lg transition-all border',
                      selectedStamp.label === stamp.label
                        ? 'scale-110 shadow-lg border-white'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    )}
                    style={{ backgroundColor: stamp.bg, color: stamp.color }}
                  >
                    {stamp.label}
                  </button>
                ))}
              </div>
            ) : (
              /* Color Picker (For Pen/Text) */
              <div className="hidden lg:flex items-center gap-1.5 px-2 bg-slate-800/60 rounded-xl h-9 border border-slate-700/50">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c.hex}
                    title={c.name}
                    onClick={() => setColor(c.hex)}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 transition-transform',
                      color === c.hex ? 'scale-125 border-white shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            )}

            {/* Stroke Width Slider */}
            {tool === 'pen' && (
              <div className="w-20 px-2 hidden xl:block">
                <Slider
                  value={[lineWidth]}
                  onValueChange={v => setLineWidth(v[0])}
                  min={1}
                  max={12}
                  step={1}
                  title={`Stroke Width: ${lineWidth}px`}
                />
              </div>
            )}

            {/* Undo / Redo / Clear */}
            <div className="flex items-center gap-0.5 bg-slate-800/60 p-0.5 rounded-xl border border-slate-700/40">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-white disabled:opacity-20"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-white disabled:opacity-20"
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearAll}
                disabled={strokes.length === 0 && texts.length === 0}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-400 disabled:opacity-20"
                title="Clear all annotations"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Right Controls: Read-only Label, Visibility, Download & Save */}
        <div className="flex items-center gap-2">
          {readOnly && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold">
              <span>✍️ Teacher Graded View</span>
            </div>
          )}

          {/* Toggle Annotations Visibility */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAnnotations(v => !v)}
            className="h-9 w-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            title={showAnnotations ? "Hide Annotations (Show clean original)" : "Show Annotations"}
          >
            {showAnnotations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-amber-400" />}
          </Button>

          {/* Download Script */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-9 w-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            title="Download annotated script as image"
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Close Modal */}
          <Button
            variant="ghost"
            onClick={onCancel}
            className="h-9 px-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold"
          >
            Close
          </Button>

          {/* Save Button */}
          {!readOnly && onSave && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/30 px-5 text-xs font-bold gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Script</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* ── Viewport Canvas Area ── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center"
      >
        {/* Loading Spinner */}
        {!imgLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 z-20">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Loading High-Definition Script…
            </span>
          </div>
        )}

        {/* Inner Centered & Transformed Canvas Stage */}
        <div style={innerStyle}>
          {/* Background Image */}
          {backgroundImage && !imgLoadingError ? (
            <img
              ref={imgElRef}
              src={backgroundImage}
              alt="Student Submission Script"
              style={{
                display: 'block',
                width: displayW,
                height: displayH,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              draggable={false}
            />
          ) : (
            <div
              style={{ width: displayW, height: displayH }}
              className="bg-white flex flex-col items-center justify-center text-slate-400 border border-slate-300"
            >
              <span className="text-sm font-bold">Document Area</span>
            </div>
          )}

          {/* Annotation Canvas Layer */}
          <canvas
            ref={canvasRef}
            width={natW}
            height={natH}
            style={{
              position: 'absolute',
              inset: 0,
              width: displayW,
              height: displayH,
              touchAction: 'none',
            }}
            className={cn('touch-none select-none', canvasCursor)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          />

          {/* Floating Text Note Input */}
          {activeTextInput && (
            <div
              className="absolute z-30"
              style={{
                left: activeTextInput.x * (displayW / natW),
                top: activeTextInput.y * (displayH / natH),
                transform: 'translateY(-100%)',
              }}
            >
              <form
                onSubmit={handleTextSubmit}
                className="flex flex-col bg-slate-900/95 border-2 border-indigo-500 rounded-xl p-3 shadow-2xl min-w-[240px] backdrop-blur-md"
              >
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                  Teacher Note
                </div>
                <input
                  autoFocus
                  className="bg-slate-800 text-white border border-slate-700 rounded-lg p-2 text-sm mb-2 outline-none focus:border-indigo-500"
                  placeholder="e.g. Good step, -0.5 for calculation"
                  value={currentText}
                  onChange={e => setCurrentText(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-3 text-xs text-slate-400 hover:text-white"
                    onClick={() => setActiveTextInput(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    Add Note
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Floating Read-Only Navigation Pill for Mobile/Tablet Students */}
        {readOnly && safeTotal > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 gap-3 shadow-2xl z-30">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrev}
              disabled={safeIndex === 0}
              className="text-white hover:bg-white/20 rounded-full h-8 w-8 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xs font-black text-slate-300 font-mono tracking-wider">
              {safeIndex + 1} / {safeTotal}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              disabled={safeIndex >= safeTotal - 1}
              className="text-white hover:bg-white/20 rounded-full h-8 w-8 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Bottom Information Bar ── */}
      <div className="py-2 px-4 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-black text-[10px] uppercase">
            Ultra-HD
          </span>
          <span className="hidden sm:inline">
            Scroll = Zoom • Spacebar + Drag = Pan • Double-click = Reset
          </span>
          <span className="sm:hidden">Pinch to Zoom • Drag to Pan</span>
        </div>
        <div className="flex items-center gap-3 font-mono font-bold">
          <span>{natW} × {natH} px</span>
          <span className="text-indigo-400">{Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
