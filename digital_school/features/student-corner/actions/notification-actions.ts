'use server';

import { requireStudentAuth } from './auth-helper';
import {
  getStudentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  generateMorningDigest,
} from '../services/notification-service';

export async function getNotificationsAction() {
  try {
    const student = await requireStudentAuth();
    const data = await getStudentNotifications(student.studentProfileId);
    return { success: true, ...data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch notifications' };
  }
}

export async function markNotificationReadAction(notificationId: string) {
  try {
    const student = await requireStudentAuth();
    await markNotificationAsRead(student.studentProfileId, notificationId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to mark notification as read' };
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const student = await requireStudentAuth();
    await markAllNotificationsAsRead(student.studentProfileId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to mark all as read' };
  }
}

export async function triggerMorningDigestAction() {
  try {
    const student = await requireStudentAuth();
    const digest = await generateMorningDigest(student.studentProfileId);
    return { success: true, digest };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to trigger digest' };
  }
}
