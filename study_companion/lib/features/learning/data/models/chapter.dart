import 'package:isar/isar.dart';
import 'subject.dart';

part 'chapter.g.dart';

@collection
class Chapter {
  Id id = Isar.autoIncrement;

  late String name;

  bool isCompleted = false;

  final subject = IsarLink<Subject>();
}
