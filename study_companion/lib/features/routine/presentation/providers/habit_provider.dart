import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../data/models/habit.dart';
import '../../data/repositories/habit_repository.dart';

part 'habit_provider.g.dart';

@riverpod
class Habits extends _$Habits {
  @override
  Future<List<Habit>> build() async {
    return _fetchHabits();
  }

  Future<List<Habit>> _fetchHabits() async {
    final repository = ref.read(habitRepositoryProvider);
    return await repository.getAllHabits();
  }

  Future<void> addHabit(Habit habit) async {
    final repository = ref.read(habitRepositoryProvider);
    await repository.addHabit(habit);
    ref.invalidateSelf();
  }

  Future<void> updateHabit(Habit habit) async {
    final repository = ref.read(habitRepositoryProvider);
    await repository.updateHabit(habit);
    ref.invalidateSelf();
  }

  Future<void> deleteHabit(int id) async {
    final repository = ref.read(habitRepositoryProvider);
    await repository.deleteHabit(id);
    ref.invalidateSelf();
  }

  Future<void> toggleCompletion(int id) async {
    final repository = ref.read(habitRepositoryProvider);
    await repository.toggleHabitCompletion(id, DateTime.now());
    ref.invalidateSelf();
  }
}
