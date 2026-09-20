import { ChallengeCategory, ChallengePriority, ChallengeStatus } from '@prisma/client';
import { parse, isValid, differenceInMinutes, format } from 'date-fns';

export type UrgencyLevel = 'COMFORTABLE' | 'APPROACHING' | 'URGENT' | 'CRITICAL' | 'OVERDUE';

export interface UrgencyInfo {
  level: UrgencyLevel;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  pulse: boolean;
  remainingText: string;
  isUrgent: boolean;
  orderWeight: number;
}

/**
 * Intelligent Urgency Engine:
 * Calculates urgency based on scheduledTime (e.g. "17:30" or "5:30 PM") and current local time.
 * Thresholds:
 * - Completed: Normal calm state
 * - > 3 hours: COMFORTABLE 🟢
 * - 1 to 3 hours: APPROACHING 🟡
 * - 15m to 1 hour: URGENT 🟠
 * - < 15m: CRITICAL 🔴
 * - Past deadline: OVERDUE ⚠️
 */
export function getChallengeUrgency(
  scheduledTime?: string | null,
  status: ChallengeStatus = 'PENDING',
  now: Date = new Date()
): UrgencyInfo {
  if (status === 'COMPLETED') {
    return {
      level: 'COMFORTABLE',
      label: 'Executed',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/30',
      pulse: false,
      remainingText: 'Completed',
      isUrgent: false,
      orderWeight: 99,
    };
  }

  if (!scheduledTime || !scheduledTime.trim()) {
    return {
      level: 'COMFORTABLE',
      label: 'Anytime Today',
      badgeBg: 'bg-slate-800/60',
      badgeText: 'text-slate-400',
      badgeBorder: 'border-slate-700/50',
      pulse: false,
      remainingText: 'Flexible',
      isUrgent: false,
      orderWeight: 50,
    };
  }

  // Parse scheduledTime e.g. "17:30", "5:30 PM", "05:30"
  let parsedTarget: Date | null = null;
  const cleanTime = scheduledTime.trim();

  // Try 24-hour format HH:mm
  const try24 = parse(cleanTime, 'HH:mm', now);
  if (isValid(try24)) {
    parsedTarget = try24;
  } else {
    // Try 12-hour format h:mm a
    const try12 = parse(cleanTime, 'h:mm a', now);
    if (isValid(try12)) {
      parsedTarget = try12;
    } else {
      const tryH = parse(cleanTime, 'HH', now);
      if (isValid(tryH)) parsedTarget = tryH;
    }
  }

  if (!parsedTarget) {
    return {
      level: 'COMFORTABLE',
      label: scheduledTime,
      badgeBg: 'bg-slate-800/60',
      badgeText: 'text-slate-400',
      badgeBorder: 'border-slate-700/50',
      pulse: false,
      remainingText: scheduledTime,
      isUrgent: false,
      orderWeight: 50,
    };
  }

  const diffMinutes = differenceInMinutes(parsedTarget, now);

  if (diffMinutes < 0) {
    const overdueMins = Math.abs(diffMinutes);
    const overdueText = overdueMins >= 60 
      ? `${Math.floor(overdueMins / 60)}h ${overdueMins % 60}m overdue`
      : `${overdueMins}m overdue`;

    return {
      level: 'OVERDUE',
      label: 'Overdue',
      badgeBg: 'bg-rose-500/20',
      badgeText: 'text-rose-400',
      badgeBorder: 'border-rose-500/50',
      pulse: true,
      remainingText: overdueText,
      isUrgent: true,
      orderWeight: 1,
    };
  }

  if (diffMinutes <= 15) {
    return {
      level: 'CRITICAL',
      label: 'Critical',
      badgeBg: 'bg-rose-500/20',
      badgeText: 'text-rose-400',
      badgeBorder: 'border-rose-500/50',
      pulse: true,
      remainingText: `${diffMinutes}m left`,
      isUrgent: true,
      orderWeight: 2,
    };
  }

  if (diffMinutes <= 60) {
    return {
      level: 'URGENT',
      label: 'Urgent',
      badgeBg: 'bg-amber-500/20',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/40',
      pulse: false,
      remainingText: `${diffMinutes}m left`,
      isUrgent: true,
      orderWeight: 3,
    };
  }

  if (diffMinutes <= 180) {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return {
      level: 'APPROACHING',
      label: 'Approaching',
      badgeBg: 'bg-yellow-500/10',
      badgeText: 'text-yellow-400',
      badgeBorder: 'border-yellow-500/30',
      pulse: false,
      remainingText: `${hours}h ${mins}m left`,
      isUrgent: false,
      orderWeight: 4,
    };
  }

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return {
    level: 'COMFORTABLE',
    label: 'Comfortable',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    pulse: false,
    remainingText: `${hours}h ${mins}m left`,
    isUrgent: false,
    orderWeight: 5,
  };
}

/**
 * Format duration in minutes into clean readable strings like "01h 30m" or "45m"
 */
export function formatDurationHoursMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '15m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  if (h > 0) return `${String(h).padStart(2, '0')}h`;
  return `${m}m`;
}

/**
 * Format seconds into HH:MM:SS or MM:SS for huge display timer
 */
export function formatTimerClock(totalSeconds: number): { main: string; hoursPrefix?: string } {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return {
      main: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    };
  }

  return {
    main: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  };
}

/**
 * Category styling metadata: icon names, accent color, and human-readable names.
 */
export function getCategoryMeta(category: ChallengeCategory, customName?: string | null) {
  switch (category) {
    case 'STUDY':
      return {
        label: 'Study & Academics',
        emoji: '🧠',
        color: 'indigo',
        textColor: 'text-indigo-400',
        bgSubtle: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/30',
        gradient: 'from-indigo-500 to-blue-600',
      };
    case 'REVISION':
      return {
        label: 'Active Revision',
        emoji: '📖',
        color: 'purple',
        textColor: 'text-purple-400',
        bgSubtle: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        gradient: 'from-purple-500 to-pink-600',
      };
    case 'CODING':
      return {
        label: 'LeetCode & Systems',
        emoji: '💻',
        color: 'cyan',
        textColor: 'text-cyan-400',
        bgSubtle: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        gradient: 'from-cyan-500 to-teal-500',
      };
    case 'EXAM_PREP':
      return {
        label: 'Exam Prep & Mock',
        emoji: '📝',
        color: 'rose',
        textColor: 'text-rose-400',
        bgSubtle: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        gradient: 'from-rose-500 to-red-600',
      };
    case 'MISTAKE_RETEST':
      return {
        label: 'Remedial Retest',
        emoji: '🎯',
        color: 'amber',
        textColor: 'text-amber-400',
        bgSubtle: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        gradient: 'from-amber-500 to-orange-600',
      };
    case 'SALAT':
      return {
        label: 'Salat & Spiritual',
        emoji: '🕌',
        color: 'emerald',
        textColor: 'text-emerald-400',
        bgSubtle: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        gradient: 'from-emerald-500 to-teal-600',
      };
    case 'HABIT':
      return {
        label: 'Key Habit',
        emoji: '⚡',
        color: 'amber',
        textColor: 'text-amber-400',
        bgSubtle: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        gradient: 'from-amber-500 to-orange-500',
      };
    case 'DIET':
      return {
        label: 'Diet & Energy',
        emoji: '🥗',
        color: 'green',
        textColor: 'text-green-400',
        bgSubtle: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        gradient: 'from-green-500 to-emerald-600',
      };
    case 'MISTAKE_RETEST':
      return {
        label: 'Mistake Retest',
        emoji: '🎯',
        color: 'orange',
        textColor: 'text-orange-400',
        bgSubtle: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        gradient: 'from-orange-500 to-red-500',
      };
    default:
      return {
        label: customName || 'Custom Focus',
        emoji: '✨',
        color: 'blue',
        textColor: 'text-blue-400',
        bgSubtle: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        gradient: 'from-blue-500 to-indigo-600',
      };
  }
}

/**
 * Web Audio API gentle synthesizer for calm milestone feedback without heavy audio files.
 */
export function playGentleCompletionTone() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play warm peaceful two-tone chord (E5 -> B5)
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc2.frequency.setValueAtTime(987.77, now + 0.12); // B5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.1);
    osc1.stop(now + 1.2);
    osc2.stop(now + 1.2);
  } catch {
    // Ignore audio autoplay restrictions gracefully
  }
}
