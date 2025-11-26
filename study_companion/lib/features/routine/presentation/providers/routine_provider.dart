import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../data/models/routine_block.dart';
import '../../data/repositories/routine_repository.dart';

part 'routine_provider.g.dart';

@riverpod
class SelectedDate extends _$SelectedDate {
  @override
  DateTime build() {
    return DateTime.now();
  }

  void setDate(DateTime date) {
    state = date;
  }
}

@riverpod
class DailyRoutineBlocks extends _$DailyRoutineBlocks {
  @override
  Future<List<RoutineBlock>> build() async {
    final date = ref.watch(selectedDateProvider);
    final repository = ref.watch(routineRepositoryProvider);
    return repository.getBlocksForDate(date);
  }

  Future<void> addBlock(RoutineBlock block) async {
    final repository = ref.read(routineRepositoryProvider);
    await repository.addBlock(block);
    ref.invalidateSelf();
  }

  Future<void> updateBlock(RoutineBlock block) async {
    final repository = ref.read(routineRepositoryProvider);
    await repository.updateBlock(block);
    ref.invalidateSelf();
  }

  Future<void> deleteBlock(int id) async {
    final repository = ref.read(routineRepositoryProvider);
    await repository.deleteBlock(id);
    ref.invalidateSelf();
    // Recalculate score after deletion
    final date = ref.read(selectedDateProvider);
    await repository.calculateDailyScore(date);
    ref.invalidate(dailyRoutineProvider);
  }

  Future<void> toggleCompletion(int id) async {
    final repository = ref.read(routineRepositoryProvider);
    await repository.toggleBlockCompletion(id);
    ref.invalidateSelf();
    ref.invalidate(dailyRoutineProvider);
  }
}

@riverpod
Future<DailyRoutine?> dailyRoutine(DailyRoutineRef ref) async {
  final date = ref.watch(selectedDateProvider);
  final repository = ref.watch(routineRepositoryProvider);
  return repository.getDailyRoutine(date);
}
