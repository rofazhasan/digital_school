'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  AlertCircle,
  FileText,
  Building,
  Target,
  ShieldCheck,
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
  getAdmissionTargetsAction,
  upsertAdmissionTargetAction,
  deleteAdmissionTargetAction,
} from '../../actions/admission-actions';
import {
  UNIVERSITY_PRESETS,
  APPLICATION_STATUSES,
} from '../../services/admission-service';
import { toast } from 'sonner';

export function AdmissionTargetsView() {
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState<any[]>([]);

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState('');
  const [clusterName, setClusterName] = useState('');
  const [examFormat, setExamFormat] = useState('');
  const [historicalSafeCutoff, setHistoricalSafeCutoff] = useState('');
  const [targetRank, setTargetRank] = useState('');
  const [strategyNotes, setStrategyNotes] = useState('');
  const [applicationStatus, setApplicationStatus] = useState('NOT_STARTED');
  const [examDate, setExamDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    const res = await getAdmissionTargetsAction();
    if (res.success && res.targets) {
      setTargets(res.targets);
    } else {
      toast.error(res.error || 'Failed to load admission targets');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setUniversityName('');
    setClusterName('');
    setExamFormat('Written 400 Marks');
    setHistoricalSafeCutoff('260+ / 400');
    setTargetRank('Top 300');
    setStrategyNotes('');
    setApplicationStatus('NOT_STARTED');
    setExamDate('');
    setEditModalOpen(true);
  };

  const openEditModal = (target: any) => {
    setEditingId(target.id);
    setUniversityName(target.universityName);
    setClusterName(target.clusterName || '');
    setExamFormat(target.examFormat);
    setHistoricalSafeCutoff(target.historicalSafeCutoff);
    setTargetRank(target.targetRank || '');
    setStrategyNotes(target.strategyNotes || '');
    setApplicationStatus(target.applicationStatus || 'NOT_STARTED');
    setExamDate(target.examDate ? new Date(target.examDate).toISOString().split('T')[0] : '');
    setEditModalOpen(true);
  };

  const handleApplyPreset = (preset: any) => {
    setUniversityName(preset.universityName);
    setClusterName(preset.clusterName);
    setExamFormat(preset.examFormat);
    setHistoricalSafeCutoff(preset.historicalSafeCutoff);
    setTargetRank(preset.targetRank);
    setStrategyNotes(preset.strategyNotes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!universityName.trim() || !examFormat.trim() || !historicalSafeCutoff.trim()) {
      toast.error('Please provide University Name, Exam Format, and Safe Cutoff');
      return;
    }

    const res = await upsertAdmissionTargetAction({
      id: editingId || undefined,
      universityName,
      clusterName,
      examFormat,
      historicalSafeCutoff,
      targetRank,
      strategyNotes,
      applicationStatus,
      examDate: examDate ? new Date(examDate) : null,
    });

    if (res.success) {
      toast.success(editingId ? 'Target updated' : 'Target added');
      setEditModalOpen(false);
      loadData();
    } else {
      toast.error(res.error || 'Failed to save admission target');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admission target?')) return;
    const res = await deleteAdmissionTargetAction(id);
    if (res.success) {
      toast.success('Target removed');
      loadData();
    } else {
      toast.error(res.error || 'Failed to delete target');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-background border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Admission Targets & Strategy
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            University benchmarks, historical safe cutoffs, tactical traps, and application milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add University Target
          </Button>
        </div>
      </div>

      {/* Target Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Loading Admission Targets...
        </div>
      ) : targets.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl border-border/60 bg-muted/10">
          <Building className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-foreground">No admission targets set</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Select your dream universities (BUET, DU, Medical, CKRUET) and track your target rank and safe scores.
          </p>
          <Button onClick={openCreateModal} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Target
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targets.map((t) => {
            const statusObj =
              APPLICATION_STATUSES.find((s) => s.id === t.applicationStatus) || APPLICATION_STATUSES[0];

            return (
              <Card
                key={t.id}
                className="bg-card/40 border-border/40 hover:border-border/80 transition-all backdrop-blur-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">
                        {t.universityName}
                      </CardTitle>
                      {t.clusterName && (
                        <p className="text-xs text-muted-foreground mt-0.5">{t.clusterName}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold"
                        style={{ color: statusObj.color }}
                      >
                        {statusObj.label}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditModal(t)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(t.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3.5 pb-4 text-xs">
                  {/* Benchmarks Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-muted/20 p-3 rounded-xl border border-border/30">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold">
                        Exam Format
                      </p>
                      <p className="font-bold text-foreground mt-0.5">{t.examFormat}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold">
                        Historical Safe Cutoff
                      </p>
                      <p className="font-bold text-emerald-400 mt-0.5">
                        {t.historicalSafeCutoff}
                      </p>
                    </div>
                    {t.targetRank && (
                      <div className="pt-1.5">
                        <p className="text-[11px] text-muted-foreground uppercase font-semibold">
                          Target Rank
                        </p>
                        <p className="font-bold text-indigo-400 mt-0.5">{t.targetRank}</p>
                      </div>
                    )}
                    {t.examDate && (
                      <div className="pt-1.5">
                        <p className="text-[11px] text-muted-foreground uppercase font-semibold">
                          Exam Date
                        </p>
                        <p className="font-bold text-foreground mt-0.5">
                          {new Date(t.examDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Strategy Notes */}
                  {t.strategyNotes && (
                    <div className="bg-amber-950/20 p-3 rounded-xl border border-amber-500/20 text-amber-200/90 space-y-1">
                      <p className="font-semibold text-[11px] text-amber-400 uppercase flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Strategy & Traps to Avoid
                      </p>
                      <p className="text-xs leading-relaxed">{t.strategyNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit / Add Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-2xl border-border max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                {editingId ? 'Edit Admission Target' : 'Add University Target'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 py-3 text-xs">
              {/* Presets Bar (on create only) */}
              {!editingId && (
                <div>
                  <label className="font-semibold text-muted-foreground mb-1 block">
                    Quick Presets (Bangladeshi Top Universities):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {UNIVERSITY_PRESETS.map((p) => (
                      <Button
                        key={p.universityName}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleApplyPreset(p)}
                        className="text-[11px] h-7"
                      >
                        {p.universityName}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground mb-1 block">
                    University / Institution *
                  </label>
                  <Input
                    value={universityName}
                    onChange={(e) => setUniversityName(e.target.value)}
                    placeholder="e.g. BUET, DU, Medical"
                    className="bg-muted/30 h-9 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground mb-1 block">
                    Cluster / Department
                  </label>
                  <Input
                    value={clusterName}
                    onChange={(e) => setClusterName(e.target.value)}
                    placeholder="e.g. Faculty of Engineering"
                    className="bg-muted/30 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground mb-1 block">
                    Exam Format *
                  </label>
                  <Input
                    value={examFormat}
                    onChange={(e) => setExamFormat(e.target.value)}
                    placeholder="e.g. Written 400M"
                    className="bg-muted/30 h-9 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground mb-1 block">
                    Historical Safe Cutoff *
                  </label>
                  <Input
                    value={historicalSafeCutoff}
                    onChange={(e) => setHistoricalSafeCutoff(e.target.value)}
                    placeholder="e.g. 260+ / 400 (~65%)"
                    className="bg-muted/30 h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground mb-1 block">Target Rank</label>
                  <Input
                    value={targetRank}
                    onChange={(e) => setTargetRank(e.target.value)}
                    placeholder="e.g. Top 300"
                    className="bg-muted/30 h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground mb-1 block">
                    Application Milestone
                  </label>
                  <select
                    value={applicationStatus}
                    onChange={(e) => setApplicationStatus(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground mb-1 block">
                  Scheduled Exam Date
                </label>
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="bg-muted/30 h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground mb-1 block">
                  Key Strategy & Traps to Avoid
                </label>
                <Textarea
                  value={strategyNotes}
                  onChange={(e) => setStrategyNotes(e.target.value)}
                  placeholder="e.g. Speed in MCQ section, avoid complex algebraic shortcuts on written steps."
                  className="bg-muted/30 font-mono text-xs"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Save Target
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
