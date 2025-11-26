import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/data/isar_service.dart';
import '../../focus_mode/data/models/study_session.dart';

part 'analytics_repository.g.dart';

@Riverpod(keepAlive: true)
AnalyticsRepository analyticsRepository(AnalyticsRepositoryRef ref) {
  return AnalyticsRepository(ref.read(isarServiceProvider));
}

class AnalyticsRepository {
  final IsarService _isarService;

  AnalyticsRepository(this._isarService);

  Future<List<StudySession>> getSessionsForDateRange(DateTime start, DateTime end) {
    return _isarService.getSessionsByDateRange(start, end);
  }

  Future<Map<DateTime, int>> getDailyFocusTime(DateTime start, DateTime end) async {
    final sessions = await _isarService.getSessionsByDateRange(start, end);
    final Map<DateTime, int> dailyMap = {};

    for (var session in sessions) {
      if (session.phase == 'focus' && session.isCompleted) {
        final date = DateTime(session.startTime.year, session.startTime.month, session.startTime.day);
        dailyMap[date] = (dailyMap[date] ?? 0) + session.durationSeconds;
      }
    }
    return dailyMap;
  }

  Future<Map<DateTime, int>> getMonthlyFocusTime(DateTime start, DateTime end) async {
    final sessions = await _isarService.getSessionsByDateRange(start, end);
    final Map<DateTime, int> monthlyMap = {};

    for (var session in sessions) {
      if (session.phase == 'focus' && session.isCompleted) {
        final date = DateTime(session.startTime.year, session.startTime.month, 1);
        monthlyMap[date] = (monthlyMap[date] ?? 0) + session.durationSeconds;
      }
    }
    return monthlyMap;
  }

  Future<int> getTotalFocusTime(DateTime start, DateTime end) async {
    final sessions = await _isarService.getSessionsByDateRange(start, end);
    return sessions.fold<int>(0, (sum, session) {
      if (session.phase == 'focus' && session.isCompleted) {
        return sum + session.durationSeconds;
      }
      return sum;
    });
  }
  Future<void> deleteSession(int id) {
    return _isarService.deleteSession(id);
  }

  Future<void> updateSession(StudySession session) {
    return _isarService.updateSession(session);
  }
}
