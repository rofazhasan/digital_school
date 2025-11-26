import 'dart:convert';
import '../../../ai_chat/data/datasources/ai_service.dart';
import '../models/quiz_question.dart';

class QuizService {
  final AIService _aiService;

  QuizService(this._aiService);

  Future<List<QuizQuestion>> generateQuiz(String content) async {
    final prompt = '''
You are a helpful AI tutor. Generate 5 multiple-choice questions (MCQs) based on the following text.
Return ONLY a valid JSON array of objects. Do not include any markdown formatting or extra text.
Each object must have:
- "question": The question string
- "options": An array of 4 strings
- "correctIndex": The integer index (0-3) of the correct answer
- "explanation": A brief explanation of why the answer is correct

Text:
$content

JSON:
''';

    try {
      final stream = _aiService.generateResponse(prompt);
      String fullResponse = '';
      await for (final chunk in stream) {
        fullResponse += chunk;
      }

      // Clean up response (sometimes models add markdown code blocks)
      fullResponse = fullResponse.replaceAll('```json', '').replaceAll('```', '').trim();
      
      // Find the first '[' and last ']' to extract JSON array
      final startIndex = fullResponse.indexOf('[');
      final endIndex = fullResponse.lastIndexOf(']');
      
      if (startIndex != -1 && endIndex != -1) {
        fullResponse = fullResponse.substring(startIndex, endIndex + 1);
      }

      final List<dynamic> jsonList = jsonDecode(fullResponse);
      return jsonList.map((e) => QuizQuestion.fromJson(e)).toList();
    } catch (e) {
      print('Error generating quiz: $e');
      // Fallback/Mock for testing if generation fails or model is dumb
      return [
        QuizQuestion(
          question: "Error generating quiz. What should you do?",
          options: ["Retry", "Check Model", "Cry", "All of the above"],
          correctIndex: 3,
          explanation: "AI generation can be flaky. Check logs.",
        )
      ];
    }
  }
    Future<List<QuizQuestion>> generateExam(String subject, int count) async {
    final prompt = '''
You are a strict examiner. Generate $count multiple-choice questions (MCQs) for a University-level exam on the subject: "$subject".
Return ONLY a valid JSON array of objects. Do not include any markdown formatting or extra text.
Each object must have:
- "question": The question string
- "options": An array of 4 strings
- "correctIndex": The integer index (0-3) of the correct answer
- "explanation": A brief explanation of why the answer is correct

JSON:
''';

    try {
      final stream = _aiService.generateResponse(prompt);
      String fullResponse = '';
      await for (final chunk in stream) {
        fullResponse += chunk;
      }

      fullResponse = fullResponse.replaceAll('```json', '').replaceAll('```', '').trim();
      
      final startIndex = fullResponse.indexOf('[');
      final endIndex = fullResponse.lastIndexOf(']');
      
      if (startIndex != -1 && endIndex != -1) {
        fullResponse = fullResponse.substring(startIndex, endIndex + 1);
      }

      final List<dynamic> jsonList = jsonDecode(fullResponse);
      return jsonList.map((e) => QuizQuestion.fromJson(e)).toList();
    } catch (e) {
      print('Error generating exam: $e');
      return [];
    }
  }
}

