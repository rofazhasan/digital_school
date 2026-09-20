'use client';

import React, { useState } from 'react';
import { DayMode, ChallengeCategory } from '@prisma/client';
import { CATEGORY_METADATA } from '../../types/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateStudentCornerSettingsAction } from '../../actions/settings-actions';
import { toast } from 'sonner';
import { Settings, Shield, Globe, Clock, Volume2, Bell, Check, Archive, Trash2, AlertTriangle } from 'lucide-react';
import { ResetArenaModal } from '../arena/ResetArenaModal';

interface StudentCornerSettingsViewProps {
  initialSettings?: any;
  todayArenaId?: string;
}

export function StudentCornerSettingsView({ initialSettings, todayArenaId }: StudentCornerSettingsViewProps) {
  const [timezone, setTimezone] = useState(initialSettings?.timezone || 'Asia/Dhaka');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(initialSettings?.dailyGoalMinutes || 240);
  const [defaultDayMode, setDefaultDayMode] = useState<DayMode>(initialSettings?.defaultDayMode || 'NORMAL');
  const [soundEnabled, setSoundEnabled] = useState(initialSettings?.soundEnabled ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialSettings?.notificationsEnabled ?? true);
  const [preferredCategories, setPreferredCategories] = useState<ChallengeCategory[]>(
    initialSettings?.preferredCategories || ['STUDY', 'CODING', 'SALAT', 'QURAN', 'REVISION']
  );
  const [cleanupPolicy, setCleanupPolicy] = useState(
    initialSettings?.widgetConfig?.cleanupPolicy || 'KEEP_FOREVER'
  );
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleCategory = (cat: ChallengeCategory) => {
    if (preferredCategories.includes(cat)) {
      if (preferredCategories.length === 1) {
        toast.warning('Select at least one preferred category');
        return;
      }
      setPreferredCategories(preferredCategories.filter((c) => c !== cat));
    } else {
      setPreferredCategories([...preferredCategories, cat]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateStudentCornerSettingsAction({
        timezone,
        dailyGoalMinutes: Number(dailyGoalMinutes),
        defaultDayMode,
        soundEnabled,
        notificationsEnabled,
        preferredCategories,
        widgetConfig: {
          ...(typeof initialSettings?.widgetConfig === 'object' ? initialSettings.widgetConfig : {}),
          cleanupPolicy,
        },
      });

      if (res.success) {
        toast.success('Preferences saved successfully!');
      } else {
        toast.error(res.error || 'Failed to save settings');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Student Corner Preferences
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personalize your daily operating system, timezones, and discipline defaults.
        </p>

        <div className="mt-6 space-y-6">
          {/* Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" /> Timezone
              </Label>
              <Input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Asia/Dhaka"
                className="mt-1.5 rounded-xl border-slate-200 dark:border-slate-800 text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Daily midnight boundaries are evaluated in your local timezone.
              </p>
            </div>

            {/* Daily Goal */}
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Daily Focus Target (Minutes)
              </Label>
              <Input
                type="number"
                min={30}
                max={900}
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                className="mt-1.5 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {Math.round((dailyGoalMinutes / 60) * 10) / 10} hours target per day.
              </p>
            </div>
          </div>

          {/* Default Day Mode */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
              <Shield className="w-3.5 h-3.5 text-slate-400" /> Default Day Commitment Mode
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {(['NORMAL', 'STRICT', 'LOCKED'] as DayMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDefaultDayMode(mode)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    defaultDayMode === mode
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <p className="text-xs">{mode}</p>
                  <p className="text-[10px] font-normal opacity-80 mt-0.5">
                    {mode === 'NORMAL' ? 'Flexible' : mode === 'STRICT' ? 'Immutable details' : 'Complete lock'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Categories */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Preferred Challenge Categories
            </Label>
            <div className="flex flex-wrap gap-2">
              {Object.values(ChallengeCategory).map((cat) => {
                const isSelected = preferredCategories.includes(cat);
                const meta = CATEGORY_METADATA[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audio & Notifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded-md h-4 w-4 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Sound & Flow Audio</span>
                <span className="text-[11px] text-slate-400">Play subtle bell on session completion</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="rounded-md h-4 w-4 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Exam Reminders</span>
                <span className="text-[11px] text-slate-400">Notify 3 days before major deadlines</span>
              </div>
            </label>
          </div>

          {/* Arena Cleanup Policy (Item 9) */}
          <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-indigo-500" />
              <Label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Arena Auto-Cleanup Policy
              </Label>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Control when completed challenges automatically leave your active workspace. Historical progress, streaks, and heatmaps are always preserved.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { id: 'KEEP_FOREVER', label: 'Keep forever (Default)' },
                { id: 'REMOVE_7_DAYS', label: 'Remove completed after 7 days' },
                { id: 'REMOVE_30_DAYS', label: 'Remove completed after 30 days' },
                { id: 'REMOVE_90_DAYS', label: 'Remove completed after 90 days' },
              ].map((policy) => (
                <label
                  key={policy.id}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    cleanupPolicy === policy.id
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="cleanupPolicy"
                    value={policy.id}
                    checked={cleanupPolicy === policy.id}
                    onChange={(e) => setCleanupPolicy(e.target.value)}
                    className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <span>{policy.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-10 shadow-md shadow-indigo-500/20"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Arena (Item 11) */}
      {todayArenaId && (
        <div className="p-6 rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Danger Zone: Reset Arena</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                Completely clear today&apos;s active Arena workspace to restart planning from zero. Your historical completions, streaks, and heatmap data are 100% safe and retained.
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setResetModalOpen(true)}
              className="rounded-xl text-xs font-bold shrink-0 bg-rose-600 hover:bg-rose-700"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              <span>Reset Arena</span>
            </Button>
          </div>

          <ResetArenaModal
            open={resetModalOpen}
            onOpenChange={setResetModalOpen}
            arenaId={todayArenaId}
            onSuccess={() => {
              toast.success('✨ Fresh start ready.');
            }}
          />
        </div>
      )}
    </div>
  );
}
