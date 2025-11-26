import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/data/isar_service.dart';
import '../models/routine_block.dart';
import '../models/daily_routine.dart';

part 'routine_repository.g.dart';

@Riverpod(keepAlive: true)
RoutineRepository routineRepository(RoutineRepositoryRef ref) {
  final isarService = ref.watch(isarServiceProvider);
  // We need to access the underlying Isar instance. 
  // Since IsarService wraps it, we might need to expose it or add methods to IsarService.
  // For now, let's assume we can add methods to IsarService or access _isar if we make it public.
  // Actually, IsarService is the abstraction. We should add methods there or make _isar public.
  // Let's check IsarService again. It has `late final Isar _isar`.
  // We can't access it directly.
  // We should probably add `getRoutineBlocks` to IsarService or make `isar` getter public.
  // Let's assume we'll update IsarService to expose `isar` getter.
  return RoutineRepository(isarService);
}

class RoutineRepository {
  final IsarService _isarService;

  RoutineRepository(this._isarService);

  Future<List<RoutineBlock>> getBlocksForDate(DateTime date) async {
    // Normalize date to midnight
    final startOfDay = DateTime(date.year, date.month, date.day);
    
    return await _isarService.db.routineBlocks
        .filter()
        .dateEqualTo(startOfDay)
        .sortByStartTime()
        .findAll();
  }

  Future<void> addBlock(RoutineBlock block) async {
    await _isarService.db.writeTxn(() async {
      await _isarService.db.routineBlocks.put(block);
    });
  }

  Future<void> updateBlock(RoutineBlock block) async {
    await _isarService.db.writeTxn(() async {
      await _isarService.db.routineBlocks.put(block);
    });
  }

  Future<void> deleteBlock(Id id) async {
    await _isarService.db.writeTxn(() async {
      await _isarService.db.routineBlocks.delete(id);
    });
  }

  Future<DailyRoutine?> getDailyRoutine(DateTime date) async {
    final startOfDay = DateTime(date.year, date.month, date.day);
    return await _isarService.db.dailyRoutines
        .filter()
        .dateEqualTo(startOfDay)
        .findFirst();
  }
  
  Future<void> saveDailyRoutine(DailyRoutine routine) async {
    await _isarService.db.writeTxn(() async {
      await _isarService.db.dailyRoutines.put(routine);
    });
  }

  Future<void> toggleBlockCompletion(Id id) async {
    final block = await _isarService.db.routineBlocks.get(id);
    if (block != null) {
      block.isCompleted = !block.isCompleted;
      await updateBlock(block);
      await calculateDailyScore(block.date);
    }
  }

  Future<void> setBlockCompletion(Id id, bool isCompleted) async {
    final block = await _isarService.db.routineBlocks.get(id);
    if (block != null) {
      if (block.isCompleted != isCompleted) {
        block.isCompleted = isCompleted;
        await updateBlock(block);
        await calculateDailyScore(block.date);
      }
    }
  }

  Future<void> calculateDailyScore(DateTime date) async {
    final blocks = await getBlocksForDate(date);
    if (blocks.isEmpty) return;

    final completedCount = blocks.where((b) => b.isCompleted).length;
    final score = (completedCount / blocks.length * 100).round();

    var dailyRoutine = await getDailyRoutine(date);
    if (dailyRoutine == null) {
      final startOfDay = DateTime(date.year, date.month, date.day);
      dailyRoutine = DailyRoutine()..date = startOfDay;
    }

    dailyRoutine.healthScore = score;
    await saveDailyRoutine(dailyRoutine);
  }
}
