import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/data/isar_service.dart';

import '../../data/models/flashcard.dart';
import '../../data/datasources/srs_service.dart';

part 'review_provider.g.dart';

@riverpod
class ReviewNotifier extends _$ReviewNotifier {
  @override
  Future<List<Flashcard>> build() async {
    return ref.read(isarServiceProvider).getDueFlashcards();
  }

  Future<void> processReview(Flashcard card, int quality) async {
    final srsService = SRSService();
    final updatedCard = srsService.processReview(card, quality);
    
    await ref.read(isarServiceProvider).updateFlashcard(updatedCard);

    // Remove from current session list
    final currentList = state.value ?? [];
    state = AsyncValue.data(currentList.where((c) => c.id != card.id).toList());
  }
}
