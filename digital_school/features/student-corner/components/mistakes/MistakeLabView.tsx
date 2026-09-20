'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  BarChart3,
  TrendingDown,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  getMistakeLabAction,
  createMistakeAction,
  resolveMistakeAction,
  addMistakeRetestToTodayArenaAction,
} from '../../actions/mistake-actions';
import { FALLACY_CATEGORIES } from '../../services/mistake-service';
import { toast } from 'sonner';

export function MistakeLabView() {
  const [loading, setLoading] = useState(true);
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [dueRetests, setDueRetests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterResolved, setFilterResolved] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [examCode, setExamCode] = useState('');
  const [subjectName, setSubjectName] = useState('Physics');
  const [chapterName, setChapterName] = useState('');
  const [questionDetails, setQuestionDetails] = useState('');
  const [fallacyCategory, setFallacyCategory] = useState('CALCULATION_TRAP');
  const [rootCause, setRootCause] = useState('');
  const [remedialRule, setRemedialRule] = useState('');
  const [retestDaysOffset, setRetestDaysOffset] = useState(3);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    const isResolvedParam = filterResolved === 'RESOLVED' ? true : filterResolved === 'PENDING' ? false : undefined;
    const res = await getMistakeLabAction({
      isResolved: isResolvedParam,
      fallacyCategory: filterCategory,
      search,
    });

    if (res.success) {
      setMistakes(res.mistakes || []);
      setAnalytics(res.analytics || null);
      setDueRetests(res.dueRetests || []);
    } else {
      toast.error(res.error || 'Failed to load Mistake Lab');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filterResolved, filterCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterName.trim() || !questionDetails.trim() || !rootCause.trim() || !remedialRule.trim()) {
      toast.error('Please fill in chapter, problem, root cause, and remedial rule');
      return;
    }

    const res = await createMistakeAction({
      examCode,
      subjectName,
      chapterName,
      questionDetails,
      fallacyCategory,
      rootCause,
      remedialRule,
      retestDaysOffset,
      notes,
    });

    if (res.success) {
      toast.success('Mistake logged! Remedial retest scheduled.');
      setCreateModalOpen(false);
      setChapterName('');
      setQuestionDetails('');
      setRootCause('');
      setRemedialRule('');
      setNotes('');
      loadData();
    } else {
      toast.error(res.error || 'Failed to record mistake');
    }
  };

  const handleResolve = async (mistakeId: string) => {
    const res = await resolveMistakeAction(mistakeId, 100);
    if (res.success) {
      toast.success('Mistake marked resolved!');
      loadData();
    } else {
      toast.error(res.error || 'Failed to resolve mistake');
    }
  };

  const handleAddRetestToArena = async (mistakeId: string) => {
    const res = await addMistakeRetestToTodayArenaAction(mistakeId, 30);
    if (res.success) {
      toast.success('Remedial retest added to Today\'s Arena!');
    } else {
      toast.error(res.error || 'Failed to add retest to arena');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-background border border-rose-500/20 rounded-2xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Mistake & Fallacy Lab
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Error diary, root cause diagnostics, and automatic remedial retests in Today&apos;s Arena.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-lg shadow-rose-600/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log New Mistake
          </Button>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/40">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Due Retests Today
            </p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-extrabold text-amber-400">
                {dueRetests.length}
              </h3>
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                Requires Retest
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Unforced errors to eliminate</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Resolution Rate
            </p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-extrabold text-emerald-400">
                {analytics?.resolutionRate ?? 100}%
              </h3>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                Mastered
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {analytics?.resolvedCount ?? 0} of {analytics?.totalErrors ?? 0} resolved
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Top Error Fallacy
            </p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-bold text-rose-400 truncate max-w-[140px]">
                {analytics?.topFallacies?.[0]?.label || 'None'}
              </h3>
              <Badge variant="outline" className="border-rose-500/30 text-rose-400 text-xs">
                {analytics?.topFallacies?.[0]?.percentage || 0}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Primary trap to guard against</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Error Hotspot Subject
            </p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-bold text-foreground truncate max-w-[140px]">
                {analytics?.subjectHotspots?.[0]?.subject || 'None'}
              </h3>
              <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                {analytics?.subjectHotspots?.[0]?.count || 0} errors
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Requires dedicated problem solving</p>
          </CardContent>
        </Card>
      </div>

      {/* Fallacy Distribution Bar */}
      {analytics?.topFallacies && analytics.topFallacies.length > 0 && (
        <Card className="bg-card/40 border-border/40 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-rose-400" />
                Error Taxonomy Breakdown
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                Identified patterns in question bank & mock tests
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {analytics.topFallacies.map((tf: any) => (
                <div
                  key={tf.category}
                  className="p-3 rounded-xl border border-border/50 bg-muted/20 flex flex-col justify-between"
                >
                  <div className="text-xs font-medium text-foreground truncate mb-1" title={tf.label}>
                    {tf.label}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold" style={{ color: tf.color }}>
                      {tf.count}
                    </span>
                    <span className="text-xs text-muted-foreground">{tf.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
          <Button
            size="sm"
            variant={filterResolved === 'ALL' ? 'default' : 'outline'}
            onClick={() => setFilterResolved('ALL')}
            className="text-xs rounded-full h-8"
          >
            All Errors
          </Button>
          <Button
            size="sm"
            variant={filterResolved === 'PENDING' ? 'default' : 'outline'}
            onClick={() => setFilterResolved('PENDING')}
            className="text-xs rounded-full h-8 text-amber-400"
          >
            Pending Retest ({analytics?.unresolvedCount ?? 0})
          </Button>
          <Button
            size="sm"
            variant={filterResolved === 'RESOLVED' ? 'default' : 'outline'}
            onClick={() => setFilterResolved('RESOLVED')}
            className="text-xs rounded-full h-8 text-emerald-400"
          >
            Resolved ({analytics?.resolvedCount ?? 0})
          </Button>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search errors, questions..."
              className="pl-9 h-9 text-xs bg-muted/30"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-9 px-3">
            Search
          </Button>
        </form>
      </div>

      {/* Mistakes Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Loading Mistake Lab records...
        </div>
      ) : mistakes.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl border-border/60 bg-muted/10">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-foreground">Clean slate — No mistakes logged</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Whenever you miss a question in mock tests or question banks, log it here to eliminate repeated mistakes.
          </p>
          <Button onClick={() => setCreateModalOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Log First Mistake
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mistakes.map((m) => {
            const fallacyObj = FALLACY_CATEGORIES.find((f) => f.id === m.fallacyCategory);
            const isDueRetest = !m.isResolved && m.nextRetestDate && new Date(m.nextRetestDate) <= new Date();

            return (
              <Card
                key={m.id}
                className={`relative border transition-all ${
                  m.isResolved
                    ? 'border-emerald-500/20 bg-card/40 opacity-80'
                    : isDueRetest
                    ? 'border-rose-500/40 bg-gradient-to-b from-rose-500/5 to-card/60 shadow-lg shadow-rose-500/5'
                    : 'border-border/40 bg-card/40 hover:border-border/80'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                        {m.errorNumber}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {m.subjectName} — {m.chapterName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {m.isResolved ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                          Resolved
                        </Badge>
                      ) : isDueRetest ? (
                        <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] animate-pulse">
                          Retest Due
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                          Scheduled
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold"
                      style={{ color: fallacyObj?.color || '#ef4444' }}
                    >
                      {fallacyObj?.label || m.fallacyCategory}
                    </Badge>
                    {m.examCode && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        [{m.examCode}]
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-4 text-xs">
                  {/* Question Stem */}
                  <div className="bg-muted/20 p-2.5 rounded-lg border border-border/30">
                    <p className="font-semibold text-muted-foreground text-[11px] mb-1 uppercase">
                      Problem / Question Stem:
                    </p>
                    <p className="text-foreground font-mono">{m.questionDetails}</p>
                  </div>

                  {/* Root Cause & Remedial Rule */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-rose-300/90">
                      <strong className="text-rose-400 font-semibold min-w-[75px]">Root Cause:</strong>
                      <span>{m.rootCause}</span>
                    </div>
                    <div className="flex items-start gap-2 text-emerald-300/90 bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/20">
                      <strong className="text-emerald-400 font-semibold min-w-[75px]">
                        Remedial Rule:
                      </strong>
                      <span>{m.remedialRule}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/30">
                    {!m.isResolved ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAddRetestToArena(m.id)}
                          className="w-full text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white h-8"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Launch Retest in Today&apos;s Arena
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolve(m.id)}
                          className="h-8 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Mark Resolved
                        </Button>
                      </>
                    ) : (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Resolved & verified in remedial retest
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Log New Mistake Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-2xl border-border">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Log Error to Mistake Lab
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 py-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground mb-1 block">Subject *</label>
                  <select
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                    <option value="English">English</option>
                    <option value="General Knowledge">General Knowledge</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground mb-1 block">Chapter Name *</label>
                  <Input
                    value={chapterName}
                    onChange={(e) => setChapterName(e.target.value)}
                    placeholder="e.g. Work, Power & Energy"
                    className="bg-muted/30 h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground mb-1 block">Fallacy Category *</label>
                  <select
                    value={fallacyCategory}
                    onChange={(e) => setFallacyCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {FALLACY_CATEGORIES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground mb-1 block">Exam Code (Optional)</label>
                  <Input
                    value={examCode}
                    onChange={(e) => setExamCode(e.target.value)}
                    placeholder="e.g. BUET-MOCK-03"
                    className="bg-muted/30 h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground mb-1 block">
                  Question Details / What Went Wrong *
                </label>
                <Textarea
                  value={questionDetails}
                  onChange={(e) => setQuestionDetails(e.target.value)}
                  placeholder="e.g. In calculating spring work W = 1/2 k x^2, forgot that x was displacement from equilibrium, not total compressed length."
                  className="bg-muted/30 font-mono text-xs"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-rose-400 mb-1 block">Root Cause Analysis *</label>
                <Input
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="e.g. Speed rush under time pressure; skipped drawing free-body diagram."
                  className="bg-muted/30 h-9 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-emerald-400 mb-1 block">
                  Remedial Golden Rule *
                </label>
                <Input
                  value={remedialRule}
                  onChange={(e) => setRemedialRule(e.target.value)}
                  placeholder="e.g. ALWAYS mark x=0 equilibrium position first before applying conservation of energy."
                  className="bg-muted/30 h-9 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-foreground mb-1 block">Retest Buffer</label>
                <select
                  value={retestDaysOffset}
                  onChange={(e) => setRetestDaysOffset(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value={1}>1 Day (Tomorrow)</option>
                  <option value={3}>3 Days (Recommended standard)</option>
                  <option value={7}>7 Days (Weekly re-test)</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-500 text-white">
                Log Error & Schedule Retest
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
