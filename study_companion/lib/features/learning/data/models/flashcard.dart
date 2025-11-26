import 'package:isar/isar.dart';

part 'flashcard.g.dart';

@collection
class Flashcard {
  Id id = Isar.autoIncrement;

  late String question;

  late String answer;

  DateTime? nextReviewDate;

  int interval = 0; // Days

  double easeFactor = 2.5;

  int repetitions = 0;

  late DateTime createdAt;

  DateTime? updatedAt;
}
