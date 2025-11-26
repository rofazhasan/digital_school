import 'package:isar/isar.dart';

part 'study_session.g.dart';

@collection
class StudySession {
  Id id = Isar.autoIncrement;

  late DateTime startTime;
  
  DateTime? endTime;

  late int durationSeconds;

  @Enumerated(EnumType.name)
  late String phase; // 'focus', 'shortBreak', 'longBreak'

  late bool isCompleted;

  String? focusIntent;

  String? breakIntent;

  bool isDeepFocus = false;

  int? targetDuration;

  StudySession copyWith({
    Id? id,
    DateTime? startTime,
    DateTime? endTime,
    int? durationSeconds,
    String? phase,
    bool? isCompleted,
    String? focusIntent,
    String? breakIntent,
    bool? isDeepFocus,
    int? targetDuration,
  }) {
    return StudySession()
      ..id = id ?? this.id
      ..startTime = startTime ?? this.startTime
      ..endTime = endTime ?? this.endTime
      ..durationSeconds = durationSeconds ?? this.durationSeconds
      ..phase = phase ?? this.phase
      ..isCompleted = isCompleted ?? this.isCompleted
      ..focusIntent = focusIntent ?? this.focusIntent
      ..breakIntent = breakIntent ?? this.breakIntent
      ..isDeepFocus = isDeepFocus ?? this.isDeepFocus
      ..targetDuration = targetDuration ?? this.targetDuration;
  }
}
