import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/data/isar_service.dart';
import '../models/mission.dart';

part 'mission_repository.g.dart';

@Riverpod(keepAlive: true)
MissionRepository missionRepository(MissionRepositoryRef ref) {
  final isarService = ref.watch(isarServiceProvider);
  return MissionRepository(isarService);
}

class MissionRepository {
  final IsarService _isarService;

  MissionRepository(this._isarService);

  Future<DailyMission?> getMissionForDate(DateTime date) async {
    final startOfDay = DateTime(date.year, date.month, date.day);
    return await _isarService.db.dailyMissions
        .filter()
        .dateEqualTo(startOfDay)
        .findFirst();
  }

  Future<void> saveMission(DailyMission mission) async {
    await _isarService.db.writeTxn(() async {
      await _isarService.db.dailyMissions.put(mission);
    });
  }

  Future<void> createDefaultMission(DateTime date) async {
    final startOfDay = DateTime(date.year, date.month, date.day);
    final mission = DailyMission()
      ..date = startOfDay
      ..items = [
        MissionItem()..title = 'Complete 3 Study Blocks'..xpReward = 50,
        MissionItem()..title = 'Read for 30 minutes'..xpReward = 30,
        MissionItem()..title = 'Review Flashcards'..xpReward = 20,
      ];
    await saveMission(mission);
  }
}
