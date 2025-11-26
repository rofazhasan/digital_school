import 'package:flutter/material.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../data/analytics_repository.dart';
import '../../../ai_chat/presentation/providers/chat_provider.dart';
import '../../../focus_mode/data/models/study_session.dart';

part 'analytics_provider.g.dart';

enum AnalyticsFilter { day, week, month, year, custom }

@riverpod
class AnalyticsNotifier extends _$AnalyticsNotifier {
  AnalyticsFilter _filter = AnalyticsFilter.week;
  DateTimeRange? _customRange;

  @override
  Future<Map<String, dynamic>> build() async {
    return _fetchData();
  }

  void setFilter(AnalyticsFilter filter, {DateTimeRange? customRange}) {
    _filter = filter;
    _customRange = customRange;
    ref.invalidateSelf();
  }

  Future<Map<String, dynamic>> _fetchData() async {
    final repository = ref.read(analyticsRepositoryProvider);
    final now = DateTime.now();
    
    DateTime start;
    DateTime end;

    switch (_filter) {
      case AnalyticsFilter.day:
        start = DateTime(now.year, now.month, now.day);
        end = start.add(const Duration(days: 1));
        break;
      case AnalyticsFilter.week:
        start = now.subtract(Duration(days: now.weekday - 1));
        start = DateTime(start.year, start.month, start.day);
        end = start.add(const Duration(days: 7));
        break;
      case AnalyticsFilter.month:
        start = DateTime(now.year, now.month, 1);
        end = DateTime(now.year, now.month + 1, 1);
        break;
      case AnalyticsFilter.year:
        start = DateTime(now.year, 1, 1);
        end = DateTime(now.year + 1, 1, 1);
        break;
      case AnalyticsFilter.custom:
        start = _customRange?.start ?? now;
        final rawEnd = _customRange?.end ?? now;
        end = DateTime(rawEnd.year, rawEnd.month, rawEnd.day, 23, 59, 59);
        break;
    }

    Map<DateTime, int> dailyFocus;
    if (_filter == AnalyticsFilter.year) {
      dailyFocus = await repository.getMonthlyFocusTime(start, end);
    } else {
      dailyFocus = await repository.getDailyFocusTime(start, end);
    }
    final totalFocusPeriod = await repository.getTotalFocusTime(start, end);
    
    // Always fetch today's focus for the summary card
    final todayStart = DateTime(now.year, now.month, now.day);
    final totalFocusToday = await repository.getTotalFocusTime(
      todayStart,
      todayStart.add(const Duration(days: 1)),
    );
    
    final sessions = await repository.getSessionsForDateRange(start, end);

    return {
      'dailyFocus': dailyFocus,
      'totalFocusPeriod': totalFocusPeriod,
      'totalFocusToday': totalFocusToday,
      'sessions': sessions,
      'filter': _filter,
      'start': start,
      'end': end,
    };
  }

  Future<void> deleteSession(int id) async {
    final repository = ref.read(analyticsRepositoryProvider);
    await repository.deleteSession(id);
    ref.invalidateSelf();
  }

  Future<void> updateSession(StudySession session) async {
    final repository = ref.read(analyticsRepositoryProvider);
    await repository.updateSession(session);
    ref.invalidateSelf();
  }
}

@riverpod
class AIInsightNotifier extends _$AIInsightNotifier {
  @override
  Future<String> build() async {
    return "Analyzing your study habits...";
  }

  Future<void> generateInsight(Map<String, dynamic> stats) async {
    state = const AsyncValue.loading();
    
    final aiService = ref.read(aiServiceProvider);
    
    // Extract stats
    final totalToday = stats['totalFocusToday'] as int? ?? 0;
    final totalPeriod = stats['totalFocusPeriod'] as int? ?? 0;
    final sessions = stats['sessions'] as List? ?? [];
    final filter = stats['filter'] as AnalyticsFilter? ?? AnalyticsFilter.week;
    
    // Format time nicely
    final todayHours = (totalToday / 3600).toStringAsFixed(1);
    final periodHours = (totalPeriod / 3600).toStringAsFixed(1);
    final sessionCount = sessions.length;
    
    // Determine period name
    String periodName = 'this week';
    switch (filter) {
      case AnalyticsFilter.day:
        periodName = 'today';
        break;
      case AnalyticsFilter.week:
        periodName = 'this week';
        break;
      case AnalyticsFilter.month:
        periodName = 'this month';
        break;
      case AnalyticsFilter.year:
        periodName = 'this year';
        break;
      case AnalyticsFilter.custom:
        periodName = 'in this period';
        break;
    }
    
    // Optimized prompt for TinyLlama
    final prompt = """
You are a supportive study coach. Analyze this student's study data and give ONE encouraging insight.

Study Stats:
- Today: $todayHours hours
- Total $periodName: $periodHours hours  
- Sessions completed: $sessionCount

Provide a brief, encouraging message (2-3 sentences max). Focus on:
1. Acknowledge their effort
2. Give ONE specific tip to improve

Be friendly and motivating. Keep it short and actionable.""";
        
    try {
      final stream = aiService.generateResponse(prompt);
      String insight = "";
      await for (final chunk in stream) {
        insight += chunk;
      }
      
      // Clean up response (remove any markdown or extra formatting)
      insight = insight.trim();
      if (insight.isEmpty) {
        insight = "Great work on your study sessions! Keep up the consistent effort and you'll see amazing results.";
      }
      
      state = AsyncValue.data(insight);
    } catch (e) {
      // Fallback message if AI fails
      state = AsyncValue.data(
        "You've completed $sessionCount study sessions $periodName! "
        "Keep building this habit and your focus will continue to improve."
      );
    }
  }
}
