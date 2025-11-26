import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../features/focus_mode/data/models/study_session.dart';
import '../../features/learning/data/models/note.dart';
import '../../features/learning/data/models/flashcard.dart';
import '../../features/focus_mode/data/models/routine.dart';
import '../../features/ai_chat/data/models/chat_message.dart';
import '../../features/learning/data/models/subject.dart';
import '../../features/learning/data/models/chapter.dart';
import '../../features/learning/data/models/exam_result.dart';

import '../../features/routine/data/models/routine_block.dart';
import '../../features/routine/data/models/daily_routine.dart';
import '../../features/routine/data/models/habit.dart';
import '../../features/routine/data/models/mission.dart';

part 'isar_service.g.dart';

@Riverpod(keepAlive: true)
IsarService isarService(IsarServiceRef ref) {
  throw UnimplementedError('IsarService must be initialized via override');
}

class IsarService {
  late final Isar _isar;
  Isar get db => _isar;

  Future<void> init() async {
    final dir = await getApplicationDocumentsDirectory();
    _isar = await Isar.open(
      [
        StudySessionSchema, 
        NoteSchema, 
        FlashcardSchema, 
        RoutineSchema, 
        ChatMessageSchema, 
        SubjectSchema, 
        ChapterSchema, 
        ExamResultSchema, 
        RoutineBlockSchema, 
        DailyRoutineSchema,
        HabitSchema,
        DailyMissionSchema,
      ],
      directory: dir.path,
    );
  }

  Future<void> saveSession(StudySession session) async {
    await _isar.writeTxn(() async {
      await _isar.studySessions.put(session);
    });
  }

  Future<List<StudySession>> getSessions() async {
    return await _isar.studySessions.where().findAll();
  }

  Future<void> deleteSession(int id) async {
    await _isar.writeTxn(() async {
      await _isar.studySessions.delete(id);
    });
  }

  Future<void> updateSession(StudySession session) async {
    await _isar.writeTxn(() async {
      await _isar.studySessions.put(session);
    });
  }

  // Notes
  Future<void> saveNote(Note note) async {
    await _isar.writeTxn(() async {
      await _isar.notes.put(note);
    });
  }

  Future<List<Note>> getNotes() async {
    return await _isar.notes.where().sortByCreatedAtDesc().findAll();
  }

  Future<void> deleteNote(int id) async {
    await _isar.writeTxn(() async {
      await _isar.notes.delete(id);
    });
  }

  // Flashcards
  Future<void> saveFlashcard(Flashcard flashcard) async {
    await _isar.writeTxn(() async {
      await _isar.flashcards.put(flashcard);
    });
  }

  Future<List<Flashcard>> getFlashcards() async {
    return await _isar.flashcards.where().sortByCreatedAtDesc().findAll();
  }

  Future<void> deleteFlashcard(int id) async {
    await _isar.writeTxn(() async {
      await _isar.flashcards.delete(id);
    });
  }

  Future<List<Flashcard>> getDueFlashcards() async {
    final now = DateTime.now();
    return await _isar.flashcards
        .filter()
        .nextReviewDateIsNull()
        .or()
        .nextReviewDateLessThan(now)
        .findAll();
  }

  Future<void> updateFlashcard(Flashcard card) async {
    await _isar.writeTxn(() async {
      await _isar.flashcards.put(card);
    });
  }

  // Routines
  Future<void> saveRoutine(Routine routine) async {
    await _isar.writeTxn(() async {
      await _isar.routines.put(routine);
    });
  }

  Future<List<Routine>> getRoutines() async {
    return await _isar.routines.where().findAll();
  }

  Future<void> deleteRoutine(int id) async {
    await _isar.writeTxn(() async {
      await _isar.routines.delete(id);
    });
  }

  // Analytics
  Future<int> getTotalFocusTime() async {
    final sessions = await _isar.studySessions
        .filter()
        .phaseEqualTo('focus')
        .and()
        .isCompletedEqualTo(true)
        .findAll();
    
    return sessions.fold<int>(0, (sum, session) => sum + session.durationSeconds);
  }

  Future<int> getTodayFocusTime() async {
    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);
    
    final sessions = await _isar.studySessions
        .filter()
        .phaseEqualTo('focus')
        .and()
        .isCompletedEqualTo(true)
        .and()
        .startTimeGreaterThan(startOfDay)
        .findAll();

    return sessions.fold<int>(0, (sum, session) => sum + session.durationSeconds);
  }

  Future<int> getSessionCount() async {
    return await _isar.studySessions
        .filter()
        .phaseEqualTo('focus')
        .and()
        .isCompletedEqualTo(true)
        .count();
  }

  Future<List<StudySession>> getSessionsByDateRange(DateTime start, DateTime end) async {
    return await _isar.studySessions
        .filter()
        .startTimeBetween(start, end)
        .sortByStartTimeDesc()
        .findAll();
  }

  Future<StudySession?> getLastSession() async {
    return await _isar.studySessions
        .where()
        .sortByStartTimeDesc()
        .findFirst();
  }

  // Chat
  Future<void> saveMessage(ChatMessage message) async {
    await _isar.writeTxn(() async {
      await _isar.chatMessages.put(message);
    });
  }

  Future<List<ChatMessage>> getMessages() async {
    return await _isar.chatMessages.where().sortByTimestamp().findAll();
  }

  Future<void> clearChat() async {
    await _isar.writeTxn(() async {
      await _isar.chatMessages.clear();
    });
  }

  // Subjects
  Future<void> saveSubject(Subject subject) async {
    await _isar.writeTxn(() async {
      await _isar.subjects.put(subject);
    });
  }

  Future<List<Subject>> getSubjects() async {
    return await _isar.subjects.where().findAll();
  }

  Future<void> deleteSubject(int id) async {
    await _isar.writeTxn(() async {
      await _isar.subjects.delete(id);
      // Optional: Delete associated chapters
      await _isar.chapters.filter().subject((q) => q.idEqualTo(id)).deleteAll();
    });
  }

  // Chapters
  Future<void> saveChapter(Chapter chapter) async {
    await _isar.writeTxn(() async {
      await _isar.chapters.put(chapter);
      await chapter.subject.save(); // Save the link
    });
  }

  Future<List<Chapter>> getChaptersForSubject(int subjectId) async {
    return await _isar.chapters
        .filter()
        .subject((q) => q.idEqualTo(subjectId))
        .findAll();
  }

  Future<void> deleteChapter(int id) async {
    await _isar.writeTxn(() async {
      await _isar.chapters.delete(id);
    });
  }

  // Exam Results
  Future<void> saveExamResult(ExamResult result) async {
    await _isar.writeTxn(() async {
      await _isar.examResults.put(result);
    });
  }

  Future<List<ExamResult>> getExamResults() async {
    return await _isar.examResults.where().sortByDateDesc().findAll();
  }
}
