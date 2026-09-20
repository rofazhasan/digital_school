'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  Circle,
  Star,
  Play,
  Clock,
  Search,
  BookOpen,
  Filter,
  Check,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  getSyllabusMatrixAction,
  updateTopicSyllabusAction,
  recordChapterRevisionAction,
  addChapterToTodayArenaAction,
} from '../../actions/syllabus-actions';
import { MASTERY_STATUSES } from '../../services/syllabus-service';
import { TopicHubModal } from './TopicHubModal';
import { toast } from 'sonner';

export function SyllabusMatrixView() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');
  const [selectedPaper, setSelectedPaper] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [hubTopicId, setHubTopicId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await getSyllabusMatrixAction({
      paper: selectedPaper,
      search,
    });
    if (res.success && res.matrix) {
      setSubjects(res.matrix);
      if (!activeSubjectId && res.matrix.length > 0) {
        setActiveSubjectId(res.matrix[0].id);
      }
    } else {
      toast.error(res.error || 'Failed to load syllabus matrix');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedPaper]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleToggleTheory = async (topicId: string, current: boolean) => {
    const res = await updateTopicSyllabusAction(topicId, { theoryCompleted: !current });
    if (res.success) {
      toast.success('Theory status updated');
      loadData();
    }
  };

  const handleToggleQB = async (topicId: string, current: boolean) => {
    const res = await updateTopicSyllabusAction(topicId, { qbSolved: !current });
    if (res.success) {
      toast.success('Question bank status updated');
      loadData();
    }
  };

  const handleSetConfidence = async (topicId: string, stars: number) => {
    const res = await updateTopicSyllabusAction(topicId, { confidenceLevel: stars });
    if (res.success) {
      toast.success(`Confidence updated to ${stars} stars`);
      loadData();
    }
  };

  const handleReview = async (topicId: string, perf: 'FAILED' | 'HARD' | 'GOOD' | 'EASY') => {
    const res = await recordChapterRevisionAction(topicId, perf);
    if (res.success) {
      toast.success(`Review logged! Leitner Box ${res.topic?.leitnerBox}`);
      loadData();
    }
  };

  const handleAddToTodayArena = async (topicId: string) => {
    const res = await addChapterToTodayArenaAction(topicId, 45);
    if (res.success) {
      toast.success('Chapter revision mission added to Today\'s Arena!');
    } else {
      toast.error(res.error || 'Failed to add to arena');
    }
  };

  const currentSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-background border border-blue-500/20 rounded-2xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Subject Syllabus Matrix
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Track chapter theory completion, question bank mastery, Leitner box, and live retention decay.
          </p>
        </div>

        {/* Global Overview Pill */}
        {currentSubject && (
          <div className="flex items-center gap-4 bg-muted/20 border border-border/50 rounded-xl px-4 py-2.5 text-xs">
            <div>
              <p className="text-muted-foreground">Theory Done</p>
              <p className="font-bold text-foreground text-sm">
                {currentSubject.theoryCompletedCount} / {currentSubject.totalChapters} ({currentSubject.theoryProgressPercent}%)
              </p>
            </div>
            <div className="h-8 w-[1px] bg-border/40" />
            <div>
              <p className="text-muted-foreground">QB Solved</p>
              <p className="font-bold text-foreground text-sm">
                {currentSubject.qbSolvedCount} / {currentSubject.totalChapters} ({currentSubject.qbProgressPercent}%)
              </p>
            </div>
            <div className="h-8 w-[1px] bg-border/40" />
            <div>
              <p className="text-muted-foreground">Mastered</p>
              <p className="font-bold text-emerald-400 text-sm">
                {currentSubject.masteredCount} Chapters
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Subject Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/40">
        {subjects.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setActiveSubjectId(sub.id)}
            className={`px-4 py-2 rounded-t-xl text-xs font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeSubjectId === sub.id
                ? 'border-indigo-500 text-foreground bg-indigo-500/10'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: sub.color || '#6366f1' }}
            />
            {sub.name}
            <Badge variant="outline" className="text-[10px] ml-1 border-border/50">
              {sub.totalChapters}
            </Badge>
          </button>
        ))}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={selectedPaper === 'ALL' ? 'default' : 'outline'}
            onClick={() => setSelectedPaper('ALL')}
            className="text-xs rounded-full h-8"
          >
            All Papers
          </Button>
          <Button
            size="sm"
            variant={selectedPaper === '১ম পত্র' ? 'default' : 'outline'}
            onClick={() => setSelectedPaper('১ম পত্র')}
            className="text-xs rounded-full h-8"
          >
            ১ম পত্র (1st Paper)
          </Button>
          <Button
            size="sm"
            variant={selectedPaper === '২য় পত্র' ? 'default' : 'outline'}
            onClick={() => setSelectedPaper('২য় পত্র')}
            className="text-xs rounded-full h-8"
          >
            ২য় পত্র (2nd Paper)
          </Button>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chapters..."
              className="pl-9 h-9 text-xs bg-muted/30"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-9 px-3">
            Search
          </Button>
        </form>
      </div>

      {/* Chapters Table */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Loading Syllabus Matrix...
        </div>
      ) : !currentSubject || currentSubject.topics.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl border-border/60 bg-muted/10">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-foreground">No chapters listed for this subject</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            Chapters will appear here when configured in Student Corner subjects or imported via Excel.
          </p>
        </div>
      ) : (
        <Card className="bg-card/40 border-border/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/30 border-b border-border/40 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5 pl-4">Chapter Name</th>
                  <th className="p-3.5 text-center">Paper</th>
                  <th className="p-3.5 text-center">Theory</th>
                  <th className="p-3.5 text-center">Question Bank</th>
                  <th className="p-3.5 text-center">Leitner Box</th>
                  <th className="p-3.5 text-center">Retention</th>
                  <th className="p-3.5 text-center">Confidence</th>
                  <th className="p-3.5 text-center">Mastery</th>
                  <th className="p-3.5 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {currentSubject.topics.map((t: any) => {
                  const retentionColor =
                    t.currentRetentionRate >= 80
                      ? 'text-emerald-400'
                      : t.currentRetentionRate >= 50
                      ? 'text-amber-400'
                      : 'text-rose-400';

                  const masteryObj =
                    MASTERY_STATUSES.find((m) => m.id === t.masteryStatus) || MASTERY_STATUSES[1];

                  return (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                      {/* Chapter Name */}
                      <td className="p-3.5 pl-4 font-medium text-foreground">
                        <button
                          type="button"
                          onClick={() => setHubTopicId(t.id)}
                          className="flex items-center gap-2 text-left hover:text-indigo-600 dark:hover:text-indigo-400 group cursor-pointer"
                          title="Click to open Topic Knowledge Hub"
                        >
                          {t.chapterNumber && (
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                              Ch {t.chapterNumber}
                            </span>
                          )}
                          <span className="group-hover:underline">{t.name}</span>
                          {t.isDue && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Revision Due Today" />
                          )}
                        </button>
                      </td>

                      {/* Paper */}
                      <td className="p-3.5 text-center text-muted-foreground">
                        {t.paper || '১ম পত্র'}
                      </td>

                      {/* Theory Done Toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleTheory(t.id, t.theoryCompleted)}
                          className={`p-1 rounded transition-all ${
                            t.theoryCompleted
                              ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                              : 'text-muted-foreground/40 hover:text-muted-foreground'
                          }`}
                          title="Toggle Theory Completion"
                        >
                          {t.theoryCompleted ? (
                            <CheckCircle2 className="w-5 h-5 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 mx-auto" />
                          )}
                        </button>
                      </td>

                      {/* QB Solved Toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleQB(t.id, t.qbSolved)}
                          className={`p-1 rounded transition-all ${
                            t.qbSolved
                              ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20'
                              : 'text-muted-foreground/40 hover:text-muted-foreground'
                          }`}
                          title="Toggle Question Bank Solved"
                        >
                          {t.qbSolved ? (
                            <CheckCircle2 className="w-5 h-5 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 mx-auto" />
                          )}
                        </button>
                      </td>

                      {/* Leitner Box */}
                      <td className="p-3.5 text-center font-semibold">
                        <Badge variant="outline" className="text-[10px] border-border">
                          Box {t.leitnerBox}
                        </Badge>
                      </td>

                      {/* Retention Rate */}
                      <td className="p-3.5 text-center">
                        <span className={`font-bold ${retentionColor}`}>
                          {t.currentRetentionRate}%
                        </span>
                      </td>

                      {/* Confidence Stars */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleSetConfidence(t.id, s)}
                              className="text-muted-foreground/30 hover:text-amber-400 transition-colors"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  s <= t.confidenceLevel
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground/30'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Mastery Status */}
                      <td className="p-3.5 text-center">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold"
                          style={{ color: masteryObj.color }}
                        >
                          {masteryObj.label}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleAddToTodayArena(t.id)}
                            className="h-7 text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white px-2.5"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Arena Mission
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(t.id, 'GOOD')}
                            className="h-7 text-[11px] text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 px-2"
                            title="Mark revised successfully (+1 Box)"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Revise
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {/* Topic Mini-Hub Modal */}
      <TopicHubModal
        topicId={hubTopicId}
        open={!!hubTopicId}
        onClose={() => setHubTopicId(null)}
      />
    </div>
  );
}
