import '../../../ai_chat/data/datasources/ai_service.dart';

class SummaryService {
  final AIService _aiService;

  SummaryService(this._aiService);

  Stream<String> generateSummary(String content) {
    final prompt = '''
You are a helpful AI study assistant. Summarize the following text into concise bullet points.
Capture the main ideas and key details. Do not lose important information.

Text:
$content

Summary:
''';

    return _aiService.generateResponse(prompt);
  }
}
