import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/data/isar_service.dart';
import '../../../ai_chat/presentation/providers/chat_provider.dart';
import '../../../ai_chat/data/datasources/vector_store_service.dart';
import '../../data/models/note.dart';

part 'notes_provider.g.dart';

@riverpod
class NotesNotifier extends _$NotesNotifier {
  @override
  Future<List<Note>> build() async {
    return ref.read(isarServiceProvider).getNotes();
  }

  Future<void> addNote(String title, String content) async {
    final embeddingService = ref.read(embeddingServiceProvider);
    
    // Generate embedding
    List<double>? embedding;
    if (embeddingService.isLoaded) {
      embedding = await embeddingService.getEmbedding('$title\n$content');
    }

    final note = Note()
      ..title = title
      ..content = content
      ..embedding = embedding
      ..createdAt = DateTime.now()
      ..updatedAt = DateTime.now();
    
    await ref.read(isarServiceProvider).saveNote(note);
    
    // Refresh the list
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(isarServiceProvider).getNotes());
  }

  Future<void> search(String query) async {
    if (query.isEmpty) {
      // Reset to all notes
      state = const AsyncValue.loading();
      state = await AsyncValue.guard(() => ref.read(isarServiceProvider).getNotes());
      return;
    }

    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final allNotes = await ref.read(isarServiceProvider).getNotes();
      final embeddingService = ref.read(embeddingServiceProvider);
      final vectorStore = VectorStoreService(embeddingService);
      
      return vectorStore.searchNotes(query, allNotes);
    });
  }

  Future<void> deleteNote(int id) async {
    await ref.read(isarServiceProvider).deleteNote(id);
    
    // Refresh the list
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(isarServiceProvider).getNotes());
  }
}
