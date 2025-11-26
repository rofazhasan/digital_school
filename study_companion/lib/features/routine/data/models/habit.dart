import 'package:isar/isar.dart';

part 'habit.g.dart';

@collection
class Habit {
  Id id = Isar.autoIncrement;

  late String title;
  
  String? cue;
  String? routine;
  String? reward;

  int currentStreak = 0;
  int bestStreak = 0;

  DateTime? lastCompletedDate;

  @Enumerated(EnumType.name)
  HabitFrequency frequency = HabitFrequency.daily;

  // For specific days (1 = Monday, 7 = Sunday)
  List<int>? specificDays; 

  bool get isCompletedToday {
    if (lastCompletedDate == null) return false;
    final now = DateTime.now();
    return lastCompletedDate!.year == now.year &&
           lastCompletedDate!.month == now.month &&
           lastCompletedDate!.day == now.day;
  }
}

enum HabitFrequency {
  daily,
  weekly,
  specificDays
}
