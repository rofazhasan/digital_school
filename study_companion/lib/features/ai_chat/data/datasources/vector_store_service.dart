import 'dart:math';
import '../../../learning/data/models/note.dart';

import 'embedding_service.dart';

class VectorStoreService {
  final EmbeddingService _embeddingService;

  VectorStoreService(this._embeddingService);

  Future<List<Note>> searchNotes(String query, List<Note> allNotes) async {
    if (!_embeddingService.isLoaded) {
      // Fallback to text search if no embedding model
      final lowerQuery = query.toLowerCase();
      return allNotes.where((note) {
        return note.title.toLowerCase().contains(lowerQuery) ||
               note.content.toLowerCase().contains(lowerQuery);
      }).toList();
    }

    // 1. Generate query embedding
    final queryVector = await _embeddingService.getEmbedding(query);
    if (queryVector.isEmpty) return [];

    // 2. Calculate similarities
    final List<MapEntry<Note, double>> scoredNotes = [];

    for (var note in allNotes) {
      if (note.embedding != null && note.embedding!.isNotEmpty) {
        final score = _cosineSimilarity(queryVector, note.embedding!);
        scoredNotes.add(MapEntry(note, score));
      }
    }

    // 3. Sort by score (descending)
    scoredNotes.sort((a, b) => b.value.compareTo(a.value));

    // 4. Return top results (e.g., top 5)
    return scoredNotes.map((e) => e.key).take(5).toList();
  }

  double _cosineSimilarity(List<double> a, List<double> b) {
    if (a.length != b.length) return 0.0;
    
    double dotProduct = 0.0;
    double normA = 0.0;
    double normB = 0.0;

    for (int i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA == 0 || normB == 0) return 0.0;
    return dotProduct / (sqrt(normA) * sqrt(normB));
  }
}
