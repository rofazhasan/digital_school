'use client';

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, FileText, Brain, TrendingUp, Activity } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  questions: {
    total: number;
    thisMonth: number;
    thisWeek: number;
  };
  users: {
    total: number;
    active: number;
  };
  ai: {
    activities: number;
  };
  exports: {
    total: number;
  };
}

interface QuestionAnalytics {
  totalQuestions: number;
  questionsByType: { [key: string]: number };
  questionsBySubject: { [key: string]: number };
  questionsByDifficulty: { [key: string]: number };
  questionsByStatus: { [key: string]: number };
  averageMarks: number;
  totalUsage: number;
  aiGeneratedCount: number;
  approvalRate: number;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/analytics/dashboard');
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setAnalyticsData(statsData.stats);
      }

      // Fetch question analytics
      const startDate = subDays(new Date(), parseInt(timeRange));
      const questionResponse = await fetch(
        `/api/analytics/questions?startDate=${startDate.toISOString()}&endDate=${new Date().toISOString()}`
      );
      const questionData = await questionResponse.json();
      
      if (questionData.success) {
        setQuestionAnalytics(questionData.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const questionTypeData = {
    labels: questionAnalytics ? Object.keys(questionAnalytics.questionsByType) : [],
    datasets: [
      {
        label: 'Questions by Type',
        data: questionAnalytics ? Object.values(questionAnalytics.questionsByType) : [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const subjectData = {
    labels: questionAnalytics ? Object.keys(questionAnalytics.questionsBySubject) : [],
    datasets: [
      {
        label: 'Questions by Subject',
        data: questionAnalytics ? Object.values(questionAnalytics.questionsBySubject) : [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const activityData = {
    labels: questionAnalytics?.recentActivity.map(item => format(new Date(item.date), 'MMM dd')) || [],
    datasets: [
      {
        label: 'Questions Created',
        data: questionAnalytics?.recentActivity.map(item => item.count) || [],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const statusData = {
    labels: questionAnalytics ? Object.keys(questionAnalytics.questionsByStatus) : [],
    datasets: [
      {
        data: questionAnalytics ? Object.values(questionAnalytics.questionsByStatus) : [],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your question bank performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.questions.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analyticsData?.questions.thisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.users.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {analyticsData?.users.total || 0} total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Activities</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.ai.activities || 0}</div>
            <p className="text-xs text-muted-foreground">
              AI-generated questions and enhancements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exports</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.exports.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              PDF and CSV exports generated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Question Creation Activity</CardTitle>
            <CardDescription>
              Questions created over the last {timeRange} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Line
              data={activityData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Questions by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Questions by Type</CardTitle>
            <CardDescription>Distribution of question types</CardDescription>
          </CardHeader>
          <CardContent>
            <Doughnut
              data={questionTypeData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Questions by Subject */}
        <Card>
          <CardHeader>
            <CardTitle>Questions by Subject</CardTitle>
            <CardDescription>Distribution across subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <Bar
              data={subjectData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Question Status */}
        <Card>
          <CardHeader>
            <CardTitle>Question Status</CardTitle>
            <CardDescription>Approval status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <Doughnut
              data={statusData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      {questionAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Average Marks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {questionAnalytics.averageMarks.toFixed(1)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questionAnalytics.totalUsage}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questionAnalytics.aiGeneratedCount}</div>
              <p className="text-xs text-muted-foreground">
                {((questionAnalytics.aiGeneratedCount / questionAnalytics.totalQuestions) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Approval Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questionAnalytics.approvalRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 