import 'package:isar/isar.dart';

part 'note.g.dart';

@collection
class Note {
  Id id = Isar.autoIncrement;

  late String title;

  late String content;

  late DateTime createdAt;

  late DateTime updatedAt;

  List<double>? embedding;
}
