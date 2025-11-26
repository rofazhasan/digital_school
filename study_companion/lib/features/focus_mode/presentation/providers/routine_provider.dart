import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/data/isar_service.dart';
import '../../../../core/data/isar_service.dart';
import '../../data/models/routine.dart';

part 'routine_provider.g.dart';

@riverpod
class RoutineNotifier extends _$RoutineNotifier {
  @override
  Future<List<Routine>> build() async {
    return ref.read(isarServiceProvider).getRoutines();
  }

  Future<void> addRoutine({
    required String name,
    required int startTimeHour,
    required int startTimeMinute,
    required int durationMinutes,
    required List<int> daysOfWeek,
  }) async {
    final routine = Routine()
      ..name = name
      ..startTimeHour = startTimeHour
      ..startTimeMinute = startTimeMinute
      ..durationMinutes = durationMinutes
      ..daysOfWeek = daysOfWeek
      ..isEnabled = true;
    
    await ref.read(isarServiceProvider).saveRoutine(routine);
    
    // Refresh
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(isarServiceProvider).getRoutines());
  }

  Future<void> toggleRoutine(Routine routine) async {
    routine.isEnabled = !routine.isEnabled;
    await ref.read(isarServiceProvider).saveRoutine(routine);
    
    // Refresh
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(isarServiceProvider).getRoutines());
  }

  Future<void> deleteRoutine(int id) async {
    await ref.read(isarServiceProvider).deleteRoutine(id);
    
    // Refresh
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(isarServiceProvider).getRoutines());
  }
}
