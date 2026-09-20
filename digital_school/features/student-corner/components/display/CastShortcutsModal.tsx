'use client';

import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface CastShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CastShortcutsModal: React.FC<CastShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Pause / Resume focus countdown timer' },
    { key: 'Enter', desc: 'Mark active task completed / toggle' },
    { key: '← / →', desc: 'Navigate previous / next task in Arena' },
    { key: 'C', desc: 'Cycle presentation layout modes (A, B, C, D)' },
    { key: 'Q', desc: 'Cycle to next Quran Ayah reflection' },
    { key: 'F', desc: 'Toggle Fullscreen Mode' },
    { key: 'Esc', desc: 'Exit Cast Mode / Close overlays' },
    { key: '?', desc: 'Toggle this keyboard shortcuts dialog' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/20 text-white shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Cast Screen Shortcuts</h3>
              <p className="text-xs text-slate-400">Tactile big-screen keyboard controls</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/5"
            >
              <span className="text-xs sm:text-sm text-slate-300 font-medium">{s.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 font-mono text-xs font-bold text-indigo-300 shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-slate-400 font-medium">
          Screen Wake Lock is active to keep your display alive.
        </div>
      </div>
    </div>
  );
};
