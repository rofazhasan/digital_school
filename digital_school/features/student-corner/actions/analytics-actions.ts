'use server';

import { requireStudentAuth } from './auth-helper';
import {
  getHeatmapData,
  getMultiMetricHeatmapData,
  getStudentAnalyticsOverview,
  calculateTodayScore,
  getPlanVsReality,
  getPeakProductivityWindows,
  getSubjectAndTopicAnalytics,
} from '../services/analytics-service';
import { getDetailedStreakHistory } from '../services/streak-service';
import { getWeeklyReview, getMonthlyReview, getYearlyReview } from '../services/review-service';
import { HeatmapMetricType } from '../types';

export async function getHeatmapDataAction(year?: number) {
  try {
    const student = await requireStudentAuth();
    const heatmap = await getHeatmapData(student.studentProfileId, year || new Date().getFullYear());
    return { success: true, heatmap };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch heatmap data' };
  }
}

export async function getMultiMetricHeatmapAction(metric: HeatmapMetricType, year?: number) {
  try {
    const student = await requireStudentAuth();
    const heatmap = await getMultiMetricHeatmapData(student.studentProfileId, metric, year || new Date().getFullYear());
    return { success: true, heatmap };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch multi-metric heatmap data' };
  }
}

export async function getTodayScoreAction() {
  try {
    const student = await requireStudentAuth();
    const todayScore = await calculateTodayScore(student.studentProfileId);
    return { success: true, todayScore };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to calculate today score' };
  }
}

export async function getDetailedStreakHistoryAction() {
  try {
    const student = await requireStudentAuth();
    const streakHistory = await getDetailedStreakHistory(student.studentProfileId);
    return { success: true, streakHistory };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch streak history' };
  }
}

export async function getPlanVsRealityAction(days = 14) {
  try {
    const student = await requireStudentAuth();
    const data = await getPlanVsReality(student.studentProfileId, days);
    return { success: true, ...data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch plan vs reality' };
  }
}

export async function getPeriodicReviewAction(period: 'WEEKLY' | 'MONTHLY' | 'YEARLY', dateStr?: string) {
  try {
    const student = await requireStudentAuth();
    const date = dateStr ? new Date(dateStr) : new Date();

    let review;
    if (period === 'WEEKLY') {
      review = await getWeeklyReview(student.studentProfileId, date);
    } else if (period === 'MONTHLY') {
      review = await getMonthlyReview(student.studentProfileId, date);
    } else {
      review = await getYearlyReview(student.studentProfileId, date.getFullYear());
    }

    return { success: true, review };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to generate review' };
  }
}

export async function getSubjectAndTopicAnalyticsAction() {
  try {
    const student = await requireStudentAuth();
    const subjects = await getSubjectAndTopicAnalytics(student.studentProfileId);
    return { success: true, subjects };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch subject analytics' };
  }
}

export async function getPeakProductivityWindowsAction() {
  try {
    const student = await requireStudentAuth();
    const windows = await getPeakProductivityWindows(student.studentProfileId);
    return { success: true, windows };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch peak productivity windows' };
  }
}

export async function getStudentAnalyticsOverviewAction() {
  try {
    const student = await requireStudentAuth();
    const overview = await getStudentAnalyticsOverview(student.studentProfileId);
    return { success: true, overview };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch analytics overview' };
  }
}
