'use client';

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Plus,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Search,
  Filter,
  Flame,
  ChevronRight,
  BookOpen,
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
  getRevisionDashboardAction,
  createRevisionItemAction,
  recordReviewResultAction,
  addRevisionToTodayArenaAction,
} from '../../actions/revision-actions';
import {
  ACTIVE_RECALL_METHODS,
  VAULT_CATEGORIES,
  LEITNER_INTERVALS,
} from '../../services/revision-service';
import { toast } from 'sonner';

export function RevisionDashboard() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBox, setSelectedBox] = useState<number>(0);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [recallModalOpen, setRecallModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<any>(null);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newVaultCategory, setNewVaultCategory] = useState('HIGH_YIELD');
  const [newBox, setNewBox] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('FEYNMAN');
  const [selectedDuration, setSelectedDuration] = useState(30);

  const loadData = async () => {
    setLoading(true);
    const res = await getRevisionDashboardAction({
      vaultCategory: selectedCategory,
      leitnerBox: selectedBox,
      search,
    });
    if (res.success && res.items) {
      setItems(res.items);
      setStats(res.stats);
    } else {
      toast.error(res.error || 'Failed to load revision items');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedBox]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    const res = await createRevisionItemAction({
      title: newTitle,
      content: newContent,
      vaultCategory: newVaultCategory,
      leitnerBox: newBox,
    });
    if (res.success) {
      toast.success('Added to Spaced Repetition Vault');
      setCreateModalOpen(false);
      setNewTitle('');
      setNewContent('');
      loadData();
    } else {
      toast.error(res.error || 'Failed to create revision item');
    }
  };

  const handleRecordResult = async (itemId: string, performance: 'FAILED' | 'HARD' | 'GOOD' | 'EASY') => {
    const res = await recordReviewResultAction(itemId, performance);
    if (res.success) {
      toast.success(`Review recorded! Item moved to Box ${res.item?.leitnerBox}`);
      loadData();
    } else {
      toast.error(res.error || 'Failed to record review');
    }
  };

  const handleSendToArena = async () => {
    if (!activeItem) return;
    const res = await addRevisionToTodayArenaAction(activeItem.id, selectedMethod, selectedDuration);
    if (res.success) {
      toast.success('Active recall mission added to Today\'s Arena!');
      setRecallModalOpen(false);
      setActiveItem(null);
    } else {
      toast.error(res.error || 'Failed to send to arena');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-background border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Brain className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Spaced Repetition Engine
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Leitner 5-Box active recall system with Ebbinghaus memory decay stabilization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Revision Item
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/40">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Due Today
            </p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-extrabold text-amber-400">
                {stats?.dueTodayCount ?? 0}
              </h3>
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                Active Recall
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Ready for timed retrieval</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Avg Retention Rate
            </p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-extrabold text-emerald-400">
                {stats?.averageRetention ?? 100}%
              </h3>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                Ebbinghaus Decay
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Exponential stability score</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Mastered (Box 5)
            </p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-extrabold text-indigo-400">
                {stats?.masteredCount ?? 0}
              </h3>
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 text-xs">
                30-Day Cycle
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Long-term memory vault</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Total Vault Items
            </p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-extrabold text-foreground">
                {stats?.totalItems ?? 0}
              </h3>
              <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                All Decks
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Formulas, concepts & reactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Leitner 5-Box Stage Bar */}
      <Card className="bg-card/40 border-border/40 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Leitner 5-Box Distribution
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              Click any box to filter
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 md:gap-4">
            {[1, 2, 3, 4, 5].map((b) => {
              const count = stats?.boxCounts?.[b] || 0;
              const interval = LEITNER_INTERVALS[b];
              const isSelected = selectedBox === b;

              return (
                <button
                  key={b}
                  onClick={() => setSelectedBox(isSelected ? 0 : b)}
                  className={`p-3 md:p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                      : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span className="font-semibold text-foreground">Box {b}</span>
                    <span>+{interval}d</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{count}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 truncate">
                    {b === 1 && 'Daily recall'}
                    {b === 2 && '3-day cycle'}
                    {b === 3 && 'Weekly lock'}
                    {b === 4 && 'Bi-weekly'}
                    {b === 5 && 'Permanent'}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
          <Button
            size="sm"
            variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('ALL')}
            className="text-xs rounded-full h-8"
          >
            All Vaults
          </Button>
          {VAULT_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.id)}
              className="text-xs rounded-full h-8 whitespace-nowrap"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search concepts, formulas..."
              className="pl-9 h-9 text-xs bg-muted/30"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-9 px-3">
            Search
          </Button>
        </form>
      </div>

      {/* Vault Items List */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Loading Spaced Repetition items...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl border-border/60 bg-muted/10">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-foreground">No revision items found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Add high-yield formulas, reactions, or concepts to your Leitner 5-Box memory system.
          </p>
          <Button onClick={() => setCreateModalOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add First Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const isDue = item.isDue;
            const categoryObj = VAULT_CATEGORIES.find((v) => v.id === item.vaultCategory);

            return (
              <Card
                key={item.id}
                className={`relative border transition-all ${
                  isDue
                    ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-card/60 shadow-lg shadow-amber-500/5'
                    : 'border-border/40 bg-card/40 hover:border-border/80'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: categoryObj?.color || '#6366f1' }}
                    >
                      {categoryObj?.label || item.vaultCategory}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[11px] font-medium border-border">
                        Box {item.leitnerBox}
                      </Badge>
                      {isDue && (
                        <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] animate-pulse">
                          Due Today
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-base font-semibold text-foreground mt-2 leading-snug">
                    {item.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 pb-4">
                  {item.content && (
                    <p className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg font-mono line-clamp-3">
                      {item.content}
                    </p>
                  )}

                  {/* Retention and Next Review */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Retention: <strong className="text-emerald-400">{item.currentRetentionRate}%</strong>
                    </span>
                    <span>
                      Reviews: <strong className="text-foreground">{item.reviewCount}</strong>
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setActiveItem(item);
                        setRecallModalOpen(true);
                      }}
                      className="w-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white h-8"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Active Recall
                    </Button>
                  </div>

                  {/* Fast Leitner Rating */}
                  <div className="pt-1 flex items-center justify-between gap-1 text-[10px]">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRecordResult(item.id, 'FAILED')}
                      className="h-6 text-[10px] px-2 text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      Forgot (B1)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRecordResult(item.id, 'HARD')}
                      className="h-6 text-[10px] px-2 text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                    >
                      Hard
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRecordResult(item.id, 'GOOD')}
                      className="h-6 text-[10px] px-2 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                    >
                      Good (+1)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRecordResult(item.id, 'EASY')}
                      className="h-6 text-[10px] px-2 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
                    >
                      Easy (+2)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Active Recall Modal */}
      <Dialog open={recallModalOpen} onOpenChange={setRecallModalOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-indigo-400" />
              Launch Active Recall Protocol
            </DialogTitle>
          </DialogHeader>

          {activeItem && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Target</p>
                <h4 className="text-sm font-bold text-foreground mt-0.5">{activeItem.title}</h4>
                {activeItem.content && (
                  <p className="text-xs font-mono text-muted-foreground mt-2 line-clamp-2">
                    {activeItem.content}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Select Protocol:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {ACTIVE_RECALL_METHODS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        selectedMethod === method.id
                          ? 'border-indigo-500 bg-indigo-500/10 font-semibold text-foreground'
                          : 'border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      <div className="text-xs font-medium text-foreground">{method.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{method.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Recall Duration:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 45].map((d) => (
                    <Button
                      key={d}
                      type="button"
                      size="sm"
                      variant={selectedDuration === d ? 'default' : 'outline'}
                      onClick={() => setSelectedDuration(d)}
                      className="text-xs"
                    >
                      {d} Minutes
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecallModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendToArena} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              Add to Today's Arena
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Revision Item Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-2xl border-border">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5 text-indigo-400" />
                Add to Spaced Repetition Vault
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Concept / Formula Title *
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Carnot Engine Efficiency, Vector Cross Product"
                  className="bg-muted/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Vault Category
                  </label>
                  <select
                    value={newVaultCategory}
                    onChange={(e) => setNewVaultCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {VAULT_CATEGORIES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Starting Leitner Box
                  </label>
                  <select
                    value={newBox}
                    onChange={(e) => setNewBox(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-md border border-input bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {[1, 2, 3, 4, 5].map((b) => (
                      <option key={b} value={b}>
                        Box {b} (+{LEITNER_INTERVALS[b]} days)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Formula, Equation, or Key Derivation Steps
                </label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="e.g. η = 1 - (Tc / Th) = 1 - (Qc / Qh); remember temperatures must be in Kelvin!"
                  className="bg-muted/30 font-mono text-xs"
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                Save to Vault
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
