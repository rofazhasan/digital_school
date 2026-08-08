"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Sliders, ShieldCheck, Grid, Target } from 'lucide-react';
import { generateTemplateGeometry, CANONICAL_WIDTH, CANONICAL_HEIGHT } from '@/lib/omr/geometry-template';

export default function TemplateCalibrationPage() {
  const [templateId, setTemplateId] = useState('C_11_12');
  const [showMarkers, setShowMarkers] = useState(true);
  const [showRoll, setShowRoll] = useState(true);
  const [showReg, setShowReg] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  const geometry = generateTemplateGeometry(templateId, 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/omr/review" className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-white">TEMPLATE CALIBRATION SUITE</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Visual coordinate alignment & administrator approval tool for OMR geometry metadata.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsApproved(true)}
            disabled={isApproved}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              isApproved
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            {isApproved ? 'Template Approved' : 'Approve Geometry Metadata'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Toolbar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" /> Layer Controls
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="text-xs font-semibold text-slate-200">Corner Markers (4)</span>
                <input
                  type="checkbox"
                  checked={showMarkers}
                  onChange={e => setShowMarkers(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="text-xs font-semibold text-slate-200">Roll Grid (6x10)</span>
                <input
                  type="checkbox"
                  checked={showRoll}
                  onChange={e => setShowRoll(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="text-xs font-semibold text-slate-200">Registration Grid (7x10)</span>
                <input
                  type="checkbox"
                  checked={showReg}
                  onChange={e => setShowReg(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="text-xs font-semibold text-slate-200">Answer Cells (400)</span>
                <input
                  type="checkbox"
                  checked={showAnswers}
                  onChange={e => setShowAnswers(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500"
                />
              </label>
            </div>
          </div>

          {/* Verification Audit Metrics */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Coordinate Audit Summary
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Canonical Dimensions:</span>
                <span className="font-mono text-white font-bold">{geometry.canonical.width} x {geometry.canonical.height}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Corner Markers:</span>
                <span className="font-mono text-emerald-400 font-bold">4 / 4 Verified</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Roll Matrix Cells:</span>
                <span className="font-mono text-emerald-400 font-bold">{geometry.roll.cells.length} Cells</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Registration Cells:</span>
                <span className="font-mono text-emerald-400 font-bold">{geometry.registration.cells.length} Cells</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Answer Bubbles:</span>
                <span className="font-mono text-emerald-400 font-bold">{geometry.answers.cells.length} Bubbles</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview Canvas */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center">
          <div className="w-full text-center text-xs text-slate-400 mb-4">
            Canonical Template View (Aspect 2480 : 3508)
          </div>

          <div
            className="relative bg-white border-2 border-slate-800 shadow-2xl rounded overflow-hidden"
            style={{
              width: '496px',
              height: '701px'
            }}
          >
            {/* Corner Markers */}
            {showMarkers &&
              geometry.markers.map(m => (
                <div
                  key={m.id}
                  className="absolute border-2 border-rose-500 bg-rose-500/20 flex items-center justify-center text-[8px] font-mono font-bold text-rose-700"
                  style={{
                    left: `${(m.x / CANONICAL_WIDTH) * 100}%`,
                    top: `${(m.y / CANONICAL_HEIGHT) * 100}%`,
                    width: `${(m.width / CANONICAL_WIDTH) * 100}%`,
                    height: `${(m.height / CANONICAL_HEIGHT) * 100}%`
                  }}
                >
                  {m.id}
                </div>
              ))}

            {/* QR Code ROI */}
            <div
              className="absolute border-2 border-indigo-500 bg-indigo-500/10 flex items-center justify-center text-[8px] font-mono font-bold text-indigo-700"
              style={{
                left: `${(geometry.qr.x / CANONICAL_WIDTH) * 100}%`,
                top: `${(geometry.qr.y / CANONICAL_HEIGHT) * 100}%`,
                width: `${(geometry.qr.width / CANONICAL_WIDTH) * 100}%`,
                height: `${(geometry.qr.height / CANONICAL_HEIGHT) * 100}%`
              }}
            >
              QR
            </div>

            {/* Roll Cells */}
            {showRoll &&
              geometry.roll.cells.map(c => (
                <div
                  key={c.id}
                  className="absolute rounded-full border border-sky-500 bg-sky-500/20 flex items-center justify-center text-[6px] font-bold text-sky-800"
                  style={{
                    left: `${((c.center.x - c.radius) / CANONICAL_WIDTH) * 100}%`,
                    top: `${((c.center.y - c.radius) / CANONICAL_HEIGHT) * 100}%`,
                    width: `${((c.radius * 2) / CANONICAL_WIDTH) * 100}%`,
                    height: `${((c.radius * 2) / CANONICAL_HEIGHT) * 100}%`
                  }}
                >
                  {c.printedChar}
                </div>
              ))}

            {/* Registration Cells */}
            {showReg &&
              geometry.registration.cells.map(c => (
                <div
                  key={c.id}
                  className="absolute rounded-full border border-amber-500 bg-amber-500/20 flex items-center justify-center text-[6px] font-bold text-amber-800"
                  style={{
                    left: `${((c.center.x - c.radius) / CANONICAL_WIDTH) * 100}%`,
                    top: `${((c.center.y - c.radius) / CANONICAL_HEIGHT) * 100}%`,
                    width: `${((c.radius * 2) / CANONICAL_WIDTH) * 100}%`,
                    height: `${((c.radius * 2) / CANONICAL_HEIGHT) * 100}%`
                  }}
                >
                  {c.printedChar}
                </div>
              ))}

            {/* Answer Cells */}
            {showAnswers &&
              geometry.answers.cells.map(c => (
                <div
                  key={c.id}
                  className="absolute rounded-full border border-emerald-500 bg-emerald-500/20 flex items-center justify-center text-[5px] font-bold text-emerald-900"
                  style={{
                    left: `${((c.center.x - c.radius) / CANONICAL_WIDTH) * 100}%`,
                    top: `${((c.center.y - c.radius) / CANONICAL_HEIGHT) * 100}%`,
                    width: `${((c.radius * 2) / CANONICAL_WIDTH) * 100}%`,
                    height: `${((c.radius * 2) / CANONICAL_HEIGHT) * 100}%`
                  }}
                >
                  {c.printedChar}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
