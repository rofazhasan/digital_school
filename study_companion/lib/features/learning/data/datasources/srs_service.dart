import '../models/flashcard.dart';

class SRSService {
  /// Process a flashcard review using the SM-2 algorithm.
  /// 
  /// [quality] is a rating from 0 to 5:
  /// 0 - Complete blackout.
  /// 1 - Incorrect response; the correct one remembered.
  /// 2 - Incorrect response; where the correct one seemed easy to recall.
  /// 3 - Correct response recalled with serious difficulty.
  /// 4 - Correct response after a hesitation.
  /// 5 - Perfect recall.
  Flashcard processReview(Flashcard card, int quality) {
    if (quality < 0 || quality > 5) {
      throw ArgumentError('Quality must be between 0 and 5');
    }

    // 1. Update Ease Factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    double newEaseFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEaseFactor < 1.3) newEaseFactor = 1.3;

    // 2. Update Repetitions & Interval
    int newRepetitions;
    int newInterval;

    if (quality >= 3) {
      // Correct response
      newRepetitions = card.repetitions + 1;
      
      if (newRepetitions == 1) {
        newInterval = 1;
      } else if (newRepetitions == 2) {
        newInterval = 6;
      } else {
        newInterval = (card.interval * newEaseFactor).round();
      }
    } else {
      // Incorrect response
      newRepetitions = 0;
      newInterval = 1;
    }

    // 3. Update Card
    card.easeFactor = newEaseFactor;
    card.repetitions = newRepetitions;
    card.interval = newInterval;
    card.nextReviewDate = DateTime.now().add(Duration(days: newInterval));
    card.updatedAt = DateTime.now();

    return card;
  }
}
