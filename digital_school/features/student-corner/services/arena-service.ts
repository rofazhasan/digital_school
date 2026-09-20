import db from '@/lib/db';
import { DayMode, ChallengeCategory, ChallengePriority, ChallengeStatus } from '@prisma/client';
import { startOfDay, format } from 'date-fns';
import { logArenaAction } from './audit-service';
import { calculateStudentStreaks } from './streak-service';

export interface CreateChallengeInput {
  date: string | Date; // YYYY-MM-DD
  title: string;
  category: ChallengeCategory;
  customCategoryName?: string;
  durationMinutes: number;
  scheduledTime?: string;
  priority?: ChallengePriority;
  notes?: string;
  subjectNames?: string[];
  topicNames?: string[];
}

export interface UpdateChallengeInput {
  challengeId: string;
  title?: string;
  category?: ChallengeCategory;
  customCategoryName?: string;
  durationMinutes?: number;
  scheduledTime?: string;
  priority?: ChallengePriority;
  notes?: string;
  status?: ChallengeStatus;
  subjectNames?: string[];
  topicNames?: string[];
  emergencyReason?: string;
}

/**
 * Retrieves or initializes the DailyArena for a specific date in the student's timezone.
 */
export async function getOrCreateDailyArena(studentProfileId: string, dateInput: string | Date) {
  const parsedDate = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const canonicalDate = startOfDay(parsedDate);

  let arena = await db.dailyArena.findUnique({
    where: {
      studentProfileId_date: {
        studentProfileId,
        date: canonicalDate,
      },
    },
    include: {
      challenges: {
        orderBy: { orderIndex: 'asc' },
        include: {
          subjects: {
            include: {
              subject: true,
            },
          },
          topics: {
            include: {
              topic: true,
            },
          },
          focusSessions: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!arena) {
    // Check student's default day mode preference
    const profile = await db.studentCornerProfile.findUnique({
      where: { studentProfileId },
      select: { defaultDayMode: true },
    });

    const defaultMode = profile?.defaultDayMode || DayMode.NORMAL;

    arena = await db.dailyArena.create({
      data: {
        studentProfileId,
        date: canonicalDate,
        mode: defaultMode,
        isLocked: defaultMode === DayMode.LOCKED,
      },
      include: {
        challenges: {
          orderBy: { orderIndex: 'asc' },
          include: {
            subjects: { include: { subject: true } },
            topics: { include: { topic: true } },
            focusSessions: true,
          },
        },
      },
    });
  }

  return arena;
}

/**
 * Creates a challenge in the student's daily arena.
 * Enforces strict & locked day rules server-side.
 */
export async function createChallenge(studentProfileId: string, input: CreateChallengeInput) {
  const arena = await getOrCreateDailyArena(studentProfileId, input.date);

  // IMMUTABILITY CHECK
  if (arena.isLocked || arena.mode === DayMode.LOCKED) {
    throw new Error('DAY_LOCKED: Cannot add new challenges when the day is locked.');
  }

  if (arena.mode === DayMode.STRICT) {
    // In strict mode, if current time is past day start or tasks are ongoing, disallow modifying the plan
    const today = startOfDay(new Date());
    if (new Date(arena.date) <= today && arena.challenges.length > 0) {
      throw new Error('DAY_STRICT: Cannot add new challenges to an active Strict Mode day.');
    }
  }

  const currentCount = arena.challenges.length;
  const duration = Math.max(1, Math.min(1440, input.durationMinutes || 30));

  // Handle subjects & topics (create if not exist)
  const subjectIds: string[] = [];
  if (input.subjectNames && input.subjectNames.length > 0) {
    for (const subName of input.subjectNames) {
      const trimmed = subName.trim();
      if (!trimmed) continue;
      const sub = await db.studentCornerSubject.upsert({
        where: {
          studentProfileId_name: {
            studentProfileId,
            name: trimmed,
          },
        },
        create: {
          studentProfileId,
          name: trimmed,
        },
        update: {},
      });
      subjectIds.push(sub.id);
    }
  }

  const topicIds: string[] = [];
  if (input.topicNames && input.topicNames.length > 0 && subjectIds.length > 0) {
    const primarySubjectId = subjectIds[0];
    for (const topName of input.topicNames) {
      const trimmed = topName.trim();
      if (!trimmed) continue;
      const top = await db.studentCornerTopic.upsert({
        where: {
          subjectId_name: {
            subjectId: primarySubjectId,
            name: trimmed,
          },
        },
        create: {
          subjectId: primarySubjectId,
          name: trimmed,
        },
        update: {},
      });
      topicIds.push(top.id);
    }
  }

  const challenge = await db.arenaChallenge.create({
    data: {
      arenaId: arena.id,
      studentProfileId,
      title: input.title.trim(),
      category: input.category,
      customCategoryName: input.customCategoryName ?? null,
      durationMinutes: duration,
      scheduledTime: input.scheduledTime ?? null,
      priority: input.priority || ChallengePriority.MEDIUM,
      notes: input.notes ?? null,
      orderIndex: currentCount,
      subjects: {
        create: subjectIds.map((sId) => ({ subjectId: sId })),
      },
      topics: {
        create: topicIds.map((tId) => ({ topicId: tId })),
      },
    },
    include: {
      subjects: { include: { subject: true } },
      topics: { include: { topic: true } },
    },
  });

  // Re-aggregate arena stats
  await updateArenaStats(arena.id);

  return challenge;
}

/**
 * Updates a challenge.
 * Strictly verifies ownership and day commitment constraints.
 */
export async function updateChallenge(studentProfileId: string, input: UpdateChallengeInput) {
  const challenge = await db.arenaChallenge.findFirst({
    where: {
      id: input.challengeId,
      studentProfileId,
    },
    include: {
      arena: true,
    },
  });

  if (!challenge) {
    throw new Error('Challenge not found or unauthorized.');
  }

  const arena = challenge.arena;

  // STRICT / LOCKED IMMUTABILITY CHECKS
  if (arena.isLocked || arena.mode === DayMode.LOCKED) {
    if (!input.emergencyReason) {
      throw new Error('DAY_LOCKED: Day is locked. Plan cannot be modified.');
    }
    // Audit the emergency override
    await logArenaAction({
      arenaId: arena.id,
      studentProfileId,
      action: 'EMERGENCY_OVERRIDE_EDIT',
      reason: input.emergencyReason,
      oldValue: JSON.stringify({ title: challenge.title, duration: challenge.durationMinutes }),
      newValue: JSON.stringify({ title: input.title, duration: input.durationMinutes }),
    });
  } else if (arena.mode === DayMode.STRICT) {
    // If only toggling status, that is allowed in Strict Mode
    const isOnlyStatusChange =
      input.status !== undefined &&
      input.title === undefined &&
      input.durationMinutes === undefined &&
      input.category === undefined &&
      input.scheduledTime === undefined;

    if (!isOnlyStatusChange && !input.emergencyReason) {
      throw new Error('DAY_STRICT: Strict Mode preserves commitment integrity. Challenge parameters cannot be edited.');
    }

    if (input.emergencyReason) {
      await logArenaAction({
        arenaId: arena.id,
        studentProfileId,
        action: 'STRICT_OVERRIDE_EDIT',
        reason: input.emergencyReason,
      });
    }
  }

  const updated = await db.arenaChallenge.update({
    where: { id: input.challengeId },
    data: {
      title: input.title !== undefined ? input.title.trim() : undefined,
      category: input.category,
      customCategoryName: input.customCategoryName,
      durationMinutes: input.durationMinutes,
      scheduledTime: input.scheduledTime,
      priority: input.priority,
      notes: input.notes,
      status: input.status,
      completedAt: input.status === ChallengeStatus.COMPLETED ? (challenge.completedAt || new Date()) : undefined,
    },
    include: {
      subjects: { include: { subject: true } },
      topics: { include: { topic: true } },
    },
  });

  await updateArenaStats(arena.id);

  if (input.status === ChallengeStatus.COMPLETED) {
    await calculateStudentStreaks(studentProfileId);
  }

  return updated;
}

/**
 * Deletes a challenge.
 * Prohibited in Locked and Strict modes unless authorized with reason.
 */
export async function deleteChallenge(studentProfileId: string, challengeId: string, emergencyReason?: string) {
  const challenge = await db.arenaChallenge.findFirst({
    where: {
      id: challengeId,
      studentProfileId,
    },
    include: { arena: true },
  });

  if (!challenge) {
    throw new Error('Challenge not found or unauthorized.');
  }

  if (challenge.arena.isLocked || challenge.arena.mode === DayMode.LOCKED) {
    if (!emergencyReason) {
      throw new Error('DAY_LOCKED: Cannot delete challenges on a locked day.');
    }
    await logArenaAction({
      arenaId: challenge.arena.id,
      studentProfileId,
      action: 'EMERGENCY_DELETE',
      reason: emergencyReason,
      oldValue: challenge.title,
    });
  } else if (challenge.arena.mode === DayMode.STRICT) {
    if (!emergencyReason) {
      throw new Error('DAY_STRICT: Cannot delete challenges on a strict commitment day.');
    }
    await logArenaAction({
      arenaId: challenge.arena.id,
      studentProfileId,
      action: 'STRICT_DELETE',
      reason: emergencyReason,
      oldValue: challenge.title,
    });
  }

  await db.arenaChallenge.delete({
    where: { id: challengeId },
  });

  await updateArenaStats(challenge.arenaId);
  return { success: true };
}

/**
 * Toggles a challenge's completion status.
 * Allowed in all modes (Normal, Strict, Locked).
 */
export async function toggleChallengeCompletion(studentProfileId: string, challengeId: string) {
  const challenge = await db.arenaChallenge.findFirst({
    where: {
      id: challengeId,
      studentProfileId,
    },
  });

  if (!challenge) {
    throw new Error('Challenge not found or unauthorized.');
  }

  const isCompleted = challenge.status === ChallengeStatus.COMPLETED;
  const newStatus = isCompleted ? ChallengeStatus.NOT_STARTED : ChallengeStatus.COMPLETED;

  const updated = await db.arenaChallenge.update({
    where: { id: challengeId },
    data: {
      status: newStatus,
      completedAt: newStatus === ChallengeStatus.COMPLETED ? new Date() : null,
      actualMinutesSpent: newStatus === ChallengeStatus.COMPLETED && challenge.actualMinutesSpent === 0
        ? challenge.durationMinutes
        : challenge.actualMinutesSpent,
    },
  });

  await updateArenaStats(challenge.arenaId);
  await calculateStudentStreaks(studentProfileId);

  return updated;
}

/**
 * Reorders challenges in a day. Prohibited in Strict / Locked modes.
 */
export async function reorderChallenges(studentProfileId: string, arenaId: string, orderedIds: string[]) {
  const arena = await db.dailyArena.findFirst({
    where: { id: arenaId, studentProfileId },
  });

  if (!arena) {
    throw new Error('Arena not found or unauthorized.');
  }

  if (arena.isLocked || arena.mode === DayMode.LOCKED || arena.mode === DayMode.STRICT) {
    throw new Error('IMMUTABLE_ORDER: Reordering is disabled in Strict and Locked modes.');
  }

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.arenaChallenge.updateMany({
        where: { id, arenaId, studentProfileId },
        data: { orderIndex: index },
      })
    )
  );

  return { success: true };
}

/**
 * Switches the day mode (Normal, Strict, Locked).
 */
export async function setDayMode(studentProfileId: string, arenaId: string, mode: DayMode, reason?: string) {
  const arena = await db.dailyArena.findFirst({
    where: { id: arenaId, studentProfileId },
  });

  if (!arena) {
    throw new Error('Arena not found or unauthorized.');
  }

  // If already locked, downgrading requires an audit log
  if (arena.isLocked && mode !== DayMode.LOCKED) {
    await logArenaAction({
      arenaId,
      studentProfileId,
      action: 'UNLOCK_DAY_OVERRIDE',
      oldValue: 'LOCKED',
      newValue: mode,
      reason: reason || 'Manual unlock override',
    });
  }

  const updated = await db.dailyArena.update({
    where: { id: arenaId },
    data: {
      mode,
      isLocked: mode === DayMode.LOCKED,
      lockedAt: mode === DayMode.LOCKED ? new Date() : null,
    },
  });

  return updated;
}

/**
 * Helper to update precomputed arena metrics without N+1 queries.
 */
async function updateArenaStats(arenaId: string) {
  const challenges = await db.arenaChallenge.findMany({
    where: { arenaId },
    select: {
      durationMinutes: true,
      actualMinutesSpent: true,
      status: true,
    },
  });

  const totalCount = challenges.length;
  const completedCount = challenges.filter((c) => c.status === ChallengeStatus.COMPLETED).length;
  const totalPlannedMinutes = challenges.reduce((sum, c) => sum + c.durationMinutes, 0);
  const totalCompletedMinutes = challenges.reduce((sum, c) => {
    return c.status === ChallengeStatus.COMPLETED ? sum + (c.actualMinutesSpent || c.durationMinutes) : sum;
  }, 0);

  await db.dailyArena.update({
    where: { id: arenaId },
    data: {
      totalCount,
      completedCount,
      totalPlannedMinutes,
      totalCompletedMinutes,
    },
  });
}

/**
 * Duplicates an entire day's routine to another date (Item 52)
 */
export async function duplicateDayRoutine(
  studentProfileId: string,
  sourceDate: Date | string,
  targetDate: Date | string
) {
  const parsedSource = startOfDay(new Date(sourceDate));
  const parsedTarget = startOfDay(new Date(targetDate));

  const sourceArena = await db.dailyArena.findUnique({
    where: {
      studentProfileId_date: { studentProfileId, date: parsedSource },
    },
    include: {
      challenges: {
        include: {
          subjects: true,
          topics: true,
        },
      },
    },
  });

  if (!sourceArena || sourceArena.challenges.length === 0) {
    throw new Error('Source day has no challenges to duplicate.');
  }

  const targetArena = await getOrCreateDailyArena(studentProfileId, parsedTarget);
  if (targetArena.isLocked) {
    throw new Error('Cannot duplicate challenges into a Locked target day.');
  }

  // Create duplicate challenges
  for (const c of sourceArena.challenges) {
    const newChallenge = await db.arenaChallenge.create({
      data: {
        arenaId: targetArena.id,
        studentProfileId,
        title: c.title,
        category: c.category,
        customCategoryName: c.customCategoryName,
        durationMinutes: c.durationMinutes,
        scheduledTime: c.scheduledTime,
        priority: c.priority,
        notes: c.notes,
        status: ChallengeStatus.NOT_STARTED,
        orderIndex: targetArena.challenges.length + 1,
      },
    });

    for (const s of c.subjects) {
      await db.challengeSubjectMap.create({
        data: { challengeId: newChallenge.id, subjectId: s.subjectId },
      });
    }
    for (const t of c.topics) {
      await db.challengeTopicMap.create({
        data: { challengeId: newChallenge.id, topicId: t.topicId },
      });
    }
  }

  await updateArenaStats(targetArena.id);
  return getOrCreateDailyArena(studentProfileId, parsedTarget);
}

/**
 * Bulk actions on selected challenges (Item 54)
 */
export async function bulkChallengeOperations(
  studentProfileId: string,
  challengeIds: string[],
  action: 'DELETE' | 'DUPLICATE' | 'CHANGE_CATEGORY' | 'MOVE_TO_DATE',
  payload?: any
) {
  if (!challengeIds || challengeIds.length === 0) return { count: 0 };

  // Verify ownership & locks
  const challenges = await db.arenaChallenge.findMany({
    where: { id: { in: challengeIds }, studentProfileId },
    include: { arena: true, subjects: true, topics: true },
  });

  const affectedArenaIds = new Set<string>();

  for (const c of challenges) {
    if (c.arena.isLocked) {
      throw new Error(`Cannot modify challenge "${c.title}" inside a Locked day.`);
    }
    affectedArenaIds.add(c.arenaId);
  }

  if (action === 'DELETE') {
    await db.arenaChallenge.deleteMany({
      where: { id: { in: challengeIds }, studentProfileId },
    });
  } else if (action === 'CHANGE_CATEGORY' && payload?.category) {
    await db.arenaChallenge.updateMany({
      where: { id: { in: challengeIds }, studentProfileId },
      data: { category: payload.category },
    });
  } else if (action === 'DUPLICATE') {
    for (const c of challenges) {
      const newC = await db.arenaChallenge.create({
        data: {
          arenaId: c.arenaId,
          studentProfileId,
          title: `${c.title} (Copy)`,
          category: c.category,
          durationMinutes: c.durationMinutes,
          priority: c.priority,
          status: ChallengeStatus.NOT_STARTED,
          orderIndex: c.orderIndex + 1,
        },
      });
      for (const s of c.subjects) {
        await db.challengeSubjectMap.create({
          data: { challengeId: newC.id, subjectId: s.subjectId },
        });
      }
    }
  } else if (action === 'MOVE_TO_DATE' && payload?.targetDate) {
    const targetArena = await getOrCreateDailyArena(studentProfileId, payload.targetDate);
    if (targetArena.isLocked) {
      throw new Error('Cannot move challenges to a Locked target day.');
    }
    await db.arenaChallenge.updateMany({
      where: { id: { in: challengeIds }, studentProfileId },
      data: { arenaId: targetArena.id },
    });
    affectedArenaIds.add(targetArena.id);
  }

  for (const aId of Array.from(affectedArenaIds)) {
    await updateArenaStats(aId);
  }

  return { success: true, count: challenges.length };
}

/**
 * Gathers unfinished challenges for Recovery Mode review (Items 46-48)
 */
export async function getRecoveryBacklog(studentProfileId: string) {
  const pastSevenDays = startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const today = startOfDay(new Date());

  const unfinished = await db.arenaChallenge.findMany({
    where: {
      studentProfileId,
      status: { notIn: [ChallengeStatus.COMPLETED, ChallengeStatus.CANCELLED] },
      arena: {
        date: { gte: pastSevenDays, lt: today },
      },
    },
    include: {
      arena: { select: { date: true, mode: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return unfinished.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    durationMinutes: c.durationMinutes,
    priority: c.priority,
    originalDate: format(new Date(c.arena.date), 'yyyy-MM-dd'),
  }));
}

