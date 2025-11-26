import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/data/isar_service.dart';
import '../../../ai_chat/presentation/providers/chat_provider.dart';
import '../../data/datasources/quiz_service.dart';
import '../../data/models/quiz_question.dart';
import '../../../ai_chat/presentation/providers/chat_provider.dart';
import '../../data/datasources/quiz_service.dart';
import '../../data/models/quiz_question.dart';

part 'quiz_provider.g.dart';

@riverpod
class QuizNotifier extends _$QuizNotifier {
  @override
  Future<List<QuizQuestion>> build() async {
    return []; // Initial empty state
  }

  Future<void> generateQuiz(String topic) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final aiService = ref.read(aiServiceProvider);
      final quizService = QuizService(aiService);
      return quizService.generateQuiz(topic);
    });
  }
}
