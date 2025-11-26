import 'package:isar/isar.dart';

part 'mission.g.dart';

@collection
class DailyMission {
  Id id = Isar.autoIncrement;

  @Index(unique: true)
  late DateTime date;

  List<MissionItem> items = [];

  bool get isAllCompleted => items.every((item) => item.isCompleted);
  
  int get completionPercentage {
    if (items.isEmpty) return 0;
    final completed = items.where((item) => item.isCompleted).length;
    return ((completed / items.length) * 100).round();
  }
}

@embedded
class MissionItem {
  late String title;
  bool isCompleted = false;
  int xpReward = 10;
}
