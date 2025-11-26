import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/data/isar_service.dart';
import '../models/habit.dart';

part 'habit_repository.g.dart';

@Riverpod(keepAlive: true)
HabitRepository habitRepository(HabitRepositoryRef ref) {
  final isarService = ref.watch(isarServiceProvider);
  return HabitRepository(isarService);
}

class HabitRepository {
  final IsarService _isarService;

  HabitRepository(this._isarService);

  Future<List<Habit>> getAllHabits() async {
    return await _isarService.db.habits.where().findAll();
  }

  Future<void> addHabit(Habit habit) async {
    await _isarService.db.writeTxn(() async {
      await _isarService.db.habits.put(habit);
    });
  }

  Future<void> updateHabit(Habit habit) async {
    await _isarService.db.writeTxn(() async {
      await _isarService.db.habits.put(habit);
    });
  }

  Future<void> deleteHabit(int id) async {
    await _isarService.db.writeTxn(() async {
      await _isarService.db.habits.delete(id);
    });
  }

  Future<void> toggleHabitCompletion(int habitId, DateTime date) async {
    await _isarService.db.writeTxn(() async {
      final habit = await _isarService.db.habits.get(habitId);
      if (habit != null) {
        final isCompletedToday = habit.isCompletedToday;
        
        if (isCompletedToday) {
          // Undo completion (simplified: just remove date if it matches today)
          // Note: This logic is imperfect for streaks if we don't store history.
          // For MVP, we'll just allow unchecking and decrement streak if > 0
          if (habit.currentStreak > 0) {
            habit.currentStreak--;
          }
          habit.lastCompletedDate = null; // Or previous date if we tracked it
        } else {
          // Complete
          habit.lastCompletedDate = date;
          habit.currentStreak++;
          if (habit.currentStreak > habit.bestStreak) {
            habit.bestStreak = habit.currentStreak;
          }
        }
        await _isarService.db.habits.put(habit);
      }
    });
  }
}
