import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../data/models/mission.dart';
import '../../data/repositories/mission_repository.dart';

part 'mission_provider.g.dart';

@riverpod
class DailyMissionController extends _$DailyMissionController {
  @override
  Future<DailyMission?> build(DateTime date) async {
    return _fetchMission(date);
  }

  Future<DailyMission?> _fetchMission(DateTime date) async {
    final repository = ref.read(missionRepositoryProvider);
    var mission = await repository.getMissionForDate(date);
    
    if (mission == null) {
      // Auto-create default mission for today if it doesn't exist
      // In a real app, this might be triggered by a "Start Day" action or background job
      // For now, we lazy create it when viewed
      await repository.createDefaultMission(date);
      mission = await repository.getMissionForDate(date);
    }
    
    return mission;
  }

  Future<void> toggleItem(int index) async {
    final mission = state.value;
    if (mission == null) return;

    // Create a new list to trigger updates (Isar embedded objects need care)
    final newItems = List<MissionItem>.from(mission.items);
    final item = newItems[index];
    
    // Toggle
    item.isCompleted = !item.isCompleted;
    newItems[index] = item; // Update list

    mission.items = newItems;
    
    final repository = ref.read(missionRepositoryProvider);
    await repository.saveMission(mission);
    
    ref.invalidateSelf();
  }
}
