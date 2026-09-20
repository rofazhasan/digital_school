import db from '@/lib/db';
import { FocusSessionStatus, ChallengeStatus } from '@prisma/client';
import { addMinutes, addSeconds } from 'date-fns';
import { dispatchChallengeCompleted } from './cross-feature-service';

export interface StartFocusInput {
  arenaId: string;
  challengeId?: string;
  durationMinutes: number;
}

/**
 * Starts a new timestamp-driven focus session.
 * Stores canonical timestamps so client can calculate remaining time locally without server polling.
 */
export async function startFocusSession(studentProfileId: string, input: StartFocusInput) {
  const duration = Math.max(1, Math.min(360, input.durationMinutes || 25));
  const now = new Date();
  const plannedEnd = addMinutes(now, duration);

  // If there's an active session for this student, mark it abandoned
  await db.focusSession.updateMany({
    where: {
      studentProfileId,
      status: FocusSessionStatus.ACTIVE,
    },
    data: {
      status: FocusSessionStatus.ABANDONED,
      actualEnd: now,
    },
  });

  const session = await db.focusSession.create({
    data: {
      studentProfileId,
      arenaId: input.arenaId,
      challengeId: input.challengeId ?? null,
      plannedDurationMinutes: duration,
      startedAt: now,
      plannedEnd,
      status: FocusSessionStatus.ACTIVE,
      secondsElapsed: 0,
    },
    include: {
      challenge: {
        include: {
          subjects: { include: { subject: true } },
          topics: { include: { topic: true } },
        },
      },
    },
  });

  // If tied to a challenge, mark challenge as IN_PROGRESS
  if (input.challengeId) {
    await db.arenaChallenge.update({
      where: { id: input.challengeId },
      data: { status: ChallengeStatus.IN_PROGRESS },
    });
  }

  return session;
}

/**
 * Pauses an active focus session.
 * Stores frozen elapsed seconds to preserve accuracy across device sleep / tab changes.
 */
export async function pauseFocusSession(studentProfileId: string, sessionId: string, secondsElapsed: number) {
  const session = await db.focusSession.findFirst({
    where: { id: sessionId, studentProfileId },
  });

  if (!session) {
    throw new Error('Focus session not found or unauthorized.');
  }

  const updated = await db.focusSession.update({
    where: { id: sessionId },
    data: {
      status: FocusSessionStatus.PAUSED,
      secondsElapsed: Math.max(session.secondsElapsed, secondsElapsed),
      pauseCount: { increment: 1 },
    },
  });

  return updated;
}

/**
 * Resumes a paused focus session.
 * Calculates a new plannedEnd timestamp based on remaining seconds.
 */
export async function resumeFocusSession(studentProfileId: string, sessionId: string) {
  const session = await db.focusSession.findFirst({
    where: { id: sessionId, studentProfileId },
  });

  if (!session) {
    throw new Error('Focus session not found or unauthorized.');
  }

  const now = new Date();
  const totalPlannedSeconds = session.plannedDurationMinutes * 60;
  const remainingSeconds = Math.max(0, totalPlannedSeconds - session.secondsElapsed);
  const newPlannedEnd = addSeconds(now, remainingSeconds);

  const updated = await db.focusSession.update({
    where: { id: sessionId },
    data: {
      status: FocusSessionStatus.ACTIVE,
      plannedEnd: newPlannedEnd,
    },
    include: {
      challenge: {
        include: {
          subjects: { include: { subject: true } },
          topics: { include: { topic: true } },
        },
      },
    },
  });

  return updated;
}

/**
 * Completes a focus session.
 * Records actual focus minutes and updates the associated challenge.
 */
export async function completeFocusSession(studentProfileId: string, sessionId: string, actualSeconds: number) {
  const session = await db.focusSession.findFirst({
    where: { id: sessionId, studentProfileId },
  });

  if (!session) {
    throw new Error('Focus session not found or unauthorized.');
  }

  const now = new Date();
  const elapsed = Math.max(session.secondsElapsed, actualSeconds || session.plannedDurationMinutes * 60);
  const focusMinutes = Math.round(elapsed / 60);

  const updated = await db.focusSession.update({
    where: { id: sessionId },
    data: {
      status: FocusSessionStatus.COMPLETED,
      actualEnd: now,
      secondsElapsed: elapsed,
    },
    include: { challenge: true },
  });

  if (session.challengeId) {
    await db.arenaChallenge.update({
      where: { id: session.challengeId },
      data: {
        status: ChallengeStatus.COMPLETED,
        completedAt: now,
        actualMinutesSpent: { increment: focusMinutes },
      },
    });

    // Update parent arena totals
    await db.dailyArena.update({
      where: { id: session.arenaId },
      data: {
        totalCompletedMinutes: { increment: focusMinutes },
        completedCount: { increment: 1 },
      },
    });

    // Cascade to central cross-feature engine (Mistakes, Revisions, Topics, Goals, Exams, Streaks)
    await dispatchChallengeCompleted(studentProfileId, session.challengeId, focusMinutes);
  }

  return updated;
}

/**
 * Retrieves the currently active or paused focus session if any exists.
 */
export async function getActiveFocusSession(studentProfileId: string) {
  return await db.focusSession.findFirst({
    where: {
      studentProfileId,
      status: { in: [FocusSessionStatus.ACTIVE, FocusSessionStatus.PAUSED] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      challenge: {
        include: {
          subjects: { include: { subject: true } },
          topics: { include: { topic: true } },
        },
      },
    },
  });
}
