import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import '../providers/review_provider.dart';
import '../../data/models/flashcard.dart';

class FlashcardReviewScreen extends ConsumerStatefulWidget {
  const FlashcardReviewScreen({super.key});

  @override
  ConsumerState<FlashcardReviewScreen> createState() => _FlashcardReviewScreenState();
}

class _FlashcardReviewScreenState extends ConsumerState<FlashcardReviewScreen> {
  bool _showAnswer = false;

  @override
  Widget build(BuildContext context) {
    final reviewAsync = ref.watch(reviewNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Review Flashcards'),
      ),
      body: reviewAsync.when(
        data: (cards) {
          if (cards.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.check_circle_outline, size: 80, color: Colors.green),
                  Gap(16),
                  Text('All caught up! No cards due.'),
                ],
              ),
            );
          }

          final card = cards.first;

          return Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Cards due: ${cards.length}',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const Gap(32),
                Expanded(
                  child: Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            card.question,
                            style: Theme.of(context).textTheme.headlineSmall,
                            textAlign: TextAlign.center,
                          ),
                          if (_showAnswer) ...[
                            const Divider(height: 48),
                            Text(
                              card.answer,
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                    color: Theme.of(context).colorScheme.primary,
                                  ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
                const Gap(32),
                if (!_showAnswer)
                  FilledButton(
                    onPressed: () => setState(() => _showAnswer = true),
                    style: FilledButton.styleFrom(padding: const EdgeInsets.all(16)),
                    child: const Text('Show Answer'),
                  )
                else
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _RatingButton(
                        label: 'Again',
                        color: Colors.red,
                        onPressed: () => _rateCard(card, 0),
                      ),
                      _RatingButton(
                        label: 'Hard',
                        color: Colors.orange,
                        onPressed: () => _rateCard(card, 3),
                      ),
                      _RatingButton(
                        label: 'Good',
                        color: Colors.blue,
                        onPressed: () => _rateCard(card, 4),
                      ),
                      _RatingButton(
                        label: 'Easy',
                        color: Colors.green,
                        onPressed: () => _rateCard(card, 5),
                      ),
                    ],
                  ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  void _rateCard(Flashcard card, int quality) {
    ref.read(reviewNotifierProvider.notifier).processReview(card, quality);
    setState(() {
      _showAnswer = false;
    });
  }
}

class _RatingButton extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onPressed;

  const _RatingButton({
    required this.label,
    required this.color,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        FilledButton(
          onPressed: onPressed,
          style: FilledButton.styleFrom(
            backgroundColor: color,
            shape: const CircleBorder(),
            padding: const EdgeInsets.all(20),
          ),
          child: const SizedBox(),
        ),
        const Gap(8),
        Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
