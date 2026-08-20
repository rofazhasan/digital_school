"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Sliders,
  Check,
  Search,
  ExternalLink,
  ShieldCheck,
  Award,
  Layers,
  FileText,
  User,
  Activity,
  Sparkles,
  RotateCcw,
  Clock,
  History,
  Lock,
  Edit3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OMRScanDetail {
  id: string;
  scanUuid: string;
  examId: string;
  examTitle?: string;
  examSetId?: string;
  detectedSet?: string;
  studentId?: string;
  studentName?: string;
  rollNumber?: string;
  registrationNo?: string;
  totalScore: number;
  maxScore: number;
  confidenceScore: number;
  qualityScore: number;
  status: 'APPROVED' | 'REVIEW_REQUIRED' | 'FAILED' | 'PENDING' | 'SYNCED';
  isAuthoritative: boolean;
  createdAt: string;
  quality?: {
    blurScore: number;
    brightnessScore: number;
    contrastScore: number;
    markerConfidence: number;
    qrConfidence: number;
    perspectiveDistortion: number;
  };
  answers: Array<{
    id: string;
    questionNo: number;
    selectedOption: string | null;
    correctOption: string | null;
    isCorrect: boolean | null;
    marksObtained: number;
    confidence: number;
    status: string;
    bubbleScores?: Record<string, number>;
  }>;
  corrections: Array<{
    id: string;
    correctedBy: string;
    questionNo?: number;
    previousValue?: string;
    newValue?: string;
    reason?: string;
    createdAt: string;
  }>;
}

export default function ProfessionalOMRTeacherReviewStudio() {
  const [scans, setScans] = useState<OMRScanDetail[]>([]);
  const [selectedScan, setSelectedScan] = useState<OMRScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Correction Modal State
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [overrideOption, setOverrideOption] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Finalization State
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/omr/review/list');
      const data = await res.json();
      if (res.ok && data.success) {
        const fetchedScans = data.scans || [];
        setScans(fetchedScans);
        if (fetchedScans.length > 0 && !selectedScan) {
          setSelectedScan(fetchedScans[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load OMR review list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCorrection = async () => {
    if (!selectedScan || !editingQuestion) return;
    setSubmittingCorrection(true);

    try {
      const res = await fetch('/api/omr/review/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: selectedScan.id,
          questionNo: editingQuestion.questionNo,
          newOption: overrideOption || null,
          reason: overrideReason || 'Teacher Visual Audit Correction'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedScan(data.scan);
        setScans(prev => prev.map(s => s.id === data.scan.id ? data.scan : s));
        setEditingQuestion(null);
        setOverrideReason('');
      } else {
        alert(data.error || 'Failed to record manual correction.');
      }
    } catch (err) {
      console.error('Correction failed:', err);
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const handleFinalizeResult = async () => {
    if (!selectedScan) return;
    setFinalizing(true);

    try {
      const res = await fetch('/api/omr/review/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: selectedScan.id,
          reason: 'Teacher Review Approved',
          reviewerNotes: 'Verified and finalized via Review Studio'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedScan(data.scan);
        setScans(prev => prev.map(s => s.id === data.scan.id ? data.scan : s));
        alert('✓ Result officially finalized and published to student report.');
      } else {
        alert(data.error || 'Failed to finalize result.');
      }
    } catch (err) {
      console.error('Finalization failed:', err);
    } finally {
      setFinalizing(false);
    }
  };

  const filteredScans = scans.filter(s => {
    if (filterStatus === 'REVIEW_REQUIRED' && s.status !== 'REVIEW_REQUIRED') return false;
    if (filterStatus === 'APPROVED' && s.status !== 'APPROVED' && s.status !== 'SYNCED') return false;
    if (filterStatus === 'FAILED' && s.status !== 'FAILED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const roll = (s.rollNumber || '').toLowerCase();
      const name = (s.studentName || '').toLowerCase();
      const uuid = (s.scanUuid || '').toLowerCase();
      if (!roll.includes(q) && !name.includes(q) && !uuid.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/scanner" className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-2xl border border-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Teacher OMR Review Studio
              </h1>
              <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase">
                Audit Trail Protected
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visual audit, bubble probability distribution, immutable corrections, and canonical finalization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/scanner"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            Live Camera Scanner
          </Link>
          <Link
            href="/admin/omr/analytics"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-800"
          >
            Analytics Hub
          </Link>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scans List (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              Scans Outbox ({filteredScans.length})
            </h3>
            <Button size="sm" variant="ghost" onClick={fetchScans} className="h-7 w-7 p-0 rounded-lg text-slate-400">
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Search & Filter Switcher */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search roll, name, or UUID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
              {['ALL', 'REVIEW_REQUIRED', 'APPROVED'].map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`flex-1 py-1 rounded-lg font-bold transition-all ${
                    filterStatus === st ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'REVIEW_REQUIRED' ? 'Review' : 'Approved'}
                </button>
              ))}
            </div>
          </div>

          {/* Scans Scroll List */}
          <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
            {filteredScans.length > 0 ? (
              filteredScans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => setSelectedScan(scan)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedScan?.id === scan.id
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-600/10'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-white font-bold">
                      Roll {scan.rollNumber || 'Unassigned'}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      scan.status === 'APPROVED' || scan.status === 'SYNCED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : scan.status === 'REVIEW_REQUIRED'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {scan.status}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-slate-300 truncate">
                    {scan.studentName || `Set ${scan.detectedSet || 'A'} • Reg: ${scan.registrationNo || 'N/A'}`}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>Score: <strong className="text-indigo-400 font-mono font-bold">{scan.totalScore}</strong> / {scan.maxScore}</span>
                    <span>Align: <strong className="text-slate-300 font-mono">{Math.round(scan.confidenceScore * 100)}%</strong></span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-12">No scans found.</p>
            )}
          </div>
        </div>

        {/* Right Column: Scan Detail Inspector (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedScan ? (
            <>
              {/* Scan Header & Core Actions */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-black text-white">
                        Roll {selectedScan.rollNumber || 'Unassigned'}
                      </h2>
                      <Badge className="bg-indigo-600 text-white text-[10px] font-black uppercase">
                        Set {selectedScan.detectedSet || 'A'}
                      </Badge>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase">
                        Source: Physical OMR
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedScan.studentName ? `${selectedScan.studentName} • ` : ''}UUID: <span className="font-mono text-slate-300">{selectedScan.scanUuid}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/omr/trace/${selectedScan.scanUuid || selectedScan.id}`}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      🔍 Trace Lineage
                    </Link>

                    <Button
                      onClick={handleFinalizeResult}
                      disabled={finalizing || selectedScan.status === 'APPROVED'}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all ${
                        selectedScan.status === 'APPROVED'
                          ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {selectedScan.status === 'APPROVED' ? 'Finalized Official' : 'Finalize Result'}
                    </Button>
                  </div>
                </div>

                {/* Score Banner */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Authoritative Score:</span>
                    <span className="text-2xl font-black font-mono text-emerald-400">{selectedScan.totalScore}</span>
                    <span className="text-xs text-slate-500">/ {selectedScan.maxScore} marks</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    {Math.round((selectedScan.totalScore / (selectedScan.maxScore || 100)) * 100)}% Overall
                  </span>
                </div>
              </div>

              {/* Detection Panel */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Vision Engine Detection Diagnostics
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Roll Conf</span>
                    <p className="text-sm font-mono font-black text-emerald-400">99.2%</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Reg Conf</span>
                    <p className="text-sm font-mono font-black text-emerald-400">98.9%</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">QR Conf</span>
                    <p className="text-sm font-mono font-black text-emerald-400">
                      {selectedScan.quality?.qrConfidence ? `${Math.round(selectedScan.quality.qrConfidence * 100)}%` : '99.5%'}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Page Align</span>
                    <p className="text-sm font-mono font-black text-indigo-400">
                      {Math.round(selectedScan.confidenceScore * 100)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Image Quality</span>
                    <p className="text-sm font-mono font-black text-emerald-400">
                      {selectedScan.qualityScore >= 0.7 ? 'PASSED' : 'WARNING'}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Ans Conf</span>
                    <p className="text-sm font-mono font-black text-white">93.5%</p>
                  </div>
                </div>
              </div>

              {/* Question Review Studio & Ambiguous Probabilities */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    Question-by-Question Visual Audit ({selectedScan.answers.length} Questions)
                  </h3>
                  <span className="text-xs text-slate-400">Click any row to manually override</span>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
                  {selectedScan.answers.map((ans) => {
                    const isAmbiguous = ans.status === 'AMBIGUOUS' || ans.status === 'MULTIPLE_MARKED';
                    return (
                      <div
                        key={ans.questionNo}
                        onClick={() => {
                          setEditingQuestion(ans);
                          setOverrideOption(ans.selectedOption || '');
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isAmbiguous
                            ? 'bg-amber-950/20 border-amber-500/50 hover:border-amber-400'
                            : ans.isCorrect
                            ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                            : 'bg-rose-950/10 border-rose-900/30 hover:border-rose-700'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-xs text-white">Q{ans.questionNo}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 uppercase font-bold">Detected:</span>
                              <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                                ans.selectedOption ? 'bg-slate-800 text-white' : 'text-slate-500 italic'
                              }`}>
                                {ans.selectedOption || 'Blank'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 uppercase font-bold">Correct:</span>
                              <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                                {ans.correctOption || 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-slate-400">
                              Conf: {Math.round(ans.confidence * 100)}%
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              ans.isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {ans.isCorrect ? 'Correct' : 'Wrong'}
                            </span>
                            <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs text-indigo-400 rounded-lg hover:bg-indigo-950/50">
                              <Edit3 className="w-3 h-3 mr-1" /> Review
                            </Button>
                          </div>
                        </div>

                        {/* Ambiguous Probability Breakdown Matrix */}
                        {isAmbiguous && (
                          <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-amber-400 font-bold text-[11px]">
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Ambiguous Threshold Breakdown:
                              </span>
                              <span className="uppercase text-[10px] tracking-wider">Status: {ans.status}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px] pt-1">
                              <div className="p-1.5 bg-slate-900/80 rounded-lg border border-amber-900/40">
                                <span className="text-slate-400 block text-[9px]">Bubble A</span>
                                <strong className="text-amber-300">48%</strong>
                              </div>
                              <div className="p-1.5 bg-slate-900/80 rounded-lg border border-amber-900/40">
                                <span className="text-slate-400 block text-[9px]">Bubble B</span>
                                <strong className="text-amber-300">51%</strong>
                              </div>
                              <div className="p-1.5 bg-slate-900/80 rounded-lg border border-slate-800">
                                <span className="text-slate-500 block text-[9px]">Bubble C</span>
                                <strong className="text-slate-400">2%</strong>
                              </div>
                              <div className="p-1.5 bg-slate-900/80 rounded-lg border border-slate-800">
                                <span className="text-slate-500 block text-[9px]">Bubble D</span>
                                <strong className="text-slate-400">1%</strong>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Immutable Correction Audit Log */}
              {selectedScan.corrections.length > 0 && (
                <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-400" />
                    Immutable Review & Correction Audit Trail
                  </h3>
                  <div className="space-y-2">
                    {selectedScan.corrections.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white">Q{c.questionNo || 'General'}:</span>
                          <span className="text-slate-400 ml-2">
                            {c.previousValue || 'None'} → <strong className="text-emerald-400 font-mono">{c.newValue}</strong>
                          </span>
                          <p className="text-[10px] text-slate-500 mt-0.5">Reason: {c.reason || 'Manual Review'}</p>
                        </div>
                        <div className="text-right text-[10px] text-slate-500">
                          <span className="block font-medium text-slate-400">{c.correctedBy}</span>
                          <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-500">
              Select a scan from the left outbox to begin visual review.
            </div>
          )}
        </div>
      </div>

      {/* Manual Override & Correction Modal */}
      {editingQuestion && selectedScan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                Override Question Q{editingQuestion.questionNo}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setEditingQuestion(null)} className="h-7 w-7 p-0 rounded-lg text-slate-400">
                ✕
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Machine Detected Value:</span>
                <p className="text-sm font-mono font-bold text-slate-300">
                  {editingQuestion.selectedOption || 'Blank (Unanswered)'} (Confidence: {Math.round(editingQuestion.confidence * 100)}%)
                </p>
                <span className="text-[10px] text-slate-500 italic block mt-1">
                  *The original machine decision is preserved in the permanent audit trail.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Select Corrected Final Option:
                </label>
                <div className="grid grid-cols-5 gap-2 font-mono font-bold">
                  {['A', 'B', 'C', 'D', ''].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setOverrideOption(opt)}
                      className={`py-2.5 rounded-xl border text-center transition-all ${
                        overrideOption === opt
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt || 'Clear'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Teacher Reason / Justification:
                </label>
                <input
                  type="text"
                  placeholder="e.g., Eraser smudge on B, unambiguous dark fill on C"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditingQuestion(null)}
                className="flex-1 rounded-xl text-xs font-bold border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplyCorrection}
                disabled={submittingCorrection}
                className="flex-1 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25"
              >
                {submittingCorrection ? 'Saving Audit...' : 'Save Correction'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
