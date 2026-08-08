'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, Users, Award, Target, ChevronUp, ChevronDown,
  Minus, Download, RefreshCw, ArrowLeft, Layers, AlertTriangle
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  average: number; median: number; highest: number; lowest: number;
  passCount: number; failCount: number;
}

interface ScoreBucket   { label: string; count: number; min: number; max: number; }
interface GradeEntry    { grade: string; count: number; percent: number; }
interface QuestionDiff  { questionNo: number; correctRate: number; wrongRate: number; blankRate: number; difficulty: string; respondents: number; }
interface SetEntry      { set: string; count: number; average: number; highest: number; lowest: number; }
interface Ranker        { rank: number; rollNumber: string; registrationNo: string; score: number; maxScore: number; percentage: number; detectedSet: string; scanId: string; }

interface AnalyticsData {
  examId: string;
  totalScanned: number;
  maxScore: number;
  stats: Stats;
  scoreDistribution: ScoreBucket[];
  gradeDistribution: GradeEntry[];
  questionDifficulty: QuestionDiff[];
  setComparison: SetEntry[];
  ranking: Ranker[];
}

// ─── Visual helpers ───────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  'A+': '#10b981', A: '#34d399', 'A-': '#6ee7b7',
  B: '#60a5fa', C: '#fbbf24', D: '#f97316', F: '#ef4444',
};
const DIFF_COLORS: Record<string, string> = {
  EASY: '#10b981', MEDIUM: '#f59e0b', HARD: '#ef4444', UNKNOWN: '#6b7280',
};

function StatCard({ label, value, sub, color = 'text-white' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
      <div className="text-xs text-white/40 mb-2">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </div>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ─── Score Histogram ─────────────────────────────────────────────────────────

function ScoreHistogram({ buckets }: { buckets: ScoreBucket[] }) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
        <BarChart3 size={14} className="text-violet-400" /> Score Distribution
      </h3>
      <div className="flex items-end gap-2 h-32">
        {buckets.map((b) => {
          const pct = (b.count / maxCount) * 100;
          return (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[9px] text-white/40">{b.count > 0 ? b.count : ''}</div>
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height:     `${Math.max(pct, 2)}%`,
                  background: pct > 60 ? '#10b981' : pct > 30 ? '#f59e0b' : '#6366f1',
                  opacity:    b.count === 0 ? 0.15 : 1,
                }}
              />
              <div className="text-[8px] text-white/30 text-center leading-tight">{b.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Grade Donut ─────────────────────────────────────────────────────────────

function GradeDistribution({ grades }: { grades: GradeEntry[] }) {
  const total = grades.reduce((a, b) => a + b.count, 0);
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
        <Award size={14} className="text-violet-400" /> Grade Distribution
      </h3>
      <div className="space-y-3">
        {grades.map((g) => (
          <div key={g.grade} className="flex items-center gap-3">
            <span className="w-8 text-sm font-bold" style={{ color: GRADE_COLORS[g.grade] || '#9ca3af' }}>
              {g.grade}
            </span>
            <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${g.percent}%`, background: GRADE_COLORS[g.grade] || '#9ca3af' }}
              />
            </div>
            <span className="text-xs text-white/50 w-12 text-right">{g.count} ({g.percent}%)</span>
          </div>
        ))}
        {grades.length === 0 && <p className="text-white/20 text-xs text-center py-4">No grade data</p>}
      </div>
    </div>
  );
}

// ─── Question Difficulty Heatmap ─────────────────────────────────────────────

function QuestionHeatmap({ questions }: { questions: QuestionDiff[] }) {
  const [sortBy, setSortBy] = useState<'questionNo' | 'correctRate'>('questionNo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = [...questions].sort((a, b) => {
    const v = sortDir === 'asc' ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy];
    return v;
  });

  const toggle = (col: 'questionNo' | 'correctRate') => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: string }) =>
    sortBy === col
      ? sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
      : <Minus size={10} className="opacity-30" />;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Target size={14} className="text-violet-400" /> Question Difficulty Analysis
      </h3>

      {/* Difficulty summary chips */}
      {['EASY', 'MEDIUM', 'HARD'].map((d) => {
        const count = questions.filter((q) => q.difficulty === d).length;
        return (
          <span key={d} className="inline-flex items-center gap-1 mr-3 mb-4 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
            style={{ background: DIFF_COLORS[d] + '20', color: DIFF_COLORS[d], borderColor: DIFF_COLORS[d] + '40' }}>
            {count} {d}
          </span>
        );
      })}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-white/30 border-b border-white/5">
              <th className="text-left pb-2 cursor-pointer" onClick={() => toggle('questionNo')}>
                <span className="flex items-center gap-1">Q# <SortIcon col="questionNo" /></span>
              </th>
              <th className="text-left pb-2 cursor-pointer" onClick={() => toggle('correctRate')}>
                <span className="flex items-center gap-1">Correct % <SortIcon col="correctRate" /></span>
              </th>
              <th className="text-left pb-2">Wrong %</th>
              <th className="text-left pb-2">Blank %</th>
              <th className="text-left pb-2">Bar</th>
              <th className="text-left pb-2">Level</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 50).map((q) => (
              <tr key={q.questionNo} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="py-1.5 text-white/60">{q.questionNo}</td>
                <td className="py-1.5 text-emerald-400 font-semibold">{q.correctRate}%</td>
                <td className="py-1.5 text-red-400">{q.wrongRate}%</td>
                <td className="py-1.5 text-white/30">{q.blankRate}%</td>
                <td className="py-1.5 w-24">
                  <div className="flex gap-0.5 h-2">
                    <div className="rounded-full bg-emerald-500" style={{ width: `${q.correctRate}%` }} />
                    <div className="rounded-full bg-red-500"     style={{ width: `${q.wrongRate}%` }} />
                    <div className="rounded-full bg-white/10"   style={{ width: `${q.blankRate}%` }} />
                  </div>
                </td>
                <td className="py-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                    style={{ background: DIFF_COLORS[q.difficulty] + '25', color: DIFF_COLORS[q.difficulty] }}>
                    {q.difficulty}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {questions.length > 50 && (
          <p className="text-white/20 text-[10px] mt-3 text-center">Showing top 50 questions.</p>
        )}
      </div>
    </div>
  );
}

// ─── Ranking Table ────────────────────────────────────────────────────────────

function RankingTable({ ranking, examId }: { ranking: Ranker[]; examId: string }) {
  const [search, setSearch] = useState('');

  const filtered = ranking.filter(
    (r) => r.rollNumber.includes(search) || r.registrationNo.includes(search)
  );

  const exportCSV = () => {
    const header = 'Rank,Roll,Registration,Score,Max,Percentage,Set\n';
    const rows = ranking.map(
      (r) => `${r.rank},${r.rollNumber},${r.registrationNo},${r.score},${r.maxScore},${r.percentage}%,${r.detectedSet}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `omr_ranking_${examId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users size={14} className="text-violet-400" /> Student Ranking
          <span className="text-white/30 font-normal text-xs">({ranking.length} students)</span>
        </h3>
        <button
          onClick={exportCSV}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 flex items-center gap-1"
        >
          <Download size={11} /> Export CSV
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by roll or registration..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 mb-4"
      />

      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#0a0a18]">
            <tr className="text-white/30 border-b border-white/5">
              <th className="text-left pb-2 pr-3">Rank</th>
              <th className="text-left pb-2 pr-3">Roll</th>
              <th className="text-left pb-2 pr-3">Registration</th>
              <th className="text-left pb-2 pr-3">Score</th>
              <th className="text-left pb-2 pr-3">%</th>
              <th className="text-left pb-2 pr-3">Set</th>
              <th className="text-left pb-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.scanId} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                <td className="py-1.5 pr-3">
                  <span className={`font-bold ${r.rank <= 3 ? 'text-yellow-400' : 'text-white/50'}`}>
                    #{r.rank}
                  </span>
                </td>
                <td className="py-1.5 pr-3 text-white/70">{r.rollNumber}</td>
                <td className="py-1.5 pr-3 text-white/70">{r.registrationNo}</td>
                <td className="py-1.5 pr-3 font-semibold text-white">{r.score}/{r.maxScore}</td>
                <td className="py-1.5 pr-3">
                  <span className={r.percentage >= 80 ? 'text-emerald-400' : r.percentage >= 40 ? 'text-yellow-400' : 'text-red-400'}>
                    {r.percentage}%
                  </span>
                </td>
                <td className="py-1.5 pr-3 text-white/40">{r.detectedSet}</td>
                <td className="py-1.5">
                  <Link
                    href={`/api/omr/certificate/${r.scanId}`}
                    target="_blank"
                    className="text-violet-400 hover:text-violet-300 underline"
                  >
                    PDF
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId') || '';

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputExamId, setInputExamId] = useState(examId);

  const load = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/omr/analytics?examId=${id}`);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setData(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (examId) load(examId); }, [examId]);

  return (
    <div className="min-h-screen bg-[#070711] text-white font-sans">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/[0.02] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/omr/sessions" className="text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">OMR Analytics</h1>
              <p className="text-sm text-white/40">Score distribution, question difficulty, grade breakdown</p>
            </div>
          </div>

          {/* Exam ID input */}
          <div className="flex items-center gap-3">
            <input
              value={inputExamId}
              onChange={(e) => setInputExamId(e.target.value)}
              placeholder="Paste Exam ID…"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 w-60"
            />
            <button
              onClick={() => load(inputExamId)}
              disabled={!inputExamId || loading}
              className="px-4 py-2 rounded-xl bg-violet-600 text-sm text-white font-semibold hover:bg-violet-500 disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? <RefreshCw size={13} className="animate-spin" /> : <TrendingUp size={13} />}
              Load
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 flex items-center gap-3 text-red-300 text-sm">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20 text-white/30">
            <RefreshCw size={20} className="animate-spin mr-3" /> Loading analytics…
          </div>
        )}

        {data && !loading && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <StatCard label="Total Scanned"  value={data.totalScanned} />
              <StatCard label="Average Score"  value={data.stats.average.toFixed(1)} sub={`/ ${data.maxScore}`} />
              <StatCard label="Median Score"   value={data.stats.median.toFixed(1)} />
              <StatCard label="Highest"        value={data.stats.highest} color="text-emerald-400" />
              <StatCard label="Passed"         value={data.stats.passCount} color="text-emerald-400" sub={`${Math.round((data.stats.passCount / data.totalScanned) * 100)}%`} />
              <StatCard label="Failed"         value={data.stats.failCount} color="text-red-400" />
            </div>

            {/* Set comparison */}
            {data.setComparison.length > 1 && (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Layers size={14} className="text-violet-400" /> Set-wise Comparison
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.setComparison.map((s) => (
                    <div key={s.set} className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
                      <div className="text-lg font-bold text-violet-400 mb-1">Set {s.set}</div>
                      <div className="text-xs text-white/40">{s.count} students</div>
                      <div className="text-sm font-semibold text-white mt-2">Avg: {s.average}</div>
                      <div className="text-xs text-white/30">H: {s.highest} · L: {s.lowest}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ScoreHistogram buckets={data.scoreDistribution} />
              <GradeDistribution grades={data.gradeDistribution} />
            </div>

            {/* Question difficulty */}
            <QuestionHeatmap questions={data.questionDifficulty} />

            {/* Full ranking */}
            <RankingTable ranking={data.ranking} examId={data.examId} />
          </>
        )}

        {!data && !loading && !error && (
          <div className="text-center py-24">
            <BarChart3 size={48} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">Enter an Exam ID above to load analytics.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OMRAnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070711] flex items-center justify-center text-white/30">Loading…</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}
