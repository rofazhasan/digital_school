import 'package:isar/isar.dart';

part 'daily_routine.g.dart';

enum DailyMood {
  energetic,
  normal,
  tired,
  stressed,
  motivated
}

@collection
class DailyRoutine {
  Id id = Isar.autoIncrement;

  @Index(unique: true)
  late DateTime date; // Normalized to midnight

  // @enumerated(EnumType.name)
  // DailyMood? mood;

  int? healthScore; // 0-100

  String? aiSummary; // Morning briefing or evening reflection
  
  bool isDayStarted = false;
  bool isDayCompleted = false;
}
