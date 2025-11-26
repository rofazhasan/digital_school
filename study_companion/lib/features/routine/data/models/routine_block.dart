import 'package:isar/isar.dart';

part 'routine_block.g.dart';

enum BlockType {
  study,
  homework,
  revision,
  breakTime, // 'break' is a keyword
  personal,
  other
}

enum TaskDifficulty {
  easy,
  medium,
  hard,
  extreme
}

@collection
class RoutineBlock {
  Id id = Isar.autoIncrement;

  @Index()
  late DateTime date;

  late DateTime startTime;
  
  late int durationMinutes;

  String? title;
  
  @Enumerated(EnumType.name)
  late BlockType type;
  
  @Enumerated(EnumType.name)
  TaskDifficulty difficulty = TaskDifficulty.medium;

  bool isCompleted = false;
  
  String? subjectName; // Optional link to subject by name for now
  
  int? color; // Custom color override

  DateTime get endTime => startTime.add(Duration(minutes: durationMinutes));
}
