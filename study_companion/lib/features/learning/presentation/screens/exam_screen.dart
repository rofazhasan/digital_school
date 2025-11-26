import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import '../../data/models/quiz_question.dart';
import '../providers/exam_provider.dart';

class ExamScreen extends ConsumerStatefulWidget {
  final String subjectName;
  final List<QuizQuestion> questions;

  const ExamScreen({
    super.key,
    required this.subjectName,
    required this.questions,
  });

  @override
  ConsumerState<ExamScreen> createState() => _ExamScreenState();
}

class _ExamScreenState extends ConsumerState<ExamScreen> {
  int _currentIndex = 0;
  Map<int, int> _answers = {}; // questionIndex -> selectedOptionIndex
  late Timer _timer;
  late int _remainingSeconds;
  bool _submitted = false;

  @override
  void initState() {
    super.initState();
    // 1 minute per question
    _remainingSeconds = widget.questions.length * 60;
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
      } else {
        _submitExam();
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  void _answer(int optionIndex) {
    if (_submitted) return;
    setState(() {
      _answers[_currentIndex] = optionIndex;
    });
  }

  void _submitExam() {
    _timer.cancel();
    setState(() {
      _submitted = true;
    });

    // Calculate score
    int score = 0;
    _answers.forEach((index, answer) {
      if (widget.questions[index].correctIndex == answer) {
        score++;
      }
    });

    // Save result
    ref.read(examNotifierProvider.notifier).saveResult(
          widget.subjectName,
          score,
          widget.questions.length,
          (widget.questions.length * 60) - _remainingSeconds,
        );

    // Show result dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Exam Finished'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.school, size: 64, color: Colors.blue),
            const Gap(16),
            Text(
              'Score: $score / ${widget.questions.length}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const Gap(8),
            Text('Time: ${_formatTime((widget.questions.length * 60) - _remainingSeconds)}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.pop(); // Back to setup
            },
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  String _formatTime(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final question = widget.questions[_currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: Text('Exam: ${widget.subjectName}'),
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(right: 16.0),
              child: Text(
                _formatTime(_remainingSeconds),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.redAccent,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            LinearProgressIndicator(
              value: (_currentIndex + 1) / widget.questions.length,
            ),
            const Gap(8),
            Text(
              'Question ${_currentIndex + 1} of ${widget.questions.length}',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const Gap(24),
            Text(
              question.question,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const Gap(32),
            ...List.generate(question.options.length, (index) {
              final isSelected = _answers[_currentIndex] == index;
              final isCorrect = index == question.correctIndex;
              
              Color? color;
              if (_submitted) {
                 if (isCorrect) color = Colors.green.withOpacity(0.2);
                 else if (isSelected) color = Colors.red.withOpacity(0.2);
              } else if (isSelected) {
                color = Theme.of(context).colorScheme.primaryContainer;
              }

              return Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    backgroundColor: color,
                    padding: const EdgeInsets.all(16),
                    alignment: Alignment.centerLeft,
                  ),
                  onPressed: () => _answer(index),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (_currentIndex > 0)
                  TextButton(
                    onPressed: () => setState(() => _currentIndex--),
                    child: const Text('Previous'),
                  )
                else
                  const SizedBox(),
                if (_currentIndex < widget.questions.length - 1)
                  FilledButton(
                    onPressed: () => setState(() => _currentIndex++),
                    child: const Text('Next'),
                  )
                else if (!_submitted)
                  FilledButton(
                    onPressed: _submitExam,
                    style: FilledButton.styleFrom(backgroundColor: Colors.red),
                    child: const Text('Submit Exam'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
