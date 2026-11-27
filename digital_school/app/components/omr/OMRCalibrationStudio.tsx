"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Upload,
  Crosshair,
  Play,
  Save,
  ScanLine,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Download,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
} from 'lucide-react';
import type { Template, FieldBlock, ScanProcessingResult } from '@/lib/omr/types';
import { PRESET_TEMPLATES, saveCalibratedTemplateLocal } from '@/lib/omr/presetTemplates';
import { parseTemplate } from '@/lib/omr/templateParser';
import { processOMR } from '@/lib/omr/omrEngine';
import { loadOpenCV, isOpenCVLoaded } from '@/lib/omr/opencvLoader';

interface OMRCalibrationStudioProps {
  onApplyAndScan: (template: Template, templateId?: string) => void;
}

const BLOCK_COLORS = ['#10b981', '#38bdf8', '#f472b6', '#f59e0b', '#a78bfa', '#fb7185', '#22d3ee'];

export function OMRCalibrationStudio({ onApplyAndScan }: OMRCalibrationStudioProps) {
  const [basePresetId, setBasePresetId] = useState<string>('bangladesh_board_hsc');
  const [templateName, setTemplateName] = useState<string>('Custom Calibrated Board OMR');
  const [template, setTemplate] = useState<Template>(() =>
    JSON.parse(JSON.stringify(PRESET_TEMPLATES.find((p) => p.id === 'bangladesh_board_hsc')?.template || PRESET_TEMPLATES[0].template))
  );
  const [selectedBlock, setSelectedBlock] = useState<string>('Roll');
  const [uploadedImg, setUploadedImg] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [testResult, setTestResult] = useState<ScanProcessingResult | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [savingDb, setSavingDb] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const blockNames = useMemo(() => Object.keys(template.fieldBlocks || {}), [template]);
  const parsedBubbles = useMemo(() => {
    try {
      return parseTemplate(template).bubbles;
    } catch {
      return [];
    }
  }, [template]);

  const handleLoadBasePreset = (id: string) => {
    setBasePresetId(id);
    const found = PRESET_TEMPLATES.find((p) => p.id === id);
    if (found) {
      const cloned: Template = JSON.parse(JSON.stringify(found.template));
      setTemplate(cloned);
      const firstKey = Object.keys(cloned.fieldBlocks)[0] || '';
      setSelectedBlock(firstKey);
      setTestResult(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      setUploadedImg(img);
      setTemplate((prev) => ({
        ...prev,
        pageDimensions: [img.width, img.height],
      }));
      setTestResult(null);
      setStatusMsg(`ইমেজ লোড হয়েছে (${img.width} × ${img.height} px)। যেকোনো ব্লক ড্র্যাগ বা অ্যারো দিয়ে অ্যালাইন করুন।`);
    };
    img.src = url;
    e.target.value = '';
  };

  // Render live calibration overlay canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const [pageW, pageH] = template.pageDimensions;
    canvas.width = pageW;
    canvas.height = pageH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, pageW, pageH);

    if (uploadedImg) {
      ctx.drawImage(uploadedImg, 0, 0, pageW, pageH);
    } else {
      // Clean grid paper placeholder
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, pageW, pageH);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let x = 0; x < pageW; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, pageH); ctx.stroke();
      }
      for (let y = 0; y < pageH; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(pageW, y); ctx.stroke();
      }
    }

    const [bw, bh] = template.bubbleDimensions;
    const blockColorMap = new Map<string, string>();
    blockNames.forEach((name, i) => blockColorMap.set(name, BLOCK_COLORS[i % BLOCK_COLORS.length]));

    for (const b of parsedBubbles) {
      const blockKey = Object.keys(template.fieldBlocks).find(
        (k) => template.fieldBlocks[k].section === b.section || k === b.section
      ) || '';
      const isActive = blockKey === selectedBlock;
      const color = blockColorMap.get(blockKey) || '#38bdf8';

      ctx.save();
      ctx.strokeStyle = isActive ? '#facc15' : color;
      ctx.lineWidth = isActive ? 3 : 1.8;
      ctx.fillStyle = isActive ? 'rgba(250, 204, 21, 0.22)' : 'rgba(16, 185, 129, 0.08)';
      ctx.beginPath();
      ctx.arc(b.x + bw / 2, b.y + bh / 2, Math.min(bw, bh) / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Draw selected block origin handle
    const sel = template.fieldBlocks[selectedBlock];
    if (sel) {
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.strokeRect(sel.origin[0] - 6, sel.origin[1] - 6, bw + 12, bh + 12);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`⊕ ${selectedBlock} (${Math.round(sel.origin[0])}, ${Math.round(sel.origin[1])})`, sel.origin[0], Math.max(20, sel.origin[1] - 12));
      ctx.restore();
    }
  }, [uploadedImg, template, parsedBubbles, selectedBlock, blockNames]);

  const canvasToPageCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = canvasToPageCoords(e);
    const sel = template.fieldBlocks[selectedBlock];
    if (!sel) return;
    setIsDragging(true);
    setDragOffset({ x: pt.x - sel.origin[0], y: pt.y - sel.origin[1] });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !template.fieldBlocks[selectedBlock]) return;
    const pt = canvasToPageCoords(e);
    const nextX = Math.max(0, Math.round(pt.x - dragOffset.x));
    const nextY = Math.max(0, Math.round(pt.y - dragOffset.y));
    updateSelectedBlock({ origin: [nextX, nextY] });
  };

  const handleMouseUp = () => setIsDragging(false);

  const updateSelectedBlock = (patch: Partial<FieldBlock>) => {
    setTemplate((prev) => {
      const cur = prev.fieldBlocks[selectedBlock];
      if (!cur) return prev;
      return {
        ...prev,
        fieldBlocks: {
          ...prev.fieldBlocks,
          [selectedBlock]: { ...cur, ...patch },
        },
      };
    });
  };

  const nudgeOrigin = (dx: number, dy: number) => {
    const cur = template.fieldBlocks[selectedBlock];
    if (!cur) return;
    updateSelectedBlock({ origin: [Math.max(0, cur.origin[0] + dx), Math.max(0, cur.origin[1] + dy)] });
  };

  const handleAddBlock = () => {
    const nextKey = `CustomBlock_${blockNames.length + 1}`;
    setTemplate((prev) => ({
      ...prev,
      fieldBlocks: {
        ...prev.fieldBlocks,
        [nextKey]: {
          origin: [120, 300],
          bubblesGap: 30,
          labelsGap: 28,
          fieldType: 'QTYPE_MCQ4',
          direction: 'horizontal',
          fieldLabels: ['q1..10'],
          bubbleValues: ['A', 'B', 'C', 'D'],
          section: nextKey,
        },
      },
    }));
    setSelectedBlock(nextKey);
  };

  const handleDeleteBlock = (key: string) => {
    if (blockNames.length <= 1) return;
    setTemplate((prev) => {
      const nextBlocks = { ...prev.fieldBlocks };
      delete nextBlocks[key];
      return { ...prev, fieldBlocks: nextBlocks };
    });
    const remaining = blockNames.filter((k) => k !== key);
    setSelectedBlock(remaining[0] || '');
  };

  const handleRunLiveTest = async () => {
    if (!uploadedImg) {
      setStatusMsg('লাইভ টেস্টের জন্য প্রথমে একটি স্ক্যান করা OMR ইমেজ আপলোড করুন।');
      return;
    }
    setIsTesting(true);
    setStatusMsg('OMR v3 ইঞ্জিন দিয়ে লাইভ ক্যালিব্রেশন টেস্ট চলছে...');
    try {
      if (!isOpenCVLoaded()) await loadOpenCV();
      const c = document.createElement('canvas');
      c.width = uploadedImg.width;
      c.height = uploadedImg.height;
      c.getContext('2d')?.drawImage(uploadedImg, 0, 0);
      const res = await processOMR(c, template, parsedBubbles, undefined, 'calibration_test.jpg', {
        generateCanvases: false,
        skipQR: true,
      });
      c.width = 0;
      c.height = 0;
      setTestResult(res);
      setStatusMsg(
        `লাইভ টেস্ট সম্পন্ন! কনফিডেন্স: ${Math.round((res.qualityMetrics?.averageConfidence || 0) * 100)}% • সনাক্তকৃত বাবল: ${Object.keys(res.responses).length} টি`
      );
    } catch (err: any) {
      setStatusMsg('টেস্ট ব্যর্থ হয়েছে: ' + (err?.message || err));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveToCloudAndScan = async () => {
    setSavingDb(true);
    const tplId = `calibrated_${templateName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || Date.now()}`;
    saveCalibratedTemplateLocal(tplId, template);
    try {
      await fetch('/api/omr-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: tplId,
          name: templateName,
          canonicalWidth: template.pageDimensions[0],
          canonicalHeight: template.pageDimensions[1],
          geometry: template,
        }),
      });
    } catch {
      // Offline / unauthenticated fallback handled by localStorage
    } finally {
      setSavingDb(false);
      onApplyAndScan(template, tplId);
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName.replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeBlock = template.fieldBlocks[selectedBlock];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Controls Panel */}
      <div className="lg:col-span-4 space-y-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-amber-400" />
              <span>থার্ড-পার্টি OMR ক্যালিব্রেশন</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-400">{parsedBubbles.length} বাবলস</span>
          </div>

          <div className="space-y-2 text-xs">
            <label className="block text-slate-400 text-[11px]">টেমপ্লেট নাম</label>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
            />
          </div>

          <div className="space-y-2 text-xs">
            <label className="block text-slate-400 text-[11px]">বেস প্রিসেট নির্বাচন</label>
            <select
              value={basePresetId}
              onChange={(e) => handleLoadBasePreset(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white cursor-pointer"
            >
              {PRESET_TEMPLATES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <label className="w-full py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition">
            <Upload className="w-4 h-4" />
            <span>{uploadedImg ? 'অন্য স্ক্যান ইমেজ পরিবর্তন করুন' : 'স্ক্যান করা OMR ইমেজ আপলোড করুন'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        {/* Field Block Selector & Fine Nudger */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">ফিল্ড ব্লকস ({blockNames.length})</span>
            <button
              type="button"
              onClick={handleAddBlock}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> নতুন ব্লক
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {blockNames.map((name, i) => (
              <div key={name} className="inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setSelectedBlock(name)}
                  className={`px-2.5 py-1 rounded-l-lg text-[11px] font-bold cursor-pointer border ${
                    selectedBlock === name
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: BLOCK_COLORS[i % BLOCK_COLORS.length] }}
                  />
                  {name}
                </button>
                {blockNames.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(name)}
                    className="px-1.5 py-1 rounded-r-lg bg-slate-950 hover:bg-rose-900/50 text-slate-500 hover:text-rose-300 border border-l-0 border-slate-800 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {activeBlock && (
            <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              {/* Directional Nudge Pad */}
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">
                  Origin: <strong className="text-amber-300 font-mono">{Math.round(activeBlock.origin[0])}, {Math.round(activeBlock.origin[1])}</strong>
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => nudgeOrigin(-2, 0)} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"><ArrowLeft className="w-3 h-3" /></button>
                  <button type="button" onClick={() => nudgeOrigin(0, -2)} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"><ArrowUp className="w-3 h-3" /></button>
                  <button type="button" onClick={() => nudgeOrigin(0, 2)} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"><ArrowDown className="w-3 h-3" /></button>
                  <button type="button" onClick={() => nudgeOrigin(2, 0)} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"><ArrowRight className="w-3 h-3" /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Bubbles Gap (px)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={activeBlock.bubblesGap}
                    onChange={(e) => updateSelectedBlock({ bubblesGap: parseFloat(e.target.value) || 10 })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Labels Gap (px)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={activeBlock.labelsGap}
                    onChange={(e) => updateSelectedBlock({ labelsGap: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Bubble Size (px)</label>
                  <input
                    type="number"
                    value={template.bubbleDimensions[0]}
                    onChange={(e) => {
                      const v = Math.max(8, parseInt(e.target.value, 10) || 20);
                      setTemplate((prev) => ({ ...prev, bubbleDimensions: [v, v] }));
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Direction</label>
                  <select
                    value={activeBlock.direction || 'horizontal'}
                    onChange={(e) => updateSelectedBlock({ direction: e.target.value as 'horizontal' | 'vertical' })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="horizontal">Horizontal (MCQ)</option>
                    <option value="vertical">Vertical (Roll/Reg)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleRunLiveTest}
              disabled={!uploadedImg || isTesting}
              className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isTesting ? 'লাইভ টেস্ট চলছে...' : 'লাইভ বাবল রিডিং টেস্ট করুন'}</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveToCloudAndScan}
                disabled={savingDb}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingDb ? 'সেভ হচ্ছে...' : 'সেভ ও স্ক্যানারে চালু করুন'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadJson}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                title="JSON ডাউনলোড"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {statusMsg && (
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
              {statusMsg}
            </div>
          )}

          {testResult && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5 text-[11px]">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> লাইভ রিডিং রেজাল্ট:
              </div>
              <div className="text-slate-200 font-mono">
                Roll: <strong>{testResult.concatenatedResponses?.Roll || '-'}</strong> | Reg:{' '}
                <strong>{testResult.concatenatedResponses?.Registration || '-'}</strong> | Set:{' '}
                <strong>{testResult.concatenatedResponses?.Set || '-'}</strong>
              </div>
              <div className="text-slate-300">
                Marked Fields: {Object.keys(testResult.responses).length} • Confidence:{' '}
                {Math.round((testResult.qualityMetrics?.averageConfidence || 0) * 100)}% • Align:{' '}
                {testResult.qualityMetrics?.alignmentMethod}
              </div>
              {testResult.flags.length > 0 && (
                <div className="text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> {testResult.flags[0]}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Interactive Drag-to-Calibrate Canvas */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-semibold text-slate-200">
            <ScanLine className="w-4 h-4 text-indigo-400" />
            ইন্টারেক্টিভ ক্যালিব্রেশন ক্যানভাস (সিলেক্টেড হলুদ ব্লক মাউস দিয়ে ড্র্যাগ করুন)
          </span>
          <span className="font-mono text-[11px]">
            {template.pageDimensions[0]} × {template.pageDimensions[1]} px
          </span>
        </div>

        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-2 overflow-auto flex items-center justify-center">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="max-w-full max-h-[760px] h-auto rounded-lg cursor-crosshair shadow-xl"
          />
        </div>
      </div>
    </div>
  );
}
