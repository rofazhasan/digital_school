import 'package:isar/isar.dart';

part 'routine.g.dart';

@collection
class Routine {
  Id id = Isar.autoIncrement;

  late String name;

  late int startTimeHour;

  late int startTimeMinute;

  late int durationMinutes;

  late List<int> daysOfWeek; // 1 = Monday, 7 = Sunday

  late bool isEnabled;
}
