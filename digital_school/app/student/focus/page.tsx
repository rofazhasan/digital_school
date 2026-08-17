"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, Sparkles, Coffee, Brain,
  Volume2, VolumeX, ArrowLeft, Flame, Target,
  CheckCircle2, Music, Zap, Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { triggerHaptic, ImpactStyle } from "@/lib/haptics";

const PRESETS = [
  { id: "focus-25", label: "25m Deep Focus", minutes: 25, icon: Sparkles, color: "from-indigo-600 to-blue-600" },
  { id: "focus-50", label: "50m Exam Cram", minutes: 50, icon: Zap, color: "from-purple-600 to-indigo-600" },
  { id: "break-5", label: "5m Quick Break", minutes: 5, icon: Coffee, color: "from-emerald-600 to-teal-600" },
  { id: "break-15", label: "15m Reset Break", minutes: 15, icon: Brain, color: "from-amber-600 to-orange-600" },
];

const SOUNDS = [
  { id: "none", label: "Silent Flow", icon: VolumeX },
  { id: "rain", label: "Gentle Rain", icon: Volume2 },
  { id: "lofi", label: "Lo-Fi Beats", icon: Music },
  { id: "cafe", label: "Library Cafe", icon: Volume2 },
];

export default function StudentFocusPage() {
  const router = useRouter();

  const [activePreset, setActivePreset] = useState(PRESETS[0]);
  const [timeLeft, setTimeLeft] = useState(activePreset.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [soundMode, setSoundMode] = useState("none");
  const [completedSessions, setCompletedSessions] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("focus_sessions_today") || "3", 10);
    }
    return 3;
  });

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      triggerHaptic(ImpactStyle.Heavy);
      setCompletedSessions((prev) => {
        const next = prev + 1;
        if (typeof window !== "undefined") {
          localStorage.setItem("focus_sessions_today", next.toString());
        }
        return next;
      });
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    triggerHaptic(ImpactStyle.Medium);
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    triggerHaptic(ImpactStyle.Light);
    setIsActive(false);
    setTimeLeft(activePreset.minutes * 60);
  };

  const selectPreset = (preset: typeof PRESETS[0]) => {
    triggerHaptic(ImpactStyle.Light);
    setActivePreset(preset);
    setIsActive(false);
    setTimeLeft(preset.minutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalSeconds = activePreset.minutes * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { triggerHaptic(ImpactStyle.Light); router.push('/student/dashboard'); }}
          className="rounded-full font-bold text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-sm gap-1.5 px-4 h-9 backdrop-blur-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Student Dashboard
        </Button>

        <div className="flex items-center gap-2">
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-bold py-1 px-3 rounded-full">
            <Flame className="h-3.5 w-3.5 mr-1 fill-amber-400 text-amber-400" />
            {completedSessions} Sessions Completed Today
          </Badge>
        </div>
      </header>

      {/* Main Focus Center */}
      <main className="max-w-xl w-full mx-auto my-auto text-center space-y-8">
        {/* Preset Selector */}
        <div className="flex flex-wrap justify-center gap-2 bg-slate-900/80 p-1.5 rounded-full border border-slate-800 backdrop-blur-xl">
          {PRESETS.map((p) => {
            const Icon = p.icon;
            const isSelected = activePreset.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => selectPreset(p)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-white text-slate-900 shadow-md scale-105"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Circular Radial Timer Visualizer */}
        <div className="relative w-72 h-72 sm:w-84 sm:h-84 mx-auto flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-slate-800"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Progress Stroke */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-indigo-500 transition-all duration-1000 ease-linear"
              strokeWidth="6"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progress) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Digital Display */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-lg">
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs uppercase tracking-widest text-indigo-400 font-black mt-2">
              {isActive ? "Deep Study Flow" : "Paused"}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={toggleTimer}
            className={`rounded-full font-black text-sm px-8 h-14 shadow-xl active:scale-95 transition-all ${
              isActive
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25"
            }`}
          >
            {isActive ? (
              <>
                <Pause className="h-5 w-5 mr-2 fill-current" />
                Pause Focus
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2 fill-current" />
                Start Focus Session
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            className="rounded-full h-14 w-14 bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
            title="Reset Timer"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        {/* Ambient Soundscapes Selector */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Background Soundscape
          </span>
          <div className="flex justify-center gap-2">
            {SOUNDS.map((s) => (
              <button
                key={s.id}
                onClick={() => { triggerHaptic(ImpactStyle.Light); setSoundMode(s.id); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  soundMode === s.id
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Quote */}
      <footer className="text-center text-xs text-slate-500 font-medium">
        &ldquo;Discipline is choosing between what you want now and what you want most.&rdquo;
      </footer>
    </div>
  );
}
