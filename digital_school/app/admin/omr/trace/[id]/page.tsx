"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  QrCode,
  User,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Search,
  Activity,
  Award,
  Clock,
  Printer,
  ChevronRight,
  Database
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OMRTraceDiagnosticPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [trace, setTrace] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionFilter, setQuestionFilter] = useState<'ALL' | 'WRONG' | 'CORRECT' | 'REVIEW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTrace();
  }, [id]);

  const fetchTrace = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/omr/trace/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load trace data.');
      }
      setTrace(data.trace);
    } catch (err: any) {
      setError(err.message || 'Error fetching scan trace lineage.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-lg font-black uppercase tracking-tight text-white">Reconstructing Trace Lineage...</h2>
          <p className="text-xs text-slate-400">Loading scan geometry, QR context, bubble reads, and canonical evaluation...</p>
        </div>
      </div>
    );
  }

  if (error || !trace) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Trace Lookup Failed</h2>
          <p className="text-xs text-slate-400">{error || 'Scan record could not be found in database.'}</p>
          <Button onClick={() => router.back()} className="rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const filteredQuestions = (trace.questions || []).filter((q: any) => {
    if (questionFilter === 'WRONG' && q.isCorrect) return false;
    if (questionFilter === 'CORRECT' && !q.isCorrect) return false;
    if (questionFilter === 'REVIEW' && q.status !== 'AMBIGUOUS' && q.status !== 'MULTIPLE_MARKED') return false;

    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      const qText = (q.questionText || '').toLowerCase();
      const qNum = String(q.sequenceNumber);
      if (!qText.includes(s) && !qNum.includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/omr/review" className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-2xl border border-slate-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                  OMR Traceability & Lineage Audit
                </h1>
                <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase">
                  13-Stage Verified
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan UUID: <span className="font-mono text-indigo-400">{trace.scan.scanUuid}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={trace.result.studentResultUrl}
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Student Result View
            </Link>
            <Button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Audit Certificate
            </Button>
          </div>
        </div>

        {/* 13-Stage Flow Breadcrumb Diagram */}
        <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800/80 shadow-xl overflow-x-auto">
          <div className="flex items-center gap-2 min-w-[750px] text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-800/80 font-bold text-indigo-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Paper Scan
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
            <div className="px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-800/80 font-bold text-indigo-300 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" /> QR Decoded
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
            <div className="px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-800/80 font-bold text-indigo-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Roll {trace.student.roll}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
            <div className="px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-800/80 font-bold text-indigo-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Set {trace.examSet.name}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Canonical Sub
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 font-bold text-emerald-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Score: {trace.evaluation.totalScore}/{trace.evaluation.maxScore}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
            <div className="px-3 py-1.5 rounded-xl bg-blue-950/60 border border-blue-800/80 font-bold text-blue-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Result ID: {trace.result.id?.slice(0, 8)}...
            </div>
          </div>
        </div>

        {/* 4 Metadata Diagnostics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Student Identity */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Candidate</span>
              <User className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-base font-black text-white">{trace.student.name}</h3>
            <div className="text-xs text-slate-400 space-y-0.5">
              <p>Roll: <span className="font-mono font-bold text-white">{trace.student.roll}</span></p>
              <p>Reg: <span className="font-mono text-slate-300">{trace.student.registrationNo}</span></p>
              <p>Class: <span className="text-slate-300">{trace.student.class} ({trace.student.section})</span></p>
            </div>
          </div>

          {/* Card 2: Exam & Set Context */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Exam Context</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-base font-black text-white truncate">{trace.exam.name}</h3>
            <div className="text-xs text-slate-400 space-y-0.5">
              <p>Subject: <span className="text-slate-300">{trace.exam.subject}</span></p>
              <p>Exam Set: <Badge className="bg-indigo-600 text-white text-[10px] font-black ml-1">Set {trace.examSet.name}</Badge></p>
              <p>Negative Penalty: <span className="font-bold text-rose-400">-{trace.exam.negativeMarking}</span></p>
            </div>
          </div>

          {/* Card 3: Camera & Vision Engine */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Capture Engine</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-base font-black text-white">v{trace.scan.templateVersion} ({trace.scan.templateId})</h3>
            <div className="text-xs text-slate-400 space-y-0.5">
              <p>Alignment Confidence: <span className="font-bold text-emerald-400">{Math.round(trace.scan.confidenceScore * 100)}%</span></p>
              <p>Quality Score: <span className="text-slate-300">{Math.round(trace.scan.qualityScore * 100)}%</span></p>
              <p>Scan Timestamp: <span className="text-slate-400">{new Date(trace.scan.scanTime).toLocaleTimeString()}</span></p>
            </div>
          </div>

          {/* Card 4: Evaluation Outcome */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Final Outcome</span>
              <Award className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{trace.evaluation.totalScore}</span>
              <span className="text-xs text-slate-400">/ {trace.evaluation.maxScore}</span>
              <Badge className="bg-emerald-500 text-white font-black text-[10px] ml-auto">
                Grade {trace.evaluation.grade}
              </Badge>
            </div>
            <div className="text-xs text-slate-400 space-y-0.5">
              <p>Percentage: <span className="font-bold text-emerald-400">{trace.evaluation.percentage}%</span></p>
              <p>Status: <span className="font-bold text-emerald-400">OFFICIALLY PUBLISHED</span></p>
            </div>
          </div>
        </div>

        {/* 100-Question Verification Table & Evidence Audit */}
        <div className="p-6 rounded-[2.5rem] bg-slate-900/60 border border-slate-800/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Question-by-Question Evidence Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Direct cross-comparison between physical bubble detection and authoritative question key
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'ALL', label: `All (${trace.questions.length})` },
                { id: 'WRONG', label: `Mistakes (${trace.questions.filter((q: any) => !q.isCorrect && q.physicalInput).length})` },
                { id: 'CORRECT', label: `Correct (${trace.questions.filter((q: any) => q.isCorrect).length})` },
                { id: 'REVIEW', label: `Ambiguous (${trace.questions.filter((q: any) => q.status === 'AMBIGUOUS' || q.status === 'MULTIPLE_MARKED').length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setQuestionFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    questionFilter === f.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search question number or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">Question & Key</th>
                  <th className="p-3.5">Physical Bubble</th>
                  <th className="p-3.5">Confidence</th>
                  <th className="p-3.5">Marks Awarded</th>
                  <th className="p-3.5">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
                {filteredQuestions.map((q: any) => (
                  <tr key={q.sequenceNumber} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-white">Q{q.sequenceNumber}</td>
                    <td className="p-3.5 space-y-1 max-w-xs sm:max-w-md">
                      <p className="font-medium text-slate-200 line-clamp-2">{q.questionText}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Key:</span>
                        <span className="font-mono font-black text-emerald-400">
                          {q.correctAnswer || (q.correctOption !== undefined ? String.fromCharCode(65 + q.correctOption) : 'N/A')}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {q.physicalInput ? (
                        <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                          q.isCorrect ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {q.physicalInput}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Blank</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {Math.round(q.bubbleConfidence * 100)}%
                    </td>
                    <td className="p-3.5 font-mono font-bold">
                      <span className={q.awardedMarks > 0 ? 'text-emerald-400' : q.awardedMarks < 0 ? 'text-rose-400' : 'text-slate-500'}>
                        {q.awardedMarks > 0 ? `+${q.awardedMarks}` : q.awardedMarks}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 max-w-xs truncate italic">
                      {q.explanation || 'Official explanation available on student report.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
