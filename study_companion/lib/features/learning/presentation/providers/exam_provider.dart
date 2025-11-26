import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/data/isar_service.dart';
import '../../../ai_chat/presentation/providers/chat_provider.dart';
import '../../data/datasources/quiz_service.dart';
import '../../data/models/exam_result.dart';
import '../../data/models/quiz_question.dart';

part 'exam_provider.g.dart';

@riverpod
class ExamNotifier extends _$ExamNotifier {
  @override
  Future<List<QuizQuestion>> build() async {
    return [];
  }

  Future<void> generateExam(String subject, int count) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final aiService = ref.read(aiServiceProvider);
      final quizService = QuizService(aiService);
      return quizService.generateExam(subject, count);
    });
  }

  Future<void> saveResult(String subject, int score, int total, int timeTaken) async {
    final result = ExamResult()
      ..subjectName = subject
      ..score = score
      ..totalQuestions = total
      ..date = DateTime.now()
      ..timeTakenSeconds = timeTaken;
    
    await ref.read(isarServiceProvider).saveExamResult(result);
  }
}
