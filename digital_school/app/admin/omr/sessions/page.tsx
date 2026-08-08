'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FolderOpen, Plus, CheckCircle2, AlertTriangle, XCircle,
  Clock, Upload, Send, RefreshCw, ChevronDown, ChevronRight,
  BarChart3, Eye, Download, Layers
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionScan {
  id: string;
  status: string;
  totalScore: number;
  maxScore: number;
  rollNumber: string | null;
  registrationNo: string | null;
  createdAt: string;
}

interface SessionCounts {
  total: number;
  approved: number;
  review: number;
  failed: number;
  pending: number;
}

interface Session {
  id: string;
  sessionName: string;
  examinerId: string;
  examId: string | null;
  status: 'OPEN' | 'CLOSED' | 'PUBLISHED';
  totalFiles: number;
  processedFiles: number;
  isCompleted: boolean;
  completedAt: string | null;
  publishedAt: string | null;
  publishedCount: number;
  createdAt: string;
  counts: SessionCounts;
}

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  OPEN:      { label: 'Open',      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  CLOSED:    { label: 'Closed',    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  PUBLISHED: { label: 'Published', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

function StatusBadge({ status }: { status: 'OPEN' | 'CLOSED' | 'PUBLISHED' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function ProgressBar({ value, max, color = '#6366f1' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({ session, onAction }: { session: Session; onAction: (id: string, action: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const total = session.counts.total;
  const approved = session.counts.approved;
  const review = session.counts.review;
  const failed = session.counts.failed;

  const handleAction = async (action: string) => {
    setLoading(true);
    await onAction(session.id, action);
    setLoading(false);
  };

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.03] hover:bg-white/[0.05] transition-all">
      {/* Header row */}
      <div className="p-5 flex items-center gap-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-white/40 hover:text-white/70 transition-colors"
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-semibold text-white truncate">{session.sessionName}</span>
            <StatusBadge status={session.status} />
          </div>
          <div className="text-xs text-white/40">
            {new Date(session.createdAt).toLocaleString()} · {total} scans total
          </div>
        </div>

        {/* Mini stat pills */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 size={12} /> {approved}
          </span>
          <span className="flex items-center gap-1 text-yellow-400">
            <AlertTriangle size={12} /> {review}
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <XCircle size={12} /> {failed}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {session.status === 'OPEN' && (
            <button
              onClick={() => handleAction('close')}
              disabled={loading}
              className="px-3 py-1.5 text-xs rounded-lg bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all disabled:opacity-50"
            >
              Close
            </button>
          )}
          {session.status === 'CLOSED' && (
            <>
              <button
                onClick={() => handleAction('reopen')}
                disabled={loading}
                className="px-3 py-1.5 text-xs rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-all disabled:opacity-50"
              >
                Reopen
              </button>
              <button
                onClick={() => handleAction('publish')}
                disabled={loading || approved === 0}
                className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50 flex items-center gap-1"
              >
                <Send size={11} />
                Publish {approved > 0 && `(${approved})`}
              </button>
            </>
          )}
          {session.status === 'PUBLISHED' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400">
                {session.publishedCount} results published
              </span>
              <Link
                href={`/admin/omr/analytics?examId=${session.examId || ''}`}
                className="px-3 py-1.5 text-xs rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20 hover:bg-violet-500/20 transition-all flex items-center gap-1"
              >
                <BarChart3 size={11} /> Analytics
              </Link>
            </div>
          )}
          {loading && <RefreshCw size={14} className="animate-spin text-white/40" />}
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="px-5 pb-3">
          <ProgressBar value={approved} max={total} color="#10b981" />
          <div className="flex justify-between text-[10px] text-white/30 mt-1">
            <span>{approved} approved</span>
            <span>{Math.round((approved / total) * 100)}%</span>
          </div>
        </div>
      )}

      {/* Expanded scan list */}
      {expanded && total > 0 && (
        <div className="border-t border-white/10 px-5 py-3">
          <div className="text-xs text-white/40 mb-3 font-semibold uppercase tracking-wider">Scan Timeline</div>
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {/* Timeline placeholders — real scan list loaded via scan query */}
            <div className="text-xs text-white/30 italic text-center py-4">
              Open{' '}
              <Link href={`/admin/omr/review?sessionId=${session.id}`} className="text-violet-400 underline">
                Review Studio
              </Link>{' '}
              to inspect individual scans for this session.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── New Session Modal ────────────────────────────────────────────────────────

function NewSessionModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, examId: string) => void }) {
  const [name, setName] = useState('');
  const [examId, setExamId] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-4">New Scan Session</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Session name *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Half-Yearly 2026 — Class 10A"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Exam ID (optional)</label>
            <input
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              placeholder="Paste exam ID from the exam list"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => { onCreate(name.trim(), examId.trim()); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-all disabled:opacity-40"
          >
            Create Session
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OMRSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED' | 'PUBLISHED'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      const res = await fetch(`/api/omr/sessions${params}`);
      if (!res.ok) throw new Error('Failed to load sessions');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleCreate = async (name: string, examId: string) => {
    try {
      const res = await fetch('/api/omr/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName: name, examId: examId || null }),
      });
      if (!res.ok) throw new Error('Failed to create session');
      showToast('Session created!');
      loadSessions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch('/api/omr/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      if (action === 'publish') {
        showToast(`✓ ${data.publishedCount} result(s) published!`);
      } else {
        showToast(`Session ${action}d successfully.`);
      }
      loadSessions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredSessions = filter === 'ALL' ? sessions : sessions.filter((s) => s.status === filter);

  const totalStats = sessions.reduce(
    (acc, s) => ({
      total:    acc.total    + s.counts.total,
      approved: acc.approved + s.counts.approved,
      review:   acc.review   + s.counts.review,
      failed:   acc.failed   + s.counts.failed,
    }),
    { total: 0, approved: 0, review: 0, failed: 0 }
  );

  return (
    <div className="min-h-screen bg-[#070711] text-white font-sans">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/10 bg-white/[0.02] px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Scan Session Manager</h1>
              <p className="text-sm text-white/40">Manage OMR batch scan sessions, publish results</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/omr/review"
              className="px-4 py-2 rounded-xl border border-white/10 text-sm text-white/60 hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <Eye size={14} /> Review Studio
            </Link>
            <Link
              href="/admin/omr/analytics"
              className="px-4 py-2 rounded-xl border border-white/10 text-sm text-white/60 hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <BarChart3 size={14} /> Analytics
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-violet-600 text-sm text-white font-semibold hover:bg-violet-500 transition-all flex items-center gap-2 shadow-lg shadow-violet-500/20"
            >
              <Plus size={14} /> New Session
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Scans',   value: totalStats.total,    color: 'text-white',        icon: <Layers size={16} /> },
            { label: 'Approved',      value: totalStats.approved, color: 'text-emerald-400',  icon: <CheckCircle2 size={16} /> },
            { label: 'Under Review',  value: totalStats.review,   color: 'text-yellow-400',   icon: <AlertTriangle size={16} /> },
            { label: 'Failed',        value: totalStats.failed,   color: 'text-red-400',      icon: <XCircle size={16} /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <div className={`flex items-center gap-2 text-sm mb-2 ${stat.color}`}>
                {stat.icon} {stat.label}
              </div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['ALL', 'OPEN', 'CLOSED', 'PUBLISHED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-violet-600 text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {f === 'ALL' ? `All (${sessions.length})` : f}
            </button>
          ))}
          <button
            onClick={loadSessions}
            className="ml-auto px-3 py-1.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Session list */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <RefreshCw size={20} className="animate-spin mr-3" /> Loading sessions…
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen size={40} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">No sessions found.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-5 py-2 rounded-xl bg-violet-600 text-sm text-white font-semibold hover:bg-violet-500 transition-all"
            >
              Create First Session
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <SessionRow key={session.id} session={session} onAction={handleAction} />
            ))}
          </div>
        )}
      </div>

      {/* New Session Modal */}
      {showModal && <NewSessionModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
    </div>
  );
}
