import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/data/isar_service.dart';

import '../../data/models/subject.dart';
import '../../data/models/chapter.dart';

part 'subjects_provider.g.dart';

@riverpod
class SubjectsNotifier extends _$SubjectsNotifier {
  @override
  Future<List<Subject>> build() async {
    return ref.read(isarServiceProvider).getSubjects();
  }

  Future<void> addSubject(String name, int colorValue, int iconCode) async {
    final subject = Subject()
      ..name = name
      ..colorValue = colorValue
      ..iconCode = iconCode;
    
    await ref.read(isarServiceProvider).saveSubject(subject);
    
    // Refresh list
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(isarServiceProvider).getSubjects());
  }

  Future<void> deleteSubject(int id) async {
    await ref.read(isarServiceProvider).deleteSubject(id);
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(isarServiceProvider).getSubjects());
  }
}

@riverpod
class ChaptersNotifier extends _$ChaptersNotifier {
  @override
  Future<List<Chapter>> build(int subjectId) async {
    return ref.read(isarServiceProvider).getChaptersForSubject(subjectId);
  }

  Future<void> addChapter(String name) async {
    final subjectId = this.subjectId; // From family arguments
    final List<Subject> subjects = await ref.read(isarServiceProvider).getSubjects();
    final subject = subjects.firstWhere((s) => s.id == subjectId);

    final chapter = Chapter()
      ..name = name
      ..subject.value = subject;
    
    await ref.read(isarServiceProvider).saveChapter(chapter);
    
    // Refresh
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(isarServiceProvider).getChaptersForSubject(subjectId));
  }

  Future<void> toggleChapter(int chapterId, bool isCompleted) async {
    final chapters = state.value ?? [];
    final chapter = chapters.firstWhere((c) => c.id == chapterId);
    chapter.isCompleted = isCompleted;
    
    await ref.read(isarServiceProvider).saveChapter(chapter);
    
    // Optimistic update or refresh
    state = AsyncValue.data([...chapters]);
  }
}
