import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/data/isar_service.dart';
import '../../../../core/data/isar_service.dart';

part 'analytics_provider.g.dart';

class AnalyticsState {
  final int totalFocusTime;
  final int todayFocusTime;
  final int sessionCount;

  AnalyticsState({
    required this.totalFocusTime,
    required this.todayFocusTime,
    required this.sessionCount,
  });
}

@riverpod
class AnalyticsNotifier extends _$AnalyticsNotifier {
  @override
  Future<AnalyticsState> build() async {
    final isar = ref.read(isarServiceProvider);
    
    final totalTime = await isar.getTotalFocusTime();
    final todayTime = await isar.getTodayFocusTime();
    final count = await isar.getSessionCount();

    return AnalyticsState(
      totalFocusTime: totalTime,
      todayFocusTime: todayTime,
      sessionCount: count,
    );
  }
}
