import 'package:isar/isar.dart';

part 'exam_result.g.dart';

@collection
class ExamResult {
  Id id = Isar.autoIncrement;

  late String subjectName;

  late int score;

  late int totalQuestions;

  late DateTime date;

  late int timeTakenSeconds;
}
