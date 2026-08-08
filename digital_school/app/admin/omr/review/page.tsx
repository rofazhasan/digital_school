"use client";

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Search, Filter, Eye, RefreshCw, Edit3, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ScanItem {
  id: string;
  scanUuid: string;
  studentName?: string;
  rollNumber?: string;
  registrationNo?: string;
  examName?: string;
  detectedSet?: string;
  totalScore: number;
  maxScore: number;
  confidenceScore: number;
  qualityScore: number;
  status: string;
  createdAt: string;
  rawAnswers?: Record<string, string>;
  evaluatedAnswers?: Record<string, any>;
}

export default function OMRReviewStudio() {
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScan, setSelectedScan] = useState<ScanItem | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [overrideOption, setOverrideOption] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');

  useEffect(() => {
    fetchScans();
  }, [filterStatus]);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/omr/review/list?status=${filterStatus}`);
      if (res.ok) {
        const data = await res.json();
        setScans(data.scans || []);
      } else {
        // Mock default state for UI display if API endpoint empty
        setScans([]);
      }
    } catch (_err) {
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredScans = scans.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      s.rollNumber?.toLowerCase().includes(term) ||
      s.registrationNo?.toLowerCase().includes(term) ||
      s.studentName?.toLowerCase().includes(term) ||
      s.scanUuid.toLowerCase().includes(term)
    );
  });

  const handleSaveCorrection = async () => {
    if (!selectedScan || editingQuestion === null) return;

    try {
      const res = await fetch('/api/omr/review/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: selectedScan.id,
          questionNo: editingQuestion,
          newOption: overrideOption,
          reason: overrideReason
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.updatedScan) {
          setSelectedScan(data.updatedScan);
          fetchScans();
        }
      }
    } catch (err) {
      console.error('Failed to save correction:', err);
    } finally {
      setEditingQuestion(null);
      setOverrideOption('');
      setOverrideReason('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-white">OMR REVIEW STUDIO V2</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Teacher verification & manual override studio for ambiguous scans and student result audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/omr/templates/calibrate"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-sm font-semibold border border-slate-700"
          >
            Calibration Tool
          </Link>
          <Link
            href="/admin/omr/lab"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20"
          >
            OMR Lab Benchmarks
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Scan List */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Roll, Reg, or Scan ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm w-full outline-none text-slate-100 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
            <div className="flex gap-1">
              {['ALL', 'REVIEW_REQUIRED', 'APPROVED', 'FAILED'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    filterStatus === status
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {status === 'REVIEW_REQUIRED' ? 'Review' : status}
                </button>
              ))}
            </div>

            <button onClick={fetchScans} className="p-2 text-slate-400 hover:text-white">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60 max-h-[700px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading scans...</div>
            ) : filteredScans.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No scans found for the selected filter.
              </div>
            ) : (
              filteredScans.map(scan => (
                <div
                  key={scan.id}
                  onClick={() => setSelectedScan(scan)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedScan?.id === scan.id ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-indigo-400 font-bold">
                      Roll: {scan.rollNumber || 'N/A'}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        scan.status === 'APPROVED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : scan.status === 'REVIEW_REQUIRED'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {scan.status}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-white">
                    {scan.studentName || `Reg: ${scan.registrationNo || 'Unassigned'}`}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                    <span>Score: {scan.totalScore} / {scan.maxScore}</span>
                    <span>Conf: {(scan.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Scan Inspector Studio */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
          {selectedScan ? (
            <>
              {/* Scan Header Details */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Scan Detail: Roll {selectedScan.rollNumber || 'Unassigned'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">Scan ID: {selectedScan.scanUuid}</p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400">
                    {selectedScan.totalScore} / {selectedScan.maxScore}
                  </div>
                  <div className="text-xs text-slate-400">Authoritative Score</div>
                </div>
              </div>

              {/* 100 Question Matrix */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Answer Grid (100 MCQ Questions)
                </h3>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-[420px] overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {Array.from({ length: 100 }).map((_, i) => {
                    const qNo = i + 1;
                    const selected = selectedScan.rawAnswers?.[qNo.toString()] || selectedScan.rawAnswers?.[qNo] || null;
                    const evalInfo = selectedScan.evaluatedAnswers?.[qNo.toString()] || selectedScan.evaluatedAnswers?.[qNo];
                    const isCorrect = evalInfo?.isCorrect;

                    return (
                      <div
                        key={qNo}
                        onClick={() => {
                          setEditingQuestion(qNo);
                          setOverrideOption(selected || '');
                        }}
                        className={`p-2 rounded-lg border text-center cursor-pointer transition-all hover:scale-105 ${
                          isCorrect === true
                            ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                            : isCorrect === false
                            ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                            : selected
                            ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="text-[9px] font-bold opacity-70">Q{qNo}</div>
                        <div className="text-sm font-black mt-0.5">{selected || '-'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Editing Modal / Drawer */}
              {editingQuestion !== null && (
                <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/60 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-indigo-300">
                      Override Question {editingQuestion} Option
                    </span>
                    <button onClick={() => setEditingQuestion(null)} className="text-xs text-slate-400 hover:text-white">
                      Cancel
                    </button>
                  </div>

                  <div className="flex gap-3 mb-3">
                    {['A', 'B', 'C', 'D', 'BLANK'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setOverrideOption(opt === 'BLANK' ? '' : opt)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm ${
                          (opt === 'BLANK' && !overrideOption) || overrideOption === opt
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Reason for correction (e.g. Light ballpoint fill)..."
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                    className="w-full bg-slate-900 text-sm p-2.5 rounded-lg border border-slate-800 text-white mb-3 outline-none"
                  />

                  <button
                    onClick={handleSaveCorrection}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Correction & Recalculate
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 text-center">
              <Eye className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Select a scan from the left panel to inspect and review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
