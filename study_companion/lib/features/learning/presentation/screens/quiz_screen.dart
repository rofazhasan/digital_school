import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import '../providers/quiz_provider.dart';

class QuizScreen extends ConsumerStatefulWidget {
  const QuizScreen({super.key});

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  int _currentIndex = 0;
  int _score = 0;
  bool _answered = false;
  int? _selectedOptionIndex;

  void _answer(int index, int correctIndex) {
    if (_answered) return;

    setState(() {
      _answered = true;
      _selectedOptionIndex = index;
      if (index == correctIndex) {
        _score++;
      }
    });
  }

  void _nextQuestion(int totalQuestions) {
    if (_currentIndex < totalQuestions - 1) {
      setState(() {
        _currentIndex++;
        _answered = false;
        _selectedOptionIndex = null;
      });
    } else {
      // Show score dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: const Text('Quiz Complete!'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.emoji_events, size: 64, color: Colors.amber),
              const Gap(16),
              Text(
                'You scored $_score / $totalQuestions',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                context.pop(); // Go back to setup
              },
              child: const Text('Finish'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final questions = ref.read(quizNotifierProvider).value ?? [];

    if (questions.isEmpty) {
      return const Scaffold(
        body: Center(child: Text('No quiz loaded.')),
      );
    }

    final question = questions[_currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: Text('Question ${_currentIndex + 1}/${questions.length}'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            LinearProgressIndicator(
              value: (_currentIndex + 1) / questions.length,
            ),
            const Gap(32),
            Text(
              question.question,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const Gap(32),
            ...List.generate(question.options.length, (index) {
              final isSelected = _selectedOptionIndex == index;
              final isCorrect = index == question.correctIndex;
              
              Color? color;
              if (_answered) {
                if (isCorrect) {
                  color = Colors.green.withOpacity(0.2);
                } else if (isSelected) {
                  color = Colors.red.withOpacity(0.2);
                }
              }

              return Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    backgroundColor: color,
                    padding: const EdgeInsets.all(16),
                    alignment: Alignment.centerLeft,
                    side: BorderSide(
                      color: _answered && (isCorrect || isSelected) 
                          ? (isCorrect ? Colors.green : Colors.red) 
                          : Colors.grey,
                    ),
                  ),
                  onPressed: () => _answer(index, question.correctIndex),
                  child: Text(
                    question.options[index],
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                ),
              );
            }),
            const Spacer(),
            if (_answered) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Explanation:', style: TextStyle(fontWeight: FontWeight.bold)),
                    Text(question.explanation),
                  ],
                ),
              ),
              const Gap(16),
              FilledButton(
                onPressed: () => _nextQuestion(questions.length),
                child: Text(_currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
