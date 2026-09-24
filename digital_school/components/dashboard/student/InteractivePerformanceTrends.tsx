"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  TrendingUp,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  Calendar,
  Layers,
  X,
  ExternalLink,
  Filter,
  BarChart3,
  HelpCircle,
  Flame,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { triggerHaptic, ImpactStyle } from "@/lib/haptics";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register base ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface ExamTrendPoint {
  id?: string;
  examId?: string;
  label?: string;
  examTitle?: string;
  title?: string;
  subject?: string;
  score?: number;
  totalMarks?: number;
  total?: number;
  percentage?: number;
  pct?: number;
  classAvg?: number;
  classAverage?: number;
  grade?: string;
  rank?: number;
  date?: string | Date;
  source?: "ONLINE" | "PHYSICAL_OMR" | "OMR" | string;
  type?: string;
  setName?: string;
  comment?: string;
}

export interface InteractivePerformanceTrendsProps {
  results?: ExamTrendPoint[];
  analyticsTrends?: any[];
  availableSubjects?: string[];
  title?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
  onSelectExam?: (exam: any) => void;
  showSubjectFilter?: boolean;
  showPastTrendsDrawer?: boolean;
  theme?: "dashboard" | "dark" | "glass";
}

interface NormalizedTrendItem {
  id: string;
  examId?: string;
  title: string;
  shortLabel: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  classAvg: number;
  grade: string;
  rank?: number;
  date: string;
  formattedDate: string;
  source: string;
  deltaFromPrev: number | null;
  status: "peak" | "improved" | "declined" | "steady";
}

// Subject badge color helper
function getSubjectColor(subject: string) {
  const s = (subject || "").toLowerCase();
  if (s.includes("math")) return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  if (s.includes("phys")) return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
  if (s.includes("chem")) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  if (s.includes("bio")) return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20";
  if (s.includes("eng") || s.includes("bangla")) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
}

export function InteractivePerformanceTrends({
  results = [],
  analyticsTrends = [],
  availableSubjects = [],
  title = "Performance Trends",
  subtitle = "Track score trajectory & past milestones with interactive zoom",
  className = "",
  compact = false,
  onSelectExam,
  showSubjectFilter = true,
  showPastTrendsDrawer = true,
  theme = "dashboard"
}: InteractivePerformanceTrendsProps) {
  const chartRef = useRef<any>(null);

  // Filter State
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [showPastTrends, setShowPastTrends] = useState<boolean>(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Zoom & Viewport Window State
  // Default window size: 8 exams on desktop, 6 on compact
  const initialWindowSize = compact ? 6 : 8;
  const [windowSize, setWindowSize] = useState<number>(initialWindowSize);
  const [windowOffset, setWindowOffset] = useState<number>(0); // 0 means anchored to latest exams

  // Register zoom plugin on client safely without breaking SSR
  useEffect(() => {
    let mounted = true;
    if (typeof window !== "undefined") {
      import("chartjs-plugin-zoom")
        .then((zoomPlugin) => {
          if (mounted && zoomPlugin?.default) {
            try {
              ChartJS.register(zoomPlugin.default);
            } catch {
              // Plugin may already be registered
            }
          }
        })
        .catch(() => {
          // Graceful fallback: windowed zoom controls are already active
        });
    }
    return () => {
      mounted = false;
    };
  }, []);

  // 1. Normalize and Sort Exam Records Chronologically (Oldest -> Latest)
  const allChronologicalItems = useMemo<NormalizedTrendItem[]>(() => {
    let raw: ExamTrendPoint[] = [];

    if (results && results.length > 0) {
      raw = [...results];
    } else if (analyticsTrends && analyticsTrends.length > 0) {
      raw = analyticsTrends.map((t: any) => ({
        id: t.id || t.examId,
        examId: t.examId,
        title: t.label || t.examTitle || "Exam",
        examTitle: t.label || t.examTitle || "Exam",
        subject: t.subject || "General",
        percentage: Number(t.score) || 0,
        score: Number(t.score) || 0,
        totalMarks: 100,
        classAvg: Number(t.classAverage) || 70,
        date: t.date || new Date().toISOString()
      }));
    }

    // Default demo milestone records if student is new
    if (raw.length === 0) {
      raw = [
        {
          id: "demo-1",
          title: "Diagnostic Assessment",
          subject: "General",
          percentage: 76,
          score: 76,
          totalMarks: 100,
          classAvg: 68,
          grade: "A",
          source: "PHYSICAL_OMR",
          date: new Date(Date.now() - 30 * 86400000).toISOString()
        },
        {
          id: "demo-2",
          title: "Physics Mechanics Milestone",
          subject: "Physics",
          percentage: 82,
          score: 82,
          totalMarks: 100,
          classAvg: 70,
          grade: "A+",
          source: "ONLINE",
          date: new Date(Date.now() - 21 * 86400000).toISOString()
        },
        {
          id: "demo-3",
          title: "Mathematics Calculus Check",
          subject: "Mathematics",
          percentage: 79,
          score: 79,
          totalMarks: 100,
          classAvg: 71,
          grade: "A",
          source: "PHYSICAL_OMR",
          date: new Date(Date.now() - 14 * 86400000).toISOString()
        },
        {
          id: "demo-4",
          title: "Mid-Term Unified Evaluation",
          subject: "General",
          percentage: 88,
          score: 88,
          totalMarks: 100,
          classAvg: 73,
          grade: "A+",
          source: "PHYSICAL_OMR",
          date: new Date(Date.now() - 7 * 86400000).toISOString()
        },
        {
          id: "demo-5",
          title: "Chemistry Redox Quiz",
          subject: "Chemistry",
          percentage: 91,
          score: 91,
          totalMarks: 100,
          classAvg: 74,
          grade: "A+",
          source: "ONLINE",
          date: new Date(Date.now() - 3 * 86400000).toISOString()
        },
        {
          id: "demo-6",
          title: "Current Benchmark Standing",
          subject: "General",
          percentage: 94,
          score: 94,
          totalMarks: 100,
          classAvg: 75,
          grade: "A+",
          source: "PHYSICAL_OMR",
          date: new Date().toISOString()
        }
      ];
    }

    // Sort ascending by date
    const sorted = [...raw].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeA - timeB;
    });

    let peakSoFar = 0;

    return sorted.map((r, idx) => {
      const title = r.examTitle || r.title || r.label || r.subject || `Milestone ${idx + 1}`;
      const totalMarks = Number(r.totalMarks) || (r.total ? Number(r.total) : 100);
      let percentage = Number(r.percentage ?? r.pct);
      if (isNaN(percentage) || percentage === undefined) {
        percentage = totalMarks > 0 && r.score !== undefined ? Math.round((Number(r.score) / totalMarks) * 100) : 75;
      }
      const score = r.score !== undefined ? Number(r.score) : percentage;
      const classAvg = Number(r.classAvg ?? r.classAverage ?? 70);

      const d = r.date ? new Date(r.date) : new Date();
      const formattedDate = !isNaN(d.getTime())
        ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Recent";

      // Grade calculation
      let grade = r.grade || "";
      if (!grade) {
        if (percentage >= 80) grade = "A+";
        else if (percentage >= 70) grade = "A";
        else if (percentage >= 60) grade = "A-";
        else if (percentage >= 50) grade = "B";
        else if (percentage >= 40) grade = "C";
        else grade = "F";
      }

      // Delta from previous exam
      let deltaFromPrev: number | null = null;
      let status: "peak" | "improved" | "declined" | "steady" = "steady";

      if (idx > 0) {
        const prevPct = sorted[idx - 1].percentage ?? (Number(sorted[idx - 1].score) || 70);
        deltaFromPrev = percentage - prevPct;
        if (deltaFromPrev > 0) status = "improved";
        else if (deltaFromPrev < 0) status = "declined";
      }

      if (percentage > peakSoFar && idx > 0) {
        peakSoFar = percentage;
        status = "peak";
      } else if (percentage > peakSoFar) {
        peakSoFar = percentage;
      }

      const shortLabel = title.length > 14 ? title.substring(0, 12) + "…" : title;

      return {
        id: r.id || r.examId || `exam-${idx}-${d.getTime()}`,
        examId: r.examId,
        title,
        shortLabel,
        subject: r.subject || "General",
        score,
        totalMarks,
        percentage,
        classAvg,
        grade,
        rank: r.rank,
        date: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
        formattedDate,
        source: r.source || r.type || "PHYSICAL_OMR",
        deltaFromPrev,
        status
      };
    });
  }, [results, analyticsTrends]);

  // 2. Filter by Subject
  const filteredItems = useMemo(() => {
    if (selectedSubject === "all") return allChronologicalItems;
    return allChronologicalItems.filter(
      (item) => item.subject.toLowerCase() === selectedSubject.toLowerCase()
    );
  }, [allChronologicalItems, selectedSubject]);

  // Derived unique subjects with counts
  const subjectListWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    allChronologicalItems.forEach((item) => {
      const s = item.subject || "General";
      map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [allChronologicalItems]);

  // 3. Viewport Windowing & Zoom Calculation (High-Performance Zero-Lag)
  const totalFilteredCount = filteredItems.length;

  // Ensure windowSize is within bounds [3, totalFilteredCount]
  const effectiveWindowSize = Math.max(3, Math.min(windowSize, totalFilteredCount));

  // Offset represents how many items back from the end:
  // offset = 0 -> latest `effectiveWindowSize` items
  // offset > 0 -> shifted back in time by `offset` items
  const maxOffset = Math.max(0, totalFilteredCount - effectiveWindowSize);
  const effectiveOffset = Math.min(windowOffset, maxOffset);

  const startIndex = Math.max(0, totalFilteredCount - effectiveWindowSize - effectiveOffset);
  const endIndex = Math.min(totalFilteredCount, startIndex + effectiveWindowSize);

  // Active items displayed on canvas
  const visibleItems = useMemo(() => {
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, startIndex, endIndex]);

  // Summary Metrics calculated on visible window
  const visibleStats = useMemo(() => {
    if (visibleItems.length === 0) {
      return { avg: 0, peak: 0, lowest: 0, delta: 0, firstScore: 0, lastScore: 0 };
    }
    const scores = visibleItems.map((v) => v.percentage);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const peak = Math.max(...scores);
    const lowest = Math.min(...scores);
    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];
    const delta = lastScore - firstScore;

    return { avg, peak, lowest, delta, firstScore, lastScore };
  }, [visibleItems]);

  // Find currently selected exam item (if any)
  const selectedExam = useMemo<NormalizedTrendItem | null>(() => {
    if (!selectedExamId) return null;
    return allChronologicalItems.find((item) => item.id === selectedExamId) || null;
  }, [selectedExamId, allChronologicalItems]);

  // Zoom In Handler (+)
  const handleZoomIn = useCallback(() => {
    triggerHaptic(ImpactStyle.Light);
    setWindowSize((prev) => Math.max(4, prev - 3));
  }, []);

  // Zoom Out Handler (-)
  const handleZoomOut = useCallback(() => {
    triggerHaptic(ImpactStyle.Light);
    setWindowSize((prev) => Math.min(totalFilteredCount, prev + 3));
  }, [totalFilteredCount]);

  // Reset Zoom Handler
  const handleResetZoom = useCallback(() => {
    triggerHaptic(ImpactStyle.Light);
    setWindowSize(initialWindowSize);
    setWindowOffset(0);
  }, [initialWindowSize]);

  // Pan Earlier in Time (Shift window left / back)
  const handlePanEarlier = useCallback(() => {
    triggerHaptic(ImpactStyle.Light);
    setWindowOffset((prev) => Math.min(maxOffset, prev + Math.max(1, Math.floor(effectiveWindowSize / 2))));
  }, [maxOffset, effectiveWindowSize]);

  // Pan Recent / Forward in Time (Shift window right / forward)
  const handlePanRecent = useCallback(() => {
    triggerHaptic(ImpactStyle.Light);
    setWindowOffset((prev) => Math.max(0, prev - Math.max(1, Math.floor(effectiveWindowSize / 2))));
  }, [effectiveWindowSize]);

  // Jump to Earliest History
  const handleJumpEarliest = useCallback(() => {
    triggerHaptic(ImpactStyle.Light);
    setWindowOffset(maxOffset);
  }, [maxOffset]);

  // Jump to Latest History
  const handleJumpLatest = useCallback(() => {
    triggerHaptic(ImpactStyle.Light);
    setWindowOffset(0);
  }, []);

  // Quick Preset Selection (5, 10, 20, All)
  const handleSelectPreset = useCallback((preset: "5" | "10" | "20" | "all") => {
    triggerHaptic(ImpactStyle.Light);
    if (preset === "all") {
      setWindowSize(totalFilteredCount);
      setWindowOffset(0);
    } else {
      const num = parseInt(preset, 10);
      setWindowSize(num);
      setWindowOffset(0);
    }
  }, [totalFilteredCount]);

  // When clicking an exam node or past trend card
  const handleExamClick = useCallback(
    (item: NormalizedTrendItem) => {
      triggerHaptic(ImpactStyle.Medium);
      setSelectedExamId(item.id);

      // If the clicked exam is outside current visible window, center the window around it
      const targetIdx = filteredItems.findIndex((it) => it.id === item.id);
      if (targetIdx !== -1) {
        if (targetIdx < startIndex || targetIdx >= endIndex) {
          // Adjust offset so target is in view
          const newOffset = Math.max(0, Math.min(maxOffset, totalFilteredCount - targetIdx - Math.floor(effectiveWindowSize / 2)));
          setWindowOffset(newOffset);
        }
      }

      if (onSelectExam) {
        onSelectExam(item);
      }
    },
    [filteredItems, startIndex, endIndex, maxOffset, totalFilteredCount, effectiveWindowSize, onSelectExam]
  );

  // 4. Chart.js Config: Responsive, GPU-accelerated, Zero Lag
  const chartData = useMemo(() => {
    const labels = visibleItems.map((item) => item.shortLabel);
    const scores = visibleItems.map((item) => item.percentage);
    const classAvgs = visibleItems.map((item) => item.classAvg);

    // Custom point styling to highlight the selected exam
    const pointRadii = visibleItems.map((item) => (item.id === selectedExamId ? 9 : 5));
    const pointHoverRadii = visibleItems.map((item) => (item.id === selectedExamId ? 11 : 7));
    const pointBgColors = visibleItems.map((item) =>
      item.id === selectedExamId ? "#f59e0b" : "#6366f1"
    );
    const pointBorderColors = visibleItems.map((item) =>
      item.id === selectedExamId ? "#ffffff" : "#ffffff"
    );
    const pointBorderWidths = visibleItems.map((item) => (item.id === selectedExamId ? 3 : 2));

    return {
      labels,
      datasets: [
        {
          label: "Your Score (%)",
          data: scores,
          borderColor: "#6366f1",
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return "rgba(99, 102, 241, 0.15)";
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, "rgba(99, 102, 241, 0.35)");
            gradient.addColorStop(0.5, "rgba(139, 92, 246, 0.12)");
            gradient.addColorStop(1, "rgba(99, 102, 241, 0.0)");
            return gradient;
          },
          fill: true,
          tension: 0.38,
          pointRadius: pointRadii,
          pointHoverRadius: pointHoverRadii,
          pointBackgroundColor: pointBgColors,
          pointBorderColor: pointBorderColors,
          pointBorderWidth: pointBorderWidths,
          borderWidth: 3
        },
        {
          label: "Class Avg (%)",
          data: classAvgs,
          borderColor: "rgba(148, 163, 184, 0.65)",
          borderDash: [5, 5],
          fill: false,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 0,
          borderWidth: 2
        }
      ]
    };
  }, [visibleItems, selectedExamId]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 300,
        easing: "easeOutQuart" as const
      },
      interaction: {
        mode: "nearest" as const,
        axis: "x" as const,
        intersect: false
      },
      onClick: (event: any, elements: any[]) => {
        if (elements && elements.length > 0) {
          const index = elements[0].index;
          const clickedItem = visibleItems[index];
          if (clickedItem) {
            handleExamClick(clickedItem);
          }
        }
      },
      plugins: {
        legend: {
          position: "top" as const,
          align: "end" as const,
          labels: {
            usePointStyle: true,
            boxWidth: 7,
            padding: 14,
            font: { size: 10, weight: 600 }
          }
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderColor: "rgba(99, 102, 241, 0.4)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 14,
          titleFont: { size: 12, weight: "bold" as const },
          bodyFont: { size: 11 },
          displayColors: true,
          callbacks: {
            title: (items: any[]) => {
              if (items.length > 0) {
                const item = visibleItems[items[0].dataIndex];
                return item ? item.title : items[0].label;
              }
              return "";
            },
            label: (context: any) => {
              const datasetLabel = context.dataset.label || "";
              const value = context.parsed.y;
              return ` ${datasetLabel}: ${value}%`;
            },
            afterBody: (items: any[]) => {
              if (items.length > 0) {
                const item = visibleItems[items[0].dataIndex];
                if (item) {
                  const lines = [
                    `Subject: ${item.subject}`,
                    `Date: ${item.formattedDate}`,
                    `Grade: ${item.grade}${item.rank ? ` • Rank #${item.rank}` : ""}`
                  ];
                  if (item.deltaFromPrev !== null) {
                    lines.push(
                      `Change: ${item.deltaFromPrev >= 0 ? `+${item.deltaFromPrev}% ↗` : `${item.deltaFromPrev}% ↘`}`
                    );
                  }
                  lines.push("👉 Click node to inspect details");
                  return lines;
                }
              }
              return [];
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          grid: {
            color: "rgba(156, 163, 175, 0.12)"
          },
          ticks: {
            font: { size: 9 },
            callback: (val: any) => `${val}%`
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 9 },
            maxRotation: 25,
            minRotation: 0
          }
        }
      }
    };
  }, [visibleItems, handleExamClick]);

  return (
    <Card
      className={`rounded-2xl sm:rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5 transition-all relative overflow-hidden ${className}`}
    >
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="h-4 w-4" />
            </span>
            <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight flex items-center gap-2">
              {title}
              <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20 text-[10px] font-bold">
                {totalFilteredCount} {totalFilteredCount === 1 ? "Exam" : "Exams"}
              </Badge>
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Action Controls: Zoom, Presets, Subject Filter, Past Trends Drawer */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom Buttons (+ / - / Reset) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={handleZoomIn}
              disabled={effectiveWindowSize <= 4}
              title="Zoom In (Focus on fewer exams)"
              className="p-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-slate-700 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              disabled={effectiveWindowSize >= totalFilteredCount}
              title="Zoom Out (See more exam history)"
              className="p-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-slate-700 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom View"
              className="p-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-slate-700 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Preset Buttons (5, 10, All) */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(["5", "10", "all"] as const).map((preset) => {
              const isActive =
                (preset === "all" && effectiveWindowSize >= totalFilteredCount) ||
                (preset === "5" && effectiveWindowSize === 5) ||
                (preset === "10" && effectiveWindowSize === 10);

              return (
                <button
                  key={preset}
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {preset === "all" ? "All" : `Last ${preset}`}
                </button>
              );
            })}
          </div>

          {/* Subject Filter */}
          {showSubjectFilter && subjectListWithCounts.length > 1 && (
            <select
              value={selectedSubject}
              onChange={(e) => {
                triggerHaptic(ImpactStyle.Light);
                setSelectedSubject(e.target.value);
                setWindowOffset(0);
              }}
              className="text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border-0 px-2.5 py-1.5 text-foreground max-w-[130px] sm:max-w-none truncate"
            >
              <option value="all">All Subjects ({allChronologicalItems.length})</option>
              {subjectListWithCounts.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.count})
                </option>
              ))}
            </select>
          )}

          {/* Toggle Past Trends History Drawer */}
          {showPastTrendsDrawer && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                triggerHaptic(ImpactStyle.Light);
                setShowPastTrends(!showPastTrends);
              }}
              className={`rounded-xl text-xs font-bold px-2.5 py-1 h-8 gap-1.5 transition-all ${
                showPastTrends
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600"
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-0"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Past Trends</span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60">
        <div>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Average Score
          </span>
          <div className="text-base sm:text-lg font-black text-foreground">
            {visibleStats.avg}%
          </div>
        </div>

        <div>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground block flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Peak Score
          </span>
          <div className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
            {visibleStats.peak}%
          </div>
        </div>

        <div>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Lowest Score
          </span>
          <div className="text-base sm:text-lg font-black text-slate-600 dark:text-slate-400">
            {visibleStats.lowest}%
          </div>
        </div>

        <div>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Window Trajectory
          </span>
          <div
            className={`text-base sm:text-lg font-black flex items-center gap-1 ${
              visibleStats.delta >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {visibleStats.delta >= 0 ? (
              <ArrowUpRight className="w-4 h-4 inline" />
            ) : (
              <ArrowDownRight className="w-4 h-4 inline" />
            )}
            {visibleStats.delta >= 0 ? `+${visibleStats.delta}%` : `${visibleStats.delta}%`}
          </div>
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="relative">
        <div className="h-[230px] sm:h-[270px] w-full">
          {visibleItems.length > 0 ? (
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground">
              <TrendingUp className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-1" />
              No examination records found for selected criteria.
            </div>
          )}
        </div>

        {/* Zoom Hint Overlay for Mobile */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1 px-1">
          <span>
            Showing exams {startIndex + 1}–{endIndex} of {totalFilteredCount}
          </span>
          <span className="italic flex items-center gap-1">
            <Info className="w-3 h-3 text-indigo-400" />
            Tap any point to inspect past exam details
          </span>
        </div>
      </div>

      {/* Timeline Panning Scrubber (When Zoomed In) */}
      {totalFilteredCount > effectiveWindowSize && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePanEarlier}
            disabled={startIndex <= 0}
            className="h-7 px-2 text-[11px] font-bold text-muted-foreground hover:text-foreground gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Earlier ({startIndex})</span>
          </Button>

          {/* Quick Jump Center Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleJumpEarliest}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                startIndex === 0
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
              }`}
            >
              Earliest
            </button>
            <span className="text-[10px] text-slate-400 font-mono">
              Window {startIndex + 1}-{endIndex}
            </span>
            <button
              onClick={handleJumpLatest}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                endIndex === totalFilteredCount
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
              }`}
            >
              Latest
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePanRecent}
            disabled={endIndex >= totalFilteredCount}
            className="h-7 px-2 text-[11px] font-bold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Recent ({totalFilteredCount - endIndex})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Interactive Exam Inspector Card (Shown when an Exam Node is Clicked) */}
      <AnimatePresence>
        {selectedExam && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-purple-950/20 border border-indigo-500/30 shadow-lg relative overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedExamId(null)}
              className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${getSubjectColor(selectedExam.subject)} font-bold text-[10px]`}>
                    {selectedExam.subject}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                    {selectedExam.source === "PHYSICAL_OMR" ? "Physical OMR" : "Online CBT"}
                  </Badge>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {selectedExam.formattedDate}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-white leading-tight">
                  {selectedExam.title}
                </h4>
              </div>

              {/* Score Badges */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black text-indigo-400">
                    {selectedExam.percentage}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {selectedExam.score} / {selectedExam.totalMarks} Marks
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-black text-sm px-2.5 py-0.5">
                    {selectedExam.grade}
                  </Badge>
                  {selectedExam.rank && (
                    <span className="text-[9px] font-bold text-amber-400 mt-1">
                      Rank #{selectedExam.rank}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">vs Class Average</span>
                <span
                  className={`font-black text-sm ${
                    selectedExam.percentage >= selectedExam.classAvg
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  {selectedExam.percentage >= selectedExam.classAvg
                    ? `+${selectedExam.percentage - selectedExam.classAvg}% above avg`
                    : `${selectedExam.percentage - selectedExam.classAvg}% below avg`}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Progress Trajectory</span>
                <span
                  className={`font-black text-sm flex items-center gap-1 ${
                    selectedExam.deltaFromPrev === null
                      ? "text-slate-400"
                      : selectedExam.deltaFromPrev >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {selectedExam.deltaFromPrev === null
                    ? "Baseline Exam"
                    : selectedExam.deltaFromPrev >= 0
                    ? `+${selectedExam.deltaFromPrev}% Improvement ↗`
                    : `${selectedExam.deltaFromPrev}% Dip ↘`}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Status</span>
                  <span className="font-black text-sm text-indigo-300 capitalize">
                    {selectedExam.status === "peak"
                      ? "Peak Milestone ⭐"
                      : selectedExam.percentage >= 80
                      ? "Strong Mastery"
                      : "Needs Practice"}
                  </span>
                </div>
                {onSelectExam && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSelectExam(selectedExam)}
                    className="h-7 px-2 text-indigo-400 hover:text-white hover:bg-indigo-600/30 text-xs font-bold gap-1"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expandable Past Trends History Drawer / Cards List */}
      <AnimatePresence>
        {showPastTrends && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2.5 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Past Examination Milestones ({filteredItems.length})
              </span>
              <span className="text-[10px] text-muted-foreground">
                Click any milestone to inspect on chart
              </span>
            </div>

            {/* Horizontal Scrollable Cards Tray */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {filteredItems.map((item, idx) => {
                const isSelected = item.id === selectedExamId;
                const isPeak = item.status === "peak";

                return (
                  <button
                    key={item.id}
                    onClick={() => handleExamClick(item)}
                    className={`shrink-0 w-44 sm:w-48 p-2.5 rounded-2xl text-left border transition-all relative ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                        : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {isPeak && (
                      <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[8px] uppercase tracking-wide">
                        Peak
                      </span>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span className="truncate max-w-[90px]">{item.formattedDate}</span>
                      <span className="font-bold text-foreground">{item.subject}</span>
                    </div>

                    <h5 className="font-bold text-xs text-foreground line-clamp-1 mb-2">
                      {item.title}
                    </h5>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {item.percentage}%
                      </span>
                      <Badge className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-foreground border-0">
                        {item.grade}
                      </Badge>
                      {item.deltaFromPrev !== null && (
                        <span
                          className={`text-[10px] font-black ${
                            item.deltaFromPrev >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {item.deltaFromPrev >= 0 ? `+${item.deltaFromPrev}%` : `${item.deltaFromPrev}%`}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
