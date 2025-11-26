import 'package:isar/isar.dart';

part 'subject.g.dart';

@collection
class Subject {
  Id id = Isar.autoIncrement;

  late String name;

  late int colorValue; // 0xFF...

  late int iconCode; // IconData.codePoint
}
