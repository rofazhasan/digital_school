import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../ai_chat/presentation/providers/chat_provider.dart';
import '../../data/datasources/summary_service.dart';

part 'summary_provider.g.dart';

@riverpod
class SummaryNotifier extends _$SummaryNotifier {
  @override
  Stream<String> build() {
    return const Stream.empty();
  }

  Future<void> generateSummary(String content) async {
    final aiService = ref.read(aiServiceProvider);
    final summaryService = SummaryService(aiService);
    
    state = const AsyncValue.loading();
    
    var fullText = '';
    final stream = summaryService.generateSummary(content);
    
    await for (final chunk in stream) {
      fullText += chunk;
      state = AsyncValue.data(fullText);
    }
  }
}
