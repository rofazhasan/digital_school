import 'dart:convert';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/data/isar_service.dart';
import '../../../ai_chat/presentation/providers/chat_provider.dart';
import '../../data/models/routine_block.dart';
import '../../data/repositories/routine_repository.dart';
import '../providers/routine_provider.dart';

part 'routine_ai_provider.g.dart';

@riverpod
class RoutineAI extends _$RoutineAI {
  @override
  FutureOr<void> build() {}

  Future<void> generateSchedule({
    required List<String> subjects,
    required String mood,
    required DateTime date,
    required int totalHours,
  }) async {
    state = const AsyncValue.loading();

    try {
      final aiService = ref.read(aiServiceProvider);
      final repository = ref.read(routineRepositoryProvider);

      // Construct Prompt
      final prompt = '''
You are a study planner. Create a daily schedule for a student.
Date: ${date.toIso8601String().split('T')[0]}
Subjects to study: ${subjects.join(', ')}
Student Mood: $mood
Total Study Time: $totalHours hours
Start Time: 09:00 AM

Rules:
1. Mix study blocks with short breaks.
2. If mood is 'Tired', use shorter study blocks (25m) and more breaks.
3. If mood is 'Energetic', use longer study blocks (50m).
4. Output ONLY a JSON list of blocks. No other text.
5. Format: [{"title": "Math", "type": "study", "duration": 60, "start": "09:00"}, ...]
Types: study, homework, revision, breakTime, personal.
''';

      // Generate Response
      String fullResponse = "";
      final stream = aiService.generateResponse(prompt);
      await for (final chunk in stream) {
        fullResponse += chunk;
      }

      // Parse Response (Basic cleanup to find JSON array)
      final jsonStart = fullResponse.indexOf('[');
      final jsonEnd = fullResponse.lastIndexOf(']');
      
      if (jsonStart != -1 && jsonEnd != -1) {
        final jsonStr = fullResponse.substring(jsonStart, jsonEnd + 1);
        final List<dynamic> data = jsonDecode(jsonStr);

        // Clear existing blocks for the day (optional, maybe ask user?)
        // For now, we append or just add. Let's assume we want to fill the day.
        // But to avoid duplicates if re-running, maybe we should clear?
        // Let's just add them.
        
        for (final item in data) {
          final startTimeStr = item['start'] as String;
          final parts = startTimeStr.split(':');
          final hour = int.parse(parts[0]);
          final minute = int.parse(parts[1]);
          
          final startTime = DateTime(
            date.year,
            date.month,
            date.day,
            hour,
            minute,
          );

          final block = RoutineBlock()
            ..date = date
            ..title = item['title']
            ..type = _parseType(item['type'])
            ..durationMinutes = item['duration']
            ..startTime = startTime
            ..difficulty = TaskDifficulty.medium; // Default

          await repository.addBlock(block);
        }
        
        // Refresh the UI
        ref.invalidate(dailyRoutineBlocksProvider);
      } else {
        throw Exception("Failed to generate valid schedule format");
      }

      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  BlockType _parseType(String type) {
    switch (type.toLowerCase()) {
      case 'study': return BlockType.study;
      case 'homework': return BlockType.homework;
      case 'revision': return BlockType.revision;
      case 'breaktime': 
      case 'break': return BlockType.breakTime;
      case 'personal': return BlockType.personal;
      default: return BlockType.other;
    }
  }
}
