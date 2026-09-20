import db from '@/lib/db';
import { startOfDay, format, addDays } from 'date-fns';

export interface StudentNotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionUrl?: string | null;
  createdAt: Date;
}

/**
 * Fetches notifications for a student
 */
export async function getStudentNotifications(
  studentProfileId: string,
  limit = 20
): Promise<{ notifications: StudentNotificationItem[]; unreadCount: number }> {
  const [notifications, unreadCount] = await Promise.all([
    db.studentCornerNotification.findMany({
      where: { studentProfileId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    db.studentCornerNotification.count({
      where: { studentProfileId, read: false },
    }),
  ]);

  return {
    notifications,
    unreadCount,
  };
}

/**
 * Marks a notification as read
 */
export async function markNotificationAsRead(studentProfileId: string, notificationId: string) {
  return db.studentCornerNotification.updateMany({
    where: { id: notificationId, studentProfileId },
    data: { read: true },
  });
}

/**
 * Marks all notifications as read
 */
export async function markAllNotificationsAsRead(studentProfileId: string) {
  return db.studentCornerNotification.updateMany({
    where: { studentProfileId, read: false },
    data: { read: true },
  });
}

/**
 * Generates Morning Digest for the student (Item 43)
 */
export async function generateMorningDigest(studentProfileId: string) {
  const today = startOfDay(new Date());

  const [arena, exams, profile] = await Promise.all([
    db.dailyArena.findUnique({
      where: {
        studentProfileId_date: { studentProfileId, date: today },
      },
      include: { challenges: true },
    }),
    db.personalExam.findMany({
      where: {
        studentProfileId,
        isCompleted: false,
        examDate: { gte: today, lte: addDays(today, 7) },
      },
      orderBy: { examDate: 'asc' },
      take: 2,
    }),
    db.studentCornerProfile.findUnique({
      where: { studentProfileId },
      select: { currentStreak: true },
    }),
  ]);

  const challengeCount = arena?.challenges?.length || 0;
  const examAlert =
    exams.length > 0
      ? ` • ${exams.length} exam(s) approaching this week (${exams[0].title})`
      : '';

  const digestMessage = `${challengeCount} challenge(s) planned for today${examAlert}. Current streak: ${
    profile?.currentStreak || 0
  } days. Bismillah, have a productive day!`;

  return db.studentCornerNotification.create({
    data: {
      studentProfileId,
      title: '☀️ Morning Routine Summary',
      message: digestMessage,
      type: 'DIGEST',
      actionUrl: '/student/student-corner/arena',
    },
  });
}
